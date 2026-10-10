// The Grinning Ringmaster: the boss of Hollowmoon Carnival (docs/design/boss_grinning_ringmaster.md).
// His arena is the big top: a sawdust ring with eight star drums round its edge. His own mechanics: leaps between
// drums whose landing rings out a burst (his shadow shows where); two jester marionettes that are their own targets,
// that he re-strings after you cut them, and whose loss leaves him exposed; pins that arc the way their puppet
// faces; stitches of needles; a tent whose lantern eyes light and go dark as his weak point; confetti bombs; crossing
// dart fans from the bunting.
const TAU = Math.PI * 2, R = Math.random;
const SHOT = (n) => `bx2_shots/grinning_ringmaster.${n}`;
const angleTo = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);
const centre = (e) => { const A = e.bx.arena; return A ? [A.x + A.w / 2, A.y + A.h / 2] : [e.x, e.y]; };
const drums = (g, e) => g.map.hmDrums || (() => { const [cx, cy] = centre(e); return Array.from({ length: 8 }, (_, k) => { const a = -Math.PI / 2 + (k / 8) * TAU; return [cx + Math.cos(a) * 14, cy + Math.sin(a) * 16]; }); })();

function cards(g, e, V) {                           // three fans of cards, each offset half a card
  for (let k = 0; k < 3; k++) e.bx.vol.push({ t: k * 0.3, V: { form: 'fan', shot: 'playing_card', count: 7, spread: 1.2, offset: k % 2 ? 0.1 : 0, speed: 7, range: 14, dmg: V.dmg || 115 } });
}
function leap(g, e) {                               // to another drum, in a high arc; the landing rings out a cane-star burst
  const D = drums(g, e), S = e.bx, p = g.player;
  let best = null, bd = -1;
  for (const d of D) { const q = Math.hypot(d[0] - e.x, d[1] - e.y), qp = Math.hypot(d[0] - p.x, d[1] - p.y); if (q > 4 && qp > 5 && q + R() * 6 > bd) { bd = q + R() * 6; best = d; } }
  if (!best) return;
  S.leap = { x0: e.x, y0: e.y, x1: best[0], y1: best[1] - 0.2, t: 0, T: 0.9 };
}
function needles(g, e, V) {                         // stitches: a row of needles across your path, then another, offset
  for (let k = 0; k < 2; k++) e.bx.vol.push({ t: k * 0.45, V: { form: 'wall', shot: 'string_needle', count: 13, space: 0.65, gaps: 2, speed: 6.5, range: 14, dmg: V.dmg || 120 } });
}
function puppets(g, e) {                            // two jesters on strings either side of the ring
  const S = e.bx, [cx, cy] = centre(e);
  S.puppets = S.puppets || [null, null]; S.restring = [0, 0];
  [-1, 1].forEach((side, k) => { if (!S.puppets[k] || S.puppets[k].dead) S.puppets[k] = stringUp(g, e, cx + side * 7, cy - 4, side); });
}
function stringUp(g, e, x, y, side) {
  const t = g.addEnemy('jester_puppet', x, y); t.seen = true; t.puppetOf = e; t.face = side < 0; t.hx = x; t.hy = y; t.side = side;
  g.vx({ k: 'regfx', key: 'd2_effects/hollowmoon.confetti_pop', x, y: y - 0.8, fps: 10 });
  return t;
}
function bombs(g, e, V) {                           // the grin opens: confetti bombs lobbed round you
  const p = g.player, [ox, oy] = g.bxOrigin(e);
  for (let k = 0; k < 4; k++) {
    const a = R() * TAU, d = k ? 1.6 + R() * 2.4 : 0, x1 = p.x + Math.cos(a) * d, y1 = p.y + Math.sin(a) * d;
    const b = g.shoot('e', ox, oy, angleTo(ox, oy, x1, y1), 7, 99, V.dmg || 125, SHOT('confetti_bomb'), 0.45, false, e.D.name);
    b.bxOf = e;
    b.lob = { x0: ox, y0: oy, x1, y1, t: 0, T: Math.max(0.7, Math.min(1.3, Math.hypot(x1 - ox, y1 - oy) / 7)), h: 34, n: 8, r: 1.0, ss: 3.6, bxOf: e,
      onLand: (G) => { G.vx({ k: 'regfx', key: 'd2_effects/hollowmoon.confetti_pop', x: x1, y: y1, fps: 10 }); for (let j = 0; j < 8; j++) { const s = G.shoot('e', x1, y1, (j / 8) * TAU + 0.2, 3.6, 3, Math.round((V.dmg || 125) * 0.5), SHOT('confetti_bomb'), 0.3, false, e.D.name); s.bxOf = e; } } };
  }
}
function darts(g, e, V) {                           // pennant darts from the bunting at both shoulders, crossing
  const p = g.player;
  for (let k = 0; k < 2; k++) for (const side of [-1, 1]) e.bx.vol.push({ t: k * 0.4, V: { form: 'fan', shot: 'pennant_dart', count: 6, spread: 0.9, speed: 7.5, range: 14, dmg: V.dmg || 115, from: (G, E) => [E.x + side * 2.2, E.y - E.hitUp - 1.2] } });
  void p;
}

export default {
  id: 'grinning_ringmaster', name: 'The Grinning Ringmaster', biome: 'dungeon', hp: 300000, def: 32, xp: 15000, r: 2.2, speed: 1.2, keep: 8, faces: true, shotSheet: 'bx2_shots',
  phases: {
    1: { move: 'hold', patterns: [
      { name: 'card fans', windup: 0.6, recover: 0.5, special: 'cards', dmg: 115 },
      { name: 'the leap', windup: 0.5, recover: 1.1, special: 'leap' },
      { name: 'card fans', windup: 0.5, recover: 0.5, special: 'cards', dmg: 115 },
    ] },
    2: { move: 'float', patterns: [
      { name: 'the marionettes', windup: 0.7, recover: 0.4, special: 'puppets' },
      { name: 'stitches', windup: 0.6, recover: 0.7, special: 'needles', dmg: 120 },
      { name: 'stitches', windup: 0.5, recover: 0.7, special: 'needles', dmg: 120 },
    ] },
    3: { move: 'center', patterns: [
      { name: 'confetti bombs', windup: 0.7, recover: 0.6, special: 'bombs', dmg: 125 },
      { name: 'pennant darts', windup: 0.6, recover: 0.6, special: 'darts', dmg: 115 },
    ] },
  },
  specials: { cards, leap, needles, puppets, bombs, darts },
  moves: {
    float(g, e, dt) {                               // aloft above the middle of the ring, drifting a little
      const [cx, cy] = centre(e), S = e.bx;
      S.fl = (S.fl || 0) + dt;
      const tx = cx + Math.sin(S.fl * 0.5) * 3, ty = cy - 6 + Math.cos(S.fl * 0.7) * 1.5, d = Math.hypot(tx - e.x, ty - e.y);
      if (d > 0.1) { const s = Math.min(d, 3 * dt); e.x += ((tx - e.x) / d) * s; e.y += ((ty - e.y) / d) * s; }
    },
  },
  // the lantern eyes (phase 3) and the cut strings (phase 2) leave him open
  dmgMult(g, e) {
    const S = e.bx;
    if (S.phase === 3) return S.lit ? 1.75 : 1;
    if (S.phase === 2 && S.puppets && S.puppets.every((q) => q && q.dead)) return 2;
    return 1;
  },
  barTag(g, e) { const S = e.bx; return S.phase === 3 && S.lit ? ' · LIT' : S.phase === 2 && S.puppets && S.puppets.every((q) => q && q.dead) ? ' · EXPOSED' : ''; },
  onWake(g, e) { const D = drums(g, e); e.x = D[0][0]; e.y = D[0][1] - 0.2; },
  update(g, e, dt) {
    const S = e.bx, [cx, cy] = centre(e);
    if (S.leap) {                                    // mid-leap
      const L = S.leap; L.t += dt;
      const k = Math.min(1, L.t / L.T);
      e.x = L.x0 + (L.x1 - L.x0) * k; e.y = L.y0 + (L.y1 - L.y0) * k; S.leapZ = Math.sin(Math.PI * k) * 46;
      if (k >= 1) {
        S.leap = null; S.leapZ = 0;
        const [ox, oy] = g.bxOrigin(e), a0 = R() * TAU;
        for (let j = 0; j < 14; j++) g.bxShot(e, ox, oy, a0 + (j / 14) * TAU, { shot: 'cane_star', speed: 5, range: 12, dmg: 120 });
        g.vx({ k: 'shake', amt: 4 });
      }
    }
    if (S.phase === 2 && S.puppets) {                // re-string a cut puppet after 8 s
      S.puppets.forEach((q, k) => {
        if (q && q.dead) {
          if (!S.restring[k]) S.restring[k] = g.t + 8;
          else if (g.t >= S.restring[k]) { S.restring[k] = 0; S.puppets[k] = stringUp(g, e, cx + (k ? 7 : -7), cy - 4, k ? 1 : -1); g.banner('He strings the jester up again!', 1400); }
        }
      });
      for (const q of S.puppets) if (q && !q.dead) { q.bob = (q.bob || 0) + dt; q.x = q.hx + Math.sin(q.bob * 1.3) * 1.2; q.y = q.hy + Math.cos(q.bob * 2.1) * 0.6; }
    }
    if (S.phase === 3) S.lit = (g.t % 6) < 3;        // the lantern eyes: lit, then dark
  },
  onPhase(g, e, ph) {
    const S = e.bx;
    S.leap = null; S.leapZ = 0;
    if (ph === 3) for (const q of S.puppets || []) if (q && !q.dead) { q.dead = true; q.deadT = 0; g.vx({ k: 'regfx', key: 'd2_effects/hollowmoon.confetti_pop', x: q.x, y: q.y - 0.6, fps: 10 }); }
  },
  onDeath(g, e) { const S = e.bx; S.leap = null; for (const q of S.puppets || []) if (q && !q.dead) { q.dead = true; q.deadT = 9; } },
  drawGround(r, g, e) {                              // his shadow racing ahead to where he'll land
    const L = e.bx.leap, b = r.b;
    if (!L) return;
    const [x, y] = r.proj(L.x1, L.y1), k = Math.min(1, L.t / L.T);
    b.globalAlpha = 0.3 + 0.4 * k; b.fillStyle = '#05040a'; b.beginPath(); b.ellipse(Math.round(x), Math.round(y), 10 + 8 * k, 5 + 3 * k, 0, 0, TAU); b.fill(); b.globalAlpha = 1;
  },
  drawTop(r, g, e) {                                 // the strings, from his hands to his jesters; the lantern eyes when lit
    const S = e.bx, b = r.b;
    if (S.phase === 2) for (const q of S.puppets || []) {
      if (!q || q.dead) continue;
      const [hx, hy] = r.proj(e.x + q.side * 1.2, e.y - e.hitUp - 0.6), [px, py] = r.proj(q.x, q.y - 1.2);
      b.globalAlpha = 0.7; b.strokeStyle = '#fff6d8'; b.lineWidth = 1;
      for (const off of [-3, 3]) { b.beginPath(); b.moveTo(hx, hy); b.lineTo(px + off, py); b.stroke(); }
      b.globalAlpha = 1;
    }
    if (S.phase === 3 && S.lit) {                    // the lantern eyes, blazing (where they sit in the tent's face)
      const [x, y] = r.proj(e.x, e.y), H = S.def ? S.def.foot[1] * 2 : 86, fy = Math.round(y - H * 0.39), pulse = 0.7 + 0.3 * Math.sin(g.t * 10);
      for (const dx of [-8, 8]) {
        const gr = b.createRadialGradient(x + dx, fy, 0, x + dx, fy, 16);
        gr.addColorStop(0, `rgba(255,250,190,${pulse})`); gr.addColorStop(0.35, `rgba(255,210,80,${0.7 * pulse})`); gr.addColorStop(1, 'rgba(255,170,40,0)');
        b.fillStyle = gr; b.fillRect(x + dx - 16, fy - 16, 32, 32);
        b.fillStyle = '#ffffff'; b.fillRect(Math.round(x + dx) - 1, fy - 1, 3, 3);
      }
    }
  },
  loot: [{ id: 'ringmaster_cane', p: 0.1 }, { id: 'jugglers_dagger', p: 0.1 }, { id: 'carousel_bow', p: 0.1 }, { id: 'harlequin_garb', p: 0.1 }, { id: 'ring_of_the_jester', p: 0.1 },
    { id: 'trick_deck', p: 0.1 }, { id: 'grinning_mask', p: 0.02 }, { id: 'key_hollowmoon', p: 0.06 },
    { slot: 'weapon', tiers: [9, 10], p: 1 }, { slot: 'armor', tiers: [9, 11], p: 1 }, { slot: 'ability', tiers: [4, 5], p: 0.8 }, { slot: 'ring', tiers: [4, 5], p: 0.8 }, { stat: true, p: 1 }, { stat: true, p: 1 }],
  lootLuck: 2,
};
