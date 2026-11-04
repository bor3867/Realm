# Solkhar's sheet from his hand-drawn frames (art/source/bosses/pix/solkhar.txt, written by tools/solkhar_frames.py on
# the user's sprite): in each of his four looks (the halo whole; broken; the armour split; the black-gold silhouette) idle,
# hover, spear cast, summon, stagger, beam wind-up, chase; his three changes; his death; his void form. Each on his 67x64
# canvas, his feet on its bottom row (the ground anchor every shot leaves from).
# Replaces bx_solkhar in art/bundle/unstruck/atlas_solkhar.json (sol_shots there is left alone).
#   py -I tools/build_solkhar2.py [preview.png]
import json, os, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402
from reduce import read_png  # noqa: E402
import castle_pix  # noqa: E402
castle_pix.PIX = os.path.join(root, 'art', 'source', 'bosses', 'pix')
OUT = os.path.join(root, 'art', 'bundle', 'unstruck')
CW, CH, PADX = 67, 64, 6
BL = (0, 0, 0, 0)
NAMES = {1: 'The Crown Awakens', 2: 'The Stolen Light', 3: 'The Unbound Sun', 4: 'The Ninth Ascension'}

if __name__ == '__main__':
    pal, frames, clips = castle_pix.parse('solkhar'); memo = {}
    cells = []
    for n in frames:
        if n.startswith('base'): continue
        g = castle_pix.render(pal, frames, n, memo); c = [[BL] * CW for _ in range(CH)]; oy = CH - len(g)
        for y, r in enumerate(g):
            for x, col in enumerate(r):
                if col and col != 'keep' and 0 <= oy + y < CH and 0 <= PADX + x < CW: c[oy + y][PADX + x] = col
        cells.append((n, c))
    A0 = json.load(open(os.path.join(OUT, 'atlas_solkhar.json'), encoding='utf8')); S0 = A0['sheets']['bx_solkhar']['sprites']['solkhar']
    cols = 16; rows = (len(cells) + cols - 1) // cols
    sheet = [[BL] * (CW * cols) for _ in range(CH * rows)]; fr = {}
    for k, (n, c) in enumerate(cells):
        ox, oy = (k % cols) * CW, (k // cols) * CH
        for y in range(CH):
            for x in range(CW): sheet[oy + y][ox + x] = c[y][x]
        fr[n] = [ox, oy, CW, CH]
    write_png(os.path.join(OUT, 'solkhar.png'), sheet)
    clip = lambda name: {'frames': clips[name][1], 'fps': clips[name][0]}
    A = {}
    for a in (1, 2, 3, 4):                                   # (each look its own clips; the fight asks for summon/stagger/beam/chase by phase)
        P = f'p{a}_'
        A[f'idle{a}'] = {**clip(P + 'idle'), 'loop': True}
        A[f'walk{a}'] = {**clip(P + 'hover'), 'loop': True}
        A[f'charge{a}'] = {**clip(P + 'chase'), 'loop': True}
        A[f'attack{a}'] = {**clip(P + 'cast'), 'loop': False}
        A[f'hurt{a}'] = {'frames': [P + 'stag0'], 'fps': 5, 'loop': False}
        for k in ('summon', 'beam'): A[f'{k}{a}'] = {**clip(P + k), 'loop': False}
        A[f'stagger{a}'] = {**clip(P + 'stagger'), 'loop': True}
        if a > 1: A[f'enter{a}'] = {**clip(P + 'enter'), 'loop': False}
    A['death'] = {**clip('death'), 'loop': False}; A['void'] = {**clip('void'), 'loop': True}
    ph = {str(a): {'name': NAMES[a], 'idle': f'idle{a}', 'attack': f'attack{a}', 'walk': f'walk{a}', 'charge': f'charge{a}', 'hurt': f'hurt{a}', **({'enter': f'enter{a}'} if a > 1 else {})} for a in (1, 2, 3, 4)}
    A0['sheets']['bx_solkhar']['sprites']['solkhar'] = {'frames': fr, 'anims': A, 'phases': ph, 'death': 'death', 'meta': S0.get('meta', {})}
    A0['meta']['version'] = 2
    json.dump(A0, open(os.path.join(OUT, 'atlas_solkhar.json'), 'w', encoding='utf8', newline='\n'), indent=1)
    if len(sys.argv) > 1:                                    # a preview, 4x, on a checker
        S = 4; big = [[sheet[y // S][x // S] if sheet[y // S][x // S][3] else ((40, 36, 48, 255) if ((x // S) // 4 + (y // S) // 4) % 2 else (52, 48, 60, 255)) for x in range(CW * cols * S)] for y in range(CH * rows * S)]
        write_png(sys.argv[1], big)
    print('solkhar:', len(cells), 'frames')
