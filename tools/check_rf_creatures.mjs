// Every Realmforge creature translated to our engine (src/rf/creatures.js) lives, moves, attacks, and hurts a player near it.
//   node tools/check_rf_creatures.mjs
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const ROOT = new URL('../', import.meta.url).href;
const { buildRegistry } = await import(ROOT + 'src/registry.js');
const { Game } = await import(ROOT + 'src/game.js');
const { ENEMIES } = await import(ROOT + 'src/data/enemies.js');
const { translateAll } = await import(ROOT + 'src/rf/creatures.js');
const B0 = new URL('art/bundle/', ROOT), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const DATA = JSON.parse(readFileSync(new URL('art/rf/data.json', ROOT), 'utf8'));
const { defs } = translateAll(DATA);
for (const [id, D] of Object.entries(defs)) ENEMIES[id] = { ...D, id };
const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
g.newCharacter('priest'); g.persist = () => {}; g.gainXp(999999); g.enter('realm'); g.maintainRealm = () => {}; g.eventClock = () => {};
const p = g.player, cx = p.x, cy = p.y;
const rows = { ok: 0, idle: [], harmless: [], errors: [] };
for (const id of Object.keys(defs)) {
  g.enemies = g.map.enemies = []; g.projectiles = []; g.fx = [];
  p.x = cx; p.y = cy; p.hp = g.stat('hp'); p.dead = false; p.status.invuln = 0;
  let hurt = 0; const h0 = g.hurtPlayer.bind(g); g.hurtPlayer = (d, by, ig) => { const b = p.hp; h0(d, by, ig); hurt += Math.max(0, b - p.hp); p.hp = g.stat('hp'); };
  let e;
  try {
    e = g.addEnemy(id, cx + 3.5, cy); e.seen = true; e.aggro = true; const x0 = e.x, y0 = e.y; let shots = 0, moved = 0;
    for (let t = 0; t < 12; t += 1 / 30) { g.update(1 / 30); shots = Math.max(shots, g.projectiles.filter((b) => b.from === 'e').length + g.fx.filter((f) => f.kind === 'zone' || f.kind === 'pool').length); moved = Math.max(moved, Math.hypot(e.x - x0, e.y - y0)); }
    if (!hurt) (defs[id].attacks.length || defs[id].contact ? rows.harmless : rows.idle).push(`${id}(${defs[id].ai}${defs[id].attacks.map((a) => ' ' + a.pattern).join('')}${defs[id].contact ? ' contact' : ''} moved ${moved.toFixed(1)} shots ${shots})`);
    else rows.ok++;
  } catch (err) { rows.errors.push(`${id}: ${err.message}`); }
  g.hurtPlayer = h0;
}
console.log('hurt the player:', rows.ok, '/', Object.keys(defs).length);
console.log('errors:', rows.errors.length, rows.errors.slice(0, 5).join(' | '));
console.log('never hurt (have attacks):', rows.harmless.length, rows.harmless.slice(0, 30).join(' '));
console.log('no attacks at all:', rows.idle.length, rows.idle.join(' '));
