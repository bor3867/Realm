"""Terrain art: painted ground tiles (not noise), dithered biome edges,
shoreline foam, flat ground decor and 32x32 landmarks.

Tiles are painted with intentional motifs per biome: wind ripples and shells
on the shore, grass tufts and moss in the fen, drifts and sparkle in the snow,
flagstones in Runeholt, ember-veined cracks and glass facets in Godfall.
"""
import math
import random

from pixlib import hex_rgba, blank, line, outline, rows

T = (0, 0, 0, 0)

# base, dark, light, extra1, extra2
PAL = {
    'water': ('#1E5078', '#173F60', '#3C82AE', '#7EC0E4', '#C8EEFF'),
    'deep': ('#102C48', '#0B2238', '#1A426A', '#2E6A98', '#5C9CC8'),
    'sand': ('#D2B074', '#B8955A', '#E8CF96', '#9C7A44', '#F2B8B0'),
    'fen': ('#3E6230', '#2C4A22', '#5C8A3A', '#86B04C', '#E8D46A'),
    'mud': ('#4E412C', '#3A301F', '#66563A', '#3E5A5A', '#7AA0A0'),
    'snow': ('#C4D2E0', '#9CB0C4', '#E8F0F8', '#FFFFFF', '#7A90A8'),
    'runefloor': ('#5E5A76', '#46425A', '#7A75A0', '#A8C0D8', '#3BEFFF'),
    'runeglyph': ('#5E5A76', '#46425A', '#7A75A0', '#A8C0D8', '#3BEFFF'),
    'ash': ('#3E373C', '#2C2629', '#554C52', '#F2641A', '#8C2A12'),
    'obsidian': ('#221D28', '#16121C', '#3A3346', '#6E6488', '#F2641A'),
    'marble': ('#D8D2C4', '#BDB5A4', '#EEE9DE', '#C98A22', '#F2C14E'),
    'forge': ('#3A2A2A', '#2A1E1E', '#4E3A36', '#8C2A12', '#F2641A'),
    'forgewall': ('#2E2A38', '#1E1A26', '#4F4B60', '#8E8AA6', '#1A1622'),
    'lava': ('#C0400E', '#8C2A12', '#F2641A', '#FFC94A', '#FFF6C8'),
    'void': ('#0A080C', '#0A080C', '#0A080C', '#0A080C', '#0A080C'),
    'chapelfloor': ('#4E6670', '#3A4E58', '#6E8A94', '#7EC0E4', '#FF8FBF'),
    'chapelwall': ('#8A9AA0', '#5E6E76', '#B8C4C8', '#3BEFFF', '#FF8FBF'),
    'goldvein': ('#1E1A22', '#141118', '#2E2834', '#C98A22', '#F2C14E'),
    'ribwall': ('#C8C0B0', '#8A8070', '#EDE6D2', '#C98A22', '#4A4254'),
    'grass': ('#4A7A30', '#36602A', '#6A9A3E', '#9AC85A', '#F0D04A'),
    'cobble': ('#6E6A7A', '#4E4A5A', '#9894A6', '#3A3646', '#B8B4C4'),
    'dirt': ('#7A5A3A', '#5E442C', '#9A764E', '#4A3424', '#B8935E'),
    'hedge': ('#24461E', '#18321A', '#3A6430', '#5E8A3A', '#E05A8A'),
    'shallows': ('#3C82AE', '#2E6A90', '#6AAED0', '#D2B074', '#E8F6FF'),
    'bog': ('#3A4A28', '#2A3620', '#4E6232', '#8DB03A', '#C8D86A'),
    'ice': ('#A8C8E0', '#86A8C4', '#D4E8F6', '#FFFFFF', '#6A8AAA'),
    # the new lands
    'dune': ('#F0DCAE', '#D4BC88', '#FFF0CC', '#C8A468', '#FFFFFF'),
    'glassflat': ('#B8DCD8', '#8CB8B8', '#DCF4F0', '#FFFFFF', '#5AD8E0'),
    'loam': ('#2E3A22', '#1E2816', '#44542E', '#6A8A3A', '#C83A4A'),
    'bramble': ('#1E2E18', '#121C0E', '#34502A', '#5A7A3A', '#C83A4A'),
    'steppe': ('#B89A48', '#947A34', '#D8BC66', '#E8D890', '#E880E8'),
    'quartz': ('#8A7AA8', '#6A5A88', '#B8A8D8', '#FFD0FF', '#E880E8'),
}
# (name, animation frames). Animated ground: grass sways, embers flicker, runes pulse, gold shimmers, puddles ripple.
TILES = [('water', 3), ('deep', 3), ('sand', 1), ('fen', 3), ('mud', 2), ('snow', 2), ('runefloor', 1),
         ('runeglyph', 3), ('ash', 3), ('obsidian', 2), ('marble', 1), ('forge', 2), ('forgewall', 1),
         ('lava', 3), ('void', 1), ('chapelfloor', 2), ('chapelwall', 1), ('goldvein', 3), ('ribwall', 1),
         ('grass', 3), ('cobble', 1), ('dirt', 1), ('hedge', 2), ('shallows', 3), ('bog', 3), ('ice', 2),
         ('dune', 1), ('glassflat', 2), ('loam', 1), ('bramble', 1), ('steppe', 3), ('quartz', 2),
         ('cryptfloor', 1), ('cryptwall', 1), ('cryptwater', 3), ('emberfloor', 1), ('emberwall', 1), ('emberlava', 3), ('carpet', 1)]
import dungeons4_art as _D4  # noqa: E402
TILES += [(n, len(v[0])) for n, (p, v) in _D4.TILES.items()]
VARIANTS = {'chapelfloor': 3, 'goldvein': 3, 'sand': 6, 'fen': 6, 'mud': 4, 'snow': 6, 'runefloor': 4, 'ash': 6, 'obsidian': 4, 'marble': 2, 'forge': 3,
            'grass': 6, 'cobble': 3, 'dirt': 3, 'hedge': 2, 'shallows': 3, 'bog': 3, 'ice': 3,
            'dune': 6, 'glassflat': 3, 'loam': 6, 'bramble': 2, 'steppe': 6, 'quartz': 3, 'cryptfloor': 4, 'emberfloor': 4, 'carpet': 3}
VARIANTS.update({n: len(v) for n, (p, v) in _D4.TILES.items() if len(v) > 1})
# land blending priority: higher bleeds onto lower
PRIORITY = {'sand': 2, 'mud': 3, 'fen': 4, 'snow': 5, 'runefloor': 6, 'runeglyph': 6, 'ash': 7, 'obsidian': 8,
            'cobble': 0, 'dirt': 1, 'grass': 9, 'shallows': 1.5, 'bog': 2.5, 'ice': 4.5,
            'dune': 2.2, 'glassflat': 1.7, 'loam': 3.6, 'steppe': 5.6, 'quartz': 6.5}


def _px(g, x, y, c):
    if 0 <= x < 16 and 0 <= y < 16:
        g[y][x] = c


def _mix(a, b, f):
    return tuple(round(a[i] + (b[i] - a[i]) * f) for i in range(3)) + (255,)


MOTTLE = {'water': 0.5, 'deep': 0.5, 'sand': 1, 'fen': 1, 'mud': 1, 'snow': 0.8, 'ash': 1, 'obsidian': 0.7,
          'runefloor': 0.6, 'runeglyph': 0.6, 'marble': 0.4, 'forge': 0.7, 'chapelfloor': 0.7, 'goldvein': 0.6,
          'grass': 1, 'dirt': 1, 'hedge': 1.2, 'cobble': 0.3, 'shallows': 0.6, 'bog': 1, 'ice': 0.5}


def mottle(name, v):
    """Seamless 4-tone ground noise (integer frequencies wrap at 16 px), dithered at the band edges."""
    b, d, l = (hex_rgba(c) for c in PAL[name][:3])
    k = MOTTLE.get(name, 0)
    g = [[b] * 16 for _ in range(16)]
    if not k:
        return g
    r = random.Random(f'mottle:{name}:{v}')
    waves = [(r.choice((1, 2)), r.choice((-2, -1, 1, 2)), r.random() * math.tau, r.uniform(0.6, 1)) for _ in range(3)] + \
            [(r.choice((3, 4)), r.choice((-3, 2, 3)), r.random() * math.tau, r.uniform(0.25, 0.4)) for _ in range(2)]
    dm, lm = _mix(b, d, 0.5), _mix(b, l, 0.45)
    for y in range(16):
        for x in range(16):
            n = sum(a * math.sin(math.tau * (fx * x + fy * y) / 16 + ph) for fx, fy, ph, a in waves) * k
            chk = (x + y) % 2 == 0
            if n < -1.35 or (n < -1.1 and chk):
                g[y][x] = d if n < -1.6 else dm
            elif n < -0.55 and chk:
                g[y][x] = dm
            elif n > 1.35 or (n > 1.1 and chk):
                g[y][x] = lm
            elif n > 0.65 and chk and (x * 3 + y) % 4 == 0:
                g[y][x] = lm
    return g


def paint(name, frame=0, v=0):
    b, d, l, e1, e2 = (hex_rgba(c) for c in PAL[name])
    r = random.Random(f'{name}:{v}')
    g = mottle(name, v)
    P = lambda x, y, c: _px(g, x % 16, y % 16, c)  # noqa: E731  (tiles wrap seamlessly)
    shadow = _mix(d, (10, 6, 20), 0.35)

    def pebble(x, y, c, hi):
        P(x, y, c); P(x + 1, y, c); P(x, y - 1, hi); P(x + 1, y + 1, shadow); P(x, y + 1, shadow); P(x + 2, y, shadow)

    if name in ('water', 'deep'):
        for k in range(5 if name == 'water' else 3):
            x0 = (k * 7 + frame * 2 + (k % 2) * 3) % 16
            y0 = (k * 5 + 2) % 16
            for i in range(4):                                     # little wave arcs
                P(x0 + i, y0 - (1 if i in (1, 2) else 0), l)
            P(x0 + 1, y0 + 1, d); P(x0 + 2, y0 + 1, d)
        if name == 'water' and frame % 3 == 1:
            P(r.randrange(16), r.randrange(16), e2)
    elif name == 'lava':
        for y in range(16):
            for x in range(16):
                w = math.sin((x + frame * 2) * 0.7 + y * 0.4) + math.sin(y * 0.9 - frame)
                if w > 1.2:
                    g[y][x] = e1
                elif w > 0.6:
                    g[y][x] = l
                elif w < -1.1:
                    g[y][x] = d
        P(r.randrange(16), r.randrange(16), e2)
    elif name == 'sand':
        for k in range(3):                                         # wind ripples
            y0 = (k * 5 + v * 2 + 2) % 16
            x0 = r.randrange(16)
            for i in range(r.randint(6, 10)):
                yy = y0 + (1 if (i // 3) % 2 else 0)
                P(x0 + i, yy, l); P(x0 + i, yy + 1, d)
        for _ in range(4):
            P(r.randrange(16), r.randrange(16), e1)
        if v == 3:                                                  # a tiny shell
            x, y = r.randrange(2, 13), r.randrange(2, 13)
            P(x, y, e2); P(x + 1, y, l); P(x, y + 1, l)
    elif name == 'fen':
        for _ in range(3):                                         # moss patches
            x, y = r.randrange(16), r.randrange(16)
            for dx in range(3):
                for dy in range(2):
                    if r.random() < 0.8:
                        P(x + dx, y + dy, d)
        sway = (0, 1, 0)[frame % 3] if frame != 2 else -1
        for k in range(5 + v):                                     # grass tufts, swaying
            x, y = r.randrange(16), r.randrange(16)
            s_ = sway if k % 2 else -sway
            P(x, y, d); P(x - 1, y - 1, l); P(x + 1, y - 1, l); P(x, y - 1, l); P(x + s_, y - 2, e1)
        if v == 2:
            x, y = r.randrange(2, 14), r.randrange(2, 14)
            P(x, y, e2); P(x + 1, y + 1, e2)
    elif name == 'mud':
        for _ in range(4):
            x, y = r.randrange(16), r.randrange(16)
            for i in range(4):
                P(x + i, y + (i // 2), d)
        if v >= 1:                                                 # puddle
            cx, cy = r.randrange(4, 12), r.randrange(4, 12)
            for y in range(-2, 3):
                for x in range(-3, 4):
                    if (x / 3.4) ** 2 + (y / 2.2) ** 2 <= 1:
                        P(cx + x, cy + y, e1)
            P(cx - 1 + frame, cy - 1, e2); P(cx + frame, cy - 1, e2)
        for _ in range(3):
            P(r.randrange(16), r.randrange(16), l)
    elif name == 'snow':
        for k in range(2):                                         # drifts
            y0 = (k * 8 + v * 3 + 4) % 16
            x0 = r.randrange(16)
            for i in range(9):
                yy = y0 + round(math.sin(i / 2.5) * 1.2)
                P(x0 + i, yy, d); P(x0 + i, yy - 1, l)
        for k in range(2 + v % 2):
            x, y = r.randrange(16), r.randrange(16)
            P(x, y, e1 if (k + frame) % 2 == 0 else l)
        if v == 3:
            P(r.randrange(16), r.randrange(16), e2)
    elif name in ('runefloor', 'runeglyph'):
        layouts = [[(0, 0, 8, 8), (8, 0, 8, 8), (0, 8, 8, 8), (8, 8, 8, 8)], [(0, 0, 16, 8), (0, 8, 6, 8), (6, 8, 10, 8)],
                   [(0, 0, 10, 10), (10, 0, 6, 10), (0, 10, 16, 6)], [(0, 0, 6, 16), (6, 0, 10, 7), (6, 7, 10, 9)]]
        for (x0, y0, w, h) in layouts[v % 4]:
            for x in range(w):
                P(x0 + x, y0, l if x < w - 1 else d)                # bevel top
                P(x0 + x, y0 + h - 1, d)
            for y in range(h):
                P(x0, y0 + y, l if y < h - 1 else d)
                P(x0 + w - 1, y0 + y, d)
        if v == 2:
            for i in range(5):
                P(3 + i, 4 + (i % 2), d)
        if r.random() < 0.5:
            P(r.randrange(16), r.randrange(16), e1)                 # frost fleck
        if name == 'runeglyph':
            pulse = (e2, hex_rgba('#CFFFFF'), e1)[frame % 3]
            for x, y in ((7, 3), (8, 4), (7, 5), (8, 6), (7, 7), (8, 8), (7, 9), (8, 10), (7, 11), (5, 6), (6, 7), (9, 7), (10, 8)):
                P(x, y, pulse)
    elif name == 'ash':
        for _ in range(2 + v // 2):                                # cracks
            x, y = r.randrange(16), r.randrange(16)
            for i in range(r.randint(4, 8)):
                P(x, y, d)
                if (v >= 2 or frame) and i % 3 == 1:
                    P(x, y, (e2, e1, hex_rgba('#FFC94A'))[(frame + i) % 3])   # ember in the crack, flickering
                x += r.choice((1, 1, 0)); y += r.choice((1, 0, -1))
        for _ in range(4):
            P(r.randrange(16), r.randrange(16), l)
    elif name == 'obsidian':
        for k in range(3):                                         # glassy facet streaks
            x0, y0 = r.randrange(16), r.randrange(16)
            for i in range(5):
                P(x0 + i, y0 - i, l if i < 3 else e1)
                P(x0 + i, y0 - i + 1, d)
        if v == 2:
            x, y = r.randrange(16), r.randrange(16)
            for i in range(5):
                P(x + i, y + (i % 2), e2 if (i + frame) % 2 else hex_rgba('#FFC94A'))
    elif name == 'marble':
        for y in range(16):
            for x in range(16):
                if y in (0,) or x in (0,):
                    g[y][x] = l
                if y == 15 or x == 15:
                    g[y][x] = d
        for k in range(2):
            x0, y0 = r.randrange(16), r.randrange(16)
            for i in range(6):
                P(x0 + i, y0 + (i // 3), d)
        if v == 1:
            P(7, 7, e1); P(8, 8, e1); P(7, 8, e2); P(8, 7, e2)
    elif name in ('forge', 'forgewall'):
        for y in range(16):
            for x in range(16):
                off = 4 if (y // 4) % 2 else 0
                if y % 4 == 3 or (x + off) % 8 == 7:
                    g[y][x] = d
                elif y % 4 == 0 and name == 'forgewall':
                    g[y][x] = l
        if name == 'forge':
            for k in range(2 + v):
                P(r.randrange(16), r.randrange(16), (e1 if v else l) if (k + frame) % 2 == 0 else e2)
            if v == 2:
                P(r.randrange(16), r.randrange(16), e2)
        else:
            for y in range(12, 16):
                for x in range(16):
                    if (x + y) % 2 == 0:
                        g[y][x] = e2                               # soot at the wall's foot
    if name == 'chapelfloor':                                     # wet flagstones, puddles, a fallen petal of glass
        for y in range(16):
            for x in range(16):
                if y in (0, 8) or x == (0 if y < 8 else 8):
                    g[y][x] = d
        for i in range(5):
            P(3 + i + v, 11 - ((i + frame) % 2), e1)
        if v == 2:
            P(12, 4, e2); P(13, 4, e1)
    elif name == 'chapelwall':
        for y in range(16):
            for x in range(16):
                off = 4 if (y // 4) % 2 else 0
                if y % 4 == 3 or (x + off) % 8 == 7:
                    g[y][x] = d
                elif y % 4 == 0:
                    g[y][x] = l
        P(5, 5, e1); P(6, 5, e2); P(5, 6, e2); P(6, 6, e1)        # a shard of stained glass set in the stone
    elif name == 'goldvein':
        x, y = r.randrange(16), r.randrange(16)
        for i in range(14):                                       # a gold vein wandering through black glass, shimmering
            P(x, y, e1 if (i + frame) % 3 else e2)
            x += r.choice((1, 1, 0)); y += r.choice((1, 0, -1))
        for _ in range(3):
            P(r.randrange(16), r.randrange(16), l)
    elif name == 'ribwall':
        for y in range(16):
            for x in range(16):
                if x % 8 in (0, 7):
                    g[y][x] = d
                if y % 8 == 3:
                    g[y][x] = e1
        for y in range(16):
            P(3, y, l); P(11, y, l)
    if name == 'grass':                                         # meadow: swaying tufts, clover, wildflowers
        sway = (0, 1, -1)[frame % 3]
        for k in range(6 + v):
            x, y = r.randrange(16), r.randrange(16)
            s_ = sway if k % 2 else -sway
            P(x, y, d); P(x - 1, y - 1, l); P(x + 1, y - 1, l); P(x + s_, y - 2, e1)
        if v in (2, 4):
            for _ in range(3):
                x, y = r.randrange(16), r.randrange(16)
                P(x, y, e2 if v == 2 else hex_rgba('#F4EDFF')); P(x + 1, y + 1, l)
        if v == 5:
            x, y = r.randrange(3, 12), r.randrange(3, 12)
            for dx, dy in ((0, 0), (1, 0), (0, 1), (1, 1), (-1, 0)):
                P(x + dx, y + dy, l)                              # clover patch
            P(x, y, hex_rgba('#E05A8A'))
    elif name == 'cobble':                                       # rounded setts with mortar between
        for y0 in range(0, 16, 4):
            off = 2 if (y0 // 4) % 2 else 0
            for x0 in range(-off, 16, 4):
                base = r.choice((b, b, _mix(b, l, 0.45), _mix(b, d, 0.35), _mix(b, hex_rgba('#7A6A5A'), 0.3)))
                for yy in range(3):
                    for xx in range(3):
                        if (xx, yy) in ((0, 0), (2, 2), (2, 0), (0, 2)) and r.random() < 0.5:
                            P(x0 + xx, y0 + yy, e1); continue          # rounded corners: mortar shows through
                        c_ = _mix(base, l, 0.5) if xx + yy <= 1 else _mix(base, d, 0.6) if xx + yy >= 3 else base
                        P(x0 + xx, y0 + yy, c_)
                for xx in range(4):
                    P(x0 + xx, y0 + 3, e1)
                P(x0 + 3, y0, e1); P(x0 + 3, y0 + 1, e1); P(x0 + 3, y0 + 2, e1)
        if v == 2:
            x, y = r.randrange(16), r.randrange(16)
            P(x, y, hex_rgba('#4E7E34')); P(x + 1, y, hex_rgba('#7EAE48'))   # moss in the cracks
    elif name == 'dirt':                                         # a beaten path: ruts, pebbles, footprints
        for k in range(2):
            y0 = 4 + k * 7 + v
            for x in range(16):
                P(x, y0 + (1 if (x // 5) % 2 else 0), d)
        for _ in range(4):
            pebble(r.randrange(1, 14), r.randrange(2, 14), e2, hex_rgba('#D8B880'))
    elif name == 'hedge':                                        # dense boxwood hedge (solid)
        for k in range(10):
            cx, cy = r.randrange(16), r.randrange(16)
            for dy in range(-2, 3):
                for dx in range(-2, 3):
                    if dx * dx + dy * dy <= 4:
                        P(cx + dx, cy + dy, l if dy < 0 else b if dy < 2 else d)
            P(cx - 1, cy - 1, e1)
        if v == 1:
            for k in range(3):
                x, y = r.randrange(16), r.randrange(16)
                P(x, y, e2 if (k + frame) % 2 == 0 else hex_rgba('#F4EDFF'))   # blossoms nodding
    if name == 'shallows':                                      # ankle-deep tide over sand: ripples roll through
        for k in range(4):
            x0 = (k * 5 + frame * 2 + v * 3) % 16; y0 = (k * 4 + 1 + v) % 16
            for i in range(3):
                P(x0 + i, y0 - (1 if i == 1 else 0), e2)
        for _ in range(3 + v):
            P(r.randrange(16), r.randrange(16), e1)              # sand showing through
    elif name == 'bog':                                          # black water; bubbles rise and pop
        for _ in range(5):
            x, y = r.randrange(16), r.randrange(16)
            P(x, y, d); P(x + 1, y, d)
        for k in range(3):
            x, y = (k * 6 + v * 2) % 16, (k * 5 + 3) % 16
            st = (frame + k) % 3
            if st == 0: P(x, y, e1)
            elif st == 1: P(x, y, e2); P(x + 1, y, e1); P(x, y - 1, e1)
            else: P(x - 1, y, e1); P(x + 1, y, e1)              # popped: a ring
        if v == 2:
            P(9, 9, hex_rgba('#5C8A3A')); P(10, 9, hex_rgba('#86B04C'))   # a lily pad
    elif name == 'ice':                                          # a frozen lake: cracks and a travelling glint
        x, y = r.randrange(16), r.randrange(16)
        for i in range(9):
            P(x, y, e2)
            x += r.choice((1, 1, 0, -1)); y += r.choice((1, 0, -1))
        for i in range(3):
            P((v * 5 + i + frame * 6) % 16, (v * 3 + i) % 16, e1)   # glint sliding across the ice
    # ---- extra life: pebbles with shadows, flowers, bones, sparkles
    if name == 'sand' and v in (1, 4):
        pebble(r.randrange(2, 13), r.randrange(3, 13), _mix(b, d, 0.6), l)
    if name == 'sand' and v == 5:
        x, y = r.randrange(3, 12), r.randrange(3, 12)                  # a crab track
        for i in range(5):
            P(x + i * 2, y + (i % 2), d); P(x + i * 2, y + 2 + (i % 2), d)
    if name == 'fen' and v in (3, 5):
        for _ in range(2):                                             # pale bog flowers
            x, y = r.randrange(1, 15), r.randrange(1, 15)
            P(x, y, hex_rgba('#F4EDFF')); P(x + 1, y, hex_rgba('#C8A8E8')); P(x, y + 1, d)
    if name == 'fen' and v == 4:
        pebble(r.randrange(2, 13), r.randrange(3, 13), hex_rgba('#6E7A62'), hex_rgba('#9AA88A'))
    if name == 'mud' and v == 3:
        x, y = r.randrange(3, 12), r.randrange(3, 12)                  # a half-sunk bone
        for i in range(5):
            P(x + i, y, hex_rgba('#D8D0B8'))
        P(x, y - 1, hex_rgba('#EDE6D2')); P(x + 4, y + 1, hex_rgba('#B8AE94')); P(x + 1, y + 1, shadow); P(x + 2, y + 1, shadow)
    if name == 'snow' and v in (4, 5):
        for _ in range(3):
            P(r.randrange(16), r.randrange(16), e1)                    # glitter
        if v == 5:
            pebble(r.randrange(2, 13), r.randrange(3, 13), hex_rgba('#6E6A86'), hex_rgba('#B2ACCA'))
    if name == 'ash' and v in (4, 5):
        x, y = r.randrange(3, 12), r.randrange(3, 12)                  # bone shards / a scorched skull
        if v == 4:
            for i in range(4):
                P(x + i, y - i // 2, hex_rgba('#C8C0B0'))
            P(x, y + 1, shadow); P(x + 1, y + 1, shadow)
        else:
            for dx, dy in ((0, 0), (1, 0), (2, 0), (0, 1), (2, 1), (1, 2)):
                P(x + dx, y + dy, hex_rgba('#B8AE94'))
            P(x + 1, y + 1, hex_rgba('#1A1418')); P(x, y + 2, shadow); P(x + 2, y + 2, shadow); P(x + 3, y + 1, shadow)
    if name == 'obsidian' and v == 3:
        for i in range(6):
            P(4 + i, 9 - i // 2, e2 if i % 2 else e1)                  # a glowing seam
    return g


def build_tiles():
    """-> (cells, index). index[name] = {i, frames, variants}"""
    cells, index = [], {}
    for name, nf in TILES:
        nv = VARIANTS.get(name, 1)
        index[name] = {'i': len(cells), 'frames': nf, 'variants': nv}
        for v in range(nv):
            for f in range(nf):
                cells.append(paint(name, f, v))
    return cells, index


def build_edges():
    """Dithered edge overlays: for every blendable land tile, N/E/S/W bands that
    get drawn onto a lower-priority neighbour. Plus animated shoreline foam."""
    cells, index = [], {}
    for name in PRIORITY:
        src = paint(name, 0, 0)
        index[name] = len(cells)
        r = random.Random('edge' + name)
        bump = [r.choice((0, 0, 1, 1, 2)) for _ in range(16)]
        for direction in 'NESW':
            g = [[T] * 16 for _ in range(16)]
            for y in range(16):
                for x in range(16):
                    along, depth = {'N': (x, y), 'S': (x, 15 - y), 'W': (y, x), 'E': (y, 15 - x)}[direction]
                    dd = depth - bump[along]
                    keep = dd < 1 or (dd < 2 and (x + y) % 2 == 0) or (dd < 3 and (x + 2 * y) % 4 == 0) or (dd < 4 and (x * 3 + y) % 7 == 0)
                    if keep:
                        g[y][x] = src[y][x]
            cells.append(g)
    foam_c, foam_l = hex_rgba('#C8EEFF'), hex_rgba('#7EC0E4')
    index['foam'] = len(cells)
    for f in range(3):
        for direction in 'NESW':
            g = [[T] * 16 for _ in range(16)]
            for y in range(16):
                for x in range(16):
                    along, depth = {'N': (x, y), 'S': (x, 15 - y), 'W': (y, x), 'E': (y, 15 - x)}[direction]
                    wob = (along + f * 3) % 6
                    if depth == 0 or (depth == 1 and wob < 4):
                        g[y][x] = foam_c
                    elif depth == 2 and wob in (1, 2) or (depth == 3 and wob == 4 and f != 1):
                        g[y][x] = foam_l
            cells.append(g)
    return cells, index


# ================================================================ ground decor (flat, non-blocking)
DPAL = {'o': '#1E1418', 'p': '#F2B8B0', 'P': '#C87A7A', 'w': '#FFF0E0', 'r': '#E2603A', 'R': '#FF9A5A',
        'k': '#2E5A3A', 'K': '#4C8A50', 'L': '#7AC070', 'd': '#6A4A30', 'D': '#9A7048',
        'g': '#6A9A2A', 'G': '#8DB03A', 'y': '#D4FF5A', 'm': '#C8B8A0', 'M': '#E8E0C8', 'c': '#3BEFFF', 'C': '#CFFFFF',
        's': '#8C8FA3', 'S': '#C9CCD8', 'a': '#A8E2FF', 'A': '#F0FCFF', 'b': '#E8E4D8', 'B': '#A8A294',
        'e': '#F2641A', 'E': '#FFC94A', 'q': '#3A3438', 'Q': '#6A6068', 'h': '#C98A22', 'H': '#F2C14E',
        'u': '#2E6A98', 'U': '#5C9CC8', 'v': '#B8B0C8', 'V': '#E4DEEC', 'x': '#4E412C'}
DECOR = {
    'shell': ["................", "................", "................", "................", "................",
              "......ooo.......", ".....opwpo......", "....opPpwPo.....", "....oPpwpPo.....", ".....oPPPo......",
              "......ooo.......", "................", "................", "................", "................", "................"],
    'starfish': ["................", "................", "................", ".......o........", "......oRo.......",
                 "......oRo.......", "..oooorRroooo...", "...orRRwRRro....", "....orRRRro.....", "....oRo.oRo.....",
                 "...oRo...oRo....", "...oo.....oo....", "................", "................", "................", "................"],
    'kelp': ["................", "................", "................", "................", "................",
             "................", "....o.o.........", "...oKokoo.o.....", "..oKkKoKkoKo....", ".oKkkKkkKkKko...",
             "..ookkKkkkoo....", "....ooooo.......", "................", "................", "................", "................"],
    'driftwood': ["................", "................", "................", "................", "................",
                  "................", "................", "..oooooooooo....", ".oDDdDDDdDDdo...", ".odddddddDddoo..",
                  "..oooooooooodDo.", "............oo..", "................", "................", "................", "................"],
    'reeds': ["................", "...o....o.......", "..oGo..oGo..o...", "..oGo..oGo.oGo..", "..oGo..oGo.oGo..",
              "...g...og..oGo..", "...g....g...g...", "..og...og..og...", "..ogo..gg..g....", "...g...g..og....",
              "...g..og...g....", "..oggoggo.ogo...", "...ooooooooo....", "................", "................", "................"],
    'shrooms': ["................", "................", "................", "................", "................",
                "........oooo....", "..ooo..oyyyyo...", ".oyyyo.oyGGyo...", ".oyGyo..oMMo....", "..oMo....oMo.....".replace('o.....', 'o....'),
                "..oMo....oMo....", "..ooo....ooo....", "................", "................", "................", "................"],
    'lily': ["................", "................", "................", "................", "................",
             "......ooooo.....", "....ooxxxxxoo...", "...oxuuuuUuuxo..", "...oxuKKKkuUxo..", "...oxuKLLKuuxo..",
             "....oxuuuuuxo...", ".....ooxxxoo....", "................", "................", "................", "................"],
    'skullmoss': ["................", "................", "................", "................", "................",
                  "................", ".....ooooo......", "....obbbGbo.....", "....obobobGo....", "....obbbbbGo....",
                  ".....oGbbGo.....", "......oooo......", "................", "................", "................", "................"],
    'snowtuft': ["................", "................", "................", "................", "................",
                 "................", "......o..o......", ".....oSoSo.o....", "....oSsSsoSo....", "....oAAAAAAo....",
                 "...oAAaAAAAAo...", "....oooooooo....", "................", "................", "................", "................"],
    'runepebble': ["................", "................", "................", "................", "................",
                   "................", "......ooo.......", ".....oSSso......", ".....oScso......", ".....oSCso......",
                   "....oAAAAAo.....", "....ooooooo.....", "................", "................", "................", "................"],
    'icecrystal': ["................", "................", "................", "........o.......", ".......oAo......",
                   "....o..oAo......", "...oAo.oaAo.o...", "...oaAoaAAooAo..", "....oaAAaAaAao..", "....oaaAAaaao...",
                   "...oAAAAAAAAo...", "....oooooooo....", "................", "................", "................", "................"],
    'brokenshield': ["................", "................", "................", "................", "................",
                     "................", ".....oooooo.....", "....osSSSSso....", "....osScSSso....", ".....osSSso.o...",
                     "......osso.oSo..", ".......oo...o...", "................", "................", "................", "................"],
    'embervent': ["................", "................", "................", "................", "................",
                  "................", "......oooo......", "....ooqeEqoo....", "...oqQeEEeqQo...", "...oqqqeeqqqo...",
                  "....ooqqqqoo....", "......oooo......", "................", "................", "................", "................"],
    'goldrubble': ["................", "................", "................", "................", "................",
                   "................", "................", "....oo....oo....", "...ohHo..ovVo...", "...ohho.ooVvo...",
                   "....oo.ohHoo....", ".......oooo.....", "................", "................", "................", "................"],
    'bonepile': ["................", "................", "................", "................", "................",
                 "................", ".......ooo......", "..oo..obbbo.....", ".obbooobobo.....", "..obbbbbbbooo...",
                 "...oobbBbbbbbo..", ".....ooooooooo..", "................", "................", "................", "................"],
    'pillarstub': ["................", "................", "................", "................", "....oooooooo....",
                   "...ovVVVVVVvo...", "...ovVvVVvVvo...", "...ovVvVVvVvo...", "...ovVvVVvVvo...", "...ovVvhVvVvo...",
                   "..ovvvvvvvvvvo..", "..oooooooooooo..", "................", "................", "................", "................"],
}
DECOR_BIOME = {'shore': ['shell', 'starfish', 'kelp', 'driftwood'], 'fen': ['reeds', 'shrooms', 'lily', 'skullmoss'],
               'runeholt': ['snowtuft', 'runepebble', 'icecrystal', 'brokenshield'], 'godfall': ['embervent', 'goldrubble', 'bonepile', 'pillarstub']}


DECOR_SWAY = {'reeds', 'kelp', 'snowtuft', 'starfish'}           # these lean in the wind
DECOR_GLOW = {'shrooms', 'icecrystal', 'runepebble', 'skullmoss', 'goldrubble', 'lily', 'shell', 'brokenshield', 'bonepile'}


def build_decor():
    """-> (cells, index, anim): every decor piece gets a second frame - it sways, or its lights pulse"""
    from enhance import sway, pulse
    cells, index, anim = [], {}, {}
    for name, g in DECOR.items():
        assert len(g) == 16 and all(len(r) == 16 for r in g), (name, [len(r) for r in g])
        index[name] = len(cells)
        f0 = [[T if ch == '.' else hex_rgba(DPAL[ch]) for ch in r] for r in g]
        cells.append(f0)
        if name == 'embervent':                                         # second frame: the vent breathes
            g2 = [r.replace('e', 'E').replace('q', 'e') if 7 <= k <= 9 else r for k, r in enumerate(g)]
            cells.append([[T if ch == '.' else hex_rgba(DPAL[ch]) for ch in r] for r in g2])
            anim[name] = 2
        elif name in DECOR_SWAY:
            cells.append(sway(f0, 0.7)); anim[name] = 2
        elif name in DECOR_GLOW:
            cells.append(pulse(f0, 0.5)); anim[name] = 2
    return cells, index, anim


# ================================================================ landmarks 32x32 (solid footprint)
LPAL = {'o': '#140F12', 'b': '#EDE6D2', 'B': '#B8AE94', 'd': '#8A8070', 't': '#2B6E6A', 'T': '#5FB3A1',
        'w': '#4A3424', 'W': '#7A5A3A', 'g': '#6A9A2A', 'G': '#8DB03A', 'y': '#D4FF5A',
        's': '#6E6A86', 'S': '#B2ACCA', 'A': '#F0FCFF', 'c': '#3BEFFF', 'C': '#CFFFFF',
        'v': '#A8A0B8', 'V': '#E4DEEC', 'k': '#4A4458', 'h': '#C98A22', 'H': '#F2C14E'}


def _ell(c, cx, cy, rx, ry, ch):
    for y in range(32):
        for x in range(32):
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1:
                c[y][x] = ch


def whale_skull():
    c = blank(32, 32)
    _ell(c, 15, 18, 13, 9, 'b')
    _ell(c, 15, 22, 11, 5, 'B')
    for x in range(4, 27):                                             # jaw line + teeth
        c[24][x] = 'd'
        if x % 3 == 0:
            c[25][x] = 'b'
    _ell(c, 10, 16, 3, 3, 'o'); _ell(c, 20, 16, 3, 3, 'o')             # eye sockets
    c[15][9] = 'd'; c[15][19] = 'd'
    for x, y in ((5, 13), (6, 12), (24, 14), (25, 15), (14, 10), (17, 9)):   # barnacles
        c[y][x] = 'T'; c[y + 1][x] = 't'
    _ell(c, 26, 27, 4, 2, 'B')                                         # half-buried
    outline(c)
    return rows(c)


def hollow_oak():
    c = blank(32, 32)
    for y in range(12, 30):
        w = 4 + (y - 12) // 5
        for x in range(16 - w, 16 + w):
            c[y][x] = 'W' if x < 16 else 'w'
    _ell(c, 16, 22, 2, 4, 'o')                                         # hollow
    c[21][16] = 'y'
    for (x0, y0, x1, y1) in ((14, 13, 6, 4), (17, 13, 26, 3), (15, 12, 15, 1), (12, 16, 3, 12), (20, 16, 29, 10),
                             (6, 4, 3, 1), (26, 3, 29, 1), (22, 7, 25, 7)):
        line(c, x0, y0, x1, y1, 'w'); line(c, x0 + 1, y0, x1 + 1, y1, 'W')
    for x in range(8, 26):                                             # roots
        c[30][x] = 'w' if x % 3 else 'W'
    for x, y in ((6, 5), (26, 4)):                                     # hanging corpse-lights
        c[y + 1][x] = 'g'; c[y + 2][x] = 'G'; c[y + 3][x] = 'y'
    outline(c)
    return rows(c)


def monolith():
    c = blank(32, 32)
    for y in range(3, 30):
        lean = (30 - y) // 9
        for x in range(10 + lean, 22 + lean):
            c[y][x] = 'S' if x < 13 + lean else 's'
    for y in range(3, 7):
        for x in range(10, 24):
            if c[y][x] != '.':
                c[y][x] = 'A'                                          # snow cap
    for y, xs in ((10, (15, 16, 17)), (11, (16,)), (12, (14, 16, 18)), (13, (16,)), (14, (15, 17)), (16, (16,)),
                  (17, (15, 16, 17)), (19, (14, 18)), (20, (15, 16, 17))):
        for x in xs:
            c[y][x + 1] = 'c'
    c[12][17] = 'C'
    for x in range(7, 26):                                             # snow drift at the foot
        c[30][x] = 'A'; c[29][x] = 'A' if 9 < x < 24 else c[29][x]
    outline(c)
    return rows(c)


def god_hand():
    c = blank(32, 32)
    for y in range(18, 30):                                            # palm / wrist emerging from ash
        for x in range(9, 24):
            c[y][x] = 'V' if x < 13 else 'v'
    fingers = ((9, 6, 2), (13, 3, 3), (17, 2, 3), (21, 5, 3))
    for fx, top, w in fingers:
        for y in range(top, 19):
            for x in range(fx, fx + w):
                c[y][x] = 'V' if x == fx else 'v'
        c[top][fx] = 'o' if w == 2 else c[top][fx]
    for y in range(14, 22):                                            # thumb
        c[y][26 - (y - 14) // 2] = 'v'; c[y][25 - (y - 14) // 2] = 'v'
    for n, (x, y) in enumerate(((10, 22), (12, 21), (14, 23), (16, 22), (18, 24), (15, 12), (15, 9), (19, 15))):  # kintsugi
        c[y][x] = 'H'
    for y in range(6, 19, 4):
        c[y][14] = 'k'; c[y][18] = 'k'
    for x in range(5, 28):
        c[30][x] = 'k' if x % 2 else 'h'
    outline(c)
    return rows(c)


LANDMARKS = {'whale_skull': (whale_skull, 'shore'), 'hollow_oak': (hollow_oak, 'fen'),
             'monolith': (monolith, 'runeholt'), 'god_hand': (god_hand, 'godfall')}


def build_landmarks():
    cells, index = [], {}
    for name, (fn, biome) in LANDMARKS.items():
        g = fn()
        index[name] = {'i': len(cells), 'biome': biome}
        cells.append([[T if ch == '.' else hex_rgba(LPAL[ch]) for ch in r] for r in g])
    return cells, index


# ================================================================ the RotMG pass: 8x8 ground
# Each tile is an 8x8 painting (stored doubled): a flat base, a few specks of detail, crisp stone grout,
# simple animated water. Ground stays calm so the outlined actors pop off it.
_paint16 = paint
FLOORS = {'runefloor', 'runeglyph', 'marble', 'forge', 'chapelfloor', 'cobble'}
WALLS = {'forgewall', 'chapelwall', 'ribwall', 'hedge', 'bramble'}
WATERS = {'water', 'deep', 'shallows', 'bog', 'lava'}


# the Sunken Crypt and the Emberforge Depths: tiles from the sprite pack (tools/pack_sprites.py), 8x8 stored doubled
def _pack_tiles():
    import pack_sprites as ps
    C, E = ps.CRYPT_TILES, ps.EMBER_TILES
    return {'cryptfloor': (ps.CRYPT, [[C['floor_a']], [C['floor_a']], [C['floor_a']], [C['floor_b']]]), 'cryptwall': (ps.CRYPT, [[C['wall']]]),
            'cryptwater': (ps.CRYPT, [[C['water1'], C['water2'], C['water3']]]),
            'emberfloor': (ps.EMBER, [[E['floor_a']], [E['floor_a']], [E['floor_a']], [E['floor_b']]]), 'emberwall': (ps.EMBER, [[E['wall']]]),
            'emberlava': (ps.EMBER, [[E['lava1'], E['lava2'], E['lava3']]]),
            'carpet': (CARPET_PAL, [[CARPET[0]], [CARPET[0]], [CARPET[1]]])}


# a royal runner: crimson, a gold lozenge every tile, a finer weave between (8x8, tiles seamlessly)
CARPET_PAL = {'r': '#8E1E30', 'R': '#B02E40', 'd': '#661424', 'g': '#E8B848', 'G': '#B07A22'}
CARPET = [["rrrrdrrr",
           "rrrdgdrr",
           "rrdgRgdr",
           "rdgRrRgd",
           "rrdgRgdr",
           "rrrdgdrr",
           "rrrrdrrr",
           "RrrrrrrR"],
          ["rrrrdrrr",
           "rrrdGdrr",
           "rrdGRGdr",
           "rdGRrRGd",
           "rrdGRGdr",
           "rrrdGdrr",
           "rrrrdrrr",
           "RrrrrrrR"]]


PACK_TILES = _pack_tiles()
PACK_TILES.update(_D4.TILES)


def paint8(name, frame=0, v=0):
    if name in PACK_TILES:
        pal, variants = PACK_TILES[name]
        g = variants[v % len(variants)][frame % len(variants[v % len(variants)])]
        big = []
        for row in g:
            line2 = [hex_rgba(pal[c]) for c in row for _ in (0, 1)]
            big += [line2, list(line2)]
        return big
    b, d, l, e1, e2 = (hex_rgba(c) for c in PAL[name])
    r = random.Random(f'8:{name}:{v}')
    g = [[b] * 8 for _ in range(8)]
    P = lambda x, y, c: g[y % 8].__setitem__(x % 8, c)  # noqa: E731
    dm, lm = _mix(b, d, 0.55), _mix(b, l, 0.5)
    if name in WATERS:
        n = 1 if name == 'bog' else 2
        for k in range(n):                                       # a short wave crest drifting across
            x0, y0 = (k * 4 + frame * 1 + v * 3) % 8, (k * 4 + v * 2 + 1) % 8
            hi = e1 if name == 'lava' else l
            P(x0, y0, hi); P(x0 + 1, y0, hi)
            if name != 'lava':
                P(x0 + 1, y0 + 1, dm)
        if name == 'lava':
            P(r.randrange(8), r.randrange(8), e2 if frame % 2 else e1)
        if name == 'bog' and frame == (v % 3):
            P(r.randrange(8), r.randrange(8), e1)                # a bubble
        if name == 'shallows':
            P(r.randrange(8), r.randrange(8), e1)                # sand showing through
    elif name in FLOORS:                                         # flagstones: grout on two edges, a stone or two lighter
        for i in range(8):
            P(i, 7, dm); P(7, i, dm)
        if name in ('cobble', 'forge', 'chapelfloor'):
            for i in range(8):
                P(i, 3, dm)
            P(3, r.randrange(3), dm); P(5, 4 + r.randrange(3), dm)
        P(1 + r.randrange(4), 1 + r.randrange(2), lm)
        if name == 'runeglyph':
            pulse = (e2, hex_rgba('#CFFFFF'), e1)[frame % 3]
            for x, y in ((2, 2), (3, 3), (4, 2), (3, 4), (3, 5)):
                P(x, y, pulse)
        if name == 'forge' and frame == 1:
            P(r.randrange(7), r.randrange(7), e2)
        if name == 'chapelfloor' and v == 2:
            P(5, 5, e2)
    elif name in WALLS:                                          # bricks / ribs / leaves
        if name in ('hedge', 'bramble'):
            for k in range(5):
                P(r.randrange(8), r.randrange(8), l if k % 2 else d)
            if v == 1:
                P(r.randrange(8), r.randrange(8), e2)            # a flower
        else:
            for i in range(8):
                P(i, 3, d); P(i, 7, d)
            P(2, 0, d); P(2, 1, d); P(2, 2, d); P(6, 4, d); P(6, 5, d); P(6, 6, d)
            P(0, 0, l); P(4, 4, l)
    elif name == 'void':
        pass
    else:                                                        # open ground: a calm base with a few specks
        specks = {'grass': 4, 'sand': 2, 'fen': 4, 'mud': 3, 'snow': 2, 'ash': 3, 'obsidian': 2, 'goldvein': 2,
                  'dirt': 3, 'ice': 2, 'dune': 2, 'loam': 4, 'steppe': 4, 'quartz': 2, 'glassflat': 1}.get(name, 2) - (2 if v == 0 else 0)   # variant 0 is quieter ground
        for k in range(specks):
            x, y = r.randrange(8), r.randrange(8)
            if name in ('grass', 'fen', 'loam', 'steppe'):        # a blade: dark root, light tip
                P(x, y, dm); P(x, y - 1, lm)
            elif name in ('sand', 'dune'):
                P(x, y, lm); P(x + 1, y, lm)                     # a wind ripple
            elif name in ('mud', 'dirt', 'snow', 'ice'):
                P(x, y, lm)                                      # soft ground: only lighter specks, no dark holes
            else:
                P(x, y, lm if k % 2 else dm)
        if name == 'goldvein':
            P(r.randrange(8), r.randrange(8), e2 if frame % 3 == v % 3 else e1)
        if name == 'ash' and v % 3 == 0:
            P(r.randrange(8), r.randrange(8), e1 if frame % 2 else e2)   # an ember
        if name == 'grass' and v == 4:
            P(r.randrange(8), r.randrange(8), e2)                # a wildflower
        if name == 'ice' and frame == 1:
            P(r.randrange(8), r.randrange(8), e1)
        if name == 'glassflat':                                  # salt-glass: a hard glint that comes and goes
            P(r.randrange(8), r.randrange(8), e1 if frame == v % 2 else e2)
        if name == 'quartz':                                     # crystal ground: facets catch the light
            x, y = r.randrange(7), r.randrange(7)
            P(x, y, e1 if frame else e2); P(x + 1, y + 1, dm)
        if name == 'loam' and v == 3:
            P(r.randrange(8), r.randrange(8), e2)                # a fallen berry
        if name == 'steppe' and v == 4:
            P(r.randrange(8), r.randrange(8), e2)                # a crystal flower
        if name == 'dune' and v == 5:
            P(r.randrange(8), r.randrange(8), e2)                # a glint of glass in the sand
    big = []
    for row in g:
        line2 = [c for c in row for _ in (0, 1)]
        big += [line2, list(line2)]
    return big


paint = paint8


def build_edges():
    """Crisp stepped edges (in whole art pixels) where a higher-priority ground meets a lower one, plus foam."""
    cells, index = [], {}
    for name in PRIORITY:
        src = paint(name, 0, 0)
        index[name] = len(cells)
        r = random.Random('edge8' + name)
        bump = [r.choice((0, 0, 1)) for _ in range(8)]
        for direction in 'NESW':
            g = [[T] * 16 for _ in range(16)]
            for y in range(16):
                for x in range(16):
                    ax, ay = x // 2, y // 2
                    along, depth = {'N': (ax, ay), 'S': (ax, 7 - ay), 'W': (ay, ax), 'E': (ay, 7 - ax)}[direction]
                    if depth <= bump[along]:
                        g[y][x] = src[y][x]
            cells.append(g)
    foam_c, foam_l = hex_rgba('#C8EEFF'), hex_rgba('#7EC0E4')
    index['foam'] = len(cells)
    for f in range(3):
        for direction in 'NESW':
            g = [[T] * 16 for _ in range(16)]
            for y in range(16):
                for x in range(16):
                    ax, ay = x // 2, y // 2
                    along, depth = {'N': (ax, ay), 'S': (ax, 7 - ay), 'W': (ay, ax), 'E': (ay, 7 - ax)}[direction]
                    wob = (along + f) % 4
                    if depth == 0 and wob < 3:
                        g[y][x] = foam_c
                    elif depth == 1 and wob == 1:
                        g[y][x] = foam_l
            cells.append(g)
    return cells, index
