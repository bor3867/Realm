// Maestro Lucan, the Puppeteer: the Gilded Marionette Theatre's boss on the boss framework (2026-10-22). From the
// programme for the final performance: "No strings attached. (There are strings attached.)" "INTERMISSION. The
// understudies will entertain you." "Act III. The Finale. The Maestro takes his bow. Audience participation is mandatory."
// He wears the three masks you brought back, one an act:
//   I   Comedy   - the trapdoor (he drops through the stage; three hatches flicker; he bursts up out of the last, near
//                  you, in a ring of ribbons), jigs that stop and start, scissors that snap shut on your line, his bow
//   II  Tragedy  - INTERMISSION: he leaves the stage to three understudies (fight them; he's back when they fall, or
//                  after 20 s). Then a mirror-puppet of you that fires back every time you fire (in your own browser),
//                  and the curtains: they close in from both wings, burning; keep to centre stage
//   III Silence  - all of it, faster
//   Last: Curtain Call - he bows, and bows. Spotlights wander the stage: be in one when he bows, or the strings take you
// Art: tools/build_hollow_bosses.py ('bx_the_puppeteer', understudies 'hollow_kin/understudy', shots 'hollow_shots/the_puppeteer.<name>').
import { ENEMIES, DUNGEON_BOSSES } from '../data/enemies.js';

const TAU = Math.PI * 2, R = Math.random;
const angleTo = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);
const arena = (e) => e.bx.arena || { x: e.x - 12, y: e.y - 6, w: 24, h: 18 };
const players = (g) => (g.netTargets && g.netTargets.length ? g.netTargets : [g.player]).filter((q) => q && !q.dead);
const target = (g, e) => { const L = players(g); return L.length ? L.reduce((a, b) => (Math.hypot(b.x - e.x, b.y - e.y) < Math.hypot(a.x - e.x, a.y - e.y) ? b : a)) : g.player; };
const open = (m, x, y) => { const tx = Math.floor(x), ty = Math.floor(y); return tx >= 0 && ty >= 0 && tx < m.w && ty < m.h && !m.solid[ty * m.w + tx]; };
const GOLD = ['#f2d070', '#ffffff'];
function hide(e, on) { e.lpHide = on; e.hidden = on; e.under = on; }

// ---- the trapdoor: three hatches light in turn (plain numbers on him), and up he comes out of the last, near you
function trapdoor(g, e, V) {
  const A = arena(e), q = target(g, e), m = g.map, n = 3, hideT = V.hide || 2.6;
  for (let k = 0; k < n; k++) {
    let x = 0, y = 0;
    for (let t = 0; t < 30; t++) {
      if (k === n - 1) { const a = R() * TAU, d = 3 + R() * 1.5; x = q.x + Math.cos(a) * d; y = q.y + Math.sin(a) * d; }
      else { x = A.x + 3 + R() * (A.w - 6); y = A.y + 3 + R() * (A.h - 6); }
      x = Math.max(A.x + 2, Math.min(A.x + A.w - 2, x)); y = Math.max(A.y + 2, Math.min(A.y + A.h - 2, y)); if (open(m, x, y)) break;
    }
    e['lpH' + k + 'x'] = x; e['lpH' + k + 'y'] = y; e['lpH' + k + 'Until'] = g.t + ((k + 1) * hideT) / (n + 0.5);
  }
  e.lpTrapUntil = g.t + hideT; e.lpTrapDmg = V.dmg || 76; hide(e, true);
  g.vx({ k: 'burst', x: e.x, y: e.y - 0.5, n: 16, colors: ['#5a3a22', '#2a1a10', '#ffd650'] });
  g.banner('He drops through a trapdoor! Watch the hatches...', 1600);
}
function trapStep(g, e) {
  if (!(e.lpTrapUntil > 0) || g.t < e.lpTrapUntil) return;
  e.lpTrapUntil = 0; e.x = e.lpH2x; e.y = e.lpH2y; hide(e, false);            // up he comes, in a ring of ribbons
  for (let k = 0; k < 16; k++) { const b = g.bxShot(e, e.x, e.y - 1, (k / 16) * TAU, { shot: 'ribbon', speed: 5, range: 11, dmg: e.lpTrapDmg }); if (b) { b.mv = { d4: true, serp: 2.2 }; } }
  g.vx({ k: 'shake', amt: 5 });
}
// ---- jigs, scissors, the bow
function jig(g, e, V) {
  for (let w = 0; w < (V.waves || 3); w++) e.bx.vol.push({ t: w * 0.4, V: { form: 'special', name: 'jigRing', dmg: V.dmg, arms: V.arms } });
}
function jigRing(g, e, V) { const [ox, oy] = g.bxOrigin(e), base = R() * TAU, n = V.arms || 9; for (let k = 0; k < n; k++) { const b = g.bxShot(e, ox, oy, base + (k * TAU) / n, { shot: 'string', speed: 5.5, range: 11, dmg: V.dmg || 72 }); if (b) b.mv = { d4: true, jerk: 0.22 }; } }
function scissors(g, e, V) {
  const [ox, oy] = g.bxOrigin(e), q = target(g, e), aim = angleTo(ox, oy, q.x, q.y), n = V.n || 8, len = 9, T = 1.2;
  for (const side of [-1, 1]) for (let k = 1; k <= n; k++) { const b = g.bxShot(e, ox, oy, aim, { shot: 'blade', speed: 0, range: 30, dmg: V.dmg || 82 }); if (!b) continue;
    b.mv = { d4: true, scis: { cx: ox, cy: oy, d: (k * len) / n, a: aim + side * 1.1, to: aim, T, out: 6 } }; b.life = T + 2.5; }
}
function bow(g, e, V) {
  const [ox, oy] = g.bxOrigin(e), q = target(g, e), aim = angleTo(ox, oy, q.x, q.y), n = V.n || 5;
  for (let k = 0; k < n; k++) { const b = g.bxShot(e, ox, oy, aim + (k / (n - 1) - 0.5) * 0.9, { shot: 'ribbon', speed: 7, range: 12, dmg: V.dmg || 78 }); if (b) { b.mv = { d4: true, serp: 3.4 }; b.cs = k % 2 ? -1 : 1; } }
}

// ---- II: the intermission's understudies; the mirror-puppet; the curtains
const UNDER = 'lp_understudy';
if (!ENEMIES[UNDER] && ENEMIES.understudy) ENEMIES[UNDER] = { ...ENEMIES.understudy, reg: 'hollow_kin/understudy', scale: 1.5, sheet: undefined, loot: [] };   // (the theatre's own understudy, in new clothes)
function intermission(g, e) {
  const A = arena(e); hide(e, true); e.lpInterUntil = g.t + 20; e.lpUnder = [];
  for (let k = 0; k < 3; k++) { const a = (k * TAU) / 3, u = g.addEnemy(UNDER, A.x + A.w / 2 + Math.cos(a) * 6, A.y + A.h / 2 + Math.sin(a) * 4); u.seen = true; u.aggro = true; u.noLoot = true; e.lpUnder.push(u); }
  g.banner('INTERMISSION! The understudies take the stage.', 2400);
}
function interStep(g, e) {
  if (!(e.lpInterUntil > 0)) return;
  e.lpUnder = (e.lpUnder || []).filter((u) => !u.dead);
  if (!e.lpUnder.length || g.t >= e.lpInterUntil) {
    for (const u of e.lpUnder) { u.noLoot = true; u.dead = true; u.deadT = 0; }
    e.lpInterUntil = 0; hide(e, false); const A = arena(e); e.x = A.x + A.w / 2; e.y = A.y + A.h * 0.35;
    g.banner('The Maestro returns for Act II. In the mask of Tragedy.', 2200); g.vx({ k: 'burst', x: e.x, y: e.y - 1.5, n: 24, colors: GOLD });
  }
}
function mimic(g, e, V) { e.lpMimicUntil = g.t + (V.dur || 10); g.banner('A mirror-puppet of you! It answers every shot you fire.', 2000); }
function curtain(g, e, V) { e.lpCurtUntil = g.t + (V.dur || 5); e.lpCurtT0 = g.t; e.lpCurtW = 0; e.lpCurtMax = (V.close || 0.4) * arena(e).w; g.banner('The curtains close! Keep to centre stage!', 1600); }

// ---- last: CURTAIN CALL. Spotlights wander; be in one each time he bows
const finale = {
  at: 0.1, dur: 13, name: 'Curtain Call', say: 'audience participation is mandatory', after: 1.2,
  start(g, e) { e.lpBowT = 3.2; e.lpBows = 0; e.lpSpots = 3; e.lpSpotT = 0; },
  update(g, e, dt, T) {
    const A = arena(e);
    e.lpSpotT += dt;                                          // the spotlights wander the stage, slowly
    for (let k = 0; k < 3; k++) { const a = e.lpSpotT * (0.35 + k * 0.07) + (k * TAU) / 3; e['lpS' + k + 'x'] = A.x + A.w / 2 + Math.cos(a) * A.w * 0.28; e['lpS' + k + 'y'] = A.y + A.h / 2 + Math.sin(a * 1.3) * A.h * 0.26; }
    if ((e.lpBowT -= dt) <= 0) {                              // he bows: outside a spotlight, the strings take you
      e.lpBowT = 3; e.lpBows++; e.lpBowUntil = g.t + 0.6; g.float(e.x, e.y - 3.5, 'BRAVO!', '#f2d070');
      if (!g.netTargets) bowHits(g, e);
      for (let k = 0; k < 20; k++) g.bxShot(e, e.x, e.y - 1, (k / 20) * TAU + e.lpBows * 0.15, { shot: 'mask', speed: 3.6, range: 12, dmg: 60 });
    }
  },
  end(g, e) { e.lpSpots = 0; },
};
function bowHits(g, e) {
  const p = g.player; if (p.dead) return;
  for (let k = 0; k < (e.lpSpots || 0); k++) if (Math.hypot(p.x - e['lpS' + k + 'x'], p.y - e['lpS' + k + 'y']) < 2.2) return;
  g.hurtPlayer(g.bxDmg(e, 150), `${e.D.name}'s strings`);
}

export default {
  id: 'the_puppeteer', art: 'the_puppeteer', shotSheet: 'hollow_shots', name: 'Maestro Lucan, the Puppeteer', biome: 'theatre', hp: 140000, def: 22, xp: 9000,
  r: 1.5, speed: 1.2, keep: 7, faces: true, tempo: 0.9, finale,
  phases: {
    1: { move: 'pace', patterns: [
      { name: 'a jig', windup: 0.5, recover: 0.6, special: 'jig', waves: 3, dmg: 72 },
      { name: 'the scissors', windup: 0.7, recover: 0.6, special: 'scissors', n: 8, dmg: 82 },
      { name: 'the trapdoor', windup: 0.6, recover: 1.6, special: 'trapdoor', hide: 2.6, dmg: 76 },
      { name: 'his bow', windup: 0.5, recover: 0.5, special: 'bow', n: 5, dmg: 78 },
    ] },
    2: { move: 'pace', patterns: [
      { name: 'the mirror-puppet', windup: 0.7, recover: 0.5, special: 'mimic', dur: 10 },
      { name: 'the scissors', windup: 0.6, recover: 0.6, special: 'scissors', n: 9, dmg: 82 },
      { name: 'the curtains', windup: 0.8, recover: 0.5, special: 'curtain', dur: 5, close: 0.4 },
      { name: 'a jig', windup: 0.5, recover: 0.6, special: 'jig', waves: 3, arms: 10, dmg: 72 },
      { name: 'his bow', windup: 0.5, recover: 0.5, special: 'bow', n: 6, dmg: 78 },
    ] },
    3: { move: 'pace', patterns: [
      { name: 'the trapdoor', windup: 0.5, recover: 1.4, special: 'trapdoor', hide: 2.2, dmg: 80 },
      { name: 'the mirror-puppet', windup: 0.5, recover: 0.4, special: 'mimic', dur: 8 },
      { name: 'the curtains', windup: 0.6, recover: 0.4, special: 'curtain', dur: 5, close: 0.42 },
      { name: 'the scissors', windup: 0.5, recover: 0.5, special: 'scissors', n: 10, dmg: 84 },
      { name: 'a jig', windup: 0.4, recover: 0.5, special: 'jig', waves: 4, arms: 11, dmg: 74 },
      { name: 'his bow', windup: 0.4, recover: 0.5, special: 'bow', n: 7, dmg: 80 },
    ] },
  },
  specials: { trapdoor, jig, jigRing, scissors, bow, mimic, curtain },
  onWake(g) { g.banner('MAESTRO LUCAN · the show must go on!', 3000); },
  onPhase(g, e, ph) { if (ph === 2) intermission(g, e); if (ph === 3) g.banner('ACT III · SILENCE', 2600); },
  update(g, e, dt) {
    const S = e.bx; if (S.state === 'sleep' || S.state === 'intro') return;
    trapStep(g, e); interStep(g, e);
    if (e.lpInterUntil > 0 && S.state !== 'morph') { S.vol = []; if (S.state === 'fight' || S.state === 'windup') { S.state = 'grace'; S.wait = 0.5; } }   // (offstage: he plays nothing)
    if (e.lpCurtUntil > g.t) { const k = Math.min(1, (g.t - e.lpCurtT0) / 1.5); e.lpCurtW = e.lpCurtMax * k; } else e.lpCurtW = 0;
  },
  immune(g, e) { return !!e.lpHide; },
  // in your own browser: your mirror-puppet answers your shots; the curtains burn; his bow finds you outside the light
  local(g, e, dt) {
    const p = g.player, A = arena(e); if (p.dead) return;
    if (e.lpMimicUntil > g.t) { const mx = 2 * (A.x + A.w / 2) - p.x, my = 2 * (A.y + A.h / 2) - p.y;
      if (p.lastShot > 0 && p.lastShot !== e.lpMimLast) { e.lpMimLast = p.lastShot; if ((e.lpMimCd = (e.lpMimCd || 0)) <= g.t) { e.lpMimCd = g.t + 0.35; g.shoot('e', mx, my - 0.6, angleTo(mx, my, p.x, p.y), 8, 14, g.bxDmg(e, 60), 'hollow_shots/the_puppeteer.string', 0.35, false, 'your mirror-puppet'); } } }
    if (e.lpCurtW > 0.3 && (p.x < A.x + e.lpCurtW || p.x > A.x + A.w - e.lpCurtW) && (e.lpCurtHitT = (e.lpCurtHitT || 0) - dt) <= 0) { e.lpCurtHitT = 0.5; g.hurtPlayer(g.bxDmg(e, 60), `${e.D.name}'s curtain`); }
    if (e.net && e.lpBowUntil > g.t && e.lpBowSeen !== e.lpBowUntil) { e.lpBowSeen = e.lpBowUntil; bowHits(g, e); }
  },
  onDeath(g, e) { for (const u of e.lpUnder || []) if (!u.dead) { u.noLoot = true; u.dead = true; u.deadT = 0; } hide(e, false); g.banner('...CURTAIN. THE THEATRE IS DARK AT LAST.', 3400); },
  lights(g, e) { return e.lpHide ? [] : [{ x: e.x, y: e.y, h: 2, r: 90, col: '#ffd690' }]; },
  drawGround(r, g, e) {
    const b = r.b, A = arena(e);
    for (let k = 0; k < 3; k++) {                             // the hatches, lighting in turn while he's under the stage
      const U = e['lpH' + k + 'Until']; if (!(e.lpTrapUntil > g.t) || U === undefined) continue;
      const lit = g.t >= U - 0.7 && g.t < U + 0.3, [x, y] = r.proj(e['lpH' + k + 'x'], e['lpH' + k + 'y']);
      b.fillStyle = '#2a1a10'; b.fillRect(Math.round(x) - 10, Math.round(y) - 6, 20, 12);
      b.strokeStyle = lit ? '#ffd650' : '#5a3a22'; b.lineWidth = lit ? 3 : 1; b.strokeRect(Math.round(x) - 10, Math.round(y) - 6, 20, 12);
    }
    if (e.lpCurtW > 0.3) for (const side of [0, 1]) {         // the curtains: red velvet from the wings
      const x0 = side ? A.x + A.w - e.lpCurtW : A.x, [sx0, sy0] = r.proj(x0, A.y), [sx1, sy1] = r.proj(x0 + e.lpCurtW, A.y + A.h);
      b.globalAlpha = 0.75; b.fillStyle = '#7a1020'; b.fillRect(Math.round(Math.min(sx0, sx1)), Math.round(sy0), Math.round(Math.abs(sx1 - sx0)), Math.round(sy1 - sy0));
      b.fillStyle = '#b81e3a'; for (let k = 0; k < Math.abs(sx1 - sx0); k += 6) b.fillRect(Math.round(Math.min(sx0, sx1) + k), Math.round(sy0), 2, Math.round(sy1 - sy0)); b.globalAlpha = 1;
    }
    for (let k = 0; k < (e.lpSpots || 0); k++) {              // the curtain call's spotlights
      const x = e['lpS' + k + 'x'], y = e['lpS' + k + 'y']; if (x === undefined) continue;
      b.globalAlpha = e.lpBowUntil > g.t ? 0.6 : 0.3; b.fillStyle = '#fff6c8'; b.beginPath();
      for (let j = 0; j <= 24; j++) { const a = (j / 24) * TAU, [px, py] = r.proj(x + Math.cos(a) * 2.2, y + Math.sin(a) * 2.2); if (j) b.lineTo(px, py); else b.moveTo(px, py); }
      b.fill(); b.globalAlpha = 1;
    }
  },
  drawTop(r, g, e) {                                       // your mirror-puppet, across the stage from you (yours alone)
    if (!(e.lpMimicUntil > g.t)) return;
    const A = arena(e), p = g.player, [x, y] = r.proj(2 * (A.x + A.w / 2) - p.x, 2 * (A.y + A.h / 2) - p.y);
    r.spriteAt(r.b, 'hollow_kin/understudy', x, y, 1.6); r.b.textAlign = 'center'; r.plabel(r.b, 'your mirror-puppet', x, y - 34, 16, '#e8d0ff');
  },
  get loot() { return DUNGEON_BOSSES.the_puppeteer.loot; },
  lootLuck: 1.8,
};
