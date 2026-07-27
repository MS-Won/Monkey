# CLAUDE.md

> 이 파일은 **얇게** 유지합니다(토큰 절약). 상세 작업 로그/설계 문서는
> 프로젝트 루트 `docs/` 하위에 주제별 `.md`로 쌓고, 아래 **Progress Index**에서 한 줄로 링크만 겁니다.
> CLAUDE.md 본문에는 장문 진행 기록을 추가하지 마세요.

## Rules

- Always respond in Korean
- Never commit API keys, .env files, or secrets
- Avoid unnecessary file creation
- Analyze and propose a plan before coding
- Minimize usage of API to reduce cost
- 상세 작업 내역은 CLAUDE.md에 누적하지 말고 루트 `docs/<주제>/*.md`로 분리 후 Progress Index에 링크

## Structure

Splash → Main(Home, Diary, Stats, Profile)

## Architecture

- React Native 0.79.2 + TypeScript
- Supabase + OpenAI + KoNLPy Okt (해몽/분리/임베딩은 backend Flask가 OpenAI 호출)
- Android first, iOS later
- Design tone: **Art Nouveau + iridescent (Dream Goddess tarot)** — 무하풍 여신 일러스트 카드. 카드 아트는 `scripts/gen-card-art.py`로 1회 생성해 `frontend/assets/images/cards/NN.png`에 정적 고정(매 실행 호출 아님)

## Domain

Monkey는 꿈 기록 + 전통 해몽 앱입니다. 해석의 **뿌리는 전통 한국 해몽**이되,
연출/톤은 몰입감 있는 **점술가(mystic) 어조 + 타로 레퍼런스 아키타입 카드**를 사용합니다.
- Flow: Dream → Split → Interpret → Summary(점술가 어조) → Archetype Card 선정 → Save/Stats
- 아키타입 카드 30종은 `../docs/design/archetype-cards.md` 정의를 단일 소스로 사용
- 과장된 미래 예언·공포 마케팅 금지 (연출은 몰입감이되, 단정적 예언은 하지 않음)
- '로또력 분석'은 재미용 부가 기능(예외)

## Progress Index

- [2026-07-06 달빛 서재 리디자인 (아카이브)](../docs/progress/2026-07-06-moonlight-redesign.md) — 네이비+골드 구버전
- [홀로그래픽 타로 리디자인 (아카이브)](../docs/design/holographic-redesign.md) — 벡터 시길 기반 구버전 톤/토큰
- [Dream Goddess 아르누보 바이블 (현재)](../docs/design/dream-goddess-bible.md) — 30장 카드 아트 스펙 + 생성 프롬프트(현 디자인)
- [아키타입 카드 30종 정의](../docs/design/archetype-cards.md) — 카드 데이터(코드) 단일 소스
- 카드 일러스트 생성: `scripts/gen-card-art.py` (무료 Pollinations FLUX 기본, provider 교체 가능) → `frontend/assets/images/cards/`, `frontend/src/data/cardArt.ts` 매핑

## Progress (2026-07-27)

> 상세 로그는 auto-memory `project_monkey_status.md`(추가 15~24) 참고. 여기선 현황만.

### 이번 세션(07-27) 완료 — 해몽 카테고리 개편

계획 `docs/superpowers/plans/2026-07-26-reading-categories.md`의 8태스크를 전부 구현하고
`feat/reading-categories` → main 병합(머지커밋 `b3a7e55`).

- **GPT 호출 7회 → 1회.** 백엔드에 단일 `/reading`(JSON 모드). 문장별 해몽 폐지, 종합 해몽
  \+ 오늘의 한마디 + 근거 있는 카테고리 2~4개(행운/주의운/인간관계/재물운/직장·학업운/건강운).
- **비용 실측 $0.0017 → $0.00030 (82% 절감).** 목표 $0.0006의 절반.
- 카드를 먼저 보여주고, 탭해야 해몽·카테고리가 열린다. 프로필은 서버로 보내지 않고 기기에서
  카테고리 순서만 조정한다. 성별 필드 제거(온보딩 이름 → 나이대 → 직업 3단계).
- **이 프로젝트 최초의 자동 테스트**: `backend/test_reading_schema.py` 10건. 순수 함수라
  네트워크 없이 돈다.
- 삭제: `frontend/src/logic/AnalyzeSentence.ts`, `frontend/src/logic/embedding.ts`.
  SQLite `cache` 테이블은 남겨둠(마이그레이션 위험 회피).
- 에뮬레이터 실기 검증 전 항목 통과.

### 이번 세션(07-27) 완료 — 정리 + 해몽 분량 2배

- **해몽 분량 2배.** `summary` 4~6문장 → 8~12문장, 카테고리 `body` 2~3문장 → 4~6문장.
  `oneLine`은 한 문장 그대로("한마디"는 길어지면 정체성이 무너진다). 분량만 늘리면 모델이
  같은 말을 되풀이하므로 `summary`와 `body`가 서로 겹치지 말 것을 함께 지시했다.
  실측 출력 토큰 317 → 656(2.07배), 비용 $0.00030 → $0.00062. 개편 전($0.0017)의 약 1/3.
- **구 엔드포인트 삭제.** `/split`·`/embed`·`/interpret`·`/summary`와 전용 헬퍼·죽은 상수,
  프론트 `logic/gpt.ts`까지. `keyword_server.py` 690줄 → 296줄. 남은 라우트는
  `/reading`과 `/health` 둘뿐이다.
- **`dream_lexicon` 오매칭 수정.** Okt가 "쥐여 주셨다"의 `쥐여`를 명사 `쥐`(rat)로 태깅해
  꿈에 없는 쥐가 해몽 근거로 주입되고 있었다. 활용형만 지운 뒤에도 키가 남아 있는지 보는
  방식이라, 한 꿈에 진짜 쥐와 '쥐여 주다'가 같이 나와도 진짜 쥐는 살아남는다.
  `test_dream_lexicon.py` 8건 추가(백엔드 테스트 총 18건).
- **versionCode 3 / versionName 1.1로 릴리스 AAB 재빌드 완료.** 번들 검증: Render 주소 O,
  로컬 주소 X, `/reading` O, 구 엔드포인트 X.
- `screenshot-6-interpretation.png` 재캡처. GitHub push 완료(커밋 22건).
- 실기 재검증 전 항목 통과. **구 포맷(짧은 분량) 기록도 그대로 열리는 것까지 확인**했다
  — 지난 세션에 못 채운 검증 항목이다.

### 이번 세션(07-27) 완료 — 해몽 화면 정리

- **한 프레임 통합.** 종합 해몽 / 카테고리 / 오늘의 한마디가 서로 다른 프레임에 흩어져
  있던 것을 카드 뒷면 한 프레임으로 합쳤다. 순서는 저장 평문과 같다.
  카드는 2:3 고정이라 뒷면이 내부 스크롤을 갖는 구조였는데, 해몽 전문을 그 작은 상자에
  넣으면 중첩 스크롤이 생겨 더 나빠지므로 `DreamCard`에 `growBack` 옵션을 추가해
  뒤집힌 뒤에는 내용만큼 늘어나게 했다. 앞면은 일러스트 비율을 그대로 지킨다.
- **단락 나누기.** `toParagraphs()`로 3문장씩 끊어 렌더한다. 화면에서만 나누고 저장 평문은
  건드리지 않아 과거 기록과 호환된다. 문장이 적으면 쪼개지 않는다.
- **개발자 패널 제거.** `__DEV__` 게이팅이 있었지만 화면 자체를 없앴다. 릴리스 번들에
  "개발자용" 문자열이 없는 것까지 확인했다.
- 릴리스 AAB 재빌드(versionCode 3 유지 — Play에 아직 업로드된 적 없어 재사용 가능).

### ⚠️ 알려진 이슈: `/reading` 응답이 38초

프로덕션 실측 **38.5초**(워밍 상태). 분량을 2배로 늘리며 출력 토큰이 ~600으로 늘어난 것이
주원인이다. Render 무료 플랜은 유휴 시 잠들어 **콜드스타트까지 겹치면 앱이 Render의 HTML
오류 페이지를 받아** `해몽을 가져오지 못했습니다`가 뜬다(실제로 재현됨).

- 즉효: **Render starter 플랜 적용**(잠들지 않음). 아래 사용자 작업 2번.
- 그래도 38초는 길다. 다음 세션 후보: 로딩 문구를 단계별로 바꾸거나, `summary`를 먼저
  스트리밍/선반환하고 카테고리를 뒤에 붙이는 식의 체감 개선.
- 앱에 요청 타임아웃과 재시도가 없다. HTML 응답을 받으면 그대로 실패한다.

### ▶ 다음 세션에서 바로 할 일

**사용자 수동 작업 2건이 유일한 잔여 항목이다** (아래 "사용자만 할 수 있는 일" 참고).
코드 쪽에서 막힌 것은 없고, 위 38초 이슈만 개선 여지가 있다.

### 사용자만 할 수 있는 일 (2건)

1. **Play Console 비공개 테스트에 AAB 업로드 + 테스터 12명.**
   파일: `android/app/build/outputs/bundle/release/app-release.aab` (versionCode 3, 124MB)
   치트시트: `docs/release/play-console-checklist.md`
   테스터는 **14일 연속 옵트인**이 필요하고 중간 옵트아웃 시 리셋된다. 본인1+타인11 권장.
2. **Render `starter` 플랜을 대시보드에서 실제 적용.** `render.yaml`에만 반영돼 있다.
   결제가 발생하므로 계정 소유자만 가능. 무료 플랜은 `/health` 콜드스타트가 14.6초 실측이라
   테스터 14일 실사용 전에 올려두는 편이 낫다.

### 함정 메모

- **OPENAI_API_KEY는 `backend/.env`가 아니라 프로젝트 루트 `.env`에 있다.** `load_dotenv()`가
  상위로 탐색해 찾는다. 루트 `.env`에 `SERVER_BASE_URL`도 함께 있다(gitignore 대상).
- 에뮬 검증 시 `.env`의 `SERVER_BASE_URL`을 `http://10.0.2.2:5001`로 바꿔 로컬 서버를 보게 하고
  **끝나면 반드시 Render 주소로 복구**한다. 안 하면 릴리스 AAB가 localhost를 본다.
- 릴리스 서명 빌드가 깔려 있으면 디버그 설치가 `INSTALL_FAILED_UPDATE_INCOMPATIBLE`로 막힌다.
  `adb uninstall com.mswon.monkey` 선행(앱 데이터 삭제됨).
- `adb shell input text`는 공백을 `%s`로 이스케이프해야 하고 한글은 불가.
  `keyevent 111`(ESC)은 뒤로가기로 동작해 앱이 종료된다.

### 이전 세션(07-26) 완료

**Play Console 앱 설정 2/11 → 11/11 완료** (브라우저 자동화로 직접 입력)
- 방침URL, 로그인 세부정보(제한없음), 광고(없음), **콘텐츠 등급 제출완료**(ESRB E ·
  PEGI 3 · GRAC 전체이용가 — 전 기관 최저 연령), **타겟층 만 18세 이상만**,
  데이터 보안, 정부앱(아니오), 광고ID(사용안함), 카테고리(라이프스타일)·연락처,
  스토어 등록정보(문구는 자동·그래픽은 사용자 업로드)
- Play Console 함정: 각 폼에서 **저장을 눌러야 "다음"이 활성화**된다. IARC 약관
  체크박스는 새로고침하면 풀리고, 법적 동의라 사용자가 직접 눌러야 한다.

**⚠️ 개인정보 불일치 수정** — 방침엔 "호칭은 서버 전송 안 함"인데 `ResultScreen.tsx:147`이
`상담자 호칭: OO`을 `/summary`→OpenAI로 보내고 있었다. 코드에서 제거(커밋 `ee15508`).
AAB JS 번들에서 문자열 0건 검증. 부수효과로 **해몽 본문이 더 이상 이름을 부르지 않는다.**

**versionCode 2** — versionCode 1은 2026-07-18 Play 업로드로 소진됐다(재사용 불가).
`app-release.aab` 재빌드 완료(07-26 20:02, 병합 매니페스트 `versionCode="2"` 검증).

**원숭이 그래픽 통일** — 앱 내부는 이미 새 점술가 원숭이였고 **스토어 그래픽만 옛
라인아트**였다(`gen-store-graphics.ps1`의 `Draw-Mascot`가 코드로 그림). 피처 그래픽
재생성 + `scripts/refresh-splash-screenshot.py` 신규로 스플래시 스크린샷 합성.
`gen-store-graphics.ps1`에서 `icon-512.png` 생성 코드 제거(덮어쓰기 사고 방지).

### 남은 일

**출시(사용자 수동)** — 치트시트 `docs/release/play-console-checklist.md`
1. Play 비공개 테스트에 AAB 업로드. **단, 카테고리 개편을 먼저 끝내고 versionCode 3으로
   한 번에 올리는 편이 빌드를 아낀다.**
2. 테스터 12명 — 공식 문서상 **14일 연속 옵트인**, 중간 옵트아웃 시 리셋.
   **개발자 본인 계정 포함 가능 여부는 문서에 명시 없음** → 본인1+타인11 권장.
3. Render `starter` 실제 적용(대시보드, 결제 발생). `/health` 콜드스타트 **14.6초 실측**.
4. GitHub push — 커밋 8건이 로컬에만 있다.

**개편 이후 정리** — 구 엔드포인트(`/split`·`/interpret`·`/summary`·`/embed`) 삭제,
`screenshot-6-interpretation.png` 재캡처(해몽 화면이 바뀜).

### 확정 결정(재질문 불필요)

- 플랫폼: Android 먼저, iOS는 이후 EAS 클라우드 빌드. 출시: 클로즈드 테스트 먼저.
- 백엔드: Flask+Okt 그대로 Render 컨테이너. 모델 `gpt-4o-mini`.
- 앱명 `Monkey`, `applicationId=com.mswon.monkey`(영구). 아이콘=원숭이 점술가 일러스트.
- **프로필을 서버로 전송하지 않는다.** 기기 밖으로 나가는 건 꿈 텍스트뿐 — 방침과 Play
  데이터 보안 신고를 지키기 위한 제약.
- **이모지를 쓰지 않는다**(진정성 저하). 카테고리 제목은 한글 텍스트만.
- **성별은 쓰지 않고 프로필에서도 제거**한다(운세 비중을 성별로 나눌 근거 없음).
- 캐시는 전면 제거. 꿈 단위 유사도 매칭은 "다르게 쓴 꿈에 같은 해몽" 문제를 만든다.
  OpenAI 프롬프트 캐싱도 해당 없음(최소 1,024토큰인데 정적 프롬프트가 ~700).
- 서버 측 캐시 불가 — 꿈 텍스트를 서버에 저장해야 하므로 방침 위반.

---

<details>
<summary>이전 현황 (2026-07-19)</summary>

**출시 파이프라인 거의 완료 — 남은 건 사용자의 Play Console 업로드 하나뿐**
- **백엔드 배포**: Render `https://monkey-backend-htu8.onrender.com` 가동(루트 `.env` `SERVER_BASE_URL` 이 주소로 교체됨, 릴리스 번들에 인라인). `/health`·`/interpret` 프로덕션 검증 완료.
- **해몽 품질 개선**(`backend/keyword_server.py`): 모델 `gpt-3.5-turbo`→**`gpt-4o-mini`**(번역투 대폭 개선, 비용상수 갱신), `PERSONA_SYSTEM`에 자연스러운 구어체·번역투 금지 + 구체적 일상어 규칙, `/summary` 첫 문장을 구체적 핵심 한 줄로 시작(`## 종합 해몽`/`## 조언` 헤더 유지=프론트 파서 호환). 로컬+프로덕션 검증. 전통 RAG 근거 불변.
- **앱 아이콘/캐릭터**: `docs/release/store-assets/icon.png`(원숭이 점술가 일러스트) 기준으로 런처 아이콘(어댑티브 꽉찬 버전, 크림링 제거)·인앱 `Mascot`(이미지)·네이티브 스플래시 로고·스토어 512 아이콘 전부 교체. 생성기 `scripts/apply-monkey-icon.ps1`. 에뮬 검증.
- **키스토어**: `android/app/upload-keystore.jks` 생성(비번 `Wraith7766!@`, gitignore, **분실 시 업데이트 영구 불가—백업필수**). SHA256 `AA:26:27:D0:...:5C:A9`.
- **패키지명 변경(중요)**: Play Console 앱 생성 시 `com.xellos0304.monkey` → **`com.mswon.monkey`**로 확정. `android/app/build.gradle` 반영 + AAB 재빌드 완료(2026-07-19, AAB 매니페스트에서 패키지명 검증됨). iOS pbxproj는 아직 `com.xellos0304.monkey`(서로 달라도 무방, 통일하려면 Apple 앱 레코드 생성 전에).
- **릴리스 AAB**: `android/app/build/outputs/bundle/release/app-release.aab`(2026-07-19 재빌드, versionCode 1/versionName 1.0, 서명 업로드키 일치). **이 파일을 Play에 업로드.**
- **개인정보처리방침**: GitHub Pages 라이브 `https://ms-won.github.io/Monkey/`.
- **스토어 자료**: 문구 `docs/release/store-listing.md`, 그래픽(아이콘512·피처1024x500·스크린샷6장) `docs/release/store-assets/`.
- GitHub push 완료(`MS-Won/Monkey` main, origin=d2a4819 이후). git push는 Git Credential Manager 쓰기인증이 이 세션 비대화형에선 처음엔 행걸리나, 사용자가 자기 터미널서 1회 로그인하면 캐시돼 이후 통과됨.

**다음(사용자 수동) — 치트시트 `docs/release/play-console-checklist.md` 그대로 따라가기**
- 앱 만들기 ✅완료(2026-07-17). 남은 것: 스토어 등록정보(문구+그래픽) → 앱 콘텐츠(방침 URL·데이터보안 답변표·콘텐츠등급·타깃층) → **비공개 테스트 트랙에 `app-release.aab` 업로드 + 테스터 이메일 등록** → 검토 제출.
- Render `starter` 플랜은 `render.yaml`에만 반영됨 → **대시보드에서 실제 플랜 변경 필요**(결제 발생). 테스터 14일 실사용 기간 전에.

**확정 결정(재질문 불필요)**
- 플랫폼: Android 먼저, iOS는 이후 EAS 클라우드 빌드. 출시: 클로즈드(비공개) 테스트 먼저.
- 백엔드: 현 Flask+Okt 구조 그대로 Render 컨테이너 호스팅. 해몽 모델=gpt-4o-mini.
- 앱명 `Monkey`, `applicationId=com.mswon.monkey`(Play 등록 기준 영구). 아이콘=원숭이 점술가 일러스트.

</details>

