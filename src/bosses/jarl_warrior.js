// The Hollow Jarl, Warrior: stage 1 of the Hollow Court, 'THE WARRIOR'S HUNT' (2026-11-02 redesign, the user: "the
// Warrior should feel terrifying rather than sluggish"; src/bosses/jarl_court.js). He hunts you at 4.6 tiles a second
// through the Wizard's portal fire, and between his attacks never lets up. (2026-11-02, the user's polish spec, 10: "the Warrior should feel
// like an unstoppable executioner": his four, below, to its numbers; he walks you down at 5.2.) Superseded lines below:
//   W1 Chain of Charges   three charges in a row (four in III): each a lane that follows you 0.4 s, locks, 0.3 s on him
//                         at 10.5 tiles a second, past where you stood (185 if it runs you down); a stone ring where the
//                         last one ends (90). Then his recovery: a spin (0.45 s marked, 195 close) and fourteen crescents
//                         (95); then he stands, spent, 1.2 s (a breath to strike: he takes a quarter more)
//   W2 Reaping Sweep      three sweeps, each its wedge 0.55 s: left of you, right of you, through you (170 close; seven
//                         crescents each, 95)
//   W3 Groundbreaker      0.8 s, a circle round him (190); three rings of stone out from it 0.35 s apart, each with an
//                         opening that turns (100)
//   W4 Death Hunt (II+)   'YOU CANNOT RUN.': 6.5 s after you at 6 t/s (he turns, not snaps), five crescents every 1.1 s
//                         (100), and two charges in it
// STAGGERED: a charge that runs into a wall (stand near one, and step aside) breaks off his chain: he reels 2.2 s, taking
// a third more. Damage numbers are effective ones (D(n): set above a Throne-geared character's Defense).
// Art: tools/build_jarl_warrior.py ('bx_jarl_warrior', 'jarl_shots/<name>').
import { TAU, angleTo, target } from './kit.js';
import { courtTick, partner } from './jarl_court.js';

const FIRE = ['#ff8a1f', '#ffd650', '#ff3a1a'], ASH = ['#5a5560', '#8a8490', '#b884cc'];
const RED = ['#ff6a1c', '#ff6a1c', '#ff3a1a', '#ffffff'];
const D = (n) => n + 4;
const deg = (d) => (d * Math.PI) / 180;
const CHARGE_V = 10;                                     // (tiles a second: a sprinting player is 7 to 9)
const later = (e, t, name, V = {}) => e.bx.vol.push({ t, V: { form: 'special', ...V, name } });   // (its own name last)
const shot = (g, e, x, y, a, V) => g.bxShot(e, x, y, a, V);
const CRESCENT = { sprite: 'jarl_shots/crescent', size: 0.4 }, STONE = { sprite: 'jarl_shots/stone', size: 0.4 };
const cleave = (g, e, a, r, spread, delay, dmg) => g.fx.push({ kind: 'cleave', x: e.x, y: e.y, a, r, spread, delay, t: 0, life: delay + 0.3, dmg: dmg ? g.bxDmg(e, dmg) : 0, by: e.D.name, done: !dmg });
const lane = (g, e, x, y, a, len, delay, dmg, w = 1.2, live = 0.35) => g.fx.push({ kind: 'lane', x, y, a, len, w, delay, t: 0, life: delay + (dmg ? live : 0.02), dmg: dmg ? g.bxDmg(e, dmg) : 0, by: e.D.name, hitT: 0, cols: RED });
const zone = (g, e, r, delay, dmg) => g.fx.push({ kind: 'zone', src: e, x: e.x, y: e.y, r, t: 0, delay, life: delay + 0.15, dmg: dmg ? g.bxDmg(e, dmg) : 0, by: e.D.name, done: !dmg, colors: FIRE });
// the court, in the spec's own 40x34 tiles, fitted to the room
const court = (e) => e.room || { x: Math.floor(e.x) - 20, y: Math.floor(e.y) - 20, w: 40, h: 34 };
function reach(e, a, want) {                               // how far he can go that way and stay in the court
  const H = court(e); let L = want;
  while (L > 0.5) { const x = e.x + Math.cos(a) * L, y = e.y + Math.sin(a) * L; if (x > H.x + 1.6 && x < H.x + H.w - 1.6 && y > H.y + 1.6 && y < H.y + H.h - 1.6) break; L -= 0.25; }
  return L;
}
const bearing = (g, e) => { const q = target(g, e); return angleTo(e.x, e.y, q.x, q.y); };
const swish = (g) => { g.sfx('shatter'); g.vx({ k: 'shake', amt: 3 }); };

// ================================================================ W1 Chain of Charges
// Executioner's Charge (the user's: 0.7 s, its line locked for the last 0.3; up to 8 tiles at 10 t/s, 175; where it stops
// twelve ash crescents over 260 degrees, gaps between, 95). In III, two in a row
function chain(g, e) { e.bx.jwBusy = true; const n = (e.bx.phase || 1) >= 3 ? 2 : 1; later(e, 0, 'chargeMark', { left: n - 1, recover: false }); }
function chargeMark(g, e, V) {                             // the lane follows you 0.4 s...
  const a = bearing(g, e);
  lane(g, e, e.x, e.y, a, reach(e, a, 9), 0.4, 0, 1.4);
  later(e, 0.4, 'chargeLock', V);
}
function chargeLock(g, e, V) {                             // ...locks; 0.3 s on, he goes, past where you stood
  const q = target(g, e), a = bearing(g, e), want = V.short ? 3.5 : Math.min(8, Math.hypot(q.x - e.x, q.y - e.y) + 3), L = reach(e, a, want);
  lane(g, e, e.x, e.y, a, L, 0.3, 0, 1.4);
  e.jwDash = { x0: e.x, y0: e.y, x1: e.x + Math.cos(a) * L, y1: e.y + Math.sin(a) * L, at: g.t + 0.3, until: g.t + 0.3 + L / CHARGE_V, a, dmg: D(175), hit: false,
    crash: L < want - 0.6, left: V.left, recover: V.recover };
  g.sfx('roar');
}
function chargeEnd(g, e, C) {
  if (C.crash) { stagger(g, e, 2.2, 'THE JARL STAGGERS'); g.vx({ k: 'shake', amt: 9 }); g.vx({ k: 'burst', x: e.x, y: e.y, n: 30, colors: ASH }); g.sfx('hammer'); return; }
  if (C.left > 0) { later(e, 0.15, 'chargeMark', { left: C.left - 1, recover: C.recover }); return; }
  for (let k = 0; k < 14; k++) { if (k === 4 || k === 9) continue; shot(g, e, e.x, e.y, C.a + (k / 13 - 0.5) * deg(260), { ...CRESCENT, speed: 5.6, range: 11, dmg: D(95) }); }   // (twelve ash crescents, two gaps)
  g.vx({ k: 'shake', amt: 5 }); g.sfx('hammer');
  if (C.recover) { zone(g, e, 2.8, 0.45, D(195)); later(e, 0.45, 'spin'); } else e.bx.jwBusy = false;
}
function spin(g, e) {                                      // the recovery: a spin, crescents all round; then he stands, spent
  for (let k = 0; k < 14; k++) shot(g, e, e.x, e.y, (k / 14) * TAU + g.t, { ...CRESCENT, speed: 5.6, range: 11, dmg: D(95) });
  swish(g); stagger(g, e, 1.2);
}
// he stands (his flinch held), taking more; the Wizard's portals do not wait
function stagger(g, e, t, say) {
  const S = e.bx;
  S.vol = []; e.jwDash = null; S.jwHunt = null; S.jwBusy = false; S.jwStag = g.t + t; S.flinch = g.t + t; S.flinchNext = g.t + t + 0.6;
  S.state = 'recover'; S.wait = t; S.pat = null;
  if (say) { if (g.banner) g.banner(say, 1400); g.float(e.x, e.y - 3, 'STAGGERED', '#ffd650', e); }
}

// ================================================================ W2 Reaping Sweep
// Crownfall (the user's: 0.85 s; two crossing fans of crescents, 105; a heavy slam 0.7 s on, 190; 1.2 s to recover)
function sweep(g, e) { const a = bearing(g, e); cleave(g, e, a, 2.5, deg(150), 0.85, 0); later(e, 0.85, 'crownFans', { a }); zone(g, e, 2.6, 1.55, D(190)); later(e, 1.55, 'slamThud2'); }
function crownFans(g, e, V) { for (const o of [-1, 1]) for (let k = 0; k < 7; k++) shot(g, e, e.x + Math.cos(V.a + o * 1.4) * 1.2, e.y + Math.sin(V.a + o * 1.4) * 1.2, V.a - o * deg(18) + (k / 6 - 0.5) * deg(70), { ...CRESCENT, speed: 6, range: 12, dmg: D(105), free: true }); swish(g); }
function slamThud2(g) { g.vx({ k: 'shake', amt: 8 }); g.sfx('hammer'); }
function sweepMark(g, e, V) { const a = bearing(g, e) + deg(V.s); cleave(g, e, a, 2.5, deg(150), 0.55, D(170)); later(e, 0.55, 'sweepCut', { a }); }
function sweepCut(g, e, V) { for (let k = 0; k < 7; k++) shot(g, e, e.x, e.y, V.a + (k / 6 - 0.5) * deg(120), { ...CRESCENT, speed: 6.4, range: 11, dmg: D(95) }); swish(g); }

// ================================================================ W3 Groundbreaker
// King's Ruin (the user's: 0.9 s; the slam 200 where it's marked; three rings of eighteen 0.45 s apart, the openings turning, 105)
function shock(g, e) { zone(g, e, 2.4, 0.9, D(200)); const a = bearing(g, e); for (let k = 0; k < 3; k++) later(e, 0.9 + k * 0.45, 'shockRing', { k, gap: a + k * deg(40) }); }
function shockRing(g, e, V) {
  const s = TAU / 18, g0 = Math.round(V.gap / s);
  for (let i = 0; i < 18; i++) { if ([g0 - 1, g0, g0 + 1].some((j) => ((j % 18) + 18) % 18 === i)) continue; shot(g, e, e.x, e.y, i * s, { ...STONE, speed: 4.6, range: 14, dmg: D(105) }); }
  g.vx({ k: 'shake', amt: 5 }); g.sfx('hammer');
}

// ================================================================ W4 Death Hunt
function deathHunt(g, e) {
  const S = e.bx;
  if (g.banner) g.banner('YOU CANNOT RUN.', 1400); g.sfx('roar');   // (Relentless Pursuit, the user's: 0.7 s, 8 s after you; an axe fan every 1.4 s, 100; a short charge every 3 s, 175; then spent 1.5 s)
  S.jwHunt = { at: g.t + 0.7, until: g.t + 8.7, a: bearing(g, e) }; S.jwBusy = true;
  for (let t = 0.7 + 1.4; t < 8.7; t += 1.4) later(e, t, 'huntFan');
  for (const t of [3.0, 6.0]) later(e, t, 'chargeMark', { left: 0, recover: false, short: true });
  later(e, 8.8, 'huntSpent');
}
function huntFan(g, e) { if (e.jwDash) return; const a = bearing(g, e); for (let k = 0; k < 7; k++) shot(g, e, e.x, e.y, a + (k / 6 - 0.5) * deg(90), { ...CRESCENT, speed: 6.2, range: 10, dmg: D(100) }); swish(g); }   // (a sweeping axe fan)
function huntSpent(g, e) { e.bx.jwHunt = null; stagger(g, e, 1.5, 'THE JARL STAGGERS'); }

// under it all (2026-11-02, the user: "we need BULLET HELL"): a crescent fan every 1.6 s (1.3 in III), by turns at you
// and where you are going, while he chases, charges and slams
function pressureFan(g, e) {
  const S = e.bx; if (S.jwStag > g.t || e.jwDash) return;
  const q = target(g, e), lead = (S.jwPf = (S.jwPf || 0) + 1) % 2, [vx, vy] = [S.pvx || 0, S.pvy || 0], tx = lead ? q.x + vx * 0.6 : q.x, ty = lead ? q.y + vy * 0.6 : q.y, a = angleTo(e.x, e.y, tx, ty);
  for (let k = 0; k < 5; k++) shot(g, e, e.x, e.y, a + (k / 4 - 0.5) * deg(48), { ...CRESCENT, speed: 6.4, range: 12, dmg: D(95) });
}
// Axe Storm: he plants himself and spins: three arms of crescents turning round him for 3 s (a crescent an arm every
// 0.12 s; the way they turn changes each time), then a ring of eighteen as he stops (105)
function axeStorm(g, e) {
  const S = e.bx; S.jwStorm = { a0: Math.random() * TAU, dir: (S.jwSd = -(S.jwSd || 1)), t0: g.t + 0.6, until: g.t + 3.6, next: g.t + 0.6 };
  g.fx.push({ kind: 'zone', src: e, x: e.x, y: e.y, r: 2.2, t: 0, delay: 0.6, life: 0.6, dmg: 0, by: e.D.name, done: true, colors: FIRE });
  if (g.banner) g.banner('THE AXE STORM', 1000); g.sfx('roar');
}
function stormEnd(g, e) { for (let k = 0; k < 18; k++) shot(g, e, e.x, e.y, (k / 18) * TAU, { ...CRESCENT, speed: 5, range: 13, dmg: D(105) }); swish(g); }

const P = (name, special, recover, o = {}) => ({ name, special, windup: 0.45, recover, ...o });
const AT = {
  chain: P("Executioner's Charge", 'chain', 0.6, { move: 'hold' }), sweep: P('Crownfall', 'sweep', 2.75, { move: 'hold' }), shock: P("King's Ruin", 'shock', 2.0),
  hunt: P('Relentless Pursuit', 'deathHunt', 1.0, { move: 'chase' }), storm: P('Axe Storm', 'axeStorm', 3.4, { move: 'hold' }),
};
// his order, by phase (the chain always first: a hunter opens with the hunt)
const ORDER = { 1: ['chain', 'shock', 'storm', 'sweep', 'hunt'], 2: ['storm', 'chain', 'sweep', 'shock', 'hunt'], 3: ['chain', 'storm', 'shock', 'sweep', 'hunt', 'storm'] };
function choose(g, e) {
  courtTick(g, e);
  const S = e.bx, L = ORDER[S.phase] || ORDER[3];
  if (S.jwPh !== S.phase) { S.jwPh = S.phase; S.jwK = 0; }
  if (e.jwDash || S.jwBusy) return null;                   // (a chain still running)
  if (S.jwCall) { S.jwCall = false; return AT.chain; }     // (the Mage's Spectral Crossfire: a charge with it)
  return AT[L[S.jwK++ % L.length]];
}

export default {
  id: 'jarl_warrior', art: 'jarl_warrior', name: 'The Hollow Jarl, Warrior', biome: 'dungeon', hp: 245000, def: 26, xp: 9000,
  r: 1.5, speed: 4.6, keep: 1.6, faces: false, tempo: 1, dmgScale: 1, spawnCentre: true, thresholds: [0.66, 0.30],
  choose,
  walkPace: 4.4,                                            // (his walk clip at the pace he walks)
  charging: (g, e) => !!(e.jwDash && g.t >= e.jwDash.at) || !!(e.bx.jwHunt && g.t > e.bx.jwHunt.at && g.t < e.bx.jwHunt.until),   // (his charge clip: a charge, the Death Hunt)
  dmgMult: (g, e) => (e.bx.jwStag > g.t ? 1.33 : 1),        // (staggered: open to you)
  phases: { 1: { move: 'walk', pressure: [{ every: 1.6, special: 'pressureFan', delay: 2 }], patterns: Object.values(AT) }, 2: { move: 'walk', pressure: [{ every: 1.45, special: 'pressureFan', delay: 1.5 }], patterns: Object.values(AT) }, 3: { move: 'walk', pressure: [{ every: 1.3, special: 'pressureFan', delay: 1.5 }], patterns: Object.values(AT) } },
  specials: { pressureFan, axeStorm, stormEnd, chain, chargeMark, chargeLock, spin, sweep, sweepMark, sweepCut, crownFans, slamThud2, shock, shockRing, deathHunt, huntFan, huntSpent },
  moves: {
    walk(g, e, dt) {                                        // after you, 4.6 tiles a second
      if (e.jwDash || e.bx.jwStag > g.t) return;
      const q = target(g, e), d = Math.hypot(q.x - e.x, q.y - e.y);
      if (d > (e.D.keep || 1.6)) g.moveCircle(e, ((q.x - e.x) / d) * 5.2 * dt, ((q.y - e.y) / d) * 5.2 * dt, 0.8);
    },
    hold() {},
    chase(g, e, dt) {                                       // the Death Hunt: 6 t/s, turning at most 2.6 radians a second
      const H = e.bx.jwHunt;
      if (e.jwDash || !H || g.t < H.at || g.t > H.until) return;
      const q = target(g, e), want = angleTo(e.x, e.y, q.x, q.y), da = Math.atan2(Math.sin(want - H.a), Math.cos(want - H.a));
      H.a += Math.max(-2.6 * dt, Math.min(2.6 * dt, da));
      if (Math.hypot(q.x - e.x, q.y - e.y) > 1.6) g.moveCircle(e, Math.cos(H.a) * 6 * dt, Math.sin(H.a) * 6 * dt, 0.8);
    },
  },
  onWake(g, e) { if (g.banner) g.banner(partner(e) ? 'THE HOLLOW COURT · "BEND THE KNEE."' : '"BEND THE KNEE."', 2600); },
  onPhase(g, e) { e.jwDash = null; e.bx.jwHunt = null; e.bx.jwBusy = false; e.bx.jwStag = 0; e.bx.wait = Math.min(e.bx.wait || 0, 1.2); g.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 30, colors: ASH }); g.sfx('roar'); },
  update(g, e) {
    const S = e.bx;
    courtTick(g, e);
    if (S.state === 'sleep' || S.state === 'intro') return;
    const C = e.jwDash;                                     // a charge: it strikes you once if it runs you down
    if (C && g.t >= C.at) {
      if (g.t >= C.until) { e.x = C.x1; e.y = C.y1; e.jwDash = null; chargeEnd(g, e, C); }
      else {
        const k = (g.t - C.at) / (C.until - C.at); e.x = C.x0 + (C.x1 - C.x0) * k; e.y = C.y0 + (C.y1 - C.y0) * k;
        const p = g.player; if (!C.hit && p && !p.dead && Math.hypot(p.x - e.x, p.y - e.y) < e.D.r + 0.5) { C.hit = true; g.hurtPlayer(g.bxDmg(e, C.dmg), e.D.name); }
        if (Math.random() < 0.6) g.vx({ k: 'burst', x: e.x - Math.cos(C.a), y: e.y - Math.sin(C.a), n: 2, colors: ASH });
      }
    }
    const ST = S.jwStorm;                                   // the storm turning
    if (ST && g.t >= ST.t0) { if (g.t > ST.until) { S.jwStorm = null; stormEnd(g, e); } else if (g.t >= ST.next) { ST.next += 0.12; const a = ST.a0 + ST.dir * deg(150) * (g.t - ST.t0); for (let i = 0; i < 3; i++) shot(g, e, e.x, e.y, a + (i / 3) * TAU, { ...CRESCENT, speed: 5.4, range: 13, dmg: D(100) }); } }
    if (S.jwStag > g.t && Math.random() < 0.25) g.vx({ k: 'burst', x: e.x + (Math.random() - 0.5) * 1.5, y: e.y - 2.5, n: 1, colors: ['#ffd650', '#fff4c4'] });   // (reeling: sparks over him)
    if (S.phase >= 2 && Math.random() < 0.2) g.vx({ k: 'burst', x: e.x + (Math.random() - 0.5) * 2, y: e.y - 1 - Math.random(), n: 1, colors: ASH });
  },
  onDeath(g, e) { e.jwDash = null; e.bx.jwStag = 0; g.vx({ k: 'shake', amt: 8 }); },
  lights(g, e) { return [{ x: e.x, y: e.y, h: 2.4, r: (e.bx.phase || 1) === 3 ? 70 : 45, col: '#ff8a3a', fire: true }]; },
  loot: [], lootLuck: 1.2,                                  // (every class's gear in its band: src/bosses/boss_loot.js)
};
