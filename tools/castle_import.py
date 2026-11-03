# A defender's picture (the user's art: art/source/castle2/<id>.png, big upscaled pixel art on a clear or black ground)
# brought to its own pixel size for hand animation: cut from its ground, each block of the picture its most common colour,
# its outline one pixel of deep charcoal-purple; then tools/castle_pix.py dump makes its hand-editable text file.
#   py -I tools/castle_import.py <id> <height in pixels>
import os, sys
from collections import Counter, deque
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402
from reduce import read_png  # noqa: E402
BLANK = (0, 0, 0, 0); EDGE = (30, 20, 38, 255); INK = (26, 18, 32, 255)
lum = lambda c: c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11


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


if __name__ == '__main__':
    id_, th = sys.argv[1], int(sys.argv[2]); src = os.path.join(root, 'art', 'source', 'castle2')
    os.makedirs(os.path.join(src, 'native'), exist_ok=True)
    write_png(os.path.join(src, 'native', id_ + '.png'), outline(shrink(cut(read_png(os.path.join(src, id_ + '.png'))), th)))
    print(id_, 'native written')
