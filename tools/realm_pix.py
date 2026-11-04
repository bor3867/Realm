# The realm's enemies in the user's sprites (2026-11-03, art/source/castle3/sheet_realm_a/b.png, matched in
# docs/realm_sprite_map.md), hand-animated as the castle's were: each a text file art/source/realm/pix/<id>.txt, its base
# cut from the sheet (tools/sheet_crops.py enemies), its walk and attack frames drawn below it pixel by pixel (the
# format: tools/castle_pix.py). Nothing turned, stretched or slid apart.
#   py -I tools/realm_pix.py dump <id> ...     the base frame from art/source/realm/native/<id>.png
#   py -I tools/realm_pix.py build [preview]   art/bundle/realmfoes/realm_user.png + atlas_realm_user.json ('realm_user/<id>')
import json, os, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
sys.path.insert(0, here)
import castle_pix as C  # noqa: E402
C.SRC = os.path.join(root, 'art', 'source', 'realm'); C.PIX = os.path.join(C.SRC, 'pix'); C.OUT = os.path.join(root, 'art', 'bundle', 'realmfoes')
C.SHEET, C.TITLE = 'realm_user', "The realm's monsters, the user's art, hand-animated"
C.IDS = ['shore_crab', 'rf_coral_crab', 'driftwood_bandit', 'tide_herald', 'siren', 'conch_hermit', 'reef_golem', 'trap_hound']   # (by land as each is drawn)

if __name__ == '__main__':
    if sys.argv[1] == 'dump': [C.dump(i) for i in sys.argv[2:]]
    elif sys.argv[1] == 'build':
        C.build(sys.argv[2] if len(sys.argv) > 2 else None)
        ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
        if 'realmfoes/atlas_realm_user.json' not in idx['atlases']:
            idx['atlases'].append('realmfoes/atlas_realm_user.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
