"""Forge Knight candidates B and C (A = anvilheart.py). Two front frames each:
idle + signature pose."""
from pixlib import compose, check

# ------------------------------------------------------------ B: THE MOLD-WROUGHT
# A knight who was never finished. He is still the casting mold he was poured
# into: two black-iron halves held apart by a seam of molten light, the right
# half hiked two pixels higher than the left. Where a head should be is the
# pour-funnel, brimming. His sword is still sealed inside its own mold-slab.
PAL_B = {
    'o': '#120E1C', 'k': '#2B2836', 'i': '#4C4860', 'I': '#8E89A8',
    'm': '#9A2A10', 'M': '#FF6A1A', 'Y': '#FFD04A', 'W': '#FFF7D6',
}
FUNNEL = [".oooooo.", "oMYWWYMo", ".oiiiko.", "..okko.."]
LHALF = [".oooo", "oIiik", "oiiik", "oiMik", "oiiik", "oiiik", "oiiik", "okkkk", ".oooo"]
RHALF = ["ooo.", "kiIo", "kiio", "kiio", "kMio", "kiio", "kiio", "kkko", "ooo."]
SEAM = ["Y", "M", "Y", "W", "M", "Y", "M", "Y", "M"]
LEGS_B = ["ok..ko", "oo..oo"]
SLAB = [".o..", "oIo.", "IIIo", "oiMo", "oiMo", "oiYo", "oiMo", "oiMo", "oiYo", "oiMo", "oiMo", "ooo."]
GUTS = [".WY.", "YWWY", "MYWM", "YWYY", "MYWM", ".YM."]   # the unfinished man inside


def mold_wrought():
    idle = compose([(LEGS_B, 5, 14), (SEAM, 8, 5), (LHALF, 3, 5), (RHALF, 9, 3),
                    (FUNNEL, 4, 0), (SLAB, 0, 3)])
    split = compose([(LEGS_B, 5, 14), (GUTS, 6, 6), (LHALF, 1, 5), (RHALF, 11, 2),
                     (FUNNEL, 4, -1, {'M': 'Y', 'Y': 'W'}), (SLAB, -1, 3),
                     (["Y"], 7, 13), (["M"], 9, 4)])
    return [idle, split]


# ------------------------------------------------------------ C: THE BELLOWS-BOUND
# A forge-priest whose ribcage was replaced by the great bellows of his temple.
# He doesn't breathe, the bellows does, and his face is its iron nozzle,
# tilted like a plague-beak. He drags a fire-rake taller than he is.
PAL_C = {
    'o': '#170F14', 'k': '#2C2730', 'i': '#545066', 'I': '#9A96AE',
    'p': '#4A0F1E', 'P': '#8E1E2E', 'm': '#9A2A10', 'M': '#FF6A1A', 'Y': '#FFD04A',
}
NOZZLE = ["o....", "oIo..", ".oIo.", ".oiio", "oiYio", ".okko"]
BELLOWS = [".ooooooooo.", "okkiIIIikko", "opPPPPPPPpo", ".okkkkkkko.",
           "opPPPPPPPpo", ".okkkkkkko.", "opPPPPPPPpo", "okkiiiiikko", ".ooooooooo."]
BELLOWS_FULL = [".ooooooooooo.", "okkiIIIIIikko", "opPPPPPPPPPpo", ".okkkkkkkkko.",
                "opPPPPPPPPPpo", ".okkkkkkkkko.", "opPPPPPPPPPpo", ".okkkkkkkkko.",
                "opPPPPPPPPPpo", "okkiiiiiiikko", ".ooooooooooo."]
LEGS_C = ["ok.ko", "ok.ko", "oo.oo"]
RAKE = ["ooo", "oYo", "oMo", "o.o", ".io", ".io", ".io", ".io", ".io", ".io", ".io", ".io", ".oo"]


def bellows_bound():
    idle = compose([(RAKE, 13, 2), (LEGS_C, 5, 13), (BELLOWS, 2, 4), (NOZZLE, 4, 0)])
    blast = compose([(RAKE, 13, 3), (LEGS_C, 5, 13), (BELLOWS_FULL, 1, 2), (NOZZLE, 4, -2),
                     (["M"], 2, 0), (["Y"], 1, 1), (["YM"], 0, 2)])
    return [idle, blast]


for _n, _p in list(globals().items()):
    if isinstance(_p, list) and _p and isinstance(_p[0], str):
        check(_n, _p)
