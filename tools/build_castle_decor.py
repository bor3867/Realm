# Sunthief's Castle's ruin (2026-11-02, the user: "environmental storytelling: destroyed fortifications, fallen soldiers,
# shattered statues, broken siege equipment, collapsed towers, ancient murals"): the dressing of its rooms, drawn here at
# native size, the island's colours (ash stone, charred wood, iron, the violet of its banners, the lava, the eclipse).
# The molten ones (a crack, burning debris, a forge press) and the eclipse's obelisks are animated.
#   'castle_decor/<name>'       art/bundle/throne/castle_decor.png + atlas_castle_decor.json      py -I tools/build_castle_decor.py
import json, os, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
out = os.path.join(root, 'art', 'bundle', 'throne')
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402

PAL = {'k': (26, 18, 32), 'd': (52, 46, 60), 'm': (82, 74, 92), 'l': (122, 114, 132), 'w': (170, 162, 178),
       'b': (58, 36, 24), 'B': (100, 64, 36), 'W': (146, 100, 58), 'i': (56, 58, 72), 'I': (104, 108, 124), 'S': (178, 182, 196),
       'v': (64, 28, 92), 'V': (112, 56, 150), 'P': (168, 108, 210), 'g': (196, 146, 48), 'G': (240, 200, 92),
       'o': (190, 56, 20), 'O': (255, 118, 30), 'y': (255, 188, 60), 'Y': (255, 240, 170), 'e': (196, 186, 166), 'E': (234, 226, 208),
       'c': (28, 12, 42), 'C': (88, 48, 148), 'X': (190, 140, 255), 'a': (40, 34, 38), 'r': (150, 36, 44)}
SPR = {
    # Ashkar's gate and the eclipse (2026-11-02, the 52-area blueprint): a chain anchor, his broken hammer, a celestial pillar
    'chain_anchor': ['................', '................', '....kkkkkkk.....', '...kIIIIIIIk....', '..kIkkkkkkkIk...', '..kIk.....kIk...', '..kIk.....kIk...', '...kIIIIIIIk....', '....kkkSkkk.....', '......kSk.......', '.kkkkkkSkkkkkk..', '.kllllwSwllllk..', '.kmmmmmmmmmmmk..', '.kmmdmmmmmdmmk..', '.kdddddddddddk..', '.kkkkkkkkkkkkk..'],
    'broken_hammer': ['................', '................', '................', '................', '................', '................', '.kkkkkkk........', 'kmmoommk........', 'kmoOYomkkkkk....', 'kmOYYOmkBWBWkk..', 'kmoOYomkkkkkWBk.', 'kmmoommk...kkk..', '.kkkkkkk........', '..........kkk...', '.........kWBk...', '..........kk....'],
    'celestial_pillar': ['................', '................', '.....kGGk.......', '....kGYYGk......', '.....kGGk.......', '.....kccck......', '.....kcXck......', '.....kccck......', '.....kcCck......', '.....kccck......', '.....kcXck......', '.....kccck......', '....kccccck.....', '....kccccck.....', '...kdddddddk....', '...kkkkkkkkk....'],
    # the keep (2026-11-02, the 52-area blueprint): bunks, a dining table, a fallen chandelier, stained glass and its shards, a portcullis, a forge pipe, a lava tank, burning manuscripts
    'bed': ['................', '................', '................', '................', '................', '.kkkkkkkkkkkkk..', '.kWBBBBBBBBBWk..', '.kWeeEEeeeeeWk..', '.kWrrrrrrrrrWk..', '.kWrarrrrarrWk..', '.kWrrrrrrrrrWk..', '.kWrarrrrarrWk..', '.kWrrrrrrrrrWk..', '.kWWWWWWWWWWWk..', '.kBk.......kBk..', '.kkk.......kkk..'],
    'table': ['................', '................', '................', '................', '................', '................', '................', 'kkkkkkkkkkkkkkkk', 'kWWWWWWWWWWWWWWk', 'kWBWWBWWBWWBWWWk', 'kWWgWWWWWeWWWWWk', 'kWWWWWWWWWWWWWWk', 'kBBBBBBBBBBBBBBk', 'kkkkkkkkkkkkkkkk', '.kBk........kBk.', '.kkk........kkk.'],
    'chandelier': ['................', '................', '................', '................', '................', '................', '................', '................', '....y....y......', '...kGk..kGk.....', '..kIIIIIIIIk....', '.kIk......kIk...', '.kIk......kIk...', '..kIIIIIIIIk....', '...kGk..kGk.....', '....y....y......'],
    'window': ['................', '................', '................', '................', '................', '....kkkkkkk.....', '...kGGGGGGGk....', '..kGCXCVPCXGk...', '..kGXCVXVCXGk...', '..kGCVPYPVCGk...', '..kGVXCYCXVGk...', '..kGCXVPVXCGk...', '..kGXCVXVCXGk...', '..kGCXCVCXCGk...', '..kGGGGGGGGGk...', '..kkkkkkkkkkk...'],
    'glass_shards': ['................', '................', '................', '................', '................', '................', '................', '................', '................', '................', '..C.....X.......', '....V.......P...', '.X......C.......', '......Y.....V...', '...P.......X....', '.......C........'],
    'portcullis': ['................', '................', '................', '................', '................', 'kkkkkkkkkkkkkkkk', 'kIkIkIkIkIkIkIkk', 'kIkIkIkIkIkIkIkk', 'kkkkkkkkkkkkkkkk', 'kIkIkIkIkIkIkIkk', 'kIkIkIkIkIkIkIkk', 'kkkkkkkkkkkkkkkk', 'kIkIkIkIkIkIkIkk', 'kIkIkIkIkIkIkIkk', 'kSkSkSkSkSkSkSkk', '.k.k.k.k.k.k.k..'],
    'pipe': ['................', '................', '................', '....kkkkkkk.....', '....kIIIIIk.....', '...kkkkkkkkk....', '....kIiIiIk.....', '....kIoOoIk.....', '....kIiIiIk.....', '....kIiIiIk.....', '...kkkkkkkkk....', '....kIiIiIk.....', '....kIoOoIk.....', '....kIiIiIk.....', '...kkkkkkkkk....', '..kddddddddk....'],
    'lava_tank': ['................', '................', '................', '................', '................', '...kkkkkkkkkk...', '..kIIIIIIIIIIk..', '..kIoOOyOOoOIk..', '..kIOyYYYyOOIk..', '..kIoOOyOOoOIk..', '..kIIIIIIIIIIk..', '..kIoOOyOOoOIk..', '..kIOyYYYyOOIk..', '..kIIIIIIIIIIk..', '..kkkkkkkkkkkk..', '..kdk......kdk..'],
    'book_pile': ['................', '................', '................', '................', '................', '................', '................', '................', '.......y........', '......yOy.......', '.....oOYo.......', '...kkkkkkkk.....', '..keEeEeEeEk....', '..kkkkkkkkkk....', '.kWWWWWWWWWWk...', '.kkkkkkkkkkkk...'],
    # the forest and the mountain (2026-11-02, the 52-area blueprint): logs, stumps, rocks, roots, a wagon, a tent, the shrine's altar, a siege engine, a barricade
    'log': ['................', '................', '................', '................', '................', '................', '................', '................', '................', '................', '.kkkkkkkkkkkkk..', 'kbBBbBBbBBbBkWk.', 'kBbBBbBBbBBbkWBk', 'kbBBbBBbBBbBkWk.', '.kkkkkkkkkkkkk..', '...k.......k....'],
    'stump': ['................', '................', '................', '................', '................', '................', '................', '................', '................', '................', '................', '.....kkkkk......', '....kWBWBk......', '....kBbBbk......', '...kbBbBbBk.....', '..kbk.kb.kbk....'],
    'rock': ['................', '................', '................', '................', '................', '................', '................', '................', '................', '.....kkkkk......', '...kkmlllmkk....', '..kmllwlllmmk...', '..kmmllllmmdk...', '..kdmmmmmmddk...', '...kkdddddkk....', '.....kkkkk......'],
    'roots': ['................', '................', '................', '................', '................', '................', '................', '................', '................', '..bb..........b.', '...bB......bBb..', '....bBb..bBb....', '......bBBb......', '....bBb..bBbb...', '..bBb.......bBb.', '.bb...........b.'],
    'wagon': ['................', '................', '................', '................', '................', '..kkkkkkkkkkk...', '..kWWBWWBWWBk...', '..kBBBBBBBBBk...', '.kkkkkkkkkkkkk..', '.kbBbBbBbBbBbk..', '.kkkkkkkkkkkkk..', '..kk.......kk...', '.kIk.......kIk..', 'kISIk.....kISIk.', '.kIk.......kIk..', '..k.........k...'],
    'tent': ['................', '................', '................', '................', '................', '................', '................', '.......k........', '......kEk.......', '.....kEeEk......', '....kEeeeEk.....', '...kEeekeeEk....', '..kEeekkkeeEk...', '.kEeekkkkkeeEk..', 'kEeeekkkkkeeeEk.', 'kkkkkkkkkkkkkkk.'],
    'shrine_altar': ['................', '................', '................', '................', '................', '................', '................', '................', '................', '..kkkkkkkkkkk...', '..kllwlllwllk...', '..kmmmmVmmmmk...', '..kdmmVPVmmdk...', '..kdmmmVmmmdk...', '..kdddddddddk...', '..kkkkkkkkkkk...'],
    'siege_engine': ['................', '................', '..........kk....', '.........kWk....', '........kWk.....', '.......kWk......', '......kWk.......', '..kk.kWk..kk....', '..kWkWk...kWk...', '..kBWBkkkkkBk...', '.kkkkkkkkkkkkk..', '.kBBbBBbBBbBBk..', '.kkkkkkkkkkkkk..', '.kIk.......kIk..', 'kISIk.....kISIk.', '.kIk.......kIk..'],
    'barricade': ['................', '................', '................', '................', '................', '................', '................', '................', '.k...k...k...k..', 'kWk.kWk.kWk.kWk.', 'kBk.kBk.kBk.kBk.', 'kkkkkkkkkkkkkkkk', 'kbBbBbBbBbBbBbBk', 'kkkkkkkkkkkkkkkk', 'kBk.kBk.kBk.kBk.', 'kbk.kbk.kbk.kbk.'],
    # the keep's two mechanisms (2026-11-02; src/castle.js castleMechs): the Chain Winch, a drum on its posts, its chain
    # hanging; the Solar Valves, a gold wheel on a pipe over a vent of the stolen light. Still and turned here; turning below
    'winch': ['................', '.kkk........kkk.', '.kIk..kkkk..kIk.', '.kIk.kBWWBk.kIk.', '.kIkkBbWWbBkkIk.', '.kIkkWWSSWWkkIk.', '.kIkkWWSSWWkkIk.', '.kIkkBbWWbBkkIk.', '.kIk.kBWWBk.kIk.', '.kIk..kkkk..kIk.', '.kIk...SI...kIk.', '.kIk...IS...kIk.', '.kIk...SI...kIk.', '.kIk...IS...kIk.', 'kddddddddddddddk', '.kkkkkkkkkkkkkk.'],
    'winch_done': ['................', '.kkk........kkk.', '.kIk..kkkk..kIk.', '.kIk.kBWWBk.kIk.', '.kIkkBbWWbBkkIk.', '.kIkkWWGGWWkkIk.', '.kIkkWWGGWWkkIk.', '.kIkkBbWWbBkkIk.', '.kIk.kBWWBk.kIk.', '.kIk..kkkk..kIk.', '.kIk..SISI..kIk.', '.kIk...GG...kIk.', '.kIk........kIk.', '.kIk........kIk.', 'kddddddddddddddk', '.kkkkkkkkkkkkkk.'],
    'valve': ['................', '.....kkkkkk.....', '....kGggggGk....', '...kGk.kk.kGk...', '...kgkkGGkkgk...', '...kgkGyyGkgk...', '...kgkkGGkkgk...', '...kGk.kk.kGk...', '....kGggggGk....', '.....kkkkkk.....', '......kIIk......', '......kIIk......', '....kkkIIkkk....', '...koodddddok...', 'kddddddddddddddk', '.kkkkkkkkkkkkkk.'],
    'valve_done': ['................', '.....kkkkkk.....', '....kGggggGk....', '...kGk.kk.kGk...', '...kgkkGGkkgk...', '...kgkGYYGkgk...', '...kgkkGGkkgk...', '...kGk.kk.kGk...', '....kGggggGk....', '.....kkkkkk.....', '......kIIk......', '......kIIk......', '....kkkIIkkk....', '...kYYYYYYYYk...', 'kddddddddddddddk', '.kkkkkkkkkkkkkk.'],
    # a defender of the castle, fallen: helm, mail, a red surcoat, his sword beside him
    'fallen_soldier': ['................', '................', '................', '................', '................', '................',
                       '................', '................', '..........kkk...', '.........kSSIk..', '..kkkkkkkIIIIk..', '.kIIrrrrIIkIk...',
                       '.kdIrrrrIIIk....', '..kkkkkkkkk.....', 'kSSSSSSSSSWk....', '.kkkkkkkkkkk....'],
    # a statue of the old kings, broken at the knees; its pieces about it
    'shattered_statue': ['................', '................', '................', '................', '................', '................',
                         '................', '....kkk..kkk....', '...kmlk..klmk...', '...kmlk..kmlk...', '...kmlkkkkmlk...', '..kmmlllllllmk..',
                         '..kddmmmmmmmdk..', '.kkkkkkkkkkkkkk.', 'kml.kmk...kml.k.', 'kkk.kkk...kkkk..'],
    'statue_head': ['................', '................', '................', '................', '................', '.....kkkkkk.....',
                    '....kgGGGGgk....', '...kgkkkkkkgk...', '..kmlllllllmk...', '..kmkkmlkkmmk...', '..kmlwmlwlmmk...', '..kmllmmlllmk...',
                    '..kmmkkkkmmdk...', '...kdmmmmddk.k..', '..kkkkkkkkkk.kk.', '................'],
    # a catapult, its arm snapped, its wheel off
    'broken_catapult': ['................', '................', '................', '.k..............', 'kWk.............', '.kWk............',
                        '..kWk...........', '...kWk..........', '....kWkk........', '.kkkkBBBkkkkk...', 'kBBBBBBBBBBBBk..', 'kbkkkkkkkkkbbk..',
                        'kbk.......kbk...', '.k...kkk...k....', '....kIdIk.......', '.....kkk........'],
    'rubble': ['................', '................', '................', '................', '................', '................',
               '................', '................', '......kkk.......', '.....kmlmk......', '..kkkmmlmmkkk...', '.kmlkdmmdkmlmk..',
               '.kmmlkkkkmmmdk..', 'kdmmmdkmlkddmmk.', 'kkkkkkkkkkkkkkk.', '................'],
    # a column fallen in sections
    'collapsed_pillar': ['................', '................', '................', '................', '................', '................',
                         '................', '................', '................', '.kkkkk..kkkkkk..', 'klwllmk.kwlllmk.', 'kmlllmmkkmlllmmk',
                         'kdmmmddkkdmmmddk', '.kkkkkk..kkkkkk.', '................', '................'],
    # a banner of the castle, torn, on its pole: violet, the stolen sun in gold
    'banner_torn': ['......kk........', '.....kIIkkkkkk..', '.....kIkVVVVVk..', '.....kIkVPPPVk..', '.....kIkVgGgVk..', '.....kIkVGYGVk..',
                    '.....kIkVgGgVk..', '.....kIkVPVPVk..', '.....kIkVVkVVk..', '.....kIkVk.kVk..', '.....kIk.k..k...', '.....kIk........',
                    '.....kIk........', '.....kIk........', '....kdIdk.......', '....kkkkk.......'],
    'bones': ['................', '................', '................', '................', '................', '................',
              '................', '................', '................', '......kkk.......', '..kk.keEEk..kk..', '.kEEkkeEek.kEEk.',
              '..kEEEEkkkEEk...', '..kkekkEEkkk....', '...k..kkk.......', '................'],
    # an iron post, a length of broken chain hanging from it
    'chain_post': ['....kkkk........', '....kIIk........', '....kSIkkk......', '....kIIkIIk.....', '....kIIk.kIk....', '....kIIk.kIIk...',
                   '....kIIk..kIk...', '....kIIk..kIIk..', '....kIIk...kIk..', '....kIIk...kIk..', '....kIIk..kIIk..', '....kIIk..kIk...',
                   '....kIIk...k....', '...kdIIdk.......', '...kkkkkk.......', '................'],
    # a scene of the old kings on stone: the sun and a crowned figure, faded
    'mural': ['................', 'kkkkkkkkkkkkkkkk', 'kddddddddddddddk', 'kdmmmmmmmmmmmmdk', 'kdmmgmmmmmmkmmdk', 'kdmgGgmmmmkGkmdk',
              'kdmmgmmmmmkVkmdk', 'kdmmmmmmmkVVVkdk', 'kdmmmlmmmmkVkmdk', 'kdmlllllmmkmkmdk', 'kdmmmmmmmmmmmmdk', 'kddddddddddddddk',
              'kkkkkkkkkkkkkkkk', '................', '................', '................'],
    # a statue of the sun-god, whole, gold-crowned (the Sanctum's)
    'sun_statue': ['......kkkk......', '.....kgGGgk.....', '....kgkYYkgk....', '.....kmllmk.....', '.....kmwlmk.....', '....kmmllmmk....',
                   '...kmkmllmkmk...', '...kmkmllmkmk...', '....kkmllmkk....', '.....kmllmk.....', '.....kmllmk.....', '.....kmkkmk.....',
                   '.....kmkkmk.....', '....kddddddk....', '...kmmmmmmmmk...', '...kkkkkkkkkk...'],
    'shield_broken': ['................', '................', '................', '................', '................', '................',
                      '................', '................', '................', '...kkkk.........', '..kVgVVk........', '..kVGVVk..kkkkkk',
                      '..kVgVk..kSSSSWk', '...kVk....kkkkk.', '....k...........', '................'],
}
# the animated ones (two or four frames)
ANIM = {
    'orb': [['................', '................', '................', '................', '................', '................', '................', '................', '................', '.....kkkkk......', '....kCXXCCk.....', '...kCXPXCCck....', 'GGGkCPXCCcckGGG.', '...kCCCCccck....', '....kCCccck.....', '.....kkkkk......'],
        ['................', '................', '................', '................', '................', '................', '................', '................', '................', '.....kkkkk...GG.', '....kCXXCCkGG...', '...kCXPXCCGk....', '...kCPXCGGck....', '...kCCGGccck....', '..GGkCCccck.....', 'GG...kkkkk......']],
    'gear': [['................', '................', '......kkkk......', '...kk.kIIk.kk...', '..kIIkkIIkkIIk..', '..kIIIIIIIIIIk..', '...kIIkkkkIIk...', '.kkkIk.kk.kIkkk.', '.kIIIk.kSk.kIIIk', '.kIIIk.kSk.kIIIk', '.kkkIk.kk.kIkkk.', '...kIIkkkkIIk...', '..kIIIIIIIIIIk..', '..kIIkkIIkkIIk..', '...kk.kIIk.kk...', '......kkkk......'],
        ['................', '................', '..kk........kk..', '..kIk.kkkk.kIk..', '...kIkIIIIkIk...', '...kIIIIIIIIk...', '..kIIkkkkkkIIk..', '.kIIk.kkkk.kIIk.', '.kIIk.kSSk.kIIk.', '.kIIk.kSSk.kIIk.', '.kIIk.kkkk.kIIk.', '..kIIkkkkkkIIk..', '...kIIIIIIIIk...', '...kIkIIIIkIk...', '..kIk.kkkk.kIk..', '..kk........kk..']],
    'pyre': [['................', '................', '................', '................', '................', '.......y........', '......yOy.......', '.....yOYOy......', '....yOYYYOy.....', '...oOYYYYYOo....', '...oOOYYYOOo....', '..ooOOOOOOOoo...', '..kWBWBWBWBWk...', '.kBWBkBWBkBWBk..', 'kWBWBWBWBWBWBWk.', 'kkkkkkkkkkkkkkk.'],
        ['................', '................', '................', '................', '................', '......y.........', '.....yOy..y.....', '....yOYOyyOy....', '....oOYYYOOy....', '...oOYYYYYYOo...', '...oOOYYYYOOo...', '..ooOOOOOOOoo...', '..kWBWBWBWBWk...', '.kBWBkBWBkBWBk..', 'kWBWBWBWBWBWBWk.', 'kkkkkkkkkkkkkkk.']],
    'winch_turn': [['................', '.kkk........kkk.', '.kIk..kkkk..kIk.', '.kIk.kBWWBk.kIk.', '.kIkkBbWWbBkkIk.', '.kIkkWWSSWWkkIk.', '.kIkkWWSSWWkkIk.', '.kIkkBbWWbBkkIk.', '.kIk.kBWWBk.kIk.', '.kIk..kkkk..kIk.', '.kIk...SI...kIk.', '.kIk...IS...kIk.', '.kIk...SI...kIk.', '.kIk...IS...kIk.', 'kddddddddddddddk', '.kkkkkkkkkkkkkk.'],
        ['................', '.kkk........kkk.', '.kIk..kkkk..kIk.', '.kIk.kWBBWk.kIk.', '.kIkkWWbbWWkkIk.', '.kIkkBbSSbBkkIk.', '.kIkkBbSSbBkkIk.', '.kIkkWWbbWWkkIk.', '.kIk.kWBBWk.kIk.', '.kIk..kkkk..kIk.', '.kIk...IS...kIk.', '.kIk...SI...kIk.', '.kIk...IS...kIk.', '.kIk...SI...kIk.', 'kddddddddddddddk', '.kkkkkkkkkkkkkk.']],
    'valve_turn': [['................', '.....kkkkkk.....', '....kGggggGk....', '...kGk.kk.kGk...', '...kgkkGGkkgk...', '...kgkGYYGkgk...', '...kgkkGGkkgk...', '...kGk.kk.kGk...', '....kGggggGk....', '.....kkkkkk.....', '......kIIk......', '......kIIk......', '....kkkIIkkk....', '...kOOyYYyOOk...', 'kddddddddddddddk', '.kkkkkkkkkkkkkk.'],
        ['................', '.....kkkkkk.....', '....kGggggGk....', '...kGkk..kkGk...', '...kgkkGGkkgk...', '...kg.GyyG.gk...', '...kgkkGGkkgk...', '...kGkk..kkGk...', '....kGggggGk....', '.....kkkkkk.....', '......kIIk......', '......kIIk......', '....kkkIIkkk....', '...kOyYYYYyOk...', 'kddddddddddddddk', '.kkkkkkkkkkkkkk.']],
    'lava_crack': [['................'] * 10 + ['.....kk.........', '..kkkoOkkk..kk..', '.kooOyYOookkook.', '..kkkoOkkkokk...', '.....kk...k.....', '................'],
                   ['................'] * 10 + ['.....kk.........', '..kkkOyokk..kk..', '.kOOyYYyOOkkOOk.', '..kkkOykkkOkk...', '.....kk...k.....', '................']],
    'burning_debris': [['................'] * 6 + ['.....y..........', '....yOy...o.....', '....oOo..oyo....', '...kbObk.kOk....', '..kbBbBbkbBbk...', '.kBbkkbBBbkbBk..',
                                                   'kbBWBkkbBbkkbBk.', '.kkkkkkkkkkkkkk.', '................', '................'],
                       ['................'] * 6 + ['......y.........', '....oyO...y.....', '...yOOo...Oy....', '...kbybk.kOk....', '..kbBbBbkbBbk...', '.kBbkkbBBbkbBk..',
                                                   'kbBWBkkbBbkkbBk.', '.kkkkkkkkkkkkkk.', '................', '................']],
    # a forge press: its hammer up, then down
    'forge_press': [['.kkkkkkkkkkkkkk.', '.kIIIIIIIIIIIIk.', '.kiiiikkkkiiiik.', '....kIkIIkIk....', '....kIkIIkIk....', '....kIkIIkIk....',
                     '...kkkkkkkkkk...', '...kIIIIIIIIk...', '...kiiiiiiiik...', '...kkkkkkkkkk...', '................', '................',
                     '..kkkkkkkkkkkk..', '.kdooOOOOOOoodk.', '.kddddddddddddk.', '.kkkkkkkkkkkkkk.'],
                    ['.kkkkkkkkkkkkkk.', '.kIIIIIIIIIIIIk.', '.kiiiikkkkiiiik.', '....kIkIIkIk....', '....kIkIIkIk....', '....kIkIIkIk....',
                     '....kIkIIkIk....', '....kIkIIkIk....', '....kIkIIkIk....', '...kkkkkkkkkk...', '...kIIIIIIIIk...', '..ykiiiiiiiiky..',
                     '..kkkkkkkkkkkk..', '.kdyOYYYYYYOydk.', '.kddddddddddddk.', '.kkkkkkkkkkkkkk.']],
    # an obelisk of the eclipse: black stone, a violet eye that opens and closes
    'eclipse_obelisk': [['......kkkk......', '.....kcCCck.....', '.....kcccck.....', '.....kcCXck.....', '.....kcXCck.....', '.....kcccck.....',
                         '.....kcccck.....', '.....kcCcck.....', '.....kcccck.....', '.....kcccck.....', '.....kcccck.....', '.....kcccck.....',
                         '....kccccccck...', '...kdddddddddk..', '...kkkkkkkkkkk..', '................'],
                        ['......kkkk......', '.....kcXXck.....', '.....kcCCck.....', '.....kcXXck.....', '.....kcXXck.....', '.....kcCCck.....',
                         '.....kcccck.....', '.....kcXcck.....', '.....kcccck.....', '.....kcCcck.....', '.....kcccck.....', '.....kcccck.....',
                         '....kccccccck...', '...kdddddddddk..', '...kkkkkkkkkkk..', '................']],
}


def grid(rows):
    g = [[(0, 0, 0, 0)] * 16 for _ in range(16)]
    for y, row in enumerate(rows):
        assert len(row) == 16, row
        for x, c in enumerate(row):
            if c != '.': g[y][x] = (*PAL[c], 255)
    return g


if __name__ == '__main__':
    cells = [(k, [grid(v)]) for k, v in SPR.items()] + [(k, [grid(f) for f in v]) for k, v in ANIM.items()]
    n = sum(len(f) for _, f in cells); cols = 8; rows = (n + cols - 1) // cols
    px = [[(0, 0, 0, 0)] * (16 * cols) for _ in range(16 * rows)]; sprites = {}; i = 0
    for k, fr in cells:
        frames = {}
        for j, g in enumerate(fr):
            ox, oy = (i % cols) * 16, (i // cols) * 16; i += 1
            for y in range(16):
                for x in range(16): px[oy + y][ox + x] = g[y][x]
            frames[f'f{j}'] = [ox, oy, 16, 16]
        sprites[k] = {'frames': frames, 'anims': {'idle': {'frames': list(frames), 'fps': 4 if len(frames) > 1 else 1, 'loop': True}}, 'meta': {}}
    write_png(os.path.join(out, 'castle_decor.png'), px)
    json.dump({'rf': True, 'meta': {'name': "Sunthief's Castle's ruin", 'version': 1}, 'sheets': {'castle_decor': {'image': 'castle_decor.png', 'kind': 'decor', 'sprites': sprites}}},
              open(os.path.join(out, 'atlas_castle_decor.json'), 'w', encoding='utf8', newline='\n'), indent=1)
    ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
    if 'throne/atlas_castle_decor.json' not in idx['atlases']:
        idx['atlases'].append('throne/atlas_castle_decor.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
    print('castle decor:', len(cells), 'pieces,', n, 'frames')
