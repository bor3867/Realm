// Ability output, in the game itself: one cast at mid stats (ATT and WIS 45), the player at 30% Life, standing still,
// the cursor on a target. For every ability of a type (or the ids given): damage dealt over 8 s to one dummy and to a
// group of four round the cursor, and the Life it gives back (beyond natural regeneration) with the cursor 4.5 tiles
// away and 2 tiles away (some Halos heal only if you stand near their shape).
//   node tools/bench_abilities.mjs halo         (or ids)      --before: without the rework
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
if (process.argv.includes('--before')) globalThis.NO_ABILITY_REWORK = true;
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
const ids = args.length === 1 && !ITEMS[args[0]] ? Object.values(ITEMS).filter((it) => it.type === args[0] && it.slot === 'ability' && !it.admin).map((it) => it.id) : args;
const rank = (it) => (it.legendary ? 'Leg' : it.mythic ? 'Myth' : it.ut ? 'UT' : 'T' + it.tier);
function run(id, scene, d, cast = true) {
  RNG = 7; GR.seed(101);
  const it = ITEMS[id], cls = Object.keys(CLASSES).find((c) => CLASSES[c].ability === it.type);
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter(cls); g.persist = () => {};
  g.enter('realm'); g.enemies.length = 0;
  const p = g.player; p.base.att = 45; p.base.wis = 45; p.base.hp = 2000; p.equip[0] = null; p.equip[1] = id; p.equip[2] = null; p.equip[3] = null;   // (a deep Life pool: no heal cut off at full)
  p.x = Math.floor(p.x) + 0.5; p.y = Math.floor(p.y) + 0.5;
  const cx = p.x + d, cy = p.y;
  const spots = scene === 'group' ? [[0, 0], [1.1, 0], [0, -1.1], [0, 1.1]] : [[0, 0]];
  const dum = spots.map(([dx, dy]) => { const e = g.addEnemy('training_dummy', cx + dx, cy + dy); e.seen = true; return e; });
  let dealt = 0; const dmg0 = g.damageEnemy.bind(g);
  g.damageEnemy = (e, v, ...r) => { const got = dmg0(e, v, ...r); if (dum.includes(e)) dealt += got || 0; return got; };
  g.input = { ...(g.input || {}), fire: false, auto: false, aimX: cx, aimY: cy - 0.5 };
  p.mp = g.stat('mp'); p.hp = Math.round(g.stat('hp') * 0.3); p.abilityT = 0;
  const hp0 = p.hp;
  if (cast) g.useAbility();
  for (let f = 0; f < 8 * 60; f++) {
    for (const e of dum) e.hp = e.maxHp = 1e9;
    if (cast && f === 40 && p.sigil) g.useAbility();          // a UT's sigil: the second press, two thirds of a second later
    g.update(1 / 60);
  }
  return { dealt, healed: p.hp - hp0 };
}
const rows = [];
for (const id of ids) {
  const it = ITEMS[id];
  if (!it || !it.ability) { console.log(`no ability: ${id}`); continue; }
  const regen = run(id, 'one', 4.5, false).healed;
  const one = run(id, 'one', 4.5), grp = run(id, 'group', 4.5), near = run(id, 'one', 2);
  rows.push({ id, rank: rank(it), cost: it.ability.cost, one: one.dealt, group: grp.dealt, heal: one.healed - regen, healNear: near.healed - regen, kind: it.ability.halo ? it.ability.halo.kind : it.ability.mod || '' });
}
console.log(`${'ability'.padEnd(24)} ${'rank'.padEnd(5)} ${'shape'.padEnd(9)} MP   dmg(one)  dmg(4)  heal(4.5)  heal(2)`);
for (const r of rows.sort((a, b) => a.rank.localeCompare(b.rank) || b.group - a.group)) {
  console.log(`${r.id.padEnd(24)} ${r.rank.padEnd(5)} ${r.kind.padEnd(9)} ${String(r.cost).padEnd(4)} ${String(Math.round(r.one)).padStart(8)} ${String(Math.round(r.group)).padStart(7)} ${String(Math.round(r.heal)).padStart(10)} ${String(Math.round(r.healNear)).padStart(8)}`);
}
