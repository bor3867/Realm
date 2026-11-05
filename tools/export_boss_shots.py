# The castle bosses' shot sprites, exported for the user to redraw (2026-11-04: "do you want to give me all of the shot
# sprites for each boss before you work on them so that I can make them better and return them to you?"). For each boss:
# every shot sprite at its native size (art/export/boss_shots/<boss>/<name>.png, each frame of an animated one), a sheet
# of them all enlarged 8x on a dark ground with a gap between, and a list of each one's size and frames and what it is.
# Return them at the same native sizes, same names (a shot may grow or shrink if the list says so; its hitbox is set in
# the code, src/bosses/<boss>.js, by 'size').
#   py -I tools/export_boss_shots.py
import json, os, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402
from reduce import read_png  # noqa: E402

BOSSES = {   # boss: [(atlas, sheet)]
    'hollow_jarl_warrior': [('throne/atlas_jarl_warrior.json', 'jarl_shots')],
    'hollow_jarl_mage': [('throne/atlas_jarl_wizard.json', 'wiz_shots')],
    'ashkar': [('throne/atlas_ash_items.json', 'ash_shots')],
    'solkhar': [('unstruck/atlas_sol2.json', 'sol2')],
}
OUT = os.path.join(root, 'art', 'export', 'boss_shots')


def main():
    for boss, srcs in BOSSES.items():
        od = os.path.join(OUT, boss); os.makedirs(od, exist_ok=True); tiles = []; lines = [f'{boss}: shot sprites (native size, frames)']
        for atlas, sheet in srcs:
            a = json.load(open(os.path.join(root, 'art', 'bundle', atlas), encoding='utf8'))
            sh = a['sheets'][sheet]; img = read_png(os.path.join(root, 'art', 'bundle', os.path.dirname(atlas), sh['image']))
            for name, sp in sh['sprites'].items():
                fr = sp['frames']
                for k, (fname, (x, y, w, h)) in enumerate(fr.items()):
                    g = [[img[y + j][x + i] for i in range(w)] for j in range(h)]
                    write_png(os.path.join(od, f'{name}.png' if len(fr) == 1 else f'{name}_{fname}.png'), g); tiles.append(g)
                w, h = list(fr.values())[0][2:]
                lines.append(f'  {name:16s} {w}x{h}  {len(fr)} frame(s)')
        S = 8; cw = max(len(t[0]) for t in tiles) * S + 16; ch = max(len(t) for t in tiles) * S + 16; cols = min(6, len(tiles)); rows = (len(tiles) + cols - 1) // cols
        out = [[(24, 20, 30, 255)] * (cw * cols) for _ in range(ch * rows)]
        for n, t in enumerate(tiles):
            ox, oy = (n % cols) * cw + 8, (n // cols) * ch + 8
            for j, r in enumerate(t):
                for i, c in enumerate(r):
                    if c[3]:
                        for dy in range(S):
                            for dx in range(S): out[oy + j * S + dy][ox + i * S + dx] = c
        write_png(os.path.join(OUT, f'{boss}_sheet_8x.png'), out)
        open(os.path.join(od, 'LIST.txt'), 'w', encoding='utf8', newline='\n').write('\n'.join(lines) + '\n')
        print('\n'.join(lines))


if __name__ == '__main__':
    main()
