"""Builds art/sprites/enemies/enemies_sheet.png + .json (+ 8x preview).

    py tools/build_enemies.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from pixlib import hex_rgba, render, write_png  # noqa: E402
from enhance import enhance, upscale, enhance_sheet, stretch, squash  # noqa: E402
import bestiary  # noqa: E402
import bestiary2  # noqa: E402,F401
import bestiary3  # noqa: E402,F401
import bestiary4  # noqa: E402,F401
import bestiary5  # noqa: E402,F401
import evolved  # noqa: E402
for _k, _v in evolved.SMALL.items():
    bestiary.E[_k] = _v
import town_art  # noqa: E402
import emily  # noqa: E402
bestiary.E['emily_chick'] = dict(pal=emily.PAL, frames=emily.CHICK, meta={'biome': 'runeholt'})
import realm2_art  # noqa: E402
import bestiary8 as _b8  # noqa: E402
_b8.E8.update(realm2_art.E8)
_R2B = {'glass_scarab': 'dunes', 'dune_lurker': 'dunes', 'salt_mummy': 'dunes', 'sand_skimmer': 'dunes',
        'thorn_sprite': 'thornwood', 'bramble_wolf': 'thornwood', 'spore_puff': 'thornwood', 'briar_bee': 'thornwood',
        'crystal_golem': 'steppe', 'prism_hawk': 'steppe', 'shard_crawler': 'steppe', 'quartz_jackal': 'steppe'}
for _n in realm2_art.E8:                                       # rows for the new lands' monsters (the 8x8 art fills them in)
    bestiary.E[_n] = dict(pal={'.': '#000000'}, frames=[['.' * 16] * 16] * 7, meta={'biome': _R2B[_n]})
import pack_sprites as _ps  # noqa: E402
# the sprite pack's dungeon monsters: (id, frames, (move1, move2, attack), palette, dungeon)
_PACK = [('bone_wisp', _ps.BONE_WISP, ('float1', 'float2', 'attack'), _ps.CRYPT, 'crypt'),
         ('drowned_thrall', _ps.DROWNED_THRALL, ('walk1', 'walk2', 'attack'), _ps.CRYPT, 'crypt'),
         ('brine_jelly', _ps.BRINE_JELLY, ('pulse1', 'pulse2', 'attack'), _ps.CRYPT, 'crypt'),
         ('magma_imp', _ps.MAGMA_IMP, ('flap1', 'flap2', 'attack'), _ps.EMBER, 'ember'),
         ('cinder_golem', _ps.CINDER_GOLEM, ('idle1', 'idle2', 'attack'), _ps.EMBER, 'ember'),
         ('slag_crawler', _ps.SLAG_CRAWLER, ('crawl1', 'crawl2', 'attack'), _ps.EMBER, 'ember')]
for _n, _f, (_a, _a2, _b), _pal, _d in _PACK:
    _b8.E8[_n] = dict(pal={k: v for k, v in _pal.items() if len(k) == 1}, A=_f[_a], A2=_f[_a2], B=_f[_b])
    bestiary.E[_n] = dict(pal={'.': '#000000'}, frames=[['.' * 16] * 16] * 7, meta={'biome': _d})
import dungeons4_art as _d4  # noqa: E402
_D4B = {'worker_bee': 'hive', 'wax_drone': 'hive', 'honey_grub': 'hive', 'comb_guard': 'hive', 'brood_cell': 'hive',
        'marionette': 'theatre', 'masked_chorister': 'theatre', 'stagehand': 'theatre', 'prima_donna': 'theatre', 'hanging_marionette': 'theatre',
        'understudy': 'theatre', 'mirror_puppet': 'theatre', 'refractor': 'prism', 'lumen_moth': 'prism', 'glass_knight': 'prism', 'prism_eye': 'prism',
        'prism_image': 'prism', 'night_mare': 'dream', 'sleepwalker': 'dream', 'dream_eater': 'dream', 'lullaby_moth': 'dream',
        'nightmare_knight': 'dream', 'sleepers_nightmare': 'dream'}
for _n, _e in _d4.E8.items():
    _b8.E8[_n] = _e
    bestiary.E[_n] = dict(pal={'.': '#000000'}, frames=[['.' * 16] * 16] * 7, meta={'biome': _D4B[_n]})
bestiary.E['training_dummy'] = dict(pal=town_art.PAL, frames=town_art.DUMMY, meta={'biome': 'town'})
bestiary.E['armored_dummy'] = dict(pal=dict(town_art.PAL, I='#8A5A1A', k='#FFD877', i='#4A2A0A', H='#7E7A8C', J='#B4B0C2', h='#4E4A5A'), frames=town_art.DUMMY, meta={'biome': 'town'})

ROOT = os.path.join(os.path.dirname(__file__), '..', 'art', 'sprites', 'enemies')
FW = FH = 16
COLS = 9
BG = hex_rgba('#2A2833')


def stitch(rows_rgba, scale, bg):
    W = COLS * FW * scale
    out = []
    for row in rows_rgba:
        for y in range(FH * scale):
            line = []
            for fr in row:
                line.extend(fr[y])
            line.extend([bg] * (W - len(line)))
            out.append(line)
    return out


if __name__ == '__main__':
    os.makedirs(os.path.join(ROOT, 'preview'), exist_ok=True)
    T = (0, 0, 0, 0)
    rows1, rows8, meta = [], [], {}
    for r, (name, e) in enumerate(bestiary.E.items()):
        pal = {k: hex_rgba(v) for k, v in e['pal'].items()}
        f7 = [enhance(render(f, pal)) for f in e['frames']]
        # a 4-step gait from the 2 drawn poses: contact, rise (stretch), contact, settle (squash)
        fr = [f7[0], stretch(f7[0]), f7[1], squash(f7[1])] + f7[2:]
        rows1.append(fr)
        rows8.append([upscale(f, 8, BG) for f in fr])
        meta[name] = dict(row=r, **e['meta'])
    write_png(os.path.join(ROOT, 'enemies_sheet.png'), stitch(rows1, 1, T))
    from retro import retro_sheet  # RotMG pass: half density, no baked outline, vivid, 2-frame walk
    retro_sheet(os.path.join(ROOT, 'enemies_sheet.png'), 16, 16)
    # hand-drawn 8x8 monsters replace the reduced rows (tools/bestiary8.py)
    import bestiary8
    from reduce import read_png
    sheet_px = read_png(os.path.join(ROOT, 'enemies_sheet.png'))
    for name, e8 in bestiary8.E8.items():
        if name not in meta:
            continue
        pal8 = {k: hex_rgba(v) for k, v in e8['pal'].items()}
        r0 = meta[name]['row'] * FH
        for c, g in enumerate(bestiary8.frames(e8)):
            for y in range(FH):
                for x in range(FW):
                    ch = g[y // 2][x // 2]
                    sheet_px[r0 + y][c * FW + x] = pal8[ch] if ch != '.' else T
    from retro import shade_px
    write_png(os.path.join(ROOT, 'enemies_sheet.png'), shade_px(sheet_px, FW, FH))   # RotMG light and shadow
    missing = [n for n in meta if n not in bestiary8.E8]
    print('hand-drawn:', len(bestiary8.E8), 'auto-reduced:', missing)
    write_png(os.path.join(ROOT, 'preview', 'enemies_x8.png'), stitch(rows8, 8, BG))
    guide = {
        'image': 'enemies_sheet.png', 'frameWidth': FW, 'frameHeight': FH, 'columns': COLS,
        'rows': len(rows1), 'pivot': {'x': 8, 'y': 15},
        'animations': {'move': {'col': 0, 'frames': 4, 'fps': 7, 'loop': True},
                       'tell': {'col': 4, 'frames': 1, 'holdMs': 350},
                       'attack': {'col': 5, 'frames': 1, 'holdMs': 120},
                       'death': {'col': 6, 'frames': 3, 'fps': 8, 'loop': False, 'holdLastFrame': True}},
        'enemies': meta,
    }
    with open(os.path.join(ROOT, 'enemies_sheet.json'), 'w') as f:
        json.dump(guide, f, indent=2)
    print(len(rows1), 'enemies')
