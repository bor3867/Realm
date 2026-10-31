"""Tiered item icons in the old-school style: tiny 8x8 sprites, each art pixel doubled to 2x2.

Thick outlines, two or three flat tones, one accent. Weapons point up-right; abilities are
compact emblems; armour is a torso. The tier only changes the colours.
Letters: o outline, a/b/c tier metal dark/mid/light, d tier gem/glow, h highlight, w/W wood, l/L leather,
f/F cloth, k dark.
"""

ART = {
    # The outer outline is NOT drawn here: the game outlines the silhouette itself, so all 8x8 pixels are colour.
    # Light comes from the top-left (see shade()). k = dark detail, g/G = glass.
    # ---- weapons
    'gauntlet': ['..c.c.c.', '.cbcbcbc', '.bababab', 'cbbbbbbb', 'bccbbbbb', '.bbbbbba', '.dddddd.', '.aaaaaa.'],        # an armoured fist
    'tongs': ['.bddddb.', '.bddddb.', '..b..b..', '...bb...', '...kk...', '..b..b..', '.w....w.', 'w......w'],              # smith's tongs gripping a hot billet
    'sunrod': ['...d.d.d', '....ccc.', '....cdcd', '....ccc.', '...bb...', '..wW....', '.wW.....', 'wW......'],               # a rod crowned with a little sun
    'lantern': ['...aa...', '..a..a..', '..bccb..', '.bbbbbb.', '.bdhddb.', '.bddddb.', '.bddddb.', '.aaaaaa.'],             # a hanging lantern with a soul inside
    'harpoon': ['...cc...', '..cccc..', '.cbccbc.', '.c.ww.c.', '...ww...', '...ww...', '..LLLL..', '...ww...'],  # a barbed harpoon head on a bound shaft
    'rapier': ['.......h', '......c.', '.....c..', '.b..c...', '..bc....', '..lbb...', '.l...b..', 'd.......'],              # a thin blade with a swept hilt
    'coil': ['d.cccc.d', '.chcccc.', '..cccc..', '.bbbbbb.', '..aaaa..', '.bbbbbb.', '..aaaa..', 'wwwwwwww'],                 # a tesla coil: sphere, windings, base
    'pendulum': ['.aaaa...', '..bb....', '...b....', '....b...', '....cc..', '...chcc.', '...cddc.', '....cc..'],  # a pendulum mid-swing
    # ---- abilities
    'bellows': ['ww......', '.wwwww..', '.WWWWWWb', 'lLlLlLbc', 'lLlLlLbc', '.wwwwwwb', 'ww......', '........'],             # two handles, pleated leather, a nozzle
    'seal': ['..cccc..', '.cbbbbc.', 'cbbddbbc', 'cbdbbdbc', 'cbbddbbc', '.cbbbbc.', '.dd..dd.', '.d....d.'],  # a seal medallion on two ribbons
    'halo': ['...d....', 'd..d..d.', '.cccccc.', 'cc....cc', '.cccccc.', 'd..d..d.', '...d....', '........'],  # a flat ring of light, shining
    'reliquary': ['..bccb..', '.bbbbbb.', 'cbbbbbbc', 'wwffffww', 'wfkffkfw', 'wwffffww', 'wwfkkfww', 'aaaaaaaa'],           # a casket with a skull on its face
    'hookline': ['..cccc..', '..c..c..', '...cc...', '...bb...', '...bb...', 'c..bb..c', 'cb.bb.bc', '.bbbbbb.'],             # a three-pronged grappling hook
    'mirror': ['..bbbb..', '.bhgggb.', '.bggggb.', '.bgggGb.', '..bbbb..', '...bb...', '...ww...', '...ww...'],              # a hand mirror
    'kite': ['..ckb...', '.cckbb..', 'kkkkkkk.', '.cbkbb..', '..bkb...', '...k....', '...L.d..', '.d..L...'],  # a kite: spars, sail and tail
    'stopwatch': ['...cc...', '...bb...', '.bbbbbb.', 'bfffkffb', 'bfffkffb', 'bfffkkfb', 'bffffffb', '.bbbbbb.'],           # a stopwatch with its crown and hands
    'runeward': ['.abccba.', 'abccccba', 'bcdccdcb', 'bccddccb', 'bccddccb', '.bcdcdb.', '..bccb..', '...bb...'],  # a rune-cut shield
    'skyfall': ['..d.d.d.', '..w.w.w.', '..w.w.w.', '.bbbbbbb', '.lLLLLLb', '.lLLdLLb', '.lLLLLLb', '..bbbbb.'],   # a quiver of tier-fletched arrows
    'hex': ['.aaaaaf.', '.abbbaf.', '.abdbaf.', '.adddaf.', '.abdbaf.', '.abbbaf.', '.aaaaaF.', '..FFFFF.'],        # a grimoire with a glowing hex
    # ---- armour
    'plate': ['cbb..bbc', 'cbbbbbbc', '.bbccbb.', '.bbccbb.', '.bbccbb.', '..bccb..', '.aaddaa.', '..aaaa..'],                # a breastplate with pauldrons and a ridge
    'coat': ['.ff..ff.', 'bbfkkfbb', 'bbbkkbbb', 'bbbdbbbb', 'bbLLLLbb', '.bbdbbb.', '.bbbbbb.', '.bbbbbb.'],  # a coat with a fur collar, sleeves, belt, buttons
    'vestment': ['..bffb..', '.bbffbb.', 'bbbffbbb', '.bbffbb.', '.bbffbb.', 'bbbffbbb', 'bbbffbbb', 'dddddddd'],            # a robe with a pale stole
    'shroud': ['..bbbb..', '.bbkkbb.', '.bkkkkb.', '.bbkkbb.', 'bbbddbbb', 'bbbbbbbb', 'bbbbbbbb', 'b.bb.bb.'],              # a hooded shroud with a clasp
    'oilskin': ['.LL..LL.', 'llLkkLll', 'lllcclll', 'llllllll', 'lllcclll', '.llllll.', '.llllll.', '.ll..ll.'],  # a tarred oilskin with metal clasps
    'glassmail': ['cb....bc', 'bgbggbgb', '.ggbbgg.', '.gbggbg.', '.ggbbgg.', '..gbbg..', '..dddd..', '...dd...'],           # a cuirass of mirror-glass panes
    'stormcloak': ['..bbbb..', '.bkkkkb.', '.bbbbbb.', 'bbbbdbbb', 'bbbddbbb', 'bbbdbbbb', 'bbbbbbbb', 'bb.bb.bb'],          # a hooded cloak with a lightning bolt
    'brasscoat': ['cl....lc', 'llllllll', 'lldcdlll', 'llckclll', 'lldcdlll', 'llllllll', 'llllllll', 'lll..lll'],           # a frock coat with a big brass gear
    'ring': ['...dd...', '..dddd..', '...cc...', '.cc..cc.', 'c......c', 'c......c', '.c....c.', '..cccc..'],                # a band with a gem
    # ---- RotMG families (the tier only changes the colours)
    'sword': ['......cc', '.....ccb', '....ccb.', '.d.ccb..', '..dcb...', '..wd....', '.w..d...', 'w.......'],      # a blade with a gold guard
    'dagger': ['........', '......cc', '.....cb.', '....cb..', '..dcb...', '..wd....', '.w......', '........'],     # a short blade
    'bow': ['..wf....', '.w.f....', 'w..f....', 'w..fbbbc', 'w..f....', 'w..f....', '.w.f....', '..wf....'],         # a strung bow, an arrow nocked
    'staff': ['.....dd.', '....cddc', '.....cc.', '....w...', '...w....', '..w.....', '.w......', 'w.......'],       # a long staff with a gem
    'wand': ['......c.', '.....cdc', '......c.', '....w...', '...w....', '..w.....', '.w......', '........'],        # a short wand with a star tip
    'heavy': ['cbb..bbc', 'cbbbbbbc', '.bbccbb.', '.bbccbb.', '.bbccbb.', '..bccb..', '.aaddaa.', '..aaaa..'],     # a breastplate
    'leather': ['.bb..bb.', 'bcbkkbcb', 'bbbkkbbb', 'bbbdkbbb', 'bbbkkbbb', '.bbkkbb.', '.bbbbbb.', '.bb..bb.'],   # a laced jerkin
    'robe': ['..bffb..', '.bbffbb.', 'bbbffbbb', '.bbffbb.', '.bbffbb.', 'bbbffbbb', 'bbbffbbb', 'dddddddd'],      # a robe with a stole
    # ---- everything else
    'potion': ['...aa...', '...bb...', '..bddb..', '.bddddb.', 'bddddddb', 'bddddddb', 'bddddddb', '.bbbbbb.'],              # a round flask with a cork
    'hammer': ['cccccccc', 'cbbddbbc', 'aaaaaaaa', '...ww...', '...ww...', '...ww...', '...LL...', '...ww...'],              # a great forge hammer
    'psalter': ['abbbbbb.', 'abcccbbf', 'abcddcbf', 'abcddcbf', 'abcccbbf', 'abbbbbbf', 'aaaaaaaf', '.fffffff'],             # a book of hymns with a jewelled cover
    'starshard': ['...cc...', '...cc...', 'cccccccc', '.ccddcc.', '..cccc..', '.cc..cc.', 'cc....cc', '........'],           # a star
    'head': ['.bbbbbb.', 'bccbbbbb', 'bbdbbdbb', 'bbbbbbbb', 'bbbaabbb', 'bbkkkkbb', '.bbbbbb.', '..aaaa..'],                # a stone head with burning eyes
    'wick': ['...dd...', '..dddd..', '...dd...', '...kk...', '..ffff..', '..ffff..', '..ffff..', '.bbbbbb.'],                # a candle
    'godweapon': ['.cccc...', 'cbddbc..', '.cccc...', '...bw...', '....w...', '.....w..', '......w.', '.......w'],           # a judge's gavel
    'godability': ['.cccccc.', 'cbbbbbba', 'cbdbbdba', 'cbbddbba', 'cbbddbba', 'cbdbbdba', 'cbbbbbba', '.aaaaaa.'],          # a keycap marked X
    'godarmor': ['cbb..bbc', 'cbbbbbbc', '.bddddb.', '.bdccdb.', '.bddddb.', '..bccb..', '.aaddaa.', '..aaaa..'],
    'godring': ['..dddd..', '.dddddd.', '...cc...', '.cc..cc.', 'c......c', 'c......c', '.c....c.', '..cccc..'],
    'backpack': ['..LLLL..', '.L....L.', 'llllllll', 'lLLLLLLl', 'lllccl ll'.replace(' ', ''), 'llllllll', 'llllllll', '.llllll.'],   # a satchel with a buckle
    'duckicon': ['...ccc..', '..ccckc.', '..ccccdd', '...ccc..', 'c.ccccc.', 'cccccccc', '.bbbbbbb', '..bbbbb.'],            # a rubber duck
    'booticon': ['.bbbb...', '.bkbb...', '.bbbb...', '.bkbb...', '.bbbbb..', '.bbbbbbb', 'bbbbbbbb', 'aaaaaaaa'],            # an old boot
    'fishicon': ['........', '...bbbb.', 'b.bccckb', 'bbcccccc', 'bbcccccb', 'b.bbbbb.', '........', '........'],            # a fish
    'boxicon': ['..d..d..', '...dd...', 'bbbddbbb', 'bbbddbbb', 'dddddddd', 'bbbddbbb', 'bbbddbbb', 'aaaddaaa'],             # a gift box with a ribbon
}


# light comes from the top-left: each material steps one tone lighter on edges facing it, one darker on edges facing away
LIGHTER = {'a': 'b', 'b': 'c', 'c': 'h', 'w': 'W', 'l': 'L', 'F': 'f', 'G': 'g', 'g': 'h'}
DARKER = {'h': 'c', 'c': 'b', 'b': 'a', 'W': 'w', 'L': 'l', 'f': 'F', 'g': 'G'}


def shade(big):
    """Shading at double resolution: the 8x8 silhouette keeps its chunky blocks, but every block gets a
    one-pixel rim light or shadow along the edges of its region, and gems get a glint."""
    H, W = len(big), len(big[0])
    g = [list(r) for r in big]
    at = lambda x, y: big[y][x] if 0 <= x < W and 0 <= y < H else '.'
    edge = lambda ch, x, y: at(x, y) in '.o' or (at(x, y) != ch and at(x, y) in 'kq')
    for y in range(H):
        for x in range(W):
            ch = big[y][x]
            if ch in '.o':
                continue
            if ch == 'd':
                if at(x, y - 1) != 'd' and at(x - 1, y) != 'd':
                    g[y][x] = 'h'                                   # a glint on every gem
                continue
            if (edge(ch, x, y - 1) or edge(ch, x - 1, y)) and ch in LIGHTER:
                g[y][x] = LIGHTER[ch]
            elif (edge(ch, x, y + 1) or edge(ch, x + 1, y) or edge(ch, x, y + 2) or edge(ch, x + 2, y)) and ch in DARKER:
                g[y][x] = DARKER[ch]                                # a two-pixel shadow side gives the form its weight
            elif ch == 'b' and (x + y) % 4 == 0 and at(x + 1, y + 1) == 'b' and at(x - 1, y - 1) == 'b':
                g[y][x] = 'c' if y < H // 2 else 'a'               # a little texture in big flat metal
    return [''.join(r) for r in g]


def icon(typ):
    """the 8x8 art, each pixel doubled to fill a 16x16 cell, then shaded at that resolution. No outline or
    shadow is baked in beyond the art's own: the game strips the outer outline and draws a crisp one (render.js icon())."""
    g = ART[typ]
    assert len(g) == 8 and all(len(r) == 8 for r in g), typ
    big = []
    for r in g:
        row = ''.join(ch * 2 for ch in r)
        big += [row, row]
    return shade(big)


GEN = {t: (lambda typ: (lambda form: icon(typ)))(t) for t in ART}
