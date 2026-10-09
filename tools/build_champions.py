"""Builds art/sprites/enemies/champions_sheet.png + .json (+ 6x preview).

    py tools/build_champions.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from pixlib import hex_rgba, render, write_png  # noqa: E402
from enhance import enhance, upscale, enhance_sheet, stretch, squash  # noqa: E402
import champions as ch  # noqa: E402
import evolved  # noqa: E402
ch.C.update(evolved.BIG)
import realm2_art  # noqa: E402
for _n, _c in realm2_art.C12.items():                          # the new lands' leaders, 12x12 art stored doubled
    ch.C[_n] = dict(pal=_c['pal'], frames=realm2_art.champion_frames(_c), meta={'biome': _c['biome']})

ROOT = os.path.join(os.path.dirname(__file__), '..', 'art', 'sprites', 'enemies')

if __name__ == '__main__':
    os.makedirs(os.path.join(ROOT, 'preview'), exist_ok=True)
    BG = hex_rgba('#2A2833')
    out1, out6, meta = [], [], {}
    for r, (name, c) in enumerate(ch.C.items()):
        pal = {k: hex_rgba(v) for k, v in c['pal'].items()}
        f7 = [enhance(render(f, pal), grain=17) for f in c['frames']]
        f1 = [f7[0], stretch(f7[0]), f7[1], squash(f7[1])] + f7[2:]
        f6 = [upscale(f, 6, BG) for f in f1]
        for y in range(ch.S):
            out1.append([px for f in f1 for px in f[y]])
        for y in range(ch.S * 6):
            out6.append([px for f in f6 for px in f[y]])
        meta[name] = dict(row=r, **c['meta'])
    write_png(os.path.join(ROOT, 'champions_sheet.png'), out1)
    from retro import retro_sheet  # RotMG pass: half density, no baked outline, vivid, 2-frame walk
    retro_sheet(os.path.join(ROOT, 'champions_sheet.png'), 24, 24)
    from retro import shade_sheet
    shade_sheet(os.path.join(ROOT, 'champions_sheet.png'), 24, 24)
    write_png(os.path.join(ROOT, 'preview', 'champions_x6.png'), out6)
    guide = {'image': 'champions_sheet.png', 'frameWidth': ch.S, 'frameHeight': ch.S, 'columns': 9,
             'animations': {'move': {'col': 0, 'frames': 4, 'fps': 6}, 'tell': {'col': 4}, 'attack': {'col': 5}, 'death': {'col': 6, 'frames': 3}},
             'rows': len(meta), 'pivot': {'x': ch.S // 2, 'y': ch.S - 1}, 'champions': meta}
    with open(os.path.join(ROOT, 'champions_sheet.json'), 'w') as f:
        json.dump(guide, f, indent=2)
    print(list(meta))
