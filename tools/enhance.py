"""Finishing pass for flat-filled sprites (RGBA rows in, RGBA rows out).

Flat palette fills read as blocky. This pass gives every creature volume and life
without touching its silhouette design:
  * rounded volume  - a distance field from the outline is treated as a height map;
                      surfaces facing the top-left light get warm highlights, the
                      far side gets cool, hue-shifted shadow (3 hard bands, no blur)
  * belly shadow    - the lower part of the body sinks into ambient occlusion
  * corner rounding - square outer outline corners are shaved off
  * glow bleed      - emissive pixels (eyes, embers, runes) tint what's around them
  * sel-out         - top-left outline pixels pick up a dark tint of their fill
  * grain           - large sprites get a sparse dithered texture on flat areas
All operations are per-pixel and quantised - no anti-aliasing, no new alpha.
"""

T = (0, 0, 0, 0)


def _lum(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def _sat(c):
    mx, mn = max(c[:3]), min(c[:3])
    return 0 if mx == 0 else (mx - mn) / mx


def _clamp(v):
    return max(0, min(255, int(round(v))))


def lighten(c, f):
    # warm, slightly desaturated highlight
    return (_clamp(c[0] + (255 - c[0]) * f * 1.05), _clamp(c[1] + (248 - c[1]) * f), _clamp(c[2] + (225 - c[2]) * f * 0.85), 255)


def darken(c, f):
    # cool, hue-shifted shadow (toward deep violet)
    return (_clamp(c[0] * (1 - f) + 22 * f), _clamp(c[1] * (1 - f * 1.08) + 12 * f), _clamp(c[2] * (1 - f * 0.7) + 40 * f), 255)


def mix(a, b, f):
    return (_clamp(a[0] + (b[0] - a[0]) * f), _clamp(a[1] + (b[1] - a[1]) * f), _clamp(a[2] + (b[2] - a[2]) * f), 255)


def saturate(c, f):
    l = _lum(c)
    return (_clamp(l + (c[0] - l) * f), _clamp(l + (c[1] - l) * f), _clamp(l + (c[2] - l) * f), 255)


def enhance(px, strength=1.0, grain=None, round_corners=True):
    H, W = len(px), len(px[0])
    out = [list(r) for r in px]
    op = [[px[y][x][3] > 0 for x in range(W)] for y in range(H)]
    if not any(any(r) for r in op):
        return out
    dark = [[op[y][x] and _lum(px[y][x]) < 46 for x in range(W)] for y in range(H)]

    def inb(x, y):
        return 0 <= x < W and 0 <= y < H

    # outer = transparent, plus dark pixels connected to transparency (the outline)
    outer = [[not op[y][x] for x in range(W)] for y in range(H)]
    stack = [(x, y) for y in range(H) for x in range(W) if outer[y][x]]
    while stack:
        x, y = stack.pop()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if inb(nx, ny) and not outer[ny][nx] and dark[ny][nx]:
                outer[ny][nx] = True
                stack.append((nx, ny))
    line = [[op[y][x] and outer[y][x] for x in range(W)] for y in range(H)]
    fill = [[op[y][x] and not outer[y][x] for x in range(W)] for y in range(H)]

    # emissive pixels: bright and saturated (eyes, embers, runes) - left unshaded
    nop = sum(r.count(True) for r in fill) or 1
    emis = [[fill[y][x] and _sat(px[y][x]) > 0.45 and max(px[y][x][:3]) > 215 and _lum(px[y][x]) > 120 for x in range(W)] for y in range(H)]
    glow_ok = sum(r.count(True) for r in emis) < nop * 0.14
    if not glow_ok:
        emis = [[False] * W for _ in range(H)]

    # distance from the outside, capped -> height map
    K = 2 if max(W, H) <= 16 else 3 if max(W, H) <= 32 else 4
    INF = 99
    dist = [[0 if not fill[y][x] else INF for x in range(W)] for y in range(H)]
    frontier = [(x, y) for y in range(H) for x in range(W) if dist[y][x] == 0]
    d = 0
    while frontier and d < K:
        d += 1
        nxt = []
        for x, y in frontier:
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if inb(nx, ny) and dist[ny][nx] == INF:
                    dist[ny][nx] = d
                    nxt.append((nx, ny))
        frontier = nxt
    h = [[min(dist[y][x], K) / K for x in range(W)] for y in range(H)]

    def hh(x, y):
        return h[y][x] if inb(x, y) else 0

    ys = [y for y in range(H) if any(fill[y])]
    y0, y1 = ys[0], ys[-1]
    span = max(1, y1 - y0)

    for y in range(H):
        for x in range(W):
            if not fill[y][x] or emis[y][x]:
                continue
            c = px[y][x]
            if _lum(c) < 46:          # interior dark detail (pupil, mouth): keep crisp
                continue
            c = saturate(c, 1.0 + 0.14 * strength)
            # gradient points toward the interior; facing the top-left light when it points down-right
            gx = hh(x + 1, y) - hh(x - 1, y)
            gy = hh(x, y + 1) - hh(x, y - 1)
            s = gx * 0.8 + gy * 1.0
            rim_top = not fill[y - 1][x] if y > 0 else True
            rim_bot = not fill[y + 1][x] if y < H - 1 else True
            if s > 0.34 or (rim_top and not rim_bot):
                c = lighten(c, (0.30 if rim_top else 0.17) * strength)
            elif s < -0.34 or rim_bot:
                c = darken(c, (0.30 if rim_bot else 0.18) * strength)
            # belly / ambient occlusion
            t = (y - y0) / span
            if t > 0.72:
                c = darken(c, 0.10 * strength)
            elif t < 0.22:
                c = lighten(c, 0.05 * strength)
            # grain on flat interiors of bigger sprites
            if grain and h[y][x] >= 1 and ((x * 7 + y * 13) ^ (x * y)) % grain == 0:
                c = darken(c, 0.12)
            out[y][x] = c

    # glow bleed from emissive pixels onto neighbours (8-neighbour)
    if glow_ok:
        for y in range(H):
            for x in range(W):
                if not emis[y][x]:
                    continue
                e = px[y][x]
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        nx, ny = x + dx, y + dy
                        if inb(nx, ny) and fill[ny][nx] and not emis[ny][nx] and _lum(px[ny][nx]) >= 46:
                            out[ny][nx] = mix(out[ny][nx], e, 0.32 if dx == 0 or dy == 0 else 0.18)
                # emissive core gets brighter
                out[y][x] = lighten(saturate(e, 1.1), 0.12)

    # sel-out: outline pixels touching a fill from below/right take a dark tint of it (top-left rim)
    for y in range(H):
        for x in range(W):
            if not line[y][x]:
                continue
            for nx, ny in ((x + 1, y), (x, y + 1)):
                if inb(nx, ny) and fill[ny][nx] and _lum(px[ny][nx]) >= 46:
                    f = px[ny][nx]
                    out[y][x] = mix(px[y][x], darken(f, 0.55), 0.38)
                    break

    # round off square outer corners of the outline
    if round_corners:
        def tr(x, y):
            return not inb(x, y) or not op[y][x]
        kill = []
        for y in range(H):
            for x in range(W):
                if not line[y][x]:
                    continue
                for (ax, ay), (bx, by) in (((-1, 0), (0, -1)), ((1, 0), (0, -1)), ((-1, 0), (0, 1)), ((1, 0), (0, 1))):
                    if tr(x + ax, y + ay) and tr(x + bx, y + by) and not tr(x - ax, y - ay) and not tr(x - bx, y - by) \
                            and line[y - ay][x - ax] and line[y - by][x - bx] \
                            and inb(x - ax - bx, y - ay - by) and fill[y - ay - by][x - ax - bx]:
                        kill.append((x, y))
                        break
        for x, y in kill:
            out[y][x] = T
    return out


def upscale(px, s, bg=None):
    out = []
    for r in px:
        line = []
        for c in r:
            line.extend([c if (bg is None or c[3]) else bg] * s)
        for _ in range(s):
            out.append(list(line))
    return out


def enhance_sheet(px, fw, fh, **kw):
    """Apply enhance() to every fw x fh cell of a rendered sheet independently."""
    H, W = len(px), len(px[0])
    out = [list(r) for r in px]
    for cy in range(0, H - fh + 1, fh):
        for cx in range(0, W - fw + 1, fw):
            cell = [px[cy + y][cx:cx + fw] for y in range(fh)]
            e = enhance(cell, **kw)
            for y in range(fh):
                out[cy + y][cx:cx + fw] = e[y]
    return out


# ---------------------------------------------------------------- generated in-between frames
def _bbox(px):
    ys = [y for y, r in enumerate(px) if any(c[3] for c in r)]
    return (ys[0], ys[-1]) if ys else (0, len(px) - 1)


def stretch(px):
    """rising frame: the body grows 1px taller (a middle row is doubled, the top moves up), feet stay planted"""
    y0, y1 = _bbox(px)
    out = [list(r) for r in px]
    if y0 == 0:
        return out
    cut = y0 + int((y1 - y0) * 0.55)
    for y in range(y0 - 1, cut):
        out[y] = list(px[y + 1])          # everything above the cut moves up a pixel
    out[cut] = list(px[cut])              # ...and the cut row is doubled
    return out


def squash(px):
    """landing frame: a middle row is dropped, the top settles down 1px and the body widens a touch"""
    y0, y1 = _bbox(px)
    cut = y0 + int((y1 - y0) * 0.55)
    out = [list(r) for r in px]
    for y in range(cut, y0, -1):
        out[y] = list(px[y - 1])
    out[y0] = [T] * len(px[0])
    # widen the lowest third by smearing its edge pixels outward
    for y in range(y0 + int((y1 - y0) * 0.66), y1 + 1):
        r = out[y]
        xs = [x for x, c in enumerate(r) if c[3]]
        if len(xs) >= 3:
            if xs[0] > 0:
                r[xs[0] - 1] = r[xs[0]]
            if xs[-1] < len(r) - 1:
                r[xs[-1] + 1] = r[xs[-1]]
    return out


def sway(px, top=0.55):
    """trees and reeds: the upper part leans 1px with the wind"""
    y0, y1 = _bbox(px)
    lim = y0 + int((y1 - y0) * top)
    out = [list(r) for r in px]
    for y in range(y0, lim):
        out[y] = [T] + list(px[y][:-1])
    return out


def pulse(px, k=0.45):
    """glow frame: emissive pixels flare toward white and bleed a little light onto their neighbours"""
    H, W = len(px), len(px[0])
    out = [list(r) for r in px]
    em = [[px[y][x][3] and _sat(px[y][x]) > 0.4 and max(px[y][x][:3]) > 190 for x in range(W)] for y in range(H)]
    for y in range(H):
        for x in range(W):
            if em[y][x]:
                out[y][x] = lighten(px[y][x], k)
            elif px[y][x][3] and _lum(px[y][x]) > 40 and any(0 <= x + dx < W and 0 <= y + dy < H and em[y + dy][x + dx]
                                                             for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                out[y][x] = lighten(px[y][x], k * 0.35)
    return out


def brighten(px, k=0.3):
    """projectile pulse: every lit pixel flares"""
    return [[lighten(c, k) if c[3] and _lum(c) > 70 else c for c in r] for r in px]
