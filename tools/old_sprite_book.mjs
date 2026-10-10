// Writes docs/old_sprites.html: every sprite we made before the Realm Update (the baseline commit), named, grouped,
// and drawn pixel-for-pixel from the original sheets. The sheets are read straight out of git, so the page shows the
// art as it was even where it has since changed or been superseded.
//   node tools/old_sprite_book.mjs [commit]
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const REV = process.argv[2] || '8a276e0';
const blob = (p) => execSync(`git show ${REV}:${p}`, { maxBuffer: 64 << 20 });
const json = (p) => JSON.parse(blob(p).toString('utf8'));
const sheets = {};                                       // name -> data URL
const addSheet = (name, path) => { sheets[name] = 'data:image/png;base64,' + blob(path).toString('base64'); return name; };
const size = (path) => { const b = blob(path); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
const sections = [];
const title = (s) => s.replace(/^rb_|^ow_/, '').split('_').map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');
// a sprite: frames given as [x, y] cells on a sheet of cell size [w, h]
const sprite = (sheet, label, cells, w, h, note = '') => ({ s: sheet, l: label, c: cells, w, h, n: note });

// ---- classes
const CLASSES = { brawler: 'forgefist', forge_knight: 'anvilheart', priest: 'heliarch', summoner: 'reliquarian', harpooner: 'wreckwhaler', duelist: 'mirrorknight',
  stormwright: 'kitehermit', clockmaker: 'horologist', runeblade: 'runeblade', hexweaver: 'hexweaver' };
{
  const list = [];
  for (const [cls, file] of Object.entries(CLASSES)) {
    const base = `art/sprites/player/${cls}/${file}_sheet`, G = json(base + '.json'), sh = addSheet('cls_' + cls, base + '.png'), F = G.frameWidth;
    for (const [an, A] of Object.entries(G.animations)) list.push(sprite(sh, `${title(cls)} · ${an.replace(/_/g, ' ')}`, Array.from({ length: A.frames }, (_, k) => [A.col + k, A.row]), F, G.frameHeight || F, cls));
  }
  sections.push({ id: 'classes', name: 'Classes', blurb: 'The ten classes, every clip of each (the 8x8 figures, stored doubled). This is the Priest as it was before its redraw.', items: list });
}
// ---- enemies and champions: one row per monster
for (const [id, path, name, blurb] of [['enemies', 'art/sprites/enemies/enemies_sheet', 'Monsters', 'Every monster: walk, tell, attack and death frames.'],
  ['champions', 'art/sprites/enemies/champions_sheet', 'Champions', 'The group leaders and bigger monsters (24x24).']]) {
  const G = json(path + '.json'), sh = addSheet(id, path + '.png'), F = G.frameWidth, list = [];
  const rows = G[id] || G.enemies || G.champions;
  for (const [k, v] of Object.entries(rows)) list.push(sprite(sh, title(k), Array.from({ length: G.columns }, (_, c) => [c, v.row]), F, G.frameHeight || F, v.biome || ''));
  sections.push({ id, name, blurb, items: list });
}
// ---- bosses
{
  const list = [];
  for (const f of ['realm_bosses', 'pack_bosses', 'godheart', 'godking']) {
    const path = `art/sprites/bosses/${f}_sheet`, G = json(path + '.json'), sh = addSheet(f, path + '.png'), F = G.frameWidth;
    for (const [k, v] of Object.entries(G.bosses)) list.push(sprite(sh, title(k), Array.from({ length: G.columns }, (_, c) => [c, v.row]), F, G.frameHeight || F, v.biome || (v.dungeon ? 'dungeon' : f)));
  }
  const path = 'art/sprites/bosses/unstruck_sheet', G = json(path + '.json'), sh = addSheet('unstruck', path + '.png');
  list.push(sprite(sh, 'The Unstruck', Object.values(G.animations).flatMap((A) => A.cells || []).filter((c, i, a) => a.findIndex((q) => q[0] === c[0] && q[1] === c[1]) === i), G.frameWidth, G.frameHeight, 'forge'));
  sections.push({ id: 'bosses', name: 'Bosses', blurb: 'Realm bosses, the dungeon bosses, the Fallen Heart, the Unstruck God and the Unstruck: every frame on their rows.', items: list });
}
// ---- the world atlas: tiles, objects, items, projectiles, decor, landmarks, fx
const W = json('art/world/world.json');
const ranges = (map, total, cols, cell, sh, noteOf = () => '') => {           // index maps: each key runs to the next key's index
  const ent = Object.entries(map).filter(([, v]) => typeof v === 'number').sort((a, b) => a[1] - b[1]), out = [];
  ent.forEach(([k, i], n) => {
    const end = Math.min(n + 1 < ent.length ? ent[n + 1][1] : total, i + 24);
    out.push(sprite(sh, title(k), Array.from({ length: Math.max(1, end - i) }, (_, q) => [(i + q) % cols, Math.floor((i + q) / cols)]), cell, cell, noteOf(k)));
  });
  return out;
};
{
  const sh = addSheet('tiles', 'art/world/tiles.png'), list = [];
  for (const [k, T] of Object.entries(W.tiles)) list.push(sprite(sh, title(k), Array.from({ length: Math.min(24, T.frames * T.variants) }, (_, q) => [(T.i + q) % W.tilesCols, Math.floor((T.i + q) / W.tilesCols)]), 16, 16, `${T.variants} variant${T.variants > 1 ? 's' : ''} × ${T.frames} frame${T.frames > 1 ? 's' : ''}`));
  for (const [k, i] of Object.entries(W.edges || {})) list.push(sprite(sh, title(k) + ' edges', Array.from({ length: 4 }, (_, q) => [(i + q) % W.tilesCols, Math.floor((i + q) / W.tilesCols)]), 16, 16, 'edge blend'));
  sections.push({ id: 'tiles', name: 'Ground tiles', blurb: 'Every ground tile, its variants and animation frames, and the edge blends between lands.', items: list });
}
{
  const [ow, oh] = size('art/world/objects.png'), sh = addSheet('objects', 'art/world/objects.png');
  const total = (ow / 16) * (oh / 16);
  const special = new Set([...Object.keys(W.bags), ...Object.keys(W.portals)]);
  const obj = Object.fromEntries(Object.entries(W.objects).filter(([k]) => !special.has(k)));
  sections.push({ id: 'objects', name: 'Objects', blurb: 'Trees, rocks, props, NPCs, chests, pets and everything else that stands on the ground.', items: ranges({ ...obj, ...Object.fromEntries(Object.entries(W.bags).map(([k, v]) => ['bag_' + k, v])), ...Object.fromEntries(Object.entries(W.portals).map(([k, v]) => ['portal_' + k, v])) }, total, W.objectsCols, 16, sh) });
}
{
  const [iw, ih] = size('art/world/items.png'), sh = addSheet('items', 'art/world/items.png');
  sections.push({ id: 'items', name: 'Items', blurb: 'Each weapon, ability and armour type across its tiers (left to right, tier 0 up), rings, potions, eggs, keys and the rest.', items: ranges(W.items, (iw / 16) * (ih / 16), W.itemsCols, 16, sh) });
}
{
  const [pw, ph] = size('art/world/projectiles.png'), sh = addSheet('projectiles', 'art/world/projectiles.png');
  sections.push({ id: 'projectiles', name: 'Projectiles', blurb: 'Every shot sprite, players\' and monsters\', with its animation frames.', items: ranges(W.projectiles, (pw / W.proj) * (ph / W.proj), W.projCols, W.proj, sh) });
}
{
  const sh = addSheet('decor', 'art/world/decor.png'), list = [];
  for (const [k, i] of Object.entries(W.decor)) list.push(sprite(sh, title(k), Array.from({ length: (W.decorAnim || {})[k] || 1 }, (_, q) => [(i + q) % W.decorCols, Math.floor((i + q) / W.decorCols)]), 16, 16, Object.keys(W.decorBiome || {}).find((b) => W.decorBiome[b].includes(k)) || ''));
  sections.push({ id: 'decor', name: 'Ground decor', blurb: 'The little things scattered on the ground of each land.', items: list });
}
{
  const sh = addSheet('landmarks', 'art/world/landmarks.png'), [lw] = size('art/world/landmarks.png'), C = lw / W.landmarksCols, list = [];
  for (const [k, L] of Object.entries(W.landmarks)) list.push(sprite(sh, title(k), Array.from({ length: L.frames }, (_, q) => [(L.i + q) % W.landmarksCols, Math.floor((L.i + q) / W.landmarksCols)]), C, C, L.biome));
  sections.push({ id: 'landmarks', name: 'Landmarks', blurb: 'The big set pieces (32x32): whale skulls, the god hand, the town\'s buildings.', items: list });
}
{
  const sh = addSheet('fx', 'art/world/fx.png'), list = [];
  for (const [k, F] of Object.entries(W.fx)) list.push(sprite(sh, title(k), Array.from({ length: F.n }, (_, q) => [(F.i + q) % W.fxCols, Math.floor((F.i + q) / W.fxCols)]), 16, 16));
  sections.push({ id: 'fx', name: 'Effects', blurb: 'Hit sparks, death poofs, the level-up ring.', items: list });
}

const count = sections.reduce((n, s) => n + s.items.length, 0);
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Realm's Original Sprites</title>
<style>
:root { --bg: #f4f1ea; --card: #ffffff; --ink: #1d1a24; --mut: #6a6478; --line: #e2ddd2; --well: #2a2734; --acc: #b5791f; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #14121a; --card: #1e1b26; --ink: #ece8f4; --mut: #9a94aa; --line: #2e2a38; --well: #0f0d14; --acc: #f2c14e; } }
:root[data-theme="dark"] { --bg: #14121a; --card: #1e1b26; --ink: #ece8f4; --mut: #9a94aa; --line: #2e2a38; --well: #0f0d14; --acc: #f2c14e; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.45 system-ui, -apple-system, 'Segoe UI', sans-serif; }
header { padding: 28px 16px 12px; max-width: 1200px; margin: 0 auto; }
h1 { margin: 0 0 4px; font-size: 26px; letter-spacing: .2px; }
header p { margin: 0; color: var(--mut); max-width: 760px; }
nav { position: sticky; top: 0; z-index: 2; background: var(--bg); border-bottom: 1px solid var(--line); }
nav .in { max-width: 1200px; margin: 0 auto; padding: 10px 16px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
nav a { color: var(--ink); text-decoration: none; padding: 4px 10px; border: 1px solid var(--line); border-radius: 999px; font-size: 13px; background: var(--card); }
nav a:hover { border-color: var(--acc); }
nav input { margin-left: auto; min-width: 180px; flex: 1 1 180px; max-width: 280px; padding: 6px 10px; border-radius: 8px; border: 1px solid var(--line); background: var(--card); color: var(--ink); font: inherit; }
nav label { font-size: 13px; color: var(--mut); display: flex; gap: 6px; align-items: center; }
main { max-width: 1200px; margin: 0 auto; padding: 8px 16px 48px; }
section { margin-top: 28px; }
section h2 { font-size: 19px; margin: 0 0 2px; }
section > p { margin: 0 0 12px; color: var(--mut); font-size: 14px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
.well { background: var(--well); padding: 10px; display: flex; flex-wrap: wrap; gap: 4px; align-items: flex-end; min-height: 64px; }
.well canvas { image-rendering: pixelated; image-rendering: crisp-edges; }
.cap { padding: 7px 10px 8px; }
.cap b { display: block; font-size: 13.5px; font-weight: 600; overflow-wrap: anywhere; }
.cap span { color: var(--mut); font-size: 12px; }
.hide { display: none !important; }
</style></head><body>
<header><h1>Realm's original sprites</h1>
<p>Every sprite we made before the Realm Update art was added (from commit <code>${REV}</code>), ${count} in all, drawn pixel for pixel from the original sheets and named as the game names them. Each card shows all of a sprite's frames or variants, left to right.</p></header>
<nav><div class="in">${sections.map((s) => `<a href="#${s.id}">${s.name} <span style="color:var(--mut)">${s.items.length}</span></a>`).join('')}
<label>zoom <select id="zoom"><option value="2">2×</option><option value="3" selected>3×</option><option value="4">4×</option></select></label>
<input id="q" type="search" placeholder="Find a sprite…" aria-label="Find a sprite"></div></nav>
<main>${sections.map((s) => `<section id="${s.id}"><h2>${s.name}</h2><p>${s.blurb}</p><div class="grid" data-sec="${s.id}"></div></section>`).join('')}</main>
<script>
const SHEETS = ${JSON.stringify(sheets)};
const SECTIONS = ${JSON.stringify(sections.map((s) => ({ id: s.id, items: s.items })))};
const imgs = {};
const load = (k) => imgs[k] || (imgs[k] = new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = SHEETS[k]; }));
let Z = 3;
try { Z = +(localStorage.getItem('oldsprites.zoom') || 3); } catch (e) {}
document.getElementById('zoom').value = String(Z);
async function draw() {
  for (const S of SECTIONS) {
    const grid = document.querySelector('[data-sec="' + S.id + '"]'); grid.innerHTML = '';
    for (const it of S.items) {
      const img = await load(it.s), card = document.createElement('div'); card.className = 'card'; card.dataset.k = (it.l + ' ' + it.n).toLowerCase();
      const well = document.createElement('div'); well.className = 'well';
      const z = it.w >= 48 ? Math.max(1, Z - 1) : Z;
      for (const [cx, cy] of it.c) {
        const cv = document.createElement('canvas'); cv.width = it.w; cv.height = it.h; cv.style.width = it.w * z + 'px'; cv.style.height = it.h * z + 'px';
        const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(img, cx * it.w, cy * it.h, it.w, it.h, 0, 0, it.w, it.h);
        well.appendChild(cv);
      }
      const cap = document.createElement('div'); cap.className = 'cap'; cap.innerHTML = '<b></b><span></span>';
      cap.firstChild.textContent = it.l; cap.lastChild.textContent = it.n || '';
      card.append(well, cap); grid.appendChild(card);
    }
  }
  filter();
}
function filter() {
  const q = document.getElementById('q').value.trim().toLowerCase();
  document.querySelectorAll('.card').forEach((c) => c.classList.toggle('hide', !!q && !c.dataset.k.includes(q)));
  document.querySelectorAll('section').forEach((s) => s.classList.toggle('hide', !!q && !s.querySelector('.card:not(.hide)')));
}
document.getElementById('q').addEventListener('input', filter);
document.getElementById('zoom').addEventListener('change', (e) => { Z = +e.target.value; try { localStorage.setItem('oldsprites.zoom', Z); } catch (err) {} draw(); });
draw();
</script></body></html>`;
writeFileSync(new URL('../docs/old_sprites.html', import.meta.url), html);
console.log('wrote docs/old_sprites.html:', count, 'sprites in', sections.length, 'sections,', Math.round(html.length / 1024), 'KB');
