# Runeholt's, the Steppe's and the ember lands' monsters, their frames drawn by hand on the user's sprites (2026-11-03):
# each walk two poses of its feet, legs or robe's hem drawn again where they step (a pole, an axe haft, kept where it
# stands); each attack its fist, blade, crystals, molten core or spell drawn in the moments of the blow. Rows are whole
# pictures of the part that changes ('.' rubs out, '?' keeps). Writer: as tools/realm_frames_thorn.py.
#   py -I tools/realm_frames_rune.py
import os, sys
here = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, here)
from realm_frames_shore import PIX  # noqa: E402

F = {}
# ---- ROCK TROLL (36x19, the moss golem): its feet by turns; its fists glowing, then slammed down, dust and moss flying
F['rock_troll'] = {
    'walk1': [(0, 17, ['..AAAA.AJLOARJA.....AKKLAERA........', '........AAAAAA......................'])],
    'walk3': [(0, 17, ['..AAAA.AJLOARJ......AKKLAERA........', '....................AAAAAA..........'])],
    'atk0': [(2, 10, ['II']), (32, 9, ['II'])],                      # (its fists glowing green with its moss: no fist lifted off its arm)
    'atk1': [(2, 10, ['II']), (32, 9, ['II']), (0, 17, ['I.A.I']), (30, 17, ['I.A.I']), (5, 18, ['A.I']), (27, 18, ['I.A'])],   # (slammed down: moss and dust thrown up at its fists)
    'atk2': [(0, 17, ['..A..']), (30, 17, ['..A..'])],
}
# ---- CRAG DWARF (19x17): his legs walking; his sword raised, swung level from his fist, then down
F['crag_dwarf'] = {
    'walk1': [(0, 14, ['.ANVA..AANA........', 'AMQQA....AEDA......', '.AA.......AA.......'])],
    'walk3': [(0, 14, ['..ANVAAANA.........', '..AMQQAAEDA........', '...AAA..AA.........'])],
    'atk0': [(15, 2, ['.AA.', 'AJJA'])],
    'atk1': [(14, 4, ['.....', '.....', '.....', '.....', '.....', 'CCCJA'])],
    'atk2': [(14, 4, ['.....', '.....', '.....', '.....', '.....', 'CA...', 'ACCA.', '.AJA.'])],
}
# ---- CRYSTAL GOLEM (30x31): its feet by turns; the crystals on its back flaring, shards of light about it
F['crystal_golem'] = {
    'walk1': [(0, 28, ['...AAA..ALNQRA....ALPCA...A...', '........ATOTCA.....AAA........', '.........AAAA.................'])],
    'walk3': [(0, 28, ['...AAA..ATOTCA....ADLTA...A...', '.........AAAA.....ALPCA.......', '...................AAA........'])],
    'atk0': [(25, 1, ['VVV']), (14, 1, ['VV'])],
    'atk1': [(25, 1, ['VVV']), (14, 1, ['VV']), (19, 5, ['V']), (12, 0, ['V']), (29, 3, ['V']), (9, 4, ['V'])],
    'atk2': [(25, 1, ['VUV'])],
}
# ---- CAIRN CRAWLER (32x30, the lava lizard): its claws stepping; embers flaring along its spines
F['cairn_crawler'] = {
    'walk1': [(0, 27, ['ATAACAFSA......ANNAKVANFA.......', '.A..A.AA........................', '................................'])],
    'walk3': [(0, 27, ['.ALLCAFSA......ANNAKVANFA.......', '..A.A.AA........AA.AA.AVA.......', '.......................A........'])],
    'atk0': [(11, 0, ['S'])],
    'atk1': [(10, 0, ['M.S.M']), (9, 1, ['S']), (16, 0, ['M'])],
    'atk2': [(12, 0, ['S'])],
}
# ---- ASH GOLEM (35x28, the lava golem): its feet by turns; its molten heart flaring, its fists glowing
F['rf_ash_golem'] = {
    'walk1': [(0, 26, ['........AFTHLSLA.....AKHLLCA......', '.........AAAAAA.....AETHTHLA.......'])],
    'walk3': [(0, 25, ['.........ACHLLCA.....AETHTHLA......', '........ACHLLCA......AAAAAA........', '.......AFTHLSLA....................'])],
    'atk0': [(16, 5, ['GUUG']), (17, 6, ['UGGU'])],
    'atk1': [(16, 4, ['GGGG']), (16, 5, ['GUUG']), (17, 6, ['UGGU']), (28, 18, ['GG']), (4, 19, ['GG'])],
    'atk2': [(17, 6, ['UGGU'])],
}
# ---- GLACIER HEADSMAN (33x34, the horned warlord): his feet striding (his banner's pole kept); its spearhead flashing
F['glacier_headsman'] = {
    'walk1': [(0, 31, ['....ADLDA....', '....ANVNVA...', '.....AAAA....'])],
    'walk3': [(0, 31, ['.......ADLDA.', '.......ANVNVA', '........AAAA.'])],
    'atk0': [(29, 3, ['H'])],
    'atk1': [(29, 3, ['HH']), (30, 4, ['HH']), (31, 7, ['H']), (28, 8, ['H'])],
    'atk2': [(30, 4, ['H'])],
}
# ---- WOLF SHIELD (18x20, the knight): his legs walking; his sword swung level, then down
F['wolf_shield'] = {
    'walk1': [(0, 17, ['AQAA..AA..AJFA....', '.AFA.....AJQA.....', '..A......AA.......'])],
    'walk3': [(0, 17, ['.AQAA..AA..AJFA...', 'AFA........AJQA...', '.A..........AA....'])],
    'atk0': [(15, 3, ['.A.', 'AIA'])],
    'atk1': [(14, 4, ['....', '....', '....', '....', '....', '....', '....', 'RRIA'])],
    'atk2': [(14, 4, ['....', '....', '....', '....', '....', '....', '....', 'RA..', '.RRA', '..AA'])],
}
# ---- RIME HERALD (21x24, the hooded frost mage): the robe's hem as it walks (the spear kept); the ice tip flaring
F['rime_herald'] = {
    'walk1': [(0, 21, ['.ALLLNA..ALMA', '.AUNJJA..ALNP', '..AAAA....AAA'])],
    'walk3': [(0, 21, ['...ALLLNAALMA', '...AUNJJAALNP', '....AAAA.AAA.'])],
    'atk0': [(17, 1, ['K'])],
    'atk1': [(16, 0, ['.K.K']), (17, 2, ['K']), (19, 4, ['K']), (15, 3, ['K'])],
    'atk2': [(17, 2, ['K'])],
}
# ---- FROST SKALD (31x24, the casting mage): its robe's hem swaying; the cyan spell in its hand flaring
F['frost_skald'] = {
    'walk1': [(0, 21, ['..ADADQAPGRJQLQAAAQPA', '...AADAAAGIQAAA..AA..', '.....AA...AAA........'])],
    'walk3': [(0, 21, ['....ADADQAPGRJQLQAAQPA', '.....AADAAAGIQAAAA....', '.......AA..AAA........'])],
    'atk0': [(25, 3, ['VV'])],
    'atk1': [(24, 1, ['.V.V.']), (23, 3, ['VKKV']), (29, 0, ['V']), (30, 5, ['V'])],
    'atk2': [(25, 3, ['KV'])],
}
# ---- CINDER GOLEM (32x31, the stone golem with a molten core): its feet by turns; the core flaring, its fists sparking
F['cinder_golem'] = {
    'walk1': [(0, 28, ['.........AMKSOA.....AVKOOA......', '.........AFPPUOA.....AAA........', '..........AAAAA.................'])],
    'walk3': [(0, 28, ['.........AMKSOA.....AVKOOA......', '..........AAA.......AJOGA.......', '....................AAA.........'])],
    'atk0': [(17, 16, ['LLLL'])],
    'atk1': [(16, 15, ['LLLLL']), (17, 16, ['LLLL']), (18, 17, ['LL']), (2, 20, ['L']), (29, 20, ['L'])],
    'atk2': [(17, 16, ['LL'])],
}
CLIPS = {'rock_troll': (5, 7), 'crag_dwarf': (8, 9), 'crystal_golem': (5, 7), 'cairn_crawler': (8, 8), 'rf_ash_golem': (5, 7), 'glacier_headsman': (6, 7),
         'wolf_shield': (7, 9), 'rime_herald': (6, 8), 'frost_skald': (6, 8), 'cinder_golem': (5, 7)}

if __name__ == '__main__':
    for id_, frames in F.items():
        p = os.path.join(PIX, id_ + '.txt'); t = open(p, encoding='utf8').read()
        head = t.split('\n# ---- drawn frames')[0].rstrip('\n'); base = head.split('frame base\n')[1].split('\n'); W = len(base[0])
        out = ['', '# ---- drawn frames (tools/realm_frames_rune.py writes everything below)']
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
