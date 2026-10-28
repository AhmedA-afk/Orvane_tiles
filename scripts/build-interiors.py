#!/usr/bin/env python3
"""
Prepares the generated interiors for the web. For every shot in
src/data/range/interiors.json that has an image in assets/imagery/raw/, it
writes public/images/interiors/<id>.jpg, <id>.webp and a smaller <id>-sm.webp,
and records what was built in src/data/range/interiors-built.json, which is
what the site shows. When better masters arrive (2K, upscaled), drop them in
assets/imagery/raw/ under the same name and run this again.

    python3 scripts/build-interiors.py [--sheet out.jpg]

Needs Pillow.
"""
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(ROOT, 'src/data/range/interiors.json')
BUILT = os.path.join(ROOT, 'src/data/range/interiors-built.json')
RAW = os.path.join(ROOT, 'assets/imagery/raw')
OUT = os.path.join(ROOT, 'public/images/interiors')
SM = 800


def raw_of(sid):
    for ext in ('png', 'jpg', 'jpeg', 'webp'):
        p = os.path.join(RAW, f'{sid}.{ext}')
        if os.path.exists(p):
            return p
    return None


def main():
    os.makedirs(OUT, exist_ok=True)
    shots = json.load(open(SHOTS))['shots']
    built = {}
    for s in shots:
        src = raw_of(s['id'])
        if not src:
            continue
        im = Image.open(src).convert('RGB')
        # 16:9 exactly, so every interior frames the same way
        w, h = im.size
        if abs(w / h - 16 / 9) > 0.01:
            nh = round(w * 9 / 16)
            if nh <= h:
                top = (h - nh) // 2
                im = im.crop((0, top, w, top + nh))
            else:
                nw = round(h * 16 / 9)
                left = (w - nw) // 2
                im = im.crop((left, 0, left + nw, h))
        base = os.path.join(OUT, s['id'])
        im.save(base + '.jpg', quality=84, optimize=True, progressive=True)
        im.save(base + '.webp', quality=80, method=6)
        im.resize((SM, round(SM * im.height / im.width)), Image.LANCZOS).save(base + '-sm.webp', quality=78, method=6)
        built[s['id']] = {'w': im.width, 'h': im.height}
        print(s['id'], im.size)
    json.dump(built, open(BUILT, 'w'), indent=1)
    print(f'{len(built)} of {len(shots)} built')
    if '--sheet' in sys.argv:
        out = sys.argv[sys.argv.index('--sheet') + 1]
        ids = [s['id'] for s in shots if s['id'] in built]
        tw, th, cols = 480, 270, 4
        sheet = Image.new('RGB', (cols * (tw + 6), ((len(ids) + cols - 1) // cols) * (th + 22)), (241, 241, 238))
        dr = ImageDraw.Draw(sheet)
        try:
            font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 12)
        except OSError:
            font = None
        for i, sid in enumerate(ids):
            t = Image.open(os.path.join(OUT, f'{sid}-sm.webp')).convert('RGB').resize((tw, th))
            x, y = (i % cols) * (tw + 6), (i // cols) * (th + 22)
            sheet.paste(t, (x, y))
            dr.text((x + 2, y + th + 4), sid, fill=(10, 10, 10), font=font)
        sheet.save(out, quality=82)
        print('sheet', out)


if __name__ == '__main__':
    main()
