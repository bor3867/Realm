// How hard is each original boss now (docs/design/10_boss_setpieces.md)? The same dodging bot as
// check_boss_pressure.mjs, held in each third of the boss's life for 40 s: shots per second and damage per minute.
// Fails if any boss is now trivial (under 1,500 a minute) or out of hand (over 9,000: the hardest three-phase bosses' level;
// 11,000 for the overworld bosses, made deadlier on purpose: src/owbosses.js).
// The Sleeper and Maestro Lucan are exempt from the floor: their danger is in mechanics the bot never meets (falling asleep
// when still, inverted controls, a mirror that answers your shots, curtains), not in bullets.
//   node tools/check_old_boss_pressure.mjs [boss ...]
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { OW_BOSSES } = await import('../src/owbosses.js');
const { REALM_BOSSES } = await import('../src/data/enemies.js');
const { isSolid } = await import('../src/world/maps.js');
const { OLD_SP } = await import('../src/setpieces.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const DZ = { drowned_abbot: 'chapel', fallen_heart: 'heart', the_archivist: 'scriptorium', the_unstruck_god: 'throne', honey_queen: 'hive', the_puppeteer: 'theatre', prism_wyrm: 'spire', the_sleeper: 'dream' };
const only = process.argv.slice(2);
let fail = 0;
const MECHANIC = new Set(['the_sleeper', 'the_puppeteer']);
function bot(g, e) {
  const p = g.player, I = g.input;
  let best = null, bd = 2.6;
  for (const b of g.projectiles) { if (b.from !== 'e' || b.ghost) continue; const d = Math.hypot(b.x - p.x, b.y - p.y); if (d < bd && (b.vx * (p.x - b.x) + b.vy * (p.y - b.y)) > 0) { bd = d; best = b; } }
  let mx, my;
  if (best) { const s = Math.hypot(best.vx, best.vy) || 1; mx = -best.vy / s; my = best.vx / s; if ((p.x - best.x) * mx + (p.y - best.y) * my < 0) { mx = -mx; my = -my; } }
  else { const a = Math.atan2(p.y - e.y, p.x - e.x) + 0.6; mx = e.x + Math.cos(a) * 6.5 - p.x; my = e.y + Math.sin(a) * 6.5 - p.y; }
  I.up = my < -0.2 ? 1 : 0; I.down = my > 0.2 ? 1 : 0; I.left = mx < -0.2 ? 1 : 0; I.right = mx > 0.2 ? 1 : 0; I.fire = false;
}
for (const id of Object.keys(OLD_SP)) {
  if (only.length && !only.includes(id)) continue;
  const res = [];
  for (const frac of [0.95, 0.55, 0.25]) {
    const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
    g.newCharacter('priest'); g.persist = () => {};
    const live = () => { g.player.hp = 1e7; g.player.dead = false; g.update(1 / 60); };
    let e;
    if (REALM_BOSSES[id]) {
      g.enter('realm'); g.enemies = g.map.enemies = [];
      let at = { x: g.player.x + 6, y: g.player.y };
      for (let k = 0; k < 40; k++) { const a = (k / 40) * Math.PI * 2, x = g.player.x + Math.cos(a) * 6, y = g.player.y + Math.sin(a) * 6; if ([-2, -1, 0, 1, 2].every((dx) => [-2, -1, 0, 1, 2].every((dy) => !isSolid(g.map, x + dx, y + dy) && g.map.tiles[Math.floor(y + dy) * g.map.w + Math.floor(x + dx)] > 1))) { at = { x, y }; break; } }
      e = g.spawnRealmBoss(id, at);
    } else { g.enter(DZ[id]); const br = g.map.rooms.find((n) => n.boss) || g.map.rooms.at(-1); g.player.x = br.x + br.w / 2; g.player.y = br.y + br.h - 4; for (let k = 0; k < 200; k++) live(); e = g.enemies.find((q) => q.id === id); }
    if (!e) { res.push(null); continue; }
    e.hp = Math.round(e.maxHp * frac);
    for (let k = 0; k < 120; k++) live();
    let dmg = 0, shots = 0; const seen = new Set(g.projectiles);
    const h0 = g.hurtPlayer.bind(g); g.hurtPlayer = (d, ...r) => { dmg += d; return h0(d, ...r); };
    for (let f = 0; f < 60 * 40; f++) { g.player.hp = 1e7; g.player.dead = false; bot(g, e); g.update(1 / 60); for (const b of g.projectiles) if (!seen.has(b)) { seen.add(b); if (b.from === 'e') shots++; } }
    res.push({ s: +(shots / 40).toFixed(1), d: Math.round((dmg / 40) * 60) });
  }
  const avg = Math.round(res.reduce((a, r) => a + (r ? r.d : 0), 0) / 3);
  console.log(`${id.padEnd(20)} shots/s ${res.map((r) => String(r ? r.s : '-').padStart(5)).join(' ')} | bot dmg/min ${res.map((r) => String(r ? r.d : '-').padStart(6)).join(' ')} | avg ${avg}`);
  // (the overworld bosses may hit harder: src/owbosses.js, the user's request of 2026-10-19)
  if ((avg < 1500 && !MECHANIC.has(id)) || avg > (OW_BOSSES[id] ? 11000 : 9000)) { console.log(`  PROBLEM: ${id} averages ${avg}/min`); fail++; }
}
process.exit(fail ? 1 : 0);
