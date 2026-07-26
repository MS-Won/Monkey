# Play Store 그래픽 에셋

Play Console > 스토어 등록정보에 업로드하세요. 문구는 `../store-listing.md` 참고.

## ⚠️ 원숭이 그래픽은 한 종류만 — `icon.png` 일러스트
`icon.png`(원숭이 점술가)가 **모든 원숭이 그래픽의 단일 원본**입니다.
2026-07-26 이전에는 `gen-store-graphics.ps1`이 옛 라인아트 원숭이를 코드로 그려서,
피처 그래픽·스플래시 스크린샷에만 옛 원숭이가 남아 **두 종류가 섞여 있었습니다.** 지금은 통일됨.

| 산출물 | 만드는 스크립트 |
|---|---|
| `icon-512.png`, 인앱 `mascot.png`, 런처 mipmap, `splash_logo.png` | `scripts/apply-monkey-icon.ps1` |
| `feature-graphic-1024x500.png` | `scripts/gen-store-graphics.ps1` |
| `screenshot-1-splash.png`의 마스코트 | `scripts/refresh-splash-screenshot.py` |

`gen-store-graphics.ps1`은 더 이상 `icon-512.png`를 만들지 않습니다(덮어쓰기 사고 방지).

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

- 아이콘 계열(런처/인앱/스플래시/512): `& "scripts\apply-monkey-icon.ps1"`
- 피처 그래픽: `& "scripts\gen-store-graphics.ps1"` (색/문구는 스크립트 상수 수정)
- 스플래시 스크린샷의 마스코트만 갱신: `python scripts/refresh-splash-screenshot.py`
- 스크린샷 전체 재캡처: 에뮬레이터에서 원하는 화면 띄우고
  `adb exec-out screencap -p > shot.png`
  (재캡처하면 `refresh-splash-screenshot.py`를 다시 돌릴 필요 없음 — 앱이 이미 새 원숭이를 렌더함)
