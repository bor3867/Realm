// Boss set pieces (docs/design/10_boss_setpieces.md): one handcrafted signature sequence per boss, plus a movement
// style for each original boss. A set piece is a script that runs for a few seconds: it places telegraphs on the
// ground, spawns bullets it can steer itself (formations that rotate, expand, hold and then let go), moves its boss,
// and gets harder in later phases (P.lv = the boss's phase, 1-3). Mixed into Game like elites.js.
import { REALM_BOSSES, DUNGEON_BOSSES } from './data/enemies.js';
import { isSolid } from './world/maps.js';

const TAU = Math.PI * 2, R = Math.random;
const ang = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);
const RX = (boss, shot) => `rx_shots/${boss}.${shot}`;
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
  spAmbient(e, dt) {
    const F = AMBIENT[e.id];
    if (!F || e.dead || e.state === 'sleep') return;
    const lv = e.rxPhase || 1;
    if ((e.spAmb = (e.spAmb ?? 2) - dt) > 0) return;
    e.spAmb = F.every[lv - 1];
    F.fire(this, e, lv);
  },
  // the Unstruck runs its own engine: from its second phase its anvil rhythm comes every 11-13 s
  spUnstruck(B, dt) {
    if (!B || B.state === 'dead' || !(B.rxPhase >= 2)) return;
    if ((this.spActive || []).some((A) => A.e === B)) return;
    if ((B.spT = (B.spT ?? 4) - dt) > 0) return;
    B.spT = B.rxPhase === 3 ? 9 : 12;
    this.spStart(B, 'anvil_rhythm');
  },
  // ---------------------------------------------------------------- movement styles for the original bosses (D.mstyle)
  spMove(e, dt, style, d) {
    const p = this.player, D = e.D, S = (e.spm = e.spm || { t: 0, dir: 1, a: ang(p.x, p.y, e.x, e.y) }), A = this.spArena(e);
    S.t += dt;
    const step = (tx, ty, sp) => { const dd = Math.hypot(tx - e.x, ty - e.y); if (dd > 0.15) this.moveCircle(e, ((tx - e.x) / dd) * Math.min(dd, sp * dt), ((ty - e.y) / dd) * Math.min(dd, sp * dt), 0.6); };
    const sp = (D.speed || 1) * (e.hp < e.maxHp * 0.33 ? 1.5 : 1);
    switch (style) {
      case 'scuttle': {                                  // a crab: quick sidelong runs round you, turning back now and then
        if ((S.flip = (S.flip ?? 1.6) - dt) <= 0) { S.flip = 1.2 + R() * 1.2; S.dir *= -1; }
        S.a += S.dir * dt * 0.9;
        step(p.x + Math.cos(S.a) * (D.keep || 6), p.y + Math.sin(S.a) * (D.keep || 6), sp * 2.6);
        break;
      }
      case 'flicker': {                                  // a candle flame: it sways after you, goes out here and lights there
        S.a += dt * 0.7; step(p.x + Math.cos(S.a) * 6, p.y + Math.sin(S.a) * 6, sp * 1.6);
        if ((S.next = (S.next ?? 3) - dt) <= 0) {
          S.next = 3.5 + R() * 1.5;
          for (let k = 0; k < 12; k++) { const a = R() * TAU, r = 5 + R() * 3, x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r; if (!isSolid(this.map, x, y)) { this.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 12, colors: ['#8aff6a', '#ffffff'] }); e.x = x; e.y = y; this.vx({ k: 'burst', x, y: y - 1, n: 12, colors: ['#8aff6a', '#ffffff'] }); break; } }
        }
        break;
      }
      case 'orbit': { S.a += dt * 0.55; step(p.x + Math.cos(S.a) * 7, p.y + Math.sin(S.a) * 7, sp * 3); break; }
      case 'stalk': { const dd = Math.hypot(p.x - e.x, p.y - e.y); if (dd > 3) step(p.x, p.y, sp * 2.2); else { S.a += dt * 1.1; step(p.x + Math.cos(S.a) * 2.6, p.y + Math.sin(S.a) * 2.6, sp * 2); } break; }   // relentless: on you, then circling you
      case 'waddle': { S.a += dt * 1.6; const r = 5 + Math.sin(S.t * 2.3) * 2.5; step(p.x + Math.cos(S.a) * r, p.y + Math.sin(S.a * 0.7) * r, sp * 3.2); break; }
      case 'drift': { S.a += dt * 0.25; step(A.cx + Math.cos(S.a) * A.r * 0.4, A.cy + Math.sin(S.a) * A.r * 0.4, sp * 1.5); break; }
      case 'shelves': {                                  // the Archivist steps between the corners of its hall
        if ((S.next = (S.next ?? 2) - dt) <= 0) { S.next = 4; S.k = ((S.k || 0) + 1 + Math.floor(R() * 2)) % 4; }
        const c = [[A.x + 3, A.y + 3], [A.x + A.w - 3, A.y + 3], [A.x + A.w - 3, A.y + A.h - 3], [A.x + 3, A.y + A.h - 3]][S.k || 0];
        step(c[0], c[1], sp * 4);
        break;
      }
      case 'harry': { S.a += dt * 1.3 * S.dir; if ((S.flip = (S.flip ?? 3) - dt) <= 0) { S.flip = 2 + R() * 2; S.dir *= -1; } step(p.x + Math.cos(S.a) * 5.5, p.y + Math.sin(S.a) * 5.5, sp * 2.4); break; }   // a queen that circles you
      case 'stage': { const x = A.cx + Math.sin(S.t * 0.6) * (A.w / 2 - 4); step(x, A.y + 4, sp * 3); break; }   // along the back of the stage
      case 'coil': { S.a += dt * 0.45; step(A.cx + Math.cos(S.a) * A.r * 0.8, A.cy + Math.sin(S.a) * A.r * 0.8, sp * 3.5); break; }   // round the lighthouse
      case 'mirror': { step(2 * A.cx - p.x, 2 * A.cy - p.y, sp * 2.5); break; }   // always opposite you, as in a dream
      case 'throne': { const dd = Math.hypot(p.x - e.x, p.y - e.y), hx = e.hx ?? e.x, hy = e.hy ?? e.y; if (dd > 9) step(p.x, p.y, sp * 1.6); else step(hx + Math.sin(S.t * 0.5) * 2.5, hy, sp); break; }
      default: return false;
    }
    if (d !== undefined) e.face = p.x < e.x;
    return true;
  },
};

// ---------------------------------------------------------------- the set pieces
// each: { dur, say?, start(g,e,P), tick(g,e,P,dt,t), end? }. P.lv: the boss's phase (harder later)
const once = (P, key) => { if (P[key]) return false; P[key] = true; return true; };
const every = (P, key, dt, period) => { P[key] = (P[key] ?? 0) - dt; if (P[key] > 0) return false; P[key] += period; return true; };
export const SP = {
  // ======== the original bosses
  // the Brine Cathedral: the rose window. Three rings of glass bloom round it, turn opposite ways as they open, then
  // shatter outward along their turn; the bell tolls through it
  rose_window: { dur: 6.2, say: 'The rose window opens...', start(g, e, P) {
    P.rings = [];
    [[2, 10, 0.7], [3.5, 16, -0.5], [5, 22, 0.38]].forEach(([r, n, w], k) => {
      for (let i = 0; i < n; i++) {
        const b = g.spShot(e, e.x, e.y - 1, 0, 0.01, 99, RX('brine_cathedral', k === 1 ? 'rose_pearl' : 'rose_shard'));
        const R0 = { a: (i / n) * TAU, r, w: w * (1 + 0.15 * (P.lv - 1)), cx: e.x, cy: e.y - 1, t: 0 };
        g.spCtl(b, (bb, dt) => { R0.t += dt; R0.a += R0.w * dt; R0.r += 0.55 * dt; bb.x = R0.cx + Math.cos(R0.a) * R0.r; bb.y = R0.cy + Math.sin(R0.a) * R0.r;
          if (R0.t > 4.2) { g.spLaunch(bb, R0.a + Math.sign(R0.w) * 0.9, 5, 3); return true; } return false; });
      }
    });
    g.spMark({ kind: 'ring', x: e.x, y: e.y - 1, r: 5, life: 0.8, color: '#ff8fbf' });
  }, tick(g, e, P, dt) { if (every(P, 'bell', dt, 1.3 - 0.2 * P.lv)) { const a = ang(e.x, e.y, g.player.x, g.player.y); for (const o of [-0.2, 0, 0.2]) g.spShot(e, e.x, e.y - 1, a + o, 7, 12, RX('brine_cathedral', 'bell_toll')); } } },
  // the Wick-Mother: the vigil. Six candles light in a ring round you and drip in turn, clockwise; then all of them
  // gutter at once and throw their flames inward
  vigil: { dur: 6.4, say: 'Six candles for the vigil.', start(g, e, P) {
    const p = g.player; P.c = []; P.a0 = R() * TAU;
    for (let k = 0; k < 6; k++) { const a = P.a0 + (k / 6) * TAU; P.c.push([p.x + Math.cos(a) * 5.5, p.y + Math.sin(a) * 5.5]); g.spMark({ kind: 'circle', x: P.c[k][0], y: P.c[k][1], r: 0.7, life: 6.2, color: '#8aff6a' }); }
  }, tick(g, e, P, dt, t) {
    const k = Math.floor((t - 0.6) / 0.55);
    if (t > 0.6 && k < 6 && once(P, 'd' + k)) g.spRing(e, P.c[k][0], P.c[k][1], 7 + P.lv, R() * TAU, 2.8, 7, RX('wick_mother', 'tallow_drop'));
    if (t > 3.8 && once(P, 'warn')) for (const c of P.c) g.spMark({ kind: 'line', x: c[0], y: c[1], a: ang(c[0], c[1], g.player.x, g.player.y), len: 9, life: 0.9, color: '#ffd650' });
    if (t > 4.7 && once(P, 'fire')) for (const c of P.c) { const a = ang(c[0], c[1], g.player.x, g.player.y); for (let s = 0; s < 4 + P.lv; s++) g.spShot(e, c[0], c[1], a, 5 + s * 0.6, 12, RX('wick_mother', 'lit_taper')); }
  } },
  // the Rime Astrolabe: its arms. Two sets of spokes turn opposite ways round it; halfway they stop with a chime and turn
  // back, while it circles you
  astrolabe: { dur: 6.6, say: 'The astrolabe turns.', start(g, e, P) { P.a = R() * TAU; P.b = R() * TAU; P.w = 0.95; }, tick(g, e, P, dt, t) {
    if (t > 3.3 && once(P, 'flip')) { P.w = -P.w * 1.2; g.spRing(e, e.x, e.y - 1, 16, R() * TAU, 4, 12, RX('orrery_of_winter', 'frost_moon')); g.vx({ k: 'shake', amt: 3 }); }
    P.a += P.w * dt; P.b -= P.w * 1.3 * dt;
    if (every(P, 's', dt, 0.13)) {
      for (let k = 0; k < 4; k++) g.spShot(e, e.x, e.y - 1, P.a + (k / 4) * TAU, 5.5, 12, RX('orrery_of_winter', 'icicle_bolt'));
      if (P.lv >= 2) for (let k = 0; k < 3; k++) g.spShot(e, e.x, e.y - 1, P.b + (k / 3) * TAU, 4.5, 12, RX('orrery_of_winter', 'snowflake'));
    }
    g.spMove(e, dt, 'orbit');
  } },
  // the Penitent Colossus: the flagellation. It charges you three times, a line showing each run first; every landing
  // throws a ring of gold whose gap faces away from you (so you must go round it), and marble that bursts
  flagellation: { dur: 6.3, say: 'The Penitent lashes out!', start(g, e, P) { P.n = 0; P.phase = 'aim'; P.pt = 0; }, tick(g, e, P, dt) {
    const p = g.player; P.pt -= dt;
    if (P.phase === 'aim' && P.pt <= 0 && P.n < 3) { P.a = ang(e.x, e.y, p.x, p.y); g.spMark({ kind: 'line', x: e.x, y: e.y, a: P.a, len: 12, life: 0.55, color: '#ff4a5a' }); P.phase = 'wind'; P.pt = 0.55; }
    else if (P.phase === 'wind' && P.pt <= 0) { P.phase = 'run'; P.pt = 0.42; P.hit = false; }
    else if (P.phase === 'run') {
      g.moveCircle(e, Math.cos(P.a) * 19 * dt, Math.sin(P.a) * 19 * dt, 0.6);
      if (!P.hit && Math.hypot(p.x - e.x, p.y - e.y) < 1.5) { P.hit = true; g.hurtPlayer(g.spDmg(e, 1.4), e.D.name); }
      if (P.pt <= 0) {
        P.n++; P.phase = 'aim'; P.pt = 0.35;
        g.spRing(e, e.x, e.y - 0.8, 18 + 4 * P.lv, R() * 0.3, 4.6, 12, RX('penitent_colossus', 'gold_shard'), { gap: ang(e.x, e.y, p.x, p.y) + Math.PI, gapW: 0.5 });
        for (let k = 0; k < 3; k++) g.spShot(e, e.x, e.y - 0.8, ang(e.x, e.y, p.x, p.y) + (k - 1) * 0.7, 3.5, 8, RX('penitent_colossus', 'marble_chunk'), { mv: { split: { at: 0.6, n: 6, speed: 4, range: 4 } } });
        g.vx({ k: 'shake', amt: 6 });
      }
    }
  } },
  // Emily: the yap storm. She belly-slides corner to corner; every few steps a sound ring opens round her, each one
  // turned a little from the last so the gaps walk; at each corner she yells right at you
  yap_storm: { dur: 6.6, say: 'Emily takes a deep breath...', start(g, e, P) { const A = g.spArena(e); P.pts = [[A.x + 3, A.y + 3], [A.x + A.w - 3, A.y + A.h - 3], [A.x + A.w - 3, A.y + 3], [A.x + 3, A.y + A.h - 3]]; P.k = 0; P.rot = 0; }, tick(g, e, P, dt) {
    const T = P.pts[P.k % 4], dd = Math.hypot(T[0] - e.x, T[1] - e.y);
    if (dd > 0.4) g.moveCircle(e, ((T[0] - e.x) / dd) * Math.min(dd, 13 * dt), ((T[1] - e.y) / dd) * Math.min(dd, 13 * dt), 0.6);
    else { P.k++; const a = ang(e.x, e.y, g.player.x, g.player.y); for (let i = 0; i < 5; i++) g.spShot(e, e.x, e.y - 0.8, a + (i - 2) * 0.16, 7.5, 13, RX('emily_the_yapper', 'megayap')); }
    if (every(P, 'r', dt, 0.42 - 0.05 * P.lv)) { P.rot += 0.55; g.spRing(e, e.x, e.y - 0.8, 14, P.rot, 3.6, 9, RX('emily_the_yapper', 'sound_ring'), { gap: P.rot, gapW: 0.45 }); }
  } },
  // the Fallen Star: the supernova countdown. Three rings fall inward on it, each with a gap you're shown; then it pulls
  // you in, a safe wedge lights, and the nova comes, a dense ring with one way out
  supernova: { dur: 8, say: 'The star begins to collapse!', start(g, e, P) { P.safe = R() * TAU; }, tick(g, e, P, dt, t) {
    const p = g.player;
    for (const [k, at] of [[0, 0.8], [1, 2.2], [2, 3.6]]) if (t > at && once(P, 'c' + k)) {
      const gap = R() * TAU, n = 30;
      g.spMark({ kind: 'safe', x: e.x + Math.cos(gap) * 7, y: e.y - 1 + Math.sin(gap) * 7, r: 1.2, life: 1.4 });
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        if (Math.abs(Math.atan2(Math.sin(a - gap), Math.cos(a - gap))) < 0.28) continue;
        const b = g.spShot(e, e.x + Math.cos(a) * 11, e.y - 1 + Math.sin(a) * 11, a + Math.PI, 3.4 + 0.4 * P.lv, 11, RX('the_fallen_star', 'nova_star'));
        b.life = 11 / (3.4 + 0.4 * P.lv);
      }
    }
    if (t > 4.6 && t < 6.3 && !p.dead) { const d0 = Math.hypot(e.x - p.x, e.y - p.y); if (d0 > 2) g.moveCircle(p, ((e.x - p.x) / d0) * 2.4 * dt, ((e.y - p.y) / d0) * 2.4 * dt, 0.32); }
    if (t > 4.6 && once(P, 'show')) g.spMark({ kind: 'wedge', x: e.x, y: e.y - 1, a: P.safe, w: 0.32, len: 12, life: 1.8 });
    if (t > 6.4 && once(P, 'nova')) { g.spRing(e, e.x, e.y - 1, 48, 0, 5, 14, RX('the_fallen_star', 'solar_flare'), { gap: P.safe, gapW: 0.3, k: 1.3 }); g.vx({ k: 'shake', amt: 10 }); }
  } },
  // the Drowned Abbot: the tide liturgy. Walls of water sweep across the chapel from alternate sides, each with a gap
  // in a different place (shown as it comes)
  tide_liturgy: { dur: 6, say: 'The water rises for the liturgy.', start(g, e, P) { P.n = 0; }, tick(g, e, P, dt) {
    if (!every(P, 'w', dt, 1.15 - 0.1 * P.lv) || P.n >= 5) return;
    const A = g.spArena(e), left = P.n % 2 === 0, rows = Math.floor(A.h - 2), gap = 2 + Math.floor(R() * (rows - 6));
    P.n++;
    g.spMark({ kind: 'safe', x: left ? A.x + 1.5 : A.x + A.w - 1.5, y: A.y + 1 + gap + 1.5, r: 1.3, life: 1.2 });
    for (let r = 0; r < rows; r++) { if (r >= gap && r < gap + 3) continue; g.spShot(e, left ? A.x + 1 : A.x + A.w - 1, A.y + 1 + r + 0.5, left ? 0 : Math.PI, 3.4 + 0.3 * P.lv, A.w, RX('drowned_abbot', 'tide_orb')); }
  } },
  // the Fallen Heart: arteries. It beats (a ring each beat, the beats quickening) while four arteries of thorns turn round
  // it like the hands of a clock; at the end the arteries burst outward
  arteries: { dur: 7, say: 'The heart quickens.', start(g, e, P) {
    P.art = [];
    for (let k = 0; k < 4; k++) for (let i = 0; i < 9; i++) {
      const b = g.spShot(e, e.x, e.y - 1, 0, 0.01, 99, RX('fallen_heart', 'thorn_lance')), S = { a: (k / 4) * TAU, r: 1.6 + i * 0.95, cx: e.x, cy: e.y - 1 };
      g.spCtl(b, (bb, dt) => { S.a += (0.42 + 0.1 * P.lv) * dt; bb.x = S.cx + Math.cos(S.a) * S.r; bb.y = S.cy + Math.sin(S.a) * S.r; bb.a = S.a;
        if (P.t > 6.6) { g.spLaunch(bb, S.a, 4, 3); return true; } return false; });
    }
    P.beat = 1;
  }, tick(g, e, P, dt) {
    if ((P.bt = (P.bt ?? 0.3) - dt) <= 0) { P.beat = Math.max(0.5, P.beat * 0.86); P.bt = P.beat; g.spRing(e, e.x, e.y - 1, 20, R() * TAU, 4, 12, RX('fallen_heart', 'blood_tear'), { gap: R() * TAU, gapW: 0.3 }); g.vx({ k: 'shake', amt: 2 }); }
  } },
  // the Archivist: redaction. A page of quill darts writes itself in rows across the hall, with spaces between the
  // words; then the lines are struck out one by one, top to bottom, and fall
  redaction: { dur: 6.4, say: 'The Archivist redacts you.', start(g, e, P) {
    const A = g.spArena(e), p = g.player; P.rows = [];
    for (let r = 0; r < 5; r++) {
      const y = Math.max(A.y + 1.5, Math.min(A.y + A.h - 1.5, p.y - 5 + r * 2.2)), row = [], gap = Math.floor(R() * 14);
      for (let i = 0; i < 18; i++) {
        if (i >= gap && i < gap + 2 + (P.lv < 3 ? 1 : 0)) continue;
        const x = p.x - 8.5 + i;
        if (isSolid(g.map, x, y)) continue;
        row.push(g.spCtl(g.spShot(e, x, y, Math.PI / 2, 0.01, 99, RX('the_archivist', 'quill_dart')), () => false));
      }
      P.rows.push(row);
    }
  }, tick(g, e, P, dt, t) {
    for (let r = 0; r < 5; r++) if (t > 1.6 + r * (0.7 - 0.08 * P.lv) && once(P, 'r' + r)) for (const b of P.rows[r]) { b.ctl = null; g.spLaunch(b, Math.PI / 2, 6, 3); }
    if (t > 5.2 && once(P, 'ink')) g.spRing(e, g.player.x, g.player.y - 4, 8, 0, 3, 6, RX('the_archivist', 'ink_blot'));
  } },
  // Queen Melliflua: her escort. Drones orbit her as she hunts you down; every second two of them peel off at you and
  // new ones take their place; at the end the whole swarm is flung
  escort: { dur: 7, say: 'The Queen calls her escort!', start(g, e, P) { P.dr = []; for (let k = 0; k < 8; k++) P.dr.push(this_drone(g, e, (k / 8) * TAU)); }, tick(g, e, P, dt, t) {
    const p = g.player, d0 = Math.hypot(p.x - e.x, p.y - e.y);
    if (d0 > 2.5) g.moveCircle(e, ((p.x - e.x) / d0) * 4.2 * dt, ((p.y - e.y) / d0) * 4.2 * dt, 0.6);
    if (every(P, 'peel', dt, 1.1 - 0.15 * P.lv)) for (let k = 0; k < 2; k++) { const b = P.dr.shift(); if (b && b.ctl) { b.ctl = null; g.spLaunch(b, ang(b.x, b.y, p.x, p.y), 7, 2.5); } P.dr.push(this_drone(g, e, R() * TAU)); }
    if (t > 6.6 && once(P, 'fling')) { for (const b of P.dr) if (b.ctl) { b.ctl = null; g.spLaunch(b, ang(e.x, e.y, b.x, b.y), 6, 3); } for (const o of [-0.3, 0, 0.3]) g.spShot(e, e.x, e.y - 1, ang(e.x, e.y, p.x, p.y) + o, 8, 12, RX('honey_queen', 'royal_stinger')); }
  } },
  // Maestro Lucan: the marionette bar. Strings hang from the flies right across the stage, each with a gap, and sway
  // together left and right like a controller's crossbar; then they're cut and fall
  marionette_bar: { dur: 6.6, say: 'The strings come down.', start(g, e, P) {
    const A = g.spArena(e); P.base = []; P.A = A;
    const ns = 5 + (P.lv >= 2 ? 1 : 0);
    for (let s = 0; s < ns; s++) {
      const x0 = A.x + 2 + ((s + 0.5) / ns) * (A.w - 4), gap = 2 + Math.floor(R() * (A.h - 8));
      for (let j = 0; j < A.h - 2; j++) {
        if (j >= gap && j < gap + 3) continue;
        const b = g.spShot(e, x0, A.y + 1 + j, Math.PI / 2, 0.01, 99, RX('the_puppeteer', j % 3 ? 'string_lash' : 'control_cross'));
        g.spCtl(b, (bb) => { bb.x = x0 + Math.sin(P.t * (1.2 + 0.25 * P.lv)) * 2.6; if (P.t > 5.4) { g.spLaunch(bb, Math.PI / 2, 5 + (j % 3), 3); return true; } return false; });
      }
    }
  }, tick(g, e, P) { if (P.t > 5.4 && once(P, 'cut')) g.vx({ k: 'shake', amt: 4 }); } },
  // Aurelia: refraction. White lances fly at three prisms in turn; each that reaches one splits into a fan of coloured
  // rays bent toward you
  refraction: { dur: 6.4, say: 'Light bends round the prisms.', start(g, e, P) {
    const A = g.spArena(e); P.pr = [];
    for (let k = 0; k < 3; k++) { const a = R() * TAU, r = 4 + R() * 3, x = A.cx + Math.cos(a) * r, y = A.cy + Math.sin(a) * r; P.pr.push([x, y]); g.spMark({ kind: 'circle', x, y, r: 0.8, life: 6.2, color: '#ffffff' }); }
  }, tick(g, e, P, dt, t) {
    const k = Math.floor(t / 1.9);
    if (k < 3 && every(P, 'l', dt, 0.12) && (t % 1.9) < 0.8) {
      const [px, py] = P.pr[k], a = ang(e.x, e.y - 1, px, py), b = g.spShot(e, e.x, e.y - 1, a, 9, 30, RX('prism_wyrm', 'white_lance'));
      g.spCtl(b, (bb, dt2) => { bb.x += Math.cos(a) * 9 * dt2; bb.y += Math.sin(a) * 9 * dt2; if (Math.hypot(bb.x - px, bb.y - py) < 0.5) {
        const to = ang(px, py, g.player.x, g.player.y);
        for (let i = -1 - (P.lv > 1 ? 1 : 0); i <= 1 + (P.lv > 1 ? 1 : 0); i++) g.spShot(e, px, py, to + i * 0.28, 6.5, 12, RX('prism_wyrm', i % 2 ? 'split_ray' : 'prism_shard'));
        bb.life = 0; return true; } return false; });
    }
  } },
  // the Sleeper: the lucid waltz. Two rings of dream bubbles turn round the middle of the dream, opposite ways, breathing
  // in and out; you dance between them while it watches from across the floor
  lucid_waltz: { dur: 8, say: 'The dream begins to waltz.', start(g, e, P) {
    const A = g.spArena(e);
    [[4.5, 14, 0.6], [8, 22, -0.42], ...(P.lv >= 3 ? [[11, 28, 0.3]] : [])].forEach(([r, n, w]) => { for (let i = 0; i < n; i++) {
      const b = g.spShot(e, A.cx, A.cy, 0, 0.01, 99, RX('the_sleeper', i % 4 ? 'dream_bubble' : 'star_dust')), S = { a: (i / n) * TAU };
      g.spCtl(b, (bb, dt) => { S.a += w * (1 + 0.2 * P.lv) * dt; const rr = r + Math.sin(P.t * 1.4 + (w > 0 ? 0 : 2)) * 1.6; bb.x = A.cx + Math.cos(S.a) * rr; bb.y = A.cy + Math.sin(S.a) * rr;
        if (P.t > 7.6) { g.spLaunch(bb, S.a, 3.5, 3); return true; } return false; });
    } });
  }, tick(g, e, P, dt) { g.spMove(e, dt, 'mirror'); if (every(P, 'z', dt, 0.9 - 0.12 * P.lv)) g.spShot(e, e.x, e.y - 1, ang(e.x, e.y, g.player.x, g.player.y), 3.2, 14, RX('the_sleeper', 'sleepy_z'), { mv: { seek: 0.8 } }); } },
  // the Unstruck God: the coronation. A crown of halos closes in on you from the edge of the hall, its opening turning
  // slowly round; gauntlets slam down where you stand; at the end the crown shatters outward
  coronation: { dur: 8.5, say: 'Kneel for the coronation.', start(g, e, P) {
    const A = g.spArena(e), n = 44; P.gap = R() * TAU;
    for (let i = 0; i < n; i++) {
      const b = g.spShot(e, A.cx, A.cy, 0, 0.01, 99, RX('the_unstruck_god', 'halo_ring')), S = { a: (i / n) * TAU };
      g.spCtl(b, () => { const r = Math.max(3, A.r + 1 - P.t * 1.3), gapNow = P.gap + P.t * (0.35 + 0.08 * P.lv), off = Math.abs(Math.atan2(Math.sin(S.a - gapNow), Math.cos(S.a - gapNow)));
        bb_place(b, A.cx + Math.cos(S.a) * r, A.cy + Math.sin(S.a) * r, off < 0.24);
        if (P.t > 8) { b.hidden = false; b.ghost = false; g.spLaunch(b, S.a, 5, 3); return true; } return false; });
    }
  }, tick(g, e, P, dt) {
    if (every(P, 'slam', dt, 1.5 - 0.2 * P.lv)) { const p = g.player, x = p.x, y = p.y; g.spMark({ kind: 'circle', x, y, r: 1.4, life: 0.8, color: '#ffd650' }); g.fvLater(0.8, () => { if (!e.dead) g.spRing(e, x, y, 8 + 2 * P.lv, R() * TAU, 4.5, 6, RX('the_unstruck_god', 'porcelain_shard')); }); }
  } },
  // the Unstruck: the anvil rhythm. On the beat: a cross of rivets, then a half-beat later another turned between it;
  // every fourth beat a hammer goes out and comes back
  anvil_rhythm: { dur: 6, say: 'The anvil rings in time.', tick(g, e, P, dt) {
    if (!every(P, 'b', dt, 0.62 - 0.06 * P.lv)) return;
    P.n = (P.n || 0) + 1;
    const ox = e.x, oy = e.y - 1.4, base = P.n % 2 ? Math.PI / 4 : 0;
    g.spRing(e, ox, oy, 8, base, 5.5, 13, RX('the_unstruck', 'hot_rivet'));
    g.fvLater(0.3, () => { if (g.boss && g.boss.state !== 'dead') g.spRing(e, ox, oy, 8, base + Math.PI / 8, 4.5, 13, RX('the_unstruck', 'anvil_spark')); });
    if (P.n % 4 === 0) for (const o of [-0.5, 0.5]) g.spShot(e, ox, oy, ang(ox, oy, g.player.x, g.player.y) + o, 7, 99, RX('the_unstruck', 'thrown_hammer'), { mv: { boomer: 1 }, life: 2.4 });
  } },

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
// background layers for the bosses whose own mechanics leave long quiet stretches
const AMBIENT = {
  // the Sleeper: nightmare eyes open at the edge of the dream and drift in after you
  the_sleeper: { every: [1.7, 1.35, 1.0], fire(g, e, lv) {
    const A = g.spArena(e), p = g.player;
    for (let k = 0; k < 2 + lv; k++) { const a = Math.random() * TAU, x = A.cx + Math.cos(a) * A.r, y = A.cy + Math.sin(a) * A.r; g.spShot(e, x, y, ang(x, y, p.x, p.y), 3.2 + 0.3 * lv, 18, RX('the_sleeper', 'nightmare_eye'), { mv: { seek: 0.9 }, life: 5.5 }); }
  } },
  // Maestro Lucan: strings drop from the flies onto where you stand (a line flickers first)
  the_puppeteer: { every: [1.5, 1.15, 0.9], fire(g, e, lv) {
    const A = g.spArena(e), p = g.player;
    for (const dx of lv >= 2 ? [-1.6, 0, 1.6] : [-0.8, 0.8]) {
      const x = p.x + dx; g.spMark({ kind: 'line', x, y: A.y + 1, a: Math.PI / 2, len: A.h - 2, life: 0.5, color: '#fff6d8' });
      g.fvLater(0.5, () => { if (!e.dead) for (let j = 0; j < 4; j++) g.spShot(e, x, A.y + 1 - j * 0.7, Math.PI / 2, 8, A.h + 2, RX('the_puppeteer', 'string_lash')); });
    }
  } },
};
// helpers for the formations above
function this_drone(g, e, a0) {
  const S = { a: a0 }, b = g.spShot(e, e.x, e.y, 0, 0.01, 99, RX('honey_queen', 'drone'));
  return g.spCtl(b, (bb, dt) => { S.a += 2.4 * dt; bb.x = e.x + Math.cos(S.a) * 1.9; bb.y = e.y - 1 + Math.sin(S.a) * 1.9; bb.a = S.a + Math.PI / 2; return false; });
}
// a formation bullet that may be "off" (an opening in the formation): hidden and harmless while off
function bb_place(b, x, y, off) { b.x = x; b.y = y; b.hidden = !!off; b.ghost = !!off; }

// ---------------------------------------------------------------- wiring into the bosses
// the original bosses: a movement style each, and their set piece as a move in their later phases (twice in the last)
export const OLD_SP = {
  brine_cathedral: ['rose_window', 'scuttle'], wick_mother: ['vigil', 'flicker'], orrery_of_winter: ['astrolabe', 'orbit'],
  penitent_colossus: ['flagellation', 'stalk'], emily_the_yapper: ['yap_storm', 'waddle'], the_fallen_star: ['supernova', 'drift'],
  drowned_abbot: ['tide_liturgy', null], fallen_heart: ['arteries', null, 'all'], the_archivist: ['redaction', 'shelves'], honey_queen: ['escort', 'harry'],
  the_puppeteer: ['marionette_bar', 'stage', 'all'], prism_wyrm: ['refraction', 'coil'], the_sleeper: ['lucid_waltz', 'mirror', 'all'], the_unstruck_god: ['coronation', 'throne'],
};
for (const [id, [sp, style, all]] of Object.entries(OLD_SP)) {
  const D = REALM_BOSSES[id] || DUNGEON_BOSSES[id];
  if (!D) continue;
  D.mstyle = style;
  D.moves.sp = { tell: 0.9, setpiece: sp, recover: 0.6 };
  const n = D.phases.length;
  D.phases.forEach((P, i) => {
    if ((i === 0 && !all) || !P.cycle) return;           // 'all': from the first phase (the endgame and the soft ones)
    for (const L of [P.cycle, P.after]) {                 // after: the rotation a frenzy settles into
      if (!L || L.includes('sp')) continue;
      L.splice(1, 0, 'sp');
      if (i === n - 1) L.push('sp');                     // the last phase: twice a rotation
    }
  });
}
// their own patterns, denser where they were thin for their tier (measured: tools/check_old_boss_pressure.mjs)
const TUNE = {
  the_sleeper: { sheep: { rows: 4, n: 8, speed: 6 }, lullaby: { n: 16, waves: 4 }, crescents: { n: 22, speed: 4.6 }, stars: { n: 30 } },
  the_puppeteer: { jig: { arms: 11, waves: 4 }, scissors: { n: 10 }, bow: { n: 7, speed: 7.5 } },
};
for (const [id, T] of Object.entries(TUNE)) {
  const D = DUNGEON_BOSSES[id] || REALM_BOSSES[id];
  for (const [mv, patch] of Object.entries(T)) { const M = D && D.moves[mv]; if (!M) continue; const key = Object.keys(M).find((k) => M[k] && typeof M[k] === 'object' && !Array.isArray(M[k])); if (key) Object.assign(M[key], patch); }
}
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
