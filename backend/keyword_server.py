# backend/keyword_server.py
# ------------------------------------------------------------
# Monkey Flask Server (Port: 5001)
# 역할:
# 1) /reading : 꿈 전문 하나로 종합 해몽 + 오늘의 한마디 + 카테고리 해몽(OpenAI 1회)
# 2) /health  : 헬스체크
# ------------------------------------------------------------

import os
import json
import re
import requests
from typing import Tuple

from flask import Flask, request, jsonify
from dotenv import load_dotenv

# konlpy는 Java/JVM 환경 필요 (이미 구성되어 있다고 가정)
from konlpy.tag import Okt

# 전통 해몽 상징 사전(경량 RAG) — 매칭된 상징 의미를 /interpret 근거로 주입
import dream_lexicon

# /reading 응답 검증(순수 함수). 네트워크를 타지 않으므로 단위 테스트가 가능하다.
import reading_schema


# =========================
# 0) 기본 설정
# =========================

app = Flask(__name__)

# backend/.env 읽기 (여기에 OPENAI_API_KEY만 넣는 것을 추천)
# 예: backend/.env
# OPENAI_API_KEY=sk-xxxx
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()

# GPT 모델 (원하시면 여기만 바꿔도 되게 상수로 고정)
# gpt-4o-mini: gpt-3.5 대비 한국어 표현력이 크게 좋아 번역투가 거의 사라진다(비용도 저렴).
CHAT_MODEL = "gpt-4o-mini"

okt = Okt()

# 비정상적으로 긴 요청으로 인한 OpenAI 비용 폭증을 막기 위한 입력 길이 상한
MAX_TEXT_LENGTH = 2000

# ------------------------------------------------------------
# 해몽가(점술가) 페르소나 — 모든 해몽 응답의 어조를 지배하는 시스템 프롬프트
# 목표: "기계적인 AI 답변"이 아니라, 오래 이 일을 해 온 해몽가가
#       상담자 앞에서 나직이 풀어내는 듯한 호소력 있는 어조.
# 지킬 것: 전통 한국 해몽에 뿌리, 상담자에게 '당신'으로 직접 말함,
#         단정적 미래 예언/공포 조장 금지(가능성·기운으로 말함), 심리학 용어 남발 금지.
# ------------------------------------------------------------
PERSONA_SYSTEM = (
    "당신은 오랜 세월 꿈을 풀어 온 한국의 해몽가입니다. "
    "지금 한 사람이 자신의 꿈을 들고 당신 앞에 앉아 있습니다.\n"
    "말투 규칙:\n"
    "1) 상담자에게 '당신'이라 부르며, 마주 앉아 나직이 들려주듯 따뜻하고 진중하게 말한다.\n"
    "2) 전통 한국 해몽의 상징 풀이에 뿌리를 두되, 교과서적 나열이 아니라 하나의 이야기로 엮어 들려준다.\n"
    "3) '~로 보입니다', '~한 기운이 감돕니다', '옛사람들은 이런 꿈을 ~라 여겼지요' 같은 해몽가의 어조를 쓴다.\n"
    "4) 단정적인 미래 예언이나 불안·공포를 조장하는 말은 하지 않는다. 길흉은 '가능성'과 '기운'으로 담담히 짚는다.\n"
    "5) 심리학·서양식 꿈해석 용어(무의식·트라우마·에너지·정화·내면아이 등)를 절대 쓰지 않는다. "
    "정서는 오직 전통 옛말과 상징의 언어로 풀어낸다.\n"
    "6) 과장·미신적 위협·상술 문구를 쓰지 않는다. 담백하되 마음에 남는 문장으로.\n"
    "7) 해몽의 상징 의미는 반드시 '전통 한국 민속 해몽'을 따른다. 근거로 [전통 해몽 근거]가 주어지면 "
    "그 의미를 최우선으로 적용하고, 그와 어긋나는 서양식·현대식 재해석을 하지 않는다.\n"
    "8) 자연스러운 한국어로 말한다. 번역투(영어 문장을 옮긴 듯한 어색한 표현), 딱딱한 문어체, "
    "어색한 조사·어미를 쓰지 않는다. 실제 한국 사람이 마주 앉아 말하듯 매끄럽고 자연스럽게 쓴다.\n"
    "9) 추상적으로만 읊지 않는다. 상징이 상담자의 '실제 삶'(일·관계·돈·건강·마음)에서 "
    "구체적으로 무엇을 뜻하는지, 손에 잡히는 일상의 언어로 분명하게 짚어 준다."
)


# /reading 전용 지시. PERSONA_SYSTEM 뒤에 붙어 출력 형식을 규정한다.
# OpenAI JSON 모드는 메시지에 "json"이라는 단어가 있어야 동작한다.
READING_INSTRUCTION = (
    "아래 형식의 JSON 하나만 출력하세요. 다른 텍스트는 붙이지 마세요.\n"
    "{\n"
    '  "summary": "종합 해몽",\n'
    '  "oneLine": "오늘의 한마디",\n'
    '  "categories": [ { "key": "...", "body": "..." } ]\n'
    "}\n\n"
    "규칙:\n"
    "- summary: 꿈 전체를 하나의 이야기로 엮은 종합 해몽. 8~12문장으로 충분히 풀어 쓴다. "
    "장면을 순서대로 짚어가며 각 상징이 무슨 뜻인지, 그것이 상담자의 실제 삶에서 "
    "어떻게 나타날 수 있는지까지 이야기하듯 이어 준다.\n"
    "- oneLine: 오늘 하루 마음에 품을 말 한 문장.\n"
    "- categories: key는 반드시 다음 중에서만 고른다 — "
    "luck(행운), caution(주의운), relationship(인간관계), wealth(재물운), "
    "work(직장·학업운), health(건강운).\n"
    "- **꿈에 실제 근거가 있는 것만 2~4개** 고른다. 근거가 없으면 그 항목을 넣지 않는다. "
    "칸을 채우려고 없는 이야기를 지어내지 않는다.\n"
    "- 각 body는 **반드시 4문장 이상 6문장 이하**로 쓴다. 세 문장으로 끝내지 않는다. "
    "(1) 꿈의 어느 대목에서 그렇게 읽히는지 근거를 짚고, (2) 그것이 상담자의 실제 생활에서 "
    "어떤 모습으로 나타날 수 있는지 그려 보이고, (3) 앞으로 어떻게 하면 좋을지 손에 잡히는 "
    "조언까지 담는다.\n"
    "- **body는 summary에서 이미 한 이야기를 되풀이하지 않는다.** summary가 꿈 전체의 흐름을 "
    "말한다면, body는 그 항목에 해당하는 이야기만 한 걸음 더 깊이 들어간다. "
    "카테고리끼리도 같은 말을 나눠 쓰지 않는다.\n"
    "- **분량을 채우려고 같은 말을 바꿔 쓰거나 늘어놓지 않는다.** 할 이야기가 남아 있을 때만 "
    "길게 쓰고, 꿈에 근거가 없으면 짧게 끝내는 편이 낫다.\n"
    "- 제목·이모지·마크다운 기호를 body 안에 넣지 않는다. 본문 문장만 쓴다.\n"
    "- 같은 key를 두 번 쓰지 않는다."
)


# =========================
# 1) 비용 계산 (최신 단가 기준)
# =========================
# gpt-4o-mini: Input $0.15 / 1M, Output $0.60 / 1M
#
# ※ 문서 기반 단가 (프로젝트/계정/지역에 따라 변동 가능)
#    모델/단가 변경되면 여기만 바꾸면 됨.
CHAT_IN_PER_TOKEN = 0.15 / 1_000_000
CHAT_OUT_PER_TOKEN = 0.60 / 1_000_000


# =========================
# 2) 공용 유틸
# =========================

def require_key():
    """OpenAI 키가 없으면 서버에서 OpenAI 호출이 불가능하므로 500 반환"""
    if not OPENAI_API_KEY:
        return jsonify({"error": "OPENAI_API_KEY is missing on server (backend/.env)"}), 500
    return None


def check_text_length(text: str):
    """비정상적으로 긴 입력을 차단(OpenAI 비용 폭증 방지). 문제 없으면 None."""
    if len(text) > MAX_TEXT_LENGTH:
        return jsonify({"error": f"text is too long (max {MAX_TEXT_LENGTH} chars)"}), 400
    return None


def normalize_sentence(text: str) -> str:
    """
    문장 정규화(간단 버전)
    - 앞뒤 공백 제거
    - 연속 공백 1칸으로
    - 쓸데없는 따옴표/특수문자 일부 제거
    """
    t = (text or "").strip()
    t = re.sub(r"\s+", " ", t)

    # 너무 과한 정규화는 의미를 훼손할 수 있어서 "최소한"만 함
    t = t.replace("“", '"').replace("”", '"').replace("’", "'").replace("‘", "'")
    t = t.strip(" \"'")

    return t


# =========================
# 3) OpenAI 호출 래퍼
# =========================

def openai_chat(
    messages: list,
    model: str = CHAT_MODEL,
    temperature: float = 0.7,
    response_format: dict = None,
) -> Tuple[str, int, int, float]:
    """
    OpenAI Chat Completions 호출
    반환: (result_text, input_tokens, output_tokens, total_cost_usd)
    """
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
    }
    if response_format is not None:
        payload["response_format"] = response_format

    r = requests.post(url, headers=headers, json=payload, timeout=60)
    r.raise_for_status()
    data = r.json()

    text = (data.get("choices", [{}])[0].get("message", {}) or {}).get("content", "").strip()
    usage = data.get("usage", {}) or {}
    in_tok = int(usage.get("prompt_tokens", 0) or 0)
    out_tok = int(usage.get("completion_tokens", 0) or 0)

    total_cost = (in_tok * CHAT_IN_PER_TOKEN) + (out_tok * CHAT_OUT_PER_TOKEN)
    return text, in_tok, out_tok, total_cost


# =========================
# 4) API: /reading  (단일 호출 해몽)
# =========================

@app.post("/reading")
def reading():
    """
    입력: { "text": "<꿈 전문>" }
    출력: { summary, oneLine, categories[], symbols[], inputToken, outputToken, totalCostUsd }

    기존 /split + /interpret×N + /summary 를 한 번의 GPT 호출로 대체한다.
    프로필은 받지 않는다(기기 밖으로 나가는 것은 꿈 텍스트뿐).
    """
    chk = require_key()
    if chk:
        return chk

    body = request.get_json(silent=True) or {}
    text = normalize_sentence(body.get("text") or "")

    if not text:
        return jsonify({"error": "text is required"}), 400

    too_long = check_text_length(text)
    if too_long:
        return too_long

    # 전통 해몽 사전 매칭은 꿈 전문에 대해 1회만 수행한다.
    matched = dream_lexicon.match_symbols(text, okt, normalize_sentence)
    grounding = dream_lexicon.build_grounding_block(matched)

    if grounding:
        grounding_section = (
            "\n\n[전통 해몽 근거] (아래 상징 의미를 반드시 최우선으로 적용하세요)\n"
            f"{grounding}\n"
            "위 근거에 없는 요소(고유명사·현대 사물 등)는 무리하게 상징으로 풀지 말고 "
            "장면의 배경으로 담담히 다뤄 주세요."
        )
    else:
        grounding_section = (
            "\n\n(이 꿈에는 전통 해몽 사전에 등재된 상징이 뚜렷하지 않습니다. "
            "상징을 억지로 지어내지 말고, 꿈의 정서와 분위기를 전통 어조로 담백하게 풀어 주세요.)"
        )

    messages = [
        {"role": "system", "content": PERSONA_SYSTEM + "\n\n" + READING_INSTRUCTION},
        {
            "role": "user",
            "content": (
                f'상담자가 들려준 꿈: "{text}"\n'
                "이 꿈을 전통 해몽으로 풀어 주세요."
                f"{grounding_section}"
            ),
        },
    ]

    try:
        raw_text, in_tok, out_tok, cost = openai_chat(
            messages,
            model=CHAT_MODEL,
            temperature=0.65,
            response_format={"type": "json_object"},
        )
        parsed = json.loads(raw_text)
        result = reading_schema.normalize_reading(parsed)
    except reading_schema.ReadingValidationError as e:
        return jsonify({"error": f"invalid reading: {e}"}), 500
    except json.JSONDecodeError as e:
        return jsonify({"error": f"json parse failed: {e}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({
        "summary": result["summary"],
        "oneLine": result["oneLine"],
        "categories": result["categories"],
        # 상징은 모델이 아니라 사전 매칭에서 가져온다(결정적·무료).
        "symbols": dream_lexicon.matched_headwords(matched),
        "inputToken": in_tok,
        "outputToken": out_tok,
        "totalCostUsd": cost,
    })


# =========================
# 5) 헬스체크 (호스트 워밍업/모니터링용)
# =========================
@app.get("/health")
def health():
    # Okt(JVM)까지 로드되어 실제 요청을 받을 준비가 됐는지 확인
    return jsonify({"ok": True})


# =========================
# 6) 서버 실행
# =========================
# 프로덕션(컨테이너)에서는 gunicorn이 `keyword_server:app`을 직접 구동하므로
# 아래 app.run 블록은 로컬 개발 실행 전용이다.
if __name__ == "__main__":
    # 포트: 호스트가 주입하는 PORT 환경변수를 우선 사용(없으면 로컬 기본 5001).
    # host=0.0.0.0 로 해야 폰/에뮬레이터/컨테이너 외부에서 접근 가능.
    # debug 모드는 예외 발생 시 스택트레이스를 그대로 노출하므로 기본은 off,
    # 필요할 때만 FLASK_DEBUG=1 로 켠다.
    port = int(os.getenv("PORT", "5001"))
    debug_mode = os.getenv("FLASK_DEBUG", "0") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
