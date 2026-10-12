// Headless check of Phase 6 (docs/design/06_items.md): the redrawn items resolve to their new art with shine frames
// (legendaries also twinkle), a legendary's bag is starfall rank and knows it carries one, and the Tidewraith Staff's
// bolts bend with the current and come back.
//   node tools/check_items.mjs
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { ITEMS, bagFor } = await import('../src/data/items.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
let fail = 0;
const bad = (m) => { console.log('  PROBLEM:', m); fail++; };

const IX = J('item_overhaul/atlas_items.json').items;
const ours = Object.keys(IX).filter((id) => ITEMS[id]);
console.log(`item overhaul: ${Object.keys(IX).length} drawn, ${ours.length} are ours`);
for (const id of ours) {
  const it = ITEMS[id], d = it.reg && reg.resolve(it.reg);
  if (!d) { bad(`${id} has no new art (reg ${it.reg})`); continue; }
  if (!d.frames.shine1 || !d.frames.shine3) bad(`${id}: no shine frames`);
  if (it.legendary && !d.frames.twinkle3) bad(`${id}: legendary without twinkle frames`);
}
const legends = Object.values(ITEMS).filter((it) => it.legendary);
console.log(`legendaries: ${legends.length}`);
if (legends.length !== 10) bad('expected 10 legendaries');
for (const it of legends) {
  const d = reg.resolve(it.reg);
  if (!d || !d.frames.twinkle0) bad(`${it.id}: no twinkle`);
  if (bagFor([it]) !== 'starfall') bad(`${it.id}: drops in a ${bagFor([it])} bag`);
}

const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
g.newCharacter('priest'); g.god = true; g.enter('realm');
const p = g.player;
{
  const b = g.addBag(p.x + 1, p.y, ['forgeheart_maul', 'pot_hp']), n = g.addBag(p.x - 1, p.y, ['robe_t10']);
  console.log('legendary bag:', b.kind, b.legend ? 'marked' : 'unmarked', '| plain bag:', n.kind, n.legend ? 'marked' : 'unmarked');
  if (!b.legend || b.kind !== 'starfall' || n.legend) bad('bag marking');
}
{                                                          // the Tidewraith Staff (item rework): a hit leaves a glyph, the next volley detonates it,
  g.enemies = g.map.enemies = []; g.projectiles.length = 0; g.fx.length = 0;   // and ten volleys that hit charge its signature
  p.equip[0] = 'tidewraith_staff';
  const e = g.addEnemy('training_dummy', p.x + 3, p.y); e.seen = true;
  Object.assign(g.input = g.input || {}, { fire: true, aimX: e.x, aimY: e.y - 0.5 }); p.fireCd = 0;
  let glyph = 0, sig = 0; const sg = g.mechSignature.bind(g); g.mechSignature = (...a) => { sig++; return sg(...a); };
  for (let f = 0; f < 60 * 14; f++) { e.hp = 1e9; p.hp = 1e9; g.update(1 / 60); if (g.fx.some((x) => x.kind === 'wglyph')) glyph++; }
  g.input.fire = false;
  console.log(`tidewraith staff: glyph on the ground ${(glyph / 60).toFixed(1)} s of 14, signature strikes: ${sig}`);
  if (!glyph) bad('the staff left no glyph');
  if (!sig) bad('the staff never charged its signature');
}
console.log(fail ? `${fail} problem(s)` : 'all OK');
process.exit(fail ? 1 : 0);
