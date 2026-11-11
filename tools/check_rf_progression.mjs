// The Realmforge dungeons, a full pass (2026-11-11, the user: "Run a full pass through each dungeon to make sure that
// everything needed to unlock the boss room/proceed through is there"). Their generator only keeps a layout that passes its
// own test (src/rf/explore_gen.js validate: every room reachable; the main route to the boss door open with every
// optional lock, secret and timed wall shut; each guardian there; no objective cut off). This checks that for every one of
// them, on several layouts: it is made at all (not given up on), its boss door is there, the way from where you come in
// to that door is open (gates of guardians counted open: their guardians are there to slay), and standing at the door
// opens the way to its boss's own room, which can be entered and holds its boss.
//   node tools/check_rf_progression.mjs [dungeon ...] [--seeds N]
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const stub = () => new Proxy(function () {}, { get: (t, k) => (k === 'data' ? new Uint8ClampedArray(4096) : k === 'width' || k === 'height' ? 64 : k === Symbol.toPrimitive ? () => 0 : stub()), apply: () => stub(), set: () => true });
globalThis.document = { createElement: () => ({ width: 64, height: 64, getContext: () => stub() }) };
globalThis.OffscreenCanvas = class { constructor(w, h) { this.width = w; this.height = h; } getContext() { return stub(); } };
globalThis.Image = class {};
globalThis.window = globalThis.window || { addEventListener: () => {} };
const ROOT = new URL('../', import.meta.url);
globalThis.fetch = async (u) => ({ json: async () => JSON.parse(readFileSync(new URL(String(u), ROOT), 'utf8')) });
let CLOCK = 1.7e12; Date.now = () => CLOCK;
const { buildRegistry } = await import(new URL('src/registry.js', ROOT).href);
const { Game } = await import(new URL('src/game.js', ROOT).href);
const H = await import(new URL('src/rf/host.js', ROOT).href);
await H.loadRF();
const B0 = new URL('art/bundle/', ROOT), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const args = process.argv.slice(2), si = args.indexOf('--seeds'), SEEDS = si >= 0 ? +args[si + 1] : 3;
const only = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--seeds'), list = only.length ? only : H.rfDungeons();
const problems = [], rows = [];
const warn = console.warn; console.warn = (...a) => { if (/could not generate/.test(a.join(' '))) problems.push('generator: ' + a.join(' ')); };   // (a thrown attempt the generator retries is not a problem)
for (const dg of list) {
  let ok = 0, boss = '';
  for (let s = 0; s < SEEDS; s++) {
    CLOCK = 1.7e12 + s * 86400000 + list.indexOf(dg) * 1000;
    const tag = `${dg} #${s}`;
    try {
      const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
      g.newCharacter('priest'); g.persist = () => {}; g.god = true;
      g.enter(`rf_${dg}`);
      const m = g.map, E = m.rf && m.rf.E, M = E && E.M;
      if (!M) { problems.push(`${tag}: no layout made`); continue; }
      if (!M.bossDoor) { problems.push(`${tag}: no boss door`); continue; }
      // the way from the start to the door: walls, pits and deep water shut; secrets, locks and timed walls shut (as the
      // generator's main route); guardians' gates open
      const { t, W, I } = M, C = H.RF_CODE_TILE, code = (n) => C.indexOf(n);
      const WALL = code('rf_wall'), PIT = code('rf_pit'), DEEP = code('rf_deep'), SECRET = code('rf_secret');
      const shut = new Set(); for (const q of M.gates) if (q.kind !== 'guard') for (const [x, y] of q.cells) shut.add(I(x, y));
      const seen = new Uint8Array(t.length), st = [I(Math.floor(M.start.x), Math.floor(M.start.y))];
      const pmap = new Map(); for (const q of M.portals || []) { pmap.set(I(q.ax, q.ay), I(q.bx, q.by)); pmap.set(I(q.bx, q.by), I(q.ax, q.ay)); }
      while (st.length) { const k = st.pop(); if (seen[k]) continue; const v = t[k]; if (v === WALL || v === PIT || (v === DEEP && !M.deepWalk) || v === SECRET || shut.has(k)) continue; seen[k] = 1; const x = k % W; if (x > 0) st.push(k - 1); if (x < W - 1) st.push(k + 1); if (k >= W) st.push(k - W); if (k < t.length - W) st.push(k + W); const pj = pmap.get(k); if (pj != null) st.push(pj); }
      const D = M.bossDoor;
      if (![[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen[I(D.x + dx, D.y + dy)])) problems.push(`${tag}: the boss door cannot be walked to from the way in`);
      // a guardian's gate opens when the guardians of its rooms (q.by) fall: each must be there, and reachable with that gate still shut
      const shut2 = new Set(shut); for (const q of M.gates) if (q.kind === 'guard') for (const [x, y] of q.cells) shut2.add(I(x, y));
      const seen2 = new Uint8Array(t.length), st2 = [I(Math.floor(M.start.x), Math.floor(M.start.y))];
      while (st2.length) { const k = st2.pop(); if (seen2[k]) continue; const v = t[k]; if (v === WALL || v === PIT || (v === DEEP && !M.deepWalk) || v === SECRET || shut2.has(k)) continue; seen2[k] = 1; const x = k % W; if (x > 0) st2.push(k - 1); if (x < W - 1) st2.push(k + 1); if (k >= W) st2.push(k - W); if (k < t.length - W) st2.push(k + W); const pj = pmap.get(k); if (pj != null) st2.push(pj); }
      for (const q of M.gates) if (q.kind === 'guard') for (const id of q.by || [q.room]) {
        const G = E.en_.find((e) => e.room === id && e.boss) || (M.spawns || []).find((sp) => sp.boss && sp.room === id);
        if (!G) problems.push(`${tag}: a guardian's gate whose guardian (room ${id}) is not there`);
        else if (![[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]].some(([dx, dy]) => seen2[I(Math.floor(G.x) + dx, Math.floor(G.y) + dy)]) && !(E.cfg.enemies[G.k] || {}).fly) problems.push(`${tag}: a guardian (room ${id}) cannot be walked to with its gate shut`);
      }
      // at the door: the way to the boss's room opens, and it can be entered
      g.player.x = D.x + 0.5; g.player.y = D.y + 1.2; E.player && (E.player.x = D.x + 0.5, E.player.y = D.y + 1.2);
      for (let k = 0; k < 6; k++) g.update(1 / 30);
      const door = m.portals.find((q) => q.to && q.to.startsWith('rfa_'));
      if (!door) { problems.push(`${tag}: standing at the boss door, it does not open onto the boss`); continue; }
      boss = door.label;
      g.enter(door.to);
      const BE = g.enemies.find((e) => !e.dead && (e.rb || (e.D && e.D.boss))) || (g.map.rfBoss && g.map.rfBoss.B);
      if (!g.map.rfBoss && !BE) problems.push(`${tag}: the boss's room (${door.to}) holds no boss`);
      ok++;
    } catch (err) { problems.push(`${tag}: ${err.message}`); }
  }
  rows.push(`${dg.padEnd(16)} ${ok}/${SEEDS} layouts through to the boss${boss ? ' · ' + boss : ''}`);
}
console.warn = warn;
console.log(rows.join('\n'));
console.log(problems.length ? `\n${problems.length} problem(s):\n  ` + problems.join('\n  ') : `\nevery Realmforge dungeon: the way to its boss is there (${SEEDS} layouts each)`);
process.exitCode = problems.length ? 1 : 0;
