"""
Sprite data for the Realm sprite pack.
Every sprite is a list of strings; each character is a palette key, '.' is transparent.
Native resolution: 8x8 for players, enemies, items, tiles, projectiles; 16x16 for bosses.
Player attack frame 2 is 16x8 (weapon extends into the next cell), RotMG-style.
All designs are original.
"""

# ---------------------------------------------------------------- palettes
BASE = {
    "k": "#140f1c",  # near-black detail
    "w": "#ffffff",
}

RUNEBLADE = {**BASE,
    "S": "#d9e0ea", "s": "#8f99ad", "d": "#4b5366",   # steel
    "f": "#f2c9a0",                                    # skin
    "r": "#d63a4a", "R": "#7c1e30",                    # crimson cape
    "g": "#46f5d6",                                    # rune glow
    "b": "#eef8ff", "B": "#9db4cc",                    # blade
    "y": "#f4c64a", "Y": "#a8742a",                    # gold
}

HEXWEAVER = {**BASE,
    "p": "#7a48c8", "P": "#43267e", "q": "#ab82f2",    # robe
    "y": "#f4c64a", "Y": "#a8742a",                    # gold trim
    "e": "#ffe66a",                                    # glowing eyes
    "n": "#a06c3a", "N": "#5e3a1e",                    # staff wood
    "o": "#7af4ff", "O": "#2a9ad8", "W": "#e6ffff",    # orb
    "f": "#e8b890",                                    # hands
}

CRYPT = {**BASE,
    "b": "#efe9d2", "B": "#a9a088",                    # bone
    "g": "#9cff6a", "G": "#3cbf5e", "h": "#eaffc4",    # soul flame
    "v": "#3ca048", "V": "#1e6430",                    # seaweed
    "x": "#b8642e", "X": "#6a3418",                    # rust
    "c": "#6af0ff", "C": "#2a86c8",                    # eye/water glow
    "j": "#6ad8ff", "J": "#2a7ac8", "l": "#d0f6ff",    # jelly bell
    "m": "#b07af0", "M": "#5e3aa0",                    # jelly tentacles
    "t": "#1f7078", "T": "#103a44", "u": "#33a3a0",    # lich robe
    "y": "#f4c64a", "Y": "#a8742a",
    "o": "#ff7a6a", "O": "#c0404e",                    # coral
    "a": "#3a4a5c", "A": "#222c38", "L": "#5a6c80",    # crypt stone
    "q": "#7486a0", "Q": "#4c5c72",                    # wall top
    "e": "#2a6c9c", "E": "#173e62", "H": "#9ae0ff",    # water
}

EMBER = {**BASE,
    "r": "#e2482a", "R": "#8a2418",                    # imp skin
    "b": "#f0e2c2", "B": "#a89a78",                    # horn
    "v": "#5e2a3c", "V": "#30141e",                    # wing membrane
    "m": "#ff8c1e", "M": "#ffd84a", "h": "#fff6c8", "n": "#a8301a",  # molten
    "s": "#6a5852", "S": "#8c7a72", "z": "#3a2c2c",    # rock (golem)
    "i": "#7c808e", "I": "#44465a", "j": "#b8bece",    # iron
    "x": "#6c4428", "X": "#3e2414",                    # wood/handle
    "a": "#3c2a28", "A": "#1e1414", "L": "#5a4038",    # basalt
    "q": "#6c524a", "Q": "#4a3630",                    # wall top
    "c": "#2c2228",                                    # beetle shell dark
}

ITEMS = {**BASE,
    "S": "#d9e0ea", "s": "#8f99ad", "d": "#4b5366",
    "b": "#eef8ff", "l": "#ffffff",
    "c": "#3ad8d0", "C": "#1a8a90",
    "y": "#f4c64a", "Y": "#a8742a",
    "x": "#6a3a9a", "X": "#3e2060",
    "i": "#7c808e", "I": "#44465a", "j": "#b8bece",
    "m": "#ff8c1e", "M": "#ffd84a", "h": "#fff6c8", "n": "#a8301a",
    "R": "#7a2a1c", "r": "#b0402a",
    "p": "#7a48c8", "P": "#43267e", "q": "#ab82f2",
    "o": "#7af4ff", "O": "#2a9ad8", "W": "#e6ffff",
    "N": "#5e3a1e", "t": "#a06c3a",
    "g": "#46f5d6", "G": "#1ca088",
    "e": "#9cff6a", "E": "#3cbf5e",
    "u": "#c8d8e8",   # glass
    "U": "#8aa0b8",
    "z": "#e83a4a", "Z": "#8e1a2e", "H": "#ff9aa8",  # health liquid
    "a": "#3a8aff", "A": "#1c46a8", "F": "#9ad0ff",  # mana liquid
    "w2": "#ffffff",
    "v": "#8a5a32", "V": "#5a3418", "K": "#b88250",  # brown bag
    "k2": "#000000",
}

FX = {**BASE,
    "g": "#46f5d6", "G": "#1ca088", "b": "#eef8ff",
    "o": "#7af4ff", "O": "#2a9ad8", "W": "#e6ffff", "p": "#ab82f2", "P": "#7a48c8",
    "e": "#9cff6a", "E": "#3cbf5e", "h": "#eaffc4",
    "c": "#6af0ff", "C": "#2a86c8",
    "m": "#ff8c1e", "M": "#ffd84a", "H": "#fff6c8", "n": "#a8301a",
    "s": "#8c7a72", "S": "#b8a89e",
    "y": "#ffe9a0", "Y": "#d8c8b8", "z": "#9a8c86",
}

# ---------------------------------------------------------------- helpers
def legs(body, leg_rows):
    return body + leg_rows

def recolor(grid, mapping):
    return ["".join(mapping.get(ch, ch) for ch in row) for row in grid]

def edit(grid, edits):
    """edits: dict {row_index: new_row}"""
    g = list(grid)
    for r, row in edits.items():
        g[r] = row
    return g

# ================================================================ RUNEBLADE
# --- facing right
RB_R_BODY = [
    ".rrsSs.b",
    "rRsSSSsb",
    "R.sSkgdb",
    ".rRdssdb",
    ".rsSgsYy",
    ".RdssdYf",
]
RB_R_STAND = ["..s..s..", "..dd.dd."]
RB_R_WALK1 = [".s....s.", ".dd...dd"]
RB_R_WALK2 = ["...ss...", "...ddd.."]
RB_R_ATK1 = [
    ".rrsSs..",
    "rRsSSSs.",
    "R.sSkgd.",
    ".rRdssdy",
    ".rsSgfYb",
    ".RdssdYy",
    "..s..s..",
    "..dd.dd.",
]
RB_R_ATK2 = [
    "..rrsSs.........",
    ".rRsSSSs........",
    ".R.sSkgd........",
    "..rRdssdy.......",
    "..rsSgsfYbbbbbbB",
    "..RdssdYy.......",
    "..s....s........",
    "..dd...dd.......",
]
# --- facing down (toward camera)
RB_D_BODY = [
    "..sSSs.b",
    ".sSrrSsb",
    ".skgkgsb",
    ".rdssdrb",
    ".rsSgsyY",
    ".RdssdRf",
]
RB_D_STAND = ["..s..s..", "..d..d.."]
RB_D_WALK1 = ["..s..s..", "..d....."]
RB_D_WALK2 = ["..s..s..", ".....d.."]
RB_D_ATK1 = [
    "..sSSs.b",
    ".sSrrSyY",
    ".skgkgsf",
    ".rdssdr.",
    ".rsSgsr.",
    ".RdssdR.",
    "..s..s..",
    "..d..d..",
]
RB_D_ATK2 = [
    "..sSSs..",
    ".sSrrSs.",
    ".skgkgs.",
    ".rdssdf.",
    ".rsSgyYy",
    ".RdssdB.",
    "..s..sb.",
    "..d..dB.",
]
# --- facing up (away)
RB_U_BODY = [
    "b.sSSs..",
    "bsSrrSs.",
    "bsSSSSs.",
    "Yyrrrrr.",
    "frRrrRr.",
    ".rRrrRr.",
]
RB_U_STAND = ["..d..d..", "..d..d.."]
RB_U_WALK1 = ["..d..d..", ".....d.."]
RB_U_WALK2 = ["..d..d..", "..d....."]
RB_U_ATK1 = [
    "b.sSSs..",
    "YsSrrSs.",
    "fsSSSSs.",
    ".rrrrrr.",
    ".rRrrRr.",
    ".rRrrRr.",
    "..d..d..",
    "..d..d..",
]
RB_U_ATK2 = [
    "......Bb",
    "..sSSsb.",
    ".sSrrSy.",
    ".sSSSSf.",
    ".rrrrrr.",
    ".rRrrRr.",
    "..d..d..",
    "..d..d..",
]

RUNEBLADE_FRAMES = {
    "right_idle":  RB_R_BODY + RB_R_STAND,
    "right_walk1": RB_R_BODY + RB_R_WALK1,
    "right_walk2": RB_R_BODY + RB_R_WALK2,
    "right_attack1": RB_R_ATK1,
    "right_attack2": RB_R_ATK2,
    "down_idle":  RB_D_BODY + RB_D_STAND,
    "down_walk1": RB_D_BODY + RB_D_WALK1,
    "down_walk2": RB_D_BODY + RB_D_WALK2,
    "down_attack1": RB_D_ATK1,
    "down_attack2": RB_D_ATK2,
    "up_idle":  RB_U_BODY + RB_U_STAND,
    "up_walk1": RB_U_BODY + RB_U_WALK1,
    "up_walk2": RB_U_BODY + RB_U_WALK2,
    "up_attack1": RB_U_ATK1,
    "up_attack2": RB_U_ATK2,
}

# ================================================================ HEXWEAVER
HW_R_BODY = [
    "...qqpWo",
    "..qpppOo",
    ".qpPkkqn",
    ".qpPkeqn",
    ".ppPPqfn",
    ".pqpPyPn",
    ".pqpPPPn",
]
HW_R_BODY_PULSE = ["...qqpoo", "..qpppOO"] + HW_R_BODY[2:]
HW_R_ATK1 = [
    "...qqp.W",
    "..qpppWo",
    ".qpPkkoO",
    ".qpPkfn.",
    ".ppPPn..",
    ".pqpPyP.",
    ".pqpPPP.",
    ".PPPPPP.",
]
HW_R_ATK2 = [
    "...qqp..........",
    "..qppp......W...",
    ".qpPkkq....oWo..",
    ".qpPkefnnnNOWWWo",
    ".ppPPq.....oWo..",
    ".pqpPyP.....W...",
    ".pqpPPP.........",
    ".PPPPPP.........",
]
HW_D_BODY = [
    "...qq.Wo",
    "..qppqoO",
    ".qpekepn",
    ".ppyypPn",
    ".pqppqPf",
    "ppqppqPn",
    "ppqppqPn",
]
HW_D_ATK1 = [
    "......Wo",
    "...qqWWO",
    "..qppqf.",
    ".qpekep.",
    ".ppyypP.",
    ".pqppqP.",
    "ppqppqP.",
    ".PPPPPP.",
]
HW_D_ATK2 = [
    "...qq...",
    "..qppq..",
    ".qpekep.",
    ".ppyypPf",
    ".pqppqPn",
    "ppqppqPn",
    "ppqppqoW",
    ".PPPPPWW",
]
HW_U_BODY = [
    "Wo.qq...",
    "oOqppq..",
    "nqppppq.",
    "fpqppqp.",
    "npqppqp.",
    "nppyypP.",
    "nppqqpP.",
]
HW_U_ATK1 = [
    "WW.qq...",
    "Wo.ppq..",
    "fqppppq.",
    "npqppqp.",
    "npqppqp.",
    "nppqqpP.",
    "nppqqpP.",
    "N.PPPPP.",
]
HW_U_ATK2 = [
    "...oWo..",
    "...WWW..",
    "..qoWoq.",
    ".qppfpq.",
    ".pqpnqp.",
    ".ppqqpP.",
    ".ppqqpP.",
    ".PPPPPP.",
]

HEXWEAVER_FRAMES = {
    "right_idle":  HW_R_BODY + [".PPPPPPN"],
    "right_walk1": HW_R_BODY_PULSE + ["PPPP.PPN"],
    "right_walk2": HW_R_BODY + ["..PPPPPN"],
    "right_attack1": HW_R_ATK1,
    "right_attack2": HW_R_ATK2,
    "down_idle":  HW_D_BODY + [".PPPPP.N"],
    "down_walk1": recolor(HW_D_BODY[:2], {"W": "o", "o": "O"}) + HW_D_BODY[2:] + ["PPPP...N"],
    "down_walk2": HW_D_BODY + ["...PPPPN"],
    "down_attack1": HW_D_ATK1,
    "down_attack2": HW_D_ATK2,
    "up_idle":  HW_U_BODY + ["N.PPPPP."],
    "up_walk1": recolor(HW_U_BODY[:2], {"W": "o", "o": "O"}) + HW_U_BODY[2:] + ["N.PPP..."],
    "up_walk2": HW_U_BODY + ["N...PPP."],
    "up_attack1": HW_U_ATK1,
    "up_attack2": HW_U_ATK2,
}

# ================================================================ SUNKEN CRYPT
BONE_WISP = {
    "float1": [
        "...g....",
        "..gG..g.",
        ".gGhgGg.",
        ".GbbbbG.",
        ".bgkkgb.",
        ".bbBBbb.",
        "..BbBb..",
        "........",
    ],
    "float2": [
        "......g.",
        ".g..g...",
        ".Gg.Gg..",
        ".gGhhGg.",
        ".GbbbbG.",
        ".bgkkgb.",
        ".bbBBbb.",
        "..BbBb..",
    ],
    "attack": [
        "g..g..g.",
        "Gg.hg.Gg",
        "gGhhhhGg",
        ".GbbbbG.",
        ".bhkkhb.",
        ".bbBBbb.",
        "..BkkB..",
        "..BbbB..",
    ],
}

DROWNED_THRALL = {
    "walk1": [
        ".vvbbv.x",
        ".bbbbbVx",
        ".bckcbVX",
        "..BbBb.X",
        ".bBbBbbX",
        "..BvBv.X",
        "..b..b.X",
        ".bb..bb.",
    ],
    "walk2": [
        ".vvbbv.x",
        ".bbbbbVx",
        ".bckcbVX",
        "..BbBb.X",
        ".bBbBbbX",
        "..BvBv.X",
        "...bb..X",
        "..bb.b..",
    ],
    "attack": [
        "x.x.x...",
        "XxXxX...",
        "..X.vv..",
        "..XbbbbV",
        "..bccbbV",
        ".bBbBbB.",
        "..BvBv..",
        ".bb..bb.",
    ],
}

BRINE_JELLY = {
    "pulse1": [
        "..jjjj..",
        ".jllljJ.",
        ".jlwjjJ.",
        ".JjjjjJ.",
        ".mJmJmJ.",
        ".m.m.m..",
        "..m.m.m.",
        ".M.M.M..",
    ],
    "pulse2": [
        "........",
        "..jjjj..",
        ".jllljJ.",
        "jlwjjjjJ",
        "JJjjjjJJ",
        ".M.MM.M.",
        ".m..m.m.",
        "m..m..m.",
    ],
    "attack": [
        "..jjjj..",
        ".jllljJ.",
        ".jlwwjJ.",
        ".JjwwjJ.",
        "lmJmJmJl",
        "l.l.l.l.",
        ".l.l.l.l",
        "w.w.w.w.",
    ],
}

# ---------- boss: The Tidebound Lich (16x16)
LICH_IDLE1 = [
    "....o..oo..o....",
    "....oO.oo.Oo....",
    ".....oyyyyo.....",
    "....TbbbbbbT....",
    "...TtbgbbgbtT...",
    "...TtbBkkBbtT...",
    "...TttbwwbttT...",
    "..TtuutBBtuutT..",
    ".bTtuutbbtuutTy.",
    "bBTtuutBBtuutTy.",
    ".bTtuuttttuutyGy",
    "..TtuttttttutGgG",
    "..TTtttttttTTyGy",
    "...TtTttTtTtT...",
    "...T.tT.tT.T....",
    "....T..t..T.....",
]
LICH_IDLE2 = edit(recolor(LICH_IDLE1, {"g": "h", "G": "g"}), {
    13: "...TttTtTttTT...",
    14: "....TtT.tTt.T...",
    15: ".....T..T..t....",
})
LICH_CAST1 = edit(LICH_IDLE1, {
    4: "gG.TtbgbbgbtT...",
    5: "Ghg.TtbBkkBbtT..",
    6: "gGb.TttbwwbttT..",
})
LICH_CAST1 = [
    ".g..o..oo..o....",
    "gGg.oO.oo.Oo....",
    ".gb..oyyyyo.....",
    "..b.TbbbbbbT....",
    "..bTtbhbbhbtT...",
    "..bTtbBkkBbtT...",
    "..BTttbwwbttT...",
    "..TtuutBBtuutT..",
    "..TtuutbbtuutTy.",
    "..TtuutBBtuutTy.",
    "..Ttuuttttuutygy",
    "..TtuttttttutghG",
    "..TTtttttttTTygy",
    "...TttTtTttTT...",
    "....TtT.tTt.T...",
    ".....T..T..t....",
]
LICH_CAST2 = [
    "gh.go..oo..o....",
    "hGhgoO.oo.Oo...g",
    "gGg.hoyyyyo..g..",
    ".gbg.ThhhhhT....",
    "g.bTtbhbbhbtT...",
    "..bTtbBkkBbtT..g",
    "..BTttbkkbttT...",
    "..TtuutBBtuutT..",
    "..TtuutbbtuutTy.",
    "g.TtuutBBtuutTy.",
    "..Ttuuttttuutyhy",
    "..TtuttttttuthhG",
    "..TTtttttttTTyhy",
    "...TtTttTtTtT...",
    "...T.tT.tT.T....",
    "....T..t..T.....",
]

# ================================================================ EMBERFORGE DEPTHS
MAGMA_IMP = {
    "flap1": [
        "v.b..b.v",
        "vvbrrbvv",
        "VvMrrMvV",
        ".VrkkrV.",
        "..RrrR..",
        ".r.rr.r.",
        "..R..R..",
        "..m..m..",
    ],
    "flap2": [
        "........",
        "..b..b..",
        "..brrb..",
        "v.MrrM.v",
        "VvrkkrvV",
        "VvRrrRvV",
        ".r.rr.r.",
        "..R..R..",
    ],
    "attack": [
        "v.b..b.v",
        "vvbrrbvv",
        "VvhrrhvV",
        ".VrmmrV.",
        "rrRMMRrr",
        "...hh...",
        "..mMMm..",
        "...mm...",
    ],
}

CINDER_GOLEM_IDLE = [
    "..SssS..",
    ".SMssMs.",
    "SsznzszS",
    "sssnsnss",
    "szsnnszs",
    "s.snsss.",
    ".zs..sz.",
    ".zz..zz.",
]
CINDER_GOLEM = {
    "idle1": CINDER_GOLEM_IDLE,
    "idle2": edit(recolor(CINDER_GOLEM_IDLE, {"n": "m"}), {1: ".ShssMs."}),
    "attack": [
        "Ss.SS.sS",
        "ss.MM.ss",
        ".sSsssS.",
        ".smMMms.",
        ".smhhms.",
        "..smms..",
        ".zs..sz.",
        ".zz..zz.",
    ],
}

SLAG_CRAWLER = {
    "crawl1": [
        "z..cc..z",
        ".zcmmcz.",
        "zcmMMmcz",
        ".cmhMmc.",
        "zcmMmmcz",
        ".zcnncz.",
        "..cMMc..",
        ".z.cc.z.",
    ],
    "crawl2": [
        ".z.cc.z.",
        "z.cmmc.z",
        ".cmMMmc.",
        "zcmhMmcz",
        ".cmMmmc.",
        "z.cnnc.z",
        "..cMMc..",
        "z..cc..z",
    ],
    "attack": [
        ".z.cc.z.",
        "z.cmmc.z",
        ".cmMMmc.",
        "zcmhhmcz",
        ".cmMMmc.",
        "z.cnnc.z",
        ".zcMMcz.",
        "zz.hh.zz",
    ],
}

# ---------- boss: Forgeheart Colossus (16x16)
COLOSSUS_IDLE1 = [
    "..j..........j..",
    "..ij..iiii..ji..",
    "...iijjjjjjii...",
    "....IiMiiMiI....",
    "....IikkkkiI....",
    "..jjiIiiiiIijj..",
    ".jiiiImmmmIiiij.",
    ".iIiiImMMmIiiIi.",
    ".iI.iImMMmIi.Ii.",
    ".jI.IInmmnII.Ij.",
    ".jj.IIiiiiII.jj.",
    "....Ii.II.iI..x.",
    "....ii....ii..x.",
    "...Iii....iiIjjI",
    "...III....IIIiiI",
    "............IIII",
]
COLOSSUS_IDLE2 = edit(recolor(COLOSSUS_IDLE1, {"m": "M", "M": "h", "n": "m"}),
                      {3: "....IihiihiI...."})
COLOSSUS_ATK1 = [
    "..j..........jIj",
    "..ij..iiii..jijI",
    "...iijjjjjjii.x.",
    "....IiMiiMiI..x.",
    "....IikkkkiI.jj.",
    "..jjiIiiiiIiIj..",
    ".jiiiImmmmIiI...",
    ".iIiiImMMmIii...",
    ".iI.iImMMmIi....",
    ".jI.IInmmnII....",
    ".jj.IIiiiiII....",
    "....Ii.II.iI....",
    "....ii....ii....",
    "...Iii....iiI...",
    "...III....III...",
    "................",
]
COLOSSUS_ATK2 = [
    "..j..........j..",
    "..ij..iiii..ji..",
    "...iijjjjjjii...",
    "....IihiihiI....",
    "....IikMMkiI....",
    "..jjiIiiiiIijj..",
    ".jiiiIMMMMIiiij.",
    ".iIiiIMhhMIiiIi.",
    ".iI.iIMhhMIiIi..",
    ".jI.IImMMmIIjj..",
    ".jj.IIiiiiII.x..",
    "....Ii.II.iI.x..",
    "....ii....iiIjjI",
    "..MIii.M..iiIiiI",
    "mhIIIhm.mMIIIIIIm",
    "MmhmMmhmMhmMmhmM",
]
COLOSSUS_ATK2 = [r[:16] for r in COLOSSUS_ATK2]

# ================================================================ TILES
CRYPT_TILES = {
    "floor_a": [
        "LaaALaaA",
        "aaaAaaaA",
        "aaaAaaaA",
        "AAAAAAAA",
        "aALaaALa",
        "aAaaaAaa",
        "aAaaaAaa",
        "AAAAAAAA",
    ],
    "floor_b": [
        "LaaALaaA",
        "aVaAavvA",
        "aaaAaVaA",
        "AAAkAAAA",
        "aALakALa",
        "aAakaAaa",
        "vAaaaAav",
        "AAAAAAvA",
    ],
    "wall": [
        "qqqQqqqQ",
        "qLqQqqqQ",
        "QQQQQQQQ",
        "qQqqqQqq",
        "qQqLqQqq",
        "QQQQQQQQ",
        "aaAaaaAa",
        "AAAAAAAA",
    ],
    "water1": [
        "eeeeeeee",
        "eHHeeeee",
        "eeeHeeeE",
        "eeeeeeee",
        "eeeeeHHe",
        "Eeeeeeeh",
        "eeEeeeee",
        "eeeeeeee",
    ],
    "water2": [
        "eeeeeeee",
        "eeHHeeee",
        "eeeeHeee",
        "Eeeeeeee",
        "eeeeeeHH",
        "eEeeeeee",
        "eeeEeeee",
        "eeeeeeee",
    ],
    "water3": [
        "eeeeeeee",
        "eeeHHeee",
        "eeeeeHee",
        "eEeeeeee",
        "HeeeeeeH",
        "eeEeeeee",
        "eeeeEeee",
        "eeeeeeee",
    ],
    "candle1": [
        "...h....",
        "...g....",
        "..gGg...",
        "...b....",
        "..bbB...",
        "..bbB...",
        ".BbbBB..",
        ".BBBBB..",
    ],
    "candle2": [
        "....h...",
        "...gg...",
        "...Gg...",
        "...b....",
        "..bbB...",
        "..bbB...",
        ".BbbBB..",
        ".BBBBB..",
    ],
}
CRYPT_TILES["water1"] = [r.replace("h", "H") for r in CRYPT_TILES["water1"]]

EMBER_TILES = {
    "floor_a": [
        "LaaALaaA",
        "aaaAaaaA",
        "aaaAaaaA",
        "AAAAAAAA",
        "aALaaALa",
        "aAaaaAaa",
        "aAaaaAaa",
        "AAAAAAAA",
    ],
    "floor_b": [
        "LaaALaaA",
        "aaaAanaA",
        "anaAaaaA",
        "AAAnAAAA",
        "aALanALa",
        "aAanaAaa",
        "aAaaaAaa",
        "AAAAAAAA",
    ],
    "wall": [
        "qqqQqqqQ",
        "qLqQqqqQ",
        "QQQQQQQQ",
        "qQqqqQqq",
        "qQqLqQqq",
        "QQQQQQQQ",
        "aanaaaAa",
        "AAAAAAAA",
    ],
    "lava1": [
        "mmmmnmmm",
        "mMMmmmmn",
        "mmMmmmmm",
        "nmmmmMmm",
        "mmmmMhMm",
        "mmnmmMmm",
        "mmmmmmmn",
        "mMmmnmmm",
    ],
    "lava2": [
        "mmmnmmmm",
        "mmMMmmnm",
        "mmmMmmmm",
        "mmmmmmMm",
        "nmmmmMMm",
        "mmmnmmMh",
        "mmmmmmmm",
        "Mmmmmnmm",
    ],
    "lava3": [
        "mmnmmmmm",
        "mmmMMmmm",
        "nmmmMmmm",
        "mmmmmmmM",
        "mmnmmmMM",
        "mmmmmnmM",
        "hmmmmmmm",
        "MMmmmmnm",
    ],
    "vent1": [
        "LaaALaaA",
        "aaAAAAaA",
        "aAnmmnAA",
        "AAmMMmAA",
        "aAmMMmLa",
        "aAnmmnaa",
        "aaAAAAaa",
        "AAAAAAAA",
    ],
    "vent2": [
        "LaaAMaaA",
        "aaAAhAaA",
        "aAmMMmAA",
        "AAMhhMAA",
        "aAMhhMLa",
        "aAmMMmaa",
        "aaAAAAaa",
        "AAAAAAAA",
    ],
}

# ================================================================ ITEMS
ITEM_GRIDS = {
    "tidecaller_blade": [
        "......lb",
        ".....lcb",
        "....lcb.",
        "...lcb..",
        ".ylcb...",
        "..Yb....",
        ".x.y....",
        "x.......",
    ],
    "emberbrand_greatsword": [
        ".....jMh",
        "....jmMM",
        "...jmMm.",
        "..jmMm..",
        "yjmMm...",
        ".YmM....",
        ".XY.y...",
        "X.......",
    ],
    "staff_of_drowned_stars": [
        "......o.",
        "....yoWo",
        ".....No.",
        "....t.y.",
        "...t....",
        "..t.....",
        ".N......",
        "N.......",
    ],
    "cinderwood_staff": [
        "......m.",
        "....nmhM",
        ".....Xm.",
        "....X.n.",
        "...V....",
        "..X.....",
        ".V......",
        "X.......",
    ],
    "runeplate_armor": [
        ".dS..Sd.",
        "dSSssSSd",
        "dsSSSSsd",
        ".sSgGSs.",
        ".sSGgSs.",
        ".dsSSsd.",
        ".dYyyYd.",
        "..dssd..",
    ],
    "hexsilk_robe": [
        "..qkkq..",
        ".qpkkpq.",
        "qppyyppq",
        "qPpppPpq",
        ".pPpqpP.",
        ".ppPqpp.",
        ".pPpqPp.",
        ".yyyyyy.",
    ],
    "ring_of_tides": [
        "...cc...",
        "..clcC..",
        "..CccC..",
        ".yYCCYy.",
        ".Y....Y.",
        ".y....y.",
        "..yYYy..",
        "........",
    ],
    "emberheart_ring": [
        "...mm...",
        "..mhmn..",
        "..nmmn..",
        ".jinnij.",
        ".i....i.",
        ".j....j.",
        "..jiij..",
        "........",
    ],
    "runic_aegis": [
        ".dsSSsd.",
        "dsSggSsd",
        "dSgSSgSd",
        "dSSggSSd",
        ".dSgGSd.",
        ".dsGgsd.",
        "..dssd..",
        "...dd...",
    ],
    "grimoire_of_ash": [
        ".yRRRRu.",
        ".RRmRRu.",
        ".RmMmRu.",
        ".RRmRRu.",
        ".RmRmRu.",
        ".RRRRRu.",
        ".yRRRRU.",
        "..UUUUU.",
    ],
    "health_potion": [
        "...vV...",
        "...uu...",
        "..uzzu..",
        ".uzHzzu.",
        ".uzzzzu.",
        ".uZzzZu.",
        "..uZZu..",
        "........",
    ],
    "mana_potion": [
        "...vV...",
        "...uu...",
        "..uaau..",
        ".uaFaau.",
        ".uaaaau.",
        ".uAaaAu.",
        "..uAAu..",
        "........",
    ],
    "potion_of_might": [
        "...vV...",
        "...uu...",
        "..uMMu..",
        ".uMhMMu.",
        ".uMMMMu.",
        ".umMMmu.",
        "..ummu..",
        "........",
    ],
    "soul_lantern": [
        "...yy...",
        "..y..y..",
        ".yYYYYy.",
        ".YeWeeY.",
        ".YeeeEY.",
        ".YEeEEY.",
        ".yYYYYy.",
        "...YY...",
    ],
    "colossus_core": [
        "...ii...",
        "..iMMi..",
        ".iMhhMi.",
        "iMhMMmmI",
        "iMMmmnmI",
        ".imnnmI.",
        "..ImmI..",
        "...II...",
    ],
    "loot_bag_brown": [
        "...yy...",
        "..vVVv..",
        "...vv...",
        "..KvvV..",
        ".KvvvvV.",
        ".vvvvvV.",
        ".VvvvVV.",
        "..VVVV..",
    ],
}
ITEM_GRIDS["loot_bag_purple"] = recolor(ITEM_GRIDS["loot_bag_brown"], {"v": "p", "V": "P", "K": "q"})
ITEM_GRIDS["loot_bag_white"] = recolor(ITEM_GRIDS["loot_bag_brown"], {"v": "S", "V": "s", "K": "l", "y": "c"})

ITEM_TIER = {  # used for shine strength / preview label
    "soul_lantern": "boss", "colossus_core": "boss", "loot_bag_white": "boss",
}

# ================================================================ PROJECTILES (point right)
PROJECTILES = {
    "rune_slash": [[
        "..GGg...",
        "....gb..",
        ".....gb.",
        ".....gb.",
        ".....gb.",
        ".....gb.",
        "....gb..",
        "..GGg...",
    ], [
        "..ggb...",
        "....bw..",
        ".....bw.",
        ".....bw.",
        ".....bw.",
        ".....bw.",
        "....bw..",
        "..ggb...",
    ]],
    "hex_bolt": [[
        "........",
        "......o.",
        "..P.oOWo",
        ".PpoOWWW",
        ".PpoOWWW",
        "..P.oOWo",
        "......o.",
        "........",
    ], [
        "......W.",
        "........",
        ".P..oOo.",
        "..pPoWWo",
        "..pPoWWo",
        ".P..oOo.",
        "........",
        "......W.",
    ]],
    "wisp_flame": [[
        "........",
        "........",
        "..E.ee..",
        ".EeehhE.",
        ".EeehhE.",
        "..E.ee..",
        "........",
        "........",
    ], [
        "........",
        "....e...",
        ".E.eheE.",
        "..eehhe.",
        "E.eehhe.",
        ".E..eeE.",
        "........",
        "........",
    ]],
    "tide_wave": [[
        "...cC...",
        ".....c..",
        "......cW",
        "......cW",
        "......cW",
        "......cW",
        ".....c..",
        "...cC...",
    ], [
        "..cC....",
        "....cW..",
        ".....cW.",
        "......W.",
        "......W.",
        ".....cW.",
        "....cW..",
        "..cC....",
    ]],
    "fireball": [[
        "........",
        "....mM..",
        ".n.mMHM.",
        "n.mmMHHM",
        ".nmmMHHM",
        "n..mMHM.",
        "....mM..",
        "........",
    ], [
        "........",
        "...nmM..",
        "n.mmMHM.",
        ".nmMHHHM",
        "n.mmMHHM",
        ".n.mMHM.",
        "....mM..",
        "........",
    ]],
    "slag_shard": [[
        "........",
        "...zs...",
        "..zsSmM.",
        "n.zsSMHM",
        ".nzsSMHM",
        "..zsSmM.",
        "...zs...",
        "........",
    ], [
        "........",
        "....zs..",
        "n.zsSmM.",
        ".nzsSMHM",
        "n.zsSMHM",
        "..zsSmM.",
        "....zs..",
        "........",
    ]],
}

# ================================================================ EFFECTS
EFFECTS = {
    "hit_spark": [[
        "........",
        "........",
        "...w....",
        "..wyw...",
        "...w....",
        "........",
        "........",
        "........",
    ], [
        "........",
        ".y...y..",
        "...w....",
        ".wwYww..",
        "...w....",
        ".y...y..",
        "........",
        "........",
    ], [
        "y.....y.",
        "........",
        "...Y....",
        "..Y.Y...",
        "...Y....",
        "........",
        "y.....y.",
        "........",
    ]],
    "death_poof": [[
        "........",
        "........",
        "...YY...",
        "..YwwY..",
        "..YwwY..",
        "...YY...",
        "........",
        "........",
    ], [
        "........",
        "..YYYY..",
        ".YwwwwY.",
        ".Yww.wY.",
        ".Yw..wY.",
        ".YwwwwY.",
        "..YYYY..",
        "........",
    ], [
        "..Y..Y..",
        ".Y....Y.",
        "Y..zz..Y",
        "..z..z..",
        "..z..z..",
        "Y..zz..Y",
        ".Y....Y.",
        "..Y..Y..",
    ], [
        "z......z",
        "........",
        "........",
        "...z....",
        "....z...",
        "........",
        "........",
        "z......z",
    ]],
    "level_up_ring": [[
        "........",
        "........",
        "..yyyy..",
        ".y....y.",
        ".y....y.",
        "..yyyy..",
        "........",
        "........",
    ], [
        "...yy...",
        ".yyMMyy.",
        "yM....My",
        "y......y",
        "y......y",
        "yM....My",
        ".yyMMyy.",
        "...yy...",
    ], [
        ".M....M.",
        "M......M",
        "........",
        "........",
        "........",
        "........",
        "M......M",
        ".M....M.",
    ]],
}
