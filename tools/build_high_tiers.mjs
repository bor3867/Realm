// The top of the tier ladders (2026-10-20): weapons and armour T14-T15, abilities T6-T7, rings T4-T7. Their art is
// the tier below the new ones, recoloured into each new tier's own colours by brightness (a pixel's light picks its
// shade on the new ramp; the dark outline stays):
//   T14 (and ability T6, ring T6) ABYSSAL   violet-black, cyan light        T15 (ability T7, ring T7) RADIANT   white-gold, ember
//   ring T4 MOONSILVER   ring T5 STARVIOLET
// Weapons and armour from Realmforge's T13 art, rings from their T3, abilities from our T5 (16x16, halved to 8x8).
//   art/bundle/hitiers/hi_items.png, hi_shots.png + atlas_hitiers.json
//   node tools/build_high_tiers.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { readPng, writePng } from './png.mjs';
const root = new URL('../', import.meta.url), P = (q) => decodeURIComponent(new URL(q, root).pathname).replace(/^\/([A-Z]:)/, '$1');
const A = JSON.parse(readFileSync(P('art/bundle/realmforge/atlas_rf.json'), 'utf8')).sheets;
const W = JSON.parse(readFileSync(P('art/world/world.json'), 'utf8'));
const rfItems = readPng(P('art/bundle/realmforge/rf_items.png')), rfShots = readPng(P('art/bundle/realmforge/rf_shots.png')), old = readPng(P('art/world/items.png'));
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const RAMP = {                                                     // dark to light
  abyssal: ['#140a24', '#2e1450', '#5a2a9a', '#7a5ae0', '#4ad8f0', '#c8fcff'],
  radiant: ['#3a1a08', '#a8561a', '#f29a2e', '#ffd650', '#fff0a0', '#ffffff'],
  moonsilver: ['#1a2030', '#3a4a66', '#6a82a8', '#a8c0dc', '#dceaf8', '#ffffff'],
  starviolet: ['#1a0a2a', '#3a1a5a', '#7a3ab0', '#b070f0', '#e0b0ff', '#fff0ff'],
};
// one sprite out of a sheet, as rgba rows, recoloured by brightness onto a ramp (step: 1, or 2 to halve a 16x16)
function grab(img, x0, y0, w, h, ramp, step = 1, keepGem = false) {
  const R = RAMP[ramp].map(hex), out = [];
  for (let y = 0; y < h; y += step) {
    const row = [];
    for (let x = 0; x < w; x += step) {
      const a = img.a(x0 + x, y0 + y);
      if (a < 128) { row.push(null); continue; }
      const [r, g, b] = img.rgb(x0 + x, y0 + y), L = (0.3 * r + 0.59 * g + 0.11 * b) / 255, mx = Math.max(r, g, b), sat = mx ? (mx - Math.min(r, g, b)) / mx : 0;
      if (keepGem && sat > 0.4 && L > 0.2) { row.push([r, g, b]); continue; }   // (a ring keeps its stone: it tells the stat)
      row.push(L < 0.1 ? [10, 6, 16] : R[Math.min(R.length - 1, Math.floor(L * R.length * 1.05))]);
    }
    out.push(row);
  }
  return out;
}
class Sheet {                                                      // a shelf of same-sized cells
  constructor(name, kind, cell) { this.name = name; this.kind = kind; this.cell = cell; this.items = []; }
  add(key, px, meta = {}) { this.items.push([key, px, meta]); }
  build(dir) {
    const cols = 16, C = this.cell, rows = Math.ceil(this.items.length / cols), w = cols * C, h = Math.max(1, rows) * C, rgba = new Uint8Array(w * h * 4), sprites = {};
    this.items.forEach(([key, px, meta], i) => {
      const ox = (i % cols) * C, oy = Math.floor(i / cols) * C;
      px.forEach((row, y) => row.forEach((c, x) => { if (!c) return; const q = ((oy + y) * w + ox + x) * 4; rgba[q] = c[0]; rgba[q + 1] = c[1]; rgba[q + 2] = c[2]; rgba[q + 3] = 255; }));
      sprites[key] = { frames: { 0: [ox, oy, px[0].length, px.length] }, meta };
    });
    writePng(`${dir}/${this.name}.png`, w, h, rgba);
    return { image: `${this.name}.png`, kind: this.kind, sprites };
  }
}
const items = new Sheet('hi_items', 'item', 8), shots = new Sheet('hi_shots', 'shot', 8);
const fr = (sheet, key) => sheet.sprites[key].frames['0'];
const WEAPONS = ['sword', 'dagger', 'bow', 'staff', 'wand'], ARMOURS = ['heavy', 'leather', 'robe'];
const STATS = ['hp', 'mp', 'att', 'def', 'spd', 'dex', 'vit', 'wis'];
const ABILITIES = ['bellows', 'seal', 'halo', 'reliquary', 'hookline', 'mirror', 'kite', 'stopwatch', 'runeward', 'hex'];
for (const [t, ramp] of [[14, 'abyssal'], [15, 'radiant']]) {
  for (const type of WEAPONS) {
    const [x, y, w, h] = fr(A.rf_items, `${type}_t13`); items.add(`${type}_t${t}`, grab(rfItems, x, y, w, h, ramp));
    const [sx, sy, sw, sh] = fr(A.rf_shots, `${type}_t13`); shots.add(`${type}_t${t}`, grab(rfShots, sx, sy, sw, sh, ramp));
  }
  for (const type of ARMOURS) { const [x, y, w, h] = fr(A.rf_items, `${type}_t13`); items.add(`${type}_t${t}`, grab(rfItems, x, y, w, h, ramp)); }
}
for (const [t, ramp] of [[4, 'moonsilver'], [5, 'starviolet'], [6, 'abyssal'], [7, 'radiant']]) {
  for (const s of STATS) { const [x, y, w, h] = fr(A.rf_items, `ring_${s}_t3`); items.add(`ring_${s}_t${t}`, grab(rfItems, x, y, w, h, ramp, 1, true)); }
}
for (const [t, ramp] of [[6, 'abyssal'], [7, 'radiant']]) {
  for (const type of ABILITIES) {
    const k = W.items[type] + 5, c = W.itemsCols;                // our T5 of the kind (16x16 cells), halved to 8x8
    items.add(`${type}_t${t}`, grab(old, (k % c) * 16, Math.floor(k / c) * 16, 16, 16, ramp, 2));
  }
}
const dir = P('art/bundle/hitiers');
mkdirSync(dir, { recursive: true });
const atlas = { rf: true, meta: { name: 'The top of the tier ladders', version: 1 }, sheets: { hi_items: items.build(dir), hi_shots: shots.build(dir) } };
writeFileSync(`${dir}/atlas_hitiers.json`, JSON.stringify(atlas, null, 1) + '\n');
const ip = P('art/bundle/index.json'), idx = JSON.parse(readFileSync(ip, 'utf8'));
if (!idx.atlases.includes('hitiers/atlas_hitiers.json')) { idx.atlases.push('hitiers/atlas_hitiers.json'); writeFileSync(ip, JSON.stringify(idx, null, 1)); }
console.log(`high tiers: ${items.items.length} items, ${shots.items.length} shots -> art/bundle/hitiers`);
