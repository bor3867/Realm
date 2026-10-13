// Orbiters: things that circle you, given by dungeon items (src/data/dungeon_items.js). One set per item:
//   { kind: 'body' | 'hole', n, r (tiles), w (rad/s), dmg (a touch, scaled by your Attack), sprite, scale,
//     block: { n, rest }  each one swallows up to n enemy shots, then fades for `rest` seconds and comes back
//     pull               a black hole drags ordinary monsters within this many tiles toward it
//     fire: { every, proj, dmg, speed, range, n }  each one throws a shot straight at the nearest enemy in range
//     slow, burn, heal   what a touch does besides damage }
// From a ring or armour (passive.orbit) they are always there; from an ability (signature kind 'orbit') for `life` s.
// Nothing they fire turns after it leaves (no seeking).
import { lift, liftO, angleUp } from './util.js';
import { ITEMS } from './data/items.js';
import { dmgMult } from './data/classes.js';

const TAU = Math.PI * 2;

const methods = {
  // the sets you wear (rebuilt when your equipment changes), plus any summoned ones still alive
  orbSets() {
    const p = this.player, key = p.equip.join('|');
    if (p.orbKey !== key) {
      p.orbKey = key;
      p.orbWorn = p.equip.map((id) => id && ITEMS[id] && ITEMS[id].passive && ITEMS[id].passive.orbit).filter(Boolean).map((O) => this.orbMake(O, 0));
    }
    p.orbCast = (p.orbCast || []).filter((S) => S.until > this.t);
    return [...p.orbWorn, ...p.orbCast];
  },
  orbMake(O, life) {
    const sets = Array.isArray(O) ? O : [O];
    return sets.map((Q) => ({ O: Q, until: life ? this.t + life : Infinity, born: this.t, a0: Math.random() * TAU,
      bodies: Array.from({ length: Q.n || 1 }, (_, k) => ({ k, x: 0, y: 0, eaten: 0, rest: 0, fire: (Q.fire ? Q.fire.every : 0) * (0.3 + k / (Q.n || 1)), hit: new Map() })) }));
  },
  orbSummon(S) {                                   // an ability's signature: its orbiters come for `life` seconds
    const p = this.player;
    p.orbCast = [...(p.orbCast || []), ...this.orbMake(S.sets, S.life || 8)];
    this.vx({ k: 'burst', ...liftO(p.x, p.y, 0.6), n: 20, colors: ['#ffd690', '#c8a0ff', '#ffffff'] });
  },
  updateOrbs(dt) {
    const p = this.player;
    if (p.dead || this.mode !== 'play') { p.orbsLive = []; return; }
    const live = [], mult = dmgMult(this.stat('att'));
    for (const set of this.orbSets().flat()) {
      const O = set.O, n = set.bodies.length;
      for (const B of set.bodies) {
        const a = set.a0 + this.t * (O.w || 2) + (B.k / n) * TAU;
        const [ocx, ocy] = lift(p.x, p.y, 0.5); B.x = ocx + Math.cos(a) * O.r; B.y = ocy + Math.sin(a) * O.r;   // round your chest, whatever the camera B.a = a + (O.w < 0 ? -1 : 1) * Math.PI / 2;
        B.rest = Math.max(0, B.rest - dt);
        live.push({ B, O, set });
        if (B.rest > 0) continue;
        // a touch: damage (and what else it does), each monster at most every 0.4 s
        for (const e of this.enemiesIn(...lift(B.x, B.y, -0.5), O.kind === 'hole' ? 0.8 : 0.6)) {
          if (e.dead || (B.hit.get(e) || 0) > this.t) continue;
          B.hit.set(e, this.t + 0.4);
          this.damageEnemy(e, Math.round((O.dmg || 80) * mult), ...lift(e.x, e.y, 0.5), false);
          if (O.slow && e !== this.boss) { e.slowT = 1; e.slowF = Math.max(e.slowF || 0, O.slow); }
          if (O.burn) this.ignite(e, Math.round(O.burn * mult), 2);
          if (O.heal) p.hp = Math.min(this.stat('hp'), p.hp + O.heal);
        }
        // a black hole drags the small fry toward it
        if (O.pull) for (const e of this.enemiesIn(B.x, B.y, O.pull)) {
          if (e.dead || e.rb || e.warden || e.D.speed === 0) continue;
          const d = Math.hypot(B.x - e.x, B.y - e.y) || 1;
          this.moveCircle(e, ((B.x - e.x) / d) * 1.6 * dt, ((B.y - e.y) / d) * 1.6 * dt, 0.35);
        }
        // shots that touch it are swallowed, up to its limit, then it rests
        if (O.block) {
          const rr = O.kind === 'hole' ? 0.75 : 0.45;
          for (const b of this.projectiles) {
            if (b.from === 'p' || b.life <= 0 || b.ghost || b.hidden) continue;
            if (Math.abs(b.x - B.x) > rr + 0.4 || Math.abs(b.y - B.y) > rr + 0.4 || Math.hypot(b.x - B.x, b.y - B.y) > rr + (b.r || 0.3) * 0.6) continue;
            b.life = 0;
            this.vx({ k: 'burst', x: b.x, y: b.y, n: 4, colors: O.kind === 'hole' ? ['#c8a0ff', '#05040a'] : ['#ffffff', '#ffd690'] });
            if (++B.eaten >= O.block.n) { B.eaten = 0; B.rest = O.block.rest; break; }
          }
        }
        // it throws a shot at the nearest monster in range (straight: it never turns)
        if (O.fire && (B.fire -= dt) <= 0) {
          B.fire = O.fire.every;
          let best = null, bd = O.fire.range || 6;
          for (const e of this.enemiesIn(B.x, B.y, bd)) { const d = Math.hypot(e.x - B.x, e.y - B.y); if (!e.dead && d < bd) { bd = d; best = e; } }
          if (best) {
            const a0 = angleUp(B.x, B.y, best.x, best.y, 0.5), k = O.fire.n || 1;
            for (let j = 0; j < k; j++) this.shoot('p', B.x, B.y, a0 + (j - (k - 1) / 2) * 0.18, O.fire.speed || 10, O.fire.range || 6, Math.round(O.fire.dmg * mult), O.fire.proj, 0.42, false);
          }
        }
      }
    }
    p.orbsLive = live;
  },
};
export function installOrbiters(Game) { Object.assign(Game.prototype, methods); }
