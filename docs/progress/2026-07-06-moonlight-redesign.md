# 2026-07-06 — UI/UX 전면 리디자인 "달빛 서재" 완료

> ⚠️ 이 문서는 아카이브입니다. 이후 "홀로그래픽 타로" 방향으로 톤이 전환되었습니다.
> 최신 방향은 [`docs/progress/`](.)의 최신 문서와 [`docs/design/holographic-redesign.md`](../design/holographic-redesign.md) 참고.

기능(Phase A-D)은 이미 완성돼 있었고, 이 세션은 순수 UI/UX 리디자인.
계획 원본: `C:\Users\User\.claude\plans\tender-roaming-lovelace.md`.
전 과정 Android 에뮬레이터(Medium_Phone AVD) 실기 검증 완료, `npx tsc --noEmit` 0 오류.

## 완료한 작업 (Phase 0~7)
- 디자인 토큰: `src/theme/`에 `spacing.ts`(Spacing/Radius)·`chartTheme.ts`·`index.ts` 배럴 신규. `colors.ts` 확장(backgroundElevated #24385C, accentPrimaryFaint, dangerFaint, overlayScrim, stardust). `typography.ts`를 6종→display/h1/h2/h3/bodyLg/body/label/caption/overline로 확장 + fontFamily 지정.
- 폰트: Pretendard(본문 4종)+NanumMyeongjo(세리프 헤더 3종) 번들링 — `frontend/assets/fonts/` + `android/app/src/main/assets/fonts/`에 복사, 루트 `react-native.config.js` 신규. 폰트 변경은 반드시 `gradlew installDebug` 풀 리빌드 필요(Metro 리로드로는 반영 안 됨).
- 공용 컴포넌트: `src/components/`에 Card/Chip/Divider/Button(primary·secondary·danger)/TextField/BottomSheet 추출, 8개 화면 중복 스타일 제거.
- 시그니처1 키워드 카드: `components/DreamCard/DreamCard.tsx`(reanimated 3D 플립, front=키워드+심볼/back=해몽, entrance 애니메이션), `CardCreationLoader.tsx`(마스코트 bob + 카드 실루엣 pulse). ResultScreen·DiaryDetailScreen에서 재사용.
- 시그니처2 마스코트: `components/Mascot.tsx`(react-native-svg 라인아트). Splash·Diary/Stats 빈 상태·CardCreationLoader에 배치.
- 심볼 아이콘: `components/symbols/`(SymbolIcon+registry+icons/*). 16개 직접 제작(1순위 돼지·뱀·물·불·돈·집·가족·아이/아기, 2순위 금·조상·친구·학교·회사·바다·산·강), 나머지는 GenericIcon(물음표) 폴백.
- 팬 캐러셀: `components/FanCarousel.tsx`(gesture-handler Pan + reanimated). DiaryScreen의 FlatList 교체.
- StatsScreen: 차트 `chartTheme.getLineChartConfig()`로 리테마.
- Android 네이티브: 어댑티브 아이콘(monochrome 레이어 필수), 레거시 PNG는 `scripts/gen-launcher-icons.ps1` 생성. `splash_background.xml` 네이비 배경+마스코트 마크.

## 당시 확정 결정 (일부는 홀로그래픽 전환으로 갱신됨)
- 다크 테마 전용 유지 — 라이트/다크 토글 인프라 미구축. (홀로그래픽 전환 후에도 유지)
- 카드 심볼/마스코트는 전부 로컬 SVG — AI 이미지 생성 API를 카드마다 호출하지 않음(비용 최소화). (유지)

## 에뮬레이터 작업 팁 (계속 유효)
adb 명령마다 환경변수가 초기화되므로 매 PowerShell 커맨드 앞에 아래를 포함:
```
$env:ANDROID_HOME="C:\Users\User\AppData\Local\Android\Sdk"; $env:JAVA_HOME="C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot"; $env:Path="$env:ANDROID_HOME\platform-tools;$env:JAVA_HOME\bin;$env:Path"
```
한글 텍스트는 adb로 입력이 안 되므로 e2e 테스트 시 화면 state 초기값을 임시로 채우고 원복. 런처 아이콘 캐시는 앱 서랍(all apps)에서 확인이 더 정확. 폰트 변경은 `gradlew installDebug` 풀 리빌드 필요.
