#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen-card-art.py — Dream Goddess Tarot 30장 카드 일러스트를 1회 생성해
frontend/assets/images/cards/NN.png 로 저장하는 일회성 스크립트.

스펙 단일 소스: docs/design/dream-goddess-bible.md
- 매 앱 실행마다 호출하는 게 아니라, 여기서 30장을 미리 구워 정적 자산으로 고정한다(비용 규칙).

PROVIDER:
  - "pollinations": 무료·무키. https://image.pollinations.ai (FLUX). 기본값.
  - "gemini":       Google Gemini 2.5 Flash Image. 환경변수 GEMINI_API_KEY 필요(무료 티어).
  - "openai":       OpenAI gpt-image-1. 환경변수 OPENAI_API_KEY 필요(유료).

사용법:
  python scripts/gen-card-art.py            # 전체 30장
  python scripts/gen-card-art.py 1 2 10     # 특정 id만(테스트/재생성)
  PROVIDER=gemini python scripts/gen-card-art.py
"""
import os
import sys
import time
import urllib.parse
import urllib.request

# Windows 콘솔(cp949)에서도 안전하게 출력
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT_DIR = os.path.join(ROOT, "frontend", "assets", "images", "cards")

PROVIDER = os.environ.get("PROVIDER", "pollinations").lower()
WIDTH, HEIGHT = 832, 1248  # portrait 2:3
BASE_SEED = 7  # 덱 통일감을 위한 고정 시드 베이스

STYLE_PREAMBLE = (
    "Art Nouveau tarot card illustration in the style of Alphonse Mucha, "
    "a single ethereal dream goddess, flowing organic linework, "
    "ornamental gold filigree border with floral motifs, decorative halo arch behind her head, "
    "iridescent holographic sheen, opal and mother-of-pearl, deep indigo and violet night palette, "
    "soft luminous glow, elegant flowing robes, celestial and dreamlike atmosphere, highly detailed, "
    "symmetrical ornamental composition, portrait orientation, vertical tarot card format, no text, no lettering"
)

NEGATIVE = (
    "text, watermark, signature, letters, words, ugly, deformed hands, extra limbs, "
    "low quality, photorealistic, modern clothing"
)

# polarity별 톤 보강
TONE = {
    "light": "luminous gold and white glow, serene uplifting mood, blossoms and dawn light",
    "neutral": "balanced silver and violet tones, contemplative graceful stillness",
    "shadow": "deep indigo and inky violet, veils and shadow, solemn quiet beauty, not scary",
}

# id -> (name, polarity, per-card scene). 스펙은 dream-goddess-bible.md 기반.
CARDS = [
    (1, "Dawn", "light", "goddess raising both arms to welcome a rising sun disc over the horizon, first dawn rays, dew-covered lilies, waking bird, rose-gold and amber sunrise"),
    (2, "Cocoon", "neutral", "goddess curled and wrapped as if inside a glowing silk cocoon, half-open butterfly wings, coiled vines, silver threads, pearl white and muted violet"),
    (3, "Great Tree", "light", "great-mother goddess merged with a vast deep-rooted tree, arms branching like limbs, hanging fruit, golden sap glow, emerald and deep green"),
    (4, "Crossroads", "neutral", "goddess standing where a path forks into two, a signpost, drifting autumn leaves, twin vines, twilight violet and amber"),
    (5, "Summit", "neutral", "goddess planting one foot on a snow-capped mountain peak, wind whipping her robes, a star banner at the summit, icy blue and white"),
    (6, "Compass", "light", "goddess cradling a glowing golden compass, gazing north, constellation map, north star, teal and gold on night indigo"),
    (7, "Crown", "light", "goddess wearing a radiant golden crown, head slightly lifted, laurel leaves, pillars of light, royal gold and crimson on deep purple"),
    (8, "Gold", "light", "goddess holding overflowing golden coins and treasure, rice ears, golden pig, jewels, rich gold and amber"),
    (9, "Bridge", "light", "goddess at the center of an arched bridge above mist, reaching both hands outward, two clasped hands motif, flowing river, soft teal and lavender"),
    (10, "Rose", "light", "goddess holding a blooming red rose to her chest with eyes gently closed, thorned vines, falling petals, crimson and rose-pink on deep violet"),
    (11, "Anchor", "light", "goddess holding a golden anchor rope standing firm, coiled rope, calm waves, harbor lights, deep teal and navy with gold"),
    (12, "Storm", "shadow", "goddess facing a lightning thundercloud, hair and robes whipped by wind, broken branches, rain, storm grey and electric violet, cyan lightning flash"),
    (13, "Empty Chair", "shadow", "goddess standing beside a single empty chair, hand resting on it, head bowed, guttering candle, left-behind shawl, dusky violet and cold grey"),
    (14, "Spring", "light", "goddess dipping her hands into a clear spring rising from rocks, water ripples, water lily, aqua and mint on indigo, silver water highlights"),
    (15, "Shield", "light", "goddess raising an engraved golden shield to protect, protective runes, encircling ring of light, ancestral crest, gold and deep green"),
    (16, "Wings", "light", "goddess with enormous outstretched wings pushing off the ground, drifting feathers, open sky, sky lavender and white, iridescent feathers"),
    (17, "Chain", "shadow", "goddess pulling a heavy chain taut to break it, loosening knots, a caged bird, cracks, iron grey and deep purple, gold light in the cracks"),
    (18, "Abyss", "shadow", "goddess at the edge of a bottomless black abyss gazing down, whirlpool, sinking light, abyss black and deep indigo, faint cyan glow"),
    (19, "Shadow", "shadow", "goddess facing her own shadow figure, fingertips touching in mirror symmetry, split light and dark, charcoal violet with a single strand of gold"),
    (20, "Seal", "neutral", "goddess resting a hand on a wax-sealed ancient scroll and box, a lock, seal emblem, hidden key, deep burgundy and gold on indigo"),
    (21, "Moon", "neutral", "goddess with her back to a large soft full moon, hands folded at her chest in meditation, star cluster, moth, moonlight silver and deep indigo"),
    (22, "Mirror", "neutral", "goddess in profile gazing into an ornate-framed mirror, a reflected past image, ripples, wilted flower, silver and dusty rose on indigo"),
    (23, "Thread", "neutral", "goddess spinning a red thread of fate between her fingers, a spinning wheel, tangled constellation lines, crimson thread on deep indigo, gold sparkle"),
    (24, "Scales", "neutral", "goddess holding perfectly balanced golden scales, a feather and a stone, blindfold, symmetrical ornament, gold and platinum on deep indigo"),
    (25, "Labyrinth", "shadow", "goddess at the center of a maze seen from above, tangled skein, dead ends, dim lantern, smoky violet and mustard gold"),
    (26, "Tower", "neutral", "goddess before a stone tower built layer by layer, holding a small tower on her palm, brickwork, balanced pillars, stone grey and gold"),
    (27, "Star", "light", "goddess reaching toward one brightly shining star making a wish, cascading starlight, night constellations, celestial blue and gold sparkle on indigo"),
    (28, "Torch", "light", "goddess raising a single torch high to light the way, spreading firelight, an illuminated path, embers, amber and orange flame against deep indigo"),
    (29, "Wheel", "neutral", "goddess at the hub of a great turning wheel with arms spread, a rim of four-season symbols, rotation trails, gold and bronze, iridescent motion blur"),
    (30, "Gate", "light", "goddess stepping through a radiant arched gate leaking light, glow through the opening, a stairway of stars, radiant white-gold and violet on indigo"),
]


def build_prompt(name, polarity, scene):
    return f"{STYLE_PREAMBLE}. {scene}. {TONE[polarity]}. Tarot archetype: {name}."


def fetch_pollinations(prompt, seed, out_path):
    enc = urllib.parse.quote(prompt, safe="")
    url = (
        f"https://image.pollinations.ai/prompt/{enc}"
        f"?width={WIDTH}&height={HEIGHT}&seed={seed}&nologo=true&model=flux&enhance=true"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=180) as resp:
        data = resp.read()
    if not data or len(data) < 2000:
        raise RuntimeError(f"suspiciously small response ({len(data)} bytes)")
    with open(out_path, "wb") as f:
        f.write(data)
    return len(data)


def fetch_gemini(prompt, seed, out_path):
    # Google Gemini 2.5 Flash Image (무료 티어). GEMINI_API_KEY 필요.
    import json
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise RuntimeError("GEMINI_API_KEY not set")
    import base64
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        "gemini-2.5-flash-image:generateContent?key=" + key
    )
    body = json.dumps({
        "contents": [{"parts": [{"text": prompt + " Negative: " + NEGATIVE}]}],
    }).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as resp:
        payload = json.loads(resp.read())
    parts = payload["candidates"][0]["content"]["parts"]
    for p in parts:
        inline = p.get("inlineData") or p.get("inline_data")
        if inline and inline.get("data"):
            with open(out_path, "wb") as f:
                f.write(base64.b64decode(inline["data"]))
            return os.path.getsize(out_path)
    raise RuntimeError("no image in gemini response")


def fetch_openai(prompt, seed, out_path):
    import json, base64
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY not set")
    url = "https://api.openai.com/v1/images/generations"
    body = json.dumps({
        "model": "gpt-image-1",
        "prompt": prompt,
        "size": "1024x1536",
        "n": 1,
    }).encode("utf-8")
    req = urllib.request.Request(
        url, data=body,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"},
    )
    with urllib.request.urlopen(req, timeout=240) as resp:
        payload = json.loads(resp.read())
    b64 = payload["data"][0]["b64_json"]
    with open(out_path, "wb") as f:
        f.write(base64.b64decode(b64))
    return os.path.getsize(out_path)


FETCHERS = {
    "pollinations": fetch_pollinations,
    "gemini": fetch_gemini,
    "openai": fetch_openai,
}


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    fetch = FETCHERS.get(PROVIDER)
    if not fetch:
        print(f"Unknown PROVIDER={PROVIDER}. Options: {list(FETCHERS)}")
        sys.exit(1)

    wanted = set(int(a) for a in sys.argv[1:]) if len(sys.argv) > 1 else None
    print(f"[gen-card-art] provider={PROVIDER} out={OUT_DIR}")

    ok, fail = 0, 0
    for cid, name, polarity, scene in CARDS:
        if wanted and cid not in wanted:
            continue
        out_path = os.path.join(OUT_DIR, f"{cid:02d}.png")
        prompt = build_prompt(name, polarity, scene)
        seed = BASE_SEED + cid
        for attempt in range(1, 4):
            try:
                size = fetch(prompt, seed, out_path)
                print(f"  [ok]   {cid:02d} {name:<12} {size//1024:>5} KB")
                ok += 1
                break
            except Exception as e:
                print(f"  [..]   {cid:02d} {name} attempt {attempt} failed: {e}")
                time.sleep(3 * attempt)
        else:
            print(f"  [FAIL] {cid:02d} {name} FAILED after retries")
            fail += 1

    print(f"[gen-card-art] done. ok={ok} fail={fail}")
    sys.exit(1 if fail else 0)


if __name__ == "__main__":
    main()
