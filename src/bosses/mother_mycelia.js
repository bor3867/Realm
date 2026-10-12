// Mother Mycelia: the boss of Mirerot Grotto (docs/design/boss_mother_mycelia.md).
// Her arena is the Mire: an island of mud in a ring of bog, spore pods round its edge. Her own mechanics: spore
// clouds that hang where they stop, needles that poison, acid that pools where it lands, a lunge that ends in a
// short bite, seeds that sprout into sporelings unless shot, and toxic orbs that curl outward and gather speed.
const TAU = Math.PI * 2, R = Math.random;
const SHOT = (n) => `bx_shots/mother_mycelia.${n}`;
const angleTo = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);
const centre = (e) => { const A = e.bx.arena; return A ? [A.x + A.w / 2, A.y + A.h / 2] : [e.x, e.y]; };

// spore clouds: puffs that slow, stop 3-5 tiles out and hang there for a while (touch one: it hurts and poisons)
function clouds(g, e, V) {
  const p = g.player, [ox, oy] = g.bxOrigin(e), aim = g.bxAim(e, ox, oy), n = V.n || 5;
  for (let k = 0; k < n; k++) {
    const a = aim + (k / (n - 1) - 0.5) * 2.2, d = 3 + R() * 2;
    const b = g.bxShot(e, ox, oy, a, { shot: 'spore_puff', speed: 4, range: 99, dmg: V.dmg || 70, size: 0.6, mv: { wave: { amp: 0.25, freq: 2 } } });
    b.mrStop = d; b.mrHang = 4; b.poison = 2;
  }
}
// needle bursts: three quick fans of five, each needle poisons
function needles(g, e, V) {
  for (let k = 0; k < 3; k++) e.bx.vol.push({ t: k * 0.15, V: { form: 'fan', shot: 'poison_needle', count: 5, spread: 0.5, speed: 8, range: 9, dmg: V.dmg || 75, poison: 1.5 } });
}
// acid globs: lobbed at and around you; each leaves a burning puddle where it lands
function acid(g, e, V) {
  const p = g.player, [ox, oy] = g.bxOrigin(e);
  for (let k = 0; k < (V.n || 4); k++) {
    const a = R() * TAU, d = k ? 1.4 + R() * 2.2 : 0, x1 = p.x + Math.cos(a) * d, y1 = p.y + Math.sin(a) * d;
    const T = Math.max(0.7, Math.min(1.3, Math.hypot(x1 - ox, y1 - oy) / 7));
    const b = g.shoot('e', ox, oy, angleTo(ox, oy, x1, y1), 7, 99, g.bxDmg(e, V.dmg || 80), SHOT('acid_glob'), 0.45, false, e.D.name);
    b.bxOf = e;
    b.lob = { x0: ox, y0: oy, x1, y1, t: 0, T, h: 30, n: 0, r: 1.0, ss: 0,
      onLand: (G) => { (G.map.mrPuddles = G.map.mrPuddles || []).push({ x: x1, y: y1, r: 1.2, until: G.t + 6, dmg: 14 }); G.vx({ k: 'burst', x: x1, y: y1, n: 10, colors: ['#c8ff3a', '#7ac83a', '#3a5a1a'] }); } };
  }
}
// the lunge: she lurches toward you, then her maw snaps shut in a short ring of fangs (and in the Rot, she lunges again)
function lunge(g, e, V) {
  const S = e.bx, p = g.player, a = angleTo(e.x, e.y, p.x, p.y);
  S.lunge = { vx: Math.cos(a) * 8.6, vy: Math.sin(a) * 8.6, t: 0.35, dmg: V.dmg || 90, chain: V.chain || 0 };
}
// pod puffs (P1-P2 pressure): a spore pod round the Mire puffs a hanging cloud toward the middle (it doesn't burst)
function podPuff(g, e, V) {
  const [cx, cy] = centre(e), A = e.bx.arena;
  const pods = g.map.objects.filter((o) => o.mrPod && !o.burst && (!A || (o.x > A.x - 3 && o.x < A.x + A.w + 3 && o.y > A.y - 3 && o.y < A.y + A.h + 3)));
  let x, y;
  if (pods.length) { const o = pods[Math.floor(R() * pods.length)]; x = o.x; y = o.y; }
  else { const a = R() * TAU; x = cx + Math.cos(a) * 11; y = cy + Math.sin(a) * 11; }
  const a = angleTo(x, y, cx, cy);
  for (const off of [-0.45, 0, 0.45]) {
    const b = g.bxShot(e, x, y, a + off, { shot: 'spore_puff', speed: 4, range: 99, dmg: V.dmg || 70, size: 0.6, mv: { wave: { amp: 0.25, freq: 2 } } });
    b.mrStop = 3.5 + R() * 3; b.mrHang = 3.5; b.poison = 2;
  }
  g.vx({ k: 'burst', x, y: y - 0.4, n: 6, colors: ['#c8ff3a', '#7ac83a'] });
}
// sprout needles (P3 pressure): every glowcap sprout still alive fires a little fan of needles at you
function sproutNeedles(g, e, V) {
  const p = g.player;
  for (const q of g.enemies) {
    if (q.id !== 'glowcap_sprout' || q.dead) continue;
    const a = angleTo(q.x, q.y, p.x, p.y);
    for (const off of [-0.2, 0, 0.2]) g.bxShot(e, q.x, q.y - 0.4, a + off, { shot: 'poison_needle', speed: 7, range: 12, dmg: V.dmg || 70, poison: 1.2 });
  }
}
// glowcap seeds: lobbed round the island; each lands as a sprout that bursts into a sporeling unless it's shot
function seeds(g, e, V) {
  const [cx, cy] = centre(e), [ox, oy] = g.bxOrigin(e), a0 = R() * TAU;
  for (let k = 0; k < (V.n || 4); k++) {
    const a = a0 + (k / (V.n || 4)) * TAU, d = 5 + R() * 4, x1 = cx + Math.cos(a) * d, y1 = cy + Math.sin(a) * d * 0.9;
    const b = g.shoot('e', ox, oy, angleTo(ox, oy, x1, y1), 6, 99, 60, SHOT('glowcap_seed'), 0.4, false, e.D.name);
    b.bxOf = e;
    b.lob = { x0: ox, y0: oy, x1, y1, t: 0, T: 1.0, h: 36, n: 0, r: 0.8, ss: 0,
      onLand: (G) => { const s = G.addEnemy('glowcap_sprout', x1, y1); s.sproutT = 3; s.seen = true; G.vx({ k: 'burst', x: x1, y: y1, n: 8, colors: ['#ffd650', '#c8ff8a'] }); } };
  }
}

export default {
  lead: true,                                     // aimed volleys alternate: at you, then where you are going (a steady circle is not safe)
  id: 'mother_mycelia', name: 'Mother Mycelia', biome: 'dungeon', hp: 95000, def: 14, xp: 5800, r: 2.0, speed: 1.4, keep: 7, faces: true,
  tempo: 0.9, dmgScale: 1.0,                      // her clouds linger and poison: she needs less on top (docs/design/08_boss_rework.md)
  phases: {
    1: { move: 'hold', pressure: [{ every: 2.4, special: 'podPuff', delay: 1.5, dmg: 70 }], patterns: [
      { name: 'spore clouds', windup: 0.7, recover: 0.5, special: 'clouds', n: 5, dmg: 70 },
      { name: 'needle bursts', windup: 0.6, recover: 0.5, special: 'needles', dmg: 75 },
      { name: 'acid globs', windup: 0.6, recover: 0.5, special: 'acid', n: 3, dmg: 75 },
    ] },
    2: { move: 'creep', pressure: [{ every: 3.2, special: 'podPuff', dmg: 75 }], patterns: [
      { name: 'acid globs', windup: 0.7, recover: 0.5, special: 'acid', n: 5, dmg: 80 },
      { name: 'lunging bite', windup: 0.6, recover: 0.7, special: 'lunge', chain: 1, dmg: 90, move: 'hold' },
      { name: 'needle bursts', windup: 0.5, recover: 0.5, special: 'needles', dmg: 80 },
    ] },
    3: { move: 'center', pressure: [{ every: 2.6, special: 'sproutNeedles', dmg: 70 }], patterns: [
      { name: 'glowcap seeds', windup: 0.7, recover: 0.5, special: 'seeds', n: 5 },
      { name: 'toxic orbs', windup: 0.7, recover: 0.5, volleys: [{ form: 'spiral', shot: 'toxic_orb', arms: 2, every: 0.15, dur: 1.8, turn: 0.32, speed: 2.2, range: 14, dmg: 85, size: 0.6, mv: { curve: 0.7, accel: 2.4, max: 2.6 } }] },
      { name: 'spore clouds', windup: 0.6, recover: 0.4, special: 'clouds', n: 7, dmg: 75 },
    ] },
  },
  specials: { clouds, needles, acid, lunge, seeds, podPuff, sproutNeedles },
  moves: {
    creep(g, e, dt) {                               // she drags herself after you, but never off her island
      const p = g.player, [cx, cy] = centre(e);
      let tx = p.x, ty = p.y; const dc = Math.hypot(tx - cx, ty - cy);
      if (dc > 8) { tx = cx + ((tx - cx) / dc) * 8; ty = cy + ((ty - cy) / dc) * 8; }
      const d = Math.hypot(tx - e.x, ty - e.y);
      if (d > 3.5) g.moveCircle(e, ((tx - e.x) / d) * 1.4 * dt, ((ty - e.y) / d) * 1.4 * dt, 0.8);
    },
  },
  update(g, e, dt) {
    const S = e.bx;
    if (S.lunge) {                                  // mid-lunge: she lurches; when she lands, the maw snaps
      const L = S.lunge;
      g.moveCircle(e, L.vx * dt, L.vy * dt, 0.8); L.t -= dt;
      if (L.t <= 0) {
        S.lunge = null;
        const [ox, oy] = g.bxOrigin(e);
        for (let k = 0; k < 12; k++) g.bxShot(e, ox, oy, (k / 12) * TAU, { shot: 'maw_fang', speed: 7, range: 3.5, dmg: L.dmg });
        g.vx({ k: 'shake', amt: 3 });
        if (L.chain > 0) g.fvLater(0.35, () => { if (!e.dead && e.bx.phase === 2) lunge(g, e, { dmg: L.dmg, chain: L.chain - 1 }); });   // she lunges again
      }
    }
    for (const b of g.projectiles) {                // spore puffs: slow, stop, hang, then fade
      if (b.mrStop === undefined) continue;
      b.mrGone = (b.mrGone || 0) + Math.hypot(b.vx, b.vy) * dt;
      if (b.mrGone >= b.mrStop && !b.mrHung) { b.mrHung = true; b.mv = { hold: b.mrHang }; b.t = 0; b.life = b.mrHang + 0.05; }
    }
  },
  onPhase(g, e) { e.bx.lunge = null; },
  onDeath(g, e) { e.bx.lunge = null; for (const q of g.enemies) if (q.id === 'glowcap_sprout' && !q.dead) { q.dead = true; q.deadT = 9; } },
  loot: [{ id: 'bog_cleaver', p: 0.1 }, { id: 'sporecaller_wand', p: 0.1 }, { id: 'mycelial_hide', p: 0.1 }, { id: 'ring_of_rot', p: 0.1 }, { id: 'spore_bomb', p: 0.1 },
    { id: 'glowcap_crown', p: 0.02 }, { id: 'key_mirerot', p: 0.06 },
    { slot: 'weapon', tiers: [6, 8], p: 1 }, { slot: 'armor', tiers: [6, 8], p: 1 }, { slot: 'ability', tiers: [2, 4], p: 0.7 }, { slot: 'ring', tiers: [2, 4], p: 0.6 }, { stat: true, p: 1 }, { stat: true, p: 0.5 }],
  lootLuck: 2,
};
