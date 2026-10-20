// Realmforge bosses on our three-phase boss engine (src/bossx.js), part 2: their fights, translated at load time from
// their data (art/rf/data.json). Each of their phases becomes one of ours, at the Life their phase begins (their
// "75–55%"); in it the boss moves their way (mv) and runs their emitters (em) on their own clocks, as their engine did:
//   aim     n shots in a spread of sp degrees at you        ring    n round, turned rot degrees each time (from 12 up,
//   spiral  arms stepping step degrees each time                    a two-shot gap near you)
//   aoe     a marked circle that bursts where you stand     other kinds: still to come (docs/multiplayer.md)
// Their art: tools/rf_build_bx.py (sheet 'bx_rf_<id>', shots 'rfx_shots/<boss>.<shot>'). Their numbers: their dungeon's
// band (src/rf/balance.js), as their own engine had them. Each becomes BX['rfx_<id>'].
import { BX } from './index.js';
import { bandOfBoss } from '../rf/balance.js';

const D2R = Math.PI / 180, TAU = Math.PI * 2;
// "100–75%" -> 1, "75–55%" -> 0.75 (the Life at which the phase begins)
const startOf = (s) => { const m = /(\d+)/.exec(String(s || '')); return m ? +m[1] / 100 : 1; };

// how they move (their mv.m): round the place it rose (its home) or round you
function moves() {
  const step = (g, e, tx, ty, sp, dt) => { const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy); if (d > 0.2) g.moveCircle(e, (dx / d) * Math.min(d, sp * dt), (dy / d) * Math.min(d, sp * dt), 0.8); };
  const home = (e) => e.rfHome || (e.rfHome = { x: e.x, y: e.y });
  const spd = (e, k = 1) => (e.rfMv && e.rfMv.spd ? e.rfMv.spd : 1.2) * k;
  const M = {
    rf_center(g, e, dt) { const H = home(e); step(g, e, H.x, H.y, spd(e, 1.5), dt); },
    rf_chase(g, e, dt) { const p = g.player; if (Math.hypot(p.x - e.x, p.y - e.y) > 2.5) step(g, e, p.x, p.y, spd(e), dt); },
    rf_strafe(g, e, dt) { const p = g.player, a = Math.atan2(e.y - p.y, e.x - p.x) + dt * 0.6; step(g, e, p.x + Math.cos(a) * 6, p.y + Math.sin(a) * 6, spd(e, 1.4), dt); },
    rf_orbit(g, e, dt) { const H = home(e), a = (e.rfA = (e.rfA || 0) + dt * 0.5); step(g, e, H.x + Math.cos(a) * 4, H.y + Math.sin(a) * 4, spd(e, 1.6), dt); },
    rf_wander(g, e, dt) { const H = home(e); if (!e.rfT || Math.hypot(e.rfT.x - e.x, e.rfT.y - e.y) < 0.5 || (e.rfTT = (e.rfTT || 0) - dt) <= 0) { const a = Math.random() * TAU, r = 1 + Math.random() * 4; e.rfT = { x: H.x + Math.cos(a) * r, y: H.y + Math.sin(a) * r }; e.rfTT = 3; } step(g, e, e.rfT.x, e.rfT.y, spd(e), dt); },
    rf_fig8(g, e, dt) { const H = home(e), a = (e.rfA = (e.rfA || 0) + dt * 0.6); step(g, e, H.x + Math.sin(a) * 5, H.y + Math.sin(a * 2) * 2.5, spd(e, 1.6), dt); },
  };
  M.rf_middle = M.rf_center;
  return M;
}
const MOVE_OF = { middle: 'rf_center', center: 'rf_center', chase: 'rf_chase', strafe: 'rf_strafe', orbit: 'rf_orbit', wander: 'rf_wander', fig8: 'rf_fig8',
  aisle: 'rf_strafe', mirror: 'rf_strafe', charge: 'rf_chase', dash: 'rf_chase', gravehop: 'rf_wander', worm: 'rf_wander', burrow: 'rf_wander', teleport: 'rf_wander', swap: 'rf_center', leap: 'rf_chase', dive: 'rf_chase' };

// one emitter firing: their shot, our projectile
function fire(g, e, B, bal, em, vol) {
  const s = B.shots[em.s];
  if (!s) return;
  const p = g.player, [ox, oy] = g.bxOrigin(e), aim = Math.atan2(p.y - 0.4 - oy, p.x - ox);
  const shot = (a) => g.shoot('e', ox, oy, a, s.speed || 5, s.range || 8, Math.round((s.dmg || 60) * bal.bossDmg), `rfx_shots/${B.id}.${em.s}`, 0.35, false, e.D.name);
  if (em.t === 'aim') { const n = em.n || 1, sp = (em.sp || 0) * D2R; for (let i = 0; i < n; i++) shot(aim + (n > 1 ? -sp / 2 + (sp * i) / (n - 1) : 0)); }
  else if (em.t === 'ring') {
    const n = em.n || 8, off = vol * (em.rot || 0) * D2R;
    let g0 = -9;
    if (n >= 12 && !em.full) { const want = aim + (Math.random() * 2.2 - 1.1); g0 = Math.round(((((want - off) / (TAU / n)) % n) + n) % n); }
    for (let i = 0; i < n; i++) if (i !== g0 && i !== (g0 + 1) % n) shot(off + (i * TAU) / n);
  } else if (em.t === 'spiral') { const arms = em.arms || 1, off = vol * (em.step || 10) * D2R; for (let i = 0; i < arms; i++) shot(off + (i * TAU) / arms); }
  else if (em.t === 'aoe') {
    const r = em.r || 2, at = em.at === 'self' ? { x: e.x, y: e.y } : { x: p.x, y: p.y };
    g.fx.push({ kind: 'zone', x: at.x, y: at.y, r, t: 0, delay: em.delay || 1, life: (em.delay || 1) + 0.15, dmg: Math.round((s.dmg || 80) * bal.bossDmg), by: e.D.name, done: false, colors: [s.color || '#ff6a4a', '#ffffff'] });
  }
}

export function rfBossToBX(DATA, B) {
  const bal = bandOfBoss(DATA, B.id) || { bossHp: 2, bossDmg: 0.8, bossDef: B.def || 0, tiers: [5, 8] };
  const P = B.phases || [];
  const phases = {}, thresholds = [];
  P.forEach((ph, i) => {
    if (i) thresholds.push(Math.min(0.99, startOf(ph.hp)));
    phases[i + 1] = { move: MOVE_OF[ph.mv && ph.mv.m] || 'rf_center', rfMv: ph.mv, rfEm: (ph.em || []).filter((em) => ['aim', 'ring', 'spiral', 'aoe'].includes(em.t)),
      patterns: [{ name: ph.name, windup: 0.4, recover: 5.5, volleys: [{ form: 'special', name: 'rfEmit' }] }] };
  });
  const T2 = [bal.tiers[0] + 1, bal.tiers[1] + 1];
  return {
    id: `rfx_${B.id}`, art: `rf_${B.id}`, name: B.name, hp: Math.round(B.hp * bal.bossHp), def: bal.bossDef ?? Math.min(B.def || 0, 30), xp: Math.round(B.hp / 40),
    r: 1.6, speed: 1.2, keep: 6, faces: false, thresholds, phases, rfData: B,
    moves: moves(),
    specials: {
      // a phase's emitters, each on its own clock, for the length of the pattern
      rfEmit(g, e) { const S = e.bx, ph = S.B.phases[S.phase]; e.rfMv = ph.rfMv; S.rfEm = { list: ph.rfEm.map((em) => ({ em, t: 0.3 + Math.random() * 0.4, vol: 0 })), until: S.t + 5.6 }; },
    },
    update(g, e, dt) {
      const S = e.bx, R = S.rfEm;
      if (!R || S.t > R.until || S.state === 'morph' || S.state === 'death' || S.state === 'deathhold') return;
      for (const q of R.list) if ((q.t -= dt) <= 0) { q.t = q.em.e || 1.5; fire(g, e, B, bal, q.em, q.vol++); }
    },
    loot: [...(B.drops || []).map((d) => ({ id: `rf_${d.id}`, p: d.rarity === 'mythic' ? 0.02 : d.rarity === 'legendary' ? 0.08 : 0.2 })),
      { slot: 'weapon', tiers: T2, p: 0.8 }, { slot: 'armor', tiers: T2, p: 0.8 }, { slot: 'ring', tiers: [1, 3], p: 0.5 }, { slot: 'ability', tiers: [3, 5], p: 0.5 }, { stat: true, p: 0.6 }, { id: 'pot_hp', p: 1 }],
  };
}
// every Realmforge boss, added to the engine's list (the browser after its data loads; the server at start)
export function addRfBosses(DATA) {
  for (const B of DATA.bosses || []) BX[`rfx_${B.id}`] = rfBossToBX(DATA, B);
  return Object.keys(BX).filter((k) => k.startsWith('rfx_')).length;
}
