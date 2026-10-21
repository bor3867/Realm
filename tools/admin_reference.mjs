// Writes ADMIN_REFERENCE.md: a quick reference for the admin commands and the ids they take, from the game data.
//   node tools/admin_reference.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { ENCHANTS } from '../src/data/items.js';
import { REALM_BOSSES, DUNGEON_BOSSES, DUNGEONS, DUNGEON_RATING } from '../src/data/enemies.js';
import { CLASSES } from '../src/data/classes.js';
import { PET_KINDS, RARITY_ORDER, FAMILIES } from '../src/data/pets.js';
import { BX } from '../src/bosses/index.js';
import { RATING } from '../src/rf/balance.js';
import { addRfBosses } from '../src/bosses/rf_translate.js';
const RF = JSON.parse(readFileSync(new URL('../art/rf/data.json', import.meta.url), 'utf8'));
const ours = Object.keys(BX).filter((k) => k !== 'framework_test');   // (before the translated ones join the list)
addRfBosses(RF);
const code = (s) => '`' + s + '`', list = (a) => a.map(code).join(', ');

const L = [];
const row = (...c) => L.push(`| ${c.join(' | ')} |`);
const table = (head) => { row(...head); row(...head.map(() => '---')); };

L.push('# Realm admin reference', '');
L.push('Type commands in chat (`/` or Enter). Ids use underscores. Regenerate with `node tools/admin_reference.mjs`.', '');

L.push('## Commands', '');
table(['Command', 'What it does']);
for (const [c, d] of [
  ['/help', 'List the commands in chat'],
  ['/teleport NAME', 'Teleport to another player in the same place (anyone; every 10 s). Clicking their name or minimap dot does it too'],
  ['/admin', 'Equip the admin kit (old gear goes to your backpack)'],
  ['/god', 'Toggle god mode'],
  ['/mortal', 'God mode off and the admin kit to your backpack (to be hurt again)'],
  ['/heal', 'Refill Life and Mana'],
  ['/maxlevel', 'Level 20'],
  ['/level N', 'Level up to N'],
  ['/maxstats', 'Every stat to your class maximum'],
  ['/backpack', 'Add the second backpack'],
  ['/give ITEM [N]', 'Give N of an item (id or name; enchanted ids work, see below)'],
  ['/give dungeon ID', 'Give a dungeon boss\'s whole loot set'],
  ['/items TEXT', 'Search item ids and names'],
  ['/keys [DUNGEON] [N]', 'A key for every dungeon, or N for one'],
  ['/adminchest [N]', 'Up to 5 admin chests (top-tier loot); online, every player here gets their own'],
  ['/chickens [N]', 'Up to 20 XP chickens (2000 XP each); online, for every player here (shared ones in the realm)'],
  ['/gold N', 'Add gold (default 1000)'],
  ['/essence N', 'Add essence'],
  ['/fame N', 'Add account fame (default 100)'],
  ['/pet [LINE] [RARITY] [max]', 'Add a pet (max: every ability capped)'],
  ['/tp WHERE', 'Teleport: a land, `realm`, `nexus`, a dungeon id, or X Y'],
  ['/portal DUNGEON', 'Open a dungeon portal beside you'],
  ['/seals', 'Break every seal on a boss gate'],
  ['/spawn ID [N]', 'Spawn any monster, elite or boss near you'],
  ['/boss ID', 'Spawn an overworld boss (realm), or go to a dungeon boss'],
  ['/bx ID', 'Spawn a three-phase boss beside you (`/bx` alone lists them)'],
  ['/bosses', 'List every boss id'],
  ['/kraken', 'Raise the Abyssal Kraken on the shore (realm)'],
  ['/treant', 'Wake the Thornheart Treant in the Thornwood (realm)'],
  ['/star', 'The Fallen Star lands in Godfall (realm)'],
  ['/melon', 'A Giant Watermelon beside you (realm)'],
  ['/event LAND', 'Start a herald event (shore, fen, runeholt, godfall)'],
  ['/progress LAND N', 'Set herald progress toward that land\'s boss'],
  ['/killall [R]', 'Kill every monster within R tiles (15), immune bosses too'],
  ['/kill [NAME]', 'Kill the nearest monster (or the nearest by that name), immune or not'],
  ['/clear', 'Remove every monster in this place (no loot); the training dummies stay'],
  ['/clearbags', 'Remove all loot bags'],
  ['/quest [KIND]', 'Take a quest: hunt, shrine, camp, herald, fetch, dungeon, rboss'],
  ['/duck', 'Spawn the Golden Duck'],
  ['/dance', 'Dance'],
]) row(code(c), d);
L.push('');

L.push('## Places', '');
L.push('- Lands: `shore`, `dunes`, `lowlands`, `fen`, `thornwood`, `runeholt`, `steppe`, `godfall`');
L.push('- Classes: ' + list(Object.keys(CLASSES)), '');

L.push('## Dungeons', '');
const dg = [];
for (const [id, D] of Object.entries(DUNGEONS)) {
  const B = BX[D.boss] || DUNGEON_BOSSES[D.boss];
  dg.push([(DUNGEON_RATING[id] || [3])[0], id, D.name, B ? B.name : D.boss === 'unstruck' ? 'The Unstruck' : '']);
}
for (const d of RF.dungeons) { const B = RF.bosses.find((b) => b.id === d.boss); dg.push([RATING[d.id] || 3, 'rf_' + d.id, d.name, B ? B.name : '']); }
dg.sort((a, b) => a[0] - b[0] || a[1].localeCompare(b[1]));
table(['Stars', 'Id', 'Name', 'Boss']);
for (const [s, id, n, b] of dg) row('★'.repeat(s), code(id), n, b);
L.push('');

L.push('## Boss ids', '');
L.push('- Overworld (`/boss`, `/spawn`): ' + list(Object.keys(REALM_BOSSES)));
L.push('- Three-phase (`/bx`, `/spawn`): ' + list(ours));
// the 24 translated onto the three-phase engine: `/bx rfx_<id>`, with the specials each one brings (to know what to test)
const SPEC = (B) => [...new Set(B.phases.flatMap((ph) => Object.keys(ph).filter((k) => !['name', 'hp', 'mv', 'text', 'notes', 'em', 'len', 'invuln_note', 'crackMax', 'shoot'].includes(k))))];
L.push('', '### Realmforge bosses on the three-phase engine (`/bx rfx_ID`)', '');
table(['Id', 'Boss', 'Phases', 'Specials']);
for (const B of RF.bosses) row(code('rfx_' + B.id), B.name, B.phases.length, SPEC(B).join(', ') || '-');
L.push('- Dungeon (`/spawn`, or `/boss` to go to it): ' + list(Object.keys(DUNGEON_BOSSES)) + ', `unstruck`', '');

L.push('## Pets', '');
L.push('- Lines: ' + list(Object.keys(PET_KINDS)));
L.push('- Rarities: ' + list(RARITY_ORDER));
L.push('- Eggs: `egg_FAMILY_RARITY`, families ' + list(Object.keys(FAMILIES)), '');

L.push('## Item ids', '');
L.push('- Find any id with `/items TEXT`. Keys: `key_DUNGEON` (the dungeons without `rf_`).');
L.push('- Tiers: `TYPE_tN`, weapons and armour T0-T15, abilities T0-T7, rings `ring_STAT_tN` T0-T7 (e.g. `/give sword_t15`, `/give ring_att_t7`).');
L.push('- Who drops the top (weapons/armour, abilities, rings): everyday and chests to T11/T4/T3; hard realm foes T12/T5/T4; dungeon bosses T13/T6/T5; the hardest (5-star dungeons, Colossus, Orrery) T14-15/T7/T7. The forge upgrades to T11/T4/T3.');
L.push('- Enchanted: `ID~CODE` or `ID~CODE.CODE`, CODE = key + grade 1-3, e.g. `/give wand_t9~keen3.burning2`');
L.push('- Enchant keys: ' + list(Object.keys(ENCHANTS)), '');

writeFileSync(new URL('../ADMIN_REFERENCE.md', import.meta.url), L.join('\n'));
console.log('wrote ADMIN_REFERENCE.md:', L.length, 'lines');
