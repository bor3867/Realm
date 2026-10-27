// The Realmforge dungeons' creatures on our own monster engine (2026-10-26: "everything on the same engine"). Each of
// their 220 kinds (art/rf/data.json explore.dungeons[d].enemies) becomes one of our monster definitions, the way
// src/bosses/rf_translate.js made their bosses ours: their movement to one of our ai kinds, their attacks to our
// patterns, their numbers brought to their dungeon's band (src/rf/balance.js). What has no place in our engine is
// listed, not guessed at: tools/rf_creatures_report.mjs prints, kind by kind, what came over whole and what didn't.
// Their art (pixel grids) is drawn into our registry by tools/rf_build_creatures.py as rf_crea/<dungeon>_<id>.
import { rfBalance } from './balance.js';

// their movement -> ours (a dash attack makes a charger, below)
const MOVE = { chase: 'shamble', kite: 'kite', drift: 'drift', hop: 'hop', burrow: 'burrow', still: 'rooted', swoop: 'swoop', orbit: 'orbit',
  blink: 'blink', patrol: 'shamble', leader: 'leader', formation: 'formation', mirror: 'flank', chess: 'shamble' };
// approximations: their kind came over, but as the nearest thing we have (said so in the report)
const NEAR_MOVE = new Set(['mirror', 'chess']);   // (patrol: once it has seen you, theirs simply chases)
// their attacks that bring others' protection: our rule is that monsters never shield or guard each other
const REFUSED = new Set(['shield', 'eclipseShield']);
// theirs we have nothing like yet (left out, listed)
const MISSING = new Set(['encase', 'ghostfire']);

// what a shot leaves you with: their sickness is our poison; their slow and root, a drag on your step
const inflict = (I) => (!I ? {} : I.k === 'sick' ? { poison: I.t || 3 } : I.k === 'slow' ? { slowHit: { f: 0.6, t: I.t || 1.2 } } : I.k === 'root' ? { slowHit: { f: 0.15, t: I.t || 0.8 } } : {});
// their sizes are in their pixels (16 a tile); their speeds already in tiles a second
const tiles = (px) => Math.max(0.3, Math.min(1.6, (px || 16) / 32));

// a dungeon's commonest creature shot
const DG_SHOT = new Map();
function dgShot(DATA, dg) {
  if (DG_SHOT.has(dg)) return DG_SHOT.get(dg);
  const n = {}; for (const e of Object.values(DATA.explore.dungeons[dg].enemies)) for (const a of [...(e.atk || []), ...(e.atk2 || [])]) if (a.shot) n[a.shot] = (n[a.shot] || 0) + 1;
  const best = Object.entries(n).sort((a, b) => b[1] - a[1])[0];
  DG_SHOT.set(dg, best ? best[0] : 'orb'); return DG_SHOT.get(dg);
}
// one creature: our definition, and what of it didn't come over (notes)
export function translateCreature(DATA, dg, id, e) {
  const bal = rfBalance(DATA, dg) || { hp: 1, dmg: 1 }, dmg = (k = 1) => Math.max(1, Math.round((e.dmg || 40) * bal.dmg * k)), notes = [];
  const shot = (s) => `rf_shot/${dg}_${s || dgShot(DATA, dg)}`;   // (an attack without a shot of its own: its dungeon's commonest)
  const attacks = [], D = {
    name: e.name, biome: `rf_${dg}`, hp: Math.max(1, Math.round((e.hp || 300) * bal.hp)), def: Math.round((e.armor || 0) * 10), speed: e.spd || 2.4,
    xp: Math.max(4, Math.round(((e.hp || 300) * bal.hp) / 30)), r: tiles(e.size) * 0.8, ai: MOVE[e.move] || 'shamble', aggro: e.sight || 9, fly: !!e.fly,
    rad: e.rad, spin: e.spin, reg: `rf_crea/${dg}_${id}`, scale: e.art && e.art.frames[0].length > 10 ? 0.5 : 1, contact: 0, attacks, loot: [], rfCrea: { dg, id }, desc: e.how,   // (scale: their 8px art at the player's pixel size, bigger art at the fine size)
  };
  if (!MOVE[e.move]) notes.push(`move "${e.move}": walks`); else if (NEAR_MOVE.has(e.move)) notes.push(`move "${e.move}": as ${D.ai}`);
  for (const a of [...(e.atk || []), ...(e.atk2 || [])]) {
    const cd = a.cd || 2.4, range = a.range || 7, tell = Math.round((a.wind || a.aim || 0.35) * 1000);
    switch (a.k) {
      case 'contact': D.contact = dmg(); if (a.inflict) D.touch = inflict(a.inflict); break;
      case 'aim': attacks.push({ pattern: 'aimed', count: a.n || 1, arc: (a.sp || 0) * Math.max(0, (a.n || 1) - 1), speed: a.v || 6, range, cd, dmg: dmg(), proj: shot(a.shot), tell: 300, ...inflict(a.inflict) }); break;
      case 'fan': attacks.push({ pattern: 'aimed', count: a.n || 5, arc: (a.sp || 0.2) * Math.max(0, (a.n || 5) - 1), speed: a.v || 6, range, cd, dmg: dmg(0.8), proj: shot(a.shot), tell: 350 }); break;
      case 'snipe': attacks.push({ pattern: 'aimed', count: 1, speed: a.v || 14, range: 13, cd, dmg: dmg(1.6), proj: shot(a.shot), tell }); break;
      case 'ring': attacks.push({ pattern: 'radial', count: a.n || 8, speed: a.v || 3.4, range: 8, cd, dmg: dmg(0.8), proj: shot(a.shot), tell: 400, ...inflict(a.inflict) }); break;
      case 'pulse': attacks.push({ pattern: 'pulse', count: 0, dur: a.dur || 0.8, range: a.range || 10, cd, dmg: 0, tell: 0, color: e.pulseC }); break;   // (for a moment it pushes you away)
      case 'overheat': attacks.push({ pattern: 'radial', count: a.n || 14, speed: 4.5, range: 8, cd, dmg: dmg(0.9), proj: shot(a.shot), tell }); break;
      case 'spiral': attacks.push({ pattern: 'radial', count: a.arms || 3, turn: a.step || 0.3, speed: a.v || 4.6, range: 8, cd: Math.max(0.15, cd), dmg: dmg(0.5), proj: shot(a.shot), tell: 0 }); break;
      case 'wave': attacks.push({ pattern: 'wall', count: a.n || 16, speed: a.v || 3.4, range: 10, cd, dmg: dmg(0.8), proj: shot(a.shot), tell: 450 }); break;
      case 'diag': attacks.push({ pattern: 'cross', count: 4, speed: a.v || 7, range: 8, cd, dmg: dmg(), proj: shot(a.shot), tell: 300 }); break;
      case 'line': attacks.push({ pattern: 'aimed', count: 1, speed: a.v || 8, range: a.range || 9, cd, dmg: dmg(), proj: shot(a.shot), tell: 300, waves: a.n || 3, gap: 0.12 }); break;   // (the same shot again, quickly)
      case 'lob': attacks.push({ pattern: 'aimed', count: a.n || 1, speed: 5, range: 8, cd, dmg: dmg(), proj: shot(a.shot), tell: 400, mv: { lob: { n: Math.round(4 + (a.r || 1.2) * 2), h: 30, spread: a.r || 1.2 } }, ...inflict(a.inflict) }); break;   // (lobbed: it bursts where it lands)
      case 'slam': attacks.push({ pattern: 'slam', r: a.r || 1.8, count: a.ring || 10, range: a.range || 3, cd, dmg: dmg(1.2), proj: shot(a.shot), tell, wind: 0.45 }); break;
      case 'dash': attacks.push({ pattern: 'aimed', count: 0, charge: 9, range: 6, cd, dmg: 0, tell: Math.round((a.wind || 0.6) * 1000) }); if (!D.contact) D.contact = dmg(); break;   // (a charge: wind up, rush, its body the blow)
      case 'summon': D.children = [`rf_${dg}_${a.what || id}`]; D.every = cd; D.cap = a.max || a.n || 4; break;
      case 'raise': attacks.push({ pattern: 'raise', count: 0, r: a.r || 8, range: 99, cd, dmg: 0, tell: 0, color: a.c }); break;   // (one of the fallen near it stands again)
      case 'chain': D.chain = { with: `rf_${dg}_${a.with || id}`, r: a.r || 7, dmg: dmg(a.dmg || 1), color: e.chainC }; break;   // (lightning between it and its kin: don't cross it)
      case 'heal': D.heal = { every: cd, r: 5, pct: Math.min(0.3, a.amt || 0.2) }; break;
      case 'trail': D.trail = { every: Math.max(0.25, cd), life: a.life || 3, dmg: dmg(a.dmg || 0.4), kind: a.kind || 'poison' }; break;
      default:
        if (REFUSED.has(a.k)) notes.push(`${a.k}: left out (monsters never shield each other)`);
        else if (MISSING.has(a.k)) notes.push(`${a.k}: not in our engine yet`);
        else notes.push(`${a.k}: unknown`);
    }
  }
  if (D.contact && !attacks.length && D.ai !== 'rooted') { D.keep = 0.3; D.closeIn = 0.3; }   // (it hurts by touch alone: it comes right up to you)
  if (e.rare && !attacks.length && !D.contact && D.ai !== 'rooted') D.ai = 'flee';   // (a golden one, carrying its treasure: it runs, RotMG's way)
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
