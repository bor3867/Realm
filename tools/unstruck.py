"""THE UNSTRUCK - boss of the Drowned Forge. 64x64 per frame.

The forge-god was never finished: its smiths drowned before the first blow.
What remains is the god-anvil (the Anvilheart's oath-anvil was cut from its
heel), a furnace torso of drowned temple bronze, one tongs-arm clamping a
billet the size of a man, an empty socket trailing chains where the hammer-arm
should be, and three hammers that still orbit it, waiting to strike.

Tells: RADIAL - hammers rise | BEAM - grate goes white | PHASE 2 - the anvil splits open.
Frames (row 0): I0 I1 TR AR TB AB P0 | (row 1): P1 H0 D0 D1 D2 D3
"""
from pixlib import blank, rect, spans, line, outline, rows

PAL = {
    'o': '#120C10', 'k': '#2E2A38', 'i': '#4F4B60', 'I': '#8E8AA6', 'J': '#C4C0D8',
    'm': '#8C2A12', 'M': '#F2641A', 'Y': '#FFC94A', 'W': '#FFF6C8',
    'v': '#24503F', 'V': '#3A8066', 'L': '#7AC4A0', 'b': '#6E4A22', 'B': '#A8792A',
}
S = 64

HAMMER = ["oooooooooooo", "oJIIIIIIIIio", "oIiiiiiiiiko", "oiiiMiiiiiko", "oiiiiiiiikko", "oooooooooooo",
          ".....okko...", ".....okko...", ".....okko...", ".....oooo..."]


def P(c, x, y, ch):
    if 0 <= x < S and 0 <= y < S:
        c[y][x] = ch


def anvil(c, y=13, split=0, rc=None, glow=True):
    top = blank(S, 12)
    spans(top, [(0, 8, 58)], 'J')
    spans(top, [(1, 4, 60), (2, 1, 61), (3, 0, 61), (4, 4, 60)], 'I')
    spans(top, [(2, 1, 61)], 'i'); spans(top, [(1, 4, 60)], 'I')
    spans(top, [(5, 9, 58), (6, 13, 55)], 'k')
    spans(top, [(3, 0, 5), (4, 3, 8)], 'i')                         # the horn tip
    rect(top, 53, 0, 61, 3, '.')                                    # the missing heel chunk
    rect(top, 54, 4, 58, 4, 'k')
    for x in range(12, 52, 8):                                      # strike scars
        top[1][x] = 'k'; top[0][x + 1] = 'I'
    for n, x in enumerate(range(18, 46)):                           # zig-zag fissure
        top[1 + (n // 2) % 3][x] = 'M' if n % 3 else 'Y'
    base = blank(S, 8)
    spans(base, [(0, 17, 49), (1, 19, 45), (2, 21, 43), (3, 21, 43)], 'k')
    spans(base, [(0, 25, 39)], 'i')
    for yy, r in enumerate(top):
        for xx, ch in enumerate(r):
            if ch != '.':
                ch = (rc or {}).get(ch, ch)
                tx = xx - (split // 2 if xx < 32 else -(split // 2))
                P(c, tx, y - 3 + yy - split, ch)
    for yy, r in enumerate(base):
        for xx, ch in enumerate(r):
            if ch != '.':
                P(c, xx, y + 5 + yy, ch)
    if split and glow:
        for yy in range(y + 5 - split, y + 5):
            rect(c, 23, yy, 41, yy, 'Y' if yy % 2 else 'W')


def furnace(c, y=22, glow='M', open_=0):
    for k in range(24):
        x0, x1 = 17 - k // 3, 47 + k // 3
        band = k % 6 == 0
        for x in range(x0, x1 + 1):
            t = (x - x0) / max(1, x1 - x0)
            ch = 'V' if t < 0.25 else 'v'                            # patina lit from the left
            if band:
                ch = 'B' if t < 0.3 else 'b'                         # bronze straps
            c[y + k][x] = ch
        if band:
            for xx in range(x0 + 3, x1, 5):
                c[y + k][xx] = 'J'                                   # rivets
        c[y + k][x0] = 'L'
        if k > 7 and k % 5 == 2:
            c[y + k][x0 + 4] = 'L'; c[y + k + 1][x0 + 4] = 'V'         # verdigris drips
    for side in (-1, 1):                                             # side vents
        vx = 19 if side < 0 else 44
        rect(c, vx, y + 3, vx + 1, y + 6, 'k')
        P(c, vx, y + 4, glow); P(c, vx + 1, y + 5, glow)
    rect(c, 22, y + 4 - open_, 42, y + 20 + open_, 'k')               # the grate
    for yy in range(y + 6 - open_, y + 20 + open_):
        for xx in range(23, 42):
            c[yy][xx] = glow if (xx % 2) else 'k'
    for xx in range(22, 43, 2):                                      # fangs over the grate
        c[y + 5 - open_][xx] = 'J'
        if xx % 4 == 2:
            c[y + 6 - open_][xx] = 'I'
    for xx in range(23, 42, 3):                                      # lower fangs
        c[y + 20 + open_][xx] = 'I'
    if open_:
        rect(c, 28, y + 9, 36, y + 16, 'W')
        rect(c, 30, y + 11, 34, y + 14, 'Y')


def tongs_arm(c, reach=0, lift=0, billet='Y'):
    ax, ay = 17, 27
    hx, hy = 8 - reach, 47 - lift
    for d, ch in ((0, 'k'), (1, 'i'), (2, 'I'), (3, 'J'), (4, 'i'), (5, 'k')):
        line(c, ax + d - 2, ay, hx + d - 2, hy, ch)
    rect(c, hx - 8, hy + 1, hx + 5, hy + 11, 'm')
    rect(c, hx - 7, hy + 2, hx + 4, hy + 10, 'M')
    rect(c, hx - 6, hy + 3, hx + 3, hy + 9, billet)
    rect(c, hx - 4, hy + 5, hx + 1, hy + 7, 'W')
    line(c, hx - 8, hy, hx - 5, hy + 3, 'I'); line(c, hx + 5, hy, hx + 2, hy + 3, 'I')   # jaws


def chains(c, sway=0):
    rect(c, 47, 25, 51, 29, 'k')                                      # empty socket
    P(c, 48, 26, 'm'); P(c, 49, 27, 'M'); P(c, 50, 28, 'm')
    for n, x in enumerate((48, 51)):
        for yy in range(30, 45 + n * 4):
            xx = x + (sway if yy > 36 else 0) + (yy // 3) % 2
            P(c, xx, yy, 'J' if yy % 3 == 0 else 'i')


def slag(c, y=48, heat=1):
    spans(c, [(y, 16, 48), (y + 1, 12, 52), (y + 2, 10, 54), (y + 3, 12, 52), (y + 4, 16, 48), (y + 5, 22, 42)], 'm')
    if heat:
        spans(c, [(y + 1, 18, 45), (y + 2, 15, 49), (y + 3, 18, 46)], 'M')
        for x in range(19, 46, 5):
            c[y + 2][x] = 'Y'
        c[y + 6][27] = 'M'; c[y + 7][27] = 'm'; c[y + 6][40] = 'M'


def hammers(c, pos, rc=None):
    for (x, y) in pos:
        for j, r in enumerate(HAMMER):
            for i, ch in enumerate(r):
                if ch != '.':
                    P(c, x + i, y + j, (rc or {}).get(ch, ch))


def frame(by=0, ham=((4, 0), (26, 0), (47, 1)), ham_rc=None, glow='M', open_=0, split=0,
          reach=0, lift=0, sway=0, arc=None, heat=1, extras=()):
    c = blank(S, S)
    slag(c, 48, heat)
    furnace(c, 22 + by, glow, open_)
    chains(c, sway)
    tongs_arm(c, reach, lift)
    anvil(c, 13 + by, split, arc, glow=heat > 0 or glow != 'k')
    outline(c)
    hammers(c, ham, ham_rc)
    for part, x, y in extras:
        for j, r in enumerate(part):
            for i, ch in enumerate(r):
                if ch != '.':
                    P(c, x + i, y + j, ch)
    return rows(c)


def sparks(pts, ch='Y'):
    return [(['.' + ch + '.', ch * 3, '.' + ch + '.'], x - 1, y - 1) for x, y in pts]


def frames():
    ring = [(3, 27), (60, 27), (8, 10), (55, 10), (2, 43), (61, 43), (32, 62), (16, 59), (48, 59)]
    return [
        frame(),                                                                       # I0
        frame(by=1, ham=((3, 2), (27, 1), (48, 0)), glow='Y', sway=1, lift=1),          # I1
        frame(by=-1, ham=((2, 0), (26, 0), (49, 0)), ham_rc={'I': 'Y', 'J': 'W'}, arc={'k': 'm'}, reach=1),   # TR
        frame(by=1, ham=((12, 7), (26, 5), (40, 7)), ham_rc={'I': 'W', 'J': 'W', 'i': 'Y'},
              extras=sparks(ring) + sparks([(22, 10), (41, 10)], 'W')),                   # AR
        frame(by=0, glow='Y', open_=1, lift=2, extras=sparks([(32, 19)], 'W')),          # TB
        frame(by=-1, glow='W', open_=2, reach=2,
              extras=[(['YWWY'] * 8, 30, 42), (['WWWWWW'], 29, 50)] + sparks([(25, 54), (39, 55)])),  # AB
        frame(by=0, split=4, ham=((1, 5), (27, 0), (52, 8)), ham_rc={'I': 'Y'}),          # P0
        frame(by=-1, split=8, ham=((0, 16), (27, 0), (52, 18)), ham_rc={'I': 'W', 'i': 'Y'}, glow='W',
              extras=sparks(ring, 'M')),                                                  # P1
        frame(by=-2, ham=((9, 4), (25, 3), (44, 0)), sway=-1, reach=-1, glow='m'),       # H0
        frame(by=1, ham=((7, 8), (28, 4), (47, 12)), glow='m', arc={'M': 'm'}),          # D0
        frame(by=4, ham=((4, 40), (28, 10), (50, 37)), glow='m', split=3, heat=1),       # D1
        frame(by=8, ham=((3, 51), (28, 48), (50, 50)), glow='k', split=5, heat=0, arc={'J': 'I', 'I': 'i', 'M': 'm'}),  # D2
        frame(by=9, ham=((3, 52), (28, 51), (50, 51)), glow='k', split=5, heat=0,
              arc={'J': 'I', 'I': 'i', 'M': 'k', 'm': 'k', 'Y': 'm'}, extras=[(['Y'], 32, 6)]),   # D3
    ]


LAYOUT = [[0, 1, 2, 3, 4, 5, 6], [7, 8, 9, 10, 11, 12]]
ANIMS = {
    'idle': {'frames': 2, 'fps': 3, 'loop': True},
    'tell_radial': {'frames': 1, 'holdMs': 600},
    'attack_radial': {'frames': 1, 'holdMs': 200},
    'tell_beam': {'frames': 1, 'holdMs': 700},
    'attack_beam': {'frames': 1, 'holdMs': 900},
    'phase': {'frames': 2, 'fps': 3, 'loop': False},
    'hurt': {'frames': 1, 'holdMs': 120},
    'death': {'frames': 4, 'fps': 4, 'loop': False, 'holdLastFrame': True},
}
