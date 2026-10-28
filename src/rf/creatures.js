// The Realmforge dungeons' creatures on our own monster engine (2026-10-26: "everything on the same engine"). Each of
// their 220 kinds (art/rf/data.json explore.dungeons[d].enemies) becomes one of our monster definitions, the way
// src/bosses/rf_translate.js made their bosses ours: their movement to one of our ai kinds, their attacks to our
// patterns, their numbers brought to their dungeon's band (src/rf/balance.js). What has no place in our engine is
// listed, not guessed at: tools/rf_creatures_report.mjs prints, kind by kind, what came over whole and what didn't.
// Their art (pixel grids) is drawn into our registry by tools/rf_build_creatures.py as rf_crea/<dungeon>_<id>.
import { rfBalance } from './balance.js';

// their movement -> ours: our ai (for what our engine does round them) and, once one is fighting, their own movement
// code run as theirs ran it (D.rfMove: Game.rfMoveStep, src/rf/host.js)
const MOVE = { chase: 'shamble', kite: 'kite', drift: 'drift', hop: 'hop', burrow: 'burrow', still: 'rooted', swoop: 'swoop', orbit: 'orbit',
  blink: 'blink', patrol: 'shamble', leader: 'leader', formation: 'formation', mirror: 'flank', chess: 'shamble' };
const RF_MOVE = new Set(['chase', 'kite', 'drift', 'hop', 'burrow', 'still', 'swoop', 'orbit', 'blink', 'patrol', 'leader', 'formation']);
// approximations: their kind came over, but as the nearest thing we have (said so in the report)
const NEAR_MOVE = new Set(['mirror', 'chess']);
// their attacks that bring others' protection: our rule is that monsters never shield or guard each other
const REFUSED = new Set(['shield', 'eclipseShield']);
// theirs we have nothing like yet (left out, listed)
const MISSING = new Set(['encase', 'ghostfire']);

// what a shot or a touch leaves you with, as theirs (inflict in explore.js): sick stops your regeneration a while;
// slow is 0.55 of your step, root 0.12
const inflict = (I) => (!I ? {} : I.k === 'sick' ? { sick: I.t || 4 } : I.k === 'slow' ? { slowHit: { f: 0.55, t: I.t || 1.5 } } : I.k === 'root' ? { slowHit: { f: 0.12, t: I.t || 0.8 } } : {});

// a dungeon's commonest creature shot (their shoot() falls back to a sheet's first shot; ours to this)
const DG_SHOT = new Map();
function dgShot(DATA, dg) {
  if (DG_SHOT.has(dg)) return DG_SHOT.get(dg);
  const n = {}; for (const e of Object.values(DATA.explore.dungeons[dg].enemies)) for (const a of [...(e.atk || []), ...(e.atk2 || [])]) if (a.shot) n[a.shot] = (n[a.shot] || 0) + 1;
  const best = Object.entries(n).sort((a, b) => b[1] - a[1])[0];
  DG_SHOT.set(dg, best ? best[0] : 'orb'); return DG_SHOT.get(dg);
}
// one creature: our definition, and what of it didn't come over (notes). Every number is theirs (explore.js stepEnemy:
// an attack's damage is the creature's unless it says otherwise, its shots live 3 s unless it says otherwise, a
// cooldown is 1.5 s unless it says otherwise), brought to their dungeon's band (src/rf/balance.js)
export function translateCreature(DATA, dg, id, e) {
  const bal = rfBalance(DATA, dg) || { hp: 1, dmg: 1 }, dmg = (k = 1) => Math.max(1, Math.round((e.dmg || 40) * bal.dmg * k)), notes = [];
  const shot = (s) => `rf_shot/${dg}_${s || e.shot || dgShot(DATA, dg)}`;
  const r = e.r || (e.size > 16 ? 1.0 : e.size <= 8 ? 0.4 : 0.6);   // (their body)
  const attacks = [], D = {
    name: e.name, biome: `rf_${dg}`, hp: Math.max(1, Math.round((e.hp || 300) * bal.hp)), def: Math.round((e.armor || 0) * 10), speed: e.spd || 0,
    xp: Math.max(4, Math.round(((e.hp || 300) * bal.hp) / 30)), r, ai: MOVE[e.move] || 'shamble', aggro: e.sight || 7.5, fly: !!e.fly,
    rfMove: RF_MOVE.has(e.move) ? e.move : null, weave: e.weave, rg: e.range, hopCd: e.hopCd, per: e.per, blinkCd: e.blinkCd, up: e.up, down: e.down, dashTrail: e.dashTrail ? { kind: e.dashTrail, dmg: dmg(0.3) } : undefined,
    rad: e.rad, spin: e.spin, reg: `rf_crea/${dg}_${id}`, scale: e.art && e.art.frames[0].length > 10 ? 0.5 : 1, contact: 0, attacks, loot: [], rfCrea: { dg, id }, desc: e.how,   // (scale: their 8px art at the player's pixel size, bigger art at the fine size)
  };
  if (!MOVE[e.move]) notes.push(`move "${e.move}": walks`); else if (NEAR_MOVE.has(e.move)) notes.push(`move "${e.move}": as ${D.ai}`);
  for (const a of [...(e.atk || []), ...(e.atk2 || [])]) {
    const cd = a.cd || 1.5, v = a.v || 6.5, dm = dmg(a.dmg || 1), proj = shot(a.shot);
    const T = { cd, trigger: a.range || 10, tell: a.tele ? Math.round(a.tele * 1000) : 0, ...(a.beat ? { beat: true, parity: a.parity } : {}) };   // (fired within its range; a tele: a wind-up first; some only on the beat)
    switch (a.k) {
      case 'contact': D.contact = dmg(); D.touchR = r + 0.35; D.touchCd = 0.8; if (a.inflict) D.touch = inflict(a.inflict); break;
      case 'aim': { const n = a.n || 1; attacks.push({ ...T, pattern: 'aimed', count: n, arc: (a.sp || 0.2) * (n - 1), speed: v, range: v * 3, dmg: dm, proj, ...(a.bounce ? { bounce: a.bounce } : {}), ...(a.curve ? { mv: { curve: a.curve, curveK: true } } : {}), ...inflict(a.inflict) }); break; }
      case 'fan': { const n = a.n || 5; attacks.push({ ...T, pattern: 'aimed', count: n, arc: (a.sp || 0.25) * (n - 1), seq: a.gapT || 0.09, speed: v, range: v * 3, dmg: dm, proj }); break; }   // (one shot after another, sweeping)
      case 'line': attacks.push({ ...T, pattern: 'aimed', count: 1, waves: a.n || 4, gap: a.gapT || 0.12, speed: v, range: v * 3, dmg: dm, proj }); break;   // (the same shot again, quickly, each at you)
      case 'snipe': attacks.push({ ...T, pattern: 'aimed', count: 1, speed: a.v || 14, range: (a.v || 14) * 1.6, dmg: dm, proj, tell: Math.round((a.aim || 0.9) * 1000), ...inflict(a.inflict) }); break;
      case 'ring': attacks.push({ ...T, pattern: 'radial', count: a.n || 8, speed: v, range: v * (a.life || 3), dmg: dm, proj, gap: !!a.gap, rot: a.rot, aimRing: !!a.aimed, rand: !a.rot && !a.aimed, ...(a.curve ? { mv: { curve: a.curve } } : {}), ...inflict(a.inflict) }); break;
      case 'spiral': attacks.push({ ...T, pattern: 'radial', count: a.arms || 2, turn: a.step || 0.42, speed: v, range: v * (a.life || 2.6), dmg: dm, proj }); break;
      case 'wave': attacks.push({ ...T, pattern: 'radial', count: a.n || 20, speed: a.v || 3.5, range: (a.v || 3.5) * (a.life || 2.2), dmg: dm, proj, fixed: true, ...inflict(a.inflict || { k: 'slow', t: 1 }) }); break;   // (a slow ring, every way at once)
      case 'diag': attacks.push({ ...T, pattern: 'cross', x: true, count: 4, speed: a.v || 7, range: (a.v || 7) * 3, dmg: dmg(), proj }); break;   // (their Keep's bishop: always the four diagonals)
      case 'lob': attacks.push({ ...T, pattern: 'mark', count: a.n || 1, r: a.r || 1.1, at: a.at || 1.1, ring: a.ring || 0, dmg: dm, proj, color: a.c, ...inflict(a.inflict) }); break;   // (a circle marked where you stand, then it lands)
      case 'slam': attacks.push({ ...T, pattern: 'slam', r: a.r || 1.8, count: a.ring || 0, wind: a.wind || 0.8, shardV: 5, shardF: 0.45, freeze: true, range: 0, dmg: dm, proj, ...(a.trail ? { pool: { life: a.trail, dmg: dmg(0.4), kind: a.trailKind } } : {}) }); break;
      case 'overheat': attacks.push({ ...T, pattern: 'overheat', count: a.n || 14, speed: a.v || 5, range: (a.v || 5) * 3, wind: a.wind || 1.2, dmg: dm, poolDmg: dmg(0.35), proj }); break;
      case 'dash': attacks.push({ ...T, pattern: 'aimed', count: 0, charge: 11, chargeT: a.dur || 0.45, chargeDmg: dmg(1.2), range: 0, dmg: 0, tell: Math.round((a.wind || 0.5) * 1000) }); break;   // (a wind-up, then a rush; its body the blow)
      case 'pulse': attacks.push({ ...T, pattern: 'pulse', count: 0, dur: a.dur || 0.8, range: 0, dmg: 0, color: e.pulseC }); break;   // (for a moment it pushes you away)
      case 'summon': attacks.push({ ...T, trigger: 99, pattern: 'summon', what: `rf_${dg}_${a.what || id}`, n: a.n || 2, max: a.max || 4, count: 0, range: 0, dmg: 0 }); break;
      case 'raise': attacks.push({ ...T, trigger: 99, pattern: 'raise', count: 0, r: a.r || 8, range: 0, dmg: 0, color: a.c }); break;   // (one of the fallen near it stands again)
      case 'heal': attacks.push({ ...T, trigger: 99, pattern: 'mend', count: 0, r: a.r || 6, amt: a.amt || 0.25, range: 0, dmg: 0, color: a.c }); break;   // (the most hurt of its kin near it)
      case 'trail': attacks.push({ ...T, pattern: 'trail', count: 0, r: a.r || 0.55, life: a.life || 4, dmg: a.dmg ? dmg(a.dmg) : 0, slow: a.slow, root: a.root, kind: a.kind || 'fire', range: 0 }); break;
      case 'chain': D.chain = { with: `rf_${dg}_${a.with || id}`, r: a.r || 7, dmg: dmg(a.dmg || 1), color: e.chainC }; break;   // (lightning between it and its kin: don't cross it)
      default:
        if (REFUSED.has(a.k)) notes.push(`${a.k}: left out (monsters never shield each other)`);
        else if (MISSING.has(a.k)) notes.push(`${a.k}: not in our engine yet`);
        else notes.push(`${a.k}: unknown`);
    }
  }
  // their one-off traits we have yet to build (the ones that matter to a fight)
  // (gaze: their dungeon's own rule runs it, for ours too; mirageVuln: their engine never reads it)
  for (const k of ['reflect', 'rebirth', 'guard', 'shieldsOthers', 'copyShots', 'echo', 'afterimage', 'moonVuln', 'shadeVuln', 'solar', 'lava', 'cuckoo'])
    if (e[k]) notes.push(`${k}: ${k === 'guard' || k === 'shieldsOthers' ? 'left out (monsters never guard each other)' : 'not in our engine yet'}`);
  if (e.split) D.split = { id: `rf_${dg}_${typeof e.split === 'string' ? e.split : id}`, n: e.split.n || 2 };
  return { id: `rf_${dg}_${id}`, D, notes };
}

// every one of them: { defs: {id: D}, report: [{id, dungeon, name, notes}] }
export function translateAll(DATA) {
  const defs = {}, report = [];
  for (const [dg, X] of Object.entries(DATA.explore.dungeons)) for (const [id, e] of Object.entries(X.enemies)) {
    if (e.boss) continue;                                          // (their bosses are ours already: rf_translate.js)
    const T = translateCreature(DATA, dg, id, e);
    defs[T.id] = T.D; report.push({ id: T.id, dungeon: dg, name: e.name, notes: T.notes });
  }
  return { defs, report };
}
