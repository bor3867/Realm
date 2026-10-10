// The Realm Remaster's new content (docs/design/09_remaster.md), mixed into Game like elites.js.
// - The original bosses gain the remaster's phase 2 and 3: at 66% and 33% of their life they morph (immune, their
//   bullets cleared, the morph clip, a banner with the phase's name), then wear that phase's art; they die with its
//   death clip. Each phase also adds one attack built from that phase's two new shots, into that phase's rotation.
// - Monsters fire their new shot now and then in place of their usual one; champions add a signature volley with
//   their two new shots every few seconds.
import { REALM_BOSSES, DUNGEON_BOSSES } from './data/enemies.js';

const TAU = Math.PI * 2;
const R = Math.random;
const S = (boss, shot) => `rx_shots/${boss}.${shot}`;
// attack shapes for the new shots (the old boss engine's patterns, with a movement each)
const F = {
  fan: { pattern: 'aimed', count: 5, arc: 0.9, speed: 6, range: 11 },
  volley: { pattern: 'aimed', count: 3, arc: 0.35, waves: 3, gap: 0.22, speed: 7.5, range: 12 },
  ring: { pattern: 'radial', count: 18, speed: 4, range: 12 },
  rings: { pattern: 'radial', count: 14, waves: 3, gap: 0.3, turn: 0.12, speed: 4.5, range: 12 },
  curl: { pattern: 'radial', count: 12, speed: 4, range: 12, mv: { curve: 0.9 } },
  sway: { pattern: 'aimed', count: 7, arc: 1.2, speed: 5, range: 12, mv: { wave: { amp: 0.5, freq: 4 } } },
  hunt: { pattern: 'aimed', count: 3, arc: 1.0, speed: 3.5, range: 10, mv: { seek: 1.4 } },
  surge: { pattern: 'radial', count: 10, speed: 1.5, range: 13, mv: { accel: 4, max: 7 } },
  boomer: { pattern: 'aimed', count: 4, arc: 1.2, speed: 6.5, range: 99, mv: { boomer: 1 } },
  burst: { pattern: 'aimed', count: 3, arc: 0.6, speed: 5, range: 12, mv: { split: { at: 0.6, n: 6, speed: 4.5, range: 4 } } },
  wall: { pattern: 'wall', count: 9, space: 0.7, speed: 5, range: 13 },
  cage: { pattern: 'cage', count: 10, r: 4, speed: 3.5, range: 6 },
  orbit: { pattern: 'orbit', count: 6, r: 1.6, speed: 5, range: 12, spin: 1.2 },
  cross: { pattern: 'cross', count: 8, speed: 5, range: 12 },
  scatter: { pattern: 'shotgun', count: 10, arc: 0.9, speed: 6, range: 10 },
};
// boss: [shots in phase order (2 per phase), the shape of each, the phase names]
export const RX_BOSSES = {
  brine_cathedral: [['brine_bubble', 'rose_shard', 'bell_toll', 'barnacle_burst', 'claw_snap', 'rose_pearl'], ['surge', 'fan', 'rings', 'burst', 'scatter', 'curl']],
  wick_mother: [['fen_fire', 'tallow_drop', 'lit_taper', 'green_ember', 'marsh_skull', 'wisp_lash'], ['sway', 'scatter', 'volley', 'curl', 'hunt', 'wall']],
  orrery_of_winter: [['frost_moon', 'icicle_bolt', 'snowflake', 'rime_ring', 'zero_lance', 'frozen_gaze'], ['orbit', 'volley', 'curl', 'rings', 'wall', 'hunt']],
  penitent_colossus: [['gold_shard', 'penance_ray', 'halo_disc', 'absolution_spear', 'marble_chunk', 'gilded_star'], ['scatter', 'volley', 'boomer', 'wall', 'burst', 'curl']],
  emily_the_yapper: [['yap_bubble', 'snowball', 'sound_ring', 'megayap', 'royal_herring', 'crown_jewel'], ['sway', 'scatter', 'rings', 'fan', 'boomer', 'cross']],
  the_fallen_star: [['starfall_ember', 'eye_lance', 'magma_shard', 'solar_flare', 'nova_star', 'halo_shard'], ['scatter', 'volley', 'burst', 'surge', 'rings', 'orbit']],
  drowned_abbot: [['holy_droplet', 'censer_cross', 'coral_spike', 'tide_orb', 'ink_eel', 'lure_light'], ['scatter', 'cross', 'wall', 'hunt', 'sway', 'cage']],
  fallen_heart: [['blood_tear', 'gilded_ember', 'thorn_lance', 'heart_shard', 'godfire_orb', 'rib_feather'], ['sway', 'curl', 'wall', 'burst', 'hunt', 'fan']],
  the_archivist: [['quill_dart', 'ink_blot', 'page_cutter', 'glyph_seal', 'eye_bolt', 'ink_tendril'], ['volley', 'burst', 'boomer', 'cage', 'fan', 'sway']],
  honey_queen: [['royal_stinger', 'honey_drop', 'comb_shard', 'honey_glob', 'jelly_orb', 'drone'], ['volley', 'scatter', 'cross', 'burst', 'surge', 'hunt']],
  the_puppeteer: [['control_cross', 'string_lash', 'comedy_mask', 'tragedy_mask', 'severed_string', 'splinter'], ['cross', 'wall', 'boomer', 'curl', 'sway', 'scatter']],
  prism_wyrm: [['prism_shard', 'split_ray', 'white_lance', 'facet_star', 'chroma_fang', 'core_nova'], ['fan', 'burst', 'volley', 'curl', 'sway', 'rings']],
  the_sleeper: [['dream_bubble', 'sleepy_z', 'star_dust', 'crescent_moon', 'nightmare_eye', 'shadow_tendril'], ['surge', 'sway', 'scatter', 'boomer', 'hunt', 'cage']],
  the_unstruck_god: [['orbit_mote', 'gold_gauntlet', 'porcelain_shard', 'seamlight', 'cold_star', 'halo_ring'], ['orbit', 'volley', 'scatter', 'wall', 'curl', 'rings']],
  the_unstruck: [['slag_bolt', 'rune_brand', 'hot_rivet', 'anvil_spark', 'thrown_hammer', 'white_ingot'], ['volley', 'cross', 'scatter', 'burst', 'boomer', 'surge']],
};
// the Crypt's Lich and the Emberforge's Colossus fight on the three-phase framework with the Boss Overhaul's art, so
// the remaster's versions of those two (its tidebound_lich and forgeheart_colossus) have nothing to replace

// wire the new attacks into each boss's own rotation: one 'rx' slot per data phase, filled by the art phase it's in
const avgDmg = (D) => {
  const all = Object.values(D.moves || {}).flatMap((M) => M.fire || []).map((f) => f.dmg).filter(Boolean);
  return all.length ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : 60;
};
const artPhase = (frac) => (frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3);
for (const [id, [shots, forms]] of Object.entries(RX_BOSSES)) {
  const D = REALM_BOSSES[id] || DUNGEON_BOSSES[id];
  if (!D || !D.phases) continue;
  const dmg = avgDmg(D);
  for (let n = 1; n <= 3; n++) {
    const a = shots[(n - 1) * 2], b = shots[(n - 1) * 2 + 1];
    D.moves[`rx${n}`] = { tell: 0.6, recover: 0.7, fire: [
      { ...F[forms[(n - 1) * 2]], proj: S(id, a), dmg, size: 0.45 },
      { ...F[forms[(n - 1) * 2 + 1]], proj: S(id, b), dmg: Math.round(dmg * 0.9), size: 0.45, delay: 0.35 }] };
  }
  D.moves.rx = D.moves.rx1;                             // the slot in the rotation; game.js picks rx1-3 by the phase it's in
  for (const P of D.phases) for (const L of [P.cycle, P.after]) if (L && !L.includes('rx')) L.splice(Math.ceil(L.length / 2), 0, 'rx');   // after: the rotation a frenzy settles into
}

const methods = {
  // the remaster's art for a boss (null if it has none)
  rxDef(id) { const r = this.A.reg; return r ? r.resolve(`rx_${id}/${id}`) : null; },
  // morphs: at 66% and 33% a boss with phase art becomes its next phase
  rxPhaseTick(e, dt) {
    const id = e === this.boss ? 'the_unstruck' : e.id, def = this.rxDef(id);
    if (!def || e.dead) return;
    if (e.rxMorph) { e.rxMorph.t += dt; if (e.rxMorph.t >= 0.7) e.rxMorph = null; }
    const n = artPhase(e.hp / e.maxHp);
    if (!e.rxPhase) e.rxPhase = n;
    if (n <= e.rxPhase) return;
    const from = e.rxPhase;
    e.rxPhase = n; e.rxMorph = { from, to: n, t: 0 };
    if (e !== this.boss) e.invulnT = Math.max(e.invulnT || 0, 0.7);
    const name = this.D_name(e);
    this.projectiles = this.projectiles.filter((b) => !(b.from === 'e' && b.by === name));
    const names = def.meta.phaseNames || {};
    this.banner(`${(names[n] || name).toUpperCase()}`, 2400); this.vx({ k: 'shake', amt: 6 }); this.sfx('boss');
  },
  D_name(e) { return e.D ? e.D.name : 'The Unstruck'; },
  // the Unstruck has its own engine: its new shots (two per phase) come on a timer
  rxUnstruck(B, dt) {
    if (!B || B.state === 'dead' || !B.rxPhase) return;
    if ((B.rxT = (B.rxT ?? 2.5) - dt) > 0) return;
    B.rxT = B.rxPhase === 1 ? 4.2 : 3.2;
    const [shots, forms] = RX_BOSSES.the_unstruck, n = B.rxPhase, p = this.player, ox = B.x, oy = B.y - 1.4, aim = Math.atan2(p.y - oy, p.x - ox);
    for (const k of [0, 1]) {
      const A = F[forms[(n - 1) * 2 + k]], proj = S('the_unstruck', shots[(n - 1) * 2 + k]), cnt = A.count || 8;
      for (let i = 0; i < cnt; i++) {
        const a = A.pattern === 'radial' || A.pattern === 'cross' ? (i / cnt) * TAU + (k ? 0.2 : 0) : aim + (cnt > 1 ? (i / (cnt - 1) - 0.5) * (A.arc || 0.8) : 0);
        const b = this.shoot('e', ox, oy, a, A.speed, A.range === 99 ? 14 : A.range, 70, proj, 0.45, false, 'The Unstruck');
        if (A.mv) b.mv = { ...A.mv };
      }
    }
  },
  // monsters: now and then their new shot instead of their usual one; champions keep theirs for the signature
  rxAlt(e, A) {
    if (e.rb || !e.D || !A || !A.proj) return A;
    const list = this.rxShotsOf(e.id);
    if (!list.length || this.isChampion(e)) return A;
    if ((e.rxN = (e.rxN || 0) + 1) % 4 !== 0) return A;
    return { ...A, proj: list[0] };
  },
  rxShotsOf(id) {
    if (!this.rxShots) {
      this.rxShots = {};
      if (this.A.reg) for (const d of this.A.reg.list((x) => x.sheet === 'rx_shots')) (this.rxShots[d.meta.owner] = this.rxShots[d.meta.owner] || []).push(d.key);
    }
    return this.rxShots[id] || [];
  },
  isChampion(e) { const S2 = this.A.sheets && this.A.sheets.champions; return !!(S2 && S2.guide.champions[e.id]); },
  // champions: a signature volley with both new shots every few seconds while they fight you
  rxSignature(e, dt, d) {
    if (e.rb || !this.isChampion(e) || d > (e.D.aggro || 9) || this.player.dead) return;
    const list = this.rxShotsOf(e.id);
    if (list.length < 2) return;
    if ((e.rxSig = (e.rxSig ?? 3 + R() * 3) - dt) > 0) return;
    e.rxSig = 5 + R() * 2.5;
    const dmg = Math.max(30, Math.round(((e.D.attacks || [])[0] || {}).dmg || 40));
    this.firePattern(e, { pattern: 'radial', count: 10, speed: 4, range: 8, dmg, proj: list[0], size: 0.4 }, true);
    e.queue.push({ t: 0.35, atk: { pattern: 'aimed', count: 3, arc: 0.4, speed: 6.5, range: 10, dmg, proj: list[1], size: 0.4 } });
  },
};

// which frame of the remaster's art to draw now (null: phase 1's own row)
export function rxFrame(Rg, g, e) {
  const id = e === g.boss ? 'the_unstruck' : e.id, def = Rg && Rg.resolve(`rx_${id}/${id}`);
  if (!def) return null;
  const dead = e === g.boss ? e.state === 'dead' : e.dead;
  let fn;
  if (dead) fn = `death_${Math.min(3, Math.floor((e.deadT || 0) * 5))}`;
  else if (e.rxMorph) fn = `p${e.rxMorph.from}_to_p${e.rxMorph.to}_${Math.min(3, Math.floor(e.rxMorph.t * 6))}`;
  else if ((e.rxPhase || 1) >= 2) {
    const n = e.rxPhase, st = e.state;
    fn = /tell/.test(st) ? `p${n}_attack_0` : /attack|spin|beam|radial/.test(st) ? `p${n}_attack_1` : `p${n}_idle_${Math.floor(g.t * 5) % 4}`;
  } else return null;
  const f = def.frames[fn];
  return f ? { img: def.img, x: f.x, y: f.y, w: f.w } : null;
}

export function installRemaster(Game) { Object.assign(Game.prototype, methods); }
