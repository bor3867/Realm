// Hand-drawn object art, as pixel grids written into the objects atlas (art/world/objects.png): the treasure chest
// (closed and open), the hay bale, the vault's strongbox. One letter per pixel; '.' is clear; each sprite its own palette.
// They are props, so they are drawn the way the atlas's props are: 8x8 art, each pixel a 2x2 block in its 16 px cell
// (the same pixel size on screen as the barrels, crates and stalls round them).
//   node tools/art_objects.mjs
import { readFileSync } from 'node:fs';
import { readPng, writePng } from './png.mjs';
const CHEST = { O: '#2a170b', D: '#5c3418', W: '#8f5629', L: '#b8763b', G: '#d4a032', Y: '#ffe07a', K: '#24140a' };
const CLOSED = [                                        // a planked chest, two gold straps, a lock
  '........',
  '.OLLLLO.',
  'OWGWWGWO',
  'OGGYYGGO',
  'ODGKKGDO',
  'OWGWWGWO',
  'ODGDDGDO',
  '.OOOOOO.',
];
const OPEN = [                                          // the lid thrown back, gold heaped inside
  '.OWWWWO.',
  'ODGDDGDO',
  'OOOOOOOO',
  'OYGYYGYO',
  'OGGKKGGO',
  'OWGWWGWO',
  'ODGDDGDO',
  '.OOOOOO.',
];
// a bale of straw: twine round it twice (it used to read as a hamburger)
const HAY_PAL = { O: '#4f3210', D: '#a07418', M: '#d4a83a', L: '#f0d070', T: '#6e4218' };
const HAY = [
  '........',
  '........',
  '.OOOOOO.',
  'OLTLLTLO',
  'OMTMDTMO',
  'ODTMMTDO',
  'ODTDDTDO',
  '.OOOOOO.',
];
// the vault's strongbox: dark wood bound in iron, riveted, a heavy gold lock (storage, not treasure)
const VAULT_PAL = { O: '#1b1d27', I: '#6d7890', J: '#a9b4c8', H: '#dfe6f2', B: '#4a2c1a', W: '#6b4026', G: '#e0b040', K: '#1a1010' };
const VAULT = [
  '........',
  '.OJJJJO.',
  'OHBBBBHO',
  'OIIGGIIO',
  'OBGKKGBO',
  'OWWGGWWO',
  'OHIIIIHO',
  '.OOOOOO.',
];
const W = JSON.parse(readFileSync(new URL('../art/world/world.json', import.meta.url), 'utf8'));
const file = new URL('../art/world/objects.png', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1').replace(/%20/g, ' ');
const P = readPng(file), buf = new Uint8Array(P.w * P.h * 4);
for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) { const q = (y * P.w + x) * 4, [r, g, b] = P.rgb(x, y); buf[q] = r; buf[q + 1] = g; buf[q + 2] = b; buf[q + 3] = P.a(x, y); }
const put = (k, rows, PAL) => {
  if (rows.length !== 8 || rows.some((r) => r.length !== 8)) throw new Error('a prop is 8x8');
  const ox = (k % W.objectsCols) * 16, oy = Math.floor(k / W.objectsCols) * 16;
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const q = ((oy + y * 2 + dy) * P.w + ox + x * 2 + dx) * 4;
      if (ch === '.') { buf[q + 3] = 0; continue; }
      const h = PAL[ch]; buf[q] = parseInt(h.slice(1, 3), 16); buf[q + 1] = parseInt(h.slice(3, 5), 16); buf[q + 2] = parseInt(h.slice(5, 7), 16); buf[q + 3] = 255;
    }
  }));
};
put(W.objects.chest, CLOSED, CHEST); put(W.objects.chest_open, OPEN, CHEST);
put(W.objects.haybale, HAY, HAY_PAL); put(W.objects.vault_chest, VAULT, VAULT_PAL);
writePng(file, P.w, P.h, buf);
console.log('objects drawn into', file);
