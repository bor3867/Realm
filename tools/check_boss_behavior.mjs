// How a boss actually behaves, phase by phase (2026-11-04, the user's boss overhaul: "demonstrate through testing that the
// fights now behave differently"): the real game loop, the boss awake in its own room, each phase forced in turn; a
// player standing still, then one circling the room at range. Per phase: the share of time it moves, its longest
// stretch standing, the attacks / combos it starts (how many kinds, the most repeated), shots a second, and the damage
// each kind of player takes a minute. Reads the boss's own debug state (e.bx.dbg) when it keeps one.
//   node tools/check_boss_behavior.mjs [jarl_warrior|jarl_wizard|ashkar_gatekeeper|unstruck_god] [seconds a phase]
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const ID = process.argv[2] || 'jarl_warrior', SECS = +(process.argv[3] || 40), LOGPH = +(process.argv[4] || 0);   // (a phase to print its debug log for: what it chose, when, its states)
const ROOM = { jarl_warrior: 'a26', jarl_wizard: 'a26', ashkar_gatekeeper: 'a46', unstruck_god: 'a52' }[ID];
const dt = 1 / 30;

function run(phase, mode) {
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.persist = () => {}; g.mode = 'play'; g.enter('throne', { seed: 4 });
  const m = g.map, p = g.player, n = m.castle.rooms[ROOM];
  for (const L of m.castle.locks) if (L.name !== '46-47') g.castleOpen(L.name);
  let dmg = 0; const hurt0 = g.hurtPlayer.bind(g); g.hurtPlayer = (d, by) => { dmg += d; };
  p.x = n.x + n.w / 2; p.y = n.y + n.h * 0.75;
  const boss = () => g.enemies.find((e) => !e.dead && e.id === ID);
  // wake it, then force its phase
  for (let i = 0; i < 30 * 4; i++) { p.hp = 1e9; g.update(dt); }
  let e = boss(); if (!e) return null;
  if (ID === 'jarl_wizard') { const W = g.enemies.find((q) => q.id === 'jarl_warrior'); if (W) { W.hp = 0; W.dead = true; } for (let i = 0; i < 30 * 6; i++) { p.hp = 1e9; g.update(dt); } e = boss(); }
  const T = e.bx.B.thresholds || [0.66, 0.33], want = phase === 1 ? 1 : phase === 2 ? (T[0] - 0.02) : (T[1] - 0.02);
  for (let i = 0; i < 30 * 20 && e.bx.phase < phase; i++) { p.hp = 1e9; if (e.hp > e.maxHp * want && !(e.invulnT > 0)) g.damageEnemy(e, e.maxHp * 0.02, e.x, e.y, true); g.update(dt); }   // (its phases come by damage, as a player's)
  for (let i = 0; i < 30 * 4; i++) { p.hp = 1e9; g.update(dt); }   // (past its change of form)
  dmg = 0; if (LOGPH === phase && mode === 'skirmish') { g.bxDebug = true; g.bxLogs = []; }
  const cx = n.x + n.w / 2, cy = n.y + n.h / 2, R = Math.min(n.w, n.h) * 0.4;
  let moving = 0, still = 0, longest = 0, x0 = e.x, y0 = e.y, shots = 0;
  const starts = new Map(), seq = []; let lastA = null;
  const seen = new Set(g.projectiles);
  for (let i = 0; i < SECS / dt; i++) {
    p.hp = 1e9;
    if (mode === 'circle') {                                // (circling the boss at a weapon's longest reach, 9 tiles, at a player's pace: the kite)
      const d = Math.hypot(p.x - e.x, p.y - e.y) || 1, ux = (p.x - e.x) / d, uy = (p.y - e.y) / d;
      let vx = -uy + ux * (9 - d) * 0.6, vy = ux + uy * (9 - d) * 0.6; const L = Math.hypot(vx, vy) || 1; g.moveCircle(p, (vx / L) * 6.5 * dt, (vy / L) * 6.5 * dt, 0.3);
    }
    if (mode === 'skirmish') {                              // (a player fighting it: keeping about six tiles off, always side-stepping)
      const d = Math.hypot(p.x - e.x, p.y - e.y) || 1, ux = (p.x - e.x) / d, uy = (p.y - e.y) / d, s = Math.sin(i * dt * 0.7) > 0 ? 1 : -1;
      let vx = -uy * s + ux * (6 - d) * 0.5, vy = ux * s + uy * (6 - d) * 0.5; const L = Math.hypot(vx, vy) || 1; g.moveCircle(p, (vx / L) * 6 * dt, (vy / L) * 6 * dt, 0.3);
    }
    g.update(dt);
    e = boss(); if (!e) break;
    e.hp = Math.max(e.hp, Math.round(e.maxHp * (phase === 3 ? (T[1] - 0.06) : want)));   // (held in its phase)
    const sp = Math.hypot(e.x - x0, e.y - y0) / dt; x0 = e.x; y0 = e.y;
    if (sp > 0.4) { moving++; still = 0; } else { still += dt; longest = Math.max(longest, still); }
    const a = (e.bx.dbg && e.bx.dbg.combo) || (e.bx.pat && e.bx.pat.name) || null;
    if (a && a !== lastA) { starts.set(a, (starts.get(a) || 0) + 1); seq.push(a); }
    lastA = a;
    for (const b of g.projectiles) if (!seen.has(b)) { seen.add(b); shots++; }
  }
  void hurt0;
  if (g.bxDebug) console.log((g.bxLogs || []).map((L) => `${L.t} ${L.ev} ${L.info ?? ''} [${L.dir || L.state}/${L.move || ''}]`).join(' | '));
  const total = SECS / dt, kinds = [...starts.entries()].sort((a, b) => b[1] - a[1]);
  return { moving: Math.round((moving / total) * 100), longest: +longest.toFixed(1), kinds: kinds.length, top: kinds.slice(0, 6).map(([k, v]) => `${k} x${v}`).join(', '), seq: seq.slice(0, 12).join(' > '), shots: +(shots / SECS).toFixed(1), dmg: Math.round((dmg / SECS) * 60) };
}
console.log(`${ID}: ${SECS}s a phase, the real loop`);
for (const ph of [1, 2, 3]) {
  const a = run(ph, 'skirmish'), st = run(ph, 'still'), b = run(ph, 'circle');
  if (!a) { console.log(`phase ${ph}: boss not found`); continue; }
  console.log(`phase ${ph} (a player skirmishing): moving ${a.moving}% | longest standing ${a.longest}s | ${a.kinds} kinds: ${a.top}`);
  console.log(`         order: ${a.seq}`);
  console.log(`         shots/s ${a.shots} | dmg/min: skirmishing ${a.dmg}, standing still ${st.dmg}, kiting at 9 tiles ${b.dmg}`);
}
