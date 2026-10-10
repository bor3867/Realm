// Phase 5: the overworld's elites (docs/design/05_elites.md), mixed into Game like frostveil.js.
// Each elite has one ability on a cooldown. The ability clip is the telegraph: the elite stops and plays it, and the
// effect lands on its last frame. Some abilities carry on as a short state of their own (a dive, a dash, a burrow,
// a blink). Elites spawn with an escort and, when you can see the spot, with a telegraph first.
import { BIOMES, isSolid, randomTileInBiome } from './world/maps.js';
import { ENEMIES, BIOME_SPAWNS, ELITES } from './data/enemies.js';

import { R } from './util.js';                                   // the game's random: R(), R.int, R.pick
const TAU = Math.PI * 2;
const angleTo = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);
const GOBLINS = new Set(['hedge_goblin', 'goblin_shaman']), ORCS = new Set(['orc_brute', 'orc_warlord']);
export const ELITE_EVERY = 18;                               // one elite per this many regular groups in a land

const methods = {
  // ---------------------------------------------------------------- spawning
  spawnElite(biome, r = R, avoid = this.player, quiet = false) {
    const list = ELITES[biome];
    if (!list) return null;
    const at = this.spreadSpot(biome, r, avoid, 22, 6);
    if (!at) return null;
    const e = this.addEnemy(r.pick ? r.pick(list) : list[Math.floor(r() * list.length)], at.x, at.y);
    e.elite = true; e.eliteOf = biome;
    const esc = BIOME_SPAWNS[biome] || [];
    for (let k = 0, n = 3 + Math.floor((r() || 0) * 2); k < n && esc.length; k++) {   // its escort, from the land's own
      const id = esc[Math.floor(r() * esc.length)][0], a = r() * TAU, x = at.x + Math.cos(a) * 2.2, y = at.y + Math.sin(a) * 2.2;
      if (!isSolid(this.map, x, y) && ENEMIES[id]) this.addEnemy(id, x, y).escortOf = e;
    }
    if (!quiet && Math.hypot(at.x - this.player.x, at.y - this.player.y) < 20) e.spawnT = 1.2;   // seen: it arrives visibly
    return e;
  },
  eliteTarget(biome) { return Math.max(1, Math.round(this.parentCount(biome) / ELITE_EVERY)); },
  parentCount(biome) { return this.enemies.filter((e) => !e.dead && e.kids && e.D.biome === biome).length || 1; },
  maintainElites(r = R) {
    for (const b of Object.keys(ELITES)) {
      if (BIOMES.indexOf(b) < 0) continue;
      const have = this.enemies.filter((e) => !e.dead && e.elite && e.eliteOf === b).length;
      if (have < this.eliteTarget(b)) this.spawnElite(b, r);
    }
  },
  // ---------------------------------------------------------------- per frame, for each elite (before its usual AI)
  // returns true while the ability (or what follows it) owns the elite this frame
  updateEliteAbility(e, dt, d) {
    const D = e.D, A = D.ability, p = this.player, aggro = d < D.aggro && !p.dead && this.map.kind !== 'nexus';
    if (e.elState) return this.eliteState(e, dt);
    if (e.abil) {
      e.abil.t += dt;
      if (e.abil.t >= A.tell && !e.abil.done) { e.abil.done = true; this.eliteEffect(e); }
      if (e.abil.t >= A.tell + 0.15) e.abil = null;
      return true;
    }
    if (!aggro) return false;
    e.abilCd = (e.abilCd === undefined ? 4 + R() * 2 : e.abilCd) - dt;
    if (e.abilCd > 0 || e.state === 'tell' || e.state === 'attack') return false;
    e.abilCd = A.cd * (0.85 + R() * 0.3);
    e.abil = { t: 0 };
    if (A.kind === 'dive' || A.kind === 'dash') e.abil.dir = angleTo(e.x, e.y, p.x, p.y);   // the line is chosen as the telegraph starts
    return true;
  },
  eliteEffect(e) {
    const A = e.D.ability, p = this.player, by = e.D.name, S = (n) => `el_shots/${e.id}.${n}`;
    const ring = (n, proj, sp, dmg, a0 = R() * TAU, range = 7) => { for (let k = 0; k < n; k++) this.shoot('e', e.x, e.y - e.hitUp, a0 + (k / n) * TAU, sp, range, dmg, proj, 0.4, false, by); };
    const dmg = A.dmg || 30;
    switch (A.kind) {
      case 'bulwark': e.bulwarkT = this.t + 4; this.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 16, colors: ['#ff8fbf', '#ffd0e0', '#5ac8c8'] }); break;
      case 'song': e.songT = this.t + 4; for (let k = 0; k < 10; k++) this.shoot('e', e.x, e.y - 1, (k / 10) * TAU, 2.6, 4, Math.round(dmg * 0.6), S('song_note'), 0.35, false, by); break;
      case 'totem': { const t = this.addEnemy('spirit_totem', e.x + 1.6, e.y + 0.4); t.seen = true; t.born = this.t; t.healT = 1.5; this.unstick(t, 0.5); break; }
      case 'roar': ring(24, S('thorn_burst'), 5.5, dmg); this.fvLater(0.25, () => !e.dead && ring(24, S('thorn_burst'), 5, dmg, R() * TAU + Math.PI / 24)); this.vx({ k: 'shake', amt: 3 }); break;
      case 'banner': { const t = this.addEnemy('war_banner', e.x - 1.6, e.y + 0.4); t.seen = true; t.born = this.t; this.unstick(t, 0.5); break; }
      case 'brood': {
        e.brood = (e.brood || []).filter((q) => !q.dead);
        for (let k = 0; k < 3 && e.brood.length < 6; k++) {
          const a = R() * TAU, s = this.addEnemy('bark_spider', e.x + Math.cos(a) * 1.4, e.y + Math.sin(a) * 1.4);
          s.hp = s.maxHp = Math.round(s.maxHp * 0.4); s.seen = true; s.born = this.t; s.D = { ...s.D, scale: 0.75, name: 'Spiderling', xp: Math.round(s.D.xp * 0.3) };
          e.brood.push(s);
        }
        this.vx({ k: 'burst', x: e.x, y: e.y - 0.6, n: 14, colors: ['#e8e0c8', '#6a5a3a'] });
        break;
      }
      case 'dive': e.elState = { kind: 'dive', t: 0, a: e.abil.dir, hit: false, trail: [] }; break;
      case 'dash': e.elState = { kind: 'dash', t: 0, a: angleTo(e.x, e.y, p.x, p.y), hit: false, trail: [] }; break;
      case 'burrow': e.under = true; e.elState = { kind: 'burrow', t: 0 }; this.vx({ k: 'burst', x: e.x, y: e.y, n: 16, colors: ['#5a4e44', '#8a7e6a'] }); break;
      case 'blink': {
        for (let k = 0; k < 16; k++) {
          const a = R() * TAU, rr = 4 + R() * 2, x = p.x + Math.cos(a) * rr, y = p.y + Math.sin(a) * rr;
          if (!isSolid(this.map, x, y)) { e.blinkTo = { x, y, t: 0.6 }; e.elState = { kind: 'blink', t: 0 }; break; }
        }
        break;
      }
      default: break;
    }
  },
  // the states that follow some abilities
  eliteState(e, dt) {
    const S = e.elState, p = this.player, D = e.D, A = D.ability;
    S.t += dt;
    if (S.kind === 'dive' || S.kind === 'dash') {
      const go = S.kind === 'dive' ? { warn: 0.5, dur: 0.55, sp: 15 } : { warn: 0.25, dur: 0.38, sp: 17 };
      if (S.t < go.warn) return true;                         // the line (dive) / the crouch (dash)
      S.trail.push({ x: e.x, y: e.y, t: this.t });
      const step = go.sp * dt;
      if (S.kind === 'dive') { e.x += Math.cos(S.a) * step; e.y += Math.sin(S.a) * step; if (isSolid(this.map, e.x, e.y)) { e.x -= Math.cos(S.a) * step; e.y -= Math.sin(S.a) * step; } }
      else this.moveCircle(e, Math.cos(S.a) * step, Math.sin(S.a) * step, 0.4);
      if (!S.hit && !p.dead && Math.hypot(e.x - p.x, e.y - p.y) < 0.9) { S.hit = true; this.hurtPlayer(A.dmg || 60, D.name); }
      if (S.t >= go.warn + go.dur) e.elState = null;
      return true;
    }
    if (S.kind === 'burrow') {                                // a mound under you, then the eruption
      if (S.t < 2) { const dd = Math.hypot(p.x - e.x, p.y - e.y); if (dd > 0.3) this.moveCircle(e, ((p.x - e.x) / dd) * 3.6 * dt, ((p.y - e.y) / dd) * 3.6 * dt, 0.4); e.rumble = 0; return true; }
      if (S.t < 2.8) { e.rumble = 1; e.burT = 2.8 - S.t; return true; }
      e.rumble = 0; e.under = false; e.born = this.t; e.dusted = false; e.elState = null;
      if (!p.dead && Math.hypot(e.x - p.x, e.y - p.y) < 1.6) this.hurtPlayer(A.dmg || 70, D.name);
      for (let k = 0; k < 12; k++) this.shoot('e', e.x, e.y - 0.4, (k / 12) * TAU, 5, 5, Math.round((A.dmg || 70) * 0.7), `el_shots/${e.id}.rock_shard`, 0.4, false, D.name);
      this.vx({ k: 'burst', x: e.x, y: e.y, n: 20, colors: ['#5a4e44', '#8a7e6a', '#c8b890'] }); this.vx({ k: 'shake', amt: 4 });
      return true;
    }
    if (S.kind === 'blink') {
      if (!e.blinkTo) { e.elState = null; return false; }
      e.blinkTo.t -= dt;
      if (e.blinkTo.t <= 0) {
        this.vx({ k: 'burst', x: e.x, y: e.y - 0.6, n: 14, colors: ['#c03aff', '#ffffff', '#3a1a4a'] });
        e.x = e.blinkTo.x; e.y = e.blinkTo.y; e.blinkTo = null; e.elState = null;
        this.vx({ k: 'burst', x: e.x, y: e.y - 0.6, n: 14, colors: ['#c03aff', '#ffffff', '#3a1a4a'] });
      }
      return true;
    }
    e.elState = null;
    return false;
  },
  // ---------------------------------------------------------------- the auras: song, totem, banner (once a frame)
  updateEliteAuras(dt) {
    const p = this.player;
    for (const e of this.active || []) {
      if (e.dead) continue;
      if (e.songT > this.t && !p.dead && Math.hypot(e.x - p.x, e.y - p.y) < 6) { p.dragUntil = this.t + 0.1; p.dragF = 0.6; }   // wider than she keeps her distance
      if (e.id === 'spirit_totem' && (e.healT -= dt) <= 0) {
        e.healT = 1.5;
        for (const o of this.active) if (!o.dead && GOBLINS.has(o.id) && o.hp < o.maxHp && Math.hypot(o.x - e.x, o.y - e.y) < 6) { o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.05); this.vx({ k: 'heal', x0: e.x, y0: e.y - 1, x1: o.x, y1: o.y - 0.6 }); }
      }
      if (e.id === 'war_banner') for (const o of this.active) if (!o.dead && ORCS.has(o.id) && Math.hypot(o.x - e.x, o.y - e.y) < 7) o.rallyUntil = this.t + 0.3;
    }
  },
};

export function installElites(Game) { Object.assign(Game.prototype, methods); }
void randomTileInBiome;
