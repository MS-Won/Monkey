# 홀로그래픽 타로 리디자인 (현재 방향)

> 참고 샘플: `C:\Users\User\Downloads\image_sample.png` (ANTIGRVTY / Tarot Bacot)
> 스킬: `.claude/skills/ui-ux-pro-max` — 원본 풀 설치(SKILL.md + CSV 15종 + search.py 엔진). git/Python312 설치 후 GitHub 클론→설치.
> 스킬 실행 예: `python .claude/skills/ui-ux-pro-max/scripts/search.py "쿼리" --domain style --design-system`
> 스킬 검증 결과가 이 방향을 뒷받침함: style 도메인이 **"Gradient Mesh / Aurora Evolved"**(iridescent/holographic, SVG 10/10) 추천, color가 `#7C3AED/#8B5CF6` 퍼플 추천 → 본 구현과 일치. 접근성 주의: Text contrast.

## 방향
구버전 "달빛 서재"(네이비 #0E1A2B + 골드)를 버리고, **딥 인디고-바이올렛 캔버스 위
iridescent(violet→magenta→cyan) 발광 + 골드 포인트**의 홀로그래픽 신비 톤으로 전환.
카드는 타로를 레퍼런스로 한 30종 아키타입(홀로그래픽 프레임).

## 토큰 (frontend/src/theme)
- `colors.ts`: 토큰 **키는 유지**, 값만 홀로그래픽으로 교체 → 전 화면 자동 전환.
  - canvas `#0D0A1F` / card `#171233` / elevated `#221A45`
  - text `#F3EEFF` / `#B9ACD9` / `#7E71A6`
  - accentPrimary(홀로 바이올렛) `#B98BFF`, accentGold `#F4C15A`
  - `HoloGradient`(신규): card/border/cta/aurora 그라디언트 스톱 배열(SVG용)
- `typography.ts`: `cardSymbol`(타로 대문자 세리프), `cardMeaning` 추가. 폰트는 기존 NanumMyeongjo+Pretendard 유지.

## 홀로그래픽 구현 (네이티브 의존성 0)
LinearGradient 라이브러리 없음 → **react-native-svg(설치됨)**로 구현.
- `components/holo/HolographicFrame.tsx`: onLayout 실측 → SVG 대각선 iridescent 스윕 + 상단 글로우 + 보더 링. 유동 크기 대응.
- `components/holo/ArchetypeSigil.tsx`: 카드 중앙 신비 문양. polarity로 중심 글리프(light=광선/neutral=초승달/shadow=삼각+눈), id로 별자리 점 변주 → 30장 개별 일러스트 없이 한 벌 덱 느낌. (AI 이미지 호출 0, 비용 규칙 준수)

## 카드 컴포넌트
`components/DreamCard/DreamCard.tsx` 리팩터: prop이 `keyword: string` → **`card: ArchetypeCard`**.
- 앞면: 상단 `No.NN` + 영문 심볼명(대문자) / 중앙 시길 + 한글명 / 하단 의미 + 힌트
- 뒷면: 가독성 위해 어두운 표면 + 홀로 보더(3D 플립 유지)
- 사용처: ResultScreen, DiaryDetailScreen, FanCarousel(compact)

## 화면 연동
- ResultScreen: `selectArchetypeCard(dreamText, 해몽)`으로 카드 선정 → 카드 표시 + DB `keyword`에 **카드 영문명** 저장.
- DiaryDetail/FanCarousel: `resolveArchetypeCard(keyword, ...)`로 복원(레거시 한글 키워드는 텍스트 재선정 폴백).

## 메인/스플래시/네이티브 마감 (2026-07-06 추가 완료)
- 신규 `components/holo/AuroraBackground.tsx`: SVG RadialGradient 3블롭(violet/magenta/cyan) 전체화면 오로라. 퍼센트 좌표라 측정 불필요.
- 신규 `components/holo/HolographicButton.tsx`: 샘플의 골드→마젠타 그라디언트 CTA(`HoloGradient.cta`, onLayout 실측). HomeScreen "해몽하기"에 사용.
- `HomeScreen`: 오로라 배경 + 세리프 히어로 인사 + overline 라벨 + 글래스 입력 패널 + 홀로 CTA로 재구성.
- `SplashScreen`: 오로라 배경 + 홀로 헤일로 안 마스코트(`Mascot holo`) + 워드마크 + "꿈을 풀다" 태그라인.
- `Mascot`: `holo?: boolean` prop 추가(true=violet→cyan 그라디언트 스트로크). 기존 호출부 무영향.
- 네이티브: `values/colors.xml` ic_launcher_background `#0E1A2B`→`#0D0A1F`, `ic_launcher_foreground.xml` 마스코트 `#D4B06A`→`#C9A2FF`, `scripts/gen-launcher-icons.ps1` 색 상수 동기화 후 재실행해 PNG(mdpi~xxxhdpi) 재생성.

## 실기 검증 완료 (2026-07-06)
- `gradlew installDebug` 풀 리빌드 + 에뮬레이터 실기로 전 화면 확인 완료. 네이티브 런처아이콘/스플래시 홀로그래픽 색 정상 반영.
- `AuroraBackground`를 Home/Splash 외 Result/Diary/DiaryDetail/Stats/Profile/InputScreen/CardCreationLoader까지 전 화면 확장 적용 완료.
- 실제 OpenAI 백엔드로 전체 플로우(Split→해석→카드선정→종합해몽→DB저장) e2e 검증 완료. 발견된 버그(LogBox 터치 차단, HomeScreen 프로필 미갱신, 카드 선정 오탐)는 모두 수정됨 — 자세한 내용은 프로젝트 메모리 "추가 6" 참고.

## 개선 여지 (남음)
- iridescent 애니메이션(스윕 이동)은 정적. 필요 시 reanimated로 미세 이동 추가.
- 아키타입 카드 선정은 키워드 길이 가중치 방식(휴리스틱)으로, 완벽한 정확도는 형태소 분석기 없이는 한계 있음.
