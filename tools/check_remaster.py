"""Check the Realm Remaster swap (tools/apply_remaster.py):
- every creature sheet in the game is byte-for-byte the remaster's;
- every original world sprite, wherever it lives now, shows the remaster's cells;
- the art added since the baseline (the new dungeon portals, the boardwalk tile) is untouched;
- no remastered cell is empty where the original had art.

    py tools/check_remaster.py
"""
import json
import os
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(__file__))
from reduce import read_png  # noqa: E402
from apply_remaster import CREATURES, RM, ROOT, spans, sheet_entries  # noqa: E402

fail = 0


def bad(msg):
    global fail
    fail += 1
    print('  PROBLEM:', msg)


for src, dst in CREATURES.items():
    if open(os.path.join(RM, src), 'rb').read() != open(os.path.join(ROOT, dst), 'rb').read():
        bad(f'{dst} is not the remaster')
print('creature sheets:', len(CREATURES), 'checked')

W0 = json.load(open(os.path.join(RM, 'world_baseline.json')))
W1 = json.load(open(os.path.join(ROOT, 'art', 'world', 'world.json')))
cols = {'tiles': W1['tilesCols'], 'objects': W1['objectsCols'], 'items': W1['itemsCols'], 'projectiles': W1['projCols'],
        'decor': W1['decorCols'], 'landmarks': W1['landmarksCols'], 'fx': W1['fxCols']}


def git_png(path):                                         # the sheet as committed before the swap
    data = subprocess.run(['git', 'show', f'HEAD:{path}'], cwd=ROOT, capture_output=True).stdout
    fd, tmp = tempfile.mkstemp(suffix='.png'); os.write(fd, data); os.close(fd)
    try:
        return read_png(tmp)
    finally:
        os.remove(tmp)


for sheet, C in cols.items():
    src, now = read_png(os.path.join(RM, f'{sheet}.png')), read_png(os.path.join(ROOT, 'art', 'world', f'{sheet}.png'))
    old = git_png(f'art/world/{sheet}.png')
    cell = len(src[0]) // C
    s0 = spans(sheet_entries(W0, sheet), C * (len(src) // cell))
    s1 = spans(sheet_entries(W1, sheet), C * (len(now) // cell))
    get = lambda img, k: [tuple(img[(k // C) * cell + y][(k % C) * cell + x]) for y in range(cell) for x in range(cell)]
    ok = blank = 0
    for name, (a, n0) in s0.items():
        if name not in s1:
            continue
        b, n1 = s1[name]
        for q in range(min(n0, n1)):
            if get(now, b + q) != get(src, a + q):
                bad(f'{sheet} {name[1]} cell {q} is not the remaster')
            elif any(p[3] for p in get(src, a + q)) or not any(p[3] for p in get(old, b + q)):
                ok += 1
            else:
                blank += 1; bad(f'{sheet} {name[1]} cell {q}: the remaster has nothing where the original had art')
    new = [n for n in s1 if n not in s0]                    # added since the baseline: must be exactly as before
    for name in new:
        b, n1 = s1[name]
        for q in range(n1):
            if get(now, b + q) != get(old, b + q):
                bad(f'{sheet} {name[1]} (added since the baseline) was overwritten')
    print(f'{sheet}: {ok} remastered cells match; {len(new)} later sprites untouched' + (f' ({", ".join(n[1] for n in new)})' if new else ''))
print('all OK' if not fail else f'{fail} problem(s)')
sys.exit(1 if fail else 0)
