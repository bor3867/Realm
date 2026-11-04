# The user's realm sheets (2026-11-03: art/source/castle3/sheet_realm_a.png, sheet_realm_b.png: trees, rocks, chests, each
# land's enemies and props, the corrupted landscape) taken apart panel by panel: the sheet's gold frames and its labels
# kept out (each panel's inside only, its label masked), then each object found, brought to native pixels and outlined
# exactly as tools/sheet_extract.py does. Writes art/source/castle3/obj/<sheet>_<panel>_<n>.png and a contact sheet.
#   py -I tools/sheet_crops.py
import os, sys
from collections import Counter
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402
from reduce import read_png  # noqa: E402
from castle_import import outline  # noqa: E402
from sheet_extract import objects, cell_size, sample  # noqa: E402

# panel: (x0, y0, x1, y1) of its inside, below its label
PANELS = {
    'sheet_realm_a': {
        'trees': (20, 36, 664, 208), 'rocks': (692, 36, 1138, 208), 'chests': (1166, 40, 1430, 206),
        'beach': (20, 250, 1430, 328), 'plains': (20, 372, 1430, 448), 'parents': (20, 486, 1430, 604),
        'cortrees': (30, 680, 634, 772), 'roots': (650, 680, 1052, 772), 'corbush': (1068, 680, 1420, 772),
        'corrocks': (30, 808, 480, 896), 'bones': (492, 808, 926, 896), 'shrines': (940, 808, 1420, 896),
        'ruins': (30, 930, 590, 1040), 'hazards': (604, 930, 1090, 1040), 'mushrooms': (1100, 930, 1420, 1040),
    },
    'sheet_realm_b': {
        'high_props': (22, 82, 680, 284), 'high_foes': (706, 82, 1518, 284),
        'mount_props': (22, 394, 680, 618), 'mount_foes': (706, 394, 1518, 618),
        'swamp_props': (22, 726, 680, 976), 'swamp_foes': (706, 726, 1518, 976),
    },
}
GAP = {'parents': -999, 'high_props': -999, 'mount_props': -999, 'swamp_props': -999, 'high_foes': -999, 'mount_foes': -999, 'swamp_foes': -999, 'beach': -999, 'plains': -999, 'trees': -999}   # (close-set objects: kept apart)
FIXED_CELL = 4      # (both sheets' art drawn at about four screen pixels to its pixel)

if __name__ == "__main__" and sys.argv[1:] != ["enemies"]:
    od = os.path.join(root, 'art', 'source', 'castle3', 'obj'); os.makedirs(od, exist_ok=True)
    only = sys.argv[1:]
    for sheet, panels in PANELS.items():
        src = read_png(os.path.join(root, 'art', 'source', 'castle3', sheet + '.png')); bg = src[3][3]
        for pn, (x0, y0, x1, y1) in panels.items():
            if only and pn not in only: continue
            bg = src[y0 + 2][x0 + 2]
            px = [[bg] * (x1 - x0 + 16) for _ in range(8)] + [[bg] * 8 + row[x0:x1] + [bg] * 8 for row in src[y0:y1]] + [[bg] * (x1 - x0 + 16) for _ in range(8)]
            boxes = [b for b in objects(px, bg, gap=GAP.get(pn, 5)) if (b[2] - b[0]) >= 10 and (b[3] - b[1]) >= 10 and (b[2] - b[0]) / max(1, b[3] - b[1]) < 12 and (b[3] - b[1]) / max(1, b[2] - b[0]) < 12]
            boxes.sort(key=lambda b: (b[0], b[1]))
            tiles = []
            for k, b in enumerate(boxes):
                C = cell_size(px, bg, b) if FIXED_CELL is None else FIXED_CELL
                g = outline(sample(px, bg, b, C)); tiles.append(g)
                write_png(os.path.join(od, f'{sheet}_{pn}_{k}.png'), g)
            print(sheet, pn, len(boxes), [(k, b[0] + x0 - 8, b[1] + y0 - 8, b[2] - b[0], b[3] - b[1]) for k, b in enumerate(boxes)])
            if not tiles: continue
            S = 3; cw = max(len(t[0]) for t in tiles) * S + 6; ch = max(len(t) for t in tiles) * S + 10; cols = min(10, len(tiles)); rows = (len(tiles) + cols - 1) // cols
            sh = [[(40, 36, 48, 255)] * (cw * cols) for _ in range(ch * rows)]
            for k, t in enumerate(tiles):
                ox, oy = (k % cols) * cw, (k // cols) * ch
                for y, r in enumerate(t):
                    for x, c in enumerate(r):
                        if c[3]:
                            for dy in range(S):
                                for dx in range(S): sh[oy + 8 + y * S + dy][ox + 3 + x * S + dx] = c
                for d in range(k + 1): sh[oy + 2][ox + 3 + d * 2] = (255, 255, 255, 255)
            write_png(os.path.join(od, f'_{sheet}_{pn}_contact.png'), sh)


# ---- each realm enemy's sprite: its box on the sheet (docs/realm_sprite_map.md), cut to art/source/realm/native/<id>.png
ENEMY = {
    'sheet_realm_a': {
        'shore_crab': (90, 256, 180, 326), 'rf_coral_crab': (242, 250, 364, 326), 'driftwood_bandit': (444, 252, 530, 322),
        'tide_herald': (594, 250, 682, 322), 'siren': (754, 252, 860, 326), 'conch_hermit': (934, 252, 1036, 326),
        'reef_golem': (1114, 250, 1260, 324), 'trap_hound': (1320, 276, 1388, 320),
        'bramble_wolf': (80, 376, 208, 438), 'hedge_goblin': (420, 374, 508, 442), 'fallen_knight': (576, 372, 690, 444),
        'goblin_shaman': (762, 372, 852, 444), 'wild_boar': (918, 374, 1032, 438), 'rock_troll': (1114, 372, 1250, 442),
        'briar_bee': (72, 554, 118, 596), 'spore_puff': (352, 556, 396, 594), 'thornwood_stag': (668, 486, 776, 588),
        'spider_queen': (934, 492, 1066, 570), 'bark_spider': (900, 560, 956, 594), 'rf_grove_warden': (1228, 486, 1340, 588),
        'rf_sproutling': (1184, 546, 1226, 594),
    },
    'sheet_realm_b': {
        'gilded_lancer': (718, 92, 796, 208), 'crag_dwarf': (780, 212, 848, 274), 'bandit_archer': (820, 130, 888, 208),
        'orc_warlord': (1366, 82, 1470, 206), 'abyss_hound': (1052, 120, 1142, 194), 'cinder_golem': (1172, 102, 1294, 218),
        'crystal_golem': (930, 440, 1044, 558), 'cairn_crawler': (1054, 478, 1174, 592), 'rf_ash_golem': (1168, 432, 1300, 538),
        'glacier_headsman': (1352, 394, 1482, 522), 'wolf_shield': (1314, 516, 1378, 590), 'rime_herald': (848, 400, 926, 490),
        'frost_skald': (768, 508, 890, 596), 'rf_bog_witch': (764, 726, 850, 822), 'rf_marsh_lurker': (868, 842, 1044, 920),
        'elder_willow': (1328, 726, 1450, 884),
    },
}


def trim(g):
    ys = [y for y, r in enumerate(g) if any(c[3] for c in r)]; xs = [x for x in range(len(g[0])) if any(r[x][3] for r in g)]
    return [r[min(xs):max(xs) + 1] for r in g[min(ys):max(ys) + 1]] if ys else g


def keep_biggest(g):                                    # (a neighbour's edge caught in the box: only the sprite's own body kept)
    H, W = len(g), len(g[0]); lab = [[-1] * W for _ in range(H)]; sizes = []
    for y in range(H):
        for x in range(W):
            if g[y][x][3] and lab[y][x] < 0:
                k = len(sizes); st = [(x, y)]; lab[y][x] = k; n = 0
                while st:
                    a, b = st.pop(); n += 1
                    for X in (a - 1, a, a + 1):
                        for Y in (b - 1, b, b + 1):
                            if 0 <= X < W and 0 <= Y < H and g[Y][X][3] and lab[Y][X] < 0: lab[Y][X] = k; st.append((X, Y))
                sizes.append(n)
    if not sizes: return g
    big = max(sizes); ok = {k for k, n in enumerate(sizes) if n >= big * 0.08}   # (its own detached bits, a spear tip, kept)
    return [[c if lab[y][x] in ok else BLANK for x, c in enumerate(r)] for y, r in enumerate(g)]


BLANK = (0, 0, 0, 0)


def cut_enemies():
    od = os.path.join(root, 'art', 'source', 'realm', 'native'); os.makedirs(od, exist_ok=True); allt = []
    for sheet, boxes in ENEMY.items():
        src = read_png(os.path.join(root, 'art', 'source', 'castle3', sheet + '.png'))
        for id_, (x0, y0, x1, y1) in boxes.items():
            bg = src[3][3]
            g = trim(keep_biggest(outline(sample(src, bg, (x0, y0, x1, y1), FIXED_CELL))))
            write_png(os.path.join(od, id_ + '.png'), g); allt.append(g); print(id_, len(g[0]), 'x', len(g))
    S = 3; cw = max(len(t[0]) for t in allt) * S + 6; ch = max(len(t) for t in allt) * S + 10; cols = 10; rows = (len(allt) + cols - 1) // cols
    sh = [[(40, 36, 48, 255)] * (cw * cols) for _ in range(ch * rows)]
    for k, t in enumerate(allt):
        ox, oy = (k % cols) * cw, (k // cols) * ch
        for y, r in enumerate(t):
            for x, c in enumerate(r):
                if c[3]:
                    for dy in range(S):
                        for dx in range(S): sh[oy + 8 + y * S + dy][ox + 3 + x * S + dx] = c
    write_png(os.path.join(od, '_contact.png'), sh)


if __name__ == '__main__' and sys.argv[1:] == ['enemies']:
    cut_enemies()
