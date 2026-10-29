# The home page opens in a room, and scrolling takes one tile off its wall.
# From the room's photograph and a full-resolution face of its stone this makes:
#   room.jpg       the room with that tile gone: the bare adhesive bed it leaves
#   room-blur.jpg  the same, out of focus
#   room-full.jpg  the room with the tile in (shown until the film starts, and without motion)
#   piece.jpg      the tile alone, in the room's light: the flat stand-in in the page
#   tile.jpg       the tile's face for the 3D slab, in the room's colour but no light
#   slab.jpg       the same stone cut 1:2, the slab it becomes once it turns edge-on
# and src/home/room.json, where the tile sits in the photograph.
#   python3 scripts/make-hero-room.py [room.png] [face.png]
# Both pictures are generated (docs/imagery.md); the face was made from a crop
# of the room's wall, so it is the same stone at five times the resolution.
# The tile takes the photograph's light (its shading, blurred past the veins)
# and colour (its mean, channel by channel), so it sits in the wall.
import json
import sys
import numpy as np
from PIL import Image, ImageFilter

SRC = sys.argv[1] if len(sys.argv) > 1 else 'assets/imagery/hero-room.png'
FACE = sys.argv[2] if len(sys.argv) > 2 else 'assets/imagery/hero-tile.png'
OUT = 'public/renders/home'
# the centre tile of the upper row, inside its joints, in the photograph's pixels
X, Y, W, H = 765, 18, 147, 349

room = Image.open(SRC).convert('RGB')
im = np.asarray(room).astype(np.float32)
tile = im[Y : Y + H, X : X + W]

# the photograph's light on the tile, without its veins
lum = Image.fromarray(tile.mean(2).astype(np.uint8)).filter(ImageFilter.GaussianBlur(W / 5))
shade = np.asarray(lum).astype(np.float32)
shade /= shade.mean()


# the face, cut to the tile's proportions about its centre
src = Image.open(FACE).convert('RGB')
cw = round(src.height * W / H)
src = src.crop(((src.width - cw) // 2, 0, (src.width - cw) // 2 + cw, src.height))


def lit(size, light=True):
    """the face at this size, in the photograph's colour and, if asked, its light"""
    w, h = size
    face = np.asarray(src.resize((w, h), Image.LANCZOS)).astype(np.float32)
    s = np.asarray(Image.fromarray((shade * 128).clip(0, 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)).astype(np.float32) / 128
    out = face * s[..., None] if light else face
    out = out * tile.reshape(-1, 3).mean(0) / out.reshape(-1, 3).mean(0)
    return out.clip(0, 255)


piece = lit(src.size)
Image.fromarray(piece.astype(np.uint8)).save(f'{OUT}/piece.jpg', quality=88)
Image.fromarray(lit(src.size, light=False).astype(np.uint8)).save(f'{OUT}/tile.jpg', quality=88)
# the same stone as an 800 × 1600 slab, for once the tile has turned edge-on
whole = Image.open(FACE).convert('RGB')
sw = whole.height // 2
slab = np.asarray(whole.crop(((whole.width - sw) // 2, 0, (whole.width - sw) // 2 + sw, whole.height))).astype(np.float32)
slab = slab * tile.reshape(-1, 3).mean(0) / slab.reshape(-1, 3).mean(0)
Image.fromarray(slab.clip(0, 255).astype(np.uint8)).save(f'{OUT}/slab.jpg', quality=88)

full = im.copy()
full[Y : Y + H, X : X + W] = lit((W, H))
Image.fromarray(full.astype(np.uint8)).save(f'{OUT}/room-full.jpg', quality=88)

# the bed it leaves: pale adhesive combed by a notched trowel, the ridges
# broken where the tile tore away, in the room's light and colour, shaded
# along the top and the left where the neighbours stand proud
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
rng = np.random.default_rng(7)


def noise(blur):
    n = Image.fromarray((rng.random((H, W)) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(blur))
    n = np.asarray(n).astype(np.float32)
    return (n - n.mean()) / (n.std() + 1e-6)


comb = np.sin((yy + 2.2 * np.sin(xx / 17 + 1.3) + 1.2 * noise(6)) * (2 * np.pi / 5.2))
torn = (noise(3) > 0.35).astype(np.float32)
bed = 0.9 + 0.035 * comb * (1 - 0.7 * torn) + 0.03 * noise(9) + 0.02 * noise(0.7)
edge = lambda d, k, r: 1 - k * np.exp(-d / r)
bed *= edge(xx, 0.55, 3.0) * edge(yy, 0.5, 3.0) * edge(W - 1 - xx, 0.15, 1.5) * edge(H - 1 - yy, 0.1, 1.5)
light = tile.reshape(-1, 3).mean(0)
cement = (0.75 * light + 0.25 * light.mean()) * 0.9
recess = cement * bed[..., None] * shade[..., None]
out = im.copy()
out[Y : Y + H, X : X + W] = recess.clip(0, 255)
Image.fromarray(out.astype(np.uint8)).save(f'{OUT}/room.jpg', quality=88)
# the same, out of focus, for when the eye is on the tile coming towards it
Image.fromarray(out.astype(np.uint8)).filter(ImageFilter.GaussianBlur(9)).save(f'{OUT}/room-blur.jpg', quality=80)

json.dump({'w': room.width, 'h': room.height, 'tile': {'x': X, 'y': Y, 'w': W, 'h': H}}, open('src/home/room.json', 'w'))
print('room', room.size, 'tile', (X, Y, W, H), 'piece', piece.shape[1::-1])
