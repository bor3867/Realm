# Art for three of the newer dungeons' bosses on the three-phase engine (src/bosses/honey_queen.js, the_puppeteer.js,
# prism_wyrm.js). Each: two idle frames and an attack frame a phase, a three-frame death, its shots, and its helpers.
#   Queen Melliflua, the Honeyed Mother - a bee the size of a cart: gold-and-black furred, a crown of wax and amber,
#     glassy wings, a honey-dipper sceptre. I: regal; II: wings blurred, honey dripping off her; III: furious, red-eyed.
#   Maestro Lucan, the Puppeteer - a tall thin maestro in a tailcoat and top hat, a puppet's control cross in his hands,
#     strings hanging from it. His mask by act: I Comedy (gold, grinning), II Tragedy (blue, weeping), III Silence (white, blank).
#   Aurelia, the Prism Wyrm - a crystal serpent coiled on herself, facets of every colour; II: her glass cracked with
#     light; III: overcharged, white-hot.
#   art/bundle/hollow/<boss>.png, hollow_shots.png, hollow_kin.png + atlas_hollow_bosses.json
#   py -I tools/build_hollow_bosses.py
import json, math, os, random, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
out = os.path.join(root, 'art', 'bundle', 'hollow')
os.makedirs(out, exist_ok=True)
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402
from pixcanvas import Cv  # noqa: E402

PAL = {
    'o': '#0a0810',
    # the Queen
    'y': '#c8901a', 'Y': '#f2c14e', 'n': '#2a1a0a', 'N': '#4a3218', 'u': '#ffe9a0',
    'w': '#bfe8ff', 'W': '#e8f6ff', 'h': '#e8a020', 'H': '#ffd060', 'a': '#a85a10', 'r': '#ff3a2a',
    # the Maestro
    'k': '#1a1424', 'K': '#3a2a48', 'c': '#d8d4c4', 'C': '#f4f0e0', 'g': '#c8a040', 'G': '#f2d070',
    'b': '#2a6ac8', 'B': '#7ad0ff', 'm': '#b81e3a', 's': '#e0c8a8', 't': '#8a7a6a', 'v': '#ffffff',
    # the Wyrm
    'p': '#ff6a8a', 'q': '#ffd650', 'e': '#7aff9a', 'f': '#7ad0ff', 'i': '#a07aff', 'l': '#e8f6ff', 'L': '#ffffff', 'z': '#5a6a88',
    'x': '#7a7a86',
}
N = 48


# ---------------------------------------------------------------- Queen Melliflua
def queen(act=1, f=0, attack=False):
    c = Cv(); rnd = random.Random(2 + act); by = 0 if attack else f % 2; cx = 24
    # wings (behind): glassy ovals, blurred into streaks in act II
    for s in (-1, 1):
        if act == 2 or attack:
            for k in range(4): c.ell(cx + s * (10 + k), 13 + by - k, 7 - k, 4, 'w' if k % 2 else 'W')
        else:
            c.ell(cx + s * 11, 12 + by, 8, 5, 'w'); c.ell(cx + s * 10, 11 + by, 5, 3, 'W'); c.line(cx + s * 4, 14 + by, cx + s * 17, 9 + by, 'z')
    # the abdomen: big, striped, a stinger
    c.ell(cx, 34, 10, 11, 'y')
    for k, yy in enumerate((28, 33, 38, 42)): c.rect(cx - 9 + abs(k - 1), yy, cx + 9 - abs(k - 1), yy + 1, 'n')
    c.ell(cx - 4, 30, 3, 4, 'Y')
    c.line(cx, 45, cx, 47, 'N'); c.p(cx, 47, 'o')
    # the thorax: fur
    c.ell(cx, 21 + by, 8, 6, 'N'); c.ell(cx - 2, 20 + by, 5, 3.5, 'Y')
    for k in range(10): c.p(cx - 7 + k * 1.5, 25 + by, 'u')
    # legs
    for s in (-1, 1):
        for k in range(3): c.line(cx + s * 6, 22 + k * 3 + by, cx + s * (11 + k), 28 + k * 4, 'n')
    # the head: big eyes, antennae, a crown of wax and amber
    c.ell(cx, 12 + by, 6, 5, 'N'); c.ell(cx, 13 + by, 5, 3.5, 'y')
    eye = 'r' if act == 3 else 'n'
    c.ell(cx - 3, 12 + by, 2.2, 2.6, eye); c.ell(cx + 3, 12 + by, 2.2, 2.6, eye); c.p(cx - 3, 11 + by, 'W'); c.p(cx + 3, 11 + by, 'W')
    for s in (-1, 1): c.line(cx + s * 2, 7 + by, cx + s * 6, 1 + by, 'n'); c.ell(cx + s * 6, 1 + by, 1.2, 1.2, 'Y')
    for k in range(5): c.rect(cx - 5 + k * 2.4, 5 + by - (k % 2) * 2, cx - 4 + k * 2.4, 8 + by, 'H' if k % 2 else 'h')
    c.rect(cx - 6, 7 + by, cx + 6, 8 + by, 'a')
    # the sceptre: a honey dipper (raised in the attack)
    if attack: c.line(cx + 9, 19, cx + 16, 2, 'a', 2); c.ell(cx + 16, 3, 2.6, 3, 'h'); c.ell(cx + 16, 3, 1.5, 1.8, 'H')
    else: c.line(cx + 9, 22 + by, cx + 15, 40, 'a', 2); c.ell(cx + 15, 41, 2.6, 3, 'h'); c.ell(cx + 15, 41, 1.5, 1.8, 'H')
    if act >= 2:                                                       # honey dripping off her
        for k in range(5): x = rnd.uniform(cx - 8, cx + 8); c.line(x, 36 + rnd.uniform(0, 6), x, 46, 'h'); c.p(x, 46, 'H')
    return c.outline().rows()


# ---------------------------------------------------------------- Maestro Lucan
def maestro(act=1, f=0, attack=False):
    c = Cv(); by = 0 if attack else f % 2; cx = 24
    # the tailcoat: long, black, its tails split; legs thin as a puppet's
    c.rect(cx - 3, 34, cx - 2, 46, 'k'); c.rect(cx + 2, 34, cx + 3, 46, 'k'); c.rect(cx - 4, 45, cx - 1, 46, 'K'); c.rect(cx + 1, 45, cx + 4, 46, 'K')
    c.trap(cx, 16 + by, 36 + by, 10, 16, 'k'); c.trap(cx, 17 + by, 34 + by, 3, 6, 'C')   # the shirt front
    for s in (-1, 1): c.line(cx + s * 6, 32 + by, cx + s * 9, 42, 'k', 2)                 # the tails
    c.p(cx, 19 + by, 'm'); c.p(cx - 1, 19 + by, 'm'); c.p(cx + 1, 19 + by, 'm')              # a red bow tie
    c.rect(cx - 7, 17 + by, cx + 7, 18 + by, 'K')
    # the arms up to the control cross (higher in the attack: he jerks the strings)
    yb = 4 if attack else 9 + by
    for s in (-1, 1): c.line(cx + s * 6, 19 + by, cx + s * 9, yb + 4, 'k', 2); c.ell(cx + s * 9, yb + 4, 1.4, 1.4, 's')
    c.rect(cx - 12, yb + 2, cx + 12, yb + 3, 'g'); c.rect(cx - 1, yb - 3, cx + 1, yb + 8, 'g'); c.rect(cx - 11, yb + 2, cx + 11, yb + 2, 'G')
    for x in (cx - 12, cx - 5, cx + 5, cx + 12):                                             # strings hanging from it
        L = 30 if not attack else 36
        for y in range(yb + 3, min(47, yb + L)):
            if (y + x) % 2: c.p(x, y, 'v')
    # the head: a top hat, and the mask of the act
    c.ell(cx, 12 + by, 4.5, 5, 's')
    c.rect(cx - 6, 7 + by, cx + 6, 7 + by, 'k'); c.rect(cx - 4, 0 + by, cx + 4, 6 + by, 'k'); c.rect(cx - 4, 5 + by, cx + 4, 5 + by, 'm')
    mask, M2 = {1: ('G', 'g'), 2: ('B', 'b'), 3: ('C', 'c')}[act]
    c.ell(cx, 12 + by, 4, 4.4, mask); c.ell(cx - 1, 11 + by, 2.5, 2.6, M2 if act != 3 else 'C')
    c.rect(cx - 3, 11 + by, cx - 2, 11 + by, 'o'); c.rect(cx + 2, 11 + by, cx + 3, 11 + by, 'o')    # eye holes
    if act == 1: c.line(cx - 2, 14 + by, cx + 2, 14 + by, 'o'); c.p(cx - 3, 13 + by, 'o'); c.p(cx + 3, 13 + by, 'o')   # a grin
    if act == 2: c.line(cx - 2, 15 + by, cx + 2, 15 + by, 'o'); c.p(cx - 3, 16 + by, 'o'); c.p(cx + 3, 16 + by, 'o'); c.line(cx - 3, 12 + by, cx - 3, 15 + by, 'f')   # a frown, a tear
    return c.outline().rows()


# ---------------------------------------------------------------- Aurelia
def wyrm(act=1, f=0, attack=False):
    c = Cv(); rnd = random.Random(8); by = 0 if attack else f % 2; cx = 24
    cols = 'pqefi'
    # the coils: three rings of faceted glass, stacked
    for k, (yy, rx) in enumerate(((40, 16), (32, 13), (25, 10))):
        c.ell(cx, yy, rx, 5, 'l' if act < 3 else 'L')                        # pale glass
        for j in range(int(rx * 2)):                                        # coloured facets down its face
            if (j // 2 + k) % 3 == 0: c.line(cx - rx + j + 1, yy - 2, cx - rx + j, yy + 3, cols[(j + k) % 5] if act < 3 else 'q')
        for j in range(int(rx * 2)):
            x = cx - rx + j; col = cols[(j // 3 + k) % 5] if act < 3 else ('L' if (j + k) % 2 else 'l')
            c.p(x, yy - 3 + (j % 3 == 0), col); c.p(x, yy - 2, col if j % 2 else 'l')
        c.ell(cx, yy + 3, rx - 3, 1.4, 'f')                                 # (its underside in shadow)
    # the neck rising, and the head: a long crystal snout, a crest of shards
    hx, hy = cx + (3 if attack else 0), 10 + by
    c.line(cx, 24, hx, hy + 4, 'f', 5); c.line(cx - 1, 24, hx - 1, hy + 4, 'L', 2)
    c.ell(hx, hy, 6, 4, 'l'); c.ell(hx + 3, hy + 1, 4, 2.5, 'L'); c.ell(hx - 1, hy - 1, 3, 2, 'f')
    for k in range(5): c.line(hx - 5 + k * 2, hy - 3, hx - 7 + k * 2.4, hy - 8 - (k % 2) * 2, cols[k] if act < 3 else 'L')
    c.p(hx + 1, hy - 1, 'o'); c.p(hx + 2, hy - 1, 'p' if act < 3 else 'q')
    if attack:                                                       # her jaws open, light pouring out
        c.rect(hx + 3, hy + 1, hx + 8, hy + 2, 'o'); c.line(hx + 6, hy + 1, hx + 14, hy - 2, 'L'); c.line(hx + 6, hy + 2, hx + 14, hy + 4, 'q')
    if act == 2:                                                     # cracks of light across her glass
        for k in range(6): x = rnd.uniform(cx - 12, cx + 12); y = rnd.uniform(22, 42); c.line(x, y, x + rnd.uniform(-3, 3), y + rnd.uniform(-3, 3), 'L')
    if act == 3:                                                     # overcharged: a white halo of rays
        for k in range(16): a = k / 16 * math.tau; c.p(cx + math.cos(a) * 21, 28 + math.sin(a) * 18, 'q' if k % 2 else 'L')
    return c.outline().rows()


def fall(fn, k, grey='x'):
    rnd = random.Random(30 + k)
    g = [list(r) for r in fn(3, 0)]
    for y in range(N):
        for x in range(N):
            if g[y][x] not in ('.', 'o') and rnd.random() < 0.3 + 0.3 * k: g[y][x] = grey
    if k == 2:
        sh = [['.'] * N for _ in range(N)]
        for y in range(N):
            for x in range(N):
                ny = y + 12
                if ny < N and g[y][x] != '.' and rnd.random() < 0.7: sh[ny][x] = g[y][x]
        return [''.join(r) for r in sh]
    return [''.join(r) for r in g]


# ---------------------------------------------------------------- their helpers (24-pixel cells)
def brood(k=0):                                               # a brood cell: a waxy hexagon, a grub curled inside
    c = Cv(24)
    for y in range(4, 21):
        w = 9 - abs(y - 12) * 0.35; c.rect(12 - w, y, 12 + w, y, 'h')
    c.ell(12, 12, 5.5, 6, 'H'); c.ell(12, 13, 3.4, 3.4, 'u'); c.p(11, 12, 'N')
    if k: c.line(9, 8, 15, 16, 'n')                          # cracking
    return c.outline().rows()


def understudy(f=0):                                          # an understudy: a smaller marionette in the Maestro's coat
    c = Cv(24); by = f % 2
    c.trap(12, 9 + by, 19, 5, 9, 'k'); c.rect(9, 19, 10, 23, 'k'); c.rect(14, 19, 15, 23, 'k')
    c.ell(12, 6 + by, 3, 3.4, 'c'); c.p(11, 6 + by, 'o'); c.p(13, 6 + by, 'o'); c.line(11, 8 + by, 13, 8 + by, 'o')
    for x in (7, 17):
        for y in range(0, 10 + by):
            if y % 2: c.p(x, y, 'v')
    c.line(7, 10 + by, 8, 12 + by, 'k'); c.line(17, 10 + by, 16, 12 + by, 'k')
    return c.outline().rows()


def image(f=0):                                               # an image of light: Aurelia's head and coil, pale and see-through
    c = Cv(24); by = f % 2
    c.ell(12, 18, 9, 3.5, 'l'); c.ell(12, 18, 7, 2, 'w')
    c.line(12, 17, 13, 8 + by, 'l', 3); c.ell(13, 6 + by, 4, 2.6, 'L'); c.ell(15, 7 + by, 2.4, 1.6, 'W')
    for k in range(3): c.line(10 + k * 2, 4 + by, 9 + k * 2.4, 1 + by, 'W')
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


sheets = {}
BOSSES = (('honey_queen', queen, {1: 'The Queen Rises', 2: 'The Hive Swarms', 3: 'The Queen Is Furious'}),
          ('the_puppeteer', maestro, {1: 'Comedy', 2: 'Tragedy', 3: 'Silence'}),
          ('prism_wyrm', wyrm, {1: 'The Lantern Turns', 2: 'Prismatic', 3: 'Overcharge'}))
previews = []
for bid, fn, names in BOSSES:
    frames = []
    for act in (1, 2, 3):
        frames += [(f'i{act}_0', fn(act, 0)), (f'i{act}_1', fn(act, 1)), (f'a{act}', fn(act, 0, True))]
    frames += [(f'd{k}', fall(fn, k)) for k in range(3)]
    sp = pack(bid, N, 6, frames)
    fr = {k: v['frames']['0'] for k, v in sp.items()}
    anims = {}
    for act in (1, 2, 3):
        anims[f'idle{act}'] = {'frames': [f'i{act}_0', f'i{act}_1'], 'fps': 3, 'loop': True}
        anims[f'attack{act}'] = {'frames': [f'a{act}'] * 3, 'fps': 6, 'loop': False}
    anims['death'] = {'frames': ['d0', 'd1', 'd2'], 'fps': 3, 'loop': False}
    phases = {str(a): {'name': names[a], 'idle': f'idle{a}', 'attack': f'attack{a}'} for a in (1, 2, 3)}
    sheets[f'bx_{bid}'] = {'image': f'{bid}.png', 'kind': 'boss', 'sprites': {bid: {'frames': fr, 'anims': anims, 'phases': phases, 'death': 'death', 'meta': {}}}}
    previews += [g for k, g in frames if k in ('i1_0', 'i2_0', 'i3_0', 'a3', 'd2')]
kin = [('brood0', brood(0)), ('brood1', brood(1)), ('under0', understudy(0)), ('under1', understudy(1)), ('image0', image(0)), ('image1', image(1))]
ksp = pack('hollow_kin', 24, 6, kin); kfr = {k: v['frames']['0'] for k, v in ksp.items()}
def kind(a, b): return {'frames': {a: kfr[a], b: kfr[b]}, 'anims': {'move': {'frames': [a, b], 'fps': 3, 'loop': True}, 'attack': {'frames': [a], 'fps': 3, 'loop': False}}, 'meta': {}}
sheets['hollow_kin'] = {'image': 'hollow_kin.png', 'kind': 'enemy', 'sprites': {'brood': kind('brood0', 'brood1'), 'understudy': kind('under0', 'under1'), 'image': kind('image0', 'image1')}}
SHOTS = {
    'honey_queen.sting': ['...n....', '...n....', '..yYy...', '..nnn...', '..yYy...', '...y....', '...o....', '........'],
    'honey_queen.bee': ['.w...w..', '..wnw...', '.yYnYy..', '.nYnYn..', '..yny...', '........', '........', '........'],
    'honey_queen.nectar': ['........', '..HHH...', '.HuuuH..', '.HuuuH..', '..HHH...', '........', '........', '........'],
    'honey_queen.glob': ['...h....', '..hHh...', '.hHuHh..', '.hHHHh..', '..hhh...', '........', '........', '........'],
    'honey_queen.note': ['....HH..', '....H.H.', '....H...', '..HHH...', '.HuuH...', '..HH....', '........', '........'],
    'the_puppeteer.string': ['...v....', '...v....', '..vGv...', '...v....', '...v....', '..vGv...', '...v....', '........'],
    'the_puppeteer.blade': ['......C.', '.....Cc.', '....Cc..', '...Cc...', '..Cc....', '.gg.....', '.g......', '........'],
    'the_puppeteer.ribbon': ['........', '.mm.....', '..mmm...', '....mm..', '...mm...', '.mm.....', '........', '........'],
    'the_puppeteer.mask': ['........', '..GGG...', '.GoGoG..', '.GGGGG..', '.GoooG..', '..GGG...', '........', '........'],
    'prism_wyrm.bolt': ['........', '...L....', '..LLL...', '.LLlLL..', '..LLL...', '...L....', '........', '........'],
    'prism_wyrm.shard': ['...p....', '..pqp...', '..qeq...', '..efe...', '...i....', '........', '........', '........'],
    'prism_wyrm.pane': ['........', '.lllll..', '.lLLLl..', '.lLLLl..', '.lllll..', '........', '........', '........'],
    'prism_wyrm.ray': ['........', '........', 'pqefiLL.', 'pqefiLL.', '........', '........', '........', '........'],
}
shot_sp = pack('hollow_shots', 8, 8, list(SHOTS.items()))
sheets['hollow_shots'] = {'image': 'hollow_shots.png', 'kind': 'shot', 'sprites': shot_sp}
atlas = {'rf': True, 'meta': {'name': 'The Honey Queen, the Puppeteer and the Prism Wyrm on the three-phase engine', 'version': 1}, 'sheets': sheets}
json.dump(atlas, open(os.path.join(out, 'atlas_hollow_bosses.json'), 'w', encoding='utf8', newline='\n'), indent=1)
ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
if 'hollow/atlas_hollow_bosses.json' not in idx['atlases']:
    idx['atlases'].append('hollow/atlas_hollow_bosses.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
K = 3; P = []
for y in range(N * K):
    row = []
    for x in range(N * K * len(previews)):
        ch = previews[x // (N * K)][y // K][(x // K) % N]
        h = PAL.get(ch); row.append((int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), 255) if h else (42, 40, 51, 255))
    P.append(row)
write_png(os.path.join(root, 'art', '_proto', 'hollow_bosses_preview.png'), P)
print('three bosses\' art -> art/bundle/hollow')
