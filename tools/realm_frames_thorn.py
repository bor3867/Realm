# The Thornwood's and the Greenmarch's monsters, their frames drawn by hand on the user's sprites (2026-11-03): each walk
# two poses of its legs (feet, stem, hem) drawn again where they step, still joined at the hip; each attack its weapon,
# jaws, stinger, bow or staff drawn in the moments of the blow. Rows are whole pictures of the part that changes ('.'
# rubs out, '?' keeps). The format and the writer: tools/realm_frames_shore.py.   py -I tools/realm_frames_thorn.py
import os, sys
here = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, here)
from realm_frames_shore import PIX  # noqa: E402

F = {}
# ---- BRAMBLE WOLF (34x17): its legs in two strides; its jaw dropping open, then snapping shut, teeth bright
F['bramble_wolf'] = {
    'walk1': [(0, 14, ['AVA.ACVA......ANNAA..AOUOBOA......', '.A.ALFLA.......AIUHOAAAVFDA.......', '...AAA..........AAAA...AAA........'])],
    'walk3': [(0, 14, ['AVA...ACVA..ANNAA.....AOUOBOA.....', '.A....ALFLA.AIUHOA.....AAVFDA.....', '.......AAA...AAAA.......AAA.......'])],
    'atk0': [(28, 8, ['?A..AA']), (28, 9, ['AEEEA.'])],
    'atk1': [(29, 7, ['EEEEA']), (28, 8, ['AEEAA.']), (28, 9, ['.AA...'])],
    'atk2': [(29, 7, ['DEEEA'])],
}
# ---- BRIAR BEE (13x11): its wings beating (drawn up, then down); its sting curled under, then driven out
F['briar_bee'] = {
    'walk1': [(0, 0, ['.............', '.AAA.....AAA.', 'AIIKAAAAAHIHA'])],
    'walk3': [(0, 0, ['AA.......AA..', 'AIIA....AUIA.', '.AIKIAAAAHHA.'])],
    'atk0': [(3, 8, ['AGGNA', 'AFDA.', '.AA..'])],
    'atk1': [(3, 8, ['AGGNA', '.AFDA', '..AGA']), (5, 10, ['S'])],
    'atk2': [(3, 8, ['AGGNA', '.AFDA', '..AA.'])],
}
# ---- SPORE PUFF (13x11): its little stem-feet stepping; its cap's spots lighting, then puffing spores out
F['spore_puff'] = {
    'walk1': [(0, 8, ['..AJNAOANQA..', '.AJA.ACA.AQA.', '.A....A....A.'])],
    'walk3': [(0, 8, ['..AJNAOANQA..', '...AJACAQA...', '....A.A.A....'])],
    'atk0': [(2, 0, ['H..AAA..H'])],
    'atk1': [(1, 0, ['.H.HAAAH.H.']), (3, 2, ['H']), (9, 2, ['H'])],
    'atk2': [(0, 0, ['H....AAA....H'])],
}
# ---- THORNWOOD STAG (29x28): four legs in two strides; its antlers lowered for the charge, their tips bright
F['thornwood_stag'] = {
    'walk1': [(0, 24, ['...AMA.AESA.ATA..APRA........', '...AMA.ACDA.ARA..ADRA........', '....A...AA...A....ACA........', '...................A.........'])],
    'walk3': [(0, 24, ['.AMA.AESA....ATA.APRA........', '.AMA.ACDA....ARA.ADRA........', '..A...AA......A...ACA........', '...................A.........'])],
    'atk0': [(1, 1, ['I']), (27, 2, ['I'])],
    'atk1': [(1, 1, ['I']), (6, 1, ['AI']), (19, 2, ['AI']), (27, 2, ['I']), (10, 3, ['I']), (13, 4, ['I'])],
    'atk2': [(1, 1, ['I']), (27, 2, ['I'])],
}
# ---- SPIDER QUEEN (35x22): her legs in two sets, one lifted while the other plants; her eyes and fangs lighting, venom
F['spider_queen'] = {
    'walk1': [(0, 18, ['.AA....AA...AGA...........A.....ARA', 'AGCA.........A.................AACA', 'AKAKA.........................ACAEA'])],
    'walk3': [(0, 18, ['..A....ANA..AA...........AUA....AA.', '.GA....ANA................A....AA..', '.A......A..........................', '...................................'])],
    'atk0': [(19, 9, ['I']), (14, 8, ['I']), (17, 8, ['I'])],
    'atk1': [(19, 9, ['I']), (14, 8, ['I']), (17, 8, ['I']), (19, 14, ['I']), (21, 15, ['I']), (18, 16, ['I'])],
    'atk2': [(14, 8, ['I'])],
}
# ---- BARK SPIDER (16x10): its legs out and in; its fangs bright
F['bark_spider'] = {
    'walk1': [(0, 8, ['A...A.A..AAFA..A'])],
    'walk3': [(0, 8, ['.A.A...A.AAF.AA.'])],
    'atk0': [(6, 4, ['AN'])],
    'atk1': [(6, 4, ['NN']), (9, 5, ['N']), (7, 6, ['N'])],
    'atk2': [(6, 4, ['AN'])],
}
# ---- BANDIT ARCHER (19x21): his legs walking; the string drawn back, the arrow loosed, the bow empty
F['bandit_archer'] = {
    'walk1': [(0, 18, ['..AOA...AOA........', '..AFPA..AOIA.......', '...AA....AA........'])],
    'walk3': [(0, 18, ['AOA.......AOA......', 'FPA.......AOIA.....', 'AA.........AA......'])],
    'atk0': [(0, 8, ['.AJTUQPNAAAAARFKKA.'])],
    'atk1': [(0, 8, ['.AJTUQPNIA....ARF..']), (17, 7, ['KK'])],
    'atk2': [(0, 8, ['.AJTUQPNIA....ARF..'])],
}
# ---- ORC WARLORD (28x33): his feet striding; his war banner driven forward, its spearhead and sigil flaring
F['orc_warlord'] = {
    'walk1': [(0, 31, ['...AEEJA.AMSSSLAIA..........', '...AAAA..AAAAA..A...........'])],
    'walk3': [(0, 31, ['....AEEJAAMSSSLAIA..........', '.....AAAA.AAAAA.A...........'])],
    # (his weapon is the war banner's pole: its spearhead and the banner's sigil flare as he drives it; his horns left alone)
    'atk0': [(16, 1, ['FF'])],
    'atk1': [(16, 0, ['FF']), (16, 1, ['FF']), (16, 2, ['FF']), (21, 12, ['VVV']), (22, 13, ['V'])],
    'atk2': [(16, 1, ['FF']), (21, 12, ['V'])],
}
# ---- HEDGE GOBLIN (24x19): his legs walking; the knife raised, swung level from his fist, then down
F['hedge_goblin'] = {
    'walk1': [(0, 16, ['....ARNA..AMMA..........', '...APPPA.ARPPA..........', '....AAA...AAA...........'])],
    'walk3': [(0, 16, ['..ARNA......AMMA........', '.APPPA......ARPPA.......', '..AAA........AAA........'])],
    'atk0': [(18, 0, ['...AA.', '..AGKA'])],
    'atk1': [(18, 0, ['......', '......', '......', '......', '......', '......', '......', '......', '......', 'VQQQOA'])],
    'atk2': [(18, 0, ['......', '......', '......', '......', '......', '......', '......', '......', '......', 'VA....', 'AQO...', '.AQOA.', '..AA..'])],
}
# ---- GOBLIN SHAMAN (24x20): its feet under the robe; the staff's green stone flaring
F['goblin_shaman'] = {
    'walk1': [(0, 17, ['ADASSAHPA.AVULVA........', '.A.AAASHA..AAAA.........', '.....AA.................'])],
    'walk3': [(0, 17, ['.ADASSAHPA..AVULVA......', '..A.AAASHA....AAAA......', '........AA..............'])],
    'atk0': [(18, 3, ['K']), (21, 3, ['K'])],
    'atk1': [(17, 0, ['.AKEKA']), (17, 1, ['AKEEEK']), (18, 2, ['KEEK']), (15, 0, ['E']), (23, 1, ['E'])],
    'atk2': [(18, 3, ['K'])],
}
# ---- WILD BOAR (30x18): its legs in two strides; its head down for the charge, the tusks flashing
F['wild_boar'] = {
    'walk1': [(0, 16, ['...AMGJA..ASGA.AEGEA.AAKA.....', '...AAA.....AA...AAA..A........'])],
    'walk3': [(0, 16, ['.....AMGJAASGA...AEGEAAAKA....', '......AAA..AA.....AAA..A......'])],
    'atk0': [(26, 9, ['VV'])],
    'atk1': [(25, 8, ['VV']), (27, 9, ['VV']), (28, 10, ['V']), (0, 15, ['A.']), (1, 16, ['A'])],
    'atk2': [(26, 9, ['VV'])],
}
CLIPS = {'bramble_wolf': (9, 9), 'briar_bee': (12, 10), 'spore_puff': (6, 7), 'thornwood_stag': (8, 8), 'spider_queen': (7, 7), 'bark_spider': (10, 9),
         'bandit_archer': (7, 8), 'orc_warlord': (6, 7), 'hedge_goblin': (8, 9), 'goblin_shaman': (6, 8), 'wild_boar': (8, 9)}

if __name__ == '__main__':
    for id_, frames in F.items():
        p = os.path.join(PIX, id_ + '.txt'); t = open(p, encoding='utf8').read()
        head = t.split('\n# ---- drawn frames')[0].rstrip('\n'); base = head.split('frame base\n')[1].split('\n'); W = len(base[0])
        out = ['', '# ---- drawn frames (tools/realm_frames_thorn.py writes everything below)']
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
