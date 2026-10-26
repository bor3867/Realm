// One engine, step 3 (docs/realmforge_port.md, Phase 5): the Realmforge dungeons' creatures and their shots, drawn from
// their own pixel grids (art/rf/data.json) into our registry, so our engine draws them like any monster of ours.
//   rf_crea/<dungeon>_<id>   two frames to move (theirs), an attack frame (the second, the one they strike on), a hurt
//                            frame (the first, pale); 8px art drawn at the player's pixel size, 16px and 24px at the fine
//                            size (src/rf/creatures.js sets each one's scale), our outline at draw time
//   rf_shot/<dungeon>_<shot> each shot from its boss's shot sheet (every creature's shot is on it), unoutlined in their
//                            engine; ours outlines it like every shot
//   -> art/bundle/realmforge_crea/{rf_crea.png, rf_shot.png, atlas_rf_crea.json}, listed in art/bundle/index.json
//   node tools/rf_build_creatures.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { writePng } from './png.mjs';
const B0 = new URL('../art/bundle/', import.meta.url), OUT = new URL('realmforge_crea/', B0);
const DATA = JSON.parse(readFileSync(new URL('../art/rf/data.json', import.meta.url), 'utf8'));
const hex = (h) => { const n = parseInt(h.replace('#', '').slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const pale = ([r, g, b]) => [r, g, b].map((v) => Math.round(v + (255 - v) * 0.6));
// shelf-pack grids into one image: each cell gets 1px of space round it
function sheet(cells) {
  const W = 512; let x = 1, y = 1, rowH = 0; const place = [];
  for (const c of cells) { const w = c.grid[0].length, h = c.grid.length; if (x + w + 1 > W) { x = 1; y += rowH + 2; rowH = 0; } place.push({ ...c, x, y, w, h }); x += w + 2; rowH = Math.max(rowH, h); }
  const H = y + rowH + 1, px = new Uint8Array(W * H * 4);
  for (const c of place) for (let j = 0; j < c.h; j++) for (let i = 0; i < c.w; i++) {
    const ch = (c.grid[j] || '')[i]; if (!ch || ch === '.' || !c.pal[ch]) continue;
    const rgb = c.paleIt ? pale(hex(c.pal[ch])) : hex(c.pal[ch]), k = ((c.y + j) * W + c.x + i) * 4;
    px[k] = rgb[0]; px[k + 1] = rgb[1]; px[k + 2] = rgb[2]; px[k + 3] = 255;
  }
  return { W, H, px, place };
}
// the creatures (their bosses are drawn by tools/rf_build_bx.py)
const crea = [];
for (const [dg, X] of Object.entries(DATA.explore.dungeons)) for (const [id, e] of Object.entries(X.enemies)) {
  if (e.boss || !e.art) continue;
  const [f0, f1] = e.art.frames, name = `${dg}_${id}`;
  crea.push({ name, fn: 'move1', grid: f0, pal: e.art.pal }, { name, fn: 'move2', grid: f1 || f0, pal: e.art.pal }, { name, fn: 'attack', grid: f1 || f0, pal: e.art.pal }, { name, fn: 'hurt', grid: f0, pal: e.art.pal, paleIt: true });
  if (e.idle && e.idle.frames) crea.push({ name, fn: 'dormant', grid: e.idle.frames[0], pal: e.idle.pal || e.art.pal });
}
// their creatures' shots, from each dungeon's boss's shot sheet
const shots = [], need = new Map();
for (const [dg, X] of Object.entries(DATA.explore.dungeons)) for (const e of Object.values(X.enemies)) for (const a of [...(e.atk || []), ...(e.atk2 || [])]) if (a.shot) need.set(`${dg}_${a.shot}`, [dg, a.shot]);
let missing = 0;
for (const [name, [dg, s]] of need) {
  const D = DATA.dungeons.find((d) => d.id === dg), B = D && DATA.bosses.find((b) => b.id === D.boss), S = B && B.shots && B.shots[s];
  if (!S || !S.grid) { missing++; continue; }
  shots.push({ name, fn: '0', grid: S.grid, pal: S.pal });
}
mkdirSync(OUT, { recursive: true });
const atlas = { meta: { name: 'Realmforge creatures', notes: 'tools/rf_build_creatures.mjs: their dungeons\' creatures and shots, from their own pixel grids' }, rf: true, sheets: {} };
for (const [key, cells, kind] of [['rf_crea', crea, 'enemy'], ['rf_shot', shots, 'shot']]) {
  const { W, H, px, place } = sheet(cells);
  writePng(new URL(`${key}.png`, OUT), W, H, px);
  const sprites = {};
  for (const c of place) { const S = (sprites[c.name] = sprites[c.name] || { frames: {} }); S.frames[c.fn] = [c.x, c.y, c.w, c.h]; }
  if (kind === 'enemy') for (const S of Object.values(sprites)) S.anims = { move: { frames: ['move1', 'move2'], fps: 5, loop: true }, attack: { frames: ['move1', 'attack'], fps: 6, loop: false }, hurt: { frames: ['hurt', 'move1'], fps: 8, loop: false }, ...(S.frames.dormant ? { dormant: { frames: ['dormant'], fps: 1, loop: true } } : {}) };
  atlas.sheets[key] = { image: `${key}.png`, kind, outline: true, sprites };
}
writeFileSync(new URL('atlas_rf_crea.json', OUT), JSON.stringify(atlas));
// listed in the bundle's index once, in its own style (one entry a line, after the redrawn monsters)
const idxTxt = readFileSync(new URL('index.json', B0), 'utf8');
if (!idxTxt.includes('realmforge_crea/atlas_rf_crea.json')) writeFileSync(new URL('index.json', B0), idxTxt.replace('  "resized/atlas_resized.json",', '  "resized/atlas_resized.json",\n  "realmforge_crea/atlas_rf_crea.json",'));
console.log(`${crea.filter((c) => c.fn === 'move1').length} creatures, ${shots.length} shots (${missing} missing) -> art/bundle/realmforge_crea`);
