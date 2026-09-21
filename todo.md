# TODO.md

## Core Features

* [x] Implement Home tab — 오로라 히어로+홀로 CTA, 실기 e2e 검증 완료(2026-07-06)
* [x] Implement Dream Diary tab — FanCarousel+상세/삭제, 실기 e2e 검증 완료(2026-07-06)
* [x] Implement Statistics tab — 차트/키워드/로또력, 실기 e2e 검증 완료(2026-07-06)
* [x] Implement Profile tab — 온보딩/수정 폼, 실기 e2e 검증 완료(2026-07-06). 현재는 해몽에 미반영(추후 다른 용도 예정)
* [x] Complete dream interpretation flow — Home→Split→해석→종합(점술가 어조)→카드 선정→DB 저장까지 실제 GPT 호출로 실기 검증 완료(2026-07-06)
* [ ] Connect Supabase backend — **의도적으로 보류**: 로컬 SQLite(dreams.db)+AsyncStorage로 유지하기로 확정(사용자 결정, 이전 세션). 재검토 전까지 불필요
* [x] **[2026-07-09] 해몽 정확성 개선 — 전통 해몽 사전 그라운딩(경량 RAG)** — `backend/dream_dictionary.json`(전통 상징 ~90개, 표제어·동의어·의미·극성)+`backend/dream_lexicon.py`(Okt 명사/동사 원형 매칭) 신규. `/interpret`가 매칭 상징의 전통 의미를 프롬프트 근거로 주입 + 서양식/뉴에이지 해석 금지 하드룰 + temp 0.8→0.5. finding 8사례 실기 검증: 오답 4건(정반대 포함)→0건, 전통 정설 8/8 일치. 다중 문장/기상 메타문장 필터/동음이의어(눈 目↔雪) 처리 검증 완료. 계획: `chat-gpt-sleepy-flute.md`. **후속 여지**: (1) 프론트 `splitSummaryAndAdvice` 파서가 `## 조언`만 인식 → 모델이 드물게 `### 조언` 출력 시 파싱 취약(기존 이슈, 이번 범위 밖). (2) '물'+'물에빠짐' 동시 매칭(경미). (3) 임베딩 캐시가 개선 전 결과 마스킹 가능 → 실기 시 `cache` 테이블 비우기.

## UI / UX

* [x] **[2026-09-21] 출시 후 UI 다듬기 5건(에뮬 실기 검증)** — (1) 꿈기록 탭 상단에 포커스 카드의 **꿈 원문 3줄**(말줄임, 높이 고정). (2) 상세 화면 카드 뒷면 **스크롤 불가 수정**: 카드 내부 ScrollView가 뒤집기 Pressable+3D 회전 안에 있어 Android가 제스처를 못 넘겨줬다 → 결과 화면처럼 `growBack` + 화면 전체 ScrollView. (3) 통계 그래프를 곡선→**각진 막대**(`components/BarChart.tsx`, View 직접 렌더). 첫 기록 주/달부터 최대 8칸, 오래된 순, 칸이 적으면 가운데 정렬. 라벨 `7주 전…이번 주` / `²⁶년2월 3월…`(연도는 첫 칸·1월만 윗첨자). 기간 계산은 순수 함수 `logic/statsPeriods.ts`(테스트 9건). **부수 수정**: `created_at`이 UTC ISO인데 SQLite `date()`로 묶어 KST 0~9시 기록이 전날로 집계되던 버그 → 로컬 시각으로 집계. `chartTheme.ts` 삭제. (4) FanCarousel **드래그 방향 반대** 수정(`- dragX` → `+ dragX`, 손 뗀 뒤 판정은 원래 맞았음). (5) 홈 [해몽하기]를 **둥근 사각형**(`HolographicButton shape="rounded"`)으로 정중앙에, 음성 입력은 오른쪽 48px 마이크 아이콘으로. 검증: tsc 0 / jest 27건 / 에뮬(API 37)에서 시드 45건으로 주·월 그래프, 드래그 중간 프레임 방향, 원문 갱신, 상세 스크롤, 홈 버튼 중앙 정렬 육안 확인. `react-native-chart-kit` 의존성은 이제 미사용(제거는 보류).
* [x] **[2026-07-09~10] 카드 이미지 교체 + 한글 라벨 합성** — `img/NN_Name.png` 원본 30장(영문 Symbol/의미·상단 id 포함)을 소스로, 상단 id 메달리온 **아래**에 한글 이름+의미를 합성해 `frontend/assets/images/cards/NN.png` 전량 교체. 스크립트 `scripts/apply-card-labels.py`(id→한글 매핑, id 안 가림). **라벨 디자인 3차 반복**: (1) 평범 라운드 사각형 → (2) "하단 네임플레이트처럼" 피드백에 아르누보 카투슈 배너 → (3) "투명하게+가로줄로 세련되게" 피드백에 **최종: 투명 배경 + 위/아래 골드 헤어라인(중앙·양끝 마름모 finial) + 아이보리 세리프(외곽 stroke로 밝은/어두운 배경 모두 가독)**. 4× 슈퍼샘플→LANCZOS. 30장 실기 생성·에뮬 육안 검증 완료.
* [x] **[2026-07-10] 통계탭 디자인/문구 개선** — (1) "최근 30일 꿈 기록"·"최근 자주 등장한 꿈 키워드" 카드 내용 가운데 정렬, (2) 키워드 표기를 DB 영문 카드명→한글(`resolveArchetypeCard().nameKo`)로 변환("이번 달의 꿈 키워드" 목록 포함), (3) 대표 키워드 코멘트를 카드 `meaning`+`essence`+`polarity`(light/neutral/shadow별 조언) 조합의 의미 기반 문장/조언으로 재작성 + 한글 받침 조사 자동 처리(`josa`). `tsc` 0오류, 에뮬 육안 검증 완료.
* [x] **[2026-07-09] 카드 오버레이 정리 + 꿈기록 탭 개선(에뮬 실기 검증)** — 카드 이미지에 텍스트가 다 구워져 앱 `DreamCard` 오버레이(상단 No./영문명 + 하단 한글명/의미)와 스크림이 중복·충돌 → **앞면 오버레이·스크림 전부 제거**(이미지만 표시, 뒷면 해몽 유지). 하단탭 **"꿈카드"→"꿈기록"** 리네임(navigator + DiaryScreen 헤더/빈상태). FanCarousel **가운데(선택) 카드를 가장 크게**(양옆 scale 0.76/0.68/0.6로 축소, compact 카드폭 158→178, stage 260→320). `tsc --noEmit` 0오류, 에뮬레이터 리로드 후 육안 검증 완료.
* [x] **[2026-07-06] Dream Goddess 아르누보 리디자인** — 홀로그래픽 → 이리데슨트+아르누보(무하풍)로 전환. 30장 아키타입을 AI 생성 실제 일러스트 카드로 교체(무료 Pollinations FLUX, `scripts/gen-card-art.py`로 1회 생성 후 정적 고정). 디자인 바이블 `docs/design/dream-goddess-bible.md`. DreamCard 앞면=full-bleed 일러스트+골드 텍스트 오버레이. 골드 Ornament 플러리시+골드 라인 토큰으로 전 화면 아르누보 톤. 에뮬레이터 실기 검증 완료.
* [x] **[2026-07-06] UX 수정 4건** — (1) 해몽 결과·음성 입력·꿈 기록 화면에 뒤로가기 버튼(신규 `BackButton`) 추가, (2) 카드 한글 의미 한 줄 강제(줄바꿈 제거), (3) 꿈일기→**꿈카드** 리네임, (4) 꿈카드 캐러셀 세로 중앙 정렬 + 카드 넘길 때 상단에 해당 날짜 표시. 실기 검증 완료.
* [x] **[2026-07-06] 홀로그래픽 타로 리디자인** — 구 "달빛 서재"(네이비+골드) 폐기, image_sample.png 참고 iridescent 톤으로 전환. 30종 아키타입 카드(Card.txt) + SVG 홀로그래픽 프레임/시길. 상세: docs/design/holographic-redesign.md
* [x] **[2026-07-06] 메인/스플래시 오로라 마감** — AuroraBackground/HolographicButton 신규, HomeScreen 히어로+글래스+홀로 CTA, Splash 홀로 헤일로 마스코트+태그라인, 네이티브 런처아이콘/스플래시 색을 홀로그래픽으로 동기화(PNG 재생성). (남은: 에뮬레이터 실기 육안 검증 — 리빌드 필요)
* [x] **[2026-07-06] 해몽 어조 개선** — 백엔드 프롬프트를 점술가 어조로 재작성(전통 해몽 유지, 공포 금지), 카드 심볼/의미를 해몽 본문과 연동, 마크다운 헤더 파싱 불일치 버그 수정
* [x] **[2026-07-06] Profile 컨텍스트 해몽 반영 제거** — 연령/성별/직업별 차등 해몽 중단(Profile 탭 추후 용도 변경 예정)
* [x] Redesign app with modern Toss-style UI ("달빛 서재" 컨셉: 네이비+골드 팔레트, 키워드 카드/원숭이 마스코트 시그니처) — 이후 홀로그래픽으로 전환됨
* [x] Create consistent design system (Colors/Typography/Spacing/Radius 토큰 + Card/Chip/Button/TextField/BottomSheet 공용 컴포넌트)
* [x] Improve typography and spacing (Pretendard+NanumMyeongjo 폰트, 타이포 스케일 확장)
* [x] Improve animations and transitions (DreamCard 플립, CardCreationLoader, FanCarousel 제스처 애니메이션 — reanimated/gesture-handler 활용)
* [x] Design app icon and splash screen (어댑티브 아이콘+레거시 PNG, 네이티브 스플래시 마스코트 마크)
* [ ] Support dark mode — 사용자와 협의 후 라이트모드 미구현으로 확정(다크 테마 하나만 정제). 별도 토글 인프라는 만들지 않기로 결정.

## Beta Release

* [x] **[2026-07-10] 출시 준비(코드/설정/문서) 완료 — Android 클로즈드 테스트 대상** — 계획 `~/.claude/plans/lovely-launching-phoenix.md`. 백엔드 컨테이너화(`backend/Dockerfile`·`.dockerignore`·requirements 핀+gunicorn·`/health`·`PORT` env, 로컬 2차인스턴스로 /health 200 검증), 앱 `__DEV__` 서버표시 숨김, Android `RECORD_AUDIO` 선언, 앱이름 `Monkey`, `applicationId=com.xellos0304.monkey`(영구 확정), 릴리스 서명 설정(`keystore.properties` 폴백, gradle config 평가 통과), 개인정보처리방침(`docs/legal/privacy-policy.md`)·스토어문구(`docs/release/store-listing.md`)·핸드오프 가이드(`docs/release/RELEASE.md`). tsc 0오류.
* [x] **[2026-07-12~19] 출시 파이프라인 실행 완료** — 백엔드 Render 배포(`https://monkey-backend-htu8.onrender.com`, `/health`·`/interpret` 프로덕션 검증)+`SERVER_BASE_URL` 교체, 해몽 품질 개선(gpt-4o-mini+프롬프트), 앱 아이콘/인앱 캐릭터/스플래시를 원숭이 점술가 일러스트로 교체, 업로드 키스토어 생성(`android/app/upload-keystore.jks`, **백업 필수**), 방침 GitHub Pages 라이브(`https://ms-won.github.io/Monkey/`), 스토어 그래픽 자산(`docs/release/store-assets/`), **패키지명 `com.xellos0304.monkey`→`com.mswon.monkey` 확정 후 서명 AAB 재빌드**(2026-07-19, 매니페스트 검증됨).
* [x] **[2026-08-26] targetSdk 36 실기 검증 + 미머지 UI 수정 머지 후 AAB 재빌드** — 에뮬(AVD `Medium_Phone`, **API 37/Android 17** 이미지로 36보다 엄격하게) 실기 검증: 뒤로가기 3케이스(바텀시트 닫힘 / 스택 화면 복귀 / 루트 종료) 정상, 상·하단 인셋 잘림 없음, 릴리스 빌드로 Render 백엔드 해몽 e2e 성공. **`worktree-store-screenshots`(2026-07-28)가 main에 머지된 적이 없어 versionCode 4 AAB에 UI 수정 3건이 빠져 있던 것을 발견** → 머지(`b283b8b`) 후 versionCode 4 그대로 재빌드. 재빌드본 검증: AAB 매니페스트 targetSdk 36/versionCode 4, UPLOAD 키 서명, 번들에 Render주소·`/reading` O·localhost X, arm64 `.so` 12개. 머지분이 실제 번들에 들어갔는지 구/신 Hermes 문자열 테이블 비교로 확인(홈 칩 3종 NEW=1/OLD=0). 스모크 테스트로 꿈 기록 헤더 여백·홈 개선 육안 확인.
* [x] **[2026-08-30] 서버 연결 오류 수정 — 콜드스타트 대응** — 증상은 "해몽을 가져오지 못했습니다". 원인은 코드 버그가 아니라 **Render 무료 플랜의 유휴 슬립**이었다(실측 `/health` 콜드 52.5초 / 웜 0.07초, 웜 `/reading` 6.4초 200). 앱엔 워밍업·재시도·타임아웃·진행표시가 전부 없어서 세션 첫 해몽이 죽은 스피너로 1분을 끌거나 스핀업 중 Render 엣지의 502 HTML을 받고 끝났다. 수정: `frontend/src/logic/serverWarmup.ts` 신규(앱 기동·포그라운드 복귀 시 `/health` 핑, 동시호출 공유, 10분 TTL, 실패해도 무해) + `fetchReading` 재시도·지수백오프·타임아웃·`ReadingError` kind 분류(4xx는 재시도 안 함, 200-non-JSON도 서버오류로 처리) + `ResultScreen` 경과별 로더 문구와 [다시 시도] 버튼. 신규 단위 테스트 18건, tsc 0 / eslint 0 / 백엔드 23건. 커밋 `7fc0299`. **사용자 선택으로 Render는 무료 플랜 유지** — 앱 쪽 흡수만으로 대응.
* [x] **[2026-08-31] Play Console 비공개 테스트에 versionCode 5 업로드·검토 제출 완료**
  트랙 `비공개 테스트 - Alpha`에 `1.2 (5) - 서버 연결 오류 수정` 제출, **검토 중**.
  **지난 업로드가 실패했던 진짜 이유는 서명 키 불일치였다.** draft에 "Android App Bundle이
  잘못된 키로 서명되었습니다"라는 Play 거부 기록이 남아 있었다 — 파일 크기 문제가 아니라
  Play가 되돌려보낸 것이었고, 사용자가 다른 파일을 올렸던 것으로 보인다. 이 PC 빌드는
  Play 기대 업로드 키 지문과 일치함을 확인했고, 그대로 올리니 통과했다.
  업로드 전 지문 대조 절차는 `docs/release/play-console-checklist.md` 2-2절.
  ⚠️ 심사 통과 전까지 테스터에게는 **versionCode 1(7월 빌드)** 이 계속 나간다.
* [x] **[2026-08-31] Play Console 스토어 스크린샷 5장 교체 완료** — 구 6장 삭제 후 신규 5장 업로드, 순서 `2-home → 5-card → 6-interpretation → 3-diary-cards → 4-stats`로 정렬, 저장 후 검토 제출까지 완료. 1080×2400(9:20)이지만 Play가 자르기 없이 그대로 수용했다.
  **자동화 방법(재사용 가능):** 이 페이지엔 `input[type=file]`이 DOM에 없다 — 「애셋 추가」가 클릭 시점에 만든다. 그래서 `HTMLInputElement.prototype.click`을 먼저 후킹해 **네이티브 파일 대화상자를 차단**한 뒤 버튼을 누르면, Play의 실제 업로더(`SIMPLE-UPLOADER`, `accept=".jpeg,.jpg,.png"`, multiple)가 DOM에 남는다. 거기에 파일을 실어 `change`를 dispatch → 애셋 패널에서 「추가」 클릭. 순서는 썸네일이 HTML5 `draggable=true`라 dragstart/dragover/drop 합성으로 재정렬된다(삽입 방식). 작업 후 후킹과 주입 요소는 반드시 원복할 것.
  ⚠️ 배치 업로드 시 Play가 애셋 패널의 최근순을 뒤집어 넣으므로 순서가 뒤섞인다 — 넣은 뒤 반드시 확인할 것.
* [x] **테스터 등록 — 2026-08-30 기준 34명**(이메일 목록 `나` 1명 + `테스터` 33명). 프로덕션 신청 요건은 12명 × 14일 연속 옵트인이므로 인원은 충족. 남은 건 14일 연속 실사용 유지.
  ⚠️ **테스터들이 지금 쓰는 건 versionCode 1(1.0 / targetSdk 35, 8월 24일 게시)** — 서버 연결 수정도, 카드 라벨·헤더·통계 개선도 하나도 안 들어간 7월 빌드다. 즉 테스터가 겪는 "해몽을 가져오지 못했습니다"가 이번에 고친 그 버그다. versionCode 5 업로드가 시급하다.
  참고: 같은 트랙에 새 버전을 올려도 **옵트인 링크·테스터 목록은 그대로**이고, 14일 카운터도 리셋되지 않는다(요건은 옵트인 연속성이지 빌드 고정이 아님). 패키지명·업로드 키가 같아 덮어쓰기 업데이트라 테스터의 기존 꿈 기록도 보존된다.
* [ ] ~~사용자 수동 1건 — Play Console 비공개 테스트 업로드~~ (위 항목들로 분해): 앱 생성은 2026-07-17 완료. 남은 것은 스토어 등록정보 → 앱 콘텐츠(데이터 안전 답변표) → 비공개 테스트 트랙에 `app-release.aab` 업로드(**versionCode 4 / targetSdk 36 재빌드본**) → 테스터 12명 등록. 복붙용 치트시트 `docs/release/play-console-checklist.md`.
* [ ] Render 플랜 `starter` 실제 적용(대시보드/Blueprint 재동기화, 결제 발생) — `render.yaml`은 이미 `plan: starter`지만 대시보드 미적용이라 **실서비스는 무료 플랜으로 돌고 있다**(2026-08-30 실측 콜드스타트 52.5초로 확인). 2026-08-30 사용자 판단으로 일단 무료 유지 + 앱 쪽 흡수를 택함. 테스터 12명×14일 실사용 구간에서 첫 실행 체감이 계속 문제되면 재검토할 것.
* [x] **[2026-08-25] targetSdk 36(Android 16) 상향 — Play 2026-11-01 요구사항 대응** — `compileSdk`/`targetSdk` 35→36, buildTools 36.0.0, `versionCode 4`/`versionName 1.2`. RN 0.79엔 `OnBackInvokedCallback` 구현이 없어 매니페스트에 `android:enableOnBackInvokedCallback="false"`(API 36에서도 유효한 옵트아웃, RN 0.81+ 올리면 제거). AGP 8.8.2용 `android.suppressUnsupportedCompileSdk=36`. 정적 검증 전항목 통과(매니페스트 targetSdk 36 / arm64 `.so` 12개 16KB 정렬 / `zipalign -P 16` OK / 번들에 Render주소·`/reading` O, localhost X). 빌드가 처음 깨진 건 targetSdk 탓이 아니라 **PC 프리즈로 `platforms/android-36/package.xml`이 널바이트로 손상**된 것이었고 `android-35`판에서 재구성해 복구. **⚠️ 에뮬 실기 검증 미완**(뒤로가기·인셋 2건) — 다음 세션.
* [x] **Play 심사 결과 확인** — ✅ 2026-09-22 사용자 확인: 앱 발매 성공, 비공개 테스트 완료로 **프로덕션 액세스 권한 부여됨**. (이하 원래 기록) (2026-08-31 제출, 보통 7일 이내) — AAB versionCode 5와 스토어 스크린샷 5장 두 건이 검토 중. 통과하면 테스터 34명에게 자동 업데이트로 내려가며 서버 연결 오류가 해소된다. 거부되면 사유 확인 후 대응.
* [ ] **AAB 크기 130MB 축소 검토** — 그중 **94MB가 카드 아트 30장**(장당 약 3MB). 테스터 다운로드 부담이 크고 Play 한도에도 여유가 적다. 표시 해상도로 리사이즈·재압축하면 크게 줄어든다. R8/proguard는 도움이 안 된다(코드가 아니라 이미지가 원인이며 현재 `enableProguardInReleaseBuilds = false`).
* [ ] **`MainActivity`에 `configChanges` 없음** — 화면 회전 시 상태가 유실된다. 이전 세션부터 미결.
* [ ] Internal testing
* [ ] Fix critical bugs
* [ ] Publish Android Beta
* [ ] Collect user feedback

## Monetization

* [ ] Define premium features
* [ ] Add subscription model
* [ ] Add ad strategy
* [ ] Analyze retention and revenue metrics

## Production Release

* [ ] **versionCode 6(1.3) 프로덕션 업로드** — AAB 빌드·검증 완료(2026-09-22, 업로드 키 지문 일치, 번들 Render 주소·신규 문자열 확인). 출시 노트 `docs/release/release-notes-v1.3.md`. Claude 자동화는 자동 모드 분류기가 "Production Deploy"로 차단해 중단 → 사용자가 직접 올리거나 자동 모드를 끄고 진행. 절차는 `docs/STATE.md` "진행 중이던 작업".
* [ ] **`react-native-chart-kit` 제거** — 2026-09-21 막대그래프(`BarChart.tsx`)로 교체해 미사용. `npm uninstall` 후 tsc/jest + 릴리스 번들 확인.
* [ ] Optimize performance
* [ ] Prepare privacy policy
* [ ] Prepare store assets
* [ ] Publish to Google Play Store
* [ ] Prepare iOS release

## Future Ideas

* [ ] Dream trend analysis
* [ ] AI-powered dream insights
* [ ] Dream calendar view
* [ ] Personalized recommendations
