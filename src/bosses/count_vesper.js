// Count Vesper, the Crimson Count: the boss of the Crimson Keep (docs/design/boss_count_vesper.md).
// His throne room: marble, a carpet to the throne, pillars, candelabras. His own mechanics: thralls that kneel at the
// throne and heal him (and burn in the candlelight); a hedge of thorns that flies apart sideways; weaving bat fans;
// scythes that go out and wheel back; a dash with an afterimage; blood rain on marked patches that leaves pools;
// staggered nova rings.
import { TID, SK } from '../world/maps.js';
const TAU = Math.PI * 2, R = Math.random;
const angleTo = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);
const centre = (e) => { const A = e.bx.arena; return A ? [A.x + A.w / 2, A.y + A.h / 2] : [e.x, e.y]; };

function bolts(g, e, V) {                           // blood bolts: volleys of three, the later ones leading you
  const p = g.player;
  for (let k = 0; k < (V.n || 2); k++) e.bx.vol.push({ t: k * 0.35, V: { form: 'special', name: 'boltVolley', lead: k, dmg: V.dmg || 100 } });
  void p;
}
function boltVolley(g, e, V) {
  const p = g.player, [ox, oy] = g.bxOrigin(e), vel = p.vel || { x: 0, y: 0 }, tx = p.x + vel.x * 0.35 * V.lead, ty = p.y + vel.y * 0.35 * V.lead, a = angleTo(ox, oy, tx, ty);
  for (const off of [-0.12, 0, 0.12]) g.bxShot(e, ox, oy, a + off, { shot: 'blood_bolt', speed: 8, range: 13, dmg: V.dmg });
}
function hedge(g, e, V) {                           // a row of thorns roots between him and you, then flies apart sideways
  const p = g.player, [ox, oy] = g.bxOrigin(e), a = angleTo(ox, oy, p.x, p.y), L = Math.hypot(p.x - ox, p.y - oy);
  for (let k = 0; k < 9; k++) {
    const u = 2 + (k / 8) * Math.max(2, L - 1), x = ox + Math.cos(a) * u, y = oy + Math.sin(a) * u, side = k % 2 ? 1 : -1;
    g.bxShot(e, x, y, a + side * Math.PI / 2, { shot: 'rose_thorn', speed: 6, range: 10, dmg: V.dmg || 105, mv: { hold: 0.8 } });
  }
}
function kneel(g, e) {                              // two thralls kneel at the throne's sides and heal him while they live
  const [cx] = centre(e), A = e.bx.arena, y = A ? A.y + 4 : e.y - 2;
  e.bx.kneelers = [-5, 5].map((dx) => { const t = g.addEnemy('kneeling_thrall', cx + dx + 0.5, y + 0.5); t.seen = true; return t; });
  e.bx.healT = 2;
  g.banner('Thralls kneel at the throne. While they live, he drinks.', 2000);
}
function bats(g, e, V) {                            // fans of bats that weave, each its own way
  for (let k = 0; k < 3; k++) e.bx.vol.push({ t: k * 0.35, V: { form: 'special', name: 'batFan', dmg: V.dmg || 100 } });
}
function batFan(g, e, V) {
  const p = g.player, [ox, oy] = g.bxOrigin(e), a = angleTo(ox, oy, p.x, p.y);
  for (let k = 0; k < 7; k++) { const b = g.bxShot(e, ox, oy, a + (k / 6 - 0.5) * 1.3, { shot: 'bat_swarm', speed: 5.5, range: 12, dmg: V.dmg, mv: { wave: { amp: 0.6 + R() * 0.6, freq: 5 + R() * 4 } } }); b.cs = R() < 0.5 ? -1 : 1; }
}
function scythes(g, e, V) {                         // four great scythes thrown wide; they stop, and wheel back to him
  const p = g.player, [ox, oy] = g.bxOrigin(e), a = angleTo(ox, oy, p.x, p.y);
  for (const off of [-0.9, -0.3, 0.3, 0.9]) g.bxShot(e, ox, oy, a + off, { shot: 'blood_scythe', speed: 6.5, range: 99, dmg: V.dmg || 115, size: 0.6, mv: { boomer: 1.0 }, life: 2.4 });
}
function rain(g, e, V) {                            // three patches darken, rain blood, and leave a pool
  const p = g.player, S = e.bx;
  S.rain = S.rain || [];
  for (let k = 0; k < 3; k++) { const a = R() * TAU, d = k ? 2.5 + R() * 3 : 0; S.rain.push({ x: Math.floor(p.x + Math.cos(a) * d), y: Math.floor(p.y + Math.sin(a) * d), at: g.t + 1, until: g.t + 3, drop: 0, dmg: V.dmg || 95 }); }
}
function nova(g, e, V) {                            // three rings, each gap a quarter-turn on from the last
  const g0 = R() * TAU;
  for (let k = 0; k < 3; k++) e.bx.vol.push({ t: k * 0.45, V: { form: 'special', name: 'novaRing', gapA: g0 + k * Math.PI / 2, dmg: V.dmg || 110 } });
}
function novaRing(g, e, V) {
  const [ox, oy] = g.bxOrigin(e), n = 24;
  for (let k = 0; k < n; k++) { const a = (k / n) * TAU; if (Math.abs(Math.atan2(Math.sin(a - V.gapA), Math.cos(a - V.gapA))) < 0.4) continue; g.bxShot(e, ox, oy, a, { shot: 'sanguine_nova', speed: 4.4, range: 18, dmg: V.dmg }); }
}

export default {
  id: 'count_vesper', name: 'Count Vesper, the Crimson Count', biome: 'dungeon', hp: 200000, def: 26, xp: 11000, r: 2.2, speed: 1.6, keep: 7, faces: true, shotSheet: 'bx2_shots',
  phases: {
    1: { move: 'promenade', patterns: [
      { name: 'the kneeling thralls', windup: 0.6, recover: 0.4, special: 'kneel' },
      { name: 'blood bolts', windup: 0.6, recover: 0.6, special: 'bolts', n: 2, dmg: 100 },
      { name: 'hedge of thorns', windup: 0.7, recover: 0.8, special: 'hedge', dmg: 105 },
      { name: 'blood bolts', windup: 0.5, recover: 0.6, special: 'bolts', n: 2, dmg: 100 },
      { name: 'hedge of thorns', windup: 0.6, recover: 0.7, special: 'hedge', dmg: 105 },
      { name: 'the kneeling thralls', windup: 0.6, recover: 0.4, special: 'kneel' },
    ] },
    2: { move: 'batdash', patterns: [
      { name: 'bat swarm', windup: 0.6, recover: 0.5, special: 'bats', dmg: 100 },
      { name: 'scythes', windup: 0.7, recover: 0.9, special: 'scythes', dmg: 115 },
    ] },
    3: { move: 'center', patterns: [
      { name: 'blood rain', windup: 0.6, recover: 0.6, special: 'rain', dmg: 95 },
      { name: 'sanguine nova', windup: 0.7, recover: 0.6, special: 'nova', dmg: 110 },
      { name: 'blood bolts', windup: 0.5, recover: 0.5, special: 'bolts', n: 3, dmg: 105 },
    ] },
  },
  specials: { bolts, boltVolley, hedge, kneel, bats, batFan, scythes, rain, nova, novaRing },
  moves: {
    promenade(g, e, dt) {                           // he paces before the throne
      const [cx] = centre(e), A = e.bx.arena, S = e.bx, y = A ? A.y + 8 : e.y;
      S.pace = (S.pace || 0) + dt * 0.45;
      const tx = cx + Math.sin(S.pace) * 8, d = Math.hypot(tx - e.x, y - e.y);
      if (d > 0.1) { const s = Math.min(d, 2 * dt); e.x += ((tx - e.x) / d) * s; e.y += ((y - e.y) / d) * s; }
    },
    batdash(g, e, dt) {                             // between volleys he dashes somewhere new, leaving an afterimage
      const S = e.bx, p = g.player, [cx, cy] = centre(e);
      S.dashCd = (S.dashCd || 0) - dt;
      if (!S.dashTo && (S.state === 'recover' || S.state === 'fight') && S.dashCd <= 0) {   // between volleys
        for (let t = 0; t < 20; t++) {
          const a = R() * TAU, d = 6 + R() * 4, x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
          if (Math.hypot(x - cx, y - cy) < 16) { S.dashTo = { x, y }; break; }
        }
        S.dashCd = 2.2;
      }
      if (S.dashTo) {
        (S.trail = S.trail || []).push({ x: e.x, y: e.y, t: g.t });
        const d = Math.hypot(S.dashTo.x - e.x, S.dashTo.y - e.y);
        if (d < 0.3) S.dashTo = null; else { const s = Math.min(d, 15 * dt); e.x += ((S.dashTo.x - e.x) / d) * s; e.y += ((S.dashTo.y - e.y) / d) * s; }
      }
    },
  },
  update(g, e, dt) {
    const S = e.bx, p = g.player, m = g.map;
    if (S.kneelers && S.kneelers.some((t) => !t.dead) && (S.healT -= dt) <= 0) {   // the thralls feed him
      S.healT = 2;
      for (const t of S.kneelers) if (!t.dead) { e.hp = Math.min(e.maxHp * (S.phase === 1 ? 1 : 0.66), e.hp + e.maxHp * 0.01); g.vx({ k: 'heal', x0: t.x, y0: t.y - 0.6, x1: e.x, y1: e.y - e.hitUp }); }
    }
    if (S.trail) S.trail = S.trail.filter((q) => g.t - q.t < 0.35);
    for (const P of S.rain || []) {                  // the rain falls on its patch, then leaves a pool
      if (g.t < P.at) continue;
      if (g.t < P.until) {
        if ((P.drop -= dt) <= 0) { P.drop = 0.09; g.bxShot(e, P.x - 0.5 + R() * 3, P.y - 1.6 + R() * 1.5, Math.PI / 2, { shot: 'blood_rain', speed: 7, range: 1.6, dmg: P.dmg }); }
      } else if (!P.pooled) {
        P.pooled = true;
        for (let y = P.y - 1; y <= P.y + 1; y++) for (let x = P.x - 1; x <= P.x + 1; x++) {
          const i = y * m.w + x;
          if (!m.solid[i] && m.tiles[i] !== TID.ckblood) { m.tiles[i] = TID.ckblood; if (m.skin) m.skin[i] = SK.crimson_keep_blood_pool; }
        }
        g.vx({ k: 'regfx', key: 'd2_effects/crimson_keep.blood_splash', x: P.x + 0.5, y: P.y + 0.5, fps: 10 });
      }
    }
    if (S.rain) S.rain = S.rain.filter((P) => !P.pooled);
    void p;
  },
  onPhase(g, e, ph) { const S = e.bx; S.dashTo = null; if (ph > 1) for (const t of S.kneelers || []) if (!t.dead) g.damageEnemy(t, 1e9, t.x, t.y, true); },
  onDeath(g, e) { const S = e.bx; S.rain = []; S.dashTo = null; for (const t of S.kneelers || []) if (!t.dead) { t.dead = true; t.deadT = 9; } },
  drawGround(r, g, e) {
    const S = e.bx, b = r.b;
    for (const P of S.rain || []) {                  // the patch darkens before the rain
      const [x, y] = r.proj(P.x + 0.5, P.y + 0.5), k = Math.min(1, Math.max(0, 1 - (P.at - g.t)));
      b.globalAlpha = 0.25 + 0.35 * k; b.fillStyle = '#8e1e30';
      const c = [r.proj(P.x - 1, P.y - 1), r.proj(P.x + 2, P.y - 1), r.proj(P.x + 2, P.y + 2), r.proj(P.x - 1, P.y + 2)];
      b.beginPath(); b.moveTo(c[0][0], c[0][1]); for (const q of c.slice(1)) b.lineTo(q[0], q[1]); b.closePath(); b.fill();
      b.globalAlpha = 1; void x; void y;
    }
    if (S.trail && S.def) {                          // the dash's afterimage
      for (const q of S.trail) {
        const [x, y] = r.proj(q.x, q.y), a = Math.max(0, 0.45 - (g.t - q.t) * 1.3);
        r.drawDef(S.def, S.anim ? S.anim.frame : Object.keys(S.def.frames)[0], Math.round(x), Math.round(y), { alpha: a, flip: !!e.face, flash: true });
      }
    }
  },
  loot: [{ id: 'crimson_rapier', p: 0.1 }, { id: 'bloodthorn_staff', p: 0.1 }, { id: 'batwing_bow', p: 0.1 }, { id: 'sanguine_cloak', p: 0.1 }, { id: 'signet_of_the_count', p: 0.1 },
    { id: 'crimson_chalice', p: 0.1 }, { id: 'nightfall_scythe', p: 0.02 }, { id: 'key_keep', p: 0.06 },
    { slot: 'weapon', tiers: [8, 10], p: 1 }, { slot: 'armor', tiers: [8, 10], p: 1 }, { slot: 'ability', tiers: [3, 5], p: 0.8 }, { slot: 'ring', tiers: [3, 5], p: 0.7 }, { stat: true, p: 1 }, { stat: true, p: 0.8 }],
  lootLuck: 2,
};
