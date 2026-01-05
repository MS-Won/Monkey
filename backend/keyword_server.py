from flask import Flask, request, jsonify
from konlpy.tag import Okt
import os
import requests
import json
import re
from dotenv import load_dotenv

# ✅ .env 로드
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

app = Flask(__name__)
okt = Okt()

def count_verbs(pos_tags):
    return sum(1 for _, tag in pos_tags if tag == 'Verb')

# ----------------------------
# ✅ 1) 표준화(normalize) + 필터(filter)
# ----------------------------

# 해몽에서 제외하고 싶은 "메타/현실복귀/각성" 표현들(표준화 이후 매칭이 쉬움)
META_EXCLUDE_PATTERNS = [
    r"^꿈을\s*깨다$",
    r"^잠에서\s*깨다$",
    r"^깨어나다$",
    r"^눈을\s*뜨다$",
    r"^잠이\s*깨다$",
    r"^꿈에서\s*나오다$",
    r"^현실로\s*돌아오다$",
]

def normalize_sentence(s: str) -> str:
    """
    문장을 캐시 친화적으로 정규화합니다.
    - 따옴표/괄호/특수문자/마침표 제거
    - 앞부분 주어(나는/내가/제가/그는/그녀는 등) 제거
    - '...하는 꿈', '...의 꿈' 꼬리 제거
    - 공백 정리
    """
    if not s:
        return ""

    s = s.strip()

    # 1) 따옴표/괄호/불필요 구두점 제거 (너무 과하면 의미 손상될 수 있어 최소한만)
    s = s.replace('"', '').replace("'", "")
    s = re.sub(r"[·•]+", " ", s)
    s = re.sub(r"[.!?…]+$", "", s)  # 문장 끝 마침표류 제거
    s = re.sub(r"\s+", " ", s).strip()

    # 2) 흔한 주어 제거(문장 앞부분에만 적용)
    #    - '나'는 앱 내부에서 붙는 경우가 많고 캐시 매칭을 방해하므로 제거
    s = re.sub(r"^(나는|내가|제가|나는요|내가요|저는|난|내|우리|우린|그는|그가|그녀는|그녀가)\s+", "", s).strip()

    # 3) 꿈 메타 꼬리 제거: '...하는 꿈', '...한 꿈', '...의 꿈'
    #    - 예) '사과를 먹는 꿈' -> '사과를 먹는'
    #    - 여기서 완벽히 '먹다'로 바꾸려면 GPT/형태소 기반이 더 필요하지만
    #      꼬리 제거만 해도 캐시 적중률이 크게 오릅니다.
    s = re.sub(r"\s*(을|를)?\s*먹는\s*꿈$", " 사과를 먹다", s) if s == "사과를 먹는 꿈" else s  # (예시 특례는 제거 가능)
    s = re.sub(r"\s*(하는|한)\s*꿈$", "", s).strip()
    s = re.sub(r"\s*의\s*꿈$", "", s).strip()

    # 4) 공백 재정리
    s = re.sub(r"\s+", " ", s).strip()

    return s

def is_interpretation_target(s: str) -> bool:
    """
    해몽 대상 문장인지 판별합니다.
    - normalize된 문장을 기준으로 메타 패턴을 제거합니다.
    """
    if not s:
        return False

    ns = normalize_sentence(s)

    # 너무 짧으면(의미 없는 토막) 제외
    if len(ns) < 2:
        return False

    for pat in META_EXCLUDE_PATTERNS:
        if re.match(pat, ns):
            return False

    return True

# ----------------------------
# ✅ 2) GPT 문장 분리
# ----------------------------
def gpt_split(text: str):
    print("📡 GPT 호출 준비", flush=True)
    url = 'https://api.openai.com/v1/chat/completions'
    headers = {
        'Authorization': f'Bearer {OPENAI_API_KEY}',
        'Content-Type': 'application/json'
    }

    # ✅ "메타 문장(꿈을 깨다 등)은 제외"를 프롬프트에 강제
    system_prompt = (
        "당신은 꿈 내용을 '해몽 대상 사건' 단위로 분리하는 전문가입니다.\n"
        "입력된 꿈의 문장에서 다음 규칙을 지키세요:\n\n"
        "1) 동사를 중심으로 사건 단위로 분리합니다.\n"
        "2) 동사 결합(예: '보고 웃다', '가다 멈추다')은 하나의 사건으로 취급합니다.\n"
        "3) 주어가 생략된 경우 문맥상 자연스러운 주어를 보완하되, 주어가 '나'라면 주어를 출력하지 않습니다.\n"
        "4) 의미 없는 감탄사/의성어/의태어는 제외합니다.\n"
        "5) 결과는 가능한 표준형(예: '먹었어요'→'먹다')으로 정리합니다.\n"
        "6) ★중요: '꿈을 깨다/잠에서 깨다/눈을 뜨다/현실로 돌아오다' 같은 '현실 복귀/각성' 문장은 해몽 대상이 아니므로 결과에서 제외합니다.\n\n"
        "출력은 반드시 JSON 배열만 반환하세요. 예: [\"사과를 먹다\", \"뱀에게 물리다\"]"
    )

    body = {
        "model": "gpt-3.5-turbo",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text}
        ],
        "temperature": 0.3
    }

    # ✅ timeout으로 서버 무한 대기 방지
    response = requests.post(url, headers=headers, json=body, timeout=20)
    response.raise_for_status()
    data = response.json()
    return data['choices'][0]['message']['content']

# ----------------------------
# ✅ 3) API
# ----------------------------
@app.route('/split', methods=['POST'])
def split_sentence():
    data = request.get_json() or {}
    text = (data.get("text", "") or "").strip()

    if not text:
        return jsonify({"sentences": [], "usedGPT": False, "removed": []})

    # 1) 형태소 분석으로 동사 개수 체크
    pos_tags = okt.pos(text, stem=True)
    verb_count = count_verbs(pos_tags)

    # 2) verb 1개 이하: 그대로 1문장 처리 (단, normalize/filter는 적용)
    if verb_count <= 1:
        raw_list = [text]
        removed = []
        final_list = []

        for s in raw_list:
            ns = normalize_sentence(s)
            if is_interpretation_target(ns):
                final_list.append(ns)
            else:
                removed.append(ns)

        return jsonify({"sentences": final_list, "usedGPT": False, "removed": removed})

    # 3) verb 2개 이상: GPT로 분리 후 normalize/filter
    try:
        gpt_result = gpt_split(text)

        # ✅ JSON 배열로 파싱 시도
        try:
            raw_sentences = json.loads(gpt_result)
        except json.JSONDecodeError:
            # fallback: 줄바꿈/불릿 처리
            raw_sentences = [line.strip("-• ").strip() for line in gpt_result.splitlines() if line.strip()]

        removed = []
        final_sentences = []

        # normalize + filter
        for s in raw_sentences:
            ns = normalize_sentence(s)
            if is_interpretation_target(ns):
                final_sentences.append(ns)
            else:
                removed.append(ns)

        # 중복 제거(순서 유지)
        seen = set()
        unique_final = []
        for s in final_sentences:
            if s not in seen:
                seen.add(s)
                unique_final.append(s)

        return jsonify({"sentences": unique_final, "usedGPT": True, "removed": removed})

    except Exception as e:
        print("❌ split 오류:", e, flush=True)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
