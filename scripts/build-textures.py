#!/usr/bin/env python3
"""
Builds the tile textures for the range from src/data/range/designs.json.

For each design it fetches the CC0 scan from ambientCG (colour and normal map,
2048 px, cached in assets/sources/, which is gitignored), cuts the master in
the design's proportions (1:2 for stone, 1:6 for a plank), writes a large and
a small face and a normal map to public/tiles/, then grades each colourway in
CIELAB, so a colourway moves the stone's tone and keeps its veins. Legacy
designs (the first fifteen) start from their existing face in public/tiles/.

It writes src/data/range/swatches.json: per design, the master's aspect, its
files and, per colourway, the file, the mean colour and a colour family.

    python3 scripts/build-textures.py            # everything missing
    python3 scripts/build-textures.py --force    # rebuild all
    python3 scripts/build-textures.py lasa rosa  # just these designs
    python3 scripts/build-textures.py --sheet out.jpg   # also a contact sheet

Needs Pillow and numpy.
"""
import json
import os
import re
import sys
import urllib.request

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RANGE = os.path.join(ROOT, 'src/data/range/designs.json')
MANIFEST = os.path.join(ROOT, 'src/data/range/swatches.json')
TILES = os.path.join(ROOT, 'public/tiles')
CACHE = os.path.join(ROOT, 'assets/sources/ambientcg')
PREVIEW = 'https://f003.backblazeb2.com/file/ambientCG-Web/media/surface-preview/{id}/{id}_SQ_{map}.jpg'

LG, SM, NM = (900, 1800), (360, 720), (640, 1280)
PLANK_LG, PLANK_SM = (300, 1800), (120, 720)


# ---------------------------------------------------------------- colour

def srgb_to_lab(rgb):
    c = rgb.astype(np.float64) / 255.0
    lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    m = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750], [0.0193339, 0.1191920, 0.9503041]])
    xyz = np.einsum('...j,ij->...i', lin, m) / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 216 / 24389, np.cbrt(xyz), (24389 / 27 * xyz + 16) / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def lab_to_srgb(lab):
    fy = (lab[..., 0] + 16) / 116
    fx, fz = fy + lab[..., 1] / 500, fy - lab[..., 2] / 200
    inv = lambda t: np.where(t ** 3 > 216 / 24389, t ** 3, (116 * t - 16) / (24389 / 27))
    xyz = np.stack([inv(fx), inv(fy), inv(fz)], -1) * np.array([0.95047, 1.0, 1.08883])
    m = np.array([[3.2404542, -1.5371385, -0.4985314], [-0.9692660, 1.8760108, 0.0415560], [0.0556434, -0.2040259, 1.0572252]])
    lin = np.clip(np.nan_to_num(np.einsum('...j,ij->...i', xyz, m)), 0, 1)
    c = np.where(lin <= 0.0031308, 12.92 * lin, 1.055 * lin ** (1 / 2.4) - 0.055)
    return (np.clip(c, 0, 1) * 255 + 0.5).astype(np.uint8)


def grade(img, g):
    """Applies a grade preset (see "grades" in designs.json) to a PIL image."""
    lab = srgb_to_lab(np.asarray(img.convert('RGB')))
    L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
    mean = L.mean()
    L = (L - mean) * g.get('contrast', 1) + mean + g.get('dL', 0)
    C, h = np.hypot(a, b), np.arctan2(b, a)
    C = C * g.get('chroma', 1)
    if 'hue' in g:
        h = np.full_like(h, np.radians(g['hue']))
    a, b = C * np.cos(h), C * np.sin(h)
    a, b = a + g.get('a', 0), b + g.get('b', 0)
    if 'shadow' in g:  # tint the dark ground, not the light veins
        w = np.clip(1 - L / 60, 0, 1) ** 1.2
        a, b = a + g['shadow'][0] * w, b + g['shadow'][1] * w
    if 'highlight' in g:  # tint the light veins, not the ground
        w = np.clip((L - 35) / 50, 0, 1) ** 1.5
        a, b = a + g['highlight'][0] * w, b + g['highlight'][1] * w
    if 'vein' in g:  # tint the dark veins of a light stone, not its ground
        w = np.clip((mean - L) / 14, 0, 1) ** 0.9
        a, b = a + g['vein'][0] * w, b + g['vein'][1] * w
    return Image.fromarray(lab_to_srgb(np.stack([np.clip(L, 0, 100), a, b], -1)))


def family(img):
    """A colour family for filtering, from the mean colour and how varied it is."""
    lab = srgb_to_lab(np.asarray(img.convert('RGB').resize((64, 128))))
    L, a, b = (lab[..., i].mean() for i in range(3))
    spread = np.hypot(lab[..., 1].std(), lab[..., 2].std())
    C, h = np.hypot(a, b), np.degrees(np.arctan2(b, a)) % 360
    if spread > 14 and C < 18:
        return 'Multi'
    if L < 31:
        return 'Black'
    if C < 6:
        return 'White' if L > 80 else 'Grey'
    if h < 35 or h >= 340:
        return 'Pink' if L > 62 else 'Red'
    if h < 100:
        if L > 80:
            return 'Cream'
        if C > 26 and L > 45:
            return 'Gold' if h > 62 else 'Copper'
        if L < 48:
            return 'Brown'
        return 'Taupe' if C < 13 else 'Beige'
    if h < 200:
        return 'Green'
    if h < 300:
        return 'Blue'
    return 'Pink'


# ---------------------------------------------------------------- sources

def fetch(asset, which):
    path = os.path.join(CACHE, asset, f'{asset}_{which}.jpg')
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        url = PREVIEW.format(id=asset, map=which)
        urllib.request.urlretrieve(url, path)
    return Image.open(path)


def cut(img, plank, rotate):
    """The master: a centred strip in the design's proportions."""
    if rotate:
        img = img.rotate(90, expand=True)
    w, h = img.size
    cw = round(h / 6) if plank else round(h / 2)
    x = (w - cw) // 2
    return img.crop((x, 0, x + cw, h))


def save(img, name, size, q):
    img.convert('RGB').resize(size, Image.LANCZOS).save(os.path.join(TILES, name), 'WEBP', quality=q, method=6)


def synth_normal(master, size, strength=3.2):
    """A relief map from the stone itself: lightness as height, so carving follows the vein."""
    from PIL import ImageFilter
    h = np.asarray(master.convert('L').resize(size, Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.6)), dtype=np.float64) / 255.0
    gy, gx = np.gradient(h)
    nx, ny, nz = -gx * strength * 10, gy * strength * 10, np.ones_like(h)
    n = np.stack([nx, ny, nz], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    return Image.fromarray(((n * 0.5 + 0.5) * 255).astype(np.uint8))


def flat(path):
    """a normal map with no relief in it (many polished-stone scans have none)"""
    if not os.path.exists(path):
        return True
    a = np.asarray(Image.open(path).convert('RGB').resize((128, 256)), dtype=np.float64)
    return a[..., 0].std() < 2 and a[..., 1].std() < 2


def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower().replace('é', 'e')).strip('-')


# ---------------------------------------------------------------- build

def build(d, grades, force):
    did, plank = d['id'], d['look'] == 'wood'
    lg_size, sm_size = (PLANK_LG, PLANK_SM) if plank else (LG, SM)
    base = os.path.join(TILES, f'{did}.webp')
    entry = {'normal': False, 'colourways': []}
    if d.get('legacy'):
        master = Image.open(base).convert('RGB')
        entry['normal'] = os.path.exists(os.path.join(TILES, f'{did}-n.webp'))
    else:
        asset = d['source'].split(':')[1]
        if force or not os.path.exists(base):
            master = cut(fetch(asset, 'Color').convert('RGB'), plank, d.get('rotate'))
            save(master, f'{did}.webp', lg_size, 82)
            save(master, f'{did}-sm.webp', sm_size, 78)
            try:
                n = cut(fetch(asset, 'NormalDX').convert('RGB'), plank, d.get('rotate'))
                r, g, bl = n.split()
                # DirectX to OpenGL: flip green
                n = Image.merge('RGB', (r, g.point(lambda v: 255 - v), bl))
                save(n, f'{did}-n.webp', PLANK_LG if plank else NM, 80)
            except Exception as e:  # some scans have no normal map preview
                print(f'  no normal map for {did}: {e}')
        master = Image.open(base).convert('RGB')
        entry['normal'] = os.path.exists(os.path.join(TILES, f'{did}-n.webp'))
    npath = os.path.join(TILES, f'{did}-n.webp')
    if flat(npath):
        synth_normal(master, PLANK_LG if plank else NM).save(npath, 'WEBP', quality=82)
    entry['normal'] = True
    entry['aspect'] = round(master.width / master.height, 4)
    for i, cw in enumerate(d['colourways']):
        if cw['grade'] is None:
            img, file = master, f'{did}.webp'
        else:
            file = f"{did}--{slug(cw['name'])}.webp"
            if force or not os.path.exists(os.path.join(TILES, file)):
                img = grade(master, grades[cw['grade']])
                img.save(os.path.join(TILES, file), 'WEBP', quality=80, method=6)
                img.resize((max(1, round(master.width * sm_size[1] / master.height)), sm_size[1]), Image.LANCZOS).save(
                    os.path.join(TILES, file.replace('.webp', '-sm.webp')), 'WEBP', quality=76, method=6)
            else:
                img = Image.open(os.path.join(TILES, file)).convert('RGB')
        mean = np.asarray(img.resize((32, 64))).reshape(-1, 3).mean(0)
        entry['colourways'].append({
            'slug': slug(cw['name']),
            'name': cw['name'],
            'file': file,
            'swatch': '#%02x%02x%02x' % tuple(int(v) for v in mean),
            'family': cw.get('family') or family(img),
        })
    return entry


def sheet(manifest, designs, out):
    rows = [(d, cw) for d in designs if d['id'] in manifest for cw in manifest[d['id']]['colourways']]
    cols, tw, th = 12, 120, 200
    im = Image.new('RGB', (cols * (tw + 6), ((len(rows) + cols - 1) // cols) * (th + 30)), (241, 241, 238))
    dr = ImageDraw.Draw(im)
    try:  # a system font, for the accents in names like Wengé
        font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 11)
    except OSError:
        font = None
    for i, (d, cw) in enumerate(rows):
        t = Image.open(os.path.join(TILES, cw['file'])).convert('RGB')
        t = t.resize((tw, th)) if d['look'] != 'wood' else t.resize((th // 6 * 2, th)).crop((0, 0, th // 6 * 2, th))
        x, y = (i % cols) * (tw + 6), (i // cols) * (th + 30)
        im.paste(t, (x, y))
        dr.text((x, y + th + 2), f"{d['name'][:18]}", fill=(10, 10, 10), font=font)
        dr.text((x, y + th + 14), f"{cw['name']} · {cw['family']}", fill=(100, 100, 100), font=font)
    im.save(out, quality=82)
    print('sheet', out, len(rows))


def main():
    args = sys.argv[1:]
    force = '--force' in args
    out = args[args.index('--sheet') + 1] if '--sheet' in args else None
    only = [a for a in args if not a.startswith('--') and a != out]
    data = json.load(open(RANGE))
    manifest = json.load(open(MANIFEST)) if os.path.exists(MANIFEST) else {}
    for d in data['designs']:
        if only and d['id'] not in only:
            continue
        print(d['id'])
        manifest[d['id']] = build(d, data['grades'], force)
    ids = [d['id'] for d in data['designs']]
    manifest = {k: manifest[k] for k in ids if k in manifest}
    json.dump(manifest, open(MANIFEST, 'w'), indent=1, ensure_ascii=False)
    if out:
        sheet(manifest, data['designs'], out)


if __name__ == '__main__':
    main()
