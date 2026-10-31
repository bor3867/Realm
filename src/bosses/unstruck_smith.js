// The Unstruck: the Drowned Forge's boss on the boss framework (2026-10-20). "Something stands at the anvil now, still
// swinging. We call it the Unstruck, because nothing it hits has ever stopped it." The god-anvil sits in the middle of
// its forge (drawn on the floor); everything it does comes back to the hammer and the anvil. Its own mechanics, no one
// else's: the hammer it throws comes back to its hand; the anvil it strikes throws rings of sparks from the anvil, not
// from itself; the quench (a checkerboard of steam); the cracks the sea comes in through (marked, then they flood);
// its charges along a marked line; hammers falling in crosses. Last: the anvil finally rings.
// Art: tools/build_unstruck_smith.py ('bx_unstruck_smith', shots 'us_shots/unstruck_smith.<name>').
const TAU = Math.PI * 2, R = Math.random;
const angleTo = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);
const arena = (e) => e.bx.arena || { x: e.x - 12, y: e.y - 10, w: 24, h: 18 };
const anvil = (e) => { const A = arena(e); return [A.x + A.w / 2, A.y + A.h / 2 + 1]; };
const players = (g) => (g.netTargets && g.netTargets.length ? g.netTargets : [g.player]).filter((q) => q && !q.dead);
const target = (g, e) => { const L = players(g); return L.length ? L.reduce((a, b) => (Math.hypot(b.x - e.x, b.y - e.y) < Math.hypot(a.x - e.x, a.y - e.y) ? b : a)) : g.player; };
const STEAM = ['#cfe8f0', '#ffffff'], BRINE = ['#2a7ac8', '#7ad0ff'], HOT = ['#ff8a1f', '#ffd650'];
function mark(g, e, x, y, r, delay, dmg, colors, shards, shot) {
  g.fx.push({ kind: 'zone', src: e, x, y, r, t: 0, delay, life: delay + 0.15, dmg: g.bxDmg(e, dmg), by: e.D.name, done: false, colors, shards: shards || 0, proj: shot ? `us_shots/unstruck_smith.${shot}` : undefined });
}

// ---- the hammer: thrown, it flies out and comes back to its hand (catch it on the way back too)
function hammers(g, e, V) {
  const [ox, oy] = g.bxOrigin(e), q = target(g, e), a = angleTo(ox, oy, q.x, q.y), n = V.n || 1;
  for (let k = 0; k < n; k++) {
    const off = n > 1 ? (k / (n - 1) - 0.5) * (V.spread || 0.9) : 0;
    const b = g.bxShot(e, ox, oy, a + off, { shot: 'hammer', speed: V.speed || 8, range: 99, dmg: V.dmg || 140, size: 0.6 });
    b.life = 6; b.usRet = { t: 0, T: V.out || 1.1, curve: V.curve ? (k % 2 ? 1 : -1) * V.curve : 0 };
  }
}
// ---- the anvil: struck, it throws rings of sparks out of itself, one after another (each with gaps)
function anvilRing(g, e, V) {
  const [ax, ay] = anvil(e);
  e.usStrikeUntil = g.t + 0.4;
  for (let k = 0; k < (V.rings || 3); k++) e.bx.vol.push({ t: k * (V.every || 0.45), V: { form: 'special', name: 'anvilWave', k, dmg: V.dmg || 120 } });
  g.vx({ k: 'shake', amt: 5 });
}
function anvilWave(g, e, V) {
  const [ax, ay] = anvil(e), n = 22, gap = Math.floor(R() * n), off = V.k * 0.14;
  for (let i = 0; i < n; i++) { if (((i - gap + n) % n) < 3) continue; g.bxShotAt(e, ax, ay, 0.5, off + (i / n) * TAU, { shot: 'spark', speed: 4 + V.k * 0.6, range: 14, dmg: V.dmg }); }
}
// the anvil sings (2026-10-31: a four-star, but its first phase was the gentlest of any): struck and left ringing, the
// anvil throws sparks in two arms that wheel round it, so the safe side keeps moving, while the hammer comes for you
function anvilSings(g, e, V) {
  e.usStrikeUntil = g.t + 0.4;
  const dir = R() < 0.5 ? 1 : -1;
  e.bx.vol.push({ t: 0, V: { form: 'spiral', shot: 'spark', arms: V.arms || 2, dur: V.dur || 2.6, every: 0.11, turn: 0.24 * dir, speed: 4.4, range: 14, dmg: V.dmg || 115, from: (gg, ee) => gg.up(...anvil(ee), 0.5) } });
  e.bx.vol.push({ t: 0.9, V: { form: 'special', name: 'hammers', n: 1, dmg: (V.dmg || 115) + 20 } });
  g.vx({ k: 'shake', amt: 4 });
}
// ---- the quench: steam rises from the floor in a checkerboard, then the other squares
function quench(g, e, V) {
  const A = arena(e), sz = 2, par0 = R() < 0.5 ? 0 : 1;
  for (const [par, delay] of [[par0, V.delay || 1.3], [1 - par0, (V.delay || 1.3) + (V.gap || 1.6)]]) {
    for (let j = 0; j * sz < A.h; j++) for (let i = 0; i * sz < A.w; i++) if ((i + j) % 2 === par) mark(g, e, A.x + i * sz + 1, A.y + j * sz + 1, 1.05, delay, V.dmg || 110, STEAM, 0);
  }
}
function rust(g, e, V) {                                   // flakes of rust drifting off it, slow, at you
  const [ox, oy] = g.bxOrigin(e), q = target(g, e), a = angleTo(ox, oy, q.x, q.y);
  for (let k = -1; k <= 1; k++) g.bxShot(e, ox, oy, a + k * 0.35, { shot: 'rust', speed: 3, range: 12, dmg: V.dmg || 95 });
}
// ---- the sea comes in: cracks open across the floor (marked), then seawater bursts along them
function cracks(g, e, V) {
  const A = arena(e), q = target(g, e), n = V.n || 3;
  for (let k = 0; k < n; k++) {
    const a = R() * Math.PI, through = k === 0, cx = through ? q.x : A.x + 2 + R() * (A.w - 4), cy = through ? q.y : A.y + 2 + R() * (A.h - 4), L = Math.max(A.w, A.h) * 1.2;
    g.fx.push({ kind: 'lane', x: cx - Math.cos(a) * L / 2, y: cy - Math.sin(a) * L / 2, a, len: L, w: 0.55, delay: V.delay || 1.2, t: 0, life: (V.delay || 1.2) + (V.life || 1.6), dmg: g.bxDmg(e, V.dmg || 130), by: e.D.name, hitT: 0, cols: ['#7ad0ff', '#2a7ac8', '#7ad0ff', '#ffffff'] });
  }
}
function drip(g, e, V) {                                   // brine dripping from the ceiling, marked, where you stand
  const q = players(g)[Math.floor(R() * players(g).length)] || g.player, a = R() * TAU, d = R() * 2.5;
  mark(g, e, q.x + Math.cos(a) * d, q.y + Math.sin(a) * d, 1.0, 1.0, V.dmg || 100, BRINE, 5, 'brine');
}
// ---- unstoppable: it charges along a marked line, throwing sparks to either side as it goes
function charge(g, e, V) {
  const A = arena(e), q = target(g, e), a = angleTo(e.x, e.y, q.x, q.y), L = Math.min(14, Math.hypot(q.x - e.x, q.y - e.y) + 4);
  const x1 = Math.max(A.x + 2, Math.min(A.x + A.w - 2, e.x + Math.cos(a) * L)), y1 = Math.max(A.y + 2, Math.min(A.y + A.h - 2, e.y + Math.sin(a) * L));
  const len = Math.hypot(x1 - e.x, y1 - e.y), delay = V.delay || 0.9;
  g.fx.push({ kind: 'lane', x: e.x, y: e.y, a, len, w: 1.1, delay, t: 0, life: delay + len / 14 + 0.2, dmg: g.bxDmg(e, V.dmg || 160), by: e.D.name, hitT: 0 });
  e.bx.usCharge = { x0: e.x, y0: e.y, x1, y1, at: g.t + delay, until: g.t + delay + len / 14, spark: 0 };
}
function hammerfall(g, e, V) {                             // hammers fall in crosses round each player: the gaps are between the arms
  for (const q of players(g)) for (const [dx, dy] of [[0, 0], [2, 0], [-2, 0], [0, 2], [0, -2], [4, 0], [-4, 0], [0, 4], [0, -4]])
    mark(g, e, q.x + dx, q.y + dy, 0.95, (V.delay || 1.2) + Math.hypot(dx, dy) * 0.08, V.dmg || 140, HOT, dx || dy ? 0 : 6, 'rivet');
}

// ---- last: THE ANVIL RINGS. For the first time, the anvil rings: ring after ring of sparks, faster and faster
const finale = {
  at: 0.1, dur: 9, name: 'The Anvil Rings', say: 'for the first time, it rings', after: 1.5,
  start(g, e) { e.bx.rings = { t: 0.4, k: 0 }; },
  update(g, e, dt, T) {
    const Q = e.bx.rings;
    if ((Q.t -= dt) <= 0) { Q.t = Math.max(0.45, 1.1 - T * 0.07); Q.k++; anvilWave(g, e, { k: Q.k % 4, dmg: 125 }); e.usStrikeUntil = g.t + 0.3; }
  },
  end(g, e) { e.bx.rings = null; },
};

export default {
  id: 'unstruck_smith', art: 'unstruck_smith', shotSheet: 'us_shots', name: 'The Unstruck', biome: 'dungeon', hp: 240000, def: 30, xp: 12000,
  r: 2, speed: 1.0, keep: 5, faces: true, tempo: 0.75, dmgScale: 1.3, finale,   // (was 0.8 and 1.05: 2026-10-31, light for four stars)
  phases: {
    1: { move: 'pace', pressure: [{ every: 2.2, special: 'rust', delay: 1.8, dmg: 95 }], patterns: [
      { name: 'the returning hammer', windup: 0.7, recover: 0.8, special: 'hammers', n: 1, dmg: 140 },
      { name: 'the anvil struck', windup: 0.8, recover: 0.7, special: 'anvilRing', rings: 3, dmg: 120 },
      { name: 'the quench', windup: 0.6, recover: 1.4, special: 'quench', dmg: 110 },
      { name: 'the returning hammer', windup: 0.6, recover: 0.7, special: 'hammers', n: 3, spread: 1.1, dmg: 135 },
      { name: 'the anvil sings', windup: 0.7, recover: 0.6, special: 'anvilSings', arms: 2, dur: 2.4, dmg: 115 },
    ] },
    2: { move: 'pace', pressure: [{ every: 1.7, special: 'drip', delay: 1.5, dmg: 100 }], patterns: [
      { name: 'the sea comes in', windup: 0.7, recover: 0.8, special: 'cracks', n: 3, dmg: 130 },
      { name: 'curving hammers', windup: 0.6, recover: 0.7, special: 'hammers', n: 2, spread: 0.6, curve: 2.4, dmg: 140 },
      { name: 'the anvil struck', windup: 0.7, recover: 0.6, special: 'anvilRing', rings: 4, dmg: 120 },
      { name: 'the quench', windup: 0.5, recover: 1.2, special: 'quench', delay: 1.1, gap: 1.3, dmg: 115 },
      { name: 'the sea comes in', windup: 0.6, recover: 0.8, special: 'cracks', n: 4, dmg: 130 },
      { name: 'the anvil sings', windup: 0.6, recover: 0.6, special: 'anvilSings', arms: 3, dur: 2.6, dmg: 120 },
    ] },
    3: { move: 'smithCharge', pressure: [{ every: 2.4, special: 'drip', dmg: 105 }, { every: 3.4, special: 'rust', dmg: 100 }], patterns: [
      { name: 'unstoppable', windup: 0.5, recover: 0.5, special: 'charge', dmg: 160 },
      { name: 'unstoppable', windup: 0.4, recover: 0.5, special: 'charge', dmg: 160 },
      { name: 'hammers falling', windup: 0.6, recover: 0.7, special: 'hammerfall', dmg: 140 },
      { name: 'unstoppable', windup: 0.4, recover: 0.6, special: 'charge', dmg: 160 },
      { name: 'the anvil struck', windup: 0.6, recover: 0.6, special: 'anvilRing', rings: 4, every: 0.38, dmg: 125 },
      { name: 'curving hammers', windup: 0.5, recover: 0.6, special: 'hammers', n: 3, spread: 1, curve: 2.4, dmg: 145 },
    ] },
  },
  moves: {
    smithCharge(g, e, dt) {                                // III: when it charges, nothing stops it; otherwise it stalks you
      const C = e.bx.usCharge;
      if (C && g.t >= C.at) {
        if (g.t >= C.until) { e.bx.usCharge = null; return; }
        const k = Math.min(1, (g.t - C.at) / Math.max(0.05, C.until - C.at));
        e.x = C.x0 + (C.x1 - C.x0) * k; e.y = C.y0 + (C.y1 - C.y0) * k;
        if ((C.spark -= dt) <= 0) {                          // sparks thrown off to either side
          C.spark = 0.12; const a = angleTo(C.x0, C.y0, C.x1, C.y1);
          for (const s of [-1, 1]) g.bxShotAt(e, e.x, e.y, 1, a + s * Math.PI / 2, { shot: 'spark', speed: 4, range: 6, dmg: 110 });
        }
        return;
      }
      if (C) return;                                          // (it plants its feet while the line is marked)
      const q = target(g, e), d = Math.hypot(q.x - e.x, q.y - e.y);
      if (d > 3) g.moveCircle(e, ((q.x - e.x) / d) * 1.3 * dt, ((q.y - e.y) / d) * 1.3 * dt, 0.8);
    },
  },
  specials: { hammers, anvilRing, anvilWave, anvilSings, quench, rust, cracks, drip, charge, hammerfall },
  onWake(g) { g.banner('THE UNSTRUCK · still swinging', 3000); },
  onPhase(g, e, ph) {
    if (ph === 2) g.banner('THE ANVIL CRACKS · and the sea comes in', 2800);
    if (ph === 3) g.banner('IT GLOWS RED · nothing it hits has ever stopped it', 2800);
  },
  update(g, e, dt) {                                       // its thrown hammers come back to its hand
    for (const b of g.projectiles) {
      const T = b.usRet;
      if (!T || b.bxOf !== e) continue;
      T.t += dt;
      const sp = Math.hypot(b.vx, b.vy) || 8;
      if (T.t > T.T) {
        const [hx, hy] = g.bxOrigin(e), d = Math.hypot(hx - b.x, hy - b.y);
        if (d < 0.9) { b.life = 0; continue; }
        const a = angleTo(b.x, b.y, hx, hy) + (T.curve ? T.curve * Math.min(0.5, 1 / Math.max(1, d)) : 0);
        b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp; b.a = a;
      } else if (T.curve) { const a = Math.atan2(b.vy, b.vx) + T.curve * 0.35 * dt; b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp; b.a = a; }
    }
  },
  onDeath(g, e) { e.bx.usCharge = null; g.banner('THE UNSTRUCK STOPS. THE HAMMER FALLS SILENT.', 3400); if (!g.netTargets && g.trophy) g.trophy('unstruck'); },
  // its light in the dark forge: the furnace in its chest, and the anvil (a flare when struck)
  lights(g, e) { const [ax, ay] = anvil(e); return [{ x: e.x, y: e.y, h: 1.6, r: 120, col: e.bx && e.bx.phase === 3 ? '#ff7a3a' : '#ffb070' }, { x: ax, y: ay, h: 0.5, r: e.usStrikeUntil > g.t ? 150 : 70, col: '#ffd690' }]; },
  drawGround(r, g, e) {                                    // the god-anvil in the middle of the forge (it glows when struck)
    const b = r.b, [ax, ay] = anvil(e), [x, y] = r.proj(ax, ay), hot = e.usStrikeUntil > g.t;
    b.fillStyle = 'rgba(0,0,0,0.35)'; b.fillRect(Math.round(x) - 14, Math.round(y) + 1, 28, 4);
    b.fillStyle = '#0a0810'; b.fillRect(Math.round(x) - 13, Math.round(y) - 13, 26, 9); b.fillRect(Math.round(x) - 7, Math.round(y) - 5, 14, 6); b.fillRect(Math.round(x) - 10, Math.round(y), 20, 3);
    b.fillStyle = hot ? '#ffd650' : '#4a5458'; b.fillRect(Math.round(x) - 12, Math.round(y) - 12, 24, 7); b.fillRect(Math.round(x) - 6, Math.round(y) - 5, 12, 5); b.fillRect(Math.round(x) - 9, Math.round(y), 18, 2);
    b.fillStyle = hot ? '#fff6c8' : '#7a8c90'; b.fillRect(Math.round(x) - 12, Math.round(y) - 12, 24, 2);
  },
  loot: [{ id: 'knuckle_of_the_unstruck', p: 0.15 }, { id: 'billet_of_the_first_oath', p: 0.15 }, { id: 'the_last_noon', p: 0.1 }, { id: 'unstruck_anvil', p: 0.12 }, { id: 'furnace_heart_coat', p: 0.12 },
    { slot: 'weapon', tiers: [9, 10], p: 1 }, { slot: 'armor', tiers: [9, 11], p: 1 }, { slot: 'ability', tiers: [4, 5], p: 0.8 }, { slot: 'ring', tiers: [4, 5], p: 0.8 },
    { stat: true, p: 1 }, { stat: true, p: 1 }, { stat: true, p: 0.5 }],
  lootLuck: 2,
};
