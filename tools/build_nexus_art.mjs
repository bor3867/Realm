// The Nexus, painted (nexus_original_art_package, the user's art): the whole illustration is the Nexus's floor, drawn
// 1:1 (16 art pixels to a tile, as the game draws every tile), and this works out from it where you can walk. Per
// 16x16 cell: walkable if almost all of it is painted and it is not water (the deep blue of the pools and moats); the
// stone rim along the painting's edge (one tile in from the void) is wall. Also each cell's average colour, for the
// minimap. Writes art/world/nexus_art.png (the art) and src/world/nexus_art.js (the walk mask, the colours).
//   node tools/build_nexus_art.mjs
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { readPng, writePng } from './png.mjs';
const root = new URL('../', import.meta.url), P = (q) => decodeURIComponent(new URL(q, root).pathname).replace(/^\/([A-Z]:)/, '$1');
const SRC = P('nexus_original_art_package/art/nexus_full_transparent.png');
const img = readPng(SRC), T = 16, W = Math.ceil(img.w / T), H = Math.ceil(img.h / T);
const open = [], water = [], cols = [];
for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
  let n = 0, op = 0, wa = 0, r = 0, g = 0, b = 0;
  for (let y = ty * T; y < ty * T + T; y++) for (let x = tx * T; x < tx * T + T; x++) {
    n++;
    if (x >= img.w || y >= img.h || img.a(x, y) < 128) continue;
    op++; const [R, G, B] = img.rgb(x, y); r += R; g += G; b += B;
    if (B > R + 60 && B > G + 25 && R < 110) wa++;             // the deep blue of water
  }
  open.push(op / n); water.push(op ? wa / op : 0); cols.push(op ? [r / op, g / op, b / op].map(Math.round) : [10, 8, 12]);
}
const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? -1 : y * W + x);
// water: deep blue over most of a cell, and with water beside it (a lone blue square is floor art: a tile, a stall, a gate)
const isWet = (i) => i >= 0 && water[i] >= 0.45 && open[i] >= 0.5;
const wet = water.map((w, i) => { if (!isWet(i)) return false; const x = i % W, y = Math.floor(i / W); return [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => isWet(at(x + dx, y + dy))).length >= 2; });
const floor = open.map((o, i) => o >= 0.5 && !wet[i]);   // (half painted is enough: the name plates are painted dark)
const edge = floor.map((f, i) => { if (!f) return false; const x = i % W, y = Math.floor(i / W); return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const j = at(x + dx, y + dy); return j < 0 || open[j] < 0.5; }); });
const walk = floor.map((f, i) => f && !edge[i]);
// keep only the walkable area joined to the middle (stray specks of floor in the art are not places)
const start = at(Math.floor(W / 2), Math.floor(H * 0.88)), keep = new Uint8Array(W * H), Q = [start];
if (walk[start]) keep[start] = 1;
while (Q.length) { const i = Q.pop(), x = i % W, y = Math.floor(i / W); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const j = at(x + dx, y + dy); if (j >= 0 && walk[j] && !keep[j]) { keep[j] = 1; Q.push(j); } } }
const rows = [];
for (let y = 0; y < H; y++) { let s = ''; for (let x = 0; x < W; x++) { const i = y * W + x; s += keep[i] ? '.' : wet[i] ? '~' : open[i] >= 0.5 ? '#' : ' '; } rows.push(s); }
const colHex = cols.map((c) => c.map((v) => v.toString(16).padStart(2, '0')).join('')).join('');
writeFileSync(P('src/world/nexus_art.js'), `// The painted Nexus's walk mask and minimap colours (made by tools/build_nexus_art.mjs from the user's art package; do not
// edit by hand). One character a tile: '.' walk, '#' wall, '~' water, ' ' void. COLS: each tile's average colour, hex.
export const NEXUS_ART = {
  w: ${W}, h: ${H},
  rows: ${JSON.stringify(rows, null, 1).replace(/\n/g, '\n  ')},
  cols: '${colHex}',
};
`);
copyFileSync(SRC, P('art/world/nexus_art.png'));
// a preview: the art with the walls red and the water blue (for checking the mask)
const K = 1, o = new Uint8Array(img.w * img.h * 4);
for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
  const q = (y * img.w + x) * 4, [R, G, B] = img.rgb(x, y), A = img.a(x, y), c = rows[Math.floor(y / T)][Math.floor(x / T)];
  let r = R, g = G, b = B; if (c === '#') { r = (R + 255) / 2; g = G / 2; b = B / 2; } else if (c === '~') { r = R / 2; g = G / 2; b = (B + 255) / 2; } else if (c === ' ') { r = g = b = 0; }
  o[q] = r; o[q + 1] = g; o[q + 2] = b; o[q + 3] = c === ' ' ? 255 : Math.max(A, 255);
}
writePng(P('art/_proto/nexus_mask_preview.png'), img.w, img.h, o);
console.log(`the painted Nexus: ${W}x${H} tiles, ${keep.reduce((a, b) => a + b, 0)} walkable -> src/world/nexus_art.js, art/world/nexus_art.png`);
