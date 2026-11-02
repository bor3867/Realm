# Ashkar, the Chained Forge-Giant (src/bosses/ashkar_gatekeeper.js): the user's own sprite (2026-11-01,
# art/ashkar_chained_forge_giant.jpg, brought to native pixels at its own ~11 px grid by tools/import_boss_art.py: 109x107,
# too fine to halve without losing him, so the boss draws it at half scale, one of its pixels to one of the screen's).
# Animated, three looks to the user's spec ("Sunthief's Castle", 3):
#   I   The Bound Giant          - every chain on him; the lava in his armour and hammer flowing; the core pulsing
#   II  The Furnace Fractures    - his armour cracked open from the core, two chains broken off (the right shoulder's and
#                                  the one under his left fist), ash
#   III The Unchained            - every chain gone, the core blazing, the hammer white-hot, embers off him
# Four idle frames a look, the strike (the hammer raised, white-hot; the core flaring), a death (the hammer falls, the
# core implodes, he goes to ash).
#   'bx_ashkar_gatekeeper/ashkar_gatekeeper' (the same key as before: tools/build_gatekeeper.py drew the old one)
#   art/bundle/throne/ashkar_gatekeeper.png + atlas_gatekeeper.json          py -I tools/build_ashkar.py
import json, math, os, random, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
out = os.path.join(root, 'art', 'bundle', 'throne')
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402
from reduce import read_png  # noqa: E402

SRC = read_png(os.path.join(root, 'art', 'source', 'bosses', 'ashkar_chained_forge_giant.png'))
SH, SW = len(SRC), len(SRC[0])
BLANK = (0, 0, 0, 0)
lum = lambda c: c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11
sat = lambda c: (max(c[:3]) - min(c[:3])) / (max(c[:3]) or 1)
CORE = (60, 36)                                                     # his chest's molten heart
HAMMER = (0, 0, 31, 33)                                             # the hammer's head (x0, y0, x1, y1)
# the chains, by where they hang (x0, y0, x1, y1); II breaks the first two, III all of them
CHAINS = {'r_shoulder': (73, 29, 83, 50), 'l_dangle': (11, 59, 21, 81), 'l_shoulder': (41, 28, 51, 49), 'l_forearm': (27, 41, 37, 63),
          'r_wrist': (86, 54, 107, 61), 'r_dangle': (101, 58, 109, 92), 'belt_l': (45, 55, 53, 69), 'belt_r': (69, 55, 78, 69)}
BROKEN = {1: (), 2: ('r_shoulder', 'l_dangle'), 3: tuple(CHAINS)}
BARE = {'l_dangle': (11, 59, 19, 82), 'r_dangle': (104, 58, 109, 92)}     # (where only the chain is: everything in it goes)


def kind(c):
    if not c[3]: return '.'
    r, g, b = c[:3]
    if r > 190 and sat(c) > 0.78 and g > 40: return 'lava'
    if r > 120 and 0.3 < sat(c) <= 0.78 and g > 70 and b < 130 and r > b + 50: return 'bronze'
    if lum(c) < 34: return 'ink'
    return 'body'


KIND = [[kind(SRC[y][x]) for x in range(SW)] for y in range(SH)]


def mix(c, t, k):
    k = max(0, min(1, k)); return (int(c[0] + (t[0] - c[0]) * k), int(c[1] + (t[1] - c[1]) * k), int(c[2] + (t[2] - c[2]) * k), 255)


def unchain(g, names):
    # take the chain's links (their bronze and the dark of their holes) away, and fill from what is round them: the body
    # behind, or nothing where the chain hung in the air
    gone = set()
    for n in names:
        x0, y0, x1, y1 = CHAINS[n]
        for y in range(y0, min(SH, y1 + 1)):
            for x in range(x0, min(SW, x1 + 1)):
                if KIND[y][x] in ('bronze', 'ink'): gone.add((x, y))
        if n in BARE:
            x0, y0, x1, y1 = BARE[n]
            for y in range(y0, min(SH, y1 + 1)):
                for x in range(x0, min(SW, x1 + 1)): g[y][x] = BLANK
    for (x, y) in gone: g[y][x] = None
    # fill from the body round it only (never from trim, ink or lava, which smear), a few rows on so it keeps the stone's grain
    src = lambda X, Y: 0 <= X < SW and 0 <= Y < SH and (X, Y) not in gone and KIND[Y][X] == 'body' and g[Y][X] is not None and g[Y][X][3]
    for _ in range(16):
        left = [(x, y) for (x, y) in gone if g[y][x] is None]
        if not left: break
        for (x, y) in left:
            got = None
            for X, Y in ((x - 3, y), (x + 3, y), (x, y - 3), (x, y + 3), (x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if src(X, Y): got = g[Y][X]; break
            if got: g[y][x] = got
            elif all(not (0 <= X < SW and 0 <= Y < SH) or (g[Y][X] is not None and not g[Y][X][3]) for X, Y in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1))): g[y][x] = BLANK
    for (x, y) in gone:
        if g[y][x] is None: g[y][x] = BLANK
    # what hung in the air off a chain and is left on its own: gone too
    seen = set()
    for y in range(SH):
        for x in range(SW):
            if (x, y) in seen or not g[y][x][3]: continue
            comp, q = [], [(x, y)]; seen.add((x, y))
            while q:
                X, Y = q.pop(); comp.append((X, Y))
                for U, V in ((X + 1, Y), (X - 1, Y), (X, Y + 1), (X, Y - 1)):
                    if 0 <= U < SW and 0 <= V < SH and (U, V) not in seen and g[V][U][3]: seen.add((U, V)); q.append((U, V))
            if len(comp) < 30:
                for X, Y in comp: g[Y][X] = BLANK


def ashkar(act=1, f=0, strike=False):
    g = [list(row) for row in SRC]
    put = lambda x, y, c: (0 <= x < SW and 0 <= y < SH) and g[y].__setitem__(x, c)
    unchain(g, BROKEN[act])
    # the lava flows: a band of light runs through every molten seam, turning each frame
    for y in range(SH):
        for x in range(SW):
            if KIND[y][x] != 'lava' or not g[y][x][3]: continue
            w = ((x + y * 2 - f * 3) % 8)
            if w < 2: g[y][x] = mix(g[y][x], (255, 244, 190), 0.55 + (0.2 if act == 3 else 0))
            elif w > 5: g[y][x] = mix(g[y][x], (150, 30, 10), 0.35 if act == 1 else 0.2)
    # the core: pulsing, wider each look, white when he strikes
    cx, cy = CORE
    rad = {1: 3.2, 2: 4.2, 3: 5.4}[act] + (0.8 if f in (1, 2) else 0) + (1.4 if strike else 0)
    for y in range(int(cy - rad - 1), int(cy + rad + 2)):
        for x in range(int(cx - rad - 1), int(cx + rad + 2)):
            d = math.hypot(x - cx, (y - cy) * 1.1)
            if 0 <= x < SW and 0 <= y < SH and d <= rad and g[y][x][3]: put(x, y, mix(g[y][x], (255, 250, 215), 1 - d / (rad + 0.6)))
    # II, III: the armour cracks open from the core
    if act >= 2:
        rnd = random.Random(11)
        for k in range(7 if act == 2 else 11):
            a = rnd.random() * math.tau; L = rnd.randint(5, 11 if act == 2 else 15); wob = rnd.uniform(-0.25, 0.25)
            for t in range(int(rad) + 1, int(rad) + L):
                x, y = int(cx + math.cos(a + wob * t / 6) * t), int(cy + math.sin(a + wob * t / 6) * t)
                if 0 <= x < SW and 0 <= y < SH and KIND[y][x] in ('body', 'ink') and g[y][x][3]:
                    put(x, y, (255, 150, 40, 255) if t > int(rad) + L * 0.6 else (255, 214, 90, 255))
    # the strike: the hammer raised two pixels and white-hot
    if strike:
        x0, y0, x1, y1 = HAMMER; lift = 2 if f else 1
        snap = [row[:] for row in g]
        for y in range(y0, y1):
            for x in range(x0, x1):
                if snap[y][x][3]: put(x, y - lift, mix(snap[y][x], (255, 240, 200), 0.35 if KIND[y][x] == 'lava' else 0.1))
                if y >= y1 - lift and snap[y][x][3]: put(x, y, snap[y + lift][x] if y + lift < SH and x >= 14 else BLANK)
    # ash (II) and embers (III) about him
    if act >= 2:
        for k in range(10 if act == 2 else 16):
            a = k * 2.399 + f * 0.35; x = int(SW / 2 + math.cos(a) * (36 + k % 5 * 4)); y = int(cy + 10 + math.sin(a) * 38 - (f * 4 + k * 3) % 14)
            if 0 <= x < SW and 0 <= y < SH and not g[y][x][3]:
                put(x, y, ((255, 170, 50, 255) if k % 2 else (255, 230, 140, 255)) if act == 3 else ((120, 104, 112, 255) if k % 2 else (80, 66, 74, 255)))
    return g


def fall(k):
    # t=0 the hammer falls, t=1 the core implodes, then he goes to ash
    rnd = random.Random(40 + k); g = ashkar(3, 0)
    cx, cy = CORE
    for y in range(SH):
        for x in range(SW):
            if not g[y][x][3]: continue
            if math.hypot(x - cx, y - cy) < 6 + k * 3: g[y][x] = (30, 14, 18, 255) if k else (255, 255, 255, 255)
            elif KIND[y][x] == 'lava': g[y][x] = mix(g[y][x], (60, 30, 30), 0.4 + k * 0.3)
            elif rnd.random() < 0.15 + 0.3 * k: g[y][x] = (64, 52, 58, 255) if (x + y) % 2 else (96, 80, 84, 255)
    if k == 2:
        sh = [[BLANK] * SW for _ in range(SH)]
        for y in range(SH):
            for x in range(SW):
                if y + 22 < SH and g[y][x][3] and rnd.random() < 0.5: sh[y + 22][x] = g[y][x]
        return sh
    return g


def pack(name, entries, W, H, cols=6):
    rows = (len(entries) + cols - 1) // cols
    px = [[BLANK] * (cols * W) for _ in range(rows * H)]; fr = {}
    for i, (key, grid) in enumerate(entries):
        ox, oy = (i % cols) * W, (i // cols) * H
        for y, row in enumerate(grid):
            for x, c in enumerate(row):
                if c[3]: px[oy + y][ox + x] = c
        fr[key] = [ox, oy, W, H]
    write_png(os.path.join(out, name + '.png'), px)
    return fr


if __name__ == '__main__':
    BID, NAMES = 'ashkar_gatekeeper', {1: 'The Bound Giant', 2: 'The Furnace Fractures', 3: 'The Unchained'}
    frames = []
    for act in (1, 2, 3):
        frames += [(f'i{act}_{k}', ashkar(act, k)) for k in range(4)] + [(f'a{act}', ashkar(act, 0, True)), (f'a{act}b', ashkar(act, 2, True))]
    frames += [(f'd{k}', fall(k)) for k in range(3)]
    fr = pack(BID, frames, SW, SH)
    anims = {}
    for act in (1, 2, 3):
        anims[f'idle{act}'] = {'frames': [f'i{act}_{k}' for k in range(4)], 'fps': 7, 'loop': True}
        anims[f'attack{act}'] = {'frames': [f'a{act}', f'a{act}b', f'a{act}'], 'fps': 6, 'loop': False}
    anims['death'] = {'frames': ['d0', 'd1', 'd2'], 'fps': 1.2, 'loop': False}
    sheets = {f'bx_{BID}': {'image': f'{BID}.png', 'kind': 'boss', 'sprites': {BID: {'frames': fr, 'anims': anims,
              'phases': {str(a): {'name': NAMES[a], 'idle': f'idle{a}', 'attack': f'attack{a}'} for a in (1, 2, 3)}, 'death': 'death', 'meta': {'half': True}}}}}
    json.dump({'rf': True, 'meta': {'name': 'Ashkar, the Chained Forge-Giant (the user\'s sprite)', 'version': 4}, 'sheets': sheets},
              open(os.path.join(out, 'atlas_gatekeeper.json'), 'w', encoding='utf8', newline='\n'), indent=1)
    S = 4; G = [ashkar(1, 0), ashkar(1, 2), ashkar(2, 1), ashkar(3, 1), ashkar(3, 0, True), fall(1)]
    P = [[(30, 22, 34, 255)] * (len(G) * (SW + 2) * S) for _ in range((SH + 2) * S)]
    for gi, g in enumerate(G):
        for y, row in enumerate(g):
            for x, col in enumerate(row):
                if col[3]:
                    for dy in range(S): P[(y + 1) * S + dy][(gi * (SW + 2) + x + 1) * S:(gi * (SW + 2) + x + 2) * S] = [col] * S
    write_png(os.path.join(root, 'art', '_proto', 'ashkar_preview.png'), P)
    print('Ashkar:', len(frames), 'frames', SW, 'x', SH)
