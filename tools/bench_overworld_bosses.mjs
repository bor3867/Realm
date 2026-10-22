// How tough are the overworld bosses (the four biome bosses, the two events, the Kraken and the Treant)?
// For each: a level-20 priest in that land's gear (its tier on the item ladders) fights it.
//   kill:  always firing from 5 tiles, never hurt (god): seconds to kill
//   idle:  standing 4 tiles off, not dodging, not firing, for 30 s: damage taken per second, and how long a full-Life
//          player who is not paying attention lasts (Life / that)
//   node tools/bench_overworld_bosses.mjs [boss ...]        --before: label only
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { BX, bxEnemyDef } = await import('../src/bosses/index.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const BOSSES = { brine_cathedral: 'shore', abyssal_kraken: 'shore', wick_mother: 'fen', thornheart_treant: 'thornwood', orrery_of_winter: 'runeholt', emily_the_yapper: 'runeholt', penitent_colossus: 'godfall', the_fallen_star: 'godfall' };
const TIER = { shore: 5, fen: 7, thornwood: 8, runeholt: 10, godfall: 12 };
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
function fresh(id, land) {
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.persist = () => {}; g.enter('realm'); g.enemies = g.map.enemies = [];
  const p = g.player; g.gainXp(999999); const t = TIER[land];
  p.equip = [`wand_t${t}`, p.equip[1], `robe_t${t}`, `ring_hp_t${Math.min(3, Math.round(t / 4))}`];
  const at = { x: p.x, y: p.y - 5 };
  const e = g.spawnRealmBoss(id, at, bxEnemyDef(id));
  return { g, p, e };
}
const rows = [];
for (const [id, land] of Object.entries(BOSSES)) {
  if (only.length && !only.includes(id)) continue;
  // kill
  let { g, p, e } = fresh(id, land);
  g.god = true; const I = g.input; I.scripted = true;
  let t = 0; const dt = 1 / 30;
  const hp0 = e.maxHp || e.hp;
  for (; t < 600 && !e.dead && e.hp > 0; t += dt) {
    const a = Math.atan2(p.y - e.y, p.x - e.x); p.x = e.x + Math.cos(a) * 5; p.y = e.y + Math.sin(a) * 5;
    if (isNaN(p.x)) { p.x = e.x; p.y = e.y + 5; }
    I.fire = true; I.aimX = e.x; I.aimY = e.y - 1; g.update(dt);
  }
  const kill = Math.round(t);
  // idle
  ({ g, p, e } = fresh(id, land));
  g.god = false; let taken = 0, last = p.hp; const life = g.stat('hp');
  for (let s = 0; s < 30; s += dt) {
    const a = Math.atan2(p.y - e.y, p.x - e.x) || Math.PI / 2; p.x = e.x + Math.cos(a) * 4; p.y = e.y + Math.sin(a) * 4;
    g.input.fire = false; g.update(dt);
    if (p.hp < last) taken += last - p.hp;
    if (p.dead) { p.dead = false; g.mode = 'play'; }
    if (p.hp < life * 0.5) p.hp = life;
    last = p.hp;
  }
  const dps = taken / 30;
  rows.push({ id, land, hp: hp0, kill, dps: Math.round(dps), lasts: dps ? +(life / dps).toFixed(1) : Infinity, life: Math.round(life) });
}
console.log('boss'.padEnd(22) + 'land'.padEnd(11) + 'hp'.padEnd(9) + 'kill s'.padEnd(8) + 'idle dmg/s'.padEnd(12) + 'idle player lasts (s)');
for (const r of rows) console.log(r.id.padEnd(22) + r.land.padEnd(11) + String(r.hp).padEnd(9) + String(r.kill).padEnd(8) + String(r.dps).padEnd(12) + `${r.lasts} (Life ${r.life})`);
