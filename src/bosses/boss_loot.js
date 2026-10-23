// Every boss's loot, one way (the user's call, 2026-10-22: "I should get SOME drops from every kill"). A kill always
// drops a bag:
//   two pieces of tiered gear (a weapon and an armour, any class's) and a stat potion, guaranteed;
//   then every class's gear on its own small chance (each weapon, armour, ability and ring kind), so whatever you play
//   there is a fair chance at something of yours; a second stat potion, Life and Mana potions;
//   and the boss's own relics, by rarity, rare: an Untiered in about one kill in twelve, a Legendary one in 33, a
//   Mythic one in 100 (between all of that rarity it holds; before its loot luck). Anything else its table held (a
//   key, an egg) keeps its own chance.
// The tiers by the fight's difficulty: a dungeon boss by its dungeon's stars, an overworld boss by its land (today's
// tiers, the ladder).
import { DUNGEONS, DUNGEON_RATING } from '../data/enemies.js';
import { ITEMS, WEAPON_TYPES, ARMOR_TYPES, ABILITY_TYPES } from '../data/items.js';
import { STATS } from '../data/classes.js';

//              weapons/armour  abilities  rings
const BAND = {
  1: [[5, 7], [2, 3], [1, 2]],
  2: [[7, 9], [3, 4], [2, 3]],
  2.5: [[8, 10], [3, 4], [2, 3]],
  3: [[9, 11], [4, 5], [3, 4]],
  4: [[10, 12], [4, 5], [3, 4]],
  5: [[11, 13], [5, 6], [4, 5]],
};
const LAND = { brine_cathedral: 1, abyssal_kraken: 1, wick_mother: 2, thornheart_treant: 2.5, orrery_of_winter: 3, emily_the_yapper: 3, penitent_colossus: 4, the_fallen_star: 4 };
const PER_KILL = { ut: 0.08, legendary: 0.03, mythic: 0.01 };
const rarity = (it) => (!it ? null : it.mythic ? 'mythic' : it.legendary || it.rfRarity === 'legendary' ? 'legendary' : it.ut ? 'ut' : null);

export function bossLoot(old, band, luck = 1) {
  const [wa, ab, rg] = BAND[band], relics = { ut: [], legendary: [], mythic: [] }, other = [];
  for (const l of old) {
    if (!l.id || /^(pot_|stat_)/.test(l.id)) continue;
    const r = rarity(ITEMS[l.id]);
    if (r) { if (!relics[r].includes(l.id)) relics[r].push(l.id); } else other.push(l);
  }
  const x = (p) => +(p / luck).toFixed(4);
  const rel = Object.entries(relics).flatMap(([r, ids]) => ids.map((id) => ({ id, p: +(PER_KILL[r] / ids.length / luck).toFixed(5) })));
  return [
    ...rel,                                                    // (first: a bag holds eight, and a relic is the prize)
    { slot: 'weapon', tiers: wa, p: 1, ladder: true }, { slot: 'armor', tiers: wa, p: 1, ladder: true }, { stat: true, p: 1 },
    ...WEAPON_TYPES.map((type) => ({ type, slot: 'weapon', tiers: wa, p: x(0.08), ladder: true })),   // (about 1.7 more pieces a kill, whatever its luck)
    ...ARMOR_TYPES.map((type) => ({ type, slot: 'armor', tiers: wa, p: x(0.12), ladder: true })),
    ...ABILITY_TYPES.map((type) => ({ type, slot: 'ability', tiers: ab, p: x(0.05), ladder: true })),
    ...STATS.map((stat) => ({ ring: stat, slot: 'ring', tiers: rg, p: x(0.05), ladder: true })),
    ...other,
    { id: 'pot_hp', p: 0.8 }, { id: 'pot_mp', p: 0.8 }, { stat: true, p: 0.5 },
  ];
}
// rebuild every three-phase boss's table in place (whether it lives in REALM_BOSSES, DUNGEON_BOSSES or its own file)
export function applyBossLoot(BX) {
  for (const [id, B] of Object.entries(BX)) {
    if (id === 'framework_test' || !Array.isArray(B.loot)) continue;
    const dg = Object.keys(DUNGEONS).find((k) => DUNGEONS[k].boss === id);
    const band = dg ? Math.max(1, Math.min(5, (DUNGEON_RATING[dg] || [3])[0])) : LAND[id] || 3;
    const next = bossLoot(B.loot, band, B.lootLuck || 1);
    B.loot.splice(0, B.loot.length, ...next);
  }
}
