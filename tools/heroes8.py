"""The classes as classic RotMG 8x8 sprites, every one on the same egg-shaped body (2026-10-31).

The user's rule, strict: one compact, rounded, egg-like body for every class, from RotMG's own (their Rogue, Archer and
Priest), to the user's exact rows: a 3-pixel cap, three 5-pixel rows, two 7-pixel rows (the arms), one 5-pixel row,
and a one-pixel leg under each end of it; or, for the robed classes, the same
body in a robe that keeps its width to the ground. Classes differ only in the colours and what they wear, never in
shape. So the bodies are fixed masks (TEMPLATES), and a class is a list of colours that fill one, row by row (it cannot
draw outside it: build() checks every frame against the mask).

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

# ---- the two bodies, to the user's exact spec (2026-10-31): a 3-pixel cap; three 5-pixel rows (the head); two
# 7-pixel rows (the arms, and the hand that holds the weapon); one 5-pixel row; then the legs, one pixel at each end of
# that last row. The robe: the same down to the arms, then 7 wide to the ground over the legs. '#' is body. Weapons and
# shields are layers of their own and may take pixels outside it
TEMPLATES = {
    'body': ['..###...', '.#####..', '.#####..', '.#####..', '#######.', '#######.', '.#####..', '.#...#..'],
    'robe': ['..###...', '.#####..', '.#####..', '.#####..', '#######.', '#######.', '#######.', '#######.'],
}
SPANS = {k: [[x for x in range(8) if r[x] == '#'] for r in T] for k, T in TEMPLATES.items()}
# walking moves only the bottom row: a leg lifted in turn; a robe's hem sways, one edge then the other
STEP = {'body': [[1, 5], [5], [1]], 'robe': [list(range(7)), list(range(1, 7)), list(range(6))]}

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

# ---- the classes: their body ('body' or 'robe') and the colours that fill it, row by row, for the front (F), side
# facing right (S) and back (B). Eight strings, one a row, as long as that row of the template (3, 5, 5, 5, 7, 7, then
# 5 and the two legs, or 7 and the 7-wide hem). Front: the eyes in row 2, columns 2 and 4. pal: the colours, and
# w/W/h_ the weapon's
C = {}
C['brawler'] = dict(file='forgefist', shape='body', weapon='sword', pal={'h': '#7A4A2A', 'r': '#DB0416', 'k': '#D8C050', 'b': '#7A4A2A', 'B': '#3A2414', 'l': '#3A2414',
                                                          'w': '#B9B9B9', 'W': '#FFFFFF', 'h_': '#A29446'},
    F=['hhh', 'rrrrr', 'seses', 'sssss', 'sskkkss', 'sBBBBBs', 'bbbbb', 'll'],
    S=['hhh', 'rrrrr', 'hhses', 'hssss', 'rssssss', 'sBBBBBs', 'bbbbb', 'll'],
    B=['hhh', 'rrrrr', 'hhhhh', 'hhhhh', 'ssrssss', 'sBBBBBs', 'bbbbb', 'll'])
C['forge_knight'] = dict(file='anvilheart', shape='body', weapon='sword', pal={'i': '#C8D2E4', 'I': '#7A86A0', 'k': '#0C0C0C', 'r': '#DB0416', 'd': '#F2C14E', 'l': '#3A3E50',
                                                                 'w': '#DDDDDD', 'W': '#FFFFFF', 'h_': '#C98A22'},
    F=['iii', 'iiiii', 'ikkki', 'iiiii', 'irrdrri', 'irrrrri', 'IrrrI', 'll'],
    S=['iii', 'iiiii', 'iiikk', 'iiiii', 'iirdrri', 'iirrrri', 'IIrrI', 'll'],
    B=['iii', 'iiiii', 'iiiii', 'iiiii', 'iIIIIIi', 'iIIIIIi', 'IiiiI', 'll'])
C['priest'] = dict(file='heliarch', shape='robe', weapon='wand', pal={'y': '#F2C14E', 'f': '#F4F4F4', 'F': '#DDDDDD', 'o': '#E07A20', 'l': '#B8B8B8',
                                                       'w': '#8A5A2A', 'W': '#4AA8F0', 'h_': '#8A5A2A'},
    F=['fff', 'yyyyy', 'seses', 'sssss', 'fffffff', 'yooooof', 'fffffff', 'FFFFFFF'],
    S=['fff', 'yyyyy', 'ffses', 'fffss', 'fffffff', 'foooooy', 'fffffff', 'FFFFFFF'],
    B=['fff', 'yyyyy', 'fffff', 'fffff', 'fffffff', 'yooooof', 'fffffff', 'FFFFFFF'])
C['summoner'] = dict(file='reliquarian', shape='robe', weapon='staff', pal={'K': '#6A48B0', 'P': '#3E2A78', 'k': '#140C20', 'c': '#5EF0A8', 'f': '#E8E0C8', 'l': '#2A1A50',
                                                             'w': '#7A6A52', 'W': '#7CFFB0', 'h_': '#7A6A52'},
    F=['KKK', 'KkkkK', 'KckcK', 'KkkkK', 'KKKKKKK', 'fKPPPKf', 'KKKKKKK', 'PPPPPPP'],
    S=['KKK', 'KKKkk', 'KKKkc', 'KKKkk', 'KKKKKKK', 'KKPPPKf', 'KKKKKKK', 'PPPPPPP'],
    B=['KKK', 'KKKKK', 'KKKKK', 'KKKKK', 'KKKcKKK', 'KKPPPKK', 'KKKKKKK', 'PPPPPPP'])
C['harpooner'] = dict(file='wreckwhaler', shape='body', weapon='bow', pal={'Y': '#FFD030', 'y': '#B88410', 'r': '#DB0416', 'N': '#3058A0', 'l': '#1E2A48',
                                                            'w': '#8A6038', 'W': '#DDDDDD', 'h_': '#F0E6D0'},
    F=['YYY', 'YYYYY', 'seses', 'rrrrr', 'YNNyNNY', 'YNNNNNY', 'NNNNN', 'll'],
    S=['YYY', 'YYYYY', 'YYses', 'YYrrr', 'YYNyNNY', 'YYNNNNY', 'NNNNN', 'll'],
    B=['YYY', 'YYYYY', 'YYYYY', 'YYYYY', 'YYYYYYY', 'YYYYYYY', 'NNNNN', 'll'])
C['duelist'] = dict(file='mirrorknight', shape='body', weapon='dagger', pal={'m': '#D04890', 'M': '#8A2860', 'p': '#F4F0F8', 'y': '#FFD650', 'l': '#4A1A38',
                                                              'w': '#DDDDDD', 'W': '#FFFFFF', 'h_': '#C98A22'},
    F=['mpm', 'mmmmm', 'seses', 'sssss', 'mmmmmmm', 'mmyyymm', 'MMMMM', 'll'],
    S=['pmm', 'mmmmm', 'mmses', 'mmsss', 'mmmmmmm', 'mmmyymm', 'MMMMM', 'll'],
    B=['mpm', 'mmmmm', 'mmmmm', 'mmmmm', 'mmmmmmm', 'mmMMMmm', 'MMMMM', 'll'])
C['stormwright'] = dict(file='kitehermit', shape='robe', weapon='staff', pal={'t': '#E8C878', 'T': '#B8964A', 'f': '#F4F4F8', 'u': '#3A7AE8', 'U': '#2A58B0', 'l': '#4A3A2A',
                                                               'w': '#C87A3A', 'W': '#8AF6FF', 'h_': '#C87A3A'},
    F=['ttt', 'TtttT', 'seses', 'fffff', 'uufffuu', 'uuufuuu', 'uuuuuuu', 'UUUUUUU'],
    S=['ttt', 'TtttT', 'Tsses', 'TTfff', 'uuuuffu', 'uuuuufu', 'uuuuuuu', 'UUUUUUU'],
    B=['ttt', 'TtttT', 'TTTTT', 'TTTTT', 'uuuuuuu', 'uuuuuuu', 'uuuuuuu', 'UUUUUUU'])
C['clockmaker'] = dict(file='horologist', shape='body', weapon='wand', pal={'k': '#2E2836', 'c': '#8AE6FF', 'y': '#F2C14E', 'b': '#A0582A', 'B': '#5A3420', 'g': '#F2C14E', 'H': '#5A3A22', 'l': '#2A1A10',
                                                             'w': '#B0B0C0', 'W': '#FFE08A', 'h_': '#B0B0C0'},
    F=['kkk', 'kkkkk', 'ycscy', 'sssss', 'bbbbbbb', 'bbbgbbb', 'BBBBB', 'll'],
    S=['kkk', 'kkkkk', 'HHscy', 'HHsss', 'bbbbbbb', 'bbbbgbb', 'BBBBB', 'll'],
    B=['kkk', 'kkkkk', 'HHHHH', 'HHHHH', 'bbbbbbb', 'bbbbbbb', 'BBBBB', 'll'])
C['runeblade'] = dict(file='runeblade', shape='body', weapon='sword', pal={'i': '#B9C2D6', 'I': '#5E6680', 'c': '#46F5D6', 'r': '#C83A3A', 'l': '#2E3240',
                                                            'w': '#C8F8FF', 'W': '#46F5D6', 'h_': '#C98A22'},
    F=['rrr', 'iiiii', 'icIci', 'iiiii', 'riIIIir', 'riiiiir', 'IiiiI', 'll'],
    S=['rrr', 'iiiii', 'iiIcI', 'iiiii', 'rriIIIi', 'rriiiii', 'IiiiI', 'll'],
    B=['rrr', 'iiiii', 'iiiii', 'iiiii', 'rrrrrrr', 'rrrrrrr', 'rrrrr', 'll'])
C['hexweaver'] = dict(file='hexweaver', shape='robe', weapon='staff', pal={'p': '#9058E0', 'P': '#5A2E9A', 'k': '#140C20', 'y': '#FFD650', 'l': '#3A1A60',
                                                            'w': '#7A5A3A', 'W': '#8AF6FF', 'h_': '#7A5A3A'},
    F=['ppp', 'pkkkp', 'pykyp', 'pkkkp', 'ppppppp', 'pPyyyPp', 'ppppppp', 'PPPPPPP'],
    S=['ppp', 'pppkk', 'pppky', 'pppkk', 'ppppppp', 'ppPyyPp', 'ppppppp', 'PPPPPPP'],
    B=['ppp', 'ppppp', 'ppppp', 'ppppp', 'ppppppp', 'ppPyPpp', 'ppppppp', 'PPPPPPP'])
C['ranger'] = dict(file='thornhood', shape='body', weapon='bow', pal={'g': '#A0CC2A', 'G': '#6C8C1E', 'b': '#8A4E1A', 'q': '#9D9D9D', 'r': '#DB0416', 'L': '#8A5A30', 'l': '#4A2A10',
                                                       'w': '#A86A2A', 'W': '#B9B9B9', 'h_': '#F0EAD8'},
    F=['GgG', 'GgggG', 'seses', 'GsssG', 'GLLLLLG', 'sbbqbbs', 'GGGGG', 'll'],
    S=['GgG', 'rGggg', 'bGses', 'bGsss', 'GLLLLLG', 'sbbbqbs', 'GGGGG', 'll'],
    B=['GgG', 'GgrgG', 'GgbgG', 'GgbgG', 'GLLbLLG', 'sbbbbbs', 'GGGGG', 'll'])


def body(rows, legs=0, shape='body'):
    """a class's colours poured into its template: an 8x8 grid ('.' outside the body)"""
    g = [['.'] * 8 for _ in range(8)]
    for y in range(8):
        cells, cols = SPANS[shape][y], rows[y]
        assert len(cols) == len(cells), (y, cols)
        for x, ch in zip(cells, cols):
            if y == 7 and x not in STEP[shape][legs]:
                continue                                 # (a lifted leg, a swaying hem)
            g[y][x] = ch
    return [''.join(r) for r in g]


def check(g, cls, shape):
    """every body pixel inside the template (the weapon layer is not body: it is laid on afterwards)"""
    for y, r in enumerate(g):
        for x, ch in enumerate(r[:8]):
            assert ch == '.' or TEMPLATES[shape][y][x] == '#', f'{cls}: a pixel outside the {shape} at ({x},{y})'


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
    sh = D['shape']
    for v in ('F', 'S', 'B'):
        for k in range(3):
            check(body(D[v], k, sh), cls, sh)
    Fi = lambda k=0: with_weapon(body(D['F'], k, sh), Wp['idle'])
    Si = lambda k=0: with_weapon(body(D['S'], k, sh), Wp['idle'])
    Bi = lambda k=0: with_weapon(body(D['B'], k, sh), Wp['idle'])
    walk = lambda mk: [mk(0), mk(1), mk(0), mk(2)]
    FA = [with_weapon(body(D['F'], 0, sh), Wp['up']), Fi()]
    BA = [with_weapon(body(D['B'], 0, sh), Wp['up']), Bi()]
    SA = [with_weapon(wide(body(D['S'], 0, sh)), L) for L in Wp['side']]
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
    print('built', list(C), '- every body inside its template')
