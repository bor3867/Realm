// Glacius, the Frozen Wyrm: the boss of Frostveil Hollows (docs/design/boss_glacius.md).
// Its arena is the Frozen Lake: ice you slide on inside a snow rim, four frost braziers on the rim. Its own mechanics:
// a breath that sweeps, lances that freeze the ground where they stop, blizzard orbs that drift and burst, a wing beat
// whose gust sends you sliding, a glide that leaves a fence of lances, rings whose gaps spiral, a rippling aurora,
// and braziers it puts out one by one. Frost shots add chill (src/frostveil.js).
import { lift, liftO } from '../util.js';
const TAU = Math.PI * 2, R = Math.random;
const angleTo = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);
const centre = (e) => { const A = e.bx.arena; return A ? [A.x + A.w / 2, A.y + A.h / 2] : [e.x, e.y]; };

// the windup of the sweep: it rears to one side (the side the breath starts from)
function sweepTell(g, e) { e.bx.sweepDir = e.bx.sweepDir === 1 ? -1 : 1; e.face = e.bx.sweepDir > 0; }
// frost breath: three puffs every 0.06 s while the head swings 130 degrees
function sweep(g, e, V) {
  const S = e.bx, p = g.player, [ox, oy] = g.bxOrigin(e), mid = angleTo(ox, oy, p.x, p.y), arc = 2.27, steps = 22, dir = S.sweepDir || 1;
  for (let k = 0; k < steps; k++) {
    const a = mid - dir * (arc / 2) + dir * (arc * k) / (steps - 1);
    S.vol.push({ t: k * 0.06, V: { form: 'fan', shot: 'frost_breath', count: 3, spread: 0.18, angle: a, speed: 6.5, range: 15, dmg: V.dmg || 100, chill: 12 } });
  }
}
// ice lances: three lines of five; where each line stops, the ground freezes for a while
function lances(g, e, V) {
  const p = g.player, [ox, oy] = g.bxOrigin(e), aim = angleTo(ox, oy, p.x, p.y);
  for (const off of [-0.35, 0, 0.35]) {
    const a = aim + off;
    for (let j = 0; j < 5; j++) g.bxShot(e, ox, oy, a, { shot: 'ice_lance', speed: 9 + j * 0.9, range: 15, dmg: V.dmg || 110 });   // (across the lake: 9 left its far shore safe)
    let L = 0;
    while (L < 15 && !g.map.solid[Math.floor(oy + Math.sin(a) * (L + 0.5)) * g.map.w + Math.floor(ox + Math.cos(a) * (L + 0.5))]) L += 0.5;
    g.fvLater(L / 13, () => g.fvFreeze(ox + Math.cos(a) * L, oy + Math.sin(a) * L, 1, 6));
  }
}
// blizzard orbs: they drift after you, then burst into puffs of frost
function orbs(g, e, V) {
  const p = g.player, [ox, oy] = g.bxOrigin(e), aim = angleTo(ox, oy, p.x, p.y);
  for (const off of [-0.6, 0, 0.6]) {
    const b = g.bxShot(e, ox, oy, aim + off, { shot: 'blizzard_orb', speed: 2.6, range: 9, dmg: V.dmg || 105, size: 0.6, mv: { seek: 0.5 }, chill: 15 });
    b.burst = { n: 8, dmg: Math.round((V.dmg || 105) * 0.85), proj: 'bx_shots/glacius_frozen_wyrm.frost_breath' };
  }
}
// rime crawl (P1 pressure): ice erupts along the ground from the wyrm to where you stood, tile by tile, each
// eruption throwing a shard to either side
function rimeCrawl(g, e, V) {
  const p = g.player, ox = e.x, oy = e.y, a = angleTo(ox, oy, p.x, p.y), L = Math.hypot(p.x - ox, p.y - oy) + 3, m = g.map;
  for (let u = 1.5, k = 0; u < L; u += 0.9, k++) {
    const x = ox + Math.cos(a) * u, y = oy + Math.sin(a) * u;
    if (m.solid[Math.floor(y) * m.w + Math.floor(x)]) break;
    g.fvLater(k * 0.07, () => {
      if (e.dead || e.bx.state === 'death' || e.bx.state === 'morph') return;
      for (const side of [-1, 1]) g.bxShot(e, x, y, a + side * Math.PI / 2, { shot: 'ice_lance', speed: 3.6, range: 2.6, dmg: V.dmg || 95 });
      g.vx({ k: 'burst', x, y, n: 4, colors: ['#ffffff', '#cfffff', '#8ad8ff'] });
    });
  }
}
// glacier maze (P1, P3): five rows of frost sweep down the lake one after another, each row's gap a step aside
function maze(g, e, V) {
  const n = 20, gw = 3;
  let gap = 2 + Math.floor(R() * (n - gw - 4));
  for (let k = 0; k < 5; k++) {
    e.bx.vol.push({ t: k * 0.55, V: { form: 'special', name: 'mazeRow', gap, n, gw, dmg: V.dmg || 100 } });
    gap = Math.max(0, Math.min(n - gw, gap + (R() < 0.5 ? -2 : 2)));
  }
}
function mazeRow(g, e, V) {
  const A = e.bx.arena || { x: e.x - 18, y: e.y - 20, w: 36, h: 40 };
  for (let k = 0; k < V.n; k++) {
    if (k >= V.gap && k < V.gap + V.gw) continue;
    g.bxShot(e, A.x + 1 + ((k + 0.5) / V.n) * (A.w - 2), A.y + 1, Math.PI / 2, { shot: 'frost_breath', speed: 4.2, range: A.h, dmg: V.dmg, chill: 8 });
  }
}
// frost wake (P2 pressure): as it circles it drops a pair of lances pointing in at the middle of the lake
function frostWake(g, e, V) {
  if (e.bx.glideTo) return;
  const [cx, cy] = centre(e), a = angleTo(e.x, e.y, cx, cy);
  for (const off of [-0.22, 0.22]) g.bxShot(e, ...lift(e.x, e.y, 0.3), a + off, { shot: 'ice_lance', speed: 4.2, range: 27, dmg: V.dmg || 95 });
}
// heart shards (P3 pressure): three quick shards from the bare heart, straight at you
function heartShards(g, e, V) {
  const p = g.player, [ox, oy] = g.bxOrigin(e), a = angleTo(ox, oy, p.x, p.y);
  for (const off of [-0.1, 0, 0.1]) g.bxShot(e, ox, oy, a + off, { shot: 'core_nova', speed: 9.5, range: 16, dmg: V.dmg || 110 });
}
// permafrost (P3 pressure): a ring of lances forms in place round the heart, further out each time, then flies outward
function permafrost(g, e, V) {
  const S = e.bx, [cx, cy] = centre(e);
  S.pfR = (S.pfR || 0) >= 11 ? 3 : (S.pfR || 0) + 3;
  const r = S.pfR, n = Math.round(r * 3.2), gap = Math.floor(R() * n);
  for (let k = 0; k < n; k++) {
    if ((k - gap + n) % n < 2) continue;
    const a = (k / n) * TAU, b = g.bxShot(e, cx + Math.cos(a) * r, cy + Math.sin(a) * r, a, { shot: 'ice_lance', speed: 3, range: 12, dmg: V.dmg || 100, mv: { hold: 0.7 } });
    b.t = 0;
  }
}
// wing beat: twice, a fan from each wingtip and a gust that pushes you away
function wingbeat(g, e, V) { for (let k = 0; k < 2; k++) e.bx.vol.push({ t: k * 0.65, V: { form: 'special', name: 'beat', dmg: V.dmg } }); }
function beat(g, e, V) {
  const p = g.player;
  for (const side of [-1, 1]) {
    const wx = e.x + side * 2.3, wy = e.y - e.hitUp - 0.4, a = angleTo(wx, wy, p.x, p.y);
    for (let k = 0; k < 7; k++) g.bxShot(e, wx, wy, a + (k / 6 - 0.5) * 1.1, { shot: 'wing_shard', speed: 7, range: 16, dmg: V.dmg || 100 });
  }
  const a = angleTo(e.x, e.y, p.x, p.y);
  p.gust = { vx: Math.cos(a) * 6, vy: Math.sin(a) * 6, until: g.t + 0.8 };
  g.vx({ k: 'burst', ...liftO(p.x, p.y, 0.5), n: 10, colors: ['#ffffff', '#cfffff', '#8ad8ff'] });
}
// glide: it dives across the lake straight through where you stand, dropping a fence of lances behind it
function glide(g, e) {
  const S = e.bx, p = g.player, [cx, cy] = centre(e), a = angleTo(e.x, e.y, p.x, p.y);
  let tx = p.x + Math.cos(a) * 7, ty = p.y + Math.sin(a) * 7;
  const dc = Math.hypot(tx - cx, ty - cy);
  if (dc > 13) { tx = cx + ((tx - cx) / dc) * 13; ty = cy + ((ty - cy) / dc) * 13; }
  S.glideTo = { x: tx, y: ty }; S.dropT = 0; S.glideHit = false;
}
// core nova: three rings from the bare heart, each gap a step clockwise from the last
function nova(g, e, V) {
  const S = e.bx, n = 26, g0 = Math.floor(R() * n);
  S.novaRot = (S.novaRot || 0) + 0.2;
  for (let k = 0; k < 3; k++) S.vol.push({ t: k * 0.4, V: { form: 'special', name: 'novaRing', gap: (g0 + k * 3) % n, n, dmg: V.dmg || 115 } });
}
function novaRing(g, e, V) {
  const [ox, oy] = g.bxOrigin(e);
  for (let k = 0; k < V.n; k++) {
    if ((k - V.gap + V.n) % V.n < 2) continue;
    g.bxShot(e, ox, oy, e.bx.novaRot + (k / V.n) * TAU, { shot: 'core_nova', speed: 4.2, range: 16, dmg: V.dmg });
  }
}
// aurora: a curtain from the north edge whose speed follows a sine, so the front ripples and the gap leans
function aurora(g, e, V) {
  const A = e.bx.arena || { x: e.x - 18, y: e.y - 20, w: 36, h: 40 }, n = 18, gap = 1 + Math.floor(R() * (n - 5)), ph = R() * TAU;
  for (let k = 0; k < n; k++) {
    if (k >= gap && k < gap + 3) continue;
    const u = (k + 0.5) / n;
    g.bxShot(e, A.x + 1 + u * (A.w - 2), A.y + 1, Math.PI / 2, { shot: 'aurora_wave', speed: 3 + 1.1 * Math.sin(u * TAU * 1.5 + ph), range: A.h, dmg: V.dmg || 110 });
  }
}
// snuff: it breathes on a lit brazier on the rim and puts it out for good
function snuff(g, e) {
  const lit = g.map.objects.filter((o) => o.fvRim && o.lit);
  if (!lit.length) return;
  const o = lit[Math.floor(R() * lit.length)];
  g.fvSnuff(o);
  const [ox, oy] = g.bxOrigin(e), a = angleTo(ox, oy, o.x, o.y), L = Math.hypot(o.x - ox, o.y - oy);
  for (let u = 1; u < L; u += 1.2) g.vx({ k: 'burst', x: ox + Math.cos(a) * u, y: oy + Math.sin(a) * u, n: 3, colors: ['#ffffff', '#cfffff'] });
  g.banner('Glacius breathes out a brazier!', 1800);
}

// the finale, ABSOLUTE ZERO: two arms of nova spiral opposite ways from the heart while the aurora rolls
const finale = {
  at: 0.12, dur: 10, name: 'Absolute Zero', say: 'survive the cold',
  start(g, e) { const [cx, cy] = centre(e); e.x = cx; e.y = cy; e.bx.fz = { spin: 0, arm: 0, aur: 1.2 }; },
  update(g, e, dt, t) {
    const F = e.bx.fz, [ox, oy] = g.bxOrigin(e);
    F.spin += dt * (1.1 + t * 0.06);
    if ((F.arm -= dt) <= 0) {
      F.arm = 0.13;
      for (const dir of [1, -1]) for (let k = 0; k < 3; k++) g.bxShot(e, ox, oy, dir * F.spin + (k / 3) * TAU, { shot: 'core_nova', speed: 4, range: 16, dmg: 115, chill: 4 });
    }
    if ((F.aur -= dt) <= 0) { F.aur = 2.5; aurora(g, e, { dmg: 110 }); }
  },
};

export default {
  id: 'glacius_frozen_wyrm', name: 'Glacius, the Frozen Wyrm', biome: 'dungeon', hp: 300000, def: 24, xp: 14000, r: 2.2, speed: 2.6, keep: 8, faces: true,
  tempo: 0.68, dmgScale: 1, finale,   // (was 1.45, then 1.25: it killed a player standing still in 1s (after every enemy began to hit 1.5x, 2026-10-22: tools/bench_boss_hits.mjs))
  phases: {
    1: { move: 'hold', pressure: [{ every: 2.4, special: 'rimeCrawl', delay: 1.5, dmg: 95 }], patterns: [
      { name: 'frost breath', windup: 0.8, recover: 0.6, tell: 'sweepTell', special: 'sweep', dmg: 100 },
      { name: 'ice lances', windup: 0.6, recover: 0.5, special: 'lances', dmg: 110 },
      { name: 'glacier maze', windup: 0.7, recover: 0.8, special: 'maze', dmg: 100 },
      { name: 'ice lances', windup: 0.5, recover: 0.5, special: 'lances', dmg: 110 },
    ] },
    2: { move: 'circle', pressure: [{ every: 0.6, special: 'frostWake', dmg: 95 }], patterns: [
      { name: 'blizzard orbs', windup: 0.6, recover: 0.5, special: 'orbs', dmg: 105 },
      { name: 'wing beat', windup: 0.7, recover: 0.6, special: 'wingbeat', dmg: 100 },
      { name: 'glide', windup: 0.5, recover: 1.4, special: 'glide', move: 'glide' },
      { name: 'frost breath', windup: 0.7, recover: 0.5, tell: 'sweepTell', special: 'sweep', dmg: 100 },
    ] },
    3: { move: 'hold', pressure: [{ every: 1.5, special: 'heartShards', dmg: 110 }, { every: 3.4, special: 'permafrost', delay: 2, dmg: 100 }], patterns: [
      { name: 'core nova', windup: 0.7, recover: 0.6, special: 'nova', dmg: 115 },
      { name: 'aurora', windup: 0.7, recover: 0.5, special: 'aurora', dmg: 110 },
      { name: 'glacier maze', windup: 0.6, recover: 0.6, special: 'maze', dmg: 105 },
      { name: 'snuff', windup: 0.6, recover: 0.3, special: 'snuff' },
    ] },
  },
  specials: { sweepTell, sweep, lances, orbs, wingbeat, beat, glide, nova, novaRing, aurora, snuff, rimeCrawl, maze, mazeRow, frostWake, heartShards, permafrost },
  moves: {
    circle(g, e, dt) {                              // it circles the lake, above the rim
      const [cx, cy] = centre(e), S = e.bx;
      S.ca = (S.ca === undefined ? angleTo(cx, cy, e.x, e.y) : S.ca) + dt * 0.35;
      const tx = cx + Math.cos(S.ca) * 12, ty = cy + Math.sin(S.ca) * 13, d = Math.hypot(tx - e.x, ty - e.y);
      if (d > 0.1) { const s = Math.min(d, 4 * dt); e.x += ((tx - e.x) / d) * s; e.y += ((ty - e.y) / d) * s; }
    },
    glide(g, e, dt) {                               // flying: walls don't stop it; lances drop behind it as it goes
      const S = e.bx;
      if (!S.glideTo) return;
      const d = Math.hypot(S.glideTo.x - e.x, S.glideTo.y - e.y);
      if (d < 0.3) { S.glideTo = null; S.ca = undefined; return; }
      const s = Math.min(d, 9 * dt), p = g.player;
      e.x += ((S.glideTo.x - e.x) / d) * s; e.y += ((S.glideTo.y - e.y) / d) * s;
      if (!S.glideHit && !p.dead && Math.hypot(p.x - e.x, p.y - e.y) < 1.4) { S.glideHit = true; g.hurtPlayer(g.bxDmg(e, 120), e.D.name); }   // caught by the dive
      if ((S.dropT -= dt) <= 0) {
        S.dropT = 0.15;
        const b = g.bxShot(e, ...lift(e.x, e.y, 0.3), Math.PI / 2, { shot: 'ice_lance', speed: 0.01, range: 1, dmg: 95, mv: { hold: 1.5 } });
        b.life = 1.6;
      }
    },
  },
  onPhase(g, e, ph) {
    const S = e.bx;
    S.glideTo = null;
    if (ph === 3) {                                 // it crashes onto the lake; the heart is bare
      const [cx, cy] = centre(e);
      e.x = cx; e.y = cy; e.D.def = 0;
      g.vx({ k: 'shake', amt: 10 });
      g.fx.push({ kind: 'ring', x: cx, y: cy, t: 0, max: 10, color: '#ffffff' });
    }
  },
  loot: [{ id: 'glacial_fang', p: 0.1 }, { id: 'rimeheart_bow', p: 0.1 }, { id: 'wand_of_hoarfrost', p: 0.1 }, { id: 'frostweave_armor', p: 0.1 }, { id: 'ring_of_the_wyrm', p: 0.1 },
    { id: 'aurora_heart', p: 0.02 }, { id: 'key_frostveil', p: 0.06 },
    { slot: 'weapon', tiers: [8, 10], p: 1 }, { slot: 'armor', tiers: [8, 10], p: 1 }, { slot: 'ability', tiers: [3, 5], p: 0.8 }, { slot: 'ring', tiers: [3, 5], p: 0.7 }, { stat: true, p: 1 }, { stat: true, p: 0.8 }],
  lootLuck: 2,
};
