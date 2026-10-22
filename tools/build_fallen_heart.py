# The Fallen Heart: the Heart of Godfall's boss on the three-phase engine (src/bosses/fallen_heart.js): its art.
# "When the god fell, its heart rolled down into the earth, and it kept beating. Gold grew around it like scar tissue."
# A god's heart the size of a cart: dark red muscle, its great vessels cut and sealed with gold, gold scars (kintsugi)
# across it, held in a cage of gold ribs. Three looks:
#   1 It Still Beats               - caged; two frames, contracted and swollen (it beats)
#   2 The Saints Pray              - the cage cracked open, the scars glowing, prayer-light dripping into it
#   3 It Remembers Being a God     - a halo of gold thorns over it, the scars white-hot, an eye opening in the muscle
# An attack frame (swollen, the scars flaring), a three-frame death (it stops; it greys; the gold falls away).
# Also the kneeling saints (24-pixel cells) and its shots.
#   art/bundle/heart/fallen_heart.png, heart_shots.png, heart_saint.png + atlas_fallen_heart.json
#   py -I tools/build_fallen_heart.py
import json, math, os, random, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
out = os.path.join(root, 'art', 'bundle', 'heart')
os.makedirs(out, exist_ok=True)
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402
from pixcanvas import Cv  # noqa: E402

PAL = {
    'o': '#0a0810',
    'm': '#5a0e1e', 'M': '#8e1a2c', 'r': '#c8323e', 'R': '#ff6a6a',   # the muscle, dark to bright
    'v': '#3a1a4a', 'V': '#6a3a8a',                                   # veins
    'g': '#a8822e', 'G': '#f2d070', 'W': '#fff6c8',                   # gold, and white-hot gold
    'f': '#3a2a10',                                                   # the cage's shadowed gold
    'e': '#fff6c8', 'E': '#ff3a1a',                                   # the eye
    'h': '#e8e0f8', 'H': '#ffffff',                                   # prayer-light
    's': '#9aa4c8', 'S': '#d8e0f8', 'x': '#5a6488',                   # the saints, ghost-pale
    'k': '#7a7a86',                                                   # dead grey
}
N = 48


def heart(act=1, f=0, attack=False):
    c = Cv(); rnd = random.Random(3)
    sw = 1.0 if attack else (1.06 if f % 2 else 0.94)                  # it beats: contracted, swollen
    cx, cy = 24, 27
    # act 3: a halo of gold thorns behind it
    if act == 3:
        for k in range(14):
            a = -math.pi + k / 13 * math.pi
            x0, y0 = cx + math.cos(a) * 16, 15 + math.sin(a) * 10
            c.line(x0, y0, cx + math.cos(a) * 21, 15 + math.sin(a) * 14, 'G')
        for k in range(30):
            a = -math.pi + k / 29 * math.pi; c.p(cx + math.cos(a) * 16, 15 + math.sin(a) * 10, 'g')
    # the great vessels on top: cut, sealed with gold caps
    for (x0, x1, w) in ((cx - 6, cx - 9, 4), (cx + 1, cx + 2, 5), (cx + 7, cx + 11, 3)):
        c.line(x0, cy - 8 * sw, x1, cy - 17 * sw, 'M', w); c.line(x0 - 1, cy - 8 * sw, x1 - 1, cy - 16 * sw, 'r')
        c.rect(x1 - w / 2, cy - 18 * sw, x1 + w / 2, cy - 17 * sw, 'G')
    # the muscle: two lobes and a point, shaded
    c.ell(cx - 5, cy - 2, 9 * sw, 9 * sw, 'm'); c.ell(cx + 5, cy - 1, 9 * sw, 10 * sw, 'm')
    for y in range(int(cy + 4), int(cy + 18 * sw)):
        t = (y - cy - 4) / (14 * sw); w = 17 * sw * (1 - t)
        c.rect(cx - w / 2 + 1, y, cx + w / 2 + 1, y, 'm')
    c.ell(cx - 5, cy - 3, 7 * sw, 7 * sw, 'M'); c.ell(cx + 4, cy - 2, 6 * sw, 7 * sw, 'M')
    c.ell(cx - 7, cy - 6, 3 * sw, 2.5 * sw, 'r'); c.p(cx - 8, cy - 7, 'R')
    # veins across it
    for (pts) in (((cx - 10, cy), (cx - 4, cy + 4), (cx - 1, cy + 11)), ((cx + 9, cy - 4), (cx + 4, cy + 3), (cx + 3, cy + 9))):
        for a, b in zip(pts, pts[1:]): c.line(a[0], a[1], b[0], b[1], 'V' if act > 1 else 'v')
    # the gold scars (kintsugi): jagged seams across the muscle
    scar = 'W' if act == 3 or attack else 'G'
    for (x0, y0, x1, y1) in ((cx - 12, cy - 4, cx - 2, cy + 2), (cx - 2, cy + 2, cx + 6, cy - 6), (cx + 1, cy + 6, cx + 10, cy + 2), (cx - 6, cy + 9, cx, cy + 14)):
        m = 4
        for k in range(m):
            ax, ay = x0 + (x1 - x0) * k / m, y0 + (y1 - y0) * k / m + (1 if k % 2 else -1)
            bx, by = x0 + (x1 - x0) * (k + 1) / m, y0 + (y1 - y0) * (k + 1) / m + (-1 if k % 2 else 1)
            c.line(ax, ay, bx, by, scar)
    # act 3: an eye opening in the muscle
    if act == 3:
        c.ell(cx + 1, cy + 1, 4, 2.2, 'o'); c.ell(cx + 1, cy + 1, 3, 1.5, 'e'); c.ell(cx + 1, cy + 1, 1.2, 1.4, 'E'); c.p(cx + 1, cy + 1, 'o')
    # the cage: gold ribs over it (whole in act 1; cracked and bent open in 2 and 3)
    for k, x in enumerate((cx - 13, cx - 7, None, cx + 7, cx + 13)):
        if x is None: continue                                         # (no bar down its middle: the heart shows)
        if act >= 2 and k in (1, 3):                                   # bent open
            c.line(x, cy - 12, x + (-5 if k == 1 else 5), cy - 4, 'g'); c.line(x + (-5 if k == 1 else 5), cy + 6, x, cy + 16, 'g')
            continue
        top, bot = cy - 13, cy + 17
        for y in range(top, bot + 1):
            bend = math.sin((y - top) / (bot - top) * math.pi) * (3 if x < cx else -3 if x > cx else 0)
            c.p(x - bend, y, 'G' if (y + k) % 3 else 'g')
    c.rect(cx - 14, cy - 14, cx + 14, cy - 13, 'g'); c.rect(cx - 13, cy - 14, cx + 13, cy - 14, 'G')   # the cage's crown
    c.rect(cx - 12, cy + 17, cx + 12, cy + 18, 'g')
    # act 2: prayer-light dripping down into it from above
    if act == 2:
        for x in (cx - 9, cx + 4, cx + 11):
            for y in range(2, int(cy - 14)):
                if (y + x) % 3: c.p(x, y, 'h' if y % 2 else 'H')
    if attack:                                                         # a flare round it as it beats hard
        for k in range(16):
            a = k / 16 * math.tau; c.p(cx + math.cos(a) * 20, cy + math.sin(a) * 18, 'R' if k % 2 else 'G')
    return c.outline().rows()


def death(k):
    rnd = random.Random(21 + k)
    g = [list(r) for r in heart(1, 0)]
    if k >= 0:                                                        # it stops: the red goes grey
        for y in range(N):
            for x in range(N):
                if g[y][x] in 'mMrR': g[y][x] = 'k' if (x + y) % 3 == 0 else ('m' if k == 0 else 'k')
    if k >= 1:                                                        # the gold falls away
        for y in range(N):
            for x in range(N):
                if g[y][x] in 'gGW' and rnd.random() < 0.5 + 0.25 * k: g[y][x] = '.'
    if k >= 2:
        sh = [['.'] * N for _ in range(N)]
        for y in range(N):
            for x in range(N):
                ny = y + 8
                if ny < N and g[y][x] != '.': sh[ny][x] = g[y][x]
        for _ in range(20): x = rnd.randrange(6, 42); sh[46][x] = rnd.choice('gG')
        return [''.join(r) for r in sh]
    return [''.join(r) for r in g]


def saint(f=0):                                                       # a kneeling saint, ghost-pale, hands together, praying
    c = Cv(24); by = f % 2
    c.trap(12, 10 + by, 21, 6, 14, 's'); c.trap(11, 11 + by, 21, 2, 6, 'S')     # the robe, kneeling
    c.rect(5, 20, 19, 21, 'x')
    c.ell(12, 7 + by, 3.2, 3.4, 'S'); c.rect(9, 4 + by, 15, 6 + by, 's')          # the head, hooded
    c.p(11, 8 + by, 'x'); c.p(13, 8 + by, 'x')
    c.line(12, 12 + by, 12, 15 + by, 'H'); c.ell(12, 13 + by, 1.6, 2.2, 'h')       # hands together
    for k in range(12):
        a = k / 12 * math.tau; c.p(12 + math.cos(a) * 5, 2 + by + math.sin(a) * 1.4, 'G')   # a halo
    return c.outline().rows()


def pack(name, cell, cols, entries):
    rows = (len(entries) + cols - 1) // cols; W, H = cols * cell, rows * cell
    px = [[(0, 0, 0, 0)] * W for _ in range(H)]; sprites = {}
    for i, (key, grid) in enumerate(entries):
        ox, oy = (i % cols) * cell, (i // cols) * cell
        for y, row in enumerate(grid):
            for x, ch in enumerate(row):
                if ch in PAL: h = PAL[ch]; px[oy + y][ox + x] = (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), 255)
        sprites[key] = {'frames': {'0': [ox, oy, len(grid[0]), len(grid)]}, 'meta': {}}
    write_png(os.path.join(out, name + '.png'), px)
    return sprites


frames = []
for act in (1, 2, 3):
    frames += [(f'i{act}_0', heart(act, 0)), (f'i{act}_1', heart(act, 1)), (f'a{act}', heart(act, 0, True))]
frames += [(f'd{k}', death(k)) for k in range(3)]
sp = pack('fallen_heart', N, 6, frames)
fr = {k: v['frames']['0'] for k, v in sp.items()}
anims = {}
for act in (1, 2, 3):
    anims[f'idle{act}'] = {'frames': [f'i{act}_0', f'i{act}_1'], 'fps': 2 + act, 'loop': True}   # (it beats faster as it goes)
    anims[f'attack{act}'] = {'frames': [f'a{act}'] * 3, 'fps': 6, 'loop': False}
anims['death'] = {'frames': ['d0', 'd1', 'd2'], 'fps': 2, 'loop': False}
names = {1: 'It Still Beats', 2: 'The Saints Pray', 3: 'It Remembers Being a God'}
phases = {str(a): {'name': names[a], 'idle': f'idle{a}', 'attack': f'attack{a}'} for a in (1, 2, 3)}
ssp = pack('heart_saint', 24, 2, [('s0', saint(0)), ('s1', saint(1))])
sfr = {k: v['frames']['0'] for k, v in ssp.items()}
SHOTS = {
    'gaze': ['........', '..RRR...', '.RrrrR..', '.RrERr..', '.RrrrR..', '..RRR...', '........', '........'],
    'kintsugi': ['........', '....G...', '...GW...', '..GWG...', '.GWG....', '.GG.....', '........', '........'],
    'blood': ['........', '...r....', '..rRr...', '.rRRRr..', '.rRRRr..', '..rrr...', '........', '........'],
    'prayer': ['........', '...h....', '..hHh...', '.hHHHh..', '..hHh...', '...h....', '........', '........'],
    'ichor': ['........', '..GG....', '.GWWG...', '.GWWG...', '..GG....', '........', '........', '........'],
}
shot_sp = pack('heart_shots', 8, 8, [(f'fallen_heart.{k}', g) for k, g in SHOTS.items()])
atlas = {'rf': True, 'meta': {'name': 'The Fallen Heart on the three-phase engine', 'version': 1}, 'sheets': {
    'bx_fallen_heart': {'image': 'fallen_heart.png', 'kind': 'boss', 'sprites': {'fallen_heart': {'frames': fr, 'anims': anims, 'phases': phases, 'death': 'death', 'meta': {}}}},
    'heart_saint': {'image': 'heart_saint.png', 'kind': 'enemy', 'sprites': {'saint': {'frames': sfr, 'anims': {'move': {'frames': ['s0', 's1'], 'fps': 2, 'loop': True}, 'attack': {'frames': ['s0'], 'fps': 2, 'loop': False}}, 'meta': {}}}},
    'heart_shots': {'image': 'heart_shots.png', 'kind': 'shot', 'sprites': shot_sp}}}
json.dump(atlas, open(os.path.join(out, 'atlas_fallen_heart.json'), 'w', encoding='utf8', newline='\n'), indent=1)
ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
if 'heart/atlas_fallen_heart.json' not in idx['atlases']:
    idx['atlases'].append('heart/atlas_fallen_heart.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
pv = [g for k, g in frames if k in ('i1_0', 'i1_1', 'i2_0', 'i3_0', 'a3', 'd1', 'd2')]
K = 4; P = []
for y in range(N * K):
    row = []
    for x in range(N * K * len(pv)):
        ch = pv[x // (N * K)][y // K][(x // K) % N]
        h = PAL.get(ch); row.append((int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), 255) if h else (42, 40, 51, 255))
    P.append(row)
write_png(os.path.join(root, 'art', '_proto', 'fallen_heart_preview.png'), P)
print('the Fallen Heart art -> art/bundle/heart')
