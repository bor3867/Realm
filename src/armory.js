// The Mad God Armory's mechanics (src/data/armory_data.js), mixed into Game like src/mythics.js: one signature mechanic
// per item, built from the armory's own test range and its special lines, its numbers from the item's data. The armory
// measures in 40-pixel tiles; here everything is in tiles. What's drawn (mirrors, stars, chimes, the maw, the mandala,
// the column of light...) is in src/armory_draw.js, from the state kept here on the player (p.armS) and the monsters.
//   armoryVolley: a weapon's volley (the armory weapon fires it all itself)   armoryAbility: an ability or the tome
//   armHit: one of its shots struck   armShotTick / armShotEnd: its shots in flight and at their end   armTick: the rest
//   armAnyHit: any of your hits (the Aureole's crown, the Phantom Thread)   armTaken: damage a monster takes from you
//   armPreHurt / armPostHurt: around your being hurt (Empyrean's wings, Null Walker's phase, Hosanna's price)
import { R, dist, angleTo, lift, liftO } from './util.js';
import { dmgMult } from './data/classes.js';
import { ITEMS } from './data/items.js';
import { ARMORY_SETS } from './data/armory_data.js';

const TAU = Math.PI * 2, T = 1 / 40;                       // T: one armory pixel, in tiles
const roll = (r) => r[0] + R() * (r[1] - r[0]);
const EX = (A, i) => A.st.extra[i][1], PT = (A, i) => A.st.parts[i][1];
const segDist = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy || 1; let t = ((px - ax) * dx + (py - ay) * dy) / l; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - ax - t * dx, py - ay - t * dy); };
function segX(a, b, c, d) {
  const r = { x: b.x - a.x, y: b.y - a.y }, s = { x: d.x - c.x, y: d.y - c.y }, den = r.x * s.y - r.y * s.x;
  if (Math.abs(den) < 1e-6) return null;
  const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / den, u = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / den;
  return t > 0.02 && t < 0.98 && u > 0.02 && u < 0.98 ? { x: a.x + t * r.x, y: a.y + t * r.y } : null;
}
function inPoly(pt, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a.y > pt.y) !== (b.y > pt.y) && pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y) + a.x) c = !c; }
  return c;
}
const ID = (name) => 'arm_' + name.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

const methods = {
  // ---------------------------------------------------------------- the toolkit
  armS() { const p = this.player; return p.armS || (p.armS = { n: {}, cd: {}, vis: [], later: [], marked: new Set() }); },
  armA(id) { const it = ITEMS[id]; return it && it.arm; },
  armHeld(id) { return this.player.equip.includes(id); },
  armMult(id) { const S = this.armS(); return dmgMult(this.stat('att')) * (id === ID('Paradox Script') ? 1 + 0.04 * (S.caus || 0) : 1); },
  armLater(s, fn) { this.armS().later.push({ t: this.t + s, fn }); },
  armVis(v) { v.t0 = this.t; this.armS().vis.push(v); return v; },
  armSay(x, y, text, col) { this.float(x, y - 1.2, text, col); },
  armAim() { const I = this.input; return { x: I.aimX, y: I.aimY }; },
  armNear(x, y, r, but) { return this.enemiesIn(x, y, r).filter((e) => e !== but && !e.dead); },
  armNearest(x, y, r = 12, but) { let best = null, bd = r * r; for (const e of this.armNear(x, y, r, but)) { const d = (e.x - x) ** 2 + (e.y - y) ** 2; if (d < bd) { bd = d; best = e; } } return best; },
  armHurt(e, dmgR, x, y, o = {}) {                         // a blow from one of its parts (a range or a number), at your Attack
    const v = Array.isArray(dmgR) ? roll(dmgR) : dmgR, id = o.id;
    this.armAP = !!o.ap;
    let d = 0;
    try { d = this.damageEnemy(e, Math.round(v * (o.raw ? 1 : this.armMult(id)) * (o.k || 1)), x ?? e.x, y ?? e.y - 0.5, !!o.quiet); } finally { this.armAP = false; }
    if (d > 0) this.armAnyHit(e, null, d);
    return d;
  },
  armHeal(n, col = '#86efac') {
    const p = this.player, max = this.stat('hp'), h0 = p.hp;
    p.hp = Math.min(max, p.hp + n); p.armHealOk = p.hp;    // (a heal the armory gave: Hosanna's price lets it through)
    if (p.hp > h0) this.float(...lift(p.x, p.y, 1.4), `+${Math.round(p.hp - h0)}`, col);
  },
  // one of its shots: art `idx` of the item's projectiles, armory scale sc, at your Attack unless raw
  armShot(id, idx, x, y, a, speed, range, dmgR, o = {}) {
    const dmg = Math.round(roll(dmgR) * (o.raw ? 1 : this.armMult(id)));
    const b = this.shoot('p', x, y, a, speed, range, dmg, `arm:${id}:${idx}`, o.size ?? 0.4, o.pierce ?? false);
    b.arm = id; b.armSc = o.sc ?? 4; b.child = true; b.t = 0;
    if (o.spin) b.armSpin = o.spin;
    if (o.alpha !== undefined) b.armAlpha = o.alpha;
    if (o.ap) b.armAP = true;
    if (o.home) { b.armHome = o.home; b.armSpeed = speed; }
    Object.assign(b, o.b || {});
    return b;
  },
  armSetCount(name) { const S = ARMORY_SETS[name]; return S ? this.player.equip.filter((x) => x && ITEMS[x] && ITEMS[x].armSet === name).length : 0; },
  // the Hosanna set's 2-piece bonus: +5 WIS, +40 MP
  armStat(s) { if (!this.player || !this.player.equip) return 0; const n = this.armSetCount('Hosanna'); return n >= 2 ? ({ wis: 5, mp: 40 })[s] || 0 : 0; },

  // ---------------------------------------------------------------- weapons
  armoryVolley(W, sp, ox, oy, a, mult) {
    void mult;
    const id = sp.armory, A = this.armA(id), S = this.armS(), f = FIRE[A.name];
    if (!f) return false;
    S.n[id] = (S.n[id] || 0) + 1;
    f.call(this, A, id, S, ox, oy, a, W);
    return true;
  },
  armoryAbility(id, Ab) {
    const p = this.player, A = this.armA(id), S = this.armS();
    if (p.abilityT > 0) return;
    if (p.mp < Ab.cost) { this.toast('Not enough mana.'); return; }
    if ((S.cd[id] || 0) > this.t) return;
    p.mp -= Ab.cost; p.abilityT = 0.5; S.cd[id] = this.t + (Ab.cd || 0);
    this.sfx('ability');
    S.n[id] = (S.n[id] || 0) + 1;
    CAST[A.name].call(this, A, id, S);
  },
  // a shot in flight: its own path, homing, swallowing or dragging enemy shots
  armShotTick(b, dt) {
    b.t = (b.t || 0) + dt;
    if (b.armPath) b.armPath(b, dt);
    if (b.armHome) {
      const e = this.armNearest(b.x, b.y + 0.5, b.armHomeR || 9);
      if (e) {
        const [tx, ty] = this.up(e.x, e.y, e.hitUp || 0.5), want = Math.atan2(ty - b.y, tx - b.x);
        let da = ((want - b.a) % TAU + TAU * 1.5) % TAU - Math.PI; da = Math.max(-b.armHome * dt, Math.min(b.armHome * dt, da));
        b.a += da; const s = b.armSpeed || Math.hypot(b.vx, b.vy); b.vx = Math.cos(b.a) * s; b.vy = Math.sin(b.a) * s;
      }
    }
    if (b.armTick) b.armTick(b, dt);
  },
  armShotEnd(b) { if (b.armEnd && !b.armEnded) { b.armEnded = true; b.armEnd(b); } },
  armHit(e, b, dealt) { if (b.armOnHit) b.armOnHit(b, e, dealt); },
  // any blow you land: the Aureole's crown, Phantom Thread's shared pain, the Hunger fed
  armAnyHit(e, b, dealt) {
    const p = this.player;
    if (!p.armS) return;
    const S = this.armS();
    S.lastDmg = this.t;
    if (this.armHeld(ID('Aureole')) && (S.halo || 0) >= 1 && !S.crowning) {
      S.halo = 0; S.crowning = true;
      try {
        const A = this.armA(ID('Aureole'));
        e.armCrownT = this.t + 4;
        this.armVis({ k: 'crown', x: e.x, y: e.y, life: 0.6 });
        this.armSay(e.x, e.y - 0.6, 'CROWNED', '#fff3c4');
        for (const o of this.armNear(e.x, e.y, 3)) { this.armHurt(o, A.st.dmg, undefined, undefined, { id: ID('Aureole') }); o.armDazeT = this.t + 1.5; o.slowT = Math.max(o.slowT || 0, 1.5); o.slowF = Math.max(o.slowF || 0, 0.5); }
      } finally { S.crowning = false; }
    }
    const tt = S.tether;
    if (tt && tt.until > this.t && tt.set.has(e) && !S.sharing && dealt > 0) {
      S.sharing = true;
      try { for (const o of tt.set) if (o !== e && !o.dead) this.damageEnemy(o, Math.round(dealt * 0.4), o.x, o.y - 0.5, false); } finally { S.sharing = false; }
    }
    void b; void p;
  },
  // what a monster takes from you, before its Defense: asleep (the first blow wakes it, +50%), crowned (+10%)
  armTaken(e, dmg) {
    if (e.armSleepT > this.t) { e.armSleepT = 0; e.stunT = 0; dmg *= 1.5; this.float(e.x, e.y - 1.6, 'WOKEN ×1.5', '#c4b5fd'); }
    if (e.armCrownT > this.t) dmg *= 1.1;
    return Math.round(dmg);
  },
  // before you're hurt: true when nothing gets through
  armPreHurt() {
    const p = this.player, S = this.armS();
    if (S.phase) return true;                              // Null Walker: out of reality
    if (S.wingsT > this.t) { if (!S.immSay || S.immSay < this.t) { S.immSay = this.t + 0.5; this.armSay(p.x, p.y, 'IMMUNE', '#fff3c4'); } return true; }
    return false;
  },
  armPostHurt() {
    const p = this.player, S = this.armS(), max = this.stat('hp');
    if (this.armHeld(ID('Empyrean')) && p.hp > 0 && p.hp < max * 0.3 && !((S.wingCd || 0) > this.t)) {   // Unfolding
      S.wingsT = this.t + 1.5; S.wingCd = this.t + 30;
      this.armSay(p.x, p.y - 0.4, 'UNFOLDING', '#fff3c4'); this.armHeal(max * 0.15, '#fff3c4');
      this.vx({ k: 'burst', ...liftO(p.x, p.y, 0.6), n: 30, colors: ['#ffffff', '#fff3c4'] }); this.vx({ k: 'shake', amt: 4 });
    }
  },

  // ---------------------------------------------------------------- every frame
  armTick(dt) {
    const p = this.player;
    if (!p || !p.armS) {
      if (!p || !p.equip.some((x) => x && ITEMS[x] && ITEMS[x].arm)) return;
    }
    const S = this.armS();
    if (S.later.length) { const due = S.later.filter((q) => q.t <= this.t); S.later = S.later.filter((q) => q.t > this.t); for (const q of due) q.fn(); }
    S.vis = S.vis.filter((v) => this.t - v.t0 < (v.life ?? 1e9) && !v.gone);
    for (const [name, f] of Object.entries(TICK)) { const id = ID(name); if (this.armHeld(id) || TICK_ALWAYS.has(name)) f.call(this, this.armA(id), id, S, dt); }
    // Hosanna's price: no other heal lifts you above 60% while you hold it
    if (this.armHeld(ID('Hosanna'))) {
      const max = this.stat('hp'), cap = Math.max(max * 0.6, p.armHealOk ?? 0, Math.min(p.hp, S.hosHp ?? p.hp));
      if (p.hp > cap) p.hp = cap;
      S.hosHp = p.hp; p.armHealOk = undefined;
    }
    if (this.armHeld(ID('Aureole'))) S.halo = Math.min(1, (S.halo || 0) + dt / 6);   // Crown of Light: 6s to gather
  },
};

// ---------------------------------------------------------------- what each weapon fires
const FIRE = {
  // planets burst from you and spiral out to 4 tiles; within 1.25 tiles they deal +75%; every 5th volley a Sun
  'Fractured Orbit'(A, id, S, ox, oy) {
    const b0 = S.n[id] * 0.52, sun = S.n[id] % 5 === 0, life = A.st.lt / 1000;
    const mk = (a0, idx, o) => {
      const sh = this.armShot(id, idx, ox, oy, a0, 0.01, 99, o.dmg || A.st.dmg, { pierce: true, sc: o.sc || 3, spin: 5, b: { life } });
      sh.vx = sh.vy = 0; sh.armPath = (b) => {
        const t = Math.min(1, b.t / b.max), r = 8 * T + t * 4, a = a0 + t * (o.sun ? 2.2 : 3.4);
        b.x = ox + Math.cos(a) * r; b.y = oy + Math.sin(a) * r; b.a = a;
        b.dmg = Math.round(b.base * (r < 1.25 ? 1.75 : 1));
      };
      sh.max = o.sun ? life * 1.3 : life; sh.life = sh.max; sh.base = sh.dmg;
      if (o.sun) sh.armOnHit = (b, e) => this.ignite(e, 60, 3);
      return sh;
    };
    for (let i = 0; i < 6; i++) mk(b0 + i * 1.047, i % 3, {});
    if (sun) { mk(b0 + 0.5, 1, { sun: true, sc: 6, dmg: EX(A, 0) }); this.armSay(this.player.x, this.player.y, 'SUN', '#ffb347'); }
  },
  // every 4th cast throws a mirror that hangs at the target; beams that strike it refract into 3 homing shards
  'Mirror Maw'(A, id, S, ox, oy, a) {
    const M = S.mir, aim = this.armAim();
    if (!(M && M.until > this.t) && S.n[id] % 4 === 1) {
      const d = Math.min(dist(ox, oy, aim.x, aim.y), 9), tx = ox + Math.cos(a) * d, ty = oy + Math.sin(a) * d;
      const sh = this.armShot(id, 1, ox, oy, a, 17.5, d, [0, 0], { b: { armNoHit: true } });
      sh.armEnd = () => { S.mir = { x: tx, y: ty, until: this.t + 2.5, born: this.t }; this.armVis({ k: 'mirror', life: 2.5, M: S.mir }); this.armSay(tx, ty, 'MIRROR', '#a5f3fc'); };
      return;
    }
    const W = ITEMS[id].weapon, sh = this.armShot(id, 0, ox, oy, a + (R() - 0.5) * 0.06, W.speed, W.range, A.st.dmg, { pierce: true });
    sh.armTick = (b) => {
      const m = S.mir;
      if (!m || m.until < this.t || b.ref || Math.hypot(b.x - m.x, b.y - m.y) > 0.5) return;
      b.ref = true; b.life = 0;
      this.vx({ k: 'burst', x: m.x, y: m.y, n: 10, colors: ['#ffffff', '#a5f3fc'] }); this.armSay(m.x, m.y, 'REFRACT', '#e0f2fe');
      const targets = [...this.armNear(m.x, m.y + 0.5, 12)].sort((p, q) => dist(m.x, m.y, p.x, p.y) - dist(m.x, m.y, q.x, q.y)).slice(0, 3);
      for (let i = 0; i < 3; i++) { const e = targets[i % Math.max(1, targets.length)], aa = e ? angleTo(m.x, m.y, e.x, e.y - 0.5) + (i - 1) * 0.25 : a + (i - 1) * 0.4; this.armShot(id, 1, m.x, m.y, aa, 10.5, 9.5, EX(A, 0), { sc: 3, home: 6 }); }
    };
  },
  // arrows drag enemy shots into their wake (1.5 tiles) and turn them to gold motes (max 6); on impact the motes slam
  'Gravity Alchemist'(A, id, S, ox, oy, a) {
    const W = ITEMS[id].weapon, sh = this.armShot(id, 0, ox, oy, a, W.speed, W.range, A.st.dmg);
    sh.motes = 0;
    sh.armTick = (b) => {
      if (b.motes >= 6) return;
      for (const e of this.projectiles) {
        if (e.from !== 'e' || e.life <= 0 || e.ghost) continue;
        const r = Math.hypot(e.x - b.x, e.y - b.y);
        if (r < 1.5) { e.x += (b.x - e.x) * 0.12; e.y += (b.y - e.y) * 0.12; if (r < 0.4) { e.life = 0; b.motes++; if (b.motes >= 6) break; } }
      }
    };
    const slam = (b, e) => {
      const n = b.motes; b.motes = 0;
      for (let i = 0; i < n; i++) this.armLater(i * 0.045, () => { if (!e.dead) this.armHurt(e, EX(A, 0), undefined, undefined, { id }); });
      if (n) this.armSay(e.x, e.y - 0.4, 'GOLD ×' + n, '#f5c542');
    };
    sh.armOnHit = slam;
    sh.armEnd = (b) => { for (let i = 0; i < b.motes; i++) this.armShot(id, 1, b.x, b.y, R() * TAU, 7.5, 10.5, EX(A, 0), { sc: 3, home: 7 }); b.motes = 0; };
  },
  // an echo of you, 2s behind, replays every throw from exactly where you stood
  'Time Echo'(A, id, S, ox, oy, a) {
    const W = ITEMS[id].weapon;
    this.armShot(id, 0, ox, oy, a, W.speed, W.range, A.st.dmg, { pierce: true });
    const p = this.player;
    this.armLater(2, () => {
      if (!this.armHeld(id)) return;
      this.armShot(id, 0, ox, oy, a, W.speed, W.range, EX(A, 0), { pierce: true, alpha: 0.55 });
      this.vx({ k: 'burst', x: ox, y: oy, n: 5, colors: ['#a855f7'] });
    });
    void p;
  },
  // each attack sheds a wisp (max 10): it drifts 0.4s, then hunts within 6 tiles; it swallows the first enemy shot it touches and splits
  'Hollow Lantern'(A, id, S, ox, oy, a) {
    const live = this.projectiles.filter((b) => b.arm === id && b.wisp && b.life > 0).length;
    if (live >= 10) return;
    const wisp = (x, y, ang, dmgR) => {
      const sh = this.armShot(id, 0, x, y, ang, 1.2, 99, dmgR, { sc: 4, spin: 0.001, b: { wisp: true } });
      sh.life = sh.max = A.st.lt / 1000;
      sh.armTick = (b) => {
        if (b.t < 0.4) { b.a += Math.sin(b.t * 12) * 0.08; b.vx = Math.cos(b.a) * 1.2; b.vy = Math.sin(b.a) * 1.2; }
        else if (!b.armHome) { b.armHome = 6; b.armHomeR = 6; b.armSpeed = 5.5; }
        if (b.ate) return;
        for (const e of this.projectiles) if (e.from === 'e' && e.life > 0 && !e.ghost && Math.hypot(e.x - b.x, e.y - b.y) < 0.4) {
          e.life = 0; b.ate = true; this.armSay(b.x, b.y, 'SPLIT', '#bff6ff');
          if (this.projectiles.filter((q) => q.arm === id && q.wisp && q.life > 0).length < 10) wisp(b.x, b.y, b.a + (R() - 0.5) * 2.8, EX(A, 0));
          break;
        }
      };
    };
    wisp(ox + 0.35, oy - 0.35, a + (R() - 0.5) * 1.7, A.st.dmg);
  },
  // hits plant seeds; at 5 the enemy Blooms, and the bloom throws petals at the 2 nearest enemies
  'Blood Blossom'(A, id, S, ox, oy, a) {
    const W = ITEMS[id].weapon, seed = (e, n) => {
      e.armSeeds = (e.armSeeds || 0) + n;
      if (e.armSeeds >= 5 && !e.armBlooming) { e.armBlooming = true; this.armLater(0.18, () => bloom(e)); }
    };
    const bloom = (e) => {
      e.armSeeds = 0; e.armBlooming = false;
      if (e.dead) return;
      this.vx({ k: 'burst', x: e.x, y: e.y - 0.5, n: 34, colors: ['#ef4444', '#ff8a8a', '#fde047'] }); this.vx({ k: 'shake', amt: 3 });
      this.armSay(e.x, e.y - 0.4, 'BLOOM', '#ff6b81'); this.armVis({ k: 'ring', x: e.x, y: e.y, r: 1.5, col: '#ef4444', life: 0.45 });
      this.armHurt(e, EX(A, 0), undefined, undefined, { id });
      const near = this.armNear(e.x, e.y, 9, e).sort((p, q) => dist(e.x, e.y, p.x, p.y) - dist(e.x, e.y, q.x, q.y)).slice(0, 2);
      for (const o of near) for (let k = 0; k < 2; k++) {
        const sh = this.armShot(id, 1, e.x, e.y - 0.5, angleTo(e.x, e.y, o.x, o.y) + (R() - 0.5) * 1.2, 7.5, 11, EX(A, 1), { sc: 3, spin: 6, home: 8 });
        sh.armOnHit = (b, t) => { if (t === o) { seed(t, 1); t.slowT = Math.max(t.slowT || 0, 2); t.slowF = Math.max(t.slowF || 0, 0.3); } };
      }
    };
    const sh = this.armShot(id, 0, ox, oy, a, W.speed, W.range, A.st.dmg, { sc: 3, spin: 6 });
    sh.armOnHit = (b, e) => seed(e, 1);
  },
  // hits attach leeches (max 3) that drain and heal you; a swollen leech (2s) pops when hit, and its brood spreads
  'Void Leech'(A, id, S, ox, oy, a) {
    const W = ITEMS[id].weapon;
    const attach = (e, direct) => {
      e.armLeech = (e.armLeech || []).filter((l) => !l.gone);
      const fat = direct && e.armLeech.find((l) => this.t - l.born >= 2);
      if (fat) {
        fat.gone = true;
        this.vx({ k: 'burst', x: e.x, y: e.y - 0.5, n: 22, colors: ['#a855f7', '#f0abfc', '#4ade80'] });
        this.armHurt(e, EX(A, 1), undefined, undefined, { id }); this.armHeal(25); this.armSay(e.x, e.y - 0.4, 'POP', '#f0abfc');
        for (const o of this.armNear(e.x, e.y, 8, e).slice(0, 2)) {
          const sh = this.armShot(id, 0, e.x, e.y - 0.5, angleTo(e.x, e.y, o.x, o.y) + (R() - 0.5), 6.5, 9, EX(A, 2), { sc: 2, spin: 6, home: 8 });
          sh.armOnHit = (b, t) => { if (t === o) attach(t, false); };
        }
        return;
      }
      if (e.armLeech.length < 3) e.armLeech.push({ born: this.t, o: R() * TAU, k: 0 });
    };
    const sh = this.armShot(id, 0, ox, oy, a, W.speed, W.range, A.st.dmg, { sc: 3, spin: 3 });
    sh.armOnHit = (b, e) => attach(e, true);
  },
  // arrows that land or hit leave stars (max 5, 4s); the stars link into lines that cut; close a shape round an enemy to Starburst
  'Celestial Weaver'(A, id, S, ox, oy, a) {
    const W = ITEMS[id].weapon, star = (b) => {
      if (b.st) return; b.st = true;
      S.stars = (S.stars || []).filter((s) => s.until > this.t);
      const x = b.x, y = b.y + 0.5;
      if (S.stars.some((s) => Math.hypot(s.x - x, s.y - y) < 0.6)) return;
      S.stars.push({ x, y, until: this.t + 4, born: this.t }); if (S.stars.length > 5) S.stars.shift();
      this.armVis({ k: 'ring', x, y, r: 0.45, col: '#93c5fd', life: 0.45 });
    };
    for (const g of [-0.105, 0.105]) { const sh = this.armShot(id, 0, ox, oy, a + g, W.speed, W.range, A.st.dmg, { sc: 3, spin: 0.001 }); sh.armOnHit = star; sh.armEnd = star; }
  },
  // a hydra: a throw that hits grows a head (max 3), one that misses loses one; each throw sends a serpent per head, out and back
  "Serpent's Reach"(A, id, S, ox, oy, a) {
    S.heads = S.heads || 1;
    const n = S.heads, W = ITEMS[id].weapon, Rr = W.range, grp = { hit: false, left: n }, life = (A.st.lt / 1000) * 2;
    for (let i = 0; i < n; i++) {
      const ang = a + (i - (n - 1) / 2) * 0.32, side = i % 2 ? 1 : -1;
      const sh = this.armShot(id, 0, ox, oy, ang, 0.01, 99, A.st.dmg, { pierce: true, sc: 4 });
      sh.vx = sh.vy = 0; sh.max = sh.life = life;
      sh.armPath = (b) => {
        const t = Math.min(1, b.t / life), dd = Math.sin(Math.PI * t) * Rr, w = Math.sin(b.t * 16) * 0.45 * side * Math.sin(Math.PI * t);
        const nx = ox + Math.cos(ang) * dd - Math.sin(ang) * w, ny = oy + Math.sin(ang) * dd + Math.cos(ang) * w;
        if (nx !== b.x || ny !== b.y) b.a = Math.atan2(ny - b.y, nx - b.x);
        b.x = nx; b.y = ny;
        if (t > 0.5 && !b.back) { b.back = true; b.hit && b.hit.clear(); }
      };
      sh.armOnHit = () => { grp.hit = true; };
      sh.armEnd = () => {
        if (--grp.left) return;
        const p = this.player;
        if (grp.hit) { if (S.heads < 3) { S.heads++; this.armSay(p.x, p.y, '+1 HEAD', '#4ade80'); } }
        else if (S.heads > 1) { S.heads--; this.armSay(p.x, p.y, 'HEAD SEVERED', '#fca5a5'); }
      };
    }
  },
  // Smite: a pillar falls on your cursor (9 tiles), through walls and armour; every 7th is Judgment; every attack tithes 3%
  Hosanna(A, id, S) {
    const p = this.player, max = this.stat('hp'), full = this.armSetCount('Hosanna') >= 4;
    S.cnt = (S.cnt || 0) + 1;
    const judg = S.cnt % (full ? 5 : 7) === 0;
    if (!judg) {                                            // the tithe: 3% of your max Life, never below 1
      const f = Math.min(max * 0.03, Math.max(0, p.hp - 1));
      if (f > 0) { p.hp -= f; this.float(...lift(p.x, p.y, 1.2), `-${Math.round(f)}`, '#ff6b6b'); }
    }
    const aim = this.armAim(), d = Math.min(9, dist(p.x, p.y, aim.x, aim.y)), ang = Math.atan2(aim.y - p.y, aim.x - p.x);
    const tx = p.x + Math.cos(ang) * d, ty = p.y + Math.sin(ang) * d;
    const smite = (x, y, dmgR, big) => {
      this.armVis({ k: 'smiteMark', x, y, life: 0.2 });
      this.armLater(0.2, () => {
        this.armVis({ k: 'pillar', x, y, life: 0.42 });
        this.vx({ k: 'shake', amt: big ? 4 : 2 }); this.vx({ k: 'burst', x, y: y - 0.3, n: 22, colors: ['#ffffff', '#fff1b8', '#f2b53a'] });
        for (const e of this.armNear(x, y, 1.5)) this.armHurt(e, dmgR, e.x, e.y - 0.5, { id, ap: true });
      });
    };
    if (!judg) { smite(tx, ty, A.st.dmg); return; }
    this.armSay(tx, ty - 2, 'JUDGMENT', '#fff6d6');
    S.flash = this.t; this.armVis({ k: 'halo', x: tx, y: ty, life: 0.9 });
    let n = 0;
    for (const e of this.projectiles) if (e.from === 'e' && e.life > 0 && Math.hypot(e.x - p.x, e.y - p.y) < 13) { e.life = 0; n++; }
    if (n) this.armLater(0.2, () => this.armSay(p.x, p.y - 1.5, `LET THERE BE LIGHT · ${n} SHOTS UNMADE`, '#fff1b8'));
    for (let i = 0; i < 7; i++) { const aa = (i / 7) * TAU - Math.PI / 2; this.armLater(i * 0.08, () => smite(tx + Math.cos(aa) * 1.55, ty + Math.sin(aa) * 1.55, EX(A, 0), i === 6)); }
    this.armLater(0.3, () => { const ab = full ? 0.35 : 0.2; this.armHeal(max * ab, '#fff1b8'); this.armSay(p.x, p.y - 0.3, `ABSOLUTION +${Math.round(max * ab)}`, '#fff1b8'); });
  },
  // shots fly to your cursor and feed a black hole (max 20 mass); stop firing 0.4s and it collapses, then spits back what it swallowed
  'Singularity Core'(A, id, S, ox, oy) {
    const aim = this.armAim();
    if (!S.hole || S.hole.done) S.hole = { x: aim.x, y: aim.y, mass: 0, eaten: 0, last: this.t, done: false };
    const h = S.hole; h.last = this.t;
    const sp = 22.4, d = dist(ox, oy, h.x, h.y - 0.5), sh = this.armShot(id, 0, ox, oy, angleTo(ox, oy, h.x, h.y - 0.5), sp, d, [0, 0], { sc: 3, spin: 6, b: { armNoHit: true } });
    sh.armEnd = () => { h.mass = Math.min(20, h.mass + 1); this.armVis({ k: 'ring', x: h.x, y: h.y, r: (10 + h.mass * 1.5) * T, col: '#c084fc', life: 0.45 }); };
  },
  // shots leave glass chimes (max 4, 4s); shoot through one to ring it; rings chain; four in one chain is a Chorus
  'Glass Psalm'(A, id, S, ox, oy, a) {
    const W = ITEMS[id].weapon, leave = (b) => {
      if (b.left) return; b.left = true;
      S.ch = (S.ch || []).filter((h) => h.until > this.t);
      const x = b.x + (R() - 0.5) * 0.7, y = b.y - 0.6 + (R() - 0.5) * 0.5;
      if (S.ch.some((h) => Math.hypot(h.x - x, h.y - y) < 0.85)) return;
      if (S.ch.length >= 4) S.ch.shift();
      S.ch.push({ x, y, until: this.t + 4, born: this.t, rang: -1e9, o: R() * 6 });
    };
    const ringCh = (h, chain) => {
      if (this.t - h.rang < 0.45) return;
      h.rang = this.t; chain.n++;
      this.armVis({ k: 'ring', x: h.x, y: h.y + 0.5, r: 1.5, col: '#bfefff', life: 0.45 });
      for (const o of this.armNear(h.x, h.y + 0.5, 1.5)) this.armHurt(o, EX(A, 0), undefined, undefined, { id });
      for (const o of S.ch) if (o !== h && o.until > this.t && Math.hypot(o.x - h.x, o.y - h.y) < 3 && this.t - o.rang >= 0.45) {
        this.armVis({ k: 'line', x0: h.x, y0: h.y, x1: o.x, y1: o.y, col: '#bfefff', life: 0.22 });
        this.armLater(0.12, () => { ringCh(o, chain); chorus(chain); });
      }
      chorus(chain);
    };
    const chorus = (chain) => {
      if (chain.n >= 4 && !chain.done && S.ch.length >= 4) {
        chain.done = true; this.vx({ k: 'shake', amt: 4 }); this.armSay(this.player.x, this.player.y - 2, 'CHORUS', '#ffffff');
        for (const o of S.ch) { this.armVis({ k: 'ring', x: o.x, y: o.y + 0.5, r: 2, col: '#ffffff', life: 0.45 }); for (const e of this.armNear(o.x, o.y + 0.5, 1.5)) this.armHurt(e, EX(A, 1), undefined, undefined, { id }); }
      }
    };
    const sh = this.armShot(id, 0, ox, oy, a + (R() - 0.5) * 0.24, W.speed, W.range, A.st.dmg);
    sh.armOnHit = leave; sh.armEnd = leave;
    sh.armTick = (b) => { for (const h of S.ch || []) { if (h.until < this.t || b.rung === h) continue; if (Math.hypot(b.x - h.x, b.y - h.y) < 0.4) { b.rung = h; ringCh(h, { n: 0 }); } } };
  },
  // piercing arrows paint star marks (max 5); 1s after the last mark the sky answers with a meteor; 5 is a Cataclysm
  'Starfall Engine'(A, id, S, ox, oy, a) {
    const W = ITEMS[id].weapon, sh = this.armShot(id, 1, ox, oy, a, W.speed, W.range, A.st.dmg, { pierce: true, sc: 3, spin: 6 });
    sh.armOnHit = (b, e) => { e.armMarks = Math.min(5, (e.armMarks || 0) + 1); e.armMarkT = e.armMarks >= 5 ? this.t : this.t + 1; S.marked.add(e); };
  },
  // hits stitch enemies with phantom thread (max 3, 3s; 40% of damage to one is shared); the third stitch snaps them together
  'Phantom Thread'(A, id, S, ox, oy, a) {
    const W = ITEMS[id].weapon, sh = this.armShot(id, 0, ox, oy, a, W.speed, W.range, A.st.dmg);
    sh.armOnHit = (b, e) => {
      if (!S.tether || S.tether.until < this.t) S.tether = { set: new Set(), until: 0 };
      S.tether.set.add(e); S.tether.until = this.t + 3; this.armSay(e.x, e.y - 0.4, 'STITCH ' + S.tether.set.size, '#e2e8f0');
      if (S.tether.set.size >= 3 && !(S.snap > this.t)) {
        S.snap = this.t + 1.5;
        const arr = [...S.tether.set].slice(0, 3), cx = arr.reduce((s, o) => s + o.x, 0) / arr.length, cy = arr.reduce((s, o) => s + o.y, 0) / arr.length;
        this.armSay(cx, cy - 1, 'SNAP', '#ffffff'); S.yank = { cx, cy, t: 0, arr };
      }
    };
  },
  // a line of 5 bone spikes erupts toward your target; every 4th eruption leaves a bone turret (max 2, 3s)
  'Bone Garden'(A, id, S, ox, oy, a) {
    const p = this.player, aim = this.armAim(), L = Math.min(ITEMS[id].weapon.range, dist(p.x, p.y, aim.x, aim.y));
    for (let i = 0; i < 5; i++) this.armLater(i * 0.07, () => {
      const t = (i + 1) / 5, d = 1 + (L - 1) * t, x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
      this.armVis({ k: 'spike', x, y, life: 0.6 });
      this.vx({ k: 'burst', x, y: y - 0.2, n: 6, colors: ['#d6c49e', '#8a6d45'] });
      for (const e of this.armNear(x, y, 0.65)) { if (this.armHurt(e, EX(A, 0), undefined, undefined, { id })) { e.slowT = Math.max(e.slowT || 0, 2); e.slowF = Math.max(e.slowF || 0, 0.3); } }
      if (i === 4 && S.n[id] % 4 === 0) {
        S.turrets = (S.turrets || []).filter((q) => q.until > this.t);
        if (S.turrets.length >= 2) S.turrets.shift();
        S.turrets.push({ x: x - 0.5, y, until: this.t + 3, born: this.t, ft: 0 }); this.armSay(x, y, 'TURRET', '#f5ecd5');
      }
    });
  },
  // a slow dream eats every enemy shot it touches (max 8), then dreams them back and puts enemies to sleep
  'Dream Eater'(A, id, S, ox, oy, a) {
    if (this.projectiles.some((b) => b.arm === id && b.dream && b.life > 0)) return;
    const W = ITEMS[id].weapon, sh = this.armShot(id, 0, ox, oy, a, W.speed, W.range, A.st.dmg, { pierce: true, sc: 4, spin: 2, b: { dream: true, eats: 0 } });
    const sleep = (b, e) => { if (!(e.armSleepT > this.t) && !e.rb) { e.armSleepT = this.t + 1.5; this.stun(e, 1.5); this.armSay(e.x, e.y - 0.4, 'ASLEEP', '#c4b5fd'); } };
    sh.armK = 0.7;
    sh.armTick = (b) => {
      for (const e of this.projectiles) if (e.from === 'e' && e.life > 0 && !e.ghost && Math.hypot(e.x - b.x, e.y - b.y) < 0.55 * b.armK) {
        e.life = 0; b.eats++; b.armK = Math.min(2, 0.7 + b.eats * 0.16); b.dmg = Math.round(b.dmg * 1.1);
        if (b.eats >= 8) { b.life = 0; break; }
      }
    };
    sh.armEnd = (b) => {
      const n = b.eats; this.vx({ k: 'burst', x: b.x, y: b.y, n: 24, colors: ['#c084fc', '#ffffff'] });
      this.armSay(b.x, b.y, n ? 'DREAMED ×' + n : 'BURST', '#f0abfc');
      for (let i = 0; i < n; i++) { const e = this.armNearest(b.x, b.y + 0.5, 10), aa = e ? angleTo(b.x, b.y, e.x, e.y - 0.5) : R() * TAU; const q = this.armShot(id, 0, b.x, b.y, aa + (R() - 0.5) * 0.6, 10.5, 9.5, EX(A, 0), { sc: 3, spin: 4, home: 2 }); q.armOnHit = sleep; }
      for (let i = 0; i < 8; i++) this.armLater(i * 0.045, () => { const q = this.armShot(id, 0, b.x, b.y, i * 0.785, 7, 5.6, EX(A, 1), { sc: 2.5, spin: 6 }); q.armOnHit = sleep; });
    };
    sh.armOnHit = sleep;
  },
  // volleys alternate Sun and Moon; Sun heals you 8; an enemy holding both suffers an Eclipse
  'Eclipse Hunter'(A, id, S, ox, oy, a) {
    const W = ITEMS[id].weapon, moon = S.n[id] % 2 === 0;
    for (const g of [-0.052, 0.052]) {
      const sh = this.armShot(id, moon ? 1 : 0, ox, oy, a + g, W.speed, W.range, A.st.dmg, { pierce: true });
      sh.armOnHit = (b, e) => {
        if (moon) e.armMoon = this.t + 4; else { e.armSun = this.t + 4; this.armHeal(8); }
        if (e.armSun > this.t && e.armMoon > this.t && !(e.armEcl > this.t)) {
          e.armSun = e.armMoon = 0; e.armEcl = this.t + 0.9; e.curseT = Math.max(e.curseT || 0, 3); e.curseF = Math.max(e.curseF || 0, 0.25);
          this.vx({ k: 'shake', amt: 4 }); this.armSay(e.x, e.y - 0.6, 'ECLIPSE', '#fff1a8'); this.armVis({ k: 'eclipse', e, life: 0.7 });
          this.armLater(0.25, () => {
            if (!e.dead) this.armHurt(e, EX(A, 0), undefined, undefined, { id });
            for (const o of this.armNear(e.x, e.y, 3.5, e)) this.armHurt(o, EX(A, 0), undefined, undefined, { id, k: 0.3 });
            this.armVis({ k: 'ring', x: e.x, y: e.y, r: 3.5, col: '#fff1a8', life: 0.45 });
          });
        }
      };
    }
  },
  // every 0.75 tiles you move leaves a footprint (max 20); 0.8s later each throws a phantom blade at the nearest enemy
  'Thousand Steps'(A, id, S, ox, oy, a) { const W = ITEMS[id].weapon; this.armShot(id, 0, ox, oy, a + (R() - 0.5) * 0.1, W.speed, W.range, A.st.dmg); },
  // channel 1.2s: a maw pulls enemies (7 tiles) and devours them, then spits 7 remnants; ten devours open the Feast
  'The Hunger'(A, id, S) {
    if (S.maw) return;
    const p = this.player, aim = this.armAim(), feast = (S.hunger || 0) >= 10, ang = Math.atan2(aim.y - p.y, aim.x - p.x), d = Math.min(5, dist(p.x, p.y, aim.x, aim.y));
    const m = { x: p.x + Math.cos(ang) * d, y: p.y + Math.sin(ang) * d };
    S.maw = { ...m, t: 0, k: 0, n: 0, feast, ang };
    this.armSay(p.x, p.y, feast ? 'THE FEAST' : 'CHANNEL', feast ? '#ff3b4e' : '#fca5a5');
    if (feast) { S.hunger = 0; this.vx({ k: 'shake', amt: 5 }); }
    this.armLater(1.2, () => {
      this.vx({ k: 'burst', x: m.x, y: m.y - 0.5, n: 30, colors: ['#7f1d1d', '#ef4444', '#fca5a5'] });
      for (let i = 0; i < 7; i++) this.armShot(id, 0, m.x, m.y - 0.5, ang - 0.9 + i * 0.3, 15, 7.5, EX(A, 0), { pierce: true });
      if (feast) { const n = S.eaten || 0; S.eaten = 0; for (let i = 0; i < n; i++) this.armLater(i * 0.025, () => this.armShot(id, 0, m.x, m.y - 0.5, i * 0.45, 10.5, 12.6, EX(A, 1), { sc: 3, home: 1.2 })); this.armSay(m.x, m.y + 1, 'CRIMSON STORM ×' + n, '#ff6b81'); }
    });
  },
  // a shot that expires without hitting rewinds to you and re-fires at the nearest enemy; every shot writes a delayed echo
  'Paradox Script'(A, id, S, ox, oy, a0) {
    const W = ITEMS[id].weapon, a = a0 + (R() - 0.5) * 0.76, p = this.player;
    const mk = (o, x = ox, y = oy) => {
      const sh = this.armShot(id, 0, x, y, a, W.speed, W.range, o.dmg || A.st.dmg, { alpha: o.alpha });
      sh.echo = !!o.echo;
      sh.armOnHit = (b) => { b.landed = true; };
      sh.armEnd = (b) => {
        if (b.landed || b.echo) return;
        this.armVis({ k: 'rewind', x0: b.x, y0: b.y, life: 0.26 });
        this.armLater(0.26, () => {
          const [px, py] = lift(p.x, p.y, 0.5), e = this.armNearest(p.x, p.y, 12);
          if (!e) return;
          this.armSay(p.x, p.y, 'REWRITTEN', '#67e8f9');
          const q = this.armShot(id, 0, px, py, angleTo(px, py, ...this.up(e.x, e.y, 0.5)), W.speed * 1.2, W.range, EX(A, 0), {});
          q.armOnHit = () => { S.caus = Math.min(10, (S.caus || 0) + 1); S.causUntil = this.t + 4; this.armSay(p.x, p.y - 0.4, 'CAUSALITY ' + S.caus, '#a5b4fc'); };
        });
      };
    };
    mk({});
    this.armLater(0.23, () => mk({ echo: true, alpha: 0.5, dmg: EX(A, 1) }, ox - Math.sin(a) * 0.35, oy + Math.cos(a) * 0.35));
  },
  // arrows tear the world along their path (1.5s); enemies crossing a tear take damage; where two tears cross, reality ruptures
  'World Ripper'(A, id, S, ox, oy, a) {
    const W = ITEMS[id].weapon;
    for (const g of [-0.07, 0.07]) {
      const tear = { a: { x: ox, y: oy }, b: { x: ox, y: oy }, until: 1e9 };
      (S.tears = S.tears || []).push(tear);
      const sh = this.armShot(id, 0, ox, oy, a + g, W.speed, W.range, A.st.dmg, { pierce: true });
      sh.armTick = (b) => {
        tear.b = { x: b.x, y: b.y };
        for (const o of S.tears) {
          if (o === tear || o.until < this.t) continue;
          const x = segX(tear.a, tear.b, o.a, o.b);
          if (x && !(S.rx || []).some((r) => Math.hypot(r.x - x.x, r.y - x.y) < 1.25 && r.t > this.t - 1.5)) {
            (S.rx = S.rx || []).push({ ...x, t: this.t });
            this.vx({ k: 'shake', amt: 4 }); this.vx({ k: 'burst', x: x.x, y: x.y, n: 34, colors: ['#0a0410', '#e879f9', '#ffffff'] });
            this.armVis({ k: 'ring', x: x.x, y: x.y + 0.5, r: 1.5, col: '#e879f9', life: 0.45 }); this.armSay(x.x, x.y, 'RUPTURE', '#f0abfc');
            for (const e of this.armNear(x.x, x.y + 0.5, 1.5)) this.armHurt(e, EX(A, 1), undefined, undefined, { id });
            for (const e of this.projectiles) if (e.from === 'e' && e.life > 0 && Math.hypot(e.x - x.x, e.y - x.y) < 2) e.life = 0;
          }
        }
      };
      sh.armEnd = () => { tear.until = this.t + 1.5; };
    }
  },
  // each hit adds Null (max 12); at 12 you phase out for 1.5s, marking all you pass through; returning, every mark is cut
  'Null Walker'(A, id, S, ox, oy, a) {
    if (S.phase) return;
    const W = ITEMS[id].weapon, sh = this.armShot(id, 0, ox, oy, a + (R() - 0.5) * 0.1, W.speed, W.range, A.st.dmg, { ap: true });
    sh.armOnHit = () => {
      S.nul = Math.min(12, (S.nul || 0) + 1);
      if (S.nul >= 12 && !S.phase) { S.nul = 0; S.phase = { t: 0, marked: new Set() }; this.armSay(this.player.x, this.player.y, 'PHASE', '#c084fc'); }
    };
  },
};

// ---------------------------------------------------------------- the abilities and the tome
const CAST = {
  // the Four Horsemen in a diamond round your cursor for 3s
  'Apocalypse Chorus'(A, id, S) {
    const C = this.armAim(), o = 85 * T, spots = [['WAR', 0, -o, '#ef4444'], ['FAMINE', o, 0, '#facc15'], ['PESTILENCE', 0, o, '#84cc16'], ['DEATH', -o, 0, '#a855f7']]
      .map(([n, dx, dy, c], i) => ({ n, x: C.x + dx, y: C.y + dy, c, i, k: 0, up: false }));
    S.hm = { C, spots, t: 0 };
    spots.forEach((s, i) => this.armLater(i * 0.12, () => { s.up = true; this.armVis({ k: 'ring', x: s.x, y: s.y, r: 1, col: s.c, life: 0.45 }); this.armSay(s.x, s.y, s.n, s.c); }));
  },
  // halts every enemy shot in a 5-tile field for 1.2s, then sends each back at whoever fired it, as yours
  'Reality Unbound'(A, id, S) { const c = this.armAim(); S.za = { c, t: 0 }; this.armSay(c.x, c.y - 5, 'HALT', '#f0abfc'); },
  // five casts, five elements; the sixth is the Last Verse
  'The Last Verse'(A, id, S) {
    const k = (S.verse = ((S.verse ?? -1) + 1) % 6), fin = k === 5, c = this.armAim();
    S.m = { el: k, fin, t: 0, x: c.x, y: c.y, kk: [0, 0, 0, 0, 0], rot: 0, w: 0, w4: 0, len: fin ? 3 : 2 };
    const N = ['FIRE', 'FROST', 'STORM', 'ARCANE', 'EARTH', 'THE LAST VERSE'], CL = ['#f87171', '#a5f3fc', '#fde047', '#d8b4fe', '#a3e635', '#fff1a8'];
    this.armSay(c.x, c.y - 1.5, N[k], CL[k]); if (fin) this.vx({ k: 'shake', amt: 5 });
  },
  // opens heaven above you for 4s: heals 200 at once, then 40 a second inside; enemy shots inside slow by 40%
  Gloria(A, id, S) {
    const p = this.player;
    S.col = { x: p.x, y: p.y, t: 0, k: 0, follow: this.armSetCount('Hosanna') >= 4 };
    this.armHeal(200, '#fff3c4'); this.armSay(p.x, p.y - 2, 'GLORIA', '#fff3c4');
  },
};

// ---------------------------------------------------------------- what runs every frame (while held, or always for live effects)
const TICK_ALWAYS = new Set(['Mirror Maw', 'Celestial Weaver', 'Singularity Core', 'Starfall Engine', 'Phantom Thread', 'Bone Garden', 'Apocalypse Chorus', 'Reality Unbound', 'The Hunger', 'World Ripper', 'The Last Verse', 'Gloria', 'Void Leech', 'Null Walker', 'Paradox Script']);
const TICK = {
  'Mirror Maw'(A, id, S) {                                // enemy shots that strike the mirror are spat back at the nearest enemy
    const m = S.mir;
    if (!m || m.until < this.t) return;
    for (const e of this.projectiles) if (e.from === 'e' && e.life > 0 && !e.ghost && Math.hypot(e.x - m.x, e.y - m.y) < 0.55) {
      e.life = 0;
      const t = this.armNearest(m.x, m.y + 0.5, 12), aa = t ? angleTo(m.x, m.y, t.x, t.y - 0.5) : R() * TAU;
      this.armShot(id, 1, m.x, m.y, aa, 11.5, 10, EX(A, 0), { sc: 3 });
      if (!S.spSay || S.spSay < this.t) { S.spSay = this.t + 0.9; this.armSay(m.x, m.y, 'SPAT BACK', '#a5f3fc'); }
    }
  },
  'Void Leech'(A, id, S, dt) {                            // each leech drains every 0.6s and heals you
    for (const e of this.enemies) {
      if (!e.armLeech || e.dead) continue;
      for (const l of e.armLeech) { if (l.gone) continue; l.k += dt; if (l.k >= 0.6) { l.k = 0; const d = this.armHurt(e, EX(A, 0), undefined, undefined, { id, quiet: false }); if (d && this.armHeld(id)) this.armHeal(Math.max(1, Math.round(d * 0.25))); } }
    }
  },
  'Celestial Weaver'(A, id, S, dt) {                      // the constellation cuts; a closed shape round an enemy is a Starburst
    const st = (S.stars || []).filter((s) => s.until > this.t); S.stars = st;
    S.lk = (S.lk || 0) + dt;
    if (S.lk >= 0.25 && st.length > 1) {
      S.lk = 0;
      for (const e of this.enemies) {
        if (e.dead || e.state === 'sleep') continue;
        for (let i = 0; i < st.length; i++) { if (i === st.length - 1 && st.length < 3) break; const a = st[i], b = st[(i + 1) % st.length]; if (segDist(e.x, e.y, a.x, a.y, b.x, b.y) < 0.4 + e.D.r * 0.5) { this.armHurt(e, EX(A, 0), undefined, undefined, { id, quiet: true }); break; } }
      }
    }
    if (st.length >= 3 && !(S.sbcd > this.t)) {
      const inside = this.enemies.filter((e) => !e.dead && inPoly(e, st));
      if (inside.length) {
        S.sbcd = this.t + 2.2; const cx = st.reduce((s, q) => s + q.x, 0) / st.length, cy = st.reduce((s, q) => s + q.y, 0) / st.length;
        this.vx({ k: 'shake', amt: 4 }); this.armSay(cx, cy - 1, 'CONSTELLATION', '#93c5fd'); this.armVis({ k: 'poly', pts: st.map((s) => ({ x: s.x, y: s.y })), life: 0.6 });
        for (const e of inside) { this.armHurt(e, EX(A, 1), undefined, undefined, { id }); this.vx({ k: 'burst', x: e.x, y: e.y - 0.5, n: 18, colors: ['#ffffff', '#93c5fd'] }); }
        st.forEach((s) => { s.until = this.t + 0.2; });
      }
    }
  },
  'Singularity Core'(A, id, S, dt) {                      // the hole pulls and swallows; let go 0.4s and it collapses
    const h = S.hole;
    if (!h || h.done) return;
    const r = (14 + h.mass * 2) * T;
    if (this.t - h.last < 0.4) {
      for (const e of this.armNear(h.x, h.y, 2 + h.mass * 0.15)) if (!e.rb && !(e.D && e.D.dummy)) this.moveCircle(e, (h.x - e.x) * 0.6 * h.mass * dt * 0.1, (h.y - e.y) * 0.6 * h.mass * dt * 0.1, 0.35);
      for (const e of this.projectiles) if (e.from === 'e' && e.life > 0) { const d = Math.hypot(e.x - h.x, e.y - (h.y - 0.5)); if (d < r + 1) { e.x += (h.x - e.x) * 0.06; e.y += (h.y - 0.5 - e.y) * 0.06; } if (d < r) { e.life = 0; h.eaten++; } }
      return;
    }
    h.done = true;
    if (!h.mass) return;
    const m = h.mass, n = Math.min(28, h.eaten);
    this.vx({ k: 'shake', amt: 6 }); this.vx({ k: 'burst', x: h.x, y: h.y - 0.5, n: 60 + m * 3, colors: ['#ffffff', '#c084fc', '#7c3aed', '#facc15'] });
    this.armVis({ k: 'ring', x: h.x, y: h.y, r: 3, col: '#f5e1ff', life: 0.45 }); this.armSay(h.x, h.y - 1.5, 'COLLAPSE · MASS ' + m, '#e9d5ff');
    for (const e of this.armNear(h.x, h.y, 3)) this.armHurt(e, A.st.dmg, undefined, undefined, { id, k: m * 0.55 });
    if (n) this.armLater(0.25, () => { this.armSay(h.x, h.y + 1, 'HAWKING ×' + n, '#facc15'); for (let i = 0; i < n; i++) this.armShot(id, 0, h.x, h.y - 0.5, (i / n) * TAU, 9.5, 8.5, EX(A, 0), { sc: 2.5, spin: 6 }); });
  },
  'Starfall Engine'(A, id, S) {                           // marks call meteors
    for (const e of [...S.marked]) {
      if (e.dead || !e.armMarks) { S.marked.delete(e); continue; }
      if (e.armMarkT > this.t) continue;
      const n = e.armMarks; e.armMarks = 0; S.marked.delete(e);
      const x = e.x, y = e.y;
      this.armVis({ k: 'meteor', x, y, n, life: 0.42 });
      this.armLater(0.42, () => {
        const Rr = 0.8 + n * 0.25;
        this.vx({ k: 'shake', amt: n >= 4 ? 6 : 3 }); this.vx({ k: 'burst', x, y: y - 0.3, n: 14 + n * 10, colors: ['#fff7ae', '#fb923c', '#ef4444'] });
        this.armVis({ k: 'ring', x, y, r: Rr, col: '#fb923c', life: 0.45 }); this.armSay(x, y - 0.5, n >= 5 ? 'CATACLYSM' : '×' + n, n >= 5 ? '#fff1a8' : '#fdba74');
        for (const o of this.armNear(x, y, Rr)) this.armHurt(o, EX(A, 0), undefined, undefined, { id, k: Math.pow(n, 1.2) });
        if (n >= 5) S.craters = [...(S.craters || []).filter((c) => c.until > this.t), { x, y, r: Rr, until: this.t + 2, k: 0 }];
      });
    }
    for (const c of S.craters || []) if (c.until > this.t && (c.k = (c.k || 0) + 1) % 15 === 0) for (const o of this.armNear(c.x, c.y, c.r)) this.ignite(o, 80, 2);
  },
  'Phantom Thread'(A, id, S, dt) {                        // the snap: pulled together, slammed, stunned
    const y = S.yank;
    if (!y) return;
    y.t += dt;
    if (y.t < 0.22) { for (const o of y.arr) if (!o.dead && !o.rb && !(o.D && o.D.dummy)) this.moveCircle(o, (y.cx - o.x) * 0.25, (y.cy - o.y) * 0.25, 0.35); }
    else if (!y.done) {
      y.done = true; this.vx({ k: 'shake', amt: 4 }); this.vx({ k: 'burst', x: y.cx, y: y.cy - 0.5, n: 30, colors: ['#ffffff', '#cbd5e1'] });
      S.sharing = true;
      try { for (const o of y.arr) if (!o.dead) { this.armHurt(o, EX(A, 0), undefined, undefined, { id }); this.stun(o, 0.8); } } finally { S.sharing = false; }
      this.armSay(y.cx, y.cy + 1, 'STUNNED', '#cbd5e1'); S.tether = null;
    }
    if (y.t > 0.9) S.yank = null;
  },
  'Bone Garden'(A, id, S, dt) {                           // the turrets: 4 bones a second at enemies within 6 tiles
    for (const q of S.turrets || []) {
      if (q.until < this.t) continue;
      q.ft += dt;
      if (q.ft > 0.25 && this.t - q.born > 0.3) { q.ft = 0; const e = this.armNearest(q.x, q.y, 6); if (e) this.armShot(id, 0, q.x + 0.3, q.y - 0.6, angleTo(q.x + 0.3, q.y - 0.6, e.x, e.y - 0.5), 12.5, 7.5, EX(A, 1), { sc: 3 }); }
    }
  },
  'Thousand Steps'(A, id, S) {                            // footprints as you move, each throwing a blade 0.8s later
    const p = this.player;
    if (S.lastX === undefined) { S.lastX = p.x; S.lastY = p.y; }
    S.mv = (S.mv || 0) + Math.hypot(p.x - S.lastX, p.y - S.lastY);
    const ang = Math.atan2(p.y - S.lastY, p.x - S.lastX); S.lastX = p.x; S.lastY = p.y;
    if (S.mv >= 0.75) { S.mv = 0; (S.fp = S.fp || []).push({ x: p.x, y: p.y + 0.35, born: this.t, a: ang }); if (S.fp.length > 20) S.fp.shift(); }
    for (const f of S.fp || []) if (!f.thrown && this.t - f.born >= 0.8) {
      f.thrown = true; const e = this.armNearest(f.x, f.y, 10);
      if (e) { const [fx, fy] = lift(f.x, f.y, 0.3), W = ITEMS[id].weapon; this.armShot(id, 0, fx, fy, angleTo(fx, fy, ...this.up(e.x, e.y, 0.5)), W.speed * 1.1, W.range * 2, EX(A, 0), { alpha: 0.7 }); }
    }
    S.fp = (S.fp || []).filter((f) => this.t - f.born < 1.6);
  },
  'Apocalypse Chorus'(A, id, S, dt) {
    const h = S.hm;
    if (!h) return;
    h.t += dt;
    if (h.t > 3.2) { S.hm = null; return; }
    const Rr = 110 * T;
    for (const s of h.spots) {
      if (!s.up) continue;
      s.k += dt; const near = this.armNear(s.x, s.y, Rr);
      if (s.i === 0 && s.k > 0.5) { s.k = 0; for (const e of near) this.armHurt(e, PT(A, 0), undefined, undefined, { id }); this.armVis({ k: 'ring', x: s.x, y: s.y, r: Rr, col: '#ef4444', life: 0.45 }); }
      if (s.i === 1 && s.k > 0.5) { s.k = 0; if (near.length) { const p = this.player; p.mp = Math.min(this.stat('mp'), p.mp + near.length * 10); this.armSay(p.x, p.y, `+${near.length * 10} MP`, '#facc15'); } }
      if (s.i === 2 && s.k > 0.25) { s.k = 0; for (const e of near) { this.armHurt(e, PT(A, 1), undefined, undefined, { id, quiet: true }); e.armSickT = this.t + 3; } }
      if (s.i === 3 && !s.reaped && h.t > 1.6) {
        s.reaped = true; this.vx({ k: 'shake', amt: 4 });
        const hit = new Set([...near, ...this.armNear(h.C.x, h.C.y, 1.5)]);
        for (const e of hit) { this.armHurt(e, PT(A, 2), undefined, undefined, { id }); this.armVis({ k: 'slash', x: e.x, y: e.y, life: 0.4 }); }
        this.armSay(s.x, s.y - 0.6, 'REAPED', '#e9d5ff');
      }
    }
  },
  'Reality Unbound'(A, id, S, dt) {
    const z = S.za;
    if (!z) return;
    z.t += dt;
    const Rr = 5;
    if (z.t < 1.2) {
      for (const e of this.projectiles) if (e.from === 'e' && e.life > 0 && Math.hypot(e.x - z.c.x, e.y - z.c.y) < Rr) {
        if (!e.armFrozen) { e.armFrozen = { vx: e.vx, vy: e.vy }; }
        e.vx = 0; e.vy = 0; e.life = Math.max(e.life, 0.5);
      }
    } else if (!z.flip) {
      z.flip = true; this.vx({ k: 'shake', amt: 4 }); let n = 0;
      for (const e of this.projectiles) if (e.armFrozen && e.life > 0) {
        n++;
        const from = this.enemies.filter((o) => !o.dead && o.D && o.D.name === e.by).sort((p, q) => dist(e.x, e.y, p.x, p.y) - dist(e.x, e.y, q.x, q.y))[0] || this.armNearest(e.x, e.y, 14);
        const aa = from ? angleTo(e.x, e.y, from.x, from.y - 0.5) : R() * TAU;
        e.life = 0;
        const q = this.armShot(id, 0, e.x, e.y, aa, 12, 12, PT(A, 0), { sc: 3, spin: 8, home: 1.6 });
        void q;
      }
      this.armSay(z.c.x, z.c.y - 0.5, 'REWRITTEN ×' + n, '#f9a8d4');
    }
    if (z.t > 1.7) S.za = null;
  },
  'The Hunger'(A, id, S, dt) {
    const p = this.player, w = S.maw;
    if (w) {
      w.t += dt;
      if (w.t < 1.2) {
        for (const e of this.armNear(w.x, w.y, 7)) if (!e.rb && !(e.D && e.D.dummy)) this.moveCircle(e, (w.x - e.x) * 4.5 * dt * 0.25, (w.y - e.y) * 4.5 * dt * 0.25, 0.35);
        w.k += dt;
        if (w.k > 0.3 && w.n < 4) { w.k = 0; w.n++; for (const e of this.armNear(w.x, w.y, 3.75)) this.armHurt(e, A.st.dmg, undefined, undefined, { id }); S.hunger = Math.min(10, (S.hunger || 0) + 1); }
        if (w.feast) for (const e of this.projectiles) if (e.from === 'e' && e.life > 0) { const aa = Math.atan2(w.y - 0.5 - e.y, w.x - e.x); e.vx = Math.cos(aa) * 15; e.vy = Math.sin(aa) * 15; e.life = Math.max(e.life, 1); if (Math.hypot(e.x - w.x, e.y - (w.y - 0.5)) < 0.75) { e.life = 0; S.eaten = (S.eaten || 0) + 1; } }
      } else if (w.t > 1.55) S.maw = null;
    }
    // starve it and it eats you: no damage dealt for 5s while held (and something to fight nearby): 5% a second
    if (this.armHeld(id) && this.map.kind !== 'nexus' && this.t - (S.lastDmg ?? this.t) > 5 && this.armNear(p.x, p.y, 12).length) {
      S.bite = (S.bite || 0) + dt;
      if (S.bite >= 1) { S.bite = 0; const d = Math.round(this.stat('hp') * 0.05); p.hp = Math.max(1, p.hp - d); this.float(...lift(p.x, p.y, 1.2), `-${d}`, '#ff3b4e'); this.armSay(p.x, p.y, 'THE HUNGER BITES', '#ff3b4e'); }
    } else if (S.lastDmg === undefined) S.lastDmg = this.t;
  },
  'Paradox Script'(A, id, S) { if ((S.causUntil || 0) < this.t) S.caus = 0; },
  'World Ripper'(A, id, S, dt) {                          // enemies crossing a tear take damage every 0.3s
    S.tears = (S.tears || []).filter((t) => t.until > this.t);
    S.tk = (S.tk || 0) + dt;
    if (S.tk >= 0.3) { S.tk = 0; for (const e of this.enemies) if (!e.dead && e.state !== 'sleep' && S.tears.some((t) => segDist(e.x, e.y - 0.5, t.a.x, t.a.y, t.b.x, t.b.y) < 0.25 + e.D.r * 0.5)) this.armHurt(e, EX(A, 0), undefined, undefined, { id, quiet: true }); }
  },
  'Null Walker'(A, id, S, dt) {                           // out of reality: marking what you pass through; then every mark is cut
    const n = S.phase, p = this.player;
    if (!n) return;
    n.t += dt; p.status.invuln = Math.max(p.status.invuln || 0, 0.05);
    for (const e of this.armNear(p.x, p.y, 0.75)) if (!n.marked.has(e)) { n.marked.add(e); this.armSay(e.x, e.y - 0.4, 'NULLED', '#c084fc'); }
    if (n.t >= 1.5 && !n.cut) {
      n.cut = true; S.stutter = this.t;
      this.armLater(0.26, () => {
        this.vx({ k: 'shake', amt: 7 });
        for (const e of n.marked) if (!e.dead) { this.armHurt(e, EX(A, 0), undefined, undefined, { id, ap: true }); this.armVis({ k: 'slash', x: e.x, y: e.y, life: 0.5, col: '#f5e8ff' }); }
        this.armSay(p.x, p.y - 2, 'NULL CUT', '#f5e8ff'); S.phase = null;
      });
    }
  },
  'The Last Verse'(A, id, S, dt) {
    const m = S.m;
    if (!m) return;
    m.t += dt; m.rot += dt * (m.fin ? 4 : 2);
    if (m.t > m.len) { S.m = null; return; }
    const els = m.fin ? [0, 1, 2, 3, 4] : [m.el], EN = ['Fire', 'Frost', 'Storm', 'Arcane', 'Earth'], ox = m.x, oy = m.y - 0.5;
    const effect = (el) => (b, e) => {
      if (el === 0) this.ignite(e, 60, 3);
      if (el === 1) { e.slowT = Math.max(e.slowT || 0, 2); e.slowF = Math.max(e.slowF || 0, 0.4); }
      if (el === 2) this.stun(e, 0.6);
      if (el === 4) e.armBreakT = this.t + 3;
      const L = ['BURNING', 'SLOWED', 'PARALYZED', null, 'ARMOR BROKEN'][el];
      if (L && !(e.armLb > this.t)) { e.armLb = this.t + 0.7; this.armSay(e.x, e.y - 0.4, L, ['#fca5a5', '#a5f3fc', '#fde047', null, '#a3e635'][el]); }
    };
    for (const el of els) {
      m.kk[el] += dt; const kk = m.kk[el], dmg = A.st.elements[EN[el]];
      if (el === 0 && kk > 0.11) { m.kk[el] = 0; for (let i = 0; i < 6; i++) { const b = this.armShot(id, 0, ox, oy, m.rot * 3 + i * 1.047, 6.5, 8.5, dmg, { sc: 3, spin: 5 }); b.armOnHit = effect(0); } }
      if (el === 1 && (kk > 0.42 || m.t < dt * 2)) { m.kk[el] = 0; m.w++; for (let i = 0; i < 16; i++) { const b = this.armShot(id, 1, ox, oy, i * 0.3927 + m.w * 0.2, 6, 7.2, dmg, { sc: 3 }); b.armOnHit = effect(1); } }
      if (el === 2 && kk > 0.18) {
        m.kk[el] = 0; const e = this.armNearest(m.x, m.y, 9) || null, aa = e ? angleTo(ox, oy, e.x, e.y - 0.5) : R() * TAU;
        const b = this.armShot(id, 2, ox, oy, aa, 13, 11.7, dmg, { sc: 4 }); b.zz = 1; b.zt = 0;
        b.armTick = (q, d) => { q.zt += d; if (q.zt > 0.09) { q.zt = 0; q.zz *= -1; q.a += q.zz * 0.7; const s = 13; q.vx = Math.cos(q.a) * s; q.vy = Math.sin(q.a) * s; } };
        b.armOnHit = effect(2);
      }
      if (el === 3 && kk > 0.15) {
        m.kk[el] = 0; const e = this.armNearest(m.x, m.y, 12), a0 = e ? angleTo(ox, oy, e.x, e.y - 0.5) : m.rot;
        for (const s of [-1, 1]) { const b = this.armShot(id, 3, ox, oy, a0, 0.01, 99, dmg, { sc: 3, pierce: true, b: { life: 1.4 } }); b.vx = b.vy = 0; b.max = b.life = 1.4; b.armPath = (q) => { const dd = q.t * 7.5, w = Math.sin(q.t * 14 + s * 1.57) * 0.55; q.x = ox + Math.cos(a0) * dd - Math.sin(a0) * w * s; q.y = oy + Math.sin(a0) * dd + Math.cos(a0) * w * s; q.a = a0; }; }
      }
      if (el === 4 && (kk > 0.52 || m.t < dt * 2)) { m.kk[el] = 0; m.w4++; for (let i = 0; i < 4; i++) { const b = this.armShot(id, 4, ox, oy, i * 1.5708 + m.w4 * 0.785, 4.5, 7.2, dmg, { sc: 5, spin: 3 }); b.armOnHit = effect(4); } }
    }
  },
  Gloria(A, id, S, dt) {                                  // heaven's column: 40 a second inside, enemy shots inside slowed by 40%
    const c = S.col, p = this.player;
    if (!c) return;
    c.t += dt; c.k += dt;
    if (c.follow) { c.x = p.x; c.y = p.y; }
    const inside = (x) => Math.abs(x - c.x) < 2.5 && c.t < 4;
    if (c.k >= 1 && c.t <= 4) { c.k = 0; if (inside(p.x)) this.armHeal(40, '#fff3c4'); }
    for (const e of this.projectiles) {
      if (e.from !== 'e' || e.life <= 0) continue;
      const inn = inside(e.x);
      if (inn && !e.armSl) { e.armSl = true; e.vx *= 0.6; e.vy *= 0.6; e.life /= 0.6; }
      else if (!inn && e.armSl) { e.armSl = false; e.vx /= 0.6; e.vy /= 0.6; e.life *= 0.6; }
    }
    if (c.t > 4.4) S.col = null;
  },
};
void TICK_ALWAYS;

export function installArmory(Game) { Object.assign(Game.prototype, methods); }
