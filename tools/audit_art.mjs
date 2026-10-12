// Every character, monster, boss, pet, item and object sprite, measured for the things that make pixel art look
// unfinished or out of place next to its neighbours:
//   soft     share of semi-transparent pixels (blur or baked glow; crisp art has none)
//   empty    animation frames with nothing in them
//   feet     how far its lowest pixel moves up and down across a looping clip (px): jitter when it should stand
//   drift    how far its middle moves sideways across a looping clip (px)
//   outline  share of its silhouette's edge that is dark (RotMG-style art is outlined; low = no outline)
//   chunky   drawn at twice its sheet's pixel size (every pixel a 2x2 block): a coarser density than its neighbours
//   node tools/audit_art.mjs [--all]
import { readFileSync } from 'node:fs';
import { readPng } from './png.mjs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const root = new URL('../', import.meta.url), path = (u) => new URL(u, root).pathname.replace(/^\/([A-Z]:)/, '$1').replace(/%20/g, ' ');
const B0 = new URL('art/bundle/', root), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const imgs = new Map(), img = (p) => { if (!imgs.has(p)) imgs.set(p, readPng(p)); return imgs.get(p); };
const lum = ([r, g, b]) => 0.3 * r + 0.59 * g + 0.11 * b;
function frame(I, x0, y0, w, h) {
  let vis = 0, soft = 0, bx0 = 1e9, by0 = 1e9, bx1 = -1, by1 = -1, edge = 0, dark = 0, blocks = 0, same = 0;
  const A = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : I.a(x0 + x, y0 + y));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const a = A(x, y); if (a <= 10) continue;
    vis++; if (a < 240) soft++;
    bx0 = Math.min(bx0, x); by0 = Math.min(by0, y); bx1 = Math.max(bx1, x); by1 = Math.max(by1, y);
    if (A(x - 1, y) <= 10 || A(x + 1, y) <= 10 || A(x, y - 1) <= 10 || A(x, y + 1) <= 10) { edge++; if (lum(I.rgb(x0 + x, y0 + y)) < 75) dark++; }
  }
  for (let y = 0; y + 1 < h; y += 2) for (let x = 0; x + 1 < w; x += 2) {
    const a = A(x, y); if (a <= 10) continue;
    blocks++;
    const c = I.rgb(x0 + x, y0 + y).join();
    if (A(x + 1, y) > 10 && A(x, y + 1) > 10 && A(x + 1, y + 1) > 10 && I.rgb(x0 + x + 1, y0 + y).join() === c && I.rgb(x0 + x, y0 + y + 1).join() === c && I.rgb(x0 + x + 1, y0 + y + 1).join() === c) same++;
  }
  return { vis, soft, bottom: by1, mid: (bx0 + bx1) / 2, edge, dark, blocks, same };
}
const rows = [];
function judge(src, id, clips) {                        // clips: { name: { loop, frames: [frameStats] } }
  const all = Object.values(clips).flatMap((c) => c.frames).filter((f) => f.vis);
  if (!all.length) { rows.push({ src, id, probs: ['no visible frames'] }); return; }
  const empty = Object.values(clips).reduce((s, c) => s + c.frames.filter((f) => !f.vis).length, 0);
  const vis = all.reduce((s, f) => s + f.vis, 0), soft = all.reduce((s, f) => s + f.soft, 0) / vis;
  const edge = all.reduce((s, f) => s + f.edge, 0), outline = edge ? all.reduce((s, f) => s + f.dark, 0) / edge : 1;
  const blocks = all.reduce((s, f) => s + f.blocks, 0), chunky = blocks ? all.reduce((s, f) => s + f.same, 0) / blocks : 0;
  let feet = 0, drift = 0;
  for (const [n, c] of Object.entries(clips)) {
    if (!c.loop || !/idle|move|walk|fly|hover/.test(n)) continue;
    const F = c.frames.filter((f) => f.vis); if (F.length < 2) continue;
    feet = Math.max(feet, Math.max(...F.map((f) => f.bottom)) - Math.min(...F.map((f) => f.bottom)));
    drift = Math.max(drift, Math.max(...F.map((f) => f.mid)) - Math.min(...F.map((f) => f.mid)));
  }
  const probs = [soft > 0.05 ? `soft ${(soft * 100).toFixed(0)}%` : '', empty ? `${empty} empty frames` : '', feet > 2 ? `feet move ${feet}px` : '', drift > 3 ? `drifts ${drift.toFixed(0)}px` : ''].filter(Boolean);
  rows.push({ src, id, soft, empty, feet, drift, outline, chunky, probs });
}
// 1. the row sheets: one row per creature, animations by column
const SHEETS = [['art/sprites/enemies/enemies_sheet.json', 'enemies'], ['art/sprites/enemies/champions_sheet.json', 'champions'], ['art/sprites/bosses/realm_bosses_sheet.json', 'bosses'], ['art/sprites/bosses/pack_bosses_sheet.json', 'bosses'], ['art/sprites/bosses/godking_sheet.json', 'bosses']];
for (const [f, key] of SHEETS) {
  let G; try { G = JSON.parse(readFileSync(path(f), 'utf8')); } catch { continue; }
  const I = img(path(f.replace(/[^/]+$/, G.image || f.split('/').pop().replace('.json', '.png'))));
  const W = G.frameWidth, H = G.frameHeight, list = G[key] || G.enemies || G.champions || G.bosses || {};
  for (const [id, M] of Object.entries(list)) {
    const clips = {};
    const anims = G.animations || { idle: { col: 0, frames: G.columns || 1 } };   // (a sheet with no named clips: its whole row)
    for (const [n, A] of Object.entries(anims)) clips[n] = { loop: A.loop !== false && (A.frames || 1) > 1, frames: Array.from({ length: A.frames || 1 }, (_, k) => frame(I, (A.col + k) * W, M.row * H, W, H)) };
    judge(f.split('/').pop().replace('_sheet.json', ''), id, clips);
  }
}
// 2. the registry packs: creatures, bosses, pets, items, objects, eggs
for (const d of reg.list((q) => ['creature', 'boss', 'pet', 'item', 'object', 'egg'].includes(q.kind))) {
  const I = img(path(new URL(d.img, B0).href));
  const fr = d.frames || {}, clips = {};
  const anims = d.anims && Object.keys(d.anims).length ? d.anims : { idle: { frames: Object.keys(fr) } };
  for (const [n, A] of Object.entries(anims)) {
    const names = (A.frames || []).map((q) => (typeof q === 'string' ? q : q && q.f !== undefined ? q.f : q));
    const F = names.map((k) => fr[k]).filter(Boolean);
    clips[n] = { loop: A.loop !== false && F.length > 1, frames: F.map((q) => frame(I, q.x, q.y, q.w, q.h)) };
  }
  judge(d.kind + ':' + d.key.split('/')[0], d.key, clips);
}
// 3. the world atlases: items and objects (16 px cells)
const Wd = JSON.parse(readFileSync(path('art/world/world.json'), 'utf8'));
for (const [atlas, map, cols] of [['items', Wd.items, Wd.itemsCols || 8], ['objects', Wd.objects, Wd.objectsCols || 8]]) {
  const I = img(path(`art/world/${atlas}.png`));
  for (const [id, k] of Object.entries(map || {})) if (typeof k === 'number') judge('world ' + atlas, id, { still: { loop: false, frames: [frame(I, (k % cols) * 16, Math.floor(k / cols) * 16, 16, 16)] } });
}
// outline and pixel density are judged against the sprite's own group (the game's style mixes outlined and unoutlined
// art; what stands out is a sprite unlike its neighbours): an outline far weaker than the group's usual, or a pixel
// density the group mostly does not share
const groups = {}; for (const r of rows) if (r.outline !== undefined) (groups[r.src] = groups[r.src] || []).push(r);
for (const L of Object.values(groups)) {
  const med = (k) => { const v = L.map((r) => r[k]).sort((a, b) => a - b); return v[v.length >> 1]; };
  const mo = med('outline'), chunkyGroup = L.filter((r) => r.chunky > 0.9).length > L.length / 2;
  for (const r of L) {
    if (L.length >= 4 && mo >= 0.45 && r.outline < mo - 0.35) r.probs.push(`outline ${(r.outline * 100).toFixed(0)}% (group ${(mo * 100).toFixed(0)}%)`);
    if (L.length >= 4 && (r.chunky > 0.9) !== chunkyGroup) r.probs.push(r.chunky > 0.9 ? 'coarser pixels than its group' : 'finer pixels than its group');
  }
}
if (process.argv.includes('--density')) for (const [g2, L] of Object.entries(groups)) console.log(`  density ${g2.padEnd(26)} ${L.filter((r) => r.chunky > 0.9).length} of ${L.length} drawn at 2x pixels`);
const by = {};
for (const r of rows) { const S = (by[r.src] = by[r.src] || { n: 0, bad: 0, kinds: {} }); S.n++; if (r.probs.length) { S.bad++; for (const p of r.probs) { const k = p.replace(/[0-9.]+/g, '#'); S.kinds[k] = (S.kinds[k] || 0) + 1; } } }
for (const [src, S] of Object.entries(by)) console.log(`${src.padEnd(26)} ${String(S.bad).padStart(3)} of ${String(S.n).padEnd(4)} ${Object.entries(S.kinds).map(([k, v]) => `${k}: ${v}`).join(', ')}`);
if (process.argv.includes('--all')) for (const r of rows.filter((q) => q.probs.length)) console.log(`  ${r.src.padEnd(24)} ${r.id.padEnd(40)} ${r.probs.join(', ')}`);
console.log(`${rows.length} sprites measured; ${rows.filter((r) => r.probs.length).length} with something to look at`);
