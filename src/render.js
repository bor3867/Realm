// Canvas renderer.
// The world is drawn into a low-res buffer (1 px = 1 art pixel) then scaled up by
// an integer factor, so every pixel stays crisp. The camera can rotate: the
// GROUND layer (tiles, biome edges, foam, decor) rotates as one image, while
// every sprite stays upright at its rotated position, like classic tiny-MMO cameras.
import { TILE_NAMES, BIOMES, biomeAt } from './world/maps.js';
import { CLASSES } from './data/classes.js';
import { ITEMS, iconIndex } from './data/items.js';
import { outlinedFrame } from './outline.js';

const TS = 16;
const MINI = { 0: '#1e5078', 1: '#102c48', 2: '#d2b074', 3: '#3e6230', 4: '#4e412c', 5: '#c4d2e0', 6: '#5e5a76', 7: '#5e5a76',
  8: '#3e373c', 9: '#221d28', 10: '#d8d2c4', 11: '#3a2a2a', 12: '#2e2a38', 13: '#c0400e', 14: '#0a080c',
  15: '#4e6670', 16: '#8a9aa0', 17: '#221d28', 18: '#c8c0b0', 19: '#4a7a30', 20: '#8e8a9a', 21: '#9a764e', 22: '#18321a', 23: '#5aa0c8', 24: '#3a4a28', 25: '#c4dcee',
  26: '#f0dcae', 27: '#b8dcd8', 28: '#2e3a22', 29: '#121c0e', 30: '#b89a48', 31: '#8a7aa8',
  32: '#3a4a5c', 33: '#7486a0', 34: '#2a6c9c', 35: '#3c2a28', 36: '#6c524a', 37: '#ff8c1e', 38: '#8e1e30',
  39: '#a86e26', 40: '#e8c878', 41: '#ffc040', 42: '#7a4e28', 43: '#6a1224', 44: '#2e2e56', 45: '#8a6ad0', 46: '#8878bc', 47: '#d8d0f4', 48: '#0a0618', 49: '#d8a8e8', 50: '#98c0f0', 51: '#1a1236' };
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];          // N E S W (matches edge sheet order)
const WEATHER = {
  shore: { n: 36, color: ['#e8f6ff', '#a8d8f0'], vx: 9, vy: 2, size: 1, blink: false },
  fen: { n: 26, color: ['#d4ff5a', '#8db03a'], vx: 3, vy: -2, size: 1, blink: true },
  runeholt: { n: 70, color: ['#ffffff', '#dde8f2'], vx: -4, vy: 14, size: 2, blink: false },
  godfall: { n: 46, color: ['#f2641a', '#ffc94a', '#8c2a12'], vx: 2, vy: -10, size: 1, blink: true },
  forge: { n: 40, color: ['#f2641a', '#ffc94a'], vx: 0, vy: -8, size: 1, blink: true },
  nexus: { n: 22, color: ['#f2c14e', '#fffdf0'], vx: 0, vy: -3, size: 1, blink: true },
  crypt: { n: 26, color: ['#9cff6a', '#eaffc4', '#6af0ff'], vx: 1, vy: -4, size: 1, blink: true },          // drifting soul-lights
  dunes: { n: 60, color: ['#fff0cc', '#e8cf96', '#cfffff'], vx: 22, vy: 3, size: 1, blink: false },       // blowing sand, a glint of glass
  thornwood: { n: 30, color: ['#6ab04a', '#c83a4a', '#3a7a2a'], vx: 2, vy: 6, size: 1, blink: false },     // drifting leaves and berries
  steppe: { n: 34, color: ['#ffd0ff', '#e880e8', '#ffffff'], vx: 4, vy: -3, size: 1, blink: true },         // crystal motes catching the light
};

// minimap markers: o outline, 1 main colour, 2 accent
// in-world text: a bold, readable sans (RotMG uses Myriad Bold with a black outline)
const outlined = (ctx, t, x, y) => { ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = '#000'; ctx.strokeText(t, x, y); };
const textFont = (px) => `700 ${Math.round(px)}px "Source Sans 3", "Segoe UI", sans-serif`;
const MINI_ENEMY_RANGE = 18;
const MINI_GLYPH = {
  player: ['.ooo.', 'o121o', 'o222o', 'o121o', '.ooo.'],
  enemy: ['.ooo.', 'o111o', 'o112o', 'o111o', '.ooo.'],
  portal: ['.ooooo.', 'o11111o', 'o12221o', 'o12221o', 'o12221o', 'o11111o', '.ooooo.'],
  skull: ['.ooooo.', 'o11111o', 'o12121o', 'o11111o', '.o111o.', '.o1o1o.', '..ooo..'],
  crown: ['o.o.o.o', '1o1o1o1', 'o11111o', 'o12121o', 'o11111o', '.ooooo.'],
  star: ['...o...', '..o1o..', 'oo121oo', 'o11211o', '.o111o.', 'o1o.o1o', 'oo...oo'],
  coin: ['.ooo.', 'o112o', 'o121o', 'o211o', '.ooo.'],
  quest: ['.ooo.', '.o1o.', '.o1o.', '.o1o.', '.ooo.', '.o1o.', '.ooo.'],
  bag: ['.o.o.', '.o2o.', 'o111o', 'o121o', '.ooo.'],
  shrine: ['..o..', '.o2o.', '.o1o.', 'o111o', 'ooooo'],
  camp: ['...o...', '..o1o..', '.o121o.', 'o12221o', 'ooooooo'],
  talk: ['ooooo', 'o111o', 'o212o', 'o111o', 'oo1oo', '.oo..'],
  lore: ['ooooo', 'o121o', 'o111o', 'o121o', 'ooooo'],
  anvil: ['ooooo', 'o111o', '.o1o.', 'ooooo'],
  diamond: ['..o..', '.o1o.', 'o121o', '.o1o.', '..o..'],
  waypoint: ['.ooo.', 'o121o', '.o1o.', '.o1o.', 'o111o', 'ooooo'],
  site: ['o.o.o', '.o1o.', 'o121o', '.o1o.', 'o.o.o'],
};

export class Renderer {
  constructor(canvas, mini, assets) {
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.mini = mini; this.mctx = mini.getContext('2d');
    this.A = assets; this.W = assets.world; this.R = assets.reg;   // R: the Realm Update sprite registry
    this.buf = document.createElement('canvas');                 // logical size only (art-buffer pixels)
    this.hi = document.createElement('canvas'); this.b = this.hi.getContext('2d');   // the world is drawn here, at screen resolution
    this.ground = document.createElement('canvas'); this.gctx = this.ground.getContext('2d');
    this.scale = 3;
    this.parts = []; this.weather = []; this.weatherKind = null;
    this.shake = 0; this.hurtFlash = 0; this.lastT = 0;
    this.flashCache = new Map(); this.colorCache = new Map();
    this.zaps = []; this.rings = [];
    this.miniBase = null; this.miniFor = null;
  }
  resize(w, h) {
    const z = this.settings && this.settings.zoom;
    const base = z && z !== 'auto' ? Math.max(2, Math.min(6, +z)) : Math.max(2, Math.min(5, Math.floor(Math.min(w / 380, h / 250))));
    const vz = Math.max(0.75, Math.min(1.5, (this.settings && +this.settings.viewZoom) || 1));
    this.scale = base * vz;              // the view zoom leans in or out a little around the player
    const s = this.scale;
    this.buf.width = Math.max(1, Math.floor(w / s)); this.buf.height = Math.max(1, Math.floor(h / s));
    this.c.width = Math.round(this.buf.width * s); this.c.height = Math.round(this.buf.height * s);
    this.hi.width = this.c.width; this.hi.height = this.c.height;
    const G = Math.ceil(Math.hypot(this.buf.width, this.buf.height) / 2) * 2 + 48;
    this.ground.width = this.ground.height = G;
    for (const x of [this.b, this.ctx, this.gctx]) x.imageSmoothingEnabled = false;
    this.U = Math.max(1, Math.round(s));                         // sprites are baked at this many screen px per buffer px
    this.buildVignette();
  }
  // ------------------------------------------------------------ camera
  setCam(g) {
    const p = g.player;
    this.th = g.camAngle; this.cs = Math.cos(this.th); this.sn = Math.sin(this.th);
    this.px = p.x; this.py = p.y;
    this.cx = Math.floor(this.buf.width / 2); this.cy = Math.floor(this.buf.height / 2) + 5;
  }
  proj(x, y) {
    const dx = (x - this.px) * TS, dy = (y - this.py) * TS;
    return [this.cx + dx * this.cs - dy * this.sn, this.cy + dx * this.sn + dy * this.cs];
  }
  // screen pixel (display canvas) -> world tile coords
  toWorld(sx, sy) {
    const bx = sx / this.scale - this.cx, by = sy / this.scale - this.cy;
    return { x: this.px + (bx * this.cs + by * this.sn) / TS, y: this.py + (-bx * this.sn + by * this.cs) / TS };
  }

  // ------------------------------------------------------------ frame
  draw(g) {
    const dt = Math.min(0.05, Math.max(0, g.t - this.lastT)); this.lastT = g.t;
    this.setCam(g);
    this.consumeVfx(g);
    const b = this.b, BW = this.buf.width, BH = this.buf.height;
    // RotMG-smooth: the world is drawn at screen resolution (scaled), so things glide by single screen pixels
    b.setTransform(this.scale, 0, 0, this.scale, 0, 0); b.imageSmoothingEnabled = false;
    b.fillStyle = '#0a080c'; b.fillRect(0, 0, BW, BH);
    this.drawGround(g);
    // shake offsets the whole sprite layer + ground together
    const sh = this.shake > 0.3 ? [Math.round((Math.random() - 0.5) * this.shake), Math.round((Math.random() - 0.5) * this.shake)] : [0, 0];
    this.shake = Math.max(0, this.shake - dt * 18);
    b.save(); b.translate(sh[0], sh[1]);
    b.save(); b.translate(this.cx, this.cy); b.rotate(this.th);
    const G = this.ground.width;
    b.drawImage(this.ground, -G / 2 - (this.px * TS - Math.round(this.px * TS)), -G / 2 - (this.py * TS - Math.round(this.py * TS)));
    b.restore();
    // sprites, sorted by screen y
    const m = g.map, list = [];
    // each thing is drawn at whole buffer pixels (so its shadow, bar and sprite line up), then the whole group is
    // nudged by the leftover fraction at screen resolution: smooth motion with nothing jittering apart
    const add = (x, y, f) => {
      if (!g.seen(x, y)) return;                          // still under the fog of war
      const [sx, sy] = this.proj(x, y);
      if (sx > -60 && sy > -40 && sx < BW + 60 && sy < BH + 80) {
        const rx = Math.round(sx), ry = Math.round(sy);
        list.push({ sy, f: () => { b.save(); b.translate(sx - rx, sy - ry); f(rx, ry); b.restore(); } });
      }
    };
    for (const o of m.objects) add(o.x, o.y, (sx, sy) => this.obj(o, sx, sy));
    for (const pt of m.portals) add(pt.x, pt.y, (sx, sy) => this.portal(g, pt, sx, sy));
    for (const bag of g.bags) {                                // a bag on a portal is drawn in front of it, never hidden inside
      const onPortal = m.portals.some((pt) => Math.abs(pt.x - bag.x) < 1.8 && Math.abs(pt.y - bag.y) < 1.8);
      const n0 = list.length;
      add(bag.x, bag.y, (sx, sy) => this.bag(g, bag, sx, sy));
      if (onPortal && list.length > n0) list[n0].sy += 40;
    }
    for (const e of g.enemies) add(e.x, e.y, (sx, sy) => this.enemy(g, e, sx, sy));
    if (g.boss) add(g.boss.x, g.boss.y, (sx, sy) => this.boss(g, g.boss, sx, sy));
    add(g.player.x, g.player.y, (sx, sy) => this.player(g, g.player, sx, sy));
    for (const a of g.allies || []) add(a.x, a.y, (sx, sy) => (a.kind === 'kite' ? this.kiteSpr(g, a, sx, sy) : this.ally(g, a, sx, sy)));
    for (const d of g.decoys || []) add(d.x, d.y, (sx, sy) => this.decoy(g, d, sx, sy));
    for (const v of m.villagers || []) add(v.x, v.y, (sx, sy) => this.villager(g, v, sx, sy));
    for (const v of m.penPets || []) add(v.x, v.y, (sx, sy) => this.villager(g, v, sx, sy));        // pets in the Pet Yard
    if (g.pet && !g.player.dead) add(g.pet.x, g.pet.y, (sx, sy) => this.villager(g, g.pet, sx, sy)); // your companion
    if (m.belts) this.beltFx(g, m.belts);
    if (g.arena) this.arenaFx(g, g.arena);
    if (g.timeStop) this.timeDial(g, g.timeStop);
    for (const f of g.fx) if (f.kind === 'cloud' || f.kind === 'zone') this.groundFx(f, g);
    list.sort((a, c) => a.sy - c.sy);
    for (const d of list) d.f();
    if (g.player.hook) this.hookFx(g, g.player.hook);
    for (const f of g.fx) {
      if (f.kind === 'anvil') this.anvilFx(f, g);
      else if (f.kind === 'beam') this.beamFx(f, g);
      else if (f.kind === 'star') this.starFx(f, g);
      else if (f.kind === 'laser') this.laserFx(f, g);
      else if (f.kind === 'sweep') this.sweepFx(f, g);
      else if (f.kind === 'ring') this.ringFx(f);
      else if (f.kind === 'orbitals') this.orbitalsFx(f, g);
      else if (f.kind === 'mine') this.mineFx(f, g);
      else if (f.kind === 'constellation') this.constellationFx(f, g);
      else if (f.kind === 'meteor') this.meteorFx(f, g);
      else if (f.kind === 'scorch') this.scorchFx(f, g);
      else if (f.kind === 'hexzone') this.hexFx(f, g);
      else if (f.kind === 'lane') this.laneFx(f, g);
    }
    if (g.player.ward > 0 && !g.player.dead) this.wardFx(g);
    const darkFirst = g.map.lights && g.map.kind === 'dungeon';     // in a dungeon the dark falls under the bullets: shots always read
    if (darkFirst) { b.save(); b.setTransform(this.scale, 0, 0, this.scale, 0, 0); this.dusk(g); b.restore(); }   // the screen's own scale, without the shake
    if (g.map.kind === 'dungeon') this.d4Fx(g);                  // the newer dungeons' lights, beams and strings (over the dark)
    this.drawProjectiles(g, dt);
    this.drawZaps(dt);
    this.drawParticles(dt);
    this.drawSprFx(dt);
    if (g.darkUntil > g.t && g.darkBy && !g.darkBy.dead) this.darkFx(g);
    b.restore();
    if (g.map.lights && !darkFirst) this.dusk(g);
    if (!this.settings || this.settings.weather) this.drawWeather(g, dt);
    if (!this.settings || this.settings.vignette) b.drawImage(this.vig, 0, 0);
    // upscale + overlays
    const ctx = this.ctx, s = this.scale;
    b.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.hi, 0, 0);
    if (this.hurtFlash > 0) {
      ctx.fillStyle = `rgba(200,20,40,${Math.min(0.13, this.hurtFlash)})`;
      ctx.fillRect(0, 0, this.c.width, this.c.height);
      this.hurtFlash = Math.max(0, this.hurtFlash - dt * 0.9);
    }
    this.overlays(g);
    this.minimap(g);
  }

  // ------------------------------------------------------------ ground (rotates as one image)
  drawGround(g) {
    const m = g.map, gc = this.gctx, G = this.ground.width, W = this.W;
    const Px = Math.round(this.px * TS), Py = Math.round(this.py * TS);
    const ox = Px - G / 2, oy = Py - G / 2;
    gc.fillStyle = '#0a080c'; gc.fillRect(0, 0, G, G);
    const tiles = this.A.img.tiles, cols = W.tilesCols, edges = W.edges, prio = W.priority;
    const tx0 = Math.floor(ox / TS), ty0 = Math.floor(oy / TS), n = Math.ceil(G / TS) + 1;
    const cell = (i, x, y) => gc.drawImage(tiles, (i % cols) * TS, Math.floor(i / cols) * TS, TS, TS, x, y, TS, TS);
    const name = (x, y) => (x < 0 || y < 0 || x >= m.w || y >= m.h ? 'void' : TILE_NAMES[m.tiles[y * m.w + x]]);
    const anim = Math.floor(g.t * 2.2);
    if (!m.decorAt && m.decor) { m.decorAt = new Map(); for (const d of m.decor) m.decorAt.set(d.y * m.w + d.x, d.name); }
    for (let ty = ty0; ty < ty0 + n; ty++) {
      for (let tx = tx0; tx < tx0 + n; tx++) {
        const nm = name(tx, ty), T = W.tiles[nm];
        const dx = tx * TS - ox, dy = ty * TS - oy;
        const unseen = (x, y) => m.seen && (x < 0 || y < 0 || x >= m.w || y >= m.h || !m.seen[y * m.w + x]);
        if (unseen(tx, ty)) { gc.fillStyle = '#000'; gc.fillRect(dx, dy, TS, TS); continue; }
        const h = ((tx * 73856093) ^ (ty * 19349663)) >>> 0;
        const v = T.variants > 1 ? ((h >>> 4) ^ (h >>> 13)) % T.variants : 0;            // RotMG-style: variants scattered at random
        cell(T.i + v * T.frames + (T.frames > 1 ? (anim + ((tx * 7 + ty * 3) >> 2)) % T.frames : 0), dx, dy);
        const pm = prio[nm];
        const water = nm === 'water' || nm === 'deep';
        for (let d = 0; d < 4; d++) {
          const nn = name(tx + DIRS[d][0], ty + DIRS[d][1]);
          if (water) {
            if (prio[nn] !== undefined) cell(edges.foam + (anim % 3) * 4 + d, dx, dy);   // shoreline foam
          } else if (pm !== undefined && prio[nn] > pm) cell(edges[nn] + d, dx, dy);       // dithered biome blend
        }
        if (m.decorAt) {
          const dn = m.decorAt.get(ty * m.w + tx);
          if (dn && (h >>> 9) % 3 === 0) {                     // RotMG ground is mostly bare: only a third of the clutter
            const na = (W.decorAnim || {})[dn], k = W.decor[dn] + (na ? Math.floor(anim * 0.6 + tx * 0.7 + ty * 0.3) % na : 0), dc = W.decorCols;
            gc.drawImage(this.A.img.decor, (k % dc) * TS, Math.floor(k / dc) * TS, TS, TS, dx, dy, TS, TS);
          }
        }
      }
    }
    // ground light first, then the fog over it: the unexplored stays black, never tinted
    if (!this.settings || this.settings.groundLight !== false) {
      const L = this.lightFor(m);
      gc.imageSmoothingEnabled = true;
      gc.drawImage(L, tx0 + 2, ty0 + 2, n, n, tx0 * TS - ox, ty0 * TS - oy, n * TS, n * TS);
      gc.imageSmoothingEnabled = false;
    }
    if (m.seen) {                                          // the edge of the known world fades into the fog
      gc.fillStyle = '#000';
      for (let ty = ty0; ty < ty0 + n; ty++) for (let tx = tx0; tx < tx0 + n; tx++) if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h || !m.seen[ty * m.w + tx]) gc.fillRect(tx * TS - ox, ty * TS - oy, TS, TS);
      for (let ty = ty0; ty < ty0 + n; ty++) for (let tx = tx0; tx < tx0 + n; tx++) {
        if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h || !m.seen[ty * m.w + tx]) continue;
        let k = 0;
        for (let yy = -2; yy <= 2; yy++) for (let xx = -2; xx <= 2; xx++) {
          const x = tx + xx, y = ty + yy;
          if (x < 0 || y < 0 || x >= m.w || y >= m.h || !m.seen[y * m.w + x]) k = Math.max(k, 3 - Math.max(Math.abs(xx), Math.abs(yy)));
        }
        if (k) { gc.fillStyle = `rgba(0,0,0,${[0, 0.25, 0.5, 0.72][k]})`; gc.fillRect(tx * TS - ox, ty * TS - oy, TS, TS); }
      }
    }
  }
  // one pixel per tile: soft pools of shadow and warm light, padded by 2 so the edges sample cleanly
  lightFor(m) {
    if (m.lightCv) return m.lightCv;
    const cv = document.createElement('canvas'); cv.width = m.w + 4; cv.height = m.h + 4;
    const x = cv.getContext('2d'), img = x.createImageData(cv.width, cv.height), d = img.data;
    const hash = (i, j) => { let h = (i * 374761393 + j * 668265263) >>> 0; h = ((h ^ (h >>> 13)) * 1274126177) >>> 0; return (h & 0xffff) / 0xffff; };
    const noise = (u, v, s) => {
      const i = Math.floor(u / s), j = Math.floor(v / s), fu = u / s - i, fv = v / s - j;
      const su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv);
      const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), e = hash(i + 1, j + 1);
      return a + (b - a) * su + (c - a) * sv + (a - b - c + e) * su * sv;
    };
    for (let j = 0; j < cv.height; j++) {
      for (let i = 0; i < cv.width; i++) {
        const n = noise(i, j, 9) * 0.65 + noise(i + 99, j + 41, 4) * 0.35, o = (j * cv.width + i) * 4;
        if (n < 0.5) { d[o] = 10; d[o + 1] = 6; d[o + 2] = 22; d[o + 3] = Math.round(Math.min(1, (0.5 - n) * 2.4) * 50); }
        else { d[o] = 255; d[o + 1] = 232; d[o + 2] = 180; d[o + 3] = Math.round(Math.min(1, (n - 0.5) * 2.4) * 22); }
      }
    }
    x.putImageData(img, 0, 0);
    m.lightCv = cv;
    return cv;
  }

  // ------------------------------------------------------------ sprites
  shadow(sx, sy, w = 10) {
    const b = this.b, x = Math.round(sx), y = Math.round(sy);
    b.fillStyle = 'rgba(0,0,0,0.38)';
    b.fillRect(x - w / 2 + 1, y - 1, w - 2, 1); b.fillRect(x - w / 2, y, w, 1); b.fillRect(x - w / 2 + 1, y + 1, w - 2, 1);
  }
  // every sprite goes through here: drawn RotMG-style, with a thin black outline added at draw time (src/outline.js)
  spr(img, sx, sy, w, h, x, y, px, py, flip = false, flash = false) {
    const k = this.sprK || 1;                                // a sprite drawn bigger than life (a dungeon's warden)
    const b = this.b, dx = Math.round(x - px * k), dy = Math.round(y - py * k);
    if (flash) {
      const I = this.white(img, sx, sy, w, h);
      if (!flip) b.drawImage(I, dx, dy, w * k, h * k);
      else { b.save(); b.translate(dx + w * k, dy); b.scale(-1, 1); b.drawImage(I, 0, 0, w * k, h * k); b.restore(); }
      return;
    }
    const U = this.U || 1, I = outlinedFrame(img, sx, sy, w, h, U), P = I.pad / U * k, W = I.width / U * k, H = I.height / U * k;
    if (!flip) b.drawImage(I, dx - P, dy - P, W, H);
    else { b.save(); b.translate(dx - P + W, dy - P); b.scale(-1, 1); b.drawImage(I, 0, 0, W, H); b.restore(); }
  }
  // ---- a registry sprite (the Realm Update bundle, src/registry.js): native art at 2 buffer px per art px,
  // anchored at its foot (or centred), outlined like every other sprite. o: { flip, flash, alpha, rot, scale, center }
  drawDef(def, frame, x, y, o = {}) {
    const f = def.frames[frame] || def.frames[Object.keys(def.frames)[0]];
    if (!f) return;
    const b = this.b, K = 2 * (o.scale || 1), U = this.U || 1;
    const ax = o.center || o.rot !== undefined ? f.w / 2 : def.foot[0], ay = o.center || o.rot !== undefined ? f.h / 2 : def.foot[1];
    let I, pad = 0;
    if (o.flash) I = this.white(def.img, f.x, f.y, f.w, f.h);
    else if (def.outline) { I = outlinedFrame(def.img, f.x, f.y, f.w, f.h, U * K); pad = I.pad / U; }
    else I = null;
    const W = f.w * K, H = f.h * K, ga = b.globalAlpha;
    if (o.alpha !== undefined) b.globalAlpha = ga * o.alpha;
    const put = (dx, dy) => (I ? b.drawImage(I, dx - pad, dy - pad, W + 2 * pad, H + 2 * pad) : b.drawImage(def.img, f.x, f.y, f.w, f.h, dx, dy, W, H));
    if (o.rot !== undefined || o.flip) {
      b.save(); b.translate(Math.round(x), Math.round(y));
      if (o.rot !== undefined) b.rotate(o.rot);
      if (o.flip) b.scale(-1, 1);
      put(-Math.round(ax * K), -Math.round(ay * K));
      b.restore();
    } else put(Math.round(x - ax * K), Math.round(y - ay * K));
    b.globalAlpha = ga;
  }
  white(img, sx, sy, w, h) {                                // cached pure-white silhouette for hit flashes
    const key = `${img.src}|${sx}|${sy}|${w}|${h}`;
    let cv = this.flashCache.get(key);
    if (!cv) {
      cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const x = cv.getContext('2d');
      x.drawImage(img, sx, sy, w, h, 0, 0, w, h);
      x.globalCompositeOperation = 'source-in'; x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h);
      this.flashCache.set(key, cv);
    }
    return cv;
  }
  colorsOf(key, img, sx, sy, w, h) {                        // dominant sprite colours, for death bursts and trails
    if (this.colorCache.has(key)) return this.colorCache.get(key);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const x = cv.getContext('2d'); x.drawImage(img, sx, sy, w, h, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h).data, count = new Map();
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 200 || d[i] + d[i + 1] + d[i + 2] < 120) continue;
      const k = `rgb(${d[i]},${d[i + 1]},${d[i + 2]})`;
      count.set(k, (count.get(k) || 0) + 1);
    }
    const cols = [...count.entries()].sort((a, c) => c[1] - a[1]).slice(0, 4).map((e) => e[0]);
    this.colorCache.set(key, cols.length ? cols : ['#ffffff']);
    return this.colorCache.get(key);
  }
  obj(o, sx, sy) {
    if (o.hidden) return;
    if (o.interact === 'weak') {                             // a secret wall: drawn as plain wall (the tile), with the faintest hairline crack
      const b = this.b, x = Math.round(sx), y = Math.round(sy);
      b.globalAlpha = 0.28; b.fillStyle = '#05040a';
      b.fillRect(x - 2, y - 3, 1, 1); b.fillRect(x - 1, y - 2, 1, 1); b.fillRect(x, y - 2, 1, 1); b.fillRect(x + 1, y - 1, 1, 1);
      b.globalAlpha = 1;
      return;
    }
    if (o.trophy) return this.trophy(o, sx, sy);
    if (o.big) {
      const name = o.sprite.slice(3), Lm = this.W.landmarks[name], c = this.W.landmarksCols;
      const k = Lm.i + (Lm.frames > 1 ? Math.floor(this.lastT * 1.4 + o.x * 0.37) % Lm.frames : 0);
      this.shadow(sx, sy, 26);
      this.spr(this.A.img.landmarks, (k % c) * 32, Math.floor(k / c) * 32, 32, 32, sx, sy, 16, 31);
      return;
    }
    const resting = o.interact === 'shrine' && o.ready > this.lastT;               // a used shrine goes dark for a while
    const n = resting ? 0 : (this.W.objAnim || {})[o.sprite];
    const k = this.W.objects[o.sprite] + (n ? Math.floor(this.lastT * (o.sprite === 'campfire' ? 8 : 2.5) + o.x * 3) % n : 0), c = this.W.objectsCols;
    if (resting) this.b.globalAlpha = 0.55;
    const grand = o.sprite === 'admin_chest' || o.sprite === 'throne';          // grand things are drawn twice life-size
    if (grand) { this.sprK = 2; this.shadow(sx, sy, 24); }
    this.spr(this.A.img.objects, (k % c) * TS, Math.floor(k / c) * TS, TS, TS, sx, sy, 8, 8);
    this.sprK = 1;
    if (o.sprite === 'admin_chest' && Math.random() < 0.5) this.parts.push({ x: o.x + (Math.random() - 0.5) * 1.6, y: o.y, z: 4 + Math.random() * 24, vx: 0, vy: 0, vz: 6, g: 0, life: 0.8, max: 0.8, color: ['#ffe89a', '#c8a0ff', '#ffffff', '#ff3a5a'][Math.floor(Math.random() * 4)] });
    this.b.globalAlpha = 1;
    if (o.interact === 'chest' && !o.opened && o.maxHp && o.hp < o.maxHp) this.hpBar(sx, sy + 3, o.hp / o.maxHp, 16);   // a chest being broken open
    if (o.interact === 'shrine' && !resting && Math.random() < 0.12) this.parts.push({ x: o.x + (Math.random() - 0.5) * 0.4, y: o.y, z: 6, vx: 0, vy: 0, vz: 8, g: 0, life: 0.9, max: 0.9, color: '#ffffff' });
    if (o.sprite === 'campfire' && Math.random() < 0.35) {          // sparks + smoke climb out of the firepit
      const ember = Math.random() < 0.6;
      this.parts.push({ x: o.x + (Math.random() - 0.5) * 0.5, y: o.y, z: 8, vx: (Math.random() - 0.5) * 0.3, vy: 0, vz: ember ? 18 + Math.random() * 14 : 8,
        g: ember ? 0 : -2, life: ember ? 0.9 : 1.6, max: 1.6, color: ember ? (Math.random() < 0.5 ? '#ffc94a' : '#f2641a') : '#4a4458' });
    }
  }
  // a bone thrall: scuttles on its feet, rears up with claws raised, slashes; climbs out of the ground when summoned
  ally(g, a, sx, sy) {
    const fr = a.atkT > 0 ? (a.atkT > 0.15 ? 2 : 3) : a.moving ? Math.floor(g.t * 9 + a.ph) % 2 : Math.floor(g.t * 2 + a.ph) % 2;
    const k = (this.W.objects[a.sprite] ?? this.W.objects.thrall) + fr, c = this.W.objectsCols;
    if (a.life < 1 && Math.floor(g.t * 12) % 2) return;
    this.shadow(sx, sy, 8);
    const rise = Math.min(1, (g.t - (a.born || 0)) / 0.35);
    const L = { rise, flip: !!a.face, glow: false };
    this.liveSpr(this.A.img.objects, (k % c) * TS, Math.floor(k / c) * TS, TS, sx, sy + 1, 8, 15, L, false);
    if (Math.random() < 0.15) this.parts.push({ x: a.x, y: a.y, z: 10, vx: 0, vy: 0, vz: 5, g: 0, life: 0.4, max: 0.4, color: Math.random() < 0.5 ? '#5ef0c8' : '#e0fff6' });
  }
  // the trophy hall: a grey stone statue of every great foe you've felled
  trophy(o, sx, sy) {
    const k = this.W.objects.pedestal, c = this.W.objectsCols;
    this.spr(this.A.img.objects, (k % c) * TS, Math.floor(k / c) * TS, TS, TS, sx, sy, 8, 8);
    if (!(this.game && this.game.save.trophies || []).includes(o.trophy)) return;
    let img, x0, y0, F, out = 40;
    if (o.trophy === 'unstruck') { const S = this.A.sheets.unstruck; img = S.img; F = S.guide.frameWidth; x0 = 0; y0 = 0; }
    else if (o.trophy === 'fallen_heart') { const S = this.A.sheets.godheart; img = S.img; F = 64; x0 = 0; y0 = 0; out = 44; }
    else {
      const S = [this.A.sheets.realm_bosses, this.A.sheets.godking].find((x) => x && x.guide.bosses[o.trophy]);
      if (!S) return;
      img = S.img; F = S.guide.frameWidth; x0 = 0; y0 = S.guide.bosses[o.trophy].row * F; if (F > 48) out = 52;
    }
    const b = this.b;
    b.save(); b.filter = 'grayscale(1) brightness(1.15) contrast(1.05)';
    b.drawImage(img, x0, y0, F, F, Math.round(sx - out / 2), Math.round(sy - out + 1), out, out);
    b.restore();
  }
  villager(g, v, sx, sy) {
    const k = this.W.objects[v.sprite] + (v.moving ? Math.floor(g.t * 6) % 2 : 0), c = this.W.objectsCols;
    this.shadow(sx, sy, 8);
    this.spr(this.A.img.objects, (k % c) * TS, Math.floor(k / c) * TS, TS, TS, sx, sy, 8, 15, !!v.face);
    const aura = { rare: ['#7aa8ff', '#ffffff', 0.05], legendary: ['#ffd650', '#fff6c8', 0.1], divine: ['#ff7af0', '#8af6ff', 0.16] }[v.rarity];
    if (aura && Math.random() < aura[2]) {                // rarer pets glitter as they go
      this.parts.push({ x: v.x + (Math.random() - 0.5) * 0.8, y: v.y, z: 3 + Math.random() * 10, vx: 0, vy: 0, vz: 5 + Math.random() * 5, g: 0, life: 0.7, max: 0.7, color: aura[Math.random() < 0.6 ? 0 : 1] });
    }
  }
  // rotating laser sweeps around a boss: thin warning lines first, then the beams turn
  sweepFx(f, g) {
    const b = this.b, E = f.e, [ox, oy] = this.proj(...g.up(E.x, E.y, E === g.boss ? 2.3 : 1.4));
    const live = f.t >= f.tele, rot = live ? f.w * (f.t - f.tele) : 0;
    for (let k = 0; k < f.n; k++) {
      const a = f.a0 + (k / f.n) * Math.PI * 2 + rot, [ex, ey] = this.proj(...g.up(E.x, E.y, E === g.boss ? 2.3 : 1.4).map((v, i) => v + (i ? Math.sin(a) : Math.cos(a)) * f.len));
      const n = Math.max(2, Math.round(Math.hypot(ex - ox, ey - oy)));
      if (!live) {
        if (Math.floor(g.t * 14) % 2) continue;
        b.fillStyle = '#ff4a5a';
        for (let i = 0; i <= n; i += 3) b.fillRect(Math.round(ox + (ex - ox) * i / n), Math.round(oy + (ey - oy) * i / n), 1, 1);
        continue;
      }
      const px = -(ey - oy) / n, py = (ex - ox) / n;
      for (let i = 0; i <= n; i++) {
        const x = ox + (ex - ox) * i / n, y = oy + (ey - oy) * i / n;
        for (let w = -2; w <= 2; w++) {
          b.fillStyle = Math.abs(w) === 2 ? '#ff4a5a' : Math.abs(w) === 1 ? '#ffc94a' : '#ffffff';
          if (Math.abs(w) === 2 && (i + Math.floor(g.t * 30)) % 3 === 0) continue;
          b.fillRect(Math.round(x + px * w), Math.round(y + py * w), 1, 1);
        }
      }
    }
  }
  // a closing arena: a ring of red marks; the dark beyond it hurts
  arenaFx(g, A) {
    const b = this.b, [cx, cy] = this.proj(A.x, A.y), R = (A.r || A.r0) * TS;
    b.save();
    b.fillStyle = 'rgba(40,0,10,0.32)';
    b.beginPath(); b.rect(0, 0, this.buf.width, this.buf.height); b.ellipse(cx, cy, R, R, 0, 0, Math.PI * 2, true); b.fill('evenodd');
    b.restore();
    b.fillStyle = Math.floor(g.t * 8) % 2 ? '#ff4a5a' : '#ffc94a';
    for (let a = 0; a < 96; a++) {
      if (a % 3 === 2) continue;
      const t = (a / 96) * Math.PI * 2 + g.t * 0.5;
      b.fillRect(Math.round(cx + Math.cos(t) * R), Math.round(cy + Math.sin(t) * R), 1, 1);
    }
  }
  // ---- signature boss mechanics
  projAt(name, x, y, rot = 0) {
    const PI = this.A.img.projectiles, pc = this.W.projCols, PS = this.W.proj, k = this.W.projectiles[name] ?? 0, b = this.b;
    b.save(); b.translate(Math.round(x), Math.round(y)); b.rotate(rot); b.drawImage(PI, (k % pc) * PS, Math.floor(k / pc) * PS, PS, PS, -PS / 2, -PS / 2, PS, PS); b.restore();
  }
  orbitalsFx(f, g) {
    const r = f.r0 + (f.r1 - f.r0) * Math.min(1, f.t / f.life);
    for (let k = 0; k < f.n; k++) {
      const a = f.a0 + (k / f.n) * Math.PI * 2 + f.spin * f.t, [x, y] = this.proj(f.e.x + Math.cos(a) * r, f.e.y + Math.sin(a) * r);
      this.projAt(f.proj, x, y - 8, a + this.th + g.t * 6);
    }
  }
  mineFx(f, g) {
    const [x, y] = this.proj(f.x, f.y), k = Math.min(1, f.t / f.life), b = this.b;
    b.fillStyle = Math.floor(g.t * (6 + 20 * k)) % 2 ? '#ffe45c' : '#ffffff';
    for (let a = 0; a < 12; a++) { const t = (a / 12) * Math.PI * 2; b.fillRect(Math.round(x + Math.cos(t) * (10 - 6 * k)), Math.round(y + Math.sin(t) * (10 - 6 * k)), 1, 1); }
    this.projAt('star', x, y - 2, g.t * 3);
  }
  constellationFx(f, g) {
    const b = this.b, live = f.t >= f.tele, P = f.pts.map(([x, y]) => this.proj(x, y));
    b.strokeStyle = live ? (Math.floor(g.t * 14) % 2 ? '#ffffff' : '#8af6ff') : 'rgba(138,246,255,0.45)';
    b.lineWidth = live ? 2 : 1; b.beginPath();
    P.forEach(([x, y], k) => (k ? b.lineTo(x, y) : b.moveTo(x, y))); b.closePath(); b.stroke();
    for (const [x, y] of P) this.projAt('star', x, y, g.t * 2);
  }
  meteorFx(f, g) {
    const [x, y] = this.proj(f.x, f.y), R = f.r * TS, k = Math.min(1, f.t / f.delay), b = this.b;
    if (!f.done) {
      b.fillStyle = 'rgba(255,120,30,0.18)'; b.beginPath(); b.arc(x, y, R, 0, Math.PI * 2); b.fill();
      b.fillStyle = Math.floor(g.t * 12) % 2 ? '#ff8a1f' : '#ffd650';
      for (let a = 0; a < 48; a++) { const t = (a / 48) * Math.PI * 2; b.fillRect(Math.round(x + Math.cos(t) * R), Math.round(y + Math.sin(t) * R), 1, 1); }
      const drop = (1 - k) * (1 - k) * 160;                // the rock itself, falling
      b.fillStyle = '#ffd650'; b.fillRect(Math.round(x - 3), Math.round(y - 6 - drop), 6, 6);
      b.fillStyle = '#ffffff'; b.fillRect(Math.round(x - 2), Math.round(y - 5 - drop), 2, 2);
    }
  }
  scorchFx(f, g) {
    const [x, y] = this.proj(f.x, f.y), R = f.r * TS, b = this.b, fade = Math.min(1, (f.life - f.t) / 0.6);
    b.globalAlpha = 0.35 * fade; b.fillStyle = '#ff4a1a'; b.beginPath(); b.arc(x, y, R, 0, Math.PI * 2); b.fill(); b.globalAlpha = 1;
    if (Math.random() < 0.4) this.parts.push({ x: f.x + (Math.random() - 0.5) * f.r * 1.6, y: f.y + (Math.random() - 0.5) * f.r * 1.6, z: 0, vx: 0, vy: 0, vz: 10, g: 0, life: 0.5, max: 0.5, color: Math.random() < 0.5 ? '#ff8a1f' : '#ffd650' });
  }
  // Storm Kite: a kite riding high over its anchor, wire down to the ground, crackling
  kiteSpr(g, a, sx, sy) {
    const b = this.b, H = 26 + Math.round(Math.sin(g.t * 2 + a.ph) * 3), x = Math.round(sx), y = Math.round(sy);
    if (a.life < 1 && Math.floor(g.t * 12) % 2) return;
    b.fillStyle = 'rgba(0,0,0,0.3)'; b.fillRect(x - 3, y, 7, 1);
    b.fillStyle = '#c8742a'; for (let k = 0; k < H; k += 2) b.fillRect(x + Math.round(Math.sin(k * 0.3 + g.t * 3) * 1), y - k, 1, 1);   // the wire
    b.fillStyle = '#5a3a22'; b.fillRect(x - 1, y - 1, 3, 2);                     // stake
    const k = this.W.objects.kite + (Math.floor(g.t * 6 + a.ph) % 2), c = this.W.objectsCols;
    this.spr(this.A.img.objects, (k % c) * TS, Math.floor(k / c) * TS, TS, TS, x, y - H, 8, 14);
    if (Math.random() < 0.25) this.parts.push({ x: a.x + (Math.random() - 0.5), y: a.y, z: H, vx: 0, vy: 0, vz: -10, g: 0, life: 0.25, max: 0.25, color: Math.random() < 0.5 ? '#8af6ff' : '#ffffff' });
  }
  // Mirror Step: a reflection of you, flickering, slowly cracking
  decoy(g, d, sx, sy) {
    const p = g.player, C = CLASSES[p.cls], S = this.A.sheets[C.sheet], A = S.guide.animations;
    const lr = d.dir === 'left' || d.dir === 'right', name = lr && C.anim.side === 'mirror' ? 'side_idle' : `${d.dir}_idle`;
    const an = A[name] || A.front_idle, f = Math.floor(g.t * an.fps) % an.frames;
    this.shadow(sx, sy, 12);
    const flick = d.t < 0.8 ? Math.floor(g.t * 16) % 2 : 0;
    this.b.globalAlpha = flick ? 0.35 : 0.7;
    this.spr(S.img, (an.col + f) * 16, an.row * 16, 16, 16, sx, sy, 8, 15, d.dir === 'left' && lr);
    this.b.globalAlpha = 0.3;
    this.spr(S.img, (an.col + f) * 16, an.row * 16, 16, 16, sx, sy, 8, 15, d.dir === 'left' && lr, true);
    this.b.globalAlpha = 1;
    const b = this.b, crack = 1 - d.t / d.max;
    b.fillStyle = '#ffffff';
    for (let k = 0; k < Math.floor(crack * 6); k++) b.fillRect(Math.round(sx - 4 + k * 1.6), Math.round(sy - 12 + (k % 3) * 3), 1, 1);
  }
  // Stop Time: a brass dial on the ground, its hand frozen, the world inside it dimmed
  timeDial(g, T) {
    const b = this.b, [sx0, sy0] = this.proj(T.x, T.y), sx = Math.round(sx0), sy = Math.round(sy0), R = T.r * TS;
    const fade = Math.min(1, T.t / 0.4);
    b.save();
    b.globalAlpha = 0.2 * fade; b.fillStyle = '#c8c0d8';
    for (let y = -R; y <= R; y += 2) { const w = Math.round(R * Math.sqrt(Math.max(0, 1 - (y / R) ** 2))); b.fillRect(sx - w, sy + y, w * 2, 2); }
    b.globalAlpha = fade;
    for (let k = 0; k < 60; k++) {
      const a = (k / 60) * Math.PI * 2;
      b.fillStyle = k % 5 === 0 ? '#ffe08a' : '#8d88a0';
      if (k % 5 === 0 || k % 2 === 0) b.fillRect(Math.round(sx + Math.cos(a) * R), Math.round(sy + Math.sin(a) * R), 1, 1);
    }
    const ha = -Math.PI / 2 + (1 - T.t / T.dur) * Math.PI * 2;            // the hand sweeps once over the duration
    b.fillStyle = '#ffe08a';
    for (let k = 0; k < R * 0.8; k += 1) b.fillRect(Math.round(sx + Math.cos(ha) * k), Math.round(sy + Math.sin(ha) * k), 1, 1);
    b.restore();
  }
  // the grapple: a sagging line from the harpooner's hands to the hook
  hookFx(g, H) {
    const b = this.b, p = g.player;
    const [x0, y0] = this.proj(...g.up(p.x, p.y, 0.5)), [x1, y1] = this.proj(H.x, H.y);
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 2));
    for (let i = 0; i <= n; i++) {
      const t = i / n, sag = Math.sin(t * Math.PI) * (H.state === 'reel' ? 1 : 4);
      b.fillStyle = i % 3 ? '#c8a060' : '#7a5a32';
      b.fillRect(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t + sag), 1, 1);
    }
    const k = this.W.projectiles.grapple, pc = this.W.projCols, PS = this.W.proj;
    b.save(); b.translate(Math.round(x1), Math.round(y1)); b.rotate(H.a + this.th + Math.PI / 4);
    b.drawImage(this.A.img.projectiles, (k % pc) * PS, Math.floor(k / pc) * PS, PS, PS, -PS / 2, -PS / 2, PS, PS); b.restore();
  }
  // lingering ground effects: incense / bile clouds, boss slam telegraphs
  groundFx(f, g) {
    const b = this.b, [sx0, sy0] = this.proj(f.x, f.y), sx = Math.round(sx0), sy = Math.round(sy0), R = f.r * TS;
    if (f.kind === 'cloud') {
      const cols = f.color === 'bile' ? ['#8db03a', '#d4ff5a', '#4a5a2a'] : ['#8a6aa8', '#c8b8e8', '#5a4a68'];
      const fade = Math.min(1, (f.life - f.t) / 0.6);
      for (let k = 0; k < 26 * fade; k++) {
        const a = k * 2.4 + g.t * (k % 2 ? 0.8 : -0.6), d = (k % 5) / 5 * R;
        b.fillStyle = cols[k % 3];
        b.fillRect(Math.round(sx + Math.cos(a) * d), Math.round(sy + Math.sin(a) * d * 0.5 - (k % 3)), 2, 1);
      }
      return;
    }
    if (f.done) return;                                     // zone: a red warning ring that fills as it arms
    const k = Math.min(1, f.t / f.delay);
    b.fillStyle = 'rgba(160,10,30,0.22)';
    const rx = Math.round(R * k), ry = rx;
    for (let y = -ry; y <= ry; y++) { const w = Math.round(rx * Math.sqrt(1 - (y / Math.max(1, ry)) ** 2)); b.fillRect(sx - w, sy + y, w * 2, 1); }
    b.fillStyle = Math.floor(g.t * 14) % 2 ? '#ff4a5a' : '#ffc94a';
    for (let a = 0; a < 48; a++) {
      if (a % 4 === 3) continue;
      const t = (a / 48) * Math.PI * 2;
      b.fillRect(Math.round(sx + Math.cos(t) * R), Math.round(sy + Math.sin(t) * R), 1, 1);
    }
  }
  // an enemy laser: a flickering red warning line, then a searing beam with a white core
  laserFx(f, g) {
    const b = this.b, [x0, y0] = this.proj(f.x0, f.y0), [x1, y1] = this.proj(f.x0 + Math.cos(f.a) * f.len, f.y0 + Math.sin(f.a) * f.len);
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0)));
    if (f.t < f.tele) {
      if (Math.floor(g.t * 16) % 2) return;
      b.fillStyle = '#ff4a5a';
      for (let i = 0; i <= n; i += 2) b.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1);
      return;
    }
    const k = f.t - f.tele, w = k < f.act ? 2 : k < f.act + 0.1 ? 1 : 0;
    if (!w) return;
    const px = -(y1 - y0) / n, py = (x1 - x0) / n;
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
      for (let o = -w; o <= w; o++) {
        b.fillStyle = Math.abs(o) === w ? f.col : '#ffffff';
        b.fillRect(Math.round(x + px * o), Math.round(y + py * o), 1, 1);
      }
    }
  }
  starFx(f, g) {                                            // Starfall Knuckles: a star falls on the target
    const b = this.b, [sx0, sy0] = this.proj(f.x, f.y), sx = Math.round(sx0), sy = Math.round(sy0);
    if (f.done) return;
    const k = Math.min(1, f.t / f.delay), y = Math.round(sy - (1 - k) * 90), x = Math.round(sx + (1 - k) * 30);
    b.fillStyle = '#8af6ff'; for (let i = 1; i < 10; i++) b.fillRect(x + i * 2, y - i * 3, 1, 2);
    b.fillStyle = '#ffffff'; b.fillRect(x - 1, y - 1, 3, 3);
    b.fillStyle = 'rgba(138,246,255,0.5)';
    for (let a = 0; a < 24; a++) { const t = (a / 24) * Math.PI * 2; b.fillRect(Math.round(sx + Math.cos(t) * f.r * TS * k), Math.round(sy + Math.sin(t) * f.r * TS * k), 1, 1); }
  }
  // the forge's conveyor belts: rows of chevrons marching the way the belt runs
  beltFx(g, belts) {
    const b = this.b, p = g.player, off = (g.t * 2.4) % 1;
    b.save(); b.lineWidth = 1.5; b.lineCap = 'round';
    for (const B of belts) {
      if (B.x1 < p.x - 16 || B.x0 > p.x + 16 || B.y1 < p.y - 16 || B.y0 > p.y + 16) continue;
      const along = B.dx ? [B.x0, B.x1] : [B.y0, B.y1], across = B.dx ? [B.y0, B.y1] : [B.x0, B.x1];
      for (let u = Math.floor(along[0]); u < along[1]; u++) for (let v = across[0]; v < across[1]; v++) {
        if (v === ((across[0] + across[1] - 1) >> 1)) continue;       // the slag channel down the middle
        const w = u + ((B.dx || B.dy) > 0 ? off : 1 - off);
        const wx = B.dx ? w : v + 0.5, wy = B.dx ? v + 0.5 : w, d = B.dx || B.dy;
        if (!g.seen(wx, wy)) continue;
        const [x0, y0] = this.proj(wx - (B.dx ? d * 0.18 : 0.28), wy - (B.dy ? d * 0.18 : 0.28));
        const [x1, y1] = this.proj(wx + (B.dx ? d * 0.18 : 0), wy + (B.dy ? d * 0.18 : 0));
        const [x2, y2] = this.proj(wx - (B.dx ? d * 0.18 : -0.28), wy - (B.dy ? d * 0.18 : -0.28));
        b.strokeStyle = 'rgba(255,170,60,0.55)';
        b.beginPath(); b.moveTo(x0, y0); b.lineTo(x1, y1); b.lineTo(x2, y2); b.stroke();
      }
    }
    b.restore();
  }
  // ---- the four newer dungeons' effects (src/dungeons4.js): lights, beams, strings, curtains, the dream
  d4Fx(g) {
    const b = this.b, m = g.map, S = m.d4 || {}, p = g.player, P = (x, y) => this.proj(x, y);
    b.save();
    // theatre spotlights: warm pools that sweep the house
    for (const L of S.spots || []) {
      if (Math.abs(L.x - p.x) > 20 || Math.abs(L.y - p.y) > 20) continue;
      const [x, y] = P(L.x, L.y), R0 = L.r * TS, hot = Math.min(1, L.on / 0.6);
      b.globalCompositeOperation = 'lighter';
      const gr = b.createRadialGradient(x, y, 0, x, y, R0);
      gr.addColorStop(0, `rgba(255,240,190,${0.22 + hot * 0.25})`); gr.addColorStop(0.8, `rgba(255,220,150,${0.12 + hot * 0.2})`); gr.addColorStop(1, 'rgba(255,220,150,0)');
      b.fillStyle = gr; b.beginPath(); b.ellipse(x, y, R0, R0 * 0.8, 0, 0, Math.PI * 2); b.fill();
      b.globalCompositeOperation = 'source-over';
      if (hot > 0.05) { b.strokeStyle = `rgba(255,74,90,${hot})`; b.lineWidth = 1; b.beginPath(); b.ellipse(x, y, R0, R0 * 0.8, 0, 0, Math.PI * 2); b.stroke(); }
    }
    // mirror-chamber beams
    const beam = (pts, w, col, glow) => {
      if (!pts || pts.length < 2) return;
      b.globalCompositeOperation = 'lighter';
      b.lineCap = 'round'; b.lineJoin = 'round';
      for (const [lw, c] of [[w * 3, glow], [w, col]]) {
        b.strokeStyle = c; b.lineWidth = lw; b.beginPath();
        pts.forEach(([x, y], i) => { const [sx, sy] = P(x, y - 0.5); if (i) b.lineTo(sx, sy); else b.moveTo(sx, sy); });
        b.stroke();
      }
      b.globalCompositeOperation = 'source-over';
    };
    for (const B of m.beams || []) beam(B.path, 2, B.lit ? '#ffffff' : '#fffbe0', B.lit ? 'rgba(200,160,255,0.35)' : 'rgba(255,240,180,0.22)');
    // lens sentries: a thin sight-line, red when it has you
    for (const o of m.objects) {
      if (!o.sentry || o.ang === undefined || Math.abs(o.x - p.x) > 14 || Math.abs(o.y - p.y) > 14) continue;
      const [x0, y0] = P(o.x, o.y - 0.6), [x1, y1] = P(o.x + Math.cos(o.ang) * 10, o.y - 0.6 + Math.sin(o.ang) * 10);
      b.strokeStyle = o.lock > 0 ? `rgba(255,74,90,${0.5 + o.lock})` : 'rgba(255,251,224,0.28)'; b.lineWidth = 1;
      b.setLineDash([3, 3]); b.beginPath(); b.moveTo(x0, y0); b.lineTo(x1, y1); b.stroke(); b.setLineDash([]);
    }
    // the Wyrm's lens pedestals: heat rings, and the focused beam
    for (const Pd of S.peds || []) {
      const [x, y] = P(Pd.o.x, Pd.o.y);
      b.strokeStyle = Pd.cool ? 'rgba(120,120,140,0.7)' : '#fffbe0'; b.lineWidth = 1;
      b.beginPath(); b.arc(x, y - 2, 9, 0, Math.PI * 2); b.stroke();
      if (Pd.heat > 0) { b.strokeStyle = Pd.heat > 0.75 ? '#ff4a5a' : '#ffd650'; b.lineWidth = 2; b.beginPath(); b.arc(x, y - 2, 9, -Math.PI / 2, -Math.PI / 2 + Pd.heat * Math.PI * 2); b.stroke(); }
      if (Pd.cool) { b.fillStyle = 'rgba(255,255,255,0.8)'; b.font = '6px monospace'; b.fillText(Math.ceil(Pd.cool), x - 2, y - 14); }
      if (Pd.beam) beam([[Pd.beam.x0, Pd.beam.y0 + 0.5], [Pd.beam.x1, Pd.beam.y1 + 0.5]], 3, '#ffffff', 'rgba(255,240,170,0.45)');
    }
    // the Puppeteer's strings, from his hands up to each hanging marionette
    for (const e of g.enemies) {
      if (!e.strung || e.dead || e.hidden) continue;
      const [ex, ey] = P(e.x, e.y - 2.6);
      for (const a of e.strung) {
        if (a.dead) continue;
        const [ax, ay] = P(a.x, a.y - 1.2);
        b.strokeStyle = 'rgba(255,240,200,0.75)'; b.lineWidth = 1;
        b.beginPath(); b.moveTo(ex, ey); b.quadraticCurveTo((ex + ax) / 2, Math.min(ey, ay) - 18, ax, ay); b.stroke();
      }
    }
    // the curtain: velvet drawing in from both wings
    if (S.curtain) {
      const C = S.curtain, k = g.curtainK(C), half = C.box.w * C.close * k;
      for (const side of [0, 1]) {
        const xa = side ? C.box.x + C.box.w - half : C.box.x, xb = side ? C.box.x + C.box.w : C.box.x + half;
        const c0 = P(xa, C.box.y), c1 = P(xb, C.box.y), c2 = P(xb, C.box.y + C.box.h), c3 = P(xa, C.box.y + C.box.h);
        b.fillStyle = k > 0.85 ? 'rgba(150,20,40,0.78)' : 'rgba(150,20,40,0.45)';
        b.beginPath(); b.moveTo(...c0); b.lineTo(...c1); b.lineTo(...c2); b.lineTo(...c3); b.closePath(); b.fill();
        b.strokeStyle = 'rgba(255,214,80,0.8)'; b.lineWidth = 1; b.stroke();
      }
    }
    // the sunbeam: a pale column narrowing onto you
    if (S.sun) {
      const SB = S.sun, [x, y] = P(SB.x, SB.y), R0 = SB.r * TS, live = SB.t > 0.7;
      b.globalCompositeOperation = 'lighter';
      const gr = b.createRadialGradient(x, y, 0, x, y, R0 * 1.4);
      gr.addColorStop(0, live ? 'rgba(255,255,230,0.7)' : 'rgba(255,255,230,0.25)'); gr.addColorStop(1, 'rgba(255,240,170,0)');
      b.fillStyle = gr; b.beginPath(); b.arc(x, y, R0 * 1.4, 0, Math.PI * 2); b.fill();
      b.fillStyle = live ? 'rgba(255,255,220,0.18)' : 'rgba(255,255,220,0.08)'; b.fillRect(x - R0 * 0.6, y - 200, R0 * 1.2, 200);
      b.globalCompositeOperation = 'source-over';
      if (!live && Math.floor(g.t * 12) % 2) { b.strokeStyle = '#ff4a5a'; b.beginPath(); b.arc(x, y, R0, 0, Math.PI * 2); b.stroke(); }
    }
    // honey drips: a shadow that grows before the drop lands
    for (const Dp of S.drips || []) {
      if (Dp.done) continue;
      const [x, y] = P(Dp.x, Dp.y), k = 1 - Math.max(0, Dp.t) / Dp.T;
      b.fillStyle = `rgba(90,50,0,${0.2 + k * 0.35})`; b.beginPath(); b.ellipse(x, y, Dp.r * TS * k, Dp.r * TS * k * 0.7, 0, 0, Math.PI * 2); b.fill();
      b.strokeStyle = '#ffb830'; b.lineWidth = 1; b.beginPath(); b.ellipse(x, y, Dp.r * TS, Dp.r * TS * 0.7, 0, 0, Math.PI * 2); b.stroke();
    }
    // fading bridges: they shimmer before they go
    for (const sp of m.spans || []) {
      if (!sp.warn || Math.floor(g.t * 10) % 2 === 0) continue;
      b.fillStyle = 'rgba(255,122,184,0.35)';
      for (const i of sp.tiles) {
        const x = i % m.w, y = Math.floor(i / m.w);
        if (Math.abs(x - p.x) > 14 || Math.abs(y - p.y) > 14) continue;
        const [sx, sy] = P(x + 0.5, y + 0.5); b.fillRect(sx - 6, sy - 6, 12, 12);
      }
    }
    // the dream turned nightmare: the room bleeds red
    if (S.shift) { b.fillStyle = `rgba(120,0,40,${0.16 + Math.sin(g.t * 3) * 0.05})`; b.fillRect(0, 0, this.buf.width, this.buf.height); }
    if (g.invertUntil > g.t) { b.fillStyle = `rgba(180,120,255,${0.08 + Math.sin(g.t * 6) * 0.04})`; b.fillRect(0, 0, this.buf.width, this.buf.height); }
    // over you: the mask you carry, how drowsy you are, the Zs of sleep
    if (!p.dead) {
      const [px, py] = P(p.x, p.y);
      if (p.carry) {
        const k = this.W.objects[p.carry], c = this.W.objectsCols;
        if (k !== undefined) b.drawImage(this.A.img.objects, (k % c) * TS, Math.floor(k / c) * TS, TS, TS, Math.round(px - 8), Math.round(py - 34 + Math.sin(g.t * 4) * 1.5), TS, TS);
      }
      if (p.drowsy > 0.02) {
        b.fillStyle = 'rgba(10,8,20,0.8)'; b.fillRect(Math.round(px - 11), Math.round(py + 4), 22, 4);
        b.fillStyle = p.drowsy > 0.75 ? '#ff7ab8' : '#c8b0ff'; b.fillRect(Math.round(px - 10), Math.round(py + 5), Math.round(20 * p.drowsy), 2);
      }
      if (p.status.asleep > 0) { b.fillStyle = '#e8e0ff'; b.font = '8px monospace'; b.fillText('z', px + 6, py - 22 - (g.t * 10 % 6)); b.fillText('Z', px + 10, py - 28 - (g.t * 8 % 6)); }
    }
    b.restore();
  }
  // the nexus at dusk: the world dims, and warm light pools around the fire and the lamps
  dusk(g) {
    const BW = this.buf.width, BH = this.buf.height;
    if (!this.duskCv || this.duskCv.width !== BW || this.duskCv.height !== BH) {
      this.duskCv = document.createElement('canvas'); this.duskCv.width = BW; this.duskCv.height = BH;
    }
    const x = this.duskCv.getContext('2d');
    x.globalCompositeOperation = 'source-over';
    x.clearRect(0, 0, BW, BH);
    x.fillStyle = g.map.ambient || 'rgba(16,10,44,0.42)'; x.fillRect(0, 0, BW, BH);
    x.globalCompositeOperation = 'destination-out';
    const flick = 0.92 + Math.sin(g.t * 13) * 0.04 + Math.sin(g.t * 7.3) * 0.04;
    const src = g.map.kind === 'dungeon' && !g.player.dead ? [...g.map.lights, { x: g.player.x, y: g.player.y - 0.5, r: 92, col: '#fff0d0' }] : g.map.lights;   // in a dungeon you carry a light
    const lights = [];
    for (const L of src) { if (!g.seen(L.x, L.y)) continue; const [lx, ly] = this.proj(L.x, L.y); if (lx < -L.r || ly < -L.r || lx > BW + L.r || ly > BH + L.r) continue; lights.push({ lx, ly, R: L.r * (L.fire ? flick + Math.sin(g.t * 9 + L.x) * 0.03 : 1), fire: L.fire, col: L.col }); }
    for (const L of lights) {
      if (L.lx < -L.R || L.ly < -L.R || L.lx > BW + L.R || L.ly > BH + L.R) continue;
      const gr = x.createRadialGradient(L.lx, L.ly, 0, L.lx, L.ly, L.R);
      gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = gr; x.fillRect(L.lx - L.R, L.ly - L.R, L.R * 2, L.R * 2);
    }
    this.b.drawImage(this.duskCv, 0, 0);
    const b = this.b;
    b.save(); b.globalCompositeOperation = 'lighter';
    for (const L of lights) {
      if (L.lx < -L.R || L.ly < -L.R || L.lx > BW + L.R || L.ly > BH + L.R) continue;
      const gr = b.createRadialGradient(L.lx, L.ly, 0, L.lx, L.ly, L.R * 0.8);
      const c = L.col ? [parseInt(L.col.slice(1, 3), 16), parseInt(L.col.slice(3, 5), 16), parseInt(L.col.slice(5, 7), 16)] : (L.fire ? [255, 140, 40] : [255, 200, 90]);
      gr.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${L.fire ? 0.3 : 0.22})`); gr.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
      b.fillStyle = gr; b.fillRect(L.lx - L.R, L.ly - L.R, L.R * 2, L.R * 2);
    }
    b.restore();
  }
  portal(g, pt, sx, sy) {
    if (pt.life !== undefined && pt.life < 6 && Math.floor(g.t * 8) % 2) return;     // flickers before it closes
    const k = this.W.portals[pt.kind] + (Math.floor(g.t * 6) % 3), c = this.W.objectsCols;
    this.spr(this.A.img.objects, (k % c) * TS, Math.floor(k / c) * TS, TS, TS, sx, sy, 8, 8);
    if (Math.random() < 0.3) this.parts.push({ x: pt.x + (Math.random() - 0.5) * 0.6, y: pt.y, z: 4 + Math.random() * 6, vx: 0, vy: 0, vz: 14, g: 0, life: 0.6, max: 0.6, color: { realm: '#3befff', dungeon: '#ffc94a', nexus: '#fffdf0' }[pt.kind] || '#fff' });
  }
  bag(g, bag, sx, sy) {
    const k = this.W.bags[bag.kind] ?? this.W.bags.brown, c = this.W.objectsCols;
    if (bag.rare) {                                        // a beam of light: white, gold for starfall, crimson for divine
      const b = this.b, col = { starfall: '#ffd650', divine: '#ff4a5a' }[bag.kind] || '#dfe8ff';
      const x = Math.round(sx), y = Math.round(sy);
      for (let yy = 6; yy < 80; yy++) {
        if ((yy + Math.floor(g.t * 24)) % 7 < 2) continue;
        b.fillStyle = yy % 5 === 0 ? '#ffffff' : col;
        b.fillRect(x, y - yy, 1, 1);
        if (yy < 30 && yy % 2) b.fillRect(x + (yy % 4 ? -1 : 1), y - yy, 1, 1);
      }
    }
    if (bag.t0 === undefined) bag.t0 = g.t;
    const age = g.t - bag.t0, hop = age < 0.5 ? Math.round(Math.abs(Math.sin(age * Math.PI * 4)) * 8 * (1 - age / 0.5)) : 0;
    this.shadow(sx, sy, 8);
    this.spr(this.A.img.objects, (k % c) * TS, Math.floor(k / c) * TS, TS, TS, sx, sy - hop, 8, 13);
    if (g.hoverBag === bag) this.bagPeek(bag, sx, sy - hop);
    if (Math.floor(g.t * 0.7 + bag.x) % 3 === 0 && Math.floor(g.t * 14) % 7 === 0) {        // an occasional glint
      this.b.fillStyle = '#ffffff'; this.b.fillRect(Math.round(sx) + 2, Math.round(sy) - 10 - hop, 1, 1);
    }
  }
  champion(g, e, sx, sy) {
    const S = this.A.sheets.champions, Gd = S.guide, F = Gd.frameWidth, row = Gd.champions[e.id].row;
    if (e.under) return this.mound(g, e, sx, sy, 14);
    let col;
    if (e.dead) col = 6 + Math.min(2, Math.floor(e.deadT * 8));
    else if (e.state === 'tell') col = 4;
    else if (e.state === 'attack') col = 5;
    else col = Math.floor(g.t * (e.hop || e.sk || e.dive ? 10 : 6) + e.phase) % 4;
    const L = this.alive(g, e, sx, sy, F);
    if (!e.dead) this.shadow(sx, sy, Math.max(8, 18 - L.z * 0.6));
    this.sprK = e.warden ? 1.5 : 1;
    this.liveSpr(S.img, col * F, row * F, F, sx + L.dx, sy + L.dy - L.z, Gd.pivot.x, Gd.pivot.y, L, false);
    this.sprK = 1;
    if (e.dead) return;
    this.mechanicFx(g, e, sx + L.dx, sy + L.dy - L.z, S.img, col * F, row * F, F, L);
    if (e.stunT > 0) this.stunStars(g, sx, sy, 26);
    if (e.warden && Math.random() < 0.5) this.parts.push({ x: e.x + (Math.random() - 0.5) * 1.2, y: e.y, z: 4 + Math.random() * 18, vx: 0, vy: 0, vz: 5, g: 0, life: 0.7, max: 0.7, color: Math.random() < 0.5 ? '#ff4a5a' : '#ffd650' });
    if (e.herald || e.warden) {                       // bobbing crown-marker: this one matters (crimson for a seal's warden)
      const b = this.b, x = Math.round(sx), y = Math.round(sy) - 30 - (Math.floor(g.t * 3) % 2);
      b.fillStyle = e.warden ? '#ff4a5a' : '#f2c14e';
      for (const [dx, dy] of [[-2, 0], [0, -1], [2, 0], [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1]]) b.fillRect(x + dx, y + dy, 1, 1);
      this.hpBar(sx, sy + 3, e.hp / e.maxHp, 20);
    } else if (e.hp < e.maxHp) this.hpBar(sx, sy + 3, e.hp / e.maxHp, 16);
  }
  enemy(g, e, sx, sy) {
    if (e.hidden) return;                                   // the Puppeteer, offstage during his intermission
    if (e.rb) return this.realmBoss(g, e, sx, sy);
    if (e.D.sheet === 'champions') return this.champion(g, e, sx, sy);
    const S = this.A.sheets.enemies, meta = S.guide.enemies[e.id];
    if (e.under) return this.mound(g, e, sx, sy, 10);
    let col;
    if (e.dead) col = 6 + Math.min(2, Math.floor(e.deadT * 8));
    else if (e.state === 'tell' || e.state === 'charge') col = 4;
    else if (e.state === 'attack') col = 5;
    else col = Math.floor(g.t * (e.hop || e.sk || e.dive ? 11 : 7) + e.phase) % 4;      // contact, rise, contact, settle
    const L = this.alive(g, e, sx, sy, 16);
    if (!e.dead) this.shadow(sx, sy, Math.max(6, (e.warden ? 24 : e.D.elite ? 14 : 12) - L.z * 0.5));
    this.sprK = e.warden ? 2 : e.D.scale || 1;
    this.liveSpr(S.img, col * 16, meta.row * 16, 16, sx + L.dx, sy + L.dy - L.z, 8, 15, L, false);
    this.sprK = 1;
    if (!e.dead) this.mechanicFx(g, e, sx + L.dx, sy + L.dy - L.z, S.img, col * 16, meta.row * 16, 16, L);
    if (!e.dead && e.elite && Math.random() < (e.warden ? 0.6 : 0.35)) this.parts.push({ x: e.x + (Math.random() - 0.5) * 0.8, y: e.y, z: 4 + Math.random() * 12, vx: 0, vy: 0, vz: 4, g: 0, life: 0.6, max: 0.6, color: Math.random() < 0.5 ? (e.warden ? '#ff4a5a' : '#ffd650') : '#ffffff' });
    if (!e.dead && e.hp < e.maxHp) this.hpBar(sx, sy + 3, e.hp / e.maxHp, 12);
    if (!e.dead && e.stunT > 0) this.stunStars(g, sx, sy, 18);
  }
  // per-frame body language: integer pixel offsets only, so the art stays crisp
  alive(g, e, sx, sy, F, big = false) {
    const out = { dx: 0, dy: 0, flip: false, rise: 1, z: 0, glow: false };
    if (e.dead) { out.flip = !!e.face; return out; }
    // height: mid-hop, or a flier bobbing on the air (it drops low when it dives)
    out.z = Math.round(e.z || 0);
    if (e.D.fly) out.z += Math.round((e.dive ? 2 : 6) + Math.sin(g.t * 3 + e.phase) * 2);
    if (e.state === 'tell' && Math.floor(g.t * 12) % 2) out.glow = true;       // the tell flashes: get ready
    if (e.blinkTo) { out.glow = Math.floor(g.t * 16) % 2 === 0; this.blinkMark(g, e.blinkTo); }   // about to teleport: shimmer + landing mark
    if (e.digT !== undefined || e.diveWarn !== undefined) out.dx += Math.floor(g.t * 40) % 2 ? 1 : -1;   // about to dig in / dive
    if (e.diveWarn !== undefined) out.z += 4;
    const tx = this.cx - sx, ty = this.cy - sy, d = Math.hypot(tx, ty) || 1;
    if (!big) {                                          // turn to face the player (with hysteresis)
      if (tx > 5) e.face = true; else if (tx < -5) e.face = false;
      out.flip = !!e.face;
    }
    const k = big ? 3 : 2;
    if (e.state === 'tell' || e.state === 'charge') {    // the wind-up: a menacing tremble
      if (Math.floor(g.t * 30 + e.phase) % 2) out.dx += (Math.floor(g.t * 60) % 2 ? 1 : -1);
    } else if (e.state === 'attack') {                   // the strike: lunge at the player
      out.dx += Math.round((tx / d) * k); out.dy += Math.round((ty / d) * k);
    }
    if (e.hurtT > 0.03) { out.dx -= Math.round(tx / d); out.dy -= Math.round(ty / d); }   // recoil
    if (e.born !== undefined && g.t - e.born < 0.45 && g.t > 1) {
      out.rise = Math.max(0.1, (g.t - e.born) / 0.45);
      if (!e.dusted) {
        e.dusted = true;
        for (let i = 0; i < (big ? 18 : 8); i++) {
          const a = Math.random() * Math.PI * 2;
          this.parts.push({ x: e.x + Math.cos(a) * 0.35, y: e.y + Math.sin(a) * 0.2, z: 1, vx: Math.cos(a) * 1.4, vy: Math.sin(a) * 0.8,
            vz: 6 + Math.random() * 10, g: 30, life: 0.5, max: 0.5, color: i % 3 ? '#5a4e44' : '#8a7e6a' });
        }
      }
    }
    return out;
  }
  liveSpr(img, sx, sy, F, x, y, px, py, L, flash) {
    if (L.rise >= 1) {
      this.spr(img, sx, sy, F, F, x, y, px, py, L.flip, flash);
      if (L.glow && !flash) { this.b.globalAlpha = 0.35; this.spr(img, sx, sy, F, F, x, y, px, py, L.flip, true); this.b.globalAlpha = 1; }
      return;
    }
    // rising out of the ground: sink the sprite and clip everything below its feet line
    const sink = Math.round((py + 1) * (1 - L.rise)), b = this.b, gy = Math.round(y) + 1;
    b.save(); b.beginPath(); b.rect(Math.round(x - px) - 2, gy - F - 4, F + 4, F + 4); b.clip();
    this.spr(img, sx, sy, F, F, x, y + sink, px, py, L.flip, flash);
    b.restore();
  }
  // what a monster's mechanic looks like: a guard's raised shield, an enraged red flush, a bomber about to pop
  mechanicFx(g, e, x, y, img, sx, sy, F, L) {
    const b = this.b;
    if (e.enraged && Math.floor(g.t * 8) % 2) {
      b.save(); b.globalAlpha = 0.35; b.filter = 'none';
      const red = this.tinted(img, sx, sy, F, '#ff2a3a');
      if (L.flip) { b.translate(Math.round(x - F / 2) + F, Math.round(y - F + 1)); b.scale(-1, 1); b.drawImage(red, 0, 0); }
      else b.drawImage(red, Math.round(x - F / 2), Math.round(y - F + 1));
      b.restore();
      if (Math.random() < 0.2) this.parts.push({ x: e.x + (Math.random() - 0.5) * 0.6, y: e.y, z: 10, vx: 0, vy: 0, vz: 10, g: 0, life: 0.4, max: 0.4, color: '#ff4a5a' });
    }
    if (e.D.guard && e.state === 'move') {                // the shield is up: a glint on the side facing you
      const tx = this.cx - x, ty = this.cy - y, d = Math.hypot(tx, ty) || 1;
      const gx = Math.round(x + (tx / d) * F * 0.45), gy = Math.round(y - F * 0.45 + (ty / d) * F * 0.3);
      b.fillStyle = Math.floor(g.t * 6) % 2 ? '#ffffff' : '#a8b8d8';
      b.fillRect(gx, gy - 2, 1, 4); b.fillRect(gx - 1, gy - 1, 3, 1);
    }
    if (e.fuseT !== undefined) {                          // swelling: flashing faster and faster
      const k = Math.max(0, e.fuseT / e.D.bomb.fuse), fast = Math.floor(g.t * (8 + (1 - k) * 30)) % 2;
      if (fast) { b.globalAlpha = 0.7; this.spr(img, sx, sy, F, F, x, y, F / 2, F - 1, L.flip, true); b.globalAlpha = 1; }
    }
  }
  tinted(img, sx, sy, F, col) {
    const key = `${img.src}|${sx}|${sy}|${F}|${col}`;
    this.tintCache = this.tintCache || new Map();
    let cv = this.tintCache.get(key);
    if (!cv) {
      cv = document.createElement('canvas'); cv.width = F; cv.height = F;
      const x = cv.getContext('2d'); x.drawImage(img, sx, sy, F, F, 0, 0, F, F);
      x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, F, F);
      this.tintCache.set(key, cv);
    }
    return cv;
  }
  // where a teleporter is about to appear: a pulsing violet ring and a '!'
  blinkMark(g, to) {
    const b = this.b, [mx, my] = this.proj(to.x, to.y), R = 7 + Math.sin(g.t * 14) * 2;
    b.fillStyle = Math.floor(g.t * 10) % 2 ? '#b888ff' : '#ffffff';
    for (let a = 0; a < 20; a++) { if (a % 2) continue; const t = (a / 20) * Math.PI * 2; b.fillRect(Math.round(mx + Math.cos(t) * R), Math.round(my + Math.sin(t) * R), 1, 1); }
    b.fillStyle = '#ffffff'; b.fillRect(Math.round(mx), Math.round(my) - 14, 1, 4); b.fillRect(Math.round(mx), Math.round(my) - 9, 1, 1);
  }
  // a burrowing enemy: just a churning mound of earth sliding toward you
  mound(g, e, sx, sy, w) {
    if (e.rumble) {                                       // it has stopped: a ring of dust grows where it will erupt
      const b0 = this.b, k = 1 - Math.max(0, e.burT) / 0.7, R0 = 4 + k * 8;
      b0.fillStyle = Math.floor(g.t * 12) % 2 ? '#ffc94a' : '#8a7e6a';
      for (let a = 0; a < 18; a++) { const t = (a / 18) * Math.PI * 2; b0.fillRect(Math.round(sx + Math.cos(t) * R0), Math.round(sy + Math.sin(t) * R0), 1, 1); }
    }
    const b = this.b, x = Math.round(sx), y = Math.round(sy), cols = ['#5a4e44', '#8a7e6a', '#c8b890', '#3a3028'];
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI + g.t * 6 * (k % 2 ? 1 : -1), r0 = w * 0.5 * (0.6 + 0.4 * Math.sin(g.t * 9 + k));
      b.fillStyle = cols[(k + Math.floor(g.t * 10)) % 4];
      b.fillRect(Math.round(x + Math.cos(a) * r0), Math.round(y - Math.abs(Math.sin(a)) * 3), 1, 1);
    }
    b.fillStyle = '#3a3028'; b.fillRect(x - 2, y, 5, 1);
    if (Math.random() < 0.3) this.spray(e.x, e.y, 1, cols, 1.4, 0.3, 4);
  }
  realmBoss(g, e, sx, sy) {
    if (e.blinkTo && e.state === 'tell') this.blinkMark(g, e.blinkTo);
    const S = this.A.sheets[e.D.sheet || 'realm_bosses'], Gd = S.guide, F = Gd.frameWidth, row = Gd.bosses[e.id].row;
    let col;
    if (e.dead) col = 7 + Math.min(2, Math.floor(e.deadT * 3));
    else if (e.special && (e.state === 'tell' || e.state === 'attack')) col = 6;
    else if (e.state === 'tell') col = 4;
    else if (e.state === 'attack') col = 5;
    else col = Math.floor(g.t * 5 + e.phase) % 4;
    if (!e.dead) this.shadow(sx, sy, F > 48 ? 46 : 34);
    const L = this.alive(g, e, sx, sy, F, true);
    if (e.tether) {                                       // the tether: a golden ring you must stay inside
      const b = this.b, R = e.tether.r * TS;
      b.fillStyle = Math.floor(g.t * 6) % 2 ? '#ffd650' : '#fff6c8';
      for (let a = 0; a < 90; a++) { if (a % 3 === 2) continue; const t = (a / 90) * Math.PI * 2 + g.t * 0.6; b.fillRect(Math.round(sx + Math.cos(t) * R), Math.round(sy + Math.sin(t) * R), 1, 1); }
    }
    if (e.cloneOf) this.b.globalAlpha = 0.55 + Math.sin(g.t * 6 + e.phase) * 0.15;
    const blaze = !e.dead && e.reflectUntil > g.t;          // the Colossus's bulwark: it flashes white while it reflects
    this.liveSpr(S.img, col * F, row * F, F, sx + L.dx, sy + L.dy, Gd.pivot.x, Gd.pivot.y, L, blaze && Math.floor(g.t * 10) % 2 === 0);
    if (blaze && Math.random() < 0.6) this.parts.push({ x: e.x + (Math.random() - 0.5) * 2.4, y: e.y, z: 10 + 30 * Math.random(), vx: 0, vy: 0, vz: 8, g: 0, life: 0.4, max: 0.4, color: Math.random() < 0.5 ? '#ffffff' : '#ffd84a' });
    this.b.globalAlpha = 1;
    if (e.cloneOf && Math.random() < 0.3) this.parts.push({ x: e.x + (Math.random() - 0.5) * 2, y: e.y, z: 20 * Math.random(), vx: 0, vy: 0, vz: 6, g: 0, life: 0.5, max: 0.5, color: '#8af6ff' });
    if (!e.dead && e.shieldBy && e.shieldBy.some((m) => !m.dead)) {     // shielded by its guard: a crackling bubble
      const b = this.b;
      for (let k = 0; k < 40; k++) {
        const a = (k / 40) * Math.PI * 2 + g.t * 1.5;
        if ((k + Math.floor(g.t * 10)) % 5 === 0) continue;
        b.fillStyle = k % 2 ? '#8af6ff' : '#ffffff';
        b.fillRect(Math.round(sx + Math.cos(a) * (F * 0.5)), Math.round(sy - F * 0.45 + Math.sin(a) * F * 0.42), 1, 1);
      }
      for (const m of e.shieldBy) {                        // tethers from the guards to the boss
        if (m.dead) continue;
        const [mx, my] = this.proj(m.x, m.y - 0.5);
        for (let t = 0; t < 1; t += 0.08) { b.fillStyle = '#3befff'; b.fillRect(Math.round(sx + (mx - sx) * t), Math.round(sy - 20 + (my - sy + 20) * t), 1, 1); }
      }
    }
    if (!e.dead && e.invulnT > 0) {
      const b = this.b; b.fillStyle = '#ffffff';
      for (let k = 0; k < 8; k++) {
        const a = g.t * 3 + (k * Math.PI) / 4;
        b.fillRect(Math.round(sx + Math.cos(a) * 24), Math.round(sy - 22 + Math.sin(a) * 14), 1, 1);
      }
    }
  }
  boss(g, B, sx, sy) {
    const S = this.A.sheets.unstruck, Gd = S.guide, F = Gd.frameWidth, A = Gd.animations;
    let a = A.idle, f = 0;
    const st = B.state;
    if (st === 'dead') { a = A.death; f = Math.min(3, Math.floor(B.deadT * 4)); }
    else if (st === 'phase') { a = A.phase; f = B.st < 0.9 ? 1 : 0; }
    else if (A[st]) a = A[st];
    else if (st === 'spin' || st === 'tell_spin') { a = A.phase; f = 1; }
    else f = Math.floor(g.t * 3) % 2;
    const [cx, cy] = a.cells[Math.min(f, a.cells.length - 1)];
    if (st !== 'dead') this.shadow(sx, sy, 44);
    this.spr(S.img, cx * F, cy * F, F, F, sx, sy, Gd.pivot.x, Gd.pivot.y, false, false);
  }
  player(g, p, sx, sy) {
    const C = CLASSES[p.cls], S = this.A.sheets[C.sheet], A = S.guide.animations;
    let name, flip = false, frame = 0;
    const lr = p.dir === 'left' || p.dir === 'right';
    const base = (kind) => {
      if (lr && C.anim.side === 'mirror') { flip = p.dir === 'left'; return `side_${kind}`; }
      return `${p.dir}_${kind}`;
    };
    if (p.dead) { name = 'death'; frame = Math.min(A.death.frames - 1, Math.floor(p.deadT * A.death.fps)); }
    else if (p.abilityT > 0) { name = 'ability'; frame = Math.min(A.ability.frames - 1, Math.floor((0.5 - p.abilityT) / 0.5 * A.ability.frames)); }
    else if (p.hitT > 0 && A.hit) { name = 'hit'; frame = A.hit.frames === 4 ? ['front', 'right', 'left', 'back'].indexOf(p.dir) : 0; }
    else if (g.t - p.lastShot < Math.max(0.2, p.shotPeriod || 0) && C.anim.attack[p.dir]) {
      name = C.anim.attack[p.dir];
      if (name === 'side_attack') flip = p.dir === 'left';
      frame = Math.min(A[name].frames - 1, Math.floor(((g.t - p.lastShot) / (p.shotPeriod || 0.3)) * A[name].frames));
    } else if (p.moving) { name = base('walk'); frame = Math.floor(g.t * A[name].fps) % A[name].frames; }
    else { name = base('idle'); frame = Math.floor(g.t * A[name].fps) % A[name].frames; }
    let an = A[name], hop = 0;
    if (p.danceT > 0 && !p.dead) {                        // /dance: spin through the facings, hop, notes
      const d = ['front', 'right', 'back', 'left'][Math.floor(g.t * 6) % 4];
      name = (d === 'left' || d === 'right') && C.anim.side === 'mirror' ? 'side_idle' : `${d}_idle`;
      an = A[name] || A.front_idle; flip = d === 'left'; frame = 0;
      hop = Math.abs(Math.round(Math.sin(g.t * 12) * 3));
      if (Math.random() < 0.15) this.parts.push({ x: p.x + (Math.random() - 0.5), y: p.y, z: 14, vx: 0, vy: 0, vz: 8, g: 0, life: 0.8, max: 0.8, color: ['#ff4af0', '#8af6ff', '#ffd650'][Math.floor(Math.random() * 3)] });
    }
    if (!p.dead) this.shadow(sx, sy, 12);
    this.spr(S.img, (an.col + frame) * 16, an.row * 16, 16, 16, sx, sy - hop, 8, 15, flip, p.hitT > 0.1);
    if (!p.dead && p.hp < g.stat('hp')) this.hpBar(sx, sy + 3, p.hp / g.stat('hp'), 14);   // RotMG-style bar at your feet
    const st = p.status, b = this.b, cy = Math.round(sy) - 8;
    const pip = (col, ph) => {
      for (let k = 0; k < 3; k++) {
        const a = g.t * 4 + ph + (k * Math.PI * 2) / 3;
        b.fillStyle = col; b.fillRect(Math.round(sx + Math.cos(a) * 9), cy + Math.round(Math.sin(a) * 5), 1, 1);
      }
    };
    if (st.invuln) pip('#fffdf0', 0);
    if (st.rested > 0) pip('#ff9a5a', 5);
    if (st.bless > 0) pip({ shore: '#3bc8e8', fen: '#d4ff5a', runeholt: '#b888ff', godfall: '#ffc94a' }[p.blessKind] || '#fff', 4);
    if (st.berserk) pip('#ff8a1f', 1);
    if (st.armored) pip('#a6acc4', 2);
    if (st.kintsugi) pip('#f2c14e', 3);
    if (p.aegisUp) { b.fillStyle = Math.floor(g.t * 2) % 2 ? '#f2c14e' : '#fff6c8'; b.fillRect(Math.round(sx) - 1, cy - 9, 3, 1); b.fillRect(Math.round(sx), cy - 10, 1, 3); }
  }
  hpBar(sx, sy, f, w) {
    const b = this.b, x = Math.round(sx - w / 2), y = Math.round(sy);
    b.fillStyle = '#000'; b.fillRect(x, y, w, 2);
    b.fillStyle = f > 0.5 ? '#3ac85a' : f > 0.25 ? '#f0c030' : '#d8283c';
    b.fillRect(x, y, Math.max(1, Math.round(w * f)), 2);
  }
  anvilFx(f, g) {
    const b = this.b, [sx0, sy0] = this.proj(f.x, f.y), sx = Math.round(sx0), sy = Math.round(sy0);
    const R = f.r * TS, k = Math.min(1, f.t / f.delay);
    if (!f.done) {
      // telegraph: a shadow that grows as the anvil falls, ringed with a warning edge
      b.fillStyle = 'rgba(0,0,0,0.45)';
      const rx = Math.round(R * (0.3 + 0.7 * k)), ry = rx;
      for (let y = -ry; y <= ry; y++) { const w = Math.round(rx * Math.sqrt(1 - (y / ry) ** 2)); b.fillRect(sx - w, sy + y, w * 2, 1); }
      b.fillStyle = Math.floor(g.t * 12) % 2 ? '#ff8a1f' : '#ffc94a';
      for (let a = 0; a < 40; a++) {
        if (a % 3 === 2) continue;
        const t = (a / 40) * Math.PI * 2;
        b.fillRect(Math.round(sx + Math.cos(t) * R), Math.round(sy + Math.sin(t) * R), 1, 1);
      }
    }
    // the anvil itself: falls from the top of the screen, then sits in its crater
    const kk = this.W.objects.anvil_block, c = this.W.objectsCols;
    const drop = f.done ? 0 : Math.round((1 - k) * (1 - k) * (sy + 24));
    b.drawImage(this.A.img.objects, (kk % c) * TS, Math.floor(kk / c) * TS, TS, TS, sx - 8, sy - 12 - drop, TS, TS);
    if (f.done) {
      b.fillStyle = '#ffc94a';
      for (const [dx, dy] of [[-10, 2], [-6, 4], [9, 3], [5, 5], [-3, 6], [12, 0], [-13, -1]]) b.fillRect(sx + dx, sy + dy, 2, 1);
    }
  }
  beamFx(f, g) {
    const b = this.b, [sx0, sy0] = this.proj(f.x, f.y), sx = Math.round(sx0), sy = Math.round(sy0);
    const R = f.r * TS;
    const ring = (rad, col, step) => {
      b.fillStyle = col;
      for (let a = 0; a < 48; a++) {
        if (a % step === step - 1) continue;
        const t = (a / 48) * Math.PI * 2 + g.t * 2;
        b.fillRect(Math.round(sx + Math.cos(t) * rad), Math.round(sy + Math.sin(t) * rad), 1, 1);
      }
    };
    if (f.t < f.delay) {                                // a sun-sigil marks where judgment will fall
      const k = f.t / f.delay;
      ring(R, '#f2c14e', 3); ring(R * k, '#fffdf0', 2);
      b.fillStyle = '#fffdf0'; b.fillRect(sx, Math.round(sy - (1 - k) * sy), 1, Math.round((1 - k) * sy));
      return;
    }
    const fade = f.life - f.t < 0.3 ? (f.life - f.t) / 0.3 : 1;
    const W = Math.max(1, Math.round(R * 0.9 * fade * (0.85 + 0.15 * Math.sin(g.t * 40))));
    // the pillar: gold edges, white core, dithered rim; from the sky down to the ground
    b.fillStyle = '#c98a22'; b.fillRect(sx - W, 0, W * 2, sy + 2);
    b.fillStyle = '#ffeb8f'; b.fillRect(sx - Math.round(W * 0.75), 0, Math.round(W * 1.5), sy + 3);
    b.fillStyle = '#fffdf0'; b.fillRect(sx - Math.round(W * 0.35), 0, Math.max(1, Math.round(W * 0.7)), sy + 4);
    b.fillStyle = '#ffeb8f';
    for (let y = 0; y < sy; y += 2) b.fillRect(sx - W - 1 - ((y + Math.floor(g.t * 30)) % 4 === 0 ? 1 : 0), y, 1, 1), b.fillRect(sx + W + ((y + Math.floor(g.t * 30)) % 4 === 2 ? 1 : 0), y, 1, 1);
    ring(R, '#fffdf0', 4); ring(R + 2, '#f2c14e', 2);
  }
  stunStars(g, sx, sy, h) {
    const b = this.b;
    for (let k = 0; k < 3; k++) {
      const a = g.t * 6 + (k * Math.PI * 2) / 3;
      const x = Math.round(sx + Math.cos(a) * 6), y = Math.round(sy - h + Math.sin(a) * 2);
      b.fillStyle = '#ffe45c'; b.fillRect(x, y, 1, 1);
      b.fillStyle = '#fff6c8'; b.fillRect(x - 1, y, 1, 1); b.fillRect(x + 1, y, 1, 1); b.fillRect(x, y - 1, 1, 1); b.fillRect(x, y + 1, 1, 1);
    }
  }
  drawZaps(dt) {                                          // chain lightning: jagged bolts between enemies
    const b = this.b;
    for (const z of this.zaps) {
      z.t += dt;
      const [x0, y0] = this.proj(z.x0, z.y0), [x1, y1] = this.proj(z.x1, z.y1), n = 8;
      let px = x0, py = y0;
      for (let i = 1; i <= n; i++) {
        const t = i / n, jx = i < n ? (Math.random() - 0.5) * 6 : 0, jy = i < n ? (Math.random() - 0.5) * 6 : 0;
        const nx = x0 + (x1 - x0) * t + jx, ny = y0 + (y1 - y0) * t + jy;
        const steps = Math.max(1, Math.round(Math.hypot(nx - px, ny - py)));
        for (let s = 0; s <= steps; s++) {
          b.fillStyle = (z.col || ['#8af6ff', '#ffffff'])[s % 2];
          b.fillRect(Math.round(px + (nx - px) * s / steps), Math.round(py + (ny - py) * s / steps), 1, 1);
        }
        px = nx; py = ny;
      }
    }
    this.zaps = this.zaps.filter((z) => z.t < 0.12);
    for (const q of this.rings) { q.t += dt; this.ringFx({ ...q, t: q.t * 1.0 }); }
    this.rings = this.rings.filter((q) => q.t < 0.45);
  }
  // hovering a bag: its eight slots, small and see-through, floating just above it
  iconImg(id) {
    this.iconImgs = this.iconImgs || {};
    let im = this.iconImgs[id];
    if (!im) { im = this.iconImgs[id] = new Image(); im.src = this.icon(id); }
    return im;
  }
  bagPeek(bag, sx, sy) {
    const b = this.b, C = 9, W = C * 4 + 3, H = C * 2 + 3, x0 = Math.round(sx - W / 2), y0 = Math.round(sy - 16 - H);
    b.globalAlpha = 0.55; b.fillStyle = '#0a080e'; b.fillRect(x0, y0, W, H);
    b.globalAlpha = 0.35; b.fillStyle = '#ffffff';
    for (let k = 0; k < 8; k++) if (!bag.items[k]) b.fillRect(x0 + 2 + (k % 4) * C + 3, y0 + 2 + Math.floor(k / 4) * C + 3, 2, 2);   // an empty slot: a faint dot
    b.globalAlpha = 0.9;
    for (let k = 0; k < 8; k++) {
      const id = bag.items[k];
      if (!id) continue;
      const im = this.iconImg(id);
      if (im.complete && im.naturalWidth) b.drawImage(im, x0 + 2 + (k % 4) * C, y0 + 2 + Math.floor(k / 4) * C, C - 1, C - 1);
    }
    b.globalAlpha = 1;
  }
  // ---- sprite effects from the sprite pack: hit sparks, death puffs, the level-up ring (art/world/fx.png)
  sprFx(name, x, y, fps = 14) { (this.sfxList = this.sfxList || []).push({ name, x, y, t: 0, fps }); }
  drawSprFx(dt) {
    const L = this.sfxList, F = this.W.fx, img = this.A.img.fx;
    if (!L || !L.length || !F || !img) return;
    const keep = [], c = this.W.fxCols || 8;
    for (const q of L) {
      q.t += dt;
      const D = F[q.name], fr = Math.floor(q.t * q.fps);
      if (!D || fr >= D.n) continue;
      const k = D.i + fr, [sx, sy] = this.proj(q.x, q.y);
      this.b.drawImage(img, (k % c) * TS, Math.floor(k / c) * TS, TS, TS, Math.round(sx - 8), Math.round(sy - 8), TS, TS);
      keep.push(q);
    }
    this.sfxList = keep.length > 60 ? keep.slice(-60) : keep;
  }
  // the Lich's darkness: everything but a small circle around you goes black
  darkFx(g) {
    const b = this.b, [sx, sy] = this.proj(g.player.x, g.player.y - 0.5), r = (g.darkR || 3) * TS;
    const BW = this.buf.width, BH = this.buf.height;
    const left = g.darkUntil - g.t, fade = Math.min(1, left / 0.6, (g.t - (g.darkStart || 0)) / 0.6);
    const grad = b.createRadialGradient(sx, sy, r * 0.55, sx, sy, r);
    grad.addColorStop(0, 'rgba(2,4,8,0)'); grad.addColorStop(1, `rgba(2,4,8,${0.86 * Math.max(0, Math.min(1, fade))})`);
    b.save(); b.setTransform(1, 0, 0, 1, 0, 0); b.scale(this.hi.width / BW, this.hi.height / BH);
    b.fillStyle = grad; b.fillRect(0, 0, BW, BH);
    b.restore();
  }
  // the Hexweaver's curse: a violet circle of runes that flares and fades
  hexFx(f, g) {
    const b = this.b, [sx, sy] = this.proj(f.x, f.y), k = f.t / f.life, r = f.r * TS * (0.85 + 0.15 * Math.min(1, k * 4));
    b.globalAlpha = Math.max(0, 1 - k);
    for (let j = 0; j < 48; j++) {
      const a = (j / 48) * Math.PI * 2 + g.t * 1.5;
      b.fillStyle = j % 6 === 0 ? '#e6ffff' : j % 2 ? '#ab82f2' : '#7a48c8';
      b.fillRect(Math.round(sx + Math.cos(a) * r), Math.round(sy + Math.sin(a) * r), j % 6 === 0 ? 2 : 1, j % 6 === 0 ? 2 : 1);
    }
    b.globalAlpha = 1;
  }
  // the Runeblade's ward: runes circling at your feet, fewer as the ward wears thin
  wardFx(g) {
    const p = g.player, b = this.b, [sx, sy] = this.proj(p.x, p.y), n = Math.max(2, Math.round(8 * p.ward / (p.wardMax || 1)));
    for (let j = 0; j < n; j++) {
      const a = (j / n) * Math.PI * 2 + g.t * 2.4, x = Math.round(sx + Math.cos(a) * 11), y = Math.round(sy - 6 + Math.sin(a) * 11);
      b.fillStyle = '#46f5d6'; b.fillRect(x, y, 2, 2); b.fillStyle = '#eef8ff'; b.fillRect(x, y, 1, 1);
    }
  }
  // the Forgeheart Colossus's eruption lanes: a warning glow, then a road of fire
  laneFx(f, g) {
    const b = this.b, live = f.t >= f.delay, L = f.len, n = Math.ceil(L * 2);
    for (let j = 0; j < n; j++) {
      const d = (j / n) * L, x = f.x + Math.cos(f.a) * d, y = f.y + Math.sin(f.a) * d, [sx, sy] = this.proj(x, y);
      if (!live) { if ((j + Math.floor(g.t * 12)) % 3 === 0) { b.fillStyle = '#ff8c1e'; b.fillRect(Math.round(sx) - 1, Math.round(sy) - 1, 2, 2); } continue; }
      b.fillStyle = (j + Math.floor(g.t * 20)) % 2 ? '#ffd84a' : '#ff8c1e';
      b.fillRect(Math.round(sx) - 3, Math.round(sy) - 3, 6, 6);
      b.fillStyle = '#fff6c8'; b.fillRect(Math.round(sx) - 1, Math.round(sy) - 1, 2, 2);
    }
  }
  ringFx(f) {
    const b = this.b, r = (f.t / 0.45) * f.max * TS, [sx, sy] = this.proj(f.x, f.y);
    b.fillStyle = f.color;
    for (let k = 0; k < 32; k++) {
      const a = (k / 32) * Math.PI * 2;
      b.fillRect(Math.round(sx + Math.cos(a) * r), Math.round(sy + Math.sin(a) * r), 1, 1);
    }
  }

  // ------------------------------------------------------------ projectiles (+ trails)
  drawProjectiles(g, dt) {
    const b = this.b, PI = this.A.img.projectiles, pc = this.W.projCols, PS = this.W.proj, half = PS / 2;
    const BW = this.buf.width, BH = this.buf.height;
    for (const pr of g.projectiles) {
      const k0 = this.W.projectiles[pr.sprite] ?? 0, nf = this.W.projFrames || 1;
      const k = k0 + (nf > 1 ? Math.floor(g.t * 12 + (pr.x + pr.y) * 2) % nf : 0);
      const [sx0, sy0] = this.proj(pr.x, pr.y);
      let sx = Math.round(sx0), sy = Math.round(sy0);
      if (pr.lob) {                                          // a mortar: marker on the ground, the shot arcing over
        const L = pr.lob, kk = Math.min(1, L.t / L.T), [mx, my] = this.proj(L.x1, L.y1);
        b.fillStyle = Math.floor(g.t * 10) % 2 ? '#ff4a5a' : '#ffc94a';
        const rr = Math.round(L.r * TS * (0.4 + 0.6 * kk));
        for (let a = 0; a < 16; a++) { if (a % 2) continue; const t = (a / 16) * Math.PI * 2; b.fillRect(Math.round(mx + Math.cos(t) * rr), Math.round(my + Math.sin(t) * rr), 1, 1); }
        b.fillStyle = 'rgba(0,0,0,0.35)'; b.fillRect(sx - 2, sy, 5, 1);
        sy -= Math.round(Math.sin(Math.PI * kk) * L.h);
      }
      if (pr.frozen) { b.globalAlpha = 0.55; }
      if (sx < -12 || sy < -12 || sx > BW + 12 || sy > BH + 12) continue;
      if (Math.random() < 0.4) {
        const cols = this.colorsOf('p:' + pr.sprite, PI, (k % pc) * PS, Math.floor(k / pc) * PS, PS, PS);
        this.parts.push({ x: pr.x, y: pr.y, z: 0, vx: 0, vy: 0, vz: 0, g: 0, life: 0.18, max: 0.18, color: cols[Math.floor(Math.random() * Math.min(2, cols.length))] });
      }
      // RotMG-style shots: 8x8 art at the characters' scale. Pointed shots turn to their flight (the long ones are drawn
      // on the diagonal), stars and wheels spin, the big slow ones are drawn a size up. Enemy shots sit on a faint dark halo.
      const S = this.shotSets || (this.shotSets = { rot: new Set(this.W.projRot || []), diag: new Set(this.W.projDiag || []), spin: new Set(this.W.projSpin || []), big: new Set(this.W.projBig || []) });
      const Q = (pr.from === 'e' ? 1 : 0.875) * (S.big.has(pr.sprite) ? 1.3 : 1), QS = PS * Q, qh = half * Q;
      if (pr.from === 'e') { const ga = b.globalAlpha; b.globalAlpha = ga * 0.32; b.fillStyle = '#05040a'; b.beginPath(); b.arc(sx, sy, qh * 0.66, 0, Math.PI * 2); b.fill(); b.globalAlpha = ga; }
      if (S.rot.has(pr.sprite) || S.spin.has(pr.sprite)) {
        const ang = S.spin.has(pr.sprite) ? g.t * 9 + (pr.x + pr.y) : pr.a + this.th + (S.diag.has(pr.sprite) ? Math.PI / 4 : 0);
        b.save(); b.translate(sx, sy); b.rotate(ang);
        b.drawImage(PI, (k % pc) * PS, Math.floor(k / pc) * PS, PS, PS, -qh, -qh, QS, QS); b.restore();
      } else b.drawImage(PI, (k % pc) * PS, Math.floor(k / pc) * PS, PS, PS, sx - qh, sy - qh, QS, QS);
      b.globalAlpha = 1;
    }
  }

  // ------------------------------------------------------------ particles & events
  consumeVfx(g) {
    for (const v of g.vfx.splice(0)) {
      const shakeOn = !this.settings || this.settings.shake;
      if (v.k === 'shake') { if (shakeOn) this.shake = Math.max(this.shake, v.amt); }
      else if (v.k === 'hurt') { if (shakeOn) this.shake = Math.max(this.shake, v.amt); this.hurtFlash = Math.max(this.hurtFlash, 0.05 + v.amt * 0.02); }
      else if (v.k === 'levelup') this.sprFx('level_up_ring', v.x, v.y, 7);
      else if (v.k === 'hit') this.sprFx('hit_spark', v.x, v.y, 20), this.spray(v.x, v.y, v.crit ? 10 : 3, v.crit ? ['#ffd650', '#ffffff', '#ff8a1f'] : ['#ffffff', '#fff4c2'], v.crit ? 5 : 2.5, 0.22, v.crit ? 8 : 4);
      else if (v.k === 'boom') { this.spray(v.x, v.y, 18, ['#ffc94a', '#ff7a1a', '#ffffff', '#8c2a12'], 4 + v.r * 2, 0.45, 8); this.rings.push({ x: v.x, y: v.y, t: 0, max: v.r, color: '#ffc94a' }); }
      else if (v.k === 'zap') this.zaps.push({ ...v, t: 0 });
      else if (v.k === 'suck') {
        const a = Math.random() * Math.PI * 2, d0 = 3 + Math.random() * 4;
        this.parts.push({ x: v.x + Math.cos(a) * d0, y: v.y + Math.sin(a) * d0, z: 2, vx: -Math.cos(a) * 3, vy: -Math.sin(a) * 3, vz: 0, g: 0, life: 0.5, max: 0.5, color: Math.random() < 0.5 ? '#7ec0e4' : '#ffffff' });
      } else if (v.k === 'slash') { for (let k = 0; k < 6; k++) this.parts.push({ x: v.x - 0.4 + k * 0.15, y: v.y + 0.3 - k * 0.12, z: 6 + k, vx: 0, vy: 0, vz: 0, g: 0, life: 0.15, max: 0.15, color: k % 2 ? '#ffffff' : '#5ef0c8' }); }
      else if (v.k === 'heal') { this.zaps.push({ ...v, t: 0, col: ['#7aff9a', '#e8fff0'] }); this.spray(v.x1, v.y1, 6, ['#7aff9a', '#ffffff'], 1.5, 0.5, 8); }
      else if (v.k === 'hearts') for (let k = 0; k < 4; k++) this.parts.push({ x: v.x + (Math.random() - 0.5) * 0.8, y: v.y, z: 6 + k * 3, vx: 0, vy: 0, vz: 6 + Math.random() * 4, g: 0, life: 1, max: 1, color: '#ff8fbf', heart: true });
      else if (v.k === 'aura') this.spray(v.x, v.y, 6, v.cold ? ['#cfffff', '#8af6ff'] : ['#ff8a1f', '#ffc94a'], v.r * 3, 0.5, 2, true);
      else if (v.k === 'muzzle') this.spray(v.x, v.y, 2, ['#ffffff'], 1.5, 0.12, 2);
      else if (v.k === 'burst') this.spray(v.x, v.y, v.n, v.colors, 6, 0.6, 10);
      else if (v.k === 'dust') {
        const bi = biomeAt(g.map, v.x, v.y);
        if (v.splash) { this.spray(v.x, v.y, 4, ['#c8eeff', '#7ec0e4', '#ffffff'], 2.2, 0.35, 6); continue; }
        if (v.ice) { this.spray(v.x, v.y, 2, ['#ffffff', '#d4e8f6'], 1.8, 0.3, 2, true); continue; }
        const col = ['#e8cf96', '#5c8a3a', '#e8f0f8', '#554c52', '#fff0cc', '#44542e', '#d8bc66'][bi] || '#8d88a0';
        this.spray(v.x, v.y, 2, [col], 1.2, 0.35, 3, true);
      } else if (v.k === 'death') {
        const e = v.e;
        let cols;
        if (e.rb) {
          const S = this.A.sheets[e.D.sheet || 'realm_bosses'], F = S.guide.frameWidth, row = S.guide.bosses[e.id].row;
          cols = this.colorsOf('rb:' + e.id, S.img, 0, row * F, F, F);
        } else if (e.D.sheet === 'champions') {
          const S = this.A.sheets.champions, F = S.guide.frameWidth, row = S.guide.champions[e.id].row;
          cols = this.colorsOf('c:' + e.id, S.img, 0, row * F, F, F);
        } else {
          const S = this.A.sheets.enemies, row = S.guide.enemies[e.id].row;
          cols = this.colorsOf('e:' + e.id, S.img, 0, row * 16, 16, 16);
        }
        const champ = e.D.sheet === 'champions';
        if (!e.rb) this.sprFx('death_poof', e.x, e.y - 0.5, 12);
        this.spray(e.x, e.y, v.big ? 70 : champ ? 30 : 16, cols, v.big ? 9 : champ ? 7 : 5, v.big ? 1.1 : 0.8, v.big ? 30 : champ ? 16 : 8);
      }
    }
  }
  spray(x, y, n, colors, speed, life, lift, flat = false) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.6);
      this.parts.push({ x, y, z: lift * Math.random(), vx: Math.cos(a) * s / TS * 2, vy: Math.sin(a) * s / TS * 2,
        vz: flat ? 4 : 10 + Math.random() * lift * 2, g: flat ? 10 : 70, life: life * (0.6 + Math.random() * 0.4), max: life,
        color: colors[k % colors.length] });
    }
    if (this.parts.length > 900) this.parts.splice(0, this.parts.length - 900);
  }
  drawParticles(dt) {
    const b = this.b, keep = [];
    for (const q of this.parts) {
      q.life -= dt;
      if (q.life <= 0) continue;
      q.x += q.vx * dt * 8; q.y += q.vy * dt * 8;
      q.vz -= q.g * dt; q.z = Math.max(0, q.z + q.vz * dt);
      const [sx, sy] = this.proj(q.x, q.y);
      b.fillStyle = q.color;
      if (q.heart) { const x = Math.round(sx), y = Math.round(sy - q.z); b.fillRect(x - 1, y - 1, 1, 1); b.fillRect(x + 1, y - 1, 1, 1); b.fillRect(x - 1, y, 3, 1); b.fillRect(x, y + 1, 1, 1); }
      else b.fillRect(Math.round(sx), Math.round(sy - q.z), 1, 1);
      keep.push(q);
    }
    this.parts = keep;
  }
  drawWeather(g, dt) {
    const dz = { chapel: 'shore', heart: 'godfall', crypt: 'crypt', ember: 'forge' };
    const bi = g.map.kind === 'realm' ? BIOMES[biomeAt(g.map, g.player.x, g.player.y)] : g.map.kind === 'dungeon' ? (dz[g.map.def && Object.keys(g.map.def).length && g.map.def.portal] || 'forge') : 'nexus';
    const kind = WEATHER[bi] ? bi : null;
    const BW = this.buf.width, BH = this.buf.height, b = this.b;
    if (kind !== this.weatherKind) {
      this.weatherKind = kind;
      this.weather = kind ? Array.from({ length: WEATHER[kind].n }, () => ({ x: Math.random() * BW, y: Math.random() * BH, ph: Math.random() * 6 })) : [];
    }
    if (!kind) return;
    const W = WEATHER[kind];
    for (const q of this.weather) {
      q.ph += dt * 3;
      q.x += (W.vx + Math.sin(q.ph) * 3) * dt; q.y += (W.vy + Math.cos(q.ph * 0.7) * 2) * dt;
      if (q.x < -2) q.x += BW + 4; if (q.x > BW + 2) q.x -= BW + 4;
      if (q.y < -2) q.y += BH + 4; if (q.y > BH + 2) q.y -= BH + 4;
      if (W.blink && Math.sin(q.ph * 1.7) < -0.4) continue;
      b.fillStyle = W.color[Math.floor(q.ph) % W.color.length];
      b.fillRect(Math.round(q.x), Math.round(q.y), W.size, W.size === 2 && q.ph % 2 > 1 ? 1 : W.size);
    }
  }
  buildVignette() {                                         // dithered (not smooth) edge darkening
    const W = this.buf.width, H = this.buf.height;
    this.vig = document.createElement('canvas'); this.vig.width = W; this.vig.height = H;
    const x = this.vig.getContext('2d'), img = x.createImageData(W, H);
    const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
      const e = Math.min(xx, y, W - 1 - xx, H - 1 - y);
      const d = e < 2 ? 0.5 : e < 6 ? 0.25 : e < 12 ? 0.12 : e < 20 ? 0.05 : 0;
      if (d && bayer[(y % 4) * 4 + (xx % 4)] / 16 < d) img.data[(y * W + xx) * 4 + 3] = 150;
    }
    x.putImageData(img, 0, 0);
  }

  // ------------------------------------------------------------ HUD overlays
  overlays(g) {
    const ctx = this.ctx, s = this.scale;
    ctx.textAlign = 'center';
    ctx.font = textFont(Math.max(13, s * 4 * 1.3));
    const nums = !this.settings || this.settings.damageNumbers;
    for (const f of g.floaters) {
      if (!nums && /^[-+]?\d+$/.test(f.text)) continue;
      const [bx, by] = this.proj(f.x, f.y);
      const x = bx * s, y = by * s - f.t * 30;
      ctx.globalAlpha = Math.max(0, 1 - f.t / 0.9);
      outlined(ctx, f.text, x, y);
      ctx.fillStyle = f.color; ctx.fillText(f.text, x, y);
    }
    ctx.globalAlpha = 1;
    for (const e of g.enemies) {                             // training dummies show your damage per second
      if (!e.D.dummy) continue;
      const [bx, by] = this.proj(e.x, e.y);
      if (bx < 0 || by < 0 || bx > this.buf.width || by > this.buf.height) continue;
      const log = (e.log || []).filter((l) => g.t - l[0] < 3);
      const tot = log.reduce((a, l) => a + l[1], 0), span = log.length ? Math.max(1, g.t - log[0][0]) : 1;
      const dps = Math.round(tot / Math.min(3, span));
      const t1 = dps ? `${dps.toLocaleString()} DPS` : e.D.def ? '25 DEF' : 'Hit me!';
      const x = bx * s, y = (by - 22) * s;
      ctx.font = textFont(Math.max(13, s * 3 * 1.3));
      outlined(ctx, t1, x, y);
      ctx.fillStyle = dps > 5000 ? '#ff4af0' : dps > 1500 ? '#ffd650' : dps ? '#7ad0a8' : '#8d88a0'; ctx.fillText(t1, x, y);
    }
    this.speech(g);
    ctx.font = textFont(Math.max(13, s * 4 * 1.3));
    if (g.nearPortal) {
      const [bx, by] = this.proj(g.nearPortal.x, g.nearPortal.y);
      const L = g.nearPortal.life, x = bx * s, y = (by - 20) * s;
      const t = `[F] ${g.nearPortal.label}${L !== undefined ? ` (${Math.ceil(L)}s)` : ''}`;
      outlined(ctx, t, x, y);
      ctx.fillStyle = '#f2c14e'; ctx.fillText(t, x, y);
    }
    if (g.nearNPC && !g.nearPortal) {
      const [bx, by] = this.proj(g.nearNPC.x, g.nearNPC.y);
      const x = bx * s, y = (by - 20) * s, t = `[F] ${g.nearNPC.label}`;
      outlined(ctx, t, x, y);
      ctx.fillStyle = '#f2c14e'; ctx.fillText(t, x, y);
    }
    let bar = null;
    const B = g.boss;
    if (B && B.state !== 'sleep' && B.state !== 'dead') bar = { name: 'THE UNSTRUCK', f: B.hp / B.maxHp, hot: B.phase === 2 };
    else {
      let best = 22;
      for (const e of g.enemies) {
        if (!(e.rb || e.herald || (e.warden && e.seen !== false)) || e.dead || e.cloneOf) continue;
        const d = Math.hypot(e.x - g.player.x, e.y - g.player.y) - (e.rb ? 4 : e.warden ? 8 : 0);
        const surv = e.surviveUntil > g.t ? ` · SURVIVE ${Math.ceil(e.surviveUntil - g.t)}s` : e.frenzyUntil > g.t ? ` · ${e.D.bloodlust ? 'BLOODLUST' : 'FRENZY'} ${Math.ceil(e.frenzyUntil - g.t)}s` : '';
        if (d < best) { best = d; bar = { name: e.D.name.toUpperCase() + surv, f: surv ? (e.surviveUntil > g.t ? (e.surviveUntil - g.t) / 22 : (e.frenzyUntil - g.t) / (e.frenzyLen || 10)) : e.hp / e.maxHp, hot: e.phaseIdx > 0 || !!surv, immune: e.invulnT > 0 && !surv }; }
      }
    }
    if (bar) {
      const w = Math.min(this.c.width * 0.6, 560), x = (this.c.width - w) / 2, y = 58;   // below the gold / fame row, never under it
      ctx.fillStyle = '#000'; ctx.fillRect(x - 3, y - 3, w + 6, 18);
      ctx.fillStyle = '#5a0e1e'; ctx.fillRect(x, y, w, 12);
      ctx.fillStyle = bar.immune ? '#8d88a0' : bar.hot ? '#ff7a1a' : '#f2c14e';
      ctx.fillRect(x, y, w * Math.max(0, bar.f), 12);
      ctx.font = textFont(Math.max(13, s * 3 * 1.3));
      outlined(ctx, bar.name, this.c.width / 2, y + 30); ctx.fillStyle = '#e9e4f2'; ctx.fillText(bar.name, this.c.width / 2, y + 30);
    }
  }
  // speech bubbles: a dark rounded box with a tail, above whoever is talking
  speech(g) {
    const ctx = this.ctx, s = this.scale;
    g.bubbles = g.bubbles.filter((B) => g.t - B.t0 < (B.big ? 3.6 : 2.6));
    ctx.font = textFont(Math.max(12, Math.round(s * 3.2) * 1.3));
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const B of g.bubbles) {
      if (B.e && !B.e.dead && B.e.x !== undefined) { B.x = B.e.x; B.y = B.e.y; }
      const [bx, by] = this.proj(B.x, B.y), age = g.t - B.t0, life = B.big ? 3.6 : 2.6;
      const hgt = B.e && B.e.rb ? 54 : B.e && B.e.D && B.e.D.sheet === 'champions' ? 30 : B.e === g.boss ? 64 : 22;
      const x = bx * s, y = (by - hgt) * s - Math.min(1, age * 8) * 4;
      const w = ctx.measureText(B.text).width + 14, h = Math.max(16, s * 5.5);
      ctx.globalAlpha = Math.min(1, (life - age) * 3, age * 10);
      ctx.fillStyle = '#000'; ctx.fillRect(x - w / 2 - 2, y - h / 2 - 2, w + 4, h + 4);
      ctx.fillStyle = B.big ? '#2a0a10' : '#f4ecd6'; ctx.fillRect(x - w / 2, y - h / 2, w, h);
      ctx.fillStyle = '#000'; ctx.fillRect(x - 3, y + h / 2, 6, 3); ctx.fillRect(x - 1, y + h / 2 + 3, 3, 3);
      ctx.fillStyle = B.big ? '#2a0a10' : '#f4ecd6'; ctx.fillRect(x - 2, y + h / 2, 4, 2);
      ctx.fillStyle = B.big ? B.col : B.col === '#ffffff' ? '#1a1218' : '#1a1218';
      ctx.fillText(B.text, x, y + 1);
    }
    ctx.globalAlpha = 1; ctx.textBaseline = 'alphabetic';
  }
  minimap(g) {
    const m = g.map, mc = this.mctx;
    if (this.miniFor !== m || m.miniDirty) {
      m.miniDirty = false;
      this.miniFor = m;
      this.miniBase = document.createElement('canvas');
      this.miniBase.width = m.w; this.miniBase.height = m.h;
      const x = this.miniBase.getContext('2d'), img = x.createImageData(m.w, m.h);
      const realmFlat = m.kind === 'realm';
      for (let i = 0; i < m.tiles.length; i++) {
        const t = m.tiles[i], b = realmFlat ? m.biome[i] : -2;
        const hex = !realmFlat ? MINI[t] || '#555060' : t === 1 ? '#0e2236' : t === 0 ? '#1d4466' : (['#b89a68', '#4a6a38', '#a8b4c4', '#544a50', '#e0c898', '#26341c', '#b8a050'][b] || MINI[t]);
        img.data[i * 4] = parseInt(hex.slice(1, 3), 16); img.data[i * 4 + 1] = parseInt(hex.slice(3, 5), 16);
        img.data[i * 4 + 2] = parseInt(hex.slice(5, 7), 16); img.data[i * 4 + 3] = 255;
      }
      if (!realmFlat) for (const o of m.objects) if (o.big) { const i = Math.floor(o.y) * m.w + Math.floor(o.x); img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = 230; }
      x.putImageData(img, 0, 0);
    }
    if (m.seen) {
      if (this.fogFor !== m) {
        this.fogFor = m;
        this.fogCv = document.createElement('canvas'); this.fogCv.width = m.w; this.fogCv.height = m.h;
        const fx = this.fogCv.getContext('2d'); fx.fillStyle = '#05040a'; fx.fillRect(0, 0, m.w, m.h);
        for (let i = 0; i < m.seen.length; i++) if (m.seen[i]) fx.clearRect(i % m.w, Math.floor(i / m.w), 1, 1);
        m.fogNew.length = 0;
      } else if (m.fogNew.length) {
        const fx = this.fogCv.getContext('2d');
        for (const i of m.fogNew) fx.clearRect(i % m.w, Math.floor(i / m.w), 1, 1);
        m.fogNew.length = 0;
      }
    }
    const SZ = this.mini.width;
    const V = Math.min(this.settings ? this.settings.miniView : 80, Math.max(m.w, m.h)), p = g.player;
    const whole = V >= Math.max(m.w, m.h);
    // follow the player continuously (fractional tiles), so the map glides instead of stepping
    const x0 = whole ? 0 : p.x - V / 2, y0 = whole ? 0 : p.y - V / 2;
    const k = SZ / V;
    this.miniT = { x0, y0, k, SZ, map: m };                  // so a click on the minimap can find the world spot under it
    mc.imageSmoothingEnabled = false;
    mc.fillStyle = '#05040a'; mc.fillRect(0, 0, SZ, SZ);
    mc.drawImage(this.miniBase, 0, 0, m.w, m.h, Math.round(-x0 * k), Math.round(-y0 * k), Math.round(m.w * k), Math.round(m.h * k));
    if (m.seen && this.fogCv) mc.drawImage(this.fogCv, 0, 0, m.w, m.h, Math.round(-x0 * k), Math.round(-y0 * k), Math.round(m.w * k), Math.round(m.h * k));
    const dot = (x, y, c, sz = 2) => { mc.fillStyle = c; mc.fillRect(Math.round((x - x0) * k) - (sz >> 1), Math.round((y - y0) * k) - (sz >> 1), sz, sz); };
    // a tiny pixel glyph per marker kind (2 canvas px per glyph pixel), with a dark outline baked in
    // bosses and places read at a glance: their markers are drawn larger than the little enemy dots
    const MARK_SIZE = { skull: 4, crown: 4, star: 3, portal: 3, waypoint: 3, site: 3, camp: 3, shrine: 3, talk: 3, coin: 3, quest: 3, lore: 3, anvil: 3, diamond: 3 };
    const mark = (x, y, name, c1, c2 = '#ffffff', edge = false, sc = MARK_SIZE[name] || 2) => {
      if (!edge && name !== 'player' && !g.seen(x, y)) return;          // the fog hides what you haven't found ('edge' marks ignore the fog)
      if (x < x0 || y < y0 || x > x0 + V || y > y0 + V) return;          // only what's inside the view: zoom out to see further
      const G = MINI_GLYPH[name], gh = G.length, gw = G[0].length;
      const cx = Math.round((x - x0) * k) - ((gw * sc) >> 1), cy = Math.round((y - y0) * k) - ((gh * sc) >> 1);
      for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
        const ch = G[j][i];
        if (ch === '.') continue;
        mc.fillStyle = ch === 'o' ? '#05040a' : ch === '1' ? c1 : c2;
        mc.fillRect(cx + i * sc, cy + j * sc, sc, sc);
      }
    };
    const near = (e) => e.x >= x0 - 1 && e.x <= x0 + V + 1 && e.y >= y0 - 1 && e.y <= y0 + V + 1;
    const calm = m.kind === 'realm';
    const blink = Math.floor(g.t * 3) % 2 === 0;
    // the realm only shows monsters close enough to matter; dungeons show every one on screen
    const R2 = MINI_ENEMY_RANGE * MINI_ENEMY_RANGE;
    for (const e of g.enemies) {
      if (e.dead || e.rb || e.herald || e.D.dummy || e.under || !near(e)) continue;
      if (calm && (e.x - p.x) ** 2 + (e.y - p.y) ** 2 > R2) continue;
      mark(e.x, e.y, 'enemy', e.elite ? '#ffa030' : '#ff3c50', '#ffd0d8', false, 2);
    }
    if (calm) {
      for (const c of m.camps || []) {                                   // camps still holding their chest
        const chest = m.objects.find((o) => o.interact === 'chest' && Math.abs(o.x - c.x) < 0.1 && Math.abs(o.y - c.y) < 0.1);
        if (chest && !chest.opened && near(c)) mark(c.x, c.y, 'camp', '#ff7a1a', '#ffd650');
      }
      for (const o of m.objects) {
        if (!near(o)) continue;
        if (o.interact === 'shrine' && g.t >= (o.ready || 0)) mark(o.x, o.y, 'shrine', '#5ef0c8', '#e0fff6');
        else if (o.interact === 'talk') mark(o.x, o.y, 'talk', '#ffd650', '#1a1218');
        else if (o.interact === 'waypoint' && (o.sprite === 'waypoint_on' || g.seen(o.x, o.y))) mark(o.x, o.y, 'waypoint', o.sprite === 'waypoint_on' ? '#8af0ff' : '#6e6a80', '#ffffff', o.sprite === 'waypoint_on');
        else if (o.interact === 'mystery' && !o.used && g.seen(o.x, o.y)) mark(o.x, o.y, 'diamond', '#b888ff', '#ffffff');
      }
      for (const s0 of m.sites || []) if (near(s0) && (s0.found || g.seen(s0.x, s0.y))) mark(s0.x, s0.y, 'site', s0.found ? '#ffd650' : '#8d88a0', '#ffffff');
    } else {
      for (const o of m.objects) {
        if (!o.interact || o.interact === 'dig' || o.interact === 'chest' || o.interact === 'shrine' || o.interact === 'weak' || o.interact === 'plate' || o.interact === 'rune') continue;
        if (m.kind === 'dungeon' && !g.seen(o.x, o.y)) continue;                // the dungeon keeps its secrets until you've seen them
        if (o.interact === 'gate' && !o.solid) continue;
        if (o.interact === 'lore' && p.lore && p.lore.includes(o.lore)) continue;
        const kind = { talk: 'talk', lore: 'lore', shop: 'coin', vault: 'bag', forge: 'anvil', board: 'quest' }[o.interact] || 'diamond';
        const col = { talk: '#ffd650', altar: '#ff7a1a', lore: '#8af6ff', wish: '#3bc8e8', board: '#7aff9a', gate: '#ff4a5a', lever: o.on ? '#6e6a80' : '#ffd650', mystery: o.used ? '#6e6a80' : '#b888ff', runehint: '#8af0ff' }[o.interact] || '#f2c14e';
        mark(o.x, o.y, kind, col, kind === 'talk' ? '#1a1218' : '#ffffff');
      }
    }
    for (const pt of m.portals) mark(pt.x, pt.y, 'portal', '#3befff', '#0a2a40');
    for (const s0 of g.sealStatus ? g.sealStatus() : []) {      // every unbroken seal glows on the minimap, even in the fog
      if (s0.done) continue;
      const pulse = Math.floor(g.t * 4) % 2 === 0;
      mark(s0.x, s0.y, s0.kind === 'warden' ? 'crown' : s0.kind === 'lever' ? 'diamond' : 'quest', s0.kind === 'warden' ? (pulse ? '#ff4a5a' : '#ffb0b8') : s0.kind === 'lever' ? (pulse ? '#ffd650' : '#fff6c8') : (pulse ? '#8af0ff' : '#ffffff'), '#05040a', true);
    }
    for (const e of g.enemies) if (e.herald && !e.dead) mark(e.x, e.y, 'crown', '#f2c14e', '#ff4a5a', true);
    for (const ev of m.events || []) {                       // fallen stars and coin thieves
      if (ev.chest && ev.chest.opened) continue;
      if (ev.e && ev.e.dead) continue;
      const x = ev.e ? ev.e.x : ev.x, y = ev.e ? ev.e.y : ev.y;
      if (ev.kind === 'star') mark(x, y, 'star', blink ? '#8af6ff' : '#ffffff', '#ffffff', true);
      else mark(x, y, 'coin', '#ffd650', '#a86a10', true);
    }
    for (const q of p.quests || []) if (q.kind === 'fetch' && q.realm === m.seed && !q.done) {   // where your fetch quest waits
      mark(q.x, q.y, 'quest', blink ? '#7aff9a' : '#c8ffd6', '#ffffff', true);
    }
    for (const bag of g.bags) if (bag.rare || !calm) mark(bag.x, bag.y, 'bag', bag.rare ? '#ffffff' : '#c98a22', bag.rare ? '#b06bff' : '#f2c14e', false, bag.rare ? 2 : 1);
    for (const e of g.enemies) if (e.rb && !e.dead) mark(e.x, e.y, 'skull', blink ? '#ff2a2a' : '#ff8a8a', '#05040a', true);
    if (g.boss && g.boss.state !== 'dead') mark(g.boss.x, g.boss.y, 'skull', blink ? '#ff2a2a' : '#ff8a8a', '#05040a', true);
    // player + a tick showing which way "up" on screen points
    const ux = -Math.sin(g.camAngle), uy = -Math.cos(g.camAngle);
    mc.fillStyle = '#f2c14e';
    for (let j = 2; j < 9; j++) mc.fillRect(Math.round((p.x - x0) * k + ux * j * 1.4), Math.round((p.y - y0) * k + uy * j * 1.4), 2, 2);
    mark(p.x, p.y, 'player', '#ffffff', '#3befff');
  }
  // item icons, drawn the RotMG way: the 8x8 art (stored doubled in the sheet) loses its baked outer outline,
  // is scaled up 5x, then gets a thin crisp black outline and a soft drop shadow so it pops off any background
  icon(id) {
    this.icons = this.icons || {};
    if (this.icons[id]) return this.icons[id];
    const k = iconIndex(this.W, ITEMS[id]), c = this.W.itemsCols;
    const src = document.createElement('canvas'); src.width = src.height = 16;
    const sx = src.getContext('2d');
    sx.drawImage(this.A.img.items, (k % c) * 16, Math.floor(k / c) * 16, 16, 16, 0, 0, 16, 16);
    const px = sx.getImageData(0, 0, 16, 16).data, N = 8;
    const at = (x, y) => ((y * 2) * 16 + x * 2) * 4;
    const solid = (x, y) => x >= 0 && y >= 0 && x < N && y < N && px[at(x, y) + 3] > 0;
    // the outside: every empty cell reachable from the border
    const out = new Uint8Array(N * N), stack = [];
    for (let i = 0; i < N; i++) for (const [x, y] of [[i, 0], [i, N - 1], [0, i], [N - 1, i]]) if (!solid(x, y) && !out[y * N + x]) { out[y * N + x] = 1; stack.push([x, y]); }
    while (stack.length) {
      const [x, y] = stack.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= N || ny >= N || out[ny * N + nx] || solid(nx, ny)) continue;
        out[ny * N + nx] = 1; stack.push([nx, ny]);
      }
    }
    const outside = (x, y) => x < 0 || y < 0 || x >= N || y >= N || out[y * N + x];
    // keep the shaded 16x16 detail, minus the outer outline blocks (decided per 2x2 art pixel)
    const keep = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (!solid(x, y)) continue;
      const i = at(x, y);
      if (px[i] === 22 && px[i + 1] === 15 && px[i + 2] === 20 && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => outside(x + dx, y + dy))) continue;   // any baked outline (#160F14) left on the rim
      for (let sy = 0; sy < 2; sy++) for (let sx2 = 0; sx2 < 2; sx2++) {
        const j = ((y * 2 + sy) * 16 + x * 2 + sx2) * 4;
        if (px[j + 3]) keep.push([x * 2 + sx2, y * 2 + sy, px[j], px[j + 1], px[j + 2]]);
      }
    }
    // fill the slot: the silhouette is scaled by a whole number to fit, and centred on its own bounds
    const W = 48, xs = keep.map((k) => k[0]), ys = keep.map((k) => k[1]);
    const x0 = Math.min(...xs), y0 = Math.min(...ys), bw = Math.max(...xs) - x0 + 1, bh = Math.max(...ys) - y0 + 1;
    const S = Math.min(4, 42 / Math.max(bw, bh)), ox = (W - bw * S) / 2, oy = (W - bh * S) / 2 - 1;
    const art = document.createElement('canvas'); art.width = art.height = W;
    const ax = art.getContext('2d');
    for (const [x, y, r, g, b] of keep) {
      // RotMG items are vivid: push saturation and a touch of brightness so even iron reads against the slot
      const m = (r + g + b) / 3, k = 1.3, l = 1.1;
      const f = (v) => Math.max(0, Math.min(255, Math.round((m + (v - m) * k) * l + 4)));
      ax.fillStyle = `rgb(${f(r)},${f(g)},${f(b)})`;
      const L = Math.round(ox + (x - x0) * S), T = Math.round(oy + (y - y0) * S);
      ax.fillRect(L, T, Math.round(ox + (x - x0 + 1) * S) - L, Math.round(oy + (y - y0 + 1) * S) - T);
    }
    const mask = document.createElement('canvas'); mask.width = mask.height = W;
    const mx = mask.getContext('2d');
    mx.drawImage(art, 0, 0); mx.globalCompositeOperation = 'source-in'; mx.fillStyle = '#000'; mx.fillRect(0, 0, W, W);
    const cv = document.createElement('canvas'); cv.width = cv.height = W;
    const cx = cv.getContext('2d');
    cx.globalAlpha = 0.45; cx.drawImage(mask, 2, 3);                                   // drop shadow
    cx.globalAlpha = 1;
    for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [-1, -1], [1, -1], [-1, 1], [1, 1], [-2, -1], [2, 1], [-1, 2], [1, -2]]) cx.drawImage(mask, dx, dy);   // outline
    cx.drawImage(art, 0, 0);
    return (this.icons[id] = cv.toDataURL());
  }

}
