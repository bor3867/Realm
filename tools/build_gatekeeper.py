# Ashkar, the Gatekeeper: the guardian of Solkhar's gate, in the Guardian's hall of the volcano island
# (src/bosses/ashkar_gatekeeper.js). A hulking giant of black glass chained before the gate, a molten core in his chest,
# a horned helm with a burning slit, a slag-hammer. Two idle frames and a strike a phase, a three-frame death.
#   I   The Gate Holds      - armour whole, chains taut to either side
#   II  The Caldera Wakes   - the armour cracked, lava in every crack
#   III Unchained           - the chains broken, the glass shed, a body of magma
#   art/bundle/throne/ashkar_gatekeeper.png + atlas_gatekeeper.json          py -I tools/build_gatekeeper.py
import json, math, os, random, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
out = os.path.join(root, 'art', 'bundle', 'throne')
os.makedirs(out, exist_ok=True)
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402
from pixcanvas import Cv  # noqa: E402

PAL = {
    'o': '#0a0810', 'x': '#5a5466', 'X': '#3a3446',                       # (the outline; ash, for the death)
    'b': '#2c2638', 'B': '#4e4664', 's': '#8a7eaa',                       # black glass, its sheen
    'i': '#5a5a66', 'I': '#8a8a96', 'k': '#1a1418',                       # iron: the hammer, the chains
    'r': '#c84a1a', 'f': '#ff8a1f', 'F': '#ffd650', 'w': '#fff6c8',       # magma, from dull to white-hot
}
N = 48


def ashkar(act=1, f=0, attack=False):
    c = Cv(); by = 0 if attack else f % 2; cx = 24
    glass, sheen = ('r', 'f') if act == 3 else ('b', 'B')
    # the chains, from his wrists to the walls either side (broken in III: a few links hang)
    for s in (-1, 1):
        x1 = cx + s * 23 if act < 3 else cx + s * 15
        c.line(cx + s * 13, 27 + by, x1, 24 + by, 'i', 2)
        for k in range(3 if act == 3 else 5): c.p(cx + s * (14 + k * 2), 26 + by - (k % 2), 'I')
    c.ell(cx - 6, 43, 4, 3, glass); c.ell(cx + 6, 43, 4, 3, glass)                       # the feet
    c.rect(cx - 8, 34 + by, cx - 4, 42, glass); c.rect(cx + 4, 34 + by, cx + 8, 42, glass)   # the legs
    c.trap(cx, 16 + by, 36 + by, 22, 16, glass); c.trap(cx - 3, 17 + by, 34 + by, 8, 5, sheen)   # the body
    c.ell(cx - 11, 18 + by, 5, 4, sheen); c.ell(cx + 11, 18 + by, 5, 4, sheen)          # the pauldrons
    c.ell(cx, 25 + by, 4.5, 4.5, 'r'); c.ell(cx, 25 + by, 3, 3, 'f'); c.ell(cx, 25 + by, 1.5, 1.5, 'F' if act < 3 else 'w')   # the molten core
    if act >= 2:                                                                      # the cracks, lava in them
        for (x0, y0, x1, y1) in ((cx - 9, 20, cx - 4, 31), (cx + 7, 19, cx + 3, 29), (cx - 2, 31, cx + 4, 35), (cx - 12, 16, cx - 9, 21)):
            c.line(x0, y0 + by, x1, y1 + by, 'f' if act == 2 else 'F')
    hy = 10 + by                                                                      # the helm and its horns
    c.ell(cx, hy, 6, 6, glass); c.rect(cx - 4, hy - 1, cx + 4, hy + 1, 'k'); c.rect(cx - 3, hy, cx + 3, hy, 'F' if attack or act == 3 else 'f')
    for s in (-1, 1): c.line(cx + s * 5, hy - 3, cx + s * 9, hy - 9, sheen, 2); c.p(cx + s * 9, hy - 10, 'I')
    # the slag-hammer: at rest by his side, or raised over his head to strike
    if attack: c.line(cx + 12, 22, cx + 16, 2, 'i', 2); c.rect(cx + 11, 0, cx + 21, 6, 'i'); c.rect(cx + 12, 1, cx + 20, 5, 'f' if act >= 2 else 'I')
    else: c.line(cx + 13, 26 + by, cx + 17, 42, 'i', 2); c.rect(cx + 13, 38, cx + 22, 45, 'i'); c.rect(cx + 14, 39, cx + 21, 44, 'f' if act >= 2 else 'I')
    if act == 3:                                                                      # III: heat shimmering off him
        for k in range(6): a = k / 6 * math.tau + 0.3; c.p(cx + math.cos(a) * 19, 24 + math.sin(a) * 17, 'F')
    return c.outline().rows()


def fall(k):
    rnd = random.Random(70 + k); g = [list(r) for r in ashkar(3, 0)]
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


BID, NAMES = 'ashkar_gatekeeper', {1: 'The Gate Holds', 2: 'The Caldera Wakes', 3: 'Unchained'}
frames = []
for act in (1, 2, 3):
    frames += [(f'i{act}_0', ashkar(act, 0)), (f'i{act}_1', ashkar(act, 1)), (f'a{act}', ashkar(act, 0, True))]
frames += [(f'd{k}', fall(k)) for k in range(3)]
fr, px = pack(BID, N, 6, frames)
anims = {}
for act in (1, 2, 3):
    anims[f'idle{act}'] = {'frames': [f'i{act}_0', f'i{act}_1'], 'fps': 3, 'loop': True}
    anims[f'attack{act}'] = {'frames': [f'a{act}'] * 3, 'fps': 6, 'loop': False}
anims['death'] = {'frames': ['d0', 'd1', 'd2'], 'fps': 3, 'loop': False}
sheets = {f'bx_{BID}': {'image': f'{BID}.png', 'kind': 'boss', 'sprites': {BID: {'frames': fr, 'anims': anims,
          'phases': {str(a): {'name': NAMES[a], 'idle': f'idle{a}', 'attack': f'attack{a}'} for a in (1, 2, 3)}, 'death': 'death', 'meta': {}}}}}
json.dump({'rf': True, 'meta': {'name': 'Ashkar, the Gatekeeper (the Throne of Solkhar)', 'version': 1}, 'sheets': sheets},
          open(os.path.join(out, 'atlas_gatekeeper.json'), 'w', encoding='utf8', newline='\n'), indent=1)
ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
if 'throne/atlas_gatekeeper.json' not in idx['atlases']:
    idx['atlases'].append('throne/atlas_gatekeeper.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
S = 4; W = len(px[0]); P = [[(42, 40, 51, 255)] * (W * S) for _ in range(len(px) * S)]
for y in range(len(px)):
    for x in range(W):
        if px[y][x][3]:
            for dy in range(S): P[y * S + dy][x * S:(x + 1) * S] = [px[y][x]] * S
write_png(os.path.join(root, 'art', '_proto', 'ashkar_preview.png'), P)
print('Ashkar:', len(frames), 'frames')
