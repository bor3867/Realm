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
const HEAVY = new Set(['Ember Swoop', 'Molten Leap', 'Marked Prey', 'Wraithstep', 'Hellbound Pounce', 'Burning Pursuit', 'Radiant Spear', 'Molten Bash', 'Furnace Wall', 'Sun Siphon',
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

// ---------------------------------------------------------------- the fourteen (the Overseer on the boss engine)
// each attack: n (its name), tele (s), dur (s after the telegraph), cd (s after it ends), range, run(g, e, p, S, aim),
// mark(g, e, p, S) at the telegraph's start, still (holds still while it runs), when(g, e, S)
const KIN = {
  cinder_bat: { move: orbit(3.5, 5.5, 5.2), atk: [
    { n: 'Ember Swoop', tele: 0.45, dur: 0.7, cd: 4, range: 9, still: true,
      mark: (g, e, p, S) => { S.lock = [p.x, p.y]; lane(g, e, e.x, e.y, ang(e.x, e.y, p.x, p.y), 5, 0.45, 0, 0.45); },
      run: (g, e, p, S) => { const a = ang(e.x, e.y, S.lock[0], S.lock[1]), L = Math.min(5, reach(g, e, a, Math.hypot(S.lock[0] - e.x, S.lock[1] - e.y) + 1)); dash(S, e, a, L, 8, 0, () => fan(g, e, a + Math.PI, 5, deg(70), 4, 55, 'ember', 8)); } },
    { n: 'Screech Burst', tele: 0.55, dur: 0.4, cd: 5.5, range: 9,
      run: (g, e, p, S) => { const a = aim(g, e, p, S, 5); fan(g, e, a, 5, deg(48), 5, 45, 'pember'); later(S, 0.35, () => fan(g, e, a + deg(6), 5, deg(48), 5, 45, 'pember')); } },
  ] },
  lava_slime: { move: keep(0.8, 2, 2.2), atk: [
    { n: 'Molten Leap', tele: 0.8, dur: 0.1, cd: 5, range: 7,
      mark: (g, e, p, S) => { const a = ang(e.x, e.y, p.x, p.y), L = Math.min(3, reach(g, e, a, Math.hypot(p.x - e.x, p.y - e.y))); S.land = [e.x + Math.cos(a) * L, e.y + Math.sin(a) * L]; zone(g, e, S.land[0], S.land[1], 1.1, 0.8, 100); },
      run: (g, e, p, S) => { e.x = S.land[0]; e.y = S.land[1]; pool(g, e, e.x, e.y, 1.0, 2.5, 35); g.vx({ k: 'burst', x: e.x, y: e.y, n: 12, colors: ['#ff8a1f', '#ffd650'] }); } },
    { n: 'Magma Burst', tele: 0.7, dur: 0.6, cd: 6, range: 8,
      run: (g, e, p, S) => { const gap = Math.floor(R() * 8), burst = (o) => { for (let k = 0; k < 8; k++) if (k !== gap && k !== (gap + 1) % 8) fire(g, e, o + (k / 8) * TAU, 3.8, 70, 'blob', 8, 0.4); }; const a0 = R() * TAU; burst(a0); later(S, 0.55, () => burst(a0 + TAU / 16)); } },
  ], death(g, e) {                                          // Boiling Remains: it swells 0.5 s, then bursts in six slow droplets, wide gaps between
    zone(g, e, e.x, e.y, 1.3, 0.5, 0);
    g.kinLater(0.5, () => { const a0 = R() * TAU; for (let k = 0; k < 6; k++) g.shoot('e', ...g.up(e.x, e.y, 0.4), a0 + (k / 6) * TAU, 2.4, 7, D(55), 'castle_shots/blob', 0.4, false, e.D.name); pool(g, e, e.x, e.y, 0.8, 1.5, 0.0001, '#a03a1a'); });
  } },
  cinder_archer: { move: keep(6, 9, 3.4), atk: [
    { n: 'Piercing Volley', tele: 0.6, dur: 1.0, cd: 4, range: 12,
      run: (g, e, p, S) => { for (let k = 0; k < 3; k++) later(S, k * 0.45, () => fan(g, e, aim(g, e, p, S, 8), 3, deg(10), 8, 85, 'arrow', 11)); } },
    { n: 'Scissor Shot', tele: 0.8, dur: 0.7, cd: 7, range: 11,
      run: (g, e, p, S) => {                                // from either side of it, the two fans crossing where you are
        const a = ang(e.x, e.y, p.x, p.y), side = (s) => [e.x - Math.sin(a) * s * 1.5, e.y + Math.cos(a) * s * 1.5], shoot = (s) => { const [x, y] = side(s), b = aim(g, e, p, S, 6, x, y); fan(g, e, b, 5, deg(36), 6, 75, 'arrow', 12, g.up(x, y, 0.6)); };
        shoot(1); later(S, 0.55, () => shoot(-1));
      } },
    { n: 'Marked Prey', tele: 0.85, dur: 0.2, cd: 8, range: 13,
      mark: (g, e, p, S) => { S.lock = [p.x, p.y]; zone(g, e, p.x, p.y, 0.8, 0.85, 0, ['#ff6a1c', '#1a0c10']); },
      run: (g, e, p, S) => fire(g, e, ang(e.x, e.y, S.lock[0], S.lock[1]), 10, 110, 'darrow', 14, 0.4) },
  ] },
  hollow_wraith: { move: keep(4, 6, 3.8), atk: [
    { n: 'Phantom Spiral', tele: 0.6, dur: 0.9, cd: 5, range: 10,
      run: (g, e, p, S) => { const a0 = R() * TAU; for (let k = 0; k < 3; k++) later(S, k * 0.4, () => { for (let i = 0; i < 6; i++) fire(g, e, a0 + deg(20) * k + (i / 6) * TAU, 4.5, 70, 'ghost', 10); }); } },
    { n: 'Wraithstep', tele: 0.85, dur: 0.2, cd: 7, range: 11, still: true,
      mark: (g, e, p, S) => { S.to = spot(g, e.x, e.y, 3, 5); if (S.to) zone(g, e, S.to[0], S.to[1], 0.8, 0.85, 0, ['#3a1a4a', '#8a5ad8']); },
      run: (g, e, p, S) => {
        if (!S.to) return; g.vx({ k: 'burst', x: e.x, y: e.y - 0.6, n: 12, colors: ['#8a5ad8', '#3a1a4a'] }); e.x = S.to[0]; e.y = S.to[1];
        const away = ang(p.x, p.y, e.x, e.y); for (let k = 0; k < 13; k++) { const a = away + (k / 13) * TAU; if (Math.abs(Math.atan2(Math.sin(a - away), Math.cos(a - away))) < deg(45)) continue; fire(g, e, a, 5, 85, 'ghost', 9); }   // (ten round it, the opening away from you)
      } },
    { n: 'Soul Needle', tele: 0.55, dur: 1.1, cd: 5.5, range: 11,
      run: (g, e, p, S) => { for (let k = 0; k < 5; k++) later(S, k * 0.25, () => { const h = S.trail[0] || [p.x, p.y]; fire(g, e, ang(e.x, e.y, h[0], h[1]), 7, 80, 'ghost', 12); }); } },   // (at where you were a moment ago)
  ] },
  infernal_hound: { move: keep(1.2, 2.2, 5.5), atk: [
    { n: 'Hellbound Pounce', tele: 0.65, dur: 0.75, cd: 5, range: 8, still: true,
      mark: (g, e, p, S) => { S.aim = ang(e.x, e.y, p.x, p.y); lane(g, e, e.x, e.y, S.aim, 6, 0.65, 0, 0.6); },
      run: (g, e, p, S) => dash(S, e, S.aim, Math.min(6, reach(g, e, S.aim, 6)), 9, 140, () => fan(g, e, S.aim + Math.PI, 5, deg(80), 4.5, 75, 'flame', 8)) },
    { n: 'Burning Pursuit', tele: 0.55, dur: 4, cd: 9, range: 10,
      run: (g, e, p, S) => { for (let t = 0.35; t < 4; t += 0.7) later(S, t, () => { const x = e.x, y = e.y; zone(g, e, x, y, 0.5, 0.5, 0); g.kinLater(0.5, () => pool(g, e, x, y, 0.55, 1.5, 55)); }); } },
    { n: 'Hellfire Howl', tele: 0.9, dur: 1.1, cd: 7, range: 9,
      run: (g, e, p, S) => { for (let k = 0; k < 3; k++) later(S, k * 0.5, () => fan(g, e, aim(g, e, p, S, 5) + (k % 2 ? deg(12) : 0), 7, Math.PI, 5, 85, 'flame', 9)); } },
  ] },
  solar_acolyte: { move: keep(5, 8, 3.2), atk: [
    { n: 'Solar Chant', tele: 0.65, dur: 1.2, cd: 5, range: 11,
      run: (g, e, p, S) => { for (let k = 0; k < 3; k++) later(S, k * 0.55, () => fan(g, e, aim(g, e, p, S, 5.5), 5, deg(44), 5.5, 75, 'tear')); } },
    { n: 'Sunspot', tele: 0.9, dur: 0.1, cd: 8, range: 11,
      mark: (g, e, p, S) => { S.lock = [p.x, p.y]; zone(g, e, p.x, p.y, 1.4, 0.9, 0, GOLD); },
      run: (g, e, p, S) => pool(g, e, S.lock[0], S.lock[1], 1.4, 2.5, 40, '#ffd650') },
    { n: 'Radiant Spear', tele: 0.75, dur: 0.6, cd: 7, range: 12,
      mark: (g, e, p, S) => { S.aim = ang(e.x, e.y, p.x, p.y); lane(g, e, e.x, e.y, S.aim, 10, 0.75, 0, 0.3, GOLD); },
      run: (g, e, p, S) => { fire(g, e, S.aim, 8, 110, 'lance', 13, 0.35); const b = ang(e.x, e.y, p.x, p.y); lane(g, e, e.x, e.y, b, 10, 0.5, 0, 0.3, GOLD); later(S, 0.5, () => fire(g, e, b, 8, 110, 'lance', 13, 0.35)); } },
  ] },
  lava_guard: { move: keep(1.5, 2.5, 2.5), atk: [
    { n: 'Molten Bash', tele: 0.9, dur: 0.3, cd: 4.5, range: 4, when: (g, e) => !(e.kinShieldUntil > g.t),
      mark: (g, e, p, S) => { S.aim = ang(e.x, e.y, p.x, p.y); g.fx.push({ kind: 'cleave', x: e.x, y: e.y, a: S.aim, r: 2.2, spread: deg(90), delay: 0.9, t: 0, life: 1.2, dmg: D(150), by: e.D.name, done: false }); },
      run: (g, e, p, S) => fan(g, e, S.aim, 6, deg(70), 5, 85, 'blob', 8) },
    { n: 'Furnace Wall', tele: 0.9, dur: 0.7, cd: 7, range: 9,
      run: (g, e, p, S) => {                                // two rows of seven square to you, each with its own gap
        const a = ang(e.x, e.y, p.x, p.y), row = (gap) => { for (let k = 0; k < 7; k++) { if (k === gap) continue; const o = (k - 3) * 0.85, x = e.x - Math.sin(a) * o, y = e.y + Math.cos(a) * o; fire(g, e, a, 4.5, 75, 'blob', 10, 0.4, g.up(x, y, 0.5)); } };
        const g1 = Math.floor(R() * 7); row(g1); later(S, 0.6, () => row((g1 + 2 + Math.floor(R() * 3)) % 7));
      } },
  ], tick(g, e, dt, S) {                                    // Shielded Advance: every 9 s, 2 s with its shield up (frontal blows 35% softer)
    if ((S.shieldT = (S.shieldT ?? 4) - dt) <= 0) { S.shieldT = 9; e.kinShieldUntil = g.t + 2; e.kinFace = ang(e.x, e.y, g.player.x, g.player.y); g.fx.push({ kind: 'ring', x: e.x, y: e.y - 0.5, t: 0, max: 1.2, color: '#ffb030' }); }
  } },
  sun_cultist: { move: keep(6, 8, 3.0), atk: [
    { n: 'Sun Siphon', tele: 0.95, dur: 0.4, cd: 6.5, range: 11, still: true,
      mark: (g, e, p, S) => { S.aim = ang(e.x, e.y, p.x, p.y); lane(g, e, e.x, e.y, S.aim, 11, 0.95, 140, 0.35, RED, 0.35); } },
    { n: 'Ritual Portals', tele: 1.0, dur: 0.2, cd: 20, range: 11, when: (g, e, S) => !(S.portals || []).some((q) => !q.dead),   // (13 s after they close: they last 7)
      mark: (g, e, p, S) => { const a = ang(e.x, e.y, p.x, p.y); S.at = [-1, 1].map((s) => [e.x - Math.sin(a) * s * 3.5, e.y + Math.cos(a) * s * 3.5]).filter(([x, y]) => !g.blockedAt(x, y, 0.5) && Math.hypot(x - p.x, y - p.y) > 2); for (const [x, y] of S.at) zone(g, e, x, y, 0.8, 1.0, 0, GOLD); },
      run: (g, e, p, S) => { S.portals = S.at.map(([x, y]) => { const q = g.addEnemy('sun_portal', x, y); q.noLoot = true; q.seen = true; q.kinUntil = g.t + 7; q.kinOwner = e; return q; }); } },
    { n: 'Burning Benediction', tele: 0.8, dur: 0.2, cd: 14, range: 12,
      run: (g, e) => { for (const o of g.enemiesIn(e.x, e.y, 6)) if (o.D.kin) o.kinHaste = Math.max(o.kinHaste || 0, g.t + 6); g.fx.push({ kind: 'ring', x: e.x, y: e.y - 0.4, t: 0, max: 6, color: '#ffd650' }); } },
  ] },
  sun_portal: { move: () => {}, atk: [
    { n: 'Portal Bolts', tele: 0.3, dur: 0.1, cd: 1.0, range: 14, run: (g, e, p) => { const a = ang(e.x, e.y, p.x, p.y); for (let k = 0; k < 4; k++) fire(g, e, a + (k - 1) * deg(12), 5, 75, 'gorb', 13); } },   // (four, one of them at you)
  ], tick(g, e) { if (g.t > e.kinUntil) { e.noLoot = true; e.dead = true; e.deadT = 0; } } },
  sunbound_knight: { move: keep(2, 3, 3.8), atk: [
    { n: 'Solar Cleave', tele: 0.7, dur: 0.2, cd: 4, range: 9, run: (g, e, p, S) => fan(g, e, aim(g, e, p, S, 6), 9, deg(110), 6, 95, 'spear', 10) },
    { n: "King's Charge", tele: 0.8, dur: 0.6, cd: 7, range: 9, still: true,
      mark: (g, e, p, S) => { S.aim = ang(e.x, e.y, p.x, p.y); lane(g, e, e.x, e.y, S.aim, 5, 0.8, 0, 0.7); },
      run: (g, e, p, S) => dash(S, e, S.aim, Math.min(5, reach(g, e, S.aim, 5)), 10, 155, () => { const away = ang(p.x, p.y, e.x, e.y); for (let k = 0; k < 8; k++) { const a = away + Math.PI + ((k + 0.5) / 8 - 0.5) * deg(250); fire(g, e, a, 5, 90, 'spear', 8); } }) },   // (its shards spread wide, a sector clear behind it)
    { n: 'Shattered Sun', tele: 0.9, dur: 0.7, cd: 9, range: 9,
      run: (g, e, p, S) => { const ring = (o) => { const gap = Math.floor(R() * 6) * 2; for (let k = 0; k < 12; k++) { if (k === gap || k === (gap + 1) % 12 || k === (gap + 6) % 12 || k === (gap + 7) % 12) continue; fire(g, e, o + (k / 12) * TAU, 4.5, 100, 'gorb', 10, 0.4); } }; const a0 = R() * TAU; ring(a0); later(S, 0.6, () => ring(a0 + TAU / 24)); } },
  ] },
  cinder_elemental: { move: keep(4, 6, 3.0), atk: [
    { n: 'Thermal Spiral', tele: 0.85, dur: 3.6, cd: 9, range: 10,
      run: (g, e, p, S) => { const a0 = R() * TAU, s = R() < 0.5 ? 1 : -1; for (let k = 0; k * 0.45 < 3.6; k++) later(S, k * 0.45, () => { for (let i = 0; i < 5; i++) fire(g, e, a0 + s * deg(14) * k + (i / 5) * TAU, 4.5, 80, 'flame', 10); }); } },
    { n: 'Eruption Columns', tele: 1.0, dur: 2.2, cd: 10, range: 11,
      mark: (g, e, p, S) => {                               // five narrow lanes across your way, erupting one after another
        const a = ang(e.x, e.y, p.x, p.y) + Math.PI / 2, nx = Math.cos(a - Math.PI / 2), ny = Math.sin(a - Math.PI / 2);
        for (let k = 0; k < 5; k++) { const o = (k - 2) * 2.4, cx = p.x + nx * o, cy = p.y + ny * o; lane(g, e, cx - Math.cos(a) * 8, cy - Math.sin(a) * 8, a, 16, 1.0 + k * 0.45, 120, 0.4, RED, 0.4); }
      } },
    { n: 'Cinder Scatter', tele: 0.6, dur: 0.6, cd: 6, range: 10,
      run: (g, e, p, S) => { const a = aim(g, e, p, S, 5.5); fan(g, e, a, 12, deg(150), 5.5, 85, 'ember'); later(S, 0.55, () => fan(g, e, a + deg(150) / 22, 12, deg(150), 5.5, 85, 'ember')); } },
  ] },
  eclipse_shade: { move: orbit(3.5, 5, 4.5), atk: [
    { n: 'Eclipse Blink', tele: 0.8, dur: 0.6, cd: 6, range: 11, still: true,
      mark: (g, e, p, S) => { S.to = spot(g, p.x, p.y, 3, 5); if (S.to) zone(g, e, S.to[0], S.to[1], 0.8, 0.8, 0, ['#1a0c20', '#8a5ad8']); },
      run: (g, e, p, S) => { if (S.to) { e.x = S.to[0]; e.y = S.to[1]; } const volley = () => fan(g, e, ang(e.x, e.y, p.x, p.y), 6, deg(60), 6, 95, 'crescent'); volley(); later(S, 0.5, volley); } },
    { n: 'Darklight Exchange', tele: 0.8, dur: 3.2, cd: 8, range: 10,
      run: (g, e, p, S) => {                                // eight, gold and violet by turns: the gold fly on; the violet stop at 1.5 s and come back the way they went
        const a0 = ang(e.x, e.y, p.x, p.y), back = [];
        for (let k = 0; k < 8; k++) { const a = a0 + (k / 8) * TAU; if (k % 2) { const b = fire(g, e, a, 3.5, 100, 'porb', 12, 0.4); b.life = 4; back.push(b); } else fire(g, e, a, 5.5, 100, 'gorb', 12, 0.4); }
        later(S, 1.5, () => { for (const b of back) if (b.life > 0) { b.vx = -b.vx; b.vy = -b.vy; b.a = Math.atan2(b.vy, b.vx); b.life = 1.5; } });
      } },
    { n: 'Shadow Pursuit', tele: 0.7, dur: 4, cd: 10, range: 11, chase: 4.5,
      run: (g, e, p, S) => { for (let t = 0.4; t < 4; t += 0.75) later(S, t, () => fan(g, e, ang(e.x, e.y, p.x, p.y), 2, deg(16), 5, 85, 'crescent')); } },
  ] },
  forge_golem: { move: keep(1.5, 2.5, 2.0), atk: [
    { n: 'Piston Slam', tele: 1.1, dur: 1.0, cd: 6.5, range: 7, still: true,
      mark: (g, e) => zone(g, e, e.x, e.y, 2.0, 1.1, 170),
      run: (g, e, p, S) => { const a = ang(e.x, e.y, p.x, p.y); for (let k = 0; k < 8; k++) later(S, k * 0.12, () => { for (const s of [-1, 1]) fire(g, e, a + s * deg(45), 5, 105, 'stone', 10, 0.4); }); } },
    { n: 'Furnace Vents', tele: 1.0, dur: 1.1, cd: 9, range: 9,
      mark: (g, e, p, S) => { S.vents = [0, 1, 2, 3].map((k) => [e.x + Math.cos(k * Math.PI / 2 + deg(45)) * 3, e.y + Math.sin(k * Math.PI / 2 + deg(45)) * 3]); for (const [x, y] of S.vents) zone(g, e, x, y, 0.6, 1.0, 0); },
      run: (g, e, p, S) => { for (let w = 0; w < 3; w++) later(S, w * 0.5, () => { for (const [x, y] of S.vents) fan(g, e, ang(x, y, p.x, p.y), 3, deg(30), 4.5, 85, 'blob', 10, g.up(x, y, 0.3)); }); } },
    { n: 'Crushing Advance', tele: 0.8, dur: 3, cd: 10, range: 8, chase: 1.2,
      run: (g, e, p, S) => { for (let t = 0.3; t < 3; t += 0.9) later(S, t, () => fan(g, e, ang(e.x, e.y, p.x, p.y), 5, deg(60), 5, 95, 'stone', 6)); } },
  ] },
  sunbound_construct: { move: keep(4, 6, 3.5), atk: [
    { n: 'Orbital Lances', tele: 0.85, dur: 2.5, cd: 9, range: 11,
      run: (g, e, p, S) => { const a0 = R() * TAU, s = R() < 0.5 ? 1 : -1; for (let c = 0; c < 5; c++) later(S, c * 0.5, () => { for (let i = 0; i < 4; i++) { const a = a0 + s * deg(18) * c + (i / 4) * TAU, x = e.x + Math.cos(a) * 1.4, y = e.y + Math.sin(a) * 1.4; fire(g, e, a, 5.5, 105, 'lance', 12, 0.35, g.up(x, y, 0.6)); } }); } },
    { n: 'Sundial Crossing', tele: 1.1, dur: 0.2, cd: 20, range: 12, when: (g, e, S) => !(S.nodes || []).some((q) => !q.dead),   // (14 s after they close: they last 6)
      mark: (g, e, p, S) => { const mx = (e.x + p.x) / 2, my = (e.y + p.y) / 2, a = ang(e.x, e.y, p.x, p.y) + Math.PI / 2; S.at = [-1, 1].map((s) => [mx + Math.cos(a) * s * 7, my + Math.sin(a) * s * 7]); for (const [x, y] of S.at) zone(g, e, x, y, 0.9, 1.1, 0, GOLD); },
      run: (g, e, p, S) => { S.nodes = S.at.map(([x, y], k) => { const q = g.addEnemy('solar_node', x, y); q.noLoot = true; q.seen = true; q.kinUntil = g.t + 6; q.kinOther = k; q.kinFirst = k * 0.7; return q; }); S.nodes.forEach((q, k) => { q.kinPair = S.nodes[1 - k]; }); } },
    { n: 'Radiant Execution', tele: 1.15, dur: 1.4, cd: 11, range: 12,
      mark: (g, e, p, S) => { const a = R() * Math.PI, nx = -Math.sin(a), ny = Math.cos(a); for (let k = 0; k < 3; k++) { const o = (k - 1) * 1.6, cx = p.x + nx * o, cy = p.y + ny * o; lane(g, e, cx - Math.cos(a) * 7, cy - Math.sin(a) * 7, a, 14, 1.15 + k * 0.55, 160, 0.3, GOLD, 0.3); } } },
  ] },
  solar_node: { move: () => {}, atk: [], tick(g, e, dt, S) {   // a node of the Sundial Crossing: a wall toward the other node every 1.4 s, the two by turns
    if (g.t > e.kinUntil) { e.noLoot = true; e.dead = true; e.deadT = 0; return; }
    if ((S.wallT = (S.wallT ?? 0.4 + (e.kinFirst || 0)) - dt) > 0) return;
    S.wallT = 1.4; const o = e.kinPair, a = o && !o.dead ? ang(e.x, e.y, o.x, o.y) : ang(e.x, e.y, g.player.x, g.player.y), gap = Math.floor(R() * 7);
    for (let k = 0; k < 9; k++) { if (k === gap || k === gap + 1) continue; const off = (k - 4) * 0.9, x = e.x - Math.sin(a) * off, y = e.y + Math.cos(a) * off; g.shoot('e', ...g.up(x, y, 0.5), a, 5, 15, D(95), 'castle_shots/gorb', 0.4, false, e.D.name); }
  } },
};

const methods = {
  // a castle defender's turn: its own timers, a dash in flight, its attack under way, or its next
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
      else if (!S.cur.still) K.move(this, e, dt * 0.6, p, d, S);
      if (S.busy <= 0) { S.cd[S.cur.n] = S.cur.cd; S.cur = null; e.state = 'move'; }
      return;
    }
    K.move(this, e, dt, p, d, S);
    e.state = 'move';
    for (const n in S.cd) S.cd[n] -= dt;
    for (const A of K.atk) {
      if (S.cd[A.n] > 0 || d > (A.range || 10) || (A.when && !A.when(this, e, S))) continue;
      if (!this.seesFoe || !this.seesFoe(e, p)) continue;  // (not through walls)
      const C = this.kinCond(e);
      if (C && !C.may(this, e, A)) continue;
      S.lead = C ? C.start(this, e, A) : false;
      S.cur = A; S.busy = A.tele + A.dur; e.state = 'tell';
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
  const def = (id, name, hp, contact, speed, r, df, xp, extra = {}) => { ENEMIES[id] = { name, biome: 'throne', reg: 'castle_kin/' + id, hp, def: df, speed, xp, r, ai: 'kite', keep: 5, aggro: 12, contact, touchCd: 0.8, kin: id, attacks: [], loot: ELITE.has(id) ? E : T, ...extra }; };
  def('cinder_bat', 'Cinder Bat', 4500, 55, 5.2, 0.45, 8, 300, { fly: true });
  def('lava_slime', 'Lava Slime', 6500, 65, 2.2, 0.5, 10, 350);
  def('cinder_archer', 'Cinder Archer', 9500, 45, 3.4, 0.5, 12, 450);
  def('hollow_wraith', 'Hollow Wraith', 12500, 55, 3.8, 0.5, 12, 550, { fly: true });
  def('infernal_hound', 'Infernal Hound', 13000, 90, 5.5, 0.55, 14, 550);
  def('solar_acolyte', 'Solar Acolyte', 15000, 45, 3.2, 0.5, 14, 600);
  def('lava_guard', 'Lava Guard', 18000, 105, 2.5, 0.6, 24, 700);
  def('sun_cultist', 'Sun Cultist', 18500, 50, 3.0, 0.5, 16, 750);
  def('sunbound_knight', 'Sunbound Knight', 24000, 115, 3.8, 0.6, 24, 900);
  def('cinder_elemental', 'Cinder Elemental', 26000, 85, 3.0, 0.6, 18, 950, { fly: true });
  def('eclipse_shade', 'Eclipse Shade', 28000, 80, 4.5, 0.55, 18, 1000, { fly: true });
  def('forge_golem', 'Forge Golem', 32000, 130, 2.0, 0.7, 30, 1100);
  def('sunbound_construct', 'Sunbound Construct', 42000, 115, 3.5, 0.7, 28, 1400, { fly: true });
  ENEMIES.sun_portal = { name: 'Solar Portal', biome: 'throne', reg: 'wiz_kin/portal', hp: 5000, def: 8, speed: 0, xp: 0, r: 0.6, ai: 'rooted', aggro: 30, fly: true, kin: 'sun_portal', attacks: [], loot: [] };
  ENEMIES.solar_node = { name: 'Solar Node', biome: 'throne', reg: 'wiz_kin/portal', hp: 7500, def: 10, speed: 0, xp: 0, r: 0.6, ai: 'rooted', aggro: 30, fly: true, kin: 'solar_node', attacks: [], loot: [] };
}
