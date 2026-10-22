// Does every enemy shot that reaches you hurt you? (2026-10-22: the user found most enemy shots doing nothing.)
// Every monster with an attack and every three-phase boss fires at a level-20 priest standing still, 4 tiles off
// (bosses 6), Defense 0. A shot "reaches" you when its centre comes within 0.1 tiles of your body (the line from your
// feet to your head, as the game lifts it). Each such shot must be taken (gone, with a hurt for at least 1 Life);
// a shot that reaches you and flies on, or is taken for nothing, is a miss. Lists every attacker with a miss.
//   node tools/check_enemy_hits.mjs [id ...]          (--bosses: the bosses only; --mobs: the monsters only)
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { Game, HITBOX } = await import('../src/game.js');
const { ENEMIES } = await import('../src/data/enemies.js');
const { BX, bxEnemyDef } = await import('../src/bosses/index.js');
const { isSolid } = await import('../src/world/maps.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const args = process.argv.slice(2), only = args.filter((a) => !a.startsWith('--'));
const mobs = !args.includes('--bosses'), bosses = !args.includes('--mobs');
const seg = (px, py, ax, ay, bx, by) => { const vx = bx - ax, vy = by - ay, L = vx * vx + vy * vy || 1, t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / L)); return Math.hypot(ax + vx * t - px, ay + vy * t - py); };
function run(id, boss) {
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.persist = () => {}; g.gainXp(999999);
  g.enter('realm'); g.enemies = g.map.enemies = []; g.maintainRealm = () => {}; g.eventClock = () => {};
  const p = g.player; p.equip[2] = null; p.equip[3] = null;
  const R0 = boss ? 6 : 4;
  let at = null;                                           // open ground round the player
  for (let tries = 0; tries < 400 && !at; tries++) {
    const x = 30 + Math.random() * (g.map.w - 60), y = 30 + Math.random() * (g.map.h - 60);
    let ok = true;
    for (let dx = -8; dx <= 8 && ok; dx++) for (let dy = -8; dy <= 8 && ok; dy++) if (isSolid(g.map, x + dx, y + dy)) ok = false;
    if (ok) at = { x, y };
  }
  p.x = at.x; p.y = at.y;
  const e = boss ? g.spawnRealmBoss(id, { x: p.x, y: p.y - R0 }, bxEnemyDef(id)) : g.addEnemy(id, p.x, p.y - R0);
  if (!e) return null;
  e.seen = true; e.dmgMult = undefined;
  let hurts = 0, nothing = 0, reached = 0, passed = 0;
  const h0 = g.hurtPlayer.bind(g);
  g.hurtPlayer = function (d, by, ap) { const hp = p.hp; h0(d, by, ap); if (p.hp < hp) hurts++; else nothing++; p.hp = 1e6; };
  p.hp = 1e6;
  const T = boss ? 14 : 5, dt = 1 / 60;
  const prev = new Map();                                  // shot -> where it was last frame
  for (let t = 0; t < T; t += dt) {
    p.x = at.x; p.y = at.y; p.status.invuln = 0; p.dead = false; g.mode = 'play'; g.input.fire = false;
    if (boss && e.bx && e.bx.state === 'sleep') e.bx.state = 'fight';
    const [fx, fy] = g.up(p.x, p.y, HITBOX.foot), [hx, hy] = g.up(p.x, p.y, HITBOX.head);
    const before = g.projectiles.filter((b) => b.from === 'e');
    for (const b of before) prev.set(b, [b.x, b.y]);
    g.update(dt);
    const live = new Set(g.projectiles);
    for (const b of before) {
      if (b.counted || b.ghost || b.harmless || b.hidden || b.lob || !live.has(b)) continue;   // (a lobbed shot flies over you to where it lands)
      const [x0, y0] = prev.get(b);                        // its path this frame, swept: did it cross your body's middle?
      let d = 9;
      for (let k = 0; k <= 8; k++) { const u = k / 8; d = Math.min(d, seg(x0 + (b.x - x0) * u, y0 + (b.y - y0) * u, fx, fy, hx, hy)); }
      if (d < 0.1) { b.counted = true; reached++; passed++; (run.through = run.through || new Set()).add(b.sprite); }   // it crossed you and flew on
    }
    for (const b of before) if (!live.has(b) && !b.counted) {   // gone: was it taken by you?
      const [x0, y0] = prev.get(b); let d = 9;
      for (let k = 0; k <= 8; k++) { const u = k / 8; d = Math.min(d, seg(x0 + (b.x - x0) * u, y0 + (b.y - y0) * u, fx, fy, hx, hy)); }
      if (d < 0.6) { b.counted = true; reached++; }
    }
    if (e.dead) break;
  }
  return { id, reached, passed, hurts, nothing };
}
const ids = [...(mobs ? Object.keys(ENEMIES).filter((k) => (ENEMIES[k].attacks || []).length && !ENEMIES[k].dummy) : []).map((k) => [k, false]),
  ...(bosses ? Object.keys(BX).filter((k) => k !== 'framework_test').map((k) => [k, true]) : [])].filter(([k]) => !only.length || only.includes(k));
const bad = []; let reachedAll = 0, hurtsAll = 0, n = 0;
for (const [id, boss] of ids) {
  let r = null;
  try { r = run(id, boss); } catch (err) { bad.push(`${id}: threw ${err.message}`); continue; }
  if (!r) continue;
  n++; reachedAll += r.reached; hurtsAll += r.hurts;
  if (r.passed || r.nothing) bad.push(`${id}: ${r.passed} flew through you (${[...(run.through || [])].join(", ")}), ${r.hurts} hurt, ${r.nothing} taken for nothing`); run.through = null;
}
console.log(`${n} attackers: ${reachedAll} shots reached the player, ${hurtsAll} hurt`);
console.log(bad.length ? 'PROBLEMS:\n  ' + bad.join('\n  ') : 'every shot that reached the player hurt');
process.exit(bad.length ? 1 : 0);
