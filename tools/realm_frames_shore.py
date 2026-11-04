# The Drowned Shore's monsters, their frames drawn by hand on the user's sprites (2026-11-03): each walk a set of legs
# (or feet, or a tail) drawn again in each place they step to; each attack a claw, a blade, a staff drawn raised, then
# striking, with the light of it. Rows are whole pictures of the part that changes ('.' rubs out, '?' keeps).
#   py -I tools/realm_frames_shore.py   (then py -I tools/realm_pix.py build)
import os
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
PIX = os.path.join(root, 'art', 'source', 'realm', 'pix')

# each: {frame: [(x, y, [rows]) ...]}, clips; every frame 'from base'
F = {}

# ---- SHORE CRAB (22x16): eight legs stepping by halves; the claws open, then snap
L_UP = ['ARGAAUNK', '.ARDANAA', '..AAACA.', '...ADA..', '........']
L_OUT = ['ARGAAUNK', 'ARDAANAA', 'AA..ACA.', 'A....ADA', '......A.']
R_UP = ['AANAAALA', 'AALNADA.', '.ACAAA..', '..ADA...', '........']
R_OUT = ['AANAAALA', 'AALNAARA', '.ALA...A', 'AGA....A', 'A.......']
F['shore_crab'] = {
    'walk1': [(0, 11, L_UP), (14, 11, R_OUT)],
    'walk3': [(0, 11, L_OUT), (14, 11, R_UP)],
    'atk0': [(0, 0, ['...AAA..', '..AQQPA.', '.A....AA']), (14, 0, ['..AIAA..', '.A....A.', '..AOPUA.'])],   # (the pincers open: their upper fingers drawn lifted)
    'atk1': [(0, 1, ['...AAA..', '..AOOPAA']), (14, 1, ['..AIAA..', '..AOOUA.']), (9, 0, ['T']), (12, 0, ['T'])],   # (snapped shut, the pincers bright; a flick of spray)
    'atk2': [(0, 1, ['...AAA..', '..AQOPAA']), (14, 1, ['..AIAA..', '..AOPUA.'])],
}
F['shore_crab_clips'] = ['clip move 6 base walk1 base walk3', 'clip shoot 8 atk0 atk1 atk2 base']

# ---- CORAL CRAB (32x20): its legs by halves; the great claws open and clap
F['rf_coral_crab'] = {
    'walk1': [(0, 17, ['AFA...AHA.........A.....AFDA.ALA', '.A.....A.................AFA.AVA', '..........................A...A.'])],
    'walk3': [(0, 17, ['AFA..AHFA.........A...AFDA...ALA', 'AIA...AHA.............AFA....AA.', 'AA.....A..............A.........'])],
    'atk0': [(6, 3, ['..']), (24, 3, ['..']), (6, 0, ['ATA']), (23, 0, ['ATTA'])],
    'atk1': [(4, 2, ['ATTTA']), (22, 1, ['ATTTTA']), (14, 0, ['T.T'])],
    'atk2': [(4, 2, ['APTPA']), (22, 1, ['ANTSDA'])],
}
F['rf_coral_crab_clips'] = ['clip move 6 base walk1 base walk3', 'clip shoot 8 atk0 atk1 atk2 base']

# ---- DRIFTWOOD BANDIT (23x19): his legs walking; the cutlass drawn back over his shoulder, then cut down across him
F['driftwood_bandit'] = {
    'walk1': [(2, 14, ['.AAFIJAAFJDA', '.AJDFA...AFDA', 'AJPA.....ADDA', 'AUA.......AJCVVA', '.A.........AAAA.'])],
    'walk3': [(2, 14, ['..AFIJAAFJDA.', '..AJDFAAFDA..', '...ACJPADDA..', '...AUGA.AJCVA', '....AA...AAA.'])],
    # the cutlass (cols 14-22, rows 0-12) up and back, then down across: drawn in each place
    'atk0': [(14, 0, ['.....AFA.', '.....ADQA', '.....ARQA', '....ATRQA', '....AHRQA', '...AHHQA.', '..AIHMA..', '.ADDHQA..', '?DHA.....', '?A.......', '?........', '?........'])],
    # (the swing: his arm and hand kept, the blade drawn level from his fist, then angled down)
    'atk1': [(18, 0, ['.....', '.....', '.....', '.....', '.....', '.....', '.....', '.....', '.....', 'QQQMA', 'AAAA.'])],
    'atk2': [(18, 0, ['.....', '.....', '.....', '.....', '.....', '.....', '.....', '.....', '.....', 'QQA..', 'AQQA.', '.AQMA', '..AA.'])],
}
F['driftwood_bandit_clips'] = ['clip move 7 base walk1 base walk3', 'clip shoot 9 atk0 atk1 atk2 base']

# ---- TIDE HERALD (24x20): the robe's hem swaying as it walks; the staff raised, its cyan stone flaring, then down
F['tide_herald'] = {
    'walk1': [(1, 16, ['A..AKDRGA.AMKA', '..ARRDOA...ATHA', '.ADRAATA...AHUHA', '..AA..A.....AAA.'])],
    'walk3': [(1, 16, ['A...AKDRGAAMKA.', '...ARRDOAATHA..', '..ADRAATAAHUHA.', '...AA..A..AAA..'])],
    'atk0': [(14, 0, ['.AAA..AA..', 'ALPPAAPPA.', '.APACEAPA.', 'AVPAAALLEA']), (17, 9, ['ACQA'])],
    'atk1': [(14, 0, ['ALPLA.ALPA', 'LPPPLLPPPL', '.APLPLAPLA', 'AVPLPALLEA']), (12, 0, ['P']), (23, 2, ['P']), (19, 4, ['P'])],   # (the stone flares)
    'atk2': [(14, 0, ['.ALA..AL..', 'ALPPAAPPA.', '.APACEAPA.', 'AVPAAALLEA'])],
}
F['tide_herald_clips'] = ['clip move 6 base walk1 base walk3', 'clip shoot 8 atk0 atk1 atk2 base']

# ---- SIREN (28x20): her tail swaying under her; the knife drawn back, then thrust out
F['siren'] = {
    'walk1': [(0, 13, ['...AEECA...', '...AEAA....', '..AEFA...AA', '..AJEEAAAIF', '.ACJIFIIIIJ', '..AACCCIJJU', '....AAAAAAA'])],
    'walk3': [(0, 13, ['.AEECA.....', '.AEAA......', 'AEFA....AAA', 'AJEEAAAAIFJ', 'ACJIFIIIIJU', '.AACCCIJJUU', '...AAAAAAAA'])],
    'atk0': [(19, 0, ['.........', '.........', '.......A.', '......ALA', '.....ARLA', '....AORLA', '....AOLA.', '..AAOLA..', '.AGORA...', 'ADOLA....'])],
    'atk1': [(19, 0, ['.........', '.........', '.........', '.........', '.........', '.....AA..', '...AAOLLA', '.AAGOLLLA', 'AGORLLA..', 'DOLA.....']), (27, 5, ['L'])],
    'atk2': [(19, 0, ['.........', '.........', '........A', '.......LA', '......RLA', '.....ORLA', '....AOLA.', '..AAOLA..', '.AGORA...', 'ADOLA....'])],
}
F['siren_clips'] = ['clip move 6 base walk1 base walk3', 'clip shoot 9 atk0 atk1 atk2 base']

# ---- CONCH HERMIT (27x20): its legs out of the shell by halves; the spines bristle and flare
F['conch_hermit'] = {
    'walk1': [(0, 14, ['AFVAAHDDAVURAAEASATGACAEUFA', 'AFA.AFSAAFUA.AHAA.ACAA.AUFA', '.FA..AVMA.AFU..A...A...ATFA', '.AA...AOA.AFO..........AFA', '..A....A..AA............ALA', '.........................A.'])],
    'walk3': [(0, 14, ['AFVAAHDDAVURAAEASATGACAEUFA', 'AFA.AFSAAFUA.AHAA.ACAA.AUFA', 'AFA.AVMAAFUA..A....A...AFA.', 'AFA.AOA.AFOA..........AFA..', 'A.A..A...AA...........ALA..', '.A.....................A...'])],
    'atk0': [(11, 0, ['.AFA', 'AIAA']), (7, 2, ['AFAA']), (18, 3, ['AFA'])],
    'atk1': [(11, 0, ['AFFA', 'AIFA']), (7, 2, ['FAFA']), (18, 3, ['FFA']), (22, 6, ['AF']), (2, 5, ['FA'])],
    'atk2': [(11, 0, ['.AFA', 'AIAA'])],
}
F['conch_hermit_clips'] = ['clip move 5 base walk1 base walk3', 'clip shoot 8 atk0 atk1 atk2 base']

# ---- REEF GOLEM (38x20): its eight coral legs stepping by halves; its back's coral flaring, light running up it
F['reef_golem'] = {
    'walk1': [(0, 14, ['APDA...APQDA.ADDAMAA..AVMDAAAFFNAAVFQA', '.QNA...APFDA.ADDAA.....ADDA.AMFNA.AFNA', '.PA.....AQNA..ADA.......ADDA..AFA..APA', '.OA.....AMFA...A........AA....ANA..ANA', '..A......AVA..................AEA..ADA', '..........A.....................A....A.'])],
    'walk3': [(0, 14, ['APDA...APQDA.ADDAMAA..AVMDAAAFFNAAVFQA', 'AQNA...APFDA.ADDAA.....ADDA.AMFNA.AFNA', 'APA...AQNA..ADA.......ADDA..AFA....APA', 'AOA...AMFA...A.........AA...ANA....AN.', 'AEA...AVA....................AEA...AD.', '.A.....A......................A.....A.'])],
    'atk0': [(9, 0, ['A']), (13, 0, ['AA']), (20, 0, ['ATA']), (27, 0, ['A']), (31, 0, ['A'])],
    'atk1': [(8, 0, ['ATA']), (13, 0, ['TT']), (20, 0, ['TTT']), (26, 0, ['ATA']), (30, 0, ['ATA']), (17, 9, ['TT']), (21, 9, ['T'])],
    'atk2': [(9, 0, ['T']), (20, 0, ['ATA']), (31, 0, ['T'])],
}
F['reef_golem_clips'] = ['clip move 5 base walk1 base walk3', 'clip shoot 7 atk0 atk1 atk2 base']

# ---- TRAP HOUND (19x12): its legs scrabbling; its claws raised, then down
F['trap_hound'] = {
    'walk1': [(0, 8, ['AIMASJDOGAAOUAASIJA', '.AJAJMAAA.AAAQAAKA.', '.AQARA......A.ARA..', '..A.A.......A..A...'])],
    'walk3': [(0, 8, ['AIMASJDOGAAOUAASIJA', 'AJA.JMAAA.AAAQAAKA.', 'AQA..RA.....A.A..RA', '.A....A......A....A'])],
    'atk0': [(0, 5, ['..AAAFAEGGEBEAAA...', '.AVJAAAIEGPVAPVVA..', 'AVIDFAGSOOOAAVHVJA.'])],
    'atk1': [(0, 5, ['..AAAFAEGGEBEAAAA..', '.AMJAAAIEGPVAPQVVA.', 'AVVDFAGSOOOAAPHVVJA']), (8, 0, ['V']), (14, 1, ['V'])],
    'atk2': [(0, 5, ['..AAAFAEGGEBEAAA...', '.AMJAAAIEGPVAPQVA..', 'AVIDFAGSOOOAAPHUJA.'])],
}
F['trap_hound_clips'] = ['clip move 9 base walk1 base walk3', 'clip shoot 9 atk0 atk1 atk2 base']

if __name__ == '__main__':
    for id_ in [k for k in F if not k.endswith('_clips')]:
        p = os.path.join(PIX, id_ + '.txt'); t = open(p, encoding='utf8').read()
        head = t.split('\n# ---- drawn frames')[0].rstrip('\n'); base = head.split('frame base\n')[1].split('\n'); W = len(base[0])
        out = ['', '# ---- drawn frames (tools/realm_frames_shore.py writes everything below)']
        for name, patches in F[id_].items():
            out.append(f'frame {name} from base')
            for x, y, rows in patches:
                rows = [r[:W - x] if r[W - x:].strip('.') == '' else r for r in rows]   # (a row run past the edge: only its empty end trimmed)
                for r in rows: assert x + len(r) <= W, (id_, name, x, r)
                out.append(f'at {x} {y}'); out.extend(rows)
            out.append('')
        out += F[id_ + '_clips']
        open(p, 'w', encoding='utf8', newline='\n').write(head + '\n' + '\n'.join(out) + '\n')
        print(id_, len(F[id_]), 'frames')
