# Abbot Morrow, the Drowned Abbot: the Sunken Chapel's boss on the three-phase engine (src/bosses/drowned_abbot.js): his art.
# "The tide came in during Mass and never went out again. Abbot Morrow told us to keep singing."
# A drowned priest in a white chasuble gone grey-green with the sea, a teal stole with gold crosses, a tall mitre, a
# face the colour of deep water with two pale lights for eyes; his crozier's crook ends in a little bell, and a censer
# swings from his other hand on its chain. Three looks:
#   1 The Sermon Begins     - preaching, censer smoking
#   2 The Water Rises       - the sea pours from his sleeves and hem, his eyes brighter
#   3 Mass for the Drowned  - he floats: hem torn into water, a pale halo of light behind the mitre
# Two idle frames (the censer swings), an attack frame (crozier raised, the censer flung out), a three-frame death (he
# sinks into his own robes, then a puddle with the mitre in it). Also the drowned bells (24-pixel cells) and his shots.
#   art/bundle/abbot/drowned_abbot.png, abbot_shots.png + atlas_drowned_abbot.json
#   py -I tools/build_drowned_abbot.py
import json, math, os, random, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
out = os.path.join(root, 'art', 'bundle', 'abbot')
os.makedirs(out, exist_ok=True)
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402

PAL = {
    'o': '#0a0810',
    'x': '#7e8a84', 'v': '#b8c2b4', 'V': '#e4eadc',                   # the chasuble: sea-grey, pale, bright
    't': '#1e6a6e', 'T': '#3aa6a0',                                   # the stole
    'g': '#a8822e', 'G': '#f2d070',                                   # gold
    's': '#5e8a82', 'S': '#8ab8aa',                                   # drowned skin
    'e': '#7affe8', 'E': '#f0fffa',                                   # the eyes' light
    'w': '#2a5a34', 'W': '#4a8a52',                                   # weed
    'a': '#2a7ac8', 'A': '#7ad0ff',                                   # seawater
    'b': '#e8e4d8',                                                   # barnacles
    'c': '#5a5670', 'C': '#9a96b0',                                   # the censer and its chain
    'i': '#b8a8d8', 'I': '#e8e0f8',                                   # incense
    'h': '#bff8f0',                                                   # the halo
    'k': '#6a4a24', 'K': '#9a7040',                                   # bronze (the bells)
    'n': '#3a8a6a', 'N': '#6ac8a0',                                   # verdigris
}
N = 48


class Cv:
    def __init__(self, n=N): self.n = n; self.g = [['.'] * n for _ in range(n)]
    def p(self, x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < self.n and 0 <= y < self.n: self.g[y][x] = c
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
    def trap(self, cx, y0, y1, w0, w1, c):                       # a robe: narrow at the top, wide at the hem
        for y in range(int(y0), int(y1) + 1):
            t = (y - y0) / max(1, y1 - y0); w = w0 + (w1 - w0) * t
            self.rect(cx - w / 2, y, cx + w / 2, y, c)
    def outline(self):
        g = self.g; n = self.n; o = [row[:] for row in g]
        for y in range(n):
            for x in range(n):
                if g[y][x] != '.': continue
                if any(0 <= x + dx < n and 0 <= y + dy < n and g[y + dy][x + dx] not in ('.', 'o') for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))): o[y][x] = 'o'
        self.g = o
        return self
    def rows(self): return [''.join(r) for r in self.g]


def abbot(act=1, f=0, attack=False):
    c = Cv(); rnd = random.Random(7 + act)
    fl = -3 if act == 3 else 0                     # he floats in the last act
    by = fl + (0 if attack else (f % 2))
    cx = 24
    # the halo (behind everything), act 3
    if act == 3:
        for k in range(40):
            a = k / 40 * math.tau; c.p(cx + math.cos(a) * 9, 9 + by + math.sin(a) * 9, 'h')
    # the crozier: a gold staff on his right (our left), its crook a spiral with a little bell hanging
    sx = 9
    if attack:                                     # raised high
        c.line(sx + 3, 44 + by, sx + 1, 4 + by, 'g', 2); c.line(sx + 3, 44 + by, sx + 1, 4 + by, 'G')
        for k in range(10):
            a = k / 10 * math.tau * 0.8; c.p(sx + 3 + math.cos(a) * 3.2, 3 + by + math.sin(a) * 3.2, 'G')
        c.ell(sx + 6, 8 + by, 1.6, 1.8, 'K'); c.p(sx + 6, 10 + by, 'k')
    else:
        c.line(sx, 46, sx, 10 + by, 'g', 2); c.line(sx + 1, 46, sx + 1, 10 + by, 'G')
        for k in range(10):
            a = math.pi + k / 10 * math.tau * 0.8; c.p(sx + 3 + math.cos(a) * 3.2, 9 + by + math.sin(a) * 3.2, 'G')
        c.ell(sx + 6, 13 + by, 1.6, 1.8, 'K'); c.p(sx + 6, 15 + by, 'k')
    # the robe: a bell of grey-white, folds, the hem dragging (in act 3, torn into water)
    hem = 46 if act < 3 else 40
    c.trap(cx, 19 + by, hem + by, 12, 30, 'v')
    c.trap(cx - 2, 20 + by, hem + by, 6, 15, 'V')
    for k in (-9, -4, 4, 9):                                      # folds
        c.line(cx + k * 0.4, 24 + by, cx + k, hem + by, 'x')
    if act == 3:                                                  # the hem gone to water: drips under him
        for k in range(9):
            x = cx - 13 + k * 3.2; c.line(x, hem + by, x + rnd.choice((-1, 0, 1)), hem + by + rnd.randrange(3, 7), 'a' if k % 2 else 'A')
    # the stole: teal down the front, gold crosses
    c.rect(cx - 2, 19 + by, cx + 2, hem - 1 + by, 't'); c.rect(cx - 1, 19 + by, cx - 1, hem - 1 + by, 'T')
    for y in (26, 34):
        c.rect(cx - 1, y + by, cx + 1, y + by, 'G'); c.rect(cx, y - 1 + by, cx, y + 1 + by, 'G')
    c.rect(cx - 4, hem - 2 + by, cx + 4, hem - 1 + by, 'g')             # gold at the stole's end
    # weed and barnacles, more of them as the sea takes him
    for k in range(4 + act * 2):
        x = rnd.uniform(cx - 12, cx + 12); y = rnd.uniform(28, hem - 2) + by
        c.line(x, y, x + rnd.choice((-1, 1)), y + rnd.randrange(2, 5), 'w' if k % 2 else 'W')
    for k in range(3 + act):
        c.p(rnd.uniform(cx - 11, cx + 11), rnd.uniform(26, hem - 1) + by, 'b')
    # shoulders and arms: wide sleeves
    c.ell(cx, 21 + by, 9, 4, 'v'); c.ell(cx - 1, 20 + by, 6, 2.5, 'V')
    c.rect(cx - 3, 18 + by, cx + 3, 20 + by, 't')                    # the stole round his neck
    # his left arm (our right) and the censer on its chain, swinging with the frame
    if attack:
        c.line(cx + 8, 21 + by, cx + 15, 16 + by, 'v', 4)             # flung out
        c.ell(cx + 16, 15 + by, 2, 2, 's')
        c.line(cx + 16, 15 + by, cx + 22, 7 + by, 'C')
        c.ell(cx + 22, 6 + by, 2.6, 2.2, 'c'); c.rect(cx + 21, 4 + by, cx + 23, 4 + by, 'C')
        for k in range(5): c.p(cx + 18 + k, 3 + by - k % 2, 'i' if k % 2 else 'I')
    else:
        c.line(cx + 8, 21 + by, cx + 12, 29 + by, 'v', 4)
        c.ell(cx + 12, 31 + by, 2, 2, 's')
        sw = (-2, 2)[f % 2]
        c.line(cx + 12, 31 + by, cx + 14 + sw, 37 + by, 'C')
        c.ell(cx + 14 + sw, 39 + by, 2.6, 2.2, 'c'); c.rect(cx + 13 + sw, 37 + by, cx + 15 + sw, 37 + by, 'C'); c.p(cx + 14 + sw, 39 + by, 'G')
        for k in range(4): c.p(cx + 14 + sw + (k % 2) - k * 0.5, 35 + by - k * 2, 'i' if k % 2 else 'I')   # incense rising
    # his right arm (our left), to the crozier
    c.line(cx - 8, 21 + by, sx + 3, 27 + by if not attack else 20 + by, 'v', 4)
    c.ell(sx + 2, (27 if not attack else 20) + by, 2, 2, 's')
    # the sea pours from his sleeves and hem (act 2 on)
    if act >= 2:
        for (x0, y0) in ((cx + 13, 32), (sx + 3, 29), (cx - 6, hem), (cx + 6, hem)):
            if attack and x0 > cx + 10: continue
            c.line(x0, y0 + by, x0 + (1 if x0 > cx else -1), min(47, y0 + 7 + by), 'a'); c.p(x0, y0 + 2 + by, 'A')
    # the head: a drowned face, sunken, two pale lights for eyes; a beard of weed
    c.ell(cx, 15 + by, 5.2, 4.6, 's'); c.ell(cx - 1, 14 + by, 3.6, 3, 'S')
    eye = 'E' if act >= 2 else 'e'
    c.rect(cx - 4, 13 + by, cx - 1, 15 + by, 'o'); c.rect(cx + 1, 13 + by, cx + 4, 15 + by, 'o')   # sunken sockets
    c.rect(cx - 3, 14 + by, cx - 2, 14 + by, eye); c.rect(cx + 2, 14 + by, cx + 3, 14 + by, eye); c.p(cx - 3, 14 + by, 'E'); c.p(cx + 3, 14 + by, 'E')
    c.rect(cx - 1, 17 + by, cx + 1, 18 + by, 'o')                    # his mouth, open: still preaching
    for k in (-3, -2, 2, 3): c.line(cx + k, 18 + by, cx + k * 1.2, 21 + by, 'w' if k % 2 else 'W')   # weed hanging from his jaw
    # the mitre: tall, two points, gold edges, a teal cross
    c.trap(cx, 2 + by, 11 + by, 3, 10, 'V'); c.trap(cx + 1, 3 + by, 11 + by, 1, 4, 'v')
    c.rect(cx - 5, 10 + by, cx + 5, 11 + by, 'g'); c.rect(cx - 4, 10 + by, cx + 4, 10 + by, 'G')
    c.line(cx, 2 + by, cx, 10 + by, 'g')
    c.rect(cx - 2, 5 + by, cx + 2, 5 + by, 'T'); c.rect(cx, 3 + by, cx, 8 + by, 'T')
    return c.outline().rows()


def death(k):
    rnd = random.Random(9 + k)
    if k == 0:                                     # the sermon stops; the light leaves his eyes
        g = [list(r) for r in abbot(2, 0)]
        for y in range(N):
            for x in range(N):
                if g[y][x] in ('e', 'E'): g[y][x] = 'o'
        return [''.join(r) for r in g]
    if k == 1:                                     # he sinks into his robes
        g = [list(r) for r in abbot(2, 0)]
        sh = [['.'] * N for _ in range(N)]
        for y in range(N):
            for x in range(N):
                ny = y + 10
                if ny < N and g[y][x] != '.': sh[ny][x] = g[y][x]
        for _ in range(60):
            x, y = rnd.randrange(8, 40), rnd.randrange(36, 47)
            if sh[y][x] not in ('.', 'o'): sh[y][x] = rnd.choice('aA')
        return [''.join(r) for r in sh]
    c = Cv()                                       # a puddle of the sea, the mitre in it, the crozier across it
    c.ell(24, 42, 16, 4, 'a'); c.ell(22, 41, 11, 2.5, 'A')
    c.line(8, 44, 38, 38, 'g', 2); c.line(9, 44, 38, 39, 'G')
    c.trap(26, 33, 40, 3, 9, 'V'); c.rect(22, 39, 30, 40, 'g'); c.rect(25, 35, 27, 35, 'T'); c.rect(26, 34, 26, 38, 'T')
    for _ in range(8): c.p(rnd.uniform(10, 38), rnd.uniform(39, 45), 'b')
    return c.outline().rows()


def bell(ring=0):                                   # a drowned bell, hung from a broken beam (24-pixel cell)
    c = Cv(24); tilt = (0, -2, 2)[ring]
    c.rect(4, 1, 19, 2, 'k'); c.rect(4, 1, 19, 1, 'K')               # the beam
    c.line(12, 3, 12 + tilt * 0.3, 5, 'C')
    cx = 12 + tilt
    c.trap(cx, 5, 17, 6, 15, 'k'); c.trap(cx - 1, 6, 16, 2, 6, 'K')
    c.rect(cx - 8, 17, cx + 8, 18, 'k'); c.rect(cx - 7, 17, cx + 7, 17, 'K')
    for (x, y) in ((cx - 4, 9), (cx + 3, 12), (cx - 5, 15), (cx + 5, 16), (cx, 7)): c.p(x, y, 'n'); c.p(x + 1, y, 'N')   # verdigris
    c.p(cx + 4, 8, 'b'); c.p(cx - 2, 13, 'b')
    c.ell(cx - tilt * 0.6, 20, 1.6, 1.6, 'k')                        # the clapper
    if ring:
        for k in range(3):
            r = 9 + k * 2
            for a in (-0.5, 0.5):
                c.p(cx + math.cos(a + (0 if ring == 1 else math.pi)) * r, 11 + math.sin(a) * r, 'G')
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
    frames += [(f'i{act}_0', abbot(act, 0)), (f'i{act}_1', abbot(act, 1)), (f'a{act}', abbot(act, 0, True))]
frames += [(f'd{k}', death(k)) for k in range(3)]
sp = pack('drowned_abbot', N, 6, frames)
fr = {k: v['frames']['0'] for k, v in sp.items()}
anims = {}
for act in (1, 2, 3):
    anims[f'idle{act}'] = {'frames': [f'i{act}_0', f'i{act}_1'], 'fps': 3, 'loop': True}
    anims[f'attack{act}'] = {'frames': [f'a{act}'] * 3, 'fps': 6, 'loop': False}
anims['death'] = {'frames': ['d0', 'd1', 'd2'], 'fps': 3, 'loop': False}
names = {1: 'The Sermon Begins', 2: 'The Water Rises', 3: 'Mass for the Drowned'}
phases = {str(a): {'name': names[a], 'idle': f'idle{a}', 'attack': f'attack{a}'} for a in (1, 2, 3)}
bells = [('b0', bell(0)), ('b1', bell(1)), ('b2', bell(2))]
bsp = pack('abbot_bell', 24, 3, bells)
bfr = {k: v['frames']['0'] for k, v in bsp.items()}
SHOTS = {
    'tidebolt': ['........', '...A....', '..AAa...', '.AAaaa..', 'AAaaaa..', '.Aaaa...', '..aa....', '........'],
    'bellpearl': ['........', '..VVV...', '.VEEEV..', '.VEhEV..', '.VEEEV..', '..VVV...', '........', '........'],
    'bubble': ['........', '..AAA...', '.A..EA..', '.A...A..', '.A...A..', '..AAA...', '........', '........'],
    'page': ['........', '.VVVVV..', '.VxxxV..', '.VVVVV..', '.VxxxV..', '.VVVVV..', '........', '........'],
    'ember': ['........', '...I....', '..IiI...', '.IiGiI..', '..IiI...', '...I....', '........', '........'],
    'toll': ['........', '..GGG...', '.G...G..', 'G.....G.', '.G...G..', '..GGG...', '........', '........'],
    'glass': ['........', '...T....', '..TGT...', '.TGeGT..', '..TGT...', '...T....', '........', '........'],
}
shot_sp = pack('abbot_shots', 8, 8, [(f'drowned_abbot.{k}', g) for k, g in SHOTS.items()])
atlas = {'rf': True, 'meta': {'name': 'Abbot Morrow on the three-phase engine', 'version': 1}, 'sheets': {
    'bx_drowned_abbot': {'image': 'drowned_abbot.png', 'kind': 'boss', 'sprites': {'drowned_abbot': {'frames': fr, 'anims': anims, 'phases': phases, 'death': 'death', 'meta': {}}}},
    'abbot_bell': {'image': 'abbot_bell.png', 'kind': 'enemy', 'sprites': {'bell': {'frames': bfr, 'anims': {'move': {'frames': ['b0'], 'fps': 2, 'loop': True}, 'attack': {'frames': ['b1', 'b2', 'b1', 'b0'], 'fps': 10, 'loop': False}}, 'meta': {}}}},
    'abbot_shots': {'image': 'abbot_shots.png', 'kind': 'shot', 'sprites': shot_sp}}}
json.dump(atlas, open(os.path.join(out, 'atlas_drowned_abbot.json'), 'w', encoding='utf8', newline='\n'), indent=1)
ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
if 'abbot/atlas_drowned_abbot.json' not in idx['atlases']:
    idx['atlases'].append('abbot/atlas_drowned_abbot.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
# a 4x preview: the three looks, an attack, the death, and a bell ringing
pv = [g for k, g in frames if k in ('i1_0', 'a1', 'i2_0', 'i3_0', 'a3', 'd1', 'd2')]
K = 4; P = []
for y in range(N * K):
    row = []
    for x in range(N * K * len(pv)):
        ch = pv[x // (N * K)][y // K][(x // K) % N]
        h = PAL.get(ch); row.append((int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), 255) if h else (42, 40, 51, 255))
    P.append(row)
write_png(os.path.join(root, 'art', '_proto', 'drowned_abbot_preview.png'), P)
print('Abbot Morrow art -> art/bundle/abbot')
