// RotMG-style 2.5D walls: every wall tile is a block one tile tall. Its TOP is its own tile art, lifted one tile up the
// screen (so it turns with the camera like the ground); its exposed FACES (an edge that looks out over open floor and
// faces down the screen at the current camera angle) hang from the top's edge to the ground, textured from the wall's
// art with stone courses, shaded by which way they face, with a contact shadow where they meet the floor.
// Mixed into the Renderer (render.js). Two layers:
//   - the tops of every seen wall, composed per 8x8 chunk like the ground (cached, rebuilt only when a chunk's tiles or
//     fog change) and drawn as one image right after the ground, lifted;
//   - the BORDER walls (any wall with open floor among its 8 neighbours) drawn again, faces then top, in the depth-
//     sorted list with everyone else: whoever stands behind a wall is covered by it, whoever stands in front is not.
// Fairness: a wall that would cover your own character is drawn see-through; shots are drawn after all of this, so a
// wall never hides one. Collision is untouched: this is drawing only.
import { TILE_NAMES, TID, WALL_FACE, SKIN_TID } from './world/maps.js';
const TS = 16, H = 16;                                        // a wall stands one tile tall (RotMG)
const C = 8;                                                  // = GROUND_CHUNK in render.js
export const WALL_TILES = new Set(['forgewall', 'chapelwall', 'ribwall', 'cryptwall', 'emberwall', 'waxwall', 'velvetwall', 'crystalwall', 'dreamwall',
  'fvwall', 'mrwall', 'aswall', 'sdwall', 'ckwall', 'ckwin', 'hmwall'].map((n) => TID[n]).filter((t) => t !== undefined));
const VOIDISH = new Set(['void', 'starvoid', 'fadegone', 'asvoid', 'cliff'].map((n) => TID[n]).filter((t) => t !== undefined));
// each material's face: how tall its stone courses are, how its mortar runs, and a tint toward its mood
const MAT = {
  forgewall: { course: 4, tint: [58, 32, 16], tk: 0.18, rivet: true }, emberwall: { course: 4, tint: [70, 24, 10], tk: 0.2, rivet: true },
  chapelwall: { course: 8, tint: [70, 60, 40], tk: 0.08 }, ckwall: { course: 8, tint: [60, 20, 28], tk: 0.12 }, ckwin: { course: 8, tint: [60, 20, 28], tk: 0.12 },
  cryptwall: { course: 5, tint: [70, 90, 120], tk: 0.18 }, ribwall: { course: 5, tint: [80, 90, 110], tk: 0.14 },
  waxwall: { course: 6, tint: [120, 80, 20], tk: 0.1 }, velvetwall: { course: 8, tint: [70, 10, 30], tk: 0.12 },
  crystalwall: { course: 6, tint: [80, 60, 140], tk: 0.12 }, dreamwall: { course: 6, tint: [60, 40, 110], tk: 0.14 },
};
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];              // N E S W
const LIGHT = [-0.45, -0.89];                                 // the light comes from the north (a little west), in the world

const methods = {
  // the wall facts of one chunk: its tops (an image of only its seen wall tiles) and its border walls
  wallChunk(g, m, cx, cy, groundK) {
    this.wallChunks = this.wallChunkMap === m ? this.wallChunks : ((this.wallChunkMap = m), new Map());
    const key = cx * 65536 + cy, sig = this.chunkSig(m, cx, cy, 1, false), K0 = this.wallChunks.get(key);
    if (K0 && K0.sig === sig && K0.src === groundK) return K0;
    const K = K0 || { c: null };
    const isWall = (x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && WALL_TILES.has(m.tiles[y * m.w + x]);
    const seen = (x, y) => !m.seen || (x >= 0 && y >= 0 && x < m.w && y < m.h && m.seen[y * m.w + x]);
    const open = (x, y) => !(x >= 0 && y >= 0 && x < m.w && y < m.h && WALL_TILES.has(m.tiles[y * m.w + x]));   // floor, water or the void: a wall shows a face to anything that is not wall
    K.border = []; let any = false;
    for (let ty = cy * C; ty < cy * C + C; ty++) for (let tx = cx * C; tx < cx * C + C; tx++) {
      if (!isWall(tx, ty) || !seen(tx, ty)) continue;
      any = true;
      let faces = 0, edge = false;
      for (let d = 0; d < 4; d++) if (open(tx + DIRS[d][0], ty + DIRS[d][1])) faces |= 1 << d;
      for (let yy = -1; yy <= 1 && !edge; yy++) for (let xx = -1; xx <= 1; xx++) if (open(tx + xx, ty + yy)) { edge = true; break; }
      if (edge) K.border.push({ tx, ty, faces, name: TILE_NAMES[m.tiles[ty * m.w + tx]], lx: tx - cx * C, ly: ty - cy * C });
    }
    if (any) {                                                // the tops: this chunk's ground art, wall tiles only
      if (!K.c) K.c = Object.assign(document.createElement('canvas'), { width: C * TS, height: C * TS });
      const x = K.c.getContext('2d'); x.imageSmoothingEnabled = false; x.clearRect(0, 0, C * TS, C * TS);
      for (let ty = cy * C; ty < cy * C + C; ty++) for (let tx = cx * C; tx < cx * C + C; tx++) {
        if (!isWall(tx, ty) || !seen(tx, ty)) continue;
        const dx = (tx - cx * C) * TS, dy = (ty - cy * C) * TS;
        x.drawImage(groundK.c, dx, dy, TS, TS, dx, dy, TS, TS);
      }
    }
    K.any = any; K.sig = sig; K.src = groundK; K.ground = groundK;
    this.wallChunks.set(key, K);
    if (this.wallChunks.size > 600) this.wallChunks.delete(this.wallChunks.keys().next().value);
    return K;
  },
  // a face texture for a wall type facing world direction d: its art darkened, coursed, tinted, lit by its facing
  wallFace(name, d, art) {
    this.faceTex = this.faceTex || {};
    const key = name + d;
    if (this.faceTex[key]) return this.faceTex[key];
    const cv = Object.assign(document.createElement('canvas'), { width: TS, height: TS }), x = cv.getContext('2d');
    x.imageSmoothingEnabled = false;
    const packed = WALL_FACE[name];                           // a pack that drew its own wall side: use it as it is
    let src = null;
    if (packed && this.R) { const def = this.R.resolve(packed), f = def && def.frames[Object.keys(def.frames)[0]]; if (f) { x.drawImage(def.img, f.x, f.y, f.w, f.h, 0, 0, TS, TS); src = 'pack'; } }
    if (!src && art) x.drawImage(art.img, art.x, art.y, TS, TS, 0, 0, TS, TS);
    const img = x.getImageData(0, 0, TS, TS), p = img.data, M = MAT[name] || { course: 5, tint: [40, 40, 50], tk: 0.08 };
    const lit = 0.8 + 0.2 * Math.max(-1, Math.min(1, -(DIRS[d][0] * LIGHT[0] + DIRS[d][1] * LIGHT[1])));   // facing the light: brighter
    for (let yy = 0; yy < TS; yy++) for (let xx = 0; xx < TS; xx++) {
      const q = (yy * TS + xx) * 4;
      if (p[q + 3] < 10) { p[q] = p[q + 1] = p[q + 2] = 20; p[q + 3] = 255; }
      let k = src === 'pack' ? lit * 0.95 : lit * 0.6;        // a face is clearly darker than its top
      if (src !== 'pack') {
        const row = yy % M.course, band = Math.floor(yy / M.course);
        if (row === M.course - 1) k *= 0.5;                   // mortar between courses
        else if ((xx + (band % 2) * 4) % 8 === 7) k *= 0.62;  // staggered joints
        if (row === 0) k *= 1.18;                             // each course's lit lip
        if (M.rivet && row === 1 && (xx + (band % 2) * 4) % 8 === 3) k *= 1.35;   // a forge wall's rivets
      }
      if (yy === 0) k *= 1.18;                                // the top edge catches the light
      if (yy >= TS - 2) k *= 0.72;                            // the foot, in shadow
      for (let c = 0; c < 3; c++) p[q + c] = Math.max(0, Math.min(255, Math.round((p[q + c] * (1 - M.tk) + M.tint[c] * M.tk) * k)));
    }
    x.putImageData(img, 0, 0);
    return (this.faceTex[key] = cv);
  },
  // the tops layer: composed with the ground each frame (drawGround), drawn lifted right after it
  composeWallTops(g, m, ox, oy, cx0, cy0, cx1, cy1, anim) {
    const G = this.ground.width;
    if (!this.topsCv || this.topsCv.width !== G) { this.topsCv = Object.assign(document.createElement('canvas'), { width: G, height: G }); this.tctx = this.topsCv.getContext('2d'); this.tctx.imageSmoothingEnabled = false; }
    const tc = this.tctx; tc.clearRect(0, 0, G, G);
    let any = false;
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
      const K = this.wallChunk(g, m, cx, cy, this.groundChunk(g, m, cx, cy, anim));
      if (K.any) { tc.drawImage(K.c, cx * C * TS - ox, cy * C * TS - oy); any = true; }
    }
    this.topsAny = any;
  },
  drawWallTops() {
    if (!this.topsAny) return;
    const b = this.b, G = this.ground.width;
    b.save(); b.translate(this.cx, this.cy - H); b.rotate(this.th);
    b.drawImage(this.topsCv, -G / 2 - (this.px * TS - Math.round(this.px * TS)), -G / 2 - (this.py * TS - Math.round(this.py * TS)));
    b.restore();
  },
  // the border walls, into the depth-sorted list
  addWalls(g, m, list, VR) {
    const p = g.player, x0 = Math.floor((p.x - VR) / C), x1 = Math.floor((p.x + VR) / C), y0 = Math.floor((p.y - VR) / C), y1 = Math.floor((p.y + VR) / C);
    const BW = this.buf.width, BH = this.buf.height, front = (TS / 2) * (Math.abs(this.cs) + Math.abs(this.sn));   // a block's nearest corner, below its centre
    const [psx, psy] = this.proj(p.x, p.y);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      const K = this.wallChunks && this.wallChunks.get(cx * 65536 + cy);
      if (!K || !K.any) continue;
      for (const w of K.border) {
        const [sx, sy] = this.proj(w.tx + 0.5, w.ty + 0.5);
        if (sx < -40 || sy < -60 || sx > BW + 40 || sy > BH + 40) continue;
        const key = sy + front - 0.5;
        // see-through when it would stand in front of you and cover you
        const veil = key > psy && Math.abs(sx - psx) < 16 && psy > sy - front - H - 2 && psy - 22 < sy + front;
        list.push({ sy: key, f: () => this.drawWall(w, K, sx, sy, veil) });
      }
    }
  },
  drawWall(w, K, sx, sy, veil) {
    const b = this.b;
    if (veil) { b.save(); b.globalAlpha = 0.42; }
    const ns = [];
    for (let d = 0; d < 4; d++) {
      if (!(w.faces & (1 << d))) continue;
      const [nx, ny] = DIRS[d], nsy = nx * this.sn + ny * this.cs;          // does it face down the screen?
      if (nsy <= 0.02) continue;
      ns.push(d);
    }
    for (const d of ns) {
      const [nx, ny] = DIRS[d], x = w.tx, y = w.ty;
      const E = [[[x, y], [x + 1, y]], [[x + 1, y], [x + 1, y + 1]], [[x + 1, y + 1], [x, y + 1]], [[x, y + 1], [x, y]]][d];
      let P0 = this.proj(E[0][0], E[0][1]), P1 = this.proj(E[1][0], E[1][1]);
      if (P1[0] < P0[0]) [P0, P1] = [P1, P0];
      const snx = nx * this.cs - ny * this.sn, sny = nx * this.sn + ny * this.cs;   // the face's normal on screen
      b.fillStyle = 'rgba(0,0,0,0.3)';                                          // the contact shadow on the floor in front
      b.beginPath(); b.moveTo(P0[0], P0[1]); b.lineTo(P1[0], P1[1]); b.lineTo(P1[0] + snx * 3, P1[1] + sny * 3); b.lineTo(P0[0] + snx * 3, P0[1] + sny * 3); b.closePath(); b.fill();
      const art = { img: K.ground.c, x: w.lx * TS, y: w.ly * TS };
      const tex = this.wallFace(w.name, d, art);
      b.save(); b.transform((P1[0] - P0[0]) / TS, (P1[1] - P0[1]) / TS, 0, H / TS, P0[0], P0[1] - H);
      b.drawImage(tex, 0, 0, TS, TS, 0, 0, TS, TS);
      b.restore();
    }
    b.save(); b.translate(sx, sy - H); b.rotate(this.th);                        // the top, over its faces
    b.drawImage(K.c, w.lx * TS, w.ly * TS, TS, TS, -TS / 2, -TS / 2, TS, TS);
    b.restore();
    if (veil) b.restore();
  },
};
export function installWalls(Renderer) { Object.assign(Renderer.prototype, methods); }
void SKIN_TID;
