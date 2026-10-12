// The Priest's special Halos (item rework, realm_505_item_rework_blueprint.md), mixed into Game like weaponmech.js. The
// tiered Halos keep the falling gold-white pillar (game.useAbility); each UT and Mythic Halo replaces it with a shape of
// its own, set in its item's ability.halo (src/data/ability_rework.js). Their healing comes through that shape, so
// where you stand matters. Every piece is an fx entry ({ kind: 'halo', h }) ticked here and drawn by render.haloFx.
//   sunrise   three sigils fan out ahead of you: each sends one healing wave and one crescent
//   bell      a thrown bell rings twice: the first ring heals you if you are near it, the second stuns and weakens
//   rose      a rose sigil shatters into three crescents: red burns, blue slows, gold flies home and heals
//   aureole   a bitten ring closes on an enemy and drains it; when it ends, healing fragments fly back to you
//   horizon   a wall of daylight sweeps across the line you aim down, judging every enemy it touches
//   orrery    (the item's orbiting planets) and a healing pulse at the end of each orbit
//   sun       a black sun pulses eclipse rings that scorch enemies and heal and shield you; then a corona
//   wick      a planted flame turns out three tongues of fire; standing near it warms you back to health
const TAU = Math.PI * 2;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

const methods = {
  // returns true when the Halo's own shape was cast (the pillar is skipped)
  haloCast(A, mult, aim, tgt) {
    const H = A.halo, p = this.player, B = A.burst, dmg = Math.round(B.dmg * mult * (H.f || 1)), add = (o) => this.fx.push({ kind: 'halo', t: 0, ...o });
    const [cx, cy] = this.up(p.x, p.y, 0.5);
    switch (H.kind) {
      case 'sunrise':
        for (let k = -1; k <= 1; k++) { const a = aim + k * 0.6; add({ h: 'sigil', x: p.x + Math.cos(a) * 2.2, y: p.y + Math.sin(a) * 2.2, a, life: 0.9, at: 0.3 + (k + 1) * 0.08, dmg, heal: Math.round(H.heal / 3), proj: H.proj }); }
        break;
      case 'bell': { const at = tgt(7); add({ h: 'bell', x: at.x, y: at.y, life: 1.45, dmg, heal: H.heal, r: H.r }); break; }
      case 'rose': { const at = tgt(7); add({ h: 'rose', x: at.x, y: at.y, a: aim, life: 0.45, dmg, heal: H.heal, burn: Math.round(dmg * 0.3), proj: H.proj }); break; }
      case 'aureole': {
        const at = tgt(7);
        let e = null, bd = 3.2 * 3.2;
        for (const o of this.active || this.enemies) { if (o.dead || (o.D && o.D.dummy && this.map.kind === 'nexus')) continue; const d2 = (o.x - at.x) ** 2 + (o.y - at.y) ** 2; if (d2 < bd) { bd = d2; e = o; } }
        add({ h: 'aureole', e, x: e ? e.x : at.x, y: e ? e.y : at.y, life: e ? 3 : 0.05, tick: 0, dmg: Math.round(dmg / 12), heal: H.heal });
        break;
      }
      case 'horizon': {
        const [hx, hy] = [cx, cy];
        add({ h: 'horizon', x: hx, y: hy, a: aim, w: H.w, d: 0, speed: 9, range: H.range, life: H.range / 9 + 0.2, hit: new Set(), dmg });
        const h = Math.min(H.heal, this.stat('hp') - p.hp); p.hp += h; if (h > 0) this.float(p.x, p.y - 1.4, `+${Math.round(h)}`, '#3ac85a');
        p.abilityT = Math.max(p.abilityT, H.lock || 0);       // its longer recovery
        break;
      }
      case 'orrery': add({ h: 'orrery', x: p.x, y: p.y, life: H.life, every: H.every, next: H.every, heal: H.heal, r: 2.6 }); break;
      case 'sun': { const at = tgt(6); add({ h: 'sun', x: at.x, y: at.y, life: 2.7, pulses: [0.35, 1.05, 1.75].map((t0) => ({ t0, hit: new Set(), healed: false })), dmg, heal: Math.round(H.heal / 3), corona: Math.round(dmg * 0.6), proj: H.proj, burn: Math.round(dmg * 0.25) }); break; }
      case 'wick': { const at = tgt(6); add({ h: 'wick', x: at.x, y: at.y, life: H.life, cd: 0.2, rot: aim, dmg, regen: H.regen, proj: H.proj }); break; }
      default: return false;
    }
    this.vx({ k: 'burst', x: cx, y: cy, n: 10, colors: ['#ffeb8f', '#fffdf0'] });
    return true;
  },
  haloHeal(n, x, y) {
    const p = this.player, h = Math.min(n, this.stat('hp') - p.hp);
    if (h <= 0) return;
    p.hp += h; this.float(p.x, p.y - 1.4, `+${Math.round(h)}`, '#3ac85a');
    this.fx.push({ kind: 'ring', x: x ?? p.x, y: (y ?? p.y) - 0.3, t: 0, max: 1.2, color: '#9aff9a' });
  },
  // every frame: each Halo's shape plays out
  haloTick(dt) {
    const p = this.player, near = (f, r) => dist(p.x, p.y, f.x, f.y) <= r;
    for (const f of this.fx) {
      if (f.kind !== 'halo') continue;
      switch (f.h) {
        case 'sigil':
          if (!f.done && f.t >= f.at) {
            f.done = true;
            if (near(f, 3)) this.haloHeal(f.heal, f.x, f.y);
            this.fx.push({ kind: 'ring', x: f.x, y: f.y - 0.3, t: 0, max: 3, color: '#ffeb8f' });
            const [ox, oy] = this.up(f.x, f.y, 0.5);
            const b = this.shoot('p', ox, oy, f.a, 11, 6, f.dmg, f.proj || 'pj_dawnray', 0.5, true); b.child = true;
          }
          break;
        case 'bell':
          if (!f.rang1 && f.t >= 0.35) { f.rang1 = true; this.fx.push({ kind: 'ring', x: f.x, y: f.y - 0.3, t: 0, max: f.r, color: '#9aff9a' }); if (near(f, f.r)) this.haloHeal(f.heal, f.x, f.y); }
          if (!f.rang2 && f.t >= 0.95) {
            f.rang2 = true; this.fx.push({ kind: 'ring', x: f.x, y: f.y - 0.3, t: 0, max: f.r + 0.5, color: '#e8b04a' });
            for (const e of this.enemiesIn(f.x, f.y, f.r + 0.5)) {
              this.damageEnemy(e, f.dmg, e.x, e.y - 0.5, true);
              e.curseF = Math.max(e.curseT > 0 ? e.curseF || 0 : 0, 0.15); e.curseT = Math.max(e.curseT || 0, 4);
              if (e !== this.boss && !e.rb) this.stun(e, 0.6);
            }
            this.vx({ k: 'shake', amt: 1 });
          }
          break;
        case 'rose':
          if (!f.done && f.t >= 0.3) {
            f.done = true;
            const [ox, oy] = this.up(f.x, f.y, 0.5);
            const red = this.shoot('p', ox, oy, f.a, 10, 5, Math.round(f.dmg * 1.2), f.proj || 'beacon', 0.5, true); red.child = true; red.sp = { burn: { dps: f.burn, t: 3 } };
            const blue = this.shoot('p', ox, oy, f.a + TAU / 3, 10, 5, f.dmg, f.proj || 'beacon', 0.5, true); blue.child = true; blue.sp = { slow: { f: 0.4, t: 2.5 } };
            this.fx.push({ kind: 'halo', h: 'mote', x: f.x, y: f.y, t: 0, life: 3, heal: f.heal, gold: true });   // the gold one comes home
          }
          break;
        case 'aureole': {
          const e = f.e;
          if (e && !e.dead && f.t < f.life) {
            f.x = e.x; f.y = e.y; f.tick -= dt;
            if (f.tick <= 0) { f.tick = 0.25; this.damageEnemy(e, f.dmg, e.x, e.y - 0.5, true); }
          }
          if (!f.done && (!e || e.dead || f.t >= f.life - 0.05)) {   // it ends: the fragments fly home
            f.done = true; f.life = f.t + 0.05;
            for (let k = 0; k < 5; k++) this.fx.push({ kind: 'halo', h: 'mote', x: f.x + Math.cos(k * 1.3) * 0.6, y: f.y + Math.sin(k * 1.3) * 0.6, t: 0, life: 3, heal: Math.round(f.heal * (e ? 1 : 0.5) / 5), delay: k * 0.06 });
          }
          break;
        }
        case 'mote': {                                          // a healing fragment flying back to you
          if (f.t < (f.delay || 0)) break;
          const d = dist(f.x, f.y, p.x, p.y - 0.5), s = Math.min(d, 9 * dt);
          if (d < 0.35) { if (!f.done) { f.done = true; f.life = 0; this.haloHeal(f.heal); if (f.gold) p.status.invuln = Math.max(p.status.invuln || 0, 0.5); } break; }
          f.x += ((p.x - f.x) / d) * s; f.y += ((p.y - 0.5 - f.y) / d) * s;
          break;
        }
        case 'horizon': {
          f.d = Math.min(f.range, f.d + f.speed * dt);
          const ca = Math.cos(f.a), sa = Math.sin(f.a);
          for (const e of this.active || this.enemies) {
            if (e.dead || f.hit.has(e)) continue;
            const dx = e.x - f.x, dy = e.y - 0.5 - f.y, along = dx * ca + dy * sa, side = -dx * sa + dy * ca;
            if (Math.abs(along - f.d) < 0.6 && Math.abs(side) <= f.w / 2) {
              f.hit.add(e);
              this.damageEnemy(e, f.dmg, e.x, e.y - 0.5);
              e.curseF = Math.max(e.curseT > 0 ? e.curseF || 0 : 0, 0.2); e.curseT = Math.max(e.curseT || 0, 4);   // judged
            }
          }
          break;
        }
        case 'orrery':
          f.x = p.x; f.y = p.y; f.next -= dt;
          if (f.next <= 0) { f.next = f.every; this.fx.push({ kind: 'ring', x: p.x, y: p.y - 0.3, t: 0, max: f.r, color: '#e8c87a' }); this.haloHeal(f.heal); }
          break;
        case 'sun':
          for (const P of f.pulses) {
            if (f.t < P.t0) continue;
            const r = (f.t - P.t0) * 5;
            if (r > 3.6) continue;
            for (const e of this.enemiesIn(f.x, f.y, r)) if (!P.hit.has(e)) { P.hit.add(e); this.damageEnemy(e, f.dmg, e.x, e.y - 0.5, true); this.ignite(e, f.burn, 2); }
            if (!P.healed && dist(p.x, p.y, f.x, f.y) <= r) { P.healed = true; this.haloHeal(f.heal); p.status.armored = Math.max(p.status.armored || 0, 1.2); }
          }
          if (!f.corona && f.t >= 2.5) {                         // the corona: one ring of shots outward
            f.corona = true;
            const [ox, oy] = this.up(f.x, f.y, 0.5);
            for (let k = 0; k < 12; k++) { const b = this.shoot('p', ox, oy, (k / 12) * TAU, 9, 4, f.corona, f.proj || 'lance', 0.5, true); b.child = true; }
            this.vx({ k: 'burst', x: f.x, y: f.y, n: 16, colors: ['#ffd650', '#1a1018', '#fff2a8'] });
          }
          break;
        case 'wick':
          f.cd -= dt;
          if (f.cd <= 0) {
            f.cd = 0.5; f.rot += 0.5;
            const [ox, oy] = this.up(f.x, f.y, 0.3);
            for (let k = 0; k < 3; k++) { const b = this.shoot('p', ox, oy, f.rot + (k / 3) * TAU, 6, 3, f.dmg, f.proj || 'corpseflame', 0.45, true); b.child = true; }
          }
          if (near(f, 2.5)) { p.hp = Math.min(this.stat('hp'), p.hp + f.regen * dt); f.warm = true; } else f.warm = false;
          break;
      }
    }
  },
};
export function installHalos(Game) { Object.assign(Game.prototype, methods); }
