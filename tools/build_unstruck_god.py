# The Unstruck God on the three-phase engine (src/bosses/unstruck_god.js): his art, as a registry pack.
# A towering god in obsidian and gold, never once struck: a marble mask on a crowned head, a halo of blades turning
# behind him, pauldrons and claws of gold, robes that end in tatters, and the sun he stole burning in his chest.
# Three looks, one per act of the fight:
#   1 The Untouched   - pristine: the mask whole, eyes cold blue, the halo whole
#   2 The First Wound - a seam of molten gold splits the mask, the eyes go red, half the halo is shattered
#   3 The Stolen Sun  - his chest torn open, the sun held blazing in his raised claws, the crown broken, the hem on fire
# Each look: two idle frames (he bobs, the halo turns) and an attack frame (arms raised); a three-frame death (cracks,
# crumbling, a heap of rubble and the fallen crown). His shots: 'ug_shots/unstruck_god.<name>'.
#   art/bundle/unstruck/unstruck_god.png, ug_shots.png + atlas_unstruck.json
#   py -I tools/build_unstruck_god.py
import json, math, os, random, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
sys.path.insert(0, here)
from rf_build_items import Sheet  # noqa: E402
out = os.path.join(root, 'art', 'bundle', 'unstruck')
os.makedirs(out, exist_ok=True)

PAL = {
    'o': '#0a0610',                                   # outline
    'k': '#1a1028', 'K': '#2c1a44', 'q': '#4a2a70', 'Q': '#6a3aa8',   # obsidian robe, dark to light
    'g': '#f2c14e', 'G': '#a8792a', 'y': '#fff0a0', 'd': '#6a4a18',   # gold
    'w': '#ece8f4', 'W': '#b8b4c8', 'm': '#7e7a90',   # marble
    'c': '#8af6ff', 'r': '#ff3a4a', 'R': '#ffb0b8', 'C': '#ffffff',   # eyes
    's': '#ffd84a', 'S': '#ff8a1f', 'e': '#fff6c8',   # the sun
    'h': '#cfe8ff', 'H': '#ffffff', 'b': '#6e88a8',   # halo blades
    'f': '#ff6a1a', 'F': '#ffc94a',                   # fire
}
N = 48


class Cv:
    def __init__(self): self.g = [['.'] * N for _ in range(N)]
    def p(self, x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < N and 0 <= y < N: self.g[y][x] = c
    def rect(self, x0, y0, x1, y1, c):
        for y in range(int(y0), int(y1) + 1):
            for x in range(int(x0), int(x1) + 1): self.p(x, y, c)
    def ell(self, cx, cy, rx, ry, c):
        for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
            for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
                if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1: self.p(x, y, c)
    def line(self, x0, y0, x1, y1, c):
        n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
        for i in range(n + 1): t = i / n; self.p(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, c)
    def trap(self, y0, y1, xl0, xr0, xl1, xr1, c):    # a trapezoid, its edges from (xl0..xr0) at y0 to (xl1..xr1) at y1
        for y in range(int(y0), int(y1) + 1):
            t = (y - y0) / max(1, y1 - y0)
            self.rect(xl0 + (xl1 - xl0) * t, y, xr0 + (xr1 - xr0) * t, y, c)
    def outline(self):
        g = self.g; o = [row[:] for row in g]
        for y in range(N):
            for x in range(N):
                if g[y][x] != '.': continue
                if any(0 <= x + dx < N and 0 <= y + dy < N and g[y + dy][x + dx] not in ('.', 'o') for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))): o[y][x] = 'o'
        self.g = o
        return self
    def rows(self): return [''.join(r) for r in self.g]


def god(act=1, f=0, attack=False):
    c = Cv()
    by = 0 if attack else (f % 2)                       # the idle bob
    hy = 15 + by                                        # the head's middle
    D = 4                                               # (the body sits lower: room for the halo)
    # the halo of blades, turning behind his head (act 2: half shattered; act 3: burning fragments)
    nb = 14
    for k in range(nb):
        if act == 2 and k % 2: continue
        if act == 3 and k % 3 == 1: continue
        a = k / nb * math.tau + f * 0.22 + (0.5 if attack else 0)
        r0, r1 = 10, 14 if act < 3 else 13
        col = ('h', 'H') if act < 3 else ('f', 'F')
        c.line(24 + math.cos(a) * r0, hy + math.sin(a) * r0 * 0.85, 24 + math.cos(a) * r1, hy + math.sin(a) * r1 * 0.85, col[0])
        c.p(24 + math.cos(a) * r1, hy + math.sin(a) * r1 * 0.85, col[1])
    # the robe: an obsidian bell that ends in tatters (act 3: the hem burns)
    c.trap(19 + D + by, 46, 15, 33, 6, 42, 'k')
    c.trap(19 + D + by, 46, 18, 22, 10, 16, 'K'); c.trap(19 + D + by, 46, 27, 30, 32, 37, 'K')
    c.trap(21 + D + by, 46, 23, 25, 22, 26, 'q')           # a fold of light down the middle
    for x in range(6, 43, 3):
        c.p(x, 47, 'k'); c.p(x + 1, 47, 'K')
        if act == 3: c.p(x, 46, 'f'); c.p(x + 1, 45, 'F' if x % 2 else 'f')
    c.rect(22, 19 + D + by, 26, 44, 'g'); c.rect(23, 19 + D + by, 25, 44, 'G')   # a gold stole down the front
    for y in range(22 + by, 44, 4): c.p(24, y, 'y')
    # the chest: the stolen sun (act 3: a torn, gaping wound, the sun gone to his hands)
    if act < 3:
        c.ell(24, 28 + D + by, 4.2, 4.2, 'S'); c.ell(24, 28 + D + by, 3, 3, 's'); c.ell(23, 27 + D + by, 1.3, 1.3, 'e')
        for k in range(8):
            a = k / 8 * math.tau + f * 0.4
            c.p(24 + math.cos(a) * 5.5, 28 + D + by + math.sin(a) * 5.5, 'F')
    else:
        c.ell(24, 28 + D + by, 4.5, 5, 'o'); c.ell(24, 28 + D + by, 3, 3.6, 'K')
        for k in range(6): c.p(20 + k * 1.6, 23 + D + by + (k % 2), 'g')          # the torn gold edge
    # pauldrons: gold, spiked
    for sx in (-1, 1):
        cx = 24 + sx * 12
        c.ell(cx, 21 + D + by, 7, 4.5, 'G'); c.ell(cx, 20 + D + by, 6, 3.5, 'g'); c.ell(cx - sx, 19 + D + by, 3, 1.5, 'y')
        for k in range(3): c.line(cx + sx * 4, 18 + D + by + k * 2, cx + sx * 8, 17 + D + by + k * 2.5, 'g')   # spikes, outward
    # arms and claws: down at his sides; raised beside his head when he strikes (act 3: the sun between them)
    for sx in (-1, 1):
        if attack:
            hx, hyy = 24 + sx * 17, 9 + by
            c.line(24 + sx * 13, 23 + D + by, hx, hyy + 4, 'K'); c.line(24 + sx * 14, 23 + D + by, hx + sx, hyy + 5, 'k')
        else:
            hx, hyy = 24 + sx * 18, 36 + by
            c.line(24 + sx * 14, 24 + D + by, hx, hyy - 3, 'K'); c.line(24 + sx * 15, 24 + D + by, hx + sx, hyy - 2, 'k')
        c.ell(hx, hyy, 3.2, 3, 'G'); c.ell(hx, hyy - 0.5, 2.4, 2.2, 'g')
        for k in (-1, 0, 1):                              # the claws
            if attack: c.line(hx + k * 1.6, hyy - 2, hx + k * 2.4, hyy - 6, 'y')
            else: c.line(hx + k * 1.6, hyy + 2, hx + k * 2.2, hyy + 6, 'y')
        if not attack:                                    # a broken chain hanging from each wrist
            for k in range(3): c.p(hx - sx * 1, hyy + 7 + k * 2, 'm'); c.p(hx - sx * 1, hyy + 8 + k * 2, 'W')
    if attack and act == 3:                               # the stolen sun, held up between his claws
        c.ell(24, 2 + by + 3, 5, 4, 'S'); c.ell(24, 5 + by, 3.5, 3, 's'); c.ell(23, 4 + by, 1.5, 1.2, 'e')
    elif attack:                                          # light gathering between his claws
        for k in range(9): c.p(10 + k * 3.5, 4 + by + (k % 2), 'c' if act == 1 else 'r')
    # the crown: tall spikes of gold (act 3: two snapped)
    for k, (dx, h) in enumerate(((-6, 4), (-3, 7), (0, 10), (3, 7), (6, 4))):
        if act == 3 and k in (1, 4): h = 2
        c.line(24 + dx, hy - 5, 24 + dx * 1.15, hy - 5 - h, 'g'); c.p(24 + dx * 1.15, hy - 5 - h, 'y')
    c.rect(17, hy - 6, 31, hy - 5, 'G'); c.rect(18, hy - 6, 30, hy - 6, 'g')
    # the head: a marble mask, featureless but for the eyes and a grim line of a mouth
    c.ell(24, hy + 1, 6, 6.5, 'W'); c.ell(23.5, hy + 0.5, 5.2, 5.8, 'w'); c.ell(21.5, hy - 1, 1.6, 2.4, 'w')
    c.rect(29, hy - 2, 29, hy + 4, 'm')                  # shade on the far side
    eye = {1: 'c', 2: 'r', 3: 'C'}[act]
    for ex in (21, 27):
        c.rect(ex - 1, hy, ex + 1, hy + 1, 'o'); c.rect(ex - 1, hy, ex, hy, eye if not (act == 1 and f % 4 == 3) else 'o')
        if act >= 2: c.p(ex + 1, hy + 1, 'R' if act == 2 else 'F')
    c.rect(22, hy + 5, 26, hy + 5, 'm')                  # the mouth
    if act >= 2:                                          # the seam: molten gold splits the mask
        pts = [(24, hy - 6), (25, hy - 3), (23, hy - 1), (25, hy + 2), (24, hy + 4), (25, hy + 7)]
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]): c.line(x0, y0, x1, y1, 'g')
        if act == 3:
            for (x0, y0), (x1, y1) in zip(pts, pts[1:]): c.line(x0 + 1, y0, x1 + 1, y1, 'F')
    return c.outline().rows()


def death(k):
    rnd = random.Random(7 + k)
    g = [list(r) for r in god(3, 0)]
    if k >= 0:                                            # cracks of light across him
        for _ in range(9 + k * 6):
            x, y = rnd.randrange(8, 40), rnd.randrange(4, 44)
            for _ in range(5):
                if 0 <= x < N and 0 <= y < N and g[y][x] not in ('.', 'o'): g[y][x] = 'y'
                x += rnd.choice((-1, 0, 1)); y += 1
    if k >= 1:                                            # crumbling: the top falls away
        for y in range(0, 24):
            for x in range(N):
                if g[y][x] != '.' and rnd.random() < 0.55: g[y][x] = '.'
    if k >= 2:                                            # rubble, and the fallen crown on top
        c = Cv()
        for _ in range(26):
            cx, cy = rnd.uniform(10, 38), rnd.uniform(36, 45)
            c.ell(cx, cy, rnd.uniform(1.5, 3.5), rnd.uniform(1, 2.2), rnd.choice('wWmkKq'))
        for dx in (-5, -2, 1, 4): c.line(24 + dx, 36, 24 + dx + 1, 32, 'g')
        c.rect(18, 36, 30, 37, 'G')
        return c.outline().rows()
    return [''.join(r) for r in g]


boss = Sheet('unstruck_god', 'boss', cols=6, cell=N)
keys = {}
for act in (1, 2, 3):
    for f in (0, 1):
        k = f'i{act}_{f}'; boss.add(k, god(act, f), PAL); keys[k] = k
    k = f'a{act}'; boss.add(k, god(act, 0, True), PAL); keys[k] = k
for d in range(3):
    k = f'd{d}'; boss.add(k, death(d), PAL); keys[k] = k
built = boss.build(out)
frames = {k: built['sprites'][k]['frames']['0'] for k in keys}
anims = {}
for act in (1, 2, 3):
    anims[f'idle{act}'] = {'frames': [f'i{act}_0', f'i{act}_1'], 'fps': 4, 'loop': True}
    anims[f'attack{act}'] = {'frames': [f'a{act}', f'a{act}', f'a{act}'], 'fps': 6, 'loop': False}
anims['death'] = {'frames': ['d0', 'd1', 'd2'], 'fps': 3, 'loop': False}
names = {1: 'The Untouched', 2: 'The First Wound', 3: 'The Stolen Sun'}
phases = {str(a): {'name': names[a], 'idle': f'idle{a}', 'attack': f'attack{a}'} for a in (1, 2, 3)}

# his shots (8x8)
S = {
    'spear': ['...gy...', '...gy...', '...gg...', '...Gg...', '...Gg...', '..GggG..', '...gg...', '....G...'],
    'blade': ['....H...', '...hH...', '..hhh...', '.hhb....', 'hhb.....', 'hb......', 'b.......', '........'],
    'judgement': ['..oooo..', '.ogyyGo.', 'ogyeyyGo', 'oyeeyygo', 'oyyyyygo', 'oGyyygGo', '.oGggGo.', '..oooo..'],
    'star': ['...e....', '..eHe...', '.eHHHe..', 'eHHyHHe.', '.eHHHe..', '..eHe...', '...e....', '........'],
    'ember': ['..oFo...', '.oFsFo..', 'oFseeFo.', 'oSsesSo.', '.oSsSo..', '..oSo...', '...o....', '........'],
    'seam': ['........', '........', 'gyyyyyyg', 'yeeeeeey', 'gyyyyyyg', '........', '........', '........'],
    'unmade': ['...C....', '..CQC...', '.CQqQC..', 'CQqkqQC.', '.CQqQC..', '..CQC...', '...C....', '........'],
}
shots = Sheet('ug_shots', 'shot', cols=8, cell=8)
for k, grid in S.items(): shots.add(f'unstruck_god.{k}', grid, PAL)
sheets = {
    'bx_unstruck_god': {'image': built['image'], 'kind': 'boss', 'sprites': {'unstruck_god': {'frames': frames, 'anims': anims, 'phases': phases, 'death': 'death', 'meta': {}}}},
    'ug_shots': shots.build(out),
}
atlas = {'rf': True, 'meta': {'name': 'The Unstruck God on the three-phase engine', 'version': 1}, 'sheets': sheets}   # ('rf': the simple sheet format, as tools/rf_build_bx.py writes)
json.dump(atlas, open(os.path.join(out, 'atlas_unstruck.json'), 'w', encoding='utf8', newline='\n'), indent=1)
ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
if 'unstruck/atlas_unstruck.json' not in idx['atlases']:
    idx['atlases'].append('unstruck/atlas_unstruck.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
# a preview at 4x for looking at
try:
    from pixlib import write_png
    pv = []
    for k in ['i1_0', 'a1', 'i2_0', 'a2', 'i3_0', 'a3', 'd0', 'd1', 'd2']:
        pv.append([r for r in (god(int(k[1]), 0, k[0] == 'a') if k[0] in 'ia' else death(int(k[1])))])
    W, H, sc = N * len(pv), N, 4
    px = []
    for y in range(H * sc):
        row = []
        for x in range(W * sc):
            i, gx, gy = (x // sc) // N, (x // sc) % N, y // sc
            ch = pv[i][gy][gx]
            if ch in PAL: h = PAL[ch]; row.append((int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), 255))
            else: row.append((42, 40, 51, 255))
        px.append(row)
    write_png(os.path.join(root, 'art', '_proto', 'unstruck_god_preview.png'), px)
except Exception as err:  # noqa: BLE001
    print('(no preview:', err, ')')
print('unstruck god art ->', os.path.relpath(out, root))
