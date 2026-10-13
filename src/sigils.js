// Ability sigils (item rework, realm_505_item_rework_blueprint.md): a UT ability does what its class's ability always
// does, and also leaves a sigil at the cursor. Press the ability again while the sigil glows (no Mana) and it goes off,
// once, with its theme's effect; leave it and it fades. Mixed into Game like halos.js; the item says which in
// ability.sigil = { theme, f (damage, times the burst's dmg and your ATT), window, r, ...its numbers }.
//   encore   (song)    a volley from the sigil: a ring, two alternating rings, or one heavy encore hit
//   undertow (sea)     drags the small things near it to its centre, then a crash
//   root     (nature)  roots what stands on it and sprouts thorns
//   repeat   (time)    two pulses, a measured beat apart, that slow
//   align    (astral)  three stars wheel round it, line up and fire at your cursor
//   soul     (death)   marks what stands near it: it decays, and a kill while marked gives you back Mana
//   shatter  (ice)     chills everything near it; a beat later the chilled shatter into shards
//   forge    (fire)    a delayed forge-blow on the spot, and a burn
//   refract  (glass)   bends a fan of shards from the sigil toward your cursor
//   jump     (storm)   lightning leaps between the enemies nearest it
//   rune     (rune)    stays a while: each of your hits on an enemy inside it sets off a rune pulse
import { lift, liftO, liftA, liftB } from './util.js';
const TAU = Math.PI * 2;
const COL = { encore: ['#ffd6f0', '#c88aff'], undertow: ['#7ae0e0', '#ffffff'], root: ['#7ad04a', '#a86a3a'], repeat: ['#e8c87a', '#8a6a3a'],
  align: ['#c8b8ff', '#fff2a8'], soul: ['#e8e0c8', '#6ad08a'], shatter: ['#cfffff', '#3bc8e8'], forge: ['#ffb04a', '#ff5a1a'], refract: ['#e0f8ff', '#8ad0e8'],
  jump: ['#bfe8ff', '#5a8aff'], rune: ['#8a7aff', '#ffd650'] };

const methods = {
  // the cast leaves its sigil (called after the class ability did its usual thing)
  sigilPlace(A, mult, at) {
    const S = A.sigil, B = A.burst;
    this.player.sigil = { x: at.x, y: at.y, t: 0, until: this.t + (S.window || 4), S, dmg: Math.round(Math.max(60, B.dmg) * mult * S.f), proj: S.proj || B.proj || 'spark', col: COL[S.theme] };
    this.fx.push({ kind: 'sigil', sg: this.player.sigil, x: at.x, y: at.y, t: 0, life: S.window || 4 });
  },
  // the second press: the sigil goes off (returns true when there was one to set off)
  sigilTrigger() {
    const p = this.player, G = p.sigil;
    if (!G || G.until < this.t || G.used) return false;
    G.used = true; p.abilityT = 0.3;
    for (const f of this.fx) if (f.kind === 'sigil' && f.sg === G) f.life = f.t + 0.15;
    const S = G.S, x = G.x, y = G.y, r = S.r || 2.5, dmg = G.dmg, [ox, oy] = [x, y - 0.5];
    const shot = (a, speed, range, d, pierce = true) => { const b = this.shoot('p', ox, oy, a, speed, range, d, G.proj, 0.45, pierce); b.child = true; return b; };
    const ring = (n, a0, d, range = r + 1) => { for (let k = 0; k < n; k++) shot(a0 + (k / n) * TAU, 9, range, d); };
    const near = () => this.enemiesIn(x, y, r);
    const small = (e) => e !== this.boss && !e.rb && !(e.D && e.D.dummy);
    switch (S.theme) {
      case 'encore':
        if (S.pattern === 'heavy') { for (const e of near()) this.damageEnemy(e, dmg * 2, ...lift(e.x, e.y, 0.5)); this.vx({ k: 'shake', amt: 2 }); }
        else if (S.pattern === 'alternate') { ring(S.n, 0, dmg); this.fx.push({ kind: 'sigilq', x, y, t: 0, life: 0.45, at: 0.35, run: () => ring(S.n, Math.PI / S.n, dmg) }); }
        else ring(S.n, 0, dmg);
        break;
      case 'undertow': {
        for (const e of near()) if (small(e)) { const d = Math.hypot(e.x - x, e.y - y) || 1, k = Math.min(d - 0.4, S.pull); if (k > 0) this.moveCircle(e, ((x - e.x) / d) * k, ((y - e.y) / d) * k, 0.35); }
        this.fx.push({ kind: 'sigilq', x, y, t: 0, life: 0.4, at: 0.3, run: () => { for (const e of this.enemiesIn(x, y, r * 0.6)) this.damageEnemy(e, dmg, ...lift(e.x, e.y, 0.5)); this.vx({ k: 'burst', x, y, n: 12, colors: G.col }); } });
        break;
      }
      case 'root':
        for (const e of near()) { if (small(e)) this.stun(e, S.root); else { e.slowT = Math.max(e.slowT || 0, S.root); e.slowF = Math.max(e.slowF || 0, 0.35); } this.damageEnemy(e, Math.round(dmg * 0.5), ...lift(e.x, e.y, 0.5), true); }
        ring(S.n || 6, 0.3, Math.round(dmg * 0.5), 2.2);
        break;
      case 'repeat':
        for (let k = 0; k < 2; k++) this.fx.push({ kind: 'sigilq', x, y, t: 0, life: 0.15 + k * S.beat + 0.05, at: 0.1 + k * S.beat, run: () => {
          for (const e of this.enemiesIn(x, y, r)) { this.damageEnemy(e, dmg, ...lift(e.x, e.y, 0.5)); if (small(e)) { e.slowT = Math.max(e.slowT || 0, 2); e.slowF = Math.max(e.slowF || 0, 0.3); } }
          this.fx.push({ kind: 'ring', x, y: y - 0.3, t: 0, max: r, color: G.col[0] });
        } });
        break;
      case 'align': {
        const I = this.input;
        for (let k = 0; k < 3; k++) this.fx.push({ kind: 'sigilq', x, y, t: 0, life: 0.5 + k * 0.12, at: 0.4 + k * 0.1, star: k, run: () => {
          const a = Math.atan2(I.aimY - oy, I.aimX - ox); shot(a + (k - 1) * 0.05, 13, 8, dmg);
        } });
        break;
      }
      case 'soul':
        for (const e of near()) { e.soulT = this.t + S.t; e.soulMana = S.mana; this.ignite(e, Math.round(dmg / S.t), S.t); e.wmark = { until: this.t + S.t, col: G.col[1] }; }
        break;
      case 'shatter': {
        const hit = near().slice(0, 6);
        for (const e of hit) if (small(e)) { e.slowT = Math.max(e.slowT || 0, 3); e.slowF = Math.max(e.slowF || 0, 0.5); }
        this.fx.push({ kind: 'sigilq', x, y, t: 0, life: 1.05, at: 1, run: () => {
          for (const e of hit) if (!e.dead) for (let k = 0; k < 4; k++) { const b = this.shoot('p', ...lift(e.x, e.y, 0.5), (k / 4) * TAU + 0.4, 8, 1.8, Math.round(dmg * 0.4), G.proj, 0.4, true); b.child = true; b.hit.add(e); }
          for (const e of hit) if (!e.dead) this.damageEnemy(e, dmg, ...lift(e.x, e.y, 0.5));
        } });
        break;
      }
      case 'forge':
        this.fx.push({ kind: 'sigilq', x, y, t: 0, life: S.delay + 0.1, at: S.delay, warn: r, run: () => {
          for (const e of this.enemiesIn(x, y, r)) { this.damageEnemy(e, dmg, ...lift(e.x, e.y, 0.5)); this.ignite(e, Math.round(dmg * 0.15), 3); }
          this.vx({ k: 'boom', x, y, r }); this.vx({ k: 'shake', amt: 3 });
        } });
        break;
      case 'refract': {
        const I = this.input, a = Math.atan2(I.aimY - oy, I.aimX - ox);
        for (let k = 0; k < S.n; k++) shot(a + (k - (S.n - 1) / 2) * S.spread, 14, 7, dmg);
        break;
      }
      case 'jump': {
        let from = { x, y: y }, seen = new Set();
        for (let k = 0; k < S.n; k++) {
          const nx = this.enemiesIn(from.x, from.y, k ? 4 : r).filter((o) => !seen.has(o)).sort((a, c) => (a.x - from.x) ** 2 + (a.y - from.y) ** 2 - ((c.x - from.x) ** 2 + (c.y - from.y) ** 2))[0];
          if (!nx) break;
          seen.add(nx); this.vx({ k: 'zap', ...liftA(from.x, from.y, 0.5), ...liftB(nx.x, nx.y, 0.5) }); this.damageEnemy(nx, dmg, ...lift(nx.x, nx.y, 0.5)); from = nx;
        }
        break;
      }
      case 'rune': p.runeSigil = { x, y, r, until: this.t + S.t, left: S.n, dmg, col: G.col }; break;
    }
    this.fx.push({ kind: 'ring', x, y: y - 0.3, t: 0, max: r, color: G.col[0] });
    this.vx({ k: 'burst', x, y: y - 0.4, n: 10, colors: G.col });
    return true;
  },
  // every frame: queued sigil beats, and the rune sigil's pulses (on your hits: sigilOnHit)
  sigilTick() {
    for (const f of this.fx) if (f.kind === 'sigilq' && !f.done && f.t >= f.at) { f.done = true; f.run(); }
  },
  sigilOnHit(e) {
    const p = this.player, Rn = p.runeSigil;
    if (Rn && Rn.until > this.t && Rn.left > 0 && (e.x - Rn.x) ** 2 + (e.y - Rn.y) ** 2 < Rn.r * Rn.r) {
      Rn.left--;
      this.damageEnemy(e, Rn.dmg, ...lift(e.x, e.y, 0.6), true);
      this.fx.push({ kind: 'ring', ...liftO(e.x, e.y, 0.4), t: 0, max: 0.9, color: Rn.col[0] });
    }
  },
  sigilOnKill(e) {                                          // a soul-marked enemy dies: Mana back
    if (e.soulT > this.t && e.soulMana) { const p = this.player; p.mp = Math.min(this.stat('mp'), p.mp + e.soulMana); this.float(...lift(p.x, p.y, 1.3), `+${e.soulMana}`, '#6a9aff'); e.soulMana = 0; }
  },
};
export function installSigils(Game) { Object.assign(Game.prototype, methods); }
export { COL as SIGIL_COL };
