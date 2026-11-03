// The Forge Overseer (the user's design, 2026-11-02: the castle's 4-star miniboss): it oversees the molten machinery that
// feeds Ashkar's gate, in the Chainforge Threshold's foundry. Four furnace vents stand marked in its floor; they burn only
// when it calls on them. On the boss engine with its own schedule (kit.scheduler: each attack's cooldown from when it ends):
//   I   The Taskmaster (100-65%): Gearfall (0.9 s; three waves of twelve gears 0.55 s apart, each with its openings, 100),
//       Crucible Chains (1.0 s, their lanes marked; two flaming chains sweep across, 160, sparks off them, 90)
//   II  The Furnace Master (65-30%), and I's: Furnace Command (1.2 s; a Lava Guard and two Cinder Bats, never on you, three
//       living at most; again 15 s after they're gone), Molten Tribunal (0.85 s; the four vents fire staggered fans every
//       0.8 s for 6 s, 100; it fights on meanwhile, the fans leaving their gaps)
//   III The Final Forging (30-0%), and Gearfall and the Chains: The Crucible's Judgment (1.1 s warning, about 8 s: rings
//       out for 2 s, 100; two walls closing for 2.5 s, 110; chains and molten bursts for 2 s, 160 / 90; a slam, 185; 1.5 s
//       spent). 17 s again after
// A light volley of gears under it all, by turns at you and where you are going. Its sprite the user's, drawn larger.
// (2026-11-02, the user: "its attacks should revolve around forge machinery, falling molten fragments, chain mechanisms,
// and active environmental hazards".) It tours its four forge stations (its vents), pausing at each to work it, and the
// vent it works erupts beside it (1.2 s marked, 120); come within 3 tiles and it steps off; in III it hunts you instead.
// Slag Cascade (all phases): molten fragments from the crucible overhead, five marks in a cross on and round you (1.0 s),
// each landing (120) and shattering in four shards (85).
// Damage numbers are effective ones (D(n): set above a Throne-geared character's Defense).
import { TAU, angleTo, target, ahead, scheduler } from './kit.js';

const D = (n) => n + 4, deg = (d) => (d * Math.PI) / 180;
const later = (e, t, name, V = {}) => e.bx.vol.push({ t, V: { form: 'special', ...V, name } });   // (its own name last)
const shot = (g, e, x, y, a, V) => g.bxShot(e, x, y, a, V);
const GEAR = { sprite: 'castle_shots/gear', size: 0.45 }, LINK = { sprite: 'rf_shot/forge_chain', size: 0.5 }, BLOB = { sprite: 'castle_shots/blob', size: 0.42 }, STONE = { sprite: 'castle_shots/stone', size: 0.42 };
const RED = ['#ff6a1c', '#ff6a1c', '#ff3a1a', '#ffffff'];
const lane = (g, e, x, y, a, len, delay, w = 0.6) => g.fx.push({ kind: 'lane', x, y, a, len, w, delay, t: 0, life: delay, dmg: 0, by: e.D.name, hitT: 0, cols: RED });
const zone = (g, e, x, y, r, delay, dmg = 0) => g.fx.push({ kind: 'zone', src: e, x, y, r, t: 0, delay, life: delay + 0.15, dmg: dmg ? g.bxDmg(e, dmg) : 0, by: e.D.name, done: !dmg, colors: ['#ff8a1f', '#ffd650'] });
// its foundry (the Chainforge Threshold, 40x32), and its four vents
const room = (e) => e.room || { x: Math.floor(e.x) - 20, y: Math.floor(e.y) - 16, w: 40, h: 32 };
export const VENTS = (n) => [[8, 8], [32, 8], [32, 24], [8, 24]].map(([u, v]) => ({ x: n.x + (u / 40) * n.w, y: n.y + (v / 32) * n.h }));

// ================================================================ Slag Cascade: molten fragments, a cross of five marks on and round you
function slag(g, e) {
  const q = target(g, e), r = 2.6;
  for (const [dx, dy] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) { zone(g, e, q.x + dx, q.y + dy, 1.0, 1.0, 120); later(e, 1.0, 'slagLand', { x: q.x + dx, y: q.y + dy, n: 4 }); }
  g.sfx('hammer');
}
function slagLand(g, e, V) { const a0 = Math.random() * TAU; for (let k = 0; k < V.n; k++) shot(g, e, V.x, V.y, a0 + (k / V.n) * TAU, { ...STONE, speed: 4.2, range: 6, dmg: D(85), free: true }); g.vx({ k: 'burst', x: V.x, y: V.y, n: 10, colors: ['#ff8a1f', '#ffd650', '#5a5560'] }); }

// ================================================================ under it all
function gearVolley(g, e) {
  const S = e.bx, q = target(g, e), [x, y] = (S.ovK = (S.ovK || 0) + 1) % 2 ? ahead(g, e, Math.hypot(q.x - e.x, q.y - e.y) / 5.5) : [q.x, q.y], a = angleTo(e.x, e.y, x, y);
  for (let k = 0; k < 3; k++) shot(g, e, e.x, e.y, a + (k - 1) * deg(12), { ...GEAR, speed: 5.5, range: 14, dmg: D(80) });
}

// ================================================================ I
function gearfall(g, e) {
  zone(g, e, e.x, e.y, 2.2, 0.9);
  const off = Math.random() * TAU;
  for (let w = 0; w < 3; w++) later(e, 0.9 + w * 0.55, 'gearWave', { off: off + w * deg(15), gap: (w * 4) % 12 });
}
function gearWave(g, e, V) {                                // twelve gears, two together left out: the opening, moving each wave
  for (let k = 0; k < 12; k++) { if (k === V.gap || k === (V.gap + 1) % 12) continue; shot(g, e, e.x, e.y, V.off + (k / 12) * TAU, { ...GEAR, speed: 4.5, range: 16, dmg: D(100) }); }
  g.sfx('hammer');
}
function chains(g, e, V) {                                  // two chains, from the north and the south walls, each across most of the room from its own side
  const C = room(e), L = C.w * 0.62, sweep = C.h * 0.42, dur = sweep / 4.5;
  for (const s of [0, 1]) {
    const x0 = s ? C.x + C.w - 1 - L : C.x + 1, y = s ? C.y + C.h - 1.5 : C.y + 1.5, a = s ? -Math.PI / 2 : Math.PI / 2;
    lane(g, e, x0 + L / 2, y, a, sweep, V.warn ?? 1.0, L / 2);
    later(e, V.warn ?? 1.0, 'chainGo', { x0, y, a, L, sweep, dur });
  }
  g.sfx('chain');
}
function chainGo(g, e, V) {
  const links = [];
  for (let d = 0; d <= V.L; d += 0.55) links.push(shot(g, e, V.x0 + d, V.y, V.a, { ...LINK, speed: 4.5, range: V.sweep, dmg: D(160) }));
  (e.bx.ovChains = e.bx.ovChains || []).push({ links, a: V.a + Math.PI, next: g.t + 0.5, until: g.t + V.dur });
}

// ================================================================ II
function command(g, e) {                                    // its reinforcements, out of the furnace: never on you
  const C = room(e), q = target(g, e), spots = [];
  for (let k = 0; k < 30 && spots.length < 3; k++) { const x = C.x + 2 + Math.random() * (C.w - 4), y = C.y + 2 + Math.random() * (C.h - 4); if (Math.hypot(x - q.x, y - q.y) > 4 && !g.blockedAt(x, y, 0.6)) spots.push([x, y]); }
  for (const [x, y] of spots) zone(g, e, x, y, 0.9, 1.2);
  later(e, 1.2, 'summon', { spots });
}
function summon(g, e, V) {
  const S = e.bx, ids = ['lava_guard', 'cinder_bat', 'cinder_bat'];
  S.ovAdds = (S.ovAdds || []).filter((q) => !q.dead);
  V.spots.forEach(([x, y], k) => { if (S.ovAdds.length >= 3) return; const q = g.addEnemy(ids[k], x, y); q.noLoot = true; q.seen = true; S.ovAdds.push(q); g.vx({ k: 'burst', x, y: y - 0.5, n: 14, colors: ['#ff8a1f', '#ffd650'] }); });
}
function tribunal(g, e) {                                   // the four vents: marked, then 6 s of fans by turns
  const V = VENTS(room(e));
  for (const v of V) zone(g, e, v.x, v.y, 1.0, 0.85);
  e.bx.ovTrib = { from: g.t + 0.85, until: g.t + 6.85, t: 0, k: 0 };
}

// ================================================================ III
function judgment(g, e) {
  if (g.banner) g.banner("THE CRUCIBLE'S JUDGMENT", 2000); g.sfx('roar');
  for (let k = 0; k < 3; k++) later(e, 1.1 + k * 0.65, 'judgeRing', { off: k * deg(18), gap: (k * 7) % 20 });          // rings out, 2 s
  for (let k = 0; k < 2; k++) later(e, 3.1 + k * 1.2, 'judgeWall', { k });                                                // walls closing, 2.5 s
  later(e, 4.6, 'chains', { warn: 1.0 });                                                                                // chains (warned from 4.6, sweeping 5.6-7.6) and bursts
  for (let k = 0; k < 3; k++) later(e, 5.6 + k * 0.6, 'judgeBurst');
  later(e, 7.4, 'judgeSlamMark');                                                                                        // the slam at 8.3, then 1.5 s spent
}
function judgeRing(g, e, V) { for (let k = 0; k < 20; k++) { if ((k - V.gap + 20) % 20 < 3) continue; shot(g, e, e.x, e.y, V.off + (k / 20) * TAU, { ...BLOB, speed: 4.5, range: 16, dmg: D(100) }); } }
function judgeWall(g, e, V) {                               // from the west and the east walls in, a gap in each that the other doesn't share
  const C = room(e), gap = C.y + 3 + Math.random() * (C.h - 6);
  for (const s of [0, 1]) {
    const x = s ? C.x + C.w - 1.5 : C.x + 1.5, a = s ? Math.PI : 0, gp = s ? C.y + C.h - (gap - C.y) : gap;
    lane(g, e, x, C.y + 1, Math.PI / 2, C.h - 2, 0.6, 0.4);
    for (let y = C.y + 1; y < C.y + C.h - 1; y += 0.8) if (Math.abs(y - gp) > 1.6) later(e, 0.6, 'judgeStone', { x, y, a, range: C.w * 0.48 });
  }
}
function judgeStone(g, e, V) { shot(g, e, V.x, V.y, V.a, { ...STONE, speed: 4, range: V.range, dmg: D(110) }); }
function judgeBurst(g, e) { const q = target(g, e); for (let k = 0; k < 2; k++) { const a = Math.random() * TAU, r = 1 + Math.random() * 2.5; zone(g, e, q.x + Math.cos(a) * r, q.y + Math.sin(a) * r, 1.1, 0.9, D(90)); } }
function judgeSlamMark(g, e) { zone(g, e, e.x, e.y, 2.6, 0.9, D(185)); later(e, 0.9, 'slamThud'); }
function slamThud(g) { g.vx({ k: 'shake', amt: 9 }); g.sfx('hammer'); }

const P = {
  gearfall: { name: 'Gearfall', special: 'gearfall', windup: 0.2, dur: 2.1, cd: 6 },
  slag: { name: 'Slag Cascade', special: 'slag', windup: 0.2, dur: 1.4, cd: 9 },
  chains: { name: 'Crucible Chains', special: 'chains', windup: 0.2, dur: 3.2, cd: 8 },
  command: { name: 'Furnace Command', special: 'command', windup: 0.2, dur: 1.4, cd: 15, when: (g, e) => !(e.bx.ovAdds || []).some((q) => !q.dead) },
  tribunal: { name: 'Molten Tribunal', special: 'tribunal', windup: 0.2, dur: 1.0, cd: 14 + 6 },
  judgment: { name: "The Crucible's Judgment", special: 'judgment', windup: 0.2, dur: 9.8, cd: 17, block: true, after: 0.3 },
};
const sched = scheduler([[2.2, 3.0], [1.9, 2.6], [1.7, 2.4]]);

export default {
  id: 'forge_overseer', art: 'forge_overseer', drawScale: 0.5, name: 'The Forge Overseer', biome: 'dungeon', hp: 135000, def: 26, xp: 8000,
  r: 0.9, speed: 2.7, keep: 3, faces: false, tempo: 1, dmgScale: 1, spawnCentre: true, thresholds: [0.65, 0.30], morphGrace: 1.5,
  choose: (g, e, list) => sched(g, e, list.filter((p) => !p.when || p.when(g, e))),
  phases: {
    1: { move: 'stations', pressure: [{ every: 2.4, special: 'gearVolley', delay: 1.5 }], patterns: [P.gearfall, P.chains, P.slag] },
    2: { move: 'stations', pressure: [{ every: 2.2, special: 'gearVolley', delay: 1.5 }], patterns: [P.command, P.tribunal, P.gearfall, P.chains, P.slag] },
    3: { move: 'walk', pressure: [{ every: 2.0, special: 'gearVolley', delay: 1.5 }], patterns: [P.judgment, P.gearfall, P.chains, P.slag] },
  },
  specials: { slag, slagLand, gearVolley, gearfall, gearWave, chains, chainGo, command, summon, tribunal, judgment, judgeRing, judgeWall, judgeStone, judgeBurst, judgeSlamMark, slamThud },
  moves: {
    stations(g, e, dt) {                                   // its round of the forge: to a vent, a while working it (the vent erupts), on to the next
      const S = e.bx, V = VENTS(room(e)), q = target(g, e), d = Math.hypot(q.x - e.x, q.y - e.y);
      if (d < 3) { g.moveCircle(e, ((e.x - q.x) / d) * 2.4 * dt, ((e.y - q.y) / d) * 2.4 * dt, 0.8); return; }   // (too close: it steps off)
      if (S.ovSt === undefined) S.ovSt = 0;
      const v = V[S.ovSt % 4], tx = v.x + (room(e).x + room(e).w / 2 - v.x) * 0.25, ty = v.y + (room(e).y + room(e).h / 2 - v.y) * 0.25, L = Math.hypot(tx - e.x, ty - e.y);
      if (L > 0.4) { g.moveCircle(e, ((tx - e.x) / L) * Math.min(L, 2.6 * dt), ((ty - e.y) / L) * Math.min(L, 2.6 * dt), 0.8); S.ovWork = 0; return; }
      S.ovWork = (S.ovWork || 0) + dt;
      if (S.ovWork > 0.4 && !S.ovVented) { S.ovVented = true; zone(g, e, v.x, v.y, 1.6, 1.2, 120); later(e, 1.2, 'slagLand', { x: v.x, y: v.y, n: 6 }); }   // (it works the vent: it blows)
      if (S.ovWork > 3.2) { S.ovSt++; S.ovWork = 0; S.ovVented = false; }
    },
    walk(g, e, dt) { const q = target(g, e), d = Math.hypot(q.x - e.x, q.y - e.y); if (d > 3) g.moveCircle(e, ((q.x - e.x) / d) * 2.7 * dt, ((q.y - e.y) / d) * 2.7 * dt, 0.8); },
  },
  onWake(g) { if (g.banner) g.banner('THE FORGE OVERSEER', 2400); },
  onPhase(g, e, ph) {
    const S = e.bx; S.ovChains = null; S.ovTrib = null; S.wait = 1.5;
    if (g.banner) g.banner(ph === 2 ? 'THE FURNACE MASTER' : 'THE FINAL FORGING', 2200);
    g.vx({ k: 'shake', amt: 7 }); g.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 30, colors: ['#ff8a1f', '#ffd650', '#5a5560'] }); g.sfx('roar');
  },
  update(g, e, dt) {
    const S = e.bx;
    if (S.state === 'sleep' || S.state === 'intro') return;
    for (const C of S.ovChains || []) {                     // the chains shed sparks behind them as they sweep
      if (g.t > C.until || g.t < C.next) continue;
      C.next += 0.5; const live = C.links.filter((b) => b.life > 0);
      for (let k = 0; k < 4 && live.length; k++) { const b = live[Math.floor(((k + 0.5) / 4) * live.length)]; shot(g, e, b.x, b.y, C.a, { ...BLOB, speed: 4.8, range: 7, dmg: D(90) }); }
    }
    if (S.ovChains) S.ovChains = S.ovChains.filter((C) => g.t <= C.until);
    const T = S.ovTrib;                                     // the tribunal: each vent in turn, a fan every 0.8 s, staggered 0.2 s
    if (T && g.t > T.from && S.state !== 'morph') {
      if (g.t > T.until) S.ovTrib = null;
      else if ((T.t -= dt) <= 0) { T.t = 0.2; const v = VENTS(room(e))[T.k++ % 4], q = target(g, e), a = angleTo(v.x, v.y, q.x, q.y); for (let k = 0; k < 5; k++) shot(g, e, v.x, v.y, a + (k / 4 - 0.5) * deg(56), { ...BLOB, speed: 4.5, range: 16, dmg: D(100) }); g.vx({ k: 'burst', x: v.x, y: v.y - 0.4, n: 6, colors: ['#ff8a1f', '#ffd650'] }); }
    }
  },
  onDeath(g, e) { const S = e.bx; S.ovChains = null; S.ovTrib = null; for (const q of S.ovAdds || []) if (!q.dead) { q.noLoot = true; q.dead = true; q.deadT = 0; } g.vx({ k: 'shake', amt: 8 }); },
  lights(g, e) { return [{ x: e.x, y: e.y, h: 1.6, r: 70, col: '#ff8a3a', fire: true }]; },
  loot: [], lootLuck: 1,                                    // (a guaranteed tiered reward: src/bosses/boss_loot.js, its band)
};
