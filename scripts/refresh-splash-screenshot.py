# scripts/refresh-splash-screenshot.py
# ---------------------------------------------------------------
# docs/release/store-assets/screenshot-1-splash.png 의 마스코트를
# 옛 라인아트 원숭이 → 현재 앱이 실제로 렌더하는 원숭이 점술가 일러스트로 교체한다.
#
# 왜 합성인가: 스크린샷은 2026-07-11 캡처분이고, 원숭이 아이콘 교체는 07-12였다.
# 에뮬레이터 재캡처가 정석이지만(빌드+Metro+설치 필요), 스플래시 화면은 정적이라
# 앱의 실제 렌더 규칙을 그대로 재현하면 재캡처와 동일한 결과가 나온다.
#
# 재현하는 규칙 (frontend/src/screens/SplashScreen.tsx + components/Mascot.tsx):
#   - halo: 148dp 원. 이 스크린샷에서 지름 388px으로 실측 → density 388/148 = 2.6216
#   - Mascot: size=92dp, borderRadius = size*0.22, resizeMode="cover"
#   - holo=true: shadowColor #8B5CF6, opacity 0.7, radius = size*0.16
#   - wrap 테두리: hairline, rgba(201,162,255,0.35)
#
# 사용: python scripts/refresh-splash-screenshot.py
# ---------------------------------------------------------------
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SHOT = ROOT / "docs" / "release" / "store-assets" / "screenshot-1-splash.png"
MASCOT = ROOT / "frontend" / "assets" / "images" / "mascot.png"

# 스크린샷에서 실측한 halo 원 (밝기 경계 스캔으로 구함)
HALO_CX, HALO_CY = 543, 1076
HALO_DIAMETER_PX = 388
HALO_DP = 148.0
DENSITY = HALO_DIAMETER_PX / HALO_DP  # ≈ 2.6216

MASCOT_DP = 92.0
RADIUS_RATIO = 0.22
GLOW_RATIO = 0.16
GLOW_COLOR = (139, 92, 246)  # Colors.holoViolet #8B5CF6
GLOW_ALPHA = int(0.7 * 255)
BORDER_COLOR = (201, 162, 255, int(0.35 * 255))

# 4x 슈퍼샘플 후 축소 — 라운드 모서리 계단 현상 방지(apply-card-labels.py와 같은 방식)
SS = 4


def rounded_mask(size: int, radius: int) -> Image.Image:
    m = Image.new("L", (size * SS, size * SS), 0)
    ImageDraw.Draw(m).rounded_rectangle(
        [0, 0, size * SS - 1, size * SS - 1], radius=radius * SS, fill=255
    )
    return m.resize((size, size), Image.LANCZOS)


def main() -> None:
    shot = Image.open(SHOT).convert("RGBA")
    mascot = Image.open(MASCOT).convert("RGBA")

    size = int(round(MASCOT_DP * DENSITY))          # 92dp  → 241px
    radius = int(round(MASCOT_DP * RADIUS_RATIO * DENSITY))  # 20.24dp → 53px
    glow_radius = MASCOT_DP * GLOW_RATIO * DENSITY  # 14.7dp → 38.6px

    left, top = HALO_CX - size // 2, HALO_CY - size // 2
    mask = rounded_mask(size, radius)

    # 1) 보라 발광(그림자)을 마스코트 뒤에 깔기
    glow = Image.new("RGBA", shot.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.rounded_rectangle(
        [left, top, left + size, top + size],
        radius=radius,
        fill=GLOW_COLOR + (GLOW_ALPHA,),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(glow_radius / 2.0))
    shot = Image.alpha_composite(shot, glow)

    # 2) 마스코트 본체 (cover: 원본이 정사각이라 그대로 축소)
    art = mascot.resize((size, size), Image.LANCZOS)
    shot.paste(art, (left, top), mask)

    # 3) hairline 테두리
    od = ImageDraw.Draw(shot, "RGBA")
    od.rounded_rectangle(
        [left, top, left + size - 1, top + size - 1],
        radius=radius,
        outline=BORDER_COLOR,
        width=2,
    )

    shot.convert("RGB").save(SHOT)
    print(f"updated {SHOT.name}: mascot {size}px r{radius} at ({HALO_CX},{HALO_CY})")


if __name__ == "__main__":
    main()
