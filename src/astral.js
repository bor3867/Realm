// The Astral Observatory's own systems (docs/design/dungeon_astral.md), mixed into Game like frostveil.js.
//   void       you can step off a platform, and you fall: back to your last footing, 12% of your Life, a moment's grace
//   runes      rune circles fold space: step on one and you are on its partner
//   clockwork  bridges that turn on a hub, 45 degrees every 4 s (warned a second ahead), carrying whoever rides them
//   telescopes turn one to face the vault's star globe and it reveals its third of the star bridge, for good
//   drones     orrery drones wheel round their acolyte
import { TID, SK, clockTiles } from './world/maps.js';

export const ASTRAL = { fall: 0.12, grace: 1, click: 4, warn: 1, swirl: 0.6 };
const TAU = Math.PI * 2;

const methods = {
  asVoidAt(x, y) { const m = this.map; return m.tiles[Math.floor(y) * m.w + Math.floor(x)] === TID.asvoid; },
  asSet(i, t) { const m = this.map; m.tiles[i] = t; m.skin[i] = t === TID.asgrate ? SK.astral_brass_grate : t === TID.asvoid ? SK.astral_void : m.skin[i]; },
  // ---------------------------------------------------------------- every frame in the observatory
  updateAstral(dt) {
    const m = this.map, p = this.player;
    // the void: a fall puts you back on your last footing
    if (!p.dead) {
      if (!this.asVoidAt(p.x, p.y)) p.asSafe = { x: p.x, y: p.y };
      else if (p.asSafe && !(p.asRune > 0)) {
        this.vx({ k: 'regfx', key: 'ex_effects/star_burst', x: p.x, y: p.y - 0.4, fps: 12 });
        p.x = p.asSafe.x; p.y = p.asSafe.y; p.vel = { x: 0, y: 0 }; p.gust = null;
        this.hurtPlayer(Math.round(this.stat('hp') * ASTRAL.fall), 'the void', true);
        p.status.invuln = Math.max(p.status.invuln || 0, ASTRAL.grace);
        this.vx({ k: 'regfx', key: 'ex_effects/star_burst', x: p.x, y: p.y - 0.4, fps: 12 });
        this.toast('You fell into the void.');
      }
    }
    // rune circles: stand on one and it folds space round you
    if (!m.asRunes) m.asRunes = m.objects.filter((o) => o.asRune !== undefined);
    const on = m.asRunes.find((o) => Math.hypot(o.x - p.x, o.y - p.y) < 0.6);
    if (p.asRune > 0) {
      p.asRune -= dt;
      if (p.asRune <= 0 && p.asRuneTo) {
        this.vx({ k: 'regfx', key: 'ex_effects/star_burst', x: p.x, y: p.y - 0.4, fps: 12 });
        p.x = p.asRuneTo.x; p.y = p.asRuneTo.y; p.asRuneTo = null; p.asRuneCd = true; p.asSafe = { x: p.x, y: p.y };
        this.vx({ k: 'regfx', key: 'ex_effects/star_burst', x: p.x, y: p.y - 0.4, fps: 12 }); this.sfx('portal');
      }
    } else if (on && !p.asRuneCd && !p.dead) { p.asRune = ASTRAL.swirl; p.asRuneTo = on.to; p.asRuneAt = on; }
    if (!on) p.asRuneCd = false;
    // the clockwork: every 4 s the arms click 45 degrees round, carrying their riders
    for (const C of m.asClocks || []) {
      C.t += dt;
      C.warn = C.t > ASTRAL.click - ASTRAL.warn;
      if (C.t < ASTRAL.click) continue;
      C.t = 0;
      const old = new Set(C.tiles), nk = (C.k + 1) % 8, nt = clockTiles(C, nk);
      const riders = [p, ...this.enemies.filter((e) => !e.dead && !e.rb)].filter((o) => old.has(Math.floor(o.y) * m.w + Math.floor(o.x)));
      for (const i of C.tiles) this.asSet(i, TID.asvoid);
      for (const i of nt) this.asSet(i, TID.asgrate);
      for (let x = C.hx - 1; x <= C.hx + 1; x++) for (let y = C.hy - 1; y <= C.hy + 1; y++) this.asSet(y * m.w + x, TID.asgrate);
      for (const o of riders) {                                // turned with the arm, 45 degrees about the hub
        const dx = o.x - C.hx - 0.5, dy = o.y - C.hy - 0.5, c = Math.cos(Math.PI / 4), s = Math.sin(Math.PI / 4);
        o.x = C.hx + 0.5 + dx * c - dy * s; o.y = C.hy + 0.5 + dx * s + dy * c;
        if (o === p) p.asSafe = { x: p.x, y: p.y };
      }
      C.k = nk; C.tiles = nt;
      this.sfx('coin');
    }
  },
  // the telescopes: one step round each use; facing the vault's globe, it reveals its third of the star bridge
  interactAstral(o) {
    if (o.interact !== 'scope') return false;
    const m = this.map, D = m.asDais;
    o.dir = (o.dir + 1) % 8;
    this.vx({ k: 'burst', x: o.x, y: o.y - 0.8, n: 5, colors: ['#ffd690', '#ffffff'] }); this.sfx('coin');
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
  // orrery drones wheel round their acolyte (round you, if it has fallen)
  asSatellite(e, dt) {
    const P = e.parent && !e.parent.dead ? e.parent : this.player, r = e.parent && !e.parent.dead ? 2.4 : 4;
    e.sa = (e.sa === undefined ? Math.random() * TAU : e.sa) + dt * (e.parent && !e.parent.dead ? 1.6 : 0.9);
    e.x += (P.x + Math.cos(e.sa) * r - e.x) * Math.min(1, dt * 6); e.y += (P.y + Math.sin(e.sa) * r - e.y) * Math.min(1, dt * 6);
  },
};

export function installAstral(Game) { Object.assign(Game.prototype, methods); }
