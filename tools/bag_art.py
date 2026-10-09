"""Our special loot bags (white, starfall, divine): 8x8 art stored doubled. Inspired by the feel of RotMG's white
bag, but our own shape: a pear-shaped silk pouch that settles down and to the LEFT, a silk tuft flaring up and to
the right like a little flame, and a ribbon knot at the neck with one tail falling across the front.

Roles: 1 2 3 silk tuft (light to shade) · k K knot (light, base) · s ribbon tail · h cloth highlight · l cloth
       m cloth shade · b underside · * glint
"""

SHAPE = [
    '...1121.',
    '...3232.',
    '..kKKk..',
    '..hlsm..',
    '.hllsmm.',
    'hlllllmb',
    'hllllmmb',
    '.llmmbb.',
]
assert all(len(r) == 8 for r in SHAPE) and len(SHAPE) == 8

BAGS = {
    # majestic pearl-white silk, tied with a blue ribbon
    'white': dict(pal={'1': '#FFFFFF', '2': '#EEF2FA', '3': '#C4CEE2', 'k': '#7CC4FF', 'K': '#2E86F0', 's': '#2E86F0',
                       'h': '#FFFFFF', 'l': '#EEF1F8', 'm': '#C8D0E0', 'b': '#98A4BC'}, glints=[]),
    # midnight silk with a gold cord and stars caught in the weave
    'starfall': dict(pal={'1': '#D4DEFF', '2': '#A4B6F4', '3': '#6A80D4', 'k': '#FFF0A0', 'K': '#F2C14E', 's': '#F2C14E',
                          'h': '#7A90E8', 'l': '#4C60C0', 'm': '#323E96', 'b': '#1E2668', '*': '#FFFFFF'},
                     glints=[(4, 10), (10, 11), (6, 13)]),
    # beyond mythic: cloth of gold with a crimson cord
    'divine': dict(pal={'1': '#FFFCEE', '2': '#FFE8A8', '3': '#E8B848', 'k': '#FF8A9A', 'K': '#E0283E', 's': '#E0283E',
                        'h': '#FFE89A', 'l': '#F4C450', 'm': '#D0962A', 'b': '#9A6416', '*': '#FFFFFF'},
                   glints=[(4, 10), (10, 11), (6, 13)]),
}


def _shade(hexc, k):
    r, g, b = (int(hexc[i:i + 2], 16) for i in (1, 3, 5))
    return '#%02X%02X%02X' % tuple(max(0, min(255, round(c * k))) for c in (r, g, b))


def grid(name):
    """16 rows of hex colours (None = transparent): the 8x8 art doubled,
    with the cloth darkening a little on every row like RotMG's soft gradient"""
    B = BAGS[name]
    g = [[None] * 16 for _ in range(16)]
    for y in range(16):
        for x in range(16):
            ax, ay = x // 2, y // 2
            ch = SHAPE[ay][ax]
            if ch == '.':
                continue
            c = B['pal'][ch]
            if ch not in '123kK':
                c = _shade(c, 1 - 0.009 * (y - 6))     # the body's top-to-bottom gradient
            g[y][x] = c
    for x, y in B['glints']:
        if g[y][x]:
            g[y][x] = B['pal']['*']
    return g
