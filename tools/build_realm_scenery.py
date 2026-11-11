# The realm's scenery from the user's sheets (2026-11-03, art/source/castle3/sheet_realm_a/b.png; cut by
# tools/sheet_crops.py into art/source/castle3/obj/<sheet>_<panel>_<n>.png), named here and packed as decor
# 'rscene/<name>' (art/bundle/realmfoes/realm_scenery.png). Where each land puts them: src/world/maps.js STAND.
# A brazier's flame flickers (its bright pixels a step brighter or dimmer by turns); everything else stands still.
#   py -I tools/build_realm_scenery.py
import json, os, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402
from reduce import read_png  # noqa: E402
from build_castle_assets import trim, flicker, pack  # noqa: E402
from sheet_crops import keep_biggest  # noqa: E402
ALONE = {'tree_dead_swamp', 'pines_snow'}   # (cut with a neighbour's bit beside them: only their own body kept)
OBJ = os.path.join(root, 'art', 'source', 'castle3', 'obj'); out = os.path.join(root, 'art', 'bundle', 'realmfoes')

A, B = 'sheet_realm_a', 'sheet_realm_b'
NAMES = {
    (A, 'trees'): ['berry_bush', 'oak_green', 'stump', 'bush_green', 'tree_autumn', 'log', 'flowers_purple', 'tree_red', 'flowers_white', 'mushroom_red',
                   None, 'tree_blossom', 'mushroom_red_b', 'grass_tall', 'pine_green', 'grass_tall_b', 'pine_teal', 'grass_small'],
    (A, 'rocks'): ['boulder', 'rock_moss_flat', 'standing_stone', 'standing_stone_b', 'boulder_moss', 'pebbles', 'stones_moss', 'rock_cluster', 'arch_moss'],
    (A, 'chests'): ['chest_brown', 'chest_gold', 'chest_silver', 'chest_purple', 'chest_blue', 'chest_red'],
    (A, 'cortrees'): ['ctree_a', 'ctree_b', 'ctree_sapling', 'ctree_big', 'cstump_small', 'clog', 'cstake'],
    (A, 'roots'): ['croots', 'croot_arch', 'cbramble', 'cbramble_ring'],
    (A, 'corbush'): ['cbush_big', 'cbush', 'cbush_small', 'cgrass_a', 'cgrass_b', 'cgrass_c'],
    (A, 'corrocks'): ['crock_big', 'crock', 'crock_shard', 'crock_spire', 'ccrystal_small', 'ccrystal'],
    (A, 'bones'): ['skull_pile', 'skull', 'ribs', 'totem_banner', 'totem_horned', 'bone_arch'],
    (A, 'shrines'): ['shrine_ruin', 'rune_pillar', None, 'shrine_door', None, 'monolith', 'monolith_big'],
    (A, 'ruins'): ['ruin_arch', 'ruin_pillar', 'ruin_wall', 'stakes', 'fence', 'frame_wood', 'flag_torn'],
    (A, 'hazards'): ['crack_lava', 'crack_lava_b', 'crack_void_small', 'crack_void', None, 'slime_pools'],
    (A, 'mushrooms'): ['cmushroom_big', 'cmushroom'],
    (B, 'high_props'): ['oak_olive', 'shrub_berry', 'shrub_olive', 'tree_windswept', 'boulder_big', 'shrub_olive_b', 'shrub_red', 'gallows_banner', 'rocks_pair',
                        'grass_yellow', 'rock_pile', 'stone_moss_small', 'arch_ruin', 'wall_ruin', 'banner_sun_stand'],
    (B, 'mount_props'): ['pines_snow', 'rock_snow', 'ledge_icy', 'tree_bare', 'rock_snow_small', 'rock_snow_b', 'rocks_snow_pile', 'cliff_icy', 'pillar_snow', 'banner_red_stand',
                         None, None, 'brazier_fire', 'ice_shards', 'rock_snow_c', 'arch_icy'],
    (B, 'swamp_props'): ['pier', 'willow', None, 'tree_dead_swamp', 'lantern_post', 'tree_swamp', 'stones_pond', None, 'lily_pad', None,
                         'reeds', 'rock_moss_swamp', 'reeds_b', 'glowcap', 'arch_moss_swamp', 'glowcaps', 'pillar_moss', 'pillar_moss_b'],
}
FLAME = {'brazier_fire'}
SPLIT = {'pines_snow': ('pine_snow_big', 'pine_snow_small'), 'ctree_big': ('ctree_tall', 'cstump_big')}


def split_pair(g):
    """two things in one picture: cut along the emptiest column between their trunks (the middle half of it), each trimmed"""
    W = len(g[0]); cnt = [sum(1 for r in g if r[x][3]) for x in range(W)]
    c = min(range(W // 4, W * 3 // 4), key=lambda x: (cnt[x], abs(x - W // 2)))
    L = [r[:c] for r in g]; R = [r[c:] for r in g]
    return trim(keep_biggest(L)), trim(keep_biggest(R))

if __name__ == '__main__':
    deco = []
    for (sheet, panel), names in NAMES.items():
        for k, n in enumerate(names):
            if n: g = read_png(os.path.join(OBJ, f'{sheet}_{panel}_{k}.png')); deco.append((n, trim(keep_biggest(g) if n in ALONE else g))) if n else None
    # (2026-11-11, the user: "both of these trees are combined into one sprite so when I rotate the trunks move": a picture
    # of two things stands at one spot, so the second slides over the ground as the camera turns. Each cut in two along the
    # emptiest column between them, each piece its own sprite, set down on its own tile by src/world/maps.js PAIRS)
    whole = dict(deco)
    for n, (ln, rn) in SPLIT.items():
        L, R = split_pair(whole[n]); deco += [(ln, L), (rn, R)]
    items = []
    for n, g in deco: items += [(f'{n}#{k}', flicker(g, k)) for k in range(3)] if n in FLAME else [(n, g)]
    sheet, fr = pack(items, 'rscene', 'decor'); sp = {}
    for n, _ in deco:
        if n in FLAME: sp[n] = {'frames': {f'f{k}': fr[f'{n}#{k}'] for k in range(3)}, 'anims': {'idle': {'frames': ['f0', 'f1', 'f2'], 'fps': 6, 'loop': True}}, 'meta': {}}
        else: sp[n] = {'frames': {'f0': fr[n]}, 'anims': {'idle': {'frames': ['f0'], 'fps': 1, 'loop': True}}, 'meta': {}}
    write_png(os.path.join(out, 'realm_scenery.png'), sheet)
    json.dump({'rf': True, 'meta': {'name': "The realm's scenery (the user's sheets)", 'version': 1}, 'sheets': {'rscene': {'image': 'realm_scenery.png', 'kind': 'decor', 'sprites': sp}}},
              open(os.path.join(out, 'atlas_realm_scenery.json'), 'w', encoding='utf8', newline='\n'), indent=1)
    ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
    if 'realmfoes/atlas_realm_scenery.json' not in idx['atlases']:
        idx['atlases'].append('realmfoes/atlas_realm_scenery.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
    print('rscene:', len(deco), 'pieces', len(sheet[0]), 'x', len(sheet))
