# The Archivist: the Frozen Scriptorium's boss on the three-phase engine (src/bosses/the_archivist.js): its art.
# "Every word ever spoken in the realm is kept here, frozen into pages. The Archivist keeps them."
# A tall, thin keeper in frost-blue scholar's robes, hood drawn, one round lens glowing where a face should be; a huge
# open book frozen to its left arm, a quill in its right hand dripping ink; pages drift round it. Three looks:
#   1 The Catalogue Opens  - reading, its lens a cold blue
#   2 Errata               - ink spilling down its robes and off the book's edges, its lens gone black-violet
#   3 The Final Chapter    - frozen over: icicles off its sleeves and hood, its lens white, a crown of frost
# Two idle frames (a page turns), an attack frame (the quill raised, the book flung open), a three-frame death (it
# closes the book; the robes fall empty; a closed book on the floor, frost round it).
# Also its copy (the same body, for Errata) and its shots.
#   art/bundle/archivist/the_archivist.png, archivist_shots.png + atlas_the_archivist.json
#   py -I tools/build_the_archivist.py
import json, math, os, random, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
out = os.path.join(root, 'art', 'bundle', 'archivist')
os.makedirs(out, exist_ok=True)
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402
from pixcanvas import Cv  # noqa: E402

PAL = {
    'o': '#0a0810',
    'r': '#2a3a6a', 'R': '#4a6aa8', 'q': '#7aa0d8',                   # the robes, frost-blue
    'h': '#1a2448',                                                   # the hood's dark
    'l': '#7ad0ff', 'L': '#e0f6ff',                                   # the lens, cold
    'v': '#8a3ad8', 'V': '#3a1a5a',                                   # the lens in Errata
    'p': '#d8d4c4', 'P': '#f4f0e0', 'x': '#9a9488',                   # pages
    'b': '#4a2a1a', 'B': '#7a4a2a',                                   # the book's covers
    'g': '#c8a040', 'G': '#f2d070',                                   # gilt
    'k': '#1a1428', 'K': '#3a2a58',                                   # ink
    'i': '#bfe8ff', 'I': '#ffffff',                                   # ice
    's': '#c8b8a8',                                                   # its hands, pale
}
N = 48


def archivist(act=1, f=0, attack=False):
    c = Cv(); rnd = random.Random(5 + act)
    by = 0 if attack else (f % 2)
    cx = 24
    # pages drifting round it
    for k in range(3 + act):
        a = k / (3 + act) * math.tau + (0.4 if f % 2 else 0); x, y = cx + math.cos(a) * 19, 22 + math.sin(a) * 13
        c.rect(x - 1, y - 1, x + 1, y + 1, 'P'); c.p(x, y, 'x')
    # the robe: long, narrow at the shoulders, a hem pooled on the floor
    c.trap(cx, 16 + by, 46, 10, 26, 'r'); c.trap(cx - 2, 18 + by, 46, 4, 12, 'R')
    for k in (-8, -3, 3, 8): c.line(cx + k * 0.3, 22 + by, cx + k, 46, 'h')
    c.rect(cx - 12, 45, cx + 12, 46, 'R')
    # a stole of index cards down its front
    for y in range(22, 42, 4): c.rect(cx - 1, y + by, cx + 2, y + 2 + by, 'p'); c.p(cx, y + 1 + by, 'x')
    # Errata: ink spilling down the robe
    if act == 2:
        for k in range(6):
            x = rnd.uniform(cx - 10, cx + 10); y0 = rnd.uniform(20, 32) + by
            x1, y1 = x + rnd.choice((-1, 0, 1)), min(46, y0 + rnd.randrange(6, 14))
            c.line(x, y0, x1, y1, 'k'); c.line(x + 1, y0, x1 + 1, y1, 'v' if k % 2 else 'K')   # (a violet sheen, so it reads on the blue)
        c.ell(cx, 46, 13, 1.6, 'k'); c.ell(cx - 3, 46, 6, 0.8, 'v')                        # a pool of it at the hem
    # the hood, and the lens where a face should be
    c.ell(cx, 11 + by, 6, 7, 'r'); c.ell(cx - 1, 10 + by, 4.5, 5, 'R'); c.ell(cx, 12 + by, 4, 4.5, 'h')
    c.trap(cx, 2 + by, 6 + by, 2, 8, 'r')
    lens = {1: ('l', 'L'), 2: ('V', 'v'), 3: ('i', 'I')}[act]
    c.ell(cx, 12 + by, 2.4, 2.4, 'o'); c.ell(cx, 12 + by, 1.8, 1.8, lens[0]); c.p(cx - 1, 11 + by, lens[1])
    c.line(cx + 2, 13 + by, cx + 4, 18 + by, 'g')                      # the lens's chain
    # the left arm (ours: left) holding the great book, open
    bx, byy = cx - 13, 24 + by
    if attack:                                                          # flung open, held high
        bx, byy = cx - 14, 14
    c.line(cx - 7, 18 + by, bx + 4, byy + 2, 'r', 3)
    c.rect(bx - 6, byy - 4, bx + 6, byy + 5, 'b'); c.rect(bx - 5, byy - 3, bx + 5, byy + 4, 'P'); c.line(bx, byy - 4, bx, byy + 5, 'B')
    for y in range(byy - 2, byy + 4, 2): c.line(bx - 4, y, bx - 1, y, 'x'); c.line(bx + 1, y, bx + 4, y, 'x')
    c.rect(bx - 6, byy - 4, bx + 6, byy - 4, 'G')
    if act == 2:
        for k in range(3): c.line(bx - 5 + k * 5, byy + 5, bx - 5 + k * 5, byy + 9, 'k')   # ink off its edges
    if act == 3:
        for k in range(4): c.p(bx - 5 + k * 3, byy + 6, 'i'); c.p(bx - 5 + k * 3, byy + 7, 'I')
    # the right arm with the quill (raised in the attack)
    qx, qy = (cx + 14, 6) if attack else (cx + 11, 30 + by)
    c.line(cx + 7, 18 + by, qx - 1, qy + 2, 'r', 3); c.ell(qx - 1, qy + 2, 1.6, 1.6, 's')
    c.line(qx - 1, qy + 2, qx + 4, qy - 7, 'P'); c.line(qx, qy + 1, qx + 5, qy - 6, 'x'); c.p(qx - 2, qy + 4, 'k')
    if not attack: c.line(qx - 2, qy + 4, qx - 2, qy + 8, 'k')          # ink dripping off the nib
    # the Final Chapter: frost over everything, icicles, a crown of ice
    if act == 3:
        for k in range(5): x = cx - 6 + k * 3; c.line(x, 5 + by, x + (k % 3) - 1, 1 + by + (k % 2), 'I'); c.p(x, 5 + by, 'i')   # a crown of ice on the hood
        for (x0, y0) in ((cx - 8, 20), (cx + 8, 20), (cx - 12, 44), (cx + 11, 44)):
            c.line(x0, y0 + by, x0, y0 + 4 + by, 'i'); c.p(x0, y0 + 5 + by, 'I')
        for k in range(14): c.p(rnd.uniform(cx - 11, cx + 11), rnd.uniform(18, 44) + by, 'i')
    return c.outline().rows()


def death(k):
    rnd = random.Random(13 + k)
    if k == 0:                                     # it closes the book; the lens dims
        g = [list(r) for r in archivist(3, 0)]
        for y in range(N):
            for x in range(N):
                if g[y][x] in ('i', 'I') and rnd.random() < 0.5: g[y][x] = 'R'
        return [''.join(r) for r in g]
    if k == 1:                                     # the robes fall empty
        c = Cv(); c.trap(24, 30, 46, 14, 30, 'r'); c.trap(23, 32, 46, 6, 14, 'R'); c.ell(24, 30, 6, 4, 'r'); c.ell(24, 30, 4, 2.5, 'h')
        c.rect(8, 40, 18, 45, 'b'); c.rect(9, 41, 17, 44, 'B')
        return c.outline().rows()
    c = Cv()                                        # a closed book on the floor, frost round it, pages settling
    c.ell(24, 42, 15, 3.5, 'i'); c.ell(24, 42, 10, 2, 'I')
    c.rect(16, 36, 32, 41, 'b'); c.rect(17, 37, 31, 40, 'B'); c.rect(16, 36, 32, 36, 'G'); c.rect(23, 37, 24, 40, 'g')
    for _ in range(6): x = rnd.uniform(6, 42); y = rnd.uniform(38, 46); c.rect(x - 1, y, x + 1, y, 'P')
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
    frames += [(f'i{act}_0', archivist(act, 0)), (f'i{act}_1', archivist(act, 1)), (f'a{act}', archivist(act, 0, True))]
frames += [(f'd{k}', death(k)) for k in range(3)]
sp = pack('the_archivist', N, 6, frames)
fr = {k: v['frames']['0'] for k, v in sp.items()}
anims = {}
for act in (1, 2, 3):
    anims[f'idle{act}'] = {'frames': [f'i{act}_0', f'i{act}_1'], 'fps': 2, 'loop': True}
    anims[f'attack{act}'] = {'frames': [f'a{act}'] * 3, 'fps': 6, 'loop': False}
anims['death'] = {'frames': ['d0', 'd1', 'd2'], 'fps': 2, 'loop': False}
names = {1: 'The Catalogue Opens', 2: 'Errata', 3: 'The Final Chapter'}
phases = {str(a): {'name': names[a], 'idle': f'idle{a}', 'attack': f'attack{a}'} for a in (1, 2, 3)}
# its copy (Errata): the same body as a monster ('move' and 'attack' clips), the same frames as act II
copy = {'frames': {k: fr[k] for k in ('i2_0', 'i2_1', 'a2')}, 'anims': {'move': {'frames': ['i2_0', 'i2_1'], 'fps': 2, 'loop': True}, 'attack': {'frames': ['a2'], 'fps': 4, 'loop': False}}, 'meta': {}}
SHOTS = {
    'page': ['........', '.PPPPP..', '.PxxxP..', '.PPPPP..', '.PxxxP..', '.PPPPP..', '........', '........'],
    'glyph': ['........', '.kkkkk..', '...k....', '..kKk...', '...k....', '.kkkkk..', '........', '........'],
    'ink': ['........', '...K....', '..KkK...', '.KkkkK..', '.KkkkK..', '..KKK...', '........', '........'],
    'needle': ['...I....', '...i....', '..iIi...', '...i....', '...i....', '...i....', '........', '........'],
    'asterisk': ['........', '.i.I.i..', '..iIi...', '.IIIII..', '..iIi...', '.i.I.i..', '........', '........'],
    'quill': ['.....P..', '....PP..', '...PPx..', '..PPx...', '.PPx....', '.s......', 'k.......', '........'],
}
shot_sp = pack('archivist_shots', 8, 8, [(f'the_archivist.{k}', g) for k, g in SHOTS.items()])
atlas = {'rf': True, 'meta': {'name': 'The Archivist on the three-phase engine', 'version': 1}, 'sheets': {
    'bx_the_archivist': {'image': 'the_archivist.png', 'kind': 'boss', 'sprites': {'the_archivist': {'frames': fr, 'anims': anims, 'phases': phases, 'death': 'death', 'meta': {}}, 'copy': copy}},
    'archivist_shots': {'image': 'archivist_shots.png', 'kind': 'shot', 'sprites': shot_sp}}}
json.dump(atlas, open(os.path.join(out, 'atlas_the_archivist.json'), 'w', encoding='utf8', newline='\n'), indent=1)
ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
if 'archivist/atlas_the_archivist.json' not in idx['atlases']:
    idx['atlases'].append('archivist/atlas_the_archivist.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
pv = [g for k, g in frames if k in ('i1_0', 'a1', 'i2_0', 'i3_0', 'a3', 'd1', 'd2')]
K = 4; P = []
for y in range(N * K):
    row = []
    for x in range(N * K * len(pv)):
        ch = pv[x // (N * K)][y // K][(x // K) % N]
        h = PAL.get(ch); row.append((int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), 255) if h else (42, 40, 51, 255))
    P.append(row)
write_png(os.path.join(root, 'art', '_proto', 'the_archivist_preview.png'), P)
print('the Archivist art -> art/bundle/archivist')
