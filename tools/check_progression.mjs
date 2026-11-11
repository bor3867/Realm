// A full pass through every dungeon (2026-11-11, the user: "Run a full pass through each dungeon to make sure that
// everything needed to unlock the boss room/proceed through is there"). For each dungeon, a few seeds:
//   1. its boss is there (a boss in the map, or waiting to come);
//   2. with the boss gate shut, every seal it needs (g.sealStatus: wardens, levers, the puzzle, masks, crystals, trials) is
//      there and can be walked to from where you come in, and there are as many as the gate counts;
//   3. the seals broken as a player breaks them where that is plain (wardens slain, levers walked onto, pressure plates
//      stood on in turn; the rest by the game's own breakSeal, once found reachable), the gate opens;
//   4. then the boss can be walked to from the way in.
// A dungeon with no seals: only 1 and 4. Walking: 4-connected open floor (not solid, not the void), doors and gates as the
// map has them. The castle (throne) has its own locks: tools/check_castle_master.mjs and tools/audit_castle.mjs.
//   node tools/check_progression.mjs [dungeon ...] [--seeds N]
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
let RNG = 7; Math.random = () => ((RNG = (RNG * 1103515245 + 12345) % 2147483648) / 2147483648);
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { DUNGEONS } = await import('../src/data/enemies.js');
const { isSolid, TID } = await import('../src/world/maps.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const args = process.argv.slice(2), si = args.indexOf('--seeds'), SEEDS = si >= 0 ? +args[si + 1] : 3;
const only = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--seeds');

// every tile you can walk to from (x, y)
// (the Astral Observatory: its clockwork bridges turn all the way round on their hubs, so every tile under a plank's sweep is
// crossed in time; its rune circles carry you to their partners: reach() follows them)
function walkable(m) {
  const swept = new Set();
  for (const C of m.asClocks || []) { const R = (C.len || 0) + 0.9; for (let dy = -Math.ceil(R); dy <= Math.ceil(R); dy++) for (let dx = -Math.ceil(R); dx <= Math.ceil(R); dx++) if (Math.hypot(dx, dy) <= R) swept.add((C.hy + dy) * m.w + C.hx + dx); }
  return (i) => { const x = i % m.w, y = (i / m.w) | 0; return swept.has(i) || (!isSolid(m, x + 0.5, y + 0.5) && !(m.hasVoid && m.tiles[i] === TID.asvoid)); };
}
function reach(m, x, y) {
  const ok = walkable(m), seen = new Uint8Array(m.w * m.h), s = Math.floor(y) * m.w + Math.floor(x), q = [s];
  if (!ok(s)) { // (stood on something: start from the nearest open tile)
    for (let r = 1; r < 4 && q.length === 1; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const j = (Math.floor(y) + dy) * m.w + Math.floor(x) + dx; if (ok(j)) { q[0] = j; break; } }
  }
  seen[q[0]] = 1;
  const runes = m.objects.filter((o) => o.asRune !== undefined && o.to);
  for (let h = 0; h < q.length; h++) {
    const i = q[h], x0 = i % m.w, y0 = (i / m.w) | 0;
    for (const o of runes) if (Math.floor(o.x) === x0 && Math.floor(o.y) === y0) { const j = Math.floor(o.to.y) * m.w + Math.floor(o.to.x); if (!seen[j]) { seen[j] = 1; q.push(j); } }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x0 + dx, ny = y0 + dy, j = ny * m.w + nx; if (nx >= 0 && ny >= 0 && nx < m.w && ny < m.h && !seen[j] && ok(j)) { seen[j] = 1; q.push(j); } }
  }
  return seen;
}
// a thing counts as reachable when you can stand within 1.5 tiles of it (it may stand on a wall, a pedestal, its own tile)
const near = (m, seen, x, y, R = 1.6) => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const tx = Math.floor(x) + dx, ty = Math.floor(y) + dy; if (tx >= 0 && ty >= 0 && tx < m.w && ty < m.h && seen[ty * m.w + tx] && Math.hypot(tx + 0.5 - x, ty + 0.5 - y) <= R + 0.8) return true; } return false; };

const problems = [], rows = [];
for (const [k, where] of Object.keys(DUNGEONS).entries()) {
  if (only.length && !only.includes(where)) continue;
  if (where === 'throne') { rows.push(`${where.padEnd(12)} (the castle: its own checks, check_castle_master and audit_castle)`); continue; }
  for (let s = 0; s < SEEDS; s++) {
    RNG = 7 + k * 131 + s * 7919;
    let g;
    try {
      g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
      g.newCharacter('priest'); g.persist = () => {}; g.god = true;
      g.enter(where);
    } catch (err) { problems.push(`${where} #${s}: could not be entered: ${err.message}`); continue; }
    const m = g.map, p = g.player, tag = `${where} #${s}`;
    if (m.rf) { rows.push(`${where.padEnd(12)} (a Realmforge dungeon: its own engine)`); break; }
    // 1. the boss
    const boss = () => g.enemies.find((e) => !e.dead && (e.rb || (e.D && e.D.boss)) && !e.warden && !e.D.melon) || (m.pending || []).find?.((q) => q && (q.rb || q.boss));
    let B = boss();
    const bossRoom = (m.rooms || []).find((r) => r.kind === 'boss' || r.role === 'boss');
    if (!B && !bossRoom) problems.push(`${tag}: no boss, and no boss room`);
    const bx = B ? B.x : bossRoom ? bossRoom.cx + 0.5 : null, by = B ? B.y : bossRoom ? bossRoom.cy + 0.5 : null;
    // 2. the seals, from the way in, the gate shut
    const start = [p.x, p.y], seen0 = reach(m, ...start), status = g.sealStatus();
    const seals = m.seals || 0, missing = [];
    if (status.length < seals) problems.push(`${tag}: the gate counts ${seals} seals, but only ${status.length} are there (${status.map((q) => q.kind).join(', ')})`);
    for (const q of status) if (!q.done && !near(m, seen0, q.x, q.y)) missing.push(`${q.kind} at ${q.x.toFixed(1)},${q.y.toFixed(1)}`);
    if (missing.length) problems.push(`${tag}: seal(s) out of reach from the way in, the gate shut: ${missing.join('; ')}`);
    if (seals && bx !== null && near(m, seen0, bx, by, 0.5) && m.gates && m.gates.length) problems.push(`${tag}: the boss can be reached before the seals are broken`);
    // 3. break them
    const how = {};
    for (const q of g.sealStatus()) {
      if (q.done) continue;
      if (q.kind === 'warden') { const w = (m.wardens || []).find((e) => !e.dead && Math.hypot(e.x - q.x, e.y - q.y) < 3) || (m.wardens || []).find((e) => !e.dead); if (w) { g.forceKill(w); for (let i = 0; i < 3; i++) g.update(1 / 60); how.warden = (how.warden || 0) + 1; } }
      else if (q.kind === 'lever') { p.x = q.x; p.y = q.y; for (let i = 0; i < 4; i++) { p.hp = 1e6; g.update(1 / 60); } how.lever = (how.lever || 0) + 1; }
      else if (q.kind === 'puzzle' && m.def.puzzle !== 'runes') {
        const rm = m.rooms.find((r) => r.role === 'puzzle' && Math.abs(r.cx + 0.5 - q.x) < 1 && Math.abs(r.cy + 0.5 - q.y) < 1);
        for (const o of m.objects.filter((o) => o.interact === 'plate' && rm && o.room === rm.k)) { p.x = o.x; p.y = o.y; for (let i = 0; i < 3; i++) { p.hp = 1e6; g.update(1 / 60); } }
        how.plates = (how.plates || 0) + 1;
      }
    }
    let forced = 0;
    while (m.sealsLeft > 0 && forced < 12) { g.breakSeal('(forced by the check)'); forced++; }
    if (forced && Object.keys(how).length) { /* (the plain ones by hand; the rest forced, after being found in reach) */ }
    const handLeft = status.filter((q) => ['warden', 'lever'].includes(q.kind) || (q.kind === 'puzzle' && m.def.puzzle !== 'runes')).length;
    if (seals && forced > seals - handLeft) problems.push(`${tag}: ${forced} seal(s) did not break as a player breaks them (wardens slain, levers pulled, plates stood on): ${forced - (seals - handLeft)} too many forced`);
    if (seals && (m.gates || []).some((o) => o.solid)) problems.push(`${tag}: the seals are broken but a gate stays shut`);
    // 4. the boss, from the way in
    B = boss();
    const tx = B ? B.x : bx, ty = B ? B.y : by;
    if (tx !== null) {
      const seen1 = reach(m, ...start);
      if (!near(m, seen1, tx, ty, 2.5)) problems.push(`${tag}: the boss (${B ? B.D.name : 'its room'}) cannot be walked to, even with every seal broken`);
    }
    if (s === 0) rows.push(`${where.padEnd(12)} seals ${String(seals).padStart(2)} (${status.map((q) => q.kind).join(', ') || 'none'})${Object.keys(how).length ? ' · by hand: ' + Object.entries(how).map(([a, n]) => `${n} ${a}`).join(', ') : ''}${forced ? ` · forced ${forced}` : ''} · boss: ${B ? B.D.name : bossRoom ? 'its room' : 'NONE'}`);
  }
}
console.log(rows.join('\n'));
console.log(problems.length ? `\n${problems.length} problem(s):\n  ` + problems.join('\n  ') : `\nevery dungeon: everything needed is there, and the boss can be reached (${SEEDS} seeds each)`);
process.exitCode = problems.length ? 1 : 0;
