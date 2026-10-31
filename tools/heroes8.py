"""The classes as RotMG-style 8x8 sprites (redrawn 2026-10-31).

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
SKIN = {'s': '#F2B48A', 'e': '#1A1218'}
FEET = {   # stand, step, step
    'front': ['..l..l..', '..l.....', '.....l..'],
    'side': ['...l.l..', '..l...l.', '....l...'],
    'back': ['..l..l..', '.....l..', '..l.....'],
}

# ---- the weapon layer, by family. Letters: w the blade / shaft / limb, W the tip, edge or gem, h the hilt or grip.
# Idle and front/back attack: an 8x8 overlay ('.' is see-through). Side attack: two 16x8 overlays (body on cols 0-7).
WEAPON = {
    'sword': {
        'idle': {(7, 0): 'W', (7, 1): 'w', (7, 2): 'w', (7, 3): 'w', (7, 4): 'h', (7, 5): 'h'},
        'up': {(7, 0): 'W', (7, 1): 'W', (6, 0): 'w', (7, 2): 'w', (7, 3): 'h', (7, 4): 'h'},
        'side': [{(7, 4): 'h', (8, 3): 'w', (9, 2): 'w', (10, 1): 'w', (11, 0): 'W'},
                 {(7, 4): 'h', (8, 4): 'w', (9, 4): 'w', (10, 4): 'w', (11, 4): 'w', (12, 4): 'W', (10, 3): 'W', (11, 5): 'W'}],
    },
    'dagger': {
        'idle': {(7, 3): 'W', (7, 4): 'w', (7, 5): 'h'},
        'up': {(7, 2): 'W', (7, 3): 'w', (7, 4): 'h'},
        'side': [{(7, 4): 'h', (8, 4): 'w', (9, 4): 'W'},
                 {(7, 4): 'h', (8, 4): 'w', (9, 4): 'w', (10, 4): 'w', (11, 4): 'w', (12, 4): 'W'}],
    },
    'bow': {
        'idle': {(6, 1): 'w', (7, 2): 'w', (7, 3): 'w', (7, 4): 'w', (6, 5): 'w'},
        'up': {(6, 0): 'w', (7, 1): 'w', (7, 2): 'w', (7, 3): 'w', (6, 4): 'w', (5, 2): 'W'},
        # (held out in the hand: drawn, the arrow across it; loosed, the arrow away ahead and the bow still in hand)
        'side': [{(7, 1): 'w', (8, 2): 'w', (8, 3): 'w', (8, 4): 'w', (8, 5): 'w', (7, 6): 'w', (7, 4): 'h', (9, 4): 'h', (10, 4): 'W'},
                 {(7, 1): 'w', (8, 2): 'w', (8, 3): 'w', (8, 4): 'w', (8, 5): 'w', (7, 6): 'w', (7, 4): 's', (11, 4): 'h', (12, 4): 'h', (13, 4): 'W'}],
    },
    'staff': {
        'idle': {(7, 0): 'W', (7, 1): 'h', (7, 2): 'h', (7, 3): 'h', (7, 4): 'h', (7, 5): 'h', (7, 6): 'h'},
        'up': {(7, 0): 'W', (6, 0): 'W', (7, 1): 'W', (7, 2): 'h', (7, 3): 'h', (7, 4): 'h', (7, 5): 'h'},
        'side': [{(8, 0): 'W', (8, 1): 'h', (8, 2): 'h', (8, 3): 'h', (8, 4): 'h', (8, 5): 'h', (7, 4): 'h'},
                 {(7, 5): 'h', (8, 4): 'h', (9, 4): 'h', (10, 3): 'h', (11, 3): 'h', (12, 2): 'W', (13, 2): 'W', (13, 1): 'W', (12, 1): 'W'}],
    },
    'wand': {
        'idle': {(7, 2): 'W', (7, 3): 'h', (7, 4): 'h', (7, 5): 'h'},
        'up': {(7, 1): 'W', (6, 1): 'W', (7, 2): 'h', (7, 3): 'h', (7, 4): 'h'},
        'side': [{(7, 4): 'h', (8, 3): 'h', (9, 2): 'W'},
                 {(7, 4): 'h', (8, 4): 'h', (9, 4): 'h', (10, 4): 'W', (11, 3): 'W', (11, 5): 'W', (12, 4): 'W'}],
    },
}

# ---- the classes: front, side (facing right) and back, the 7 rows above the feet. Column 7 (front, side) or 0 (back) is
# left for the weapon. pal: the body's colours, l the legs, and w/W/h the weapon's
C = {}
# the Forgefist: shirtless, a red headband (its tails behind), brown hair and trousers
C['brawler'] = dict(file='forgefist', weapon='sword', pal={'h': '#5A3420', 'r': '#E0303A', 'k': '#D89470', 'b': '#7A4A2A', 'B': '#3A2414', 'l': '#3A2414',
                                                          'w': '#D8E0EC', 'W': '#FFFFFF', 'h_': '#C98A22'},
    F=['..hhhh..', '.rrrrrr.', '..sese..', '..ssss..', '.sskkss.', '..BBBB..', '..bbbb..'],
    S=['..hhhh..', '.rrrrrr.', 'r.hhse..', '..hsss..', '..sssss.', '..BBBB..', '..bbbb..'],
    B=['..hhhh..', '.rrrrrr.', '..hhhhr.', '..hhhh.r', '.ssssss.', '..BBBB..', '..bbbb..'])
# the Anvilheart: a closed silver helm with a dark visor, a red tabard with a gold anvil
C['forge_knight'] = dict(file='anvilheart', weapon='sword', pal={'i': '#C8D2E4', 'I': '#7A86A0', 'k': '#1A1E2A', 'r': '#D8283A', 'd': '#E0A22A', 'l': '#5E6680',
                                                                 'w': '#E4ECF8', 'W': '#FFFFFF', 'h_': '#C98A22'},
    F=['..iiii..', '.iiiiii.', '.ikkkki.', '..iiii..', '.irddri.', '.irrrri.', '..IrrI..'],
    S=['..iiii..', '.iiiii..', '.iiikk..', '..iiii..', '..irri..', '..irri..', '..IrrI..'],
    B=['..iiii..', '.iiiiii.', '.iiiiii.', '..iiii..', '.iIIIIi.', '.iIIIIi.', '..IiiI..'])
# the Heliarch: a tall white mitre banded in gold, a white robe with a gold stole, a gold wand with a blue stone
C['priest'] = dict(file='heliarch', weapon='wand', pal={'y': '#E0A22A', 'f': '#F4F0E6', 'F': '#C4BED4', 'l': '#B08A60',
                                                       'w': '#E0A22A', 'W': '#4AA8F0', 'h_': '#E0A22A'},
    F=['...ff...', '..fyyf..', '..sese..', '..ssss..', '.ffyyff.', '.ffyyff.', '.ffFFff.'],
    S=['...ff...', '..fyyf..', '..ffse..', '..ffss..', '..fffff.', '..fffyf.', '.ffFFff.'],
    B=['...ff...', '..fyyf..', '..ffff..', '..ffff..', '.ffyyff.', '.ffyyff.', '.ffFFff.'])
# the Reliquarian: a pointed purple hood over darkness and two green eyes, bone-pale hands, a staff with a green stone
C['summoner'] = dict(file='reliquarian', weapon='staff', pal={'K': '#6A48B0', 'P': '#3E2A78', 'k': '#140C20', 'c': '#5EF0A8', 'f': '#E8E0C8', 'l': '#3E2A78',
                                                             'w': '#7A6A52', 'W': '#7CFFB0', 'h_': '#7A6A52'},
    F=['...KK...', '..KKKK..', '.KkkkkK.', '.KckkcK.', '.KKKKKK.', 'fKPKKPf.', '.KKKKKK.'],
    S=['...KK...', '..KKKK..', '.KKKkk..', '.KKKkc..', '.KKKKK..', '.KPKKKf.', '.KKKKKK.'],
    B=['...KK...', '..KKKK..', '.KKKKKK.', '.KKKKKK.', '.KKccKK.', '.KPKKPK.', '.KKKKKK.'])
# the Wreck-Whaler: a yellow sou'wester and slicker, a red neckerchief, blue overalls
C['harpooner'] = dict(file='wreckwhaler', weapon='bow', pal={'Y': '#FFD030', 'y': '#B88410', 'r': '#E0303A', 'N': '#3058A0', 'l': '#2A3A60',
                                                            'w': '#8A6038', 'W': '#E4ECF8', 'h_': '#F0E6D0'},
    F=['..YYYY..', '.YyyyyY.', '..sese..', '..rrrr..', '.YNNNNY.', '.YNyyNY.', '..NNNN..'],
    S=['..YYYY..', '.YYYyy..', '..YYse..', '..Yrrr..', '..YNNN..', '..YNyN..', '..NNNN..'],
    B=['..YYYY..', '.YyyyyY.', '..YYYY..', '..YYYY..', '.YYYYYY.', '.YYYYYY.', '..NNNN..'])
# the Mirror-Knight: a magenta hat with a white plume, a magenta coat with gold buttons
C['duelist'] = dict(file='mirrorknight', weapon='dagger', pal={'m': '#D04890', 'M': '#8A2860', 'p': '#F4F0F8', 'y': '#FFD650', 'l': '#6A2A50',
                                                              'w': '#E4ECF8', 'W': '#FFFFFF', 'h_': '#C98A22'},
    F=['...pm...', '..mmmm..', '.mmmmmm.', '..sese..', '..ssss..', '.mmyymm.', '..mMMm..'],
    S=['..pm....', '..mmmm..', '.mmmmmm.', '..mmse..', '..mmss..', '..mmymm.', '..mMMm..'],
    B=['...pm...', '..mmmm..', '.mmmmmm.', '..mmmm..', '..mmmm..', '.mmMMmm.', '..mMMm..'])
# the Kite-Hermit: a wide straw hat, a long white beard, a blue robe, a staff with a storm crystal
C['stormwright'] = dict(file='kitehermit', weapon='staff', pal={'t': '#E8C878', 'T': '#B8964A', 'f': '#F4F4F8', 'u': '#3A7AE8', 'U': '#2A58B0', 'l': '#6A5A3A',
                                                               'w': '#C87A3A', 'W': '#8AF6FF', 'h_': '#C87A3A'},
    F=['...tt...', '.tttttt.', '..sese..', '..ffff..', '.uuffuu.', '.uuuuuu.', '.uUuuUu.'],
    S=['...tt...', '.tttttt.', '..Tsse..', '...fff..', '..uuuf..', '..uuuu..', '.uuuuuu.'],
    B=['...tt...', '.tttttt.', '..TTTT..', '..TTTT..', '.uuuuuu.', '.uuuuuu.', '.uUuuUu.'])
# the Horologist: a black top hat, brass goggles, a brown coat with a gold clock face
C['clockmaker'] = dict(file='horologist', weapon='wand', pal={'k': '#2E2836', 'y': '#F2C14E', 'c': '#8AE6FF', 'b': '#A0582A', 'B': '#5A3420', 'g': '#F2C14E', 'H': '#5A3A22', 'l': '#3A2414',
                                                             'w': '#B0B0C0', 'W': '#FFE08A', 'h_': '#B0B0C0'},
    F=['..kkkk..', '..kkkk..', '.kkkkkk.', '..ycyc..', '.bbggbb.', '.bbggbb.', '..bBBb..'],
    S=['..kkk...', '..kkk...', '.kkkkk..', '..Hsyc..', '..bbbb..', '..bbgb..', '..bBBb..'],
    B=['..kkkk..', '..kkkk..', '.kkkkkk.', '..HHHH..', '.bbbbbb.', '.bbggbb.', '..bBBb..'])
# the Rune-Knight: a silver helm with a red crest and two glowing eyes, a red cloak, a rune-lit sword
C['runeblade'] = dict(file='runeblade', weapon='sword', pal={'i': '#A4AEC6', 'I': '#5E6680', 'c': '#46F5D6', 'r': '#C83A3A', 'l': '#5E6680',
                                                            'w': '#C8F8FF', 'W': '#46F5D6', 'h_': '#C98A22'},
    F=['...rr...', '..iiii..', '.icIIci.', '..iiii..', '.riccir.', '.riIIir.', '..IiiI..'],
    S=['..rr....', '..iiii..', '..iIIc..', '..iiii..', '.rriii..', '.rriIi..', '..IiiI..'],
    B=['...rr...', '..iiii..', '..iiii..', '.rrrrrr.', '.rrrrrr.', '.rrrrrr.', '..IrrI..'])
# the Orb-Witch: a tall purple hood over darkness and two yellow eyes, a gold sigil on the breast, a staff with a cyan orb
C['hexweaver'] = dict(file='hexweaver', weapon='staff', pal={'p': '#9058E0', 'P': '#5A2E9A', 'k': '#140C20', 'y': '#FFD650', 'l': '#5A2E9A',
                                                            'w': '#7A5A3A', 'W': '#8AF6FF', 'h_': '#7A5A3A'},
    F=['...pp...', '..pppp..', '.pkkkkp.', '.pykkyp.', '.ppyypp.', '.pPyyPp.', '.pppppp.'],
    S=['...pp...', '..pppp..', '..ppkk..', '..ppky..', '..ppppp.', '.pPppP..', '.pppppp.'],
    B=['...pp...', '..pppp..', '.pppppp.', '.pppppp.', '.ppyypp.', '.pPyyPp.', '.pppppp.'])
# the Ranger: a green hood, a leather jerkin with a strap, a quiver of red-fletched arrows on the back
C['ranger'] = dict(file='thornhood', weapon='bow', pal={'g': '#6CC048', 'G': '#2E7A34', 'L': '#8A5A30', 'b': '#5A3A1E', 'r': '#E0303A', 'l': '#5A3A22',
                                                       'w': '#C89048', 'W': '#E4ECF8', 'h_': '#F0EAD8'},
    F=['...gg...', '..gggg..', '.gseseg.', '..gssg..', '.LLbLLL.', '.LLLbLL.', '..GLLG..'],
    S=['...gg...', '..gggg..', '.rggse..', '.bggss..', '..LLLL..', '..LbLL..', '..GLLG..'],
    B=['..rgg...', '..bggg..', '.gbgggg.', '.ggbggg.', '.LLbLLL.', '.LLLLLL.', '..GLLG..'])


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
    arm = lambda g: [r if i != 4 else (r[:6] + ('s' if r[6] == '.' else r[6]) + r[7]) for i, r in enumerate(g)]   # the hand out in front (side view)
    Fi = lambda k=0: with_weapon(f(D['F'], 'front', k), Wp['idle'])
    Si = lambda k=0: with_weapon(f(D['S'], 'side', k), Wp['idle'])
    Bi = lambda k=0: with_weapon(f(D['B'], 'back', k), Wp['idle'], mirror=True)
    walk = lambda mk: [mk(0), mk(1), mk(0), mk(2)]
    FA = [with_weapon(f(D['F'], 'front'), Wp['up']), Fi()]
    BA = [with_weapon(f(D['B'], 'back'), Wp['up'], mirror=True), Bi()]
    SA = [with_weapon(wide(arm(f(D['S'], 'side', 1))), L) for L in Wp['side']]
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
