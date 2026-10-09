"""Builds art/sprites/bosses/unstruck_sheet.png + .json (+ 4x preview).

    py tools/build_boss.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from pixlib import hex_rgba, render, write_png, sheet  # noqa: E402
from enhance import enhance, upscale, enhance_sheet  # noqa: E402
import unstruck  # noqa: E402

ROOT = os.path.join(os.path.dirname(__file__), '..', 'art', 'sprites', 'bosses')

if __name__ == '__main__':
    os.makedirs(os.path.join(ROOT, 'preview'), exist_ok=True)
    F = unstruck.frames()
    grid = [[F[i] for i in row] for row in unstruck.LAYOUT]
    big = sheet(grid, unstruck.S, unstruck.S)
    pal = {k: hex_rgba(v) for k, v in unstruck.PAL.items()}
    px = enhance_sheet(render(big, pal), unstruck.S, unstruck.S, grain=13)
    write_png(os.path.join(ROOT, 'unstruck_sheet.png'), px)
    from retro import retro_sheet  # RotMG pass: half density, no baked outline, vivid, 2-frame walk
    retro_sheet(os.path.join(ROOT, 'unstruck_sheet.png'), 64, 64, walk=None)
    from retro import shade_sheet
    shade_sheet(os.path.join(ROOT, 'unstruck_sheet.png'), 64, 64)
    write_png(os.path.join(ROOT, 'preview', 'unstruck_x4.png'), upscale(px, 4, hex_rgba('#2A2833')))
    # explicit [col,row] frame lists so animations may wrap rows
    pos = {i: [c, r] for r, row in enumerate(unstruck.LAYOUT) for c, i in enumerate(row)}
    seq = {'idle': [0, 1], 'tell_radial': [2], 'attack_radial': [3], 'tell_beam': [4],
           'attack_beam': [5], 'phase': [6, 7], 'hurt': [8], 'death': [9, 10, 11, 12]}
    anims = {}
    for k, idx in seq.items():
        a = dict(unstruck.ANIMS[k])
        a.pop('row', None); a.pop('col', None)
        a['cells'] = [pos[i] for i in idx]
        anims[k] = a
    guide = {'image': 'unstruck_sheet.png', 'frameWidth': unstruck.S, 'frameHeight': unstruck.S,
             'columns': 7, 'rows': 2, 'frameCount': len(F),
             'pivot': {'x': unstruck.S // 2, 'y': unstruck.S - 5}, 'animations': anims}
    with open(os.path.join(ROOT, 'unstruck_sheet.json'), 'w') as f:
        json.dump(guide, f, indent=2)
    print('ok', len(F))
