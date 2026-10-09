"""Rebuild world art and write scaled previews to art/world/preview/.

    py tools/preview_world.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import world_art as w  # noqa: E402
from pixlib import write_png  # noqa: E402

caps = {}
_orig = w.write_png


def _cap(path, px):
    _orig(path, px)
    caps[os.path.basename(path)] = px


w.write_png = _cap
w.build()
out = os.path.join(w.OUT, 'preview')
os.makedirs(out, exist_ok=True)
bg = (42, 40, 51, 255)
for name, px in caps.items():
    s = 8 if name == 'projectiles.png' else 4
    write_png(os.path.join(out, name.replace('.png', f'_x{s}.png')),
              [[(c if c[3] else bg) for c in row for _ in range(s)] for row in px for _ in range(s)])
print(sorted(caps))
