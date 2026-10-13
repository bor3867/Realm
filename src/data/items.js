// Item database: tiered gear is generated from formulas; untiered (UT) relics are hand-written.
import { R } from '../util.js';
import { STATS, STAT_NAMES, CLASSES } from './classes.js';
import { applyDungeonItems, orbitLine } from './dungeon_items.js';
import { applyWeaponRework, mechLine } from './weapon_rework.js';
import { applyAbilityRework, HALO_TEXT, sigilLine, MYTHIC_TEXT } from './ability_rework.js';

const METAL = ['Rust', 'Iron', 'Bronze', 'Steel', 'Verdigris', 'Cobalt', 'Crimson', 'Violet', 'Sunforged', 'Obsidian', 'Rune-White', 'Bloodgold'];
const NAMES = {
  gauntlet: ['Soot Mitt', 'Iron Knuckle', 'Bronze Grip', 'Steel Fist', 'Verdigris Maul-Hand', 'Cobalt Crusher', 'Bloodforge Gauntlet', 'Voidbrass Fist', 'Sunforged Knuckle', 'Ashen Furnace-Fist', 'Rune-White Smite'],
  tongs: ['Rusted Tongs', 'Iron Tongs', 'Bronze Pincers', 'Steel Grippers', 'Verdigris Clamps', 'Cobalt Billet-Tongs', 'Crimson Quench-Tongs', 'Violet Pyre-Tongs', 'Sunsmith Tongs', 'Obsidian Ember-Tongs', 'Rune-White Oath-Tongs'],
  sunrod: ['Ash Rod', 'Iron Censer-Rod', 'Bronze Dawnrod', 'Steel Vigil', 'Verdigris Psalter', 'Cobalt Litany', 'Crimson Sermon', 'Violet Vesper', 'Gold Noonrod', 'Obsidian Eclipse', 'Rune-White Zenith'],
  runeward: ['Chalk Rune', 'Iron Rune-Ward', 'Bronze Rune-Ward', 'Steel Rune-Ward', 'Verdigris Aegis-Rune', 'Cobalt Aegis-Rune'],
  hex: ['Scrawled Hex', 'Iron-Bound Grimoire', 'Bronze-Clasped Grimoire', 'Steel-Clasped Grimoire', 'Verdigris Codex', 'Cobalt Codex'],
  bellows: ['Patched Bellows', 'Iron Bellows', 'Bronze Bellows', 'Steel Bellows', 'Verdigris Lung', 'Cobalt Gale-Bellows'],
  seal: ['Rust Seal', 'Iron Oath-Seal', 'Bronze Oath-Seal', 'Steel Oath-Seal', 'Verdigris Covenant', 'Cobalt Covenant'],
  halo: ['Tin Halo', 'Iron Halo', 'Bronze Halo', 'Steel Halo', 'Verdigris Corona', 'Cobalt Corona'],
  plate: ['Rust Plate', 'Iron Plate', 'Bronze Plate', 'Steel Plate', 'Verdigris Cuirass', 'Cobalt Cuirass', 'Crimson Forgeplate', 'Violet Forgeplate', 'Sunforged Plate', 'Obsidian Plate', 'Rune-White Plate', 'Bloodgold Bulwark'],
  coat: ['Soot Coat', 'Iron-Ring Coat', 'Bronze-Studded Coat', 'Steel-Ring Coat', 'Verdigris Hauberk', 'Cobalt Hauberk', 'Crimson Furcoat', 'Violet Furcoat', 'Gold-Collared Coat', 'Obsidian Coat', 'Rune-White Coat', 'Bloodgold Mantle'],
  lantern: ['Tallow Lantern', 'Iron Soul-Lantern', 'Bronze Soul-Lantern', 'Steel Gibbet-Lamp', 'Verdigris Gibbet-Lamp', 'Cobalt Wisp-Cage', 'Crimson Wisp-Cage', 'Violet Mourning-Lamp', 'Gilded Mourning-Lamp', 'Obsidian Ossuary-Lamp', 'Rune-White Requiem'],
  reliquary: ['Pine Reliquary', 'Iron Reliquary', 'Bronze Reliquary', 'Steel Ossuary', 'Verdigris Ossuary', 'Cobalt Catacomb'],
  shroud: ['Burlap Shroud', 'Linen Shroud', 'Bronze-Pinned Shroud', 'Silver-Pinned Shroud', 'Verdigris Pall', 'Cobalt Pall', 'Crimson Pall', 'Violet Winding-Sheet', 'Gold Winding-Sheet', 'Eclipse Shroud', 'Requiem Shroud', 'Bloodgold Pall'],
  harpoon: ['Driftwood Harpoon', 'Iron Harpoon', 'Bronze Harpoon', 'Steel Harpoon', 'Verdigris Lance-Hook', 'Cobalt Lance-Hook', 'Crimson Whale-Lance', 'Violet Whale-Lance', 'Sunforged Leviathan-Spear', 'Obsidian Leviathan-Spear', 'Rune-White Kraken-Bane'],
  hookline: ['Hemp Line', 'Iron Grapple', 'Bronze Grapple', 'Steel Grapple', 'Verdigris Kraken-Line', 'Cobalt Kraken-Line'],
  oilskin: ['Tarred Oilskin', 'Iron-Buckled Oilskin', 'Bronze-Buckled Oilskin', 'Steel-Buckled Oilskin', 'Verdigris Slicker', 'Cobalt Slicker', 'Crimson Diving-Coat', 'Violet Diving-Coat', 'Gold-Rivet Diving-Coat', 'Obsidian Diving-Coat', 'Rune-White Leviathan-Hide', 'Bloodgold Leviathan-Hide'],
  rapier: ['Rusted Foil', 'Iron Rapier', 'Bronze Rapier', 'Steel Rapier', 'Verdigris Estoc', 'Cobalt Estoc', 'Crimson Sabre-Glass', 'Violet Sabre-Glass', 'Sunforged Needle', 'Obsidian Needle', 'Rune-White Reflection'],
  mirror: ['Tin Mirror', 'Iron Mirror', 'Bronze Mirror', 'Silver Mirror', 'Verdigris Looking-Glass', 'Cobalt Looking-Glass'],
  glassmail: ['Tin Glassmail', 'Iron Glassmail', 'Bronze Glassmail', 'Steel Glassmail', 'Verdigris Mirrorplate', 'Cobalt Mirrorplate', 'Crimson Mirrorplate', 'Violet Prism-Mail', 'Gold Prism-Mail', 'Obsidian Prism-Mail', 'Rune-White Silvering', 'Bloodgold Silvering'],
  coil: ['Copper Wire', 'Iron Coil', 'Bronze Coil', 'Steel Coil', 'Verdigris Tesla-Coil', 'Cobalt Tesla-Coil', 'Crimson Arc-Coil', 'Violet Arc-Coil', 'Sunforged Thunder-Coil', 'Obsidian Thunder-Coil', 'Rune-White Heaven-Coil'],
  kite: ['Paper Kite', 'Silk Kite', 'Bronze-Ribbed Kite', 'Steel-Ribbed Kite', 'Verdigris Storm-Kite', 'Cobalt Storm-Kite'],
  stormcloak: ['Oiled Cloak', 'Rain Cloak', 'Bronze-Clasped Cloak', 'Silver-Clasped Cloak', 'Verdigris Gale-Cloak', 'Cobalt Gale-Cloak', 'Crimson Thunderhead', 'Violet Thunderhead', 'Gold Thunderhead', 'Eclipse Squall-Robe', 'Zenith Squall-Robe', 'Bloodgold Tempest'],
  pendulum: ['Lead Bob', 'Iron Pendulum', 'Bronze Pendulum', 'Steel Pendulum', 'Verdigris Metronome', 'Cobalt Metronome', 'Crimson Escapement', 'Violet Escapement', 'Gilded Orrery-Bob', 'Obsidian Orrery-Bob', 'Rune-White Hour-Hand'],
  stopwatch: ['Tin Stopwatch', 'Iron Stopwatch', 'Bronze Stopwatch', 'Steel Chronometer', 'Verdigris Chronometer', 'Cobalt Hourglass'],
  brasscoat: ['Tin Brasscoat', 'Iron Brasscoat', 'Bronze Brasscoat', 'Steel Brasscoat', 'Verdigris Gearcoat', 'Cobalt Gearcoat', 'Crimson Gearcoat', 'Violet Clockwork-Mail', 'Gold Clockwork-Mail', 'Obsidian Clockwork-Mail', 'Rune-White Tick-Mail', 'Bloodgold Tick-Mail'],
  vestment: ['Ash Vestment', 'Linen Vestment', 'Bronze-Thread Robe', 'Silver-Thread Robe', 'Verdigris Stole', 'Cobalt Stole', 'Crimson Chasuble', 'Violet Chasuble', 'Gold Chasuble', 'Eclipse Vestment', 'Zenith Vestment', 'Bloodgold Pontifical'],
};
Object.assign(NAMES, {
  // our own names, tier by tier: from scavenged scrap to shards of the god himself
  sword: ['Rusted Shortsword', 'Ironbite Blade', 'Brinecut Saber', 'Bogsteel Broadsword', 'Runeedge Longsword', 'Emberforged Blade', 'Glassfang Sword', 'Saint\'s Gilded Blade', 'Hollowsteel Greatblade', 'Anvilheart Sword', 'Godshard Blade'],
  dagger: ['Chipped Shiv', 'Iron Stiletto', 'Brine Kris', 'Bogfang Dirk', 'Runeneedle', 'Ember Talon', 'Glass Sliver', 'Gilded Misericorde', 'Hollow Fang', 'Nightvein Dagger', 'Godshard Shiv'],
  bow: ['Driftwood Bow', 'Ironbark Bow', 'Saltstring Bow', 'Reedwhip Bow', 'Runewood Longbow', 'Emberstring Bow', 'Glassarc Bow', 'Gilded Recurve', 'Hollowhorn Bow', 'Stormdraw Bow', 'Godshard Bow'],
  staff: ['Ashwood Staff', 'Iron-Shod Staff', 'Kelp-Wound Staff', 'Bog-Lantern Staff', 'Runeheart Staff', 'Emberroot Staff', 'Glass-Eye Staff', 'Gilded Psalm Staff', 'Hollowbone Staff', 'Starwell Staff', 'Godshard Staff'],
  wand: ['Twig Wand', 'Iron Wand', 'Pearl Wand', 'Wisp Wand', 'Runic Wand', 'Ember Wand', 'Prism Wand', 'Gilded Wand', 'Hollow Wand', 'Eclipse Wand', 'Godshard Wand'],
  heavy: ['Rusted Mail', 'Iron Hauberk', 'Barnacle Plate', 'Bogiron Cuirass', 'Runeplate', 'Emberforged Plate', 'Glassguard Armor', 'Gilded Penance Plate', 'Hollow Thane\'s Mail', 'Anvilheart Plate', 'Godshard Bulwark', 'Plate of the Unstruck'],
  leather: ['Ragged Jerkin', 'Tanned Leathers', 'Sealskin Coat', 'Bogtoad Hide', 'Runestitched Leather', 'Embertanned Armor', 'Glasshide Vest', 'Gilded Leathers', 'Hollowhide Armor', 'Stormwyrm Hide', 'Godshard Leathers', 'Skin of the Unstruck'],
  robe: ['Novice\'s Robe', 'Linen Robe', 'Tidewoven Robe', 'Bogmoss Robe', 'Runeweave Robe', 'Ember Robe', 'Prismsilk Robe', 'Gilded Vestments', 'Hollow Shroud', 'Starweave Robe', 'Godshard Raiment', 'Robe of the Unstruck'],
});
export const TYPE_SLOT = {
  sword: 'weapon', dagger: 'weapon', bow: 'weapon', staff: 'weapon', wand: 'weapon', heavy: 'armor', leather: 'armor', robe: 'armor', gauntlet: 'weapon', tongs: 'weapon', sunrod: 'weapon', lantern: 'weapon', harpoon: 'weapon',
  rapier: 'weapon', coil: 'weapon', pendulum: 'weapon', mirror: 'ability', kite: 'ability', stopwatch: 'ability',
  glassmail: 'armor', stormcloak: 'armor', brasscoat: 'armor',
  bellows: 'ability', seal: 'ability', halo: 'ability', reliquary: 'ability', hookline: 'ability', runeward: 'ability', hex: 'ability',
  plate: 'armor', coat: 'armor', vestment: 'armor', shroud: 'armor', oilskin: 'armor', ring: 'ring',
  godweapon: 'weapon', godability: 'ability', godarmor: 'armor', godring: 'ring' };
export const TYPE_CLASS = { gauntlet: 'brawler', bellows: 'brawler', coat: 'brawler', tongs: 'forge_knight', seal: 'forge_knight', plate: 'forge_knight',
  sunrod: 'priest', halo: 'priest', vestment: 'priest', lantern: 'summoner', reliquary: 'summoner', shroud: 'summoner',
  harpoon: 'harpooner', hookline: 'harpooner', oilskin: 'harpooner', rapier: 'duelist', mirror: 'duelist', glassmail: 'duelist',
  coil: 'stormwright', kite: 'stormwright', stormcloak: 'stormwright', pendulum: 'clockmaker', stopwatch: 'clockmaker', brasscoat: 'clockmaker',
  runeward: 'runeblade', hex: 'hexweaver' };
const TYPE_LABEL = { sword: 'Sword', dagger: 'Dagger', bow: 'Bow', staff: 'Staff', wand: 'Wand', heavy: 'Heavy Armor', leather: 'Leather Armor', robe: 'Robe', gauntlet: 'Gauntlet', tongs: 'Tongs', sunrod: 'Sun-Rod', bellows: 'Bellows', seal: 'Oath-Seal', halo: 'Halo', plate: 'Forgeplate',
  coat: 'Soot-Coat', vestment: 'Vestment', ring: 'Ring', lantern: 'Soul-Lantern', reliquary: 'Reliquary', shroud: 'Shroud', harpoon: 'Harpoon',
  hookline: 'Grapple Line', oilskin: 'Oilskin', rapier: 'Rapier', mirror: 'Mirror', glassmail: 'Glassmail', coil: 'Coil', kite: 'Storm Kite',
  stormcloak: 'Stormcloak', pendulum: 'Pendulum', stopwatch: 'Stopwatch', runeward: 'Rune-Ward', hex: 'Grimoire', brasscoat: 'Brasscoat', godweapon: 'Admin Weapon', godability: 'Admin Ability', godarmor: 'Admin Armor', godring: 'Admin Ring' };
export const WEAPON_TYPES = ['sword', 'dagger', 'bow', 'staff', 'wand'];                 // RotMG weapon families, shared between classes
export const ABILITY_TYPES = ['bellows', 'seal', 'halo', 'reliquary', 'hookline', 'mirror', 'kite', 'stopwatch', 'runeward', 'hex'];
export const ARMOR_TYPES = ['heavy', 'leather', 'robe'];
export const LEGACY_TYPE = { gauntlet: 'sword', tongs: 'sword', sunrod: 'wand', pendulum: 'wand', lantern: 'staff', coil: 'staff',
  harpoon: 'bow', rapier: 'dagger', plate: 'heavy', coat: 'heavy', oilskin: 'leather', glassmail: 'leather',
  vestment: 'robe', shroud: 'robe', stormcloak: 'robe', brasscoat: 'robe' };
export const legacyId = (id) => {
  const m = typeof id === 'string' && /^([a-z]+)_t(\d+)(~.*)?$/.exec(id);
  return m && LEGACY_TYPE[m[1]] ? `${LEGACY_TYPE[m[1]]}_t${m[2]}${m[3] || ''}` : id;
};
const RING_BONUS = { hp: 20, mp: 20, att: 1, def: 1, spd: 1, dex: 1, vit: 1, wis: 1 };

const BASE_ITEMS = {};
// enchanted items are ids like 'gauntlet_t5~att2.crit1' (base~enchant+grade, dot-separated); the proxy builds them on demand,
// so saves, bags and trades keep working with plain strings. Object.keys/values still list only the base items.
export const ITEMS = new Proxy(BASE_ITEMS, {
  get(t, k) {
    if (typeof k !== 'string' || k in t) return t[k];
    const L = legacyId(k);
    if (L !== k) return this.get(t, L);
    return k.includes('~') ? enchanted(k) : undefined;
  },
  has(t, k) { return k in t || (typeof k === 'string' && (legacyId(k) in t || (k.includes('~') && !!enchanted(k)))); },
});
const add = (it) => { ITEMS[it.id] = it; return it; };
const r1 = (v) => Math.round(v);

function weapon(type, t) {
  const W = {
    // RotMG families: swords hit hard up close, daggers are fast and short, bows loose three piercing arrows,
    // staves fire two piercing bolts, wands one long quick bolt
    // shot speed by family: swords are heavy, slow arcs; staves and wands fling bolts fast
    sword: { dmg: [48 + 13.5 * t, 76 + 19 * t], range: 2.9, speed: 9, rate: 1.0, size: 0.5 },
    dagger: { dmg: [31 + 9 * t, 50 + 14 * t], range: 3.5, speed: 13, rate: 1.4, size: 0.42 },
    bow: { dmg: [16 + 4.5 * t, 28 + 7.5 * t], count: 3, arc: 0.18, range: 5.6, speed: 17, rate: 1.0, size: 0.45, pierce: true },
    staff: { dmg: [20 + 6 * t, 34 + 9 * t], count: 2, arc: 0.08, range: 6.2, speed: 16, rate: 1.0, size: 0.45 },
    wand: { dmg: [30 + 8.6 * t, 50 + 13.8 * t], range: 8.2, speed: 19, rate: 1.05, size: 0.42 },
    gauntlet: { dmg: [30 + 9 * t, 50 + 13 * t], range: 3.2, speed: 13, rate: 1.15, proj: 'ember', size: 0.45 },
    tongs: { dmg: [26 + 8 * t, 44 + 12 * t], range: 4.4, speed: 11, rate: 0.95, proj: 'spark', size: 0.45, pierce: true },
    sunrod: { dmg: [16 + 5.5 * t, 30 + 9 * t], range: 7, speed: 15, rate: 1.1, proj: 'lance', size: 0.4, pierce: true },
    // soul-wisps drift and seek the nearest enemy
    lantern: { dmg: [20 + 6 * t, 34 + 9.5 * t], range: 6.5, speed: 7.5, rate: 1.05, proj: 'lance', size: 0.45, special: { homing: 3 + t * 0.15 } },
    // one huge, slow, piercing throw
    harpoon: { dmg: [60 + 15 * t, 95 + 22 * t], range: 7.5, speed: 12, rate: 0.62, proj: 'lance', size: 0.5, pierce: true },
    // lightning-fast piercing thrusts at close range
    rapier: { dmg: [18 + 5 * t, 30 + 8 * t], range: 4.2, speed: 17, rate: 1.55, proj: 'lance', size: 0.4, pierce: true },
    // bolts that leap to one more enemy
    coil: { dmg: [24 + 6.5 * t, 38 + 10 * t], range: 6.5, speed: 13, rate: 1.0, proj: 'lance', size: 0.4, special: { chain: { n: 1, f: 0.6 } } },
    // weights that start slow and accelerate: the longer they fly, the harder they hit
    pendulum: { dmg: [44 + 11 * t, 70 + 16 * t], range: 7.5, speed: 3.5, rate: 0.9, proj: 'lance', size: 0.5, special: { accel: 26 } },
  }[type];
  return { count: 1, arc: 0, ...W, proj: `pj_${type}_${t}`, dmg: W.dmg.map(r1) };
}
function ability(type, t) {
  return {
    bellows: { cost: 45 + 5 * t, berserk: 2.5 + 0.4 * t, burst: { count: 10, proj: `pj_gauntlet_${Math.min(10, t * 2)}`, dmg: 60 + 20 * t, range: 3 } },
    seal: { cost: 50 + 4 * t, armored: 2.5 + 0.5 * t, burst: { count: 12, proj: 'spark', dmg: 90 + 28 * t, range: 3.5, pierce: true } },
    halo: { cost: 60 + 6 * t, heal: 100 + 40 * t, invuln: 1 + 0.25 * t, burst: { count: 16, proj: 'lance', dmg: 50 + 18 * t, range: 5, pierce: true } },
    reliquary: { cost: 70 + 6 * t, thralls: 2 + Math.floor((t + 1) / 2), life: 6 + t, summon: t <= 1 ? 'thrall' : t <= 3 ? 'thrall_hound' : 'thrall_knight', burst: { count: 1, proj: 'pj_thrall', dmg: 17 + 6 * t, range: 6 } },
    hookline: { cost: 45 + 5 * t, armored: 1.5 + 0.3 * t, burst: { count: 1, proj: 'hook', dmg: 160 + 50 * t, range: 8 + t * 0.4 } },
    mirror: { cost: 40 + 5 * t, decoy: 2.5 + 0.4 * t, burst: { count: 12, proj: 'pj_glass', dmg: 100 + 30 * t, range: 4 + t * 0.3 } },
    kite: { cost: 60 + 6 * t, life: 6 + t, burst: { count: 1, proj: 'zap', dmg: 32 + 10 * t, range: 4.5 + t * 0.2 } },
    // RUNE WARD: a ward that soaks up damage, and a ring of rune-slashes cut around you
    runeward: { cost: 50 + 5 * t, ward: 120 + 50 * t, burst: { count: 10, proj: 'rune_slash', dmg: 70 + 22 * t, range: 3.5, pierce: true } },
    // HEX: a curse thrown at the cursor; everything inside takes more damage and slows
    hex: { cost: 60 + 6 * t, curse: { t: 4 + 0.5 * t, f: 0.2 + 0.02 * t, r: 2.6 + 0.15 * t }, burst: { count: 8, proj: 'hex_bolt', dmg: 50 + 16 * t, range: 4 } },
    stopwatch: { cost: 80 + 6 * t, stop: 2 + 0.4 * t, burst: { count: 0, proj: 'none', dmg: 0, range: 6 + t * 0.4 } },
  }[type];
}
function armor(type, t) {
  if (type === 'heavy') return { def: r1(6 + 1.6 * t), hp: t >= 5 ? 10 * (t - 4) : 0 };
  if (type === 'leather') return { def: r1(4 + 1.2 * t), dex: Math.floor((t + 1) / 3), spd: Math.floor(t / 4) };
  if (type === 'robe') return { def: r1(2 + 0.85 * t), mp: 12 + 5 * t, wis: Math.floor((t + 1) / 2) };
  if (type === 'plate') return { def: r1(6 + 1.6 * t), hp: t >= 6 ? 10 * (t - 5) : 0 };
  if (type === 'coat') return { def: r1(4 + 1.2 * t), att: Math.floor(t / 3) };
  if (type === 'oilskin') return { def: r1(5 + 1.4 * t), vit: Math.floor(t / 3), hp: t >= 6 ? 8 * (t - 5) : 0 };
  if (type === 'shroud') return { def: r1(2 + 0.8 * t), mp: 12 + 5 * t, wis: Math.floor((t + 1) / 2) };
  if (type === 'glassmail') return { def: r1(4 + 1.1 * t), dex: Math.floor((t + 1) / 3), spd: Math.floor(t / 4) };
  if (type === 'stormcloak') return { def: r1(2 + 0.9 * t), mp: 10 + 5 * t, spd: Math.floor(t / 3), wis: Math.floor(t / 3) };
  if (type === 'brasscoat') return { def: r1(5 + 1.3 * t), att: Math.floor(t / 3), hp: t >= 6 ? 6 * (t - 5) : 0 };
  return { def: r1(2 + 0.9 * t), mp: 10 + 5 * t, wis: Math.floor(t / 2) };
}

for (const type of WEAPON_TYPES) {
  for (let t = 0; t <= 10; t++) add({ id: `${type}_t${t}`, type, slot: 'weapon', tier: t, name: NAMES[type][t], weapon: weapon(type, t) });
}
for (const type of ABILITY_TYPES) {
  for (let t = 0; t <= 5; t++) add({ id: `${type}_t${t}`, type, slot: 'ability', tier: t, name: NAMES[type][t], ability: ability(type, t) });
}
for (const type of ARMOR_TYPES) {
  for (let t = 0; t <= 11; t++) add({ id: `${type}_t${t}`, type, slot: 'armor', tier: t, name: NAMES[type][t], bonus: armor(type, t) });
}
for (const s of STATS) {
  for (let t = 0; t <= 5; t++) {
    add({ id: `ring_${s}_t${t}`, type: 'ring', slot: 'ring', tier: t, name: `${METAL[t]} Band of ${STAT_NAMES[s]}`, bonus: { [s]: RING_BONUS[s] * (t + 1) } });
  }
}
// consumables
export const POTION_ORDER = ['hp', 'mp', 'life', 'mana', 'att', 'def', 'spd', 'dex', 'vit', 'wis'];
add({ id: 'pot_hp', type: 'potion', slot: 'consumable', tier: null, name: 'Draught of Embers', icon: 0, use: { heal: 120 }, desc: 'Restores 120 Life.' });
add({ id: 'pot_mp', type: 'potion', slot: 'consumable', tier: null, name: 'Draught of Tides', icon: 1, use: { mana: 120 }, desc: 'Restores 120 Mana.' });
add({ id: 'watermelon_slice', type: 'potion', slot: 'consumable', tier: null, name: 'Watermelon Slice', icon: 0, reg: 'mx_items/watermelon_slice',
  use: { heal: 40, regen: { hp: 200, t: 5 } }, desc: 'Restores 40 Life at once, then 200 more over 5 seconds. Spit the seeds.' });
const STATPOT = { hp: 'Heartstone Tincture', mp: 'Wellspring Tincture', att: 'Tincture of Wrath', def: 'Tincture of Iron', spd: 'Tincture of Gales', dex: 'Tincture of Hands', vit: 'Tincture of Marrow', wis: 'Tincture of Runes' };
for (const s of STATS) {
  const icon = POTION_ORDER.indexOf(s === 'hp' ? 'life' : s === 'mp' ? 'mana' : s);
  add({ id: `stat_${s}`, type: 'potion', slot: 'consumable', tier: null, name: STATPOT[s], icon, use: { stat: s },
    desc: `Permanently raises ${STAT_NAMES[s]} by ${s === 'hp' || s === 'mp' ? 5 : 1}, up to your class maximum.` });
}

// ---- untiered relics
const UT = [
  { id: 'knuckle_of_the_unstruck', type: 'gauntlet', slot: 'weapon', name: 'Knuckle of the Unstruck',
    weapon: { dmg: [55, 85], count: 3, arc: 0.32, range: 3.6, speed: 13, rate: 1.0, proj: 'pj_unstruck', size: 0.5 },
    desc: 'Torn from the god that was never finished. Three molten knuckles per blow.' },
  { id: 'billet_of_the_first_oath', type: 'tongs', slot: 'weapon', name: 'Billet of the First Oath',
    weapon: { dmg: [140, 190], count: 1, arc: 0, range: 5.5, speed: 10, rate: 0.6, proj: 'pj_firstoath', size: 0.7, pierce: true },
    desc: 'The first billet ever struck on the god-anvil. It has not cooled since.' },
  { id: 'the_last_noon', type: 'halo', slot: 'ability', name: 'The Last Noon',
    ability: { cost: 110, heal: 400, invuln: 3, burst: { count: 24, proj: 'lance', dmg: 180, range: 6, pierce: true } },
    desc: 'What was left of the sun after it died. Holding it is a kind of judgement.' },
  { id: 'censer_of_absolution', type: 'bellows', slot: 'ability', name: 'Censer of Absolution',
    ability: { cost: 80, berserk: 5, heal: 150, burst: { count: 14, proj: 'smoke', dmg: 140, range: 4 } },
    desc: 'The Magistrate\'s censer, worked into a bellows. It breathes out everyone it forgave.' },
  { id: 'pilgrims_pearl', type: 'ring', slot: 'ring', name: 'Pilgrim\'s Pearl', bonus: { hp: 60, wis: 5 },
    desc: 'The light a drowned pilgrim carried in their shell.' },
  { id: 'bell_of_the_taken', type: 'ring', slot: 'ring', name: 'Bell of the Taken', bonus: { def: 10, vit: 5 },
    desc: 'A clapper from an alarm bell nobody answered.' },
  { id: 'rime_headsman_plate', type: 'plate', slot: 'armor', name: 'Rime Headsman\'s Plate', bonus: { def: 18, hp: 40, spd: -4 },
    desc: 'Still cold enough to stop a heart. Usually someone else\'s.' },
  // ---- reliquary: one relic per wave-2 mob
  { id: 'salt_widows_veil', type: 'vestment', slot: 'armor', name: 'Salt Widow\'s Veil', bonus: { def: 12, wis: 8, mp: 60 },
    desc: 'Crusted white. It still smells of the sea she waited by.' },
  { id: 'trap_hound_collar', type: 'ring', slot: 'ring', name: 'Trap-Hound\'s Collar', bonus: { spd: 6, dex: 4 },
    desc: 'Rope, a bell, and something it caught that never got out.' },
  { id: 'hymn_of_the_mire', type: 'bellows', slot: 'ability', name: 'Hymn of the Mire',
    ability: { cost: 70, berserk: 4, burst: { count: 20, proj: 'bile', dmg: 120, range: 5 } },
    desc: 'Three throats\' worth of drowned song, pressed into one bellows.' },
  { id: 'antler_crown', type: 'ring', slot: 'ring', name: 'Antler Crown', bonus: { att: 5, def: 5 },
    desc: 'Cut from the Hush. It makes no sound when you wear it, either.' },
  { id: 'the_turning_verse', type: 'seal', slot: 'ability', name: 'The Turning Verse',
    ability: { cost: 70, armored: 4, burst: { count: 24, proj: 'rune', dmg: 150, range: 4.5, pierce: true } },
    desc: 'One verse from the monk\'s wheel. It has not stopped turning.' },
  { id: 'eaten_halo', type: 'halo', slot: 'ability', name: 'The Eaten Halo',
    ability: { cost: 80, heal: 220, invuln: 2, burst: { count: 18, proj: 'goldshard', dmg: 160, range: 5, pierce: true } },
    desc: 'Pried out of the thing that ate the saint. Still bitten.' },
  // ---- the Honeyed Hollow, the Marionette Theatre, the Prism Lighthouse, the Sleeper's Dream
  { id: 'queens_stinger', type: 'dagger', slot: 'weapon', name: "The Queen's Stinger", bag: 'urn',
    weapon: { dmg: [50, 75], count: 1, arc: 0, range: 5.2, speed: 13, rate: 1.1, proj: 'royal_sting', size: 0.45, special: { slow: { f: 0.25, t: 1.5 } } },
    desc: "Pulled from the Honeyed Mother herself. Everything it pricks moves like it is wading through honey." },
  { id: 'honeyguard_band', type: 'ring', slot: 'ring', name: 'Honeyguard Band', bag: 'urn', bonus: { hp: 60, vit: 4, def: 2 },
    desc: "A ring of amber with a worker bee asleep inside. It hums when you are hurt." },
  { id: 'maestros_baton', type: 'wand', slot: 'weapon', name: "The Maestro's Baton", bag: 'urn',
    weapon: { dmg: [70, 100], count: 1, arc: 0, range: 7.4, speed: 19, rate: 1.05, proj: 'puppet_string', size: 0.4, special: { crit: { p: 0.25, x: 2.5 } } },
    desc: "He conducted his puppets with it. Now it conducts your shots: every few beats, a crescendo." },
  { id: 'the_last_curtain', type: 'robe', slot: 'armor', name: 'The Last Curtain', bag: 'urn', bonus: { def: 14, mp: 60, wis: 4, dex: 3 },
    desc: "The velvet that fell on the final performance. It still smells of applause." },
  { id: 'stringcutter', type: 'dagger', slot: 'weapon', name: 'Stringcutter', bag: 'urn',
    weapon: { dmg: [75, 105], count: 2, arc: 0.15, range: 4.6, speed: 13, rate: 1.0, proj: 'scissor_blade', size: 0.45, pierce: true },
    desc: "The stagehands' shears, ground to a dagger. They cut the Maestro's strings once. They can do it again." },
  { id: 'wyrmglass_wand', type: 'wand', slot: 'weapon', name: 'Wyrmglass Wand', bag: 'urn',
    weapon: { dmg: [105, 150], count: 1, arc: 0, range: 7.6, speed: 19, rate: 1.0, proj: 'white_bolt', size: 0.45, special: { chain: { n: 2, f: 0.6 } } },
    desc: "A sliver of the Prism Wyrm's glass. Its light jumps from one foe to the next, splitting as it goes." },
  { id: 'prismglass_mantle', type: 'robe', slot: 'armor', name: 'Prismglass Mantle', bag: 'urn', bonus: { def: 18, mp: 90, wis: 6, att: 3 },
    desc: "Woven from light caught in the lighthouse lens. In the dark you can see it shine." },
  { id: 'the_seventh_colour', type: 'ring', slot: 'ring', name: 'The Seventh Colour', bag: 'urn', bonus: { att: 5, dex: 5, spd: 3, wis: 3 },
    desc: "There are six colours in a rainbow. Aurelia kept the seventh in this ring." },
  { id: 'lullaby_staff', type: 'staff', slot: 'weapon', name: 'The Lullaby Staff', bag: 'urn',
    weapon: { dmg: [100, 145], count: 2, arc: 0.12, range: 6.6, speed: 12, rate: 1.0, proj: 'zzz', size: 0.45, special: { slow: { f: 0.35, t: 2 } } },
    desc: "It hums the Sleeper's song. Monsters hear it and their feet grow heavy." },
  { id: 'nightlight_ring', type: 'ring', slot: 'ring', name: 'Nightlight Ring', bag: 'urn', bonus: { hp: 100, mp: 60, wis: 5, def: 3 },
    desc: "A little moon that keeps the bad dreams away. Mostly." },
  { id: 'the_waking_bell', type: 'halo', slot: 'ability', name: 'The Waking Bell',
    ability: { cost: 85, heal: 240, invuln: 2.2, burst: { count: 20, proj: 'dreamstar', dmg: 190, range: 5, pierce: true } },
    desc: "One of the alarms that woke the Sleeper. Ring it and nothing can keep you down." },
  // ---- the Sunken Crypt (the Tidebound Lich) and the Emberforge Depths (the Forgeheart Colossus)
  { id: 'tidecaller_blade', reg: 'ix_items/tidecaller_blade', type: 'sword', slot: 'weapon', name: 'Tidecaller Blade', bag: 'urn',
    weapon: { dmg: [160, 220], count: 1, arc: 0, range: 3.2, speed: 13, rate: 1.0, proj: 'tide_wave', size: 0.55, pierce: true, special: { slow: { f: 0.3, t: 2 } } },
    desc: 'The Lich drowned a knight to forge it. Every cut drags like an undertow.' },
  { id: 'emberbrand_greatsword', reg: 'ix_items/emberbrand_greatsword', type: 'sword', slot: 'weapon', name: 'Emberbrand Greatsword', bag: 'urn',
    weapon: { dmg: [210, 290], count: 1, arc: 0, range: 3.0, speed: 12, rate: 0.85, proj: 'fireball', size: 0.6, special: { burn: { dps: 80, t: 3 } } },
    desc: 'Quenched in the Colossus\'s heart. It has not stopped glowing.' },
  { id: 'staff_of_drowned_stars', reg: 'ix_items/staff_of_drowned_stars', type: 'staff', slot: 'weapon', name: 'Staff of Drowned Stars', bag: 'urn',
    weapon: { dmg: [90, 130], count: 2, arc: 0.1, range: 6.6, speed: 11, rate: 1.0, proj: 'wisp_flame', size: 0.45, special: { slow: { f: 0.25, t: 1.5 } } },
    desc: 'Stars fell into the crypt\'s flooded vaults. The Lich fished one out.' },
  { id: 'cinderwood_staff', reg: 'ix_items/cinderwood_staff', type: 'staff', slot: 'weapon', name: 'Cinderwood Staff', bag: 'urn',
    weapon: { dmg: [95, 140], count: 2, arc: 0.1, range: 6.2, speed: 11, rate: 1.0, proj: 'fireball', size: 0.45, special: { burn: { dps: 50, t: 3 } } },
    desc: 'Cut from a tree that grows in the forge-fires. It still smoulders at the tip.' },
  { id: 'runeplate_armor', reg: 'ix_items/runeplate_armor', type: 'leather', slot: 'armor', name: 'Runeplate Brigandine', bag: 'urn', bonus: { def: 20, hp: 60, att: 3, dex: 3 },
    desc: 'Rune-cut plates riveted to supple leather. The runes glow when you are hit.' },
  { id: 'hexsilk_robe', reg: 'ix_items/hexsilk_robe', type: 'robe', slot: 'armor', name: 'Hexsilk Robe', bag: 'urn', bonus: { def: 12, mp: 80, wis: 6, att: 2 },
    desc: 'Woven by the Lich\'s handmaidens from drowned spider-silk.' },
  { id: 'ring_of_tides', reg: 'ix_items/ring_of_tides', type: 'ring', slot: 'ring', name: 'Ring of Tides', bag: 'urn', bonus: { hp: 80, wis: 5, vit: 3 },
    desc: 'A drop of the sea that never dries, held in gold.' },
  { id: 'emberheart_ring', reg: 'ix_items/emberheart_ring', type: 'ring', slot: 'ring', name: 'Emberheart Ring', bag: 'urn', bonus: { att: 6, def: 3 },
    desc: 'A spark from the Colossus\'s core, still burning in an iron band.' },
  { id: 'runic_aegis', reg: 'ix_items/runic_aegis', type: 'runeward', slot: 'ability', name: 'The Runic Aegis', bag: 'urn',
    ability: { cost: 80, ward: 520, burst: { count: 16, proj: 'rune_slash', dmg: 200, range: 4, pierce: true } },
    desc: 'A shield with every rune of warding cut into it. Nothing gets through twice.' },
  { id: 'grimoire_of_ash', reg: 'ix_items/grimoire_of_ash', type: 'hex', slot: 'ability', name: 'The Grimoire of Ash', bag: 'urn',
    ability: { cost: 85, curse: { t: 7, f: 0.35, r: 3.4 }, burst: { count: 12, proj: 'fireball', dmg: 160, range: 4.5 } },
    desc: 'Its pages are ash. The curses written on them burn all the same.' },
  { id: 'soul_lantern', reg: 'ix_items/soul_lantern', type: 'reliquary', slot: 'ability', name: 'The Soul Lantern', bag: 'urn',
    ability: { cost: 90, thralls: 5, life: 11, summon: 'thrall_knight', burst: { count: 1, proj: 'pj_thrall', dmg: 60, range: 6 } },
    desc: 'The Lich kept its servants\' souls in here. They are glad to work for someone else.' },
  { id: 'colossus_core', reg: 'ix_items/colossus_core', type: 'bellows', slot: 'ability', name: 'The Colossus Core', bag: 'urn',
    ability: { cost: 80, berserk: 5, burst: { count: 14, proj: 'fireball', dmg: 220, range: 3.5 } },
    desc: 'The Forgeheart\'s burning core. Breathe through it and the forge breathes with you.' },
  // ---- urn: realm boss uniques
  { id: 'abbots_claw', type: 'gauntlet', slot: 'weapon', name: 'The Abbot\'s Claw', bag: 'urn',
    weapon: { dmg: [70, 105], count: 2, arc: 0.25, range: 3.6, speed: 12, rate: 1.05, proj: 'pj_claw', size: 0.5 },
    desc: 'Snapped off the Brine Cathedral. Pearls rattle inside it like a rosary.' },
  { id: 'pearl_of_the_drowned_mass', type: 'ring', slot: 'ring', name: 'Pearl of the Drowned Mass', bag: 'urn', bonus: { hp: 100, wis: 6, vit: 4 },
    desc: 'The bell\'s clapper, grown over with nacre.' },
  { id: 'wick_of_the_mother', type: 'halo', slot: 'ability', name: 'Wick of the Mother', bag: 'urn',
    ability: { cost: 90, heal: 350, invuln: 1.5, burst: { count: 20, proj: 'corpseflame', dmg: 140, range: 5, pierce: true } },
    desc: 'It lights itself. It does not care what it burns.' },
  { id: 'tallow_vestment', type: 'vestment', slot: 'armor', name: 'Tallow Vestment', bag: 'urn', bonus: { def: 16, mp: 100, wis: 6, vit: 4 },
    desc: 'Wax-stiff and warm. Do not stand too close to a fire.' },
  { id: 'orrery_seal', type: 'seal', slot: 'ability', name: 'Seal of the Astrolabe', bag: 'urn',
    ability: { cost: 85, armored: 5, burst: { count: 30, proj: 'rune', dmg: 170, range: 5, pierce: true } },
    desc: 'A stopped ring of the winter engine. It still predicts the worst.' },
  { id: 'starless_band', type: 'ring', slot: 'ring', name: 'The Starless Band', bag: 'urn', bonus: { dex: 8, spd: 6 },
    desc: 'The orbit of a star that the Astrolabe froze out of the sky.' },
  { id: 'penitents_head', type: 'tongs', slot: 'weapon', name: 'The Penitent\'s Head', bag: 'urn',
    weapon: { dmg: [150, 210], count: 1, arc: 0, range: 6, speed: 10, rate: 0.65, proj: 'pj_head', size: 0.7, pierce: true },
    desc: 'Carry it in the tongs. Its eyes still fire at whatever you look at.' },
  { id: 'gilded_penance', type: 'plate', slot: 'armor', name: 'Gilded Penance', bag: 'urn', bonus: { def: 26, hp: 80, vit: 5 },
    desc: 'Marble plate mended with gold where the god broke.' },
  // ---- herald uniques (urn)
  { id: 'heralds_conch', type: 'bellows', slot: 'ability', name: 'The Herald\'s Conch', bag: 'urn',
    ability: { cost: 75, berserk: 4, burst: { count: 18, proj: 'conchwave', dmg: 130, range: 5 } },
    desc: 'It still calls the tide. The tide still answers.' },
  { id: 'bellringers_rope', type: 'ring', slot: 'ring', name: 'The Bellringer\'s Rope', bag: 'urn', bonus: { hp: 80, def: 6, vit: 6 },
    desc: 'Worn smooth by a thousand peals for the drowned.' },
  { id: 'rime_standard', type: 'plate', slot: 'armor', name: 'Rime Standard Plate', bag: 'urn', bonus: { def: 22, hp: 60, wis: 4 },
    desc: 'The banner froze to the bearer. Now it is armour.' },
  { id: 'penitents_scourge', type: 'gauntlet', slot: 'weapon', name: 'The Penitent\'s Scourge', bag: 'urn',
    weapon: { dmg: [80, 115], count: 2, arc: 0.3, range: 3.8, speed: 13, rate: 1.1, proj: 'pj_scourge', size: 0.5 },
    desc: 'Gold chain wrapped around the knuckles. Every blow is a confession.' },
  // ---- more realm boss uniques (urn)
  { id: 'rose_window_vestment', type: 'vestment', slot: 'armor', name: 'Rose Window Vestment', bag: 'urn', bonus: { def: 15, mp: 80, wis: 8 },
    desc: 'Stitched from the Cathedral\'s stained glass, somehow still soft.' },
  { id: 'tallow_tongs', type: 'tongs', slot: 'weapon', name: 'The Tallow Tongs', bag: 'urn',
    weapon: { dmg: [120, 165], count: 1, arc: 0, range: 5, speed: 10, rate: 0.85, proj: 'pj_tallow', size: 0.55, pierce: true },
    desc: 'They hold a candle that has never once gone out.' },
  { id: 'orrery_rod', type: 'sunrod', slot: 'weapon', name: 'The Astrolabe Rod', bag: 'urn',
    weapon: { dmg: [60, 90], count: 2, arc: 0.15, range: 8, speed: 14, rate: 1.1, proj: 'pj_orrery', size: 0.45, pierce: true },
    desc: 'An axle of the winter engine. It throws two stars at once.' },
  { id: 'kintsugi_band', type: 'ring', slot: 'ring', name: 'The Kintsugi Band', bag: 'urn', bonus: { att: 6, def: 6, hp: 40 },
    desc: 'Broken, and mended with gold. Stronger at the seam.' },
  { id: 'unstruck_anvil', type: 'seal', slot: 'ability', name: 'The Unstruck Anvil', bag: 'urn',
    ability: { cost: 90, armored: 6, burst: { count: 32, proj: 'hammerlet', dmg: 200, range: 5, pierce: true } },
    desc: 'A sliver of the god-anvil. Every hammer in the room turns toward it.' },
  { id: 'furnace_heart_coat', type: 'coat', slot: 'armor', name: 'Furnace-Heart Coat', bag: 'urn', bonus: { def: 24, att: 6, vit: 4 },
    desc: 'Lined with the Unstruck\'s grate. It is always warm.' },
  // ---- The Sunken Chapel (low-tier dungeon)
  { id: 'abbots_crozier', type: 'sunrod', slot: 'weapon', name: 'The Abbot\'s Crozier', bag: 'urn',
    weapon: { dmg: [45, 70], count: 1, arc: 0, range: 8, speed: 13, rate: 1.2, proj: 'pj_crozier', size: 0.5, pierce: true },
    desc: 'It hooks pearls from the flood and throws them back.' },
  { id: 'stained_glass_halo', type: 'halo', slot: 'ability', name: 'Stained-Glass Halo', bag: 'urn',
    ability: { cost: 70, heal: 200, invuln: 1.5, burst: { count: 18, proj: 'beacon', dmg: 110, range: 5, pierce: true } },
    desc: 'A rose window in miniature. Light comes through it in every colour.' },
  { id: 'tidewoven_coat', type: 'coat', slot: 'armor', name: 'Tidewoven Coat', bag: 'urn', bonus: { def: 14, spd: 4, dex: 4 },
    desc: 'Knotted from chapel ropes and kelp. It moves like water.' },
  { id: 'drowned_bell', type: 'ring', slot: 'ring', name: 'The Drowned Bell', bag: 'urn', bonus: { wis: 6, mp: 60 },
    desc: 'It still rings underwater, if you listen.' },
  // ---- The Heart of Godfall (endgame dungeon): the Godheart set
  { id: 'godheart_knuckle', type: 'gauntlet', slot: 'weapon', name: 'Godheart Knuckle', bag: 'urn',
    weapon: { dmg: [120, 170], count: 3, arc: 0.3, range: 3.9, speed: 14, rate: 1.15, proj: 'pj_godfist', size: 0.55 },
    desc: 'Every punch lands with the weight of a heartbeat.' },
  { id: 'godheart_tongs', type: 'tongs', slot: 'weapon', name: 'Godheart Tongs', bag: 'urn',
    weapon: { dmg: [230, 300], count: 1, arc: 0, range: 6, speed: 10, rate: 0.8, proj: 'pj_godbillet', size: 0.8, pierce: true },
    desc: 'They hold a drop of the god\'s blood, still molten.' },
  { id: 'godheart_scepter', type: 'sunrod', slot: 'weapon', name: 'Godheart Scepter', bag: 'urn',
    weapon: { dmg: [95, 140], count: 3, arc: 0.14, range: 8.5, speed: 16, rate: 1.15, proj: 'pj_godlance', size: 0.45, pierce: true },
    desc: 'A rib of the cathedral, topped with the last noon.' },
  { id: 'godforged_plate', type: 'plate', slot: 'armor', name: 'Godforged Plate', bag: 'urn', bonus: { def: 34, hp: 120, vit: 6 },
    desc: 'Cast in the god\'s own ribs.' },
  { id: 'heartstring_vestment', type: 'vestment', slot: 'armor', name: 'Heartstring Vestment', bag: 'urn', bonus: { def: 24, mp: 140, wis: 10 },
    desc: 'Woven from the cords that held the heart in place.' },
  { id: 'heartbreak_coat', type: 'coat', slot: 'armor', name: 'Heartbreak Coat', bag: 'urn', bonus: { def: 30, att: 8, dex: 4 },
    desc: 'Torn from the Fallen Heart\'s cage. It is still trying to beat.' },
  { id: 'crown_of_the_fallen', type: 'ring', slot: 'ring', name: 'Crown of the Fallen', bag: 'urn', bonus: { att: 8, def: 8, hp: 80, mp: 80 },
    desc: 'Small enough to wear on a finger now.' },
  // ---- starfall: mythics. You will probably never see one.
  { id: 'hammer_that_never_fell', type: 'tongs', slot: 'weapon', name: 'The Hammer That Never Fell', bag: 'starfall', mythic: true,
    weapon: { dmg: [190, 260], count: 1, arc: 0, range: 5.5, speed: 10, rate: 0.75, proj: 'pj_hammer', size: 0.8, pierce: true },
    desc: 'Forged for the first blow on the god-anvil. The smiths drowned before they could swing it.' },
  { id: 'starfall_knuckles', type: 'gauntlet', slot: 'weapon', name: 'Starfall Knuckles', bag: 'starfall', mythic: true,
    weapon: { dmg: [95, 140], count: 3, arc: 0.3, range: 3.8, speed: 14, rate: 1.15, proj: 'pj_starfist', size: 0.5 },
    desc: 'Three stars that fell through the realm and landed, somehow, in a fist.' },
  { id: 'sunless_psalter', type: 'sunrod', slot: 'weapon', name: 'The Sunless Psalter', bag: 'starfall', mythic: true,
    weapon: { dmg: [80, 120], count: 2, arc: 0.12, range: 8, speed: 16, rate: 1.15, proj: 'pj_psalter', size: 0.45, pierce: true },
    desc: 'The hymns written for the sun\'s funeral. Read aloud, they still hurt.' },
  { id: 'shard_of_the_first_star', type: 'ring', slot: 'ring', name: 'Shard of the First Star', bag: 'starfall', mythic: true,
    bonus: { hp: 60, mp: 60, att: 4, def: 4, spd: 4, dex: 4, vit: 4, wis: 4 },
    desc: 'Older than the realm. Older than the god that made it.' },
];
// ---- new untiered relics (incl. the Summoner and Harpooner lines)
UT.push(
  // Summoner
  { id: 'lantern_of_the_last_watch', type: 'lantern', slot: 'weapon', name: 'Lantern of the Last Watch', bag: 'urn',
    weapon: { dmg: [70, 100], count: 2, arc: 0.3, range: 7, speed: 8, rate: 1.05, proj: 'pj_lastwatch', size: 0.5, special: { homing: 5, chain: { n: 2, f: 0.6 } } },
    desc: 'The night-watchman\'s lamp. The souls inside still run their rounds, from one throat to the next.' },
  { id: 'choir_of_bones', type: 'reliquary', slot: 'ability', name: 'The Choir of Bones', bag: 'urn',
    ability: { cost: 90, thralls: 4, life: 10, summon: 'thrall_choir', burst: { count: 1, proj: 'pj_thrall', dmg: 110, range: 6 }, mod: 'thrallburst' },
    desc: 'A reliquary of choirboys. When their song ends, they go out with a bang.' },
  { id: 'gravewardens_pall', type: 'shroud', slot: 'armor', name: 'The Gravewarden\'s Pall', bag: 'urn', bonus: { def: 15, mp: 90, wis: 8 },
    passive: { killheal: 20, manaonkill: 8 }, desc: 'Every grave you fill pays you back.' },
  { id: 'the_hollow_psalm', type: 'reliquary', slot: 'ability', name: 'The Hollow Psalm', bag: 'urn',
    ability: { cost: 100, thralls: 5, life: 11, summon: 'thrall_gilded', burst: { count: 3, proj: 'pj_thrall', dmg: 150, range: 6.5 }, mod: 'thrallfan' },
    desc: 'Sung in the Heart of Godfall. The dead who hear it fight in threes.' },
  // Harpooner
  { id: 'leviathan_tine', type: 'harpoon', slot: 'weapon', name: 'The Leviathan Tine', bag: 'urn',
    weapon: { dmg: [190, 260], count: 1, arc: 0, range: 8, speed: 12, rate: 0.65, proj: 'pj_tine', size: 0.6, pierce: true, special: { split: { n: 5, proj: 'pj_tineshard', f: 0.35 }, slow: { f: 0.4, t: 1.5 } } },
    desc: 'Broken off the Cathedral\'s crab. It shatters into brine on impact.' },
  { id: 'drowned_mans_line', type: 'hookline', slot: 'ability', name: 'The Drowned Man\'s Line', bag: 'urn',
    ability: { cost: 80, armored: 3, burst: { count: 1, proj: 'hook', dmg: 420, range: 10 }, mod: 'reel3' },
    desc: 'It hooked a whole congregation once. It still remembers how.' },
  { id: 'whalers_slicker', type: 'oilskin', slot: 'armor', name: 'The Whaler\'s Slicker', bag: 'urn', bonus: { def: 18, hp: 60, spd: 4 },
    passive: { dodge: 0.12, momentum: 0.15 }, desc: 'Tar-black and slippery. Things that grab at it find nothing to hold.' },
  { id: 'kraken_bane', type: 'harpoon', slot: 'weapon', name: 'Kraken-Bane', bag: 'urn',
    weapon: { dmg: [300, 380], count: 1, arc: 0, range: 8, speed: 13, rate: 0.7, proj: 'pj_krakenbane', size: 0.65, pierce: true, special: { boomerang: true, explode: { r: 1.6, f: 0.5 } } },
    desc: 'Thrown, it comes back. Whatever it went through does not.' },
  { id: 'abyssal_line', type: 'hookline', slot: 'ability', name: 'The Abyssal Line', bag: 'urn',
    ability: { cost: 85, armored: 3.5, burst: { count: 1, proj: 'hook', dmg: 520, range: 10 }, mod: 'shockline' },
    desc: 'Forged in the Drowned Forge. Whatever it reels in arrives with a thunderclap.' },
  // more relics for everyone
  { id: 'cinder_saints_fist', type: 'gauntlet', slot: 'weapon', name: 'The Cinder-Saint\'s Fist', bag: 'urn',
    weapon: { dmg: [85, 120], count: 2, arc: 0.28, range: 3.7, speed: 13, rate: 1.1, proj: 'pj_cinderfist', size: 0.5, special: { burn: { dps: 60, t: 3 }, explode: { r: 1, f: 0.35 } } },
    desc: 'Still burning from the saint\'s pyre. It sets alight whatever it touches.' },
  { id: 'quenching_tongs', type: 'tongs', slot: 'weapon', name: 'The Quenching Tongs', bag: 'urn',
    weapon: { dmg: [160, 220], count: 1, arc: 0, range: 5.5, speed: 10, rate: 0.75, proj: 'pj_quench', size: 0.6, pierce: true, special: { slow: { f: 0.5, t: 2 } } },
    desc: 'They hold a billet of ice that never melts. Everything it hits slows to a crawl.' },
  { id: 'dawnbreaker', type: 'sunrod', slot: 'weapon', name: 'Dawnbreaker', bag: 'urn',
    weapon: { dmg: [70, 100], count: 1, arc: 0, range: 8, speed: 15, rate: 1.15, proj: 'pj_dawn', size: 0.45, pierce: true, special: { split: { n: 6, proj: 'pj_dawnray', f: 0.4, onEnd: true } } },
    desc: 'Each lance breaks into a sunrise where it lands.' },
  { id: 'bellwrights_mail', type: 'plate', slot: 'armor', name: 'The Bellwright\'s Mail', bag: 'urn', bonus: { def: 24, hp: 60, vit: 4 },
    passive: { aegis: 6 }, desc: 'Cast like a bell. Every few seconds it rings, and one blow glances off.' },
  { id: 'ring_of_the_undertow', type: 'ring', slot: 'ring', name: 'Ring of the Undertow', bag: 'urn', bonus: { spd: 5, dex: 5 },
    passive: { momentum: 0.15 }, desc: 'It pulls you forward. So do your blows.' },
  { id: 'gravedust_band', type: 'ring', slot: 'ring', name: 'The Gravedust Band', bag: 'urn', bonus: { att: 4, vit: 4 },
    passive: { killburst: 0.5 }, desc: 'The dead you make burst into grave-dust and shrapnel.' },
  // ---- starfall mythics for the new classes
  { id: 'the_unburied_choir', type: 'lantern', slot: 'weapon', name: 'The Unburied Choir', bag: 'starfall', mythic: true,
    weapon: { dmg: [100, 140], count: 3, arc: 0.35, range: 7.5, speed: 8, rate: 1.1, proj: 'pj_choir', size: 0.5, special: { homing: 6, chain: { n: 3, f: 0.6 }, split: { n: 3, proj: 'pj_choirspark', f: 0.3 } } },
    desc: 'A whole cemetery, singing. You do not aim it. It knows where the living are.' },
  { id: 'the_white_whale', type: 'harpoon', slot: 'weapon', name: 'The White Whale', bag: 'starfall', mythic: true,
    weapon: { dmg: [380, 480], count: 1, arc: 0, range: 9, speed: 13, rate: 0.75, proj: 'pj_whitewhale', size: 0.7, pierce: true, special: { quake: { n: 10, proj: 'pj_whaleshard', f: 0.3, stun: 0.6 }, explode: { r: 1.8, f: 0.6 } } },
    desc: 'A harpoon cut from the jaw of the thing that ate the sea. It hits like the tide coming in.' },
);

UT.push(
  // Duelist
  { id: 'the_last_reflection', type: 'rapier', slot: 'weapon', name: 'The Last Reflection', bag: 'urn',
    weapon: { dmg: [70, 100], count: 2, arc: 0.18, range: 4.6, speed: 18, rate: 1.6, proj: 'pj_reflection', size: 0.45, pierce: true, special: { crit: { p: 0.25, x: 2.5 } } },
    desc: 'A blade of mirror-glass that only remembers the killing blow.' },
  { id: 'hall_of_mirrors', type: 'mirror', slot: 'ability', name: 'The Hall of Mirrors', bag: 'urn',
    ability: { cost: 70, decoy: 4, burst: { count: 20, proj: 'pj_glass', dmg: 260, range: 5 }, mod: 'hall' },
    desc: 'Step through it and you leave three of yourself behind.' },
  { id: 'silvered_duelcoat', type: 'glassmail', slot: 'armor', name: 'The Silvered Duelcoat', bag: 'urn', bonus: { def: 20, dex: 8, spd: 4 },
    passive: { dodge: 0.15, crit: { p: 0.1, x: 2 } }, desc: 'Blows slide off its silvering and find nothing to hold.' },
  // Stormwright
  { id: 'heaven_wire', type: 'coil', slot: 'weapon', name: 'The Heaven Wire', bag: 'urn',
    weapon: { dmg: [85, 125], count: 1, arc: 0, range: 7, speed: 14, rate: 1.05, proj: 'pj_heavenwire', size: 0.45, special: { chain: { n: 4, f: 0.7 }, slow: { f: 0.3, t: 1 } } },
    desc: 'Strung between two storms. Whatever touches it touches all of them.' },
  { id: 'the_thunderhead', type: 'kite', slot: 'ability', name: 'The Thunderhead', bag: 'urn',
    ability: { cost: 90, life: 12, burst: { count: 1, proj: 'zap', dmg: 210, range: 6 }, mod: 'twinkite' },
    desc: 'Two kites on one line. The storm between them never ends.' },
  // Clockmaker
  { id: 'the_eleventh_hour', type: 'pendulum', slot: 'weapon', name: 'The Eleventh Hour', bag: 'urn',
    weapon: { dmg: [160, 230], count: 2, arc: 0.3, range: 8, speed: 3, rate: 0.95, proj: 'pj_eleventh', size: 0.55, special: { accel: 30, explode: { r: 1.3, f: 0.5 } } },
    desc: 'Time is running out. When it arrives, it arrives all at once.' },
  { id: 'the_broken_hourglass', type: 'stopwatch', slot: 'ability', name: 'The Broken Hourglass', bag: 'urn',
    ability: { cost: 110, stop: 4, burst: { count: 0, proj: 'none', dmg: 0, range: 8 }, mod: 'rewind' },
    desc: 'The sand falls up. Frozen bullets turn around and go home.' },
  // starfall
  { id: 'the_mirrorworld', type: 'rapier', slot: 'weapon', name: 'The Mirrorworld', bag: 'starfall', mythic: true,
    weapon: { dmg: [110, 150], count: 3, arc: 0.3, range: 5, speed: 19, rate: 1.7, proj: 'pj_mirrorworld', size: 0.45, pierce: true, special: { split: { n: 4, proj: 'pj_glass', f: 0.35 }, crit: { p: 0.3, x: 2.5 } } },
    desc: 'Every thrust happens twice: once here, once on the other side of the glass.' },
  { id: 'the_first_storm', type: 'coil', slot: 'weapon', name: 'The First Storm', bag: 'starfall', mythic: true,
    weapon: { dmg: [140, 190], count: 2, arc: 0.25, range: 7.5, speed: 15, rate: 1.1, proj: 'pj_firststorm', size: 0.5, special: { chain: { n: 6, f: 0.8 }, starfall: { every: 5, dmg: 1400, r: 2 } } },
    desc: 'The storm the god was struck by. It has been looking for him ever since.' },
  { id: 'the_last_second', type: 'pendulum', slot: 'weapon', name: 'The Last Second', bag: 'starfall', mythic: true,
    weapon: { dmg: [260, 340], count: 3, arc: 0.35, range: 9, speed: 2.5, rate: 1.0, proj: 'pj_lastsecond', size: 0.6, special: { accel: 34, quake: { n: 8, proj: 'pj_cog', f: 0.3, stun: 0.5 } } },
    desc: 'The final tick before the end of the world, kept in a brass weight.' },
);

// ---- filling out every class: more relics for the Summoner, Harpooner, Duelist, Stormwright and Clockmaker,
// a starfall mythic ability for every class, and Emily's scarf
UT.push(
  // Summoner
  { id: 'the_bone_lantern', type: 'lantern', slot: 'weapon', name: 'The Bone Lantern', bag: 'urn',
    weapon: { dmg: [85, 120], count: 2, arc: 0.3, range: 7, speed: 8, rate: 1.0, proj: 'pj_bonelantern', size: 0.5, special: { homing: 4, split: { n: 4, proj: 'pj_bone', f: 0.3 } } },
    desc: 'A lantern carved from a single great skull. Its light breaks into bones where it lands.' },
  { id: 'the_mourners_veil', type: 'shroud', slot: 'armor', name: 'The Mourner\'s Veil', bag: 'urn', bonus: { def: 16, mp: 100, wis: 6, vit: 4 },
    passive: { manashield: 0.2, lowregen: 30 }, desc: 'Grief wears thin. Then it wears you instead.' },
  // Harpooner
  { id: 'the_sea_wolf', type: 'oilskin', slot: 'armor', name: 'The Sea-Wolf\'s Oilskin', bag: 'urn', bonus: { def: 20, hp: 80, att: 4 },
    passive: { rage: 0.3, killheal: 15 }, desc: 'The longer the hunt, the hungrier it gets.' },
  // Duelist
  { id: 'the_feint', type: 'rapier', slot: 'weapon', name: 'The Feint', bag: 'urn',
    weapon: { dmg: [65, 95], count: 1, arc: 0, range: 4.8, speed: 19, rate: 1.8, proj: 'pj_feint', size: 0.45, pierce: true, special: { crit: { p: 0.35, x: 2.2 }, lifesteal: 0.04 } },
    desc: 'It points one way and strikes another. Nobody has ever seen it coming.' },
  { id: 'cracked_looking_glass', type: 'mirror', slot: 'ability', name: 'The Cracked Looking-Glass', bag: 'urn',
    ability: { cost: 60, decoy: 4, burst: { count: 14, proj: 'pj_glass', dmg: 200, range: 5.5 }, mod: 'echoes' },
    desc: 'The crack runs right down the middle, so it always shows two of you.' },
  // Stormwright
  { id: 'the_lightning_rod', type: 'coil', slot: 'weapon', name: 'The Lightning Rod', bag: 'urn',
    weapon: { dmg: [80, 115], count: 1, arc: 0, range: 7, speed: 15, rate: 1.1, proj: 'pj_lightningrod', size: 0.45, special: { chain: { n: 2, f: 0.6 }, starfall: { every: 8, dmg: 650, r: 1.6 } } },
    desc: 'Hold it up in a storm and the sky answers. Every eighth bolt, it answers loudly.' },
  { id: 'the_squall', type: 'kite', slot: 'ability', name: 'The Squall', bag: 'urn',
    ability: { cost: 85, life: 10, burst: { count: 1, proj: 'zap', dmg: 160, range: 5.5 }, mod: 'squall' },
    desc: 'A kite that will not stay where you leave it. It follows you like a little storm.' },
  { id: 'the_tempest_cloak', type: 'stormcloak', slot: 'armor', name: 'The Tempest Cloak', bag: 'urn', bonus: { def: 18, mp: 80, dex: 6 },
    passive: { manaonhit: 2, dodge: 0.08 }, desc: 'It crackles when you move. Every blow you land feeds the charge.' },
  // Clockmaker
  { id: 'the_cuckoo', type: 'pendulum', slot: 'weapon', name: 'The Cuckoo', bag: 'urn',
    weapon: { dmg: [150, 210], count: 2, arc: 0.3, range: 8, speed: 3, rate: 0.95, proj: 'pj_cuckoo', size: 0.55, special: { accel: 26, boomerang: true } },
    desc: 'It pops out, says its piece, and goes right back in.' },
  { id: 'the_hourglass_of_sand', type: 'stopwatch', slot: 'ability', name: 'The Hourglass of Sand', bag: 'urn',
    ability: { cost: 100, stop: 3.5, burst: { count: 0, proj: 'none', dmg: 0, range: 8.5 }, mod: 'slowfield' },
    desc: 'When time starts again, the sand is still in their joints.' },
  { id: 'the_gearmail', type: 'brasscoat', slot: 'armor', name: 'The Gearmail', bag: 'urn', bonus: { def: 22, hp: 60, wis: 6 },
    passive: { aegis: 7, manaonkill: 6 }, desc: 'A thousand tiny gears that turn one blow aside, then wind back up.' },
  // Emily, the Yapper
  { id: 'emilys_scarf', type: 'ring', slot: 'ring', name: 'Emily\'s Knitted Scarf', bag: 'urn', bonus: { hp: 60, spd: 6, vit: 4 },
    passive: { dodge: 0.06, lowregen: 25 }, desc: 'Pink, warm, and still talking. It will not stop telling you about its day.' },

  // ---- starfall mythic abilities: one for every class
  { id: 'the_unbroken_bellows', type: 'bellows', slot: 'ability', name: 'The Unbroken Bellows', bag: 'starfall', mythic: true,
    ability: { cost: 80, berserk: 7, burst: { count: 14, proj: 'pj_cinderfist', dmg: 220, range: 3.6 }, mod: 'inferno' },
    desc: 'It breathed the first fire into the world. It has not stopped since.' },
  { id: 'the_first_anvil', type: 'seal', slot: 'ability', name: 'The First Anvil', bag: 'starfall', mythic: true,
    ability: { cost: 90, armored: 6, burst: { count: 16, proj: 'hammerlet', dmg: 240, range: 4, pierce: true }, mod: 'meteor' },
    desc: 'The anvil the god was forged on. It falls from the sky in pieces, and then all at once.' },
  { id: 'the_second_sun', type: 'halo', slot: 'ability', name: 'The Second Sun', bag: 'starfall', mythic: true,
    ability: { cost: 110, heal: 350, invuln: 2.5, burst: { count: 20, proj: 'lance', dmg: 190, range: 5.5, pierce: true }, mod: 'eclipse' },
    desc: 'When the first sun died, someone lit another. It follows whoever holds it.' },
  { id: 'the_grave_of_kings', type: 'reliquary', slot: 'ability', name: 'The Grave of Kings', bag: 'starfall', mythic: true,
    ability: { cost: 110, thralls: 4, life: 14, summon: 'thrall_gilded', burst: { count: 3, proj: 'pj_thrall', dmg: 170, range: 6.5 }, mod: 'kings' },
    desc: 'Every king who ever died in the realm, and every one of them still wants a war.' },
  { id: 'the_leviathans_maw', type: 'hookline', slot: 'ability', name: 'The Leviathan\'s Maw', bag: 'starfall', mythic: true,
    ability: { cost: 85, armored: 4, burst: { count: 1, proj: 'hook', dmg: 600, range: 11 }, mod: 'maelstrom' },
    desc: 'Not a hook. A tooth. The thing it came from swallowed whole fleets.' },
  { id: 'the_infinite_reflection', type: 'mirror', slot: 'ability', name: 'The Infinite Reflection', bag: 'starfall', mythic: true,
    ability: { cost: 75, decoy: 4, burst: { count: 16, proj: 'pj_glass', dmg: 240, range: 6 }, mod: 'infinite' },
    desc: 'Two mirrors facing each other. Somewhere in there, all of you are fighting.' },
  { id: 'the_eye_of_the_storm', type: 'kite', slot: 'ability', name: 'The Eye of the Storm', bag: 'starfall', mythic: true,
    ability: { cost: 100, life: 12, burst: { count: 1, proj: 'zap', dmg: 190, range: 6 }, mod: 'eye' },
    desc: 'Three kites circle you, and you are the calm at the centre.' },
  { id: 'the_unwound_spring', type: 'stopwatch', slot: 'ability', name: 'The Unwound Spring', bag: 'starfall', mythic: true,
    ability: { cost: 120, stop: 4.5, unwind: 900, burst: { count: 0, proj: 'none', dmg: 0, range: 9 }, mod: 'unwind' },
    desc: 'All the time it stopped comes back at once, and it hits like a hammer.' },
);

// ---- what makes relics more than bigger numbers.
// weapon.special: homing (turn rad/s), chain {n,f}, explode {r,f}, burn {dps,t}, slow {f,t}, lifesteal f,
//   split {n,proj,f,onEnd}, boomerang, crit {p,x}, quake {n,proj,f,stun}, starfall {every,dmg,r}
// ability.mod: a twist on the class ability (see game.useAbility)
// passive: armour/ring effects summed across your equipment (see game.passive)
const SPECIAL = {
  knuckle_of_the_unstruck: { weapon: { burn: { dps: 45, t: 3 } } },
  billet_of_the_first_oath: { weapon: { explode: { r: 1.4, f: 0.5 } } },
  abbots_claw: { weapon: { slow: { f: 0.35, t: 1.5 }, lifesteal: 0.03 } },
  penitents_head: { weapon: { split: { n: 6, proj: 'tombshard', f: 0.35 } } },
  penitents_scourge: { weapon: { chain: { n: 2, f: 0.5 } } },
  tallow_tongs: { weapon: { burn: { dps: 80, t: 4 } } },
  orrery_rod: { weapon: { boomerang: true, slow: { f: 0.3, t: 1 } } },
  abbots_crozier: { weapon: { homing: 4 } },
  godheart_knuckle: { weapon: { lifesteal: 0.05, crit: { p: 0.15, x: 2 } } },
  godheart_tongs: { weapon: { explode: { r: 1.8, f: 0.6 }, burn: { dps: 140, t: 3 } } },
  godheart_scepter: { weapon: { chain: { n: 3, f: 0.6 } } },
  hammer_that_never_fell: { weapon: { quake: { n: 8, proj: 'hammerlet', f: 0.3, stun: 0.5 } } },
  starfall_knuckles: { weapon: { starfall: { every: 4, dmg: 900, r: 1.8 } } },
  sunless_psalter: { weapon: { homing: 3, chain: { n: 2, f: 0.5 }, crit: { p: 0.2, x: 3 } } },
  the_last_noon: { mod: 'follow' },
  censer_of_absolution: { mod: 'trail' },
  hymn_of_the_mire: { mod: 'cloud' },
  the_turning_verse: { mod: 'aftershock' },
  eaten_halo: { mod: 'devour' },
  wick_of_the_mother: { mod: 'ignite' },
  orrery_seal: { mod: 'freeze' },
  heralds_conch: { mod: 'vortex' },
  unstruck_anvil: { mod: 'triple' },
  stained_glass_halo: { mod: 'prism3' },
  rime_headsman_plate: { passive: { aura: { dps: 0, r: 3, slow: 0.35 } } },
  rime_standard: { passive: { aura: { dps: 30, r: 3, slow: 0.25 } } },
  salt_widows_veil: { passive: { manashield: 0.25 } },
  tallow_vestment: { passive: { emberthorns: 60 } },
  gilded_penance: { passive: { kintsugi: 0.25 } },
  rose_window_vestment: { passive: { prism: { every: 4, n: 10, dmg: 120, proj: 'pj_dawnray' } } },
  furnace_heart_coat: { passive: { aura: { dps: 70, r: 2.6, slow: 0 } } },
  tidewoven_coat: { passive: { dodge: 0.15 } },
  godforged_plate: { passive: { aegis: 5 } },
  heartstring_vestment: { passive: { lowregen: 45 } },
  heartbreak_coat: { passive: { rage: 0.5 } },
  pilgrims_pearl: { passive: { manaonkill: 4 } },
  bell_of_the_taken: { passive: { killburst: 0.4 } },
  trap_hound_collar: { passive: { momentum: 0.12 } },
  antler_crown: { passive: { execute: 0.5 } },
  pearl_of_the_drowned_mass: { passive: { killheal: 25 } },
  starless_band: { passive: { crit: { p: 0.12, x: 2 } } },
  bellringers_rope: { passive: { killburst: 0.6 } },
  kintsugi_band: { passive: { cheatdeath: 60 } },
  drowned_bell: { passive: { manaonhit: 1 } },
  crown_of_the_fallen: { passive: { crit: { p: 0.18, x: 2 }, execute: 0.35 } },
  shard_of_the_first_star: { passive: { crit: { p: 0.15, x: 2 }, killheal: 30, momentum: 0.1 } },
};
// ---- the Giant Watermelon's fruit (melon_event; icons from the registry, mx_items). Light and a little silly:
// a lowlands event, so they sit around the middle tiers, each with one juicy twist.
UT.push(
  { id: 'melon_slicer', type: 'sword', slot: 'weapon', name: 'Melon Slicer', reg: 'mx_items/melon_slicer',
    weapon: { dmg: [120, 180], range: 3.0, speed: 9, rate: 1.05, proj: 'blade', size: 0.5 }, desc: 'Sharp enough to part a rind in one stroke. It drips a little.' },
  { id: 'rindguard', type: 'heavy', slot: 'armor', name: 'Rindguard', reg: 'mx_items/rindguard', bonus: { def: 14, hp: 60, vit: 4 },
    desc: 'Plates of cured rind. Surprisingly tough, faintly sweet.' },
  { id: 'vinegrown_staff', type: 'staff', slot: 'weapon', name: 'Vinegrown Staff', reg: 'mx_items/vinegrown_staff',
    weapon: { dmg: [60, 92], count: 2, arc: 0.1, range: 6, speed: 14, rate: 1.0, proj: 'thornseed', size: 0.45 }, desc: 'Still growing. The seeds it throws go looking for something to land on.' },
  { id: 'seedspitter_bow', type: 'bow', slot: 'weapon', name: 'Seedspitter', reg: 'mx_items/seedspitter_bow',
    weapon: { dmg: [38, 62], count: 5, arc: 0.45, range: 5.2, speed: 15, rate: 1.0, proj: 'thornseed', size: 0.4 }, desc: 'Five seeds a pull, in a wide spray. Aim roughly.' },
  { id: 'rind_bulwark', type: 'seal', slot: 'ability', name: 'Rind Bulwark', reg: 'mx_items/rind_bulwark',
    ability: { cost: 70, armored: 4, heal: 100, burst: { count: 12, proj: 'thornseed', dmg: 120, range: 4 } }, desc: 'A shield of thick green rind. Slam it down and the seeds fly.' },
  { id: 'melon_orb', type: 'hex', slot: 'ability', name: 'The Melon Orb', reg: 'mx_items/melon_orb',
    ability: { cost: 80, curse: { t: 5, f: 0.25, r: 3.4 }, burst: { count: 10, proj: 'thornseed', dmg: 140, range: 4.5 } }, desc: 'A little green moon, ripe and humming. Throw its curse and the seeds scatter out of it.' },
  { id: 'ring_of_the_rind', type: 'ring', slot: 'ring', name: 'Ring of the Rind', reg: 'mx_items/ring_of_the_rind', bonus: { hp: 80, def: 4 },
    desc: 'A green band with a stripe of red inside, like a slice held up to the light.' },
  { id: 'honeydew_scepter', type: 'wand', slot: 'weapon', name: 'Honeydew Scepter', reg: 'mx_items/honeydew_scepter',
    weapon: { dmg: [85, 135], range: 8, speed: 18, rate: 1.05, proj: 'nectar', size: 0.42 }, desc: 'Its bolts leave everything they touch sticky and slow.' },
  { id: 'dewveil_robe', type: 'robe', slot: 'armor', name: 'Dewveil Robe', reg: 'mx_items/dewveil_robe', bonus: { def: 7, mp: 80, wis: 6 },
    desc: 'Pale green and always cool, like the morning on a melon patch.' },
  { id: 'dewdrop_ring', type: 'ring', slot: 'ring', name: 'Dewdrop Ring', reg: 'mx_items/dewdrop_ring', bonus: { mp: 60, wis: 6, vit: 3 },
    desc: 'One bead of honeydew, set in silver and never quite dry.' },
  { id: 'melon_baller', type: 'dagger', slot: 'weapon', name: 'Melon Baller', reg: 'mx_items/melon_baller',
    weapon: { dmg: [80, 125], range: 3.4, speed: 13, rate: 1.45, proj: 'honeyglob', size: 0.42 }, desc: 'Scoops. Quickly. Now and then it scoops out something important.' },
  { id: 'golden_honeydew', type: 'ring', slot: 'ring', name: 'The Golden Honeydew', reg: 'mx_items/golden_honeydew', bonus: { hp: 100, mp: 80, vit: 8, wis: 8 },
    desc: 'One in a hundred melons grows one. It hums when you are hurt, and mends you when something dies.' },
);
// ---- the realm event bosses' fruit (Phase 2f; icons from the registry, ix_items). The legendaries drop only from a
// phase-3 kill, which every kill is.
UT.push(
  { id: 'tidebreaker_trident', type: 'staff', slot: 'weapon', name: 'Tidebreaker Trident', reg: 'ix_items/tidebreaker_trident',
    weapon: { dmg: [70, 105], count: 3, arc: 0.12, range: 6.4, speed: 16, rate: 1.0, proj: 'tidebolt', size: 0.45, pierce: true }, desc: 'Three tines, three bolts, straight through whatever stands in the surf.' },
  { id: 'abyssal_pearl', type: 'ring', slot: 'ring', name: 'Abyssal Pearl', reg: 'ix_items/abyssal_pearl', bonus: { hp: 80, mp: 80, wis: 6 },
    desc: 'Black as the water it came up from. It is warm, which is wrong.' },
  { id: 'leviathan_eye', type: 'ring', slot: 'ring', name: 'The Leviathan Eye', reg: 'ix_items/leviathan_eye', bonus: { att: 6, dex: 6, hp: 60 }, legendary: true,
    desc: 'It still looks. Whatever it looks at, your shots find the soft part of.' },
  { id: 'heartwood_bow', type: 'bow', slot: 'weapon', name: 'Heartwood Bow', reg: 'ix_items/heartwood_bow',
    weapon: { dmg: [48, 78], count: 3, arc: 0.16, range: 6, speed: 17, rate: 1.0, proj: 'splinter', size: 0.45, pierce: true }, desc: 'Cut from the Treant\'s heart, and it still leans toward the living.' },
  { id: 'seed_of_renewal', type: 'ring', slot: 'ring', name: 'Seed of Renewal', reg: 'ix_items/seed_of_renewal', bonus: { hp: 100, vit: 8 },
    desc: 'Plant it in yourself. When you are cut down low, it grows.' },
  { id: 'blight_heart', type: 'ring', slot: 'ring', name: 'The Blight Heart', reg: 'ix_items/blight_heart', bonus: { att: 7, dex: 5 }, legendary: true,
    desc: 'The rot at the middle of the oldest tree. Everything you kill bursts into thorns.' },
);
// ---- Glacius' hoard (Frostveil Hollows; icons from the registry, ix_items). The Aurora Heart drops only from a phase-3 kill.
UT.push(
  { id: 'glacial_fang', type: 'dagger', slot: 'weapon', name: 'Glacial Fang', reg: 'ix_items/glacial_fang',
    weapon: { dmg: [105, 160], range: 3.6, speed: 14, rate: 1.5, proj: 'iceneedle', size: 0.42 }, desc: 'A tooth of the wyrm, still cold enough to slow what it bites.' },
  { id: 'rimeheart_bow', type: 'bow', slot: 'weapon', name: 'Rimeheart Bow', reg: 'ix_items/rimeheart_bow',
    weapon: { dmg: [52, 84], count: 3, arc: 0.18, range: 6, speed: 17, rate: 1.0, proj: 'icicle', size: 0.45, pierce: true }, desc: 'Strung with frozen sinew. Its arrows leave a rime on what they pass through.' },
  { id: 'wand_of_hoarfrost', type: 'wand', slot: 'weapon', name: 'Wand of Hoarfrost', reg: 'ix_items/wand_of_hoarfrost',
    weapon: { dmg: [100, 160], range: 8.6, speed: 19, rate: 1.05, proj: 'frostshard', size: 0.42 }, desc: 'Its bolt leaves a long white breath in the air.' },
  { id: 'frostweave_armor', type: 'robe', slot: 'armor', name: 'Frostweave Robe', reg: 'ix_items/frostweave_armor', bonus: { def: 10, wis: 8, mp: 60 },
    desc: 'Woven from the lake\'s first ice. The cold can still reach you, but it can no longer hold you.' },
  { id: 'ring_of_the_wyrm', type: 'ring', slot: 'ring', name: 'Ring of the Wyrm', reg: 'ix_items/ring_of_the_wyrm', bonus: { hp: 90, def: 6, vit: 5 },
    desc: 'A scale from its coil, bent round into a band.' },
  { id: 'aurora_heart', type: 'ring', slot: 'ring', name: 'The Aurora Heart', reg: 'ix_items/aurora_heart', bonus: { hp: 30, mp: 30, att: 3, def: 3, spd: 3, dex: 3, vit: 3, wis: 3 }, legendary: true,
    desc: 'The light that moved inside the wyrm\'s chest. Nothing can slow you while it is yours.' },
);
// ---- Mother Mycelia's (Mirerot Grotto; icons from ix_items). The Glowcap Crown drops only from a phase-3 kill.
UT.push(
  { id: 'bog_cleaver', type: 'sword', slot: 'weapon', name: 'Bog Cleaver', reg: 'ix_items/bog_cleaver',
    weapon: { dmg: [115, 170], range: 3.0, speed: 9, rate: 1.0, proj: 'bogspit', size: 0.5 }, desc: 'Rust and rot down the whole edge. Whatever it cuts goes on hurting.' },
  { id: 'sporecaller_wand', type: 'wand', slot: 'weapon', name: 'Sporecaller Wand', reg: 'ix_items/sporecaller_wand',
    weapon: { dmg: [90, 140], range: 8, speed: 18, rate: 1.05, proj: 'gasbubble', size: 0.42 }, desc: 'Its bolt bursts into spores when it lands.' },
  { id: 'mycelial_hide', type: 'leather', slot: 'armor', name: 'Mycelial Hide', reg: 'ix_items/mycelial_hide', bonus: { def: 12, vit: 6, hp: 40 },
    desc: 'Grown over a frame of roots. Poison has nothing left to take from you.' },
  { id: 'ring_of_rot', type: 'ring', slot: 'ring', name: 'Ring of Rot', reg: 'ix_items/ring_of_rot', bonus: { att: 5, hp: 70 },
    desc: 'A band of soft black wood. It is always slightly damp.' },
  { id: 'spore_bomb', type: 'bellows', slot: 'ability', name: 'Spore Bomb', reg: 'ix_items/spore_bomb',
    ability: { cost: 70, berserk: 4, burst: { count: 16, proj: 'gasbubble', dmg: 120, range: 4.5 } }, desc: 'A bellows stuffed with spores. Charge, and leave a cloud behind you.' },
  { id: 'glowcap_crown', type: 'ring', slot: 'ring', name: 'The Glowcap Crown', reg: 'ix_items/glowcap_crown', bonus: { hp: 80, wis: 6, vit: 6 }, legendary: true,
    desc: 'It glows faintly in the dark. Whatever dies near you feeds it, and it feeds you.' },
);
// ---- the Grand Orrery's (the Astral Observatory; icons from ix_items). Event Horizon drops only from a phase-3 kill.
UT.push(
  { id: 'starforged_katana', type: 'sword', slot: 'weapon', name: 'Starforged Katana', reg: 'ix_items/starforged_katana',
    weapon: { dmg: [150, 220], range: 3.2, speed: 10, rate: 1.0, proj: 'starbeam', size: 0.5, pierce: true }, desc: 'Folded from the brass of a broken orbit. Its arc goes through whatever is in the way.' },
  { id: 'comet_bow', type: 'bow', slot: 'weapon', name: 'Comet Bow', reg: 'ix_items/comet_bow',
    weapon: { dmg: [62, 98], count: 3, arc: 0.16, range: 6.4, speed: 18, rate: 1.0, proj: 'lensbolt', size: 0.45, pierce: true }, desc: 'Each arrow drags a tail of light behind it, and sometimes something else.' },
  { id: 'nebula_robe', type: 'robe', slot: 'armor', name: 'Nebula Robe', reg: 'ix_items/nebula_robe', bonus: { def: 11, mp: 100, wis: 9 },
    desc: 'Woven from the dust between stars. Your gifts come cheaper in it.' },
  { id: 'astral_signet', type: 'ring', slot: 'ring', name: 'Astral Signet', reg: 'ix_items/astral_signet', bonus: { dex: 7, wis: 7, mp: 40 },
    desc: 'Its face is a tiny orrery. It is always correct about where the stars are.' },
  { id: 'orrery_orb', type: 'halo', slot: 'ability', name: 'Orrery Orb', reg: 'ix_items/orrery_orb',
    ability: { cost: 90, heal: 220, burst: { count: 20, proj: 'star', dmg: 170, range: 5.5, pierce: true } }, desc: 'A small brass sky that unfolds round you, all its stars at once.' },
  { id: 'event_horizon', type: 'ring', slot: 'ring', name: 'Event Horizon', reg: 'ix_items/event_horizon', bonus: { att: 8, hp: 90 }, legendary: true,
    desc: 'What is left of the machine\'s heart: a point nothing comes back from. Keep moving, and it pulls harder.' },
);
// ---- the Gilded Sphinx's (Sandscour Tomb; icons from ix_items). The Deathmask drops only from a phase-3 kill.
UT.push(
  { id: 'sunscorch_khopesh', type: 'sword', slot: 'weapon', name: 'Sunscorch Khopesh', reg: 'ix_items/sunscorch_khopesh',
    weapon: { dmg: [95, 145], range: 3.0, speed: 9, rate: 1.05, proj: 'ember', size: 0.5 }, desc: 'Its hook still holds the heat of a sun that set a thousand years ago.' },
  { id: 'gilded_scepter', type: 'wand', slot: 'weapon', name: 'Gilded Scepter', reg: 'ix_items/gilded_scepter',
    weapon: { dmg: [75, 120], range: 8.2, speed: 19, rate: 1.05, proj: 'goldshard', size: 0.42, pierce: true }, desc: 'Gold all the way through. Its bolts go through things too.' },
  { id: 'embalmers_wraps', type: 'robe', slot: 'armor', name: 'Embalmer\'s Wraps', reg: 'ix_items/embalmers_wraps', bonus: { def: 8, wis: 6, hp: 40 },
    desc: 'Linen soaked in resin and old prayers. It does not breathe, and neither do you, quite.' },
  { id: 'scarab_ring', type: 'ring', slot: 'ring', name: 'Scarab Ring', reg: 'ix_items/scarab_ring', bonus: { dex: 5, spd: 5 },
    desc: 'A beetle of blue faience. It turns on your finger to face the sun.' },
  { id: 'sphinx_helm', type: 'seal', slot: 'ability', name: 'The Sphinx\'s Crown', reg: 'ix_items/sphinx_helm',
    ability: { cost: 70, armored: 4, burst: { count: 14, proj: 'ember', dmg: 130, range: 4.5 } }, desc: 'Wear the riddle. It crowns you in gold and throws the sand back at them.' },
  { id: 'pharaohs_deathmask', type: 'ring', slot: 'ring', name: 'The Pharaoh\'s Deathmask', reg: 'ix_items/pharaohs_deathmask', bonus: { hp: 20, mp: 20, att: 2, def: 2, spd: 2, dex: 2, vit: 2, wis: 2 }, legendary: true,
    desc: 'A face of gold for a king nobody remembers. Every death you cause, it drinks, and shares.' },
);
// ---- Count Vesper's (the Crimson Keep; icons from d2_items). The Nightfall Scythe drops only from a phase-3 kill.
UT.push(
  { id: 'crimson_rapier', type: 'dagger', slot: 'weapon', name: 'Crimson Rapier', reg: 'd2_items/crimson_rapier',
    weapon: { dmg: [120, 180], range: 3.8, speed: 15, rate: 1.5, proj: 'd2_projectiles/crimson_keep.crimson_slash', size: 0.4, pierce: true }, desc: 'Thin, quick, and always a little thirsty.' },
  { id: 'bloodthorn_staff', type: 'staff', slot: 'weapon', name: 'Bloodthorn Staff', reg: 'd2_items/bloodthorn_staff',
    weapon: { dmg: [70, 108], count: 2, arc: 0.1, range: 6.4, speed: 16, rate: 1.0, proj: 'thornseed', size: 0.45 }, desc: 'A rose cane grown hard as iron. Its thorns burst where they strike.' },
  { id: 'batwing_bow', type: 'bow', slot: 'weapon', name: 'Batwing Bow', reg: 'd2_items/batwing_bow',
    weapon: { dmg: [66, 100], count: 3, arc: 0.2, range: 6.2, speed: 17, rate: 1.05, proj: 'd2_projectiles/crimson_keep.bat_screech', size: 0.45, pierce: true }, desc: 'Strung with a wing\'s membrane. Its arrows scream a little.' },
  { id: 'sanguine_cloak', type: 'leather', slot: 'armor', name: 'Sanguine Cloak', reg: 'd2_items/sanguine_cloak', bonus: { def: 14, hp: 80, spd: 4 },
    desc: 'Lined in red velvet that never dries. When you are low, it remembers what it has drunk.' },
  { id: 'signet_of_the_count', type: 'ring', slot: 'ring', name: 'Signet of the Count', reg: 'd2_items/signet_of_the_count', bonus: { att: 6, vit: 6 },
    desc: 'His crest in garnet: a bat over a crown. The castle doors open for it.' },
  { id: 'crimson_chalice', type: 'reliquary', slot: 'ability', name: 'The Crimson Chalice', reg: 'd2_items/crimson_chalice',
    ability: { cost: 90, heal: 260, burst: { count: 16, proj: 'd2_projectiles/crimson_keep.blood_spit', dmg: 150, range: 5 } }, desc: 'Drink from it, and those around you bleed for your health.' },
  { id: 'nightfall_scythe', type: 'sword', slot: 'weapon', name: 'The Nightfall Scythe', reg: 'd2_items/nightfall_scythe', legendary: true,
    weapon: { dmg: [210, 290], count: 3, arc: 0.6, range: 3.6, speed: 9, rate: 0.9, proj: 'd2_projectiles/crimson_keep.crimson_slash', size: 0.55, pierce: true }, desc: 'The Count\'s own blade. Night falls in a wide red arc, and drinks.' },
);
// ---- the Grinning Ringmaster's (Hollowmoon Carnival; icons from d2_items). The Grinning Mask drops only from a phase-3 kill.
UT.push(
  { id: 'ringmaster_cane', type: 'wand', slot: 'weapon', name: 'The Ringmaster\'s Cane', reg: 'd2_items/ringmaster_cane',
    weapon: { dmg: [125, 190], range: 8.6, speed: 19, rate: 1.05, proj: 'bx2_shots/grinning_ringmaster.cane_star', size: 0.45 }, desc: 'Point it and say "and now". Something always happens.' },
  { id: 'jugglers_dagger', type: 'dagger', slot: 'weapon', name: 'Juggler\'s Dagger', reg: 'd2_items/jugglers_dagger',
    weapon: { dmg: [120, 175], range: 3.8, speed: 13, rate: 1.5, proj: 'd2_projectiles/hollowmoon.thrown_knife', size: 0.42 }, desc: 'Throw it. It comes back. It always comes back.' },
  { id: 'carousel_bow', type: 'bow', slot: 'weapon', name: 'Carousel Bow', reg: 'd2_items/carousel_bow',
    weapon: { dmg: [70, 108], count: 3, arc: 0.2, range: 6.4, speed: 17, rate: 1.05, proj: 'd2_projectiles/hollowmoon.horseshoe', size: 0.45, pierce: true }, desc: 'Painted horses gallop round its grip. Its arrows go round and round, then in.' },
  { id: 'harlequin_garb', type: 'robe', slot: 'armor', name: 'Harlequin Garb', reg: 'd2_items/harlequin_garb', bonus: { def: 12, dex: 8, spd: 6 },
    desc: 'Diamonds of every colour. It makes you very hard to hit, and impossible to miss.' },
  { id: 'ring_of_the_jester', type: 'ring', slot: 'ring', name: 'Ring of the Jester', reg: 'd2_items/ring_of_the_jester', bonus: { att: 4, dex: 6, spd: 4 },
    desc: 'It jingles. Your luck is better for wearing it, and so is your timing.' },
  { id: 'trick_deck', type: 'hex', slot: 'ability', name: 'The Trick Deck', reg: 'd2_items/trick_deck',
    ability: { cost: 80, curse: { t: 6, f: 0.3, r: 3.6 }, burst: { count: 18, proj: 'bx2_shots/grinning_ringmaster.playing_card', dmg: 170, range: 6 } }, desc: 'Pick a card. Any card. They all curse.' },
  { id: 'grinning_mask', type: 'ring', slot: 'ring', name: 'The Grinning Mask', reg: 'd2_items/grinning_mask', bonus: { att: 8, dex: 8 }, legendary: true,
    desc: 'It smiles for you. When you land a lucky blow, it laughs, and the blow lands three times over.' },
);
// ---- the Crypt's and the Emberforge's legendaries, from the brief (phase-3 kills of the Lich and the Colossus)
UT.push(
  { id: 'tidewraith_staff', type: 'staff', slot: 'weapon', name: 'The Tidewraith Staff', reg: 'ix_items/tidewraith_staff', legendary: true,
    weapon: { dmg: [95, 140], count: 2, arc: 0.1, range: 6.6, speed: 15, rate: 1.0, proj: 'bx_shots/tidebound_lich.soul_bolt', size: 0.45, pierce: true }, desc: 'The Lich\'s own. Its bolts lean with a current only they can feel, and come back once.' },
  { id: 'forgeheart_maul', type: 'sword', slot: 'weapon', name: 'The Forgeheart Maul', reg: 'ix_items/forgeheart_maul', legendary: true,
    weapon: { dmg: [300, 420], range: 3.2, speed: 8, rate: 0.6, proj: 'bx_shots/forgeheart_colossus.hammer_spark', size: 0.6 }, desc: 'Too heavy to swing, and you swing it anyway. Every blow throws a ring of sparks.' },
);
Object.assign(SPECIAL, {
  tidewraith_staff: { weapon: { boomerang: true, current: 1.6 } },
  forgeheart_maul: { weapon: { quake: { n: 8, proj: 'bx_shots/forgeheart_colossus.hammer_spark', f: 0.3, stun: 0.3 } } },
  jugglers_dagger: { weapon: { boomerang: true } },
  carousel_bow: { weapon: { homing: 1.6 } },
  harlequin_garb: { passive: { dodge: 0.12 } },
  ring_of_the_jester: { passive: { crit: { p: 0.1, x: 2 } } },
  trick_deck: { mod: 'contagion' },
  grinning_mask: { passive: { crit: { p: 0.12, x: 3 } } },
  crimson_rapier: { weapon: { lifesteal: 0.02 } },
  bloodthorn_staff: { weapon: { split: { n: 4, proj: 'thornseed', f: 0.3 } } },
  batwing_bow: { weapon: { homing: 0.8 } },
  sanguine_cloak: { passive: { lowregen: 40 } },
  crimson_chalice: { mod: 'devour' },
  nightfall_scythe: { weapon: { lifesteal: 0.03 } },
  sunscorch_khopesh: { weapon: { burn: { dps: 50, t: 3 } } },
  pharaohs_deathmask: { passive: { killheal: 35 } },
  sphinx_helm: { mod: 'aftershock' },
  starforged_katana: { weapon: { crit: { p: 0.12, x: 2 } } },
  comet_bow: { weapon: { homing: 1.2 } },
  nebula_robe: { passive: { manaonhit: 1 } },
  orrery_orb: { mod: 'follow' },
  event_horizon: { passive: { crit: { p: 0.12, x: 2.5 }, momentum: 0.1 } },
  bog_cleaver: { weapon: { burn: { dps: 60, t: 3 } } },
  sporecaller_wand: { weapon: { split: { n: 4, proj: 'gasbubble', f: 0.3 } } },
  mycelial_hide: { passive: { nopoison: true } },
  spore_bomb: { mod: 'cloud' },
  glowcap_crown: { passive: { killheal: 40, lowregen: 30 } },
  glacial_fang: { weapon: { slow: { f: 0.25, t: 1 } } },
  rimeheart_bow: { weapon: { slow: { f: 0.15, t: 0.8 } } },
  wand_of_hoarfrost: { weapon: { slow: { f: 0.3, t: 1.2 } } },
  frostweave_armor: { passive: { nofreeze: true } },
  aurora_heart: { passive: { noslow: true } },
  tidebreaker_trident: { weapon: { slow: { f: 0.15, t: 0.6 } } },
  leviathan_eye: { passive: { crit: { p: 0.15, x: 2 }, manaonhit: 1 } },
  heartwood_bow: { weapon: { homing: 1.5 } },
  seed_of_renewal: { passive: { lowregen: 40 } },
  blight_heart: { passive: { killburst: 0.5 } },
  melon_slicer: { weapon: { lifesteal: 0.02 } },
  vinegrown_staff: { weapon: { homing: 2 } },
  honeydew_scepter: { weapon: { slow: { f: 0.25, t: 1 } } },
  melon_baller: { weapon: { crit: { p: 0.12, x: 2 } } },
  rind_bulwark: { mod: 'aftershock' },
  dewveil_robe: { passive: { lowregen: 30 } },
  golden_honeydew: { passive: { killheal: 30, lowregen: 30 } },
});
for (const u of UT) {
  const S = SPECIAL[u.id];
  if (!S) continue;
  if (S.weapon) u.weapon.special = { ...(u.weapon.special || {}), ...S.weapon };
  if (S.mod) u.ability.mod = S.mod;
  if (S.passive) u.passive = { ...(u.passive || {}), ...S.passive };
}
for (const u of UT) add({ bag: 'reliquary', ...u, tier: 'UT', ut: true });

// ---- ADMIN: test gear. Never drops; /give or /admin only. Any class can wield it.
add({ id: 'admin_godhammer', type: 'godweapon', slot: 'weapon', tier: 'ADMIN', ut: true, admin: true, name: 'The Developer\'s Gavel',
  weapon: { dmg: [9000, 14000], count: 7, arc: 0.9, range: 12, speed: 18, rate: 3, proj: 'pj_admin', size: 0.7, pierce: true,
    special: { homing: 9, chain: { n: 5, f: 1 }, explode: { r: 2.5, f: 1 }, burn: { dps: 4000, t: 3 }, slow: { f: 0.8, t: 3 } } },
  desc: 'Objection overruled. Everything is overruled.' });
add({ id: 'admin_worldender', type: 'godability', slot: 'ability', tier: 'ADMIN', ut: true, admin: true, name: 'The Delete Key',
  ability: { cost: 0, mod: 'nuke', invuln: 2, heal: 99999, burst: { count: 0, proj: 'pj_admin', dmg: 9999999, range: 16 } },
  desc: 'Removes everything within sixteen tiles from the save file.' });
add({ id: 'admin_aegis', type: 'godarmor', slot: 'armor', tier: 'ADMIN', ut: true, admin: true, name: 'Plate of the Source Code',
  bonus: { hp: 9999, mp: 9999, def: 999, att: 120, spd: 60, dex: 90, vit: 300, wis: 300 },
  passive: { aura: { dps: 6000, r: 5, slow: 0.6 }, aegis: 0.5, prism: { every: 0.6, n: 16, dmg: 6000, proj: 'pj_admin' } },
  desc: 'Read-only. Nothing can write to you.' });
add({ id: 'admin_band', type: 'godring', slot: 'ring', tier: 'ADMIN', ut: true, admin: true, name: 'The Root Ring',
  bonus: { att: 200, dex: 120, spd: 40, hp: 2000, mp: 2000 },
  passive: { crit: { p: 1, x: 3 }, killheal: 9999, manaonkill: 9999, killburst: 3 },
  desc: 'sudo.' });
export const ADMIN_SET = ['admin_godhammer', 'admin_worldender', 'admin_aegis', 'admin_band'];

// ---- pet eggs: use one to hatch a pet (raise it at the Pet Yard in the Nexus)
for (const [r, name, desc] of [
  ['common', 'Speckled Pet Egg', 'Warm, and wobbling now and then. Something small and friendly is in there.'],
  ['uncommon', 'Mossy Pet Egg', 'Green-speckled and heavier than it looks. Whatever is inside is growing fast.'],
  ['rare', 'Azure Pet Egg', 'Cool to the touch and faintly glowing. It hums when you hold it close.'],
  ['legendary', 'Gilded Pet Egg', 'It shines like a coin and beats like a heart. Legends hatch from eggs like this.'],
]) add({ id: `pet_egg_${r}`, type: 'egg', slot: 'consumable', tier: null, name, use: { egg: r }, desc });
// Phase 7: the Pets v2 eggs, one per family x rarity. The shell shows the family, the band the rarity, the name both.
// (The four eggs above stay defined for old saves; loading turns them into these.)
export const EGG_FAMILIES = {
  aquatic: ['Aquatic', 'It sloshes when you shake it. Something in there is already swimming.'],
  avian: ['Avian', 'Speckled like a sparrow\'s. Every so often it chirps.'],
  canine: ['Canine', 'Warm, and it thumps now and then, like a tail against the shell.'],
  feline: ['Feline', 'It rolls off any table you put it on. On purpose, you suspect.'],
  spooky: ['Spooky', 'Cold, and lighter than an egg should be. It glows a little in the dark.'],
  woodland: ['Woodland', 'It smells of moss and rain. A leaf is stuck to it that won\'t come off.'],
  reptile: ['Reptile', 'Leathery and patient. It has been waiting a long time and can wait longer.'],
  insect: ['Insect', 'It buzzes. Hold it to your ear and it buzzes louder.'],
  automaton: ['Automaton', 'It ticks. Somewhere inside, a very small spring is being wound.'],
  exotic: ['Exotic', 'Nobody agrees on what lays these. Whatever is inside is something else.'],
};
export const EGG_RARITY = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', legendary: 'Legendary', divine: 'Divine' };
for (const [f, [fam, desc]] of Object.entries(EGG_FAMILIES)) for (const [r, rn] of Object.entries(EGG_RARITY)) {
  add({ id: `egg_${f}_${r}`, type: 'egg', slot: 'consumable', tier: null, name: `${rn} ${fam} Egg`, reg: `pt2_eggs/${f}_${r}`, use: { egg: r, family: f },
    desc: `${desc} Use it to hatch ${/^[AEIOU]/.test(fam) ? "an" : "a"} ${fam.toLowerCase()} pet.` });
}
// ---- dungeon keys: use one (outside a dungeon) and that dungeon's portal opens where you stand
for (const [d, name, desc, reg] of [
  ['chapel', 'Sunken Chapel Key', 'Barnacled bronze. You can hear the tide on the other side of the lock.'],
  ['crypt', 'Sunken Crypt Key', 'Carved from a knucklebone. The Lich never throws anything away.'],
  ['forge', 'Drowned Forge Key', 'Still hot from the forge, centuries after the fires went out.'],
  ['ember', 'Emberforge Key', 'Its teeth glow orange. Hold it by the bow.'],
  ['scriptorium', 'Scriptorium Key', 'Frost-rimed silver. It opens the stacks, and possibly a few minds.'],
  ['heart', 'Key to the Heart', 'It beats faintly in your palm, in time with something very large.'],
  ['throne', 'Key to the Throne', 'Pale gold and cold as a promise. The god is expecting you.'],
  ['hive', 'Honeyed Hollow Key', 'A key of hardened wax, sticky at the teeth. It smells of clover.'],
  ['theatre', 'Theatre Ticket', 'ADMIT ONE. FINAL PERFORMANCE. The ink is still wet.'],
  ['spire', 'Lighthouse Key', 'Clear glass, and somehow it throws a rainbow on your palm.'],
  ['dream', 'Key of Dreams', 'You are not sure you are holding it. You are not sure you are awake.'],
  ['frostveil', 'Frostveil Key', 'Cut from clear ice. It does not melt in your hand, which is worse.', 'ix_items/frostveil_key'],
  ['mirerot', 'Mirerot Key', 'Grown, not forged. It is slightly warm and very slightly alive.', 'ix_items/mirerot_key'],
  ['astral', 'Astral Key', 'Brass and starlight. It ticks.', 'ix_items/astral_key'],
  ['hollowmoon', 'Hollowmoon Ticket', 'ADMIT ONE. The moon on it is grinning.', 'd2_items/hollowmoon_key'],
  ['keep', 'Crimson Key', 'Iron, warm, and slightly sticky. Don\'t ask.', 'd2_items/crimson_key'],
  ['sandscour', 'Sandscour Key', 'A scarab of beaten gold. Its legs twitch when you aren\'t looking.', 'ix_items/sandscour_key'],
]) add({ id: `key_${d}`, type: 'key', slot: 'consumable', tier: null, name, use: { key: d }, reg: reg || undefined, desc: `${desc} Use it outside a dungeon to open a portal there.` });
// ---- a vault chest: use it and your vault grows by 8 slots
add({ id: 'vault_chest', type: 'chest', slot: 'consumable', tier: null, name: 'Vault Chest', use: { vault: 8 },
  desc: 'An iron-bound chest, delivered to your vault the moment you use it. Your vault grows by 8 slots.' });
// ---- a second backpack: +8 inventory slots for one character
add({ id: 'backpack', type: 'backpack', slot: 'consumable', tier: null, name: 'Pilgrim\'s Satchel', use: { backpack: true },
  desc: 'A second backpack. Use it to give this character 8 more inventory slots. One per character.' });

// ---- human-readable lines for tooltips
const MOD_TEXT = {
  follow: 'The pillar follows your cursor.', trail: 'The charge leaves a trail of burning incense.', cloud: 'The charge ends in a lingering bile cloud.',
  aftershock: 'A second anvil falls on the same spot.', devour: 'Kills inside the pillar heal you.', ignite: 'Everything in the pillar is set alight.',
  freeze: 'The anvil\'s stun lasts twice as long.', vortex: 'The charge drags enemies along in its wake.', triple: 'Three anvils fall in a line.',
  prism3: 'Splits into three smaller pillars.', thrallburst: 'Thralls explode when they expire.', thrallfan: 'Thralls cleave everything around what they are clawing.',
  reel3: 'Hooks up to three enemies at once.', hall: 'Leaves three reflections instead of one.', twinkite: 'Flies two kites at once.',
  rewind: 'Frozen enemy bullets turn around and fly back at their owners.',
  echoes: 'Leaves two reflections instead of one.', squall: 'The kite follows you around.', slowfield: 'When time restarts, everything that was frozen stays slowed for 3s.',
  inferno: 'The charge sets the ground ablaze behind you and ends in two eruptions.', meteor: 'A ring of anvils rains down, then one great anvil in the middle.',
  eclipse: 'One huge pillar that follows your cursor, burns, and heals you on kills.', kings: 'Gilded kings that cleave and explode when they fall.',
  maelstrom: 'Hooks up to five enemies, and they arrive in a thunderclap.', infinite: 'Leaves five reflections in a ring, each shattering twice.',
  eye: 'Three kites circle you wherever you go.', unwind: 'When time restarts, everything frozen takes a huge blow.', shockline: 'Reeled-in enemies arrive in a thunderclap explosion.', nuke: 'Deletes everything nearby.',
};
export function specialLines(it) {
  const L = [], w = it.weapon && it.weapon.special, p = it.passive;
  const sg = it.ability && it.ability.sig;                // its signature on every use (src/data/uniques.js)
  if (sg && sg.kind === 'orbit') L.push(orbitLine(sg.sets, sg.life));
  else if (sg) L.push({ nova: `Signature: a ring of ${sg.n} shots bursts from you`, rain: `Signature: ${sg.n} shots rain onto the cursor`, mines: `Signature: ${sg.n} mines at the cursor, which burst`,
    wave: `Signature: a wall of ${sg.n} shots sweeps forward`, spiral: `Signature: a ${sg.n}-armed spiral turns out from you`, lance: `Signature: ${sg.n} heavy piercing lances` }[sg.kind] + ` (${sg.dmg} each)`);
  if (w && w.mech) L.push(...mechLine(w.mech));
  if (w) {
    if (w.chain) L.push(`Arcs to ${w.chain.n} more enemies (${Math.round(w.chain.f * 100)}%)`);
    if (w.explode) L.push(`Explodes on hit (${w.explode.r} tiles, ${Math.round(w.explode.f * 100)}%)`);
    if (w.burn) L.push(`Ignites: ${w.burn.dps}/s for ${w.burn.t}s`);
    if (w.slow) L.push(`Slows ${Math.round(w.slow.f * 100)}% for ${w.slow.t}s`);
    if (w.lifesteal) L.push(`Lifesteal ${Math.round(w.lifesteal * 100)}%`);
    if (w.split) L.push(`${w.split.onEnd ? 'Bursts at the end of its flight' : 'Shatters on hit'} into ${w.split.n} shards`);
    if (w.boomerang) L.push('Returns to you like a boomerang');
    if (w.accel && !(it.type === 'pendulum' && !it.ut)) L.push('Starts slow and accelerates');
    if (w.crit) L.push(`${Math.round(w.crit.p * 100)}% chance for ${w.crit.x}× damage`);
    if (w.quake) L.push(`Each hit sends a shockwave of ${w.quake.n} shards${w.quake.stun ? ' and stuns' : ''}`);
    if (w.starfall) L.push(`Every ${w.starfall.every}th volley calls down a falling star`);
    if (w.curse) L.push(`Every hit hexes: +${Math.round(w.curse.f * 100)}% damage taken for ${w.curse.t}s`);
  }
  if (it.ability && it.ability.mod) L.push(MOD_TEXT[it.ability.mod]);
  if (it.ability && it.ability.halo) L.push(HALO_TEXT[it.ability.halo.kind]);
  if (it.ability && it.ability.sigil) L.push(sigilLine(it.ability.sigil));
  if (it.ability && it.ability.myth) L.push(MYTHIC_TEXT[it.ability.myth.kind]);
  if (p) {
    if (p.orbit) L.push(orbitLine(p.orbit));
    if (p.aura) L.push(p.aura.dps ? `Aura: ${p.aura.dps}/s to enemies within ${p.aura.r} tiles${p.aura.slow ? ', slowing them' : ''}` : `Frost aura: slows enemies within ${p.aura.r} tiles`);
    if (p.manashield) L.push(`${Math.round(p.manashield * 100)}% of damage taken drains Mana instead`);
    if (p.emberthorns) L.push(`When hit, ignites enemies around you (${p.emberthorns}/s)`);
    if (p.kintsugi) L.push(`After you are hit: +${Math.round(p.kintsugi * 100)}% damage for 3s`);
    if (p.prism) L.push(`Every ${p.prism.every}s fires a ring of ${p.prism.n} shards`);
    if (p.dodge) L.push(`${Math.round(p.dodge * 100)}% chance to dodge a hit`);
    if (p.burnbonus) L.push(`+${Math.round(p.burnbonus * 100)}% damage to burning enemies`);
    if (p.slowbonus) L.push(`+${Math.round(p.slowbonus * 100)}% damage to slowed enemies`);
    if (p.critheal) L.push(`Critical hits heal ${p.critheal * 5} Life and restore ${p.critheal * 2} Mana`);
    if (p.setbonus) L.push('Counts as one more piece of every set you wear');
    if (p.aegis) L.push(`Blocks one hit every ${p.aegis}s`);
    if (p.lowregen) L.push(`Below 35% Life: regenerate ${p.lowregen}/s`);
    if (p.rage) L.push(`Up to +${Math.round(p.rage * 100)}% damage as your Life drops`);
    if (p.momentum) L.push(`+${Math.round(p.momentum * 100)}% damage while moving`);
    if (p.execute) L.push(`+${Math.round(p.execute * 100)}% damage to enemies under 30% Life`);
    if (p.killheal) L.push(`Heal ${p.killheal} on kill`);
    if (p.manaonkill) L.push(`+${p.manaonkill} Mana on kill`);
    if (p.manaonhit) L.push(`+${p.manaonhit} Mana per hit`);
    if (p.killburst) L.push('Kills explode into shrapnel');
    if (p.crit) L.push(`${Math.round(p.crit.p * 100)}% chance for ${p.crit.x}× damage`);
    if (p.cheatdeath) L.push(`Cheat death: a lethal blow leaves you at 40% Life (every ${p.cheatdeath}s)`);
  }
  return L;
}

// ---- presentation helpers
export function itemLabel(it) {
  if (it.type === 'backpack') return 'Consumable · Character upgrade';
  if (it.slot === 'consumable') return 'Consumable';
  if (it.admin) return `ADMIN · ${TYPE_LABEL[it.type]} · any class`;
  const users = usableBy(it), who = users.length && users.length < 8 ? ` · ${users.map((c) => CLASSES[c].name).join(', ')}` : '';
  return `${it.mythic ? 'Mythic' : it.ut ? 'Untiered' : 'T' + it.tier} ${TYPE_LABEL[it.type]}${who}`;
}
export function iconIndex(world, it) {
  if (it.reg) return world.items.potion;          // drawn from the registry instead (Renderer.icon); this is a fallback
  const id = it.base || it.id;
  if (it.ut || world.items[id] !== undefined) return world.items[id];
  if (it.slot === 'consumable') return world.items.potion + it.icon;
  return world.items[it.type] + it.tier;
}
export const usableBy = (it) => Object.keys(CLASSES).filter((c) => [CLASSES[c].weapon, CLASSES[c].ability, CLASSES[c].armor].includes(it.type));
export const canEquip = (cls, it) => !['weapon', 'ability', 'armor'].includes(it.slot) || it.admin || usableBy(it).includes(cls);

// ---- bags: colour tells you what's inside before you walk over
// RotMG-style: brown for the everyday, purple for the good stuff, white for relics; mythics come in a white bag
// with a gold beam. A bag keeps its colour for its whole life (taking the prize out doesn't change it).
export const BAG_ORDER = ['brown', 'purple', 'white', 'starfall', 'divine'];
export const BAG_NAMES = { white: 'A white bag', starfall: 'A STARFALL bag', divine: 'A DIVINE bag' };
const DIVINE = new Set(['crown_of_the_unstruck']);
export function bagRank(it) {
  if (it.admin || DIVINE.has(it.base || it.id)) return 4;          // beyond mythic: the final boss's prize, the admin kit
  if (it.mythic || it.legendary) return 3;
  if (it.ut || it.bag === 'urn' || it.bag === 'reliquary' || it.bag === 'starfall') return 2;
  if (it.slot === 'consumable') return it.use && it.use.stat ? 1 : 0;
  if (it.enchants) return 1;
  const t = it.tier, small = it.slot === 'ability' || it.slot === 'ring';
  return (small ? t >= 4 : t >= 8) ? 1 : 0;
}
export const bagFor = (items) => BAG_ORDER[Math.max(0, ...items.map(bagRank))];

// ---- loot rolling. entry: {slot, tiers:[a,b], p} | {id, p} | {stat:true, p}
const SLOT_TYPES = { weapon: WEAPON_TYPES, ability: ABILITY_TYPES, armor: ARMOR_TYPES };
// ================================================================ enchantments
// Any gear that drops has a small chance to carry one (rarely two) enchantments: a stat, a weapon trick,
// a stronger ability, a passive, or very rarely something unique. Grades I-III scale the effect.
const g3 = (a, b, c) => (g) => [a, b, c][g - 1];
const addBonus = (it, k, v) => { it.bonus = { ...(it.bonus || {}) }; it.bonus[k] = (it.bonus[k] || 0) + v; };
const addPassive = (it, k, v) => {
  it.passive = { ...(it.passive || {}) };
  const o = it.passive[k];
  it.passive[k] = typeof v === 'number' ? (k === 'aegis' || k === 'cheatdeath' ? Math.min(o || 1e9, v) : (o || 0) + v) : v;
};
const addSpecial = (it, k, v) => { it.weapon = { ...it.weapon, special: { ...(it.weapon.special || {}), [k]: v } }; };
const STAT_NAME = { hp: 'Life', mp: 'Mana', att: 'Attack', def: 'Defense', spd: 'Speed', dex: 'Dexterity', vit: 'Vitality', wis: 'Wisdom' };
const statEnchant = (k, adj, per) => ({ adj, slots: ['weapon', 'ability', 'armor', 'ring'], w: 10,
  apply: (it, g) => addBonus(it, k, per * g), text: (g) => `+${per * g} ${STAT_NAME[k]}` });
export const ENCHANTS = {
  hp: statEnchant('hp', 'Hearty', 20), mp: statEnchant('mp', 'Brimming', 20), att: statEnchant('att', 'Mighty', 2), def: statEnchant('def', 'Sturdy', 2),
  spd: statEnchant('spd', 'Swift', 2), dex: statEnchant('dex', 'Nimble', 2), vit: statEnchant('vit', 'Hale', 2), wis: statEnchant('wis', 'Wise', 2),
  // weapons
  keen: { adj: 'Keen', slots: ['weapon'], w: 8, apply: (it, g) => addSpecial(it, 'crit', { p: g3(0.08, 0.12, 0.16)(g), x: 2 }), text: (g) => `${Math.round(g3(8, 12, 16)(g))}% chance to deal double damage` },
  sharp: { adj: 'Honed', slots: ['weapon'], w: 10, apply: (it, g) => { const f = 1 + 0.06 * g; it.weapon = { ...it.weapon, dmg: it.weapon.dmg.map((d) => Math.round(d * f)) }; }, text: (g) => `+${6 * g}% weapon damage` },
  burning: { adj: 'Burning', slots: ['weapon'], w: 6, apply: (it, g) => addSpecial(it, 'burn', { dps: g3(25, 45, 70)(g), t: 3 }), text: (g) => `Hits ignite: ${g3(25, 45, 70)(g)}/s for 3s` },
  frost: { adj: 'Frosted', slots: ['weapon'], w: 6, apply: (it, g) => addSpecial(it, 'slow', { f: g3(0.2, 0.3, 0.4)(g), t: 1.5 }), text: (g) => `Hits slow by ${g3(20, 30, 40)(g)}%` },
  vampiric: { adj: 'Vampiric', slots: ['weapon'], w: 5, apply: (it, g) => addSpecial(it, 'lifesteal', g3(0.02, 0.035, 0.05)(g)), text: (g) => `Lifesteal ${g3(2, 3.5, 5)(g)}%` },
  arcing: { adj: 'Arcing', slots: ['weapon'], w: 5, apply: (it, g) => addSpecial(it, 'chain', { n: g, f: 0.5 }), text: (g) => `Arcs to ${g} more ${g > 1 ? 'enemies' : 'enemy'} (50%)` },
  // (once 'Seeking': no item seeks now, so the id stays for old saves and it reaches farther instead)
  seeking: { adj: 'Far-Flung', slots: ['weapon'], w: 4, apply: (it, g) => { it.weapon = { ...it.weapon, range: +(it.weapon.range * (1 + 0.06 * g)).toFixed(2) }; }, text: (g) => `Shots fly ${6 * g}% farther` },
  volatile: { adj: 'Volatile', slots: ['weapon'], w: 4, apply: (it, g) => addSpecial(it, 'explode', { r: 1, f: g3(0.2, 0.3, 0.4)(g) }), text: (g) => `Explodes on hit (${g3(20, 30, 40)(g)}%)` },
  // abilities
  thrifty: { adj: 'Thrifty', slots: ['ability'], w: 10, apply: (it, g) => { it.ability = { ...it.ability, cost: Math.round(it.ability.cost * (1 - 0.1 * g)) }; }, text: (g) => `Costs ${10 * g}% less Mana` },
  potent: { adj: 'Potent', slots: ['ability'], w: 10, apply: (it, g) => { it.ability = { ...it.ability, burst: { ...it.ability.burst, dmg: Math.round(it.ability.burst.dmg * (1 + 0.12 * g)) } }; }, text: (g) => `+${12 * g}% ability damage` },
  // armour + rings
  evasive: { adj: 'Evasive', slots: ['armor', 'ring'], w: 6, apply: (it, g) => addPassive(it, 'dodge', g3(0.03, 0.05, 0.07)(g)), text: (g) => `${g3(3, 5, 7)(g)}% chance to dodge a hit` },
  warded: { adj: 'Warded', slots: ['armor'], w: 4, apply: (it, g) => addPassive(it, 'aegis', g3(14, 11, 8)(g)), text: (g) => `Blocks one hit every ${g3(14, 11, 8)(g)}s` },
  mending: { adj: 'Mending', slots: ['armor', 'ring'], w: 6, apply: (it, g) => addPassive(it, 'lowregen', g3(15, 25, 35)(g)), text: (g) => `Below 35% Life: regenerate ${g3(15, 25, 35)(g)}/s` },
  feasting: { adj: 'Feasting', slots: ['armor', 'ring', 'weapon'], w: 6, apply: (it, g) => addPassive(it, 'killheal', 5 * g), text: (g) => `Kills heal ${5 * g} Life` },
  soulful: { adj: 'Soulful', slots: ['armor', 'ring', 'ability'], w: 6, apply: (it, g) => addPassive(it, 'manaonkill', 2 * g), text: (g) => `Kills restore ${2 * g} Mana` },
  restless: { adj: 'Restless', slots: ['armor', 'ring'], w: 5, apply: (it, g) => addPassive(it, 'momentum', g3(0.05, 0.08, 0.12)(g)), text: (g) => `+${g3(5, 8, 12)(g)}% damage while moving` },
  thorned: { adj: 'Thorned', slots: ['armor'], w: 5, apply: (it, g) => addPassive(it, 'emberthorns', g3(20, 35, 50)(g)), text: (g) => `When hit, ignites enemies around you (${g3(20, 35, 50)(g)}/s)` },
  furious: { adj: 'Furious', slots: ['ring', 'weapon'], w: 4, apply: (it, g) => addPassive(it, 'rage', g3(0.1, 0.15, 0.2)(g)), text: (g) => `Up to +${g3(10, 15, 20)(g)}% damage as your Life drops` },
  // unique: rare, always grade I, a whole new trick
  shardsong: { adj: 'Shardsinging', unique: true, slots: ['armor', 'ring'], w: 1.2, apply: (it) => addPassive(it, 'prism', { every: 5, n: 8, dmg: 90, proj: 'pj_glass' }), text: () => 'Every 5s a ring of 8 glass shards bursts from you' },
  smoulder: { adj: 'Smouldering', unique: true, slots: ['armor'], w: 1.2, apply: (it) => addPassive(it, 'aura', { dps: 40, r: 2.4, slow: 0 }), text: () => 'Aura: 40/s fire to enemies within 2.4 tiles' },
  gravedust: { adj: 'Gravedust', unique: true, slots: ['weapon', 'ring'], w: 1.2, apply: (it) => addPassive(it, 'killburst', 0.3), text: () => 'Kills burst into shrapnel' },
  phoenix: { adj: 'Phoenix', unique: true, slots: ['armor', 'ring'], w: 0.8, apply: (it) => addPassive(it, 'cheatdeath', 120), text: () => 'Cheat death once every 120s' },
  headsman: { adj: 'Headsman\'s', unique: true, slots: ['weapon'], w: 1.2, apply: (it) => addPassive(it, 'execute', 0.3), text: () => '+30% damage to enemies below 30% Life' },
};
const ROMAN = ['', 'I', 'II', 'III'];
const enchantCache = new Map();
function enchanted(id) {
  if (enchantCache.has(id)) return enchantCache.get(id);
  const [baseId, code] = id.split('~'), base = BASE_ITEMS[baseId];
  if (!base || !code) return undefined;
  const it = JSON.parse(JSON.stringify(base));
  it.id = id; it.base = baseId; it.enchants = [];
  for (const c of code.split('.')) {
    const m = /^([a-z]+)([1-3])$/.exec(c), E = m && ENCHANTS[m[1]];
    if (!E) continue;
    const g = +m[2];
    E.apply(it, g);
    it.enchants.push({ key: m[1], g, unique: !!E.unique, text: E.text(g) + (E.unique ? '' : ` (${ROMAN[g]})`) });
  }
  if (!it.enchants.length) return base;
  it.name = `${ENCHANTS[it.enchants[0].key].adj} ${base.name.replace(/^The /, '')}`;
  enchantCache.set(id, it);
  return it;
}
export const baseId = (id) => (id ? id.split('~')[0] : id);
export const ENCHANT_CHANCE = 0.12;
// maybe enchant a freshly dropped item
export function maybeEnchant(id, chance = ENCHANT_CHANCE) {
  const it = BASE_ITEMS[id];
  if (!it || it.admin || it.slot === 'consumable' || it.type === 'junk' || id === 'rubber_duck' || R() > chance) return id;
  const pool = Object.entries(ENCHANTS).filter(([, E]) => E.slots.includes(it.slot));
  const pick = (avoid) => {
    const P = pool.filter(([k]) => !avoid.includes(k)), tot = P.reduce((a, [, E]) => a + E.w, 0);
    let r = R() * tot;
    for (const [k, E] of P) if ((r -= E.w) <= 0) return [k, E];
    return P[P.length - 1];
  };
  const tierLuck = it.mythic ? 0.5 : it.ut ? 0.35 : typeof it.tier === 'number' ? it.tier / 30 : 0;
  const grade = () => 1 + (R() < 0.3 + tierLuck ? 1 : 0) + (R() < 0.08 + tierLuck * 0.5 ? 1 : 0);
  const out = [], [k1, E1] = pick([]);
  out.push(k1 + (E1.unique ? 1 : grade()));
  if (R() < 0.2) { const [k2, E2] = pick([k1]); out.push(k2 + (E2.unique ? 1 : grade())); }
  return `${id}~${out.join('.')}`;
}

export function rollLoot(table, luck = 1) {
  const out = [];
  for (const e of table) {
    if (R() > e.p * luck) continue;
    if (e.id) out.push(maybeEnchant(e.id));
    else if (e.stat) out.push(`stat_${R.pick(STATS)}`);
    else {
      const t = R.int(e.tiers[0], e.tiers[1]);
      if (e.slot === 'ring') out.push(maybeEnchant(`ring_${R.pick(STATS)}_t${Math.min(5, t)}`));
      else {
        const type = R.pick(SLOT_TYPES[e.slot]);
        const cap = e.slot === 'weapon' ? 10 : e.slot === 'ability' ? 5 : 11;
        out.push(maybeEnchant(`${type}_t${Math.min(cap, t)}`));
      }
    }
  }
  return out.slice(0, 8);
}

// ---- quirks
add({ id: 'rubber_duck', type: 'ring', slot: 'ring', tier: 'UT', ut: true, bag: 'starfall', name: 'The Rubber Duck', bonus: { spd: 8, dex: 4, vit: 4 },
  passive: { dodge: 0.08, killburst: 0.3 }, desc: 'Squeak.' });
add({ id: 'old_boot', type: 'junk', slot: 'consumable', tier: null, name: 'An Old Boot', use: { junk: true }, desc: 'Fished out of the Nexus pond. Smells like regret. Sells for 1 gold.' });
add({ id: 'river_fish', type: 'potion', slot: 'consumable', tier: null, name: 'A Pond Fish', use: { heal: 250, mana: 80 }, desc: 'Still flapping. Restores 250 Life and 80 Mana.' });
add({ id: 'golden_carp', type: 'potion', slot: 'consumable', tier: null, name: 'The Golden Carp', use: { carp: true }, desc: 'Eat it and gain +1 to every stat (up to your class maximum). The cat is watching you.' });
add({ id: 'mystery_box', type: 'potion', slot: 'consumable', tier: null, name: 'A Suspicious Box', use: { mystery: true }, desc: 'It rattles. Something inside is giggling.' });

// ================================================================ RotMG families for the old relics
// Every untiered relic made for a retired weapon/armour type joins its RotMG family; a few get names that fit.
const RENAME = {
  knuckle_of_the_unstruck: 'Blade of the Unstruck', abbots_claw: 'The Abbot\'s Cleaver', godheart_knuckle: 'Godheart Blade',
  starfall_knuckles: 'Starfall Blade', cinder_saints_fist: 'The Cinder-Saint\'s Sword', billet_of_the_first_oath: 'Blade of the First Oath',
  penitents_head: 'The Penitent\'s Greatsword', tallow_tongs: 'The Tallow Brand', godheart_tongs: 'Godheart Greatsword',
  hammer_that_never_fell: 'The Sword That Never Fell', quenching_tongs: 'The Quenching Blade', lantern_of_the_last_watch: 'Staff of the Last Watch',
  the_bone_lantern: 'The Bone Staff', leviathan_tine: 'The Leviathan Bow', the_gearmail: 'The Gearwright\'s Robe',
};
for (const it of Object.values(BASE_ITEMS)) {
  if (LEGACY_TYPE[it.type]) it.type = LEGACY_TYPE[it.type];
  if (RENAME[it.id]) it.name = RENAME[it.id];
}
for (const c of Object.values(CLASSES)) { if (LEGACY_TYPE[c.weapon]) c.weapon = LEGACY_TYPE[c.weapon]; if (LEGACY_TYPE[c.armor]) c.armor = LEGACY_TYPE[c.armor]; }

// ================================================================ no seeking shots, anywhere
for (const it of Object.values(BASE_ITEMS)) if (it.weapon && it.weapon.special) delete it.weapon.special.homing;
delete ENCHANTS.seeking;

// ================================================================ class sets (RotMG "ST" style) + synergy rings
// Each class has a three-piece set: wear two pieces for a bonus, all three for its full power.
// Several pieces and rings feed each other: fire gear + rings that punish burning, slowing gear + rings that punish
// the slowed, crit gear + rings that heal on crits, and a ring that counts as one more piece of every set you wear.
const S = (id, type, slot, name, set, extra, desc) => ({ id, type, slot, name, set, bag: 'urn', ...extra, desc });
const SET_ITEMS = [
  // Runeblade: The Runewarden's Oath
  S('runewarden_blade', 'sword', 'weapon', 'Runewarden\'s Blade', 'runewarden',
    { weapon: { dmg: [140, 200], count: 1, arc: 0, range: 3.2, speed: 14, rate: 1.05, proj: 'rune_slash', size: 0.55, pierce: true } },
    'Its runes spell out an oath. You took it the moment you picked it up.'),
  S('runewarden_ward', 'runeward', 'ability', 'Runewarden\'s Ward', 'runewarden',
    { ability: { cost: 75, ward: 420, burst: { count: 14, proj: 'rune_slash', dmg: 180, range: 4, pierce: true } } },
    'The oath, spoken aloud. The runes answer by standing between you and harm.'),
  S('runewarden_brigandine', 'leather', 'armor', 'Runewarden\'s Brigandine', 'runewarden', { bonus: { def: 18, hp: 50, dex: 4 } },
    'Rune-stitched leather. The stitches tighten when danger is near.'),
  // Hexweaver: The Hexweaver's Circle
  S('hexcircle_staff', 'staff', 'weapon', 'Staff of the Circle', 'hexcircle',
    { weapon: { dmg: [85, 125], count: 2, arc: 0.12, range: 6.4, speed: 11, rate: 1.0, proj: 'hex_bolt', size: 0.45 } },
    'The circle meets at its tip. Whatever it points at is already inside.'),
  S('hexcircle_grimoire', 'hex', 'ability', 'Grimoire of the Circle', 'hexcircle',
    { ability: { cost: 80, curse: { t: 6.5, f: 0.32, r: 3.3 }, burst: { count: 12, proj: 'hex_bolt', dmg: 150, range: 4.5 } } },
    'Thirteen witches wrote one page each. Do not read it aloud.'),
  S('hexcircle_robe', 'robe', 'armor', 'Robe of the Circle', 'hexcircle', { bonus: { def: 11, mp: 70, wis: 5 } },
    'Embroidered with a circle that never closes. Something is meant to step into it.'),
  // Brawler: The Pit-Fighter's Panoply
  S('pitfighters_cleaver', 'sword', 'weapon', 'Pit-Fighter\'s Cleaver', 'pitfighter',
    { weapon: { dmg: [150, 210], count: 1, arc: 0, range: 3.8, speed: 13, rate: 1.0, proj: 'pj_cinderfist', size: 0.55, special: { burn: { dps: 60, t: 3 } } } },
    'Heated in the pit\'s brazier between bouts. Everything it cuts keeps burning.'),
  S('pitfighters_bellows', 'bellows', 'ability', 'Pit-Fighter\'s Bellows', 'pitfighter',
    { ability: { cost: 70, berserk: 6, burst: { count: 12, proj: 'pj_cinderfist', dmg: 180, range: 3.5 }, mod: 'trail' } },
    'The crowd\'s roar, bottled. The charge leaves a road of burning incense.'),
  S('pitfighters_harness', 'heavy', 'armor', 'Pit-Fighter\'s Harness', 'pitfighter', { bonus: { def: 22, hp: 60, att: 4 } },
    'Scarred leather and chain. It has never lost a fight it finished.'),
  // Forge Knight: The Oathsworn Bulwark
  S('oathsworn_greatsword', 'sword', 'weapon', 'Oathsworn Greatsword', 'oathsworn',
    { weapon: { dmg: [200, 270], count: 1, arc: 0, range: 4, speed: 11, rate: 0.8, proj: 'pj_quench', size: 0.6, pierce: true, special: { explode: { r: 1.2, f: 0.35 } } } },
    'Swung once per oath. Every blow lands like a promise kept.'),
  S('oathsworn_seal', 'seal', 'ability', 'Oathsworn Seal', 'oathsworn',
    { ability: { cost: 75, armored: 6, burst: { count: 14, proj: 'hammerlet', dmg: 220, range: 4, pierce: true }, mod: 'aftershock' } },
    'Two anvils: one for the oath, one for whoever breaks it.'),
  S('oathsworn_bulwark', 'heavy', 'armor', 'Oathsworn Bulwark', 'oathsworn', { bonus: { def: 28, hp: 80, vit: 4 } },
    'Forged to stand in a doorway forever.'),
  // Priest: The Choir of Dawn
  S('dawnchoir_wand', 'wand', 'weapon', 'Dawn-Choir Wand', 'dawnchoir',
    { weapon: { dmg: [95, 135], count: 1, arc: 0, range: 7, speed: 16, rate: 1.1, proj: 'pj_dawn', size: 0.45, pierce: true, special: { split: { n: 4, proj: 'pj_dawnray', f: 0.3, onEnd: true } } } },
    'Each bolt ends in a small sunrise.'),
  S('dawnchoir_halo', 'halo', 'ability', 'Dawn-Choir Halo', 'dawnchoir',
    { ability: { cost: 100, heal: 350, invuln: 2.5, burst: { count: 18, proj: 'lance', dmg: 170, range: 5.5, pierce: true }, mod: 'ignite' } },
    'Worn by the first voice of the morning hymn. Its pillar sets the wicked alight.'),
  S('dawnchoir_robe', 'robe', 'armor', 'Dawn-Choir Robe', 'dawnchoir', { bonus: { def: 16, mp: 120, wis: 8 } },
    'Still warm from the first light.'),
  // Summoner: The Gravewarden's Rite
  S('graverite_staff', 'staff', 'weapon', 'Gravewarden\'s Staff', 'graverite',
    { weapon: { dmg: [85, 120], count: 2, arc: 0.1, range: 6.5, speed: 11, rate: 1.0, proj: 'pj_bonelantern', size: 0.5, pierce: true, special: { split: { n: 3, proj: 'pj_bone', f: 0.3 } } } },
    'A thighbone topped with a lamp. Its bolts break into bones.'),
  S('graverite_reliquary', 'reliquary', 'ability', 'Gravewarden\'s Reliquary', 'graverite',
    { ability: { cost: 100, thralls: 5, life: 12, summon: 'thrall_knight', burst: { count: 1, proj: 'pj_thrall', dmg: 110, range: 6 }, mod: 'thrallburst' } },
    'The knights of the old watch, still on duty. They go out with a bang.'),
  S('graverite_shroud', 'robe', 'armor', 'Gravewarden\'s Shroud', 'graverite', { bonus: { def: 15, mp: 100, wis: 8 } },
    'Every thread was once a name.'),
  // Harpooner: The Leviathan Hunter
  S('leviathan_longbow', 'bow', 'weapon', 'Leviathan Longbow', 'leviathan',
    { weapon: { dmg: [90, 130], count: 3, arc: 0.2, range: 6.5, speed: 15, rate: 1.0, proj: 'pj_tine', size: 0.5, pierce: true, special: { slow: { f: 0.3, t: 1.5 } } } },
    'Strung with a whale\'s sinew. Its arrows drag at whatever they hit.'),
  S('leviathan_line', 'hookline', 'ability', 'Leviathan Line', 'leviathan',
    { ability: { cost: 80, armored: 3.5, burst: { count: 1, proj: 'hook', dmg: 520, range: 11 }, mod: 'reel3' } },
    'Built to land the big ones. Three at a time.'),
  S('leviathan_hide', 'leather', 'armor', 'Leviathan Hide', 'leviathan', { bonus: { def: 22, hp: 70, dex: 5 } },
    'Cut from the one that got away. It did not get away.'),
  // Duelist: The Glass Fencer
  S('glassfencer_dirk', 'dagger', 'weapon', 'Glass Fencer\'s Dirk', 'glassfencer',
    { weapon: { dmg: [70, 100], count: 1, arc: 0, range: 3.8, speed: 18, rate: 1.6, proj: 'pj_reflection', size: 0.45, pierce: true, special: { crit: { p: 0.2, x: 2.5 } } } },
    'Thin as a reflection. One in five thrusts finds the heart.'),
  S('glassfencer_mirror', 'mirror', 'ability', 'Glass Fencer\'s Mirror', 'glassfencer',
    { ability: { cost: 65, decoy: 4, burst: { count: 16, proj: 'pj_glass', dmg: 220, range: 6 }, mod: 'hall' } },
    'Step through and leave three fencers behind.'),
  S('glassfencer_jerkin', 'leather', 'armor', 'Glass Fencer\'s Jerkin', 'glassfencer', { bonus: { def: 20, dex: 8, spd: 5 } },
    'Silvered leather. Blows skate off it.'),
  // Stormwright: The Tempest Caller
  S('tempest_staff', 'staff', 'weapon', 'Tempest Caller\'s Staff', 'tempest',
    { weapon: { dmg: [80, 115], count: 2, arc: 0.12, range: 6.8, speed: 14, rate: 1.0, proj: 'pj_heavenwire', size: 0.45, pierce: true, special: { chain: { n: 2, f: 0.6 } } } },
    'Copper-shod and humming. The lightning jumps to whoever is nearest.'),
  S('tempest_kite', 'kite', 'ability', 'Tempest Caller\'s Kite', 'tempest',
    { ability: { cost: 90, life: 12, burst: { count: 1, proj: 'zap', dmg: 190, range: 6 }, mod: 'twinkite' } },
    'Two kites, one storm.'),
  S('tempest_robe', 'robe', 'armor', 'Tempest Caller\'s Robe', 'tempest', { bonus: { def: 16, mp: 110, att: 4 } },
    'It crackles when you raise your arms.'),
  // Clockmaker: The Clockwork Saint
  S('clockwork_wand', 'wand', 'weapon', 'Clockwork Saint\'s Wand', 'clockwork',
    { weapon: { dmg: [130, 180], count: 1, arc: 0, range: 7.5, speed: 4, rate: 0.95, proj: 'pj_eleventh', size: 0.5, special: { accel: 26, slow: { f: 0.35, t: 1.5 } } } },
    'Its bolts start slow and arrive on time. Whatever they hit loses a little of its own.'),
  S('clockwork_stopwatch', 'stopwatch', 'ability', 'Clockwork Saint\'s Stopwatch', 'clockwork',
    { ability: { cost: 105, stop: 4, burst: { count: 0, proj: 'none', dmg: 0, range: 8.5 }, mod: 'slowfield' } },
    'When it starts again, everything it stopped stays sluggish.'),
  S('clockwork_robe', 'robe', 'armor', 'Clockwork Saint\'s Robe', 'clockwork', { bonus: { def: 18, mp: 100, dex: 5 } },
    'A thousand tiny gears, all turning the same way.'),
];
for (const it of SET_ITEMS) add({ ...it, tier: 'UT', ut: true });

export const SETS = {
  pitfighter: { name: 'The Pit-Fighter\'s Panoply', 2: { bonus: { att: 5, vit: 5 } }, 3: { passive: { burnbonus: 0.2, momentum: 0.1 } } },
  oathsworn: { name: 'The Oathsworn Bulwark', 2: { bonus: { def: 6, hp: 60 } }, 3: { passive: { aegis: 6, kintsugi: 0.2 } } },
  dawnchoir: { name: 'The Choir of Dawn', 2: { bonus: { mp: 60, wis: 4 } }, 3: { passive: { lowregen: 30, aura: { dps: 30, r: 2.6, slow: 0 } } } },
  graverite: { name: 'The Gravewarden\'s Rite', 2: { bonus: { mp: 40, wis: 5 } }, 3: { passive: { killburst: 0.4, manaonkill: 6 } } },
  leviathan: { name: 'The Leviathan Hunter', 2: { bonus: { dex: 6 } }, 3: { passive: { slowbonus: 0.25, execute: 0.2 } } },
  glassfencer: { name: 'The Glass Fencer', 2: { bonus: { dex: 5, spd: 5 } }, 3: { passive: { crit: { p: 0.12, x: 2.5 }, critheal: 6 } } },
  tempest: { name: 'The Tempest Caller', 2: { bonus: { att: 5 } }, 3: { passive: { manaonhit: 2, prism: { every: 4, n: 8, dmg: 140, proj: 'pj_heavenwire' } } } },
  runewarden: { name: 'The Runewarden\'s Oath', 2: { bonus: { def: 5, att: 4 } }, 3: { passive: { kintsugi: 0.2, critheal: 5 } } },
  hexcircle: { name: 'The Hexweaver\'s Circle', 2: { bonus: { mp: 50, wis: 5 } }, 3: { passive: { manaonhit: 2, burnbonus: 0.2 } } },
  clockwork: { name: 'The Clockwork Saint', 2: { bonus: { dex: 5, wis: 5 } }, 3: { passive: { slowbonus: 0.3, dodge: 0.08 } } },
};
export const SET_PIECES = Object.fromEntries(Object.keys(SETS).map((k) => [k, SET_ITEMS.filter((it) => it.set === k).map((it) => it.id)]));

// mythic rings: they make other gear better
for (const r of [
  { id: 'the_conductors_band', name: 'The Conductor\'s Band', bonus: { att: 4, def: 4, dex: 4, wis: 4 }, passive: { setbonus: 1 },
    desc: 'It keeps every piece of a set in time. Counts as one more piece of each set you are wearing.' },
  { id: 'ring_of_the_first_flame', name: 'Ring of the First Flame', bonus: { att: 6, hp: 60 }, passive: { burnbonus: 0.3, emberthorns: 40 },
    desc: 'The fire that lit the forge of the gods. Anything already burning takes more from you.' },
  { id: 'ring_of_still_waters', name: 'Ring of Still Waters', bonus: { def: 6, mp: 60 }, passive: { slowbonus: 0.3, aura: { dps: 0, r: 3, slow: 0.3 } },
    desc: 'A drop of a lake that never moved. Everything near you slows, and the slowed take more damage.' },
  { id: 'band_of_the_open_hand', name: 'Band of the Open Hand', bonus: { dex: 8, spd: 4 }, passive: { crit: { p: 0.1, x: 2 }, critheal: 8 },
    desc: 'Strike true and be made whole. Critical hits heal you and restore mana.' },
]) add({ type: 'ring', slot: 'ring', tier: 'UT', ut: true, mythic: true, bag: 'starfall', ...r });

// the final boss's own prize
add({ id: 'crown_of_the_unstruck', type: 'ring', slot: 'ring', tier: 'UT', ut: true, mythic: true, bag: 'starfall', name: 'Crown of the Unstruck',
  bonus: { hp: 80, mp: 80, att: 6, def: 6, spd: 6, dex: 6, vit: 6, wis: 6 }, passive: { aegis: 5, kintsugi: 0.25 },
  desc: 'Small enough to wear on a finger now. Its wearer is struck less often, and hits back harder when they are.' });

// staves hit one target per bolt: no piercing, no arcing to others (relic staves included)
for (const it of Object.values(BASE_ITEMS)) {
  if (it.type !== 'staff' || !it.weapon) continue;
  it.weapon = { ...it.weapon, pierce: false };
  if (it.weapon.special) { const sp = { ...it.weapon.special }; delete sp.chain; it.weapon.special = sp; }
}

// ---- a story for every item: tiered gear gets a line about where its metal came from and a line about the
// family it belongs to. Relics, potions and odd things keep the descriptions written for them.
{
  const TALE = [
    'Scavenged from the wrack line of the Drowned Shore.',
    'Plain Nexus iron, hammered out by a smith who wanted to go home early.',
    'Pitted by salt and sea, but the edge has held.',
    'Dredged from the bogs of Ashfen. It still smells of peat.',
    'Cut with Runeholt runes that hum faintly in the cold.',
    'Forged over the ember-vents of Godfall, where the ground is always warm.',
    'Fused from Saltglass Dune glass, harder than any steel.',
    'Gilded by the penitents of Godfall, who could not stop polishing it.',
    'Hollowed by the Hollow Thanes. Something still echoes inside.',
    'Tempered in the Emberforge, a forge that has never once gone cold.',
    'A splinter of the god himself. It is warm, and it is listening.',
    'Woven from what the Unstruck God left behind. Nothing has ever pierced it.',
  ];
  const FAMILY = {
    sword: ['Heavy and honest: every swing is a promise.', 'Slow arcs, heavy cuts. Stand close and mean it.', 'Made for those who would rather be within arm\'s reach.'],
    dagger: ['Quick in the hand and quicker out of it.', 'Light enough to forget you are holding it, until you need it.', 'For fighters who strike first, and then again.'],
    bow: ['Three arrows to the draw, and every one goes through.', 'The string sings when it is drawn tight.', 'Keep your distance; let the arrows do the walking.'],
    staff: ['Its bolts leave the tip faster than thought.', 'Two bolts for every word of power.', 'Lean on it when you are tired. Point it when you are not.'],
    wand: ['It reaches further than any other weapon in the realm.', 'One bright bolt, sent a long, long way.', 'Light, precise, and much too easy to point at people.'],
    heavy: ['Plate for those who stand in front.', 'Heavy enough to stop most things, and most people.', 'It clanks a bit. It saves your life a lot.'],
    leather: ['Supple and quiet; it moves when you move.', 'Light armour for quick feet.', 'Stitched for speed, not for standing still.'],
    robe: ['Light cloth that keeps the mind clear and the mana flowing.', 'Embroidered with old charms against forgetting.', 'Not much use against swords. Very good against boredom.'],
  };
  const ABIL_TIER = ['A humble start: it works, mostly.', 'Iron-bound and dependable.', 'Bronze-fitted, a craftsman\'s piece.', 'Steel, and it shows.',
    'Verdigris-green with age, and with power.', 'Cobalt-bright. Only the best are made like this.'];
  const ABIL = {
    bellows: 'It breathes like a forge, and so will you.', seal: 'An oath pressed into metal heavy enough to crush whoever breaks it.',
    halo: 'A little circle of noon you can carry with you.', reliquary: 'Something inside is knocking. It wants to help.',
    hookline: 'The line never tangles and never lets go.', mirror: 'Your reflection is braver than you are.',
    kite: 'It only flies well in a storm, and it prefers to start one.', stopwatch: 'Wind it once and the whole world holds its breath.',
    runeward: 'Every rune cut into it is a word that means "no".', hex: 'The pages turn by themselves to the right curse.',
  };
  const RING_TIER = ['A tin band, bent by hand.', 'Iron, plain and honest.', 'Bronze, warm to the touch.', 'Steel, cold and certain.', 'Verdigris-green and very old.', 'Cobalt, blue as deep water.'];
  const RING = { hp: 'Its wearer is harder to kill, and knows it.', mp: 'It hums when your mana runs low, and fills it a little.', att: 'It makes every blow land a little heavier.',
    def: 'It turns a killing blow into a bruise, now and then.', spd: 'Your feet feel lighter the moment it slips on.', dex: 'Your hands move before you have decided to.',
    vit: 'Cuts close a little faster while you wear it.', wis: 'It remembers spells you have forgotten.' };
  for (const it of Object.values(BASE_ITEMS)) {
    if (it.desc || typeof it.tier !== 'number') continue;
    const t = it.tier;
    if (FAMILY[it.type]) it.desc = `${TALE[Math.min(t, TALE.length - 1)]} ${FAMILY[it.type][t % 3]}`;
    else if (ABIL[it.type]) it.desc = `${ABIL[it.type]} ${ABIL_TIER[Math.min(t, 5)]}`;
    else if (it.type === 'ring') { const st = it.id.split('_')[1]; it.desc = `${RING[st] || ''} ${RING_TIER[Math.min(t, 5)]}`.trim(); }
  }
}

// ---- no relic is just a bigger tiered item: every one gets its own twist, and some extra stats
{
  const BUFF = {
    tidecaller_blade: { bonus: { spd: 5, def: 4 }, special: { explode: { r: 1.3, f: 0.4 } } },
    emberbrand_greatsword: { bonus: { att: 5 }, special: { explode: { r: 1.5, f: 0.5 } } },
    staff_of_drowned_stars: { bonus: { wis: 5, mp: 40 }, special: { split: { n: 5, f: 0.35, proj: 'wisp_flame', onEnd: true } } },
    cinderwood_staff: { bonus: { att: 4, vit: 4 }, special: { burn: { dps: 90, t: 4 } }, passive: { burnbonus: 0.15 } },
    runeplate_armor: { passive: { aegis: 6 } },
    hexsilk_robe: { passive: { manaonhit: 2, aura: { dps: 0, r: 3, slow: 0.25 } } },
    ring_of_tides: { passive: { lowregen: 35 } },
    emberheart_ring: { passive: { burnbonus: 0.25, emberthorns: 50 } },
    runic_aegis: { bonus: { def: 6, att: 4 }, mod: 'wardfury' },
    grimoire_of_ash: { bonus: { att: 4, wis: 6 }, mod: 'ashcurse' },
    soul_lantern: { bonus: { wis: 6, mp: 40 }, mod: 'thrallburst' },
    colossus_core: { bonus: { att: 4, def: 4 }, mod: 'trail' },
    abbots_crozier: { bonus: { wis: 4 }, special: { split: { n: 4, f: 0.35, proj: 'bubble', onEnd: true } } },
    lantern_of_the_last_watch: { bonus: { mp: 50 }, special: { explode: { r: 1.2, f: 0.4 } } },
  };
  for (const [id, B] of Object.entries(BUFF)) {
    const it = BASE_ITEMS[id];
    if (!it) continue;
    if (B.bonus) { it.bonus = { ...(it.bonus || {}) }; for (const [k, v] of Object.entries(B.bonus)) it.bonus[k] = (it.bonus[k] || 0) + v; }
    if (B.special && it.weapon) it.weapon = { ...it.weapon, special: { ...(it.weapon.special || {}), ...B.special } };
    if (B.passive) it.passive = { ...(it.passive || {}), ...B.passive };
    if (B.mod && it.ability) it.ability = { ...it.ability, mod: B.mod };
  }
  Object.assign(MOD_TEXT, {
    wardfury: 'While your ward holds: +25% damage',
    ashcurse: 'Hexed enemies also burn for the whole curse (120/s)',
    wardnova: 'When the ward breaks, it bursts into a ring of rune-slashes, and you take no damage for a moment',
    contagion: 'When a hexed enemy dies, the hex leaps to everything near it',
  });
  // ---- mythics for the Runeblade and the Hexweaver
  for (const u of [
    { id: 'the_unbroken_oath', type: 'runeward', slot: 'ability', name: 'The Unbroken Oath',
      ability: { cost: 90, ward: 700, burst: { count: 18, proj: 'rune_slash', dmg: 260, range: 4.5, pierce: true }, mod: 'wardnova' }, bonus: { def: 8, hp: 60 },
      desc: 'An oath sworn on the god-anvil itself. When it is finally broken, everything near you pays for it.' },
    { id: 'oathbreaker', type: 'sword', slot: 'weapon', name: 'Oathbreaker',
      weapon: { dmg: [240, 320], count: 1, arc: 0, range: 3.3, speed: 10, rate: 1.05, proj: 'rune_slash', size: 0.6, pierce: true, special: { explode: { r: 1.6, f: 0.5 }, lifesteal: 0.04 } },
      bonus: { att: 6, spd: 4 }, desc: 'The runes on it spell a promise, backwards. Every cut drinks a little of what it takes.' },
    { id: 'the_thirteenth_page', type: 'hex', slot: 'ability', name: 'The Thirteenth Page',
      ability: { cost: 95, curse: { t: 8, f: 0.4, r: 3.8 }, burst: { count: 14, proj: 'hex_bolt', dmg: 210, range: 5 }, mod: 'contagion' }, bonus: { wis: 8, mp: 60 },
      desc: 'Twelve witches wrote the Grimoire of the Circle. The thirteenth page wrote itself.' },
    { id: 'the_witchs_eye', type: 'staff', slot: 'weapon', name: 'The Witch\'s Eye',
      weapon: { dmg: [120, 170], count: 2, arc: 0.12, range: 6.6, speed: 16, rate: 1.0, proj: 'hex_bolt', size: 0.5, special: { curse: { f: 0.15, t: 2.5 } } },
      bonus: { att: 4, wis: 5 }, desc: 'The orb on its tip is an eye, and it does not blink. Whatever it looks at is already cursed.' },
  ]) add({ bag: 'starfall', ...u, tier: 'UT', ut: true, mythic: true });
}

// the dungeons' own items: their names, their orbiters; and no item seeks (src/data/dungeon_items.js)
applyDungeonItems(ITEMS);
// the item rework, last of all: each special weapon's one hook (src/data/weapon_rework.js)
applyWeaponRework(ITEMS);
applyAbilityRework(ITEMS);
