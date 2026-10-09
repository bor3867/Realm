"""Builds the Forge Knight sprite assets + previews.

    py tools/build_forge_knight.py
"""
import base64
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from pixlib import hex_rgba, render, write_png, sheet  # noqa: E402
import anvilheart  # noqa: E402
import forge_candidates as fc  # noqa: E402

ROOT = os.path.join(os.path.dirname(__file__), '..', 'art', 'sprites', 'player', 'forge_knight')
PREVIEW = os.path.join(ROOT, 'preview')
CANDS = os.path.join(ROOT, 'candidates')
FW = FH = 16
BG = hex_rgba('#2A2833')
SIL = hex_rgba('#0A0A0E')

TIMING = {'idle': (3, True), 'walk': (8, True), 'attack': (12, False),
          'ability': (10, False), 'hit': (1, False), 'death': (7, False)}


def palette(hexpal):
    return {k: hex_rgba(v) for k, v in hexpal.items()}


def paste(dst, src, x, y):
    for j, row in enumerate(src):
        for i, px in enumerate(row):
            if px[3] and 0 <= y + j < len(dst) and 0 <= x + i < len(dst[0]):
                dst[y + j][x + i] = px


def build_sheet():
    pal = palette(anvilheart.PAL)
    F = anvilheart.frames()
    grid, anims = [], {}
    for r, keys in enumerate(anvilheart.LAYOUT):
        row = []
        for key in keys:
            fps, loop = next(v for k, v in TIMING.items() if k in key)
            anims[key] = {'row': r, 'col': len(row), 'frames': len(F[key]), 'fps': fps, 'loop': loop}
            row.extend(F[key])
        grid.append(row)
    cols = max(len(r) for r in grid)
    big = sheet(grid, FW, FH)
    write_png(os.path.join(ROOT, 'anvilheart_sheet.png'), render(big, pal))
    write_png(os.path.join(PREVIEW, 'anvilheart_sheet_x8.png'), render(big, pal, 8, BG))

    anims['hit']['holdMs'] = 150
    anims['attack']['eventFrame'] = 1
    anims['ability']['eventFrame'] = 3
    anims['death']['holdLastFrame'] = True
    for k in ('side_idle', 'side_walk'):
        anims[k]['note'] = 'faces RIGHT; flip horizontally for LEFT (design is mirror-safe)'
    guide = {
        'image': 'anvilheart_sheet.png', 'frameWidth': FW, 'frameHeight': FH,
        'columns': cols, 'rows': len(grid), 'frameCount': sum(a['frames'] for a in anims.values()),
        'pivot': {'x': 8, 'y': 15, 'note': 'bottom-centre between the boots, same pixel in every frame'},
        'animations': anims,
    }
    with open(os.path.join(ROOT, 'anvilheart_sheet.json'), 'w') as f:
        json.dump(guide, f, indent=2)
    return F, guide


def build_candidates(F):
    sets = [
        ('a_anvilheart', anvilheart.PAL, [F['front_idle'][0], F['ability'][2]]),
        ('b_mold_wrought', fc.PAL_B, fc.mold_wrought()),
        ('c_bellows_bound', fc.PAL_C, fc.bellows_bound()),
    ]
    S, G = 8, 16
    cell = FW * S
    W = G + 4 * (cell + G) + (FW + G) + (FW * 2 + G)
    H = G + len(sets) * (cell + G)
    canvas = [[BG] * W for _ in range(H)]
    for n, (name, hexpal, frs) in enumerate(sets):
        pal = palette(hexpal)
        write_png(os.path.join(CANDS, f'{name}_strip.png'), render(sheet([frs], FW, FH), pal))
        y, x = G + n * (cell + G), G
        for fr in frs:
            paste(canvas, render(fr, pal, S), x, y); x += cell + G
        for fr in frs:
            paste(canvas, render(fr, pal, S, silhouette=SIL), x, y); x += cell + G
        paste(canvas, render(frs[0], pal, 1), x, y + cell - FH); x += FW + G
        paste(canvas, render(frs[0], pal, 2), x, y + cell - FH * 2)
    write_png(os.path.join(PREVIEW, 'candidates_x8.png'), canvas)


def build_player(guide):
    from build_brawler import PLAYER
    with open(os.path.join(ROOT, 'anvilheart_sheet.png'), 'rb') as f:
        b64 = base64.b64encode(f.read()).decode()
    html = (PLAYER.replace('Forgefist', 'Anvilheart')
            .replace('__IMG__', b64).replace('__GUIDE__', json.dumps(guide)))
    with open(os.path.join(PREVIEW, 'anvilheart_player.html'), 'w') as f:
        f.write(html)


if __name__ == '__main__':
    for d in (PREVIEW, CANDS):
        os.makedirs(d, exist_ok=True)
    F, guide = build_sheet()
    build_candidates(F)
    build_player(guide)
    print(guide['columns'], guide['rows'], guide['frameCount'])
