# Sunthief's Castle's defenders from the user's own art (2026-11-02: "Here are the sprites for the enemies ... Please update
# the enemies in the castle with these sprites (you can remake them if you need but keep the designs as best as you can).
# Animate all of them with movement and attack animations."). Their pictures (art/source/castle2/<id>.png, from the webp
# the user sent: big upscaled pixel art, some on transparent ground, some on black) are cut out, brought down to their
# own pixel size (each block of the picture its most common colour), their outline redrawn one pixel wide in a deep
# charcoal-purple (the user's outline rules: never a thick black border), and animated a part at a time:
#   move   four frames: a step (legs in turn, the body bobbing), a bat's wings beating, an elemental's flames swaying
#   shoot  four frames: wind-up (drawn back, its weapon's light gathering), the draw (further, sparks), the release
#          (thrown forward, a flash at the weapon), the recovery. src/render.js plays the first two through the
#          telegraph and the last two as it fires
#   hurt   a flinch (no tint: the user's rule against hit flashes)
# Drawn at one art pixel to one of the game's (src/castle_kin.js: scale 0.5), so all their detail stays.
#   'castle_user/<id>'   art/bundle/throne/castle_user.png + atlas_castle_user.json      py -I tools/build_castle_user.py [preview.png]
import json, math, os, sys
from collections import Counter, deque
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402
from reduce import read_png  # noqa: E402
src = os.path.join(root, 'art', 'source', 'castle2'); out = os.path.join(root, 'art', 'bundle', 'throne')
BLANK = (0, 0, 0, 0); EDGE = (30, 20, 38, 255); INK = (26, 18, 32, 255)
lum = lambda c: c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11
# id: (height in art pixels, its kind of motion). The user's order: hound, archer, knight, wizard, large flame
# elemental, small flame elemental, mace warrior, evil priest, small flame bat
KIN = {'infernal_hound': (30, 'beast'), 'cinder_archer': (34, 'walker'), 'sunbound_knight': (40, 'walker'), 'solar_acolyte': (38, 'robe'),
       'cinder_elemental': (44, 'flame'), 'lava_slime': (18, 'flame'), 'lava_guard': (40, 'walker'), 'sun_cultist': (46, 'robe'), 'cinder_bat': (15, 'wings')}


def cut(px):
    # the picture's ground away: already clear, or black flooded in from the edges (its black outline goes with it; it is drawn again below)
    H, W = len(px), len(px[0]); px = [row[:] for row in px]
    if px[2][2][3] > 128:
        seen = [[False] * W for _ in range(H)]; q = deque()
        for x in range(W): q.append((x, 0)); q.append((x, H - 1))
        for y in range(H): q.append((0, y)); q.append((W - 1, y))
        while q:
            x, y = q.popleft()
            if x < 0 or y < 0 or x >= W or y >= H or seen[y][x]: continue
            seen[y][x] = True
            if lum(px[y][x]) > 26: continue
            px[y][x] = BLANK
            q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    return px


def shrink(px, th):
    H, W = len(px), len(px[0])
    ys = [y for y in range(0, H, 2) if any(px[y][x][3] > 128 for x in range(0, W, 2))]
    xs = [x for x in range(0, W, 2) if any(px[y][x][3] > 128 for y in range(0, H, 2))]
    y0, y1, x0, x1 = ys[0], ys[-1] + 2, xs[0], xs[-1] + 2
    b = (y1 - y0) / th; tw = max(1, round((x1 - x0) / b))
    g = [[BLANK] * tw for _ in range(th)]
    for j in range(th):
        for i in range(tw):
            cs = []; n = 0
            for yy in range(int(y0 + j * b + b * 0.2), int(y0 + (j + 1) * b - b * 0.2) + 1):
                for xx in range(int(x0 + i * b + b * 0.2), int(x0 + (i + 1) * b - b * 0.2) + 1):
                    if 0 <= yy < H and 0 <= xx < W:
                        n += 1; c = px[yy][xx]
                        if c[3] > 128: cs.append(c)
            if not n or len(cs) < n * 0.45: continue
            bins = Counter((c[0] // 24, c[1] // 24, c[2] // 24) for c in cs); k = bins.most_common(1)[0][0]
            sel = [c for c in cs if (c[0] // 24, c[1] // 24, c[2] // 24) == k]
            g[j][i] = (sum(c[0] for c in sel) // len(sel), sum(c[1] for c in sel) // len(sel), sum(c[2] for c in sel) // len(sel), 255)
    return g


def outline(g):
    # the outline: the outer near-black off, then one pixel of deep charcoal-purple all round; black inside it deep ink
    H, W = len(g), len(g[0])
    for _ in range(2):
        g2 = [row[:] for row in g]
        for y in range(H):
            for x in range(W):
                c = g[y][x]
                if c[3] and lum(c) < 30 and any(not (0 <= X < W and 0 <= Y < H) or not g[Y][X][3] for X, Y in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1))): g2[y][x] = BLANK
        g = g2
    P = 2; H2, W2 = H + 2 * P, W + 2 * P
    o = [[BLANK] * W2 for _ in range(H2)]
    for y in range(H):
        for x in range(W):
            c = g[y][x]
            if c[3]: o[y + P][x + P] = INK if lum(c) < 22 else c
    for y in range(H2):
        for x in range(W2):
            if not o[y][x][3] and any(0 <= X < W2 and 0 <= Y < H2 and o[Y][X][3] and o[Y][X] != EDGE for X, Y in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1))): o[y][x] = EDGE
    return o


def moved(g, mask, dx, dy):
    H, W = len(g), len(g[0]); o = [row[:] for row in g]
    pts = [(x, y, g[y][x]) for y in range(H) for x in range(W) if g[y][x][3] and mask(x, y)]
    for x, y, c in pts: o[y][x] = BLANK
    for x, y, c in pts:
        if 0 <= x + dx < W and 0 <= y + dy < H: o[y + dy][x + dx] = c
    return o


def lit(g, k):                                              # its own lights (the warm, bright pixels) brighter by k
    return [[((min(255, int(c[0] + (255 - c[0]) * k)), min(255, int(c[1] + (240 - c[1]) * k)), min(255, int(c[2] + (170 - c[2]) * k * 0.6)), 255) if c[3] and lum(c) > 150 and c[0] > c[2] else c) for c in row] for row in g]


def dots(g, pts, col):
    g = [row[:] for row in g]; H, W = len(g), len(g[0])
    for x, y in pts:
        x, y = int(round(x)), int(round(y))
        if 0 <= x < W and 0 <= y < H: g[y][x] = col
    return g


def star(g, cx, cy, r):
    pts = [(cx + d, cy) for d in range(-r, r + 1)] + [(cx, cy + d) for d in range(-r, r + 1)]
    g = dots(g, pts, (255, 214, 96, 255)); return dots(g, [(cx, cy)], (255, 252, 230, 255))


WEAPON = {'cinder_archer': 'right', 'lava_guard': 'right', 'sunbound_knight': 'left', 'solar_acolyte': 'left', 'sun_cultist': 'left'}   # (where each one's weapon is: its shot leaves from there)


def frames(base, kind, id_=''):
    H, W = len(base), len(base[0])
    ys = [y for y in range(H) if any(c[3] for c in base[y])]; top, bot = ys[0], ys[-1]; hh = bot - top + 1
    legY = bot - max(2, round(hh * (0.28 if kind == 'beast' else 0.22)))
    UP = lambda x, y: y < legY
    def bob(g):                                             # the body up a pixel, its waist stretched so no gap opens above the legs
        o = moved(g, UP, 0, -1)
        for x in range(W):
            if not o[legY - 1][x][3] and g[legY - 1][x][3]: o[legY - 1][x] = g[legY - 1][x]
        return o
    # the weapon's point: where its brightest light gathers
    hot = [(x, y) for y in range(H) for x in range(W) if base[y][x][3] and lum(base[y][x]) > 175]
    wx, wy = (sum(p[0] for p in hot) / len(hot), sum(p[1] for p in hot) / len(hot)) if hot else (W * 0.7, H * 0.4)
    if id_ in WEAPON and hot:                               # (the point at the weapon's end: its brightest pixel furthest that way)
        sd = 1 if WEAPON[id_] == 'right' else -1
        wx, wy = max(hot, key=lambda p: sd * p[0] + (H - p[1]) * (0.15 if sd > 0 else 0.5))
    xs = [x for x in range(W) if any(base[y][x][3] for y in range(H))]; cx = (xs[0] + xs[-1]) / 2
    mv = []
    for k in range(4):
        g = base
        if kind == 'beast':                                 # a trot: the legs in pairs, the body rising between
            q = lambda x: int(4 * (x - xs[0]) / max(1, xs[-1] - xs[0] + 1))
            g = moved(g, lambda x, y: y >= legY and q(x) % 2 == (k // 2) % 2 and k % 2 == 0, 1 if k == 0 else -1, -1)
            if k % 2: g = bob(g)
        elif kind == 'walker':                              # a step: one leg then the other, a bob
            if k == 0: g = moved(g, lambda x, y: y >= legY and x < cx, 0, -1)
            if k == 2: g = moved(g, lambda x, y: y >= legY and x >= cx, 0, -1)
            if k in (1, 3): g = bob(g)
        elif kind == 'robe':                                # a glide: the hem swaying, the body breathing
            g = moved(g, lambda x, y: y >= legY, [1, 0, -1, 0][k], 0)
            if k in (1, 2): g = bob(g)
        elif kind == 'wings':                               # wings beating: the outer thirds up, level, down, level
            d = [-2, 0, 1, 0][k]
            g = moved(g, lambda x, y: x < xs[0] + (xs[-1] - xs[0]) * 0.33 or x > xs[0] + (xs[-1] - xs[0]) * 0.67, 0, d)
            g = moved(g, lambda x, y: True, 0, [0, -1, 0, 1][k])
        else:                                               # flame: its upper rows sway, the whole of it bobbing
            for yy in range(top, top + hh // 2):
                s = round(math.sin(k * math.pi / 2 + yy * 0.5) * (1 if yy > top + hh // 4 else 1.5))
                if s: g = moved(g, lambda x, y, yy=yy: y == yy, s, 0)
            g = moved(g, lambda x, y: True, 0, [0, -1, -1, 0][k])
        mv.append(g)
    back = -1 if wx >= cx else 1                            # drawn back away from its weapon's side
    BODY = (lambda x, y: True) if kind in ('flame', 'wings') else UP
    sh = [
        lit(moved(base, BODY, back, 0), 0.25),
        dots(lit(moved(base, BODY, back * 2 if kind not in ('flame', 'wings') else 0, -1 if kind in ('flame', 'wings') else 0), 0.5), [(wx + math.cos(a) * 3, wy + math.sin(a) * 3) for a in (0, 1.6, 3.2, 4.8)], (255, 214, 96, 255)),
        star(lit(moved(base, BODY, -back * 2 if kind not in ('flame', 'wings') else 0, 1 if kind in ('flame', 'wings') else 0), 0.3), round(wx - back * 3), round(wy), 3),
        moved(base, BODY, -back, 0),
    ]
    hurt = moved(base, lambda x, y: True, 0, 1)
    return mv, sh, hurt


if __name__ == '__main__':
    blocks = []; y0 = 0; sheetW = 0
    for id_, (th, kind) in KIN.items():
        base = outline(shrink(cut(read_png(os.path.join(src, id_ + '.png'))), th))
        H, W = len(base), len(base[0]); P = 2                # (room to move: the frames shift a pixel or two)
        base = [[BLANK] * (W + 2 * P) for _ in range(P)] + [[BLANK] * P + row + [BLANK] * P for row in base] + [[BLANK] * (W + 2 * P) for _ in range(P)]
        mv, sh, hurt = frames(base, kind, id_)
        fr = [(f'{id_}_m{k}', g) for k, g in enumerate(mv)] + [(f'{id_}_s{k}', g) for k, g in enumerate(sh)] + [(f'{id_}_h', hurt)]
        h, w = len(base), len(base[0]); blocks.append((id_, fr, w, h, y0)); y0 += h; sheetW = max(sheetW, w * len(fr))
        print(id_, w, 'x', h)
    sheet = [[BLANK] * sheetW for _ in range(y0)]; sprites = {}
    for id_, fr, w, h, oy in blocks:
        frames_ = {}
        for n, (key, g) in enumerate(fr):
            for y in range(h):
                for x in range(w): sheet[oy + y][n * w + x] = g[y][x]
            frames_[key] = [n * w, oy, w, h]
        sprites[id_] = {'frames': frames_, 'anims': {'move': {'frames': [f'{id_}_m{k}' for k in range(4)], 'fps': 6, 'loop': True},
                                                    'shoot': {'frames': [f'{id_}_s{k}' for k in range(4)], 'fps': 10, 'loop': False},
                                                    'attack': {'frames': [f'{id_}_s2'], 'fps': 1, 'loop': False},
                                                    'hurt': {'frames': [f'{id_}_h'], 'fps': 1, 'loop': False}}, 'meta': {}}
    write_png(os.path.join(out, 'castle_user.png'), sheet)
    if len(sys.argv) > 1:
        S = 4; write_png(sys.argv[1], [[sheet[y // S][x // S] if sheet[y // S][x // S][3] else (70, 66, 80, 255) for x in range(sheetW * S)] for y in range(y0 * S)])
    json.dump({'rf': True, 'meta': {'name': "Sunthief's Castle's defenders, the user's art", 'version': 1}, 'sheets': {'castle_user': {'image': 'castle_user.png', 'kind': 'enemy', 'sprites': sprites}}},
              open(os.path.join(out, 'atlas_castle_user.json'), 'w', encoding='utf8', newline='\n'), indent=1)
    ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
    if 'throne/atlas_castle_user.json' not in idx['atlases']:
        idx['atlases'].append('throne/atlas_castle_user.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
    print('castle_user:', len(KIN), 'defenders')
