# 해몽 카테고리 개편 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 해몽 GPT 호출을 7회에서 1회로 줄이고, 문장별 나열 대신 의미 카테고리로 결과를 재구성한다.

**Architecture:** 백엔드에 단일 엔드포인트 `/reading`을 추가한다. 꿈 전문에 전통 해몽 사전 매칭을 1회 적용하고 GPT를 JSON 모드로 1회 호출해 `summary` / `oneLine` / `categories`를 받는다. 응답 검증은 GPT 호출과 분리된 순수 함수로 두어 단위 테스트한다. 프론트는 문장 분리와 문장별 해몽을 전부 걷어내고, 카드를 먼저 보여준 뒤 탭했을 때 해몽과 카테고리를 펼친다. 프로필은 서버로 보내지 않고 기기에서 카테고리 순서만 조정한다.

**Tech Stack:** Flask + requests (백엔드), Python `unittest`, React Native + TypeScript, `react-native-sqlite-storage`, AsyncStorage

## Global Constraints

- 설계 문서: `docs/superpowers/specs/2026-07-26-reading-categories-design.md`. 충돌하면 스펙이 우선.
- **프로필(이름·나이대·직업·성별)을 서버로 전송하지 않는다.** 기기 밖으로 나가는 것은 꿈 텍스트뿐이다. 이는 `docs/legal/privacy-policy.md`와 Play 데이터 보안 신고를 지키기 위한 제약이다.
- 카테고리 `key`는 정확히 이 6종이다: `luck`, `caution`, `relationship`, `wealth`, `work`, `health`.
- **이모지를 쓰지 않는다.** 제목은 한글 텍스트만.
- 모델은 `gpt-4o-mini` (`CHAT_MODEL` 상수). 변경하지 않는다.
- 프론트 검증은 `npx tsc --noEmit` 0오류가 기준이다.
- 커밋 메시지 끝에 `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` 를 넣는다.
- 프로젝트 경로에 공백이 있어 `npm run android`는 실패한다. 안드로이드 빌드는 `android` 폴더에서 `.\gradlew.bat`를 직접 호출한다.

## File Structure

| 파일 | 책임 |
|---|---|
| `backend/reading_schema.py` (신규) | GPT 응답 검증·정규화. 순수 함수만. 네트워크 없음 |
| `backend/test_reading_schema.py` (신규) | 위 모듈의 단위 테스트 |
| `backend/keyword_server.py` (수정) | `/reading` 라우트 추가, `openai_chat`에 `response_format` 지원 추가 |
| `frontend/src/logic/reading.ts` (신규) | `/reading` 호출과 응답 타입 |
| `frontend/src/logic/readingView.ts` (신규) | 카테고리 한글 제목, 프로필 기반 정렬, 저장용 평문 렌더 |
| `frontend/src/screens/InputScreen.tsx` (수정) | `/split` 호출 제거, 꿈 전문만 들고 Result로 이동 |
| `frontend/src/screens/ResultScreen.tsx` (수정) | `/reading` 호출, 카드 우선 UX, 카테고리 렌더 |
| `frontend/src/screens/ProfileScreen.tsx` (수정) | 성별 필드 제거, 온보딩 단계 재배선 |
| `frontend/src/storage/userProfile.ts` (수정) | `gender`를 선택 항목으로 완화 |
| `frontend/src/advice/profileContext.ts` (수정) | `Gender`·`formatGender`·`buildProfileContextForPrompt` 제거 |
| `frontend/navigator.tsx` (수정) | `Result` 라우트 파라미터 교체 |
| `frontend/src/logic/AnalyzeSentence.ts` (삭제) | 문장별 해몽 + 임베딩 캐시 |
| `frontend/src/logic/embedding.ts` (삭제) | `/embed` 클라이언트 |

---

### Task 1: 백엔드 응답 검증 순수 함수

**Files:**
- Create: `backend/reading_schema.py`
- Test: `backend/test_reading_schema.py`

**Interfaces:**
- Consumes: 없음 (첫 태스크)
- Produces:
  - `CATEGORY_KEYS: tuple` — `("luck", "caution", "relationship", "wealth", "work", "health")`
  - `MAX_CATEGORIES: int` — `4`
  - `class ReadingValidationError(ValueError)`
  - `normalize_reading(raw: dict) -> dict` — `{"summary": str, "oneLine": str, "categories": list[dict]}` 반환. `summary`가 비면 `ReadingValidationError` 발생

- [ ] **Step 1: Write the failing test**

Create `backend/test_reading_schema.py`:

```python
import unittest

from reading_schema import (
    MAX_CATEGORIES,
    ReadingValidationError,
    normalize_reading,
)


class NormalizeReadingTest(unittest.TestCase):
    def test_valid_payload_passes_through(self):
        raw = {
            "summary": "종합 해몽 본문",
            "oneLine": "오늘의 한마디",
            "categories": [
                {"key": "work", "body": "직장운 본문"},
                {"key": "wealth", "body": "재물운 본문"},
            ],
        }
        out = normalize_reading(raw)
        self.assertEqual(out["summary"], "종합 해몽 본문")
        self.assertEqual(out["oneLine"], "오늘의 한마디")
        self.assertEqual([c["key"] for c in out["categories"]], ["work", "wealth"])

    def test_unknown_key_is_dropped(self):
        raw = {
            "summary": "s",
            "oneLine": "o",
            "categories": [
                {"key": "work", "body": "b"},
                {"key": "romance", "body": "b"},
            ],
        }
        out = normalize_reading(raw)
        self.assertEqual([c["key"] for c in out["categories"]], ["work"])

    def test_truncates_to_max(self):
        raw = {
            "summary": "s",
            "oneLine": "o",
            "categories": [
                {"key": k, "body": "b"}
                for k in ("luck", "caution", "relationship", "wealth", "work", "health")
            ],
        }
        out = normalize_reading(raw)
        self.assertEqual(len(out["categories"]), MAX_CATEGORIES)
        self.assertEqual(
            [c["key"] for c in out["categories"]],
            ["luck", "caution", "relationship", "wealth"],
        )

    def test_duplicate_key_kept_once(self):
        raw = {
            "summary": "s",
            "oneLine": "o",
            "categories": [
                {"key": "work", "body": "first"},
                {"key": "work", "body": "second"},
            ],
        }
        out = normalize_reading(raw)
        self.assertEqual(len(out["categories"]), 1)
        self.assertEqual(out["categories"][0]["body"], "first")

    def test_zero_categories_is_allowed(self):
        out = normalize_reading({"summary": "s", "oneLine": "o", "categories": []})
        self.assertEqual(out["categories"], [])

    def test_missing_categories_field_is_allowed(self):
        out = normalize_reading({"summary": "s", "oneLine": "o"})
        self.assertEqual(out["categories"], [])

    def test_empty_body_category_is_dropped(self):
        raw = {
            "summary": "s",
            "oneLine": "o",
            "categories": [{"key": "work", "body": "   "}],
        }
        out = normalize_reading(raw)
        self.assertEqual(out["categories"], [])

    def test_missing_summary_raises(self):
        with self.assertRaises(ReadingValidationError):
            normalize_reading({"oneLine": "o", "categories": []})

    def test_blank_summary_raises(self):
        with self.assertRaises(ReadingValidationError):
            normalize_reading({"summary": "   ", "categories": []})

    def test_missing_one_line_becomes_empty_string(self):
        out = normalize_reading({"summary": "s", "categories": []})
        self.assertEqual(out["oneLine"], "")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "D:/00 My Project/01 Monkey/backend" && python -m unittest test_reading_schema -v
```

Expected: `ModuleNotFoundError: No module named 'reading_schema'`

- [ ] **Step 3: Write minimal implementation**

Create `backend/reading_schema.py`:

```python
"""
/reading 응답 검증·정규화.

GPT 호출과 분리된 순수 함수만 둔다. 네트워크를 타지 않으므로 단위 테스트가
빠르고 무료다. 모델이 이상하게 굴어도 앱이 깨지지 않게 하는 것이 목적이다.
"""

CATEGORY_KEYS = ("luck", "caution", "relationship", "wealth", "work", "health")

# 프롬프트로는 2~4개를 지시하지만, 검증에서 받아들이는 범위는 0~4개다.
# 근거가 거의 없는 짧은 꿈에서 모델이 적게 내는 것은 옳은 동작이다.
MAX_CATEGORIES = 4


class ReadingValidationError(ValueError):
    """해몽 본문(summary)이 없어 화면을 그릴 수 없는 경우."""


def normalize_reading(raw: dict) -> dict:
    """
    모델이 준 dict를 앱이 신뢰할 수 있는 형태로 정규화한다.

    - summary 가 비면 ReadingValidationError
    - oneLine 이 없으면 빈 문자열
    - categories 는 알 수 없는 key / 빈 body / 중복 key 를 걸러내고
      최대 MAX_CATEGORIES 개까지만 남긴다
    """
    if not isinstance(raw, dict):
        raise ReadingValidationError("응답이 객체가 아닙니다")

    summary = str(raw.get("summary") or "").strip()
    if not summary:
        raise ReadingValidationError("summary 가 비어 있습니다")

    one_line = str(raw.get("oneLine") or "").strip()

    categories = []
    seen = set()
    for item in raw.get("categories") or []:
        if not isinstance(item, dict):
            continue
        key = str(item.get("key") or "").strip()
        body = str(item.get("body") or "").strip()
        if key not in CATEGORY_KEYS or not body or key in seen:
            continue
        seen.add(key)
        categories.append({"key": key, "body": body})
        if len(categories) >= MAX_CATEGORIES:
            break

    return {"summary": summary, "oneLine": one_line, "categories": categories}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd "D:/00 My Project/01 Monkey/backend" && python -m unittest test_reading_schema -v
```

Expected: `Ran 10 tests`, `OK`

- [ ] **Step 5: Commit**

```bash
cd "D:/00 My Project/01 Monkey"
git add backend/reading_schema.py backend/test_reading_schema.py
git commit -m "$(cat <<'EOF'
feat(backend): /reading 응답 검증 순수 함수와 단위 테스트

GPT 호출과 분리해 네트워크 없이 검증한다. 이 프로젝트의 첫 자동 테스트.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: 백엔드 `/reading` 엔드포인트

**Files:**
- Modify: `backend/keyword_server.py`

**Interfaces:**
- Consumes: `reading_schema.normalize_reading`, `reading_schema.ReadingValidationError`, `reading_schema.CATEGORY_KEYS`
- Produces: `POST /reading` — 요청 `{"text": str}`, 응답 `{"summary","oneLine","categories","symbols","inputToken","outputToken","totalCostUsd"}`

- [ ] **Step 1: `openai_chat`에 `response_format` 지원 추가**

`backend/keyword_server.py`의 `openai_chat` 정의(198행 부근)를 다음으로 교체한다. 기존 호출부는 `response_format`을 넘기지 않으므로 그대로 동작한다.

```python
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
```

- [ ] **Step 2: import 추가**

`import dream_lexicon` 아래(24행 부근)에 추가한다.

```python
import reading_schema
```

- [ ] **Step 3: 카테고리 지시 프롬프트 상수 추가**

`PERSONA_SYSTEM` 정의 바로 아래에 추가한다.

```python
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
    "- summary: 꿈 전체를 하나의 이야기로 엮은 종합 해몽. 4~6문장.\n"
    "- oneLine: 오늘 하루 마음에 품을 말 한 문장.\n"
    "- categories: key는 반드시 다음 중에서만 고른다 — "
    "luck(행운), caution(주의운), relationship(인간관계), wealth(재물운), "
    "work(직장·학업운), health(건강운).\n"
    "- **꿈에 실제 근거가 있는 것만 2~4개** 고른다. 근거가 없으면 그 항목을 넣지 않는다. "
    "칸을 채우려고 없는 이야기를 지어내지 않는다.\n"
    "- 각 body는 2~3문장으로 짧게 쓴다.\n"
    "- 제목·이모지·마크다운 기호를 body 안에 넣지 않는다. 본문 문장만 쓴다.\n"
    "- 같은 key를 두 번 쓰지 않는다."
)
```

- [ ] **Step 4: `/reading` 라우트 추가**

`@app.get("/health")` 정의 **위에** 추가한다.

```python
# =========================
# 9) API: /reading  (단일 호출 해몽)
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
```

- [ ] **Step 5: 단위 테스트가 여전히 통과하는지 확인**

```bash
cd "D:/00 My Project/01 Monkey/backend" && python -m unittest test_reading_schema -v
```

Expected: `Ran 10 tests`, `OK`

- [ ] **Step 6: 로컬 서버로 짧은 꿈 확인**

터미널 1에서 서버를 띄운다:

```bash
cd "D:/00 My Project/01 Monkey/backend" && python keyword_server.py
```

터미널 2에서:

```bash
cd "D:/00 My Project/01 Monkey/backend"
python -c "import json; json.dump({'text':'배를 보았다'}, open('t1.json','w',encoding='utf-8'), ensure_ascii=False)"
curl -s -X POST http://127.0.0.1:5001/reading -H 'Content-Type: application/json; charset=utf-8' --data-binary @t1.json | python -m json.tool
```

Expected: `summary`가 채워져 있고, `categories`가 **0~2개**로 적다. 근거 없는 운세를 지어내지 않았는지 육안 확인한다.

- [ ] **Step 7: 다사건 꿈으로 확인 + 토큰 실측**

```bash
cd "D:/00 My Project/01 Monkey/backend"
python -c "import json; json.dump({'text':'어젯밤 꿈에 큰 구렁이가 집 마당으로 들어왔다. 놀라서 방문을 잠그고 숨었는데, 창밖으로 맑은 물이 흘러넘쳤다. 그러다 돌아가신 할머니가 나타나 내 손에 금가락지를 쥐여 주셨다.'}, open('t2.json','w',encoding='utf-8'), ensure_ascii=False)"
curl -s -X POST http://127.0.0.1:5001/reading -H 'Content-Type: application/json; charset=utf-8' --data-binary @t2.json | python -c "
import sys, json
d = json.load(sys.stdin)
print('categories:', [c['key'] for c in d['categories']])
print('symbols   :', d['symbols'])
print('tokens    : in=%s out=%s' % (d['inputToken'], d['outputToken']))
print('cost      : \$%.6f' % d['totalCostUsd'])
"
```

Expected: `categories` 2~4개, `cost`가 **$0.0010 미만**. 기존 파이프라인 실측치는 $0.0017이었다. 목표에 크게 못 미치면 `READING_INSTRUCTION`의 길이 상한을 조인다.

임시 파일을 지운다:

```bash
cd "D:/00 My Project/01 Monkey/backend" && rm -f t1.json t2.json
```

- [ ] **Step 8: Commit**

```bash
cd "D:/00 My Project/01 Monkey"
git add backend/keyword_server.py
git commit -m "$(cat <<'EOF'
feat(backend): 단일 호출 해몽 엔드포인트 /reading

꿈 전문에 사전 매칭 1회 + GPT 1회(JSON 모드)로 종합 해몽·한마디·카테고리를
만든다. 기존 /split + /interpret×N + /summary 를 대체한다.

symbols는 모델이 아니라 dream_lexicon 매칭 결과를 쓴다. 결정적이고 무료다.
openai_chat에 response_format 인자를 추가했고, 기존 호출부는 영향받지 않는다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: 프론트 `/reading` 클라이언트

**Files:**
- Create: `frontend/src/logic/reading.ts`

**Interfaces:**
- Consumes: Task 2의 `POST /reading`
- Produces:
  - `type CategoryKey = 'luck' | 'caution' | 'relationship' | 'wealth' | 'work' | 'health'`
  - `interface ReadingCategory { key: CategoryKey; body: string }`
  - `interface Reading { summary: string; oneLine: string; categories: ReadingCategory[]; symbols: string[]; inputToken: number; outputToken: number; totalCostUsd: number }`
  - `fetchReading(text: string): Promise<Reading>` — 실패 시 예외를 던진다

- [ ] **Step 1: 파일 생성**

Create `frontend/src/logic/reading.ts`:

```typescript
import { SERVER_BASE_URL } from '@env';

export type CategoryKey =
  | 'luck'
  | 'caution'
  | 'relationship'
  | 'wealth'
  | 'work'
  | 'health';

export interface ReadingCategory {
  key: CategoryKey;
  body: string;
}

export interface Reading {
  summary: string;
  oneLine: string;
  categories: ReadingCategory[];
  symbols: string[];
  inputToken: number;
  outputToken: number;
  totalCostUsd: number;
}

const VALID_KEYS: CategoryKey[] = [
  'luck',
  'caution',
  'relationship',
  'wealth',
  'work',
  'health',
];

/**
 * 꿈 전문 하나로 해몽을 받아온다. 네트워크 왕복 1회.
 *
 * 프로필은 보내지 않는다. 기기 밖으로 나가는 것은 꿈 텍스트뿐이며,
 * 이는 개인정보처리방침과 Play 데이터 보안 신고를 지키기 위한 제약이다.
 *
 * 실패하면 예외를 던진다. 해몽 없이는 화면을 그릴 수 없으므로
 * 호출부가 오류 처리를 해야 한다.
 */
export const fetchReading = async (text: string): Promise<Reading> => {
  const res = await fetch(`${SERVER_BASE_URL}/reading`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('❌ /reading 에러:', err);
    throw new Error('reading failed');
  }

  const data = await res.json();

  const summary = String(data.summary || '').trim();
  if (!summary) {
    throw new Error('reading has no summary');
  }

  // 서버가 이미 걸렀지만 방어적으로 한 번 더 확인한다.
  const categories: ReadingCategory[] = Array.isArray(data.categories)
    ? data.categories
        .filter(
          (c: any) =>
            c &&
            VALID_KEYS.includes(c.key) &&
            String(c.body || '').trim().length > 0,
        )
        .map((c: any) => ({ key: c.key as CategoryKey, body: String(c.body).trim() }))
    : [];

  return {
    summary,
    oneLine: String(data.oneLine || '').trim(),
    categories,
    symbols: Array.isArray(data.symbols) ? data.symbols.map(String) : [],
    inputToken: data.inputToken ?? 0,
    outputToken: data.outputToken ?? 0,
    totalCostUsd: data.totalCostUsd ?? 0,
  };
};
```

- [ ] **Step 2: 타입 검사**

```bash
cd "D:/00 My Project/01 Monkey" && npx tsc --noEmit
```

Expected: 오류 0건 (출력 없음)

- [ ] **Step 3: Commit**

```bash
cd "D:/00 My Project/01 Monkey"
git add frontend/src/logic/reading.ts
git commit -m "$(cat <<'EOF'
feat(frontend): /reading 클라이언트와 응답 타입

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: 카테고리 제목·정렬·평문 렌더

**Files:**
- Create: `frontend/src/logic/readingView.ts`

**Interfaces:**
- Consumes: `CategoryKey`, `ReadingCategory`, `Reading` (Task 3), `AgeGroup`, `JobGroup` (`frontend/src/storage/userProfile.ts`)
- Produces:
  - `CATEGORY_TITLES: Record<CategoryKey, string>`
  - `sortCategoriesByProfile(categories: ReadingCategory[], ageGroup: AgeGroup | null, jobGroup: JobGroup | null): ReadingCategory[]`
  - `renderReadingText(reading: Reading, ordered: ReadingCategory[]): string`

- [ ] **Step 1: 파일 생성**

Create `frontend/src/logic/readingView.ts`:

```typescript
import type { AgeGroup, JobGroup } from '../storage/userProfile';
import type { CategoryKey, Reading, ReadingCategory } from './reading';

/**
 * 카테고리 한글 제목. 이모지는 쓰지 않는다.
 * 전통 해몽·아르누보 톤에서 이모지는 진정성을 떨어뜨린다.
 */
export const CATEGORY_TITLES: Record<CategoryKey, string> = {
  luck: '행운',
  caution: '주의운',
  relationship: '인간관계',
  wealth: '재물운',
  work: '직장·학업운',
  health: '건강운',
};

const JOB_PRIORITY: Record<JobGroup, CategoryKey[]> = {
  STUDENT: ['work'],
  EMPLOYEE: ['work', 'wealth'],
  SELF_EMPLOYED: ['work', 'wealth'],
  JOB_SEEKER: ['work'],
  RETIRED: ['health'],
  HOMEMAKER: ['relationship', 'health'],
  OTHER: [],
};

const AGE_PRIORITY: Record<AgeGroup, CategoryKey[]> = {
  TEENS: ['work'],
  TWENTIES: [],
  THIRTIES: [],
  FORTIES: [],
  FIFTIES: [],
  SIXTY_PLUS: ['health'],
};

/**
 * 로컬 프로필로 카테고리 순서만 바꾼다. 서버로는 아무것도 보내지 않는다.
 *
 * 직업과 나이대가 서로 다른 키를 가리키면 직업을 우선한다.
 * 직업이 현재 생활을 더 직접적으로 반영하기 때문이다.
 *
 * 안정 정렬이므로 우선 키가 아닌 항목의 상대 순서는 서버가 준 순서를 유지한다.
 * 모델이 애초에 그 카테고리를 내지 않았으면 올릴 것이 없다 — 이것이
 * 프로필을 전송하지 않는 설계의 한계다.
 */
export function sortCategoriesByProfile(
  categories: ReadingCategory[],
  ageGroup: AgeGroup | null,
  jobGroup: JobGroup | null,
): ReadingCategory[] {
  const priority: CategoryKey[] = [];

  if (jobGroup) {
    for (const k of JOB_PRIORITY[jobGroup]) {
      if (!priority.includes(k)) priority.push(k);
    }
  }
  if (ageGroup) {
    for (const k of AGE_PRIORITY[ageGroup]) {
      if (!priority.includes(k)) priority.push(k);
    }
  }

  if (priority.length === 0) return [...categories];

  const rank = (c: ReadingCategory) => {
    const i = priority.indexOf(c.key);
    return i === -1 ? priority.length : i;
  };

  return categories
    .map((c, idx) => ({ c, idx }))
    .sort((a, b) => rank(a.c) - rank(b.c) || a.idx - b.idx)
    .map(x => x.c);
}

/**
 * 꿈기록에 저장할 평문을 만든다.
 *
 * 기존 dream_diary.interpretation 컬럼을 그대로 쓰므로 스키마 변경과
 * 마이그레이션이 없다. 카테고리는 정렬을 적용한 뒤의 순서로 저장한다 —
 * 화면에서 본 것과 꿈기록에 남는 것이 같아야 한다.
 */
export function renderReadingText(
  reading: Reading,
  ordered: ReadingCategory[],
): string {
  const blocks: string[] = [`종합 해몽\n${reading.summary}`];

  for (const c of ordered) {
    blocks.push(`${CATEGORY_TITLES[c.key]}\n${c.body}`);
  }

  if (reading.oneLine) {
    blocks.push(`오늘의 한마디\n${reading.oneLine}`);
  }

  return blocks.join('\n\n');
}
```

- [ ] **Step 2: 타입 검사**

```bash
cd "D:/00 My Project/01 Monkey" && npx tsc --noEmit
```

Expected: 오류 0건

- [ ] **Step 3: Commit**

```bash
cd "D:/00 My Project/01 Monkey"
git add frontend/src/logic/readingView.ts
git commit -m "$(cat <<'EOF'
feat(frontend): 카테고리 제목·프로필 정렬·저장 평문 렌더

프로필은 서버로 보내지 않고 기기에서 순서만 조정한다. 직업이 나이대보다
우선한다. 이모지는 쓰지 않는다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: InputScreen에서 `/split` 제거

**Files:**
- Modify: `frontend/navigator.tsx:31-40`
- Modify: `frontend/src/screens/InputScreen.tsx`

**Interfaces:**
- Consumes: 없음
- Produces: `Result` 라우트 파라미터가 `{ dreamText: string }` 으로 바뀐다. Task 6이 이를 읽는다.

- [ ] **Step 1: 라우트 파라미터 교체**

`frontend/navigator.tsx`의 `Result` 항목을 다음으로 교체한다.

```typescript
  Result: {
    dreamText: string;
  };
```

같은 파일 상단의 `import type { Gender, AgeGroup, JobGroup }` 에서 더 이상 쓰지 않는 타입이 생기면 함께 정리한다. `npx tsc --noEmit`이 알려준다.

- [ ] **Step 2: 텍스트 경로에서 `/split` 호출 제거**

`InputScreen.tsx`의 149행 부근 `navigation.replace('Result', {...})`를 포함한 `try` 블록에서, `/split` fetch와 응답 검사를 지우고 다음만 남긴다.

```typescript
        navigation.replace('Result', { dreamText });
```

- [ ] **Step 3: 음성 경로에서도 동일하게 제거**

같은 파일 303행 부근의 두 번째 `navigation.replace('Result', {...})`도 다음으로 바꾼다.

```typescript
      navigation.replace('Result', { dreamText: trimmed });
```

`/split` fetch, `data.sentences` 검사, `Alert.alert('오류', '문장 분리 결과가 없습니다.')`를 함께 지운다.

- [ ] **Step 4: 사용하지 않게 된 로더 제거**

325행의 다음 줄을 삭제한다. `/split`이 없어져 `mode === 'text'` 분기에서 로딩을 보여줄 이유가 없다.

```typescript
  if (mode === 'text') {
    return <CardCreationLoader label="문장을 정리하고 있어요…" sublabel="잠시만 기다려주세요" />;
  }
```

`CardCreationLoader` import가 이 파일에서 더 이상 쓰이지 않으면 함께 지운다.

- [ ] **Step 5: 쓰지 않게 된 프로필 지역 변수 정리**

`personName` / `gender` / `ageGroup` / `jobGroup` 은 Result로 넘기던 값이었다. 이제 넘기지
않으므로 이 파일에서 이들을 읽어오는 코드가 남아 있으면 지운다.

```bash
cd "D:/00 My Project/01 Monkey" && grep -n "personName\|gender\|ageGroup\|jobGroup" frontend/src/screens/InputScreen.tsx
```

Expected: 출력 없음.

**중복 제출 방지에 관하여:** `/split`이 사라지면서 InputScreen에는 비동기 작업이 남지
않는다. "해몽하기"를 누르면 즉시 Result로 이동하고, Result는 전체 화면 로더를 띄우므로
누를 버튼 자체가 없다. 중복 제출이 구조적으로 막힌다. `isLoading` 관련 코드는 음성 인식
경로에서 여전히 쓰이므로 **그대로 둔다.**

- [ ] **Step 6: 타입 검사**

```bash
cd "D:/00 My Project/01 Monkey" && npx tsc --noEmit
```

Expected: `ResultScreen.tsx`에서 `sentenceList` 등을 참조하는 오류가 나온다. Task 6에서 고치므로 **여기서는 InputScreen과 navigator 관련 오류만 없으면 된다.**

이 태스크는 tsc가 깨진 상태로 끝나는 유일한 태스크다. Task 6과 짝을 이루므로, 둘을
연달아 실행한 뒤에 검증한다.

- [ ] **Step 7: Commit**

```bash
cd "D:/00 My Project/01 Monkey"
git add frontend/navigator.tsx frontend/src/screens/InputScreen.tsx
git commit -m "$(cat <<'EOF'
refactor(frontend): InputScreen에서 /split 호출 제거

문장별 해몽이 사라지면 문장 분리 결과를 쓸 곳이 없다. 꿈 전문만 들고
Result로 넘어간다. 네트워크 왕복 1회가 줄어든다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: ResultScreen 재구성

**Files:**
- Modify: `frontend/src/screens/ResultScreen.tsx`

**Interfaces:**
- Consumes: `fetchReading`, `Reading`, `ReadingCategory` (Task 3), `CATEGORY_TITLES`, `sortCategoriesByProfile`, `renderReadingText` (Task 4), `loadUserProfile` (`frontend/src/storage/userProfile.ts`)
- Produces: 없음 (화면)

- [ ] **Step 1: import와 상태 교체**

기존의 문장별 해몽 관련 import(`analyzeSentence`, `getGPTSummary`, `splitSummaryAndAdvice`, `buildDisplayName`)를 지우고 다음을 넣는다.

```typescript
import { fetchReading, Reading, ReadingCategory } from '../logic/reading';
import {
  CATEGORY_TITLES,
  sortCategoriesByProfile,
  renderReadingText,
} from '../logic/readingView';
import { loadUserProfile } from '../storage/userProfile';
```

상태를 다음으로 교체한다. `results` / `summary` / `advice` / `summaryMeta` / `isSingleSentence` / `userExplainBlocks` 는 삭제한다.

```typescript
  const { dreamText } = route.params as { dreamText: string };

  const [loading, setLoading] = useState(true);
  const [devOpen, setDevOpen] = useState(false);
  const [reading, setReading] = useState<Reading | null>(null);
  const [ordered, setOrdered] = useState<ReadingCategory[]>([]);
  const [card, setCard] = useState<ArchetypeCard | null>(null);
  const [cardFlipped, setCardFlipped] = useState(false);
```

- [ ] **Step 2: 호출 로직 교체**

`useEffect` 안의 `analyzeAll`을 다음으로 교체한다.

```typescript
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const result = await fetchReading(dreamText);
        setReading(result);

        const profile = await loadUserProfile();
        const sorted = sortCategoriesByProfile(
          result.categories,
          profile.ageGroup,
          profile.jobGroup,
        );
        setOrdered(sorted);

        // 카드 선정: 꿈 원문 + 해몽 본문 전체를 신호로 쓴다.
        const bodyJoined = [result.summary, ...sorted.map(c => c.body)].join(' ');
        const drawnCard = selectArchetypeCard(dreamText, bodyJoined);
        setCard(drawnCard);

        const finalText = renderReadingText(result, sorted);
        const luckyScore = calculateLuckyScore(finalText);
        saveDreamDiary(dreamText, finalText, drawnCard.name, luckyScore);
      } catch (e) {
        console.log('[ResultScreen] fetchReading error:', e);
        Alert.alert('오류', '해몽을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [dreamText]);
```

`Alert`가 이 파일에 import되어 있지 않으면 `react-native`에서 추가한다.

- [ ] **Step 3: 로딩 문구 변경**

219행 부근을 다음으로 바꾼다.

```typescript
  if (loading) {
    return <CardCreationLoader label="당신의 꿈을 풀이하고 있습니다" sublabel="잠시만 기다려주세요" />;
  }
```

- [ ] **Step 4: 렌더 교체**

`return (` 이하에서 상단 인사말과 "풀이 해몽" `Card` 블록을 삭제하고, 카드 뒷면과 카테고리 섹션을 다음으로 구성한다.

```tsx
      <Text style={Typography.h1}>해몽 결과</Text>

      <Card title="당신의 꿈" style={styles.card}>
        <Text style={styles.bodyText}>{dreamText}</Text>
      </Card>

      <Text style={[Typography.caption, styles.cardSectionLabel]}>
        오늘 당신에게 드리운 상징 · 탭하면 해몽을 볼 수 있어요
      </Text>

      <View style={styles.cardWrapper}>
        {card && (
          <DreamCard
            card={card}
            flipped={cardFlipped}
            onToggleFlip={() => setCardFlipped(v => !v)}
            entrance
            renderBack={() => (
              <>
                <Text style={styles.cardBackTitle}>종합 해몽</Text>
                <Text style={styles.summaryText}>{reading?.summary}</Text>

                {!!reading?.oneLine && (
                  <>
                    <Divider style={styles.cardBackDivider} />
                    <Text style={styles.cardBackTitle}>오늘의 한마디</Text>
                    <Text style={styles.bodyText}>{reading.oneLine}</Text>
                  </>
                )}
              </>
            )}
          />
        )}
      </View>

      {cardFlipped &&
        ordered.map(c => (
          <Card key={c.key} title={CATEGORY_TITLES[c.key]} style={styles.card}>
            <Text style={styles.bodyText}>{c.body}</Text>
          </Card>
        ))}
```

카테고리 섹션이 `cardFlipped`에 걸려 있는 것이 핵심이다. 탭이 실제로 "열어보는" 동작이 되어야 한다.

- [ ] **Step 5: 개발자 패널 정리**

`__DEV__` 블록에서 "문장 분리 결과(DEV)" 카드를 삭제하고, 비용 표시를 새 응답 기준으로 바꾼다.

```tsx
          {devOpen && reading && (
            <Card title="해몽 호출(DEV)" style={styles.card}>
              <View style={styles.metaRow}>
                <Chip text={`in ${reading.inputToken} / out ${reading.outputToken}`} />
                <Chip text={getCostInfo(reading.totalCostUsd)} />
              </View>
              <Text style={styles.bodyText}>
                상징: {reading.symbols.join(', ') || '(매칭 없음)'}
              </Text>
            </Card>
          )}
```

- [ ] **Step 6: 타입 검사**

```bash
cd "D:/00 My Project/01 Monkey" && npx tsc --noEmit
```

Expected: 오류 0건

- [ ] **Step 7: Commit**

```bash
cd "D:/00 My Project/01 Monkey"
git add frontend/src/screens/ResultScreen.tsx
git commit -m "$(cat <<'EOF'
feat(frontend): 카드 우선 UX와 카테고리 해몽

문장별 "풀이 해몽" 카드를 없애고 /reading 단일 호출로 바꾼다. 카테고리
섹션은 카드를 탭한 뒤에만 나타나므로, 카드를 먼저 보고 열어보는 연출이
복구된다. 로딩 문구를 "당신의 꿈을 풀이하고 있습니다"로 바꿨다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: 성별 필드 제거

**Files:**
- Modify: `frontend/src/storage/userProfile.ts`
- Modify: `frontend/src/advice/profileContext.ts`
- Modify: `frontend/src/screens/ProfileScreen.tsx`

**Interfaces:**
- Consumes: 없음
- Produces: `saveUserProfile`가 `gender`를 받지 않는다. `Gender` 타입은 `userProfile.ts`에만 남는다(과거 저장값 읽기용).

- [ ] **Step 1: 저장 모듈에서 gender를 선택 항목으로 완화**

`frontend/src/storage/userProfile.ts`의 `saveUserProfile` 시그니처를 바꾼다. `Gender` 타입 정의와 `KEY_GENDER`, `loadUserProfile`의 `gender` 반환, `clearUserProfile`의 키는 **그대로 둔다** — 과거에 저장된 값이 남아 있고, 지우는 마이그레이션은 위험 대비 이득이 없다.

```typescript
export async function saveUserProfile(profile: {
  name: string;
  ageGroup?: AgeGroup;
  jobGroup?: JobGroup;
}) {
  const pairs: [string, string][] = [[KEY_NAME, profile.name]];

  if (profile.ageGroup) pairs.push([KEY_AGE_GROUP, profile.ageGroup]);
  if (profile.jobGroup) pairs.push([KEY_JOB_GROUP, profile.jobGroup]);

  await AsyncStorage.multiSet(pairs);
}
```

- [ ] **Step 2: profileContext.ts에서 죽은 코드 제거**

`frontend/src/advice/profileContext.ts`에서 다음을 삭제한다.

- `Gender` 타입 정의
- `formatGender` 함수
- `buildProfileContextForPrompt` 함수 — 프로필을 프롬프트에서 뺀 뒤로 이미 죽은 코드다
- `UserProfileForPrompt`의 `gender` 필드

`buildDisplayName`은 남긴다(다른 화면이 쓸 수 있다). `npx tsc --noEmit`으로 남은 참조를 찾는다.

- [ ] **Step 3: ProfileScreen에서 성별 UI 제거**

`frontend/src/screens/ProfileScreen.tsx`에서:

- `Gender` import, `gender` 상태, `genderOk`, `genderItems`, `setGender` 호출 전부 삭제
- `OpenSheet` 타입에서 `'gender'` 제거 → `type OpenSheet = 'age' | 'job' | null;`
- `openSheet === 'gender'` 분기 4곳(제목/항목/선택값/선택 처리) 삭제
- `showGender` 블록(264행 부근 JSX) 삭제
- 단계 조건을 재배선한다:

```typescript
  const showAge = nameOk;
  const showJob = nameOk && ageOk;
  const canFinish = nameOk && ageOk && jobOk;
```

- 저장 호출을 바꾼다:

```typescript
    if (!canFinish || !ageGroup || !jobGroup) return;
```

그리고 `saveUserProfile({ name, gender, ageGroup, jobGroup })` 에서 `gender`를 뺀다.

- 초기화 버튼의 `setGender(null)` 도 삭제한다.

- [ ] **Step 4: 타입 검사**

```bash
cd "D:/00 My Project/01 Monkey" && npx tsc --noEmit
```

Expected: 오류 0건

- [ ] **Step 5: Commit**

```bash
cd "D:/00 My Project/01 Monkey"
git add frontend/src/storage/userProfile.ts frontend/src/advice/profileContext.ts frontend/src/screens/ProfileScreen.tsx
git commit -m "$(cat <<'EOF'
refactor(frontend): 프로필에서 성별 제거

성별로 운세 비중을 바꿀 근거가 없고 편견으로 읽힐 소지만 있다. 온보딩을
이름 → 나이대 → 직업 3단계로 재배선했다. 과거에 저장된 gender 값은
읽지 않고 남겨둔다(마이그레이션 불필요).

buildProfileContextForPrompt는 프로필을 프롬프트에서 뺀 뒤로 죽은 코드였다.
함께 제거한다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: 죽은 코드 제거와 최종 검증

**Files:**
- Delete: `frontend/src/logic/AnalyzeSentence.ts`
- Delete: `frontend/src/logic/embedding.ts`

**Interfaces:**
- Consumes: Task 1~7 전부
- Produces: 없음

- [ ] **Step 1: 참조가 없는지 확인**

```bash
cd "D:/00 My Project/01 Monkey" && grep -rn "AnalyzeSentence\|analyzeSentence\|getEmbedding\|cosineSimilarity" frontend/src frontend/navigator.tsx App.tsx
```

Expected: 출력 없음. 남아 있으면 해당 참조를 먼저 지운다.

- [ ] **Step 2: 삭제**

```bash
cd "D:/00 My Project/01 Monkey"
git rm frontend/src/logic/AnalyzeSentence.ts frontend/src/logic/embedding.ts
```

SQLite `cache` 테이블은 **그대로 둔다.** 읽고 쓰지 않으면 무해하고, 과거에 트랜잭션 분리 문제로 테이블이 유실된 적이 있어 마이그레이션은 위험 대비 이득이 없다.

- [ ] **Step 3: 타입 검사**

```bash
cd "D:/00 My Project/01 Monkey" && npx tsc --noEmit
```

Expected: 오류 0건

- [ ] **Step 4: 백엔드 단위 테스트**

```bash
cd "D:/00 My Project/01 Monkey/backend" && python -m unittest test_reading_schema -v
```

Expected: `Ran 10 tests`, `OK`

- [ ] **Step 5: 에뮬레이터 실기 검증**

에뮬레이터를 띄우고 디버그 빌드를 설치한다.

```bash
cd "D:/00 My Project/01 Monkey/android" && ./gradlew.bat installDebug
```

Metro를 띄우고(`npx react-native start`), `adb reverse tcp:8081 tcp:8081` 후 앱을 실행해 다음을 육안 확인한다.

- 온보딩이 이름 → 나이대 → 직업 3단계로 진행되고 **성별 항목이 없다**
- 꿈을 입력하면 로딩 문구가 **"당신의 꿈을 풀이하고 있습니다"** 로 뜬다
- 해몽 결과에 **카드가 먼저** 보이고, 문장별 해몽 카드가 **없다**
- 카드를 탭하면 뒷면에 종합 해몽 + 오늘의 한마디가 나오고, **그 아래 카테고리 섹션이 함께 나타난다**
- 프로필을 학생으로 바꾸면 직장·학업운이 위로 올라온다(그 카테고리가 나온 경우)
- 꿈기록 탭에 새 기록이 저장되고 상세가 열린다
- **과거에 저장된 기록도 그대로 열린다** — 포맷이 바뀌었으므로 이것이 중요하다

한글 입력은 `adb shell input text`로 불가능하므로 에뮬레이터에서 직접 타이핑한다.

- [ ] **Step 6: 비용 실측 대조**

개발자 패널에서 `in`/`out` 토큰과 비용을 확인해 기존 실측치와 비교한다.

- 기존: 7회 호출 / 입력 ~5,800 / 출력 ~1,350 / **$0.0017**
- 목표: 1회 호출 / **$0.0006 내외**

$0.0010을 넘으면 `READING_INSTRUCTION`의 `summary` 문장 수와 `body` 길이 상한을 조인다.

- [ ] **Step 7: Commit**

```bash
cd "D:/00 My Project/01 Monkey"
git commit -m "$(cat <<'EOF'
refactor(frontend): 문장별 해몽·임베딩 캐시 코드 제거

캐시 단위가 문장에서 꿈 전문으로 바뀌면 적중률이 0에 수렴하고, 꿈 단위
유사도 매칭은 "다르게 쓴 꿈에 똑같은 해몽"이라는 더 큰 신뢰 문제를 만든다.
중복 제출은 기존 isLoading 버튼 비활성화로 막는다.

SQLite cache 테이블은 남겨둔다(마이그레이션 위험 회피).

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## 남은 정리 (이번 계획 범위 밖)

- 백엔드 구 엔드포인트 `/split`, `/interpret`, `/summary`, `/embed` 삭제. 새 흐름이 실기 검증된 뒤 별도 커밋으로.
- `docs/release/store-assets/screenshot-6-interpretation.png` 재캡처. 해몽 화면이 바뀌었다.
- `versionCode`를 3으로 올리고 AAB 재빌드 후 Play 업로드. versionCode 2는 이미 소진될 예정이다.
