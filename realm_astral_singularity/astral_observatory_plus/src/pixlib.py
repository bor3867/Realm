"""Shared pixel helpers for the Realm expansion pack."""
from PIL import Image, ImageDraw

OUTLINE = (12, 8, 16, 255)


def hex2rgba(h):
    h = h.lstrip("#")
    a = int(h[6:8], 16) if len(h) == 8 else 255
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def render(grid, pal, name="?"):
    w = len(grid[0])
    for r in grid:
        assert len(r) == w, f"{name}: ragged row {r!r} ({len(r)} vs {w})"
    img = Image.new("RGBA", (w, len(grid)), (0, 0, 0, 0))
    px = img.load()
    for y, row in enumerate(grid):
        for x, ch in enumerate(row):
            if ch == ".":
                continue
            assert ch in pal, f"{name}: unknown color key {ch!r}"
            px[x, y] = hex2rgba(pal[ch])
    return img


def outlined(img, scale=5):
    big = img.resize((img.width * scale, img.height * scale), Image.NEAREST)
    W, H = big.width + 2, big.height + 2
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    out.paste(big, (1, 1))
    a = out.getchannel("A").load()
    o = out.load()
    edge = []
    for y in range(H):
        for x in range(W):
            if a[x, y] > 100:
                continue
            hit = False
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < W and 0 <= ny < H and a[nx, ny] > 100:
                        hit = True
            if hit:
                edge.append((x, y))
    for x, y in edge:
        o[x, y] = OUTLINE
    return out


def flat(img, scale=5):
    return img.resize((img.width * scale, img.height * scale), Image.NEAREST)


def shine_frames(img, n=4, strength=0.55):
    frames = [img.copy()]
    w, h = img.size
    span = w + h
    for i in range(1, n):
        t = int(span * i / n) - 2
        f = img.copy()
        px = f.load()
        for y in range(h):
            for x in range(w):
                r, g, b, a = px[x, y]
                d = x + (h - 1 - y)
                if a and d in (t, t + 1):
                    k = strength if d == t else strength * 0.5
                    px[x, y] = (int(r + (255 - r) * k), int(g + (255 - g) * k), int(b + (255 - b) * k), a)
        frames.append(f)
    return frames


def hurt_frame(img):
    f = img.copy()
    px = f.load()
    for y in range(f.height):
        for x in range(f.width):
            r, g, b, a = px[x, y]
            if a:
                k = 0.72
                px[x, y] = (int(r + (255 - r) * k), int(g + (235 - g) * k), int(b + (235 - b) * k), a)
    return f


def recolor(grid, mapping):
    return ["".join(mapping.get(c, c) for c in row) for row in grid]


def edit(grid, edits):
    g = list(grid)
    for r, row in edits.items():
        g[r] = row
    return g


def shift(grid, dx=0, dy=0):
    h, w = len(grid), len(grid[0])
    out = [["."] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w:
                out[ny][nx] = grid[y][x]
    return ["".join(r) for r in out]


def flipx(grid):
    return [r[::-1] for r in grid]


def review(path, groups, scale=6, bg=(64, 58, 78, 255), tiles=False):
    """groups: list of (label, [Image,...]). Renders rows with labels for visual QA."""
    rows = []
    for label, frames in groups:
        ims = [flat(f, scale) if tiles else outlined(f, scale) for f in frames]
        rows.append((label, ims))
    W = max(10 + sum(i.width + 8 for i in ims) for _, ims in rows) + 120
    H = sum(max(i.height for i in ims) + 22 for _, ims in rows) + 10
    sheet = Image.new("RGBA", (W, H), bg)
    d = ImageDraw.Draw(sheet)
    y = 6
    for label, ims in rows:
        d.text((8, y), label, fill=(230, 225, 240, 255))
        x = 8
        y += 14
        for i in ims:
            sheet.alpha_composite(i, (x, y))
            x += i.width + 8
        y += max(i.height for i in ims) + 8
    sheet.convert("RGB").save(path)
