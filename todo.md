# TODO.md

## Core Features

* [x] Implement Home tab — 오로라 히어로+홀로 CTA, 실기 e2e 검증 완료(2026-07-06)
* [x] Implement Dream Diary tab — FanCarousel+상세/삭제, 실기 e2e 검증 완료(2026-07-06)
* [x] Implement Statistics tab — 차트/키워드/로또력, 실기 e2e 검증 완료(2026-07-06)
* [x] Implement Profile tab — 온보딩/수정 폼, 실기 e2e 검증 완료(2026-07-06). 현재는 해몽에 미반영(추후 다른 용도 예정)
* [x] Complete dream interpretation flow — Home→Split→해석→종합(점술가 어조)→카드 선정→DB 저장까지 실제 GPT 호출로 실기 검증 완료(2026-07-06)
* [ ] Connect Supabase backend — **의도적으로 보류**: 로컬 SQLite(dreams.db)+AsyncStorage로 유지하기로 확정(사용자 결정, 이전 세션). 재검토 전까지 불필요

## UI / UX

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
