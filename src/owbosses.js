// The overworld bosses, made dangerous (requested 2026-10-19: "cleared too quickly"; tools/bench_overworld_bosses.mjs
// measures them). Each gets more Life, harder hits (every blow tallied under its name: shots, zones, contact, and its
// own adds'), and small adds that join the fight now and then: the Kraken's tentacles burst out of the water around
// you and lash with barbed hooks; the others call their own kind. A player who stands still and stops dodging goes
// down in seconds, not a minute. Adds sink away after a while, and never drop loot.
// Mixed into Game; game.js calls owTune (a boss is spawned), owDmg (a blow lands) and owTick (every frame).
import { R, TAU } from './util.js';
import { isSolid } from './world/maps.js';

//            Life x   damage x   adds: who, how many, how often (s), where (near you or the boss), how long they stay
// life: its Life outright (2026-10-31, the user: the best weapons do about 2,500 a second and "many bosses currently have
// too little HP"; targets: a large realm boss 200-350k, a random special boss 350-600k). Those targets in the late lands
// (Runeholt, the godlands); lighter toward the beach, by the user's call ("scale by land"): a shore player does about
// 550 a second, so 200k was six minutes alone. By its land, the shore's least and the godlands' most; the two event bosses and the falling star are the random special ones. Their blows, by the
// gear a player has in their land (tools/sim_realm_fights.mjs: a plain dodging player, alone, geared for the land):
// the shore's and the fen's took 11-14 times a T4-T7 player's Life a minute (22-55 deaths); now about what the
// godlands' bosses ask of godlands gear, 6-7 times
export const OW_BOSSES = {
  brine_cathedral: { life: 65000, hp: 2.2, dmg: 0.75,   // (dmg was 3.0: see below)
  adds: { id: 'brine_pilgrim', n: 3, every: 13, near: 'boss', life: 25 } },
  abyssal_kraken: { life: 140000, hp: 2.0, dmg: 0.6, adds: { id: 'kraken_tentacle', n: 2, every: 10, near: 'you', life: 11 } },
  wick_mother: { life: 150000, hp: 1.7, dmg: 0.9, adds: { id: 'candle_mite', n: 4, every: 11, near: 'boss', life: 25 } },
  thornheart_treant: { life: 260000, hp: 3.0, dmg: 1.6, adds: { id: 'thorn_sprite', n: 3, every: 11, near: 'boss', life: 25 } },
  orrery_of_winter: { life: 260000, hp: 1.6, dmg: 2.3,   // (its blows were a median 189, over the 100-150 a large boss's should be)
  adds: { id: 'frost_wraith', n: 2, every: 13, near: 'boss', life: 25 } },
  emily_the_yapper: { life: 280000, hp: 1.6, dmg: 1.8,   // (her biggest took 379)
  adds: { id: 'emily_chick', n: 4, every: 10, near: 'boss', life: 25 } },
  penitent_colossus: { life: 340000, hp: 1.3, dmg: 1.0, adds: null },   // (already the hardest by the dodging bot: Life only)
  the_fallen_star: { life: 500000, hp: 1.1, dmg: 1.3, adds: { id: 'rift_wraith', n: 2, every: 14, near: 'boss', life: 25 } },
};

// Round two (2026-10-19, "every boss should have these things that make sense"): each boss's signature threat, a
// volley of its own that does something only it does when it lands. It starts when the boss is hurt (at: the share of
// Life left), and comes faster in its last stand (below a third). Shots: ring (all round, turning each wave), fan
// (aimed at you). On a hit, sig:
//   chill    the Rime Astrolabe's snowflakes: Frostveil's chill (slows your feet and hands; three in a row freeze you)
//   pull     the Brine Cathedral's undertow drags you toward it
//   burn     the Wick-Mother's tallow sets you ablaze: a burn for 3 s
//   armor    the Penitent Colossus's kintsugi shards crack your armour: no Defense for 4 s
//   confuse  Emily's yaps: you cannot think straight; left is right for 2 s
//   daze     the Fallen Star's flares dazzle you: you fire at half speed for 3 s
//   ink      the Kraken's ink blinds you: only a little light round you for 3 s
//   root     the Treant's seeds root you where you stand for 1 s (you can still fire)
const BX_SHOT = (b, n) => `bx_shots/${b}.${n}`;
export const OW_SIGS = {
  orrery_of_winter: { name: 'Snowflake frenzy', at: 0.33, every: [3.4, 3.4], sig: 'chill', v: 34,
    vol: [{ form: 'ring', proj: 'snowflake', count: 14, speed: 9.5, dmg: 34, waves: 3, gap: 0.16, turn: 0.11 }, { form: 'fan', proj: 'snowflake', count: 5, arc: 0.5, speed: 11, dmg: 34, waves: 2, gap: 0.25 }] },
  brine_cathedral: { name: 'The undertow', at: 0.66, every: [8, 5], sig: 'pull', v: 1.1,
    vol: [{ form: 'ring', proj: 'bubble', count: 20, speed: 3.2, dmg: 28, range: 11, waves: 2, gap: 0.6, turn: 0.16, size: 0.5 }] },
  wick_mother: { name: 'Ablaze', at: 0.66, every: [7, 4.5], sig: 'burn', v: 3,
    vol: [{ form: 'fan', proj: 'tallowdrop', count: 7, arc: 1.1, speed: 6.5, dmg: 36, waves: 3, gap: 0.3, size: 0.5 }] },
  penitent_colossus: { name: 'Penance', at: 0.66, every: [7.5, 5], sig: 'armor', v: 4,
    vol: [{ form: 'ring', proj: 'kintsugi', count: 4, speed: 6, dmg: 44, waves: 8, gap: 0.12, turn: 0.2 }] },
  emily_the_yapper: { name: 'Yap yap yap', at: 0.66, every: [7, 4.5], sig: 'confuse', v: 2,
    vol: [{ form: 'fan', proj: 'yap', count: 9, arc: 1.6, speed: 5.5, dmg: 30, waves: 2, gap: 0.45 }] },
  the_fallen_star: { name: 'Starflare', at: 0.6, every: [7, 4.5], sig: 'daze', v: 3,
    vol: [{ form: 'ring', proj: 'lensflare', count: 10, speed: 7.5, dmg: 40, waves: 2, gap: 0.3, turn: 0.31 }, { form: 'fan', proj: 'lensflare', count: 3, arc: 0.3, speed: 10, dmg: 40 }] },
  abyssal_kraken: { name: 'Ink', at: 0.66, every: [8, 5], sig: 'ink', v: 3,
    vol: [{ form: 'fan', proj: BX_SHOT('abyssal_kraken', 'ink_blob'), count: 5, arc: 0.9, speed: 7, dmg: 38, waves: 2, gap: 0.35, size: 0.45 }] },
  thornheart_treant: { name: 'Rooted', at: 0.66, every: [7.5, 5], sig: 'root', v: 1,
    vol: [{ form: 'ring', proj: BX_SHOT('thornheart_treant', 'thorn_seed'), count: 12, speed: 5, dmg: 40, waves: 3, gap: 0.4, turn: 0.26 }] },
};
const SIG_SAY = { burn: 'Ablaze!', armor: 'Armour broken!', confuse: 'Confused!', daze: 'Dazed!', ink: 'Blinded by ink!', root: 'Rooted!' };

const methods = {
  // a boss rises: its Life and its hits, and the clock for its adds
  owTune(e) {
    const T = OW_BOSSES[e.id];
    if (!T || this.map.kind !== 'realm') return;
    e.hp = e.maxHp = T.life || Math.round(e.maxHp * T.hp);
    if (!/kraken|treant/.test(e.id)) e.D = { ...e.D, r: e.D.r * 1.4 };           // drawn twice life-size (render.js RB_BIG): a body to match
    e.ow = { T, addT: T.adds ? T.adds.every * 0.6 : 0, adds: [], S: OW_SIGS[e.id] || null, sigT: 2, q: [] };
    (this.owK || (this.owK = {}))[e.D.name] = T.dmg;
  },
  // a blow lands on you: a boss's (or its adds') is harder
  owDmg(dmg, by) { const K = this.owK && typeof by === 'string' && this.owK[by]; return K ? Math.round(dmg * K) : dmg; },
  // a signature volley: one wave of it from the boss
  owVolley(e, V, w) {
    const p = this.player, [ox, oy] = this.up(e.x, e.y, this.shotUp(e)), aim = Math.atan2(p.y - oy, p.x - ox), n = V.count, sz = V.size || 0.4;
    for (let k = 0; k < n; k++) {
      const a = V.form === 'ring' ? (k / n) * TAU + (V.turn || 0) * w : aim + (n > 1 ? (k / (n - 1) - 0.5) * V.arc : 0);
      const b = this.shoot('e', ox, oy, a, V.speed, V.range || 10, V.dmg, V.proj, sz, false, e.D.name);
      b.sig = e.ow.S.sig; b.sigV = e.ow.S.v; b.sigBy = e.D.name;
      if (b.sig === 'pull') b.pull = e.ow.S.v * 0.3;
    }
  },
  // a signature shot lands on you
  owSig(b) {
    const p = this.player, t = this.t, v = b.sigV;
    if (p.dead) return;
    const was = { burn: p.owBurn && p.owBurn.until > t, armor: p.owBroken > t, confuse: this.invertUntil > t, daze: p.owDazed > t, ink: p.owInked > t, root: p.owRooted > t }[b.sig];
    if (b.sig === 'chill') this.addChill(v);
    else if (b.sig === 'burn') p.owBurn = { until: t + v, by: b.sigBy, acc: 0, dps: Math.round(this.stat('hp') * 0.035) };
    else if (b.sig === 'armor') p.owBroken = t + v;
    else if (b.sig === 'confuse') this.invertUntil = Math.max(this.invertUntil || 0, t + v);
    else if (b.sig === 'daze') p.owDazed = t + v;
    else if (b.sig === 'ink') p.owInked = t + v;
    else if (b.sig === 'root') p.owRooted = t + v;
    if (!was && SIG_SAY[b.sig]) this.banner(SIG_SAY[b.sig], 900);
  },
  owTick(dt) {
    const p = this.player;
    if (p.owBurn && p.owBurn.until > this.t && !p.dead) {                      // ablaze: the burn ticks twice a second
      if ((p.owBurn.acc += dt) >= 0.5) { p.owBurn.acc -= 0.5; this.hurtPlayer(Math.round(p.owBurn.dps * 0.5), p.owBurn.by, true); }
    }
    if (this.map.kind !== 'realm') return;
    for (const e of this.enemies) {
      if (!e.ow) continue;
      const W = e.ow, A = W.T.adds;
      const dying = e.bx && (e.bx.state === 'death' || e.bx.state === 'deathhold' || e.bx.state === 'gone');   // (its death clip: it fires no more)
      if (dying) W.q = [];
      if (W.S && !e.dead && e.hp > 0 && !dying) {                                 // the signature volley
        for (const q of W.q) if ((q.t -= dt) <= 0) this.owVolley(e, q.V, q.w);
        W.q = W.q.filter((q) => q.t > 0);
        const f = e.hp / e.maxHp;
        if (f <= W.S.at && e.state !== 'sleep' && !p.dead && Math.hypot(p.x - e.x, p.y - e.y) < 14 && (W.sigT -= dt) <= 0) {
          W.sigT = W.S.every[f <= 0.33 ? 1 : 0];
          for (const V of W.S.vol) for (let w = 0; w < (V.waves || 1); w++) W.q.push({ t: w * (V.gap || 0.2) + 0.001, V, w });
        }
      }
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
export function installOwBosses(Game) {
  Object.assign(Game.prototype, methods);
  const stat = Game.prototype.stat;                       // armour broken: no Defense while it lasts
  Game.prototype.stat = function (s) { return s === 'def' && this.player && this.player.owBroken > this.t ? 0 : stat.call(this, s); };
}
