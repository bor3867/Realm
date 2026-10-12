// The four newer dungeons' own mechanics, installed onto the Game (see the bottom of game.js).
//   The Honeyed Hollow        honey that holds your boots; the Queen's brood, waggle-dance, honey rain and hex-stings
//   The Marionette Theatre    three lost masks to carry home; roving spotlights; the Puppeteer's trapdoors, curtain,
//                             mirror-puppet, scissors, jigs and ribbons, and his intermission
//   The Prism Lighthouse      mirror chambers that bend a beam onto a crystal; lens sentries; the Wyrm who is only
//                             real inside the lens light, her spectrum bolts, sunbeam, glass rain, helix and images
//   The Sleeper's Dream       bridges that fade; nightmare trials; drowsiness; dream-shift, dream-logic, sheep,
//                             lullabies, blinking stars, crescent tides, and the alarms that wake it
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
    // the Queen's brood: cells hatch unless they are broken in time
    for (const e of this.enemies) if (e.id === 'brood_cell' && !e.dead && (e.hatchT -= dt) <= 0) {
      e.dead = true; e.deadT = 0;
      const kid = this.addEnemy(e.kid || 'worker_bee', e.x, e.y); kid.seen = true;
      this.vx({ k: 'burst', x: e.x, y: e.y - 0.4, n: 14, colors: ['#ffd650', '#fff6c8', '#5a3a10'] });
    }
    // honey puddles from the Queen's rain set, then dry
    for (const P of S.puddles) if ((P.t -= dt) <= 0) for (const [i, t0] of P.tiles) if (m.tiles[i] === TID.honey) m.tiles[i] = t0;
    S.puddles = S.puddles.filter((P) => P.t > 0);
    // drips telegraph, then land
    if (S.drips) for (const Dp of S.drips) if ((Dp.t -= dt) <= 0 && !Dp.done) this.landDrip(Dp);
    if (S.drips) S.drips = S.drips.filter((Dp) => !Dp.done || Dp.t > -0.4);
    // the curtain: velvet closes in from both sides of the stage
    const C = S.curtain;
    if (C) {
      C.t += dt;
      const k = this.curtainK(C), half = C.box.w * C.close * k;
      if (k > 0.85 && !p.dead && (C.tick -= dt) <= 0 && (p.x < C.box.x + half || p.x > C.box.x + C.box.w - half)) { C.tick = 0.5; this.hurtPlayer(C.dmg, 'the curtain'); }
      if (C.t >= C.dur) S.curtain = null;
    }
    // the sunbeam: a column of focused light that follows you, a breath behind
    const SB = S.sun;
    if (SB) {
      SB.t += dt;
      SB.x += (p.x - SB.x) * Math.min(1, dt / SB.lag); SB.y += (p.y - SB.y) * Math.min(1, dt / SB.lag);
      if (SB.t > 0.7 && !p.dead && dist(SB.x, SB.y, p.x, p.y) < SB.r && (SB.tick -= dt) <= 0) { SB.tick = 0.35; this.hurtPlayer(SB.dmg, 'the sunbeam'); }
      if (SB.t >= SB.dur) S.sun = null;
    }
    // the mirror-puppet: it stands where your reflection would, and answers every shot you fire
    const MP = S.mimic;
    if (MP) {
      MP.t -= dt;
      const e = MP.e, b = MP.box, cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      if (e && !e.dead) {
        e.x = 2 * cx - p.x; e.y = 2 * cy - p.y; e.face = p.x > cx;
        if (p.lastShot && p.lastShot !== MP.last && !p.dead) {
          MP.last = p.lastShot;
          const a = angleTo(e.x, e.y - 0.5, p.x, p.y - 0.4);
          this.shoot('e', e.x, e.y - 0.5, a, 8, 14, MP.dmg, 'puppet_string', 0.35, false, 'your mirror-puppet');
        }
      }
      if (MP.t <= 0 || !MP.e || MP.e.dead) { if (MP.e) { MP.e.dead = true; MP.e.deadT = 0; } S.mimic = null; }
    }
    // the dream shift: while it dreams of nightmares, its true body sleeps, unhurt
    if (S.shift && this.t >= S.shift.until) this.endShift();
    // drowsiness: in the Sleeper's room, stillness becomes sleep
    const B = this.d4Boss();
    if (B && B.D.drowsy && B.state !== 'sleep' && !p.dead) {
      p.drowsy = Math.max(0, Math.min(1, (p.drowsy || 0) + (p.moving ? -0.22 : 0.3) * dt));
      if (p.drowsy >= 1) { p.drowsy = 0; p.status.asleep = 1.5; this.banner('You fall asleep!', 1400); this.float(p.x, p.y - 1.4, 'Zzz', '#c8b0ff'); }
    } else if (p.drowsy) p.drowsy = Math.max(0, p.drowsy - dt);
    if (B && B.D.prismatic) this.updateLens(B, dt);
  },
  d4Box(e) { const A = this.arenaBox(e); return { x: A.x0, y: A.y0, w: A.x1 - A.x0, h: A.y1 - A.y0 }; },
  d4Boss() { return this.enemies.find((e) => e.rb && !e.dead && this.map.kind === 'dungeon') || null; },
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
      const want = angleTo(o.x, o.y - 0.5, p.x, p.y - 0.4), d = dist(o.x, o.y, p.x, p.y);
      const off = Math.abs(((want - o.ang + Math.PI * 3) % TAU) - Math.PI);
      let seen = !p.dead && d < 10 && off < 0.16 && !o.cool;
      if (seen) for (let k = 1; k < d * 3; k++) { const t = k / (d * 3); if (isSolid(m, o.x + (p.x - o.x) * t, o.y + (p.y - o.y) * t)) { seen = false; break; } }
      o.lock = seen ? (o.lock || 0) + dt : 0;
      if (seen) o.ang = want;                            // it has you: it tracks
      if (o.lock > 0.45) {
        o.lock = 0; o.cool = 1.8;
        for (let k = -1; k <= 1; k++) this.shoot('e', o.x, o.y - 0.6, want + k * 0.12, 11, 11, 95, 'lensbolt', 0.4, false, 'a lens sentry');
        this.vx({ k: 'burst', x: o.x, y: o.y - 0.6, n: 8, colors: ['#ffffff', '#fffbe0'] });
      }
    }
  },
  // the Wyrm's lantern room: stand on a pedestal and its lens focuses on her, breaking her glass while you hold it
  updateLens(e, dt) {
    const m = this.map, p = this.player, S = m.d4;
    if (!S.peds) S.peds = m.objects.filter((o) => o.pedestal !== undefined).map((o) => ({ o, heat: 0, cool: 0 }));
    let exposedNow = false;
    for (const P of S.peds) {
      P.cool = Math.max(0, P.cool - dt); P.beam = null;
      const on = !p.dead && !P.cool && dist(P.o.x, P.o.y, p.x, p.y) < 1.0 && e.state !== 'sleep';
      if (!on) { P.heat = Math.max(0, P.heat - dt * 0.25); continue; }
      P.heat += dt / 5;
      // the light goes to the Wyrm, unless one of her images stands in its way
      const tx = e.x, ty = e.y - 1.2, ax = P.o.x, ay = P.o.y - 0.6;
      let target = e;
      for (const im of this.enemies) {
        if (im.id !== 'prism_image' || im.dead) continue;
        const L2 = (tx - ax) ** 2 + (ty - ay) ** 2, t = Math.max(0, Math.min(1, ((im.x - ax) * (tx - ax) + (im.y - 1 - ay) * (ty - ay)) / L2));
        if (dist(ax + (tx - ax) * t, ay + (ty - ay) * t, im.x, im.y - 1) < 1.3 && dist(ax, ay, im.x, im.y) < dist(ax, ay, e.x, e.y)) target = im;
      }
      P.beam = { x0: ax, y0: ay, x1: target.x, y1: target.y - 1.2 };
      if (target === e) exposedNow = true;
      else if ((target.burnT = (target.burnT || 0) + dt) > 0.8) { target.dead = true; target.deadT = 0; this.vx({ k: 'burst', x: target.x, y: target.y - 1, n: 30, colors: ['#ffffff', '#c8a0ff', '#8af6ff'] }); this.float(target.x, target.y - 2, 'SHATTERED', '#ffffff'); }
      if (P.heat >= 1) { P.heat = 0; P.cool = 7; this.banner('The lens overheats! Find another.', 1400); }
    }
    if (exposedNow) {
      e.exposedUntil = this.t + 0.15;
      e.exposedFor = (e.exposedFor || 0) + dt;
      const ph = e.D.phases[e.phaseIdx];
      if (ph && ph.overcharge && e.exposedFor > 2.2) {    // held too long: she drinks the light and throws it back
        e.exposedFor = 0;
        for (let k = 0; k < 28; k++) this.shoot('e', e.x, e.y - 1.2, (k / 28) * TAU, 5 + (k % 2), 12, 130, SPECTRUM[k % 6], 0.4, false, e.D.name);
        this.banner('OVERCHARGE! She throws the light back!', 1400); this.vx({ k: 'shake', amt: 6 });
      }
    } else e.exposedFor = Math.max(0, (e.exposedFor || 0) - dt * 2);
  },
  // ================================================================ THE DREAM: fading bridges, trials
  updateSpans(dt) {
    const m = this.map, p = this.player, S = m.d4, pi = Math.floor(p.y) * m.w + Math.floor(p.x);
    const under = m.tiles[pi];
    if (under === TID.dreamfloor || under === TID.dreambridge) S.safe = { x: p.x, y: p.y };
    for (const sp of m.spans) {
      if (!sp.fade && !sp.locked) continue;
      const c = (this.t + sp.phase) % sp.period, on = !sp.locked && c < sp.period * 0.64;
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
  startTrial(o) {
    const m = this.map, S = m.d4 || (m.d4 = { timers: [], puddles: [] }), rm = m.rooms[o.room];
    if (S.trial) { this.toast('Finish the trial you started first.'); return; }
    if (o.done) { this.toast('This nightmare is already spent.'); return; }
    const pad = 4;
    S.trial = { o, rm, wave: 0, waveT: 1.2, live: [] };
    for (const sp of m.spans) if (sp.tiles.some((i) => { const x = i % m.w, y = Math.floor(i / m.w); return x > rm.x - pad && x < rm.x + rm.w + pad && y > rm.y - pad && y < rm.y + rm.h + pad; })) sp.locked = true;
    this.banner('A NIGHTMARE TRIAL. The bridges vanish: survive three waves!', 2400);
    this.sfx('boss'); this.vx({ k: 'shake', amt: 5 });
    o.sprite = 'dream_sigil_live';
  },
  updateTrial(dt) {
    const m = this.map, S = m.d4, T = S.trial;
    T.live = T.live.filter((e) => !e.dead);
    if (T.live.length) return;
    if ((T.waveT -= dt) > 0) return;
    if (T.wave >= 3) {                                    // the nightmare is spent
      S.trial = null; T.o.done = true; T.o.sprite = 'dream_sigil_done';
      for (const sp of m.spans) sp.locked = false;
      this.breakSeal('The nightmare fades.');
      return;
    }
    T.wave++; T.waveT = 1.5;
    const n0 = this.enemies.length;
    this.spawnPending(this.dungeonFill(T.rm, 2 + T.wave, T.wave === 3));
    T.live = this.enemies.slice(n0);
    for (const e of T.live) { e.seen = true; this.unstick(e, 0.5); }
    this.banner(`Nightmare: wave ${T.wave} of 3`, 1400);
  },

  // ================================================================ interactions (F)
  interactD4(o) {
    const m = this.map, p = this.player;
    if (o.interact === 'mirror') {
      o.state = 1 - o.state; o.sprite = o.state ? 'mirror_b' : 'mirror_a';
      this.vx({ k: 'burst', x: o.x, y: o.y - 0.5, n: 6, colors: ['#ffffff', '#c8e8ff'] }); this.sfx('coin');
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
      this.vx({ k: 'burst', x: o.x, y: o.y - 0.8, n: 24, colors: ['#ffd650', '#ffffff', '#c83a5a'] });
      this.breakSeal('The mask returns to its stand.');
      return true;
    }
    if (o.interact === 'sigil') { this.startTrial(o); return true; }
    if (o.interact === 'alarm') {
      if (o.rung) return true;
      o.rung = true; o.sprite = 'alarm_ringing';
      this.vx({ k: 'burst', x: o.x, y: o.y - 0.6, n: 24, colors: ['#ffd650', '#ffffff'] }); this.vx({ k: 'shake', amt: 4 }); this.sfx('boss');
      const left = m.objects.filter((q) => q.interact === 'alarm' && !q.rung).length;
      const e = this.d4Boss();
      if (!left && e) {
        e.wakeLock = false; e.wokeUntil = this.t + 999; e.state = 'idle'; e.st = 3;
        this.banner('THE ALARMS RING. IT WAKES, AND IT IS WEAK!', 2600);
      } else this.banner(`RIIING! ${left} alarm${left === 1 ? '' : 's'} left.`, 1200);
      return true;
    }
    return false;
  },
  // when the dreamer's nightmare-self is hurt, the dreamer is hurt
  d4Immune(e, x, y, quiet) {
    if (e.hidden) return true;
    if (e.D.prismatic && !(e.exposedUntil > this.t)) { if (!quiet) this.float(x, y - 0.8, 'GLASS', '#c8e8ff'); return true; }
    if (e.wakeLock) { if (!quiet) this.float(x, y - 0.8, 'ASLEEP', '#c8b0ff'); return true; }
    if (e.D.drowsy && this.map.d4 && this.map.d4.shift) { if (!quiet) this.float(x, y - 0.8, 'DREAMING', '#ff7ab8'); return true; }
    return false;
  },
  d4DamageMult(e) { return (e.severedUntil > this.t ? 2 : 1) * (e.wokeUntil > this.t ? 2.5 : 1); },
  d4LinkHit(e, dmg) {                                     // the nightmare passes its wounds to the sleeper
    if (e.id !== 'sleepers_nightmare') return false;
    const B = this.d4Boss();
    if (B) { const was = this.map.d4.shift; this.map.d4.shift = null; this.damageEnemy(B, dmg, B.x, B.y - 1.4, true); this.map.d4.shift = was; }
    return true;
  },

  // ================================================================ boss phases and moves
  onPhaseD4(e, ph) {
    if (ph.intermission) {                                // the Puppeteer leaves the stage to his understudies
      e.hidden = true; e.hideUntil = this.t + ph.intermission;
      const b = this.d4Box(e);
      e.understudies = [0, 1, 2].map((k) => { const a = k * TAU / 3, u = this.addEnemy('understudy', b.x + b.w / 2 + Math.cos(a) * 6, b.y + b.h / 2 + Math.sin(a) * 4); u.seen = true; this.unstick(u, 0.5); return u; });
      this.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 30, colors: ['#ffd650', '#c83a5a', '#ffffff'] });
    }
    if (ph.wake) {                                        // the Sleeper cannot be hurt until the alarms ring
      e.wakeLock = true;
      const b = this.d4Box(e), cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      for (let k = 0; k < ph.wake; k++) {
        const a = -Math.PI / 2 + k * TAU / ph.wake, x = Math.floor(cx + Math.cos(a) * b.w * 0.33), y = Math.floor(cy + Math.sin(a) * b.h * 0.33);
        this.map.objects.push({ sprite: 'alarm_clock', x: x + 0.5, y: y + 0.5, solid: false, interact: 'alarm', label: 'Ring the alarm' });
      }
    }
    if (ph.overcharge) e.exposedFor = 0;
  },
  bossD4Tick(e, dt) {
    if (!e.openedFirst && e.state === 'idle' && e.D.phases && e.D.phases[0].open && e.st <= dt) {   // the first phase's opening move
      e.openedFirst = true;
      const M = e.D.moves[e.D.phases[0].open];
      e.move = { ...M, special: true }; e.special = true; e.state = 'tell'; e.st = M.tell;
      return true;
    }
    if (e.trap) {                                         // under the stage: the hatches flicker in turn; he comes up out of the last
      e.invulnT = 0.5;
      const T = e.trap;
      if (this.t >= T.until) {
        const H = T.hatches[T.hatches.length - 1];
        e.x = H.x; e.y = H.y; e.hidden = false; e.trap = null; e.st = 0.8; e.state = 'idle';
        const B = T.burst, [ox, oy] = this.up(e.x, e.y, 1.4), a0 = R() * TAU;
        for (let k = 0; k < B.n; k++) { const b = this.shoot('e', ox, oy, a0 + k * TAU / B.n, B.speed, 11, B.dmg, B.proj, 0.36, false, e.D.name); b.mv = { d4: true, serp: 2.2 }; }
        this.vx({ k: 'burst', x: e.x, y: e.y - 0.6, n: 20, colors: ['#ffd650', '#c83a5a', '#ffffff'] }); this.vx({ k: 'shake', amt: 4 });
        (this.map.d4 = this.map.d4 || { timers: [], puddles: [] }).hatches = [];
      }
      return true;
    }
    if (e.hidden) {
      e.invulnT = 0.5;
      const left = (e.understudies || []).filter((u) => !u.dead).length;
      if (!left || this.t >= e.hideUntil) {
        e.hidden = false; e.st = 1; e.state = 'idle';
        for (const u of e.understudies || []) if (!u.dead) { u.dead = true; u.deadT = 0; }
        this.banner(left ? 'The Maestro returns, and his understudies bow out.' : 'Bravo! The Maestro returns to an empty stage, furious.', 2200);
        if (!left) e.severedUntil = this.t + 6;
        this.vx({ k: 'shake', amt: 5 });
      }
      return true;
    }
    return false;
  },
  bossD4Move(e, M) {
    const m = this.map, p = this.player, by = e.D.name, box = this.d4Box(e), [ox, oy] = this.up(e.x, e.y, 1.4);
    const S = m.d4 || (m.d4 = { timers: [], puddles: [] });
    const aim = angleTo(ox, oy, p.x, p.y - 0.4);
    // ---- the Queen
    if (M.hexburst) {                                     // stings from six points of a hexagon, ring after ring
      const H = M.hexburst;
      for (let ring = 0; ring < H.rings; ring++) this.later(ring * H.gap + 0.001, () => {
        const base = R() * TAU / 6 + ring * 0.52;
        for (let k = 0; k < 6; k++) for (let j = 0; j < H.per; j++) {
          const a = base + k * TAU / 6 + (j - (H.per - 1) / 2) * H.spread;
          this.shoot('e', ox + Math.cos(base + k * TAU / 6) * 0.9, oy + Math.sin(base + k * TAU / 6) * 0.9, a, H.speed, 10, H.dmg, H.proj, 0.38, false, by);
        }
      });
    }
    if (M.swarm) {                                        // a stream of little bees, jittering, nosing toward you
      const W = M.swarm;
      for (let k = 0; k < W.n; k++) this.later(k * W.every + 0.001, () => {
        const b = this.shoot('e', ox, oy, angleTo(ox, oy, p.x, p.y - 0.4) + (R() - 0.5) * 0.8, W.speed, 14, W.dmg, W.proj, 0.32, false, by);
        b.mv = { d4: true, swarm: W };
      });
    }
    if (M.brood) {                                        // she lays her brood about the room: break the cells before they hatch
      const B = M.brood;
      for (let k = 0; k < B.n; k++) {
        for (let t = 0; t < 20; t++) {
          const x = box.x + 2 + R() * (box.w - 4), y = box.y + 2 + R() * (box.h - 4);
          if (isSolid(m, x, y) || dist(x, y, p.x, p.y) < 3) continue;
          const c = this.addEnemy('brood_cell', x, y); c.hatchT = B.hatch; c.kid = B.kid; c.seen = true; break;
        }
      }
      this.banner('She lays her brood! Break the cells before they hatch!', 1800);
    }
    if (M.waggle) {                                       // the waggle dance: nectar traces a figure-eight round her, then flies
      const W = M.waggle, a0 = aim;
      for (let k = 0; k < W.n; k++) {
        const b = this.shoot('e', ox, oy, a0, 0, 30, W.dmg, W.proj, 0.38, false, by);
        b.mv = { d4: true, fig: { cx: ox, cy: oy, a0, r: W.r, T: W.dur, s0: (k / W.n) * TAU, sp: W.speed } };
        b.life = W.dur + 3;
      }
    }
    if (M.drip) {                                         // honey rain: drops fall on marked ground and leave it sticky
      const Dr = M.drip; S.drips = S.drips || [];
      for (let k = 0; k < Dr.n; k++) {
        const x = k ? p.x + (R() - 0.5) * 9 : p.x, y = k ? p.y + (R() - 0.5) * 9 : p.y;
        S.drips.push({ x, y, t: Dr.delay + k * 0.08, T: Dr.delay, r: Dr.r, dmg: Dr.dmg, puddle: Dr.puddle, proj: Dr.proj, by });
      }
    }
    // ---- the Puppeteer
    if (M.trapdoor) {                                     // down through a trapdoor: three hatches light in turn, and up he comes from the last, near you
      const Tr = M.trapdoor, hatches = [];
      for (let k = 0; k < Tr.n; k++) {
        const near = k === Tr.n - 1, a = R() * TAU, d = near ? 3 + R() * 1.5 : 5 + R() * 5;
        let x = near ? p.x + Math.cos(a) * d : box.x + 3 + R() * (box.w - 6), y = near ? p.y + Math.sin(a) * d : box.y + 3 + R() * (box.h - 6);
        x = Math.max(box.x + 2, Math.min(box.x + box.w - 2, x)); y = Math.max(box.y + 2, Math.min(box.y + box.h - 2, y));
        hatches.push({ x, y, at: this.t + (k + 1) * (Tr.hide / (Tr.n + 0.5)) });
      }
      this.vx({ k: 'burst', x: e.x, y: e.y - 0.4, n: 16, colors: ['#5a3a22', '#2a1a10', '#ffd650'] });
      e.hidden = true; e.trap = { until: this.t + Tr.hide, hatches, burst: Tr.burst };
      (this.map.d4 = this.map.d4 || { timers: [], puddles: [] }).hatches = hatches;
      this.banner('He drops through a trapdoor! Watch the hatches...', 1800);
    }
    if (M.jig) {                                          // a jig: rings of shots that stop and start like a puppet on a string
      const J = M.jig;
      for (let w = 0; w < J.waves; w++) this.later(w * J.gap + 0.001, () => {
        const base = R() * TAU;
        for (let k = 0; k < J.arms; k++) { const b = this.shoot('e', ox, oy, base + k * TAU / J.arms, J.speed, 11, J.dmg, J.proj, 0.36, false, by); b.mv = { d4: true, jerk: J.step }; }
      });
    }
    if (M.scissors) {                                     // two blades of shots open wide either side of you, then snap shut
      const Sc = M.scissors;
      for (const side of [-1, 1]) for (let k = 1; k <= Sc.n; k++) {
        const b = this.shoot('e', ox, oy, aim, 0, 30, Sc.dmg, Sc.proj, 0.38, false, by);
        b.mv = { d4: true, scis: { cx: ox, cy: oy, d: k * Sc.len / Sc.n, a: aim + side * Sc.open, to: aim, T: Sc.dur, out: 6 } };
        b.life = Sc.dur + 2.5;
      }
    }
    if (M.curtain) { S.curtain = { t: 0, dur: M.curtain.dur, close: M.curtain.close, dmg: M.curtain.dmg, box, tick: 0 }; this.banner('The curtains close! Keep to centre stage!', 1800); }
    if (M.mimic) {
      if (S.mimic && S.mimic.e) S.mimic.e.dead = true;
      const pm = this.addEnemy('mirror_puppet', 2 * (box.x + box.w / 2) - p.x, 2 * (box.y + box.h / 2) - p.y); pm.seen = true;
      S.mimic = { e: pm, t: M.mimic.dur, box, dmg: 70, last: p.lastShot };
      this.banner('A mirror-puppet of you! It answers every shot you fire.', 2200);
    }
    if (M.ribbons) {                                      // ribbons: shots that snake from side to side as they fly
      const Rb = M.ribbons;
      for (let k = 0; k < Rb.n; k++) {
        const b = this.shoot('e', ox, oy, aim + (k / (Rb.n - 1) - 0.5) * Rb.arc, Rb.speed, 12, Rb.dmg, Rb.proj, 0.38, false, by);
        b.mv = { d4: true, serp: Rb.serp }; b.cs = k % 2 ? -1 : 1;
      }
    }
    // ---- the Wyrm
    if (M.disperse) {                                     // a white bolt that breaks into a fan of every colour
      const Dp = M.disperse;
      for (let k = 0; k < Dp.n; k++) {
        const b = this.shoot('e', ox, oy, aim + (Dp.n > 1 ? (k / (Dp.n - 1) - 0.5) * Dp.arc : 0), Dp.speed, 12, Dp.dmg, Dp.proj, 0.42, false, by);
        b.mv = { d4: true, disperse: Dp.at, fan: Dp.fan };
      }
    }
    if (M.sunbeam) { S.sun = { x: p.x, y: p.y, t: 0, dur: M.sunbeam.dur, r: M.sunbeam.r, lag: M.sunbeam.lag, dmg: M.sunbeam.dmg, tick: 0 }; this.banner('The great lens focuses on you!', 1400); }
    if (M.glassrain) {                                    // panes fall down the room in columns, the gaps shifting each wave
      const G = M.glassrain;
      for (let w = 0; w < G.waves; w++) this.later(w * G.gap + 0.001, () => {
        const gap = Math.floor(R() * (G.cols - G.gaps));
        for (let c = 0; c < G.cols; c++) {
          if (c >= gap && c < gap + G.gaps) continue;
          const x = box.x + 1 + (c + 0.5) * (box.w - 2) / G.cols;
          this.shoot('e', x, box.y + 1, Math.PI / 2, G.speed, box.h, G.dmg, G.proj, 0.4, false, by);
        }
      });
    }
    if (M.helix) {                                        // light winding out of her along spiral paths
      const Hx = M.helix, a0 = R() * TAU;
      for (let k = 0; k < Hx.n; k++) this.later(k * Hx.every + 0.001, () => {
        for (let j = 0; j < Hx.arms; j++) {
          const b = this.shoot('e', ox, oy, 0, 0, 30, Hx.dmg, Hx.proj, 0.36, false, by);
          b.mv = { d4: true, helix: { cx: ox, cy: oy, a0: a0 + j * TAU / Hx.arms, w: Hx.w * (k % 2 ? 1 : -1), v: Hx.v } }; b.life = 4.5;
        }
      });
    }
    if (M.images) {                                       // false Wyrms of light: they fire too, and they block the lens
      for (const im of this.enemies) if (im.id === 'prism_image' && !im.dead) im.dead = true;
      for (let k = 0; k < M.images.n; k++) { const im = this.addEnemy('prism_image', e.x + (k ? 5 : -5), e.y); im.seen = true; im.image = true; this.unstick(im, 1); }
      this.banner('She splits into images of light! Burn them with the lens.', 2000);
    }
    if (M.shuffle) {                                      // the pedestals slide to new places
      for (const P of (S.peds || [])) {
        for (let t = 0; t < 30; t++) {
          const x = Math.floor(box.x + 3 + R() * (box.w - 6)), y = Math.floor(box.y + 3 + R() * (box.h - 6));
          if (isSolid(m, x + 0.5, y + 0.5) || S.peds.some((q) => q !== P && dist(q.o.x, q.o.y, x, y) < 7)) continue;
          P.o.x = x + 0.5; P.o.y = y + 0.5; P.heat = 0; break;
        }
      }
      this.banner('The lens pedestals slide across the floor!', 1400);
    }
    // ---- the Sleeper
    if (M.sheep) {                                        // counting sheep: flocks hop across the room, row by row, leaving one gap
      const Sh = M.sheep;
      for (let r0 = 0; r0 < Sh.rows; r0++) this.later(r0 * 0.6 + 0.001, () => {
        const dir = r0 % 2 ? -1 : 1, gap = Math.floor(R() * Sh.n);
        for (let k = 0; k < Sh.n; k++) {
          if (k === gap) continue;
          const y = box.y + 1.5 + (k + 0.5) * (box.h - 3) / Sh.n, x = dir > 0 ? box.x + 1 : box.x + box.w - 1;
          const b = this.shoot('e', x, y, dir > 0 ? 0 : Math.PI, Sh.speed, box.w, Sh.dmg, Sh.proj, 0.42, false, by);
          b.mv = { d4: true, hop: Sh.hop };
        }
      });
    }
    if (M.lullaby) {                                      // slow drifting Zs: every one that touches you makes you drowsier
      const Lb = M.lullaby;
      for (let w = 0; w < Lb.waves; w++) this.later(w * Lb.gap + 0.001, () => {
        const base = R() * TAU;
        for (let k = 0; k < Lb.n; k++) { const b = this.shoot('e', ox, oy, base + k * TAU / Lb.n, Lb.speed, 11, Lb.dmg, Lb.proj, 0.4, false, by); b.drowsy = Lb.drowsy; b.mv = { d4: true, lull: 1 }; }
      });
    }
    if (M.crescents) {                                    // a tide of moons from every side of the room, sweeping in
      const Cr = M.crescents, cx = box.x + box.w / 2, cy = box.y + box.h / 2, rot = R() * TAU;
      for (let k = 0; k < Cr.n; k++) {
        const a = rot + k * TAU / Cr.n, x = cx + Math.cos(a) * Cr.r, y = cy + Math.sin(a) * Cr.r * (box.h / box.w);
        this.shoot('e', x, y, angleTo(x, y, cx, cy) + 0.25, Cr.speed, Cr.r * 2, Cr.dmg, Cr.proj, 0.42, false, by);
      }
    }
    if (M.blinkstars) {                                   // stars that wink out and back: only solid while they shine
      const Bs = M.blinkstars, base = R() * TAU;
      for (let k = 0; k < Bs.n; k++) { const b = this.shoot('e', ox, oy, base + k * TAU / Bs.n, Bs.speed * (k % 2 ? 1 : 0.75), 12, Bs.dmg, Bs.proj, 0.4, false, by); b.mv = { d4: true, blink: [Bs.on, Bs.off] }; }
    }
    if (M.dreamshift && S.shift && S.shift.e && !S.shift.e.dead) S.shift.until = this.t + M.dreamshift.dur;   // already dreaming: the nightmare lingers
    else if (M.dreamshift) {                              // nightmare: its true body sleeps unhurt; its nightmare-self walks the room
      S.shift = { until: this.t + M.dreamshift.dur };
      const nm = this.addEnemy('sleepers_nightmare', 2 * (box.x + box.w / 2) - e.x, 2 * (box.y + box.h / 2) - e.y); nm.seen = true; this.unstick(nm, 1);
      S.shift.e = nm;
      this.banner('THE DREAM TURNS TO NIGHTMARE: strike its nightmare-self!', 2200);
    }
    if (M.invert) { this.invertUntil = this.t + M.invert.dur; this.banner('DREAM LOGIC: your feet forget left from right!', 2200); }
  },
  endShift() {
    const S = this.map.d4;
    if (S.shift && S.shift.e && !S.shift.e.dead) { S.shift.e.dead = true; S.shift.e.deadT = 0; this.vx({ k: 'burst', x: S.shift.e.x, y: S.shift.e.y - 1, n: 30, colors: ['#ff7ab8', '#2a0a30', '#ffffff'] }); }
    S.shift = null;
    this.banner('The nightmare passes. It dreams gently again.', 1600);
  },
  curtainK(C) { const a = 0.9, z = C.dur - 0.9; return C.t < a ? C.t / a : C.t > z ? Math.max(0, (C.dur - C.t) / 0.9) : 1; },
  landDrip(Dp) {
    const m = this.map, p = this.player;
    Dp.done = true; Dp.t = 0;
    if (!p.dead && dist(Dp.x, Dp.y, p.x, p.y) < Dp.r) this.hurtPlayer(Dp.dmg, Dp.by);
    const P = { t: Dp.puddle, tiles: [] };
    for (let y = Math.floor(Dp.y - Dp.r); y <= Dp.y + Dp.r; y++) for (let x = Math.floor(Dp.x - Dp.r); x <= Dp.x + Dp.r; x++) {
      const i = y * m.w + x;
      if (dist(x + 0.5, y + 0.5, Dp.x, Dp.y) <= Dp.r && !m.solid[i] && m.tiles[i] !== TID.honey) { P.tiles.push([i, m.tiles[i]]); m.tiles[i] = TID.honey; }
    }
    m.d4.puddles.push(P);
    for (let k = 0; k < 6; k++) this.shoot('e', Dp.x, Dp.y, k * TAU / 6, 3, 2.5, Math.round(Dp.dmg * 0.5), Dp.proj, 0.32, false, Dp.by);
    this.vx({ k: 'burst', x: Dp.x, y: Dp.y, n: 10, colors: ['#ffb830', '#ffd650', '#8a5a10'] });
  },

  // ================================================================ the new shots' flight
  steerD4(b, dt, M) {
    if (M.swarm) {                                        // jitter, and nose toward you
      const W = M.swarm, f = this.player;
      b.ha += (R() - 0.5) * W.jitter * dt * 6;
      const want = angleTo(b.x, b.y, f.x, f.y - 0.4); let da = ((want - b.ha + Math.PI * 3) % TAU) - Math.PI;
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
