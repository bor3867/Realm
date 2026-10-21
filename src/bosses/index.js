// The Realm Update's three-phase bosses: one file each (docs/design/boss_<key>.md), run by src/bossx.js.
// A boss file exports { id, art, name, hp, def, xp, r, speed, keep, faces, phases{1..3:{move, patterns}},
// specials, moves, update, onPhase, onWake, onDeath, immune, draw, loot, shotSheet }.
import framework_test from './framework_test.js';
import abyssal_kraken from './abyssal_kraken.js';
import thornheart_treant from './thornheart_treant.js';
import glacius_frozen_wyrm from './glacius_frozen_wyrm.js';
import mother_mycelia from './mother_mycelia.js';
import grand_orrery from './grand_orrery.js';
import gilded_sphinx from './gilded_sphinx.js';
import count_vesper from './count_vesper.js';
import grinning_ringmaster from './grinning_ringmaster.js';
import tidebound_lich from './tidebound_lich.js';
import forgeheart_colossus from './forgeheart_colossus.js';
import unstruck_god from './unstruck_god.js';
import unstruck_smith from './unstruck_smith.js';

export const BX = { framework_test, abyssal_kraken, thornheart_treant, glacius_frozen_wyrm, mother_mycelia, grand_orrery, gilded_sphinx, count_vesper, grinning_ringmaster,
  tidebound_lich, forgeheart_colossus, unstruck_god, unstruck_smith };

// the enemy definition the rest of the game sees (spawnRealmBoss, loot, the boss bar)
export function bxEnemyDef(id) {
  const B = BX[id];
  return { name: B.name, biome: B.biome || 'dungeon', hp: B.hp, def: B.def || 0, xp: B.xp || 1000, r: B.r || 1.6, speed: B.speed || 1.2,
    keep: B.keep || 6, aggro: 30, bx: id, phases: [{ at: 1, cycle: [] }], moves: {}, loot: B.loot || [], lootLuck: B.lootLuck || 1 };
}
