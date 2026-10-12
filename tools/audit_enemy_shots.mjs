// Enemy shots against the art standard's scale rule: every shot each enemy and boss actually fires (they fight a
// while, hit steadily so bosses move through their patterns), with the scale it is drawn at. A pixel-art shot drawn at
// a fraction (0.73x, 1.3x) has uneven pixels, some one screen pixel wide and some two; the exact scales are 1x and 2x
// for atlas shots and 0.5x or 1x for pack art (stored at two). Also flags shots too small to read (under 5 px) and
// any longer than two tiles. (The Grand Orrery is left out by request.)
//   node tools/audit_enemy_shots.mjs [id ...]      --all to list every shot, not only the problems;
//   --grow also lists shots drawn 30% or more off the size their attack asks for (the snap to whole pixels)
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
Date.now = () => 1.7e12;
let RNG = 7; Math.random = () => ((RNG = (RNG * 1103515245 + 12345) % 2147483648) / 2147483648);
const { buildRegistry } = await import('../src/registry.js');
const { Game, shotScaleRaw } = await import('../src/game.js');
const { BX } = await import('../src/bosses/index.js');
const { ENEMIES } = await import('../src/data/enemies.js');
const { SHOT_BOXES } = await import('../src/data/shot_boxes.js');
const { R: GR } = await import('../src/util.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const W = JSON.parse(readFileSync(new URL('../art/world/world.json', import.meta.url), 'utf8')), BIG = new Set(W.projBig || []);
const SKIP = new Set(['grand_orrery']);
const only = process.argv.slice(2).filter((a) => !a.startsWith('--')), all = process.argv.includes('--all');
let SEED = 0;
const fresh = () => { RNG = 7 + SEED * 13; GR.seed(101 + SEED++); const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 }); g.newCharacter('priest'); g.persist = () => {}; return g; };
const seen = new Map();                                   // sprite|size -> what it looks like on screen, and who fires it
const shoot0 = Game.prototype.shoot;
Game.prototype.shoot = function (from, ...rest) {
  const b = shoot0.call(this, from, ...rest);
  if (from === 'e' && b && b.sprite) {
    const key = b.sprite + '|' + b.r;
    let s = seen.get(key);
    if (!s) {
      const B = SHOT_BOXES[b.sprite], pack = b.sprite.includes('/');
      const px = pack ? 2 * (b.k || 1) : (BIG.has(b.sprite) ? 1.3 : 1) * (b.k || 1);   // screen pixels per art pixel
      const art = B ? (pack && B[6] >= 1 ? 0.5 : 1) : 1;                               // SHOT_BOXES is in buffer pixels: pack art counts double
      s = { sprite: b.sprite, size: b.r, px: +px.toFixed(3), len: B ? Math.round(B[0] * (b.k || 1) * (pack ? 1 : (BIG.has(b.sprite) ? 1.3 : 1))) : null,
        thick: B ? Math.round(B[1] * (b.k || 1) * (pack ? 1 : (BIG.has(b.sprite) ? 1.3 : 1))) : null, artLen: B ? Math.round(B[0] * art) : null, by: new Set(),
        grow: Math.round(((b.k || 1) / shotScaleRaw(b.sprite, b.r) - 1) * 100) };   // how much bigger (or smaller) than its attack's size asks
      seen.set(key, s);
    }
    s.by.add(this.auditWho || b.by || '?');
  }
  return b;
};
function fight(g, e, secs) {
  const p = g.player;
  let t = 0;
  for (let f = 0; f < secs * 60; f++) {
    t += 1 / 60; p.hp = 1e9; p.dead = false;
    if (g.enemies.length > 1 || g.enemies[0] !== e) g.enemies = g.map.enemies = g.enemies.filter((q) => q === e);
    p.x = e.x + Math.cos(t * 0.6) * 6; p.y = e.y + Math.sin(t * 0.6) * 5; p.moving = true;
    g.update(1 / 60);
    if (f % 12 === 0 && !e.dead && e.bx && !['death', 'morph', 'finale'].includes(e.bx.state)) g.damageEnemy(e, Math.round(e.maxHp / 160), e.x, e.y, true);
    if (e.dead) break;
  }
}
for (const id of Object.keys(BX)) {
  if (SKIP.has(id) || (only.length && !only.includes(id))) continue;
  const g = fresh(); g.enter(BX[id].map || 'realm'); g.enemies.length = 0; g.command(`/bx ${id}`);
  const e = g.enemies.find((q) => q.D.bx === id);
  if (!e) continue;
  g.auditWho = 'boss ' + id; fight(g, e, 40);
}
for (const [id, D] of Object.entries(ENEMIES)) {
  if (D.bx || D.dummy || !(D.attacks && D.attacks.length) || (only.length && !only.includes(id))) continue;
  const g = fresh(); g.enter('realm'); g.enemies.length = 0;
  const e = g.addEnemy(id, g.player.x + 5, g.player.y);
  if (!e) continue;
  e.seen = true; g.auditWho = id; fight(g, e, 8);
}
const exact = (s) => (s.sprite.includes('/') ? [1, 2].includes(s.px) : [1, 2].includes(s.px));
const growMode = process.argv.includes('--grow');
const L = [...seen.values()].map((s) => ({ ...s, why: [growMode && Math.abs(s.grow) >= 30 ? `${s.grow > 0 ? '+' : ''}${s.grow}% from its attack size` : '', !exact(s) ? `drawn at ${s.px}x screen px per art px (uneven pixels)` : '', s.len !== null && s.len < 5 ? `only ${s.len} px long` : '', s.len !== null && s.len > 32 ? `${s.len} px long (over two tiles)` : ''].filter(Boolean).join('; ') }));
const bad = L.filter((s) => s.why);
for (const s of (all ? L : bad).sort((a, b) => a.sprite.localeCompare(b.sprite) || a.size - b.size)) {
  console.log(`${s.sprite.padEnd(40)} size ${String(s.size).padEnd(5)} ${String(s.len).padStart(3)}x${String(s.thick).padEnd(3)} px  ${s.why || 'ok'}  [${[...s.by].slice(0, 4).join(', ')}${s.by.size > 4 ? ` +${s.by.size - 4}` : ''}]`);
}
const sprites = new Set(L.map((s) => s.sprite)), badSprites = new Set(bad.map((s) => s.sprite));
console.log(`${L.length} enemy shot kinds (${sprites.size} sprites) fired; ${bad.length} off the standard (${badSprites.size} sprites)`);
