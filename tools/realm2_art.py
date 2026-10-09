"""The three new lands: the Saltglass Dunes (east coast), the Thornwood (west, past the fen), the Crystal Steppe
(north, before Godfall). Their monsters, leaders and standing props.

E8      small monsters, 8x8 RotMG-style (bestiary8 format: pal, A, optional A2 / B), faces LEFT
C12     leaders, 12x12 (stored doubled into the 24px champion sheet): pal, A, A2, B
PROPS   16x16 objects: glass_spire, thorn_tree, crystal_spire (2 frames: they glint / sway)
"""
from drawkit import Cv

E8 = {
    # ================================================================ THE SALTGLASS DUNES
    'glass_scarab': dict(pal={'g': '#3AB8A8', 'G': '#9AF0E0', 'w': '#FFFFFF', 'h': '#C88A3A', 'a': '#7A4A1A'},
        A=['........', '........', '...gGGg.', '..gGwGGg', '.hgGGGGg', 'hhgggggg', '.a.a.a..', 'a.a.a...'],
        A2=['........', '........', '...gGGg.', '..gGwGGg', '.hgGGGGg', 'hhgggggg', 'a.a.a...', '.a.a.a..'],
        B=['........', '...gGGg.', '..gGwGGg', '.gGGGGGg', 'hhgGGGgg', 'hhgggggg', '.a.a.a..', 'a.a.a...']),
    'dune_lurker': dict(pal={'w': '#D8B07A', 'W': '#A87A4A', 'k': '#140E18', 'r': '#C8344A', 's': '#E8CF96'},
        A=['........', '...ww...', '..wkww..', '..wwwW..', '..rwwW..', '...wwW..', '.sswwWss', 'ssssssss'],
        A2=['........', '........', '...ww...', '..wkww..', '..rwwW..', '..wwwW..', '.sswwWss', 'ssssssss'],
        B=['..w..w..', '.wrrrrw.', '.wrkkrw.', '..wrrw..', '..wwwW..', '...wwW..', '.sswwWss', 'ssssssss']),
    'salt_mummy': dict(pal={'b': '#E8E0CC', 'B': '#A89A80', 'c': '#3BEFFF'},
        A=['..bbbb..', '.bBbbBb.', '.bcbbcb.', '..bBBb..', '.bbbbbb.', 'b.bBbb.b', '..bbbb..', '..b..b..'],
        B=['b.bbbb.b', 'bbBbbBbb', '.bcbbcb.', '..bBBb..', '..bbbb..', '..bBbb..', '..bbbb..', '..b..b..']),
    'sand_skimmer': dict(pal={'w': '#F2D8A0', 'o': '#E0702A', 'O': '#A84A1A', 'k': '#140E18'},
        A=['........', 'w......w', 'ww.oo.ww', '.wokkow.', '..oOOo..', '...oo...', '...o....', '........'],
        A2=['........', '........', '..oooo..', '.wokkow.', 'wwoOOoww', 'w..oo..w', '...o....', '........'],
        B=['w......w', 'ww.oo.ww', '.wokkow.', '..oOOo..', '..oooo..', '...oo...', '...o....', '........']),
    # ================================================================ THE THORNWOOD
    'thorn_sprite': dict(pal={'l': '#6AB04A', 'L': '#3A7A2A', 'g': '#C8E890', 'k': '#140E18', 't': '#C83A4A'},
        A=['l......l', 'lL.gg.Ll', '.lgkkgl.', '..gggg..', '.L.gg.L.', '...gg...', '...t....', '........'],
        A2=['........', '.l.gg.l.', 'lLgkkgLl', 'l.gggg.l', '...gg...', '...gg...', '...t....', '........'],
        B=['l..t...l', 'lL.gg.Ll', '.lgkkgl.', 't.gggg.t', '.L.gg.L.', '...gg...', '...t....', '........']),
    'bramble_wolf': dict(pal={'w': '#3A5A2A', 'W': '#24401A', 'r': '#FF4A3A', 't': '#C8B060'},
        A=['........', 't.t.....', 'wwwt.t..', 'wrwwwwwt', '.wwwwwwt', '..wWwww.', '..w..w..', '.ww..ww.'],
        A2=['........', 't.t.....', 'wwwt.t..', 'wrwwwwwt', '.wwwwwwt', '..wWwww.', '...ww...', '..ww.ww.'],
        B=['t.t.....', 'wwwt.t..', 'wrwwwwwt', 'rrwwwwwt', '.wwwwww.', '..wWwww.', '.w....w.', 'ww....ww']),
    'spore_puff': dict(pal={'r': '#C83A4A', 'R': '#8A1A2A', 'w': '#FFE8E8', 'c': '#E8D8B0', 'k': '#140E18'},
        A=['..rrrr..', '.rwrrwr.', 'rrrrwrrr', '.RRRRRR.', '..cccc..', '..ckkc..', '..cccc..', '...cc...'],
        A2=['........', '..rrrr..', '.rwrrwr.', 'rrrrwrrr', '.RRRRRR.', '..ckkc..', '..cccc..', '...cc...'],
        B=['.w.rr.w.', 'rrwrrwrr', 'rrrrwrrr', 'RRRRRRRR', '..cccc..', '..ckkc..', '..cccc..', '...cc...']),
    'briar_bee': dict(pal={'w': '#CFF0FF', 'y': '#E8B030', 'k': '#140E18', 'b': '#3A2A1A', 's': '#C83A4A'},
        A=['........', '..w..w..', '.wwyyww.', '..ykky..', '..bybyb.', '..ybyb..', '...s....', '........'],
        A2=['........', '........', '.w.yy.w.', 'wwykkyww', '..bybyb.', '..ybyb..', '...s....', '........'],
        B=['..w..w..', '.wwyyww.', '..ykky..', '..bybyb.', '..ybyb..', '...ss...', '...s....', '........']),
    # ================================================================ THE CRYSTAL STEPPE
    'crystal_golem': dict(pal={'r': '#7A7090', 'R': '#4E4A62', 'c': '#E880E8', 'C': '#FFD0FF', 'k': '#3BEFFF'},
        A=['...cc...', '..cCc...', '.rrrrr..', 'rrkrkrr.', 'rrrrrrrc', 'cRrrrRcC', '.rr.rr..', '.rr.rr..'],
        B=['.c.cc.c.', '..cCc...', '.rrrrr..', 'rrkrkrrc', 'rrrrrrrC', 'cRrrrRrc', '.rr.rr..', 'rr...rr.']),
    'prism_hawk': dict(pal={'p': '#E880E8', 'c': '#5AE0F0', 'w': '#F0F0FF', 'k': '#140E18', 'y': '#F2C14E'},
        A=['........', 'p......c', 'pp.ww.cc', '.ppwkwc.', '..wwww..', '...yy...', '...y....', '........'],
        A2=['........', '........', '...ww...', 'pppwkwcc', 'p.wwww.c', '...yy...', '...y....', '........'],
        B=['pp....cc', '.pp..cc.', '..pwwc..', '...wkw..', '..wwww..', '..yyyy..', '........', '........']),
    'shard_crawler': dict(pal={'c': '#5AE0F0', 'C': '#CFFFFF', 'k': '#E840A0', 'l': '#4A6A8A'},
        A=['........', '........', '...cc...', '..cCCc..', 'l.cCkc.l', '.lccccl.', 'l.l..l.l', '........'],
        A2=['........', '........', '...cc...', '..cCCc..', '.lcCkcl.', 'l.cccc.l', '.l.ll.l.', '........'],
        B=['........', '..C..C..', '...cc...', '..cCCc..', 'l.cCkc.l', '.lccccl.', 'l.l..l.l', '........']),
    'quartz_jackal': dict(pal={'j': '#D8A858', 'J': '#9A7038', 'k': '#140E18', 'c': '#E880E8', 'C': '#FFD0FF'},
        A=['........', '.j.j....', 'jjjj.c.c', 'jkjjjcCc', '.jjjjjjj', '..jJjjJ.', '..j..j..', '.jj..jj.'],
        A2=['........', '.j.j....', 'jjjj.c.c', 'jkjjjcCc', '.jjjjjjj', '..jJjjJ.', '...jj...', '..jj.jj.'],
        B=['.j.j....', 'jjjj.c.c', 'jkjjjcCc', 'kkjjjjjj', '.jjjjjjj', '..jJjjJ.', '.j....j.', 'jj....jj']),
}

# ---------------------------------------------------------------- leaders: 12x12 art
C12 = {
    'glass_sphinx': dict(biome='dunes', pal={'y': '#C8962A', 'Y': '#FFD650', 'f': '#E8C080', 'k': '#3BEFFF', 's': '#D2A868', 'S': '#A87A4A', 'g': '#5AD8E0', 'G': '#CFFFFF'},
        A=['....yyy.....', '...yyYyy..G.', '...yfffy.gG.', '...fkfkf.gGg', '....fff.gGg.', '....yfy.gg..',
           '..ssssssssg.', '.sssSsssssss', '.ssssssSssss', '..sSssssSss.', '..s.s..s.s..', '.ss.ss.ss.ss'],
        A2=['....yyy.....', '...yyYyy....', '...yfffy..G.', '...fkfkf.gGg', '....fff.gGg.', '....yfy.gGg.',
            '..ssssssssg.', '.sssSsssssss', '.ssssssSssss', '..sSssssSss.', '...s.s..s.s.', '..ss.ss.ss.s'],
        B=['....yyy..G..', '...yyYyy.gGG', '...yfffygGg.', '...fkfkfgGg.', '....fff.gg..', '....yfy.....',
           '..ssssssss..', '.sssSsssssss', '.ssssssSssss', '..sSssssSss.', '..s.s..s.s..', '.ss.ss.ss.ss']),
    'mirage_caller': dict(biome='dunes', pal={'p': '#6A3A8A', 'P': '#9A6AC8', 'f': '#E8C8A0', 'k': '#140E18', 'o': '#8AF0FF', 'O': '#FFFFFF'},
        A=['....pppp....', '...pPPPPp...', '...pffffp...', '...pfkfkp...', '...ppffpp...', '..pPPppPPp..',
           '.opPpppppPp.', 'oOopppppppp.', '.o.pPppppPp.', '...ppppppp..', '...pp...pp..', '..ppp...ppp.'],
        A2=['............', '....pppp....', '...pPPPPp...', '...pffffp...', '...pfkfkp...', '..pppffppp..',
            '.opPPppPPPp.', 'oOopppppppp.', '.o.pPppppPp.', '...ppppppp..', '...pp...pp..', '..ppp...ppp.'],
        B=['.o..pppp....', 'oOo.pPPPp...', '.o.pffffp...', '.p.pfkfkp...', '.p.ppffpp...', '.ppPPppPPp..',
           '..pPpppppPp.', '...pppppppp.', '...pPppppPp.', '...ppppppp..', '...pp...pp..', '..ppp...ppp.']),
    'thornwood_stag': dict(biome='thornwood', pal={'t': '#6AB04A', 'r': '#C83A4A', 'b': '#7A5A3A', 'B': '#5A3E24', 'k': '#140E18', 'w': '#E8D8B0'},
        A=['t.r.t.......', '.ttt........', '..tbbb......', '..bkbbb.....', '.bbbbbb.....', 'wbbbbbbbbbb.',
           '...bbbbbbbbb', '...bBbbbbbBb', '...bbbbbbbbb', '...b.b...b.b', '...b.b...b.b', '..bb.b..bb.b'],
        A2=['t.r.t.......', '.ttt........', '..tbbb......', '..bkbbb.....', '.bbbbbb.....', 'wbbbbbbbbbb.',
            '...bbbbbbbbb', '...bBbbbbbBb', '...bbbbbbbbb', '....bb...bb.', '....bb...bb.', '...bb...bb..'],
        B=['............', 't.r.t.......', '.tttbbb.....', '..bkbbb.....', 'wbbbbbbbbbb.', '..bbbbbbbbbb',
           '...bBbbbbbBb', '...bbbbbbbbb', '..b.b.....bb', '.b..b......b', '.b...b......', 'bb...bb.....']),
    'witch_of_briars': dict(biome='thornwood', pal={'g': '#2A4A2A', 'G': '#4A7A3A', 'f': '#C8E0A8', 'k': '#FFE45C', 't': '#C83A4A', 's': '#7A5A3A'},
        A=['...t.t.t....', '...ggggg..s.', '..gGGGGGg.s.', '..gffffg.sss', '..gfkfkg..s.', '...gfffg..s.',
           '..gGgggGg.s.', '.gGgggggGgs.', '.ggGggggGgs.', '..gggggggg..', '..ggg..ggg..', '.ggg....ggg.'],
        A2=['............', '...t.t.t..s.', '...ggggg..s.', '..gGGGGGgsss', '..gffffg..s.', '..gfkfkg..s.',
            '..ggfffgg.s.', '.gGgggggGgs.', '.ggGggggGgs.', '..gggggggg..', '..ggg..ggg..', '.ggg....ggg.'],
        B=['...t.t.t.t.t', '...ggggg.sss', '..gGGGGGgsts', '..gffffg.sss', '..gfkfkg.s..', '...gfffgs...',
           '..gGgggGs...', '.gGgggggGg..', '.ggGggggGg..', '..gggggggg..', '..ggg..ggg..', '.ggg....ggg.']),
    'geode_titan': dict(biome='steppe', pal={'r': '#5E5A72', 'R': '#8E8AA6', 'c': '#E880E8', 'C': '#FFD0FF', 'k': '#FFFFFF'},
        A=['...rrrrrr...', '..rRRrrrrr..', '.rRrrccrrrr.', '.rrcCCCCcrr.', 'rrcCkCCkCcrr', 'rrcCCCCCCcrr',
           'rrrcCCCCcrrr', '.rrrccccrrr.', '.rRrrrrrrRr.', '..rrrrrrrr..', '..rr....rr..', '.rrr....rrr.'],
        A2=['............', '...rrrrrr...', '..rRRrrrrr..', '.rRrrccrrrr.', '.rrcCCCCcrr.', 'rrcCkCCkCcrr',
            'rrcCCCCCCcrr', 'rrrcCCCCcrrr', '.rRrccccrRr.', '..rrrrrrrr..', '..rr....rr..', '.rrr....rrr.'],
        B=['..crrrrrrc..', '.crRRrrrrrc.', '.rRrcccrrrr.', 'rrcCCCCCCcrr', 'rcCkkCCkkCcr', 'rcCCCCCCCCcr',
           'rrcCCCCCCcrr', '.rrcccccc rr'.replace(' ', 'r'), '.rRrrrrrrRr.', '..rrrrrrrr..', '.rr......rr.', 'rrr......rrr']),
    'skyglass_seer': dict(biome='steppe', pal={'w': '#E0E8FF', 'W': '#A8B8E0', 'k': '#5AE0F0', 'c': '#E880E8', 'C': '#FFD0FF'},
        A=['..c..cc..c..', '...c.CC.c...', '....wwww....', '...wWWWWw...', '...wkWWkw...', '...wWWWWw...',
           '..cwwwwwwc..', '.c.wWWWWw.c.', '...wWWWWw...', '....wWWw....', '.....ww.....', '............'],
        A2=['............', '..c..cc..c..', '...c.CC.c...', '....wwww....', '...wWWWWw...', '...wkWWkw...',
            '...wWWWWw...', '.c.wwwwww.c.', '..cwWWWWwc..', '...wWWWWw...', '....wWWw....', '.....ww.....'],
        B=['c..c.cc.c..c', '.c..cCCc..c.', '..c.wwww.c..', '...wWWWWw...', '...wkWWkw...', '...wWWWWw...',
           'cc.wwwwww.cc', '...wWWWWw...', '...wWWWWw...', '....wWWw....', '.....ww.....', '............']),
}


def _dbl(rows):
    out = []
    for r in rows:
        line = ''.join(ch * 2 for ch in r)
        out += [line, line]
    return out


def _deaths12(A):
    """collapse, crumble, a little pile: the same idea as the 8x8 deaths, at 12x12"""
    blank = '.' * 12
    d0 = [blank] + A[:-1]
    d1 = [blank] * 6 + [r for k, r in enumerate(A) if k % 2][:6]
    pile = [blank] * 9 + [''.join(c if (x + k) % 3 == 0 else '.' for x, c in enumerate(r)) for k, r in enumerate(A[-3:])]
    return [d0, d1, pile]


def champion_frames(c):
    A, A2, B = c['A'], c.get('A2') or c['A'], c.get('B') or c['A']
    for g in (A, A2, B):
        assert len(g) == 12 and all(len(r) == 12 for r in g), (g, [len(r) for r in g])
    return [_dbl(f) for f in (A, A2, A, B, *_deaths12(A))]   # M0 M1 | T | A | D0 D1 D2


# ---------------------------------------------------------------- standing props
PAL = {'o': '#160F14', 'g': '#5AD8E0', 'G': '#CFFFFF', 'W': '#FFFFFF', 's': '#D2A868', 'S': '#A87A4A',
       't': '#2A4A2A', 'T': '#4A7A3A', 'b': '#5A3E24', 'B': '#7A5A3A', 'r': '#C83A4A',
       'c': '#E880E8', 'C': '#FFD0FF', 'v': '#8A4AA8', 'k': '#5E5A72'}


def glass_spire(f):
    c = Cv()
    c.ell(7.5, 14.5, 5, 1.5, 'S')
    c.trap(2, 14, 7, 8, 4, 11, 'g'); c.trap(6, 14, 8, 9, 7, 11, 'G')           # a spire of fused sand-glass
    c.trap(9, 14, 2, 3, 1, 5, 'g'); c.trap(10, 14, 12, 13, 11, 14, 'g')
    return c.done(late=[(8, 3 + f * 4, 'W'), (12, 10, 'W')] if f else [(7, 4, 'W')])


def thorn_tree(f):
    c = Cv()
    c.rect(6, 9, 9, 15, 'b'); c.rect(6, 9, 6, 15, 'B')
    c.ell(7.5 + f * 0.5, 5.5, 6, 5, 't'); c.ell(6 + f * 0.5, 4, 3.4, 2.6, 'T', only='t')
    for x, y in ((2, 3), (12, 4), (4, 9), (11, 8), (7, 0)):
        c.p(x + f, y, 'b')                                                       # thorns poking out
    for x, y in ((5, 6), (10, 3), (8, 8)):
        c.p(x + f, y, 'r')                                                       # red berries
    return c.done()


def crystal_spire(f):
    c = Cv()
    c.ell(7.5, 14.5, 5, 1.5, 'k')
    c.trap(1, 14, 7, 8, 4, 10, 'c'); c.trap(4, 14, 8, 8, 7, 10, 'C')
    c.trap(7, 14, 3, 3, 1, 5, 'v'); c.trap(8, 14, 12, 12, 10, 14, 'c')
    return c.done(late=[(7, 2, 'W'), (3, 8, 'W')] if f else [(11, 9, 'W')])


PROPS = {
    'glass_spire': [(glass_spire(0), PAL), (glass_spire(1), PAL)],
    'thorn_tree': [(thorn_tree(0), PAL), (thorn_tree(1), PAL)],
    'crystal_spire': [(crystal_spire(0), PAL), (crystal_spire(1), PAL)],
}
