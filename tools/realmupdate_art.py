"""Realm Update: art the bundle didn't bring, drawn in the game's own style (16x16 portals, 3 frames)."""
import portals as _PT


def _frostveil(f):
    """Frostveil Hollows: a pointed arch of ice (lit on the left, shadowed on the right) round a cold swirl,
    crystal spikes at its feet, a drift of snow"""
    c = _PT.Cv()
    for y in range(16):
        for x in range(16):
            outer = 2 <= x <= 13 and y >= 1 + abs(x - 7.5) * 0.6
            inner = 4 <= x <= 11 and y >= 4.2 + abs(x - 7.5) * 0.6
            if outer and not inner and y <= 14:
                c.p(x, y, 'C' if x <= 4 else 't' if x >= 11 else 'T')
    c.swirl(7.5, 9.8, 3.4, 5.0, ['Q', 'C', 'c', 'w'], f, arms=3)
    for x, y in ((1, 13), (1, 12), (14, 13), (14, 11), (14, 12)):      # crystal spikes
        c.p(x, y, 'C' if (x + y + f) % 3 else 'Q')
    c.p(7, 1, 'Q' if f == 1 else 'C'); c.p(8, 1, 'Q' if f == 2 else 'C')   # a glint at the point
    for x in range(1, 15):                                             # drifted snow at the foot
        c.p(x, 15, 'Q' if (x + f) % 5 else 'T'); c.p(x, 14, 'Q' if x < 4 or x > 11 else c.g[14][x])
    return c.done()


def _mirerot(f):
    """Mirerot Grotto: a ring of mushroom caps round a green-violet spore swirl, a spore drifting up"""
    c = _PT.Cv()
    c.swirl(7.5, 9.0, 4.6, 5.4, ['C', 'V', 'v', 'q'], f, arms=2)
    for k, (x, y) in enumerate(((2, 6), (1, 10), (3, 13), (12, 13), (14, 10), (13, 6), (5, 3), (10, 3))):
        cap = 'p' if k % 2 else 'R'
        for dx in (-1, 0, 1):
            c.p(x + dx, y, cap)
        c.p(x, y + 1, 'B')
        c.p(x, y - 1, cap if (k + f) % 3 else 'P')
    c.p(7 + (f % 2), 1 - (f // 2), 'C')                        # a spore drifting up out of it
    for x in range(1, 15):
        c.p(x, 15, 't' if (x + f) % 3 else 'T')
    return c.done()


def _astral(f):
    """The Astral Observatory: a brass armillary ring round a violet swirl flecked with stars, tilted, turning"""
    import math
    c = _PT.Cv()
    c.swirl(7.5, 8.0, 4.0, 4.6, ['Q', 'V', 'v', 'q'], f, arms=3)
    for k in range(40):                                     # the ring: an ellipse of brass, its near side bright
        a = k / 40 * math.tau + f * 0.2
        x, y = 7.5 + math.cos(a) * 6.6, 8 + math.sin(a) * 3.4 - math.cos(a) * 1.6
        c.p(round(x), round(y), 'G' if math.sin(a) > 0 else 'g')
    for x, y in ((2, 2), (13, 3), (12, 13), (3, 12)):        # stars, twinkling in turn
        c.p(x, y, 'Q' if (x + y + f) % 3 else 'C')
    for x in range(5, 11):                                   # its brass foot
        c.p(x, 15, 'g'); c.p(x, 14, 'G' if x in (5, 10) else c.g[14][x])
    return c.done()


def _sandscour(f):
    """Sandscour Tomb: a pyramid's doorway of sandstone round a golden swirl, a scarab over the lintel"""
    c = _PT.Cv()
    for y in range(1, 16):                                  # the pyramid: a triangle of sandstone, lit on its left face
        half = (y - 1) * 0.5 + 0.6
        for x in range(16):
            if abs(x - 7.5) <= half:
                c.p(x, y, 'B' if x < 7.5 - half + 2 else 'b' if x < 7.5 else 'g')
    c.swirl(7.5, 11.2, 2.8, 3.9, ['W', 'Y', 'G', 'g'], f, arms=2)
    for x in range(4, 12):                                  # the lintel and the doorway's frame
        c.p(x, 7, 'k')
    c.p(7, 5, 'G'); c.p(8, 5, 'G'); c.p(6, 6, 'g' if f % 2 else 'Y'); c.p(9, 6, 'Y' if f % 2 else 'g')   # a scarab, its legs twitching
    for x in range(0, 16):
        c.p(x, 15, 'B' if (x + f) % 3 else 'b')
    return c.done()


PORTALS = {'frostveil': _frostveil, 'mirerot': _mirerot, 'astral': _astral, 'sandscour': _sandscour}

# ---- tiles the bundle didn't bring (8x8, the dungeons4 format: palette, [variants[frames[rows]]])
_BOARD = ['bbbbcbbb', 'ccccbcec', 'aaaaaaaa', 'bbcbbbbb', 'cbcccccb', 'aaaaaaaa', 'bbbbbcbb', 'ccccccbc']
TILES = {
    # a boardwalk plank over the bog: weathered boards, dark gaps between them, moss creeping onto one
    'mrboard': ({'a': '#2A1C0E', 'b': '#8A6E44', 'c': '#B0925C', 'd': '#5A8A3A', 'e': '#D8C08A'},
                [[_BOARD], [[r.replace('b', 'd', 1) if i in (3, 6) else r for i, r in enumerate(_BOARD)]]]),
}
