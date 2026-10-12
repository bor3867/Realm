// The projectile lifecycle, for every enemy that shoots: no shots fired after it dies, none of its shots left hanging
// in the air once it is dead, and no shot of anyone's that lives for ever. Each one fights a while (it is hit
// steadily so bosses move through their patterns), then dies in the middle of whatever it is doing, and we watch for
// 15 s. A boss's death burst marked harmless is design, not a leak; so are the shards of a mortar or splitting shot fired before it died. (The Grand Orrery is left out by request.)
//   node tools/check_shot_lifecycle.mjs [id ...]      --verbose to print every enemy, not only the problems
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
let RNG = 7; Math.random = () => ((RNG = (RNG * 1103515245 + 12345) % 2147483648) / 2147483648);
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { BX } = await import('../src/bosses/index.js');
const { ENEMIES } = await import('../src/data/enemies.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const SKIP = new Set(['grand_orrery']);
const only = process.argv.slice(2).filter((a) => !a.startsWith('--')), verbose = process.argv.includes('--verbose');
const fresh = () => { const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 }); g.newCharacter('priest'); g.persist = () => {}; g.god = false; const hurt = g.hurtPlayer.bind(g); g.hurts = []; g.hurtPlayer = (d, by, x) => { g.hurts.push(by); return hurt(d, by, x); }; return g; };
const results = [];
function watch(g, e, owns, fightFor, kill) {
  const p = g.player, born = new WeakMap(), oldest = { age: 0, sprite: '' };
  let t = 0;
  const step = () => {
    t += 1 / 60; p.hp = 1e9; p.dead = false;
    if (g.enemies.length > 1 || g.enemies[0] !== e) g.enemies = g.map.enemies = g.enemies.filter((q) => q === e);   // just the one (the realm keeps spawning)
    p.x = e.x + Math.cos(t * 0.6) * 6; p.y = e.y + Math.sin(t * 0.6) * 5; p.moving = true;
    g.update(1 / 60);
    for (const b of g.projectiles) if (b.from === 'e') { if (!born.has(b)) born.set(b, t); const a = t - born.get(b); if (a > oldest.age) { oldest.age = a; oldest.sprite = b.sprite; } }
  };
  for (let f = 0; f < fightFor * 60; f++) { step(); if (f % 12 === 0 && e.bx && !['death', 'morph', 'finale'].includes(e.bx.state)) g.damageEnemy(e, Math.round(e.maxHp / 160), e.x, e.y, true); }
  const atDeath = new Set(g.projectiles.filter((b) => owns(b)));
  kill();
  const deathT = t; let after = 0, hazard = 0; const afterNames = new Set();
  for (let f = 0; f < 15 * 60; f++) {
    const had = g.projectiles.some((b) => owns(b) && !b.harmless);   // (a shot that hits you is gone the same frame)
    g.hurts.length = 0; step();
    if (g.hurts.includes(e.D.name) && !had && !g.projectiles.some((b) => owns(b) && !b.harmless)) hazard++;   // hurt by it, with none of its shots in the air: a lingering hazard
    for (const b of g.projectiles) if (owns(b) && !atDeath.has(b) && !b.harmless && !b.shard && born.get(b) > deathT + 0.25 && !b.counted) { b.counted = true; after++; afterNames.add(b.sprite); }
  }
  const left = g.projectiles.filter((b) => owns(b) && !b.harmless);
  return { fired: atDeath.size, after, afterNames: [...afterNames], left: left.length, leftNames: [...new Set(left.map((b) => b.sprite))], hazard, oldest: Math.round(oldest.age), oldestSprite: oldest.sprite };
}
// the modular bosses
for (const id of Object.keys(BX)) {
  if (SKIP.has(id) || (only.length && !only.includes(id))) continue;
  const g = fresh(); g.enter(BX[id].map || 'realm'); g.enemies.length = 0; g.command(`/bx ${id}`);
  const e = g.enemies.find((q) => q.D.bx === id);
  if (!e) { results.push({ id, kind: 'boss', note: 'did not spawn' }); continue; }
  const r = watch(g, e, (b) => b.bxOf === e || (b.from === 'e' && b.by === e.D.name), 9 + Math.random() * 6, () => g.bxDie(e));
  results.push({ id, kind: 'boss', ...r });
}
// every other enemy that has attacks
for (const [id, D] of Object.entries(ENEMIES)) {
  if (D.bx || D.dummy || !(D.attacks && D.attacks.length) || (only.length && !only.includes(id))) continue;
  const g = fresh(); g.enter('realm'); g.enemies.length = 0;
  const p = g.player, e = g.addEnemy(id, p.x + 5, p.y);
  if (!e) { results.push({ id, kind: 'enemy', note: 'did not spawn' }); continue; }
  e.seen = true;
  const r = watch(g, e, (b) => b.from === 'e' && b.by === D.name && !g.enemies.some((q) => q !== e && !q.dead && q.D.name === D.name), 5 + Math.random() * 4, () => { e.bulwarkT = 0; e.invulnT = 0; e.wardT = 0; for (let k = 0; k < 5 && !e.dead; k++) g.damageEnemy(e, e.hp + 1e7, e.x, e.y, true); });   // (dead for sure: a shield up at that moment, like the reef golem's bulwark, would turn the blow)
  results.push({ id, kind: D.elite ? 'elite' : 'enemy', ...r });
}
const bad = results.filter((r) => r.note || r.after > 0 || r.left > 0 || r.oldest > 25 || r.hazard > 0);
for (const r of verbose ? results : bad) {
  const why = r.note ? r.note : [r.after ? `${r.after} shots fired after death (${r.afterNames.join(', ')})` : '', r.left ? `${r.left} of its shots still there 15 s after death (${r.leftNames.join(', ')})` : '', r.oldest > 25 ? `a shot lived ${r.oldest} s (${r.oldestSprite})` : '', r.hazard ? `hurt you ${r.hazard} times after death with none of its shots left` : ''].filter(Boolean).join('; ');
  console.log(`${r.kind.padEnd(5)} ${r.id.padEnd(24)} ${why || `ok (${r.fired} shots in the air when it died)`}`);
}
console.log(`${results.length} shooters checked (${results.filter((r) => r.kind === 'boss').length} bosses); ${bad.length} with lifecycle problems`);
process.exit(bad.length ? 1 : 0);
