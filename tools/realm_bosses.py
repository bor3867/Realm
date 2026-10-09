"""Realm bosses - 48x48, spawn as random events in their biome.

Row per boss: I0 I1 | T0 (main tell) | A0 (main attack) | S0 (special) | D0 D1 D2
Pivot (24, 45).
"""
import math
from pixlib import blank, rect, spans, line, outline, rows, compose

S = 48
B = {}


def register(name, pal, frames, **meta):
    assert len(frames) == 8, name
    out = []
    for f in frames:
        f = [''.join(r) for r in f]
        assert len(f) == S and len(f[0]) == S, name
        out.append(f)
    B[name] = dict(pal=pal, frames=out, meta=meta)


def P(c, x, y, ch):
    if 0 <= x < S and 0 <= y < S:
        c[y][x] = ch


def ellipse(c, cx, cy, rx, ry, ch):
    for y in range(S):
        for x in range(S):
            if ((x - cx) / max(rx, .1)) ** 2 + ((y - cy) / max(ry, .1)) ** 2 <= 1:
                c[y][x] = ch


def thick(c, x0, y0, x1, y1, w, ch):
    for k in range(-(w // 2), w - w // 2):
        if abs(x1 - x0) > abs(y1 - y0):
            line(c, x0, y0 + k, x1, y1 + k, ch)
        else:
            line(c, x0 + k, y0, x1 + k, y1, ch)


def put(c, part, x, y, rc=None):
    for j, r in enumerate(part):
        for i, ch in enumerate(r):
            if ch != '.':
                P(c, x + i, y + j, (rc or {}).get(ch, ch))


def recolor(c, rc):
    return [[rc.get(ch, ch) for ch in r] for r in c]


def squash(grid, n):
    g = [''.join(r) for r in grid]
    body = [r for r in g if r.strip('.')]
    kept = body[::-1][::n][::-1]
    return ['.' * S] * (S - len(kept)) + kept


def finish(c, rc=None, extras=()):
    outline(c)
    for part, x, y in extras:
        put(c, part, x, y)
    return recolor(c, rc) if rc else c


def spark(ch, pts, big=False):
    return [((['.' + ch + '.', ch * 3, '.' + ch + '.'] if big else [ch]), x, y) for x, y in pts]


# ================================================================= THE BRINE CATHEDRAL
BC = {'o': '#102226', 'k': '#1A3A38', 't': '#2B6E6A', 'T': '#5FB3A1', 'L': '#A6E0D0', 'r': '#8A2A2A',
      'R': '#D4583C', 'Q': '#FF9A7A', 'b': '#E8DCC0', 'p': '#FF8FBF', 'P': '#FFE3F0', 'g': '#2E5A3A', 'G': '#4C8A50'}


def cathedral(dy=0, ph=0, glow='p', hide=False, claw=0, bell=0, tilt=0):
    c = blank(S, S)
    sink = 6 if hide else 0
    if not hide:
        for n, (ax, ay) in enumerate(((15, 34), (16, 37), (18, 40))):           # jointed crab legs
            sw = 1 if (n + ph) % 2 else -1
            for side in (-1, 1):
                bx = ax if side < 0 else 47 - ax
                kx, ky = bx + side * 6, ay + dy - 3 + sw
                thick(c, bx, ay + dy, kx, ky, 2, 'R')
                thick(c, kx, ky, kx + side * 3, 47, 2, 'r')
                P(c, kx, ky, 'Q')
        ellipse(c, 24, 36 + dy, 11, 5, 'R')
        ellipse(c, 22, 35 + dy, 6, 2, 'Q')
        for ex in (19, 29):                                                       # eye stalks
            line(c, ex, 33 + dy, ex + (1 if ex > 24 else -1), 27 + dy, 'r')
            ellipse(c, ex + (1 if ex > 24 else -1), 26 + dy, 1.4, 1.4, 'b')
            P(c, ex + (1 if ex > 24 else -1), 26 + dy, 'o')
        cl = 27 + dy - claw                                                       # the big claw: two jaws
        spans(c, [(cl, 2, 9), (cl + 1, 1, 12), (cl + 2, 0, 13), (cl + 3, 1, 12)], 'R')
        spans(c, [(cl + 6, 1, 11), (cl + 7, 0, 13), (cl + 8, 2, 12)], 'R')
        for x in range(2, 9):
            P(c, x, cl + 1, 'Q')
        P(c, 0, cl - 1 - claw, 'b'); P(c, 1, cl - 1 - claw, 'b'); P(c, 0, cl + 9, 'b')
        thick(c, 12, cl + 4, 16, 34 + dy, 3, 'R')
        rect(c, 37, 32 + dy, 42, 35 + dy, 'R'); P(c, 43, 31 + dy, 'b'); P(c, 43, 36 + dy, 'b')
    top = 14 + dy + sink
    base = 33 + dy + sink
    rect(c, 12, top, 36, min(base, 47), 'T')                                      # walls
    for y in range(top, min(base, 47) + 1):
        for x in range(12, 37):
            if y % 4 == 0 or (x + (y // 4) * 3) % 7 == 0:
                c[y][x] = 't'
        c[y][12] = 'L'
    for k in range(9):                                                            # gable roof
        rect(c, 10 + k * 2 + tilt, top - 1 - k, 38 - k * 2 + tilt, top - 1 - k, 'k')
        P(c, 10 + k * 2 + tilt, top - 1 - k, 't')
    sx = 26 + tilt * 2                                                            # leaning steeple
    rect(c, sx, top - 16, sx + 4, top - 8, 'k')
    rect(c, sx + 1, top - 14, sx + 3, top - 11, 'o')
    put(c, ['.b.', 'bbb'], sx + 1 + bell, top - 13)                               # the bell
    P(c, sx + 2, top - 17, 'k'); P(c, sx + 2, top - 18, 'L')
    for x in range(10, 39, 3):                                                    # kelp hanging off the eaves
        ln = 2 + (x * 7) % 4
        for y in range(top, top + ln):
            P(c, x + tilt, y, 'G' if y % 2 else 'g')
    ellipse(c, 24, top + 5, 3, 3, glow)                                           # rose window
    P(c, 24, top + 5, 'P' if glow != 'k' else 'k')
    for wx in (15, 31):                                                           # side windows
        rect(c, wx, top + 5, wx + 2, top + 10, glow); P(c, wx + 1, top + 4, glow)
        P(c, wx + 1, top + 7, 'P' if glow != 'k' else 'k')
    rect(c, 21, top + 11, 27, min(base, 47), 'o'); rect(c, 22, top + 10, 26, top + 10, 'o')   # door
    if glow == 'P':
        rect(c, 22, top + 13, 26, min(base, 47), 'p')
        rect(c, 23, top + 14, 25, min(base, 47), 'P')
    for x, y in ((14, 18), (34, 22), (17, 29), (33, 15), (29, 31)):              # barnacles
        P(c, x, y + dy + sink, 'L'); P(c, x + 1, y + dy + sink, 'T')
    return c


def brine_cathedral():
    f = [
        finish(cathedral(0, 0)),
        finish(cathedral(1, 1, bell=1)),
        finish(cathedral(-1, 0, glow='P', claw=3, bell=-1), extras=spark('P', [(27, 0), (18, 3), (38, 4)], True)),
        finish(cathedral(0, 1, glow='P', claw=4), extras=spark('P', [(2, 12), (44, 12), (6, 3), (40, 3), (0, 22), (46, 22)], True)),
        finish(cathedral(0, 0, glow='P', hide=True), extras=spark('p', [(7, 40), (39, 40), (24, 46), (14, 44), (34, 44)])),
        finish(cathedral(1, 0, glow='k', tilt=1)),
    ]
    d1 = finish(cathedral(4, 1, glow='k', tilt=2))
    f += [squash(d1, 2), squash(d1, 4)]
    register('brine_cathedral', BC, f, biome='shore')


# ================================================================= THE WICK-MOTHER
WM = {'o': '#10180E', 'w': '#E8E0C8', 'W': '#B8AE94', 'd': '#7A7060', 'k': '#1A1A12', 'g': '#6A9A2A',
      'G': '#8DB03A', 'y': '#D4FF5A', 'Y': '#F4FFC8', 'r': '#5A1A10'}


def wick_mother(flame=0, wings=0, melt=0, core='y', puddle=True):
    c = blank(S, S)
    top = 17 + melt
    rect(c, 17, top, 31, 42, 'w')                                                  # candle body
    for x in range(17, 32):
        if x % 4 == 1:
            for y in range(top, 43):
                c[y][x] = 'W'
    for x in range(17, 20):
        for y in range(top, 43):
            c[y][x] = 'Y' if x == 18 else c[y][x]                                  # glow-side highlight
    for x, ln in ((17, 10), (20, 5), (23, 13), (27, 7), (30, 15), (31, 4)):         # drips over the rim
        rect(c, x, top - 1, x, min(42, top + ln), 'W')
        P(c, x, min(42, top + ln) + 1, 'd')
    for side in (-1, 1):                                                           # wax-shawl wings
        for k in range(15 + wings):
            x = (16 - k // 2 - wings // 2) if side < 0 else (32 + k // 2 + wings // 2)
            rect(c, x, top + 3 + k // 3, x, min(42, top + 9 + k), 'w' if k % 3 else 'W')
    for cx in (7 - wings // 2, 41 + wings // 2):                                    # held candles, lit
        if 1 <= cx < S - 1:
            rect(c, cx - 1, top + 8, cx + 1, top + 14, 'w'); P(c, cx - 1, top + 8, 'W')
            P(c, cx, top + 7, 'k'); P(c, cx, top + 6, 'G'); P(c, cx, top + 5, 'y'); P(c, cx, top + 4, 'Y')
    for ex in (21, 27):                                                            # hollow face in the wax
        rect(c, ex, top + 2, ex + 1, top + 4, 'k')
    rect(c, 23, top + 7, 25, top + 8, 'r'); P(c, 24, top + 9, 'k')
    if puddle:
        spans(c, [(43, 6, 42), (44, 8, 40), (45, 11, 37), (42, 10, 38)], 'W')
        spans(c, [(43, 12, 36)], 'w')
    fh = 14 + flame                                                               # flame head
    for k in range(fh):
        w = max(1, int(math.sin((k + 1) / (fh + 1) * math.pi) * 6.5))
        y = top - 1 - k
        sway = (k * flame) // 12 - (1 if k > 8 and flame % 2 else 0)
        if 0 <= y < S:
            rect(c, 24 - w + sway, y, 24 + w + sway, y, 'g')
            if w > 1:
                rect(c, 24 - w + 1 + sway, y, 24 + w - 1 + sway, y, 'G')
            if w > 3:
                rect(c, 24 - w + 3 + sway, y, 24 + w - 3 + sway, y, core)
            if w > 5 and k < fh - 4:
                P(c, 24 + sway, y, 'Y')
    P(c, 24, top, 'k'); P(c, 24, top - 1, 'k')
    return c


def wickmother():
    f = [
        finish(wick_mother(0)),
        finish(wick_mother(2)),
        finish(wick_mother(4, core='Y'), extras=spark('y', [(14, 2), (33, 0)], True)),
        finish(wick_mother(3, core='Y'), extras=spark('y', [(3, 9), (43, 9), (9, 0), (37, 1), (0, 22), (46, 22)], True)),
        finish(wick_mother(0, wings=6), extras=spark('W', [(6, 46), (40, 46), (13, 47), (33, 47)])),
        finish(wick_mother(-5, core='G')),
    ]
    d1 = finish(wick_mother(-8, melt=12, core='g'))
    f += [squash(d1, 2), compose([(squash(d1, 4), 0, 0), (['k', 'k'], 24, 44)], S, S)]
    register('wick_mother', WM, f, biome='fen')


# ================================================================= THE ORRERY OF WINTER
OW = {'o': '#0E1530', 'n': '#1F2E5E', 'N': '#3A57A8', 's': '#8C8FA3', 'S': '#C9CCD8', 'c': '#3BEFFF',
      'C': '#CFFFFF', 'a': '#5FA8D8', 'A': '#A8E2FF', 'W': '#F0FCFF', 'g': '#A88B4A', 'G': '#D9BE7A'}


def orrery(ph=0.0, eye='c', flare=False, align=False, broken=0, drop=0):
    c = blank(S, S)
    back, front = [], []
    rings = [(20, 6, 0.35), (16, 12, -0.5)] if not align else [(21, 4, 0.0), (17, 4, 0.0)]
    for n, (rx, ry, tilt) in enumerate(rings):
        for k in range(160):
            a = k / 160 * math.tau
            if broken and (k + n * 30) % 40 < broken * 8:
                continue
            for t2 in (0, 1):                                                      # two-pixel thick bands
                x0, y0 = math.cos(a) * (rx - t2), math.sin(a) * (ry - t2 * 0.5)
                x = round(24 + x0 * math.cos(tilt) - y0 * math.sin(tilt))
                y = round(21 + drop * (1 + n) + x0 * math.sin(tilt) + y0 * math.cos(tilt))
                ch = ('C' if flare else 'c') if k % 13 == 0 else ('G' if n == 1 and k % 20 == 5 else ('S' if t2 == 0 else 's'))
                (back if math.sin(a) < 0 else front).append((x, y, ch))
    for x, y, ch in back:
        P(c, x, y, ch)
    ey = 21 + drop * 2
    ellipse(c, 24, ey, 8, 8, 'a')                                                   # the frozen eye
    ellipse(c, 22, ey - 2, 4, 4, 'A')
    ellipse(c, 21, ey - 3, 1.5, 1.5, 'W')
    ellipse(c, 26, ey + 1, 3.5, 3.5, 'N')
    ellipse(c, 26, ey + 1, 2, 2, 'n')
    P(c, 26, ey + 1, eye); P(c, 27, ey + 1, eye); P(c, 26, ey, eye)
    for x, y, ch in front:
        P(c, x, y, ch)
    for k in range(3):                                                             # orbiting stones
        a = ph + k * math.tau / 3
        x, y = round(24 + math.cos(a) * 20), round(21 + drop * 3 + math.sin(a) * 6)
        rect(c, x - 2, y - 2, x + 2, y + 2, 'S'); rect(c, x - 1, y - 1, x + 2, y + 2, 's')
        P(c, x, y, 'c'); P(c, x - 2, y - 2, 'W')
    if not drop:
        for x in (19, 29, 24):                                                     # broken chains
            for y in range(30, 44 - (x % 7)):
                P(c, x, y, 's' if y % 2 else 'n')
                if y % 4 == 0:
                    P(c, x - 1, y, 'S'); P(c, x + 1, y, 'S')
    return c


def orrery_boss():
    f = [
        finish(orrery(0.0)),
        finish(orrery(0.5)),
        finish(orrery(1.0, eye='C', flare=True), extras=spark('C', [(24, 4), (6, 4), (40, 5)], True)),
        finish(orrery(1.6, eye='W', flare=True), extras=spark('C', [(1, 20), (45, 20), (24, 0), (24, 45), (6, 38), (40, 38)], True)),
        finish(orrery(0.0, eye='W', align=True), extras=[(['W'], 24, y) for y in range(32, 47, 2)]),
        finish(orrery(0.3, eye='n', broken=1)),
        finish(orrery(0.6, eye='n', broken=2, drop=4)),
    ]
    f += [squash(finish(orrery(0.6, eye='n', broken=3, drop=7)), 3)]
    register('orrery_of_winter', OW, f, biome='runeholt')


# ================================================================= THE PENITENT COLOSSUS
PC = {'o': '#0E0A0E', 'k': '#4A4458', 'i': '#A8A0B8', 'I': '#E4DEEC', 'g': '#C98A22', 'G': '#F2C14E',
      'r': '#B0213F', 'R': '#FF4A5A', 'Y': '#FFEB8F', 'm': '#6E6680'}
HEAD = ["..oooooooo..", ".oIIIiiiiko.", "oIIIiiiiikko", "oIiRRiiRRiko", "oIiRYiiRYiko", "oiiiiiiiiiko",
        "oiiiokkoiiko", "oiiokkkkoiko", ".oiiiiiiiko.", "..oiiiiiko..", "...oooooo..."]


def colossus(dy=0, lift=0, head=(0, 0), eyes='R', seam='G', fallen=False):
    c = blank(S, S)
    rect(c, 14, 14 + dy, 33, 35 + dy, 'i')                                          # torso
    for y in range(14 + dy, 36 + dy):
        for x in (14, 15, 16):
            P(c, x, y, 'I')
        P(c, 33, y, 'm'); P(c, 32, y, 'm')
    for y in (20, 26):                                                              # carved ribs
        for x in range(18, 31):
            P(c, x, y + dy, 'm')
    spans(c, [(36 + dy, 15, 32), (37 + dy, 16, 31), (38 + dy, 18, 28), (39 + dy, 20, 26)], 'k')   # rubble waist
    for x in (17, 22, 27):
        P(c, x, 40 + dy, 'k'); P(c, x + 1, 41 + dy, 'm')
    rect(c, 20, 10 + dy, 27, 13 + dy, 'k')                                          # broken neck
    for x in (20, 22, 25, 27):
        P(c, x, 9 + dy, 'k')
    pts = [(16, 16), (19, 18), (21, 17), (24, 20), (23, 23), (26, 25), (24, 28), (27, 31), (25, 34)]   # kintsugi seam
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        line(c, x0, y0 + dy, x1, y1 + dy, seam)
    line(c, 28, 15 + dy, 31, 19 + dy, seam)
    P(c, 23, 11 + dy, seam); P(c, 24, 12 + dy, seam)
    fy = 39 - lift * 30                                                             # left arm: planted, or raised to slam
    thick(c, 14, 17 + dy, 6, fy, 6, 'i'); thick(c, 12, 17 + dy, 4, fy, 1, 'I')
    rect(c, 1, fy, 11, fy + 6, 'i'); rect(c, 1, fy, 3, fy + 6, 'I')
    for x in (3, 6, 9):
        P(c, x, fy + 6, 'm'); P(c, x, fy + 5, 'm')
    hx, hy = 34 + head[0], 4 + head[1] - lift * 3                                   # right arm holds its own head
    thick(c, 33, 17 + dy, 38 + head[0], hy + 12, 6, 'i')
    rect(c, 35 + head[0], hy + 10, 45 + head[0], hy + 13, 'I')
    if lift:
        thick(c, 33, 17 + dy, 42, 9, 6, 'i')
    if not fallen:
        put(c, HEAD, hx, hy, {'R': eyes, 'Y': 'Y' if eyes != 'k' else 'k'})
    return c


def colossus_boss():
    f = [
        finish(colossus(0)),
        finish(colossus(1, head=(1, 1))),
        finish(colossus(0, head=(-1, -1), eyes='Y'), extras=spark('R', [(36, 4), (46, 2)], True)),
        finish(colossus(1, eyes='Y', seam='Y'), extras=[(['RR'], 37 - k * 2, 16 + k * 3) for k in range(10)]),
        finish(colossus(-1, lift=1, seam='Y'), extras=spark('Y', [(3, 3), (12, 1), (45, 1)], True)),
        finish(colossus(1, eyes='r', seam='g')),
    ]
    d1 = finish(colossus(5, eyes='k', seam='k', fallen=True))
    f += [squash(d1, 2), compose([(squash(d1, 4), 0, 0), (HEAD, 34, 37, {'R': 'k', 'Y': 'k'})], S, S)]
    register('penitent_colossus', PC, f, biome='godfall')


for fn in (brine_cathedral, wickmother, orrery_boss, colossus_boss):
    fn()
