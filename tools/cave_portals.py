"""Dungeon portals as cave mouths (2026-10-28, the user: "look more like realm of the mad god. More cool unique cave design
for each with mostly a black entrance"). Every dungeon its own gateway, 16x16: a frame in its own stuff (icy rock, a
honeycomb, a striped tent, a carved pumpkin...) around a black way in, and one small thing that moves (eyes in the dark,
a drip, a flame, a turning clock hand).

  py -I tools/cave_portals.py            a preview sheet (art/_proto/cave_portals_preview.png)
  py -I tools/cave_portals.py --apply    writes them into the sheets: ours into art/world/objects.png (3 frames each, at
                                         world.json's portals index), the rf dungeons' into rf_portals.png (4 frames)
tools/world_art.py and tools/rf_build_foes.py take them from here too, so a full rebuild keeps them.
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pixlib import hex_rgba, write_png  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = '#0d0a12'      # the outline
VOID = '#000000'     # the way in
DEEP = '#0b0810'     # its lip, a breath lighter


def H(x, y, s=0):
    n = (x * 374761393 + y * 668265263 + s * 2246822519) & 0xffffffff
    n = ((n ^ (n >> 13)) * 1274126177) & 0xffffffff
    return ((n ^ (n >> 16)) % 1000) / 1000


# ---- masks: sets of (x, y)
ALL = [(x, y) for y in range(16) for x in range(16)]


def ell(cx, cy, rx, ry, jag=0.0, s=0):
    return {(x, y) for x, y in ALL if ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1 + jag * (H(x, y, s) - .5)}


def box(x0, y0, x1, y1):
    return {(x, y) for x, y in ALL if x0 <= x <= x1 and y0 <= y <= y1}


def arch(cx, top, half, bottom=15, point=0.0, jag=0.0, s=0):
    """a doorway: straight sides, a round (or, point > 0, a pointed) top, its foot on the ground"""
    M, R = set(), half * (1 + point)
    for x, y in ALL:
        if not top <= y <= bottom:
            continue
        dx, yy = abs(x + .5 - cx), y + .5 - (top + half)
        if jag:
            dx += jag * (H(x, y, s + 9) - .5)
        if yy >= 0:
            ok = dx <= half
        elif point:
            ok = (dx + (R - half)) ** 2 + yy ** 2 <= R ** 2
        else:
            ok = dx ** 2 + yy ** 2 <= half ** 2
        if ok:
            M.add((x, y))
    return M


def tri(ax, ay, bx0, bx1, by):
    """a triangle: apex (ax, ay), base from bx0 to bx1 on row by"""
    M = set()
    for x, y in ALL:
        if ay <= y <= by:
            u = (y - ay) / max(1, by - ay)
            if ax + (bx0 - ax) * u - .5 <= x <= ax + (bx1 - ax) * u + .5:
                M.add((x, y))
    return M


def ring(cx, cy, r0, r1):
    return {(x, y) for x, y in ALL if r0 <= math.hypot(x + .5 - cx, y + .5 - cy) <= r1}


# ---- textures: 0 dark, 1 mid, 2 light
TEX = {
    'rock': lambda x, y, s: (lambda v: 0 if v < .3 else 1 if v < .72 else 2)(H(x // 2, y // 2, s) * .65 + H(x, y, s + 1) * .35),
    'brick': lambda x, y, s: 0 if y % 2 == 0 or (x + (y // 2) % 2 * 2) % 4 == 0 else 2 if H(x, y, s) < .18 else 1,
    'block': lambda x, y, s: 0 if y % 3 == 0 or (x + (y // 3) % 2 * 3) % 6 == 0 else 1 + (H(x // 6, y // 3, s) < .3),
    'plank': lambda x, y, s: 0 if x % 3 == 0 else 2 if H(x // 3, y, s) < .12 else 1,
    'bark': lambda x, y, s: 0 if (x + (y // 3)) % 3 == 0 and H(x, y, s) < .7 else 2 if H(x, y, s) < .1 else 1,
    'ice': lambda x, y, s: 2 if (x - y) % 6 == 0 else 0 if (x + y) % 7 == 0 and H(x, y, s) < .6 else 1,
    'comb': lambda x, y, s: (lambda r, q: 0 if (r == 0 and q in (1, 2)) or (r != 0 and q == 0) else 2 if (r == 1 and q == 1) else 1)(y % 4, (x + (y // 4) % 2 * 2) % 4),
    'scale': lambda x, y, s: 0 if y % 2 == 1 and (x + (y // 2) % 2) % 2 == 0 else 1,
    'smooth': lambda x, y, s: 1,
    'facet': lambda x, y, s: 2 if (x + y // 2) % 4 == 0 else 0 if (x - y) % 5 == 0 else 1,
    'cobble': lambda x, y, s: 0 if H(x // 2 + y % 2, y // 2, s) < .25 or (x + y) % 5 == 0 and H(x, y, s) < .5 else 1 + (H(x, y, s) < .2),
}


class C:
    def __init__(s, t):
        s.t = t                       # the frame's phase, 0..1
        s.g = [[None] * 16 for _ in range(16)]
        s.hole = set()

    def p(s, x, y, c):
        x, y = int(math.floor(x + .5)) if isinstance(x, float) else x, int(math.floor(y + .5)) if isinstance(y, float) else y
        if 0 <= x < 16 and 0 <= y < 16 and c:
            s.g[y][x] = c

    def at(s, x, y):
        return s.g[y][x] if 0 <= x < 16 and 0 <= y < 16 else None

    def mat(s, M, pal, tex='rock', seed=0, rim=True):
        """fill a shape in a material: its texture, lit from the top left, shadowed where it meets the way in"""
        for x, y in M:
            v = TEX[tex](x, y, seed)
            if rim:
                if (x, y - 1) not in M: v += 1
                elif (x - 1, y) not in M and H(x, y, seed + 5) < .5: v += 1
                if (x + 1, y) not in M or ((x, y + 1) not in M and y < 15): v -= 1
                if any(q in s.hole for q in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1))): v -= 1
            s.p(x, y, pal[max(0, min(len(pal) - 1, v))])

    def flat(s, M, c):
        for x, y in M: s.p(x, y, c)

    def void(s, M, lip=True):
        """the way in: black, its upper edge a breath lighter"""
        s.hole |= M
        for x, y in M:
            s.p(x, y, DEEP if lip and ((x, y - 1) not in M or (x - 1, y) not in M or (x + 1, y) not in M) and y < 14 else VOID)

    def glow(s, pts, c):
        for x, y in pts: s.p(x, y, c)

    def blink(s, k=0, n=2):
        """on for most frames, off for one: eyes blinking, a flame guttering"""
        return int(s.t * 12 + k) % 12 >= n

    def done(s):
        g = s.g
        add = [(x, y) for x, y in ALL if g[y][x] is None and any(0 <= nx < 16 and 0 <= ny < 16 and g[ny][nx] not in (None, OUT) for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))]
        for x, y in add: g[y][x] = OUT
        return g


def wave(t, k=0.0, a=1.0):
    return a * math.sin((t + k) * math.tau)


def step(t, n):
    return int(t * n) % n


# ================================================================ the dungeons' gateways
def d_forge(c):          # The Drowned Forge: a basalt cave, lava in its cracks, a chimney smoking, water dripping in
    t = c.t
    c.mat(box(10, 0, 12, 4), ['#2a2830', '#46444e', '#5e5c68', '#7e7c8a'], 'brick', 3)
    c.hole = arch(8, 6, 3.5)
    c.mat(ell(8, 16, 7.4, 14, .5, 1) - c.hole, ['#24242c', '#3a3a46', '#56566a', '#7a7a90'], 'rock', 1)
    c.void(c.hole)
    hot = '#ffc94a' if step(t, 3) == 0 else '#ff7a1a'
    for x, y in ((2, 11), (3, 12), (3, 13), (13, 10), (12, 11), (12, 12), (5, 4), (6, 4)): c.p(x, y, hot if (x + y) % 2 else '#c03a10')
    c.p(11, -1 + 0, None); c.p(11 - (step(t, 3) == 2), max(0, 1 - step(t, 3)), '#9a96a8')        # smoke
    c.p(6 + step(t, 3), 6 + step(t, 3) * 2, '#3a8ad8')                                            # a drip
    c.glow([(7, 15), (8, 15)], '#3a1206')


def d_chapel(c):         # The Sunken Chapel: a pointed church door under a gable, a rose window, kelp swaying
    t = c.t
    body = box(2, 5, 13, 15) | tri(8, 0, 2, 13, 5)
    c.hole = arch(8, 6, 3, point=.6)
    c.mat(body - c.hole, ['#2e4248', '#4a6670', '#7894a0', '#b0ccd2'], 'block', 2)
    c.void(c.hole)
    c.glow([(7, 2), (8, 2), (7, 3), (8, 3)], '#ff8fbf'); c.p(7, 2, '#cfffff'); c.p(8, 3, '#3befff')
    for bx, k in ((1, 0), (14, .5)):
        for y in range(9, 16):
            c.p(bx + round(wave(t, k + y * .12, .7)), y, '#2e8a4a' if y % 2 else '#4ab060')
    c.p(5 + step(t, 3) * 3, 15, '#1e5078')


def d_heart(c):          # The Heart of Godfall: ribs arched over a living mound, a heartbeat deep inside
    t = c.t
    beat = step(t, 3) == 0
    c.hole = arch(8, 6, 3)
    c.mat(ell(8, 16, 7.2, 12, .4, 4) - c.hole, ['#4a0a18', '#7a1428', '#a8283c', '#e05a64'] if beat else ['#40081a', '#6a1226', '#92223a', '#c8485a'], 'rock', 4)
    bone = arch(8, 3, 5.4) - arch(8, 5.2, 3.4) - c.hole
    for x, y in bone:
        a = math.atan2(y + .5 - 8.6, x + .5 - 8)
        c.p(x, y, '#5a1020' if (y > 8 and y % 2 == 0) or (y <= 8 and int(a * 4) % 2 and abs(x + .5 - 8) > 1) else '#ede6d2' if (x, y - 1) not in bone else '#c8c0b0')
    for y in range(0, 3): c.p(7, y, '#c8c0b0'); c.p(8, y, '#ede6d2' if y % 2 else '#a8792a')
    c.void(c.hole)
    c.glow([(7, 14), (8, 14), (7, 15), (8, 15)] if beat else [(7, 15), (8, 15)], '#7a0a1a' if beat else '#4a0610')


def d_throne(c):         # The Throne of Solkhar: marble pillars, a crown over the door, a red carpet into the dark
    t = c.t
    marble = ['#6e6880', '#aaa4ba', '#d6d0e2', '#fffaff']
    c.hole = arch(8, 6, 3)
    c.mat(box(4, 4, 11, 15) - c.hole, ['#3a3448', '#544c66', '#6e6684', '#8a82a0'], 'block', 5)
    for x0 in (1, 12): c.mat(box(x0, 4, x0 + 2, 15), marble, 'smooth', 6)
    c.mat(box(1, 3, 14, 4), ['#8a5a14', '#c8901e', '#f2c14e', '#fff0a0'], 'smooth', 7)
    crown = {(5, 2), (6, 2), (7, 2), (8, 2), (9, 2), (10, 2), (5, 1), (7, 1), (8, 1), (10, 1), (5, 0), (7, 0), (8, 0), (10, 0)}
    c.mat(crown, ['#a8792a', '#f2c14e', '#ffe680', '#ffffff'], 'smooth', 8)
    c.p(7 + step(t, 3) % 2, 1, '#ff4a5a')
    c.void(c.hole)
    for x in range(5, 11): c.p(x, 15, '#a01428' if x in (5, 10) else '#d8283c')


def d_scriptorium(c):    # The Frozen Scriptorium: an arch of stacked books, snow on top, icicles in the doorway
    t = c.t
    c.hole = arch(8, 6, 3.5)
    outer = arch(8, 2, 6.5)
    cols = [('#6a0a1a', '#b02a3a'), ('#1e3a78', '#3a6ac0'), ('#2a5a2a', '#4a904a'), ('#6a4a1a', '#a87a3a'), ('#3a1a6a', '#7040b0')]
    for x, y in outer - c.hole:
        a = math.atan2(y + .5 - 8.5, x + .5 - 8)
        k = int((a + math.pi) / (math.pi / 9)) if y < 9 else (y // 2) + (x > 8)
        d, l = cols[k % 5]
        c.p(x, y, l if (x + y) % 4 else d)
    for x, y in outer:
        if (x, y - 1) not in outer and y < 9: c.p(x, y, '#f4fbff'); c.p(x, y + 1, '#cfe8f4')
    c.void(c.hole)
    for k, x in enumerate((6, 8, 10)):
        top = min(y for (xx, y) in c.hole if xx == x)
        for d in range(1 + (k + step(t, 3)) % 2 + (k == 1)): c.p(x, top + d, '#cfffff' if d == 0 else '#8ad8f0')


def d_crypt(c):          # The Sunken Crypt: a mossy tomb slab, a skull over a square door, green eyes in the dark
    t = c.t
    slab = box(3, 6, 12, 15) | ell(8, 6.5, 5, 4)
    c.hole = box(5, 8, 10, 15)
    c.mat(slab - c.hole, ['#3a4038', '#566052', '#7a8672', '#a2ae98'], 'block', 9)
    for x, y in slab - c.hole:
        if H(x, y, 31) < .2 and y > 9: c.p(x, y, '#3a6a2a')
    for x, y in ((7, 4), (8, 4), (7, 5), (8, 5)): c.p(x, y, '#ede6d2')
    c.p(7, 5, '#141014'); c.p(8, 5, '#141014')
    c.void(c.hole)
    if c.blink(0, 3): c.glow([(6, 11), (9, 11)], '#7affa8')
    for x in (2, 4, 11, 13): c.p(x, 15, '#4a8034')


def d_ember(c):          # The Emberforge Depths: an iron-framed shaft in red rock, lava running down, a furnace glow
    t = c.t
    c.hole = box(5, 7, 10, 15)
    c.mat(ell(8, 16, 7.5, 13, .5, 11) - c.hole, ['#2a1612', '#48261c', '#6a3a28', '#8e5a3a'], 'rock', 11)
    iron = ['#2e2c38', '#4a4858', '#6e6c80', '#9a98ae']
    c.mat(box(4, 6, 4, 15) | box(11, 6, 11, 15) | box(4, 5, 11, 6), iron, 'smooth', 12, rim=False)
    for x, y in ((4, 8), (11, 8), (4, 12), (11, 12), (6, 5), (9, 5)): c.p(x, y, '#9a98ae')
    for k, x in enumerate((2, 13)):
        y0 = 5 + (step(t, 3) + k) % 3
        for y in range(y0, 16, 3): c.p(x, y, '#ffc94a'); c.p(x, y + 1, '#f2641a')
    c.void(c.hole)
    f = step(t, 3)
    c.glow([(x, 15) for x in range(5, 11)], '#5a1406')
    c.glow([(6 + f, 14), (8 + f % 2, 14)], '#8c2a12')


def d_hive(c):           # The Honeyed Hollow: a honeycomb dome, honey dripping off its lip, bees about
    t = c.t
    c.hole = arch(8, 7, 3)
    c.mat(ell(8, 15.5, 7.2, 13.5, .2, 13) - c.hole, ['#7a4a0a', '#c0841a', '#f0b42e', '#ffe27a'], 'comb', 13)
    c.void(c.hole)
    for k, x in enumerate((6, 9)):
        d = (step(t, 3) + k) % 3
        top = min(y for (xx, y) in c.hole if xx == x)
        for j in range(d + 1): c.p(x, top + j, '#ffc93a')
    for k in range(2):
        a = (t + k / 2) * math.tau
        x, y = 8 + math.cos(a) * 6.5, 3 + math.sin(a) * 2
        c.p(x, y, '#ffe27a'); c.p(x + 1, y, '#2a1a0a')


def d_theatre(c):        # The Gilded Marionette Theatre: red curtains drawn back from a black stage, a mask above
    t = c.t
    gold = ['#8a5a14', '#c8901e', '#f2c14e', '#fff0a0']
    c.mat(box(1, 2, 14, 15) - box(2, 3, 13, 15), gold, 'smooth', 14, rim=False)
    c.hole = box(2, 5, 13, 15)
    c.void(c.hole)
    red = ['#5a0a14', '#9a1428', '#d0283c', '#ff6070']
    for x, y in box(2, 3, 13, 15):
        if y <= 4:
            c.p(x, y, red[2] if (x + y) % 3 else red[1])
            continue
        w = 2 + max(0, (y - 10)) * .5 + (1 if y < 8 else 0)
        if x <= 1 + w or x >= 14 - w:
            c.p(x, y, red[1 + ((x + (y > 9)) % 2)] if x not in (2, 13) else red[0])
    for x in range(2, 14):
        if (x + step(t, 3)) % 2 == 0: c.p(x, 5, '#f2c14e')
    c.mat({(6, 0), (7, 0), (8, 0), (9, 0), (6, 1), (7, 1), (8, 1), (9, 1)}, ['#c8c0b0', '#ede6d2', '#ffffff', '#ffffff'], 'smooth', 15)
    c.p(6, 0, '#141014'); c.p(9, 0, '#141014'); c.p(7, 1, '#a01428'); c.p(8, 1, '#a01428')


def d_spire(c):          # The Prism Lighthouse: a cluster of prisms round a dark mouth, a glint running along them
    t = c.t
    pal = ['#2a5a8a', '#4aa0d0', '#9ae8ff', '#ffffff']
    shards = tri(8, 0, 5, 11, 7) | tri(3, 3, 1, 6, 15) | tri(13, 4, 10, 14, 15) | tri(5, 6, 3, 8, 15) | tri(11, 6, 8, 13, 15)
    c.hole = arch(8, 8, 3)
    c.mat(shards - c.hole, pal, 'facet', 16)
    for x, y in shards - c.hole:
        if (x - y) % 7 == 0: c.p(x, y, '#ff9ae0')
    c.void(c.hole)
    k = step(t, 4) if True else 0
    for x, y in ((8, 1), (3, 5), (13, 6), (8, 3)):
        pass
    gx, gy = [(8, 1), (3, 5), (13, 6), (8, 4)][int(t * 4) % 4]
    c.p(gx, gy, '#ffffff'); c.p(gx + 1, gy, '#fffde0')
    if c.blink(0, 4): c.p(8, 0, '#fff6c8')


def d_dream(c):          # The Sleeper's Dream: a bank of cloud round a dark doorway, stars twinkling, a Z drifting up
    t = c.t
    cloud = ell(4, 11, 4, 4) | ell(12, 11, 4, 4) | ell(8, 7.5, 5, 5) | ell(3, 14, 3, 2.5) | ell(13, 14, 3, 2.5) | box(2, 12, 13, 15)
    c.hole = arch(8, 6, 3)
    c.mat(cloud - c.hole, ['#5a4a8e', '#8a7ac6', '#c4bcf0', '#ffffff'], 'smooth', 17)
    c.void(c.hole)
    for k, (x, y) in enumerate(((2, 4), (14, 3), (12, 1), (3, 1))):
        if (k + step(t, 3)) % 3: c.p(x, y, '#ffe680')
    zy = 4 - step(t, 3)
    for x, y in ((12, zy), (13, zy), (13, zy + 1), (12, zy + 2), (13, zy + 2)): c.p(x, y, '#f4edff')


def d_frostveil(c):      # Frostveil Hollows: icy rock under a cap of snow, icicles hanging over a rough mouth
    t = c.t
    c.hole = arch(8, 6, 3.5, jag=1.2, s=3)
    rock = ell(8, 16, 7.4, 14, .5, 18)
    c.mat(rock - c.hole, ['#24405e', '#3e6a92', '#76acd2', '#d6f2ff'], 'ice', 18)
    for x, y in rock:
        if (x, y - 1) not in rock or (x, y - 2) not in rock and y < 7: c.p(x, y, '#f4fbff' if (x, y - 1) not in rock else '#cfe8f4')
    c.void(c.hole)
    for k, x in enumerate((6, 8, 9, 10)):
        col = [y for (xx, y) in c.hole if xx == x]
        if col:
            for d in range(1 + (k * 2 + step(t, 3)) % 3 // 2 + (k == 1)): c.p(x, min(col) + d, '#cfffff' if d == 0 else '#8ad8f0')
    c.p(2 + step(t, 3) * 2, 1 + step(t, 3), '#ffffff')


def d_mirerot(c):        # Mirerot Grotto: a mossy mound tangled in roots, murky water at its foot, eyes in the dark
    t = c.t
    c.hole = arch(8, 6, 3.5, jag=.8, s=4)
    c.mat(ell(8, 16, 7.4, 13.5, .6, 19) - c.hole, ['#1a3216', '#2a5224', '#467a32', '#76aa46'], 'rock', 19)
    for side in (-1, 1):
        for a in range(10, 170, 12):
            r = 5.2 + .6 * math.sin(a * .1)
            x, y = 8 + math.cos(math.radians(a)) * r * side, 12 - math.sin(math.radians(a)) * (r + 1.5)
            if (round(x), round(y)) not in c.hole: c.p(x, y, '#5a3a20' if a % 24 else '#7a5430')
    c.void(c.hole)
    for x in range(1, 15):
        if (x, 15) not in c.hole: c.p(x, 15, '#3a4a2a' if (x + step(t, 3)) % 3 else '#6a8a4a')
    if c.blink(4, 3): c.glow([(7, 10), (9, 10)], '#e8ff5a')
    for x, k in ((4, 0), (11, 1)):
        for y in range(5, 8 + (step(t, 3) + k) % 2): c.p(x, y, '#4a8a34')


def d_astral(c):         # The Astral Observatory: a brass dome over a stone hall, a telescope out of its slit, stars
    t = c.t
    c.hole = arch(8, 8, 3)
    c.mat(box(2, 7, 13, 15) - c.hole, ['#20283e', '#34405e', '#4e5e86', '#7486b0'], 'block', 20)
    dome = ell(8, 7.5, 6, 5.5) - box(0, 7, 15, 15)
    c.mat(dome, ['#6a4a1a', '#a8792a', '#e0b050', '#fff0a0'], 'scale', 21)
    for y in range(2, 7): c.p(8, y, '#141014')
    for k in range(4): c.p(9 + k, 4 - k, '#c8c0d8' if k < 3 else '#ffffff')
    c.void(c.hole)
    for k, (x, y) in enumerate(((1, 1), (14, 2), (3, 4), (13, 6))):
        if (k + step(t, 3)) % 3: c.p(x, y, '#cfe0ff' if k % 2 else '#ffe680')


def d_sandscour(c):      # Sandscour Tomb: a stepped pyramid of sandstone, an eye over a sloped door, sand trickling
    t = c.t
    pyr = set()
    for k in range(5):
        pyr |= box(1 + k * 1, 15 - k * 3 - 2, 14 - k * 1, 15 - k * 3)
    pyr -= box(0, 0, 15, 0)
    c.hole = {(x, y) for x, y in ALL if 7 <= y <= 15 and 6 - (y - 7) * .25 <= x + .5 - 0 <= 10 + (y - 7) * .25}
    c.mat(pyr - c.hole, ['#7a5a2e', '#b8904e', '#dcbc7c', '#fff0c0'], 'block', 22)
    c.mat(box(5, 6, 10, 6), ['#7a5a2e', '#a07a3e', '#c09a5a', '#e0c080'], 'smooth', 23)
    c.p(7, 6, '#1e5078'); c.p(8, 6, '#3a8ad8')
    c.void(c.hole)
    for x in range(1, 15):
        if (x, 15) in c.hole and x in (6, 10): c.p(x, 15, '#dcbc7c')
    c.p(3 + step(t, 3), 11 + step(t, 3), '#fff0c0')


def d_keep(c):           # The Crimson Keep: two towers of red brick, battlements, a gate with its portcullis raised
    t = c.t
    brick = ['#4a0e14', '#7a1a20', '#a83a3a', '#d86a5a']
    body = box(1, 3, 4, 15) | box(11, 3, 14, 15) | box(4, 5, 11, 15)
    for x in (1, 3, 11, 13): body |= {(x, 2), (x + 1 if x in (3, 13) else x, 2)}
    for x in (5, 7, 9): body |= {(x, 4), (x + 1, 4)}
    c.hole = arch(8, 7, 3)
    c.mat(body - c.hole, brick, 'brick', 24)
    c.void(c.hole)
    top = 7 + step(t, 3) % 2
    for x in range(6, 11, 2): c.p(x, top + 1, '#8e8aa6'); c.p(x, top + 2, '#6e6a86')
    c.p(2, 6, '#141014'); c.p(13, 6, '#141014')
    for x in (3, 12): c.p(x, 9, '#ffc94a' if c.blink(x, 3) else '#f2641a'); c.p(x, 10, '#5a3a20')


def d_hollowmoon(c):     # Hollowmoon Carnival: a striped tent, its flap open on the dark, a moon pennant on the pole
    t = c.t
    tent = tri(8, 2, 1, 14, 13) | box(1, 13, 14, 15)
    c.hole = {(x, y) for x, y in ALL if 6 <= y <= 15 and abs(x + .5 - 8) <= (y - 5) * .38}
    for x, y in tent - c.hole:
        a = math.atan2(x + .5 - 8, y + .5 - 2)
        stripe = int((a + 1.2) / .24) % 2
        c.p(x, y, ('#e07a1a' if stripe else '#5a2a8a') if (x, y - 1) in tent else ('#ffb050' if stripe else '#8a4ac0'))
    for x, y in c.hole:
        for q in ((x - 1, y), (x + 1, y)):
            if q not in c.hole and q in tent: c.p(*q, '#fff0c8')
    c.void(c.hole)
    for y in range(0, 3): c.p(8, y, '#c8c0b0')
    w = step(t, 3)
    c.mat({(9, 0), (10, 0), (11, 0), (9, 1), (10, 1)} | ({(12, 0)} if w != 1 else {(11, 1)}), ['#a8792a', '#f2c14e', '#ffe680', '#ffffff'], 'smooth', 25)


# ---- the rf dungeons'
def r_crypt(c):          # The Sealed Crypt: a mausoleum, a pediment over a narrow door, soul lanterns either side
    t = c.t
    body = box(3, 5, 12, 15) | tri(8, 1, 3, 12, 5)
    c.hole = box(6, 8, 9, 15)
    c.mat(body - c.hole, ['#383444', '#565066', '#7a748c', '#a6a0b8'], 'block', 26)
    for x in (4, 11):
        for y in range(6, 16): c.p(x, y, '#a6a0b8' if y % 3 else '#7a748c')
    c.void(c.hole)
    for x in (1, 14):
        for y in range(10, 16): c.p(x, y, '#3a3640')
        c.p(x, 9, '#2a2630'); c.p(x, 8, '#7affc8' if c.blink(x, 3) else '#3ac890'); c.p(x, 7, '#d0fff0' if step(t, 4) % 2 else '#7affc8')


def r_sewers(c):         # The Undersewers: a brick wall, a round pipe mouth, green sludge running out of it
    t = c.t
    wall = box(1, 3, 14, 15)
    c.hole = ell(8, 10.5, 4.5, 4.5) & box(0, 0, 15, 15)
    rim = ell(8, 10.5, 5.6, 5.6) - c.hole
    c.mat(wall - c.hole - rim, ['#3a2e2a', '#5a4a40', '#7a6656', '#9a846e'], 'brick', 27)
    c.mat(rim, ['#4a4a52', '#6e6e7a', '#9a9aa6', '#c8c8d2'], 'smooth', 28)
    c.void(c.hole)
    for x, y in c.hole:
        if y >= 13: c.p(x, y, '#5a8a1a' if (x + step(t, 4)) % 3 else '#b8ff3a')
    for k in (0, 1):
        c.p(4 + k * 7, 15, '#7aa82a')


def r_mire(c):           # Mirewood Hollow: a hollow trunk on flared roots, moss on its top, a lantern swinging
    t = c.t
    trunk = box(3, 3, 12, 15) | {(2, 14), (2, 15), (1, 15), (13, 14), (13, 15), (14, 15)} | box(1, 2, 3, 3) | box(12, 1, 14, 2)
    c.hole = ell(8, 11.5, 2.8, 4.5) | box(6, 12, 9, 15)
    c.mat(trunk - c.hole, ['#24160c', '#42301e', '#62482e', '#866a48'], 'bark', 29)
    for x in range(3, 13): c.p(x, 3, '#4a8034' if x % 3 else '#76aa46'); c.p(x, 4, '#2a5224') if H(x, 4, 3) < .5 else None
    c.void(c.hole)
    sw = round(wave(c.t, 0, 1))
    c.p(14, 3, '#5a5866'); c.p(14 + sw, 4, '#5a5866'); c.p(14 + sw, 5, '#a8ff6a' if c.blink(2, 2) else '#6ac03a')


def r_forge(c):          # The Burned Forge-City: an arch of charred cobbles over a channel of running lava
    t = c.t
    c.hole = arch(8, 6, 3.5)
    c.mat(arch(8, 2, 6.8) - c.hole, ['#1a1414', '#2e2622', '#4a3c34', '#6a5a4a'], 'cobble', 30)
    for x, y in arch(8, 2, 6.8) - c.hole:
        if H(x, y, 77) < .1: c.p(x, y, '#ff8a2a' if step(t, 3) != (x % 3) else '#ffc94a')
    c.void(c.hole)
    for x in range(1, 15):
        c.p(x, 15, '#ffc94a' if (x + step(t, 4)) % 4 == 0 else '#f2641a' if x % 2 else '#c03a10')


def r_glade(c):          # The Moonlit Glade: two silver birches bowed into an arch, a crescent moon, moonflowers
    t = c.t
    trunks = set()
    for y in range(4, 16):
        bend = (15 - y) * .18
        trunks |= {(round(3 + bend), y), (round(4 + bend), y), (round(12 - bend), y), (round(11 - bend), y)}
    canopy = ell(8, 4, 7, 3.5)
    c.hole = arch(8, 6, 3.2) - trunks
    c.mat(canopy - c.hole, ['#1a2a4a', '#2a4a6a', '#4a7a9a', '#b8d0ff'], 'rock', 31)
    for x, y in trunks: c.p(x, y, '#e6ecf6' if y % 3 else '#5a6070')
    c.void(c.hole)
    c.p(7, 1, '#fffde0'); c.p(8, 1, '#fffde0'); c.p(8, 2, '#fffde0'); c.p(7, 2, '#2a4a6a')
    for k, x in enumerate((1, 14, 2)):
        c.p(x, 15, '#ffffff' if (k + step(t, 3)) % 3 else '#b8d0ff')


def r_unmelting(c):      # The Unmelting: a block of glacier ice, a glint sweeping across it, black water inside
    t = c.t
    body = box(2, 3, 13, 15) | box(3, 2, 12, 2) | {(1, 15), (14, 15)}
    c.hole = arch(8, 6, 3.4)
    c.mat(body - c.hole, ['#3a7aa8', '#6ab8e0', '#a8e4ff', '#f0ffff'], 'ice', 32)
    g = int(t * 4) % 4 * 3
    for x, y in body - c.hole:
        if x + y - 2 in (g, g + 1): c.p(x, y, '#ffffff')
    c.void(c.hole)
    for x, y in c.hole:
        if y == 14: c.p(x, y, '#0e2a3a' if (x + step(t, 4)) % 3 else '#2a5a7a')


def r_crater(c):         # The Impact Crater: a low ring of scorched rock, shards of star-glass glowing in it
    t = c.t
    c.hole = arch(8, 8, 4)
    c.mat(ell(8, 16, 7.6, 10, .5, 33) - c.hole, ['#241c20', '#3c3036', '#56464e', '#76646e'], 'rock', 33)
    on = '#f0c8ff' if step(t, 3) == 0 else '#e0a0ff'
    for x0, h, k in ((2, 4, 0), (4, 3, 1), (12, 5, 0), (13, 3, 1), (10, 2, 1)):
        for d in range(h): c.p(x0, 11 - d - (x0 > 8) * 2 + (h < 3) * 2, on if (d + k) % 2 else '#8a4ac0')
    c.void(c.hole)
    c.p(7 + step(t, 4) % 2, 3 - step(t, 4) % 2, '#76646e')


def r_temple(c):         # Temple of the Twin Moons: an arch half light marble and gold, half dark marble and violet
    t = c.t
    c.hole = arch(8, 6, 3)
    outer = arch(8, 3, 6.5)
    L = {(x, y) for x, y in outer if x < 8}
    c.mat(L - c.hole, ['#a8a2b0', '#d6d0dc', '#f4f0f8', '#ffffff'], 'block', 34)
    c.mat((outer - L) - c.hole, ['#1e1a2e', '#342e4a', '#4e4668', '#6e6690'], 'block', 35)
    for y in range(4, 16): c.p(1, y, '#f2c14e') if (1, y) in outer else None; c.p(14, y, '#8a4ac0') if (14, y) in outer else None
    a, b = step(t, 3) == 0, step(t, 3) == 1
    c.flat(ell(4.5, 1.5, 1.6, 1.6), '#fff0a0' if a else '#f2c14e')
    c.flat(ell(11.5, 1.5, 1.6, 1.6), '#d8b8ff' if b else '#8a4ac0')
    c.void(c.hole)


def r_rift(c):           # The Rift Beneath: a floating shard of obsidian torn open, magenta crystal grown on it
    t = c.t
    bob = 1 if step(t, 4) in (1, 2) else 0
    rock = {(x, y + bob) for x, y in (ell(8, 7, 6.5, 6.5, .6, 36) | tri(8, 7, 5, 11, 14))}
    c.hole = {(x, y + bob) for x, y in ALL if 3 <= y <= 12 and abs(x + .5 - 8) <= 2.6 * math.sin((y - 2.5) / 10 * math.pi)}
    c.mat(rock - c.hole, ['#140e1e', '#241a34', '#3a2c50', '#5a4878'], 'rock', 36)
    for x, y in c.hole:
        for q in ((x - 1, y), (x + 1, y)):
            if q not in c.hole and q in rock: c.p(*q, '#ff40c0' if step(t, 4) % 2 else '#c02a90')
    for x, y in ((3, 4), (2, 5), (13, 5), (13, 6), (12, 3)): c.p(x, y + bob, '#ff8ae0' if (x + y) % 2 else '#ff40c0')
    c.void(c.hole, lip=False)
    c.p(5, 15 - bob, '#5a4878'); c.p(11, 14 + bob, '#ff40c0')


def r_chapel(c):         # The Sunken Chapel (the bay's): a round door crusted in coral and barnacles, bubbles rising
    t = c.t
    c.hole = arch(8, 6, 3.2)
    outer = arch(8, 2, 6.6)
    c.mat(outer - c.hole, ['#24384a', '#3a5a70', '#5a8298', '#8ab0c0'], 'block', 37)
    for x, y in outer - c.hole:
        r = H(x, y, 38)
        if r < .12: c.p(x, y, '#ff7a6a')
        elif r < .2: c.p(x, y, '#ffb08a')
        elif r < .26: c.p(x, y, '#ede6d2')
    c.p(3, 4, '#ff9a3a'); c.p(2, 5, '#ff9a3a'); c.p(4, 5, '#ff9a3a'); c.p(3, 6, '#ff9a3a')
    c.void(c.hole)
    for k, x in enumerate((7, 9)):
        y = 14 - ((step(t, 4) + k * 2) % 4) * 2
        c.p(x, y, '#cfffff')


def r_grove(c):          # The Sworn Grove: an old oak whose roots part into a doorway, braziers burning either side
    t = c.t
    canopy = ell(8, 4.5, 6.8, 4.2, .5, 39)
    trunk = box(4, 6, 11, 15) | {(3, 14), (3, 15), (12, 14), (12, 15), (2, 15), (13, 15)}
    c.hole = arch(8, 8, 2.6)
    c.mat(trunk - c.hole, ['#2a1a0e', '#4a3018', '#6a4a26', '#8e6a3e'], 'bark', 40)
    c.mat(canopy - c.hole, ['#5a3a10', '#a06a1a', '#e0a040', '#ffd27a'], 'rock', 41)
    c.void(c.hole)
    for x in (1, 14):
        c.p(x, 15, '#4a4858'); c.p(x, 14, '#6e6c80')
        c.p(x, 13, '#ffc060' if c.blink(x, 3) else '#f2641a'); c.p(x, 12, '#fff0a0') if step(t, 4) % 2 else None


def r_peaks(c):          # The Stormcrown Peaks: a snow-capped crag, a cave at its foot, cloud drifting, lightning
    t = c.t
    peak = tri(8, 0, 0, 15, 15) | tri(4, 4, 1, 7, 15) | tri(12, 3, 9, 15, 15)
    c.hole = arch(8, 9, 3)
    c.mat(peak - c.hole, ['#2e2c38', '#4a4858', '#6e6c80', '#9a98ae'], 'rock', 42)
    for x, y in peak:
        if y <= 3 or (y <= 5 and (x, y - 1) not in peak): c.p(x, y, '#f4fbff')
    c.void(c.hole)
    s = step(t, 4)
    for x in range(0, 16):
        if (x + s) % 5 in (0, 1) and (x, 15) not in c.hole: c.p(x, 14 + (x % 2), '#e6ecf6')
    if s == 2:
        for x, y in ((12, 0), (11, 1), (12, 2), (11, 3)): c.p(x, y, '#ffe870')


def r_pyre(c):           # Pyre Peak: a volcano's cone, lava over its rim and down its flanks, a fire on its top
    t = c.t
    cone = {(x, y) for x, y in ALL if y >= 3 and abs(x + .5 - 8) <= 2.6 + (y - 3) * .45}
    c.hole = arch(8, 9, 3)
    c.mat(cone - c.hole, ['#1a1214', '#2e2226', '#463438', '#5e4a4e'], 'rock', 43)
    s = step(t, 3)
    for x in range(6, 10): c.p(x, 3, '#ffc94a' if (x + s) % 2 else '#f2641a')
    for k, (x0, dx) in enumerate(((6, -.4), (10, .4))):
        for d in range(1, 6 + k):
            c.p(x0 + dx * d - (k == 0), 3 + d, '#ff6a3a' if (d + s) % 3 else '#ffc94a')
    c.p(7 + (s == 1), 1, '#ffc94a'); c.p(8, 2, '#ff6a3a'); c.p(7, 2, '#ffc94a')
    c.void(c.hole)
    c.glow([(7, 15), (8, 15)], '#5a1406' if s else '#7a2010')


def r_cathedral(c):      # The Burned Cathedral: a soot-black front, its rose window still burning, a red carpet
    t = c.t
    body = box(2, 5, 13, 15) | tri(8, 0, 5, 11, 5) | box(1, 7, 2, 15) | box(13, 7, 14, 15)
    c.hole = arch(8, 7, 3, point=.6)
    c.mat(body - c.hole, ['#141014', '#221c20', '#342a2e', '#4a3c3e'], 'block', 44)
    fire = '#ffc94a' if step(t, 3) == 0 else '#ff9a5a'
    for x, y in ell(8, 4.5, 1.6, 1.6): c.p(x, y, fire if (x + y + step(t, 3)) % 2 else '#c03a10')
    c.void(c.hole)
    for x in range(6, 10): c.p(x, 15, '#8a0a1a' if x in (6, 9) else '#c8283c')
    c.p(3 + step(t, 3), 3 - step(t, 3) % 2, '#ff9a5a')


def r_oasis(c):          # The Buried Oasis: a sandstone doorway half sunk in a dune, a palm leaning, water dripping
    t = c.t
    dune = ell(8, 17, 8.5, 6, .4, 45)
    door = box(4, 5, 11, 15)
    c.hole = box(6, 7, 9, 15)
    c.mat(door - c.hole, ['#8a6a3a', '#c09a5a', '#e0c080', '#fff0c0'], 'block', 46)
    c.mat(dune - door, ['#b88a4a', '#d8ae66', '#f0cc88', '#fff0c0'], 'smooth', 47)
    for x in range(12, 15): c.p(x, 4 - (x == 14), '#2a8a3a')
    for y in range(4, 10): c.p(12 + (y > 6), y, '#7a5430')
    c.p(11, 3, '#4ab060'); c.p(13, 3, '#4ab060'); c.p(14, 4, '#4ab060')
    c.void(c.hole)
    c.p(7 + (step(t, 4) > 1), 8 + step(t, 4) * 2, '#3ad8d0')


def r_clocktower(c):     # The Clocktower Court: a tall wooden tower in brass, a clock whose hand turns, a door
    t = c.t
    tower = box(3, 1, 12, 15) | box(2, 0, 13, 1)
    c.hole = arch(8, 9, 3)
    c.mat(tower - c.hole, ['#2a1a10', '#4a3020', '#6a4a30', '#8a6a48'], 'plank', 48)
    for x in range(2, 14): c.p(x, 1, '#f2c14e' if x % 2 else '#a8792a')
    face = ell(8, 5, 2.8, 2.8)
    c.flat(ring(8, 5, 2.2, 3.0), '#c8901e'); c.flat(ell(8, 5, 2.2, 2.2), '#fff6d8')
    a = t * math.tau - math.pi / 2
    c.p(7.5, 4.5, '#141014'); c.p(7.5 + math.cos(a) * 1.4, 4.5 + math.sin(a) * 1.4, '#141014')
    c.void(c.hole)


def r_mirrors(c):        # The Hall of Mirrors: an ornate silver frame on feet, its glass gone dark, a glint sweeping it
    t = c.t
    frame = ell(8, 7.5, 6.2, 7.3)
    c.hole = ell(8, 7.5, 4.3, 5.6)
    c.mat(frame - c.hole, ['#5a6070', '#9aa2b4', '#d8e0f0', '#ffffff'], 'smooth', 49)
    for x, y in ((8, 0), (2, 7), (13, 7), (7, 0)): c.p(x, y, '#ffffff')
    c.void(c.hole, lip=False)
    g = int(t * 4) % 4 * 3 - 2
    for x, y in c.hole:
        if x - y == g + 2 - 8 or x - y == g + 3 - 8: c.p(x, y, '#1a2230')
    for x in (4, 11): c.p(x, 15, '#9aa2b4')


def r_monastery(c):      # The Upturned Monastery: a temple gate hanging upside down, its roof below, bells pointing up
    t = c.t
    c.hole = box(5, 3, 10, 11)
    beam = box(2, 1, 13, 2)
    pillars = box(3, 3, 4, 11) | box(11, 3, 12, 11)
    roof = box(1, 12, 14, 13) | box(3, 14, 12, 14) | {(0, 11), (15, 11)}
    c.mat(beam, ['#4a4858', '#6e6c80', '#9a98ae', '#c8c8d2'], 'block', 50)
    c.mat(pillars, ['#6a1414', '#9a2020', '#c83a2a', '#e86a4a'], 'smooth', 51)
    c.mat(roof, ['#143a3a', '#1e5a5a', '#2e8080', '#5ab0a8'], 'scale', 52)
    c.void(c.hole)
    for x in (6, 9):
        c.p(x, 0, '#f2c14e'); c.p(x + (step(t, 3) == 1) - (step(t, 3) == 2), 0, '#f2c14e')
    for x in range(4, 12): c.p(x, 15, '#e6ecf6') if (x + step(t, 4)) % 4 else None


def r_sanctum(c):        # The Sundial Sanctum: a white-and-gold arch on two columns, a sun turning its rays above
    t = c.t
    c.hole = arch(8, 7, 3.2)
    outer = arch(8, 4, 6.5)
    c.mat(outer - c.hole, ['#a89070', '#d8c4a0', '#f4e8cc', '#ffffff'], 'block', 53)
    for x in (2, 13):
        for y in range(8, 16): c.p(x, y, '#f2c14e' if y % 4 == 0 else '#fff0c8')
    c.flat(ell(8, 2.5, 1.8, 1.8), '#ffe090'); c.p(8, 2, '#ffffff')
    for k in range(4):
        a = (k / 4 + t / 4) * math.tau
        c.p(7.5 + math.cos(a) * 3, 2 + math.sin(a) * 2.2, '#ffc94a')
    c.void(c.hole)


def r_atlas(c):          # The Celestial Atlas: a disc of open night held in a turning gold ring, stars inside it
    t = c.t
    c.hole = ell(8, 7.5, 5.6, 6.5)
    c.mat(ring(8, 7.5, 5.6, 6.6) & ell(8, 7.5, 6.6, 7.4), ['#2a3a6a', '#4a5a9a', '#8a9ae0', '#cfdcff'], 'smooth', 54)
    c.void(c.hole, lip=False)
    for k, (x, y) in enumerate(((6, 4), (10, 6), (7, 10), (9, 3), (5, 8), (11, 10))):
        if (k + step(t, 4)) % 3: c.p(x, y, '#9ab8ff' if k % 2 else '#ffffff')
    for k in range(12):
        a = k / 12 * math.tau
        x, y = 8 + math.cos(a) * 7, 7.5 + math.sin(a) * 2.2
        if math.sin(a) > -.2: c.p(x - .5, y, '#f2c14e' if (k + step(t, 4) * 3) % 12 > 1 else '#ffffff')
    c.mat(box(6, 14, 9, 15), ['#6a4a1a', '#a8792a', '#e0b050', '#fff0a0'], 'smooth', 55)


def r_keep(c):           # Duskmourne Keep: a dark gothic gate between two thin spires, red candles on its ledges
    t = c.t
    body = box(3, 5, 12, 15) | box(1, 3, 3, 15) | box(12, 3, 14, 15) | tri(2, 0, 1, 3, 3) | tri(13, 0, 12, 14, 3) | tri(8, 1, 5, 11, 5)
    c.hole = arch(8, 6, 3.2, point=.6)
    c.mat(body - c.hole, ['#1c1a24', '#2e2a38', '#444052', '#625c74'], 'block', 56)
    c.void(c.hole)
    for k, (x, y) in enumerate(((2, 8), (13, 8), (2, 12), (13, 12))):
        c.p(x, y, '#e8e0d0'); c.p(x, y - 1, '#ff4a3a' if c.blink(k * 3, 3) else '#ffc040')


def r_patch(c):          # The Hollow Patch: a great carved pumpkin, its grin the way in, candlelit eyes, vines
    t = c.t
    pump = ell(8, 9.5, 7.3, 6.3) | box(2, 13, 13, 15)
    c.hole = {(x, y) for x, y in ALL if 10 <= y <= 15 and 3 <= x <= 12 and not (y == 10 and x in (5, 8, 11)) and not (y == 11 and x in (5, 11) and False)}
    c.hole -= {(3, 10), (12, 10)}
    for x, y in pump - c.hole:
        rib = abs(x + .5 - 8) % 3 < .6 if True else False
        v = 1 + ((x, y - 1) not in pump) - ((x + 1, y) not in pump) - rib
        c.p(x, y, ['#8a3a08', '#d0681a', '#f29a3a', '#ffc070'][max(0, min(3, v))])
    c.mat(box(7, 1, 8, 3), ['#2a4a1a', '#3a6a2a', '#5a9a3a', '#7ac050'], 'smooth', 57)
    c.void(c.hole)
    eye = '#ffe27a' if c.blink(0, 2) else '#ffa040'
    for x, y in ((4, 7), (5, 7), (5, 6), (10, 7), (11, 7), (10, 6)): c.p(x, y, eye)
    c.p(9, 2, '#3a6a2a'); c.p(10, 1 + step(t, 4) % 2, '#5a9a3a')


def r_stage(c):          # The Velvet Stage: teal curtains in a gilded round proscenium, a spotlight wandering the floor
    t = c.t
    outer = arch(8, 1, 7)
    gold = ['#8a5a14', '#c8901e', '#f2c14e', '#fff0a0']
    c.mat(outer - arch(8, 2, 6), gold, 'smooth', 58, rim=False)
    c.hole = arch(8, 2, 6)
    c.void(c.hole)
    teal = ['#0e3a3a', '#1a6060', '#2a8a86', '#5ac0b4']
    for x, y in c.hole:
        w = 1.5 + max(0, y - 7) * .35
        if x - 2 < w or 13 - x < w: c.p(x, y, teal[1 + (x + y // 3) % 2])
        elif y <= 3: c.p(x, y, teal[2] if x % 2 else teal[1])
    sx = 7 + round(wave(t, 0, 1.4))
    for x in (sx, sx + 1): c.p(x, 15, '#ffd890'); c.p(x, 14, '#4a3e28')


def r_paper(c):          # The Paper Garden: a gate of folded paper, its posts and twin lintels creased, lanterns
    t = c.t
    c.hole = box(5, 6, 10, 15)
    lint = box(0, 2, 15, 3) | box(2, 5, 13, 5)
    posts = box(3, 4, 4, 15) | box(11, 4, 12, 15)
    for x, y in lint | posts:
        fold = (x + y) % 4 < 2
        c.p(x, y, '#ffffff' if fold and (x, y - 1) not in (lint | posts) else '#e8e8ff' if fold else '#b8b8e0')
    for x in (0, 15): c.p(x, 1, '#e8e8ff')
    c.void(c.hole)
    for x in (1, 14):
        c.p(x, 6, '#9a9ac0'); c.p(x, 7, '#fff6d8' if c.blink(x, 3) else '#ffe0a0'); c.p(x, 8, '#fff6d8'); c.p(x, 9, '#c8a060')
    for x, y in ((7, 0), (8, 0), (8, 1)): c.p(x, y, '#dcdcff')


OURS = {'dungeon': d_forge, 'chapel': d_chapel, 'heart': d_heart, 'throne': d_throne, 'scriptorium': d_scriptorium,
        'crypt': d_crypt, 'ember': d_ember, 'hive': d_hive, 'theatre': d_theatre, 'spire': d_spire, 'dream': d_dream,
        'frostveil': d_frostveil, 'mirerot': d_mirerot, 'astral': d_astral, 'sandscour': d_sandscour, 'keep': d_keep,
        'hollowmoon': d_hollowmoon}
RF = {'crypt': r_crypt, 'sewers': r_sewers, 'mire': r_mire, 'forge': r_forge, 'glade': r_glade, 'unmelting': r_unmelting,
      'crater': r_crater, 'temple': r_temple, 'rift': r_rift, 'chapel': r_chapel, 'grove': r_grove, 'peaks': r_peaks,
      'pyre': r_pyre, 'cathedral': r_cathedral, 'oasis': r_oasis, 'clocktower': r_clocktower, 'mirrors': r_mirrors,
      'monastery': r_monastery, 'sanctum': r_sanctum, 'atlas': r_atlas, 'keep': r_keep, 'patch': r_patch,
      'stage': r_stage, 'paper': r_paper}


def frame(fn, f, n):
    c = C(f / n)
    fn(c)
    return c.done()


def rgba(g):
    return [[(0, 0, 0, 0) if ch is None else hex_rgba(ch) for ch in r] for r in g]


def preview(path):
    S, n = 5, 4
    cols = 9
    items = [(k, fn, 3) for k, fn in OURS.items()] + [(k, fn, 4) for k, fn in RF.items()]
    rows_n = (len(items) + cols - 1) // cols
    cw, ch = (16 * 2 + 4) * S, 20 * S
    img = [[(46, 74, 42, 255)] * (cols * cw) for _ in range(rows_n * ch)]
    for i, (k, fn, nf) in enumerate(items):
        ox, oy = (i % cols) * cw + 2 * S, (i // cols) * ch + 2 * S
        for j, f in enumerate((0, 1)):
            g = rgba(frame(fn, f, nf))
            for y in range(16):
                for x in range(16):
                    px = g[y][x]
                    if px[3]:
                        for a in range(S):
                            for b in range(S):
                                img[oy + y * S + a][ox + j * 17 * S + x * S + b] = px
    write_png(path, img)
    print('preview', path)


def apply():
    from reduce import read_png
    wj = os.path.join(ROOT, 'art', 'world', 'world.json')
    W = json.load(open(wj, encoding='utf8'))
    op = os.path.join(ROOT, 'art', 'world', 'objects.png')
    img = read_png(op)
    cols = W['objectsCols']
    if 'throne' not in W['portals']:                    # the Throne gets its own gateway: three cells after the last used
        n = len(img) // 16 * cols                       # (after the last cell anything is drawn in: a sprite's later
        k = max(i for i in range(n) if any(img[(i // cols) * 16 + y][(i % cols) * 16 + x][3] for y in range(16) for x in range(16))) + 1   # frames aren't all listed in world.json)
        need = (k + 3 + cols - 1) // cols * 16
        while len(img) < need: img.append([(0, 0, 0, 0)] * (cols * 16))
        W['portals']['throne'] = k
        json.dump(W, open(wj, 'w', encoding='utf8', newline='\n'), indent=1) if False else None
        txt = open(wj, encoding='utf8').read()
        txt = txt.replace('"hollowmoon": %d' % W['portals']['hollowmoon'], '"hollowmoon": %d,\n  "throne": %d' % (W['portals']['hollowmoon'], k), 1)
        assert '"throne"' in txt, 'world.json: could not add the throne portal'
        open(wj, 'w', encoding='utf8', newline='\n').write(txt)
    for kind, fn in OURS.items():
        base = W['portals'][kind]
        for f in range(3):
            k = base + f
            ox, oy = (k % cols) * 16, (k // cols) * 16
            g = rgba(frame(fn, f, 3))
            for y in range(16):
                img[oy + y][ox:ox + 16] = g[y]
    write_png(op, img)
    A = json.load(open(os.path.join(ROOT, 'art', 'bundle', 'realmforge', 'atlas_rf_foes.json'), encoding='utf8'))['sheets']['rf_portals']['sprites']
    rp = os.path.join(ROOT, 'art', 'bundle', 'realmforge', 'rf_portals.png')
    rimg = read_png(rp)
    for kind, fn in RF.items():
        fr = A[kind]['frames']
        for f in range(4):
            x0, y0, w, h = fr[str(f)]
            g = rgba(frame(fn, f, 4))
            for y in range(16):
                rimg[y0 + y][x0:x0 + 16] = g[y]
    write_png(rp, rimg)
    print('applied', len(OURS), 'of ours,', len(RF), 'rf')


if __name__ == '__main__':
    if '--apply' in sys.argv:
        apply()
    else:
        preview(os.path.join(ROOT, 'art', '_proto', 'cave_portals_preview.png'))
