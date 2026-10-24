# The Nexus, built in true 8x8 tiles (2026-10-22): the user found the painted Nexus "a pasted blurry screenshot" that
# you walked over like a carpet. Its tiles and objects, native 8x8 pixel art drawn at 2x like the realm's ground.
# Objects carry no outline of their own: the renderer outlines every sprite (2026-10-24: baked in, it was doubled).
# Second pass (same day): more detail, and water that flows and comes from somewhere. The great crystal weeps it: a
# stream falls from its tip onto the dais, wells out over the dais, swirls round the pool, runs off down two channels
# and spills over the plaza's edge into the starry chasm.
#   tiles  stone (five flagstones: plain, worn, cracked, mossy, a chipped rune), trim, rune inlay, the crystal's dais,
#          wall top and wall face, calm water, flowing water (8 directions, 2 of each, every tile on one frame so the
#          current runs on unbroken), rapids at the spill, the falls into the chasm (near and far), a spring, foam (an
#          overlay for wherever water meets anything else), the chasm, bridges (both ways), sand, grass and flowers,
#          brick (and brick with embers glowing in its seams)
#   objects  the great crystal (32x64, floating, bobbing, a light climbing it, motes circling, its stream falling),
#            crystal shards, crystal fountains, braziers, blossom trees, flower bushes, market stalls, banners, lamps
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
    's': '#a8aec0', 'S': '#c4cad8', 'm': '#7e8498', 'M': '#62687c', 'd': '#4a4e62', 'D': '#34364a', 'Z': '#dde2ee',   # stone
    'i': '#163a8a', 'w': '#1e4aa8', 'W': '#2a64d0', 'l': '#4a8ae8', 'L': '#9ad0ff', 'f': '#e8f6ff',                   # water
    'c': '#5ab0ff', 'C': '#9ae0ff', 'e': '#e0f6ff', 'E': '#ffffff', 'b': '#2a6ad0', 'B': '#1a4a9a',                   # crystal
    'k': '#0a0818', 'K': '#1a1838', 'v': '#8a7aff', 'V': '#c8c0ff',                                                   # the chasm
    'y': '#d8b878', 'Y': '#ecd4a0', 'u': '#b8945a',                                                                   # sand
    'g': '#3a8a3a', 'G': '#5ab04a', 'h': '#2a6a2a', 'p': '#ff8ac8', 'P': '#ffd0e8', 'q': '#c84a8a',                    # garden
    'r': '#8a3a2a', 'R': '#b0503a', 'n': '#5a2a1a',                                                                   # brick
    'x': '#ff8a1f', 'X': '#ffd650', 'z': '#fff6c8', 'j': '#6a4a24', 'J': '#9a7040',                                   # fire, wood
    't': '#c8203a', 'T': '#ff4a5a', 'a': '#f2d070', 'A': '#a8822e',                                                   # cloth, gold
}
DIRS8 = [(1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0), (-1, -1), (0, -1), (1, -1)]   # E SE S SW W NW N NE (y down)
SIDES = [(0, -1), (1, 0), (0, 1), (-1, 0)]                                       # N E S W (the renderer's DIRS)


def tile(fn, frames=1):
    out = []
    for f in range(frames):
        c = Cv(8); fn(c, f); out.append(c.rows())
    return out


# ---------------------------------------------------------------- stone
def slabs(c, rects, rnd):                         # flagstones: mortar between, each slab lit top-left, shaded bottom-right
    c.rect(0, 0, 7, 7, 'M')
    for (x0, y0, x1, y1) in rects:
        c.rect(x0, y0, x1, y1, 's'); c.rect(x0, y0, x1, y0, 'S'); c.rect(x0, y0, x0, y1, 'S')
        c.rect(x0 + 1, y1, x1, y1, 'm'); c.rect(x1, y0 + 1, x1, y1, 'm')
        if x1 - x0 > 2 and y1 - y0 > 1 and rnd.random() < 0.7: c.p(rnd.randrange(x0 + 1, x1), rnd.randrange(y0 + 1, y1), 'S' if rnd.random() < 0.5 else 'm')
LAYOUTS = [[(0, 0, 3, 2), (5, 0, 7, 2), (0, 4, 1, 7), (3, 4, 7, 6)],
           [(0, 0, 4, 3), (6, 0, 7, 3), (0, 5, 2, 7), (4, 5, 7, 7)],
           [(1, 0, 7, 1), (0, 3, 3, 7), (5, 3, 7, 6)]]


def stone(v):
    def f(c, k):
        rnd = random.Random(v * 13 + 5); slabs(c, LAYOUTS[v % 3], rnd)
        if v == 2: c.line(4, 4, 6, 6, 'M'); c.p(5, 4, 'm'); c.p(6, 5, 'M')               # cracked
        if v == 3:                                                                       # moss in the mortar
            for (x, y) in ((4, 2), (4, 3), (2, 4), (1, 3)): c.p(x, y, 'h')
            c.p(4, 3, 'g'); c.p(2, 3, 'G')
        if v == 4:                                                                       # a chipped rune, faintly lit
            col = ('c', 'C', 'c', 'b')[k]
            c.p(5, 4, col); c.p(6, 5, col); c.p(4, 5, col); c.p(5, 6, col)
    return f


def trim(c, k):                                   # the kerb round the water: a bevelled stone lip
    c.rect(0, 0, 7, 7, 'm'); c.rect(0, 0, 7, 1, 'S'); c.rect(0, 2, 7, 2, 's'); c.rect(0, 6, 7, 7, 'M')
    c.p(0, 4, 'M'); c.p(4, 4, 'M'); c.p(2, 1, 'Z'); c.p(6, 1, 'Z')


def inlay(c, k):                                  # the rune ring: a cross of light pulsing in a dark socket
    c.rect(0, 0, 7, 7, 's'); c.rect(0, 0, 7, 0, 'S'); c.rect(1, 1, 6, 6, 'D'); c.rect(1, 6, 6, 6, 'M')
    col, hi = [('b', 'c'), ('c', 'C'), ('C', 'e'), ('c', 'C')][k]
    c.rect(3, 2, 4, 5, col); c.rect(2, 3, 5, 4, col); c.p(3, 3, hi); c.p(4, 4, hi)
    if k == 2: c.p(1, 1, 'c'); c.p(6, 6, 'c'); c.p(6, 1, 'c'); c.p(1, 6, 'c')


def dais(c, k):                                   # the crystal's dais: dark polished stone, light running in its grooves
    c.rect(0, 0, 7, 7, 'd'); c.rect(0, 0, 7, 0, 'm'); c.rect(0, 0, 0, 7, 'm')
    for t in range(8):
        lit = (t + k * 2) % 8 < 2
        c.p(t, 3, 'C' if lit else 'B'); c.p(3, t, 'C' if lit else 'B')
    c.p(3, 3, 'e'); c.p(6, 6, 'D'); c.p(1, 6, 'D')


def wall_top(c, k):                               # the parapet's top: two capstones
    c.rect(0, 0, 7, 7, 'D')
    for (x0, x1) in ((0, 3), (5, 7)):
        c.rect(x0, 1, x1, 6, 'd'); c.rect(x0, 1, x1, 1, 's'); c.rect(x0, 2, x0, 6, 'm'); c.rect(x0 + 1, 6, x1, 6, 'D')
    c.p(2, 3, 'm'); c.p(6, 4, 'M')


def wall_side(c, k):                              # its face: courses of block, a little moss at the foot
    c.rect(0, 0, 7, 7, 'M'); c.rect(0, 0, 7, 0, 's')
    for y in (3, 6): c.rect(0, y, 7, y, 'D')
    c.rect(4, 1, 4, 2, 'D'); c.rect(1, 4, 1, 5, 'D'); c.rect(6, 4, 6, 5, 'D')
    c.rect(0, 1, 3, 1, 'm'); c.rect(5, 1, 7, 1, 'm'); c.rect(2, 4, 5, 4, 'm')
    c.rect(0, 7, 7, 7, 'D'); c.p(1, 6, 'h'); c.p(2, 6, 'g'); c.p(6, 6, 'h')


# ---------------------------------------------------------------- water
def calm(c, k):                                   # still water (the corner basins, the pond): a slow shimmer
    c.rect(0, 0, 7, 7, 'w'); c.p(6, 6, 'i'); c.p(0, 2, 'i')
    for (x, y) in ((1, 1), (5, 3), (2, 6)): c.rect((x + k) % 8, y, (x + k + 1) % 8, y, 'W')
    c.p((4 + k * 2) % 8, (5 + k) % 8, 'l'); c.p((k * 3 + 6) % 8, (k + 2) % 8, 'L')


def current(d, seed, rapids=False):               # flowing water: a pattern on a torus, slid one pixel a frame along d
    rnd = random.Random(seed * 31 + d * 7 + (99 if rapids else 0))
    dx, dy = DIRS8[d]; pts = {}
    for _ in range(6 if rapids else 4):
        x, y, n = rnd.randrange(8), rnd.randrange(8), rnd.choice((2, 3, 3))
        for i in range(n): pts[((x - dx * i) % 8, (y - dy * i) % 8)] = ('L' if rapids else 'l') if i == 0 else ('l' if rapids else 'W')
    for _ in range(4 if rapids else 2): pts[(rnd.randrange(8), rnd.randrange(8))] = 'f' if rapids else 'i'
    pts[(rnd.randrange(8), rnd.randrange(8))] = 'f' if rapids else 'L'

    def f(c, k):
        c.rect(0, 0, 7, 7, 'W' if rapids else 'w')
        for (x, y), col in pts.items(): c.p((x + dx * k) % 8, (y + dy * k) % 8, col)
    return f


def fall(d, near):                                # over the chasm: the spilled water streaming off into the stars
    rnd = random.Random(500 + d * 3 + near)
    dx, dy = DIRS8[d]; pts = {}
    for _ in range(5 if near else 3):
        x, y = rnd.randrange(8), rnd.randrange(8)
        for i in range(3 if near else 2): pts[((x - dx * i) % 8, (y - dy * i) % 8)] = ('L' if near else 'l') if i == 0 else ('l' if near else 'W')
    for _ in range(3 if near else 2): pts[(rnd.randrange(8), rnd.randrange(8))] = 'f' if near else 'L'
    stars = [(rnd.randrange(8), rnd.randrange(8)) for _ in range(2)]

    def f(c, k):
        c.rect(0, 0, 7, 7, 'k')
        for (x, y) in stars: c.p(x, y, 'K')
        if near:                                                       # a thin sheet of water still holding together
            for t in range(8):
                c.p(*((t, 2 + (t % 2) * 3) if dx else (2 + (t % 2) * 3, t)), 'B')
        for (x, y), col in pts.items(): c.p((x + dx * k) % 8, (y + dy * k) % 8, col)
    return f


def spring(c, k):                                 # water welling up: rings spreading from the middle
    c.rect(0, 0, 7, 7, 'W')
    r = (k % 4) + 0.6
    for a in range(16):
        t = a / 16 * math.tau; c.p(3.5 + math.cos(t) * r, 3.5 + math.sin(t) * r, 'L' if k % 4 < 3 else 'l')
    c.p(3, 3, 'f'); c.p(4, 4, 'f' if k % 2 else 'L'); c.p(4, 3, 'L')


def foam(d, k):                                   # where water meets a kerb or a bridge: a lace of foam on that side
    c = Cv(8); sx, sy = SIDES[d]; st = k // 2
    for t in range(8):
        for depth, col in ((0, 'f' if (t + st) % 4 else 'L'), (1, 'L' if (t * 3 + st) % 5 == 0 else None)):
            if not col: continue
            x = t if sx == 0 else (7 - depth if sx > 0 else depth)
            y = t if sy == 0 else (7 - depth if sy > 0 else depth)
            c.p(x, y, col)
    return c.rows()


# ---------------------------------------------------------------- the rest of the ground
def chasm(c, k):
    c.rect(0, 0, 7, 7, 'k'); c.p(2, 2, 'K'); c.p(6, 5, 'K'); c.p(0, 7, 'K')
    c.p(1 + k * 3 % 6, 5 - k, 'v' if k % 2 else 'K'); c.p(5, 1 + k, 'V' if k == 1 else 'K')


def bridge(horizontal):
    def f(c, k):
        c.rect(0, 0, 7, 7, 'J')
        for t in range(0, 8, 2):
            if horizontal: c.rect(t, 1, t, 6, 'j')
            else: c.rect(1, t, 6, t, 'j')
        if horizontal: c.rect(0, 0, 7, 0, 'A'); c.rect(0, 7, 7, 7, 'A'); c.p(3, 0, 'a')
        else: c.rect(0, 0, 0, 7, 'A'); c.rect(7, 0, 7, 7, 'A'); c.p(0, 3, 'a')
    return f


def sand(v):
    def f(c, k):
        rnd = random.Random(40 + v); c.rect(0, 0, 7, 7, 'y')
        for _ in range(5): c.p(rnd.randrange(8), rnd.randrange(8), 'Y' if rnd.random() < 0.6 else 'u')
        if v: c.line(1, 5, 4, 4, 'Y'); c.p(5, 4, 'u')                  # a ripple the wind left
    return f


def grass(v):
    def f(c, k):
        rnd = random.Random(60 + v); c.rect(0, 0, 7, 7, 'g')
        for _ in range(5): x, y = rnd.randrange(8), rnd.randrange(1, 8); c.p(x, y, 'G'); c.p(x, y - 1, 'G' if v else 'h')
        if v == 2:
            for (x, y, cc) in ((2, 2, 'p'), (5, 5, 'P'), (6, 1, 'p')): c.p(x, y, cc)
            c.p(2, 3, 'h'); c.p(5, 6, 'h')
    return f


def brick(v):
    def f(c, k):
        c.rect(0, 0, 7, 7, 'R'); c.rect(0, 3, 7, 3, 'n'); c.rect(0, 7, 7, 7, 'n'); c.rect(3, 0, 3, 2, 'n'); c.rect(6, 4, 6, 6, 'n')
        c.rect(0, 0, 2, 0, 'T'); c.rect(4, 0, 7, 0, 'T'); c.rect(0, 4, 5, 4, 'T')
        c.p(1, 1, 'r'); c.p(5, 5, 'r')
        if v:                                                          # embers glowing in the seams
            col = ('x', 'X')[k]
            c.p(1, 3, col); c.p(2, 3, 'x'); c.p(6, 5, col); c.p(5, 7, 'x' if k else 'n')
    return f


TILES = {
    'stone_a': tile(stone(0)), 'stone_b': tile(stone(1)), 'stone_c': tile(stone(2)), 'stone_d': tile(stone(3)), 'stone_e': tile(stone(4), 4),
    'trim': tile(trim), 'inlay': tile(inlay, 4), 'dais': tile(dais, 4),
    'wall_top': tile(wall_top), 'wall_side': tile(wall_side),
    'water': tile(calm, 4), 'spring': tile(spring, 8),
    'chasm': tile(chasm, 3), 'bridge': tile(bridge(False)), 'bridge_h': tile(bridge(True)),
    'sand_a': tile(sand(0)), 'sand_b': tile(sand(1)), 'grass_a': tile(grass(0)), 'grass_b': tile(grass(1)),
    'flowers': tile(grass(2)), 'brick': tile(brick(0)), 'brick_ember': tile(brick(1), 2),
}
for d in range(8):
    for s in range(2): TILES[f'flow_{d}_{s}'] = tile(current(d, s), 8)
for d in (0, 4):
    TILES[f'rapids_{d}'] = tile(current(d, 0, True), 8)
    TILES[f'fall_{d}_near'] = tile(fall(d, 1), 8); TILES[f'fall_{d}_far'] = tile(fall(d, 0), 8)
TILES['foam'] = [foam(d, k) for d in range(4) for k in range(8)]


# ---------------------------------------------------------------- objects (their own sizes)
def poly(c, pts, col):
    ys = [p[1] for p in pts]
    for y in range(int(min(ys)), int(max(ys)) + 1):
        xs = []
        for i in range(len(pts)):
            (x0, y0), (x1, y1) = pts[i], pts[(i + 1) % len(pts)]
            if (y0 <= y < y1) or (y1 <= y < y0): xs.append(x0 + (y - y0) * (x1 - x0) / (y1 - y0))
        xs.sort()
        for a, b in zip(xs[::2], xs[1::2]): c.rect(math.ceil(a - 0.5), y, math.floor(b - 0.5), y, col)


def crystal(k):                                   # the great crystal: 32x64, floating over its dais, weeping the water
    c = Cv(64)
    b = (0, 0, 1, 1, 2, 2, 1, 1)[k]; oy = 3 + b
    T, UL, UR, LL, LR, BT = (16, oy), (5, oy + 15), (27, oy + 15), (8, oy + 36), (24, oy + 36), (16, oy + 46)
    def motes(front):
        for j in range(3):
            a = k * math.tau / 8 + j * math.tau / 3; s = math.sin(a)
            if (s > 0) != front: continue
            x, y = 16 + math.cos(a) * 15, oy + 26 + s * 4
            c.p(x, y, 'E' if front else 'C'); c.p(x - math.sin(a) * 1.2, y, 'e' if front else 'c')
    motes(False)
    poly(c, [T, UR, LR, BT, LL, UL], 'c')
    poly(c, [T, (16, BT[1]), LL, UL], 'C')                            # its lit face
    poly(c, [(19, oy + 2), UR, LR, (17, BT[1] - 1)], 'b')             # its shadowed face
    poly(c, [(23, oy + 10), UR, LR, (21, oy + 34)], 'B')
    c.line(16, oy, 16, BT[1], 'e'); c.line(UL[0], UL[1], 16, UL[1] + 2, 'e'); c.line(16, UL[1] + 2, UR[0] - 1, UR[1], 'c')
    c.line(LL[0], LL[1], 16, LL[1] + 2, 'C')
    glow = 'e' if k in (2, 3, 4) else 'C'                             # its heart, breathing
    c.ell(13, oy + 24, 2.2, 8, glow); c.line(13, oy + 18, 13, oy + 30, 'E' if glow == 'e' else 'e')
    hy = oy + 42 - k * 5                                              # a band of light climbing it
    for y in (hy, hy + 1):
        for x in range(32):
            if 0 <= y < 64 and c.g[y][x] in 'cCbB': c.g[y][x] = 'e' if c.g[y][x] in 'cC' else 'c'
    if k in (1, 5):                                                   # a glint running along its edge
        gx, gy = (UL[0] + 2, UL[1] + 1) if k == 1 else (21, oy + 8)
        for (dx, dy) in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)): c.p(gx + dx, gy + dy, 'E')
    motes(True)
    for y in range(BT[1] + 1, 59):                                    # its stream, falling from the tip
        c.p(15, y, 'l'); c.p(16, y, 'L' if (y - k * 2) % 4 == 0 else 'l')
        if (y - k * 2) % 6 == 3: c.p(17, y, 'L')
    sp = k % 4                                                        # and splashing on the dais
    c.rect(12 - sp, 60, 19 + sp, 60, 'L'); c.rect(14, 59, 17, 59, 'f')
    c.p(11 - sp, 58 - sp % 2, 'L'); c.p(20 + sp, 58 - sp % 2, 'L'); c.p(13 - sp, 61, 'l'); c.p(18 + sp, 61, 'l')
    return [r[:32] for r in c.rows()]


def shard(k):
    c = Cv(12)
    c.trap(4, 1, 10, 1, 5, 'c'); c.line(4, 1, 4, 10, 'C'); c.line(5, 3, 5, 10, 'b')
    c.p(4, 2 + k * 3, 'E'); c.p(3, 3 + k * 3, 'e')
    c.rect(1, 11, 7, 11, 'L' if k % 2 else 'l')                       # where it stands in the water
    return [r[:8] for r in c.rows()]


def fountain(k):                                  # 16x24: a crystal shard in a basin, throwing the crystal's water up
    c = Cv(24)
    c.trap(8, 6, 20, 1, 5, 'c'); c.line(8, 6, 8, 20, 'C'); c.line(9, 9, 9, 20, 'b'); c.p(8, 7 + (k * 3) % 12, 'E')
    c.rect(1, 21, 14, 21, 'f' if k % 2 else 'L')
    # the water: thin arcs of spray, drawn last
    for side in (-1, 1):                                              # two arcs of water
        for i in range(12):
            t = i / 11; x = 8 + side * t * 7; y = 9 - math.sin(t * math.pi) * 6 + t * 12
            c.p(x, y, 'L' if (i + k) % 3 == 0 else 'l')
    for i in range(4): c.p(8 + (i - 1.5) * 1.5, 4 - (i + k) % 3, 'L' if i % 2 else 'f')   # the jet's crown
    c.p(0, 20, 'l'); c.p(15, 20, 'l')
    return [r[:16] for r in c.rows()]


def brazier(k):                                   # 8x12: a bowl on a stand, the flame flickering
    c = Cv(12)
    c.rect(3, 9, 4, 11, 'm'); c.rect(2, 11, 5, 11, 'M'); c.rect(1, 6, 6, 8, 'A'); c.rect(1, 6, 6, 6, 'a'); c.p(2, 7, 'a')   # (its stand in mid stone)
    fl = [(3, 1), (2, 2), (4, 0)][k]
    c.ell(3.5, 4, 2.2, 2, 'x'); c.ell(fl[0] + 0.5, fl[1] + 2, 1.2, 1.6, 'X'); c.p(fl[0], fl[1] + 1, 'z')
    c.p((5, 1, 6)[k], (0, 1, 2)[k], 'X')                             # a spark going up
    return [r[:8] for r in c.rows()]


def blossom(k):                                   # 16x24: a pink blossom tree
    c = Cv(24)
    c.rect(7, 14, 8, 23, 'j'); c.line(8, 16, 11, 12, 'j'); c.line(7, 17, 4, 13, 'j'); c.rect(7, 14, 7, 23, 'J')
    for (x, y, r) in ((8, 8, 6), (4, 11, 4), (12, 10, 4), (8, 4, 4)): c.ell(x, y, r, r * 0.8, 'q')
    for (x, y, r) in ((7, 7, 4.5), (4, 10, 2.8), (11, 9, 3), (8, 3, 3)): c.ell(x, y, r, r * 0.8, 'p')
    rnd = random.Random(7)
    for _ in range(10): c.p(rnd.randrange(2, 15), rnd.randrange(1, 14), 'P')
    fx, fy = [(13, 15), (12, 18), (13, 21)][k]; c.p(fx, fy, 'P')     # a petal falling
    return [r[:16] for r in c.rows()]


def bush(k):
    c = Cv(8); c.ell(3.5, 4.5, 3.5, 3, 'g'); c.ell(3, 4, 2.2, 1.8, 'G'); c.p(2, 2, 'G')
    for (x, y) in ((2, 3), (5, 4), (3, 6)): c.p(x, y, 'p' if k == 0 else 'X')
    return c.rows()


def stall(k):                                     # 16x16: a market stall, striped awning
    c = Cv(16)
    c.rect(1, 9, 14, 14, 'J'); c.rect(1, 9, 14, 9, 'j'); c.rect(2, 10, 13, 10, 'Y')
    for x in range(0, 16): c.rect(x, 3, x, 6, 't' if (x // 2) % 2 else 'E')
    c.rect(0, 2, 15, 2, 'n'); c.rect(1, 6, 1, 13, 'j'); c.rect(14, 6, 14, 13, 'j')
    for x in range(0, 16, 2): c.p(x, 7, 't' if (x // 2) % 2 else 'E')                # the awning's scalloped hem
    for (x, col) in ((4, 'X'), (7, 'p'), (10, 'G')): c.ell(x, 8, 1.2, 1, col)
    c.rect(3, 12, 5, 13, 'A'); c.rect(9, 12, 12, 13, 'u')
    return c.rows()


def banner(k):                                    # 8x16: a hanging banner, stirring
    c = Cv(16)
    c.rect(3, 0, 4, 15, 'j'); c.rect(0, 1, 7, 1, 'A'); c.p(0, 1, 'a'); c.p(7, 1, 'a')
    sway = (0, 1)[k]
    c.rect(1 + sway, 2, 6 + sway, 10, 't'); c.rect(1 + sway, 2, 1 + sway, 10, 'T'); c.rect(2 + sway, 3, 5 + sway, 3, 'a')
    c.p(3 + sway, 6, 'a'); c.p(4 + sway, 6, 'a'); c.p(3 + sway, 5, 'C'); c.p(4 + sway, 7, 'C')
    c.p(1 + sway, 11, 't'); c.p(3 + sway, 11, 't'); c.p(5 + sway, 11, 't')
    return [r[:8] for r in c.rows()]


def lamp(k):
    c = Cv(16)
    c.rect(3, 6, 4, 15, 'm'); c.rect(3, 6, 3, 15, 's'); c.rect(2, 14, 5, 15, 'M')   # (a lighter post: it read as a thick black line)
    c.rect(2, 1, 5, 5, 'A'); c.rect(3, 2, 4, 4, ('X', 'z', 'X', 'x')[k]); c.rect(1, 0, 6, 0, 'A')
    return [r[:8] for r in c.rows()]


OBJECTS = {
    'crystal_pillar': ([crystal(k) for k in range(8)], 7),
    'shard': ([shard(k) for k in range(3)], 3),
    'fountain': ([fountain(k) for k in range(4)], 9),
    'brazier': ([brazier(k) for k in range(3)], 7),
    'blossom_tree': ([blossom(k) for k in range(3)], 2),
    'flower_bush': ([bush(0)], 1), 'flower_bush_gold': ([bush(1)], 1),
    'stall': ([stall(0)], 1),
    'banner_red': ([banner(k) for k in range(2)], 2),
    'lamp': ([lamp(k) for k in range(4)], 4),
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
atlas = {'rf': True, 'meta': {'name': 'The Nexus in true 8x8 tiles', 'version': 2}, 'sheets': {
    'nx_tiles': {'image': 'nx_tiles.png', 'kind': 'tile', 'sprites': tiles},
    'nx_objects': {'image': 'nx_objects.png', 'kind': 'object', 'sprites': objs}}}
json.dump(atlas, open(os.path.join(out, 'atlas_nexus.json'), 'w', encoding='utf8', newline='\n'), indent=1)
ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
if 'nexus/atlas_nexus.json' not in idx['atlases']:
    idx['atlases'].append('nexus/atlas_nexus.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
# a preview at 6x: a few tiles three by three (so the joins show), then the objects
K = 6; prev = []
for key in ('stone_a', 'stone_c', 'stone_d', 'stone_e', 'inlay', 'dais', 'trim', 'wall_top', 'wall_side', 'water', 'flow_0_0', 'flow_1_0', 'rapids_4', 'fall_4_near', 'fall_4_far', 'spring', 'chasm', 'bridge', 'bridge_h', 'brick_ember', 'grass_b', 'sand_b'):
    g = TILES[key][0]; prev.append([row * 3 for row in g] * 3)
prev += [fs[0] for fs, _ in OBJECTS.values()]
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
