"""Play 스토어용 폰 스크린샷 6장을 만든다.

원본 캡처(raw/)를 배경 그라디언트 위에 얹고, 위쪽에 홍보 문구를 넣는다.
캡처 자체는 건드리지 않으므로 재캡처 없이 문구만 바꿔 다시 돌릴 수 있다.

    python scripts/gen-store-screenshots.py

입력  : docs/release/store-assets/raw/<name>.png   (1080x2400 실기 캡처)
출력  : docs/release/store-assets/screenshot-N-*.png (1080x2400)
"""

from __future__ import annotations

import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "docs" / "release" / "store-assets"
RAW = ASSETS / "raw"
FONTS = ROOT / "frontend" / "assets" / "fonts"

W, H = 1080, 2400

# 앱 배경과 같은 계열. 위 보라 → 아래 청록.
GRAD_TOP = (42, 17, 64)
GRAD_MID = (74, 30, 92)
GRAD_BOT = (18, 58, 70)

GOLD = (232, 200, 122)
HEADLINE = (255, 255, 255)
SUBLINE = (196, 176, 222)

# 캡처에서 잘라낼 영역. 상단 상태바(시계·배터리)와 하단 제스처바를 없애
# 6장의 상태바가 제각각인 문제를 아예 제거한다.
CROP_TOP = 60
CROP_BOTTOM = 44

DEVICE_W = 840
DEVICE_X = (W - DEVICE_W) // 2
DEVICE_Y = 550
CORNER = 46

SHOTS = [
    {
        "out": "screenshot-2-home.png",
        "raw": "2-home.png",
        "headline": ["긴 꿈도 통째로,", "장면마다 풀어드려요"],
        "sub": "한 줄이든 열 줄이든 · 텍스트로도 음성으로도",
    },
    {
        "out": "screenshot-3-diary-cards.png",
        "raw": "3-diary-cards.png",
        "headline": ["꿈은 한 장의", "카드로 쌓입니다"],
        "sub": "넘겨보며 지난 꿈을 다시 만나요",
    },
    {
        "out": "screenshot-4-stats.png",
        "raw": "4-stats.png",
        "headline": ["내 꿈의 흐름을", "한눈에"],
        "sub": "자주 등장한 상징과 그 뜻, 그리고 기록 추이",
    },
    {
        "out": "screenshot-5-card.png",
        "raw": "5-card.png",
        "headline": ["오늘의 꿈에", "드리운 상징 한 장"],
        "sub": "아르누보 감성의 꿈 카드",
    },
    {
        "out": "screenshot-6-interpretation.png",
        "raw": "6-interpretation.png",
        "headline": ["종합 해몽부터", "오늘의 한마디까지"],
        "sub": "관계 · 재물 · 직장까지 나눠서 읽어드려요",
    },
]

# 스플래시는 스토어에서 뺐다. 로고 하나뿐이라 프레임 안이 비어 보이고,
# Play는 폰 스크린샷 2장이면 충분하다. 원본 raw/1-splash.png는 남겨 뒀으니
# 되살리려면 아래 항목을 SHOTS로 옮기고 스크립트를 다시 돌리면 된다.
RETIRED = [
    {
        "out": "screenshot-1-splash.png",
        "raw": "1-splash.png",
        "headline": ["밤마다 찾아오는 꿈,", "오래된 시선으로"],
        "sub": "전통 해몽을 바탕으로 풀어드립니다",
    },
]


def load_font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / name), size)


def background() -> Image.Image:
    """세로 그라디언트 + 은은한 보라 광원 + 별."""
    bg = Image.new("RGB", (W, H))
    px = bg.load()
    for y in range(H):
        t = y / (H - 1)
        if t < 0.42:
            k = t / 0.42
            a, b = GRAD_TOP, GRAD_MID
        else:
            k = (t - 0.42) / 0.58
            a, b = GRAD_MID, GRAD_BOT
        col = tuple(round(a[i] + (b[i] - a[i]) * k) for i in range(3))
        for x in range(W):
            px[x, y] = col

    glow = Image.new("RGB", (W, H), (0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([-260, -420, W + 260, 720], fill=(96, 44, 132))
    bg = Image.blend(bg, Image.blend(bg, glow, 0.0), 0.0)
    bg = Image.composite(
        Image.blend(bg, glow, 0.28), bg, glow.convert("L").filter(ImageFilter.GaussianBlur(180))
    )

    stars = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(stars)
    rng = random.Random(20260727)
    for _ in range(130):
        x = rng.randrange(0, W)
        y = rng.randrange(0, int(H * 0.62))
        r = rng.choice([1, 1, 1, 2, 2, 3])
        a = rng.randint(40, 150)
        sd.ellipse([x - r, y - r, x + r, y + r], fill=(255, 245, 220, a))
    bg = Image.alpha_composite(bg.convert("RGBA"), stars).convert("RGB")
    return bg


def rounded_mask(size: tuple[int, int], radius: int, ss: int = 4) -> Image.Image:
    w, h = size
    m = Image.new("L", (w * ss, h * ss), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, w * ss - 1, h * ss - 1], radius * ss, fill=255)
    return m.resize((w, h), Image.LANCZOS)


def device_plate(raw_path: Path) -> tuple[Image.Image, Image.Image]:
    """캡처를 잘라 기기 크기로 줄이고, (이미지, 마스크)를 돌려준다."""
    src = Image.open(raw_path).convert("RGB")
    if src.size != (W, H):
        src = src.resize((W, H), Image.LANCZOS)
    src = src.crop((0, CROP_TOP, W, H - CROP_BOTTOM))

    scale = DEVICE_W / src.width
    dev = src.resize((DEVICE_W, round(src.height * scale)), Image.LANCZOS)

    # 기기 판이 캔버스 안에 온전히 들어오게 한다. 아래로 흘려보내면
    # 하단 탭바 아이콘 한가운데가 잘려 어색해진다.
    max_h = H - DEVICE_Y - 60
    if dev.height > max_h:
        dev = dev.crop((0, 0, DEVICE_W, max_h))
    return dev, rounded_mask(dev.size, CORNER)


def draw_text(canvas: Image.Image, spec: dict) -> None:
    d = ImageDraw.Draw(canvas)
    head = load_font("NanumMyeongjo-ExtraBold.ttf", 78)
    sub = load_font("Pretendard-Medium.ttf", 36)

    y = 128
    for line in spec["headline"]:
        w = d.textlength(line, font=head)
        d.text(((W - w) / 2 + 2, y + 3), line, font=head, fill=(20, 8, 32))
        d.text(((W - w) / 2, y), line, font=head, fill=HEADLINE)
        y += 104

    y += 18
    w = d.textlength(spec["sub"], font=sub)
    d.text(((W - w) / 2, y), spec["sub"], font=sub, fill=SUBLINE)

    # 문구와 기기 사이를 끊어 주는 금색 구분선
    y += 74
    d.line([(W / 2 - 90, y), (W / 2 + 90, y)], fill=GOLD, width=2)
    d.ellipse([W / 2 - 7, y - 7, W / 2 + 7, y + 7], fill=GOLD)


def compose(spec: dict) -> Path:
    canvas = background()
    dev, mask = device_plate(RAW / spec["raw"])

    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle(
        [DEVICE_X - 6, DEVICE_Y + 16, DEVICE_X + DEVICE_W + 6, DEVICE_Y + dev.height + 16],
        CORNER,
        fill=(0, 0, 0, 165),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(30))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), shadow).convert("RGB")

    canvas.paste(dev, (DEVICE_X, DEVICE_Y), mask)

    # 금색 헤어라인 테두리(안티에일리어싱 위해 4배로 그려 축소)
    ss = 4
    line = Image.new("RGBA", (DEVICE_W * ss, dev.height * ss), (0, 0, 0, 0))
    ImageDraw.Draw(line).rounded_rectangle(
        [ss, ss, DEVICE_W * ss - ss, dev.height * ss - ss],
        CORNER * ss,
        outline=GOLD + (140,),
        width=3 * ss,
    )
    line = line.resize((DEVICE_W, dev.height), Image.LANCZOS)
    canvas.paste(line, (DEVICE_X, DEVICE_Y), line)

    draw_text(canvas, spec)

    out = ASSETS / spec["out"]
    canvas.save(out, "PNG", optimize=True)
    return out


def main() -> None:
    for spec in SHOTS:
        raw = RAW / spec["raw"]
        if not raw.exists():
            raise SystemExit(f"원본 캡처가 없습니다: {raw}")
        print("wrote", compose(spec).name)


if __name__ == "__main__":
    main()
