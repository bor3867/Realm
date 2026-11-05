// The boss sandbox (2026-11-04: the user designs boss fights with another Claude instance as an artifact; this gives it the
// game's own boss engine, so whatever it builds drops back into the game). One self-contained HTML file:
//   the engine copy (tools/boss_sandbox/engine.js), the page (tools/boss_sandbox/shell.html), the game's own boss files
//   (src/bosses/kit.js, jarl_court.js and each boss, wrapped one to a block, their imports taken out), the game's own
//   art (the bosses' atlases, embedded), and the Jarls' Court as the castle builds it (its walls tile for tile).
//   node tools/build_boss_sandbox.mjs        -> art/export/boss_sandbox/boss_sandbox.html
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const root = new URL('../', import.meta.url), R = (p) => readFileSync(new URL(p, root), 'utf8');
const BOSSES = [['jarl_warrior', 'src/bosses/jarl_warrior.js'], ['jarl_wizard', 'src/bosses/jarl_wizard.js']];
const ATLAS = ['art/bundle/throne/atlas_jarl_warrior.json', 'art/bundle/throne/atlas_jarl_wizard.json'];

// the game's own code: the shared helpers as they are (globals), each boss in a block of its own
const strip = (s) => s.split('\n').filter((l) => !/^import\s/.test(l)).join('\n');
const shared = ['src/bosses/kit.js', 'src/bosses/jarl_court.js'].map((f) => `// ---- ${f} (shared helpers, as in the game)\n` + strip(R(f)).replace(/^export (const|function|let) /gm, '$1 ')).join('\n');
const bossCode = BOSSES.map(([id, f]) => {
  const src = strip(R(f)); if (!/^export default \{/m.test(src)) throw new Error(f + ': no export default {');
  return `// ======================================== BOSS: ${id}   (${f}: edit from here ...)\nBOSSES['${id}'] = (() => {\n${src.replace(/^export default \{/m, 'return {')}\n})();\n// ======================================== (... to here: ${id})`;
}).join('\n\n');

// the art: every sheet of each boss's atlas, its image embedded
const atlases = [];
for (const a of ATLAS) {
  const J = JSON.parse(R(a)), dir = a.slice(0, a.lastIndexOf('/') + 1);
  for (const [sheet, S] of Object.entries(J.sheets)) atlases.push({ png: 'data:image/png;base64,' + readFileSync(new URL(dir + S.image, root)).toString('base64'), sheets: { [sheet]: S } });
}

// the room: the Jarls' Court as the castle builds it (seed 4), its walls and floor, the court's box, a start south of it
const { buildRegistry } = await import(new URL('src/registry.js', root));
const { Game } = await import(new URL('src/game.js', root));
const B0 = new URL('art/bundle/', root), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((q) => ({ pack: q.split('/')[0], json: J(q) })), J(idx.hover), (q) => q);
const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
g.newCharacter('priest'); g.persist = () => {}; g.mode = 'play'; g.enter('throne', { seed: 4 });
const m = g.map, n = m.castle.rooms.a26, M = 4, ox = n.x - M, oy = n.y - M, w = n.w + M * 2, h = n.h + M * 2 + 6;
const solid = []; for (let y = 0; y < h; y++) { let r = ''; for (let x = 0; x < w; x++) { const X = ox + x, Y = oy + y; r += X < 0 || Y < 0 || X >= m.w || Y >= m.h || m.solid[Y * m.w + X] ? '#' : '.'; } solid.push(r); }
let start = [n.x - ox + n.w / 2, n.y - oy + n.h + 3];
for (let k = 0; k < 8 && solid[Math.floor(start[1])][Math.floor(start[0])] === '#'; k++) start[1] -= 1;
const ROOM = { w, h, solid, room: { x: n.x - ox, y: n.y - oy, w: n.w, h: n.h }, start: [start[0] + 0.5, start[1] + 0.5] };

const page = R('tools/boss_sandbox/shell.html')
  .replace('/*__ENGINE__*/', () => R('tools/boss_sandbox/engine.js') + '\n' + shared)
  .replace('/*__BOSSCODE__*/', () => bossCode)
  .replace('/*__ATLASES__*/', () => JSON.stringify(atlases))
  .replace('/*__ROOM__*/', () => JSON.stringify(ROOM))
  .replace('__BUILT__', () => new Date().toISOString().slice(0, 10));
mkdirSync(new URL('art/export/boss_sandbox/', root), { recursive: true });
writeFileSync(new URL('art/export/boss_sandbox/boss_sandbox.html', root), page);
console.log('art/export/boss_sandbox/boss_sandbox.html', (page.length / 1024).toFixed(0) + ' KB;', BOSSES.map((b) => b[0]).join(', '), '| room', w + 'x' + h);
