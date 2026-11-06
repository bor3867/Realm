// A picture of the whole castle as the game builds it (2026-11-05, the user: "Provide a full-map screenshot showing the
// final connected layout"): every tile of the castle part of the map (its floors, carpets, lawns, lava, walls), each area
// outlined (the main route gold, the side rooms cyan, the secret rooms magenta) with its number, the locks' gates red,
// the cracked walls of the secret rooms white. Written to art/export/castle_map.png (3 pixels a tile).
//   node tools/castle_map_png.mjs [x0 y0 x1 y1]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const root = new URL('../', import.meta.url);
const { buildRegistry } = await import(new URL('src/registry.js', root));
const { Game } = await import(new URL('src/game.js', root));
const { TID } = await import(new URL('src/world/maps.js', root));
const B0 = new URL('art/bundle/', root), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((q) => ({ pack: q.split('/')[0], json: J(q) })), J(idx.hover), (q) => q);
const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
g.newCharacter('priest'); g.persist = () => {}; g.mode = 'play'; g.enter('throne', { seed: 4 });
const m = g.map, C = m.castle, [X0, Y0, X1, Y1] = process.argv.length > 5 ? process.argv.slice(2, 6).map(Number) : [310, 80, 760, 430], K = 3;
const W = (X1 - X0) * K, H = (Y1 - Y0) * K, px = new Uint8Array(W * H * 3);
const put = (x, y, c) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 3; px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; };
const fill = (tx, ty, c) => { for (let j = 0; j < K; j++) for (let i = 0; i < K; i++) put((tx - X0) * K + i, (ty - Y0) * K + j, c); };
const COL = (t, solid) => t === TID.void ? [6, 4, 10] : t === TID.lava || t === TID.emberlava ? [230, 110, 30] : t === TID.kpcarpet ? [160, 30, 44] : t === TID.grass ? [60, 110, 50] : t === TID.stageboards ? [130, 90, 50]
  : t === TID.nxchasm ? [20, 14, 40] : solid ? [44, 34, 58] : t === TID.kpfloor ? [104, 92, 118] : t === TID.emberfloor || t === TID.forge ? [110, 60, 50] : [90, 80, 70];
for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) { const i = y * m.w + x; fill(x, y, COL(m.tiles[i], m.solid[i])); }
for (const o of m.objects) { if (o.x < X0 || o.y < Y0 || o.x >= X1 || o.y >= Y1) continue; if (o.castleGate) fill(Math.floor(o.x), Math.floor(o.y), [255, 40, 60]); else if (o.interact === 'weak') fill(Math.floor(o.x), Math.floor(o.y), [255, 255, 255]); else if (o.solid) fill(Math.floor(o.x), Math.floor(o.y), [70, 60, 80]); }
const box = (n, c) => { for (let x = n.x; x < n.x + n.w; x++) for (const y of [n.y, n.y + n.h - 1]) { const X = (x - X0) * K, Y = (y - Y0) * K + (y === n.y ? 0 : K - 1); put(X, Y, c); put(X + 1, Y, c); put(X + 2, Y, c); } for (let y = n.y; y < n.y + n.h; y++) for (const x of [n.x, n.x + n.w - 1]) { const X = (x - X0) * K + (x === n.x ? 0 : K - 1), Y = (y - Y0) * K; put(X, Y, c); put(X, Y + 1, c); put(X, Y + 2, c); } };
// a tiny pixel font for the areas' numbers
const DIG = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
const label = (x, y, s, c) => { let cx = x; for (const ch of String(s)) { const d = DIG[+ch]; if (!d) continue; for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (d[j * 3 + i] === '1') for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) put(cx + i * 2 + a, y + j * 2 + b, c); cx += 8; } };
const MAIN = new Set([24, 23, 28, 26, 42, 45, 46, 47]);
for (const n of Object.values(C.rooms)) { if (n.x + n.w < X0 || n.x > X1 || n.y + n.h < Y0 || n.y > Y1) continue; const c = MAIN.has(n.num) ? [255, 210, 80] : n.region === 'mountain' || n.region === 'forest' ? [160, 160, 160] : [90, 220, 255]; box(n, c); label((n.x - X0) * K + 4, (n.y - Y0) * K + 4, n.num, c); }
for (const s of m.secrets) box(s, [255, 80, 255]);
// PNG
const raw = Buffer.alloc((W * 3 + 1) * H); for (let y = 0; y < H; y++) { raw[y * (W * 3 + 1)] = 0; Buffer.from(px.buffer, y * W * 3, W * 3).copy(raw, y * (W * 3 + 1) + 1); }
const crc = (b) => { let c, t = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } let r = 0xffffffff; for (const v of b) r = t[(r ^ v) & 255] ^ (r >>> 8); return (r ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const L = Buffer.alloc(4); L.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const C2 = Buffer.alloc(4); C2.writeUInt32BE(crc(td)); return Buffer.concat([L, td, C2]); };
const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 2;
mkdirSync(new URL('art/export/', root), { recursive: true });
writeFileSync(new URL('art/export/castle_map.png', root), Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log('art/export/castle_map.png', W + 'x' + H);
