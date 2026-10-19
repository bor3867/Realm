// The Realmforge uniques' named effects (docs/realmforge_port.md, item.rf.pending), mixed into Game. Each item owns
// its rule, keyed by its id; the numbers are the ones in its own description. game.js calls in next to the gear
// hooks (src/gearmech.js): rfPreHurt (a blow, before it lands), rfPostHurt (after), rfOnHit (your shot hits), rfOnKill,
// rfOnAbility, rfOnVolley (your weapon fires), rfTick (every frame), rfHitMult (damage against one enemy), rfStat (a
// stat bonus), rfAbilityCost and rfWallHit (one of your shots meets a wall).
// The three that seek (the Bog Seer, the Orbit Bow, the Crane Bow: the user's exception to the no-seeking rule) seek
// through the weapon's own homing (items.js, RF_SEEK; game.js).
import { lift, liftO, liftA, liftB } from '../util.js';
import { shotBlocked } from '../world/maps.js';
import { ITEMS } from '../data/items.js';
import { dmgMult } from '../data/classes.js';
const TAU = Math.PI * 2;
const d2 = (ax, ay, bx, by) => (ax - bx) ** 2 + (ay - by) ** 2;

const methods = {
  // the Realmforge uniques you wear (their ids without the rf_), and your state for them
  rfu() {
    const key = this.player.equip.join('|');
    if (this._rfuKey === key) return this._rfu;
    const U = {};
    for (const id of this.player.equip) if (id && ITEMS[id] && ITEMS[id].rf) U[id.slice(3)] = true;
    this._rfuKey = key; this._rfu = U; return U;
  },
  rfs() { const p = this.player; return p.rfs || (p.rfs = { cd: {}, n: {}, still: 0, move: 0, unhit: 0, heat: 0, charge: 0, hist: [], clouds: [], rifts: [], trails: [], later: [] }); },
  rfReady(k) { return !(this.rfs().cd[k] > this.t); },
  rfCool(k, s) { this.rfs().cd[k] = this.t + s; },
  rfMult() { return dmgMult(this.stat('att')); },
  rfNear(r, x = this.player.x, y = this.player.y) { return this.enemiesIn(x, y, r); },
  rfSay(text, col) { const p = this.player; this.float(...lift(p.x, p.y, 1.5), text, col); },
  rfShot(x, y, a, dmg, proj, speed = 10, range = 5, pierce = false) { const b = this.shoot('p', x, y, a, speed, range, dmg, proj || 'spark', 0.45, pierce); b.child = true; return b; },

  // ---- a blow, before it lands
  rfPreHurt(d) {
    const U = this.rfu(), S = this.rfs(), p = this.player;
    if (!Object.keys(U).length) return d;
    S.unhit = 0;
    if (U.moonhalo && S.moonlit) { S.moonlit = false; this.rfSay('MOONLIT', '#cfe0ff'); return 0; }        // the next blow passes through
    if (U.mothmantle && Math.random() < 0.1) { this.rfSay('DODGE', '#e8e4ff'); return 0; }
    if (U.washirobe && this.rfReady('fold')) { this.rfCool('fold', 8); d = Math.round(d * 0.5); this.rfSay('FOLD', '#e8e4ff'); }
    if (U.ossuary && S.boneWard > this.t) d = Math.round(d * 0.5);
    if (U.duneshell && S.still >= 1) d = Math.round(d * 0.75);                                            // the hardened shell
    if (U.twofaces && p.hp < this.stat('hp') / 2) d = Math.round(d * 0.88);
    if (U.cathedralplate && S.clouds.some((c) => c.mine && d2(c.x, c.y, p.x, p.y) < c.r * c.r)) d = Math.max(0, d - 10);   // +10 DEF in your own ash
    if (U.staraegis && d >= p.hp && this.rfReady('aegis')) { this.rfCool('aegis', 30); this.rfSay('STAR AEGIS', '#ffe680'); this.fx.push({ kind: 'ring', ...liftO(p.x, p.y, 0.5), t: 0, max: 1.4, color: '#ffe680' }); return 0; }
    if (U.harlequin && this.rfReady('vanish')) {                                                         // vanish: untouchable, a lure where you stood
      this.rfCool('vanish', 8); p.status.invuln = Math.max(p.status.invuln || 0, 0.4);
      this.decoys.push({ x: p.x, y: p.y, t: 0.8, max: 0.8, dmg: 0, n: 0, range: 0, flip: p.dir === 'left', dir: p.dir });
      this.rfSay('VANISH', '#ff8ad8');
    }
    return d;
  },
  // ---- after a blow
  rfPostHurt(d, hp0) {
    const U = this.rfu(), S = this.rfs(), p = this.player, max = this.stat('hp');
    if (!Object.keys(U).length) return;
    if (U.emberforge) for (const e of this.rfNear(2)) this.ignite(e, Math.round(45 * this.rfMult()), 3);
    if (U.thornhide) for (const e of this.rfNear(1.6)) this.ignite(e, Math.round(35 * this.rfMult()), 3);      // bleeding
    if (U.frostweave) { const e = this.rfNear(7).sort((a, b) => d2(a.x, a.y, p.x, p.y) - d2(b.x, b.y, p.x, p.y))[0]; if (e && !e.rb) { e.slowT = 1; e.slowF = 0.5; } }
    if (U.ossuary && Math.random() < 0.1) { S.boneWard = this.t + 2; this.rfSay('BONE WARD', '#e8e0c8'); }
    if (U.emberheart) S.heat = Math.min(600, S.heat + d);
    const low = p.hp > 0 && p.hp < max * 0.3 && hp0 >= max * 0.3;
    if (U.oasisring && low && this.rfReady('mirage')) { this.rfCool('mirage', 20); this.decoys.push({ x: p.x, y: p.y, t: 2, max: 2, dmg: 0, n: 0, range: 0, flip: p.dir === 'left', dir: p.dir }); this.rfSay('MIRAGE', '#ffe0a0'); }
    if (U.starseal && p.hp > 0 && p.hp < max * 0.3 && this.rfReady('starseal')) {                        // a star falls on the nearest enemy
      const e = this.rfNear(10).sort((a, b) => d2(a.x, a.y, p.x, p.y) - d2(b.x, b.y, p.x, p.y))[0];
      if (e) { this.rfCool('starseal', 30); this.fx.push({ kind: 'star', x: e.x, y: e.y, t: 0, life: 0.9, delay: 0.4, r: 1.6, dmg: Math.round(800 * this.rfMult()), done: false }); p.hp = Math.min(max, p.hp + max * 0.25); this.rfSay('STARSEAL', '#ffe680'); }
    }
    // a lethal blow: the Hollow Plate (once a dungeon), the Phoenix Span (once a dungeon), the Phoenix Plumage's Rebirth
    if (p.hp <= 0) {
      const M = this.map;
      if (U.hollowplate && !M.rfHollow) { M.rfHollow = true; p.hp = 1; p.status.invuln = Math.max(p.status.invuln || 0, 1); this.rfSay('HOLLOW', '#c8c0ff'); }
      else if (U.phoenixspan && !M.rfSpan) { M.rfSpan = true; p.hp = 1; p.status.invuln = Math.max(p.status.invuln || 0, 0.6); this.rfSay('NOT YET', '#ffb040'); }
      else if (U.phoenixplumage && !S.rebirthUsed) {
        S.rebirthUsed = true; p.hp = Math.round(max * 0.3); p.status.invuln = Math.max(p.status.invuln || 0, 1.5); this.banner('Rebirth!', 1600);
        for (const e of this.rfNear(3.5)) this.ignite(e, Math.round(80 * this.rfMult()), 4);
        this.vx({ k: 'burst', ...liftO(p.x, p.y, 0.5), n: 30, colors: ['#ff7a20', '#ffe080'] });
      }
    }
  },
  // ---- your weapon fires: the volley's shots (counters, extra shots, tags)
  rfOnVolley(shots, a, ox, oy, mult, W) {
    const U = this.rfu(), S = this.rfs();
    if (!Object.keys(U).length || !shots.length) return;
    const n = (k) => (S.n[k] = (S.n[k] || 0) + 1);
    const extra = (ang, f = 1, proj) => { const b0 = shots[0], b = this.rfShot(ox, oy, ang, Math.round(b0.dmg * f), proj || W.proj, W.speed, W.range, !!W.pierce); b.sp = b0.sp; return b; };
    for (const b of shots) {
      if (U.lodestone) { b.vx *= 0.9; b.vy *= 0.9; }
      if (U.starsunder) b.phase = true;                                                              // through cover
      if (U.gloamcrozier) b.rfTrail = { dmg: Math.round(40 * mult), cap: Math.round(200 * mult), every: 0.2, life: 1, col: '#cfe0ff' };
      if (U.baton) b.rfTrail = { dmg: Math.round(25 * mult), cap: Math.round(120 * mult), every: 0.25, life: 1, col: '#ff4a8a' };
      if (U.hexband && Math.random() < 0.2) b.rfCurse = true;
      if (U.prismwand) b.rfBounce = 1;
    }
    if (U.miragebow && shots.length >= 3) for (let k = 0; k < shots.length; k++) if (k !== (shots.length - 1) / 2 && k !== Math.floor(shots.length / 2)) { shots[k].dmg = Math.round(shots[k].dmg * 0.5); shots[k].rfMirage = true; }
    if (U.stormcoat && S.charge >= 1) { S.charge = 0; shots[0].sp = { ...(shots[0].sp || {}), chain: { n: 3, f: 0.6 } }; this.rfSay('STATIC', '#9ff4ff'); }
    if (U.emberheart && S.heat >= 600) {                                                             // full Heat: a ring of fire
      S.heat = 0; const p = this.player;
      for (const e of this.rfNear(3)) { this.damageEnemy(e, Math.round(500 * mult), ...lift(e.x, e.y, 0.5), true); this.ignite(e, Math.round(60 * mult), 3); }
      for (let k = 0; k < 12; k++) this.rfShot(ox, oy, (k / 12) * TAU, Math.round(80 * mult), 'ember', 7, 3, true);
      S.clouds.push({ x: p.x, y: p.y, r: 3, until: this.t + 3, burn: Math.round(60 * mult), col: '#ff7a20' });
      this.rfSay('ERUPTION', '#ff7a20');
    }
    if (U.wyrmcoil && this.rfReady('venom')) { this.rfCool('venom', 5); shots[0].rfVenom = true; }
    if (U.pearlring && n('pearl') % 10 === 0) { const b = shots[0]; b.pierce = true; b.hit = b.hit || new Set(); b.rfTide = true; }
    if (U.rifteye && n('rift') % 8 === 0) shots[0].rfRift = true;
    if (U.stormcaller && n('storm') % 4 === 0) { const b = extra(a, 0.8); b.sp = { ...(b.sp || {}), chain: { n: 3, f: 0.6 } }; }
    if (U.starbow && n('starbow') % 4 === 0) { const V = { hits: [], at: this.t + 0.5 }; for (const b of shots) b.rfStar = V; S.later.push(V); }
    if (U.cranebow && n('crane') % 10 === 0) for (const o of [-0.3, -0.15, 0.15, 0.3]) extra(a + o, 0.7);   // a whole flock of five
    if (U.starsunder && n('twin') % 3 === 0) extra(a + 0.12, 0.6);                                 // a spectral twin blade
    if (U.usurper && n('rook') % 6 === 0) for (const o of [Math.PI / 2, Math.PI, -Math.PI / 2]) extra(a + o, 0.7);   // a cross, like a rook
    if (U.baton && n('cards') % 5 === 0) for (const o of [-0.25, 0, 0.25]) extra(a + o, 0.5);       // a fan of three playing cards
    if (U.sarrukhfang && n('fang') % 5 === 0) shots[0].sp = { ...(shots[0].sp || {}), split: { n: 2, f: 0.5, proj: W.proj } };
    if (U.pendulumstaff && n('pendulum') % 8 === 0) shots[0].rfStop = true;
    if (U.gnomonblade && n('gnomon') % 6 === 0) shots[0].rfStill = true;
    if (S.reflect && S.reflect.until > this.t) {                                                   // the Facet Ring's Reflection copies your shots
      const [rx, ry] = lift(S.reflect.x, S.reflect.y, 0.5), I = this.input;
      for (const b of shots) this.rfShot(rx, ry, Math.atan2(I.aimY - ry, I.aimX - rx), Math.round(b.dmg * 0.4), W.proj, W.speed, W.range, !!W.pierce);
    }
  },
  // ---- your shot hits an enemy
  rfOnHit(e, b, dealt) {
    const U = this.rfu(), S = this.rfs(), p = this.player, mult = this.rfMult();
    if (!Object.keys(U).length) return;
    if (U.gravewarden) e.rfNoHeal = this.t + 2;
    if (b.rfCurse || (U.polaris && S.markT > this.t && S.mark === e)) { e.curseF = Math.max(e.curseT > 0 ? e.curseF || 0 : 0, 0.15); e.curseT = Math.max(e.curseT || 0, 3); }
    if (U.sarrukhfang) { e.curseF = Math.max(e.curseT > 0 ? e.curseF || 0 : 0, 0.1); e.curseT = Math.max(e.curseT || 0, 2); }   // scoured: its DEF down (as damage taken)
    if (U.lighthouse && !e.rb && !(e.rfBlindT > this.t)) { e.rfBlindT = this.t + 3; this.stun(e, 0.5); }
    if (U.unmaker) for (const o of this.rfNear(2, e.x, e.y)) if (o !== e && !o.rb) { const dd = Math.hypot(e.x - o.x, e.y - o.y) || 1; this.moveCircle(o, (e.x - o.x) / dd * 0.5, (e.y - o.y) / dd * 0.5, 0.35); }
    if (U.worldheart && this.rfReady('wheal')) { this.rfCool('wheal', 0.25); p.hp = Math.min(this.stat('hp'), p.hp + 10); }
    if (b.rfVenom) this.ignite(e, Math.round(100 * mult), 3);
    if (b.rfTide && !e.rb) { const a = Math.atan2(b.vy, b.vx); this.moveCircle(e, Math.cos(a) * 1, Math.sin(a) * 1, 0.4); }
    if (b.rfRift) { S.rifts.push({ x: e.x, y: e.y, until: this.t + 1.5 }); b.rfRift = false; this.fx.push({ kind: 'ring', ...liftO(e.x, e.y, 0.3), t: 0, max: 2, color: '#b06aff' }); }
    if (b.rfStop && !e.rb) { this.stun(e, 0.6); b.rfStop = false; this.rfSay('STOP', '#e3b95a'); }
    if (b.rfStill && !e.rb) { this.stun(e, 0.5); e.rfStillT = this.t + 0.5; b.rfStill = false; }
    if (b.rfStar) b.rfStar.hits.push(e);
  },
  // damage against one enemy (hitDamage): the Usurper's checkmate, the Gnomon Blade on the Stilled
  rfHitMult(e) {
    const U = this.rfu(), p = this.player;
    let m = 0;
    if (U.usurper && e && !e.rb && e.hp < (e.maxHp || 1) * 0.15) m += 2;
    if (U.gnomonblade && e && e.rfStillT > this.t) m += 0.2;
    if (U.hollowcrown && p.hp > this.stat('hp') * 0.9) m += 0.15;
    if (U.twofaces && p.hp >= this.stat('hp') / 2) m += 0.12;
    if (U.lodestone) m += 0.15;
    return m;
  },
  // ---- a kill
  rfOnKill(e) {
    const U = this.rfu(), S = this.rfs(), p = this.player, mult = this.rfMult();
    if (!Object.keys(U).length) return;
    if (U.hexthorn) p.mp = Math.min(this.stat('mp'), p.mp + 15);
    if (U.eclipseshroud) this.decoys.push({ x: p.x, y: p.y, t: 1, max: 1, dmg: 0, n: 0, range: 0, flip: p.dir === 'left', dir: p.dir });   // invisible: they lose you for a second
    if (U.cathedralplate || U.requiem) S.clouds.push({ x: e.x, y: e.y, r: 1.6, until: this.t + (U.requiem ? 2 : 3), burn: Math.round(45 * mult), mine: !!U.cathedralplate, col: '#9a9088' });
    if (U.gourdstaff) S.later.push({ at: this.t + 1, boom: { x: e.x, y: e.y, r: 2, dmg: Math.round(220 * mult) } });
    if (U.hexband && e.curseT > 0) for (let k = 0; k < 6; k++) this.rfShot(...lift(e.x, e.y, 0.5), (k / 6) * TAU, Math.round(60 * mult), 'thornseed', 8, 3, true);
    if (U.bloodsickle && e.burn && e.burn.t > 0) S.haste = this.t + 3;
    if (U.gravesignet && this.allies.filter((a) => a.rfSignet).length < 2)                              // the fallen rises for you
      this.allies.push({ kind: 'thrall', sprite: 'thrall', x: e.x, y: e.y, life: 4, max: 4, cd: 0.3, dmg: Math.round(60 * mult), burst: true, ph: Math.random() * TAU, born: this.t, rfSignet: true });
    if (U.phoenixplumage && e.rb) S.rebirthUsed = false;                                             // Rebirth recharges after a boss
  },
  // ---- a cast
  rfOnAbility() {
    const U = this.rfu(), S = this.rfs(), p = this.player;
    if (!Object.keys(U).length) return;
    if (U.choirrobe) for (const e of this.rfNear(4)) if (!e.rb) { e.slowT = 2; e.slowF = 0.5; }
    if (U.bogrobe) for (const e of this.rfNear(9)) if (e.under) { e.under = false; e.rfRevealT = this.t + 3; }
    if (U.stillrobe && this.rfReady('stillrobe')) { this.rfCool('stillrobe', 12); this.timeStop = { x: p.x, y: p.y, r: 3, t: 1, dur: 1 }; }
    if (U.hourrobe && this.rfReady('rewind')) { const old = S.hist.find((h) => h.t <= this.t - 2); if (old && old.hp > p.hp) { this.rfCool('rewind', 10); p.hp = Math.min(this.stat('hp'), old.hp); this.rfSay('REWIND', '#e3b95a'); } }
    if (U.facetring) S.reflect = { x: p.x, y: p.y, until: this.t + 2 };
    if (U.polaris) { const e = this.rfNear(10).sort((a, b) => d2(a.x, a.y, p.x, p.y) - d2(b.x, b.y, p.x, p.y))[0]; if (e) { S.mark = e; S.markT = this.t + 4; } }
    if (U.wishring) for (const b of this.projectiles) if (b.from === 'e' && d2(b.x, b.y, p.x, p.y) < 4) { b.vx = -b.vx; b.vy = -b.vy; b.a += Math.PI; }   // folded away
    if (U.twofaces && !S.encore) S.later.push({ at: this.t + 1.6, encore: true });
  },
  // an ability's Mana cost (the Unmaking Robe; the Wishing Ring's once-a-dungeon free cast)
  rfAbilityCost(cost) {
    const U = this.rfu(), p = this.player;
    if (U.unmakingrobe) cost = Math.round(cost * 0.9);
    if (U.wishring && p.mp - cost <= 0 && !this.map.rfWish) { this.map.rfWish = true; this.rfSay('WISH', '#ffe680'); return 0; }
    return cost;
  },
  // a stat bonus from what you wear (the Sky Cloak's Starflight, the Blood Sickle's rush)
  rfStat(s) {
    const S = this.player.rfs; if (!S) return 0;
    if (s === 'spd') return (S.starflight > this.t ? 2 : 0) + (S.haste > this.t ? 10 : 0);
    return 0;
  },
  // one of your shots meets a wall: the Prism Wand bounces once and splits
  rfWallHit(b, m) {
    if (!b.rfBounce) return false;
    b.rfBounce = 0;
    const hx = shotBlocked(m, b.x + b.vx * 0.02, b.y - b.vy * 0.02 + 0.3), hy = shotBlocked(m, b.x - b.vx * 0.02, b.y + b.vy * 0.02 + 0.3);   // which way the wall runs
    b.x -= b.vx * 0.02; b.y -= b.vy * 0.02;
    if (hx && !hy) b.vx = -b.vx; else if (hy && !hx) b.vy = -b.vy; else { b.vx = -b.vx; b.vy = -b.vy; }
    b.a = Math.atan2(b.vy, b.vx);
    for (const o of [-0.35, 0.35]) this.rfShot(b.x, b.y, b.a + o, Math.round(b.dmg * 0.5), b.sprite, Math.hypot(b.vx, b.vy), 3, false);
    return true;
  },
  // ---- every frame
  rfTick(dt) {
    const U = this.rfu(), S = this.rfs(), p = this.player, max = this.stat('hp'), mult = this.rfMult();
    // what you did this frame: stood, moved, went unhit
    if (p.moving) { S.still = 0; S.move += dt; } else { S.still += dt; S.move = 0; }
    S.unhit += dt;
    S.hist.push({ t: this.t, hp: p.hp }); while (S.hist.length && S.hist[0].t < this.t - 3) S.hist.shift();
    if (!Object.keys(U).length) { S.clouds.length = 0; return; }
    if (U.hollowcrown && S.lastHp !== undefined && p.hp > S.lastHp && p.hp < max) p.hp = S.lastHp + (p.hp - S.lastHp) * 0.8;   // healing reduced
    if (U.barkplate && S.still >= 1) p.hp = Math.min(max, p.hp + max * 0.03 * dt);                    // Lifebloom
    if (U.gnomonring && S.still >= 1.5) p.abilityT = Math.max(0, p.abilityT - dt * 0.25);              // the Still Hour
    if (U.moonhalo && S.unhit >= 2 && !S.moonlit) { S.moonlit = true; this.rfSay('MOONLIT', '#cfe0ff'); }
    if (U.stormcoat && p.moving) S.charge = Math.min(1, S.charge + dt / 3);
    if (U.skycloak && S.move >= 2 && this.rfReady('starflight')) { this.rfCool('starflight', 15); S.starflight = this.t + 3; S.moonlit = true; this.rfSay('STARFLIGHT', '#cfe0ff'); }
    if (U.ragcoat) p.poisonUntil = 0;                                                                // immune to poison
    if (U.wyrmcoil && p.poisonUntil > this.t) p.hp = Math.min(max, p.hp + 32 * dt);                    // poison heals you instead
    if (U.polaris) { this.invertUntil = 0; }                                                         // your aim never drifts
    if (U.dewring && this.rfReady('dew')) { this.rfCool('dew', 6); p.hp = Math.min(max, p.hp + 60); this.fx.push({ kind: 'ring', ...liftO(p.x, p.y, 0.3), t: 0, max: 3.5, color: '#9ff4ff' }); }
    if (U.seedring && this.rfReady('seed')) { this.rfCool('seed', 8); S.later.push({ at: this.t + 1, sapling: { x: p.x, y: p.y } }); this.fx.push({ kind: 'ring', ...liftO(p.x, p.y, 0.1), t: 0, max: 0.8, color: '#7ab800' }); }
    if (U.escapement && this.rfReady('escape') && this.projectiles.some((b) => b.from === 'e' && d2(b.x, b.y, p.x, p.y) < 9)) { this.rfCool('escape', 15); this.timeStop = { x: p.x, y: p.y, r: 3, t: 1, dur: 1 }; this.rfSay('STOP', '#e3b95a'); }
    if (U.horizonplate) for (const b of this.projectiles) {                                           // enemy shots bend away
      if (b.from !== 'e') continue; const dx = b.x - p.x, dy = b.y - p.y, q = dx * dx + dy * dy; if (q > 2.25 || q < 0.01) continue;
      const s = Math.hypot(b.vx, b.vy), dd = Math.sqrt(q); b.vx += (dx / dd) * 3 * dt; b.vy += (dy / dd) * 3 * dt; const s2 = Math.hypot(b.vx, b.vy); b.vx *= s / s2; b.vy *= s / s2; b.a = Math.atan2(b.vy, b.vx);
    }
    if (U.mirrormail && this.rfReady('mirror')) for (const b of this.projectiles) if (b.from === 'e' && d2(b.x, b.y, ...lift(p.x, p.y, 0.5)) < 0.5) {
      this.rfCool('mirror', 12); b.from = 'p'; b.vx = -b.vx; b.vy = -b.vy; b.a += Math.PI; b.hit = new Set(); this.rfSay('REFLECT', '#e8ffff'); break;
    }
    if (U.rindmail && this.rfReady('taunt')) { this.rfCool('taunt', 10); for (const e of this.rfNear(4)) e.seen = true; this.fx.push({ kind: 'ring', ...liftO(p.x, p.y, 0.3), t: 0, max: 4, color: '#d8a040' }); }
    S.lastHp = p.hp;
    // clouds (ash, burning ground), rifts, trails and things that happen a moment later
    S.clouds = S.clouds.filter((c) => c.until > this.t);
    for (const c of S.clouds) { if ((c.tk = (c.tk || 0) - dt) <= 0) { c.tk = 0.5; for (const e of this.rfNear(c.r, c.x, c.y)) this.ignite(e, c.burn, 2); this.fx.push({ kind: 'ring', ...liftO(c.x, c.y, 0.1), t: 0, max: c.r, color: c.col }); } }
    S.rifts = S.rifts.filter((r) => r.until > this.t);
    for (const r of S.rifts) for (const e of this.rfNear(3, r.x, r.y)) if (!e.rb) { const dd = Math.hypot(r.x - e.x, r.y - e.y) || 1; this.moveCircle(e, (r.x - e.x) / dd * 2.5 * dt, (r.y - e.y) / dd * 2.5 * dt, 0.35); }
    for (const b of this.projectiles) if (b.rfTrail && b.from === 'p') { if ((b.rfTk = (b.rfTk || 0) - dt) <= 0) { b.rfTk = 0.1; S.trails.push({ x: b.x, y: b.y, until: this.t + b.rfTrail.life, T: b.rfTrail, by: b }); } }
    S.trails = S.trails.filter((t) => t.until > this.t);
    for (const t of S.trails) {
      if ((t.tk = (t.tk || 0) - dt) > 0) continue; t.tk = t.T.every;
      for (const e of this.enemiesIn(t.x, t.y + 0.5, 0.5)) { const got = (t.by.rfGot = t.by.rfGot || new Map()), sum = got.get(e) || 0; if (sum >= t.T.cap) continue; got.set(e, sum + t.T.dmg); this.damageEnemy(e, t.T.dmg, ...lift(e.x, e.y, 0.5), true); }
      if (Math.random() < 0.3) this.vx({ k: 'burst', x: t.x, y: t.y, n: 1, colors: [t.T.col] });
    }
    const due = S.later.filter((L) => L.at <= this.t); S.later = S.later.filter((L) => L.at > this.t);
    for (const L of due) {
      if (L.boom) { for (const e of this.rfNear(L.boom.r, L.boom.x, L.boom.y)) this.damageEnemy(e, L.boom.dmg, ...lift(e.x, e.y, 0.5), true); this.vx({ k: 'boom', ...liftO(L.boom.x, L.boom.y, 0.3), r: L.boom.r }); }
      if (L.sapling) { if (d2(L.sapling.x, L.sapling.y, p.x, p.y) < 9) p.hp = Math.min(max, p.hp + 60); this.vx({ k: 'burst', ...liftO(L.sapling.x, L.sapling.y, 0.3), n: 10, colors: ['#7ab800', '#d8ff8a'] }); }
      if (L.hits) {                                                                                   // the Star Bow's constellation
        const pts = [...new Set(L.hits)].filter((e) => !e.dead);
        for (let i = 0; i + 1 < pts.length; i++) {
          const A = pts[i], B = pts[i + 1];
          this.vx({ k: 'zap', ...liftA(A.x, A.y, 0.5), ...liftB(B.x, B.y, 0.5) });
          for (const e of this.enemies) if (!e.dead && this.segNear(A, B, e) < 0.7) this.damageEnemy(e, Math.round(60 * mult), ...lift(e.x, e.y, 0.5), true);
        }
      }
      if (L.encore && !S.encore) { S.encore = true; const id = p.equip[1], A = id && ITEMS[id].ability; if (A) { const mp = p.mp, at = p.abilityT; p.abilityT = 0; p.mp = 9999; this.useAbility(); p.mp = mp; p.abilityT = Math.max(at, p.abilityT); } S.encore = false; }
    }
  },
  segNear(A, B, e) { const vx = B.x - A.x, vy = B.y - A.y, L = vx * vx + vy * vy || 1, t = Math.max(0, Math.min(1, ((e.x - A.x) * vx + (e.y - A.y) * vy) / L)); return Math.hypot(A.x + vx * t - e.x, A.y + vy * t - e.y); },
};
export function installUniqMech(Game) { Object.assign(Game.prototype, methods); }
