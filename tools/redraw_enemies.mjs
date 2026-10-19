// The enemy sizing pass, second round (docs/overhaul_checklist.md): the 8x8 monsters that stand bigger than the small
// fry, redrawn by hand at 12x12 and drawn at the player's pixel size (two screen pixels to an art pixel), so they are
// half again as tall with real new detail, the same chunky pixels and the same outline as everyone around them (a
// mechanical upscale only smoothed the old pixels, and drawing it finer thinned its outline). Each keeps its colours and
// its look; each has its clips: two to move, one to attack, one to be hurt (the hurt frame is the move frame, pale).
//   art/bundle/resized/rs_enemies.png + atlas_resized.json      ('rs_enemies/<id>')
//   node tools/redraw_enemies.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { writePng } from './png.mjs';
const B0 = new URL('../art/bundle/', import.meta.url), idx = JSON.parse(readFileSync(new URL('index.json', B0), 'utf8'));
// base: the first move frame; move2 / attack: rows replaced (row index -> new row); extra: [x, y, ch] dots
const ART = {
  scarecrow: {                                     // the Field Warden: hat, stitched burlap face, straw arms on its pole
    pal: { H: '#5a3a1e', h: '#7a5230', S: '#f0c860', s: '#c89838', F: '#d8b070', f: '#b08850', E: '#1a1018', C: '#a86a3a', c: '#7a4a28', P: '#4a7a3a', W: '#6a4a2a', R: '#ff4030' },
    base: ['...HHHHHH...', '..HhhhhhhH..', 'HHHHHHHHHHHH', '...FFFFFF...', '...FEFFEF...', '...FfEEfF...', 'SSsCCCCCCsSS', 'S..CcPPcC..S', '...CcPPcC...', '...CCccCC...', '...sSWWSs...', '.....WW.....'],
    move2: { 6: '..sCCCCCCs..', 7: 'SS.CcPPcC.SS' },
    attack: { 4: '...FRFFRF...', 5: '...FEEEEF...', 6: 'SSsCCCCCCsSS', 7: 'S..CcPPcC..S' } },
  sporeling_clump: {                               // a clump of glowing-gilled toadstools on stubby feet
    pal: { M: '#b048d0', m: '#7a2a90', L: '#f0c8ff', Y: '#f8ff90', B: '#e8dcb8', b: '#b0a078', E: '#1a1018', G: '#7aa020' },
    base: ['...MMMMMM...', '..MMLMMLMM..', '.MMMMMMMMMm.', 'mmYYYYYYYYmm', '...BBBBBB...', '.M.BEBBEB.M.', 'MLMBBBBBBMLM', 'mmmBbBBbBmmm', '.B.BBBBBB.B.', '.b.bBbbBb.b.', 'GG.BB..BB.GG', '.GGbb..bbGG.'],
    move2: { 10: 'GGBB....BBGG', 11: '.Gbb....bbG.' },
    attack: { 0: 'Y..MMMMMM..Y', 3: 'mmYLYLYLYLmm', 5: '.M.BYBBYB.M.' } },
  vine_lasher: {                                   // a red-petalled maw on a knot of vines
    pal: { P: '#c83050', p: '#ff7090', K: '#1a1018', T: '#f8f0e0', V: '#3a8a3a', v: '#1a5a2a', L: '#6ac040' },
    base: ['.pP..PP..Pp.', 'pPPPpPPpPPPp', 'PPPKKKKKKPPP', 'PPKTKTTKTKPP', '.PKKKKKKKKP.', '..PPKKKKPP..', '....vVVv....', 'LL..vVVv..LL', '.LLvVvvVvLL.', '...vVVVVv...', '..vvVVVVvv..', '.vv.vVVv.vv.'],
    move2: { 0: '..pP.PP.Pp..', 7: '.L..vVVv..L.', 8: 'LLLvVvvVvLLL' },
    attack: { 1: 'pPPKKKKKKPPp', 2: 'PPKTKTTKTKPP', 3: 'PKKKKKKKKKKP', 4: 'PPKTKTTKTKPP', 5: '.PPPKKKKPPP.' } },
  jackal_warden: {                                 // a jackal-headed tomb guard in blue and gold, spear in hand
    pal: { D: '#2a1e1a', d: '#4a3a30', E: '#ff4a30', G: '#f0c040', g: '#a07818', B: '#2848a0', b: '#5880e0', W: '#f0e4c8', S: '#6a4a2a' },
    base: ['.D....D....G', '.DD..DD....G', '.DDDDDD....S', '.DEdDED....S', '..DDDDdd...S', '..GgGGgG...S', '.BBGBBGBB.WS', '.BbBBBBbB..S', '..WWWWWW...S', '..WgWWgW...S', '..DD..DD...S', '.DDD..DDD..g'],
    move2: { 10: '...DDDD....S', 11: '..DD..DD...g' },
    attack: { 0: '.D....D.....', 1: '.DD..DD.....', 3: '.DWdDWD.....', 5: '..GgGGgG....', 6: '.BBGBBGBBWSG', 7: '.BbBBBBbB...', 8: '..WWWWWW....', 9: '..WgWWgW....', 10: '..DD..DD....', 11: '.DDD..DDD...' } },
  haunted_armor: {                                 // an empty suit of steel, a red glow in the visor and the plume
    pal: { A: '#c8ccd8', a: '#8088a0', k: '#2a2a3a', R: '#ff4050', r: '#a01a30', Y: '#f0c040' },
    base: ['.....rR.....', '....rRRr....', '...aAAAAa...', '...AkRRkA...', '...aAAAAa...', '.aaAYYYYAaa.', 'aAAAAkkAAAAa', 'aA.AAkkAA.Aa', 'kk.YYYYYY.kk', '...AAa.AAa..', '...Aa..Aa...', '..kkk..kkk..'],
    move2: { 9: '...AAaAAa...', 10: '....AaAa....', 11: '...kkkkkk...' },
    attack: { 0: '....rRRr....', 3: '...ARRRRA...', 6: 'aAAAAkkAAAAk', 7: 'aA.AAkkAA.Ak', 8: 'kk.YYYYYY..R' } },
  glacial_sentinel: {                              // a golem of blue ice round a cyan core
    pal: { I: '#d0f0ff', i: '#90c8f0', n: '#405078', C: '#60f0ff', k: '#1a2030', W: '#ffffff' },
    base: ['...iI..Ii...', '..iIIiiIIi..', '.iInnnnnnIi.', '.InkCCCCknI.', '.InnnCCnnnI.', 'iIiiIIIIiiIi', 'In.iiIIii.nI', 'nn.iIiiIi.nn', '...nnnnnn...', '...in..ni...', '..iIn..nIi..', '..nnn..nnn..'],
    move2: { 9: '...inni.....', 10: '..iIn.nIi...', 11: '..nnn.nnn...' },
    attack: { 0: '..WiI..IiW..', 3: '.InkWCCWknI.', 4: '.InnCCCCnnI.' } },
  carousel_horse: {                                // a painted carousel horse, pink-maned, on its golden pole
    pal: { W: '#f8f0e0', w: '#d8c8a8', M: '#f050a0', m: '#b02870', G: '#f0c840', g: '#b08820', k: '#1a1018', S: '#4060c0', R: '#ff4030' },
    base: ['.....G......', '.....G.MMWW.', '.....GMmWWkW', '.....GMWWWWw', '...WWGSSW...', '.MWWWGSSWW..', 'MmWWWGWWWWW.', 'M.wWWGWWWww.', '..wW.G..Ww..', '..W..G...W..', '.ww..G..ww..', '.....g......'],
    move2: { 8: '..Ww.G.wW...', 9: '...W.G.W....', 10: '..ww.G.ww...' },
    attack: { 2: '.....GMmWWRW', 8: '.wW..G...Ww.', 9: 'W....G.....W', 10: '.....G......' } },
  jester_puppet: {                                 // a harlequin marionette on its strings, belled cap, juggling
    pal: { P: '#e8508a', p: '#a01860', T: '#40d0c0', t: '#208878', F: '#fff4e8', k: '#1a1018', Y: '#f0d040', S: '#c8c8d8' },
    base: ['YP..S..S..TY', '.PP.S..S.TT.', '..PPPPTTTT..', '..YFFFFFFY..', '...FkFFkF...', '...FFkkFF...', '..TPTPTPTP..', '.FPPPTTTTTF.', '..PPPTTTTT..', '..TTTPPPPP..', '..pp....tt..', '.ppp....ttt.'],
    extra: [[0, 6, 'Y'], [11, 4, 'Y']],
    move2: { 6: 'Y.TPTPTPTP..', 4: '...FkFFkF..Y' },
    attack: { 4: '...FkFFkF...', 5: '...FkkkkF...', 7: 'FPPPPTTTTTTF' } },
  xp_chicken: {                                    // the admin's gift: a plump white hen with a golden glint, worth a lot of XP
    pal: { W: '#f8f4ec', w: '#cfc6b4', R: '#e83a30', Y: '#f8c030', y: '#c08818', E: '#1a1018', G: '#ffe066' },
    base: ['.....RR....G', '....RRRR....', '....WWWWW...', '...WWWWEWYY.', '...WWWWWWYy.', 'W..WWWWWWR..', 'WWWWwwWWWR..', 'WWwWwwWWW...', '.WwwWWWWW...', '..wwwwWW....', '....Y..Y....', '...YY.YY....'],
    move2: { 0: '.....RR.....', 10: '...Y...Y....', 11: '..YY..YY....' },
    attack: { 4: 'WW.WWWWWWYy.', 5: 'WWWWWWWWWR..', 6: '.WWWwwWWWR..', 0: 'G....RR....G' } },
  kraken_tentacle: {                               // the Abyssal Kraken's arm, risen from the water, purple-suckered
    pal: { T: '#2a8a8a', t: '#1a5a60', S: '#e080c0', W: '#5ac8f0', w: '#2a78b8' },
    base: ['....tT......', '...tTTt.....', '...TTSt.....', '....tTTt....', '.....TSTt...', '.....tTTt...', '....tTSTt...', '....tTTTt...', '...tTSTTTt..', '.wWtTTTTtWw.', 'wWWWWWWWWWWw', '.wwwwwwwwww.'],
    move2: { 0: '.....tT.....', 1: '....tTTt....', 2: '....tTST....' },
    attack: { 0: '..TTTTt.....', 1: '.tS..tTt....', 2: '.....tTS....' } },
};
const parse = (rows, pal) => rows.map((r) => [...r].map((ch) => (ch === '.' ? null : pal[ch])));
const pale = (hex) => { const n = parseInt(hex.slice(1), 16), m = (v) => Math.round(v + (255 - v) * 0.6); return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map(m).map((v) => v.toString(16).padStart(2, '0')).join('')}`; };
const cell = 14, cols = 8, frames = [];
for (const [id, A] of Object.entries(ART)) {
  for (const r of A.base) if (r.length !== 12) throw new Error(`${id}: a row is ${r.length} wide: ${r}`);
  const withRows = (P) => A.base.map((r, i) => P && P[i] !== undefined ? P[i] : r);
  const dots = (rows) => { const g = rows.map((r) => [...r]); for (const [x, y, ch] of A.extra || []) if (g[y][x] === '.') g[y][x] = ch; return g.map((r) => r.join('')); };
  const F = { move1: dots(withRows()), move2: dots(withRows(A.move2)), attack: withRows(A.attack) };
  for (const [fn, rows] of Object.entries(F)) { for (const r of rows) if (r.length !== 12) throw new Error(`${id} ${fn}: a row is ${r.length} wide: ${r}`); frames.push({ id, fn, G: parse(rows, A.pal) }); }
  frames.push({ id, fn: 'hurt', G: parse(F.move1, A.pal).map((r) => r.map((c) => (c ? pale(c) : null))) });
}
const rows = Math.ceil(frames.length / cols), W = cols * cell, H = rows * cell, rgba = new Uint8Array(W * H * 4), sprites = {};
frames.forEach((F, i) => {
  const ox = (i % cols) * cell, oy = Math.floor(i / cols) * cell;
  F.G.forEach((row, y) => row.forEach((c, x) => { if (!c) return; const n = parseInt(c.slice(1), 16), q = ((oy + y) * W + ox + x) * 4; rgba[q] = n >> 16; rgba[q + 1] = (n >> 8) & 255; rgba[q + 2] = n & 255; rgba[q + 3] = 255; }));
  const S = sprites[F.id] || (sprites[F.id] = { frames: {}, anims: { move: { frames: ['move1', 'move2'], fps: 5, loop: true }, attack: { frames: ['move1', 'attack'], fps: 6, loop: false }, hurt: { frames: ['hurt', 'move1'], fps: 8, loop: false } }, meta: { redrawn: '12x12' } });
  S.frames[F.fn] = [ox, oy, 12, 12];
});
mkdirSync('art/bundle/resized', { recursive: true });
writePng('art/bundle/resized/rs_enemies.png', W, H, rgba);
writeFileSync('art/bundle/resized/atlas_resized.json', JSON.stringify({ meta: { name: 'Redrawn monsters', notes: 'tools/redraw_enemies.mjs: 8x8 monsters that stand bigger, redrawn by hand at 12x12' }, rf: true,
  sheets: { rs_enemies: { image: 'rs_enemies.png', kind: 'enemy', outline: true, sprites } } }, null, 1));
if (!idx.atlases.includes('resized/atlas_resized.json')) { idx.atlases.push('resized/atlas_resized.json'); writeFileSync(new URL('index.json', B0), JSON.stringify(idx, null, 1)); }
console.log(`${Object.keys(sprites).length} monsters redrawn at 12x12, ${frames.length} frames -> art/bundle/resized`);
