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
    "5) 심리학 용어(무의식·트라우마 등)를 앞세우지 않는다. 정서는 옛말과 상징의 언어로 풀어낸다.\n"
    "6) 과장·미신적 위협·상술 문구를 쓰지 않는다. 담백하되 마음에 남는 문장으로."
)


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

    too_long = check_text_length(text)
    if too_long:
        return too_long

    try:
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
    except Exception as e:
        return jsonify({"error": str(e)}), 500


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

    too_long = check_text_length(text)
    if too_long:
        return too_long

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

    too_long = check_text_length(text)
    if too_long:
        return too_long

    messages = [
        {
            "role": "system",
            "content": PERSONA_SYSTEM,
        },
        {
            "role": "user",
            "content": (
                f'상담자가 들려준 꿈의 한 장면: "{text}"\n'
                "이 장면 하나를 전통 해몽의 상징으로 짧게(2~3문장) 풀어 주세요. "
                "해몽가가 곁에서 나직이 말하듯, 담백하되 마음에 닿는 어조로. "
                "미래를 단정하지 말고 기운과 상징으로만 짚어 주세요."
            )
        }
    ]

    try:
        result, in_tok, out_tok, cost = openai_chat(messages, model=CHAT_MODEL, temperature=0.8)
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

    if not all(isinstance(x, str) and x.strip() for x in interpretations):
        return jsonify({"error": "interpretations must be non-empty strings"}), 400

    # 리스트를 보기 좋게 bullet로 연결
    joined = "\n- " + "\n- ".join([str(x) for x in interpretations])

    too_long = check_text_length(joined)
    if too_long:
        return too_long

    # ✅ 요약은 interpret() 재사용 금지! (프롬프트가 깨지는 문제 방지)
    # 프론트(ResultScreen.splitSummaryAndAdvice)는 '## 종합 해몽' / '## 조언'
    # 마크다운 헤더로 파싱하므로 반드시 이 두 헤더 형식을 지킨다.
    messages = [
        {
            "role": "system",
            "content": PERSONA_SYSTEM,
        },
        {
            "role": "user",
            "content": (
                "아래는 한 사람이 들려준 꿈의 원문과 장면별 해몽, 그리고 오늘 그에게 뽑힌 상징 카드입니다.\n"
                "이것을 종합해, 해몽가가 상담자에게 직접 들려주는 하나의 최종 해몽으로 완성하세요.\n\n"
                "반드시 아래 형식을 정확히 지키세요(다른 제목·머리표 금지):\n"
                "## 종합 해몽\n"
                "(상담자에게 '당신'이라 말하며, 장면들을 하나의 이야기로 엮어 3~5문장으로 들려줍니다. "
                "제공된 '상징 카드'가 있다면 그 상징과 의미를 이야기 속에 자연스럽게 녹여, "
                "이 꿈이 왜 그 카드로 이어지는지 풀어 주세요. 단정적 예언·공포 조장은 하지 않습니다.)\n\n"
                "## 조언\n"
                "(마음에 새길 행동이나 태도를 3가지 이내로, 담백하고 다정하게. 위협·과장 금지.)\n\n"
                f"### 참고 자료:{joined}"
            ),
        },
    ]

    try:
        result, in_tok, out_tok, cost = openai_chat(messages, model=CHAT_MODEL, temperature=0.75)
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
    # debug 모드는 예외 발생 시 스택트레이스를 그대로 노출하므로 기본은 off,
    # 필요할 때만 FLASK_DEBUG=1 로 켠다.
    debug_mode = os.getenv("FLASK_DEBUG", "0") == "1"
    app.run(host="0.0.0.0", port=5001, debug=debug_mode)
