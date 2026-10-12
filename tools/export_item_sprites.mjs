// Exports every item's sprite for outside review: each item's art at its native 8x8 and at 8x, labelled contact sheets
// (one per category, each sprite numbered with its id under it) and a CSV of what each item is.
//   node tools/export_item_sprites.mjs [outDir]      (default: exports/item_sprites)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { readPng, writePng } from './png.mjs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { ITEMS, iconIndex, itemLabel } = await import('../src/data/items.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const path = (u) => new URL(u).pathname.replace(/^\/([A-Z]:)/, '$1').replace(/%20/g, ' ');
const W = JSON.parse(readFileSync(new URL('../art/world/world.json', import.meta.url), 'utf8'));
const SHEET = readPng(path(new URL('../art/world/items.png', import.meta.url)));
const imgs = new Map(), img = (p) => { if (!imgs.has(p)) imgs.set(p, readPng(p)); return imgs.get(p); };
const out = process.argv[2] || path(new URL('../exports/item_sprites/', import.meta.url));
mkdirSync(out + '/sprites_8x8', { recursive: true }); mkdirSync(out + '/sprites_8x', { recursive: true });

// an item's art as an 8x8 grid of [r,g,b,a] (the sheet stores it doubled: every 2x2 block is one art pixel)
function art(it) {
  const rd = it.reg && reg.resolve(it.reg), rf = rd && Object.values(rd.frames)[0];
  if (rf) {
    const P = img(path(new URL(rd.img, B0))), s = rf.w / 8;
    return Array.from({ length: 8 }, (_, y) => Array.from({ length: 8 }, (_, x) => [...P.rgb(rf.x + x * s, rf.y + y * s), P.a(rf.x + x * s, rf.y + y * s)]));
  }
  const k = iconIndex(W, it), c = W.itemsCols, ox = (k % c) * 16, oy = Math.floor(k / c) * 16;
  return Array.from({ length: 8 }, (_, y) => Array.from({ length: 8 }, (_, x) => [...SHEET.rgb(ox + x * 2, oy + y * 2), SHEET.a(ox + x * 2, oy + y * 2)]));
}
const png = (file, G, z) => {
  const n = 8 * z, buf = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const c = G[Math.floor(y / z)][Math.floor(x / z)], q = (y * n + x) * 4; buf[q] = c[0]; buf[q + 1] = c[1]; buf[q + 2] = c[2]; buf[q + 3] = c[3] > 10 ? 255 : 0; }
  writePng(file, n, n, buf);
};

// a 3x5 pixel font for the labels
const F = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111',
  0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110', 4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001110', _: '000000000000111', '-': '000000111000000', '.': '000000000000010', ' ': '000000000000000', '#': '101111101111101', '/': '001001010100100' };
function text(buf, BW, x0, y0, s, sc, col) {
  [...s.toUpperCase()].forEach((ch, i) => { const g = F[ch] || F[' '];
    for (let j = 0; j < 15; j++) if (g[j] === '1') for (let yy = 0; yy < sc; yy++) for (let xx = 0; xx < sc; xx++) {
      const x = x0 + (i * 4 + (j % 3)) * sc + xx, y = y0 + Math.floor(j / 3) * sc + yy, q = (y * BW + x) * 4; buf[q] = col[0]; buf[q + 1] = col[1]; buf[q + 2] = col[2]; buf[q + 3] = 255; } });
}
const wrap = (s, n) => { const L = []; let r = s; while (r.length > n) { let c = r.lastIndexOf('_', n); if (c < n / 2) c = n; L.push(r.slice(0, c)); r = r.slice(c).replace(/^_/, ''); } L.push(r); return L.slice(0, 3); };

const RARITY = (it) => (it.admin ? 'admin' : it.mythic ? 'mythic' : it.legendary ? 'legendary' : it.ut ? 'untiered' : it.slot === 'consumable' ? 'consumable' : 'tiered');
const GROUPS = { weapons: (it) => it.slot === 'weapon', abilities: (it) => it.slot === 'ability', armor: (it) => it.slot === 'armor', rings: (it) => it.slot === 'ring', consumables: (it) => it.slot === 'consumable' || !['weapon', 'ability', 'armor', 'ring'].includes(it.slot) };
const csv = [['number', 'id', 'name', 'category', 'type', 'tier', 'rarity', 'label', 'art source', 'shares art with'].join(',')];
const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const firstOf = new Map();
let n = 0;
for (const [group, test] of Object.entries(GROUPS)) {
  const L = Object.values(ITEMS).filter(test).sort((a, b) => (a.type || '').localeCompare(b.type || '') || (a.tier ?? 99) - (b.tier ?? 99) || a.id.localeCompare(b.id));
  const Z = 8, CW = 172, CH = 8 * Z + 54, cols = 10, BW = cols * CW, BH = Math.ceil(L.length / cols) * CH + 30, buf = new Uint8Array(BW * BH * 4);
  for (let i = 0; i < buf.length; i += 4) { buf[i] = 40; buf[i + 1] = 40; buf[i + 2] = 44; buf[i + 3] = 255; }
  text(buf, BW, 8, 8, `REALM ITEM SPRITES - ${group} (${L.length}) - 8X8 ART AT 8X`, 3, [255, 224, 96]);
  L.forEach((it, i) => {
    n++;
    const G = art(it), key = G.flat().map((c) => (c[3] > 10 ? c.slice(0, 3).join('.') : '-')).join('|');
    if (!firstOf.has(key)) firstOf.set(key, it.id);
    png(`${out}/sprites_8x8/${it.id}.png`, G, 1); png(`${out}/sprites_8x/${it.id}.png`, G, 8);
    const gx = (i % cols) * CW, gy = 30 + Math.floor(i / cols) * CH, ix = gx + (CW - 8 * Z) / 2;
    for (let y = 0; y < 8 * Z; y++) for (let x = 0; x < 8 * Z; x++) {          // a checker behind the sprite, then the sprite
      const c = G[Math.floor(y / Z)][Math.floor(x / Z)], qd = ((gy + 4 + y) * BW + ix + x) * 4, ch = (Math.floor(x / 8) + Math.floor(y / 8)) % 2 ? 62 : 72;
      if (c[3] > 10) { buf[qd] = c[0]; buf[qd + 1] = c[1]; buf[qd + 2] = c[2]; } else { buf[qd] = buf[qd + 1] = buf[qd + 2] = ch; }
    }
    text(buf, BW, gx + 4, gy + 8 * Z + 8, `#${n}`, 2, [255, 224, 96]);
    wrap(it.id, 20).forEach((line, j) => text(buf, BW, gx + 4, gy + 8 * Z + 22 + j * 12, line, 2, [230, 230, 230]));
    csv.push([n, it.id, q(it.name), group, it.type || '', it.tier ?? '', RARITY(it), q(itemLabel(it)), it.reg ? q(it.reg) : 'items.png', firstOf.get(key) !== it.id ? firstOf.get(key) : ''].join(','));
  });
  writePng(`${out}/sheet_${group}.png`, BW, BH, buf);
  console.log(`${group}: ${L.length}`);
}
writeFileSync(`${out}/items.csv`, csv.join('\n') + '\n');
writeFileSync(`${out}/README.txt`, `Realm item sprites (${n} items)\n\nEvery item is 8x8 pixel art, drawn in game at 2x with an added 1 px black outline and a soft shadow.\n\n` +
  `sheet_<category>.png  labelled contact sheets: each sprite at 8x, with its number and id under it\nsprites_8x8/<id>.png   each sprite at its native 8x8 (transparent background)\nsprites_8x/<id>.png    each sprite at 8x (64x64)\nitems.csv              number, id, name, category, type, tier, rarity, label, art source, and which earlier item\n                       it shares identical art with (enchanted and variant items reuse their base's art)\n`);
console.log(`${n} items -> ${out}`);
