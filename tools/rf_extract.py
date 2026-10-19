# Realmforge import, step 1: pull the built data out of the user's Realmforge Armory page into the repo.
# Reads realmforge-project/realmforge/realmforge-armory.html (the user's own project, built by its rb.sh), takes its
# DATA object (dungeons, bosses, uniques, tiered ladders, shots, effects, fx, explore creatures/props/tiles) and writes
# art/rf/data.json. The testing pieces are left out (explore.player: the temporary player sprite test).
#   py -I tools/rf_extract.py [path to realmforge-armory.html]
import json, os, re, sys
here = os.path.dirname(os.path.abspath(__file__))
root = os.path.dirname(here)
src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'realmforge-project', 'realmforge', 'realmforge-armory.html')
s = open(src, encoding='utf8').read()
m = re.search(r'const DATA\s*=', s)
if not m: sys.exit('no DATA object in ' + src)
k = s.find('=', m.start()) + 1
while s[k] in ' \n\t': k += 1
data, end = json.JSONDecoder().raw_decode(s, k)
data.get('explore', {}).pop('player', None)              # the temp player sprite test: not part of the game
out = os.path.join(root, 'art', 'rf')
os.makedirs(out, exist_ok=True)
with open(os.path.join(out, 'data.json'), 'w', encoding='utf8', newline='\n') as f:
    json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
X = data.get('explore', {})
print(f"dungeons {len(data['dungeons'])} | bosses {len(data['bosses'])} | uniques {len(data['uniques'])} | "
      f"ladders {', '.join(k + ': ' + str(len(v['rows'])) + ' tiers' for k, v in data['ladders'].items())} | "
      f"effects {len(data['effects'])} | fx {len(data['fx'])} | explore dungeons {len(X.get('dungeons', {}))} -> art/rf/data.json")
