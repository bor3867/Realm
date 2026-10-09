"""Readability test: every finished class on every terrain at 1x/2x/4x,
plus a pure-silhouette strip. Not a game asset.

    py tools/lineup.py
"""
import os
import random
import sys

sys.path.insert(0, os.path.dirname(__file__))
from pixlib import hex_rgba, render, write_png  # noqa: E402
import forgefist  # noqa: E402
import anvilheart  # noqa: E402
import heliarch  # noqa: E402

OUT = os.path.join(os.path.dirname(__file__), '..', 'art', 'sprites', 'player', 'lineup_test.png')

ff, ah, he = forgefist.frames(), anvilheart.frames(), heliarch.frames()
CLASSES = [
    (forgefist.PAL, [ff['front_idle'][0], ff['right_idle'][0], ff['back_idle'][0]]),
    (anvilheart.PAL, [ah['front_idle'][0], ah['side_idle'][0], ah['back_idle'][0]]),
    (heliarch.PAL, [he['front_idle'][0], he['side_idle'][0], he['back_idle'][0]]),
]

TERRAINS = {
    'grass': ('#3E6B3A', '#2F5530', '#5A8A45'),
    'stone': ('#6B6A70', '#4E4D55', '#8A8990'),
    'dungeon': ('#2A2430', '#1C1822', '#3A3242'),
    'sand': ('#C9A86A', '#A8874F', '#E0C58C'),
}
GAP, PAD = 6, 4
SPRITES = [(pal, fr) for pal, frs in CLASSES for fr in frs]
PW = PAD * 2 + len(SPRITES) * 16 + (len(SPRITES) - 1) * GAP + 2 * GAP  # extra gap between classes
PH = 16 + PAD * 2


def terrain(name, w, h):
    base, dark, light = (hex_rgba(c) for c in TERRAINS[name])
    rnd = random.Random(name)
    px = [[base] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            r = rnd.random()
            if name == 'stone' and (y % 8 == 7 or (x + (y // 8) * 4) % 8 == 7):
                px[y][x] = dark
            elif name == 'dungeon' and r < 0.04:
                px[y][x] = light
            elif r < 0.07:
                px[y][x] = dark
            elif r < 0.11:
                px[y][x] = light
    return px


def panel(name, silhouette=None):
    p = terrain(name, PW, PH) if name else [[hex_rgba('#D8D3C6')] * PW for _ in range(PH)]
    x = PAD
    for n, (pal, fr) in enumerate(SPRITES):
        img = render(fr, {k: hex_rgba(v) for k, v in pal.items()}, silhouette=silhouette)
        for j, row in enumerate(img):
            for i, c in enumerate(row):
                if c[3]:
                    p[PAD + j][x + i] = c
        x += 16 + GAP + (GAP if n % 3 == 2 else 0)
    return p


def scale(img, s):
    return [[c for c in row for _ in range(s)] for row in img for _ in range(s)]


if __name__ == '__main__':
    BG = hex_rgba('#141218')
    panels = [panel(t) for t in TERRAINS] + [panel(None, silhouette=hex_rgba('#0A0A0E'))]
    W = PW * 7 + 4 * 8                      # 1x + 2x + 4x side by side
    rows_h = [PH * 4 for _ in panels]
    H = sum(rows_h) + 8 * (len(panels) + 1)
    out = [[BG] * W for _ in range(H)]
    y = 8
    for p in panels:
        x = 8
        for s in (1, 2, 4):
            img = scale(p, s)
            for j, row in enumerate(img):
                out[y + j][x:x + len(row)] = row
            x += PW * s + 8
        y += PH * 4 + 8
    write_png(OUT, out)
    print(W, H)
