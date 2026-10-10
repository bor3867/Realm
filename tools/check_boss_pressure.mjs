// How hard is each three-phase boss? (docs/design/08_boss_rework.md)
// For every boss and phase: shots fired per second, and the damage a simple dodging bot takes per minute.
// The bot steps away from the nearest shot coming at it and otherwise circles at the boss's distance; it is no
// player, but it's the same bot for every boss, so the numbers compare. The hardest three must come out on top,
// and each finale must turn its boss immune, run, and leave it broken.
//   node tools/check_boss_pressure.mjs [--json] [boss ...]
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { BX } = await import('../src/bosses/index.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const WHERE = { glacius_frozen_wyrm: 'frostveil', mother_mycelia: 'mirerot', grand_orrery: 'astral', gilded_sphinx: 'sandscour', count_vesper: 'keep',
  grinning_ringmaster: 'hollowmoon', tidebound_lich: 'crypt', forgeheart_colossus: 'ember', abyssal_kraken: 'event', thornheart_treant: 'event' };
const HARDEST = ['glacius_frozen_wyrm', 'grand_orrery', 'forgeheart_colossus'];
const args = process.argv.slice(2), asJson = args.includes('--json'), only = args.filter((a) => !a.startsWith('--'));
const SECS = 40;
let fail = 0;
const out = {};

const live = (g) => { g.player.hp = 1e6; g.player.dead = false; g.update(1 / 60); };   // the test player never dies
function setup(id) {
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.persist = () => {};
  let e;
  if (WHERE[id] === 'event') { g.enter('realm'); g.enemies = g.map.enemies = []; e = g.spawnEventBoss(id, false); g.player.x = e.home.x; g.player.y = e.home.y + 5; }
  else {                                                   // into the boss's own room (not always the last room: Frostveil's lake isn't)
    g.enter(WHERE[id]);
    const A = g.map.rooms.find((n) => n.boss) || g.map.rooms.at(-1); g.player.x = A.x + A.w / 2; g.player.y = A.y + A.h - 5;
  }
  for (let k = 0; k < 400 && !(e && e.bx && e.bx.state === 'fight'); k++) { live(g); e = e || g.enemies.find((q) => q.bx); }
  return { g, e };
}
// the bot: dodge the nearest shot heading at it, else circle at the boss's range
function bot(g, e, t) {
  const p = g.player, I = g.input;
  let best = null, bd = 2.6;
  for (const b of g.projectiles) {
    if (b.from !== 'e') continue;
    const d = Math.hypot(b.x - p.x, b.y - p.y);
    if (d < bd && (b.vx * (p.x - b.x) + b.vy * (p.y - b.y)) > 0) { bd = d; best = b; }
  }
  let mx, my;
  if (best) { const s = Math.hypot(best.vx, best.vy) || 1; mx = -best.vy / s; my = best.vx / s; if ((p.x - best.x) * mx + (p.y - best.y) * my < 0) { mx = -mx; my = -my; } }
  else { const a = Math.atan2(p.y - e.y, p.x - e.x) + 0.6, r = 6.5; mx = e.x + Math.cos(a) * r - p.x; my = e.y + Math.sin(a) * r - p.y; }
  I.up = my < -0.2 ? 1 : 0; I.down = my > 0.2 ? 1 : 0; I.left = mx < -0.2 ? 1 : 0; I.right = mx > 0.2 ? 1 : 0;
  I.fire = false; void t;
}
function runPhase(id, ph) {
  const { g, e } = setup(id);
  if (!e) return { error: 'no boss' };
  if (ph > 1) {                                            // morph into the phase, then wait out the morph
    for (let q = 1; q < ph; q++) { e.reflectUntil = 0; g.damageEnemy(e, Math.round(e.hp - e.maxHp * [0.66, 0.33][q - 1] + 2000), e.x, e.y, true); for (let k = 0; k < 300 && e.bx.state !== 'fight'; k++) live(g); }
  }
  if (e.bx.phase !== ph) return { error: `could not reach phase ${ph}` };
  const seen = new Set(); let shots = 0, dmg = 0;
  const hp0 = g.hurtPlayer.bind(g);
  g.hurtPlayer = (d, ...rest) => { dmg += d; return hp0(d, ...rest); };
  const p = g.player;
  for (let f = 0; f < 60 * SECS; f++) {
    p.hp = 1e6; p.dead = false;
    bot(g, e, f / 60);
    g.update(1 / 60);
    for (const b of g.projectiles) if (b.from === 'e' && !seen.has(b)) { seen.add(b); shots++; }
    if (e.bx.phase !== ph) break;
  }
  return { shotsPerSec: +(shots / SECS).toFixed(1), dmgPerMin: Math.round((dmg / SECS) * 60) };
}
function finale(id) {
  const B = BX[id];
  if (!B.finale) return null;
  const { g, e } = setup(id);
  for (let q = 1; q < 3; q++) { e.reflectUntil = 0; g.damageEnemy(e, Math.round(e.hp - e.maxHp * [0.66, 0.33][q - 1] + 2000), e.x, e.y, true); for (let k = 0; k < 300 && e.bx.state !== 'fight'; k++) live(g); }
  e.reflectUntil = 0; g.damageEnemy(e, Math.round(e.hp - e.maxHp * B.finale.at + 2000), e.x, e.y, true);
  for (let k = 0; k < 30; k++) live(g);
  const began = e.bx.state === 'finale', h = e.hp;
  g.damageEnemy(e, 5000, e.x, e.y, true);
  const immune = e.hp === h;
  for (let k = 0; k < 60 * (B.finale.dur + 3); k++) { g.player.hp = 1e6; g.player.dead = false; g.update(1 / 60); }
  return { began, immune, broken: !!e.bx.broken, back: e.bx.state !== 'finale' };
}

for (const id of Object.keys(WHERE)) {
  if (only.length && !only.includes(id)) continue;
  const r = { phases: [1, 2, 3].map((ph) => runPhase(id, ph)) };
  r.shotsPerSec = +(r.phases.reduce((s, q) => s + (q.shotsPerSec || 0), 0) / 3).toFixed(1);
  r.dmgPerMin = Math.round(r.phases.reduce((s, q) => s + (q.dmgPerMin || 0), 0) / 3);
  r.finale = finale(id);
  out[id] = r;
  if (!asJson) console.log(`${id.padEnd(20)} shots/s ${r.phases.map((q) => String(q.shotsPerSec).padStart(5)).join(' ')}  | bot dmg/min ${r.phases.map((q) => String(q.dmgPerMin).padStart(6)).join(' ')}  | avg ${r.shotsPerSec}/s ${r.dmgPerMin}/min${r.finale ? ` | finale ${JSON.stringify(r.finale)}` : ''}`);
  if (r.finale && !(r.finale.began && r.finale.immune && r.finale.broken && r.finale.back)) { console.log('  PROBLEM: finale', JSON.stringify(r.finale)); fail++; }
}
if (!only.length) {
  const rank = Object.entries(out).sort((a, b) => b[1].dmgPerMin - a[1].dmgPerMin).map(([k]) => k);
  if (!asJson) console.log('hardest by bot damage:', rank.slice(0, 3).join(', '));
  for (const h of HARDEST) if (BX[h].finale && rank.indexOf(h) > 2) { console.log(`  PROBLEM: ${h} is not among the three hardest (#${rank.indexOf(h) + 1})`); fail++; }
}
if (asJson) console.log(JSON.stringify(out));
process.exit(fail ? 1 : 0);
