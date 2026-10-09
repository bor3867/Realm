"""Dungeon puzzles and realm waypoints (16x16 cells, drawn in 2px strokes so they survive the RotMG 8x8 pass).

    seal_gate (2f)      a sealed portcullis with a glowing sigil: the boss door, opens when the dungeon's seals break
    gate_open           the raised gate: a stone arch with the bars pulled up
    lever_off/lever_on  a wall lever: pull it (walk into it)
    plate_off/plate_on  a pressure plate set in the floor
    rune_off/rune_on(2f) a rune stone: dim, then lit
    weak_wall           a cracked, crumbling block: shoot it to break through
    mystery_altar (2f)  a black altar with a floating question-orb
    waypoint/waypoint_on (2f)  a standing obelisk: dark until discovered, then its crystal burns

PROPS: name -> [(grid, palette), ...]
"""
from drawkit import Cv

PAL = {
    's': '#3A3648', 'S': '#5E5A72', 'L': '#9A96B0', 'k': '#1E1A28',      # stone
    'i': '#4A4A58', 'I': '#8A8AA0',                                       # iron
    'g': '#C98A22', 'G': '#F2C14E', 'Y': '#FFF0A0',                       # gold light
    'c': '#2A9AC8', 'C': '#8AF0FF', 'W': '#FFFFFF',                       # rune light
    'r': '#8C1A2A', 'R': '#FF4A5A', 'p': '#5A2A8A', 'P': '#B888FF',
    'w': '#5A4030', 'v': '#2A2232', 'o': '#160F14',
}


def seal_gate(f):
    c = Cv()
    c.rect(0, 0, 15, 15, 'k')
    c.rect(0, 0, 1, 15, 'S'); c.rect(14, 0, 15, 15, 'S'); c.rect(0, 0, 15, 1, 'L')     # the stone frame
    for x in (3, 7, 11):                                                               # iron bars
        c.rect(x, 2, x + 1, 15, 'i'); c.rect(x, 2, x, 15, 'I')
    c.rect(2, 7, 13, 8, 'i'); c.rect(2, 7, 13, 7, 'I')
    c.ell(7.5, 8, 3.2, 3.2, 'r' if f == 0 else 'R'); c.ell(7.5, 8, 1.6, 1.6, 'R' if f == 0 else 'Y')   # the seal
    return c.done()


def gate_open():
    c = Cv()
    c.rect(0, 0, 1, 15, 'S'); c.rect(14, 0, 15, 15, 'S'); c.rect(0, 0, 15, 3, 'L'); c.rect(0, 2, 15, 3, 'S')
    for x in (3, 7, 11):
        c.rect(x, 4, x + 1, 5, 'i')                                                     # the bar tips, drawn up
    return c.done()


def lever(on):
    c = Cv()
    c.rect(4, 10, 11, 15, 'S'); c.rect(4, 10, 11, 11, 'L'); c.rect(5, 14, 10, 15, 's')   # the base
    if on:
        [c.ln(6 + d, 11, 11 + d, 4, 'I' if d == 2 else 'i') for d in range(3)]; c.ell(12.5, 3.5, 2.6, 2.6, 'G'); c.rect(12, 2, 12, 3, 'Y')
    else:
        [c.ln(7 + d, 11, 2 + d, 4, 'I' if d == 0 else 'i') for d in range(3)]; c.ell(3, 3.5, 2.6, 2.6, 'r'); c.rect(2, 2, 3, 3, 'R')
    return c.done()


def plate(on):
    c = Cv()
    c.rect(2, 9, 13, 14, 's'); c.rect(3, 10, 12, 13, 'S' if not on else 'g')
    c.rect(3, 10, 12, 10, 'L' if not on else 'Y')
    c.rect(6, 11, 9, 12, 'k' if not on else 'G')
    return c.done()


def rune(on, f=0):
    c = Cv()
    c.ell(7.5, 14, 5, 1.6, 'v')
    c.trap(3, 14, 5, 10, 3, 12, 'S'); c.rect(4, 4, 6, 13, 'L')
    glow, hi = ('c', 'C') if not on else (('C', 'W') if f == 0 else ('C', 'C'))
    if not on:
        glow, hi = 's', 'k'
    c.rect(7, 6, 8, 11, glow); c.rect(5, 8, 10, 9, glow); c.p(7, 6, hi); c.p(8, 11, hi)
    return c.done(late=[(7, 2, 'C'), (11, 4, 'W')] if on and f else [])


def weak_wall():
    c = Cv()
    c.rect(0, 1, 15, 15, 'S'); c.rect(0, 1, 15, 2, 'L')
    for y in (6, 11):
        c.rect(0, y, 15, y, 's')
    for x, y in ((5, 3), (11, 7), (3, 8), (8, 12)):
        c.rect(x, y, x, y + 2, 's')
    c.ln(4, 3, 9, 9, 'k'); c.ln(9, 9, 7, 14, 'k'); c.ln(9, 9, 13, 11, 'k')              # the crack
    c.rect(1, 14, 3, 15, 'k'); c.rect(12, 14, 14, 15, 's')                             # rubble at its foot
    return c.done()


def mystery_altar(f):
    c = Cv()
    c.rect(2, 9, 13, 15, 'k'); c.rect(2, 9, 13, 10, 'v'); c.rect(4, 12, 11, 13, 'p')
    by = 3 - f
    c.ell(7.5, by + 2, 3.6, 3.4, 'p'); c.ell(7, by + 1.5, 2, 2, 'P')
    return c.done(late=[(7, by + 1, 'W'), (3, by, 'P'), (12, by + 3, 'P')] if f else [(7, by + 1, 'W')])


def waypoint(on, f=0):
    c = Cv()
    c.ell(7.5, 14.5, 6, 1.5, 'v')
    c.trap(5, 15, 6, 9, 4, 11, 'S'); c.rect(5, 6, 6, 14, 'L')                          # the obelisk
    c.rect(4, 13, 11, 15, 's')
    if on:
        c.ell(7.5, 3, 2.4, 2.8, 'C' if f == 0 else 'c'); c.rect(7, 2, 8, 3, 'W')        # its burning crystal
        c.rect(7, 8, 8, 11, 'C')
        return c.done(late=[(3, 1, 'C'), (12, 4, 'W')] if f else [(12, 1, 'C')])
    c.ell(7.5, 3, 2.4, 2.8, 'k'); c.rect(7, 2, 7, 3, 's')
    c.rect(7, 8, 8, 11, 's')
    return c.done()


PROPS = {
    'seal_gate': [(seal_gate(0), PAL), (seal_gate(1), PAL)],
    'gate_open': [(gate_open(), PAL)],
    'lever_off': [(lever(False), PAL)], 'lever_on': [(lever(True), PAL)],
    'plate_off': [(plate(False), PAL)], 'plate_on': [(plate(True), PAL)],
    'rune_off': [(rune(False), PAL)], 'rune_on': [(rune(True, 0), PAL), (rune(True, 1), PAL)],
    'weak_wall': [(weak_wall(), PAL)],
    'mystery_altar': [(mystery_altar(0), PAL), (mystery_altar(1), PAL)],
    'waypoint': [(waypoint(False), PAL)], 'waypoint_on': [(waypoint(True, 0), PAL), (waypoint(True, 1), PAL)],
}


# ---- the sprite pack's dungeon props: crypt candles and forge vents (8x8, doubled; they flicker)
def _pack_props():
    import pack_sprites as ps
    dbl = lambda g: [''.join(c * 2 for c in r) for r in g for _ in (0, 1)]  # noqa: E731
    return {'crypt_candle': [(dbl(ps.CRYPT_TILES['candle1']), ps.CRYPT), (dbl(ps.CRYPT_TILES['candle2']), ps.CRYPT)],
            'ember_vent': [(dbl(ps.EMBER_TILES['vent1']), ps.EMBER), (dbl(ps.EMBER_TILES['vent2']), ps.EMBER)]}


PROPS.update(_pack_props())
