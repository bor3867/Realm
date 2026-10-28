// Aurelia, the Prism Wyrm: the Prism Lighthouse's boss on the boss framework (2026-10-22). From the lightkeeper's log:
// "She cannot be hurt in the dark. Glass hides her. Only the lens, focused, shows her true body. Stand in it, and pray."
// "Do not hold the light on her too long. I did. The lighthouse has been white ever since."
//   The Lens (her signature) - three lens pedestals stand round the lantern room. Stand on one and its beam bares her:
//     only then can she be hurt (GLASS, otherwise). Hold it too long and it overheats: a white flash where it stands,
//     and it goes dark a while. Pulse the light between pedestals. All of this is the server's, so everyone shares it.
//   I   The Lantern Turns  - white bolts that break into every colour, helixes of light, glass raining in columns
//   II  Prismatic          - images of her stand in the beams' way: a beam burns the image it meets first, not her
//   III Overcharge         - the lens heats twice as fast; held too long, she drinks the light and throws it back;
//                            the great lens follows you (a sunbeam, a step behind)
//   Last: White Light      - light all three pedestals within moments of each other (the light lingers 2.5 s after you
//                            step off): she shatters. Fail, and the lighthouse turns white
// Art: tools/build_hollow_bosses.py ('bx_prism_wyrm', images 'hollow_kin/image', shots 'hollow_shots/prism_wyrm.<name>').
import { ENEMIES, DUNGEON_BOSSES } from '../data/enemies.js';

const TAU = Math.PI * 2, R = Math.random;
const angleTo = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);
const arena = (e) => e.bx.arena || { x: e.x - 12, y: e.y - 9, w: 24, h: 18 };
const players = (g) => (g.netTargets && g.netTargets.length ? g.netTargets : [g.player]).filter((q) => q && !q.dead);
const target = (g, e) => { const L = players(g); return L.length ? L.reduce((a, b) => (Math.hypot(b.x - e.x, b.y - e.y) < Math.hypot(a.x - e.x, a.y - e.y) ? b : a)) : g.player; };
const SPECTRUM = ['#ff6a8a', '#ffd650', '#7aff9a', '#7ad0ff', '#a07aff', '#ffffff'];

// ---- the lens pedestals (the map's own, round the lantern room). Each one's state is plain numbers on her
const pedsOf = (g, e) => { if (!e.pwPeds) { const A = arena(e); e.pwPeds = g.map.objects.filter((o) => o.pedestal !== undefined && o.x > A.x - 2 && o.x < A.x + A.w + 2 && o.y > A.y - 2 && o.y < A.y + A.h + 2).slice(0, 3); } return e.pwPeds; };
const IMAGE = 'pw_image';
if (!ENEMIES[IMAGE] && ENEMIES.prism_image) ENEMIES[IMAGE] = { ...ENEMIES.prism_image, reg: 'hollow_kin/image', scale: 1.8, sheet: undefined, hp: 1e6, noBar: true, loot: [] };   // (the lighthouse's own image, redrawn; only the lens burns it)
const imagesOf = (g) => g.enemies.filter((q) => !q.dead && q.id === IMAGE);
function lensStep(g, e, dt) {
  const P = pedsOf(g, e), fin = e.bx.state === 'finale', hot = e.bx.phase === 3 ? 2 : 1;
  let bare = false;
  P.forEach((o, k) => {
    const K = 'pwP' + k;
    e[K + 'x'] = o.x; e[K + 'y'] = o.y;
    e[K + 'cool'] = Math.max(0, (e[K + 'cool'] || 0) - dt);
    const on = !e[K + 'cool'] && players(g).some((q) => Math.hypot(o.x - q.x, o.y - q.y) < 1.0);
    if (on) e[K + 'linger'] = fin ? 2.5 : 0.15; else e[K + 'linger'] = Math.max(0, (e[K + 'linger'] || 0) - dt);
    const lit = on || e[K + 'linger'] > 0;
    e[K + 'on'] = lit; e[K + 'tx'] = undefined;
    if (!lit) { e[K + 'heat'] = Math.max(0, (e[K + 'heat'] || 0) - dt * 0.25); return; }
    if (on) e[K + 'heat'] = (e[K + 'heat'] || 0) + (dt / 5) * hot;
    // the beam goes to her, unless an image of her stands in its way: then it burns the image
    let tgt = e;
    for (const im of imagesOf(g)) {
      const ax = o.x, ay = o.y - 0.6, tx = e.x, ty = e.y - 1.2, L2 = (tx - ax) ** 2 + (ty - ay) ** 2 || 1, t = Math.max(0, Math.min(1, ((im.x - ax) * (tx - ax) + (im.y - 1 - ay) * (ty - ay)) / L2));
      if (Math.hypot(ax + (tx - ax) * t - im.x, ay + (ty - ay) * t - (im.y - 1)) < 1.3 && Math.hypot(ax - im.x, ay - im.y) < Math.hypot(ax - e.x, ay - e.y)) tgt = im;
    }
    e[K + 'tx'] = tgt.x; e[K + 'ty'] = tgt.y;
    if (tgt === e) bare = true;
    else if ((tgt.pwBurn = (tgt.pwBurn || 0) + dt) > 0.9) { tgt.noLoot = true; tgt.dead = true; tgt.deadT = 0; g.vx({ k: 'burst', x: tgt.x, y: tgt.y - 1, n: 30, colors: ['#ffffff', '#c8a0ff', '#8af6ff'] }); g.float(tgt.x, tgt.y - 2, 'BURNED AWAY', '#ffffff'); }
    if (e[K + 'heat'] >= 1) {                                // overheated: a white flash where it stands, and it goes dark a while
      e[K + 'heat'] = 0; e[K + 'cool'] = 6; e[K + 'linger'] = 0;
      g.fx.push({ kind: 'zone', src: e, x: o.x, y: o.y, r: 2.2, t: 0, delay: 0.35, life: 0.5, dmg: g.bxDmg(e, 140), by: `${e.D.name}'s white light`, done: false, colors: ['#ffffff', '#fff6c8'], shards: 8, proj: 'hollow_shots/prism_wyrm.shard' });
      g.banner('The lens overheats! Find another.', 1400);
    }
  });
  if (bare) {
    e.pwBareUntil = g.t + 0.18; e.pwBareFor = (e.pwBareFor || 0) + dt;
    if (e.bx.phase === 3 && e.pwBareFor > 2.2 && !fin) {     // held too long: she drinks the light and throws it back
      e.pwBareFor = 0; for (let k = 0; k < 28; k++) g.bxShotAt(e, e.x, e.y, 1.2, (k / 28) * TAU, { shot: 'shard', speed: 5 + (k % 2), range: 12, dmg: 130 });
      g.banner('OVERCHARGE! She throws the light back!', 1400); g.vx({ k: 'shake', amt: 6 });
    }
  } else e.pwBareFor = Math.max(0, (e.pwBareFor || 0) - dt * 2);
  return P;
}

// ---- I: dispersing bolts, the helix, glass rain
function disperse(g, e, V) {
  const [ox, oy] = g.bxOrigin(e), q = target(g, e), aim = angleTo(ox, oy, q.x, q.y), n = V.n || 3;
  for (let k = 0; k < n; k++) { const b = g.bxShot(e, ox, oy, aim + (n > 1 ? (k / (n - 1) - 0.5) * 0.5 : 0), { shot: 'bolt', speed: 7, range: 12, dmg: V.dmg || 110 }); if (b) b.mv = { d4: true, disperse: 0.45, fan: V.fan || 7 }; }
}
function helix(g, e, V) {
  const a0 = R() * TAU;
  for (let k = 0; k < (V.n || 9); k++) e.bx.vol.push({ t: k * 0.12, V: { form: 'special', name: 'helixArm', k, a0, dmg: V.dmg } });
}
function helixArm(g, e, V) { const [ox, oy] = g.bxOrigin(e); for (let j = 0; j < 3; j++) { const b = g.bxShot(e, ox, oy, 0, { shot: 'shard', speed: 0, range: 30, dmg: V.dmg || 100 }); if (b) { b.mv = { d4: true, helix: { cx: ox, cy: oy, a0: V.a0 + (j * TAU) / 3, w: 2.2 * (V.k % 2 ? 1 : -1), v: 3.4 } }; b.life = 4.5; } } }
function glassrain(g, e, V) {
  for (let w = 0; w < (V.waves || 3); w++) e.bx.vol.push({ t: w * 0.85, V: { form: 'special', name: 'glassWave', dmg: V.dmg } });
}
function glassWave(g, e, V) { const A = arena(e), cols = 11, gaps = 2, gap = Math.floor(R() * (cols - gaps)); for (let c = 0; c < cols; c++) { if (c >= gap && c < gap + gaps) continue; g.bxShot(e, A.x + 1 + ((c + 0.5) * (A.w - 2)) / cols, A.y + 1, Math.PI / 2, { shot: 'pane', speed: 7, range: A.h, dmg: V.dmg || 105 }); } }

// ---- II: images of her; III: the sunbeam (the great lens follows you, a step behind)
function images(g, e, V) {
  for (const im of imagesOf(g)) { im.noLoot = true; im.dead = true; im.deadT = 0; }
  for (let k = 0; k < (V.n || 2); k++) { const im = g.addEnemy(IMAGE, e.x + (k ? 5 : -5), e.y); im.seen = true; im.aggro = true; im.noLoot = true; g.unstick && g.unstick(im, 1); }
  g.banner('She splits into images of light! Burn them with the lens.', 2000);
}
function sunbeam(g, e, V) { const q = target(g, e); e.pwSunX = q.x; e.pwSunY = q.y; e.pwSunUntil = g.t + (V.dur || 5); e.pwSunTgt = q; g.banner('The great lens focuses on you!', 1400); }

// ---- last: WHITE LIGHT. All three pedestals lit at once, and she shatters
const finale = {
  at: 0.1, dur: 12, name: 'White Light', say: 'light all three lenses at once', after: 1.4,
  start(g, e) { e.pwFinT = 0.6; for (let k = 0; k < 3; k++) { e['pwP' + k + 'cool'] = 0; e['pwP' + k + 'heat'] = 0; } },   // (every lens fresh: the last stand must be winnable)
  update(g, e, dt, T) {
    lensStep(g, e, dt);
    if ((e.pwFinT -= dt) <= 0) { e.pwFinT = 1.6; glassWave(g, e, { dmg: 100 }); }
    const P = pedsOf(g, e);
    if (P.length && P.every((o, k) => e['pwP' + k + 'on']) && !e.pwShattered) {
      e.pwShattered = true; g.banner('Three lenses at once: SHE SHATTERS!', 2200); g.vx({ k: 'shake', amt: 9 });
      e.hp = Math.max(1, e.hp - Math.round(e.maxHp * 0.05));   // (the shattering costs her)
      e.bx.finT = Math.max(e.bx.finT, (e.bx.fin || e.bx.B.finale).dur - 0.1);
    }
    if (T > 11.4 && !e.pwShattered && !e.pwWhite) {          // too slow: the lighthouse turns white
      e.pwWhite = true; g.banner('THE LIGHTHOUSE TURNS WHITE.', 2200);
      for (const q of players(g)) g.fx.push({ kind: 'zone', src: e, x: q.x, y: q.y, r: 2.4, t: 0, delay: 0.6, life: 0.75, dmg: g.bxDmg(e, 220), by: `${e.D.name}'s white light`, done: false, colors: ['#ffffff', '#fff6c8'], shards: 10, proj: 'hollow_shots/prism_wyrm.shard' });
    }
  },
  end(g, e) { e.pwWhite = false; },
};

export default {
  id: 'prism_wyrm', art: 'prism_wyrm', shotSheet: 'hollow_shots', name: 'Aurelia, the Prism Wyrm', biome: 'prism', hp: 130000, def: 36, xp: 16000,
  r: 1.6, speed: 1.2, keep: 6, faces: true, spawnCentre: true, tempo: 0.9, finale,
  phases: {
    1: { move: 'hold', patterns: [
      { name: 'white light, broken', windup: 0.6, recover: 0.6, special: 'disperse', n: 3, dmg: 110 },
      { name: 'a helix of light', windup: 0.6, recover: 0.6, special: 'helix', n: 9, dmg: 100 },
      { name: 'glass rain', windup: 0.7, recover: 0.6, special: 'glassrain', waves: 3, dmg: 105 },
    ] },
    2: { move: 'hold', patterns: [
      { name: 'her images', windup: 0.9, recover: 0.5, special: 'images', n: 2 },
      { name: 'white light, broken', windup: 0.5, recover: 0.6, special: 'disperse', n: 3, fan: 8, dmg: 110 },
      { name: 'a helix of light', windup: 0.5, recover: 0.6, special: 'helix', n: 10, dmg: 100 },
      { name: 'glass rain', windup: 0.6, recover: 0.6, special: 'glassrain', waves: 3, dmg: 105 },
    ] },
    3: { move: 'hold', patterns: [
      { name: 'the great lens', windup: 0.8, recover: 0.5, special: 'sunbeam', dur: 5 },
      { name: 'glass rain', windup: 0.5, recover: 0.5, special: 'glassrain', waves: 4, dmg: 108 },
      { name: 'white light, broken', windup: 0.5, recover: 0.5, special: 'disperse', n: 4, dmg: 112 },
      { name: 'her images', windup: 0.7, recover: 0.5, special: 'images', n: 2 },
      { name: 'a helix of light', windup: 0.5, recover: 0.5, special: 'helix', n: 11, dmg: 102 },
    ] },
  },
  specials: { disperse, helix, helixArm, glassrain, glassWave, images, sunbeam },
  onWake(g) { g.banner('AURELIA · you cannot touch what you cannot see. Stand in the lens light!', 3200); },
  onPhase(g, e, ph) { if (ph === 2) g.banner('PRISMATIC · which of her is real?', 2600); if (ph === 3) g.banner('OVERCHARGE · pulse the light, never hold it', 2600); },
  update(g, e, dt) {
    const S = e.bx; if (S.state === 'sleep' || S.state === 'intro') return;
    lensStep(g, e, dt);
    if (e.pwSunUntil > g.t && e.pwSunTgt) { const q = e.pwSunTgt, k = Math.min(1, dt / 1.4); e.pwSunX += (q.x - e.pwSunX) * k * 2; e.pwSunY += (q.y - e.pwSunY) * k * 2; }   // a step behind you
  },
  immune(g, e) { return pedsOf(g, e).length > 0 && !(e.pwBareUntil > g.t); },   // (with no lens pedestals round her, spawned outside her lighthouse, she has no glass to hide in: 2026-10-24)
  // in your own browser: the sunbeam burns where it lingers on you
  local(g, e, dt) { const p = g.player; if (p.dead || !(e.pwSunUntil > g.t)) return; if (Math.hypot(p.x - e.pwSunX, p.y - e.pwSunY) < 1.3 && (e.pwSunHitT = (e.pwSunHitT || 0) - dt) <= 0) { e.pwSunHitT = 0.35; g.hurtPlayer(g.bxDmg(e, 70), `${e.D.name}'s great lens`); } },
  onDeath(g, e) { for (const im of imagesOf(g)) { im.noLoot = true; im.dead = true; im.deadT = 0; } g.banner('THE LIGHT GOES OUT OF THE GLASS. THE LIGHTHOUSE IS ONLY A LIGHTHOUSE.', 3400); },
  lights(g, e) { return [{ x: e.x, y: e.y, h: 2, r: e.pwBareUntil > g.t ? 160 : 90, col: e.bx && e.bx.phase === 3 ? '#ffffff' : '#c8a0ff' }]; },
  drawGround(r, g, e) {
    const b = r.b;
    for (let k = 0; k < 3; k++) {                             // each pedestal: its heat, and its beam when lit
      const x = e['pwP' + k + 'x']; if (x === undefined) continue;
      const y = e['pwP' + k + 'y'], [sx, sy] = r.proj(x, y), heat = e['pwP' + k + 'heat'] || 0, cool = e['pwP' + k + 'cool'] > 0;
      b.strokeStyle = cool ? '#3a3a48' : heat > 0.7 ? '#ff6a6a' : '#fff6c8'; b.lineWidth = 3; b.beginPath(); b.arc(sx, sy, 12, -Math.PI / 2, -Math.PI / 2 + TAU * (cool ? 1 : Math.max(0.05, heat))); b.stroke();
      if (e['pwP' + k + 'on'] && e['pwP' + k + 'tx'] !== undefined) {
        const [tx, ty] = r.proj(e['pwP' + k + 'tx'], e['pwP' + k + 'ty'] - 1.2), [ax, ay] = r.proj(x, y - 0.6);
        b.globalAlpha = 0.35; b.strokeStyle = '#fff6c8'; b.lineWidth = 10; b.beginPath(); b.moveTo(ax, ay); b.lineTo(tx, ty); b.stroke();
        b.globalAlpha = 0.95; b.strokeStyle = '#ffffff'; b.lineWidth = 3; b.beginPath(); b.moveTo(ax, ay); b.lineTo(tx, ty); b.stroke(); b.globalAlpha = 1;
      }
    }
    if (e.pwSunUntil > g.t) { const [x, y] = r.proj(e.pwSunX, e.pwSunY); b.globalAlpha = 0.45; b.fillStyle = '#fff6c8'; b.beginPath(); b.ellipse(x, y, 22, 14, 0, 0, TAU); b.fill(); b.globalAlpha = 1; }
  },
  drawTop(r, g, e) {                                       // bared or in glass
    const [x, y] = r.proj(e.x, e.y - 4.2); r.b.textAlign = 'center';
    if (e.bx.state !== 'sleep') r.plabel(r.b, e.pwBareUntil > g.t ? 'BARED' : 'GLASS', x, y, 16, e.pwBareUntil > g.t ? '#fff6c8' : '#8a9ab8');
  },
  get loot() { return DUNGEON_BOSSES.prism_wyrm.loot; },
  lootLuck: 2,
};
