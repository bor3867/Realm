// Ashkar, the Chained Forge-Giant (2026-11-01, the user's design: "his defining mechanic is the gradual loss of his
// restraints"). The guardian of the volcano island's Guardian's hall, chained before the forge gate to four great
// anchors; his death is the gate's last seal. His chains, his hammer, his armour and his furnace core make every attack:
// no circles of bullets turning about him.
//   I   The Bound Colossus (100-70%) - chained in place, his reach his weapon:
//       Hammerfall        the hammer raised, its ground marked; the blow sends three crescents out, each with an opening
//       Chains of the Forge  two chains glow red-hot, then molten shot runs along them to their anchors and scatters
//       Furnace Bellows   his chest opens: walls of embers, each with a gap, the gaps alternating side to side
//       The Great Toll    the hammer dragged through a wide arc (marked, then locked): a curving wave of slag
//   II  The Fractured Furnace (70-35%) - plates burst off him; the chains slacken (he walks a little way from the gate);
//       his helpers come: one Furnace Brute (it charges you) and two Obsidian Sentinels (they hold the far side,
//       crosses of shards)
//       Molten Faultlines the hammer splits the floor: three cracks glow, then fire bursts out of them sideways
//       Shattered Armor   he tears plates off and hurls them: big, slow, and each breaks into a small spread
//       Chain Recoil      he hauls on two chains: they're marked across the floor, then snap taut, throwing sparks
//       Furnace Overload  fans from his core, turn and turn about: fast orange embers, slow dark slag that curls
//   III The Unshackled (35-0%) - he plants the hammer, his core erupts, he tears the chains apart; then he hunts you:
//       Chainbreaker      the severed chains swung in great arcs: shot runs out along their curving paths
//       Anvil's Judgment  three blows where you'll be (each marked, then locked), each a ring of shards with an opening
//       Infernal Pursuit  three lunges at you (each marked, then locked) leaving pools of fire; a breath after each
//       The Reverse Furnace  lines run in to his core; then the molten shot comes in along them, to him, not from him
//   Last (15%): The Last Forging - he strikes and strikes; each blow a ring with its safe lanes shown before it falls,
//       the lanes moving each time
// No falling lava while he fights (game.dungeonTick); his shots go when his phase turns (the engine clears them).
// Art: tools/build_gatekeeper.py ('bx_ashkar_gatekeeper', to the user's concept sheet).
import { R, TAU, angleTo, target, ring, mark, ahead, kill } from './kit.js';

const FIRE = ['#ff8a1f', '#ffd650', '#ff3a1a'], GLASS = ['#433d4e', '#8c84a2'];
const ANCHORS = [[-9, -4], [9, -4], [-9, 5], [9, 5]];               // the four anchors, from where he stands chained
const home = (e) => e.akHome || (e.akHome = { x: e.x, y: e.y });
const anchor = (e, i) => { const H = home(e); return { x: H.x + ANCHORS[i][0], y: H.y + ANCHORS[i][1] }; };
// a point on his body: dx tiles to the right of him on the screen, h tiles up it (whatever the camera's turn)
function at(g, e, dx, h) { const a = g.camAngle || 0; return g.up(e.x + dx * Math.cos(a), e.y - dx * Math.sin(a), h); }
const CORE = (g, e) => at(g, e, 0, 3.3), WRIST = (g, e, s) => at(g, e, s * 1.75, 2.0);
const later = (e, t, name, V) => e.bx.vol.push({ t, V: { form: 'special', name, ...V } });
const shot = (g, e, x, y, a, V) => g.bxShot(e, x, y, a, V);
const SLAG = { sprite: 'slag_shard', size: 0.5 }, EMBER = { sprite: 'ember', size: 0.45 }, CINDER = { sprite: 'cinder', size: 0.45 };
const lane = (g, e, x, y, a, len, delay, dmg = 0, w = 1) => g.fx.push({ kind: 'lane', x, y, a, len, w, delay, t: 0, life: delay + (dmg ? 0.35 : 0.02), dmg: dmg ? g.bxDmg(e, dmg) : 0, by: e.D.name, hitT: 0 });

// ================================================================ I: the Bound Colossus
function hammerfall(g, e, V) {                             // the blow, marked where it falls; three crescents with openings
  const q = target(g, e), a = angleTo(e.x, e.y, q.x, q.y), x = e.x + Math.cos(a) * 2.6, y = e.y + Math.sin(a) * 2.6;
  mark(g, e, x, y, 2.6, 0.6, V.dmg || 170, FIRE, 0);
  later(e, 0.6, 'thud', { x, y });
  [3, 9, 6].forEach((gap, w) => later(e, 0.6 + w * 0.32, 'crescent', { x, y, a, gap, n: 13, dmg: V.shard || 80 }));
}
function crescent(g, e, V) {
  for (let k = 0; k < V.n; k++) { if (k === V.gap || k === V.gap + 1) continue; shot(g, e, V.x, V.y, V.a + (k / (V.n - 1) - 0.5) * 2.4, { ...SLAG, speed: 5.4, range: 12, dmg: V.dmg }); }
}
function thud(g, e, V) { g.vx({ k: 'shake', amt: 7 }); g.vx({ k: 'burst', x: V.x, y: V.y, n: 26, colors: FIRE }); g.sfx('hammer'); }
function chains(g, e, V) {                                 // two chains glow red-hot; then the shot runs along them to their anchors
  const S = e.bx, pair = (S.akPair = ((S.akPair ?? 1) + 1) % 2) ? [0, 3] : [1, 2];
  S.akHot = { ids: pair, until: g.t + 1.6 }; g.sfx('chain');
  for (const i of pair) for (let k = 0; k < 5; k++) later(e, 0.8 + k * 0.12, 'chainRun', { i, last: k === 4, dmg: V.dmg || 72 });
}
function chainRun(g, e, V) {
  const A = anchor(e, V.i), [ox, oy] = WRIST(g, e, A.x < e.x ? -1 : 1), a = angleTo(ox, oy, A.x, A.y), L = Math.hypot(A.x - ox, A.y - oy), sp = 7;
  shot(g, e, ox, oy, a, { ...EMBER, speed: sp, range: L, dmg: V.dmg });
  if (V.last) later(e, L / sp, 'chainFan', { i: V.i, dmg: V.dmg });
}
function chainFan(g, e, V) {                               // at the anchor the molten shot scatters: a fan back into the hall
  const A = anchor(e, V.i), H = home(e), a = angleTo(A.x, A.y, H.x, H.y + 2);
  for (let k = 0; k < 5; k++) shot(g, e, A.x, A.y, a + (k / 4 - 0.5) * 1.3, { ...CINDER, speed: 4.6, range: 9, dmg: V.dmg });
  g.vx({ k: 'burst', x: A.x, y: A.y, n: 10, colors: FIRE });
}
function bellows(g, e, V) {                                // walls of embers from his chest, the gap swapping sides each wall
  const q = target(g, e), [cx, cy] = CORE(g, e), a = angleTo(cx, cy, q.x, q.y);
  for (let w = 0; w < (V.walls || 4); w++) later(e, w * 0.45, 'wall', { cx, cy, a, gap: w % 2 ? 2 : 7, dmg: V.dmg || 70 });
  g.sfx('bellows');
}
function wall(g, e, V) {
  const nx = -Math.sin(V.a), ny = Math.cos(V.a);
  for (let k = 0; k < 11; k++) { if (Math.abs(k - V.gap) < 1.5) continue; const o = (k - 5) * 0.62; shot(g, e, V.cx + nx * o, V.cy + ny * o, V.a, { ...EMBER, speed: 4.2, range: 13, dmg: V.dmg }); }
}
function toll(g, e, V) {                                   // the hammer dragged through an arc: marked, locked, then the wave curves out
  const q = target(g, e), a = angleTo(e.x, e.y, q.x, q.y), s = (e.bx.akTollS = -(e.bx.akTollS || 1));
  for (const d of [-1.1, 0, 1.1]) lane(g, e, e.x, e.y, a + d, 9, 0.85);
  for (let k = 0; k <= 12; k++) later(e, 0.85 + k * 0.05, 'tollShot', { a: a + s * (k / 12 - 0.5) * 2.2, s, dmg: V.dmg || 78 });
  later(e, 0.85, 'scrape', {});
}
function tollShot(g, e, V) { const x = e.x + Math.cos(V.a) * 2.4, y = e.y + Math.sin(V.a) * 2.4; shot(g, e, x, y, V.a, { ...SLAG, speed: 6, range: 11, dmg: V.dmg, mv: { curve: 0.55 * V.s } }); }
function scrape(g) { g.sfx('hammer'); g.vx({ k: 'shake', amt: 3 }); }

// ================================================================ II: the Fractured Furnace
function faultlines(g, e, V) {                             // the hammer splits the floor; the cracks glow; then they spit fire
  const q = target(g, e), a = angleTo(e.x, e.y, q.x, q.y);
  thud(g, e, { x: e.x, y: e.y + 0.5 });
  for (const d of [-0.62, 0, 0.62]) { lane(g, e, e.x, e.y, a + d, 12, 1.05); later(e, 1.05, 'fault', { a: a + d, dmg: V.dmg || 70 }); }
}
function fault(g, e, V) {
  const nx = -Math.sin(V.a), ny = Math.cos(V.a);
  for (let d = 2; d <= 12; d += 1.25) {
    const x = e.x + Math.cos(V.a) * d, y = e.y + Math.sin(V.a) * d;
    for (const s of [-1, 1]) shot(g, e, x, y, Math.atan2(ny * s, nx * s), { ...CINDER, speed: 2.6, range: 2.4, dmg: V.dmg });
  }
}
function shatter(g, e, V) {                                // plates torn off and hurled: big, slow, each breaking into a small spread
  const q = target(g, e), [ox, oy] = at(g, e, 0, 2.6), a = angleTo(ox, oy, q.x, q.y), n = V.n || 4;
  for (let k = 0; k < n; k++) shot(g, e, ox, oy, a + (k / (n - 1) - 0.5) * 1.5, { sprite: 'slag', size: 0.95, speed: 3, range: 10, dmg: V.dmg || 110, mv: { split: { at: 1.15, n: 6, speed: 4.4, range: 4.2, proj: 'slag_shard' } } });
  g.vx({ k: 'burst', x: ox, y: oy, n: 18, colors: GLASS }); g.sfx('shatter');
}
function recoil(g, e, V) {                                 // he hauls on two chains: marked, then they snap taut through the hall, throwing sparks
  const S = e.bx, pair = R() < 0.5 ? [0, 2] : [1, 3];
  S.akHot = { ids: pair, until: g.t + 1.25 }; g.sfx('chain');
  for (const i of pair) {
    const A = anchor(e, i), a = angleTo(e.x, e.y, A.x, A.y), L = Math.hypot(A.x - e.x, A.y - e.y);
    lane(g, e, e.x, e.y, a, L, 0.95, V.dmg || 95);
    later(e, 0.95, 'sparks', { a, L, dmg: V.spark || 60 });
  }
}
function sparks(g, e, V) {
  for (let d = 2; d < V.L; d += 1.6) { const x = e.x + Math.cos(V.a) * d, y = e.y + Math.sin(V.a) * d; for (const s of [-1, 1]) shot(g, e, x, y, V.a + s * Math.PI / 2 + (R() - 0.5) * 0.3, { ...CINDER, speed: 3.6, range: 3, dmg: V.dmg }); }
  g.vx({ k: 'shake', amt: 4 }); g.sfx('chain');
}
function overload(g, e, V) {                               // his core: fans turn and turn about, fast orange, slow dark slag that curls
  for (let k = 0; k < (V.n || 6); k++) later(e, k * 0.38, 'overFan', { k, dmg: V.dmg || 72 });
  g.sfx('bellows');
}
function overFan(g, e, V) {
  const q = target(g, e), [cx, cy] = CORE(g, e), a = angleTo(cx, cy, q.x, q.y);
  if (V.k % 2 === 0) for (let i = 0; i < 7; i++) shot(g, e, cx, cy, a + (i / 6 - 0.5) * 0.95, { ...EMBER, speed: 7.2, range: 12, dmg: V.dmg });
  else for (let i = 0; i < 6; i++) shot(g, e, cx, cy, a + (i / 5 - 0.5) * 1.3, { sprite: 'slag', size: 0.6, speed: 3.4, range: 11, dmg: V.dmg, mv: { curve: i < 3 ? -0.7 : 0.7 } });
}

// ================================================================ III: the Unshackled
function chainbreaker(g, e, V) {                           // the severed chains swung in great arcs; shot runs out along their curves
  const q = target(g, e), a = angleTo(e.x, e.y, q.x, q.y), s = (e.bx.akSwing = -(e.bx.akSwing || 1));
  lane(g, e, e.x, e.y, a - s * 1.6, 8, 0.6);
  for (let k = 0; k <= 16; k++) later(e, 0.6 + k * 0.055, 'swing', { a: a + s * (k / 16 - 0.5) * 3.3, s, dmg: V.dmg || 74 });
  later(e, 0.6, 'clank', {});
}
function swing(g, e, V) { const [ox, oy] = WRIST(g, e, V.s); shot(g, e, ox, oy, V.a, { ...EMBER, speed: 6.4, range: 12, dmg: V.dmg, mv: { curve: 0.65 * V.s } }); }
function clank(g) { g.sfx('chain'); }
function anvil(g, e, V) {                                  // three blows where you'll be: each marked, then locked
  for (let k = 0; k < 3; k++) later(e, k * 0.95, 'anvilMark', { dmg: V.dmg || 180, shard: V.shard || 78 });
}
function anvilMark(g, e, V) {
  const [x, y] = ahead(g, e, 0.85), ga = angleTo(e.x, e.y, x, y);   // (its opening faces away from him: the way out)
  mark(g, e, x, y, 2.2, 0.85, V.dmg, FIRE, 0);
  later(e, 0.85, 'anvilRing', { x, y, ga, dmg: V.shard });
}
function anvilRing(g, e, V) { ring(g, e, V.x, V.y, 20, { ...SLAG, speed: 4.6, range: 8, dmg: V.dmg }, 0, V.ga, 3); thud(g, e, V); }
function pursuit(g, e, V) {                                // three lunges at you (each marked, then locked), pools of fire behind; a breath after each
  for (let k = 0; k < 3; k++) later(e, k * 1.35, 'lunge', { dmg: V.dmg || 140, pool: V.pool || 55 });
}
function lunge(g, e, V) {
  const q = target(g, e), a = angleTo(e.x, e.y, q.x, q.y), d = 0.55, H = e.room;
  let L = Math.min(7.5, Math.hypot(q.x - e.x, q.y - e.y) + 1.5);
  if (H) while (L > 0.5) {                                 // (never through a wall or out of his hall: the lunge stops at its edge)
    const x = e.x + Math.cos(a) * L, y = e.y + Math.sin(a) * L;
    if (x > H.x + 1.8 && x < H.x + H.w - 1.8 && y > H.y + 1.8 && y < H.y + H.h - 1.8) break;
    L -= 0.5;
  }
  lane(g, e, e.x, e.y, a, L, d, V.dmg, 1.4);
  e.akDash = { x0: e.x, y0: e.y, x1: e.x + Math.cos(a) * L, y1: e.y + Math.sin(a) * L, at: g.t + d, until: g.t + d + 0.3, pool: V.pool, laid: 0 };
}
function reverse(g, e, V) {                                // lines run in to his core; then the molten shot comes in along them, to him
  const n = 14, off = R() * TAU, gap = Math.floor(R() * n);
  for (let k = 0; k < n; k++) {
    if (k === gap || k === (gap + 1) % n) continue;
    const a = off + (k / n) * TAU;
    lane(g, e, e.x + Math.cos(a) * 9, e.y + Math.sin(a) * 9, a + Math.PI, 8.4, 1.0);
    for (let w = 0; w < 2; w++) later(e, 1.0 + w * 0.5, 'inward', { a, dmg: V.dmg || 74 });
  }
  g.sfx('bellows');
}
function inward(g, e, V) { shot(g, e, e.x + Math.cos(V.a) * 9, e.y + Math.sin(V.a) * 9, V.a + Math.PI, { ...EMBER, speed: 4.6, range: 8.6, dmg: V.dmg }); }

// ================================================================ the last: The Last Forging
const finale = {
  at: 0.15, dur: 12, name: 'The Last Forging', after: 1.4,
  start(g, e) { e.akForgeT = 0.6; e.akForgeK = 0; g.vx({ k: 'shake', amt: 8 }); if (g.banner) g.banner('Ashkar raises his hammer for the last time!', 2400); },
  update(g, e, dt) {
    if ((e.akForgeT -= dt) > 0) return;
    e.akForgeT = 1.55; const k = e.akForgeK++;
    if (k % 3 === 2) {                                     // every third: three blows round you, each ring opening away from him
      for (let j = 0; j < 3; j++) later(e, j * 0.25, 'anvilMark', { dmg: 170, shard: 74 });
      return;
    }
    const off = k * 0.61, lanes = [0, TAU / 3, (2 * TAU) / 3].map((a) => a + off);   // the blow on the forge floor: its safe lanes shown, then the ring
    for (const a of lanes) g.fx.push({ kind: 'lane', x: e.x, y: e.y, a, len: 11, w: 1, delay: 0.75, t: 0, life: 0.75, dmg: 0, by: e.D.name, hitT: 0, cols: ['#8af0ff', '#8af0ff', '#8af0ff', '#ffffff'] });
    later(e, 0.75, 'forge', { lanes, dmg: 80 });
  },
};
function forge(g, e, V) {
  const n = 34;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    if (V.lanes.some((L) => Math.abs(Math.atan2(Math.sin(a - L), Math.cos(a - L))) < 0.24)) continue;   // (the lanes shown are the way through)
    shot(g, e, e.x, e.y, a, { ...SLAG, speed: 4.8, range: 12, dmg: V.dmg });
  }
  thud(g, e, { x: e.x, y: e.y });
}

export default {
  id: 'ashkar_gatekeeper', art: 'ashkar_gatekeeper', drawScale: 0.5, name: 'Ashkar, the Chained Forge-Giant', biome: 'dungeon', hp: 420000, def: 30, xp: 14000,
  r: 1.8, speed: 1.0, keep: 4.5, faces: false, tempo: 0.85, dmgScale: 0.9, spawnCentre: true, thresholds: [0.70, 0.35], finale,
  phases: {
    1: { move: 'hold', patterns: [
      { name: 'Hammerfall', windup: 0.9, recover: 0.9, special: 'hammerfall', dmg: 170, shard: 80 },
      { name: 'Chains of the Forge', windup: 0.5, recover: 1.0, special: 'chains', dmg: 72 },
      { name: 'Furnace Bellows', windup: 0.7, recover: 1.0, special: 'bellows', walls: 4, dmg: 70 },
      { name: 'The Great Toll', windup: 0.5, recover: 1.0, special: 'toll', dmg: 78 },
    ] },
    2: { move: 'pace', patterns: [
      { name: 'Molten Faultlines', windup: 0.7, recover: 0.9, special: 'faultlines', dmg: 72 },
      { name: 'Shattered Armor', windup: 0.6, recover: 0.8, special: 'shatter', n: 4, dmg: 110 },
      { name: 'Chain Recoil', windup: 0.5, recover: 1.0, special: 'recoil', dmg: 95, spark: 60 },
      { name: 'Furnace Overload', windup: 0.6, recover: 0.9, special: 'overload', n: 6, dmg: 72 },
      { name: 'Hammerfall', windup: 0.8, recover: 0.8, special: 'hammerfall', dmg: 175, shard: 80 },
    ] },
    3: { move: 'pace', patterns: [
      { name: 'Chainbreaker', windup: 0.5, recover: 0.8, special: 'chainbreaker', dmg: 74 },
      { name: "Anvil's Judgment", windup: 0.5, recover: 1.0, special: 'anvil', dmg: 180, shard: 78 },
      { name: 'Infernal Pursuit', windup: 0.4, recover: 1.2, special: 'pursuit', dmg: 140, pool: 55 },
      { name: 'The Reverse Furnace', windup: 0.6, recover: 1.0, special: 'reverse', dmg: 74 },
    ] },
  },
  specials: { hammerfall, crescent, thud, chains, chainRun, chainFan, bellows, wall, toll, tollShot, scrape, faultlines, fault, shatter, recoil, sparks,
    overload, overFan, chainbreaker, swing, clank, anvil, anvilMark, anvilRing, pursuit, lunge, reverse, inward, forge },
  onWake(g) { if (g.banner) g.banner('Ashkar, the Chained Forge-Giant, strains against his chains.', 2800); },
  onPhase(g, e, ph) {
    const S = e.bx, [cx, cy] = CORE(g, e);
    if (ph === 2) {                                        // the plates burst off him; the chains slacken; his helpers come
      if (g.banner) g.banner('Ashkar roars: his armour bursts apart!', 2400);
      g.vx({ k: 'shake', amt: 8 }); g.vx({ k: 'burst', x: cx, y: cy, n: 40, colors: [...GLASS, ...FIRE] }); g.sfx('shatter');
      S.akAdds = [['furnace_brute', 2], ['obsidian_sentinel', 0], ['obsidian_sentinel', 1]].map(([id, i]) => {
        const A = anchor(e, i), q = g.addEnemy(id, A.x + (A.x < e.x ? 1.5 : -1.5), A.y + (i < 2 ? 1.5 : -1));
        q.noLoot = true; q.seen = true; g.unstick(q, 0.6); return q;                 // (at their own strength: helpers, quick to put down)
      });
    }
    if (ph === 3) {                                        // he plants the hammer, his core erupts, he tears the chains apart; the gate begins to fall
      if (g.banner) g.banner('ASHKAR TEARS HIS CHAINS APART!', 3000);
      S.akUnchained = g.t; g.vx({ k: 'shake', amt: 12 }); g.sfx('roar');
      g.fx.push({ kind: 'ring', x: e.x, y: e.y, t: 0, max: 9, color: '#ffd650' });
      for (let i = 0; i < 4; i++) { const A = anchor(e, i); g.vx({ k: 'burst', x: (A.x + e.x) / 2, y: (A.y + e.y) / 2, n: 16, colors: ['#a39bb2', '#766e84', ...FIRE] }); }
      const gate = g.map.objects.find((o) => o.gateArch);
      if (gate) for (let k = 0; k < 4; k++) g.vx({ k: 'burst', x: gate.x - 4 + k * 2.6, y: gate.y - 0.5, n: 14, colors: ['#4c4656', '#928aa0', '#ff8a1f'] });
    }
  },
  update(g, e) {
    const S = e.bx;
    if (S.state === 'sleep' || S.state === 'intro') return;
    if (S.phase === 2) {                                   // the slack chains: he can walk a little way from the gate, no more
      const H = home(e), d = Math.hypot(e.x - H.x, e.y - H.y);
      if (d > 4) { e.x = H.x + (e.x - H.x) * 4 / d; e.y = H.y + (e.y - H.y) * 4 / d; }
    }
    const D = e.akDash;                                    // a lunge, and the pools of fire it leaves
    if (D && g.t >= D.at) {
      if (g.t >= D.until) e.akDash = null;
      else {
        const k = (g.t - D.at) / (D.until - D.at); e.x = D.x0 + (D.x1 - D.x0) * k; e.y = D.y0 + (D.y1 - D.y0) * k;
        if (k * 5 >= D.laid) { D.laid++; g.fx.push({ kind: 'pool', x: e.x, y: e.y, r: 0.8, t: 0, life: 3.2, dmg: g.bxDmg(e, D.pool), by: e.D.name, col: '#ff8a1f' }); }
      }
    }
    if (S.akHot && g.t > S.akHot.until) S.akHot = null;
    if (S.phase === 3 && R() < 0.3) { const [cx, cy] = CORE(g, e); g.vx({ k: 'burst', x: cx + (R() - 0.5), y: cy + (R() - 0.5), n: 2, colors: FIRE }); }   // the core, blazing
  },
  onDeath(g, e) {                                          // he staggers, drops the hammer, falls; the core implodes; the chains fall silent; the gate darkens
    const S = e.bx, [cx, cy] = CORE(g, e);
    for (const q of S.akAdds || []) kill(q);
    e.akDash = null; S.akHot = null; S.akDead = true;
    for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU; g.vx({ k: 'burst', x: cx + Math.cos(a) * 3, y: cy + Math.sin(a) * 3, n: 6, colors: FIRE }); }
    g.fx.push({ kind: 'ring', x: e.x, y: e.y, t: 0, max: 5, color: '#fff4c4' }); g.vx({ k: 'shake', amt: 10 }); g.sfx('hammer');
    const m = g.map; if (m.lights) m.lights = m.lights.filter((L) => !L.gate);
  },
  // the chains, under him: from his wrists to the four anchors. I taut; II slack; III snapped (stubs at the anchors, the
  // severed ends hanging from his wrists); red-hot when he works them; after he falls, slack and dark on the floor
  drawGround(r, g, e) {
    const S = e.bx, b = r.b, ph = S.phase || 1, [sx, sy] = r.proj(e.x, e.y), hot = S.akHot && g.t < S.akHot.until ? S.akHot.ids : [];
    for (let i = 0; i < 4; i++) {
      const A = anchor(e, i), [ax, ay] = r.proj(A.x, A.y), side = A.x < e.x ? -1 : 1, wx = sx + (side < 0 ? -26 : 40), wy = sy - (side < 0 ? 57 : 40);   // (his wrists, on the user's sprite)
      b.fillStyle = '#0e0a12'; b.fillRect(Math.round(ax) - 6, Math.round(ay) - 6, 12, 12);   // the anchor: an iron block, a ring
      b.fillStyle = '#433d4e'; b.fillRect(Math.round(ax) - 5, Math.round(ay) - 5, 10, 10);
      b.fillStyle = '#615a70'; b.fillRect(Math.round(ax) - 5, Math.round(ay) - 5, 10, 2);
      b.fillStyle = '#1c1822'; b.fillRect(Math.round(ax) - 2, Math.round(ay) - 2, 4, 4);
      const broken = ph === 3 || S.akDead, L = Math.hypot(wx - ax, wy - ay), n = Math.max(2, Math.floor(L / 5));
      const red = hot.includes(i), sag = S.akDead ? 18 : ph === 2 ? 10 : 2;
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        if (broken && !S.akDead && t > 0.3 && t < 0.78) continue;          // snapped: a stub at the anchor, the severed end at his wrist
        const x = ax + (wx - ax) * t, y = ay + (wy - ay) * t + Math.sin(t * Math.PI) * sag;
        b.fillStyle = '#0e0a12'; b.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4);
        b.fillStyle = S.akDead ? '#2c2834' : red ? ((k + Math.floor(g.t * 14)) % 2 ? '#ffd650' : '#ff6a1c') : k % 2 ? '#8c84a2' : '#615a70';
        b.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 2);
      }
    }
  },
  lights(g, e) { const ph = e.bx.phase || 1; return [{ x: e.x, y: e.y, h: 3.3, r: ph === 3 ? 110 : ph === 2 ? 90 : 60, col: '#ff8a1f', fire: true }]; },
  // his relics (boss_loot.js gives them their real, rare chances), and every class's gear in his band
  loot: [{ id: 'fetterbreaker', p: 0.1 }, { id: 'slagplate', p: 0.1 }, { id: 'the_last_link', p: 0.1 }, { id: 'gatekeepers_chain', p: 0.1 }], lootLuck: 1.3,
};
