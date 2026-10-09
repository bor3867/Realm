"""Realm bestiary, wave 3: one new hunter per biome, each built around how it MOVES.

reef_eel     (shore)    - burrows through the sand and erupts beneath you
bog_toad     (fen)      - hops in great arcs; lobs bile mortars from its lantern-lure
frost_wraith (runeholt) - blinks around you trailing ice; its needles accelerate
ash_harpy    (godfall)  - circles, then dive-bombs straight through you

Row format as bestiary.py: M0 M1 | T0 | A0 | D0 D1 D2.
"""
from drawkit import Cv
from bestiary import register
from bestiary2 import death3, settle


# ---------------------------------------------------------------- REEF EEL
EEL = {'o': '#140A12', 'p': '#C8508A', 'P': '#FF8FBF', 'q': '#FFE3F0', 't': '#2B6E6A', 'T': '#5FB3A1', 'w': '#FFFFFF',
       's': '#B8955A', 'S': '#E8CF96', 'y': '#FFE45C', 'r': '#7A1424'}


def eel(arch=0, mouth=0, glow=False):
    c = Cv()
    c.ell(7.5, 14, 6, 1.5, 's'); c.ell(6, 13.7, 3, 0.8, 'S', only='s')        # the sand it bursts from
    pts = [(4, 13), (4, 12), (5, 11), (6, 10), (7, 9), (8, 8), (9, 7 - arch), (10, 6 - arch), (11, 5 - arch)]
    for k, (x, y) in enumerate(pts):
        c.rect(x, y, x + 1, y + 1, 'p' if k % 2 else 'P')                    # banded body
        if k % 3 == 1:
            c.p(x - 1, y, 'T')                                               # fins
    c.rect(10, 2 - arch, 13, 5 - arch, 'P'); c.rect(11, 2 - arch, 13, 2 - arch, 'q')   # head
    c.p(12, 3 - arch, 'y' if glow else 'o')                                  # eye
    c.p(13, 3 - arch, 't'); c.p(10, 1 - arch, 'T'); c.p(11, 1 - arch, 'T')   # gill frills
    if mouth:
        c.rect(12, 5 - arch, 14, 6 - arch, 'r'); c.p(12, 5 - arch, 'w'); c.p(14, 5 - arch, 'w')   # jaws open, fangs
    return c.done()


register('reef_eel', EEL, [eel(0), eel(1), eel(1, 1, True), eel(-1, 1, True)] + death3(eel(0), {'P': 'p', 'q': 'P'}), biome='shore')


# ---------------------------------------------------------------- BOG TOAD
TOAD = {'o': '#0E140A', 'g': '#3E5A22', 'G': '#6A8A30', 'K': '#A8C850', 'b': '#8A6A3A', 'B': '#C8A060', 'y': '#FFE45C',
        'Y': '#FFF6C8', 'r': '#6A1A1E', 'w': '#EDE6D2', 'e': '#E8601A'}


def toad(leap=False, sac=0, mouth=False, lure=1):
    c = Cv()
    if leap:                                                                  # mid-hop: legs trailing, body stretched
        c.ell(7.5, 8, 5, 3.5, 'G'); c.ell(6, 7, 3, 2, 'K', only='G')
        c.ln(3, 10, 1, 13, 'g'); c.ln(12, 10, 14, 13, 'g'); c.p(1, 14, 'G'); c.p(14, 14, 'G')
    else:
        c.ell(7.5, 10, 6, 4, 'G'); c.ell(6, 9, 3.5, 2.2, 'K', only='G')
        c.rect(1, 12, 3, 14, 'g'); c.rect(12, 12, 14, 14, 'g')                # bunched legs
        c.rect(1, 14, 3, 14, 'G'); c.rect(12, 14, 14, 14, 'G')
    by = -2 if leap else 0
    for x, y in ((4, 8), (9, 7), (11, 10), (6, 12)):
        c.p(x, y + by, 'g')                                                    # warts
    c.p(4, 7 + by, 'e'); c.p(10, 7 + by, 'e')                                 # eyes, orange
    c.p(4, 6 + by, 'w'); c.p(10, 6 + by, 'w')
    if sac:
        c.ell(7.5, 12 + by, 2 + sac, 1.5 + sac * 0.5, 'B'); c.p(6, 12 + by, 'Y')   # throat sac swelling
    if mouth:
        c.rect(5, 11 + by, 10, 11 + by, 'r')
    c.ln(7, 6 + by, 7, 3 + by, 'b'); c.p(8, 2 + by, 'b')                      # the lure stalk
    c.p(9, 2 + by, 'y' if lure else 'B'); c.p(9, 1 + by, 'Y' if lure > 1 else 'y')
    return c.done()


register('bog_toad', TOAD, [toad(False, 0, False, 1), toad(True, 0, False, 2), toad(False, 2, False, 2), toad(False, 1, True, 2)]
         + death3(toad(False, 0, True, 0), {'K': 'G', 'y': 'b', 'Y': 'B'}), biome='fen')


# ---------------------------------------------------------------- FROST WRAITH
WR = {'o': '#0A0E1A', 'i': '#3A57A8', 'I': '#8AC8FF', 'w': '#E8F6FF', 'W': '#FFFFFF', 'k': '#141830', 'c': '#3BEFFF'}


def wraith(sway=0, flare=False, reach=False):
    c = Cv()
    c.trap(3, 10, 6, 9, 3, 12, 'i')                                           # hooded body of packed ice
    c.rect(6, 1, 9, 2, 'i'); c.p(7, 0, 'I')
    c.rect(6, 3, 9, 5, 'k'); c.p(6, 4, 'c' if not flare else 'W'); c.p(9, 4, 'c' if not flare else 'W')   # empty hood, cold eyes
    c.ln(4 + sway, 11, 6, 15, 'I'); c.ln(8, 11, 8 - sway, 15, 'i'); c.ln(11, 11, 10 + sway, 14, 'I')   # tattered icicle tail
    c.p(4, 6, 'I'); c.p(5, 8, 'w'); c.p(10, 7, 'I'); c.p(6, 2, 'w')
    if reach:
        c.ln(11, 6, 15, 4, 'I'); c.p(15, 3, 'W'); c.p(14, 5, 'w')             # an arm of ice flung out
    else:
        c.ln(11, 6, 13, 9, 'I'); c.p(13, 10, 'w')
    c.ln(4, 6, 2, 9, 'i'); c.p(2, 10, 'w')
    return c.done(late=[(1, 2, 'c'), (14, 1, 'W')] if flare else [])


register('frost_wraith', WR, [wraith(0), wraith(1), wraith(1, True), wraith(0, True, True)]
         + death3(wraith(0), {'c': 'i', 'I': 'i'}), biome='runeholt')


# ---------------------------------------------------------------- ASH HARPY
HP = {'o': '#140808', 'f': '#8C2A12', 'F': '#F2641A', 'Y': '#FFC94A', 'X': '#FFF6C8', 'g': '#C98A22', 'G': '#F2C14E',
      'k': '#2A2024', 'K': '#4A3E44', 'r': '#B0213F'}


def harpy(wing=0, dive=False, glow=False):
    c = Cv()
    c.ell(7.5, 8, 2.4, 3.2, 'K'); c.ell(7, 7, 1.4, 2, 'k', only='K')           # ash-grey body
    c.rect(6, 2, 9, 4, 'G'); c.rect(7, 3, 8, 3, 'k'); c.p(7, 3, 'X' if glow else 'r'); c.p(8, 3, 'X' if glow else 'r')   # gold death-mask
    c.p(6, 1, 'g'); c.p(9, 1, 'g'); c.p(5, 2, 'g')                             # crest
    # ember wings: up, level, down
    ys = [(2, 5), (5, 7), (8, 10)][wing]
    c.ln(5, 6, 0, ys[0], 'f'); c.ln(5, 7, 1, ys[1], 'F'); c.ln(5, 8, 2, ys[1] + 1, 'Y')
    c.ln(10, 6, 15, ys[0], 'f'); c.ln(10, 7, 14, ys[1], 'F'); c.ln(10, 8, 13, ys[1] + 1, 'Y')
    if dive:
        c.ln(7, 11, 6, 15, 'g'); c.ln(8, 11, 9, 15, 'g'); c.p(5, 15, 'G'); c.p(10, 15, 'G')   # talons thrust forward
    else:
        c.rect(7, 11, 7, 13, 'g'); c.rect(8, 11, 8, 13, 'g'); c.p(6, 13, 'G'); c.p(9, 13, 'G')
    return c.done(late=[(0, ys[0] - 1, 'Y'), (15, ys[0] - 1, 'Y')] if glow else [])


register('ash_harpy', HP, [harpy(0), harpy(2), harpy(1, False, True), harpy(1, True, True)]
         + death3(harpy(1), {'F': 'f', 'Y': 'F', 'G': 'g'}), biome='godfall')

del settle
