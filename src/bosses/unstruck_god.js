// The Unstruck God: the Drowned Forge's master, rebuilt on the boss framework (2026-10-20). Never once struck in the war
// that broke the world; the fight is the story of his first wound. Every bomb is marked before it falls: a ring on the
// ground that fills as it arms (zones), a landing mark under each falling star (lobs), a line of light before each seam
// (lasers), the sun swelling before it flares.
//   I    The Untouched (100-70%): contempt. Judgement falls on you, a halo of blades turns, decrees sweep the hall.
//   II   The First Wound (70-35%): he bleeds, for the first time. The mask splits; seams of molten gold cut the floor,
//        stars fall, his blood rains as burning drops.
//   III  The Stolen Sun (35-0%): he tears the sun from his chest. It circles the forge, scorching where it passes and
//        throwing embers; when it flares, only his own shadow is safe.
//   Last: UNMADE (8%): he comes apart and the dark pours out: survive it, and he is broken.
// Art: tools/build_unstruck_god.py ('bx_unstruck_god', shots 'ug_shots/unstruck_god.<name>').
const TAU = Math.PI * 2, R = Math.random;
const angleTo = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);
const arena = (e) => e.bx.arena || { x: e.x - 12, y: e.y - 10, w: 24, h: 18 };
const centre = (e) => { const A = arena(e); return [A.x + A.w / 2, A.y + A.h / 2]; };
const players = (g) => (g.netTargets && g.netTargets.length ? g.netTargets : [g.player]).filter((q) => q && !q.dead);
const GOLD = ['#f2c14e', '#fff0a0'], RED = ['#ff3a4a', '#ffd650'], SUN = ['#ff8a1f', '#fff6c8'];
// a marked bomb on the ground: a ring that fills as it arms, then it bursts (into shards, if it says)
function mark(g, e, x, y, r, delay, dmg, colors, shards, shot) {
  g.fx.push({ kind: 'zone', x, y, r, t: 0, delay, life: delay + 0.15, dmg: g.bxDmg(e, dmg), by: e.D.name, done: false, colors, shards: shards || 0, proj: shot ? `ug_shots/unstruck_god.${shot}` : undefined });
}

// ---- I. The Untouched
function judgement(g, e, V) {                       // a gilded sentence marked under every player, and round them
  for (const q of players(g)) {
    mark(g, e, q.x, q.y, 1.7, V.delay || 1.4, V.dmg || 120, GOLD, 8, 'judgement');
    for (let k = 0; k < (V.extra || 2); k++) { const a = R() * TAU, d = 2.5 + R() * 2; mark(g, e, q.x + Math.cos(a) * d, q.y + Math.sin(a) * d, 1.4, (V.delay || 1.4) + 0.35 * (k + 1), V.dmg || 120, GOLD, 6, 'judgement'); }
  }
}
function halo(g, e, V) {                            // the halo of blades flung out: two turning rings, a gap to find in each
  [[0, 0], [0.4, 0.13]].forEach(([t, rot]) => e.bx.vol.push({ t, V: { form: 'ring', shot: 'blade', count: V.count || 24, gaps: 3, rot, speed: 4.5, range: 14, dmg: V.dmg || 115 } }));
}
function decree(g, e, V) {                          // a decree sweeps the hall from one side: a gap to find
  e.bx.vol.push({ t: 0, V: { form: 'curtain', shot: 'spear', count: 18, gaps: 3, speed: 5, dmg: V.dmg || 120 } });
  if (V.twice) e.bx.vol.push({ t: 0.9, V: { form: 'curtain', shot: 'spear', count: 18, gaps: 3, speed: 5, dmg: V.dmg || 120 } });
}
function spears(g, e, V) { e.bx.vol.push({ t: 0, V: { form: 'fan', shot: 'spear', count: V.n || 5, spread: 0.5, speed: 8, range: 14, dmg: V.dmg || 120 } }); }
function scorn(g, e, V) { e.bx.vol.push({ t: 0, V: { form: 'stream', shot: 'spear', n: 3, every: 0.12, count: 1, speed: 9, range: 14, dmg: V.dmg || 110 } }); }

// ---- II. The First Wound
function seams(g, e, V) {                           // seams of molten gold across the forge: a line of light, then it burns
  const A = arena(e), p = players(g)[0] || g.player, L = Math.max(A.w, A.h) + 6, horiz = R() < 0.5, n = V.n || 3;
  for (let k = 0; k < n; k++) {
    const off = (k - (n - 1) / 2) * 3.2 + (R() - 0.5);
    const x0 = horiz ? A.x - 2 : p.x + off, y0 = horiz ? p.y + off : A.y - 2;
    g.fx.push({ kind: 'laser', x0, y0, a: horiz ? 0 : Math.PI / 2, len: L, t: 0, tele: V.tele || 1.2, act: 0.5, life: (V.tele || 1.2) + 0.6, dmg: g.bxDmg(e, V.dmg || 140), by: e.D.name, hit: false });
  }
  if (V.cross) seams(g, e, { ...V, cross: false, n: 2, tele: (V.tele || 1.2) + 0.8 });
}
function stars(g, e, V) {                           // stars fall where the players stand: each landing mark grows as it nears
  const [ox, oy] = g.bxOrigin(e);
  for (const q of players(g)) for (let k = 0; k < (V.n || 3); k++) {
    const a = R() * TAU, d = k ? 1.5 + R() * 2.5 : 0, x1 = q.x + Math.cos(a) * d, y1 = q.y + Math.sin(a) * d;
    const b = g.shoot('e', ox, oy - 1, angleTo(ox, oy, x1, y1), 6, 99, g.bxDmg(e, V.dmg || 130), 'ug_shots/unstruck_god.star', 0.45, false, e.D.name);
    b.bxOf = e;
    b.lob = { x0: ox, y0: oy - 1, x1, y1, t: 0, T: 1.3 + k * 0.25, h: 46, n: 8, r: 1.3, ss: 4.5, sprite: 'ug_shots/unstruck_god.star', bxOf: e };
  }
}
function wrath(g, e, V) { e.bx.vol.push({ t: 0, V: { form: 'spiral', shot: 'seam', arms: V.arms || 3, dur: 2.2, every: 0.13, turn: 0.21, speed: 4.2, range: 13, dmg: V.dmg || 110 } }); }
function bleed(g, e, V) {                           // his blood: burning drops, marked, falling near you
  const q = players(g)[Math.floor(R() * players(g).length)] || g.player, a = R() * TAU, d = R() * 3;
  mark(g, e, q.x + Math.cos(a) * d, q.y + Math.sin(a) * d, 1.1, 1.1, V.dmg || 100, RED, 0);
}

// ---- III. The Stolen Sun (it circles the forge; its place travels with him to every player as e.ugSx, e.ugSy)
const sunAt = (e) => (e.ugSx !== undefined ? [e.ugSx, e.ugSy] : centre(e));
function flareTell(g, e) {                          // the sun swells: get into his shadow (the side of him away from it)
  e.ugFlareUntil = g.t + 1.6;
  g.banner('THE SUN SWELLS · hide in his shadow', 1600);
}
function flare(g, e, V) {                           // the flare: a nova from the sun, all but the cone his body shades
  const [sx, sy] = sunAt(e), shade = angleTo(sx, sy, e.x, e.y), n = 44;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU, off = Math.atan2(Math.sin(a - shade), Math.cos(a - shade));
    if (Math.abs(off) < 0.42) continue;
    g.bxShot(e, sx, sy, a, { shot: 'ember', speed: 6.5, range: 26, dmg: V.dmg || 150 });
  }
  g.vx({ k: 'shake', amt: 7 });
}
function embers(g, e, V) {                          // a ring of embers thrown off the sun as it passes
  const [sx, sy] = sunAt(e), a0 = R() * TAU;
  for (let k = 0; k < (V.count || 8); k++) g.bxShot(e, sx, sy, a0 + (k / (V.count || 8)) * TAU, { shot: 'ember', speed: 3.6, range: 12, dmg: V.dmg || 110 });
}

// ---- the last: UNMADE
const finale = {
  at: 0.08, dur: 10, name: 'Unmade', say: 'survive the dark', after: 1.5,
  start(g, e) { e.bx.unm = { spin: 0, mark: 0.6, k: 0 }; g.banner('He comes apart. The dark that was inside him pours out.', 3000); },
  update(g, e, dt) {
    const U = e.bx.unm, [ox, oy] = g.bxOrigin(e);
    if ((U.spin -= dt) <= 0) {
      U.spin = 0.14; U.k++;
      for (let a = 0; a < 4; a++) g.bxShot(e, ox, oy, U.k * 0.23 * (a % 2 ? -1 : 1) + (a / 4) * TAU, { shot: 'unmade', speed: 3.6, range: 15, dmg: 120 });
    }
    if ((U.mark -= dt) <= 0) { U.mark = 1.3; for (const q of players(g)) mark(g, e, q.x, q.y, 1.5, 1.2, 140, ['#6a3aa8', '#ffffff'], 6, 'unmade'); }
  },
  end(g, e) { e.bx.unm = null; },
};

export default {
  id: 'unstruck_god', art: 'unstruck_god', shotSheet: 'ug_shots', name: 'The Unstruck God', biome: 'dungeon', hp: 300000, def: 30, xp: 16000,
  r: 2.2, speed: 1.0, keep: 6, faces: false, spawnCentre: true, tempo: 0.8, dmgScale: 1.05, finale,
  phases: {
    1: { move: 'center', pressure: [{ every: 2.4, special: 'scorn', delay: 2, dmg: 110 }], patterns: [
      { name: 'judgement', windup: 0.8, recover: 0.6, special: 'judgement', dmg: 120 },
      { name: 'the halo of blades', windup: 0.8, recover: 0.7, special: 'halo', dmg: 115 },
      { name: 'spears', windup: 0.5, recover: 0.5, special: 'spears', dmg: 120 },
      { name: 'a decree', windup: 0.7, recover: 0.8, special: 'decree', dmg: 120 },
    ] },
    2: { move: 'pace', pressure: [{ every: 1.5, special: 'bleed', delay: 1.5, dmg: 100 }], patterns: [
      { name: 'seams of gold', windup: 0.6, recover: 0.8, special: 'seams', n: 3, dmg: 140 },
      { name: 'falling stars', windup: 0.8, recover: 0.6, special: 'stars', n: 3, dmg: 130 },
      { name: 'wrath', windup: 0.6, recover: 0.6, special: 'wrath', dmg: 110 },
      { name: 'judgement', windup: 0.6, recover: 0.5, special: 'judgement', extra: 3, dmg: 125 },
      { name: 'the crossing seams', windup: 0.6, recover: 0.9, special: 'seams', n: 3, cross: true, dmg: 140 },
    ] },
    3: { move: 'center', pressure: [{ every: 1.8, special: 'embers', dmg: 110 }, { every: 2.2, special: 'bleed', dmg: 105 }], patterns: [
      { name: 'the sun flares', windup: 1.6, recover: 0.9, tell: 'flareTell', special: 'flare', dmg: 150 },
      { name: 'falling stars', windup: 0.6, recover: 0.5, special: 'stars', n: 4, dmg: 135 },
      { name: 'a double decree', windup: 0.6, recover: 0.6, special: 'decree', twice: true, dmg: 125 },
      { name: 'the sun flares', windup: 1.6, recover: 0.9, tell: 'flareTell', special: 'flare', dmg: 150 },
      { name: 'judgement', windup: 0.5, recover: 0.5, special: 'judgement', extra: 3, delay: 1.2, dmg: 130 },
    ] },
  },
  specials: { judgement, halo, decree, spears, scorn, seams, stars, wrath, bleed, flareTell, flare, embers },
  onWake(g) { g.banner('THE UNSTRUCK GOD · never once struck, in ten thousand years', 3400); },
  onPhase(g, e, ph) {
    if (ph === 2) g.banner('HE BLEEDS · for the first time, the god bleeds', 3000);
    if (ph === 3) { g.banner('HE TEARS THE SUN FROM HIS CHEST', 3000); e.ugSA = 0; }
  },
  update(g, e, dt) {                                // III: the stolen sun circles the forge, scorching where it passes
    const S = e.bx;
    if (S.phase < 3 || S.state === 'death' || S.state === 'deathhold') { e.ugSx = undefined; return; }
    const [cx, cy] = centre(e), A = arena(e);
    e.ugSA = (e.ugSA || 0) + dt * 0.45;
    e.ugSx = cx + Math.cos(e.ugSA) * Math.min(7, A.w / 2 - 2); e.ugSy = cy + Math.sin(e.ugSA) * Math.min(5.5, A.h / 2 - 2);
    if ((S.scorch = (S.scorch || 0) - dt) <= 0) { S.scorch = 0.45; mark(g, e, e.ugSx, e.ugSy, 1.6, 0.45, 120, SUN, 0); }
  },
  onDeath(g, e) { e.ugSx = undefined; g.banner('THE UNSTRUCK GOD IS STRUCK DOWN', 3600); if (!g.netTargets && g.trophy) g.trophy('unstruck'); },
  drawTop(r, g, e) {                                 // the stolen sun, and its swell before a flare (where his shadow falls)
    if (e.ugSx === undefined || e.dead) return;
    const b = r.b, [x, y] = r.proj(e.ugSx, e.ugSy), swell = e.ugFlareUntil > g.t ? 1 - (e.ugFlareUntil - g.t) / 1.6 : 0, R0 = 14 + swell * 10 + Math.sin(g.t * 8) * 1.5;
    b.globalAlpha = 0.25; b.fillStyle = '#ff8a1f'; b.beginPath(); b.arc(x, y - 18, R0 + 8, 0, TAU); b.fill();
    b.globalAlpha = 0.9; b.fillStyle = '#ffd84a'; b.beginPath(); b.arc(x, y - 18, R0 * 0.62, 0, TAU); b.fill();
    b.globalAlpha = 1; b.fillStyle = '#fff6c8'; b.beginPath(); b.arc(x - 3, y - 21, R0 * 0.28, 0, TAU); b.fill();
    if (swell > 0) {                                  // the shade: a dark wedge behind him, where the flare will not reach
      const [bx, by] = r.proj(e.x, e.y), a = Math.atan2(by - y, bx - x);
      b.globalAlpha = 0.28 + 0.2 * Math.sin(g.t * 14); b.fillStyle = '#05040a';
      b.beginPath(); b.moveTo(bx, by); b.arc(bx, by, 150, a - 0.42, a + 0.42); b.closePath(); b.fill(); b.globalAlpha = 1;
    }
  },
  loot: [{ id: 'knuckle_of_the_unstruck', p: 0.15 }, { id: 'billet_of_the_first_oath', p: 0.15 }, { id: 'the_last_noon', p: 0.1 },
    { slot: 'weapon', tiers: [9, 10], p: 1 }, { slot: 'armor', tiers: [9, 11], p: 1 }, { slot: 'ability', tiers: [4, 5], p: 0.8 }, { slot: 'ring', tiers: [4, 5], p: 0.8 },
    { stat: true, p: 1 }, { stat: true, p: 1 }, { stat: true, p: 0.5 }],
  lootLuck: 2,
};
