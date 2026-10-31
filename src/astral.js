// The Astral Observatory's own systems (docs/design/dungeon_astral.md), mixed into Game like frostveil.js.
//   void       you can step off a platform, and you fall: back to your last footing, 12% of your Life, a moment's grace
//   runes      rune circles fold space: step on one and you are on its partner
//   clockwork  bridges that turn on a hub, 45 degrees every 4 s (warned a second ahead), carrying whoever rides them
//   telescopes turn one to face the vault's star globe and it reveals its third of the star bridge, for good
//   drones     orrery drones wheel round their acolyte
//   guardians  (Astral Observatory Plus) the astrolabe sentinel's Alignment ward, the comet hound's burning dash, the
//              nebula weaver's Star Veil, a meteor mite's ring of embers
//   star vault the Vault Keeper sleeps by the chest; strike either and it wakes, seals the vault (Lockdown) and the
//              trap plates fire in turn until it falls; then the vault opens and the chest gives up its loot
import { lift, liftO } from './util.js';
import { TID, SK } from './world/maps.js';

export const ASTRAL = { fall: 0, grace: 1, click: 4, warn: 1, swirl: 0.6 };
const TAU = Math.PI * 2;
// a clockwork arm's way round: the same in every copy of the dungeon (from where its hub is)
const clockHash = (C, n) => { let h = Math.imul(C.hx * 73856093 ^ C.hy * 19349663, 2654435761) ^ Math.imul(n + 1, 83492791); h = Math.imul(h ^ (h >>> 15), 2246822519); return ((h ^ (h >>> 13)) >>> 0) / 4294967296; };
export const ARM = { half: 1.5, reach: 0.9 };                // a plank: half its width, and how far past its last tile it reaches
const CLOCK_W = (Math.PI * 2) / 22;                          // (radians a second: once round in 22 s)
const AP = (k) => 'ap_shots/' + k;

const methods = {
  asVoidAt(x, y) { const m = this.map; return m.tiles[Math.floor(y) * m.w + Math.floor(x)] === TID.asvoid && !this.asArmAt(x, y); },
  // on a clockwork's plank? (a rectangle through its hub, both ways out to its reach, three tiles wide)
  asArmAt(x, y) {
    for (const C of this.map.asClocks || []) {
      const dx = x - C.hx - 0.5, dy = y - C.hy - 0.5, a = C.ang ?? (C.k * TAU) / 8, ux = Math.cos(a), uy = Math.sin(a);
      if (Math.abs(dx * ux + dy * uy) <= C.len + ARM.reach && Math.abs(dy * ux - dx * uy) <= ARM.half) return true;
    }
    return false;
  },
  asFooting(x0, y0) { const m = this.map; for (let r = 1; r <= 6; r++) for (let a = 0; a < 16; a++) { const x = x0 + Math.cos((a / 16) * TAU) * r, y = y0 + Math.sin((a / 16) * TAU) * r, i = Math.floor(y) * m.w + Math.floor(x); if (x > 0 && y > 0 && x < m.w && y < m.h && m.tiles[i] !== TID.asvoid && !m.solid[i]) return { x, y }; } return null; },
  asSet(i, t) { const m = this.map; m.tiles[i] = t; m.skin[i] = t === TID.asgrate ? SK.astral_brass_grate : t === TID.asvoid ? SK.astral_void : m.skin[i]; },
  // ---------------------------------------------------------------- every frame in the observatory
  updateAstral(dt) {
    const m = this.map, p = this.player;
    this.asGuardians(dt);
    // the void: a fall puts you back on your last footing
    if (!p.dead) {
      if (!this.asVoidAt(p.x, p.y)) p.asSafe = { x: p.x, y: p.y };
      else if (p.asSafe && !(p.asRune > 0)) {
        if (this.asVoidAt(p.asSafe.x, p.asSafe.y)) p.asSafe = this.asFooting(p.asSafe.x, p.asSafe.y) || p.asSafe;   // (where you stood has turned away: the nearest footing)
        this.vx({ k: 'regfx', key: 'ex_effects/star_burst', ...liftO(p.x, p.y, 0.4), fps: 12 });
        p.x = p.asSafe.x; p.y = p.asSafe.y; p.vel = { x: 0, y: 0 }; p.gust = null;
        if (ASTRAL.fall) this.hurtPlayer(Math.round(this.stat('hp') * ASTRAL.fall), 'the void', true);   // (no harm now: only put back. 2026-10-24)
        p.status.invuln = Math.max(p.status.invuln || 0, ASTRAL.grace);
        this.vx({ k: 'regfx', key: 'ex_effects/star_burst', ...liftO(p.x, p.y, 0.4), fps: 12 });
        this.toast('You fell into the void.');
      }
    }
    // rune circles: stand on one and it folds space round you
    if (!m.asRunes) m.asRunes = m.objects.filter((o) => o.asRune !== undefined);
    const on = m.asRunes.find((o) => Math.hypot(o.x - p.x, o.y - p.y) < 0.6);
    if (p.asRune > 0) {
      p.asRune -= dt;
      if (p.asRune <= 0 && p.asRuneTo) {
        this.vx({ k: 'regfx', key: 'ex_effects/star_burst', ...liftO(p.x, p.y, 0.4), fps: 12 });
        p.x = p.asRuneTo.x; p.y = p.asRuneTo.y; p.asRuneTo = null; p.asRuneCd = true; p.asSafe = { x: p.x, y: p.y };
        this.vx({ k: 'regfx', key: 'ex_effects/star_burst', ...liftO(p.x, p.y, 0.4), fps: 12 }); this.sfx('portal');
      }
    } else if (on && !p.asRuneCd && !p.dead) { p.asRune = ASTRAL.swirl; p.asRuneTo = on.to; p.asRuneAt = on; }
    if (!on) p.asRuneCd = false;
    // the clockwork: each arm is a brass plank turning slowly and steadily on its hub, always the same way (each its own
    // way), carrying whoever rides it. It is a true rectangle at every angle (asArmAt; drawn in src/render.js astralFx):
    // the void stays void beneath it. (It was laid in floor tiles, a staircase at most angles that changed shape as it
    // turned; before that it clicked 45 degrees every 4 s. 2026-10-24)
    for (const C of m.asClocks || []) {
      if (C.ang === undefined) { C.ang = (C.k * TAU) / 8; C.dir = clockHash(C, 1) < 0.5 ? 1 : -1; }
      const da = C.dir * CLOCK_W * dt, c = Math.cos(da), sn = Math.sin(da), ux = Math.cos(C.ang), uy = Math.sin(C.ang);
      for (const o of [p, ...this.enemies.filter((e) => !e.dead && !e.rb)]) {
        const dx = o.x - C.hx - 0.5, dy = o.y - C.hy - 0.5, along = Math.abs(dx * ux + dy * uy), across = Math.abs(dy * ux - dx * uy);
        if (o.dead || along < 1.6 || along > C.len + ARM.reach || across > ARM.half + 0.1) continue;   // (on the plank: not the hub, which stands still)
        o.x = C.hx + 0.5 + dx * c - dy * sn; o.y = C.hy + 0.5 + dx * sn + dy * c;
      }
      C.ang += da;
    }
  },
  // the telescopes: one step round each use; facing the vault's globe, it reveals its third of the star bridge
  interactAstral(o) {
    if (o.interact !== 'scope') return false;
    const m = this.map, D = m.asDais;
    o.dir = (o.dir + 1) % 8;
    this.vx({ k: 'burst', ...liftO(o.x, o.y, 0.8), n: 5, colors: ['#ffd690', '#ffffff'] }); this.sfx('coin');
    if (!D || o.found) return true;
    const want = Math.round(((Math.atan2(D.globe.y - o.y, D.globe.x - o.x) + TAU) % TAU) / (Math.PI / 4)) % 8;
    if (o.dir === want) {
      o.found = true;
      for (const i of m.asStar[o.j] || []) this.asSet(i, TID.asgrate);
      for (const i of m.asStar[o.j] || []) if (Math.random() < 0.4) this.vx({ k: 'regfx', key: 'ex_effects/star_burst', x: (i % m.w) + 0.5, y: Math.floor(i / m.w) + 0.5, fps: 10 });
      const left = m.objects.filter((q) => q.interact === 'scope' && !q.found).length;
      this.banner(left ? `A third of a bridge of stars appears. (${3 - left}/3)` : 'The star bridge is whole. The vault is open to you.', 2600);
    }
    return true;
  },
  // ---------------------------------------------------------------- the guardians and the star vault, every frame
  asGuardians(dt) {
    const m = this.map, p = this.player, t = this.t;
    if (!m.asVaultInit) {                                       // the keeper sleeps beside the chest it guards
      const k = this.enemies.find((e) => e.id === 'vault_keeper'), c = m.objects.find((o) => o.starVault);
      if (k && c) { m.asVaultInit = true; k.asDormant = true; k.seen = false; c.guards = [k]; m.asKeeper = k; m.asChest = c; }
    }
    // comet trails: a hound's dash leaves fire for 2 s
    m.asFire = (m.asFire || []).filter((f) => f.until > t);
    for (const e of this.active || []) {
      if (e.dead || e.id !== 'comet_hound' || !e.elState || e.elState.kind !== 'dash' || e.elState.t < 0.25) continue;
      if (!e.asLastFire || Math.hypot(e.x - e.asLastFire.x, e.y - e.asLastFire.y) > 0.45) { e.asLastFire = { x: e.x, y: e.y }; m.asFire.push({ x: e.x, y: e.y, until: t + 2, born: t }); }
    }
    if (!p.dead && m.asFire.some((f) => Math.hypot(f.x - p.x, f.y - p.y) < 0.6) && (p.asBurnT = (p.asBurnT || 0) - dt) <= 0) { p.asBurnT = 0.35; this.hurtPlayer(70, 'a comet trail'); }
    // star veils: inside, you are slowed and the weaver is hidden
    m.asVeils = (m.asVeils || []).filter((v) => v.until > t);
    for (const v of m.asVeils) {
      if (!p.dead && Math.hypot(v.x - p.x, v.y - p.y) < v.r) { p.dragUntil = t + 0.1; p.dragF = 0.55; }
      if (v.e && !v.e.dead) v.e.asVeiled = Math.hypot(v.e.x - v.x, v.e.y - v.y) < v.r ? t + 0.1 : 0;
    }
    // the sealed vault: its trap plates fire one after another
    if (m.asSealed) {
      const traps = m.objects.filter((o) => o.asTrap);
      if (traps.length && (m.asTrapT = (m.asTrapT === undefined ? 1 : m.asTrapT) - dt) <= 0) {
        m.asTrapT = 0.75; const o = traps[(m.asTrapI = ((m.asTrapI || 0) + 1) % traps.length)];
        o.clipT = t;
        this.fvLater(0.45, () => { if (!m.asSealed) return; const a0 = Math.random() * TAU; for (let k = 0; k < 8; k++) this.shoot('e', o.x, o.y, a0 + (k / 8) * TAU, 4.5, 6, 95, AP('vault.trap_spark'), 0.4, false, 'a vault trap'); });
      }
    }
  },
  // an astral guardian's ability lands (the clip was its telegraph; src/elites.js)
  asEliteEffect(e) {
    const m = this.map, p = this.player, by = e.D.name, A = e.D.ability;
    const ring = (n, proj, sp, dmg, range, a0 = Math.random() * TAU, mv) => { for (let k = 0; k < n; k++) { const b = this.shoot('e', ...this.up(e.x, e.y, this.shotUp(e)), a0 + (k / n) * TAU, sp, range, dmg, proj, 0.45, false, by); if (mv) b.mv = { ...mv }; } };
    if (A.kind === 'alignment') {                               // the ring ward: shots glance off for 2 s, then it lets go as a shockwave
      e.wardT = this.t + 2;
      this.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 14, colors: ['#ffd690', '#ffffff'] });
      this.fvLater(2, () => { if (e.dead) return; ring(18, AP('astrolabe_sentinel.star_lance'), 8, A.dmg || 100, 8); ring(8, AP('astrolabe_sentinel.astro_disc'), 4.5, A.dmg || 100, 7, undefined, { boomer: 1 }); this.vx({ k: 'shake', amt: 3 }); });
    } else if (A.kind === 'comet') {                            // the comet dash: a streak through you, fire behind it
      e.elState = { kind: 'dash', t: 0, a: Math.atan2(p.y - e.y, p.x - e.x), hit: false, trail: [] }; e.asLastFire = null;
    } else if (A.kind === 'veil') {                             // star-dust: hides it, slows you
      (m.asVeils = m.asVeils || []).push({ x: e.x, y: e.y, r: 3, until: this.t + 3, born: this.t, e });
      this.vx({ k: 'burst', ...liftO(e.x, e.y, 0.8), n: 20, colors: ['#c8a0ff', '#8af6ff', '#ffffff'] });
    } else if (A.kind === 'lockdown') {                         // a ring of seal glyphs that hang, then fly out; the plates arm faster
      ring(16, AP('vault_keeper.seal_glyph'), 5.5, 110, 9, Math.random() * TAU, { hold: 0.5 });
      m.asTrapT = 0;
    }
  },
  // the Vault Keeper: asleep (nothing happens), then waking (its clip), then Lockdown
  asDormantTick(e, dt) {
    if (e.asDormant) return true;
    e.asWakeT -= dt;
    if (e.asWakeT <= 0) { e.asWakeT = 0; this.asLockdown(e); }
    return true;
  },
  asWake(e) {
    if (!e.asDormant) return;
    const m = this.map;
    e.asDormant = false; e.asWakeT = 0.8; e.seen = true;
    if (m.asChest) { m.asChest.clip = 'open'; m.asChest.clipT = this.t; }
    this.banner('The Vault Keeper wakes!', 2200); this.sfx('boss'); this.vx({ k: 'shake', amt: 4 });
  },
  asVaultHit() { if (this.map.asKeeper && this.map.asKeeper.asDormant) this.asWake(this.map.asKeeper); },
  asLockdown(e) {
    const m = this.map, V = m.asVault;
    m.asSealed = true; m.asTrapT = 1;
    if (V) for (const i of V.mouth) m.solid[i] = 1;
    const door = m.objects.find((o) => o.asDoor);
    if (door) { door.clip = 'sealed'; door.clipT = this.t; }
    e.abilCd = 6;
    this.asEliteEffect({ ...e, D: { ...e.D, ability: { kind: 'lockdown' } } });
    this.banner('LOCKDOWN · the vault is sealed until the Keeper falls', 2800); this.vx({ k: 'shake', amt: 6 });
  },
  asDeath(e) {
    const m = this.map, D = e.D.asDeath;
    if (D && D.ring) { const a0 = Math.random() * TAU; for (let k = 0; k < D.ring; k++) this.shoot('e', ...lift(e.x, e.y, 0.3), a0 + (k / D.ring) * TAU, 5, 4.5, D.dmg, D.proj, 0.35, false, e.D.name); }
    if (e === m.asKeeper) {                                      // the vault opens; the chest gives up its loot
      m.asSealed = false;
      if (m.asVault) for (const i of m.asVault.mouth) m.solid[i] = 0;
      const door = m.objects.find((o) => o.asDoor);
      if (door) { door.clip = 'unlock'; door.clipT = this.t; }
      const c = m.asChest;
      if (c && !c.opened) { c.guards = null; const spr = c.sprite; this.breakChest(c); c.sprite = spr; c.clip = 'opened'; c.clipT = this.t; }
      this.banner('The Keeper falls. The star vault opens.', 2600);
    }
  },
  // orrery drones wheel round their acolyte (round you, if it has fallen)
  asSatellite(e, dt) {
    const P = e.parent && !e.parent.dead ? e.parent : this.player, r = e.parent && !e.parent.dead ? 2.4 : 4;
    e.sa = (e.sa === undefined ? Math.random() * TAU : e.sa) + dt * (e.parent && !e.parent.dead ? 1.6 : 0.9);
    e.x += (P.x + Math.cos(e.sa) * r - e.x) * Math.min(1, dt * 6); e.y += (P.y + Math.sin(e.sa) * r - e.y) * Math.min(1, dt * 6);
  },
};

export function installAstral(Game) { Object.assign(Game.prototype, methods); }
