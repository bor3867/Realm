// Canvas renderer.
// The world is drawn into a low-res buffer (1 px = 1 art pixel) then scaled up by
// an integer factor, so every pixel stays crisp. The camera can rotate: the
// GROUND layer (tiles, biome edges, foam, decor) rotates as one image, while
// every sprite stays upright at its rotated position, like classic tiny-MMO cameras.
import { lift } from './util.js';
import { installWalls } from './walls.js';
import { rxFrame } from './remaster.js';
import { TILE_NAMES, BIOMES, biomeAt, objectsIn, SKINS, SKIN_TID, TID, FLAT, WALL_FACE } from './world/maps.js';
import { hoverY } from './registry.js';
import { CLASSES } from './data/classes.js';
import { ITEMS, iconIndex } from './data/items.js';
import { outlinedFrame } from './outline.js';
import { keyHint } from './settings.js';
import { SHOT_BOXES } from './data/shot_boxes.js';

const TS = 16;
const LOOK = 0.18;                                       // how far down the screen look-ahead puts you
// the Grand Orrery's pink bolts are drawn as lasers; its yellow shards and rings hold still (their flicker was too much)
const LASER = { 'bx_shots/grand_orrery.star_bolt': ['#d02ab8', '#ff8af0'] };
const STILL = new Set(['bx_shots/grand_orrery.brass_shard', 'bx_shots/grand_orrery.eclipse_ring', 'bx_shots/grand_orrery.corona_flare', 'bx_shots/grand_orrery.moon_shard']);
const MINI = { 0: '#1e5078', 1: '#102c48', 2: '#d2b074', 3: '#3e6230', 4: '#4e412c', 5: '#c4d2e0', 6: '#5e5a76', 7: '#5e5a76',
  8: '#3e373c', 9: '#221d28', 10: '#d8d2c4', 11: '#3a2a2a', 12: '#2e2a38', 13: '#c0400e', 14: '#0a080c',
  15: '#4e6670', 16: '#8a9aa0', 17: '#221d28', 18: '#c8c0b0', 19: '#4a7a30', 20: '#8e8a9a', 21: '#9a764e', 22: '#18321a', 23: '#5aa0c8', 24: '#3a4a28', 25: '#c4dcee',
  26: '#f0dcae', 27: '#b8dcd8', 28: '#2e3a22', 29: '#121c0e', 30: '#b89a48', 31: '#8a7aa8',
  32: '#3a4a5c', 33: '#7486a0', 34: '#2a6c9c', 35: '#3c2a28', 36: '#6c524a', 37: '#ff8c1e', 38: '#8e1e30',
  39: '#a86e26', 40: '#e8c878', 41: '#ffc040', 42: '#7a4e28', 43: '#6a1224', 44: '#2e2e56', 45: '#8a6ad0', 46: '#8878bc', 47: '#d8d0f4', 48: '#0a0618', 49: '#d8a8e8', 50: '#98c0f0', 51: '#1a1236',
  52: '#5a5866', 53: '#c02a8a', 54: '#dceaf4', 55: '#9ad4f0', 56: '#2a6c9c', 57: '#4a5e86', 58: '#5a4a2e', 59: '#3e6a2a', 60: '#8a7a52', 61: '#2e3a22', 62: '#c8c0dc', 63: '#a87a3a', 64: '#0a0618', 65: '#4a3a7a', 66: '#e0c080', 67: '#a8885a', 68: '#8a6a3a', 69: '#6a4a2a', 70: '#4a4450', 71: '#8e1e30', 72: '#c8c0c8', 73: '#5a0a14', 74: '#2a2430', 75: '#3a3448', 76: '#c8a070', 77: '#8a6a48', 78: '#e8e0f0', 79: '#c83a8a', 80: '#6a1a3a' };   // cliff, rift, Frostveil snow, ice, frigid water, wall
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const GROUND_CHUNK = 8;                                   // the ground is drawn and cached in chunks of 8x8 tiles          // N E S W (matches edge sheet order)
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
  lowlands: { n: 22, color: ['#fff6c8', '#d8f0a0', '#ffffff'], vx: 6, vy: 1, size: 1, blink: false },        // thistledown on the breeze
  frostveil: { n: 48, color: ['#ffffff', '#cfffff', '#e8f6ff'], vx: 3, vy: 9, size: 1, blink: false },       // snow sifting down through the ice
  mirerot: { n: 30, color: ['#c8ff8a', '#8aff6a', '#e8ffd0'], vx: 1, vy: -2, size: 1, blink: true },        // spores drifting up in the dark
  astral: { n: 40, color: ['#ffffff', '#ffd690', '#c8a0ff'], vx: 0.5, vy: 0.4, size: 1, blink: true },         // stars, near and far
  keep: { n: 22, color: ['#8e1e30', '#c8b0a0', '#5a0a14'], vx: -1, vy: 1.5, size: 1, blink: false },          // dust and the odd drop of red
  hollowmoon: { n: 36, color: ['#ff8fbf', '#ffd650', '#8af6ff', '#7aff9a'], vx: 0.5, vy: 3, size: 1, blink: true },   // confetti, still falling
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
    const G = Math.ceil(Math.hypot(this.buf.width, this.buf.height * (1 + 2 * LOOK)) / 2) * 2 + 48;   // room for the look-ahead offset
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
    // look ahead (a setting, toggled by a key): you sit near the bottom of the screen, so you see further in front
    this.look = (this.look || 0) + ((this.settings && this.settings.lookAhead ? 1 : 0) - (this.look || 0)) * 0.12;
    this.cx = Math.floor(this.buf.width / 2); this.cy = Math.floor(this.buf.height / 2) + 5 + Math.round(this.look * this.buf.height * LOOK);
  }
  // a point at height h above (x, y): its ground point projected, then straight up the screen
  projUp(x, y, h) { const [sx, sy] = this.proj(x, y); return [sx, sy - h * TS]; }
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
    this.drawWallTops();                                    // every seen wall's top, one tile up the screen (src/walls.js)
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
    const VR = Math.hypot(BW, BH) / TS / 2 + 4;                     // the view's reach, in tiles, at any camera angle
    for (const o of objectsIn(m, g.player.x - VR, g.player.y - VR, g.player.x + VR, g.player.y + VR)) {
      const n0 = list.length;
      add(o.x, o.y, (sx, sy) => this.obj(o, sx, sy));
      if (list.length > n0 && FLAT.has(o.sprite)) list[n0].sy -= 12;               // flat clutter lies under whoever stands on it
    }
    this.addWalls(g, m, list, VR);                                  // walls stand up: border walls sort with everyone (src/walls.js)
    for (const pt of m.portals) add(pt.x, pt.y, (sx, sy) => this.portal(g, pt, sx, sy));
    for (const bag of g.bags) {                                // a bag on a portal is drawn in front of it, never hidden inside
      const onPortal = m.portals.some((pt) => Math.abs(pt.x - bag.x) < 1.8 && Math.abs(pt.y - bag.y) < 1.8);
      const n0 = list.length;
      add(bag.x, bag.y, (sx, sy) => this.bag(g, bag, sx, sy));
      if (onPortal && list.length > n0) list[n0].sy += 40;
    }
    const drawn = g.activeMap === m ? new Set(g.active) : null;
    if (drawn) { for (const e of g.notable) drawn.add(e); for (const e of g.enemies) if (e.dead && e.deadT < 1.4) drawn.add(e); }
    for (const e of drawn || g.enemies) add(e.x, e.y, (sx, sy) => this.enemy(g, e, sx, sy));
    if (g.boss) add(g.boss.x, g.boss.y, (sx, sy) => this.boss(g, g.boss, sx, sy));
    add(g.player.x, g.player.y, (sx, sy) => this.player(g, g.player, sx, sy));
    for (const L of g.player.orbsLive || []) add(...lift(L.B.x, L.B.y, -0.5), () => this.orbiter(g, L));   // what circles you (src/orbiters.js)
    for (const a of g.allies || []) add(a.x, a.y, (sx, sy) => (a.kind === 'kite' ? this.kiteSpr(g, a, sx, sy) : this.ally(g, a, sx, sy)));
    for (const d of g.decoys || []) add(d.x, d.y, (sx, sy) => this.decoy(g, d, sx, sy));
    for (const v of m.villagers || []) add(v.x, v.y, (sx, sy) => this.villager(g, v, sx, sy));
    for (const v of m.penPets || []) add(v.x, v.y, (sx, sy) => this.villager(g, v, sx, sy));        // pets in the Pet Yard
    if (g.pet && !g.player.dead) add(g.pet.x, g.pet.y, (sx, sy) => this.villager(g, g.pet, sx, sy)); // your companion
    if (g.hatching) add(g.hatching.x, g.hatching.y, (sx, sy) => this.hatchEgg(g, g.hatching, sx, sy));   // an egg hatching at your feet
    if (m.belts) this.beltFx(g, m.belts);
    if (g.arena) this.arenaFx(g, g.arena);
    if (g.timeStop) this.timeDial(g, g.timeStop);
    for (const f of g.fx) if (f.kind === 'cloud' || f.kind === 'zone') this.groundFx(f, g);
    if (g.activeMap === m) for (const e of g.notable) if (e.bx && e.bx.B.drawGround && !e.dead) e.bx.B.drawGround(this, g, e);   // a boss's hazards on the ground
    this.spGround(g);                                       // set-piece telegraphs (src/setpieces.js)
    if (m.mrClouds || m.mrPuddles) this.mireFx(g, m);
    if (m.asClocks || m.asDais) this.astralFx(g, m);
    if (m.emVents) for (const V of m.emVents) if (V.warn) {           // the Emberforge: a vent about to erupt glows and shudders
      const [x, y] = this.proj(V.o.x, V.o.y), b = this.b;
      b.globalAlpha = 0.5; b.fillStyle = Math.floor(g.t * 14) % 2 ? '#ffd84a' : '#ff6a1a';
      b.beginPath(); b.ellipse(Math.round(x), Math.round(y), 9, 5, 0, 0, Math.PI * 2); b.fill(); b.globalAlpha = 1;
    }
    if (m.hmCannons) for (const o of m.hmCannons) if (o.hmCannon.aim !== null && o.hmCannon.aim !== undefined) {   // a cannon's line: where the glove will fly
      const a = o.hmCannon.aim, b = this.b, k = Math.max(0, Math.min(1, 1 - o.hmCannon.t / 1.2));
      b.fillStyle = Math.floor(g.t * 10) % 2 ? '#ff4a8a' : '#ffd650'; b.globalAlpha = 0.4 + 0.5 * k;
      for (let d = 1; d < 15; d += 0.5) { const [x, y] = this.proj(o.x + Math.cos(a) * d, o.y - 0.4 + Math.sin(a) * d); if (Math.floor(d * 2) % 2) b.fillRect(Math.round(x), Math.round(y), 2, 2); }
      b.globalAlpha = 1;
    }
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
      else if (f.kind === 'wglyph' || f.kind === 'wphantom') this.mechFx(f, g);
      else if (f.kind === 'halo') this.haloFx(f, g);
      else if (f.kind === 'sigil' || f.kind === 'sigilq') this.sigilFx(f, g);
      else if (f.kind === 'myth') this.mythFx(f, g);
      else if (f.kind === 'gear') this.gearFx(f, g);
    }
    this.mechMarks(g);
    if (g.player.ward > 0 && !g.player.dead) this.wardFx(g);
    const darkFirst = g.map.lights && g.map.kind === 'dungeon';     // in a dungeon the dark falls under the bullets: shots always read
    if (darkFirst) { b.save(); b.setTransform(this.scale, 0, 0, this.scale, 0, 0); this.dusk(g); b.restore(); }   // the screen's own scale, without the shake
    if (g.map.kind === 'dungeon') this.d4Fx(g);                  // the newer dungeons' lights, beams and strings (over the dark)
    this.drawProjectiles(g, dt);
    if (g.activeMap === m) for (const e of g.notable) if (e.bx && e.bx.B.drawTop && !e.dead) e.bx.B.drawTop(this, g, e);   // a boss's layer over the bullets (the Orrery's umbra)
    this.drawZaps(dt);
    this.drawParticles(dt);
    this.drawSprFx(dt);
    if (g.darkUntil > g.t && g.darkBy && !g.darkBy.dead) this.darkFx(g);
    if (g.inkUntil > g.t) this.inkFx(g);
    if (g.player.chill > 0 && !g.player.dead) this.chillFx(g);
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
  // The ground, in cached chunks of 8x8 tiles: each chunk is drawn once (tile by tile, exactly as before) and redrawn
  // only when something in it changes: its tiles, skins or explored state (a 1-tile border included, for the edge
  // blends), or its animation frame if it has moving tiles. Then the light, then the fog (cached the same way, over the
  // light, so the unexplored stays black). Drawing ~3700 tiles a frame cost 3-12 ms; this costs a fraction of one.
  drawGround(g) {
    const m = g.map, gc = this.gctx, G = this.ground.width;
    const Px = Math.round(this.px * TS), Py = Math.round(this.py * TS);
    const ox = Px - G / 2, oy = Py - G / 2;
    gc.fillStyle = '#0a080c'; gc.fillRect(0, 0, G, G);
    const tx0 = Math.floor(ox / TS), ty0 = Math.floor(oy / TS), n = Math.ceil(G / TS) + 1;
    const anim = Math.floor(g.t * 2.2);
    if (!m.decorAt && m.decor) { m.decorAt = new Map(); for (const d of m.decor) m.decorAt.set(d.y * m.w + d.x, d.name); }
    if (this.chunkMap !== m) { this.chunkMap = m; this.chunks = new Map(); this.fogs = new Map(); }
    const C = GROUND_CHUNK, cx0 = Math.floor(tx0 / C), cy0 = Math.floor(ty0 / C), cx1 = Math.floor((tx0 + n) / C), cy1 = Math.floor((ty0 + n) / C);
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) gc.drawImage(this.groundChunk(g, m, cx, cy, anim).c, cx * C * TS - ox, cy * C * TS - oy);
    this.composeWallTops(g, m, ox, oy, cx0, cy0, cx1, cy1, anim);   // the walls' tops, lifted over all this (src/walls.js)
    // ground light first, then the fog over it: the unexplored stays black, never tinted
    if (!this.settings || this.settings.groundLight !== false) {
      const L = this.lightFor(m);
      gc.imageSmoothingEnabled = true;
      gc.drawImage(L, tx0 + 2, ty0 + 2, n, n, tx0 * TS - ox, ty0 * TS - oy, n * TS, n * TS);
      gc.imageSmoothingEnabled = false;
    }
    if (m.seen) for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {   // the edge of the known world fades into the fog
      const F = this.fogChunk(m, cx, cy);
      if (F.any) gc.drawImage(F.c, cx * C * TS - ox, cy * C * TS - oy);
    }
  }
  // what a chunk's look depends on, as one number (a 1-tile border for the blends; the fog's 2-tile reach for the fog)
  chunkSig(m, cx, cy, pad, fog) {
    const C = GROUND_CHUNK, sk = m.skin, sn = m.seen;
    let h = fog ? 7 : 1;
    for (let y = cy * C - pad; y < cy * C + C + pad; y++) for (let x = cx * C - pad; x < cx * C + C + pad; x++) {
      const out = x < 0 || y < 0 || x >= m.w || y >= m.h, j = y * m.w + x;
      const v = out ? -1 : fog ? (sn[j] ? 1 : 0) : m.tiles[j] * 4 + (sk ? sk[j] * 1024 : 0) + (sn && sn[j] ? 1 : 0);
      h = (Math.imul(h, 31) + v) | 0;
    }
    return h;
  }
  keepChunk(cache, key, K) { cache.delete(key); cache.set(key, K); if (cache.size > 600) cache.delete(cache.keys().next().value); return K; }
  groundChunk(g, m, cx, cy, anim) {
    const key = cx * 65536 + cy, K0 = this.chunks.get(key), base = this.chunkSig(m, cx, cy, 1, false);
    if (K0 && K0.base === base && (!K0.moving || K0.anim === anim)) return this.keepChunk(this.chunks, key, K0);
    const C = GROUND_CHUNK, K = K0 || { c: Object.assign(document.createElement('canvas'), { width: C * TS, height: C * TS }) };
    const ctx = K.c.getContext('2d'); ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, C * TS, C * TS);
    let moving = false;
    for (let ty = cy * C; ty < cy * C + C; ty++) for (let tx = cx * C; tx < cx * C + C; tx++) moving = this.groundTile(ctx, m, tx, ty, (tx - cx * C) * TS, (ty - cy * C) * TS, anim) || moving;
    K.base = base; K.moving = moving; K.anim = anim;
    return this.keepChunk(this.chunks, key, K);
  }
  // one tile of ground, drawn at (dx, dy) of a chunk; true if it animates
  groundTile(gc, m, tx, ty, dx, dy, anim) {
    const W = this.W, tiles = this.A.img.tiles, cols = W.tilesCols, edges = W.edges, prio = W.priority;
    const cell = (i, x, y) => gc.drawImage(tiles, (i % cols) * TS, Math.floor(i / cols) * TS, TS, TS, x, y, TS, TS);
    const name = (x, y) => (x < 0 || y < 0 || x >= m.w || y >= m.h ? 'void' : TILE_NAMES[m.tiles[y * m.w + x]]);
    // Realm Update ground skins (see SKINS in maps.js): native 8x8 art drawn at 2x, animated like the old tiles
    const SA = m.skin ? this.skinArt() : null, sk = m.skin;
    const skinned = (x, y) => { if (!sk || x < 0 || y < 0 || x >= m.w || y >= m.h) return false; const j = y * m.w + x, k = sk[j]; return k > 0 && SKIN_TID[k] === m.tiles[j]; };
    const nm = name(tx, ty), T = W.tiles[nm];
    if (m.seen && (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h || !m.seen[ty * m.w + tx])) { gc.fillStyle = '#000'; gc.fillRect(dx, dy, TS, TS); return false; }
    const h = ((tx * 73856093) ^ (ty * 19349663)) >>> 0;
    let moving = false;
    if (SA && skinned(tx, ty)) {
      const A = SA[sk[ty * m.w + tx]], f = A.fr[A.fr.length > 1 ? (anim + ((tx * 7 + ty * 3) >> 2)) % A.fr.length : 0];
      if (A.fr.length > 1) moving = true;
      if (A.img) gc.drawImage(A.img, f.x, f.y, f.w, f.h, dx, dy, TS, TS);
    } else if (T) {
      const v = T.variants > 1 ? ((h >>> 4) ^ (h >>> 13)) % T.variants : 0;            // RotMG-style: variants scattered at random
      if (T.frames > 1) moving = true;
      cell(T.i + v * T.frames + (T.frames > 1 ? (anim + ((tx * 7 + ty * 3) >> 2)) % T.frames : 0), dx, dy);
    }
    const pm = prio[nm];
    const water = nm === 'water' || nm === 'deep';
    for (let d = 0; d < 4; d++) {
      const nn = name(tx + DIRS[d][0], ty + DIRS[d][1]);
      if (water) {
        if (prio[nn] !== undefined) { cell(edges.foam + (anim % 3) * 4 + d, dx, dy); moving = true; }   // shoreline foam
      } else if (pm !== undefined && prio[nn] > pm && !skinned(tx + DIRS[d][0], ty + DIRS[d][1])) cell(edges[nn] + d, dx, dy);   // dithered biome blend (a skinned neighbour blends by its tiles instead)
    }
    if (m.decorAt) {
      const dn = m.decorAt.get(ty * m.w + tx);
      if (dn && (h >>> 9) % 3 === 0) {                     // RotMG ground is mostly bare: only a third of the clutter
        const na = (W.decorAnim || {})[dn], k = W.decor[dn] + (na ? Math.floor(anim * 0.6 + tx * 0.7 + ty * 0.3) % na : 0), dc = W.decorCols;
        if (na) moving = true;
        gc.drawImage(this.A.img.decor, (k % dc) * TS, Math.floor(k / dc) * TS, TS, TS, dx, dy, TS, TS);
      }
    }
    return moving;
  }
  // the fog over a chunk: the unexplored black, the known world's edge fading into it
  fogChunk(m, cx, cy) {
    const key = cx * 65536 + cy, F0 = this.fogs.get(key), sig = this.chunkSig(m, cx, cy, 2, true);
    if (F0 && F0.sig === sig) return this.keepChunk(this.fogs, key, F0);
    const C = GROUND_CHUNK, F = F0 || { c: Object.assign(document.createElement('canvas'), { width: C * TS, height: C * TS }) };
    const ctx = F.c.getContext('2d'); ctx.clearRect(0, 0, C * TS, C * TS);
    const unseen = (x, y) => x < 0 || y < 0 || x >= m.w || y >= m.h || !m.seen[y * m.w + x];
    let any = false;
    for (let ty = cy * C; ty < cy * C + C; ty++) for (let tx = cx * C; tx < cx * C + C; tx++) {
      const dx = (tx - cx * C) * TS, dy = (ty - cy * C) * TS;
      if (unseen(tx, ty)) { ctx.fillStyle = '#000'; ctx.fillRect(dx, dy, TS, TS); any = true; continue; }
      let k = 0;
      for (let yy = -2; yy <= 2; yy++) for (let xx = -2; xx <= 2; xx++) if (unseen(tx + xx, ty + yy)) k = Math.max(k, 3 - Math.max(Math.abs(xx), Math.abs(yy)));
      if (k) { ctx.fillStyle = `rgba(0,0,0,${[0, 0.25, 0.5, 0.72][k]})`; ctx.fillRect(dx, dy, TS, TS); any = true; }
    }
    F.sig = sig; F.any = any;
    return this.keepChunk(this.fogs, key, F);
  }
  // RotMG-style walls: the wall's top is its tile (drawn with the ground); its face hangs below it on the camera's side,
  // over the floor in front, sorted so that anyone standing in front of the wall is drawn over the face
  wallFaces(g, m, add, list, VR) {
    const SA = this.skinArt(), faces = this.faceArt || (this.faceArt = {});
    const dirs = [[0, 1, this.cs], [1, 0, this.sn], [0, -1, -this.cs], [-1, 0, -this.sn]];
    const [fx, fy] = dirs.reduce((a, b) => (b[2] > a[2] ? b : a));          // the world direction that points down the screen
    const x0 = Math.max(1, Math.floor(g.player.x - VR)), x1 = Math.min(m.w - 2, Math.ceil(g.player.x + VR));
    const y0 = Math.max(1, Math.floor(g.player.y - VR)), y1 = Math.min(m.h - 2, Math.ceil(g.player.y + VR));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = y * m.w + x, t = m.tiles[i], nm = TILE_NAMES[t], key = WALL_FACE[nm];
      if (!key || !m.skin[i]) continue;
      const j = (y + fy) * m.w + x + fx, tn = m.tiles[j];
      if (WALL_FACE[TILE_NAMES[tn]] || tn === TID.void) continue;            // only a face that looks out over floor
      let F = faces[key];
      if (F === undefined) { const def = this.R && this.R.resolve(key), f = def && def.frames[Object.keys(def.frames)[0]]; F = faces[key] = f ? { img: def.img, f } : null; }
      if (!F) continue;
      const n0 = list.length;
      add(x + 0.5, y + 0.5, (sx, sy) => this.b.drawImage(F.img, F.f.x, F.f.y, F.f.w, F.f.h, sx - 8, sy + 8, 16, 16));
      if (list.length > n0) list[n0].sy += 7.9;
      void SA;
    }
  }
  // each ground skin's image and frames, looked up once
  skinArt() {
    if (this.skinA) return this.skinA;
    return (this.skinA = SKINS.map((s) => {
      const def = s && this.R && this.R.resolve(s[0]);
      if (!def) return { img: null, fr: [{ x: 0, y: 0, w: 1, h: 1 }] };
      const clip = Object.values(def.anims)[0];
      return { img: def.img, fr: clip.frames.map((f) => def.frames[f]) };
    }));
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
    if (o.hidden || o.block) return;                          // (a ruin piece stands as a block: src/walls.js)
    if (o.interact === 'weak') {                             // a secret wall: drawn as plain wall (the tile), with the faintest hairline crack
      const b = this.b, x = Math.round(sx), y = Math.round(sy);
      b.globalAlpha = 0.28; b.fillStyle = '#05040a';
      b.fillRect(x - 2, y - 3, 1, 1); b.fillRect(x - 1, y - 2, 1, 1); b.fillRect(x, y - 2, 1, 1); b.fillRect(x + 1, y - 1, 1, 1);
      b.globalAlpha = 1;
      return;
    }
    if (o.trophy) return this.trophy(o, sx, sy);
    if (o.sprite.includes('/')) {                            // a Realm Update object (registry): stands on the bottom of its tile
      const C = this.objDefs || (this.objDefs = new Map());
      let def = C.get(o.sprite);
      if (def === undefined) C.set(o.sprite, (def = (this.R && this.R.resolve(o.sprite)) || null));
      if (!def) return;
      if (o.melonOpen) {                                     // the burst melon's halves, in their juice, fading at the end
        if (this.lastT < o.born) return;
        this.drawDef(def, def.anims.opened.frames[0], sx, sy + 4, { alpha: Math.max(0, Math.min(1, (o.until - this.lastT) / 3)) });
        return;
      }
      const A = Object.values(def.anims)[0];
      let fr = A.frames.length > 1 && !o.unlit ? A.frames[Math.floor(this.lastT * (A.fps || 4) + o.x * 0.7 + o.y * 0.3) % A.frames.length] : A.frames[0];
      if (o.asTrap) { const k = this.lastT - (o.clipT || -99); fr = A.frames[k < 0.45 ? 1 : k < 0.75 ? 2 : 0]; }   // a vault trap plate: idle, arming, firing
      else if (o.clip && def.anims[o.clip]) { const C2 = def.anims[o.clip], k = Math.max(0, Math.floor((this.lastT - (o.clipT || 0)) * (C2.fps || 4))); fr = C2.frames[C2.loop ? k % C2.frames.length : Math.min(C2.frames.length - 1, k)]; }   // an object playing a named clip (the star vault)
      else if (o.sdSarc) fr = A.frames[o.openT === undefined ? 0 : Math.min(A.frames.length - 1, Math.floor((this.lastT - o.openT) * 8))];   // a sarcophagus: shut, or its lid sliding open
      else if (o.sdUrn) fr = A.frames[o.cracked ? 1 : 0];
      else if (o.ckCoffin && def.anims.open) fr = (o.openT === undefined ? def.anims.closed : def.anims.open).frames[0];   // a coffin, shut or open
      else if (o.hmStriker && def.anims.ring) { const k = this.lastT - (o.ringT || -9); fr = k < 0.8 ? def.anims.ring.frames[Math.min(def.anims.ring.frames.length - 1, Math.floor(k * 8))] : def.anims.idle.frames[0]; }   // the puck flies up and rings the bell
      if (o.solid) this.shadow(sx, sy + 7, def.size[1] > 8 ? 12 : 10);
      if (o.fuse !== undefined) { this.drawDef(def, fr, sx, sy + 8, { scale: 1.3, flash: Math.floor(this.lastT * 20) % 2 === 0 }); return; }   // a spore pod about to burst
      this.drawDef(def, fr, sx, sy + 8, o.unlit ? { alpha: 0.45 } : undefined);   // a brazier gone out is dark and still
      if (o.sprite === 'ow_objects/midlands_campfire' && Math.random() < 0.35) {
        const ember = Math.random() < 0.6;
        this.parts.push({ x: o.x + (Math.random() - 0.5) * 0.4, y: o.y, z: 6, vx: (Math.random() - 0.5) * 0.3, vy: 0, vz: ember ? 18 + Math.random() * 14 : 8,
          g: ember ? 0 : -2, life: ember ? 0.9 : 1.6, max: 1.6, color: ember ? (Math.random() < 0.5 ? '#ffc94a' : '#f2641a') : '#4a4458' });
      }
      return;
    }
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
    if (v.sprite && v.sprite.startsWith('pt2_')) return this.petBody(g, v, sx, sy);
    const k = this.W.objects[v.sprite] + (v.moving ? Math.floor(g.t * 6) % 2 : 0), c = this.W.objectsCols;
    this.shadow(sx, sy, 8);
    this.spr(this.A.img.objects, (k % c) * TS, Math.floor(k / c) * TS, TS, TS, sx, sy, 8, 15, !!v.face);
    const aura = { rare: ['#7aa8ff', '#ffffff', 0.05], legendary: ['#ffd650', '#fff6c8', 0.1], divine: ['#ff7af0', '#8af6ff', 0.16] }[v.rarity];
    if (aura && Math.random() < aura[2]) {                // rarer pets glitter as they go
      this.parts.push({ x: v.x + (Math.random() - 0.5) * 0.8, y: v.y, z: 3 + Math.random() * 10, vx: 0, vy: 0, vz: 5 + Math.random() * 5, g: 0, life: 0.7, max: 0.7, color: aura[Math.random() < 0.6 ? 0 : 1] });
    }
  }
  // a Pets v2 pet: idle (it blinks; divine forms twinkle), follow while it trails you, happy (a heart) when it's pleased
  petBody(g, v, sx, sy) {
    const def = this.R && this.R.resolve(v.sprite);
    if (!def) return;
    const A = def.anims, clip = v.joy > g.t && A.happy ? 'happy' : v.moving && A.follow ? 'follow' : 'idle', C = A[clip] || A.idle;
    const t = clip === 'happy' ? Math.max(0, g.t - v.joy0) : g.t + (v.x || 0) * 0.37;   // pen pets don't blink in step
    const n = C.frames.length, i = clip === 'happy' && !C.loop ? Math.min(n - 1, Math.floor(t * C.fps)) : Math.floor(t * C.fps) % n;
    this.shadow(sx, sy, def.size[0] > 10 ? 10 : 8);
    this.drawDef(def, C.frames[i], Math.round(sx), Math.round(sy) + 1, { flip: !!v.face, flash: v.flashT > g.t && Math.floor(g.t * 16) % 2 === 0 });
    if (clip === 'happy' && i === 0 && !v.hearted) { v.hearted = true; this.parts.push({ x: v.x, y: v.y, z: def.size[1] * 2 + 2, vx: 0, vy: 0, vz: 7, g: 0, life: 0.9, max: 0.9, color: '#ff8fbf', heart: true }); }
    if (clip !== 'happy') v.hearted = false;
    const aura = { rare: ['#7aa8ff', '#ffffff', 0.05], legendary: ['#ffd650', '#fff6c8', 0.1], divine: ['#ff7af0', '#8af6ff', 0.16] }[v.rarity];
    if (aura && Math.random() < aura[2]) {                // rarer pets glitter as they go
      this.parts.push({ x: v.x + (Math.random() - 0.5) * 0.8, y: v.y, z: 3 + Math.random() * 10, vx: 0, vy: 0, vz: 5 + Math.random() * 5, g: 0, life: 0.7, max: 0.7, color: aura[Math.random() < 0.6 ? 0 : 1] });
    }
  }
  // an egg hatching: its own clip (wobble, wobble, crack, burst); the pet appears on the burst frame
  hatchEgg(g, h, sx, sy) {
    const def = this.R && this.R.resolve(h.egg);
    if (!def || !def.anims.hatch) return;
    const C = def.anims.hatch, i = Math.min(C.frames.length - 1, Math.floor(h.t * C.fps));
    if (h.pet && h.t > C.frames.length / C.fps) return;   // the shell's last frame has played
    this.shadow(sx, sy, 7);
    this.drawDef(def, C.frames[i], Math.round(sx), Math.round(sy) + 1, {});
  }
  // a set piece's telegraphs: where something will land (circle), a path (line), a ring, and where to be (safe, wedge)
  spGround(g) {
    const b = this.b, T2 = Math.PI * 2;
    for (const m of g.spMarks || []) {
      const k = Math.min(1, (g.t - m.born) / Math.max(0.01, m.until - m.born)), [x, y] = this.proj(m.x, m.y), blink = Math.floor(g.t * 10) % 2;
      if (m.kind === 'circle' || m.kind === 'safe') {
        const safe = m.kind === 'safe', R0 = m.r * TS;
        b.globalAlpha = safe ? 0.22 : 0.12 + 0.25 * k; b.fillStyle = safe ? '#5ef08a' : m.color || '#ff4a5a';
        b.beginPath(); b.ellipse(Math.round(x), Math.round(y), R0, R0 * 0.75, 0, 0, T2); b.fill();
        b.globalAlpha = 0.85; b.fillStyle = safe ? (blink ? '#c8ffd8' : '#5ef08a') : (blink ? '#ffffff' : m.color || '#ff4a5a');
        const n = Math.max(12, Math.round(R0 * 0.8));
        for (let i = 0; i < n; i++) { const a = (i / n) * T2; b.fillRect(Math.round(x + Math.cos(a) * R0) - 1, Math.round(y + Math.sin(a) * R0 * 0.75) - 1, 2, 2); }
      } else if (m.kind === 'ring') {
        b.globalAlpha = 0.6 * (1 - k); b.strokeStyle = m.color || '#ffffff'; b.lineWidth = 2;
        b.beginPath(); b.ellipse(Math.round(x), Math.round(y), m.r * TS * (0.4 + 0.6 * k), m.r * TS * 0.75 * (0.4 + 0.6 * k), 0, 0, T2); b.stroke(); b.lineWidth = 1;
      } else if (m.kind === 'line') {
        if (m.band) {                                      // a lane: a soft stripe on the floor, as wide as the opening
          const nx = -Math.sin(m.a) * m.band / 2, ny = Math.cos(m.a) * m.band / 2, ex = Math.cos(m.a) * m.len, ey = Math.sin(m.a) * m.len;
          const P = [[m.x + nx, m.y + ny], [m.x + ex + nx, m.y + ey + ny], [m.x + ex - nx, m.y + ey - ny], [m.x - nx, m.y - ny]].map(([qx, qy]) => this.proj(qx, qy));
          b.globalAlpha = 0.2; b.fillStyle = m.color || '#5ef08a'; b.beginPath(); b.moveTo(P[0][0], P[0][1]); for (const q of P.slice(1)) b.lineTo(q[0], q[1]); b.closePath(); b.fill();
        }
        b.globalAlpha = m.steady ? 0.55 : 0.85; b.fillStyle = blink && !m.steady ? '#ffffff' : m.color || '#ff4a5a';   // (a steady line: a lane to hold, no blinking)
        for (let d = 0.6; d < m.len; d += 0.45) { const [qx, qy] = this.proj(m.x + Math.cos(m.a) * d, m.y + Math.sin(m.a) * d); b.fillRect(Math.round(qx) - 1, Math.round(qy) - 1, 2, 2); }
      } else if (m.kind === 'wedge') {                     // the way out: a green wedge
        b.globalAlpha = 0.28; b.fillStyle = '#5ef08a';
        b.beginPath(); b.moveTo(x, y);
        for (let i = 0; i <= 12; i++) { const a = m.a - m.w + (i / 12) * 2 * m.w, [qx, qy] = this.proj(m.x + Math.cos(a) * m.len, m.y + Math.sin(a) * m.len); b.lineTo(qx, qy); }
        b.closePath(); b.fill();
      }
      b.globalAlpha = 1;
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
      const [x0, y0] = this.projUp(o.x, o.y, 0.6), [x1, y1] = this.projUp(o.x + Math.cos(o.ang) * 10, o.y + Math.sin(o.ang) * 10, 0.6);
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
    // the Puppeteer's trapdoors: wooden hatches in the boards; each flickers when its moment comes, the last burns gold
    for (const H of S.hatches || []) {
      const [x, y] = P(H.x, H.y), lit = g.t >= H.at, last = H === S.hatches[S.hatches.length - 1];
      b.fillStyle = '#1a0e08'; b.fillRect(Math.round(x) - 8, Math.round(y) - 5, 16, 10);
      b.fillStyle = lit ? (last ? (Math.floor(g.t * 12) % 2 ? '#ffd650' : '#ffffff') : '#c8962a') : '#5a3a22';
      b.fillRect(Math.round(x) - 7, Math.round(y) - 4, 14, 8);
      b.fillStyle = '#1a0e08'; b.fillRect(Math.round(x) - 7, Math.round(y), 14, 1); b.fillRect(Math.round(x), Math.round(y) - 4, 1, 8);
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
    const src = g.map.kind === 'dungeon' && !g.player.dead ? [...g.map.lights, { x: g.player.x, y: g.player.y, h: 0.5, r: 92, col: '#fff0d0' }] : g.map.lights;   // in a dungeon you carry a light
    const lights = [];                                     // (a lamp's light sits up the screen, at its height: projUp)
    for (const L of src) { if (!g.seen(L.x, L.y)) continue; const [lx, ly] = this.projUp(L.x, L.y, L.h || 0); if (lx < -L.r || ly < -L.r || lx > BW + L.r || ly > BH + L.r) continue; lights.push({ lx, ly, R: L.r * (L.fire ? flick + Math.sin(g.t * 9 + L.x) * 0.03 : 1), fire: L.fire, col: L.col }); }
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
    if (bag.legend) {                                      // a legendary inside: a broad beam, sparkles climbing it
      const b = this.b, x = Math.round(sx), y = Math.round(sy);
      b.globalAlpha = 0.35; b.fillStyle = '#ffc93a'; b.fillRect(x - 3, y - 96, 7, 92);
      b.globalAlpha = 0.85; b.fillStyle = '#fff6d8'; b.fillRect(x - 1, y - 96, 3, 92); b.globalAlpha = 1;
      for (let k = 0; k < 4; k++) {
        const u = (g.t * 0.6 + k / 4) % 1, yy = y - 8 - u * 84, xx = x + Math.round(Math.sin(u * 9 + k * 2) * 4);
        b.fillStyle = k % 2 ? '#ffffff' : '#ffd650';
        b.fillRect(xx, yy - 1, 1, 3); b.fillRect(xx - 1, yy, 3, 1);
      }
    } else if (bag.rare) {                                 // a beam of light: white, gold for starfall, crimson for divine
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
    if (e.spawnT > 0) return this.eliteArrival(g, e, sx, sy);
    if (e.D.objSprite) return this.propEnemy(g, e, sx, sy);
    if (e.D.reg) return this.regEnemy(g, e, sx, sy);
    if (e.D.melon) return this.melon(g, e, sx, sy);
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
  // a Realm Update monster (registry art, 4 frames: two to move, attack, hurt), with the same body language as the rest
  regEnemy(g, e, sx, sy) {
    const C = this.objDefs || (this.objDefs = new Map());
    let def = C.get(e.D.reg);
    if (def === undefined) C.set(e.D.reg, (def = (this.R && this.R.resolve(e.D.reg)) || null));
    if (!def) return;
    if (e.under) return this.mound(g, e, sx, sy, e.D.ability ? 22 : 10);
    const F = Object.keys(def.frames), mv = (def.anims.move || def.anims.walk) ? (def.anims.move || def.anims.walk).frames : F.slice(0, 2);
    const fAtk = def.anims.attack ? def.anims.attack.frames[def.anims.attack.frames.length - 1] : F[2], fHurt = def.anims.hurt ? def.anims.hurt.frames[0] : F[3];   // by clip: some have three gallop frames
    let fr;
    if (e.asDormant && def.anims.dormant) fr = def.anims.dormant.frames[0];        // the Vault Keeper, asleep by its chest
    else if (e.asWakeT > 0 && def.anims.wake) { const A = def.anims.wake; fr = A.frames[Math.min(A.frames.length - 1, Math.floor((0.8 - e.asWakeT) * A.fps))]; }
    else if (e.abil && def.anims.ability) { const A = def.anims.ability; fr = A.frames[Math.min(A.frames.length - 1, Math.floor(e.abil.t * A.fps))]; }   // an elite's ability: the clip is the telegraph
    else if (e.dead && def.anims.death) { const A = def.anims.death; fr = A.frames[Math.min(A.frames.length - 1, Math.floor(e.deadT * A.fps))]; }
    else if (e.dead || e.shellT > 0) fr = fHurt;
    else if (e.state === 'tell' || e.state === 'charge' || e.state === 'attack') fr = fAtk;
    else if (e.hurtT > 0.03) fr = fHurt;
    else fr = mv[Math.floor(g.t * (e.hop || e.sk || e.dive ? 9 : 5) + e.phase) % mv.length];
    const L = this.alive(g, e, sx, sy, 16), K = e.D.scale || 1;
    L.flip = !L.flip;                                       // the bundle's art faces right; the old sheets face left
    if (e.fetch && g.t >= e.fetch.land) {                  // the crag dwarf's pick, lying where it fell
      const pd = C.get('pick') || (C.set('pick', this.R.resolve('ow2_shots/crag_dwarf.spinning_pick')), C.get('pick')), [qx, qy] = this.proj(e.fetch.x, e.fetch.y);
      if (pd) this.drawDef(pd, Object.keys(pd.frames)[0], Math.round(qx), Math.round(qy), { center: true });
    }
    if (!e.dead) this.shadow(sx, sy, Math.max(6, (def.size[0] > 12 ? 18 : 12) * K - L.z * 0.5));
    const x = sx + L.dx, y = sy + L.dy - L.z + 1, alpha = e.dead ? Math.max(0, 1 - e.deadT / 0.6) : Math.min(1, L.rise) * (e.asVeiled > g.t ? 0.22 : 1);   // a nebula weaver in its veil is all but hidden
    if (e.D.ability) this.eliteFx(g, e, def, fr, x, y, L);
    this.drawDef(def, fr, x, y, { flip: L.flip, alpha, scale: K });
    if (!e.dead && L.glow) this.drawDef(def, fr, x, y, { flip: L.flip, flash: true, alpha: 0.35, scale: K });
    if (!e.dead && e.D.heat) {                             // the obsidian scorpion runs hotter as it's hurt
      const h = 1 - e.hp / e.maxHp;
      if (h > 0.15 && Math.floor(g.t * (4 + h * 10)) % 2) this.drawDef(def, fr, x, y, { flip: L.flip, flash: true, alpha: 0.12 + h * 0.3, scale: K });
      if (Math.random() < h * 0.6) this.parts.push({ x: e.x + (Math.random() - 0.5) * 0.6, y: e.y, z: 4 + Math.random() * 6, vx: 0, vy: 0, vz: 10, g: 0, life: 0.5, max: 0.5, color: Math.random() < 0.5 ? '#ff7a1a' : '#ffc94a' });
    }
    if (!e.dead && e.hp < e.maxHp) this.hpBar(sx, sy + 3, e.hp / e.maxHp, e.D.ability ? 20 : 12);
    if (!e.dead && e.stunT > 0) this.stunStars(g, sx, sy, 18);
    if (e.bulwarkT > g.t && !e.dead) {                       // the reef golem's coral shell
      const b = this.b, pulse = 0.6 + 0.4 * Math.sin(g.t * 8);
      b.globalAlpha = 0.35 * pulse; b.fillStyle = '#ff8fbf'; b.beginPath(); b.ellipse(Math.round(sx), Math.round(sy - 16), 17, 21, 0, 0, Math.PI * 2); b.fill();
      b.globalAlpha = 0.9; b.strokeStyle = '#ffd0e0'; b.lineWidth = 1; b.beginPath(); b.ellipse(Math.round(sx), Math.round(sy - 16), 17, 21, 0, 0, Math.PI * 2); b.stroke(); b.globalAlpha = 1;
    }
  }
  // what an elite's ability shows: the siren's charm ring, the gryphon's line, the after-images of a dive or a dash
  eliteFx(g, e, def, fr, x, y, L) {
    const b = this.b, S = e.elState;
    if (e.songT > g.t) {
      b.globalAlpha = 0.25 + 0.15 * Math.sin(g.t * 9); b.fillStyle = '#8af6ff';
      b.beginPath(); b.ellipse(Math.round(x), Math.round(y), 96, 68, 0, 0, Math.PI * 2); b.fill();
      b.globalAlpha = 0.8; b.strokeStyle = '#e8ffff'; b.beginPath(); b.ellipse(Math.round(x), Math.round(y), 96, 68, 0, 0, Math.PI * 2); b.stroke(); b.globalAlpha = 1;
    }
    // a dive's or a dash's line, flashing, wherever its direction is already chosen: through the clip when it is picked
    // as the telegraph starts, and through the last crouch for every dash (a dash at 17 tiles a second must show its path)
    const lineDir = e.abil && !e.abil.done && !S && (e.D.ability.kind === 'dive' || e.D.ability.kind === 'dash') && e.abil.dir !== undefined ? e.abil.dir
      : S && S.kind === 'dash' && S.t < 0.25 && S.a !== undefined ? S.a : null;
    if (lineDir !== null) {
      b.fillStyle = Math.floor(g.t * 14) % 2 ? '#ffffff' : '#8af6ff'; b.globalAlpha = 0.7;
      for (let d = 1; d < (S && S.kind === 'dash' ? 7 : 9); d += 0.5) { const [qx, qy] = this.proj(e.x + Math.cos(lineDir) * d, e.y + Math.sin(lineDir) * d); b.fillRect(Math.round(qx) - 1, Math.round(qy) - 1, 2, 2); }
      b.globalAlpha = 1;
    }
    if (S && S.trail) for (const q of S.trail) {               // after-images, fading
      const a = Math.max(0, 0.5 - (g.t - q.t) * 1.6);
      if (a <= 0) continue;
      const [qx, qy] = this.proj(q.x, q.y);
      this.drawDef(def, fr, Math.round(qx), Math.round(qy) + 1, { flip: L.flip, alpha: a, flash: S.kind === 'dive' });
    }
    if (S && S.kind === 'dive' && S.t < 0.5) { b.fillStyle = '#ffffff'; b.globalAlpha = 0.6; for (let k = 0; k < 3; k++) b.fillRect(Math.round(x + (Math.random() - 0.5) * 18), Math.round(y - 10 - Math.random() * 20), 1, 3); b.globalAlpha = 1; }
  }
  // an elite arriving: a column of light and a ring on the ground
  eliteArrival(g, e, sx, sy) {
    const b = this.b, k = 1 - e.spawnT / 1.2, x = Math.round(sx), y = Math.round(sy);
    b.globalAlpha = 0.25 + 0.5 * k; b.fillStyle = '#fff6c8'; b.fillRect(x - 3 - Math.round(k * 3), y - 70, 6 + Math.round(k * 6), 70);
    b.globalAlpha = 0.8; b.strokeStyle = '#ffd650'; b.lineWidth = 1; b.beginPath(); b.ellipse(x, y, 6 + 10 * k, 4 + 6 * k, 0, 0, Math.PI * 2); b.stroke(); b.globalAlpha = 1;
  }
  // a planted thing with life (the shaman's totem, the warlord's banner): an object sprite, a bar, a glow
  propEnemy(g, e, sx, sy) {
    if (e.dead) return;
    const k = this.W.objects[e.D.objSprite], c = this.W.objectsCols;
    if (k === undefined) return;
    const rise = e.born !== undefined ? Math.min(1, (g.t - e.born) / 0.5) : 1;
    this.shadow(sx, sy, 10);
    const b = this.b; b.globalAlpha = rise;
    this.spr(this.A.img.objects, (k % c) * TS, Math.floor(k / c) * TS, TS, TS, sx, sy + Math.round((1 - rise) * 10), 8, 8, false, e.hurtT > 0.03);
    b.globalAlpha = 1;
    if (Math.random() < 0.15) this.parts.push({ x: e.x + (Math.random() - 0.5) * 0.6, y: e.y, z: 10, vx: 0, vy: 0, vz: 8, g: 0, life: 0.7, max: 0.7, color: e.id === 'war_banner' ? '#ff4a5a' : '#7aff9a' });
    if (e.hp < e.maxHp) this.hpBar(sx, sy + 3, e.hp / e.maxHp, 14);
  }
  // the Giant Watermelon: idle (a glint sweeps, the leaf sways), cracked at 66% and 33%, a hurt flash per stage,
  // the burst as it dies; its soft shadow is in the art
  melon(g, e, sx, sy) {
    const def = this.R && this.R.resolve('mx_giant_watermelon/giant_watermelon');
    if (!def) return;
    const A = def.anims, f = e.hp / e.maxHp, stage = f < 0.33 ? 'cracked2' : f < 0.66 ? 'cracked1' : 'idle';
    let fr;
    if (e.dead) { if (e.rotted) return; fr = A.burst.frames[Math.min(3, Math.floor(e.deadT * A.burst.fps))]; }
    else if (e.melonHurt && g.t - e.melonHurt < 0.1) fr = A[stage === 'idle' ? 'hurt' : 'hurt_' + stage].frames[0];
    else fr = A[stage].frames[Math.floor(g.t * A[stage].fps) % A[stage].frames.length];
    const rise = e.born !== undefined && g.t - e.born < 0.6 && g.t > 1 ? (g.t - e.born) / 0.6 : 1;
    this.drawDef(def, fr, sx, sy + 4, { alpha: rise });
    if (!e.dead && e.hp < e.maxHp) this.hpBar(sx, sy + 7, f, 28);
  }
  // per-frame body language: integer pixel offsets only, so the art stays crisp
  alive(g, e, sx, sy, F, big = false) {
    const out = { dx: 0, dy: 0, flip: false, rise: 1, z: 0, glow: false };
    if (e.dead) { out.flip = !!e.face; return out; }
    // height: mid-hop, or a flier bobbing on the air (it drops low when it dives)
    out.z = Math.round(e.z || 0);
    if (e.D.fly) out.z += Math.round((e.dive ? 2 : 6) + Math.sin(g.t * 3 + e.phase) * 2);
    if (e.state === 'tell' && !e.rb && Math.floor(g.t * 12) % 2) out.glow = true;   // the tell flashes: get ready (bosses don't flash: they tremble)
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
      const b0 = this.b, k = 1 - Math.max(0, e.burT) / (w > 16 ? 0.8 : 0.7), R0 = (4 + k * 8) * (w > 16 ? 1.8 : 1);
      b0.fillStyle = Math.floor(g.t * 12) % 2 ? '#ffc94a' : '#8a7e6a';
      for (let a = 0; a < 18; a++) { const t = (a / 18) * Math.PI * 2; b0.fillRect(Math.round(sx + Math.cos(t) * R0), Math.round(sy + Math.sin(t) * R0), 1, 1); }
    }
    const b = this.b, x = Math.round(sx), y = Math.round(sy), cols = ['#5a4e44', '#8a7e6a', '#c8b890', '#3a3028'], big = w > 16, px = big ? 2 : 1;
    if (big) { b.globalAlpha = 0.45; b.fillStyle = '#2a2018'; b.beginPath(); b.ellipse(x, y, w * 0.55, w * 0.25, 0, 0, Math.PI * 2); b.fill(); b.globalAlpha = 1; }   // a big one: a dark hump of earth
    for (let k = 0; k < (big ? 22 : 14); k++) {
      const a = (k / 14) * Math.PI + g.t * 6 * (k % 2 ? 1 : -1), r0 = w * 0.5 * (0.6 + 0.4 * Math.sin(g.t * 9 + k));
      b.fillStyle = cols[(k + Math.floor(g.t * 10)) % 4];
      b.fillRect(Math.round(x + Math.cos(a) * r0), Math.round(y - Math.abs(Math.sin(a)) * (big ? 6 : 3)), px, px);
    }
    b.fillStyle = '#3a3028'; b.fillRect(x - 2, y, 5, 1);
    if (Math.random() < 0.3) this.spray(e.x, e.y, 1, cols, 1.4, 0.3, 4);
  }
  // a Realm Update boss: its own clip (src/bossx.js), hover, ground shadow, rate-limited hit flash, facing
  bxBoss(g, e, sx, sy) {
    const S = e.bx;
    if (!S || !S.def || !S.anim) return;
    const def = S.def, fr = e.dead ? def.anims[def.death].frames.slice(-1)[0] : S.anim.frame;
    S.drawK = (S.drawK || 1) + ((S.B.scaleFor ? S.B.scaleFor(g, e) : 1) - (S.drawK || 1)) * 0.04;   // a boss may grow (the Orrery in its Collapse), eased
    const K = S.drawK, W = def.size[0] * 2 * K;
    if (!e.dead && !S.B.noShadow) this.shadow(sx, sy, Math.min(48 * K, W * 0.55));
    const hy = this.R ? hoverY(this.R, def, g.t, S.phase0, S.phase) : 0;
    if (e.dead) this.b.globalAlpha = Math.max(0, 1 - e.deadT / 1.4);
    if (S.alt && S.alt.def) {                               // another body for a while (the Orrery reborn as a supernova): centred on its middle
      const A = S.alt, cy = sy + hy - (def.foot[1] - def.size[1] / 2) * 2 * K;
      A.anim.update(Math.max(0, Math.min(0.1, g.t - (A.lastT === undefined ? g.t : A.lastT)))); A.lastT = g.t;   // its clip runs with the game's clock
      this.drawDef(A.def, A.anim.frame, sx, Math.round(cy), { center: true, scale: K * (A.scale || 1) });
    } else this.drawDef(def, fr, sx, sy + hy - (S.leapZ || 0), { flip: !!e.face, scale: K });   // no hit flash on bosses
    this.b.globalAlpha = 1;
    if (S.B.draw) S.B.draw(this, g, e, sx, sy);
  }
  realmBoss(g, e, sx, sy) {
    if (e.D.bx) return this.bxBoss(g, e, sx, sy);
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
    const rx = rxFrame(this.R, g, e);                      // the remaster's phase 2/3, morphs and death (src/remaster.js)
    this.liveSpr(rx ? rx.img : S.img, rx ? rx.x : col * F, rx ? rx.y : row * F, F, sx + L.dx, sy + L.dy, Gd.pivot.x, Gd.pivot.y, L, blaze && Math.floor(g.t * 10) % 2 === 0);
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
        const [mx, my] = this.projUp(m.x, m.y, 0.5);
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
    const rx = rxFrame(this.R, g, B);
    this.spr(rx ? rx.img : S.img, rx ? rx.x : cx * F, rx ? rx.y : cy * F, F, F, sx, sy, Gd.pivot.x, Gd.pivot.y, false, false);
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
    this.spr(S.img, (an.col + frame) * 16, an.row * 16, 16, 16, sx, sy - hop, 8, 15, flip, false);   // no white blink when hit
    if (!p.dead && p.hp < g.stat('hp')) this.hpBar(sx, sy + 3, p.hp / g.stat('hp'), 14);   // RotMG-style bar at your feet
    if (!p.dead && p.chill > 0) {                                      // Frostveil's chill: a pale bar under the life bar
      const b = this.b, w = 14, x = Math.round(sx - w / 2), y = Math.round(sy + 6), hot = p.chill > 80 && Math.floor(g.t * 6) % 2;
      b.fillStyle = '#05040a'; b.fillRect(x - 1, y - 1, w + 2, 4);
      b.fillStyle = '#1e5078'; b.fillRect(x, y, w, 2);
      b.fillStyle = hot ? '#ffffff' : p.warmBy ? '#ffc94a' : '#8af6ff'; b.fillRect(x, y, Math.round(w * p.chill / 100), 2);
    }
    if (!p.dead && p.frozenUntil > g.t) {                              // frozen solid: a block of ice round you
      const b = this.b, x = Math.round(sx), y = Math.round(sy);
      b.globalAlpha = 0.5; b.fillStyle = '#cfffff'; b.fillRect(x - 7, y - 17, 14, 18);
      b.globalAlpha = 0.9; b.fillStyle = '#ffffff'; b.fillRect(x - 7, y - 17, 14, 1); b.fillRect(x - 7, y - 17, 1, 18); b.fillRect(x - 4, y - 14, 1, 4);
      b.globalAlpha = 1;
    }
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
      if (q.name.includes('/')) {                            // a Realm Update effect (registry clip)
        const def = q.def || (q.def = this.R && this.R.resolve(q.name)), clip = def && Object.values(def.anims)[0], k = Math.floor(q.t * q.fps);
        if (!def || k >= clip.frames.length) continue;
        const [qx, qy] = this.proj(q.x, q.y);
        this.drawDef(def, clip.frames[k], Math.round(qx), Math.round(qy), { center: true });
        keep.push(q);
        continue;
      }
      const D = F[q.name], fr = Math.floor(q.t * q.fps);
      if (!D || fr >= D.n) continue;
      const k = D.i + fr, [sx, sy] = this.proj(q.x, q.y);
      this.b.drawImage(img, (k % c) * TS, Math.floor(k / c) * TS, TS, TS, Math.round(sx - 8), Math.round(sy - 8), TS, TS);
      keep.push(q);
    }
    this.sfxList = keep.length > 60 ? keep.slice(-60) : keep;
  }
  // a small singularity (ap_shots/grand_orrery.singularity): it opens, turns, and collapses at the end of its life
  singularity(g, wx, wy, alpha, scale, born, until) {
    const d = this.R && this.R.resolve('ap_shots/grand_orrery.singularity');
    if (!d) return;
    const A = d.anims, t = g.t - born, [x, y] = this.proj(wx, wy);
    let fr;
    if (until !== undefined && until - g.t < A.collapse.frames.length / A.collapse.fps) fr = A.collapse.frames[Math.min(A.collapse.frames.length - 1, Math.floor((g.t - (until - A.collapse.frames.length / A.collapse.fps)) * A.collapse.fps))];
    else if (t < A.spawn.frames.length / A.spawn.fps) fr = A.spawn.frames[Math.floor(t * A.spawn.fps)];
    else fr = A.loop.frames[Math.floor(t * A.loop.fps) % A.loop.frames.length];
    this.drawDef(d, fr, Math.round(x), Math.round(y), { center: true, scale, alpha });
  }
  // an orbiter: a black hole, or one of the item's own shots turning on its orbit (faint while it rests)
  orbiter(g, L) {
    const { B, O, set } = L, fade = Math.max(0, Math.min(1, (g.t - set.born) / 0.4, set.until === Infinity ? 1 : (set.until - g.t) / 0.6)) * (B.rest > 0 ? 0.3 : 1);
    if (O.kind === 'hole') { this.singularity(g, B.x, B.y, fade, 0.75, set.born); return; }   // a small black hole, about a tile and a half
    const C = this.objDefs || (this.objDefs = new Map());
    let d = C.get(O.sprite);
    if (d === undefined) C.set(O.sprite, (d = (this.R && this.R.resolve(O.sprite)) || null));
    if (!d) return;
    const F = Object.keys(d.frames), [x, y] = this.proj(B.x, B.y);
    const box = SHOT_BOXES[O.sprite], big = box ? Math.max(box[0], box[1]) : 16;   // a companion's size: about two-thirds of a tile, whatever its art
    this.drawDef(d, F[Math.floor(g.t * 8 + B.k) % F.length], Math.round(x), Math.round(y), { center: true, scale: Math.min(1, 11 / big), alpha: fade, rot: B.a });
  }
  // the Astral Observatory: clockwork arms flash before they turn; each telescope's dotted line of sight; a rune
  // circle swirls under you as it folds you away
  astralFx(g, m) {
    const b = this.b;
    for (const C of m.asClocks || []) if (C.warn && Math.floor(g.t * 10) % 2) {
      b.globalAlpha = 0.45; b.fillStyle = '#ffd690';
      for (const i of C.tiles) { const [x, y] = this.proj((i % m.w) + 0.5, Math.floor(i / m.w) + 0.5); b.fillRect(Math.round(x) - 6, Math.round(y) - 6, 12, 12); }
      b.globalAlpha = 1;
    }
    for (const o of m.objects) {
      if (o.interact !== 'scope' || Math.hypot(o.x - g.player.x, o.y - g.player.y) > 26) continue;
      const a = o.dir * Math.PI / 4;
      b.fillStyle = o.found ? '#fff6c8' : '#8af6ff'; b.globalAlpha = o.found ? 0.8 : 0.5;
      for (let d = 1; d < 22; d += 0.6) { const [x, y] = this.proj(o.x + Math.cos(a) * d, o.y - 0.6 + Math.sin(a) * d); if ((Math.floor(d * 2) + Math.floor(g.t * 6)) % 3) b.fillRect(Math.round(x), Math.round(y), 1, 1); }
      b.globalAlpha = 1;
    }
    for (const f of m.asFire || []) {                          // comet trails: embers that burn for 2 s
      const [x, y] = this.proj(f.x, f.y), k = Math.min(1, (f.until - g.t) / 0.5);
      b.globalAlpha = 0.45 * k; b.fillStyle = '#ff7a1a'; b.beginPath(); b.ellipse(Math.round(x), Math.round(y), 8, 5, 0, 0, Math.PI * 2); b.fill();
      b.globalAlpha = 0.9 * k; for (let j = 0; j < 4; j++) { b.fillStyle = (j + Math.floor(g.t * 12)) % 2 ? '#ffd650' : '#ffffff'; b.fillRect(Math.round(x + Math.sin(g.t * 9 + j * 1.7 + f.x) * 6), Math.round(y + Math.cos(g.t * 7 + j * 2.1) * 3) - j * 2, 1, 2); }
      b.globalAlpha = 1;
    }
    for (const v of m.asVeils || []) {                         // star veils: a cloud of dust with stars in it
      const [x, y] = this.proj(v.x, v.y), r = v.r * TS, k = Math.min(1, (v.until - g.t) / 0.6, (g.t - v.born) / 0.3);
      b.globalAlpha = 0.32 * k; b.fillStyle = '#3a2a6a'; b.beginPath(); b.ellipse(Math.round(x), Math.round(y), r, r * 0.8, 0, 0, Math.PI * 2); b.fill();
      b.globalAlpha = 0.8 * k; for (let j = 0; j < 18; j++) { const a = j * 2.4 + g.t * 0.5, d = r * (0.2 + ((j * 37) % 10) / 12); b.fillStyle = j % 3 ? '#c8a0ff' : '#ffffff'; b.fillRect(Math.round(x + Math.cos(a) * d), Math.round(y + Math.sin(a) * d * 0.8), 1, 1); }
      b.globalAlpha = 1;
    }
    for (const e of g.active || []) if (e.wardT > g.t && !e.dead) {   // an astrolabe sentinel's ring ward, turning
      const [x, y] = this.proj(e.x, e.y), R0 = 20;
      b.globalAlpha = 0.85; b.strokeStyle = '#ffd690'; b.beginPath(); b.ellipse(Math.round(x), Math.round(y - 14), R0, R0 * 0.9, 0, 0, Math.PI * 2); b.stroke();
      for (let j = 0; j < 12; j++) { const a = j / 12 * Math.PI * 2 + g.t * 3; b.fillStyle = j % 3 ? '#ffd690' : '#ffffff'; b.fillRect(Math.round(x + Math.cos(a) * R0) - 1, Math.round(y - 14 + Math.sin(a) * R0 * 0.9) - 1, 2, 2); }
      b.globalAlpha = 1;
    }
    if (m.asSealed && m.asVault) {                             // Lockdown: seal glyphs hang across the vault's mouth
      const Gd = this.R && this.R.resolve('ap_shots/vault_keeper.seal_glyph');
      if (Gd) for (const i of m.asVault.mouth) { const [x, y] = this.proj((i % m.w) + 0.5, Math.floor(i / m.w) + 0.5); this.drawDef(Gd, Object.keys(Gd.frames)[Math.floor(g.t * 6) % 2], Math.round(x), Math.round(y), { center: true, scale: 1.5 }); }
    }
    const p = g.player;
    if (p.asRune > 0 && p.asRuneAt) {
      const [x, y] = this.proj(p.asRuneAt.x, p.asRuneAt.y), k = 1 - p.asRune / 0.6;
      for (let j = 0; j < 12; j++) { const a = j / 12 * Math.PI * 2 + g.t * 8; b.fillStyle = j % 2 ? '#8af6ff' : '#ffffff'; b.fillRect(Math.round(x + Math.cos(a) * (10 - 6 * k)), Math.round(y + Math.sin(a) * (6 - 3 * k)), 2, 2); }
    }
  }
  // Mirerot: acid puddles on the ground; poison clouds as a drift of the bundle's poison_cloud puffs
  mireFx(g, m) {
    const b = this.b, C = this.R && this.R.resolve('ex_effects/poison_cloud');
    for (const q of m.mrPuddles || []) {
      const [x, y] = this.proj(q.x, q.y), r = q.r * TS, fade = Math.min(1, (q.until - g.t) / 1);
      b.globalAlpha = 0.5 * fade; b.fillStyle = '#7ac83a'; b.beginPath(); b.ellipse(Math.round(x), Math.round(y), r, r * 0.7, 0, 0, Math.PI * 2); b.fill();
      b.globalAlpha = 0.8 * fade; b.fillStyle = '#c8ff3a'; for (let a = 0; a < 12; a++) b.fillRect(Math.round(x + Math.cos(a * 0.52 + g.t) * r * 0.6), Math.round(y + Math.sin(a * 0.52 + g.t) * r * 0.42), 1, 1);
      b.globalAlpha = 1;
    }
    if (!C) return;
    const F = Object.keys(C.frames);
    for (const c of m.mrClouds || []) {
      const fade = Math.min(1, (c.until - g.t) / 0.8, (g.t - c.born) / 0.3);
      for (let k = 0; k < 7; k++) {
        const a = k * 0.9 + c.born, d = k ? c.r * 0.55 : 0, [x, y] = this.proj(c.x + Math.cos(a + g.t * 0.3) * d, c.y + Math.sin(a + g.t * 0.3) * d * 0.8);
        this.drawDef(C, F[Math.floor(g.t * 4 + k) % F.length], Math.round(x), Math.round(y), { center: true, scale: 1.6, alpha: 0.75 * fade });
      }
    }
  }
  // the chill creeping in: frost at the edge of your view, thicker as it builds, pulsing white near freezing
  chillFx(g) {
    const b = this.b, BW = this.buf.width, BH = this.buf.height, c = g.player.chill / 100, pulse = c > 0.8 ? 0.5 + 0.5 * Math.sin(g.t * 10) : 0;
    b.save(); b.setTransform(1, 0, 0, 1, 0, 0); b.scale(this.hi.width / BW, this.hi.height / BH);
    for (let k = 0; k < 4; k++) {
      const w = 3 + k * 3;
      b.globalAlpha = c * (0.32 - k * 0.07) + pulse * 0.08; b.fillStyle = pulse > 0.6 ? '#ffffff' : '#cfffff';
      b.fillRect(0, 0, BW, w); b.fillRect(0, BH - w, BW, w); b.fillRect(0, 0, w, BH); b.fillRect(BW - w, 0, w, BH);
    }
    b.restore(); b.globalAlpha = 1;
  }
  // the Kraken's ink: dark blots splashed across your view, fading; you can still make out the shots between them
  inkFx(g) {
    const b = this.b, BW = this.buf.width, BH = this.buf.height, f = Math.min(1, (g.inkUntil - g.t) / 0.5, (1.6 - (g.inkUntil - g.t)) / 0.12);
    let s = Math.floor((g.inkSeed || 0.5) * 1e6);
    const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    b.save(); b.setTransform(1, 0, 0, 1, 0, 0); b.scale(this.hi.width / BW, this.hi.height / BH);   // screen space, like the darkness
    for (let k = 0; k < 7; k++) {
      const x = rnd() * BW, y = rnd() * BH, r = 24 + rnd() * 46;
      b.globalAlpha = 0.78 * f; b.fillStyle = k % 2 ? '#0a0a18' : '#141430';
      b.beginPath(); b.arc(x, y, r, 0, Math.PI * 2); b.fill();
      for (let j = 0; j < 5; j++) { const a = rnd() * Math.PI * 2, d = r * (0.8 + rnd() * 0.5); b.beginPath(); b.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 3 + rnd() * 7, 0, Math.PI * 2); b.fill(); }
    }
    b.restore(); b.globalAlpha = 1;
  }
  // the Lich's darkness: everything but a small circle around you goes black
  darkFx(g) {
    const b = this.b, [sx, sy] = this.projUp(g.player.x, g.player.y, 0.5), r = (g.darkR || 3) * TS;
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
  // the reworked weapons (src/weaponmech.js): a glyph on the ground, a phantom blow's mark, marks and stacks on enemies.
  // Ground marks are 1 px lines at under half opacity, in the weapon's colour (docs/projectile_art_standard.md)
  mechFx(f, g) {
    const b = this.b, [sx, sy] = this.proj(f.x, f.y), col = f.kind === 'wglyph' ? f.col : f.col[0];
    const k = f.kind === 'wphantom' ? 1 - Math.min(1, f.t / f.delay) * 0.6 : 1, r = f.r * TS * k;
    if (f.kind === 'wphantom' && f.done) return;
    b.save(); b.globalAlpha = f.kind === 'wglyph' ? 0.42 : 0.3 + 0.15 * Math.min(1, f.t / f.delay); b.fillStyle = col;
    const n = Math.max(16, Math.round(r * 1.6));
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + (f.kind === 'wglyph' ? g.t * 0.6 : 0); b.fillRect(Math.round(sx + Math.cos(a) * r), Math.round(sy + Math.sin(a) * r * 0.7), 1, 1); }
    if (f.kind === 'wglyph') for (let i = -3; i <= 3; i++) { b.fillRect(Math.round(sx + i), Math.round(sy), 1, 1); b.fillRect(Math.round(sx), Math.round(sy + i * 0.7), 1, 1); }
    b.restore();
  }
  // the special Halos (src/halos.js): small, static pixel shapes, animated by position and size only
  haloFx(f, g) {
    const b = this.b, [sx0, sy0] = this.proj(f.x, f.y), sx = Math.round(sx0), sy = Math.round(sy0);
    const dot = (x, y, c) => { b.fillStyle = c; b.fillRect(Math.round(x), Math.round(y), 1, 1); };
    const ring = (r, c, n = 32, sq = 0.7, rot = 0) => { for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + rot; dot(sx + Math.cos(a) * r, sy + Math.sin(a) * r * sq, c); } };
    const glyph = (rows, cols, x0, y0) => rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') { b.fillStyle = cols[ch]; b.fillRect(x0 + i, y0 + j, 1, 1); } }));
    switch (f.h) {
      case 'sigil': {                                         // a little rising sun
        if (f.done && f.t > f.at + 0.25) return;
        glyph(['..o.o..', '.o...o.', 'o.ooo.o', '..oyo..', 'ooooooo'], { o: '#c98a22', y: '#fffdf0' }, sx - 3, sy - 6);
        break;
      }
      case 'bell': {
        const sw = Math.round(Math.sin(f.t * 18) * (f.t < 1.1 ? 1 : 0));
        glyph(['..ooo..', '.oyyyo.', '.oyyyo.', '.oyyyo.', 'ooooooo', '...o...'], { o: '#6a4418', y: '#e8b04a' }, sx - 3 + sw, sy - 8);
        break;
      }
      case 'rose': if (!f.done) { ring(5, '#ff5a6a', 12); ring(3, '#5a8aff', 8, 0.7, 0.4); ring(1.5, '#ffd650', 6); } break;
      case 'aureole': {
        if (f.done) return;
        const k = 1 - Math.min(1, f.t / f.life), r = 4 + 10 * k, n = 20;
        for (let i = 0; i < n; i++) { if (i % 7 === 3 || i % 7 === 4) continue; const a = (i / n) * Math.PI * 2 + g.t; dot(sx + Math.cos(a) * r, sy - 8 + Math.sin(a) * r * 0.6, i % 2 ? '#3a2a10' : '#c98a22'); }   // the bites
        break;
      }
      case 'mote': if (!f.done && f.t >= (f.delay || 0)) { b.fillStyle = f.gold ? '#ffd650' : '#9aff9a'; b.fillRect(sx - 1, sy - 1, 2, 2); dot(sx, sy - 2, '#ffffff'); } break;
      case 'horizon': {                                       // a line of daylight, across your aim, moving out
        const ca = Math.cos(f.a), sa = Math.sin(f.a), [hx, hy] = this.proj(f.x + ca * f.d, f.y + sa * f.d), half = (f.w / 2) * 16, n = Math.round(half * 2);
        const [px, py] = this.proj(f.x + ca * f.d - sa, f.y + sa * f.d + ca), ux = (px - hx), uy = (py - hy), ul = Math.hypot(ux, uy) || 1;
        for (let i = 0; i <= n; i++) { const o = -half + i; dot(hx + (ux / ul) * o, hy + (uy / ul) * o, i % 3 === 0 ? '#fffdf0' : '#ffeb8f'); }
        break;
      }
      case 'sun': {
        b.fillStyle = '#1a1018'; b.fillRect(sx - 3, sy - 13, 7, 7); b.fillStyle = '#ffd650';
        for (const [x, y] of [[0, -14], [0, -6], [-4, -10], [4, -10], [-3, -13], [3, -13], [-3, -7], [3, -7]]) b.fillRect(sx + x, sy + y, 1, 1);
        for (const P of f.pulses) { if (f.t < P.t0) continue; const r = (f.t - P.t0) * 5 * 16; if (r < 3.6 * 16) { ring(r, '#ffd650', 48); ring(r - 2, '#3a2030', 40); } }
        break;
      }
      case 'wick': {
        b.fillStyle = '#e8e0c8'; b.fillRect(sx - 1, sy - 5, 3, 5); b.fillStyle = '#3a2a10'; b.fillRect(sx, sy - 6, 1, 1);
        b.fillStyle = Math.floor(g.t * 8) % 2 ? '#ffd650' : '#ff8a2a'; b.fillRect(sx, sy - 8, 1, 2);
        if (f.warm) { b.save(); b.globalAlpha = 0.35; ring(2.5 * 16, '#ffb84a', 40); b.restore(); }
        break;
      }
    }
  }
  // ability sigils (src/sigils.js): a small rune on the ground that blinks as it runs out; a forge-blow's warning ring
  sigilFx(f, g) {
    const b = this.b, [sx0, sy0] = this.proj(f.x, f.y), sx = Math.round(sx0), sy = Math.round(sy0);
    if (f.kind === 'sigilq') {
      if (f.warn && !f.done) { b.fillStyle = '#ff8a2a'; const r = f.warn * 16 * (1 - 0.5 * f.t / f.at); for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; b.fillRect(Math.round(sx + Math.cos(a) * r), Math.round(sy + Math.sin(a) * r * 0.7), 1, 1); } }
      if (f.star !== undefined && !f.done) { const a = g.t * 6 + f.star * 2.1; b.fillStyle = '#fff2a8'; b.fillRect(Math.round(sx + Math.cos(a) * 10), Math.round(sy - 8 + Math.sin(a) * 6), 2, 2); }
      return;
    }
    const G = f.sg, left = f.life - f.t;
    if (G.used || (left < 1 && Math.floor(g.t * 8) % 2)) return;   // it blinks in its last second
    b.save(); b.globalAlpha = 0.85;
    b.fillStyle = '#05040a'; b.fillRect(sx - 4, sy - 3, 9, 7);
    b.fillStyle = G.col[0]; for (const [x, y] of [[0, -2], [-3, 0], [3, 0], [0, 2], [-1, -1], [1, 1], [1, -1], [-1, 1]]) b.fillRect(sx + x, sy + y, 1, 1);
    b.fillStyle = G.col[1]; b.fillRect(sx, sy, 1, 1);
    b.globalAlpha = 0.3; b.fillStyle = G.col[0];
    const r = (G.S.r || 2.5) * 16; for (let i = 0; i < 36; i++) { if (i % 3 === 2) continue; const a = (i / 36) * Math.PI * 2 + g.t * 0.4; b.fillRect(Math.round(sx + Math.cos(a) * r), Math.round(sy + Math.sin(a) * r * 0.7), 1, 1); }
    b.restore();
  }
  // the Mythic abilities (src/mythics.js)
  mythFx(f, g) {
    const b = this.b, P = (x, y) => this.proj(x, y).map(Math.round), dot = (x, y, c) => { b.fillStyle = c; b.fillRect(Math.round(x), Math.round(y), 1, 1); };
    const ring = (sx, sy, r, c, n = 32, rot = 0) => { for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + rot; dot(sx + Math.cos(a) * r, sy + Math.sin(a) * r * 0.7, c); } };
    switch (f.h) {
      case 'print': { const [sx, sy] = P(f.x, f.y); b.fillStyle = Math.floor(g.t * 6) % 2 ? '#ff8a2a' : '#ffd650'; b.fillRect(sx - 3, sy - 1, 7, 1); b.fillRect(sx - 2, sy - 2, 5, 1); b.fillRect(sx - 1, sy, 3, 1); break; }
      case 'jaw': if (!f.done) { const [sx, sy] = P(f.x, f.y + 0.5); b.fillStyle = '#e8e0c8'; for (let i = -4; i <= 4; i += 2) { b.fillRect(sx + i, sy - 4, 1, 3); b.fillRect(sx + i, sy + 1, 1, 3); } b.fillStyle = '#3a8a9a'; b.fillRect(sx - 5, sy - 1, 11, 2); } break;
      case 'eye': { const [sx, sy] = P(f.x, f.y); b.save(); b.globalAlpha = 0.35; ring(sx, sy, f.calm * 16, '#bfe8ff', 40, g.t * 0.3); b.restore();
        for (let k = 0; k < 3; k++) { const a = f.rot + (k / 3) * Math.PI * 2, x = sx + Math.cos(a) * f.ring * 16, y = sy + Math.sin(a) * f.ring * 16 * 0.7; b.fillStyle = '#ffffff'; b.fillRect(Math.round(x), Math.round(y) - 6, 1, 3); b.fillRect(Math.round(x) + 1, Math.round(y) - 3, 1, 3); b.fillStyle = '#5a8aff'; b.fillRect(Math.round(x) - 1, Math.round(y), 3, 1); }
        break; }
      case 'spring': if (!f.done) { const [sx, sy] = P(f.x, f.y); ring(sx, sy, f.r * 16 * (1 - f.t / f.hold * 0.5), '#e8c87a', 36, -g.t * 3); b.fillStyle = '#8a6a3a'; for (let i = 0; i < 4; i++) b.fillRect(sx - 2 + (i % 2), sy - 10 + i * 2, 4, 1); } break;
      case 'oath': { const p = g.player; let prev = null;
        for (const R of f.runes) { if (R.hp <= 0) continue; const [x, y] = P(p.x + Math.cos(R.a + f.rot) * 1.3, p.y - 0.4 + Math.sin(R.a + f.rot) * 1.3); b.fillStyle = '#05040a'; b.fillRect(x - 2, y - 2, 5, 5); b.fillStyle = R.hp > 1 ? '#46f5d6' : '#d63a4a'; b.fillRect(x - 1, y - 1, 3, 3); if (prev) { b.save(); b.globalAlpha = 0.35; b.fillStyle = '#46f5d6'; for (let i = 1; i < 8; i++) b.fillRect(Math.round(prev[0] + (x - prev[0]) * i / 8), Math.round(prev[1] + (y - prev[1]) * i / 8), 1, 1); b.restore(); } prev = [x, y]; }
        break; }
    }
  }
  // armour and ring mechanics (src/gearmech.js): a hazard patch, a mushroom patch, spore pods, a sanctuary
  gearFx(f, g) {
    const b = this.b;
    if (f.h === 'sanct') { const p = g.player, [sx, sy] = this.proj(p.x, p.y); b.save(); b.globalAlpha = 0.45; b.fillStyle = f.col; for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2 + g.t; b.fillRect(Math.round(sx + Math.cos(a) * 12), Math.round(sy - 8 + Math.sin(a) * 12), 1, 1); } b.restore(); return; }
    const [sx0, sy0] = this.proj(f.x, f.y), sx = Math.round(sx0), sy = Math.round(sy0);
    if (f.h === 'hazard' || f.h === 'mushroom') {
      b.save(); b.globalAlpha = 0.4; b.fillStyle = f.h === 'hazard' ? f.col : '#9aff9a';
      const r = f.r * 16; for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; b.fillRect(Math.round(sx + Math.cos(a) * r), Math.round(sy + Math.sin(a) * r * 0.7), 1, 1); }
      b.restore();
      if (f.h === 'mushroom') { b.fillStyle = '#e8e0c8'; b.fillRect(sx, sy - 2, 1, 2); b.fillStyle = '#9aff9a'; b.fillRect(sx - 2, sy - 4, 5, 2); }
    }
    if (f.h === 'pod' && !f.done) { b.fillStyle = '#3a5a1a'; b.fillRect(sx - 2, sy - 4, 5, 4); b.fillStyle = '#7ad04a'; b.fillRect(sx - 1, sy - 5, 3, 1); b.fillRect(sx - 1, sy - 3, 1, 1); }
  }
  mechMarks(g) {
    const b = this.b;
    for (const e of g.active || g.enemies) {
      const m = e.wmark && e.wmark.until > g.t ? e.wmark : null, st = e.wstack && e.wstack.until > g.t ? e.wstack : null;
      if ((!m && !st) || e.dead) continue;
      const [sx, sy0] = this.proj(e.x, e.y), sy = Math.round(sy0 - (e.D.r || 0.5) * TS * 2 - 6);
      if (m) { b.fillStyle = '#05040a'; b.fillRect(Math.round(sx) - 2, sy - 2, 5, 5); b.fillStyle = m.col; b.fillRect(Math.round(sx) - 1, sy - 1, 3, 3); b.fillStyle = '#05040a'; b.fillRect(Math.round(sx), sy, 1, 1); }
      if (st) for (let i = 0; i < st.n; i++) { const x = Math.round(sx) - 3 + i * 4 + (m ? 6 : 0); b.fillStyle = '#05040a'; b.fillRect(x - 1, sy - 1, 3, 3); b.fillStyle = st.col; b.fillRect(x, sy, 1, 1); }
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
  // the faint dark disc under an enemy shot, drawn once per radius
  haloStamp(r) {
    const C = this.halos || (this.halos = new Map()), k = Math.round(r * 4);
    let c = C.get(k);
    if (!c) {
      const R = k / 4, S = Math.ceil(R) * 2 + 2;
      c = document.createElement('canvas'); c.width = c.height = S;
      const x = c.getContext('2d'); x.globalAlpha = 0.32; x.fillStyle = '#05040a'; x.beginPath(); x.arc(S / 2, S / 2, R, 0, Math.PI * 2); x.fill();
      C.set(k, c);
    }
    return c;
  }
  // a laser bolt: a soft coloured glow round a hard white core, along its flight
  laserShot(pr, [glow, mid]) {
    const b = this.b, [x, y] = this.proj(pr.x, pr.y), a = pr.a + this.th, k = pr.k || 1;
    b.save(); b.translate(Math.round(x), Math.round(y)); b.rotate(a); b.scale(k, k);
    b.globalAlpha = 0.35; b.fillStyle = glow; b.fillRect(-12, -3, 24, 6);
    b.globalAlpha = 0.9; b.fillStyle = glow; b.fillRect(-11, -2, 22, 4);
    b.globalAlpha = 1; b.fillStyle = mid; b.fillRect(-10, -1, 20, 2); b.fillStyle = '#ffffff'; b.fillRect(-6, -1, 14, 2); b.fillRect(6, -2, 3, 4);
    b.restore();
  }
  drawProjectiles(g, dt) {
    const b = this.b, PI = this.A.img.projectiles, pc = this.W.projCols, PS = this.W.proj, half = PS / 2;
    const BW = this.buf.width, BH = this.buf.height;
    // trails thin out as the screen fills (a few hundred sparks a frame is plenty), and the enemy-shot halo is a
    // cached stamp rather than a path per bullet
    const trailP = Math.min(0.4, 240 / (g.projectiles.length + 1));
    for (const pr of g.projectiles) {
      if (pr.hidden) continue;                                     // an opening in a set piece's formation
      if (pr.sprite.includes('/') && this.R) {                       // a Realm Update shot (registry)
        const def = pr.def || (pr.def = this.R.resolve(pr.sprite));
        if (def) {
          let [qx, qy] = this.proj(pr.x, pr.y);
          if (LASER[pr.sprite]) { this.laserShot(pr, LASER[pr.sprite]); continue; }   // drawn as a bolt of light, not a sprite
          const A = Object.values(def.anims)[0], fr = STILL.has(pr.sprite) ? A.frames[0] : A.frames[Math.floor(g.t * (A.fps || 8) + (pr.x + pr.y)) % A.frames.length];
          if (pr.lob) {                                     // lobbed: a mark where it will land, the shot arcing over
            const L = pr.lob, kk = Math.min(1, L.t / L.T), [mx, my] = this.proj(L.x1, L.y1), rr = Math.round(L.r * TS * (0.4 + 0.6 * kk));
            b.fillStyle = Math.floor(g.t * 10) % 2 ? '#ff4a5a' : '#ffc94a';
            for (let a = 0; a < 16; a += 2) { const t = (a / 16) * Math.PI * 2; b.fillRect(Math.round(mx + Math.cos(t) * rr), Math.round(my + Math.sin(t) * rr * 0.7), 1, 1); }
            qy -= Math.sin(Math.PI * kk) * L.h;
          }
          if (qx > -20 && qy > -20 && qx < BW + 20 && qy < BH + 20) this.drawDef(def, fr, Math.round(qx), Math.round(qy), { rot: pr.lob ? g.t * 6 : pr.a + this.th, alpha: pr.frozen ? 0.55 : pr.ghost ? 0.25 : 1, scale: pr.k || 1 });
          continue;
        }
      }
      const k0 = this.W.projectiles[pr.sprite] ?? 0, nf = this.W.projFrames || 1;
      const k = k0 + (nf > 1 && pr.from === 'e' ? Math.floor(g.t * 12 + (pr.x + pr.y) * 2) % nf : 0);   // (a player's shot is one still frame: docs/projectile_art_standard.md)
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
      if (pr.from === 'e' && Math.random() < trailP) {          // (no trails behind a player's shots)
        const cols = this.colorsOf('p:' + pr.sprite, PI, (k % pc) * PS, Math.floor(k / pc) * PS, PS, PS);
        this.parts.push({ x: pr.x, y: pr.y, z: 0, vx: 0, vy: 0, vz: 0, g: 0, life: 0.18, max: 0.18, color: cols[Math.floor(Math.random() * Math.min(2, cols.length))] });
      }
      // RotMG-style shots: 8x8 art at the characters' scale. Pointed shots turn to their flight (the long ones are drawn
      // on the diagonal), stars and wheels spin, the big slow ones are drawn a size up. Enemy shots sit on a faint dark halo.
      const S = this.shotSets || (this.shotSets = { rot: new Set(this.W.projRot || []), diag: new Set(this.W.projDiag || []), spin: new Set(this.W.projSpin || []), big: new Set(this.W.projBig || []) });
      const Q = pr.from === 'e' ? (S.big.has(pr.sprite) ? 1.3 : 1) * (pr.k || 1) : 1, QS = PS * Q, qh = half * Q;   // a player's shot: exactly 1:1, never resized
      if (pr.from === 'e') { const H = this.haloStamp(qh * 0.66); b.drawImage(H, sx - H.width / 2, sy - H.height / 2); }
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
      else if (v.k === 'hurt') { /* getting hit no longer shakes or flashes the screen (RotMG doesn't) */ }
      else if (v.k === 'levelup') this.sprFx('level_up_ring', v.x, v.y, 7);
      else if (v.k === 'regfx') this.sprFx(v.key, v.x, v.y, v.fps || 12);
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
        const col = ['#e8cf96', '#5c8a3a', '#e8f0f8', '#554c52', '#fff0cc', '#44542e', '#d8bc66', '#8ab85a'][bi] || '#8d88a0';
        this.spray(v.x, v.y, 2, [col], 1.2, 0.35, 3, true);
      } else if (v.k === 'death') {
        const e = v.e;
        let cols;
        const xd = e.bx && e.bx.def, xf = xd && Object.values(xd.frames)[0];
        if (xf) cols = this.colorsOf('bx:' + e.D.bx, xd.img, xf.x, xf.y, xf.w, xf.h);   // a three-phase boss: its own art (it has no row on the old sheets)
        else if (e.rb && this.A.sheets[e.D.sheet || 'realm_bosses'].guide.bosses[e.id]) {
          const S = this.A.sheets[e.D.sheet || 'realm_bosses'], F = S.guide.frameWidth, row = S.guide.bosses[e.id].row;
          cols = this.colorsOf('rb:' + e.id, S.img, 0, row * F, F, F);
        } else if (e.D.melon) {
          cols = ['#e83a4a', '#3a8a3a', '#ffd0d8', '#ffffff', '#1a1a1a'];
        } else if (e.D.reg) {
          const def = this.R && this.R.resolve(e.D.reg), f = def && Object.values(def.frames)[0];
          cols = f ? this.colorsOf('g:' + e.D.reg, def.img, f.x, f.y, f.w, f.h) : ['#ffffff'];
        } else if (e.D.sheet === 'champions' && this.A.sheets.champions.guide.champions[e.id]) {
          const S = this.A.sheets.champions, F = S.guide.frameWidth, row = S.guide.champions[e.id].row;
          cols = this.colorsOf('c:' + e.id, S.img, 0, row * F, F, F);
        } else if (this.A.sheets.enemies.guide.enemies[e.id]) {
          const S = this.A.sheets.enemies, row = S.guide.enemies[e.id].row;
          cols = this.colorsOf('e:' + e.id, S.img, 0, row * 16, 16, 16);
        } else cols = ['#ffffff', '#c8c0d8', '#8a8098'];                 // anything without art on the old sheets: a plain burst, never a crash
        const champ = e.D.sheet === 'champions';
        if (!e.rb) this.sprFx('death_poof', ...lift(e.x, e.y, 0.5), 12);
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
    const dz = { chapel: 'shore', heart: 'godfall', crypt: 'crypt', ember: 'forge', frostveil: 'frostveil', mirerot: 'mirerot', astral: 'astral', sandscour: 'dunes', keep: 'keep', hollowmoon: 'hollowmoon' };
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

  // how far above its feet something's head is drawn, in buffer pixels (for the numbers that float over it)
  headPx(g, e) {
    if (e === g.player) return 24;
    if (e.bx && e.bx.def) return e.bx.def.foot[1] * 2 + 6;
    if (e === g.boss || (e.rb && !e.D.reg)) return 44;
    if (e.D && e.D.reg) {
      const C = this.objDefs || (this.objDefs = new Map());
      let d = C.get(e.D.reg);
      if (d === undefined) C.set(e.D.reg, (d = (this.R && this.R.resolve(e.D.reg)) || null));
      if (d) return d.foot[1] * 2 * (e.D.scale || 1) + 6;
    }
    return 16 * (e.warden ? 2 : (e.D && e.D.scale) || 1) + 6;
  }
  // ------------------------------------------------------------ HUD overlays
  overlays(g) {
    const ctx = this.ctx, s = this.scale;
    ctx.textAlign = 'center';
    ctx.font = textFont(Math.max(13, s * 4 * 1.3));
    const nums = !this.settings || this.settings.damageNumbers;
    for (const f of g.floaters) {
      if (!nums && /^[-+]?\d+$/.test(f.text)) continue;
      let bx, by;
      if (f.who) { [bx, by] = this.proj(f.who.x, f.who.y); bx += f.dx * TS; by -= this.headPx(g, f.who); }   // above its owner's head, following it
      else [bx, by] = this.proj(f.x, f.y);
      const x = bx * s, y = by * s - f.t * 30;
      ctx.globalAlpha = Math.max(0, 1 - f.t / 0.9);
      outlined(ctx, f.text, x, y);
      ctx.fillStyle = f.color; ctx.fillText(f.text, x, y);
    }
    ctx.globalAlpha = 1;
    { const f0 = ctx.font; ctx.font = textFont(Math.max(11, s * 4 * 1.05));
      for (const e of g.activeMap === g.map ? g.active : []) {   // elites wear their names
        if (!e.D.title || e.dead || e.spawnT > 0 || e.under) continue;
        const [bx, by] = this.proj(e.x, e.y), x = bx * s, y = (by - 44) * s;
        outlined(ctx, e.D.title, x, y); ctx.fillStyle = '#ffd650'; ctx.fillText(e.D.title, x, y);
      }
      ctx.font = f0; }
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
      const t = `${keyHint('portal')}${g.nearPortal.label}${L !== undefined ? ` (${Math.ceil(L)}s)` : ''}`;   // the key shown is yours (none if unbound)
      outlined(ctx, t, x, y);
      ctx.fillStyle = '#f2c14e'; ctx.fillText(t, x, y);
    }
    if (g.nearNPC && !g.nearPortal) {
      const [bx, by] = this.proj(g.nearNPC.x, g.nearNPC.y);
      const x = bx * s, y = (by - 20) * s, t = `${keyHint('portal')}${g.nearNPC.label}`;
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
        const X = e.D.bx && g.bxBar ? g.bxBar(e) : null;
        if (X && d < best) { best = d; bar = { name: `${e.D.name.toUpperCase()} · ${X.name.toUpperCase()}`, f: e.hp / e.maxHp, hot: X.phase > 1, immune: X.immune, pips: X.pips }; continue; }
        if (d < best) { best = d; bar = { name: e.D.name.toUpperCase() + surv, f: surv ? (e.surviveUntil > g.t ? (e.surviveUntil - g.t) / 22 : (e.frenzyUntil - g.t) / (e.frenzyLen || 10)) : e.hp / e.maxHp, hot: e.phaseIdx > 0 || !!surv, immune: e.invulnT > 0 && !surv }; }
      }
    }
    if (bar) {
      const w = Math.min(this.c.width * 0.6, 560), x = (this.c.width - w) / 2, y = 58;   // below the gold / fame row, never under it
      ctx.fillStyle = '#000'; ctx.fillRect(x - 3, y - 3, w + 6, 18);
      ctx.fillStyle = '#5a0e1e'; ctx.fillRect(x, y, w, 12);
      ctx.fillStyle = bar.immune ? '#8d88a0' : bar.hot ? '#ff7a1a' : '#f2c14e';
      ctx.fillRect(x, y, w * Math.max(0, bar.f), 12);
      for (const f of bar.pips || []) { ctx.fillStyle = '#000'; ctx.fillRect(Math.round(x + w * f) - 2, y - 3, 4, 18); ctx.fillStyle = bar.f > f ? '#fff6c8' : '#8a7a5a'; ctx.fillRect(Math.round(x + w * f) - 1, y - 1, 2, 14); }
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
    // ~12 redraws a second is plenty for a map; the marks blink at 3 Hz anyway
    const now = performance.now();
    if (this.miniDrawn && this.miniFor === m && !m.miniDirty && now - this.miniDrawn < 80) return;
    this.miniDrawn = now;
    if (this.miniFor !== m || m.miniDirty) {
      m.miniDirty = false;
      this.miniFor = m;
      this.miniBase = document.createElement('canvas');
      this.miniBase.width = m.w; this.miniBase.height = m.h;
      const x = this.miniBase.getContext('2d'), img = x.createImageData(m.w, m.h);
      const realmFlat = m.kind === 'realm', rgb = new Map();          // (each colour parsed once: a realm has 1.6 million tiles)
      const BIO = ['#b89a68', '#4a6a38', '#a8b4c4', '#544a50', '#e0c898', '#26341c', '#b8a050', '#6e9a40'];
      for (let i = 0; i < m.tiles.length; i++) {
        const t = m.tiles[i], b = realmFlat ? m.biome[i] : -2;
        const hex = !realmFlat ? MINI[t] || '#555060' : t === 1 ? '#0e2236' : t === 0 ? '#1d4466' : t === TID.cliff ? '#5a5866' : t === TID.rift ? '#c02a8a'
          : (BIO[b] || MINI[t]);
        let c = rgb.get(hex);
        if (!c) { c = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]; rgb.set(hex, c); }
        img.data[i * 4] = c[0]; img.data[i * 4 + 1] = c[1]; img.data[i * 4 + 2] = c[2]; img.data[i * 4 + 3] = 255;
      }
      if (!realmFlat) for (const o of m.objects) if (o.big) { const i = Math.floor(o.y) * m.w + Math.floor(o.x); img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = 230; }
      x.putImageData(img, 0, 0);
    }
    if (m.seen) {
      if (this.fogFor !== m) {
        this.fogFor = m;
        this.fogCv = document.createElement('canvas'); this.fogCv.width = m.w; this.fogCv.height = m.h;
        const fx = this.fogCv.getContext('2d'), img = fx.createImageData(m.w, m.h);   // dark where unseen (one pass, not a call per tile)
        for (let i = 0; i < m.seen.length; i++) if (!m.seen[i]) { img.data[i * 4] = 5; img.data[i * 4 + 1] = 4; img.data[i * 4 + 2] = 10; img.data[i * 4 + 3] = 255; }
        fx.putImageData(img, 0, 0);
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
    for (const e of calm && g.activeMap === m ? g.active : g.enemies) {
      if (e.dead || e.rb || e.herald || e.D.dummy || e.under || !near(e)) continue;
      if (calm && (e.x - p.x) ** 2 + (e.y - p.y) ** 2 > R2) continue;
      mark(e.x, e.y, 'enemy', e.elite ? '#ffa030' : '#ff3c50', '#ffd0d8', false, 2);
    }
    if (calm) {
      for (const c of m.camps || []) {                                   // camps still holding their chest
        if (!near(c)) continue;
        const chest = c.chest !== undefined ? c.chest : (c.chest = m.objects.find((o) => o.interact === 'chest' && Math.abs(o.x - c.x) < 0.1 && Math.abs(o.y - c.y) < 0.1) || null);
        if (chest && !chest.opened && near(c)) mark(c.x, c.y, 'camp', '#ff7a1a', '#ffd650');
      }
      for (const o of objectsIn(m, x0 - 1, y0 - 1, x0 + V + 1, y0 + V + 1)) {
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
    for (const e of g.activeMap === m ? g.notable : g.enemies) if (e.herald && !e.dead) mark(e.x, e.y, 'crown', '#f2c14e', '#ff4a5a', true);
    for (const e of g.activeMap === m ? g.notable : g.enemies) if (e.D.melon && !e.dead) mark(e.x, e.y, 'star', blink ? '#5ae05a' : '#ff6a7a', '#ffffff', true);
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
    for (const e of g.activeMap === m ? g.notable : g.enemies) if (e.rb && !e.dead) mark(e.x, e.y, 'skull', blink ? '#ff2a2a' : '#ff8a8a', '#05040a', true);
    if (g.boss && g.boss.state !== 'dead') mark(g.boss.x, g.boss.y, 'skull', blink ? '#ff2a2a' : '#ff8a8a', '#05040a', true);
    // player + a tick showing which way "up" on screen points
    const ux = -Math.sin(g.camAngle), uy = -Math.cos(g.camAngle);
    mc.fillStyle = '#ffe060';
    for (let j = 2; j < 9; j++) mc.fillRect(Math.round((p.x - x0) * k + ux * j * 1.4), Math.round((p.y - y0) * k + uy * j * 1.4), 2, 2);
    mark(p.x, p.y, 'star', '#ffe060', '#ffffff', false, 2);    // you: a yellow star, as in RotMG
  }
  // item icons, drawn the RotMG way: the 8x8 art (stored doubled in the sheet) loses its baked outer outline,
  // is scaled up 5x, then gets a thin crisp black outline and a soft drop shadow so it pops off any background
  icon(id, frame) {
    this.icons = this.icons || {}; this.iconBox = this.iconBox || {};
    const key = frame && frame !== '0' ? id + '|' + frame : id;
    if (this.icons[key]) return this.icons[key];
    if (key !== id) this.icon(id);                          // frame 0 first: it sets the box every frame shares
    const k = iconIndex(this.W, ITEMS[id]), c = this.W.itemsCols;
    const src = document.createElement('canvas'); src.width = src.height = 16;
    const sx = src.getContext('2d');
    const rd = ITEMS[id] && ITEMS[id].reg && this.R && this.R.resolve(ITEMS[id].reg), rf = rd && (rd.frames[frame] || rd.frames[Object.keys(rd.frames)[0]]);
    sx.imageSmoothingEnabled = false;
    if (rf) sx.drawImage(rd.img, rf.x, rf.y, rf.w, rf.h, 0, 0, 16, 16);       // a Realm Update item: its 8x8 art at 2x
    else sx.drawImage(this.A.img.items, (k % c) * 16, Math.floor(k / c) * 16, 16, 16, 0, 0, 16, 16);
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
    const box = key === id ? (this.iconBox[id] = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]) : this.iconBox[id];
    const x0 = box[0], y0 = box[1], bw = box[2] - x0 + 1, bh = box[3] - y0 + 1;
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
    return (this.icons[key] = cv.toDataURL());
  }

}

// RotMG-style 2.5D walls (src/walls.js)
installWalls(Renderer);
