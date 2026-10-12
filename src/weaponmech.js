// Weapon mechanics for the item rework (the blueprint's reusable hooks), mixed into Game like elites.js. A weapon names
// one in weapon.special.mech (src/data/weapon_rework.js); game.js calls in at five points: the volley (mechVolley),
// each shot's flight (mechFlight), a hit (mechHit), a shot's end (mechEnd) and every frame (mechTick).
//   curve      a shallow fixed curve; every third swing bends the other way
//   follow     a hit marks the enemy; your next swing sets the mark off (a small burst, or a crossing cut)
//   shards     the first hit throws two short shards out to the sides
//   converge   swings alternate: one narrow shot, then a pair that meets at mid-range
//   dart       the shot stops short near the end of its flight, then darts on once
//   stack      shots come from the left and right hand in turn; hits on one enemy build a debuff the third hit cashes
//   glyph      passes through the first enemy only and leaves a glyph on the ground; your next swing detonates it
//   center     three tight shots: the flanks hit softer, the centre marks (marked enemies take more damage)
//   phantom    where it strikes, a phantom blow lands on the same spot a moment later
//   starfall   every fourth volley that hits calls a star onto the last enemy hit, which bursts into four sparks
//   brand      hits brand an enemy; the third brand cracks it into two blades and heals you
// A Legendary adds charge: accurate volleys fill it, and when full your next swing is its signature strike.
import { R } from './util.js';
const TAU = Math.PI * 2;
const angleTo = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);
const THEME = {                                              // what a debuff does, by the weapon's theme
  fire: { col: ['#ffb04a', '#ff5a1a'], burn: 70 }, blood: { col: ['#ff3a4a', '#6a0a14'], bleed: 60 },
  ice: { col: ['#cfffff', '#3bc8e8'], slow: 0.4 }, sea: { col: ['#7ae0e0', '#ffffff'], slow: 0.3 },
  rune: { col: ['#8a7aff', '#ffd650'], curse: 0.12 }, death: { col: ['#e8e0c8', '#6ad08a'], curse: 0.12 },
  astral: { col: ['#c8b8ff', '#fff2a8'], slow: 0.25 }, arcane: { col: ['#8a7aff', '#f0ead8'], curse: 0.1 }, nature: { col: ['#7ad04a', '#a86a3a'], slow: 0.2 },
};

const methods = {
  // ------------------------------------------------------------ the volley. Returns true when it fired the shots itself.
  mechVolley(W, sp, ox, oy, a, mult) {
    const p = this.player, M = sp.mech, roll = () => Math.round((W.dmg[0] + R() * (W.dmg[1] - W.dmg[0])) * mult);
    if (p.mechW !== W) { p.mechW = W; p.mechN = 0; p.mechVol = 0; p.charge = 0; p.mechMark = null; }   // a new weapon starts fresh
    const n = (p.mechN = (p.mechN || 0) + 1);                  // swings with this weapon
    const vol = (p.mechVol = (p.mechVol || 0) + 1);
    const fire = (x, y, ang, dmg, extra = {}) => {
      const b = this.shoot('p', x, y, ang, extra.speed || W.speed, extra.range || W.range, dmg, extra.proj || W.proj, extra.size || W.size, extra.pierce ?? W.pierce);
      b.sp = sp; b.speed = extra.speed || W.speed; b.max = b.life; b.vol = vol; Object.assign(b, extra.b || {});
      return b;
    };
    this.mechTrigger(W, sp, mult);                              // marks and glyphs from earlier swings go off now
    if (M.charge && p.charge >= M.charge.need) {                // a Legendary's signature strike
      p.charge = 0;
      this.mechSignature(W, sp, M, ox, oy, a, roll, fire);
      return true;
    }
    const cnt = W.count || 1, spread = (k) => (cnt > 1 ? (k / (cnt - 1) - 0.5) * (W.arc || 0) : 0);
    switch (M.kind) {
      case 'curve': {                                           // aimed so the arc passes through your cursor
        const I = this.input, d = Math.min(W.range, Math.max(1, Math.hypot(I.aimX - ox, I.aimY - oy)));
        const sign = n % 3 === 0 ? -1 : 1, T = d / W.speed, c = sign * M.turn;
        for (let k = 0; k < cnt; k++) fire(ox, oy, a + spread(k) - (c * T) / 2, roll(), { b: { curve: c } });
        return true;
      }
      case 'converge': {
        if (n % 2) { fire(ox, oy, a, roll()); return true; }   // the narrow primary
        const meet = W.range * (M.meet || 0.5), off = M.off || 0.45, perp = a + Math.PI / 2;
        for (const s of [-1, 1]) {                              // the pair: from either side, crossing at mid-range
          const x = ox + Math.cos(perp) * off * s, y = oy + Math.sin(perp) * off * s;
          fire(x, y, angleTo(x, y, ox + Math.cos(a) * meet, oy + Math.sin(a) * meet), Math.round(roll() * M.pairF));
        }
        return true;
      }
      case 'stack': {                                           // left hand, right hand, in turn
        const side = n % 2 ? 1 : -1, perp = a + Math.PI / 2, x = ox + Math.cos(perp) * 0.3 * side, y = oy + Math.sin(perp) * 0.3 * side;
        for (let k = 0; k < cnt; k++) fire(x, y, a + spread(k) - side * 0.04, roll());
        return true;
      }
      case 'center': {
        for (let k = 0; k < 3; k++) fire(ox, oy, a + (k - 1) * (M.arc || 0.12), Math.round(roll() * (k === 1 ? 1 : M.flankF)), { b: { center: k === 1 } });
        return true;
      }
      case 'dart': { for (let k = 0; k < cnt; k++) fire(ox, oy, a + spread(k), roll(), { b: { dart: { at: M.at, hold: M.hold, s: M.s, f: M.f, t: 0 } } }); return true; }
      default: {                                                // follow, shards, glyph, phantom, starfall, brand: the usual volley
        for (let k = 0; k < cnt; k++) fire(ox, oy, a + spread(k), roll());
        return true;
      }
    }
  },
  // marks and glyphs left by earlier swings go off on the next one
  mechTrigger(W, sp, mult) {
    const M = sp.mech, p = this.player, avg = ((W.dmg[0] + W.dmg[1]) / 2) * mult, T = THEME[M.theme] || THEME.arcane;
    if (M.kind === 'follow' && p.mechMark) {
      const e = p.mechMark; p.mechMark = null;
      if (!e.dead && e.wmark && e.wmark.until > this.t) {
        e.wmark = null;
        if (M.cross) {                                          // a cut across the mark, at right angles to your aim
          const a = angleTo(p.x, p.y, e.x, e.y) + Math.PI / 2, [hx, hy] = this.up(e.x, e.y, e.hitUp || 0.5);
          const b = this.shoot('p', hx - Math.cos(a) * 1.6, hy - Math.sin(a) * 1.6, a, W.speed, 3.2, Math.round(avg * M.f), W.proj, W.size, true);
          b.child = true;
        } else {
          for (const o of this.enemiesIn(e.x, e.y, M.r || 1.2)) { this.damageEnemy(o, Math.round(avg * M.f), o.x, o.y - 0.5, true); this.mechDebuff(o, M.theme, 1.5); }
          this.vx({ k: 'burst', x: e.x, y: e.y - 0.5, n: 6, colors: T.col });
          this.fx.push({ kind: 'ring', x: e.x, y: e.y - 0.3, t: 0, max: M.r || 1.2, color: T.col[0] });
        }
      }
    }
    if (M.kind === 'glyph' && this.fx.some((f) => f.kind === 'wglyph' && f.own === W)) {
      for (const f of this.fx) if (f.kind === 'wglyph' && f.own === W && !f.done) {
        f.done = true; f.life = 0;
        for (const o of this.enemiesIn(f.x, f.y, M.r)) { this.damageEnemy(o, Math.round(avg * M.f), o.x, o.y - 0.5, true); this.mechDebuff(o, M.theme, 2); }
        this.vx({ k: 'burst', x: f.x, y: f.y, n: 6, colors: T.col });
        this.fx.push({ kind: 'ring', x: f.x, y: f.y, t: 0, max: M.r, color: T.col[0] });
      }
    }
  },
  // a theme's debuff on an enemy: burn, bleed, slow or a curse (more damage taken)
  mechDebuff(e, theme, t) {
    const T = THEME[theme] || THEME.arcane;
    if (T.burn) this.ignite(e, T.burn, t);
    if (T.bleed) this.ignite(e, T.bleed, t);
    if (T.slow && e !== this.boss && !e.rb) { e.slowT = Math.max(e.slowT || 0, t); e.slowF = Math.max(e.slowF || 0, T.slow); }
    if (T.curse) { e.curseF = Math.max(e.curseT > 0 ? e.curseF || 0 : 0, T.curse); e.curseT = Math.max(e.curseT || 0, t); }
  },
  // ------------------------------------------------------------ in flight
  mechFlight(b, dt) {
    if (b.curve) {                                              // a fixed bend
      const na = Math.atan2(b.vy, b.vx) + b.curve * dt, s = Math.hypot(b.vx, b.vy);
      b.vx = Math.cos(na) * s; b.vy = Math.sin(na) * s; b.a = na;
    }
    if (b.dart) {                                               // out, a stop, then one dart onward
      const D = b.dart, flown = 1 - b.life / b.max;
      if (!D.stopped && flown >= D.at) { D.stopped = true; D.vx = b.vx; D.vy = b.vy; b.vx = 0; b.vy = 0; }
      if (D.stopped && !D.went) {
        D.t += dt; b.life += dt;
        if (D.t >= D.hold) { D.went = true; b.vx = D.vx * D.s; b.vy = D.vy * D.s; b.dmg = Math.round(b.dmg * D.f); b.life += (b.max * (1 - D.at)) * 0.6; if (b.hit) b.hit.clear(); }
      }
    }
  },
  // ------------------------------------------------------------ a hit
  mechHit(e, b, dealt) {
    const sp = b.sp, M = sp.mech, p = this.player, T = THEME[M.theme] || THEME.arcane;
    b.hitN = (b.hitN || 0) + 1;
    if (M.charge && b.vol && p.chargeVol !== b.vol && !b.child) { p.chargeVol = b.vol; this.mechCharge(M); }
    if (b.child || b.sig) return;
    switch (M.kind) {
      case 'follow':
        if (M.every && (p.followN = (p.followN || 0) + 1) % M.every) break;
        e.wmark = { until: this.t + 2.5, col: T.col[0] }; p.mechMark = e;
        break;
      case 'shards': if (b.hitN === 1) this.mechShards(b, M, e); break;
      case 'stack': {
        if (!e.wstack || e.wstack.until < this.t) e.wstack = { n: 0 };
        e.wstack.n++; e.wstack.until = this.t + 2.5; e.wstack.col = T.col[0];
        if (e.wstack.n === 2) this.mechDebuff(e, M.theme, 2.5);
        if (e.wstack.n >= 3) {                                   // cashed in
          e.wstack = null;
          this.damageEnemy(e, Math.round(b.dmg * M.cash), e.x, e.y - 0.6, true);
          this.vx({ k: 'burst', x: e.x, y: e.y - 0.5, n: 6, colors: T.col });
        }
        break;
      }
      case 'glyph':
        if (b.hitN === 1) { b.pierce = true; this.mechGlyph(b, M); }
        else b.life = 0;                                          // (through the first enemy only)
        break;
      case 'center':
        if (b.center) { e.curseF = Math.max(e.curseT > 0 ? e.curseF || 0 : 0, M.mark); e.curseT = Math.max(e.curseT || 0, 2); e.wmark = { until: this.t + 2, col: T.col[0] }; }
        break;
      case 'phantom': if (b.hitN === 1) { this.mechPhantom(b.x, b.y, b.dmg, M); b.phantomDone = true; } break;
      case 'starfall':
        p.mechLast = e;
        if (p.starVol !== b.vol) { p.starVol = b.vol; if ((p.starN = (p.starN || 0) + 1) % M.every === 0) this.mechStar(e, b.dmg, M); }
        break;
      case 'brand': {
        e.wbrand = (e.wbrandT > this.t ? e.wbrand || 0 : 0) + 1; e.wbrandT = this.t + 3;
        e.wmark = { until: this.t + 3, col: T.col[0] };
        if (e.wbrand >= 3) {                                      // the oath cracks
          e.wbrand = 0; e.wmark = null;
          this.mechShards(b, M, e);
          p.hp = Math.min(this.stat('hp'), p.hp + Math.round(dealt * M.heal));
          this.float(p.x, p.y - 1.3, `+${Math.round(dealt * M.heal)}`, '#5ae07a');
        }
        break;
      }
    }
  },
  mechShards(b, M, e) {                                       // out to either side of the enemy struck
    const a0 = Math.atan2(b.vy, b.vx), [x, y] = e ? this.up(e.x, e.y, e.hitUp || 0.5) : [b.x, b.y];
    for (const s of [-1, 1]) {
      const c = this.shoot('p', x, y, a0 + s * Math.PI / 2, 9, M.len || 1.8, Math.round(b.dmg * M.f), M.proj || b.sprite, 0.4, true);
      c.hit.add(e);                                            // (not the one it came out of)
      c.child = true;
    }
  },
  mechGlyph(b, M) {
    const own = this.weapon(), live = this.fx.filter((f) => f.kind === 'wglyph' && f.own === own && !f.done);
    if (live.length >= 2) { live[0].done = true; live[0].life = 0; }   // (two at most)
    this.fx.push({ kind: 'wglyph', own, x: b.x, y: b.y + 0.3, r: M.r, t: 0, life: 3, col: (THEME[M.theme] || THEME.arcane).col[0] });
  },
  mechPhantom(x, y, dmg, M) {
    this.fx.push({ kind: 'wphantom', x, y: y + 0.3, r: M.r, t: 0, life: M.delay + 0.3, delay: M.delay, dmg: Math.round(dmg * M.f), stun: M.stun || 0, col: (THEME[M.theme] || THEME.sea).col });
  },
  mechStar(e, dmg, M) {
    this.fx.push({ kind: 'star', x: e.x, y: e.y, t: 0, life: 0.9, delay: 0.55, r: M.r, dmg: Math.round(dmg * M.f), done: false, sparks: 4, sparkDmg: Math.round(dmg * M.sparkF), sparkProj: M.sparkProj });
  },
  mechCharge(M) {
    const p = this.player;
    if (p.charge >= M.charge.need) return;
    p.charge = (p.charge || 0) + 1;
    if (p.charge >= M.charge.need) { this.float(p.x, p.y - 1.5, M.charge.name.toUpperCase(), (THEME[M.theme] || THEME.fire).col[0]); this.vx({ k: 'burst', x: p.x, y: p.y - 0.6, n: 8, colors: (THEME[M.theme] || THEME.fire).col }); }
  },
  // a Legendary's signature: the swing it saved up for
  mechSignature(W, sp, M, ox, oy, a, roll, fire) {
    const S = M.charge, T = THEME[M.theme] || THEME.fire, p = this.player;
    for (let k = 0; k < S.n; k++) {
      const off = S.n > 1 ? (k / (S.n - 1) - 0.5) * S.arc : 0;
      fire(ox, oy, a + off, Math.round(roll() * S.f), { pierce: true, size: (W.size || 0.5) * 1.2, b: { sig: true, sigMax: S.cap, sigHits: 0 } });
    }
    this.vx({ k: 'burst', x: p.x, y: p.y - 0.6, n: 10, colors: T.col });
    this.vx({ k: 'shake', amt: 2 });
  },
  // a signature shot's own hit (capped: it can't clear a room or delete a boss phase)
  mechSigHit(e, b, dealt) {
    const M = b.sp.mech, S = M.charge, p = this.player;
    if ((b.sigHits = (b.sigHits || 0) + 1) > S.cap) { b.life = 0; return; }
    if (S.blast) {
      for (const o of this.enemiesIn(e.x, e.y, S.blast.r).slice(0, S.blast.max)) if (o !== e) this.damageEnemy(o, Math.round(b.dmg * S.blast.f), o.x, o.y - 0.5, true);
      this.vx({ k: 'boom', x: e.x, y: e.y, r: S.blast.r });
    }
    if (M.theme) this.mechDebuff(e, M.theme, 3);
    if (S.heal && (b.healN = (b.healN || 0) + 1) <= S.heal.max) {
      const h = Math.round(this.stat('hp') * S.heal.f); p.hp = Math.min(this.stat('hp'), p.hp + h); this.float(p.x, p.y - 1.3, `+${h}`, '#5ae07a');
    }
    void dealt;
  },
  // ------------------------------------------------------------ a shot's end (no hit): a phantom still lands where it stopped
  mechEnd(b) {
    const M = b.sp.mech;
    if (M.kind === 'phantom' && !b.phantomDone && !b.child) this.mechPhantom(b.x, b.y, b.dmg, M);
  },
  // ------------------------------------------------------------ every frame: phantom blows land, marks run out
  mechTick() {
    for (const f of this.fx) {
      if (f.kind === 'wphantom' && !f.done && f.t >= f.delay) {
        f.done = true;
        for (const e of this.enemiesIn(f.x, f.y - 0.3, f.r)) { this.damageEnemy(e, f.dmg, e.x, e.y - 0.5, true); if (f.stun && e !== this.boss && !e.rb) this.stun(e, f.stun); }
        this.vx({ k: 'burst', x: f.x, y: f.y - 0.3, n: 12, colors: f.col });
        this.fx.push({ kind: 'ring', x: f.x, y: f.y - 0.3, t: 0, max: f.r, color: f.col[0] });
        this.vx({ k: 'shake', amt: 2 });
      }
    }
  },
  // a falling star's four sparks (Starfall Blade): called where the star lands
  starSparks(f) {
    for (let k = 0; k < f.sparks; k++) { const c = this.shoot('p', f.x, f.y - 0.4, (k / f.sparks) * TAU + Math.PI / 4, 8, 2.4, f.sparkDmg, f.sparkProj || 'star', 0.4, true); c.child = true; }
  },
};
export function installWeaponMech(Game) { Object.assign(Game.prototype, methods); }
export { THEME as MECH_THEME };
