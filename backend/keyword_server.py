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

# 전통 해몽 상징 사전(경량 RAG) — 매칭된 상징 의미를 /interpret 근거로 주입
import dream_lexicon


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
# gpt-4o-mini: gpt-3.5 대비 한국어 표현력이 크게 좋아 번역투가 거의 사라진다(비용도 저렴).
CHAT_MODEL = "gpt-4o-mini"
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
    # 기상(잠에서 깸) 관용구 — 어미 변형까지 잡도록 부분 문자열로 추가
    "꿈이 깨",
    "꿈이 깼",
    "꿈을 깼",
    "꿈에서 깨",
    "꿈에서 깼",
    "잠에서 깼",
    "눈을 떠보니",
    "눈을 뜨니",
    "눈을 떴더니",
    "눈을 떴다",
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


# =========================
# 1) 비용 계산 (최신 단가 기준)
# =========================
# gpt-4o-mini: Input $0.15 / 1M, Output $0.60 / 1M
# Embedding 3-small: $0.02 / 1M
#
# ※ 문서 기반 단가 (프로젝트/계정/지역에 따라 변동 가능)
#    모델/단가 변경되면 여기만 바꾸면 됨.
CHAT_IN_PER_TOKEN = 0.15 / 1_000_000
CHAT_OUT_PER_TOKEN = 0.60 / 1_000_000
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

    total_cost = (in_tok * CHAT_IN_PER_TOKEN) + (out_tok * CHAT_OUT_PER_TOKEN)
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

    # 전통 해몽 사전에서 이 장면의 상징을 매칭해 근거로 주입(경량 RAG)
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
            "\n\n(이 장면에는 전통 해몽 사전에 등재된 상징이 뚜렷하지 않습니다. "
            "상징을 억지로 지어내지 말고, 장면의 정서와 분위기를 전통 어조로 담백하게 풀어 주세요.)"
        )

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
                "번역투 없이 자연스러운 한국어로, 이 상징이 실제 삶에서 무엇을 뜻하는지 "
                "구체적으로 짚어 주세요. 미래를 단정하지 말고 기운과 상징으로 담담히."
                f"{grounding_section}"
            )
        }
    ]

    try:
        # temperature를 낮춰(0.5) 전통 근거에서 벗어나는 변동을 줄인다.
        result, in_tok, out_tok, cost = openai_chat(messages, model=CHAT_MODEL, temperature=0.5)
        return jsonify({
            "result": result or "해석 실패",
            "inputToken": in_tok,
            "outputToken": out_tok,
            "totalCostUsd": cost,
            "matchedSymbols": dream_lexicon.matched_headwords(matched),  # 디버그용, 프론트는 무시 가능
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
                "(첫 문장은 반드시 '이 꿈은 결국 ~라는 뜻으로 보입니다' 처럼, 이 꿈이 무엇을 말하는지 "
                "구체적이고 분명한 한 줄 결론으로 시작하세요. 그다음 상담자에게 '당신'이라 부르며 "
                "장면들을 하나의 이야기로 자연스럽게 엮어 3~5문장으로 들려주되, 그 상징이 상담자의 "
                "실제 삶(일·관계·돈·건강·마음)에서 무엇을 뜻하는지 손에 잡히는 일상어로 짚어 주세요. "
                "제공된 '상징 카드'가 있다면 그 의미를 이야기에 자연스럽게 녹여, 이 꿈이 왜 그 카드로 "
                "이어지는지 풀어 주세요. 단정적 예언·공포 조장은 하지 않습니다.)\n\n"
                "## 조언\n"
                "(오늘부터 실제로 해볼 수 있는 구체적인 행동·태도를 2~3가지, 모호한 말 대신 분명하게. "
                "담백하고 다정하게, 위협·과장 없이.)\n\n"
                "글쓰기 규칙: 번역투·딱딱한 문어체를 쓰지 말고, 한국 사람이 실제로 말하듯 자연스럽게. "
                "추상적 미사여구보다 뜻이 바로 와닿는 문장으로.\n"
                "주의: 장면별 해몽에 담긴 전통 상징의 의미(길흉)를 그대로 이어받아 종합하고, "
                "서양식·심리학 용어(무의식·에너지·정화·내면 등)를 새로 끌어들이지 마세요.\n\n"
                f"### 참고 자료:{joined}"
            ),
        },
    ]

    try:
        result, in_tok, out_tok, cost = openai_chat(messages, model=CHAT_MODEL, temperature=0.65)
        return jsonify({
            "result": result or "요약 실패",
            "inputToken": in_tok,
            "outputToken": out_tok,
            "totalCostUsd": cost
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================
# 9) 헬스체크 (호스트 워밍업/모니터링용)
# =========================
@app.get("/health")
def health():
    # Okt(JVM)까지 로드되어 실제 요청을 받을 준비가 됐는지 확인
    return jsonify({"ok": True})


# =========================
# 10) 서버 실행
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
