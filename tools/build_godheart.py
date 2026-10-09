"""Builds art/sprites/bosses/godheart_sheet.png + .json (64x64 frames).

    py tools/build_godheart.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from pixlib import hex_rgba, render, write_png, sheet  # noqa: E402
from enhance import enhance, upscale, enhance_sheet, stretch, squash  # noqa: E402
import dungeon_bosses as db  # noqa: E402

ROOT = os.path.join(os.path.dirname(__file__), '..', 'art', 'sprites', 'bosses')
if __name__ == '__main__':
    F = db.heart_frames()
    big = sheet([F], 64, 64)
    pal = {k: hex_rgba(v) for k, v in db.FH.items()}
    px = enhance_sheet(render(big, pal), 64, 64, grain=13)
    cells = [[r[k * 64:(k + 1) * 64] for r in px] for k in range(len(F))]
    cells = [cells[0], stretch(stretch(cells[0])), cells[1], squash(squash(cells[1]))] + cells[2:]   # the heart beats
    px = [sum((cl[y] for cl in cells), []) for y in range(64)]
    write_png(os.path.join(ROOT, 'godheart_sheet.png'), px)
    from retro import retro_sheet  # RotMG pass: half density, no baked outline, vivid, 2-frame walk
    retro_sheet(os.path.join(ROOT, 'godheart_sheet.png'), 64, 64)
    from retro import shade_sheet
    shade_sheet(os.path.join(ROOT, 'godheart_sheet.png'), 64, 64)
    write_png(os.path.join(ROOT, 'preview', 'godheart_x3.png'), upscale(px, 3, hex_rgba('#2A2833')))
    with open(os.path.join(ROOT, 'godheart_sheet.json'), 'w') as f:
        json.dump({'image': 'godheart_sheet.png', 'frameWidth': 64, 'frameHeight': 64, 'columns': 10, 'rows': 1,
                   'pivot': {'x': 32, 'y': 60}, 'bosses': {'fallen_heart': {'row': 0}}}, f, indent=2)
    print('ok')
