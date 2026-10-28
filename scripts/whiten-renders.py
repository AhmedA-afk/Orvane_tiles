# Makes a light-studio render's background pure white, so the picture can sit
# on any light field with mix-blend-mode: multiply and leave no box behind.
#   python3 scripts/whiten-renders.py public/renders/show/tower-portoro.jpg ...
# Each channel is divided by the background colour (read from the top corners)
# and clipped; the stone keeps its tones relative to the ground.
import sys
import numpy as np
from PIL import Image

for path in sys.argv[1:]:
    im = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    corner = np.concatenate([im[:40, :40].reshape(-1, 3), im[:40, -40:].reshape(-1, 3)])
    ground = np.median(corner, axis=0)
    out = np.clip(im / ground * 255.0, 0, 255).astype(np.uint8)
    Image.fromarray(out).save(path, quality=86)
    print(path, 'ground', ground.round(1))
