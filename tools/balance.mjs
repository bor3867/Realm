// Class balance bench (node tools/balance.mjs): every class at level 20 with matching-tier gear, damage per second
// against 25-defense targets at three ranges, with and without its ability, plus effective life.
import { Game } from '../src/game.js';
import { CLASSES, mitigate } from '../src/data/classes.js';
import { ITEMS } from '../src/data/items.js';
import { isSolid } from '../src/world/maps.js';
import { ENEMIES } from '../src/data/enemies.js';
ENEMIES.bench_dummy = { ...ENEMIES.armored_dummy, dummy: false, aggro: 0, attacks: [], loot: [], xp: 0 };
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const save = { fame: 0, gold: 0, essence: 0, vaults: [[], [], [], []], graveyard: [], chars: [], slots: 8, bestLevel: 0 };
const g = new Game({}, save);
const rows = [];
for (const cls of Object.keys(CLASSES)) {
  g.save.chars = []; g.newCharacter(cls); g.god = true; g.command('/maxlevel'); g.command('/tp realm');
  const C = CLASSES[cls], p = g.player;
  for (const k of Object.keys(p.base)) p.base[k] = Math.round((C.base[k] + C.max[k]) / 2 * 0.9);   // a typical level-20, half-maxed
  p.equip[0] = `${C.weapon}_t8`; p.equip[1] = `${C.ability}_t4`; p.equip[2] = `${C.armor}_t9`; p.equip[3] = null;
  g.maintainRealm = () => {}; g.eventClock = () => {}; g.updateQuirks = () => {};
  const res = { cls };
  const melee = C.weapon === 'sword' || C.weapon === 'dagger', home = melee ? 2.2 : 4.5;
  for (const [tag, D, n, useAb, fire] of [['close', 2.2, 1, false, true], ['mid', 4.5, 1, false, true], ['far', 7.5, 1, false, true], ['abOnly', home, 4, true, false], ['pack+ab', home, 4, true, true], ['solo+ab', home, 1, true, true]]) {
    g.enemies.length = 0; g.projectiles.length = 0; g.allies.length = 0; g.decoys.length = 0; g.fx.length = 0;
    // an open spot
    let ok = false;
    for (let k = 0; k < 500 && !ok; k++) { const x = 300 + k * 0.7, y = 480; ok = [0, 1, 2, 3, 4, 5, 6, 7, 8].every((d) => !isSolid(g.map, x + d, y) && !isSolid(g.map, x + d, y + 1) && !isSolid(g.map, x + d, y - 1)); if (ok) { p.x = x; p.y = y; } }
    const targets = [];
    for (let k = 0; k < n; k++) { const e = g.addEnemy('bench_dummy', p.x + D + (k % 2) * 0.9, p.y + (k - (n - 1) / 2) * 0.9); e.seen = true; targets.push(e); }
    let dealt = 0; const orig = g.damageEnemy.bind(g);
    g.damageEnemy = (e, dmg, ...a) => { const d = orig(e, dmg, ...a); if (targets.includes(e)) dealt += d || 0; return d; };
    const I = g.input; I.scripted = true; I.fire = fire; I.aimX = p.x + D; I.aimY = p.y;
    p.mp = 9999 * 0; p.mp = g.stat('mp');
    const T = 30;
    for (let i = 0; i < T * 60; i++) {
      I.aimX = targets[0].x; I.aimY = targets[0].y; if (!p.dash && Math.abs(p.x - (targets[0].x - D)) + Math.abs(p.y - targets[0].y) > 0.5 && i % 30 === 0) { p.x = targets[0].x - D; p.y = targets[0].y; }
      if (useAb && i % 6 === 0) g.useAbility();
      g.update(1 / 60);
    }
    g.damageEnemy = orig;
    res[tag] = Math.round(dealt / T);
  }
  const hp = g.stat('hp'), def = g.stat('def');
  res.hp = hp; res.def = def; res.vit = g.stat('vit'); res.spd = g.stat('spd');
  res.ehp60 = Math.round(hp / mitigate(60, def, false) * 60);      // raw 60-dmg bullets you can eat, as raw damage
  res.range = ITEMS[p.equip[0]].weapon ? ITEMS[p.equip[0]].weapon.range : '?';
  rows.push(res);
  delete g.maintainRealm; delete g.eventClock; delete g.updateQuirks;
  g.leaveToMenu && g.leaveToMenu();
}
console.table(rows);
