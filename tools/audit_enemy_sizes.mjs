// How big every enemy is drawn, against how much it matters (docs/overhaul_checklist.md: the enemy sizing pass).
// For each enemy: where its art comes from (the old 16px sheet, the 24px champions sheet, or the registry), the art's
// visible height and width, the scale it is drawn at, and so its height on screen in buffer pixels (a tile is 16; the
// player stands about 16). It fails on any monster drawn at a fractional pixel size. Then its role: fodder (a pack's small fry), regular, leader (a group's parent), champion
// (an elite or warden), dungeon (a dungeon's own), and the height that role should have. Off by a lot: listed.
//   node tools/audit_enemy_sizes.mjs [--all]       --json writes art/audit/enemy_sizes.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { readPng } from './png.mjs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { ENEMIES, DUNGEONS, GROUPS, PACKS } = await import('../src/data/enemies.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const packOf = new Map();
const reg = buildRegistry(idx.atlases.map((a) => { const pack = a.split('/')[0]; return { pack, json: J(a) }; }), J(idx.hover), (q) => q);
const imgs = new Map(), img = (p) => { if (!imgs.has(p)) imgs.set(p, readPng(p)); return imgs.get(p); };
void packOf;
// the visible box of a frame
function box(I, x0, y0, w, h) {
  let a = w, b = h, c = -1, d = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (I.a(x0 + x, y0 + y) > 20) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); }
  return c < 0 ? { w: 0, h: 0 } : { w: c - a + 1, h: d - b + 1 };
}
const sheet = (n) => { const j = JSON.parse(readFileSync(`art/sprites/enemies/${n}_sheet.json`, 'utf8')); return { j, I: img(`art/sprites/enemies/${j.image}`) }; };
const EN = sheet('enemies'), CH = sheet('champions');
const regImgPath = (def) => {
  // a registry def's image: art/bundle/<pack>/<image>
  const cands = [`art/bundle/${def.img}`, `art/bundle/${def.pack}/${def.img}`];
  for (const c of cands) { try { readFileSync(c); return c; } catch { /* next */ } }
  return null;
};
const kids = new Set(), leaders = new Set(), packs = new Set(), dmobs = new Set(), delites = new Set();
for (const D of Object.values(ENEMIES)) for (const c of D.children || []) kids.add(c);
for (const [id, D] of Object.entries(ENEMIES)) if (D.children) leaders.add(id);
for (const L of Object.values(PACKS)) for (const [id] of L) packs.add(id);
for (const D of Object.values(DUNGEONS)) { for (const m of D.mobs || []) dmobs.add(m); for (const m of D.elites || []) delites.add(m); for (const m of D.wardens || []) delites.add(m); }
void GROUPS;
const ROLE_H = { fodder: [12, 18], regular: [14, 22], leader: [20, 30], champion: [24, 36], dungeon: [14, 26], 'dungeon elite': [22, 34] };
const rows = [];
for (const [id, D] of Object.entries(ENEMIES)) {
  if (D.rb || D.bx || D.dummy || D.objSprite || D.melon) continue;
  let src, b, K;
  try {
    if (D.reg) {
      const def = reg.resolve(D.reg); if (!def) { rows.push({ id, name: D.name, src: 'missing ' + D.reg }); continue; }
      const p = regImgPath(def), f = def.frames[Object.keys(def.frames)[0]];
      if (!p) { rows.push({ id, name: D.name, src: 'noimg ' + D.reg }); continue; }
      b = box(img(p), f.x, f.y, f.w, f.h); K = 2 * (D.scale || 1); src = `reg ${f.w}x${f.h}`;
    } else if (D.sheet === 'champions') {
      const r = CH.j.champions[id]; if (!r) continue; const F = CH.j.frameWidth;
      b = box(CH.I, 0, r.row * F, F, F); K = 1; src = `champ ${F}`;
    } else {
      const m = EN.j.enemies && EN.j.enemies[id]; if (!m) continue;
      b = box(EN.I, 0, m.row * 16, 16, 16); K = D.scale || 1; src = 'sheet 16';
    }
  } catch (err) { rows.push({ id, name: D.name, src: 'error ' + err.message }); continue; }
  const role = D.sheet === 'champions' || D.elite ? 'champion' : leaders.has(id) ? 'leader' : delites.has(id) ? 'dungeon elite' : dmobs.has(id) ? 'dungeon' : kids.has(id) || packs.has(id) ? 'fodder' : 'regular';
  const H = Math.round(b.h * K), [lo, hi] = ROLE_H[role];
  rows.push({ id, name: D.name, biome: D.biome || '', src, art: `${b.w}x${b.h}`, artH: b.h, K: +K.toFixed(2), H, role, lo, hi, off: H < lo ? 'small' : H > hi ? 'big' : '' });
}
const all = process.argv.includes('--all');
const show = rows.filter((r) => all || r.off || !r.H);
console.log('id'.padEnd(28) + 'name'.padEnd(26) + 'biome'.padEnd(10) + 'src'.padEnd(14) + 'art'.padEnd(7) + 'K'.padEnd(6) + 'drawn'.padEnd(7) + 'role'.padEnd(14) + 'want');
for (const r of show.sort((a, b) => (a.role || '').localeCompare(b.role || '') || (a.H || 0) - (b.H || 0))) console.log(`${r.id.padEnd(28)}${(r.name || '').slice(0, 25).padEnd(26)}${(r.biome || '').padEnd(10)}${(r.src || '').padEnd(14)}${(r.art || '').padEnd(7)}${String(r.K ?? '').padEnd(6)}${String(r.H ?? '').padEnd(7)}${(r.role || '').padEnd(14)}${r.lo ? r.lo + '-' + r.hi : ''} ${r.off || ''}`);
const off = rows.filter((r) => r.off);
console.log(`\n${rows.length} enemies; by role (a guide, not a rule): ${off.filter((r) => r.off === 'big').length} larger, ${off.filter((r) => r.off === 'small').length} smaller than their role's usual size`);
// the rule: every monster at a whole pixel size (1 or 2 screen pixels to an art pixel), so pixels match across the
// screen; a fraction gives big uneven pixels (the sizing pass of 2026-10-19 redrew those: tools/upscale_enemies.mjs)
const frac = rows.filter((r) => r.K && ![1, 2, 4].includes(r.K)), lost = rows.filter((r) => !r.H && r.src);
for (const r of frac) console.log(`  FRACTIONAL pixel size: ${r.id} (${r.src}, x${r.K})`);
for (const r of lost) console.log(`  NO ART: ${r.id} (${r.src})`);
console.log(frac.length || lost.length ? `${frac.length + lost.length} problem(s)` : 'every monster at a whole pixel size: OK');
if (process.argv.includes('--json')) { mkdirSync('art/audit', { recursive: true }); writeFileSync('art/audit/enemy_sizes.json', JSON.stringify(rows, null, 1)); }
