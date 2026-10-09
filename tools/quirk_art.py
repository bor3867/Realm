"""Quests, quirks and the people of the realm: the nexus cat, the quest board, the fishing dock,
lore stones, trial altars, dig spots, and four wanderers. Plus icons for the odd items.

QUIRKS: name -> [(grid, palette), ...] (2 entries = animated)
"""
from drawkit import Cv
from town_art import PAL


def cat(f):
    """the nexus cat, asleep in a loaf by the fire (it breathes)"""
    p2 = dict(PAL, a='#3A2E3A', A='#6A5A6A', z='#E8A0B8', q='#F2C14E')
    c = Cv()
    c.ell(7.5, 12 - f * 0.3, 4.6, 2.6 + f * 0.3, 'A'); c.ell(6.5, 11, 2.6, 1.2, 'a', only='A')
    c.ell(4, 10.5, 2, 1.8, 'A'); c.p(3, 9, 'A'); c.p(5, 9, 'A'); c.p(3, 8, 'a'); c.p(5, 8, 'a')
    c.p(3, 10, 'k'); c.p(5, 10, 'k')
    c.p(4, 11, 'z')
    c.ln(11, 13, 13, 11, 'a'); c.p(13, 10, 'A')
    return c.done(late=[(9 + f, 6 - f, 'q')] if f else [(8, 7, 'q')]), p2


def board():
    c = Cv()
    c.rect(3, 9, 3, 15, 'w'); c.rect(12, 9, 12, 15, 'w')
    c.rect(1, 1, 14, 10, 'W'); c.rect(1, 1, 14, 1, 'v'); c.rect(1, 10, 14, 10, 'w')
    for x0, y0, ch in ((2, 2, 'P'), (6, 3, 'e'), (10, 2, 'P'), (3, 6, 'e'), (8, 6, 'P')):
        c.rect(x0, y0, x0 + 3, y0 + 2, ch); c.p(x0 + 1, y0, 'x')
    c.rect(1, 0, 14, 0, 'r')
    return c.done()


def fishspot():
    c = Cv()
    c.rect(0, 8, 11, 11, 'W'); c.rect(0, 8, 11, 8, 'v')
    for x in (1, 5, 9):
        c.rect(x, 12, x, 15, 'w')
    c.ln(10, 7, 15, 1, 'w'); c.ln(15, 1, 15, 9, 'e'); c.p(15, 10, 'x')
    c.rect(2, 6, 4, 7, 'h'); c.p(3, 5, 'H')
    return c.done()


def lorestone(f):
    c = Cv()
    c.trap(1, 14, 6, 9, 4, 11, 'S'); c.rect(4, 3, 4, 14, 'T'); c.rect(10, 4, 11, 14, 's')
    for k, y in enumerate(range(4, 13, 2)):
        c.rect(6, y, 9 - (k % 2), y, 'Y' if f else 'y')
    c.rect(3, 15, 12, 15, 's')
    return c.done()


def altar(f, glow):
    p2 = dict(PAL, q=glow)
    c = Cv()
    c.rect(2, 9, 13, 14, 'S'); c.rect(2, 9, 13, 9, 'T'); c.rect(13, 10, 13, 14, 's'); c.rect(1, 15, 14, 15, 's')
    c.rect(5, 4, 10, 8, 's'); c.rect(5, 4, 10, 4, 'S')
    c.ell(7.5, 2.5, 1.6, 1.8, 'q'); c.p(7, 2, 'W' if f else 'q')
    for x in (3, 12):
        c.rect(x, 6, x, 8, 'k'); c.p(x, 5, 'q' if f else 'y')
    c.rect(6, 11, 9, 12, 'k'); c.p(7, 11, 'q')
    return c.done(late=[(7, 0, 'W'), (2, 3, 'q'), (13, 3, 'q')] if f else []), p2


def digspot(open_=False):
    c = Cv()
    if open_:
        c.ell(7.5, 11, 4, 2.4, 'd'); c.ell(7.5, 11.5, 2.6, 1.4, 'k')
        for x, y in ((2, 10), (3, 9), (12, 9), (13, 11), (11, 13)):
            c.p(x, y, 'W')
    else:
        c.ln(4, 8, 11, 13, 'x'); c.ln(4, 13, 11, 8, 'x'); c.ln(5, 8, 12, 13, 'R'); c.ln(5, 13, 12, 8, 'R')
    return c.done()


def wanderer(kind, f):
    """a lost pilgrim, a bog hermit, a half-frozen scholar, a laughing madman in gold"""
    P2 = {'pilgrim': dict(PAL, a='#2B6E6A', A='#5FB3A1', s='#E8DCC0', h='#C8B890'),
          'hermit': dict(PAL, a='#3A2A2E', A='#6A5A6A', s='#A8C850', h='#8DB03A'),
          'scholar': dict(PAL, a='#3A57A8', A='#8AC8FF', s='#F0D8C0', h='#E8F6FF'),
          'penitent': dict(PAL, a='#8A5A12', A='#E3B95A', s='#F0D8C0', h='#FFEB8F')}[kind]
    c = Cv()
    by = -f
    c.trap(7 + by, 14, 6, 9, 4, 11, 'a'); c.rect(5, 8 + by, 5, 14, 'A')
    c.ell(7.5, 4.5 + by, 2.4, 2.4, 's'); c.p(6, 4 + by, 'k'); c.p(9, 4 + by, 'k')
    if kind == 'pilgrim':
        c.trap(1 + by, 3 + by, 7, 8, 4, 11, 'h'); c.ln(12, 3, 12, 15, 'w'); c.ell(12, 2, 1.4, 1.4, 'p')
        c.p(7, 6 + by, 'P')
    elif kind == 'hermit':
        c.ell(7.5, 3 + by, 3, 2, 'a'); c.p(9, 5 + by, 'x')
        c.ell(12, 13, 2.4, 1.8, 'k'); c.p(11, 11, 'G'); c.p(13, 12, 'K')
    elif kind == 'scholar':
        c.rect(2, 11, 13, 15, 'h'); c.rect(2, 11, 13, 11, 'W')
        c.rect(10, 6 + by, 13, 9 + by, 'W'); c.rect(11, 7 + by, 12, 7 + by, 'k')
        c.rect(5, 2 + by, 10, 2 + by, 'A')
    else:
        c.rect(6, 1 + by, 9, 2 + by, 'h'); c.p(6, 0 + by, 'h'); c.p(9, 0 + by, 'h')
        c.rect(6, 6 + by, 9, 6 + by, 'k'); c.p(6, 6 + by, 'W'); c.p(9, 6 + by, 'W')
        c.ln(11, 8, 13, 5 - f, 'h')
    return c.done(), P2


QUIRKS = {
    'cat': [cat(0), cat(1)],
    'board': [(board(), PAL)], 'fishspot': [(fishspot(), PAL)],
    'lorestone': [(lorestone(0), PAL), (lorestone(1), PAL)],
    'digspot': [(digspot(), PAL)], 'digspot_open': [(digspot(True), PAL)],
    'npc_ossic': [wanderer('pilgrim', 0), wanderer('pilgrim', 1)], 'npc_fennick': [wanderer('hermit', 0), wanderer('hermit', 1)],
    'npc_ingrit': [wanderer('scholar', 0), wanderer('scholar', 1)], 'npc_laughing': [wanderer('penitent', 0), wanderer('penitent', 1)],
}
for _b, _g in {'shore': '#3BC8E8', 'fen': '#8DB03A', 'runeholt': '#B888FF', 'godfall': '#F2641A'}.items():
    QUIRKS['altar_' + _b] = [altar(0, _g), altar(1, _g)]


# ---------------------------------------------------------------- icons for the odd items (16x16, icon palette letters)
def _icon(draw):
    import icons
    c = icons.blank(16, 16)
    late = draw(c, icons.P, icons.disc) or []
    return icons.done(c, late)


def duckicon(form):
    def d(c, P, disc):
        disc(c, 8, 10, 5, 'c'); disc(c, 7, 9, 2.6, 'h'); disc(c, 5, 5, 3, 'c'); P(c, 4, 4, 'h'); P(c, 5, 4, 'k')
        for x in range(0, 3):
            P(c, x, 6, 'd')
        P(c, 13, 7, 'c'); P(c, 14, 6, 'c')
        return [(14, 2, 'h')]
    return _icon(d)


def booticon(form):
    def d(c, P, disc):
        for y in range(2, 11):
            for x in range(5, 10):
                P(c, x, y, 'b' if x < 7 else 'a')
        for y in range(10, 14):
            for x in range(3, 14):
                P(c, x, y, 'b' if y < 12 else 'a')
        P(c, 13, 11, 'c'); P(c, 6, 4, 'c'); P(c, 8, 6, 'c')
        P(c, 10, 3, 'd'); P(c, 11, 2, 'd'); P(c, 4, 9, 'd')
    return _icon(d)


def fishicon(form):
    def d(c, P, disc):
        for y in range(5, 12):
            w = 6 - abs(y - 8)
            for x in range(7 - w, 8 + w):
                P(c, x, y, 'c' if y < 8 else 'b')
        for y in range(5, 12):
            P(c, 13 + abs(y - 8) // 2, y, 'b')
        P(c, 4, 7, 'k'); P(c, 6, 6, 'h'); P(c, 9, 7, 'a'); P(c, 8, 10, 'a')
        return [(2, 3, 'd'), (3, 1, 'd')]
    return _icon(d)


def boxicon(form):
    def d(c, P, disc):
        for y in range(5, 14):
            for x in range(3, 13):
                P(c, x, y, 'b' if x < 8 else 'a')
        for x in range(3, 13):
            P(c, x, 5, 'c'); P(c, x, 9, 'd')
        for y in range(5, 14):
            P(c, 7, y, 'd')
        P(c, 6, 2, 'd'); P(c, 7, 3, 'd'); P(c, 8, 2, 'd'); P(c, 9, 3, 'd')
        return [(13, 2, 'h'), (2, 3, 'h'), (7, 0, 'h')]
    return _icon(d)


ICON_GEN = {'duckicon': duckicon, 'booticon': booticon, 'fishicon': fishicon, 'boxicon': boxicon}


# ---------------------------------------------------------------- the last pass: scriptorium shelves, ruins, a fallen star,
# villagers who stroll the nexus, a bard by the fire, a fortune teller's tent, and pedestals for trophies
def bookshelf():
    c = Cv()
    c.rect(1, 1, 14, 15, 'w'); c.rect(1, 1, 14, 1, 'v'); c.rect(1, 1, 1, 15, 'W')
    cols = 'xmbcnGe'
    for k, y0 in enumerate((2, 7, 12)):
        c.rect(2, y0 + 3, 13, y0 + 3, 'W')
        for x in range(2, 14):
            c.rect(x, y0 + (x + k) % 2, x, y0 + 2, cols[(x * 3 + k) % len(cols)])
    c.p(4, 0, 'P'); c.p(11, 0, 'P')                                      # rime on top
    return c.done()


def ruin_wall(v):
    c = Cv()
    tops = [(2, 6, 10, 13), (5, 3, 8, 12)][v]
    for k, x0 in enumerate(range(0, 16, 4)):
        top = tops[k % 4]
        c.rect(x0, top, x0 + 3, 15, 'S' if k % 2 else 's'); c.rect(x0, top, x0 + 3, top, 'T')
        for y in range(top + 2, 15, 3):
            c.rect(x0, y, x0 + 3, y, 's'); c.p(x0 + (y % 2) * 2, y - 1, 'T')
    c.p(3, 9, 'g'); c.p(4, 10, 'G'); c.p(11, 13, 'g'); c.p(12, 12, 'L')  # moss and ivy
    return c.done()


def star_crater(f):
    p2 = dict(PAL, q='#8AF6FF', Q='#FFFFFF', z='#3BC8E8')
    c = Cv()
    c.ell(7.5, 12, 7, 3.4, 'd'); c.ell(7.5, 11.5, 5, 2.2, 'k')
    for x, y in ((1, 11), (14, 12), (3, 14), (12, 14)):
        c.p(x, y, 'T')                                                   # thrown rock
    c.trap(4, 11, 7, 8, 5, 10, 'z'); c.trap(4, 11, 7, 7, 6, 8, 'q'); c.p(7, 4, 'Q')   # the star, still burning
    return c.done(late=[(7, 1, 'Q'), (3, 5, 'q'), (12, 4, 'q')] if f else [(7, 2, 'q')]), p2


def villager(kind, f):
    pal = {'farmer': dict(PAL, a='#5A6A2A', A='#8DB03A', s='#F0D0A8', h='#C8A050'),
           'child': dict(PAL, a='#8A2A4A', A='#E85A8A', s='#F0D0A8', h='#6A3A1A'),
           'guard': dict(PAL, a='#4F4B60', A='#8E8AA6', s='#E8C8A0', h='#2A2632')}[kind]
    c = Cv()
    by = -1 if f == 1 else 0
    small = kind == 'child'
    top = 6 if small else 2
    c.rect(6, top + 4 + by, 9, 12 if not small else 12, 'a'); c.rect(6, top + 4 + by, 6, 12, 'A')
    c.ell(7.5, top + 2 + by, 2.2, 2.2, 's'); c.p(6, top + 2 + by, 'k'); c.p(9, top + 2 + by, 'k')
    c.rect(6, 13, 6 + f, 15, 'h'); c.rect(9, 13, 9 - f, 15, 'h')        # legs mid-stride
    if kind == 'farmer':
        c.trap(top - 1 + by, top + by, 7, 8, 4, 11, 'h'); c.ln(11, top + 3, 13, 15, 'w'); c.p(13, top + 2, 'W')   # straw hat, pitchfork
    elif kind == 'child':
        c.p(5, top + by, 'h'); c.p(10, top + by, 'h'); c.rect(10, 9, 12, 10, 'e'); c.p(13, 8, 'x')                # pigtails, a paper kite string
    else:
        c.rect(6, top - 1 + by, 9, top + by, 'h'); c.ln(11, top, 11, 14, 'k'); c.p(11, top - 1, 'T')               # helm, spear
    return c.done(), pal


def bard(f):
    p2 = dict(PAL, a='#3A2A6A', A='#7A4AC8', s='#F0D0A8')
    c = Cv()
    c.ell(7.5, 12, 4, 2.6, 'a'); c.rect(5, 6, 10, 11, 'A'); c.rect(5, 6, 5, 11, 'a')
    c.ell(7.5, 4, 2.2, 2.2, 's'); c.p(7, 4, 'k'); c.p(9, 4, 'k'); c.rect(5, 1, 10, 2, 'x'); c.p(11, 1, 'y')   # feathered cap
    c.ell(10, 9, 2.4, 1.8, 'W'); c.p(10, 9, 'k'); c.ln(11, 8, 14, 5 - f, 'w')  # lute, neck
    c.p(8 + f, 8, 's')                                                   # strumming hand
    return c.done(late=[(3 + f * 9, 1 + f, 'y'), (13 - f * 8, 3, 'y')]), p2  # music notes


def pedestal():
    c = Cv()
    c.rect(3, 9, 12, 15, 'S'); c.rect(3, 9, 12, 9, 'T'); c.rect(12, 10, 12, 15, 's'); c.rect(2, 15, 13, 15, 's')
    c.rect(5, 12, 10, 12, 'H'); c.p(7, 11, 'Y')                          # a gold plaque
    return c.done()


QUIRKS.update({
    'bookshelf': [(bookshelf(), PAL)], 'ruin_wall': [(ruin_wall(0), PAL)], 'ruin_wall2': [(ruin_wall(1), PAL)],
    'star_crater': [star_crater(0), star_crater(1)],
    'villager_farmer': [villager('farmer', 0), villager('farmer', 1)], 'villager_child': [villager('child', 0), villager('child', 1)],
    'villager_guard': [villager('guard', 0), villager('guard', 1)],
    'bard': [bard(0), bard(1)], 'pedestal': [(pedestal(), PAL)],
})


def tent():
    """the fortune teller's tent: striped canvas, a star on the flap, lantern light spilling out"""
    c = Cv(32, 32)
    c.trap(3, 30, 15, 16, 2, 29, 'b'); c.rect(15, 1, 16, 2, 'H'); c.p(15, 0, 'Y')
    for x in range(2, 30):
        for y in range(4, 31):
            if c.get(x, y) == 'b' and (x // 3) % 2:
                c.p(x, y, 'm')
    c.trap(14, 30, 15, 16, 10, 21, 'd'); c.trap(18, 30, 15, 16, 12, 19, 'y')   # the flap open, lamplight inside
    c.p(15, 22, 'Y'); c.p(16, 21, 'X')
    for x, y in ((8, 9), (24, 11), (6, 20), (25, 22)):
        c.p(x, y, 'n')                                                   # painted stars
    c.ln(3, 30, 0, 31, 'w'); c.ln(28, 30, 31, 31, 'w')
    return c.done()


BIG = {'tent': tent()}
