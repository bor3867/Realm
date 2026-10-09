"""Vanguard class candidates A and B (C = forgefist.py).

Each returns three 16x16 front frames: idle0, idle1, attack-contact.
"""
from pixlib import compose, check

# ------------------------------------------------------------ A: CAIRNWARDEN
# A grave-keeper of the drowned kings whose helm is a runestone pulled from a
# barrow. He carries the barrow's own door as a shield.
PAL_A = {
    'o': '#0F2229',  # outline - deep teal-black
    't': '#1E5B57',  # verdigris dark
    'T': '#38A08A',  # verdigris
    'v': '#9BE3C2',  # verdigris light
    'b': '#EDE3C8',  # bone
    'B': '#A99D7F',  # bone shade
    'S': '#B2ACCA',  # rune-stone light
    's': '#726D8E',  # rune-stone
    'c': '#3BEFFF',  # rune cyan
    'C': '#CFFFFF',  # rune hot
}
MENHIR = [
    "..ooo.",
    ".oSSso",
    ".oScso",
    "oSCso.",
    "oScso.",
    "oSsso.",
    "oSsso.",
]
DOOR = [
    "..ooo.",
    ".obbBo",
    ".obbBo",
    ".otTto",
    ".obbBo",
    ".obcBo",
    ".obCBo",
    ".otTto",
    ".obbBo",
    ".obbBo",
    "..ooo.",
]
TORSO_A = [
    "otTTto",
    "otbTto",
    "oTbTto",
    "oTbTto",
    "otbtto",
    "oTTTTo",
]
PAULDRON = [
    ".ooo.",
    "ovvTo",
    "ovTto",
    "oTcto",
    ".ooo.",
]
BLADE = ["obbo", "oSso", "oSso", "oSso", "oSco", ".oo."]
LEGS_A = ["otoTo.", "otoTo.", "oo.oo."]
PULSE = {'c': 'C', 'C': 'c'}


def cairnwarden():
    i0 = compose([(LEGS_A, 6, 13), (TORSO_A, 6, 7), (MENHIR, 6, 0), (PAULDRON, 10, 5),
                  (BLADE, 11, 10), (DOOR, 2, 5)])
    i1 = compose([(LEGS_A, 6, 13), (TORSO_A, 6, 7), (MENHIR, 6, 1, PULSE),
                  (PAULDRON, 10, 5, PULSE), (BLADE, 11, 11), (DOOR, 2, 6)])
    a1 = compose([(LEGS_A, 6, 13), (TORSO_A, 6, 7), (MENHIR, 7, 1, {'c': 'C'}),
                  (PAULDRON, 10, 5), (BLADE[::-1], 11, 6),
                  (DOOR, 4, 5, {'c': 'C', 'b': 'v', 'B': 'T'}),
                  (["C"], 2, 14), (["c"], 1, 11), (["C"], 11, 15), (["c"], 3, 3)])
    return [i0, i1, a1]


# ------------------------------------------------------------ B: HOLLOW THANE
# A jarl who swore an oath on his own head and lost it. What remains is the
# oath: a violet flame where his neck ends, a crown that won't fall, and a
# sword that follows him on a chain of light because he has no hands left.
PAL_B = {
    'o': '#110E29',  # outline - navy black
    'n': '#1F2C63',  # navy dark
    'N': '#3A57A8',  # navy
    'p': '#6A2ED6',  # violet
    'P': '#B57CFF',  # violet light
    'w': '#F4EDFF',  # soul white
    'g': '#C29A3E',  # gold
    'G': '#F7DE8C',  # gold light
    'm': '#8A93AE',  # steel
    'M': '#E1E6F0',  # steel light
}
CROWN = ["G.G..", "gGgGg"]  # one tooth snapped off
FLAME0 = [".P.", "PwP", "pPp"]
FLAME1 = ["P..", ".wP", "pPp"]
FLAME_T = [".P.", "PwP", "PwP", "pPp"]
MANTLE = ["onNgogNno", "oNNNnNNNo"]
ROBE = ["onNPNno", "onNpNno", "onNPNno", "onnpnno", "onNpNno", "onnnnno", ".oo.oo."]
SWORD = [".G.", "gGg", ".n.", "oMo", "mMo", "mMo", "mMo", "mMo", "mMo", "mPo", "oMo", ".o."]
SWORD_H = ["..mmmmmmmg..", "oMMMMMMPMGnG", "..mmmmmmmg.."]
DOT = ["P"]


def hollow_thane():
    i0 = compose([(ROBE, 4, 9), (MANTLE, 3, 7), (FLAME0, 6, 4), (CROWN, 5, 1),
                  (SWORD, 12, 3), (DOT, 11, 11), (DOT, 11, 9), (DOT, 12, 7)])
    i1 = compose([(ROBE, 4, 9), (MANTLE, 3, 7), (FLAME1, 6, 4), (CROWN, 5, 0),
                  (SWORD, 12, 4), (DOT, 11, 10), (DOT, 12, 8)])
    a1 = compose([(ROBE, 4, 9), (MANTLE, 3, 7), (FLAME_T, 6, 3), (CROWN, 5, 0, {'g': 'G'}),
                  (SWORD_H, 1, 12), (DOT, 13, 11), (DOT, 12, 10), (["w"], 0, 13),
                  (["P"], 0, 11), (["P"], 14, 15)])
    return [i0, i1, a1]


for _n, _p in list(globals().items()):
    if isinstance(_p, list) and _p and isinstance(_p[0], str):
        check(_n, _p)
