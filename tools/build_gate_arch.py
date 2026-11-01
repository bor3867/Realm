# The Gatekeeper's gate (2026-11-01, the user's concept sheet: Ashkar chained before a stone arch hung with banners): the
# dressing of the Guardian's hall's north door, the way on to Solkhar. Two pillars of dressed stone, each with a fire-bowl
# on top and a banner of the island (red, a burning trident, a swallowtail hem trimmed in fire), and a great arch between
# them, its keystone carved with a glowing rune. While the gate's seals hold, the arch is filled with bars of molten iron
# (the fire pulsing in them); once the last seal breaks the bars are gone and the way stands open.
#   'throne_gate/arch': anims 'sealed' (the first: it loops by itself) and 'open' (game.breakSeal plays it)
#   art/bundle/throne/throne_gate.png + atlas_gate.json          py -I tools/build_gate_arch.py
import json, math, os, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
out = os.path.join(root, 'art', 'bundle', 'throne')
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402

PAL = {'o': '#0e0a12', 'd': '#1e1a24', 'i': '#34303c', 'I': '#4c4656', 'h': '#6c6478', 'H': '#928aa0', 'm': '#24202a',   # stone, mortar
       'r': '#3a1214', 'R': '#6a1e1e', 'Q': '#8e2a26', 'q': '#b03a2c',                                                 # the banners
       'l': '#c8381a', 'L': '#ff6a1c', 'y': '#ffa22c', 'Y': '#ffd660', 'w': '#fff4c4'}                                 # fire
LAVA = ['r', 'l', 'L', 'y', 'Y', 'w']
W, H = 104, 64
PL, PR = (4, 19), (84, 99)                 # the pillars' columns
TOP = 14                                   # where the pillars' shafts begin


def gate(f=0, sealed=True):
    g = [['.'] * W for _ in range(H)]
    def p(x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < W and 0 <= y < H: g[y][x] = c
    def hot(x, y, k):
        k = k + (1 if (x + y * 2 + f * 3) % 7 < 2 else 0) - (1 if (x * 3 + y + f * 5) % 11 == 0 else 0)
        p(x, y, LAVA[max(0, min(5, int(round(k))))])
    # ---- what fills the arch: bars of molten iron (sealed), or nothing (open)
    if sealed:
        for x in range(PL[1] + 1, PR[0]):
            for y in range(TOP + 6, H):
                cx = (PL[1] + PR[0]) / 2; r = math.hypot((x - cx) / 32, (y - 40) / 30)
                if y < 40 - math.sqrt(max(0, 1 - ((x - cx) / 32) ** 2)) * 28: continue
                bar = (x - PL[1] - 2) % 7
                if bar in (0, 1): hot(x, y, 3 + (1 if bar == 0 else 0) + (1 if y > 50 else 0))     # a bar
                else: p(x, y, 'r' if (y * 3 + x + f * 2) % 17 else 'l')                                     # the furnace's glow behind
    # ---- the arch: voussoirs of stone in a half-ring, a keystone with a rune
    cx, cy = (PL[1] + PR[0]) / 2, 40
    for y in range(0, 41):
        for x in range(PL[0], PR[1] + 1):
            dx, dy = (x - cx) / 47.5, (y - cy) / 36
            d = math.hypot(dx, dy)
            if 0.80 <= d <= 1.0 and y <= cy:
                a = math.atan2(-dy, dx); seam = (a * 14 / math.pi) % 1 < 0.12
                lit = 'H' if d > 0.97 else 'h' if d > 0.9 else 'I'
                p(x, y, 'm' if seam else lit)
    for y in range(1, 9):                                                                          # the keystone
        for x in range(int(cx) - 4, int(cx) + 5): p(x, y, 'h' if x < cx else 'I')
    for (x, y) in ((cx, 3), (cx - 1, 4), (cx + 1, 4), (cx, 5), (cx, 6)): hot(x, y, 4)               # its rune
    # ---- the pillars: dressed stone, a capital, a base
    for (x0, x1) in (PL, PR):
        for y in range(TOP, H):
            for x in range(x0, x1 + 1):
                row = (y - TOP) // 5; off = 4 if row % 2 else 0
                mortar = (y - TOP) % 5 == 4 or (x - x0 + off) % 8 == 7
                p(x, y, 'm' if mortar else ('h' if x < x0 + 3 else 'i' if x > x1 - 3 else 'I'))
        for x in range(x0 - 1, x1 + 2): p(x, TOP - 1, 'H'); p(x, TOP, 'h'); p(x, H - 2, 'h'); p(x, H - 1, 'i')   # capital, base
        # the fire-bowl on top
        bx = (x0 + x1) / 2
        for x in range(int(bx) - 5, int(bx) + 6): p(x, TOP - 2, 'I'); p(x, TOP - 3, 'i' if abs(x - bx) < 5 else '.')
        for k in range(14):                                                                          # its flames
            a = k / 14 * math.pi; fx = bx + math.cos(a) * 4.5; ht = 3 + ((k * 5 + f * 3) % 7) * (0.4 + 0.6 * math.sin(a))
            for j in range(int(ht)): hot(fx, TOP - 4 - j, 4 - j * 1.2 + (1 if k % 3 == f % 3 else 0))
        # the banner: a rod, red cloth, a burning trident, a swallowtail hem trimmed in fire
        b0, b1 = x0 + 2, x1 - 2
        for x in range(b0 - 1, b1 + 2): p(x, TOP + 3, 'h')
        for y in range(TOP + 4, TOP + 30):
            for x in range(b0, b1 + 1):
                mid = (b0 + b1) / 2; tail = y > TOP + 25 and abs(x - mid) < (y - TOP - 25) * 1.2
                if tail: continue
                p(x, y, 'R' if b0 < x < b1 else 'r')
                if x == b0 + 1 and y % 3 == 0: p(x, y, 'Q')
        mid = (b0 + b1) // 2
        for y in range(TOP + 9, TOP + 22): hot(mid, y, 3)                                            # the trident's shaft
        for x in range(mid - 3, mid + 4): hot(x, TOP + 12, 3)
        for x in (mid - 3, mid + 3):
            for y in range(TOP + 8, TOP + 12): hot(x, y, 3)
        hot(mid, TOP + 7, 4); hot(mid - 3, TOP + 7, 4); hot(mid + 3, TOP + 7, 4)
        for x in range(b0, b1 + 1):                                                                   # the hem, in fire
            y = TOP + 25 + abs(x - mid) / 1.2; hot(x, y + 0.5, 3)
    # the outline
    o = [row[:] for row in g]
    for y in range(H):
        for x in range(W):
            if g[y][x] == '.' and any(0 <= x + dx < W and 0 <= y + dy < H and g[y + dy][x + dx] not in '.o' for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))): o[y][x] = 'o'
    return [''.join(r) for r in o]


if __name__ == '__main__':
    frames = [(f's{k}', gate(k, True)) for k in range(4)] + [(f'o{k}', gate(k, False)) for k in range(4)]
    cols = 4; rows = 2
    px = [[(0, 0, 0, 0)] * (W * cols) for _ in range(H * rows)]; fr = {}
    for i, (key, grid) in enumerate(frames):
        ox, oy = (i % cols) * W, (i // cols) * H
        for y, row in enumerate(grid):
            for x, ch in enumerate(row):
                if ch in PAL: h = PAL[ch]; px[oy + y][ox + x] = (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), 255)
        fr[key] = [ox, oy, W, H]
    write_png(os.path.join(out, 'throne_gate.png'), px)
    sheets = {'throne_gate': {'image': 'throne_gate.png', 'kind': 'decor', 'sprites': {'arch': {'frames': fr, 'anims': {
        'sealed': {'frames': ['s0', 's1', 's2', 's3'], 'fps': 6, 'loop': True}, 'open': {'frames': ['o0', 'o1', 'o2', 'o3'], 'fps': 6, 'loop': True}}, 'meta': {}}}}}
    json.dump({'rf': True, 'meta': {'name': "The Gatekeeper's gate (the Throne of Solkhar)", 'version': 1}, 'sheets': sheets},
              open(os.path.join(out, 'atlas_gate.json'), 'w', encoding='utf8', newline='\n'), indent=1)
    ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
    if 'throne/atlas_gate.json' not in idx['atlases']:
        idx['atlases'].append('throne/atlas_gate.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
    S = 4; P = [[(40, 30, 30, 255)] * (W * 2 * S) for _ in range(H * S)]
    for gi, (key, grid) in enumerate((frames[0], frames[4])):
        for y, row in enumerate(grid):
            for x, ch in enumerate(row):
                if ch in PAL:
                    h = PAL[ch]; c = (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), 255)
                    for dy in range(S): P[y * S + dy][(gi * W + x) * S:(gi * W + x + 1) * S] = [c] * S
    write_png(os.path.join(root, 'art', '_proto', 'throne_gate_preview.png'), P)
    print('the gate:', len(frames), 'frames')
