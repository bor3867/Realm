// Where the modular bosses (all but the Grand Orrery) stand when they attack, and whether they get stuck changing form.
// Each fights 150 s while you circle it and hit it steadily (so it goes through its phases).
//   per attack: how many times it was used, the share of its shots that died against a wall within their first
//   third of flight (fired from a poor spot: a ring from beside a wall spends half itself on the wall, leaving that
//   side of the room quiet), and how far from its arena's middle it stood when firing
//   form changes: whether, after each, the boss was inside a wall (its body blocked: it could not move) or out of
//   its arena
//   node tools/audit_boss_positioning.mjs [boss ...]
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
Date.now = () => 1.7e12;
let RNG = 51; Math.random = () => ((RNG = (RNG * 1103515245 + 12345) % 2147483648) / 2147483648);
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { BX } = await import('../src/bosses/index.js');
const { DUNGEONS } = await import('../src/data/enemies.js');
const { shotBlocked } = await import('../src/world/maps.js');
const { R: GR } = await import('../src/util.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
for (const id of Object.keys(BX)) {
  if (id === 'grand_orrery' || id === 'framework_test' || (only.length && !only.includes(id))) continue;
  RNG = 51; GR.seed(7);
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.persist = () => {}; g.god = true; g.enter(Object.keys(DUNGEONS).find((k) => DUNGEONS[k].boss === id) || BX[id].map || 'realm');   // (its own dungeon)
  // in its own arena: a dungeon boss is already in its room; a realm event boss is called up where you are
  let e = g.enemies.find((q) => q.D.bx === id);
  if (e) { g.enemies = g.map.enemies = g.enemies.filter((q) => q === e); const r = e.room || g.map.rooms.at(-1); g.player.x = r.cx + 0.5; g.player.y = r.cy + Math.min(6, r.h / 2 - 2); }
  else { g.enemies.length = 0; g.command(`/bx ${id}`); e = g.enemies.find((q) => q.D.bx === id); }
  const p = g.player, m = g.map;
  if (!e) { console.log(id, 'did not spawn'); continue; }
  const A = e.room, cx = A ? A.x + A.w / 2 : e.x, cy = A ? A.y + A.h / 2 : e.y;
  const info = new Map(), per = {}, morphs = [];
  let t = 0, lastState = null, phase = e.bx ? e.bx.phase : 1;
  for (let f = 0; f < 150 * 60 && !e.dead; f++) {
    t += 1 / 60; p.hp = 1e9; p.dead = false;
    p.x = cx + Math.cos(t * 0.6) * 7; p.y = cy + Math.sin(t * 0.6) * 6;   // (you circle the arena's middle, not the boss: it keeps its own ground)
    const before = new Set(g.projectiles);
    g.update(1 / 60);
    const S = e.bx; if (!S) continue;
    if (f % 10 === 0 && !['death', 'morph', 'finale', 'deathhold'].includes(S.state)) g.damageEnemy(e, Math.round(e.maxHp / 900), e.x, e.y, true);
    const name = S.pat ? S.pat.name : S.state;
    for (const b of g.projectiles) if (b.bxOf === e && !info.has(b)) { info.set(b, { name, life0: b.life, x: b.x, y: b.y }); const P = (per[name] = per[name] || { uses: 0, shots: 0, wall: 0, dist: [] }); P.shots++; }
    for (const b of before) if (b.bxOf === e && !g.projectiles.includes(b) && info.has(b)) {   // gone: was it a wall, early in its flight?
      const I = info.get(b), used = I.life0 - b.life;
      if (b.life > 0.05 && used < I.life0 / 3 && shotBlocked(m, b.x + b.vx / 60, b.y + 0.3 + b.vy / 60)) per[I.name].wall++;
    }
    if (S.state === 'release' && lastState !== 'release' && S.pat) { const P = (per[S.pat.name] = per[S.pat.name] || { uses: 0, shots: 0, wall: 0, dist: [] }); P.uses++; P.dist.push(Math.hypot(e.x - cx, e.y - cy)); }
    if (lastState === 'morph' && S.state !== 'morph') morphs.push({ to: S.phase, stuck: g.blockedAt(e.x, e.y, 0.8), out: A ? !(e.x > A.x && e.x < A.x + A.w && e.y > A.y && e.y < A.y + A.h) : false });
    lastState = S.state; phase = S.phase;
  }
  console.log(`${id}  (phase reached ${phase}${A ? `, arena ${A.w}x${A.h}` : ', no room'})`);
  for (const [n, P] of Object.entries(per)) if (P.uses && P.shots >= 10) console.log(`  ${n.padEnd(24)} used ${String(P.uses).padStart(3)}  shots ${String(P.shots).padStart(5)}  into walls early ${String(Math.round((P.wall / P.shots) * 100)).padStart(3)}%  from the middle ${(P.dist.reduce((a, b) => a + b, 0) / P.dist.length).toFixed(1)} tiles`);
  for (const M of morphs) console.log(`  form change to phase ${M.to}: ${M.stuck ? 'STUCK IN A WALL' : 'clear'}${M.out ? ', OUT OF ITS ARENA' : ''}`);
}
