# The user's reference sheets (art/source/castle3/sheet_*.png: the castle's banners, trees, carpets and emblems, statues;
# 2026-11-02) taken apart into the game's own sprites: each object found on its own (the sheet's dark ground between them),
# brought down to its native pixels (each block of the sheet's art its most common colour, at the sheet's own pixel size),
# its outline one pixel of deep charcoal-purple. Written to art/source/castle3/obj/<sheet>_<n>.png with a numbered contact
# sheet, so each can be named (tools/build_castle_assets.py names them and builds the game's atlases).
#   py -I tools/sheet_extract.py <sheet> [cell]
import os, sys
from collections import Counter
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402
from reduce import read_png  # noqa: E402
from castle_import import outline  # noqa: E402
BLANK = (0, 0, 0, 0)
lum = lambda c: c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11


def objects(px, bg, step=2, gap=7):
    H, W = len(px), len(px[0]); gh, gw = H // step, W // step
    near = lambda c: abs(c[0] - bg[0]) + abs(c[1] - bg[1]) + abs(c[2] - bg[2]) < 34
    on = [[not near(px[y * step][x * step]) for x in range(gw)] for y in range(gh)]
    seen = [[False] * gw for _ in range(gh)]; boxes = []
    for y in range(gh):
        for x in range(gw):
            if on[y][x] and not seen[y][x]:
                st = [(x, y)]; seen[y][x] = True; x0 = x1 = x; y0 = y1 = y; n = 0
                while st:
                    a, b = st.pop(); n += 1; x0, x1, y0, y1 = min(x0, a), max(x1, a), min(y0, b), max(y1, b)
                    for X, Y in ((a + 1, b), (a - 1, b), (a, b + 1), (a, b - 1)):
                        if 0 <= X < gw and 0 <= Y < gh and on[Y][X] and not seen[Y][X]: seen[Y][X] = True; st.append((X, Y))
                boxes.append([x0, y0, x1, y1, n])
    g = gap // step; merged = True
    while merged:                                       # (a banner's chain, its tassels; a tree's embers: one object)
        merged = False
        for i in range(len(boxes)):
            for j in range(i + 1, len(boxes)):
                a, b = boxes[i], boxes[j]
                if a[0] - g <= b[2] and b[0] - g <= a[2] and a[1] - g <= b[3] and b[1] - g <= a[3]:
                    boxes[i] = [min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3]), a[4] + b[4]]; boxes.pop(j); merged = True; break
            if merged: break
    boxes = [b for b in boxes if b[4] > 60]
    boxes.sort(key=lambda b: (round((b[1] + b[3]) / 2 / (90 // step)), b[0]))   # (by rows, then left to right)
    return [(b[0] * step, b[1] * step, (b[2] + 1) * step, (b[3] + 1) * step) for b in boxes]


def cell_size(px, bg, box):                             # the sheet's own pixel: the commonest length of a run of one colour
    x0, y0, x1, y1 = box; runs = Counter()
    for y in range(y0, y1, 3):
        x = x0
        while x < x1:
            c = px[y][x]; s = x
            while x < x1 and abs(px[y][x][0] - c[0]) + abs(px[y][x][1] - c[1]) + abs(px[y][x][2] - c[2]) < 18: x += 1
            if 3 <= x - s <= 16: runs[x - s] += 1
            x = max(x, s + 1)
    return runs.most_common(1)[0][0] if runs else 6


def sample(px, bg, box, C):
    x0, y0, x1, y1 = box; tw, th = max(1, round((x1 - x0) / C)), max(1, round((y1 - y0) / C))
    near = lambda c: abs(c[0] - bg[0]) + abs(c[1] - bg[1]) + abs(c[2] - bg[2]) < 30
    g = [[BLANK] * tw for _ in range(th)]
    for j in range(th):
        for i in range(tw):
            cs = []; n = 0
            for yy in range(int(y0 + (j + 0.25) * C), int(y0 + (j + 0.75) * C) + 1):
                for xx in range(int(x0 + (i + 0.25) * C), int(x0 + (i + 0.75) * C) + 1):
                    if yy < len(px) and xx < len(px[0]): n += 1; c = px[yy][xx]; cs.append(c) if not near(c) else None
            if not n or len(cs) < n * 0.5: continue
            bins = Counter((c[0] // 20, c[1] // 20, c[2] // 20) for c in cs); k = bins.most_common(1)[0][0]
            sel = [c for c in cs if (c[0] // 20, c[1] // 20, c[2] // 20) == k]
            g[j][i] = (sum(c[0] for c in sel) // len(sel), sum(c[1] for c in sel) // len(sel), sum(c[2] for c in sel) // len(sel), 255)
    return g


if __name__ == '__main__':
    name = sys.argv[1]; px = read_png(os.path.join(root, 'art', 'source', 'castle3', name + '.png')); bg = px[3][3]
    boxes = objects(px, bg); od = os.path.join(root, 'art', 'source', 'castle3', 'obj'); os.makedirs(od, exist_ok=True)
    Cs = Counter(cell_size(px, bg, b) for b in boxes); C = float(sys.argv[2]) if len(sys.argv) > 2 else Cs.most_common(1)[0][0]
    print(name, len(boxes), 'objects; cell', C, Cs.most_common(4))
    tiles = []
    for k, b in enumerate(boxes):
        g = outline(sample(px, bg, b, C)); write_png(os.path.join(od, f'{name}_{k}.png'), g); tiles.append(g)
        print(k, b, len(g[0]), 'x', len(g))
    # a numbered contact sheet (each at 3x, its number in a corner as dots)
    S = 3; cols = 8; cw = max(len(t[0]) for t in tiles) * S + 6; ch = max(len(t) for t in tiles) * S + 10; rows = (len(tiles) + cols - 1) // cols
    sheet = [[(40, 36, 48, 255)] * (cw * cols) for _ in range(ch * rows)]
    for k, t in enumerate(tiles):
        ox, oy = (k % cols) * cw, (k // cols) * ch
        for y, r in enumerate(t):
            for x, c in enumerate(r):
                if c[3]:
                    for dy in range(S):
                        for dx in range(S): sheet[oy + 8 + y * S + dy][ox + 3 + x * S + dx] = c
        for d in range(k + 1): sheet[oy + 2][ox + 3 + d * 2 if d < 20 else ox + 3] = (255, 255, 255, 255)   # (its number: k+1 white dots)
    write_png(os.path.join(od, f'_{name}_contact.png'), sheet)
