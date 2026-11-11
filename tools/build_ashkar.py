# Ashkar, the Chained Forge-Giant (src/bosses/ashkar_gatekeeper.js): the user's own sprite (2026-11-01,
# art/ashkar_chained_forge_giant.jpg, brought to native pixels at its own ~11 px grid by tools/import_boss_art.py: 109x107,
# too fine to halve without losing him, so the boss draws it at half scale, one of its pixels to one of the screen's).
# Animated, three looks to the user's spec ("Sunthief's Castle", 3):
#   I   The Bound Giant          - every chain on him; the lava in his armour and hammer flowing; the core pulsing
#   II  The Furnace Fractures    - his armour cracked open from the core, every chain broken off him (2026-11-02, the user:
#                                  "portions of the broken chains remain attached or continue moving strangely": none
#                                  stays on him once he is loose of his anchors; what fell lies on the floor, src/bosses), ash
#   III The Unchained            - every chain gone, the core blazing, the hammer white-hot, embers off him
# Four idle frames a look, the strike (the hammer raised, white-hot; the core flaring), a death (the hammer falls, the
# core implodes, he goes to ash).
#   'bx_ashkar_gatekeeper/ashkar_gatekeeper' (the same key as before: tools/build_gatekeeper.py drew the old one)
#   'ash_kin/vent': a forge vent of his hall (Furnace Teeth), an iron grate over the fire, 16x16
#   art/bundle/throne/ashkar_gatekeeper.png + atlas_gatekeeper.json          py -I tools/build_ashkar.py
import json, math, os, random, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
out = os.path.join(root, 'art', 'bundle', 'throne')
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402
from reduce import read_png  # noqa: E402

SRC = read_png(os.path.join(root, 'art', 'source', 'bosses', 'ashkar_chained_forge_giant.png'))
SH, SW = len(SRC), len(SRC[0])
BLANK = (0, 0, 0, 0)
lum = lambda c: c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11
sat = lambda c: (max(c[:3]) - min(c[:3])) / (max(c[:3]) or 1)
CORE = (60, 36)                                                     # his chest's molten heart
HAMMER = (0, 0, 31, 33)                                             # the hammer's head (x0, y0, x1, y1)
# the chains, by where they hang (x0, y0, x1, y1); II breaks the first two, III all of them
CHAINS = {'r_shoulder': (73, 29, 83, 50), 'l_dangle': (11, 59, 21, 81), 'l_shoulder': (41, 28, 51, 49), 'l_forearm': (27, 41, 37, 63),
          'r_wrist': (86, 54, 107, 61), 'r_dangle': (101, 58, 109, 92), 'belt_l': (45, 55, 53, 69), 'belt_r': (69, 55, 78, 69)}
# (2026-11-11, the user: "parts of the chains stay on the map and continue to follow him": the boxes were tight, and links
# were left on his right forearm, his left arm and his chest, moving with him once he was free. Each a little wider, and
# the loops round his right forearm their own)
CHAINS = {n: (x0 - 2, y0 - 2, x1 + 2, y1 + 2) for n, (x0, y0, x1, y1) in CHAINS.items()}
CHAINS.update({'r_forearm': (84, 42, 108, 64), 'l_arm': (9, 40, 21, 60)})
BROKEN = {1: (), 2: tuple(CHAINS), 3: tuple(CHAINS)}
BARE = {'l_dangle': (11, 59, 19, 82), 'r_dangle': (104, 58, 109, 92)}     # (where only the chain is: everything in it goes)


def kind(c):
    if not c[3]: return '.'
    r, g, b = c[:3]
    if r > 190 and sat(c) > 0.78 and g > 40: return 'lava'
    if r > 120 and 0.3 < sat(c) <= 0.78 and g > 70 and b < 130 and r > b + 50: return 'bronze'
    if lum(c) < 34: return 'ink'
    return 'body'


KIND = [[kind(SRC[y][x]) for x in range(SW)] for y in range(SH)]


def mix(c, t, k):
    k = max(0, min(1, k)); return (int(c[0] + (t[0] - c[0]) * k), int(c[1] + (t[1] - c[1]) * k), int(c[2] + (t[2] - c[2]) * k), 255)


def unchain(g, names):
    # take the chain's links (their bronze and the dark of their holes) away, and fill from what is round them: the body
    # behind, or nothing where the chain hung in the air
    gone = set()
    for n in names:
        x0, y0, x1, y1 = CHAINS[n]
        for y in range(y0, min(SH, y1 + 1)):
            for x in range(x0, min(SW, x1 + 1)):
                if KIND[y][x] in ('bronze', 'ink'): gone.add((x, y))
        if n in BARE:
            x0, y0, x1, y1 = BARE[n]
            for y in range(y0, min(SH, y1 + 1)):
                for x in range(x0, min(SW, x1 + 1)): g[y][x] = BLANK
    for (x, y) in gone: g[y][x] = None
    # fill from the body round it only (never from trim, ink or lava, which smear), a few rows on so it keeps the stone's grain
    src = lambda X, Y: 0 <= X < SW and 0 <= Y < SH and (X, Y) not in gone and KIND[Y][X] == 'body' and g[Y][X] is not None and g[Y][X][3]
    for _ in range(16):
        left = [(x, y) for (x, y) in gone if g[y][x] is None]
        if not left: break
        for (x, y) in left:
            got = None
            for X, Y in ((x - 3, y), (x + 3, y), (x, y - 3), (x, y + 3), (x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if src(X, Y): got = g[Y][X]; break
            if got: g[y][x] = got
            elif all(not (0 <= X < SW and 0 <= Y < SH) or (g[Y][X] is not None and not g[Y][X][3]) for X, Y in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1))): g[y][x] = BLANK
    for (x, y) in gone:
        if g[y][x] is None: g[y][x] = BLANK
    # what hung in the air off a chain and is left on its own: gone too
    seen = set()
    for y in range(SH):
        for x in range(SW):
            if (x, y) in seen or not g[y][x][3]: continue
            comp, q = [], [(x, y)]; seen.add((x, y))
            while q:
                X, Y = q.pop(); comp.append((X, Y))
                for U, V in ((X + 1, Y), (X - 1, Y), (X, Y + 1), (X, Y - 1)):
                    if 0 <= U < SW and 0 <= V < SH and (U, V) not in seen and g[V][U][3]: seen.add((U, V)); q.append((U, V))
            if len(comp) < 30:
                for X, Y in comp: g[Y][X] = BLANK


def ashkar(act=1, f=0, strike=False):
    g = [list(row) for row in SRC]
    put = lambda x, y, c: (0 <= x < SW and 0 <= y < SH) and g[y].__setitem__(x, c)
    unchain(g, BROKEN[act])
    # the lava flows: a band of light runs through every molten seam, turning each frame
    for y in range(SH):
        for x in range(SW):
            if KIND[y][x] != 'lava' or not g[y][x][3]: continue
            w = ((x + y * 2 - f * 3) % 8)
            if w < 2: g[y][x] = mix(g[y][x], (255, 244, 190), 0.55 + (0.2 if act == 3 else 0))
            elif w > 5: g[y][x] = mix(g[y][x], (150, 30, 10), 0.35 if act == 1 else 0.2)
    # the core: pulsing, wider each look, white when he strikes
    cx, cy = CORE
    rad = {1: 3.2, 2: 4.2, 3: 5.4}[act] + (0.8 if f in (1, 2) else 0) + (1.4 if strike else 0)
    for y in range(int(cy - rad - 1), int(cy + rad + 2)):
        for x in range(int(cx - rad - 1), int(cx + rad + 2)):
            d = math.hypot(x - cx, (y - cy) * 1.1)
            if 0 <= x < SW and 0 <= y < SH and d <= rad and g[y][x][3]: put(x, y, mix(g[y][x], (255, 250, 215), 1 - d / (rad + 0.6)))
    # II, III: the armour cracks open from the core
    if act >= 2:
        rnd = random.Random(11)
        for k in range(7 if act == 2 else 11):
            a = rnd.random() * math.tau; L = rnd.randint(5, 11 if act == 2 else 15); wob = rnd.uniform(-0.25, 0.25)
            for t in range(int(rad) + 1, int(rad) + L):
                x, y = int(cx + math.cos(a + wob * t / 6) * t), int(cy + math.sin(a + wob * t / 6) * t)
                if 0 <= x < SW and 0 <= y < SH and KIND[y][x] in ('body', 'ink') and g[y][x][3]:
                    put(x, y, (255, 150, 40, 255) if t > int(rad) + L * 0.6 else (255, 214, 90, 255))
    # the strike: the hammer raised two pixels and white-hot
    if strike:
        x0, y0, x1, y1 = HAMMER; lift = 2 if f else 1
        snap = [row[:] for row in g]
        for y in range(y0, y1):
            for x in range(x0, x1):
                if snap[y][x][3]: put(x, y - lift, mix(snap[y][x], (255, 240, 200), 0.35 if KIND[y][x] == 'lava' else 0.1))
                if y >= y1 - lift and snap[y][x][3]: put(x, y, snap[y + lift][x] if y + lift < SH and x >= 14 else BLANK)
    # ash (II) and embers (III) about him
    if act >= 2:
        for k in range(10 if act == 2 else 16):
            a = k * 2.399 + f * 0.35; x = int(SW / 2 + math.cos(a) * (36 + k % 5 * 4)); y = int(cy + 10 + math.sin(a) * 38 - (f * 4 + k * 3) % 14)
            if 0 <= x < SW and 0 <= y < SH and not g[y][x][3]:
                put(x, y, ((255, 170, 50, 255) if k % 2 else (255, 230, 140, 255)) if act == 3 else ((120, 104, 112, 255) if k % 2 else (80, 66, 74, 255)))
    return g


def fall(k):
    # t=0 the hammer falls, t=1 the core implodes, then he goes to ash
    rnd = random.Random(40 + k); g = ashkar(3, 0)
    cx, cy = CORE
    for y in range(SH):
        for x in range(SW):
            if not g[y][x][3]: continue
            if math.hypot(x - cx, y - cy) < 6 + k * 3: g[y][x] = (30, 14, 18, 255) if k else (255, 255, 255, 255)
            elif KIND[y][x] == 'lava': g[y][x] = mix(g[y][x], (60, 30, 30), 0.4 + k * 0.3)
            elif rnd.random() < 0.15 + 0.3 * k: g[y][x] = (64, 52, 58, 255) if (x + y) % 2 else (96, 80, 84, 255)
    if k == 2:
        sh = [[BLANK] * SW for _ in range(SH)]
        for y in range(SH):
            for x in range(SW):
                if y + 22 < SH and g[y][x][3] and rnd.random() < 0.5: sh[y + 22][x] = g[y][x]
        return sh
    return g


# ---- his motion, rebuilt (2026-11-11, the user: "fix ashkars animations. We have two of him for some reason overlapped
# with each other. Provide true animations for him"). The old frames moved parts of the picture about and patched the
# gaps from the pixels beside them (or left the old place as it was): smeared second hammers, a haft left standing where
# the hammer had gone. Now he is a rig: his art cut into layers (the hammer with its haft and the gauntlet holding it, the
# body, each leg) and every frame composed on a clear canvas, each layer moved whole, the hammer turned about his
# shoulder. Nothing is ever left behind or smeared.
#   idle     breathing: the body and the hammer sink a pixel and rise, the lava flowing (ashkar's own frames)
#   walk     a heavy step: one leg lifted, the body settling onto the other, the hammer swaying
#   attack   the wind-up (the hammer hauled up over his shoulder), the slam (down before him, him crouched into it, debris
#            thrown up where it struck), the drag back
#   charge   leaning in, the hammer drawn down and back, his feet driving
#   hurt     a flinch: he sinks, the lava flaring
#   enter    II and III: he crouches, roars (the core flaring), the chains burst in sparks, he rises
import math as _m
from boss_motion import arc, tint  # noqa: E402
PT, PS = 34, 26                                 # (room above and beside him for the hammer's swing; his feet where they were)
W2, H2 = SW + 2 * PS, SH + PT
O = lambda x, y: (x - PS, y - PT)
SHOULDER = (31, 34)                             # (the hammer's arm turns about his left shoulder)
FIST = (22, 52)                                 # (or about the fist that grips its haft)
LAVA = lambda x, y, c: _k(x, y) == 'lava' or (abs(O(x, y)[0] - CORE[0]) < 8 and abs(O(x, y)[1] - CORE[1]) < 8 and c[0] > 200)
EMB = [(255, 214, 96, 255), (255, 140, 40, 255), (255, 240, 190, 255), (140, 120, 120, 255)]


def _k(x, y):
    X, Y = O(x, y)
    return KIND[Y][X] if 0 <= X < SW and 0 <= Y < SH else '.'


def part(x, y):                                 # which layer a pixel of his art belongs to
    if x < 33 and not (y >= 74 and x >= 29): return 'ham'
    if y >= 74 and x < 50: return 'legl'
    if y >= 74 and x > 76: return 'legr'
    return 'body'


def layers(act, f=0, s=False):
    g = ashkar(act, f, s); L = {'ham': [], 'legl': [], 'legr': [], 'body': []}
    for y in range(SH):
        for x in range(SW):
            if g[y][x][3]: L[part(x, y)].append((x, y, g[y][x]))
    return L


def rot(pts, ang, piv):                         # a layer turned about a point: each pixel of the result from the art (nearest)
    if not ang: return pts
    src = {(x, y): c for x, y, c in pts}; ca, sa = _m.cos(ang), _m.sin(ang); px, py = piv
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]; r = int(max(_m.hypot(x - px, y - py) for x, y in ((min(xs), min(ys)), (max(xs), min(ys)), (min(xs), max(ys)), (max(xs), max(ys))))) + 2
    out = []
    for Y in range(py - r, py + r + 1):
        for X in range(px - r, px + r + 1):
            dx, dy = X - px, Y - py
            sx, sy = px + dx * ca + dy * sa, py - dx * sa + dy * ca      # (the inverse turn)
            c = src.get((int(round(sx)), int(round(sy))))
            if c: out.append((X, Y, c))
    return out


# (2026-11-11, the user: "when ashkar attacks his arm separates from his shoulder ... maybe add some smoothness/full body
# movement"): the arm from under his pauldron to the fist is drawn each frame, a plated sleeve in his armour's own colours,
# so however the fist moves it stays joined to him; and his whole body leans into a blow (turned a few degrees at the hips)
JOINT, HIP = (30, 38), (62, 74)
def _avg(box, kinds):
    x0, y0, x1, y1 = box; px = [SRC[y][x] for y in range(y0, y1) for x in range(x0, x1) if SRC[y][x][3] and KIND[y][x] in kinds]
    return tuple(int(sum(c[i] for c in px) / max(1, len(px))) for i in range(3)) + (255,)
ARM = tuple(int(v * 0.8) for v in _avg((14, 42, 31, 60), ('body',))[:3]) + (255,); ARM_HI = _avg((14, 42, 31, 60), ('body',)); ARM_DK = tuple(int(v * 0.45) for v in ARM[:3]) + (255,); TRIM = _avg((10, 30, 40, 70), ('bronze',))


def sleeve(g, a, b, r=5.6):
    (ax, ay), (bx, by) = a, b; L = max(1e-6, _m.hypot(bx - ax, by - ay))
    for Y in range(int(min(ay, by) - r - 2), int(max(ay, by) + r + 3)):
        for X in range(int(min(ax, bx) - r - 2), int(max(ax, bx) + r + 3)):
            if not (0 <= X < W2 and 0 <= Y < H2): continue
            t = max(0, min(1, ((X - ax) * (bx - ax) + (Y - ay) * (by - ay)) / (L * L))); d = _m.hypot(X - (ax + (bx - ax) * t), Y - (ay + (by - ay) * t))
            if d <= r - 1.2: g[Y][X] = ARM_HI if X - (ax + (bx - ax) * t) < -r * 0.35 else (TRIM if abs(t - 0.5) * L < 1 else ARM)   # (lit on its left, a bronze band at the elbow)
            elif d <= r: g[Y][X] = ARM_DK


def comp(L, body=(0, 0), legl=(0, 0), legr=(0, 0), ham=0.0, hamd=(0, 0), piv=None, bang=0.0):
    g = [[BLANK] * W2 for _ in range(H2)]
    def put(pts, d):
        for x, y, c in pts:
            X, Y = x + PS + d[0], y + PT + d[1]
            if 0 <= X < W2 and 0 <= Y < H2: g[Y][X] = c
    put(L['legl'], legl); put(L['legr'], legr); put(rot(L['body'], bang, HIP), body)
    ca, sa = _m.cos(bang), _m.sin(bang); jx, jy = JOINT[0] - HIP[0], JOINT[1] - HIP[1]
    J = (HIP[0] + jx * ca - jy * sa + body[0] + PS, HIP[1] + jx * sa + jy * ca + body[1] + PT)
    P0 = piv or SHOULDER; F = (FIST[0] + body[0] + hamd[0] + PS, FIST[1] - 6 + body[1] + hamd[1] + PT)
    if piv != FIST:                             # (turned about the shoulder: where the fist went)
        fx, fy = FIST[0] - P0[0], FIST[1] - 6 - P0[1]; c2, s2 = _m.cos(ham), _m.sin(ham)
        F = (P0[0] + fx * c2 - fy * s2 + body[0] + hamd[0] + PS, P0[1] + fx * s2 + fy * c2 + body[1] + hamd[1] + PT)
    sleeve(g, J, F)
    put(rot(L["ham"], ham, P0), (body[0] + hamd[0], body[1] + hamd[1]))
    return g


def base(act, f=0, s=False): return comp(layers(act, f, s), body=(0, (0, 1, 1, 0)[f % 4]), hamd=(0, 0))


def walk(act, k):
    L = layers(act, k)
    if k == 0: return comp(L, body=(0, 2), legl=(0, -3), ham=_m.radians(4), piv=FIST)      # (the left leg lifted, his weight onto the right)
    if k == 2: return comp(L, body=(0, 2), legr=(0, -3), ham=_m.radians(-4), piv=FIST)
    return comp(L, body=(0, 0), ham=0)                                                # (rising over the pass)


def slam(act, k):
    # (2026-11-11, the user: "It should feel like the mace is heavy, like he has to really use muscles to swing it"): seven
    # beats. He sinks to gather it (the head dipping behind him), heaves it up leaning back on braced legs, holds it at the
    # top a moment, brings it down with his whole body, sinks into the blow and stays bent over it, catching his breath,
    # then drags it back up. The clip (below) gives the lift and the stay at the bottom more time than the fall.
    R = _m.radians
    if k == 0:                                  # (held as the tell) sinking to gather it, the head dipping back
        return tint(comp(layers(act, 0, True), body=(0, 2), legl=(-1, 0), bang=R(-2), ham=R(-8), hamd=(-2, 5), piv=FIST), LAVA, (255, 214, 130), 0.25)
    if k == 1:                                  # the heave: leaning back, the hammer coming up, legs braced
        return tint(comp(layers(act, 1, True), body=(1, 1), legl=(-1, 0), legr=(1, 0), bang=R(3), ham=R(10), hamd=(2, -6), piv=FIST), LAVA, (255, 222, 145), 0.4)
    if k == 2:                                  # the top: up over his shoulder, his whole frame stretched under its weight
        return tint(comp(layers(act, 2, True), body=(2, 0), legl=(-1, 0), legr=(2, 0), bang=R(5), ham=R(28), hamd=(5, -16), piv=FIST), LAVA, (255, 232, 160), 0.55)
    if k in (3, 4):                             # the blow: down with all of him behind it, the ground thrown up; then sunk into it
        g = comp(layers(act, 3, True), body=(0, 5 + (k - 3)), legl=(-2, 0), legr=(2, 0), bang=R(-4), ham=R(-35), hamd=(-6, 26 + (k - 3)), piv=FIST)
        g = tint(g, LAVA, (255, 236, 170), 0.75 - 0.2 * (k - 3)); hx, hy = PS - 14, PT + SH - 6
        return arc(g, [(hx + i * 3 + (i % 2) * 2, hy - (i % 4) * (3 + k - 3)) for i in range(14 if k == 3 else 8)], EMB)
    if k == 5:                                  # bent over it, catching his breath
        return comp(layers(act, 0), body=(0, 4), legl=(-1, 0), legr=(1, 0), bang=R(-3), ham=R(-32), hamd=(-5, 24), piv=FIST)
    return comp(layers(act, 1), body=(0, 2), bang=R(-1), ham=R(-18), hamd=(0, 9), piv=FIST)   # dragging it back up


def smash(act, k):
    # the Crucible's blow (2026-11-11, the user: "slam the handle of the mace into the ground, not the mace part. He should
    # reach high up and slam it"): he lifts the mace upright at his side, reaches up high with it, the head above his
    # horns, and drives the butt of its haft down into the floor, sinking with it; the head stays up
    if k == 0:                                  # brought before him, upright, gathering
        return comp(layers(act, 0, True), body=(0, 2), legl=(-1, 0), legr=(1, 0), hamd=(6, -3), piv=FIST)
    if k in (1, 2):                             # reaching high: the mace lifted overhead, him stretched tall (2: held, the core white)
        g = comp(layers(act, 1, True), body=(0, -2), legl=(-1, 0), legr=(1, 0), bang=_m.radians(2), hamd=(8, -30), piv=FIST)
        return tint(g, LAVA, (255, 244, 200), 0.45 if k == 1 else 0.8)
    if k in (3, 4):                             # driven down: the butt in the floor before him, him crouched over it, the floor broken round it
        g = comp(layers(act, 2, True), body=(0, 6 + (k - 3)), legl=(-2, 0), legr=(2, 0), bang=_m.radians(-3), hamd=(8, 8 + (k - 3)), piv=FIST)
        g = tint(g, LAVA, (255, 240, 190), 0.8 - 0.25 * (k - 3))
        bx, by = PS + 25 + 8, PT + SH - 2
        return arc(g, [(bx + _m.cos(i * 0.5) * (6 + i % 3 * 5 + (k - 3) * 4), by + _m.sin(i * 0.5) * (2 + i % 2 * 2)) for i in range(26)], EMB)
    return comp(layers(act, 0), body=(0, 3), hamd=(6, 2), piv=FIST)       # drawing it up out of the floor


def rush(act, k):
    L = layers(act, k * 2)
    return arc(comp(L, body=(0, 3), legl=(0, -3) if k == 0 else (0, 0), legr=(0, 0) if k == 0 else (0, -3), ham=_m.radians(-15), hamd=(0, 8), piv=FIST),
               [(PS + 30 + i * 9 + k * 4, H2 - 1) for i in range(6)], [(120, 104, 112, 255)])


def flinch(act): return tint(comp(layers(act, 1), body=(0, 3), ham=_m.radians(6), hamd=(0, 2), piv=FIST), LAVA, (255, 210, 120), 0.7)


def enter(act, k):
    if k == 3: return base(act)
    L = layers(act, 1)                          # (unchained from the first frame: what broke off him lies on the floor, never back on him)
    g = comp(L, body=(0, 4 if k == 0 else 1), ham=_m.radians(-12 if k == 0 else 18), hamd=(0, 6) if k == 0 else (2, -8), piv=FIST)
    if k == 1: g = tint(g, LAVA, (255, 240, 190), 0.8)                                       # (the roar: the core flaring)
    if k == 2:
        if act == 2: pts = [(PS + (CHAINS[n][0] + CHAINS[n][2]) / 2 + _m.cos(i * 1.7) * 5, PT + (CHAINS[n][1] + CHAINS[n][3]) / 2 + _m.sin(i * 1.7) * 6) for n in CHAINS for i in range(3)]
        else: pts = [(PS + CORE[0] + _m.cos(i * 0.52) * (9 + i % 3 * 4), PT + CORE[1] + _m.sin(i * 0.52) * (9 + i % 3 * 4)) for i in range(24)]
        g = arc(tint(g, LAVA, (255, 240, 190), 0.9), pts, EMB)
    return g


def die(k):
    # his fall (2026-11-11, the user: "The death animation is terrible. You basically condensed the sprite down instead of
    # providing a proper animation of him kneeling before exploding"): a rig of his own, five beats. He staggers, the mace
    # slipping in his grip; drops, the right leg folding; lands on that knee (its shin under him, out of sight, the knee on
    # the floor), the left foot planted, the mace's head on the floor at his side, him bent over it; slumps lower, the core
    # flaring; and the last beat before he bursts, the core white and the lava in him blazing (the burst is the game's,
    # src/render.js bossBlast). Drawn in his third look, the one he dies in
    R = _m.radians
    L = layers(3, k % 4)
    def kneel_leg(cut):                         # the right leg: only what is above the knee, the rest folded under him
        return dict(L, legr=[(x, y, c) for (x, y, c) in L['legr'] if y < cut])
    if k == 0:                                  # the stagger: reeling back, the mace slipping
        return tint(comp(L, body=(1, 2), legl=(-1, 0), bang=R(4), ham=R(-14), hamd=(-2, 8), piv=FIST), LAVA, (255, 214, 130), 0.3)
    if k == 1:                                  # dropping: the right leg giving way under him
        return tint(comp(kneel_leg(97), body=(0, 9), legl=(-1, 1), legr=(1, 8), bang=R(-2), ham=R(-34), hamd=(-2, 22), piv=FIST), LAVA, (255, 220, 140), 0.35)
    if k == 2:                                  # on his knee: the knee on the floor, the mace's head beside him, bent over it
        return tint(comp(kneel_leg(88), body=(0, 19), legl=(-2, 3), legr=(1, 19), bang=R(-5), ham=R(-52), hamd=(-1, 34), piv=FIST), LAVA, (255, 228, 160), 0.45)
    if k == 3:                                  # slumped lower, the core flaring
        return tint(comp(kneel_leg(88), body=(0, 21), legl=(-2, 3), legr=(1, 19), bang=R(-8), ham=R(-55), hamd=(-1, 35), piv=FIST), LAVA, (255, 244, 200), 0.75)
    g = comp(kneel_leg(88), body=(0, 21), legl=(-2, 3), legr=(1, 19), bang=R(-8), ham=R(-55), hamd=(-1, 35), piv=FIST)   # the moment before: white-hot
    g = tint(g, LAVA, (255, 255, 240), 0.95)
    return arc(g, [(PS + CORE[0] + _m.cos(i * 0.7) * (8 + i % 4 * 4), PT + CORE[1] + 21 + _m.sin(i * 0.7) * (8 + i % 4 * 4)) for i in range(22)], [(255, 255, 240, 255), (255, 214, 96, 255)])


def pack(name, entries, W, H, cols=6):
    rows = (len(entries) + cols - 1) // cols
    px = [[BLANK] * (cols * W) for _ in range(rows * H)]; fr = {}
    for i, (key, grid) in enumerate(entries):
        ox, oy = (i % cols) * W, (i // cols) * H
        for y, row in enumerate(grid):
            for x, c in enumerate(row):
                if c[3]: px[oy + y][ox + x] = c
        fr[key] = [ox, oy, W, H]
    write_png(os.path.join(out, name + '.png'), px)
    return fr


def vent(f=0, hot=False):
    # an iron grate in a stone collar, the fire under it showing between the bars (brighter as it fires)
    o, i, I, h, H = (14, 10, 18), (52, 48, 60), (76, 70, 86), (108, 100, 120), (146, 138, 160)
    fire = [(200, 56, 26), (255, 106, 28), (255, 162, 44), (255, 214, 96), (255, 244, 196)]
    g = [[BLANK] * 16 for _ in range(16)]
    for y in range(16):
        for x in range(16):
            d = max(abs(x - 7.5), abs(y - 8.5) * 1.15)
            if d > 7.6: continue
            if d > 6.2: g[y][x] = (*(h if y < 8 else i), 255)
            elif d > 5.2: g[y][x] = (*o, 255)
            elif x % 3 == 1: g[y][x] = (*(H if y < 7 else I), 255)          # a bar
            else:
                k = 2 + (1 if (x + y + f) % 4 == 0 else 0) - (1 if y > 12 else 0) + (1 if hot else 0)
                g[y][x] = (*fire[max(0, min(4, k))], 255)
    g[15] = [(*o, 255) if c[3] else c for c in g[15]]
    return g


if __name__ == '__main__':
    BID, NAMES = 'ashkar_gatekeeper', {1: 'The Bound Giant', 2: 'The Furnace Fractures', 3: 'The Unchained'}
    frames = []
    for act in (1, 2, 3):
        frames += [(f'i{act}_{k}', base(act, k)) for k in range(4)] + [(f'a{act}_{k}', slam(act, k)) for k in range(7)] + [(f'm{act}_{k}', smash(act, k)) for k in range(6)]
        frames += [(f'w{act}_{k}', walk(act, k)) for k in range(4)] + [(f'c{act}_{k}', rush(act, k)) for k in range(2)] + [(f'h{act}', flinch(act))]
        if act > 1: frames += [(f'e{act}_{k}', enter(act, k)) for k in range(4)]
    frames += [(f'd{k}', die(k)) for k in range(5)]
    fr = pack(BID, frames, W2, H2)
    anims = {}
    for act in (1, 2, 3):
        anims[f'idle{act}'] = {'frames': [f'i{act}_{k}' for k in range(4)], 'fps': 7, 'loop': True}
        anims[f'attack{act}'] = {'frames': [f'a{act}_{k}' for k in (0, 1, 2, 2, 3, 4, 4, 5, 6)], 'fps': 10, 'loop': False}   # (slow up, held at the top, fast down, a long stay)
        # the Crucible's great blow (src/bosses/ashkar_gatekeeper.js): over his head, down before him; the blow lands at 0.6 s
        anims[f'strike{act}'] = {'frames': [f'a{act}_{k}' for k in (1, 2, 3, 4, 5, 6)], 'fps': 10, 'loop': False}   # (an anvil struck between attacks: the blow at 0.2 s)
        anims[f'smash{act}'] = {'frames': [f'm{act}_{k}' for k in (0, 1, 1, 2, 3, 4, 4, 5)], 'fps': 8, 'loop': False}   # (the blow at 0.5 s)
        anims[f'walk{act}'] = {'frames': [f'w{act}_{k}' for k in range(4)], 'fps': 5, 'loop': True}
        anims[f'charge{act}'] = {'frames': [f'c{act}_0', f'c{act}_1'], 'fps': 9, 'loop': True}
        anims[f'hurt{act}'] = {'frames': [f'h{act}'], 'fps': 5, 'loop': False}
        if act > 1: anims[f'enter{act}'] = {'frames': [f'e{act}_{k}' for k in range(4)], 'fps': 3.5, 'loop': False}
    anims['death'] = {'frames': [f'd{k}' for k in range(5)], 'fps': 1.7, 'loop': False}
    # his kneel (src/render.js kneelBoss plays it over the time he kneels: the stagger, the drop, a long stay on the knee, the white)
    anims['kneel'] = {'frames': ['d0', 'd1', 'd2', 'd2', 'd2', 'd3', 'd3', 'd3', 'd4', 'd4'], 'fps': 4.5, 'loop': False}
    sheets = {f'bx_{BID}': {'image': f'{BID}.png', 'kind': 'boss', 'sprites': {BID: {'frames': fr, 'anims': anims,
              'phases': {str(a): {'name': NAMES[a], 'idle': f'idle{a}', 'attack': f'attack{a}', 'walk': f'walk{a}', 'charge': f'charge{a}', 'hurt': f'hurt{a}', **({'enter': f'enter{a}'} if a > 1 else {})} for a in (1, 2, 3)}, 'death': 'death', 'meta': {'half': True}}}}}
    json.dump({'rf': True, 'meta': {'name': 'Ashkar, the Chained Forge-Giant (the user\'s sprite)', 'version': 4}, 'sheets': sheets},
              open(os.path.join(out, 'atlas_gatekeeper.json'), 'w', encoding='utf8', newline='\n'), indent=1)
    vfr = pack('ash_kin', [('move1', vent(0)), ('move2', vent(2)), ('attack', vent(1, True)), ('hurt', vent(3))], 16, 16, cols=4)
    json.dump({'rf': True, 'meta': {'name': "Ashkar's hall", 'version': 1}, 'sheets': {'ash_kin': {'image': 'ash_kin.png', 'kind': 'enemy', 'sprites': {'vent': {'frames': vfr,
              'anims': {'move': {'frames': ['move1', 'move2'], 'fps': 6, 'loop': True}, 'attack': {'frames': ['move1', 'attack'], 'fps': 6, 'loop': False}, 'hurt': {'frames': ['hurt', 'move1'], 'fps': 8, 'loop': False}}}}}}},
              open(os.path.join(out, 'atlas_ash_kin.json'), 'w', encoding='utf8', newline='\n'), indent=1)
    ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
    if 'throne/atlas_ash_kin.json' not in idx['atlases']:
        idx['atlases'].append('throne/atlas_ash_kin.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
    S = 4; G = [ashkar(1, 0), ashkar(1, 2), ashkar(2, 1), ashkar(3, 1), ashkar(3, 0, True), fall(1)]
    P = [[(30, 22, 34, 255)] * (len(G) * (SW + 2) * S) for _ in range((SH + 2) * S)]
    for gi, g in enumerate(G):
        for y, row in enumerate(g):
            for x, col in enumerate(row):
                if col[3]:
                    for dy in range(S): P[(y + 1) * S + dy][(gi * (SW + 2) + x + 1) * S:(gi * (SW + 2) + x + 2) * S] = [col] * S
    write_png(os.path.join(root, 'art', '_proto', 'ashkar_preview.png'), P)
    print('Ashkar:', len(frames), 'frames', SW, 'x', SH)
