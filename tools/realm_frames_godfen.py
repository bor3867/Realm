# Godfall's and Ashfen's monsters, their frames drawn by hand on the user's sprites (2026-11-03): each walk two poses of
# its feet, roots or hem drawn again where they step (a halberd's or lance's haft, a staff, kept where it stands); each
# attack its blade, jaws, branches or spell drawn in the moments of the blow. Rows are whole pictures of the part that
# changes ('.' rubs out, '?' keeps). Writer: as tools/realm_frames_thorn.py.     py -I tools/realm_frames_godfen.py
import os, sys
here = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, here)
from realm_frames_shore import PIX  # noqa: E402

F = {}
# ---- FALLEN KNIGHT (30x20, the red-caped halberdier): his legs walking (the halberd's haft kept); its blade flashing
F['fallen_knight'] = {
    'walk1': [(0, 16, ['.AAARA.AKKKA.....AOKKA.', '....A...ASKKA...AOONSA', '.........APPA....AAAA.', '..........AA..........'])],
    'walk3': [(0, 16, ['.AAARA.AKKKA...AOKKA...', '....A.ASKKA...AOONSA...', '.......APPA....AAAA....', '........AA.............'])],
    'atk0': [(27, 1, ['N'])],
    'atk1': [(27, 1, ['NN']), (28, 2, ['N']), (25, 3, ['N']), (22, 0, ['N'])],
    'atk2': [(28, 2, ['N'])],
}
# ---- GILDED LANCER (21x31): his legs walking (his shield and lance kept); the lance's point flashing
F['gilded_lancer'] = {
    'walk1': [(4, 27, ['.APAA...APA..', '..ANA...APA..', '..ASMMA.APOA.', '..AAA....AA..'])],
    'walk3': [(4, 27, ['.APAA.....APA', '.ANA......APA', 'ASMMA.....APO', '.AAA.......AA'])],
    'atk0': [(18, 1, ['D'])],
    'atk1': [(17, 0, ['ADA']), (18, 1, ['D']), (18, 2, ['D']), (19, 3, ['D'])],
    'atk2': [(18, 1, ['D'])],
}
# ---- ABYSS HOUND (24x20): its legs in two strides; its teeth bared and bright
F['abyss_hound'] = {
    'walk1': [(0, 16, ['AFEA.ALLAAEA..AOA.ACMA..', 'AACA..AKMAAMEAAOCAACCA..', '.AA...AKEKAAA.AKKA.AA...', '.......AAA.....AA.......'])],
    'walk3': [(0, 16, ['AFEA..ALLAAEAAOA..ACMA..', 'AACA.AKMA.AMEAAOCA.ACCA.', '.AA..AKEKA.AA.AKKA..AA..', '......AAA......AA.......'])],
    'atk0': [(19, 9, ['G'])],
    'atk1': [(19, 9, ['GG']), (21, 10, ['G']), (22, 13, ['G']), (20, 12, ['G'])],
    'atk2': [(19, 9, ['G'])],
}
# ---- GROVE WARDEN (30x27, the treant): its root-feet stepping; its branches bursting green
F['rf_grove_warden'] = {
    'walk1': [(0, 24, ['........AMLJPA.....AMMPJA.....', '.......AJVLPPJA.....AVLAJLA...', '........AAAAAA.......AA.AA....'])],
    'walk3': [(0, 24, ['.........AMLJPA...AMMPJA......', '........AJVLPPJA..AVLAJLA.....', '.........AAAAAA....AA.AA......'])],
    'atk0': [(13, 1, ['K'])],
    'atk1': [(13, 1, ['KK']), (21, 1, ['K']), (1, 4, ['K']), (28, 5, ['K']), (8, 0, ['K'])],
    'atk2': [(21, 1, ['K'])],
}
# ---- SPROUTLING (12x14): its little root-feet; its leaves lighting
F['rf_sproutling'] = {
    'walk1': [(0, 12, ['.A..AOA...A.', '.....A......'])],
    'walk3': [(0, 12, ['.A.AOA.....A', '...A........'])],
    'atk0': [(2, 1, ['L'])],
    'atk1': [(2, 1, ['LL']), (9, 2, ['L']), (1, 0, ['L'])],
    'atk2': [(9, 2, ['L'])],
}
# ---- BOG WITCH (23x26, the hooded shaman): her robe's hem (the staff kept); the staff's yellow light flaring
F['rf_bog_witch'] = {
    'walk1': [(0, 24, ['ARFTAEA..ARARA', '.AAA..A....A.A'])],
    'walk3': [(0, 24, ['..ARFTAEAARARA', '...AAA.A..A.A.'])],
    'atk0': [(18, 2, ['I'])],
    'atk1': [(17, 0, ['.I.I']), (18, 2, ['II']), (22, 1, ['I']), (15, 1, ['I'])],
    'atk2': [(18, 2, ['I'])],
}
# ---- MARSH LURKER (46x21, the crocodile): its front foot stepping back and forward; its teeth flashing
F['rf_marsh_lurker'] = {
    'walk1': [(33, 16, ['.ACDCA...', '.AMOOA...', '..AAA....'])],
    'walk3': [(33, 16, ['...ACDCA.', '...AMOOA.', '....AAA..'])],
    'atk0': [(44, 5, ['T'])],
    'atk1': [(40, 12, ['TT']), (41, 13, ['TT']), (42, 14, ['T']), (44, 5, ['T'])],
    'atk2': [(41, 13, ['T'])],
}
# ---- ELDER WILLOW (32x42): its roots shifting as it walks; its face's purple light flaring
F['elder_willow'] = {
    'walk1': [(0, 41, ['.AAAAAA..A..AA..A.AAA.....A.A...'])],
    'walk3': [(0, 41, ['AAAAAA..A.....AA.A..AAA.A...A...'])],
    'atk0': [(14, 21, ['HH'])],
    'atk1': [(13, 21, ['HHHH']), (12, 22, ['HHHHH']), (15, 20, ['H'])],
    'atk2': [(14, 21, ['HH'])],
}
CLIPS = {'fallen_knight': (7, 8), 'gilded_lancer': (7, 8), 'abyss_hound': (9, 9), 'rf_grove_warden': (5, 7), 'rf_sproutling': (8, 8),
         'rf_bog_witch': (6, 8), 'rf_marsh_lurker': (6, 8), 'elder_willow': (4, 6)}

if __name__ == '__main__':
    for id_, frames in F.items():
        p = os.path.join(PIX, id_ + '.txt'); t = open(p, encoding='utf8').read()
        head = t.split('\n# ---- drawn frames')[0].rstrip('\n'); base = head.split('frame base\n')[1].split('\n'); W = len(base[0])
        out = ['', '# ---- drawn frames (tools/realm_frames_godfen.py writes everything below)']
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
        print(id_, len(frames), 'frames')
