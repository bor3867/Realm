// Boss set pieces (docs/design/10_boss_setpieces.md): one handcrafted signature sequence for each of the three-phase
// bosses in BX_SP (the older bosses' set pieces and movement styles went with their old engine, 2026-10-22).
// A set piece is a script that runs for a few seconds: it places telegraphs on the
// ground, spawns bullets it can steer itself (formations that rotate, expand, hold and then let go), moves its boss,
// and gets harder in later phases (P.lv = the boss's phase, 1-3). Mixed into Game like elites.js.
import { isSolid } from './world/maps.js';

const TAU = Math.PI * 2, R = Math.random;
const ang = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);
const BXS = (boss, shot) => `bx_shots/${boss}.${shot}`, BX2 = (boss, shot) => `bx2_shots/${boss}.${shot}`;

// ---------------------------------------------------------------- the toolkit
const tools = {
  spBy(e) { return e === this.boss ? 'The Unstruck' : e.D.name; },
  spLv(e) { return e.bx ? e.bx.phase : e.rxPhase || 1; },
  spDmg(e, k = 1) {
    if (e.bx) return Math.round(this.bxDmg(e, 100) * k);
    if (e === this.boss) return Math.round(70 * k);
    if (e.spD === undefined) {
      const all = Object.values(e.D.moves || {}).flatMap((M) => M.fire || []).map((f) => f.dmg).filter(Boolean);
      e.spD = all.length ? all.reduce((a, b) => a + b, 0) / all.length : 60;
    }
    return Math.round(e.spD * k);
  },
  spArena(e) {
    const A = (e.bx && e.bx.arena) || e.room;
    if (A) return { x: A.x, y: A.y, w: A.w, h: A.h, cx: A.x + A.w / 2, cy: A.y + A.h / 2, r: Math.min(A.w, A.h) / 2 - 1 };
    const h = e.home || e, p = this.player;
    return { x: h.x - 11, y: h.y - 11, w: 22, h: 22, cx: (h.x + p.x) / 2, cy: (h.y + p.y) / 2, r: 10 };
  },
  // one shot; o: { dmg, k (damage factor), mv, size, life, hold }
  spShot(e, x, y, a, sp, range, proj, o = {}) {
    const b = this.shoot('e', x, y, a, sp, range, o.dmg || this.spDmg(e, o.k || 1), proj, o.size || 0.42, false, this.spBy(e));
    if (o.mv) b.mv = { ...o.mv };
    if (o.hold) { b.mv = { ...(b.mv || {}), hold: o.hold }; b.t = 0; }
    if (o.life) b.life = o.life;
    if (e.bx) b.bxOf = e;
    b.spOf = e; b.spA = this.spCur;
    return b;
  },
  spRing(e, x, y, n, a0, sp, range, proj, o = {}) {
    const out = [];
    for (let k = 0; k < n; k++) {
      const a = a0 + (k / n) * TAU;
      if (o.gap !== undefined && Math.abs(Math.atan2(Math.sin(a - o.gap), Math.cos(a - o.gap))) < (o.gapW || 0.35)) continue;
      out.push(this.spShot(e, x, y, a, sp, range, proj, o));
    }
    return out;
  },
  // a bullet the set piece steers itself: fn(b, dt) runs every frame; when it returns true the bullet is let go
  spCtl(b, fn) { b.vx = 0; b.vy = 0; b.life = 99; b.ctl = fn; (this.spCtlList = this.spCtlList || []).push(b); return b; },
  spLaunch(b, a, sp, life = 3) { b.ctl = null; b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp; b.a = a; b.life = life; },
  // ground telegraphs: circle (where something lands), line (a path), safe (a green wedge or circle you want)
  spMark(m) { (this.spMarks = this.spMarks || []).push({ born: this.t, ...m, until: this.t + (m.life || 1) }); },
  spStart(e, name) {
    const S = SP[name];
    if (!S) return 0;
    const P = { t: 0, lv: this.spLv(e), name }, A = { e, S, P };
    (this.spActive = this.spActive || []).push(A);
    this.spCur = A; this.spLast = A;
    if (S.start) S.start(this, e, P);
    if (S.say) this.banner(S.say, 1800);
    return S.dur;
  },
  spUpdate(dt) {
    if (this.spActive && this.spActive.length) {
      for (const A of this.spActive) {
        const e = A.e, gone = e === this.boss ? !this.boss || this.boss.state === 'dead' : e.dead || (e.bx && ['death', 'morph', 'finale'].includes(e.bx.state));
        if (gone) { A.done = true; continue; }
        A.P.t += dt; this.spCur = A;
        A.S.tick(this, e, A.P, dt, A.P.t);
        if (A.P.t >= A.S.dur) { A.done = true; if (A.S.end) A.S.end(this, e, A.P); }
      }
      this.spActive = this.spActive.filter((A) => !A.done);
    }
    if (this.spCtlList && this.spCtlList.length) {
      const live = new Set(this.projectiles);
      this.spCtlList = this.spCtlList.filter((b) => {
        if (!b.ctl || !live.has(b)) return false;
        const owner = b.spOf, dead = !owner || (owner === this.boss ? this.boss.state === 'dead' : owner.dead);
        if (dead) { b.life = 0; return false; }
        if (b.ctl(b, dt)) { if (b.ctl) b.ctl = null; return false; }
        b.vx = 0; b.vy = 0; b.life = Math.max(b.life, 1);
        return true;
      });
    }
    if (this.spMarks && this.spMarks.length) this.spMarks = this.spMarks.filter((m) => m.until > this.t);
  },
  spClear() { this.spActive = []; this.spCtlList = []; this.spMarks = []; },
  // an original boss's own background layer (AMBIENT below), quicker in later phases

};

// ---------------------------------------------------------------- the set pieces
// each: { dur, say?, start(g,e,P), tick(g,e,P,dt,t), end? }. P.lv: the boss's phase (harder later)
const once = (P, key) => { if (P[key]) return false; P[key] = true; return true; };
const every = (P, key, dt, period) => { P[key] = (P[key] ?? 0) - dt; if (P[key] > 0) return false; P[key] += period; return true; };
export const SP = {
  // ======== the three-phase bosses: one more signature each
  // Glacius: the glacier cage. Four walls of lances freeze round you; the one opening slides round the cage as it
  // tightens, then the cage shatters outward
  glacier_cage: { dur: 5.2, say: 'The ice closes in!', start(g, e, P) {
    const p = g.player, cx = p.x, cy = p.y, per = 4 * 2 * 5, n = 40; P.open = R() * per;
    for (let i = 0; i < n; i++) {
      const u = (i / n) * per, b = g.spShot(e, cx, cy, 0, 0.01, 99, BXS('glacius_frozen_wyrm', 'ice_lance'));
      g.spCtl(b, () => { const h = Math.max(1.8, 5 - P.t * 0.7), s = (u / per) * 4, side = Math.floor(s), f = s - side, L = (f - 0.5) * 2 * h;
        const [x, y] = [[cx + L, cy - h], [cx + h, cy + L], [cx - L, cy + h], [cx - h, cy - L]][side];
        const open = (P.open + P.t * 6) % per, dd = Math.min(Math.abs(u - open), per - Math.abs(u - open));
        bb_place(b, x, y, dd < 2.4); b.a = [Math.PI / 2, Math.PI, -Math.PI / 2, 0][side];
        if (P.t > 4.6) { b.hidden = false; b.ghost = false; g.spLaunch(b, ang(cx, cy, b.x, b.y), 5, 2.5); return true; } return false; });
    }
  }, tick() {} },
  // Mother Mycelia: the fairy ring. A ring of spores rises round you; then, one after another round the ring, each
  // puffs inward: the safe spot walks round the circle
  fairy_ring: { dur: 5.6, say: 'A fairy ring rises round you.', start(g, e, P) { const p = g.player; P.c = [p.x, p.y]; P.pts = []; for (let k = 0; k < 14; k++) { const a = (k / 14) * TAU; P.pts.push(g.spCtl(g.spShot(e, p.x + Math.cos(a) * 4.5, p.y + Math.sin(a) * 4.5, a + Math.PI, 0.01, 99, BXS('mother_mycelia', 'spore_puff'), { size: 0.55 }), () => false)); } }, tick(g, e, P, dt, t) {
    const k = Math.floor((t - 1.2) / 0.28);
    if (t > 1.2 && k < 14 && once(P, 'p' + k)) { const b = P.pts[k]; if (b) { b.ctl = null; g.spLaunch(b, ang(b.x, b.y, P.c[0], P.c[1]), 3.2, 3); for (const o of [-0.25, 0.25]) g.spShot(e, b.x, b.y, ang(b.x, b.y, P.c[0], P.c[1]) + o, 3, 8, BXS('mother_mycelia', 'poison_needle'), { k: 0.7 }); } }
  } },
  // the Grand Orrery: the clockwork. An hour hand and a minute hand of brass sweep round the machine in steps, ticking;
  // you keep ahead of them
  clockwork: { dur: 7, say: 'The clockwork ticks.', start(g, e, P) {
    P.h = R() * TAU; P.m = P.h + Math.PI;
    const mk = (hand, len) => { for (let i = 0; i < len; i++) { const b = g.spShot(e, e.x, e.y, 0, 0.01, 99, BXS('grand_orrery', 'brass_shard')), r = 2 + i * 0.95; g.spCtl(b, () => { const a = P[hand]; b.x = e.x + Math.cos(a) * r; b.y = e.y - e.hitUp + Math.sin(a) * r; b.a = a + Math.PI / 2; if (P.t > 6.8) { g.spLaunch(b, a, 4, 3); return true; } return false; }); } };
    mk('h', 8); mk('m', 12);
  }, tick(g, e, P, dt) { if (every(P, 'tick', dt, 0.5)) { P.h += TAU / 12; P.m -= TAU / 24 * (1 + 0.3 * P.lv); g.vx({ k: 'burst', x: e.x, y: e.y - e.hitUp, n: 4, colors: ['#ffd690'] }); } } },
  // the Gilded Sphinx: the riddle of the sands. Three glyphs mark the floor near you; one glows gold. The other two
  // erupt; then the gold one does, a moment later
  sand_riddle: { dur: 4, say: 'Answer the riddle!', start(g, e, P) { const p = g.player; P.z = []; const a0 = R() * TAU; for (let k = 0; k < 3; k++) { const a = a0 + k * 2.1, x = p.x + Math.cos(a) * 2.2, y = p.y + Math.sin(a) * 2.2; P.z.push([x, y]); g.spMark({ kind: k ? 'circle' : 'safe', x, y, r: 1.8, life: k ? 1.6 : 2.8, color: '#ff7a1a' }); } }, tick(g, e, P, dt, t) {
    if (t > 1.6 && once(P, 'a')) for (const [x, y] of P.z.slice(1)) g.spRing(e, x, y, 14, R() * TAU, 4.5, 7, BXS('gilded_sphinx', 'sand_crescent'), { mv: { curve: 0.6 } });
    if (t > 2.8 && once(P, 'b')) g.spRing(e, P.z[0][0], P.z[0][1], 16, R() * TAU, 4, 7, BXS('gilded_sphinx', 'sun_disk'));
  } },
  // the Abyssal Kraken: the maelstrom. Six arms of water wind out of the pool, bending as they go, while the pool's
  // edge throws spray inward
  maelstrom: { dur: 5.6, say: 'The pool becomes a maelstrom!', start(g, e, P) { P.a = R() * TAU; }, tick(g, e, P, dt) {
    P.a += dt * 0.8;
    if (every(P, 's', dt, 0.14)) for (let k = 0; k < 6; k++) g.spShot(e, e.x, e.y - e.hitUp, P.a + (k / 6) * TAU, 4.2, 12, BXS('abyssal_kraken', 'water_bolt'), { mv: { curve: 0.55 } });
  } },
  // the Thornheart Treant: the root network. Roots erupt along the ground toward you, branching as they go: a tree of
  // thorns growing across the clearing
  root_network: { dur: 4.5, say: 'Roots tear through the clearing!', start(g, e, P) { P.tips = [{ x: e.x, y: e.y, a: ang(e.x, e.y, g.player.x, g.player.y), g: 0 }]; }, tick(g, e, P, dt) {
    if (!every(P, 'grow', dt, 0.16)) return;
    const next = [];
    for (const T of P.tips) {
      const x = T.x + Math.cos(T.a) * 1.1, y = T.y + Math.sin(T.a) * 1.1;
      if (isSolid(g.map, x, y) || T.g > 12) continue;
      for (const s of [-1, 1]) g.spShot(e, x, y, T.a + s * Math.PI / 2, 2.4, 1.6, BXS('thornheart_treant', 'corrupted_thorn'));
      g.vx({ k: 'burst', x, y, n: 3, colors: ['#5a8a2a', '#3a2a1a'] });
      next.push({ x, y, a: T.a + (R() - 0.5) * 0.3, g: T.g + 1 });
      if (T.g % 4 === 3 && next.length < 6) next.push({ x, y, a: T.a + (R() < 0.5 ? 0.7 : -0.7), g: T.g + 1 });
    }
    P.tips = next;
  } },
  // Count Vesper: the danse macabre. He dashes to the four corners of a square round you, leaving afterimages; at each
  // corner a scythe wall sweeps across the square; the last dash cuts straight through
  danse_macabre: { dur: 5.4, say: 'May I have this dance?', start(g, e, P) { const p = g.player; P.c = [p.x, p.y]; P.k = 0; P.a0 = R() * TAU; }, tick(g, e, P, dt) {
    if (P.k > 4) return;
    const r = 5.5, a = P.a0 + P.k * (Math.PI / 2), tx = P.k < 4 ? P.c[0] + Math.cos(a) * r : P.c[0] - Math.cos(P.a0) * r, ty = P.k < 4 ? P.c[1] + Math.sin(a) * r : P.c[1] - Math.sin(P.a0) * r;
    const dd = Math.hypot(tx - e.x, ty - e.y);
    (e.bx.trail = e.bx.trail || []).push({ x: e.x, y: e.y, t: g.t });
    if (dd > 0.4) { const s = Math.min(dd, 22 * dt); e.x += ((tx - e.x) / dd) * s; e.y += ((ty - e.y) / dd) * s; return; }
    if (P.k < 4) { const perp = ang(e.x, e.y, P.c[0], P.c[1]); for (let i = -4; i <= 4; i++) { if (i === (P.k % 2 ? 2 : -2)) continue; const ox = Math.cos(perp + Math.PI / 2) * i * 0.8, oy = Math.sin(perp + Math.PI / 2) * i * 0.8; g.spShot(e, e.x + ox, e.y - 1 + oy, perp, 6, 12, BX2('count_vesper', 'blood_scythe')); } }
    P.k++;
  } },
  // the Grinning Ringmaster: the grand finale. Three rings of pins orbit you, each turning its own way; one at a time,
  // outermost first, each ring is thrown in at you
  grand_finale: { dur: 6, say: 'And now... the grand finale!', start(g, e, P) {
    const p = g.player; P.c = [p.x, p.y]; P.rings = [[], [], []];
    [[3, 10, 0.9], [5, 14, -0.7], [7, 18, 0.5]].forEach(([r, n, w], k) => { for (let i = 0; i < n; i++) {
      const S = { a: (i / n) * TAU }, b = g.spShot(e, p.x, p.y, 0, 0.01, 99, BX2('grinning_ringmaster', k === 1 ? 'cane_star' : 'juggling_pin'));
      P.rings[k].push(b);
      g.spCtl(b, (bb, dt) => { S.a += w * dt; bb.x = P.c[0] + Math.cos(S.a) * r; bb.y = P.c[1] + Math.sin(S.a) * r; bb.a = S.a; return bb.thrown; });
    } });
  }, tick(g, e, P, dt, t) {
    for (const [k, at] of [[2, 2.2], [1, 3.4], [0, 4.6]]) if (t > at && once(P, 'r' + k)) for (const b of P.rings[k]) { b.thrown = true; g.spLaunch(b, ang(b.x, b.y, P.c[0], P.c[1]) + 0.12, 4.5, 3); }
  } },
  // the Tidebound Lich: the drowning clock. Twelve skulls stand round you like the hours; the hand goes round and each
  // skull it passes fires at you, faster every turn
  drowning_clock: { dur: 6.5, say: 'The hours toll for the drowned.', start(g, e, P) { const p = g.player; P.sk = []; for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU - Math.PI / 2; P.sk.push(g.spCtl(g.spShot(e, p.x + Math.cos(a) * 6, p.y + Math.sin(a) * 6, a + Math.PI, 0.01, 99, BXS('tidebound_lich', 'drowned_skull')), () => false)); } P.hand = 0; }, tick(g, e, P, dt, t) {
    if (!every(P, 'tick', dt, Math.max(0.12, 0.42 - t * 0.05))) return;
    const b = P.sk[P.hand++ % 12];
    if (b && b.ctl) { const a = ang(b.x, b.y, g.player.x, g.player.y); g.spShot(e, b.x, b.y, a, 6.5, 13, BXS('tidebound_lich', 'soul_bolt')); }
    if (t > 6.1 && once(P, 'end')) for (const s of P.sk) if (s.ctl) { s.ctl = null; g.spLaunch(s, ang(s.x, s.y, g.player.x, g.player.y), 4, 3); }
  } },
  // the Forgeheart Colossus: the forge pistons. Rows of sparks drive across the forge from alternating sides like pistons,
  // each row with its gap a step further along
  forge_pistons: { dur: 5.6, say: 'The pistons fire!', start(g, e, P) { P.n = 0; P.gap = 3 + Math.floor(R() * 10); }, tick(g, e, P, dt) {
    if (!every(P, 'r', dt, 0.75) || P.n >= 7) return;
    const A = g.spArena(e), left = P.n % 2 === 0, rows = Math.floor(A.h - 2);
    P.gap = Math.max(1, Math.min(rows - 4, P.gap + (R() < 0.5 ? -3 : 3))); P.n++;
    g.spMark({ kind: 'safe', x: left ? A.x + 1.5 : A.x + A.w - 1.5, y: A.y + 1 + P.gap + 1.5, r: 1.3, life: 0.8 });
    for (let r = 0; r < rows; r++) { if (r >= P.gap && r < P.gap + 3) continue; g.spShot(e, left ? A.x + 1 : A.x + A.w - 1, A.y + 1.5 + r, left ? 0 : Math.PI, 6.5, A.w, BXS('forgeheart_colossus', 'hammer_spark')); }
  } },
};
// helpers for the formations above
// a formation bullet that may be "off" (an opening in the formation): hidden and harmless while off
function bb_place(b, x, y, off) { b.x = x; b.y = y; b.hidden = !!off; b.ghost = !!off; }

// ---------------------------------------------------------------- wiring into the bosses
// the three-phase bosses: their set piece as one more pattern (phase, which)
export const BX_SP = {
  glacius_frozen_wyrm: [2, 'glacier_cage'], mother_mycelia: [3, 'fairy_ring'], gilded_sphinx: [2, 'sand_riddle'],
  abyssal_kraken: [3, 'maelstrom'], thornheart_treant: [2, 'root_network'], count_vesper: [3, 'danse_macabre'], grinning_ringmaster: [3, 'grand_finale'],
  tidebound_lich: [2, 'drowning_clock'], forgeheart_colossus: [2, 'forge_pistons'],
};
export function wireBxSetpieces(BX) {
  for (const [id, [ph, sp]] of Object.entries(BX_SP)) {
    const B = BX[id];
    if (!B || B.phases[ph].patterns.some((q) => q.special === 'sp_' + sp)) continue;
    B.specials['sp_' + sp] = (g, e) => g.spStart(e, sp);
    B.phases[ph].patterns.push({ name: sp.replace(/_/g, ' '), windup: 0.8, recover: SP[sp].dur * 0.85, special: 'sp_' + sp });
    if (ph < 3) B.phases[3].patterns.push({ name: sp.replace(/_/g, ' '), windup: 0.7, recover: SP[sp].dur * 0.85, special: 'sp_' + sp });   // and again, harder, at the end
  }
}

export function installSetpieces(Game) { Object.assign(Game.prototype, tools); }
