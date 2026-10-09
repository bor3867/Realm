"""Dungeon bestiary: monsters that live ONLY below ground, one roster per dungeon.

The Sunken Chapel     drowned_acolyte, barnacle_knight, bell_wraith, pew_mimic (+ bell_totem, the Abbot's shield)
The Drowned Forge     slag_imp, anvil_golem, quench_wraith
The Heart of Godfall  vein_crawler, gilded_cardinal, reliquary_maw, blood_seraph
The Frozen Scriptorium ink_wisp, frost_librarian, living_tome, ice_scribe

Row format as bestiary.py: M0 M1 | T0 | A0 | D0 D1 D2.
"""
from drawkit import Cv
from bestiary import register
from bestiary2 import death3


def row(name, pal, f, biome, dead_rc=None):
    """f(k) draws frame k: 0,1 move  2 tell  3 attack"""
    register(name, pal, [f(0), f(1), f(2), f(3)] + death3(f(0), dead_rc), biome=biome)


# ================================================================ THE SUNKEN CHAPEL
AC = {'o': '#0A1416', 't': '#1E5A5A', 'T': '#3F8F8A', 'U': '#8ACFC4', 'p': '#D8E8E0', 'y': '#FFE45C', 'Y': '#FFF6C8', 'w': '#4A3424', 'k': '#081014'}


def acolyte(k):
    c = Cv(); by = -1 if k == 1 else 0
    c.trap(5 + by, 15, 6, 9, 4, 11, 'T'); c.rect(4, 7 + by, 4, 15, 'U'); c.rect(9, 8 + by, 11, 15, 't')
    c.ell(7.5, 3.5 + by, 2.6, 2.6, 'T'); c.rect(6, 3 + by, 9, 5 + by, 'k'); c.rect(7, 4 + by, 8, 5 + by, 'p')   # deep hood, drowned face
    c.p(7, 4 + by, 'k'); c.p(8, 4 + by, 'k')                                # eyes closed
    for x in (5, 8, 10):
        c.p(x, 15, 'U' if (x + k) % 2 else 't')                             # dripping hem
    lx = 13 if k != 3 else 12
    c.ln(11, 7 + by, lx, 2 + by, 'w'); c.rect(lx - 1, 3 + by, lx + 1, 5 + by, 'y' if k >= 2 else 'Y'); c.p(lx, 4 + by, 'Y')   # a lantern on a hook
    return c.done(late=[(lx, 1, 'Y'), (lx + 2, 4, 'y')] if k >= 2 else [])


row('drowned_acolyte', AC, acolyte, 'chapel')

BK = {'o': '#0A1214', 's': '#4E6670', 'S': '#8AA4AE', 'T': '#C8D8DC', 'b': '#C8C0B0', 'B': '#8A8070', 'p': '#FF8FBF', 'k': '#141018', 'g': '#2B6E6A'}


def barnacle_knight(k):
    c = Cv(); st = k % 2
    c.rect(6, 4, 10, 11, 's'); c.rect(6, 4, 6, 11, 'S')
    c.rect(6, 1, 10, 4, 'S'); c.rect(7, 2, 9, 2, 'k')                       # helm, visor
    for x, y in ((7, 6), (9, 8), (6, 10), (10, 5), (8, 3)):
        c.p(x, y, 'b'); c.p(x + 1, y, 'B')                                   # barnacles
    c.rect(6 + st, 12, 7 + st, 15, 's'); c.rect(9 - st, 12, 10 - st, 15, 's')
    if k == 3:                                                               # shell lowered, pearl spear thrust
        c.ell(3, 12, 2, 2.5, 'b'); c.ln(11, 7, 15, 7, 'T'); c.p(15, 6, 'p')
    else:
        c.ell(3.5, 7.5, 3, 4.2, 'b'); c.ell(3, 7, 2, 3, 'B', only='b')       # the clam-shell shield
        for y in (5, 7, 9):
            c.p(2, y, 'T')
        c.p(4, 7, 'p' if k == 2 else 'g')
        c.ln(12, 3, 12, 13, 'T')
    return c.done()


row('barnacle_knight', BK, barnacle_knight, 'chapel')

BW = {'o': '#140C04', 'a': '#6E4A14', 'B': '#C8962A', 'Y': '#FFE08A', 'g': '#5EF0C8', 'G': '#E0FFF6', 'k': '#0A0A0E', 'i': '#4F4B60'}


def bell_wraith(k):
    c = Cv(); by = [0, -1, -1, 0][k]
    c.trap(3 + by, 10 + by, 6, 9, 3, 12, 'B'); c.rect(3, 3 + by, 3, 10 + by, 'Y'); c.rect(11, 5 + by, 12, 10 + by, 'a')
    c.rect(2, 11 + by, 13, 11 + by, 'a'); c.rect(6, 2 + by, 9, 2 + by, 'a'); c.p(7, 1 + by, 'i'); c.p(8, 0 + by, 'i')
    c.rect(5, 6 + by, 10, 9 + by, 'k')                                       # a hollow mouth...
    c.p(6, 7 + by, 'g'); c.p(9, 7 + by, 'g'); c.rect(7, 9 + by, 8, 9 + by, 'G' if k >= 2 else 'g')   # ...with a ghost inside
    c.ln(5, 12 + by, 4, 15, 'g'); c.ln(10, 12 + by, 11, 15, 'g'); c.p(7, 13 + by, 'G')                # ghost tail beneath
    return c.done(late=[(1, 4, 'Y'), (14, 3, 'Y'), (0, 8, 'Y')] if k == 3 else [])


row('bell_wraith', BW, bell_wraith, 'chapel')

PM = {'o': '#140A06', 'w': '#4A3020', 'W': '#7A5232', 'v': '#B07A44', 'r': '#6A1A1E', 'R': '#C83444', 'e': '#F0E6D0', 'y': '#FFE45C'}


def pew_mimic(k):
    c = Cv(); by = -2 if k == 1 else 0
    c.rect(1, 6 + by, 14, 7 + by, 'W'); c.rect(1, 6 + by, 14, 6 + by, 'v')  # backrest
    c.rect(1, 2 + by, 2, 7 + by, 'W'); c.rect(13, 2 + by, 14, 7 + by, 'W'); c.p(1, 1 + by, 'v'); c.p(14, 1 + by, 'v')
    c.rect(1, 9 + by, 14, 11 + by, 'W'); c.rect(1, 9 + by, 14, 9 + by, 'v')    # seat - which is a JAW
    gape = 2 if k >= 2 else 1
    c.rect(2, 8 + by - (gape - 1), 13, 8 + by, 'r'); c.p(4, 8 + by, 'R')
    for x in range(2, 14, 2):
        c.p(x, 8 + by - (gape - 1), 'e'); c.p(x + 1, 9 + by, 'e')            # teeth
    c.p(5, 3 + by, 'y'); c.p(10, 3 + by, 'y') if k >= 2 else None           # eyes in the woodgrain
    c.rect(2, 12 + by, 3, 15 if by == 0 else 13, 'w'); c.rect(12, 12 + by, 13, 15 if by == 0 else 13, 'w')
    return c.done()


row('pew_mimic', PM, pew_mimic, 'chapel')

BT = {'o': '#140C04', 'a': '#6E4A14', 'B': '#C8962A', 'Y': '#FFE08A', 'w': '#4A3020', 'W': '#7A5232', 'k': '#0A0A0E', 'c': '#5EF0C8'}


def bell_totem(k):
    c = Cv(); sw = [0, 1, 0, -1][k]
    c.rect(2, 1, 13, 2, 'W'); c.rect(2, 1, 3, 15, 'w'); c.rect(12, 1, 13, 15, 'w')   # the frame
    c.trap(4, 11, 7 + sw, 8 + sw, 4 + sw, 11 + sw, 'B'); c.rect(4 + sw, 4, 4 + sw, 11, 'Y')   # the bell, swinging
    c.rect(3 + sw, 12, 12 + sw, 12, 'a'); c.p(7 + sw, 13, 'k'); c.p(8 + sw, 13, 'a')
    c.p(7, 3, 'a'); c.p(8, 3, 'a')
    return c.done(late=[(0, 5, 'c'), (15, 5, 'c'), (1, 9, 'c'), (14, 9, 'c')] if k >= 2 else [])


row('bell_totem', BT, bell_totem, 'chapel')


# ================================================================ THE DROWNED FORGE
IMP = {'o': '#140806', 'f': '#8C2A12', 'F': '#F2641A', 'Y': '#FFC94A', 'X': '#FFF6C8', 'k': '#1A1418', 'i': '#4F4B60', 'I': '#8E8AA6'}


def slag_imp(k):
    c = Cv(); by = -1 if k == 1 else 0
    c.ell(7.5, 9 + by, 3, 3.2, 'f'); c.ell(7, 8 + by, 2, 2, 'F', only='f')
    c.ell(7.5, 5 + by, 2.4, 2, 'F'); c.p(6, 5 + by, 'X'); c.p(9, 5 + by, 'X')    # head, white-hot eyes
    c.p(5, 3 + by, 'f'); c.p(10, 3 + by, 'f'); c.p(4, 2 + by, 'Y'); c.p(11, 2 + by, 'Y')   # horns
    c.ln(6, 12 + by, 5, 15, 'f'); c.ln(9, 12 + by, 10, 15, 'f')
    if k == 3:
        c.ln(10, 8, 15, 6, 'I'); c.p(15, 5, 'Y'); c.p(14, 6, 'X')               # flinging slag with tongs
    else:
        c.ln(10, 9 + by, 13, 12 + by, 'i'); c.p(13, 13 + by, 'Y')
    c.ln(4, 9 + by, 2, 11 + by, 'f'); c.p(2, 12 + by, 'Y')                     # a tail of embers
    return c.done(late=[(3, 1, 'Y'), (12, 0, 'X')] if k >= 2 else [])


row('slag_imp', IMP, slag_imp, 'forge')

AG = {'o': '#0C0A10', 'i': '#2A2632', 'I': '#4F4B60', 'k': '#8E8AA6', 'K': '#C8C4D8', 'f': '#B0300C', 'F': '#F2641A', 'Y': '#FFC94A'}


def anvil_golem(k):
    c = Cv(); by = [0, -2, 0, 1][k]
    c.rect(1, 1 + by, 14, 2 + by, 'k'); c.rect(0, 1 + by, 1, 1 + by, 'k'); c.rect(3, 3 + by, 12, 4 + by, 'I'); c.rect(1, 1 + by, 14, 1 + by, 'K')   # an anvil for a head
    c.rect(5, 5 + by, 10, 11 + by, 'I'); c.rect(5, 5 + by, 5, 11 + by, 'k'); c.rect(9, 6 + by, 10, 11 + by, 'i')
    c.rect(6, 7 + by, 9, 9 + by, 'f'); c.rect(7, 8 + by, 8, 8 + by, 'F' if k < 2 else 'Y')   # furnace heart
    c.rect(2, 5 + by, 4, 10 + by, 'i'); c.rect(11, 5 + by, 13, 10 + by, 'i'); c.rect(2, 11 + by, 4, 12 + by, 'k'); c.rect(11, 11 + by, 13, 12 + by, 'k')   # fists
    c.rect(5, 12 + by, 6, 15, 'i'); c.rect(9, 12 + by, 10, 15, 'i')
    return c.done(late=[(0, 15, 'Y'), (15, 15, 'Y'), (3, 14, 'F')] if k == 3 else [])


row('anvil_golem', AG, anvil_golem, 'forge')

QW = {'o': '#0E1218', 's': '#6E7A8A', 'S': '#B8C8D4', 'W': '#F0F6FA', 'c': '#3BEFFF', 'f': '#F2641A', 'k': '#1A1E28'}


def quench_wraith(k):
    c = Cv(); sw = [0, 1, 0, -1][k]
    c.ell(7.5, 6, 3.6, 3.6, 'S'); c.ell(6.5, 5, 2, 2, 'W', only='S')            # a head of steam
    c.rect(6, 5, 9, 7, 'k'); c.p(6, 6, 'c' if k < 2 else 'W'); c.p(9, 6, 'c' if k < 2 else 'W')
    c.trap(9, 15, 5, 10, 6 + sw, 9 + sw, 's'); c.p(5, 10, 'S'); c.p(10, 12, 'W')
    for x, y in ((3 + sw, 3), (12 - sw, 2), (2, 9), (13, 10)):
        c.p(x, y, 'S')                                                       # wisps
    c.p(7, 13, 'f'); c.p(8, 11, 'f')                                         # embers still inside
    return c.done(late=[(1, 6, 'c'), (14, 6, 'c'), (7, 0, 'W')] if k >= 2 else [])


row('quench_wraith', QW, quench_wraith, 'forge')


# ================================================================ THE HEART OF GODFALL
VC = {'o': '#140406', 'r': '#6A0A1A', 'R': '#B0213F', 'P': '#FF4A5A', 'g': '#C98A22', 'G': '#F2C14E', 'e': '#F0E6D0', 'k': '#140406'}


def vein_crawler(k):
    c = Cv(); w = [0, 1, 0, 1][k]
    pts = [(2, 12 + w), (4, 11), (6, 12 - w), (8, 11), (10, 12 + w), (12, 10)]
    for i, (x, y) in enumerate(pts):
        c.rect(x, y, x + 1, y + 2, 'R' if i % 2 else 'r'); c.p(x, y, 'P')
    c.ell(13, 8, 2.4, 2.4, 'R'); c.p(13, 7, 'G'); c.p(14, 8, 'g')            # a gold-flecked head
    if k >= 2:
        c.rect(14, 9, 15, 10, 'k'); c.p(15, 9, 'e'); c.p(14, 10, 'e')         # opening its mouth
    for x in (3, 7, 11):
        c.p(x, 15, 'r'); c.p(x + 1, 14, 'R')                                 # tendril legs
    return c.done(late=[(12, 4, 'P'), (15, 5, 'G')] if k == 3 else [])


row('vein_crawler', VC, vein_crawler, 'heart')

GC = {'o': '#140808', 'r': '#7A1424', 'R': '#C83444', 'g': '#C98A22', 'G': '#F2C14E', 'Y': '#FFEB8F', 'p': '#E8D8C0', 'k': '#140808', 'v': '#7AFFB0'}


def gilded_cardinal(k):
    c = Cv(); by = -1 if k == 1 else 0
    c.trap(6 + by, 15, 6, 9, 3, 12, 'R'); c.rect(3, 9 + by, 3, 15, 'r'); c.rect(7, 6 + by, 8, 15, 'G')   # red robe, gold stole
    c.rect(6, 3 + by, 9, 5 + by, 'p'); c.p(6, 4 + by, 'k'); c.p(9, 4 + by, 'k')
    c.trap(0 + by, 2 + by, 7, 8, 5, 10, 'G'); c.p(7, 0 + by, 'Y'); c.rect(7, 1 + by, 8, 2 + by, 'R')    # tall mitre
    stf = 1 if k >= 2 else 4
    c.ln(12, stf, 12, 15, 'g'); c.rect(11, stf - 1, 13, stf, 'G'); c.p(12, stf - 2, 'Y')                # crozier
    if k >= 2:
        c.p(12, stf - 3, 'v'); c.p(10, stf, 'v')
    return c.done(late=[(1, 3, 'v'), (14, 1, 'v')] if k == 3 else [])


row('gilded_cardinal', GC, gilded_cardinal, 'heart')

RM = {'o': '#140804', 'g': '#8A5A12', 'G': '#E3B95A', 'Y': '#FFEB8F', 'r': '#6A0A1A', 'R': '#C83444', 'e': '#F0E6D0', 'k': '#0A0606', 'w': '#FFFFFF'}


def reliquary_maw(k):
    c = Cv(); gape = [1, 2, 3, 4][k]
    c.rect(2, 3, 13, 14, 'G'); c.rect(2, 3, 13, 3, 'Y'); c.rect(2, 3, 2, 14, 'Y'); c.rect(13, 4, 13, 14, 'g')
    for x in (4, 11):
        c.rect(x, 3, x, 14, 'g')                                             # gold bands
    c.rect(4, 8, 11, 8 + gape, 'k'); c.rect(4, 8, 11, 8, 'r')
    for x in range(4, 12, 2):
        c.p(x, 9, 'e'); c.p(x + 1, 7 + gape, 'e')                            # teeth
    c.ell(7.5, 5.5, 1.6, 1.4, 'w'); c.p(7, 5, 'R'); c.p(8, 5, 'k')           # one great eye on the lid
    c.rect(1, 15, 14, 15, 'g')
    return c.done(late=[(0, 2, 'Y'), (15, 2, 'Y')] if k >= 2 else [])


row('reliquary_maw', RM, reliquary_maw, 'heart')

BS = {'o': '#140406', 'r': '#6A0A1A', 'R': '#B0213F', 'P': '#FF4A5A', 'g': '#C98A22', 'G': '#F2C14E', 'Y': '#FFEB8F', 'p': '#E8D8C0', 'k': '#140406'}


def blood_seraph(k):
    c = Cv(); wy = [2, 6, 4, 8][k]
    c.ln(6, 6, 0, wy, 'R'); c.ln(6, 7, 1, wy + 2, 'P'); c.ln(6, 8, 2, wy + 4, 'r')      # three pairs of wings
    c.ln(9, 6, 15, wy, 'R'); c.ln(9, 7, 14, wy + 2, 'P'); c.ln(9, 8, 13, wy + 4, 'r')
    c.rect(6, 5, 9, 12, 'R'); c.rect(6, 5, 6, 12, 'P')
    c.rect(6, 2, 9, 4, 'p'); c.rect(6, 3, 9, 3, 'k'); c.p(7, 3, 'Y'); c.p(8, 3, 'Y')    # blindfolded, eyes burning through
    c.rect(5, 0, 10, 0, 'G'); c.p(4, 1, 'G'); c.p(11, 1, 'G')                           # halo
    c.ln(7, 13, 6, 15, 'r'); c.ln(8, 13, 9, 15, 'r')
    return c.done(late=[(7, 15, 'Y'), (8, 14, 'P')] if k == 3 else [])


row('blood_seraph', BS, blood_seraph, 'heart')


# ================================================================ THE FROZEN SCRIPTORIUM
IW = {'o': '#06060C', 'k': '#141428', 'K': '#2E2E5A', 'b': '#4A4AA0', 'c': '#8AC8FF', 'W': '#E8F6FF', 'q': '#E8E0C8'}


def ink_wisp(k):
    c = Cv(); by = [0, -1, -1, 0][k]
    c.ell(7.5, 8 + by, 4, 4, 'K'); c.ell(6.5, 7 + by, 2.4, 2.2, 'b', only='K'); c.p(5, 5 + by, 'c')
    c.p(6, 8 + by, 'W'); c.p(9, 8 + by, 'W')                                 # two pinprick eyes
    for x, y in ((4, 12), (7, 13), (10, 12), (6, 14), (9, 15)):
        c.p(x, y + by, 'k')                                                  # dripping ink
    c.ln(11, 4 + by, 14, 1 + by, 'q'); c.p(14, 0 + by, 'q'); c.p(13, 2 + by, 'K')   # a quill stuck in it
    return c.done(late=[(2, 3, 'c'), (13, 9, 'c')] if k >= 2 else [])


row('ink_wisp', IW, ink_wisp, 'scriptorium')

FL = {'o': '#0A0E1A', 'i': '#3A57A8', 'I': '#8AC8FF', 'w': '#E8F6FF', 'W': '#FFFFFF', 'k': '#141830', 'b': '#7A4A2A', 'B': '#C88A4A', 'c': '#3BEFFF'}


def frost_librarian(k):
    c = Cv(); by = -1 if k == 1 else 0
    c.trap(4 + by, 15, 6, 9, 4, 11, 'i'); c.rect(4, 6 + by, 4, 15, 'I'); c.rect(7, 4 + by, 8, 15, 'w')   # tall icy robe
    c.ell(7.5, 2.5 + by, 2, 2, 'I'); c.p(6, 2 + by, 'c'); c.p(9, 2 + by, 'c'); c.p(7, 0 + by, 'W')
    c.p(5, 1 + by, 'w'); c.p(10, 1 + by, 'w')                                # icicle crown
    if k >= 2:
        c.rect(10, 4, 14, 7, 'B'); c.rect(11, 5, 13, 6, 'W'); c.p(12, 3, 'c')   # book thrown open
    else:
        c.rect(10, 8 + by, 13, 11 + by, 'b'); c.rect(10, 8 + by, 13, 8 + by, 'B')
    return c.done(late=[(13, 1, 'c'), (15, 4, 'W')] if k == 3 else [])


row('frost_librarian', FL, frost_librarian, 'scriptorium')

LT = {'o': '#0A0806', 'b': '#5A2A1A', 'B': '#9A4A2A', 'g': '#E3B95A', 'p': '#E8E0C8', 'P': '#FFFFFF', 'k': '#141418', 'c': '#8AC8FF', 'r': '#C83444'}


def living_tome(k):
    c = Cv(); fl = [0, 2, 1, 3][k]
    c.rect(3, 6, 12, 11, 'b'); c.rect(3, 6, 12, 6, 'B'); c.rect(7, 6, 8, 11, 'g')     # the spine
    c.ln(3, 6, 0, 6 - fl, 'p'); c.ln(3, 7, 0, 8 - fl, 'p'); c.ln(12, 6, 15, 6 - fl, 'p'); c.ln(12, 7, 15, 8 - fl, 'p')   # pages beating like wings
    c.p(5, 8, 'c'); c.p(10, 8, 'c')                                          # eyes on the cover
    c.rect(5, 10, 10, 10, 'k'); c.p(6, 10, 'P'); c.p(9, 10, 'P')             # a fanged mouth along the fore-edge
    c.p(8, 12, 'r'); c.p(8, 13, 'r'); c.p(7, 14, 'r')                        # ribbon bookmark
    return c.done(late=[(1, 1, 'p'), (14, 2, 'p'), (7, 3, 'P')] if k >= 2 else [])


row('living_tome', LT, living_tome, 'scriptorium')

IS = {'o': '#0A0E1A', 'i': '#5A7AA8', 'I': '#A8C8E0', 'W': '#F0F8FF', 'k': '#141830', 'c': '#3BEFFF', 'b': '#7A4A2A'}


def ice_scribe(k):
    c = Cv()
    c.rect(4, 13, 11, 15, 'i'); c.rect(4, 13, 11, 13, 'I')                 # frozen to its plinth
    c.rect(5, 6, 10, 12, 'I'); c.rect(5, 6, 5, 12, 'W'); c.rect(9, 7, 10, 12, 'i')
    c.ell(7.5, 3.5, 2.2, 2.2, 'I'); c.p(7, 3, 'c' if k >= 2 else 'k'); c.p(8, 3, 'c' if k >= 2 else 'k')
    c.rect(1, 9, 4, 11, 'b'); c.rect(2, 9, 3, 9, 'W')                       # the ledger it writes in forever
    qx = [12, 13, 12, 14][k]
    c.ln(10, 8, qx, 4, 'W'); c.p(qx, 3, 'c')                                 # the quill
    return c.done(late=[(qx + 1, 2, 'c'), (15, 1, 'W')] if k == 3 else [])


row('ice_scribe', IS, ice_scribe, 'scriptorium')


# ================================================================ the coin thief (a roaming realm event)
CI = {'o': '#140A04', 'g': '#4E7E34', 'G': '#7EAE48', 'b': '#7A5232', 'B': '#B07A44', 'Y': '#FFD650', 'W': '#FFF6C8', 'k': '#0A0A0E'}


def coin_imp(k):
    c = Cv(); by = -1 if k == 1 else 0
    c.ell(10, 9 + by, 4, 4, 'b'); c.ell(9, 8 + by, 2.4, 2, 'B', only='b'); c.p(10, 5 + by, 'Y'); c.p(12, 6 + by, 'Y'); c.p(8, 6 + by, 'W')   # a bulging sack of gold
    c.ell(5, 8 + by, 2.6, 2.6, 'G'); c.p(4, 7 + by, 'k'); c.p(6, 7 + by, 'k'); c.rect(4, 9 + by, 6, 9 + by, 'k')   # grinning goblin head
    c.p(2, 6 + by, 'G'); c.p(8, 5 + by, 'G')                                       # ears
    c.ln(4, 11, 3 + k % 2, 15, 'g'); c.ln(6, 11, 7 - k % 2, 15, 'g')
    return c.done(late=[(13, 14, 'Y'), (1, 13, 'Y')] if k >= 2 else [(14, 13, 'Y')])


row('coin_imp', CI, coin_imp, 'shore')
