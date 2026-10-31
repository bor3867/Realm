"""The classes as RotMG-style 8x8 sprites (redrawn 2026-10-31, after RotMG's own Rogue, Archer and Priest).

Each class is a true 8x8 figure: a hat or hood, a face, a body in two flat tones, two legs. No shading tricks, no
outline in the art (the game draws a thin one: src/outline.js). Pixels are stored doubled (16x16 frames), so every
2x2 block is one colour.

The weapon is a layer of its own, by family (sword, dagger, bow, staff, wand), coloured by the class:
  idle and walking, it is held at the side (inside the 8x8);
  attacking from the front or back, it is raised and flashes;
  attacking side-on, the frame is twice as wide (16x8 art: the body on the left, the weapon reaching out ahead), as
  RotMG's own attack frames are: a sword swings up and then straight out, a bow is drawn then loosed, a staff is
  raised then thrust, a wand flicks and sparks.
The body never changes to make room for an attack: only the weapon and the arm holding it move.
Walking moves only the legs (row 8): no bob.

    py tools/heroes8.py
"""
import json
import os

from pixlib import hex_rgba, write_png

ROOT = os.path.join(os.path.dirname(__file__), '..', 'art', 'sprites', 'player')
SKIN = {'s': '#F7E26B', 'e': '#0C0C0C'}            # RotMG's own: a pale yellow face, two pure black eyes
FEET = {   # stand, step, step: two dark feet
    'front': ['.l..l...', 'l...l...', '.l...l..'],
    'side': ['..l.l...', '.l...l..', '...l....'],
    'back': ['.l..l...', '.l...l..', 'l...l...'],
}

# ---- the weapon layer, by family. Letters: w the blade / shaft / limb, W the tip, edge, gem or bowstring, h the grip.
# The body fills columns 0-5; the weapon is held tight at its side in column 6 (a bow's limb in 7). Idle and front/back
# attack: an 8x8 overlay. Side attack: two 16x8 overlays, the hand at column 6, the weapon reaching out ahead.
WEAPON = {
    'sword': {
        'idle': {(6, 0): 'W', (6, 1): 'w', (6, 2): 'w', (6, 3): 'w', (6, 4): 'h', (6, 5): 'h'},
        'up': {(6, 0): 'W', (7, 0): 'W', (6, 1): 'W', (6, 2): 'w', (6, 3): 'h', (6, 4): 'h'},
        'side': [{(6, 4): 'h', (7, 3): 'w', (8, 2): 'w', (9, 1): 'w', (10, 0): 'W'},
                 {(6, 4): 'h', (7, 4): 'w', (8, 4): 'w', (9, 4): 'w', (10, 4): 'w', (11, 4): 'W', (9, 3): 'W', (10, 5): 'W'}],
    },
    'dagger': {
        'idle': {(6, 2): 'W', (6, 3): 'w', (6, 4): 'h', (6, 5): 'h'},
        'up': {(6, 1): 'W', (6, 2): 'w', (6, 3): 'h', (6, 4): 'h'},
        'side': [{(6, 4): 'h', (7, 4): 'w', (8, 4): 'W'},
                 {(6, 4): 'h', (7, 4): 'w', (8, 4): 'w', (9, 4): 'w', (10, 4): 'w', (11, 4): 'W'}],
    },
    'bow': {
        'idle': {(6, 0): 'w', (7, 1): 'w', (7, 2): 'w', (7, 3): 'w', (7, 4): 'w', (7, 5): 'w', (6, 6): 'w', (6, 1): 'W', (6, 2): 'W', (6, 3): 'W', (6, 4): 'W', (6, 5): 'W'},
        'up': {(6, 0): 'w', (7, 0): 'w', (7, 1): 'w', (7, 2): 'w', (7, 3): 'w', (7, 4): 'w', (6, 5): 'w', (6, 1): 'W', (6, 2): 'W', (6, 3): 'W', (6, 4): 'W'},
        # (held out: drawn, an arrow across it; loosed, the arrow away ahead and the bow still in hand)
        'side': [{(7, 1): 'w', (8, 2): 'w', (8, 3): 'w', (8, 4): 'w', (8, 5): 'w', (7, 6): 'w', (7, 2): 'W', (7, 5): 'W', (6, 4): 'h', (7, 4): 'h', (9, 4): 'h', (10, 4): 'W'},
                 {(7, 1): 'w', (8, 2): 'w', (8, 3): 'w', (8, 4): 'w', (8, 5): 'w', (7, 6): 'w', (7, 2): 'W', (7, 3): 'W', (7, 4): 'W', (7, 5): 'W', (11, 4): 'h', (12, 4): 'h', (13, 4): 'W'}],
    },
    'staff': {
        'idle': {(6, 0): 'W', (6, 1): 'h', (6, 2): 'h', (6, 3): 'h', (6, 4): 'h', (6, 5): 'h', (6, 6): 'h'},
        'up': {(6, 0): 'W', (7, 0): 'W', (6, 1): 'W', (6, 2): 'h', (6, 3): 'h', (6, 4): 'h', (6, 5): 'h'},
        'side': [{(7, 0): 'W', (7, 1): 'h', (7, 2): 'h', (7, 3): 'h', (7, 4): 'h', (7, 5): 'h', (6, 4): 'h'},
                 {(6, 5): 'h', (7, 4): 'h', (8, 4): 'h', (9, 3): 'h', (10, 3): 'h', (11, 2): 'W', (12, 2): 'W', (12, 1): 'W', (11, 1): 'W'}],
    },
    'wand': {
        'idle': {(6, 2): 'W', (6, 3): 'h', (6, 4): 'h', (6, 5): 'h'},
        'up': {(6, 1): 'W', (7, 1): 'W', (6, 2): 'h', (6, 3): 'h', (6, 4): 'h'},
        'side': [{(6, 4): 'h', (7, 3): 'h', (8, 2): 'W'},
                 {(6, 4): 'h', (7, 4): 'h', (8, 4): 'h', (9, 4): 'W', (10, 3): 'W', (10, 5): 'W', (11, 4): 'W'}],
    },
}

# ---- the classes, after RotMG's own (the user's references, 2026-10-31: its Rogue, Archer and Priest). Short and
# square: a big head (rows 0-3, four or five wide) with two black dot eyes, a body as wide as its arms (rows 4-6, six
# wide), two dark feet (row 7). Flat colour, two tones at most a material. Front, side (facing right), back: the 7 rows
# above the feet; columns 6-7 are the weapon's. pal: the body, l the feet, and w/W/h_ the weapon.
C = {}
C['brawler'] = dict(file='forgefist', weapon='sword', pal={'h': '#7A4A2A', 'r': '#DB0416', 'k': '#D8C050', 'b': '#7A4A2A', 'B': '#3A2414', 'l': '#3A2414',
                                                          'w': '#B9B9B9', 'W': '#FFFFFF', 'h_': '#A29446'},
    F=['.hhhh...', 'rrrrrr..', '.seses..', '.sssss..', 'sskkss..', 'sBBBBs..', '.bbbb...'],
    S=['..hhh...', '.rrrrr..', 'r.hses..', '..hsss..', '..ssss..', '..BBBs..', '..bbb...'],
    B=['.hhhh...', 'rrrrrr..', '.hhhhr..', '.hhhh.r.', 'ssssss..', 'sBBBBs..', '.bbbb...'])
C['forge_knight'] = dict(file='anvilheart', weapon='sword', pal={'i': '#C8D2E4', 'I': '#7A86A0', 'k': '#0C0C0C', 'r': '#DB0416', 'd': '#F2C14E', 'l': '#3A3E50',
                                                                 'w': '#DDDDDD', 'W': '#FFFFFF', 'h_': '#C98A22'},
    F=['.iiii...', 'iiiiii..', 'ikkkki..', '.iiii...', 'iirrii..', 'irddri..', '.IrrI...'],
    S=['.iiii...', '.iiiii..', '.iiikk..', '..iiii..', '..irri..', '..irri..', '..IrrI..'],
    B=['.iiii...', 'iiiiii..', 'iiiiii..', '.iiii...', 'iiIIii..', 'iIIIIi..', '.IiiI...'])
C['priest'] = dict(file='heliarch', weapon='wand', pal={'y': '#F2C14E', 'f': '#F4F4F4', 'F': '#DDDDDD', 'o': '#E07A20', 'l': '#B08A60',
                                                       'w': '#8A5A2A', 'W': '#4AA8F0', 'h_': '#8A5A2A'},
    F=['.ffff...', '.yyyy...', '.seses..', '.sssss..', 'ffffff..', 'yooooy..', '.FFFF...'],
    S=['..fff...', '..yyy...', '..sses..', '..ssss..', '..ffff..', '..ooyo..', '..FFF...'],
    B=['.ffff...', '.yyyy...', '.ffff...', '.ffff...', 'ffffff..', 'yooooy..', '.FFFF...'])
C['summoner'] = dict(file='reliquarian', weapon='staff', pal={'K': '#6A48B0', 'P': '#3E2A78', 'k': '#140C20', 'c': '#5EF0A8', 'f': '#E8E0C8', 'l': '#2A1A50',
                                                             'w': '#7A6A52', 'W': '#7CFFB0', 'h_': '#7A6A52'},
    F=['..KK....', '.KKKK...', 'KkkkkK..', 'KckkcK..', 'KKKKKK..', 'fKPPKf..', '.KKKK...'],
    S=['..KK....', '.KKKK...', '.KKKkk..', '.KKKkc..', '.KKKKK..', '.KPKKf..', '.KKKK...'],
    B=['..KK....', '.KKKK...', 'KKKKKK..', 'KKKKKK..', 'KKccKK..', 'KPKKPK..', '.KKKK...'])
C['harpooner'] = dict(file='wreckwhaler', weapon='bow', pal={'Y': '#FFD030', 'y': '#B88410', 'r': '#DB0416', 'N': '#3058A0', 'l': '#1E2A48',
                                                            'w': '#8A6038', 'W': '#DDDDDD', 'h_': '#F0E6D0'},
    F=['.YYYY...', 'YYYYYY..', '.seses..', '.rrrr...', 'YNNNNY..', 'YNyyNY..', '.NNNN...'],
    S=['.YYYY...', '.YYYYY..', '..Yses..', '..Yrrr..', '..YNNN..', '..YNyN..', '..NNN...'],
    B=['.YYYY...', 'YYYYYY..', '.YYYY...', '.YYYY...', 'YYYYYY..', 'YYYYYY..', '.NNNN...'])
C['duelist'] = dict(file='mirrorknight', weapon='dagger', pal={'m': '#D04890', 'M': '#8A2860', 'p': '#F4F0F8', 'y': '#FFD650', 'l': '#4A1A38',
                                                              'w': '#DDDDDD', 'W': '#FFFFFF', 'h_': '#C98A22'},
    F=['..pm....', '.mmmm...', 'mmmmmm..', '.seses..', 'mmyymm..', 'mmyymm..', '.mMMm...'],
    S=['.pm.....', '.mmmm...', 'mmmmmm..', '..mses..', '..mymm..', '..mymm..', '..mMM...'],
    B=['..pm....', '.mmmm...', 'mmmmmm..', '.mmmm...', 'mmMMmm..', 'mmMMmm..', '.mMMm...'])
C['stormwright'] = dict(file='kitehermit', weapon='staff', pal={'t': '#E8C878', 'T': '#B8964A', 'f': '#F4F4F8', 'u': '#3A7AE8', 'U': '#2A58B0', 'l': '#4A3A2A',
                                                               'w': '#C87A3A', 'W': '#8AF6FF', 'h_': '#C87A3A'},
    F=['..tt....', '.tttt...', 'tttttt..', '.seses..', 'uffffu..', 'uuffuu..', '.uUUu...'],
    S=['..tt....', '.tttt...', 'tttttt..', '..Tses..', '..uffu..', '..uufu..', '..uUu...'],
    B=['..tt....', '.tttt...', 'tttttt..', '.TTTT...', 'uuuuuu..', 'uuuuuu..', '.uUUu...'])
C['clockmaker'] = dict(file='horologist', weapon='wand', pal={'k': '#2E2836', 'c': '#8AE6FF', 'b': '#A0582A', 'B': '#5A3420', 'g': '#F2C14E', 'H': '#5A3A22', 'l': '#2A1A10',
                                                             'w': '#B0B0C0', 'W': '#FFE08A', 'h_': '#B0B0C0'},
    F=['.kkkk...', '.kkkk...', 'kkkkkk..', '.scsc...', '.ssss...', 'bbggbb..', '.bBBb...'],
    S=['..kkk...', '..kkk...', '.kkkkk..', '..Hsc...', '..Hss...', '..bbgb..', '..bBB...'],
    B=['.kkkk...', '.kkkk...', 'kkkkkk..', '.HHHH...', '.HHHH...', 'bbbbbb..', '.bBBb...'])
C['runeblade'] = dict(file='runeblade', weapon='sword', pal={'i': '#B9C2D6', 'I': '#5E6680', 'c': '#46F5D6', 'r': '#C83A3A', 'l': '#2E3240',
                                                            'w': '#C8F8FF', 'W': '#46F5D6', 'h_': '#C98A22'},
    F=['..rr....', '.iiii...', 'iiiiii..', 'icIIci..', 'riiiir..', 'riIIir..', '.IiiI...'],
    S=['.rr.....', '.iiii...', '.iiiii..', '.iiIc...', 'rriii...', 'rriIi...', '..IiI...'],
    B=['..rr....', '.iiii...', 'iiiiii..', '.iiii...', 'rrrrrr..', 'rrrrrr..', '.rrrr...'])
C['hexweaver'] = dict(file='hexweaver', weapon='staff', pal={'p': '#9058E0', 'P': '#5A2E9A', 'k': '#140C20', 'y': '#FFD650', 'l': '#3A1A60',
                                                            'w': '#7A5A3A', 'W': '#8AF6FF', 'h_': '#7A5A3A'},
    F=['..p.....', '.ppp....', 'pkkkkp..', 'pykkyp..', 'pppppp..', 'pPyyPp..', '.pppp...'],
    S=['.p......', '.ppp....', '.pppkk..', '.pppky..', '.ppppp..', '.pPppP..', '..ppp...'],
    B=['..p.....', '.ppp....', 'pppppp..', 'pppppp..', 'pppppp..', 'pPyyPp..', '.pppp...'])
C['ranger'] = dict(file='thornhood', weapon='bow', pal={'g': '#A0CC2A', 'G': '#6C8C1E', 'b': '#8A4E1A', 'q': '#9D9D9D', 'r': '#DB0416', 'l': '#4A2A10',
                                                       'w': '#A86A2A', 'W': '#B9B9B9', 'h_': '#F0EAD8'},
    F=['.GggG...', 'Gggggg..', 'Gseseg..', 'Gsssgg..', 'gGggGg..', 'sbbqbs..', '.GGGG...'],
    S=['..ggG...', '.ggggG..', '.rgses..', '.bgsss..', '..gggg..', '..bbqb..', '..GGG...'],
    B=['.GggG...', 'Ggggrg..', 'Gggbgg..', 'Gggbgg..', 'gGgbGg..', 'sbbbbs..', '.GGGG...'])


def frame(top, feet):
    g = list(top) + [feet]
    assert len(g) == 8 and all(len(r) == 8 for r in g), g
    return g


def with_weapon(g, layer, mirror=False):
    """lay a weapon overlay on a body (mirror: the back view holds it on the other side)"""
    rows = [list(r) for r in g]
    W = len(rows[0])
    for (x, y), ch in layer.items():
        xx = (7 - x) if mirror else x
        if 0 <= xx < W and 0 <= y < len(rows):
            rows[y][xx] = 'Q' if ch == 'h' else ch     # (Q: the grip's own colour, h_ in the palette)
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
    P['Q'] = P.pop('h_')                                   # the weapon's grip
    pal = {k: hex_rgba(v) for k, v in {**SKIN, **P}.items()}
    Wp = WEAPON[D['weapon']]
    f = lambda top, view, k=0: frame(top, FEET[view][k])
    Fi = lambda k=0: with_weapon(f(D['F'], 'front', k), Wp['idle'])
    Si = lambda k=0: with_weapon(f(D['S'], 'side', k), Wp['idle'])
    Bi = lambda k=0: with_weapon(f(D['B'], 'back', k), Wp['idle'])
    walk = lambda mk: [mk(0), mk(1), mk(0), mk(2)]
    FA = [with_weapon(f(D['F'], 'front'), Wp['up']), Fi()]
    BA = [with_weapon(f(D['B'], 'back'), Wp['up']), Bi()]
    SA = [with_weapon(wide(f(D['S'], 'side', 1)), L) for L in Wp['side']]
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
    print('built', list(C))
