// How big is one boss hit, against the Life of a player geared for that fight? (2026-10-22: after every enemy began
// to hit 1.5x.) Each three-phase boss fights where it lives (its dungeon's boss room, or the realm in its land) a
// level-20 priest in gear of that fight's tier, who stands still 4 tiles off for 25 s, through all three phases
// (its Life is set to each third in turn). Per boss: hits, the median and the biggest hit as a share of the player's
// Life, and the damage a second.
//   node tools/bench_boss_hits.mjs [boss ...]
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { DUNGEONS, DUNGEON_RATING } = await import('../src/data/enemies.js');
const { BX, bxEnemyDef } = await import('../src/bosses/index.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const LAND = { brine_cathedral: 'shore', abyssal_kraken: 'shore', wick_mother: 'fen', thornheart_treant: 'thornwood', orrery_of_winter: 'runeholt', emily_the_yapper: 'runeholt', penitent_colossus: 'godfall', the_fallen_star: 'godfall' };
const LAND_TIER = { shore: 5, fen: 7, thornwood: 8, runeholt: 10, godfall: 12 }, STAR_TIER = { 1: 5, 2: 7, 3: 9, 4: 11, 5: 12 };
const only = process.argv.slice(2);
const rows = [];
for (const id of Object.keys(BX)) {
  if (id === 'framework_test' || (only.length && !only.includes(id))) continue;
  const dg = Object.keys(DUNGEONS).find((k) => DUNGEONS[k].boss === id), tier = dg ? STAR_TIER[(DUNGEON_RATING[dg] || [3])[0]] : LAND_TIER[LAND[id]] || 10;
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.persist = () => {}; g.gainXp(999999);
  const p = g.player; p.equip = [`wand_t${tier}`, p.equip[1], `robe_t${tier}`, `ring_hp_t${Math.min(3, Math.round(tier / 4))}`];
  if (process.env.MAXED) { const { CLASSES } = await import('../src/data/classes.js'); p.base = { ...CLASSES.priest.max }; p.equip = ['wand_t13', p.equip[1], 'robe_t13', 'ring_def_t4']; }   // MAXED=1: every stat maxed, the best gear (can it simply be tanked?)
  let e;
  try {
    if (dg) { g.enter(dg); e = g.enemies.find((q) => q.D.bx === id); const A = e.room; p.x = A.x + A.w / 2; p.y = A.y + A.h - 3; }
    else { g.enter('realm'); g.enemies = g.map.enemies = []; e = g.spawnRealmBoss(id, { x: p.x, y: p.y - 5 }, bxEnemyDef(id)); }
  } catch (err) { console.log(id, 'could not be set up:', err.message); continue; }
  if (!e) { console.log(id, 'not found'); continue; }
  g.maintainRealm = () => {}; g.eventClock = () => {};
  const life = g.stat('hp'), hits = [];
  const h0 = g.hurtPlayer.bind(g);
  g.hurtPlayer = function (d, by, ap) { const hp = p.hp; h0(d, by, ap); if (hp - p.hp > 0) { hits.push(hp - p.hp); if (process.env.WHO && hp - p.hp > life * 0.4) console.log("  big:", by, Math.round(d), "->", Math.round(hp - p.hp)); } };
  for (let s = 0; s < 3; s += 1 / 30) { p.x = e.x; p.y = e.y + 4; p.hp = life; g.update(1 / 30); }   // (wake it)
  const x0 = e.x, y0 = e.y + 4;
  try {
    for (const frac of [0.9, 0.55, 0.22]) {
      if (e.bx && !e.dead) e.hp = Math.min(e.hp, Math.round(e.maxHp * frac));
      for (let t = 0; t < 25 / 3; t += 1 / 30) { p.x = x0; p.y = y0; p.dead = false; p.status.invuln = 0; g.mode = 'play'; if (p.hp < life * 0.5) p.hp = life; g.update(1 / 30); }
    }
  } catch (err) { console.log(id, 'threw', err.message); }
  hits.sort((a, b) => a - b);
  const med = hits.length ? hits[Math.floor(hits.length / 2)] : 0, max = hits.length ? hits[hits.length - 1] : 0, dps = hits.reduce((s, x) => s + x, 0) / 25;
  rows.push({ id, where: dg || LAND[id], tier, life: Math.round(life), n: hits.length, med: Math.round(med), max: Math.round(max), medP: (100 * med) / life, maxP: (100 * max) / life, dps: Math.round(dps) });
}
console.log('boss'.padEnd(22) + 'where'.padEnd(13) + 'tier  Life  hits  median hit      biggest hit     dmg/s  (standing still: dies in)');
for (const r of rows) console.log(`${r.id.padEnd(22)}${String(r.where).padEnd(13)}${String(r.tier).padStart(4)}${String(r.life).padStart(6)}${String(r.n).padStart(6)}  ${String(r.med).padStart(5)} (${r.medP.toFixed(0).padStart(2)}%)    ${String(r.max).padStart(5)} (${r.maxP.toFixed(0).padStart(3)}%)   ${String(r.dps).padStart(5)}  ${r.dps ? (r.life / r.dps).toFixed(1) + 's' : '-'}`);
