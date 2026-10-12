// Performance: how long the game's update takes per frame in its heaviest moments (headless: the simulation only;
// drawing is measured in the browser). A frame at 60 fps has 16.7 ms for everything.
//   node tools/bench.mjs [scenario ...]     node --cpu-prof tools/bench.mjs supernova   (then open the .cpuprofile)
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
let RNG = 3; Math.random = () => ((RNG = (RNG * 1103515245 + 12345) % 2147483648) / 2147483648);
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const fresh = () => { const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 }); g.newCharacter('priest'); g.persist = () => {}; g.god = true; return g; };
function measure(name, g, secs, drive) {
  const p = g.player, times = []; let shots = 0, foes = 0, t = 0;
  for (let f = 0; f < secs * 60; f++) {
    t += 1 / 60; p.hp = 1e9; p.dead = false; drive(t, f);
    const a = performance.now(); g.update(1 / 60); times.push(performance.now() - a);
    shots = Math.max(shots, g.projectiles.length); foes = Math.max(foes, g.enemies.filter((e) => !e.dead).length);
  }
  times.sort((x, y) => x - y);
  const avg = times.reduce((s, v) => s + v, 0) / times.length, q = (k) => times[Math.floor(times.length * k)];
  console.log(`${name.padEnd(26)} avg ${avg.toFixed(2)} ms | p95 ${q(0.95).toFixed(2)} | p99 ${q(0.99).toFixed(2)} | worst ${times[times.length - 1].toFixed(1)} | up to ${shots} shots, ${foes} enemies`);
  return { name, avg, p99: q(0.99), worst: times[times.length - 1] };
}
const S = {
  realm() {                                       // wandering the realm: everything nearby awake
    const g = fresh(); g.enter('realm'); const p = g.player;
    return measure('realm, travelling', g, 40, (t) => { p.x += Math.cos(t * 0.2) * 0.09; p.y += Math.sin(t * 0.13) * 0.09; p.moving = true; });
  },
  crowd() {                                       // a crowd fight: 60 monsters round you
    const g = fresh(); g.enter('realm'); const p = g.player, ids = ['brine_pilgrim', 'bell_taken', 'peat_saint', 'hollow_thane', 'ash_harpy', 'frost_wraith', 'glass_scarab', 'thorn_sprite'];
    for (let k = 0; k < 60; k++) { const a = (k / 60) * Math.PI * 2, e = g.addEnemy(ids[k % ids.length], p.x + Math.cos(a) * (4 + (k % 5)), p.y + Math.sin(a) * (4 + (k % 5))); if (e) e.seen = true; }
    return measure('crowd of 60', g, 30, (t) => { p.x += Math.cos(t) * 0.05; p.moving = true; });
  },
  bosses() {                                      // every modular boss, a minute each, hit steadily
    return Object.keys(BXL).filter((id) => id !== 'grand_orrery').map((id) => {
      const g = fresh(); g.enter(BXL[id].map || 'realm'); g.enemies.length = 0; g.command(`/bx ${id}`);
      const e = g.enemies.find((q) => q.D.bx === id), p = g.player;
      return measure('boss ' + id, g, 60, (t, f) => { p.x = e.x + Math.cos(t * 0.7) * 6; p.y = e.y + Math.sin(t * 0.7) * 5; if (f % 10 === 0 && e.bx && e.bx.state !== 'death') g.damageEnemy(e, Math.round(e.maxHp / 400), e.x, e.y, true); });
    });
  },
  supernova() {                                   // the densest fight in the game (measured only)
    const g = fresh(); g.enter('astral'); const L = g.map.rooms[g.map.rooms.length - 1], p = g.player;
    g.enemies = g.map.enemies = g.enemies.filter((e) => e.rb); const o = g.enemies.find((e) => e.D.bx === 'grand_orrery');
    p.x = L.cx + 0.5; p.y = L.cy + 8; for (let k = 0; k < 240; k++) g.update(1 / 60);
    for (let k = 0; k < 2; k++) { g.damageEnemy(o, Math.ceil(o.maxHp * 0.34) + 50, o.x, o.y, true); for (let f = 0; f < 60 * 12 && !['fight', 'windup', 'release', 'recover'].includes(o.bx.state); f++) { p.dead = false; g.update(1 / 60); } }
    o.bx.finaleDone = true; o.hp = o.maxHp * 0.035; g.bxStartFinale(o, o.bx.B.finale2);
    return measure('Supernova (Orrery)', g, 56, (t) => { p.x = L.cx + 0.5 + Math.cos(t * 0.5) * 9; p.y = L.cy + 0.5 + Math.sin(t * 0.5) * 9; });
  },
};
const { BX: BXL } = await import('../src/bosses/index.js');
const want = process.argv.slice(2).filter((a) => !a.startsWith('-'));
for (const [k, fn] of Object.entries(S)) if (!want.length || want.includes(k)) fn();
