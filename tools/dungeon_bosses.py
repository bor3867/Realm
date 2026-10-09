"""Dungeon bosses for the new dungeons.

THE DROWNED ABBOT (48x48) - The Sunken Chapel. He rang the bell as the sea came
in and kept saying mass up to his waist. He is still saying it.
THE FALLEN HEART (64x64) - The Heart of Godfall. When the god fell, its heart
kept beating inside the broken cathedral of its ribs. Every beat is a shockwave.

Rows: I0 I1 | T0 | A0 | S0 (special) | D0 D1 D2  (same as realm bosses)
"""
import math
from pixlib import blank, line, outline, rows, compose


class Cv:
    def __init__(self, n):
        self.n = n
        self.g = blank(n, n)

    def p(self, x, y, ch):
        if 0 <= x < self.n and 0 <= y < self.n:
            self.g[y][x] = ch

    def rect(self, x0, y0, x1, y1, ch):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.p(x, y, ch)

    def ell(self, cx, cy, rx, ry, ch):
        for y in range(self.n):
            for x in range(self.n):
                if ((x - cx) / max(rx, .1)) ** 2 + ((y - cy) / max(ry, .1)) ** 2 <= 1:
                    self.g[y][x] = ch

    def ln(self, x0, y0, x1, y1, ch, w=1):
        for k in range(-(w // 2), w - w // 2):
            if abs(x1 - x0) > abs(y1 - y0):
                line(self.g, x0, y0 + k, x1, y1 + k, ch)
            else:
                line(self.g, x0 + k, y0, x1 + k, y1, ch)

    def done(self, late=()):
        outline(self.g)
        for x, y, ch in late:
            self.p(x, y, ch)
        return [''.join(r) for r in self.g]


def squash(g, k):
    body = [r for r in g if r.strip('.')]
    kept = body[::-1][::k][::-1]
    return ['.' * len(g[0])] * (len(g) - len(kept)) + kept


def sp(ch, pts):
    out = []
    for x, y in pts:
        out += [(x, y, ch), (x - 1, y, ch), (x + 1, y, ch), (x, y - 1, ch), (x, y + 1, ch)]
    return out


# ================================================================ THE DROWNED ABBOT
AB = {'o': '#0E1A20', 't': '#2B4E5A', 'T': '#4E7A86', 'L': '#8AB4BE', 'r': '#5A1028', 'R': '#9A2040',
      'g': '#A8792A', 'G': '#F2C14E', 'f': '#D8D0C4', 'p': '#FF8FBF', 'P': '#FFE3F0', 'w': '#1E5078',
      'W': '#7EC0E4', 'c': '#3BEFFF', 'v': '#8A4AE0', 'y': '#FFE45C', 'k': '#16242A'}


def abbot(st):
    tell, atk, spec, dead = st == 't', st == 'a', st == 's', st == 'd'
    bob = 1 if st == 'm1' else 0
    c = Cv(48)
    # the shattered rose window behind him, a stained-glass halo
    cols = ['p', 'c', 'y', 'v', 'G', 'p', 'c', 'y']
    burst = 3 if spec else 0
    for k in range(8):
        a0 = k / 8 * math.tau
        for rr in range(8, 15):
            for t in range(6):
                a = a0 + t / 6 * (math.tau / 8) * 0.8
                if k == 5 and rr > 11:
                    continue                                                      # a missing pane
                x = round(24 + math.cos(a) * (rr + burst)); y = round(16 + math.sin(a) * (rr + burst) * 0.9)
                c.p(x, y, cols[k] if (tell or spec) or rr % 3 else 'k')
    if not dead:
        for k in range(8):
            a = k / 8 * math.tau
            c.ln(24, 16, round(24 + math.cos(a) * 15), round(16 + math.sin(a) * 13.5), 'k')
    # robed body, sunk to the waist
    for y in range(18, 38):
        w = 7 + (y - 18) // 3
        c.rect(24 - w, y + bob, 23 + w, y + bob, 'T' if (y // 4) % 2 else 't')
        c.p(24 - w, y + bob, 'L')
    c.rect(22, 18 + bob, 25, 37, 'R'); c.rect(22, 18 + bob, 22, 37, 'r')         # stole
    for y in (24, 30):
        c.rect(22, y + bob, 25, y + bob, 'G')
    c.ell(24, 14 + bob, 4.5, 4.5, 'f')                                            # drowned face
    c.p(22, 14 + bob, 'P' if (tell or atk) else 'p'); c.p(26, 14 + bob, 'P' if (tell or atk) else 'p')
    c.rect(22, 17 + bob, 26, 17 + bob, 'k')
    for k in range(7):                                                            # tall tilted mitre
        w = 4 - k // 2
        c.rect(24 - w + k // 3, 9 - k + bob, 23 + w + k // 3, 9 - k + bob, 'G' if k % 2 else 'g')
    c.rect(24, 3 + bob, 25, 9 + bob, 'R')
    # crozier in his right hand (screen left)
    cy = 2 if tell else 8
    c.ln(10, cy + 4, 10, 40, 'g', 2)
    c.ln(10, cy + 4, 7, cy + 1, 'G'); c.ln(7, cy + 1, 9, cy - 1, 'G'); c.ln(9, cy - 1, 12, cy, 'G')
    c.ln(15, 24 + bob, 11, 26, 'T', 2)
    # flooded censer on a chain (screen right), swinging
    sw = {'m0': 0, 'm1': 2, 't': -2, 'a': 5, 's': 0, 'd': 0}[st]
    c.ln(33, 25 + bob, 38 + sw, 31, 'L')
    c.ell(38 + sw, 33, 3, 2.6, 'g'); c.ell(38 + sw, 32, 2, 1.2, 'W')
    if atk:
        for k in range(6):
            c.p(40 + sw + k % 3, 35 + k, 'W')
    # floodwater around his waist, rippling
    for y in range(37, 48):
        for x in range(4, 44):
            wv = math.sin((x + bob * 3) * 0.5 + y)
            if y == 37 and wv < 0.2:
                continue
            c.p(x, y, 'W' if (y == 38 and wv > 0.5) or (y % 4 == 0 and wv > 0.85) else 'w')
    late = []
    if atk:
        late = sp('W', [(44, 30), (4, 34), (24, 46)])
    if spec:
        late = sp('c', [(4, 4), (44, 4), (2, 22), (46, 22)]) + sp('p', [(12, 1), (36, 1)])
    return c.done(late)


def abbot_frames():
    fr = [abbot(s) for s in ('m0', 'm1', 't', 'a', 's')]
    d = abbot('d')
    return fr + [d, squash(d, 2), squash(d, 4)]


# ================================================================ THE FALLEN HEART (64)
FH = {'o': '#120A0C', 'r': '#6A0A1A', 'R': '#B0213F', 'Q': '#FF4A5A', 'g': '#A8792A', 'G': '#F2C14E',
      'Y': '#FFEB8F', 'W': '#FFFDF0', 'b': '#C8C0B0', 'B': '#EDE6D2', 'k': '#2A2430', 'i': '#4A4254', 'm': '#8C2A12'}


def heart(st):
    tell, atk, spec, dead = st == 't', st == 'a', st == 's', st == 'd'
    pulse = {'m0': 0, 'm1': 1, 't': 1, 'a': 2, 's': 2, 'd': -2}[st]
    c = Cv(64)
    # the cathedral ribcage behind it: bone arches with gold capitals
    spread = 6 if spec else 0
    for side in (-1, 1):
        for k in range(5):
            x0 = 32 + side * (6 + k * 5 + spread)
            top = 10 + k * 3
            pts = []
            for t in range(9):
                a = t / 8 * math.pi / 2
                pts.append((round(x0 + side * math.sin(a) * 6), round(top + (1 - math.cos(a)) * 26 + t * 0.7)))
            for (xa, ya), (xb, yb) in zip(pts, pts[1:]):
                c.ln(xa, ya, xb, yb, 'B' if k % 2 else 'b', 2)
            c.rect(x0 - 1, top - 1, x0 + 1, top, 'G')
    c.rect(29, 4, 34, 52, 'b'); c.rect(29, 4, 30, 52, 'B')                        # spine/nave
    for y in range(8, 52, 6):
        c.rect(28, y, 35, y, 'G')
    # the heart: two lobes of molten gold-and-crimson
    if not dead:
        c.ell(26, 30, 10 + pulse, 11 + pulse, 'R'); c.ell(38, 30, 10 + pulse, 11 + pulse, 'R')
        for y in range(30, 50 + pulse):
            w = max(0, 18 + pulse - (y - 30) * 0.95)
            c.rect(round(32 - w), y, round(31 + w), y, 'R')
        c.ell(27, 27, 5, 5, 'Q'); c.ell(25, 25, 2, 2, 'W' if (tell or atk or spec) else 'Y')
        for (x0, y0, x1, y1) in ((24, 34, 30, 44), (36, 28, 40, 40), (32, 22, 33, 46)):   # gold kintsugi veins
            c.ln(x0, y0, x1, y1, 'G' if not tell else 'Y')
        for x, top in ((26, 8), (31, 5), (37, 9)):                                # aorta pipes like organ pipes
            c.rect(x, top - pulse, x + 3, 22, 'g'); c.rect(x, top - pulse, x + 3, top - pulse, 'Y')
            c.rect(x + 1, top + 2 - pulse, x + 1, 20, 'G')
        c.ell(32, 33, 3, 3, 'W' if (atk or spec) else 'Y')                         # the core
    else:
        c.ell(26, 36, 9, 8, 'k'); c.ell(38, 36, 9, 8, 'k')
        for y in range(36, 52):
            w = max(0, 16 - (y - 36))
            c.rect(32 - w, y, 31 + w, y, 'i')
        c.ln(24, 30, 40, 48, 'm'); c.ln(36, 30, 28, 50, 'm')
    # chains holding it, broken on one side
    for x0, y0, x1, y1 in ((8, 6, 20, 24), (56, 4, 46, 22)):
        for k in range(12):
            x = round(x0 + (x1 - x0) * k / 11); y = round(y0 + (y1 - y0) * k / 11)
            c.p(x, y, 'i' if k % 2 else 'G')
    late = []
    if tell:
        late = sp('Y', [(32, 1), (10, 30), (54, 30)])
    if atk:
        late = sp('Q', [(4, 20), (60, 20), (2, 44), (62, 44), (32, 62), (16, 58), (48, 58)])
    if spec:
        late = sp('W', [(6, 10), (58, 10), (32, 60)]) + sp('G', [(2, 32), (62, 32)])
    return c.done(late)


def heart_frames():
    fr = [heart(s) for s in ('m0', 'm1', 't', 'a', 's')]
    d = heart('d')
    return fr + [d, squash(d, 2), squash(d, 3)]
