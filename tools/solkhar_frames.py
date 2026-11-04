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


# ---- his looks by phase (the spec: II "halo divides into fragments"; III "chest armor splits, sun flares, halo cracks";
# IV "crown and mantle break, body becomes a black-gold silhouette"): each a base of its own, drawn over the one before
LOOK2 = ['frame base2 from base',                            # II: the halo broken in four places, white at each break
         'clear 20 5 22 6', 'clear 32 4 34 4', 'clear 17 10 18 11', 'clear 38 10 39 11',
         'row 5 19 W', 'row 6 23 W', 'row 4 31 W', 'row 4 35 W', 'row 9 17 W', 'row 12 17 W', 'row 9 38 W', 'row 12 38 W']
CRACKS = [(20, 30), (21, 31), (21, 32), (22, 33), (23, 34), (35, 30), (34, 31), (34, 32), (33, 33), (33, 34),
          (18, 40), (19, 41), (19, 42), (20, 43), (37, 40), (36, 41), (36, 42), (35, 43), (27, 33), (28, 34), (28, 35), (27, 36)]
LOOK3 = ['frame base3 from base2'] + [f'row {y} {x} Z' for x, y in CRACKS] + ['clear 25 4 26 5', 'row 6 25 W']   # III: light through the split armour; the halo cracked again
# IV: the black-gold silhouette: every colour of him to black and violet-black, his gold to one dark gold; the stolen
# sun in his chest left blazing (each pixel drawn again in its new colour: a palette of four)
SIL = {**{k: 'T' for k in 'WNZVPHTCX'}, **{k: 'L' for k in 'AIQSabBFJ'}, **{k: 'U' for k in 'EKMRcdOD'}, **{k: 'Y' for k in 'GULY'}}
VOIDP = {**{k: 'G' for k in 'WNZVPHTCX'}, **{k: 'U' for k in 'AIQSabBFJ'}, **{k: 'L' for k in 'EKMRcdOD'}, **{k: 'Y' for k in 'GULY'}}


def mapped(name, frm_rows, M, keep_core=True, extra=()):
    out = [f'frame {name}']
    for y, r in enumerate(frm_rows):
        out.append(''.join(ch if ch == '.' or (keep_core and 22 <= y <= 28 and 25 <= x <= 32) else M.get(ch, ch) for x, ch in enumerate(r)))
    return out + list(extra)


def base_rows():
    t = open(PIX, encoding='utf8').read().split('frame base\n')[1].split('\n')
    return [r for r in t[:58]]


def apply_cracks(rows):
    g = [list(r) for r in rows]
    for x, y in CRACKS: g[y][x] = 'Z'
    for (x0, y0, x1, y1) in [(20, 5, 22, 6), (32, 4, 34, 4), (17, 10, 18, 11), (38, 10, 39, 11), (25, 4, 26, 5)]:
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): g[y][x] = '.'
    return [''.join(r) for r in g]


def phase_set(p, frm):
    P = f'p{p}_'
    F = [frame(P + 'idle0', 'base', 0, frm=frm), frame(P + 'idle1', 'warm', 1, frm=frm), frame(P + 'idle2', 'blaze', 2, frm=frm), frame(P + 'idle3', 'dim', 3, frm=frm),
         frame(P + 'hover0', 'warm', 1, 'r1', frm=frm), frame(P + 'hover1', 'base', 0, 'r2', frm=frm), frame(P + 'hover2', 'dim', 4, 'mid', frm=frm),
         frame(P + 'hover3', 'base', 0, 'l1', frm=frm), frame(P + 'hover4', 'warm', 5, 'l2', frm=frm), frame(P + 'hover5', 'base', 2, 'mid', frm=frm),
         frame(P + 'cast0', 'warm', 1, frm=frm), frame(P + 'cast1', 'warm', 0, hand_r='half', frm=frm), frame(P + 'cast2', 'blaze', 2, hand_r='up', rays=True, frm=frm),
         frame(P + 'cast3', 'blaze', 4, hand_r='up', rays=True, frm=frm), frame(P + 'cast4', 'warm', 0, hand_r='half', frm=frm), frame(P + 'cast5', 'dim', 3, frm=frm),
         frame(P + 'summon0', 'warm', 1, hand_r='half', frm=frm), frame(P + 'summon1', 'blaze', 2, hand_r='up', hand_l='up', frm=frm), frame(P + 'summon2', 'blaze', 4, hand_r='up', hand_l='up', rays=True, frm=frm),
         frame(P + 'summon3', 'blaze', 5, hand_r='up', hand_l='up', rays=True, frm=frm), frame(P + 'summon4', 'warm', 1, hand_r='up', hand_l='up', frm=frm), frame(P + 'summon5', 'warm', 0, hand_r='half', frm=frm),
         frame(P + 'stag0', 'dim', 0, stag=True, frm=frm), frame(P + 'stag1', 'dark', 0, 'mid', stag=True, frm=frm), frame(P + 'stag2', 'dark', 0, 'mid', stag=True, frm=frm), frame(P + 'stag3', 'dim', 0, stag=True, frm=frm),
         # beam wind-up (8): both hands come up and the core gathers to a white point, light drawn in toward it from his halo
         frame(P + 'beam0', 'warm', 0, frm=frm), frame(P + 'beam1', 'warm', 1, hand_r='half', frm=frm), frame(P + 'beam2', 'blaze', 0, hand_r='half', hand_l='up', frm=frm), frame(P + 'beam3', 'blaze', 2, hand_r='up', hand_l='up', frm=frm),
         frame(P + 'beam4', 'blaze', 4, hand_r='up', hand_l='up', rays=True, frm=frm), frame(P + 'beam5', 'blaze', 5, hand_r='up', hand_l='up', rays=True, frm=frm), frame(P + 'beam6', 'blaze', 1, hand_r='up', hand_l='up', rays=True, frm=frm), frame(P + 'beam7', 'warm', 3, hand_r='half', frm=frm),
         # chase burst (6): his hem thrown back hard, the core blazing, light on every shard
         frame(P + 'chase0', 'blaze', 1, 'r2', frm=frm), frame(P + 'chase1', 'blaze', 4, 'r1', frm=frm), frame(P + 'chase2', 'warm', 2, 'r2', frm=frm),
         frame(P + 'chase3', 'blaze', 5, 'l2', frm=frm), frame(P + 'chase4', 'blaze', 3, 'l1', frm=frm), frame(P + 'chase5', 'warm', 1, 'l2', frm=frm)]
    for f in F:                                              # (beam frames: lines of light drawn in toward the core, closer each frame)
        n = f[0].split()[1]
        if '_beam' in n:
            k = int(n[-1]); dy = 3 if 'grow 3' in f else 0
            for (ax, ay) in [(-1, -1), (1, -1), (-1, 1), (1, 1), (0, -1), (-1, 0), (1, 0)]:
                r = 13 - k * 1.4
                if r > 4: f.append(f'row {int(28 + ay * r * 0.8) - 3 + dy} {int(28 + ax * r)} {"W" if k % 2 else "N"}')
    return F


# ---- his death (12): the core blazes white, cracks of light run through him, the crown goes dark, the core goes out;
# then he crumbles from the crown down, an edge of ash on each line that goes, to a heap of ash
def death():
    F = [frame('death0', 'blaze', 2, frm='base4'), frame('death1', 'blaze', 4, frm='base4')]
    F.append(['frame death2 from death1'] + [f'row {y} {x} W' for x, y in CRACKS])
    F.append(['frame death3 from death2'] + [f'row {y} {x} N' for x, y in CRACKS] + [f'row {y} 0 {s}' for y, s in STAG.items()] + [f'row {y} {x} Y' for x, y in CRACK])
    F.append(['frame death4 from death3', f'row 23 {CORE_X} {CORE["dark"][23]}', f'row 24 {CORE_X} {CORE["dark"][24]}', f'row 25 {CORE_X} {CORE["dark"][25]}', f'row 26 {CORE_X} {CORE["dark"][26]}'])
    prev = 'death4'
    for k, cut in enumerate([8, 15, 22, 30, 38, 45, 51]):   # (crumbling: everything above the line gone, the line itself ash)
        F.append([f'frame death{5 + k} from {prev}', f'clear 0 0 54 {cut - 1}', f'row {cut} 0 ' + ''.join(('?' if R4[cut][x] == '.' else 'D' if (x * 7 + k) % 3 else 'G') for x in range(W))]); prev = f'death{5 + k}'   # (ash only where he still is)
    return F


# ---- his void form (the finale, 6): the black of the eclipse with violet light in him, the sun torn out of his chest
def void(rows):
    V0 = mapped('void0', rows, VOIDP, keep_core=False)
    F = [V0]
    for k in range(1, 6):
        f = [f'frame void{k} from void0'] + [f'row {y} {CORE_X} {"YYYYYYYY"}' for y in range(23, 28)]
        for (x, y) in SPARKS[k % 5 + 1]: f.append(f'row {y} {x} B')
        for j in range(4): f.append(f'row {50 - j * 9 + k} {8 + (j * 13 + k * 5) % 40} G')   # (violet motes coming off him)
        F.append(f)
    F[0] += [f'row {y} {CORE_X} YYYYYYYY' for y in range(23, 28)]
    return F


R1 = base_rows(); R3 = apply_cracks(R1); R4 = mapped('x', R3, SIL)[1:]
FRAMES = [LOOK2, LOOK3, mapped('base4', R3, SIL)] + phase_set(1, 'base') + phase_set(2, 'base2') + phase_set(3, 'base3') + phase_set(4, 'base4') + death() + void(R1)
CLIPS = []
for p in (1, 2, 3, 4):
    P = f'p{p}_'
    CLIPS += [f'clip {P}idle 5 ' + ' '.join(P + f'idle{k}' for k in range(4)), f'clip {P}hover 7 ' + ' '.join(P + f'hover{k}' for k in range(6)),
              f'clip {P}cast 10 ' + ' '.join(P + f'cast{k}' for k in range(6)), f'clip {P}summon 8 ' + ' '.join(P + f'summon{k}' for k in range(6)),
              f'clip {P}stagger 5 ' + ' '.join(P + f'stag{k}' for k in range(4)), f'clip {P}beam 7 ' + ' '.join(P + f'beam{k}' for k in range(8)),
              f'clip {P}chase 12 ' + ' '.join(P + f'chase{k}' for k in range(6))]
for p in (2, 3, 4):                                          # his changes (12 frames): the old look summoning, staggering into the new, the new waking
    a, b = f'p{p - 1}_', f'p{p}_'
    CLIPS.append(f'clip {b}enter 4 ' + ' '.join([a + 'cast0'] + [a + f'summon{k}' for k in range(1, 5)] + [b + 'stag0', b + 'stag1', b + 'stag3', b + 'summon2', b + 'summon3', b + 'idle2', b + 'idle0']))
CLIPS += ['clip death 3 ' + ' '.join(f'death{k}' for k in range(12)), 'clip void 4 ' + ' '.join(f'void{k}' for k in range(6))]

if __name__ == '__main__':
    txt = open(PIX, encoding='utf8').read()
    head = txt.split('\n# ---- drawn frames')[0].rstrip('\n')
    body = ['', '# ---- drawn frames (tools/solkhar_frames.py writes everything below)'] + [l for F in FRAMES for l in F + ['']] + CLIPS
    open(PIX, 'w', encoding='utf8', newline='\n').write(head + '\n' + '\n'.join(body) + '\n')
    print(len(FRAMES), 'frames')
