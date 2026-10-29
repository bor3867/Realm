"""The picture a shared link shows (2026-10-29): 1200x630, the game's own pieces. A night sky over the four lands, the
title in the game's pixel font, a line under it, and a row of dungeon portals (tools/cave_portals.py).
  py -I tools/share_card.py -> art/share.png (index.html's og:image)"""
import math
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pixlib import hex_rgba, write_png  # noqa: E402
import cave_portals as CAVE  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, 'tools', 'build_pixel_font.py'), encoding='utf8').read()
G = {k: v for k, v in re.findall(r"'(.)': '([01 ]+)'", src)}          # the font's glyphs, as its builder writes them
W, H = 1200, 630
img = [[(0, 0, 0, 255)] * W for _ in range(H)]


def h(x, y, s=0):
    return CAVE.H(x, y, s)


def px(x, y, c):
    if 0 <= x < W and 0 <= y < H:
        img[y][x] = c


def rect(x0, y0, w, hh, c):
    for y in range(max(0, y0), min(H, y0 + hh)):
        row = img[y]
        for x in range(max(0, x0), min(W, x0 + w)):
            row[x] = c


# the sky: deep violet to near black, stars
for y in range(H):
    t = y / H
    c = (int(14 + 26 * (1 - abs(t - 0.55) * 1.6)), int(10 + 14 * (1 - t)), int(28 + 40 * (1 - abs(t - 0.5) * 1.5)), 255)
    for x in range(W):
        img[y][x] = c
for k in range(260):
    x, y = int(h(k, 1, 3) * W), int(h(k, 2, 5) * H * 0.7)
    s = 2 if h(k, 3, 7) < 0.2 else 1
    rect(x, y, s * 2, s * 2, hex_rgba('#ffffff' if h(k, 4) < 0.5 else '#c8d4ff'))
# a moon
for y in range(-40, 41):
    for x in range(-40, 41):
        if x * x + y * y <= 1600:
            px(1115 + x, 62 + y, hex_rgba('#fff6d8' if (x + 8) ** 2 + (y + 6) ** 2 > 300 or (x - 10) ** 2 + (y - 4) ** 2 > 120 else '#e8dcb8'))
# the four lands along the bottom, in steps of 8px blocks
LANDS = [('#d8b880', '#c09a5a'), ('#4a9a3a', '#3a7a2e'), ('#3e7a3a', '#2e5e2a'), ('#dce6f0', '#b8c8d8')]
for x in range(0, W, 8):
    lx = min(3, x * 4 // W)
    a, b = LANDS[lx]
    for y in range(H - 120, H, 8):
        rect(x, y, 8, 8, hex_rgba(a if h(x // 8, y // 8, 9) > 0.18 else b))
# hills behind
for x in range(W):
    top = int(H - 150 - 30 * math.sin(x / 140) - 14 * math.sin(x / 47 + 1))
    for y in range(top, H - 120):
        px(x, y, (22, 16, 38, 255))


def text(s, x0, y0, S, col, shadow=(0, 0, 0, 255)):
    """the pixel font at S screen pixels a font pixel, left edge x0, cap top y0; returns its width"""
    x = x0
    for ch in s:
        if ch == ' ':
            x += 4 * S
            continue
        g = G.get(ch)
        if not g:
            continue
        rows = g.split()
        for r, row in enumerate(rows):
            for c, bit in enumerate(row):
                if bit == '1':
                    rect(x + c * S + S // 2, y0 + r * S + S // 2, S, S, shadow)
        for r, row in enumerate(rows):
            for c, bit in enumerate(row):
                if bit == '1':
                    rect(x + c * S, y0 + r * S, S, S, col)
        x += (len(rows[0]) + 1) * S
    return x - x0


def width(s, S):
    return sum(4 * S if ch == ' ' else (len(G[ch].split()[0]) + 1) * S for ch in s if ch == ' ' or ch in G)


T = 'MELON REALMS'
S = 16
text(T, (W - width(T, S)) // 2, 120, S, hex_rgba('#ffc94a'), hex_rgba('#5a3a0a'))
sub = 'A pixel bullet-hell RPG in your browser'
text(sub, (W - width(sub, 4)) // 2, 230, 4, hex_rgba('#e9e4f2'))
# a row of dungeon portals, each 6x
row = ['frostveil', 'keep', 'hive', 'heart', 'theatre', 'mirerot', 'hollowmoon']
P = 6
gx = (W - len(row) * (16 * P + 24) + 24) // 2
for k, kind in enumerate(row):
    g = CAVE.frame(CAVE.OURS[kind], 0, 3)
    for y in range(16):
        for x in range(16):
            c = g[y][x]
            if c:
                rect(gx + k * (16 * P + 24) + x * P, 330 + y * P, P, P, hex_rgba(c))
write_png(os.path.join(ROOT, 'art', 'share.png'), img)
print('share card written')
