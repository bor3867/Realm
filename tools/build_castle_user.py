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
    # (2026-11-02, the user: "The animations are a little lackluster. Please enhance"): six frames to a step and six to an
    # attack, each a pose: the body leans into its stride and bobs, legs lift two pixels, the weapon swings; an attack
    # crouches, raises its weapon, gathers a ring of light, lets fly with a flash, a shock ring and a streak, follows
    # through as the sparks fall, and settles
    H, W = len(base), len(base[0])
    ys = [y for y in range(H) if any(c[3] for c in base[y])]; top, bot = ys[0], ys[-1]; hh = bot - top + 1
    legY = bot - max(2, round(hh * (0.28 if kind == 'beast' else 0.22)))
    xs = [x for x in range(W) if any(base[y][x][3] for y in range(H))]; cx = (xs[0] + xs[-1]) / 2; ww = xs[-1] - xs[0] + 1
    UP = lambda x, y: y < legY
    def stretch(o, g, row):                                 # (a row the body left: filled from the frame before, so no gap opens)
        if 0 <= row < H:
            for x in range(W):
                if not o[row][x][3] and g[row][x][3]: o[row][x] = g[row][x]
        return o
    def bob(g, d=1):                                        # the body up (or down) d pixels over still feet
        o = g
        for _ in range(abs(d)): o = stretch(moved(o, UP, 0, -1 if d > 0 else 1), o, legY - 1 if d > 0 else legY)
        return o
    def lean(g, d):                                         # the upper body leaned d pixels, more at the head (a shear)
        if not d: return g
        o = g
        mid = top + (legY - top) // 2
        o = moved(o, lambda x, y: y < legY and y >= mid, d // 2 if abs(d) > 1 else 0, 0) if abs(d) > 1 else o
        return moved(o, lambda x, y: y < mid, d, 0)
    hot = [(x, y) for y in range(H) for x in range(W) if base[y][x][3] and lum(base[y][x]) > 175]
    wx, wy = (sum(p[0] for p in hot) / len(hot), sum(p[1] for p in hot) / len(hot)) if hot else (W * 0.7, H * 0.4)
    if id_ in WEAPON and hot:
        sd = 1 if WEAPON[id_] == 'right' else -1
        wx, wy = max(hot, key=lambda p: sd * p[0] + (H - p[1]) * (0.15 if sd > 0 else 0.5))
    fwd = 1 if (WEAPON.get(id_) != 'left') else 1           # (the art faces right: forward is +x; the renderer mirrors it)
    WR = 7 if kind in ('walker', 'robe') else 0
    WPN = lambda x, y: WR and (x - wx) ** 2 + (y - wy) ** 2 <= WR * WR
    def weapon(g, dx, dy): return moved(g, WPN, dx, dy) if WR and (dx or dy) else g
    GOLD_, HOT_, WHITE_ = (255, 214, 96, 255), (255, 140, 40, 255), (255, 252, 230, 255)
    def ring(g, x0, y0, r, col, n=12, gaps=0):
        return dots(g, [(x0 + math.cos(a * 2 * math.pi / n) * r, y0 + math.sin(a * 2 * math.pi / n) * r * 0.8) for a in range(n) if not gaps or a % gaps], col)
    def streak(g, x0, y0, n): return dots(g, [(x0 + fwd * i, y0) for i in range(1, n + 1)], WHITE_ if n < 3 else GOLD_)
    mv = []
    for k in range(6):
        ph = k * 2 * math.pi / 6; g = base
        if kind == 'beast':                                 # a gallop: legs in pairs, the body rolling, the tail flame flicking
            q = lambda x: int(4 * (x - xs[0]) / max(1, ww))
            front = lambda x: q(x) >= 2
            g = moved(g, lambda x, y: y >= legY and front(x), round(math.cos(ph) * 2), -1 if math.sin(ph) > 0.3 else 0)
            g = moved(g, lambda x, y: y >= legY and not front(x), round(-math.cos(ph) * 2), -1 if math.sin(ph) < -0.3 else 0)
            g = bob(g, 1 if k in (1, 4) else 0) if k in (1, 4) else g
            g = moved(g, lambda x, y: y < legY and front(x) and x > xs[0] + ww * 0.7, 0, -1 if k in (2, 5) else 0) if k in (2, 5) else g
            g = moved(g, lambda x, y: x < xs[0] + ww * 0.22 and y < top + hh * 0.5, 0, [-1, 0, 1, 0, -1, 0][k]) if k % 2 == 0 else g
        elif kind == 'walker':                              # a march: a leg up two, the other planted, a lean into the stride
            side = k < 3; lift = [1, 2, 1][k % 3]
            g = moved(g, lambda x, y: y >= legY and ((x < cx) == side), fwd if k % 3 == 1 else 0, -lift)
            g = bob(g, 1 if k % 3 == 1 else 0) if k % 3 == 1 else g
            g = lean(g, fwd if k % 3 != 2 else 0)
            g = weapon(g, 0, [1, 0, -1, -1, 0, 1][k])
        elif kind == 'robe':                                # a glide: the hem swaying in a wave, the body rising and falling, the staff with it
            g = moved(g, lambda x, y: y >= legY + (bot - legY) // 2, round(math.sin(ph) * 1.6), 0)
            g = moved(g, lambda x, y: y >= legY and y < legY + (bot - legY) // 2, round(math.sin(ph - 0.8)), 0)
            g = bob(g, 1) if k in (1, 2, 3) else g
            g = weapon(g, 0, round(math.sin(ph + 1) * 1.4))
        elif kind == 'wings':                               # a full wing-beat: up high, sweeping down, the body lifting as they fall
            d = [-3, -1, 1, 2, 1, -1][k]
            g = moved(g, lambda x, y: x < xs[0] + ww * 0.3 or x > xs[0] + ww * 0.7, 0, d)
            g = moved(g, lambda x, y: (xs[0] + ww * 0.3 <= x < xs[0] + ww * 0.4) or (xs[0] + ww * 0.6 < x <= xs[0] + ww * 0.7), 0, round(d / 2))
            g = moved(g, lambda x, y: True, 0, [1, 0, -1, -1, 0, 1][k])
        else:                                               # flames: they rise and lick, sway row by row, embers wheeling round
            for yy in range(top, top + hh * 2 // 3):
                amp = 2 if yy < top + hh // 4 else 1
                s = round(math.sin(ph + yy * 0.45) * amp)
                if s: g = moved(g, lambda x, y, yy=yy: y == yy, s, 0)
            if k % 2 == 0: g = stretch(moved(g, lambda x, y: y < top + hh // 3, 0, -1), g, top + hh // 3 - 1)
            g = lit(g, [0.0, 0.15, 0.3, 0.15, 0.0, 0.1][k])
            g = moved(g, lambda x, y: True, 0, [0, -1, -1, 0, 1, 1][k] if hh > 30 else [0, -1, 0, 1, 0, 0][k])
            R0 = ww * 0.55
            g = dots(g, [(cx + math.cos(ph + j * 2.1) * R0, top + hh * 0.55 + math.sin(ph + j * 2.1) * R0 * 0.45) for j in range(3)], GOLD_ if k % 2 else HOT_)
        mv.append(g)
    # the attack, six beats
    sh = []
    if kind == 'beast':                                     # crouch, coil, lunge with the jaws alight, the bite, a shake, back
        mx = max((p for p in hot if p[0] > cx), key=lambda p: p[0], default=(xs[-1] - 3, top + hh * 0.4)); mx, my = mx
        sh.append(lit(bob(base, -1), 0.2))
        sh.append(ring(lit(moved(bob(base, -1), lambda x, y: True, -1, 0), 0.4), mx - 1, my, 2, GOLD_, 8))
        sh.append(star(lit(moved(base, lambda x, y: True, 3, -1), 0.5), round(mx + 4), round(my), 3))
        sh.append(ring(moved(base, lambda x, y: True, 2, 0), mx + 3, my, 4, HOT_, 10, 3))
        sh.append(moved(base, lambda x, y: True, 1, 0))
        sh.append(base)
    elif kind in ('flame', 'wings'):                       # it draws in, swells with light, bursts in a ring of embers, the sparks fall, it settles
        R1 = max(ww, hh) * 0.6
        sh.append(lit(moved(base, lambda x, y: True, 0, 1), 0.2))
        sh.append(ring(lit(base, 0.45), cx, top + hh * 0.5, R1 * 0.5, GOLD_, 8))
        sh.append(star(ring(lit(moved(base, lambda x, y: True, 0, -1), 0.7), cx, top + hh * 0.5, R1 * 0.35, WHITE_, 6), round(cx), round(top + hh * 0.5), 3))
        sh.append(ring(lit(moved(base, lambda x, y: True, 0, -1), 0.3), cx, top + hh * 0.5, R1, HOT_, 16))
        sh.append(ring(base, cx, top + hh * 0.5, R1 * 1.2, GOLD_, 16, 2))
        sh.append(lit(base, 0.1))
    else:                                                   # crouch, raise, charge (light gathering), release (flash, shock ring, streak), follow through, settle
        b0 = bob(base, -1)
        sh.append(weapon(lean(b0, -fwd), -fwd, 0))
        sh.append(ring(lit(weapon(lean(base, -fwd), -fwd, -2), 0.3), wx - fwd, wy - 2, 3, GOLD_, 8, 2))
        sh.append(ring(lit(weapon(lean(base, -2 * fwd), -2 * fwd, -2), 0.6), wx - 2 * fwd, wy - 2, 2, WHITE_, 8))
        rel = weapon(lean(base, 2 * fwd), 2 * fwd, 1)
        sh.append(streak(ring(star(lit(rel, 0.4), round(wx + 3 * fwd), round(wy + 1), 4), wx + 3 * fwd, wy + 1, 6, HOT_, 12, 2), wx + 7 * fwd, round(wy + 1), 5))
        sh.append(dots(weapon(lean(base, fwd), fwd, 1), [(wx + 5 * fwd, wy + 3), (wx + 7 * fwd, wy), (wx + 4 * fwd, wy - 3), (wx + 8 * fwd, wy + 4)], HOT_))
        sh.append(dots(base, [(wx + 6 * fwd, wy + 5), (wx + 9 * fwd, wy + 3)], (200, 80, 30, 255)))
    hurt = lean(moved(base, lambda x, y: True, 0, 1), -fwd)
    return mv, sh, hurt


if __name__ == '__main__':
    blocks = []; y0 = 0; sheetW = 0
    for id_, (th, kind) in KIN.items():
        nat = os.path.join(src, 'native', id_ + '.png')
        if os.path.exists(nat) and os.path.getmtime(nat) >= os.path.getmtime(os.path.join(src, id_ + '.png')): base = read_png(nat)
        else:
            base = outline(shrink(cut(read_png(os.path.join(src, id_ + '.png'))), th)); os.makedirs(os.path.dirname(nat), exist_ok=True); write_png(nat, base)
        H, W = len(base), len(base[0]); P = 6                # (room to move: the poses reach out, its flashes and rings past its edge)
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
        sprites[id_] = {'frames': frames_, 'anims': {'move': {'frames': [f'{id_}_m{k}' for k in range(6)], 'fps': 9, 'loop': True},
                                                    'shoot': {'frames': [f'{id_}_s{k}' for k in range(6)], 'fps': 12, 'loop': False},
                                                    'attack': {'frames': [f'{id_}_s3'], 'fps': 1, 'loop': False},
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
