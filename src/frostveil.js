// Frostveil Hollows' own systems (docs/design/dungeon_frostveil.md), mixed into Game like dungeons4.js.
//   chill    a 0-100 meter: frigid water and frost shots raise it, lit frost braziers melt it off; it slows your feet
//            and your hands, and at 100 you freeze solid for a moment
//   gust     Glacius' wing beat pushes you; on ice, you keep going
//   freeze   ground that turns to ice for a while (Glacius' lances), then thaws back to what it was
//   the Hall of the Frozen: crossing its middle wakes the statues that were really sentinels
import { TID, SK, SKIN_TID } from './world/maps.js';

export const CHILL = { water: 40, drain: 6, warm: 35, warmR: 2.5, slow: 0.35, freezeT: 1.2, after: 40 };

const methods = {
  addChill(n) {
    const p = this.player, P = this.passive();
    if (p.dead || p.frozenUntil > this.t) return;
    p.chill = Math.min(100, (p.chill || 0) + n);
    if (p.chill >= 100 && !P.nofreeze) {                       // frozen solid: then you shatter out of it
      p.frozenUntil = this.t + CHILL.freezeT; p.chill = CHILL.after;
      this.vx({ k: 'burst', x: p.x, y: p.y - 0.5, n: 16, colors: ['#ffffff', '#cfffff', '#8ad8ff'] });
      this.banner('Frozen solid!', 1200); this.sfx('hurt');
    }
  },
  // how much the cold slows your feet and your hands (1 = not at all)
  chillSlow() {
    const p = this.player;
    if (!p.chill || this.passive().noslow) return 1;
    return 1 - CHILL.slow * (p.chill / 100);
  },
  updateChill(dt) {
    const p = this.player, m = this.map;
    if (p.frozenUntil && this.t >= p.frozenUntil && !p.thawed) { p.thawed = true; this.vx({ k: 'burst', x: p.x, y: p.y - 0.5, n: 12, colors: ['#ffffff', '#cfffff'] }); }
    if (p.frozenUntil > this.t) p.thawed = false;
    const under = m.tiles[Math.floor(p.y) * m.w + Math.floor(p.x)];
    if (under === TID.fvwater && !p.dead) this.addChill(CHILL.water * dt);
    if (!p.chill) return;
    let drain = CHILL.drain;
    p.warmBy = null;
    if (m.fvBraziers) for (const o of m.fvBraziers) if (o.lit && Math.hypot(o.x - p.x, o.y - p.y) < CHILL.warmR) { drain = CHILL.warm; p.warmBy = o; break; }
    if (under !== TID.fvwater) p.chill = Math.max(0, p.chill - drain * dt);
  },
  // ---------------------------------------------------------------- per frame in Frostveil
  updateFrostveil(dt) {
    const m = this.map, p = this.player;
    if (!m.fvBraziers) m.fvBraziers = m.objects.filter((o) => o.fvBrazier);
    for (const T of m.fvTimers || []) if ((T.t -= dt) <= 0 && !T.done) { T.done = true; T.fn(); }
    if (m.fvTimers) m.fvTimers = m.fvTimers.filter((T) => !T.done);
    // the Hall of the Frozen: cross its middle third and the false statues wake
    const H = m.fvHall;
    if (H && !H.woke && p.x > H.x0 && p.x < H.x1 && p.y > H.y0 && p.y < H.y1) {
      H.woke = true;
      for (const o of m.objects.filter((q) => q.fvStatue && q.sentinel)) {
        m.objects.splice(m.objects.indexOf(o), 1);
        m.solid[Math.floor(o.y) * m.w + Math.floor(o.x)] = 0;
        const e = this.addEnemy('glacial_sentinel', o.x, o.y + 0.6);
        e.hp = e.maxHp = Math.round(e.hp * (m.def.mobHp || 1)); e.seen = true;
        this.vx({ k: 'burst', x: o.x, y: o.y - 0.6, n: 18, colors: ['#ffffff', '#cfffff', '#8ad8ff', '#4e6670'] });
      }
      m.ogridDirty = true;
      this.banner('The statues are moving!', 2200); this.vx({ k: 'shake', amt: 4 }); this.sfx('boss');
    }
  },
  fvLater(t, fn) { (this.map.fvTimers = this.map.fvTimers || []).push({ t, fn }); },
  // a patch of ground freezes over for a while (snow becomes ice), then thaws back
  fvFreeze(x, y, r, dur) {
    const m = this.map, was = [];
    for (let yy = Math.floor(y) - r; yy <= Math.floor(y) + r; yy++) for (let xx = Math.floor(x) - r; xx <= Math.floor(x) + r; xx++) {
      const i = yy * m.w + xx;
      if (m.tiles[i] !== TID.fvsnow) continue;
      was.push([i, m.skin ? m.skin[i] : 0]);
      m.tiles[i] = TID.fvice; if (m.skin) m.skin[i] = SK.frostveil_ice;
    }
    if (!was.length) return;
    this.vx({ k: 'burst', x, y, n: 8, colors: ['#ffffff', '#cfffff'] });
    this.fvLater(dur, () => { for (const [i, sk] of was) if (m.tiles[i] === TID.fvice) { m.tiles[i] = TID.fvsnow; if (m.skin) m.skin[i] = SKIN_TID[sk] === TID.fvsnow ? sk : SK.frostveil_snow_a; } });
  },
  // a brazier goes out: no more warmth, no more light
  fvSnuff(o) {
    const m = this.map;
    o.lit = false; o.unlit = true;
    if (o.light && m.lights) m.lights = m.lights.filter((L) => L !== o.light);
    m.lightsDirty = true;
    this.vx({ k: 'burst', x: o.x, y: o.y - 0.6, n: 14, colors: ['#ffffff', '#cfffff', '#3a3a4a'] });
  },
};

export function installFrostveil(Game) { Object.assign(Game.prototype, methods); }
