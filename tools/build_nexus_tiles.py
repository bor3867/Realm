# The Nexus, built in true 8x8 tiles (2026-10-22): the user found the painted Nexus "a pasted blurry screenshot" that
# you walked over like a carpet. Its tiles and objects, native 8x8 pixel art drawn at 2x like the realm's ground:
#   tiles  stone (two flagstones), trim, rune inlay (glowing), wall top and wall face, pool water (4 frames), the chasm
#          (stars twinkling), bridge stone, bazaar sand, garden grass and flowers, forge brick
#   objects  the great crystal (16x32, shimmering and pulsing), crystal shards, waterfalls (falling), braziers
#            (flickering), blossom trees, flower bushes, market stalls, banners (stirring), lamps
#   art/bundle/nexus/nx_tiles.png, nx_objects.png + atlas_nexus.json
#   py -I tools/build_nexus_tiles.py
import json, math, os, random, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
out = os.path.join(root, 'art', 'bundle', 'nexus')
os.makedirs(out, exist_ok=True)
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402
from pixcanvas import Cv  # noqa: E402

PAL = {
    'o': '#0a0810',
    's': '#a8aec0', 'S': '#c4cad8', 'm': '#7e8498', 'M': '#62687c', 'd': '#4a4e62', 'D': '#34364a',   # plaza stone, mortar, shadow
    'w': '#1e4aa8', 'W': '#2a64d0', 'l': '#4a8ae8', 'L': '#9ad0ff', 'f': '#e8f6ff',                   # water
    'c': '#5ab0ff', 'C': '#9ae0ff', 'e': '#e0f6ff', 'E': '#ffffff', 'b': '#2a6ad0',                   # crystal
    'k': '#0a0818', 'K': '#1a1838', 'v': '#8a7aff',                                                   # the chasm
    'y': '#d8b878', 'Y': '#ecd4a0', 'u': '#b8945a',                                                   # sand
    'g': '#3a8a3a', 'G': '#5ab04a', 'h': '#2a6a2a', 'p': '#ff8ac8', 'P': '#ffd0e8', 'q': '#c84a8a',    # garden
    'r': '#8a3a2a', 'R': '#b0503a', 'n': '#5a2a1a',                                                   # brick
    'x': '#ff8a1f', 'X': '#ffd650', 'z': '#fff6c8', 'j': '#6a4a24', 'J': '#9a7040',                   # fire, wood
    't': '#c8203a', 'T': '#ff4a5a', 'a': '#f2d070', 'A': '#a8822e',                                   # cloth, gold
}


def tile(fn, frames=1):
    out = []
    for f in range(frames):
        c = Cv(8); fn(c, f); out.append(c.rows())
    return out


def stone(v):
    def f(c, k):
        rnd = random.Random(v * 13)
        c.rect(0, 0, 7, 7, 's')
        if v == 0: c.rect(0, 3, 7, 3, 'm'); c.rect(3, 0, 3, 2, 'm'); c.rect(6, 4, 6, 7, 'm')
        else: c.rect(0, 4, 7, 4, 'm'); c.rect(5, 0, 5, 3, 'm'); c.rect(2, 5, 2, 7, 'm')
        for _ in range(3): c.p(rnd.randrange(8), rnd.randrange(8), 'S')
        c.p(rnd.randrange(8), rnd.randrange(8), 'M')
    return f


def trim(c, k): c.rect(0, 0, 7, 7, 'm'); c.rect(0, 0, 7, 0, 's'); c.rect(0, 7, 7, 7, 'M'); c.rect(3, 2, 4, 5, 'M')
def inlay(c, k):
    c.rect(0, 0, 7, 7, 's'); c.rect(1, 1, 6, 6, 'M')
    col = 'C' if k else 'c'; c.rect(3, 1, 4, 6, col); c.rect(1, 3, 6, 4, col); c.p(3, 3, 'e' if k else 'C'); c.p(4, 4, 'e' if k else 'C')
def wall_top(c, k): c.rect(0, 0, 7, 7, 'd'); c.rect(0, 0, 7, 1, 'm'); c.rect(1, 3, 6, 6, 'D'); c.p(2, 4, 'M'); c.p(5, 5, 'M')
def wall_side(c, k):
    c.rect(0, 0, 7, 7, 'M'); c.rect(0, 0, 7, 0, 'd')
    for y in (2, 5): c.rect(0, y, 7, y, 'D')
    c.rect(3, 0, 3, 2, 'D'); c.rect(1, 3, 1, 5, 'D'); c.rect(6, 3, 6, 5, 'D'); c.rect(0, 7, 7, 7, 'D')
def water(c, k):
    c.rect(0, 0, 7, 7, 'w')
    for (x, y) in ((1, 1), (5, 3), (2, 6)): c.rect((x + k) % 8, y, (x + k + 1) % 8, y, 'W')
    c.p((4 + k * 2) % 8, (5 + k) % 8, 'l'); c.p((k * 3 + 6) % 8, (k + 2) % 8, 'L')
def chasm(c, k):
    c.rect(0, 0, 7, 7, 'k'); c.p(2, 2, 'K'); c.p(6, 5, 'K')
    c.p(1 + k * 3 % 6, 5 - k, 'v' if k % 2 else 'K'); c.p(5, 1 + k, 'E' if k == 1 else 'K')
def bridge(c, k): c.rect(0, 0, 7, 7, 'S'); c.rect(0, 0, 0, 7, 'm'); c.rect(7, 0, 7, 7, 'm'); c.rect(1, 3, 6, 3, 's'); c.rect(1, 7, 6, 7, 's')
def sand(v):
    def f(c, k):
        rnd = random.Random(40 + v); c.rect(0, 0, 7, 7, 'y')
        for _ in range(4): c.p(rnd.randrange(8), rnd.randrange(8), 'Y' if rnd.random() < 0.6 else 'u')
    return f
def grass(v):
    def f(c, k):
        rnd = random.Random(60 + v); c.rect(0, 0, 7, 7, 'g')
        for _ in range(5): x, y = rnd.randrange(8), rnd.randrange(1, 8); c.p(x, y, 'G'); c.p(x, y - 1, 'G' if v else 'h')
        if v == 2:
            for (x, y, cc) in ((2, 2, 'p'), (5, 5, 'P'), (6, 1, 'p')): c.p(x, y, cc)
    return f
def brick(c, k):
    c.rect(0, 0, 7, 7, 'R'); c.rect(0, 3, 7, 3, 'n'); c.rect(0, 7, 7, 7, 'n'); c.rect(3, 0, 3, 2, 'n'); c.rect(6, 4, 6, 6, 'n'); c.p(1, 1, 'r'); c.p(5, 5, 'r')


TILES = {
    'stone_a': tile(stone(0)), 'stone_b': tile(stone(1)), 'trim': tile(trim), 'inlay': tile(inlay, 2),
    'wall_top': tile(wall_top), 'wall_side': tile(wall_side), 'water': tile(water, 4), 'chasm': tile(chasm, 3),
    'bridge': tile(bridge), 'sand_a': tile(sand(0)), 'sand_b': tile(sand(1)), 'grass_a': tile(grass(0)), 'grass_b': tile(grass(1)),
    'flowers': tile(grass(2)), 'brick': tile(brick),
}


# ---------------------------------------------------------------- objects (their own sizes)
def crystal(k):                                   # the great crystal: 16 wide, 32 tall; a light runs up it, it breathes
    c = Cv(32)
    def poly(pts, col):
        ys = [p[1] for p in pts]
        for y in range(int(min(ys)), int(max(ys)) + 1):
            xs = []
            for i in range(len(pts)):
                (x0, y0), (x1, y1) = pts[i], pts[(i + 1) % len(pts)]
                if (y0 <= y < y1) or (y1 <= y < y0): xs.append(x0 + (y - y0) * (x1 - x0) / (y1 - y0))
            xs.sort()
            for a, b in zip(xs[::2], xs[1::2]): c.rect(a, y, b, y, col)
    glow = (0, 1, 2, 1)[k]
    poly([(8, 1), (14, 12), (12, 28), (8, 31), (4, 28), (2, 12)], 'c')
    poly([(8, 2), (8, 30), (5, 27), (3, 12)], 'C')                 # its lit face
    poly([(8, 2), (13, 12), (11, 27), (8, 30)], 'b')                 # its shadowed face
    c.line(8, 2, 8, 30, 'e')
    hy = 26 - k * 6                                                  # a light running up it
    c.rect(4, hy, 7, hy + 1, 'E'); c.p(9, hy - 1, 'f')
    if glow:
        for (x, y) in ((1, 8 - glow), (15, 14 - glow), (2, 22), (14, 4 + glow)): c.p(x, y, 'e')
    g = [r[:16] for r in c.outline().rows()]
    return g


def shard(k):
    c = Cv(12)
    c.trap(4, 1, 10, 1, 5, 'c'); c.line(4, 1, 4, 10, 'C'); c.p(4, 2 + k * 3, 'E')
    return [r[:8] for r in c.outline().rows()]


def waterfall(k):                                 # 16x16: water falling over a stone lip into the pool
    c = Cv(16)
    c.rect(0, 0, 15, 2, 'd'); c.rect(0, 0, 15, 0, 'm')
    c.rect(3, 3, 12, 15, 'W')
    for x in range(3, 13):
        for y in range(3, 16):
            if (y + k * 2 + x * 3) % 5 == 0: c.p(x, y, 'L')
            if (y + k * 2 + x * 3) % 7 == 0: c.p(x, y, 'f')
    for x in range(1, 15, 2): c.p(x, 15, 'f' if (x + k) % 4 else 'L')   # spray where it lands
    return c.rows()


def brazier(k):                                   # 8x12: a bowl on a stand, the flame flickering
    c = Cv(12)
    c.rect(3, 9, 4, 11, 'M'); c.rect(1, 6, 6, 8, 'A'); c.rect(1, 6, 6, 6, 'a')
    fl = [(3, 1), (2, 2), (4, 0)][k]
    c.ell(3.5, 4, 2.2, 2, 'x'); c.ell(fl[0] + 0.5, fl[1] + 2, 1.2, 1.6, 'X'); c.p(fl[0], fl[1] + 1, 'z')
    return [r[:8] for r in c.outline().rows()]


def blossom(k):                                   # 16x24: a pink blossom tree
    c = Cv(24)
    c.rect(7, 14, 8, 23, 'j'); c.line(8, 16, 11, 12, 'j'); c.line(7, 17, 4, 13, 'j')
    for (x, y, r) in ((8, 8, 6), (4, 11, 4), (12, 10, 4), (8, 4, 4)): c.ell(x, y, r, r * 0.8, 'q')
    for (x, y, r) in ((7, 7, 4.5), (4, 10, 2.8), (11, 9, 3), (8, 3, 3)): c.ell(x, y, r, r * 0.8, 'p')
    rnd = random.Random(7 + k)
    for _ in range(10): c.p(rnd.randrange(2, 15), rnd.randrange(1, 14), 'P')
    if k: c.p(13, 18, 'P'); c.p(3, 20, 'p')                         # a petal falling
    return [r[:16] for r in c.outline().rows()]


def bush(k):
    c = Cv(8); c.ell(3.5, 4.5, 3.5, 3, 'g'); c.ell(3, 4, 2.2, 1.8, 'G')
    for (x, y) in ((2, 3), (5, 4), (3, 6)): c.p(x, y, 'p' if k == 0 else 'X')
    return c.outline().rows()


def stall(k):                                     # 16x16: a market stall, striped awning
    c = Cv(16)
    c.rect(1, 9, 14, 14, 'J'); c.rect(1, 9, 14, 9, 'j'); c.rect(2, 10, 13, 10, 'Y')
    for x in range(0, 16): c.rect(x, 3, x, 6, 't' if (x // 2) % 2 else 'E')
    c.rect(0, 2, 15, 2, 'n'); c.rect(1, 6, 1, 13, 'j'); c.rect(14, 6, 14, 13, 'j')
    for (x, col) in ((4, 'X'), (7, 'p'), (10, 'G')): c.ell(x, 8, 1.2, 1, col)
    return c.outline().rows()


def banner(k):                                    # 8x16: a hanging banner, stirring
    c = Cv(16)
    c.rect(3, 0, 4, 15, 'j'); c.rect(0, 1, 7, 1, 'A')
    sway = (0, 1)[k]
    c.rect(1 + sway, 2, 6 + sway, 10, 't'); c.rect(2 + sway, 3, 5 + sway, 3, 'a'); c.p(3 + sway, 6, 'a'); c.p(4 + sway, 6, 'a')
    c.p(1 + sway, 11, 't'); c.p(3 + sway, 11, 't'); c.p(5 + sway, 11, 't')
    return [r[:8] for r in c.outline().rows()]


def lamp(k):
    c = Cv(16)
    c.rect(3, 6, 4, 15, 'd'); c.rect(2, 14, 5, 15, 'D')
    c.rect(2, 1, 5, 5, 'A'); c.rect(3, 2, 4, 4, 'X' if k else 'z')
    return [r[:8] for r in c.outline().rows()]


OBJECTS = {
    'crystal_pillar': ([crystal(k) for k in range(4)], 5),
    'shard': ([shard(k) for k in range(2)], 3),
    'waterfall': ([waterfall(k) for k in range(3)], 8),
    'brazier': ([brazier(k) for k in range(3)], 7),
    'blossom_tree': ([blossom(k) for k in range(2)], 1),
    'flower_bush': ([bush(0)], 1), 'flower_bush_gold': ([bush(1)], 1),
    'stall': ([stall(0)], 1),
    'banner_red': ([banner(k) for k in range(2)], 2),
    'lamp': ([lamp(k) for k in range(2)], 2),
}


def pack(name, entries):                          # entries: [(key, grid)], shelf-packed in rows
    W = 256; x = y = rowh = 0; place = []
    for key, g in entries:
        w, h = len(g[0]), len(g)
        if x + w > W: x = 0; y += rowh + 1; rowh = 0
        place.append((key, g, x, y)); x += w + 1; rowh = max(rowh, h)
    H = y + rowh + 1
    px = [[(0, 0, 0, 0)] * W for _ in range(H)]; fr = {}
    for key, g, ox, oy in place:
        for yy, row in enumerate(g):
            for xx, ch in enumerate(row):
                if ch in PAL: h = PAL[ch]; px[oy + yy][ox + xx] = (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), 255)
        fr[key] = [ox, oy, len(g[0]), len(g)]
    write_png(os.path.join(out, name + '.png'), px)
    return fr


te = [(f'{k}_{i}', g) for k, frames in TILES.items() for i, g in enumerate(frames)]
tfr = pack('nx_tiles', te)
tiles = {'nexus_' + k: {'frames': {str(i): tfr[f'{k}_{i}'] for i in range(len(fs))}, 'anims': {'idle': {'frames': [str(i) for i in range(len(fs))], 'fps': 3, 'loop': True}}, 'meta': {}} for k, fs in TILES.items()}
oe = [(f'{k}_{i}', g) for k, (frames, fps) in OBJECTS.items() for i, g in enumerate(frames)]
ofr = pack('nx_objects', oe)
objs = {'nexus_' + k: {'frames': {str(i): ofr[f'{k}_{i}'] for i in range(len(fs))}, 'anims': {'idle': {'frames': [str(i) for i in range(len(fs))], 'fps': fps, 'loop': True}}, 'meta': {}} for k, (fs, fps) in OBJECTS.items()}
atlas = {'rf': True, 'meta': {'name': 'The Nexus in true 8x8 tiles', 'version': 1}, 'sheets': {
    'nx_tiles': {'image': 'nx_tiles.png', 'kind': 'tile', 'sprites': tiles},
    'nx_objects': {'image': 'nx_objects.png', 'kind': 'object', 'sprites': objs}}}
json.dump(atlas, open(os.path.join(out, 'atlas_nexus.json'), 'w', encoding='utf8', newline='\n'), indent=1)
ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
if 'nexus/atlas_nexus.json' not in idx['atlases']:
    idx['atlases'].append('nexus/atlas_nexus.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
# a preview: every tile 4 times over at 6x, and the objects
K = 6; prev = [g for k, fs in TILES.items() for g in fs[:1]] + [fs[0] for fs, _ in OBJECTS.values()]
Wp = sum(len(g[0]) for g in prev) + len(prev) * 2; Hp = max(len(g) for g in prev)
P = [[(42, 40, 51, 255)] * (Wp * K) for _ in range(Hp * K)]
x0 = 0
for g in prev:
    for y, row in enumerate(g):
        for x, ch in enumerate(row):
            h = PAL.get(ch)
            if h:
                for yy in range(K):
                    for xx in range(K): P[y * K + yy][(x0 + x) * K + xx] = (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), 255)
    x0 += len(g[0]) + 2
write_png(os.path.join(root, 'art', '_proto', 'nexus_tiles_preview.png'), P)
print('the Nexus tiles and objects -> art/bundle/nexus')
