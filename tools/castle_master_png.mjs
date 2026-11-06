// The castle's fixed master footprint (src/world/castle_master.js) drawn tile for tile, beside the user's reference sheet at
// the same size, and its checks (2026-11-05, stage A of the user's rebuild: "Render the complete map and compare it to the
// reference"). Writes art/export/castle_master_footprint.png (the footprint, 4 px a tile) and, given the sheet,
// art/export/castle_master_compare.png (the reference's map on the left, the footprint on the right; needs ffmpeg).
//   node tools/castle_master_png.mjs [reference image]
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const { buildMaster, K, ORIGIN, SCALE, CURTAIN } = await import(new URL('../src/world/castle_master.js', import.meta.url));
const M = buildMaster(), { w, h, tiles: T, owner, parts } = M, P = 4;
const COL = { [K.VOID]: [8, 6, 14], [K.WATER]: [18, 30, 58], [K.WALL]: [150, 128, 176], [K.FLOOR]: [96, 82, 112], [K.CARPET]: [168, 34, 58],
  [K.LAVA]: [236, 120, 28], [K.STAIR]: [128, 116, 136], [K.SECRET]: [120, 40, 140], [K.PLUG]: [255, 255, 255], [K.TOWER]: [110, 96, 128] };
const W = w * P, H = h * P, px = new Uint8Array(W * H * 3);
const put = (x, y, c) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 3; px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; };
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  const t = T[y * w + x], c = COL[t];
  for (let j = 0; j < P; j++) for (let i = 0; i < P; i++) {
    let q = c;
    if (t === K.WALL) q = (i === 0 || j === 0) ? [182, 160, 206] : (i === P - 1 || j === P - 1) ? [104, 86, 128] : c;   // (a stone's edge)
    else if (t === K.FLOOR || t === K.TOWER) q = (i === 0 && j === 0) ? [80, 68, 96] : c;
    else if (t === K.STAIR) q = j % 2 ? [100, 90, 110] : c;
    put(x * P + i, y * P + j, q);
  }
}
// the PNG
const png = (file, W, H, px) => {
  const raw = Buffer.alloc((W * 3 + 1) * H); for (let y = 0; y < H; y++) Buffer.from(px.buffer, y * W * 3, W * 3).copy(raw, y * (W * 3 + 1) + 1);
  const tb = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; tb[n] = c >>> 0; }
  const crc = (b) => { let r = 0xffffffff; for (const v of b) r = tb[(r ^ v) & 255] ^ (r >>> 8); return (r ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const L = Buffer.alloc(4); L.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const C = Buffer.alloc(4); C.writeUInt32BE(crc(td)); return Buffer.concat([L, td, C]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 2;
  writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
};
const out = new URL('../art/export/', import.meta.url); mkdirSync(out, { recursive: true });
const foot = fileURLToPath(new URL('castle_master_footprint.png', out)); png(foot, W, H, px);
console.log('footprint', w + ' x ' + h, 'tiles ->', foot);

// ---- the checks
const walk = (t) => t === K.FLOOR || t === K.CARPET || t === K.STAIR || t === K.TOWER || t === K.SECRET || t === K.LAVA;
const flood = (start, block) => { const seen = new Uint8Array(w * h), Q = [start]; seen[start] = 1; while (Q.length) { const i = Q.pop(), x = i % w; for (const j of [x + 1 < w ? i + 1 : -1, x > 0 ? i - 1 : -1, i + w < w * h ? i + w : -1, i - w]) if (j >= 0 && !seen[j] && walk(T[j]) && !(block && block(j))) { seen[j] = 1; Q.push(j); } } return seen; };
const P0 = parts.find((q) => q.id === 'entrance'), start = (P0.box[1] + 5) * w + P0.box[0] + 3;
const reached = (seen) => parts.filter((q) => { for (let i = 0; i < w * h; i++) if (owner[i] === parts.indexOf(q) && seen[i]) return true; return false; }).map((q) => q.id);
const id = (k) => parts[k] && parts[k].id, inRoom = (name) => (j) => id(owner[j]) === name;
const all = reached(flood(start)), secret = parts.filter((q) => q.kind === 'secret').map((q) => q.id);
const missing = parts.filter((q) => q.kind !== 'secret' && !all.includes(q.id)).map((q) => q.id);
console.log('every room reachable from the entrance (the cracked walls shut):', missing.length ? 'NO, missing ' + missing.join(' ') : 'yes');
console.log('no secret room reachable before its cracked wall breaks:', secret.every((q) => !all.includes(q)) ? 'yes' : 'NO: ' + secret.filter((q) => all.includes(q)).join(' '));
for (const q of [K.PLUG]) for (let i = 0; i < w * h; i++) if (T[i] === q) T[i] = K.FLOOR;
const open = reached(flood(start)); console.log('every secret room reachable once its wall breaks:', secret.every((q) => open.includes(q)) ? 'yes' : 'NO: ' + secret.filter((q) => !open.includes(q)).join(' '));
// the order: shut the chain hall (the Jarls' gate) and nothing north of it may be reached; shut the drawbridge and nothing past it
const north = ['antechamber', 'ashkar', 'northkeep'], gateN = reached(flood(start, inRoom('chainhall')));
console.log('the forge route only through the chain hall (no way round the Jarls):', north.every((q) => !gateN.includes(q)) ? 'yes' : 'NO: ' + north.filter((q) => gateN.includes(q)).join(' '));
const gateD = reached(flood(start, inRoom('drawbridge')));
console.log('the castle only through the drawbridge:', ['courtyard', 'jarls', 'chainhall'].every((q) => !gateD.includes(q)) ? 'yes' : 'NO: ' + gateD.join(' '));
const gateC = reached(flood(start, inRoom('courtyard')));
console.log('the jarls only through the courtyard:', !gateC.includes('jarls') ? 'yes' : 'NO (reached round it: ' + gateC.join(' ') + ')');

// ---- the comparison (the reference's map panel at the footprint's size, side by side)
const ref = process.argv[2];
if (ref && existsSync(ref)) {
  let mx = 0, my = 0; for (const [x, y] of CURTAIN) { mx = Math.max(mx, x); my = Math.max(my, y); }
  const cw = Math.round(w / SCALE), ch = Math.round(h / SCALE), cmp = fileURLToPath(new URL('castle_master_compare.png', out));
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', ref, '-i', foot, '-filter_complex',
    `[0]crop=${cw}:${ch}:${ORIGIN[0]}:${ORIGIN[1]},scale=${W}:${H}:flags=lanczos[a];[a][1]hstack`, cmp]);
  console.log('comparison ->', cmp);
}
