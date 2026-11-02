// The Hollow Jarl, Wizard: to the user's castle spec (art/sunthiefs_castle_complete_encounter_spec.txt, 2). He fights in
// the Hollow Court beside the Warrior, on the court's shared script (src/bosses/jarl_court.js), strafing between four
// fixed magic steps at 3.6 tiles a second (no blinking about):
//   Z1 Lance Inquisition  0.55 s; six waves of five lances in an 18-degree fan every 0.42 s, each aimed 0.23 s before it
//                         flies, at you, then where you will be, by turns (105, 7.4 t/s)
//   Z2 Four Hollow Windows  the four corner sockets glow 0.95 s; portals (12,000 Life, they can be broken) open in
//                         diagonal pairs by turns every 0.65 s for 7 s, each firing three darts in a 22-degree fan (85)
//   Z3 Arcane Loom        0.9 s, the lanes shown; five rows of twelve orbs from the two sides by turns every 0.7 s, two
//                         openings in each, staggered row to row (95, 4.4 t/s)
//   Z4 Sigil Punishment   at 0, 0.5, 1.0 and 1.5 s (where you stand, the last two where you are heading): a circle that
//                         bursts 1.15 s later (175) and throws four darts out (70)
//   Z5 Returning Royalty  0.75 s; a ring of twelve lances, two slots empty (115, 4.6 t/s); 1.55 s on they stop and flash
//                         0.45 s, then fly back the way they came to where they began (5.4 t/s)
//   Z6 Hollow Cage (II+)  'THE CAGE CLOSES.': eight runes 5 tiles round where you stood close to 2.5 over 2.3 s; three go
//                         dark at 1.1 s (the way out); the rest fire two darts inward at 2.0 and 2.55 s (95)
//   Z7 Excommunication (alone)  1.05 s: he steps to a marked corner; the sockets' portals fire seven-shot fans two and
//                         two (90); then nine lances over 120 degrees at where you were 0.4 s before (125)
// Damage numbers are effective ones (D(n): set above a Throne-geared character's Defense).
// Art: tools/build_jarl_wizard.py ('bx_jarl_wizard', 'wiz_shots/<name>', 'wiz_kin/portal').
import { TAU, angleTo, target, ahead } from './kit.js';
import { courtChoose, courtTick, partner, mirrored } from './jarl_court.js';

const D = (n) => n + 4;
const deg = (d) => (d * Math.PI) / 180;
const later = (e, t, name, V = {}) => e.bx.vol.push({ t, V: { form: 'special', ...V, name } });   // (its own name last)
const shot = (g, e, x, y, a, V) => g.bxShot(e, x, y, a, e.jcSurv ? { ...V, speed: V.speed * 1.1 } : V);   // (one crown left: a tenth quicker)
const BOLT = { sprite: 'wiz_shots/bolt', size: 0.35 }, LANCE = { sprite: 'wiz_shots/lance', size: 0.4 }, DART = { sprite: 'wiz_shots/dagger', size: 0.35 }, ORB = { sprite: 'wiz_shots/bolt', size: 0.45 };
const SPIRIT = ['#b884cc', '#e6c8ff', '#8e4ca8'], VIOLET = ['#b884cc', '#b884cc', '#b884cc', '#ffffff'];
const show = (g, e, x, y, a, len, delay, w = 0.6) => g.fx.push({ kind: 'lane', x, y, a, len, w, delay, t: 0, life: delay, dmg: 0, by: e.D.name, hitT: 0, cols: VIOLET });
const circle = (g, e, x, y, r, delay, dmg) => g.fx.push({ kind: 'zone', src: e, x, y, r, t: 0, delay, life: delay + 0.15, dmg: dmg ? g.bxDmg(e, dmg) : 0, by: e.D.name, done: !dmg, colors: SPIRIT });
// the court, in the spec's own 40x34 tiles, fitted to the room
const court = (e) => e.room || { x: Math.floor(e.x) - 27, y: Math.floor(e.y) - 16, w: 40, h: 34 };
const at40 = (e, sx, sy) => { const C = court(e); return { x: C.x + (sx / 40) * C.w, y: C.y + (sy / 34) * C.h }; };
const SOCKETS = (e) => [[4, 4], [36, 4], [36, 30], [4, 30]].map(([x, y]) => at40(e, x, y));   // NW, NE, SE, SW
const STEPS = (e) => [[10, 9], [30, 9], [30, 25], [10, 25]].map(([x, y]) => at40(e, x, y));    // his four magic steps
function at(g, e, dx, h) { const a = g.camAngle || 0; return g.up(e.x + dx * Math.cos(a), e.y - dx * Math.sin(a), h); }
const STAFF = (g, e) => at(g, e, -2.5, 5.6);
function portal(g, e, x, y, life, hp) {                    // a portal: it hangs in the air; it can be broken; it closes by itself
  const q = g.addEnemy('wiz_portal', x, y);
  q.noLoot = true; q.seen = true; q.jzUntil = g.t + life; if (hp) q.hp = q.maxHp = hp;
  g.vx({ k: 'burst', x, y, n: 14, colors: SPIRIT });
  (e.bx.jzPortals = e.bx.jzPortals || []).push(q);
  return q;
}
const closePortals = (e) => { for (const q of e.bx.jzPortals || []) if (!q.dead) { q.noLoot = true; q.dead = true; q.deadT = 0; } e.bx.jzPortals = []; };

// ================================================================ Z1 Lance Inquisition
function inquisition(g, e) { for (let w = 0; w < 6; w++) later(e, 0.6 + w * 0.42 - 0.23, 'lanceAim', { lead: w % 2 }); }
function lanceAim(g, e, V) {                               // where you are now (every second wave: where you will be as they arrive); 0.23 s on, five lances there
  const [ox, oy] = STAFF(g, e), q = target(g, e), [tx, ty] = V.lead ? ahead(g, e, 0.23 + Math.hypot(q.x - ox, q.y - oy) / 7.4) : [q.x, q.y], a = angleTo(ox, oy, tx, ty);
  show(g, e, ox, oy, a, 9, 0.23, 0.4);
  later(e, 0.23, 'lanceFire', { a });
}
function lanceFire(g, e, V) { const [ox, oy] = STAFF(g, e); for (let k = 0; k < 5; k++) shot(g, e, ox, oy, V.a + (k / 4 - 0.5) * deg(18), { ...LANCE, speed: 7.4, range: 14, dmg: D(105) }); }

// ================================================================ Z2 Four Hollow Windows
function windows(g, e) {
  for (const s of SOCKETS(e)) circle(g, e, s.x, s.y, 1.2, 0.95, 0);
  later(e, 0.95, 'openWindows');
  g.sfx('portal');
}
function openWindows(g, e) { e.bx.jzWin = { ps: SOCKETS(e).map((s) => portal(g, e, s.x, s.y, 7, 12000)), k: 0, t: 0, until: g.t + 7 }; }
function windowVolley(g, e, W) {                           // a diagonal pair (NW+SE, then NE+SW): three darts each, toward the middle lane and you
  const pair = W.k++ % 2 ? [1, 3] : [0, 2], C = court(e), q = target(g, e);
  for (const i of pair) {
    const p = W.ps[i]; if (!p || p.dead) continue;
    const tx = (C.x + C.w / 2 + q.x) / 2, ty = (C.y + C.h / 2 + q.y) / 2, a = angleTo(p.x, p.y, tx, ty);
    for (let k = 0; k < 3; k++) shot(g, e, p.x, p.y, a + (k - 1) * deg(11), { ...DART, speed: 5.3, range: 18, dmg: D(85) });
  }
}

// ================================================================ Z3 Arcane Loom
function loom(g, e) {
  const C = court(e), flip = mirrored(e);
  for (let r = 0; r < 5; r++) {                            // the lanes, shown along the side the rows start from
    const fromLeft = (r % 2 === 0) !== flip, x = fromLeft ? C.x + 1 : C.x + C.w - 1;
    if (r < 2) show(g, e, x, C.y + 1, Math.PI / 2, C.h - 2, 0.9, 0.5);
    later(e, 0.9 + r * 0.7, 'loomRow', { r, fromLeft });
  }
}
function loomRow(g, e, V) {
  const C = court(e), x = V.fromLeft ? C.x + 1 : C.x + C.w - 1, a = V.fromLeft ? 0 : Math.PI, step = (C.h - 2) / 11;
  const gaps = [[2, 3], [8, 9]].map(([i, j]) => [(i + V.r * 2) % 12, (j + V.r * 2) % 12]).flat();   // two two-orb openings, staggered row to row
  for (let i = 0; i < 12; i++) if (!gaps.includes(i)) shot(g, e, x, C.y + 1 + i * step, a, { ...ORB, speed: 4.4, range: C.w - 1.5, dmg: D(95) });
}

// ================================================================ Z4 Sigil Punishment
function sigils(g, e) { for (let k = 0; k < 4; k++) later(e, k * 0.5, 'sigilMark', { lead: k >= 2 }); }
function sigilMark(g, e, V) { const q = target(g, e), [x, y] = V.lead ? ahead(g, e, 0.8) : [q.x, q.y]; circle(g, e, x, y, 1.6, 1.15, D(175)); later(e, 1.15, 'sigilDarts', { x, y }); }   // (the last two: where you are heading)
function sigilDarts(g, e, V) { for (let k = 0; k < 4; k++) shot(g, e, V.x, V.y, (k * TAU) / 4, { ...DART, speed: 4.8, range: 9, dmg: D(70) }); g.sfx('zap'); }

// ================================================================ Z5 Returning Royalty
function royalty(g, e) { circle(g, e, e.x, e.y, 2.2, 0.8, 0); later(e, 0.8, 'royalOut'); }
function royalOut(g, e) {
  const q = target(g, e), a0 = angleTo(e.x, e.y, q.x, q.y), s = TAU / 12, gap = Math.floor(Math.random() * 12), x = e.x, y = e.y;
  e.bx.jzRoyal = [];
  for (let i = 0; i < 12; i++) { if (i === gap || i === (gap + 1) % 12) continue; const b = shot(g, e, x, y, a0 + i * s + s / 2, { ...LANCE, speed: 4.6, range: 16, dmg: D(115) }); b.jzFrom = [x, y]; b.life = 5; e.bx.jzRoyal.push(b); }
  later(e, 1.55, 'royalHold'); later(e, 2.0, 'royalBack');
}
function royalHold(g, e) { for (const b of e.bx.jzRoyal || []) if (b.life > 0) { b.vx = 0; b.vy = 0; b.life = Math.max(b.life, 1); g.vx({ k: 'burst', x: b.x, y: b.y, n: 2, colors: ['#ffffff'] }); } }
function royalBack(g, e) {
  for (const b of e.bx.jzRoyal || []) {
    if (!(b.life > 0)) continue;
    const [fx, fy] = b.jzFrom, d = Math.hypot(fx - b.x, fy - b.y), a = Math.atan2(fy - b.y, fx - b.x);
    b.vx = Math.cos(a) * 5.4; b.vy = Math.sin(a) * 5.4; b.a = a; b.life = Math.max(0.05, d / 5.4);
  }
  e.bx.jzRoyal = null;
}

// ================================================================ Z6 Hollow Cage
function cage(g, e) {
  if (g.banner) g.banner('THE CAGE CLOSES.', 1600);
  const q = target(g, e), a0 = Math.random() * TAU, d0 = Math.floor(Math.random() * 8);
  e.bx.jzPrison = { x: q.x, y: q.y, a0, r0: 5, r1: 2.5, t0: g.t + 1.0, dur: 2.3, dark: [d0, (d0 + 1) % 8, (d0 + 2) % 8], darkAt: g.t + 1.1 };
  for (const t of [2.0, 2.55]) later(e, t, 'cageFire');
}
function cageFire(g, e) {
  const P = e.bx.jzPrison; if (!P) return;
  const k = Math.max(0, Math.min(1, (g.t - P.t0) / P.dur)), rr = P.r0 + (P.r1 - P.r0) * k;
  for (let i = 0; i < 8; i++) {
    if (P.dark.includes(i)) continue;
    const a = P.a0 + (i / 8) * TAU, x = P.x + Math.cos(a) * rr, y = P.y + Math.sin(a) * rr;
    for (const o of [-0.12, 0.12]) shot(g, e, x, y, a + Math.PI + o, { ...DART, speed: 4.6, range: rr * 2, dmg: D(95) });
  }
}

// ================================================================ Z7 Excommunication (the last crown)
function excommunication(g, e) {
  const q = target(g, e), st = STEPS(e).sort((a, b) => Math.hypot(b.x - q.x, b.y - q.y) - Math.hypot(a.x - q.x, a.y - q.y))[0];
  circle(g, e, st.x, st.y, 1.2, 1.05, 0);
  later(e, 1.05, 'excomStep', { x: st.x, y: st.y });
  later(e, 0.2, 'excomPortals');
  later(e, 1.10, 'excomFans', { ids: [0, 2] }); later(e, 2.0, 'excomFans', { ids: [1, 3] });
  later(e, 2.5, 'excomAim');
}
function excomStep(g, e, V) { g.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 16, colors: SPIRIT }); e.x = V.x; e.y = V.y; e.bx.jzTo = null; g.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 16, colors: SPIRIT }); g.sfx('portal'); }
function excomPortals(g, e) {                             // the four sockets' portals (his two kept ones among them, when he has them)
  const G = e.bx.jzGuard;
  e.bx.jzExc = SOCKETS(e).map((s, i) => { const k = G ? G.pair.indexOf(i) : -1; return k >= 0 && G.ps[k] && !G.ps[k].dead ? G.ps[k] : portal(g, e, s.x, s.y, 3.3, 8000); });
}   // (two of them firing at once at most)
function excomFans(g, e, V) {
  const q = target(g, e);
  for (const i of V.ids) { const p = (e.bx.jzExc || [])[i]; if (!p || p.dead) continue; const a = angleTo(p.x, p.y, q.x, q.y); for (let k = 0; k < 7; k++) shot(g, e, p.x, p.y, a + (k / 6 - 0.5) * deg(70), { ...BOLT, speed: 5.2, range: 18, dmg: D(90) }); }
}
function excomAim(g, e) { const [ox, oy] = STAFF(g, e), q = target(g, e), a = angleTo(ox, oy, q.x, q.y); show(g, e, ox, oy, a, 10, 0.4, 1.4); later(e, 0.4, 'excomLances', { a }); }
function excomLances(g, e, V) { const [ox, oy] = STAFF(g, e); for (let k = 0; k < 9; k++) shot(g, e, ox, oy, V.a + (k / 8 - 0.5) * deg(120), { ...LANCE, speed: 7, range: 15, dmg: D(125) }); }

// alone: two portals of his kept at opposite corners (the spec's cap), three darts by turns every 1.3 s, at you and where
// you are going; one broken comes back 6 s later
function guards(g, e, dt) {
  const S = e.bx, sk = SOCKETS(e), G = S.jzGuard || (S.jzGuard = { ps: [null, null], back: [0, 0], t: 1.3, k: 0, pair: Math.random() < 0.5 ? [0, 2] : [1, 3] });
  G.ps.forEach((q, i) => { if ((!q || q.dead) && g.t > G.back[i]) { if (q && q.dead) { G.back[i] = g.t + 6; G.ps[i] = null; return; } const s = sk[G.pair[i]]; G.ps[i] = portal(g, e, s.x, s.y, 999, 9000); } });
  if ((G.t -= dt) > 0) return;
  G.t = 0.65; const q = G.ps[G.k++ % 2]; if (!q || q.dead) return;
  const [tx, ty] = G.k % 4 < 2 ? ahead(g, e, 0.7) : [target(g, e).x, target(g, e).y], a = angleTo(q.x, q.y, tx, ty);
  for (let k = 0; k < 3; k++) shot(g, e, q.x, q.y, a + (k - 1) * deg(10), { ...DART, speed: 5.3, range: 20, dmg: D(85) });
}
const P = (name, special, recover, o = {}) => ({ name, special, windup: 0.45, recover, ...o });
const AT = {
  Z1: P('Lance Inquisition', 'inquisition', 2.8), Z2: P('Four Hollow Windows', 'windows', 1.2), Z3: P('Arcane Loom', 'loom', 4.0),
  Z4: P('Sigil Punishment', 'sigils', 2.7), Z5: P('Returning Royalty', 'royalty', 4.2), Z6: P('Hollow Cage', 'cage', 3.4),
  Z7: P('Excommunication', 'excommunication', 3.5, { move: 'hold' }),
};

export default {
  id: 'jarl_wizard', art: 'jarl_wizard', name: 'The Hollow Jarl, Wizard', biome: 'dungeon', hp: 265000, def: 22, xp: 9500,
  r: 1.5, speed: 3.6, keep: 7, faces: false, tempo: 1, dmgScale: 1, spawnCentre: true, thresholds: [0.66, 0.30],
  choose: (g, e) => courtChoose(g, e, AT),
  phases: { 1: { move: 'steps', patterns: Object.values(AT) }, 2: { move: 'steps', patterns: Object.values(AT) }, 3: { move: 'steps', patterns: Object.values(AT) } },
  specials: { inquisition, lanceAim, lanceFire, windows, openWindows, loom, loomRow, sigils, sigilMark, sigilDarts, royalty, royalOut, royalHold, royalBack,
    cage, cageFire, excommunication, excomStep, excomPortals, excomFans, excomAim, excomLances },
  moves: {
    steps(g, e, dt) {                                       // between his four magic steps, 3.6 t/s, every few seconds a new one away from you
      const S = e.bx, q = target(g, e), L = STEPS(e);
      if (!S.jzTo || g.t > S.jzToT) {
        const far = L.filter((s) => Math.hypot(s.x - q.x, s.y - q.y) > 5 && (!S.jzTo || Math.hypot(s.x - S.jzTo.x, s.y - S.jzTo.y) > 1));
        S.jzTo = (far.length ? far : L)[Math.floor(Math.random() * (far.length || L.length))]; S.jzToT = g.t + 3 + Math.random();
      }
      const d = Math.hypot(S.jzTo.x - e.x, S.jzTo.y - e.y), sp = 3.6 * (e.jcSurv ? 1.12 : 1) * dt;
      if (d > 0.2) g.moveCircle(e, ((S.jzTo.x - e.x) / d) * Math.min(d, sp), ((S.jzTo.y - e.y) / d) * Math.min(d, sp), 0.8);
    },
  },
  onWake(g, e) { if (g.banner) g.banner(partner(e) ? 'THE HOLLOW COURT · "THEN BURN THE SOUL."' : '"THEN BURN THE SOUL."', 2600); },
  onPhase(g, e) {
    const S = e.bx; S.jzPrison = S.jzWin = null; closePortals(e); S.wait = Math.min(S.wait || 0, 1.5);
    g.vx({ k: 'burst', x: e.x, y: e.y - 2, n: 30, colors: SPIRIT }); g.sfx('portal');
  },
  update(g, e, dt) {
    const S = e.bx;
    courtTick(g, e);
    if (S.state === 'sleep' || S.state === 'intro') return;
    for (const q of S.jzPortals || []) if (!q.dead && g.t > q.jzUntil) { q.noLoot = true; q.dead = true; q.deadT = 0; }
    S.jzPortals = (S.jzPortals || []).filter((q) => !q.dead);
    const W = S.jzWin;                                      // the windows: a diagonal pair every 0.65 s
    if (W && S.state !== 'morph') { if (g.t > W.until) S.jzWin = null; else if ((W.t -= dt) <= 0) { W.t = 0.65; windowVolley(g, e, W); } }
    if (S.jzPrison && g.t > S.jzPrison.t0 + S.jzPrison.dur + 0.4) S.jzPrison = null;
    if ((e.jcSurv || (e.jcCourt && Object.keys(e.jcCourt.m).length === 1)) && S.state !== 'morph' && S.state !== 'grace') guards(g, e, dt);
  },
  onDeath(g, e) { const S = e.bx; S.jzPrison = S.jzWin = null; closePortals(e); g.vx({ k: 'burst', x: e.x, y: e.y - 2, n: 40, colors: SPIRIT }); },
  // drawn on the floor: the cage's runes forming and closing in (the dark ones dim once they go dark)
  drawGround(r, g, e) {
    const P = e.bx.jzPrison; if (!P) return;
    const D0 = (r.objDefs || (r.objDefs = new Map()));
    let rune = D0.get('wiz_shots/rune'); if (rune === undefined) D0.set('wiz_shots/rune', (rune = (r.R && r.R.resolve('wiz_shots/rune')) || null));
    if (!rune) return;
    const fr = Object.keys(rune.frames)[0], k = Math.max(0, Math.min(1, (g.t - P.t0) / P.dur)), rr = P.r0 + (P.r1 - P.r0) * k, forming = g.t < P.t0;
    for (let i = 0; i < 8; i++) { const a = P.a0 + (i / 8) * TAU, [x, y] = r.proj(P.x + Math.cos(a) * rr, P.y + Math.sin(a) * rr); r.drawDef(rune, fr, Math.round(x), Math.round(y), { center: true, scale: 1.3, alpha: P.dark.includes(i) && g.t >= P.darkAt ? 0.15 : forming ? 0.5 : 1 }); }
  },
  lights(g, e) { return [{ x: e.x, y: e.y, h: 4.5, r: 70, col: '#c88aff' }]; },
  loot: [], lootLuck: 1.2,                                  // (every class's gear in its band: src/bosses/boss_loot.js)
};
