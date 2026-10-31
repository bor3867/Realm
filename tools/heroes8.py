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
# 2026-10-31, the user: every class a true 8x8 sprite, keeping who it is. Redrawn from the Realm Remaster's look of each
# (its colours, its kit), but native 8x8: one art pixel is one 2x2 block, shading included.
# the Forgefist: shirtless, a red headband with trailing tails, brown hair, a short blade
C['brawler'] = dict(file='forgefist', pal={'h': '#5A3420', 'r': '#E0303A', 'k': '#C8885E', 'b': '#7A4A2A', 'B': '#3A2414', 'w': '#E4ECF8', 'd': '#C98A22', 'l': '#5A3420'}, flat='se',
    F=['..hhhh..', 'rrrrrr.w', 'r.sese.w', '.sskkssw', 'ssBBBBsd', '..bbbb..', '..bbbb..'],
    S=['..hhhh..', '.rrrrrr.', 'r.hhses.', '..hsss..', '..sssdww', '..BBBB..', '..bbbb..'],
    B=['..hhhh..', 'rrrrrr.w', 'r.hhhh.w', '.sssssw.', 'ssBBBBsd', '..bbbb..', '..bbbb..'],
    FA=['..hhhh.w', 'rrrrrr.w', 'r.sese.w', '.sskkssd', 'ssBBBB..', '..bbbb..', '..bbbb..'],
    SA=['..hhhh..', '.rrrrrr.', 'r.hhses.', '..hsss..', '..ssdwww', '..BBBB..', '..bbbb..'],
    BA=['..hhhh.w', 'rrrrrr.w', 'r.hhhh.w', '.sssssd.', 'ssBBBB..', '..bbbb..', '..bbbb..'])
# the Anvilheart: a closed silver helm with a dark visor, a red tabard with a gold anvil, a sword
C['forge_knight'] = dict(file='anvilheart', pal={'i': '#C8D2E4', 'I': '#7A86A0', 'k': '#1A1E2A', 'r': '#D8283A', 'w': '#E4ECF8', 'd': '#E0A22A', 'l': '#7A86A0'},
    F=['..iiii..', '.iiiiii.', '.ikkkki.', '..iiii.w', '.irddriw', '.Irrrrid', '..IrrI..'],
    S=['..iiii..', '.iiiii..', '.iiikk..', '..iiii..', '..irridw', '..irri..', '..IrrI..'],
    B=['..iiii..', '.iiiiii.', '.iiiiii.', '..iiii.w', '.iIIIIiw', '.iIIIIid', '..IiiI..'],
    FA=['..iiii.w', '.iiiiiiw', '.ikkkkiw', '..iiiid.', '.irddri.', '.Irrrri.', '..IrrI..'],
    SA=['..iiii..', '.iiiii..', '.iiikk..', '..iiii..', '..irdwww', '..irri..', '..IrrI..'],
    BA=['..iiii.w', '.iiiiiiw', '.iiiiiiw', '..iiiid.', '.iIIIIi.', '.iIIIIi.', '..IiiI..'])
# the Heliarch: a tall white mitre banded in gold, a white beard and robe, a gold staff with a blue stone
C['priest'] = dict(file='heliarch', pal={'y': '#E0A22A', 'f': '#F4F0E6', 'F': '#C4BED4', 'a': '#D8A030', 'A': '#4AA8F0', 'l': '#B08A60'}, flat='se',
    F=['...ff..A', '..fyyf.a', '..sese.a', '..ffff.a', '.sfyyfsa', '..fFFf..', '.ffffff.'],
    S=['...ff..A', '..fyyf.a', '..ffse.a', '..ffff.a', '..ffffsa', '..fyyf..', '.ffffff.'],
    B=['...ff..A', '..fyyf.a', '..ffff.a', '..ffff.a', '.sfyyfsa', '..fyyf..', '.ffffff.'],
    FA=['...ff.AA', '..fyyf.a', '..sese.a', '..ffffsa', '.sfyyf..', '..fFFf..', '.ffffff.'],
    SA=['...ff...', '..fyyf..', '..ffse.A', '..ffffsa', '..ffff.a', '..fyyf..', '.ffffff.'],
    BA=['...ff.AA', '..fyyf.a', '..ffff.a', '..ffffsa', '.sfyyf..', '..fyyf..', '.ffffff.'])
# the Reliquarian: a pointed purple hood over darkness and two green eyes, bone hands, a staff with a green stone
C['summoner'] = dict(file='reliquarian', pal={'K': '#6A48B0', 'P': '#3E2A78', 'k': '#140C20', 'c': '#5EF0A8', 'f': '#E8E0C8', 'n': '#7A6A52', 'y': '#7CFFB0', 'l': '#4E3880'},
    F=['...KK..y', '..KKKK.n', '.KkkkkKn', '.KckkcKn', 'fKKKKKfn', '.KPKKPK.', '.KKKKKK.'],
    S=['...KK..y', '..KKKK.n', '.KKKkk.n', '.KKKkc.n', '.KKKKKfn', '.KPKKK..', '.KKKKKK.'],
    B=['...KK..y', '..KKKK.n', '.KKKKKKn', '.KKKKKKn', 'fKKcKKfn', '.KPKKPK.', '.KKKKKK.'],
    FA=['...KK.yy', '..KKKK.n', '.KkkkkKn', '.KckkcKn', 'fKKKKKf.', '.KPKKPK.', '.KKKKKK.'],
    SA=['...KK...', '..KKKK..', '.KKKkk..', '.KKKkc.y', '.KKKKfny', '.KPKKK..', '.KKKKKK.'],
    BA=['...KK.yy', '..KKKK.n', '.KKKKKKn', '.KKKKKKn', 'fKKcKKf.', '.KPKKPK.', '.KKKKKK.'])
# the Wreck-Whaler: a yellow sou'wester and slicker, a red neckerchief, blue overalls, a harpoon
C['harpooner'] = dict(file='wreckwhaler', pal={'Y': '#FFD030', 'y': '#B88410', 'r': '#E0303A', 'N': '#3058A0', 'n': '#8A6038', 'f': '#F0E6D0', 'l': '#7A5A3A'}, flat='se',
    F=['..YYYY.f', '.YyyyyYn', '.YseseYn', '.YrrrrYn', '.sNNNNsn', '..NyyN.n', '..NNNN..'],
    S=['..YYYY..', '.YYYyy..', '.YYYse..', '.YYrrr..', '..NNNsnf', '..NyyN..', '..NNNN..'],
    B=['..YYYY.f', '.YyyyyYn', '.YYYYYYn', '.YYYYYYn', '.sNNNNsn', '..NNNN.n', '..NNNN..'],
    FA=['..YYYYff', '.YyyyyYn', '.YseseYn', '.YrrrrYn', '.sNNNNs.', '..NyyN..', '..NNNN..'],
    SA=['..YYYY..', '.YYYyy..', '.YYYse..', '.YYrrr..', '..NNsnnf', '..NyyN..', '..NNNN..'],
    BA=['..YYYYff', '.YyyyyYn', '.YYYYYYn', '.YYYYYYn', '.sNNNNs.', '..NNNN..', '..NNNN..'])
# the Mirror-Knight: a wide magenta hat with a white plume, a magenta coat with gold buttons, a rapier
C['duelist'] = dict(file='mirrorknight', pal={'m': '#D04890', 'M': '#8A2860', 'p': '#F4F0F8', 'w': '#E4ECF8', 'd': '#C98A22', 'y': '#FFD650', 'l': '#6A2A50'}, flat='se',
    F=['...pm...', '..mmmm.w', 'mmmmmmmw', '..sese.w', '.smyymsd', '..mMMm..', '..mmmm..'],
    S=['..pm....', '..mmmm..', 'mmmmmmm.', '..mmse..', '..mmsdww', '..mMMm..', '..mmmm..'],
    B=['...pm...', '..mmmm.w', 'mmmmmmmw', '..mmmm.w', '.smMMmsd', '..mMMm..', '..mmmm..'],
    FA=['...pm..w', '..mmmm.w', 'mmmmmmmw', '..sese.d', '.smyyms.', '..mMMm..', '..mmmm..'],
    SA=['..pm....', '..mmmm..', 'mmmmmmm.', '..mmse..', '..msdwww', '..mMMm..', '..mmmm..'],
    BA=['...pm..w', '..mmmm.w', 'mmmmmmmw', '..mmmm.d', '.smMMms.', '..mMMm..', '..mmmm..'])
# the Kite-Hermit: a wide straw hat, a white beard, a blue robe, a staff with a storm crystal
C['stormwright'] = dict(file='kitehermit', pal={'t': '#E8C878', 'T': '#B8964A', 'f': '#F4F4F8', 'u': '#3A7AE8', 'U': '#2A58B0', 'n': '#C87A3A', 'c': '#8AF6FF', 'l': '#8A7A5A'}, flat='se',
    F=['...tt..c', '.tttttTn', '..sese.n', '..ffff.n', '.suffusn', '..uUUu..', '.uuuuuu.'],
    S=['...tt.c.', '.ttttTn.', '..Tsesn.', '...ffsn.', '..uuuun.', '..uUUu..', '..uuuuu.'],
    B=['...tt..c', '.tttttTn', '..TTTT.n', '..TTTT.n', '.suuuusn', '..uUUu..', '.uuuuuu.'],
    FA=['...tt.cc', '.tttttTc', '..sese.n', '..ffffsn', '.suffu..', '..uUUu..', '.uuuuuu.'],
    SA=['...tt...', '.ttttT..', '..Tses..', '...ffs.c', '..uuusnc', '..uUUu..', '..uuuuu.'],
    BA=['...tt.cc', '.tttttTc', '..TTTT.n', '..TTTTsn', '.suuuu..', '..uUUu..', '.uuuuuu.'])
# the Horologist: a black top hat, brass goggles, a brown coat with a gold clock face, a pronged brass staff
C['clockmaker'] = dict(file='horologist', pal={'k': '#2E2836', 'y': '#F2C14E', 'c': '#8AE6FF', 'b': '#A0582A', 'B': '#5A3420', 'g': '#F2C14E', 'h': '#5A3A22', 'n': '#B0B0C0', 'N': '#FFE08A', 'l': '#5A3420'}, flat='se',
    F=['..kkkkNN', '..kkkk.n', '.kkkkkkn', '..ycyc.n', '.sbggbsn', '..bBBb..', '..bbbb..'],
    S=['..kkk.NN', '..kkk..n', '.kkkkk.n', '..hsyc.n', '..bbbsn.', '..bBBb..', '..bbbb..'],
    B=['..kkkkNN', '..kkkk.n', '.kkkkkkn', '..hhhh.n', '.sbggbsn', '..bggb..', '..bbbb..'],
    FA=['..kkkkNN', '..kkkk.N', '.kkkkkkn', '..ycycsn', '.sbggb..', '..bBBb..', '..bbbb..'],
    SA=['..kkk...', '..kkk...', '.kkkkk..', '..hsyc.N', '..bbbsnN', '..bBBb..', '..bbbb..'],
    BA=['..kkkkNN', '..kkkk.N', '.kkkkkkn', '..hhhhsn', '.sbggb..', '..bggb..', '..bbbb..'])
# the Rune-Knight: a silver helm with a red crest and glowing eyes, a red cloak behind, a rune-lit sword
C['runeblade'] = dict(file='runeblade', pal={'i': '#A4AEC6', 'I': '#5E6680', 'c': '#46F5D6', 'r': '#C83A3A', 'w': '#C8F8FF', 'W': '#46F5D6', 'd': '#C98A22', 'l': '#5E6680'},
    F=['...rr..W', '..iiii.w', '.icIIciw', '.iiiiiiw', 'riIccIrd', 'r.iIIi..', '..IiiI..'],
    S=['..rr....', '..iiii..', '..iIIc.W', '.riiii.w', 'rr.iIidw', 'r.iIIi..', '..IiiI..'],
    B=['...rr..W', '..iiii.w', '.iiiiiiw', '.rrrrrrw', '.rrrrrrd', '..rrrr..', '..IrrI..'],
    FA=['...rr.Ww', '..iiii.w', '.icIIcid', '.iiiiii.', 'riIccIr.', 'r.iIIi..', '..IiiI..'],
    SA=['..rr....', '..iiii..', '..iIIc..', '.riiii..', 'rr.iIdwW', 'r.iIIi..', '..IiiI..'],
    BA=['...rr.Ww', '..iiii.w', '.iiiiiid', '.rrrrrr.', '.rrrrrr.', '..rrrr..', '..IrrI..'])
# the Orb-Witch: a tall purple hood over darkness and two yellow eyes, a gold sigil, a staff with a cyan orb
C['hexweaver'] = dict(file='hexweaver', pal={'p': '#9058E0', 'P': '#5A2E9A', 'k': '#140C20', 'y': '#FFD650', 'o': '#8AF6FF', 'n': '#7A5A3A', 'l': '#5A2E9A'},
    F=['...pp..o', '..pppp.n', '.pkkkkpn', '.pykkypn', '.ppyyppn', '.pPyyPp.', '.pppppp.'],
    S=['...pp..o', '..pppp.n', '..ppkk.n', '..ppky.n', '..pppppn', '.pPppP..', '.pppppp.'],
    B=['...pp..o', '..pppp.n', '.ppppppn', '.ppppppn', '.ppyyppn', '.pPyyPp.', '.pppppp.'],
    FA=['...pp.oo', '..pppp.n', '.pkkkkpn', '.pykkyp.', '.ppyypp.', '.pPyyPp.', '.pppppp.'],
    SA=['...pp...', '..pppp..', '..ppkk..', '..ppky.o', '..pppnoo', '.pPppP..', '.pppppp.'],
    BA=['...pp.oo', '..pppp.n', '.ppppppn', '.pppppp.', '.ppyypp.', '.pPyyPp.', '.pppppp.'])
# the Ranger (2026-10-30): a green hood, a leather jerkin, a quiver of red-fletched arrows on the back, a longbow
C['ranger'] = dict(file='thornhood', pal={'g': '#6CC048', 'G': '#2E7A34', 'L': '#8A5A30', 'b': '#5A3A1E', 'w': '#C89048', 'q': '#F0EAD8', 'r': '#E0303A', 'A': '#E4ECF8', 'l': '#5A3A22'}, flat='se',
    F=['...gg...', '..gggg.w', '.gseseGw', '.GgssgGw', '.sLbLLsw', '..LLbL.w', '..LGGL..'],
    S=['...gg...', '..gggg.w', '.rGgse.w', '.bGgss.w', '.bLLLssw', '..LLbL.w', '..LGGL..'],
    B=['..rgg...', '..bggg.w', '.GgbggGw', '.GggbgGw', '.sLLbLsw', '..LLLL.w', '..LGGL..'],
    FA=['...gg.Aw', '..gggg.w', '.gseseGw', '.Ggssgsw', '.sLbLL..', '..LLbL..', '..LGGL..'],
    SA=['...gg..w', '..gggg.q', '.rGgse.q', '.bGgsssA', '.bLLLs.q', '..LLbL.w', '..LGGL..'],
    BA=['..rgg.Aw', '..bggg.w', '.GgbggGw', '.GggbgGs', '.sLLbL..', '..LLLL..', '..LGGL..'])


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
    # shaded at 8x8 (light from the top-left, a step darker toward the bottom-right), one art pixel at a time, and only
    # then doubled: every 2x2 block is one colour, a true 8x8 sprite (2026-10-31). Legs and anything marked flat stay flat
    from retro import light, shade
    def shade_px(px, fw, fh):                          # at 8x8 only the rim: a full shade muddies a figure this small
        out = [r[:] for r in px]
        for y in range(len(px)):
            for x in range(len(px[0])):
                if not px[y][x][3]:
                    continue
                fx, fy = x - x % fw, y - y % fh
                empty = lambda dx, dy: not (fx <= x + dx < fx + fw and fy <= y + dy < fy + fh and px[y + dy][x + dx][3])
                if empty(0, -1) or empty(-1, 0): out[y][x] = light(px[y][x])
                elif empty(0, 1) or empty(1, 0): out[y][x] = shade(px[y][x], 0.6)
        return out
    W8, H8 = COLS * 8, len(rows) * 8
    art = [[(0, 0, 0, 0)] * W8 for _ in range(H8)]
    for r, row in enumerate(rows):
        for c, g in enumerate(row):
            for y in range(8):
                for x in range(8):
                    if g[y][x] != '.':
                        art[r * 8 + y][c * 8 + x] = pal[g[y][x]]
    shaded = shade_px(art, 8, 8)
    flat = {pal[c] for c in D.get('flat', '')}
    for y in range(H8):
        for x in range(W8):
            if art[y][x][3] and (y % 8 == 7 or art[y][x] in flat):
                shaded[y][x] = art[y][x]
    W, H = COLS * 16, len(rows) * 16
    out = [[shaded[y // 2][x // 2] for x in range(W)] for y in range(H)]
    d = os.path.join(ROOT, cls)
    os.makedirs(d, exist_ok=True)
    write_png(os.path.join(d, D['file'] + '_sheet.png'), out)
    guide = {'image': D['file'] + '_sheet.png', 'frameWidth': 16, 'frameHeight': 16, 'columns': COLS, 'rows': len(rows),
             'art': 8, 'pivot': {'x': 8, 'y': 15},
             'animations': {k: {'row': a, 'col': b, 'frames': n, 'fps': fps, 'loop': k.endswith(('idle', 'walk'))} for k, (a, b, n, fps) in anims.items()}}
    json.dump(guide, open(os.path.join(d, D['file'] + '_sheet.json'), 'w', newline='\n'), indent=2)


if __name__ == '__main__':
    for cls, D in C.items():
        build(cls, D)          # all eleven, the Runeblade and the Hexweaver included (no longer from the sprite pack)
    print('built', list(C))                              # (no longer overwritten by the Realm Remaster's 16px classes: 2026-10-31)
