# scripts/sync-card-art.py
# ------------------------------------------------------------
# 아키타입 카드 원본(img/NN_Name.png) → 앱 에셋(frontend/assets/images/cards/NN.webp) 동기화.
#
# 원본에는 상단 id 메달리온과 하단 영문 이름판(자체 카투슈)이 이미 그려져 있고
# 둘 다 일러스트와 겹치지 않는다. 한글 이름/뜻은 이미지에 굽지 않는다 —
# 예전에는 apply-card-labels.py가 한글을 그림 한복판(y=244)에 합성했는데,
# 글자와 그림이 서로 간섭해 둘 다 읽기 나빠졌다. 지금은 앱이 카드 이미지 바깥
# 위쪽에 CardLabel 컴포넌트로 렌더한다(frontend/src/components/DreamCard/CardLabel.tsx).
# 한글 이름/뜻의 단일 소스는 frontend/src/data/archetypeCards.ts의 nameKo/meaning.
#
# 출력은 PNG가 아니라 WebP(q85)다.
#   무손실 PNG 30장이 94MB였고 그대로 AAB 130MB의 대부분을 차지했다.
#   카드는 2:3 비율로 화면 폭(약 360dp)에 꽉 차게 그려지므로 3x 기기에서 약 1080px가
#   필요하다 — 원본 1024px이 이미 표시 해상도라 리사이즈하면 흐려진다.
#   줄여야 할 것은 해상도가 아니라 포맷이었다: 같은 1024x1536에서 WebP q85로
#   장당 3.7MB -> 약 0.5MB(7배), 합계 94MB -> 약 16MB.
#   무손실 마스터는 img/에 PNG로 그대로 남는다. 화질을 바꾸려면 QUALITY만 고치면 된다.
#
# 실행: python scripts/sync-card-art.py
# ------------------------------------------------------------

import os
import re
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, "img")
OUT_DIR = os.path.join(ROOT, "frontend", "assets", "images", "cards")

# "01_Dawn.png", "03_Great Tree.png" 처럼 id를 앞에 두고 이름이 뒤따른다.
NAME_RE = re.compile(r"^(\d{2})_.+\.png$", re.IGNORECASE)

EXPECTED = 30

# q85는 아르누보 카드의 넓은 그라데이션에서 밴딩이 보이지 않는 선으로 골랐다.
# method=6은 가장 느리지만 가장 작게 나오는 인코딩 탐색이다(1회성 스크립트라 무방).
QUALITY = 85
METHOD = 6


def main() -> int:
    if not os.path.isdir(SRC_DIR):
        print(f"원본 폴더가 없습니다: {SRC_DIR}")
        return 1

    os.makedirs(OUT_DIR, exist_ok=True)

    found = {}
    for fname in sorted(os.listdir(SRC_DIR)):
        m = NAME_RE.match(fname)
        if not m:
            continue
        cid = m.group(1)
        if cid in found:
            print(f"id {cid}가 중복입니다: {found[cid]} / {fname}")
            return 1
        found[cid] = fname

    if len(found) != EXPECTED:
        print(f"카드가 {len(found)}장입니다(기대 {EXPECTED}장). 원본을 확인하세요.")
        return 1

    src_total = 0
    out_total = 0
    for cid, fname in sorted(found.items()):
        src = os.path.join(SRC_DIR, fname)
        dst = os.path.join(OUT_DIR, f"{cid}.webp")
        # 카드에 투명 영역은 없다. RGB로 고정해 알파 채널이 붙는 것을 막는다.
        with Image.open(src) as im:
            im.convert("RGB").save(dst, "WEBP", quality=QUALITY, method=METHOD)
        src_size = os.path.getsize(src)
        out_size = os.path.getsize(dst)
        src_total += src_size
        out_total += out_size
        print(
            f"{fname} -> {os.path.basename(dst)} "
            f"({src_size / 1024:.0f}KB -> {out_size / 1024:.0f}KB)"
        )

    # 확장자를 PNG에서 WebP로 바꿨으므로 예전 산출물이 남아 있으면 지운다.
    # 남겨두면 Metro가 어느 쪽을 집는지 헷갈리고 번들에 94MB가 그대로 들어간다.
    stale = [f for f in os.listdir(OUT_DIR) if f.lower().endswith(".png")]
    for f in sorted(stale):
        os.remove(os.path.join(OUT_DIR, f))
        print(f"구 PNG 삭제: {f}")

    print(
        f"\n{len(found)}장 동기화 완료 -> {OUT_DIR}\n"
        f"합계 {src_total / 1e6:.1f}MB -> {out_total / 1e6:.1f}MB "
        f"({src_total / out_total:.1f}배 감소, WebP q{QUALITY})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
