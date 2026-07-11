# Play Store 그래픽 에셋

`scripts/gen-store-graphics.ps1`(아이콘·피처그래픽) + 에뮬레이터 실기 캡처(스크린샷)로 생성.
Play Console > 스토어 등록정보에 업로드하세요. 문구는 `../store-listing.md` 참고.

## 파일

| 파일 | 용도 | 규격 |
|------|------|------|
| `icon-512.png` | 앱 아이콘 | 512×512 |
| `feature-graphic-1024x500.png` | 피처 그래픽(필수) | 1024×500 |
| `screenshot-2-home.png` | 폰 스크린샷 — 홈(꿈 입력) | 1080×2400 |
| `screenshot-5-card.png` | 폰 스크린샷 — 아르누보 꿈 카드(전체) | 1080×2400 |
| `screenshot-6-interpretation.png` | 폰 스크린샷 — 해몽 상세 | 1080×2400 |
| `screenshot-3-diary-cards.png` | 폰 스크린샷 — 꿈기록(팬 캐러셀) | 1080×2400 |
| `screenshot-4-stats.png` | 폰 스크린샷 — 통계 | 1080×2400 |
| `screenshot-1-splash.png` | 폰 스크린샷 — 스플래시 | 1080×2400 |

- Play는 폰 스크린샷 **최소 2장**(2~8장 권장). 위 순서대로 2·5·6·3·4를 권장(홈→카드→해몽→기록→통계).
- 스크린샷은 개발 빌드의 테스트 데이터("I saw a ship" 등)로 캡처됨 — 원하면 실제 한글 꿈으로 재캡처 가능.

## 재생성 방법

- 아이콘·피처그래픽: PowerShell에서 `& "scripts\gen-store-graphics.ps1"` (색/문구는 스크립트 상수 수정).
- 스크린샷: 에뮬레이터에서 원하는 화면 띄우고
  `adb exec-out screencap -p > shot.png`
