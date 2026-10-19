// The overworld bosses, made dangerous (requested 2026-10-19: "cleared too quickly"; tools/bench_overworld_bosses.mjs
// measures them). Each gets more Life, harder hits (every blow tallied under its name: shots, zones, contact, and its
// own adds'), and small adds that join the fight now and then: the Kraken's tentacles burst out of the water around
// you and lash with barbed hooks; the others call their own kind. A player who stands still and stops dodging goes
// down in seconds, not a minute. Adds sink away after a while, and never drop loot.
// Mixed into Game; game.js calls owTune (a boss is spawned), owDmg (a blow lands) and owTick (every frame).
import { R, TAU } from './util.js';
import { isSolid } from './world/maps.js';

//            Life x   damage x   adds: who, how many, how often (s), where (near you or the boss), how long they stay
export const OW_BOSSES = {
  brine_cathedral: { hp: 2.2, dmg: 3.0, adds: { id: 'brine_pilgrim', n: 3, every: 13, near: 'boss', life: 25 } },
  abyssal_kraken: { hp: 2.0, dmg: 2.2, adds: { id: 'kraken_tentacle', n: 3, every: 8, near: 'you', life: 11 } },
  wick_mother: { hp: 1.7, dmg: 2.0, adds: { id: 'candle_mite', n: 4, every: 11, near: 'boss', life: 25 } },
  thornheart_treant: { hp: 3.0, dmg: 2.6, adds: { id: 'thorn_sprite', n: 3, every: 11, near: 'boss', life: 25 } },
  orrery_of_winter: { hp: 1.6, dmg: 2.8, adds: { id: 'frost_wraith', n: 2, every: 13, near: 'boss', life: 25 } },
  emily_the_yapper: { hp: 1.6, dmg: 2.6, adds: { id: 'emily_chick', n: 4, every: 10, near: 'boss', life: 25 } },
  penitent_colossus: { hp: 1.3, dmg: 1.0, adds: null },   // (already the hardest by the dodging bot: Life only)
  the_fallen_star: { hp: 1.1, dmg: 1.8, adds: { id: 'rift_wraith', n: 2, every: 14, near: 'boss', life: 25 } },
};

const methods = {
  // a boss rises: its Life and its hits, and the clock for its adds
  owTune(e) {
    const T = OW_BOSSES[e.id];
    if (!T || this.map.kind !== 'realm') return;
    e.hp = e.maxHp = Math.round(e.maxHp * T.hp);
    e.ow = { T, addT: T.adds ? T.adds.every * 0.6 : 0, adds: [] };
    (this.owK || (this.owK = {}))[e.D.name] = T.dmg;
  },
  // a blow lands on you: a boss's (or its adds') is harder
  owDmg(dmg, by) { const K = this.owK && typeof by === 'string' && this.owK[by]; return K ? Math.round(dmg * K) : dmg; },
  owTick(dt) {
    if (this.map.kind !== 'realm') return;
    const p = this.player;
    for (const e of this.enemies) {
      if (!e.ow) continue;
      const W = e.ow, A = W.T.adds;
      if (!A) continue;
      W.adds = W.adds.filter((a) => !a.dead);
      for (const a of W.adds) if ((a.owLife -= dt) <= 0) { a.dead = true; a.deadT = 0; a.noLoot = true; this.vx({ k: 'burst', x: a.x, y: a.y - 0.4, n: 8, colors: ['#5ac8f0', '#ffffff'] }); }   // sinks away
      if (e.dead || e.hp <= 0) { for (const a of W.adds) { a.dead = true; a.deadT = 0; } W.adds = []; continue; }
      if (e.state === 'sleep' || Math.hypot(p.x - e.x, p.y - e.y) > 16 || p.dead) continue;
      if ((W.addT -= dt) > 0 || W.adds.length >= A.n) continue;               // (one wave at a time)
      W.addT = A.every;
      const cx = A.near === 'you' ? p.x : e.x, cy = A.near === 'you' ? p.y : e.y;
      for (let k = 0; k < A.n; k++) {
        const a0 = R() * TAU, d = A.near === 'you' ? 2.5 + R() * 1.8 : 2 + R() * 2.5, x = cx + Math.cos(a0) * d, y = cy + Math.sin(a0) * d;
        if (isSolid(this.map, x, y) && A.id !== 'kraken_tentacle') continue;   // (a tentacle rises from the water itself)
        const add = this.addEnemy(A.id, x, y);
        add.owLife = A.life; add.seen = true; add.aggro = true; add.noLoot = true; add.owOf = e;
        W.adds.push(add);
        this.vx({ k: 'burst', x, y: y - 0.3, n: 10, colors: A.id === 'kraken_tentacle' ? ['#5ac8f0', '#2a8a8a', '#ffffff'] : ['#ffffff', '#c8c0d8'] });
      }
    }
  },
};
export function installOwBosses(Game) { Object.assign(Game.prototype, methods); }
