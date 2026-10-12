// How packs fight: mixed groups (melee chasers and ranged kiters) set on you in the open while you circle slowly.
//   spread   melee monsters within 4 tiles of you: the widest gap between the directions they are at (degrees,
//            averaged over time). 360 = all on one spot; with 4 in a perfect ring it is 90. Lower is better.
//   behind   share of the time a ranged monster stands further from you than the nearest melee ally (higher is better)
//   overlap  share of frames with two of them overlapping by more than half their size
//   node tools/audit_groups.mjs
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
let RNG = 21; Math.random = () => ((RNG = (RNG * 1103515245 + 12345) % 2147483648) / 2147483648);
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { isSolid } = await import('../src/world/maps.js');
const { R: GR } = await import('../src/util.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const PACKS = [
  { name: 'orcs', melee: ['orc_brute', 'orc_brute', 'orc_warlord', 'orc_brute'], ranged: ['goblin_shaman', 'bandit_archer'] },
  { name: 'wolves', melee: ['bramble_wolf', 'bramble_wolf', 'rime_wolf', 'quartz_jackal'], ranged: ['forest_druid'] },
  { name: 'undead', melee: ['blood_thrall', 'drowned_thrall', 'fallen_knight', 'haunted_armor'], ranged: ['drowned_acolyte', 'void_acolyte'] },
  { name: 'knights', melee: ['barnacle_knight', 'glass_knight', 'hollow_thane', 'wolf_shield'], ranged: ['frost_skald', 'prayer_monk', 'saga_singer'] },
];
const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
g.newCharacter('priest'); g.persist = () => {}; g.god = true; g.enter('realm');
let home = null;
for (let k = 0; k < 20000 && !home; k++) {
  const x = 40 + Math.floor(Math.random() * (g.map.w - 80)), y = 40 + Math.floor(Math.random() * (g.map.h - 80));
  let ok = true; for (let dy = -12; dy <= 12 && ok; dy++) for (let dx = -12; dx <= 12 && ok; dx++) if (isSolid(g.map, x + dx + 0.5, y + dy + 0.5)) ok = false;
  if (ok) home = [x + 0.5, y + 0.5];
}
const p = g.player, out = [];
for (const P of PACKS) {
  GR.seed(5); RNG = 21;
  g.enemies = g.map.enemies = []; g.projectiles = [];
  const [cx, cy] = home; p.x = cx; p.y = cy;
  const make = (id, k, n, r) => { const a = 0.4 + (k / n) * 1.2, e = g.addEnemy(id, cx + Math.cos(a) * r, cy + Math.sin(a) * r); e.seen = true; return e; };   // all start on one side
  const melee = P.melee.map((id, k) => make(id, k, P.melee.length, 7)), ranged = P.ranged.map((id, k) => make(id, k, P.ranged.length, 9)), all = [...melee, ...ranged];
  let gapSum = 0, gapN = 0, behind = 0, rangedN = 0, over = 0, frames = 0, t = 0;
  for (let f = 0; f < 20 * 60; f++) {
    t += 1 / 60; p.x = cx + Math.cos(t * 0.3) * 2; p.y = cy + Math.sin(t * 0.3) * 2; p.hp = 1e9; p.dead = false;
    g.enemies = g.map.enemies = g.enemies.filter((q) => all.includes(q));
    g.update(1 / 60);
    if (t < 4) continue;                                          // (time to close in)
    frames++;
    const near = melee.filter((e) => !e.dead && Math.hypot(e.x - p.x, e.y - p.y) < 4).map((e) => Math.atan2(e.y - p.y, e.x - p.x)).sort((a, b) => a - b);
    if (near.length >= 3) { let gap = 0; for (let i = 0; i < near.length; i++) gap = Math.max(gap, ((i + 1 < near.length ? near[i + 1] : near[0] + Math.PI * 2) - near[i])); gapSum += (gap * 180) / Math.PI; gapN++; }
    const md = Math.min(...melee.filter((e) => !e.dead).map((e) => Math.hypot(e.x - p.x, e.y - p.y)));
    for (const r of ranged) if (!r.dead) { rangedN++; if (Math.hypot(r.x - p.x, r.y - p.y) > md) behind++; }
    let o = false; for (let i = 0; i < all.length && !o; i++) for (let j = i + 1; j < all.length && !o; j++) { const a = all[i], b = all[j]; if (Math.hypot(a.x - b.x, a.y - b.y) < (a.D.r + b.D.r) * 0.5) o = true; }
    if (o) over++;
  }
  out.push(`${P.name.padEnd(8)} spread ${gapN ? (gapSum / gapN).toFixed(0).padStart(3) : '  -'}  behind ${rangedN ? ((behind / rangedN) * 100).toFixed(0).padStart(3) : '  -'}%  overlap ${((over / Math.max(1, frames)) * 100).toFixed(0).padStart(3)}%  (melee within 4 tiles in ${((gapN / Math.max(1, frames)) * 100).toFixed(0)}% of frames)`);
}
console.log(out.join('\n'));
