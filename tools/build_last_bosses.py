# Art for the last seven older bosses on the three-phase engine: the Sleeper and the six realm bosses
# (src/bosses/the_sleeper.js, brine_cathedral.js, wick_mother.js, orrery_of_winter.js, penitent_colossus.js,
# emily_the_yapper.js, the_fallen_star.js). Each: two idle frames and an attack frame a phase, a three-frame death,
# shots, and any helpers. All drawn with tools/pixcanvas.py.
#   The Sleeper         - a vast moth-pale dreamer curled on a cloud, nightcap, eyes shut; II: a nightmare face splitting
#                         its cheek; III: the eyes open, violet
#   The Brine Cathedral - a hermit crab carrying a drowned chapel for a shell: steeple, rose window, bell, great claws;
#                         II: doors shut, barnacled; III: flooding, water from every window
#   The Wick-Mother     - a towering candle-woman of tallow, a wick-crown of flame, wax arms; she burns down: shorter
#                         and hotter each act, her flame bigger
#   The Orrery of Winter - brass rings round a frozen globe, a clock dial on its face; II: rings tilted; III: rimed white
#   The Penitent Colossus - a kneeling giant of stone mended with gold, a cowl, chained hands; II: gold seams glowing;
#                         III: it rises, cracks of light
#   Emily, the Yapper   - a round penguin in a knitted scarf, beak open; II: arms out mid-story; III: a tiny crown
#   The Fallen Star     - a burning star with a crater-eye, molten crust; II: brighter; III: swollen, white-hot
#   art/bundle/last/<boss>.png, last_shots.png, last_kin.png + atlas_last_bosses.json
#   py -I tools/build_last_bosses.py
import json, math, os, random, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
out = os.path.join(root, 'art', 'bundle', 'last')
os.makedirs(out, exist_ok=True)
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402
from pixcanvas import Cv  # noqa: E402

PAL = {
    'o': '#0a0810', 'x': '#7a7a86', 'X': '#4a4a56',
    'w': '#e8e4f0', 'W': '#ffffff', 'v': '#c8b0ff', 'V': '#8a5ad8', 'p': '#ff7ab8', 'P': '#2a0a30', 'n': '#3a2a58',     # the dream
    's': '#5a6a7a', 'S': '#8a9aaa', 'b': '#e8e4d8', 'a': '#2a7ac8', 'A': '#7ad0ff', 'c': '#c84a3a', 'C': '#ff7a5a',      # brine, crab
    'r': '#ffd690', 't': '#e8d8b0', 'T': '#c8b890', 'f': '#ff8a1f', 'F': '#ffd650', 'e': '#fff6c8', 'k': '#5a3a20',      # wax, flame
    'g': '#a8822e', 'G': '#f2d070', 'i': '#bfe8ff', 'I': '#e0f6ff', 'h': '#3a5a7a',                                     # brass, ice
    'm': '#6a6470', 'M': '#9a94a0', 'l': '#2a2430',                                                                      # stone
    'q': '#1a1a2a', 'Q': '#f4f0e8', 'y': '#ff9a2a', 'R': '#c8203a', 'u': '#3aa0c8',                                     # penguin
    'z': '#ff3a1a', 'Z': '#7a1a0a',                                                                                      # the star
}
N = 48


def sleeper(act=1, f=0, attack=False):
    c = Cv(); by = 0 if attack else f % 2; cx = 24
    for k in range(5): c.ell(8 + k * 8, 42, 7, 4, 'w' if k % 2 else 'v')           # its cloud
    c.ell(cx, 30 + by, 15, 11, 'w'); c.ell(cx - 3, 28 + by, 11, 8, 'W')             # the body, curled
    c.ell(cx + 2, 16 + by, 9, 8, 'w'); c.ell(cx, 15 + by, 6, 5, 'W')                 # the head
    c.trap(cx + 8, 4 + by, 12 + by, 2, 10, 'V'); c.ell(cx + 13, 5 + by, 2, 2, 'W')   # a nightcap
    if act < 3: c.line(cx - 2, 16 + by, cx + 1, 16 + by, 'n'); c.line(cx + 4, 16 + by, cx + 7, 16 + by, 'n')   # eyes shut
    else: c.ell(cx - 1, 16 + by, 1.8, 1.4, 'V'); c.ell(cx + 6, 16 + by, 1.8, 1.4, 'V'); c.p(cx - 1, 16 + by, 'W'); c.p(cx + 6, 16 + by, 'W')
    if act >= 2:                                                                     # the nightmare splitting its cheek
        c.ell(cx + 7, 20 + by, 3.5, 2.2, 'P'); c.line(cx + 4, 20 + by, cx + 10, 20 + by, 'p'); c.p(cx + 5, 21 + by, 'W'); c.p(cx + 8, 21 + by, 'W')
    for k in range(3): c.p(cx + 12 + k * 3, 10 - k * 3 + by, 'v'); c.p(cx + 13 + k * 3, 10 - k * 3 + by, 'v')   # Zs
    if attack:
        for k in range(10): a = k / 10 * math.tau; c.p(cx + math.cos(a) * 20, 28 + math.sin(a) * 16, 'p' if k % 2 else 'v')
    return c.outline().rows()


def cathedral(act=1, f=0, attack=False):
    c = Cv(); by = 0 if attack else f % 2; cx = 24
    for s in (-1, 1):                                                                # legs
        for k in range(3): c.line(cx + s * 8, 40, cx + s * (13 + k * 2), 46, 'c', 2)
    c.rect(cx - 12, 18 + by, cx + 12, 40 + by, 's'); c.rect(cx - 11, 19 + by, cx + 11, 39 + by, 'S')   # the chapel shell
    c.trap(cx, 4 + by, 18 + by, 1, 14, 's'); c.trap(cx, 6 + by, 18 + by, 1, 9, 'S')                   # the steeple
    c.line(cx, 0 + by, cx, 4 + by, 'G'); c.line(cx - 2, 2 + by, cx + 2, 2 + by, 'G')                  # its cross
    c.ell(cx, 12 + by, 2.2, 2.4, 'g'); c.p(cx, 13 + by, 'k')                                          # the bell
    c.ell(cx, 25 + by, 5, 5, 'a'); c.ell(cx, 25 + by, 3, 3, 'A'); c.line(cx - 5, 25 + by, cx + 5, 25 + by, 'h'); c.line(cx, 20 + by, cx, 30 + by, 'h')   # rose window
    doors = 'X' if act >= 2 else 'k'
    c.rect(cx - 3, 32 + by, cx + 3, 40 + by, doors); c.line(cx, 32 + by, cx, 40 + by, 'o')
    for k in range(6 + act * 3): c.p(cx + random.Random(k).uniform(-11, 11), 19 + random.Random(k + 9).uniform(0, 20) + by, 'b')
    # the claws
    for s in (-1, 1):
        x = cx + s * (15 if not attack else 19); y = 30 if not attack else 18
        c.line(cx + s * 11, 32 + by, x, y + by, 'c', 3); c.ell(x, y - 2 + by, 4, 3, 'c'); c.ell(x + s, y - 3 + by, 2.5, 1.6, 'C'); c.line(x - 3, y - 4 + by, x + 3, y - 6 + by, 'o')
    if act == 3:
        for x in (cx - 8, cx + 8, cx): c.line(x, 26 + by, x + 1, 46, 'A'); c.p(x, 27 + by, 'a')
    return c.outline().rows()


def wick(act=1, f=0, attack=False):
    c = Cv(); by = 0 if attack else f % 2; cx = 24
    top = {1: 14, 2: 20, 3: 26}[act]                                                 # she burns down, act by act
    c.trap(cx, top + by, 46, 12, 20, 't'); c.trap(cx - 2, top + 1 + by, 46, 5, 8, 'r')
    for k in range(5): x = cx - 9 + k * 4.5; c.line(x, top + 2 + by, x + (k % 2), top + 8 + k % 3 + by, 'T')   # drips of wax
    c.ell(cx, top + 4 + by, 5, 4, 't'); c.ell(cx - 1, top + 3 + by, 3, 2, 'e')       # her face in the wax
    c.p(cx - 2, top + 4 + by, 'o'); c.p(cx + 1, top + 4 + by, 'o'); c.line(cx - 1, top + 6 + by, cx + 1, top + 6 + by, 'k')
    for s in (-1, 1): c.line(cx + s * 7, top + 9 + by, cx + s * (14 if not attack else 16), top + (14 if not attack else 2) + by, 't', 3)   # wax arms
    fl = 6 + act * 2 + (3 if attack else 0)                                          # the flame, bigger as she burns
    c.line(cx, top - 1 + by, cx, top - 3 + by, 'k')
    c.ell(cx, top - 4 - fl / 2 + by, fl / 2.5, fl / 1.6, 'f'); c.ell(cx, top - 3 - fl / 3 + by, fl / 4, fl / 2.4, 'F'); c.ell(cx, top - 3 - fl / 5 + by, fl / 7, fl / 4, 'e')
    return c.outline().rows()


def orrery(act=1, f=0, attack=False):
    c = Cv(); by = 0 if attack else f % 2; cx = 24
    c.rect(cx - 2, 36, cx + 2, 44, 'g'); c.rect(cx - 9, 44, cx + 9, 46, 'g'); c.rect(cx - 8, 44, cx + 8, 44, 'G')   # its stand
    tilt = 0.25 if act >= 2 else 0
    for k, (rx, ry) in enumerate(((18, 6), (14, 9))):
        for j in range(60):
            a = j / 60 * math.tau; x = cx + math.cos(a) * rx; y = 22 + math.sin(a) * ry + math.cos(a) * rx * tilt * (1 if k else -1) + by
            c.p(x, y, 'G' if j % 3 else 'g')
    c.ell(cx, 22 + by, 9, 9, 'h'); c.ell(cx - 2, 20 + by, 6, 6, 'i'); c.ell(cx - 3, 19 + by, 3, 3, 'I')            # the frozen globe
    for k in range(12): a = k / 12 * math.tau; c.p(cx + math.cos(a) * 7, 22 + by + math.sin(a) * 7, 'g')         # a clock dial on it
    ha = (f * 0.5 + (1.2 if attack else 0)); c.line(cx, 22 + by, cx + math.cos(ha - math.pi / 2) * 6, 22 + by + math.sin(ha - math.pi / 2) * 6, 'k')
    for k, a in enumerate((0.6, 2.4, 4.2)):                                                                     # its little moons
        r = 18; c.ell(cx + math.cos(a + f * 0.3) * r, 22 + by + math.sin(a + f * 0.3) * 6, 1.8, 1.8, 'I' if k % 2 else 'i')
    if act == 3:
        for k in range(16): c.p(random.Random(k).uniform(cx - 18, cx + 18), random.Random(k + 3).uniform(10, 34) + by, 'W')
    return c.outline().rows()


def colossus(act=1, f=0, attack=False):
    c = Cv(); by = 0 if attack else f % 2; cx = 24
    rise = -4 if act == 3 else 0
    c.ell(cx, 40, 16, 6, 'm'); c.ell(cx, 39, 14, 4, 'M')                             # knees, kneeling
    c.trap(cx, 14 + by + rise, 38, 14, 26, 'm'); c.trap(cx - 2, 15 + by + rise, 38, 6, 12, 'M')   # the body
    c.ell(cx, 11 + by + rise, 6, 6, 'l'); c.trap(cx, 4 + by + rise, 12 + by + rise, 4, 14, 'm')     # the cowl
    c.ell(cx, 12 + by + rise, 3, 2.5, 'o'); c.p(cx - 1, 12 + by + rise, 'G' if act >= 2 else 'x'); c.p(cx + 1, 12 + by + rise, 'G' if act >= 2 else 'x')
    hy = (6 if attack else 26) + rise                                                # chained hands: clasped, or raised to strike
    for s in (-1, 1): c.line(cx + s * 9, 18 + by + rise, cx + s * 4, hy + by, 'm', 4)
    c.ell(cx, hy + 1 + by, 5, 4, 'M'); c.line(cx - 6, hy + 4 + by, cx + 6, hy + 4 + by, 'X')
    seam = 'G' if act >= 2 else 'g'
    for (x0, y0, x1, y1) in ((cx - 10, 18, cx - 3, 30), (cx + 2, 16, cx + 9, 26), (cx - 6, 32, cx + 5, 37)):
        c.line(x0, y0 + by + rise, (x0 + x1) / 2 + 1, (y0 + y1) / 2 + by + rise, seam); c.line((x0 + x1) / 2 + 1, (y0 + y1) / 2 + by + rise, x1, y1 + by + rise, seam)
    if act == 3:
        for k in range(8): a = k / 8 * math.tau; c.line(cx + math.cos(a) * 18, 24 + math.sin(a) * 16, cx + math.cos(a) * 21, 24 + math.sin(a) * 19, 'e')
    return c.outline().rows()


def emily(act=1, f=0, attack=False):
    c = Cv(); by = 0 if attack else f % 2; cx = 24
    c.ell(cx, 30 + by, 14, 15, 'q'); c.ell(cx + 1, 32 + by, 10, 12, 'Q')             # very round
    for s in (-1, 1):                                                                # flippers (out, mid-story)
        out = act >= 2 or attack
        c.line(cx + s * 13, 26 + by, cx + s * (19 if out else 14), (22 if out else 38) + by, 'q', 3)
    c.ell(cx - 5, 44, 4, 1.6, 'y'); c.ell(cx + 6, 44, 4, 1.6, 'y')                    # feet
    c.ell(cx - 4, 22 + by, 2.2, 2.4, 'W'); c.ell(cx + 5, 22 + by, 2.2, 2.4, 'W'); c.p(cx - 4, 22 + by, 'o'); c.p(cx + 5, 22 + by, 'o')
    if attack or act >= 2:                                                           # beak open: talking
        c.trap(cx + 1, 25 + by, 29 + by, 6, 3, 'y'); c.rect(cx - 1, 27 + by, cx + 3, 27 + by, 'R')
    else: c.trap(cx + 1, 25 + by, 28 + by, 5, 2, 'y')
    c.rect(cx - 11, 31 + by, cx + 11, 34 + by, 'u'); c.line(cx + 6, 34 + by, cx + 8, 42 + by, 'u', 3)   # her scarf
    for x in range(cx - 10, cx + 11, 3): c.p(x, 32 + by, 'Q')
    if act == 3: c.rect(cx - 4, 13 + by, cx + 4, 15 + by, 'G'); [c.p(cx - 4 + k * 2, 12 + by, 'G') for k in range(5)]   # a tiny crown
    return c.outline().rows()


def star(act=1, f=0, attack=False):
    c = Cv(); by = 0 if attack else f % 2; cx, cy = 24, 24
    R0 = {1: 13, 2: 14, 3: 16}[act] + (1 if attack else 0)
    for k in range(16):                                                              # flares
        a = k / 16 * math.tau + f * 0.2; L = R0 + 4 + (k % 3) * 2
        c.line(cx + math.cos(a) * R0, cy + math.sin(a) * R0 + by, cx + math.cos(a) * L, cy + math.sin(a) * L + by, 'F' if k % 2 else 'f')
    hot = act == 3
    c.ell(cx, cy + by, R0, R0, 'f' if not hot else 'e'); c.ell(cx - 2, cy - 2 + by, R0 - 3, R0 - 3, 'F' if not hot else 'W')
    for k in range(6):                                                               # its molten crust
        a = k * 1.1; c.ell(cx + math.cos(a) * R0 * 0.6, cy + math.sin(a) * R0 * 0.6 + by, 2.5, 1.8, 'Z' if not hot else 'f')
    c.ell(cx + 2, cy + 1 + by, 4.5, 3.5, 'Z'); c.ell(cx + 2, cy + 1 + by, 2.5, 2, 'z'); c.p(cx + 2, cy + 1 + by, 'e')   # the crater-eye
    return c.outline().rows()


def fall(fn, k):
    rnd = random.Random(40 + k); g = [list(r) for r in fn(3, 0)]
    for y in range(N):
        for x in range(N):
            if g[y][x] not in ('.', 'o') and rnd.random() < 0.3 + 0.3 * k: g[y][x] = 'x' if (x + y) % 2 else 'X'
    if k == 2:
        sh = [['.'] * N for _ in range(N)]
        for y in range(N):
            for x in range(N):
                if y + 12 < N and g[y][x] != '.' and rnd.random() < 0.7: sh[y + 12][x] = g[y][x]
        return [''.join(r) for r in sh]
    return [''.join(r) for r in g]


def alarm(ring=0):                                    # a dream-alarm clock, bells on top (the Sleeper's finale)
    c = Cv(24); t = (0, -1, 1)[ring]
    c.ell(12, 13, 8, 8, 'G'); c.ell(12, 13, 6.5, 6.5, 'w'); c.line(12, 13, 12, 8, 'o'); c.line(12, 13, 15, 13, 'o')
    for s in (-1, 1): c.ell(12 + s * 6 + t, 4, 3, 2.4, 'g'); c.p(12 + s * 6 + t, 3, 'G')
    c.line(7, 20, 5, 23, 'g'); c.line(17, 20, 19, 23, 'g')
    if ring: [c.p(12 + math.cos(a) * 11, 13 + math.sin(a) * 11, 'G') for a in (0.3, 0.9, 2.2, 2.8)]
    return c.outline().rows()


def mine(f=0):                                        # a star-mine (the Fallen Star's constellations)
    c = Cv(24)
    for k in range(4): a = k / 4 * math.tau + f * 0.4; c.line(12, 12, 12 + math.cos(a) * 8, 12 + math.sin(a) * 8, 'F')
    c.ell(12, 12, 4, 4, 'f'); c.ell(11, 11, 2, 2, 'e')
    return c.outline().rows()


def chick(f=0):                                       # one of Emily's chicks
    c = Cv(24); by = f % 2
    c.ell(12, 14 + by, 6, 6.5, 'x'); c.ell(12, 15 + by, 4, 4.5, 'M'); c.p(10, 12 + by, 'o'); c.p(14, 12 + by, 'o'); c.rect(11, 14 + by, 13, 15 + by, 'y')
    c.ell(9, 21, 2, 1, 'y'); c.ell(15, 21, 2, 1, 'y')
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
BOSSES = (('the_sleeper', sleeper, {1: 'It Dreams of You', 2: 'The Dream Turns', 3: 'The Nightmare Wakes'}),
          ('brine_cathedral', cathedral, {1: 'The Bells Toll', 2: 'The Doors Close', 3: 'The Cathedral Floods'}),
          ('wick_mother', wick, {1: 'The Wick Is Lit', 2: 'The Wick Catches', 3: 'Burned to the Bone'}),
          ('orrery_of_winter', orrery, {1: 'The Hour Turns', 2: 'The Rings Realign', 3: 'Absolute Winter'}),
          ('penitent_colossus', colossus, {1: 'It Kneels', 2: 'It Remembers Its Crimes', 3: 'Penance'}),
          ('emily_the_yapper', emily, {1: 'Okay So Anyway', 2: 'Emily Has a LOT to Say', 3: 'She Will Not Be Interrupted'}),
          ('the_fallen_star', star, {1: 'It Falls', 2: 'It Burns Brighter', 3: 'Supernova'}))
previews = []
for bid, fn, names in BOSSES:
    frames = []
    for act in (1, 2, 3):
        frames += [(f'i{act}_0', fn(act, 0)), (f'i{act}_1', fn(act, 1)), (f'a{act}', fn(act, 0, True))]
    frames += [(f'd{k}', fall(fn, k)) for k in range(3)]
    sp = pack(bid, N, 6, frames); fr = {k: v['frames']['0'] for k, v in sp.items()}
    anims = {}
    for act in (1, 2, 3):
        anims[f'idle{act}'] = {'frames': [f'i{act}_0', f'i{act}_1'], 'fps': 3, 'loop': True}
        anims[f'attack{act}'] = {'frames': [f'a{act}'] * 3, 'fps': 6, 'loop': False}
    anims['death'] = {'frames': ['d0', 'd1', 'd2'], 'fps': 3, 'loop': False}
    sheets[f'bx_{bid}'] = {'image': f'{bid}.png', 'kind': 'boss', 'sprites': {bid: {'frames': fr, 'anims': anims, 'phases': {str(a): {'name': names[a], 'idle': f'idle{a}', 'attack': f'attack{a}'} for a in (1, 2, 3)}, 'death': 'death', 'meta': {}}}}
    previews += [g for k, g in frames if k in ('i1_0', 'i2_0', 'i3_0')]
kin = [('alarm0', alarm(0)), ('alarm1', alarm(1)), ('mine0', mine(0)), ('mine1', mine(1)), ('chick0', chick(0)), ('chick1', chick(1))]
ksp = pack('last_kin', 24, 6, kin); kfr = {k: v['frames']['0'] for k, v in ksp.items()}
def kind(a, b): return {'frames': {a: kfr[a], b: kfr[b]}, 'anims': {'move': {'frames': [a, b], 'fps': 3, 'loop': True}, 'attack': {'frames': [b], 'fps': 3, 'loop': False}}, 'meta': {}}
sheets['last_kin'] = {'image': 'last_kin.png', 'kind': 'enemy', 'sprites': {'alarm': kind('alarm0', 'alarm1'), 'mine': kind('mine0', 'mine1'), 'chick': kind('chick0', 'chick1')}}
SHOTS = {
    'the_sleeper.z': ['........', '.vvvvv..', '....v...', '...v....', '..v.....', '.vvvvv..', '........', '........'],
    'the_sleeper.sheep': ['........', '.wwww...', 'wWWWWw..', 'wWWWWwo.', '.wwww...', '.o..o...', '........', '........'],
    'the_sleeper.moon': ['...vv...', '..v.....', '.v......', '.v......', '..v.....', '...vv...', '........', '........'],
    'the_sleeper.star': ['........', '...p....', '..pWp...', '.pWWWp..', '..pWp...', '...p....', '........', '........'],
    'brine_cathedral.bubble': ['........', '..AAA...', '.A..AA..', '.A...A..', '.A...A..', '..AAA...', '........', '........'],
    'brine_cathedral.toll': ['........', '..GGG...', '.G...G..', 'G.....G.', '.G...G..', '..GGG...', '........', '........'],
    'brine_cathedral.claw': ['........', '.cc.....', 'cCCc....', '.ccCc...', '...cCc..', '....cc..', '........', '........'],
    'wick_mother.flame': ['...F....', '..FfF...', '.FfefF..', '.FfefF..', '..fff...', '........', '........', '........'],
    'wick_mother.wax': ['........', '..ttt...', '.tTTTt..', '.tTrTt..', '..ttt...', '........', '........', '........'],
    'orrery_of_winter.flake': ['...I....', '.I.i.I..', '..iIi...', 'IiIWIiI.', '..iIi...', '.I.i.I..', '...I....', '........'],
    'orrery_of_winter.moon': ['........', '..iii...', '.iIIIi..', '.iIWIi..', '.iIIIi..', '..iii...', '........', '........'],
    'penitent_colossus.shard': ['........', '....G...', '...GW...', '..GWG...', '.GWG....', '.GG.....', '........', '........'],
    'penitent_colossus.lash': ['........', 'GG......', '.GGG....', '...GGG..', '.....GG.', '........', '........', '........'],
    'emily_the_yapper.yap': ['........', '.WWWWW..', 'W.o.o.W.', 'W.....W.', '.WWWWW..', '.W......', '........', '........'],
    'emily_the_yapper.snowball': ['........', '..WWW...', '.WWIWW..', '.WIWWW..', '..WWW...', '........', '........', '........'],
    'emily_the_yapper.fish': ['........', '........', '.uuu..u.', 'uAAAuuu.', '.uuu..u.', '........', '........', '........'],
    'the_fallen_star.ember': ['........', '...F....', '..FfF...', '.FfzfF..', '..FfF...', '...F....', '........', '........'],
    'the_fallen_star.flare': ['........', '...e....', '..eFe...', '.eFWFe..', '..eFe...', '...e....', '........', '........'],
}
shot_sp = pack('last_shots', 8, 8, list(SHOTS.items()))
sheets['last_shots'] = {'image': 'last_shots.png', 'kind': 'shot', 'sprites': shot_sp}
json.dump({'rf': True, 'meta': {'name': 'The last seven older bosses on the three-phase engine', 'version': 1}, 'sheets': sheets}, open(os.path.join(out, 'atlas_last_bosses.json'), 'w', encoding='utf8', newline='\n'), indent=1)
ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
if 'last/atlas_last_bosses.json' not in idx['atlases']:
    idx['atlases'].append('last/atlas_last_bosses.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
K = 2; P = []
for y in range(N * K):
    row = []
    for x in range(N * K * len(previews)):
        ch = previews[x // (N * K)][y // K][(x // K) % N]
        h = PAL.get(ch); row.append((int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), 255) if h else (42, 40, 51, 255))
    P.append(row)
write_png(os.path.join(root, 'art', '_proto', 'last_bosses_preview.png'), P)
print('the last seven bosses\' art -> art/bundle/last')
