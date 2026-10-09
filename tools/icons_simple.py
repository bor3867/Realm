"""Simple, bold item icons: one clear silhouette per item type, the tier shown only by colour.

Weapons point up-right on the diagonal; abilities are compact centred emblems; armour is a torso.
Letters (as icons.py): a/b/c tier metal dark/mid/light, d tier gem/glow, w/W wood, l/L leather, f/F cloth, k dark.
"""
from icons import blank, P, disc, ring, done


def thick(c, x0, y0, x1, y1, ch, w=2):
    """a 2px line (the second pass is offset down-right, so diagonals stay solid)"""
    from pixlib import line
    line(c, x0, y0, x1, y1, ch)
    if w > 1:
        line(c, x0 + 1, y0, x1 + 1, y1, ch)


def grid(rows):
    c = blank(16, 16)
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch != '.':
                c[y][x] = ch
    return c


# ---------------------------------------------------------------- weapons
def gauntlet(form):            # a clenched fist: four finger knuckles, a thumb across them, a cuff
    return done(grid([
        '................', '................', '....bb.bb.bb....', '...bcbbcbbcbb...', '...bbabbabbabb..',
        '...bbabbabbabb..', '..bbbbbbbbbbbb..', '..bccccccbbbba..', '..bbbbbbbbbbba..', '...bbbbbbbbbaa..',
        '....dddddddddd..', '....LlLlLlLlLl..', '....LlLlLlLlLl..', '................', '................', '................']))


def tongs(form):
    c = blank(16, 16)
    thick(c, 3, 13, 11, 4, 'b'); thick(c, 3, 4, 11, 13, 'c')          # two arms crossing
    for x, y in ((11, 2), (12, 2), (11, 3), (12, 3), (13, 3)):
        P(c, x, y, 'd')                                               # the glowing billet in the jaws
    P(c, 7, 8, 'k'); P(c, 2, 14, 'W'); P(c, 3, 14, 'W'); P(c, 2, 3, 'W'); P(c, 3, 3, 'W')
    return done(c)


def sunrod(form):
    c = blank(16, 16)
    thick(c, 2, 14, 8, 8, 'W')
    disc(c, 10.5, 5.5, 3.6, 'c'); disc(c, 10.5, 5.5, 2, 'd'); P(c, 9, 4, 'h')
    return done(c)


def lantern(form):
    return done(grid([
        '................', '.......bb.......', '......b..b......', '.....bbbbbb.....', '....bddddddb....',
        '....bdhdddbb....', '....bddddddb....', '....bddddddb....', '....bddddddb....', '....bddddddb....',
        '.....bbbbbb.....', '......bbbb......', '................', '................', '................', '................']))


def harpoon(form):
    c = blank(16, 16)
    thick(c, 1, 14, 9, 6, 'W')
    for x, y in ((14, 1), (13, 1), (12, 1), (13, 2), (12, 2), (11, 2), (12, 3), (11, 3), (10, 3), (11, 4), (10, 4), (13, 3), (14, 2)):
        P(c, x, y, 'c')                                               # a big triangular head
    P(c, 9, 4, 'b'); P(c, 14, 5, 'b'); P(c, 13, 5, 'b')               # one barb
    return done(c)


def rapier(form):
    c = blank(16, 16)
    thick(c, 6, 9, 14, 1, 'c')                                        # a long thin blade
    disc(c, 5, 10, 2.3, 'd')                                          # a big round cup hilt
    thick(c, 2, 13, 4, 11, 'l')
    return done(c)


def coil(form):
    return done(grid([
        '................', '........dddd....', '.......dddd.....', '......dddd......', '.....dddd.......',
        '....ddddddddd...', '.......dddd.....', '......dddd......', '.....dddd.......', '....ddd.........',
        '...dd...........', '................', '................', '................', '................', '................']))


def pendulum(form):
    c = blank(16, 16)
    disc(c, 8, 2, 1.5, 'b')
    thick(c, 7, 3, 7, 9, 'k')
    disc(c, 8, 11.5, 3.5, 'c'); disc(c, 7.5, 11, 1.6, 'h')
    return done(c)


# ---------------------------------------------------------------- abilities (compact emblems)
def bellows(form):
    return done(grid([
        '................', '................', '..WWWWWWW.......', '..WbWbWbWWW.....', '..WWWWWWWWWccc..',
        '..LlLlLlLlLcccc.', '..lLlLlLlLlccc..', '..WWWWWWWWW.....', '..WbWbWbWW......', '..WWWWWWW.......',
        '................', '................', '................', '................', '................', '................']))


def seal(form):
    return done(grid([
        '................', '................', '................', '.cccccccccccc...', 'bbbbbbbbbbbbbb..',
        '..bbbbbbbbbbb...', '....bbbbbbbb....', '......bbbb......', '......bbbb......', '.....bbbbbb.....',
        '....bbbbbbbb....', '...aaaaaaaaaa...', '................', '................', '................', '................']))


def halo(form):
    c = blank(16, 16)
    ring(c, 8, 8, 4.6, 'c', 2.2)
    for x, y in ((8, 0), (8, 1), (8, 15), (8, 14), (0, 8), (1, 8), (15, 8), (14, 8)):
        P(c, x, y, 'd')
    return done(c)


def reliquary(form):
    return done(grid([
        '................', '.....ffffff.....', '....ffffffff....', '...ffffffffff...', '...ffffkfffff...',
        '...fffkkkffff...', '...ffffkfffff...', '...ffffkfffff...', '....ffffffff....', '....ffffffff....',
        '.....bbbbbb.....', '.....bbbbbb.....', '................', '................', '................', '................']))


def hookline(form):
    return done(grid([
        '................', '......LLLL......', '.....LlLLlL.....', '......LLLL......', '.......cc.......',
        '.......cc.......', '.......cc.......', '.......cc.......', '.......cc...c...', '.......cc..cc...',
        '.......ccc.cc...', '........cccc....', '.........cc.....', '................', '................', '................']))


def mirror(form):
    c = blank(16, 16)
    disc(c, 8, 6, 5, 'b'); disc(c, 8, 6, 3.6, 'f'); disc(c, 9, 7, 2.2, 'F')
    P(c, 6, 4, 'h'); P(c, 7, 4, 'h')
    thick(c, 7, 11, 7, 15, 'b')
    return done(c)


def kite(form):
    return done(grid([
        '.......cc.......', '......cccc......', '.....cccccc.....', '....ccccbbbb....', '...cccccbbbbb...',
        '....ccccbbbb....', '.....ccbbbb.....', '......cbbb......', '.......bb.......', '........d.......',
        '.......d........', '........d.......', '.......d........', '................', '................', '................']))


def stopwatch(form):
    c = blank(16, 16)
    disc(c, 8, 9, 5.4, 'b'); disc(c, 8, 9, 4, 'f')
    thick(c, 7, 9, 7, 6, 'k', 1); thick(c, 8, 9, 10, 9, 'k', 1)
    for x, y in ((7, 1), (8, 1), (9, 1), (8, 2), (8, 3)):
        P(c, x, y, 'c')
    return done(c)


# ---------------------------------------------------------------- armour (torsos; material + one feature tells them apart)
def plate(form):            # heavy metal breastplate with round pauldrons
    return done(grid([
        '................', '................', '..ccc......ccc..', '.cbbbcccccbbbbc.', '.cbbbbbbbbbbbbc.',
        '..bbbbbbbbbbbb..', '...bbbbcbbbbb...', '...bbbbcbbbbb...', '...bbbbcbbbbb...', '....bbbcbbbb....',
        '....aaaaaaaa....', '.....bbbbbb.....', '................', '................', '................', '................']))


def coat(form):             # long coat with a white fur collar
    return done(grid([
        '................', '...ffffffffff...', '..ffffffffffff..', '..bbbbbkkbbbbb..', '..bbbbbkkbbbbb..',
        '..bbbbbkkbbbbb..', '..LLLLLLLLLLLL..', '..bbbbbkkbbbbb..', '.bbbbbbkkbbbbbb.', '.bbbbbbkkbbbbbb.',
        '.bbbbbbkkbbbbbb.', '.aaaaaakkaaaaaa.', '................', '................', '................', '................']))


def vestment(form):         # a flowing robe with a pale stole down the front
    return done(grid([
        '................', '......bbbb......', '.....bbbbbb.....', '....bbbffbbb....', '...bbbbffbbbb...',
        '...bbbbffbbbb...', '..bbbbbffbbbbb..', '..bbbbbffbbbbb..', '.bbbbbbffbbbbbb.', '.bbbbbbffbbbbbb.',
        'bbbbbbbffbbbbbbb', 'dddddddddddddddd', '................', '................', '................', '................']))


def shroud(form):           # a tall pointed hood over a drape
    return done(grid([
        '.......b........', '......bbb.......', '.....bbbbb......', '.....bkkkb......', '....bkkkkkb.....',
        '....bbkkkbb.....', '...bbbbbbbbb....', '...bbbbbbbbb....', '..bbbbbbbbbbb...', '..bbbbbbbbbbb...',
        '.bbbbbbbbbbbbb..', '.b.b.b.b.b.b.b..', '................', '................', '................', '................']))


def oilskin(form):          # a long tarred coat, arms out, a tier-metal collar and buttons
    return done(grid([
        '................', '.....cccccc.....', '...llcllllckll..', '.lllllllllkklll.', '.lll.lllllkk.lll',
        '.ll..lllclkk..ll', '.ll..lllllkk..ll', '.LL..lllclkk..kk', '.....lllllkk....', '.....lllclkk....',
        '.....lllllkk....', '.....aaaaaaa....', '................', '................', '................', '................']))


def glassmail(form):        # a slim cuirass of mirror-glass diamonds
    return done(grid([
        '................', '................', '....kkkkkkkk....', '...cfcfcfcfcf...', '...fcfcfcfcfc...',
        '...cfcfcfcfcf...', '....fcfcfcfc....', '....cfcfcfcf....', '....fcfcfcfc....', '.....cfcfcf.....',
        '.....dddddd.....', '................', '................', '................', '................', '................']))


def stormcloak(form):       # a hooded cape with a lightning bolt
    return done(grid([
        '................', '.....bbbbbb.....', '....bbkkkkbb....', '....bkkkkkkb....', '...bbbbbbbbbb...',
        '...bbbbbddbbb...', '..bbbbbddbbbbb..', '..bbbbddddbbbb..', '..bbbbbbddbbbb..', '.bbbbbbbdbbbbbb.',
        '.bbbbbbbbbbbbbb.', '.aaaaaaaaaaaaaa.', '................', '................', '................', '................']))


def brasscoat(form):        # a frock-coat with a big brass gear on the chest
    return done(grid([
        '................', '...cc......cc...', '..cbbllllllbbc..', '..llllllllllll..', '..lllldcdllllll.',
        '..llldcccdlllll.', '..lllcckccllllll', '..llldcccdlllll.', '..lllldcdllllll.', '..llllllllllll..',
        '..llllllllllll..', '..kkkkkkkkkkkk..', '................', '................', '................', '................']))


def ring_icon(form):
    c = blank(16, 16)
    ring(c, 8, 10, 4.2, 'c', 1.8)
    disc(c, 8, 5, 2.2, 'd'); P(c, 7, 4, 'h')
    return done(c)


GEN = {'gauntlet': gauntlet, 'tongs': tongs, 'sunrod': sunrod, 'lantern': lantern, 'harpoon': harpoon, 'rapier': rapier,
       'coil': coil, 'pendulum': pendulum, 'bellows': bellows, 'seal': seal, 'halo': halo, 'reliquary': reliquary,
       'hookline': hookline, 'mirror': mirror, 'kite': kite, 'stopwatch': stopwatch, 'plate': plate, 'coat': coat,
       'vestment': vestment, 'shroud': shroud, 'oilskin': oilskin, 'glassmail': glassmail, 'stormcloak': stormcloak,
       'brasscoat': brasscoat, 'ring': ring_icon}
