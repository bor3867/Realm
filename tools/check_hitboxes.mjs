// Hitboxes against the art, for every shot in the game: from 24 directions round you, at 8 headings each, it finds the
// distance at which the shot's drawn pixels first touch your drawn sprite, and the distance at which the game says
// you were hit, and reports the gap in screen (buffer) pixels. Positive: the art touched you and the game let it
// through (the "it hit me and nothing happened" feeling). Negative: the game hit you before the art reached you.
//   node tools/check_hitboxes.mjs [--all]      (--all lists every shot, not just the worst)
import { readFileSync } from 'node:fs';
import { readPng } from './png.mjs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { shotShape, shotTouches, HITBOX } = await import('../src/game.js');
const { SHOT_BOXES } = await import('../src/data/shot_boxes.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const path = (u) => decodeURIComponent(u.pathname).replace(/^\/([A-Z]:)/, '$1');
const imgs = new Map(), img = (p) => { if (!imgs.has(p)) imgs.set(p, readPng(p)); return imgs.get(p); };
const W = JSON.parse(readFileSync(new URL('../art/world/world.json', import.meta.url), 'utf8'));
const LASER = new Set(['bx_shots/grand_orrery.star_bolt']);
// the player: every class's first frame, 16 px, standing on (8, 15)
const players = ['priest/heliarch', 'brawler/forgefist', 'harpooner/wreckwhaler'].map((q) => {
  const I = readPng(path(new URL(`../art/sprites/player/${q}_sheet.png`, import.meta.url))), set = new Set();
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (I.a(x, y) > 40) set.add((x - 8) + ',' + (y - 15));
  return set;
});
// a shot's points in buffer pixels about its centre, drawn pointing right (rotated per test)
function shotPoints(key) {
  if (LASER.has(key)) { const pts = []; for (let x = -10; x < 10; x++) for (let y = -2; y < 2; y++) pts.push([x + 0.5, y + 0.5]); return pts; }
  const d = reg.resolve(key);
  const pts = [];
  if (d && key.includes('/')) {
    const I = img(path(new URL(d.img, B0))), F = Object.values(d.frames), w = Math.max(...F.map((f) => f.w)), h = Math.max(...F.map((f) => f.h)), seen = new Set();
    for (const f of F) for (let j = 0; j < f.h; j++) for (let i = 0; i < f.w; i++) if (I.a(f.x + i, f.y + j) > 40 && !seen.has(i + ',' + j)) {   // every frame it shows
      seen.add(i + ',' + j);
      for (const [u, v] of [[0.5, 0.5], [1.5, 0.5], [0.5, 1.5], [1.5, 1.5]]) pts.push([i * 2 + u - w, j * 2 + v - h]);
    }
    return pts;
  }
  const k0 = W.projectiles[key];
  if (k0 === undefined) return null;
  const I = img(path(new URL('../art/world/projectiles.png', import.meta.url))), PS = W.proj, pc = W.projCols, K = (W.projBig || []).includes(key) ? 1.3 : 1;
  const seen = new Set();
  for (let f = 0; f < (W.projFrames || 1); f++) for (let j = 0; j < PS; j++) for (let i = 0; i < PS; i++) if (I.a(((k0 + f) % pc) * PS + i, Math.floor((k0 + f) / pc) * PS + j) > 40 && !seen.has(i + ',' + j)) {
    seen.add(i + ',' + j);
    let u = (i + 0.5 - PS / 2) * K, v = (j + 0.5 - PS / 2) * K;
    if ((W.projDiag || []).includes(key)) [u, v] = [(u - v) * Math.SQRT1_2, (u + v) * Math.SQRT1_2];   // drawn 45 degrees past its heading
    pts.push([u, v]);
  }
  return pts;
}
// does the art touch? (at least two of the shot's points on the player's pixels)
const touches = (pts, sx, sy, a, P) => {
  const c = Math.cos(a), s = Math.sin(a);
  let n = 0, tot = 0, near = 0;
  for (const [u, v] of pts) { const x = Math.floor(sx + u * c - v * s), y = Math.floor(sy + u * s + v * c); if (P.has(x + ',' + y) && ++n >= 2) return true; }
  return false;
};
const OLD = process.argv.includes('--old');           // the hit test before (a 0.32 circle at your middle, and the shot's size)
const gameHits = (key, sx, sy, a) => {
  if (OLD) return Math.hypot(sx / 16, sy / 16 + 0.45) < 0.32 + 0.45 * 0.6;                    // the game's test, in tiles, the player standing at (0, 0)
  const S = shotShape(key, 0.45); if (S.upright) a = 0;
  const ca = Math.cos(a), sa = Math.sin(a), bx = sx / 16, by = sy / 16;
  const cx = bx + ca * S.al - sa * S.ac, cy = by + sa * S.al + ca * S.ac, ux = S.across ? -sa : ca, uy = S.across ? ca : sa;
  return shotTouches(S, bx, by, ca, sa, cx, cy, ux, uy, 0, -HITBOX.foot, 0, -HITBOX.head);
};
// only the shots that can hit you: every bundle shot, and the original sheet's shots that some monster or boss fires
const { ENEMIES, REALM_BOSSES, DUNGEON_BOSSES, BOSS } = await import('../src/data/enemies.js');
const used = new Set(), walk = (o, d = 0) => { if (d > 8 || !o) return; if (typeof o === 'string') { if (SHOT_BOXES[o]) used.add(o); return; } if (typeof o === 'object') for (const v of Object.values(o)) walk(v, d + 1); };
walk(ENEMIES); walk(REALM_BOSSES); walk(DUNGEON_BOSSES); walk(BOSS);
const hostile = (k) => k.includes('/') ? !/^(ix_items|ex_items|d2_items|mx_items)\//.test(k) : used.has(k);
const all = process.argv.includes('--all'), rows = [];
let n = 0, tot = 0, near = 0;
for (const key of Object.keys(SHOT_BOXES)) {
  if (key === 'ap_shots/grand_orrery.singularity' || !hostile(key)) continue;
  const pts = shotPoints(key);
  if (!pts || !pts.length) continue;
  const gaps = [];
  const how = SHOT_BOXES[key][4];
  for (const P of players) for (let h = 0; h < 8; h++) for (let k = 0; k < 24; k++) {
    const a = how === 'f' ? 0 : (h / 8) * Math.PI * 2, t = (k / 24) * Math.PI * 2, ox = 0, oy = -7.5;      // from the middle of your body
    let dTrue = -1, dGame = -1;
    for (let d = 48; d >= 0; d -= 0.5) {
      const sx = ox + Math.cos(t) * d, sy = oy + Math.sin(t) * d;
      if (dTrue < 0 && touches(pts, sx, sy, a, P)) dTrue = d;
      if (dGame < 0 && gameHits(key, sx, sy, a)) dGame = d;
      if (dTrue >= 0 && dGame >= 0) break;
    }
    gaps.push(dTrue - dGame);
  }
  for (const v of gaps) { tot++; if (Math.abs(v) <= 3) near++; }
  gaps.sort((p, q) => p - q);
  const q = (f) => gaps[Math.floor(f * (gaps.length - 1))];
  rows.push({ key, miss: q(0.95), worstMiss: gaps[gaps.length - 1], unfair: q(0.05), worstUnfair: gaps[0], mean: gaps.reduce((s, v) => s + v, 0) / gaps.length });
  n++;
}
// a capsule is not a sprite: a few pixels either way at the odd corner is expected. What must hold: on average a shot hits
// within 2.5 px of its art touching yours, and 95% of approaches land within 6 px (crescents and hollow rings are the
// odd ones out: their box is bigger than their pixels).
const bad = rows.filter((r) => Math.abs(r.mean) > 2.5 || r.miss > 6 || r.unfair < -6);
const show = (r) => `${r.key.padEnd(48)} mean ${r.mean.toFixed(1).padStart(5)} | 95% within ${r.unfair.toFixed(1)}..${r.miss.toFixed(1)} px | worst ${r.worstUnfair.toFixed(1)}..${r.worstMiss.toFixed(1)}`;
for (const r of (all ? rows : bad.slice(0, 25))) console.log(show(r));
const mean = rows.reduce((s, r) => s + r.mean, 0) / rows.length;
console.log(`shots: ${n} | average gap ${mean.toFixed(2)} px (art touch minus game hit) | off (mean beyond ±2.5 px, or 95% beyond ±6 px): ${bad.length} | approaches within 3 px of the art: ${(100 * near / tot).toFixed(1)}%`);
process.exit(Math.abs(mean) > 1.5 || bad.length > n * 0.1 ? 1 : 0);
