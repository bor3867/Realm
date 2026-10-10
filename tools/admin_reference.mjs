// Writes ADMIN_REFERENCE.md: every admin command, item id and enemy id, straight from the game data.
//   node tools/admin_reference.mjs
import { writeFileSync } from 'node:fs';
import { ITEMS, ENCHANTS, itemLabel } from '../src/data/items.js';
import { ENEMIES, REALM_BOSSES, DUNGEON_BOSSES, DUNGEONS, BOSS, ELITES } from '../src/data/enemies.js';
import { CLASSES } from '../src/data/classes.js';
import { PET_KINDS, RARITY, RARITY_ORDER, FUSE_GOLD, FAMILIES, START_LV, EVOLVE_AT } from '../src/data/pets.js';
import { BX } from '../src/bosses/index.js';
const title = (s) => s.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
const pct = (p) => +(p * 100).toFixed(1) + '%';

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
  ['/boss ID', 'Spawns a realm boss here (realm only); drowned_abbot / fallen_heart / unstruck / the_archivist / the_unstruck_god / tidebound_lich / forgeheart_colossus take you to their dungeon boss'],
  ['/bx ID', 'Spawns a Realm Update three-phase boss beside you, anywhere (ids under Realm Update bosses). `/bx` alone lists them'],
  ['/kraken', 'The Abyssal Kraken rises on the Drowned Shore now (its reef and all), and puts you at the edge. Step in to wake it (realm only)'],
  ['/treant', 'The Thornheart Treant wakes in the Thornwood now (its clearing and ring of elders), and puts you at the edge (realm only)'],
  ['/melon', 'A Giant Watermelon plops down beside you (realm only; one at a time)'],
  ['/bosses', 'Lists boss ids'],
  ['/event BIOME', 'Starts a herald event in a biome (realm only; the four original lands)'],
  ['/star', 'A star falls in Godfall: the Fallen Star climbs out of the crater (realm only)'],
  ['/seals', 'Breaks every seal on a dungeon boss gate'],
  ['/keys [DUNGEON] [N]', 'Gives you a key for every dungeon (or N keys for one). Use a key in the Nexus or Realm to open the portal to that dungeon'],
  ['/adminchest [N]', 'Conjures up to 5 admin chests near you (realm or dungeon). Break one for top-tier gear, three relics, a likely mythic and a chance at the crown'],
  ['/pet [LINE] [RARITY] [max]', 'Adds a pet of a line (max = every ability at its cap, so a Divine max pet is in its divine form). Lines and rarities are listed under Pets'],
  ['/progress BIOME N', 'Sets herald progress toward that biome\'s realm boss'],
  ['/tp WHERE', 'Teleports: any land (shore, fen, runeholt, godfall, dunes, thornwood, steppe, lowlands), realm, nexus, a dungeon id, or X Y'],
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
L.push('- Lands (`/tp`): `shore` (the Drowned Shore), `fen` (Ashfen), `runeholt`, `godfall`, `dunes` (the Saltglass Dunes), `thornwood`, `steppe` (the Crystal Steppe), `lowlands` (the Greenmarch). `/event` and `/progress` take the first four');
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
  sandscour: ['low-mid', 'none', 'quicksand drags you; urns may hold scarabs; sarcophagi open as you pass'],
  mirerot: ['mid', 'none', 'dark; spore pods burst into poison clouds (shoot them from range); bog slows you'],
  frostveil: ['mid', 'none', 'chill builds in frigid water and frost (freeze at 100); braziers thaw you; ice floors slide'],
  keep: ['mid-high', 'none', 'the dark: coffins open and thralls are strong outside candlelight; statues wake'],
  astral: ['high', 'none', 'void (fall through); turning clockwork bridges; rune circles fold you between rooms'],
  hollowmoon: ['high', 'none', 'spin tiles turn your feet; jack crates bite; cannons and strikers; ghouls walk through walls'],
};
const BOSS_NOTE = {
  honey_queen: 'Hex-stings, a jittering bee swarm, a figure-eight waggle dance, honey rain that leaves sticky puddles, brood cells that hatch unless broken.',
  the_puppeteer: 'Trapdoors drop open under the stage (the last always near you) in a ring of ribbons; curtains close from both wings, scissor-lines snap shut, a mirror-puppet answers your every shot; an intermission hands the stage to his understudies.',
  prism_wyrm: 'Glass (immune) unless a lens pedestal beam is on her: stand on one (it overheats after 5s). Her images block the beam; burn them. Last phase: hold the light over 2s and she overcharges.',
  the_sleeper: 'Stand still and you fall asleep. Dream-shift: its body is immune, strike its nightmare-self. Dream-logic inverts your controls. At 10% it will not wake until you ring the three alarms (F).',
};
L.push('## Dungeons', '');
L.push('Open one with `/portal ID` or a key (`/keys`). `/seals` breaks every seal on a boss gate.', '');
table(['Id', 'Name', 'Tier', 'Boss gate opens by', 'Trap / hazard', 'Key', 'Boss']);
for (const [id, D] of Object.entries(DUNGEONS)) {
  const G = GUIDE[id] || ['?', (D.seals || []).join(', ') || 'none', '-'];
  const B = DUNGEON_BOSSES[D.boss] || BX[D.boss] || BOSS;
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
L.push('- Lines (`/pet LINE`): each grows baby → evolved (main ability ' + EVOLVE_AT[1] + ') → divine (main ability ' + EVOLVE_AT[2] + '), and is named for its form.', '');
table(['Line id', 'Family', 'Forms', 'Leans to']);
for (const [k, P] of Object.entries(PET_KINDS)) row('`' + k + '`', FAMILIES[P.family], P.forms.map(title).join(' → '), P.heal > P.magic ? 'Life' : P.magic > P.heal ? 'Mana' : 'both');
L.push('');
L.push('- Rarities (`/pet LINE RARITY`): ' + RARITY_ORDER.map((r) => `\`${r}\` (cap ${RARITY[r].max}, hatches at ${START_LV[r]})`).join(', '));
L.push('- Abilities: Heal (Life) and Magic Heal (Mana) for every pet; Shield (a ward) from Rare up. Feed gear at the Petkeeper (gold or fame); a meal splits 100% / 65% / 35% between the main, second and third ability. Crossing a form plays its evolution.');
L.push('- Fusing: two pets of the same rarity whose **main** ability is at the cap fuse into one of the next rarity. Pay gold (' + Object.entries(FUSE_GOLD).map(([r, g]) => `${r} ${g}`).join(', ') + ') or fame (' + RARITY_ORDER.filter((r) => RARITY[r].morph).map((r) => `${r} ${RARITY[r].morph}`).join(', ') + '). Pick which line to keep; every ability keeps the better level.');
L.push('- Rare and up glitter; the name shows the rarity colour. The sidebar\'s **Pet** tab shows your companion\'s abilities, levels and next heal.');
L.push('- Eggs (`/give egg_FAMILY_RARITY`, e.g. `egg_avian_rare`): families ' + Object.keys(FAMILIES).map((f) => '`' + f + '`').join(', ') + '; rarities ' + RARITY_ORDER.map((r) => '`' + r + '`').join(', ') + '. Use one to hatch it at your feet. Divine eggs drop only from the Unstruck God. (The old `pet_egg_RARITY` eggs still work and turn into family eggs when a save loads.)', '');

const PH = {
  abyssal_kraken: ["Surfaced", "Enraged", "Leviathan", "realm event, the Drowned Shore", "/kraken", "Ink that blots your view; hooked arms that bend as they fly; a drifting whirlpool that drags you; lures joined by chain lightning."],
  thornheart_treant: ["Ancient", "Autumn", "Withered", "realm event, the Thornwood", "/treant", "Seeds that mark the ground and burst; burning leaves that sway down; acorn bombs; thorn walls closing from both sides; wisps from the trees."],
  gilded_sphinx: ["Guardian", "Ascendant", "Sandstorm Pharaoh", "dungeon: sandscour", "/tp sandscour", "Crossing crescent fans; riddle glyphs that hang then dart; pinwheel sunbursts; feather fans that narrow to a spear; the sandstorm; dust devils that throw you; scarabs."],
  mother_mycelia: ["Bloom", "Rot", "Sporestorm", "dungeon: mirerot", "/tp mirerot", "Spore clouds that hang; poison needles; acid pools; a lunge and bite; seeds that sprout minions unless shot; orbs that curl outward."],
  glacius_frozen_wyrm: ["Coiled Hoard", "Unfurled", "Shattered Heart", "dungeon: frostveil", "/tp frostveil", "A sweeping breath; lances that freeze the ground; drifting orbs; a gust that slides you; a glide that leaves a fence of lances; spiral-gap rings; braziers it puts out."],
  count_vesper: ["Nobleman", "Batstorm", "Blood Beast", "dungeon: keep", "/tp keep", "Healing thralls that burn in candlelight; a hedge of thorns; weaving bat fans; scythes that wheel back; an afterimage dash; blood rain that pools."],
  grand_orrery: ["Aligned", "Eclipse", "Collapse", "dungeon: astral", "/tp astral", "Orbiting rings that fly off on tangents; a conjunction that freezes every shot then fires them at you; a moving umbra; a gravity well; debris on marked spots."],
  grinning_ringmaster: ["Showman", "Puppeteer", "Big Top", "dungeon: hollowmoon", "/tp hollowmoon", "Drum leaps that ring out bursts; two jester marionettes he re-strings; arcing pins; needle lines; the tent with lantern-eye weak points; confetti bombs."],
  tidebound_lich: ["Drowned King", "Soulbinder", "Tidewraith", "dungeon: crypt", "/tp crypt", "Bolts that bend with the current; coral that splinters; souls that chase you then fly home; a turning soul cage; the tide from every wall; plus his swap, the dark and the grave call."],
  forgeheart_colossus: ["Forge Sentinel", "Overheat", "Molten Core", "dungeon: ember", "/tp ember", "Half-ring slams; ricocheting rivets; skipping slag; vent columns; rolling magma that leaves lava; quake rings; a core that throws shots back."],
};
L.push('## Realm Update bosses (three phases)', '');
L.push('Every one has three phases (it changes at 66% and 33%, immune while it does) and mechanics no other boss shares; each phase also has its own pressure layer firing under its main attacks. The hardest three (Glacius, the Grand Orrery, the Forgeheart Colossus) end with a finale you can only dodge. Spawn any of them beside you with `/bx ID`.', '');
table(['Id', 'Name', 'Where', 'Life', 'Phases', 'Finale', 'Fight it', 'Legendary (phase-3 kill)']);
for (const [id, B] of Object.entries(BX)) {
  if (!PH[id]) continue;
  const leg = (B.loot || []).find((l) => l.id && ITEMS[l.id] && ITEMS[l.id].legendary);
  row('`' + id + '`', B.name, PH[id][3], B.hp.toLocaleString(), PH[id].slice(0, 3).join(' → '), B.finale ? `**${B.finale.name}** at ${Math.round(B.finale.at * 100)}%: survive ${B.finale.dur}s, then it's broken (+50% damage taken)` : '-', '`' + PH[id][4] + '`', leg ? `\`${leg.id}\` (${pct(leg.p)})` : '-');
}
L.push('');
for (const [id, B] of Object.entries(BX)) {
  if (!PH[id]) continue;
  const own = (B.loot || []).filter((l) => l.id && ITEMS[l.id] && ITEMS[l.id].ut && !ITEMS[l.id].legendary).map((l) => `\`${l.id}\` (${pct(l.p)})`);
  L.push(`- **${B.name}**: ${PH[id][5]} Relics: ${own.join(', ') || 'none'}.`);
}
L.push('');

L.push('## Realm events', '');
L.push('- **The Abyssal Kraken** (`/kraken`): rises from a reef on the Drowned Shore; asleep until you step into its pool.');
L.push('- **The Thornheart Treant** (`/treant`): wakes in a clearing ringed by elder trees in the Thornwood.');
L.push('- **The Giant Watermelon** (`/melon`, `giant_watermelon`): a rare harmless event; break it for melon gear and slices (they heal over time).');
L.push('- **The Fallen Star** (`/star`): a star falls in Godfall and the Fallen Star climbs out of the crater.');
L.push('- **Herald events** (`/event BIOME`, `/progress BIOME N`): enough of them in a land summons its realm boss.', '');

L.push('## Elites', '');
L.push('One per 18 monster groups in each land, with an escort, a gold nameplate and one ability on a cooldown (the clip is the telegraph). Better loot and a raised egg chance. Spawn one with `/spawn ID`.', '');
table(['Id', 'Name', 'Land', 'Life', 'Ability']);
const ABIL = { bulwark: 'Coral Bulwark: invulnerable 4s', song: 'Siren Song: you move at 60% inside her ring', totem: 'Spirit Totem: heals goblins', roar: 'Thorn Roar: two rings of 24 thorns',
  banner: 'War Banner: nearby orcs faster and tougher', brood: 'Brood: three spiderlings', dive: 'Thunder Dive: a line, then it dives through you', burrow: 'Burrow: a mound chases you, then erupts',
  blink: 'Blink: re-forms 4-6 tiles from you', dash: 'Shadow Dash: lunges 6 tiles' };
for (const id of [...new Set(Object.values(ELITES).flat())]) { const D = ENEMIES[id]; row('`' + id + '`', D.title || D.name, Object.keys(ELITES).filter((b) => ELITES[b].includes(id)).join(', '), D.hp.toLocaleString(), ABIL[D.ability.kind] || D.ability.kind); }
L.push('');

L.push('## Legendaries', '');
L.push('Ten items, each dropped only by its boss\'s phase-3 kill. Pale-gold slot, tag **L**; their bag gets a broad gold beam and "A LEGENDARY drops!". (Stats: docs/design/06_items.md.)', '');
table(['Id', 'Name', 'Kind', 'From']);
for (const it of Object.values(ITEMS).filter((q) => q.legendary)) {
  const src = Object.entries(BX).find(([, B]) => (B.loot || []).some((l) => l.id === it.id));
  const l = src && src[1].loot.find((q) => q.id === it.id);
  row('`' + it.id + '`', it.name, itemLabel(it), src ? `${src[1].name} (${pct(l.p)})` : '-');
}
L.push('');

L.push('## Bosses', '');
table(['Id', 'Name', 'Where', 'Life', 'How to summon']);
for (const [id, B] of Object.entries(REALM_BOSSES)) row('`' + id + '`', B.name, B.biome, B.hp.toLocaleString(), `/boss ${id}` + (id === 'emily_the_yapper' ? ' (or /boss emily)' : ''));
for (const [id, B] of Object.entries(DUNGEON_BOSSES)) {
  const d = Object.entries(DUNGEONS).find(([, D]) => D.boss === id);
  row('`' + id + '`', B.name, d ? `dungeon: ${d[0]}` : 'dungeon', B.hp.toLocaleString(), ['drowned_abbot', 'fallen_heart'].includes(id) ? `/boss ${id}` : `/tp ${d ? d[0] : '?'}`);
}
row('`unstruck`', BOSS.name, 'dungeon: forge', BOSS.hp.toLocaleString(), '/boss unstruck');
L.push('', 'The Crypt\'s Lich and the Emberforge\'s Colossus now fight on the three-phase framework (see Realm Update bosses); their old entries above are kept for reference.');
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
section('Untiered relics', all.filter((it) => it.ut && !it.mythic && !it.admin && !it.legendary));
section('Admin kit', all.filter((it) => it.admin));
for (const slot of ['weapon', 'ability', 'armor', 'ring']) {
  section(`Tiered ${{ weapon: 'weapons', ability: 'abilities', armor: 'armour', ring: 'rings' }[slot]}`, all.filter((it) => it.slot === slot && !it.ut && !it.mythic && !it.admin).sort((a, b) => (a.type > b.type ? 1 : a.type < b.type ? -1 : a.tier - b.tier)));
}
section('Potions and consumables', all.filter((it) => it.slot === 'consumable' && !(it.use && it.use.family)));
L.push('### Pet eggs', '', 'Ids are `egg_FAMILY_RARITY`: ' + Object.keys(FAMILIES).map((f) => '`' + f + '`').join(', ') + ' × ' + RARITY_ORDER.map((r) => '`' + r + '`').join(', ') + ' (50 eggs).', '');

L.push('## Enchantments', '');
L.push('Any gear id can carry enchantments: `ID~CODE` or `ID~CODE.CODE`, where CODE is the key below plus a grade 1-3');
L.push('(uniques always use 1). Example: `/give gauntlet_t7~keen3.burning2`, `/give plate_t9~phoenix1`.', '');
table(['Key', 'Name word', 'Fits', 'Effect (grade I)']);
for (const [k, E] of Object.entries(ENCHANTS)) row('`' + k + '`', E.adj, E.slots.join(', '), (E.unique ? '★ ' : '') + E.text(1));
L.push('');

writeFileSync(new URL('../ADMIN_REFERENCE.md', import.meta.url), L.join('\n'));
console.log('wrote ADMIN_REFERENCE.md:', L.length, 'lines,', all.length, 'items,', Object.keys(ENEMIES).length, 'enemies');
