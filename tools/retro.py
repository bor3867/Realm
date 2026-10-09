"""The RotMG pass, applied to a finished sprite sheet in place: half the pixel density (each art pixel stored
doubled, so frame sizes and engine coordinates stay the same), no baked outline (the game draws a thin one),
vivid colours, and a 2-frame walk instead of the stretch/squash gait.

    from retro import retro_sheet
    retro_sheet('art/sprites/enemies/enemies_sheet.png', 16, 16, walk=(0, 1, 2, 3))

walk: the 4 columns of the move/idle cycle; columns 1 and 3 become copies of 0 and 2 (two poses, RotMG-style).
fixes: {(row, col): ["8 rows of 8 hex-or-dot", ...]} hand corrections, in art pixels (applied after reduction).
"""
import colorsys
import os

from pixlib import write_png
from reduce import read_png, strip_outline, collapse, double, score, T

PREVIEW_SCALE = 4


def vivid(c):
    """RotMG sprites are bright and saturated against muted ground: lift the darks, push the colour"""
    r, g, b = (v / 255 for v in c[:3])
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    v = 0.16 + v * 0.9 if v < 0.9 else v
    s = min(1, s * 1.25 + (0.05 if s > 0.15 else 0))
    r, g, b = colorsys.hsv_to_rgb(h, s, min(1, v))
    return (round(r * 255), round(g * 255), round(b * 255), 255)


def muted(c):
    """ground stays calm so the actors pop: a little less saturation, a little less contrast"""
    r, g, b = (v / 255 for v in c[:3])
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    r, g, b = colorsys.hsv_to_rgb(h, s * 0.85, 0.12 + v * 0.8)
    return (round(r * 255), round(g * 255), round(b * 255), c[3])


def retro_sheet(path, fw, fh, walk=(0, 1, 2, 3), fixes=None, grade=True, phase=None, strip=True):
    px = read_png(path)
    H, W = len(px), len(px[0])
    out = [[T] * W for _ in range(H)]
    for ry in range(0, H, fh):
        frames = [[r[cx:cx + fw] for r in px[ry:ry + fh]] for cx in range(0, W, fw)]
        stripped = [strip_outline(f) if strip else f for f in frames]
        best = phase or max(((ox, oy) for ox in (0, 1) for oy in (0, 1)),
                            key=lambda o: sum(sum(1 for r in collapse(f, *o) for c in r if c[3]) for f in stripped[:4]))
        small = [collapse(f, *best) for f in stripped]
        if walk and len(small) > max(walk):
            a, b2, c2, d = walk
            small[b2] = [r[:] for r in small[a]]
            small[d] = [r[:] for r in small[c2]]
        for k, sm in enumerate(small):
            if grade:
                f = muted if grade == 'mute' else vivid
                sm = [[f(c) if c[3] else c for c in r] for r in sm]
            fx = (fixes or {}).get((ry // fh, k))
            if fx:
                sm = [[(int(ch[0:2], 16), int(ch[2:4], 16), int(ch[4:6], 16), 255) if ch != '.' else T for ch in row] for row in fx]
            big = double(sm)
            for y in range(fh):
                for x in range(fw):
                    out[ry + y][k * fw + x] = big[y][x]
    write_png(path, out)
    return out


# ================================================================ RotMG shading
# The art is 8x8 forms stored doubled; shading happens at the doubled resolution, so every shape gets a
# one-pixel rim light on its top-left and a two-pixel shadow on its bottom-right, hue-shifted the RotMG way
# (shadows lean blue-violet, highlights lean warm), which gives depth without changing the chunky silhouette.
def _hsv(c):
    return colorsys.rgb_to_hsv(*(v / 255 for v in c[:3]))


def _rgb(h, s, v, a=255):
    r, g, b = colorsys.hsv_to_rgb(h % 1, max(0, min(1, s)), max(0, min(1, v)))
    return (round(r * 255), round(g * 255), round(b * 255), a)


def _toward(h, target, k):
    d = ((target - h + 0.5) % 1) - 0.5
    return h + d * k


def light(c):
    h, s, v = _hsv(c)
    return _rgb(_toward(h, 0.14, 0.15 if s > 0.1 else 0), s * 0.82, v * 1.16 + 0.06, c[3])


def shade(c, k=1.0):
    h, s, v = _hsv(c)
    return _rgb(_toward(h, 0.7, 0.18 * k if s > 0.1 else 0), s * (1 + 0.15 * k) + (0.08 * k if s < 0.1 else 0), v * (1 - 0.3 * k), c[3])


def shade_px(px, fw, fh):
    H, W = len(px), len(px[0])
    out = [r[:] for r in px]
    lum2 = lambda c: 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]
    for y in range(H):
        for x in range(W):
            c = px[y][x]
            if not c[3]:
                continue
            fx, fy = x - x % fw, y - y % fh
            at = lambda dx, dy: px[y + dy][x + dx] if fx <= x + dx < fx + fw and fy <= y + dy < fy + fh else T
            empty = lambda dx, dy: not at(dx, dy)[3]
            darker = lambda dx, dy: at(dx, dy)[3] and lum2(at(dx, dy)) < lum2(c) - 60
            if empty(0, -1) or empty(-1, 0):
                out[y][x] = light(c)
            elif empty(0, 1) or empty(1, 0):
                out[y][x] = shade(c)
            elif empty(0, 2) or empty(2, 0) or empty(1, 1):
                out[y][x] = shade(c, 0.55)
            elif darker(0, 1) or darker(1, 0):
                out[y][x] = shade(c, 0.5)
    return out


def shade_sheet(path, fw, fh):
    write_png(path, shade_px(read_png(path), fw, fh))
