// The overworld bosses' loot (the user's call, 2026-10-22): RotMG's way, every class's tiered gear in the boss's own
// band, each piece on its own small chance, so whatever you play there is a fair chance at something of yours; the
// boss's own relics (whatever its table held: its uniques and the class set pieces it guards) each on a small chance,
// about one relic in four kills between them; and its potions. Bands by the boss's land, in today's tiers (ladder).
import { REALM_BOSSES } from '../data/enemies.js';
import { WEAPON_TYPES, ARMOR_TYPES, ABILITY_TYPES } from '../data/items.js';
import { STATS } from '../data/classes.js';

//            weapons/armour  abilities  rings
const BAND = {
  shore: [[5, 7], [2, 3], [1, 2]],
  fen: [[7, 9], [3, 4], [2, 3]],
  thornwood: [[8, 10], [3, 4], [2, 3]],
  runeholt: [[9, 11], [4, 5], [3, 4]],
  godfall: [[10, 12], [4, 5], [3, 4]],
};
const LAND = { brine_cathedral: 'shore', abyssal_kraken: 'shore', wick_mother: 'fen', thornheart_treant: 'thornwood', orrery_of_winter: 'runeholt', emily_the_yapper: 'runeholt', penitent_colossus: 'godfall', the_fallen_star: 'godfall' };
const RELICS_PER_KILL = 0.25;                              // (between all of a boss's relics, before its loot luck)

export function overworldLoot(old, land, luck = 1) {
  const [wa, ab, rg] = BAND[land], relics = [...new Set(old.filter((l) => l.id && !/^(pot_|stat_)/.test(l.id)).map((l) => l.id))];
  const each = Math.max(0.004, RELICS_PER_KILL / Math.max(1, relics.length) / luck);
  return [
    ...relics.map((id) => ({ id, p: +each.toFixed(4) })),          // (first: a bag holds eight, and a relic is the prize)
    ...WEAPON_TYPES.map((type) => ({ type, slot: 'weapon', tiers: wa, p: 0.12, ladder: true })),
    ...ARMOR_TYPES.map((type) => ({ type, slot: 'armor', tiers: wa, p: 0.2, ladder: true })),
    ...ABILITY_TYPES.map((type) => ({ type, slot: 'ability', tiers: ab, p: 0.06, ladder: true })),
    ...STATS.map((stat) => ({ ring: stat, slot: 'ring', tiers: rg, p: 0.06, ladder: true })),
    { stat: true, p: 1 }, { stat: true, p: 0.5 }, { id: 'pot_hp', p: 0.6 }, { id: 'pot_mp', p: 0.6 },
  ];
}
// rebuild them in place (the realm bosses' tables live in REALM_BOSSES, the event bosses' in their own files)
export function applyOverworldLoot(BX) {
  for (const [id, land] of Object.entries(LAND)) {
    const B = BX[id], arr = REALM_BOSSES[id] ? REALM_BOSSES[id].loot : B && B.loot;
    if (!arr) continue;
    const next = overworldLoot(arr, land, (B && B.lootLuck) || 1);
    arr.splice(0, arr.length, ...next);
  }
}
