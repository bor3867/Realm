# Ashkar's unique loot (2026-11-01, the user's design spec: "separate rare chances for unique Ashkar-themed equipment"):
# four relics of the Chained Forge-Giant, drawn in the island's colours (iron and obsidian over a molten core, the
# "Volcanic Depths" sheet), RotMG-sized 8x8 icons, and two shots of their own.
#   ash_items/fetterbreaker    the sword: his barrel hammer, a broken shackle round the haft
#   ash_items/slagplate        the heavy armour: a breastplate cracked down the middle, the forge showing through
#   ash_items/the_last_link    the ring: the one link of his chains that held, its broken ends still glowing
#   ash_items/gatekeepers_chain the grapple line: a shackle-cuff on a length of chain
#   ash_shots/fetter           the Fetterbreaker's blow: a hammer-head of slag, white-hot in the middle
#   ash_shots/link             a thrown chain link (the ring's and the armour's shards)
#   art/bundle/throne/ash_items.png + atlas_ash_items.json          py -I tools/build_ashkar_items.py
import json, os, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
out = os.path.join(root, 'art', 'bundle', 'throne')
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402

PAL = {'o': '#16121c', 'i': '#34303c', 'I': '#4c4656', 'h': '#6c6478', 'H': '#928aa0', 'S': '#c4bccc',   # iron, dark to light
       'b': '#4a2c1c', 'B': '#7a4a2a',                                                                     # the haft's wood
       'r': '#6a1e1e', 'l': '#c8381a', 'L': '#ff6a1c', 'y': '#ffa22c', 'Y': '#ffd660', 'w': '#fff4c4'}     # the forge's fire
ITEMS = {
    'fetterbreaker': [
        '...hHHh.',
        '..hHSSHh',
        '..lyYyLl',
        '..iIhIIi',
        '...oBoo.',
        '..HBh...',
        '.Bh.....',
        'b.......'],
    'slagplate': [
        '.hH..Hh.',
        'hHIhhIHh',
        'iIIlLIIi',
        '.iIrYIi.',
        '.iIyLIi.',
        '.iILrIi.',
        '.oiyIio.',
        '..oiio..'],
    'the_last_link': [
        '..hHHh..',
        '.hI..SH.',
        '.H....H.',
        '.I....I.',
        '.I....I.',
        '.i....i.',
        '.ly..yl.',
        '..L..Y..'],
    'gatekeepers_chain': [
        '..hHHh..',
        '.hl..lH.',
        '.IL..LI.',
        '.iIyyIi.',
        '..oiIo..',
        '...hI...',
        '..H..h..',
        '...Hi...'],
}
SHOTS = {
    'fetter': [
        '........',
        '..hHH...',
        '.hlyLH..',
        '.IyYwLh.',
        '.iLwYyI.',
        '..iLylo.',
        '...iio..',
        '........'],
    'link': [
        '........',
        '..hHH...',
        '.h...H..',
        '.I.Ly.I.',
        '.I.yL.I.',
        '..i...i.',
        '...iio..',
        '........'],
}


def hex_rgb(h): return tuple(int(h[k:k + 2], 16) for k in (1, 3, 5))


def sheet(name, kind, art):
    keys = list(art); w = 8 * len(keys)
    rgba = [[(0, 0, 0, 0)] * w for _ in range(8)]; sprites = {}
    for n, k in enumerate(keys):
        for y, row in enumerate(art[k]):
            assert len(row) == 8, (k, y)
            for x, c in enumerate(row):
                if c != '.': rgba[y][n * 8 + x] = hex_rgb(PAL[c]) + (255,)
        sprites[k] = {'frames': {'0': [n * 8, 0, 8, 8]}, 'meta': {}}
    write_png(os.path.join(out, name + '.png'), rgba)
    return {'image': name + '.png', 'kind': kind, 'sprites': sprites}


atlas = {'rf': True, 'meta': {'name': "Ashkar's relics", 'notes': 'tools/build_ashkar_items.py'},
         'sheets': {'ash_items': sheet('ash_items', 'item', ITEMS), 'ash_shots': sheet('ash_shots', 'shot', SHOTS)}}
with open(os.path.join(out, 'atlas_ash_items.json'), 'w', newline='\n') as f: json.dump(atlas, f, indent=1); f.write('\n')
ip = os.path.join(root, 'art', 'bundle', 'index.json')
with open(ip) as f: idx = json.load(f)
if 'throne/atlas_ash_items.json' not in idx['atlases']:
    idx['atlases'].append('throne/atlas_ash_items.json')
    with open(ip, 'w', newline='\n') as f: json.dump(idx, f, indent=1)   # (Unix line ends, as the file has them)
print('ash items:', len(ITEMS), 'icons,', len(SHOTS), 'shots')
