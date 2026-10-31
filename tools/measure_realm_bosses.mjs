// Realm bosses as a player meets them (2026-10-31): each spawned in the realm the way the game spawns it (with the
// overworld tuning), its Life, and the blows it lands over 40 s on a player who stands and takes them: the median and
// the biggest single blow (after every multiplier, before Defense).
//   node tools/measure_realm_bosses.mjs [id ...]
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
let RNG = 5; Math.random = () => ((RNG = (RNG * 1103515245 + 12345) % 2147483648) / 2147483648);
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { REALM_BOSSES, ENEMIES } = await import('../src/data/enemies.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const only = process.argv.slice(2);
const heralds = Object.keys(ENEMIES).filter((k) => ENEMIES[k].herald);
const ids = only.length ? only : [...heralds, ...Object.keys(REALM_BOSSES), 'abyssal_kraken', 'thornheart_treant'];
for (const id of ids) {
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.persist = () => {}; g.enter('realm'); g.enemies = g.map.enemies = [];
  const p = g.player;
  let e;
  if (ENEMIES[id] && ENEMIES[id].herald) { e = g.addEnemy(id, p.x, p.y - 6); e.herald = true; }
  else if (/kraken|treant/.test(id)) e = g.spawnEventBoss(id, false);
  else e = g.spawnRealmBoss(id, { x: p.x, y: p.y - 7 });
  if (!e) { console.log(id, 'did not spawn'); continue; }
  if (e.home) { p.x = e.home.x; p.y = e.home.y + 5; }
  const blows = [];
  const hurt = g.hurtPlayer.bind(g); g.hurtPlayer = (d, by, ...r) => { if (by && typeof d === 'number') blows.push(Math.round(g.owDmg(d, by) * (r[0] ? 1 : g.enemyScale()))); return hurt(d, by, ...r); };
  e.seen = true;
  for (let f = 0; f < 60 * 40; f++) { p.hp = 1e9; p.dead = false; p.status.invuln = 0; e.hp = Math.max(e.hp, e.maxHp * (f < 1200 ? 0.6 : 0.2)); if (f === 1200) e.hp = e.maxHp * 0.2; g.update(1 / 60); }
  blows.sort((a, b) => a - b);
  const med = blows[Math.floor(blows.length / 2)] || 0, big = blows.at(-1) || 0;
  console.log(`${id.padEnd(22)} life ${String(e.maxHp).padStart(7)}  blows ${String(blows.length).padStart(4)}  median ${String(med).padStart(4)}  biggest ${String(big).padStart(4)}`);
}
