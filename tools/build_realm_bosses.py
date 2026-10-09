"""Builds art/sprites/bosses/realm_bosses_sheet.png + .json (+ 4x preview).

    py tools/build_realm_bosses.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from pixlib import hex_rgba, render, write_png  # noqa: E402
from enhance import enhance, upscale, enhance_sheet, stretch, squash  # noqa: E402
import realm_bosses as rb  # noqa: E402
import dungeon_bosses as db  # noqa: E402
rb.B["drowned_abbot"] = dict(pal=db.AB, frames=db.abbot_frames(), meta={"biome": "chapel", "dungeon": True})
import archivist  # noqa: E402
rb.B["the_archivist"] = dict(pal=archivist.PAL, frames=archivist.FRAMES, meta={"biome": "scriptorium", "dungeon": True})
import emily  # noqa: E402
rb.B["emily_the_yapper"] = dict(pal=emily.PAL, frames=emily.FRAMES, meta={"biome": "runeholt"})
import fallen_star  # noqa: E402
rb.B["the_fallen_star"] = dict(pal=fallen_star.PAL, frames=fallen_star.FRAMES, meta={"biome": "godfall"})

ROOT = os.path.join(os.path.dirname(__file__), '..', 'art', 'sprites', 'bosses')

if __name__ == '__main__':
    os.makedirs(os.path.join(ROOT, 'preview'), exist_ok=True)
    T, BG = (0, 0, 0, 0), hex_rgba('#2A2833')
    out1, out4, meta = [], [], {}
    for r, (name, b) in enumerate(rb.B.items()):
        pal = {k: hex_rgba(v) for k, v in b['pal'].items()}
        f8 = [enhance(render(f, pal), grain=11) for f in b['frames']]
        f1 = [f8[0], stretch(stretch(f8[0])), f8[1], squash(squash(f8[1]))] + f8[2:]     # big bodies breathe 2px
        f4 = [upscale(f, 4, BG) for f in f1]
        for y in range(rb.S):
            out1.append([px for f in f1 for px in f[y]])
        for y in range(rb.S * 4):
            out4.append([px for f in f4 for px in f[y]])
        meta[name] = dict(row=r, **b['meta'])
    write_png(os.path.join(ROOT, 'realm_bosses_sheet.png'), out1)
    from retro import retro_sheet  # RotMG pass: half density, no baked outline, vivid, 2-frame walk
    retro_sheet(os.path.join(ROOT, 'realm_bosses_sheet.png'), rb.S, rb.S)
    from retro import shade_sheet
    shade_sheet(os.path.join(ROOT, 'realm_bosses_sheet.png'), rb.S, rb.S)
    write_png(os.path.join(ROOT, 'preview', 'realm_bosses_x4.png'), out4)
    guide = {'image': 'realm_bosses_sheet.png', 'frameWidth': rb.S, 'frameHeight': rb.S, 'columns': 10,
             'rows': len(out1) // rb.S, 'pivot': {'x': rb.S // 2, 'y': rb.S - 3},
             'animations': {'idle': {'col': 0, 'frames': 4, 'fps': 5, 'loop': True}, 'tell': {'col': 4, 'frames': 1},
                            'attack': {'col': 5, 'frames': 1}, 'special': {'col': 6, 'frames': 1},
                            'death': {'col': 7, 'frames': 3, 'fps': 4, 'loop': False, 'holdLastFrame': True}},
             'bosses': meta}
    with open(os.path.join(ROOT, 'realm_bosses_sheet.json'), 'w') as f:
        json.dump(guide, f, indent=2)
    print(list(meta))
