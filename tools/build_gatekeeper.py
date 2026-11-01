# Ashkar, the Gatekeeper: the guardian of Solkhar's gate, in the Guardian's hall of the volcano island
# (src/bosses/ashkar_gatekeeper.js). 2026-11-01, drawn to the user's concept sheet ("Ashkar, the Chained Forge-Giant"):
# a hulking giant in layered plates of iron and obsidian over a body of volcanic stone, a horned helm with a molten V for
# a glare, stacked pauldrons, banded belly-plates and a plated skirt, a barrel hammer with bands of molten iron resting
# at his side. Sculpted (tools/sculpt.py), lit from the upper left; the lava pulses along every crack frame to frame.
#   I   Chained     - fully armoured, chains crossed over his chest and run out to the walls, the core a barred grille
#   II  Fracturing  - the armour cracked and failing, lava in the cracks, the core exposed (a molten orb)
#   III Enraged     - the chains broken (links lie at his feet), the core unleashed (a star of fire across his chest),
#                     lava running through every plate, his horns aflame
#   Four idle frames a phase (he breathes; the lava pulses), the strike (the hammer raised overhead), a three-frame death.
#   art/bundle/throne/ashkar_gatekeeper.png + atlas_gatekeeper.json          py -I tools/build_gatekeeper.py
import json, math, os, random, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
out = os.path.join(root, 'art', 'bundle', 'throne')
os.makedirs(out, exist_ok=True)
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402
from sculpt import Sculpt  # noqa: E402

# the concept sheet's colours: iron / obsidian, volcanic stone, the molten core
PAL = {
    'o': '#0e0a12', 'd': '#1c1822', 'i': '#2c2834', 'I': '#433d4e', 'h': '#615a70', 'H': '#8c84a2', 'C': '#c8c2d8',   # iron / obsidian (C: the chains' shine)
    'r': '#3a1214', 'R': '#5e1c1c', 'Q': '#862c26', 'q': '#a83a2a',                                     # volcanic stone
    'l': '#c8381a', 'L': '#ff6a1c', 'y': '#ffa22c', 'Y': '#ffd660', 'w': '#fff4c4',                     # lava, dull to white-hot
    'z': '#2e2830', 'Z': '#4a4048',                                                                     # ash (the death)
    'e': '#c2461e', 'E': '#e8682a',                                                                     # III: stone glowing through
}
IRON = ['d', 'i', 'I', 'h', 'H']; STONE = ['r', 'R', 'Q', 'q']
HOTSTONE = ['r', 'R', 'Q', 'e']                                                         # III: the stone glowing red-hot
LAVA = ['r', 'l', 'L', 'y', 'Y', 'w']
N = 48
CX = 24


def hot(c, x, y, k, f):
    """a lava pixel at heat k (0..5), pulsing: the glow runs along the crack as the frames turn"""
    k = k + (1 if (x + y * 2 + f * 3) % 7 < 2 else 0) - (1 if (x * 3 + y + f * 5) % 11 == 0 else 0)
    c.p(x, y, LAVA[max(0, min(5, k))])


def crack(c, pts, k, f):
    """a crack of lava along a polyline"""
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
        for i in range(n + 1):
            t = i / n; hot(c, round(x0 + (x1 - x0) * t), round(y0 + (y1 - y0) * t), k, f)


def chain(c, x0, y0, x1, y1, sag=0.0):
    """a chain of iron links, sagging"""
    n = int(math.hypot(x1 - x0, y1 - y0) / 1.5)
    for k in range(n + 1):
        t = k / max(1, n); x = x0 + (x1 - x0) * t; y = y0 + (y1 - y0) * t + math.sin(t * math.pi) * sag
        if k % 2: c.p(x, y, 'H'); c.p(x + 1, y, 'h'); c.p(x, y + 1, 'o')
        else: c.p(x - 1, y, 'o'); c.p(x, y - 1, 'C'); c.p(x, y, 'h'); c.p(x, y + 1, 'o'); c.p(x + 1, y - 1, 'o')


def hammer(c, x, y, f, heat):
    """the barrel hammer: a drum of iron bound with bands of molten metal, end-caps of dark iron"""
    w, h = 13, 10
    c.poly([(x - w / 2, y - h / 2 + 1), (x - w / 2 + 1, y - h / 2), (x + w / 2 - 1, y - h / 2), (x + w / 2, y - h / 2 + 1),
            (x + w / 2, y + h / 2 - 1), (x + w / 2 - 1, y + h / 2), (x - w / 2 + 1, y + h / 2), (x - w / 2, y + h / 2 - 1)], 'iron')
    for bx in (x - 3.5, x, x + 3.5):                                                   # the molten bands
        for yy in range(int(y - h / 2) + 1, int(y + h / 2)):
            hot(c, round(bx), yy, heat + (1 if abs(yy - y) < 2 else 0), f); hot(c, round(bx) + 1, yy, heat - 1, f)
    for ex in (x - w / 2, x + w / 2 - 1):                                             # its end-caps
        for yy in range(int(y - h / 2) + 1, int(y + h / 2)): c.p(ex, yy, 'd')


def ashkar(act=1, f=0, attack=False):
    c = Sculpt(N, N, {'iron': ['o', 'd', 'i', 'I', 'h'] if act == 3 else IRON, 'stone': HOTSTONE if act == 3 else STONE}, amb=0.3)   # (III: what iron is left, charred)
    by = 0 if attack else (0, 0, 1, 1)[f % 4]                                           # he breathes
    heat = {1: 2, 2: 3, 3: 4}[act]
    # ---- behind him: the chains to the walls (I)
    if act == 1 and not attack:
        for s in (-1, 1): chain(c, CX + s * 15, 31 + by, CX + s * 23.5, 18, sag=2)
    # ---- the hammer at rest, by his side (his right hand: the left of the picture)
    if not attack:
        c.line(CX - 13, 31 + by, CX - 15, 38, 'stone', 2.4)                             # the haft, volcanic stone
        hammer(c, CX - 16.5, 42, f, heat)
    # ---- the legs, wide-set; the greaves; the knees
    for s in (-1, 1):
        c.line(CX + s * 5.5, 33 + by, CX + s * 7.5, 43.5, 'stone', 6.4)
        c.line(CX + s * 7, 37.5, CX + s * 7.8, 44, 'iron', 5.6)                          # the greave
        c.ell(CX + s * 6.6, 37 + by * 0.5, 3.4, 2.6, 'iron')                            # the knee-plate
        c.ell(CX + s * 8.6, 45.4, 4.6, 2.2, 'iron')                                     # the foot
    # ---- the body: volcanic stone, under the plates
    c.poly([(CX - 10, 14 + by), (CX + 10, 14 + by), (CX + 8.6, 33 + by), (CX - 8.6, 33 + by)], 'stone')
    # the plated skirt: two tabs a side, a tabard of stone between them with a burning point
    for s in (-1, 1):
        for k, dx in enumerate((3.6, 7.4)):
            x0 = CX + s * dx
            c.poly([(x0 - 2.2, 32 + by), (x0 + 2.2, 32 + by), (x0 + 1.8, 37.5 + by - k * 0.8), (x0 - 1.8, 37.5 + by - k * 0.8)], 'iron')
    c.poly([(CX - 1.8, 32 + by), (CX + 1.8, 32 + by), (CX + 1.4, 38 + by), (CX, 39.6 + by), (CX - 1.4, 38 + by)], 'stone')
    hot(c, CX, 39 + by, heat, f); hot(c, CX, 38 + by, heat - 1, f)
    # the belly: two bands of plate, stone between
    for yb in (() if act == 3 else (26.5, 29.5)):                                       # (III: torn away)
        c.poly([(CX - 8.2, yb + by), (CX + 8.2, yb + by), (CX + 7.8, yb + 2.2 + by), (CX - 7.8, yb + 2.2 + by)], 'iron')
    # the breastplates, either side of the core
    for s in (-1, 1):
        if act == 3: c.poly([(CX + s * 10.5, 14.5 + by), (CX + s * 7.2, 15 + by), (CX + s * 8.2, 19 + by), (CX + s * 10, 19.6 + by)], 'iron')   # (III: a shard of it left)
        else: c.poly([(CX + s * 10.5, 14.5 + by), (CX + s * 3.2, 15.5 + by), (CX + s * 3.2, 25.6 + by), (CX + s * 9.4, 25.6 + by)], 'iron')
    # ---- the core
    if act == 1:                                                                         # a barred grille, the fire behind it
        for y in range(17 + by, 25 + by):
            for x in range(CX - 2, CX + 3): hot(c, x, y, 2 + (1 if abs(x - CX) < 2 else 0), f)
        for x in (CX - 2, CX + 2):
            for y in range(17 + by, 25 + by): c.p(x, y, 'd')
        for y in (16 + by, 25 + by):
            for x in range(CX - 2, CX + 3): c.p(x, y, 'd')
    elif act == 2:                                                                       # an orb of molten iron, the plates broken round it
        for y in range(16 + by, 27 + by):
            for x in range(CX - 5, CX + 6):
                d = math.hypot((x - CX) / 4.6, (y - 21.5 - by) / 4.8)
                if d <= 1: hot(c, x, y, 5 if d < 0.35 else 4 if d < 0.65 else 3, f)
    else:                                                                                # a star of fire across his chest
        for y in range(13 + by, 31 + by):
            for x in range(CX - 10, CX + 11):
                dx, dy = x - CX, y - 21.5 - by; a = math.atan2(dy, dx); r = math.hypot(dx, dy * 1.1)
                star = 3.6 + 3.4 * max(0, math.cos(a * 4)) ** 3
                if r <= star: hot(c, x, y, 5 if r < 2.4 else 4 if r < 4 else 3, f)
    if act == 3:                                                                         # III: veins of fire running out from it through the stone
        for k in range(10):
            a = k / 10 * math.tau + 0.3; L = 9 + (k % 3) * 2
            pts = [(CX + math.cos(a) * 3, 21.5 + by + math.sin(a) * 3), (CX + math.cos(a + 0.25) * L * 0.6, 21.5 + by + math.sin(a + 0.25) * L * 0.6), (CX + math.cos(a - 0.1) * L, 21.5 + by + math.sin(a - 0.1) * L * 1.1)]
            crack(c, pts, 3 + (k % 2), f)
    # ---- the arms: stone, the gauntlets iron, the fists
    for s in (-1, 1):
        if attack:
            c.line(CX + s * 12, 17, CX + s * 9, 8, 'stone', 6); c.line(CX + s * 9, 8, CX + s * 4, 4.5, 'iron', 5.4)
            c.ell(CX + s * 3.6, 4.2, 3.4, 3, 'iron')
        else:
            c.line(CX + s * 12, 17 + by, CX + s * 15, 25 + by, 'stone', 6)
            c.line(CX + s * 15, 24 + by, CX + s * 14.4, 30 + by, 'iron', 6.6)              # the gauntlet
            c.ell(CX + s * 14, 31.8 + by, 3.6, 3.0, 'iron')                                # the fist
            if act < 3: c.poly([(CX + s * 11.4, 27.4 + by), (CX + s * 17.6, 27.4 + by), (CX + s * 17.6, 29.4 + by), (CX + s * 11.4, 29.4 + by)], 'iron')   # the manacle
    # ---- the pauldrons: three plates stacked a side
    for s in (-1, 1):
        for (dx, dy, rx, ry) in ((16.4, 19.6, 4.6, 3.0), (15.0, 16.4, 6.0, 3.8), (12.6, 12.8, 7.2, 4.6)):
            c.ell(CX + s * dx, dy + by, rx, ry, 'iron')
            for k in range(-int(rx) + 2, int(rx) - 1): c.p(CX + s * dx + k, dy - ry + 1 + by, 'H' if act < 3 else 'h')   # its lit edge
    # ---- the chains crossed over his chest (I)
    if act == 1 and not attack:
        chain(c, CX - 12, 13 + by, CX + 8, 31 + by); chain(c, CX + 12, 13 + by, CX - 8, 31 + by)
    # ---- II: a chain hanging loose from his wrist to the floor
    if act == 2 and not attack: chain(c, CX + 15, 30 + by, CX + 19, 46, sag=-1)
    # ---- the cracks of lava through the armour (II and III)
    if act >= 2:
        C = [[(CX - 9, 16), (CX - 6, 19), (CX - 7, 23)], [(CX + 9, 15), (CX + 6, 20), (CX + 8, 24)], [(CX - 6, 27), (CX - 3, 28)],
             [(CX - 14, 12), (CX - 11, 15), (CX - 13, 18)], [(CX + 14, 11), (CX + 12, 15)], [(CX - 15, 26), (CX - 14, 29)]]
        if act == 3: C += [[(CX + 6, 27), (CX + 2, 30)], [(CX + 15, 25), (CX + 14, 30)], [(CX - 7, 36), (CX - 8, 41)], [(CX + 7, 35), (CX + 8, 42)],
                           [(CX - 17, 17), (CX - 15, 21)], [(CX + 17, 18), (CX + 15, 21)], [(CX - 12, 31), (CX - 15, 33)], [(CX + 13, 31), (CX + 16, 33)]]
        for pts in C: crack(c, [(x, y + by) for x, y in pts], heat, f)
    # ---- the head: a helm sunk between the pauldrons, the horns, the glare
    hy = 9 + by
    for s in (-1, 1):
        pts = [(CX + s * 4.5, hy - 2), (CX + s * 8.5, hy - 3.5), (CX + s * 10.6, hy - 6.5), (CX + s * 10.4, hy - 9.5), (CX + s * 8.6, hy - 11)]
        if act == 3: pts = [(CX + s * 4.5, hy - 2), (CX + s * 9.5, hy - 4), (CX + s * 12.4, hy - 7.5), (CX + s * 12.6, hy - 11), (CX + s * 10.6, hy - 13)]
        for k, ((x0, y0), (x1, y1)) in enumerate(zip(pts, pts[1:])): c.line(x0, y0, x1, y1, 'stone', 3.4 - k * 0.6)
        tip = pts[-1]
        if act >= 2:                                                                     # the horns glowing (II: the tips; III: all of them, aflame)
            for (x0, y0), (x1, y1) in zip(pts[(1 if act == 3 else 2):], pts[(2 if act == 3 else 3):]): crack(c, [(x0, y0), (x1, y1)], heat - 1, f)
            hot(c, tip[0], tip[1], 4, f)
        else: c.p(tip[0], tip[1], 'L'); c.p(pts[-2][0], pts[-2][1], 'l')
        if act == 3:                                                                     # flames licking off them
            for j in range(3): hot(c, tip[0] + s * ((f + j) % 2), tip[1] - 1 - j, 4 - j, f)
    c.ell(CX, hy + 1, 6.4, 6.4, 'iron')                                                  # the helm
    c.poly([(CX - 4.6, hy + 1), (CX + 4.6, hy + 1), (CX + 3.6, hy + 7), (CX - 3.6, hy + 7)], 'iron')   # the face-plate
    for y in range(hy - 4, hy + 1): c.p(CX, y, 'H')                                      # its crest
    for s in (-1, 1):                                                                    # the glare: a molten V
        for k, (dx, dy) in enumerate(((4, 1.4), (3, 2.2), (2, 2.8), (1, 3.4))): hot(c, CX + s * dx, hy + dy, 4 if k < 2 else 3, f)
    c.p(CX - 3, hy + 2, 'w'); c.p(CX + 3, hy + 2, 'w')                                   # his eyes
    for y in range(hy + 4, hy + 8): c.p(CX, y, 'd')                                      # the face-plate's split
    # ---- the hammer raised overhead in both hands
    if attack:
        c.line(CX, 5, CX, 1, 'stone', 2.4)
        hammer(c, CX, 0.5, f, heat + 1)
    # ---- the broken chains at his feet (III)
    if act == 3 and not attack:
        for (x, y, n) in ((CX - 21, 46, 3), (CX + 12, 46.5, 4), (CX + 18, 45.5, 3)):
            for k in range(n): c.p(x + k * 1.5, y - (k % 2), 'h' if k % 2 else 'I')
    # ---- embers rising off him (II, III)
    if act >= 2:
        for k in range(5 if act == 2 else 9):
            a = k * 2.399; x = CX + math.cos(a) * (16 + (k % 3) * 3); y = 22 + math.sin(a) * 14 - ((f * 3 + k * 2) % 9)
            hot(c, x, y, 3 + (k + f) % 3, f)
    return c.outline('o').rows()


def fall(k):
    """three death frames: the plates crack white, crumble to ash, slump to a heap still glowing"""
    rnd = random.Random(70 + k); g = [list(r) for r in ashkar(3, 0)]
    for y in range(N):
        for x in range(N):
            if g[y][x] not in ('.', 'o') and rnd.random() < 0.25 + 0.3 * k:
                g[y][x] = 'z' if (x + y) % 2 else 'Z'
                if rnd.random() < 0.12 * (3 - k): g[y][x] = 'y'
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
    BID, NAMES = 'ashkar_gatekeeper', {1: 'Chained', 2: 'Fracturing', 3: 'Enraged'}
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
    json.dump({'rf': True, 'meta': {'name': 'Ashkar, the Gatekeeper (the Throne of Solkhar)', 'version': 3}, 'sheets': sheets},
              open(os.path.join(out, 'atlas_gatekeeper.json'), 'w', encoding='utf8', newline='\n'), indent=1)
    ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
    if 'throne/atlas_gatekeeper.json' not in idx['atlases']:
        idx['atlases'].append('throne/atlas_gatekeeper.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
    S = 4; W = len(px[0]); P = [[(28, 24, 32, 255)] * (W * S) for _ in range(len(px) * S)]
    for y in range(len(px)):
        for x in range(W):
            if px[y][x][3]:
                for dy in range(S): P[y * S + dy][x * S:(x + 1) * S] = [px[y][x]] * S
    write_png(os.path.join(root, 'art', '_proto', 'ashkar_preview.png'), P)
    print('Ashkar:', len(frames), 'frames')
