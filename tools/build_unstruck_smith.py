# The Unstruck, the Drowned Forge's boss, on the three-phase engine (src/bosses/unstruck_smith.js): its art.
# "Something stands at the anvil now, still swinging. We call it the Unstruck, because nothing it hits has ever stopped it."
# A hulking smith of drowned iron: a bucket helm with one furnace slit for an eye, barnacles and weed on its shoulders,
# steam leaking from its seams, chains on its wrists, a hammer the size of a door. Three looks:
#   1 Still Swinging   - iron gone green and rust-red, the furnace slit orange
#   2 The Sea Comes In - cracks in it, seawater pouring out of them
#   3 Unstoppable      - red-hot through every seam, the slit white, steam boiling off it
# Two idle frames, an attack frame (the hammer overhead), a three-frame death (it seizes, it rusts through, a heap).
#   art/bundle/unstruck/unstruck_smith.png, us_shots.png + atlas_unstruck_smith.json
#   py -I tools/build_unstruck_smith.py
import json, math, os, random, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
out = os.path.join(root, 'art', 'bundle', 'unstruck')
os.makedirs(out, exist_ok=True)
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402

PAL = {
    'o': '#0a0810',
    'i': '#3a4a50', 'I': '#566a6e', 'j': '#7e9696', 'J': '#b4c6c0',   # drowned iron, dark to light (light enough to read in the dark forge)
    'u': '#6a3a22', 'U': '#9a5a30',                                   # rust
    'b': '#e8e4d8', 'B': '#b8b4a4',                                   # barnacles
    'w': '#2a6a4a', 'W': '#4a9a6a',                                   # weed
    'f': '#ff8a1f', 'F': '#ffd650', 'e': '#fff6c8', 'r': '#ff3a1a',   # furnace
    's': '#cfe8f0', 'S': '#ffffff',                                   # steam
    'a': '#2a7ac8', 'A': '#7ad0ff',                                   # seawater
    'h': '#4a4a52', 'H': '#7a7a86', 'k': '#5a3a20',                   # the hammer's head, its haft
    'c': '#6e6a80', 'C': '#a8a4b8',                                   # chains
}
N = 48


class Cv:
    def __init__(self): self.g = [['.'] * N for _ in range(N)]
    def p(self, x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < N and 0 <= y < N: self.g[y][x] = c
    def rect(self, x0, y0, x1, y1, c):
        x0, x1 = min(x0, x1), max(x0, x1); y0, y1 = min(y0, y1), max(y0, y1)
        for y in range(int(round(y0)), int(round(y1)) + 1):
            for x in range(int(round(x0)), int(round(x1)) + 1): self.p(x, y, c)
    def ell(self, cx, cy, rx, ry, c):
        for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
            for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
                if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1: self.p(x, y, c)
    def line(self, x0, y0, x1, y1, c, w=1):
        n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
        for i in range(n + 1):
            t = i / n; x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            self.rect(x - (w - 1) / 2, y - (w - 1) / 2, x + (w - 1) / 2, y + (w - 1) / 2, c)
    def outline(self):
        g = self.g; o = [row[:] for row in g]
        for y in range(N):
            for x in range(N):
                if g[y][x] != '.': continue
                if any(0 <= x + dx < N and 0 <= y + dy < N and g[y + dy][x + dx] not in ('.', 'o') for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))): o[y][x] = 'o'
        self.g = o
        return self
    def rows(self): return [''.join(r) for r in self.g]


def smith(act=1, f=0, attack=False):
    c = Cv(); rnd = random.Random(11)
    by = 0 if attack else (f % 2)
    hot = act == 3
    iron, iron2, light = ('u', 'U', 'f') if hot else ('i', 'I', 'j')
    # legs: two pillars of iron, a stance as wide as a door
    for sx in (-1, 1):
        c.rect(24 + sx * 5, 34, 24 + sx * 9, 46, iron); c.rect(24 + sx * 6, 35, 24 + sx * 7, 45, iron2)
        c.rect(24 + sx * 4, 44, 24 + sx * 10, 46, 'I' if not hot else 'U')               # boots
    # the body: a barrel of plate, rivets in rows, a belt of chain
    c.ell(24, 26 + by, 12, 10, iron); c.ell(22, 24 + by, 9, 7, iron2); c.ell(19, 21 + by, 3.5, 2.5, 'j' if not hot else 'F')
    for y in (21, 27, 32):
        for x in range(15, 34, 3): c.p(x, y + by, 'J' if not hot else 'F')
    for x in range(13, 36, 2): c.p(x, 34 + by, 'C'); c.p(x + 1, 34 + by, 'c')
    if act == 1:                                                        # rust and weed
        for k in range(10): c.p(rnd.randrange(14, 34), rnd.randrange(19, 33) + by, 'u')
    # the shoulders: great iron pauldrons crusted with barnacles and hung with weed
    for sx in (-1, 1):
        cx = 24 + sx * 12
        c.ell(cx, 18 + by, 7, 5, iron); c.ell(cx - sx, 17 + by, 5, 3.4, iron2)
        for k in range(5): c.p(cx + rnd.uniform(-4, 4), 15 + by + rnd.uniform(-1, 2), 'b' if k % 2 else 'B')
        if act < 3:
            for k in range(3): c.line(cx + sx * (2 + k * 2), 20 + by, cx + sx * (2 + k * 2) + rnd.choice((-1, 0, 1)), 25 + by + k, 'w' if k % 2 else 'W')
        else:
            for k in range(3): c.p(cx + sx * (1 + k * 2), 12 + by - k, 's'); c.p(cx + sx * (2 + k * 2), 10 + by - k, 'S')   # steam boiling off
    # the helm: a bucket of iron, one slit of furnace light, a ridge down the middle
    hx, hy = 24, 10 + by
    c.rect(hx - 6, hy - 6, hx + 6, hy + 5, iron); c.rect(hx - 5, hy - 5, hx - 1, hy + 4, iron2); c.rect(hx + 3, hy - 5, hx + 5, hy + 4, 'i' if not hot else 'u')
    c.rect(hx - 7, hy - 7, hx + 7, hy - 6, 'J' if not hot else 'F')       # the rim
    c.rect(hx, hy - 6, hx, hy + 5, 'J' if not hot else 'F')               # the ridge
    slit = {1: ('f', 'F'), 2: ('f', 'F'), 3: ('e', 'S')}[act]
    c.rect(hx - 5, hy, hx + 5, hy + 1, 'o'); c.rect(hx - 4, hy, hx + 4, hy, slit[0]); c.p(hx - 1, hy, slit[1]); c.p(hx + 1, hy, slit[1])
    for k in range(4): c.p(hx - 5 + k * 3, hy + 3, 'J' if not hot else 'F')   # breathing holes
    # the arms: one at its side with a broken chain, one with the hammer (overhead when it strikes)
    lx = 24 - 15
    c.line(24 - 11, 20 + by, lx, 30 + by, iron, 3); c.ell(lx, 32 + by, 3, 2.6, iron2)
    for k in range(4): c.p(lx + (k % 2), 35 + by + k * 2, 'C' if k % 2 else 'c')
    if attack:                                                           # the hammer raised overhead
        c.line(24 + 11, 19 + by, 36, 8 + by, iron, 3)
        c.line(36, 9, 30, 0, 'k', 2)                                      # the haft
        c.rect(20, 0, 41, 6, 'h'); c.rect(21, 1, 40, 2, 'H'); c.rect(20, 4, 41, 4, 'o')
    else:                                                                # the hammer hanging, head down by its foot
        c.line(24 + 11, 20 + by, 39, 30 + by, iron, 3); c.ell(39, 31 + by, 3, 2.6, iron2)
        c.line(40, 31 + by, 41, 35, 'k', 2)
        c.rect(33, 35, 47, 46, 'h'); c.rect(34, 36, 46, 38, 'H'); c.rect(33, 41, 47, 41, 'o')   # the head, big as a door
        if hot: c.rect(34, 43, 46, 45, 'r')
    # act 2: cracks, and the sea pouring out of them; act 3: every seam glowing
    if act == 2:
        for (x0, y0, x1, y1) in ((17, 22, 21, 30), (29, 20, 26, 28), (22, 31, 25, 36)):
            c.line(x0, y0 + by, x1, y1 + by, 'o')
            c.line(x1, y1 + by, x1, min(46, y1 + 8 + by), 'a'); c.p(x1, y1 + 2 + by, 'A')
    if hot:
        for (x0, y0, x1, y1) in ((16, 23, 20, 31), (30, 21, 27, 29), (21, 32, 26, 35), (24 - 5, 14 + by, 24 + 5, 14 + by)):
            c.line(x0, y0 + (by if y0 > 14 else 0), x1, y1 + (by if y1 > 14 else 0), 'F')
    return c.outline().rows()


def death(k):
    rnd = random.Random(5 + k)
    g = [list(r) for r in smith(3, 0)]
    if k >= 0:                                                            # it seizes: rust and cold spread through it
        for _ in range(60 + 40 * k):
            x, y = rnd.randrange(8, 44), rnd.randrange(2, 46)
            if g[y][x] not in ('.', 'o'): g[y][x] = rnd.choice('uUiI')
    if k >= 1:
        for y in range(0, 22):
            for x in range(N):
                if g[y][x] != '.' and rnd.random() < 0.6: g[y][x] = '.'
    if k >= 2:
        c = Cv()
        for _ in range(24): c.ell(rnd.uniform(10, 38), rnd.uniform(37, 45), rnd.uniform(1.5, 3.5), rnd.uniform(1, 2.2), rnd.choice('iIjuUb'))
        c.rect(30, 38, 40, 43, 'h'); c.rect(31, 39, 39, 40, 'H')             # the hammer, at last at rest
        c.rect(20, 33, 28, 38, 'i'); c.rect(21, 35, 27, 35, 'o')             # the helm, its slit gone dark
        return c.outline().rows()
    return [''.join(r) for r in g]


# pack the sheet (48-pixel cells) and its shots (8-pixel cells)
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
    frames += [(f'i{act}_0', smith(act, 0)), (f'i{act}_1', smith(act, 1)), (f'a{act}', smith(act, 0, True))]
frames += [(f'd{k}', death(k)) for k in range(3)]
sp = pack('unstruck_smith', N, 6, frames)
fr = {k: v['frames']['0'] for k, v in sp.items()}
anims = {}
for act in (1, 2, 3):
    anims[f'idle{act}'] = {'frames': [f'i{act}_0', f'i{act}_1'], 'fps': 3, 'loop': True}
    anims[f'attack{act}'] = {'frames': [f'a{act}'] * 3, 'fps': 6, 'loop': False}
anims['death'] = {'frames': ['d0', 'd1', 'd2'], 'fps': 3, 'loop': False}
names = {1: 'Still Swinging', 2: 'The Sea Comes In', 3: 'Unstoppable'}
phases = {str(a): {'name': names[a], 'idle': f'idle{a}', 'attack': f'attack{a}'} for a in (1, 2, 3)}
SHOTS = {
    'hammer': ['.hhhhh..', '.hHHHh..', '.hhhhh..', '...k....', '...k....', '...k....', '...k....', '........'],
    'spark': ['........', '...F....', '..FeF...', '.FeSeF..', '..FeF...', '...F....', '........', '........'],
    'rivet': ['........', '..jJj...', '.jJJJj..', '.jJjJj..', '.jJJJj..', '..jjj...', '........', '........'],
    'brine': ['...A....', '..AAa...', '.AAAaa..', '.Aaaaa..', '..aaa...', '........', '........', '........'],
    'rust': ['........', '..uU....', '.uUUu...', '..uUu...', '...u....', '........', '........', '........'],
    'steam': ['..s.s...', '.sSsSs..', 'sSSSSSs.', '.sSSSs..', '..sss...', '........', '........', '........'],
}
shot_sp = pack('us_shots', 8, 8, [(f'unstruck_smith.{k}', g) for k, g in SHOTS.items()])
atlas = {'rf': True, 'meta': {'name': 'The Unstruck on the three-phase engine', 'version': 1}, 'sheets': {
    'bx_unstruck_smith': {'image': 'unstruck_smith.png', 'kind': 'boss', 'sprites': {'unstruck_smith': {'frames': fr, 'anims': anims, 'phases': phases, 'death': 'death', 'meta': {}}}},
    'us_shots': {'image': 'us_shots.png', 'kind': 'shot', 'sprites': shot_sp}}}
json.dump(atlas, open(os.path.join(out, 'atlas_unstruck_smith.json'), 'w', encoding='utf8', newline='\n'), indent=1)
ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
if 'unstruck/atlas_unstruck_smith.json' not in idx['atlases']:
    idx['atlases'].append('unstruck/atlas_unstruck_smith.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
# a 4x preview
pv = [g for _, g in frames if _ in ('i1_0', 'a1', 'i2_0', 'i3_0', 'a3', 'd0', 'd1', 'd2')]
K = 4; P = []
for y in range(N * K):
    row = []
    for x in range(N * K * len(pv)):
        ch = pv[x // (N * K)][y // K][(x // K) % N]
        h = PAL.get(ch); row.append((int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), 255) if h else (42, 40, 51, 255))
    P.append(row)
write_png(os.path.join(root, 'art', '_proto', 'unstruck_smith_preview.png'), P)
print('the Unstruck art -> art/bundle/unstruck')
