// Every sprite's border, checked (2026-11-11, the user: "run a check on every enemy and world/environment sprite in the
// game to ensure all borders are thin black"). The game draws one rim on every sprite: black, 2 screen pixels, whatever
// the sprite's size (src/outline.js), after taking off any black edge drawn into the art (src/outline_strip.js). This
// looks at every frame of every sheet and registry sprite the game draws (not tiles: the floor has no rim) and reports:
//   drawn edges taken off (1 layer, 2 layers: a thick one), and the sprites whose edge is still part-black after that
//   (40-50% of it near-black: a drawn edge the strip leaves on, which would read as a second, thicker border).
//   node tools/audit_borders.mjs [--list]
import { readFileSync, existsSync } from 'node:fs';
import { readPng } from './png.mjs';
import { stripEdge, DARK } from '../src/outline_strip.js';
const ROOT = new URL('../', import.meta.url), at = (p) => new URL(p, ROOT);
const LIST = process.argv.includes('--list');
// (each PNG read once, as RGBA rows)
const imgs = new Map(), png = (p) => {
  if (!imgs.has(p)) {
    let I = null;
    if (existsSync(at(p))) { const R = readPng(at(p)), data = new Uint8ClampedArray(R.w * R.h * 4); for (let y = 0; y < R.h; y++) for (let x = 0; x < R.w; x++) { const [r, g, b] = R.rgb(x, y), i = (y * R.w + x) * 4; data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = R.a(x, y); } I = { width: R.w, height: R.h, data }; }
    imgs.set(p, I);
  }
  return imgs.get(p);
};
function frameRGBA(I, x, y, w, h) {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const X = x + i, Y = y + j; if (X >= I.width || Y >= I.height) continue; const s = (Y * I.width + X) * 4, t = (j * w + i) * 4; for (let k = 0; k < 4; k++) d[t + k] = I.data[s + k]; }
  return d;
}
function edgeDark(d, w, h) {
  const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] >= 40;
  let n = 0, k = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (solid(x, y) && (!solid(x + 1, y) || !solid(x - 1, y) || !solid(x, y + 1) || !solid(x, y - 1))) { n++; const i = (y * w + x) * 4; if (Math.max(d[i], d[i + 1], d[i + 2]) < DARK) k++; }
  return n ? k / n : 0;
}
const rows = [];
function check(sheet, name, I, f) {
  const d = frameRGBA(I, f.x, f.y, f.w, f.h), before = edgeDark(d, f.w, f.h), peeled = stripEdge(d, f.w, f.h), after = edgeDark(d, f.w, f.h);
  rows.push({ sheet, name, before, peeled, after });
}
// the registry (the Realm Update bundle and everything since)
globalThis.document = undefined;
const { buildRegistry } = await import('../src/registry.js');
const B0 = at('art/bundle/'), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
for (const d of reg.defs.values()) {
  if (!d.outline || ['item', 'egg', 'fx'].includes(d.kind)) continue;     // (the world's things and creatures; not the inventory's icons)
  const I = png('art/bundle/' + d.img); if (!I) continue;
  const seen = new Set();
  for (const [fn, f] of Object.entries(d.frames)) { const k = `${f.x},${f.y}`; if (seen.has(k)) continue; seen.add(k); check(d.sheet, `${d.name}:${fn}`, I, f); }
}
// the older sheets (players, monsters, champions, bosses) and the world's object sheet
const SHEETS = ['art/sprites/enemies/enemies_sheet', 'art/sprites/enemies/champions_sheet', 'art/sprites/bosses/unstruck_sheet', 'art/sprites/bosses/realm_bosses_sheet', 'art/sprites/bosses/godheart_sheet', 'art/sprites/bosses/godking_sheet', 'art/sprites/bosses/pack_bosses_sheet'];
for (const base of SHEETS) {
  const I = png(base + '.png'), G = JSON.parse(readFileSync(at(base + '.json'), 'utf8')), F = G.frameWidth || 16, FH = G.frameHeight || F;
  if (!I) continue;
  for (let y = 0; y + FH <= I.height; y += FH) for (let x = 0; x + F <= I.width; x += F) check(base.split('/').pop(), `${x / F},${y / FH}`, I, { x, y, w: F, h: FH });
}
{ const I = png('art/world/objects.png'); if (I) for (let y = 0; y + 16 <= I.height; y += 16) for (let x = 0; x + 16 <= I.width; x += 16) check('objects', `${x / 16},${y / 16}`, I, { x, y, w: 16, h: 16 }); }
// ---- the report
const real = rows.filter((r) => r.before > 0 || r.peeled);
const by = new Map();
for (const r of real) { const s = by.get(r.sheet) || { n: 0, p1: 0, p2: 0, part: [] }; s.n++; if (r.peeled === 1) s.p1++; if (r.peeled === 2) s.p2++; if (r.after >= 0.4 && r.after < 0.5) s.part.push(r); by.set(r.sheet, s); }
let partN = 0;
console.log('sheet'.padEnd(26), 'frames', 'edge off', 'thick off', 'part-black left');
for (const [k, s] of [...by].sort((a, b) => b[1].part.length - a[1].part.length || a[0].localeCompare(b[0]))) {
  partN += s.part.length;
  console.log(k.padEnd(26), String(s.n).padStart(6), String(s.p1).padStart(8), String(s.p2).padStart(9), String(s.part.length).padStart(15));
  if (LIST) for (const r of s.part.slice(0, 12)) console.log('   ', r.name, `${Math.round(r.before * 100)}% -> ${Math.round(r.after * 100)}%`);
}
console.log(`\n${real.length} frames: ${real.filter((r) => r.peeled).length} had a drawn edge (taken off, ${real.filter((r) => r.peeled === 2).length} of them thick); ${partN} still part-black at the edge`);
