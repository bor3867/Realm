// The enemy sizing pass (docs/overhaul_checklist.md): 8x8 monsters that need to stand bigger than the small fry used to
// be blown up by a fraction (1.25x to 1.8x), which gave them big uneven pixels next to everyone else. They are redrawn
// here at 16x16 (Scale2x, drawn at the player's pixel size: twice as tall) or 24x24 (Scale3x, drawn at the champions'
// fine pixel size: half again as tall), every frame of every animation, so every monster is drawn at a whole pixel size.
// Scale2x/3x are the standard pixel-art upscalers (AdvMAME): they round the diagonals instead of only fattening pixels.
//   art/bundle/resized/rs_enemies.png + atlas_resized.json      ('rs_enemies/<id>', the same frames and clips)
//   node tools/upscale_enemies.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { readPng, writePng } from './png.mjs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { ENEMIES, RESIZED } = await import('../src/data/enemies.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.filter((a) => !a.startsWith('resized/')).map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
// who, and by how much (RESIZED in src/data/enemies.js): 2 = a 16x16 at the player's pixel size; 3 = a 24x24 at the
// champions' fine pixel size. The source is each one's original art (regSrc).
const UPSCALE = RESIZED;
const imgs = new Map(), img = (p) => { if (!imgs.has(p)) imgs.set(p, readPng(`art/bundle/${p}`)); return imgs.get(p); };
const px = (I, x, y) => { const a = I.a(x, y); if (a < 20) return 0; const [r, g, b] = I.rgb(x, y); return ((r << 16) | (g << 8) | b) + 1; };   // 0: clear
function grab(I, f) { const out = []; for (let y = 0; y < f.h; y++) { const row = []; for (let x = 0; x < f.w; x++) row.push(px(I, f.x + x, f.y + y)); out.push(row); } return out; }
const at = (G, x, y) => (y < 0 || y >= G.length || x < 0 || x >= G[0].length ? 0 : G[y][x]);
function scale2x(G) {
  const h = G.length, w = G[0].length, O = Array.from({ length: h * 2 }, () => new Array(w * 2).fill(0));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const P = G[y][x], A = at(G, x, y - 1), B = at(G, x + 1, y), C = at(G, x - 1, y), D = at(G, x, y + 1);
    O[y * 2][x * 2] = C === A && C !== D && A !== B ? A : P;
    O[y * 2][x * 2 + 1] = A === B && A !== C && B !== D ? B : P;
    O[y * 2 + 1][x * 2] = D === C && D !== B && C !== A ? C : P;
    O[y * 2 + 1][x * 2 + 1] = B === D && B !== A && D !== C ? D : P;
  }
  return O;
}
function scale3x(G) {
  const h = G.length, w = G[0].length, O = Array.from({ length: h * 3 }, () => new Array(w * 3).fill(0));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const A = at(G, x - 1, y - 1), B = at(G, x, y - 1), C = at(G, x + 1, y - 1), D = at(G, x - 1, y), E = G[y][x], F = at(G, x + 1, y), Gg = at(G, x - 1, y + 1), H = at(G, x, y + 1), I = at(G, x + 1, y + 1);
    let e = [E, E, E, E, E, E, E, E, E];
    if (B !== H && D !== F) {
      e = [D === B ? D : E, (D === B && E !== C) || (B === F && E !== A) ? B : E, B === F ? F : E,
        (D === B && E !== Gg) || (D === H && E !== A) ? D : E, E, (B === F && E !== I) || (H === F && E !== C) ? F : E,
        D === H ? D : E, (D === H && E !== I) || (H === F && E !== Gg) ? H : E, H === F ? F : E];
    }
    for (let k = 0; k < 9; k++) O[y * 3 + Math.floor(k / 3)][x * 3 + (k % 3)] = e[k];
  }
  return O;
}
// pack every frame into one sheet
const cell = 26, cols = 12, frames = [];
for (const [id, k] of Object.entries(UPSCALE)) {
  const D = ENEMIES[id], src = D && (D.regSrc || D.reg); if (!src) throw new Error('no registry art for ' + id);
  const def = reg.resolve(src); if (!def) throw new Error('missing ' + src);
  const I = img(def.img);
  for (const [fn, f] of Object.entries(def.frames)) frames.push({ id, fn, G: (k === 3 ? scale3x : scale2x)(grab(I, f)), anims: def.anims });
}
const rows = Math.ceil(frames.length / cols), W = cols * cell, H = rows * cell, rgba = new Uint8Array(W * H * 4), sprites = {};
frames.forEach((F, i) => {
  const ox = (i % cols) * cell, oy = Math.floor(i / cols) * cell;
  F.G.forEach((row, y) => row.forEach((v, x) => { if (!v) return; const c = v - 1, q = ((oy + y) * W + ox + x) * 4; rgba[q] = c >> 16; rgba[q + 1] = (c >> 8) & 255; rgba[q + 2] = c & 255; rgba[q + 3] = 255; }));
  const S = sprites[F.id] || (sprites[F.id] = { frames: {}, anims: F.anims, meta: { from: ENEMIES[F.id].regSrc, upscale: UPSCALE[F.id] } });
  S.frames[F.fn] = [ox, oy, F.G[0].length, F.G.length];
});
mkdirSync('art/bundle/resized', { recursive: true });
writePng('art/bundle/resized/rs_enemies.png', W, H, rgba);
writeFileSync('art/bundle/resized/atlas_resized.json', JSON.stringify({ meta: { name: 'Resized monsters', notes: 'tools/upscale_enemies.mjs: 8x8 monsters redrawn at 16x16 (Scale2x) or 24x24 (Scale3x)' }, rf: true,
  sheets: { rs_enemies: { image: 'rs_enemies.png', kind: 'enemy', sprites } } }, null, 1));
if (!idx.atlases.includes('resized/atlas_resized.json')) { idx.atlases.push('resized/atlas_resized.json'); writeFileSync(new URL('index.json', B0), JSON.stringify(idx, null, 1)); }
console.log(`${Object.keys(sprites).length} monsters, ${frames.length} frames -> art/bundle/resized`);
