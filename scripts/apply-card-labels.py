#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
apply-card-labels.py — img/NN_Name.png 원본 카드(영문 Symbol/의미·상단 id 포함)에
한글 이름 + 한글 의미 텍스트 플레이트를 상단 id 아래에 합성해
frontend/assets/images/cards/NN.png 로 저장한다.

- 원본은 img/ 폴더(교체 소스). 결과는 frontend 카드 자산으로 드롭인.
- 플레이트는 상단 id 메달리온을 가리지 않도록 y=PLATE_TOP 아래에 위치.
- 사용법:
    python scripts/apply-card-labels.py            # 전체 30장
    python scripts/apply-card-labels.py 1 13       # 특정 id만
    OUT=scratch python scripts/apply-card-labels.py 1 13   # OUT_DIR override(샘플 검토)
"""
import os
import sys
import math
from PIL import Image, ImageDraw, ImageFont

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC_DIR = os.path.join(ROOT, "img")
OUT_DIR = os.path.join(ROOT, "frontend", "assets", "images", "cards")

FONTS = r"C:\Windows\Fonts"
FONT_NAME = os.path.join(FONTS, "HANBatangB.ttf")  # 볼드 세리프(바탕) — 영문 세리프와 호응
FONT_MEAN = os.path.join(FONTS, "HANBatang.ttf")   # 세리프(바탕)

# 디자인 — 투명 배경 + 가로줄 프레임(미니멀·세련). 채움 없이 위/아래 골드 헤어라인으로
# 텍스트를 감싸고, 일러스트 위 가독성을 위해 글자에 얇은 외곽선(stroke)을 준다.
PLATE_TOP = 244          # 텍스트 블록 상단 y (id 메달리온 아래)
NAME_SIZE = 58
MEAN_SIZE = 29
LINE_EXT = 46            # 텍스트 폭 밖으로 가로줄이 더 뻗는 길이
G_LINE = 20             # 가로줄 ↔ 텍스트 세로 간격
GAP = 8                 # 이름 ↔ 의미 간격
SS = 4                  # 슈퍼샘플 배율(라인/글자 안티에일리어싱)
GOLD_LINE = (210, 182, 120, 236)   # 골드 헤어라인
GOLD_DIA = (228, 202, 140, 255)    # 골드 다이아 finial
NAME_FILL = (247, 240, 224, 255)   # 아이보리(이름)
MEAN_FILL = (234, 224, 202, 255)   # 옅은 아이보리(의미)
TXT_STROKE = (36, 26, 15, 205)     # 글자 외곽선(가독성)
LINE_SHADOW = (16, 11, 6, 130)     # 라인 그림자

# id -> (한글 이름, 한글 의미)  (docs/design/archetype-cards.md 표 기준)
LABELS = {
    1: ("새벽", "새로운 시작·기회·출발"),
    2: ("고치", "변화·전환·성장통"),
    3: ("큰 나무", "성장·성숙·발전"),
    4: ("갈림길", "선택·결정·방향"),
    5: ("정상", "도전·시련·인내"),
    6: ("나침반", "목표·여정·방향성"),
    7: ("왕관", "성취·성공·인정"),
    8: ("황금", "풍요·번영·재물운"),
    9: ("다리", "인연·연결·소통"),
    10: ("장미", "사랑·애정·정"),
    11: ("닻", "신뢰·안정·믿음"),
    12: ("폭풍", "갈등·긴장·대립"),
    13: ("빈 의자", "상실·부재·그리움"),
    14: ("샘", "치유·회복·재생"),
    15: ("방패", "보호·안전·수호"),
    16: ("날개", "자유·독립·해방"),
    17: ("사슬", "속박·제약·굴레"),
    18: ("심연", "두려움·불안·혼란"),
    19: ("그림자", "무의식·숨은 자아·내면"),
    20: ("봉인", "비밀·감춰진 진실"),
    21: ("달", "직관·본능·내면의 안내"),
    22: ("거울", "기억·회상·과거"),
    23: ("실", "인연의 실·운명"),
    24: ("저울", "균형·조화·공정"),
    25: ("미궁", "혼돈·미로·불확실"),
    26: ("탑", "질서·체계·안정"),
    27: ("별", "희망·낙관·가능성"),
    28: ("횃불", "각성·깨달음·통찰"),
    29: ("수레바퀴", "순환·반복·흐름"),
    30: ("관문", "초월·새로운 차원"),
}

# id -> 원본 파일명(img/ 폴더). 파일명이 "NN_Name.png" 형태라 스캔해서 매핑.
def build_src_map():
    m = {}
    for fn in os.listdir(SRC_DIR):
        if not fn.lower().endswith(".png"):
            continue
        head = fn.split("_", 1)[0]
        try:
            cid = int(head)
        except ValueError:
            continue
        m[cid] = os.path.join(SRC_DIR, fn)
    return m


def text_size(draw, text, font):
    b = draw.textbbox((0, 0), text, font=font)
    return b[2] - b[0], b[3] - b[1], b[1]  # w, h, top_offset


def _bezier(p0, p1, p2, p3, n):
    pts = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        x = u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0]
        y = u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]
        pts.append((x, y))
    return pts


def _cartouche_norm(n=24):
    """하단 네임플레이트풍 카투슈 외곽선(정규화 0~1, y-down, 좌우 대칭).
    상단 중앙 첨두 → 어깨 오목 → 뾰족한 우측 끝 → 하단 완만한 보우."""
    A = (0.50, 0.06)    # 상단 중앙 첨두
    Sh = (0.70, 0.30)   # 상단 어깨(오목 저점)
    Tip = (1.00, 0.44)  # 우측 뾰족한 끝
    Bsh = (0.72, 0.80)  # 하단 어깨
    B = (0.50, 0.95)    # 하단 중앙
    seg1 = _bezier(A, (0.57, 0.035), (0.64, 0.24), Sh, n)    # 첨두→어깨(오목)
    seg2 = _bezier(Sh, (0.82, 0.36), (0.90, 0.40), Tip, n)   # 어깨→우측 끝(수평 도착)
    seg3 = _bezier(Tip, (0.90, 0.49), (0.86, 0.72), Bsh, n)  # 우측 끝→하단 어깨(뾰족)
    seg4 = _bezier(Bsh, (0.64, 0.90), (0.57, 0.95), B, n)    # 하단 어깨→하단 중앙
    right = seg1 + seg2[1:] + seg3[1:] + seg4[1:]
    left = [(1.0 - x, y) for (x, y) in reversed(right[:-1])]
    return right + left


def _star(cx, cy, ro, ri, points, rot=0.0):
    out = []
    for i in range(points * 2):
        ang = rot + math.pi * i / points
        r = ro if i % 2 == 0 else ri
        out.append((cx + r * math.sin(ang), cy - r * math.cos(ang)))
    return out


def _diamond(d, cx, cy, r, fill):
    """세로 r, 가로 0.72r 의 작은 골드 마름모(라인 finial)."""
    d.polygon([(cx, cy - r), (cx + r * 0.72, cy), (cx, cy + r), (cx - r * 0.72, cy)], fill=fill)


def render(cid, src_path, out_path):
    name, mean = LABELS[cid]
    base = Image.open(src_path).convert("RGBA")
    W, H = base.size
    S = SS

    meas = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    nw, nh, _ = text_size(meas, name, ImageFont.truetype(FONT_NAME, NAME_SIZE))
    mw, mh, _ = text_size(meas, mean, ImageFont.truetype(FONT_MEAN, MEAN_SIZE))

    content_w = max(nw, mw)
    line_w = content_w + 2 * LINE_EXT

    # 세로 레이아웃(비슈퍼샘플 기준)
    top_line = 8
    name_top = top_line + G_LINE
    mean_top = name_top + nh + GAP
    bot_line = mean_top + mh + G_LINE
    canvas_w = line_w + 44          # 다이아 finial/여백
    canvas_h = bot_line + 16

    cw, ch = canvas_w * S, canvas_h * S
    ov = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    lcx = cw / 2.0
    lw = max(1, int(1.5 * S))

    def hline(y):
        x1 = lcx - (line_w * S) / 2.0
        x2 = lcx + (line_w * S) / 2.0
        yy = y * S
        d.line([(x1, yy + 1.4 * S), (x2, yy + 1.4 * S)], fill=LINE_SHADOW, width=lw)  # 그림자
        d.line([(x1, yy), (x2, yy)], fill=GOLD_LINE, width=lw)
        _diamond(d, lcx, yy, 5.5 * S, GOLD_DIA)      # 중앙 마름모
        _diamond(d, x1, yy, 3.4 * S, GOLD_DIA)       # 양끝 마름모
        _diamond(d, x2, yy, 3.4 * S, GOLD_DIA)

    hline(top_line)
    hline(bot_line)

    f_name = ImageFont.truetype(FONT_NAME, NAME_SIZE * S)
    f_mean = ImageFont.truetype(FONT_MEAN, MEAN_SIZE * S)
    _, _, nts = text_size(d, name, f_name)
    d.text((lcx, name_top * S - nts), name, font=f_name, fill=NAME_FILL,
           stroke_width=max(1, int(1.5 * S)), stroke_fill=TXT_STROKE, anchor="ma")
    _, _, mts = text_size(d, mean, f_mean)
    d.text((lcx, mean_top * S - mts), mean, font=f_mean, fill=MEAN_FILL,
           stroke_width=max(1, int(1.1 * S)), stroke_fill=TXT_STROKE, anchor="ma")

    small = ov.resize((canvas_w, canvas_h), Image.LANCZOS)
    x0 = (W - canvas_w) // 2
    base.alpha_composite(small, (x0, PLATE_TOP))
    base.convert("RGB").save(out_path)
    return canvas_w, canvas_h


def main():
    src_map = build_src_map()
    out_dir = OUT_DIR
    if os.environ.get("OUT") == "scratch":
        out_dir = os.environ["SCRATCH"]
    os.makedirs(out_dir, exist_ok=True)

    wanted = set(int(a) for a in sys.argv[1:]) if len(sys.argv) > 1 else None
    ok = 0
    for cid in sorted(LABELS):
        if wanted and cid not in wanted:
            continue
        if cid not in src_map:
            print(f"  [MISS] {cid:02d} 원본 없음")
            continue
        out_path = os.path.join(out_dir, f"{cid:02d}.png")
        pw, ph = render(cid, src_map[cid], out_path)
        name, mean = LABELS[cid]
        print(f"  [ok] {cid:02d} {name:<6} plate {pw}x{ph} -> {out_path}")
        ok += 1
    print(f"done. ok={ok}")


if __name__ == "__main__":
    main()
