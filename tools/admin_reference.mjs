// Writes ADMIN_REFERENCE.md: every admin command, item id and enemy id, straight from the game data.
//   node tools/admin_reference.mjs
import { writeFileSync } from 'node:fs';
import { ITEMS, ENCHANTS, itemLabel } from '../src/data/items.js';
import { ENEMIES, REALM_BOSSES, DUNGEON_BOSSES, DUNGEONS, BOSS } from '../src/data/enemies.js';
import { CLASSES } from '../src/data/classes.js';
import { PET_KINDS, RARITY, RARITY_ORDER, FUSE_GOLD } from '../src/data/pets.js';

const L = [];
const row = (...c) => L.push(`| ${c.join(' | ')} |`);
const table = (head) => { row(...head); row(...head.map(() => '---')); };

L.push('# Realm admin reference', '');
L.push('Generated from the game data by `node tools/admin_reference.mjs` (rerun it after adding content).');
L.push('Type commands into chat (press `/` or Enter). Ids are case-sensitive and use underscores.', '');

L.push('## Commands', '');
table(['Command', 'What it does']);
for (const [c, d] of [
  ['/help', 'Lists the commands in chat'],
  ['/admin', 'Equips the overpowered admin kit (your old gear goes to your backpack/ground)'],
  ['/god', 'Toggles god mode (no damage)'],
  ['/heal', 'Refills Life and Mana'],
  ['/maxlevel', 'Jumps to level 20 (stats roll up as normal)'],
  ['/level N', 'Levels up to N'],
  ['/maxstats', 'Sets every stat to your class maximum'],
  ['/backpack', 'Adds the second backpack (16 slots)'],
  ['/give ITEM [N]', 'Gives N of an item (ids below; enchanted ids work too, see Enchantments)'],
  ['/items TEXT', 'Searches item ids and names'],
  ['/spawn ENEMY [N]', 'Spawns N of an enemy near you (also works with realm boss ids)'],
  ['/boss ID', 'Spawns a realm boss here (realm only); drowned_abbot / fallen_heart / unstruck teleport you to their dungeon boss'],
  ['/bosses', 'Lists boss ids'],
  ['/event BIOME', 'Starts a herald event in a biome (realm only; the four original lands)'],
  ['/star', 'A star falls in Godfall: the Fallen Star climbs out of the crater (realm only)'],
  ['/seals', 'Breaks every seal on a dungeon boss gate'],
  ['/keys [DUNGEON] [N]', 'Gives you a key for every dungeon (or N keys for one). Use a key in the Nexus or Realm to open the portal to that dungeon'],
  ['/adminchest [N]', 'Conjures up to 5 admin chests near you (realm or dungeon). Break one for top-tier gear, three relics, a likely mythic and a chance at the crown'],
  ['/pet [KIND] [RARITY] [max]', 'Adds a pet (max = every ability at its cap; good for testing fusing). Kinds and rarities are listed under Pets'],
  ['/progress BIOME N', 'Sets herald progress toward that biome\'s realm boss'],
  ['/tp WHERE', 'Teleports: any land (shore, fen, runeholt, godfall, dunes, thornwood, steppe), realm, nexus, or a dungeon id'],
  ['/portal DUNGEON', 'Opens a dungeon portal next to you'],
  ['/killall', 'Kills every enemy within 15 tiles'],
  ['/clearbags', 'Removes all loot bags on the map'],
  ['/gold N', 'Adds N gold (default 1000)'],
  ['/essence N', 'Adds N essence'],
  ['/fame N', 'Adds N account fame (default 100)'],
  ['/quest [KIND]', 'Takes a quest: hunt, shrine, camp, herald, fetch, dungeon, rboss'],
  ['/duck', 'Spawns the Golden Duck'],
  ['/dance', 'Dance (nearby monsters stop to watch)'],
]) row('`' + c + '`', d);
L.push('');

L.push('## Places', '');
L.push('- Lands (`/tp`): `shore`, `fen`, `runeholt`, `godfall`, `dunes`, `thornwood`, `steppe` (`/event`, `/progress`: the first four)');
L.push('- Dungeons (`/tp`, `/portal`): ' + Object.keys(DUNGEONS).map((k) => '`' + k + '`').join(', '));
L.push('- Classes: ' + Object.entries(CLASSES).map(([k, c]) => `${c.name} (\`${k}\`)`).join(', '), '');

// ---- the dungeons: how each one opens, what bites you on the way, and what its boss guards
const GUIDE = {
  chapel: ['low', 'none', 'the rising tide (bubble walls)'],
  forge: ['low', 'none', 'falling slag; conveyor belts carry you'],
  crypt: ['mid', 'none', 'the drowning dark; restless sarcophagi wake as you pass'],
  hive: ['low', 'none', 'honey floors halve your speed'],
  theatre: ['mid', 'carry the three lost masks (Comedy, Tragedy, Silence) to the stand before the stage', 'spotlights: caught in one, every puppet in the room fires faster'],
  scriptorium: ['mid-high', 'a warden, a hidden lever and the rune puzzle', 'falling icicles'],
  spire: ['high', 'three mirror chambers: turn the mirrors (F) to bend the beam onto each crystal', 'lens sentries fire along their sight-line'],
  ember: ['high', 'two wardens, the pressure plates and a lever', 'falling cinders; ember vents erupt'],
  heart: ['high', 'three wardens', 'a heartbeat of falling gold'],
  dream: ['endgame', 'survive three nightmare trials (the bridges vanish until you do)', 'bridges fade (fall through: -15% life)'],
  throne: ['endgame', 'two wardens', 'falling gold; sentinel statues fire across the royal road'],
};
const BOSS_NOTE = {
  honey_queen: 'Hex-stings, a jittering bee swarm, a figure-eight waggle dance, honey rain that leaves sticky puddles, brood cells that hatch unless broken.',
  the_puppeteer: 'Immune while strung to four hanging marionettes (cut them, then he takes double damage). Curtains close from both wings, scissor-lines snap shut, a mirror-puppet answers your every shot; an intermission hands the stage to his understudies.',
  prism_wyrm: 'Glass (immune) unless a lens pedestal beam is on her: stand on one (it overheats after 5s). Her images block the beam; burn them. Last phase: hold the light over 2s and she overcharges.',
  the_sleeper: 'Stand still and you fall asleep. Dream-shift: its body is immune, strike its nightmare-self. Dream-logic inverts your controls. At 10% it will not wake until you ring the three alarms (F).',
};
L.push('## Dungeons', '');
L.push('Open one with `/portal ID` or a key (`/keys`). `/seals` breaks every seal on a boss gate.', '');
table(['Id', 'Name', 'Tier', 'Boss gate opens by', 'Trap / hazard', 'Key', 'Boss']);
for (const [id, D] of Object.entries(DUNGEONS)) {
  const G = GUIDE[id] || ['?', (D.seals || []).join(', ') || 'none', '-'];
  const B = DUNGEON_BOSSES[D.boss] || BOSS;
  row('`' + id + '`', D.name, G[0], G[1], G[2], ITEMS['key_' + id] ? '`key_' + id + '`' : '-', B.name);
}
L.push('', '### The newer dungeons\' bosses', '');
for (const [id, note] of Object.entries(BOSS_NOTE)) {
  const B = DUNGEON_BOSSES[id], L0 = (B.loot || []).filter((l) => l.id && ITEMS[l.id] && ITEMS[l.id].ut);
  const own = L0.filter((l) => !ITEMS[l.id].mythic).map((l) => `\`${l.id}\` (${Math.round(l.p * 100)}%)`), myth = L0.filter((l) => ITEMS[l.id].mythic);
  const mp = myth.length ? ` Plus a ${(myth[0].p * 100).toFixed(1)}% chance at each mythic (${myth.length}).` : '';
  L.push(`- **${B.name}** (\`${id}\`, ${B.hp.toLocaleString()} life, ${B.phases.length} phases): ${note} Relics: ${own.join(', ') || 'none'}.${mp}`);
}
L.push('');

// ---- pets
L.push('## Pets', '');
L.push('- Kinds (`/pet KIND`): ' + Object.entries(PET_KINDS).map(([k, P]) => `${P.name} (\`${k}\`)`).join(', '));
L.push('- Rarities (`/pet KIND RARITY`): ' + RARITY_ORDER.map((r) => `\`${r}\` (cap ${RARITY[r].max})`).join(', '));
L.push('- Abilities: Heal (Life) and Magic Heal (Mana) for every pet; Shield (a ward) from Rare up. Feed gear at the Petkeeper (gold or fame); a meal splits 100% / 65% / 35% between the main, second and third ability.');
L.push('- Fusing: two pets of the same rarity whose **main** ability is at the cap fuse into one of the next rarity. Pay gold (' + Object.entries(FUSE_GOLD).map(([r, g]) => `${r} ${g}`).join(', ') + ') or fame (' + RARITY_ORDER.filter((r) => RARITY[r].morph).map((r) => `${r} ${RARITY[r].morph}`).join(', ') + '). Pick which pet\'s look to keep; every ability keeps the better level.');
L.push('- Skins: Legendary pets are gilded, Divine pets celestial; Rare and up glitter. The sidebar\'s **Pet** tab shows your companion\'s abilities, levels and next heal.');
L.push('- Eggs: `pet_egg_common`, `pet_egg_uncommon`, `pet_egg_rare`, `pet_egg_legendary` (`/give`).', '');

L.push('## Bosses', '');
table(['Id', 'Name', 'Where', 'Life', 'How to summon']);
for (const [id, B] of Object.entries(REALM_BOSSES)) row('`' + id + '`', B.name, B.biome, B.hp.toLocaleString(), `/boss ${id}` + (id === 'emily_the_yapper' ? ' (or /boss emily)' : ''));
for (const [id, B] of Object.entries(DUNGEON_BOSSES)) {
  const d = Object.entries(DUNGEONS).find(([, D]) => D.boss === id);
  row('`' + id + '`', B.name, d ? `dungeon: ${d[0]}` : 'dungeon', B.hp.toLocaleString(), ['drowned_abbot', 'fallen_heart'].includes(id) ? `/boss ${id}` : `/tp ${d ? d[0] : '?'}`);
}
row('`unstruck`', BOSS.name, 'dungeon: forge', BOSS.hp.toLocaleString(), '/boss unstruck');
L.push('');

L.push('## Enemies', '');
L.push('Use with `/spawn ID [N]`.', '');
const byBiome = {};
for (const [id, E] of Object.entries(ENEMIES)) (byBiome[E.biome || 'other'] = byBiome[E.biome || 'other'] || []).push([id, E]);
for (const [b, list] of Object.entries(byBiome)) {
  L.push(`### ${b}`, '');
  table(['Id', 'Name', 'Life', 'Notes']);
  for (const [id, E] of list.sort((a, c) => a[1].hp - c[1].hp)) {
    const notes = [E.sheet === 'champions' ? 'champion' : '', E.fly ? 'flies' : '', E.dummy ? 'training dummy' : '', E.ai ? `moves: ${E.ai}` : ''].filter(Boolean).join(', ');
    row('`' + id + '`', E.name, E.hp >= 1e8 ? '∞' : E.hp.toLocaleString(), notes);
  }
  L.push('');
}

L.push('## Items', '');
L.push('Use with `/give ID [N]`. Tiered gear ids are `TYPE_tN` (rings are `ring_STAT_tN`).', '');
const all = Object.values(ITEMS);
const section = (title, list) => {
  if (!list.length) return;
  L.push(`### ${title}`, '');
  table(['Id', 'Name', 'Kind']);
  for (const it of list) row('`' + it.id + '`', it.name, itemLabel(it));
  L.push('');
};
section('Mythic (starfall)', all.filter((it) => it.mythic));
section('Untiered relics', all.filter((it) => it.ut && !it.mythic && !it.admin));
section('Admin kit', all.filter((it) => it.admin));
for (const slot of ['weapon', 'ability', 'armor', 'ring']) {
  section(`Tiered ${{ weapon: 'weapons', ability: 'abilities', armor: 'armour', ring: 'rings' }[slot]}`, all.filter((it) => it.slot === slot && !it.ut && !it.mythic && !it.admin).sort((a, b) => (a.type > b.type ? 1 : a.type < b.type ? -1 : a.tier - b.tier)));
}
section('Potions and consumables', all.filter((it) => it.slot === 'consumable'));

L.push('## Enchantments', '');
L.push('Any gear id can carry enchantments: `ID~CODE` or `ID~CODE.CODE`, where CODE is the key below plus a grade 1-3');
L.push('(uniques always use 1). Example: `/give gauntlet_t7~keen3.burning2`, `/give plate_t9~phoenix1`.', '');
table(['Key', 'Name word', 'Fits', 'Effect (grade I)']);
for (const [k, E] of Object.entries(ENCHANTS)) row('`' + k + '`', E.adj, E.slots.join(', '), (E.unique ? '★ ' : '') + E.text(1));
L.push('');

writeFileSync(new URL('../ADMIN_REFERENCE.md', import.meta.url), L.join('\n'));
console.log('wrote ADMIN_REFERENCE.md:', L.length, 'lines,', all.length, 'items,', Object.keys(ENEMIES).length, 'enemies');
