# The Drawbridge Technician (2026-11-02; redrawn the same day, the user: "make this guy look cool, not some block with a
# block head ... why does he have a giant black border. Stop that."): the castle engineer who keeps the drawbridge.
# 44x44 at native pixels, shaded by hand-set ramps lit from the upper left, and NO outline (his edges are each part's own
# darkest shade; src/registry.js leaves his sheet unrimmed). From the back forward:
#   his boiler rig: a copper tank across the shoulders, two smokestacks venting, a great brass gear turning at his right
#   a welding helm, its one round lens glowing amber; an iron cuirass with a pressure gauge; a leather apron, tool loops
#   his right arm a hydraulic piston ending in a huge brass wrench; his left hand a length of the drawbridge's chain
# Frames: idle (a breath, the gear turning, smoke); walk; attack in four (the wrench up, the boiler flaring, the wrench
# thrown down and a spray of gears off it, settling); a flinch; II's change (the boiler overloading, red, sparks);
# a death (the gear seizing, the boiler bursting, him to a knee, to ash).
#   'bx_drawbridge_technician/drawbridge_technician'  art/bundle/throne/technician.png + atlas_technician.json
import json, math, os, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(root, 'tools'))
from pixlib import write_png  # noqa: E402
out = os.path.join(root, 'art', 'bundle', 'throne')
W, H = 44, 44
BLANK = (0, 0, 0, 0)
# ramps, darkest (the edge) to brightest
IRON = [(38, 36, 48), (62, 60, 74), (96, 94, 110), (138, 136, 152), (186, 184, 198)]
COPPER = [(64, 30, 20), (110, 54, 30), (160, 88, 46), (206, 130, 70), (244, 186, 120)]
BRASS = [(78, 54, 22), (130, 96, 34), (184, 142, 52), (228, 192, 86), (255, 236, 160)]
LEATHER = [(44, 28, 20), (72, 46, 30), (102, 68, 44), (134, 94, 62), (160, 120, 84)]
EMBER = [(150, 50, 20), (230, 100, 30), (255, 160, 50), (255, 214, 96), (255, 248, 210)]
HOT = [(110, 30, 24), (180, 44, 30), (230, 80, 40), (255, 140, 70), (255, 210, 160)]
GAUGE = (232, 226, 206)


class C:
    def __init__(s): s.p = [[BLANK] * W for _ in range(H)]
    def put(s, x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < W and 0 <= y < H: s.p[y][x] = (*c[:3], 255)
    def shape(s, inside, R, lx=-0.55, ly=-0.75, edge=True, bias=0.0):
        """fill every pixel for which inside(x, y) returns a normal (nx, ny) or True; shade it from the ramp R"""
        pts = {}
        for y in range(H):
            for x in range(W):
                n = inside(x + 0.5, y + 0.5)
                if n: pts[(x, y)] = n
        for (x, y), n in pts.items():
            nx, ny = n if isinstance(n, tuple) else (0, 0)
            v = 0.55 + bias - 0.55 * (nx * lx + ny * ly) * -1
            v = 0.5 + bias + (-(nx * lx) - (ny * ly)) * -0.5
            v = max(0.0, min(0.999, 0.5 + bias + (nx * lx + ny * ly) * 0.55))
            i = 1 + int(v * (len(R) - 1))
            i = min(len(R) - 1, i)
            if edge and any((x + dx, y + dy) not in pts for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                i = 0 if (nx * lx + ny * ly) < 0.2 else 1     # (the rim: the part's own darkest, a shade lighter where lit)
            s.p[y][x] = (*R[i], 255)
        return pts

    def ell(s, cx, cy, rx, ry, R, **k):
        return s.shape(lambda x, y: ((x - cx) / rx, (y - cy) / ry) if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 else None, R, **k)

    def box(s, x0, y0, x1, y1, R, round_=False, **k):
        cx, cy, hx, hy = (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2
        def f(x, y):
            if not (x0 <= x <= x1 and y0 <= y <= y1): return None
            if round_ and abs(x - cx) > hx - 1 and abs(y - cy) > hy - 1: return None
            return ((x - cx) / max(hx, 0.5) * 0.8, (y - cy) / max(hy, 0.5) * 0.8)
        return s.shape(f, R, **k)

    def seg(s, x0, y0, x1, y1, r, R, **k):           # a thick bar, rounded ends, shaded as a cylinder
        dx, dy = x1 - x0, y1 - y0; L2 = dx * dx + dy * dy or 1
        def f(x, y):
            t = max(0, min(1, ((x - x0) * dx + (y - y0) * dy) / L2)); px, py = x0 + dx * t - x, y0 + dy * t - y
            d = math.hypot(px, py)
            return (-px / r, -py / r) if d <= r else None
        return s.shape(f, R, **k)

    def gear(s, cx, cy, r, teeth, rot, R, hub=None):
        def f(x, y):
            dx, dy = x - cx, y - cy; d = math.hypot(dx, dy); a = math.atan2(dy, dx)
            tooth = math.cos((a - rot) * teeth) > 0.2
            if d <= r - 1.2 or (d <= r + 0.3 and tooth): return (dx / r, dy / r)
            return None
        s.shape(f, R)
        s.ell(cx, cy, r * 0.42, r * 0.42, R[:3], edge=True, bias=-0.2)
        if hub: s.ell(cx, cy, 1.1, 1.1, hub, edge=False, bias=0.3)
        for k in range(4):                                 # spokes' holes
            a = rot + k * math.pi / 2 + math.pi / 4
            s.put(cx + math.cos(a) * r * 0.68, cy + math.sin(a) * r * 0.68, R[0])

    def glow(s, cx, cy, r, col, k):                        # a soft light, added over what's there
        for y in range(H):
            for x in range(W):
                d = math.hypot(x + 0.5 - cx, y + 0.5 - cy)
                if d < r:
                    a = (1 - d / r) ** 1.6 * k; c = s.p[y][x]
                    if c[3]: s.p[y][x] = (min(255, int(c[0] + (col[0] - c[0]) * a)), min(255, int(c[1] + (col[1] - c[1]) * a)), min(255, int(c[2] + (col[2] - c[2]) * a)), 255)


def tech(dy=0, legL=0, legR=0, arm=0.0, rot=0.0, heat=0.0, smoke=0, wrench_out=0, sparks=(), boiler=None, knee=0, chain_sw=0, ash=0, hurt=0):
    c = C(); B = boiler or COPPER
    by = 14 + dy                                           # his shoulders' line
    # --- the rig behind him: the gear (right), the smokestacks (left), the boiler tank across his shoulders
    c.gear(33.5, by - 3 + knee, 7.2, 8, rot, BRASS, hub=EMBER if heat > 0.3 else BRASS)
    for k, sx in enumerate((9.5, 13.5)):
        top = by - 11 - k * 2 + knee
        c.box(sx - 1.5, top, sx + 1.5, by - 2 + knee, IRON)
        c.box(sx - 2, top - 1, sx + 2, top + 1, IRON, bias=0.1)
        c.put(sx, top - 1, EMBER[2 if heat < 0.5 else 4]); c.put(sx - 1, top - 1, EMBER[1])
        for j in range(3):                                   # smoke, rising, drifting with the frame
            py = top - 3 - j * 3 - (smoke + k) % 3; px = sx + math.sin((smoke + j + k) * 1.3) * 1.2
            sh = [(86, 80, 92), (110, 104, 116), (70, 66, 78)][j % 3] if heat < 0.6 else [(150, 80, 50), (120, 70, 50), (90, 60, 50)][j % 3]
            if py >= 0: c.put(px, py, sh); c.put(px + 1, py, sh) if j < 2 else None
    c.ell(22, by + 1 + knee, 12, 5, B)                      # the boiler tank
    for x in (13, 17, 27, 31): c.put(x, by + knee - 1, B[4]); c.put(x, by + knee + 3, B[0])   # its rivets
    if heat > 0: c.glow(22, by + 2 + knee, 9, HOT[3], min(0.85, heat))
    # --- his long work coat, behind the legs
    c.shape(lambda x, y: ((x - 21) / 10, (y - by - 20 - knee) / 8) if (by + 10 + knee <= y <= by + 25 + knee and abs(x - 21) <= 7.5 + (y - by - 10 - knee) * 0.32) else None, LEATHER, bias=-0.25)
    # --- legs (iron greaves, heavy boots)
    for x0, lift in ((15.5, legL), (25.5, legR)):
        ky = 38 - lift + (0 if not knee else (2 if x0 < 20 else 0))
        c.box(x0 - 2, by + 15 + dy * 0 + knee, x0 + 2, ky, IRON, round_=True)
        c.box(x0 - 3.2, ky - 1, x0 + 3.2, ky + 3, IRON, round_=True, bias=-0.1)
        c.put(x0 - 2, ky, IRON[4])
    # --- the leather apron and the cuirass
    c.shape(lambda x, y: ((x - 21) / 8, (y - by - 18 - knee) / 6) if (by + 9 + knee <= y <= by + 21 + knee and abs(x - 21) <= 6 + (y - by - 9 - knee) * 0.25) else None, LEATHER)
    for tx in (17, 25): c.box(tx - 1, by + 14 + knee, tx + 1, by + 18 + knee, IRON, bias=0.1)     # tools at the apron's loops
    c.shape(lambda x, y: ((x - 21) / 10, (y - by - 5 - knee) / 8) if (by - 1 + knee <= y <= by + 11 + knee and abs(x - 21) <= 10 - max(0, y - by - 3 - knee) * 0.45) else None, IRON)   # the cuirass, broad at the chest
    fb = HOT if heat > 0.5 else EMBER                        # the firebox in his belly: its grate glowing
    c.box(17.5, by + 6 + knee, 24.5, by + 10 + knee, [IRON[0], IRON[0], IRON[1], IRON[1], IRON[2]], edge=True)
    for gy in (by + 7, by + 9):
        for gx in range(18, 24): c.put(gx, gy + knee, fb[2 + (1 if (gx + int(heat * 3)) % 3 == 0 else 0) + (1 if heat > 0.7 else 0)])
    c.glow(21, by + 8 + knee, 6, EMBER[3], 0.25 + heat * 0.4)
    c.box(13, by + 11 + knee, 29, by + 12 + knee, LEATHER, edge=False, bias=0.2)                  # his belt
    c.put(21, by + 11 + knee, BRASS[4]); c.put(20, by + 11 + knee, BRASS[3]); c.put(22, by + 12 + knee, BRASS[2])
    c.ell(16.5, by + 2.5 + knee, 2.1, 2.1, [BRASS[1], (200, 194, 176), GAUGE, GAUGE, (255, 255, 240)], edge=True)   # the pressure gauge
    na = -2.3 + heat * 2.6 + (0.3 if hurt else 0)
    c.put(16.5 + math.cos(na) * 1.2, by + 2.5 + knee + math.sin(na) * 1.2, (210, 40, 30)); c.put(16.5, by + 2.5 + knee, (90, 30, 30))
    for (x, y) in ((25, by + 1), (28, by + 4), (14, by + 5), (21, by + 1)): c.put(x, y + knee, IRON[4])
    # --- his left arm (our left): the chain hanging from the gauntlet
    c.ell(10.5, by + 2 + knee, 4.6, 3.8, IRON, bias=0.05)    # pauldron
    c.box(6.5, by + 4 + knee, 14.5, by + 5 + knee, BRASS, edge=False, bias=0.1)
    c.seg(10.5, by + 5 + knee, 9, by + 13 + knee, 1.9, LEATHER)
    c.ell(9, by + 14 + knee, 2.4, 2.2, IRON, bias=0.05)      # gauntlet
    for j in range(6):                                       # the chain's links swinging
        lx = 8.5 + math.sin(chain_sw * 0.9 + j * 0.5) * j * 0.35; ly = by + 16 + j * 2 + knee
        col = IRON[3] if j % 2 == 0 else IRON[1]
        c.put(lx, ly, col); c.put(lx + (1 if j % 2 else 0), ly + 1, IRON[0] if j % 2 else IRON[2])
    # --- the head: the welding helm, its lens
    hy = by - 4 + knee + (1 if hurt else 0)
    c.ell(21, hy, 5.6, 5.2, IRON, bias=0.05)
    c.box(15.5, hy + 2, 26.5, hy + 4, IRON, round_=True, bias=-0.15)          # its brim
    c.ell(21, hy + 0.5, 2.6, 2.4, [(90, 40, 10), EMBER[1], EMBER[2], EMBER[3], EMBER[4]], edge=True, lx=0.4, ly=0.6)
    c.glow(21, hy + 0.5, 5, EMBER[3], 0.35 + heat * 0.3)
    c.put(20, hy - 0.5, (255, 255, 240))
    c.box(20, hy - 7, 22, hy - 5, BRASS, bias=0.1)                           # the vent on the helm's crown
    for x in (17, 25): c.put(x, hy - 2, IRON[4])
    # --- his right arm: the pauldron, the piston, the wrench
    c.ell(31.5, by + 2 + knee, 5.2, 4.2, IRON, bias=0.05)
    c.box(27, by + 4.5 + knee, 36, by + 5.5 + knee, BRASS, edge=False, bias=0.1)
    for x in (29, 32, 35): c.put(x, by + knee, IRON[4])
    sa = -0.2 + arm                                         # the arm's angle off straight down (+ raises it outward and up)
    ex, ey = 32 + math.sin(sa) * 6, by + 5 + knee + math.cos(sa) * 6
    c.seg(31, by + 5 + knee, ex, ey, 2.2, IRON)                                # the upper arm, iron
    c.seg(31.2, by + 5.3 + knee, ex, ey, 0.9, BRASS, edge=False, bias=0.2)    # its brass piston rod
    wa = sa + 0.15 * wrench_out
    wx, wy = ex + math.sin(wa) * (9 + wrench_out), ey + math.cos(wa) * (9 + wrench_out)
    c.ell(ex, ey, 2.4, 2.4, BRASS)                                             # the elbow joint
    c.seg(ex, ey, wx, wy, 1.6, IRON, bias=0.05)                                # the wrench's shaft
    px, py = math.cos(wa), -math.sin(wa)                                      # across the shaft
    jx, jy = wx + math.sin(wa) * 1.5, wy + math.cos(wa) * 1.5
    def jaw(x, y):                                                             # the wrench's open jaw: a ring with a bite out of it
        dx, dy = x - jx, y - jy; d = math.hypot(dx, dy)
        along = dx * math.sin(wa) + dy * math.cos(wa); acr = dx * px + dy * py
        if d <= 4.2 and not (along > 0.2 and abs(acr) < 1.6): return (dx / 4.2, dy / 4.2)
        return None
    c.shape(jaw, BRASS)
    c.glow(jx, jy, 4, BRASS[4], 0.15)
    # --- sparks, heat
    for (x, y) in sparks: c.put(x, y, EMBER[4] if (int(x) + int(y)) % 2 else EMBER[3])
    if ash:
        ashc = (70, 64, 66)
        c.p = [[(BLANK if (q[3] and ash >= 2 and ((x * 73 + y * 151) % 97) / 97 < (ash - 1) * 0.18 + max(0, (26 - y) / 26) * (ash - 1) * 0.3) else ((((q[0] + ashc[0] * ash) // (ash + 1)), ((q[1] + ashc[1] * ash) // (ash + 1)), ((q[2] + ashc[2] * ash) // (ash + 1)), 255) if q[3] else q)) for x, q in enumerate(row)] for y, row in enumerate(c.p)]
    return c.p


TAU = math.pi * 2
def idle(k): return tech(dy=(1 if k in (1, 2) else 0), rot=k * TAU / 32, smoke=k, chain_sw=k)
def walk(k): return tech(dy=(-1 if k in (1, 3) else 0), legL=(2 if k == 0 else 0), legR=(2 if k == 2 else 0), rot=k * TAU / 24, smoke=k, chain_sw=k * 1.5, arm=0.1 * math.sin(k * TAU / 4))
def attack(k):
    if k == 0: return tech(arm=1.6, rot=0.1, heat=0.5, smoke=1, dy=-1, sparks=[(38, 4), (40, 7)])                       # the wrench up, the boiler flaring
    if k == 1: return tech(arm=2.4, rot=0.25, heat=0.8, smoke=2, dy=-1, wrench_out=1, sparks=[(39, 2), (41, 5), (36, 1)])
    if k == 2: return tech(arm=0.2, rot=0.4, heat=0.6, smoke=3, dy=1, wrench_out=2,                                       # thrown down: gears and sparks off it
                           sparks=[(36, 40), (40, 38), (33, 42), (41, 41), (38, 43), (30, 41)])
    return tech(arm=0.0, rot=0.5, heat=0.2, smoke=0, sparks=[(39, 37)])
def hurt(): return tech(dy=1, hurt=1, rot=0.05)
def enter(k):
    if k == 3: return tech(heat=0.6, rot=0.9, smoke=3)
    return tech(heat=0.6 + k * 0.2, rot=k * 0.5, smoke=k, boiler=HOT if k >= 1 else COPPER,
                sparks=[(22 + math.cos(i * 0.9 + k) * (13 + k), 15 + math.sin(i * 0.9 + k) * (9 + k)) for i in range(7 + k * 3)])
def death(k):
    if k == 0: return tech(heat=1.0, boiler=HOT, sparks=[(22 + math.cos(i) * 12, 15 + math.sin(i) * 8) for i in range(10)])
    return tech(knee=min(3, k + 1), heat=max(0, 0.8 - k * 0.3), ash=max(0, k - 1), dy=1)

if __name__ == '__main__':
    fr = [(f'i_{k}', idle(k)) for k in range(4)] + [(f'w_{k}', walk(k)) for k in range(4)] + [(f'a_{k}', attack(k)) for k in range(4)] + [('h', hurt())] + [(f'e_{k}', enter(k)) for k in range(4)] + [(f'd_{k}', death(k)) for k in range(5)]
    cols = 6; rows = (len(fr) + cols - 1) // cols
    sheet = [[BLANK] * (W * cols) for _ in range(H * rows)]; frames = {}
    for n, (key, g) in enumerate(fr):
        ox, oy = (n % cols) * W, (n // cols) * H
        for y in range(H):
            for x in range(W): sheet[oy + y][ox + x] = g[y][x]
        frames[key] = [ox, oy, W, H]
    write_png(os.path.join(out, 'technician.png'), sheet)
    if len(sys.argv) > 1:                                    # a preview, 6x
        S = 6; big = [[sheet[y // S][x // S] if sheet[y // S][x // S][3] else (24, 22, 30, 255) for x in range(W * cols * S)] for y in range(H * rows * S)]
        write_png(sys.argv[1], big)
    A = {}
    for a in (1, 2):
        A[f'idle{a}'] = {'frames': [f'i_{k}' for k in range(4)], 'fps': 5, 'loop': True}
        A[f'walk{a}'] = {'frames': [f'w_{k}' for k in range(4)], 'fps': 6, 'loop': True}
        A[f'attack{a}'] = {'frames': ['a_0', 'a_1', 'a_2', 'a_3'], 'fps': 7 if a == 1 else 9, 'loop': False}
        A[f'hurt{a}'] = {'frames': ['h'], 'fps': 5, 'loop': False}
    A['enter2'] = {'frames': [f'e_{k}' for k in range(4)], 'fps': 3.5, 'loop': False}
    A['death'] = {'frames': [f'd_{k}' for k in range(5)], 'fps': 2.2, 'loop': False}
    ph = {'1': {'name': 'The Engineer', 'idle': 'idle1', 'attack': 'attack1', 'walk': 'walk1', 'hurt': 'hurt1'}, '2': {'name': 'The Mechanism Unstable', 'idle': 'idle2', 'attack': 'attack2', 'walk': 'walk2', 'hurt': 'hurt2', 'enter': 'enter2'}}
    boss = {'image': 'technician.png', 'kind': 'boss', 'sprites': {'drawbridge_technician': {'frames': frames, 'anims': A, 'death': 'death', 'meta': {}, 'phases': ph}}}
    json.dump({'rf': True, 'meta': {'name': 'The Drawbridge Technician', 'version': 2}, 'sheets': {'bx_drawbridge_technician': boss}}, open(os.path.join(out, 'atlas_technician.json'), 'w', encoding='utf8', newline='\n'), indent=1)
    ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
    if 'throne/atlas_technician.json' not in idx['atlases']:
        idx['atlases'].append('throne/atlas_technician.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
    print('technician:', len(fr), 'frames')
