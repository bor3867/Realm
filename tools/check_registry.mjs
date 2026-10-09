// Headless check of the sprite registry (src/registry.js) against the bundle in art/bundle/:
// every atlas loads through its adapter, every clip's frames exist, every MANIFEST sheet registered,
// supersession redirects resolve.      node tools/check_registry.mjs
import { readFileSync } from 'node:fs';
import { buildRegistry } from '../src/registry.js';

const B = new URL('../art/bundle/', import.meta.url);
const J = (p) => JSON.parse(readFileSync(new URL(p, B), 'utf8'));
const idx = J('index.json');
const R = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (p) => p);
const bad = [];
for (const d of R.defs.values()) {
  for (const [clip, A] of Object.entries(d.anims || {})) for (const f of A.frames) if (!d.frames[f]) bad.push(`${d.key} clip ${clip} missing frame ${f}`);
  if (!d.img) bad.push(`${d.key} has no image`);
  if (d.phases) for (const [n, ph] of Object.entries(d.phases)) for (const c of [ph.idle, ph.attack, ph.enter, ph.hurt].filter(Boolean)) if (!d.anims[c]) bad.push(`${d.key} phase ${n} clip ${c} missing`);
}
const M = J(idx.manifest);
const sheets = new Set([...R.defs.values()].map((d) => d.sheet));
for (const [pack, P] of Object.entries(M.packs)) for (const s of P.sheets) if (!sheets.has(s)) bad.push(`manifest sheet ${s} (${pack}) not registered`);
for (const s of M.supersedes) {
  const name = s.old.includes('/') ? s.old.split('/')[1].split(' ')[0] : null;
  if (name) { const d = R.resolve(`${s.old.split('/')[0] === 'crypt' || s.old.split('/')[0] === 'ember' ? 'pack_bosses' : s.old.split('/')[0]}/${name}`); if (!d || d.sheet !== s.new) bad.push(`supersession ${s.old} -> ${s.new} resolves to ${d && d.key}`); }
}
for (const k of ['items/tidecaller_blade', 'ex_items/sunscorch_khopesh']) if (!R.resolve(k) || R.resolve(k).sheet !== 'ix_items') bad.push(`redirect ${k} failed`);
if (R.resolve('items/health_potion')) bad.push('kept pack-1 potion was redirected');
console.log('defs per pack:', R.counts);
console.log('total defs', R.defs.size, '| aliases', [...R.alias.values()].filter(Boolean).length, '| redirects', R.redirect.size,
  '| hovering', [...R.defs.values()].filter((d) => d.hover).length, '| bosses', R.list((d) => d.kind === 'boss').map((d) => d.name).join(' '));
if (bad.length) { console.log('PROBLEMS:\n' + bad.join('\n')); process.exit(1); }
console.log('registry OK');
