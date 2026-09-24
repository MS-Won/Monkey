# 지금 상태와 다음 할 일

> 이 파일은 **PC 사이를 넘어가는 유일한 인수인계 수단**이다.
> Claude의 로컬 메모리는 PC를 넘어오지 않는다. 작업을 마칠 때 `/handoff`가 이 파일을 갱신하고,
> 다른 PC에서는 `/resume`이 이 파일을 읽어 이어받는다.

**마지막 갱신**: 2026-09-24 · 작업 PC: 메인 데스크톱
<!-- 해시는 적지 않는다. 이 파일을 커밋하는 순간 값이 바뀌어 항상 한 칸 어긋난다.
     정확한 시점은 `git log -1 -- docs/STATE.md` 로 확인할 것. -->
**검증 상태**: `npx tsc --noEmit` 0오류 · `npx jest` 27건 — 통과(2026-09-22 실행). 백엔드는 이번에 안 건드림(마지막 23건 통과 2026-08-31)

---

## 지금 상태

### 저장소
- 브랜치 `main`, origin과 동기화됨(이 핸드오프에서 푸시). 작업 트리 깨끗함.
- 미머지 브랜치 `worktree-store-screenshots`는 내용이 이미 main에 머지됨. 정리해도 무방.

### 앱
- **versionCode 6 / versionName 1.3 / targetSdk 36** — **2026-09-24 프로덕션 트랙에 검토 제출 완료**(아래 Play Console 참조).
  - 2026-09-23 `f006c00`: 카드 아트 30장 PNG→WebP(q85) → **AAB 129.9MB→50.3MB**, Play 표시 신규 설치 크기 **36MB**.
    `react-native-chart-kit`도 이때 제거됨. 무손실 마스터는 `img/`에 PNG로 남아 있다.
  - 검증: 업로드 키 SHA-256 `AA:26:…:5C:A9` 일치 / 번들 카드 에셋 webp 30·png 0 / Render 주소·`/reading` O, localhost X
  - 출시 노트: `docs/release/release-notes-v1.3.md` — **입력칸은 `<ko-KR>…</ko-KR>` 태그째 붙여넣어야 한다**
- 2026-09-21 출시 후 UI 다듬기 5건(꿈기록 원문 · 상세 스크롤 · 막대그래프 · 스와이프 방향 · 해몽하기 버튼) — v1.3에 포함.

### Play Console (저장소만 봐서는 알 수 없는 정보)
- 앱 `com.mswon.monkey` / 앱ID `4973430615478884995` / 프로덕션 트랙ID `4697577471672388155`
- 비공개 테스트 완료 → 프로덕션 액세스 부여됨(2026-09-22).
- **2026-09-24 프로덕션에 `1.3 (6)` 전체 출시(100%) + 국가 대한민국 1개로 검토 제출** → "검토 중인 변경사항" 상태.
  - 초안이 한때 **177개국(+기타 국가 자동 추가)**으로 잡혀 있었다 → 사용자 결정으로 **대한민국만**으로 수정 후 제출.
  - **관리형 게시가 꺼져 있다** → 심사 통과 즉시 자동 공개된다.
  - 가독화 파일(R8 매핑) 없음 경고 1건 — R8 미사용이라 무시.

### 백엔드
- Render 무료 플랜 유지 중. `https://monkey-backend-htu8.onrender.com`
- `render.yaml`엔 `plan: starter`가 적혀 있으나 **대시보드 미적용** — 실서비스는 무료다.

---

## 다음에 할 일

1. **프로덕션 심사 결과 확인** (2026-09-24 제출, 보통 7일 이내). 관리형 게시 OFF라 통과 시 바로 공개. 거부되면 사유 확인.
2. **Render 무료 플랜 재검토** — 일반 사용자가 콜드스타트(최대 ~1분)를 겪는다. starter($7/월)는 사용자가 대시보드에서 결제해야 한다.
3. **알려진 미해결**:
   - `MainActivity`에 `configChanges` 없음 → 화면 회전 시 상태 유실.
   - 상세·결과 화면을 스크롤하면 플로팅 뒤로가기 버튼이 제목 위에 겹친다.
   - `StatsScreen` eslint 오류 1건(useCallback 의존성).

---

## 옆 프로젝트: Shorts (이 저장소 아님)

2026-09-01 세션은 **`github.com/MS-Won/Shorts`**에서 작업했다. 로컬 경로 `D:/00 My Project/04 Shorts`.
그쪽 `docs/STATE.md`에서 `/resume`. 한 줄 요약: AI 쇼츠 자동 생성 파이프라인, 코드 완료, 사용자 수동 5건 남음.

---

## 최근에 알게 된 것 (같은 삽질 반복 금지)

- **`created_at`은 UTC ISO로 저장된다.** SQLite `date(created_at)`으로 묶으면 UTC 날짜가 되어
  KST 0~9시 기록이 전날로 샌다. 날짜 집계는 JS에서 `new Date(iso)`(로컬)로 할 것 → `statsPeriods.countByPeriod`.
  **에뮬레이터 시간대는 GMT**라 이 버그가 에뮬에선 안 보인다(단위 테스트로 잡았다).
- **카드 안쪽 ScrollView는 Android에서 스크롤이 안 먹는다** — `DreamCard`는 뒤집기 `Pressable` + 3D `rotateY`
  안에 뒷면이 있다. 긴 내용은 `growBack` + 바깥 ScrollView로.
- **Chrome 확장이 연결 안 될 때**: 설치돼 있어도 Chrome을 완전히 종료 후 재시작해야 붙었다
  (`list_connected_browsers`가 `[]`면 이 경우).
- **자동 모드에서 Play Console 조작**: 2026-09-24엔 초안 편집·국가 수정·검토 제출 클릭까지 통과했고,
  제출 직후 페이지 읽기(JS)만 "Production Deploy"로 차단됐다(스크린샷은 됨). 9/22엔 계정 선택부터 막혔다 — 일관되지 않다.
- **Play 출시 노트는 언어 태그 필수** — 태그 없이 넣으면 "텍스트가 언어 태그 밖에 있습니다 / 0개의 언어" 오류.
- **프로덕션 국가 타겟팅 기본값이 전 세계일 수 있다** — 제출 전 게시 개요의 "국가/지역" 변경 항목을 반드시 확인.
- **에뮬 테스트 데이터 시드**: 디버그 빌드는 `run-as com.mswon.monkey`로 `databases/dreams.db`를 꺼내
  파이썬 sqlite3로 행을 넣고 되밀어 넣을 수 있다. Git Bash에선 `MSYS_NO_PATHCONV=1` 필수
  (안 그러면 `/data/local/tmp`가 윈도우 경로로 바뀐다). 릴리스 앱이 깔려 있으면 먼저 `adb uninstall`.
- **Play 업로드 거부의 원인은 서명 키였다.** `keystore.properties`가 없는 PC에서 빌드하면 디버그 키로 조용히 폴백.
  **업로드 전 지문 대조 필수** → `docs/release/play-console-checklist.md` 2-2절
- Chrome 자동화 시 **창이 포그라운드가 아니면 스크린샷이 타임아웃**된다.
- 이 PC는 메모리 압박 시 Claude Code가 백그라운드 Metro를 죽인다. 에뮬+Metro+Gradle 동시 구동을 피할 것.
