"""Pets, their eggs, and the vault chest icon. 8x8 art stored doubled (16x16 cells).

PETS   kind -> (palette, A, A2): two poses (a little hop / bob). Pets face RIGHT; the game flips them.
ICONS  item id -> (8x8 grid, palette): pet eggs by rarity, and the Vault Chest.
PROPS  'pet_<kind>' -> [(16x16 grid, palette), ...] for the objects sheet (world_art hooks it in).
"""

# Each pet is a small 8x8 portrait in three tones, with a clear eye and one signature detail (the fox's
# smouldering tail, the moth's lantern belly, the owl's rune). Pets face RIGHT; the game flips them.
E = '#24141E'
PETS = {
 'ember_fox': ({'1':'#8A3414','2':'#E0641E','3':'#FF9440','w':'#FFF2DC','e':E,'a':'#FFE45C','b':'#FF7A1A'},
   ['.....2.2','aa..2332','bb..23e3','33.22wwe','.32222w.','.222222.','..2.12.1','..1..1..'],
   ['.....2.2','a...2332','ab..23e3','b3.22wwe','.32222w.','.222222.','..21.21.','.1....1.']),
 'tide_turtle': ({'1':'#1E5A50','2':'#2E8A70','3':'#5AD8B0','a':'#BFF8E8','s':'#C8F08A','S':'#6AAA4A','e':E},
   ['........','..2332..','.23a332.','232a32ss','12222sse','.111111.','.S.SS.S.','........'],
   ['........','..2332..','.23a332.','232a32ss','12222sse','.111111.','S..SS..S','........']),
 'lantern_moth': ({'w':'#EDE4CC','W':'#B8A888','p':'#C87AE8','y':'#FFD650','Y':'#FFF8C8','e':E,'a':'#8A7A5A'},
   ['.a....a.','..aeea..','wwwYYwww','wpwYYwpw','WwWyyWwW','.WWyyWW.','..W..W..','........'],
   ['.a....a.','..aeea..','.wwYYww.','wwpYYpww','wWWyyWWw','W.WyyW.W','........','........']),
 'bog_frog': ({'1':'#2E6A2A','2':'#5AA83A','3':'#9AD85A','w':'#FFFFFF','e':E,'y':'#E8E89A','r':'#FF8A8A'},
   ['........','.33..33.','3we22ew3','23322332','2r1111r2','12yyyy21','22.11.22','........'],
   ['........','........','.33..33.','3we22ew3','23322332','2r1111r2','12yyyy21','22....22']),
 'rune_owl': ({'1':'#4A3020','2':'#8A6440','3':'#C09868','w':'#FFF6E0','e':E,'y':'#F2C14E','c':'#3BEFFF'},
   ['.1....1.','.122221.','2ww22ww2','2we22ew2','233yy332','.23cc32.','.233332.','..y..y..'],
   ['.1....1.','.122221.','2ww22ww2','2we22ew2','233yy332','223cc322','.233332.','..y..y..']),
 'salt_crab': ({'1':'#8A2A1A','2':'#D8583C','3':'#FF9A6A','w':'#FFFFFF','e':E,'s':'#F0F6FA'},
   ['33....33','3.2..2.3','12e..e21','.233332.','23s33s32','.122221.','1.1..1.1','........'],
   ['........','33....33','32e..e23','.233332.','23s33s32','.122221.','.1.11.1.','........']),
 'frost_kit': ({'1':'#7A9AC8','2':'#C8DCF0','3':'#F4FAFF','e':E,'p':'#FF9AB8','c':'#8AF6FF'},
   ['.2....2.','.32..23.','.333333.','33e33e33','233pp332','.233332c','.2333321','..2..2..'],
   ['.2....2.','.32..23.','.333333.','33e33e33','233pp332','.233332.','.2333322','..2..2.c']),
 'star_wisp': ({'y':'#FFD650','Y':'#FFF2A0','w':'#FFFFFF','e':'#3A2A6A','c':'#8AF6FF','o':'#E8A020'},
   ['...yy...','...YY...','yyYwwYyy','.YewweY.','..YwwY..','.YY..YY.','yY....Yy','c......c'],
   ['c..yy..c','...YY...','yyYwwYyy','.YewweY.','..YwwY..','.YY..YY.','yo....oy','........']),
}

EGG = ['...EE...', '..EEEE..', '.EEsEEE.', '.EEEEsE.', 'EEsEEEEE', 'EEEEsEEe', '.EEEEEe.', '..eeee..']
EGG_PAL = {
    'common': {'E': '#E8E0C8', 'e': '#A89A7C', 's': '#8A6A44'},
    'uncommon': {'E': '#9AE8A0', 'e': '#3A8A4A', 's': '#2A6A3A'},
    'rare': {'E': '#8AB4FF', 'e': '#2E5AE8', 's': '#1E3A9A'},
    'legendary': {'E': '#FFD650', 'e': '#C98A22', 's': '#FF4A5A'},
}
ICONS = {f'pet_egg_{r}': (EGG, pal) for r, pal in EGG_PAL.items()}
ICONS['vault_chest'] = (['........', '.wwwwww.', 'wyWWWWyw', 'wwwwwwww', 'wWWyyWWw', 'wWWkkWWw', 'wWWWWWWw', '.wwwwww.'],
                        {'w': '#5A4030', 'W': '#8A6A48', 'y': '#F2C14E', 'k': '#2A1A10'})


def _dbl(g):
    return [''.join(c * 2 for c in r) for r in g for _ in (0, 1)]


import colorsys


def _skin(pal, kind):
    """rarity skins: GILDED (legendary) turns a pet to living gold; CELESTIAL (divine) to starlit violet and pink.
    The eye and pure whites stay, so the face still reads."""
    out = {}
    for k, hx in pal.items():
        r, g, b = (int(hx[i:i + 2], 16) / 255 for i in (1, 3, 5))
        h, l, s = colorsys.rgb_to_hls(r, g, b)
        if hx.upper() in ('#FFFFFF', E.upper()) or l < 0.16:
            out[k] = hx
            continue
        if kind == 'gold':
            h2, l2, s2 = 0.115 - (0.5 - l) * 0.06, min(0.88, l * 1.02 + 0.04), max(0.72, s)
        else:
            if l > 0.7:                                       # highlights catch starlight: pale cyan-white
                h2, l2, s2 = 0.52, min(0.93, l + 0.05), 0.85
            else:                                             # the body: deep violet shading to orchid
                h2, l2, s2 = 0.72 + l * 0.14, 0.18 + l * 0.85, max(0.62, s)
        r, g, b = colorsys.hls_to_rgb(h2 % 1, l2, s2)
        out[k] = '#%02X%02X%02X' % (round(r * 255), round(g * 255), round(b * 255))
    return out


PROPS = {}
for k, (pal, a, a2) in PETS.items():
    PROPS[f'pet_{k}'] = [(_dbl(a), pal), (_dbl(a2), pal)]
    for sk in ('gold', 'divine'):
        P2 = _skin(pal, sk)
        PROPS[f'pet_{k}_{sk}'] = [(_dbl(a), P2), (_dbl(a2), P2)]

# ---- dungeon keys: a square bow with the dungeon's gem, a shaft, two teeth. Each in its dungeon's metal.
KEY = ['....KkkK', '....kggk', '....kggk', '....KkkK', '...k....', '..k.....', '.kkk....', 'k.k.....']
KEYS = {'chapel': ('#8AB4BE', '#4E6670', '#FF8FBF'), 'crypt': ('#E0D8C0', '#8A8070', '#9CFF6A'), 'forge': ('#8E8AA6', '#4F4B60', '#F2641A'),
        'ember': ('#E8A040', '#8A5418', '#FFD84A'), 'scriptorium': ('#CFE8FF', '#6A8AAA', '#3BEFFF'), 'heart': ('#F2C14E', '#A8792A', '#FF4A5A'),
        'throne': ('#FFF0A0', '#C9A040', '#B888FF')}
import dungeons4_art as _d4k  # noqa: E402
KEYS.update(_d4k.KEYS)
for _d, (_k, _K, _g) in KEYS.items():
    ICONS[f'key_{_d}'] = (KEY, {'k': _k, 'K': _K, 'g': _g, 'G': _g})

# ---- the admin chest: gilded, magenta, glinting (objects sheet, written pixel-exact like the pets)
_AC = {'y': '#C98A22', 'Y': '#FFE89A', 'P': '#B03AC8', 'p': '#7A1E8E', 'm': '#FF4AF0', 'k': '#2A0A30', 'W': '#FFFFFF'}
_AC0 = ['........', '.yyyyyy.', 'yPYPPYPy', 'yyyyyyyy', 'yPPmmPPy', 'yppkkppy', 'yPPPPPPy', '.yyyyyy.']
_AC1 = ['......W.', '.yyyyyW.', 'yPYPPYPy', 'yyyyyyyy', 'yPPmmPPy', 'yppkkppy', 'WPPPPPPy', '.yyyyyy.']
PROPS['admin_chest'] = [(_dbl(_AC0), _AC), (_dbl(_AC1), _AC)]

# ---- the Emberforge's furniture: crucibles, ingots, weapon racks, sleeping golems, and the Forgemaster's journals
_EF = {'i': '#7C808E', 'I': '#44465A', 'j': '#B8BECE', 'M': '#FFD84A', 'm': '#FF8C1E', 'h': '#FFF6C8', 'n': '#A8301A',
       'x': '#6C4428', 'X': '#3E2414', 'y': '#F4C64A', 'Y': '#A8742A', 's': '#6A5852', 'S': '#8C7A72', 'z': '#3A2C2C',
       'w': '#EDE6D2', 'b': '#4A4254', 'k': '#2A1A10'}
FORGE = {
    'crucible': [['........', '.iiiiii.', 'imMhmMmi', 'iMmmMhmi', '.iIiiIi.', '.I.ii.I.', '.I....I.', '.II..II.'],
                 ['...h....', '.iiiiii.', 'iMmhMmmi', 'imMmmMhi', '.iIiiIi.', '.I.ii.I.', '.I....I.', '.II..II.']],
    'ingot_pile': [['........', '........', '...yy...', '..yYYy..', '.jyjjyj.', 'jIjjIjjI', 'IIIIIIII', '........']],
    'weapon_rack': [['.j..j..j', '.j..j..j', '.j..j..j', 'xxxxxxxx', '.i..y..i', '.i..y..i', 'xxxxxxxx', 'x......x']],
    'golem_husk': [['..SssS..', '.SzssZs.'.replace('Z', 'z'), 'SsszszsS', 'ssszszss', 'szsszszs', 's.sssss.', '.zs..sz.', '.zz..zz.']],
    'journal': [['........', '.wwwwww.', 'wbbwwbbw', 'wbwwwbww', '.xxxxxx.', '...xx...', '...xx...', '..xXXx..'],
                ['......h.', '.wwwwww.', 'wbbwwbbw', 'wbwwwbww', '.xxxxxx.', '...xx...', '...xx...', '..xXXx..']],
}
for _n, _frs in FORGE.items():
    PROPS[_n] = [(_dbl(g), _EF) for g in _frs]

# ---- the admin chest, made royal: a crowned treasure chest in purple velvet and gold, set with rubies and a sapphire
_RC = {'y': '#F2C14E', 'Y': '#FFF0A0', 'g': '#A8742A', 'P': '#7A2AB0', 'p': '#4A1670', 'W': '#C8A0FF', 'R': '#FF3A5A', 'B': '#5AC8FF', 'w': '#FFFFFF'}
_RC0 = ['..y.y.y.', '..yRyBy.', '..yyyyy.', 'yPPWPPPy', 'YYYYYYYY', 'ypPgRgpy', 'yPPPPPPy', '.gyyyyg.']
_RC1 = ['..Y.w.Y.', '..yRyBy.', '..yyyyy.', 'yPWPPPPy', 'YYYYYYYY', 'ypPgRgpy', 'yPPPPPPy', '.gyyyyg.']
PROPS['admin_chest'] = [(_dbl(_RC0), _RC), (_dbl(_RC1), _RC)]

# ---- dungeon furniture: a stone sarcophagus (the crypt) and the god's throne
_DF = {'s': '#8A8494', 'S': '#5E5A72', 'k': '#2E2A38', 'L': '#B8B2C8', 'y': '#F2C14E', 'Y': '#FFE89A', 'r': '#B02040', 'R': '#E0304A', 'w': '#EDE6D2'}
PROPS['sarcophagus'] = [(_dbl(['........', '.LLLLLL.', 'LsswssSL', 'LsswssSL', 'LssssssL', 'LSSSSSSL', '.kkkkkk.', '........']), _DF)]
PROPS['throne'] = [(_dbl(['.y....y.', '.yYyyYy.', '.yrrrry.', '.yrRRry.', '.yrrrry.', 'yyyyyyyy', 'yrrrrrry', 'y.y..y.y']), _DF)]
