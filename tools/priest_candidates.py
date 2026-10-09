"""Priest candidates B and C (A = heliarch.py). Two front frames each:
idle + signature pose."""
from pixlib import compose, flip, check

# ------------------------------------------------------------ B: THE CENSER-MAGISTRATE
# The judge of a cathedral that was condemned with everyone inside it. He
# carries its last shrine bolted to his shoulder and swings a censer that
# burns violet: the smoke of everyone he has absolved.
PAL_B = {
    'o': '#120A12', 's': '#2C2A33', 'S': '#5B5866', 'L': '#A9A6B8',
    'r': '#5C0F24', 'R': '#9A1D3A', 'g': '#A8792A', 'G': '#E3B95A',
    'p': '#5A2BB0', 'P': '#B98CFF',
}
SHRINE = ["..oo..", ".oGGo.", "oGggGo", "osPPso", "osPpso", "osssso", "oGggGo", ".oooo."]
HEAD_B = [".ooo.", "osSso", "oPsPo", "orrro", ".oro."]
BODY_B = ["osRRRso", "osRgRso", "oRRgRRo", "orRgRro", "oSLSLSo", "oRrRrRo", ".oo.oo."]
CENSER = ["..g..", "..g..", ".oGo.", "oSPSo", "oPPPo", "oSPSo", ".ooo."]


def censer_magistrate():
    idle = compose([(BODY_B, 4, 8), (HEAD_B, 5, 3), (SHRINE, 0, 0), (["oGo"], 9, 7),
                    (CENSER, 11, 8), (["p"], 14, 6), (["P"], 13, 5)])
    swing = compose([(BODY_B, 4, 8), (HEAD_B, 5, 3), (SHRINE, 0, 0, {'P': 'G', 'p': 'P'}),
                     (["oGo"], 9, 6), (flip(CENSER[::-1]), 10, 0), (["g"], 10, 7),
                     (["P.p"], 12, 8), (["p"], 15, 9), (["P"], 9, 4)])
    return [idle, swing]


# ------------------------------------------------------------ C: THE TABLET ASCENDANT
# A saint who stopped touching the ground the day he finished writing the
# law. Legless, tapering to a point, his mitre a narrow spire. Three tablets
# of that law orbit him, and they are what actually hits you.
PAL_C = {
    'o': '#0E1530', 'n': '#1F2E5E', 's': '#8C8FA3', 'S': '#C9CCD8',
    'c': '#3FD8F0', 'C': '#C8FAFF', 'g': '#A88B4A', 'G': '#D9BE7A',
}
MITRE = [".o.", "oGo", "oSo", "oSo", "oCo", "oSo"]
SHOULDER_C = ["oSSSGSSSo", ".ooo.ooo."]
ROBE_C = ["onGGGno", "onnCnno", "onnCnno", ".onCno.", ".onCno.", "..oCo..", "..oGo..", "...o..."]
TAB_BIG = [".oo.", "oSSo", "ocCo", "oSSo", "oCco", "oSSo", "oooo"]
TAB_S = [".o.", "oSo", "oco", "oSo", "ooo"]


def tablet_ascendant():
    idle = compose([(ROBE_C, 5, 7), (SHOULDER_C, 4, 6), (MITRE, 7, 0),
                    (TAB_BIG, 0, 4), (TAB_S, 12, 1), (TAB_S, 13, 9)])
    verdict = compose([(ROBE_C, 5, 6), (SHOULDER_C, 4, 5), (MITRE, 7, -1, {'S': 'C'}),
                       (TAB_BIG, 0, 0, {'S': 'C'}), (TAB_S, 13, 0, {'S': 'C'}),
                       (TAB_S, 0, 11, {'S': 'C'}), (TAB_S, 13, 11, {'S': 'C'}),
                       (["c"], 4, 4), (["c"], 11, 3), (["c"], 3, 12), (["c"], 12, 12)])
    return [idle, verdict]


for _n, _p in list(globals().items()):
    if isinstance(_p, list) and _p and isinstance(_p[0], str):
        check(_n, _p)
