# scripts/sync-card-art.py
# ------------------------------------------------------------
# 아키타입 카드 원본(img/NN_Name.png) → 앱 에셋(frontend/assets/images/cards/NN.png) 동기화.
#
# 원본에는 상단 id 메달리온과 하단 영문 이름판(자체 카투슈)이 이미 그려져 있고
# 둘 다 일러스트와 겹치지 않는다. 한글 이름/뜻은 이미지에 굽지 않는다 —
# 예전에는 apply-card-labels.py가 한글을 그림 한복판(y=244)에 합성했는데,
# 글자와 그림이 서로 간섭해 둘 다 읽기 나빠졌다. 지금은 앱이 카드 이미지 바깥
# 위쪽에 CardLabel 컴포넌트로 렌더한다(frontend/src/components/DreamCard/CardLabel.tsx).
# 한글 이름/뜻의 단일 소스는 frontend/src/data/archetypeCards.ts의 nameKo/meaning.
#
# 실행: python scripts/sync-card-art.py
# ------------------------------------------------------------

import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, "img")
OUT_DIR = os.path.join(ROOT, "frontend", "assets", "images", "cards")

# "01_Dawn.png", "03_Great Tree.png" 처럼 id를 앞에 두고 이름이 뒤따른다.
NAME_RE = re.compile(r"^(\d{2})_.+\.png$", re.IGNORECASE)

EXPECTED = 30


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

    for cid, fname in sorted(found.items()):
        src = os.path.join(SRC_DIR, fname)
        dst = os.path.join(OUT_DIR, f"{cid}.png")
        shutil.copyfile(src, dst)
        print(f"{fname} -> {os.path.basename(dst)}")

    print(f"\n{len(found)}장 동기화 완료 -> {OUT_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
