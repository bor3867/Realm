// The Realm Update's three-phase bosses: one file each (docs/design/boss_<key>.md), run by src/bossx.js.
// A boss file exports { id, art, name, hp, def, xp, r, speed, keep, faces, phases{1..3:{move, patterns}},
// specials, moves, update, onPhase, onWake, onDeath, immune, draw, loot, shotSheet }.
import framework_test from './framework_test.js';
import abyssal_kraken from './abyssal_kraken.js';
import thornheart_treant from './thornheart_treant.js';
import glacius_frozen_wyrm from './glacius_frozen_wyrm.js';
import mother_mycelia from './mother_mycelia.js';

export const BX = { framework_test, abyssal_kraken, thornheart_treant, glacius_frozen_wyrm, mother_mycelia };

// the enemy definition the rest of the game sees (spawnRealmBoss, loot, the boss bar)
export function bxEnemyDef(id) {
  const B = BX[id];
  return { name: B.name, biome: B.biome || 'dungeon', hp: B.hp, def: B.def || 0, xp: B.xp || 1000, r: B.r || 1.6, speed: B.speed || 1.2,
    keep: B.keep || 6, aggro: 30, bx: id, phases: [{ at: 1, cycle: [] }], moves: {}, loot: B.loot || [], lootLuck: B.lootLuck || 1 };
}
