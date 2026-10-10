// Hollowmoon Carnival's own systems (docs/design/dungeon_hollowmoon.md), mixed into Game like frostveil.js.
//   spin tiles   handled in the movement code: your input turns a quarter-turn while you stand on one
//   cannons      every 4 s a cannon near you swings to you, shows its line, and fires a boxing glove that bounces once
//   strikers     shoot one and the bell rings: every monster nearby comes to it for a while
//   crates       some are jack-in-the-boxes: shoot one and it springs out
//   the carousel its horses ride round the hub until you step into the ring; then they break off and charge
//   ghouls       balloon ghouls drift through the canvas and pop into confetti and coins
export const FAIR = { cannonEvery: 4, cannonTell: 1.2, cannonR: 16, lure: 14, lureT: 4 };
const TAU = Math.PI * 2;

const methods = {
  updateHollowmoon(dt) {
    const m = this.map, p = this.player;
    if (!m.hmCannons) m.hmCannons = m.objects.filter((o) => o.hmCannon);
    for (const o of m.hmCannons) {                             // the cannons
      const C = o.hmCannon;
      if (Math.hypot(o.x - p.x, o.y - p.y) > FAIR.cannonR || p.dead) { C.aim = null; continue; }
      C.t -= dt;
      if (C.aim === null || C.aim === undefined) { if (C.t <= FAIR.cannonTell) C.aim = Math.atan2(p.y - o.y, p.x - o.x); }
      else if (C.t <= 0) {
        const b = this.shoot('e', o.x, o.y - 0.4, C.aim, 9, 15, 110, 'd2_projectiles/hollowmoon.boxing_glove', 0.5, false, 'a circus cannon');
        b.bounce = 1; C.aim = null; C.t = FAIR.cannonEvery;
        this.vx({ k: 'regfx', key: 'd2_effects/hollowmoon.smoke_puff', x: o.x + Math.cos(b.a) * 0.6, y: o.y - 0.4 + Math.sin(b.a) * 0.6, fps: 12 });
      }
    }
    const H = m.hmCarousel;                                    // the carousel: step into the ring and the horses break off
    if (H && !H.on && Math.hypot(p.x - H.cx, p.y - H.cy) < H.r + 4) {
      H.on = true;
      for (const e of this.enemies) if (e.id === 'carousel_horse' && !e.dead && Math.hypot(e.x - H.cx, e.y - H.cy) < 12) { e.loose = true; this.vx({ k: 'burst', x: e.x, y: e.y - 0.8, n: 6, colors: ['#ffd650', '#ffffff'] }); }
      this.banner('The horses break off their poles!', 2000); this.sfx('boss');
    }
  },
  // a shot hits a striker (the bell rings) or a crate (it breaks, or a jack springs out)
  hitFair(o) {
    const m = this.map;
    if (o.hmStriker) {
      if (this.t - (o.ringT || -9) < 1) return;
      o.ringT = this.t;
      this.float(o.x, o.y - 2.2, 'DING!', '#ffd650'); this.sfx('rare');
      for (const e of this.enemies) if (!e.dead && !e.rb && Math.hypot(e.x - o.x, e.y - o.y) < FAIR.lure) { e.lureTo = { x: o.x, y: o.y + 1, until: this.t + FAIR.lureT }; e.seen = true; }
      return;
    }
    m.objects.splice(m.objects.indexOf(o), 1); m.solid[Math.floor(o.y) * m.w + Math.floor(o.x)] = 0; m.ogridDirty = true;
    if (o.jack) {
      this.vx({ k: 'regfx', key: 'd2_effects/hollowmoon.smoke_puff', x: o.x, y: o.y - 0.4, fps: 12 });
      const e = this.addEnemy('jack_in_the_box', o.x, o.y); e.hp = e.maxHp = Math.round(e.hp * (m.def.mobHp || 1)); e.seen = true; e.born = this.t;
      this.float(o.x, o.y - 1.2, 'SURPRISE!', '#ff8fbf');
    } else {
      this.vx({ k: 'burst', x: o.x, y: o.y - 0.4, n: 8, colors: ['#8a6a48', '#5a4030', '#c8a070'] });
      if (Math.random() < 0.35) { const g0 = 4 + Math.floor(Math.random() * 8); this.save.gold = (this.save.gold || 0) + g0; this.float(o.x, o.y - 1, `+${g0}g`, '#f2c14e'); this.sfx('coin'); }
    }
  },
  // a carousel horse: on its pole it rides the circle; let loose it gallops round and swings out at you
  hmHorse(e, dt, aggro) {
    const H = this.map.hmCarousel, p = this.player;
    if (!H) return false;
    e.ca = e.ca === undefined ? Math.atan2(e.y - H.cy, e.x - H.cx) : e.ca;
    let r = H.r, w = 0.5;
    if (e.loose) {
      w = 1.3;
      e.swing = (e.swing || 0) - dt;
      if (e.swing <= 0 && !e.out && aggro) { e.out = 1.2; e.swing = 3 + Math.random() * 2; }
      if (e.out > 0) { e.out -= dt; const toP = Math.hypot(p.x - H.cx, p.y - H.cy); r = H.r + (toP - H.r) * Math.sin(Math.PI * Math.max(0, 1 - e.out / 1.2)); }
    }
    e.ca += w * dt;
    const tx = H.cx + Math.cos(e.ca) * r, ty = H.cy + Math.sin(e.ca) * r;
    this.moveCircle(e, (tx - e.x) * Math.min(1, dt * 8), (ty - e.y) * Math.min(1, dt * 8), 0.35);
    e.face = Math.sin(e.ca) * w > 0;
    return true;
  },
};

export function installHollowmoon(Game) { Object.assign(Game.prototype, methods); }
void TAU;
