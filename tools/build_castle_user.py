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
    # (2026-11-02, the user: "When I say animate, I don't mean take chunks of an enemy sprite and make it rotate. I mean
    # genuine animations that are smooth and don't break the anatomy of the creature ... the animation cuts the hound's
    # leg in half"). Nothing here is ever cut along a line: each leg is found whole (a limb of its own below the body) and
    # swings from its hip, turned about it; a bat's wings turn about its shoulders; the body tilts as one (a lean from the
    # feet up), squashes and stretches by a single row of its middle (never its face), and moves as a whole; fire wavers
    # only in the flames. An attack is the whole creature: it gathers itself, draws back, lets fly and recoils, the light
    # of the shot laid over it
    H, W = len(base), len(base[0])
    ys = [y for y in range(H) if any(c[3] for c in base[y])]; top, bot = ys[0], ys[-1]; hh = bot - top + 1
    xs = [x for x in range(W) if any(base[y][x][3] for y in range(H))]; cx = (xs[0] + xs[-1]) / 2; ww = xs[-1] - xs[0] + 1
    GOLD_, HOT_, WHITE_ = (255, 214, 96, 255), (255, 140, 40, 255), (255, 252, 230, 255)
    def blank(): return [[BLANK] * W for _ in range(H)]
    def shift(g, dx, dy):
        o = blank()
        for y in range(H):
            for x in range(W):
                c = g[y][x]
                if c[3] and 0 <= x + dx < W and 0 <= y + dy < H: o[y + dy][x + dx] = c
        return o
    def lean(g, d):                                         # the whole body tilted d pixels at the head, its feet where they stand
        if not d: return g
        o = blank()
        for y in range(H):
            s = round(d * (bot - y) / max(1, hh - 1))
            for x in range(W):
                c = g[y][x]
                if c[3] and 0 <= x + s < W: o[y][x + s] = c
        return o
    mid0, mid1 = top + int(hh * 0.45), top + int(hh * 0.7)   # (the torso: where a row may be added or taken, never the head)
    def quiet_row(g):                                       # the row of the torso most like the one above it: the least is lost or doubled
        best, by = 1e9, mid0
        for y in range(mid0, mid1):
            d = sum(abs(g[y][x][0] - g[y - 1][x][0]) + abs(g[y][x][3] - g[y - 1][x][3]) for x in range(W))
            if d < best: best, by = d, y
        return by
    QR = quiet_row(base)
    def squash(g, n):                                       # n > 0: a row of the torso taken (it sinks a pixel); n < 0: one doubled (it rises)
        if not n: return g
        rows = [row[:] for row in g]
        if n > 0: rows = [[BLANK] * W] + rows[:QR] + rows[QR + 1:]
        else: rows = rows[1:QR + 1] + [rows[QR][:]] + rows[QR + 1:]
        return rows
    def turned(g, pts, px, py, a):                          # a limb (its pixels) turned about its joint by a radians, nearest pixel
        if not a: return g
        o = [row[:] for row in g]; S = {(x, y): g[y][x] for x, y in pts}
        for x, y in pts: o[y][x] = BLANK
        x0 = min(p[0] for p in pts) - 4; x1 = max(p[0] for p in pts) + 4; y0 = min(p[1] for p in pts) - 4; y1 = max(p[1] for p in pts) + 4
        ca, sa = math.cos(-a), math.sin(-a)
        for y in range(max(0, y0), min(H, y1 + 1)):
            for x in range(max(0, x0), min(W, x1 + 1)):
                rx, ry = x - px, y - py; sx, sy = round(px + rx * ca - ry * sa), round(py + rx * sa + ry * ca)
                c = S.get((sx, sy))
                if c is not None: o[y][x] = c
        return o
    def limbs(g, frac):                                     # the legs: whole pieces of it reaching down below its body
        y0 = bot - max(2, int(hh * frac)); seen = set(); out = []
        for y in range(y0, bot + 1):
            for x in range(W):
                if g[y][x][3] and (x, y) not in seen:
                    comp = []; st = [(x, y)]; seen.add((x, y))
                    while st:
                        a, b = st.pop(); comp.append((a, b))
                        for X, Y in ((a + 1, b), (a - 1, b), (a, b + 1), (a, b - 1)):
                            if y0 <= Y <= bot and 0 <= X < W and (X, Y) not in seen and g[Y][X][3]: seen.add((X, Y)); st.append((X, Y))
                    if len(comp) >= 4 and max(p[1] for p in comp) >= bot - 1: out.append(comp)
        res = []
        for comp in out:                                    # each leg from its hip: the leg's own columns up to the thigh
            lx0, lx1 = min(p[0] for p in comp), max(p[0] for p in comp)
            hip = bot - max(3, int(hh * frac * 1.6))
            pts = [(x, y) for y in range(hip, bot + 1) for x in range(lx0, lx1 + 1) if g[y][x][3]]
            res.append((pts, (lx0 + lx1) / 2, hip, (lx0 + lx1) / 2))
        res.sort(key=lambda r: r[3])
        return res
    hot = [(x, y) for y in range(H) for x in range(W) if base[y][x][3] and lum(base[y][x]) > 175]
    wx, wy = (sum(p[0] for p in hot) / len(hot), sum(p[1] for p in hot) / len(hot)) if hot else (W * 0.7, H * 0.4)
    if id_ in WEAPON and hot:
        sd = 1 if WEAPON[id_] == 'right' else -1
        wx, wy = max(hot, key=lambda p: sd * p[0] + (H - p[1]) * (0.15 if sd > 0 else 0.5))
    if kind == 'beast' and hot: wx, wy = max((p for p in hot if p[0] > cx), key=lambda p: p[0], default=(wx, wy))   # (the hound's mouth)
    fwd = 1                                                 # (the art faces right; the renderer mirrors it)
    def ring(g, x0, y0, r, col, n=12, gaps=0):
        return dots(g, [(x0 + math.cos(a * 2 * math.pi / n) * r, y0 + math.sin(a * 2 * math.pi / n) * r * 0.8) for a in range(n) if not gaps or a % gaps], col)
    def flick(g, k):                                        # its own fire breathing: the bright warm pixels a touch brighter and back
        return lit(g, [0.0, 0.08, 0.16, 0.08, 0.0, 0.06, 0.12, 0.06][k % 8])
    N = 8; mv = []
    LEGS = limbs(base, 0.22 if kind == 'beast' else 0.16) if kind in ('beast', 'walker') else []
    for k in range(N):
        ph = k * 2 * math.pi / N; g = base
        if kind == 'beast':                                 # a gallop: the front pair and the hind pair swing opposite, from the hips; it rises between strides
            for i, (pts, px, py, _) in enumerate(LEGS):
                front = px > cx; a = math.radians(16) * math.sin(ph + (0 if front else math.pi) + (0.5 if i % 2 else 0))
                g = turned(g, pts, px, py, a)
            g = shift(g, 0, -1 if k in (2, 6) else 0)
            g = flick(g, k)
        elif kind == 'walker':                              # a march: each leg swings from its hip in turn, the body rising as it passes over, leaning into it
            for i, (pts, px, py, _) in enumerate(LEGS):
                a = math.radians(11) * math.sin(ph + (0 if i % 2 == 0 else math.pi))
                g = turned(g, pts, px, py, a)
            g = shift(g, 0, -1 if k in (2, 6) else 0)
            g = lean(g, 1 if k in (1, 2, 3, 5, 6, 7) else 0)
        elif kind == 'robe':                                # a glide: the hem flaring one way then the other from the waist, the body breathing
            hemY = top + int(hh * 0.62); a = round(math.sin(ph) * 2)
            if a:
                o = blank()
                for y in range(H):
                    s = round(a * max(0, y - hemY) / max(1, bot - hemY)) if y >= hemY else 0
                    for x in range(W):
                        c = g[y][x]
                        if c[3] and 0 <= x + s < W: o[y][x + s] = c
                g = o
            g = squash(g, -1 if k in (2, 3) else 0)
            g = flick(g, k)
        elif kind == 'wings':                               # a wing-beat: each wing turned about its shoulder, up high and sweeping down; the body lifts as they fall
            xL, xR = xs[0] + ww * 0.36, xs[0] + ww * 0.64; sy = top + hh * 0.3
            Lw = [(x, y) for y in range(H) for x in range(W) if base[y][x][3] and x < xL]; Rw = [(x, y) for y in range(H) for x in range(W) if base[y][x][3] and x > xR]
            body = [(x, y) for y in range(H) for x in range(W) if base[y][x][3] and xL <= x <= xR]
            a = math.radians(22) * math.sin(ph)
            o = blank(); o = turned(o, [], 0, 0, 0)
            wl = turned(base, Lw, xL, sy, a); wr = turned(base, Rw, xR, sy, -a)
            for y in range(H):
                for x in range(W):
                    if x < xL + 2 and wl[y][x][3]: o[y][x] = wl[y][x]
                    if x > xR - 2 and wr[y][x][3]: o[y][x] = wr[y][x]
            for x, y in body: o[y][x] = base[y][x]
            g = shift(o, 0, round(-math.sin(ph) * 1))
            g = flick(g, k)
        else:                                               # flame: its flames waver (the face still), lick up, and its embers wheel round
            face = top + int(hh * 0.45)
            o = blank()
            for y in range(H):
                s = round(math.sin(ph + y * 0.35) * (1.6 if y < top + hh * 0.22 else 1.0)) if y < face else 0
                for x in range(W):
                    c = g[y][x]
                    if c[3] and 0 <= x + s < W: o[y][x + s] = c
            g = shift(o, 0, round(math.sin(ph) * 1))
            g = flick(g, k)
            R0 = ww * 0.55
            g = dots(g, [(cx + math.cos(ph + j * 2.1) * R0, top + hh * 0.55 + math.sin(ph + j * 2.1) * R0 * 0.45) for j in range(3)], GOLD_ if k % 2 else HOT_)
        mv.append(g)
    # the attack: six beats, the whole of it moving
    sh = []
    if kind in ('flame', 'wings'):                          # it draws in, swells with light, bursts in a ring of embers, the sparks fall, it settles
        R1 = max(ww, hh) * 0.6; c0 = (cx, top + hh * 0.5)
        sh.append(lit(squash(base, 1), 0.2))
        sh.append(ring(lit(squash(base, 1), 0.45), c0[0], c0[1], R1 * 0.5, GOLD_, 8))
        sh.append(star(ring(lit(squash(base, -1), 0.7), c0[0], c0[1], R1 * 0.35, WHITE_, 6), round(c0[0]), round(c0[1]), 3))
        sh.append(ring(lit(shift(squash(base, -1), 0, -1), 0.3), c0[0], c0[1], R1, HOT_, 16))
        sh.append(ring(base, c0[0], c0[1], R1 * 1.2, GOLD_, 16, 2))
        sh.append(lit(base, 0.1))
    else:                                                   # it gathers (sinks, leans back), draws (further, light at its weapon), lets fly (thrown forward, a flash, a shock ring), recoils, settles
        lunge = 3 if kind == 'beast' else 1
        sh.append(lit(lean(squash(base, 1), -fwd), 0.15))
        sh.append(ring(lit(lean(squash(base, 1), -2 * fwd), 0.35), wx - 2 * fwd, wy, 3, GOLD_, 8, 2))
        sh.append(ring(lit(shift(lean(base, -2 * fwd), -fwd, 0), 0.6), wx - 3 * fwd, wy, 2, WHITE_, 8))
        rel = shift(lean(squash(base, -1), 2 * fwd), lunge * fwd, 0)
        fx_, fy_ = wx + (lunge + 3) * fwd, wy
        sh.append(dots(ring(star(lit(rel, 0.4), round(fx_), round(fy_), 4), fx_, fy_, 6, HOT_, 12, 2), [(fx_ + 6 + i, fy_) for i in range(4)], GOLD_))
        sh.append(dots(shift(lean(base, fwd), max(0, lunge - 1) * fwd, 0), [(wx + 5, wy + 3), (wx + 7, wy), (wx + 4, wy - 3), (wx + 8, wy + 4)], HOT_))
        sh.append(dots(base, [(wx + 6, wy + 5), (wx + 9, wy + 3)], (200, 80, 30, 255)))
    hurt = lean(shift(base, 0, 1), -2 * fwd)
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
        sprites[id_] = {'frames': frames_, 'anims': {'move': {'frames': [f'{id_}_m{k}' for k in range(8)], 'fps': 10, 'loop': True},
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
