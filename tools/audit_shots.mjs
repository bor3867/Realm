// Audits the art of every player weapon's shot against the projectile art standard (docs/projectile_art_standard.md):
// one art pixel to one screen pixel, hard edges (no soft alpha), a few colours, a static single frame, sized by rarity.
//   node tools/audit_shots.mjs            (all weapons; --fail to exit 1 on a breach, --json for the raw table)
import { readFileSync } from 'node:fs';
import { readPng } from './png.mjs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { ITEMS } = await import('../src/data/items.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const path = (u) => new URL(u).pathname.replace(/^\/([A-Z]:)/, '$1').replace(/%20/g, ' ');
const W = JSON.parse(readFileSync(new URL('../art/world/world.json', import.meta.url), 'utf8'));
const P = readPng(path(new URL('../art/world/projectiles.png', import.meta.url)));
const imgs = new Map(), img = (p) => { if (!imgs.has(p)) imgs.set(p, readPng(p)); return imgs.get(p); };
export const RULES = {                                     // the standard, in numbers (see the doc)
  tiered: { max: 10 }, UT: { max: 12 }, MYTHIC: { max: 14 }, LEGENDARY: { max: 16 },
  colours: 6,                                              // distinct opaque colours, outline included
};
function measure(I, cells, cw, ch) {
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, soft = 0, solid = 0; const cols = new Set();
  const [cx, cy] = cells[0];
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const a = I.a(cx + x, cy + y); if (a <= 10) continue;
    if (a < 245) soft++; else solid++;
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    if (a >= 245 && I.rgb) cols.add(I.rgb(cx + x, cy + y).join(','));
  }
  return { w: x1 - x0 + 1, h: y1 - y0 + 1, soft, solid, colours: cols.size, frames: cells.length };
}
export function shotArt(name) {
  if (W.projectiles[name] !== undefined) {
    const k = W.projectiles[name], PS = W.proj, pc = W.projCols, nf = W.projFrames || 1;
    return { src: 'atlas', scale: 1, ...measure(P, [[(k % pc) * PS, Math.floor(k / pc) * PS]], PS, PS), frames: nf };
  }
  const d = reg.resolve(name);
  if (!d) return null;
  const fr = Object.values(d.frames), w = Math.max(...fr.map((f) => f.w)), h = Math.max(...fr.map((f) => f.h));
  const m = measure(img(path(new URL(d.img, B0))), fr.map((f) => [f.x, f.y]), w, h);
  return { src: 'pack', scale: 2, ...m, w: m.w * 2, h: m.h * 2, frames: fr.length };
}
const rank = (it) => (it.legendary ? 'LEGENDARY' : it.mythic ? 'MYTHIC' : it.ut ? 'UT' : 'tiered');
if (process.argv[1] && process.argv[1].endsWith('audit_shots.mjs')) {
  const rows = [];
  for (const it of Object.values(ITEMS)) {
    if (!it.weapon) continue;
    const A = shotArt(it.weapon.proj), r = rank(it), probs = [];
    if (!A) probs.push('no art');
    else {
      if (A.scale !== 1) probs.push(`drawn at ${A.scale}x then resized (uneven pixels)`);
      if (A.soft > 2) probs.push(`${A.soft} soft-alpha pixels (glow/blur)`);
      if (A.frames > 1) probs.push(`${A.frames}-frame animation`);
      if (Math.max(A.w, A.h) > RULES[r].max) probs.push(`${A.w}x${A.h} px, over ${RULES[r].max} for ${r}`);
      if (A.colours > RULES.colours) probs.push(`${A.colours} colours`);
    }
    rows.push({ id: it.id, rank: r, proj: it.weapon.proj, ...(A || {}), probs });
  }
  if (process.argv.includes('--json')) console.log(JSON.stringify(rows, null, 1));
  else {
    const bad = rows.filter((r) => r.probs.length);
    for (const r of bad) console.log(`${r.id.padEnd(28)} ${r.rank.padEnd(9)} ${String(r.proj).padEnd(44)} ${r.probs.join('; ')}`);
    console.log(`${rows.length} weapons; ${bad.length} breach the projectile art standard`);
    if (process.argv.includes('--fail') && bad.length) process.exit(1);
  }
}
