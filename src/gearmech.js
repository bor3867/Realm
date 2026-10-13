// Armour and ring mechanics (item rework, realm_505_item_rework_blueprint.md), mixed into Game like weaponmech.js. A
// reworked UT armour or special ring names one in item.gear = { kind, ...its numbers }; the same kind on two pieces counts
// once (no stacking). game.js calls in: gearPreHurt (a blow, before it lands), gearPostHurt (after), gearOnHit (your weapon
// hits), gearOnKill, gearOnAbility (a cast) and gearTick (every frame). Visuals are small static glyphs and rings.
// Armour:  stride (keep moving: a barrier that breaks on the next hit), bigpulse (a heavy hit: a weakening pulse),
//          sanctuary (dropping below low Life: an absorbing shield, long cooldown), hazard (a hit leaves a patch behind),
//          counter (hits store stacks; at the cap the next blow is softened and a countershot fires), markkill (killing
//          an enemy you have just hit restores a little and pulses), nebula (a near miss leaves an afterimage)
// Rings:   control (every few hits on one enemy slow or weaken it, capped), killshard (a kill throws a shard at the
//          nearest enemy), motion (moving charges your next ability), accuracy (hits on one enemy build to a follow-up),
//          glyph (surviving a heavy blow drops a glyph that stops one shot), tempo (an ability right after a hit refunds Mana
//          and fires a small shot), and the Mythic and Legendary rings' own: satellite, openhand, coronation, stillwater,
//          aurora, firstflame, starspear, blight, conductor, glowcap, mask, tideeye
import { ITEMS } from './data/items.js';
import { dmgMult } from './data/classes.js';
const TAU = Math.PI * 2;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

const methods = {
  // the gear mechanics you wear, one of each kind
  gear() {
    const key = this.player.equip.join('|');
    if (this._gkey === key) return this._gear;
    const G = {};
    for (const id of this.player.equip) { const g = id && ITEMS[id] && ITEMS[id].gear; if (g && !G[g.kind]) G[g.kind] = g; }
    this._gkey = key; this._gear = G;
    return G;
  },
  gst() { const p = this.player; return p.gst || (p.gst = { cd: {}, n: {}, moveT: 0, stillT: 0 }); },
  ready(k) { return !(this.gst().cd[k] > this.t); },
  cool(k, s) { this.gst().cd[k] = this.t + s; },
  gmult() { return dmgMult(this.stat('att')); },
  gshot(x, y, a, dmg, proj = 'spark', speed = 11, range = 5, pierce = true) { const b = this.shoot('p', x, y, a, speed, range, dmg, proj, 0.45, pierce); b.child = true; return b; },
  aimAngle() { const p = this.player, I = this.input, [ox, oy] = this.up(p.x, p.y, 0.5); return Math.atan2(I.aimY - oy, I.aimX - ox); },
  glyphAt(x, y, col) { this.fx.push({ kind: 'ring', x, y: y - 0.3, t: 0, max: 1.1, color: col }); },

  // ------------------------------------------------------------ a blow, before it lands: returns what is left of it
  gearPreHurt(d) {
    const G = this.gear(), S = this.gst(), p = this.player;
    if (S.barrier) {                                         // stride / open hand / coronation: the next blow breaks it
      const w = Math.min(d, S.barrier.cap); d -= w; this.float(p.x, p.y - 1.2, 'BARRIER', S.barrier.col); this.glyphAt(p.x, p.y, S.barrier.col);
      if (S.barrier.then) S.barrier.then(); S.barrier = null;
    }
    if (S.sanct && S.sanct.until > this.t && S.sanct.left > 0) { const w = Math.min(d, S.sanct.left); S.sanct.left -= w; d -= w; }
    if (S.damp && S.damp > this.t) { d = Math.round(d * 0.5); S.damp = 0; }
    if (G.counter && (S.n.counter || 0) >= G.counter.cap) {   // a stored counter: softened, and a shot straight back
      S.n.counter = 0; d = Math.round(d * (1 - G.counter.soften));
      this.gshot(p.x, p.y - 0.5, this.aimAngle(), Math.round(G.counter.dmg * this.gmult()), 'rune_slash', 13, 6);
      this.float(p.x, p.y - 1.4, 'COUNTER', '#d8d0e8');
    }
    if (G.coronation && S.crown && this.ready('crown')) {      // the Crown of the Unstruck: a golden barrier and a strike
      S.crown = false; this.cool('crown', G.coronation.cd); const w = Math.min(d, G.coronation.cap); d -= w;
      const a = this.aimAngle(); for (const s of [-1, 1]) this.gshot(p.x, p.y - 0.5, a + s * Math.PI / 2, Math.round(G.coronation.dmg * this.gmult()), 'goldshard', 12, 5);
      this.float(p.x, p.y - 1.5, 'CROWNED', '#ffd650'); this.glyphAt(p.x, p.y, '#ffd650');
    }
    return Math.max(0, d);
  },
  // ------------------------------------------------------------ after a blow
  gearPostHurt(d, hp0) {
    const G = this.gear(), S = this.gst(), p = this.player, max = this.stat('hp');
    S.lastHurt = this.t;
    if (G.bigpulse && d >= max * G.bigpulse.at && this.ready('bigpulse')) {
      this.cool('bigpulse', G.bigpulse.cd);
      for (const e of this.enemiesIn(p.x, p.y, G.bigpulse.r)) {
        this.damageEnemy(e, Math.round(G.bigpulse.dmg * this.gmult()), e.x, e.y - 0.5, true);
        e.curseF = Math.max(e.curseT > 0 ? e.curseF || 0 : 0, 0.15); e.curseT = Math.max(e.curseT || 0, 3);
        if (e !== this.boss && !e.rb) { e.slowT = Math.max(e.slowT || 0, 2); e.slowF = Math.max(e.slowF || 0, 0.3); }
      }
      this.fx.push({ kind: 'ring', x: p.x, y: p.y - 0.4, t: 0, max: G.bigpulse.r, color: G.bigpulse.col || '#ffb04a' });
    }
    if (G.sanctuary && hp0 >= max * G.sanctuary.below && p.hp < max * G.sanctuary.below && p.hp > 0 && this.ready('sanct')) {
      this.cool('sanct', G.sanctuary.cd); S.sanct = { until: this.t + G.sanctuary.t, left: Math.round(max * G.sanctuary.absorb) };
      this.float(p.x, p.y - 1.5, 'SANCTUARY', '#fff2a8');
      this.fx.push({ kind: 'gear', h: 'sanct', t: 0, life: G.sanctuary.t, col: G.sanctuary.col || '#fff2a8' });
    }
    if (G.hazard && this.ready('hazard')) { this.cool('hazard', G.hazard.cd); this.fx.push({ kind: 'gear', h: 'hazard', x: p.x, y: p.y, t: 0, life: G.hazard.t, r: G.hazard.r, dps: Math.round(G.hazard.dps * this.gmult()), tick: 0, col: G.hazard.col || '#ff8a2a' }); }
    if (G.glyph && d >= max * G.glyph.at && p.hp > 0 && this.ready('glyph')) { this.cool('glyph', G.glyph.cd); S.glyph = { until: this.t + G.glyph.life, col: G.glyph.col || '#cfe8ff' }; this.float(p.x, p.y - 1.4, 'GLYPH', S.glyph.col); }
    if (G.glowcap && (S.spores ?? G.glowcap.max) > 0) {
      S.spores = (S.spores ?? G.glowcap.max) - 1;
      this.fx.push({ kind: 'gear', h: 'mushroom', x: p.x, y: p.y, t: 0, life: G.glowcap.t, r: 1.3, heal: G.glowcap.heal });
    }
    S.crownT = 0;                                              // (being struck resets the coronation's build)
  },
  // ------------------------------------------------------------ your weapon hits
  gearOnHit(e, b, dealt) {
    const G = this.gear(), S = this.gst(), p = this.player, m = this.gmult();
    e.youHitT = this.t; S.lastHit = this.t;
    if (b.child) return;
    if (G.counter && (S.n.cHits = (S.n.cHits || 0) + 1) % G.counter.every === 0 && (S.n.counter || 0) < G.counter.cap) { S.n.counter = (S.n.counter || 0) + 1; }
    if (G.control) {
      e.ctl = (e.ctlT > this.t - 2 ? e.ctl || 0 : 0) + 1; e.ctlT = this.t;
      if (e.ctl >= G.control.every && !(e.ctlCd > this.t)) {
        e.ctl = 0; e.ctlCd = this.t + 3;                          // (capped: once every 3 s per enemy)
        if (e !== this.boss && !e.rb) { e.slowT = Math.max(e.slowT || 0, 1.5); e.slowF = Math.max(e.slowF || 0, G.control.slow); }
        e.curseF = Math.max(e.curseT > 0 ? e.curseF || 0 : 0, G.control.weaken); e.curseT = Math.max(e.curseT || 0, 1.5);
        e.wmark = { until: this.t + 1.5, col: G.control.col || '#7ae0e0' };
      }
    }
    if (G.accuracy || G.firstflame || G.tideeye) {
      e.acc = (e.accT > this.t - 2 ? e.acc || 0 : 0) + 1; e.accT = this.t;
      if (G.accuracy && e.acc % G.accuracy.need === 0) { this.damageEnemy(e, Math.round(G.accuracy.dmg * m), e.x, e.y - 0.6); this.vx({ k: 'burst', x: e.x, y: e.y - 0.5, n: 6, colors: [G.accuracy.col || '#ffd650', '#ffffff'] }); }
      if (G.firstflame && e.acc % 3 === 0 && this.ready('flame')) {
        this.cool('flame', G.firstflame.cd); const a = this.aimAngle();
        for (let k = -2; k <= 2; k++) { const s = this.gshot(p.x, p.y - 0.5, a + k * 0.08, Math.round(G.firstflame.dmg * m), 'ember', 12, 5); s.sp = { burn: { dps: Math.round(60 * m), t: 2 } }; }
      }
      if (G.tideeye && e.acc >= G.tideeye.need) { S.tide = e; e.wmark = { until: this.t + 4, col: '#7ae0e0' }; }
    }
    if (G.satellite && (S.n.sat = (S.n.sat || 0) + 1) % G.satellite.every === 0) S.sat = Math.min(3, (S.sat || 0) + 1);
    if (G.satellite && S.sat >= 3) {                           // three charges: one strike across the target
      S.sat = 0;
      const a = Math.atan2(e.y - p.y, e.x - p.x) + Math.PI / 2, [hx, hy] = this.up(e.x, e.y, e.hitUp || 0.5);
      this.gshot(hx - Math.cos(a) * 1.6, hy - Math.sin(a) * 1.6, a, Math.round(G.satellite.dmg * m), 'star', 13, 3.2);
    }
    if (G.openhand && dist(p.x, p.y, e.x, e.y) < 3.2) S.stance = Math.min(G.openhand.need, (S.stance || 0) + 1);
    if (G.starspear && (S.n.frag = (S.n.frag || 0) + 1) % 4 === 0) S.frags = Math.min(3, (S.frags || 0) + 1);
    if (G.blight) S.rot = Math.min(20, (S.rot || 0) + 1);
    if (G.conductor && S.beatSrc !== 'w') { S.beatSrc = 'w'; S.beat = (S.beat || 0) + 1; this.conductorBeat(G.conductor); }
    if (G.stillwater && S.pool && S.pool.moved) {             // moved on from a charged pool: the ripple at the old spot
      const P0 = S.pool; S.pool = null;
      for (const o of this.enemiesIn(P0.x, P0.y, 2.2)) { this.damageEnemy(o, Math.round(G.stillwater.dmg * m), o.x, o.y - 0.5, true); if (o !== this.boss && !o.rb) { o.slowT = Math.max(o.slowT || 0, 2); o.slowF = Math.max(o.slowF || 0, 0.4); } }
      this.fx.push({ kind: 'ring', x: P0.x, y: P0.y - 0.3, t: 0, max: 2.2, color: '#9ad8ff' });
    }
    void dealt;
  },
  conductorBeat(C) {
    const S = this.gst();
    if (S.beat >= 3) {
      S.beat = 0; const p = this.player;
      this.gshot(p.x, p.y - 0.5, this.aimAngle(), Math.round(C.dmg * this.gmult()), 'zap', 16, 9);
      this.float(p.x, p.y - 1.4, '♪', '#bfe8ff');
    }
  },
  // ------------------------------------------------------------ a kill
  gearOnKill(e) {
    const G = this.gear(), p = this.player, m = this.gmult();
    if (G.killshard) {
      const n = this.enemiesIn(e.x, e.y, G.killshard.range).filter((o) => o !== e && !o.dead).sort((u, v) => dist(u.x, u.y, e.x, e.y) - dist(v.x, v.y, e.x, e.y))[0];
      if (n) this.gshot(e.x, e.y - 0.5, Math.atan2(n.y - e.y, n.x - e.x), Math.round(G.killshard.dmg * m), 'thornseed', 12, G.killshard.range, false);
    }
    if (G.markkill && e.youHitT > this.t - 3) {
      if (G.markkill.hp) p.hp = Math.min(this.stat('hp'), p.hp + G.markkill.hp);
      if (G.markkill.mp) p.mp = Math.min(this.stat('mp'), p.mp + G.markkill.mp);
      for (const o of this.enemiesIn(e.x, e.y, 2)) if (o !== e) this.damageEnemy(o, Math.round(G.markkill.dmg * m), o.x, o.y - 0.5, true);
      this.fx.push({ kind: 'ring', x: e.x, y: e.y - 0.3, t: 0, max: 2, color: G.markkill.col || '#8af6ff' });
    }
  },
  // ------------------------------------------------------------ a cast
  gearOnAbility() {
    const G = this.gear(), S = this.gst(), p = this.player, m = this.gmult(), a = this.aimAngle(), [ox, oy] = this.up(p.x, p.y, 0.5);
    if (G.tempo && S.lastHit > this.t - G.tempo.window) {
      p.mp = Math.min(this.stat('mp'), p.mp + G.tempo.mana); this.float(p.x, p.y - 1.3, `+${G.tempo.mana}`, '#6a9aff');
      this.gshot(ox, oy, a, Math.round(G.tempo.dmg * m), G.tempo.proj || 'spark', 13, 6);
    }
    if (G.motion && S.charge > 0.05) { S.empower = { until: this.t + 2.5, f: G.motion.bonus * S.charge }; S.charge = 0; this.float(p.x, p.y - 1.4, 'EMPOWERED', '#ffd6f0'); }
    if (G.openhand && S.stance >= G.openhand.need) {          // the open palm: a pushing wave, and a barrier for one blow
      S.stance = 0;
      for (const e of this.enemiesIn(p.x, p.y, 3.5)) if (e !== this.boss && !e.rb && !(e.D && e.D.dummy)) { const d = dist(e.x, e.y, p.x, p.y) || 1; this.moveCircle(e, ((e.x - p.x) / d) * 2, ((e.y - p.y) / d) * 2, 0.35); }
      S.barrier = { cap: Math.round(this.stat('hp') * 0.3), col: '#fff2a8' };
      this.fx.push({ kind: 'ring', x: p.x, y: p.y - 0.4, t: 0, max: 3.5, color: '#fff2a8' });
    }
    if (G.aurora && S.aurora) {
      S.aurora = false; S.glyph = { until: this.t + 4, col: '#a8ffe0' };
      const L = this.enemiesIn(p.x, p.y, 8).sort((u, v) => dist(u.x, u.y, p.x, p.y) - dist(v.x, v.y, p.x, p.y)).slice(0, 3);
      L.forEach((e, k) => this.gshot(ox, oy, Math.atan2(e.y - 0.5 - oy, e.x - ox), Math.round(G.aurora.dmg * m), ['ember', 'frostshard', 'starbeam'][k], 12, 8));
    }
    if (G.starspear && S.frags > 0) {
      for (let k = 0; k < S.frags; k++) this.gshot(ox, oy, a + (k - (S.frags - 1) / 2) * 0.04, Math.round(G.starspear.dmg * m), 'starbeam', 15, 9);
      S.frags = 0;
    }
    if (G.blight && S.rot >= 10) {
      S.rot = 0; const I = this.input, d = Math.min(7, dist(p.x, p.y, I.aimX, I.aimY));
      for (let k = 0; k < 3; k++) { const aa = a + (k - 1) * 0.5; this.fx.push({ kind: 'gear', h: 'pod', x: p.x + Math.cos(aa) * d * 0.8, y: p.y + Math.sin(aa) * d * 0.8, t: 0, life: 8, dmg: Math.round(G.blight.dmg * m) }); }
    }
    if (G.conductor && S.beatSrc !== 'a') { S.beatSrc = 'a'; S.beat = (S.beat || 0) + 1; this.conductorBeat(G.conductor); }
    if (G.mask && (S.n.cast = (S.n.cast || 0) + 1) % 3 === 0 && this.ready('mask')) {
      this.cool('mask', G.mask.cd);
      this.decoys.push({ x: p.x, y: p.y, t: 1.5, max: 1.5, dmg: 0, n: 0, range: 0, flip: p.dir === 'left', dir: p.dir });
      for (let k = -1; k <= 1; k++) this.gshot(ox, oy, a + k * 0.15, Math.round(G.mask.dmg * m), 'scissor_blade', 13, 6);
    }
    if (G.tideeye && S.tide && !S.tide.dead) {
      const e = S.tide; S.tide = null; e.acc = 0;
      if (e !== this.boss && !e.rb && !(e.D && e.D.dummy)) { const d = dist(e.x, e.y, p.x, p.y) || 1; this.moveCircle(e, ((p.x - e.x) / d) * 1.5, ((p.y - e.y) / d) * 1.5, 0.35); }
      const aa = Math.atan2(e.y - 0.5 - oy, e.x - ox);
      for (let k = -1; k <= 1; k++) this.gshot(ox, oy, aa + k * 0.1, Math.round(G.tideeye.dmg * m), 'tide_wave', 12, 8);
    }
  },
  // the Motion rings' empowered window: a damage bonus (read in hitDamage)
  gearDamageBonus() { const S = this.player.gst; return S && S.empower && S.empower.until > this.t ? S.empower.f : 0; },
  // ------------------------------------------------------------ every frame
  gearTick(dt) {
    const G = this.gear(), S = this.gst(), p = this.player;
    const moving = !!p.moving;
    S.moveT = moving ? S.moveT + dt : 0; S.stillT = moving ? 0 : S.stillT + dt;
    if (G.stride && !S.barrier && S.moveT >= G.stride.move && this.ready('stride')) {   // kept moving: the barrier
      S.barrier = { cap: Math.round(this.stat('hp') * G.stride.cap), col: G.stride.col || '#ffd650', then: () => this.cool('stride', G.stride.cd) };
      this.glyphAt(p.x, p.y, S.barrier.col);
    }
    if (G.motion) S.charge = Math.max(0, Math.min(1, (S.charge || 0) + (moving ? dt / G.motion.full : -dt / G.motion.full * 2)));
    if (G.coronation && !S.crown && this.t - (S.lastHurt || -99) > G.coronation.build) S.crown = true;
    if (G.stillwater) {
      if (!moving && S.stillT >= 1.5 && !S.pool) { S.pool = { x: p.x, y: p.y, moved: false }; this.glyphAt(p.x, p.y, '#9ad8ff'); }
      if (S.pool && !S.pool.moved && dist(p.x, p.y, S.pool.x, S.pool.y) > 2) S.pool.moved = true;
    }
    if (G.glowcap) { S.sporeT = (S.sporeT || 0) + dt; if (S.sporeT > 6) { S.sporeT = 0; S.spores = Math.min(G.glowcap.max, (S.spores ?? G.glowcap.max) + 1); } }
    // near misses (nebula, aurora): an enemy shot that came close and passed
    if (G.nebula || G.aurora) {
      for (const b of this.projectiles) {
        if (b.from !== 'e' || b.harmless) continue;
        const d = dist(b.x, b.y, p.x, p.y - 0.5);
        if (d < 0.9) b.nearP = true;
        else if (b.nearP && d > 1.4 && !b.nearDone) {
          b.nearDone = true;
          if (G.nebula && this.ready('nebula')) { this.cool('nebula', G.nebula.cd); S.damp = this.t + 2; for (const e of this.enemiesIn(p.x, p.y, 1.8)) this.damageEnemy(e, Math.round(G.nebula.dmg * this.gmult()), e.x, e.y - 0.5, true); this.glyphAt(p.x, p.y, '#c8b8ff'); }
          if (G.aurora && !S.aurora && (S.near = (S.near || 0) + 1) >= G.aurora.need) { S.near = 0; S.aurora = true; this.float(p.x, p.y - 1.4, 'AURORA', '#a8ffe0'); }
        }
      }
    }
    // a glyph or veil that stops one shot
    if (S.glyph && S.glyph.until > this.t) {
      const b = this.projectiles.find((q) => q.from === 'e' && !q.harmless && q.life > 0 && dist(q.x, q.y, p.x, p.y - 0.5) < 0.9);
      if (b) { b.life = -1; this.glyphAt(p.x, p.y, S.glyph.col); S.glyph = null; }
    }
    for (const f of this.fx) {
      if (f.kind !== 'gear') continue;
      if (f.h === 'hazard') { f.tick -= dt; if (f.tick <= 0) { f.tick = 0.5; for (const e of this.enemiesIn(f.x, f.y, f.r).slice(0, 3)) this.damageEnemy(e, Math.round(f.dps * 0.5), e.x, e.y - 0.5, true); } }
      if (f.h === 'mushroom' && dist(p.x, p.y, f.x, f.y) < f.r) p.hp = Math.min(this.stat('hp'), p.hp + f.heal * dt);
      if (f.h === 'pod' && !f.done) {
        const e = this.enemiesIn(f.x, f.y, 1.2)[0];
        if (e) { f.done = true; f.life = 0; for (const o of this.enemiesIn(f.x, f.y, 1.6)) this.damageEnemy(o, o === this.boss || o.rb ? Math.round(f.dmg * 0.5) : f.dmg, o.x, o.y - 0.5); this.vx({ k: 'burst', x: f.x, y: f.y, n: 10, colors: ['#7ad04a', '#a86a3a'] }); }
      }
    }
  },
};
export function installGearMech(Game) { Object.assign(Game.prototype, methods); }
