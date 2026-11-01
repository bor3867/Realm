# Ashkar, the Gatekeeper: the guardian of Solkhar's gate, in the Guardian's hall of the volcano island
# (src/bosses/ashkar_gatekeeper.js). 2026-11-01, redrawn (the user: "not detailed enough. It looks childish ... make it
# menacing. Animate things with lava"): a hunched giant of black volcanic glass, sculpted (tools/sculpt.py) and lit from
# the upper left. Great horns sweeping back from a heavy helm, a burning T of a visor, a fanged jaw-guard; shard
# pauldrons bristling with spikes; a cracked breastplate round a molten core, magma veins branching out of it; manacles
# and chains at his wrists; a hammer of cooled slag with fire in its seams. Four idle frames a phase: he breathes, the
# lava pulses through every crack, molten drips run down him. The strike: the hammer raised in both hands overhead.
#   I   The Gate Holds    - the glass whole, its veins a dull glow, the chains to the walls
#   II  The Caldera Wakes - every crack blazing, the horns' tips alight, embers rising off him
#   III Unchained         - the glass shed: a body of magma under a broken crust, the chains snapped, a crown of fire
#                           on his horns, the hammer ablaze
#   art/bundle/throne/ashkar_gatekeeper.png + atlas_gatekeeper.json          py -I tools/build_gatekeeper.py
import json, math, os, random, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
out = os.path.join(root, 'art', 'bundle', 'throne')
os.makedirs(out, exist_ok=True)
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402
from sculpt import Sculpt  # noqa: E402

PAL = {
    'o': '#08060c',                                                                          # the outline
    'k': '#16121e', 'b': '#262034', 'B': '#3c3450', 's': '#5e5478', 'S': '#8e84b0', 'W': '#d4ccf4',   # volcanic glass
    'i': '#34323c', 'I': '#57545f', 'h': '#86838f',                                           # iron: chains, manacles, the haft
    'x': '#2a2420', 'X': '#4a3e36', 'm': '#6e5e50',                                           # slag: the hammer's head
    'n': '#3a2c26', 'N': '#6a5244', 'H': '#a08870',                                           # horn
    'r': '#5a1608', 'R': '#9a2c0c', 'f': '#e8541a', 'F': '#ff9a2a', 'y': '#ffd25a', 'w': '#fff4d0',   # magma, dull to white-hot
    'z': '#3a3038', 'Z': '#5a4c54',                                                           # ash (the death)
}
GLASS = ['k', 'b', 'B', 's', 'S']; IRON = ['k', 'i', 'I', 'h']; SLAG = ['k', 'x', 'X', 'm']; HORN = ['k', 'n', 'N', 'H']
CRUST = ['k', 'x', 'X', 'm']                                                               # III: basalt, split by fire
MAGMA = ['r', 'R', 'f', 'F', 'y']
LAVA = ['r', 'R', 'f', 'F', 'y', 'w']
N = 48
CX = 24


def hot(c, x, y, k, f):
    """a lava pixel at heat k (0..5), pulsing: the glow runs along the crack as the frames turn"""
    k = k + (1 if (x + y * 2 + f * 3) % 7 < 2 else 0) - (1 if (x * 3 + y + f * 5) % 11 == 0 else 0)
    c.p(x, y, LAVA[max(0, min(5, k))])


def crack(c, pts, k, f):
    """a branching crack of lava along a polyline"""
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
        for i in range(n + 1):
            t = i / n; hot(c, round(x0 + (x1 - x0) * t), round(y0 + (y1 - y0) * t), k, f)


def ashkar(act=1, f=0, attack=False):
    c = Sculpt(N, N, {'glass': GLASS, 'iron': IRON, 'slag': SLAG, 'horn': HORN, 'magma': MAGMA, 'crust': CRUST}, amb=0.16)
    body = 'crust' if act == 3 else 'glass'
    by = 0 if attack else (0, 0, 1, 1)[f % 4]                           # he breathes
    heat = {1: 1, 2: 3, 3: 4}[act]                                      # how hot his cracks run
    # ---- the chains, behind everything: from his wrists to the walls (snapped short in III)
    for s in (-1, 1):
        wx, wy = (CX + s * 15, 31 + by) if not attack else (CX + s * 6, 9)
        ex, ey = (CX + s * 24, 39) if act < 3 else (CX + s * 19, 37)
        if attack: ex, ey = (CX + s * 22, 30) if act < 3 else (CX + s * 13, 18)
        n = int(math.hypot(ex - wx, ey - wy) / 1.6)
        for k in range(n + 1):
            t = k / max(1, n); sag = math.sin(t * math.pi) * (3 if act < 3 else 1)
            x, y = wx + (ex - wx) * t, wy + (ey - wy) * t + sag
            c.p(x, y, 'I' if k % 2 else 'i'); c.p(x, y - 1, 'h' if k % 2 else 'k')
    # ---- the hammer at rest, leaning by his right side (behind his leg)
    if not attack:
        c.line(CX + 17, 31 + by, CX + 18, 38, 'iron', 2.4)                         # the haft, from his fist to the head on the ground
        c.poly([(CX + 9.6, 37.0), (CX + 24.4, 37.0), (CX + 24.4, 47.4), (CX + 9.6, 47.4)], 'slag')   # the head: a block of cooled slag
        for x in (CX + 12, CX + 22): c.line(x, 37.0, x, 47.2, 'iron', 1.6)           # its iron bands
        crack(c, [(CX + 10, 40), (CX + 13, 42), (CX + 16, 41), (CX + 18, 43), (CX + 21, 42), (CX + 24, 44)], heat + (1 if act == 3 else 0), f)
    # ---- the legs and the loins
    for s in (-1, 1):
        c.line(CX + s * 5, 35 + by, CX + s * 6.5, 44, body, 5.5)
        c.ell(CX + s * 7.5, 45.2, 4.2, 2.4, body)                                      # the feet
        c.line(CX + s * 6.2, 39.5, CX + s * 9.2, 38.4, body, 1.6)                      # a knee-spike
    c.poly([(CX - 9, 31 + by), (CX + 9, 31 + by), (CX + 8, 37 + by), (CX - 8, 37 + by)], body)
    for k in range(-3, 4):                                                              # a skirt of chain links under the plate
        c.p(CX + k * 2.4, 38 + by + (k % 2), 'I'); c.p(CX + k * 2.4, 39 + by + (k % 2), 'i')
    # ---- the body: a breastplate cracked round the core
    c.poly([(CX - 11, 15 + by), (CX + 11, 15 + by), (CX + 9, 32 + by), (CX - 9, 32 + by)], body)
    if act == 3:                                                                        # III: a crust of glass left here and there on the magma
        for (x0, y0, w, h) in ((CX - 9, 17, 5, 4), (CX + 5, 19, 4, 5)):
            c.poly([(x0, y0 + by), (x0 + w, y0 + by), (x0 + w - 1, y0 + h + by), (x0 + 1, y0 + h + by)], 'glass')
    for x in range(CX - 8, CX + 9): c.p(x, 29 + by, 'k')                               # the plates' seams
    for y in range(16 + by, 19 + by): c.p(CX, y, 'k')
    for (x, y) in ((CX - 9, 16), (CX - 8, 17), (CX - 10, 14), (CX - 16, 13), (CX + 6, 16)): c.p(x, y + by, 'W' if act < 3 else 'm')   # glints
    if act == 3:                                                                        # III: the crust split by fire everywhere
        for pts in ([(CX - 10, 16), (CX - 6, 21), (CX - 9, 27)], [(CX + 10, 17), (CX + 6, 23), (CX + 8, 29)], [(CX - 7, 33), (CX - 6, 40), (CX - 8, 44)],
                    [(CX + 6, 33), (CX + 7, 39), (CX + 6, 44)], [(CX - 17, 14), (CX - 12, 17), (CX - 15, 22)], [(CX + 17, 14), (CX + 12, 18), (CX + 16, 24)]):
            crack(c, [(x, y + by) for x, y in pts], 4, f)
    # the core: a rift in the chest, molten, ribbed with glass
    for y in range(18 + by, 30 + by):                                                   # a jagged rift, widest at the heart
        t = (y - 18 - by) / 11; w = 3.6 * math.sin(t * math.pi) + (0.8 if (y + f) % 3 == 0 else 0)
        for x in range(round(CX - w), round(CX + w) + 1):
            d = abs(x - CX) / max(0.6, w); hot(c, x, y, 5 if d < 0.35 else 4 if d < 0.7 else 3, f)
        c.p(round(CX - w) - 1, y, 'k'); c.p(round(CX + w) + 1, y, 'k')                 # its torn edges
    # magma veins branching out of the core
    for pts in ([(CX - 4, 22), (CX - 7, 19), (CX - 9, 18)], [(CX + 4, 21), (CX + 7, 18), (CX + 10, 17)], [(CX - 3, 27), (CX - 6, 30), (CX - 6, 33)],
                [(CX + 3, 27), (CX + 5, 31), (CX + 8, 32)], [(CX - 7, 19), (CX - 8, 23)], [(CX + 7, 18), (CX + 8, 22)]):
        crack(c, [(x, y + by) for x, y in pts], heat if act < 3 else 4, f)
    # ---- the arms (raised with the hammer, or hanging heavy, manacled)
    for s in (-1, 1):
        if attack:
            c.line(CX + s * 13, 18, CX + s * 9, 9, body, 5.5); c.line(CX + s * 9, 9, CX + s * 4, 6, body, 4.5)
            c.ell(CX + s * 4, 6, 3.2, 2.8, body)
        else:
            c.line(CX + s * 13, 18 + by, CX + s * 16, 25 + by, body, 6.2)               # the upper arm
            c.line(CX + s * 16, 25 + by, CX + s * 16.5, 31 + by, body, 5.4)             # the forearm
            c.ell(CX + s * 16.5, 32.4 + by, 3.8, 3.0, body)                              # the gauntlet
            c.poly([(CX + s * 13.4, 26.4 + by), (CX + s * 19.6, 26.4 + by), (CX + s * 19.6, 28.8 + by), (CX + s * 13.4, 28.8 + by)], 'iron')   # the manacle
            for k in range(3): c.p(CX + s * (14.5 + k * 1.6), 35.4 + by, 'S'); c.p(CX + s * (14.5 + k * 1.6), 36.2 + by, 'k')   # its claws
    # ---- the pauldrons, bristling with shards
    for s in (-1, 1):
        c.ell(CX + s * 12, 16 + by, 7.2, 5.4, body)
        for (a0, a1, tip) in (((11.0, 13.0), (15.4, 12.6), (15.2, 2.2)), ((16.0, 13.4), (19.4, 15.6), (23.0, 6.4))):   # shards: wide at the root, a point
            c.poly([(CX + s * a0[0], a0[1] + by), (CX + s * tip[0], tip[1] + by), (CX + s * a1[0], a1[1] + by)], 'glass')
        crack(c, [(CX + s * 8, 15 + by), (CX + s * 12, 17 + by), (CX + s * 16, 16 + by)], max(1, heat - 1), f)
    # ---- the head: low between the pauldrons, the great horns sweeping back
    hy = 13 + by
    for s in (-1, 1):
        pts = [(CX + s * 4.5, hy - 3), (CX + s * 9.5, hy - 5.5), (CX + s * 13.5, hy - 8.5), (CX + s * 15.2, hy - 11.5), (CX + s * 14.2, hy - 13.2)]
        for k, ((x0, y0), (x1, y1)) in enumerate(zip(pts, pts[1:])): c.line(x0, y0, x1, y1, 'horn', 4.0 - k * 0.75)
        for k in range(3): c.p(CX + s * (8 + k * 2), hy - 5 - k * 1.4, 'n')                # the ridges of the horn
        if act >= 2: hot(c, CX + s * 14.2, hy - 13, 4, f); hot(c, CX + s * 15, hy - 12, 3, f)   # (II: their tips alight)
    c.ell(CX, hy, 7.0, 6.4, 'glass')                                                  # the helm
    c.poly([(CX - 6, hy - 1), (CX + 6, hy - 1), (CX + 5, hy + 1), (CX - 5, hy + 1)], 'glass')   # the brow
    c.poly([(CX - 6, hy + 3), (CX + 6, hy + 3), (CX + 3.6, hy + 9), (CX - 3.6, hy + 9)], 'glass')   # the jaw-guard
    for x in (CX - 3, CX - 1, CX + 1, CX + 3): c.p(x, hy + 8, 'W'); c.p(x, hy + 9, 'S'); c.p(x, hy + 10, 'k')   # its fangs
    for s in (-1, 1): c.p(CX + s * 5, hy - 3, 'W'); c.p(CX + s * 2, hy - 5, 'S' if s < 0 else 'B')   # a glint on the helm
    # the visor: two slits slanting down to the nose-guard, a glare, and the fire behind them
    for s in (-1, 1):
        for k in range(5): hot(c, CX + s * (5 - k), hy - 1 + k * 0.6, 4 if k else 3, f)
        c.p(CX + s * 3, hy + 0.6, 'w')                                                 # his eyes, white-hot
    for y in range(hy - 2, hy + 4): c.p(CX, y, 'k')                                     # the nose-guard
    c.p(CX, hy - 3, 'S')
    # ---- the hammer raised overhead in both hands
    if attack:
        c.line(CX, 7, CX, 1, 'iron', 2.4)
        c.poly([(CX - 12, -0.6), (CX + 12, -0.6), (CX + 13, 6.4), (CX - 13, 6.4)], 'slag')
        for x in (CX - 7, CX + 7): c.line(x, -0.4, x, 6.2, 'iron', 1.4)
        crack(c, [(CX - 9, 2), (CX - 4, 3), (CX, 1), (CX + 5, 3), (CX + 9, 2)], 4 if act < 3 else 5, f)
    # ---- molten drips running down him (they move frame to frame)
    if not attack:
        for (x, y0) in ((CX - 1, 29), (CX + 2, 30), (CX - 6, 33)):
            y = y0 + by + (f * 2 + x) % 5
            hot(c, x, y, 4, f); hot(c, x, y + 1, 3, f)
    # ---- II and III: embers rising off him; III: a crown of fire on the horns, the hammer ablaze
    if act >= 2:
        for k in range(6 if act == 2 else 10):
            a = k * 2.399; x = CX + math.cos(a) * (15 + (k % 3) * 3); y = 24 + math.sin(a) * 14 - ((f * 3 + k * 2) % 9)
            hot(c, x, y, 3 + (k + f) % 3, f)
    if act == 3:
        for s in (-1, 0, 1):
            for j in range(4):
                x = CX + s * (6 if s else 0) + ((f + j) % 3 - 1) * (j > 1); y = hy - 7 - j - (2 if not s else 0)
                hot(c, x, y + (0 if s else 1), 5 - j, f)
        if not attack:
            for (x, y) in ((CX + 14, 39), (CX + 18, 38), (CX + 22, 38)): hot(c, x, y - (f % 2), 4, f)
    return c.outline('o').rows()


def fall(k):
    """three death frames: the crust cracks white, crumbles to ash, slumps to a heap still glowing"""
    rnd = random.Random(70 + k); g = [list(r) for r in ashkar(3, 0)]
    for y in range(N):
        for x in range(N):
            if g[y][x] not in ('.', 'o') and rnd.random() < 0.25 + 0.3 * k:
                g[y][x] = 'z' if (x + y) % 2 else 'Z'
                if rnd.random() < 0.12 * (3 - k): g[y][x] = 'F'
    if k == 2:
        sh = [['.'] * N for _ in range(N)]
        for y in range(N):
            for x in range(N):
                if y + 14 < N and g[y][x] != '.' and rnd.random() < 0.65: sh[y + 14][x] = g[y][x]
        return [''.join(r) for r in sh]
    return [''.join(r) for r in g]


def pack(name, cell, cols, entries):
    rows = (len(entries) + cols - 1) // cols; W, H = cols * cell, rows * cell
    px = [[(0, 0, 0, 0)] * W for _ in range(H)]; fr = {}
    for i, (key, grid) in enumerate(entries):
        ox, oy = (i % cols) * cell, (i // cols) * cell
        for y, row in enumerate(grid):
            for x, ch in enumerate(row):
                if ch in PAL: h = PAL[ch]; px[oy + y][ox + x] = (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), 255)
        fr[key] = [ox, oy, len(grid[0]), len(grid)]
    write_png(os.path.join(out, name + '.png'), px)
    return fr, px


if __name__ == '__main__':
    BID, NAMES = 'ashkar_gatekeeper', {1: 'The Gate Holds', 2: 'The Caldera Wakes', 3: 'Unchained'}
    frames = []
    for act in (1, 2, 3):
        frames += [(f'i{act}_{k}', ashkar(act, k)) for k in range(4)] + [(f'a{act}', ashkar(act, 0, True)), (f'a{act}b', ashkar(act, 2, True))]
    frames += [(f'd{k}', fall(k)) for k in range(3)]
    fr, px = pack(BID, N, 6, frames)
    anims = {}
    for act in (1, 2, 3):
        anims[f'idle{act}'] = {'frames': [f'i{act}_{k}' for k in range(4)], 'fps': 6, 'loop': True}
        anims[f'attack{act}'] = {'frames': [f'a{act}', f'a{act}b', f'a{act}'], 'fps': 6, 'loop': False}
    anims['death'] = {'frames': ['d0', 'd1', 'd2'], 'fps': 3, 'loop': False}
    sheets = {f'bx_{BID}': {'image': f'{BID}.png', 'kind': 'boss', 'sprites': {BID: {'frames': fr, 'anims': anims,
              'phases': {str(a): {'name': NAMES[a], 'idle': f'idle{a}', 'attack': f'attack{a}'} for a in (1, 2, 3)}, 'death': 'death', 'meta': {}}}}}
    json.dump({'rf': True, 'meta': {'name': 'Ashkar, the Gatekeeper (the Throne of Solkhar)', 'version': 2}, 'sheets': sheets},
              open(os.path.join(out, 'atlas_gatekeeper.json'), 'w', encoding='utf8', newline='\n'), indent=1)
    ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
    if 'throne/atlas_gatekeeper.json' not in idx['atlases']:
        idx['atlases'].append('throne/atlas_gatekeeper.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
    S = 4; W = len(px[0]); P = [[(58, 40, 36, 255)] * (W * S) for _ in range(len(px) * S)]
    for y in range(len(px)):
        for x in range(W):
            if px[y][x][3]:
                for dy in range(S): P[y * S + dy][x * S:(x + 1) * S] = [px[y][x]] * S
    write_png(os.path.join(root, 'art', '_proto', 'ashkar_preview.png'), P)
    print('Ashkar:', len(frames), 'frames')
