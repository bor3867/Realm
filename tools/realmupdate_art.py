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


PORTALS = {'frostveil': _frostveil}
