# The Drowned Shore's other monsters (the user's sheet art/source/castle3/sheet_land_shore.png, 2026-11-03), their frames
# drawn by hand: the robed ones' hems and feet stepping, the jellies' tentacles swaying, the spiders' and hound's legs
# stepping by halves, the moths' wings folding in and opening (their outer wing drawn again, narrower), the gull's wings
# beating, the slimes' and the tide's foam and drips moving; attacks light their own lanterns, coral, anchors, eyes.
# Rows are whole pictures of the part that changes ('.' rubs out, '?' keeps). Writer: tools/realm_frames_thorn.py's.
#   py -I tools/realm_frames_shore2.py
import os, sys
here = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, here)
from realm_frames_shore import PIX  # noqa: E402


def fold(W, H, cols, top, bot):                              # wings drawn half-folded: the outer columns rubbed out, a new edge drawn at the fold
    a, b = cols
    out = []
    for y in range(top, bot + 1):
        out.append((0, y, ['.' * a + 'A']))
        out.append((W - a - 1, y, ['A' + '.' * a]))
    return out


F = {}
F['brine_pilgrim'] = {
    'walk1': [(8, 26, ['AEPA.', '.AA..']), (0, 26, ['AAAA.EA'])],
    'walk3': [(8, 26, ['..AEP', '...AA']), (0, 26, ['..AAAEA'])],
    'atk0': [(21, 16, ['KK'])],
    'atk1': [(20, 15, ['KKKK']), (21, 16, ['FFF']), (21, 17, ['KFK']), (18, 1, ['F'])],
    'atk2': [(21, 16, ['K'])],
}
F['lantern_jelly'] = {
    'walk1': [(0, 18, ['.....ANA...AANNA...A..', '....AKNA..AMNNA.......', '.....AA....AOA........', '...........A..........'])],
    'walk3': [(0, 18, ['.......ANA..AANNA.A...', '......AKNA..AMNNA.....', '.......AA....AOA......', '.............A........'])],
    'atk0': [(9, 5, ['SSSS'])],
    'atk1': [(8, 4, ['QSSQ']), (9, 5, ['SSSS']), (9, 6, ['SSSS']), (10, 7, ['SS']), (3, 1, ['Q']), (18, 1, ['Q'])],
    'atk2': [(10, 6, ['S'])],
}
F['salt_widow'] = {
    'walk1': [(0, 20, ['.AKKA..AMA....AA.....AOOA.AA..', '..AA....AA............AA......', '..............................'])],
    'walk3': [(0, 20, ['AKKA...AMAA..AA.....AOOA...AA.', '.AA....AMLA..........AA.......', '........AA....................'])],
    'atk0': [(21, 1, ['P'])],
    'atk1': [(21, 1, ['P']), (25, 3, ['P']), (18, 2, ['P']), (23, 4, ['P'])],
    'atk2': [(25, 3, ['P'])],
}
F['pilgrim_elder'] = {
    'walk1': [(0, 29, ['.AAA.AEIIAJVKAAVA.VA.ACA', '.....AAA..AAA.A...A...A.'])],
    'walk3': [(0, 29, ['.AAA..AEIIAJVKAVAAVA.ACA', '.......AAA.AA...A..A..A.'])],
    'atk0': [(29, 12, ['HH'])],
    'atk1': [(28, 12, ['HHHH']), (28, 13, ['HHHH']), (29, 14, ['HH']), (33, 11, ['H']), (26, 1, ['H'])],
    'atk2': [(29, 12, ['H'])],
}
F['anchor_bearer'] = {
    'walk1': [(0, 22, ['.AKFAA.AEJHJA.AAEJJA', '..AA....AAAA.....AAA'])],
    'walk3': [(0, 22, ['.AKFAAAEJHJA..AAAEJJ', '..AA...AAAA....AAA..'])],
    'atk0': [(27, 10, ['M'])],
    'atk1': [(26, 10, ['MM']), (29, 14, ['M']), (31, 19, ['M']), (28, 22, ['MM'])],
    'atk2': [(29, 14, ['M'])],
}
F['lens_moth'] = {
    # (the wingbeat: its forewings drawn raised and drawn in, their tips rounded, then open again)
    'walk1': [(0, 0, ['...........', '...AAAAA...', '..AEOOIKAA.', '.AAKCIOOIAA']), (22, 0, ['...........', '...AAAAA...', '.AAKIOOEA..', 'AAIOOICKAA.'])],
    'walk3': [(0, 0, ['...........', '.AAAAAA....', 'AEOEOOIKA..'])],
    'atk0': [(5, 5, ['P']), (27, 5, ['P'])],
    'atk1': [(4, 5, ['PP']), (26, 5, ['PP']), (5, 6, ['P']), (27, 6, ['P']), (16, 8, ['J'])],
    'atk2': [(5, 5, ['P'])],
}
F['lighthouse_jelly'] = {
    'walk1': [(0, 25, ['.AA..ALLA.ALLA.ALLA.A.', '.....ALLAAFLA..ALLA...', '......ALAAULA...AA....', '.......A.AFLA.........', '..........AA..........'])],
    'walk3': [(0, 25, ['AA.ALLA.ALLA.ALLA.AA..', '...ALLAAFLA..ALLA.....', '....ALAAULA...AA......', '.....A.AFLA...........', '........AA............'])],
    'atk0': [(9, 8, ['NN'])],
    'atk1': [(8, 7, ['NNNN']), (8, 8, ['NNNN']), (9, 1, ['N']), (4, 3, ['G']), (16, 3, ['G'])],
    'atk2': [(9, 8, ['N'])],
}
F['salt_matriarch'] = {
    'walk1': [(0, 26, ['AJVA...ADJA...ADJA.....A.....AJJA...AJJA', '.AA.....AA.....AA.............AA.....AA.'])],
    'walk3': [(0, 26, ['.AJVA.ADJA..ADJA.......A.......AJJA.AJJA', '..AA...AA....AA.................AA..AA.'])],
    'atk0': [(14, 1, ['P'])],
    'atk1': [(14, 1, ['PP']), (11, 2, ['P']), (5, 6, ['P']), (30, 5, ['P']), (25, 3, ['P'])],
    'atk2': [(11, 2, ['P'])],
}
F['trap_hound_alpha'] = {
    'walk1': [(0, 19, ['....ANNPA....AIFFA..ASKFFA.', '.....AAA......AAA....AAAA..'])],
    'walk3': [(0, 19, ['......ANNPA..AIFFA....ASKFFA', '.......AAA....AAA......AAAA.'])],
    'atk0': [(22, 2, ['M'])],
    'atk1': [(21, 0, ['M']), (22, 2, ['M']), (28, 3, ['M']), (17, 2, ['M']), (32, 9, ['M'])],
    'atk2': [(28, 3, ['M'])],
}
F['anchor_titan'] = {
    'walk1': [(0, 31, ['.AQADAKLLVCLA', '...A.AAAAAA..'])],
    'walk3': [(0, 31, ['AQADAKLLVCLA.', 'A.A.AAAAAA...'])],
    'atk0': [(34, 1, ['N'])],
    'atk1': [(33, 1, ['NN']), (36, 1, ['N']), (31, 4, ['N']), (40, 5, ['N']), (37, 9, ['N'])],
    'atk2': [(36, 1, ['N'])],
}
F['moth_queen'] = {
    'walk1': [(0, 4, ['..............', '.......AAAAAAA', '.....AAUDGGGQQ', '....AJGGVSLLLL', '..AAJGNSLLKMML', '.AGONKLLDNKKMF']),
              (47, 4, ['..............', 'AAAAAAA.......', 'QQQGGGNAA.....', 'LLLLLLOGGVNA..', 'LMMMLLLSQGAA..', 'FFKKNNNLLKNGA.'])],
    'walk3': [(0, 4, ['..............', '......AAAAAA..', '....AAUDGGGQQQ']), (47, 4, ['..............', '...AAAAAA.....', 'AJQQQGGGGNAA..'])],
    'atk0': [(9, 12, ['E']), (50, 12, ['E'])],
    'atk1': [(9, 12, ['EE']), (50, 12, ['EE']), (16, 20, ['E']), (43, 20, ['E']), (30, 2, ['G'])],
    'atk2': [(50, 12, ['E'])],
}
F['reef_eel'] = {
    'walk1': [(17, 0, ['.AAAA.']), (24, 0, ['..AA.']), (0, 19, ['AJJA.AEV'])],
    'walk3': [(17, 0, ['AAAA..']), (24, 0, ['AA...']), (0, 19, ['.AJJAAEV'])],
    'atk0': [(32, 9, ['I'])],
    'atk1': [(33, 9, ['..']), (32, 10, ['I.']), (31, 8, ['I']), (35, 7, ['I'])],
    'atk2': [(32, 9, ['I'])],
}
F['brine_slime'] = {
    'walk1': [(2, 12, ['N']), (10, 1, ['C']), (24, 13, ['D'])],
    'walk3': [(20, 4, ['C']), (6, 12, ['N']), (3, 13, ['D'])],
    'atk0': [(13, 11, ['T'])],
    'atk1': [(12, 11, ['TT']), (16, 11, ['TT']), (13, 0, ['C']), (11, 0, ['A'])],
    'atk2': [(13, 11, ['T'])],
}
F['brine_slimelet'] = {
    'walk1': [(4, 2, ['H']), (13, 8, ['F'])],
    'walk3': [(9, 3, ['H']), (2, 8, ['F'])],
    'atk0': [(7, 5, ['H'])],
    'atk1': [(6, 5, ['HH']), (9, 5, ['H']), (8, 0, ['H'])],
    'atk2': [(7, 5, ['H'])],
}
F['tide_slime'] = {
    'walk1': [(12, 1, ['NNN']), (9, 3, ['N']), (2, 21, ['L'])],
    'walk3': [(20, 2, ['NN']), (24, 4, ['N']), (30, 21, ['L'])],
    'atk0': [(19, 18, ['Q'])],
    'atk1': [(18, 18, ['QQ']), (21, 18, ['QQ']), (17, 0, ['N']), (27, 2, ['N'])],
    'atk2': [(19, 18, ['Q'])],
}
F['gull'] = {
    'walk1': [(0, 0, ['.........', '.........', '.........']), (0, 3, ['.AAAMD', 'ANNNKK', '.AANKKK']), (21, 1, ['....AA', '......']), (23, 4, ['ANN'])],
    'walk3': [(0, 0, ['AAAAAAAA.', 'ANNNKKKKD'])],
    'atk0': [(23, 11, ['I'])],
    'atk1': [(22, 11, ['II']), (25, 11, ['L']), (18, 9, ['K'])],
    'atk2': [(23, 11, ['I'])],
}
F['rf_drowned_chorister'] = {
    'walk1': [(0, 36, ['.......AGVVOFFVKGIAA', '........AFVVOGGVKIIA', '..........AAAAAAAAA.'])],
    'walk3': [(0, 36, ['.........AGVVOFFVKGI', '.........AFVVOGGVKII', '.........AAAAAAAAAA.'])],
    'atk0': [(20, 2, ['D'])],
    'atk1': [(19, 2, ['DD']), (19, 3, ['MDDD']), (20, 0, ['M']), (2, 17, ['M']), (36, 17, ['M'])],
    'atk2': [(20, 3, ['D'])],
}
F['kraken_tentacle'] = {
    'walk1': [(4, 27, ['ARRRA']), (44, 26, ['AA..']), (9, 24, ['..'])],
    'walk3': [(5, 27, ['ARRA']), (43, 26, ['.AAAA']), (11, 23, ['AA'])],
    'atk0': [(30, 1, ['RR'])],
    'atk1': [(29, 1, ['RRR']), (36, 3, ['M']), (38, 5, ['M']), (8, 20, ['R']), (40, 23, ['R'])],
    'atk2': [(30, 1, ['R'])],
}
CLIPS = {'brine_pilgrim': (6, 8), 'lantern_jelly': (5, 7), 'salt_widow': (8, 8), 'pilgrim_elder': (5, 7), 'anchor_bearer': (6, 8), 'lens_moth': (10, 8), 'lighthouse_jelly': (5, 7),
         'salt_matriarch': (7, 7), 'trap_hound_alpha': (9, 9), 'anchor_titan': (5, 7), 'moth_queen': (8, 7), 'reef_eel': (6, 8), 'brine_slime': (4, 7), 'brine_slimelet': (5, 8),
         'tide_slime': (5, 7), 'gull': (8, 8), 'rf_drowned_chorister': (5, 7), 'kraken_tentacle': (4, 6)}

if __name__ == '__main__':
    for id_, frames in F.items():
        p = os.path.join(PIX, id_ + '.txt'); t = open(p, encoding='utf8').read()
        head = t.split('\n# ---- drawn frames')[0].rstrip('\n'); base = head.split('frame base\n')[1].split('\n'); W = len(base[0])
        out = ['', '# ---- drawn frames (tools/realm_frames_shore2.py writes everything below)']
        for name, patches in frames.items():
            out.append(f'frame {name} from base')
            for x, y, rows in patches:
                rows = [r[:W - x] if r[W - x:].strip('.') == '' else r for r in rows]
                for r in rows: assert x + len(r) <= W, (id_, name, x, r, W)
                out.append(f'at {x} {y}'); out.extend(rows)
            out.append('')
        mv, sh = CLIPS[id_]
        out += [f'clip move {mv} base walk1 base walk3', f'clip shoot {sh} atk0 atk1 atk2 base']
        open(p, 'w', encoding='utf8', newline='\n').write(head + '\n' + '\n'.join(out) + '\n')
    print(len(F), 'monsters')
