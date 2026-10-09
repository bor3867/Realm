// The boss framework for the Realm Update's three-phase bosses (docs/design/04_boss_framework.md).
// A bundle boss is an ordinary boss enemy (e.rb) whose data names a registry def (D.bx). This module runs it:
//   sleep -> intro -> fight(P1) -> morph -> fight(P2) -> morph -> fight(P3) -> death -> gone
// Patterns are data (src/bosses/<boss>.js): windup frame held as the telegraph, volleys on the release frame,
// a recover pause after the clip's 'ended' event. Signature mechanics live in each boss's own file as 'specials'.
import { Anim } from './anim.js';
import { BX } from './bosses/index.js';
import { isSolid, TID } from './world/maps.js';

const TAU = Math.PI * 2, R = Math.random;
const angleTo = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);
const dist = (x0, y0, x1, y1) => Math.hypot(x1 - x0, y1 - y0);

export const BXF = {
  // ---------------------------------------------------------------- setup
  bxSetup(e) {
    const B = BX[e.D.bx], art = B.art || e.D.bx, def = this.A.reg && this.A.reg.resolve(`bx_${art}/${art}`);
    const S = (e.bx = { B, def, phase: 1, state: e.state === 'sleep' ? 'sleep' : 'intro', t: 0, pat: null, patIdx: 0, vol: [], wait: 1.6,
      anim: def ? new Anim(def, def.phases['1'].idle) : null, hurtT: 0, flashT: 0, phase0: R() * TAU, arena: e.room || null });
    // where shots hit it and come from: the middle of its drawn body, in tiles above its feet
    e.hitUp = def ? Math.max(0.5, (def.foot[1] - def.size[1] / 2) / 8) : 1.4;
    if (S.anim) S.anim.on('ended', (clip) => this.bxClipEnded(e, clip));
    return S;
  },
  bxPhaseData(e) { return e.bx.B.phases[e.bx.phase]; },
  bxThresholds(e) { return e.bx.B.thresholds || [0.66, 0.33]; },

  // ---------------------------------------------------------------- per frame
  updateBx(e, dt, d) {
    const S = e.bx || this.bxSetup(e), p = this.player, B = S.B;
    S.t += dt; S.hurtT = Math.max(0, S.hurtT - dt); S.flashT = Math.max(0, S.flashT - dt);
    if (S.anim) S.anim.update(dt);
    if (S.state === 'sleep' || e.state === 'sleep') {
      const R0 = e.room;
      if (!R0 || (p.x > R0.x && p.x < R0.x + R0.w && p.y > R0.y && p.y < R0.y + R0.h)) this.bxWake(e);
      return;
    }
    if (B.update) B.update(this, e, dt);                         // the boss's own continuous mechanics
    for (const v of S.vol) if ((v.t -= dt) <= 0 && !v.done) { v.done = true; this.bxVolley(e, v.V); }
    S.vol = S.vol.filter((v) => !v.done);
    if (S.state === 'intro') { if ((S.wait -= dt) <= 0) { S.state = 'fight'; S.wait = 0.6; } return; }
    if (S.state === 'morph' || S.state === 'death') return;     // the clip's 'ended' event moves things on
    if (S.state === 'grace') { this.bxMove(e, dt, 'hold'); if ((S.wait -= dt) <= 0) { S.state = 'fight'; S.wait = 0.2; } return; }
    // fight: move, then start the next pattern when the last one has recovered
    const PH = this.bxPhaseData(e);
    this.bxMove(e, dt, (S.pat && S.pat.move) || PH.move || 'pace');
    if (S.state === 'windup') {
      if ((S.wait -= dt) <= 0) { S.state = 'release'; if (S.anim) S.anim.speed = 1; }
      return;
    }
    if (S.state === 'release' && !S.fired && S.anim && S.anim.i >= 1) this.bxRelease(e);   // the release frame: fire
    if (S.state === 'release' || S.state === 'recover') {
      if (S.state === 'recover' && (S.wait -= dt) <= 0) { S.state = 'fight'; S.pat = null; }
      return;
    }
    if ((S.wait -= dt) > 0 || p.dead) return;
    this.bxStartPattern(e);
  },
  bxWake(e) {
    const S = e.bx;
    e.state = 'idle'; S.state = 'intro'; S.wait = 1.6;
    this.banner(e.D.name.toUpperCase(), 2600); this.vx({ k: 'shake', amt: 5 }); this.sfx('boss');
    this.bxLockArena(e, true);
    if (S.B.onWake) S.B.onWake(this, e);
  },
  bxStartPattern(e) {
    const S = e.bx, PH = this.bxPhaseData(e), list = PH.patterns;
    const pat = list[S.patIdx++ % list.length];
    S.pat = pat; S.fired = false;
    if (pat.special && S.B.specials[pat.special] && pat.instant) { S.B.specials[pat.special](this, e, pat, null); S.state = 'recover'; S.wait = pat.recover || 0.4; return; }
    // the windup frame (frame 0 of the attack clip) is held: that's the telegraph
    S.state = 'windup'; S.wait = Math.max(0.45, pat.windup || 0.6);
    if (S.anim) { S.anim.play(e.bx.def.phases[S.phase].attack); S.anim.speed = 0; }
    if (pat.tell && S.B.specials[pat.tell]) S.B.specials[pat.tell](this, e, pat, null);
  },
  // the attack clip reached its release frame (or ended): fire, recover, idle
  bxClipEnded(e, clip) {
    const S = e.bx, ph = S.def.phases;
    if (clip === ph[S.phase].attack) {
      if (!S.fired) this.bxRelease(e);
      S.anim.play(ph[S.phase].idle);
      S.state = 'recover'; S.wait = (S.pat && S.pat.recover) || 0.4;
      return;
    }
    if (S.state === 'morph' && (clip === ph[S.phase].enter)) {
      S.anim.play(ph[S.phase].idle);
      S.state = 'grace'; S.wait = 1.4; e.invulnT = 0;
      return;
    }
    if (S.state === 'death' && clip === S.def.death) this.bxFinish(e);
  },
  bxRelease(e) {
    const S = e.bx, pat = S.pat;
    S.fired = true;
    if (!pat) return;
    for (const V of pat.volleys || []) S.vol.push({ t: V.t || 0, V });
    if (pat.special && S.B.specials[pat.special]) S.B.specials[pat.special](this, e, pat, null);
  },

  // ---------------------------------------------------------------- volleys (generic forms; specials live with each boss)
  bxOrigin(e) { return [e.x, e.y - e.hitUp]; },
  bxShot(e, x, y, a, V, extra) {
    const b = this.shoot('e', x, y, a, V.speed || 5, V.range || 14, V.dmg || 60, V.sprite || `${e.bx.B.shotSheet || 'bx_shots'}/${e.bx.B.art || e.D.bx}.${V.shot}`, V.size || 0.45, false, e.D.name);
    if (V.mv) b.mv = { ...V.mv };
    if (V.life) b.life = V.life;
    if (V.chill) b.chill = V.chill;
    if (V.poison) b.poison = V.poison;
    b.bxOf = e;
    if (extra) Object.assign(b, extra);
    return b;
  },
  bxVolley(e, V) {
    const S = e.bx, p = this.player, [ox, oy] = V.from ? V.from(this, e) : this.bxOrigin(e);
    const aim = V.angle !== undefined ? V.angle : angleTo(ox, oy, p.x, p.y - 0.4);
    const gaps = (n, k) => V.gaps && ((k + (V.gapAt || 0)) % n) < V.gaps;
    switch (V.form) {
      case 'fan': {
        const n = V.count || 5, sp = V.spread || 1;
        for (let k = 0; k < n; k++) this.bxShot(e, ox, oy, aim + (V.offset || 0) + (n > 1 ? (k / (n - 1) - 0.5) * sp : 0), V);
        break;
      }
      case 'ring': {
        const n = V.count || 12;
        if (V.spiralAt === undefined) S.ringRot = (S.ringRot || 0) + (V.rot || 0);
        const base = V.spiralAt !== undefined ? V.spiralAt : S.ringRot, gapAt = Math.floor(R() * n);
        for (let k = 0; k < n; k++) { if (V.gaps && ((k - gapAt + n) % n) < V.gaps) continue; this.bxShot(e, ox, oy, base + (V.aimed ? aim : 0) + (k / n) * TAU, V); }
        break;
      }
      case 'wall': {
        const n = V.count || 9, sp = V.space || 0.7, perp = aim + Math.PI / 2, gapAt = Math.floor(R() * (n - (V.gaps || 0)));
        for (let k = 0; k < n; k++) {
          if (V.gaps && k >= gapAt && k < gapAt + V.gaps) continue;
          const o = (k - (n - 1) / 2) * sp;
          this.bxShot(e, ox + Math.cos(perp) * o, oy + Math.sin(perp) * o, aim, V);
        }
        break;
      }
      case 'stream': {
        const n = V.n || 6;
        for (let k = 0; k < n; k++) S.vol.push({ t: k * (V.every || 0.1), V: { ...V, form: 'fan', count: 1, n: 0, offset: Math.sin(k * 1.7) * (V.wobble || 0) } });
        break;
      }
      case 'spiral': {
        const steps = Math.round((V.dur || 2) / (V.every || 0.12)), base = R() * TAU;
        for (let k = 0; k < steps; k++) S.vol.push({ t: k * (V.every || 0.12), V: { ...V, form: 'ring', count: V.arms || 3, rot: 0, angle: undefined, aimed: false, gaps: 0, spiralAt: base + k * (V.turn || 0.2) } });
        break;
      }
      case 'curtain': {                                       // across the arena from one side, with a gap to find
        const A = S.arena || { x: e.x - 12, y: e.y - 10, w: 24, h: 20 }, n = V.count || 16, side = V.from_side || ['n', 's', 'e', 'w'][Math.floor(R() * 4)];
        const gapAt = Math.floor(R() * (n - (V.gaps || 2)));
        for (let k = 0; k < n; k++) {
          if (k >= gapAt && k < gapAt + (V.gaps || 2)) continue;
          const u = (k + 0.5) / n;
          const [x, y, a] = side === 'n' ? [A.x + 1 + u * (A.w - 2), A.y + 1, Math.PI / 2] : side === 's' ? [A.x + 1 + u * (A.w - 2), A.y + A.h - 1, -Math.PI / 2]
            : side === 'w' ? [A.x + 1, A.y + 1 + u * (A.h - 2), 0] : [A.x + A.w - 1, A.y + 1 + u * (A.h - 2), Math.PI];
          this.bxShot(e, x, y, a, { range: Math.max(A.w, A.h), ...V });
        }
        break;
      }
      case 'burstAt': {
        const [x, y] = V.at(this, e), n = V.count || 8, a0 = R() * TAU;
        for (let k = 0; k < n; k++) this.bxShot(e, x, y, a0 + (k / n) * TAU, V);
        break;
      }
      case 'special': if (S.B.specials[V.name]) S.B.specials[V.name](this, e, V, null); break;
      default: break;
    }
  },

  // ---------------------------------------------------------------- movement between and during patterns
  bxMove(e, dt, how) {
    const p = this.player, D = e.D, S = e.bx, A = S.arena;
    const step = (tx, ty, sp) => { const dd = dist(e.x, e.y, tx, ty); if (dd > 0.2) this.moveCircle(e, ((tx - e.x) / dd) * Math.min(dd, sp * dt), ((ty - e.y) / dd) * Math.min(dd, sp * dt), 0.8); };
    if (how === 'hold') return;
    if (how === 'pace') {                                   // keep its distance, sidling
      const a = angleTo(p.x, p.y, e.x, e.y) + Math.sin(S.t * 0.6) * 0.5;
      step(p.x + Math.cos(a) * (D.keep || 6), p.y + Math.sin(a) * (D.keep || 6), D.speed || 1.2);
    } else if (how === 'center' && A) step(A.x + A.w / 2, A.y + A.h / 2, (D.speed || 1.2) * 1.5);
    else if (how === 'orbit') { const a = angleTo(p.x, p.y, e.x, e.y) + dt * 0.5; step(p.x + Math.cos(a) * (D.keep || 6), p.y + Math.sin(a) * (D.keep || 6), (D.speed || 1.2) * 1.4); }
    else if (S.B.moves && S.B.moves[how]) S.B.moves[how](this, e, dt);
    if (S.B.faces) e.face = p.x < e.x;                     // side-view bosses face whoever they fight
  },

  // ---------------------------------------------------------------- damage: immunity, phases, death
  bxImmune(e, x, y, quiet) {
    const S = e.bx;
    if (!S) return false;
    if (S.state === 'sleep' || S.state === 'intro' || S.state === 'morph' || S.state === 'death') { if (!quiet) this.float(x, y - 0.8, 'IMMUNE', '#8d88a0'); return true; }
    if (S.B.immune && S.B.immune(this, e)) { if (!quiet) this.float(x, y - 0.8, S.B.immuneText || 'IMMUNE', '#c8c0d8'); return true; }
    return false;
  },
  // called with the damage about to land: clamp at the next threshold (no skipped phases), turn a kill into the death clip
  bxClamp(e, d) {
    const S = e.bx;
    if (!S) return d;
    const th = this.bxThresholds(e), next = th[S.phase - 1];
    if (next !== undefined && e.hp - d <= e.maxHp * next) { const keep = e.hp - e.maxHp * next; this.bxMorph(e); return Math.max(0, keep); }
    if (e.hp - d <= 0 && S.state !== 'death') { this.bxDie(e); return 0; }   // bxDie leaves it at 1 life while the death clip plays
    if (S.hurtT <= 0) { S.hurtT = 0.12; S.flashT = 0.08; }   // the hit flash, rate-limited
    return d;
  },
  bxMorph(e) {
    const S = e.bx, def = S.def;
    S.phase++; S.state = 'morph'; S.patIdx = 0; S.pat = null; S.vol = [];
    e.invulnT = 99;
    this.bxClearBullets(e);
    const ph = def.phases[S.phase];
    this.banner(`${ph.name.toUpperCase()}`, 2600); this.vx({ k: 'shake', amt: 8 }); this.sfx('boss');
    if (S.anim) S.anim.play(ph.enter || ph.idle, { speed: 1 });          // speed 1: a morph can land mid-windup, while the frame is held
    if (!ph.enter) { S.state = 'grace'; S.wait = 1.4; e.invulnT = 0; }
    if (S.B.onPhase) S.B.onPhase(this, e, S.phase);
  },
  bxClearBullets(e) {
    const keep = [];
    for (const b of this.projectiles) {
      if (b.bxOf === e || (b.from === 'e' && b.by === e.D.name)) { if (Math.random() < 0.3) this.vx({ k: 'burst', x: b.x, y: b.y, n: 2, colors: ['#ffffff'] }); continue; }
      keep.push(b);
    }
    this.projectiles = keep;
  },
  bxDie(e) {
    const S = e.bx;
    S.state = 'death'; S.vol = []; e.invulnT = 99; e.hp = 1;
    this.bxClearBullets(e);
    if (S.B.onDeath) S.B.onDeath(this, e);
    if (S.anim && S.def.anims[S.def.death]) S.anim.play(S.def.death, { speed: 1 }); else this.bxFinish(e);
  },
  bxFinish(e) {
    const S = e.bx;
    if (S.finished) return;
    S.finished = true; S.state = 'gone'; e.invulnT = 0;
    this.bxLockArena(e, false);
    e.bxKill = true;                                        // the real death: loot, portal, quests, trophies
    this.damageEnemy(e, e.hp + 1e9, e.x, e.y - e.hitUp, true);
  },

  // ---------------------------------------------------------------- the arena: doors lock while it lives
  bxLockArena(e, lock) {
    const m = this.map, A = e.room;
    if (!A || m.kind !== 'dungeon') return;
    if (lock) {
      e.bx.locks = [];
      for (let x = A.x - 1; x <= A.x + A.w; x++) for (let y = A.y - 1; y <= A.y + A.h; y++) {
        if (x >= A.x && x < A.x + A.w && y >= A.y && y < A.y + A.h) continue;
        const i = y * m.w + x;
        if (m.solid[i] || m.tiles[i] === TID.asvoid) continue;      // the doors are where a way comes in: not the open void
        const o = { sprite: 'seal_gate', x: x + 0.5, y: y + 0.5, solid: true, arenaLock: true };
        m.objects.push(o); m.solid[i] = 1; e.bx.locks.push(o);
        const p = this.player;
        if (Math.floor(p.x) === x && Math.floor(p.y) === y) { p.x = A.x + A.w / 2; p.y = A.y + A.h - 2; }
      }
    } else for (const o of e.bx.locks || []) {
      o.sprite = 'gate_open'; o.solid = false; m.solid[Math.floor(o.y) * m.w + Math.floor(o.x)] = 0;
    }
  },
  // the boss bar's extras: phase pips and the current phase's name
  bxBar(e) {
    const S = e.bx;
    if (!S || !S.def) return null;
    return { pips: this.bxThresholds(e), phase: S.phase, name: S.def.phases[S.phase].name, immune: ['intro', 'morph', 'death', 'sleep'].includes(S.state) };
  },
};
export function installBX(Game) { Object.assign(Game.prototype, BXF); }
void isSolid;
