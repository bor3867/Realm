# The new props on the user's castle detail sheet (2026-11-04, art/source/castle4/details/01_full_castle_details.png:
# "a library of placeable assets"): each cut from its own box on the sheet (the sheet's gold panels and labels left out),
# brought down to its native pixels at the sheet's own pixel size (tools/sheet_extract.py sample), its edge the one-pixel
# line of the art's own (castle_import outline: no thick border), trimmed. Written to art/source/castle4/obj/<name>.png and
# a contact sheet; tools/build_castle_assets.py packs them into castle_art.
#   py -I tools/castle4_props.py
import os, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402
from reduce import read_png  # noqa: E402
from castle_import import outline  # noqa: E402
from sheet_extract import sample  # noqa: E402
from sheet_crops import trim, keep_biggest  # noqa: E402

SHEET = os.path.join(root, 'art', 'source', 'castle4', 'details', '01_full_castle_details.png')
OUT = os.path.join(root, 'art', 'source', 'castle4', 'obj')
# name: (x0, y0, x1, y1) on the sheet, the sprite alone (its label below left out)
BOXES = {
    'crate_stack': (180, 1170, 350, 1300),
    'barrel': (505, 1182, 612, 1300),
    'double_gate': (842, 450, 1040, 592),
    'throne_dais': (588, 930, 760, 1064),
    'alcove_niche': (790, 930, 898, 1062),
    'sarcophagus': (936, 960, 1070, 1062),
    'brazier_large': (600, 170, 715, 322),
    'ash_shrub': (760, 1190, 920, 1294),
}


def main():
    px = read_png(SHEET); os.makedirs(OUT, exist_ok=True); out = []
    for name, b in BOXES.items():
        bg = px[b[1] + 2][b[0] + 2]
        C = 4.5                                             # (this sheet's art: about 4.5 sheet pixels to its pixel, the statues on it matching the game's own)
        g = trim(keep_biggest(outline(sample(px, bg, b, C))))
        write_png(os.path.join(OUT, name + '.png'), g); out.append((name, g)); print(f'{name:14s} {len(g[0])}x{len(g)} cell {C}')
    S = 4; cw = max(len(g[0]) for _, g in out) * S + 8; ch = max(len(g) for _, g in out) * S + 8
    sh = [[(40, 36, 48, 255)] * (cw * len(out)) for _ in range(ch)]
    for k, (_, g) in enumerate(out):
        for y, r in enumerate(g):
            for x, c in enumerate(r):
                if c[3]:
                    for dy in range(S):
                        for dx in range(S): sh[4 + y * S + dy][k * cw + 4 + x * S + dx] = c
    write_png(os.path.join(OUT, '_contact.png'), sh)


if __name__ == '__main__':
    main()


# the Bell Hall's great bell (none on the sheets: drawn here, the sheet's gold, its one-pixel dark edge; its hook, its band,
# its lip, the clapper under it)
BELL_ROWS = ['.........kkk.........', '........kDYDk........', '.........kkk.........', '.......kkkkkkk.......', '......kDGGYYGDk......',
             '.....kDGGYYWYGDk.....', '.....kDGGYYYGGDk.....', '.....kDGGYYYGGDk.....', '....kDDGGYYYGGDDk....', '....kDGGGYYYGGGDk....',
             '....kDGGGYYYGGGDk....', '....kDGGGYYYGGGDk....', '...kDDGGGYYYGGGDDk...', '...kDkkkkkkkkkkkDk...', '...kDGGGGYYYGGGGDk...',
             '..kDDGGGGYYYGGGGDDk..', '..kDGGGGGYYYGGGGGDk..', '.kDDGGGGGYYYGGGGGDDk.', '.kDkkkkkkkkkkkkkkkDk.', 'kDDGGGGGGYYYGGGGGGDDk',
             'kkkkkkkkkkkkkkkkkkkkk', '........kDGDk........', '........kDYDk........', '.........kkk.........']
BELL_PAL = {'k': (44, 26, 22, 255), 'D': (150, 92, 30, 255), 'G': (222, 162, 58, 255), 'Y': (255, 218, 118, 255), 'W': (255, 246, 206, 255), '.': (0, 0, 0, 0)}


def BELL(): return [[BELL_PAL[c] for c in r.ljust(21, '.')[:21]] for r in BELL_ROWS]


def pack_atlas():                                            # their own atlas, castle_props (the brazier's flames cycling, as castle_art's)
    import json
    from build_castle_assets import pack, flicker
    deco = [(n, read_png(os.path.join(OUT, n + '.png'))) for n in BOXES]
    deco.append(('bell', BELL()))
    deco += list(rug_tiles().items())
    FL = {'brazier_large'}; items = []
    for n, g in deco: items += [(f'{n}#{k}', flicker(g, k)) for k in range(3)] if n in FL else [(n, g)]
    sheet, fr = pack(items, 'castle_props', 'decor'); sp = {}
    for n, _ in deco:
        if n in FL: sp[n] = {'frames': {f'f{k}': fr[f'{n}#{k}'] for k in range(3)}, 'anims': {'idle': {'frames': ['f0', 'f1', 'f2'], 'fps': 6, 'loop': True}}, 'meta': {}}
        else: sp[n] = {'frames': {'f0': fr[n]}, 'anims': {'idle': {'frames': ['f0'], 'fps': 1, 'loop': True}}, 'meta': {}}
    od = os.path.join(root, 'art', 'bundle', 'throne')
    write_png(os.path.join(od, 'castle_props.png'), sheet)
    json.dump({'rf': True, 'meta': {'name': "Sunthief's Castle's props (the user's detail sheet, 2026-11-04)", 'version': 1}, 'sheets': {'castle_props': {'image': 'castle_props.png', 'kind': 'decor', 'sprites': sp}}},
              open(os.path.join(od, 'atlas_castle_props.json'), 'w', encoding='utf8', newline='\n'), indent=1)



# a rug's own tiles (2026-11-04, the user: carpets with "no awkward seams, broken corners"): its field plain, the runner's
# own red (its commonest colour) with a faint dither of the next darker; and each emblem as an inlay in a rug, its stone
# corners (the colours of its corner tile, outside its ring) given the rug's field instead
def rug_tiles():
    import json
    from collections import Counter
    od = os.path.join(root, 'art', 'bundle', 'throne')
    sh = list(json.load(open(os.path.join(od, 'atlas_castle_carpet.json'), encoding='utf8'))['sheets'].values())[0]
    img = read_png(os.path.join(od, sh['image']))
    def tile(nm):
        x, y, w, h = list(sh['sprites'][nm]['frames'].values())[0]
        return [[img[y + j][x + i] for i in range(w)] for j in range(h)]
    out = {}
    for st in ('sun', 'crown'):
        cnt = Counter(c for k in range(4) for r in tile(f'{st}_ns_mid{k}_1') for c in r if c[0] > c[2] + 40 and c[0] > 90)
        reds = [c for c, _ in cnt.most_common(6)]; base = reds[0]; dark = min(reds[:4], key=lambda c: c[0] + c[1] + c[2])
        field = [[dark if (x * 3 + y * 5) % 11 == 0 else base for x in range(8)] for y in range(8)]
        out[f'rug_{st}'] = field
        stone = set(c for r in tile(f'emblem_{st}_0') for c in r)
        for t in range(25):
            g = tile(f'emblem_{st}_{t}'); jy, ix = divmod(t, 5); o = []
            for y in range(8):
                row = []
                for x in range(8):
                    gx, gy = ix * 8 + x + 0.5 - 20, jy * 8 + y + 0.5 - 20
                    row.append(field[y][x] if (g[y][x] in stone and (gx * gx + gy * gy) ** 0.5 > 15.5) else g[y][x])
                o.append(row)
            out[f'rugemblem_{st}_{t}'] = o
    return out


if __name__ == '__main__':
    pack_atlas()
