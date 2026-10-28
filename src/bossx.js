// The boss framework for the Realm Update's three-phase bosses (docs/design/04_boss_framework.md).
// A bundle boss is an ordinary boss enemy (e.rb) whose data names a registry def (D.bx). This module runs it:
//   sleep -> intro -> fight(P1) -> morph -> fight(P2) -> morph -> fight(P3) [-> finale -> broken] -> death -> gone
// Difficulty (docs/design/08_boss_rework.md): each phase may have pressure layers (attacks on their own timers, under
// the main cycle), the boss a tempo (windups and recovers scaled), a dmgScale (every shot), and the hardest a finale
// (immune, a survival sequence of its own, then broken: +50% damage taken for the rest of the fight).
// Patterns are data (src/bosses/<boss>.js): windup frame held as the telegraph, volleys on the release frame,
// a recover pause after the clip's 'ended' event. Signature mechanics live in each boss's own file as 'specials'.
import { lift, angleUp } from './util.js';
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
    // a boss that floats over its floor, seen from above (B.grounded: the Grand Orrery): its body is drawn centred on its
    // spot, so its middle, its planets and its shots don't swing round when the camera turns (they did: 2026-10-24)
    if (B.grounded) { e.bxLift = e.hitUp; e.hitUp = 0.01; }
    if (S.anim) S.anim.on('ended', (clip) => this.bxClipEnded(e, clip));
    // spawned already awake (an admin's /bx, /spawn): it never passes through bxWake, so set up what waking sets up
    // (the Grand Orrery's planets: without them its Alignment threw every frame and the game froze)
    if (S.state === 'intro' && S.B.onWake) { try { S.B.onWake(this, e); } catch (err) { console.warn('bx onWake', e.D.bx, err); } }
    return S;
  },
  bxPhaseData(e) { return e.bx.B.phases[e.bx.phase]; },
  bxThresholds(e) { return e.bx.B.thresholds || [0.66, 0.33]; },

  // ---------------------------------------------------------------- per frame
  updateBx(e, dt, d) {
    const S = e.bx || this.bxSetup(e), p = this.player, B = S.B;
    S.t += dt; S.hurtT = Math.max(0, S.hurtT - dt); S.flashT = Math.max(0, S.flashT - dt);
    if (e.invulnT > 0 && e.invulnT < 50) e.invulnT = Math.max(0, e.invulnT - dt);   // a timed immunity (after a finale) wears off; a morph's (99) is cleared by its clip
    if (S.anim) S.anim.update(dt);
    if (dt > 0) {                                           // how you are moving (from where you are, frame to frame: for the shots that lead you)
      const vx = S.plx === undefined ? 0 : (p.x - S.plx) / dt, vy = S.ply === undefined ? 0 : (p.y - S.ply) / dt, k = Math.min(1, dt * 6), jump = Math.hypot(vx, vy) > 30;
      S.pvx = jump ? 0 : (S.pvx || 0) + (vx - (S.pvx || 0)) * k; S.pvy = jump ? 0 : (S.pvy || 0) + (vy - (S.pvy || 0)) * k; S.plx = p.x; S.ply = p.y;
    }
    if (S.state === 'sleep' || e.state === 'sleep') {
      const R0 = e.room;
      if (!R0 || (p.x > R0.x && p.x < R0.x + R0.w && p.y > R0.y && p.y < R0.y + R0.h)) this.bxWake(e);
      return;
    }
    if (S.state === 'deathhold') {                              // dead on its last frame, shaking; then it bursts
      S.wait -= dt;
      if (Math.random() < 0.5) this.vx({ k: 'burst', x: e.x + (Math.random() - 0.5) * 3, y: e.y - e.hitUp + (Math.random() - 0.5) * 3, n: 3, colors: ['#ffffff', '#ffd690', '#c8a0ff'] });
      if (Math.random() < 0.08) this.vx({ k: 'shake', amt: 2 + (1 - S.wait / S.B.death.hold) * 4 });
      if (S.wait <= 0) { if (S.B.death.burst) { S.burstUntil = this.t + 1.5; S.B.death.burst(this, e); } this.bxFinish(e); }   // (its burst, rings over a second or so, is the one volley a dead boss throws)
      return;
    }
    if (S.state === 'finale') { this.bxFinale(e, dt); return; }
    if (B.update) B.update(this, e, dt);                         // the boss's own continuous mechanics
    if (S.state === 'death') S.vol = [];                          // (dying: nothing it queued goes off)
    for (const v of S.vol) if ((v.t -= dt) <= 0 && !v.done) { v.done = true; this.bxVolley(e, v.V); }
    S.vol = S.vol.filter((v) => !v.done);
    if (S.state === 'intro') { if ((S.wait -= dt) <= 0) { S.state = 'fight'; S.wait = 0.6; } return; }
    if (S.state === 'morph' || S.state === 'death') return;     // the clip's 'ended' event moves things on
    if (S.state !== 'grace' && !p.dead) this.bxPressure(e, dt);
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
    if (pat.special && S.B.specials[pat.special] && pat.instant) { S.B.specials[pat.special](this, e, pat, null); S.state = 'recover'; S.wait = (pat.recover || 0.4) * (S.B.tempo || 1); return; }
    // the windup frame (frame 0 of the attack clip) is held: that's the telegraph
    S.state = 'windup'; S.wait = Math.max(0.45, (pat.windup || 0.6) * (S.B.tempo || 1) * (S.tempoK || 1));   // (tempoK: a boss's last stand runs faster)
    if (S.anim) { S.anim.play(e.bx.def.phases[S.phase].attack); S.anim.speed = 0; }
    if (pat.tell && S.B.specials[pat.tell]) S.B.specials[pat.tell](this, e, pat, null);
  },
  // the attack clip reached its release frame (or ended): fire, recover, idle
  bxClipEnded(e, clip) {
    const S = e.bx, ph = S.def.phases;
    if (clip === ph[S.phase].attack) {
      if (!S.fired) this.bxRelease(e);
      S.anim.play(ph[S.phase].idle);
      S.state = 'recover'; S.wait = ((S.pat && S.pat.recover) || 0.4) * (S.B.tempo || 1) * (S.tempoK || 1);
      return;
    }
    if (S.state === 'morph' && (clip === ph[S.phase].enter)) {
      S.anim.play(ph[S.phase].idle);
      S.state = 'grace'; S.wait = S.B.morphGrace || 2.4; e.invulnT = 0;   // a breath after each change before it attacks (a boss may fill it with a transition)
      return;
    }
    if (S.state === 'death' && clip === S.def.death) {
      if (S.B.death && S.B.death.hold) { S.state = 'deathhold'; S.wait = S.B.death.hold; return; }   // it holds its last frame a while first
      this.bxFinish(e);
    }
  },
  bxRelease(e) {
    const S = e.bx, pat = S.pat;
    S.fired = true;
    if (!pat) return;
    for (const V of pat.volleys || []) S.vol.push({ t: V.t || 0, V });
    if (pat.special && S.B.specials[pat.special]) S.B.specials[pat.special](this, e, pat, null);
  },

  // pressure layers: a phase's attacks on their own timers, running under the main cycle
  bxPressure(e, dt) {
    const S = e.bx, L = this.bxPhaseData(e).pressure;
    if (!L) return;
    S.pr = S.pr && S.prPhase === S.phase ? S.pr : L.map((q) => q.delay !== undefined ? q.delay : q.every * 0.6);
    S.prPhase = S.phase;
    L.forEach((q, k) => {
      if ((S.pr[k] -= dt) > 0) return;
      S.pr[k] = q.every * (0.9 + R() * 0.2);
      if (q.special && S.B.specials[q.special]) S.B.specials[q.special](this, e, q, null);
      else if (q.form) this.bxVolley(e, q);
    });
  },
  // the finale: immune, its own survival sequence, then broken
  bxStartFinale(e, F = e.bx.B.finale) {                       // (a boss may have a second: B.finale2, lower down)
    const S = e.bx;
    S.fin = F; S.state = 'finale'; S.finT = 0; S.vol = []; S.pat = null; if (F === S.B.finale) S.finaleDone = true; else S.finale2Done = true;
    this.bxClearBullets(e);
    if (S.anim) S.anim.play(S.def.phases[S.phase].idle, { speed: 1 });
    this.banner(F.name.toUpperCase() + (F.say ? ' · ' + F.say : ''), 3200); this.vx({ k: 'shake', amt: 10 }); this.sfx('boss');
    if (F.start) F.start(this, e);
  },
  bxFinale(e, dt) {
    const S = e.bx, F = S.fin || S.B.finale;
    S.finT += dt;
    for (const v of S.vol) if ((v.t -= dt) <= 0 && !v.done) { v.done = true; this.bxVolley(e, v.V); }
    S.vol = S.vol.filter((v) => !v.done);
    if (F.update) F.update(this, e, dt, S.finT);
    if (S.finT >= F.dur) {
      if (F.end) F.end(this, e);
      if (!F.keepShots) this.bxClearBullets(e);              // (a finale may leave its shots flying as it ends)
      S.state = 'grace'; S.wait = Math.max(1.2, F.after || 0); S.broken = true;
      if (F.after) e.invulnT = F.after;                       // immune while it comes out of it
      this.banner(`${e.D.name.toUpperCase()} IS BROKEN`, 2600); this.vx({ k: 'shake', amt: 8 });
      this.vx({ k: 'burst', x: e.x, y: e.y - e.hitUp, n: 40, colors: ['#ffffff', '#ffd650', '#ff8a1f'] });
    }
  },

  // ---------------------------------------------------------------- volleys (generic forms; specials live with each boss)
  bxOrigin(e) { return this.up(e.x, e.y, e.hitUp); },      // the middle of its body as drawn (up the screen, whatever the camera's turn)
  bxDmg(e, d) { return Math.round((d || 60) * ((e.bx && e.bx.B.dmgScale) || 1)); },   // the boss's damage scale, for shots made outside bxShot (lobs)
  // a shot from a point h tiles up the screen from (x, y), whatever the camera's turn, and flying at that height (a
  // boss's hand, its crown, a drum): lifted with the camera, it stays on its path as the camera turns. (Bosses used to
  // lift such points by hand, 'y - 0.8', right only with the camera upright. 2026-10-28)
  bxShotAt(e, x, y, h, a, V, extra) { const b = this.bxShot(e, ...this.up(x, y, h), a, V, extra); if (b && !b.dead) b.h = h; return b; },
  bxShot(e, x, y, a, V, extra) {
    // a dying boss throws nothing more: what its own mechanics still call for comes to nothing (a shot not in play, so the
    // caller can still dress it). Three bosses kept firing through their death clip (tools/check_shot_lifecycle.mjs)
    if ((e.dead || (e.bx && (e.bx.state === 'death' || e.bx.state === 'deathhold' || e.bx.state === 'gone'))) && !(e.bx && e.bx.burstUntil > this.t)) return { x, y, vx: 0, vy: 0, a, life: 0, dmg: 0, dead: true };
    const b = this.shoot('e', x, y, a, V.speed || 5, V.range || 14, this.bxDmg(e, V.dmg || 60), V.sprite || `${e.bx.B.shotSheet || 'bx_shots'}/${e.bx.B.art || e.D.bx}.${V.shot}`, V.size || 0.45, false, e.D.name);
    if (V.mv) b.mv = { ...V.mv };
    if (V.life) b.life = V.life;
    if (V.chill) b.chill = V.chill;
    if (V.poison) b.poison = V.poison;
    b.bxOf = e;
    // how high it flies (src/game.js liftShift): from its body, the body's height; from anywhere else (its planets, a black
    // hole, the floor's rim, a marked tile) the ground's. Every shot used to fly at the body's, so turning the camera threw
    // the others off their sources (and the boss put them back each step: they flickered, high above it). 2026-10-24
    // (2026-10-28: by which it is nearer, its body or its feet: a slam's shards at its feet, under a tall boss, are within
    // 2 tiles of its body too, took its height, and slid off the floor as the camera turned)
    b.h = this.shotHeight(e, x, y);
    if (extra) Object.assign(b, extra);
    return b;
  },
  // where a boss aims an aimed attack: at you, or, for a boss that leads (B.lead), one time in three (from over 4 tiles) at where you will be
  // when the shot arrives (your movement times its flight, at most 1.2 s): a steady run round it is no longer a free
  // pass, while a change of pace or direction still dodges it
  bxAim(e, ox, oy, speed = 7) {
    const S = e.bx, p = this.player;
    const far = Math.hypot(p.x - ox, p.y - oy) > 4;             // (only at range: up close there is no time to read it)
    if (!S.B.lead || !far || ((S.leadN = (S.leadN || 0) + 1) % 3)) return angleTo(ox, oy, ...lift(p.x, p.y, 0.4));
    const T = Math.min(1.2, Math.hypot(p.x - ox, p.y - oy) / Math.max(1, speed));
    return angleUp(ox, oy, p.x + (S.pvx || 0) * T, p.y + (S.pvy || 0) * T, 0.4);
  },
  bxVolley(e, V) {
    const S = e.bx, p = this.player, [ox, oy] = V.from ? V.from(this, e) : this.bxOrigin(e);
    const aim = V.angle !== undefined ? V.angle : V.form === 'fan' || V.form === 'wall' ? this.bxAim(e, ox, oy, V.speed || 5) : angleTo(ox, oy, ...lift(p.x, p.y, 0.4));
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
  // a boss's movement, smoothed: its mode says where it wants to be this frame (its own path, unchanged), and the boss
  // gets there with eased velocity, so it starts, stops and turns with weight instead of snapping to full speed. A
  // dash eases faster (still sharp); a jump of over a tile is a designed teleport and passes as it is. (The Grand
  // Orrery moves as it always has.)
  bxMove(e, dt, how) {
    const S = e.bx;
    if (e.D.bx === 'grand_orrery' || dt <= 0) return this.bxMoveRaw(e, dt, how);
    const x0 = e.x, y0 = e.y;
    this.bxMoveRaw(e, dt, how);
    const dx = e.x - x0, dy = e.y - y0, jump = Math.hypot(dx, dy);
    if (jump > 1) { S.mvx = 0; S.mvy = 0; return; }
    e.x = x0; e.y = y0;
    const wx = dx / dt, wy = dy / dt, k = Math.min(1, dt * (Math.hypot(wx, wy) > 6 || Math.hypot(S.mvx || 0, S.mvy || 0) > 6 ? 14 : 5));
    S.mvx = (S.mvx || 0) + (wx - (S.mvx || 0)) * k; S.mvy = (S.mvy || 0) + (wy - (S.mvy || 0)) * k;
    const nx = e.x + S.mvx * dt, ny = e.y + S.mvy * dt;
    if (this.blockedAt(x0 + dx, y0 + dy, 0.8)) { e.x = nx; e.y = ny; }   // it was going over walls (it flies): so does the eased step
    else this.moveCircle(e, S.mvx * dt, S.mvy * dt, 0.8);
  },
  bxMoveRaw(e, dt, how) {
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
    if (S.state === 'sleep' || S.state === 'intro' || S.state === 'morph' || S.state === 'death' || S.state === 'deathhold') { if (!quiet) this.float(x, y - 0.8, 'IMMUNE', '#8d88a0'); return true; }
    if (S.state === 'finale') { if (!quiet) this.float(x, y - 0.8, 'SURVIVE', '#ffd650'); return true; }
    if (S.B.immune && S.B.immune(this, e)) { if (!quiet) this.float(x, y - 0.8, S.B.immuneText || 'IMMUNE', '#c8c0d8'); return true; }
    return false;
  },
  // called with the damage about to land: clamp at the next threshold (no skipped phases), turn a kill into the death clip
  bxClamp(e, d) {
    const S = e.bx;
    if (!S) return d;
    if (S.B.dmgMult) d = Math.round(d * S.B.dmgMult(this, e));       // a boss's own weak moments (the Ringmaster's lantern eyes)
    if (S.broken) d = Math.round(d * 1.5);                          // after its finale it is broken
    const F = S.B.finale;
    if (F && S.phase === 3 && !S.finaleDone && e.hp - d <= e.maxHp * F.at) { const keep = e.hp - e.maxHp * F.at; this.bxStartFinale(e); return Math.max(0, keep); }
    const F2 = S.B.finale2;
    if (F2 && S.finaleDone && !S.finale2Done && S.state !== 'finale' && e.hp - d <= e.maxHp * F2.at) { const keep = e.hp - e.maxHp * F2.at; this.bxStartFinale(e, F2); return Math.max(0, keep); }
    const th = this.bxThresholds(e), next = th[S.phase - 1];
    if (next !== undefined && e.hp - d <= e.maxHp * next) { const keep = e.hp - e.maxHp * next; this.bxMorph(e); return Math.max(0, keep); }
    if (e.hp - d <= 0 && S.state !== 'death' && S.state !== 'deathhold') { this.bxDie(e); return 0; }   // bxDie leaves it at 1 life while the death clip plays
    if (S.hurtT <= 0) S.hurtT = 0.12;
    return d;
  },
  bxMorph(e) {
    const S = e.bx, def = S.def;
    S.phase++; S.state = 'morph'; S.patIdx = 0; S.pat = null; S.vol = []; S.mvx = 0; S.mvy = 0;   // (a change of form starts from rest)
    e.invulnT = 99;
    this.bxClearBullets(e);
    const ph = def.phases[S.phase];
    this.banner(`${ph.name.toUpperCase()}`, 2600); this.vx({ k: 'shake', amt: 8 }); this.sfx('boss');
    if (S.anim) S.anim.play(ph.enter || ph.idle, { speed: S.B.morphSpeed || 0.55 });   // slow and heavy (a morph can land mid-windup, while the frame is held)
    if (!ph.enter) { S.state = 'grace'; S.wait = 3; e.invulnT = 0; }
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
    if (S.anim && S.def.anims[S.def.death]) S.anim.play(S.def.death, { speed: (S.B.death && S.B.death.speed) || 1 }); else this.bxFinish(e);   // a boss may die slower
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
    if (!A || m.kind !== 'dungeon' || m.rfArena) return;           // (a boss's own room has no doors to lock: its way out stays open)
    if (lock) {
      e.bx.locks = [];
      for (let x = A.x - 1; x <= A.x + A.w; x++) for (let y = A.y - 1; y <= A.y + A.h; y++) {
        if (x >= A.x && x < A.x + A.w && y >= A.y && y < A.y + A.h) continue;
        const i = y * m.w + x;
        if (m.solid[i] || m.tiles[i] === TID.asvoid) continue;      // the doors are where a way comes in: not the open void
        const o = { sprite: 'seal_gate', x: x + 0.5, y: y + 0.5, solid: true, arenaLock: true };
        m.objects.push(o); m.solid[i] = 1; e.bx.locks.push(o);
      }
      const p = this.player;                                     // just through the doorway: step clear of the gates (a body touching one can't move)
      if (p.x > A.x - 1 && p.x < A.x + A.w + 1 && p.y > A.y - 1 && p.y < A.y + A.h + 1) {
        p.x = Math.max(A.x + 1, Math.min(A.x + A.w - 1, p.x)); p.y = Math.max(A.y + 1.2, Math.min(A.y + A.h - 1, p.y));
      }
    } else for (const o of e.bx.locks || []) {
      o.sprite = 'gate_open'; o.solid = false; m.solid[Math.floor(o.y) * m.w + Math.floor(o.x)] = 0;
    }
  },
  // the boss bar's extras: phase pips and the current phase's name
  bxBar(e) {
    const S = e.bx;
    if (!S || !S.def) return null;
    const F = S.fin || S.B.finale, tag = S.state === 'finale' ? ` · ${F.name.toUpperCase()} ${Math.max(0, Math.ceil(F.dur - S.finT))}s` : S.broken ? ' · BROKEN' : '';
    return { pips: S.B.finale ? [...this.bxThresholds(e), S.B.finale.at, ...(S.B.finale2 ? [S.B.finale2.at] : [])] : this.bxThresholds(e), phase: S.phase, name: S.def.phases[S.phase].name + (S.B.barTag ? S.B.barTag(this, e) : '') + tag, immune: ['intro', 'morph', 'death', 'deathhold', 'sleep', 'finale'].includes(S.state) };
  },
};
export function installBX(Game) { Object.assign(Game.prototype, BXF); }
void isSolid;
