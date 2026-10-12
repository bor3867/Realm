// Weapon damage per second, in the game itself: a player at mid stats (ATT and DEX 45) holds fire for 20 s against
// still dummies, for every weapon of a type (or the ids given). Three scenes: one target at close range, a group of
// four (two in a line behind the first, two beside it), and one target at long range; at DEF 0 and DEF 25. The
// reworked weapons' timed blows (glyphs, phantoms, stars, marks) all count, since they run through the game.
//   node tools/bench_weapons.mjs sword            (or: node tools/bench_weapons.mjs id id ...)   --before: without the rework
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
if (process.argv.includes('--before')) globalThis.NO_WEAPON_REWORK = true;   // the weapons as they were before the rework
Date.now = () => 1.7e12;
let RNG = 7; Math.random = () => ((RNG = (RNG * 1103515245 + 12345) % 2147483648) / 2147483648);
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { ITEMS } = await import('../src/data/items.js');
const { CLASSES } = await import('../src/data/classes.js');
const { R: GR } = await import('../src/util.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const ids = args.length === 1 && !ITEMS[args[0]] ? Object.values(ITEMS).filter((it) => it.type === args[0] && it.slot === 'weapon' && !it.admin).map((it) => it.id) : args;
const rank = (it) => (it.legendary ? 'Leg' : it.mythic ? 'Myth' : it.ut ? 'UT' : 'T' + it.tier);
function run(id, scene, def) {
  RNG = 7; GR.seed(101);
  const it = ITEMS[id], cls = Object.keys(CLASSES).find((c) => CLASSES[c].weapon === it.type);
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter(cls); g.persist = () => {};
  g.enter('realm'); g.enemies.length = 0;
  const p = g.player; p.base.att = 45; p.base.dex = 45; p.equip[0] = id; p.equip[1] = null; p.equip[2] = null; p.equip[3] = null;
  p.y = Math.floor(p.y) + 0.5; p.x = Math.floor(p.x) + 0.5;
  const R0 = Math.min(it.weapon.range * 0.8, 2.6), at = scene === 'far' ? Math.max(2.6, it.weapon.range * 0.85) : R0;
  const spots = scene === 'group' ? [[at, 0], [at + 1.1, 0], [at, -1.1], [at, 1.1]] : [[at, 0]];
  const dum = spots.map(([dx, dy]) => { const e = g.addEnemy(def ? 'armored_dummy' : 'training_dummy', p.x + dx, p.y + dy); e.seen = true; return e; });
  let total = 0; const dmg0 = g.damageEnemy.bind(g);
  g.damageEnemy = (e, d, ...r) => { const got = dmg0(e, d, ...r); if (dum.includes(e)) total += got || 0; return got; };
  g.input = { ...(g.input || {}), fire: true, auto: false, aimX: dum[0].x, aimY: dum[0].y - 0.5 };
  for (let f = 0; f < 20 * 60; f++) {
    p.hp = 1e9; p.dead = false;
    for (const e of dum) { e.hp = e.maxHp = 1e9; e.x = e.x0 ?? (e.x0 = e.x); }
    g.update(1 / 60);
  }
  return total / 20;
}
const rows = [];
for (const id of ids) {
  const it = ITEMS[id];
  if (!it || !it.weapon) { console.log(`no weapon: ${id}`); continue; }
  rows.push({ id, rank: rank(it), one: run(id, 'one', 0), oneD: run(id, 'one', 25), group: run(id, 'group', 0), far: run(id, 'far', 0), range: it.weapon.range, mech: it.weapon.special && it.weapon.special.mech ? it.weapon.special.mech.kind : '' });
}
const top = rows.filter((r) => /^T(9|10)$/.test(r.rank)), ref = top.length ? top.reduce((a, r) => a + r.one, 0) / top.length : null;
console.log(`${'weapon'.padEnd(26)} ${'rank'.padEnd(5)} ${'mech'.padEnd(9)} range  one(DEF0) one(DEF25) group(4)  far    vs T9-10`);
for (const r of rows.sort((a, b) => a.rank.localeCompare(b.rank) || b.one - a.one)) {
  console.log(`${r.id.padEnd(26)} ${r.rank.padEnd(5)} ${r.mech.padEnd(9)} ${String(r.range).padEnd(6)} ${String(Math.round(r.one)).padStart(8)} ${String(Math.round(r.oneD)).padStart(10)} ${String(Math.round(r.group)).padStart(8)} ${String(Math.round(r.far)).padStart(6)}   ${ref ? Math.round((r.one / ref) * 100) + '%' : ''}`);
}
