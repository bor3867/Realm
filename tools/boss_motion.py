# Pixel-art motion for a boss drawn by the user (2026-11-02, the user: "bosses feel lifeless... walking, charging, attack,
# phase-change, hit and death animations; actual frames, not the sprite moved about"): the tools a boss's build uses to
# make its frames from its own art, a part at a time. A part (a mask over the sprite) is lifted out and set down again
# moved; what it leaves behind is filled from the body beside it (or left clear, if it was open air); a frame can be
# larger than the sprite (the headroom for a weapon raised).
#   pad(g, top, side)          the sprite on a bigger canvas: its feet where they were, room above and to the sides
#   shift(g, mask, dx, dy)     the masked part moved; its old place filled from its neighbours or cleared
#   arc(g, pts, cols)          a swing's trail: a few pale pixels along the way the weapon went
#   tint(g, mask, col, k)      the masked part towards a colour (a crack flaring, a core burning)
BLANK = (0, 0, 0, 0)


def copy(g): return [row[:] for row in g]


def pad(g, top, side):
    H, W = len(g), len(g[0])
    out = [[BLANK] * (W + 2 * side) for _ in range(H + top)]
    for y in range(H):
        for x in range(W): out[y + top][x + side] = g[y][x]
    return out


def shift(g, mask, dx, dy, fill=True, keep=False):
    """the pixels where mask(x, y, c) is true, moved by (dx, dy); their old place filled from what's beside it, or cleared
    (keep: their old place left as it was, the part stretched: a body rising a pixel over its own waist)"""
    H, W = len(g), len(g[0]); out = copy(g); moved = []
    for y in range(H):
        for x in range(W):
            c = g[y][x]
            if c[3] and mask(x, y, c): moved.append((x, y, c)); out[y][x] = c if keep else None
    for y in range(H):                                   # the holes: from the nearest pixel left of them that stayed, if the body goes on there
        for x in range(W):
            if out[y][x] is not None: continue
            src = None
            if fill:
                for d in (1, 2, 3):
                    for X in (x - d, x + d):
                        if 0 <= X < W and out[y][X] is not None and out[y][X][3]:
                            src = out[y][X]; break
                    if src: break
            out[y][x] = src or BLANK
    for x, y, c in moved:
        X, Y = x + dx, y + dy
        if 0 <= X < W and 0 <= Y < H: out[Y][X] = c
    return out


def arc(g, pts, cols):
    out = copy(g); H, W = len(g), len(g[0])
    for k, (x, y) in enumerate(pts):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < W and 0 <= y < H and not out[y][x][3]: out[y][x] = cols[k % len(cols)]
    return out


def tint(g, mask, col, k):
    out = copy(g)
    for y, row in enumerate(g):
        for x, c in enumerate(row):
            if c[3] and mask(x, y, c): out[y][x] = (int(c[0] + (col[0] - c[0]) * k), int(c[1] + (col[1] - c[1]) * k), int(c[2] + (col[2] - c[2]) * k), 255)
    return out
