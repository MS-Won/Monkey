# Play Store 그래픽 에셋

Play Console > 스토어 등록정보에 업로드하세요. 문구는 `../store-listing.md` 참고.

## ⚠️ 원숭이 그래픽은 한 종류만 — `icon.png` 일러스트
`icon.png`(원숭이 점술가)가 **모든 원숭이 그래픽의 단일 원본**입니다.
2026-07-26 이전에는 `gen-store-graphics.ps1`이 옛 라인아트 원숭이를 코드로 그려서,
피처 그래픽·스플래시 스크린샷에만 옛 원숭이가 남아 **두 종류가 섞여 있었습니다.** 지금은 통일됨
(스크린샷은 전부 새 원숭이를 렌더하는 앱에서 다시 캡처했고, 스플래시 스크린샷 자체는 뺐습니다).

| 산출물 | 만드는 스크립트 |
|---|---|
| `icon-512.png`, 인앱 `mascot.png`, 런처 mipmap, `splash_logo.png` | `scripts/apply-monkey-icon.ps1` |
| `feature-graphic-1024x500.png` | `scripts/gen-store-graphics.ps1` |
| `screenshot-*.png` 6장 (`raw/` 캡처 + 홍보문구 합성) | `scripts/gen-store-screenshots.py` |

`gen-store-graphics.ps1`은 더 이상 `icon-512.png`를 만들지 않습니다(덮어쓰기 사고 방지).

## 파일

| 파일 | 용도 | 규격 |
|------|------|------|
| `icon-512.png` | 앱 아이콘 | 512×512 |
| `feature-graphic-1024x500.png` | 피처 그래픽(필수) | 1024×500 |
| `screenshot-2-home.png` | 폰 스크린샷 — 홈(꿈 입력) | 1080×2400 |
| `screenshot-5-card.png` | 폰 스크린샷 — 해몽 결과의 꿈 카드(뒤집기 전) | 1080×2400 |
| `screenshot-6-interpretation.png` | 폰 스크린샷 — 해몽 상세(카드를 뒤집은 뒤) | 1080×2400 |
| `screenshot-3-diary-cards.png` | 폰 스크린샷 — 꿈기록(팬 캐러셀) | 1080×2400 |
| `screenshot-4-stats.png` | 폰 스크린샷 — 통계 | 1080×2400 |

- Play는 폰 스크린샷 **최소 2장**(2~8장 권장). 표의 순서 그대로 2·5·6·3·4로 올린다(홈→카드→해몽→기록→통계).
- **스플래시(`screenshot-1-splash.png`)는 뺐다.** 로고 하나뿐이라 프레임 안이 비어 보였다.
  원본 `raw/1-splash.png`와 문구는 `gen-store-screenshots.py`의 `RETIRED`에 남아 있으니,
  되살리려면 그 항목을 `SHOTS`로 옮기고 스크립트를 다시 돌리면 된다.

## 스크린샷은 2단 구조 — `raw/` 캡처 + 합성

`screenshot-*.png`는 손으로 만든 이미지가 아니라 **`raw/`의 실기 캡처를 합성한 결과물**입니다.

| 단계 | 내용 |
|---|---|
| `raw/N-*.png` | 에뮬레이터 실기 캡처 원본 1080×2400 (손대지 않음) |
| `screenshot-N-*.png` | 위를 배경 그라디언트에 얹고 상단에 홍보 문구를 넣은 최종본 |

합성 단계에서 캡처의 **상태바(시계·배터리)와 하단 제스처바를 잘라냅니다.**
6장의 캡처 시각이 제각각이어도 최종본에는 드러나지 않습니다.

- 2026-07-27 기준 `raw/`는 전부 **한글 꿈 한 건**("돌아가신 할머니가 …금반지…구렁이")으로
  통일해 재캡처했습니다. 해몽·꿈기록·통계가 서로 같은 데이터를 가리킵니다.
  `1-splash.png`만 기존 캡처를 그대로 씁니다(브랜드 화면이라 내용이 바뀌지 않음).

## 재생성 방법

- 아이콘 계열(런처/인앱/스플래시/512): `& "scripts\apply-monkey-icon.ps1"`
- 피처 그래픽: `& "scripts\gen-store-graphics.ps1"` (색/문구는 스크립트 상수 수정)
- **문구만 바꾸기**: `scripts/gen-store-screenshots.py`의 `SHOTS` 수정 후
  `python scripts/gen-store-screenshots.py` — 재캡처 불필요
- **화면을 새로 찍기**: 에뮬레이터에서 원하는 화면을 띄우고
  `adb exec-out screencap -p > docs/release/store-assets/raw/2-home.png`
  로 덮어쓴 뒤 위 스크립트를 다시 실행
  - 한글은 `adb shell input text`로 입력되지 않습니다. 호스트에서
    `Set-Clipboard "…"` 한 뒤 입력창을 탭하고 `adb shell input keyevent 279`(붙여넣기),
    `adb shell input keyevent 111`(ESC, 키보드 닫기) 순으로 넣으세요.
    뒤로가기(keyevent 4)를 두 번 누르면 앱이 종료되니 주의.
