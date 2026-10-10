// The Forgeheart Colossus: the Emberforge's boss on the boss framework (docs/design/boss_forgeheart_colossus.md).
// The Emberforge keeps its layout; its forge floor gains six vents. The Colossus keeps its own blazing core (your
// shots come back: e.reflectUntil, handled where damage lands) and gains the brief's three phases: half-ring slams,
// rivets that ricochet, slag that skips, vent columns that pick vents and say which, rolling magma that leaves lava,
// and quake rings that catch each other up.
import { TID } from '../world/maps.js';
const TAU = Math.PI * 2, R = Math.random;
const SHOT = (n) => `bx_shots/forgeheart_colossus.${n}`;
const angleTo = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);
const centre = (e) => { const A = e.bx.arena; return A ? [A.x + A.w / 2, A.y + A.h / 2] : [e.x, e.y]; };
const vents = (g, e) => g.map.cvVents || [];

function slam(g, e, V) {                            // a half-ring of sparks toward you, then another half a spark over
  const p = g.player, [ox, oy] = g.bxOrigin(e), a = angleTo(ox, oy, p.x, p.y);
  [[0, 0], [0.3, 0.5]].forEach(([t, half]) => e.bx.vol.push({ t, V: { form: 'special', name: 'halfRing', a, half, dmg: V.dmg || 115 } }));
  g.vx({ k: 'shake', amt: 5 });
}
function halfRing(g, e, V) {
  const [ox, oy] = g.bxOrigin(e), n = 13;
  for (let k = 0; k < n; k++) g.bxShot(e, ox, oy, V.a - Math.PI / 2 + ((k + V.half) / (n - 1)) * Math.PI, { shot: 'hammer_spark', speed: 5.5, range: 11, dmg: V.dmg });
}
function rivets(g, e, V) {                          // a line of rivets at you, each ricocheting once off a wall
  const p = g.player, [ox, oy] = g.bxOrigin(e), a = angleTo(ox, oy, p.x, p.y);
  for (let k = 0; k < 8; k++) e.bx.vol.push({ t: k * 0.09, V: { form: 'special', name: 'rivet', a, dmg: V.dmg || 120 } });
}
function rivet(g, e, V) { const [ox, oy] = g.bxOrigin(e), b = g.bxShot(e, ox, oy, V.a, { shot: 'iron_rivet', speed: 9, range: 22, dmg: V.dmg }); b.bounce = 1; }
function core(g, e) {                               // its own: the blazing core throws your shots back
  e.reflectUntil = g.t + 3.2; e.reflectDmg = 105; e.reflectProj = SHOT('hammer_spark');
  g.banner('Its core blazes white! Hold your fire!', 1800);
}
function slag(g, e, V) {                            // slag bombs that land, skip once more, then burst
  const p = g.player, [ox, oy] = g.bxOrigin(e);
  for (let k = 0; k < 3; k++) {
    const a = R() * TAU, d = k ? 1.5 + R() * 2 : 0, x1 = p.x + Math.cos(a) * d, y1 = p.y + Math.sin(a) * d, dir = angleTo(ox, oy, x1, y1);
    const b = g.shoot('e', ox, oy, dir, 7, 99, g.bxDmg(e, V.dmg || 125), SHOT('slag_bomb'), 0.45, false, e.D.name);
    b.bxOf = e;
    b.lob = { x0: ox, y0: oy, x1, y1, t: 0, T: Math.max(0.7, Math.min(1.2, Math.hypot(x1 - ox, y1 - oy) / 7)), h: 30, n: 0, r: 1.0, ss: 0,
      onLand: (G) => {                               // the skip: a short second hop on past where it landed
        G.vx({ k: 'burst', x: x1, y: y1, n: 8, colors: ['#ff8c1e', '#ffd84a', '#3a2a2a'] });
        const x2 = x1 + Math.cos(dir) * 2.2, y2 = y1 + Math.sin(dir) * 2.2, c = G.shoot('e', x1, y1, dir, 5, 99, G.bxDmg(e, V.dmg || 125), SHOT('slag_bomb'), 0.45, false, e.D.name);
        c.bxOf = e;
        c.lob = { x0: x1, y0: y1, x1: x2, y1: y2, t: 0, T: 0.45, h: 12, n: 6, r: 1.0, ss: 4, sprite: SHOT('hammer_spark'), bxOf: e };
      } };
  }
}
function flames(g, e, V) {                          // some vents glow, then roar a column of flame across the floor
  const S = e.bx, all = vents(g, e), n = V.all ? all.length : 2 + (R() < 0.5 ? 1 : 0), pick = [...all].sort(() => R() - 0.5).slice(0, n), [cx, cy] = centre(e);
  S.glow = pick.map((v) => ({ x: v[0], y: v[1], at: g.t + 1, until: g.t + 2.5, a: angleTo(v[0], v[1], cx, cy), tick: 0 }));
}
function magma(g, e, V) {                           // big orbs that roll after you, leaving lava behind them
  const [ox, oy] = g.bxOrigin(e), p = g.player, a = angleTo(ox, oy, p.x, p.y);
  for (const off of [-0.7, 0, 0.7]) {
    const b = g.bxShot(e, ox, oy + 0.6, a + off, { shot: 'magma_orb', speed: 2.4, range: 99, dmg: V.dmg || 130, size: 0.7, mv: { seek: 0.9 } });
    b.roll = { drop: 0 }; b.life = 7;
  }
}
function quake(g, e, V) {                           // three rings, each faster than the last: they catch each other up
  [[0, 3], [0.3, 4.4], [0.6, 6]].forEach(([t, sp], k) => e.bx.vol.push({ t, V: { form: 'ring', shot: 'quake_shard', count: 20, rot: 0.08 * k, speed: sp, range: 13, dmg: V.dmg || 120 } }));
  g.vx({ k: 'shake', amt: 6 });
}

// loose rivets (P1 pressure): one rivet at you that ricochets three times: the forge fills up with them
function looseRivet(g, e, V) {
  const p = g.player, [ox, oy] = g.bxOrigin(e), b = g.bxShot(e, ox, oy, angleTo(ox, oy, p.x, p.y), { shot: 'iron_rivet', speed: 8, range: 40, dmg: V.dmg || 115 });
  b.bounce = 3; b.life = 5;
}
// flail (P1): a chain of sparks swings through a half-circle in front of it, then lets go
function flail(g, e, V) {
  const p = g.player, a = angleTo(e.x, e.y, p.x, p.y), dir = R() < 0.5 ? 1 : -1;
  for (let k = 0; k < 10; k++) {
    const b = g.bxShot(e, e.x, e.y - e.hitUp, a, { shot: 'hammer_spark', speed: 0.01, range: 99, dmg: V.dmg || 120 });
    b.flail = { a0: a - dir * Math.PI / 2, sweep: dir * Math.PI, r: 1.4 + k * 0.75, t: 0, T: 1.1 }; b.life = 99;
  }
}
// vent burp (P2 pressure): a single vent glows and erupts
function ventBurp(g, e) {
  const S = e.bx, all = vents(g, e);
  if (!all.length) return;
  const v = all[Math.floor(R() * all.length)], p = g.player;
  (S.glow = S.glow || []).push({ x: v[0], y: v[1], at: g.t + 0.7, until: g.t + 1.6, a: angleTo(v[0], v[1], p.x, p.y), tick: 0 });
}
// core flare (P3 pressure): a ring of rivets from the core, each ricocheting once
function coreFlare(g, e, V) {
  const [ox, oy] = g.bxOrigin(e), a0 = R() * TAU;
  for (let k = 0; k < 10; k++) { const b = g.bxShot(e, ox, oy, a0 + (k / 10) * TAU, { shot: 'iron_rivet', speed: 6.5, range: 30, dmg: V.dmg || 115 }); b.bounce = 1; b.life = 4; }
}
// the finale, MELTDOWN: the floor glows and turns to lava in patches near you, the vents roar in turn round the forge,
// and the core throws your shots back
const finale = {
  at: 0.12, dur: 12, name: 'Meltdown', say: 'keep off the glow',
  start(g, e) { e.bx.melt = { patch: 0.3, vent: 0, k: 0, patches: [] }; e.reflectUntil = g.t + 12; e.reflectDmg = 110; e.reflectProj = SHOT('hammer_spark'); },
  update(g, e, dt) {
    const S = e.bx, M = S.melt, p = g.player, m = g.map, all = vents(g, e);
    if ((M.patch -= dt) <= 0) {
      M.patch = 0.75;
      const a = R() * TAU, d = R() * 3.5;
      M.patches.push({ x: Math.floor(p.x + Math.cos(a) * d), y: Math.floor(p.y + Math.sin(a) * d), at: g.t + 0.8 });
    }
    for (const P of M.patches) if (!P.done && g.t >= P.at) {
      P.done = true;
      for (let y = P.y - 1; y <= P.y + 1; y++) for (let x = P.x - 1; x <= P.x + 1; x++) {
        const i = y * m.w + x;
        if (m.tiles[i] !== TID.emberfloor) continue;
        m.tiles[i] = TID.emberlava; (S.lava = S.lava || []).push({ i, until: g.t + 3.2 });
      }
      g.vx({ k: 'burst', x: P.x + 0.5, y: P.y + 0.5, n: 10, colors: ['#ff8c1e', '#ffd84a', '#ff3a1a'] });
    }
    M.patches = M.patches.filter((P) => !P.done);
    if (all.length && (M.vent -= dt) <= 0) {
      M.vent = 1.0;
      const v = all[M.k++ % all.length];
      (S.glow = S.glow || []).push({ x: v[0], y: v[1], at: g.t + 0.6, until: g.t + 1.7, a: angleTo(v[0], v[1], p.x, p.y), tick: 0 });
    }
  },
  end(g, e) { e.reflectUntil = 0; e.bx.melt = null; },
};

export default {
  id: 'forgeheart_colossus', name: 'The Forgeheart Colossus', biome: 'dungeon', hp: 520000, def: 40, xp: 20000, r: 2, speed: 1.1, keep: 6, faces: true,
  tempo: 0.64, dmgScale: 1.6, finale,
  phases: {
    1: { move: 'pace', pressure: [{ every: 1.6, special: 'looseRivet', delay: 1.2, dmg: 115 }], patterns: [
      { name: 'hammer slam', windup: 0.8, recover: 0.6, special: 'slam', dmg: 115 },
      { name: 'rivets', windup: 0.6, recover: 0.5, special: 'rivets', dmg: 120 },
      { name: 'flail', windup: 0.8, recover: 0.6, special: 'flail', dmg: 120 },
    ] },
    2: { move: 'pace', pressure: [{ every: 1.15, special: 'ventBurp' }, { every: 2.6, special: 'looseRivet', dmg: 115 }], patterns: [
      { name: 'skipping slag', windup: 0.7, recover: 0.5, special: 'slag', dmg: 125 },
      { name: 'vent flames', windup: 0.5, recover: 1.0, special: 'flames', dmg: 125 },
      { name: 'flail', windup: 0.6, recover: 0.5, special: 'flail', dmg: 120 },
      { name: 'skipping slag', windup: 0.6, recover: 0.5, special: 'slag', dmg: 125 },
      { name: 'the blazing core', windup: 0.7, recover: 0.8, special: 'core' },
    ] },
    3: { move: 'center', pressure: [{ every: 2.2, special: 'coreFlare', dmg: 115 }, { every: 4.5, special: 'magma', delay: 2.5, dmg: 130 }], patterns: [
      { name: 'quake rings', windup: 0.7, recover: 0.5, special: 'quake', dmg: 120 },
      { name: 'every vent', windup: 0.5, recover: 1.0, special: 'flames', all: true, dmg: 130 },
      { name: 'hammer slam', windup: 0.6, recover: 0.5, special: 'slam', dmg: 120 },
      { name: 'flail', windup: 0.6, recover: 0.5, special: 'flail', dmg: 125 },
    ] },
  },
  specials: { slam, halfRing, rivets, rivet, core, slag, flames, magma, quake, looseRivet, flail, ventBurp, coreFlare },
  update(g, e, dt) {
    const S = e.bx, m = g.map;
    for (const b of g.projectiles) {                 // the flail's chain swings round it, then flies off on its tangent
      const F = b.flail;
      if (!F || b.bxOf !== e) continue;
      F.t += dt;
      const k = Math.min(1, F.t / F.T), a = F.a0 + F.sweep * k, [ox, oy] = g.bxOrigin(e);
      b.x = ox + Math.cos(a) * F.r; b.y = oy + Math.sin(a) * F.r; b.a = a + Math.sign(F.sweep) * Math.PI / 2;
      if (k >= 1) { b.flail = null; b.vx = Math.cos(b.a) * 6; b.vy = Math.sin(b.a) * 6; b.life = 1.8; }
    }
    for (const G of S.glow || []) {                  // the vents' columns
      if (g.t < G.at || g.t > G.until) continue;
      if ((G.tick -= dt) <= 0) { G.tick = 0.1; g.bxShot(e, G.x, G.y - 0.3, G.a + (R() - 0.5) * 0.12, { shot: 'vent_flame', speed: 10, range: 15, dmg: 125 }); }
    }
    if (S.glow) S.glow = S.glow.filter((G) => g.t <= G.until);
    for (const b of g.projectiles) {                 // rolling magma leaves lava that cools after a while
      if (!b.roll || b.bxOf !== e) continue;
      if ((b.roll.drop -= dt) > 0) continue;
      b.roll.drop = 0.12;
      const i = Math.floor(b.y + 0.3) * m.w + Math.floor(b.x);
      if (m.tiles[i] !== TID.emberfloor) continue;
      m.tiles[i] = TID.emberlava;
      (S.lava = S.lava || []).push({ i, until: g.t + 4 });
    }
    if (S.lava) { for (const L of S.lava) if (g.t > L.until && m.tiles[L.i] === TID.emberlava) m.tiles[L.i] = TID.emberfloor; S.lava = S.lava.filter((L) => g.t <= L.until); }
  },
  onPhase(g, e, ph) { if (ph === 2) core(g, e); },
  onDeath(g, e) { const S = e.bx, m = g.map; S.glow = []; S.melt = null; e.reflectUntil = 0; for (const L of S.lava || []) if (m.tiles[L.i] === TID.emberlava) m.tiles[L.i] = TID.emberfloor; S.lava = []; },
  drawGround(r, g, e) {                              // a vent about to roar glows
    const b = r.b;
    for (const G of e.bx.glow || []) {
      if (g.t > G.at) continue;
      const [x, y] = r.proj(G.x, G.y), k = 1 - (G.at - g.t);
      b.globalAlpha = 0.3 + 0.5 * k; b.fillStyle = Math.floor(g.t * 12) % 2 ? '#ffd84a' : '#ff6a1a';
      b.beginPath(); b.ellipse(Math.round(x), Math.round(y), 8 + 4 * k, 5 + 2 * k, 0, 0, TAU); b.fill();
      b.globalAlpha = 0.35 * k; b.fillStyle = '#ffd84a';
      for (let d = 1; d < 13; d += 1) { const [qx, qy] = r.proj(G.x + Math.cos(G.a) * d, G.y + Math.sin(G.a) * d); b.fillRect(Math.round(qx) - 1, Math.round(qy) - 1, 2, 2); }
      b.globalAlpha = 1;
    }
  },
  loot: [{ id: 'emberbrand_greatsword', p: 0.1 }, { id: 'cinderwood_staff', p: 0.1 }, { id: 'runeplate_armor', p: 0.1 }, { id: 'emberheart_ring', p: 0.1 }, { id: 'colossus_core', p: 0.08 },
    { id: 'runic_aegis', p: 0.06 }, { id: 'forgeheart_maul', p: 0.02 }, { id: 'key_ember', p: 0.06 },
    { slot: 'weapon', tiers: [9, 10], p: 1 }, { slot: 'armor', tiers: [10, 11], p: 1 }, { slot: 'ability', tiers: [4, 5], p: 0.8 }, { slot: 'ring', tiers: [4, 5], p: 0.8 }, { stat: true, p: 1 }, { stat: true, p: 1 }],
  lootLuck: 2,
};
