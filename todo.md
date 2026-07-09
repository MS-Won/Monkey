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
* [ ] **사용자 실행 필요(RELEASE.md 참조)**: 백엔드 배포(Render 등)+`SERVER_BASE_URL` 교체 / 업로드 키스토어 생성·백업 / `bundleRelease` AAB / 방침 URL 호스팅 / Google Play 계정·Console 클로즈드 테스트 업로드
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
