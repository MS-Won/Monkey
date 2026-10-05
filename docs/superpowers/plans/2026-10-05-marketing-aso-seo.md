# 마케팅 1단계 — ASO + 해몽 사전 SEO 사이트 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Play 스토어 '해몽' 검색 순위를 올리기 위해 (A) 스토어 메타데이터·인앱 리뷰를 정비하고 (B) "~하는 꿈" 검색어를 받는 정적 해몽 사전 사이트를 GitHub Pages에 만든다.

**Architecture:** (A) 스토어 문구는 `docs/release/store-listing.md`를 단일 소스로 두고 콘솔에 수동 입력, 인앱 리뷰는 순수 판단 함수(`reviewPolicy.ts`) + 부수효과 래퍼(`inAppReview.ts`)로 나눠 `ResultScreen` 저장 직후 호출. (B) `scripts/seo/`의 Python 파이프라인이 `backend/dream_dictionary.json`을 근거로 GPT 원고(`content/haemong/*.json`)를 만들고, 사람이 검수(`reviewed:true`)한 것만 Jinja2로 `docs/haemong/`에 정적 HTML + `sitemap.xml`로 빌드한다.

**Tech Stack:** React Native 0.79 + TypeScript + Jest, `react-native-in-app-review`, Python 3.13 + `requests` + `python-dotenv` + `Jinja2` + `unittest`, GitHub Pages(`main`의 `/docs`).

## Global Constraints

- 스펙: `docs/superpowers/specs/2026-10-05-marketing-aso-seo-design.md` — 모든 태스크가 이를 따른다.
- 앱 제목: `꿈해몽 몽키 - 전통 해몽·꿈풀이·꿈일기` (≤30자). '1위'·'무료'·'최고'·이모지 금지.
- 자세한 설명에서 '해몽' 부분문자열 등장 횟수 6~8회. 키워드 나열 금지.
- 패키지명 `com.mswon.monkey`, 런처 표시명 "Monkey"는 변경 금지.
- 앱 버전: versionCode **5**, versionName **"1.3"**.
- 인앱 리뷰: 저장 성공 직후, 누적 저장 ≥ 3, 마지막 요청 후 90일 경과(또는 이력 없음)일 때만. 사전 팝업·별점 유도 문구 금지. 실패는 조용히 무시.
- AsyncStorage 키: `inAppReview.lastRequestedAt` (ISO 문자열).
- SEO 사이트 URL 루트: `https://ms-won.github.io/Monkey/haemong/`. 출력 디렉터리 `docs/haemong/`. `docs/index.html`(개인정보처리방침)은 수정 금지.
- 슬러그는 한글, 공백은 `-`.
- 상황 페이지 `<title>`·H1은 **상황명("~하는 꿈")으로 시작**, '해몽'은 뒤에 보조로. `<title>` ≤ 60자.
- `reviewed:false` 콘텐츠는 공개 산출물(`docs/haemong/`)에 절대 포함되지 않는다.
- 콘텐츠 원칙: 전통 한국 해몽 정설, 서양식·뉴에이지 해석 금지, 공포 연출 금지, 미래 단정 금지.
- CTA 링크: `https://play.google.com/store/apps/details?id=com.mswon.monkey&referrer=utm_source%3Dseo%26utm_campaign%3D<퍼센트인코딩 슬러그>`
- 페이지 하단 고지: `전통 해몽은 참고용이며 미래를 단정하지 않습니다.`
- 비밀: `OPENAI_API_KEY`는 저장소 루트 `.env`에서만 읽는다. 커밋 금지. 저장소 루트의 미추적 파일 `비공개테스트/`, `잊지말자비밀번호.txt`는 절대 `git add` 하지 않는다(항상 파일을 명시해 add).
- Python 테스트는 기존 `backend/test_*.py`와 같이 `unittest`를 쓴다.

### 스펙 대비 구현 결정 (스펙 보완)

- 스크립트 파일명은 import·테스트를 위해 하이픈 대신 밑줄: `gen_situations.py`, `build_site.py`.
- 사전 표제어 중 동작형(`이빨빠짐`, `물에빠짐`, `날다`, `쫓김` 등)은 "ㅇㅇ꿈"이 어색하므로, 콘텐츠 스키마에 **`hub_name`**(검색창에 치는 대표 이름: "돼지꿈", "이빨 빠지는 꿈")을 추가하고, 상징(허브) 페이지 슬러그는 `slugify(hub_name)`로 한다. 예: `/haemong/돼지꿈/`, `/haemong/이빨-빠지는-꿈/`.

---

## 파일 구조

| 파일 | 책임 |
|---|---|
| `docs/release/store-listing.md` (수정) | 스토어 문구 단일 소스 |
| `scripts/gen-store-screenshots.py` (수정) | `SHOTS` 캡션만 |
| `scripts/gen-store-graphics.ps1` (수정) | 하드코딩 경로 → `$PSScriptRoot` 기준, 피처 그래픽 문구 |
| `docs/marketing/rank-log.md` (신규) | 주간 순위·지표 기록 |
| `docs/marketing/seo-registration.md` (신규) | 검색엔진 등록 체크리스트·결과 |
| `docs/marketing/content-review.md` (신규) | 원고 검수 가이드 |
| `frontend/src/logic/reviewPolicy.ts` (신규) | 순수 판단 함수 `shouldRequestReview` |
| `frontend/src/logic/__tests__/reviewPolicy.test.ts` (신규) | Jest |
| `frontend/src/storage/inAppReview.ts` (신규) | AsyncStorage + 네이티브 API 래퍼 `maybeRequestReview` |
| `frontend/src/screens/ResultScreen.tsx` (수정) | 저장 직후 `maybeRequestReview` 호출 |
| `android/app/build.gradle` (수정) | versionCode 5 / versionName 1.3 |
| `docs/release/release-notes-v1.3.md` (신규) | 출시 노트 |
| `scripts/seo/requirements.txt` (신규) | requests, python-dotenv, Jinja2 |
| `scripts/seo/haemong_content.py` (신규) | 스키마 검증·슬러그·로딩 |
| `scripts/seo/gen_situations.py` (신규) | GPT 원고 생성 |
| `scripts/seo/build_site.py` (신규) | 페이지 계획·렌더·사이트맵·CLI |
| `scripts/seo/templates/*.html.j2` (신규) | base/index/hub/situation 템플릿 |
| `scripts/seo/test_*.py` (신규) | unittest |
| `content/haemong/<표제어>.json` (생성물, 커밋) | 원고 |
| `docs/haemong/**` (빌드 산출물, 커밋) | 공개 사이트 |

---

## Part A — ASO + 인앱 리뷰

### Task 1: 스토어 문구 교체 + 순위 기준선 기록

**Files:**
- Modify: `docs/release/store-listing.md` (`## 기본`, `## 자세한 설명` 섹션)
- Create: `docs/marketing/rank-log.md`

**Interfaces:**
- Consumes: 없음
- Produces: 확정 문구(Task 2 캡션 톤 참고), `rank-log.md` 표 형식(Task 13에서 SEO 지표 열 사용)

- [ ] **Step 1: `store-listing.md`의 `## 기본` 섹션 교체**

```markdown
## 기본
- **앱 이름(제목, 최대 30자)**: `꿈해몽 몽키 - 전통 해몽·꿈풀이·꿈일기`
- **짧은 설명(최대 80자)**:
  `어젯밤 꿈, 전통 해몽으로 풀어봐요. 태몽·길몽부터 꿈풀이·꿈일기까지 한 번에.`
```

- [ ] **Step 2: `## 자세한 설명(최대 4000자)` 코드블록 내용 교체**

```
어젯밤 꾼 꿈이 마음에 남아 있나요? 몽키는 한국 전통 해몽으로 꿈을 풀어 주고, 매일의 꿈을 기록해 두는 꿈해몽 앱입니다.

■ 전통 해몽에 뿌리를 둔 꿈풀이
서양식 꿈 심리가 아니라 옛사람들이 전해 온 한국 전통 해석을 근거로 풀어 드립니다.
돼지꿈, 뱀꿈, 똥꿈, 이빨 빠지는 꿈, 물에 빠지는 꿈, 조상꿈처럼 자주 꾸는 꿈의 상징을 전통 해몽 사전과 맞춰 읽고, 마주 앉은 이야기꾼처럼 차분한 말투로 들려 드립니다.

■ 긴 꿈도 통째로
한 줄이든 여러 장면이 이어지는 긴 꿈이든 그대로 적거나 말로 들려주세요.
종합 풀이와 함께 인간관계·재물운·직장·학업운·건강운·주의할 점을 나눠서 읽어 드립니다.

■ 태몽·길몽·흉몽이 궁금할 때
태몽인지, 재물이 들어오는 길몽인지, 조심하라는 꿈인지 옛 해몽의 시선으로 짚어 드립니다.
흉해 보이는 꿈이 오히려 좋은 꿈인 경우(역몽)도 함께 알려 드립니다.

■ 아르누보 꿈 카드
풀이와 함께 그 꿈에 어울리는 아르누보풍 여신 카드 한 장을 뽑아 드립니다. 30종의 카드가 꿈마다 다르게 찾아옵니다.

■ 꿈일기와 통계
꿈 기록, 해몽, 카드가 자동으로 꿈일기에 쌓입니다. 통계 탭에서 최근 자주 나타난 꿈 상징과 기록 흐름을 한눈에 볼 수 있습니다.

■ 프라이버시
계정 없이 바로 쓸 수 있고, 꿈 기록은 기기 안에만 저장됩니다. 풀이를 만들기 위해 꿈 텍스트만 안전하게 처리합니다.

※ 해몽과 '행운력' 콘텐츠는 전통과 재미를 위한 참고용이며, 미래를 단정하는 예언이 아닙니다.
```

- [ ] **Step 3: 길이·키워드 횟수 검증**

Run (Bash):
```bash
cd /d/MyProject/monkey && PYTHONIOENCODING=utf-8 python - <<'EOF'
import re
t = open('docs/release/store-listing.md', encoding='utf-8').read()
title = re.search(r"앱 이름.*?`(.+?)`", t).group(1)
short = re.search(r"짧은 설명.*?\n\s*`(.+?)`", t, re.S).group(1)
full = re.search(r"## 자세한 설명.*?```\n(.*?)```", t, re.S).group(1)
print(len(title), len(short), len(full), full.count('해몽'))
assert len(title) <= 30 and len(short) <= 80 and len(full) <= 4000
assert 6 <= full.count('해몽') <= 8
print('OK')
EOF
```
Expected: 마지막 줄 `OK` (첫 줄 예: `22 4x 7xx 7`).

- [ ] **Step 4: `docs/marketing/rank-log.md` 생성 (기준선 포함)**

```markdown
# 검색 순위·유입 기록

주 1회 기록. Play 순위는 `https://play.google.com/store/search?q=<검색어>&c=apps&hl=ko&gl=KR` 결과에서 몽키의 위치(상위 15위 밖이면 `15+`).
목표: '해몽' 4주 내 15위 이내, 8주 내 10위 이내, 3~6개월 내 1위.

| 날짜 | 해몽 | 꿈해몽 | 꿈풀이 | 스토어 방문→설치 전환율 | Play 유입 검색어 상위 | GSC 노출 | GSC 클릭 | 네이버 유입 | utm_source=seo 설치 | 메모 |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-10-05 | 15+ | - | - | - | - | - | - | - | - | 기준선. 메타데이터 교체 전. 상위권은 "상세한 꿈해몽", "꿈해몽 \| AI 꿈몽가", "꿈해몽 - 오늘의 운세, 로또 추천" |
```

- [ ] **Step 5: Commit**

```bash
git add docs/release/store-listing.md docs/marketing/rank-log.md
git commit -m "docs(aso): 스토어 제목·설명을 해몽 검색 키워드 중심으로 재작성 + 순위 기록표

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 6: (사용자 수동) Play Console 입력**

Play Console → 몽키 → 스토어 등록정보 → 기본 스토어 등록정보에 제목/짧은 설명/자세한 설명을 붙여넣고 저장 → 검토 제출. 반영 날짜를 `rank-log.md` 메모 열에 기록.

---

### Task 2: 스크린샷 캡션·피처 그래픽 문구 갱신

**Files:**
- Modify: `scripts/gen-store-screenshots.py` (`SHOTS` 리스트, 45~76행)
- Modify: `scripts/gen-store-graphics.ps1` (20, 24, 98, 105~107행)
- 재생성: `docs/release/store-assets/screenshot-*.png`, `docs/release/store-assets/feature-graphic-1024x500.png`

**Interfaces:**
- Consumes: Task 1 문구 톤
- Produces: 교체된 PNG (콘솔 업로드용)

- [ ] **Step 1: `SHOTS`의 headline/sub를 아래로 교체** (`out`/`raw` 값은 그대로)

```python
SHOTS = [
    {
        "out": "screenshot-2-home.png",
        "raw": "2-home.png",
        "headline": ["어젯밤 꿈,", "전통 해몽으로 풀어드려요"],
        "sub": "긴 꿈도 통째로 · 텍스트로도 음성으로도",
    },
    {
        "out": "screenshot-3-diary-cards.png",
        "raw": "3-diary-cards.png",
        "headline": ["꿈일기는 한 장의", "카드로 쌓입니다"],
        "sub": "넘겨보며 지난 꿈을 다시 만나요",
    },
    {
        "out": "screenshot-4-stats.png",
        "raw": "4-stats.png",
        "headline": ["내 꿈의 흐름을", "한눈에"],
        "sub": "자주 나타난 꿈 상징과 그 뜻, 기록 추이",
    },
    {
        "out": "screenshot-5-card.png",
        "raw": "5-card.png",
        "headline": ["오늘의 꿈에", "드리운 상징 한 장"],
        "sub": "아르누보 감성의 꿈 카드",
    },
    {
        "out": "screenshot-6-interpretation.png",
        "raw": "6-interpretation.png",
        "headline": ["태몽·길몽·꿈풀이까지", "나눠서 읽어드려요"],
        "sub": "종합 해몽 · 관계 · 재물 · 직장 · 건강",
    },
]
```

- [ ] **Step 2: 스크린샷 재생성**

Run: `cd /d/MyProject/monkey && python scripts/gen-store-screenshots.py`
Expected: 5개 파일 저장 로그, 에러 없음.

- [ ] **Step 3: 육안 확인** — Read 도구로 `docs/release/store-assets/screenshot-2-home.png`, `screenshot-6-interpretation.png`를 열어 headline 한 줄이 캔버스 밖으로 넘치지 않는지 확인. 넘치면 해당 줄을 두 줄로 나눠(`headline` 원소 분리) 다시 Step 2.

- [ ] **Step 4: `gen-store-graphics.ps1` 경로·폰트·문구 수정**

20행과 24행 교체:
```powershell
$outDir = Join-Path $PSScriptRoot '..\docs\release\store-assets'
```
```powershell
$iconSrc  = Join-Path $outDir 'icon.png'
```
98행 교체(Georgia는 한글 글리프가 없음):
```powershell
$titleFont = New-Object System.Drawing.Font('Malgun Gothic', 76, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
```
105~107행 교체:
```powershell
$fg.DrawString('몽키', $titleFont, $ivoryBrush, [single]$tx, [single]($H*0.30))
$fg.DrawString('꿈해몽 · 꿈을 풀다', $tagFont, $holoBrush, [single]($tx+4), [single]($H*0.52))
$fg.DrawString('전통 해몽 · 꿈풀이 · 꿈일기 · 아르누보 카드', $subFont, $mutedBrush, [single]($tx+4), [single]($H*0.66))
```

- [ ] **Step 5: 피처 그래픽 재생성 + 육안 확인**

Run (PowerShell): `& "scripts\gen-store-graphics.ps1"`
그 후 Read 도구로 `docs/release/store-assets/feature-graphic-1024x500.png` 확인: 한글이 네모(□)로 깨지지 않고, 서브 문구가 오른쪽 끝에서 잘리지 않음. 잘리면 `$subFont` 크기를 24→22로 낮추고 재실행.

- [ ] **Step 6: Commit**

```bash
git add scripts/gen-store-screenshots.py scripts/gen-store-graphics.ps1 docs/release/store-assets/screenshot-*.png docs/release/store-assets/feature-graphic-1024x500.png
git commit -m "chore(store-assets): 캡션·피처 그래픽에 해몽 키워드 반영 + 그래픽 스크립트 경로 상대화

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 7: (사용자 수동)** Play Console 스토어 등록정보에서 스크린샷 5장과 피처 그래픽을 교체 업로드.

---

### Task 3: 인앱 리뷰 판단 함수 (TDD)

**Files:**
- Create: `frontend/src/logic/reviewPolicy.ts`
- Test: `frontend/src/logic/__tests__/reviewPolicy.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const MIN_SAVED_COUNT = 3;
  export const REQUEST_INTERVAL_MS = 90 * 24 * 60 * 60 * 1000;
  export interface ReviewPolicyInput {
    savedCount: number;
    lastRequestedAt: string | null; // ISO
    now: Date;
    lastResultOk: boolean;
  }
  export function shouldRequestReview(input: ReviewPolicyInput): boolean;
  ```

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
import {
  MIN_SAVED_COUNT,
  REQUEST_INTERVAL_MS,
  shouldRequestReview,
} from '../reviewPolicy';

const NOW = new Date('2026-10-05T12:00:00.000Z');
const base = {savedCount: 3, lastRequestedAt: null, now: NOW, lastResultOk: true};

describe('shouldRequestReview', () => {
  it('저장 3회 이상 + 요청 이력 없음 → true', () => {
    expect(shouldRequestReview(base)).toBe(true);
  });

  it('저장 횟수가 기준 미만이면 false', () => {
    expect(shouldRequestReview({...base, savedCount: MIN_SAVED_COUNT - 1})).toBe(false);
  });

  it('직전 해몽이 실패면 false', () => {
    expect(shouldRequestReview({...base, lastResultOk: false})).toBe(false);
  });

  it('마지막 요청 후 90일이 안 지났으면 false', () => {
    const last = new Date(NOW.getTime() - REQUEST_INTERVAL_MS + 1000).toISOString();
    expect(shouldRequestReview({...base, savedCount: 10, lastRequestedAt: last})).toBe(false);
  });

  it('마지막 요청 후 정확히 90일 지났으면 true', () => {
    const last = new Date(NOW.getTime() - REQUEST_INTERVAL_MS).toISOString();
    expect(shouldRequestReview({...base, savedCount: 10, lastRequestedAt: last})).toBe(true);
  });

  it('lastRequestedAt이 깨진 문자열이면 이력 없음으로 본다', () => {
    expect(shouldRequestReview({...base, lastRequestedAt: 'garbage'})).toBe(true);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `cd /d/MyProject/monkey && npx jest frontend/src/logic/__tests__/reviewPolicy.test.ts`
Expected: FAIL — `Cannot find module '../reviewPolicy'`

- [ ] **Step 3: 구현**

```ts
// 인앱 리뷰 요청 여부 판단 — 부수효과 없는 순수 함수.
// 만족도가 높을 시점(해몽 저장 성공 직후)에만, 너무 잦지 않게 띄운다.

export const MIN_SAVED_COUNT = 3;
export const REQUEST_INTERVAL_MS = 90 * 24 * 60 * 60 * 1000;

export interface ReviewPolicyInput {
  savedCount: number;
  lastRequestedAt: string | null;
  now: Date;
  lastResultOk: boolean;
}

export function shouldRequestReview({
  savedCount,
  lastRequestedAt,
  now,
  lastResultOk,
}: ReviewPolicyInput): boolean {
  if (!lastResultOk) return false;
  if (savedCount < MIN_SAVED_COUNT) return false;

  const last = lastRequestedAt ? Date.parse(lastRequestedAt) : NaN;
  if (Number.isNaN(last)) return true;

  return now.getTime() - last >= REQUEST_INTERVAL_MS;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx jest frontend/src/logic/__tests__/reviewPolicy.test.ts`
Expected: PASS, 6 tests.

(만약 `preset: 'react-native'` 환경 문제로 순수 TS 테스트가 돌지 않으면, `jest.config.js`에 `testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/']`만 추가하고 원인을 기록. 다른 설정 변경 금지.)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/logic/reviewPolicy.ts frontend/src/logic/__tests__/reviewPolicy.test.ts
git commit -m "feat(review): 인앱 리뷰 요청 판단 순수 함수 + 테스트

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: 인앱 리뷰 연동 + versionCode 5 빌드

**Files:**
- Modify: `package.json`, `package-lock.json` (의존성 추가)
- Create: `frontend/src/storage/inAppReview.ts`
- Modify: `frontend/src/screens/ResultScreen.tsx:22` (import), `:136` (저장 직후 호출)
- Modify: `android/app/build.gradle:98-99`
- Create: `docs/release/release-notes-v1.3.md`

**Interfaces:**
- Consumes: `shouldRequestReview`, `getAllDreamDiaries(): Promise<DreamDiaryRow[]>` (`frontend/src/database/initDB.ts:114`)
- Produces: `export async function maybeRequestReview(): Promise<void>` — 절대 throw 하지 않음.

- [ ] **Step 1: 의존성 설치**

Run: `cd /d/MyProject/monkey && npm install react-native-in-app-review`
Expected: 설치 성공. (자동 링크되므로 네이티브 수동 설정 없음.)

- [ ] **Step 2: `frontend/src/storage/inAppReview.ts` 작성**

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import InAppReview from 'react-native-in-app-review';
import {getAllDreamDiaries} from '../database/initDB';
import {shouldRequestReview} from '../logic/reviewPolicy';

const KEY_LAST_REQUESTED_AT = 'inAppReview.lastRequestedAt';

// 해몽 저장 성공 직후 호출한다. 어떤 실패도 앱 흐름을 막지 않도록 전부 삼킨다.
// 참고: saveDreamDiary는 결과를 기다리지 않으므로 방금 저장한 행이 아직 안 세어질 수 있다.
// 그 경우 다음 저장에서 조건을 만족하므로 문제없다.
export async function maybeRequestReview(): Promise<void> {
  try {
    if (!InAppReview.isAvailable()) return;

    const [rows, lastRequestedAt] = await Promise.all([
      getAllDreamDiaries(),
      AsyncStorage.getItem(KEY_LAST_REQUESTED_AT),
    ]);

    const ok = shouldRequestReview({
      savedCount: rows.length,
      lastRequestedAt,
      now: new Date(),
      lastResultOk: true,
    });
    if (!ok) return;

    // Google이 실제로 창을 띄울지는 자체 쿼터로 결정한다. 요청 시각은 호출 기준으로 남긴다.
    await AsyncStorage.setItem(KEY_LAST_REQUESTED_AT, new Date().toISOString());
    await InAppReview.RequestInAppReview();
  } catch (e) {
    if (__DEV__) console.log('[inAppReview] skipped:', e);
  }
}
```

- [ ] **Step 3: `ResultScreen.tsx` 연동**

22행 아래에 import 추가:
```ts
import {maybeRequestReview} from '../storage/inAppReview';
```
136행 `saveDreamDiary(...)` 바로 다음 줄에 추가(같은 `try` 블록 안 — 실패 경로에서는 도달하지 않음):
```ts
        saveDreamDiary(dreamText, finalText, drawnCard.name, luckyScore);
        maybeRequestReview();
```

- [ ] **Step 4: 타입체크 + 테스트**

Run: `npx tsc --noEmit && npx jest frontend/src/logic`
Expected: tsc 0 오류, jest PASS.
(`react-native-in-app-review`에 타입이 없어 tsc가 실패하면 `frontend/src/types/env.d.ts`에 `declare module 'react-native-in-app-review';`를 추가.)

- [ ] **Step 5: 버전 올리기** — `android/app/build.gradle` 98~99행:

```gradle
        versionCode 5
        versionName "1.3"
```

- [ ] **Step 6: 출시 노트 작성** — `docs/release/release-notes-v1.3.md`:

````markdown
# 출시 노트 — versionName 1.3 / versionCode 5

Play Console "새 버전 만들기 → 출시 노트"에 그대로 붙여넣기. 언어: 한국어 – 대한민국 (`<ko-KR>`)

## 붙여넣기용

```
몽키를 찾아 주셔서 감사합니다.

• 꿈해몽을 몇 번 받아 보신 뒤, 앱 안에서 바로 리뷰를 남기실 수 있게 했습니다.
• 스토어 소개와 화면 안내를 새로 다듬었습니다.

남겨 주시는 한 줄 리뷰가 더 나은 해몽을 만드는 데 큰 힘이 됩니다.
```
````

- [ ] **Step 7: 에뮬레이터 스모크 테스트**

Run: `npm run android` 후 꿈 3회 해몽 → 앱이 멈추거나 오류 Alert 없이 결과 화면 정상 표시되는지 확인. (에뮬 디버그 빌드는 Play 설치본이 아니므로 리뷰 창이 뜨지 않는 게 정상.)

- [ ] **Step 8: 릴리스 AAB 빌드**

Run (PowerShell): `cd android; .\gradlew bundleRelease; cd ..`
Expected: `BUILD SUCCESSFUL`.
검증: `ls -la android/app/build/outputs/bundle/release/app-release.aab` 의 수정 시각이 방금이어야 한다.
versionCode/versionName은 업로드 시 Play Console이 표시하는 값(5 / 1.3)으로 최종 대조한다.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json frontend/src/storage/inAppReview.ts frontend/src/screens/ResultScreen.tsx android/app/build.gradle docs/release/release-notes-v1.3.md
git commit -m "feat(review): 해몽 저장 3회 이후 인앱 리뷰 요청 + versionCode 5 / 1.3

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 10: (사용자 수동)** Play Console 내부 테스트 트랙에 AAB 업로드 → Play에서 설치 → 해몽 3회 후 리뷰 창 확인(창이 안 떠도 Google 쿼터 때문일 수 있음; 앱이 멈추지 않으면 통과) → 프로덕션 출시.

---

## Part B — 해몽 사전 SEO 사이트

### Task 5: 네이버 서치어드바이저 등록 가능성 확인

**Files:**
- Create: `docs/marketing/seo-registration.md`

**Interfaces:**
- Produces: 네이버 등록 방식 결정(가능 / 수집 요청 우회 / 커스텀 도메인 재검토 → 사용자 결정)

- [ ] **Step 1: 공식 도움말 조사** — WebFetch/WebSearch로 `searchadvisor.naver.com` 도움말에서 "하위 디렉터리(경로) 사이트 등록" 지원 여부와 `github.io` 사례 확인.

- [ ] **Step 2: `docs/marketing/seo-registration.md` 작성**

```markdown
# 검색엔진 등록 체크리스트

사이트: https://ms-won.github.io/Monkey/haemong/
사이트맵: https://ms-won.github.io/Monkey/haemong/sitemap.xml

## 구글 서치콘솔
- [ ] https://search.google.com/search-console → 속성 추가 → **URL 접두어** `https://ms-won.github.io/Monkey/`
- [ ] 인증 방법 "HTML 파일" → 받은 `googleXXXX.html`을 저장소 `docs/`에 넣고 커밋·푸시 → 인증
- [ ] Sitemaps → `haemong/sitemap.xml` 제출
- [ ] URL 검사로 인기 페이지 3개 색인 요청

## 네이버 서치어드바이저
- 조사 결과(YYYY-MM-DD): <Step 1 결과를 여기에 기록>
- [ ] https://searchadvisor.naver.com → 웹마스터 도구 → 사이트 등록 `https://ms-won.github.io/Monkey/` 시도
- [ ] 성공 시: HTML 파일 인증(`docs/`에 배치) → 요청 → 사이트맵 제출 `https://ms-won.github.io/Monkey/haemong/sitemap.xml`
- [ ] 실패 시: 결과를 이 문서에 기록하고 사용자에게 (a) 웹 페이지 수집 요청으로 우회 (b) 커스텀 도메인 구입 중 선택 요청
```

- [ ] **Step 3: (사용자 수동)** 네이버 사이트 등록을 실제로 시도하고 결과를 알려줌 → 문서의 조사 결과/체크 갱신. 실패 시 이 태스크에서 멈추고 사용자 결정을 받는다(Part B의 나머지 태스크는 결정과 무관하게 진행 가능).

- [ ] **Step 4: Commit**

```bash
git add docs/marketing/seo-registration.md
git commit -m "docs(seo): 검색엔진 등록 체크리스트 + 네이버 하위경로 등록 조사

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: 콘텐츠 스키마·슬러그·로더 (TDD)

**Files:**
- Create: `scripts/seo/requirements.txt`
- Create: `scripts/seo/haemong_content.py`
- Test: `scripts/seo/test_haemong_content.py`

**Interfaces:**
- Produces:
  ```python
  POLARITIES: tuple[str, ...] = ("길", "흉", "중립", "양면")
  class ContentError(ValueError): ...
  def slugify(text: str) -> str
  def validate_content(data: dict, source: str = "") -> None   # 실패 시 ContentError
  def load_contents(content_dir: Path) -> list[dict]            # 검증 후 symbol 가나다순
  ```
  콘텐츠 dict 키: `symbol, hub_name, slug, polarity, summary, situations[{title, slug, aliases, polarity, body}], reviewed, generated_at`

- [ ] **Step 1: `scripts/seo/requirements.txt`**

```
requests==2.32.3
python-dotenv==1.0.1
Jinja2==3.1.6
```

- [ ] **Step 2: 실패하는 테스트 작성** — `scripts/seo/test_haemong_content.py`

```python
import json
import tempfile
import unittest
from pathlib import Path

from haemong_content import ContentError, load_contents, slugify, validate_content

BODY = "가" * 450


def make_content(**over):
    data = {
        "symbol": "돼지",
        "hub_name": "돼지꿈",
        "slug": "돼지꿈",
        "polarity": "길",
        "summary": BODY,
        "situations": [
            {"title": "돼지가 집에 들어오는 꿈", "slug": "돼지가-집에-들어오는-꿈",
             "aliases": ["돼지가 집에 들어온 꿈"], "polarity": "길", "body": BODY},
            {"title": "돼지에게 물리는 꿈", "slug": "돼지에게-물리는-꿈",
             "aliases": ["돼지한테 물리는 꿈"], "polarity": "길", "body": BODY},
            {"title": "돼지를 안는 꿈", "slug": "돼지를-안는-꿈",
             "aliases": ["돼지를 안고 있는 꿈"], "polarity": "길", "body": BODY},
        ],
        "reviewed": False,
        "generated_at": "2026-10-05",
    }
    data.update(over)
    return data


class SlugifyTest(unittest.TestCase):
    def test_spaces_become_hyphens(self):
        self.assertEqual(slugify(" 돼지가  집에 들어오는 꿈 "), "돼지가-집에-들어오는-꿈")

    def test_strips_punctuation(self):
        self.assertEqual(slugify("이빨이 빠지는 꿈?!"), "이빨이-빠지는-꿈")

    def test_middle_dot_and_slash_removed(self):
        self.assertEqual(slugify("뱀·용/꿈"), "뱀용꿈")


class ValidateContentTest(unittest.TestCase):
    def test_valid(self):
        validate_content(make_content())

    def test_missing_key(self):
        data = make_content()
        del data["hub_name"]
        with self.assertRaises(ContentError):
            validate_content(data)

    def test_bad_polarity(self):
        with self.assertRaises(ContentError):
            validate_content(make_content(polarity="대길"))

    def test_too_few_situations(self):
        data = make_content()
        data["situations"] = data["situations"][:2]
        with self.assertRaises(ContentError):
            validate_content(data)

    def test_slug_must_match_title(self):
        data = make_content()
        data["situations"][0]["slug"] = "엉뚱한-슬러그"
        with self.assertRaises(ContentError):
            validate_content(data)

    def test_hub_slug_must_match_hub_name(self):
        with self.assertRaises(ContentError):
            validate_content(make_content(slug="돼지"))

    def test_situation_title_must_end_with_kkum(self):
        data = make_content()
        data["situations"][0]["title"] = "돼지가 집에 들어옴"
        data["situations"][0]["slug"] = slugify("돼지가 집에 들어옴")
        with self.assertRaises(ContentError):
            validate_content(data)

    def test_body_too_short(self):
        data = make_content()
        data["situations"][1]["body"] = "짧다"
        with self.assertRaises(ContentError):
            validate_content(data)

    def test_reviewed_must_be_bool(self):
        with self.assertRaises(ContentError):
            validate_content(make_content(reviewed="yes"))


class LoadContentsTest(unittest.TestCase):
    def test_sorted_by_symbol_and_validated(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d)
            for sym, hub in [("뱀", "뱀꿈"), ("돼지", "돼지꿈")]:
                c = make_content(symbol=sym, hub_name=hub, slug=hub)
                (p / f"{sym}.json").write_text(json.dumps(c, ensure_ascii=False), encoding="utf-8")
            loaded = load_contents(p)
            self.assertEqual([c["symbol"] for c in loaded], ["돼지", "뱀"])

    def test_invalid_file_raises_with_filename(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d)
            (p / "깨짐.json").write_text(json.dumps(make_content(polarity="x"), ensure_ascii=False), encoding="utf-8")
            with self.assertRaises(ContentError) as cm:
                load_contents(p)
            self.assertIn("깨짐.json", str(cm.exception))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 3: 실패 확인**

Run: `cd /d/MyProject/monkey && python -m unittest discover -s scripts/seo -p "test_haemong_content.py" -v`
Expected: `ModuleNotFoundError: No module named 'haemong_content'`

- [ ] **Step 4: 구현** — `scripts/seo/haemong_content.py`

```python
"""해몽 사전 SEO 콘텐츠(content/haemong/*.json)의 스키마·슬러그·로딩.

gen_situations.py(생성)와 build_site.py(빌드)가 공유하는 단일 규칙.
"""
import json
import re
from pathlib import Path

POLARITIES = ("길", "흉", "중립", "양면")
MIN_SITUATIONS, MAX_SITUATIONS = 3, 5
# 스펙은 400~700자. 생성 편차를 감안해 검증은 넉넉하게 잡는다.
MIN_BODY, MAX_BODY = 300, 1000


class ContentError(ValueError):
    pass


def slugify(text: str) -> str:
    """한글 슬러그: 공백 → '-', 글자·숫자·'-' 외 제거."""
    s = re.sub(r"\s+", "-", text.strip())
    s = re.sub(r"[^\w\-]", "", s).replace("_", "")
    return re.sub(r"-{2,}", "-", s).strip("-")


def _fail(source: str, msg: str):
    raise ContentError(f"{source}: {msg}" if source else msg)


def _check_text(source, label, value):
    if not isinstance(value, str) or not (MIN_BODY <= len(value) <= MAX_BODY):
        n = len(value) if isinstance(value, str) else "비문자열"
        _fail(source, f"{label} 길이 {n} (허용 {MIN_BODY}~{MAX_BODY})")


def validate_content(data: dict, source: str = "") -> None:
    for key in ("symbol", "hub_name", "slug", "polarity", "summary", "situations", "reviewed", "generated_at"):
        if key not in data:
            _fail(source, f"필수 키 없음: {key}")
    if data["polarity"] not in POLARITIES:
        _fail(source, f"polarity 값 오류: {data['polarity']}")
    if data["slug"] != slugify(data["hub_name"]):
        _fail(source, f"slug '{data['slug']}' ≠ slugify(hub_name) '{slugify(data['hub_name'])}'")
    if not isinstance(data["reviewed"], bool):
        _fail(source, "reviewed는 true/false여야 함")
    _check_text(source, "summary", data["summary"])

    sits = data["situations"]
    if not isinstance(sits, list) or not (MIN_SITUATIONS <= len(sits) <= MAX_SITUATIONS):
        _fail(source, f"situations 개수는 {MIN_SITUATIONS}~{MAX_SITUATIONS}개")
    for i, s in enumerate(sits):
        where = f"situations[{i}]"
        for key in ("title", "slug", "aliases", "polarity", "body"):
            if key not in s:
                _fail(source, f"{where} 필수 키 없음: {key}")
        if not s["title"].strip().endswith("꿈"):
            _fail(source, f"{where} title은 '~꿈'으로 끝나야 함: {s['title']}")
        if s["slug"] != slugify(s["title"]):
            _fail(source, f"{where} slug ≠ slugify(title)")
        if s["polarity"] not in POLARITIES:
            _fail(source, f"{where} polarity 값 오류")
        if not isinstance(s["aliases"], list) or not all(isinstance(a, str) for a in s["aliases"]):
            _fail(source, f"{where} aliases는 문자열 목록")
        _check_text(source, f"{where}.body", s["body"])


def load_contents(content_dir: Path) -> list:
    contents = []
    for path in sorted(Path(content_dir).glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        validate_content(data, source=path.name)
        contents.append(data)
    return sorted(contents, key=lambda c: c["symbol"])
```

- [ ] **Step 5: 통과 확인**

Run: `python -m unittest discover -s scripts/seo -p "test_haemong_content.py" -v`
Expected: 모두 OK.

- [ ] **Step 6: Commit**

```bash
git add scripts/seo/requirements.txt scripts/seo/haemong_content.py scripts/seo/test_haemong_content.py
git commit -m "feat(seo): 해몽 콘텐츠 스키마 검증·한글 슬러그·로더

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: GPT 원고 생성기 (TDD — 네트워크 제외)

**Files:**
- Create: `scripts/seo/gen_situations.py`
- Test: `scripts/seo/test_gen_situations.py`

**Interfaces:**
- Consumes: `slugify`, `validate_content`, `ContentError` (Task 6)
- Produces:
  ```python
  def build_messages(entry: dict) -> list[dict]      # entry = dream_dictionary.json의 symbols[i]
  def parse_generation(raw: str, entry: dict, today: str) -> dict   # 검증된 콘텐츠 dict
  def main(argv: list[str] | None = None) -> int     # CLI: --force, --only <표제어>
  ```
  출력: `content/haemong/<표제어>.json`

- [ ] **Step 1: 실패하는 테스트 작성** — `scripts/seo/test_gen_situations.py`

```python
import json
import unittest

from gen_situations import build_messages, parse_generation
from haemong_content import ContentError

ENTRY = {
    "표제어": "돼지",
    "동의어": ["멧돼지", "돼지새끼"],
    "의미": "재물과 복의 상징.",
    "극성": "길",
    "비고": "",
}
BODY = "나" * 450


def raw_response(**over):
    data = {
        "hub_name": "돼지꿈",
        "summary": BODY,
        "situations": [
            {"title": "돼지가 집에 들어오는 꿈", "aliases": ["집에 돼지가 들어오는 꿈"], "polarity": "길", "body": BODY},
            {"title": "돼지에게 물리는 꿈", "aliases": ["돼지한테 물리는 꿈"], "polarity": "길", "body": BODY},
            {"title": "돼지를 안는 꿈", "aliases": ["돼지를 안고 있는 꿈"], "polarity": "길", "body": BODY},
        ],
    }
    data.update(over)
    return json.dumps(data, ensure_ascii=False)


class BuildMessagesTest(unittest.TestCase):
    def test_grounding_and_rules_present(self):
        msgs = build_messages(ENTRY)
        self.assertEqual([m["role"] for m in msgs], ["system", "user"])
        system, user = msgs[0]["content"], msgs[1]["content"]
        for rule in ("전통", "서양식", "공포", "단정"):
            self.assertIn(rule, system)
        for value in ("돼지", "멧돼지", "재물과 복의 상징.", "길"):
            self.assertIn(value, user)
        self.assertIn("~는 꿈", user)


class ParseGenerationTest(unittest.TestCase):
    def test_fills_derived_fields(self):
        data = parse_generation(raw_response(), ENTRY, "2026-10-05")
        self.assertEqual(data["symbol"], "돼지")
        self.assertEqual(data["slug"], "돼지꿈")
        self.assertEqual(data["polarity"], "길")
        self.assertFalse(data["reviewed"])
        self.assertEqual(data["generated_at"], "2026-10-05")
        self.assertEqual(data["situations"][0]["slug"], "돼지가-집에-들어오는-꿈")

    def test_rejects_situation_equal_to_hub(self):
        raw = json.loads(raw_response())
        raw["situations"][0]["title"] = "돼지꿈"
        with self.assertRaises(ContentError):
            parse_generation(json.dumps(raw, ensure_ascii=False), ENTRY, "2026-10-05")

    def test_rejects_invalid_json(self):
        with self.assertRaises(ContentError):
            parse_generation("not json", ENTRY, "2026-10-05")

    def test_schema_violation_propagates(self):
        with self.assertRaises(ContentError):
            parse_generation(raw_response(summary="짧음"), ENTRY, "2026-10-05")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: 실패 확인**

Run: `python -m unittest discover -s scripts/seo -p "test_gen_situations.py" -v`
Expected: `ModuleNotFoundError: No module named 'gen_situations'`

- [ ] **Step 3: 구현** — `scripts/seo/gen_situations.py`

```python
"""전통 해몽 사전을 근거로 SEO용 상황별 해몽 원고를 생성한다.

사용:
  python scripts/seo/gen_situations.py              # 없는 표제어만 생성
  python scripts/seo/gen_situations.py --only 돼지   # 하나만
  python scripts/seo/gen_situations.py --force      # 전부 재생성(검수 내용 덮어씀 — 주의)

생성물은 reviewed:false. 사람이 검수 후 true로 바꿔야 사이트에 공개된다.
"""
import argparse
import datetime
import json
import os
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv

from haemong_content import ContentError, slugify, validate_content

ROOT = Path(__file__).resolve().parents[2]
DICTIONARY = ROOT / "backend" / "dream_dictionary.json"
CONTENT_DIR = ROOT / "content" / "haemong"
MODEL = "gpt-4o-mini"

SYSTEM = (
    "당신은 한국 전통 해몽을 정리하는 꿈해몽 사전의 편집자입니다. "
    "웹에서 '~하는 꿈'을 검색해 들어온 독자에게 차분하고 다정하게 설명합니다.\n"
    "규칙:\n"
    "1) 상징의 의미는 반드시 주어진 [전통 해몽 근거]를 최우선으로 따른다. 근거와 어긋나는 풀이를 만들지 않는다.\n"
    "2) 서양식·현대 심리학·뉴에이지 해석(무의식, 트라우마, 에너지, 정화, 내면아이 등)을 쓰지 않는다.\n"
    "3) 불안·공포를 조장하지 않는다. 흉한 상징도 '조심하면 좋을 기운' 정도로 담담하게 말한다.\n"
    "4) 미래를 단정하지 않는다. '~로 봅니다', '옛사람들은 ~라 여겼지요', '~한 기운으로 풀이합니다'처럼 말한다.\n"
    "5) 자연스러운 한국어로 쓴다. 번역투·딱딱한 문어체 금지. 과장·상술 문구 금지.\n"
    "6) 고지 문구(참고용 등)는 쓰지 않는다. 페이지가 따로 붙인다.\n"
    "7) 반드시 JSON 객체 하나만 출력한다."
)

USER_TEMPLATE = """[전통 해몽 근거]
표제어: {symbol}
동의어: {synonyms}
의미: {meaning}
극성: {polarity}
비고: {note}

아래 JSON을 만드세요.
{{
  "hub_name": "사람들이 검색창에 치는 대표 이름. 명사 상징이면 '돼지꿈'처럼 'ㅇㅇ꿈', 동작이면 '이빨 빠지는 꿈'처럼 '~는 꿈'",
  "summary": "이 상징이 꿈에 나왔을 때의 전통 해몽 총론. 400~700자, 2~3단락, 단락 사이는 빈 줄(\\n\\n)",
  "situations": [
    {{
      "title": "실제로 검색창에 칠 법한 구어 상황 문장. 현재형 '~는 꿈' 또는 '~한 꿈'으로 끝남. 예: '돼지가 집에 들어오는 꿈'",
      "aliases": ["같은 상황의 다른 표현 2~4개(시제·어순·동의어 변형). 예: '돼지가 집에 들어온 꿈', '집에 돼지가 들어오는 꿈'"],
      "polarity": "길|흉|중립|양면 중 하나",
      "body": "이 상황의 해몽 400~700자, 2~3단락(\\n\\n 구분). aliases 중 하나 이상을 문장 안에 자연스럽게 녹인다(나열 금지)."
    }}
  ]
}}
조건:
- situations는 3~5개. 사람들이 이 상징으로 가장 많이 검색할 대표 상황부터.
- 상황끼리 서로 겹치지 않게. 어떤 상황의 title도 hub_name과 같으면 안 된다.
- 동의어({synonyms})가 들어간 상황도 하나 이상 포함하면 좋다.
"""


def build_messages(entry: dict) -> list:
    user = USER_TEMPLATE.format(
        symbol=entry["표제어"],
        synonyms=", ".join(entry.get("동의어", [])) or "없음",
        meaning=entry["의미"],
        polarity=entry["극성"],
        note=entry.get("비고") or "없음",
    )
    return [{"role": "system", "content": SYSTEM}, {"role": "user", "content": user}]


def parse_generation(raw: str, entry: dict, today: str) -> dict:
    try:
        gen = json.loads(raw)
    except json.JSONDecodeError as e:
        raise ContentError(f"{entry['표제어']}: JSON 파싱 실패: {e}") from e

    hub_name = str(gen.get("hub_name", "")).strip()
    situations = []
    for s in gen.get("situations", []):
        title = str(s.get("title", "")).strip()
        if title == hub_name:
            raise ContentError(f"{entry['표제어']}: 상황 title이 hub_name과 같음: {title}")
        situations.append({
            "title": title,
            "slug": slugify(title),
            "aliases": [str(a).strip() for a in s.get("aliases", []) if str(a).strip()],
            "polarity": s.get("polarity", entry["극성"]),
            "body": str(s.get("body", "")).strip(),
        })

    data = {
        "symbol": entry["표제어"],
        "hub_name": hub_name,
        "slug": slugify(hub_name),
        "polarity": entry["극성"],
        "summary": str(gen.get("summary", "")).strip(),
        "situations": situations,
        "reviewed": False,
        "generated_at": today,
    }
    validate_content(data, source=entry["표제어"])
    return data


def call_openai(messages: list, api_key: str) -> str:
    r = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": MODEL,
            "messages": messages,
            "temperature": 0.6,
            "response_format": {"type": "json_object"},
        },
        timeout=120,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="이미 있는 파일도 재생성(검수 내용 덮어씀)")
    ap.add_argument("--only", help="이 표제어 하나만 생성")
    args = ap.parse_args(argv)

    load_dotenv(ROOT / ".env")
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        print("OPENAI_API_KEY가 저장소 루트 .env에 없습니다.", file=sys.stderr)
        return 1

    entries = json.loads(DICTIONARY.read_text(encoding="utf-8"))["symbols"]
    if args.only:
        entries = [e for e in entries if e["표제어"] == args.only]
        if not entries:
            print(f"사전에 없는 표제어: {args.only}", file=sys.stderr)
            return 1

    CONTENT_DIR.mkdir(parents=True, exist_ok=True)
    today = datetime.date.today().isoformat()
    failed = []
    for entry in entries:
        out = CONTENT_DIR / f"{entry['표제어']}.json"
        if out.exists() and not args.force:
            continue
        try:
            data = parse_generation(call_openai(build_messages(entry), api_key), entry, today)
        except (ContentError, requests.RequestException, KeyError) as e:
            print(f"✗ {entry['표제어']}: {e}", file=sys.stderr)
            failed.append(entry["표제어"])
            continue
        out.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"✓ {entry['표제어']} → {data['hub_name']} ({len(data['situations'])}개 상황)")

    if failed:
        print(f"실패 {len(failed)}건 — 다시 실행하면 실패분만 재시도됩니다: {', '.join(failed)}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: 통과 확인**

Run: `python -m unittest discover -s scripts/seo -p "test_*.py" -v`
Expected: 전부 OK.

- [ ] **Step 5: 1건 실호출 스모크**

Run: `cd /d/MyProject/monkey && PYTHONIOENCODING=utf-8 python scripts/seo/gen_situations.py --only 돼지`
Expected: `✓ 돼지 → 돼지꿈 (N개 상황)` 그리고 `content/haemong/돼지.json` 생성. 파일을 열어 상황 title이 "~는 꿈" 구어체인지, 전통 근거(재물·복)와 일치하는지 눈으로 확인. 문제가 있으면 `USER_TEMPLATE`/`SYSTEM`만 고치고 `--only 돼지 --force`로 재시도.

- [ ] **Step 6: Commit**

```bash
git add scripts/seo/gen_situations.py scripts/seo/test_gen_situations.py content/haemong/돼지.json
git commit -m "feat(seo): 전통 해몽 사전 근거 상황별 원고 생성기 (+ 돼지 샘플)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: 사이트 페이지 계획 (TDD — 순수 로직)

**Files:**
- Create: `scripts/seo/build_site.py` (이 태스크에선 데이터 모델·계획 함수까지)
- Test: `scripts/seo/test_build_site.py`

**Interfaces:**
- Consumes: 콘텐츠 dict (Task 6 스키마)
- Produces:
  ```python
  SITE_URL = "https://ms-won.github.io/Monkey/haemong/"
  PLAY_APP_URL = "https://play.google.com/store/apps/details?id=com.mswon.monkey"
  POPULAR = ["똥", "뱀", "돼지", "이빨빠짐", "물", "불", "돈", "죽음", "임신", "쫓김", "추락", "조상"]

  @dataclass
  class Link: label: str; slug: str
  @dataclass
  class Page:
      kind: str            # "index" | "hub" | "situation"
      slug: str            # index는 ""
      title: str           # <title>
      h1: str
      description: str     # meta description (≤ 155자)
      paragraphs: list[str]
      polarity: str        # index는 ""
      aliases: list[str]
      breadcrumbs: list[Link]
      sections: list[tuple[str, list[Link]]]   # (소제목, 링크들)
      campaign: str        # utm_campaign 값(슬러그, index는 "index")

  def select_published(contents: list[dict], include_unreviewed: bool) -> list[dict]
  def plan_pages(contents: list[dict]) -> list[Page]
  def page_url(slug: str) -> str        # 절대 URL, 퍼센트 인코딩
  def play_link(campaign: str) -> str
  ```

- [ ] **Step 1: 실패하는 테스트 작성** — `scripts/seo/test_build_site.py`

```python
import unittest
from urllib.parse import unquote

from build_site import page_url, plan_pages, play_link, select_published

BODY = "다" * 450


def content(symbol, hub, polarity="길", reviewed=True, n=3):
    sits = []
    for i in range(n):
        title = f"{symbol}{'가' if i == 0 else '를'} 상황{i}하는 꿈"
        sits.append({"title": title, "slug": title.replace(" ", "-"),
                     "aliases": [f"{symbol} 변형{i} 꿈"], "polarity": polarity,
                     "body": BODY + "\n\n" + BODY[:100]})
    return {"symbol": symbol, "hub_name": hub, "slug": hub.replace(" ", "-"),
            "polarity": polarity, "summary": BODY, "situations": sits,
            "reviewed": reviewed, "generated_at": "2026-10-05"}


CONTENTS = [content("돼지", "돼지꿈"), content("뱀", "뱀꿈"),
            content("쥐", "쥐꿈", polarity="흉"), content("곰", "곰꿈", reviewed=False)]


class SelectPublishedTest(unittest.TestCase):
    def test_excludes_unreviewed(self):
        self.assertEqual([c["symbol"] for c in select_published(CONTENTS, False)], ["돼지", "뱀", "쥐"])

    def test_preview_includes_all(self):
        self.assertEqual(len(select_published(CONTENTS, True)), 4)


class PlanPagesTest(unittest.TestCase):
    def setUp(self):
        self.pages = plan_pages(select_published(CONTENTS, False))
        self.by_slug = {p.slug: p for p in self.pages}

    def test_page_counts(self):
        kinds = [p.kind for p in self.pages]
        self.assertEqual(kinds.count("index"), 1)
        self.assertEqual(kinds.count("hub"), 3)
        self.assertEqual(kinds.count("situation"), 9)

    def test_slugs_unique(self):
        slugs = [p.slug for p in self.pages]
        self.assertEqual(len(slugs), len(set(slugs)))

    def test_situation_title_and_h1_start_with_situation(self):
        p = self.by_slug["돼지가-상황0하는-꿈"]
        self.assertEqual(p.h1, "돼지가 상황0하는 꿈")
        self.assertTrue(p.title.startswith("돼지가 상황0하는 꿈 해몽"))

    def test_titles_within_60(self):
        for p in self.pages:
            self.assertLessEqual(len(p.title), 60, p.title)

    def test_description_within_155_and_mentions_alias(self):
        p = self.by_slug["돼지가-상황0하는-꿈"]
        self.assertLessEqual(len(p.description), 155)
        self.assertIn("돼지 변형0 꿈", p.description)

    def test_all_links_resolve(self):
        for p in self.pages:
            for _, links in p.sections:
                for link in links:
                    self.assertIn(link.slug, self.by_slug, f"{p.slug} → {link.slug}")
            for crumb in p.breadcrumbs:
                self.assertIn(crumb.slug, self.by_slug)

    def test_unreviewed_not_linked(self):
        for p in self.pages:
            for _, links in p.sections:
                self.assertNotIn("곰꿈", [l.slug for l in links])

    def test_situation_links_siblings_and_hub(self):
        p = self.by_slug["돼지가-상황0하는-꿈"]
        linked = {l.slug for _, links in p.sections for l in links}
        self.assertIn("돼지꿈", linked)
        self.assertIn("돼지를-상황1하는-꿈", linked)
        self.assertNotIn(p.slug, linked)

    def test_related_hubs_same_polarity(self):
        p = self.by_slug["돼지꿈"]
        linked = {l.slug for _, links in p.sections for l in links}
        self.assertIn("뱀꿈", linked)
        self.assertNotIn("쥐꿈", linked)

    def test_paragraphs_split_on_blank_line(self):
        self.assertEqual(len(self.by_slug["돼지가-상황0하는-꿈"].paragraphs), 2)


class UrlTest(unittest.TestCase):
    def test_page_url_encoded(self):
        url = page_url("돼지가-집에-들어오는-꿈")
        self.assertTrue(url.startswith("https://ms-won.github.io/Monkey/haemong/"))
        self.assertTrue(url.endswith("/"))
        self.assertNotIn("돼", url)
        self.assertEqual(unquote(url), "https://ms-won.github.io/Monkey/haemong/돼지가-집에-들어오는-꿈/")

    def test_index_url(self):
        self.assertEqual(page_url(""), "https://ms-won.github.io/Monkey/haemong/")

    def test_play_link_referrer(self):
        link = play_link("돼지꿈")
        self.assertTrue(link.startswith("https://play.google.com/store/apps/details?id=com.mswon.monkey&referrer="))
        self.assertIn("utm_source%3Dseo%26utm_campaign%3D", link)
        self.assertNotIn("돼", link)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: 실패 확인**

Run: `python -m unittest discover -s scripts/seo -p "test_build_site.py" -v`
Expected: `ModuleNotFoundError: No module named 'build_site'`

- [ ] **Step 3: 구현** — `scripts/seo/build_site.py` (계획 부분)

```python
"""검수된 해몽 콘텐츠로 정적 SEO 사이트(docs/haemong/)를 빌드한다.

사용:
  python scripts/seo/build_site.py                      # reviewed:true만 → docs/haemong/
  python scripts/seo/build_site.py --preview <outdir>   # 미검수 포함 로컬 미리보기(docs/ 밖)
"""
from dataclasses import dataclass, field
from urllib.parse import quote

SITE_URL = "https://ms-won.github.io/Monkey/haemong/"
PLAY_APP_URL = "https://play.google.com/store/apps/details?id=com.mswon.monkey"
SITE_NAME = "몽키 꿈해몽"
POPULAR = ["똥", "뱀", "돼지", "이빨빠짐", "물", "불", "돈", "죽음", "임신", "쫓김", "추락", "조상"]
RELATED_HUBS = 6
DESC_MAX = 155


@dataclass
class Link:
    label: str
    slug: str


@dataclass
class Page:
    kind: str
    slug: str
    title: str
    h1: str
    description: str
    paragraphs: list
    polarity: str = ""
    aliases: list = field(default_factory=list)
    breadcrumbs: list = field(default_factory=list)
    sections: list = field(default_factory=list)
    campaign: str = ""


def page_url(slug: str) -> str:
    return SITE_URL + (quote(slug) + "/" if slug else "")


def play_link(campaign: str) -> str:
    referrer = quote(f"utm_source=seo&utm_campaign={campaign}", safe="")
    return f"{PLAY_APP_URL}&referrer={referrer}"


def select_published(contents: list, include_unreviewed: bool) -> list:
    return [c for c in contents if include_unreviewed or c["reviewed"]]


def _paragraphs(text: str) -> list:
    return [p.strip() for p in text.split("\n\n") if p.strip()]


def _clip(text: str, limit: int = DESC_MAX) -> str:
    text = " ".join(text.split())
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"


def _fit_title(main: str, extra: str) -> str:
    """'<main> 해몽 — <extra> | 몽키'가 60자를 넘으면 extra부터 뗀다."""
    for t in (f"{main} 해몽 — {extra} | 몽키", f"{main} 해몽 | 몽키", f"{main} | 몽키"):
        if len(t) <= 60:
            return t
    return main[:60]


def _related_hubs(content: dict, published: list) -> list:
    same = [c for c in published if c["polarity"] == content["polarity"] and c["symbol"] != content["symbol"]]
    idx = [c["symbol"] for c in published].index(content["symbol"])
    # 가나다 순에서 자기 뒤쪽부터 순환하며 고른다(페이지마다 다른 이웃 → 내부 링크 분산).
    same.sort(key=lambda c: ([x["symbol"] for x in published].index(c["symbol"]) - idx) % len(published))
    return [Link(c["hub_name"], c["slug"]) for c in same[:RELATED_HUBS]]


def plan_pages(contents: list) -> list:
    home = Link("꿈해몽 사전", "")
    pages = []

    by_symbol = {c["symbol"]: c for c in contents}
    popular = [by_symbol[s] for s in POPULAR if s in by_symbol]
    pages.append(Page(
        kind="index", slug="",
        title="꿈해몽 사전 — 상황별 전통 꿈풀이 | 몽키",
        h1="꿈해몽 사전",
        description=_clip("돼지꿈, 뱀꿈, 이빨 빠지는 꿈까지. 자주 꾸는 꿈을 상황별로 나눠 한국 전통 해몽으로 풀어 드립니다."),
        paragraphs=["어젯밤 꾼 꿈을 찾아보세요. 옛사람들이 전해 온 전통 해몽을 바탕으로, 꿈에 나온 상징과 상황을 하나씩 풀어 두었습니다."],
        sections=(
            ([("많이 찾는 꿈", [Link(c["hub_name"], c["slug"]) for c in popular])] if popular else [])
            + [(c["hub_name"], [Link(c["hub_name"] + " 전체 풀이", c["slug"])]
                + [Link(s["title"], s["slug"]) for s in c["situations"]]) for c in contents]
        ),
        campaign="index",
    ))

    for c in contents:
        hub = Link(c["hub_name"], c["slug"])
        situations = [Link(s["title"], s["slug"]) for s in c["situations"]]
        related = _related_hubs(c, contents)

        pages.append(Page(
            kind="hub", slug=c["slug"],
            title=_fit_title(c["hub_name"], f"{c['symbol']} 나오는 꿈 풀이"),
            h1=f"{c['hub_name']} 해몽",
            description=_clip(f"{c['hub_name']} 해몽. {c['symbol']} 나오는 꿈을 상황별로 풀이합니다. " + c["summary"]),
            paragraphs=_paragraphs(c["summary"]),
            polarity=c["polarity"],
            breadcrumbs=[home],
            sections=[(f"{c['symbol']} 꿈, 상황별 풀이", situations)] + ([("함께 보면 좋은 꿈", related)] if related else []),
            campaign=c["slug"],
        ))

        for s in c["situations"]:
            siblings = [l for l in situations if l.slug != s["slug"]]
            alias_txt = "·".join(s["aliases"][:2])
            pages.append(Page(
                kind="situation", slug=s["slug"],
                title=_fit_title(s["title"], "전통 꿈풀이"),
                h1=s["title"],
                description=_clip(f"{s['title']} 해몽." + (f" {alias_txt}도 같은 뜻으로 봅니다." if alias_txt else "") + " " + s["body"]),
                paragraphs=_paragraphs(s["body"]),
                polarity=s["polarity"],
                aliases=s["aliases"],
                breadcrumbs=[home, hub],
                sections=[(f"{c['symbol']} 꿈, 다른 상황", [hub] + siblings)] + ([("함께 보면 좋은 꿈", related)] if related else []),
                campaign=s["slug"],
            ))
    return pages
```

- [ ] **Step 4: 통과 확인**

Run: `python -m unittest discover -s scripts/seo -p "test_*.py" -v`
Expected: 전부 OK.

- [ ] **Step 5: Commit**

```bash
git add scripts/seo/build_site.py scripts/seo/test_build_site.py
git commit -m "feat(seo): 해몽 사이트 페이지 계획(상황 문장 우선 title·내부 링크·UTM)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: 템플릿 렌더링 + 사이트맵 + CLI

**Files:**
- Modify: `scripts/seo/build_site.py` (렌더·사이트맵·main 추가)
- Create: `scripts/seo/templates/base.html.j2`, `index.html.j2`, `hub.html.j2`, `situation.html.j2`
- Modify: `scripts/seo/test_build_site.py` (렌더 테스트 추가)

**Interfaces:**
- Consumes: `Page`, `plan_pages`, `select_published`, `page_url`, `play_link`, `load_contents`
- Produces:
  ```python
  def build_sitemap(pages: list[Page], lastmod: str) -> str
  def render_site(pages: list[Page], out_dir: Path, lastmod: str) -> None   # out_dir 통째 재생성
  def main(argv: list[str] | None = None) -> int                            # --preview DIR
  ```
  산출 구조: `out_dir/index.html`, `out_dir/<slug>/index.html`, `out_dir/sitemap.xml`

- [ ] **Step 1: 렌더 테스트 추가** — `test_build_site.py` 하단(`if __name__` 위)에 추가

```python
import re
import tempfile
from pathlib import Path
from urllib.parse import unquote

from build_site import build_sitemap, render_site


class RenderSiteTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.out = Path(self.tmp.name) / "haemong"
        self.pages = plan_pages(select_published(CONTENTS, False))
        render_site(self.pages, self.out, "2026-10-05")

    def tearDown(self):
        self.tmp.cleanup()

    def test_every_page_written(self):
        for p in self.pages:
            path = self.out / p.slug / "index.html" if p.slug else self.out / "index.html"
            self.assertTrue(path.exists(), path)

    def test_unreviewed_absent(self):
        self.assertFalse((self.out / "곰꿈").exists())
        for f in self.out.rglob("*.html"):
            self.assertNotIn("곰꿈", f.read_text(encoding="utf-8"))

    def test_internal_hrefs_resolve(self):
        for f in self.out.rglob("index.html"):
            html = f.read_text(encoding="utf-8")
            for href in re.findall(r'href="([^"]+)"', html):
                if href.startswith(("http", "#", "mailto:")):
                    continue
                target = (f.parent / unquote(href)).resolve()
                if target.is_dir():
                    target = target / "index.html"
                self.assertTrue(target.exists(), f"{f} → {href}")

    def test_situation_page_seo_tags(self):
        html = (self.out / "돼지가-상황0하는-꿈" / "index.html").read_text(encoding="utf-8")
        self.assertIn("<title>돼지가 상황0하는 꿈 해몽", html)
        self.assertIn("<h1>돼지가 상황0하는 꿈</h1>", html)
        self.assertIn('rel="canonical"', html)
        self.assertIn('application/ld+json', html)
        self.assertIn("utm_source%3Dseo", html)
        self.assertIn("전통 해몽은 참고용이며 미래를 단정하지 않습니다.", html)

    def test_sitemap_matches_pages(self):
        xml = (self.out / "sitemap.xml").read_text(encoding="utf-8")
        locs = set(re.findall(r"<loc>([^<]+)</loc>", xml))
        self.assertEqual(locs, {page_url(p.slug) for p in self.pages})

    def test_rerender_removes_stale_pages(self):
        stale = self.out / "옛날-꿈"
        stale.mkdir()
        (stale / "index.html").write_text("x", encoding="utf-8")
        render_site(self.pages, self.out, "2026-10-05")
        self.assertFalse(stale.exists())

    def test_refuses_unsafe_out_dir(self):
        with self.assertRaises(ValueError):
            render_site(self.pages, Path(self.tmp.name), "2026-10-05")


class SitemapTest(unittest.TestCase):
    def test_lastmod_and_xml_header(self):
        xml = build_sitemap(plan_pages(select_published(CONTENTS, False)), "2026-10-05")
        self.assertTrue(xml.startswith('<?xml version="1.0" encoding="UTF-8"?>'))
        self.assertIn("<lastmod>2026-10-05</lastmod>", xml)
```

(파일 상단 import에 `select_published`, `plan_pages`, `page_url`이 이미 있으므로 중복 import는 상단으로 합친다.)

- [ ] **Step 2: 실패 확인**

Run: `python -m unittest discover -s scripts/seo -p "test_build_site.py" -v`
Expected: `ImportError: cannot import name 'build_sitemap'`

- [ ] **Step 3: 템플릿 작성**

`scripts/seo/templates/base.html.j2`:
```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{ page.title }}</title>
<meta name="description" content="{{ page.description }}">
<link rel="canonical" href="{{ url }}">
<meta property="og:type" content="{{ 'website' if page.kind == 'index' else 'article' }}">
<meta property="og:site_name" content="{{ site_name }}">
<meta property="og:title" content="{{ page.title }}">
<meta property="og:description" content="{{ page.description }}">
<meta property="og:url" content="{{ url }}">
<meta property="og:locale" content="ko_KR">
<script type="application/ld+json">{{ jsonld | tojson }}</script>
<style>
  :root{--bg:#120f1d;--panel:#1c1830;--text:#efeaf8;--muted:#b3abc6;--gold:#d9b86c;--line:#3a3252;--good:#9fd6a8;--warn:#e7b07a}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--text);font-family:"Pretendard","Apple SD Gothic Neo","Malgun Gothic",sans-serif;font-size:17px;line-height:1.8}
  .wrap{max-width:720px;margin:0 auto;padding:24px 16px 64px}
  a{color:var(--gold)}
  nav.crumbs{font-size:14px;color:var(--muted)}
  nav.crumbs a{color:var(--muted)}
  h1{font-family:"Nanum Myeongjo",serif;font-size:28px;line-height:1.4;margin:16px 0 8px;color:var(--gold)}
  h2{font-size:19px;margin:36px 0 12px;padding-bottom:6px;border-bottom:1px solid var(--line)}
  .badge{display:inline-block;font-size:14px;padding:2px 10px;border:1px solid var(--line);border-radius:999px;color:var(--muted)}
  .aliases{font-size:15px;color:var(--muted)}
  ul.links{list-style:none;padding:0;margin:0;display:grid;gap:8px}
  ul.links a{display:block;padding:12px 14px;background:var(--panel);border:1px solid var(--line);border-radius:10px;text-decoration:none;color:var(--text)}
  .cta{display:block;margin:32px 0;padding:16px;text-align:center;background:linear-gradient(135deg,#6d4bd6,#b06ad9);color:#fff;border-radius:12px;text-decoration:none;font-weight:700;font-size:18px}
  .cta small{display:block;font-weight:400;font-size:14px;opacity:.85}
  footer{margin-top:48px;font-size:14px;color:var(--muted);border-top:1px solid var(--line);padding-top:16px}
</style>
</head>
<body>
<main class="wrap">
{% if page.breadcrumbs %}
<nav class="crumbs">{% for c in page.breadcrumbs %}<a href="{{ rel(c.slug) }}">{{ c.label }}</a> › {% endfor %}{{ page.h1 }}</nav>
{% endif %}
{% block content %}{% endblock %}
<a class="cta" href="{{ play }}" rel="noopener">내 꿈 직접 해몽받기<small>긴 꿈도 그대로 적으면 몽키가 전통 해몽으로 풀어 드려요</small></a>
{% for heading, links in page.sections %}
<h2>{{ heading }}</h2>
<ul class="links">{% for l in links %}<li><a href="{{ rel(l.slug) }}">{{ l.label }}</a></li>{% endfor %}</ul>
{% endfor %}
<footer>
<p>전통 해몽은 참고용이며 미래를 단정하지 않습니다.</p>
<p><a href="{{ rel('') }}">꿈해몽 사전</a> · <a href="{{ privacy }}">개인정보처리방침</a> · © 몽키</p>
</footer>
</main>
</body>
</html>
```

`scripts/seo/templates/index.html.j2`:
```html
{% extends "base.html.j2" %}
{% block content %}
<h1>{{ page.h1 }}</h1>
{% for p in page.paragraphs %}<p>{{ p }}</p>{% endfor %}
{% endblock %}
```

`scripts/seo/templates/hub.html.j2`:
```html
{% extends "base.html.j2" %}
{% block content %}
<h1>{{ page.h1 }}</h1>
<span class="badge">전통 해몽 · {{ page.polarity }}</span>
{% for p in page.paragraphs %}<p>{{ p }}</p>{% endfor %}
{% endblock %}
```

`scripts/seo/templates/situation.html.j2`:
```html
{% extends "base.html.j2" %}
{% block content %}
<h1>{{ page.h1 }}</h1>
<span class="badge">전통 해몽 · {{ page.polarity }}</span>
{% for p in page.paragraphs %}<p>{{ p }}</p>{% endfor %}
{% if page.aliases %}<p class="aliases">비슷하게 찾는 꿈: {{ page.aliases | join(', ') }}</p>{% endif %}
{% endblock %}
```

- [ ] **Step 4: 렌더·사이트맵·CLI 구현** — `build_site.py`에 추가

상단 import 확장:
```python
import argparse
import datetime
import shutil
import sys
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from haemong_content import load_contents
```
상수 추가:
```python
ROOT = Path(__file__).resolve().parents[2]
CONTENT_DIR = ROOT / "content" / "haemong"
PUBLISH_DIR = ROOT / "docs" / "haemong"
TEMPLATES = Path(__file__).resolve().parent / "templates"
PRIVACY_URL = "https://ms-won.github.io/Monkey/"
```
함수 추가(파일 끝):
```python
def _jsonld(page: Page, url: str) -> dict:
    crumbs = page.breadcrumbs + ([Link(page.h1, page.slug)] if page.kind != "index" else [])
    graph = [{
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": c.label, "item": page_url(c.slug)}
            for i, c in enumerate(crumbs or [Link(page.h1, "")])
        ],
    }]
    if page.kind != "index":
        graph.append({
            "@type": "Article",
            "headline": page.h1,
            "description": page.description,
            "inLanguage": "ko",
            "mainEntityOfPage": url,
            "author": {"@type": "Organization", "name": SITE_NAME},
            "publisher": {"@type": "Organization", "name": SITE_NAME},
        })
    return {"@context": "https://schema.org", "@graph": graph}


def build_sitemap(pages: list, lastmod: str) -> str:
    rows = "".join(
        f"  <url><loc>{page_url(p.slug)}</loc><lastmod>{lastmod}</lastmod></url>\n" for p in pages
    )
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            f"{rows}</urlset>\n")


def render_site(pages: list, out_dir: Path, lastmod: str) -> None:
    out_dir = Path(out_dir)
    # 통째로 지우므로 엉뚱한 디렉터리를 지우지 않게 이름으로 막는다.
    if out_dir.name != "haemong":
        raise ValueError(f"출력 디렉터리 이름은 'haemong'이어야 합니다: {out_dir}")
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True)

    env = Environment(loader=FileSystemLoader(TEMPLATES), autoescape=select_autoescape(["j2", "html"]))
    for page in pages:
        depth = 1 if page.slug else 0

        def rel(slug, _depth=depth):
            prefix = "../" * _depth
            return f"{prefix}{slug}/" if slug else (prefix or "./")

        url = page_url(page.slug)
        html = env.get_template(f"{page.kind}.html.j2").render(
            page=page, url=url, rel=rel, play=play_link(page.campaign),
            jsonld=_jsonld(page, url), site_name=SITE_NAME, privacy=PRIVACY_URL,
        )
        target = out_dir / page.slug / "index.html" if page.slug else out_dir / "index.html"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(html, encoding="utf-8")

    (out_dir / "sitemap.xml").write_text(build_sitemap(pages, lastmod), encoding="utf-8")


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", metavar="DIR", help="미검수 포함 미리보기를 DIR/haemong/에 생성(docs/ 밖 경로)")
    args = ap.parse_args(argv)

    contents = load_contents(CONTENT_DIR)
    if args.preview:
        preview_root = Path(args.preview).resolve()
        if (ROOT / "docs").resolve() in [preview_root, *preview_root.parents]:
            print("--preview 경로는 docs/ 밖이어야 합니다.", file=sys.stderr)
            return 1
        out, published = preview_root / "haemong", select_published(contents, True)
    else:
        out, published = PUBLISH_DIR, select_published(contents, False)

    pages = plan_pages(published)
    render_site(pages, out, datetime.date.today().isoformat())
    hidden = len(contents) - len(published)
    print(f"{len(pages)}페이지 → {out}  (상징 {len(published)}개 공개, 미검수 {hidden}개 제외)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 5: 통과 확인**

Run: `python -m unittest discover -s scripts/seo -p "test_*.py" -v`
Expected: 전부 OK.

- [ ] **Step 6: 샘플 미리보기 육안 확인**

Run:
```bash
cd /d/MyProject/monkey && PYTHONIOENCODING=utf-8 python scripts/seo/build_site.py --preview "C:/Users/PC/AppData/Local/Temp/claude/D--MyProject-monkey/8e26d953-cc75-41b3-9f98-e525650ec682/scratchpad/preview"
```
Expected: `N페이지 → .../preview/haemong (상징 1개 공개, 미검수 0개 제외)` (돼지 샘플은 reviewed:false지만 preview라 포함).
`python -m http.server 8000 --directory <scratchpad>/preview` 후 브라우저(claude-in-chrome) 모바일 폭(390px)으로 `http://localhost:8000/haemong/` → 상징 → 상황 페이지 클릭 이동 확인, 글자 17px 이상·CTA 노출 확인.

- [ ] **Step 7: Commit**

```bash
git add scripts/seo/build_site.py scripts/seo/test_build_site.py scripts/seo/templates
git commit -m "feat(seo): 해몽 사이트 렌더링(Jinja2)·사이트맵·검수 게이트 CLI

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: 전체 원고 생성 + 검수 가이드

**Files:**
- Create: `content/haemong/*.json` (77개 중 생성 성공분)
- Create: `docs/marketing/content-review.md`

**Interfaces:**
- Consumes: `gen_situations.py`, `build_site.py --preview`
- Produces: 검수 대기 원고 전량

- [ ] **Step 1: 전량 생성**

Run: `cd /d/MyProject/monkey && PYTHONIOENCODING=utf-8 python scripts/seo/gen_situations.py`
Expected: `✓` 77줄(이미 있는 돼지 제외 76). 종료 코드 2면 실패분만 같은 명령으로 재실행. 3회 재실행 후에도 실패하는 표제어는 목록을 기록하고 사용자에게 보고.

- [ ] **Step 2: 기계 점검**

Run:
```bash
cd /d/MyProject/monkey && PYTHONIOENCODING=utf-8 python - <<'EOF'
import sys; sys.path.insert(0, 'scripts/seo')
from collections import Counter
from haemong_content import load_contents
cs = load_contents('content/haemong')
slugs = [c['slug'] for c in cs] + [s['slug'] for c in cs for s in c['situations']]
dup = [s for s, n in Counter(slugs).items() if n > 1]
banned = ['무의식', '트라우마', '에너지', '정화', '내면아이', '반드시', '무조건']
hits = [(c['symbol'], w) for c in cs for t in [c['summary']] + [s['body'] for s in c['situations']] for w in banned if w in t]
print('symbols', len(cs), 'pages', len(slugs), 'dup', dup)
print('banned', hits)
EOF
```
Expected: `symbols 77`, `dup []`, `banned []`. 중복 슬러그가 있으면 해당 표제어 JSON의 상황 title을 직접 수정(slug도 `slugify(title)`로 맞춤). 금지어가 있으면 해당 표제어를 `--only <표제어> --force`로 재생성.

- [ ] **Step 3: `docs/marketing/content-review.md` 작성**

```markdown
# 해몽 원고 검수 가이드

원고: `content/haemong/<표제어>.json` — `reviewed: true`인 것만 사이트에 공개된다.

## 미리보기
python scripts/seo/build_site.py --preview <docs 밖 폴더>
python -m http.server 8000 --directory <그 폴더>   →  http://localhost:8000/haemong/

## 체크리스트 (표제어 파일 하나당)
- [ ] 의미가 `backend/dream_dictionary.json`의 전통 해몽 근거와 일치한다(특히 역몽: 똥·뱀·죽음·시체·피 등)
- [ ] 상황 title이 실제 검색어처럼 자연스럽다("~하는 꿈"). 어색하면 고치고 slug도 같이 고친다(공백→`-`)
- [ ] 공포·단정 표현이 없다("반드시 ~된다", "큰일 난다" 등)
- [ ] 서양식/심리학 용어가 없다
- [ ] 번역투·어색한 문장이 없다
- [ ] 다 맞으면 `"reviewed": true`

## 검수 우선순위 (많이 찾는 꿈부터)
똥, 뱀, 돼지, 이빨빠짐, 물, 불, 돈, 죽음, 임신, 쫓김, 추락, 조상 → 나머지 가나다순.
한 번에 다 할 필요 없다. 검수된 것부터 공개(Task 11)를 반복한다.

## 수정 후
python -m unittest discover -s scripts/seo -p "test_*.py"
python scripts/seo/build_site.py
```

- [ ] **Step 4: Commit**

```bash
git add content/haemong docs/marketing/content-review.md
git commit -m "content(seo): 해몽 상징 77종 상황별 원고 초안(미검수) + 검수 가이드

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 5: (사용자 수동)** 검수 가이드의 우선순위 12개 상징부터 검수해 `reviewed: true` 설정.

---

### Task 11: 공개 빌드·배포·검증

**Files:**
- Create/Replace: `docs/haemong/**`
- Modify: `docs/marketing/rank-log.md` (메모)

**Interfaces:**
- Consumes: 검수된 `content/haemong/*.json`, `build_site.py`

- [ ] **Step 1: 테스트 + 공개 빌드**

Run:
```bash
cd /d/MyProject/monkey && python -m unittest discover -s scripts/seo -p "test_*.py" && PYTHONIOENCODING=utf-8 python scripts/seo/build_site.py
```
Expected: 테스트 OK, `N페이지 → ...docs\haemong  (상징 K개 공개, 미검수 M개 제외)` 이고 K ≥ 1. K = 0이면 중단하고 사용자에게 검수 요청.

- [ ] **Step 2: 공개물에 미검수 누출 없음 확인**

Run:
```bash
cd /d/MyProject/monkey && PYTHONIOENCODING=utf-8 python - <<'EOF'
import sys, pathlib; sys.path.insert(0, 'scripts/seo')
from haemong_content import load_contents
hidden = [c for c in load_contents('content/haemong') if not c['reviewed']]
built = {p.parent.name for p in pathlib.Path('docs/haemong').rglob('index.html')}
leak = [c['slug'] for c in hidden if c['slug'] in built] + [s['slug'] for c in hidden for s in c['situations'] if s['slug'] in built]
print('leak', leak); assert not leak
EOF
```
Expected: `leak []`

- [ ] **Step 3: `docs/index.html` 불변 확인**

Run: `git diff --stat docs/index.html`
Expected: 출력 없음.

- [ ] **Step 4: Commit + push** (사용자에게 push 승인 확인 후)

```bash
git add docs/haemong
git commit -m "site(seo): 해몽 사전 공개 빌드 — 검수 완료 상징 K종

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

- [ ] **Step 5: 라이브 검증** (Pages 반영 1~3분 후)

- WebFetch `https://ms-won.github.io/Monkey/haemong/` → 200, "꿈해몽 사전" 포함
- WebFetch `https://ms-won.github.io/Monkey/haemong/sitemap.xml` → `<urlset` 포함
- 상황 페이지 1개 WebFetch → title이 상황명으로 시작
- WebFetch `https://ms-won.github.io/Monkey/` → 개인정보처리방침 그대로
- claude-in-chrome으로 모바일 폭에서 CTA 클릭 → Play 스토어 몽키 페이지로 이동

- [ ] **Step 6: Lighthouse (수동)** — Chrome DevTools > Lighthouse > Mobile > SEO로 상황 페이지 1개 측정. 기대: SEO ≥ 90. 미달 항목은 템플릿에서 수정 후 Step 1부터 반복.

- [ ] **Step 7: 검색엔진 제출 (사용자 수동)** — `docs/marketing/seo-registration.md` 체크리스트 수행(구글 인증 파일은 `docs/`에 두므로 `build_site.py`가 지우지 않음). 제출 날짜를 `rank-log.md` 메모에 기록하고 커밋:

```bash
git add docs/marketing/rank-log.md docs/marketing/seo-registration.md
git commit -m "docs(seo): 서치콘솔·서치어드바이저 제출 기록

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 8: 반복 운영** — 이후 검수 → `build_site.py` → 커밋/푸시 → 사이트맵 재제출(구글은 자동 재크롤). 매주 `rank-log.md` 한 줄 기록.
