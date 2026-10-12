// The tiered wand bolts (pj_wand_0 .. pj_wand_10), redrawn to the projectile art standard: a compact spark with a
// diamond head and a short tapering tail, about 9 px along its diagonal (the sheet draws these turned 45 degrees, so
// they point up-right in the cell). Each tier keeps its own colours, read from the old sprite (backed up the first
// time in art/world/_old_wand_bolts.png), darkest to lightest.
//   node tools/art_wand_shots.mjs
import { readFileSync, existsSync, copyFileSync } from 'node:fs';
import { readPng, writePng } from './png.mjs';
const W = JSON.parse(readFileSync(new URL('../art/world/world.json', import.meta.url), 'utf8'));
const path = (u) => new URL(u, import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1').replace(/%20/g, ' ');
const file = path('../art/world/projectiles.png'), old = path('../art/world/_old_wand_bolts.png');
if (!existsSync(old)) copyFileSync(file, old);
const O = readPng(old), P = readPng(file), buf = new Uint8Array(P.w * P.h * 4);
for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) { const q = (y * P.w + x) * 4, [r, g, b] = P.rgb(x, y); buf[q] = r; buf[q + 1] = g; buf[q + 2] = b; buf[q + 3] = P.a(x, y); }
// O outline, D dark, M mid, L light, C core
const BOLT = [
  '................',
  '................',
  '..........OO....',
  '.........OLLO...',
  '........OLCCLO..',
  '.......OMLCCLO..',
  '......OMMLLLO...',
  '.....OMMOOOO....',
  '....ODMO........',
  '....ODO.........',
  '....OO..........',
  '................',
  '................',
  '................',
  '................',
  '................',
];
const lum = ([r, g, b]) => 0.3 * r + 0.59 * g + 0.11 * b;
const PS = W.proj, pc = W.projCols;
for (let t = 0; t <= 10; t++) {
  const k0 = W.projectiles['pj_wand_' + t], ox = (k0 % pc) * PS, oy = Math.floor(k0 / pc) * PS;
  const cols = new Map();
  for (let y = 0; y < PS; y++) for (let x = 0; x < PS; x++) if (O.a(ox + x, oy + y) > 200) { const c = O.rgb(ox + x, oy + y); cols.set(c.join(), (cols.get(c.join()) || 0) + 1); }
  const list = [...cols.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([s]) => s.split(',').map(Number)).sort((a, b) => lum(a) - lum(b));   // its four main colours
  const pick = (f) => list[Math.min(list.length - 1, Math.round(f * (list.length - 1)))];
  const dk = pick(0), pal = { O: dk.map((v) => Math.round(v * 0.55)), D: dk, M: pick(0.5), L: pick(0.8), C: pick(1) };
  for (let f = 0; f < (W.projFrames || 1); f++) {                  // both frames the same: a still shot
    const k = k0 + f, cx = (k % pc) * PS, cy = Math.floor(k / pc) * PS;
    BOLT.forEach((row, y) => [...row].forEach((ch, x) => {
      const q = ((cy + y) * P.w + cx + x) * 4;
      if (ch === '.') { buf[q + 3] = 0; return; }
      const c = pal[ch]; buf[q] = c[0]; buf[q + 1] = c[1]; buf[q + 2] = c[2]; buf[q + 3] = 255;
    }));
  }
}
writePng(file, P.w, P.h, buf);
console.log('wand bolts drawn');
