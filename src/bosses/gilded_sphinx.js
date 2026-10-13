// The Gilded Sphinx: the boss of Sandscour Tomb (docs/design/boss_gilded_sphinx.md).
// Its arena is the Sanctum: a square hall, a raised dais with four obelisks for cover. Its own mechanics: crossing
// fans of curved crescents; riddle glyphs that hang and then dart at you; pinwheel sunbursts; feather fans that
// narrow to a spear; a sandstorm haze; dust devils that wander and throw you; scarabs bursting from the sand.
import { lift } from '../util.js';
const TAU = Math.PI * 2, R = Math.random;
const SHOT = (n) => `bx_shots/gilded_sphinx.${n}`;
const angleTo = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);
const centre = (e) => { const A = e.bx.arena; return A ? [A.x + A.w / 2, A.y + A.h / 2] : [e.x, e.y]; };

// crescents: two fans whose shots curve alternately, crossing into a lattice of arcs
function crescents(g, e, V) {
  const p = g.player, [ox, oy] = g.bxOrigin(e), aim = angleTo(ox, oy, p.x, p.y), sp = V.speed || 5;
  [[7, 0, 0], [6, 0.1, 0.3]].forEach(([n, off, t]) => e.bx.vol.push({ t, V: { form: 'special', name: 'crescentFan', n, off, aim, sp, dmg: V.dmg || 60 } }));
}
function crescentFan(g, e, V) {
  const [ox, oy] = g.bxOrigin(e);
  for (let k = 0; k < V.n; k++) {
    const b = g.bxShot(e, ox, oy, V.aim + V.off + (k / (V.n - 1) - 0.5) * 1.5, { shot: 'sand_crescent', speed: V.sp, range: 11, dmg: V.dmg, mv: { curve: 0.8 } });
    b.cs = k % 2 ? -1 : 1;
  }
}
// the riddle: glyphs drift out, stop, hang glowing, then each darts at wherever you are
function riddle(g, e, V) {
  const p = g.player, [ox, oy] = g.bxOrigin(e), aim = angleTo(ox, oy, p.x, p.y);
  for (let k = 0; k < 6; k++) g.bxShot(e, ox, oy, aim + (k / 5 - 0.5) * 2.2, { shot: 'riddle_glyph', speed: 3.4, range: 99, dmg: V.dmg || 65, mv: { brake: 0.8 + k * 0.08, re: 9 } });
}
// sunbursts: two rings that wheel opposite ways as they spread: pinwheels
function sunbursts(g, e, V) {
  [[0, 0.75], [0.4, -0.75]].forEach(([t, c]) => e.bx.vol.push({ t, V: { form: 'special', name: 'sunRing', c, dmg: V.dmg || 65 } }));
}
function sunRing(g, e, V) {
  const [ox, oy] = g.bxOrigin(e), a0 = R() * TAU;
  for (let k = 0; k < 14; k++) g.bxShot(e, ox, oy, a0 + (k / 14) * TAU, { shot: 'sun_disk', speed: 3.8, range: 14, dmg: V.dmg, mv: { curve: V.c } });
}
// feathers: three fans at you, each narrower and quicker than the last
function feathers(g, e, V) {
  [[7, 1.3, 6, 0], [5, 0.6, 8, 0.3], [3, 0.12, 10.5, 0.6]].forEach(([count, spread, speed, t]) =>
    e.bx.vol.push({ t, V: { form: 'fan', shot: 'gilded_feather', count, spread, speed, range: 11, dmg: V.dmg || 70 } }));
}
// dust devils: three rise at the walls and wander the sanctum, drawn to you a little
function devils(g, e) {
  const [cx, cy] = centre(e), S = e.bx;
  S.devils = (S.devils || []).filter((d) => d.life > 0);
  for (let k = 0; k < 3; k++) { const a = R() * TAU; S.devils.push({ x: cx + Math.cos(a) * 15, y: cy + Math.sin(a) * 15, h: a + Math.PI, life: 8, turn: 0, tick: 0, spin: R() * TAU }); }
}
// scarabs: the sand bursts near you, and a swarm pours out after you
function swarm(g, e) {
  const p = g.player, a = R() * TAU, x = p.x + Math.cos(a) * 3, y = p.y + Math.sin(a) * 3;
  (e.bx.puffs = e.bx.puffs || []).push({ x, y, at: g.t + 0.5 });
  g.vx({ k: 'regfx', key: 'ex_effects/sand_puff', x, y, fps: 8 });
}

// obelisk sand (P1 pressure): the four obelisks round the dais take turns throwing a crescent at you
function obeliskSand(g, e, V) {
  const S = e.bx, [cx, cy] = centre(e), p = g.player, k = (S.obK = ((S.obK || 0) + 1) % 4), a = Math.PI / 4 + k * Math.PI / 2;
  const x = cx + Math.cos(a) * 9.5, y = cy + Math.sin(a) * 9.5;
  for (const off of [-0.16, 0, 0.16]) g.bxShot(e, x, y - 1, angleTo(x, y - 1, p.x, p.y) + off, { shot: 'sand_crescent', speed: 5.5, range: 20, dmg: V.dmg || 60, mv: { curve: off * 3.2 } });
  g.vx({ k: 'burst', x, y: y - 1, n: 5, colors: ['#ffd650', '#e8cf96'] });
}
// moulting (P2 pressure): as it glides between obelisks it sheds feathers that drift down onto the floor below it
function moult(g, e, V) {
  if (!e.bx.perch) return;
  for (let k = 0; k < 3; k++) g.bxShot(e, e.x + (R() - 0.5) * 2.4, e.y - e.hitUp, Math.PI / 2 + (R() - 0.5) * 0.9, { shot: 'gilded_feather', speed: 2.6, range: 7, dmg: V.dmg || 65, mv: { wave: { amp: 0.6, freq: 3 } } });
}
// the scales (P3): a fan from each side of it, swinging toward each other, crossing on you
function scales(g, e, V) {
  const p = g.player;
  for (const side of [-1, 1]) {
    const x = e.x + side * 3, y = e.y - e.hitUp, a = angleTo(x, y, p.x, p.y);
    for (let k = 0; k < 6; k++) e.bx.vol.push({ t: k * 0.09, V: { form: 'fan', shot: 'sun_disk', count: 2, spread: 0.25, angle: a - side * (0.9 - k * 0.18), speed: 6.5, range: 16, dmg: V.dmg || 70, from: () => [x, y] } });
  }
}

export default {
  id: 'gilded_sphinx', name: 'The Gilded Sphinx', biome: 'dungeon', hp: 85000, def: 10, xp: 5200, r: 2.3, speed: 2.4, keep: 8, faces: true,
  tempo: 0.8, dmgScale: 1.2,
  phases: {
    1: { move: 'hold', pressure: [{ every: 1.15, special: 'obeliskSand', delay: 1.2, dmg: 60 }], patterns: [
      { name: 'crescent sweep', windup: 0.7, recover: 0.5, special: 'crescents', dmg: 60 },
      { name: 'the riddle', windup: 0.8, recover: 0.6, special: 'riddle', dmg: 65 },
    ] },
    2: { move: 'perch', pressure: [{ every: 0.7, special: 'moult', dmg: 65 }], patterns: [
      { name: 'sunbursts', windup: 0.6, recover: 0.5, special: 'sunbursts', dmg: 65 },
      { name: 'feather fans', windup: 0.6, recover: 0.5, special: 'feathers', dmg: 70 },
    ] },
    3: { move: 'center', pressure: [{ every: 1.4, special: 'obeliskSand', dmg: 65 }], patterns: [
      { name: 'dust devils', windup: 0.7, recover: 0.5, special: 'devils' },
      { name: 'the scales', windup: 0.6, recover: 0.5, special: 'scales', dmg: 70 },
      { name: 'scarab swarm', windup: 0.6, recover: 0.5, special: 'swarm' },
      { name: 'crescent sweep', windup: 0.5, recover: 0.4, special: 'crescents', dmg: 65, speed: 6.5 },
    ] },
  },
  specials: { crescents, crescentFan, riddle, sunbursts, sunRing, feathers, devils, swarm, obeliskSand, moult, scales },
  moves: {
    perch(g, e, dt) {                               // aloft: it glides from one obelisk to the next round the dais
      const S = e.bx, [cx, cy] = centre(e);
      if (!S.perch || (S.perchT -= dt) <= 0) { S.perchK = ((S.perchK || 0) + 1) % 4; S.perchT = 4; const a = Math.PI / 4 + S.perchK * Math.PI / 2; S.perch = { x: cx + Math.cos(a) * 9.5, y: cy + Math.sin(a) * 9.5 - 1.5 }; }
      const d = Math.hypot(S.perch.x - e.x, S.perch.y - e.y);
      if (d > 0.2) { const s = Math.min(d, 5 * dt); e.x += ((S.perch.x - e.x) / d) * s; e.y += ((S.perch.y - e.y) / d) * s; }
    },
  },
  update(g, e, dt) {
    const S = e.bx, p = g.player, [cx, cy] = centre(e);
    for (const d of S.devils || []) {               // the dust devils wander, lean toward you, and throw you if they catch you
      if (d.life <= 0) continue;
      d.life -= dt; d.spin += dt * 9;
      if ((d.turn -= dt) <= 0) { d.turn = 1; const toP = angleTo(d.x, d.y, p.x, p.y); d.h = toP + (R() - 0.5) * 2.2; }
      d.x += Math.cos(d.h) * 2.4 * dt; d.y += Math.sin(d.h) * 2.4 * dt;
      if (Math.hypot(d.x - cx, d.y - cy) > 17) d.h = angleTo(d.x, d.y, cx, cy);
      if (!p.dead && Math.hypot(d.x - p.x, d.y - p.y) < 1.1 && (d.tick -= dt) <= 0) {
        d.tick = 0.6; g.hurtPlayer(g.bxDmg(e, 60), 'a dust devil');
        const a = angleTo(d.x, d.y, p.x, p.y) + Math.PI / 2;
        p.gust = { vx: Math.cos(a) * 7, vy: Math.sin(a) * 7, until: g.t + 0.35 };
      }
    }
    if (S.puffs) {                                   // a burst of sand, then the swarm
      for (const q of S.puffs) if (g.t >= q.at && !q.done) {
        q.done = true;
        for (let k = 0; k < 8; k++) {
          const b = g.bxShot(e, q.x, q.y, angleTo(q.x, q.y, p.x, p.y) + (k / 7 - 0.5) * 1.6, { shot: 'cursed_scarab', speed: 4.2, range: 99, dmg: 55, mv: { seek: 2.6, wave: { amp: 0.5 + R() * 0.4, freq: 5 + R() * 4 } } });
          b.life = 2.5;
        }
      }
      S.puffs = S.puffs.filter((q) => !q.done);
    }
  },
  onPhase(g, e, ph) { const S = e.bx; if (ph === 3) { S.storm = true; S.perch = null; } },
  onDeath(g, e) { const S = e.bx; S.devils = []; S.puffs = []; S.storm = false; },
  drawGround(r, g, e) {                              // the dust devils: tall spinning funnels of sand
    const D = r.R && r.R.resolve(SHOT('dust_devil'));
    if (!D) return;
    const F = Object.keys(D.frames);
    for (const d of e.bx.devils || []) {
      if (d.life <= 0) continue;
      const [x, y] = r.proj(d.x, d.y), a = Math.min(1, d.life / 0.5, (8 - d.life) / 0.4);
      r.shadow(x, y, 14);
      r.drawDef(D, F[Math.floor(g.t * 12) % F.length], Math.round(x + Math.sin(d.spin * 0.7) * 2), Math.round(y - 12), { center: true, scale: 2, alpha: a });   // the funnel, swaying (its frames spin it)
    }
  },
  drawTop(r, g, e) {                                 // the sandstorm: a haze over everything far from you, sand streaming across
    if (!e.bx.storm) return;
    const b = r.b, BW = r.buf.width, BH = r.buf.height, [px, py] = r.proj(...lift(g.player.x, g.player.y, 0.5)), R0 = 7 * 16;
    b.save(); b.setTransform(1, 0, 0, 1, 0, 0); b.scale(r.hi.width / BW, r.hi.height / BH);
    const grad = b.createRadialGradient(px, py, R0 * 0.55, px, py, R0 * 1.25);
    grad.addColorStop(0, 'rgba(200,160,96,0)'); grad.addColorStop(1, 'rgba(176,136,72,0.88)');
    b.fillStyle = grad; b.fillRect(0, 0, BW, BH);
    b.fillStyle = '#e8cf96';
    for (let k = 0; k < 70; k++) {
      const s = (k * 97.13) % 1, y = (k * 53.7 + Math.sin(k) * 40) % BH, x = ((s * BW * 3 + g.t * (180 + (k % 5) * 60)) % (BW + 40)) - 20;
      b.globalAlpha = 0.35 + (k % 3) * 0.15; b.fillRect(Math.round(x), Math.round(y), 4 + (k % 4) * 2, 1);
    }
    b.restore(); b.globalAlpha = 1;
  },
  loot: [{ id: 'sunscorch_khopesh', p: 0.1 }, { id: 'gilded_scepter', p: 0.1 }, { id: 'embalmers_wraps', p: 0.1 }, { id: 'scarab_ring', p: 0.1 }, { id: 'sphinx_helm', p: 0.1 },
    { id: 'pharaohs_deathmask', p: 0.02 }, { id: 'key_sandscour', p: 0.06 },
    { slot: 'weapon', tiers: [5, 8], p: 1 }, { slot: 'armor', tiers: [5, 8], p: 1 }, { slot: 'ability', tiers: [2, 4], p: 0.7 }, { slot: 'ring', tiers: [2, 3], p: 0.6 }, { stat: true, p: 1 }],
  lootLuck: 2,
};
