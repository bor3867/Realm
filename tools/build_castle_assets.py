# Sunthief's Castle's art families, from the user's reference sheets (2026-11-02: "SUNTHIEF'S CASTLE — COMPLETE ROOM &
# ENVIRONMENT REBUILD ... Build individual usable sprites from the references"), taken apart by tools/sheet_extract.py into
# art/source/castle3/obj/<sheet>_<n>.png and named here:
#   decor  'castle_art/<name>'   statues, ruins, gargoyles, pedestals, braziers (their flames cycling), trees and plants,
#                                banners (wall-mounted; intact, torn, chained, small, garlands)
#   tiles  'castle_carpet/<name>'  a modular carpet: each runner cut to 8x8 tiles (its caps, a repeating middle), north-south
#                                and turned east-west; the round emblems as 5x5 inlays; all ground skins (src/world/maps.js)
#   py -I tools/build_castle_assets.py [preview.png]
import json, os, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402
from reduce import read_png  # noqa: E402
OBJ = os.path.join(root, 'art', 'source', 'castle3', 'obj'); out = os.path.join(root, 'art', 'bundle', 'throne')
BL = (0, 0, 0, 0)
lum = lambda c: c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11
STATUES = ['statue_king', 'statue_queen', 'statue_priest', 'statue_knight', 'statue_monk', 'ruin_swordsman', 'ruin_torso', 'ruin_crowned_head', 'ruin_kneeling', 'ruin_hand',
           'throne_horned', 'throne_chained', 'throne_orb', 'gargoyle_winged_purple', 'gargoyle_winged', 'pedestal_banner', 'pedestal_crystal', 'pedestal_flame',
           'gargoyle_perched', 'gargoyle_perched_purple', 'brazier_gold', 'brazier_purple', 'altar']
TREES = ['pine_mid', 'pine_big', 'crimson_mid', 'crimson_big', 'pine_small', 'crimson_small', 'deadwood_big', 'ember_bloom', 'deadwood_small', 'deadwood_mid',
         'shrub_small', 'shrub_mid', 'shrub_big', 'grass_small', 'grass_ember', 'stump_broken', 'ancient_lava_tree', 'stump_small', 'stump_mid', 'leaf_small', 'leaf_ember']
BANNERS = ['banner_crown', 'banner_castle', 'banner_forge', 'banner_sun', 'banner_cursed', 'banner_eclipse', 'banner_crown_torn', 'banner_castle_torn', 'banner_forge_torn',
           'banner_sun_torn', 'banner_cursed_torn', 'banner_eclipse_torn', 'garland_red', 'banner_chain_crown', 'banner_chain_forge', 'banner_chain_sun', 'banner_chain_cursed',
           'pennant_crown', 'pennant_forge', 'pennant_sun', 'pennant_cursed', 'garland_cursed']
RUNNERS = {2: 'sun', 3: 'forge', 4: 'crown', 7: 'cursed'}       # (the carpet sheet's runners we lay, by the sheet's numbering)
EMBLEMS = {10: 'sun', 11: 'forge', 12: 'crown', 13: 'cursed'}
FLAME = {'brazier_gold', 'brazier_purple', 'pedestal_flame'}


def load(sheet, n): return read_png(os.path.join(OBJ, f'{sheet}_{n}.png'))


def trim(g):
    ys = [y for y, r in enumerate(g) if any(c[3] for c in r)]; xs = [x for x in range(len(g[0])) if any(r[x][3] for r in g)]
    return [r[xs[0]:xs[-1] + 1] for r in g[ys[0]:ys[-1] + 1]]


def resize(g, W, H):                                        # nearest pixel, to an exact size (the carpets onto the tile grid)
    h, w = len(g), len(g[0]); return [[g[min(h - 1, int((y + 0.5) * h / H))][min(w - 1, int((x + 0.5) * w / W))] for x in range(W)] for y in range(H)]


def flicker(g, k):                                          # a flame's frame: its bright pixels one step brighter or dimmer, by turns
    def f(c, x, y):
        if not c[3] or lum(c) < 140 or c[0] < c[2] * 0.9 and c[2] < 150: return c
        d = [(0, 0, 0), (30, 20, -10), (-25, -30, -10)][(k + x + y) % 3]
        return (max(0, min(255, c[0] + d[0])), max(0, min(255, c[1] + d[1])), max(0, min(255, c[2] + d[2])), 255)
    return [[f(c, x, y) for x, c in enumerate(r)] for y, r in enumerate(g)]


def pack(items, name, kind):
    W = sum(len(g[0]) + 1 for _, g in items); H = max(len(g) for _, g in items)
    sheet = [[BL] * W for _ in range(H)]; x0 = 0; fr = {}
    for k, g in items:
        oy = H - len(g)
        for y, r in enumerate(g):
            for x, c in enumerate(r): sheet[oy + y][x0 + x] = c
        fr[k] = [x0, oy, len(g[0]), len(g)]; x0 += len(g[0]) + 1
    return sheet, fr


if __name__ == '__main__':
    deco = []
    for i, n in enumerate(STATUES): deco.append((n, trim(load('sheet_statues', i))))
    for i, n in enumerate(TREES): deco.append((n, trim(load('sheet_trees', i))))
    for i, n in enumerate(BANNERS): deco.append((n, trim(load('sheet_banners', i))))
    items = []
    for n, g in deco:
        if n in FLAME: items += [(f'{n}#{k}', flicker(g, k)) for k in range(3)]
        else: items.append((n, g))
    sheet, fr = pack(items, 'castle_art', 'decor'); sp = {}
    for n, _ in deco:
        if n in FLAME: sp[n] = {'frames': {f'f{k}': fr[f'{n}#{k}'] for k in range(3)}, 'anims': {'idle': {'frames': ['f0', 'f1', 'f2'], 'fps': 6, 'loop': True}}, 'meta': {}}
        else: sp[n] = {'frames': {'f0': fr[n]}, 'anims': {'idle': {'frames': ['f0'], 'fps': 1, 'loop': True}}, 'meta': {}}
    write_png(os.path.join(out, 'castle_art.png'), sheet)
    json.dump({'rf': True, 'meta': {'name': "Sunthief's Castle's art (the user's sheets)", 'version': 1}, 'sheets': {'castle_art': {'image': 'castle_art.png', 'kind': 'decor', 'sprites': sp}}},
              open(os.path.join(out, 'atlas_castle_art.json'), 'w', encoding='utf8', newline='\n'), indent=1)
    # the carpets: runners to 3 tiles wide; a cap of a tile at each end, a middle of four tiles repeating; turned for east-west
    tiles = {}
    for i, st in RUNNERS.items():
        g = resize(trim(load('sheet_carpets', i)), 24, 48)  # (cap 8 | middle 32 | cap 8)
        rows = {'top': g[0:8], 'bot': g[40:48]}
        for k in range(4): rows[f'mid{k}'] = g[8 + k * 8:16 + k * 8]
        for part, band in rows.items():
            for c in range(3):
                t = [r[c * 8:c * 8 + 8] for r in band]
                tiles[f'{st}_ns_{part}_{c}'] = t
                tiles[f'{st}_ew_{part}_{c}'] = [[t[7 - x][y] for x in range(8)] for y in range(8)]   # (turned a quarter: the same art laid east-west)
    for i, st in EMBLEMS.items():
        g = resize(trim(load('sheet_carpets', i)), 40, 40)
        for j in range(5):
            for k in range(5): tiles[f'emblem_{st}_{j * 5 + k}'] = [r[k * 8:k * 8 + 8] for r in g[j * 8:j * 8 + 8]]
    # (each tile laid on the keep's own flagstones: where the carpet's art is clear, the floor shows, never black)
    kp = read_png(os.path.join(out, 'keep_tiles.png')); ka = json.load(open(os.path.join(out, 'atlas_keep_tiles.json'), encoding='utf8'))['sheets']['kp_tiles']['sprites']
    flo = [[[kp[ka[f]['frames']['f0'][1] + y][ka[f]['frames']['f0'][0] + x] for x in range(8)] for y in range(8)] for f in ('keep_floor_a', 'keep_floor_b')]
    for k, (n, t) in enumerate(tiles.items()):
        F2 = flo[k % 2]; tiles[n] = [[c if c[3] > 128 else F2[y][x] for x, c in enumerate(r)] for y, r in enumerate(t)]
    names = list(tiles); cols = 16; R = (len(names) + cols - 1) // cols
    ts = [[BL] * (cols * 8) for _ in range(R * 8)]; tsp = {}
    for n, k in enumerate(names):
        ox, oy = (n % cols) * 8, (n // cols) * 8
        for y in range(8):
            for x in range(8): ts[oy + y][ox + x] = tiles[k][y][x]
        tsp[k] = {'frames': {'f0': [ox, oy, 8, 8]}, 'anims': {'idle': {'frames': ['f0'], 'fps': 1, 'loop': True}}, 'meta': {}}
    write_png(os.path.join(out, 'castle_carpet.png'), ts)
    json.dump({'rf': True, 'meta': {'name': "Sunthief's Castle's carpets and emblems (the user's sheet)", 'version': 1}, 'sheets': {'castle_carpet': {'image': 'castle_carpet.png', 'kind': 'tile', 'sprites': tsp}}},
              open(os.path.join(out, 'atlas_castle_carpet.json'), 'w', encoding='utf8', newline='\n'), indent=1)
    ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
    for a in ('throne/atlas_castle_art.json', 'throne/atlas_castle_carpet.json'):
        if a not in idx['atlases']: idx['atlases'].append(a)
    json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
    if len(sys.argv) > 1:
        S = 3; write_png(sys.argv[1], [[sheet[y // S][x // S] if sheet[y // S][x // S][3] else (40, 36, 48, 255) for x in range(min(len(sheet[0]), 900) * S)] for y in range(len(sheet) * S)])
    print('castle art:', len(deco), 'objects;', len(tiles), 'carpet and emblem tiles')
    with open(os.path.join(out, 'castle_carpet_names.json'), 'w', encoding='utf8', newline='\n') as f: json.dump(names, f)
