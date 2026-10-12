// The treasure chest (closed and open), drawn by hand as pixel grids and written into the objects atlas
// (art/world/objects.png, cells 'chest' and 'chest_open'). One letter per pixel; '.' is clear.
//   node tools/art_chest.mjs
import { readFileSync } from 'node:fs';
import { readPng, writePng } from './png.mjs';
const PAL = { O: '#2a170b', D: '#5c3418', W: '#8f5629', L: '#b8763b', M: '#7d5a1f', G: '#d4a032', Y: '#ffe07a', K: '#24140a' };
const BODY = [
  '.OMMMMMGGMMMMMO.',
  '.ODDGDGYYGDGDDO.',
  '.OWWGWGKKGWGWWO.',
  '.OWWGWGGKGWGWWO.',
  '.ODDGDDDDDDGDDO.',
  '.OMMGMMMMMMGMMO.',
  '..OOOOOOOOOOOO..',
  '................',
];
const CLOSED = [
  '................',
  '................',
  '................',
  '...OOOOOOOOOO...',
  '..OLGLLLLLLGLO..',
  '.OWWGWWWWWWGWWO.',
  '.OWWGDDDDDDGWWO.',
  '.OWWGWWWWWWGWWO.',
  ...BODY,
];
const OPEN = [
  '................',
  '...OOOOOOOOOO...',
  '..ODGDDDDDDGDO..',
  '..OWGWWWWWWGWO..',
  '.OOOOOOOOOOOOOO.',
  '.OKKKKKKKKKKKKO.',
  '.OKYGKYGYKGYKKO.',
  '.OGYGYGGYGYGYGO.',
  ...BODY,
];
const W = JSON.parse(readFileSync(new URL('../art/world/world.json', import.meta.url), 'utf8'));
const file = new URL('../art/world/objects.png', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1').replace(/%20/g, ' ');
const P = readPng(file), buf = new Uint8Array(P.w * P.h * 4);
for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) { const q = (y * P.w + x) * 4, [r, g, b] = P.rgb(x, y); buf[q] = r; buf[q + 1] = g; buf[q + 2] = b; buf[q + 3] = P.a(x, y); }
const put = (k, rows) => {
  if (rows.length !== 16 || rows.some((r) => r.length !== 16)) throw new Error('a sprite must be 16x16');
  const ox = (k % W.objectsCols) * 16, oy = Math.floor(k / W.objectsCols) * 16;
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const q = ((oy + y) * P.w + ox + x) * 4;
    if (ch === '.') { buf[q + 3] = 0; return; }
    const h = PAL[ch]; buf[q] = parseInt(h.slice(1, 3), 16); buf[q + 1] = parseInt(h.slice(3, 5), 16); buf[q + 2] = parseInt(h.slice(5, 7), 16); buf[q + 3] = 255;
  }));
};
put(W.objects.chest, CLOSED); put(W.objects.chest_open, OPEN);
writePng(file, P.w, P.h, buf);
console.log('chest drawn into', file);
