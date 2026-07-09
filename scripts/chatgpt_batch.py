#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
chatgpt_batch.py — ChatGPT 웹 UI를 자동으로 조작해 프롬프트 큐를 순차 처리한다.

목표:
  - scripts/chatgpt_commands.txt 의 프롬프트를 하나씩 전송
  - "이전 응답 생성 완료"를 감지한 뒤에야 다음 프롬프트를 전송 (chaining)
  - 각 응답을 scripts/chatgpt_output/NNN.md 로 저장

접속 방식(중요):
  - Playwright가 자체 브라우저를 띄우면(launch) 봇 감지에 걸리기 쉬우므로,
    사용자가 직접 원격 디버깅으로 띄운 "실제 Chrome"에 CDP로 연결(connect_over_cdp)한다.
  - 로그인/캡차 자동화가 불필요하고 감지 위험이 크게 낮아진다.

⚠️ ChatGPT 웹 UI 자동화는 OpenAI 약관상 계정 정지 위험이 있다.
   사람처럼 느리게, 소량씩 돌릴 것. (딜레이/타이핑 지연이 기본 내장)

사전 준비 (Edge 사용 시 — 이미 Edge에 로그인해 둔 경우):
  1) pip install playwright
  2) ★ 모든 Edge 창을 완전히 종료 ★ 후, 기존 프로필 그대로 원격 디버깅으로 재실행
     (PowerShell):
       Start-Process msedge -ArgumentList '--remote-debugging-port=9222'
     → 기존 로그인/대화가 그대로 유지된 채 디버깅 포트만 열린다.
  3) 열린 Edge에서 사용할 ChatGPT 대화 탭을 띄워둔다(로그인 상태 확인).
  4) scripts/chatgpt_commands.txt 에 프롬프트 작성 ('---' 단독 줄로 여러 프롬프트 구분)

  (Chrome을 쓸 경우도 동일: 모든 Chrome 종료 후
     chrome.exe --remote-debugging-port=9222   로 실행)

사용법:
  python scripts/chatgpt_batch.py
  python scripts/chatgpt_batch.py --limit 3      # 앞 3개만 (스모크 테스트)
  python scripts/chatgpt_batch.py --port 9222
  python scripts/chatgpt_batch.py --url https://chatgpt.com/c/xxxx  # 특정 대화 지정
"""
import argparse
import os
import random
import sys
import time
from datetime import datetime

# Windows 콘솔(cp949)에서도 안전하게 출력
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout
except ImportError:
    print("[!] playwright 가 설치되어 있지 않습니다. 먼저 실행:  pip install playwright")
    sys.exit(1)


# ─────────────────────────────────────────────────────────────
# CONFIG — ChatGPT UI가 바뀌면 여기 셀렉터만 고치면 된다.
# ─────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
COMMANDS_FILE = os.path.join(SCRIPT_DIR, "chatgpt_commands.txt")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "chatgpt_output")
LOG_FILE = os.path.join(OUTPUT_DIR, "run.log")

CDP_PORT = 9222              # 원격 디버깅 포트 (--port 로 덮어쓰기 가능)
PROMPT_DELIMITER = "---"     # 큐 파일에서 프롬프트를 나누는 단독 줄

# 셀렉터 (2026 기준. UI 변경 시 개발자도구로 재확인)
SEL_INPUT = "#prompt-textarea"                       # 입력창 (contenteditable)
SEL_SEND = '[data-testid="send-button"]'             # 전송 버튼
SEL_STOP = '[data-testid="stop-button"]'             # "생성 중지" 버튼
SEL_ASSISTANT = '[data-message-author-role="assistant"]'  # assistant 메시지

# 타이밍
TYPE_DELAY_MS = 35           # 글자당 타이핑 지연(사람처럼)
STOP_APPEAR_TIMEOUT = 20     # 전송 후 '중지 버튼' 나타남 대기(초)
GEN_TIMEOUT = 300            # 한 응답 최대 생성 대기(초) — 이미지 생성은 김
STABLE_SECONDS = 3.0         # 응답(텍스트/이미지 signature)이 이만큼 안 변하면 완료
STOP_GONE_CONFIRM = 2.5      # '중지 버튼'이 이만큼 계속 사라져 있으면 생성 종료로 확정
POLL_INTERVAL = 0.5          # 폴링 주기(초)
BETWEEN_MIN, BETWEEN_MAX = 6, 14   # 프롬프트 사이 랜덤 대기(초)


def log(msg: str):
    line = f"[{datetime.now().strftime('%H:%M:%S')}] {msg}"
    print(line)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass


def load_prompts(path: str):
    """큐 파일을 읽어 프롬프트 리스트로 변환. '---' 단독 줄로 블록 구분."""
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        raw = f.read()
    blocks, cur = [], []
    for line in raw.splitlines():
        if line.strip() == PROMPT_DELIMITER:
            block = "\n".join(cur).strip()
            if block:
                blocks.append(block)
            cur = []
        elif line.strip().startswith("#") and not cur:
            # 블록 시작 위치의 주석 줄은 무시 (블록 중간 '#'는 보존)
            continue
        else:
            cur.append(line)
    tail = "\n".join(cur).strip()
    if tail:
        blocks.append(tail)
    return blocks


def find_chatgpt_page(browser, target_url: str = ""):
    """열려 있는 탭 중 ChatGPT 페이지를 찾는다. target_url 이 있으면 그 탭을 우선."""
    chatgpt_pages = []
    for ctx in browser.contexts:
        for pg in ctx.pages:
            url = pg.url or ""
            if "chatgpt.com" in url or "chat.openai.com" in url:
                if target_url and target_url in url:
                    return pg
                chatgpt_pages.append(pg)
    return chatgpt_pages[0] if chatgpt_pages else None


def type_human(page, text: str):
    """멀티라인 프롬프트를 사람처럼 타이핑. 줄바꿈은 Shift+Enter(전송 아님)."""
    for i, line in enumerate(text.split("\n")):
        if i > 0:
            page.keyboard.press("Shift+Enter")
        if line:
            page.keyboard.type(line, delay=TYPE_DELAY_MS)


def send_prompt(page, text: str):
    inp = page.locator(SEL_INPUT).first
    inp.click()
    time.sleep(0.3)
    type_human(page, text)
    time.sleep(0.4)
    # 전송: 버튼이 있으면 클릭, 없으면 Enter
    try:
        btn = page.locator(SEL_SEND).first
        if btn.count() > 0 and btn.is_enabled():
            btn.click()
        else:
            page.keyboard.press("Enter")
    except Exception:
        page.keyboard.press("Enter")


def read_last_response(page) -> str:
    loc = page.locator(SEL_ASSISTANT)
    if loc.count() == 0:
        return ""
    try:
        return loc.last.inner_text().strip()
    except Exception:
        return ""


def last_image_srcs(page):
    """마지막 assistant 메시지에 포함된 이미지 src 목록(생성 결과 이미지)."""
    loc = page.locator(SEL_ASSISTANT)
    if loc.count() == 0:
        return []
    try:
        imgs = loc.last.locator("img")
        out = []
        for i in range(imgs.count()):
            src = imgs.nth(i).get_attribute("src") or ""
            if src and not src.startswith("data:"):
                out.append(src)
        return out
    except Exception:
        return []


def last_signature(page) -> str:
    """마지막 assistant 메시지의 '상태 지문': 텍스트 + 이미지 개수/src.
    이미지 응답은 텍스트가 비어도 img가 생기고 src가 바뀌므로 이걸로 안정화를 감지."""
    loc = page.locator(SEL_ASSISTANT)
    if loc.count() == 0:
        return ""
    try:
        last = loc.last
        text = last.inner_text().strip()
        imgs = last.locator("img")
        n = imgs.count()
        srcs = []
        for i in range(n):
            try:
                srcs.append(imgs.nth(i).get_attribute("src") or "")
            except Exception:
                srcs.append("")
        # blob:/data: 로딩 중 src가 계속 바뀌므로 완성 src(파일/oaiusercontent 등)까지 포함
        return f"{len(text)}|{n}|{'::'.join(srcs)}"
    except Exception:
        return ""


def wait_until_complete(page) -> bool:
    """
    완료 감지(주 신호 = 중지 버튼, 보조 = 출력 안정화):
      (a) '중지 버튼'이 떴다가(STOP_GONE_CONFIRM 동안) 계속 사라져 있으면 종료 확정
      (b) 중지 버튼을 못 본 짧은 응답은, 출력 지문이 STABLE_SECONDS 동안 불변이면 완료
    이미지 생성처럼 텍스트가 없는 응답도 (a)로 잡힌다. 타임아웃 시 False.
    """
    start = time.time()

    # (0) 생성 시작 감지: 중지 버튼이 뜨는지
    stop_seen = False
    t0 = time.time()
    while time.time() - t0 < STOP_APPEAR_TIMEOUT:
        try:
            if page.locator(SEL_STOP).count() > 0:
                stop_seen = True
                break
        except Exception:
            pass
        time.sleep(0.3)

    last_sig = ""
    sig_stable_since = None
    stop_gone_since = None

    while time.time() - start < GEN_TIMEOUT:
        try:
            stop_present = page.locator(SEL_STOP).count() > 0
        except Exception:
            stop_present = False

        # 출력 지문 안정화 추적
        sig = last_signature(page)
        if sig != last_sig:
            last_sig = sig
            sig_stable_since = None
        elif sig_stable_since is None:
            sig_stable_since = time.time()
        sig_stable = sig_stable_since is not None and (time.time() - sig_stable_since) >= STABLE_SECONDS

        # (a) 주 신호: 중지 버튼이 떴었고, 지금은 계속 사라져 있음
        if stop_seen:
            if not stop_present:
                if stop_gone_since is None:
                    stop_gone_since = time.time()
                if (time.time() - stop_gone_since) >= STOP_GONE_CONFIRM and sig_stable:
                    return True
            else:
                stop_gone_since = None
        else:
            # (b) 보조: 중지 버튼을 못 본 매우 짧은 응답 — 지문만으로 판단
            if sig_stable and last_sig and last_sig != "0|0|":
                return True

        time.sleep(POLL_INTERVAL)

    log("  [!] 완료 감지 타임아웃")
    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=CDP_PORT, help="브라우저 원격 디버깅 포트")
    ap.add_argument("--limit", type=int, default=0, help="앞 N개만 처리(0=전체)")
    ap.add_argument("--url", default="", help="사용할 ChatGPT 대화 URL(해당 탭 우선/없으면 이동)")
    args = ap.parse_args()

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    prompts = load_prompts(COMMANDS_FILE)
    if not prompts:
        log(f"[!] 처리할 프롬프트가 없습니다: {COMMANDS_FILE}")
        return
    if args.limit > 0:
        prompts = prompts[: args.limit]
    log(f"[*] 프롬프트 {len(prompts)}개 로드")

    with sync_playwright() as p:
        try:
            browser = p.chromium.connect_over_cdp(f"http://localhost:{args.port}")
        except Exception as e:
            log(f"[!] Chrome(CDP :{args.port}) 연결 실패: {e}")
            log("    → 모든 Chrome 종료 후 아래로 실행했는지 확인:")
            log('      chrome.exe --remote-debugging-port=9222 --user-data-dir="C:\\chrome-debug"')
            return

        page = find_chatgpt_page(browser, args.url)
        if page is None:
            if args.url:
                # ChatGPT 탭이 없으면 아무 탭이나 잡아 지정 URL로 이동
                any_page = None
                for ctx in browser.contexts:
                    if ctx.pages:
                        any_page = ctx.pages[0]
                        break
                if any_page is None:
                    log("[!] 열린 탭이 없습니다. 브라우저에서 탭을 하나 열어주세요.")
                    return
                page = any_page
                log(f"[*] 지정 URL로 이동: {args.url}")
                page.goto(args.url, wait_until="domcontentloaded")
            else:
                log("[!] ChatGPT 탭을 찾지 못했습니다. 해당 브라우저에서 chatgpt.com 을 열고 로그인하세요.")
                return
        elif args.url and args.url not in (page.url or ""):
            log(f"[*] 지정 URL로 이동: {args.url}")
            page.goto(args.url, wait_until="domcontentloaded")

        page.bring_to_front()
        time.sleep(1.0)
        log(f"[*] ChatGPT 탭 연결됨: {page.url}")

        # 로그인/차단 페이지 감지
        if "auth" in (page.url or "") or "login" in (page.url or ""):
            log("[!] 로그인 페이지로 보입니다. 브라우저에서 먼저 로그인하세요.")
            return

        ok_count = 0
        for idx, prompt in enumerate(prompts, start=1):
            preview = prompt.replace("\n", " ")[:50]
            log(f"[{idx}/{len(prompts)}] 전송: {preview}...")
            try:
                send_prompt(page, prompt)
            except Exception as e:
                log(f"  [!] 전송 실패: {e}")
                continue

            done = wait_until_complete(page)
            response = read_last_response(page)
            images = last_image_srcs(page)

            out_path = os.path.join(OUTPUT_DIR, f"{idx:03d}.md")
            with open(out_path, "w", encoding="utf-8") as f:
                f.write(f"# Prompt {idx}\n\n{prompt}\n\n---\n\n# Response\n\n{response}\n")
                if images:
                    f.write("\n## Images\n\n")
                    for u in images:
                        f.write(f"- {u}\n")

            if done:
                ok_count += 1
                log(f"  [✓] 저장: {out_path}  (텍스트 {len(response)}자, 이미지 {len(images)}개)")
            else:
                log(f"  [!] 미완료(타임아웃)로 저장됨: {out_path}")

            if idx < len(prompts):
                wait = random.uniform(BETWEEN_MIN, BETWEEN_MAX)
                log(f"  … {wait:.1f}초 대기 후 다음")
                time.sleep(wait)

        log(f"[*] 완료: {ok_count}/{len(prompts)} 성공. 결과 폴더: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
