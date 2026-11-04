# Solkhar's frames, drawn by hand on his sprite (2026-11-03, the audited spec's 10: "redrawn pixel frames with consistent
# silhouette; no individual animated limbs, joints, bone pivots, smooth mesh transforms, or blurry scaling"; the user:
# "Pixel-art animation is about changing which pixels are drawn"). Each frame below is the pixels that change from his
# base (art/source/bosses/pix/solkhar.txt, the user's sprite in 30 colours): the stolen sun's core redrawn brighter or
# dimmer, a raised hand drawn where the hand now is (the old one rubbed out), the crown's rays drawn longer, the hem's
# tatters drawn again in each place they swing to, sparks lit on the halo's shards. Nothing is moved, turned or scaled.
# Writes the frames into the pix file after its base (py -I tools/solkhar_frames.py), then tools/build_solkhar2.py.
import os
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
PIX = os.path.join(root, 'art', 'source', 'bosses', 'pix', 'solkhar.txt')
W = 55

# ---- the stolen sun, his chest's core (x 25-32, rows 22-28): four states of its burning, drawn
CORE_X = 25
CORE = {
    'base': None,
    'warm': {22: 'IVMPOYIO', 23: 'OPZNZEYY', 24: 'PZWWWZKY', 25: 'IZWWWZcY', 26: 'IPWNZHNZ', 27: 'ZHPZPHLK'},
    'blaze': {22: 'IVPZPYIO', 23: 'PZNWNZYY', 24: 'ZWWWWWZY', 25: 'ZWWWWWZY', 26: 'PZWWNZNZ', 27: 'ZHZNZHLK', 28: 'ZMPHPZIY'},
    'dim': {23: 'OcHHHEYY', 24: 'cHPZPHKY', 25: 'IHZPHIcY', 26: 'IIPHIHNZ'},
    'dark': {23: 'OcIIIEYY', 24: 'cIHHHIKY', 25: 'IIHHIIcY', 26: 'IIIIIHNZ', 27: 'ZIIIIHLK'},
}
# ---- sparks on the halo's shards and the crown (x, y): white for a frame where the light catches
SPARKS = {0: [], 1: [(48, 9), (52, 15), (27, 3)], 2: [(27, 0), (12, 13), (37, 4)], 3: [(6, 9), (52, 16), (21, 6)],
          4: [(42, 9), (16, 12), (53, 17)], 5: [(38, 3), (7, 9), (48, 9)]}
# ---- the hem: its tatters drawn where they hang in each moment of a swing (rows 54-57; and the side strands, rows 51-53)
HEM = {
    'still': None,
    'r1': ['...........U..FYLO...AcLLLL...UUDY....LLY....GG........',
           '...........U....LOO...AYYUU....UD......OO.....G........',
           '.................O.........U....D........O.....G.......',
           '...........................U...........................'],
    'r2': ['...........U..FYLO...AcLLLL...UUDY....LLY....GG........',
           '............U...LOO...AYYUU....UD.......OO.....G.......',
           '............U....O.........U....D........O......G......',
           '...........................U.....D.......O.............'],
    'mid': ['..........U...FYLO...AcLLLL...UUDY....LLY...GG.........',
            '..........U....LO.....AYYU....UD......O......G.........',
            '...............................D........O....G.........',
            '.......................................................'],
    'l1': ['.........U....FYLO...AcLLLL...UUDY....LLY..GG..........',
           '.........U....LOO....AYYUU...UD......OO.....G..........',
           '...............O.........U...D........O.....G..........',
           '.........................U.............................'],
    'l2': ['.........U....FYLO...AcLLLL...UUDY....LLY..GG..........',
           '........U....LOO....AYYUU...UD......OO.....G...........',
           '........U.....O.........U...D........O.....G...........',
           '........................U....D.......O.................'],
}
STRANDS = {'r1': (8, 52), 'r2': (9, 52), 'mid': (7, 51), 'l1': (6, 50), 'l2': (5, 50), 'still': None}   # (the left and right strands' columns, rows 51-53)

# ---- the right hand (his left), raised in three heights: the old hand and the outer arm rubbed out, the new drawn
#      ('x0 y' then its rows; '.' rubs out, '?' keeps)
HAND_R = {
    'half': [('clear', 46, 23, 54, 29),
             (44, 20, ['?????TZZT.',
                       '????.TYYYa',
                       '???..JYYRR',
                       '??..RLLYY.',
                       '?.LYLRY...',
                       '.LYLY.....',
                       'GLYY......',
                       'LYYR......',
                       'YYR.......',
                       'YR........'])],
    'up': [('clear', 46, 23, 54, 29),
           (44, 14, ['??????.NW.',
                     '?????.TZZT',
                     '?????TYYYa',
                     '?????JYYRR',
                     '????.RLLY.',
                     '????LYLR..',
                     '???LYLY...',
                     '??.LYL....',
                     '?.LYY.....',
                     '.GLY......',
                     'GLYR......',
                     'LYYR......',
                     'YYR.......',
                     'YR........'])],
}
# ---- the left hand (his right), raised: for the summoning, both hands up
HAND_L = {
    'up': [('clear', 0, 21, 5, 25),
           (0, 14, ['??WN????', '?TZZT???', 'aYYYT???', 'RRYYJ???', '?YLLR???', '??RLYL??', '???YLYL?', '????LYL?', '?????YYL', '??????YL'])],   # ('?' keeps the shards about him)
}
# ---- the crown's rays drawn longer (grow 3: three new rows above him; every y below is then +3)
RAYS = [(27, 0, 'N.'), (27, 1, 'ZV'), (27, 2, 'VA'), (16, 6, 'W'), (16, 5, 'N'), (39, 6, 'W'), (40, 5, 'N')]
# ---- the crown and halo dulled and cracked (the stagger): rows 3-7 redrawn, its gold gone to embers, a dark crack
STAG = {3: '.................A........XIJJYD......I................', 4: '.................JAI..DM..YIJ..OOB..AIJ................',
        5: '..................JIAYYYIIcYA......IAJ.................', 6: '..................XIOYIAYIIYAYD.....IX.................'}
CRACK = [(26, 4), (27, 5), (27, 6), (28, 7), (24, 11), (25, 12)]


def frame(name, core='base', sparks=0, hem='still', hand_r=None, hand_l=None, rays=False, stag=False, frm='base'):
    out = [f'frame {name} from {frm}']
    dy = 3 if rays else 0
    if rays: out.append('grow 3')
    def row(y, x, s): out.append(f'row {y + dy} {x} {s}')
    if CORE.get(core):
        for y, s in CORE[core].items(): row(y, CORE_X, s)
    for (x, y) in SPARKS.get(sparks, []): row(y, x, 'W')
    if HEM.get(hem):
        for j, s in enumerate(HEM[hem]): assert len(s) == W, (hem, j, len(s)); row(54 + j, 0, s)
        L, R = STRANDS[hem]
        for y in (51, 52, 53): row(y, 4, '....'); row(y, 49, '....')   # (the strands rubbed out where they were)
        for y in (51, 52, 53): row(y, L, 'd'); row(y, R, 'd')
    for H in (HAND_R.get(hand_r), HAND_L.get(hand_l)):
        if not H: continue
        for P in H:
            if P[0] == 'clear': out.append(f'clear {P[1]} {P[2] + dy} {P[3]} {P[4] + dy}')
            else:
                x0, y0, rows = P; out.append(f'at {x0} {y0 + dy}'); out.extend(rows)
    if rays:
        for x, y, s in RAYS: out.append(f'row {y} {x} {s}')   # (in the grown rows: not shifted)
    if stag:
        for y, s in STAG.items(): assert len(s) == W, (y, len(s)); row(y, 0, s)
        for x, y in CRACK: row(y, x, 'Y')
    return out


FRAMES = [
    # idle (4): the stolen sun breathing, light catching the shards
    frame('idle0', 'base', 0), frame('idle1', 'warm', 1), frame('idle2', 'blaze', 2), frame('idle3', 'dim', 3),
    # hover (6): the hem's tatters swinging through, the shards glinting
    frame('hover0', 'warm', 1, 'r1'), frame('hover1', 'base', 0, 'r2'), frame('hover2', 'dim', 4, 'mid'),
    frame('hover3', 'base', 0, 'l1'), frame('hover4', 'warm', 5, 'l2'), frame('hover5', 'base', 2, 'mid'),
    # spear cast (6): one hand lifts, the crown's rays reach up, the core flares, the hand comes down as it fires
    frame('cast0', 'warm', 1), frame('cast1', 'warm', 0, hand_r='half'), frame('cast2', 'blaze', 2, hand_r='up', rays=True),
    frame('cast3', 'blaze', 4, hand_r='up', rays=True), frame('cast4', 'warm', 0, hand_r='half'), frame('cast5', 'dim', 3),
    # summon (6): both hands up, the core at its brightest, every shard alight
    frame('summon0', 'warm', 1, hand_r='half'), frame('summon1', 'blaze', 2, hand_r='up', hand_l='up'), frame('summon2', 'blaze', 4, hand_r='up', hand_l='up', rays=True),
    frame('summon3', 'blaze', 5, hand_r='up', hand_l='up', rays=True), frame('summon4', 'warm', 1, hand_r='up', hand_l='up'), frame('summon5', 'warm', 0, hand_r='half'),
    # stagger (4): the crown dulled and cracked, the core near out, the hem hanging still
    frame('stag0', 'dim', 0, stag=True), frame('stag1', 'dark', 0, 'mid', stag=True), frame('stag2', 'dark', 0, 'mid', stag=True), frame('stag3', 'dim', 0, stag=True),
]
CLIPS = ['clip idle 5 idle0 idle1 idle2 idle3', 'clip hover 7 hover0 hover1 hover2 hover3 hover4 hover5',
         'clip cast 10 cast0 cast1 cast2 cast3 cast4 cast5', 'clip summon 8 summon0 summon1 summon2 summon3 summon4 summon5',
         'clip stagger 5 stag0 stag1 stag2 stag3']

if __name__ == '__main__':
    txt = open(PIX, encoding='utf8').read()
    head = txt.split('\n# ---- drawn frames')[0].rstrip('\n')
    body = ['', '# ---- drawn frames (tools/solkhar_frames.py writes everything below)'] + [l for F in FRAMES for l in F + ['']] + CLIPS
    open(PIX, 'w', encoding='utf8', newline='\n').write(head + '\n' + '\n'.join(body) + '\n')
    print(len(FRAMES), 'frames')
