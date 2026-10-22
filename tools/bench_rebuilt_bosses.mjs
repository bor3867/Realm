// How tough are the thirteen bosses rebuilt on the three-phase engine (2026-10-21/22), next to how they were before?
// For each: a level-20 priest in gear of the boss's tier fights it where it lives (its dungeon's boss room, or the realm).
//   kill:  always firing from 5 tiles, never hurt (god), playing its mechanic the simple way (in front of the Brine
//          Cathedral's doors, on a lens for Aurelia, at the nightmare while the Sleeper dreams): seconds to kill
//   idle:  4 tiles off, not dodging, not firing, 30 s: damage taken a second, and how long a full-Life player lasts
// Works on the old bosses too (run it in a checkout from before the rebuild for the baseline).
//   node tools/bench_rebuilt_bosses.mjs [boss ...]
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { REALM_BOSSES, DUNGEON_BOSSES } = await import('../src/data/enemies.js');
const { BX, bxEnemyDef } = await import('../src/bosses/index.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
// where it lives, and the gear tier a player meets it in (the realm's lands; a dungeon's chest tier)
const BOSSES = {
  drowned_abbot: ['chapel', 5], honey_queen: ['hive', 5], the_archivist: ['scriptorium', 9], the_puppeteer: ['theatre', 8],
  fallen_heart: ['heart', 12], prism_wyrm: ['spire', 10], the_sleeper: ['dream', 11],
  brine_cathedral: [null, 5], wick_mother: [null, 7], orrery_of_winter: [null, 10], emily_the_yapper: [null, 10], penitent_colossus: [null, 12], the_fallen_star: [null, 12],
};
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
function fresh(id, where, tier) {
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.persist = () => {}; const p = g.player; g.gainXp(999999);
  p.equip = [`wand_t${tier}`, p.equip[1], `robe_t${tier}`, `ring_hp_t${Math.min(3, Math.round(tier / 4))}`];
  let e;
  if (where) { g.enter(where); e = g.enemies.find((q) => q.D.bx === id || q.id === id); const A = e.room; p.x = A.x + A.w / 2; p.y = A.y + A.h - 3; }
  else { g.enter('realm'); g.enemies = g.map.enemies = []; e = BX[id] ? g.spawnRealmBoss(id, { x: p.x, y: p.y - 5 }, bxEnemyDef(id)) : g.spawnRealmBoss(id, { x: p.x, y: p.y - 5 }, REALM_BOSSES[id]); }
  g.maintainRealm = () => {}; g.eventClock = () => {};
  return { g, p, e };
}
// where the bench bot stands and what it shoots, by the boss's own rules
function brain(g, p, e) {
  let tx = e, sx = null, sy = null;
  if (e.cbFace !== undefined) { sx = e.x + Math.cos(e.cbFace) * 5; sy = e.y + Math.sin(e.cbFace) * 5; }      // the Cathedral: its doors
  if (e.D.bx === 'prism_wyrm') { const o = g.map.objects.find((q) => q.pedestal === Math.floor(g.t / 4) % 3); if (o) { sx = o.x; sy = o.y; } }   // a lens, a few seconds each
  if (e.slNight && !e.slNight.dead && e.slShiftUntil > g.t) tx = e.slNight;                                   // the Sleeper's nightmare-self
  if (e.arCopy && !e.arCopy.dead) tx = e;                                                                     // (never the Archivist's copy)
  if (e.lpUnder && e.lpUnder.some((u) => !u.dead)) tx = e.lpUnder.find((u) => !u.dead);                      // the Puppeteer's understudies
  if (e.hqBrood && e.hqBrood.length && e.hqWax) tx = e.hqBrood[0];                                           // the Royal Jelly: break the brood
  if (e.slAlarms && e.slAlarms.some((c) => !c.dead)) tx = e.slAlarms.find((c) => !c.dead);                   // the Sleeper's alarms
  if (e.abVerseOn && e.abBells) tx = e.abBells.find((b) => !b.abRung) || e;                                   // the Abbot's bells
  if (sx === null) { const a = Math.atan2(p.y - tx.y, p.x - tx.x) || Math.PI / 2; sx = tx.x + Math.cos(a) * 5; sy = tx.y + Math.sin(a) * 5; }
  return { tx, sx, sy };
}
const rows = [];
for (const [id, [where, tier]] of Object.entries(BOSSES)) {
  if (only.length && !only.includes(id)) continue;
  let { g, p, e } = fresh(id, where, tier);
  if (!e) { console.log(id, 'not found'); continue; }
  g.god = true; const I = g.input; I.scripted = true;
  let t = 0; const dt = 1 / 30, hp0 = e.maxHp || e.hp;
  for (; t < 900 && !e.dead && e.hp > 0; t += dt) {
    const B = brain(g, p, e); p.x = B.sx; p.y = B.sy; p.drowsy = 0; if (p.status) p.status.asleep = 0;   // (a real player keeps moving: the Sleeper's stillness)
    I.fire = true; I.aimX = B.tx.x; I.aimY = B.tx.y - 1; g.update(dt);
  }
  const kill = Math.round(t);
  ({ g, p, e } = fresh(id, where, tier));
  for (let s = 0; s < 3; s += dt) { p.x = e.x; p.y = e.y + 4; g.update(dt); }       // (wake it)
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
  rows.push({ id, where: where || 'realm', tier, hp: hp0, kill, dps: Math.round(dps), lasts: dps ? +(life / dps).toFixed(1) : Infinity, life: Math.round(life) });
}
console.log('boss'.padEnd(20) + 'where'.padEnd(13) + 'tier'.padEnd(6) + 'hp'.padEnd(9) + 'kill s'.padEnd(8) + 'idle dmg/s'.padEnd(12) + 'idle player lasts (s)');
for (const r of rows) console.log(r.id.padEnd(20) + r.where.padEnd(13) + String(r.tier).padEnd(6) + String(r.hp).padEnd(9) + String(r.kill).padEnd(8) + String(r.dps).padEnd(12) + `${r.lasts} (Life ${r.life})`);
