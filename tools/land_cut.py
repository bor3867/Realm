# The user's seven land sheets of the realm's remaining monsters (2026-11-03, art/source/castle3/sheet_land_<land>.png,
# each sprite over its id): every sprite found (its pieces gathered, the labels and the gold frame left out), brought to
# native pixels with a one-pixel edge (the art's own, outer near-black taken off; tools/castle_import.py outline) and
# written to art/source/realm/native/<id>.png, named by the sheet's own reading order. A contact sheet per land.
#   py -I tools/land_cut.py [land ...]
import os, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402
from reduce import read_png  # noqa: E402
from castle_import import outline  # noqa: E402
from sheet_extract import objects, cell_size, sample  # noqa: E402
from sheet_crops import trim, keep_biggest  # noqa: E402

NAMES = {
    'shore': ['brine_pilgrim', 'lantern_jelly', 'salt_widow', 'pilgrim_elder', 'anchor_bearer', 'lens_moth', 'lighthouse_jelly', 'salt_matriarch', 'trap_hound_alpha', 'anchor_titan', 'moth_queen',
              'reef_eel', 'brine_slime', 'brine_slimelet', 'tide_slime', 'gull', 'rf_drowned_chorister', 'kraken_tentacle'],
    'fen': ['bell_taken', 'peat_saint', 'mire_choir', 'lantern_heron', 'candle_mite', 'bog_abbess', 'bog_bellringer', 'mourning_willow', 'grave_leech', 'great_bell', 'peat_martyr',
            'mire_chorus', 'twin_lamp_heron', 'tallow_matron', 'leech_prime', 'bog_toad', 'gas_bloat', 'rf_gravekeeper'],
    'runeholt': ['frozen_executioner', 'prayer_monk', 'antlered_hush', 'rune_warden', 'saga_singer', 'shieldwall_pack', 'frost_wraith', 'cairn_mender', 'stone_harpy', 'mountain_ram', 'crag_ogre', 'cave_bat',
                 'storm_gryphon', 'rf_smelter_imp', 'rf_frost_wraith', 'rf_ice_golem', 'rf_ashen_acolyte', 'rf_penitent_wraith', 'rf_bailiff_automaton', 'rf_clockwork_clerk', 'rf_glass_wraith', 'rf_prism_sentinel'],
    'godfall': ['hollow_thane', 'censer_magistrate', 'halo_eater', 'choir_engine', 'fallen_choirmaster', 'gilded_penitent', 'cherub_husk', 'reliquary_spider', 'hollow_jarl', 'halo_glutton',
                'cathedral_engine', 'seraph_husk', 'broodmother', 'ash_harpy', 'rift_wraith', 'blood_maw', 'gazer', 'obsidian_scorpion', 'void_seer', 'rf_star_wisp',
                'rf_crater_crawler', 'rf_sun_acolyte', 'rf_moon_acolyte', 'rf_the_unmaker_s_eye', 'rf_ember_drake', 'rf_cinder_imp', 'rf_hollow_knight', 'rf_crownless_wraith', 'rf_stagehand_shade', 'rf_phantom_usher'],
    'dunes': ['glass_scarab', 'dune_lurker', 'salt_mummy', 'sand_skimmer', 'glass_sphinx', 'mirage_caller', 'rf_dune_stalker', 'rf_sand_scarab'],
    'thornwood': ['thorn_sprite', 'witch_of_briars', 'orc_brute', 'forest_druid', 'mossback_turtle', 'rf_dusk_moth', 'rf_pale_sprite'],
    'steppe': ['prism_hawk', 'shard_crawler', 'quartz_jackal', 'geode_titan', 'skyglass_seer', 'storm_gryphon_steppe', 'rf_gale_harpy', 'rf_thunder_hawk', 'rf_weightless_monk', 'rf_drifting_bell',
               'rf_hour_warden', 'rf_sand_wisp', 'rf_star_cartographer', 'rf_comet_hound', 'rf_vine_creeper', 'rf_lantern_jack', 'rf_ink_wraith', 'rf_paper_crane'],
}
INNER = (34, 92, 1088, 1325)                                # (inside the gold frame, below the title)
BLANK = (0, 0, 0, 0)
CELL = 5
# pieces of one sprite found apart (the twin herons; the smelter imp's smoke; the frost wraith's shards; the monk's
# sparkle): joined, by their places in the reading order
BOTTOM = {'cairn_mender': 358, 'rf_drifting_bell': 739, 'quartz_jackal': 146}   # (labels set close under these, no gap between: their boxes end above them by hand)
JOIN = {'fen': [(12, 13)], 'runeholt': [(13, 14), (15, 16)], 'steppe': [(8, 9)]}


def drop_label(px, bg, b):                                  # a name caught in a sprite's box: on the sheet a band of empty ground lies between them;
    x0, y0, x1, y1 = b                                      # the block below the lowest such band, if a label's height, is cut off the box
    near = lambda c: abs(c[0] - bg[0]) + abs(c[1] - bg[1]) + abs(c[2] - bg[2]) < 34
    empty = [all(near(px[y][x]) for x in range(x0, x1)) for y in range(y0, y1)]
    y = len(empty) - 1
    while y >= 0 and empty[y]: y -= 1
    bot = y
    while y >= 0 and not empty[y]: y -= 1
    gap = y
    while y >= 0 and empty[y]: y -= 1
    if gap > 0 and bot - gap <= 32 and gap - y >= 3 and y > 20: return (x0, y0, x1, y0 + y + 1)
    return b


def is_label(px, b):                                        # a label: a short wide run of pale-yellow letters
    x0, y0, x1, y1 = b; h, w = y1 - y0, x1 - x0
    if h > 34: return False
    n = y = 0
    for yy in range(y0, y1, 2):
        for xx in range(x0, x1, 2):
            c = px[yy][xx]
            if c[0] > 150 and c[1] > 120: y += 1
            if c[0] + c[1] + c[2] > 120: n += 1
    return n and y / n > 0.5 and w > h * 2


def cut(land, cell=None):
    src = read_png(os.path.join(root, 'art', 'source', 'castle3', f'sheet_land_{land}.png')); bg = src[INNER[1] + 6][INNER[0] + 6]
    x0, y0, x1, y1 = INNER
    px = [[bg] * (x1 - x0) for _ in range(y1 - y0)]
    for y in range(y1 - y0):
        for x in range(x1 - x0): px[y][x] = src[y0 + y][x0 + x]
    boxes = [b for b in objects(px, bg, gap=7) if (b[2] - b[0]) * (b[3] - b[1]) > 300]
    sprites = [b for b in boxes if not is_label(px, b)]
    labels = [b for b in boxes if is_label(px, b)]
    # each sprite: the label nearest below it names it; reading order by its label's row, then across
    by_y = sorted(sprites, key=lambda b: (b[1] + b[3]) / 2); rows, cur = [], []
    for b in by_y:                                          # (a row: sprites whose middles lie within 70 of the row's first; each row read left to right)
        if cur and (b[1] + b[3]) / 2 - (cur[0][1] + cur[0][3]) / 2 > 70: rows += sorted(cur, key=lambda q: q[0]); cur = []
        cur.append(b)
    rows += sorted(cur, key=lambda q: q[0])
    rows = [drop_label(px, bg, b) for b in rows]
    for a, b in sorted(JOIN.get(land, []), reverse=True):
        A, B = rows[a], rows[b]; rows[a] = (min(A[0], B[0]), min(A[1], B[1]), max(A[2], B[2]), max(A[3], B[3])); rows.pop(b)
    names = NAMES[land]
    print(land, len(sprites), 'sprites,', len(labels), 'labels,', len(names), 'names')
    od = os.path.join(root, 'art', 'source', 'realm', 'native'); os.makedirs(od, exist_ok=True); out = []
    for k, b in enumerate(rows):
        if k >= len(names): print('  extra sprite at', b); continue
        if names[k] in BOTTOM: b = (b[0], b[1], b[2], BOTTOM[names[k]])
        C = cell or CELL                                    # (the sheets' art: about five screen pixels to its pixel)
        g = trim(keep_biggest(outline(sample(px, bg, b, C))) if land not in JOIN else outline(sample(px, bg, b, C)))   # (a joined sprite keeps every piece: its smoke, its shards; the jackal's specks taken off by hand)
        write_png(os.path.join(od, names[k] + '.png'), g); out.append((names[k], g)); print(f'  {names[k]:24s} {len(g[0])}x{len(g)} cell {C} box {b}')
    S = 3; cw = max(len(g[0]) for _, g in out) * S + 6; ch = max(len(g) for _, g in out) * S + 6; cols = 6; nr = (len(out) + cols - 1) // cols
    sh = [[(40, 36, 48, 255)] * (cw * cols) for _ in range(ch * nr)]
    for k, (_, g) in enumerate(out):
        ox, oy = (k % cols) * cw, (k // cols) * ch
        for y, r in enumerate(g):
            for x, c in enumerate(r):
                if c[3]:
                    for dy in range(S):
                        for dx in range(S): sh[oy + 3 + y * S + dy][ox + 3 + x * S + dx] = c
    write_png(os.path.join(od, f'_land_{land}_contact.png'), sh)


if __name__ == '__main__':
    for land in (sys.argv[1:] or NAMES):
        cut(land)
