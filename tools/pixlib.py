"""Tiny dependency-free pixel-art toolkit: char-grid sprites -> PNG.

A sprite/part is a list of equal-length strings. '.' is transparent; every
other char is a palette key. Frames are composed by stamping parts at offsets,
so every animation frame shares the same anatomy and pivot.
"""
import struct
import zlib


def hex_rgba(h):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)


def blank(w, h):
    return [['.'] * w for _ in range(h)]


def stamp(canvas, part, x, y, recolor=None):
    H, W = len(canvas), len(canvas[0])
    for j, row in enumerate(part):
        for i, ch in enumerate(row):
            if ch == '.':
                continue
            if recolor:
                ch = recolor.get(ch, ch)
            X, Y = x + i, y + j
            if 0 <= X < W and 0 <= Y < H:
                canvas[Y][X] = ch
    return canvas


def compose(layers, w=16, h=16):
    """layers: iterable of (part, x, y) or (part, x, y, recolor)."""
    c = blank(w, h)
    for layer in layers:
        stamp(c, *layer)
    return c


def flip(part):
    return [''.join(reversed(r)) if isinstance(r, str) else list(reversed(r)) for r in part]


def rows(grid):
    return [''.join(r) for r in grid]


def check(name, part):
    w = len(part[0])
    for i, r in enumerate(part):
        assert len(r) == w, f"{name} row {i} width {len(r)} != {w}: {r!r}"


def write_png(path, pixels):
    """pixels: list of rows of (r,g,b,a)."""
    h, w = len(pixels), len(pixels[0])
    raw = b''.join(b'\x00' + bytes(v for px in row for v in px) for row in pixels)

    def chunk(tag, data):
        c = struct.pack('>I', len(data)) + tag + data
        return c + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(raw, 9))
    png += chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(png)


def render(grid, pal, scale=1, bg=None, silhouette=None):
    """grid -> rgba rows. silhouette: rgba to paint every opaque pixel."""
    T = (0, 0, 0, 0) if bg is None else bg
    out = []
    for r in grid:
        line = []
        for ch in r:
            if ch == '.':
                px = T
            elif silhouette:
                px = silhouette
            else:
                px = pal[ch]
            line.extend([px] * scale)
        for _ in range(scale):
            out.append(list(line))
    return out


def line(canvas, x0, y0, x1, y1, ch):
    """Bresenham line, 1px, no anti-aliasing."""
    dx, dy = abs(x1 - x0), -abs(y1 - y0)
    sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
    err = dx + dy
    H, W = len(canvas), len(canvas[0])
    while True:
        if 0 <= x0 < W and 0 <= y0 < H:
            canvas[y0][x0] = ch
        if x0 == x1 and y0 == y1:
            return canvas
        e2 = 2 * err
        if e2 >= dy:
            err += dy; x0 += sx
        if e2 <= dx:
            err += dx; y0 += sy


def rect(canvas, x0, y0, x1, y1, ch):
    for y in range(max(0, y0), min(len(canvas), y1 + 1)):
        for x in range(max(0, x0), min(len(canvas[0]), x1 + 1)):
            canvas[y][x] = ch
    return canvas


def spans(canvas, rows, ch):
    """rows: [(y, x0, x1)] filled horizontal runs."""
    for y, x0, x1 in rows:
        rect(canvas, x0, y, x1, y, ch)
    return canvas


def outline(canvas, ch='o', skip='o'):
    """Add a 1px outline around every non-empty pixel (4-neighbour)."""
    H, W = len(canvas), len(canvas[0])
    add = []
    for y in range(H):
        for x in range(W):
            if canvas[y][x] != '.':
                continue
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < W and 0 <= ny < H and canvas[ny][nx] not in ('.', skip):
                    add.append((x, y))
                    break
    for x, y in add:
        canvas[y][x] = ch
    return canvas


def sheet(frames_grid, fw, fh, empty=None):
    """frames_grid: rows of frame-grids (None = empty cell) -> one big char grid."""
    cols = max(len(r) for r in frames_grid)
    big = blank(cols * fw, len(frames_grid) * fh)
    for ry, row in enumerate(frames_grid):
        for cx, fr in enumerate(row):
            if fr is None:
                continue
            for y in range(fh):
                for x in range(fw):
                    big[ry * fh + y][cx * fw + x] = fr[y][x]
    return big
