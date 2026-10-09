"""Every shot in the game, redrawn the way Realm of the Mad God draws them: an 8x8 picture,
doubled to 16px and outlined at 1px like the characters. A few strong tones and a white-hot core,
a shape you can name at a glance (arrow, bolt, slash, flame, note, rune...), and long shots drawn
on the diagonal so they get the full length of the cell. The engine turns the directional ones
to their flight (they point up-right in the sheet) and spins the spinners.

Each shot keeps the colours it had (sampled from tools/projectiles.py); only its drawing changes.
"""
import colorsys
import math

N = 8
R2 = math.sqrt(2)


# ---------------------------------------------------------------- colour
def _rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def _hex(c):
    return '#%02X%02X%02X' % tuple(max(0, min(255, round(v * 255))) for v in c)


def _hls(c):
    return colorsys.rgb_to_hls(*c)


def _from_hls(h, l, s):
    return colorsys.hls_to_rgb(h % 1, max(0, min(1, l)), max(0, min(1, s)))


def ramp_from(pal, grid):
    """The shot's own colours, as RotMG ramps them: outline, dark, mid, light, core, + an accent."""
    count = {}
    for row in grid:
        for ch in row:
            if ch != '.' and ch in pal:
                count[pal[ch]] = count.get(pal[ch], 0) + 1
    cols = []
    for hx, n in count.items():
        c = _rgb(hx)
        h, l, s = _hls(c)
        cols.append((hx, n, h, l, s))
    body = [c for c in cols if 0.16 < c[3] < 0.93] or cols
    main = max(body, key=lambda c: c[1] * (0.25 + c[4]) * (0.4 + min(c[3], 1 - c[3])))
    h, l, s = main[2], main[3], main[4]
    l = min(max(l, 0.42), 0.62)                    # the mid tone sits in the middle, saturated
    s = s if s < 0.12 else max(s, 0.68)
    mid = _from_hls(h, l, s)
    dark = _from_hls(h + 0.01, l * 0.58, s * 0.95)
    light = _from_hls(h - 0.01, l + (1 - l) * 0.5, s)
    core = _from_hls(h, 0.94, s * 0.6)
    outline = _from_hls(h, 0.09 if s > 0.12 else 0.07, s * 0.55)
    acc = [c for c in cols if c[4] > 0.3 and 0.2 < c[3] < 0.9 and min(abs(c[2] - h), 1 - abs(c[2] - h)) > 0.11]
    if acc:
        a = max(acc, key=lambda c: c[1])
        ah, al, as_ = a[2], min(max(a[3], 0.45), 0.66), max(a[4], 0.6)
        accent, accent2 = _from_hls(ah, al, as_), _from_hls(ah, al + (1 - al) * 0.5, as_)
    else:
        accent, accent2 = light, core
    return {'o': _hex(outline), '1': _hex(dark), '2': _hex(mid), '3': _hex(light), '4': _hex(core),
            'a': _hex(accent), 'b': _hex(accent2), 'W': '#FFFFFF', 'K': _hex(outline)}


def tier_ramp(ramp4):
    """the tier ramps of weapons: (dark, mid, light, glow) -> our ramp"""
    a, b, c, d = (_rgb(x) for x in ramp4)
    h, l, s = _hls(b)
    return {'o': _hex(_from_hls(h, 0.08, s * 0.5)), '1': _hex(a), '2': _hex(b), '3': _hex(c),
            '4': _hex(_from_hls(_hls(c)[0], 0.93, s * 0.5)), 'a': _hex(d), 'b': _hex(_from_hls(_hls(d)[0], 0.85, 0.8)),
            'W': '#FFFFFF', 'K': _hex(_from_hls(h, 0.08, s * 0.5))}


# ---------------------------------------------------------------- drawing
def blank():
    return [['.'] * N for _ in range(N)]


def field(fn, f):
    """paint a shape given in the shot's own frame: u runs tail->tip (up-right), v across it"""
    g = blank()
    for y in range(N):
        for x in range(N):
            dx, dy = x - 3.5, y - 3.5
            u, v = (dx - dy) / R2, (dx + dy) / R2
            ch = fn(u, v, f)
            if ch:
                g[y][x] = ch
    return g


def radial(fn, f):
    g = blank()
    for y in range(N):
        for x in range(N):
            dx, dy = x - 3.5, y - 3.5
            ch = fn(math.hypot(dx, dy), math.atan2(dy, dx), dx, dy, f)
            if ch:
                g[y][x] = ch
    return g


def hand(rows):
    return [list(r) for r in rows]


# directional shapes (point up-right) ---------------------------------
def bolt(u, v, f):                       # STAFF: a teardrop of magic, white-hot at the head, a tapering tail
    u0, R = 1.9, 1.75
    w = math.sqrt(max(0, R * R - (u - u0) ** 2)) if u >= u0 else R * max(0, (u + 4.4) / (u0 + 4.4)) ** 1.3
    if abs(v) > w or u > u0 + R:
        return None
    k = abs(v) / max(w, 0.01)
    if u > 0.9 and abs(v) < 0.75:
        return '4'
    if u < -2.2:
        return '1' if (f and k > 0.3) else '2'
    return '3' if k < 0.6 else '2'


def comet(u, v, f):                      # FIRE: a round blazing head and a licking flame behind
    u0, R = 1.6, 2.1
    if u >= u0 - 0.4:
        d = math.hypot(u - u0, v)
        if d > R:
            return None
        return '4' if d < 0.85 else '3' if d < 1.5 else '2'
    w = R * max(0, (u + 4.6) / (u0 + 4.6)) ** 1.1
    wig = 0.45 * math.sin(u * 2.4 + (f * 2.2))
    if abs(v - wig) > w:
        return None
    return '3' if abs(v - wig) < w * 0.35 and u > -1.3 else '2' if u > -2.6 else '1'


def spark(u, v, f):                      # WAND: a long thin streak with a four-point sparkle on its tip
    if abs(v) < 0.75 and -4.2 < u < 3.6:
        return '4' if abs(v) < 0.4 and u > 0 else '3' if u > -2 else '2'
    tip = 2.9
    if abs(u - tip) < 0.75 and abs(v) < 2.1 + 0.6 * f:
        return '4' if abs(v) < 1.1 else '3'
    return None


def slash(u, v, f):                      # SWORD: a crescent of steel, swept across the line of flight
    d = math.hypot(u + 1.6, v)
    d2 = math.hypot(u + 2.9, v)
    if d < 4.3 and d2 > 3.9 and u > -1.2:
        return '4' if d > 3.55 and abs(v) < 2.4 else '3' if abs(v) < 2.9 else '2'
    return None


def dagger(u, v, f):                     # DAGGER: blade, crossguard, grip
    if -0.3 <= u <= 4.0 and abs(v) <= 0.75 * (1 - max(0, u - 2.4) / 1.8) + 0.05:
        return '4' if v < 0 or u > 2.8 else '3'
    if -1.25 <= u < -0.3 and abs(v) < 2.0:
        return 'a'
    if -3.6 <= u < -1.25 and abs(v) < 0.6:
        return '1' if int(u * 1.5) % 2 else '2'
    return None


def needle(u, v, f):                     # NEEDLE: a long glinting splinter, brightest at the point
    if -4.4 < u < 4.3 and abs(v) < 0.68 - max(0, u - 2.6) * 0.3:
        return '4' if u > 1.8 else '3' if u > -1.5 else '2'
    return None


def rapier(u, v, f):                     # a needle with a little cup-guard
    if -1.3 < u < -0.4 and abs(v) < 1.5:
        return 'a'
    if -3.6 < u < -1.3 and abs(v) < 0.5:
        return '1'
    return needle(u, v, f) if u >= -0.4 else None


def lance(u, v, f):                      # BEAM: a thick rod of light with a white core
    if -4.5 < u < 4.2 and abs(v) < 1.35:
        if abs(v) < 0.6:
            return '4'
        return '3' if (u > -2.5 or f) else '2'
    return None


def ray(u, v, f):                        # RAY: a beam with a flare at its head
    if abs(u - 2.4) < 1.0 and abs(v) < 2.0:
        return '4' if abs(v) < 0.9 else '3'
    if -4.5 < u < 3 and abs(v) < 1.05:
        return '4' if abs(v) < 0.4 else '3' if u > -2 else '2'
    return None


def shard(u, v, f):                      # CRYSTAL: a faceted shard, one face lit, one in shadow
    w = 1.65 * (1 - abs(u - 0.2) / 4.2)
    if abs(v) > w:
        return None
    if abs(v) < 0.4 and u > -1:
        return '4'
    return '3' if v < 0 else '1' if u < -1.5 else '2'


def blade(u, v, f):                      # a thrown BLADE: long and bright, a hilt of accent
    if -3.2 < u < 4.2 and abs(v) < 1.0 * (1 - max(0, u - 2.2) / 2.2) + 0.05 and u > -1.5:
        return '4' if v < -0.1 else '3'
    if -2.3 < u <= -1.5 and abs(v) < 1.9:
        return 'a'
    if -4 < u <= -2.3 and abs(v) < 0.6:
        return 'b'
    return None


def arrow(u, v, f):                      # BOW: arrowhead, shaft, fletching
    if u > 1.6 and abs(v) <= (4.3 - u) * 0.8:
        return '4' if abs(v) < 0.5 else '3'
    if -2.6 < u <= 1.6 and abs(v) < 0.5:
        return '2'
    if -4.6 < u <= -2.6 and abs(v) < 1.7 and abs(v) > 0.3 - 0.0:
        return 'a' if (int(-u * 1.4) + (v > 0)) % 2 else 'b'
    if -4.6 < u <= -2.6 and abs(v) <= 0.3:
        return '2'
    return None


def harpoon(u, v, f):                    # a barbed head on a long haft
    if u > 2.0 and abs(v) <= (4.3 - u) * 0.85:
        return '4' if abs(v) < 0.5 else '3'
    if 0.9 < u <= 2.0 and 0.5 < abs(v) < 1.6 and abs(v) > (2.0 - u) * 1.2:
        return '3'                                        # the barbs
    if -4.6 < u <= 2.0 and abs(v) < 0.55:
        return 'a' if u < -2.8 else '2'
    return None


def feather(u, v, f):                    # a quill: a white rachis, a vane with notches
    if -4.4 < u < 4.0 and abs(v) < 0.4:
        return '4'
    w = 1.6 * math.sin(max(0, min(math.pi, (u + 3.6) / 7.2 * math.pi)))
    if 0 < v < w and int((u + 5) * 1.3) % 3 != 0:
        return '3' if v < w * 0.5 else '2'
    if -w * 0.7 < v < 0:
        return '2' if u > -1 else '1'
    return None


def thorn(u, v, f):                      # a thorn / seed: fat at the back, hooked to a point
    w = 1.7 * ((4.0 - u) / 7.5) ** 0.7 if u < 4.0 else 0
    if u < -3.4 or abs(v + 0.25 * (u > 1)) > w:
        return None
    return '3' if v < -0.2 and u > -1.5 else '4' if u > 2.6 else '2' if u > -2.4 else '1'


def lightning(u, v, f):                  # a zig-zag of lightning, re-forked every frame
    zz = 1.05 * (1 if int((u + 5) / 1.6 + f) % 2 else -1) * (((u + 5) % 1.6) / 1.6 - 0.5) * 2
    if -4.6 < u < 4.4 and abs(v - zz) < 0.62:
        return '4' if abs(v - zz) < 0.32 else '3'
    if abs(v - zz) < 1.05 and -4 < u < 4:
        return '2'
    return None


def wave(u, v, f):                       # a crest of water or sound, broad across the line of flight
    d = math.hypot(u + 1.0, v)
    if 2.2 < d < 3.6 and u > -0.6:
        k = (d - 2.2) / 1.4
        return '4' if k > 0.68 and abs(v) < 2.6 else '3' if k > 0.34 else '2'
    if f and 1.6 < d <= 2.2 and u > 0.2 and abs(v) < 1.4:
        return '1'
    return None


def claw(u, v, f):                       # three raking claw-marks
    for off in (-1.7, 0, 1.7):
        if abs(v - off) < 0.55 and -3.3 + abs(off) * 0.45 < u < 3.6 - abs(off) * 0.6:
            return '4' if u > 1 else '3' if u > -1.2 else '2'
    return None


def chevron(u, v, f):                    # a punch: two shock-chevrons
    for c in (1.9, -0.5 - 0.3 * f):
        if abs(u - (c - abs(v) * 0.75)) < 0.62 and abs(v) < 2.9:
            return '4' if c > 1 and abs(v) < 1.6 else '3' if c > 1 else '2'
    return None


def ingot(u, v, f):                      # a glowing billet
    if -3.4 < u < 3.4 and abs(v) < 1.25:
        return '4' if abs(v) < 0.5 and u > -1 else '3' if v < 0 else '2'
    return None


def wisp(u, v, f):                       # a ghost-flame: round head, a tail that swims
    u0, R = 2.0, 1.75
    d = math.hypot(u - u0, v)
    if d < R:
        return '4' if d < 0.75 else '3'
    if -4.5 < u < u0:
        c = 0.85 * math.sin(u * 1.5 + f * math.pi)
        w = R * (u + 4.5) / (u0 + 4.5)
        if abs(v - c) < w:
            return '3' if abs(v - c) < w * 0.4 and u > -1 else '2' if u > -2.8 else '1'
    return None


# round shapes (drawn upright; some spin) -----------------------------
def orb(r, ang, dx, dy, f):              # ENERGY: a ball with a bright core and a glint
    if r > 3.3:
        return None
    if math.hypot(dx + 1.0, dy + 1.0) < 0.75:
        return 'W'
    return '4' if r < 1.2 else '3' if r < 2.2 else '2'


def bigorb(r, ang, dx, dy, f):
    if r > 3.9:
        return None
    if math.hypot(dx + 1.3, dy + 1.3) < 0.8:
        return 'W'
    return '4' if r < 1.3 else '3' if r < 2.4 else '2' if r < 3.3 else '1'


def bubble(r, ang, dx, dy, f):
    if 2.4 < r < 3.5:
        return '3' if dy < 0 else '2'
    if math.hypot(dx + 1.0, dy + 1.0) < 0.75 or (f and math.hypot(dx - 1.1, dy - 1.0) < 0.6):
        return 'W'
    return None


def star(r, ang, dx, dy, f):             # a five-pointed star
    k = 5
    a = (ang + math.pi / 2) % (2 * math.pi / k) - math.pi / k
    edge = 1.55 + 2.35 * (1 - abs(a) / (math.pi / k)) ** 2.2
    if r > edge:
        return None
    return '4' if r < 1.3 else '3' if r < 2.2 else '2'


def star4(r, ang, dx, dy, f):            # a four-point twinkle
    ax, ay = abs(dx), abs(dy)
    if (ax < 0.6 and ay < 3.8) or (ay < 0.6 and ax < 3.8) or (ax + ay < 2.1):
        return '4' if ax + ay < 1.3 else '3' if ax + ay < 2.6 else '2'
    if f and abs(ax - ay) < 0.4 and ax < 2.2:
        return '2'
    return None


def shuriken(r, ang, dx, dy, f):
    a = (ang * 4) % (2 * math.pi)
    if r < 1.0:
        return 'o'
    if r < 3.9 and (a < 1.25 * (1 - r / 4.3) + 0.35):
        return '4' if r < 2.2 else '3'
    if r < 1.9:
        return '2'
    return None


def ring(r, ang, dx, dy, f):             # a halo
    if 2.5 < r < 3.7:
        return '4' if (int((ang + math.pi) / (math.pi / 4)) + f) % 4 == 0 else '3' if dy < 0.5 else '2'
    if r < 1.0 and f:
        return 'b'
    return None


def snowflake(r, ang, dx, dy, f):
    a = ang % (math.pi / 3)
    if r < 3.9 and (min(a, math.pi / 3 - a) * r < 0.5):
        return '4' if r < 1.6 else '3'
    if r < 1.2:
        return '4'
    return None


def cog(r, ang, dx, dy, f):
    teeth = (ang * 8 / (2 * math.pi)) % 1 < 0.5
    if r < 1.0:
        return None
    if r < 2.8 or (teeth and r < 3.8):
        return '3' if dy < 0 else '2'
    return None


def glob(r, ang, dx, dy, f):             # a wet glob with a drip and a shine
    R = 3.0 + 0.5 * math.sin(ang * 3 + f * 1.3)
    if dy > 1 and abs(dx + 0.6) < 0.7 and dy < 3.9:
        return '2'
    if r > R:
        return None
    if math.hypot(dx + 1.0, dy + 1.1) < 0.8:
        return 'W'
    return '3' if dy < -0.3 else '2' if r < 2.4 else '1'


def rock(r, ang, dx, dy, f):             # a lumpy stone or hailstone
    R = 3.4 - 0.7 * ((int((ang + 3.2) * 1.6) * 37) % 5) / 4
    if r > R:
        return None
    return '4' if dx + dy < -2.5 else '3' if dx + dy < 0 else '2' if dx + dy < 2.3 else '1'


def cloud(r, ang, dx, dy, f):            # a puff of smoke: three overlapping rounds
    for cx, cy, rr in ((-1.2, 0.6, 1.9), (1.3, 0.7, 1.8), (0.1 + 0.3 * f, -0.9, 2.1)):
        d = math.hypot(dx - cx, dy - cy)
        if d < rr:
            return '4' if d < rr * 0.4 and cy < 0 else '3' if dy < 0.3 else '2'
    return None


def drop(r, ang, dx, dy, f):             # a falling drop: round below, pinched to a point above
    if dy >= 0.4:
        d = math.hypot(dx, dy - 0.9)
        if d > 2.6:
            return None
    else:
        if abs(dx) > (dy + 3.8) * 0.62:
            return None
    if math.hypot(dx + 0.8, dy - 0.2) < 0.7:
        return 'W'
    return '3' if dx < 0 else '2'


def rune(r, ang, dx, dy, f):             # a glyph: a diamond frame, a mark in the middle
    d = abs(dx) + abs(dy)
    if 2.7 < d < 3.9:
        return '3' if dy < 0 else '2'
    if (abs(dx) < 0.55 and abs(dy) < 1.9) or (f and abs(dy) < 0.55 and abs(dx) < 1.4):
        return '4'
    return None


def egg(r, ang, dx, dy, f):
    if (dx / 2.7) ** 2 + ((dy - 0.3) / (3.6 if dy < 0.3 else 3.0)) ** 2 > 1:
        return None
    if math.hypot(dx + 0.9, dy + 1.3) < 0.75:
        return 'W'
    return 'a' if (abs(dx - 0.9) < 0.6 and abs(dy) < 0.7) or (abs(dx + 0.6) < 0.6 and abs(dy - 1.8) < 0.6) else '3' if dx < 0 else '2'


ARCH = {'bolt': bolt, 'comet': comet, 'spark': spark, 'slash': slash, 'dagger': dagger, 'needle': needle, 'rapier': rapier,
        'lance': lance, 'ray': ray, 'shard': shard, 'blade': blade, 'arrow': arrow, 'harpoon': harpoon, 'feather': feather,
        'thorn': thorn, 'lightning': lightning, 'wave': wave, 'claw': claw, 'chevron': chevron, 'ingot': ingot, 'wisp': wisp}
ROUND = {'orb': orb, 'bigorb': bigorb, 'bubble': bubble, 'star': star, 'star4': star4, 'shuriken': shuriken, 'ring': ring,
         'snowflake': snowflake, 'cog': cog, 'glob': glob, 'rock': rock, 'cloud': cloud, 'drop': drop, 'rune': rune, 'egg': egg}
SPIN = {'star', 'chakram', 'snowflake', 'cog', 'rock', 'hammer', 'anchor', 'chain', 'cross', 'star4'}
# drawn pointing RIGHT (not up-right): the broad crescents and chevrons, swept across the line of flight
FACE_RIGHT = {'slash', 'wave', 'chevron', 'claw'}

# hand-drawn 8x8s for the things a formula draws badly (frame 0, frame 1)
HAND = {
    'note': (["...33...", "...3443.", "...3..43", "...3..3.", ".223....", "23442...", "2342....", ".22....."],
             ["...33...", "...3443.", "...3...4", "...3....", ".223....", "23442...", "2344....", ".22....."]),
    'skull': ([".233332.", "23444432", "3oo44oo3", "3oo44oo3", "2344a432", ".233332.", "..3.3.3.", "..2.2.2."],
              [".233332.", "23444432", "3ab44ba3", "3oo44oo3", "2344a432", ".233332.", "..3.3.3.", "..2.2.2."]),
    'bell': (["...33...", "..3443..", "..3443..", ".234432.", ".234432.", "23333332", "11111111", "...aa..."],
             ["...33...", "..3443..", "..3443..", ".234432.", ".234432.", "23333332", "11111111", "..aa...."]),
    'bone': (["44......", "434.....", ".3433...", "..343...", "...343..", "...33434", ".....434", "......44"],
             ["44......", "434.....", ".3433...", "..343...", "...343..", "...33434", ".....434", "......44"]),
    'hammer': (["........", ".444444.", ".433332.", ".222221.", "...aa...", "...ab...", "...aa...", "...ab..."],
               ["........", ".444444.", ".433332.", ".222221.", "...aa...", "...ab...", "...aa...", "...ab..."]),
    'anchor': (["...44...", "..4..4..", "...44...", "...33...", "3..33..3", "33.33.33", ".233332.", "..2222.."],
               ["...44...", "..4..4..", "...44...", "...33...", "3..33..3", "33.33.33", ".233332.", "..2222.."]),
    'page': ([".444443.", ".4....3.", ".4aaa.3.", ".4....3.", ".4aaaa3.", ".4....3.", ".4aa..3.", ".333332."],
             [".444443.", ".4....3.", ".4aaaa3.", ".4....3.", ".4aa..3.", ".4....3.", ".4aaa.3.", ".333332."]),
    'chain': (["..3333..", ".3....3.", ".3....3.", "..3443..", "..2442..", ".2....2.", ".2....2.", "..2222.."],
              ["..3333..", ".3....3.", ".3....3.", "..4334..", "..4224..", ".2....2.", ".2....2.", "..2222.."]),
    'cross': (["...44...", "...43...", "34444443", "33443333", "...43...", "...43...", "...32...", "...22..."],
              ["...44...", "...43...", "34444443", "33443333", "...43...", "...43...", "...32...", "...22..."]),
    'planet': (["........", "..2332..", ".234432.", "bbbbbbbb", ".234432.", "..2332..", "........", "........"],
               ["........", "..2332..", ".234432.", "aaaaaaaa", ".234432.", "..2332..", "........", "........"]),
    # hand-drawn replacements for the formula shapes that read poorly at 8x8
    'comet': (["....333.", "...34443", "..234W43", ".2234443", ".22.333.", "2.2.....", ".2......", "2......."],
              ["....333.", "...34443", "..234W43", "..234443", ".222333.", "22......", "2.2.....", "........"]),
    'wisp': ([".....33.", "....3443", "...34W43", "..23443.", ".2.233..", "2.2.....", ".2.2....", "2......."],
             [".....33.", "....3443", "...34W43", "..23443.", "..2233..", ".2.2....", "2.2.....", ".2......"]),
    'slash': ([".233....", "...334..", "....344.", ".....344", ".....344", "....344.", "...334..", ".233...."],
              [".234....", "...344..", "....344.", ".....444", ".....444", "....344.", "...344..", ".234...."]),
    'wave': (["..2..3..", "...2..3.", "...2..34", "...2..34", "...2..34", "...2..34", "...2..3.", "..2..3.."],
             ["..2..3..", "...2..3.", "....2.34", "....2.44", "....2.44", "....2.34", "...2..3.", "..2..3.."]),
    'chevron': (["2..33...", ".2..34..", "..2..34.", "...2.344", "...2.344", "..2..34.", ".2..34..", "2..33..."],
                ["...33...", "2...34..", ".2...34.", "..2..344", "..2..344", ".2...34.", "2...34..", "...33..."]),
    'claw': (["........", "........", "22333...", ".223344.", "22333444", ".223344.", "22333...", "........"],
             ["........", "........", ".2333...", "2233444.", ".2333444", "2233444.", ".2333...", "........"]),
    'feather': (["......34", ".....343", "....3432", "...2432.", "..243...", "..432...", ".42.....", "1......."],
                ["......34", ".....343", "....3432", "...2432.", "..2432..", ".2432...", ".42.....", "1......."]),
    'thorn': ([".......4", "......43", ".....432", "...2332.", "..2332..", ".1222...", ".111....", "........"],
              [".......4", "......44", ".....432", "...2332.", "..2332..", ".1222...", ".111....", "........"]),
    'harpoon': (["....3444", ".....344", "....2.33", "...2...3", "..a.....", ".a......", "a.......", "........"],
                ["....3444", ".....444", "....2.43", "...2...3", "..a.....", ".a......", "a.......", "........"]),
    'orb': (["..2222..", ".233332.", "23W44332", "23444432", "23444432", "12344321", ".122221.", "..1111.."],
            ["..2222..", ".233332.", "23W44432", "23444442", "23444432", "12344321", ".122221.", "..1111.."]),
    'bubble': (["..2222..", ".2....2.", "2.WW...2", "2.W....2", "2......2", "2.....32", ".2...32.", "..2222.."],
               ["..2222..", ".2....2.", "2.W....2", "2......2", "2......2", "2....332", ".2..332.", "..2222.."]),
    'star': (["...33...", "...44...", "33444433", ".344443.", "..4444..", ".34..43.", ".3....3.", "........"],
             ["...33...", "...44...", "33444433", ".34WW43.", "..4444..", ".34..43.", ".3....3.", "........"]),
    'ring': (["..2332..", ".3....3.", "3......2", "4......2", "3......2", "3......2", ".3....2.", "..3222.."],
             ["..3332..", ".4....3.", "3......2", "3......2", "3......2", "3......2", ".3....2.", "..2222.."]),
    'chakram': (["...43...", ".33..33.", ".3....3.", "43....3.", ".3....34", ".3....3.", ".33..33.", "...34..."],
                ["...44...", ".34..33.", ".3....3.", "43....3.", ".3....34", ".3....3.", ".33..43.", "...34..."]),
    'snowflake': (["3..4..3.", ".3.4.3..", "..343...", "4444444.", "..343...", ".3.4.3..", "3..4..3.", "........"],
                  ["3..4..3.", ".3.4.3..", "..3W3...", "444W444.", "..3W3...", ".3.4.3..", "3..4..3.", "........"]),
    'cloud': (["........", "..33.33.", ".3443443", "34444443", "34444443", "23333332", ".222222.", "........"],
              ["........", ".33.33..", "3443443.", "34444443", "34444443", "23333332", ".222222.", "........"]),
    'heart': ([".33..33.", "3443344.", "34444443", "34444443", ".344443.", "..3443..", "...33...", "........"],
              [".33..33.", "3W43344.", "34444443", "34444443", ".344443.", "..3443..", "...33...", "........"]),
}


def draw(arch, f):
    if arch in HAND:
        return [list(r) for r in HAND[arch][f]]
    if arch in ARCH:
        return field(ARCH[arch], f)
    return radial(ROUND[arch], f)


def to16(g, pal, outline=True):
    """double the 8x8, then a 1px outline (in the 16px space) like the characters get"""
    T = (0, 0, 0, 0)
    px = [[T] * 16 for _ in range(16)]

    def rgba(hx):
        hx = hx.lstrip('#')
        return (int(hx[0:2], 16), int(hx[2:4], 16), int(hx[4:6], 16), 255)
    for y in range(N):
        for x in range(N):
            ch = g[y][x]
            if ch == '.':
                continue
            c = rgba(pal[ch])
            for yy in (0, 1):
                for xx in (0, 1):
                    px[y * 2 + yy][x * 2 + xx] = c
    if outline:
        oc = rgba(pal['o'])
        add = []
        for y in range(16):
            for x in range(16):
                if px[y][x][3] == 0 and any(0 <= x + dx < 16 and 0 <= y + dy < 16 and px[y + dy][x + dx][3] and px[y + dy][x + dx] != oc
                                            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                    add.append((x, y))
        for x, y in add:
            px[y][x] = oc
    return px


# ---------------------------------------------------------------- which shot is which
NAMED = {
    'ember': 'comet', 'spark': 'spark', 'lance': 'lance', 'star': 'star', 'molten': 'comet', 'pearl': 'orb', 'brine': 'bubble',
    'salt': 'shard', 'hook': 'harpoon', 'toll': 'ring', 'bile': 'glob', 'hymn': 'note', 'wail': 'wave', 'wisp': 'wisp',
    'drip': 'drop', 'corpseflame': 'wisp', 'tallow': 'glob', 'icicle': 'needle', 'frostshard': 'snowflake', 'runestone': 'rune',
    'verse': 'page', 'tine': 'needle', 'snowflake': 'snowflake', 'rune': 'rune', 'shard': 'shard', 'starbeam': 'ray',
    'blade': 'blade', 'soulflame': 'wisp', 'smoke': 'cloud', 'incense': 'cloud', 'goldshard': 'shard', 'halofrag': 'slash',
    'chord': 'ring', 'note': 'note', 'gaze': 'ray', 'kintsugi': 'shard', 'quake': 'rock', 'cinder': 'comet', 'slag': 'glob',
    'ingot': 'ingot', 'hammerlet': 'hammer', 'furnacebeam': 'ray', 'bellpearl': 'bigorb', 'clawsnap': 'claw', 'bubble': 'bubble',
    'candleflame': 'comet', 'waxspark': 'star4', 'relic': 'cross', 'mournbell': 'bell', 'glyphbolt': 'bolt', 'requiem': 'note',
    'conchwave': 'wave', 'tidebolt': 'bolt', 'bellwave': 'ring', 'clapper': 'bell', 'rimeflag': 'shard', 'hailstone': 'rock',
    'gildlash': 'slash', 'chainlink': 'chain', 'rustlink': 'chain', 'lensflare': 'spark', 'tear': 'drop', 'bloodclot': 'heart',
    'icenote': 'note', 'shieldboss': 'bigorb', 'goldtear': 'drop', 'bonebeam': 'bone', 'beacon': 'ring', 'saltcrystal': 'shard',
    'snapjaw': 'claw', 'anchorhead': 'anchor', 'mothdust': 'star4', 'greattoll': 'ring', 'tombshard': 'shard', 'chorusnote': 'note',
    'twinwisp': 'wisp', 'tallowdrop': 'drop', 'thornseed': 'thorn', 'leechspit': 'glob', 'glacierchunk': 'rock', 'wheelglyph': 'cog',
    'hushtine': 'needle', 'sagachord': 'ring', 'shieldbash': 'wave', 'jarlblade': 'blade', 'gluttonhalo': 'ring', 'organblast': 'bigorb',
    'seraphfeather': 'feather', 'broodegg': 'egg', 'snowball': 'rock', 'eelspit': 'glob', 'bogspit': 'glob', 'iceneedle': 'needle',
    'emberfeather': 'feather', 'slimeglob': 'glob', 'gasbubble': 'bubble', 'mendrune': 'rune', 'splinter': 'thorn', 'inkblot': 'glob',
    'page': 'page', 'grapple': 'harpoon',
    # untiered weapons: each a shape of its own
    'pj_unstruck': 'bigorb', 'pj_firstoath': 'lance', 'pj_claw': 'claw', 'pj_head': 'skull', 'pj_hammer': 'hammer', 'pj_starfist': 'star',
    'pj_psalter': 'page', 'pj_scourge': 'ring', 'pj_tallow': 'drop', 'pj_orrery': 'planet', 'pj_crozier': 'harpoon', 'pj_godfist': 'chevron',
    'pj_godbillet': 'ingot', 'pj_godlance': 'lance', 'pj_thrall': 'skull', 'pj_lastwatch': 'arrow', 'pj_choir': 'note',
    'pj_choirspark': 'star4', 'pj_tine': 'needle', 'pj_tineshard': 'shard', 'pj_krakenbane': 'harpoon', 'pj_whitewhale': 'harpoon',
    'pj_whaleshard': 'shard', 'pj_cinderfist': 'comet', 'pj_quench': 'bolt', 'pj_dawn': 'ray', 'pj_dawnray': 'ray', 'pj_admin': 'star',
    'pj_reflection': 'shard', 'pj_mirrorworld': 'shard', 'pj_glass': 'shard', 'pj_heavenwire': 'lightning', 'pj_firststorm': 'lightning',
    'pj_eleventh': 'cog', 'pj_lastsecond': 'needle', 'pj_cog': 'cog', 'pj_bonelantern': 'wisp', 'pj_bone': 'bone', 'pj_feint': 'dagger',
    'pj_lightningrod': 'lightning', 'pj_cuckoo': 'feather',
}
# tiered weapons: the weapon type decides the shape
TIERED = {'sword': 'slash', 'dagger': 'dagger', 'bow': 'arrow', 'staff': 'bolt', 'wand': 'spark', 'gauntlet': 'chevron',
          'tongs': 'ingot', 'sunrod': 'ray', 'lantern': 'wisp', 'harpoon': 'harpoon', 'rapier': 'rapier', 'coil': 'lightning',
          'pendulum': 'chakram'}
# drawn a size up: the big, slow, scary ones
BIG = {'bellpearl', 'organblast', 'shieldboss', 'quake', 'glacierchunk', 'smoke', 'greattoll', 'gluttonhalo', 'bellwave', 'anchorhead',
       'pj_unstruck', 'molten', 'slag', 'tallow', 'pj_whitewhale', 'pj_godfist', 'mournbell'}


def arch_of(name):
    if name in NAMED:
        return NAMED[name]
    if name.startswith('pj_'):
        parts = name.split('_')
        if len(parts) == 3 and parts[1] in TIERED:
            return TIERED[parts[1]]
    return 'orb'


def directional(arch):
    return arch in ARCH or arch in ('bone', 'comet', 'wisp', 'slash', 'wave', 'chevron', 'claw', 'feather', 'thorn', 'harpoon')


def tier_extras(g, t, f):
    """higher tiers carry more light: a glint trail at 4+, a corona at 8+"""
    if t >= 4:
        for x, y in ((0, 7), (1, 7), (0, 6)) if f else ((0, 7),):
            if g[y][x] == '.':
                g[y][x] = 'a'
    if t >= 8:
        for x, y in ((7, 3), (4, 0)) if f else ((6, 1),):
            if g[y][x] == '.':
                g[y][x] = 'b'
    return g
