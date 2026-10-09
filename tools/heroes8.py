"""The eight classes as 8x8 RotMG-style sprites.

Each class is a readable little figure: a hat or helmet, a face, a body colour and a weapon you can see.
No outline in the art: the game draws a thin one (src/outline.js). Pixels are stored doubled (16x16 frames)
so the engine's coordinates are unchanged.

Hand-drawn per class: the top 7 rows of front / side (facing right) / back, standing and attacking.
Row 8 (the feet) is generic: a stand pose and two stride poses per view.
Everything else (idle, walk cycles, ability, hit, death) is assembled from those.

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
C = {}
C['brawler'] = dict(file='forgefist', pal={'h': '#4A2A18', 'r': '#E0303A', 'b': '#9A5C34', 'B': '#6A3C20', 'g': '#FF9A2A', 'w': '#E4ECF8', 'd': '#C98A22', 'l': '#8A5A3A'},
    F=['..hhhh..', '.rrrrrr.', '..sese.w', '..ssss.w', '.sbBBbsd', '.gbbbb..', '..bBBb..'],
    S=['..hhhh..', '.rrrrr..', '..hses..', '..hsss..', '..bbbsdw', '..gbbb..', '..bBBb..'],
    B=['..hhhh..', '.rrrrrr.', '..hhhh.w', '..hhhh.w', '.sbBBbsd', '.gbbbb..', '..bBBb..'],
    FA=['..hhhh.w', '.rrrrrrw', '..sese.w', '..sssssd', '.sbBBb..', '.gbbbb..', '..bBBb..'],
    SA=['..hhhh..', '.rrrrr..', '..hses..', '..hsss..', '..bbsdww', '..gbbb..', '..bBBb..'],
    BA=['..hhhh.w', '.rrrrrrw', '..hhhh.w', '..hhhhsd', '.sbBBb..', '.gbbbb..', '..bBBb..'])
C['forge_knight'] = dict(file='anvilheart', pal={'i': '#C8D2E4', 'I': '#7A86A0', 'k': '#1A1E2A', 'r': '#D8283A', 'w': '#E4ECF8', 'd': '#C98A22', 'l': '#7A86A0'},
    F=['..iiii..', '.iiiiii.', '.iikkii.', '..iiii.w', '.irrrriw', '.iIrrIid', '..IrrI..'],
    S=['..iiii..', '.iiiii..', '.iiikk..', '..iiii..', '..irridw', '..irri..', '..IrrI..'],
    B=['..iiii..', '.iiiiii.', '.iiiiii.', '..iiii.w', '.iIIIIiw', '.iIIIIid', '..IiiI..'],
    FA=['..iiii.w', '.iiiiiiw', '.iikkiiw', '..iiiid.', '.irrrri.', '.iIrrIi.', '..IrrI..'],
    SA=['..iiii..', '.iiiii..', '.iiikk..', '..iiii..', '..irdwww', '..irri..', '..IrrI..'],
    BA=['..iiii.w', '.iiiiiiw', '.iiiiiiw', '..iiiid.', '.iIIIIi.', '.iIIIIi.', '..IiiI..'])
C['priest'] = dict(file='heliarch', pal={'y': '#FFD650', 'Y': '#FFF2A8', 'f': '#F4F0E6', 'F': '#C4BED4', 'a': '#C8D0DC', 'A': '#FFF2A8', 'l': '#B08A60'},
    F=['.y.yy.y.', '..yYYy.A', '..sese.a', '..ffff.a', '.sfyyfsa', '..fyyf..', '.ffffff.'],
    S=['..y.yy..', '..yYYy..', '..fses..', '..fff...', '..fyfsaA', '..fyff..', '..fffff.'],
    B=['.y.yy.y.', '..yYYy.A', '..ffff.a', '..ffff.a', '.sfFFfsa', '..fFFf..', '.ffffff.'],
    FA=['.y.yy.yA', '..yYYy.a', '..sese.a', '..ffffs.', '.sfyyf..', '..fyyf..', '.ffffff.'],
    SA=['..y.yy..', '..yYYy..', '..fses..', '..fff...', '..fysaaA', '..fyff..', '..fffff.'],
    BA=['.y.yy.yA', '..yYYy.a', '..ffff.a', '..ffffs.', '.sfFFf..', '..fFFf..', '.ffffff.'])
C['summoner'] = dict(file='reliquarian', pal={'K': '#4E3880', 'k': '#1E1430', 'c': '#5EF0C8', 'f': '#E8E0C8', 'n': '#7A6A52', 'y': '#7CFFB0', 'l': '#6A5A8A'},
    F=['..KKKK.y', '.KKKKKKn', '.KckkcKn', '.KkkkkKn', 'fKKKKKfn', '.KKKKKK.', '.KKKKKK.'],
    S=['..KKKK.y', '.KKKKK.n', '.KKKkc.n', '.KKKkk.n', '..KKKKfn', '.KKKKK..', '.KKKKKK.'],
    B=['..KKKK.y', '.KKKKKKn', '.KKKKKKn', '.KKKKKKn', 'fKKKKKfn', '.KKKKKK.', '.KKKKKK.'],
    FA=['..KKKKyy', '.KKKKKKn', '.KckkcKn', '.KkkkkKn', 'fKKKKKf.', '.KKKKKK.', '.KKKKKK.'],
    SA=['..KKKK..', '.KKKKK..', '.KKKkc..', '.KKKkk.y', '..KKKfny', '.KKKKK..', '.KKKKKK.'],
    BA=['..KKKKyy', '.KKKKKKn', '.KKKKKKn', '.KKKKKKn', 'fKKKKKf.', '.KKKKKK.', '.KKKKKK.'])
C['harpooner'] = dict(file='wreckwhaler', pal={'Y': '#FFD030', 'y': '#B88410', 'g': '#8AD8F0', 'N': '#3058A0', 'n': '#8A6038', 'f': '#F0E6D0', 'l': '#7A5A3A'},
    F=['..YYYY.f', '.YyyyyYn', '.YseseYn', '.YYYYYYn', '.sNNNNsn', '..NyyN.n', '..NNNN..'],
    S=['..YYYY..', '.YYYyy..', '.YYYse..', '.YYYYY..', '..NNNsnf', '..NyyN..', '..NNNN..'],
    B=['..YYYY.f', '.YyyyyYn', '.YYYYYYn', '.YYYYYYn', '.sNNNNsn', '..NNNN.n', '..NNNN..'],
    FA=['..YYYYff', '.YyyyyYn', '.YseseYn', '.YYYYYYn', '.sNNNNs.', '..NyyN..', '..NNNN..'],
    SA=['..YYYY..', '.YYYyy..', '.YYYse..', '.YYYYY..', '..NNsnnf', '..NyyN..', '..NNNN..'],
    BA=['..YYYYff', '.YyyyyYn', '.YYYYYYn', '.YYYYYYn', '.sNNNNs.', '..NNNN..', '..NNNN..'])
C['duelist'] = dict(file='mirrorknight', pal={'v': '#A050F0', 'V': '#5E2CA0', 'p': '#F4F0F8', 'm': '#B8DCF8', 'M': '#FFFFFF', 'f': '#F4F0F8', 'w': '#E4ECF8', 'd': '#C98A22', 'l': '#6A4A9A'},
    F=['..p.....', '.vvvvvv.', '..mMmm..', '..mmMm.w', '.sVffVsw', '..VffV.d', '..VVVV..'],
    S=['...p....', '.vvvvvv.', '..vmMm..', '..vmmM..', '..VfVsdw', '..VVVV..', '..VVVV..'],
    B=['..p.....', '.vvvvvv.', '..vvvv..', '..VVVV.w', '.sVVVVsw', '..VVVV.d', '..VVVV..'],
    FA=['..p.....', '.vvvvvvw', '..mMmm.w', '..mmMmsd', '.sVffV..', '..VffV..', '..VVVV..'],
    SA=['...p....', '.vvvvvv.', '..vmMm..', '..vmmM..', '..VfsdwW'.replace('W', 'w'), '..VVVV..', '..VVVV..'],
    BA=['..p.....', '.vvvvvvw', '..vvvv.w', '..VVVVsd', '.sVVVV..', '..VVVV..', '..VVVV..'])
C['stormwright'] = dict(file='kitehermit', pal={'t': '#E8C878', 'T': '#B8964A', 'f': '#F4F4F8', 'u': '#3A7AE8', 'U': '#2A58B0', 'n': '#C87A3A', 'c': '#8AF6FF', 'l': '#8A7A5A'},
    F=['...tt..c', '.tttttTn', '..sese.n', '..ffff.n', '.suffusn', '..uUUu..', '.uuuuuu.'],
    S=['...tt.c.', '.ttttTn.', '..Tsesn.', '...ffsn.', '..uuuun.', '..uUUu..', '..uuuuu.'],
    B=['...tt..c', '.tttttTn', '..TTTT.n', '..TTTT.n', '.suuuusn', '..uUUu..', '.uuuuuu.'],
    FA=['...tt.cc', '.tttttTc', '..sese.n', '..ffffsn', '.suffu..', '..uUUu..', '.uuuuuu.'],
    SA=['...tt...', '.ttttT..', '..Tses..', '...ffs.c', '..uuusnc', '..uUUu..', '..uuuuu.'],
    BA=['...tt.cc', '.tttttTc', '..TTTT.n', '..TTTTsn', '.suuuu..', '..uUUu..', '.uuuuuu.'])
C['clockmaker'] = dict(file='horologist', pal={'k': '#2E2836', 'y': '#F2C14E', 'c': '#8AE6FF', 'b': '#8A5432', 'B': '#5A3420', 'g': '#F2C14E', 'h': '#5A3A22', 'n': '#B0B0C0', 'N': '#FFE08A', 'l': '#7A5236'},
    F=['..kkkk.N', '..kkkk.n', '.kkkkkkn', '..ycyc.n', '.sbggbsn', '..bBBb..', '..bbbb..'],
    S=['..kkk..N', '..kkk..n', '.kkkkk.n', '..hsyc.n', '..bbbsn.', '..bBBb..', '..bbbb..'],
    B=['..kkkk..', '..kkkk.N', '.kkkkkkn', '..hhhh.n', '.sbggbsn', '..bggb..', '..bbbb..'],
    FA=['..kkkkNN', '..kkkk.n', '.kkkkkkn', '..ycycsn', '.sbggb..', '..bBBb..', '..bbbb..'],
    SA=['..kkk...', '..kkk...', '.kkkkk..', '..hsyc..', '..bbbsnN', '..bBBb..', '..bbbb..'],
    BA=['..kkkkNN', '..kkkk.n', '.kkkkkkn', '..hhhhsn', '.sbggb..', '..bggb..', '..bbbb..'])
C['runeblade'] = dict(file='runeblade', pal={'i': '#A4AEC6', 'I': '#5E6680', 'c': '#46F5D6', 'r': '#C83A3A', 'w': '#C8F8FF', 'W': '#46F5D6', 'd': '#C98A22', 'l': '#7A84A0'},
    F=['..iiii.W', '.iIIIIiw', '.icIIciw', '.rrrrrrw', '.iIcIIid', '..iIIi..', '..IiiI..'],
    S=['..iiii..', '.iIIII..', '.iIIIc..', 'rrrrrr.W', '..iIcidw', '..iIIi..', '..IiiI..'],
    B=['..iiii.W', '.iIIIIiw', '.iIIIIiw', '.rrrrrrw', '.irrrrid', '..rrrr..', '..IrrI..'],
    FA=['..iiiiWw', '.iIIIIiw', '.icIIcid', '.rrrrrr.', '.iIcIIi.', '..iIIi..', '..IiiI..'],
    SA=['..iiii..', '.iIIII..', '.iIIIc..', 'rrrrrr..', '..iIcdwW', '..iIIi..', '..IiiI..'],
    BA=['..iiiiWw', '.iIIIIiw', '.iIIIIid', '.rrrrrr.', '.irrrri.', '..rrrr..', '..IrrI..'])
C['hexweaver'] = dict(file='hexweaver', pal={'p': '#9058E0', 'P': '#5A2E9A', 'y': '#FFD650', 'o': '#8AF6FF', 'n': '#7A5A3A', 'l': '#6A48A8'},
    F=['...pp..o', '..pppp.n', '.psesepn', '..pssp.n', '.spyypsn', '.pPppPp.', '.pppppp.'],
    S=['...pp..o', '..pppp.n', '..ppse.n', '..ppss.n', '..ppypsn', '.pPppP..', '.pppppp.'],
    B=['...pp..o', '..pppp.n', '.ppppppn', '..pPPp.n', '.spPPpsn', '.pPppPp.', '.pppppp.'],
    FA=['...pp.oo', '..pppp.o', '.psesepn', '..psspsn', '.spyyp..', '.pPppPp.', '.pppppp.'],
    SA=['...pp...', '..ppp...', '..ppse..', '..pps...', '..ppysnoo'[:8], '.pPppP..', '.pppppp.'],
    BA=['...pp.oo', '..pppp.o', '.ppppppn', '..pPPpsn', '.spPPp..', '.pPppPp.', '.pppppp.'])


def frame(top, feet):
    g = list(top) + [feet]
    assert len(g) == 8 and all(len(r) == 8 for r in g), g
    return g


def flipx(g):
    return [r[::-1] for r in g]


def lying(g):
    """fallen over: the figure rotated onto its side, lying along the ground"""
    rot = [''.join(g[7 - x][y] for x in range(8)) for y in range(8)]      # 90 degrees clockwise
    rows = [r for r in rot if r.strip('.')]
    return ['.' * 8] * (8 - len(rows)) + rows


def squash(g):
    rows = [r for i, r in enumerate(g) if i % 3 != 1 or i == 7]
    return ['.' * 8] * (8 - len(rows)) + rows


def build(cls, D):
    pal = {k: hex_rgba(v) for k, v in {**SKIN, **D['pal']}.items()}
    f = lambda top, view, k=0: frame(top, FEET[view][k])
    F0, S0, B0 = f(D['F'], 'front'), f(D['S'], 'side'), f(D['B'], 'back')
    walk = lambda top, view: [f(top, view, 0), f(top, view, 1), f(top, view, 0), f(top, view, 2)]
    rows = [
        [F0, F0] + walk(D['F'], 'front'),
        [S0, S0] + walk(D['S'], 'side'),
        [B0, B0] + walk(D['B'], 'back'),
        [F0, f(D['FA'], 'front'), S0, f(D['SA'], 'side', 1), B0, f(D['BA'], 'back')],
        [f(D['FA'], 'front'), f(D['FA'], 'front'), F0, F0],
        [F0, squash(F0), lying(F0), lying(F0)],
    ]
    anims = {
        'front_idle': (0, 0, 2, 3), 'front_walk': (0, 2, 4, 8), 'side_idle': (1, 0, 2, 3), 'side_walk': (1, 2, 4, 8),
        'back_idle': (2, 0, 2, 3), 'back_walk': (2, 2, 4, 8),
        'front_attack': (3, 0, 2, 10), 'side_attack': (3, 2, 2, 10), 'back_attack': (3, 4, 2, 10),
        'ability': (4, 0, 3, 8), 'hit': (4, 3, 1, 1), 'death': (5, 0, 4, 6),
    }
    COLS = 6
    W, H = COLS * 16, len(rows) * 16
    out = [[(0, 0, 0, 0)] * W for _ in range(H)]
    for r, row in enumerate(rows):
        for c, g in enumerate(row):
            for y in range(8):
                for x in range(8):
                    ch = g[y][x]
                    if ch == '.':
                        continue
                    col = pal[ch]
                    for dy in (0, 1):
                        for dx in (0, 1):
                            out[r * 16 + y * 2 + dy][c * 16 + x * 2 + dx] = col
    d = os.path.join(ROOT, cls)
    os.makedirs(d, exist_ok=True)
    write_png(os.path.join(d, D['file'] + '_sheet.png'), out)
    from retro import shade_sheet
    from reduce import read_png
    shade_sheet(os.path.join(d, D['file'] + '_sheet.png'), 16, 16)   # RotMG light and shadow
    px = read_png(os.path.join(d, D['file'] + '_sheet.png'))          # ...but not on the legs: a one-pixel leg is all edge,
    for y in range(H):                                                 # and shading would sink it into the outline
        if y % 16 >= 14:
            for x in range(W):
                if out[y][x][3]:
                    px[y][x] = out[y][x]
    write_png(os.path.join(d, D['file'] + '_sheet.png'), px)
    guide = {'image': D['file'] + '_sheet.png', 'frameWidth': 16, 'frameHeight': 16, 'columns': COLS, 'rows': len(rows),
             'art': 8, 'pivot': {'x': 8, 'y': 15},
             'animations': {k: {'row': a, 'col': b, 'frames': n, 'fps': fps, 'loop': k.endswith(('idle', 'walk'))} for k, (a, b, n, fps) in anims.items()}}
    json.dump(guide, open(os.path.join(d, D['file'] + '_sheet.json'), 'w'), indent=2)


if __name__ == '__main__':
    for cls, D in C.items():
        build(cls, D)          # all ten, the Runeblade and the Hexweaver included (no longer from the sprite pack)
    print('built', list(C))
