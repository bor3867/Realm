// RotMG-style 2.5D walls: every wall is a block. Its TOP is its own tile art, lifted up the screen by the block's height
// (so it turns with the camera like the ground); its exposed FACES (an edge that looks out over anything lower, and
// faces down the screen at the current camera angle) hang from the top's edge down to whatever is next to it, textured
// from the wall's art with courses for its material, shaded by which way they face, with a contact shadow on the floor.
// Mixed into the Renderer (render.js). Three kinds of block:
//   - dungeon walls (and the vault's): wall tiles, mostly one tile tall; castle and chapel walls stand taller
//   - the Nexus hedges: low green walls, in the Nexus only (the realm's hedges and its border stay flat)
//   - the realm's ruins: the broken stone pieces of its towers, hamlets, graveyards and shells, low and uneven
// Two layers for wall tiles: the tops of every seen wall, composed per 8x8 chunk like the ground (cached, rebuilt only
// when a chunk's tiles or fog change) and drawn as one image per height right after the ground; and the BORDER walls
// (any wall next to something lower) drawn again, faces then top, in the depth-sorted list with everyone else: whoever
// stands behind a wall is covered by it, whoever stands in front is not. Ruins are few: they are only sorted blocks.
// Fairness: a block that would cover your own character is drawn see-through; shots are drawn after all of this, so a
// wall never hides one. Collision is untouched: this is drawing only.
import { TILE_NAMES, TID, WALL_FACE } from './world/maps.js';
const TS = 16;
const C = 8;                                                  // = GROUND_CHUNK in render.js
export const WALL_TILES = new Set(['forgewall', 'chapelwall', 'ribwall', 'cryptwall', 'emberwall', 'waxwall', 'velvetwall', 'crystalwall', 'dreamwall',
  'fvwall', 'mrwall', 'aswall', 'sdwall', 'ckwall', 'ckwin', 'hmwall'].map((n) => TID[n]).filter((t) => t !== undefined));
// how tall each stands, in screen pixels (a tile is 16): castle and chapel walls loom, hedges come to the chest
const WALL_H = { ckwall: 24, ckwin: 24, chapelwall: 20, ribwall: 20, crystalwall: 20, hedge: 11 };
const heightOf = (name) => WALL_H[name] || 16;
// each material's face: its courses, its tint, its mood (heavy forge iron, cold crypt stone, tall castle blocks, ...)
const MAT = {
  forgewall: { course: 4, tint: [58, 32, 16], tk: 0.18, rivet: true }, emberwall: { course: 4, tint: [70, 24, 10], tk: 0.2, rivet: true },
  chapelwall: { course: 8, tint: [70, 60, 40], tk: 0.08 }, ckwall: { course: 8, tint: [60, 20, 28], tk: 0.12 }, ckwin: { course: 8, tint: [60, 20, 28], tk: 0.12 },
  cryptwall: { course: 5, tint: [70, 90, 120], tk: 0.18 }, ribwall: { course: 10, tint: [110, 90, 60], tk: 0.12, rib: true },
  waxwall: { course: 4, tint: [140, 90, 20], tk: 0.14, comb: true }, velvetwall: { course: 16, tint: [90, 10, 30], tk: 0.16, drape: true },
  crystalwall: { course: 6, tint: [110, 80, 180], tk: 0.16, facet: true }, dreamwall: { course: 6, tint: [60, 40, 110], tk: 0.16 },
  hedge: { course: 0, tint: [20, 60, 24], tk: 0.12, leaf: true },
};
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];              // N E S W
const LIGHT = [-0.45, -0.89];                                 // the light comes from the north (a little west), in the world
const RUINS = new Set(['ruin_wall', 'ruin_wall2']);
const hash = (x, y) => { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

const methods = {
  // is this tile a wall block on this map? (hedges only in the Nexus)
  wallTile(m, t) { return WALL_TILES.has(t) || (m.kind === 'nexus' && t === TID.hedge); },
  // the wall facts of one chunk: its tops (images of only its seen wall tiles, one per height) and its border walls
  wallChunk(g, m, cx, cy, groundK) {
    this.wallChunks = this.wallChunkMap === m ? this.wallChunks : ((this.wallChunkMap = m), new Map());
    const key = cx * 65536 + cy, sig = this.chunkSig(m, cx, cy, 1, false), K0 = this.wallChunks.get(key);
    if (K0 && K0.sig === sig && K0.src === groundK) return K0;
    const K = K0 || { cs: {} };
    const inside = (x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h;
    const hAt = (x, y) => (inside(x, y) && this.wallTile(m, m.tiles[y * m.w + x]) ? heightOf(TILE_NAMES[m.tiles[y * m.w + x]]) : 0);   // 0: floor, water, void
    const seen = (x, y) => !m.seen || (inside(x, y) && m.seen[y * m.w + x]);
    K.border = []; K.heights = [];
    const tiles = {};
    for (let ty = cy * C; ty < cy * C + C; ty++) for (let tx = cx * C; tx < cx * C + C; tx++) {
      const h = hAt(tx, ty);
      if (!h || !seen(tx, ty)) continue;
      (tiles[h] = tiles[h] || []).push([tx, ty]);
      const nh = DIRS.map(([dx, dy]) => hAt(tx + dx, ty + dy));
      let edge = nh.some((v) => v < h);
      for (let yy = -1; yy <= 1 && !edge; yy++) for (let xx = -1; xx <= 1; xx++) if (hAt(tx + xx, ty + yy) < h) { edge = true; break; }
      if (edge) K.border.push({ tx, ty, h, nh, name: TILE_NAMES[m.tiles[ty * m.w + tx]], lx: tx - cx * C, ly: ty - cy * C });
    }
    for (const [hs, L] of Object.entries(tiles)) {          // the tops: this chunk's ground art, wall tiles of this height only
      const h = +hs, c = K.cs[h] || (K.cs[h] = Object.assign(document.createElement('canvas'), { width: C * TS, height: C * TS }));
      const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.clearRect(0, 0, C * TS, C * TS);
      for (const [tx, ty] of L) { const dx = (tx - cx * C) * TS, dy = (ty - cy * C) * TS; x.drawImage(groundK.c, dx, dy, TS, TS, dx, dy, TS, TS); }
      K.heights.push(h);
    }
    K.any = K.heights.length > 0; K.sig = sig; K.src = groundK; K.ground = groundK;
    this.wallChunks.set(key, K);
    if (this.wallChunks.size > 600) this.wallChunks.delete(this.wallChunks.keys().next().value);
    return K;
  },
  // a face texture for a material facing world direction d: its art darkened, coursed, tinted, lit by its facing
  wallFace(name, d, art) {
    this.faceTex = this.faceTex || {};
    const key = name + d;
    if (this.faceTex[key]) return this.faceTex[key];
    const cv = Object.assign(document.createElement('canvas'), { width: TS, height: TS }), x = cv.getContext('2d');
    x.imageSmoothingEnabled = false;
    const packed = WALL_FACE[name];                           // a pack that drew its own wall side: use it as it is
    let src = null;
    if (packed && this.R) { const def = this.R.resolve(packed), f = def && def.frames[Object.keys(def.frames)[0]]; if (f) { x.drawImage(def.img, f.x, f.y, f.w, f.h, 0, 0, TS, TS); src = 'pack'; } }
    if (!src && art) x.drawImage(art.img, art.x, art.y, art.w || TS, art.h || TS, 0, 0, TS, TS);
    const img = x.getImageData(0, 0, TS, TS), p = img.data, M = MAT[name] || { course: 5, tint: [40, 40, 50], tk: 0.08 };
    const lit = 0.8 + 0.2 * Math.max(-1, Math.min(1, -(DIRS[d][0] * LIGHT[0] + DIRS[d][1] * LIGHT[1])));   // facing the light: brighter
    for (let yy = 0; yy < TS; yy++) for (let xx = 0; xx < TS; xx++) {
      const q = (yy * TS + xx) * 4;
      if (p[q + 3] < 10) { p[q] = p[q + 1] = p[q + 2] = 20; p[q + 3] = 255; }
      let k = src === 'pack' ? lit * 0.95 : lit * 0.6;        // a face is clearly darker than its top
      if (src !== 'pack') {
        if (M.leaf) {                                         // a hedge: clumps of leaves, lit at their tips
          const n = hash(xx * 3 + d, yy * 5);
          k *= n < 0.25 ? 0.62 : n > 0.82 ? 1.25 : 1;
          if ((xx + yy * 2) % 7 === 0) k *= 0.8;
        } else {
          const row = yy % M.course, band = Math.floor(yy / M.course);
          if (row === M.course - 1) k *= 0.5;                 // mortar between courses
          else if (!M.drape && (xx + (band % 2) * 4) % 8 === 7) k *= 0.62;   // staggered joints
          if (row === 0) k *= 1.18;                           // each course's lit lip
          if (M.rivet && row === 1 && (xx + (band % 2) * 4) % 8 === 3) k *= 1.35;   // a forge wall's rivets
          if (M.rib && xx % 6 === 0) k *= 1.25;               // bone ribs, standing up the face
          if (M.comb && (xx + (band % 2) * 2) % 4 === 0) k *= 0.75;   // honeycomb cells
          if (M.drape) k *= 0.85 + 0.25 * Math.abs(Math.sin((xx + 0.5) * 0.9));   // velvet folds
          if (M.facet && (xx + yy) % 5 === 0) k *= 1.3;       // crystal facets catching the light
        }
      }
      if (yy === 0) k *= 1.18;                                // the top edge catches the light
      if (yy >= TS - 2) k *= 0.72;                            // the foot, in shadow
      for (let c = 0; c < 3; c++) p[q + c] = Math.max(0, Math.min(255, Math.round((p[q + c] * (1 - M.tk) + M.tint[c] * M.tk) * k)));
    }
    x.putImageData(img, 0, 0);
    return (this.faceTex[key] = cv);
  },
  // the tops layers: composed with the ground each frame (drawGround), drawn lifted (per height) right after it
  composeWallTops(g, m, ox, oy, cx0, cy0, cx1, cy1, anim) {
    const G = this.ground.width;
    this.tops = this.tops || {};
    for (const T of Object.values(this.tops)) T.used = false;
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
      const K = this.wallChunk(g, m, cx, cy, this.groundChunk(g, m, cx, cy, anim));
      for (const h of K.heights) {
        let T = this.tops[h];
        if (!T || T.cv.width !== G) { T = this.tops[h] = { cv: Object.assign(document.createElement('canvas'), { width: G, height: G }) }; T.x = T.cv.getContext('2d'); T.x.imageSmoothingEnabled = false; }
        if (!T.used) { T.x.clearRect(0, 0, G, G); T.used = true; }
        T.x.drawImage(K.cs[h], cx * C * TS - ox, cy * C * TS - oy);
      }
    }
  },
  drawWallTops() {
    if (!this.tops) return;
    const b = this.b, G = this.ground.width;
    for (const [hs, T] of Object.entries(this.tops)) {
      if (!T.used) continue;
      b.save(); b.translate(this.cx, this.cy - +hs); b.rotate(this.th);
      b.drawImage(T.cv, -G / 2 - (this.px * TS - Math.round(this.px * TS)), -G / 2 - (this.py * TS - Math.round(this.py * TS)));
      b.restore();
    }
  },
  // the realm's ruins as blocks: found once per map, bucketed by chunk; each piece a little shorter or taller (broken)
  ruinBlocks(m) {
    if (m.ruinBlocks) return m.ruinBlocks;
    const B = new Map(), at = new Map();
    for (const o of m.objects) {
      if (!RUINS.has(o.sprite)) continue;
      const tx = Math.floor(o.x), ty = Math.floor(o.y);
      const blk = { tx, ty, o, h: 6 + Math.round(hash(tx, ty) * 8), name: o.sprite };
      at.set(ty * m.w + tx, blk); o.block = true;            // (its flat sprite is not drawn: obj() skips it)
      const key = Math.floor(tx / C) * 65536 + Math.floor(ty / C);
      if (!B.has(key)) B.set(key, []);
      B.get(key).push(blk);
    }
    for (const blk of at.values()) blk.nh = DIRS.map(([dx, dy]) => { const n = at.get((blk.ty + dy) * m.w + blk.tx + dx); return n ? n.h : 0; });
    return (m.ruinBlocks = B);
  },
  // a ruin's look, from its own sprite's colours: a flagstone top, coursed faces
  ruinTex(name) {
    this.ruinT = this.ruinT || {};
    if (this.ruinT[name]) return this.ruinT[name];
    const W = this.W, k = W.objects[name], c = W.objectsCols, img = this.A.img.objects;
    const sc = Object.assign(document.createElement('canvas'), { width: TS, height: TS }), sx = sc.getContext('2d');
    sx.drawImage(img, (k % c) * TS, Math.floor(k / c) * TS, TS, TS, 0, 0, TS, TS);
    const d = sx.getImageData(0, 0, TS, TS).data, cols = [];
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) cols.push([d[i], d[i + 1], d[i + 2]]);
    const lum = (q) => q[0] * 0.3 + q[1] * 0.59 + q[2] * 0.11, green = cols.filter((q) => q[1] > q[0] + 30 && q[1] > q[2] + 20);
    const stone = cols.filter((q) => !green.includes(q)).sort((a, b) => lum(a) - lum(b));
    const pick = (f) => stone[Math.min(stone.length - 1, Math.floor(stone.length * f))] || [140, 135, 160];
    const light = pick(0.8), mid = pick(0.5), dark = pick(0.15), moss = green[0] || [110, 170, 70];
    const make = (fn) => { const cv = Object.assign(document.createElement('canvas'), { width: TS, height: TS }), x = cv.getContext('2d'), D = x.createImageData(TS, TS);
      for (let yy = 0; yy < TS; yy++) for (let xx = 0; xx < TS; xx++) { const q = (yy * TS + xx) * 4, v = fn(xx, yy); D.data[q] = v[0]; D.data[q + 1] = v[1]; D.data[q + 2] = v[2]; D.data[q + 3] = 255; }
      x.putImageData(D, 0, 0); return cv; };
    const top = make((xx, yy) => {                            // flagstones, mossy in the cracks
      const crack = yy % 8 === 7 || (xx + (Math.floor(yy / 8) % 2) * 4) % 8 === 7;
      if (crack) return hash(xx, yy) < 0.35 ? moss : dark;
      return hash(xx * 7, yy * 3) < 0.12 ? mid : light;
    });
    const faces = [0, 1, 2, 3].map((dd) => {
      const lit = 0.8 + 0.2 * Math.max(-1, Math.min(1, -(DIRS[dd][0] * LIGHT[0] + DIRS[dd][1] * LIGHT[1])));
      return make((xx, yy) => {
        const row = yy % 5, band = Math.floor(yy / 5);
        let base = row === 4 ? dark : (xx + (band % 2) * 3) % 6 === 5 ? dark : mid, k = lit * 0.85;
        if (row === 0) k *= 1.15;
        if (yy >= TS - 2) k *= 0.75;
        if (row === 4 && hash(xx, yy + 9) < 0.25) base = moss;
        return base.map((v) => Math.max(0, Math.min(255, Math.round(v * k))));
      });
    });
    return (this.ruinT[name] = { top, faces });
  },
  // the border walls and the ruins, into the depth-sorted list
  addWalls(g, m, list, VR) {
    const p = g.player, x0 = Math.floor((p.x - VR) / C), x1 = Math.floor((p.x + VR) / C), y0 = Math.floor((p.y - VR) / C), y1 = Math.floor((p.y + VR) / C);
    const BW = this.buf.width, BH = this.buf.height, front = (TS / 2) * (Math.abs(this.cs) + Math.abs(this.sn));   // a block's nearest corner, below its centre
    const [psx, psy] = this.proj(p.x, p.y);
    const R = m.kind === 'realm' ? this.ruinBlocks(m) : null;
    const push = (w, draw) => {
      const [sx, sy] = this.proj(w.tx + 0.5, w.ty + 0.5);
      if (sx < -40 || sy < -60 || sx > BW + 40 || sy > BH + 40) return;
      if (m.seen && !g.seen(w.tx + 0.5, w.ty + 0.5)) return;
      const key = sy + front - 0.5;
      const veil = key > psy && Math.abs(sx - psx) < 16 && psy > sy - front - w.h - 2 && psy - 22 < sy + front;   // in front of you and over you: see-through
      list.push({ sy: key, f: () => draw(sx, sy, veil) });
    };
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      const key = cx * 65536 + cy, K = this.wallChunks && this.wallChunks.get(key);
      if (K && K.any) for (const w of K.border) push(w, (sx, sy, veil) => this.drawBlock(w, sx, sy, veil, K));
      const L = R && R.get(key);
      if (L) for (const w of L) push(w, (sx, sy, veil) => this.drawBlock(w, sx, sy, veil, null));
    }
  },
  // one block: its faces toward anything lower (down to that height), its contact shadows, then its top
  drawBlock(w, sx, sy, veil, K) {
    const b = this.b, h = w.h, ruin = !K, RT = ruin ? this.ruinTex(w.name) : null;
    if (veil) { b.save(); b.globalAlpha = 0.42; }
    for (let d = 0; d < 4; d++) {
      const lo = w.nh[d];
      if (lo >= h) continue;                                  // a neighbour as tall: no face between them
      const [nx, ny] = DIRS[d];
      if (nx * this.sn + ny * this.cs <= 0.02) continue;      // it faces away from the camera
      const x = w.tx, y = w.ty;
      const E = [[[x, y], [x + 1, y]], [[x + 1, y], [x + 1, y + 1]], [[x + 1, y + 1], [x, y + 1]], [[x, y + 1], [x, y]]][d];
      let P0 = this.proj(E[0][0], E[0][1]), P1 = this.proj(E[1][0], E[1][1]);
      if (P1[0] < P0[0]) [P0, P1] = [P1, P0];
      if (!lo) {                                              // the contact shadow on the floor in front
        const snx = nx * this.cs - ny * this.sn, sny = nx * this.sn + ny * this.cs;
        b.fillStyle = 'rgba(0,0,0,0.3)';
        b.beginPath(); b.moveTo(P0[0], P0[1]); b.lineTo(P1[0], P1[1]); b.lineTo(P1[0] + snx * 3, P1[1] + sny * 3); b.lineTo(P0[0] + snx * 3, P0[1] + sny * 3); b.closePath(); b.fill();
      }
      const tex = ruin ? RT.faces[d] : this.wallFace(w.name, d, { img: K.ground.c, x: w.lx * TS, y: w.ly * TS });
      const fh = h - lo;                                      // from the neighbour's height up to this one's
      b.save(); b.transform((P1[0] - P0[0]) / TS, (P1[1] - P0[1]) / TS, 0, fh / TS, P0[0], P0[1] - h);
      b.drawImage(tex, 0, 0, TS, Math.max(1, Math.round((TS * fh) / h)), 0, 0, TS, TS);
      b.restore();
    }
    b.save(); b.translate(sx, sy - h); b.rotate(this.th);                        // the top, over its faces
    if (ruin) b.drawImage(RT.top, 0, 0, TS, TS, -TS / 2, -TS / 2, TS, TS);
    else b.drawImage(K.cs[h], w.lx * TS, w.ly * TS, TS, TS, -TS / 2, -TS / 2, TS, TS);
    b.restore();
    if (veil) b.restore();
  },
};
export function installWalls(Renderer) { Object.assign(Renderer.prototype, methods); }
