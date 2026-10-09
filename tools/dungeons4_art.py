"""Art for the four newer dungeons: the Honeyed Hollow, the Gilded Marionette Theatre, the Prism Lighthouse and the
Sleeper's Dream. Everything is drawn at 8x8 (16x16 for the bosses), RotMG-style: a few tones, a clear silhouette.

TILES     name -> (palette, [[frames] per variant])   8x8, stored doubled (terrain.PACK_TILES)
E8        monster -> dict(pal, A, A2, B)               8x8 (tools/build_enemies.py)
BOSSES    boss -> (palette, [idle1, idle1, idle2, idle2, tell, attack, special])   16x16, tripled (tools/pack_build.py)
PROPS     object -> [(16x16 grid, palette), ...]      8x8 doubled (tools/world_art.py, written pixel-exact)
PORTALS   portal kind -> fn(frame) using tools/portals.py
ICONS     item id -> (8x8 grid, palette)              relic icons and keys
SHOTS     shot -> (hand-drawn archetype frames, ramp) tools/shots_rotmg.py
"""


def _pad(rows, n=16):
    out = [r.ljust(n, '.')[:n] for r in rows]
    while len(out) < n:
        out.append('.' * n)
    return out


def _dbl(g):
    return [''.join(c * 2 for c in r) for r in g for _ in (0, 1)]


def _roll(g, dx):
    return [r[-dx:] + r[:-dx] if dx else r for r in g]


# ================================================================ TILES (8x8)
TILES = {
    'combfloor': ({'a': '#6A4214', 'b': '#C8862E', 'c': '#E8A848', 'd': '#A86E26', 'e': '#FFE070'},
                  [[['bdddccbb', 'ddaaaabb', 'aaccbbaa', 'cccbbbdd', 'ccbbbddd', 'aabbddaa', 'bbaaaacc', 'bbddcccb']],
                   [['bdddccbb', 'ddaaaabb', 'aaceebaa', 'ccebbbdd', 'ccbbbddd', 'aabbddaa', 'bbaaaacc', 'bbddcccb']],
                   [['bdddccbb', 'ddaaaabb', 'aaccbbaa', 'cccbbbdd', 'ccbbbddd', 'aabbddaa', 'bbaaaacc', 'bbddcccb']]]),
    'waxwall': ({'a': '#9A7030', 'b': '#E8C878', 'c': '#F8E4A8', 'd': '#C8A050'},
                [[['cccccccc', 'cbbcbbbc', 'bbbbbbbb', 'bbdbbbdb', 'bbdbbbdb', 'bbbbbbdb', 'dbbdbbbb', 'aaaaaaaa']]]),
    'stageboards': ({'a': '#4A2E16', 'b': '#7A4E28', 'c': '#9A6638', 'd': '#B88048'},
                    [[['bbbbabbb', 'cccbaccc', 'bbbbabbb', 'aaaaaaaa', 'bbabbbbb', 'ccacccdc', 'bbabbbbb', 'aaaaaaaa']],
                     [['bbbbabbb', 'cdcbaccc', 'bbbbabbb', 'aaaaaaaa', 'bbabbbbb', 'ccacccc c'.replace(' ', ''), 'bbabbbbb', 'aaaaaaaa']]]),
    'velvetwall': ({'a': '#3A0812', 'b': '#6A1224', 'c': '#982034', 'd': '#C03448'},
                   [[['bcdcbabc', 'bcdcbabc', 'bcdcbabc', 'bcdcbabc', 'bcdcbabc', 'bcdcbabc', 'bccbbabc', 'abbaaaab']]]),
    'prismfloor': ({'a': '#1E1E3A', 'b': '#2E2E56', 'c': '#3E3E72', 'd': '#6A6AC8', 'e': '#C8F0FF'},
                   [[['abbbbbba', 'bbbcdbbb', 'bbcddcbb', 'bcddddcb', 'bbcddcbb', 'bbbcdbbb', 'bbbbbbbb', 'abbbbbba']],
                    [['abbbbbba', 'bbbcdbbb', 'bbcdecbb', 'bcdeedcb', 'bbcddcbb', 'bbbcdbbb', 'bbbbbbbb', 'abbbbbba']]]),
    'crystalwall': ({'a': '#2E2058', 'b': '#5A3E9A', 'c': '#8A6AD0', 'd': '#B8A0F8', 'e': '#FFFFFF'},
                    [[['abccdcba', 'bccddcba', 'bcdeddcb', 'cddddcbb', 'bcdddcba', 'abcddcba', 'aabccbaa', 'aaabbaaa']]]),
    'dreamfloor': ({'a': '#5A4A8A', 'b': '#7A6AB0', 'c': '#9888CC', 'd': '#E8E0FF'},
                   [[['cccbcccc', 'ccbcccdc', 'cccccccc', 'cbccccbc', 'ccccdccc', 'cccccccc', 'bcccccbc', 'cccbcccc']],
                    [['cccccccc', 'cbccccdc', 'cccccbcc', 'cccccccc', 'ccdccccc', 'ccccbccc', 'cbcccccc', 'cccccccb']]]),
    'dreamwall': ({'a': '#6A5AA0', 'b': '#A898D8', 'c': '#D8D0F4', 'd': '#FFFFFF'},
                  [[['cddcccdd', 'cdddcddd', 'bccdcccc', 'bbccbccb', 'abbbbbba', 'aabbbbaa', 'aaabbaaa', 'aaaaaaaa']]]),
    'dreambridge': ({'a': '#B87AC8', 'b': '#D8A8E8', 'c': '#F4D4FC', 'd': '#FFFFFF'},
                    [[['bbbbbbbb', 'bccbbccb', 'bbbbbbbb', 'cbbdbbcb', 'bbbbbbbb', 'bccbbccb', 'bbbbbbbb', 'bbdbbbbb']]]),
}
_HONEY = ['bbbbbbbb', 'bbcbbbbb', 'bcdcbbbb', 'bbcbbbab', 'bbbbbbbb', 'bbbbbcbb', 'babbcdcb', 'bbbbbcbb']
TILES['honey'] = ({'a': '#B0680A', 'b': '#E0901A', 'c': '#FFC040', 'd': '#FFEFA8'}, [[_HONEY, _roll(_HONEY, 3), _roll(_HONEY, 5)]])
_STARS = ['aaaaaaaa', 'aabaaaaa', 'aaaaadaa', 'aaaaaaaa', 'abaaaaaa', 'aaaaaaca', 'aadaaaaa', 'aaaaabaa']
TILES['starvoid'] = ({'a': '#0A0618', 'b': '#1A1236', 'c': '#7A7AD8', 'd': '#FFFFFF'},
                     [[_STARS, [r.replace('d', 'x').replace('c', 'd').replace('x', 'c') for r in _STARS]],
                      [_roll(_STARS, 4), _roll(_STARS, 4)]])
_FADE = ['bbbbbbbb', 'bccbbccb', 'bbbbbbbb', 'cbbdbbcb', 'bbbbbbbb', 'bccbbccb', 'bbbbbbbb', 'bbdbbbbb']
TILES['fadebridge'] = ({'a': '#6A98D8', 'b': '#98C0F0', 'c': '#C8E4FF', 'd': '#FFFFFF'}, [[_FADE, _roll(_FADE, 2), _roll(_FADE, 4)]])
TILES['fadegone'] = ({'a': '#0A0618', 'b': '#3A2A6A'},
                     [[['aaaaaaaa', 'abaaabaa', 'aaaaaaaa', 'aaabaaab', 'aaaaaaaa', 'abaaabaa', 'aaaaaaaa', 'aaabaaab']]])

# ================================================================ MONSTERS (8x8: A, A2 walk, B attack)
E8 = {
    # ---- the Honeyed Hollow
    'worker_bee': dict(pal={'y': '#FFD650', 'k': '#24160A', 'w': '#F0F8FF', 'W': '#A8C8E8'},
                       A=['...ww...', '..wWWw..', '...ww...', '.ykykyk.', 'kykykykw', '.ykykyk.', '........', '........'],
                       A2=['........', '.w....w.', 'wWw..wWw', '.ykykyk.', 'kykykykw', '.ykykyk.', '........', '........'],
                       B=['...ww...', '..wWWw..', '...ww...', '.ykykyk.', 'kykykykw', 'kykykyk.', '........', '........']),
    'wax_drone': dict(pal={'c': '#F8E8B8', 'C': '#D8C08A', 'd': '#A88A50', 'f': '#FFD650', 'F': '#FF8A1F', 'k': '#2A1A0A'},
                      A=['...f....', '...F....', '..cccc..', '.cCCCCc.', '.ckCCkc.', '.cCCCCc.', '.dcccdd.', '..d..d..'],
                      A2=['....f...', '...F....', '..cccc..', '.cCCCCc.', '.ckCCkc.', '.cCCCCc.', '.ddccdd.', '...d.d..'],
                      B=['..fff...', '..fFf...', '..cccc..', '.cCCCCc.', '.cfCCfc.', '.cCCCCc.', '.dcccdd.', '..d..d..']),
    'honey_grub': dict(pal={'w': '#FFF0D0', 'W': '#E8C890', 'd': '#B89050', 'k': '#2A1A0A', 'h': '#FFB830'},
                       A=['........', '........', '....wWw.', '..wWwWwk', '.wWwWwWw', 'dWdWdWd.', '.h...h..', '........'],
                       A2=['........', '........', '...wWw..', '.wWwWwWk', 'wWwWwWw.', '.dWdWdWd', '..h...h.', '........'],
                       B=['........', '........', '....wWw.', '..wWwWkk', '.wWwWwWh', 'dWdWdWd.', '.h...hh.', '........']),
    'comb_guard': dict(pal={'y': '#F2C14E', 'Y': '#C88A10', 'k': '#1A1006', 'r': '#E83A3A', 'w': '#E8F0FF', 'W': '#A8C0E0'},
                       A=['.ww..ww.', 'wWww.wWw', '..kYk...', 'kYkYkYkr', '.kYkYkk.', '..kkk...', '..k.k...', '........'],
                       A2=['........', '.wWw.wWw', 'wwkYkww.', 'kYkYkYkr', '.kYkYkk.', '..kkk...', '..k.k...', '........'],
                       B=['.ww..ww.', 'wWww.wWw', '..kYk...', 'kYkYkYkr', 'kkYkYkk.', 'k.kkk...', '..k.k...', '........']),
    'brood_cell': dict(pal={'c': '#E8C878', 'C': '#C8A050', 'd': '#8A6A30', 'w': '#FFF0D0', 'k': '#2A1A0A'},
                       A=['..cccc..', '.cCddCc.', 'cCdwwdCc', 'cdwkwwdc', 'cdwwwwdc', 'cCdwwdCc', '.cCddCc.', '..cccc..'],
                       A2=['..cccc..', '.cCddCc.', 'cCdwwdCc', 'cdwwkwdc', 'cdwwwwdc', 'cCdwwdCc', '.cCddCc.', '..cccc..'],
                       B=['..cccc..', '.cCddCc.', 'cCdkwdCc', 'cdwwwkdc', 'cdkwwwdc', 'cCdwwdCc', '.cCddCc.', '..cccc..']),
    # ---- the Gilded Marionette Theatre
    'marionette': dict(pal={'s': '#E8DCC0', 'w': '#D8A060', 'W': '#8A6A3A', 'r': '#C83A5A', 'k': '#2A1A10', 'g': '#FFD650'},
                       A=['s......s', 's..ww..s', 's.wkkw.s', 'w.rrrr.w', '.wrggrw.', '..rrrr..', '..W..W..', '.WW..WW.'],
                       A2=['s......s', 's..ww..s', 's.wkkw.s', 'w.rrrr.w', '.wrggrw.', '..rrrr..', '.W....W.', 'WW....WW'],
                       B=['w......w', 's..ww..s', 's.wkkw.s', 's.rrrr.s', '..rggr..', '..rrrr..', '..W..W..', '.WW..WW.']),
    'masked_chorister': dict(pal={'m': '#F8F0E0', 'k': '#1A1020', 'p': '#6A2A6A', 'P': '#9A4A9A', 'g': '#FFD650'},
                             A=['..mmmm..', '.mkmmkm.', '.mmmmmm.', '..mkkm..', '.pPPPPp.', 'pPPgPPPp', 'pPPPPPPp', '.pp..pp.'],
                             A2=['..mmmm..', '.mkmmkm.', '.mmmmmm.', '..mkkm..', '.pPPPPp.', 'pPPgPPPp', 'pPPPPPPp', 'pp....pp'],
                             B=['..mmmm..', '.mkmmkm.', '.mmmmmm.', '.mkkkkm.', 'gpPPPPpg', 'pPPgPPPp', 'pPPPPPPp', '.pp..pp.']),
    'stagehand': dict(pal={'k': '#1A1820', 'K': '#3A3648', 's': '#E8C8A0', 'b': '#9A7448', 'B': '#6A4A2A'},
                      A=['..KKKK..', '..ssss..', '..skks..', '.KKKKKbb', 'KKKKKbBb', '.KKKKbbb', '..KK.KK.', '..K...K.'],
                      A2=['..KKKK..', '..ssss..', '..skks..', '.KKKKKbb', 'KKKKKbBb', '.KKKKbbb', '..KK..K.', '.K....K.'],
                      B=['.bb.KKK.', 'bBb.sss.', 'bbb.kks.', '.KKKKKK.', 'KKKKKKK.', '.KKKKKK.', '..KK.KK.', '..K...K.']),
    'prima_donna': dict(pal={'g': '#FFD650', 'G': '#C8962A', 'r': '#C83A5A', 'R': '#8A1A3A', 's': '#F0D8C0', 'k': '#2A1A10'},
                        A=['..rRr...', '.rssss..', '.sksks..', '..sks...', '.gGgGg..', 'gGgggGg.', 'GgGgGgGg', 'gGgGgGgG'],
                        A2=['..rRr...', '.rssss..', '.sksks..', '..sss...', '.gGgGg..', 'gGgggGg.', 'GgGgGgGg', 'GgGgGgGg'],
                        B=['..rRr...', '.rssss..', '.sksks..', '.skkks..', 'sgGgGgs.', 'gGgggGg.', 'GgGgGgGg', 'gGgGgGgG']),
    'hanging_marionette': dict(pal={'s': '#E8DCC0', 'w': '#D8A060', 'p': '#6A2A8A', 'P': '#9A4AC8', 'g': '#FFD650', 'k': '#2A1A10'},
                               A=['...s....', '...s....', '..www...', '..wkw...', '.pPPPp..', 'w.PgP.w.', '..P.P...', '..w.w...'],
                               A2=['....s...', '....s...', '...www..', '...wkw..', '..pPPPp.', '.w.PgP.w', '...P.P..', '...w.w..'],
                               B=['...s....', '...s....', '..www...', '..wkw...', 'wpPPPpw.', '..PgP...', '..P.P...', '.w...w..']),
    'understudy': dict(pal={'m': '#F8F0E0', 'k': '#1A1020', 'b': '#2A3A8A', 'B': '#4A6AC8', 'r': '#C83A5A', 'g': '#FFD650'},
                       A=['..mmmm..', '.mkmmkm.', '.mmmmmm.', '..mkkm..', '.rbbBBr.', 'rrbgBBrr', '.bb..BB.', '.b....B.'],
                       A2=['..mmmm..', '.mkmmkm.', '.mmmmmm.', '..mkkm..', '.rbbBBr.', 'rrbgBBrr', '.bb..BB.', 'b......B'],
                       B=['..mmmm..', '.mkmmkm.', '.mmmmmm.', '.mkkkkm.', 'grbbBBrg', '.rbgBBr.', '.bb..BB.', '.b....B.']),
    'mirror_puppet': dict(pal={'w': '#D8A060', 'W': '#8A6A3A', 'c': '#C8E8FF', 'C': '#FFFFFF', 's': '#E8DCC0'},
                          A=['s......s', 's.cCcc.s', 's.cccC.s', 'w.WWWW.w', '.wWWWWw.', '..WWWW..', '..W..W..', '.WW..WW.'],
                          A2=['s......s', 's.cCcc.s', 's.cccC.s', 'w.WWWW.w', '.wWWWWw.', '..WWWW..', '.W....W.', 'WW....WW']),
    # ---- the Prism Lighthouse
    'refractor': dict(pal={'c': '#C8B8FF', 'C': '#8A7AE0', 'd': '#4A3A9A', 'w': '#FFFFFF', 'r': '#FF8AD0', 'b': '#8AF6FF'},
                      A=['...w....', '..wcc...', '.wcCCd..', 'wcwCwdd.', '.ccCdd..', '..rCb...', '...C....', '........'],
                      A2=['........', '...w....', '..wcc...', '.wcCCd..', 'wcwCwdd.', '.ccCdd..', '..rCb...', '...C....'],
                      B=['r..w..b.', '..wcc...', '.wcCCd..', 'wcwCwdd.', '.ccCdd..', '..rCb...', 'b..C..r.', '........']),
    'lumen_moth': dict(pal={'w': '#FFFBE0', 'W': '#E8D8A0', 'k': '#3A2A20', 'l': '#FFFFFF'},
                       A=['W......W', 'Ww.kk.wW', 'wwwllwww', '.wwllww.', '..wllw..', '.W.ll.W.', 'W......W', '........'],
                       A2=['........', '.W.kk.W.', 'Wwwllwww', 'wwwllwww', '.wwllww.', '..W..W..', '........', '........']),
    'glass_knight': dict(pal={'c': '#A8D8F0', 'C': '#E8F8FF', 'd': '#5A7A9A', 'D': '#2A3A5A', 'w': '#FFFFFF', 'y': '#FFD650'},
                         A=['..CCC...', '.CdwdC..', '.CcccC.w', 'dccCccdw', '.cCCCcyw', '.cccccd.', '.dc.cd..', '.D...D..'],
                         A2=['..CCC...', '.CdwdC..', '.CcccC.w', 'dccCccdw', '.cCCCcyw', '.cccccd.', '.dc..cd.', 'D.....D.'],
                         B=['..CCC.ww', '.CdwdCw.', '.CcccC..', 'dccCccdy', '.cCCCc..', '.cccccd.', '.dc.cd..', '.D...D..']),
    'prism_eye': dict(pal={'c': '#C8B8FF', 'C': '#FFFFFF', 'k': '#1A1030', 'r': '#FF3A8A', 'd': '#6A5AB0'},
                      A=['..dccd..', '.dcCCcd.', 'dcCrrCcd', 'dCrkkrCd', 'dCrkkrCd', 'dcCrrCcd', '.dcCCcd.', '..dccd..'],
                      A2=['..dccd..', '.dcCCcd.', 'dcCrrCcd', 'dCrkkrCd', 'dCrkkrCd', 'dcCrrCcd', '.dcCCcd.', '..dccd..'],
                      B=['..dccd..', '.dcCCcd.', 'dcCCCCcd', 'dCCrkCCd', 'dCCkrCCd', 'dcCCCCcd', '.dcCCcd.', '..dccd..']),
    'prism_image': dict(pal={'c': '#E8E0FF', 'C': '#FFFFFF', 'd': '#A898F0', 'w': '#FFFFFF', 'b': '#8AF6FF'},
                        A=['.....ww.', '....wCCw', '...dCbCd', '..dccCd.', '.dcd.d..', 'dcd.dcd.', 'dccccd..', '.dddd...'],
                        A2=['.....ww.', '....wCCw', '...dCbCd', '..dccCd.', '.dcd.dd.', 'dcd.dc..', 'dccccd..', '.dddd...']),
    # ---- the Sleeper's Dream
    'night_mare': dict(pal={'k': '#1A1028', 'K': '#3A2A58', 'f': '#FF3A8A', 'F': '#FFB0D8', 'e': '#FF3A5A'},
                       A=['....ff..', '...fKKk.', '..fKKeKk', 'KKKKKKK.', 'KkKKKK..', 'kK.K.Kk.', 'k..K..k.', '........'],
                       A2=['...ff...', '..fFKKk.', '..fKKeKk', 'KKKKKKK.', 'KkKKKK..', '.kK..Kk.', '.k....k.', '........'],
                       B=['..fff...', '.fFKKKk.', '..fKKeKk', 'KKKKKKKf', 'KkKKKKf.', 'kK.K.Kk.', 'k..K..k.', '........']),
    'sleepwalker': dict(pal={'w': '#E8E0F8', 'W': '#B8A8D8', 's': '#F0D8C0', 'k': '#3A2A58', 'b': '#6A8AE0', 'y': '#FFD650'},
                        A=['..bbb...', '.bsssby.', '.skksss.', '..ssssss', '.wwwwWW.', '.wWwwWw.', '.wwwwww.', '..w..w..'],
                        A2=['..bbb...', '.bsssby.', '.skksss.', '..ssssss', '.wwwwWW.', '.wWwwWw.', '.wwwwww.', '.w....w.'],
                        B=['..bbb.y.', '.bsssb..', '.sssssk.', '..ssssss', '.wwwwWW.', '.wWwwWw.', '.wwwwww.', '..w..w..']),
    'dream_eater': dict(pal={'p': '#8A78C0', 'P': '#C0B0E8', 'k': '#2A1A40', 's': '#FFB8E0'},
                        A=['........', '..PPP...', '.PPPPPP.', 'PPPPPkPP', 'pPPPPPPs', 'ppPPPPp.', '.p.p.p..', '........'],
                        A2=['........', '..PPP...', '.PPPPPP.', 'PPPPPkPP', 'pPPPPPPs', 'ppPPPPp.', 'p.p..p..', '........'],
                        B=['........', '..PPP...', '.PPPPPP.', 'PPPPPkPs', 'pPPPPPss', 'ppPPPPps', '.p.p.p..', '........']),
    'lullaby_moth': dict(pal={'l': '#C8B0FF', 'L': '#8A70D8', 'y': '#FFE89A', 'k': '#2A1A40', 'w': '#FFFFFF'},
                         A=['L......L', 'lL.kk.Ll', 'llyLLyll', '.lLwwLl.', '..lwwl..', '.L.ww.L.', 'L......L', '........'],
                         A2=['........', '.L.kk.L.', 'LlyLLylL', 'llLwwLll', '.lLwwLl.', '..L..L..', '........', '........']),
    'nightmare_knight': dict(pal={'k': '#1A1028', 'K': '#3A2A58', 'p': '#FF3A8A', 'P': '#FFB0D8', 's': '#C8C8E8', 'e': '#FF3A5A'},
                             A=['..P..P..', '..KKKK..', '.KeKKeK.', '.KKKKKs.', 'KkKpKkKs', '.KKKKKs.', '.Kk.kK..', '.k...k..'],
                             A2=['..P..P..', '..KKKK..', '.KeKKeK.', '.KKKKKs.', 'KkKpKkKs', '.KKKKKs.', '.Kk..kK.', 'k.....k.'],
                             B=['..P..Ps.', '..KKKKs.', '.KeKKeKs', '.KKKKK..', 'KkKpKkK.', '.KKKKK..', '.Kk.kK..', '.k...k..']),
    'sleepers_nightmare': dict(pal={'k': '#12081E', 'K': '#3A1A48', 'r': '#FF3A5A', 'p': '#FF7AB8', 'w': '#FFE0F0'},
                               A=['..KKKK..', '.KkkkkK.', 'KkrkkrkK', 'KkkkkkkK', 'KkwwwwkK', '.KkkkkK.', 'pK.KK.Kp', 'p..p..p.'],
                               A2=['..KKKK..', '.KkkkkK.', 'KkrkkrkK', 'KkkkkkkK', 'KkwkwkkK', '.KkkkkK.', '.pK..Kp.', '.p.pp.p.']),
}

# ================================================================ BOSSES (16x16)
def _swap(g, rows, a, b):
    return [r.replace(a, b) if i in rows else r for i, r in enumerate(g)]


_Q = _pad([
    '......gpg.......', '.....gPgPg......', '.....kYYYk......', '....kYeYeYk.....', 'ww..kYYYYYk..ww.',
    'wWw..kkkkk..wWww', 'wWWw.kyyyk.wWWw.', '.wWWwYkkkYwWWw..', '..wwkYyyyYkww...', '....kkkkkkk.....',
    '...kYyyyyyYk....', '...kkkkkkkkk....', '....kYyyyYk.....', '.....kkkkk......', '......kYk.......', '.......k........'])
_Q2 = _pad([
    '......gpg.......', '.....gPgPg......', '.....kYYYk......', '....kYeYeYk.....', '.w..kYYYYYk...w.',
    'wWw..kkkkk..wWw.', 'WWWw.kyyyk.wWWW.', 'wwWWwYkkkYwWWww.', '...wkYyyyYkw....', '....kkkkkkk.....',
    '...kYyyyyyYk....', '...kkkkkkkkk....', '....kYyyyYk.....', '.....kkkkk......', '......kYk.......', '.......k........'])
_P = _pad([
    '....kkkkk.......', '....kKKKk.......', '....kKKKk.......', '...kkrrrkk......', '.....sSSs.......',
    '.....swsw.......', '.....sSSs.......', 'bbbbs.kk.sbbbb..', 's.s..kKKk..s.s..', 's.s.kKgKKk.s.s..',
    's.s.kKKKKk.s.s..', 's.s.kKK.Kk.s.s..', '.....kK.Kk......', '.....kk.kk......', '....kkk.kkk.....', '................'])
_W = _pad([
    '..........ww....', '.........wCCw...', '........wCkCCd..', '........dCCCCdr.', '.........dCCd.r.',
    '....dddd..dc....', '...dcCCcd.dc....', '..dcCwwCcdcd....', '..dCw..wCcd.....', '..dcC..Ccd......',
    '...dcCCcd.......', '..dccddccd......', '.dcCCCCCCcd.....', 'dcCbwwwwyCcd....', '.dccccccccd.....', '..dddddddd......'])
_S = _pad([
    '..........yy....', '........PPPy....', '.....PPPPPP.....', '...PPqqqqqPP....', '..PqwwwwwwwqP...',
    '..qwwwwwwwwwq...', '..wwkkwwwkkww...', '..wwwwwswwwww...', '..wwswwwwwwsw...', '...wwwkkkwww....',
    '..pPPpPPpPPp....', '.pPqPpPqPpPqp...', 'pPPpPPpPPpPPPp..', 'pqPpPqPpPqPpqp..', '.pppppppppppp...', '................'])
BOSSES = {
    'honey_queen': ({'y': '#FFD650', 'Y': '#E8A020', 'k': '#1A1006', 'w': '#F0F8FF', 'W': '#B8D8F0', 'g': '#FFF6C8', 'p': '#8A2AC8', 'P': '#C88AFF', 'e': '#FF3A5A'},
                    [_Q, _Q, _Q2, _Q2, _swap(_Q, [3], 'e', 'g'), _swap(_Q2, [14, 15], 'k', 'e'), _swap(_Q, [3, 7, 8], 'Y', 'P')]),
    'the_puppeteer': ({'k': '#1A1020', 'K': '#3A2A48', 's': '#F0E0D0', 'S': '#C8B0A0', 'r': '#C83A5A', 'g': '#FFD650', 'w': '#FFFFFF', 'b': '#8A5A2E'},
                      [_P, _P, _swap(_P, [8, 9, 10, 11], 's', '.'), _swap(_P, [8, 9, 10, 11], 's', '.'), _swap(_P, [5], 'w', 'r'),
                       _swap(_P, [7], 'b', 'g'), _swap(_swap(_P, [5], 'w', 'r'), [3], 'r', 'g')]),
    'prism_wyrm': ({'c': '#C8B8FF', 'C': '#E8E0FF', 'd': '#7A6AD8', 'w': '#FFFFFF', 'r': '#FF6AB0', 'b': '#6AF0FF', 'y': '#FFE89A', 'k': '#1A1030'},
                   [_W, _W, _swap(_W, [13], 'w', 'C'), _swap(_W, [13], 'w', 'C'), _swap(_W, [2], 'k', 'r'), _swap(_W, [7, 8, 13], 'w', 'b'),
                    _swap(_swap(_W, [2], 'k', 'b'), [12, 13, 14], 'C', 'w')]),
    'the_sleeper': ({'p': '#5A4AA0', 'P': '#7A6AC8', 'q': '#A898E8', 'w': '#F0E8FF', 'y': '#FFE89A', 'k': '#2A1A48', 's': '#FFB8E0', 'r': '#FF3A5A'},
                    [_S, _S, _swap(_S, [9], 'k', 'w'), _swap(_S, [9], 'k', 'w'), _swap(_S, [6], 'k', 'q'), _swap(_S, [9], 'w', 'k'),
                     _swap(_swap(_S, [6], 'k', 'r'), [9], 'w', 'k')]),
}

# ================================================================ PROPS (8x8, stored doubled)
_P8 = {
    # ---- the hive
    'wax_pillar': (['.cccccc.', '.cbbbbc.', '.bbbdbb.', '.bbbbbd.', '.bdbbbb.', '.bbbbdb.', '.dbbbbd.', 'aaaaaaaa'],
                   {'c': '#F8E0A0', 'b': '#E8C878', 'd': '#C8A050', 'a': '#9A7030'}),
    'brood_comb': (['........', '.cc..cc.', 'cCdccCdc', 'chhcchhc', '.cc..cc.', '...cc...', '..cCdc..', '..chhc..'],
                   {'c': '#E8C878', 'C': '#C8A050', 'd': '#8A6A30', 'h': '#FFB830'}),
    'glow_larva': (['........', '...yy...', '..ywwy..', '..ywwy..', '...yy...', '..YyyY..', '.YyyyyY.', '..YYYY..'],
                   {'w': '#FFF6D8', 'y': '#FFD650', 'Y': '#FFB830'}),
    'honey_vat': (['..hHHh..', '.bhhhhb.', '.bBBBBb.', '.bggggb.', '.bBBBBb.', '.bbbbbb.', '.bggggb.', '..BBBB..'],
                  {'b': '#8A5A2E', 'B': '#5A3A1E', 'h': '#FFB830', 'H': '#FFE070', 'g': '#C8962A'}),
    # ---- the theatre
    'ticket_booth': (['GGGGGGGG', 'rRrRrRrR', 'rwwwwwwr', 'rwkwwkwr', 'rggggggr', 'rRRRRRRr', 'rRRggRRr', 'kkkkkkkk'],
                     {'r': '#A82038', 'R': '#7A1428', 'g': '#FFD650', 'G': '#C8962A', 'w': '#FFF6C8', 'k': '#2A1A10'}),
    'velvet_rope': (['g......g', 'G......G', 'Grr..rrG', 'G.rrrr.G', 'G......G', 'G......G', 'GG....GG', '........'],
                    {'r': '#C02038', 'g': '#FFE070', 'G': '#C8962A'}),
    'bust_statue': (['...www..', '..wWwww.', '..wwkww.', '..wwww..', '...ww...', '..wwwwW.', '.dddddd.', '.WWWWWW.'],
                    {'w': '#E8E4D8', 'W': '#B8B0A0', 'd': '#7A7468', 'k': '#5A5448'}),
    'footlight': (['........', '........', '...yy...', '..yWWy..', '..YyyY..', '.GGGGGG.', '.gGgGgG.', '........'],
                  {'y': '#FFE89A', 'Y': '#FFC040', 'W': '#FFFFFF', 'G': '#C8962A', 'g': '#8A6418'}),
    'seat': (['........', '.rrrrrr.', '.rRRRRr.', '.rRRRRr.', '.rrrrrr.', '.gRRRRg.', '.g....g.', '........'],
             {'r': '#B02038', 'R': '#7A1428', 'g': '#C8962A'}),
    'vanity_mirror': (['ybybyby.', 'bcCcccb.', 'bccCccb.', 'bcccCcb.', 'bbbbbbb.', '..bBb...', '.bbbbb..', '........'],
                      {'y': '#FFE89A', 'c': '#C8E8FF', 'C': '#FFFFFF', 'b': '#8A5A2E', 'B': '#5A3A1E'}),
    'costume_rack': (['kkkkkkkk', 'k......k', 'rrbbppgg', 'rRbBpPgG', 'rRbBpPgG', '.R.B.P.G', 'k......k', 'kk....kk'],
                     {'k': '#3A3648', 'r': '#C83A5A', 'R': '#8A1A3A', 'b': '#4A6AC8', 'B': '#2A3A8A', 'p': '#B05AC8', 'P': '#6A2A8A', 'g': '#FFD650', 'G': '#C8962A'}),
    'prop_crate': (['bbbbbbbb', 'bBbbbbBb', 'bbBbbBbb', 'bbbBBbbb', 'bbbBBbbb', 'bbBbbBbb', 'bBbbbbBb', 'bbbbbbbb'],
                   {'b': '#9A6A38', 'B': '#5A3A1E'}),
    'stage_moon': (['..yyy...', '..yYyy..', '.yY..y..', '.yY.....', '.yYy....', '..yYyy..', '...yy...', '...b....'],
                   {'y': '#FFE89A', 'Y': '#E8C060', 'b': '#8A5A2E'}),
    'sandbag': (['...k....', '...k....', '..bbb...', '.bBbbb..', '.bbbBb..', '.bbbbb..', '..bbb...', '........'],
                {'k': '#3A3020', 'b': '#B89060', 'B': '#7A5A30'}),
    'curtain_drape': (['rRrRrR..', 'rRrRrR..', 'rRrRr...', 'rRrR....', '.gg.....', 'rRrR....', 'rRrRr...', 'rRrRrR..'],
                      {'r': '#B02038', 'R': '#6A1024', 'g': '#FFD650'}),
    'mask_stand': (['y..y..y.', 'G..G..G.', 'GGGGGGG.', '...G....', '...G....', '...G....', '..GGG...', '.GGGGG..'],
                   {'y': '#FFE89A', 'G': '#C8962A'}),
    'mask_stand_full': (['yy.bb.ss', 'kyykbkks', 'GGGGGGGG', '...G....', '...G....', '...G....', '..GGG...', '.GGGGG..'],
                        {'y': '#FFD650', 'b': '#6A8AE0', 's': '#E8E8F0', 'k': '#2A1A10', 'G': '#C8962A'}),
    'mask_comedy': (['........', '.yyyyyy.', 'yykyykyy', 'yyyyyyyy', 'ykyyyyky', '.ykkkky.', '..yyyy..', '........'],
                    {'y': '#FFD650', 'k': '#2A1A10'}),
    'mask_tragedy': (['........', '.bbbbbb.', 'bbkbbkbb', 'bbbbbbbb', 'bbkkkkbb', 'bkbbbbkb', '..bbbb..', '........'],
                     {'b': '#6A8AE0', 'k': '#1A1A3A'}),
    'mask_silence': (['........', '.ssssss.', 'ssksskss', 'ssssssss', 'ssrrrrss', '.ssssss.', '..ssss..', '........'],
                     {'s': '#E8E8F0', 'k': '#2A2A3A', 'r': '#C83A5A'}),
    # ---- the lighthouse
    'crystal_cluster': (['....C...', '...Cc.C.', '..dCc.cC', 'C.dcd.cd', 'cCdcdDcd', 'cdDcdDdD', 'DDDDDDDD', '........'],
                        {'c': '#C8B8FF', 'C': '#FFFFFF', 'd': '#8A7AE0', 'D': '#4A3A9A'}),
    'prism_pillar': (['...CC...', '..CccC..', '..cCcd..', '..cCcd..', '..cCcd..', '..cCcd..', '.dcCcdD.', '.DDDDDD.'],
                     {'c': '#E0D8FF', 'C': '#FFFFFF', 'd': '#8A7AE0', 'D': '#4A3A9A'}),
    'lens_sentry': (['..dccd..', '.dcCCcd.', '.dCkkCd.', '.dcCCcd.', '..dccd..', '...D....', '..D.D...', '.D...D..'],
                    {'c': '#C8B8FF', 'C': '#FFFFFF', 'd': '#6A5AB0', 'D': '#3A3648', 'k': '#FF3A8A'}),
    'beam_lamp': (['..kkkk..', '.kGGGGk.', '.kwWWwk.', '.kWWWWk.', '.kwWWwk.', '.kGGGGk.', '..kkkk..', '...kk...'],
                  {'k': '#2A1A10', 'G': '#FFD650', 'w': '#FFFBE0', 'W': '#FFFFFF'}),
    'mirror_a': (['.....CcS', '....CcS.', '...CcS..', '..CcS...', '.CcS....', 'CcS.....', '..kk....', '.kkkk...'],
                 {'c': '#A8D8F8', 'C': '#FFFFFF', 'S': '#6A6A88', 'k': '#3A3648'}),
    'mirror_b': (['ScC.....', '.ScC....', '..ScC...', '...ScC..', '....ScC.', '.....ScC', '....kk..', '...kkkk.'],
                 {'c': '#A8D8F8', 'C': '#FFFFFF', 'S': '#6A6A88', 'k': '#3A3648'}),
    'receiver_off': (['...cc...', '..cddc..', '..cddc..', '.cddddc.', '.cdDDdc.', '..cddc..', '.kkkkkk.', 'kkkkkkkk'],
                     {'c': '#6A5AB0', 'd': '#4A3A9A', 'D': '#2A1A5A', 'k': '#2A2838'}),
    'receiver_on': (['...cc...', '..cddc..', '..cddc..', '.cddddc.', '.cdDDdc.', '..cddc..', '.kkkkkk.', 'kkkkkkkk'],
                    {'c': '#FFFFFF', 'd': '#C8B8FF', 'D': '#8AF6FF', 'k': '#2A2838'}),
    'great_lens': (['.kGGGGk.', 'kGwWWwGk', 'GwWWWWwG', 'GWWWWWWG', 'GwWWWWwG', 'kGwWWwGk', '.kGGGGk.', '..kGGk..'],
                   {'k': '#2A1A10', 'G': '#FFD650', 'w': '#E8F4FF', 'W': '#FFFFFF'}),
    'lens_pedestal': (['........', '........', '..wWWw..', '.wWccWw.', '.GwWWwG.', '.gGGGGg.', '..gggg..', '........'],
                      {'w': '#E8F4FF', 'W': '#FFFFFF', 'c': '#C8E8FF', 'G': '#FFD650', 'g': '#8A6418'}),
    # ---- the dream
    'dream_lamp': (['..LLL...', '.LyyyL..', '.Ly..L..', '.LyyyL..', '..LLL...', '...k....', '...k....', '..kkk...'],
                   {'L': '#8A70D8', 'y': '#FFE89A', 'k': '#2A1A48'}),
    'pillow_pile': (['........', '..pppp..', '.pPPPPp.', '.wwwwww.', 'wWWWWWWw', '.bbbbbb.', 'bBBBBBBb', '.bbbbbb.'],
                    {'w': '#F0E8FF', 'W': '#C8B8E8', 'p': '#FFB8E0', 'P': '#D888C0', 'b': '#B8C8FF', 'B': '#8898D8'}),
    'stopped_clock': (['..bbbb..', '.bwwwwb.', '.bwkwwb.', '.bwwkwb.', '.bwwwwb.', '..bbbb..', '..bGGb..', '.bbbbbb.'],
                      {'b': '#6A4A2A', 'w': '#FFFBE0', 'k': '#2A1A10', 'G': '#FFD650'}),
    'moon_shard': (['....ww..', '...wwW..', '..wW....', '..wW....', '..wW....', '...wwW..', '....ww..', '........'],
                   {'w': '#E8F8FF', 'W': '#8AD8FF'}),
    'dream_sigil': (['..pPPp..', '.P....P.', 'p..ww..p', 'P.w..w.P', 'P.w..w.P', 'p..ww..p', '.P....P.', '..pPPp..'],
                    {'p': '#FF7AB8', 'P': '#C83A8A', 'w': '#FFE0F0'}),
    'dream_sigil_live': (['..pPPp..', '.P.ww.P.', 'p.wPPw.p', 'PwP..PwP', 'PwP..PwP', 'p.wPPw.p', '.P.ww.P.', '..pPPp..'],
                         {'p': '#FF3A5A', 'P': '#FF7AB8', 'w': '#FFFFFF'}),
    'dream_sigil_done': (['..pPPp..', '.P....P.', 'p......p', 'P......P', 'P......P', 'p......p', '.P....P.', '..pPPp..'],
                         {'p': '#6A6A98', 'P': '#4A4A70'}),
    'alarm_clock': (['yy....yy', 'y.rrrr.y', '.rwwwwr.', 'rwwkwwwr', 'rwwkkwwr', '.rwwwwr.', '..rrrr..', '.k....k.'],
                    {'y': '#FFD650', 'r': '#C83A3A', 'w': '#FFFBE0', 'k': '#2A1A10'}),
    'alarm_ringing': (['y.y..y.y', 'yyrrrryy', '.rwwwwr.', 'rwwkwwwr', 'rwwwkkwr', '.rwwwwr.', 'w.rrrr.w', 'wk....kw'],
                      {'y': '#FFD650', 'r': '#FF5A5A', 'w': '#FFFFFF', 'k': '#2A1A10'}),
}
# the Petkeeper of the Nexus: a green cap, an apron full of treats, and a fox kit that will not get off her arm
_P8['petkeeper'] = (['..gggg..', '.gGGGGg.', '..skks..', '..ssss.o', '.aaaaoo.', '.aYaaoW.', '..aaaa..', '..b..b..'],
                    {'g': '#3A7A2E', 'G': '#5AA84A', 's': '#F0C8A0', 'k': '#2A1A10', 'a': '#C89A5A', 'Y': '#FFD650', 'o': '#E0641E', 'W': '#FFF2DC', 'b': '#5A3A1E'})
PROPS = {k: [(_dbl(g), pal)] for k, (g, pal) in _P8.items()}
PROPS['petkeeper'].append((_dbl(['..gggg..', '.gGGGGg.', '..skks..', '..ssss..', '.aaaaoo.', '.aYaaoWo', '..aaaa..', '..b..b..']), _P8['petkeeper'][1]))
# a few that move: the larva glows, the lamp flickers, the alarm shakes, the sentry blinks, the sigil pulses
for _k, _alt in (('glow_larva', {'w': '#FFFFFF', 'y': '#FFE89A'}), ('dream_lamp', {'y': '#FFF6C8'}), ('alarm_ringing', {'r': '#C83A3A'}),
                 ('lens_sentry', {'k': '#FFFFFF'}), ('dream_sigil_live', {'p': '#FF7AB8', 'P': '#FF3A5A'}), ('footlight', {'W': '#FFF6C8', 'y': '#FFFFFF'})):
    g, pal = _P8[_k]
    PROPS[_k].append((_dbl(g), {**pal, **_alt}))

# ================================================================ PORTALS (16x16, 3 frames: tools/portals.py)
import portals as _PT  # noqa: E402
_PT.PAL.update({'h': '#FFB830', 'x': '#E8C878', 'X': '#9A7030', 'n': '#FF7AB8', 'N': '#C8B0FF', 'z': '#0A0618'})


def _hive(f):
    c = _PT.Cv()
    for y in range(16):
        for x in range(16):
            dx, dy = abs(x - 7.5), abs(y - 8)
            if dx <= 7 * 0.87 and dy <= 7.5 - dx / 1.73:
                c.p(x, y, 'x' if dx > 5 or dy > 7.5 - dx / 1.73 - 1.5 else '.')
    c.swirl(7.5, 8.5, 4.2, 5, ['W', 'Y', 'h', 'X'], f, arms=2)
    return c.done()


def _theatre(f):
    c = _PT.Cv()
    for y in range(1, 16):
        for x in (1, 2, 13, 14):
            c.p(x, y, 'R' if x in (1, 14) else 'r')
    for x in range(1, 15):
        c.p(x, 1, 'G'); c.p(x, 2, 'g' if x % 2 else 'G')
    c.swirl(7.5, 9.5, 4.2, 5.4, ['W', 'G', 'r', 'R'], f, arms=3)
    for k in range(3):
        c.p(4 + k * 4, 15, 'Y' if (f + k) % 2 else 'G')
    return c.done()


def _spire(f):
    c = _PT.Cv()
    for y in range(2, 16):
        for x in (2, 13):
            c.p(x, y, 'V' if (y + f) % 3 else 'C')
    for x in range(2, 14):
        c.p(x, 2, 'v')
    c.p(7, 0, 'C'); c.p(8, 0, 'C'); c.p(6, 1, 'V'); c.p(9, 1, 'V')
    c.swirl(7.5, 9.2, 4.4, 5.6, ['W', 'C', 'V', 'v'], f, arms=4)
    return c.done()


def _dream(f):
    c = _PT.Cv()
    for y in range(16):
        for x in range(16):
            d = ((x - 7.5) / 7) ** 2 + ((y - 8) / 7.5) ** 2
            if 0.72 < d <= 1:
                c.p(x, y, 'N' if (x + y + f) % 4 else 'Q')
    c.swirl(7.5, 8, 5, 5.6, ['Q', 'n', 'q', 'z'], f, arms=2)
    for k in range(3):
        c.p(3 + k * 5, 2 + (f + k) % 3 * 5, 'W')
    return c.done()


PORTALS = {'hive': _hive, 'theatre': _theatre, 'spire': _spire, 'dream': _dream}

# ================================================================ ICONS (8x8): keys and the new relics
KEYS = {'hive': ('#FFD650', '#C8962A', '#FFB830'), 'theatre': ('#FFE070', '#8A1A3A', '#C83A5A'),
        'spire': ('#E8E0FF', '#6A5AB0', '#8AF6FF'), 'dream': ('#C8B0FF', '#4A3A8A', '#FF7AB8')}
ICONS = {
    'queens_stinger': (['......wY', '.....wYk', '....wYk.', '...wYk..', '..yYk...', '.pPy....', 'pPp.....', 'p.......'],
                       {'w': '#FFF6C8', 'Y': '#FFD650', 'y': '#E8A020', 'k': '#1A1006', 'p': '#8A2AC8', 'P': '#C88AFF'}),
    'honeyguard_band': (['..hhhh..', '.h....h.', 'h..YY..h', 'h.YwwY.h', 'h.YwwY.h', 'h..YY..h', '.h....h.', '..hhhh..'],
                        {'h': '#C8962A', 'Y': '#FFB830', 'w': '#FFF6C8'}),
    'maestros_baton': (['.......w', '......wg', '.....wg.', '....wg..', '...kk...', '..kk....', '.kk.....', 'rr......'],
                       {'w': '#FFFFFF', 'g': '#FFD650', 'k': '#2A1A20', 'r': '#C83A5A'}),
    'the_last_curtain': (['rRrRrRrR', 'gggggggg', 'rRrRrRrR', 'rRrRrRrR', 'rRr..rRr', 'rR....Rr', 'rR....Rr', 'r......r'],
                         {'r': '#C02038', 'R': '#6A1024', 'g': '#FFD650'}),
    'stringcutter': (['......ss', '.....ssS', '....ssS.', '...ssS..', 'r.ssS...', '.rsS....', 'rgr.....', 'gr......'],
                     {'s': '#E8E8F8', 'S': '#8A8AA8', 'r': '#C83A5A', 'g': '#FFD650'}),
    'wyrmglass_wand': (['......Ww', '.....Wcw', '....Wc..', '...cc...', '..dd....', '.dd.....', 'dd......', 'b.......'],
                       {'W': '#FFFFFF', 'w': '#8AF6FF', 'c': '#C8B8FF', 'd': '#6A5AB0', 'b': '#FF6AB0'}),
    'prismglass_mantle': (['..cddc..', '.cCddCc.', 'cCcddcCc', 'cCcddcCc', 'cCcwwcCc', 'cCcddcCc', 'cCcddcCc', 'ccc..ccc'],
                          {'c': '#C8B8FF', 'C': '#FFFFFF', 'd': '#6A5AB0', 'w': '#8AF6FF'}),
    'the_seventh_colour': (['..rroo..', '.r....y.', 'v..WW..y', 'v.W..W.g', 'b.W..W.g', 'b..WW..g', '.b....g.', '..bbgg..'],
                           {'r': '#FF4A5A', 'o': '#FF9A3A', 'y': '#FFE85A', 'g': '#5AE07A', 'b': '#4A8AFF', 'v': '#B05AFF', 'W': '#FFFFFF'}),
    'lullaby_staff': (['....yyy.', '...yY.y.', '...y....', '...Y....', '...p....', '..p.....', '.p......', 'p.......'],
                      {'y': '#FFE89A', 'Y': '#E8C060', 'p': '#8A70D8'}),
    'nightlight_ring': (['..LLLL..', '.L....L.', 'L..yy..L', 'L.y..y.L', 'L.y....L', 'L..yy..L', '.L....L.', '..LLLL..'],
                        {'L': '#8A70D8', 'y': '#FFE89A'}),
    'the_waking_bell': (['...yy...', '..yYYy..', '..yYYy..', '.yYYYYy.', '.yYYYYy.', 'yyyyyyyy', '...rr...', '...rr...'],
                        {'y': '#FFD650', 'Y': '#FFF0A0', 'r': '#C83A3A'}),
}

# ================================================================ SHOTS (hand-drawn 8x8 archetypes + colour ramps)
# Pointed shots point up-right (rotated to their flight); FACE_R ones point right; SPIN ones spin; the rest stay upright.
SHOT_ART = {
    'stinger': ['......44', '.....343', '....3a3.', '...3a3..', '..2a2...', '.2a2....', '.12.....', '1.......'],
    'beeshot': ['........', '.WW.WW..', '.WWWWW..', '.3a3a3o.', '23a3a33.', '.2a2a2..', '........', '........'],
    'nectar': ['...33...', '.334433.', '34444443', '34W44443', '34444443', '24444442', '.222222.', '...22...'],
    'waxdrop': ['...33...', '...34...', '..3443..', '..3443..', '.234432.', '.234W32.', '.223322.', '..2222..'],
    'honeyglob': ['..3333..', '.3444433', '34W44443', '34444443', '.344443.', '.2.33.2.', '.2..2...', '....2...'],
    'royal_sting': ['.....344', '....3443', '...3aa3.', '..3443..', '.3443...', '2aa2....', '122.....', '11......'],
    'puppet_string': ['.......4', '......4.', '.....3..', '....3...', '...3....', '..2.....', '.aa.....', 'aa......'],
    'mask_shot': ['..3333..', '.344443.', '34oo4oo3', '34444443', '3o4444o3', '.3oooo3.', '..3333..', '........'],
    'sandbag_shot': ['...aa...', '..2332..', '.233332.', '23344332', '23444432', '23344332', '.122221.', '........'],
    'rose': ['.2332...', '233432..', '2343432.', '.23332..', '..a2....', '.aa.....', 'aa.a....', '........'],
    'ribbon': ['......33', '....3443', '...34.2.', '..343...', '.343....', '343.....', '32......', '2.......'],
    'scissor_blade': ['......44', '.....443', '....443.', '...443..', '..443...', '.aa3....', 'a..a....', '.aa.....'],
    'refraction': ['...44...', '..4334..', '..3443..', '.433334.', '.3a33a3.', '43333334', '22222222', '........'],
    'gem': ['........', '...44...', '..4334..', '.433332.', '.233321.', '..2321..', '...21...', '........'],
    'white_bolt': ['.....44.', '....4WW4', '...4WWW4', '..34WW4.', '.a34.4..', 'b.a.....', '.b......', 'a.......'],
    'glass_pane': ['.133331.', '.34W443.', '.344W43.', '..3443..', '..3443..', '...34...', '...33...', '........'],
    'lumen': ['...3....', '...4..3.', '..4W4...', '34WWW43.', '..4W4...', '.3.4....', '...3....', '........'],
    'lensbolt': ['......3.', '.....3W3', '....3W3.', '...3W3..', '..343...', '.3a3....', 'a.a.....', '.a......'],
    'sheep': ['........', '.33333..', '3444443.', '34444411', '3444441o', '.3333.1.', '.1..1...', '........'],
    'zzz': ['........', '.444444.', '.....43.', '....43..', '...43...', '..43....', '.444444.', '........'],
    'crescent_moon': ['..4433..', '....443.', '.....443', '.....443', '.....443', '.....443', '....443.', '..4433..'],
    'nightmare_eye': ['........', '..2222..', '.23WW32.', '2WaooaW2', '2WaooaW2', '.23WW32.', '..2222..', '........'],
    'dreamstar': ['...44...', '...44...', '..4334..', '44333344', '44333344', '..4334..', '...44...', '...44...'],
    'pillow_feather': ['......44', '.....443', '....443.', '...343..', '..343...', '.33.....', '.3......', '2.......'],
}
POINTED = {'stinger', 'royal_sting', 'puppet_string', 'rose', 'ribbon', 'scissor_blade', 'white_bolt', 'lensbolt', 'pillow_feather'}
FACE_R = {'crescent_moon'}
SPIN = {'refraction', 'sandbag_shot', 'dreamstar', 'gem'}


def _r(o, a1, a2, a3, a4, a='#000000', b='#FFFFFF'):
    return {'o': o, '1': a1, '2': a2, '3': a3, '4': a4, 'a': a, 'b': b, 'W': '#FFFFFF', 'K': o}


SHOTS = {
    'stinger': ('stinger', _r('#1A1006', '#8A5A10', '#E8A020', '#FFD650', '#FFF6C8', '#24160A')),
    'beeshot': ('beeshot', _r('#1A1006', '#8A5A10', '#C88A10', '#FFD650', '#FFF0A0', '#24160A')),
    'nectar': ('nectar', _r('#3A2006', '#8A5A10', '#E89A1A', '#FFC040', '#FFEFA8')),
    'waxdrop': ('waxdrop', _r('#3A2A10', '#B89A60', '#E8D8A8', '#FFF2CC', '#FFFFF0')),
    'honeyglob': ('honeyglob', _r('#3A1E04', '#B0680A', '#E0901A', '#FFC040', '#FFEFA8')),
    'royal_sting': ('royal_sting', _r('#1A0A20', '#A86A10', '#E8B020', '#FFE070', '#FFFBE0', '#6A2A8A')),
    'puppet_string': ('puppet_string', _r('#2A2010', '#8A7A60', '#C8B898', '#F0E8D0', '#FFFFFF', '#C83A5A')),
    'mask_shot': ('mask_shot', _r('#2A1A06', '#A8781A', '#E8B030', '#FFD650', '#FFF6C8')),
    'sandbag_shot': ('sandbag_shot', _r('#2A1A0A', '#6A4A2A', '#9A7448', '#C8A070', '#E8D0A0', '#4A2A10')),
    'rose': ('rose', _r('#2A040C', '#7A1020', '#B01830', '#E83A50', '#FF8A9A', '#3A8A3A')),
    'ribbon': ('ribbon', _r('#2A0620', '#8A1A60', '#C82A8A', '#FF6AC0', '#FFD0F0')),
    'scissor_blade': ('scissor_blade', _r('#16162A', '#5A5A70', '#8A8AA0', '#C8C8D8', '#FFFFFF', '#FFD650')),
    'refraction': ('refraction', _r('#16102A', '#4A3A8A', '#8A7ADA', '#C8B8FF', '#FFFFFF', '#FF8AD0')),
    'white_bolt': ('white_bolt', _r('#14142A', '#8898D8', '#B8C8FF', '#E8F0FF', '#FFFFFF', '#FF6A8A', '#6AD8FF')),
    'glass_pane': ('glass_pane', _r('#14202E', '#5A7A9A', '#7AA0C0', '#A8D8F0', '#E8F8FF')),
    'lumen': ('lumen', _r('#2A2210', '#B8A060', '#E8D088', '#FFF0A0', '#FFFBE0')),
    'lensbolt': ('lensbolt', _r('#2A1A06', '#C8962A', '#FFD650', '#FFE8A0', '#FFFBE0', '#FFB830')),
    'sheep': ('sheep', _r('#1A1428', '#3A3048', '#B8B0C8', '#E8E0F0', '#FFFFFF')),
    'zzz': ('zzz', _r('#140C2A', '#5A48B0', '#7A68D8', '#A890FF', '#E8E0FF')),
    'crescent_moon': ('crescent_moon', _r('#2A1E06', '#8A6A20', '#C8A040', '#FFE89A', '#FFFBE0')),
    'nightmare_eye': ('nightmare_eye', _r('#0A0410', '#1A0820', '#3A1040', '#7A2A6A', '#FFFFFF', '#FF3A5A')),
    'dreamstar': ('dreamstar', _r('#2A0A20', '#A85A98', '#E890C8', '#FFB8E0', '#FFF0FA')),
    'pillow_feather': ('pillow_feather', _r('#1A1430', '#8878B8', '#B8A8E0', '#F0E8FF', '#FFFFFF')),
}
for _n, (_h, _c) in {'r': (0.0, '#FF4A5A'), 'o': (0.07, '#FF9A3A'), 'y': (0.15, '#FFE85A'), 'g': (0.36, '#5AE07A'),
                     'b': (0.6, '#4A8AFF'), 'v': (0.77, '#B05AFF')}.items():
    import colorsys
    _rgb = lambda h, l, s: '#%02X%02X%02X' % tuple(round(v * 255) for v in colorsys.hls_to_rgb(h, l, s))  # noqa: E731
    SHOTS[f'spectrum_{_n}'] = ('gem', _r(_rgb(_h, 0.1, 0.6), _rgb(_h, 0.32, 0.85), _c, _rgb(_h, 0.72, 1), _rgb(_h, 0.92, 1)))
