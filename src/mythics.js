// The Mythic abilities (item rework, realm_505_item_rework_blueprint.md): each has a mechanic of its own, mixed into
// Game like sigils.js. ability.myth = { kind, f (damage, times the burst's dmg and your ATT), ...its numbers }.
// mythCast returns true when it replaces the class ability, false when it adds to it (footprints, page13).
//   footprints  (bellows)   the charge leaves three glowing anvil prints; if it struck anything, all three burst at once
//   greatanvil  (seal)      a colossal anvil's shadow, a long warning, one strike that pins, and four cross shards
//   kings       (reliquary) two slow ancestral knights; a kill by one crowns the other for one far stronger blow
//   jaw         (hookline)  a great jaw thrown in an arc: it closes, drags the small things in, then a foam cone
//   twins       (mirror)    the step leaves two reflections; the first shot that strikes each comes back mirrored
//   stormeye    (kite)      a fixed eye: shots die in its calm centre while three bolts wheel round outside it
//   spring      (stopwatch) a broken spring swallows the shots around you, then fires one back for each (capped)
//   oathrunes   (runeward)  three linked runes soak shots; when the last one breaks, a broad counter-slash
//   page13      (hex)       the hex as always; a hexed enemy that dies passes it on once, to up to three near it
import { lift, liftO, liftA, liftB, angleUp } from './util.js';
const TAU = Math.PI * 2;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

const methods = {
  mythCast(A, mult, aim, tgt) {
    const M = A.myth, p = this.player, B = A.burst, dmg = Math.round(Math.max(60, B.dmg) * mult * (M.f || 1)), add = (o) => this.fx.push({ kind: 'myth', t: 0, ...o });
    const [cx, cy] = this.up(p.x, p.y, 0.5);
    switch (M.kind) {
      case 'footprints': p.mythFoot = { dmg, r: M.r, prints: [], D: null }; return false;   // (the usual charge runs; mythTick follows it)
      case 'greatanvil': {
        const at = tgt(7);
        this.fx.push({ kind: 'anvil', x: at.x, y: at.y, t: 0, life: M.warn + 0.4, delay: M.warn, r: M.r, dmg, stun: M.pin, done: false });
        add({ h: 'cross', x: at.x, y: at.y, life: M.warn + 0.05, at: M.warn, a: aim, dmg: Math.round(dmg * 0.4) });
        return true;
      }
      case 'kings':
        for (let k = 0; k < 2; k++) {
          const a = aim + (k ? 1 : -1) * 1.2;
          this.allies.push({ kind: 'thrall', sprite: A.summon || 'thrall_gilded', x: p.x + Math.cos(a) * 1.2, y: p.y + Math.sin(a) * 1.2, life: M.life, max: M.life, cd: 0.4 + k * 0.2,
            dmg, cleave: true, ph: k * 3, born: this.t, king: true, speed: M.speed });
        }
        this.fx.push({ kind: 'ring', ...liftO(p.x, p.y, 0.4), t: 0, max: 2, color: '#ffd650' });
        return true;
      case 'jaw': { const at = tgt(M.range); add({ h: 'jaw', x: cx, y: cy, x0: cx, y0: cy, ...liftB(at.x, at.y, 0.5), life: M.fly + 0.2, at: M.fly, a: aim, dmg, r: M.r }); return true; }
      case 'twins': {
        const sx = p.x, sy = p.y, at = tgt(6.5);
        let x = sx, y = sy;
        for (let i = 1; i <= 26; i++) { const nx = sx + (at.x - sx) * i / 26, ny = sy + (at.y - sy) * i / 26; if (this.blockedAt(nx, ny)) break; x = nx; y = ny; }
        const perp = aim + Math.PI / 2;
        for (const [dx, dy] of [[0, 0], [Math.cos(perp) * 2, Math.sin(perp) * 2]]) {
          this.decoys.push({ x: sx + dx, y: sy + dy, t: A.decoy, max: A.decoy, dmg: Math.round(B.dmg * mult), n: B.count, range: B.range, flip: p.dir === 'left', dir: p.dir, mirror: { ready: true, dmg } });
        }
        this.vx({ k: 'burst', ...liftO(p.x, p.y, 0.5), n: 20, colors: ['#ffffff', '#cfe8ff', '#8ab4d8'] });
        for (let i = 0; i < 26; i++) this.moveCircle(p, (x - sx) / 26, (y - sy) / 26, 0.32);
        p.status.invuln = Math.max(p.status.invuln, 0.3);
        return true;
      }
      case 'stormeye': {
        for (const f of this.fx) if (f.kind === 'myth' && f.h === 'eye') f.life = 0;      // recast: it moves
        const at = tgt(6); add({ h: 'eye', x: at.x, y: at.y, life: M.life, calm: M.calm, ring: M.ring, rot: aim, cd: 0, dmg });
        return true;
      }
      case 'spring': add({ h: 'spring', x: p.x, y: p.y, life: M.hold + 0.4, hold: M.hold, r: M.r, cap: M.cap, n: 0, dmg }); return true;
      case 'oathrunes': add({ h: 'oath', x: p.x, y: p.y, life: M.life, rot: 0, runes: [0, 1, 2].map((k) => ({ a: (k / 3) * TAU, hp: M.soak })), a: aim, dmg, slashes: M.slashes, proj: B.proj }); return true;
      case 'page13': {
        const at = tgt(7.5), C = A.curse;
        for (const e of this.enemiesIn(at.x, at.y, C.r)) e.page13 = 1;
        return false;                                                   // (the usual hex runs)
      }
    }
    return false;
  },
  // every frame
  mythTick(dt) {
    const p = this.player;
    const F = p.mythFoot;
    if (F) {                                                            // following the Unbroken Bellows' charge
      if (!F.D && p.dash) { F.D = p.dash; F.t0 = this.t; F.len = p.dash.t; }
      if (F.D) {
        const k = (this.t - F.t0) / F.len;
        if (F.prints.length < 3 && k >= (F.prints.length + 1) * 0.25) { const pr = { kind: 'myth', h: 'print', x: p.x, y: p.y, t: 0, life: 2.5 }; F.prints.push(pr); this.fx.push(pr); }
        if (!p.dash) {                                                  // the charge is over
          if (F.D.hit.size) for (const pr of F.prints) {                // it struck home: the forge-front, all at once
            for (const e of this.enemiesIn(pr.x, pr.y, F.r)) this.damageEnemy(e, F.dmg, ...lift(e.x, e.y, 0.5));
            this.vx({ k: 'boom', x: pr.x, y: pr.y, r: F.r }); pr.life = 0;
          }
          p.mythFoot = null;
        }
      }
    }
    const shotsNear = (x, y, r) => this.projectiles.filter((b) => b.from === 'e' && !b.harmless && b.life > 0 && (b.x - x) ** 2 + (b.y - y) ** 2 < r * r);
    for (const f of this.fx) {
      if (f.kind !== 'myth') continue;
      switch (f.h) {
        case 'cross':
          if (!f.done && f.t >= f.at) { f.done = true; for (let k = 0; k < 4; k++) { const b = this.shoot('p', ...lift(f.x, f.y, 0.5), f.a + k * Math.PI / 2, 9, 3, f.dmg, 'hammerlet', 0.45, true); b.child = true; } }
          break;
        case 'jaw': {
          const k = Math.min(1, f.t / f.at);
          f.x = f.x0 + (f.x1 - f.x0) * k; f.y = f.y0 + (f.y1 - f.y0) * k - Math.sin(Math.PI * k) * 2.5;   // the arc
          if (!f.done && k >= 1) {
            f.done = true;
            const x = f.x1, y = f.y1 + 0.5;
            for (const e of this.enemiesIn(x, y, f.r)) {
              if (e !== this.boss && !e.rb && !(e.D && e.D.dummy)) { const d = dist(e.x, e.y, x, y) || 1, s = Math.min(d - 0.4, 2.4); if (s > 0) this.moveCircle(e, ((x - e.x) / d) * s, ((y - e.y) / d) * s, 0.35); }
              this.damageEnemy(e, Math.round(f.dmg * 0.5), ...lift(e.x, e.y, 0.5));
            }
            for (let j = 0; j < 7; j++) { const b = this.shoot('p', x, y - 0.5, f.a + (j - 3) * 0.16, 10, 4, Math.round(f.dmg * 0.6), 'bubble', 0.45, true); b.child = true; }
            this.vx({ k: 'burst', x, y, n: 18, colors: ['#7ae0e0', '#ffffff', '#3a8a9a'] }); this.vx({ k: 'shake', amt: 3 });
          }
          break;
        }
        case 'eye':
          for (const b of shotsNear(...lift(f.x, f.y, 0.5), f.calm)) { b.life = -1; this.vx({ k: 'burst', x: b.x, y: b.y, n: 2, colors: ['#bfe8ff'] }); }   // the calm
          f.rot += 1.6 * dt; f.cd -= dt;
          if (f.cd <= 0) {
            f.cd = 0.25;
            for (let k = 0; k < 3; k++) {
              const a = f.rot + (k / 3) * TAU, x = f.x + Math.cos(a) * f.ring, y = f.y + Math.sin(a) * f.ring;
              for (const e of this.enemiesIn(x, y, 0.7)) { this.damageEnemy(e, f.dmg, ...lift(e.x, e.y, 0.5), true); this.vx({ k: 'zap', x0: x, y0: y - 2, ...liftB(e.x, e.y, 0.5) }); }
            }
          }
          break;
        case 'spring':
          if (f.t < f.hold) for (const b of shotsNear(...lift(f.x, f.y, 0.5), f.r)) { if (f.n >= f.cap) break; b.life = -1; f.n++; }   // swallowed
          else if (!f.done) {
            f.done = true;
            const L = this.enemiesIn(f.x, f.y, 9).sort((u, v) => dist(u.x, u.y, f.x, f.y) - dist(v.x, v.y, f.x, f.y));
            for (let k = 0; k < f.n; k++) {                              // one clock-hand back for each, aimed now (never steered)
              const e = L[k % Math.max(1, L.length)], a = e ? angleUp(f.x, f.y, e.x, e.y, 0) + ((k / Math.max(1, L.length)) | 0) * 0.08 : (k / f.n) * TAU;
              const b = this.shoot('p', ...lift(f.x, f.y, 0.5), a, 12, 8, f.dmg, 'pj_eleventh', 0.4, false); b.child = true;
            }
            this.fx.push({ kind: 'ring', ...liftO(f.x, f.y, 0.4), t: 0, max: f.r, color: '#e8c87a' });
          }
          break;
        case 'oath': {
          f.x = p.x; f.y = p.y; f.rot += dt;
          for (const R of f.runes) {
            if (R.hp <= 0) continue;
            const [rcx, rcy] = lift(p.x, p.y, 0.4), x = rcx + Math.cos(R.a + f.rot) * 1.3, y = rcy + Math.sin(R.a + f.rot) * 1.3;
            for (const b of shotsNear(x, y, 0.6)) { if (R.hp <= 0) break; b.life = -1; R.hp--; this.vx({ k: 'burst', x, y, n: 3, colors: ['#46f5d6', '#ffffff'] }); }
          }
          if (!f.done && f.runes.every((R) => R.hp <= 0)) {                // the last rune breaks: the counter-slash
            f.done = true; f.life = f.t + 0.1;
            const I = this.input, [ox, oy] = this.up(p.x, p.y, 0.5), a = Math.atan2(I.aimY - oy, I.aimX - ox);
            for (let k = 0; k < f.slashes; k++) { const b = this.shoot('p', ox, oy, a + (k / (f.slashes - 1) - 0.5) * 1.2, 11, 5, f.dmg, f.proj || 'rune_slash', 0.5, true); b.child = true; }
            this.vx({ k: 'shake', amt: 3 });
          }
          break;
        }
      }
    }
    for (const d of this.decoys) {                                       // the Infinite Reflection's mirrors answer once each
      if (!d.mirror || !d.mirror.ready) continue;
      const b = shotsNear(...lift(d.x, d.y, 0.5), 0.6)[0];
      if (!b) continue;
      d.mirror.ready = false; b.life = -1;
      const back = Math.atan2(-b.vy, -b.vx), [ox, oy] = this.up(d.x, d.y, 0.5), D = d.mirror.dmg;
      this.fx.push({ kind: 'myth', h: 'mirrorq', x: d.x, y: d.y, t: 0, life: 0.35, at: 0.3, run: () => { for (let k = -2; k <= 2; k++) { const c = this.shoot('p', ox, oy, back + k * 0.12, 13, 6, D, 'pj_glass', 0.45, true); c.child = true; } } });
    }
    for (const f of this.fx) if (f.kind === 'myth' && f.h === 'mirrorq' && !f.done && f.t >= f.at) { f.done = true; f.run(); }
  },
  // the Grave of Kings: a knight's kill crowns the other
  mythKingHit(a, T) {
    if (!T.dead) return;
    const other = this.allies.find((o) => o.king && o !== a && o.life > 0);
    if (other && !(other.crown > this.t)) { other.crown = this.t + 4; this.float(...lift(other.x, other.y, 1.3), 'CROWNED', '#ffd650'); }
  },
  // the Thirteenth Page: a hexed death passes the hex on, once
  mythPageDeath(e) {
    if (e.page13 !== 1) return;
    e.page13 = 0;
    const L = this.enemiesIn(e.x, e.y, 3.5).filter((o) => o !== e && !o.page13).slice(0, 3);
    for (const o of L) {
      o.page13 = 2;                                                       // (passed on: it goes no further)
      o.curseT = Math.max(o.curseT || 0, 5); o.curseF = Math.max(o.curseF && o.curseT > 0 ? o.curseF : 0, e.curseF || 0.3);
      if (o !== this.boss && !o.rb) { o.slowT = Math.max(o.slowT || 0, 5); o.slowF = Math.max(o.slowF || 0, 0.3); }
      this.vx({ k: 'zap', ...liftA(e.x, e.y, 0.5), ...liftB(o.x, o.y, 0.5) });
    }
  },
};
export function installMythics(Game) { Object.assign(Game.prototype, methods); }
