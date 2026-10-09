"""THE UNSTRUCK GOD - the final boss (64x64 frames, 32x32 art doubled, RotMG-style; the game outlines it).

Never once struck in the war that broke the world. A colossal marble face split by a seam of gold, a crown of
spikes, a broken halo turning behind him, gold pauldrons and gauntlets the size of houses, and violet robes
that end in tatters: he floats. The sun on his chest is the one he stole.

Frames: I0 I1 | T (arms raised, eyes flare) | A (fists thrust down) | S (the halo whole and blazing)
        | D0 (cracks spread) D1 (crumbling) D2 (rubble and a fallen crown)

    py tools/unstruck_god.py
"""
import json
import math
import os

from drawkit import Cv
from pixlib import hex_rgba, write_png

PAL = {'g': '#F2C14E', 'G': '#A8792A', 'y': '#FFF0A0', 'w': '#E8E4F0', 'W': '#A8A4B8', 'c': '#8AF6FF', 'C': '#FFFFFF',
       'v': '#6A3AA8', 'V': '#3A1A6A', 'u': '#9A6AE0', 'h': '#5EC8F0', 'H': '#E0FFFF', 'k': '#2A1A10', 'r': '#FF4A5A'}


def god(f=0, mode='idle'):
    c = Cv(32, 32)
    by = (f % 2) if mode == 'idle' else -1 if mode in ('tell', 'special') else 1 if mode == 'attack' else 0
    # the broken halo, turning behind his head
    whole = mode == 'special'
    for k in range(40):
        a = k / 40 * math.tau + f * 0.3
        if not whole and (k % 10) in (3, 4, 8):
            continue
        x, y = 16 + math.cos(a) * 13, 9 + by + math.sin(a) * 9
        c.p(x, y, 'H' if (k % 5 == 0 or whole) else 'h')
    # robes: a violet bell that ends in tatters
    c.trap(14 + by, 27, 9, 22, 5, 26, 'v')
    c.trap(14 + by, 27, 9, 12, 5, 9, 'V'); c.trap(14 + by, 27, 20, 22, 23, 26, 'u')
    for x in range(5, 27, 3):
        c.p(x, 28, 'v'); c.p(x + 1, 29, 'V')                     # tattered hem, he floats
    c.rect(15, 14 + by, 16, 27, 'g')                             # a gold stole down the front
    c.ell(15.5, 20 + by, 2.6, 2.6, 'y' if mode in ('special', 'attack') else 'g'); c.p(15, 19 + by, 'C')   # the stolen sun
    # pauldrons
    c.ell(7, 14 + by, 4.5, 2.6, 'g'); c.ell(24, 14 + by, 4.5, 2.6, 'g')
    c.ell(7, 15 + by, 4, 1.6, 'G', only='g'); c.ell(24, 15 + by, 4, 1.6, 'G', only='g')
    # arms + gauntlets
    if mode == 'tell' or mode == 'special':
        for sx, d in ((4, -1), (27, 1)):
            c.rect(sx - 1, 6 + by, sx + 1, 13 + by, 'V')
            c.ell(sx, 5 + by, 2.6, 2.4, 'g'); c.p(sx - 1, 4 + by, 'y')
    elif mode == 'attack':
        for sx in (5, 26):
            c.rect(sx - 1, 16 + by, sx + 1, 23 + by, 'V')
            c.ell(sx, 25 + by, 3, 2.6, 'g'); c.p(sx - 1, 24 + by, 'y')
    else:
        for sx in (3, 28):
            c.rect(sx - 1, 15 + by, sx + 1, 20 + by, 'V')
            c.ell(sx, 22 + by, 2.6, 2.4, 'g'); c.p(sx - 1, 21 + by, 'y')
    # the head: marble, a gold seam, glowing eyes
    c.rect(11, 5 + by, 20, 12 + by, 'w'); c.rect(18, 6 + by, 20, 12 + by, 'W'); c.rect(12, 13 + by, 19, 13 + by, 'W')
    eye = 'C' if mode in ('tell', 'special') else 'c'
    c.rect(12, 8 + by, 14, 8 + by, eye); c.rect(17, 8 + by, 19, 8 + by, eye)
    c.ln(16, 5 + by, 15, 13 + by, 'g')                            # kintsugi: the only crack in him, mended with gold
    if mode == 'attack':
        c.rect(14, 11 + by, 17, 12 + by, 'r')                      # he speaks
    else:
        c.rect(14, 11 + by, 17, 11 + by, 'W')
    # the crown of spikes
    c.rect(10, 4 + by, 21, 5 + by, 'g'); c.rect(10, 5 + by, 21, 5 + by, 'G')
    for k, x in enumerate(range(10, 22, 2)):
        h = [2, 3, 4, 4, 3, 2][k]
        c.rect(x, 4 + by - h, x, 3 + by, 'g'); c.p(x, 4 + by - h, 'y')
    c.p(15, 2 + by, 'r'); c.p(16, 2 + by, 'r')                    # a ruby at the crown's heart
    if mode == 'special':
        for x, y in ((2, 2), (29, 3), (1, 26), (30, 25), (16, 0), (8, 30), (24, 30)):
            c.p(x, y, 'H')
    return [''.join(r) for r in c.g]


def death(stage):
    if stage == 0:
        g = [list(r) for r in god(0, 'idle')]
        for x, y in ((12, 6), (13, 7), (19, 10), (20, 11), (8, 18), (9, 19), (22, 20), (23, 21), (14, 24), (15, 25)):
            g[y][x] = 'k'                                          # cracks spread
        return [''.join(r) for r in g]
    c = Cv(32, 32)
    if stage == 1:                                                 # crumbling: a heap of marble and violet, the crown slipping
        c.trap(18, 30, 8, 23, 4, 27, 'v'); c.trap(18, 30, 8, 11, 4, 8, 'V')
        c.rect(11, 14, 20, 20, 'w'); c.rect(17, 15, 20, 20, 'W'); c.ln(16, 14, 14, 20, 'k')
        c.rect(12, 17, 14, 17, 'W'); c.rect(17, 17, 19, 17, 'W')
        c.rect(19, 11, 27, 13, 'g'); c.p(21, 9, 'g'); c.p(23, 8, 'g'); c.p(25, 9, 'g')
        for x in range(4, 28, 4):
            c.p(x, 30, 'W'); c.p(x + 2, 31, 'w')
        return [''.join(r) for r in c.g]
    for x0, y0, w, col in ((4, 26, 6, 'w'), (11, 27, 5, 'W'), (18, 26, 7, 'w'), (25, 28, 4, 'W'), (8, 29, 9, 'v'), (19, 29, 8, 'V')):
        c.rect(x0, y0, x0 + w - 1, y0 + 2, col)                      # rubble
    c.rect(12, 23, 20, 25, 'g'); c.p(13, 21, 'g'); c.p(16, 20, 'g'); c.p(19, 21, 'g'); c.p(16, 22, 'r')   # the fallen crown
    return [''.join(r) for r in c.g]


FRAMES = [god(0), god(1), god(0, 'tell'), god(1, 'attack'), god(0, 'special'), death(0), death(1), death(2)]

ROOT = os.path.join(os.path.dirname(__file__), '..', 'art', 'sprites', 'bosses')

if __name__ == '__main__':
    pal = {k: hex_rgba(v) for k, v in PAL.items()}
    T = (0, 0, 0, 0)
    f = FRAMES
    cols = [f[0], f[0], f[1], f[1], f[2], f[3], f[4], f[5], f[6], f[7]]     # idle 0-3, tell 4, attack 5, special 6, death 7-9
    out = [[T] * (64 * len(cols)) for _ in range(64)]
    for k, g in enumerate(cols):
        for y in range(64):
            for x in range(64):
                ch = g[y // 2][x // 2]
                if ch != '.':
                    out[y][k * 64 + x] = pal[ch]
    from retro import shade_px
    write_png(os.path.join(ROOT, 'godking_sheet.png'), shade_px(out, 64, 64))
    guide = {'image': 'godking_sheet.png', 'frameWidth': 64, 'frameHeight': 64, 'columns': 10, 'rows': 1, 'pivot': {'x': 32, 'y': 61},
             'bosses': {'the_unstruck_god': {'row': 0}}}
    json.dump(guide, open(os.path.join(ROOT, 'godking_sheet.json'), 'w'), indent=2)
    print('built godking_sheet')
