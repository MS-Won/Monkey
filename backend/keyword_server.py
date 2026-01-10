# backend/keyword_server.py
# ------------------------------------------------------------
# Monkey Flask Server (Port: 5001)
# 역할:
# 1) /split   : konlpy(Okt)로 동사 개수 체크 후, 필요 시 GPT로 의미 단위 분리
# 2) /embed   : 임베딩 생성(OpenAI) - 프론트는 서버만 호출
# 3) /interpret: 문장 1개 전통 해몽(OpenAI)
# 4) /summary : 문장별 해몽들을 종합 요약(OpenAI)
# ------------------------------------------------------------

import os
import json
import re
import requests
from typing import List, Tuple

from flask import Flask, request, jsonify
from dotenv import load_dotenv

# konlpy는 Java/JVM 환경 필요 (이미 구성되어 있다고 가정)
from konlpy.tag import Okt


# =========================
# 0) 기본 설정
# =========================

app = Flask(__name__)

# backend/.env 읽기 (여기에 OPENAI_API_KEY만 넣는 것을 추천)
# 예: backend/.env
# OPENAI_API_KEY=sk-xxxx
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()

# GPT/Embedding 모델 (원하시면 여기만 바꿔도 되게 상수로 고정)
CHAT_MODEL = "gpt-3.5-turbo"
EMBED_MODEL = "text-embedding-3-small"

okt = Okt()

# “해몽 대상에서 제외”할 메타 문장 블랙리스트(서버 하드 필터)
# (필요하면 계속 추가)
BLACKLIST_PHRASES = [
    "꿈을 깨다",
    "잠에서 깨다",
    "눈을 뜨다",
    "깨어나다",
    "알람이 울리다",
    "현실로 돌아오다",
]

# 분리 판단 기준: 동사 개수 >= 2 이면 GPT 분리
VERB_SPLIT_THRESHOLD = 2


# =========================
# 1) 비용 계산 (최신 단가 기준)
# =========================
# GPT-3.5 Turbo: Input $0.50 / 1M, Output $1.50 / 1M
# Embedding 3-small: $0.02 / 1M
#
# ※ 문서 기반 단가 (프로젝트/계정/지역에 따라 변동 가능)
#    단가 변경되면 여기만 바꾸면 됨.
GPT35_IN_PER_TOKEN = 0.50 / 1_000_000
GPT35_OUT_PER_TOKEN = 1.50 / 1_000_000
EMB_IN_PER_TOKEN = 0.02 / 1_000_000


# =========================
# 2) 공용 유틸
# =========================

def require_key():
    """OpenAI 키가 없으면 서버에서 OpenAI 호출이 불가능하므로 500 반환"""
    if not OPENAI_API_KEY:
        return jsonify({"error": "OPENAI_API_KEY is missing on server (backend/.env)"}), 500
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


def is_interpretation_target(text: str) -> bool:
    """
    해몽 대상 문장인지 판단
    - 너무 짧으면 제외
    - 블랙리스트 문구가 들어가면 제외
    """
    t = normalize_sentence(text)
    if len(t) < 3:
        return False

    for phrase in BLACKLIST_PHRASES:
        if phrase in t:
            return False

    return True


def count_verbs_korean(text: str) -> int:
    """
    Okt 품사 태깅으로 '동사(Verb)' 개수 카운트
    - Okt.pos() 결과에서 품사가 'Verb' 인 토큰 수
    """
    t = normalize_sentence(text)
    if not t:
        return 0

    # norm/stem을 켜면 표제어화(원형화)에 유리할 때가 있음
    tokens = okt.pos(t, norm=True, stem=True)
    verb_count = sum(1 for _, pos in tokens if pos == "Verb")
    return verb_count


def unique_keep_order(items: List[str]) -> List[str]:
    """중복 제거 + 순서 유지"""
    seen = set()
    out = []
    for x in items:
        if x in seen:
            continue
        seen.add(x)
        out.append(x)
    return out


# =========================
# 3) OpenAI 호출 래퍼
# =========================

def openai_chat(messages: list, model: str = CHAT_MODEL, temperature: float = 0.7) -> Tuple[str, int, int, float]:
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

    r = requests.post(url, headers=headers, json=payload, timeout=60)
    r.raise_for_status()
    data = r.json()

    text = (data.get("choices", [{}])[0].get("message", {}) or {}).get("content", "").strip()
    usage = data.get("usage", {}) or {}
    in_tok = int(usage.get("prompt_tokens", 0) or 0)
    out_tok = int(usage.get("completion_tokens", 0) or 0)

    total_cost = (in_tok * GPT35_IN_PER_TOKEN) + (out_tok * GPT35_OUT_PER_TOKEN)
    return text, in_tok, out_tok, total_cost


def openai_embed(text: str, model: str = EMBED_MODEL) -> Tuple[List[float], int, float]:
    """
    OpenAI Embeddings 호출
    반환: (embedding_vector, input_tokens, total_cost_usd)
    """
    url = "https://api.openai.com/v1/embeddings"
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "input": text,
    }

    r = requests.post(url, headers=headers, json=payload, timeout=60)
    r.raise_for_status()
    data = r.json()

    embedding = (((data.get("data") or [])[0] or {}).get("embedding")) or []
    usage = data.get("usage") or {}
    in_tok = int(usage.get("prompt_tokens", 0) or 0)

    total_cost = in_tok * EMB_IN_PER_TOKEN
    return embedding, in_tok, total_cost


# =========================
# 4) GPT 문장 분리 (/split에서 사용)
# =========================

def gpt_split_to_json_array(text: str) -> List[str]:
    """
    GPT에게 '의미 단위 문장 분리'를 요청하고,
    반드시 JSON 배열로만 반환받아 파싱한다.

    실패하면 fallback으로 [원문] 반환
    """
    messages = [
        {
            "role": "system",
            "content": (
                "너는 한국어 문장을 '꿈의 사건(행동) 단위'로 분리하는 도우미다.\n"
                "절대 해몽하지 말고, 오직 문장 분리만 하라.\n"
                "출력은 반드시 JSON 배열만 출력하라. (예: [\"...\", \"...\"])\n"
                "추가 설명/텍스트/코드블록 금지."
            )
        },
        {
            "role": "user",
            "content": (
                "다음 꿈 내용을 사건 단위로 분리해줘.\n"
                "- 표준어로 다듬되 의미는 유지\n"
                "- 고유명사는 가능하면 상위 개념으로(예: '민섭'→'지인')\n"
                "- 각 항목은 짧고 명확한 한 문장\n"
                "- 결과는 JSON 배열만\n\n"
                f"꿈 내용: {text}"
            )
        }
    ]

    try:
        raw, _, _, _ = openai_chat(messages, temperature=0.2)

        # GPT가 가끔 ```json ...``` 으로 감싸는 경우 대비
        cleaned = raw.strip()
        cleaned = re.sub(r"^```json\s*", "", cleaned)
        cleaned = re.sub(r"^```\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

        arr = json.loads(cleaned)

        if not isinstance(arr, list):
            return [text]

        # 문자열만 남기고 정규화
        out = []
        for item in arr:
            if isinstance(item, str):
                out.append(normalize_sentence(item))
        return out if out else [text]

    except Exception:
        return [text]


# =========================
# 5) API: /split
# =========================

@app.post("/split")
def split():
    """
    입력: { "text": "..." }
    출력: {
      "sentences": [ ... ],
      "usedGPT": true/false,
      "removed": [ ... ]   # 필터링으로 제거된 문장들(디버그용)
    }
    """
    body = request.get_json(silent=True) or {}
    text = normalize_sentence(body.get("text") or "")

    if not text:
        return jsonify({"error": "text is required"}), 400

    # 1) 동사 개수로 GPT 분리 여부 결정
    verb_count = count_verbs_korean(text)
    used_gpt = False

    # 2) 분리 수행
    if verb_count >= VERB_SPLIT_THRESHOLD:
        # GPT 분리는 OpenAI 키가 필요함
        # 키가 없으면 fallback(원문 그대로)
        if OPENAI_API_KEY:
            sentences = gpt_split_to_json_array(text)
            used_gpt = True
        else:
            sentences = [text]
            used_gpt = False
    else:
        sentences = [text]

    # 3) 정규화 + 해몽 대상 필터(메타문장 제거)
    removed = []
    filtered = []
    for s in sentences:
        ns = normalize_sentence(s)
        if not ns:
            continue
        if is_interpretation_target(ns):
            filtered.append(ns)
        else:
            removed.append(ns)

    # 4) 중복 제거
    filtered = unique_keep_order(filtered)

    return jsonify({
        "sentences": filtered,
        "usedGPT": used_gpt,
        "removed": removed
    })


# =========================
# 6) API: /embed
# =========================

@app.post("/embed")
def embed():
    """
    입력: { "text": "..." }
    출력: { "embedding": [...], "inputToken": n, "totalCostUsd": x }
    """
    chk = require_key()
    if chk:
        return chk

    body = request.get_json(silent=True) or {}
    text = normalize_sentence(body.get("text") or "")

    if not text:
        return jsonify({"error": "text is required"}), 400

    try:
        embedding, input_tok, total_cost = openai_embed(text, model=EMBED_MODEL)
        return jsonify({
            "embedding": embedding,
            "inputToken": input_tok,
            "totalCostUsd": total_cost
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================
# 7) API: /interpret
# =========================

@app.post("/interpret")
def interpret():
    """
    입력: { "text": "..." }
    출력: { "result": "...", "inputToken": n, "outputToken": n, "totalCostUsd": x }
    """
    chk = require_key()
    if chk:
        return chk

    body = request.get_json(silent=True) or {}
    text = normalize_sentence(body.get("text") or "")

    if not text:
        return jsonify({"error": "text is required"}), 400

    messages = [
        {
            "role": "system",
            "content": (
                "당신은 전통 한국 꿈 해몽 전문가입니다. "
                "심리학적 해석은 하지 말고 전통 해몽 방식만 사용하세요."
            ),
        },
        {
            "role": "user",
            "content": f'꿈 내용: "{text}"\n전통 해몽 방식으로 해석해줘.'
        }
    ]

    try:
        result, in_tok, out_tok, cost = openai_chat(messages, model=CHAT_MODEL, temperature=0.7)
        return jsonify({
            "result": result or "해석 실패",
            "inputToken": in_tok,
            "outputToken": out_tok,
            "totalCostUsd": cost
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================
# 8) API: /summary
# =========================

@app.post("/summary")
def summary():
    """
    입력: { "interpretations": ["문장별 해몽1", "문장별 해몽2", ...] }
    출력: { "result": "...", "inputToken": n, "outputToken": n, "totalCostUsd": x }
    """
    chk = require_key()
    if chk:
        return chk

    body = request.get_json(silent=True) or {}
    interpretations = body.get("interpretations") or []

    if not isinstance(interpretations, list) or len(interpretations) == 0:
        return jsonify({"error": "interpretations(list) is required"}), 400

    # 리스트를 보기 좋게 bullet로 연결
    joined = "\n- " + "\n- ".join([str(x) for x in interpretations])

    # ✅ 요약은 interpret() 재사용 금지! (프롬프트가 깨지는 문제 방지)
    messages = [
        {
            "role": "system",
            "content": (
                "당신은 전통 한국 꿈 해몽 전문가입니다. "
                "심리학적 해석은 하지 말고 전통 해몽 방식만 사용하세요."
            ),
        },
        {
            "role": "user",
            "content": (
                "다음은 꿈의 '문장별 해몽 결과' 목록입니다.\n"
                "이것을 종합하여 최종 해몽을 작성하세요.\n\n"
                "출력 형식(정확히 제목 2개만):\n"
                "[종합 해몽 결과]\n"
                "[조언]\n\n"
                f"### 문장별 해몽 결과:{joined}"
            ),
        },
    ]

    try:
        result, in_tok, out_tok, cost = openai_chat(messages, model=CHAT_MODEL, temperature=0.6)
        return jsonify({
            "result": result or "요약 실패",
            "inputToken": in_tok,
            "outputToken": out_tok,
            "totalCostUsd": cost
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================
# 9) 서버 실행
# =========================
if __name__ == "__main__":
    # 포트는 5001 고정 (합의)
    # host=0.0.0.0 로 해야 폰/에뮬레이터에서 PC로 접근 가능
    app.run(host="0.0.0.0", port=5001, debug=True)
