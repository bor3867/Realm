// Realm bosses against characters geared for where they live (2026-10-31, the user: "test realm bosses against
// appropriately geared characters to ensure encounters feel challenging, fair, and rewarding").
// A Priest geared for each land (its wand and robe at the land's tier, its stats part way to their caps) fights alone:
// it keeps about 6 tiles from the boss, fires at it without pause, and steps aside from the nearest shot coming at it
// (a fair, plain player: no better than a human). Each fight runs until the boss dies or 6 minutes pass. A death puts
// it back on its feet at full Life and is counted. Reported: time to kill, deaths, and the damage it took a minute as
// a share of its Life.
//   node tools/sim_realm_fights.mjs [id ...] [--by]     (--by: what its damage came from)
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
let RNG = 9; Math.random = () => ((RNG = (RNG * 1103515245 + 12345) % 2147483648) / 2147483648);
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { REALM_BOSSES, ENEMIES } = await import('../src/data/enemies.js');
const { CLASSES, STATS } = await import('../src/data/classes.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
// the gear a player has by the time they face what lives in each land: [weapon/armour tier, ability, ring, stat share]
const GEAR = { shore: [4, 2, 1, 0.35], lowlands: [5, 2, 1, 0.45], fen: [7, 3, 2, 0.55], dunes: [7, 3, 2, 0.55], thornwood: [8, 3, 2, 0.6],
  runeholt: [10, 4, 3, 0.75], steppe: [10, 4, 3, 0.75], godfall: [12, 5, 4, 0.9] };
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const heralds = Object.keys(ENEMIES).filter((k) => ENEMIES[k].herald);
const ids = only.length ? only : [...heralds, ...Object.keys(REALM_BOSSES), 'abyssal_kraken', 'thornheart_treant'];
const C = CLASSES.priest;
for (const id of ids) {
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.persist = () => {}; g.enter('realm'); g.enemies = g.map.enemies = [];
  const p = g.player, I = g.input;
  let e;
  if (ENEMIES[id] && ENEMIES[id].herald) { const D = ENEMIES[id]; e = g.addEnemy(id, p.x, p.y); e.herald = true; }
  else if (/kraken|treant/.test(id)) e = g.spawnEventBoss(id, false);
  else e = g.spawnRealmBoss(id);
  if (!e) { console.log(id, 'did not spawn'); continue; }
  const biome = e.D.biome && GEAR[e.D.biome] ? e.D.biome : /kraken/.test(id) ? 'shore' : /treant/.test(id) ? 'thornwood' : id === 'the_fallen_star' ? 'godfall' : 'fen';
  const [T, AT, RT, share] = GEAR[biome];
  p.equip = [`wand_t${T}`, `halo_t${AT}`, `robe_t${T}`, `ring_hp_t${RT}`];
  for (const s of STATS) p.base[s] = Math.round(C.base[s] + (C.max[s] - C.base[s]) * share);
  if (ENEMIES[id] && ENEMIES[id].herald) { const a = Math.random() * 6.28; p.x = e.x + Math.cos(a) * 6; p.y = e.y + Math.sin(a) * 6; g.unstick(p); }
  else if (e.home) { p.x = e.home.x; p.y = e.home.y + 6; g.unstick(p); } else { p.x = e.x; p.y = e.y + 6; g.unstick(p); }
  e.seen = true; if (e.state === 'sleep') e.state = 'idle';
  const maxHp = g.stat('hp'); p.hp = maxHp;
  let deaths = 0, taken = 0, t = 0;
  const by = {}; const hurt = g.hurtPlayer.bind(g); g.hurtPlayer = (d, ...r) => { const h0 = p.hp; const out = hurt(d, ...r); const k = Math.max(0, h0 - p.hp); taken += k; by[r[0] || '?'] = (by[r[0] || '?'] || 0) + k; return out; };
  for (let f = 0; f < 60 * 360 && !e.dead; f++) {
    t += 1 / 60;
    if (p.dead || p.hp <= 0) { deaths++; p.dead = false; p.hp = maxHp; p.status.invuln = 2; g.mode = 'play'; }
    // the player: fire at the boss, keep about 6 tiles, step aside from the nearest shot coming at it
    const [bx, by] = g.up(e.x, e.y, e.hitUp || 1);
    I.aimX = bx; I.aimY = by; I.fire = true;
    let best = null, bd = 2.4;
    for (const b of g.projectiles) { if (b.from !== 'e') continue; const d = Math.hypot(b.x - p.x, b.y - p.y); if (d < bd && (b.vx * (p.x - b.x) + b.vy * (p.y - b.y)) > 0) { bd = d; best = b; } }
    let mx, my;
    if (best) { const s = Math.hypot(best.vx, best.vy) || 1; mx = -best.vy / s; my = best.vx / s; if ((p.x - best.x) * mx + (p.y - best.y) * my < 0) { mx = -mx; my = -my; } }
    else { const d = Math.hypot(p.x - e.x, p.y - e.y) || 1, a = Math.atan2(p.y - e.y, p.x - e.x) + 0.5; mx = e.x + Math.cos(a) * 6 - p.x; my = e.y + Math.sin(a) * 6 - p.y; void d; }
    I.up = my < -0.2 ? 1 : 0; I.down = my > 0.2 ? 1 : 0; I.left = mx < -0.2 ? 1 : 0; I.right = mx > 0.2 ? 1 : 0;
    if (p.hp < maxHp * 0.4 && p.mp > 80 && !(p.abilityT > 0)) g.useAbility();   // (the Priest's heal)
    g.update(1 / 60);
  }
  const mins = t / 60;
  console.log(`${id.padEnd(20)} ${biome.padEnd(9)} T${String(T).padEnd(2)} life ${String(e.maxHp).padStart(6)}  ${e.dead ? 'killed in ' + t.toFixed(0).padStart(3) + 's' : 'ALIVE after 6 min (' + Math.round(100 * e.hp / e.maxHp) + '% left)'}  deaths ${deaths}  took ${Math.round(taken / mins / maxHp * 100)}% of its Life a minute (max ${maxHp})`);
  if (process.argv.includes('--by')) console.log('   from:', Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k} ${Math.round(100 * v / taken)}%`).join(', '));
}
