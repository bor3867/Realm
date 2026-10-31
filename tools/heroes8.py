"""The classes as classic RotMG 8x8 sprites, every one on the same egg-shaped body (2026-10-31).

The user's rule, strict: one compact, rounded, egg-like body for every class, from RotMG's own (their Rogue, Archer and
Priest): a cap, a head, the widest middle, a rounded bottom, two short legs. Classes differ only in the colours and
what they wear, never in shape. So the body is a fixed mask (TEMPLATE), and a class is a list of colours that fill it,
row by row (it cannot draw outside it: build() checks every frame against the mask).

The weapon is a layer of its own, by family (sword, dagger, bow, staff, wand), coloured by the class: held in column
7, beside the body. Attacking front or back, it rises and flashes; side-on the frame is twice as wide (16x8 art) so
the weapon reaches out ahead, as RotMG's own attack frames do. The body never changes for an attack. Walking moves
only the two legs. No shading: flat colour; the game draws the thin outline (src/outline.js). Pixels are stored
doubled (16x16 frames), so every 2x2 block is one colour.

    py tools/heroes8.py
"""
import json
import os

from pixlib import hex_rgba, write_png

ROOT = os.path.join(os.path.dirname(__file__), '..', 'art', 'sprites', 'player')
SKIN = {'s': '#F7E26B', 'e': '#0C0C0C'}            # RotMG's own: a pale yellow face, two pure black eyes

# ---- the one body every class shares: '#' is body, '.' is not. Rows 1-6 the solid egg (a cap, the head, the widest
# middle, a rounded bottom), row 7 the two legs. Row 0 is left clear (a weapon's tip may use it)
TEMPLATE = [
    '........',
    '..###...',
    '.#####..',
    '.#####..',
    '#######.',
    '#######.',
    '.#####..',
    '.##.##..',
]
SPAN = [[x for x in range(8) if r[x] == '#'] for r in TEMPLATE]   # the body's cells, row by row
LEGS_WALK = [[1, 2, 4, 5], [2, 4, 5], [1, 2, 4]]                   # standing, then each leg in turn lifted (row 7 only)

# ---- the weapon layer, by family. Letters: w the blade / shaft / limb, W the tip, edge or gem, h the grip.
# Idle and front/back attack: an 8x8 overlay. Side attack: two 16x8 overlays, the hand at column 7, the weapon ahead.
WEAPON = {
    'sword': {
        'idle': {(7, 0): 'W', (7, 1): 'w', (7, 2): 'w', (7, 3): 'w', (7, 4): 'h', (7, 5): 'h'},
        'up': {(7, 0): 'W', (7, 1): 'W', (7, 2): 'w', (7, 3): 'h', (7, 4): 'h'},
        'side': [{(7, 5): 'h', (8, 4): 'w', (9, 3): 'w', (10, 2): 'w', (11, 1): 'W'},
                 {(7, 5): 'h', (8, 5): 'w', (9, 5): 'w', (10, 5): 'w', (11, 5): 'w', (12, 5): 'W', (10, 4): 'W', (11, 6): 'W'}],
    },
    'dagger': {
        'idle': {(7, 2): 'W', (7, 3): 'w', (7, 4): 'h', (7, 5): 'h'},
        'up': {(7, 1): 'W', (7, 2): 'w', (7, 3): 'h', (7, 4): 'h'},
        'side': [{(7, 5): 'h', (8, 5): 'w', (9, 5): 'W'},
                 {(7, 5): 'h', (8, 5): 'w', (9, 5): 'w', (10, 5): 'w', (11, 5): 'w', (12, 5): 'W'}],
    },
    'bow': {
        'idle': {(6, 1): 'w', (7, 2): 'w', (7, 3): 'w', (7, 4): 'w', (7, 5): 'w', (6, 6): 'w'},
        'up': {(6, 0): 'w', (7, 1): 'w', (7, 2): 'w', (7, 3): 'w', (7, 4): 'w', (6, 5): 'W'},
        # (held out: drawn, an arrow across it; loosed, the arrow away ahead and the bow still in hand)
        'side': [{(8, 2): 'w', (9, 3): 'w', (9, 4): 'w', (9, 5): 'w', (9, 6): 'w', (8, 7): 'w', (7, 5): 'h', (8, 5): 'h', (10, 5): 'W'},
                 {(8, 2): 'w', (9, 3): 'w', (9, 4): 'w', (9, 5): 'w', (9, 6): 'w', (8, 7): 'w', (7, 5): 'h', (12, 5): 'h', (13, 5): 'h', (14, 5): 'W'}],
    },
    'staff': {
        'idle': {(7, 0): 'W', (7, 1): 'h', (7, 2): 'h', (7, 3): 'h', (7, 4): 'h', (7, 5): 'h', (7, 6): 'h'},
        'up': {(7, 0): 'W', (6, 0): 'W', (7, 1): 'W', (7, 2): 'h', (7, 3): 'h', (7, 4): 'h', (7, 5): 'h'},
        'side': [{(8, 0): 'W', (8, 1): 'h', (8, 2): 'h', (8, 3): 'h', (8, 4): 'h', (8, 5): 'h', (8, 6): 'h', (7, 5): 'h'},
                 {(7, 5): 'h', (8, 5): 'h', (9, 4): 'h', (10, 4): 'h', (11, 3): 'h', (12, 2): 'W', (13, 2): 'W', (12, 1): 'W', (13, 1): 'W'}],
    },
    'wand': {
        'idle': {(7, 2): 'W', (7, 3): 'h', (7, 4): 'h', (7, 5): 'h'},
        'up': {(7, 1): 'W', (6, 1): 'W', (7, 2): 'h', (7, 3): 'h', (7, 4): 'h'},
        'side': [{(7, 5): 'h', (8, 4): 'h', (9, 3): 'W'},
                 {(7, 5): 'h', (8, 5): 'h', (9, 5): 'h', (10, 5): 'W', (11, 4): 'W', (11, 6): 'W', (12, 5): 'W'}],
    },
}

# ---- the classes: the colours that fill the body, row by row, for the front (F), side facing right (S) and back (B).
# Seven strings, one per body row 1-7, as long as that row of the template (3, 5, 5, 7, 7, 5 and the 4 leg cells).
# Front: the eyes at row 3, columns 2 and 4. pal: the colours, and w/W/h_ the weapon's
C = {}
C['brawler'] = dict(file='forgefist', weapon='sword', pal={'h': '#7A4A2A', 'r': '#DB0416', 'k': '#D8C050', 'b': '#7A4A2A', 'B': '#3A2414', 'l': '#3A2414',
                                                          'w': '#B9B9B9', 'W': '#FFFFFF', 'h_': '#A29446'},
    F=['hhh', 'rrrrr', 'seses', 'sskkkss', 'sBBBBBs', 'bbbbb', 'llll'],
    S=['hhh', 'rrrrr', 'hhses', 'rssssss', 'sBBBBBs', 'bbbbb', 'llll'],
    B=['hhh', 'rrrrr', 'hhhhh', 'srrssss', 'sBBBBBs', 'bbbbb', 'llll'])
C['forge_knight'] = dict(file='anvilheart', weapon='sword', pal={'i': '#C8D2E4', 'I': '#7A86A0', 'k': '#0C0C0C', 'r': '#DB0416', 'd': '#F2C14E', 'l': '#3A3E50',
                                                                 'w': '#DDDDDD', 'W': '#FFFFFF', 'h_': '#C98A22'},
    F=['iii', 'iiiii', 'ikkki', 'iirrrii', 'irrdrri', 'IrrrI', 'llll'],
    S=['iii', 'iiiii', 'iiikk', 'iiirrii', 'iirdrri', 'IIrrI', 'llll'],
    B=['iii', 'iiiii', 'iiiii', 'iiIIIii', 'iIIIIIi', 'IiiiI', 'llll'])
C['priest'] = dict(file='heliarch', weapon='wand', pal={'y': '#F2C14E', 'f': '#F4F4F4', 'F': '#DDDDDD', 'o': '#E07A20', 'l': '#B8B8B8',
                                                       'w': '#8A5A2A', 'W': '#4AA8F0', 'h_': '#8A5A2A'},
    F=['fff', 'yyyyy', 'seses', 'fffffff', 'yooooof', 'FFFFF', 'llll'],
    S=['fff', 'yyyyy', 'ffses', 'fffffff', 'foooooy', 'FFFFF', 'llll'],
    B=['fff', 'yyyyy', 'fffff', 'fffffff', 'yooooof', 'FFFFF', 'llll'])
C['summoner'] = dict(file='reliquarian', weapon='staff', pal={'K': '#6A48B0', 'P': '#3E2A78', 'k': '#140C20', 'c': '#5EF0A8', 'f': '#E8E0C8', 'l': '#2A1A50',
                                                             'w': '#7A6A52', 'W': '#7CFFB0', 'h_': '#7A6A52'},
    F=['KKK', 'KkkkK', 'KckcK', 'KKKKKKK', 'fKPPPKf', 'KKKKK', 'llll'],
    S=['KKK', 'KKKkk', 'KKKkc', 'KKKKKKK', 'KKPPPKf', 'KKKKK', 'llll'],
    B=['KKK', 'KKKKK', 'KKKKK', 'KKKcKKK', 'KKPPPKK', 'KKKKK', 'llll'])
C['harpooner'] = dict(file='wreckwhaler', weapon='bow', pal={'Y': '#FFD030', 'y': '#B88410', 'r': '#DB0416', 'N': '#3058A0', 'l': '#1E2A48',
                                                            'w': '#8A6038', 'W': '#DDDDDD', 'h_': '#F0E6D0'},
    F=['YYY', 'YYYYY', 'seses', 'YrrrrrY', 'YNNyNNY', 'NNNNN', 'llll'],
    S=['YYY', 'YYYYY', 'YYses', 'YYrrrrY', 'YYNyNNY', 'NNNNN', 'llll'],
    B=['YYY', 'YYYYY', 'YYYYY', 'YYYYYYY', 'YYYYYYY', 'NNNNN', 'llll'])
C['duelist'] = dict(file='mirrorknight', weapon='dagger', pal={'m': '#D04890', 'M': '#8A2860', 'p': '#F4F0F8', 'y': '#FFD650', 'l': '#4A1A38',
                                                              'w': '#DDDDDD', 'W': '#FFFFFF', 'h_': '#C98A22'},
    F=['mpm', 'mmmmm', 'seses', 'mmmmmmm', 'mmyyymm', 'MMMMM', 'llll'],
    S=['pmm', 'mmmmm', 'mmses', 'mmmmmmm', 'mmmyymm', 'MMMMM', 'llll'],
    B=['mpm', 'mmmmm', 'mmmmm', 'mmmmmmm', 'mmMMMmm', 'MMMMM', 'llll'])
C['stormwright'] = dict(file='kitehermit', weapon='staff', pal={'t': '#E8C878', 'T': '#B8964A', 'f': '#F4F4F8', 'u': '#3A7AE8', 'U': '#2A58B0', 'l': '#4A3A2A',
                                                               'w': '#C87A3A', 'W': '#8AF6FF', 'h_': '#C87A3A'},
    F=['ttt', 'TtttT', 'seses', 'uufffuu', 'uuufuuu', 'UUUUU', 'llll'],
    S=['ttt', 'TtttT', 'Tsses', 'uuuuffu', 'uuuuufu', 'UUUUU', 'llll'],
    B=['ttt', 'TtttT', 'TTTTT', 'uuuuuuu', 'uuuuuuu', 'UUUUU', 'llll'])
C['clockmaker'] = dict(file='horologist', weapon='wand', pal={'k': '#2E2836', 'c': '#8AE6FF', 'y': '#F2C14E', 'b': '#A0582A', 'B': '#5A3420', 'g': '#F2C14E', 'H': '#5A3A22', 'l': '#2A1A10',
                                                             'w': '#B0B0C0', 'W': '#FFE08A', 'h_': '#B0B0C0'},
    F=['kkk', 'kkkkk', 'ycscy', 'bbbbbbb', 'bbbgbbb', 'BBBBB', 'llll'],
    S=['kkk', 'kkkkk', 'HHscy', 'bbbbbbb', 'bbbbgbb', 'BBBBB', 'llll'],
    B=['kkk', 'kkkkk', 'HHHHH', 'bbbbbbb', 'bbbbbbb', 'BBBBB', 'llll'])
C['runeblade'] = dict(file='runeblade', weapon='sword', pal={'i': '#B9C2D6', 'I': '#5E6680', 'c': '#46F5D6', 'r': '#C83A3A', 'l': '#2E3240',
                                                            'w': '#C8F8FF', 'W': '#46F5D6', 'h_': '#C98A22'},
    F=['rrr', 'iiiii', 'icIci', 'riiiiir', 'riIIIir', 'IiiiI', 'llll'],
    S=['rrr', 'iiiii', 'iiIcI', 'rriiiii', 'rriIIIi', 'IiiiI', 'llll'],
    B=['rrr', 'iiiii', 'iiiii', 'rrrrrrr', 'rrrrrrr', 'rrrrr', 'llll'])
C['hexweaver'] = dict(file='hexweaver', weapon='staff', pal={'p': '#9058E0', 'P': '#5A2E9A', 'k': '#140C20', 'y': '#FFD650', 'l': '#3A1A60',
                                                            'w': '#7A5A3A', 'W': '#8AF6FF', 'h_': '#7A5A3A'},
    F=['ppp', 'pkkkp', 'pykyp', 'ppppppp', 'pPyyyPp', 'PPPPP', 'llll'],
    S=['ppp', 'pppkk', 'pppky', 'ppppppp', 'ppPyyPp', 'PPPPP', 'llll'],
    B=['ppp', 'ppppp', 'ppppp', 'ppppppp', 'ppPyPpp', 'PPPPP', 'llll'])
C['ranger'] = dict(file='thornhood', weapon='bow', pal={'g': '#A0CC2A', 'G': '#6C8C1E', 'b': '#8A4E1A', 'q': '#9D9D9D', 'r': '#DB0416', 'L': '#8A5A30', 'l': '#4A2A10',
                                                       'w': '#A86A2A', 'W': '#B9B9B9', 'h_': '#F0EAD8'},
    F=['GgG', 'GgggG', 'seses', 'GLLLLLG', 'sbbqbbs', 'GGGGG', 'llll'],
    S=['GgG', 'rGggg', 'bGses', 'GLLLLLG', 'sbbbqbs', 'GGGGG', 'llll'],
    B=['GgG', 'GgrgG', 'GgbgG', 'GLbLLLG', 'sbbbbbs', 'GGGGG', 'llll'])


def body(rows, legs=0):
    """a class's colours poured into the template: an 8x8 grid ('.' outside the body)"""
    g = [['.'] * 8 for _ in range(8)]
    for y in range(1, 8):
        cells = SPAN[y]
        cols = rows[y - 1]
        assert len(cols) == len(cells), (y, cols)
        for x, ch in zip(cells, cols):
            if y == 7 and x not in LEGS_WALK[legs]:
                continue                                 # (a lifted leg)
            g[y][x] = ch
    return [''.join(r) for r in g]


def check(g, cls):
    """every body pixel inside the template (the weapon layer is not body: it is laid on afterwards)"""
    for y, r in enumerate(g):
        for x, ch in enumerate(r[:8]):
            assert ch == '.' or TEMPLATE[y][x] == '#', f'{cls}: a pixel outside the body at ({x},{y})'


def with_weapon(g, layer):
    rows = [list(r) for r in g]
    for (x, y), ch in layer.items():
        if 0 <= x < len(rows[0]) and 0 <= y < 8 and (rows[y][x] == '.' or x >= 8):
            rows[y][x] = 'Q' if ch == 'h' else ch        # (Q: the grip's colour, h_ in the palette; never over the body)
    return [''.join(r) for r in rows]


def wide(g):
    return [r + '.' * 8 for r in g]


def lying(g):
    """fallen over: the figure rotated onto its side, lying along the ground"""
    rot = [''.join(g[7 - x][y] for x in range(8)) for y in range(8)]      # 90 degrees clockwise
    rows = [r for r in rot if r.strip('.')]
    return ['.' * 8] * (8 - len(rows)) + rows


def squash(g):
    rows = [r for i, r in enumerate(g) if i % 3 != 1 or i == 7]
    return ['.' * 8] * (8 - len(rows)) + rows


def build(cls, D):
    P = dict(D['pal'])
    P['Q'] = P.pop('h_')
    pal = {k: hex_rgba(v) for k, v in {**SKIN, **P}.items()}
    Wp = WEAPON[D['weapon']]
    for v in ('F', 'S', 'B'):
        for k in range(3):
            check(body(D[v], k), cls)
    Fi = lambda k=0: with_weapon(body(D['F'], k), Wp['idle'])
    Si = lambda k=0: with_weapon(body(D['S'], k), Wp['idle'])
    Bi = lambda k=0: with_weapon(body(D['B'], k), Wp['idle'])
    walk = lambda mk: [mk(0), mk(1), mk(0), mk(2)]
    FA = [with_weapon(body(D['F']), Wp['up']), Fi()]
    BA = [with_weapon(body(D['B']), Wp['up']), Bi()]
    SA = [with_weapon(wide(body(D['S'])), L) for L in Wp['side']]
    rows = [
        [Fi(), Fi()] + walk(Fi),
        [Si(), Si()] + walk(Si),
        [Bi(), Bi()] + walk(Bi),
        FA + BA,
        [FA[0], FA[0], Fi(), Fi()],
        [Fi(), squash(Fi()), lying(Fi()), lying(Fi())],
    ]
    anims = {
        'front_idle': (0, 0, 2, 3), 'front_walk': (0, 2, 4, 8), 'side_idle': (1, 0, 2, 3), 'side_walk': (1, 2, 4, 8),
        'back_idle': (2, 0, 2, 3), 'back_walk': (2, 2, 4, 8),
        'front_attack': (3, 0, 2, 10), 'back_attack': (3, 2, 2, 10),
        'ability': (4, 0, 3, 8), 'hit': (4, 3, 1, 1), 'death': (5, 0, 4, 6),
    }
    COLS = 6
    H8 = (len(rows) + 1) * 8                                # (+1: the side attack's row of wide frames)
    art = [[(0, 0, 0, 0)] * (COLS * 8) for _ in range(H8)]
    put = lambda g, ox, oy: [art[oy + y].__setitem__(ox + x, pal[g[y][x]]) for y in range(len(g)) for x in range(len(g[y])) if g[y][x] != '.']
    for r, row in enumerate(rows):
        for c, g in enumerate(row):
            put(g, c * 8, r * 8)
    for k, g in enumerate(SA):                              # the side attack: two 16x8 frames on the last row
        put(g, k * 16, len(rows) * 8)
    out = [[art[y // 2][x // 2] for x in range(COLS * 16)] for y in range(H8 * 2)]
    d = os.path.join(ROOT, cls)
    os.makedirs(d, exist_ok=True)
    write_png(os.path.join(d, D['file'] + '_sheet.png'), out)
    A = {k: {'row': a, 'col': b, 'frames': n, 'fps': fps, 'loop': k.endswith(('idle', 'walk'))} for k, (a, b, n, fps) in anims.items()}
    # w: a wide frame (32 px, the body in its left half; the game anchors it at px, the body's middle)
    A['side_attack'] = {'row': len(rows), 'col': 0, 'frames': 2, 'fps': 10, 'loop': False, 'w': 32, 'px': 8}
    guide = {'image': D['file'] + '_sheet.png', 'frameWidth': 16, 'frameHeight': 16, 'columns': COLS, 'rows': len(rows) + 1,
             'art': 8, 'pivot': {'x': 8, 'y': 15}, 'animations': A}
    json.dump(guide, open(os.path.join(d, D['file'] + '_sheet.json'), 'w', newline='\n'), indent=2)


if __name__ == '__main__':
    for cls, D in C.items():
        build(cls, D)
    print('built', list(C), '- every body inside the one template')
