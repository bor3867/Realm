// Sunthief's Castle's defenders (the user's design, 2026-11-02: fourteen enemies, their own movement, attacks, shots,
// cooldowns; the user's sprites, 'castle_kin/<id>'; their shots 'castle_shots/<name>', tools/build_castle_kin.py).
// The generic monster AI can't do what they do (dashes, teleports, pools, portals, a blessing, a shield), so each has a
// small brain here, mixed into Game like gearmech.js. game.js hands a castle defender to kinTick once it has dealt with
// its status, stun and touch. Each attack: a telegraph (the sprite's strike frame, and its own marks on the floor), its
// aim locked as the telegraph ends unless it says it tracks, then its active part; its cooldown starts when it ends.
// They keep moving while they attack unless an attack holds them still. Damage numbers are effective ones (D(n): set
// above a Throne-geared character's Defense). The Forge Overseer, the miniboss, is on the boss engine.
import { ENEMIES } from './data/enemies.js';

const TAU = Math.PI * 2, R = Math.random, D = (n) => n + 4, deg = (d) => (d * Math.PI) / 180;
const ang = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);
const RED = ['#ff6a1c', '#ff6a1c', '#ff3a1a', '#ffffff'], GOLD = ['#ffd650', '#ffd650', '#fff6c8', '#ffffff'], VIO = ['#b884cc', '#b884cc', '#e6c8ff', '#ffffff'];

// ---------------------------------------------------------------- the helpers each brain uses (g: the game, e: the enemy)
function fire(g, e, a, sp, dmg, shot, range = 11, size = 0.35, from) {
  const [ox, oy] = from || g.up(e.x, e.y, g.shotUp(e)), haste = e.kinHaste > g.t ? 1.1 : 1;   // (the Cultist's blessing: shots a tenth quicker)
  return g.shoot('e', ox, oy, a, sp * haste, range, D(dmg), 'castle_shots/' + shot, size, false, e.D.name);
}
const fan = (g, e, a, n, spread, sp, dmg, shot, range, from) => { for (let k = 0; k < n; k++) fire(g, e, a + (n > 1 ? (k / (n - 1) - 0.5) * spread : 0), sp, dmg, shot, range, undefined, from); };
const lane = (g, e, x, y, a, len, delay, dmg = 0, w = 0.5, cols = RED, live = 0.35) => g.fx.push({ kind: 'lane', x, y, a, len, w, delay, t: 0, life: delay + (dmg ? live : 0.02), every: 0.5, dmg: dmg ? D(dmg) : 0, by: e.D.name, hitT: 0, cols });
const zone = (g, e, x, y, r, delay, dmg = 0, colors = ['#ff8a1f', '#ffd650']) => g.fx.push({ kind: 'zone', x, y, r, t: 0, delay, life: delay + 0.15, dmg: dmg ? D(dmg) : 0, by: e.D.name, done: !dmg, colors });
const pool = (g, e, x, y, r, life, dmg, col = '#ff8a1f') => g.fx.push({ kind: 'pool', x, y, r, t: 0, life, dmg: D(dmg), by: e.D.name, col });
const later = (S, t, fn) => S.q.push({ t, fn });
const step = (g, e, dx, dy) => g.moveCircle(e, dx, dy, 0.45);
function reach(g, e, a, want) {                             // how far it can go that way before a wall
  let L = 0; while (L < want) { const n = L + 0.25, x = e.x + Math.cos(a) * n, y = e.y + Math.sin(a) * n; if (g.blockedAt(x, y, 0.45)) break; L = n; }
  return L;
}
function spot(g, x0, y0, rMin, rMax) {                      // a clear place rMin..rMax from a point
  for (let k = 0; k < 16; k++) { const a = R() * TAU, r = rMin + R() * (rMax - rMin), x = x0 + Math.cos(a) * r, y = y0 + Math.sin(a) * r; if (!g.blockedAt(x, y, 0.5)) return [x, y]; }
  return null;
}
// where it aims a volley: at you, or (when its formation's conductor says so) where you'll be as the shots arrive
function vel(S) { const L = S.trail, a = L[L.length - 1]; if (!a) return [0, 0]; const b = L.find((q) => a[2] - q[2] <= 0.35) || a, dt = a[2] - b[2]; return dt > 0.05 ? [(a[0] - b[0]) / dt, (a[1] - b[1]) / dt] : [0, 0]; }
function aim(g, e, p, S, sp, x = e.x, y = e.y) { if (!S.lead) return ang(x, y, p.x, p.y); const [vx, vy] = vel(S), T = Math.min(1.2, Math.hypot(p.x - x, p.y - y) / sp); return ang(x, y, p.x + vx * T, p.y + vy * T); }
// the heavy ones: what pins you or lays the floor down (a formation takes them in turn); the rest are its volleys
const HEAVY = new Set(['Ember Dive', 'Molten Leap', 'Marked Execution', 'Wraithstep', 'Hellbound Pounce', 'Burning Hunt', 'Radiant Lance', 'Shield Bash', 'Furnace Wall', 'Sun Siphon',
  "King's Charge", 'Shattered Sun', 'Eruption Columns', 'Eclipse Blink', 'Shadow Pursuit', 'Piston Slam', 'Crushing Advance', 'Radiant Execution']);
// the field: what turns or stands a while and narrows where you can go (one at a time in a formation, alongside a heavy one)
const FIELD = new Set(['Thermal Spiral', 'Orbital Lances', 'Ritual Portals', 'Sundial Crossing', 'Furnace Vents', 'Sunspot', 'Phantom Spiral']);
function dash(S, e, a, len, speed, dmg, then) { S.dash = { vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, t: len / speed, dmg, hit: false, then, a }; }

// ---------------------------------------------------------------- how they move
// keep: between near and far from you, sidling round you between (its turn changes now and then); orbit: circling you
const keep = (near, far, sp) => (g, e, dt, p, d, S) => {
  if ((S.flip -= dt) <= 0) { S.flip = 1.5 + R() * 2; S.dir = R() < 0.5 ? 1 : -1; }
  const a = ang(p.x, p.y, e.x, e.y), k = sp * (S.slowMove || 1) * dt;
  let vx = 0, vy = 0;
  if (d > far) { vx = -Math.cos(a); vy = -Math.sin(a); } else if (d < near) { vx = Math.cos(a); vy = Math.sin(a); }
  vx += -Math.sin(a) * S.dir * 0.8; vy += Math.cos(a) * S.dir * 0.8;
  const L = Math.hypot(vx, vy) || 1; step(g, e, (vx / L) * k, (vy / L) * k);
};
const orbit = (r0, r1, sp) => (g, e, dt, p, d, S) => {        // erratic: its circle's size and its way round both change
  if ((S.flip -= dt) <= 0) { S.flip = 0.8 + R() * 1.6; S.dir = R() < 0.6 ? -S.dir || 1 : S.dir || 1; S.ring = r0 + R() * (r1 - r0); }
  const a = ang(p.x, p.y, e.x, e.y) + S.dir * 0.9, tx = p.x + Math.cos(a) * (S.ring || r0), ty = p.y + Math.sin(a) * (S.ring || r0), L = Math.hypot(tx - e.x, ty - e.y) || 1, k = sp * dt;
  step(g, e, ((tx - e.x) / L) * Math.min(L, k), ((ty - e.y) / L) * Math.min(L, k));
};

// ---------------------------------------------------------------- how each moves (2026-11-02, the user: "I do not want 14
// different-looking enemies using essentially the same AI"): each its own way, its own distance, its own rhythm
const toward = (g, e, tx, ty, sp, dt) => { const L = Math.hypot(tx - e.x, ty - e.y) || 1, k = Math.min(L, sp * dt); step(g, e, ((tx - e.x) / L) * k, ((ty - e.y) / L) * k); return L; };
const MOVE = {
  // the Bat: an aerial predator: it picks a point past you at an angle, swoops through at speed, overshoots, circles a
  // moment, and comes again from somewhere else
  swoop: (g, e, dt, p, d, S) => {
    if (!S.sw || (S.sw.t -= dt) <= 0 || Math.hypot(S.sw.x - e.x, S.sw.y - e.y) < 0.6) {
      const circling = S.sw && !S.sw.circle && R() < 0.35, a = ang(p.x, p.y, e.x, e.y) + (R() < 0.5 ? 1 : -1) * (0.6 + R() * 1.4), r = circling ? 3 : 2 + R() * 3.5;
      S.sw = { x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r, t: circling ? 0.7 : 1.2, circle: circling };
    }
    if (S.sw.circle) { const a = ang(p.x, p.y, e.x, e.y) + 2.4 * dt; toward(g, e, p.x + Math.cos(a) * 3, p.y + Math.sin(a) * 3, 6.5, dt); }
    else toward(g, e, S.sw.x, S.sw.y, 6.5, dt);
  },
  // the Slime: it sits, gathers itself, and hops (a short quick bound toward you or round you), then sits again
  hop: (g, e, dt, p, d, S) => {
    if ((S.hopT = (S.hopT ?? 0.8) - dt) > 0) { if (S.hopTo) toward(g, e, S.hopTo[0], S.hopTo[1], 5, dt); return; }
    S.hopT = 0.7 + R() * 0.6; const a = ang(e.x, e.y, p.x, p.y) + (d < 2.5 ? Math.PI / 2 * (R() < 0.5 ? 1 : -1) : (R() - 0.5) * 0.8);
    S.hopTo = [e.x + Math.cos(a) * 1.4, e.y + Math.sin(a) * 1.4];
  },
  // the Archer: 6-9 tiles off, sidling across you; come closer than 5 and it backs away fast
  marksman: (g, e, dt, p, d, S) => {
    if ((S.flip -= dt) <= 0) { S.flip = 1.2 + R() * 1.6; S.dir = R() < 0.5 ? 1 : -1; }
    const a = ang(p.x, p.y, e.x, e.y), back = d < 5 ? 1.6 : d < 6 ? 1 : d > 9 ? -1 : 0, sp = (d < 5 ? 4.6 : 3.4) * dt;
    const vx = Math.cos(a) * back - Math.sin(a) * S.dir * 0.9, vy = Math.sin(a) * back + Math.cos(a) * S.dir * 0.9, L = Math.hypot(vx, vy) || 1;
    step(g, e, (vx / L) * sp, (vy / L) * sp);
  },
  // the Wraith: short drifts (half a second moving, a moment hanging still), never in a line, round a ring of 5
  drift: (g, e, dt, p, d, S) => {
    if ((S.drT = (S.drT ?? 0) - dt) <= 0) { S.drT = 0.9 + R() * 0.4; const a = ang(p.x, p.y, e.x, e.y) + (R() - 0.5) * 2.2, r = 4 + R() * 2.5; S.drTo = [p.x + Math.cos(a) * r, p.y + Math.sin(a) * r]; }
    if (S.drT > 0.4 && S.drTo) toward(g, e, S.drTo[0], S.drTo[1], 4.2, dt);
  },
  // the Hound: fast, and never straight at you: it runs for your side or your back, then cuts in
  flank: (g, e, dt, p, d, S) => {
    if ((S.flT = (S.flT ?? 0) - dt) <= 0) { S.flT = 1.6 + R(); S.side = R() < 0.5 ? 1 : -1; }
    const [vx, vy] = vel(S), head = Math.hypot(vx, vy) > 0.5 ? Math.atan2(vy, vx) : ang(e.x, e.y, p.x, p.y), want = head + Math.PI / 2 * S.side + (d < 3 ? Math.PI / 2 * S.side : 0);
    S.flA = S.flA === undefined ? want : S.flA + Math.atan2(Math.sin(want - S.flA), Math.cos(want - S.flA)) * Math.min(1, dt * 3);   // (its line of attack turns, it doesn't jump)
    toward(g, e, p.x + Math.cos(S.flA) * 2.2, p.y + Math.sin(S.flA) * 2.2, 6, dt);
  },
  // the Acolyte: still while it casts; between cycles it walks to a new place 5-8 off, then plants itself
  plant: (g, e, dt, p, d, S) => {
    if ((S.plT = (S.plT ?? 2) - dt) <= 0 || !S.plTo) { S.plT = 3.5 + R() * 1.5; S.plTo = spot(g, p.x, p.y, 5, 8) || [e.x, e.y]; }
    if (Math.hypot(S.plTo[0] - e.x, S.plTo[1] - e.y) > 0.3) toward(g, e, S.plTo[0], S.plTo[1], 3.2, dt);
  },
  // the Lava Guard: a slow, deliberate advance, straight at you, holding at two tiles; it stands while its shield is up
  advance: (g, e, dt, p, d, S) => { if (e.kinShieldUntil > g.t) return; S.held = d < 2 || (S.held && d < 2.6); if (!S.held) toward(g, e, p.x, p.y, 2.2, dt); },
  // the Cultist: behind its friends, from you, 7-9 off; closer than 5 and it runs
  skulk: (g, e, dt, p, d, S) => {
    const pals = g.enemies.filter((q) => q !== e && !q.dead && q.D.kin && q.D.kin !== 'sun_portal' && Math.hypot(q.x - e.x, q.y - e.y) < 10);
    let tx, ty;
    if (d < 5) { const a = ang(p.x, p.y, e.x, e.y); tx = e.x + Math.cos(a) * 3; ty = e.y + Math.sin(a) * 3; }
    else if (pals.length) { const q = S.pal && !S.pal.dead && pals.includes(S.pal) && (S.palT -= dt) > 0 ? S.pal : (S.palT = 2, S.pal = pals.reduce((b, o) => (Math.hypot(o.x - p.x, o.y - p.y) < Math.hypot(b.x - p.x, b.y - p.y) ? o : b))), a = ang(p.x, p.y, q.x, q.y); tx = p.x + Math.cos(a) * 8; ty = p.y + Math.sin(a) * 8; }
    else { const a = ang(p.x, p.y, e.x, e.y); tx = p.x + Math.cos(a) * 8; ty = p.y + Math.sin(a) * 8; }
    toward(g, e, tx, ty, d < 5 ? 3.8 : 3, dt);
  },
  // the Knight: walks you down to three tiles, then circles you there, measuring you
  duel: (g, e, dt, p, d, S) => {
    if ((S.flip -= dt) <= 0) { S.flip = 2 + R() * 2; S.dir = R() < 0.5 ? 1 : -1; }
    if (d > 3.4) { toward(g, e, p.x, p.y, 3.8, dt); return; }
    const a = ang(p.x, p.y, e.x, e.y) + S.dir * 0.8 * dt * 3; toward(g, e, p.x + Math.cos(a) * 3, p.y + Math.sin(a) * 3, 3, dt);
  },
  // the Elemental: floats, slowly, side to side across you at 5 tiles, as a tide
  float: (g, e, dt, p, d, S) => {
    S.fl = (S.fl || R() * 6) + dt; const a = ang(p.x, p.y, e.x, e.y), sw = Math.sin(S.fl * 0.9) * 3.5;
    toward(g, e, p.x + Math.cos(a) * 5 - Math.sin(a) * sw, p.y + Math.sin(a) * 5 + Math.cos(a) * sw, 2.4, dt);
  },
  // the Shade: fast round your flanks; every few seconds a short blink to your other side (its mark shown first)
  blinker: (g, e, dt, p, d, S) => {
    if (S.blinkAt && g.t >= S.blinkAt) { const [x, y] = S.blinkTo; S.blinkAt = 0; shadeBlink(g, e, x, y); return; }
    if ((S.bkT = (S.bkT ?? 2.5) - dt) <= 0 && !S.blinkAt) {
      S.bkT = 3 + R() * 1.5; const a = ang(p.x, p.y, e.x, e.y) + Math.PI * (0.6 + R() * 0.8) * (R() < 0.5 ? 1 : -1), to = [p.x + Math.cos(a) * 4, p.y + Math.sin(a) * 4];
      if (!g.blockedAt(to[0], to[1], 0.5)) { S.blinkTo = to; S.blinkAt = g.t + 0.6; zone(g, e, to[0], to[1], 0.8, 0.6, 0, ['#1a0c20', '#8a5ad8']); }
    }
    const a = ang(p.x, p.y, e.x, e.y) + 1.6 * dt; toward(g, e, p.x + Math.cos(a) * 4, p.y + Math.sin(a) * 4, 4.8, dt);
  },
  // the Golem: holds the way it guards (where it stood), turning to face you; leaves it only to close on you within 4
  hold: (g, e, dt, p, d, S) => {
    if (!S.home) S.home = [e.x, e.y];
    const fromHome = Math.hypot(p.x - S.home[0], p.y - S.home[1]);
    if (fromHome < 6 && d > 2) toward(g, e, p.x, p.y, 1.5, dt); else if (Math.hypot(e.x - S.home[0], e.y - S.home[1]) > 0.4) toward(g, e, S.home[0], S.home[1], 1.5, dt);
  },
  // the Construct: turns round a point of its own at three tiles; now and then moves that point toward you
  revolve: (g, e, dt, p, d, S) => {
    if (!S.pivot || (S.pvT = (S.pvT ?? 6) - dt) <= 0) { S.pvT = 6 + R() * 2; const a = ang(p.x, p.y, e.x, e.y); S.pivot = S.pivot && d < 9 ? S.pivot : [p.x + Math.cos(a) * 6, p.y + Math.sin(a) * 6]; S.pa = ang(S.pivot[0], S.pivot[1], e.x, e.y); }
    S.pa += 0.8 * dt; toward(g, e, S.pivot[0] + Math.cos(S.pa) * 3, S.pivot[1] + Math.sin(S.pa) * 3, 3.5, dt);
  },
};
// a Shade's (or a Wraith's) blink: it goes up in smoke where it stood, a wisp runs to where it's going, it forms there
function shadeBlink(g, e, x, y, cols = ['#8a5ad8', '#3a1a4a', '#1a0c20']) {
  g.vx({ k: 'burst', x: e.x, y: e.y - 0.6, n: 16, colors: cols });
  for (let k = 1; k < 6; k++) g.vx({ k: 'burst', x: e.x + (x - e.x) * k / 6, y: e.y + (y - e.y) * k / 6 - 0.5, n: 2, colors: cols });
  e.x = x; e.y = y; g.vx({ k: 'burst', x, y: y - 0.6, n: 16, colors: cols }); g.sfx('portal');
}

// ---------------------------------------------------------------- the fourteen (the Overseer on the boss engine)
// each attack: n (its name), tele (s), dur (s after the telegraph), cd (s after it ends), range, run(g, e, p, S, aim),
// mark(g, e, p, S) at the telegraph's start, still (holds still while it runs), when(g, e, S)
const KIN = {
  cinder_bat: { move: MOVE.swoop, atk: [
    { n: 'Ember Dive', tele: 0.5, dur: 0.8, cd: 4, range: 9, still: true,
      mark: (g, e, p, S) => { S.lock = [p.x, p.y]; lane(g, e, e.x, e.y, ang(e.x, e.y, p.x, p.y), Math.hypot(p.x - e.x, p.y - e.y) + 1, 0.5, 0, 0.45); },
      run: (g, e, p, S) => {                                // through where you were, dropping five embers as it goes (they drift and fade)
        const a = ang(e.x, e.y, S.lock[0], S.lock[1]), L = Math.min(6, reach(g, e, a, Math.hypot(S.lock[0] - e.x, S.lock[1] - e.y) + 1.5));
        dash(S, e, a, L, 8, 0); for (let k = 1; k <= 5; k++) later(S, (L / 8) * (k / 5.5), () => fire(g, e, a + Math.PI + (R() - 0.5) * 1.2, 1.2, 60, 'ember', 1.6, 0.3));
      } },
    { n: 'Shrieking Scatter', tele: 0.55, dur: 0.4, cd: 5.5, range: 9,
      run: (g, e, p, S) => { const a = aim(g, e, p, S, 5); fan(g, e, a, 5, deg(48), 5, 55, 'pember'); later(S, 0.35, () => fan(g, e, a + deg(6), 5, deg(48), 5, 55, 'pember')); } },
  ] },
  lava_slime: { move: MOVE.hop, atk: [
    { n: 'Molten Leap', tele: 0.8, dur: 0.1, cd: 5, range: 7,
      mark: (g, e, p, S) => { const a = ang(e.x, e.y, p.x, p.y), L = Math.min(3, reach(g, e, a, Math.hypot(p.x - e.x, p.y - e.y))); S.land = [e.x + Math.cos(a) * L, e.y + Math.sin(a) * L]; zone(g, e, S.land[0], S.land[1], 1.1, 0.8, 115); },
      run: (g, e, p, S) => { e.x = S.land[0]; e.y = S.land[1]; pool(g, e, e.x, e.y, 1.0, 2.5, 35); g.vx({ k: 'burst', x: e.x, y: e.y, n: 12, colors: ['#ff8a1f', '#ffd650'] }); } },
    { n: 'Boiling Split', tele: 0.7, dur: 0.7, cd: 6, range: 8,
      run: (g, e, p, S) => { const gap = Math.floor(R() * 10), burst = (o) => { for (let k = 0; k < 10; k++) if (k !== gap && k !== (gap + 1) % 10) fire(g, e, o + (k / 10) * TAU, 3.4, 80, 'blob', 8, 0.4); }; const a0 = R() * TAU; burst(a0); later(S, 0.6, () => burst(a0 + TAU / 20)); } },
    // Ember Spit: three quick bursts of three at you (the small flame elemental's own)
    { n: 'Ember Spit', tele: 0.45, dur: 0.7, cd: 3.5, range: 9,
      run: (g, e, p, S) => { for (let k = 0; k < 3; k++) later(S, k * 0.22, () => fan(g, e, aim(g, e, p, S, 6), 3, deg(14), 6, 70, 'ember', 9)); } },
  ], death(g, e) {                                          // Boiling Remains: it swells 0.5 s, then bursts in six slow droplets, wide gaps between
    zone(g, e, e.x, e.y, 1.3, 0.5, 0);
    g.kinLater(0.5, () => { const a0 = R() * TAU; for (let k = 0; k < 6; k++) g.shoot('e', ...g.up(e.x, e.y, 0.4), a0 + (k / 6) * TAU, 2.4, 7, D(55), 'castle_shots/blob', 0.4, false, e.D.name); pool(g, e, e.x, e.y, 0.8, 1.5, 0.0001, '#a03a1a'); });
  } },
  cinder_archer: { move: MOVE.marksman, atk: [
    { n: 'Ashen Volley', tele: 0.6, dur: 1.0, cd: 4, range: 12,
      run: (g, e, p, S) => { for (let k = 0; k < 3; k++) later(S, k * 0.45, () => fan(g, e, aim(g, e, p, S, 8), 3, deg(10), 8, 90, 'arrow', 11, undefined)); } },
    { n: 'Marked Execution', tele: 0.85, dur: 0.2, cd: 8, range: 13, still: true,
      mark: (g, e, p, S) => { S.aim = ang(e.x, e.y, p.x, p.y); lane(g, e, e.x, e.y, S.aim, 14, 0.85, 0, 0.25, ['#ff6a1c', '#ff6a1c', '#1a0c10', '#ffffff']); },   // (its aiming line, from its bow: locked from the start)
      run: (g, e, p, S) => fire(g, e, S.aim, 15, 130, 'darrow', 15, 0.3) },
  ] },
  hollow_wraith: { move: MOVE.drift, atk: [
    { n: 'Phantom Spiral', tele: 0.6, dur: 0.9, cd: 5, range: 10,
      run: (g, e, p, S) => { const a0 = R() * TAU; for (let k = 0; k < 3; k++) later(S, k * 0.4, () => { for (let i = 0; i < 6; i++) fire(g, e, a0 + deg(20) * k + (i / 6) * TAU, 4.5, 80, 'ghost', 10); }); } },
    { n: 'Wraithstep', tele: 0.8, dur: 0.6, cd: 7, range: 11, still: true,
      mark: (g, e, p, S) => { S.to = spot(g, p.x, p.y, 4, 6); if (S.to) zone(g, e, S.to[0], S.to[1], 0.8, 0.8, 0, ['#3a1a4a', '#8a5ad8']); },
      run: (g, e, p, S) => {
        if (!S.to) return; shadeBlink(g, e, S.to[0], S.to[1]);
        const a = ang(e.x, e.y, p.x, p.y); later(S, 0.25, () => { fan(g, e, a + deg(28), 5, deg(40), 5, 95, 'ghost', 10); fan(g, e, a - deg(28), 5, deg(40), 5, 95, 'ghost', 10); });   // (two fans, crossing where you stood)
      } },
  ] },
  infernal_hound: { move: MOVE.flank, tick(g, e, dt, S) {   // its trail (the user, 2026-11-02: "The hounds should leave fire trails"): a little fire where its paws were, every 0.3 s it's running
    const L = S.trailAt; if (!L) { S.trailAt = [e.x, e.y]; return; }
    if (Math.hypot(e.x - L[0], e.y - L[1]) > 0.7) { S.trailAt = [e.x, e.y]; if (!e.dead) pool(g, e, L[0], L[1], 0.42, 1.6, 30, '#ff6a1c'); }
  }, atk: [
    { n: 'Hellbound Pounce', tele: 0.65, dur: 0.75, cd: 5, range: 8, still: true,
      mark: (g, e, p, S) => { S.aim = ang(e.x, e.y, p.x, p.y); lane(g, e, e.x, e.y, S.aim, 6, 0.65, 0, 0.6); },
      run: (g, e, p, S) => dash(S, e, S.aim, Math.min(6, reach(g, e, S.aim, 6)), 9, 150, () => { for (let k = 0; k < 5; k++) fire(g, e, S.aim + ((k + 0.5) / 5) * TAU, 4.5, 80, 'flame', 6); }) },
    { n: 'Burning Hunt', tele: 0.55, dur: 4, cd: 9, range: 10, chase: 6.2,
      run: (g, e, p, S) => { for (let t = 0.35; t < 4; t += 0.7) later(S, t, () => { const x = e.x, y = e.y; zone(g, e, x, y, 0.5, 0.5, 0); g.kinLater(0.5, () => pool(g, e, x, y, 0.55, 1.5, 55)); }); } },
  ] },
  solar_acolyte: { move: MOVE.plant, atk: [
    { n: 'Solar Chant', tele: 0.65, dur: 1.2, cd: 5, range: 11,
      run: (g, e, p, S) => { for (let k = 0; k < 3; k++) later(S, k * 0.55, () => fan(g, e, aim(g, e, p, S, 5.5), 5, deg(44), 5.5, 85, 'tear')); } },
    { n: 'Sunspot', tele: 0.9, dur: 0.1, cd: 8, range: 11,
      mark: (g, e, p, S) => { S.lock = [p.x, p.y]; zone(g, e, p.x, p.y, 1.4, 0.9, 0, GOLD); },
      run: (g, e, p, S) => pool(g, e, S.lock[0], S.lock[1], 1.4, 2.5, 40, '#ffd650') },
    // Drifting Gate (2026-11-02, the user: "the mage should spawn portals that slowly move from the mage in one direction
    // and spawn shots"): a gate opens at his side and drifts off, slowly, across your way (a third of a turn off you), for
    // 6 s, firing as it goes: a fan of three at you every 1.1 s, a ring of six every third time
    { n: 'Drifting Gate', tele: 0.8, dur: 0.3, cd: 9, range: 11, when: (g, e, S) => (S.gates || []).filter((q) => !q.dead).length < 2,
      mark: (g, e, p, S) => { const a = ang(e.x, e.y, p.x, p.y) + (R() < 0.5 ? 1 : -1) * deg(60); S.gateA = a; S.gateAt = [e.x + Math.cos(a) * 1.2, e.y + Math.sin(a) * 1.2]; zone(g, e, S.gateAt[0], S.gateAt[1], 0.7, 0.8, 0, VIO); },
      run: (g, e, p, S) => { if (g.blockedAt(S.gateAt[0], S.gateAt[1], 0.4)) return; const q = g.addEnemy('acolyte_gate', S.gateAt[0], S.gateAt[1]); if (!q) return; q.noLoot = true; q.seen = true; q.kinUntil = g.t + 6; q.kinVx = Math.cos(S.gateA) * 1.3; q.kinVy = Math.sin(S.gateA) * 1.3; (S.gates = (S.gates || []).filter((o) => !o.dead)).push(q); } },
    { n: 'Radiant Lance', tele: 0.75, dur: 0.6, cd: 7, range: 12, still: true,
      mark: (g, e, p, S) => { S.aim = ang(e.x, e.y, p.x, p.y); lane(g, e, e.x, e.y, S.aim, 10, 0.75, 0, 0.3, GOLD); },
      run: (g, e, p, S) => { fire(g, e, S.aim, 8, 115, 'lance', 13, 0.35); const b = ang(e.x, e.y, p.x, p.y); lane(g, e, e.x, e.y, b, 10, 0.5, 0, 0.3, GOLD); later(S, 0.5, () => fire(g, e, b, 8, 115, 'lance', 13, 0.35)); } },
  ] },
  lava_guard: { move: MOVE.advance, atk: [
    { n: 'Shield Bash', tele: 0.9, dur: 0.3, cd: 4.5, range: 4, when: (g, e) => !(e.kinShieldUntil > g.t),
      mark: (g, e, p, S) => { S.aim = ang(e.x, e.y, p.x, p.y); g.fx.push({ kind: 'cleave', x: e.x, y: e.y, a: S.aim, r: 2.2, spread: deg(90), delay: 0.9, t: 0, life: 1.2, dmg: D(160), by: e.D.name, done: false }); },
      run: (g, e, p, S) => {                                // (caught in the bash: your armour broken, 2.5 s; the game's own Armor Broken)
        const q = g.player, da = Math.abs(Math.atan2(Math.sin(ang(e.x, e.y, q.x, q.y) - S.aim), Math.cos(ang(e.x, e.y, q.x, q.y) - S.aim)));
        if (!q.dead && Math.hypot(q.x - e.x, q.y - e.y) < 2.4 && da < deg(48) && !(q.status.invuln > 0)) g.owSig({ sig: 'armor', sigV: 2.5 });
        fan(g, e, S.aim, 6, deg(70), 5, 90, 'blob', 8);
      } },
    // Molten Upheaval (2026-11-02, the user: "another attack and animation where he swings the mace into the ground and
    // shooting a bunch of earth/molten fire at players"): the mace hauled up and round (1.0 s, the ground before him
    // marked), driven into the ground there (150 where it lands); the earth bursts out at you in two sprays, rock and
    // molten fire, a cone of eleven then nine between them
    { n: 'Molten Upheaval', tele: 1.0, dur: 0.9, cd: 8, range: 9, still: true, clip: 'slam',
      mark: (g, e, p, S) => { S.aim = ang(e.x, e.y, p.x, p.y); S.hit = [e.x + Math.cos(S.aim) * 1.6, e.y + Math.sin(S.aim) * 1.6]; zone(g, e, S.hit[0], S.hit[1], 1.3, 1.0, 150, ['#ff8a1f', '#ffd650']); },
      run: (g, e, p, S) => {
        const [hx, hy] = S.hit, from = g.up(hx, hy, 0.3); g.vx({ k: 'shake', amt: 5 }); g.vx({ k: 'burst', x: hx, y: hy, n: 18, colors: ['#5a4a52', '#8a7e86', '#ff8a1f', '#ffd650'] });
        const a = ang(hx, hy, p.x, p.y);
        for (let k = 0; k < 11; k++) fire(g, e, a + (k / 10 - 0.5) * deg(120), 5 + (k % 3) * 0.6, 95, k % 2 ? 'stone' : 'blob', 10, 0.4, from);
        later(S, 0.3, () => { for (let k = 0; k < 9; k++) fire(g, e, a + ((k + 0.5) / 9 - 0.5) * deg(110), 4.2, 95, k % 2 ? 'blob' : 'stone', 9, 0.4, from); });
        pool(g, e, hx, hy, 1.0, 2.5, 40);
      } },
    { n: 'Furnace Wall', tele: 0.9, dur: 0.7, cd: 7, range: 9,
      run: (g, e, p, S) => {                                // two rows of seven square to you, each with its own gap
        const a = ang(e.x, e.y, p.x, p.y), row = (gap) => { for (let k = 0; k < 7; k++) { if (k === gap) continue; const o = (k - 3) * 0.85, x = e.x - Math.sin(a) * o, y = e.y + Math.cos(a) * o; fire(g, e, a, 4.5, 90, 'blob', 10, 0.4, g.up(x, y, 0.5)); } };
        const g1 = Math.floor(R() * 7); row(g1); later(S, 0.6, () => row((g1 + 2 + Math.floor(R() * 3)) % 7));
      } },
  ], tick(g, e, dt, S) {                                    // Shielded Advance: every 9 s, 2 s with its shield up (frontal blows 35% softer)
    if ((S.shieldT = (S.shieldT ?? 4) - dt) <= 0) { S.shieldT = 9; e.kinShieldUntil = g.t + 2; e.kinFace = ang(e.x, e.y, g.player.x, g.player.y); g.fx.push({ kind: 'ring', x: e.x, y: e.y - 0.5, t: 0, max: 1.2, color: '#ffb030' }); }
  } },
  sun_cultist: { move: MOVE.skulk, tick(g, e, dt, S) {   // its rite of mending (the user, 2026-11-02: "The priest should heal enemies periodically"): every 8 s, its hurt friends within 7 tiles a sixth of their Life back, a line of light to each
    if ((S.healT = (S.healT ?? 4) - dt) > 0 || e.dead) return; S.healT = 8;
    const L = g.enemies.filter((q) => q !== e && !q.dead && q.D.kin && q.hp < q.maxHp && !/portal|gate|node/.test(q.D.kin) && Math.hypot(q.x - e.x, q.y - e.y) < 7);
    for (const q of L) { const h = Math.round(q.maxHp / 6); q.hp = Math.min(q.maxHp, q.hp + h); lane(g, e, e.x, e.y, ang(e.x, e.y, q.x, q.y), Math.hypot(q.x - e.x, q.y - e.y), 0.01, 0, 0.25, ['#ffd650', '#ffd650', '#fff6c8', '#ffffff'], 0.4); if (g.float) g.float(q.x, q.y - 1.2, '+' + h.toLocaleString(), '#7af08a'); }
    if (L.length) { g.fx.push({ kind: 'ring', x: e.x, y: e.y - 0.4, t: 0, max: 7, color: '#ffd650' }); }
  }, atk: [
    { n: 'Sun Siphon', tele: 0.9, dur: 0.4, cd: 6.5, range: 11, still: true,
      mark: (g, e, p, S) => { S.aim = ang(e.x, e.y, p.x, p.y); lane(g, e, e.x, e.y, S.aim, 11, 0.9, 145, 0.35, RED, 0.35); } },
    { n: 'Ritual Portals', tele: 1.0, dur: 0.2, cd: 20, range: 11, when: (g, e, S) => !(S.portals || []).some((q) => !q.dead),   // (13 s after they close: they last 7)
      mark: (g, e, p, S) => { const a = ang(e.x, e.y, p.x, p.y); S.at = [-1, 1].map((s) => [e.x - Math.sin(a) * s * 3.5, e.y + Math.cos(a) * s * 3.5]).filter(([x, y]) => !g.blockedAt(x, y, 0.5) && Math.hypot(x - p.x, y - p.y) > 2); for (const [x, y] of S.at) zone(g, e, x, y, 0.8, 1.0, 0, GOLD); },
      run: (g, e, p, S) => { S.portals = S.at.map(([x, y]) => { const q = g.addEnemy('sun_portal', x, y); q.noLoot = true; q.seen = true; q.kinUntil = g.t + 7; q.kinOwner = e; return q; }); } },
    // Unholy Light (2026-11-02, the user: "spawn beams of evil light onto players (with notification and time to dodge)"):
    // "EVIL LIGHT!" over you; three columns marked about you (1.3 s, the last on you), each a beam of black-violet light
    // when it falls (150)
    { n: 'Unholy Light', tele: 0.5, dur: 1.6, cd: 7, range: 12,
      run: (g, e, p, S) => {
        if (g.float) g.float(p.x, p.y - 1.4, 'EVIL LIGHT!', '#e070ff');
        const o = R() * TAU;
        for (let k = 0; k < 3; k++) { const r = k === 2 ? 0 : 2.4, x = p.x + Math.cos(o + k * 2.1) * r, y = p.y + Math.sin(o + k * 2.1) * r; zone(g, e, x, y, 1.1, 1.3 + k * 0.2, 150, ['#7a1aa8', '#f0c8ff']); later(S, 1.3 + k * 0.2, () => { g.fx.push({ kind: 'ring', x, y, t: 0, max: 1.4, color: '#e070ff' }); g.vx({ k: 'burst', x, y: y - 1.2, n: 14, colors: ['#2a0a3a', '#a040e0', '#f0c8ff'] }); }); }
      } },
    { n: 'Burning Benediction', tele: 0.8, dur: 0.2, cd: 14, range: 12,
      run: (g, e) => { for (const o of g.enemiesIn(e.x, e.y, 6)) if (o.D.kin) o.kinHaste = Math.max(o.kinHaste || 0, g.t + 6); g.fx.push({ kind: 'ring', x: e.x, y: e.y - 0.4, t: 0, max: 6, color: '#ffd650' }); } },
  ] },
  acolyte_gate: { move: () => {}, atk: [], tick(g, e, dt, S) {   // the Mage's drifting gate: on its way, firing as it goes; gone in 6 s or at a wall
    if (g.t > e.kinUntil || e.dead) { e.noLoot = true; e.dead = true; e.deadT = 0; return; }
    if (g.blockedAt(e.x + e.kinVx * dt * 4, e.y + e.kinVy * dt * 4, 0.4)) { e.kinUntil = g.t; return; }
    e.x += e.kinVx * dt; e.y += e.kinVy * dt;
    if ((S.gT = (S.gT ?? 0.5) - dt) > 0) return; S.gT = 1.1; S.gk = (S.gk || 0) + 1; const p = g.player; if (!p || p.dead) return;
    if (S.gk % 3 === 0) { const a0 = R() * TAU; for (let k = 0; k < 6; k++) fire(g, e, a0 + (k / 6) * TAU, 4, 80, 'porb', 10); }
    else { const a = ang(e.x, e.y, p.x, p.y); for (let k = 0; k < 3; k++) fire(g, e, a + (k - 1) * deg(14), 5, 85, 'porb', 12); }
  } },
  sun_portal: { move: () => {}, atk: [
    { n: 'Portal Bolts', tele: 0.3, dur: 0.1, cd: 1.2, range: 14, run: (g, e, p) => { const a = ang(e.x, e.y, p.x, p.y); for (let k = 0; k < 4; k++) fire(g, e, a + (k - 1.5) * deg(12), 5, 85, 'gorb', 13); } },   // (four, one of them at you)
  ], tick(g, e) { if (g.t > e.kinUntil) { e.noLoot = true; e.dead = true; e.deadT = 0; } } },
  sunbound_knight: { move: MOVE.duel, atk: [
    { n: 'Solar Cleave', tele: 0.7, dur: 0.2, cd: 4, range: 9, run: (g, e, p, S) => fan(g, e, aim(g, e, p, S, 6), 9, deg(110), 6, 110, 'spear', 10) },
    { n: "King's Charge", tele: 0.8, dur: 0.6, cd: 7, range: 9, still: true,
      mark: (g, e, p, S) => { S.aim = ang(e.x, e.y, p.x, p.y); lane(g, e, e.x, e.y, S.aim, 5, 0.8, 0, 0.7); },
      run: (g, e, p, S) => dash(S, e, S.aim, Math.min(5, reach(g, e, S.aim, 5)), 10, 170, () => { const away = ang(p.x, p.y, e.x, e.y); for (let k = 0; k < 8; k++) { const a = away + Math.PI + ((k + 0.5) / 8 - 0.5) * deg(250); fire(g, e, a, 5, 90, 'spear', 8); } }) },   // (its shards spread wide, a sector clear behind it)
    { n: 'Shattered Sun', tele: 0.9, dur: 0.7, cd: 9, range: 9,
      run: (g, e, p, S) => { const ring = (o) => { const gap = Math.floor(R() * 6) * 2; for (let k = 0; k < 12; k++) { if (k === gap || k === (gap + 1) % 12 || k === (gap + 6) % 12 || k === (gap + 7) % 12) continue; fire(g, e, o + (k / 12) * TAU, 4.5, 110, 'gorb', 10, 0.4); } }; const a0 = R() * TAU; ring(a0); later(S, 0.6, () => ring(a0 + TAU / 24)); } },
  ] },
  cinder_elemental: { move: MOVE.float, atk: [
    { n: 'Thermal Spiral', tele: 0.85, dur: 3.6, cd: 9, range: 10,
      run: (g, e, p, S) => { const a0 = R() * TAU, s = R() < 0.5 ? 1 : -1; for (let k = 0; k * 0.3 < 3.6; k++) later(S, k * 0.3, () => { for (let i = 0; i < 7; i++) fire(g, e, a0 + s * deg(11) * k + (i / 7) * TAU, 4.5, 90, 'flame', 10); }); } },   // (2026-11-02, the user: "Elementals should have some more shots": seven arms, oftener)
    { n: 'Eruption Columns', tele: 1.0, dur: 2.2, cd: 10, range: 11,
      mark: (g, e, p, S) => {                               // five narrow lanes across your way, erupting one after another
        const a = ang(e.x, e.y, p.x, p.y) + Math.PI / 2, nx = Math.cos(a - Math.PI / 2), ny = Math.sin(a - Math.PI / 2);
        for (let k = 0; k < 5; k++) { const o = (k - 2) * 2.4, cx = p.x + nx * o, cy = p.y + ny * o; lane(g, e, cx - Math.cos(a) * 8, cy - Math.sin(a) * 8, a, 16, 1.0 + k * 0.45, 130, 0.4, RED, 0.4); }
      } },
    { n: 'Cinder Scatter', tele: 0.6, dur: 0.6, cd: 6, range: 10,
      run: (g, e, p, S) => { const a = aim(g, e, p, S, 5.5); fan(g, e, a, 16, deg(160), 5.5, 95, 'ember'); later(S, 0.5, () => fan(g, e, a + deg(160) / 30, 16, deg(160), 5.5, 95, 'ember')); later(S, 1.0, () => fan(g, e, a, 16, deg(160), 5.5, 95, 'ember')); } },
    // Flare Rings: three rings of fourteen, each turned off the last, a gap of two in each
    { n: 'Flare Rings', tele: 0.7, dur: 1.1, cd: 7, range: 11,
      run: (g, e, p, S) => { const a0 = ang(e.x, e.y, p.x, p.y); for (let r = 0; r < 3; r++) later(S, r * 0.45, () => { const gap = Math.floor(R() * 14); for (let k = 0; k < 14; k++) if (k !== gap && k !== (gap + 1) % 14) fire(g, e, a0 + (k / 14) * TAU + r * deg(9), 4 + r * 0.5, 90, 'flame', 11); }); } },
  ] },
  eclipse_shade: { move: MOVE.blinker, atk: [
    { n: 'Eclipse Blink', tele: 0.8, dur: 0.6, cd: 6, range: 11, still: true,
      mark: (g, e, p, S) => { S.to = spot(g, p.x, p.y, 3, 5); if (S.to) zone(g, e, S.to[0], S.to[1], 0.8, 0.8, 0, ['#1a0c20', '#8a5ad8']); },
      run: (g, e, p, S) => { if (S.to) shadeBlink(g, e, S.to[0], S.to[1]); const volley = (o) => fan(g, e, ang(e.x, e.y, p.x, p.y) + o, 6, deg(60), 6, 110, 'crescent'); later(S, 0.2, () => volley(-deg(6))); later(S, 0.6, () => volley(deg(6))); } },
    { n: 'Darklight Exchange', tele: 0.8, dur: 3.2, cd: 8, range: 10,
      run: (g, e, p, S) => {                                // eight, gold and violet by turns: the gold fly on; the violet stop at 1.5 s and come back the way they went
        const a0 = ang(e.x, e.y, p.x, p.y), back = [];
        for (let k = 0; k < 8; k++) { const a = a0 + (k / 8) * TAU; if (k % 2) { const b = fire(g, e, a, 3.5, 105, 'porb', 12, 0.4); b.life = 4; back.push(b); } else fire(g, e, a, 5.5, 105, 'gorb', 12, 0.4); }
        later(S, 1.5, () => { for (const b of back) if (b.life > 0) { b.vx = -b.vx; b.vy = -b.vy; b.a = Math.atan2(b.vy, b.vx); b.life = 1.5; } });
      } },
    { n: 'Shadow Pursuit', tele: 0.7, dur: 4, cd: 10, range: 11, chase: 4.5,
      run: (g, e, p, S) => { for (let t = 0.4; t < 4; t += 0.75) later(S, t, () => fan(g, e, ang(e.x, e.y, p.x, p.y), 2, deg(16), 5, 85, 'crescent')); } },
  ] },
  forge_golem: { move: MOVE.hold, atk: [
    { n: 'Piston Slam', tele: 1.1, dur: 1.0, cd: 6.5, range: 7, still: true,
      mark: (g, e) => zone(g, e, e.x, e.y, 2.2, 1.1, 185),
      run: (g, e, p, S) => { const a = ang(e.x, e.y, p.x, p.y); for (let k = 0; k < 8; k++) later(S, k * 0.12, () => { for (const s of [-1, 1]) fire(g, e, a + s * deg(45), 5, 105, 'stone', 10, 0.4); }); } },
    { n: 'Furnace Vents', tele: 1.0, dur: 1.1, cd: 9, range: 9,
      mark: (g, e, p, S) => { S.vents = [0, 1, 2, 3].map((k) => [e.x + Math.cos(k * Math.PI / 2 + deg(45)) * 3, e.y + Math.sin(k * Math.PI / 2 + deg(45)) * 3]); for (const [x, y] of S.vents) zone(g, e, x, y, 0.6, 1.0, 0); },
      run: (g, e, p, S) => { for (let w = 0; w < 3; w++) later(S, w * 0.5, () => { for (const [x, y] of S.vents) fan(g, e, ang(x, y, p.x, p.y), 3, deg(30), 4.5, 85, 'blob', 10, g.up(x, y, 0.3)); }); } },
    { n: 'Crushing Advance', tele: 0.8, dur: 3, cd: 10, range: 8, chase: 1.2,
      run: (g, e, p, S) => { for (let t = 0.3; t < 3; t += 0.9) later(S, t, () => fan(g, e, ang(e.x, e.y, p.x, p.y), 5, deg(60), 5, 95, 'stone', 6)); } },
  ] },
  sunbound_construct: { move: MOVE.revolve, atk: [
    { n: 'Orbital Lances', tele: 0.85, dur: 2.5, cd: 9, range: 11,
      run: (g, e, p, S) => { const a0 = R() * TAU, s = R() < 0.5 ? 1 : -1; for (let c = 0; c < 5; c++) later(S, c * 0.5, () => { for (let i = 0; i < 4; i++) { const a = a0 + s * deg(18) * c + (i / 4) * TAU, x = e.x + Math.cos(a) * 1.4, y = e.y + Math.sin(a) * 1.4; fire(g, e, a, 5.5, 105, 'lance', 12, 0.35, g.up(x, y, 0.6)); } }); } },
    { n: 'Sundial Crossing', tele: 1.1, dur: 0.2, cd: 20, range: 12, when: (g, e, S) => !(S.nodes || []).some((q) => !q.dead),   // (14 s after they close: they last 6)
      mark: (g, e, p, S) => { const mx = (e.x + p.x) / 2, my = (e.y + p.y) / 2, a = ang(e.x, e.y, p.x, p.y) + Math.PI / 2; S.at = [-1, 1].map((s) => { let x = mx + Math.cos(a) * s * 7, y = my + Math.sin(a) * s * 7; const M = g.map; for (let k = 0; k < 16 && M.solid && M.solid[Math.floor(y) * M.w + Math.floor(x)]; k++) { x += (mx - x) * 0.15; y += (my - y) * 0.15; } return [x, y]; }); for (const [x, y] of S.at) zone(g, e, x, y, 0.9, 1.1, 0, GOLD); },   // (each node over ground, never out over the void or in a wall: drawn in toward the middle till it is)
      run: (g, e, p, S) => { S.nodes = S.at.map(([x, y], k) => { const q = g.addEnemy('solar_node', x, y); q.noLoot = true; q.seen = true; q.kinUntil = g.t + 6; q.kinOther = k; q.kinFirst = k * 0.7; return q; }); S.nodes.forEach((q, k) => { q.kinPair = S.nodes[1 - k]; }); } },
    { n: 'Radiant Execution', tele: 1.15, dur: 1.4, cd: 11, range: 12,
      mark: (g, e, p, S) => { const a = R() * Math.PI, nx = -Math.sin(a), ny = Math.cos(a); for (let k = 0; k < 3; k++) { const o = (k - 1) * 1.6, cx = p.x + nx * o, cy = p.y + ny * o; lane(g, e, cx - Math.cos(a) * 7, cy - Math.sin(a) * 7, a, 14, 1.15 + k * 0.55, 170, 0.3, GOLD, 0.3); } } },
  ] },
  // the Hall of Hollow Banners' three (2026-11-02, the user: "the banners currently pose almost no threat"): they take
  // turns in a 1.4 s round, each a third of it after the last, so their fans cross; each glows 0.4 s before it fires;
  // every fourth of a banner's volleys is a lance down a marked line (0.8 s) that breaks your armour (2.5 s). Break one
  // and its share of the hall's fire is gone
  cursed_banner: { move: () => {}, atk: [], tick(g, e, dt, S) {
    const p = g.player; if (!p || p.dead || Math.hypot(p.x - e.x, p.y - e.y) > 28) return;   // (the whole hall: there is no standing back out of their reach)
    if (!S.bn) { const L = g.enemies.filter((q) => !q.dead && q.D === e.D && Math.hypot(q.x - e.x, q.y - e.y) < 40).sort((a, b) => a.x - b.x), i = Math.max(0, L.indexOf(e)); S.bn = { i, t: 1.0 + i * 0.47, k: 0 }; }
    const B = S.bn;
    if ((B.t -= dt) > 0) { if (B.t < 0.4 && !B.glow) { B.glow = true; g.fx.push({ kind: 'ring', x: e.x, y: e.y - 0.8, t: 0, max: 1.4, color: '#c88aff' }); } return; }
    B.t = 1.4; B.glow = false; B.k++;
    const a = ang(e.x, e.y, p.x, p.y);
    if (B.k % 4 === 0) {                                     // the armour-breaking lance: its line first
      lane(g, e, e.x, e.y, a, 26, 0.8, 0, 0.3, ['#a8a0b0', '#a8a0b0', '#5a5560', '#ffffff']);
      g.kinLater(0.8, () => { if (e.dead) return; const b = fire(g, e, a, 11, 105, 'darrow', 28, 0.35); if (b) { b.sig = 'armor'; b.sigV = 2.5; } });
    } else fan(g, e, a + (B.i - 1) * deg(14), 5, deg(40), 5, 85 + (B.k % 2) * 15, 'ghost', 26);   // (each a little to its side of you: the three cross)
  } },
  solar_node: { move: () => {}, atk: [], tick(g, e, dt, S) {   // a node of the Sundial Crossing: a wall toward the other node every 1.4 s, the two by turns
    if (g.t > e.kinUntil) { e.noLoot = true; e.dead = true; e.deadT = 0; return; }
    if ((S.wallT = (S.wallT ?? 0.4 + (e.kinFirst || 0)) - dt) > 0) return;
    S.wallT = 1.4; const o = e.kinPair, a = o && !o.dead ? ang(e.x, e.y, o.x, o.y) : ang(e.x, e.y, g.player.x, g.player.y), gap = Math.floor(R() * 7);
    for (let k = 0; k < 9; k++) { if (k === gap || k === gap + 1) continue; const off = (k - 4) * 0.9, x = e.x - Math.sin(a) * off, y = e.y + Math.cos(a) * off; g.shoot('e', ...g.up(x, y, 0.5), a, 5, 15, D(95), 'castle_shots/gorb', 0.4, false, e.D.name); }
  } },
};

const methods = {
  // a castle defender's turn: its own timers, a dash in flight, its attack under way, or its next
  // momentum (2026-11-02, the user: "the AI movement of the enemies seems like it got wonky. Smooth it out"): a brain says
  // where it wants to go each frame; the body turns its way over about a seventh of a second instead of snapping (the
  // hounds and cultists had been reversing seven or eight times a second, chasing targets that moved with you). A blink
  // or a hop's bound stays as it is
  kinSmooth(e, x0, y0, dt) {
    if (!(dt > 0)) return;
    const dx = e.x - x0, dy = e.y - y0;
    if (Math.hypot(dx, dy) > 1 || e.D.kin === 'lava_slime') { e.kvx = dx / dt; e.kvy = dy / dt; return; }
    e.x = x0; e.y = y0;
    const a = 1 - Math.exp(-dt * 7); e.kvx = (e.kvx || 0) + (dx / dt - (e.kvx || 0)) * a; e.kvy = (e.kvy || 0) + (dy / dt - (e.kvy || 0)) * a;
    this.moveCircle(e, e.kvx * dt, e.kvy * dt, 0.45);
  },
  kinTick(e, dt, p, d) {
    const K = KIN[e.D.kin]; if (!K) return;
    const S = e.kn || (e.kn = { cd: Object.fromEntries(K.atk.map((A, k) => [A.n, 0.6 + k * 0.9 + R() * 1.2])), q: [], busy: 0, dir: 1, flip: 0, trail: [] });
    S.trail.push([p.x, p.y, this.t]); while (S.trail.length > 2 && this.t - S.trail[0][2] > 0.35) S.trail.shift();   // (where you have been, 0.35 s back: the Wraith's needles, and your heading)
    for (const s of S.q) s.t -= dt;
    while (S.q.length && S.q[0].t <= 0) S.q.shift().fn();
    S.q.sort((a, b) => a.t - b.t);
    if (K.tick) K.tick(this, e, dt, S);
    if (e.dead) return;
    if (S.dash) {                                           // a dash: it can't turn mid-flight; once into you
      const Q = S.dash, k = Math.min(Q.t, dt); Q.t -= dt;
      if (this.blockedAt(e.x + Q.vx * k, e.y + Q.vy * k, 0.45)) Q.t = 0; else { e.x += Q.vx * k; e.y += Q.vy * k; }
      if (Q.dmg && !Q.hit && !p.dead && Math.hypot(p.x - e.x, p.y - e.y) < (e.D.r || 0.5) + 0.4) { Q.hit = true; this.hurtPlayer(D(Q.dmg), e.D.name); }
      if (Q.t <= 0) { S.dash = null; if (Q.then) Q.then(); }
      return;
    }
    if (S.cur) {                                            // under way: it moves on as it attacks (unless the attack holds it)
      S.busy -= dt;
      if (S.cur.chase && S.busy < S.cur.dur) { const a = ang(e.x, e.y, p.x, p.y); if (d > 1.4) step(this, e, Math.cos(a) * S.cur.chase * dt, Math.sin(a) * S.cur.chase * dt); }
      else if (!S.cur.still) { const x0 = e.x, y0 = e.y; K.move(this, e, dt * 0.6, p, d, S); this.kinSmooth(e, x0, y0, dt); }
      if (S.busy <= 0) { S.cd[S.cur.n] = S.cur.cd; S.cur = null; e.state = 'move'; }
      return;
    }
    { const x0 = e.x, y0 = e.y; K.move(this, e, dt, p, d, S); this.kinSmooth(e, x0, y0, dt); }
    e.state = 'move';
    for (const n in S.cd) S.cd[n] -= dt;
    for (const A of K.atk) {
      if (S.cd[A.n] > 0 || d > (A.range || 10) || (A.when && !A.when(this, e, S))) continue;
      if (!this.seesFoe || !this.seesFoe(e, p)) continue;  // (not through walls)
      const C = this.kinCond(e);
      if (C && !C.may(this, e, A)) continue;
      S.lead = C ? C.start(this, e, A) : false;
      S.cur = A; S.busy = A.tele + A.dur; e.state = 'tell'; e.kinClip = A.clip || 'shoot';
      if (A.mark) A.mark(this, e, p, S);
      later(S, A.tele, () => { e.state = 'attack'; if (A.run && !e.dead) A.run(this, e, p, S); later(S, 0.2, () => { if (e.state === 'attack') e.state = 'move'; }); });
      break;
    }
  },
  // a formation's conductor (the user's encounters, 2026-11-02: "three intelligently designed enemies creating a dangerous
  // situation together"): the castle defenders of one room share one. One heavy attack at a time, the next 1.2-2 s after the
  // last, and one field (a spiral, vents, portals) alongside it (so a slam lands while a spiral still turns, not all at once); volleys at least 0.6 s apart, every other one
  // aimed where you'll be (a steady circle is no way through); after every third heavy attack, a breath: 1 s with nothing
  // new, to reposition and strike back
  kinCond(e) {
    const m = this.map, C0 = m.castle; if (!C0 || !C0.rooms) return null;
    if (e.kinRoom === undefined) e.kinRoom = Object.keys(C0.rooms).find((k) => { const n = C0.rooms[k]; return e.x >= n.x && e.y >= n.y && e.x < n.x + n.w && e.y < n.y + n.h; }) || null;
    if (!e.kinRoom) return null;
    const all = C0.cond || (C0.cond = {});
    return all[e.kinRoom] || (all[e.kinRoom] = {
      nextHeavy: 0, nextLight: 0, rest: 0, n: 0, lead: false, room: e.kinRoom,
      busy: (g, me, SET) => g.enemies.some((q) => q !== me && !q.dead && q.kinRoom === e.kinRoom && q.kn && q.kn.cur && SET.has(q.kn.cur.n)),
      may(g, me, A) {
        if (g.t < this.rest) return false;
        if (HEAVY.has(A.n)) return g.t >= this.nextHeavy && !this.busy(g, me, HEAVY);
        if (FIELD.has(A.n)) return !this.busy(g, me, FIELD);
        return g.t >= this.nextLight;
      },
      start(g, me, A) {
        if (FIELD.has(A.n)) return false;
        if (HEAVY.has(A.n)) { this.nextHeavy = g.t + A.tele + 1.2 + R() * 0.8; if (++this.n >= 3) { this.n = 0; this.rest = g.t + A.tele + A.dur + 1.0; } return false; }
        this.nextLight = g.t + 0.6; return (this.lead = !this.lead);
      },
    });
  },
  // the game's own short timers (a slime's remains, a hound's embers): they outlive whoever set them
  kinLater(t, fn) { (this.kinQ || (this.kinQ = [])).push({ t, fn }); },
  kinGlobal(dt) { const Q = this.kinQ; if (!Q || !Q.length) return; for (const s of Q) s.t -= dt; this.kinQ = Q.filter((s) => { if (s.t > 0) return true; try { s.fn(); } catch (err) { void err; } return false; }); },
  kinDeath(e) { const K = KIN[e.D.kin]; if (K && K.death) K.death(this, e); },
  // the Lava Guard's shield: a blow from in front of it (the way it faced as it raised it) lands 35% softer; from its sides
  // or behind, in full
  kinShield(e, d) {
    if (!(e.kinShieldUntil > this.t)) return d;
    const p = this.player, face = e.kinFace ?? 0, from = ang(e.x, e.y, p.x, p.y), da = Math.abs(Math.atan2(Math.sin(from - face), Math.cos(from - face)));
    return da < deg(70) ? Math.round(d * 0.65) : d;
  },
};
export function installCastleKin(Game) { Object.assign(Game.prototype, methods); }

// ---------------------------------------------------------------- their stats (the user's), on the monster table
{
  const T = (ENEMIES.furnace_brute && ENEMIES.furnace_brute.loot) || [];        // (the castle's tiered drops: the island's table)
  // the elites' (the user: "better tiered equipment opportunities"): a tier up and better odds, still only a chance
  const E = [{ slot: 'weapon', tiers: [10, 12], p: 0.16 }, { slot: 'armor', tiers: [10, 12], p: 0.16 }, { slot: 'ability', tiers: [5, 6], p: 0.08 }, { slot: 'ring', tiers: [5, 6], p: 0.08 }, { stat: true, p: 0.2 }, { id: 'pot_hp', p: 0.12 }];
  const ELITE = new Set(['sunbound_knight', 'cinder_elemental', 'eclipse_shade', 'forge_golem', 'sunbound_construct']);
  // their size (the user: "too large"): a regular one a tile tall, one of its pixels to one of the screen's (crisp, never
  // resampled), RotMG's size; an elite two tiles; its touch the size it's drawn
  // (2026-11-02, the user: "several enemies still look too small... elite enemies noticeably larger"): by kind, never one
  // multiplier for all, and only whole-pixel scales so the art stays crisp: compact (a bat, a slime) a tile; the soldiers,
  // beasts and spirits two; the elites three; the Golem four. Their touch and shot height the size they're drawn
  const SIZE = { cinder_bat: 0.5, lava_slime: 0.5, cinder_archer: 1, hollow_wraith: 1, infernal_hound: 1, solar_acolyte: 1, lava_guard: 1, sun_cultist: 1,
    sunbound_knight: 1.5, cinder_elemental: 1.5, eclipse_shade: 1.5, sunbound_construct: 1.5, forge_golem: 2 };
  const BODY = { 0.5: [0.42, 0.4], 1: [0.65, 0.85], 1.5: [0.95, 1.25], 2: [1.25, 1.6] };
  // (2026-11-02, the user: "The big archer ... the knight with the crown ... the mace guy ... the infernal hounds ... the fire
  // elemental ... the small mage ... can all look better and be stronger. I want full shooting animations": these seven
  // redrawn at their full size, so drawn at scale 1, with a four-frame shot (tools/build_castle_elite.py), and a third more
  // Life and touch; the rest of the big ones a quarter more)
  // (and then the user's own art for nine of them, 2026-11-02: tools/castle_pix.py (hand-drawn frames: art/source/castle2/pix), at one art pixel to one of the
  // game's, so scale 0.5; their Life as above)
  const USER = new Set(['infernal_hound', 'cinder_archer', 'sunbound_knight', 'solar_acolyte', 'cinder_elemental', 'lava_slime', 'lava_guard', 'sun_cultist', 'cinder_bat', 'forge_golem']);
  const REDRAWN = new Set(['cinder_archer', 'infernal_hound', 'solar_acolyte', 'sun_cultist', 'lava_guard', 'sunbound_knight', 'cinder_elemental']), BIGGER = new Set(['eclipse_shade', 'forge_golem', 'sunbound_construct']);
  const def = (id, name, hp, contact, speed, r, df, xp, extra = {}) => { const el = ELITE.has(id), sc = SIZE[id] || 1, [rr, up] = BODY[sc], re = REDRAWN.has(id), k = re ? 1.3 : BIGGER.has(id) ? 1.25 : 1; ENEMIES[id] = { name, biome: 'throne', reg: (USER.has(id) ? 'castle_user/' : re ? 'castle_elite/' : 'castle_kin/') + id, hp: Math.round(hp * k), def: df, speed, xp, r: rr, ai: 'kite', keep: 5, aggro: 12, contact: Math.round(contact * (re ? 1.2 : 1)), touchCd: 0.8, kin: id, attacks: [], loot: el ? E : T, scale: USER.has(id) ? 0.5 : re ? 1 : sc, hitUp: up, ...extra }; };
  def('cinder_bat', 'Cinder Bat', 7000, 55, 5.2, 0.45, 8, 300, { fly: true });
  def('lava_slime', 'Ember Sprite', 11000, 65, 2.2, 0.5, 10, 350);
  def('cinder_archer', 'Cinder Archer', 17000, 45, 3.4, 0.5, 12, 450);
  def('hollow_wraith', 'Hollow Wraith', 24000, 55, 3.8, 0.5, 12, 550, { fly: true });
  def('infernal_hound', 'Infernal Hound', 20000, 90, 5.5, 0.55, 14, 550);
  def('solar_acolyte', 'Solar Acolyte', 22000, 45, 3.2, 0.5, 14, 600);
  def('lava_guard', 'Lava Guard', 33000, 105, 2.5, 0.6, 24, 700);
  def('sun_cultist', 'Sun Cultist', 30000, 50, 3.0, 0.5, 16, 750);
  def('sunbound_knight', 'Sunbound Knight', 42000, 115, 3.8, 0.6, 24, 900);
  def('cinder_elemental', 'Cinder Elemental', 48000, 85, 3.0, 0.6, 18, 950, { fly: true });
  def('eclipse_shade', 'Eclipse Shade', 50000, 80, 4.5, 0.55, 18, 1000, { fly: true });
  def('forge_golem', 'Forge Golem', 62000, 130, 2.0, 0.7, 30, 1100);
  def('sunbound_construct', 'Sunbound Construct', 70000, 115, 3.5, 0.7, 28, 1400, { fly: true });
  ENEMIES.infernal_alpha = { ...ENEMIES.infernal_hound, name: 'Infernal Alpha', hp: Math.round(ENEMIES.infernal_hound.hp * 2.5), scale: 1, r: 0.95, hitUp: 1.25, elite: true };   // (its redrawn art at half again)   // (the Wolf's Den's leader: more Life, the same pack's charge)
  ENEMIES.acolyte_gate = { name: 'Drifting Gate', biome: 'throne', reg: 'wiz_kin/portal', hp: 4000, def: 8, speed: 0, xp: 0, r: 0.55, ai: 'rooted', aggro: 30, fly: true, kin: 'acolyte_gate', attacks: [], loot: [] };   // (the Mage's: src/castle_kin.js Drifting Gate)
  ENEMIES.sun_portal = { name: 'Solar Portal', biome: 'throne', reg: 'wiz_kin/portal', hp: 5000, def: 8, speed: 0, xp: 0, r: 0.6, ai: 'rooted', aggro: 30, fly: true, kin: 'sun_portal', attacks: [], loot: [] };
  ENEMIES.solar_node = { name: 'Solar Node', biome: 'throne', reg: 'wiz_kin/portal', hp: 7500, def: 10, speed: 0, xp: 0, r: 0.6, ai: 'rooted', aggro: 30, fly: true, kin: 'solar_node', attacks: [], loot: [] };
}
