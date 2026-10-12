// The finer redraws: creatures from the newer packs, whose 8x8 art was drawn at two screen pixels per art pixel,
// redrawn by hand at 16x16 so they match the original sheets (one screen pixel per art pixel). Each creature: a
// palette and its frames as letter grids ('.' clear); the hurt frame is computed (its walk frame, washed pale, as the
// old art did). Writes art/hd/hd.png and art/hd/atlas_hd.json; the registry swaps these in for the old frames
// (same keys, same frame names, same size on screen: the def gets res 2).
//   node tools/art_hd.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { writePng } from './png.mjs';
const C = {};                                            // key: { pal, frames: { name: rows } }
C['ow_enemies/orc_brute'] = {
  pal: { O: '#1c2611', A: '#7ab040', S: '#5c8e2e', D: '#3e6a1e', B: '#ffd04a', C: '#140f1c', E: '#f2ecd8', F: '#6a4418', f: '#4a301c', H: '#a8702a', G: '#8a8e9e', g: '#c8ccd8', I: '#4a301c' },
  frames: {
    walk1: [
      '................',
      '....OOOOOO......',
      '...OAAAAAAO.....',
      '..OAABAABAAO....',
      '..OAACAACAAO..O.',
      '..OSAAAAAASO.OGO',
      '..OSEAAAAESO.OGO',
      '...OSSSSSSO..OgO',
      '..OFFHFFHFFO.OIO',
      '.OAOFFFFFFOAOIO.',
      '.OAOFHHHHFOAIO..',
      '..OOFFFFFFOOIO..',
      '...OfFFFFfO.I...',
      '...ODO..ODO.....',
      '..ODDO..ODDO....',
      '..OOO....OOO....',
    ],
    walk2: [
      '................',
      '....OOOOOO......',
      '...OAAAAAAO.....',
      '..OAABAABAAO....',
      '..OAACAACAAO..O.',
      '..OSAAAAAASO.OGO',
      '..OSEAAAAESO.OGO',
      '...OSSSSSSO..OgO',
      '..OFFHFFHFFO.OIO',
      '.OAOFFFFFFOAOIO.',
      '.OAOFHHHHFOAIO..',
      '..OOFFFFFFOOIO..',
      '...OfFFFFfO.I...',
      '....ODOODO......',
      '...ODDOODDO.....',
      '...OOO..OOO.....',
    ],
    attack: [
      '.............OO.',
      '....OOOOOO..OGGO',
      '...OAAAAAAO.OGGO',
      '..OAABAABAAO.OgO',
      '..OAACAACAAO.OIO',
      '..OSAAAAAASO.OIO',
      '..OSEAAAAESO.OIO',
      '...OSSSSSSO..OIO',
      '..OFFHFFHFFO.OIO',
      '.OAOFFFFFFOAOAO.',
      '.OAOFHHHHFOOOO..',
      '..OOFFFFFFO.....',
      '...OfFFFFfO.....',
      '...ODO..ODO.....',
      '..ODDO..ODDO....',
      '..OOO....OOO....',
    ],
  },
};
// ---- build
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const wash = ([r, g, b]) => [r, g, b].map((v) => Math.round(v * 0.35 + 236 * 0.65));   // the hurt flash: pale, as the old art drew it
const cells = [];
for (const [key, Cr] of Object.entries(C)) {
  for (const [n, rows] of Object.entries(Cr.frames)) {
    if (rows.length !== 16 || rows.some((r) => r.length !== 16)) throw new Error(`${key} ${n}: a frame is 16x16 (${rows.map((r) => r.length).join(',')})`);
    cells.push({ key, name: n, px: rows.map((r) => [...r].map((ch) => (ch === '.' ? null : hex(Cr.pal[ch] || (() => { throw new Error(`${key} ${n}: no colour '${ch}'`); })())))) });
  }
  const w = cells.find((q) => q.key === key && q.name === 'walk1');
  if (w && !Cr.frames.hurt) cells.push({ key, name: 'hurt', px: w.px.map((row) => row.map((c) => (c ? wash(c) : null))) });
}
const COLS = 16, W = COLS * 16, H = Math.ceil(cells.length / COLS) * 16, buf = new Uint8Array(W * H * 4), atlas = { hd: { image: 'hd.png', sprites: {} } };
cells.forEach((q, i) => {
  const ox = (i % COLS) * 16, oy = Math.floor(i / COLS) * 16;
  q.px.forEach((row, y) => row.forEach((c, x) => { if (!c) return; const k = ((oy + y) * W + ox + x) * 4; buf[k] = c[0]; buf[k + 1] = c[1]; buf[k + 2] = c[2]; buf[k + 3] = 255; }));
  ((atlas.hd.sprites[q.key] = atlas.hd.sprites[q.key] || { res: 2, frames: {} }).frames[q.name] = { x: ox, y: oy, w: 16, h: 16 });
});
const dir = new URL('../art/bundle/hd/', import.meta.url), p = (f) => new URL(f, dir).pathname.replace(/^\/([A-Z]:)/, '$1').replace(/%20/g, ' ');
mkdirSync(p(''), { recursive: true });
writePng(p('hd.png'), W, H, buf);
writeFileSync(p('atlas_hd.json'), JSON.stringify(atlas, null, 1));
console.log(`${Object.keys(C).length} creatures, ${cells.length} frames -> art/bundle/hd/`);
