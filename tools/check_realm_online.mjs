// The shared realm, on the server's own world (server/world.mjs), as players come and go (2026-10-31):
//   1. party Life: a realm boss with one player near it, then four, then one again (it grows +50% a player beyond the
//      first within 20 tiles, and shrinks back 15 s after they leave, its share of Life kept)
//   2. the realm stays: everyone leaves for a while and comes back; its bosses are still there, as hurt as they were
//   node tools/check_realm_online.mjs
import { fileURLToPath } from 'node:url';
process.chdir(fileURLToPath(new URL('../server/', import.meta.url)));
const { makeWorld } = await import('../server/world.mjs');
const { bxEnemyDef } = await import('../src/bosses/index.js');

const W = await makeWorld(1, () => {}, 'realm'), g = W._g;
let clock = Date.now();
const tick = (s) => { for (let t = 0; t < s; t += 0.1) W.tick(0.1, (clock += 100)); };
W.join('p1', 'One', true);
g.enemies = g.map.enemies = [];
const a = g.player, e = g.spawnRealmBoss('abyssal_kraken', { x: a.x, y: a.y - 6 }, bxEnemyDef('abyssal_kraken'));
const at = (id, dx) => W.player(id, { x: e.x + dx, y: e.y + 5, dead: false, hp: 700 });
const fails = [];
const say = (label, ok, txt) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}: ${txt}`); if (!ok) fails.push(label); };

at('p1', 0); tick(1);
const base = e.maxHp;
for (let t = 0; t < 20; t += 0.1) { W.hit('p1', e.nid, 600); tick(0.1); }   // (blows a player could deal: server/guard.mjs)
const share0 = e.hp / e.maxHp;
for (const id of ['p2', 'p3', 'p4']) { W.join(id, id, false); at(id, 1); }
tick(1.5);
say('four players', e.maxHp === Math.round(base * 2.5), `${base} -> ${e.maxHp} (x${(e.maxHp / base).toFixed(2)}), Life share ${share0.toFixed(2)} -> ${(e.hp / e.maxHp).toFixed(2)}`);
for (const id of ['p2', 'p3', 'p4']) W.leave(id);
tick(5);
say('three leave: held for 15s', e.maxHp === Math.round(base * 2.5), `after 5s still ${e.maxHp}`);
tick(12);
say('three leave: back after 15s', e.maxHp === base, `after 17s ${e.maxHp}, Life share ${(e.hp / e.maxHp).toFixed(2)}`);

const hp1 = e.hp, nid = e.nid;
W.leave('p1');
clock += 10 * 60 * 1000;                                       // (ten minutes with nobody there: the world doesn't tick)
W.join('p1', 'One', true); at('p1', 0); tick(1);
const still = g.enemies.find((q) => q.nid === nid && !q.dead);
say('realm stays', !!still && Math.abs(still.hp - hp1) / hp1 < 0.05, still ? `the Kraken still there after ten empty minutes, Life ${hp1} -> ${still.hp}` : 'the Kraken is gone');
process.exit(fails.length ? 1 : 0);
