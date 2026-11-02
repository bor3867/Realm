# Seven of Sunthief's Castle's defenders redrawn (2026-11-02, the user: "The big archer enemy and the knight enemy with the
# crown have terrible sprites. Can we please enhance them. Same with the mace guy. Same with the infernal hounds. And the
# fire elemental. Same with the small mage. They can all look better and be stronger. I want full shooting animations, not
# just walking animations."). Drawn here at their full size (one art pixel to one of the screen's, so drawn at scale 1),
# shaded by hand-set ramps lit from the upper left, their edges in each part's own darkest shade (no black rim), facing
# right (the renderer mirrors them). Each has:
#   move  four frames, a real step (legs, cloak, a gait for the hound, a flicker for the elemental)
#   shoot four frames: the wind-up, the draw (held through its telegraph), the release (muzzle flare, the shot leaving),
#         the recovery. src/render.js regEnemy plays the first two in 'tell', the last two when it fires
#   hurt  a flinch (no tint: the user's rule against hit flashes)
# Written over their rows in art/bundle/throne/castle_kin.png? No: their own sheet, 'castle_elite/<id>', and
# src/castle_kin.js points these seven at it.   py -I tools/build_castle_elite.py [preview.png]
import json, math, os, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(root, 'tools'))
from pixlib import write_png  # noqa: E402
out = os.path.join(root, 'art', 'bundle', 'throne')
BLANK = (0, 0, 0, 0)
R_ = lambda *c: list(c)
IRON = R_((38, 36, 48), (62, 60, 74), (96, 94, 110), (138, 136, 152), (186, 184, 198))
STEEL = R_((46, 48, 62), (78, 82, 100), (120, 126, 146), (168, 174, 192), (222, 226, 238))
GOLD = R_((92, 58, 18), (150, 104, 30), (204, 156, 46), (244, 206, 84), (255, 244, 170))
ASH = R_((30, 24, 36), (50, 40, 58), (74, 62, 84), (102, 88, 112), (132, 118, 140))
VIOL = R_((40, 18, 58), (70, 34, 96), (108, 56, 140), (150, 90, 186), (196, 140, 226))
DEEPV = R_((28, 12, 40), (52, 24, 72), (82, 40, 110), (118, 66, 150), (160, 104, 196))
RED = R_((70, 16, 20), (118, 28, 30), (166, 44, 38), (210, 76, 54), (240, 128, 96))
OBS = R_((26, 22, 30), (44, 38, 50), (66, 58, 72), (92, 84, 98), (124, 116, 130))
WOOD = R_((44, 26, 18), (74, 46, 28), (106, 70, 42), (140, 98, 60), (172, 130, 84))
HIDE = R_((60, 18, 14), (104, 34, 20), (150, 56, 28), (196, 88, 40), (232, 134, 70))
EMB = R_((150, 50, 20), (230, 100, 30), (255, 160, 50), (255, 214, 96), (255, 248, 210))
FLM = R_((120, 30, 16), (200, 64, 24), (250, 120, 36), (255, 186, 70), (255, 240, 180))
WHITE = (255, 252, 236)


class C:
    def __init__(s, w, h): s.w, s.h = w, h; s.p = [[BLANK] * w for _ in range(h)]
    def put(s, x, y, c):
        x, y = int(round(x - 0.01)), int(round(y - 0.01))
        if 0 <= x < s.w and 0 <= y < s.h: s.p[y][x] = (*c[:3], 255)
    def shape(s, inside, R, lx=-0.55, ly=-0.75, edge=True, bias=0.0):
        pts = {}
        for y in range(s.h):
            for x in range(s.w):
                n = inside(x + 0.5, y + 0.5)
                if n: pts[(x, y)] = n
        for (x, y), n in pts.items():
            nx, ny = n if isinstance(n, tuple) else (0, 0)
            v = max(0.0, min(0.999, 0.5 + bias + (nx * lx + ny * ly) * 0.55))
            i = min(len(R) - 1, 1 + int(v * (len(R) - 1)))
            if edge and any((x + dx, y + dy) not in pts for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                i = 0 if (nx * lx + ny * ly) < 0.2 else 1
            s.p[y][x] = (*R[i], 255)
        return pts
    def ell(s, cx, cy, rx, ry, R, **k):
        return s.shape(lambda x, y: ((x - cx) / rx, (y - cy) / ry) if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 else None, R, **k)
    def box(s, x0, y0, x1, y1, R, **k):
        cx, cy, hx, hy = (x0 + x1) / 2, (y0 + y1) / 2, max(0.5, (x1 - x0) / 2), max(0.5, (y1 - y0) / 2)
        return s.shape(lambda x, y: ((x - cx) / hx * 0.8, (y - cy) / hy * 0.8) if x0 <= x <= x1 and y0 <= y <= y1 else None, R, **k)
    def trap(s, cx, y0, y1, w0, w1, R, **k):                 # a robe: w0 wide at the top, w1 at the hem
        def f(x, y):
            if not (y0 <= y <= y1): return None
            t = (y - y0) / max(1, y1 - y0); hw = w0 + (w1 - w0) * t
            return ((x - cx) / hw, (t - 0.5) * 1.2) if abs(x - cx) <= hw else None
        return s.shape(f, R, **k)
    def seg(s, x0, y0, x1, y1, r, R, **k):
        dx, dy = x1 - x0, y1 - y0; L2 = dx * dx + dy * dy or 1
        def f(x, y):
            t = max(0, min(1, ((x - x0) * dx + (y - y0) * dy) / L2)); px, py = x0 + dx * t - x, y0 + dy * t - y
            return (-px / r, -py / r) if math.hypot(px, py) <= r else None
        return s.shape(f, R, **k)
    def line(s, x0, y0, x1, y1, c):
        n = int(max(abs(x1 - x0), abs(y1 - y0)) * 1.5) + 1
        for i in range(n + 1): t = i / n; s.put(x0 + (x1 - x0) * t + 0.5, y0 + (y1 - y0) * t + 0.5, c)
    def glow(s, cx, cy, r, col, k):
        for y in range(s.h):
            for x in range(s.w):
                d = math.hypot(x + 0.5 - cx, y + 0.5 - cy); q = s.p[y][x]
                if d < r and q[3]:
                    a = (1 - d / r) ** 1.6 * k
                    s.p[y][x] = (min(255, int(q[0] + (col[0] - q[0]) * a)), min(255, int(q[1] + (col[1] - q[1]) * a)), min(255, int(q[2] + (col[2] - q[2]) * a)), 255)
    def flare(s, cx, cy, r):                                   # a muzzle flash: a small star of light
        for d in range(-r, r + 1):
            s.put(cx + d + 0.5, cy + 0.5, EMB[3] if abs(d) < r else EMB[2]); s.put(cx + 0.5, cy + d + 0.5, EMB[3] if abs(d) < r else EMB[2])
        s.put(cx + 0.5, cy + 0.5, WHITE)


def legs(c, cx, foot, top, k, R, wide=2.2, boot=None, lift=1):
    # two legs stepping: k 0..3 (0 left forward, 2 right forward)
    sw = [(-1, 1), (0, 0), (1, -1), (0, 0)][k]
    for side, d in ((-1, sw[0]), (1, sw[1])):
        x = cx + side * wide + d * 0.8; up = lift if (k == 0 and side == -1) or (k == 2 and side == 1) else 0
        c.box(x - 1.2, top, x + 1.2, foot - up, R)
        c.box(x - 1.6 + (0.6 if side > 0 else 0), foot - 1.2 - up, x + 1.6 + (0.6 if side > 0 else 0), foot - up, boot or R, bias=-0.1)


# ------------------------------------------------------------------ the Cinder Archer: an ash-hooded ranger, an ember longbow
def archer(k=0, a=None, hurt=False):
    W, H = 20, 22; c = C(W, H); dy = 1 if (k in (1, 3) and a is None) else 0; dy += 1 if hurt else 0
    c.box(3, 6 + dy, 6, 15 + dy, WOOD)                                         # the quiver on his back, flaming arrows in it
    for i, x in enumerate((3.5, 4.5, 5.5)): c.put(x, 4 + dy + (i % 2), FLM[3 + (k + i) % 2])
    legs(c, 9.5, 21, 15 + dy, k if a is None else 1, ASH, wide=1.8, boot=WOOD)
    c.trap(9.5, 8 + dy, 17 + dy, 3.6, 5.2, ASH)                                 # the cloak
    c.box(7, 13 + dy, 12, 13.6 + dy, WOOD, edge=False, bias=0.2)                # his belt
    c.ell(10, 6 + dy, 3.4, 3.4, ASH, bias=0.05)                                 # the hood
    c.ell(11, 6.6 + dy, 2, 1.6, [(14, 10, 18)] * 5, edge=False)                 # the dark under it
    c.put(11.4, 6.4 + dy, EMB[4]); c.put(12.6, 6.4 + dy, EMB[3])                 # his eyes
    # the bow: held out ahead, its string drawn back in the shot
    draw = {None: 0, 0: 1.5, 1: 4, 2: 0, 3: 0.5}[a]
    bx = 15 if a is None else 16; by0, by1 = 3 + dy, 19 + dy
    for i in range(17):
        t = i / 16; y = by0 + (by1 - by0) * t; x = bx + math.sin(t * math.pi) * 2.6
        c.put(x, y, WOOD[3] if t < 0.5 else WOOD[2]); c.put(x + 0.9, y, WOOD[1])
    c.put(bx + 0.5, by0, EMB[3]); c.put(bx + 0.5, by1, EMB[3])
    sx = bx - draw; my = (by0 + by1) / 2
    c.line(bx, by0, sx, my, EMB[2] if a in (0, 1) else (230, 200, 160)); c.line(sx, my, bx, by1, EMB[2] if a in (0, 1) else (230, 200, 160))
    c.seg(10, 10 + dy, bx + 1.4, my, 1.0, ASH, bias=0.1)                         # the bow arm
    if a in (0, 1):                                                              # the arrow, nocked, its head alight
        c.line(sx, my, bx + 4, my, WOOD[3]); c.put(bx + 4, my, EMB[4]); c.put(bx + 3, my, EMB[3])
        c.seg(9, 10 + dy, sx, my, 1.0, ASH, bias=0.1)
        if a == 1: c.glow(bx + 4, my, 3.5, EMB[3], 0.5)
    else: c.seg(9, 10 + dy, bx - 1, my + 1, 1.0, ASH, bias=0.1)
    if a == 2: c.flare(bx + 2.5, my, 2)
    return c.p


# ------------------------------------------------------------------ the Infernal Hound: a lean beast, its spine split with fire
def hound(k=0, a=None, hurt=False):
    W, H = 24, 18; c = C(W, H); dy = 1 if hurt else 0
    crouch = {None: 0, 0: 1, 1: 1, 2: -1, 3: 0}[a]; by = 9 + crouch + dy
    g = [(2, -2, -1, 1), (1, -1, 0, 0), (-2, 2, 1, -1), (-1, 1, 0, 0)][k if a is None else (1 if a < 2 else 0)]
    for i, (x0, ph) in enumerate(((6.5, g[0]), (9, g[1]), (15, g[2]), (17.5, g[3]))):   # legs (far ones darker)
        far = i in (1, 3); R = HIDE[:3] + [HIDE[2], HIDE[2]] if far else HIDE
        c.seg(x0, by + 1, x0 + ph * 0.8, 16.5, 1.0, R)
        c.box(x0 + ph * 0.8 - 1, 16, x0 + ph * 0.8 + 1.4, 17, OBS)
    for i in range(5):                                                            # the tail, burning
        t = i / 4; c.put(4.5 - t * 3, by - 1 - t * 4 + math.sin(k + t * 3) * 0.6, FLM[4 - i % 3] if i > 1 else HIDE[3])
    c.ell(11.5, by, 7, 3.4, HIDE)                                                 # the body
    for x in range(7, 17, 2): c.put(x + (k % 2), by - 3, EMB[3] if x % 4 else EMB[4])   # the fire along its spine
    c.line(8, by - 0.5, 15, by - 0.8, HIDE[0])                                     # a rib shadow
    hx, hy = 18.5 + (1 if a == 2 else 0), by - 2.5 - (1 if a in (0, 1) else 0)
    c.seg(16, by - 1, hx - 1, hy + 0.5, 2.0, HIDE)                                # the neck
    c.ell(hx, hy, 3.2, 2.6, HIDE, bias=0.05)                                      # the head
    jaw = 1.6 if a in (1, 2) else 0.4
    c.box(hx + 1.5, hy - 0.2, hx + 4.6, hy + 1.2, HIDE)                           # the snout
    c.box(hx + 1.2, hy + 1.6, hx + 4.2, hy + 1.6 + jaw, HIDE[:2] * 2 + [HIDE[2]])  # the jaw
    if jaw > 1: c.box(hx + 2, hy + 1.2, hx + 4, hy + 1.6 + jaw * 0.6, FLM, edge=False, bias=0.2)   # its mouth, alight
    c.put(hx - 1.4, hy - 3, HIDE[2]); c.put(hx - 0.6, hy - 3.6, HIDE[1]); c.put(hx - 1.6, hy - 2.4, HIDE[3])   # the ear
    c.put(hx + 0.8, hy - 0.8, EMB[4]); c.put(hx + 1.6, hy - 0.8, EMB[3])          # the eye
    if a == 1: c.glow(hx + 3, hy + 1.6, 3.5, EMB[3], 0.55)
    if a == 2: c.flare(hx + 5.5, hy + 1.5, 2)
    return c.p


# ------------------------------------------------------------------ the small mages: the Solar Acolyte and the Sun Cultist
def mage(k, a, hurt, W, H, robe, trim, mask, staff_top, big):
    c = C(W, H); dy = (1 if (k in (1, 3) and a is None) else 0) + (1 if hurt else 0)
    hem = H - 1; top = 7 + dy if big else 6 + dy
    sway = [0, 0.6, 0, -0.6][k] if a is None else 0
    c.trap(W / 2 - 1, top, hem, 3.2 if big else 2.6, (6.4 if big else 5.0), robe, bias=0.05)   # the robe
    for x in range(int(W / 2 - 5), int(W / 2 + 4)):                              # its hem swaying, a gold trim
        c.put(x + sway, hem, trim[2] if x % 2 else trim[3])
    c.box(W / 2 - 1.6, top + 3, W / 2 - 0.4, hem - 1, trim, edge=False, bias=0.1)   # the stole down its front
    hx = W / 2 - 1
    c.ell(hx, top - 1.5, 3.2 if big else 2.8, 3.4 if big else 3.0, robe, bias=0.1)   # the hood
    if big:                                                                        # the Cultist's gold mask, a sun on it
        c.ell(hx + 0.6, top - 1, 1.9, 2.1, GOLD, bias=0.15)
        c.put(hx + 0.3, top - 1.4, (40, 20, 10)); c.put(hx + 1.5, top - 1.4, (40, 20, 10)); c.put(hx + 0.9, top + 0.2, GOLD[4])
    else:
        c.ell(hx + 0.8, top - 1, 1.6, 1.4, [(16, 8, 24)] * 5, edge=False)
        c.put(hx + 0.4, top - 1.2, EMB[4]); c.put(hx + 1.6, top - 1.2, EMB[3])
        for i, x in enumerate((hx - 2, hx, hx + 2)): c.put(x, top - 4.6 + (1 if i != 1 else 0), GOLD[3 + (i == 1)])   # the sun circlet
    # the staff: upright as it walks; raised in the wind-up, thrust ahead in the release
    pose = {None: (W / 2 + 4, top + 1, W / 2 + 4, hem), 0: (W / 2 + 3, top - 4, W / 2 + 4.5, hem - 2), 1: (W / 2 + 2.5, top - 6, W / 2 + 4.5, hem - 3),
            2: (W - 1.5, top + 1, W / 2 + 1, hem - 3), 3: (W / 2 + 5, top, W / 2 + 4, hem - 1)}[a]
    tx, ty, bx, by = pose
    c.seg(bx, by, tx, ty, 0.7, WOOD if not big else GOLD, edge=False)
    c.seg(hx + 1, top + 3, (tx + bx) / 2, (ty + by) / 2, 1.0, robe, bias=0.15)      # the arm holding it
    orb = 1.6 if a in (0, 1) else 1.2
    c.ell(tx, ty, orb, orb, staff_top, edge=True, lx=0.4, ly=0.6)
    if big:                                                                        # the Cultist's sun: rays round the orb
        for i in range(8): an = i * math.pi / 4 + (k * 0.2); c.put(tx + math.cos(an) * 2.6, ty + math.sin(an) * 2.6, GOLD[3])
    if a in (0, 1): c.glow(tx, ty, 4.5 if a == 1 else 3, EMB[4], 0.6 if a == 1 else 0.35)
    if a == 1:
        for i in range(6): an = i * math.pi / 3; c.put(tx + math.cos(an) * 3.6, ty + math.sin(an) * 3.6, EMB[3])
    if a == 2: c.flare(tx + 1.5, ty, 2)
    return c.p
acolyte = lambda k=0, a=None, hurt=False: mage(k, a, hurt, 18, 20, VIOL, GOLD, False, EMB, False)
cultist = lambda k=0, a=None, hurt=False: mage(k, a, hurt, 22, 24, DEEPV, GOLD, True, GOLD, True)


# ------------------------------------------------------------------ the Lava Guard: obsidian plate cracked with lava, a mace
def guard(k=0, a=None, hurt=False):
    W, H = 24, 24; c = C(W, H); dy = (1 if (k in (1, 3) and a is None) else 0) + (1 if hurt else 0) + (1 if a == 2 else 0)
    c.ell(6.5, 13 + dy, 3.4, 5.2, OBS, bias=-0.05)                                # his shield (the far arm)
    c.ell(6.5, 13 + dy, 0.9, 1.4, EMB, edge=False, bias=0.1)                       # its lava boss
    legs(c, 11.5, 23, 16 + dy, k if a is None else 1, OBS, wide=2.4)
    c.trap(11.5, 7 + dy, 17 + dy, 5.4, 4.2, OBS)                                   # the cuirass
    for (x0, y0, x1, y1) in ((9, 9, 11, 13), (13, 10, 14, 14), (10, 14, 12, 16)):  # the lava in its cracks
        c.line(x0, y0 + dy, x1, y1 + dy, EMB[2 + (x0 + k) % 2])
    c.glow(11.5, 12 + dy, 6, EMB[2], 0.18)
    c.ell(7.5, 8 + dy, 2.6, 2.2, OBS, bias=0.1); c.ell(15.5, 8 + dy, 2.6, 2.2, OBS, bias=0.1)   # pauldrons
    c.ell(11.5, 4.5 + dy, 3.4, 3.6, OBS, bias=0.1)                                 # the helm
    c.box(10, 4 + dy, 15, 4.6 + dy, EMB, edge=False, bias=0.2); c.box(12, 4 + dy, 12.6, 7 + dy, EMB, edge=False)   # its T of a visor, burning
    c.put(11.5, 0.6 + dy, EMB[3]); c.put(11.5, 1.4 + dy, OBS[2])                   # its crest
    # the mace: at his side; drawn up and back; overhead; brought down ahead
    P = {None: (16.5, 11, 18.5, 18), 0: (16.5, 10, 20, 4), 1: (15.5, 8, 15, 1.5), 2: (16.5, 10, 22, 14), 3: (16.5, 11, 19.5, 17)}[a]
    hx, hy, mx, my = P[0], P[1] + dy, P[2], P[3] + dy
    c.seg(hx, hy, mx, my, 0.7, WOOD, edge=False)
    c.seg(15.5, 8 + dy, hx, hy, 1.3, OBS, bias=0.1)                                 # the arm
    c.ell(mx, my, 2.9, 2.9, OBS, bias=0.15)                                         # the mace head, spiked, glowing at its seams
    for i in range(8): an = i * math.pi / 4; c.put(mx + math.cos(an) * 3.6, my + math.sin(an) * 3.6, OBS[4])
    c.put(mx, my, EMB[3]); c.put(mx - 0.8, my - 0.8, EMB[2])
    if a in (0, 1): c.glow(mx, my, 4, EMB[3], 0.45)
    if a == 2:
        c.flare(mx + 1, my + 2.5, 2)
        for i in range(5): c.put(mx - 3 + i * 1.6, my + 4 + (i % 2), EMB[3 + i % 2])
    return c.p


# ------------------------------------------------------------------ the Sunbound Knight: crowned plate, a blade of sunlight
def knight(k=0, a=None, hurt=False):
    W, H = 28, 28; c = C(W, H); dy = (1 if (k in (1, 3) and a is None) else 0) + (1 if hurt else 0)
    c.trap(13, 9 + dy, 22 + dy, 5, 7.5, RED, bias=-0.1)                             # his cape, behind
    legs(c, 13, 27, 19 + dy, k if a is None else 1, STEEL, wide=2.6, boot=STEEL)
    c.trap(13, 10 + dy, 20 + dy, 5.6, 4.6, STEEL)                                   # the breastplate
    c.box(11.4, 14 + dy, 14.6, 21 + dy, RED, bias=0.05)                              # the tabard
    c.put(13, 16 + dy, GOLD[4]); c.put(12.4, 16.6 + dy, GOLD[3]); c.put(13.6, 16.6 + dy, GOLD[3]); c.put(13, 17.4 + dy, GOLD[3])   # a sun on it
    c.box(8, 19 + dy, 18, 19.8 + dy, GOLD, edge=False, bias=0.1)                    # the belt
    c.ell(8.5, 11 + dy, 3, 2.6, STEEL, bias=0.1); c.ell(17.5, 11 + dy, 3, 2.6, STEEL, bias=0.1)   # pauldrons, gold-rimmed
    c.line(6, 12.6 + dy, 11, 12.6 + dy, GOLD[2]); c.line(15, 12.6 + dy, 20, 12.6 + dy, GOLD[2])
    c.ell(13, 6.5 + dy, 3.8, 4, STEEL, bias=0.1)                                    # the great helm
    c.box(11, 6 + dy, 17, 6.8 + dy, [(16, 14, 22)] * 5, edge=False); c.put(14.5, 6.4 + dy, EMB[4]); c.put(16, 6.4 + dy, EMB[3])   # its eye slit
    for i, x in enumerate((9.6, 11.3, 13, 14.7, 16.4)): c.box(x - 0.5, 1 + dy + (0 if i % 2 == 0 else 1), x + 0.5, 3 + dy, GOLD, bias=0.2)   # the crown
    c.box(9.4, 2.6 + dy, 16.8, 3.4 + dy, GOLD, edge=False, bias=0.1); c.put(13, 1 + dy, (255, 90, 80))
    c.ell(8, 16 + dy, 3.6, 4.6, STEEL, bias=0.05); c.ell(8, 16 + dy, 1.6, 2, GOLD, edge=False, bias=0.15)   # his shield, a sun boss
    # the sword: point down at his side; raised; overhead; swept ahead in an arc of light
    P = {None: (19.5, 15, 21.5, 26), 0: (19, 13, 24, 4), 1: (17, 10, 15, 0.5), 2: (19, 14, 27, 18), 3: (19.5, 15, 23, 25)}[a]
    hx, hy, tx, ty = P[0], P[1] + dy, P[2], P[3] + dy
    c.seg(hx, hy, tx, ty, 0.9, [GOLD[1], GOLD[3], (255, 236, 160), (255, 248, 210), WHITE], edge=True)
    an = math.atan2(ty - hy, tx - hx); px, py = -math.sin(an), math.cos(an)
    c.line(hx - px * 1.6, hy - py * 1.6, hx + px * 1.6, hy + py * 1.6, GOLD[2])   # the crossguard
    c.seg(17.5, 11 + dy, hx, hy, 1.4, STEEL, bias=0.1)                              # the arm
    if a in (0, 1): c.glow(tx, ty, 5, GOLD[4], 0.45)
    if a == 2:                                                                       # the arc of its stroke
        for i in range(9): t = i / 8; an2 = -1.2 + t * 2.0; c.put(19 + math.cos(an2) * 8, 14 + dy + math.sin(an2) * 8, GOLD[4] if i % 2 else (255, 248, 210))
        c.flare(26, 17 + dy, 2)
    return c.p


# ------------------------------------------------------------------ the Cinder Elemental: a pillar of flame, a core of slag
def elemental(k=0, a=None, hurt=False):
    W, H = 28, 28; c = C(W, H); bob = [0, -1, -1, 0][k]; dy = bob + (1 if hurt else 0)
    swell = {None: 0, 0: -0.6, 1: -1.2, 2: 1.6, 3: 0.6}[a]
    ph = k * 1.3
    for i, (rx, ry, oy, R) in enumerate(((8 + swell, 10, 15, FLM[:3] + [FLM[2], FLM[3]]), (6.4 + swell * 0.8, 8.6, 14, FLM), (4.6 + swell * 0.6, 6.6, 13.5, FLM[1:] + [WHITE]))):
        cx = 14 + math.sin(ph + i) * 0.6
        c.shape(lambda x, y, cx=cx, rx=rx, ry=ry, oy=oy, i=i: (((x - cx) / rx, (y - oy - dy) / ry) if (((x - cx) / rx) ** 2 + ((y - oy - dy) / ry) ** 2 <= 1 and
                 not (y - oy - dy < -ry * 0.3 and math.sin((x - cx) * 1.3 + ph * 2 + i) > 0.55 - (oy + dy - y) / ry * 0.4)) else None), R, edge=(i == 0), lx=0.3, ly=0.8)
    for j in range(4):                                                              # tongues licking up off it
        x = 9 + j * 3.4 + math.sin(ph + j) * 0.8; top = 3 + (j % 2) * 2 + dy - (1 if a in (0, 1) else 0)
        for t in range(4): c.put(x + math.sin(ph * 2 + t + j) * 0.5, top + t, FLM[4 - min(3, t)])
    c.ell(14, 14 + dy, 2.6 + (0.6 if a in (0, 1) else 0), 2.6 + (0.6 if a in (0, 1) else 0), OBS, bias=0.1)   # its slag heart
    c.put(13, 13.6 + dy, EMB[4]); c.put(15.4, 13.6 + dy, EMB[4])                     # eyes in it
    c.line(12.6, 15.6 + dy, 15.6, 15.6 + dy, EMB[3])
    for i in range(3):                                                              # shards of rock wheeling about it
        an = ph * 0.7 + i * 2.1 + (a or 0) * 0.5; r = 10.5 + (1.5 if a == 2 else 0)
        x, y = 14 + math.cos(an) * r, 15 + dy + math.sin(an) * r * 0.45
        c.box(x - 1, y - 1, x + 1, y + 0.6, OBS)
        c.put(x, y - 0.4, EMB[2])
    if a == 1: c.glow(14, 14 + dy, 7, EMB[4], 0.5)
    if a == 2:
        for i in range(12): an = i * math.pi / 6; c.put(14 + math.cos(an) * 12, 14 + dy + math.sin(an) * 10, EMB[3 + i % 2])
    return c.p


KIN = [('cinder_archer', archer), ('infernal_hound', hound), ('solar_acolyte', acolyte), ('sun_cultist', cultist), ('lava_guard', guard),
       ('sunbound_knight', knight), ('cinder_elemental', elemental)]

if __name__ == '__main__':
    rows, sprites = [], {}
    y0 = 0; sheetW = 0; blocks = []
    for name, f in KIN:
        fr = [(f'{name}_m{k}', f(k)) for k in range(4)] + [(f'{name}_s{a}', f(0, a)) for a in range(4)] + [(f'{name}_h', f(0, None, True))]
        h, w = len(fr[0][1]), len(fr[0][1][0]); blocks.append((name, fr, w, h, y0)); y0 += h; sheetW = max(sheetW, w * len(fr))
    sheet = [[BLANK] * sheetW for _ in range(y0)]
    for name, fr, w, h, oy in blocks:
        frames = {}
        for n, (key, g) in enumerate(fr):
            for y in range(h):
                for x in range(w): sheet[oy + y][n * w + x] = g[y][x]
            frames[key] = [n * w, oy, w, h]
        sprites[name] = {'frames': frames, 'anims': {'move': {'frames': [f'{name}_m{k}' for k in range(4)], 'fps': 6, 'loop': True},
                                                     'shoot': {'frames': [f'{name}_s{a}' for a in range(4)], 'fps': 10, 'loop': False},
                                                     'attack': {'frames': [f'{name}_s2'], 'fps': 1, 'loop': False},
                                                     'hurt': {'frames': [f'{name}_h'], 'fps': 1, 'loop': False}}, 'meta': {}}
    write_png(os.path.join(out, 'castle_elite.png'), sheet)
    if len(sys.argv) > 1:
        S = 5; write_png(sys.argv[1], [[sheet[y // S][x // S] if sheet[y // S][x // S][3] else (40, 38, 50, 255) for x in range(sheetW * S)] for y in range(y0 * S)])
    json.dump({'rf': True, 'meta': {'name': "Sunthief's Castle's defenders, redrawn", 'version': 1}, 'sheets': {'castle_elite': {'image': 'castle_elite.png', 'kind': 'enemy', 'sprites': sprites}}},
              open(os.path.join(out, 'atlas_castle_elite.json'), 'w', encoding='utf8', newline='\n'), indent=1)
    ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
    if 'throne/atlas_castle_elite.json' not in idx['atlases']:
        idx['atlases'].append('throne/atlas_castle_elite.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
    print('castle_elite:', len(KIN), 'defenders')
