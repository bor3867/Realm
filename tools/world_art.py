"""World art: tiles, objects (obstacles/portals/bags), item icons, projectiles.

    py tools/world_art.py
Writes art/world/*.png + art/world/world.json (index of every cell).
"""
import json
import os
import random
import sys

sys.path.insert(0, os.path.dirname(__file__))
from pixlib import hex_rgba, write_png, check, blank, rows  # noqa: E402

OUT = os.path.join(os.path.dirname(__file__), '..', 'art', 'world')
T = (0, 0, 0, 0)
OUTLINE = '#160F14'


def lighten(hexc, k=0.55):
    r, g, b = (int(hexc[i:i + 2], 16) for i in (1, 3, 5))
    return '#%02X%02X%02X' % tuple(round(v + (255 - v) * k) for v in (r, g, b))


def rgba_grid(grid, pal):
    return [[T if ch == '.' else hex_rgba(pal[ch]) for ch in r] for r in grid]


def strip(cells, w, h, cols):
    """cells: list of rgba grids -> sheet rgba (cols wide)."""
    n = len(cells)
    R = (n + cols - 1) // cols
    out = [[T] * (cols * w) for _ in range(R * h)]
    for k, c in enumerate(cells):
        ox, oy = (k % cols) * w, (k // cols) * h
        for y in range(h):
            for x in range(w):
                out[oy + y][ox + x] = c[y][x]
    return out


# ================================================================ TILES 16x16
TILE_PALS = {
    'water':    ('#1B4A6E', '#163C5A', '#3C7EA8', '#8CC8E8'),
    'deep':     ('#0F2A44', '#0B2036', '#1B4A6E', '#3C7EA8'),
    'sand':     ('#C9A86A', '#A8874F', '#E0C58C', '#8C6E3E'),
    'fen':      ('#3E5E2E', '#2E4A22', '#5A7E3A', '#7A9A4A'),
    'mud':      ('#4A3E2A', '#382E1E', '#5E5038', '#2E4A22'),
    'snow':     ('#B8C8D8', '#94A6BA', '#DDE8F2', '#7A8CA4'),
    'runefloor': ('#5A5670', '#46435A', '#726D8E', '#3BEFFF'),
    'runeglyph': ('#5A5670', '#46435A', '#726D8E', '#3BEFFF'),
    'ash':      ('#3A3438', '#2A2528', '#4E464C', '#6E2A1A'),
    'obsidian': ('#1E1A22', '#141118', '#2E2834', '#F2641A'),
    'marble':   ('#D8D2C4', '#BDB5A4', '#EEE9DE', '#C98A22'),
    'forge':    ('#3A2A2A', '#2A1E1E', '#4E3A36', '#8C2A12'),
    'forgewall': ('#2E2A38', '#1E1A26', '#4F4B60', '#8E8AA6'),
    'lava':     ('#C0400E', '#8C2A12', '#F2641A', '#FFC94A'),
    'void':     ('#0A080C', '#0A080C', '#0A080C', '#0A080C'),
}


def tile(name, frame=0, variant=0):
    base, dark, light, accent = (hex_rgba(c) for c in TILE_PALS[name])
    rnd = random.Random(name + str(variant))
    g = [[base] * 16 for _ in range(16)]

    def cluster(col, n, size=2):
        for _ in range(n):
            x, y = rnd.randrange(16), rnd.randrange(16)
            for k in range(size):
                g[(y + (k // 2)) % 16][(x + k) % 16] = col
    if name in ('water', 'deep', 'lava'):
        for y in range(16):
            for x in range(16):
                ph = (x + frame * 4 + (y // 4) * 6) % 16
                if y % 4 == 1 and ph < 4:
                    g[y][x] = light
                elif y % 4 == 3 and (ph + 8) % 16 < 3:
                    g[y][x] = dark
        if name == 'lava':
            cluster(accent, 3, 2)
        elif name == 'water':
            cluster(accent, 1, 1)
    elif name in ('forge', 'forgewall', 'marble'):
        for y in range(16):
            for x in range(16):
                off = 4 if (y // 4) % 2 else 0
                if y % 4 == 3 or (x + off) % 8 == 7:
                    g[y][x] = dark
                elif y % 4 == 0 and name == 'forgewall':
                    g[y][x] = light
        if name == 'marble':
            for k in range(16):
                g[7][k] = accent if k % 4 == 1 else g[7][k]
        else:
            cluster(accent if name == 'forge' else light, 2, 1)
    elif name in ('runefloor', 'runeglyph'):
        for y in range(16):
            for x in range(16):
                if y in (0, 15) or x in (0, 15):
                    g[y][x] = dark
        cluster(light, 3, 2)
        if name == 'runeglyph':
            for x, y in ((7, 4), (8, 5), (7, 6), (8, 7), (7, 8), (8, 9), (7, 10), (5, 7), (6, 7), (9, 7), (10, 7)):
                g[y][x] = accent
    elif name == 'void':
        pass
    else:
        cluster(dark, 6, 3)
        cluster(light, 5, 2)
        cluster(accent, 1 if name not in ('ash', 'obsidian') else 3, 1)
    return g


TILES = [('water', 2), ('deep', 2), ('sand', 1), ('fen', 1), ('mud', 1), ('snow', 1),
         ('runefloor', 1), ('runeglyph', 1), ('ash', 1), ('obsidian', 1), ('marble', 1), ('forge', 1),
         ('forgewall', 1), ('lava', 2), ('void', 1)]


# ================================================================ OBJECTS 16x16
OBJ_PAL = {'o': OUTLINE, 'b': '#E8DCC0', 'B': '#A89A7C', 'w': '#5A4030', 'W': '#8A6A48',
           's': '#5E5A72', 'S': '#9A96B0', 'c': '#3BEFFF', 'C': '#CFFFFF', 'g': '#C98A22', 'G': '#F2C14E',
           'Y': '#FFEB8F', 'k': '#2E2A38', 'i': '#4F4B60', 'I': '#8E8AA6', 'M': '#F2641A',
           'v': '#2E6B55', 'V': '#4FA37E', 'r': '#6E1A2C', 'm': '#8C2A12'}
OBJECTS = {
    'whale_rib': ["................", "....oooo........", "...obbbbo.......", "..obBoobbo......",
                  "..obo..obbo.....", ".obo....obo.....", ".obo.....obo....", ".obo.....obo....",
                  "obBo......obo...", "obo.......obBo..", "obo........obo..", "obo........obo..",
                  "oBo........oBo..", "obo.........obo.", "ooo.........ooo.", "................"],
    'dead_tree': ["......o.........", ".o...owo...o....", ".wo..owo..ow....", "..wo.oWo.ow.....",
                  "...woWWwow......", "....oWWwo.......", ".....oWwo..o....", "..o..oWwo.ow....",
                  "...wooWwoow.....", "....owWwwo......", ".....oWwo.......", ".....oWwo.......",
                  ".....oWwwo......", "....oWWwwwo.....", "...oooooooooo...", "................"],
    'rune_pillar': ["......oooo......", ".....oSSSso.....", ".....oSSsso.....", ".....oScsso.....",
                    ".....oSCsso.....", ".....oScsso.....", ".....oSSsso.....", ".....oSsSso.....",
                    ".....oScsso.....", ".....oSSsso.....", ".....oSSsso.....", "....oSSSssso....",
                    "....oSSsssso....", "...oSSSSsssso...", "...oooooooooo...", "................"],
    'fallen_head': ["................", "................", ".....oooooo.....", "....oIIIiiio....",
                    "...oIIoiiokio...", "...oIiiiiiiko...", "..oIIoMoiMoiko..", "..oIiiiiiiiiko..",
                    "..oIiooooooiko..", "..oiiokkkkoiko..", "..okiiiiiiiikk..", "...okkiiiiikko..",
                    "....okkkkkkko...", "..oooooooooooo..", "................", "................"],
    'brazier': ["................", ".......Y........", "......YGY.......", ".....YGMGY......",
                "......GMG.......", "....oooooooo....", "....ogGgGgGo....", ".....oggggo.....",
                "......ogGo......", "......ogGo......", "......ogGo......", ".....oggggo.....",
                "....ogGgGgGo....", "....oooooooo....", "................", "................"],
    'anvil_block': ["................", "................", "................", "..oooooooooooo..",
                    ".oIIIIIIIIIIIo..", "oiiiiiiiiiiiiko.", ".ooiiiiiiiikko..", "...ookiiikko....",
                    ".....okiiko.....", ".....okiiko.....", "....okkkkkko....", "...okkiiiiikko..",
                    "...okkkkkkkkko..", "...oooooooooooo.", "................", "................"],
    'vault_chest': ["................", "................", "................", "..oooooooooooo..",
                    ".oGgGgGgGgGgGgo.", ".owWWWWWWWWWWwo.", ".owWWWwGGwWWWwo.", ".oooooogGoooooo.",
                    ".owWWWWYYWWWWwo.", ".owWWWWWWWWWWwo.", ".owWWWWWWWWWWwo.", ".oGgGgGgGgGgGgo.",
                    ".owwwwwwwwwwwwo.", ".oooooooooooooo.", "................", "................"],
    'fountain': ["................", ".......cc.......", "......c..c......", ".....c.oo.c.....",
                 "......oSSo......", "......oSso......", "...oooSSssooo...", "..oSSSSSssssSo..",
                 ".oSccccccccccSo.", ".oScCcccccCccso.", ".oSccccCccccsso.", "..oSSSSSsssss o.".replace(' ', 'o'),
                 "...oooooooooo...", "................", "................", "................"],
}


def portal(kind, frame):
    cols = {'realm': ('#3BEFFF', '#6A34C0', '#C8FAFF'), 'dungeon': ('#F2641A', '#8C2A12', '#FFC94A'),
            'nexus': ('#F2C14E', '#C98A22', '#FFFDF0'), 'closed': ('#4F4B60', '#2E2A38', '#8E8AA6'),
            'chapel': ('#FF8FBF', '#2B6E6A', '#FFE3F0'), 'heart': ('#FF4A5A', '#6A0A1A', '#F2C14E'),
            'vault': ('#B57CFF', '#3A1A6A', '#F4EDFF')}[kind]
    pal = dict(OBJ_PAL, x=cols[0], X=cols[1], z=cols[2])
    g = blank(16, 16)
    for y in range(1, 16):
        for x in range(2, 14):
            dx = x - 7.5
            top = 1 + (dx * dx) / 9.0
            if y < top:
                continue
            inner = y >= top + 2 and 4 <= x <= 11 and y <= 14
            if inner:
                k = (int(abs(dx)) + y + frame * 2) % 4
                g[y][x] = 'z' if k == 0 else ('x' if k < 3 else 'X')
            else:
                g[y][x] = 'S' if (x + y) % 3 else 's'
    for x in range(1, 15):
        g[15][x] = 'o'
    from pixlib import outline
    outline(g)
    return rgba_grid(rows(g), pal)


BAG_SHAPE = ["................", "................", "................", ".....o.oo.o.....",
             "......oaao......", ".....obbbbo.....", "....obccbbbo....", "...obcbbbbbbo...",
             "..obcbbbbbbbbo..", "..obbbbbbbbbbo..", "..obbbbdbbbbbo..", "..oabbbbbbbbao..",
             "...oaaaaaaaao...", "....oooooooo....", "................", "................"]
# RotMG bags: only three. Brown for the everyday, purple for the good stuff, white for relics (mythics ride in a
# white bag with a gold beam). Drawn as 8x8 art after the RotMG pass (see BAG8 below); these are placeholders.
BAGS = {
    'brown': ('#3A2618', '#6A4428', '#9A6A40', '#C8A070'),
    'purple': ('#3A1A5A', '#6A3AA8', '#9E70E0', '#E0CCFF'),
    'white': ('#8AA0C0', '#C8D4E8', '#F0F4FC', '#FFFFFF'),
    'starfall': ('#18204A', '#2A3A7A', '#6A8AE8', '#FFE45C'),
    'divine': ('#140A1E', '#2A1A3A', '#5A3A7A', '#F2C14E'),
}
SPECIAL_BAGS = {}

# ================================================================ ITEM ICONS 16x16
ICONS = {
    'gauntlet': ["................", "................", "......oooo......", ".....obccbo.....",
                 "....obccbbbo....", "...obcbbbbbbo...", "...obbbbbbbbo...", "...odbdbdbdbo...",
                 "...obbbbbbbao...", "...oaaaaaaaao...", "....obbbbbao....", "....oaccbbao....",
                 "....obbbbbao....", ".....oooooo.....", "................", "................"],
    'tongs': ["................", "..........oooo..", ".........oddddo.", "........obddddo.",
              ".......obcoddo..", "......obco.oo...", ".....obco.......", "....obco........",
              "...obco.........", "..obcoo.........", ".obcobo.........", ".obo.obo........",
              "obo...obo.......", "oco....oco......", "oo......oo......", "................"],
    'sunrod': ["................", "......oooo......", "....oodccdoo....", "...odco..ocdo...",
               "...oco....oco...", "...odco..ocdo...", "....oodccdoo....", "......obao......",
               "......obao......", "......obao......", "......obao......", "......obao......",
               "......obao......", "......oooo......", "................", "................"],
    'bellows': ["................", "........o.......", ".......oco......", ".......obo......",
                ".....ooobooo....", "....obcccccbo...", "...obcbbbbbbbo..", "...oaaaaaaaaao..",
                "...obbbbbbbbbo..", "...oaaaaaaaaao..", "...obbbdbbbbbo..", "....obbbbbbbo...",
                ".....oaaaaao....", "......obbbo.....", "......ooooo.....", "................"],
    'seal': ["................", "................", "................", "................",
             "..oooooooooooo..", ".occcccccccccbo.", "obbbbbbbbbbbbao.", ".oaabbbdbbbbao..",
             "...oaabbbbaao...", ".....obbbbo.....", ".....oaaaao.....", "....obbbbbbo....",
             "...obbbbbbbbo...", "...oooooooooo...", "................", "................"],
    'halo': ["................", ".......dd.......", "......oooo......", "....oocccboo....",
             "...ocbbooobbo...", "..dcbo....obcd..", "...cbo....obc...", "...obo....oba...",
             "..dcbo....obad..", "...ocbbooobao....".replace('o....', 'o...'), "....ooaaaaoo....",
             "......oooo......", ".......dd.......", "................", "................", "................"],
    'plate': ["................", "................", "...ooo....ooo...", "..occbo..obcco..",
              "..obbbboobbbbo..", "..obcbbbbbbbbo..", "...obbbbbbbbo...", "...obbbdbbbbo...",
              "...oabbbbbbao...", "...oaaaaaaaao...", "...obbbbbbbbo...", "....obbbbbbo....",
              "....oaaaaaao....", ".....oooooo.....", "................", "................"],
    'coat': ["................", "................", ".oooo...........", "occcco.ooooo....",
             "occccooccccco...", "obcccccccccbo...", ".obbbbbbbbbbo...", "..obbbbdbbbbo...",
             "..obbbbbbbbbo...", "..oaaaaaaaaao...", "..obbbbbbbbbo...", "..obbbbbbbbbo...",
             "..oaaaaaaaaao...", "..ooooooooooo...", "................", "................"],
    'vestment': ["................", "......oooo......", ".....occcco.....", "....obbdbbbo....",
                 "....obbdbbbo....", "...obbbdbbbbo...", "...obbbdbbbbo...", "..obbbbdbbbbbo..",
                 "..obbbbdbbbbbo..", ".obbbbbdbbbbbbo.", ".oaaaaadaaaaaao.", "..oooooooooooo..",
                 "................", "................", "................", "................"],
    'ring': ["................", "................", "................", "................",
             "......oooo......", ".....oddddo.....", "......oddo......", ".....oobboo.....",
             "....obo..obo....", "...obo....oco...", "...oco....obo...", "...obo....obo...",
             "....obo..oao....", ".....oobaoo.....", "......oooo......", "................"],
    'hammer': ["................", ".......ooooooo..", "......occcccbbo.", "......obbdbbbao.", ".......oaaaaao..",
               ".........oao....", "........oao.....", ".......oao......", "......oao.......", ".....oao........",
               "....oao.........", "...oao..........", "..odo...........", "..oo............", "................", "................"],
    'psalter': ["................", "................", "...oooooooooo...", "..obbbbbbbbbbo..", "..obbbbddbbbbo..",
                "..obbbdccdbbbo..", "..obbdccccdbbo..", "..obbbdccdbbbo..", "..obbbbddbbbbo..", "..obbbbbbbbbbo..",
                "..oaaaaaaaaaao..", "..occcccccccco..", "..oooooooooooo..", "................", "................", "................"],
    'starshard': ["................", ".......d........", "......dcd.......", ".....dcccd......", "......dcd.......",
                  ".......d........", "......oooo......", ".....oobboo.....", "....obo..obo....", "...obo....oco...",
                  "...oco....obo...", "...obo....obo...", "....obo..oao....", ".....oobaoo.....", "......oooo......", "................"],
    'head': ["................", "................", "................", "....oooooooo....", "...occbbbbbbo...",
             "...ocbbbbbbao...", "...obdbbdbbao...", "...obbbbbbbao...", "...obbooobbao...", "...oabbbbbbao...",
             "....oabbbbao....", ".....oooooo.....", "................", "................", "................", "................"],
    'wick': ["................", ".......d........", "......dcd.......", "......dcd.......", ".......o........",
             "....oooooooo....", "....occbbbbo....", "....ocbbbbao....", "....obbbbbao....", "....obbbbbao....",
             "....obbbbbao....", "...ocbbbbbbao...", "..oooooooooooo..", "................", "................", "................"],
    'potion': ["................", "................", "......oooo......", "......oaao......",
               "......obbo......", ".....ocddco.....", "....ocddddco....", "...ocddddddco...",
               "...oddddddddo...", "...oddddddddo...", "...oddddddddo...", "....oddddddo....",
               ".....oooooo.....", "................", "................", "................"],
}
TIER_RAMPS = [  # a dark, b mid, c light, d gem   (saturated so tiers read at a glance)
    ('#5A2E1A', '#9A5428', '#D48A4A', '#F2C08A'),   # T0 rust
    ('#3A4054', '#6A7490', '#AEB8D0', '#E4EAF6'),   # T1 iron
    ('#6A3E0E', '#B07418', '#EAB04A', '#FFE08A'),   # T2 bronze
    ('#34506E', '#6890BA', '#B8D4F0', '#F0F8FF'),   # T3 steel
    ('#145A44', '#28A07A', '#6EE0B0', '#C8FFE4'),   # T4 verdigris
    ('#14246E', '#2E58D8', '#78A8FF', '#D0E2FF'),   # T5 cobalt
    ('#6A0A20', '#C41E40', '#FF5E78', '#FFD0D8'),   # T6 crimson
    ('#3E146E', '#7A30D8', '#B888FF', '#EEDDFF'),   # T7 violet
    ('#7A4E06', '#D89A14', '#FFD650', '#FFF6C8'),   # T8 sun-gold
    ('#1A1420', '#3A3048', '#6A5C82', '#FF7A1A'),   # T9 obsidian-ember
    ('#3A5A7A', '#8AC8E8', '#E8FAFF', '#38F0FF'),   # T10 rune-white
    ('#4A0A0A', '#A01818', '#FFBE40', '#FFF0A0'),   # T11 blood-gold (armour only)
]

TYPE_TIERS = {'sword': 11, 'dagger': 11, 'bow': 11, 'staff': 11, 'wand': 11, 'heavy': 12, 'leather': 12, 'robe': 12,
              'bellows': 6, 'seal': 6, 'halo': 6, 'reliquary': 6, 'hookline': 6, 'mirror': 6, 'kite': 6, 'stopwatch': 6, 'ring': 6,
              'runeward': 6, 'hex': 6, 'skyfall': 6}
# relics drawn on a retired per-class shape now use their RotMG family's icon
BASE_REMAP = {'gauntlet': 'sword', 'tongs': 'sword', 'hammer': 'sword', 'head': 'sword', 'sunrod': 'wand', 'psalter': 'wand',
              'pendulum': 'wand', 'lantern': 'staff', 'coil': 'staff', 'harpoon': 'bow', 'rapier': 'dagger', 'plate': 'heavy',
              'coat': 'heavy', 'oilskin': 'leather', 'glassmail': 'leather', 'vestment': 'robe', 'shroud': 'robe',
              'stormcloak': 'robe', 'brasscoat': 'robe'}
POTIONS = {'hp': '#D8283C', 'mp': '#2E5AE8', 'life': '#F2D8E6', 'mana': '#9ADCFF', 'att': '#E8601A',
           'def': '#5A5A6E', 'spd': '#3AC85A', 'dex': '#F0C030', 'vit': '#B02040', 'wis': '#8A4AE0'}
# untiered relics: (id, base icon, ramp)
UT = [
    *[(i, 'art8', None) for i in ('pet_egg_common', 'pet_egg_uncommon', 'pet_egg_rare', 'pet_egg_legendary', 'vault_chest')],
    *[(f'key_{d}', 'art8', None) for d in ('chapel', 'crypt', 'forge', 'ember', 'scriptorium', 'heart', 'throne', 'hive', 'theatre', 'spire', 'dream')],
    *[(i, 'art8', None) for i in ('queens_stinger', 'honeyguard_band', 'maestros_baton', 'the_last_curtain', 'stringcutter', 'wyrmglass_wand',
                                  'prismglass_mantle', 'the_seventh_colour', 'lullaby_staff', 'nightlight_ring', 'the_waking_bell')],
    # the sprite pack's relics (the Sunken Crypt and the Emberforge Depths)
    *[(i, 'pack', None) for i in ('tidecaller_blade', 'emberbrand_greatsword', 'staff_of_drowned_stars', 'cinderwood_staff', 'runeplate_armor',
                                  'hexsilk_robe', 'ring_of_tides', 'emberheart_ring', 'runic_aegis', 'grimoire_of_ash', 'soul_lantern', 'colossus_core')],
    ('knuckle_of_the_unstruck', 'gauntlet', ('#120C10', '#4F4B60', '#8E8AA6', '#FFC94A')),
    ('billet_of_the_first_oath', 'tongs', ('#2E2A38', '#8E8AA6', '#FFF6C8', '#F2641A')),
    ('the_last_noon', 'halo', ('#6A1028', '#F2C14E', '#FFFDF0', '#B0213F')),
    ('pilgrims_pearl', 'ring', ('#2B6E6A', '#5FB3A1', '#E8DCC0', '#FF8FBF')),
    ('bell_of_the_taken', 'ring', ('#13201E', '#4FA37E', '#A6E8C4', '#5EF0FF')),
    ('rime_headsman_plate', 'plate', ('#0E1830', '#5FA8D8', '#F0FCFF', '#2A6FB0')),
    ('censer_of_absolution', 'bellows', ('#120A12', '#5B5866', '#A9A6B8', '#B98CFF')),
    # reliquary (biome relics)
    ('salt_widows_veil', 'vestment', ('#8AA0B4', '#B8C8D4', '#F0F6FA', '#2E5A3A')),
    ('trap_hound_collar', 'ring', ('#3A2618', '#6A4A30', '#C8B890', '#2FE0C8')),
    ('hymn_of_the_mire', 'bellows', ('#2A3324', '#4A5A3A', '#8DB03A', '#D4FF5A')),
    ('antler_crown', 'ring', ('#5A4A3A', '#8A7A6A', '#E8E4D8', '#3BEFFF')),
    ('the_turning_verse', 'seal', ('#1F2E5E', '#5A5A9A', '#C9CCD8', '#3BEFFF')),
    ('eaten_halo', 'halo', ('#0E0A0E', '#2A2430', '#C98A22', '#E2343F')),
    # urn (realm boss uniques)
    ('abbots_claw', 'gauntlet', ('#5A1A14', '#D4583C', '#FFB48A', '#FFE3F0')),
    ('pearl_of_the_drowned_mass', 'ring', ('#2B6E6A', '#5FB3A1', '#FFE3F0', '#FF8FBF')),
    ('wick_of_the_mother', 'wick', ('#7A7060', '#E8E0C8', '#FFFFFF', '#D4FF5A')),
    ('tallow_vestment', 'vestment', ('#7A7060', '#B8AE94', '#E8E0C8', '#8DB03A')),
    ('orrery_seal', 'seal', ('#0E1530', '#3A57A8', '#CFFFFF', '#3BEFFF')),
    ('starless_band', 'ring', ('#0E1530', '#1F2E5E', '#5FA8D8', '#F0FCFF')),
    ('penitents_head', 'head', ('#4A4458', '#A8A0B8', '#E4DEEC', '#FF4A5A')),
    ('gilded_penance', 'plate', ('#6A4A0E', '#A8A0B8', '#E4DEEC', '#F2C14E')),
    # heralds + more boss uniques + dungeons
    ('heralds_conch', 'bellows', ('#3A0E24', '#C8508A', '#FFE3F0', '#5FB3A1')),
    ('bellringers_rope', 'ring', ('#5A4030', '#8A6A48', '#E3B95A', '#D4FF5A')),
    ('rime_standard', 'plate', ('#0E1830', '#5FA8D8', '#F0FCFF', '#3BEFFF')),
    ('penitents_scourge', 'gauntlet', ('#3A2808', '#C98A22', '#FFF4C2', '#B0213F')),
    ('rose_window_vestment', 'vestment', ('#2B6E6A', '#FF8FBF', '#FFE3F0', '#3BEFFF')),
    ('tallow_tongs', 'tongs', ('#4A4434', '#B8AE94', '#E8E0C8', '#D4FF5A')),
    ('orrery_rod', 'sunrod', ('#0E1530', '#3A57A8', '#CFFFFF', '#3BEFFF')),
    ('kintsugi_band', 'ring', ('#4A4458', '#A8A0B8', '#E4DEEC', '#F2C14E')),
    ('unstruck_anvil', 'seal', ('#120C10', '#4F4B60', '#C4C0D8', '#F2641A')),
    ('furnace_heart_coat', 'coat', ('#24503F', '#3A8066', '#7AC4A0', '#F2641A')),
    ('abbots_crozier', 'sunrod', ('#2B4E5A', '#A8792A', '#F2C14E', '#FF8FBF')),
    ('stained_glass_halo', 'halo', ('#3A1A6A', '#FF8FBF', '#3BEFFF', '#FFE45C')),
    ('tidewoven_coat', 'coat', ('#173F60', '#2B6E6A', '#7EC0E4', '#E8DCC0')),
    ('drowned_bell', 'ring', ('#173F60', '#4E7A86', '#8AB4BE', '#E3B95A')),
    ('godheart_knuckle', 'gauntlet', ('#6A0A1A', '#B0213F', '#F2C14E', '#FFEB8F')),
    ('godheart_tongs', 'tongs', ('#6A0A1A', '#B0213F', '#F2C14E', '#FFEB8F')),
    ('godheart_scepter', 'sunrod', ('#6A0A1A', '#B0213F', '#F2C14E', '#FFEB8F')),
    ('godforged_plate', 'plate', ('#6A0A1A', '#C8C0B0', '#F2C14E', '#FF4A5A')),
    ('heartstring_vestment', 'vestment', ('#6A0A1A', '#B0213F', '#F2C14E', '#FFEB8F')),
    ('heartbreak_coat', 'coat', ('#6A0A1A', '#B0213F', '#F2C14E', '#FF4A5A')),
    ('crown_of_the_fallen', 'ring', ('#6A0A1A', '#C98A22', '#F2C14E', '#FF4A5A')),
    # starfall (mythic)
    ('hammer_that_never_fell', 'hammer', ('#120E14', '#5A5068', '#FFF6C8', '#FF7A1A')),
    ('starfall_knuckles', 'gauntlet', ('#0E1530', '#3BC8E8', '#FFFFFF', '#8AF6FF')),
    ('sunless_psalter', 'psalter', ('#0E0A0E', '#3A1A6A', '#F2C14E', '#FFFDF0')),
    ('shard_of_the_first_star', 'starshard', ('#0E1530', '#3BC8E8', '#FFFFFF', '#8AF6FF')),
    # Summoner + Harpooner relics, second-wave relics
    ('lantern_of_the_last_watch', 'lantern', ('#1A2A2E', '#4F4B60', '#9A96B4', '#FFC94A')),
    ('choir_of_bones', 'reliquary', ('#3A3048', '#8E8AA6', '#F0FCFF', '#5EF0C8')),
    ('gravewardens_pall', 'shroud', ('#120E18', '#2E2840', '#6A5C82', '#5EF0C8')),
    ('the_hollow_psalm', 'reliquary', ('#6A0A1A', '#B0213F', '#F2C14E', '#FF4A5A')),
    ('leviathan_tine', 'harpoon', ('#173F60', '#5FB3A1', '#E8DCC0', '#FF8FBF')),
    ('drowned_mans_line', 'hookline', ('#173F60', '#4E7A86', '#8AB4BE', '#5EF0C8')),
    ('whalers_slicker', 'oilskin', ('#3A2618', '#6A4A30', '#C8B890', '#3BEFFF')),
    ('kraken_bane', 'harpoon', ('#6A0A1A', '#B0213F', '#F2C14E', '#3BEFFF')),
    ('abyssal_line', 'hookline', ('#120C10', '#4F4B60', '#8E8AA6', '#8AF6FF')),
    ('cinder_saints_fist', 'gauntlet', ('#3A0E06', '#8C2A12', '#F2641A', '#FFC94A')),
    ('quenching_tongs', 'tongs', ('#0E1830', '#5FA8D8', '#F0FCFF', '#3BEFFF')),
    ('dawnbreaker', 'sunrod', ('#6A3A0E', '#F2C14E', '#FFFDF0', '#FF8A5A')),
    ('bellwrights_mail', 'plate', ('#3A2808', '#A8792A', '#F2C14E', '#E8E0C8')),
    ('ring_of_the_undertow', 'ring', ('#0B2238', '#1E5078', '#7EC0E4', '#5EF0C8')),
    ('gravedust_band', 'ring', ('#2A2430', '#6A6078', '#C8C0B0', '#D4FF5A')),
    ('the_unburied_choir', 'lantern', ('#0E1530', '#3BC8E8', '#FFFFFF', '#8AF6FF')),
    ('the_white_whale', 'harpoon', ('#2A3A4A', '#C8D4E0', '#FFFFFF', '#8AF6FF')),
    # admin kit (rainbow-hot), and the second backpack
    ('admin_godhammer', 'godweapon', ('#4A0A5A', '#FF4AF0', '#FFFFFF', '#8AF6FF')),
    ('admin_worldender', 'godability', ('#2A0A3A', '#7A2AA8', '#FF4AF0', '#FFE45C')),
    ('admin_aegis', 'godarmor', ('#4A0A5A', '#FF4AF0', '#FFFFFF', '#8AF6FF')),
    ('admin_band', 'godring', ('#4A0A5A', '#FF4AF0', '#FFFFFF', '#FFE45C')),
    ('backpack', 'backpack', ('#3A2618', '#8A6A48', '#E3B95A', '#F2C14E')),
    ('rubber_duck', 'duckicon', ('#8A5A12', '#C8962A', '#FFD650', '#E8601A')),
    ('old_boot', 'booticon', ('#2A1A12', '#5A3A22', '#8A6A48', '#3A5A2A')),
    ('river_fish', 'fishicon', ('#1E5078', '#3C82AE', '#8AC8E8', '#E8F6FF')),
    ('golden_carp', 'fishicon', ('#8A5A12', '#E3B95A', '#FFEB8F', '#FFFFFF')),
    ('mystery_box', 'boxicon', ('#3A1A6A', '#7A4AC8', '#B888FF', '#FFE45C')),
    ('the_last_reflection', 'rapier', ('#1E2A44', '#7AA4CC', '#FFFFFF', '#C83444')),
    ('hall_of_mirrors', 'mirror', ('#3A1A6A', '#B888FF', '#FFFFFF', '#8AF6FF')),
    ('silvered_duelcoat', 'glassmail', ('#1E2A44', '#7AA4CC', '#CFE8FF', '#C83444')),
    ('heaven_wire', 'coil', ('#0E1530', '#3A57A8', '#CFFFFF', '#8AF6FF')),
    ('the_thunderhead', 'kite', ('#1A1E2A', '#3A4458', '#8A9AB8', '#FFE45C')),
    ('the_eleventh_hour', 'pendulum', ('#3A0E06', '#B0213F', '#FFE08A', '#FF4A5A')),
    ('the_broken_hourglass', 'stopwatch', ('#2A1A0A', '#C8962A', '#FFE08A', '#8AF6C8')),
    ('the_mirrorworld', 'rapier', ('#0E1530', '#3BC8E8', '#FFFFFF', '#8AF6FF')),
    ('the_first_storm', 'coil', ('#0E1530', '#3BC8E8', '#FFFFFF', '#FFE45C')),
    ('the_last_second', 'pendulum', ('#0E1530', '#3BC8E8', '#FFFFFF', '#8AF6FF')),
    # filling out every class
    ('the_bone_lantern', 'lantern', ('#3A3048', '#9A9078', '#ECE4CC', '#5EF0C8')),
    ('the_mourners_veil', 'shroud', ('#1A1A22', '#3A3048', '#8E8AA6', '#B888FF')),
    ('the_sea_wolf', 'oilskin', ('#1E2A22', '#4A6A48', '#8AA4AE', '#B0213F')),
    ('the_feint', 'rapier', ('#2A1A4A', '#6A2ED6', '#E1E6F0', '#B888FF')),
    ('cracked_looking_glass', 'mirror', ('#2A2A3A', '#8E8AA6', '#CFE8FF', '#FF4A5A')),
    ('the_lightning_rod', 'coil', ('#3A2808', '#C98A22', '#FFE45C', '#FFFFFF')),
    ('the_squall', 'kite', ('#0E1830', '#3A57A8', '#A8E2FF', '#FFFFFF')),
    ('the_tempest_cloak', 'stormcloak', ('#0E1530', '#3A57A8', '#8AF6FF', '#FFE45C')),
    ('the_cuckoo', 'pendulum', ('#2A1A0A', '#7A5232', '#F0E6D0', '#E0701A')),
    ('the_hourglass_of_sand', 'stopwatch', ('#3A2808', '#C8962A', '#F4E0A8', '#E3B95A')),
    ('the_gearmail', 'brasscoat', ('#2A1A0A', '#8A6A2A', '#E3B95A', '#FFE08A')),
    ('emilys_scarf', 'ring', ('#5A1A3A', '#D8457A', '#FF8AB8', '#FFFFFF')),
    ('the_unbroken_bellows', 'bellows', ('#3A0E06', '#F2641A', '#FFC94A', '#FFF6C8')),
    ('the_first_anvil', 'seal', ('#0E1530', '#8E8AA6', '#FFFFFF', '#8AF6FF')),
    ('the_second_sun', 'halo', ('#3A2808', '#FFC94A', '#FFFDF0', '#FF8A5A')),
    ('the_grave_of_kings', 'reliquary', ('#3A2808', '#C98A22', '#FFEB8F', '#B0213F')),
    ('the_leviathans_maw', 'hookline', ('#0E1830', '#C8D4E0', '#FFFFFF', '#3BC8E8')),
    ('the_infinite_reflection', 'mirror', ('#0E1530', '#3BC8E8', '#FFFFFF', '#B888FF')),
    ('the_eye_of_the_storm', 'kite', ('#0E1530', '#3BC8E8', '#FFFFFF', '#FFE45C')),
    ('the_unwound_spring', 'stopwatch', ('#0E1530', '#3BC8E8', '#FFFFFF', '#FFE08A')),
    # class sets
    ('the_unbroken_oath', 'runeward', ('#1A1030', '#8F99AD', '#EEF8FF', '#46F5D6')),
    ('oathbreaker', 'sword', ('#2A0A14', '#8F99AD', '#EEF8FF', '#46F5D6')),
    ('the_thirteenth_page', 'hex', ('#1E1040', '#43267E', '#AB82F2', '#FF7AF0')),
    ('the_witchs_eye', 'staff', ('#1E1040', '#43267E', '#7AF4FF', '#FFE66A')),
    ('runewarden_blade', 'sword', ('#3A0A14', '#8F99AD', '#EEF8FF', '#46F5D6')),
    ('runewarden_ward', 'runeward', ('#3A0A14', '#8F99AD', '#D9E0EA', '#46F5D6')),
    ('runewarden_brigandine', 'leather', ('#3A0A14', '#7C1E30', '#D63A4A', '#46F5D6')),
    ('hexcircle_staff', 'staff', ('#1E1040', '#43267E', '#AB82F2', '#7AF4FF')),
    ('hexcircle_grimoire', 'hex', ('#1E1040', '#43267E', '#AB82F2', '#FFE66A')),
    ('hexcircle_robe', 'robe', ('#1E1040', '#43267E', '#7A48C8', '#F4C64A')),
    ('pitfighters_cleaver', 'sword', ('#3A0E06', '#C8402A', '#FFC94A', '#FF7A1A')),
    ('pitfighters_bellows', 'bellows', ('#3A0E06', '#C8402A', '#FFC94A', '#FF7A1A')),
    ('pitfighters_harness', 'heavy', ('#3A0E06', '#8A3A22', '#D88A4A', '#FF7A1A')),
    ('oathsworn_greatsword', 'sword', ('#1A2440', '#8E9ACA', '#F0F4FF', '#F2C14E')),
    ('oathsworn_seal', 'seal', ('#1A2440', '#8E9ACA', '#F0F4FF', '#F2C14E')),
    ('oathsworn_bulwark', 'heavy', ('#1A2440', '#6E7AAA', '#D8E0F8', '#F2C14E')),
    ('dawnchoir_wand', 'wand', ('#5A3A08', '#F2C14E', '#FFF8D8', '#FF8A5A')),
    ('dawnchoir_halo', 'halo', ('#5A3A08', '#F2C14E', '#FFF8D8', '#FF8A5A')),
    ('dawnchoir_robe', 'robe', ('#5A3A08', '#E8C060', '#FFF8D8', '#FF8A5A')),
    ('graverite_staff', 'staff', ('#1A1430', '#5A4A8A', '#D8D0F0', '#5EF0C8')),
    ('graverite_reliquary', 'reliquary', ('#1A1430', '#5A4A8A', '#D8D0F0', '#5EF0C8')),
    ('graverite_shroud', 'robe', ('#1A1430', '#4A3A7A', '#B8B0D8', '#5EF0C8')),
    ('leviathan_longbow', 'bow', ('#0E2A3A', '#2E7A8A', '#BFF0F0', '#3BEFFF')),
    ('leviathan_line', 'hookline', ('#0E2A3A', '#2E7A8A', '#BFF0F0', '#3BEFFF')),
    ('leviathan_hide', 'leather', ('#0E2A3A', '#2E6A7A', '#9AD0D8', '#3BEFFF')),
    ('glassfencer_dirk', 'dagger', ('#1E2A44', '#9AB4D8', '#FFFFFF', '#C83444')),
    ('glassfencer_mirror', 'mirror', ('#1E2A44', '#9AB4D8', '#FFFFFF', '#C83444')),
    ('glassfencer_jerkin', 'leather', ('#1E2A44', '#7A94B8', '#E0ECFF', '#C83444')),
    ('tempest_staff', 'staff', ('#0E1A40', '#3A6AE8', '#CFF6FF', '#FFE45C')),
    ('tempest_kite', 'kite', ('#0E1A40', '#3A6AE8', '#CFF6FF', '#FFE45C')),
    ('tempest_robe', 'robe', ('#0E1A40', '#3A5AC8', '#A8C8FF', '#FFE45C')),
    ('clockwork_wand', 'wand', ('#2A1A0A', '#C8962A', '#FFF0B8', '#8AF6C8')),
    ('clockwork_stopwatch', 'stopwatch', ('#2A1A0A', '#C8962A', '#FFF0B8', '#8AF6C8')),
    ('clockwork_robe', 'robe', ('#2A1A0A', '#A87A2A', '#F2D890', '#8AF6C8')),
    # mythic rings
    ('the_conductors_band', 'ring', ('#2A0A3A', '#B888FF', '#FFFFFF', '#FFE45C')),
    ('ring_of_the_first_flame', 'ring', ('#3A0E06', '#F2641A', '#FFE08A', '#FFFFFF')),
    ('ring_of_still_waters', 'ring', ('#0E1830', '#5FA8D8', '#E0F6FF', '#3BEFFF')),
    ('band_of_the_open_hand', 'ring', ('#3A2808', '#E3B95A', '#FFF6D8', '#7AFF9A')),
    ('crown_of_the_unstruck', 'godring', ('#3A1A6A', '#F2C14E', '#FFF6D8', '#FF4A5A')),
]

# ================================================================ PROJECTILES 8x8
PROJ = {
    'ember': (["........", "...oo...", "..oYMo..", ".oYWYMo.", ".oMYMmo.", "..omMo..", "...oo...", "........"],
              {'o': '#5A1A0A', 'Y': '#FFE45C', 'W': '#FFFDF0', 'M': '#FF8A1F', 'm': '#D8341A'}),
    'spark': (["........", "...Y....", "...W.Y..", ".YWWWY..", "..YWW...", ".Y..W...", "....Y...", "........"],
              {'Y': '#FFC94A', 'W': '#FFF6C8'}),
    'lance': (["........", "........", "..YYYY..", "YWWWWWWY", "YWWWWWWY", "..YYYY..", "........", "........"],
              {'Y': '#FFEB8F', 'W': '#FFFDF0'}),
    'pearl': (["........", "..oooo..", ".oPPpo..", ".oPWPpo.", ".opPPpo.", "..oppo..", "...oo...", "........"],
              {'o': '#5A1A3A', 'P': '#FF8FBF', 'p': '#C8508A', 'W': '#FFE3F0'}),
    'toll': (["..cccc..", ".c....c.", "c..CC..c", "c.C..C.c", "c.C..C.c", "c..CC..c", ".c....c.", "..cccc.."],
             {'c': '#5EF0FF', 'C': '#A6E8C4'}),
    'shard': (["........", "......A.", ".....AW.", "....AWa.", "...AWa..", "..aWa...", ".aa.....", "........"],
              {'A': '#A8E2FF', 'W': '#F0FCFF', 'a': '#5FA8D8'}),
    'bile': (["........", "...gg...", "..gGGg..", ".gGyGGg.", ".gGGGgg.", "..gggg..", "........", "........"],
             {'g': '#4D6B2A', 'G': '#8DB03A', 'y': '#D4FF5A'}),
    'smoke': (["..pppp..", ".pPPPPp.", "pPPwPPPp", "pPPPPPPp", "pPPPPPpp", "pPPPPppp", ".pppppp.", "..pppp.."],
              {'p': '#5A2BB0', 'P': '#B98CFF', 'w': '#F4EDFF'}),
    'brine': (["........", "...cc...", "..cCCc..", ".cCWCCc.", "..cCCc..", "...cc...", "........", "........"],
              {'c': '#1FCFB8', 'C': '#B8FFF2', 'W': '#FFFFFF'}),
    'blade': (["........", "......P.", ".....PM.", "....PMm.", "...PMm..", ".gGMm...", ".gg.....", "g......."],
              {'P': '#B57CFF', 'M': '#E1E6F0', 'm': '#8A93AE', 'g': '#C29A3E', 'G': '#F7DE8C'}),
    'molten': (["........", "..mmmm..", ".mMMMMm.", ".mMYYMm.", ".mMYWMm.", ".mMMMMm.", "..mmmm..", "........"],
               {'m': '#8C2A12', 'M': '#F2641A', 'Y': '#FFC94A', 'W': '#FFF6C8'}),
    'rune': (["........", "...cc...", "..cCCc..", ".cC..Cc.", ".cC..Cc.", "..cCCc..", "...cc...", "........"],
             {'c': '#3BEFFF', 'C': '#CFFFFF'}),
    'corpseflame': (["...g....", "..gy....", "..gyg...", ".gyYyg..", ".gyYyg..", ".ggyyg..", "..gggg..", "........"],
                    {'g': '#6A9A2A', 'y': '#D4FF5A', 'Y': '#F4FFC8'}),
    'goldshard': (["........", "......G.", ".....GY.", "....GYg.", "...GYg..", "..GYg...", ".gg.....", "........"],
                  {'G': '#F2C14E', 'Y': '#FFF4C2', 'g': '#A8792A'}),
    'salt': (["........", "...s....", "..sWs...", ".sWWSs..", "..sSs...", "...s....", "........", "........"],
             {'s': '#8AA0B4', 'S': '#B8C8D4', 'W': '#F0F6FA'}),
    'chord': (["..GGGG..", ".G....G.", "G..YY..G", "G.Y..Y.G", "G.Y..Y.G", "G..YY..G", ".G....G.", "..GGGG.."],
              {'G': '#E3B95A', 'Y': '#FFEB8F'}),
    'star': (["........", "...W....", "...C....", ".WCWCW..", "...C....", "...W....", "........", "........"],
             {'W': '#FFFFFF', 'C': '#8AF6FF'}),
}


def build():
    os.makedirs(OUT, exist_ok=True)
    index = {'tile': 16, 'tiles': {}, 'objects': {}, 'bags': {}, 'portals': {}, 'items': {},
             'projectiles': {}, 'proj': 8}

    # tiles (painted) + dithered edges + shoreline foam, all in one sheet
    import terrain
    cells, index['tiles'] = terrain.build_tiles()
    ecells, eidx = terrain.build_edges()
    base = len(cells)
    index['edges'] = {k: base + v for k, v in eidx.items()}
    index['priority'] = terrain.PRIORITY
    cells += ecells
    write_png(os.path.join(OUT, 'tiles.png'), strip(cells, 16, 16, 8))
    index['tilesCols'] = 8
    # ground decor (flat, drawn with the ground so it rotates with it)
    dcells, index['decor'], index['decorAnim'] = terrain.build_decor()
    index['decorBiome'] = terrain.DECOR_BIOME
    from enhance import enhance
    dcells = [enhance(c, strength=0.7, round_corners=False) for c in dcells]
    write_png(os.path.join(OUT, 'decor.png'), strip(dcells, 16, 16, 8))
    index['decorCols'] = 8
    # landmarks 32x32
    lcells, index['landmarks'] = terrain.build_landmarks()
    import town_art
    for name, g in town_art.BIG.items():                    # the nexus hamlet's buildings and oaks
        index['landmarks'][name] = {'i': len(lcells), 'biome': 'town'}
        lcells.append(rgba_grid(g, town_art.PAL))
    import quirk_art
    for name, g in quirk_art.BIG.items():
        index['landmarks'][name] = {'i': len(lcells), 'biome': 'town'}
        lcells.append(rgba_grid(g, town_art.PAL))
    lcells = [enhance(c, grain=13) for c in lcells]
    # every landmark breathes: trees sway, everything else pulses its lights
    from enhance import sway, pulse
    TREES = {'hollow_oak', 'oak'}
    order = sorted(index['landmarks'].items(), key=lambda kv: kv[1]['i'])
    out = []
    for name, L in order:
        f0 = lcells[L['i']]
        L['i'] = len(out); L['frames'] = 2
        out += [f0, sway(f0, 0.5) if name in TREES else pulse(f0, 0.4)]
    lcells = out
    write_png(os.path.join(OUT, 'landmarks.png'), strip(lcells, 32, 32, 4))
    index['landmarksCols'] = 4

    # objects + portals + bags. Realm props get a second frame: trees sway, runes / eyes / fire pulse
    from enhance import stretch
    cells = []
    index['objAnim'] = {}
    OBJ_ANIM = {'dead_tree': 'sway', 'whale_rib': 'pulse', 'rune_pillar': 'pulse', 'fallen_head': 'pulse', 'brazier': 'pulse', 'fountain': 'pulse'}
    for name, grid in OBJECTS.items():
        check(name, grid)
        assert len(grid) == 16 and len(grid[0]) == 16, name
        index['objects'][name] = len(cells)
        f0 = rgba_grid(grid, OBJ_PAL)
        cells.append(f0)
        if name in OBJ_ANIM:
            cells.append(sway(f0, 0.5) if OBJ_ANIM[name] == 'sway' else pulse(f0, 0.55))
            index['objAnim'][name] = 2
    import dungeons4_art as _d4p
    import realmupdate_art as _rua
    import cave_portals as _cave                                # the dungeons' gateways: cave mouths (tools/cave_portals.py)
    for kind in ('realm', 'dungeon', 'nexus', 'closed', 'chapel', 'heart', 'vault', 'scriptorium', 'crypt', 'ember', 'hive', 'theatre', 'spire', 'dream', *_rua.PORTALS, 'throne'):
        import portals as PT
        PT.KINDS.update(_d4p.PORTALS)
        PT.KINDS.update(_rua.PORTALS)
        index['portals'][kind] = len(cells)
        for f in range(3):
            cells.append(_cave.rgba(_cave.frame(_cave.OURS[kind], f, 3)) if kind in _cave.OURS else rgba_grid(PT.KINDS[kind](f), PT.PAL))
    for name, (a, b, c, d) in BAGS.items():
        index['bags'][name] = len(cells)
        cells.append(rgba_grid(BAG_SHAPE, {'o': OUTLINE, 'a': a, 'b': b, 'c': c, 'd': d}))
    import nexus_art
    for name, (grid, pal) in nexus_art.PROPS.items():          # NPCs breathe, the furnace roars, banners stir
        index['objects'][name] = len(cells)
        f0 = rgba_grid(grid, pal)
        cells.append(f0)
        if name in ('merchant', 'smith'):
            cells.append(stretch(f0)); index['objAnim'][name] = 2
        elif name in ('furnace', 'stall'):
            cells.append(pulse(f0, 0.5)); index['objAnim'][name] = 2
        elif name == 'banner':
            cells.append(sway(f0, 0.8)); index['objAnim'][name] = 2
    for name, frs in town_art.SMALL.items():                # town props; some animate (campfire, lamps)
        index['objects'][name] = len(cells)
        if len(frs) > 1:
            index['objAnim'][name] = len(frs)
        for g in frs:
            cells.append(enhance(rgba_grid(g, town_art.PAL), strength=0.8))
    import summons
    for name, frs in summons.SUMMONS.items():                # each reliquary calls up something different
        index['objects'][name] = len(cells); index['objAnim'][name] = 4
        for g, pal in frs:
            cells.append(enhance(rgba_grid(g, pal), strength=0.8))
    index['objects']['thrall'] = len(cells); index['objAnim']['thrall'] = 4
    for g, pal in town_art.THRALL:
        cells.append(enhance(rgba_grid(g, pal), strength=0.8))
    for b, frs in town_art.SHRINE_ART.items():                # wayside shrines, one per biome, glowing
        index['objects']['shrine_' + b] = len(cells); index['objAnim']['shrine_' + b] = 2
        for g, pal in frs:
            cells.append(enhance(rgba_grid(g, pal), strength=0.8))
    import quirk_art
    for name, frs in quirk_art.QUIRKS.items():                 # quest board, the cat, lore stones, altars, wanderers...
        index['objects'][name] = len(cells)
        if len(frs) > 1:
            index['objAnim'][name] = len(frs)
        for g, pal in frs:
            cells.append(enhance(rgba_grid(g, pal), strength=0.8))
    import puzzle_art
    import realm2_art
    import pet_art
    import dungeons4_art
    for name, frs in {**puzzle_art.PROPS, **realm2_art.PROPS, **pet_art.PROPS, **dungeons4_art.PROPS}.items():                 # dungeon puzzles (gates, levers, plates, runes) and waypoints
        index['objects'][name] = len(cells)
        if len(frs) > 1:
            index['objAnim'][name] = len(frs)
        for g, pal in frs:
            cells.append(enhance(rgba_grid(g, pal), strength=0.8))
    index['objects']['kite'] = len(cells); index['objAnim']['kite'] = 2
    for g, pal in town_art.KITE:
        cells.append(enhance(rgba_grid(g, pal), strength=0.8))
    for name, (grid, pal) in SPECIAL_BAGS.items():
        check(name, grid)
        index['bags'][name] = len(cells)
        cells.append(rgba_grid(grid, pal))
    write_png(os.path.join(OUT, 'objects.png'), strip(cells, 16, 16, 8))
    index['objectsCols'] = 8

    # items: one row per type, column = tier; then potions; then UT
    import icons
    cells, ICOLS = [], 12
    for typ, ntiers in TYPE_TIERS.items():
        index['items'][typ] = len(cells)
        for t in range(ICOLS):
            if t >= ntiers:
                cells.append([[T] * 16 for _ in range(16)])
                continue
            g = icons.icon(typ, t)                      # shape changes with tier (3 forms), colour with metal
            check(typ, g)
            ramp = TIER_RAMPS[t]
            pal = dict(icons.MAT, o=OUTLINE, a=ramp[0], b=ramp[1], c=ramp[2], d=ramp[3], h=lighten(ramp[2]))
            cells.append(rgba_grid(g, pal))
    index['items']['potion'] = len(cells)
    index['potions'] = list(POTIONS)
    for k, col in POTIONS.items():
        cells.append(rgba_grid(icons.icon('potion', 0), {'o': OUTLINE, 'a': '#6A4A2A', 'b': '#C8D8E8',
                                                         'c': '#F0F6FF', 'h': '#FFFFFF', 'd': col, 'q': '#07050B'}))
    import pack_sprites as PS                                   # the sprite pack's flasks for Life, Mana and Attack
    def pack16(grid, pal):
        out = []
        for row in grid:
            line2 = [hex_rgba(pal[c]) if c != '.' else T for c in row for _ in (0, 1)]
            out += [line2, list(line2)]
        return out
    for key, art in (('hp', 'health_potion'), ('mp', 'mana_potion'), ('att', 'potion_of_might')):
        cells[index['items']['potion'] + list(POTIONS).index(key)] = pack16(PS.ITEM_GRIDS[art], PS.ITEMS)
    while len(cells) % ICOLS:
        cells.append([[T] * 16 for _ in range(16)])
    import relic_icons, icons_rotmg
    for uid, base, ramp in UT:
        base = BASE_REMAP.get(base, base)
        index['items'][uid] = len(cells)
        if base == 'pack':                                   # drawn in the sprite pack, already shaded
            cells.append(pack16(PS.ITEM_GRIDS[uid], PS.ITEMS))
            continue
        if base == 'art8':                                   # pet eggs, the vault chest (tools/pet_art.py)
            import pet_art
            import dungeons4_art as _d4i
            if uid in _d4i.ICONS:                             # the newer dungeons' relics: their own palettes, drawn as they are
                g8, pal8 = _d4i.ICONS[uid]
                big = [''.join(c * 2 for c in r) for r in g8 for _ in (0, 1)]
                big = [''.join('o' if ch == '.' and any(0 <= x + dx < 16 and 0 <= y + dy < 16 and big[y + dy][x + dx] not in '.o' for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))) else ch for x, ch in enumerate(row)) for y, row in enumerate(big)]
                cells.append(rgba_grid(big, {**pal8, 'o': OUTLINE}))
                continue
            g8, pal8 = pet_art.ICONS[uid]
            cells.append(rgba_grid(icons_rotmg.shade([''.join(c * 2 for c in r) for r in g8 for _ in (0, 1)]), {**pal8, 'o': OUTLINE, 'h': '#FFFFFF'}))
            continue
        if uid in relic_icons.RELIC:                         # every relic has its own sprite
            big = []
            for row in relic_icons.RELIC[uid]:
                line2 = ''.join(ch * 2 for ch in row)
                big += [line2, line2]
            g = icons_rotmg.shade(big)
            pal = dict(icons.MAT, o=OUTLINE, a=ramp[0], b=ramp[1], c=ramp[2], d=ramp[3], h=lighten(ramp[2]))
            pal.update(relic_icons.ACCENT)
            cells.append(rgba_grid(g, pal))
            continue
        g = icons.icon(base, 10) if base in icons.GEN else ICONS[base]   # relics use the ornate form
        cells.append(rgba_grid(g, dict(icons.MAT, o=OUTLINE, a=ramp[0], b=ramp[1], c=ramp[2], d=ramp[3], h=lighten(ramp[2]))))
    write_png(os.path.join(OUT, 'items.png'), strip(cells, 16, 16, ICOLS))
    index['itemsCols'] = ICOLS

    # projectiles: every shot redrawn RotMG-style (tools/shots_rotmg.py): 8x8 art doubled into 16px cells, outlined,
    # two frames. Shapes come from the weapon or attack; colours from the shot's old palette (tools/projectiles.py).
    import projectiles
    import shots_rotmg as SR
    cells, rot, diag, spin, big = [], [], [], [], []
    KEEP = {'fishy', 'yap'}                                # hand-made 8x8s of their own: kept, just re-drawn at the new size
    for name, (g, pal) in projectiles.P.items():
        index['projectiles'][name] = len(cells)
        if name in KEEP:
            g8 = [row[2:10] for row in g[2:10]]
            P2 = dict(pal, o=pal.get('o', '#0A070C'))
            cells += [SR.to16([list(r) for r in g8], P2, outline=False)] * 2
            continue
        arch = SR.arch_of(name)
        parts = name.split('_')
        if name.startswith('pj_') and len(parts) == 3 and parts[1] in SR.TIERED and parts[2].isdigit():
            t = int(parts[2]); P2 = SR.tier_ramp(TIER_RAMPS[t])
            frames = [SR.tier_extras(SR.draw(arch, f), t, f) for f in (0, 1)]
            if arch in SR.FACE_RIGHT or not SR.directional(arch):
                frames = [SR.draw(arch, f) for f in (0, 1)]
        else:
            P2 = SR.ramp_from(pal, g)
            frames = [SR.draw(arch, f) for f in (0, 1)]
        cells += [SR.to16(fr, P2) for fr in frames]
        if SR.directional(arch):
            rot.append(name)
            if arch not in SR.FACE_RIGHT:
                diag.append(name)
        if arch in SR.SPIN:
            spin.append(name)
        if name in SR.BIG:
            big.append(name)
    import dungeons4_art as _d4s
    for name, (art, ramp) in _d4s.SHOTS.items():               # the newer dungeons' own shots, hand-drawn
        index['projectiles'][name] = len(cells)
        g8 = [list(r) for r in _d4s.SHOT_ART[art]]
        f2 = [list(r.replace('4', 'W') if i % 3 == 1 else r) for i, r in enumerate(_d4s.SHOT_ART[art])]
        cells += [SR.to16(g8, ramp), SR.to16(f2, ramp)]
        if art in _d4s.POINTED or art in _d4s.FACE_R:
            rot.append(name)
            if art in _d4s.POINTED:
                diag.append(name)
        if art in _d4s.SPIN:
            spin.append(name)
    OUTL = '#0A070C'
    for name, frs in PS.PROJECTILES.items():               # the pack's own shots: already 8x8 and pointing right
        index['projectiles'][name] = len(cells)
        P2 = dict(PS.FX, o=OUTL)
        for g in frs[:2]:
            cells.append(SR.to16([list(r) for r in g], P2))
        rot.append(name)
    index['projRot'], index['projDiag'], index['projSpin'], index['projBig'] = rot, diag, spin, big
    index['projFrames'] = 2
    write_png(os.path.join(OUT, 'projectiles.png'), strip(cells, 16, 16, 8))
    # effects: hit sparks, death puffs, the level-up ring (8x8 art doubled into 16px frames)
    fcells, index['fx'] = [], {}
    for name, frs in PS.EFFECTS.items():
        index['fx'][name] = {'i': len(fcells), 'n': len(frs)}
        for g in frs:
            fcells.append(pack16(g, PS.FX))
    write_png(os.path.join(OUT, 'fx.png'), strip(fcells, 16, 16, 8))
    index['fxCols'] = 8
    # the RotMG pass: half density, no baked outline (the game outlines objects at draw time), calm ground
    from retro import retro_sheet
    retro_sheet(os.path.join(OUT, 'objects.png'), 16, 16, walk=None)
    # a few props too thin to survive the halving get hand-drawn 8x8 art
    OBJ8_PAL = {'w': hex_rgba('#8A6A44'), 'W': hex_rgba('#5A4028'), 'k': hex_rgba('#3A2A1A')}
    OBJ8 = {'dead_tree': [['w..w...w', '.w.w..w.', '..wWw.w.', '...wWw..', '...wW...', '...wW...', '...wW...', '..wwWw..'],
                          ['.w..w..w', '..w.w.w.', '..wWw.w.', '...wWw..', '...wW...', '...wW...', '...wW...', '..wwWw..']]}
    from reduce import read_png
    opx = read_png(os.path.join(OUT, 'objects.png'))
    for name, frames8 in OBJ8.items():
        for f, g8 in enumerate(frames8):
            k = index['objects'][name] + f
            ox, oy = (k % 8) * 16, (k // 8) * 16
            for y in range(16):
                for x in range(16):
                    ch = g8[y // 2][x // 2]
                    opx[oy + y][ox + x] = OBJ8_PAL[ch] if ch != '.' else T
    from retro import shade_px, shade_sheet
    opx = shade_px(opx, 16, 16)
    # bags: small and finely drawn at full resolution (no doubling), like RotMG's: a round sack with a soft
    # highlight, a cinched neck and a tied cord. Brown, purple, white, then the special ones.
    BAG16 = ['................', '.....l.ll.b.....', '......lbbb......', '......tttt......', '.....bbbbbb.....',
             '....blllbbbb....', '...bllbbbbbbb...', '...blbbbbbbbb...', '...bbbbbbbbbd...', '...bbbbbbbbbd...',
             '...bbbbbbbbdd...', '....bbbbbbdd....', '.....dddddd.....', '................', '................', '................']
    STAR = {(8, 7): 'y', (7, 8): 'y', (8, 8): 'y', (9, 8): 'y', (8, 9): 'y', (2, 4): 's', (13, 3): 's', (12, 11): 's'}
    DIVINE = {(c, 8): 'y' for c in range(3, 13)} | {(8, 8): 'r', (7, 8): 'r', (8, 7): 'r', (8, 9): 'r'} | {(2, 3): 's', (13, 5): 's'}
    BAG_ART = {
        'brown': ({'b': '#8A5A30', 'l': '#C08A50', 'd': '#5A3A1E', 't': '#3A2414'}, {}),
        'purple': ({'b': '#8A4AD8', 'l': '#C8A0FF', 'd': '#5A2A9A', 't': '#F2C14E'}, {}),
        'white': ({'b': '#E8ECF8', 'l': '#FFFFFF', 'd': '#A8B4D0', 't': '#8AA0C8', 's': '#FFFFFF'}, {(13, 4): 's', (2, 9): 's'}),
        'starfall': ({'b': '#2A3A7A', 'l': '#6A8AE8', 'd': '#18204A', 't': '#FFD650', 'y': '#FFE45C', 's': '#CFFFFF'}, STAR),
        'divine': ({'b': '#2A1A3A', 'l': '#5A3A7A', 'd': '#140A1E', 't': '#F2C14E', 'y': '#F2C14E', 'r': '#FF4A5A', 's': '#FFB0B8'}, DIVINE),
    }
    for name, (cols, extra) in BAG_ART.items():
        k = index['bags'][name]
        ox, oy = (k % 8) * 16, (k // 8) * 16
        for y in range(16):
            for x in range(16):
                ch = extra.get((x, y)) or BAG16[y][x]
                if ch != '.' and BAG16[y][x] == '.' and (x, y) not in extra:
                    ch = '.'
                opx[oy + y][ox + x] = hex_rgba(cols[ch]) if ch != '.' else T
    import bag_art                                       # the special bags: hand-drawn, after RotMG's white bag
    for name in bag_art.BAGS:
        k = index['bags'][name]
        ox, oy = (k % 8) * 16, (k // 8) * 16
        for y, row in enumerate(bag_art.grid(name)):
            for x, c in enumerate(row):
                opx[oy + y][ox + x] = hex_rgba(c) if c else T
    import pet_art                                       # pets: written pixel-exact after the retro pass, so eyes survive
    for name, frs in {**pet_art.PROPS, **dungeons4_art.PROPS}.items():
        for f, (g16, pal) in enumerate(frs):
            k = index['objects'][name] + f
            ox, oy = (k % 8) * 16, (k // 8) * 16
            for y, row in enumerate(g16):
                for x, ch in enumerate(row):
                    opx[oy + y][ox + x] = hex_rgba(pal[ch]) if ch != '.' else T
    write_png(os.path.join(OUT, 'objects.png'), opx)
    shade_sheet(os.path.join(OUT, 'landmarks.png'), 32, 32)
    retro_sheet(os.path.join(OUT, 'landmarks.png'), 32, 32, walk=None)
    retro_sheet(os.path.join(OUT, 'decor.png'), 16, 16, walk=None, grade='mute')
    retro_sheet(os.path.join(OUT, 'tiles.png'), 16, 16, walk=None, grade='mute', phase=(0, 0), strip=False)   # already 8x8: grade only
    index['projCols'] = 8
    index['proj'] = 16

    with open(os.path.join(OUT, 'world.json'), 'w') as f:
        json.dump(index, f, indent=1)
    return index


if __name__ == '__main__':
    idx = build()
    import apply_remaster                                # the Realm Remaster's art over the baked originals (realm_update_2)
    apply_remaster.world()
    print({k: len(v) if isinstance(v, dict) else v for k, v in idx.items()})
