# 지금 상태와 다음 할 일

> 이 파일은 **PC 사이를 넘어가는 유일한 인수인계 수단**이다.
> Claude의 로컬 메모리는 PC를 넘어오지 않는다. 작업을 마칠 때 `/handoff`가 이 파일을 갱신하고,
> 다른 PC에서는 `/resume`이 이 파일을 읽어 이어받는다.

**마지막 갱신**: 2026-09-22 · 작업 PC: 메인 데스크톱
<!-- 해시는 적지 않는다. 이 파일을 커밋하는 순간 값이 바뀌어 항상 한 칸 어긋난다.
     정확한 시점은 `git log -1 -- docs/STATE.md` 로 확인할 것. -->
**검증 상태**: `npx tsc --noEmit` 0오류 · `npx jest` 27건 — 통과(2026-09-22 실행). 백엔드는 이번에 안 건드림(마지막 23건 통과 2026-08-31)

---

## 지금 상태

### 저장소
- 브랜치 `main`, origin과 동기화됨(이 핸드오프에서 푸시). 작업 트리 깨끗함.
- 미머지 브랜치 `worktree-store-screenshots`는 내용이 이미 main에 머지됨. 정리해도 무방.

### 앱
- **versionCode 6 / versionName 1.3 / targetSdk 36** — 릴리스 AAB 빌드·검증 완료, **Play 업로드는 아직**.
  - 파일: `android/app/build/outputs/bundle/release/app-release.aab` (129.9MB, 2026-09-22 01:01)
    — 빌드 산출물이라 git에 없다. **다른 PC에선 다시 빌드해야 한다**(그 PC에 `keystore.properties` 필수).
  - 검증: 업로드 키 SHA-256 `AA:26:…:5C:A9` 일치 / 번들에 Render 주소·`/reading` O, localhost·10.0.2.2 X /
    신규 문자열('이번 주'·'음성으로 입력') O
  - 출시 노트: `docs/release/release-notes-v1.3.md` (프로덕션 기준 문구)
- 2026-09-21 **출시 후 UI 다듬기 5건** (사용자 요청, 에뮬 실기 검증 완료):
  1. 꿈기록 탭 상단에 포커스 카드의 꿈 원문 3줄(말줄임, 높이 고정)
  2. 상세 화면 카드 뒷면 스크롤 불가 → `growBack` + 화면 전체 ScrollView (결과 화면과 같은 구조)
  3. 통계 그래프 곡선 → 각진 막대(`components/BarChart.tsx`, View 직접 렌더).
     첫 기록 주/달부터 최대 8칸, 칸이 적으면 가운데 정렬. 월 라벨은 첫 칸·1월만 연도 윗첨자(`²⁶년2월`).
     기간 계산은 `logic/statsPeriods.ts`(테스트 9건)
  4. FanCarousel 드래그 방향 반대 → `dragX` 부호 수정
  5. 홈 [해몽하기] 둥근 사각형 정중앙 + 음성 입력은 오른쪽 마이크 아이콘

### Play Console (저장소만 봐서는 알 수 없는 정보)
- 앱 `com.mswon.monkey` / 앱ID `4973430615478884995`
- **비공개 테스트 완료 → 프로덕션 액세스 권한 부여됨**(사용자 확인, 2026-09-22).
  **이제 새 버전은 프로덕션 트랙에 올린다.** 프로덕션에 이미 무엇이 라이브인지(versionCode 5인지)는 **미확인**.
- versionCode 6은 아직 어느 트랙에도 올라가지 않았다.

### 백엔드
- Render 무료 플랜 유지 중. `https://monkey-backend-htu8.onrender.com`
- `render.yaml`엔 `plan: starter`가 적혀 있으나 **대시보드 미적용** — 실서비스는 무료다.

---

## 진행 중이던 작업 — versionCode 6 프로덕션 업로드 (끊김)

사용자가 "Chrome Claude로 자동 업로드"를 요청했으나 **Claude Code 자동 모드 분류기가
Play Console 조작을 "Production Deploy"로 막았다**(개발자 계정 선택 클릭에서 차단, 채팅 승인 후 재시도도 차단).
우회하지 않고 중단했다. Play Console에서는 아무것도 바뀌지 않았다.

**다음 수 (둘 중 하나):**
- **사용자가 직접**: Play Console → Monkey → 프로덕션 → 새 버전 만들기 →
  AAB 드래그 → 출시명 `1.3 (6)` → 출시 노트(`release-notes-v1.3.md` 붙여넣기 블록) →
  국가 대한민국 확인 → 다음 → 검토를 위해 전송
- **Claude가**: 사용자가 자동 모드를 끄거나 권한 규칙을 추가한 뒤에만. 그래도 AAB(130MB)는
  Claude 업로드 도구 한도(10MB) 초과라 파일 선택은 사용자 몫.
- 사용자에게 물어볼 것: 단계적 출시 비율(UI만 바뀐 버전이라 100%도 무방), 출시 노트를
  신규 사용자용 소개형으로 바꿀지.

---

## 다음에 할 일

1. **versionCode 6 프로덕션 업로드** — 위 "진행 중이던 작업" 참조. 다른 PC라면 먼저 AAB 재빌드 + 지문 대조.
2. **Render 무료 플랜 재검토** — 프로덕션이 열렸으니 테스터가 아닌 일반 사용자가 콜드스타트(최대 ~1분)를 겪는다.
   워밍업 핑은 콜드스타트를 입력 시간 뒤로 숨길 뿐이다. starter($7/월)는 대시보드에서 사용자가 결제해야 한다.
3. **AAB 크기 130MB (미착수)** — 그중 **94MB가 카드 아트 30장**(장당 ~3MB). 표시 해상도로 리사이즈하면 크게 준다.
   R8은 무관(이미지가 원인). 프로덕션 신규 설치 전환율에 직접 영향.
4. **`react-native-chart-kit` 의존성 제거** — 막대그래프 교체로 이제 미사용. `npm uninstall` 한 줄이지만
   릴리스 전 재검증이 필요해 보류했다.
5. **알려진 미해결**:
   - `MainActivity`에 `configChanges` 없음 → 화면 회전 시 상태 유실.
   - 상세·결과 화면을 스크롤하면 플로팅 뒤로가기 버튼이 제목 위에 겹친다(기존 구조, 이번 범위 밖).
   - `StatsScreen` eslint 오류 1건(useCallback 의존성) — 기존부터 있던 것.

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
- **자동 모드에서 Play Console 조작은 "Production Deploy"로 차단된다.** 채팅 승인으로도 안 풀린다.
  업로드 자동화를 원하면 자동 모드를 끄고 진행할 것.
- **에뮬 테스트 데이터 시드**: 디버그 빌드는 `run-as com.mswon.monkey`로 `databases/dreams.db`를 꺼내
  파이썬 sqlite3로 행을 넣고 되밀어 넣을 수 있다. Git Bash에선 `MSYS_NO_PATHCONV=1` 필수
  (안 그러면 `/data/local/tmp`가 윈도우 경로로 바뀐다). 릴리스 앱이 깔려 있으면 먼저 `adb uninstall`.
- **Play 업로드 거부의 원인은 서명 키였다.** `keystore.properties`가 없는 PC에서 빌드하면 디버그 키로 조용히 폴백.
  **업로드 전 지문 대조 필수** → `docs/release/play-console-checklist.md` 2-2절
- Chrome 자동화 시 **창이 포그라운드가 아니면 스크린샷이 타임아웃**된다.
- 이 PC는 메모리 압박 시 Claude Code가 백그라운드 Metro를 죽인다. 에뮬+Metro+Gradle 동시 구동을 피할 것.
