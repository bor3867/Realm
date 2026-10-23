// One registry for every sprite from the Realm Update bundle (art/bundle/<pack>/, copied from realm_update/).
// Keys are '<sheet>/<sprite>' (e.g. 'bx_gilded_sphinx/gilded_sphinx', 'el_shots/siren.song_note'); a bare
// '<sprite>' alias exists only when exactly one sheet uses that name. Every atlas format goes through a small
// adapter into one shape, a SpriteDef (see docs/design/01_assets.md):
//   { key, sheet, name, img, frames{name:{x,y,w,h}}, anims{clip:{frames,fps,loop}}, pivot[x,y], foot[x,y],
//     size[w,h], kind, hover, meta }
// Art is native 1x; the renderer draws it at 2 buffer pixels per art pixel with the game's own outline.
const BASE = 'art/bundle/';

// what each sheet holds (anything not listed is a creature)
const KIND = {
  ex_tiles: 'tile', d2_tiles: 'tile', ow_tiles: 'tile', ex_decor: 'decor', d2_decor: 'decor', ow_objects: 'object',
  ex_projectiles: 'shot', d2_projectiles: 'shot', ow2_shots: 'shot', el_shots: 'shot', bx_shots: 'shot', bx2_shots: 'shot',
  ex_effects: 'fx', d2_effects: 'fx', mx_effects: 'fx', ex_items: 'item', d2_items: 'item', mx_items: 'item', ix_items: 'item',
  pt2_pets: 'pet', pt2_eggs: 'egg', mx_giant_watermelon: 'object',
};
// unoutlined by design: tiles, the floor rune decal, the ground shadow
const NO_OUTLINE = (def) => def.kind === 'tile' || /rune_circle|ground_shadow/.test(def.name);

// ---- supersession (BRIEF §1), applied when a key is resolved
const KEEP_OLD_ITEMS = new Set(['health_potion', 'mana_potion', 'potion_of_might', 'loot_bag_brown', 'loot_bag_purple', 'loot_bag_white']);
const BOSS_SWAP = { tidebound_lich: 'pack_bosses', forgeheart_colossus: 'pack_bosses', glacius_frozen_wyrm: 'ex_frostveil',
  mother_mycelia: 'ex_mirerot', grand_orrery: 'ex_astral', gilded_sphinx: 'ex_sandscour', abyssal_kraken: 'ex_event_bosses',
  thornheart_treant: 'ex_event_bosses' };

export class Registry {
  constructor() { this.defs = new Map(); this.alias = new Map(); this.redirect = new Map(); this.hover = null; this.counts = {}; }
  add(def) {
    this.defs.set(def.key, def);
    this.counts[def.pack] = (this.counts[def.pack] || 0) + 1;
    const a = this.alias.get(def.name);
    this.alias.set(def.name, a === undefined ? def.key : null);      // null = ambiguous, no alias
  }
  // a key, an alias, or an old superseded name -> the def that should be drawn
  resolve(key) {
    for (let k = key, n = 0; n < 4; n++) {
      if (this.redirect.has(k)) { k = this.redirect.get(k); continue; }
      if (this.defs.has(k)) return this.defs.get(k);
      const al = this.alias.get(k);
      if (al) return this.defs.get(al);
      return null;
    }
    return null;
  }
  get(key) { const d = this.resolve(key); if (!d) throw new Error(`registry: no sprite '${key}'`); return d; }
  list(filter) { return [...this.defs.values()].filter((d) => !filter || filter(d)); }
}

// ---- adapters ----------------------------------------------------------------------------------
// 1. the sheet format: sheets[name] = { native:{image, sprites:{sprite:[[frame, rect], ...]}}, animations, info }
function fromSheets(R, pack, atlas, img) {
  for (const [sheet, S] of Object.entries(atlas.sheets || {})) {
    const kind0 = KIND[sheet] || 'creature', info = S.info || {};
    // one object whose states are stored as sprites, with one flat clip map (the Giant Watermelon)
    if (Object.values(S.animations || {}).every((v) => Array.isArray(v.frames))) {
      const frames = {}; let w = 0, h = 0;
      for (const list of Object.values(S.native.sprites)) for (const [fn, r] of Object.entries(list)) { frames[fn] = { x: r.x, y: r.y, w: r.w, h: r.h }; w = r.w; h = r.h; }
      const name = sheet.replace(/^[a-z0-9]+_/, '');
      R.add({ key: `${sheet}/${name}`, pack, sheet, name, img: img(S.native.image), frames, anims: S.animations, pivot: [0, 0],
        foot: S.anchor || [w / 2, h], footprint: S.footprint_tiles, size: S.frame_size || [w, h], kind: kind0, meta: { ...(atlas.meta || {}) } });
      continue;
    }
    for (const [name, list] of Object.entries(S.native.sprites)) {
      const frames = {}; let pivot = null, w = 0, h = 0;
      for (const [fn, r] of Array.isArray(list) ? list : Object.entries(list)) { frames[fn] = { x: r.x, y: r.y, w: r.w, h: r.h }; if (r.pivot) pivot = r.pivot; w = r.w; h = r.h; }
      const anims = (S.animations && S.animations[name]) || { static: { frames: Object.keys(frames).slice(0, 1), fps: 1, loop: true } };
      const def = { key: `${sheet}/${name}`, pack, sheet, name, img: img(S.native.image), frames, anims, pivot, size: [w, h], kind: kind0, meta: { ...(info[name] || {}) } };
      if (sheet === 'mx_giant_watermelon') { def.foot = S.anchor; def.footprint = S.footprint_tiles; }
      else if (kind0 === 'shot' || kind0 === 'fx' || kind0 === 'item' || kind0 === 'egg') def.foot = [w / 2, h / 2];
      else if (pivot && w <= 8 && h <= 16) def.foot = [pivot[0] + 4, pivot[1] + 8];   // one 8x8 base cell (tall decor stands on it)
      else if (kind0 === 'pet') def.foot = [w / 2, h];
      else { def.foot = [w / 2, h]; def.needsFoot = true; }     // elites: stand where their feet are drawn
      def.pivot = pivot || [0, 0];
      R.add(def);
    }
  }
}
// 2. the boss format: bosses[key] = { native:{image, frames}, animations, phases, death } + shots
function fromBosses(R, pack, atlas, img) {
  for (const [name, B] of Object.entries(atlas.bosses || {})) {
    const frames = {};
    for (const [fn, r] of Object.entries(B.native.frames)) frames[fn] = { x: r.x, y: r.y, w: r.w, h: r.h };
    const [w, h] = B.frame_size;
    R.add({ key: `bx_${name}/${name}`, pack, sheet: `bx_${name}`, name, img: img(B.native.image), frames, anims: B.animations,
      pivot: [0, 0], foot: [w / 2, h - 1], size: [w, h], kind: 'boss', phases: B.phases, death: B.death,
      meta: { title: B.title, dungeon: B.dungeon, base_offset: B.base_offset || null }, needsFoot: !B.base_offset });
  }
  const shotSheet = /bx2/.test(atlas.shots_sheet && atlas.shots_sheet.native) ? 'bx2_shots' : 'bx_shots';
  const simg = atlas.shots_sheet && img(atlas.shots_sheet.native);
  for (const [name, S] of Object.entries(atlas.shots || {})) {
    const frames = {}; let w = 0, h = 0;
    for (const [fn, r] of Object.entries(S.native)) { frames[fn] = { x: r.x, y: r.y, w: r.w, h: r.h }; w = r.w; h = r.h; }
    R.add({ key: `${shotSheet}/${name}`, pack, sheet: shotSheet, name, img: simg, frames, anims: { loop: { frames: S.frames, fps: S.fps, loop: S.loop } },
      pivot: [0, 0], foot: [w / 2, h / 2], size: [w, h], kind: 'shot', meta: {} });
  }
}
// 2b. the Realm Remaster's new content: phase 2/3, morphs and death for the original bosses (rx_<boss>/<boss>), and the
// new shots of bosses, champions and monsters (rx_shots/<owner>.<shot>, pointing right, two frames)
function fromRemaster(R, pack, atlas, img) {
  const clip = (n, fps, loop) => ({ frames: Array.from({ length: n }, (_, k) => k), fps, loop });
  for (const [name, B] of Object.entries(atlas.bosses)) {
    const frames = {}; let w = 0, h = 0;
    for (const [fn, r] of Object.entries(B.native.frames)) { frames[fn] = { x: r.x, y: r.y, w: r.w, h: r.h }; w = r.w; h = r.h; }
    const anims = {};
    for (const [c, n, fps, loop] of [['p1_to_p2', 4, 6, false], ['p2_idle', 4, 5, true], ['p2_attack', 3, 8, false], ['p2_to_p3', 4, 6, false],
      ['p3_idle', 4, 5, true], ['p3_attack', 3, 8, false], ['death', 4, 5, false]]) anims[c] = { ...clip(n, fps, loop), frames: Array.from({ length: n }, (_, k) => `${c}_${k}`) };
    R.add({ key: `rx_${name}/${name}`, pack, sheet: `rx_${name}`, name, img: img(B.native.image), frames, anims, pivot: [0, 0], foot: [w / 2, h - 3], size: [w, h],
      kind: 'boss', meta: { label: B.label, phaseNames: B.phase_names } });
  }
  const simg = img(atlas.shots_sheet.native);
  for (const [name, S] of Object.entries(atlas.shots)) {
    const frames = {}; let w = 0, h = 0;
    for (const [fn, r] of Object.entries(S.native)) { frames[fn] = { x: r.x, y: r.y, w: r.w, h: r.h }; w = r.w; h = r.h; }
    R.add({ key: `rx_shots/${name}`, pack, sheet: 'rx_shots', name, img: simg, frames, anims: { loop: { frames: S.frames, fps: 8, loop: true } },
      pivot: [0, 0], foot: [w / 2, h / 2], size: [w, h], kind: 'shot', meta: { owner: S.owner } });
  }
}
// 2c. the Astral Observatory Plus format: sheets[name] = { native:'<png>', sprites:{ sprite:{ frames:{fn:{native:rect}}, anims, ...meta } } }
const AP_KIND = { ap_shots: 'shot', ap_tiles: 'tile', ap_decor: 'decor', ap_treasure: 'decor' };
function fromAstralPlus(R, pack, atlas, img) {
  for (const [sheet, S] of Object.entries(atlas.sheets)) {
    const I = img(S.native), kind = AP_KIND[sheet] || 'creature';
    for (const [name, sp] of Object.entries(S.sprites)) {
      const frames = {}; let w = 0, h = 0;
      for (const [fn, f] of Object.entries(sp.frames)) { const r = f.native; frames[fn] = { x: r.x, y: r.y, w: r.w, h: r.h }; w = Math.max(w, r.w); h = Math.max(h, r.h); }
      const { frames: _f, anims, ...meta } = sp;
      const def = { key: `${sheet}/${name}`, pack, sheet, name, img: I, frames, anims, pivot: [0, 0], size: [w, h], kind, meta };
      if (kind === 'shot' || kind === 'tile') def.foot = [w / 2, h / 2];
      else if (kind === 'decor') def.foot = [w / 2, h];
      else { def.foot = [w / 2, h]; def.needsFoot = true; }
      R.add(def);
    }
  }
}
// 2e. the user's Realmforge project (tools/rf_build_items.py): sheets of small native pixel sprites, one image each;
// frames are [x, y, w, h]; a sprite with several frames loops through them
function fromRealmforge(R, pack, atlas, img) {
  for (const [sheet, S] of Object.entries(atlas.sheets)) {
    const I = img(S.image), kind = S.kind || 'item';
    for (const [name, sp] of Object.entries(S.sprites)) {
      const frames = {}; let w = 0, h = 0;
      for (const [fn, f] of Object.entries(sp.frames)) { frames[fn] = { x: f[0], y: f[1], w: f[2], h: f[3] }; w = Math.max(w, f[2]); h = Math.max(h, f[3]); }
      const anims = sp.anims || { loop: { frames: Object.keys(frames), fps: sp.fps || 8, loop: true } };
      const def = { key: `${sheet}/${name}`, pack, sheet, name, img: I, frames, anims, pivot: [0, 0], size: [w, h], kind, meta: sp.meta || {} };
      if (kind === 'boss') { def.phases = sp.phases; def.death = sp.death; }   // a Realmforge boss for the three-phase engine (tools/rf_build_bx.py)
      if (kind === 'shot' || kind === 'tile' || kind === 'item') def.foot = [w / 2, h / 2];
      else if (kind === 'decor') def.foot = [w / 2, h];
      else { def.foot = [w / 2, h]; def.needsFoot = true; }
      R.add(def);
    }
  }
}
// 2d. the Grand Orrery's phase 4, Supernova (realm_astral_supernova): the reborn boss (48x48, drawn centred on the
// boss), its shots (sn_shots/<name>, pointing right) and the Event Horizon's floor effects (sn_fx/<name>)
function fromOrrerySupernova(R, pack, atlas, img) {
  const flat = (groups) => { const out = {}; for (const g of Object.values(groups)) for (const [fn, f] of Object.entries(g)) out[fn] = { ...f.native }; return out; };
  const frames = flat(atlas.boss.frames);
  R.add({ key: 'bx_orrery_supernova/grand_orrery', pack, sheet: 'bx_orrery_supernova', name: 'grand_orrery_supernova', img: img(atlas.boss.native), frames,
    anims: atlas.clips, pivot: [0, 0], foot: [24, 24], size: atlas.phase['4'].size, kind: 'boss', meta: { center: true, phase: atlas.phase['4'] } });
  for (const [k, sheet, kind] of [['shots', 'sn_shots', 'shot'], ['room_fx', 'sn_fx', 'fx']]) {
    const I = img(atlas[k].native);
    for (const [name, fr] of Object.entries(atlas[k].frames)) {
      const frames = {}; let w = 0, h = 0;
      for (const [fn, f] of Object.entries(fr)) { frames[fn] = { ...f.native }; w = Math.max(w, f.native.w); h = Math.max(h, f.native.h); }
      R.add({ key: `${sheet}/${name}`, pack, sheet, name, img: I, frames, anims: { loop: { frames: Object.keys(frames), fps: 10, loop: true } },
        pivot: [0, 0], foot: [w / 2, h / 2], size: [w, h], kind, meta: { text: (atlas[k].info || {})[name] } });
    }
  }
}
// 3. the item format: items[name] = { group, tier, native:{frame:rect}, animations }
function fromItems(R, pack, atlas, img) {
  const I = img(atlas.sheet.native);
  for (const [name, it] of Object.entries(atlas.items || {})) {
    const frames = {};
    for (const [fn, r] of Object.entries(it.native)) frames[fn] = { x: r.x, y: r.y, w: r.w, h: r.h };
    R.add({ key: `ix_items/${name}`, pack, sheet: 'ix_items', name, img: I, frames, anims: it.animations, pivot: [0, 0], foot: [4, 4],
      size: [8, 8], kind: 'item', meta: { group: it.group, tier: it.tier } });
  }
}

// ---- supersession map, built once everything is registered
function buildRedirects(R) {
  for (const d of R.list((x) => x.sheet === 'ix_items')) {
    if (!KEEP_OLD_ITEMS.has(d.name)) R.redirect.set(`items/${d.name}`, d.key);
    if (!/^potion_of_/.test(d.name)) R.redirect.set(`ex_items/${d.name}`, d.key);
  }
  for (const [boss, old] of Object.entries(BOSS_SWAP)) {
    if (!R.defs.has(`bx_${boss}/${boss}`)) continue;
    R.redirect.set(`${old}/${boss}`, `bx_${boss}/${boss}`);
  }
  // the 16x16 sphinx lives on as the Lesser Sphinx, an enemy that guards Sandscour's doorways
  const s = R.defs.get('ex_sandscour/gilded_sphinx');
  if (s) R.defs.set('ex_sandscour/gilded_sphinx_lesser', { ...s, key: 'ex_sandscour/gilded_sphinx_lesser', name: 'gilded_sphinx_lesser', kind: 'creature' });
}

// hover (HOVER.json): which sprites bob, with what style; bosses only in the phases listed
function applyHover(R, H) {
  R.hover = H;
  for (const [key, style] of Object.entries(H.sprites || {})) { const d = R.resolve(key); if (d) d.hover = style; }
  for (const [boss, b] of Object.entries(H.bosses || {})) { const d = R.defs.get(`bx_${boss}/${boss}`); if (d) { d.hover = b.style; d.hoverPhases = b.phases; } }
}
// y offset in buffer pixels for a hovering sprite (2 buffer px per art px); 0 for everything else
export function hoverY(R, def, t, phase0 = 0, bossPhase = 1) {
  if (!def || !def.hover || !R.hover) return 0;
  if (def.hoverPhases && !def.hoverPhases.includes(bossPhase)) return 0;
  const S = R.hover.styles[def.hover];
  return S ? Math.round(Math.sin((2 * Math.PI * t) / S.period_s + phase0) * S.amplitude * 2) : 0;
}

// find where a boss stands: centred, on the lowest opaque row of its first idle frame
function footFromPixels(def) {
  const clip = def.phases ? def.anims[def.phases['1'].idle] : def.anims.walk || def.anims.move || def.anims.idle || Object.values(def.anims)[0];
  const f = def.frames[clip.frames[0]], cv = document.createElement('canvas');
  cv.width = f.w; cv.height = f.h;
  const x = cv.getContext('2d', { willReadFrequently: true });
  x.drawImage(def.img, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
  const px = x.getImageData(0, 0, f.w, f.h).data;
  for (let y = f.h - 1; y >= 0; y--) {
    let x0 = -1, x1 = -1;
    for (let xx = 0; xx < f.w; xx++) if (px[(y * f.w + xx) * 4 + 3] > 40) { if (x0 < 0) x0 = xx; x1 = xx; }
    if (x0 >= 0) return [f.w / 2, y + 1];             // centred on the position (bundle rule), standing on its lowest row
  }
  return [f.w / 2, f.h];
}

// build a registry from atlas JSON (used by the browser loader and by headless checks: img is any function)
export function buildRegistry(atlases, hover, img = () => null) {
  const R = new Registry();
  for (const { pack, json } of atlases) {
    const im = (rel) => img(`${pack}/${rel}`);
    if (json.bosses && json.meta && /^Realm Remaster/.test(json.meta.name)) fromRemaster(R, pack, json, im);
    else if (json.bosses) fromBosses(R, pack, json, im);
    else if (json.boss && json.clips && json.phase) fromOrrerySupernova(R, pack, json, im);
    else if (json.rf) fromRealmforge(R, pack, json, im);
    else if (json.sheets && Object.values(json.sheets).some((S) => typeof S.native === 'string')) fromAstralPlus(R, pack, json, im);
    else if (json.items) fromItems(R, pack, json, im);
    else fromSheets(R, pack, json, im);
  }
  buildRedirects(R);
  if (hover) applyHover(R, hover);
  for (const d of R.defs.values()) d.outline = !NO_OUTLINE(d);
  return R;
}

// a file that fails is tried again (4 times in all, waiting a little longer each time, past any cache): while GitHub
// Pages republishes the site after a push, a file can be missing for a few seconds, and one missing sheet used to stop
// the whole game loading (2026-10-22)
const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
export async function fetchJSON(url, tries = 4) {
  for (let k = 0; ; k++) {
    try { const r = await fetch(k ? url + (url.includes('?') ? '&' : '?') + 'r=' + Date.now() : url); if (!r.ok) throw new Error('missing ' + url); return await r.json(); }
    catch (err) { if (k >= tries - 1) throw err; await wait(700 * (k + 1)); }
  }
}
export function imageLoaded(im, src, tries = 4) {
  return new Promise((ok, bad) => {
    let k = 0;
    if (im.complete && im.naturalWidth) { ok(); return; }
    im.onload = ok;
    im.onerror = () => { if (++k >= tries) bad(new Error('missing ' + src)); else setTimeout(() => { im.src = src + (src.includes('?') ? '&' : '?') + 'r=' + Date.now(); }, 700 * k); };
  });
}

// the browser loader: fetch every atlas, decode each sheet once, find boss feet
export async function loadRegistry() {
  const idx = await fetchJSON(BASE + 'index.json');
  const atlases = await Promise.all(idx.atlases.map(async (a) => ({ pack: a.split('/')[0], json: await fetchJSON(BASE + a) })));
  const hover = await fetchJSON(BASE + idx.hover);
  const imgs = new Map();
  const img = (path) => {
    if (!imgs.has(path)) { const im = new Image(); im.src = BASE + path; imgs.set(path, im); }
    return imgs.get(path);
  };
  const R = buildRegistry(atlases, hover, img);
  await Promise.all([...imgs.entries()].map(([path, im]) => imageLoaded(im, BASE + path)));
  for (const d of R.defs.values()) if (d.needsFoot) d.foot = footFromPixels(d);
  R.images = imgs;
  return R;
}
