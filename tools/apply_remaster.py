"""Swap the Realm Remaster into the game (realm_update_2, packs/remaster; source art kept in art/remaster/).

The remaster redrew every original sprite (the 1069 of commit 8a276e0) as drop-in sheets: the same files, sizes and
cell positions as the originals. Two kinds of sheet, two ways in:

- Creature sheets (classes, monsters, champions, bosses) have not moved since the baseline: copied straight over.
- World sheets (tiles, objects, items, projectiles, decor, landmarks, fx) have grown since: the Realm Update added
  dungeon portals and a boardwalk tile, which shifted later cells. So these are overlaid by NAME: each original
  sprite's cells are copied from where the remaster has them (the baseline index, art/remaster/world_baseline.json)
  to where that sprite lives now (art/world/world.json). Anything added since (portals, boardwalk) is left alone.

Idempotent. world_art.py and heroes8.py call it after they bake, so a rebake never brings the old art back.

    py tools/apply_remaster.py
"""
import json
import os
import shutil
import sys

sys.path.insert(0, os.path.dirname(__file__))
from reduce import read_png  # noqa: E402
from pixlib import write_png  # noqa: E402

ROOT = os.path.join(os.path.dirname(__file__), '..')
RM = os.path.join(ROOT, 'art', 'remaster')
CLASSES = {'brawler': 'forgefist', 'forge_knight': 'anvilheart', 'priest': 'heliarch', 'summoner': 'reliquarian', 'harpooner': 'wreckwhaler',
           'duelist': 'mirrorknight', 'stormwright': 'kitehermit', 'clockmaker': 'horologist', 'runeblade': 'runeblade', 'hexweaver': 'hexweaver'}
CREATURES = {**{f'cls_{c}.png': f'art/sprites/player/{c}/{f}_sheet.png' for c, f in CLASSES.items()},
             'enemies.png': 'art/sprites/enemies/enemies_sheet.png', 'champions.png': 'art/sprites/enemies/champions_sheet.png',
             'realm_bosses.png': 'art/sprites/bosses/realm_bosses_sheet.png', 'pack_bosses.png': 'art/sprites/bosses/pack_bosses_sheet.png',
             'godheart.png': 'art/sprites/bosses/godheart_sheet.png', 'godking.png': 'art/sprites/bosses/godking_sheet.png',
             'unstruck.png': 'art/sprites/bosses/unstruck_sheet.png'}


def creatures():
    n = 0
    for src, dst in CREATURES.items():
        a, b = read_png(os.path.join(RM, src)), read_png(os.path.join(ROOT, dst))
        assert (len(a[0]), len(a)) == (len(b[0]), len(b)), f'{src}: {len(a[0])}x{len(a)} vs {dst}: {len(b[0])}x{len(b)}'
        shutil.copyfile(os.path.join(RM, src), os.path.join(ROOT, dst))
        n += 1
    return n


def spans(entries, total):
    """name -> (start, length): each name runs to the next name's start (the sheet's own packing)"""
    order = sorted(entries.items(), key=lambda kv: kv[1])
    out = {}
    for k, (name, start) in enumerate(order):
        end = order[k + 1][1] if k + 1 < len(order) else total
        out[name] = (start, max(1, end - start))
    return out


def sheet_entries(W, sheet):
    """every name that has cells on a world sheet, with its first cell index"""
    if sheet == 'tiles':
        e = {('t', k): v['i'] for k, v in W['tiles'].items()}
        e.update({('e', k): v for k, v in W.get('edges', {}).items()})
        return e
    if sheet == 'objects':
        e = {('o', k): v for k, v in W['objects'].items()}
        e.update({('b', k): v for k, v in W.get('bags', {}).items()})
        e.update({('p', k): v for k, v in W.get('portals', {}).items()})
        return e
    if sheet == 'landmarks':
        return {('l', k): v['i'] for k, v in W['landmarks'].items()}
    if sheet == 'fx':
        return {('f', k): v['i'] for k, v in W['fx'].items()}
    return {(sheet[0], k): v for k, v in W[sheet].items() if isinstance(v, int)}


def world():
    W0 = json.load(open(os.path.join(RM, 'world_baseline.json')))
    W1 = json.load(open(os.path.join(ROOT, 'art', 'world', 'world.json')))
    cols = {'tiles': W1['tilesCols'], 'objects': W1['objectsCols'], 'items': W1['itemsCols'], 'projectiles': W1['projCols'],
            'decor': W1['decorCols'], 'landmarks': W1['landmarksCols'], 'fx': W1['fxCols']}
    report = {}
    for sheet, C in cols.items():
        src = read_png(os.path.join(RM, f'{sheet}.png'))
        path = os.path.join(ROOT, 'art', 'world', f'{sheet}.png')
        dst = read_png(path)
        cell = len(src[0]) // C
        tot0, tot1 = C * (len(src) // cell), C * (len(dst) // cell)
        s0, s1 = spans(sheet_entries(W0, sheet), tot0), spans(sheet_entries(W1, sheet), tot1)
        moved = cells = 0
        for name, (a, n0) in s0.items():
            if name not in s1:
                continue                                        # an original sprite the game no longer has: nothing to replace
            b, n1 = s1[name]
            n = min(n0, n1)
            for q in range(n):
                ax, ay, bx, by = ((a + q) % C) * cell, ((a + q) // C) * cell, ((b + q) % C) * cell, ((b + q) // C) * cell
                for y in range(cell):
                    dst[by + y][bx:bx + cell] = src[ay + y][ax:ax + cell]
            cells += n
            moved += a != b
        write_png(path, dst)
        report[sheet] = (len(s0), cells, moved)
    return report


def main():
    n = creatures()
    rep = world()
    print(f'remaster applied: {n} creature sheets; world sheets (names, cells, names that moved since the baseline):',
          ', '.join(f'{k} {v[0]}/{v[1]}/{v[2]}' for k, v in rep.items()))


if __name__ == '__main__':
    main()
