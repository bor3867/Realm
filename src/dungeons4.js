// The four newer dungeons' own mechanics, installed onto the Game (see the bottom of game.js). Their bosses fight on the
// three-phase engine (src/bosses/honey_queen.js, the_puppeteer.js, prism_wyrm.js, the_sleeper.js; 2026-10-22).
//   The Honeyed Hollow        honey underfoot that holds your boots
//   The Marionette Theatre    three lost masks to carry home; roving spotlights
//   The Prism Lighthouse      mirror chambers that bend a beam onto a crystal; lens sentries
//   The Sleeper's Dream       bridges that fade; nightmare trials; drowsiness fading away from the Sleeper
// and the flight of their shots (steerD4), which the rebuilt bosses still use.
import { lift, liftO } from './util.js';
import { TID, isSolid } from './world/maps.js';
import { ENEMIES } from './data/enemies.js';

const TAU = Math.PI * 2, R = Math.random;
const angleTo = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);
const dist = (x0, y0, x1, y1) => Math.hypot(x1 - x0, y1 - y0);
const inBox = (b, x, y, pad = 0) => x > b.x + pad && x < b.x + b.w - pad && y > b.y + pad && y < b.y + b.h - pad;
const SPECTRUM = ['spectrum_r', 'spectrum_o', 'spectrum_y', 'spectrum_g', 'spectrum_b', 'spectrum_v', 'spectrum_r'];

export const D4 = {
  // ================================================================ per-frame: traps, doors, and the bosses' lingering effects
  updateD4(dt) {
    const m = this.map, p = this.player, def = m.def || {}, S = (m.d4 = m.d4 || { timers: [], puddles: [] });
    for (const T of S.timers) T.t -= dt;
    for (const T of S.timers.filter((q) => q.t <= 0)) T.fn();
    S.timers = S.timers.filter((q) => q.t > 0);
    if (def.style === 'theatre') this.updateSpots(dt);
    if (m.beams) this.updateBeams();
    if (def.style === 'spire') this.updateSentries(dt);
    if (m.spans) this.updateSpans(dt);
    if (S.trial) this.updateTrial(dt);
    if (p.drowsy && !(this.map && this.map.bxDrowsy)) p.drowsy = Math.max(0, p.drowsy - dt);   // drowsiness fades away from the Sleeper (near it: src/bosses/the_sleeper.js)
  },
  d4Speed() {
    const p = this.player, t = this.map.tiles[Math.floor(p.y) * this.map.w + Math.floor(p.x)];
    return (t === TID.honey ? 0.5 : 1) * (p.carry ? 0.85 : 1);
  },
  later(t, fn) { const S = (this.map.d4 = this.map.d4 || { timers: [], puddles: [] }); S.timers.push({ t, fn }); },

  // ================================================================ THE THEATRE: masks and spotlights
  updateSpots(dt) {
    const m = this.map, p = this.player, S = m.d4;
    if (!S.spots) {
      S.spots = [];
      for (const rm of m.rooms) if (rm.kind === 'auditorium' || rm.kind === 'foyer') for (let k = 0; k < (rm.kind === 'auditorium' ? 3 : 2); k++) {
        S.spots.push({ rm, x: rm.cx + (R() - 0.5) * rm.w * 0.5, y: rm.cy + (R() - 0.5) * rm.h * 0.4, a: R() * TAU, sp: 2.2 + R(), r: 2.1, on: 0, cd: 0 });
      }
    }
    for (const L of S.spots) {
      if (Math.abs(L.x - p.x) > 30 || Math.abs(L.y - p.y) > 30) continue;
      L.a += (R() - 0.5) * dt * 1.4;
      const nx = L.x + Math.cos(L.a) * L.sp * dt, ny = L.y + Math.sin(L.a) * L.sp * dt;
      if (isSolid(m, nx, ny) || !inBox(L.rm, nx, ny, 1)) L.a += Math.PI * (0.6 + R() * 0.8); else { L.x = nx; L.y = ny; }
      L.cd = Math.max(0, L.cd - dt);
      const caught = !p.dead && dist(L.x, L.y, p.x, p.y) < L.r;
      L.on = caught ? L.on + dt : Math.max(0, L.on - dt * 2);
      if (L.on > 0.6 && !L.cd) {                       // CUE! every puppet in the house plays to you, faster
        L.cd = 7; L.on = 0;
        let n = 0;
        for (const e of this.enemies) if (!e.dead && !e.rb && dist(e.x, e.y, p.x, p.y) < 16) { e.cuedUntil = this.t + 6; n++; }
        this.banner(n ? 'CUE! The spotlight finds you: the puppets play faster!' : 'The spotlight finds you...', 1600);
        this.sfx('boss');
      }
    }
  },
  // ================================================================ THE LIGHTHOUSE: beams, mirrors, crystals, sentries, lenses
  traceBeam(B) {
    const m = this.map, pts = [[B.src.x + 0.5, B.src.y + 0.5]];
    let x = B.src.x, y = B.src.y, [dx, dy] = B.src.d, hit = false;
    for (let s = 0; s < 80; s++) {
      x += dx; y += dy;
      if (x === B.recv.x && y === B.recv.y) { hit = true; pts.push([x + 0.5, y + 0.5]); break; }
      const o = m.objects.find((q) => q.interact === 'mirror' && Math.floor(q.x) === x && Math.floor(q.y) === y);
      if (o) { pts.push([x + 0.5, y + 0.5]); [dx, dy] = o.state ? [dy, dx] : [-dy, -dx]; continue; }
      if (m.solid[y * m.w + x] || m.objects.some((q) => q.solid && Math.floor(q.x) === x && Math.floor(q.y) === y)) { pts.push([x + 0.5 - dx * 0.5, y + 0.5 - dy * 0.5]); break; }
    }
    if (pts.length === 1) pts.push([x + 0.5, y + 0.5]);
    return { pts, hit };
  },
  updateBeams() {
    const m = this.map, p = this.player;
    for (const B of m.beams) {
      if (Math.abs(B.src.x - p.x) > 26 || Math.abs(B.src.y - p.y) > 26) { B.path = null; continue; }
      const T = this.traceBeam(B); B.path = T.pts;
      if (T.hit && !B.lit) {
        B.lit = true;
        const o = m.objects.find((q) => q.receiver && Math.floor(q.x) === B.recv.x && Math.floor(q.y) === B.recv.y);
        if (o) o.sprite = 'receiver_on';
        this.vx({ k: 'burst', x: B.recv.x + 0.5, y: B.recv.y, n: 30, colors: ['#ffffff', '#fffbe0', '#c8a0ff', '#8af6ff'] });
        this.breakSeal('The crystal blazes with light!');
      }
    }
  },
  updateSentries(dt) {
    const m = this.map, p = this.player;
    for (const o of m.objects) {
      if (!o.sentry || Math.abs(o.x - p.x) > 14 || Math.abs(o.y - p.y) > 14) continue;
      o.ang = (o.ang ?? R() * TAU) + 0.55 * dt;
      o.cool = Math.max(0, (o.cool || 0) - dt);
      const want = angleTo(...lift(o.x, o.y, 0.5), ...lift(p.x, p.y, 0.4)), d = dist(o.x, o.y, p.x, p.y);
      const off = Math.abs(((want - o.ang + Math.PI * 3) % TAU) - Math.PI);
      let seen = !p.dead && d < 10 && off < 0.16 && !o.cool;
      if (seen) for (let k = 1; k < d * 3; k++) { const t = k / (d * 3); if (isSolid(m, o.x + (p.x - o.x) * t, o.y + (p.y - o.y) * t)) { seen = false; break; } }
      o.lock = seen ? (o.lock || 0) + dt : 0;
      if (seen) o.ang = want;                            // it has you: it tracks
      if (o.lock > 0.45) {
        o.lock = 0; o.cool = 1.8;
        for (let k = -1; k <= 1; k++) this.shoot('e', ...lift(o.x, o.y, 0.6), want + k * 0.12, 11, 11, 95, 'lensbolt', 0.4, false, 'a lens sentry');
        this.vx({ k: 'burst', ...liftO(o.x, o.y, 0.6), n: 8, colors: ['#ffffff', '#fffbe0'] });
      }
    }
  },
  // ================================================================ THE DREAM: fading bridges, trials
  updateSpans(dt) {
    const m = this.map, p = this.player, S = m.d4, pi = Math.floor(p.y) * m.w + Math.floor(p.x);
    const under = m.tiles[pi];
    if (under === TID.dreamfloor || under === TID.dreambridge) S.safe = { x: p.x, y: p.y };
    if (m.netWorld) {                                    // a shared dungeon: the server fades the bridges (its tiles come to us); we only fall
      this.trialLock(m);
      if (under === TID.fadegone && !p.dead) { const back = S.safe || { x: m.rooms[0].cx + 0.5, y: m.rooms[0].cy + 0.5 }; p.x = back.x; p.y = back.y; this.hurtPlayer(Math.round(this.stat("hp") * 0.15), "a fading dream", true); this.banner("The bridge fades and you fall through the dream!", 1600); }
      return;
    }
    for (const sp of m.spans) {
      if (!sp.fade && !sp.locked && sp.on !== false) continue;   // (a steady bridge: only while a trial locks it away, and back after)
      const c = (this.t + sp.phase) % sp.period, on = !sp.locked && (!sp.fade || c < sp.period * 0.64);
      sp.warn = on && c > sp.period * 0.64 - 0.9;
      if (on === sp.on) continue;
      sp.on = on;
      for (const i of sp.tiles) { m.tiles[i] = on ? (sp.fade ? TID.fadebridge : TID.dreambridge) : TID.fadegone; m.solid[i] = on ? 0 : 1; }
      if (!on && sp.tiles.includes(pi) && !p.dead) {     // it was under your feet: you fall through the dream
        const back = S.safe || { x: m.rooms[0].cx + 0.5, y: m.rooms[0].cy + 0.5 };
        p.x = back.x; p.y = back.y;
        this.hurtPlayer(Math.round(this.stat('hp') * 0.15), 'a fading dream', true);
        this.banner('The bridge fades and you fall through the dream!', 1600);
      }
    }
  },
  // A nightmare trial, told as a story: the sigil wakes and the bridges round its room fade (you are shut in); each wave
  // is announced, its nightmares rise where marks have glowed for a moment, and the checklist counts them down; a breath
  // between waves; the third brings their champion; then the nightmare fades and the bridges come back.
  // In a shared dungeon the server runs it (its monsters are the server's) and the sigil carries the state to everyone
  // (o.trialOn, o.wave, o.left); a browser there only follows.
  startTrial(o) {
    const m = this.map, S = m.d4 || (m.d4 = { timers: [], puddles: [] }), rm = m.rooms[o.room];
    if (o.done) { this.toast('This nightmare is already spent.'); return; }
    if (m.netWorld) return;                               // (the server starts it, for everyone)
    if (S.trial) { this.toast('Finish the trial you started first.'); return; }
    S.trial = { o, rm, wave: 0, waveT: 2.2, live: [], marks: null };
    o.trialOn = true; o.wave = 0; o.left = 0;
    this.trialLock(m);
    this.banner('A NIGHTMARE TRIAL. The bridges fade: survive three waves!', 2600);
    this.sfx('boss'); this.vx({ k: 'shake', amt: 5 });
    o.sprite = 'dream_sigil_live';
  },
  // the bridges near a live trial's room are locked away; near a spent one's they come back for good, and steady (no more
  // fading there: the nightmare is over). From the sigils: the same in every copy of the dungeon
  trialLock(m) {
    const pad = 4, rooms = (f) => m.objects.filter((q) => q.interact === 'sigil' && f(q)).map((q) => m.rooms[q.room]).filter(Boolean);
    const live = rooms((q) => q.trialOn), spent = rooms((q) => q.done);
    const by = (sp, rm) => sp.tiles.some((i) => { const x = i % m.w, y = Math.floor(i / m.w); return x > rm.x - pad && x < rm.x + rm.w + pad && y > rm.y - pad && y < rm.y + rm.h + pad; });
    for (const sp of m.spans) {
      sp.locked = live.some((rm) => by(sp, rm));
      if (!sp.locked && sp.fade && spent.some((rm) => by(sp, rm))) { sp.fade = false; sp.on = false; sp.warn = false; }   // (sp.on false: laid again, steady, on the next step)
    }
  },
  updateTrial(dt) {
    const m = this.map, S = m.d4, T = S.trial;
    T.live = T.live.filter((e) => !e.dead);
    T.o.left = T.live.length;
    if (T.live.length) return;
    if (T.holdT > 0) { T.holdT -= dt; return; }           // (a moment for the marks to glow before they rise)
    if (T.marks) {                                        // the marks have glowed: the wave rises from them
      const n0 = this.enemies.length;
      this.spawnPending(T.marks);
      T.live = this.enemies.slice(n0);
      for (const e of T.live) { e.seen = true; e.aggro = true; this.unstick(e, 0.5); this.vx({ k: 'burst', x: e.x, y: e.y - 0.5, n: 14, colors: ['#c8a0ff', '#2a1040', '#ffffff'] }); }
      T.marks = null; T.o.left = T.live.length; T.waveT = 2.5;
      return;
    }
    if ((T.waveT -= dt) > 0) return;
    if (T.wave >= 3) {                                    // the nightmare is spent
      S.trial = null; T.o.done = true; T.o.trialOn = false; T.o.sprite = 'dream_sigil_done'; T.o.left = 0;
      this.trialLock(m);
      this.breakSeal('The nightmare fades, and the bridges return.');
      return;
    }
    T.wave++; T.o.wave = T.wave;
    T.marks = this.dungeonFill(T.rm, 2 + T.wave, T.wave === 3);
    for (const [, x, y] of T.marks) this.fx.push({ kind: 'ring', x, y, t: 0, max: 1.2, color: '#c8a0ff' });   // where they will rise
    T.waveT = 0;
    this.banner(T.wave === 3 ? 'Nightmare: the last wave, and their champion!' : `Nightmare: wave ${T.wave} of 3`, 1800);
    this.vx({ k: 'shake', amt: 3 });
    T.holdT = 1.1;
  },

  // ================================================================ interactions (F)
  interactD4(o) {
    const m = this.map, p = this.player;
    if (o.interact === 'mirror') {
      o.state = 1 - o.state; o.sprite = o.state ? 'mirror_b' : 'mirror_a';
      this.vx({ k: 'burst', ...liftO(o.x, o.y, 0.5), n: 6, colors: ['#ffffff', '#c8e8ff'] }); this.sfx('coin');
      return true;
    }
    if (o.interact === 'mask') {
      if (p.carry) { this.toast('You are already carrying a mask.'); return true; }
      p.carry = o.mask; m.objects.splice(m.objects.indexOf(o), 1);
      this.banner(`You take up the ${{ mask_comedy: 'Mask of Comedy', mask_tragedy: 'Mask of Tragedy', mask_silence: 'Mask of Silence' }[o.mask]}. Carry it to the stand before the stage.`, 2600);
      this.sfx('rare');
      return true;
    }
    if (o.interact === 'maskstand') {
      if (!p.carry) { this.toast(`The stand holds ${(m.d4 && m.d4.masks) || 0} of 3 masks.`); return true; }
      const S = m.d4 || (m.d4 = { timers: [], puddles: [] });
      S.masks = (S.masks || 0) + 1; p.carry = null;
      o.sprite = S.masks >= 3 ? 'mask_stand_full' : 'mask_stand';
      this.vx({ k: 'burst', ...liftO(o.x, o.y, 0.8), n: 24, colors: ['#ffd650', '#ffffff', '#c83a5a'] });
      this.breakSeal('The mask returns to its stand.');
      return true;
    }
    if (o.interact === 'sigil') { this.startTrial(o); return true; }
    return false;
  },
  // ================================================================ the new shots' flight
  steerD4(b, dt, M) {
    if (M.swarm) {                                        // jitter, and nose toward you
      const W = M.swarm, f = this.player;
      b.ha += (R() - 0.5) * W.jitter * dt * 6;
      const want = angleTo(b.x, b.y, ...lift(f.x, f.y, 0.4)); let da = ((want - b.ha + Math.PI * 3) % TAU) - Math.PI;
      b.ha += Math.max(-W.seek * dt, Math.min(W.seek * dt, da));
    }
    if (M.fig) {                                          // the figure-eight, then away
      const F = M.fig;
      if (b.t < F.T) {
        const s = F.s0 + (b.t / F.T) * TAU, lx = Math.sin(s) * F.r, ly = Math.sin(2 * s) * F.r * 0.5, c = Math.cos(F.a0), sn = Math.sin(F.a0);
        const nx = F.cx + lx * c - ly * sn, ny = F.cy + lx * sn + ly * c;
        b.a = Math.atan2(ny - b.y, nx - b.x); b.x = nx; b.y = ny; b.vx = 0; b.vy = 0;
        return false;
      }
      if (!b.freed) { b.freed = true; b.ha = F.a0 + (R() - 0.5) * 1.2; b.hs = F.sp; }
    }
    if (M.scis) {                                         // the scissor blades swing shut on your line, then fly
      const Sc = M.scis;
      if (b.t < Sc.T) {
        const k = Math.min(1, b.t / Sc.T), ease = k * k * (3 - 2 * k), a = Sc.a + (Sc.to - Sc.a) * ease;
        b.x = Sc.cx + Math.cos(a) * Sc.d; b.y = Sc.cy + Math.sin(a) * Sc.d; b.vx = 0; b.vy = 0; b.a = a;
        return false;
      }
      if (!b.freed) { b.freed = true; b.ha = Sc.to; b.hs = Sc.out; }
    }
    if (M.helix) {                                        // a spiral path: out, and around
      const Hx = M.helix, r0 = Hx.v * b.t, a = Hx.a0 + Hx.w * b.t;
      const nx = Hx.cx + Math.cos(a) * r0, ny = Hx.cy + Math.sin(a) * r0;
      b.a = Math.atan2(ny - b.y, nx - b.x); b.x = nx; b.y = ny; b.vx = 0; b.vy = 0;
      return false;
    }
    if (M.jerk) b.hs = (Math.floor(b.t / M.jerk) % 2 ? 0.25 : 1.6) * b.s0;      // stop, start, stop, start
    if (M.serp) b.ha += Math.sin(b.t * 7) * M.serp * (b.cs || 1) * dt;          // snaking side to side
    if (M.hop) b.hs = b.s0 * (0.35 + 1.3 * Math.abs(Math.sin((b.t / M.hop) * Math.PI)));   // a sheep's bound
    if (M.lull) b.hs = b.s0 * (0.7 + 0.3 * Math.sin(b.t * 3));
    if (M.blink) { const c = b.t % (M.blink[0] + M.blink[1]); b.ghost = c > M.blink[0]; }
    if (M.refract && b.t >= M.refract && !b.bent) {      // it hits an invisible facet and splits at right angles
      b.bent = true;
      for (const s of [-1, 1]) { const c = this.shoot('e', b.x, b.y, b.ha + s * Math.PI / 2, b.hs, 6, b.dmg, b.sprite, 0.36, false, b.by); c.cs = s; c.shard = true; }
      this.vx({ k: 'burst', x: b.x, y: b.y, n: 4, colors: ['#ffffff', '#c8a0ff'] });
    }
    if (M.disperse && b.t >= M.disperse) {               // white light breaks into its colours
      const n = M.fan || 7;
      for (let k = 0; k < n; k++) this.shoot('e', b.x, b.y, b.ha + (k / (n - 1) - 0.5) * 1.3, b.hs * 0.85, 9, Math.round(b.dmg * 0.8), SPECTRUM[k % SPECTRUM.length], 0.36, false, b.by).shard = true;
      this.vx({ k: 'burst', x: b.x, y: b.y, n: 10, colors: ['#ff4a5a', '#ffd650', '#7aff9a', '#6ab4ff', '#c88aff'] });
      return true;
    }
    return undefined;
  },
};
export function installD4(Game) { Object.assign(Game.prototype, D4); }
void ENEMIES;
