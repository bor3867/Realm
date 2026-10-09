"""Shared build steps for a class: sheet PNG + engine JSON + previews + player.

A class module must expose PAL (hex palette), frames() -> {anim: [grid]},
and LAYOUT (list of rows, each a list of anim keys laid out left to right).
"""
import base64
import json
import os

from pixlib import hex_rgba, render, write_png, sheet

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


def build_sheet(mod, name, root, events=None, notes=None, fps=None):
    preview = os.path.join(root, 'preview')
    os.makedirs(preview, exist_ok=True)
    pal = palette(mod.PAL)
    F = mod.frames()
    timing = dict(TIMING, **(fps or {}))
    grid, anims = [], {}
    for r, keys in enumerate(mod.LAYOUT):
        row = []
        for key in keys:
            f, loop = next(v for k, v in timing.items() if k in key)
            anims[key] = {'row': r, 'col': len(row), 'frames': len(F[key]), 'fps': f, 'loop': loop}
            row.extend(F[key])
        grid.append(row)
    big = sheet(grid, FW, FH)
    write_png(os.path.join(root, f'{name}_sheet.png'), render(big, pal))
    write_png(os.path.join(preview, f'{name}_sheet_x8.png'), render(big, pal, 8, BG))
    if 'hit' in anims:
        anims['hit']['holdMs'] = 150
    if 'death' in anims:
        anims['death']['holdLastFrame'] = True
    for k, v in (events or {}).items():
        anims[k]['eventFrame'] = v
    for k, v in (notes or {}).items():
        anims[k]['note'] = v
    guide = {
        'image': f'{name}_sheet.png', 'frameWidth': FW, 'frameHeight': FH,
        'columns': max(len(r) for r in grid), 'rows': len(grid),
        'frameCount': sum(a['frames'] for a in anims.values()),
        'pivot': {'x': 8, 'y': 15, 'note': 'bottom-centre, same pixel in every frame'},
        'animations': anims,
    }
    with open(os.path.join(root, f'{name}_sheet.json'), 'w') as f:
        json.dump(guide, f, indent=2)
    build_player(name, root, guide)
    return F, guide


def build_candidates(sets, root):
    """sets: [(name, hexpal, [frames...])]. Writes 1x strips + an 8x comparison."""
    cands = os.path.join(root, 'candidates')
    os.makedirs(cands, exist_ok=True)
    S, G = 8, 16
    cell = FW * S
    n_fr = max(len(s[2]) for s in sets)
    W = G + 2 * n_fr * (cell + G) + (FW + G) + (FW * 2 + G)
    H = G + len(sets) * (cell + G)
    canvas = [[BG] * W for _ in range(H)]
    for n, (name, hexpal, frs) in enumerate(sets):
        pal = palette(hexpal)
        write_png(os.path.join(cands, f'{name}_strip.png'), render(sheet([frs], FW, FH), pal))
        y, x = G + n * (cell + G), G
        for fr in frs:
            paste(canvas, render(fr, pal, S), x, y); x += cell + G
        for fr in frs:
            paste(canvas, render(fr, pal, S, silhouette=SIL), x, y); x += cell + G
        paste(canvas, render(frs[0], pal, 1), x, y + cell - FH); x += FW + G
        paste(canvas, render(frs[0], pal, 2), x, y + cell - FH * 2)
    write_png(os.path.join(root, 'preview', 'candidates_x8.png'), canvas)


def build_player(name, root, guide):
    from build_brawler import PLAYER
    with open(os.path.join(root, f'{name}_sheet.png'), 'rb') as f:
        b64 = base64.b64encode(f.read()).decode()
    title = name.replace('_', ' ').title()
    html = (PLAYER.replace('Forgefist', title)
            .replace('__IMG__', b64).replace('__GUIDE__', json.dumps(guide)))
    with open(os.path.join(root, 'preview', f'{name}_player.html'), 'w') as f:
        f.write(html)
