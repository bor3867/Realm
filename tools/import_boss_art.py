# The user's boss art (2026-11-01: art/hollow_jarl_warrior.jpg, hollow_jarl_wizard.jpg, solkhar_the_sunthief.jpg; pixel
# art drawn large, its grid not quite even, saved as JPEG) brought down to native pixels for the game: each block of the
# picture becomes one pixel (the colour most of its middle holds, so the JPEG's smudges and the uneven grid don't
# matter), the colours that are only JPEG noise of one another merged, the dark ground round the figure cut away, and the
# figure cropped. Out: art/source/bosses/<name>.png, the sprite the boss builds animate (tools/build_jarl_warrior.py ...)
#   (a JPEG has to be a PNG first: Windows' System.Drawing does that, see the note at the bottom)
#   py -I tools/import_boss_art.py <png-dir>
import math, os, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
sys.path.insert(0, here)
from reduce import read_png  # noqa: E402
from pixlib import write_png  # noqa: E402

GRID = {'hollow_jarl_warrior': 64, 'hollow_jarl_wizard': 64, 'solkhar_the_sunthief': 60, 'ashkar_chained_forge_giant': 112}   # (Ashkar's: his own grid, ~11 px; drawn at half scale, one of his pixels to one of the screen's)   # (blocks across the whole picture: Solkhar's own grid is 10.35 px, ~121 across, so two of his pixels a block)
DESPECKLE = {'solkhar_the_sunthief'}   # (the pictures that get the speck pass)
out = os.path.join(root, 'art', 'source', 'bosses')
os.makedirs(out, exist_ok=True)


def dist(a, b): return math.sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))


def native(px, G):
    H, W = len(px), len(px[0]); s = W / G
    cells = [[None] * G for _ in range(G)]
    for cy in range(G):
        for cx in range(G):
            x0, x1, y0, y1 = int(cx * s + s * 0.25), int(cx * s + s * 0.75), int(cy * s + s * 0.25), int(cy * s + s * 0.75)
            votes = {}
            for y in range(y0, max(y0 + 1, y1)):
                for x in range(x0, max(x0 + 1, x1)):
                    r, g, b = px[y][x][:3]; k = (r >> 4, g >> 4, b >> 4)
                    v = votes.setdefault(k, [0, 0, 0, 0]); v[0] += 1; v[1] += r; v[2] += g; v[3] += b
            n, r, g, b = max(votes.values(), key=lambda v: v[0])
            cells[cy][cx] = (r / n, g / n, b / n)
    return cells


def tidy(cells, G, name=""):
    # the ground: the colour round the picture's edge; cut away every block like it that the edge can reach
    edge = [cells[y][x] for y in range(G) for x in range(G) if x in (0, G - 1) or y in (0, G - 1)]
    bg = tuple(sorted(c[i] for c in edge)[len(edge) // 2] for i in range(3))
    gone = [[False] * G for _ in range(G)]; q = [(x, y) for y in range(G) for x in range(G) if x in (0, G - 1) or y in (0, G - 1)]
    for x, y in q: gone[y][x] = dist(cells[y][x], bg) < 30
    q = [p for p in q if gone[p[1]][p[0]]]
    while q:
        x, y = q.pop()
        for X, Y in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= X < G and 0 <= Y < G and not gone[Y][X] and dist(cells[Y][X], bg) < 30: gone[Y][X] = True; q.append((X, Y))
    # the palette: colours within a JPEG's smudge of one another are one colour (the commoner wins)
    count = {}
    for y in range(G):
        for x in range(G):
            if not gone[y][x]: k = tuple(round(v) for v in cells[y][x]); count[k] = count.get(k, 0) + 1
    pal = []
    for c, n in sorted(count.items(), key=lambda kv: -kv[1]):
        if not any(dist(c, p) < 18 for p in pal): pal.append(c)
    snap = lambda c: min(pal, key=lambda p: dist(c, p))
    img = [[None if gone[y][x] else snap(cells[y][x]) for x in range(G)] for y in range(G)]
    # the dark lines between his parts are the ground's colour and joined to it, so they went with it: a gap with the
    # figure either side of it is a line, and goes back in (twice, for the two-pixel ones)
    ink = (16, 10, 22)
    for _ in range(2):
        add = [(x, y) for y in range(1, G - 1) for x in range(1, G - 1) if img[y][x] is None and
               ((img[y][x - 1] is not None and img[y][x + 1] is not None) or (img[y - 1][x] is not None and img[y + 1][x] is not None))]
        for x, y in add: img[y][x] = ink
    # a speck: a pixel like none of its four neighbours, where three of them agree, takes their colour (Solkhar's picture
    # is fine work, two of its pixels to each of ours, and the halving leaves a scatter of lone pixels)
    if name in DESPECKLE:
        for _ in range(2):
            out = [row[:] for row in img]
            for y in range(1, G - 1):
                for x in range(1, G - 1):
                    c = img[y][x]
                    if c is None: continue
                    nb = [img[y + dy][x + dx] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))]
                    if any(n is not None and dist(n, c) < 34 for n in nb): continue
                    nn = [n for n in nb if n is not None]
                    for n in nn:
                        if sum(1 for m in nn if dist(m, n) < 34) >= 3: out[y][x] = n; break
            img = out
    ys = [y for y in range(G) if any(img[y])]; xs = [x for x in range(G) if any(img[y][x] for y in range(G))]
    return [row[min(xs):max(xs) + 1] for row in img[min(ys):max(ys) + 1]], len(pal)


if __name__ == '__main__':
    src = sys.argv[1]
    for name, G in GRID.items():
        if sys.argv[2:] and name not in sys.argv[2:]: continue          # (py -I tools/import_boss_art.py <png-dir> [names...]: just those)
        px = read_png(os.path.join(src, name + '.png'))
        img, npal = tidy(native(px, G), G, name)
        rgba = [[(0, 0, 0, 0) if c is None else (int(c[0]), int(c[1]), int(c[2]), 255) for c in row] for row in img]
        write_png(os.path.join(out, name + '.png'), rgba)
        S = 8; P = [[(40, 30, 44, 255)] * (len(rgba[0]) * S) for _ in range(len(rgba) * S)]
        for y, row in enumerate(rgba):
            for x, c in enumerate(row):
                if c[3]:
                    for dy in range(S): P[y * S + dy][x * S:(x + 1) * S] = [c] * S
        write_png(os.path.join(root, 'art', '_proto', name + '_native.png'), P)
        print(name, f'{len(rgba[0])}x{len(rgba)}', npal, 'colours')
# (the JPEG to PNG step, in PowerShell:
#   Add-Type -AssemblyName System.Drawing; $b = [System.Drawing.Bitmap]::FromFile('art\hollow_jarl_warrior.jpg')
#   $b.Save('<dir>\hollow_jarl_warrior.png', [System.Drawing.Imaging.ImageFormat]::Png) )
