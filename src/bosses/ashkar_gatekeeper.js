// Ashkar, the Gatekeeper (2026-11-01, the user: "maybe add some guardian bosses along the way" of the volcano island):
// the guardian of the Guardian's hall, chained before Solkhar's gate. His own mechanic:
//   What Hurts You Saves You - he hurls boulders of black glass: each lands on a marked spot, and where it lands it leaves
//     an island of cool stone for a while. When the caldera rises the hall floods with lava, and his stones are the only
//     ground that doesn't burn. Dodge the boulder; then go and stand on it.
//   I   Chained           - chained in place: the hammer (a marked ring round him, slag thrown out), chains of slag
//                           flung at you, boulders. No flood yet: learn where the stones fall
//   II  Fracturing        - his armour cracking: the hall floods every 14 s for 3.5 s (boulders first, the floor glowing as it comes)
//   III Enraged           - he breaks his chains and walks; floods every 10 s for 4.5 s, more boulders
// His death breaks the gate's last seal (with the two court wardens'). The flood and the stones come and go on the
// hall's own tiles (the stones are obsidian, the flood is lava), so a shared Throne's players see the same floor.
// Art: tools/build_gatekeeper.py ('bx_ashkar_gatekeeper', to the user's concept sheet: the Chained Forge-Giant); his shots are the island's own (slag, slag shards, cinders).
import { TID } from '../world/maps.js';
import { R, angleTo, players, target, ring, fan, mark } from './kit.js';

const GLASS = ['#3a3446', '#8a7eaa'], FIRE = ['#ff8a1f', '#ffd650', '#ff3a1a'];
const hall = (e) => e.room || { x: Math.floor(e.x) - 17, y: Math.floor(e.y) - 4, w: 35, h: 21 };
const inHall = (A, x, y) => x >= A.x && y >= A.y && x < A.x + A.w && y < A.y + A.h;

// the hall's floor: each tile he has touched remembers what it was, and is painted from the stones and the flood
function paint(g, e) {
  const S = e.bx, m = g.map, A = hall(e), base = S.base || (S.base = new Map());
  const now = g.t, stones = (S.stones || []).filter((s) => s.placed && now < s.until), flood = S.flood && now >= S.flood.at && now < S.flood.until;
  const touch = (i) => { if (!base.has(i)) base.set(i, m.tiles[i]); };
  if (flood) for (let y = A.y; y < A.y + A.h; y++) for (let x = A.x; x < A.x + A.w; x++) { const i = y * m.w + x; if (!m.solid[i]) touch(i); }
  for (const s of stones) for (let y = s.y - 1; y <= s.y + 1; y++) for (let x = s.x - 1; x <= s.x + 1; x++) { const i = y * m.w + x; if (inHall(A, x, y) && !m.solid[i]) touch(i); }
  for (const [i, t0] of base) {
    const x = i % m.w, y = Math.floor(i / m.w), cool = stones.some((s) => Math.abs(s.x - x) <= 1 && Math.abs(s.y - y) <= 1);
    m.tiles[i] = cool ? TID.obsidian : flood ? TID.lava : t0;
  }
  S.dirty = false;
}
function stoneAt(g, e, x, y, life) {                       // a boulder lands here: its mark now, its stone when it lands
  const S = e.bx, A = hall(e), tx = Math.max(A.x + 1, Math.min(A.x + A.w - 2, Math.floor(x))), ty = Math.max(A.y + 1, Math.min(A.y + A.h - 2, Math.floor(y))), d = 1.2;
  mark(g, e, tx + 0.5, ty + 0.5, 1.6, d, 90, GLASS, 6, 'slag_shard');
  (S.stones || (S.stones = [])).push({ x: tx, y: ty, at: g.t + d, until: g.t + d + life, placed: false });
}
function boulders(g, e, V) {                              // one at each of you, and a few about the hall
  const A = hall(e);
  for (const q of players(g)) stoneAt(g, e, q.x, q.y, V.life || 9);
  for (let k = 0; k < (V.extra || 1); k++) stoneAt(g, e, A.x + 2 + R() * (A.w - 4), A.y + 2 + R() * (A.h - 4), V.life || 9);
}
function hammer(g, e, V) { mark(g, e, e.x, e.y, V.r || 3.4, V.delay || 0.9, V.dmg || 120, FIRE, V.shards || 14, 'slag_shard'); }
function chains(g, e, V) {                                // chains of slag flung at you, curling in from both sides
  const [ox, oy] = g.bxOrigin(e), q = target(g, e), a = angleTo(ox, oy, q.x, q.y);
  fan(g, e, ox, oy, a, V.n || 7, V.spread || 1.1, { sprite: 'slag', speed: 7, range: 13, dmg: V.dmg || 70, mv: { curve: 0.6, alt: true } });
}
function embers(g, e, V) { const [ox, oy] = g.bxOrigin(e); ring(g, e, ox, oy, V.n || 16, { sprite: 'cinder', speed: 4, range: 12, dmg: V.dmg || 60 }, R() * 6); }
// THE CALDERA RISES: boulders first (somewhere to stand), then the floor glows, then the hall floods
function surge(g, e, V) {
  const S = e.bx, warn = V.warn || 2.4;
  boulders(g, e, { extra: V.stones || 2, life: warn + (V.dur || 3.5) + 2.5 });
  S.flood = { at: g.t + warn, until: g.t + warn + (V.dur || 3.5) };
  if (g.banner) g.banner('The caldera rises! Stand on his stones!', 2200);
  g.vx({ k: 'shake', amt: 4 });
}

export default {
  id: 'ashkar_gatekeeper', art: 'ashkar_gatekeeper', name: 'Ashkar, the Gatekeeper', biome: 'dungeon', hp: 300000, def: 30, xp: 12000,
  r: 1.8, speed: 0.9, keep: 5, faces: true, tempo: 0.8, dmgScale: 0.9, spawnCentre: true,
  phases: {
    1: { move: 'hold', pressure: [{ every: 6, special: 'boulders', extra: 1, life: 8 }], patterns: [
      { name: 'the slag-hammer', windup: 0.7, recover: 0.8, special: 'hammer', r: 3.4, dmg: 120 },
      { name: 'chains of slag', windup: 0.5, recover: 0.6, special: 'chains', n: 7, dmg: 70 },
      { name: 'boulders', windup: 0.6, recover: 0.7, special: 'boulders', extra: 2, life: 8 },
    ] },
    2: { move: 'hold', pressure: [{ every: 14, special: 'surge', dur: 3.5, stones: 2 }], patterns: [
      { name: 'the slag-hammer', windup: 0.6, recover: 0.7, special: 'hammer', r: 3.8, dmg: 125 },
      { name: 'chains of slag', windup: 0.5, recover: 0.5, special: 'chains', n: 9, dmg: 72 },
      { name: 'a breath of embers', windup: 0.5, recover: 0.6, special: 'embers', n: 18, dmg: 60 },
      { name: 'boulders', windup: 0.5, recover: 0.6, special: 'boulders', extra: 2, life: 8 },
    ] },
    3: { move: 'pace', pressure: [{ every: 10, special: 'surge', dur: 4.5, stones: 3 }], patterns: [
      { name: 'the slag-hammer', windup: 0.5, recover: 0.6, special: 'hammer', r: 4.2, dmg: 130 },
      { name: 'chains of slag', windup: 0.4, recover: 0.5, special: 'chains', n: 11, spread: 1.4, dmg: 74 },
      { name: 'a breath of embers', windup: 0.4, recover: 0.5, special: 'embers', n: 22, dmg: 62 },
    ] },
  },
  specials: { boulders, hammer, chains, embers, surge },
  onWake(g) { if (g.banner) g.banner('Ashkar, the Gatekeeper, strains at his chains.', 2600); },
  onPhase(g, e, ph) { if (ph === 3 && g.banner) g.banner('Ashkar breaks his chains!', 2400); },
  update(g, e) {
    const S = e.bx;
    if (S.state === 'sleep' || S.state === 'intro') return;
    for (const s of S.stones || []) if (!s.placed && g.t >= s.at) { s.placed = true; S.dirty = true; }
    const was = S.wasFlood, now = !!(S.flood && g.t >= S.flood.at && g.t < S.flood.until);
    if (now !== was) { S.wasFlood = now; S.dirty = true; if (now) g.vx({ k: 'shake', amt: 6 }); }
    if ((S.stones || []).some((s) => s.placed && g.t >= s.until)) { S.stones = S.stones.filter((s) => g.t < s.until); S.dirty = true; }
    if (S.flood && !now && g.t < S.flood.at && Math.random() < 0.5) {      // the floor glowing as the flood comes
      const A = hall(e); g.vx({ k: 'burst', x: A.x + 1 + Math.random() * (A.w - 2), y: A.y + 1 + Math.random() * (A.h - 2), n: 4, colors: FIRE });
    }
    if (S.dirty) paint(g, e);
  },
  onDeath(g, e) { const S = e.bx; S.stones = []; S.flood = null; paint(g, e); },    // (the hall back as it was)
  lights(g, e) { return [{ x: e.x, y: e.y, h: 1.4, r: 80, col: '#ff8a1f' }]; },
  loot: [], lootLuck: 1.2,                             // (filled with every class's gear in its band: src/bosses/boss_loot.js)
};
