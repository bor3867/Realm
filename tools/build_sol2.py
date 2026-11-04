# Solkhar's shot library (2026-11-03, the user's sheet art/source/castle3/sheet_solkhar_shots.png and the audited spec's
# section 2): GLINT, SPEAR, EMBER, HALO, ECLIPSE, VOID, COMET, SUNSPARK drawn by hand at the game's own shot size (the
# sheet's shapes, pixel for pixel smaller), a one-pixel dark amber or purple rim at most; RAY and NIGHT_RAY are beams
# (drawn by the boss as lanes). Writes art/bundle/unstruck/sol2_shots.png + atlas_sol2.json ('sol2/<name>').
#   py -I tools/build_sol2.py
import os, sys, json
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402

PAL = {'.': (0, 0, 0, 0), 'W': (255, 255, 255, 255), 'Y': (255, 246, 200, 255), 'G': (255, 214, 80, 255), 'O': (255, 154, 42, 255),
       'R': (255, 90, 26, 255), 'A': (122, 58, 16, 255), 'V': (138, 58, 216, 255), 'L': (200, 144, 255, 255), 'P': (74, 26, 122, 255),
       'K': (26, 10, 36, 255), 'M': (255, 64, 208, 255), 'N': (90, 20, 60, 255)}
SHOTS = {
    'glint': ['...A...',            # a sharp four-point gold star, white at its heart
              '...G...',
              '..AYA..',
              'AGYWYGA',
              '..AYA..',
              '...G...',
              '...A...'],
    'spear': ['.AOOOOOA.',          # a narrow sun lance, orange edge, white core (drawn pointing east: the engine turns it whole with its flight)
              'AOGYWYGOA',
              '.AOOOOOA.'],
    'ember': ['..R..',              # a small incandescent orange diamond
              '.ROR.',
              'ROYOR',
              '.ROR.',
              '..R..'],
    'halo': ['..AGGA.',             # a curved gold fragment of a broken ring
             '.GYYGGA',
             'GYA..A.',
             'GA.....',
             'GA.....',
             '.A.....'],
    'eclipse': ['.KPVV.',           # a violet and black crescent
                'K.PLVV',
                '...PLV',
                '...PLV',
                'K.PLVV',
                '.KPVV.'],
    'void': ['K.....',              # a tiny purple-black shard, its tip (east) bright magenta
             'KPPVL.',
             '.KPVLM',
             'K.....'],
    'comet': ['...AGGA',            # a pale-gold teardrop with its two-pixel tail
              'G.GYWYG',
              '.GYWWYG',
              'G.GYWYG',
              '...AGGA'],
    'sunspark': ['.R.R.R.',         # a little orange-white fireball from a lesser sun
                 'R.ROR.R',
                 '.RYWYR.',
                 'ROWWWOR',
                 '.RYWYR.',
                 'R.ROR.R',
                 '.R.R.R.'],
}

if __name__ == '__main__':
    out = os.path.join(root, 'art', 'bundle', 'unstruck')
    cells = [(k, [[PAL[c] for c in row] for row in g]) for k, g in SHOTS.items()]
    W = sum(len(g[0]) + 2 for _, g in cells); H = max(len(g) for _, g in cells)
    sheet = [[PAL['.']] * W for _ in range(H)]; sprites = {}; x = 0
    for k, g in cells:
        for y, r in enumerate(g):
            for i, c in enumerate(r): sheet[y][x + i] = c
        sprites[k] = {'frames': {'0': [x, 0, len(g[0]), len(g)]}, 'meta': {}}
        x += len(g[0]) + 2
    write_png(os.path.join(out, 'sol2_shots.png'), sheet)
    json.dump({'rf': True, 'meta': {'name': "Solkhar's shot library", 'version': 2}, 'sheets': {'sol2': {'image': 'sol2_shots.png', 'kind': 'shot', 'sprites': sprites}}},
              open(os.path.join(out, 'atlas_sol2.json'), 'w', encoding='utf8', newline='\n'), indent=1)
    ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
    if 'unstruck/atlas_sol2.json' not in idx['atlases']:
        idx['atlases'].append('unstruck/atlas_sol2.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
    print('sol2:', list(sprites))
