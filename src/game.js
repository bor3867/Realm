// Game simulation: maps, player, enemies, projectiles, loot, portals, boss.
// Pure state + update(); rendering and DOM live elsewhere.
import { R, rng, clamp, dist, dist2, angleTo, TAU, CAM, lift, liftO, liftA, liftB, angleUp } from './util.js';
import { CLASSES, START_KIT, STATS, MAX_LEVEL, FAME_XP, FAME_GOALS, xpToNext, moveSpeed, fireRate, dmgMult, hpRegen, mpRegen, mitigate } from './data/classes.js';
import { ITEMS, SETS, rollLoot, bagFor, canEquip, TYPE_SLOT, BAG_ORDER, BAG_NAMES, WEAPON_TYPES, ARMOR_TYPES, ABILITY_TYPES, ADMIN_SET, TIER_CAP, ladderTier } from './data/items.js';
import { ENEMIES, PACKS, CAMP_LOOT, BIOME_SPAWNS, BOSS, REALM_BOSSES, PARENTS, HERALDS, BIOME_BOSS, EVENTS_TO_BOSS, GROUPS, DUNGEONS, DUNGEON_BOSSES, FIRECAMP_BANDS, portalDrop2 as portalDrop } from './data/enemies.js';
import { nexus, vaultRoom, realm, dungeon, isSolid, shotBlocked, biomeAt, randomTileInBiome, BIOMES, BIOME_RING, BIOME_LABEL, TID } from './world/maps.js';
import { writeSave } from './save.js';
import { keyParen } from './settings.js';
import { SHOT_BOXES, SHOT_BIG } from './data/shot_boxes.js';
import { installD4 } from './dungeons4.js';
import { installMelon } from './melon.js';
import { installRealmEvents } from './realmevents.js';
import { installFrostveil } from './frostveil.js';
import { installMirerot } from './mirerot.js';
import { installAstral } from './astral.js';
import { installOrbiters } from './orbiters.js';
import { installSandscour } from './sandscour.js';
import { installKeep } from './keep.js';
import { installHollowmoon } from './hollowmoon.js';
import { installCryptEmber } from './crypt_ember.js';
import { installElites } from './elites.js';
import { installRemaster } from './remaster.js';
import { installSetpieces, wireBxSetpieces } from './setpieces.js';
import { installBX } from './bossx.js';
import { installWeaponMech } from './weaponmech.js';
import { installHalos } from './halos.js';
import { installSigils } from './sigils.js';
import { installMythics } from './mythics.js';
import { installGearMech } from './gearmech.js';
import { BX, bxEnemyDef } from './bosses/index.js';
import { installRF } from './rf/host.js';
import { installRFBoss } from './rf/boss.js';
import { installUniqMech } from './rf/uniqmech.js';
import { assignItemShots } from './data/uniques.js';
import { SPEECH, BIOME_SPEECH, BOSS_SPEECH, HERALD_SPEECH, WANDERERS, LORE, QUEST_HUNTS, FETCH_ITEMS } from './data/lore.js';

import { PET_KINDS, RARITY, PET_TICK, SHIELD_TICK, PET_MAX, petHeal, petMagic, petShield, petCap, petLevel, feedCost, feedValue, hatchKind, newPet, upgradePet, feed, canMorph, morph, FUSE_GOLD, petSprite, petName, petStage, START_LV, FAMILIES, eggId } from './data/pets.js';
const PLAYER_R = 0.32;
// hits follow the art. You are an upright capsule a little inside your sprite (feet to the top of your head); a shot is a
// capsule along its flight the size of its visible pixels (src/data/shot_boxes.js, made by tools/shot_boxes.mjs),
// trimmed by HIT_K so that a graze of a pixel or two does not count. tools/check_hitboxes.mjs holds them to the art.
export const HITBOX = { foot: 0.26, head: 0.66, r: 0.29, k: 0.86, kRound: 0.95 };
const SHOT_OVERRIDE = { 'bx_shots/grand_orrery.star_bolt': [20, 4, 0, 0, 'h'] };   // drawn as a laser (render.js laserShot)
const shapeCache = new Map();
export function shotShape(sprite, size) {
  let S = shapeCache.get(sprite);
  if (S) return S;
  const B = SHOT_OVERRIDE[sprite] || SHOT_BOXES[sprite], k = HITBOX.k / 16;
  if (!B) S = { r: (size || 0.4) * 0.7, half: 0, al: 0, ac: 0 };
  else if (B[4] !== 's') {                                  // a capsule along its longer side (across its flight for a crescent or a wave);
                                                            // an upright sprite ('f') keeps to the screen, not its flight
    const across = B[1] > B[0], r = (Math.min(B[0], B[1]) / 2) * k, round = Math.abs(B[0] - B[1]) <= 2;
    S = { r: round ? (B[0] / 2) * (HITBOX.kRound / 16) : r, half: round ? 0 : Math.max(0, (Math.max(B[0], B[1]) / 2) * k - r), al: B[2] / 16, ac: B[3] / 16, across, upright: B[4] === 'f' };
  }
  else S = { r: ((B[0] + B[1]) / 4) * k, half: 0, al: 0, ac: 0 };                   // spinning: a round shape
  if (B && B[5] && B[4] !== 's') {                          // its visible pixels, for the close look
    const bin = typeof atob === 'function' ? atob(B[5]) : Buffer.from(B[5], 'base64').toString('binary'), pts = new Float32Array(bin.length);
    for (let i = 0; i < bin.length; i++) { const v = bin.charCodeAt(i); pts[i] = (v > 127 ? v - 256 : v) / 32; }   // half buffer pixels -> tiles
    S.pts = pts; S.pr = (B[6] || 1) / 16;
  }
  shapeCache.set(sprite, S);
  return S;
}
// a shot against your capsule: its own capsule first (cheap), then, if that is close, its visible pixels one by one
export function shotTouches(S, bx, by, ca, sa, cx, cy, ux, uy, fx, fy, hx, hy, k = 1) {   // k: the shot is drawn k times its art
  const half = S.half * k, r = S.r * k;
  const d = segDist(cx - ux * half, cy - uy * half, cx + ux * half, cy + uy * half, fx, fy, hx, hy);
  if (!S.pts) return d < r + HITBOX.r;
  if (d > r + HITBOX.r + 0.35) return false;
  const reach = HITBOX.r + S.pr * k * 0.6, P = S.pts;
  for (let i = 0; i < P.length; i += 2) {
    const x = bx + (P[i] * ca - P[i + 1] * sa) * k, y = by + (P[i] * sa + P[i + 1] * ca) * k;
    if (segDist(x, y, x, y, fx, fy, hx, hy) < reach) return true;
  }
  return false;
}
// how big a shot is drawn (and hits: the hit shape is its art at the same scale). A player's shot: one art pixel to one
// screen pixel (pack art is stored at two). An enemy's: the attack's own size (its "size", a radius in tiles) asks
// for about 2.4 times that radius, then the scale snaps to a whole one, one or two screen pixels to each art pixel,
// so the pixel art stays even (docs/projectile_art_standard.md). The original sheet's "big" shots are boxed at 1.3x.
const kCache = new Map();
export function shotScaleRaw(sprite, size) {             // the scale the attack's size asks for, before the snap
  const B = SHOT_OVERRIDE[sprite] || SHOT_BOXES[sprite], want = (size || 0.4) * 16 * 2.4;
  return B ? Math.min(1, want / Math.max(B[0], B[1], 1)) : 1;
}
export function shotPx(sprite) {                          // screen pixels per art pixel at scale 1
  const B = SHOT_OVERRIDE[sprite] || SHOT_BOXES[sprite];
  return sprite.includes('/') ? (B && B[6] >= 1 ? 2 : 1) : SHOT_BIG.has(sprite) ? 1.3 : 1;
}
export function shotScale(sprite, size, from) {
  const key = sprite + '|' + size + '|' + from;
  let k = kCache.get(key);
  if (k === undefined) {
    const px = shotPx(sprite);
    if (from === 'p') k = sprite.startsWith('rf_') ? 1 : px >= 2 ? 0.5 : 1;   // (Realmforge shots: its 8-pixel art at exactly 2x, the size it was drawn for)
    else if (SHOT_OVERRIDE[sprite]) k = shotScaleRaw(sprite, size);        // (drawn as light, not pixels)
    else k = (px * shotScaleRaw(sprite, size) >= 1.5 ? 2 : 1) / px;
    kCache.set(key, k);
  }
  return k;
}
// the nearest distance between two segments (a0-a1 and b0-b1)
export function segDist(ax, ay, bx, by, cx, cy, dx, dy) {
  const ux = bx - ax, uy = by - ay, vx = dx - cx, vy = dy - cy, wx = ax - cx, wy = ay - cy;
  const a = ux * ux + uy * uy, b = ux * vx + uy * vy, c = vx * vx + vy * vy, d = ux * wx + uy * wy, e = vx * wx + vy * wy, D = a * c - b * b;
  let s = 0, t = 0;
  if (a < 1e-9 && c < 1e-9) return Math.hypot(wx, wy);
  if (a < 1e-9) t = Math.max(0, Math.min(1, e / c));
  else if (c < 1e-9) s = Math.max(0, Math.min(1, -d / a));
  else {
    s = D > 1e-9 ? Math.max(0, Math.min(1, (b * e - c * d) / D)) : 0;
    t = (b * s + e) / c;
    if (t < 0) { t = 0; s = Math.max(0, Math.min(1, -d / a)); } else if (t > 1) { t = 1; s = Math.max(0, Math.min(1, (b - d) / a)); }
  }
  return Math.hypot(wx + s * ux - t * vx, wy + s * uy - t * vy);
}
const r4 = () => [0, Math.PI / 2, Math.PI, -Math.PI / 2][Math.floor(Math.random() * 4)];
export const POT_STACK = 10, VAULT_MAX = 80;
const ACTIVE_R = 24;            // enemies farther than this sleep
const SLOT_ORDER = ['weapon', 'ability', 'armor', 'ring'];
const BIOME_TARGET = { shore: 210, fen: 170, runeholt: 125, godfall: 85 };
// groups per biome: the realm is 2.25x bigger than it was but only gets 1.5x the groups, so it breathes
// how many monster groups each land holds: one per so many tiles of it, denser toward the middle
const TILES_PER_GROUP = [1700, 1600, 1200, 560];
const parentTarget = (m, b) => Math.round((m.area ? m.area[BIOMES.indexOf(b)] : 60000) / TILES_PER_GROUP[BIOME_RING[BIOMES.indexOf(b)]]);
const MAX_REALM_BOSSES = 3;
// things you walk up to and press F on
// Phase 7: an egg's burst frame (its hatch clip: 9 frames at 6 fps), how hard each land is, and the families it keeps
const HATCH_BURST = 8 / 6;
const EGG_LAND_TIER = { shore: 0, dunes: 0, lowlands: 1, fen: 1, thornwood: 2, runeholt: 3, steppe: 3, godfall: 4 };
const EGG_LAND_FAMILIES = { shore: ['aquatic', 'reptile'], dunes: ['reptile', 'exotic'], lowlands: ['woodland', 'canine'], fen: ['spooky', 'reptile'],
  thornwood: ['feline', 'insect'], runeholt: ['avian', 'automaton'], steppe: ['avian', 'automaton'], godfall: ['spooky', 'exotic'] };
// How a monster carries its weight: how quickly its velocity follows where it wants to go (per second). Heavy things
// gather speed slowly, carry momentum and turn wide; beasts are snappy; spectres glide and drift. Top speed is its own,
// unchanged. A monster's data may name its weight; otherwise it is read from what it is.
export const WEIGHT = { heavy: 2.6, normal: 8, agile: 11, glide: 1.8 };
export function weightOf(D) {
  if (D.wk) return D.wk;
  const n = D.name.toLowerCase(), ai = D.ai;
  let w = D.weight || (ai === 'flee' ? 'normal' : null);   // (a fleeing critter's escape wobbles on purpose: nimble steering would twitch on it)
  if (!w && (ai === 'float' || ai === 'drift' || /wraith|wisp|ghoul|jelly|ghost|spectre|specter|phantom/.test(n))) w = 'glide';
  if (!w && /hound|wolf|jackal|boar|\bram\b|\brat\b|\bbat\b|\bbee\b|mite|hornet|hawk|harpy|gull|\bimp\b|stalker|\bmare\b|gryphon/.test(n)) w = 'agile';
  // heavy: armoured or stone things, and big walkers (a big flyer or a caster that keeps its distance stays nimble)
  if (!w && (/golem|titan|knight|armou?r|ogre|troll|bear|turtle|engine|sentinel|warden|keeper|jarl|shieldwall|executioner|headsman|mummy/.test(n) || (D.r >= 0.7 && !D.fly && ai !== 'kite'))) w = 'heavy';
  if (!w && D.speed >= 3.4) w = 'agile';
  return (D.wk = WEIGHT[w || 'normal'] || WEIGHT.normal);
}
const AIMED = new Set(['aimed', 'shotgun', 'wall', 'beam', 'burst', 'cage']);   // attacks aimed at you, which want a clear line
const TALKY = new Set(['scope', 'mask', 'maskstand', 'mirror', 'sigil', 'alarm', 'journal', 'petyard', 'shop', 'forge', 'board', 'talk', 'lore', 'wish', 'altar', 'dig', 'fish', 'cat', 'bard', 'fortune', 'waypoint', 'riddle', 'mystery']);
const VILLAGER_LINES = ['Lovely evening.', 'Did you hear the bells last night?', 'Mind the cat. She bites.', 'The Peddler overcharged me again.',
  'My cousin went into the realm. He came back a toad.', 'Is it always dusk here? Huh.', 'Watch out for the Golden Duck. It\'s a scam.',
  'Nice weather for adventuring!', 'I\'ve never seen the sun. Have you?', 'Hey, you\'re the one who pets the cat!'];
const BARD_SONGS = ['♪ Oh the anvil was never struck, and the smiths all drowned in muck ♪', '♪ Sing ho, for the Golden Duck, who never once had any luck ♪',
  '♪ Down in the chapel the bells ring low, for every pilgrim who did not go ♪', '♪ The Orrery turns and the cold comes in, and nobody ever remembers to grin ♪',
  '♪ A heart in the ground, it beats and beats, and somebody really should change the sheets ♪'];
const FORTUNES = ['You will meet a tall, dark monster. It will be very rude.', 'A great treasure awaits you. Or a boot. Probably a boot.',
  'The stars favour you today. +LUCK.', 'Beware the duck.', 'You will die... eventually. Not today, though. Probably.',
  'Your next dungeon will be cold. Bring a scarf.', 'Something in the Frozen Scriptorium has your name in it.', 'The cat says hello.'];

export class Game {
  constructor(assets, save) {
    this.A = assets;
    assignItemShots(assets.reg, Object.fromEntries(Object.entries(BX).map(([k, B]) => [k, B.loot])));   // every relic its own shot (src/data/uniques.js)
    this.save = save;
    this.mode = 'title';
    this.t = 0;
    this.input = { up: 0, down: 0, left: 0, right: 0, fire: false, aimX: 0, aimY: 0, auto: false };
    this.events = [];           // ui notifications {type, ...}
    this.floaters = [];
    this.fx = [];
    this.vfx = [];              // one-shot visual events for the renderer (bursts, shake, flashes)
    this.camAngle = 0;          // radians; the ground rotates, sprites stay upright
    this.chat = [];             // {text, color, t}
    this.sfxq = [];             // sounds to play this frame
    this.camTarget = null;      // smooth camera snaps
    this.bubbles = [];          // speech bubbles {e?, x, y, text, t0, col}
  }
  sfx(name, arg) { if (this.sfxq.length < 24) this.sfxq.push([name, arg]); }
  say(text, color = '#e9e4f2') {
    this.chat.push({ text, color, t: performance.now() });
    if (this.chat.length > 120) this.chat.shift();
    this.events.push({ type: 'chat' });
  }
  // world offset of something `d` tiles "up the screen" from a point (chest height of an upright sprite)
  up(x, y, d) { return [x - d * Math.sin(this.camAngle), y - d * Math.cos(this.camAngle)]; }
  get camAngle() { return this._cam || 0; }
  set camAngle(v) { this._cam = v; CAM.a = v; }   // (shared with lift() in src/util.js)
  rotateCam(dir, dt) { this.camTarget = null; this.camAngle = (this.camAngle + dir * 1.9 * dt) % (Math.PI * 2); }
  resetCam() { this.camTarget = Math.round(this.camAngle / (Math.PI * 2)) * Math.PI * 2; }
  snapCam() {                              // nearest 90° step
    const q = Math.PI / 2;
    this.camTarget = Math.round(this.camAngle / q) * q;
  }
  vx(ev) { if (this.vfx.length < 200) this.vfx.push(ev); }

  // ------------------------------------------------------------- lifecycle
  // ---- characters: an account holds several; death erases only that one
  newCharacter(clsId) {
    const C = CLASSES[clsId], S = this.save;
    if (S.chars.length >= S.slots) { this.toast('All character slots are full.'); return false; }
    const start = START_KIT[clsId];
    S.chars.push({
      id: Date.now().toString(36), created: new Date().toISOString().slice(0, 10),
      cls: clsId, level: 1, xp: 0, totalXp: 0, base: { ...C.base },
      equip: [...start, null], inv: ['pot_hp', 'pot_hp', 'pot_mp', null, null, null, null, null], kills: 0, fame: 0, fameXp: 0, bossKills: 0, dungeons: 0,
    });
    this.persist();
    this.startPlaying(S.chars.length - 1);
    return true;
  }
  startPlaying(idx = 0) {
    const c = this.save.chars[idx];
    if (!c) return;
    this.charIdx = idx;
    this.player = {
      ...c, x: 0, y: 0, dir: 'front', hp: 0, mp: 0, fireCd: 0, lastShot: -9, abilityT: 0, hitT: 0,
      status: { berserk: 0, armored: 0, invuln: 0 }, moving: false, dead: false, deadT: 0, lavaT: 0, quests: c.quests || [], lore: c.lore || [],
    };
    this.save.chars[idx] = this.player;      // the live object IS the save record
    this.player.hp = this.stat('hp');
    this.player.mp = this.stat('mp');
    this.realmMap = null;
    this.mode = 'play';
    this.enter('nexus');
  }
  leaveToMenu() {
    if (this.player && !this.player.dead) this.persist();
    this.mode = 'title';
    this.player = null; this.charIdx = null;
  }
  deleteCharacter(idx) {
    this.save.chars.splice(idx, 1);
    this.persist();
  }
  unlockSlot() {
    const price = 1500 * (this.save.slots - 3);
    if (this.save.slots >= 8) return 'All 8 slots are open.';
    if ((this.save.gold || 0) < price) return `You need ${price} gold.`;
    this.save.gold -= price; this.save.slots++;
    this.persist();
    return 'A new character slot opens.';
  }
  persist() {
    const keep = ['id', 'created', 'cls', 'level', 'xp', 'totalXp', 'base', 'equip', 'inv', 'kills', 'quests', 'lore', 'petted', 'fame', 'fameXp', 'bossKills', 'dungeons', 'waypoints', 'pots'];
    const chars = this.save.chars.map((c) => Object.fromEntries(keep.map((k) => [k, c[k]])));
    writeSave({ ...this.save, chars }, this.saveKey);
  }

  enter(where) {
    if (this.spClear) this.spClear();                    // no set piece outlives its map
    const p = this.player;
    p.carry = null; p.drowsy = 0; this.invertUntil = 0;                // nothing carried, dreamt or inverted crosses a portal
    p.chill = 0; p.frozenUntil = 0; p.gust = null; p.poisonUntil = 0;   // nor any cold or poison
    // remember where you stepped into a dungeon, so its portals can send you back to that spot
    if (DUNGEONS[where] && this.map && this.map.kind === 'realm') this.realmReturn = { x: p.x, y: p.y };
    else if (where === 'nexus' || where === 'vault') this.realmReturn = null;
    if (where === 'nexus') this.map = nexus();
    else if (where === 'vault') this.map = vaultRoom();
    else if (where === 'realm') {
      if (!this.realmMap) this.realmMap = realm((Date.now() & 0xffffff) | 1);
      this.map = this.realmMap;
    } else if (DUNGEONS[where]) this.map = dungeon((Date.now() & 0xffffff) | 3, DUNGEONS[where]);
    else if (where.startsWith('rf_boss:')) { const m = this.rfBossMap(where); if (!m) { this.banner('That boss is not ready.', 2000); return; } this.map = m; }
    else if (where.startsWith('rf_')) { const m = this.rfMap(where); if (!m) { this.banner('That dungeon is not ready.', 2000); return; } this.map = m; }
    this.projectiles = [];
    this.allies = [];
    this.decoys = [];
    this.timeStop = null;
    this.arena = null;
    this.darkUntil = 0;
    if (p) { p.hook = null; p.pull = null; p.dash = null; }
    this.bags = this.map.bags = (this.map.bags || []).filter((b) => b.until === undefined || b.until > this.t);   // (bags that ran out while you were away are gone)
    this.enemies = this.map.enemies || (this.map.enemies = []);
    this.boss = null;
    p.x = this.map.spawn.x; p.y = this.map.spawn.y;
    this.unstick(p);
    this.realmReturn = null;                              // dungeons let out onto the beach
    if (where === 'realm' && !this.map.populated) this.populateRealm();
    if (this.map.rf) this.map.portals.push({ kind: 'realm', x: this.map.spawn.x, y: this.map.spawn.y + 1.5, label: 'Back to the Realm', to: 'realm' });
    if (DUNGEONS[where]) {
      this.populateDungeon(DUNGEONS[where]);
      // a way back out, right where you arrive
      this.map.portals.push({ kind: 'realm', x: this.map.spawn.x, y: this.map.spawn.y - 3, label: 'Back to the Realm', to: 'realm' });
    }
    // fog of war: realms and dungeons start dark and stay uncovered where you have been (the town has none)
    if ((this.map.kind === 'realm' || this.map.kind === 'dungeon') && !this.map.seen) { this.map.seen = new Uint8Array(this.map.w * this.map.h); this.map.fogNew = []; }
    this.fogAt = null;
    if (where === 'nexus' || where === 'vault') { p.hp = this.stat('hp'); p.mp = this.stat('mp'); this.persist(); }
    if (where === 'realm') {
      this.placeFetches();
      const known = p.waypoints || (p.waypoints = []), home = this.map.waypoints && this.map.waypoints[0];
      if (home && !known.includes(home.name)) known.push(home.name);      // you always know the way back to the landing beach
    }
    if (where === 'nexus') {
      this.rollQuestOffers();
      this.rollShop();
      (this.map.dummies || []).forEach(([x, y], k) => this.addEnemy(k >= 3 ? 'armored_dummy' : 'training_dummy', x, y));
    }
    this.banner(where === 'nexus' ? 'The Nexus' : this.map.name, 2200, where !== 'vault');
    this.sfx('portal');
    this.events.push({ type: 'map' });
  }
  banner(text, ms = 2200, log = true) {
    this.events.push({ type: 'banner', text, ms });
    const L = (this.bannerLog = this.bannerLog || new Map()), last = L.get(text);
    if (log && !(last !== undefined && this.t - last < 8)) { this.say(text, '#f2c14e'); L.set(text, this.t); if (L.size > 60) L.clear(); }   // the same news, once, not a wall of it
  }

  // ------------------------------------------------------------- stats & items
  stat(s) {
    const p = this.player;
    let v = p.base[s];
    if (s === 'def' && p.status && p.status.bless > 0 && p.blessKind === 'godfall') v += 15;
    for (const id of p.equip) {
      const it = id && ITEMS[id];
      if (it && it.bonus && it.bonus[s]) v += it.bonus[s];
    }
    return v + (this.setState().bonus[s] || 0) + this.rfStat(s);   // (+ a Realmforge unique's moment: src/rf/uniqmech.js)
  }
  // class sets: how many pieces of each are worn, and the bonuses that unlocks (the Conductor's Band adds a piece)
  setState() {
    const key = this.player.equip.join('|');
    if (this._skey === key) return this._set;
    const count = {}, bonus = {}, passive = [];
    let extra = 0;
    for (const id of this.player.equip) {
      const it = id && ITEMS[id];
      if (!it) continue;
      if (it.set) count[it.set] = (count[it.set] || 0) + 1;
      if (it.passive && it.passive.setbonus) extra += it.passive.setbonus;
    }
    const active = [];
    for (const [k, n0] of Object.entries(count)) {
      const n = n0 + extra, S = SETS[k];
      if (!S) continue;
      for (const tier of [2, 3]) {
        if (n < tier || !S[tier]) continue;
        for (const [st, v] of Object.entries(S[tier].bonus || {})) bonus[st] = (bonus[st] || 0) + v;
        if (S[tier].passive) passive.push(S[tier].passive);
      }
      active.push({ set: k, n: Math.min(3, n) });
    }
    this._skey = key; this._set = { count, bonus, passive, active };
    return this._set;
  }
  weapon() { const id = this.player.equip[0]; return id ? ITEMS[id].weapon : null; }
  // armour + ring effects, summed (numbers add, crit keeps the best, aura merges)
  passive() {
    const key = this.player.equip.join('|');
    if (this._pkey === key) return this._pas;
    const P = {};
    const sources = [...this.player.equip.map((id) => id && ITEMS[id].passive), ...this.setState().passive];
    for (const ps of sources) {
      if (!ps) continue;
      for (const [k, v] of Object.entries(ps)) {
        if (typeof v === 'number') P[k] = k === 'aegis' || k === 'cheatdeath' ? Math.min(P[k] || 1e9, v) : (P[k] || 0) + v;
        else if (k === 'crit') P.crit = !P.crit || v.p * v.x > P.crit.p * P.crit.x ? v : P.crit;
        else if (k === 'aura') P.aura = P.aura ? { dps: P.aura.dps + v.dps, r: Math.max(P.aura.r, v.r), slow: Math.max(P.aura.slow, v.slow) } : { ...v };
        else P[k] = v;
      }
    }
    this._pkey = key; this._pas = P;
    return P;
  }
  // final damage of one player hit on one enemy: crits, execute, rage, momentum, kintsugi
  hitDamage(e, base, sp) {
    const p = this.player, P = this.passive();
    let m = 1;
    if (P.momentum && p.moving) m += P.momentum;
    m += this.gearDamageBonus();                         // a Motion ring's empowered window
    m += this.rfHitMult(e);                              // Realmforge uniques: checkmate, the Stilled, crowns (src/rf/uniqmech.js)
    if (P.rage) m += P.rage * (1 - p.hp / this.stat('hp'));
    if (P.kintsugi && p.status.kintsugi > 0) m += P.kintsugi;
    if (p.status.bless > 0 && p.blessKind === 'runeholt') m += 0.25;
    if (p.status.inspired > 0) m += 0.1;
    if (p.ward > 0 && this.abilityMod() === 'wardfury') m += 0.25;      // the Runic Aegis: fight harder behind the ward
    if (P.execute && e.hp < e.maxHp * 0.3) m += P.execute;
    if (P.burnbonus && e.burn && e.burn.t > 0) m += P.burnbonus;          // synergy: fire gear + the First Flame
    if (P.slowbonus && e.slowT > 0) m += P.slowbonus;                      // synergy: frost / clockwork gear + Still Waters
    let crit = false;
    for (const c of [sp && sp.crit, P.crit]) if (c && R() < c.p) { m *= c.x; crit = true; break; }
    if (crit && P.critheal) {                                               // synergy: crit gear + the Open Hand
      p.hp = Math.min(this.stat('hp'), p.hp + P.critheal * 5); p.mp = Math.min(this.stat('mp'), p.mp + P.critheal * 2);
    }
    return { dmg: Math.round(base * m), crit };
  }

  // the potion side slots: two stacks of up to POT_STACK of one kind of potion each
  pots() { const p = this.player; if (!p.pots || p.pots.length !== 2) p.pots = [null, null]; return p.pots; }
  isPotion(id) { const it = id && ITEMS[id]; return !!(it && it.slot === 'consumable' && it.use && (it.use.heal || it.use.mana || it.use.stat)); }
  abilityMod() { const id = this.player && this.player.equip[1], it = id && ITEMS[id]; return it && it.ability ? it.ability.mod : null; }
  container(name) {
    if (name === 'pots') return this.pots().map((s) => (s ? s.id : null));
    if (name === 'equip') return this.player.equip;
    if (name === 'inv') return this.player.inv;
    if (name === 'vault') return this.vaultIdx === null || this.vaultIdx === undefined ? null : this.save.vaults[this.vaultIdx];
    if (name === 'ground') return this.nearBag ? this.nearBag.items : null;
    return null;
  }
  // Move/swap an item between slots. Returns true if anything changed.
  moveItem(fromC, fromI, toC, toI) {
    if (fromC === 'ground' && this.nearVault) fromC = 'vault';
    if (toC === 'ground' && this.nearVault) toC = 'vault';
    if (fromC === 'pots' || toC === 'pots') return this.movePot(fromC, fromI, toC, toI);
    if ((fromC === 'vault' || toC === 'vault') && !this.container('vault')) return false;
    const A = this.container(fromC);
    let B = this.container(toC);
    if (!A || !A[fromI]) return false;
    if (!B && toC === 'ground') B = this.dropBag().items;
    if (!B) return false;
    const a = A[fromI], b = B[toI];
    const fits = (cont, idx, id) => !id || cont !== 'equip' || (TYPE_SLOT[ITEMS[id].type] === SLOT_ORDER[idx] && canEquip(this.player.cls, ITEMS[id]));
    if (!fits(toC, toI, a) || !fits(fromC, fromI, b)) { this.toast('That doesn\'t fit there.'); return false; }
    A[fromI] = b; B[toI] = a;
    this.clampVitals();
    this.cleanBags();
    if (fromC === 'vault' || toC === 'vault') this.persist();   // never lose stash moves
    return true;
  }
  movePot(fromC, fromI, toC, toI) {
    const P = this.pots();
    if (fromC === 'pots' && toC === 'pots') { [P[fromI], P[toI]] = [P[toI], P[fromI]]; return true; }
    if (toC === 'pots') {                                  // stack a potion into a side slot
      const A = this.container(fromC), id = A && A[fromI];
      if (!id) return false;
      if (!this.isPotion(id)) { this.toast('Only potions go in the potion slots.'); return false; }
      const S = P[toI];
      if (S && S.id !== id) { this.toast(`That slot holds ${ITEMS[S.id].name}.`); return false; }
      if (S && S.n >= POT_STACK) { this.toast(`That slot is full (${POT_STACK}).`); return false; }
      if (S) S.n++; else P[toI] = { id, n: 1 };
      A[fromI] = null;
      this.cleanBags();
      if (fromC === 'vault') this.persist();
      return true;
    }
    // take one potion out of a side slot into an empty slot elsewhere
    const S = P[fromI], B = this.container(toC);
    if (!S || !B || B[toI] || toC === 'equip') return false;
    B[toI] = S.id;
    if (--S.n <= 0) P[fromI] = null;
    if (toC === 'vault') this.persist();
    return true;
  }
  drinkPot(k) {                                            // the potion hotkeys
    const S = this.pots()[k];
    if (!S) { this.toast('That potion slot is empty.'); return; }
    this.useNow('pots', k);
  }
  lootAll() {
    const b = this.nearBag, p = this.player;
    if (!b || this.nearVault) return;
    let n = 0;
    for (let i = 0; i < 8; i++) {
      if (!b.items[i]) continue;
      const f = p.inv.indexOf(null);
      if (f < 0) { this.toast('Your backpack is full.'); break; }
      p.inv[f] = b.items[i]; b.items[i] = null; n++;
    }
    if (n) { this.sfx('loot'); this.cleanBags(); this.events.push({ type: 'ground' }); }
  }
  dropOnGround(cont, i) {
    const C = this.container(cont === 'ground' && this.nearVault ? 'vault' : cont);
    if (!C || !C[i] || cont === 'ground') return false;
    const bag = this.nearBag && this.nearBag.items.includes(null) ? this.nearBag : this.dropBag();
    bag.items[bag.items.indexOf(null)] = C[i];
    C[i] = null;
    this.clampVitals();
    this.cleanBags();
    this.nearBag = bag;
    this.events.push({ type: 'ground' });
    if (cont === 'vault') this.persist();
    return true;
  }
  dropBag() {
    const bag = { x: this.player.x, y: this.player.y + 0.3, items: Array(8).fill(null), kind: 'brown', life: 90, until: this.t + 90 };
    this.bags.push(bag);
    this.nearBag = bag;
    return bag;
  }
  cleanBags() {
    this.bags = this.map.bags = this.bags.filter((b) => b.items.some(Boolean));
    if (this.nearBag && !this.bags.includes(this.nearBag)) this.nearBag = null;
  }
  // double-click / number key behaviour
  useSlot(cont, i) {
    const C = this.container(cont === 'ground' && this.nearVault ? 'vault' : cont);
    const id = C && C[i];
    if (!id) return;
    const it = ITEMS[id], p = this.player;
    if (cont === 'ground') {
      const free = p.inv.indexOf(null);
      if (free >= 0) { this.moveItem('ground', i, 'inv', free); return; }
      if (it.slot !== 'consumable') { this.toast('Your backpack is full.'); return; }
    }
    return this.useNow(cont, i);
  }
  // use an item where it sits: drink a potion, or equip/unequip gear (right-click does this directly)
  useNow(cont, i) {
    if (cont === 'pots') {
      const S = this.pots()[i];
      if (!S) return;
      const one = [S.id];
      this.useIn(one, 0);
      if (!one[0] && --S.n <= 0) this.pots()[i] = null;    // drank one
      return;
    }
    return this.useIn(this.container(cont === 'ground' && this.nearVault ? 'vault' : cont), i, cont);
  }
  useIn(C, i, cont) {
    const id = C && C[i];
    if (!id) return;
    const it = ITEMS[id], p = this.player;
    if (it.slot === 'consumable') {
      if (it.use.backpack) {
        if (p.inv.length >= 16) { this.toast('This character already carries a second backpack.'); return; }
        C[i] = null;
        p.inv.push(...Array(16 - p.inv.length).fill(null));
        this.banner('Backpack expanded: 16 slots!', 2200);
        this.sfx('rare'); this.cleanBags(); this.events.push({ type: 'ground' }); this.persist();
        return;
      }
      if (it.use.junk) { this.toast('It is a boot. You cannot use a boot.'); return; }
      if (it.use.key) {                                    // a dungeon key: the portal opens right here
        if (this.map.kind === 'dungeon') { this.toast('You cannot open a portal from inside a dungeon.'); return; }
        if (this.map.kind === 'vault') { this.toast('Use keys in the Nexus or the Realm.'); return; }
        C[i] = null;
        const a = R() * TAU;
        this.openPortal(it.use.key, this.player.x + Math.cos(a) * 1.6, this.player.y + Math.sin(a) * 1.6, 120);
        this.banner(`The ${it.name} turns. ${DUNGEONS[it.use.key].name} opens for you.`, 2800);
        this.vx({ k: 'burst', ...liftO(this.player.x, this.player.y, 0.6), n: 30, colors: ['#3befff', '#ffffff', '#ffd650'] });
        this.sfx('portal'); this.cleanBags(); this.events.push({ type: 'ground' }); this.persist();
        return;
      }
      if (it.use.egg) {                                    // a pet egg: it hatches in your hands
        if (!this.hatch(it.use.egg, it.use.family)) return;
        C[i] = null;
        this.cleanBags(); this.events.push({ type: 'ground' }); this.persist();
        return;
      }
      if (it.use.vault) {                                  // a vault chest: the vault grows by another row
        const V = this.save.vaults[0];
        if (V.length >= VAULT_MAX) { this.toast(`Your vault is as big as it gets (${VAULT_MAX} slots).`); return; }
        C[i] = null;
        V.push(...Array(Math.min(it.use.vault, VAULT_MAX - V.length)).fill(null));
        this.banner(`Your vault grows: ${V.length} slots!`, 2400);
        this.sfx('rare'); this.cleanBags(); this.events.push({ type: 'ground' }); this.persist();
        return;
      }
      if (it.use.carp) {
        for (const st of STATS) p.base[st] = Math.min(CLASSES[p.cls].max[st], p.base[st] + (st === 'hp' || st === 'mp' ? 5 : 1));
        this.banner('You eat the Golden Carp. You feel MAGNIFICENT.', 2600);
      }
      if (it.use.mystery) {
        const roll = R(), give = (ids) => { this.addBag(p.x, p.y + 0.5, ids); };
        if (roll < 0.4) { this.toast('Inside: something useful!'); give(rollLoot([{ slot: 'weapon', tiers: [4, 9], p: 1 }, { slot: 'armor', tiers: [4, 10], p: 0.5 }])); }
        else if (roll < 0.6) { this.toast('Inside: a smaller box.'); give(['mystery_box']); }
        else if (roll < 0.8) { this.toast('Inside: gold! Lots of gold!'); this.save.gold += 400; }
        else if (roll < 0.97) { this.toast('Inside: angry bees. (They are crabs.)'); for (let k = 0; k < 3; k++) this.addEnemy('brine_slimelet', p.x + Math.cos(k * 2) * 2, p.y + Math.sin(k * 2) * 2); }
        else { this.toast('Inside: a relic!'); give([R.pick(Object.values(ITEMS).filter((x) => x.ut && !x.mythic && !x.admin && x.slot !== 'consumable').map((x) => x.id))]); }
      }
      if (it.use.heal) p.hp = Math.min(this.stat('hp'), p.hp + it.use.heal);
      if (it.use.regen) { p.regenRate = it.use.regen.hp / it.use.regen.t; p.regenUntil = this.t + it.use.regen.t; this.vx({ k: 'hearts', x: p.x, y: p.y }); }
      if (it.use.mana) p.mp = Math.min(this.stat('mp'), p.mp + it.use.mana);
      if (it.use.stat) {
        const s = it.use.stat, cap = CLASSES[p.cls].max[s];
        if (p.base[s] >= cap) { this.toast(`${s.toUpperCase()} is already maxed.`); return; }
        p.base[s] = Math.min(cap, p.base[s] + (s === 'hp' || s === 'mp' ? 5 : 1));
        this.float(...lift(p.x, p.y, 1.2), `+${s.toUpperCase()}`, '#f2c14e');
      }
      C[i] = null;
      this.cleanBags();
      this.sfx('drink');
      return;
    }
    if (cont === 'equip') {                                   // unequip to backpack
      const free = p.inv.indexOf(null);
      if (free >= 0) this.moveItem('equip', i, 'inv', free);
      return;
    }
    const slot = SLOT_ORDER.indexOf(TYPE_SLOT[it.type]);
    if (slot >= 0 && canEquip(p.cls, it)) this.moveItem(cont, i, 'equip', slot);
    else if (cont === 'ground') {
      const free = p.inv.indexOf(null);
      if (free >= 0) this.moveItem('ground', i, 'inv', free);
    } else this.toast('Your class can\'t use that.');
  }
  clampVitals() {
    const p = this.player;
    p.hp = Math.min(p.hp, this.stat('hp'));
    p.mp = Math.min(p.mp, this.stat('mp'));
  }
  toast(text) { this.events.push({ type: 'toast', text }); }
  // floating text: numbers and words that belong to someone ride above their head, not over their body
  float(x, y, text, color) {
    if (typeof text === 'number' || /^[-+]?\d*\.\d+$/.test(text) || /^[-+]?\d+\.\d+$/.test(text)) text = (/^[-+]/.test(String(text)) ? String(text)[0] : '') + Math.round(Math.abs(parseFloat(text)));   // whole numbers only
    const who = this.floatOwner(x, y), n = who ? this.floaters.filter((f) => f.who === who && f.t < 0.3).length : 0;
    this.floaters.push({ x, y, text, color, t: 0, who, dx: who ? [0, -0.6, 0.6, -0.3, 0.3][n % 5] : 0 });   // (spread wider: numbers that land together stay apart)
  }
  floatOwner(x, y) {
    let best = null, bd = 1e9;
    const test = (e, up, reach) => { const d = Math.hypot(e.x - x, e.y - up - y); if (d < reach && d < bd) { bd = d; best = e; } };
    const p = this.player;
    if (p && !p.dead) test(p, 0.7, 1.6);
    for (const e of this.active || []) if (!e.dead) test(e, e.hitUp || 0.6, e.rb ? 3.2 : 1.6);
    if (this.boss && this.boss.state !== 'dead') test(this.boss, 2.3, 3.5);
    return best;
  }

  // ------------------------------------------------------------- spawning
  populateRealm() {
    const m = this.map;
    m.populated = true;
    const r = rng(m.seed ^ 77);
    for (const b of BIOMES) for (let k = 0; k < parentTarget(m, b); k++) this.spawnParentGroup(b, r, m.spawn, 18);
    for (let k = 0; k < 4; k++) this.spawnGroup('godfall', r, m.spawn, 18, 'censer_magistrate');
    for (const [b, list] of Object.entries(PACKS)) for (const [id, n] of list) for (let k = 0; k < Math.round(n * 1.5); k++) this.spawnPack(b, id, r);
    this.rfMaintain({}, r);
    for (const c of m.camps || []) {                    // each camp: an evolved leader and its band, guarding the chest
      const chest = m.objects.find((o) => o.interact === 'chest' && Math.abs(o.x - c.x) < 0.1 && Math.abs(o.y - c.y) < 0.1);
      const lead = this.addEnemy(r.pick(GROUPS[c.biome]), c.x + 1.5, c.y + 1.5);
      lead.kids = []; lead.childT = lead.D.every;
      for (let k = 0; k < 4; k++) this.spawnChild(lead, r);
      if (chest) chest.guards = [lead, ...lead.kids];
    }
    for (const c of m.firecamps || []) for (const id of FIRECAMP_BANDS[c.biome] || []) {   // a band sits round each campfire
      const a = r() * TAU, x = c.x + Math.cos(a) * 2.2, y = c.y + Math.sin(a) * 2.2;
      if (!isSolid(m, x, y)) this.addEnemy(id, x, y).pack = id;
    }
    for (const b of BIOMES) for (let k = 0; k < Math.max(1, Math.round(parentTarget(m, b) / 18)); k++) this.spawnElite(b, r, m.spawn, true);   // the elites, each with its escort
    m.ev = Object.fromEntries(BIOMES.map((b) => [b, { herald: null, progress: 0, cd: 25 + r() * 35 }]));
  }
  // spread groups out: of a handful of candidate spots, take the one farthest from every other group
  spreadSpot(biome, r, avoid, minD, tries = 8) {
    const others = this.enemies.filter((e) => !e.dead && (e.kids || e.pack || e.rb));
    let best = null, bd = -1;
    for (let k = 0; k < tries; k++) {
      const at = randomTileInBiome(this.map, BIOMES.indexOf(biome), r, avoid, minD);
      if (!at) continue;
      let near = 1e9;
      for (const e of others) { const d = (e.x - at.x) ** 2 + (e.y - at.y) ** 2; if (d < near) near = d; }
      if (near > bd) { bd = near; best = at; }
      if (near > 400) break;                              // already 20+ tiles from anyone: good enough
    }
    return best;
  }
  spawnParentGroup(biome, r, avoid, minD) {
    const at = this.spreadSpot(biome, r, avoid, minD);
    if (!at) return null;
    const parent = this.addEnemy(r.pick(GROUPS[biome]), at.x, at.y);
    parent.kids = []; parent.childT = parent.D.every;
    const n = r.int(3, parent.D.cap - 1);
    for (let k = 0; k < n; k++) this.spawnChild(parent, r);
    return parent;
  }
  spawnPack(biome, id, r = R) {
    const at = this.spreadSpot(biome, r, this.player || this.map.spawn, 16, 5);
    if (!at) return;
    const n = r.int(2, 4);
    for (let k = 0; k < n; k++) {
      const x = at.x + (r() - 0.5) * 3, y = at.y + (r() - 0.5) * 3;
      if (!isSolid(this.map, x, y)) this.addEnemy(id, x, y).pack = id;
    }
  }
  spawnChild(parent, r = R) {
    const a = r() * TAU, d = 1.2 + r() * 2.5;
    const x = parent.x + Math.cos(a) * d, y = parent.y + Math.sin(a) * d;
    if (isSolid(this.map, x, y)) return null;
    const kid = this.addEnemy(r.pick(parent.D.children), x, y);
    kid.parent = parent;
    parent.kids.push(kid);
    return kid;
  }
  spawnGroup(biome, r, avoid, minD, only) {
    const bi = BIOMES.indexOf(biome);
    const at = randomTileInBiome(this.map, bi, r, avoid, minD);
    if (!at) return 1;
    const [id, a, b] = only ? [only, 1, 1] : r.pick(BIOME_SPAWNS[biome]);
    const n = r.int(a, b);
    for (let k = 0; k < n; k++) {
      const x = at.x + (r() - 0.5) * 3, y = at.y + (r() - 0.5) * 3;
      if (!isSolid(this.map, x, y)) this.addEnemy(id, x, y);
    }
    return n;
  }
  addEnemy(id, x, y) {
    const D = ENEMIES[id];
    const e = { id, D, x, y, hx: x, hy: y, hp: D.hp, maxHp: D.hp, state: 'move', st: 0, cds: D.attacks.map(() => 0.5 + R() * 1.5),
      atk: -1, wx: x, wy: y, wt: 0, hurtT: 0, deadT: 0, queue: [], seen: false, phase: R() * TAU, born: this.t };
    this.enemies.push(e);
    return e;
  }
  populateDungeon(def) {
    const m = this.map;
    const r = rng(m.w * 7 + 1);
    const buff = (e) => { e.hp = e.maxHp = Math.round(e.hp * def.mobHp); return e; };
    const spot = (rm) => {                                // a free floor tile inside a room
      for (let j = 0; j < 30; j++) {
        const x = rm.x + 1.5 + r() * (rm.w - 3), y = rm.y + 1.5 + r() * (rm.h - 3);
        if (!isSolid(m, x, y) && m.tiles[Math.floor(y) * m.w + Math.floor(x)] !== TID.lava && m.tiles[Math.floor(y) * m.w + Math.floor(x)] !== TID.emberlava) return [x, y];
      }
      return [rm.cx, rm.cy];
    };
    const fill = (rm, n, elite) => {
      const list = [];
      for (let k = 0; k < n; k++) list.push([r.pick(def.mobs), ...spot(rm)]);
      if (def.elites.length && elite) list.push([r.pick(def.elites), ...spot(rm), true]);
      return list;
    };
    const spawn = (list) => list.forEach(([id, x, y, elite]) => {
      const e = buff(this.addEnemy(id, x, y));
      if (elite) { e.elite = true; e.hp = e.maxHp = Math.round(e.maxHp * 2.4); }
      if (e.D.children) { e.kids = []; e.childT = e.D.every * 1.5; }
    });
    const bossHp = def.boss === 'unstruck' ? BOSS.hp : BX[def.boss] ? BX[def.boss].hp : DUNGEON_BOSSES[def.boss].hp;
    const maxDep = Math.max(1, ...m.rooms.map((q) => q.dep || 0));
    // a WARDEN: one of the dungeon's champions, swollen with the seal it guards. Slow to kill, brutal to stand near.
    const warden = (rm) => {
      const e = buff(this.addEnemy(r.pick(def.wardens || def.elites), rm.cx + 0.5, rm.cy + 0.5)), D = e.D;
      // twice the size of its kind (see render), with the hitbox to match, and far tougher
      e.D = { ...D, name: `${D.name}, Warden of the Seal`, def: (D.def || 0) + 18, aggro: Math.max(D.aggro || 9, 13), xp: D.xp * 6, r: (D.r || 0.5) * (D.sheet === 'champions' ? 1.5 : 2),
        contact: Math.round((D.contact || 40) * 2),
        attacks: D.attacks.map((A) => ({ ...A, dmg: Math.round(A.dmg * 2.2), cd: (A.cd || 2) * 0.5, tell: Math.max(250, (A.tell || 400) * 0.8), count: A.count ? A.count + 3 : A.count, waves: (A.waves || 1) + 1 })) };
      e.hp = e.maxHp = Math.round(Math.min(bossHp * 0.35, Math.max(e.maxHp * 6, bossHp * 0.18)));
      e.elite = true; e.warden = true; e.seen = true;
      this.unstick(e, 0.6);                                // never spawn a warden inside a pillar or a wall
      (m.wardens = m.wardens || []).push(e);
      if (D.children) { e.kids = []; e.childT = D.every; }
    };
    m.rooms.slice(1, -1).forEach((rm) => {
      const big = Math.floor(rm.w * rm.h / 110);
      if (rm.role === 'puzzle' || rm.role === 'altar' || rm.role === 'rest') return;          // quiet rooms: the danger here is of another kind
      if (def.compose) {                                                // a dungeon that says who stands where
        const list = def.compose(rm, r, (rm.dep || 0) / maxDep).map((id) => [id, ...spot(rm)]);
        if (rm.ambush) rm.pending = list; else spawn(list);
        return;
      }
      if (rm.role === 'warden') { spawn(fill(rm, r.int(2, 4), false)); warden(rm); return; }
      if (rm.role === 'treasure') { spawn(fill(rm, r.int(2, 3), true)); return; }
      const list = rm.few ? fill(rm, r.int(1, 3), false) : fill(rm, r.int(3, 5) + big, r.chance(rm.role === 'lever' ? 0.8 : 0.5));
      if (rm.ambush) rm.pending = list;                   // ambush rooms wait for you
      else spawn(list);
    });
    if (def.extraSpawns) spawn(def.extraSpawns(m));                   // things a dungeon places itself (Mirerot's lashers)
    this.spawnPending = spawn; this.dungeonFill = fill;
    const br = m.rooms[m.rooms.length - 1];
    if (def.boss === 'unstruck') {
      this.boss = { x: br.cx + 0.5, y: br.cy + 0.5, hp: BOSS.hp, maxHp: BOSS.hp, state: 'sleep', st: 0, phase: 1,
        cycle: 0, room: br, deadT: 0, hurtT: 0, fireT: 0, spin: 0 };
    } else if (BX[def.boss]) {                         // a Realm Update boss: it waits at the far side of its arena
      const b = this.spawnRealmBoss(def.boss, { x: br.cx + 0.5, y: BX[def.boss].spawnCentre ? br.cy + 0.5 : br.y + 11 }, bxEnemyDef(def.boss));
      b.state = 'sleep'; b.room = br;
    } else {
      const b = this.spawnRealmBoss(def.boss, { x: br.cx + 0.5, y: br.cy - 1 }, DUNGEON_BOSSES[def.boss]);
      b.state = 'sleep'; b.room = br;
    }
  }
  maintainRealm(dt) {
    this.respawnT = (this.respawnT || 0) - dt;
    if (this.respawnT > 0) return;
    this.respawnT = 4;
    // realm repopulation, roughly the old-school MMO cadence: a new group every few seconds per thin biome
    this.respawnT = 3;
    const parents = Object.fromEntries(BIOMES.map((b) => [b, 0]));
    for (const e of this.enemies) if (!e.dead && e.kids && parents[e.D.biome] !== undefined) parents[e.D.biome]++;
    for (const b of BIOMES) if (parents[b] < parentTarget(this.map, b)) this.spawnParentGroup(b, R, this.player, 18);
    this.maintainElites();
    const packs = {};
    for (const e of this.enemies) if (!e.dead && e.pack) packs[e.pack] = (packs[e.pack] || 0) + 1;
    for (const [b, list] of Object.entries(PACKS)) for (const [id, n] of list) if ((packs[id] || 0) < n * 1.5 * 2) this.spawnPack(b, id);
    this.rfMaintain(packs);                                     // the Realmforge portal droppers (src/rf/host.js)
  }
  // ---- mini-events: heralds. Three heralds in a biome summon that biome's realm boss.
  eventClock(dt) {
    const m = this.map;
    if (!m.ev) m.ev = Object.fromEntries(BIOMES.map((b) => [b, { herald: null, progress: 0, cd: 25 + R() * 35 }]));
    for (const b of BIOMES) {
      const ev = m.ev[b];
      if (!HERALDS[b]) continue;
      const bossUp = this.enemies.some((e) => e.rb && !e.dead && e.D.biome === b);
      if (bossUp || (ev.herald && !ev.herald.dead)) continue;
      ev.cd -= dt;
      if (ev.cd <= 0) this.startEvent(b);
    }
  }
  startEvent(b, at) {
    const ev = this.map.ev[b];
    const pos = at || randomTileInBiome(this.map, BIOMES.indexOf(b), R, this.player, 20);
    if (!pos) return null;
    const h = this.addEnemy(HERALDS[b], pos.x, pos.y);
    h.herald = true;
    for (const [id, n] of h.D.escort) {
      for (let k = 0; k < n; k++) {
        const a = R() * TAU, x = pos.x + Math.cos(a) * 2, y = pos.y + Math.sin(a) * 2;
        if (!isSolid(this.map, x, y)) { const g = this.addEnemy(id, x, y); g.parent = h; }
      }
    }
    ev.herald = h; ev.cd = 0;
    this.banner(`${h.D.name} appears in ${BIOME_LABEL[b]}! (${ev.progress}/${EVENTS_TO_BOSS})`, 3000);
    return h;
  }
  heraldDown(e) {
    const b = e.D.biome, ev = this.map.ev && this.map.ev[b];
    if (!ev) return;
    ev.herald = null;
    ev.progress++;
    ev.cd = 35 + R() * 35;
    const boss = REALM_BOSSES[BIOME_BOSS[b]];
    if (ev.progress >= EVENTS_TO_BOSS) {
      ev.progress = 0;
      this.banner(`The last herald falls... ${boss.name} answers!`, 3200);
      this.spawnRealmBoss(BIOME_BOSS[b], { x: e.x, y: e.y - 3 });
    } else {
      this.banner(`${e.D.name} is silenced. ${boss.name} stirs (${ev.progress}/${EVENTS_TO_BOSS})`, 3000);
    }
  }
  spawnRealmBoss(id, at, def) {
    const D = def || REALM_BOSSES[id];
    const pos = at || randomTileInBiome(this.map, BIOMES.indexOf(D.biome), R, this.player, 22);
    if (!pos) return null;
    const e = { id, rb: true, D: { ...D, aggro: 16, attacks: [] }, x: pos.x, y: pos.y, hx: pos.x, hy: pos.y,
      hp: D.hp, maxHp: D.hp, state: 'idle', st: 1.5, queue: [], spin: 0, invulnT: 0, spiral: null, stream: null,
      phaseIdx: 0, cycleIdx: 0, deadT: 0, hurtT: 0, wx: pos.x, wy: pos.y, wt: 0, phase: R() * TAU, cds: [] };
    this.enemies.push(e);
    if (!def) { this.banner(`${D.name} has risen in ${BIOME_LABEL[D.biome]}!`, 3200); this.sfx('boss'); }
    return e;
  }

  // ------------------------------------------------------------- speech: monsters talk, sometimes
  speak(e, kind, chance = 1) {
    if (!e || e.dead && kind !== 'die') return;
    if (R() > chance || (e.sayT && this.t < e.sayT)) return;
    if (this.bubbles.filter((b) => this.t - b.t0 < 2.4).length >= 3) return;
    let lines;
    if (e.rb || e === this.boss) lines = BOSS_SPEECH[e === this.boss ? 'unstruck' : e.id];
    else if (e.herald && kind === 'see') lines = HERALD_SPEECH;
    else lines = (SPEECH[e.id] || {})[kind] || (BIOME_SPEECH[e.D && e.D.biome] || {})[kind];
    if (!lines || !lines.length) return;
    e.sayT = this.t + 6;
    this.bubble(e, R.pick(lines), e.rb || e === this.boss ? '#ffd650' : '#ffffff');
  }
  bubble(e, text, col = '#ffffff') {
    this.bubbles.push({ e, x: e.x, y: e.y, text, t0: this.t, col, big: !!(e.rb || e === this.boss) });
    if (this.bubbles.length > 12) this.bubbles.shift();
  }
  // ------------------------------------------------------------- update
  update(dt) {
    if (this.mode !== 'play') return;
    this.t += dt;
    this.frameN = (this.frameN || 0) + 1;
    const p = this.player;
    if (this.camTarget !== null) {                    // glide to the requested angle instead of jumping
      const d = this.camTarget - this.camAngle;
      this.camAngle = Math.abs(d) < 0.01 ? this.camTarget : this.camAngle + d * Math.min(1, dt * 10);
      if (this.camAngle === this.camTarget) { this.camAngle %= Math.PI * 2; this.camTarget = null; }
    }
    if (p.dead) {
      p.deadT += dt;
      if (p.deadT > 1.6 && !this.deathShown) { this.deathShown = true; this.events.push({ type: 'death' }); }
      this.updateProjectiles(dt);
      return;
    }
    this.updatePlayer(dt);
    this.updatePet(dt);
    this.updateHatch(dt);
    this.spUpdate(dt);                                   // boss set pieces (src/setpieces.js)
    this.updateEnemies(dt);
    if (this.boss) this.updateBoss(dt);
    this.updateAllies(dt);
    this.updateBossFx(dt);
    this.updateDecoys(dt);
    this.updateTimeStop(dt);
    this.updateProjectiles(dt);
    this.updateWorld(dt);
    if (this.map.kind === 'realm') { this.maintainRealm(dt); this.eventClock(dt); this.melonTick(dt); this.eventBossTick(dt); }
    this.updateEliteAuras(dt);
    if (this.map.rf) this.rfUpdate(dt);
    else if (this.map.rfBoss) this.rfBossUpdate(dt);
    else if (this.map.kind === 'dungeon') { this.updateDungeon(dt); this.updatePuzzles(dt); this.updateTraps(dt); this.updateD4(dt); if (this.map.def && this.map.def.style === 'frostveil') this.updateFrostveil(dt); if (this.map.def && this.map.def.style === 'mirerot') this.updateMirerot(dt); if (this.map.def && this.map.def.style === 'astral') this.updateAstral(dt); if (this.map.def && this.map.def.style === 'sandscour') this.updateSandscour(dt); if (this.map.def && this.map.def.style === 'keep') this.updateKeep(dt); if (this.map.def && this.map.def.style === 'hollowmoon') this.updateHollowmoon(dt); if (this.map.def && this.map.def.style === 'ember') this.updateEmber(dt); }
    { const m = this.map; if (m.fvTimers) { for (const T of m.fvTimers) if ((T.t -= dt) <= 0 && !T.done) { T.done = true; T.fn(); } m.fvTimers = m.fvTimers.filter((T) => !T.done); } }   // later(): any map's delayed events
    this.updateChill(dt); this.updatePoison(dt);
    if (this.map.kind !== 'nexus') this.openChests();
    this.saveT = (this.saveT || 0) + dt;
    if (this.saveT > 15) { this.saveT = 0; this.persist(); }
  }

  // uncover the fog around you: a disc of tiles, revealed once and remembered for this map
  reveal() {
    const m = this.map, p = this.player;
    if (!m.seen) return;
    const tx = Math.floor(p.x), ty = Math.floor(p.y), key = ty * m.w + tx;
    if (this.fogAt === key) return;
    this.fogAt = key;
    const R = m.kind === 'dungeon' ? 11 : 16, R2 = R * R;
    for (let y = Math.max(0, ty - R); y <= Math.min(m.h - 1, ty + R); y++) {
      for (let x = Math.max(0, tx - R); x <= Math.min(m.w - 1, tx + R); x++) {
        const i = y * m.w + x;
        if (m.seen[i] || (x - tx) ** 2 + (y - ty) ** 2 > R2) continue;
        m.seen[i] = 1; m.fogNew.push(i);
      }
    }
  }
  seen(x, y) {                                           // false only for tiles still under the fog
    const m = this.map;
    if (!m.seen) return true;
    const xi = Math.floor(x), yi = Math.floor(y);
    return xi >= 0 && yi >= 0 && xi < m.w && yi < m.h && m.seen[yi * m.w + xi] === 1;
  }
  updatePlayer(dt) {
    this.reveal();
    const p = this.player, I = this.input;
    for (const k in p.status) p.status[k] = Math.max(0, p.status[k] - dt);
    p.hitT = Math.max(0, p.hitT - dt);
    if (p.danceT > 0) p.danceT -= dt;
    p.abilityT = Math.max(0, p.abilityT - dt);
    if (!p.dash && (this.frameN || 0) % 6 === 0) this.unstick(p);          // never stuck inside a wall or a prop
    if (p.ward > 0 && (p.wardT -= dt) <= 0) p.ward = 0;            // the rune ward fades after a few seconds
    // movement
    let mx = I.right - I.left, my = I.down - I.up;
    if (this.invertUntil > this.t) { mx = -mx; my = -my; }           // the Sleeper's dream-logic
    if (p.status.asleep > 0) { mx = 0; my = 0; }                     // fallen asleep where you stood
    if (p.frozenUntil > this.t) { mx = 0; my = 0; }                  // frozen solid (Frostveil's chill)
    const len = Math.hypot(mx, my);
    p.moving = len > 0;
    const cs = Math.cos(this.camAngle), sn = Math.sin(this.camAngle);
    // terrain underfoot: shallows and bog drag at you, ice keeps you sliding
    const under = this.map.tiles[Math.floor(p.y) * this.map.w + Math.floor(p.x)];
    if (under === TID.hmspin) { const t = mx; mx = -my; my = t; }   // a spin tile: up becomes right
    const drag = this.rfu().washirobe ? 1 : under === TID.bog || under === TID.fvwater ? 0.6 : under === TID.quicksand ? 0.55 : under === TID.ckblood ? 0.7 : under === TID.shallows ? 0.8 : 1;
    const bless = p.status.bless > 0 ? p.blessKind : null;
    if (len) { mx /= len; my /= len; }
    const sp = moveSpeed(this.stat('spd')) * drag * (bless === 'shore' ? 1.25 : 1) * (this.map.kind === 'dungeon' ? this.d4Speed() * (this.map.rf ? p.rfSlow || 1 : 1) : 1) * (p.dragUntil > this.t ? p.dragF : 1) * this.chillSlow();
    // keys are screen directions: rotate them into the world
    const wx = len ? (mx * cs + my * sn) * sp : 0, wy = len ? (-mx * sn + my * cs) * sp : 0;
    p.vel = p.vel || { x: 0, y: 0 };
    const icy = under === TID.ice || under === TID.fvice;
    const grip = icy ? Math.min(1, 2.4 * dt) : 1;
    p.vel.x += (wx - p.vel.x) * grip; p.vel.y += (wy - p.vel.y) * grip;
    if (p.gust) {                                                    // a gust (Glacius' wing beat): it pushes; on ice, you keep going
      if (this.t < p.gust.until) this.moveCircle(p, p.gust.vx * dt, p.gust.vy * dt, PLAYER_R);
      else { if (icy) { p.vel.x += p.gust.vx * 0.7; p.vel.y += p.gust.vy * 0.7; } p.gust = null; }
    }
    if (this.map.rfBoss) { p.rfMove = len && sp ? [wx / sp, wy / sp] : [0, 0]; p.rfSpd = sp; }   // a Realmforge arena moves you itself (src/rf/boss.js)
    else if (Math.abs(p.vel.x) + Math.abs(p.vel.y) > 0.01) this.moveCircle(p, p.vel.x * dt, p.vel.y * dt, PLAYER_R);
    if (len) {
      p.stepT = (p.stepT || 0) - dt;
      if (p.stepT <= 0) { p.stepT = 0.16; this.vx({ k: 'dust', x: p.x, y: p.y, splash: under === TID.shallows || under === TID.bog || under === TID.fvwater, ice: icy }); }
    }
    if (bless === 'fen') p.hp = Math.min(this.stat('hp'), p.hp + 25 * dt);
    if (p.regenUntil > this.t) p.hp = Math.min(this.stat('hp'), p.hp + p.regenRate * dt);          // a watermelon slice, mending slowly
    // facing (screen space): aim while shooting, movement otherwise
    const firing = I.fire || I.auto;
    let ax = mx, ay = my;
    if (firing) { const dx = I.aimX - p.x, dy = I.aimY - p.y; ax = dx * cs - dy * sn; ay = dx * sn + dy * cs; }
    if (Math.abs(ax) + Math.abs(ay) > 0.01) {
      p.dir = Math.abs(ax) > Math.abs(ay) ? (ax > 0 ? 'right' : 'left') : (ay > 0 ? 'front' : 'back');
    }
    // regen
    p.hp = Math.min(this.stat('hp'), p.hp + hpRegen(this.stat('vit')) * dt);
    p.mp = Math.min(this.stat('mp'), p.mp + mpRegen(this.stat('wis')) * dt);
    // lava
    const ti = this.map.tiles[Math.floor(p.y) * this.map.w + Math.floor(p.x)];
    if (ti === TID.lava || ti === TID.emberlava) { p.lavaT -= dt; if (p.lavaT <= 0) { p.lavaT = 0.25; this.hurtPlayer(14, 'molten floor', true); } }
    else if (ti === TID.rift) { p.lavaT -= dt; if (p.lavaT <= 0) { p.lavaT = 0.5; this.hurtPlayer(6, 'a godland rift', true); } }   // the godlands' ground itself bites
    // shooting
    p.fireCd -= dt;
    const W = this.weapon();
    if (firing && W && p.fireCd <= 0 && !(p.status.asleep > 0) && !(p.frozenUntil > this.t)) {
      const rate = W.rate * fireRate(this.stat('dex')) * (p.status.berserk ? 1.5 : 1) * this.chillSlow();
      p.fireCd = 1 / rate;
      p.lastShot = this.t;
      p.shotPeriod = 1 / rate;
      const [ox, oy] = this.up(p.x, p.y, 0.5);
      const a = angleTo(ox, oy, I.aimX, I.aimY);
      const mult = dmgMult(this.stat('att')) * (p.status.berserk ? 1.25 : 1);
      this.vx({ k: 'muzzle', x: ox + Math.cos(a) * 0.5, y: oy + Math.sin(a) * 0.5, proj: W.proj });
      this.sfx('shoot', p.cls);
      const sp = W.special || null;
      const cnt = sp && sp.mech && this.mechVolley(W, sp, ox, oy, a, mult) ? 0 : W.count || 1;   // a reworked weapon fires its own volley (src/weaponmech.js); one that names no count fires one shot
      const vol = [];
      for (let k = 0; k < cnt; k++) {
        const off = cnt > 1 ? (k / (cnt - 1) - 0.5) * (W.arc || 0) : 0;
        const dmg = Math.round((W.dmg[0] + R() * (W.dmg[1] - W.dmg[0])) * mult);
        const b = this.shoot('p', ox, oy, a + off, W.speed, W.range, dmg, W.proj, W.size, W.pierce);
        if (sp) { b.sp = sp; b.speed = W.speed; b.max = b.life; }
        if (sp && sp.accel) { b.range = W.range; b.dist = 0; b.life = 4; b.max = 4; }
        if (sp && sp.weave) { b.wa = a + off; b.ws = k % 2 ? -1 : 1; b.wt = 0; if (sp.weave.lam) b.wf = (2 * Math.PI * W.speed) / sp.weave.lam; }   // a pair weaves around each other
        if (W.rfSpread && cnt > 1) { const lat = (k - (cnt - 1) / 2) * W.rfSpread; b.x += Math.cos(a + Math.PI / 2) * lat; b.y += Math.sin(a + Math.PI / 2) * lat; }   // side by side (a Realmforge spread)
        if (W.trail) b.dust = W.trail;                       // a Realmforge shot's trail of dust
        vol.push(b);
      }
      this.rfOnVolley(vol, a, ox, oy, mult, W);           // Realmforge uniques: counted volleys, extra shots (src/rf/uniqmech.js)
      if (sp && sp.starfall && (p.volleys = (p.volleys || 0) + 1) % sp.starfall.every === 0) {
        const d = Math.min(9, dist(p.x, p.y, I.aimX, I.aimY));
        this.fx.push({ kind: 'star', x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, t: 0, life: 0.9, delay: 0.55,
          r: sp.starfall.r, dmg: Math.round(sp.starfall.dmg * mult), done: false });
      }
    }
    this.updatePassives(dt);
  }
  // armour / ring effects that tick every frame
  updatePassives(dt) {
    const p = this.player, P = this.passive();
    this.updateOrbs(dt);
    this.mechTick(dt);                                   // the reworked weapons' timed blows (src/weaponmech.js)
    this.haloTick(dt);
    this.sigilTick(dt);                                  // the ability sigils' queued beats (src/sigils.js)
    this.mythTick(dt);                                   // the Mythic abilities (src/mythics.js)
    this.gearTick(dt); this.rfTick(dt);                                   // armour and ring mechanics (src/gearmech.js)                                   // the special Halos' shapes (src/halos.js)                                 // whatever circles you (src/orbiters.js)
    if (P.lowregen && p.hp < this.stat('hp') * 0.35) p.hp = Math.min(this.stat('hp'), p.hp + P.lowregen * dt);
    if (P.aegis && !p.aegisUp) { p.aegisT = (p.aegisT || 0) - dt; if (p.aegisT <= 0) p.aegisUp = true; }
    if (P.cheatdeath) p.cheatT = Math.max(0, (p.cheatT || 0) - dt);
    if (P.aura) {
      p.auraT = (p.auraT || 0) - dt;
      if (p.auraT <= 0) {
        p.auraT = 0.5;
        for (const e of this.enemiesIn(p.x, p.y, P.aura.r)) {
          if (P.aura.dps) this.damageEnemy(e, Math.round(P.aura.dps * 0.5), ...lift(e.x, e.y, 0.5), true);
          if (P.aura.slow && e !== this.boss) { e.slowT = 0.7; e.slowF = Math.max(e.slowF || 0, P.aura.slow); }
        }
        if (P.aura.dps) this.vx({ k: 'aura', x: p.x, y: p.y, r: P.aura.r, cold: !!P.aura.slow });
      }
    }
    if (P.prism) {
      p.prismT = (p.prismT || P.prism.every) - dt;
      if (p.prismT <= 0) {
        p.prismT = P.prism.every;
        const [ox, oy] = this.up(p.x, p.y, 0.5), mult = dmgMult(this.stat('att'));
        for (let k = 0; k < P.prism.n; k++) this.shoot('p', ox, oy, (k / P.prism.n) * TAU + this.t, 9, 6, Math.round(P.prism.dmg * mult), P.prism.proj, 0.4, true);
      }
    }
  }
  // an ability's signature: one of six shapes, drawn with the item's own shot
  abilitySig(S, mult, aim, tgt) {
    const p = this.player, [ox, oy] = this.up(p.x, p.y, 0.5), dmg = Math.round(S.dmg * mult), proj = S.proj || 'spark', n = S.n || 6;
    if (S.kind === 'orbit') return this.orbSummon(S);
    if (S.kind === 'nova') for (let k = 0; k < n; k++) this.shoot('p', ox, oy, aim + (k / n) * TAU, 8, 6, dmg, proj, 0.5, true);
    else if (S.kind === 'lance') for (let k = 0; k < n; k++) this.shoot('p', ox, oy, aim + (k - (n - 1) / 2) * 0.12, 14, 12, dmg, proj, 0.62, true);
    else if (S.kind === 'wave') {
      const perp = aim + Math.PI / 2;
      for (let k = 0; k < n; k++) { const o = (k - (n - 1) / 2) * 0.55; this.shoot('p', ox + Math.cos(perp) * o, oy + Math.sin(perp) * o, aim, 9, 9, dmg, proj, 0.5, true); }
    } else if (S.kind === 'mines') {
      const at = tgt(8);
      for (let k = 0; k < n; k++) { const a = (k / n) * TAU, b = this.shoot('p', lift(at.x, at.y, 0.5)[0] + Math.cos(a) * 1.2, lift(at.x, at.y, 0.5)[1] + Math.sin(a) * 1.2, a, 6, 3.2, dmg, proj, 0.5, true); b.mv = { hold: 0.55 }; b.t = 0; }
    } else if (S.kind === 'rain') {
      const at = tgt(9);
      for (let k = 0; k < n; k++) this.fvLater(k * 0.07, () => { const x = at.x + (R() - 0.5) * 3, y = at.y + (R() - 0.5) * 2.4; this.shoot('p', x, y - 5, Math.PI / 2, 12, 5, dmg, proj, 0.5, true); });
    } else if (S.kind === 'spiral') {
      const a0 = aim;
      for (let st = 0; st < 9; st++) this.fvLater(st * 0.1, () => { if (p.dead) return; const [x, y] = this.up(p.x, p.y, 0.5); for (let k = 0; k < n; k++) this.shoot('p', x, y, a0 + st * 0.35 + (k / n) * TAU, 8, 6, dmg, proj, 0.45, true); });
    }
  }
  useAbility() {
    const p = this.player;
    if (this.mode !== 'play' || p.dead) return;
    const id = p.equip[1];
    if (!id) return;
    const A = ITEMS[id].ability;
    if (A.sigil && p.abilityT <= 0 && p.sigil && p.sigil.S === A.sigil && this.sigilTrigger()) return;   // the second press sets the sigil off (src/sigils.js)
    const cost = this.rfAbilityCost(A.cost);              // (a Realmforge robe or ring can lower it: src/rf/uniqmech.js)
    if (p.mp < cost) { this.toast('Not enough mana.'); return; }
    if (p.abilityT > 0 || p.hook) return;
    p.mp -= cost;
    p.abilityT = 0.5;
    this.sfx('ability');
    if (A.berserk) p.status.berserk = A.berserk;
    if (A.armored) p.status.armored = A.armored;
    if (A.invuln) p.status.invuln = A.invuln;
    if (A.heal) { const h = Math.min(A.heal, this.stat('hp') - p.hp); p.hp += h; if (h > 0) this.float(...lift(p.x, p.y, 1.4), `+${Math.round(h)}`, '#3ac85a'); }
    const B = A.burst, mult = dmgMult(this.stat('att')), I = this.input, mod = A.mod;
    const [cx0, cy0] = this.up(p.x, p.y, 0.5);
    const aim = angleTo(cx0, cy0, I.aimX, I.aimY);
    const tgt = (range) => {                           // ground target under the cursor, clamped to range
      const d = Math.min(range, dist(p.x, p.y, I.aimX, I.aimY));
      return { x: p.x + Math.cos(aim) * d, y: p.y + Math.sin(aim) * d };
    };
    const type = ITEMS[id].type;
    if (A.sig) this.abilitySig(A.sig, mult, aim, tgt);   // the item's own signature, whatever its type (src/data/uniques.js)
    if (A.myth && this.mythCast(A, mult, aim, tgt)) {
      // a Mythic's own mechanic in place of the class ability (src/mythics.js)
    } else if (type === 'bellows') {
      // BELLOWS CHARGE: an untouchable dash that batters everything in its path, then an ember blast
      const len = 4.2 + (B.range - 3) * 0.6;
      p.dash = { vx: Math.cos(aim) * len / 0.22, vy: Math.sin(aim) * len / 0.22, t: 0.22, dmg: Math.round(B.dmg * 1.3 * mult), hit: new Set(), B, mult, mod, trailT: 0 };
      p.status.invuln = Math.max(p.status.invuln, 0.3);
      this.vx({ k: 'shake', amt: 3 });
    } else if (type === 'seal') {
      // OATH-ANVIL: hurl the anvil; it lands after a beat, crushes and stuns
      const at = tgt(7);
      const anvil = (x, y, delay) => this.fx.push({ kind: 'anvil', x, y, t: 0, life: delay + 0.4, delay, r: 2.1 + (B.range - 3.5) * 0.4,
        dmg: Math.round(B.dmg * 2.4 * mult), stun: (1.4 + (A.armored - 2.5) * 0.2) * (mod === 'freeze' ? 2 : 1), done: false, frost: mod === 'freeze' });
      if (mod === 'triple') for (let k = -1; k <= 1; k++) anvil(at.x + Math.cos(aim) * k * 2.4, at.y + Math.sin(aim) * k * 2.4, 0.45 + (k + 1) * 0.15);
      else if (mod === 'meteor') {                       // The First Anvil: a ring of anvils, then one great one in the middle
        for (let k = 0; k < 6; k++) anvil(at.x + Math.cos(aim + k * TAU / 6) * 2.8, at.y + Math.sin(aim + k * TAU / 6) * 2.8, 0.4 + k * 0.09);
        this.fx.push({ kind: 'anvil', x: at.x, y: at.y, t: 0, life: 1.6, delay: 1.2, r: 3.2, dmg: Math.round(B.dmg * 4 * mult), stun: 2, done: false });
      } else anvil(at.x, at.y, 0.55);
      if (mod === 'aftershock') anvil(at.x, at.y, 1.2);
    } else if (type === 'halo' && A.halo && this.haloCast(A, mult, aim, tgt)) {
      // a special Halo: its own shape instead of the pillar (src/halos.js)
    } else if (type === 'halo') {
      // JUDGMENT OF NOON: a pillar of light falls on the target and burns everything inside it
      // a narrower pillar that falls at once: one heavy strike on everything under it, then a short burn
      const at = tgt(8), r0 = 1.15 + (B.range - 5) * 0.15;
      const beam = (x, y, r, k) => this.fx.push({ kind: 'beam', x, y, t: 0, life: 1.35, delay: 0.15, r, dmg: Math.round(B.dmg * 0.7 * mult * k), strike: Math.round(B.dmg * 2.8 * mult * k),
        tick: 0, proj: B.proj, follow: mod === 'follow', devour: mod === 'devour', ignite: mod === 'ignite' ? Math.round(B.dmg * 0.4 * mult) : 0 });
      if (mod === 'prism3') for (let k = 0; k < 3; k++) beam(at.x + Math.cos(aim + k * TAU / 3) * 1.6, at.y + Math.sin(aim + k * TAU / 3) * 1.6, r0 * 0.75, 0.8);
      else if (mod === 'eclipse') this.fx.push({ kind: 'beam', x: at.x, y: at.y, t: 0, life: 2.6, delay: 0.2, r: r0 * 1.5, dmg: Math.round(B.dmg * 0.9 * mult), strike: Math.round(B.dmg * 2 * mult),
        tick: 0, proj: B.proj, follow: true, devour: true, ignite: Math.round(B.dmg * 0.4 * mult) });
      else beam(at.x, at.y, r0, 1);
      this.vx({ k: 'burst', x: cx0, y: cy0, n: 14, colors: ['#ffeb8f', '#fffdf0'] });
    } else if (type === 'reliquary') {
      // OPEN THE RELIQUARY: bone thralls climb out and hunt whatever is nearest
      for (let k = 0; k < A.thralls; k++) {
        const a = aim + (k / A.thralls) * TAU;
        this.allies.push({ kind: 'thrall', sprite: A.summon || 'thrall', x: p.x + Math.cos(a) * 1.2, y: p.y + Math.sin(a) * 1.2, life: A.life, max: A.life, cd: 0.3 + k * 0.12,
          dmg: Math.round(B.dmg * mult), cleave: mod === 'thrallfan' || mod === 'kings' || B.count > 1, burst: mod === 'thrallburst' || mod === 'kings', ph: R() * TAU, born: this.t });
      }
      this.vx({ k: 'burst', ...liftO(p.x, p.y, 0.5), n: 24, colors: ['#e8e0c8', '#8af6ff', '#5ef0c8'] });
      this.fx.push({ kind: 'ring', ...liftO(p.x, p.y, 0.4), t: 0, max: 2.4, color: '#8af6ff' });
    } else if (type === 'hookline') {
      // GRAPPLE LINE: the hook flies to the cursor. A monster gets reeled in and stunned;
      // a boss reels YOU in; nothing at all and the line hauls you to where it landed.
      p.hook = { x: cx0, y: cy0, vx: Math.cos(aim) * 26, vy: Math.sin(aim) * 26, a: aim, flown: 0, max: B.range, state: 'fly',
        dmg: Math.round(B.dmg * mult), caught: [], room: mod === 'reel3' ? 3 : mod === 'maelstrom' ? 5 : 1, shock: mod === 'shockline' || mod === 'maelstrom' };
      this.sfx('shoot', 'harpooner');
    } else if (type === 'mirror') {
      // MIRROR STEP: blink to the cursor; your reflection stays behind and every monster nearby hunts it
      const at = tgt(6.5);
      let x = p.x, y = p.y;
      for (let i = 1; i <= 26; i++) {
        const nx = p.x + (at.x - p.x) * i / 26, ny = p.y + (at.y - p.y) * i / 26;
        if (isSolid(this.map, nx, ny)) break;
        x = nx; y = ny;
      }
      const n = mod === 'hall' ? 3 : mod === 'echoes' ? 2 : mod === 'infinite' ? 5 : 1;
      for (let k = 0; k < n; k++) {
        const ring = mod === 'infinite', a = ring ? aim + (k / n) * TAU : k * 2.1 + aim, rr = ring ? 2 : 1.5;
        const ox = k || ring ? Math.cos(a) * rr : 0, oy = k || ring ? Math.sin(a) * rr : 0;
        this.decoys.push({ x: p.x + ox, y: p.y + oy, t: A.decoy, max: A.decoy, dmg: Math.round(B.dmg * mult), n: B.count, range: B.range, flip: p.dir === 'left', dir: p.dir, twice: ring });
      }
      this.vx({ k: 'burst', ...liftO(p.x, p.y, 0.5), n: 20, colors: ['#ffffff', '#cfe8ff', '#8ab4d8'] });
      { const sx0 = p.x, sy0 = p.y; p.x = sx0; p.y = sy0; for (let i = 0; i < 26; i++) this.moveCircle(p, (x - sx0) / 26, (y - sy0) / 26, PLAYER_R); }
      p.status.invuln = Math.max(p.status.invuln, 0.3);
      this.vx({ k: 'burst', ...liftO(p.x, p.y, 0.5), n: 20, colors: ['#ffffff', '#cfe8ff', '#8ab4d8'] });
    } else if (type === 'kite') {
      // STORM KITE: a kite turret, anchored where you aim, that rains lightning on anything near it
      const follow = mod === 'squall' || mod === 'eye', at = follow ? { x: p.x, y: p.y } : tgt(7), n = mod === 'twinkite' ? 2 : mod === 'eye' ? 3 : 1;
      for (let k = 0; k < n; k++) {
        this.allies.push({ kind: 'kite', x: at.x + (n > 1 ? (k ? 1.4 : -1.4) : 0), y: at.y, life: A.life, max: A.life, dmg: Math.round(B.dmg * mult),
          range: B.range, cd: 0.3 + k * 0.2, ph: R() * TAU, born: this.t, follow: follow ? { k, n } : null });
      }
      this.vx({ k: 'burst', x: at.x, y: at.y - 1, n: 18, colors: ['#ffffff', '#8af6ff', '#ffe45c'] });
    } else if (type === 'runeward') {
      // RUNE WARD: runes close around you and soak up the next blows; rune-slashes cut a ring outward
      p.ward = Math.max(p.ward || 0, A.ward); p.wardMax = p.ward; p.wardT = 6;
      for (let k = 0; k < B.count; k++) this.shoot('p', cx0, cy0, aim + (k / B.count) * TAU, 9, B.range, Math.round(B.dmg * mult), B.proj, 0.5, !!B.pierce);
      this.fx.push({ kind: 'ring', ...liftO(p.x, p.y, 0.5), t: 0, max: 2.2, color: '#46f5d6' });
      this.vx({ k: 'burst', ...liftO(p.x, p.y, 0.6), n: 24, colors: ['#46f5d6', '#eef8ff', '#d63a4a'] });
    } else if (type === 'hex') {
      // HEX: a curse thrown at the cursor. Everything inside takes more damage and slows; hex-bolts burst from it
      const at = tgt(7.5), C = A.curse;
      this.fx.push({ kind: 'hexzone', x: at.x, y: at.y, r: C.r, t: 0, life: 1.2 });
      for (const e of this.enemiesIn(at.x, at.y, C.r)) {
        e.curseT = C.t; e.curseF = Math.max(e.curseF && e.curseT > 0 ? e.curseF : 0, C.f);
        if (mod === 'ashcurse') this.ignite(e, Math.round(120 * mult), C.t);
        if (e !== this.boss && !e.rb) { e.slowT = Math.max(e.slowT || 0, C.t); e.slowF = Math.max(e.slowF || 0, 0.3); }
      }
      for (let k = 0; k < B.count; k++) this.shoot('p', ...lift(at.x, at.y, 0.5), (k / B.count) * TAU, 8, B.range, Math.round(B.dmg * mult), B.proj, 0.45, false);
      this.vx({ k: 'burst', ...liftO(at.x, at.y, 0.5), n: 30, colors: ['#ab82f2', '#7af4ff', '#e6ffff'] });
    } else if (type === 'stopwatch') {
      // STOP TIME: everything inside the dial freezes. You don't.
      this.timeStop = { x: p.x, y: p.y, r: B.range, t: A.stop, dur: A.stop, rewind: mod === 'rewind' || mod === 'unwind',
        slow: mod === 'slowfield', unwind: mod === 'unwind' ? Math.round((A.unwind || 0) * mult) : 0 };
      this.fx.push({ kind: 'ring', ...liftO(p.x, p.y, 0.4), t: 0, max: B.range, color: '#e3b95a' });
      this.vx({ k: 'burst', ...liftO(p.x, p.y, 0.5), n: 30, colors: ['#e3b95a', '#fff6c8', '#8d88a0'] });
      this.vx({ k: 'shake', amt: 3 });
    } else if (type === 'godability') {
      for (const e of this.enemiesIn(p.x, p.y, B.range)) this.damageEnemy(e, B.dmg, ...lift(e.x, e.y, 0.5), true);
      this.fx.push({ kind: 'ring', ...liftO(p.x, p.y, 0.5), t: 0, max: 16, color: '#ff4af0' });
      this.vx({ k: 'burst', ...liftO(p.x, p.y, 0.5), n: 90, colors: ['#ff4af0', '#8af6ff', '#ffffff', '#ffd650'] });
      this.vx({ k: 'shake', amt: 9 });
    }
    if (A.sigil) this.sigilPlace(A, mult, tgt(7));        // a UT's sigil: press again to set it off (src/sigils.js)
    this.gearOnAbility();                                  // rings that ride on your abilities (src/gearmech.js)
    this.rfOnAbility();
  }
  // enemies (and the dungeon boss) inside a circle
  enemiesIn(x, y, r) {
    const out = (this.active || this.enemies).filter((e) => !e.dead && !e.under && e.state !== 'sleep' && dist2(e.x, e.y, x, y) < (r + e.D.r) ** 2);
    if (this.boss && this.boss.state !== 'sleep' && this.boss.state !== 'dead' && dist2(this.boss.x, this.boss.y, x, y) < (r + BOSS.r) ** 2) out.push(this.boss);
    return out;
  }
  stun(e, t) {
    if (e === this.boss || e.rb) { this.float(e.x, e.y - 2, 'UNSHAKEN', '#8d88a0'); return; }
    if (e.D && e.D.dummy) return;
    e.stunT = Math.max(e.stunT || 0, e.herald ? t * 0.5 : t);
    e.state = 'move'; e.queue.length = 0;
  }
  updateAbilityFx(dt) {
    const p = this.player;
    if (p.dash) {                                       // Brawler charge in progress
      const D = p.dash;
      D.t -= dt;
      this.moveCircle(p, D.vx * dt, D.vy * dt, PLAYER_R);
      if (Math.random() < 0.9) this.vx({ k: 'burst', ...liftO(p.x, p.y, 0.4), n: 2, colors: ['#ff8a1f', '#ffe45c', '#d8341a'] });
      for (const e of this.enemiesIn(...lift(p.x, p.y, 0.4), 0.9)) {
        if (D.hit.has(e)) continue;
        D.hit.add(e); this.damageEnemy(e, D.dmg, ...lift(e.x, e.y, 0.5));
      }
      if (D.mod === 'vortex') {                         // the conch drags everything along behind you
        for (const e of this.enemiesIn(p.x, p.y, 2.6)) if (e !== this.boss && !e.rb && !(e.D && e.D.dummy)) this.moveCircle(e, D.vx * dt * 0.85, D.vy * dt * 0.85, 0.35);
      }
      if ((D.mod === 'trail' || D.mod === 'inferno') && (D.trailT -= dt) <= 0) {
        D.trailT = 0.05;
        this.fx.push({ kind: 'cloud', x: p.x, y: p.y, r: 0.9, t: 0, life: 2.4, dmg: Math.round(D.B.dmg * 0.25 * D.mult), tick: 0, color: 'incense' });
      }
      if (D.t <= 0) {
        p.dash = null;
        const [cx0, cy0] = this.up(p.x, p.y, 0.5), n = Math.ceil(D.B.count * 0.8);
        for (let k = 0; k < n; k++) this.shoot('p', cx0, cy0, (k / n) * TAU, 9, D.B.range * 0.8, Math.round(D.B.dmg * D.mult), D.B.proj, 0.5, D.B.pierce);
        this.fx.push({ kind: 'ring', x: cx0, y: cy0, t: 0, max: 2.5, color: '#ff8a1f' });
        if (D.mod === 'cloud' || D.mod === 'inferno') this.fx.push({ kind: 'cloud', x: p.x, y: p.y, r: 2.4, t: 0, life: 4, dmg: Math.round(D.B.dmg * 0.4 * D.mult), tick: 0, color: 'bile' });
        if (D.mod === 'inferno') for (let k = 0; k < n; k++) this.shoot('p', cx0, cy0, ((k + 0.5) / n) * TAU, 6.5, D.B.range, Math.round(D.B.dmg * D.mult), D.B.proj, 0.5, D.B.pierce);
        this.vx({ k: 'shake', amt: 4 });
      }
    }
    if (p.hook) this.updateHook(dt);
    if (p.pull) {                                       // being hauled along a grapple line
      const P = p.pull, d = dist(p.x, p.y, P.x, P.y), step = Math.min(d, 22 * dt);
      const ox = p.x, oy = p.y;
      if (d > 0.7) this.moveCircle(p, ((P.x - p.x) / d) * step, ((P.y - p.y) / d) * step, PLAYER_R);
      P.t -= dt;
      if (d <= 0.7 || P.t <= 0 || (Math.abs(p.x - ox) + Math.abs(p.y - oy) < 0.001)) {
        p.pull = null;
        this.vx({ k: 'burst', x: p.x, y: p.y, n: 14, colors: ['#c8d8e8', '#7ec0e4', '#ffffff'] });
      } else p.status.invuln = Math.max(p.status.invuln, 0.12);
    }
    for (const f of this.fx) {
      if (f.kind === 'anvil' && !f.done && f.t >= f.delay) {
        f.done = true;
        for (const e of this.enemiesIn(f.x, f.y, f.r)) { this.damageEnemy(e, f.dmg, ...lift(e.x, e.y, 0.5)); this.stun(e, f.stun); }
        this.vx({ k: 'shake', amt: 7 });
        this.vx({ k: 'burst', x: f.x, y: f.y, n: 40, colors: f.frost ? ['#cfffff', '#3befff', '#a6acc4', '#ffffff'] : ['#ffc94a', '#f2641a', '#a6acc4', '#fff6c8'] });
        this.fx.push({ kind: 'ring', x: f.x, y: f.y, t: 0, max: f.r + 0.6, color: f.frost ? '#3befff' : '#ffc94a' });
        this.sfx('forge');
      }
      if (f.kind === 'star' && !f.done && f.t >= f.delay) {
        f.done = true;
        if (f.dmg) for (const e of this.enemiesIn(f.x, f.y, f.r)) this.damageEnemy(e, f.dmg, ...lift(e.x, e.y, 0.5));
        this.vx({ k: 'burst', x: f.x, y: f.y, n: 30, colors: ['#ffffff', '#8af6ff', '#3bc8e8'] });
        this.fx.push({ kind: 'ring', x: f.x, y: f.y, t: 0, max: f.r + 0.4, color: '#8af6ff' });
        if (f.sparks) this.starSparks(f);
        this.vx({ k: 'shake', amt: f.sparks ? 1 : 3 });
      }
      if (f.kind === 'beam' && f.t >= f.delay && f.strike && !f.struck) {   // the moment it lands: the heavy blow
        f.struck = true; f.tick = 0.25;
        for (const e of this.enemiesIn(f.x, f.y, f.r)) this.damageEnemy(e, f.strike, ...lift(e.x, e.y, 0.5));
        this.vx({ k: 'burst', x: f.x, y: f.y, n: 24, colors: ['#ffffff', '#ffeb8f', '#f2c14e'] }); this.vx({ k: 'shake', amt: 2 });
      }
      if (f.kind === 'beam' && f.t >= f.delay) {
        if (f.follow) {                                 // The Last Noon: the pillar walks toward your cursor
          const I = this.input, d = dist(f.x, f.y, I.aimX, I.aimY), s = Math.min(d, 5 * dt);
          if (d > 0.05) { f.x += ((I.aimX - f.x) / d) * s; f.y += ((I.aimY - f.y) / d) * s; }
        }
        f.tick -= dt;
        if (f.tick <= 0 && f.t < f.life - 0.15) {
          f.tick = 0.2;
          for (const e of this.enemiesIn(f.x, f.y, f.r)) {
            this.damageEnemy(e, f.dmg, ...lift(e.x, e.y, 0.5));
            if (f.ignite) this.ignite(e, f.ignite, 3);
            if (f.devour && e.dead) { p.hp = Math.min(this.stat('hp'), p.hp + this.stat('hp') * 0.08); this.float(...lift(p.x, p.y, 1.4), 'DEVOUR', '#3ac85a'); }
          }
          this.vx({ k: 'burst', x: f.x, y: f.y, n: 10, colors: ['#ffeb8f', '#fffdf0', '#f2c14e'] });
        }
      }
      if (f.kind === 'laser' && !f.hit && f.t > f.tele && f.t < f.tele + f.act && !p.dead) {
        const [hx, hy] = this.up(p.x, p.y, 0.45), dx = Math.cos(f.a), dy = Math.sin(f.a);
        const u = Math.max(0, Math.min(f.len, (hx - f.x0) * dx + (hy - f.y0) * dy));
        if (dist2(hx, hy, f.x0 + dx * u, f.y0 + dy * u) < 0.42 * 0.42) { f.hit = true; this.hurtPlayer(f.dmg, f.by); }
      }
      if (f.kind === 'cloud') {
        f.tick -= dt;
        if (f.tick <= 0) {
          f.tick = 0.3;
          for (const e of this.enemiesIn(f.x, f.y, f.r)) this.damageEnemy(e, f.dmg, ...lift(e.x, e.y, 0.5), true);
        }
      }
      if (f.kind === 'zone' && !f.done && f.t >= f.delay) {   // boss ground slams: telegraphed, then they hurt
        f.done = true;
        const [hx, hy] = [p.x, p.y];
        if (!p.dead && dist2(hx, hy, f.x, f.y) < f.r * f.r) this.hurtPlayer(f.dmg, f.by);
        this.vx({ k: 'burst', x: f.x, y: f.y, n: 18, colors: f.colors || ['#ff4a5a', '#ffc94a'] });
        if (f.shards) for (let k = 0; k < f.shards; k++) this.shoot('e', f.x, f.y, (k / f.shards) * TAU + f.t, 4.5, 6, Math.round(f.dmg * 0.5), f.proj || 'quake', 0.38, false, f.by);
      }
    }
  }
  updateHook(dt) {
    const p = this.player, H = p.hook;
    if (H.state === 'fly') {
      const s = 26 * dt;
      H.x += H.vx * dt; H.y += H.vy * dt; H.flown += s;
      for (const e of this.enemiesIn(H.x, H.y + 0.4, 0.45)) {
        if (H.caught.includes(e)) continue;
        this.damageEnemy(e, H.dmg, ...lift(e.x, e.y, 0.5));
        if (e === this.boss || e.rb || e.dead || (e.D && e.D.dummy)) {   // too big to move: the line hauls you to it instead
          H.state = 'done';
          p.pull = { x: e.x - Math.cos(H.a) * 2, y: e.y - Math.sin(H.a) * 2, t: 0.9 };
          break;
        }
        H.caught.push(e);
        this.stun(e, 1.3);
        if (H.caught.length >= H.room) { H.state = 'reel'; break; }
      }
      if (H.state === 'fly' && (H.flown >= H.max || isSolid(this.map, H.x, H.y + 0.3))) {
        if (H.caught.length) H.state = 'reel';
        else {                                           // nothing caught: haul yourself to the hook
          H.state = 'done';
          p.pull = { x: H.x - Math.cos(H.a) * 0.6, y: H.y - Math.sin(H.a) * 0.6 + 0.3, t: 0.9 };
        }
      }
      if (H.state === 'done') { H.t = 0.18; this.vx({ k: 'burst', x: H.x, y: H.y, n: 8, colors: ['#c8d8e8', '#8a7a6a'] }); }
    }
    if (H.state === 'reel') {                            // drag the catch back to the player
      let all = true;
      for (const e of H.caught) {
        if (e.dead) continue;
        const d = dist(e.x, e.y, p.x, p.y);
        if (d > 1.3) { all = false; const s = Math.min(d - 1.2, 18 * dt); this.moveCircle(e, ((p.x - e.x) / d) * s, ((p.y - e.y) / d) * s, 0.3); e.stunT = Math.max(e.stunT || 0, 0.6); }
      }
      const lead = H.caught.find((e) => !e.dead);
      if (lead) [H.x, H.y] = lift(lead.x, lead.y, 0.5);
      if (all || !lead) {
        if (H.shock) {
          for (const e of this.enemiesIn(p.x, p.y, 2.2)) this.damageEnemy(e, Math.round(H.dmg * 0.6), ...lift(e.x, e.y, 0.5));
          this.fx.push({ kind: 'ring', ...liftO(p.x, p.y, 0.4), t: 0, max: 2.4, color: '#8af6ff' });
          this.vx({ k: 'burst', ...liftO(p.x, p.y, 0.4), n: 30, colors: ['#8af6ff', '#ffffff', '#3befff'] });
          this.vx({ k: 'shake', amt: 5 });
        }
        for (const e of H.caught) if (!e.dead) this.stun(e, 1.4);
        H.state = 'done'; H.t = 0.1;
      }
    }
    if (H.state === 'done') { H.t -= dt; if (H.t <= 0) p.hook = null; }
  }
  updateKite(a, dt) {
    a.life -= dt; a.ph += dt * 2; a.cd -= dt;
    if (a.follow) {                                     // The Squall / The Eye of the Storm: the kite keeps up with you
      const p = this.player, ang = this.t * 1.3 + (a.follow.k / a.follow.n) * TAU, rr = a.follow.n > 1 ? 2.2 : 1.6;
      const gx = p.x + Math.cos(ang) * rr, gy = p.y + Math.sin(ang) * rr, f = Math.min(1, dt * 5);
      a.x += (gx - a.x) * f; a.y += (gy - a.y) * f;
    }
    if (a.life <= 0) { this.vx({ k: 'burst', x: a.x, y: a.y - 2, n: 14, colors: ['#8af6ff', '#ffffff'] }); return false; }
    if (a.cd > 0) return true;
    a.cd = 0.42;
    const tgt = this.enemiesIn(a.x, a.y, a.range).filter((e) => !(e.D && e.D.dummy && this.map.kind !== 'nexus') && !e.under)
      .sort((u, v) => dist2(u.x, u.y, a.x, a.y) - dist2(v.x, v.y, a.x, a.y));
    if (!tgt.length) return true;
    const [e1, e2] = tgt;
    this.damageEnemy(e1, a.dmg, ...lift(e1.x, e1.y, 0.5), true);
    this.vx({ k: 'zap', ...liftA(a.x, a.y, 1.8), ...liftB(e1.x, e1.y, 0.5) });
    if (e2) { this.damageEnemy(e2, Math.round(a.dmg * 0.6), ...lift(e2.x, e2.y, 0.5), true); this.vx({ k: 'zap', ...liftA(e1.x, e1.y, 0.5), ...liftB(e2.x, e2.y, 0.5) }); }
    this.sfx('zap');
    return true;
  }
  // ---- Mirror Step reflections: monsters hunt them; they shatter when time runs out
  updateDecoys(dt) {
    for (const d of this.decoys) {
      d.t -= dt;
      if (d.t > 0) continue;
      const [ox, oy] = this.up(d.x, d.y, 0.5);
      for (let k = 0; k < d.n; k++) this.shoot('p', ox, oy, (k / d.n) * TAU, 10, d.range, d.dmg, 'pj_glass', 0.4, true);
      if (d.twice) { d.twice = false; d.t = 0.6; d.n = Math.max(4, Math.round(d.n * 0.75)); this.sfx('glass'); continue; }   // The Infinite Reflection: it shatters again
      this.vx({ k: 'burst', ...liftO(d.x, d.y, 0.5), n: 26, colors: ['#ffffff', '#cfe8ff', '#8ab4d8', '#3a5a7a'] });
      this.sfx('glass');
    }
    this.decoys = this.decoys.filter((d) => d.t > 0);
  }
  // who an enemy is after: the nearest reflection if one is up, else you
  // ---- finding a way round walls. While a monster can see you it steers straight at its spot (its own style); once a
  // wall stands between, it follows the flow field: every open tile's walking distance from yours (out to 40 steps),
  // worked out once each time you step onto a new tile and shared by every monster. It heads for the furthest point
  // down that path it can see, so it rounds corners in one smooth line instead of tile by tile.
  flowField() {
    const m = this.map, p = this.player, n = m.w * m.h, at = Math.floor(p.y) * m.w + Math.floor(p.x);
    let F = m.flow;
    if (F && F.at === at && this.t - F.t < 2) return F;     // (and refreshed every 2 s, for doors that open)
    if (!F || F.n !== n) F = m.flow = { n, d: new Int16Array(n), gen: new Int32Array(n), g: 0, q: new Int32Array(16384) };
    F.g++; F.at = at; F.t = this.t;
    const { d, gen, q } = F, walk = (x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && !isSolid(m, x + 0.5, y + 0.5) && !(m.hasVoid && m.tiles[y * m.w + x] === TID.asvoid);   // (the void is no road: walkers won't step on it)
    let head = 0, tail = 0;
    if (at < 0 || at >= n) return F;
    q[tail++] = at; d[at] = 0; gen[at] = F.g;
    while (head < tail) {
      const i = q[head++], x = i % m.w, y = (i / m.w) | 0;
      if (d[i] >= 40) continue;
      for (let k = 0; k < 4; k++) {
        const nx = x + (k === 0 ? 1 : k === 1 ? -1 : 0), ny = y + (k === 2 ? 1 : k === 3 ? -1 : 0), j = ny * m.w + nx;
        if (j < 0 || j >= n || gen[j] === F.g || !walk(nx, ny)) continue;
        gen[j] = F.g; d[j] = d[i] + 1;
        if (tail < q.length) q[tail++] = j;
      }
    }
    return F;
  }
  // can it see you (a clear straight line: enough for a shot)? And, wide, could it walk that line (its body's width
  // clear the whole way: a line that only grazes a corner is not a way through)? Asked a few times a second.
  seesFoe(e, p, wide = false) {
    const k = wide ? 'walkLine' : 'sight';
    if (e[k + 'T'] > this.t) return e[k];
    e[k + 'T'] = this.t + 0.2 + ((e.x * 7 + e.y * 3) % 1) * 0.1;
    const m = this.map, dx = p.x - e.x, dy = p.y - e.y, L = Math.hypot(dx, dy), w = wide ? 0.42 * ((Math.abs(dx) + Math.abs(dy)) / (L || 1)) : 0, nx = (-dy / (L || 1)) * w, ny = (dx / (L || 1)) * w;   // (a body is a square: going diagonally it sweeps wider)
    e[k] = true;
    for (let s = 0.3; s < L - 0.3 && e[k]; s += 0.3) {
      const x = e.x + (dx * s) / L, y = e.y + (dy * s) / L;
      if (isSolid(m, x, y) || (wide && (isSolid(m, x + nx, y + ny) || isSolid(m, x - nx, y - ny)))) e[k] = false;
    }
    return e[k];
  }
  // a pack's spacing round you: how far to shift its bearing (from you) away from its allies'. Every ally near you pushes,
  // the nearer in bearing the harder, so the only arrangement at rest is an even ring: a pack closes in from all sides.
  // Local and cheap (its own neighbours, rechecked every 0.3 s), no central plan.
  packSpread(e, p, a0, dt) {
    if ((e.slotT = (e.slotT || 0) - dt) > 0) return e.slotOff || 0;
    e.slotT = 0.3;
    let push = 0;
    for (const o of this.active) {
      if (o === e || o.dead || o.rb || !o.D.speed || dist2(o.x, o.y, p.x, p.y) > 36) continue;
      const ao = angleTo(p.x, p.y, o.x, o.y), da = Math.atan2(Math.sin(a0 - ao), Math.cos(a0 - ao));
      push += (da === 0 ? (e.phase > Math.PI ? 1 : -1) : Math.sign(da)) * (1 - Math.abs(da) / Math.PI);
    }
    return (e.slotOff = Math.max(-2.35, Math.min(2.35, push * 1.2)));
  }
  // where to walk to come round to you: the furthest tile down the flow it can see (null if you are out of reach)
  flowStep(e) {
    const F = this.flowField(), m = this.map, w = m.w;
    let i = Math.floor(e.y) * w + Math.floor(e.x);
    if (F.gen[i] !== F.g) return null;
    const clear = (x, y) => {                              // a line its body can walk (0.42 either side: the widest monster body)
      const dx = x - e.x, dy = y - e.y, L = Math.hypot(dx, dy) || 1, w = 0.42 * ((Math.abs(dx) + Math.abs(dy)) / L), nx = (-dy / L) * w, ny = (dx / L) * w;
      for (let s = 0.2; s < L; s += 0.25) { const px = e.x + (dx * s) / L, py = e.y + (dy * s) / L; if (isSolid(m, px, py) || isSolid(m, px + nx, py + ny) || isSolid(m, px - nx, py - ny)) return false; }
      return true;
    };
    let best = null;
    for (let step = 0; step < 6; step++) {
      const x = i % w, y = (i / w) | 0;
      let next = -1, nd = F.d[i];
      for (let k = 0; k < 4; k++) {
        const j = (y + (k === 2 ? 1 : k === 3 ? -1 : 0)) * w + x + (k === 0 ? 1 : k === 1 ? -1 : 0);
        if (F.gen[j] === F.g && F.d[j] < nd) { nd = F.d[j]; next = j; }
      }
      if (next < 0) break;
      const tx = (next % w) + 0.5, ty = ((next / w) | 0) + 0.5;
      if (step > 0 && !clear(tx, ty)) break;              // as far down the path as it can see
      best = [tx, ty]; i = next;
    }
    return best;
  }
  foe(e) {
    let best = this.player, bd = 81;
    for (const d of this.decoys || []) { const k = dist2(e.x, e.y, d.x, d.y); if (k < bd) { bd = k; best = d; } }
    return best;
  }
  // time stop: frozen while inside the dial (bosses only for the first half)
  frozen(e) {
    const T = this.timeStop;
    return !!(T && T.t > 0 && dist2(e.x, e.y, T.x, T.y) < T.r * T.r && (!(e.rb || e === this.boss) || T.t > T.dur * 0.5));
  }
  updateTimeStop(dt) {
    const T = this.timeStop;
    if (!T) return;
    T.t -= dt;
    if (T.t > 0) return;
    for (const b of this.projectiles) {
      if (!b.frozen) continue;
      b.frozen = false;
      if (T.rewind && b.from === 'e') {                 // The Broken Hourglass: they go back where they came from
        b.from = 'p'; b.vx = -b.vx; b.vy = -b.vy; b.a += Math.PI; b.dmg = Math.round(b.dmg * 3); b.mv = null; b.lob = null;
        b.hit = new Set(); b.pierce = false; b.life = Math.max(b.life, 1.5);
      }
    }
    this.timeStop = null;
    if (T.slow || T.unwind) {                           // the time you stopped comes back for them
      for (const e of this.enemiesIn(T.x, T.y, T.r)) {
        if (T.slow && e !== this.boss && !e.rb) { e.slowT = 3; e.slowF = Math.max(e.slowF || 0, 0.5); }
        if (T.unwind) this.damageEnemy(e, T.unwind, ...lift(e.x, e.y, 0.5), true);
      }
      if (T.unwind) { this.fx.push({ kind: 'ring', ...liftO(T.x, T.y, 0.4), t: 0, max: T.r, color: '#fff6c8' }); this.vx({ k: 'shake', amt: 5 }); }
    }
    this.vx({ k: 'burst', ...liftO(T.x, T.y, 0.5), n: 16, colors: ['#e3b95a', '#fff6c8'] });
  }
  // ---- summoned thralls
  updateAllies(dt) {
    const keep = [];
    for (const a of this.allies) {
      if (a.kind === 'kite') { if (this.updateKite(a, dt)) keep.push(a); continue; }
      a.life -= dt; a.ph += dt * 3;
      if (a.life <= 0) {
        if (a.burst) {
          for (const e of this.enemiesIn(a.x, a.y, 2.2)) this.damageEnemy(e, a.dmg * 3, ...lift(e.x, e.y, 0.5));
          this.vx({ k: 'boom', x: a.x, y: a.y, r: 2.2 });
        }
        this.vx({ k: 'burst', ...liftO(a.x, a.y, 0.4), n: 10, colors: ['#e8e0c8', '#8af6ff'] });
        continue;
      }
      // climb onto the nearest enemy and claw at it; with nothing to hunt, heel at your side
      const p = this.player;
      if (a.tgt && (a.tgt.dead || a.tgt.under || a.tgt.state === 'dead' || dist2(a.tgt.x, a.tgt.y, p.x, p.y) > 12 * 12)) a.tgt = null;
      if (!a.tgt || (a.retarget = (a.retarget || 0) - dt) <= 0) {
        a.retarget = 0.6;
        let best = null, bd = 64;
        for (const e of this.enemiesIn(a.x, a.y, 8)) {
          if (e.D && e.D.dummy && this.map.kind !== 'nexus') continue;
          const d2 = dist2(e.x, e.y, a.x, a.y) + (this.allies.some((o) => o !== a && o.tgt === e) ? 4 : 0);   // spread out a little
          if (d2 < bd) { bd = d2; best = e; }
        }
        if (best) a.tgt = best;
      }
      const T = a.tgt;
      let tx, ty;
      if (T) {
        const k = this.allies.indexOf(a), ang = k * 2.4 + a.ph * 0.2, r0 = Math.min(0.35, ((T === this.boss ? BOSS.r : T.D.r) || 0.5) * 0.5);
        tx = T.x + Math.cos(ang) * r0; ty = T.y + Math.sin(ang) * r0 * 0.6;          // right on top of it
      } else { const ang = a.ph * 0.5; tx = p.x + Math.cos(ang) * 1.4; ty = p.y + Math.sin(ang) * 1.4; }
      if (dist(a.x, a.y, p.x, p.y) > 11) { tx = p.x; ty = p.y; }
      const d = dist(a.x, a.y, tx, ty);
      a.moving = d > 0.12;
      if (a.moving) { const s = Math.min(d, (a.speed || 7.5) * dt); a.x += ((tx - a.x) / d) * s; a.y += ((ty - a.y) / d) * s; a.face = tx < a.x; }
      a.atkT = Math.max(0, (a.atkT || 0) - dt);
      a.cd -= dt;
      if (T && a.cd <= 0 && dist2(a.x, a.y, T.x, T.y) < 0.9 * 0.9) {               // on it: CLAW
        a.cd = 0.5; a.atkT = 0.3; a.face = T.x < a.x;
        const hits = a.cleave ? this.enemiesIn(T.x, T.y, 1.3) : [T];
        const crown = a.crown > this.t ? (a.crown = 0, 3) : 1;   // a crowned king's one far stronger blow (src/mythics.js)
        for (const e of hits) this.damageEnemy(e, Math.round(a.dmg * crown * (e === T ? 1.3 : 0.7)), ...lift(e.x, e.y, 0.5), e !== T);
        this.vx({ k: 'slash', ...liftO(T.x, T.y, 0.5) });
        if (a.king) this.mythKingHit(a, T);
      }
      keep.push(a);
    }
    this.allies = keep;
  }

  // never stuck inside anything: if you end up overlapping something solid (a prop placed on your spawn, a teleport,
  // a swap, a door closing), step out to the nearest open ground
  blockedAt(x, y, r = PLAYER_R) {
    const m = this.map;
    return isSolid(m, x - r, y - r) || isSolid(m, x + r, y - r) || isSolid(m, x - r, y + r) || isSolid(m, x + r, y + r);
  }
  unstick(o, r = PLAYER_R) {
    if (!this.blockedAt(o.x, o.y, r)) return false;
    const m = this.map, bad = (x, y) => { const t = m.tiles[Math.floor(y) * m.w + Math.floor(x)]; return t === TID.lava || t === TID.emberlava || t === TID.asvoid; };   // (never onto the void: it would only send you back)
    for (let d = 1; d <= 24; d++) {
      for (let k = 0; k < 8 * d; k++) {
        const a = (k / (8 * d)) * TAU, x = Math.floor(o.x + Math.cos(a) * d) + 0.5, y = Math.floor(o.y + Math.sin(a) * d) + 0.5;
        if (!this.blockedAt(x, y, r) && !bad(x, y)) { o.x = x; o.y = y; return true; }
      }
    }
    return false;
  }
  moveCircle(o, dx, dy, r) {
    if (o.rb && this.map.kind === 'realm') {              // realm bosses pass over rocks, trees and thickets (RotMG-style): they never get stuck
      const m = this.map; o.x = Math.max(2, Math.min(m.w - 2, o.x + dx)); o.y = Math.max(2, Math.min(m.h - 2, o.y + dy)); return;
    }
    const m = this.map, nv = m.hasVoid && o !== this.player && !(o.D && o.D.fly) && !o.rb;      // walking monsters won't step into the void
    const vd = (x, y) => nv && m.tiles[Math.floor(y) * m.w + Math.floor(x)] === TID.asvoid;
    const free = (x, y) => !isSolid(m, x - r, y - r) && !isSolid(m, x + r, y - r) && !isSolid(m, x - r, y + r) && !isSolid(m, x + r, y + r) && !(nv && (vd(x - r, y - r) || vd(x + r, y - r) || vd(x - r, y + r) || vd(x + r, y + r)));
    if (free(o.x + dx, o.y)) o.x += dx;
    else if (o !== this.player && Math.abs(dx) > Math.abs(dy) * 0.5) {   // a monster caught on a corner slides toward the gap: centre it on its row
      const c = Math.floor(o.y) + 0.5 - o.y, s = Math.sign(c) * Math.min(Math.abs(c), Math.abs(dx));
      if (s && free(o.x, o.y + s)) o.y += s;                 // (step by step toward the centre, until the way ahead opens)
    }
    if (free(o.x, o.y + dy)) o.y += dy;
    else if (o !== this.player && Math.abs(dy) > Math.abs(dx) * 0.5) {   // ... or on its column
      const c = Math.floor(o.x) + 0.5 - o.x, s = Math.sign(c) * Math.min(Math.abs(c), Math.abs(dy));
      if (s && free(o.x + s, o.y)) o.x += s;
    }
  }

  shoot(from, x, y, a, speed, range, dmg, sprite, size = 0.4, pierce = false, by = null) {
    const MB = this.mirrorBy;
    if (from === 'e' && MB && by === MB.name && this.t < MB.until && !this.mirroring) {
      this.mirroring = true; this.shoot('e', 2 * MB.cx - x, 2 * MB.cy - y, a + Math.PI, speed, range, dmg, sprite, size, pierce, by); this.mirroring = false;
    }
    const b = { from, x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: range / Math.max(0.01, speed),
      dmg, sprite, r: size, pierce, hit: pierce ? new Set() : null, a, by };
    if (from === 'e') b.vol = `${this.frameN || 0}:${by}`;
    b.k = shotScale(sprite, size, from);                      // big art is drawn (and hits) at the size its attack meant
    this.projectiles.push(b);
    return b;
  }

  // does this enemy shot touch you? (its art against yours; see HITBOX)
  shotHitsPlayer(b, p) {
    const S = shotShape(b.sprite, b.r), a = S.upright ? -this.camAngle : b.a || 0, ca = Math.cos(a), sa = Math.sin(a);
    const k = b.k || 1, cx = b.x + (ca * S.al - sa * S.ac) * k, cy = b.y + (sa * S.al + ca * S.ac) * k, ux = S.across ? -sa : ca, uy = S.across ? ca : sa;
    const [fx, fy] = this.up(p.x, p.y, HITBOX.foot), [hx, hy] = this.up(p.x, p.y, HITBOX.head);
    return shotTouches(S, b.x, b.y, ca, sa, cx, cy, ux, uy, fx, fy, hx, hy, k);
  }
  hurtPlayer(dmg, by, ignoreDef = false) {
    const p = this.player;
    if (p.dead || p.status.invuln > 0 || this.map.kind === 'nexus' || this.god) return;
    const P = this.passive();
    if (P.dodge && R() < P.dodge) { this.float(...lift(p.x, p.y, 1.2), 'DODGE', '#8af6ff'); return; }
    if (P.aegis && p.aegisUp) {
      p.aegisUp = false; p.aegisT = P.aegis;
      this.float(...lift(p.x, p.y, 1.2), 'BLOCKED', '#f2c14e');
      this.fx.push({ kind: 'ring', ...liftO(p.x, p.y, 0.5), t: 0, max: 1.2, color: '#f2c14e' });
      return;
    }
    if (!ignoreDef) dmg = Math.round(dmg * this.danger());
    let d = mitigate(dmg, this.stat('def'), ignoreDef);
    if (p.ward > 0) {                                        // the Runeblade's ward drinks the blow first
      const w = Math.min(p.ward, d); p.ward -= w; d -= w;
      this.float(...lift(p.x, p.y, 1.2), `-${w}`, '#46f5d6');
      if (p.ward <= 0) {
        this.vx({ k: 'burst', ...liftO(p.x, p.y, 0.6), n: 16, colors: ['#46f5d6', '#ffffff'] }); this.sfx('hit');
        if (this.abilityMod() === 'wardnova') {               // the Unbroken Oath: a broken ward answers with a ring of runes
          const A = ITEMS[p.equip[1]].ability, mult = dmgMult(this.stat('att'));
          for (let k = 0; k < A.burst.count; k++) this.shoot('p', ...lift(p.x, p.y, 0.5), (k / A.burst.count) * TAU, 9, A.burst.range, Math.round(A.burst.dmg * mult), A.burst.proj, 0.5, true);
          p.status.invuln = Math.max(p.status.invuln || 0, 0.8);
          this.vx({ k: 'shake', amt: 3 });
          return;
        }
      }
      if (d <= 0) return;
    }
    d = this.gearPreHurt(d);                                 // armour and rings: barriers, sanctuary, counters (src/gearmech.js)
    d = this.rfPreHurt(d);                                   // Realmforge uniques (src/rf/uniqmech.js)
    if (d <= 0) return;
    if (p.status.armored) d = Math.ceil(d * 0.5);
    if (P.manashield && p.mp > 0) { const m = Math.min(p.mp, Math.round(d * P.manashield)); p.mp -= m; d -= m; }
    if (P.kintsugi) p.status.kintsugi = 3;
    if (P.emberthorns) for (const e of this.enemiesIn(p.x, p.y, 2.5)) this.ignite(e, P.emberthorns, 3);
    d = Math.max(0, Math.round(d));                          // damage is always a whole number
    const hp0 = p.hp;
    p.hp -= d;
    this.gearPostHurt(d, hp0);
    this.rfPostHurt(d, hp0);
    p.hitT = 0.15;
    this.sfx('hurt');
    this.vx({ k: 'hurt', amt: Math.min(4, 1 + d / 60) });
    this.float(...lift(p.x, p.y, 1.2), `-${d}`, '#e2546a');
    if (p.hp <= 0 && P.cheatdeath && !p.cheatT) {
      p.cheatT = P.cheatdeath; p.hp = this.stat('hp') * 0.4; p.status.invuln = 1.5;
      this.banner('Cheated death!', 1600);
      this.vx({ k: 'burst', ...liftO(p.x, p.y, 0.5), n: 30, colors: ['#f2c14e', '#fff6c8'] });
      return;
    }
    if (p.hp <= 0) this.killPlayer(by);
  }
  // how hard the world hits where you stand: about 55% on the coast, rising smoothly to 95% at the
  // god's heart. Dungeons have their own level.
  danger() {
    const m = this.map, p = this.player;
    if (m.rf || m.rfBoss) return 1;                       // a Realmforge dungeon: its band already sets its numbers (src/rf/balance.js)
    if (m.kind === 'dungeon') return { hive: 0.6, chapel: 0.7, crypt: 0.8, theatre: 0.82, forge: 0.9, ember: 0.95, spire: 0.97, dream: 1, heart: 1 }[Object.keys(DUNGEONS).find((k) => DUNGEONS[k] === m.def)] || 0.85;
    if (m.kind !== 'realm') return 1;
    const C = m.w / 2, d = Math.min(1, dist(p.x, p.y, C, C) / (C * 0.9));
    return 0.5 + 0.45 * (1 - d);
  }
  ignite(e, dps, t) { if (e.dead) return; e.burn = { dps: Math.max(dps, e.burn && e.burn.t > 0 ? e.burn.dps : 0), t, acc: e.burn ? e.burn.acc : 0 }; }
  killPlayer(by) {
    const p = this.player;
    p.hp = 0; p.dead = true; p.deadT = 0;
    const rep = this.fameReport(p), fame = rep.total, maxed = rep.maxed;
    this.deathInfo = { cls: p.cls, level: p.level, fame, base: rep.base, bonuses: rep.bonuses, by, kills: p.kills, maxed, date: new Date().toISOString().slice(0, 10) };
    this.save.classFame = this.save.classFame || {};
    this.save.classFame[p.cls] = Math.max(this.save.classFame[p.cls] || 0, rep.base);
    this.save.fame += fame;
    this.save.graveyard.unshift(this.deathInfo);
    this.save.graveyard = this.save.graveyard.slice(0, 30);
    this.save.bestLevel = Math.max(this.save.bestLevel || 0, p.level);
    this.save.chars = this.save.chars.filter((c) => c !== p);
    this.charIdx = null;
    this.deathShown = false;
    this.sfx('death');
    this.persist();
  }

  gainXp(n) {
    const p = this.player;
    if (p.status.rested > 0) n = Math.round(n * 1.25);
    p.totalXp += n;
    if (p.level >= MAX_LEVEL) {                          // level 20: experience becomes fame
      p.fameXp = (p.fameXp || 0) + n;
      let got = 0;
      while (p.fameXp >= FAME_XP) { p.fameXp -= FAME_XP; p.fame = (p.fame || 0) + 1; got++; }
      if (got) {
        this.float(...lift(p.x, p.y, 1.9), `+${got} fame`, '#ffb84a');
        const goal = FAME_GOALS.find((f) => p.fame - got < f && p.fame >= f);
        if (goal) { this.banner(`Fame goal reached: ${goal}`, 2200); this.sfx('level'); this.fx.push({ kind: 'ring', ...liftO(p.x, p.y, 0.5), t: 0, max: 3, color: '#ffb84a' }); }
      }
      return;
    }
    p.xp += n;
    while (p.level < MAX_LEVEL && p.xp >= xpToNext(p.level)) {
      p.xp -= xpToNext(p.level);
      p.level++;
      const C = CLASSES[p.cls];
      for (const s of STATS) p.base[s] = Math.min(C.max[s], p.base[s] + R.int(...C.grow[s]));
      p.hp = this.stat('hp'); p.mp = this.stat('mp');
      this.float(...lift(p.x, p.y, 1.6), 'LEVEL UP', '#f2c14e');
      this.sfx('level');
      this.fx.push({ kind: 'ring', ...liftO(p.x, p.y, 0.5), t: 0, max: 3, color: '#f2c14e' });
      this.vx({ k: 'levelup', ...liftO(p.x, p.y, 0.5) });
      this.banner(`Level ${p.level}`, 1400);
    }
    if (p.level >= MAX_LEVEL) { p.xp = 0; this.banner('Level 20! From now on, every kill earns fame.', 3200); }
  }
  // what a character's death is worth: base fame plus RotMG-style bonuses
  fameReport(p) {
    const base = p.fame || 0, B = [];
    const maxed = STATS.filter((s) => p.base[s] >= CLASSES[p.cls].max[s]).length;
    const pct = (name, k) => { const v = Math.floor(base * k); if (v > 0) B.push([name, v]); };
    if (maxed) pct(`Maxed stats (${maxed}/8)`, maxed * 0.05);
    if (p.bossKills) pct(`Boss slayer (${p.bossKills})`, Math.min(1, p.bossKills * 0.1));
    if (p.dungeons) pct(`Dungeon delver (${p.dungeons})`, Math.min(1, p.dungeons * 0.05));
    const eq = p.equip.filter(Boolean).map((id) => ITEMS[id]);
    if (eq.length === 4 && eq.every((it) => it.ut || it.mythic || (typeof it.tier === 'number' && it.tier >= (it.slot === 'ability' || it.slot === 'ring' ? 4 : 8)))) pct('Well equipped', 0.1);
    if (p.kills >= 1000) pct('Thousand cuts', 0.1);
    if (base && (p.petted || 0) > 0) B.push(['Friend of the cat', 1]);
    const firstBorn = base && !(this.save.graveyard || []).some((d) => d.cls === p.cls && d.fame >= base);
    if (firstBorn) pct('Ancestor (best of your class)', 0.1);
    return { base, bonuses: B, total: base + B.reduce((a, [, v]) => a + v, 0), maxed };
  }

  // ------------------------------------------------------------- enemies
  updateEnemies(dt) {
    const p = this.player;
    const act = (this.active = []), nb = (this.notable = []); this.activeMap = this.map;
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (Math.abs(e.x - p.x) < 30 && Math.abs(e.y - p.y) < 30) act.push(e);
      if (e.rb || e.herald || e.warden || e.D.melon) nb.push(e);
    }
    for (const e of this.enemies) {
      if (e.dead) { e.deadT += dt; continue; }
      const d2 = dist2(e.x, e.y, p.x, p.y);
      if (d2 > (e.rb ? 40 * 40 : ACTIVE_R * ACTIVE_R)) continue;
      e.hurtT = Math.max(0, e.hurtT - dt);
      this.tickStatus(e, dt);
      if (e.dead || e.D.dummy) continue;
      if (this.frozen(e)) continue;                     // Stop Time
      if (e.spawnT > 0) { e.spawnT -= dt; if (e.spawnT <= 0) { e.born = this.t; this.vx({ k: 'burst', x: e.x, y: e.y - 0.6, n: 20, colors: ['#ffd650', '#ffffff', '#c8a0ff'] }); } continue; }   // an elite arriving
      if ((e.asDormant || e.asWakeT > 0) && this.asDormantTick(e, dt)) continue;      // the Vault Keeper, asleep or waking (src/astral.js)
      if (e.D.ability && this.updateEliteAbility(e, dt, Math.sqrt(d2))) continue;   // an elite using its ability
      if (e.stunT > 0) { e.stunT -= dt; continue; }
      if (e.rb) { if (e.D.bx) this.updateBx(e, dt, Math.sqrt(d2)); else this.updateRealmBoss(e, dt, Math.sqrt(d2)); continue; }
      if (e.kids) {
        e.kids = e.kids.filter((k) => !k.dead);
        e.childT -= dt;
        if (e.childT <= 0) {
          e.childT = e.D.every * (0.8 + R() * 0.4);
          if (e.kids.length < e.D.cap && this.spawnChild(e)) this.vx({ k: 'burst', x: e.x, y: e.y - 0.6, n: 8, colors: ['#ffffff', '#c9ccd8'] });
        }
      }
      const D = e.D, d = Math.sqrt(d2);
      if (e.shellT > 0) {                                // the conch hermit, shut in its shell: then it pops out squirting
        e.shellT -= dt;
        if (e.shellT <= 0) { e.cds[0] = 0; this.vx({ k: 'burst', ...liftO(e.x, e.y, 0.4), n: 8, colors: ['#c8e8ff', '#ffffff', '#f2b8c8'] }); }
        continue;
      }
      if (e.fuseT !== undefined) {                       // a bomber, swelling: then BOOM
        e.fuseT -= dt;
        if (e.fuseT <= 0) {
          if (!p.dead && dist2(e.x, e.y, p.x, p.y) < D.bomb.r * D.bomb.r) this.hurtPlayer(D.bomb.dmg, D.name);
          for (let k = 0; k < 10; k++) this.shoot('e', ...lift(e.x, e.y, 0.4), (k / 10) * TAU, 5, 3, Math.round(D.bomb.dmg * 0.4), 'gasbubble', 0.35, false, D.name);
          this.vx({ k: 'boom', ...liftO(e.x, e.y, 0.4), r: D.bomb.r }); this.vx({ k: 'shake', amt: 4 });
          if (D.bombCloud) this.mrCloud(e.x, e.y);                   // a sporeling leaves its spores behind
          e.fuseT = undefined; this.damageEnemy(e, 1e9, e.x, e.y, true);
        }
        continue;
      }
      if (D.bomb && d < 1.7 && !p.dead && this.map.kind !== 'nexus') {
        e.fuseT = D.bomb.fuse; this.speak(e, 'atk', 0.6);
        this.fx.push({ kind: 'zone', x: e.x, y: e.y, r: D.bomb.r, t: 0, delay: D.bomb.fuse, life: D.bomb.fuse + 0.1, dmg: 0, by: D.name, done: false, colors: ['#8db03a', '#d4ff5a'] });
        continue;
      }
      if (D.contact && !p.dead && !e.under && (e.contactT = (e.contactT || 0) - dt) <= 0 && d2 < 0.7) { e.contactT = 0.6; this.hurtPlayer(D.contact, D.name); }
      // engaged: within its aggro range, or chasing you still (4 s of memory, out to 1.6x the range: a detour round a
      // wall can take it further from you than where it started, and it must not lose interest halfway round)
      if (d < D.aggro) e.engagedUntil = this.t + 4;
      const aggro = (d < D.aggro || (e.engagedUntil > this.t && d < D.aggro * 1.6)) && !p.dead && this.map.kind !== 'nexus';
      e.st -= dt;
      if (aggro && D.heal && (e.healT = (e.healT === undefined ? D.heal.every : e.healT) - dt) <= 0) {   // menders mend
        e.healT = D.heal.every;
        for (const o of this.enemiesIn(e.x, e.y, D.heal.r)) {
          if (o === e || o === this.boss || o.dead || o.hp >= o.maxHp) continue;
          o.hp = Math.min(o.maxHp, o.hp + o.maxHp * D.heal.pct);
          this.vx({ k: 'heal', ...liftA(e.x, e.y, 0.6), ...liftB(o.x, o.y, 0.6) });
          this.float(...lift(o.x, o.y, 1.2), '+', '#7aff9a');
        }
      }
      // queued burst waves
      for (const q of e.queue) q.t -= dt;
      while (e.queue.length && e.queue[0].t <= 0) { const q = e.queue.shift(); this.firePattern(e, q.atk, true); }
      if (e.state !== 'sleep') this.rxSignature(e, dt, Math.sqrt(d2));   // a champion's signature volley (src/remaster.js)

      if (e.state === 'tell') {
        if (e.st <= 0) {
          const atk = D.attacks[e.atk];
          if (atk.charge) { e.state = 'charge'; e.st = 0.7; const a = angleTo(e.x, e.y, p.x, p.y); e.cvx = Math.cos(a) * atk.charge; e.cvy = Math.sin(a) * atk.charge; }
          else { e.state = 'attack'; e.st = 0.18; this.firePattern(e, atk); this.speak(e, 'atk', 0.008); if (atk.pick) this.throwPick(e, atk); }
        }
        continue;
      }
      if (e.state === 'charge') {
        this.moveCircle(e, e.cvx * dt, e.cvy * dt, 0.4);
        if (D.contact && dist2(e.x, e.y, p.x, p.y) < 0.8) { this.hurtPlayer(D.contact, D.name); e.st = 0; }
        if (e.st <= 0) { e.state = 'attack'; e.st = 0.2; this.firePattern(e, D.attacks[e.atk]); }
        continue;
      }
      if (e.state === 'attack' && e.st > 0) continue;
      e.state = 'move';
      // attacks (not while burrowed, mid-hop or mid-dive)
      if (aggro && !e.under && !e.hop && !e.dive && !e.sk && !e.fetch && !(D.ai === 'carousel' && !e.loose)) {
        if (!e.seen) this.speak(e, 'see', e.herald ? 0.5 : 0.05);
        e.seen = true;
        if (D.enrage && !e.enraged && e.hp < e.maxHp * 0.4) {        // ENRAGE: faster, angrier
          e.enraged = true; this.speak(e, 'hurt', 1);
          this.vx({ k: 'burst', ...liftO(e.x, e.y, 0.8), n: 16, colors: ['#ff2a3a', '#ff7a1a'] });
        }
        for (let k = 0; k < D.attacks.length; k++) {
          e.cds[k] -= dt * (1 - (e.slowF || 0) * 0.6) * (e.enraged ? 1.6 : 1) * (e.cuedUntil > this.t ? 1.6 : 1);
          const A = D.attacks[k];
          if (A.when && (A.when === 'hot') !== (e.hp < e.maxHp * 0.35)) continue;    // the scorpion's split stinger waits for it to run hot
          if (e.cds[k] <= 0 && d < A.range + 1 && (!AIMED.has(A.pattern) || (A.mv && A.mv.lob) || this.foe(e) !== p || D.noclip || this.seesFoe(e, p))) {   // (no shot aimed at you through a wall: it comes round first; mortars lob over)
            e.cds[k] = A.cd * (0.85 + R() * 0.3);
            e.atk = k; e.state = 'tell'; e.st = A.tell / 1000;
            break;
          }
        }
        if (e.state === 'tell') continue;
      }
      this.moveEnemy(e, dt, aggro, d);
    }
    const A = this.active;                          // gentle separation so crowds spread out
    for (let i = 0; i < A.length; i++) {
      const a = A[i];
      if (a.rb || a.D.speed === 0) continue;                 // rooted things (and the melon) don't get shoved about
      for (let j = i + 1; j < A.length; j++) {
        const b = A[j];
        if (b.rb || b.D.speed === 0) continue;
        const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy, min = (a.D.r + b.D.r) * 0.75;
        if (d2 > 0.0001 && d2 < min * min) {
          const d = Math.sqrt(d2), push = (min - d) * 0.25 / d;
          this.moveCircle(a, -dx * push, -dy * push, 0.35); this.moveCircle(b, dx * push, dy * push, 0.35);   // (the same body as it walks with: a smaller one shoved it into corners it then could not leave)
        }
      }
    }
    this.enemies = this.map.enemies = this.enemies.filter((e) => !e.dead || e.deadT < (e.rb ? 1.4 : 0.6));
  }
  // Movement styles (ENEMIES[id].ai):
  //   shamble, kite, orbit, drift, charge - the originals
  //   flank  - circles you on one side, then switches sides      float  - drifts while flying
  //   zigzag - weaves toward you                                  rooted - never moves
  //   hop    - leaps in arcs, lands in a puff of dust             skitter - darts in short bursts
  //   swoop  - circles, then dives straight through you          burrow - tunnels under you, surfaces to attack
  //   blink  - keeps its distance, teleports around you
  moveEnemy(e, dt, aggro, d) {
    const D = e.D, ai = D.ai, p = aggro ? this.foe(e) : this.player;
    if (ai === 'satellite') return this.asSatellite(e, dt);          // orrery drones wheel round their acolyte
    if (ai === 'carousel' && this.hmHorse(e, dt, aggro)) return;    // carousel horses ride their circle
    if (e.fetch) {                                       // the crag dwarf runs to where his pick fell, and picks it up
      if (this.t < e.fetch.land) return;
      const dd = dist(e.x, e.y, e.fetch.x, e.fetch.y);
      if (dd < 0.45 || this.t > e.fetch.land + 5) { e.fetch = null; this.vx({ k: 'burst', x: e.x, y: e.y, n: 6, colors: ['#8a7e6a', '#c8b890'] }); return; }
      const s = D.speed * 1.7 * dt;
      this.moveCircle(e, ((e.fetch.x - e.x) / dd) * s, ((e.fetch.y - e.y) / dd) * s, 0.35);
      return;
    }
    let tx = e.wx, ty = e.wy, sp = D.speed * 0.65;
    if (e.under && !aggro) this.surface(e);
    if (aggro) {
      sp = D.speed;
      const keep = D.keep || 0.9;
      const a = angleTo(p.x, p.y, e.x, e.y);
      if (ai === 'orbit') { const b = a + 0.9; tx = p.x + Math.cos(b) * keep; ty = p.y + Math.sin(b) * keep; }
      else if (ai === 'drift' || ai === 'float') { e.phase += dt * 2; tx = p.x + Math.cos(a + Math.sin(e.phase)) * keep; ty = p.y + Math.sin(a + Math.sin(e.phase)) * keep; }
      else if (ai === 'kite' || ai === 'charge' || ai === 'blink' || ai === 'hop' || ai === 'skitter') { const k2 = Math.max(keep, ai === 'hop' || ai === 'skitter' ? 1.6 : keep); tx = p.x + Math.cos(a) * k2; ty = p.y + Math.sin(a) * k2; }
      else if (ai === 'flank') {
        // its side: away from where its allies near you already are (a pack takes both sides); left alone, it switches now and then
        const crowd = () => { let push = 0; for (const o of this.active) { if (o === e || o.dead || o.rb || !o.D.speed || dist2(o.x, o.y, p.x, p.y) > 36) continue; const da = Math.atan2(Math.sin(a - angleTo(p.x, p.y, o.x, o.y)), Math.cos(a - angleTo(p.x, p.y, o.x, o.y))); if (Math.abs(da) < 1.6) push += Math.sign(da || 1) * (1.6 - Math.abs(da)); } return push; };
        if (!e.side) { const c = crowd(); e.side = Math.abs(c) > 0.3 ? Math.sign(c) : R() < 0.5 ? 1 : -1; }
        if ((e.flipT = (e.flipT === undefined ? 3 + R() * 3 : e.flipT) - dt) <= 0) { e.flipT = 3 + R() * 3; const c = crowd(); e.side = Math.abs(c) > 0.3 ? Math.sign(c) : -e.side; }
        const b = a + e.side * (0.6 + 0.3 * Math.sin(this.t * 0.8 + e.phase)) + this.packSpread(e, p, a, dt), k3 = Math.max(2.5, keep);   // (spaced round you with the rest of its pack)
        tx = p.x + Math.cos(b) * k3; ty = p.y + Math.sin(b) * k3; sp *= 1.15;
      } else if (ai === 'swoop') {
        if (e.dive) {                                     // the dive: straight through where you were
          const V = e.dive;
          this.moveCircle(e, V.vx * dt, V.vy * dt, 0.35); V.t -= dt;
          if (V.t <= 0) e.dive = null;
          if (!V.hit && dist2(e.x, e.y, this.player.x, this.player.y) < 0.6) { V.hit = true; this.hurtPlayer(Math.round((D.contact || D.attacks[0].dmg) * 1.2), D.name); }
          return;
        }
        if (e.diveWarn !== undefined) {                    // hangs in the air, shrieking, then dives
          e.diveWarn -= dt;
          if (e.diveWarn <= 0) {
            e.diveWarn = undefined;
            const da = angleTo(e.x, e.y, p.x, p.y), sv = D.speed * 3;
            e.dive = { vx: Math.cos(da) * sv, vy: Math.sin(da) * sv, t: (d + 3) / sv };
            this.vx({ k: 'burst', ...liftO(e.x, e.y, 0.8), n: 6, colors: ['#ffffff'] });
          }
          return;
        }
        if ((e.diveT = (e.diveT === undefined ? 3 + R() * 2 : e.diveT) - dt) <= 0) { e.diveT = 4.5 + R() * 3; e.diveWarn = 0.55; return; }
        const b = a + 0.75, k4 = Math.max(4, keep); tx = p.x + Math.cos(b) * k4; ty = p.y + Math.sin(b) * k4; sp *= 1.2;
      } else if (ai === 'burrow') {
        if (e.digT !== undefined) {                       // digging in: it shakes and throws up dirt first
          e.digT -= dt;
          if (Math.random() < 0.5) this.vx({ k: 'burst', x: e.x, y: e.y, n: 2, colors: ['#5a4e44', '#8a7e6a'] });
          if (e.digT <= 0) { e.digT = undefined; e.under = true; e.burT = 1.6 + R() * 0.6; this.vx({ k: 'burst', x: e.x, y: e.y, n: 14, colors: ['#5a4e44', '#8a7e6a'] }); }
          return;
        }
        if ((e.burT = (e.burT === undefined ? 4 + R() * 3 : e.burT) - dt) <= 0) {
          if (e.under) { if (!e.rumble) { e.rumble = 0.7; e.burT = 0.7; } else { e.rumble = 0; this.surface(e); } }   // rumble, then surface
          else e.digT = 0.8;
        }
        if (e.under && e.rumble) sp = 0;                   // the mound stops and trembles: it's about to come up here
        else if (e.under) { sp = D.speed * 2; const b = a + Math.sin(this.t * 2 + e.phase) * 0.9; tx = p.x + Math.cos(b) * 2.2; ty = p.y + Math.sin(b) * 2.2; }
        else { sp = D.speed * 0.6; tx = p.x + Math.cos(a) * 3; ty = p.y + Math.sin(a) * 3; }
      } else if (ai === 'zigzag' && !(p === this.player && !D.noclip && !this.seesFoe(e, p, true))) {
        e.phase += dt * 6;
        if (d > 1.3) {
          const to = angleTo(e.x, e.y, p.x, p.y), w = Math.sin(e.phase) * 1.2;
          let vx = Math.cos(to) + Math.cos(to + Math.PI / 2) * w, vy = Math.sin(to) + Math.sin(to + Math.PI / 2) * w;
          const l = Math.hypot(vx, vy), s2 = sp * (1 - (e.slowF || 0)) * dt;
          this.moveCircle(e, (vx / l) * s2, (vy / l) * s2, 0.35);
        }
        return;
      } else if (ai === 'rooted') { sp = 0; }
      else if (ai === 'flee') { sp *= 1.1; tx = e.x + Math.cos(angleTo(p.x, p.y, e.x, e.y) + Math.sin(this.t * 2 + e.phase) * 0.6) * 4; ty = e.y + Math.sin(angleTo(p.x, p.y, e.x, e.y) + Math.sin(this.t * 2 + e.phase) * 0.6) * 4; }
      else {                                              // a plain chaser: it comes at you from its own side of the pack
        // (a local rule: the bearings of its allies already near you push its own bearing away from theirs, so a pack
        // closes in from several sides instead of one; far off it arcs toward its side, close in it takes its place)
        const a0 = angleTo(p.x, p.y, e.x, e.y), so = this.packSpread(e, p, a0, dt), r = d < 2.5 ? 1.0 : Math.min(d - 0.5, 3);
        tx = p.x + Math.cos(a0 + so) * r; ty = p.y + Math.sin(a0 + so) * r;
        if (d < 1.2 && Math.abs(so) < 0.25) sp = 0;
      }
      if (ai === 'blink') {
        if (e.blinkTo) {                                  // the warning: it shimmers here while a mark glows there
          e.blinkTo.t -= dt;
          if (e.blinkTo.t <= 0) {
            this.vx({ k: 'burst', ...liftO(e.x, e.y, 0.5), n: 12, colors: ['#ffffff', '#b888ff', '#3a3048'] });
            e.x = e.blinkTo.x; e.y = e.blinkTo.y; e.blinked = this.t; e.blinkTo = null;
            this.vx({ k: 'burst', ...liftO(e.x, e.y, 0.5), n: 12, colors: ['#ffffff', '#b888ff', '#3a3048'] });
          }
          return;
        }
        if ((e.blinkT = (e.blinkT === undefined ? 5 + R() * 4 : e.blinkT) - dt) <= 0) {
          e.blinkT = 8 + R() * 5;                         // rare
          for (let k = 0; k < 10; k++) {
            const ang = R() * TAU, rr = 3.5 + R() * 2.5, x = p.x + Math.cos(ang) * rr, y = p.y + Math.sin(ang) * rr;
            if (!isSolid(this.map, x, y)) { e.blinkTo = { x, y, t: 0.9 }; break; }
          }
          return;
        }
      }
    } else {
      e.wt -= dt;
      const pa = e.parent && !e.parent.dead ? e.parent : null;          // children mill around their parent
      if (e.wt <= 0) {
        e.wt = 1.2 + R() * 1.8;
        const cx = pa ? pa.x : e.hx, cy = pa ? pa.y : e.hy, rad = pa ? 5 : 8;
        e.wx = cx + (R() - 0.5) * rad; e.wy = cy + (R() - 0.5) * rad;
      }
      if (pa && dist(e.x, e.y, pa.x, pa.y) > 7) { e.wx = pa.x; e.wy = pa.y; sp = D.speed; }
      if (ai === 'rooted') sp = 0;
    }
    // a wall between you: come round it (by the flow field) instead of pressing into it. Kiters do too, until they
    // have a clear shot again; rooted things, burrowers underground, divers mid-dive and ghosts that pass walls don't
    if (aggro && p === this.player && sp > 0 && !D.noclip && !e.under && !e.dive && ai !== 'rooted' && ai !== 'flee' && !e.lureTo && !this.seesFoe(e, p, true)) {   // (wide: a line its body can walk)
      const w = this.flowStep(e);
      if (w) { tx = w[0]; ty = w[1]; sp = D.speed; }
    }
    if (aggro && e.parent && !e.parent.dead && dist(e.x, e.y, e.parent.x, e.parent.y) > 13) { tx = e.parent.x; ty = e.parent.y; }
    if (e.lureTo && this.t < e.lureTo.until) { tx = e.lureTo.x; ty = e.lureTo.y; sp = D.speed * 1.2; }   // the striker's bell calls them
    if (e.rallyUntil > this.t) sp *= 1.35;                       // the war banner's aura
    if (D.leash) { const lh = dist(tx, ty, e.hx, e.hy); if (lh > D.leash) { tx = e.hx + ((tx - e.hx) / lh) * D.leash; ty = e.hy + ((ty - e.hy) / lh) * D.leash; } }   // a doorway's guard keeps to its door
    sp *= (1 - (e.slowF || 0)) * (e.enraged ? 1.5 : 1);
    if (ai === 'hop') return this.hopToward(e, tx, ty, sp, dt);
    if (ai === 'skitter') return this.skitterToward(e, tx, ty, sp, dt);
    // steer, don't snap: velocity eases toward where it wants to go, so monsters glide and curve like in RotMG
    const dd = dist(e.x, e.y, tx, ty);
    let dvx = 0, dvy = 0;
    if (dd > 0.2 && sp > 0) { const v = Math.min(sp, dd * 3); dvx = ((tx - e.x) / dd) * v; dvy = ((ty - e.y) / dd) * v; }
    const ease = Math.min(1, dt * weightOf(D) * (aggro ? 1 : 0.62));   // its weight (src: WEIGHT); a little lazier while it wanders
    e.mvx = (e.mvx || 0) + (dvx - (e.mvx || 0)) * ease; e.mvy = (e.mvy || 0) + (dvy - (e.mvy || 0)) * ease;
    if (Math.abs(e.mvx) + Math.abs(e.mvy) > 0.02) { if (D.noclip) { e.x += e.mvx * dt; e.y += e.mvy * dt; } else this.moveCircle(e, e.mvx * dt, e.mvy * dt, 0.35); }   // balloon ghouls float over the canvas
  }
  // the crag dwarf's throw: the pick lands where it falls (short of a wall), and he must fetch it before throwing again
  throwPick(e, A) {
    const p = this.foe(e), a = angleTo(e.x, e.y, p.x, p.y);
    let L = 0;
    while (L < A.range && !isSolid(this.map, e.x + Math.cos(a) * (L + 0.5), e.y + Math.sin(a) * (L + 0.5))) L += 0.5;
    e.fetch = { x: e.x + Math.cos(a) * L, y: e.y + Math.sin(a) * L, land: this.t + L / A.speed };
  }
  surface(e) {
    if (e.D.surfaceFling) e.cds[0] = Math.min(e.cds[0], 0.25);   // the mole comes up flinging dirt
    e.under = false; e.burT = 7 + R() * 4;                // stays up a good while before it digs again
    this.vx({ k: 'burst', x: e.x, y: e.y, n: 16, colors: ['#5a4e44', '#8a7e6a', '#c8b890'] });
    e.born = this.t;                                    // rises out of the ground again
    e.dusted = false;
  }
  hopToward(e, tx, ty, sp, dt) {                       // leap, hang, land, crouch, leap
    if (e.hop) {
      const H = e.hop;
      H.t += dt;
      this.moveCircle(e, H.vx * dt, H.vy * dt, 0.35);
      const k = Math.min(1, H.t / H.T);
      e.z = Math.sin(Math.PI * k) * H.h;
      if (k >= 1) { e.hop = null; e.z = 0; e.landT = this.t; e.restT = 0.3 + R() * 0.4; this.vx({ k: 'dust', x: e.x, y: e.y }); this.vx({ k: 'dust', x: e.x + 0.3, y: e.y }); }
      return;
    }
    e.restT = (e.restT === undefined ? R() * 0.5 : e.restT) - dt;
    if (e.restT > 0) return;
    const dd = dist(e.x, e.y, tx, ty);
    if (dd < 0.4 || sp <= 0) return;
    const len = Math.min(dd, sp * 0.9 + 0.8), T = 0.42;
    e.hop = { vx: ((tx - e.x) / dd) * len / T, vy: ((ty - e.y) / dd) * len / T, t: 0, T, h: 5 + len * 2.5 };
  }
  skitterToward(e, tx, ty, sp, dt) {                   // short darts with nervous pauses
    if (e.sk) {
      this.moveCircle(e, e.sk.vx * dt, e.sk.vy * dt, 0.35);
      if ((e.sk.t -= dt) <= 0) { e.sk = null; e.restT = 0.2 + R() * 0.45; }
      return;
    }
    e.restT = (e.restT || 0) - dt;
    if (e.restT > 0) return;
    const dd = dist(e.x, e.y, tx, ty);
    if (dd < 0.3 || sp <= 0) return;
    const s2 = sp * 3.2, near = dd < 0.8;
    // a dart toward its spot, never past it; once there, a sideways dart (it skitters round you, not in and out)
    const a = near ? angleTo(e.x, e.y, tx, ty) + (R() < 0.5 ? 1 : -1) * (Math.PI / 2 + (R() - 0.5) * 0.6) : angleTo(e.x, e.y, tx, ty) + (R() - 0.5) * 1.4;
    e.sk = { vx: Math.cos(a) * s2, vy: Math.sin(a) * s2, t: near ? 0.12 + R() * 0.06 : Math.min(0.16 + R() * 0.1, dd / s2) };
  }
  firePattern(e, A, isWave = false) {
    A = this.rxAlt(e, A);                                // now and then a monster's new shot (src/remaster.js)
    const p = this.foe(e);
    const [ox, oy] = this.up(e.x, e.y, e.hitUp || (e.rb ? 1.4 : 0.5));
    const [px, py] = this.up(p.x, p.y, 0.4);
    const aim = angleTo(ox, oy, px, py);
    if (e.rb && A.pattern === 'radial') this.vx({ k: 'shake', amt: 2 });
    const size = A.size || 0.35;
    if (A.waves && !isWave) for (let w = 1; w < A.waves; w++) e.queue.push({ t: w * A.gap, atk: A });
    if (A.mv && A.mv.lob) return this.lobVolley(e, A, ox, oy, p);
    const nm = e.D ? e.D.name : 'The Unstruck';
    if (A.pattern === 'wall') {                        // a marching wall of shots, perpendicular to you
      const perp = aim + Math.PI / 2;
      for (let k = 0; k < A.count; k++) {
        const o = (k - (A.count - 1) / 2) * (A.space || 0.6);
        this.shoot('e', ox + Math.cos(perp) * o, oy + Math.sin(perp) * o, aim, A.speed, A.range, A.dmg, A.proj, size, false, nm);
      }
      return;
    }
    if (A.pattern === 'cage') {                        // shots blink into a ring around YOU, hang, then close in
      const cx = p.x, cy = p.y - 0.4;
      for (let k = 0; k < A.count; k++) {
        const a = (k / A.count) * TAU + R() * 0.2;
        const b = this.shoot('e', cx + Math.cos(a) * A.r, cy + Math.sin(a) * A.r, a + Math.PI, A.speed, A.range, A.dmg, A.proj, size, false, nm);
        b.mv = { hold: 0.55 };
      }
      this.vx({ k: 'burst', x: cx, y: cy, n: 8, colors: ['#ff4a5a'] });
      return;
    }
    if (A.pattern === 'orbit') {                       // shots swing around the shooter, then fling outward
      for (let k = 0; k < A.count; k++) {
        const b = this.shoot('e', ox, oy, 0, A.speed, A.range, A.dmg, A.proj, size, false, nm);
        b.orb = { e, r: A.r || 1.4, a: (k / A.count) * TAU, w: 4, t: A.spin || 1 };
      }
      return;
    }
    if (A.pattern === 'shotgun') {                     // a ragged blast: random spread, random speeds
      for (let k = 0; k < A.count; k++) this.shoot('e', ox, oy, aim + (R() - 0.5) * (A.arc || 0.8), A.speed * (0.6 + R() * 0.7), A.range, A.dmg, A.proj, size, false, nm);
      return;
    }
    if (A.pattern === 'cross') {                       // + then x, alternating
      e.crossT = (e.crossT || 0) + 1;
      const base = e.crossT % 2 ? Math.PI / 4 : 0, n = A.count;
      for (let k = 0; k < n; k++) this.shoot('e', ox, oy, base + (k / n) * TAU, A.speed, A.range, A.dmg, A.proj, size, false, nm);
      return;
    }
    if (A.pattern === 'beam') {                        // a laser: a thin red warning line, then a searing beam
      this.fx.push({ kind: 'laser', x0: ox, y0: oy, a: aim, len: A.range, t: 0, tele: (A.tele || 0.55), act: 0.35, life: (A.tele || 0.55) + 0.45,
        dmg: A.dmg, by: nm, hit: false, col: A.col || '#ffd650' });
      return;
    }
    const tag = (b, k) => { if (A.mv) { b.mv = A.mv; b.cs = A.mv.alt && k % 2 ? -1 : 1; } if (A.chill) b.chill = A.chill; if (A.bounce) { b.bounce = A.bounce; b.life *= 1.6; } if (A.pull) b.pull = A.pull; if (A.ap) b.ap = true; };
    if (A.pattern === 'radial') {
      e.spin = (e.spin || 0) + (A.turn || 0);
      for (let k = 0; k < A.count; k++) tag(this.shoot('e', ox, oy, e.spin + (k / A.count) * TAU, A.speed, A.range, A.dmg, A.proj, size, false, e.D.name), k);
    } else {
      for (let k = 0; k < A.count; k++) {
        const off = A.count > 1 ? (k / (A.count - 1) - 0.5) * (A.arc || 0) : 0;
        tag(this.shoot('e', ox, oy, aim + off, A.speed, A.range, A.dmg, A.proj, size, false, e.D.name), k);
      }
    }
  }
  damageEnemy(e, dmg, x, y, quiet = false, crit = false) {
    if (e.dead || e.state === 'dead') return 0;
    if (e.spawnT > 0) return 0;                                  // an elite still arriving
    if (e.bulwarkT > this.t) { if (!quiet) this.float(x, y - 0.8, 'BULWARK', '#ff8fbf'); return 0; }   // the reef golem's shell
    if (e.asDormant) this.asWake(e);                              // the Vault Keeper wakes when struck
    if (e.wardT > this.t) { if (!quiet) this.float(x, y - 0.8, 'WARDED', '#ffd690'); return 0; }   // an astrolabe sentinel's ring ward
    if (e.rallyUntil > this.t) dmg = Math.round(dmg * 0.7);       // an orc under the war banner
    if (e.surviveUntil > this.t) { if (!quiet) this.float(x, y - 0.8, 'SURVIVE!', '#ff8c1e'); return 0; }
    if (e.frenzyUntil > this.t) { if (!quiet) this.float(x, y - 0.8, e.D.bloodlust ? 'BLOODLUST' : 'INVULNERABLE', '#ff4a5a'); return 0; }
    if (e.invulnT > 0) { if (!quiet) this.float(x, y - 0.8, 'IMMUNE', '#8d88a0'); return 0; }
    if (e.D && e.D.shell) {                                    // a flurry of hits sends the conch hermit into its shell
      if (e.shellT > 0) { if (!quiet) this.float(x, y - 0.8, 'CLINK', '#c8e8ff'); return 0; }
      e.shellHits = (e.shellLast > this.t - 0.6 ? e.shellHits || 0 : 0) + 1; e.shellLast = this.t;
      if (e.shellHits >= 4 && !(e.shellCd > this.t)) { e.shellHits = 0; e.shellT = 1.5; e.shellCd = this.t + 4.5; e.state = 'move'; e.queue.length = 0; }   // then 3 s out, exposed
    }
    if (e.rb && this.d4Immune(e, x, y, quiet)) return 0;
    if (e.D && e.D.bx && !e.bxKill && this.bxImmune(e, x, y, quiet)) return 0;
    if (e.id === 'sleepers_nightmare') this.d4LinkHit(e, dmg);
    if (e.rb) dmg = Math.round(dmg * this.d4DamageMult(e));
    if (e.shieldBy && e.shieldBy.some((m) => !m.dead)) { if (!quiet) this.float(x, y - 0.8, 'SHIELDED', '#8af6ff'); return 0; }
    if (this.frozen(e)) dmg = Math.round(dmg * 1.3);           // caught in stopped time: every blow lands harder
    if (e.curseT > 0) dmg = Math.round(dmg * (1 + e.curseF));   // hexed
    if (e.reflectUntil > this.t) {                             // the Colossus's blazing core: your shot comes back
      if (!this.reflectCd || this.reflectCd < this.t) {
        this.reflectCd = this.t + 0.12;
        const p = this.player, a = angleTo(e.x, e.y - 1, ...lift(p.x, p.y, 0.4));
        this.shoot('e', e.x, e.y - 1, a + (R() - 0.5) * 0.3, 8, 12, e.reflectDmg, e.reflectProj, 0.45, false, e.D.name);
      }
      if (!quiet) this.float(x, y - 0.8, 'REFLECTED', '#ffffff');
      return 0;
    }
    let d = mitigate(dmg, e.D ? e.D.def : BOSS.def, false);
    const SV = e.rb && !e.survived && e.D.phases && e.D.phases.find((ph) => ph.survive);
    if (SV && e.hp - d <= e.maxHp * SV.at) {                 // the last of its life: it refuses to die, and you must survive it
      d = Math.max(0, Math.round(e.hp - e.maxHp * SV.at));
      e.hp = e.maxHp * SV.at; e.survived = true; e.surviveUntil = this.t + SV.survive; e.st = 0;
      this.banner(SV.name || `${e.D.name} cannot be hurt. SURVIVE!`, 3200); this.vx({ k: 'shake', amt: 8 }); this.sfx('boss');
      return d;
    }
    if (this.map.ckCandles || (this.map.def && this.map.def.style === 'keep')) d = this.ckDamage(e, d);   // the Keep: thralls burn in candlelight
    if (e.D && e.D.bx && !e.bxKill) d = this.bxClamp(e, d);
    e.hp -= d; e.hurtT = 0.12;
    if (e.D && e.D.melon) { e.melonHurt = this.t; this.vx({ k: 'regfx', key: 'mx_effects/melon_hit', x, y: y - 0.2, fps: 14 }); }
    if (e.id === 'coin_imp' && R() < 0.35) { const g0 = 8 + Math.floor(R() * 20); this.save.gold = (this.save.gold || 0) + g0; this.float(e.x, e.y - 1.4, `+${g0}g`, '#ffd650'); this.sfx('coin'); }
    if (!quiet) { this.sfx('hit'); this.vx({ k: 'hit', x, y, crit }); }
    this.float(x, y - 0.8, crit ? `${d}!` : `${d}`, crit ? '#ffd650' : quiet ? '#ff9a5a' : '#ffffff');
    const P = this.passive();
    if (P.manaonhit && !quiet) this.player.mp = Math.min(this.stat('mp'), this.player.mp + P.manaonhit);
    if (!e.dead && e.hp < e.maxHp * 0.3 && !e.lowSaid && !(e.D && e.D.dummy)) { e.lowSaid = true; this.speak(e, 'hurt', 0.08); }
    if (e.D && e.D.dummy) {                              // training dummies never die: they count your damage instead
      e.hp = e.maxHp;
      e.log = (e.log || []).filter((l) => this.t - l[0] < 3); e.log.push([this.t, d]);
      return d;
    }
    if (e.hp <= 0 && !e.dead) {
      if (e === this.boss) { this.killBoss(); return d; }
      e.dead = true; e.deadT = 0;
      if (e.soulT) this.sigilOnKill(e);                         // a soul-marked kill gives Mana back (src/sigils.js)
      if (e.page13 === 1) this.mythPageDeath(e);                // the Thirteenth Page passes its hex on (src/mythics.js)
      this.gearOnKill(e);                                       // rings and armour that answer a kill (src/gearmech.js)
      this.rfOnKill(e);
      if (e.cloneOf) { this.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 30, colors: ['#ffffff', '#8af6ff'] }); this.bubble(e, 'An echo shatters.', '#cfffff'); return d; }
      this.player.kills++;
      this.speak(e, 'die', e.rb ? 1 : 0.04);
      if (e.D.confetti) { this.vx({ k: 'regfx', key: 'd2_effects/hollowmoon.confetti_pop', x: e.x, y: e.y - 0.6, fps: 10 }); const g0 = 3 + Math.floor(R() * 4); this.save.gold = (this.save.gold || 0) + g0; this.float(e.x, e.y - 1.4, `+${g0}g`, '#f2c14e'); }
      if (e.D.deathBurst) { const B = e.D.deathBurst, a0 = R() * TAU; for (let k = 0; k < B.n; k++) this.shoot('e', ...lift(e.x, e.y, 0.4), a0 + (k / B.n) * TAU, B.speed, B.range, B.dmg, B.proj, 0.35, false, e.D.name); }
      if (e.D.asDeath) this.asDeath(e);                       // a meteor mite's ring of embers; the Vault Keeper's fall (src/astral.js)
      if (e.D.split) for (let k = 0; k < e.D.split.n; k++) {   // splitters burst into smaller copies
        const a = (k / e.D.split.n) * TAU, x = e.x + Math.cos(a) * 0.7, y = e.y + Math.sin(a) * 0.7;
        if (!isSolid(this.map, x, y)) this.addEnemy(e.D.split.id, x, y);
      }
      this.questEvent('kill', e);
      if (P.killheal) { const p = this.player; p.hp = Math.min(this.stat('hp'), p.hp + P.killheal); }
      if (P.manaonkill) this.player.mp = Math.min(this.stat('mp'), this.player.mp + P.manaonkill);
      if (P.killburst) {
        const n = 8, dm = Math.round(e.maxHp * 0.08 * P.killburst + 40 * P.killburst);
        for (let k = 0; k < n; k++) this.shoot('p', ...lift(e.x, e.y, 0.5), (k / n) * TAU, 8, 3.5, Math.min(dm, 4000), 'tombshard', 0.4, false);
      }
      if (e.thrallOf) e.thrallOf = null;
      this.vx({ k: 'death', e, big: !!e.rb });
      if (e.D.melon) this.melonBurst(e);
      this.sfx(e.rb || e.herald ? 'bigkill' : 'kill');
      const gold = Math.max(1, Math.round(e.D.xp / 6));
      this.save.gold = (this.save.gold || 0) + gold;
      if (gold >= 20) this.float(...lift(e.x, e.y, 1.6), `+${gold}g`, '#f2c14e');
      if (e.rb) this.vx({ k: 'shake', amt: 6 });
      this.gainXp(e.D.xp);
      if (e.rb) {
        this.banner(`${e.D.name} has fallen!`, 3000);
        this.fx.push({ kind: 'ring', x: e.x, y: e.y - 1, t: 0, max: 6, color: '#f2c14e' });
      }
      if (e.herald) { this.heraldDown(e); this.questEvent('herald', e); }
      if (e.curseT > 0 && this.abilityMod() === 'contagion') {   // the Thirteenth Page: the hex leaps to the living
        for (const o of this.enemiesIn(e.x, e.y, 3.5)) if (o !== e && !o.dead) { o.curseT = Math.max(o.curseT || 0, 5); o.curseF = Math.max(o.curseF || 0, e.curseF); }
        this.fx.push({ kind: 'hexzone', x: e.x, y: e.y, r: 3.5, t: 0, life: 0.9 });
      }
      if (e.warden) this.breakSeal(`${e.D.name.split(',')[0]} falls.`);
      if (e.rb) { this.questEvent(this.map.kind === 'dungeon' ? 'dungeon' : 'rboss', e); this.trophy(e.id); if (this.map.kind === 'dungeon') this.player.dungeons = (this.player.dungeons || 0) + 1; else this.player.bossKills = (this.player.bossKills || 0) + 1; }
      const items = rollLoot(e.D.loot, e.D.lootLuck || 1);
      const egg = this.eggDrop(e);
      if (egg) items.push(egg);
      const key = this.keyDrop(e);
      if (key) items.push(key);
      if (items.length) this.addBag(e.x, e.y, items);
      if (this.map.kind === 'realm') {
        const pd = portalDrop(e.D, e.id);
        if (pd && R() < pd[1]) this.openPortal(pd[0], e.x + (e.rb ? 1.5 : 0), e.y);
      } else if (e.rb && this.map.kind === 'dungeon') {
        this.map.portals.push({ kind: 'realm', x: e.x + 1.5, y: e.y + 1, label: 'Back to the Realm', to: 'realm', life: 90 });
      }
    }
    return d;
  }
  // a player projectile (or thrall bolt) connects: damage + every on-hit effect of its weapon
  playerHit(e, b) {
    const sp = b.sp;
    let base = b.dmg;
    if (sp && sp.accel) base = Math.round(base * (0.55 + 0.9 * Math.min(1, Math.hypot(b.vx, b.vy) / 22)));   // speed is damage
    const { dmg, crit } = this.hitDamage(e, base, sp);
    const dealt = this.damageEnemy(e, dmg, b.x, b.y, false, crit);
    if (dealt && this.player.runeSigil) this.sigilOnHit(e);   // a rune sigil answers your hits inside it
    if (dealt && b.from === 'p') this.gearOnHit(e, b, dealt);   // armour and rings that count your hits (src/gearmech.js)
    if (dealt && b.from === 'p') this.rfOnHit(e, b, dealt);     // Realmforge uniques (src/rf/uniqmech.js)
    if (!sp || !dealt) return;
    if (sp.mech) { if (b.sig) this.mechSigHit(e, b, dealt); else this.mechHit(e, b, dealt); }
    const p = this.player;
    if (sp.lifesteal) p.hp = Math.min(this.stat('hp'), p.hp + dealt * sp.lifesteal);
    if (sp.burn) this.ignite(e, sp.burn.dps, sp.burn.t);
    if (sp.slow && e !== this.boss && !e.rb) { e.slowT = sp.slow.t; e.slowF = sp.slow.f; }
    if (sp.curse) { e.curseF = Math.max(e.curseT > 0 ? e.curseF || 0 : 0, sp.curse.f); e.curseT = Math.max(e.curseT || 0, sp.curse.t); }
    if (sp.explode) {
      for (const o of this.enemiesIn(b.x, b.y, sp.explode.r)) if (o !== e) this.damageEnemy(o, Math.round(b.dmg * sp.explode.f), ...lift(o.x, o.y, 0.5), true);
      this.vx({ k: 'boom', x: b.x, y: b.y, r: sp.explode.r });
    }
    if (sp.chain) {
      let from = e; const seen = new Set([e]);
      for (let k = 0; k < sp.chain.n; k++) {
        const nx = this.enemiesIn(from.x, from.y, 4.5).filter((o) => !seen.has(o)).sort((a, c) => dist2(a.x, a.y, from.x, from.y) - dist2(c.x, c.y, from.x, from.y))[0];
        if (!nx) break;
        seen.add(nx);
        this.vx({ k: 'zap', ...liftA(from.x, from.y, 0.5), ...liftB(nx.x, nx.y, 0.5) });
        this.damageEnemy(nx, Math.round(b.dmg * sp.chain.f), ...lift(nx.x, nx.y, 0.5), true);
        from = nx;
      }
    }
    if (sp.split && !sp.split.onEnd && !b.child) this.splitShot(b, sp.split);
    if (sp.quake && !b.child) {
      for (let k = 0; k < sp.quake.n; k++) {
        const c = this.shoot('p', b.x, b.y, (k / sp.quake.n) * TAU, 7, 3, Math.round(b.dmg * sp.quake.f), sp.quake.proj, 0.4, true);
        c.child = true;
      }
      if (sp.quake.stun && e !== this.boss && !e.rb && R() < 0.35) this.stun(e, sp.quake.stun);
      this.vx({ k: 'shake', amt: 2 });
    }
  }
  splitShot(b, S) {
    const a0 = Math.atan2(b.vy, b.vx);
    for (let k = 0; k < S.n; k++) {
      const c = this.shoot('p', b.x, b.y, a0 + (k / S.n) * TAU + 0.3, 8, 3.2, Math.round(b.dmg * S.f), S.proj, 0.35, false);
      c.child = true;
    }
  }
  // enemy shots with a personality: waves, accelerating, curving, braking-and-retargeting, boomerangs, splitting
  steerEnemyShot(b, dt) {
    const M = b.mv;
    b.t = (b.t || 0) + dt;
    if (b.ha === undefined) { b.ha = Math.atan2(b.vy, b.vx); b.hs = Math.hypot(b.vx, b.vy); b.s0 = b.hs; }
    if (M.hold && b.t < M.hold) { b.vx = 0; b.vy = 0; b.life += dt; return false; }   // hangs, glinting, then moves
    if (M.d4 || M.jerk || M.serp || M.refract || M.disperse || M.blink) { const got = this.steerD4(b, dt, M); if (got !== undefined) return got; }
    if (M.seek) {                                      // a seeker: it turns to follow you
      const f = this.foe({ x: b.x, y: b.y }), want = angleTo(b.x, b.y, ...lift(f.x, f.y, 0.4));
      let da = ((want - b.ha + Math.PI * 3) % TAU) - Math.PI;
      b.ha += Math.max(-M.seek * dt, Math.min(M.seek * dt, da));
    }
    if (M.accel) b.hs = Math.min(b.s0 * (M.max || 3), b.hs + M.accel * dt);
    if (M.curve) b.ha += M.curve * (b.cs || 1) * dt;
    if (M.brake && !b.re && b.t > M.brake) {
      b.hs = Math.max(0.15, b.hs - b.hs * 7 * dt);       // stops dead in the air...
      if (b.t > M.brake + 0.35) {                        // ...then snaps toward you
        const f = this.foe({ x: b.x, y: b.y });
        b.re = true; b.ha = angleTo(b.x, b.y, ...lift(f.x, f.y, 0.4)); b.hs = M.re || b.s0 * 1.6; b.life = Math.max(b.life, 2.2);
      }
    }
    if (M.boomer && !b.back && b.t > M.boomer) { b.back = true; b.ha += Math.PI; b.life = Math.max(b.life, M.boomer + 0.2); }
    if (M.split && b.t >= M.split.at) {
      const n = M.split.n;
      for (let k = 0; k < n; k++) this.shoot('e', b.x, b.y, b.ha + (k / n) * TAU, M.split.speed || 4, M.split.range || 3.5, Math.round(b.dmg * 0.6), M.split.proj || b.sprite, 0.3, false, b.by).shard = true;   // (a shot's own pieces: shards)
      this.vx({ k: 'burst', x: b.x, y: b.y, n: 5, colors: ['#ffffff'] });
      return true;
    }
    b.vx = Math.cos(b.ha) * b.hs; b.vy = Math.sin(b.ha) * b.hs;
    if (M.wave) {
      const w = M.wave.amp * M.wave.freq * Math.cos(M.wave.freq * b.t + (b.cs === -1 ? Math.PI : 0)), perp = b.ha + Math.PI / 2;
      b.vx += Math.cos(perp) * w; b.vy += Math.sin(perp) * w;
    }
    b.a = Math.atan2(b.vy, b.vx);
    return false;
  }
  lobLand(b) {
    const p = this.player, L = b.lob;
    if (!p.dead && dist2(p.x, p.y, L.x1, L.y1) < L.r * L.r) {
      this.hurtPlayer(b.dmg, b.by);
      (this.hitVols = this.hitVols || new Map()).set(`${this.frameN || 0}:${b.by}`, this.t);   // its shards are the same blow
    }
    if (L.onLand) { L.onLand(this, b); return; }
    for (let k = 0; k < L.n; k++) { const s = this.shoot('e', L.x1, L.y1, (k / L.n) * TAU + L.t, L.ss, 3, Math.round(b.dmg * 0.5), L.sprite || b.sprite, 0.3, false, b.by); s.shard = true; if (L.bxOf) s.bxOf = L.bxOf; }   // (shards of a shot already thrown: they land even if the thrower has died)
    this.vx({ k: 'burst', x: L.x1, y: L.y1, n: 12, colors: ['#ffffff', '#c8c0b0', '#8d88a0'] });
  }
  // lobbed volley: aimed lobs land on and around you; radial lobs land in a ring around the thrower
  lobVolley(e, A, ox, oy, f) {
    const n = Math.min(A.count, 6), lob = A.mv.lob;
    for (let k = 0; k < n; k++) {
      let x1, y1;
      if (A.pattern === 'radial') { const a = (k / n) * TAU + (e.spin = (e.spin || 0) + 0.4); const rr = Math.min(A.range * 0.6, 4.5); x1 = e.x + Math.cos(a) * rr; y1 = e.y + Math.sin(a) * rr; }
      else if (k === 0) { x1 = f.x; y1 = f.y; }
      else { const a = R() * TAU, d = 0.8 + R() * (lob.spread || 1.6); x1 = f.x + Math.cos(a) * d; y1 = f.y + Math.sin(a) * d; }
      const T = Math.max(0.55, Math.min(1.4, dist(ox, oy, x1, y1) / A.speed));
      const b = this.shoot('e', ox, oy, angleTo(ox, oy, x1, y1), A.speed, 99, A.dmg, A.proj, 0.4, false, e.D.name);
      b.lob = { x0: ox, y0: oy, x1, y1, t: 0, T, h: lob.h || 28, n: lob.n || 6, r: 0.95, ss: lob.ss || 3.5 };
    }
  }
  // burning + slowed enemies (and the dungeon boss) tick here
  tickStatus(e, dt) {
    if (e.slowT > 0) { e.slowT -= dt; if (e.slowT <= 0) e.slowF = 0; }
    if (e.curseT > 0) { e.curseT -= dt; if (e.curseT <= 0) e.curseF = 0; }
    if (e.burn && e.burn.t > 0) {
      e.burn.t -= dt; e.burn.acc += dt;
      if (e.burn.acc >= 0.5) { e.burn.acc -= 0.5; this.damageEnemy(e, Math.round(e.burn.dps * 0.5), ...lift(e.x, e.y, 0.8), true); }
    }
  }
  addBag(x, y, items) {
    let made = null;
    for (let k = 0; k < items.length; k += 8) {
      const chunk = items.slice(k, k + 8);
      const it = [...chunk, ...Array(8 - chunk.length).fill(null)];
      const kind = bagFor(chunk.map((id) => ITEMS[id]));
      const rare = BAG_ORDER.indexOf(kind) >= BAG_ORDER.indexOf('white');
      const legend = chunk.some((id) => ITEMS[id] && ITEMS[id].legendary);
      made = { x: x + (k ? 0.6 : 0), y, items: it, kind, rare, legend, life: rare ? 180 : 90, until: this.t + (rare ? 180 : 90) };
      this.bags.push(made);
      if (legend) this.banner('A LEGENDARY drops!', 3600);
      else if (rare) this.banner(`${BAG_NAMES[kind] || "A rare bag"} drops!`, 2800);
      this.sfx(rare ? 'rare' : 'loot');
    }
    return made;
  }

  // ------------------------------------------------------------- realm bosses (scripted events)
  updateRealmBoss(e, dt, d) {
    const p = this.player, D = e.D;
    if (e.surviveUntil && this.t >= e.surviveUntil && !e.dead) {   // you lived through it: it burns out and falls
      e.surviveUntil = 0; e.invulnT = 0;
      this.banner(`${D.name} burns out. You survived!`, 3000);
      this.damageEnemy(e, e.hp * 10 + 1e7, e.x, e.y - 1);
      return;
    }
    if (e.state === 'sleep') {                         // dungeon bosses wait in their room
      const R0 = e.room;
      if (p.x > R0.x && p.x < R0.x + R0.w && p.y > R0.y && p.y < R0.y + R0.h) {
        e.state = 'idle'; e.st = 1.2; this.banner(D.name.toUpperCase(), 2600); this.vx({ k: 'shake', amt: 5 }); this.sfx('boss');
      }
      return;
    }
    this.rxPhaseTick(e, dt);                             // the remaster's phases 2 and 3 (src/remaster.js)
    this.spAmbient(e, dt);                               // a boss's own background layer (src/setpieces.js)
    if (this.bossD4Tick(e, dt)) return;
    e.st -= dt;
    e.invulnT = Math.max(0, e.invulnT - dt);
    for (const q of e.queue) q.t -= dt;
    while (e.queue.length && e.queue[0].t <= 0) { const q = e.queue.shift(); this.firePattern(e, q.atk, true); }
    const [ox, oy] = this.up(e.x, e.y, 1.4);
    for (const S of e.spirals || []) {
      S.t -= dt; S.acc -= dt;
      while (S.acc <= 0 && S.t > 0) {
        S.acc += S.every; S.spin += S.turn;
        for (let k = 0; k < S.arms; k++) this.shoot('e', ox, oy, S.spin + (k / S.arms) * TAU, S.speed, S.range, S.dmg, S.proj, 0.38, false, D.name);
      }
    }
    if (e.spirals) e.spirals = e.spirals.filter((S) => S.t > 0);
    if (e.stream) {
      const S = e.stream;
      S.t -= dt; S.acc -= dt;
      while (S.acc <= 0 && S.t > 0) {
        S.acc += S.every;
        const a = angleTo(ox, oy, ...this.up(p.x, p.y, 0.4)) + Math.sin(this.t * 7) * S.wobble;
        this.shoot('e', ox, oy, a, S.speed, S.range, S.dmg, S.proj, 0.4, false, D.name);
      }
      if (S.t <= 0) e.stream = null;
    }
    const engaged = d < D.aggro && !p.dead;
    if (e.state === 'tell') {
      if (e.st > 0) return;
      const M = e.move;
      if (M.blink) this.bossBlink(e, M.blink);
      if (M.say) { e.sayT = 0; this.speak(e, 'see', 1); }        // Emily simply cannot help herself
      if (M.dash) { const a = angleTo(e.x, e.y, p.x, p.y); e.dashing = { vx: Math.cos(a) * M.dash.speed, vy: Math.sin(a) * M.dash.speed, t: M.dash.dur, acc: 0, D: M.dash }; }
      if (M.orbit) e.orbiting = { t: M.orbit.dur, a: angleTo(p.x, p.y, e.x, e.y), speed: M.orbit.speed, r: M.orbit.r };
      if (M.zones) this.bossZones(e, M.zones);
      if (M.gapring) this.gapRing(e, M.gapring);
      if (M.sweep) this.fx.push({ kind: 'sweep', e, n: M.sweep.n, a0: R() * TAU, w: M.sweep.speed * (R() < 0.5 ? 1 : -1), len: M.sweep.len || 12,
        t: 0, tele: 0.8, life: 0.8 + M.sweep.dur, dmg: M.sweep.dmg, by: D.name, hitT: 0 });
      if (M.pull) e.pulling = { force: M.pull.force, t: M.pull.dur };
      if (M.arena) {
        const rm = e.room;
        this.arena = { x: rm ? rm.cx + 0.5 : e.x, y: rm ? rm.cy + 0.5 : e.y, r0: M.arena.r0, r1: M.arena.r1, t: 0, dur: M.arena.dur, dmg: M.arena.dmg, tick: 0, owner: e };
        this.banner('The walls close in!', 2000);
      }
      if (M.flood && e.room) this.floodRoom(e.room, M.flood.ring);
      // ---- signature mechanics (each belongs to exactly one boss)
      if (M.meteor) this.meteors(e, M.meteor);
      this.bossD4Move(e, M);                                // the four newer dungeons' bosses (src/dungeons4.js)
      // ---- wave 3 signatures, one more per boss
      const by = D.name, box = this.arenaBox(e);
      if (M.tidewall) this.fx.push({ kind: 'tidewall', e, t: 0, life: M.tidewall.n * M.tidewall.every + 0.2, next: 0, left: M.tidewall.n, box, ...M.tidewall, by });
      if (M.seekers) for (let k = 0; k < M.seekers.n; k++) {
        const a = (k / M.seekers.n) * TAU, b = this.shoot('e', e.x, e.y - 1, a, M.seekers.speed, M.seekers.speed * M.seekers.life, M.seekers.dmg, M.seekers.proj, 0.5, false, by);
        b.mv = { seek: M.seekers.turn || 2.2 }; b.burst = { n: M.seekers.burst, dmg: Math.round(M.seekers.dmg * 0.6), proj: M.seekers.proj };
      }
      if (M.rotor) this.fx.push({ kind: 'rotor', e, t: 0, life: M.rotor.dur, acc: 0, a: R() * TAU, dir: 1, flipT: M.rotor.flip, ...M.rotor, by });
      if (M.blitz) this.fx.push({ kind: 'blitz', e, t: 0, life: M.blitz.n * 0.8 + 0.3, step: 0, left: M.blitz.n, phaseT: 0, ...M.blitz, by });
      if (M.ricochet) for (let k = 0; k < M.ricochet.n; k++) {
        const a = angleTo(e.x, e.y, p.x, p.y) + (k - (M.ricochet.n - 1) / 2) * 0.35, b = this.shoot('e', e.x, e.y - 1, a, M.ricochet.speed, 40, M.ricochet.dmg, M.ricochet.proj, 0.45, false, by);
        b.bounce = M.ricochet.bounces || 3; b.life = M.ricochet.life || 6;
      }
      if (M.lattice) {                                    // a grid of stars hangs around you, then all fly the same way at once
        const L = M.lattice, a = r4(), cx = p.x, cy = p.y;
        for (let i = -L.size; i <= L.size; i++) for (let j = -L.size; j <= L.size; j++) {
          if (Math.abs(i) + Math.abs(j) < 1) continue;
          const x = cx + i * L.gap, y = cy + j * L.gap;
          if (isSolid(this.map, x, y)) continue;
          const b = this.shoot('e', x - Math.cos(a) * 0.01, y, a, L.speed, 14, L.dmg, L.proj, 0.4, false, by);
          b.mv = { hold: L.delay };
        }
      }
      if (M.whirlpool) this.fx.push({ kind: 'whirlpool', e, t: 0, life: M.whirlpool.dur, cx: p.x, cy: p.y, spawned: false, ...M.whirlpool, by });
      if (M.pulse) this.fx.push({ kind: 'pulse', e, t: 0, life: M.pulse.n * M.pulse.every + 0.1, next: 0, left: M.pulse.n, rot: R() * TAU, ...M.pulse, by });
      if (M.mirror) { this.mirrorBy = { name: by, cx: box.cx, cy: box.cy, until: this.t + M.mirror.dur }; this.banner('The Archivist reflects. Watch both sides!', 1800); }
      if (M.eclipse) this.fx.push({ kind: 'eclipse', e, t: 0, life: M.eclipse.waves * M.eclipse.every + 0.1, next: 0, left: M.eclipse.waves, rot: R() * TAU, ...M.eclipse, by });
      if (M.echo) this.fx.push({ kind: 'echo', e, t: 0, life: M.echo.dur + M.echo.delay, hist: [], acc: 0, ...M.echo, by });
      if (M.frenzyFire) this.banner(M.frenzyFire, 1600);
      if (M.tether) { e.tether = { r: M.tether.r, t: M.tether.dur, dmg: M.tether.dmg, tick: 0.6 }; this.banner('Stay close: the tether burns!', 1800); }
      if (M.orbitals) {
        const O = M.orbitals;
        this.fx.push({ kind: 'orbitals', e, n: O.n, r0: O.r0, r1: O.r1, spin: O.spin * (R() < 0.5 ? 1 : -1), a0: R() * TAU, t: 0, life: O.dur, dmg: O.dmg, proj: O.proj, hitT: 0, by: D.name });
      }
      if (M.bounce) { const a = angleTo(e.x, e.y, p.x, p.y); e.dashing = { vx: Math.cos(a) * M.bounce.speed, vy: Math.sin(a) * M.bounce.speed, t: M.bounce.dur, acc: 0, D: M.bounce, bounces: M.bounce.bounces, n: 0 }; }
      if (M.edgefire) {
        const E = M.edgefire, R0 = E.r || 12;
        for (let w = 0; w < (E.waves || 1); w++) {
          const off = R() * TAU;
          for (let k = 0; k < E.n; k++) {
            const a = off + (k / E.n) * TAU, sx = e.x + Math.cos(a) * R0, sy = e.y + Math.sin(a) * R0;
            const b = this.shoot('e', sx, sy, a + Math.PI + (R() - 0.5) * 0.2, E.speed, R0 * 2, E.dmg, E.proj, 0.4, false, D.name);
            if (w) { b.x -= b.vx * w * 0.35; b.y -= b.vy * w * 0.35; b.life += w * 0.35; }
          }
        }
      }
      if (M.mines) {
        const Mn = M.mines;
        for (let k = 0; k < Mn.n; k++) {
          const a = R() * TAU, d = 1.5 + R() * Mn.spread;
          this.fx.push({ kind: 'mine', x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, t: 0, life: Mn.delay + k * 0.12, shards: Mn.shards, dmg: Mn.dmg, proj: Mn.proj, by: D.name });
        }
      }
      if (M.constellation) {
        const C = M.constellation, pts = [];
        for (let k = 0; k < C.n; k++) { const a = (k / C.n) * TAU + R() * 0.6, d = C.r * (0.7 + R() * 0.5); pts.push([p.x + Math.cos(a) * d, p.y + Math.sin(a) * d]); }
        this.fx.push({ kind: 'constellation', pts, t: 0, tele: C.delay, life: C.delay + C.dur, dmg: C.dmg, hitT: 0, by: D.name });
      }
      if (M.clones) this.makeClones(e, M.clones.n);
      // the Tidebound Lich: it takes your place, and it puts out the lights
      if (M.soulswap) { this.fx.push({ kind: 'soulswap', e, t: 0, delay: M.soulswap.delay, life: M.soulswap.delay + 0.3, dmg: M.soulswap.dmg, proj: M.soulswap.proj, by: D.name }); this.banner('The Lich reaches for your soul...', 1600); }
      if (M.darkness) { this.darkStart = this.t; this.darkUntil = this.t + M.darkness.dur; this.darkR = M.darkness.r; this.darkBy = e; this.banner('The candles gutter out.', 1800); }
      // the Forgeheart Colossus: roads of fire, and a core that throws your shots back
      if (M.lanes) {
        const Ln = M.lanes, a0 = (e.laneTurn = (e.laneTurn || 0) + 1) * (Math.PI / Ln.n / 2) + angleTo(e.x, e.y, p.x, p.y);
        for (let k = 0; k < Ln.n; k++) this.fx.push({ kind: 'lane', e, x: e.x, y: e.y, a: a0 + (k / Ln.n) * TAU, len: Ln.len, w: Ln.w || 0.8, t: 0, delay: Ln.delay, life: Ln.delay + Ln.dur, dmg: Ln.dmg, hitT: 0, by: D.name });
      }
      if (M.setpiece) e.spUntil = this.t + this.spStart(e, M.setpiece);   // a set piece: it plays out before the boss moves on (src/setpieces.js)
      if (M.reflect) { e.reflectUntil = this.t + M.reflect.dur; e.reflectDmg = M.reflect.dmg; e.reflectProj = M.reflect.proj; this.banner('Its core blazes white: hold your fire!', 1800); }
      if (M.shield) {                                  // invulnerable until its summoned guard is dead
        const guard = [];
        const rm = e.room, spots = M.shield.corners && rm
          ? [[rm.x + 3, rm.y + 3], [rm.x + rm.w - 4, rm.y + 3], [rm.x + 3, rm.y + rm.h - 4], [rm.x + rm.w - 4, rm.y + rm.h - 4]].map(([x, y]) => [x + 0.5, y + 0.5])
          : Array.from({ length: M.shield.count }, (_, k) => [e.x + Math.cos((k / M.shield.count) * TAU) * 2.5, e.y + Math.sin((k / M.shield.count) * TAU) * 2.5]);
        for (const [mx, my] of spots.slice(0, M.shield.count)) {
          if (!isSolid(this.map, mx, my)) { const mn = this.addEnemy(M.shield.id || D.summon, mx, my); mn.minion = true; mn.seen = true; guard.push(mn); }
        }
        e.shieldBy = guard;
        this.banner(`${D.name} is shielded: kill its guard!`, 2200);
      }
      for (const f of M.fire || []) {
        if (f.delay) e.queue.push({ t: f.delay, atk: f });
        else this.firePattern(e, f);
      }
      e.queue.sort((a, b) => a.t - b.t);
      const sp = [...(M.spiral ? [M.spiral] : []), ...(M.spirals || [])];
      e.spirals = (e.spirals || []).concat(sp.map((S) => ({ ...S, t: S.dur, acc: 0, spin: e.spin || 0 })));
      if (M.stream) e.stream = { ...M.stream, t: M.stream.dur, acc: 0 };
      if (M.invuln) e.invulnT = M.invuln;
      if (M.summon) {
        for (let k = 0; k < M.summon; k++) {
          const a = (k / M.summon) * TAU, mx = e.x + Math.cos(a) * 2, my = e.y + Math.sin(a) * 2;
          if (!isSolid(this.map, mx, my)) { const mn = this.addEnemy(D.summon, mx, my); mn.minion = true; }
        }
      }
      e.state = 'attack';
      e.st = Math.max(0.35, ...sp.map((S) => S.dur), M.stream ? M.stream.dur : 0, M.invuln || 0, M.dash ? M.dash.dur : 0, M.orbit ? M.orbit.dur : 0, e.spUntil > this.t ? e.spUntil - this.t : 0);
      return;
    }
    if (e.dashing) {                                   // a charge: barrels at where you were, shedding shots
      const Dd = e.dashing;
      Dd.t -= dt; Dd.acc -= dt;
      const ox = e.x, oy = e.y;
      this.moveCircle(e, Dd.vx * dt, Dd.vy * dt, 0.6);
      if (Dd.D.trail && Dd.acc <= 0) {
        Dd.acc = Dd.D.trail.every || 0.12;
        const a0 = Math.atan2(Dd.vy, Dd.vx);
        for (const s0 of [-1, 1]) this.shoot('e', ...lift(e.x, e.y, 0.8), a0 + s0 * Math.PI / 2, Dd.D.trail.speed || 3, Dd.D.trail.range || 5, Dd.D.trail.dmg, Dd.D.trail.proj, 0.4, false, D.name);
      }
      if (dist2(e.x, e.y, p.x, p.y) < (D.r + 0.4) ** 2 && !Dd.hitP) { Dd.hitP = true; this.hurtPlayer(Dd.D.dmg || 100, D.name); }
      const stuck = Math.abs(e.x - ox) + Math.abs(e.y - oy) < 1e-4;
      if (stuck && Dd.bounces && Dd.n < Dd.bounces) {          // Emily's belly slide: off the wall and back at you
        Dd.n++; Dd.hitP = false;
        const a = angleTo(e.x, e.y, p.x, p.y) + (R() - 0.5) * 0.5, sp0 = Math.hypot(Dd.vx, Dd.vy);
        Dd.vx = Math.cos(a) * sp0; Dd.vy = Math.sin(a) * sp0; Dd.t = Math.max(Dd.t, 0.6);
        this.vx({ k: 'burst', ...liftO(e.x, e.y, 0.5), n: 16, colors: ['#ffffff', '#a8e2ff'] }); this.vx({ k: 'shake', amt: 3 });
      } else if (Dd.t <= 0 || stuck) {
        if (Dd.D.slam) this.bossZones(e, { ...Dd.D.slam, at: 'self' });
        e.dashing = null;
      }
    }
    if (e.pulling) {                                   // the undertow: you're dragged toward it
      e.pulling.t -= dt;
      const d0 = dist(p.x, p.y, e.x, e.y);
      if (d0 > 1.6 && !p.dead) this.moveCircle(p, ((e.x - p.x) / d0) * e.pulling.force * dt, ((e.y - p.y) / d0) * e.pulling.force * dt, PLAYER_R);
      if (Math.random() < 0.5) this.vx({ k: 'suck', x: e.x, y: e.y, px: p.x, py: p.y });
      if (e.pulling.t <= 0) e.pulling = null;
    }
    if (e.tether) {                                    // the Unstruck God's tether: wander outside the ring and it burns
      const T = e.tether;
      T.t -= dt; T.tick -= dt;
      if (!p.dead && dist(p.x, p.y, e.x, e.y) > T.r && T.tick <= 0) { T.tick = 0.5; this.hurtPlayer(T.dmg, 'the tether'); }
      if (T.t <= 0) e.tether = null;
    }
    if (e.orbiting) {                                  // circles you while it works
      const O = e.orbiting;
      O.t -= dt; O.a += O.speed * dt;
      const tx = p.x + Math.cos(O.a) * O.r, ty = p.y + Math.sin(O.a) * O.r, dd = dist(e.x, e.y, tx, ty);
      if (dd > 0.05) { const st = Math.min(dd, (D.speed + 4) * dt); this.moveCircle(e, ((tx - e.x) / dd) * st, ((ty - e.y) / dd) * st, 0.6); }
      if (O.t <= 0) e.orbiting = null;
    }
    if (e.state === 'attack') {
      if (e.st > 0) return;
      const enr = e.hp < e.maxHp * 0.2 ? 0.6 : 1;      // enraged below 20%: barely pauses between moves
      e.state = 'idle'; e.st = e.move.recover * enr; e.special = false;
      return;
    }
    // idle: reposition, then pick the next move from the current phase
    if (engaged && D.mstyle && this.spMove(e, dt, D.mstyle, d)) { /* its own way of moving (src/setpieces.js) */ }
    else if (engaged) {
      const a = angleTo(p.x, p.y, e.x, e.y);
      const tx = p.x + Math.cos(a) * D.keep, ty = p.y + Math.sin(a) * D.keep;
      const dd = dist(e.x, e.y, tx, ty);
      const step = Math.min(dd, D.speed * (e.hp < e.maxHp * 0.2 ? 1.6 : 1) * dt);
      if (dd > 0.3) this.moveCircle(e, ((tx - e.x) / dd) * step, ((ty - e.y) / dd) * step, 0.6);
    } else this.moveEnemy(e, dt, false, d);
    if (e.st > 0 || !engaged) return;
    const ratio = e.hp / e.maxHp;
    let pi = 0;
    D.phases.forEach((ph, i) => { if (ratio <= ph.at) pi = i; });
    if (pi !== e.phaseIdx) {                       // phase break: immune, special pose, a shockwave, new script
      e.phaseIdx = pi; e.cycleIdx = 0;
      if (D.phases[pi].frenzy) { e.frenzyUntil = this.t + D.phases[pi].frenzy; e.frenzyLen = D.phases[pi].frenzy; }
      this.onPhaseD4(e, D.phases[pi]);
      e.sayT = 0; this.speak(e, 'see', 1);
      this.banner(D.phases[pi].name || `${D.name} grows desperate!`, 2400);
      const first = Object.values(D.moves).find((mv) => mv.fire)?.fire[0];
      const open = D.phases[pi].open && D.moves[D.phases[pi].open];
      e.move = open ? { ...open, special: true, tell: Math.max(1.2, open.tell), invuln: Math.max(1.2, open.invuln || 0) }
        : { special: true, tell: 1.4, invuln: 1.4, recover: 0.6, fire: first ? [{ ...first, pattern: 'radial', count: 16, delay: 0 }] : [] };
      e.invulnT = e.move.invuln; e.special = true; e.state = 'tell'; e.st = e.move.tell;
      for (const c of this.enemies) if (c.cloneOf === e && !c.dead) { c.dead = true; c.deadT = 0; this.vx({ k: 'burst', x: c.x, y: c.y - 1, n: 20, colors: ['#ffffff', '#8af6ff'] }); }
      this.vx({ k: 'shake', amt: 6 });
      return;
    }
    const PH = D.phases[pi], cyc = e.frenzyUntil > this.t || !PH.after ? PH.cycle : PH.after;   // a frenzy phase runs its own script, then settles
    if ((e.talkT = (e.talkT === undefined ? 0 : e.talkT) - 1) <= 0) { e.talkT = e.id === 'emily_the_yapper' ? 2 + Math.floor(R() * 3) : 10 + Math.floor(R() * 8); e.sayT = 0; this.speak(e, 'see', 1); }
    { const mv = cyc[e.cycleIdx++ % cyc.length]; e.move = D.moves[mv === 'rx' ? `rx${e.rxPhase || 1}` : mv] || D.moves[mv]; }   // 'rx': the remaster's attack for the phase it's in
    e.special = !!e.move.special;
    e.state = 'tell'; e.st = e.move.tell;
    if (e.move.blink) { e.blinkTo = this.blinkSpot(e, e.move.blink.r); e.st = Math.max(e.st, 0.9); }
  }
  blinkSpot(e, r0) {
    const p = this.player;
    for (let k = 0; k < 12; k++) {
      const a = R() * TAU, x = p.x + Math.cos(a) * r0, y = p.y + Math.sin(a) * r0;
      if (!isSolid(this.map, x, y) && !isSolid(this.map, x + 0.7, y) && !isSolid(this.map, x - 0.7, y)) return { x, y, t: 1 };
    }
    return null;
  }

  // the edges of a boss room sink under black water, shrinking the arena
  floodRoom(rm, ring) {
    const m = this.map, p = this.player;
    for (let y = rm.y; y < rm.y + rm.h; y++) for (let x = rm.x; x < rm.x + rm.w; x++) {
      const edge = Math.min(x - rm.x, rm.x + rm.w - 1 - x, y - rm.y, rm.y + rm.h - 1 - y);
      if (edge < ring) { m.tiles[y * m.w + x] = TID.water; m.solid[y * m.w + x] = 1; }
    }
    m.miniDirty = true;
    p.x = Math.max(rm.x + ring + 1, Math.min(rm.x + rm.w - ring - 1, p.x));
    p.y = Math.max(rm.y + ring + 1, Math.min(rm.y + rm.h - ring - 1, p.y));
    this.vx({ k: 'shake', amt: 5 });
    this.banner('The chapel floods!', 1800);
  }
  // mirror echoes: fragile copies that fight alongside it; the real one hides among them
  makeClones(e, n) {
    const D = e.D;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU + R(), x = e.x + Math.cos(a) * 4, y = e.y + Math.sin(a) * 3;
      if (isSolid(this.map, x, y)) continue;
      const cyc = D.phases[0].cycle.filter((c) => !D.moves[c].special);
      const c = { id: e.id, rb: true, cloneOf: e, D: { ...D, name: D.name + ' (echo)', phases: [{ at: 1, cycle: cyc.length ? cyc : D.phases[0].cycle }] },
        x, y, hx: x, hy: y, hp: Math.round(e.maxHp * 0.05), maxHp: Math.round(e.maxHp * 0.05), state: 'idle', st: 0.8 + k * 0.4, queue: [], spin: 0,
        invulnT: 0, phaseIdx: 0, cycleIdx: k, deadT: 0, hurtT: 0, wx: x, wy: y, wt: 0, phase: R() * TAU, cds: [], room: e.room, born: this.t };
      this.enemies.push(c);
    }
    this.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 40, colors: ['#ffffff', '#8af6ff', '#cfffff'] });
    this.banner(`${D.name} splits into echoes!`, 2000);
  }
  // the room a boss fights in (or a box around it in the open realm)
  arenaBox(e) {
    const rm = e.room;
    if (rm) return { x0: rm.x + 0.5, y0: rm.y + 0.5, x1: rm.x + rm.w - 0.5, y1: rm.y + rm.h - 0.5, cx: rm.cx + 0.5, cy: rm.cy + 0.5 };
    return { x0: e.x - 12, y0: e.y - 10, x1: e.x + 12, y1: e.y + 10, cx: e.x, cy: e.y };
  }
  updateBossFx(dt) {
    const p = this.player;
    for (const f of this.fx) {
      const E = f.e;
      if (E && (E.dead || E.state === 'dead') && ['tidewall', 'rotor', 'blitz', 'whirlpool', 'pulse', 'eclipse', 'echo'].includes(f.kind)) { f.life = 0; continue; }
      if (f.kind === 'tidewall' && (f.next -= dt) <= 0 && f.left > 0) {   // a wall of water sweeps across the room, with one gap
        f.next = f.every; f.left--;
        const B = f.box, horiz = R() < 0.5, from = R() < 0.5, span = horiz ? B.y1 - B.y0 : B.x1 - B.x0, g0 = R() * (span - f.gap);
        for (let s = 0; s <= span; s += 0.75) {
          if (s > g0 && s < g0 + f.gap) continue;
          const x = horiz ? (from ? B.x0 : B.x1) : B.x0 + s, y = horiz ? B.y0 + s : (from ? B.y0 : B.y1);
          const a = horiz ? (from ? 0 : Math.PI) : (from ? Math.PI / 2 : -Math.PI / 2);
          this.shoot('e', x, y, a, f.speed, (horiz ? B.x1 - B.x0 : B.y1 - B.y0) + 1, f.dmg, f.proj, 0.45, false, f.by);
        }
      }
      if (f.kind === 'rotor') {                          // a spinning flower of shots that keeps reversing
        f.acc -= dt; f.flipT -= dt;
        if (f.flipT <= 0) { f.flipT = f.flip; f.dir = -f.dir; }
        while (f.acc <= 0) {
          f.acc += f.every; f.a += f.turn * f.dir;
          for (let k = 0; k < f.arms; k++) this.shoot('e', E.x, E.y - 1, f.a + (k / f.arms) * TAU, f.speed, f.range || 10, f.dmg, f.proj, 0.4, false, f.by);
        }
      }
      if (f.kind === 'blitz') {                          // three charges at you, each ending in a ring
        f.phaseT -= dt;
        if (f.phaseT <= 0 && f.left > 0) {
          if (f.step === 0) { f.tx = p.x; f.ty = p.y; f.step = 1; f.phaseT = 0.35; this.vx({ k: 'shake', amt: 2 }); }
          else { f.step = 0; f.left--; f.phaseT = 0.45; for (let k = 0; k < f.ring; k++) this.shoot('e', E.x, E.y - 1, (k / f.ring) * TAU + f.left * 0.2, 4.5, 9, f.dmg, f.proj, 0.45, false, f.by); }
        }
        if (f.step === 1) { const d = dist(E.x, E.y, f.tx, f.ty); if (d > 0.4) this.moveCircle(E, ((f.tx - E.x) / d) * Math.min(d, f.speed * dt), ((f.ty - E.y) / d) * Math.min(d, f.speed * dt), 0.9); }
      }
      if (f.kind === 'whirlpool' && !f.spawned) {        // a ring of bullets spins around you, closing in
        f.spawned = true;
        for (let k = 0; k < f.n; k++) {
          const a = (k / f.n) * TAU, b = this.shoot('e', f.cx + Math.cos(a) * f.r, f.cy + Math.sin(a) * f.r, a, 0, 99, f.dmg, f.proj, 0.45, false, f.by);
          b.vortex = { cx: f.cx, cy: f.cy, r: f.r, a, spin: f.spin, shrink: f.shrink }; b.life = f.dur;
        }
      }
      if (f.kind === 'pulse' && (f.next -= dt) <= 0 && f.left > 0) {   // heartbeats: rings with two gaps turning against each other
        f.next = f.every; f.left--; f.rot += 0.5;
        const g1 = f.rot, g2 = -f.rot * 1.3 + Math.PI;
        for (let k = 0; k < f.count; k++) {
          const a = (k / f.count) * TAU, d1 = Math.abs(((a - g1 + Math.PI * 3) % TAU) - Math.PI), d2 = Math.abs(((a - g2 + Math.PI * 3) % TAU) - Math.PI);
          if (d1 < f.gap / 2 || d2 < f.gap / 2) continue;
          this.shoot('e', E.x, E.y - 1, a, f.speed, 12, f.dmg, f.proj, 0.45, false, f.by);
        }
        this.vx({ k: 'shake', amt: 2 });
      }
      if (f.kind === 'eclipse' && (f.next -= dt) <= 0 && f.left > 0) {  // dense rings, with two opposite safe wedges that turn each wave
        f.next = f.every; f.left--; f.rot += f.turn;
        for (let k = 0; k < f.count; k++) {
          const a = (k / f.count) * TAU, da = Math.abs(((a - f.rot + Math.PI * 3) % Math.PI) - Math.PI / 2);
          if (da > Math.PI / 2 - f.safe / 2) continue;      // the two safe wedges (opposite each other)
          this.shoot('e', E.x, E.y - 1, a, f.speed, 12, f.dmg, f.proj, 0.45, false, f.by);
        }
      }
      if (f.kind === 'echo') {                           // where you stood a moment ago erupts
        f.hist.push([this.t, p.x, p.y]);
        f.acc -= dt;
        if (f.acc <= 0 && f.t < f.dur + f.delay) {
          f.acc = f.every;
          const old = f.hist.find((h) => h[0] >= this.t - f.delay);
          if (old && f.t > f.delay) {
            this.fx.push({ kind: 'ring', x: old[1], y: old[2], t: 0, max: 1.2, color: '#9cff6a' });
            for (let k = 0; k < f.n; k++) this.shoot('e', old[1], old[2], (k / f.n) * TAU + f.t, f.speed, 4, f.dmg, f.proj, 0.4, false, f.by);
          }
        }
        if (f.hist.length > 400) f.hist.splice(0, 200);
      }
      if (f.kind === 'soulswap' && !f.done && f.t >= f.delay && !p.dead) {     // you and the Lich trade places
        f.done = true;
        const e = f.e;
        if (e.dead || e.state === 'dead') continue;
        const px = p.x, py = p.y;
        p.x = e.x; p.y = e.y + 0.6; e.x = px; e.y = py;
        if (isSolid(this.map, p.x, p.y)) { p.x = px; p.y = py; e.x = f.e.x; }
        this.unstick(p);
        for (const [x, y] of [[p.x, p.y], [e.x, e.y]]) {
          for (let k = 0; k < 10; k++) this.shoot('e', x, y - 0.4, (k / 10) * TAU, 3.5, 5, f.dmg, f.proj, 0.4, false, f.by);
          this.vx({ k: 'burst', x, y: y - 0.6, n: 24, colors: ['#9cff6a', '#eaffc4', '#1f7078'] });
        }
        this.revealAt(p.x, p.y, 10);
        this.vx({ k: 'shake', amt: 5 });
      }
      if (f.kind === 'lane' && f.t >= f.delay && !p.dead) {                // standing on a lane of fire burns
        f.hitT -= dt;
        const dx = p.x - f.x, dy = p.y - f.y, along = dx * Math.cos(f.a) + dy * Math.sin(f.a), across = Math.abs(-dx * Math.sin(f.a) + dy * Math.cos(f.a));
        if (f.hitT <= 0 && along > 0 && along < f.len && across < f.w) { f.hitT = 0.3; this.hurtPlayer(f.dmg, f.by); }
      }
      if (f.kind !== 'sweep' || f.t < f.tele || p.dead) continue;
      if (f.e.dead || f.e.state === 'dead') { f.life = 0; continue; }
      f.hitT -= dt;
      if (f.hitT > 0) continue;
      const [ox, oy] = this.up(f.e.x, f.e.y, f.e === this.boss ? 2.3 : 1.4), [hx, hy] = this.up(p.x, p.y, 0.45);
      for (let k = 0; k < f.n; k++) {
        const a = f.a0 + (k / f.n) * TAU + f.w * (f.t - f.tele), dx = Math.cos(a), dy = Math.sin(a);
        const u = Math.max(0, Math.min(f.len, (hx - ox) * dx + (hy - oy) * dy));
        if (dist2(hx, hy, ox + dx * u, oy + dy * u) < 0.5 * 0.5) { this.hurtPlayer(f.dmg, f.by); f.hitT = 0.6; break; }
      }
    }
    for (const f of this.fx) {
      if (f.kind === 'orbitals') {                       // blades circling the boss, sweeping outward
        if (f.e.dead || f.e.state === 'dead') { f.life = 0; continue; }
        f.hitT -= dt;
        const r = f.r0 + (f.r1 - f.r0) * Math.min(1, f.t / f.life);
        if (f.hitT <= 0 && !p.dead) for (let k = 0; k < f.n; k++) {
          const a = f.a0 + (k / f.n) * TAU + f.spin * f.t, bx = f.e.x + Math.cos(a) * r, by = f.e.y + Math.sin(a) * r;
          if (dist2(bx, by, p.x, p.y) < 0.55 * 0.55) { this.hurtPlayer(f.dmg, f.by); f.hitT = 0.5; break; }
        }
      } else if (f.kind === 'mine' && !f.done && f.t >= f.life - 0.02) {   // a star mine bursts
        f.done = true;
        for (let k = 0; k < f.shards; k++) this.shoot('e', f.x, f.y, (k / f.shards) * TAU, 4.5, 6, f.dmg, f.proj, 0.4, false, f.by);
        this.vx({ k: 'burst', x: f.x, y: f.y, n: 12, colors: ['#ffffff', '#ffe45c', '#8af6ff'] });
      } else if (f.kind === 'constellation' && f.t >= f.tele && !p.dead) {   // the lines between the stars burn
        f.hitT -= dt;
        if (f.hitT > 0) continue;
        for (let k = 0; k < f.pts.length; k++) {
          const [ax, ay] = f.pts[k], [bx, by] = f.pts[(k + 1) % f.pts.length], dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
          const u = Math.max(0, Math.min(1, ((p.x - ax) * dx + (p.y - ay) * dy) / L2));
          if (dist2(p.x, p.y, ax + dx * u, ay + dy * u) < 0.4 * 0.4) { this.hurtPlayer(f.dmg, f.by); f.hitT = 0.5; break; }
        }
      } else if (f.kind === 'meteor' && !f.done && f.t >= f.delay) {     // impact: a crater that keeps burning
        f.done = true;
        if (dist(p.x, p.y, f.x, f.y) < f.r) this.hurtPlayer(f.dmg, f.by);
        this.vx({ k: 'shake', amt: 5 }); this.vx({ k: 'burst', x: f.x, y: f.y, n: 26, colors: ['#ffd650', '#ff8a1f', '#ffffff'] });
        if (f.burn) this.fx.push({ kind: 'scorch', x: f.x, y: f.y, r: f.r * 0.8, t: 0, life: f.burn.t, dps: f.burn.dps, tick: 0, by: f.by });
      } else if (f.kind === 'scorch' && !p.dead) {
        f.tick -= dt;
        if (f.tick <= 0 && dist(p.x, p.y, f.x, f.y) < f.r) { f.tick = 0.5; this.hurtPlayer(Math.round(f.dps * 0.5), f.by); }
      }
    }
    const A = this.arena;
    if (A) {
      A.t += dt;
      if (A.owner && (A.owner.dead || A.owner.state === 'dead')) { this.arena = null; return; }
      const rr = A.r0 + (A.r1 - A.r0) * Math.min(1, A.t / A.dur);
      A.r = rr;
      if (dist(p.x, p.y, A.x, A.y) > rr && (A.tick -= dt) <= 0) { A.tick = 0.6; this.hurtPlayer(A.dmg, 'the closing dark'); }
    }
  }
  // ---- shared boss mechanics
  bossBlink(e, B) {                                    // vanish, reappear somewhere around the player
    const p = this.player, cols = B.colors || ['#ffffff', '#8af6ff', '#3a3048'];
    this.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 30, colors: cols });
    const to = e.blinkTo || this.blinkSpot(e, B.r);
    if (to) { e.x = to.x; e.y = to.y; }
    e.blinkTo = null; void p;
    this.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 30, colors: cols });
    this.fx.push({ kind: 'ring', x: e.x, y: e.y - 1, t: 0, max: 2.5, color: cols[1] || cols[0] });
  }
  // telegraphed ground slams: n circles on/around the player (or the boss), armed after `delay`
  bossZones(e, Z) {
    const p = this.player;
    for (let k = 0; k < Z.n; k++) {
      let x, y;
      if (Z.at === 'self') { const a = (k / Z.n) * TAU; x = e.x + Math.cos(a) * (k ? Z.spread : 0); y = e.y + Math.sin(a) * (k ? Z.spread : 0); }
      else if (k === 0) { x = p.x; y = p.y; }
      else { const a = R() * TAU, d = R() * Z.spread; x = p.x + Math.cos(a) * d; y = p.y + Math.sin(a) * d; }
      const delay = Z.delay + k * (Z.stagger || 0);
      this.fx.push({ kind: 'zone', x, y, r: Z.r, t: 0, delay, life: delay + 0.3, dmg: Z.dmg, by: e.D ? e.D.name : 'The Unstruck',
        shards: Z.shards || 0, proj: Z.proj, colors: Z.colors, done: false });
    }
  }
  // meteors: huge telegraphed impacts around you that leave the ground burning
  meteors(e, Mt) {
    const p = this.player;
    for (let k = 0; k < Mt.n; k++) {
      const a = R() * TAU, d = k === 0 ? 0 : R() * Mt.spread, delay = Mt.delay + k * (Mt.stagger || 0.2);
      this.fx.push({ kind: 'meteor', x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, r: Mt.r, t: 0, delay, life: delay + 0.3, dmg: Mt.dmg, burn: Mt.burn, by: e.D.name, done: false });
    }
  }
  // a full ring of shots with one gap: find it, or take the hit
  gapRing(e, G) {
    const [ox, oy] = this.up(e.x, e.y, e.rb ? 1.4 : 2.3), p = this.player;
    const gapAt = angleTo(ox, oy, p.x, p.y) + (R() - 0.5) * 1.6;
    for (let w = 0; w < (G.waves || 1); w++) {
      const shift = w * (G.shift || 0.6);
      for (let k = 0; k < G.count; k++) {
        const a = (k / G.count) * TAU;
        const da = ((a - gapAt - shift + Math.PI * 3) % TAU) - Math.PI;
        if (Math.abs(da) < G.gap / 2) continue;
        const b = this.shoot('e', ox, oy, a, G.speed, G.range || 9, G.dmg, G.proj, 0.4, false, e.D ? e.D.name : 'The Unstruck');
        if (w) { b.x -= b.vx * w * 0.18; b.y -= b.vy * w * 0.18; b.life += w * 0.18; }      // later waves trail behind
      }
    }
  }
  // ---- dungeon atmosphere: each dungeon has its own hazard while you walk its halls
  updateDungeon(dt) {
    const m = this.map, def = m.def, p = this.player;
    if (!def) return;
    const room = m.rooms.find((rm) => p.x > rm.x && p.x < rm.x + rm.w && p.y > rm.y && p.y < rm.y + rm.h);
    for (const rm of m.rooms) {                         // rooms can overlap, so check every one you're standing in
      if (rm.pending && p.x > rm.x + 1 && p.x < rm.x + rm.w - 1 && p.y > rm.y + 1 && p.y < rm.y + rm.h - 1) {
        this.spawnPending(rm.pending); rm.pending = null;              // AMBUSH: they climb out of the floor
        this.banner('Ambush!', 1400); this.vx({ k: 'shake', amt: 4 }); this.sfx('boss');
      }
    }
    if (!def.hazardFx || !room || room.boss || room === m.rooms[0]) return;
    this.hazT = (this.hazT === undefined ? 3 : this.hazT) - dt;
    if (this.hazT > 0) return;
    const H = def.hazardFx;
    this.hazT = H.every * (0.8 + R() * 0.4);
    const fake = { D: { name: H.name }, x: p.x, y: p.y };
    if (H.kind === 'zones') this.bossZones(fake, H);
    else if (H.kind === 'tide') {                      // a wall of bubbles rolls across the room, with gaps
      const fromLeft = R() < 0.5, x0 = fromLeft ? room.x + 0.5 : room.x + room.w - 0.5;
      for (let y = room.y + 0.5; y < room.y + room.h; y += 0.9) {
        if (Math.abs(y - p.y) < 1.4 && R() < 0.5) continue;
        if (R() < 0.25) continue;
        this.shoot('e', x0, y, fromLeft ? 0 : Math.PI, H.speed, room.w, H.dmg, H.proj, 0.4, false, H.name);
      }
    }
  }
  // ---- each dungeon's own trap. The crypt's dead wake, the forge's belts carry you, the ember vents erupt,
  // and the statues of the royal road fire across it in rhythm.
  updateTraps(dt) {
    const m = this.map, p = this.player;
    if (p.dead) return;
    const near = (o, d) => Math.abs(o.x - p.x) < d && Math.abs(o.y - p.y) < d;
    if (m.belts) {                                       // THE BELTS: standing on one carries you along it
      for (const B of m.belts) {
        if (p.x < B.x0 || p.x >= B.x1 || p.y < B.y0 || p.y >= B.y1) continue;
        const nx = p.x + B.dx * 2.4 * dt, ny = p.y + B.dy * 2.4 * dt;
        if (!this.blockedAt(nx, ny)) { p.x = nx; p.y = ny; }
        break;
      }
    }
    const def = m.def || {}, boss = m.rooms[m.rooms.length - 1];
    const inBoss = (o) => o.x > boss.x && o.x < boss.x + boss.w && o.y > boss.y && o.y < boss.y + boss.h;
    for (const o of m.objects) {
      if (o.sprite === 'sarcophagus' && def.style === 'crypt' && !o.woken && !inBoss(o) && (o.restless ??= R() < 0.4)) {
        if (o.wakeT === undefined) { if (near(o, 2.6) && R() < dt * 3) { o.wakeT = 0.8; this.vx({ k: 'shake', amt: 2 }); this.float(o.x, o.y - 1, 'the lid shifts…', '#9cff6a'); } continue; }
        o.wakeT -= dt;
        if (R() < dt * 30) this.vx({ k: 'burst', x: o.x + (R() - 0.5), y: o.y - 0.4, n: 2, colors: ['#9cff6a', '#eaffc4'] });
        if (o.wakeT <= 0) {                              // THE DEAD WAKE
          o.woken = true;
          const list = [['drowned_thrall', o.x + 0.5, o.y + 1.2]];
          if (R() < 0.5) list.push(['bone_wisp', o.x - 0.6, o.y + 1]);
          this.spawnPending && this.spawnPending(list);
          for (const e of this.enemies.slice(-list.length)) this.unstick(e, 0.4);
          this.vx({ k: 'burst', x: o.x, y: o.y, n: 18, colors: ['#9cff6a', '#3cbf5e', '#efe9d2'] }); this.sfx('boss');
        }
      } else if (o.sprite === 'ember_vent' && near(o, 11)) {   // THE VENTS: a breath of sparks, then a ring of slag
        o.ventT = (o.ventT === undefined ? 1 + R() * 3 : o.ventT) - dt;
        if (o.ventT < 0.8 && R() < dt * 26) this.vx({ k: 'burst', x: o.x + (R() - 0.5) * 0.5, y: o.y, n: 2, colors: ['#ff8c1e', '#ffd84a'] });
        if (o.ventT <= 0) {
          o.ventT = 3.2 + R() * 1.6;
          const a0 = R() * Math.PI;
          for (let k = 0; k < 8; k++) this.shoot('e', o.x, o.y, a0 + k * Math.PI / 4, 5.5, 4.5, 80, 'slag_shard', 0.4, false, 'an ember vent');
          this.vx({ k: 'burst', ...liftO(o.x, o.y, 0.3), n: 14, colors: ['#ff6a1a', '#ffd84a', '#ffffff'] });
        }
      }
    }
    for (const S of m.sentinels || []) {                 // THE SENTINELS: a gold lance across the road, in rhythm, pairs alternating
      if (!near(S, 13)) continue;
      const c = (this.t + S.phase) % 2.2;
      if (c > 1.5 && R() < dt * 20) this.vx({ k: 'burst', x: S.x, y: S.y - 1, n: 1, colors: ['#ffd650', '#ffffff'] });
      if (S.t > c) for (const dy of [-0.3, 0.3]) this.shoot('e', S.x + S.dir * 0.6, S.y + dy, S.dir > 0 ? 0 : Math.PI, 8, 6.2, 95, 'goldshard', 0.4, false, 'a sentinel statue');
      S.t = c;
    }
  }
  // ---- dungeon seals and puzzles. The boss gate holds until every seal is broken.
  breakSeal(msg) {
    const m = this.map;
    if (!m.sealsLeft) return;
    m.sealsLeft--;
    if (m.sealsLeft > 0) { this.banner(`${msg} A seal breaks (${m.seals - m.sealsLeft}/${m.seals}).`, 3000); this.sfx('rare'); return; }
    this.banner(`${msg} The last seal breaks. The way to the boss is open!`, 3600);
    for (const g of m.gates) {
      g.sprite = 'gate_open'; g.solid = false; m.solid[Math.floor(g.y) * m.w + Math.floor(g.x)] = 0;
      this.vx({ k: 'burst', ...liftO(g.x, g.y, 0.5), n: 20, colors: ['#ff4a5a', '#ffd650', '#ffffff'] });
    }
    this.vx({ k: 'shake', amt: 6 }); this.sfx('boss');
  }
  // every seal in this dungeon, what's left of it, and where it is (for the status panel and the minimap)
  sealStatus() {
    const m = this.map, out = [];
    if (m.kind !== 'dungeon' || !m.seals) return out;
    for (const e of m.wardens || []) out.push({ kind: 'warden', done: !!e.dead, x: e.x, y: e.y, text: `Slay ${e.D.name.split(',')[0]}, Warden of the Seal`, sub: e.dead ? '' : `${Math.round(100 * e.hp / e.maxHp)}% life` });
    for (const o of m.objects) if (o.interact === 'lever') out.push({ kind: 'lever', done: !!o.on, x: o.x, y: o.y, text: 'Pull the hidden lever', sub: o.on ? '' : 'in a dead-end room' });
    for (const rm of m.rooms) {
      if (rm.role !== 'puzzle') continue;
      let sub2 = '';
      if (!rm.solved && m.def.puzzle === 'runes') sub2 = rm.show ? 'watch the order…' : rm.shown ? `touch the runes in order: ${rm.step || 0}/4` : 'touch the glowing stone to learn the order';
      else if (!rm.solved) {
        const ps = m.objects.filter((o) => o.interact === 'plate' && o.room === rm.k), on = ps.filter((o) => o.on).length;
        sub2 = rm.plateT !== undefined ? `${on}/${ps.length} plates · ${Math.ceil(rm.plateT)}s left!` : `stand on all ${ps.length} plates before the hum fades`;
      }
      out.push({ kind: 'puzzle', done: !!rm.solved, x: rm.cx + 0.5, y: rm.cy + 0.5, text: m.def.puzzle === 'runes' ? 'Solve the rune puzzle' : 'Solve the pressure plates', sub: sub2, live: rm.plateT !== undefined || !!rm.show });
    }
    // the newer dungeons' seals: masks, mirror chambers, nightmare trials
    const S4 = m.d4 || {}, NAMES = { mask_comedy: 'Comedy', mask_tragedy: 'Tragedy', mask_silence: 'Silence' };
    if (m.maskStand) {
      const placed = S4.masks || 0, stand = m.objects.find((o) => o.interact === 'maskstand');
      for (const o of m.objects) if (o.interact === 'mask') out.push({ kind: 'mask', done: false, x: o.x, y: o.y, text: `Find the Mask of ${NAMES[o.mask]}`, sub: 'somewhere backstage' });
      if (this.player.carry) out.push({ kind: 'mask', done: false, x: stand.x, y: stand.y, text: `Carry the Mask of ${NAMES[this.player.carry]} to the stand`, sub: 'before the stage', live: true });
      for (let k = 0; k < placed; k++) out.push({ kind: 'mask', done: true, x: stand.x, y: stand.y, text: 'A mask returned to its stand', sub: '' });
    }
    for (const B of m.beams || []) out.push({ kind: 'mirror', done: B.lit, x: B.recv.x + 0.5, y: B.recv.y + 0.5, text: 'Light the crystal', sub: B.lit ? '' : `turn the mirrors${keyParen('portal')} to bend the beam` });
    for (const o of m.objects) if (o.interact === 'sigil') {
      const live = S4.trial && S4.trial.o === o;
      out.push({ kind: 'trial', done: !!o.done, x: o.x, y: o.y, text: 'Survive a nightmare trial', sub: o.done ? '' : live ? `wave ${S4.trial.wave} of 3` : `step onto the sigil and use it${keyParen('portal')}`, live });
    }
    return out;
  }
  sealsHint() {
    const m = this.map, left = [];
    const w = this.enemies.filter((e) => e.warden && !e.dead).length, lv = m.objects.filter((o) => o.interact === 'lever' && !o.on).length;
    const pz = m.rooms.filter((rm) => rm.role === 'puzzle' && !rm.solved).length;
    if (w) left.push(`${w} warden${w > 1 ? 's' : ''}`);
    if (lv) left.push(`${lv} lever${lv > 1 ? 's' : ''}`);
    if (pz) left.push(m.def.puzzle === 'runes' ? 'the rune puzzle' : 'the pressure plates');
    const st = this.sealStatus().filter((q) => !q.done && ['mask', 'mirror', 'trial'].includes(q.kind));
    const mk = st.filter((q) => q.kind === 'mask').length, mr = st.filter((q) => q.kind === 'mirror').length, tr = st.filter((q) => q.kind === 'trial').length;
    if (mk) left.push(`${3 - ((m.d4 && m.d4.masks) || 0)} mask${3 - ((m.d4 && m.d4.masks) || 0) === 1 ? '' : 's'} to return`);
    if (mr) left.push(`${mr} crystal${mr > 1 ? 's' : ''} to light`);
    if (tr) left.push(`${tr} nightmare trial${tr > 1 ? 's' : ''}`);
    return left.join(', ');
  }
  puzzleSolved(rm) {
    const m = this.map;
    this.addBag(rm.cx + 0.5, rm.cy + 1.5, rollLoot(m.def.chestLoot || [], 1.5));
    this.vx({ k: 'burst', x: rm.cx + 0.5, y: rm.cy, n: 40, colors: ['#8af0ff', '#ffd650', '#ffffff'] });
    this.breakSeal('Solved!');
  }
  puzzleFail(rm) {
    if (this.dungeonFill) this.spawnPending(this.dungeonFill(rm, 3 + Math.floor(R() * 2), R() < 0.4));
    this.vx({ k: 'shake', amt: 4 }); this.sfx('boss');
  }
  updatePuzzles(dt) {
    const m = this.map, p = this.player;
    if (!m.rooms || p.dead) return;
    const ofRoom = (kind, k) => m.objects.filter((o) => o.interact === kind && o.room === k);
    for (const rm of m.rooms) {
      if (rm.show) {                                      // the stone shows the order: each rune lights in turn
        rm.show.t += dt;
        const step = Math.floor(Math.max(0, rm.show.t) / 0.8), lit = rm.show.t >= 0 && rm.show.t % 0.8 < 0.6;
        if (step !== rm.show.last && step < 4) { rm.show.last = step; this.sfx('coin'); }
        for (const o of ofRoom('rune', rm.k)) o.sprite = step < 4 && lit && rm.order[step] === o.j ? 'rune_on' : 'rune_off';
        if (step >= 4) { rm.show = null; rm.step = 0; rm.shown = true; this.toast('Now touch the runes in that order.'); }
      }
      if (rm.plateT !== undefined && !rm.solved && (rm.plateT -= dt) <= 0) {
        rm.plateT = undefined;
        for (const o of ofRoom('plate', rm.k)) { o.on = false; o.sprite = 'plate_off'; }
        this.banner('The plates fall silent... and something answers.', 2400);
        this.puzzleFail(rm);
      }
    }
    if (this.gateT > 0) this.gateT -= dt;
    for (const o of m.objects) {
      const I = o.interact;
      if (!I || I === 'chest') continue;
      const d = dist(o.x, o.y, p.x, p.y), reach = o.solid ? 1.4 : 0.75;
      if (I === 'gate') {
        if (d < 2 && m.sealsLeft > 0 && !(this.gateT > 0)) { this.gateT = 5; this.banner(`The gate is sealed. Still holding it shut: ${this.sealsHint()}.`, 3000); }
        continue;
      }
      if (d > reach) { if (d > reach + 0.6) o.near = false; continue; }
      if (o.near && I !== 'plate') continue;
      o.near = true;
      const rm = o.room !== undefined ? m.rooms[o.room] : null;
      if (I === 'lever' && !o.on) {
        o.on = true; o.sprite = 'lever_on'; this.sfx('rare');
        this.breakSeal('A lever groans somewhere deep in the walls.');
      } else if (I === 'plate' && !rm.solved && !o.on) {
        o.on = true; o.sprite = 'plate_on'; this.sfx('coin');
        if (rm.plateT === undefined) {
          const run = (rm.w + rm.h) * 2 / 5.5;                // time to run the room's corners, with some to spare
          rm.plateT = rm.plateMax = Math.max(m.def.plateTime || 9, Math.round(run + 4));
          this.banner(`The plates hum! Stand on all ${ofRoom('plate', rm.k).length} before it fades (${rm.plateT}s).`, 2400);
        }
        if (ofRoom('plate', rm.k).every((q) => q.on)) { rm.solved = true; rm.plateT = undefined; this.puzzleSolved(rm); }
      } else if (I === 'runehint' && !rm.solved && !rm.show) {
        for (const q of ofRoom('rune', rm.k)) q.sprite = 'rune_off';
        rm.show = { t: -0.5, last: -1 }; rm.step = 0;
        this.banner('The stone wakes. Watch the runes...', 1800);
      } else if (I === 'rune' && !rm.solved && !rm.show) {
        if (!rm.shown) { this.toast('The rune is cold. The stone in the middle of the room might know why.'); continue; }
        if (o.sprite === 'rune_on') continue;
        if (rm.order[rm.step] === o.j) {
          o.sprite = 'rune_on'; rm.step++; this.sfx('coin');
          if (rm.step === 4) { rm.solved = true; this.puzzleSolved(rm); }
        } else {
          for (const q of ofRoom('rune', rm.k)) q.sprite = 'rune_off';
          rm.step = 0;
          this.banner('Wrong rune! The room wakes up.', 2000);
          this.puzzleFail(rm);
        }
      } else if (I === 'mystery' && !o.used) {
        o.used = true; o.sprite = 'lorestone';
        this.mystery(o);
      }
    }
  }
  // ---- PETS: one companion follows you and heals your Life and Mana every few seconds
  pets() { const L = this.save.pets || (this.save.pets = []); for (const q of L) upgradePet(q); return L; }
  activePet() { return this.pets().find((q) => q.id === this.save.activePet) || null; }
  // an egg hatches at your feet: it wobbles, wobbles, cracks and bursts (its own clip), and the pet comes out on the burst
  hatch(rarity, family) {
    if (this.pets().length >= PET_MAX) { this.toast(`Your Pet Yard is full (${PET_MAX} pets). Release one first.`); return false; }
    if (this.hatching) { this.toast('One egg at a time: this one is still hatching.'); return false; }
    if (!FAMILIES[family]) family = R.pick(Object.keys(FAMILIES));
    const p = this.player;
    this.hatching = { x: p.x + (p.dir === 'left' ? -0.8 : 0.8), y: p.y + 0.3, t: 0, rarity, family, egg: `pt2_eggs/${family}_${rarity}`, pet: null };
    this.sfx('loot');
    return true;
  }
  updateHatch(dt) {
    const H = this.hatching;
    if (!H) return;
    H.t += dt;
    if (!H.pet && H.t >= HATCH_BURST) {                    // the burst frame: out it comes
      const pet = newPet(hatchKind(H.family, R), H.rarity, START_LV[H.rarity] || 1);
      H.pet = pet;
      this.pets().push(pet);
      if (!this.activePet()) { this.save.activePet = pet.id; this.pet = null; this.petAt = { x: H.x, y: H.y }; }
      this.petJoy(pet);
      this.banner(`The egg hatches: a ${RARITY[H.rarity].name} ${petName(pet)}!${this.save.activePet === pet.id ? ' It follows you now.' : ' Visit the Pet Yard to choose your companion.'}`, 3400);
      this.vx({ k: 'burst', ...liftO(H.x, H.y, 0.4), n: 36, colors: [RARITY[H.rarity].color, '#ffffff', '#fff6c8'] });
      this.sfx('rare'); this.persist();
    }
    if (H.t >= HATCH_BURST + 0.5) this.hatching = null;
  }
  petJoy(P, s = 1.3) { this.joy = this.joy || {}; this.joy[P.id] = { from: this.t, until: this.t + s }; }
  // a pet grows into its next form: a flash, a burst of its rarity's colours, then it's happy
  evolveFx(P, from) {
    const q = this.pet && this.pet.ref === P ? this.pet : null, x = q ? q.x : this.player.x, y = q ? q.y : this.player.y;
    if (q) q.flashT = this.t + 0.45;
    this.vx({ k: 'burst', x, y: y - 0.4, n: 40, colors: [RARITY[P.rarity].color, '#ffffff', '#fff6c8'] });
    this.vx({ k: 'levelup', x, y });
    this.petJoy(P, 1.8);
    this.banner(`Your ${from} grows into a ${petName(P)}!`, 3200);
    this.sfx('rare');
  }
  keyDrop(e) {
    const m = this.map;
    if (e.rb && m.kind === 'dungeon') {                    // a dungeon boss: sometimes its own key, and the heart's boss the throne's
      const d = Object.keys(DUNGEONS).find((k) => DUNGEONS[k] === m.def);
      if (d === 'heart' && R() < 0.05) return 'key_throne';
      return d && R() < 0.06 ? `key_${d}` : null;
    }
    if (m.kind !== 'realm') return null;
    const pd = portalDrop(e.D, e.id);
    return pd && ITEMS[`key_${pd[0]}`] && R() < pd[1] * 0.15 ? `key_${pd[0]}` : null;     // whatever could drop a portal can, rarely, drop its key
  }
  eggDrop(e) {
    const D = e.D || {}, roll = R(), bossy = e.rb || e === this.boss;
    let r = null;
    if (e.id === 'the_unstruck_god') r = roll < 0.02 ? 'divine' : roll < 0.08 ? 'legendary' : roll < 0.3 ? 'rare' : null;   // the only Divine eggs
    else if (bossy && this.map.kind === 'dungeon') r = roll < 0.012 ? 'legendary' : roll < 0.07 ? 'rare' : roll < 0.2 ? 'uncommon' : null;
    else if (bossy) r = roll < 0.025 ? 'rare' : roll < 0.1 ? 'uncommon' : roll < 0.2 ? 'common' : null;
    else if (e.elite && D.ability) r = roll < 0.004 ? 'rare' : roll < 0.024 ? 'uncommon' : roll < 0.084 ? 'common' : null;   // elites: a raised egg chance
    else if (e.kids || D.herald) r = roll < 0.0015 ? 'uncommon' : roll < 0.008 ? 'common' : null;
    if (!r) return null;
    const land = this.map.kind === 'realm' ? BIOMES[biomeAt(this.map, e.x, e.y)] : null;
    const RO = ['common', 'uncommon', 'rare', 'legendary'];
    if (land && RO.indexOf(r) >= 0 && RO.indexOf(r) < 3 && R() < 0.08 * (EGG_LAND_TIER[land] || 0)) r = RO[RO.indexOf(r) + 1];   // harder lands: a step up
    const local = land && EGG_LAND_FAMILIES[land], family = local && R() < 0.6 ? R.pick(local) : R.pick(Object.keys(FAMILIES));
    return eggId(family, r);
  }
  updatePet(dt) {
    const P = this.activePet(), p = this.player;
    if (!P || p.dead || this.map.kind === 'vault') { this.pet = null; return; }
    if (!this.pet || this.pet.ref !== P) this.pet = { ref: P, kind: P.kind, rarity: P.rarity, sprite: petSprite(P), x: p.x - 1, y: p.y + 0.6, tick: PET_TICK, face: false, moving: false };
    if (this.petAt) { this.pet.x = this.petAt.x; this.pet.y = this.petAt.y; this.petAt = null; }   // a fresh hatchling starts where its egg was
    const q = this.pet, tx = p.x - (p.dir === 'left' ? -1.1 : 1.1), ty = p.y + 0.5, d = dist(q.x, q.y, tx, ty);
    q.sprite = petSprite(P); const J = this.joy && this.joy[P.id]; q.joy = J && J.until > this.t ? J.until : 0; q.joy0 = J ? J.from : 0;
    if (d > 9) { q.x = tx; q.y = ty; }                     // left behind: it catches up in a hop
    q.moving = d > 0.35;
    if (q.moving) { const sp = Math.min(d, Math.max(3, d * 4) * dt); const ox = q.x; q.x += ((tx - q.x) / d) * sp; q.y += ((ty - q.y) / d) * sp; q.face = q.x < ox; }
    if ((q.tick -= dt) > 0) return;
    q.tick = PET_TICK;
    if (this.map.kind === 'nexus') return;
    const hp = this.stat('hp'), mp = this.stat('mp');
    if (p.hp < hp) { const h = Math.min(petHeal(P), hp - p.hp); p.hp += h; this.float(p.x - 0.4, p.y - 1.5, `+${h}`, '#5ef08a'); this.vx({ k: 'heal', ...liftA(q.x, q.y, 0.4), ...liftB(p.x, p.y, 0.6) }); }
    if (p.mp < mp) { const m = Math.min(petMagic(P), mp - p.mp); p.mp += m; this.float(p.x + 0.4, p.y - 1.5, `+${m}`, '#6ab4ff'); }
    if (P.ab.shield && (q.shieldT = (q.shieldT ?? 2) - PET_TICK) <= 0) {   // the shield: a ward that soaks the next blows
      q.shieldT = SHIELD_TICK;
      const w = petShield(P);
      if ((p.ward || 0) < w) { p.ward = w; p.wardMax = w; p.wardT = SHIELD_TICK; this.float(...lift(p.x, p.y, 1.9), `ward ${w}`, '#46f5d6'); }
    }
  }
  // feed your companion an item, paying gold or fame. The meal is split between its abilities (see pets.js).
  feedPet(cont, i, pay = 'gold') {
    const P = this.activePet();
    if (!P) return 'You have no companion to feed.';
    const C = this.container(cont), id = C && C[i], it = id && ITEMS[id];
    if (!it) return 'Nothing there.';
    const v = feedValue(it), cost = feedCost(P)[pay], name = petName(P);
    if (!v) return `${name} will not eat that.`;
    if (Object.values(P.ab).every((A) => A.lv >= petCap(P))) return `${name} is fully grown for a ${RARITY[P.rarity].name} pet. Morph it with another to grow further.`;
    const have = pay === 'fame' ? this.save.fame || 0 : this.save.gold || 0;
    if (have < cost) return `A meal costs ${cost} ${pay}.`;
    if (pay === 'fame') this.save.fame -= cost; else this.save.gold -= cost;
    C[i] = null;
    const st = petStage(P), ups = feed(P, v);
    this.sfx(ups.length ? 'level' : 'coin');
    this.petJoy(P);
    if (petStage(P) > st) this.evolveFx(P, name);
    this.persist();
    return ups.length ? `${name} grew: ${ups.join(', ')}!` : `${name} ate the ${it.name} (+${v} feed power).`;
  }
  morphPets(idA, idB, kind, pay = 'fame') {
    const L = this.pets(), a = L.find((q) => q.id === idA), b = L.find((q) => q.id === idB);
    const why = canMorph(a, b);
    if (why) return why;
    const cost = pay === 'gold' ? FUSE_GOLD[a.rarity] : RARITY[a.rarity].morph, have = pay === 'gold' ? this.save.gold || 0 : this.save.fame || 0;
    if (have < cost) return `Fusing costs ${cost} ${pay}. You have ${have}.`;
    if (pay === 'gold') this.save.gold -= cost; else this.save.fame -= cost;
    const c = morph(a, b, kind === b.kind ? b.kind : a.kind);
    L.splice(L.indexOf(a), 1); L.splice(L.indexOf(b), 1); L.push(c);
    this.save.activePet = c.id; this.pet = null; this.petJoy(c, 1.8);
    this.banner(`Fused! A ${RARITY[c.rarity].name} ${petName(c)} (cap ${petCap(c)})`, 3200);
    this.vx({ k: 'burst', ...liftO(this.player.x, this.player.y, 0.6), n: 40, colors: [RARITY[c.rarity].color, '#ffffff', '#fff6c8'] });
    this.sfx('rare'); this.persist();
    return `Your pets fused into one ${RARITY[c.rarity].name} ${petName(c)}. Its abilities can now reach level ${petCap(c)}.`;
  }
  setActivePet(id) { this.save.activePet = id; this.pet = null; this.persist(); }
  releasePet(id) {
    const L = this.pets(), k = L.findIndex((q) => q.id === id);
    if (k < 0) return;
    L.splice(k, 1);
    if (this.save.activePet === id) this.save.activePet = L[0] ? L[0].id : null;
    this.pet = null; this.persist();
  }
  eggsForSale(day = Math.floor(Date.now() / 864e5)) {
    const F = Object.keys(FAMILIES);
    return [['common', 900, F[day % F.length]], ['uncommon', 3500, F[(day + 5) % F.length]]];
  }
  buyEgg(rarity) {
    const sale = this.eggsForSale().find((s) => s[0] === rarity), price = sale && sale[1], p = this.player;
    if (!price) return 'Not for sale.';
    if ((this.save.gold || 0) < price) return 'Not enough gold.';
    const f = p.inv.indexOf(null);
    if (f < 0) return 'Your backpack is full.';
    const id = eggId(sale[2], rarity);
    this.save.gold -= price; p.inv[f] = id;
    this.sfx('coin'); this.persist();
    return `Bought a ${ITEMS[id].name}. Use it (shift-click) to hatch it.`;
  }
  // ---- waypoints: travel between the ones you have found
  travel(name) {
    const m = this.map, p = this.player;
    if (m.kind !== 'realm') return 'Waypoints only work in the realm.';
    const w = m.objects.find((o) => o.interact === 'waypoint' && o.name === name);
    if (!w || !(p.waypoints || []).includes(name)) return 'You have not found that waypoint yet.';
    this.vx({ k: 'burst', ...liftO(p.x, p.y, 0.6), n: 30, colors: ['#8af0ff', '#ffffff'] });
    p.x = w.x; p.y = w.y + 1.4; p.hook = null; p.pull = null; p.dash = null;
    this.unstick(p);
    this.revealAt(p.x, p.y, 16);
    this.vx({ k: 'burst', ...liftO(p.x, p.y, 0.6), n: 40, colors: ['#8af0ff', '#ffffff', '#3befff'] });
    p.status.invuln = Math.max(p.status.invuln || 0, 1.5);
    this.sfx('portal');
    this.banner(`Travelled to ${name}`, 1800);
    return null;
  }
  revealAt(x, y, R) {
    const m = this.map;
    if (!m.seen) return;
    for (let yy = Math.floor(y - R); yy <= y + R; yy++) for (let xx = Math.floor(x - R); xx <= x + R; xx++) {
      if (xx < 0 || yy < 0 || xx >= m.w || yy >= m.h || (xx - x) ** 2 + (yy - y) ** 2 > R * R) continue;
      const i = yy * m.w + xx;
      if (!m.seen[i]) { m.seen[i] = 1; m.fogNew.push(i); }
    }
  }
  compass(dx, dy) {
    const d = Math.round(Math.hypot(dx, dy));
    const dirs = ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'];
    return `${d} paces to the ${dirs[Math.round(((Math.atan2(dy, dx) + TAU) % TAU) / (TAU / 8)) % 8]}`;
  }
  // a cracked wall in a dungeon: shoot it enough and it gives way to a secret room
  hitWeak(o) {
    const m = this.map, xi = Math.floor(o.x), yi = Math.floor(o.y);
    this.vx({ k: 'burst', ...liftO(o.x, o.y, 0.5), n: 4, colors: ['#9a96b0', '#5e5a72'] });   // dust: the only clue the wall is hollow
    if (--o.hp > 0) return;
    m.objects.splice(m.objects.indexOf(o), 1); m.ogridDirty = true;
    m.solid[yi * m.w + xi] = 0;
    m.tiles[yi * m.w + xi] = TID[m.def.floor];
    this.vx({ k: 'burst', ...liftO(o.x, o.y, 0.5), n: 30, colors: ['#9a96b0', '#ffd650', '#ffffff'] });
    this.vx({ k: 'shake', amt: 3 });
    this.banner('The cracked wall gives way... a hidden passage!', 2600);
    this.sfx('rare');
  }
  // the mystery altar: you never know what it wants
  mystery(o) {
    const m = this.map, p = this.player, roll = R();
    this.vx({ k: 'burst', ...liftO(o.x, o.y, 0.6), n: 36, colors: ['#b888ff', '#5a2a8a', '#ffffff'] });
    if (roll < 0.25) {
      p.hp = this.stat('hp'); p.mp = this.stat('mp'); p.status.bless = 45; p.blessKind = 'runeholt';
      this.banner('The altar whispers a blessing: fully restored, +25% damage for 45s.', 3200); this.sfx('level');
    } else if (roll < 0.45) {
      const table = m.def ? m.def.chestLoot || [] : CAMP_LOOT[BIOMES[Math.max(0, biomeAt(m, o.x, o.y))]] || CAMP_LOOT.shore;
      this.addBag(o.x, o.y + 1.2, rollLoot(table, 2));
      this.banner('The altar offers you a gift.', 2600); this.sfx('rare');
    } else if (roll < 0.65) {
      if (m.kind === 'dungeon') {
        for (let i = 0; i < m.seen.length; i++) if (!m.seen[i]) { m.seen[i] = 1; m.fogNew.push(i); }
        this.banner('The altar shows you everything: every hall, every hidden way. Look for the cracked walls.', 3600);
      } else {
        for (const s of m.sites || []) this.revealAt(s.x, s.y, 8);
        for (const w of m.waypoints || []) this.revealAt(w.x, w.y, 8);
        this.banner('The altar shows you every waypoint and every lost place in the realm. Check your map.', 3600);
      }
      this.sfx('rare');
    } else if (roll < 0.85) {
      const rm = m.rooms && m.rooms.find((q) => p.x > q.x && p.x < q.x + q.w && p.y > q.y && p.y < q.y + q.h);
      if (rm && this.dungeonFill) this.spawnPending(this.dungeonFill(rm, 4, true));
      else if (!m.rooms) {                                 // in the realm: the land's own leaders answer
        const b = BIOMES[Math.max(0, biomeAt(m, o.x, o.y))];
        for (let k = 0; k < 2; k++) { const a = R() * TAU, x = o.x + Math.cos(a) * 4, y = o.y + Math.sin(a) * 4; if (!isSolid(m, x, y)) { const e = this.addEnemy(R.pick(GROUPS[b]), x, y); e.seen = true; e.kids = []; e.childT = e.D.every; } }
      }
      this.banner('It was a trap! The altar calls its keepers.', 2800); this.vx({ k: 'shake', amt: 5 }); this.sfx('boss');
    } else {
      p.hp = Math.max(1, Math.round(p.hp * 0.4));
      const gold = 400 + Math.floor(R() * 600);
      this.save.gold = (this.save.gold || 0) + gold;
      this.banner(`The altar drinks your blood... and pays you ${gold} gold for it.`, 3200); this.sfx('coin');
    }
  }
  // wayside shrines: each biome blesses you differently for 30 seconds, then rests for 90
  bless(o) {
    const p = this.player, b = o.biome;
    o.ready = this.t + 90;
    p.status.bless = 30; p.blessKind = b;
    this.questEvent('shrine', o);
    const what = { shore: ['Blessing of the Tide', '+25% speed'], fen: ['Blessing of the Mire', 'regenerate 25 Life/s'],
      runeholt: ['Blessing of the Runes', '+25% damage'], godfall: ['Blessing of Gold', '+15 Defense'] }[b];
    this.banner(`${what[0]}: ${what[1]} for 30s`, 2400);
    this.fx.push({ kind: 'ring', ...liftO(o.x, o.y, 0.5), t: 0, max: 3, color: { shore: '#3bc8e8', fen: '#8db03a', runeholt: '#b888ff', godfall: '#f2641a' }[b] });
    this.vx({ k: 'burst', ...liftO(p.x, p.y, 0.6), n: 26, colors: ['#ffffff', { shore: '#3bc8e8', fen: '#d4ff5a', runeholt: '#b888ff', godfall: '#ffc94a' }[b]] });
    this.sfx('level');
  }
  // treasure: walk into a chest to crack it open
  // ---- loot chests are broken open, not walked into. Only your own shots and abilities count: the loot is soulbound.
  chestHp(o) {
    const m = this.map;
    if (o.admin) return 1500;
    if (o.starLoot) return 20000;
    if (o.loot) return [500, 1800, 4500, 9000][BIOME_RING[Math.max(0, BIOMES.indexOf(o.loot))] || 0];
    const d = m.def ? Object.keys(DUNGEONS).find((k) => DUNGEONS[k] === m.def) : null;
    const base = { chapel: 2500, crypt: 4500, forge: 6000, ember: 8000, scriptorium: 5500, heart: 10000, throne: 12000 }[d] || 3000;
    return Math.round(base * (o.secret ? 1.5 : 1));
  }
  openChests() {                                             // walking up to a chest only tells you what to do
    const p = this.player;
    for (const o of this.map.objects) {
      if (o.interact !== 'chest' || o.opened || o.told || dist2(o.x, o.y, p.x, p.y) > 2.2) continue;
      o.told = true;
      if (o.guards && o.guards.some((g) => !g.dead)) this.toast('The guards still stand. Deal with them first.');
      else this.toast('Locked tight. Break it open: only your own hits count toward its loot.');
    }
  }
  // the tiles holding something you can break by shooting it (rebuilt twice a second: chests open, urns break)
  breakableAt(x, y) {
    const m = this.map;
    if (!m.brk || this.t - m.brkT > 0.5) {
      m.brkT = this.t; m.brk = new Set();
      for (const q of m.objects) if (q.sdUrn || q.hmStriker || q.hmCrate || (q.mrPod && !q.burst) || (q.interact === 'chest' && !q.opened)) m.brk.add(Math.floor(q.y) * m.w + Math.floor(q.x));
    }
    return m.brk.size > 0 && m.brk.has(Math.floor(y) * m.w + Math.floor(x));
  }
  hitObject(x, y, dmg) {
    const m = this.map, xi = Math.floor(x), yi = Math.floor(y);
    const o = m.objects.find((q) => (q.interact === 'weak' || q.sdUrn || q.hmStriker || q.hmCrate || (q.mrPod && !q.burst) || (q.interact === 'chest' && !q.opened)) && Math.floor(q.x) === xi && Math.floor(q.y) === yi);
    if (!o) return;
    if (o.mrPod) { m.brkT = -9; return this.mrBurst(o); }        // a spore pod pops the moment your shot reaches it
    if (o.sdUrn) return this.hitUrn(o);
    if (o.hmStriker || o.hmCrate) return this.hitFair(o);
    if (o.interact === 'weak') return this.hitWeak(o);
    if (o.guards && o.guards.some((g) => !g.dead)) { if (o.starVault) this.asVaultHit(o); this.float(o.x, o.y - 1, 'GUARDED', '#8d88a0'); return; }
    if (!o.maxHp) o.hp = o.maxHp = this.chestHp(o);
    o.hp -= dmg; o.mine = (o.mine || 0) + dmg; o.hurtT = this.t;
    this.float(...lift(o.x, o.y, 0.9), `${Math.round(dmg)}`, '#ffd650');
    this.vx({ k: 'burst', ...liftO(o.x, o.y, 0.4), n: 3, colors: ['#c98a44', '#ffd650'] });
    if (o.hp <= 0) this.breakChest(o);
  }
  adminLoot() {
    const all = Object.values(ITEMS).filter((it) => !it.admin && !it.enchants && it.id.indexOf('~') < 0);
    const uts = all.filter((it) => it.ut && !it.mythic && it.id !== 'crown_of_the_unstruck').map((it) => it.id);
    const myth = all.filter((it) => it.mythic && it.id !== 'crown_of_the_unstruck').map((it) => it.id);
    const C = CLASSES[this.player.cls], pick = (L) => L[Math.floor(R() * L.length)];
    const out = [`${C.weapon}_t${R() < 0.5 ? TIER_CAP.weapon : TIER_CAP.weapon - 1}`, `${C.armor}_t${R() < 0.5 ? TIER_CAP.armor : TIER_CAP.armor - 1}`, `${C.ability}_t5`, `ring_${pick(STATS)}_t${TIER_CAP.ring}`];
    for (let k = 0; k < 3; k++) out.push(pick(uts));                                    // three relics, every time
    if (R() < 0.85) out.push(pick(myth));                                              // a mythic, almost always
    if (R() < 0.35) out.push(pick(myth));                                              // often two
    if (R() < 0.15) out.push('crown_of_the_unstruck');                                 // and now and then, the crown itself
    for (let k = 0; k < 3; k++) out.push(`stat_${pick(STATS)}`);
    if (R() < 0.35) out.push(eggId(R.pick(Object.keys(FAMILIES)), R() < 0.25 ? 'legendary' : 'rare'));
    if (R() < 0.35) out.push(`key_${pick(Object.keys(DUNGEONS))}`);
    return out;
  }
  breakChest(o) {
    o.opened = true; o.sprite = 'chest_open'; o.hp = 0;
    if (o.loot) this.questEvent('camp', o);
    const bag = this.addBag(o.x, o.y + 0.8, o.admin ? this.adminLoot() : rollLoot(o.starLoot || (o.loot ? CAMP_LOOT[o.loot] : (this.map.def.chestLoot || [])), o.secret ? 2.5 : 1));
    if (bag) bag.soulbound = true;
    this.banner('The chest breaks open! Soulbound loot.', 1800);
    this.vx({ k: 'burst', ...liftO(o.x, o.y, 0.4), n: 36, colors: ['#ffd650', '#fff6c8', '#8a5a30'] });
    this.vx({ k: 'shake', amt: 3 });
    this.sfx('rare');
  }
  // ------------------------------------------------------------- boss: THE UNSTRUCK
  updateBoss(dt) {
    const B = this.boss, p = this.player;
    if (B.state === 'dead') { B.deadT += dt; return; }
    this.rxPhaseTick(B, dt); this.rxUnstruck(B, dt); this.spUnstruck(B, dt);    // the remaster's phases 2 and 3 (src/remaster.js)
    B.hurtT = Math.max(0, B.hurtT - dt);
    this.tickStatus(B, dt);
    if (B.state === 'dead' || this.frozen(B)) return;
    const inRoom = p.x > B.room.x && p.x < B.room.x + B.room.w && p.y > B.room.y && p.y < B.room.y + B.room.h;
    if (B.state === 'sleep') {
      if (inRoom) { B.state = 'idle'; B.st = 1.5; this.banner('THE UNSTRUCK', 2600); this.sfx('boss'); }
      return;
    }
    B.st -= dt;
    const enr = B.hp < B.maxHp * 0.25 ? 0.7 : 1;
    // drift toward the player, staying in the room
    const tx = clamp(p.x, B.room.x + 4, B.room.x + B.room.w - 4), ty = clamp(p.y - 2, B.room.y + 5, B.room.y + B.room.h - 4);
    const dd = dist(B.x, B.y, tx, ty);
    const walk = B.state === 'idle' ? 0.9 : B.state === 'spin' ? 2.2 : 0;     // it walks you down while it spins
    if (dd > 0.3 && walk) { B.x += ((tx - B.x) / dd) * walk * dt; B.y += ((ty - B.y) / dd) * walk * dt; }
    if (B.state === 'spin' && B.phase >= 2 && (B.slagT = (B.slagT || 0) - dt) <= 0) {
      B.slagT = 1.1;
      this.bossZones(B, { n: 3, r: 1.6, delay: 0.9, dmg: 150, spread: 3.5, stagger: 0.12, shards: 6, proj: 'molten', colors: ['#f2641a', '#ffc94a'] });
    }
    if (B.phase === 1 && B.hp < B.maxHp * 0.6) { B.phase = 2; B.state = 'phase'; B.st = 1.8; this.banner('The anvil opens.', 1800); return; }
    if (B.phase === 2 && B.hp < B.maxHp * 0.3) {
      B.phase = 3; B.state = 'phase'; B.st = 2.0; B.cycle = 0;
      this.banner('The first blow is struck. The Unstruck breaks open!', 2600);
      this.vx({ k: 'shake', amt: 8 });
      return;
    }
    const [ox, oy] = this.up(B.x, B.y, 2.3);
    const aim = angleTo(ox, oy, ...this.up(p.x, p.y, 0.4));
    if (B.state === 'attack_beam') {
      B.fireT -= dt;
      if (B.fireT <= 0) { B.fireT = 0.13; this.shoot('e', ox, oy + 0.6, aim + Math.sin(this.t * 9) * 0.25, 10, 12, 125, 'furnacebeam', 0.4, false, 'The Unstruck'); }
    }
    if (B.state === 'spin') {
      B.fireT -= dt;
      if (B.fireT <= 0) {
        B.fireT = 0.24 * enr; B.spin += 0.3;
        for (let k = 0; k < 4; k++) this.shoot('e', ox, oy, B.spin + (k / 4) * TAU, 5.5, 10, 115, 'hammerlet', 0.45, false, 'The Unstruck');
      }
    }
    if (B.st > 0) return;
    // state machine
    const next = (s, t) => { B.state = s; B.st = t; };
    switch (B.state) {
      case 'phase': case 'idle': {
        const seq = B.phase === 1 ? ['tell_radial', 'tell_beam'] : B.phase === 2 ? ['tell_radial', 'tell_lines', 'tell_beam', 'tell_spin']
          : ['tell_cata', 'tell_gap', 'tell_sweep', 'tell_beam', 'tell_lines', 'tell_spin', 'tell_radial'];
        const s = seq[B.cycle++ % seq.length];
        next(s, (s === 'tell_beam' ? 0.75 : 0.6) * enr);
        break;
      }
      case 'tell_radial': {
        const rings = B.phase === 1 ? 1 : 2;
        for (let r = 0; r < rings; r++) {
          for (let k = 0; k < 14; k++) {
            const a = (k / 14) * TAU + r * 0.22;
            this.projectiles.push({ from: 'e', x: ox, y: oy, vx: Math.cos(a) * (4.5 - r * 0.8), vy: Math.sin(a) * (4.5 - r * 0.8), life: 3, dmg: 150, sprite: 'molten', r: 0.4, a, by: 'The Unstruck' });
          }
        }
        this.fx.push({ kind: 'ring', x: ox, y: oy, t: 0, max: 5, color: '#ffc94a' });
        this.vx({ k: 'shake', amt: 4 });
        if (B.phase >= 2) this.bossZones(B, { n: 5, r: 1.8, delay: 1.0, dmg: 160, spread: 4.5, stagger: 0.1, shards: 8, proj: 'molten', colors: ['#f2641a', '#ffc94a'] });
        next('attack_radial', 0.3); break;
      }
      case 'attack_radial': next('idle', 1.1 * enr); break;
      case 'tell_beam': next('attack_beam', 1.4); break;
      case 'attack_beam': next('idle', 1.0 * enr); break;
      case 'tell_spin': next('spin', 2.2); break;
      case 'tell_cata': {                              // phase 3: hammer rings + a beam at once
        for (let r2 = 0; r2 < 2; r2++) {
          for (let k = 0; k < 12; k++) {
            const a = (k / 12) * TAU + r2 * 0.26;
            this.projectiles.push({ from: 'e', x: ox, y: oy, vx: Math.cos(a) * (3 + r2), vy: Math.sin(a) * (3 + r2), life: 3, dmg: 140, sprite: 'hammerlet', r: 0.45, a, by: 'The Unstruck' });
          }
        }
        this.vx({ k: 'shake', amt: 6 });
        next('attack_beam', 1.6); break;
      }
      case 'spin': next('idle', 0.9 * enr); break;
      case 'tell_lines': {                             // hammer-fall: rows of slams march across the forge
        const a = angleTo(B.x, B.y, p.x, p.y), px0 = -Math.sin(a), py0 = Math.cos(a);
        for (let row = 0; row < 4; row++) for (let k = -4; k <= 4; k++) {
          const x = B.x + Math.cos(a) * (2 + row * 2.2) + px0 * k * 1.6, y = B.y + Math.sin(a) * (2 + row * 2.2) + py0 * k * 1.6;
          this.fx.push({ kind: 'zone', x, y, r: 0.9, t: 0, delay: 0.8 + row * 0.35, life: 1.2 + row * 0.35, dmg: 110, by: 'The Unstruck', done: false, colors: ['#f2641a', '#ffc94a'] });
        }
        this.banner('The hammers fall!', 1400);
        next('attack_radial', 1.6); break;
      }
      case 'tell_sweep': {                             // QUENCH: the forge floor steams in a checkerboard, then the safe squares swap
        const cx = B.room.cx + 0.5, cy = B.room.cy + 0.5, sz = 3;
        for (let wave = 0; wave < 2; wave++) for (let gx = -5; gx <= 5; gx++) for (let gy = -4; gy <= 4; gy++) {
          if (Math.abs(gx + gy + wave) % 2 === 0) continue;
          this.fx.push({ kind: 'zone', x: cx + gx * sz, y: cy + gy * sz, r: 1.45, t: 0, delay: 1.1 + wave * 1.4, life: 1.5 + wave * 1.4, dmg: 130,
            by: 'The Unstruck', done: false, colors: ['#cfe8ff', '#8a9ab8'] });
        }
        this.banner('QUENCH!', 1200);
        next('spin', 3.2); break;
      }
      case 'tell_gap': {                               // phase 3: hammers thrown out in a ring... that come spinning back
        for (let w = 0; w < 2; w++) for (let k = 0; k < 14; k++) {
          const b = this.shoot('e', ox, oy, (k / 14) * TAU + w * 0.22, 6 - w, 9, 150, 'hammerlet', 0.45, false, 'The Unstruck');
          b.mv = { boomer: 1.0 + w * 0.25 };
        }
        this.vx({ k: 'shake', amt: 5 });
        next('attack_radial', 0.6); break;
      }
      default: next('idle', 1);
    }
  }
  trophy(id) {
    const t = this.save.trophies || (this.save.trophies = []);
    if (!t.includes(id)) { t.push(id); this.toast('A new statue will stand in your vault.'); this.persist(); }
  }
  killBoss() {
    const B = this.boss;
    this.player.dungeons = (this.player.dungeons || 0) + 1;
    this.questEvent('dungeon', B);
    this.trophy('unstruck');
    B.state = 'dead'; B.deadT = 0; B.hp = 0;
    this.boss.hp = 0;
    this.vx({ k: 'shake', amt: 8 });
    this.vx({ k: 'burst', x: B.x, y: B.y - 2, n: 60, colors: ['#f2641a', '#ffc94a', '#fff6c8', '#4f4b60'] });
    this.player.kills++;
    this.gainXp(BOSS.xp);
    this.addBag(B.x - 1, B.y + 1, rollLoot(BOSS.loot));
    if (R() < 0.25) this.portalNextToNexus = true;
    this.map.portals.push({ kind: 'realm', x: B.x + 1.5, y: B.y + 1, label: 'Back to the Realm', to: 'realm', life: 90 });
    if (this.portalNextToNexus) {                      // sometimes the Forge opens the way to the god's heart
      this.portalNextToNexus = false;
      this.map.portals.push({ kind: 'heart', x: B.x - 2, y: B.y + 1, label: DUNGEONS.heart.name, to: 'heart', life: 90 });
      this.say('Something deeper stirs... a portal to The Heart of Godfall!', '#ff4a5a');
    }
    this.banner('The Unstruck falls silent.', 3000);
  }

  // ------------------------------------------------------------- projectiles & world
  updateProjectiles(dt) {
    const p = this.player, m = this.map;
    const keep = [];
    const act = this.active || this.enemies;
    const targets = this.boss && this.boss.state !== 'sleep' && this.boss.state !== 'dead' ? [...act, this.boss] : act;
    const T = this.timeStop && this.timeStop.t > 0 ? this.timeStop : null;
    for (const b of this.projectiles) {
      const sp = b.sp;
      if (b.from === 'e') {
        if (T && dist2(b.x, b.y, T.x, T.y) < T.r * T.r) { b.frozen = true; keep.push(b); continue; }   // hangs in the air, harmless
        if (b.lob) {                                     // a mortar: arcs to its mark, then bursts
          const L = b.lob;
          L.t += dt;
          const k = Math.min(1, L.t / L.T);
          b.x = L.x0 + (L.x1 - L.x0) * k; b.y = L.y0 + (L.y1 - L.y0) * k;
          if (k >= 1) this.lobLand(b); else keep.push(b);
          continue;
        }
        if (b.orb) {                                     // orbiting the shooter, then flung out
          const O = b.orb;
          O.t -= dt; O.a += O.w * dt; b.life += dt;
          if (O.e.dead || O.t <= 0) { const s0 = Math.hypot(b.vx, b.vy) || 5; b.vx = Math.cos(O.a) * 5; b.vy = Math.sin(O.a) * 5; b.a = O.a; b.orb = null; void s0; }
          else { const [cx, cy] = this.up(O.e.x, O.e.y, 0.5); b.x = cx + Math.cos(O.a) * O.r; b.y = cy + Math.sin(O.a) * O.r; b.a = O.a + Math.PI / 2; }
        }
        if (b.vortex) {                                  // spinning around a point, the circle tightening
          const V = b.vortex;
          V.a += V.spin * dt; V.r = Math.max(0.3, V.r - V.shrink * dt);
          b.x = V.cx + Math.cos(V.a) * V.r; b.y = V.cy + Math.sin(V.a) * V.r; b.a = V.a + Math.PI / 2; b.vx = 0; b.vy = 0;
        }
        if (b.mv && this.steerEnemyShot(b, dt)) continue;
        if (b.bounce > 0 && isSolid(m, b.x + b.vx * dt, b.y + 0.3 + b.vy * dt)) {   // a ricochet: off the wall it goes
          if (isSolid(m, b.x + b.vx * dt, b.y + 0.3)) b.vx = -b.vx; else b.vy = -b.vy;
          b.a = Math.atan2(b.vy, b.vx); b.bounce--;
        }
        if (b.burst && b.life <= dt * 1.5) {              // a seeker's end: it bursts
          for (let k = 0; k < b.burst.n; k++) this.shoot('e', b.x, b.y, (k / b.burst.n) * TAU, 4, 4, b.burst.dmg, b.burst.proj, 0.4, false, b.by).shard = true;
          b.burst = null;
        }
      }
      if (sp && b.from === 'p') {
        if (sp.mech) this.mechFlight(b, dt);
        if (sp.homing && !(sp.homingAfter && (b.max - b.life) * b.speed < sp.homingAfter)) {   // steer toward the nearest enemy ahead (a crane only once it has folded)
          if (sp.homingAfter && !b.folded) { b.folded = true; b.sprite = sp.foldInto || b.sprite; b.def = null; b.life = Math.max(b.life, 1.2); }
          let best = null, bd = (sp.homingR || 6) ** 2;
          for (const e of targets) {
            if (e.dead || e.state === 'dead' || (b.hit && b.hit.has(e)) || (e.D && e.D.dummy && this.map.kind !== 'nexus')) continue;
            const d2 = dist2(b.x, b.y, e.x, e.y);
            if (d2 < bd) { bd = d2; best = e; }
          }
          if (best) {
            const [hx, hy] = this.up(best.x, best.y, best === this.boss ? 2.3 : best.hitUp || (best.rb ? 1.4 : 0.5));
            const want = Math.atan2(hy - b.y, hx - b.x), cur = Math.atan2(b.vy, b.vx);
            let da = ((want - cur + Math.PI * 3) % TAU) - Math.PI;
            da = Math.max(-sp.homing * dt, Math.min(sp.homing * dt, da));
            const s = Math.hypot(b.vx, b.vy), na = cur + da;
            b.vx = Math.cos(na) * s; b.vy = Math.sin(na) * s; b.a = na;
            if (b.wa !== undefined) b.wa += da;                  // a weaving pair turns its line, and keeps weaving
          }
        }
        if (sp.current && !b.back) {                     // the Tidewraith's bolts lean with a current, all the same way
          const na = Math.atan2(b.vy, b.vx) + sp.current * dt, s = Math.hypot(b.vx, b.vy);
          b.vx = Math.cos(na) * s; b.vy = Math.sin(na) * s; b.a = na;
        }
        if (sp.accel) {                                  // pendulum weights: slow out of the hand, then they fly
          const s0 = Math.hypot(b.vx, b.vy), s1 = Math.min(24, s0 + sp.accel * dt);
          b.vx *= s1 / s0; b.vy *= s1 / s0;
          b.dist += s1 * dt;
          if (b.dist >= b.range) b.life = 0;
        }
        if (sp.weave && !b.back && b.wa !== undefined) {   // Realmforge's helix staves and wave wands: the shot weaves across its line
          b.wt += dt;
          const f = b.wf || sp.weave.freq, w = sp.weave.amp * f * Math.cos(f * b.wt) * b.ws, perp = b.wa + Math.PI / 2;
          b.vx = Math.cos(b.wa) * b.speed + Math.cos(perp) * w; b.vy = Math.sin(b.wa) * b.speed + Math.sin(perp) * w; b.a = Math.atan2(b.vy, b.vx);
        }
        if (sp.boomerang && !b.back && b.life < b.max * 0.5) { b.back = true; if (b.hit) b.hit.clear(); }
        if (b.back) {                                    // fly home
          const a = angleUp(b.x, b.y, p.x, p.y, 0.5), s = b.speed;
          b.vx = Math.cos(a) * s; b.vy = Math.sin(a) * s; b.a = a;
          if (dist2(b.x, b.y, ...lift(p.x, p.y, 0.5)) < 0.4) b.life = 0;
        }
      }
      if (!b.orb) { b.x += b.vx * dt; b.y += b.vy * dt; }
      if (b.dust && (b.dustT = (b.dustT || 0) - dt) <= 0) { b.dustT = 0.07; this.vx({ k: 'burst', x: b.x, y: b.y, n: 1, colors: b.dust }); }   // its trail
      b.life -= dt;
      const onBreakable = b.from === 'p' && m.kind !== 'nexus' && this.breakableAt(b.x, b.y + 0.3);   // chests and urns you walk through still catch your shots
      if (b.from === 'p' && b.rfBounce && b.life > 0 && shotBlocked(m, b.x, b.y + 0.3)) this.rfWallHit(b, m);   // the Prism Wand's bounce (src/rf/uniqmech.js)
      if (b.life <= 0 || onBreakable || (!b.back && !b.orb && !b.phase && shotBlocked(m, b.x, b.y + 0.3))) {
        if (b.from === 'p' && b.life > 0 && m.kind !== 'nexus') this.hitObject(b.x, b.y + 0.3, b.dmg);
        if (sp && sp.split && sp.split.onEnd && !b.child && b.from === 'p') this.splitShot(b, sp.split);
        if (sp && sp.mech && b.from === 'p') this.mechEnd(b);
        continue;
      }
      let alive = true;
      if (b.from === 'p' && m.rf && this.rfShotHits(b)) alive = false;   // a Realmforge creature (src/rf/host.js)
      if (b.from === 'p' && m.rfBoss && this.rfBossShot(b)) alive = false;   // a Realmforge boss and its arena (src/rf/boss.js)
      if (b.from === 'p') {
        if (alive) for (const e of targets) {
          if (e.dead || e.state === 'dead' || e.under) continue;
          const rr = (e === this.boss ? BOSS.r : e.D.r) + b.r;
          const [hx, hy] = this.up(e.x, e.y, e === this.boss ? 2.3 : e.hitUp || (e.rb ? 1.4 : 0.5));
          if (dist2(b.x, b.y, hx, hy) < rr * rr) {
            if (b.hit) { if (b.hit.has(e)) continue; b.hit.add(e); }
            if (e === this.boss && this.boss.state === 'phase') { alive = b.pierce; break; }
            if (e.D && e.D.guard && e.state === 'move' && !e.stunT) {
              const fa = angleTo(e.x, e.y, p.x, p.y), sa = Math.atan2(-b.vy, -b.vx);
              if (Math.abs(((fa - sa + Math.PI * 3) % TAU) - Math.PI) < 1.2) {   // came from the front: blocked
                this.float(...lift(b.x, b.y, 0.6), 'BLOCK', '#a8b8d8');
                this.vx({ k: 'burst', x: b.x, y: b.y, n: 4, colors: ['#ffffff', '#a8b8d8'] });
                alive = false; break;
              }
            }
            this.playerHit(e, b);
            if (!b.pierce) { alive = false; break; }
          }
        }
      } else if (!p.dead && !b.ghost && !b.harmless) {
        if (Math.abs(b.x - p.x) < 2.5 && Math.abs(b.y - p.y) < 3 && this.shotHitsPlayer(b, p)) {
          alive = false;
          // one volley, one hit: the rest of a shotgun blast / cage / wall that lands with it in the same instant is
          // absorbed. Only in that instant: a shot from the same volley that reaches you later (an orbiting ring, a
          // spiral arm, a wall you walk back into) hurts like any other. (It used to be absorbed for good: you were
          // hit, the shot vanished, and nothing happened.)
          this.hitVols = this.hitVols || new Map();
          const seen = this.hitVols.get(b.vol);
          if (seen === undefined || this.t - seen > 0.12) { this.hitVols.set(b.vol, this.t); this.hurtPlayer(b.dmg, this.killerName(b), !!b.ap); }   // armour-piercing shots ignore Defense
          if (b.pull) { const s = Math.hypot(b.vx, b.vy) || 1; this.moveCircle(p, (-b.vx / s) * b.pull, (-b.vy / s) * b.pull, 0.32); }   // a void orb drags you toward its caster
          if (b.drowsy) p.drowsy = Math.min(1, (p.drowsy || 0) + b.drowsy);
          if (b.chill) this.addChill(b.chill);
          if (b.poison) this.poison(b.poison);
          if (this.hitVols.size > 300) for (const [k, v] of this.hitVols) if (this.t - v > 6) this.hitVols.delete(k);
        }
      }
      if (alive) keep.push(b);
    }
    this.projectiles = keep;
  }
  killerName(b) {
    const by = { pearl: 'Brine Pilgrim', brine: 'Lantern Jelly', toll: 'The Bell-Taken', bile: 'Peat Saint', shard: 'Frozen Executioner',
      rune: 'Cairn Crawler', blade: 'Hollow Thane', smoke: 'Censer-Magistrate', molten: this.boss ? 'The Unstruck' : 'the Drowned Forge' };
    return b.by || by[b.sprite] || 'the Realm';
  }
  updateWorld(dt) {
    const p = this.player;
    for (const f of this.floaters) f.t += dt;
    this.floaters = this.floaters.filter((f) => f.t < 0.9);
    for (const f of this.fx) f.t += dt;
    this.updateAbilityFx(dt);
    this.fx = this.fx.filter((f) => f.t < (f.life || 0.45));
    // bags
    // a bag lasts its time on the game's clock, which runs wherever you are: one left in the realm while you are in a
    // dungeon keeps counting down (the realm map is kept, so bags there used to wait for you for ever)
    for (const b of this.bags) { if (b.until === undefined) b.until = this.t + (b.life || 90); b.life = b.until - this.t; }
    this.bags = this.map.bags = this.bags.filter((b) => b.until > this.t || b === this.nearBag);
    let best = null, bd = 1.2;
    for (const b of this.bags) { const d = dist(b.x, b.y, p.x, p.y); if (d < bd) { bd = d; best = b; } }
    if (best !== this.nearBag) { this.nearBag = best; this.events.push({ type: 'ground' }); }
    // nexus objects
    let vault = null, npc = null;
    for (const o of this.map.objects) {
      if (!o.interact || dist(o.x, o.y, p.x, p.y) > 1.6) continue;
      if (o.interact === 'vault') vault = o.chest || 0;
      if (o.interact === 'fountain') { p.hp = this.stat('hp'); p.mp = this.stat('mp'); }
      if (o.interact === 'shrine' && this.t >= (o.ready || 0)) this.bless(o);
      if (TALKY.has(o.interact) && (!npc || dist2(o.x, o.y, p.x, p.y) < dist2(npc.x, npc.y, p.x, p.y))) npc = o;
    }
    this.updateQuirks(dt);
    if (vault !== this.vaultIdx) { this.vaultIdx = vault; this.nearVault = vault !== null; this.events.push({ type: 'ground' }); }
    this.nearNPC = npc;
    // portals
    for (const pt of this.map.portals) if (pt.life !== undefined) pt.life -= dt;
    this.map.portals = this.map.portals.filter((pt) => pt.life === undefined || pt.life > 0);
    this.nearPortal = this.map.portals.find((pt) => dist(pt.x, pt.y, p.x, p.y) < 1.2) || null;
    const dg = this.danger(), stars = '★'.repeat(this.map.rf || this.map.rfBoss ? this.rfStars() : Math.max(1, Math.min(5, Math.round((dg - 0.45) * 8))));
    this.where = (this.map.kind === 'realm' ? BIOME_LABEL[BIOMES[biomeAt(this.map, p.x, p.y)]] || 'Open water' : this.map.name) + (this.map.kind === 'nexus' || this.map.kind === 'vault' ? '' : ` · danger ${stars}`);
  }
  // ------------------------------------------------------------- quests
  // kinds: hunt {target,n} · herald {n} · rboss {n} · shrine {n} · camp {n} · dungeon {target} · fetch {x,y,item}
  makeQuest(kind) {
    const lvl = this.player.level, tier = lvl < 6 ? 0 : lvl < 11 ? 1 : lvl < 16 ? 2 : 3, biome = BIOMES[tier];
    const scale = [1, 2, 4, 7][tier];
    const reward = (k) => ({ gold: Math.round(120 * k * scale), essence: Math.round(6 * k * scale), fame: Math.round(4 * k * (tier + 1)) });
    kind = kind || R.pick(['hunt', 'hunt', 'shrine', 'camp', 'herald', 'fetch', 'dungeon', 'rboss']);
    if (kind === 'hunt') {
      const id = R.pick(QUEST_HUNTS[biome]), n = 8 + Math.floor(R() * 8);
      return { kind, target: id, n, have: 0, desc: `Cull ${n} ${ENEMIES[id].name}${n > 1 ? 's' : ''} in ${BIOME_LABEL[biome]}.`, reward: reward(1.2) };
    }
    if (kind === 'shrine') return { kind, n: 3, have: 0, desc: 'Pray at three wayside shrines.', reward: reward(1) };
    if (kind === 'camp') return { kind, n: 2, have: 0, desc: 'Raid two guarded camps and open their chests.', reward: reward(1.6) };
    if (kind === 'herald') return { kind, n: 1, have: 0, desc: 'Silence a herald in the realm.', reward: reward(1.8) };
    if (kind === 'rboss') return { kind, n: 1, have: 0, desc: 'Bring down a realm boss.', reward: { ...reward(3), item: 'stat_' + R.pick(STATS) } };
    if (kind === 'dungeon') {
      const d = ['chapel', 'forge', 'heart'][Math.min(2, Math.floor(tier * 0.8))];
      return { kind, target: d, n: 1, have: 0, desc: `Defeat the master of ${DUNGEONS[d].name}.`, reward: { ...reward(2.5), item: 'stat_' + R.pick(STATS) } };
    }
    return { kind: 'fetch', biome, item: R.pick(FETCH_ITEMS), n: 1, have: 0, desc: '', reward: reward(1.1) };
  }
  rollQuestOffers() { this.questOffers = [this.makeQuest(), this.makeQuest(), this.makeQuest()]; }
  acceptQuest(q) {
    const p = this.player;
    if (p.quests.length >= 3) return 'You already carry three quests.';
    q = { ...q, id: Date.now().toString(36) + Math.floor(R() * 999) };
    if (q.kind === 'fetch' && !q.x) {
      q.desc = q.desc || `Find ${q.item} somewhere in ${BIOME_LABEL[q.biome]}.`;
      q.pending = true;                                   // the spot is chosen when you next enter the realm
    }
    p.quests.push(q);
    this.placeFetches();
    this.persist();
    this.sfx('loot');
    return `Quest accepted: ${q.desc}`;
  }
  // fetch quests get a spot in the current realm (marked on the minimap)
  placeFetches() {
    if (!this.map || this.map.kind !== 'realm') return;
    for (const q of this.player.quests) {
      if (q.kind !== 'fetch' || (!q.pending && q.realm === this.map.seed)) continue;
      const at = randomTileInBiome(this.map, BIOMES.indexOf(q.biome), R, this.player, 25);
      if (at) { q.x = at.x; q.y = at.y; q.realm = this.map.seed; q.pending = false; }
    }
  }
  questEvent(type, o) {
    const p = this.player;
    if (!p || !p.quests) return;
    for (const q of p.quests) {
      if (q.done) continue;
      let hit = false;
      if (type === 'kill' && q.kind === 'hunt' && (o.id === q.target || (o.D && o.D.evolved === q.target))) hit = true;
      if (type === 'herald' && q.kind === 'herald') hit = true;
      if (type === 'rboss' && q.kind === 'rboss') hit = true;
      if (type === 'shrine' && q.kind === 'shrine') hit = true;
      if (type === 'camp' && q.kind === 'camp') hit = true;
      if (type === 'dungeon' && q.kind === 'dungeon' && this.map.def && DUNGEONS[q.target] === this.map.def) hit = true;
      if (type === 'fetch' && q === o) hit = true;
      if (!hit) continue;
      q.have++;
      if (q.have >= q.n) this.completeQuest(q);
      else this.float(...lift(p.x, p.y, 1.8), `${q.have}/${q.n}`, '#7ad0a8');
    }
  }
  completeQuest(q) {
    const p = this.player, R0 = q.reward || {};
    q.done = true;
    this.save.gold = (this.save.gold || 0) + (R0.gold || 0);
    this.save.essence = (this.save.essence || 0) + (R0.essence || 0);
    this.save.fame += R0.fame || 0;
    if (R0.item) { const f = p.inv.indexOf(null); if (f >= 0) p.inv[f] = R0.item; else this.addBag(p.x, p.y + 0.4, [R0.item]); }
    this.banner(`Quest complete! +${R0.gold || 0} gold, +${R0.essence || 0} essence${R0.item ? ', and a gift' : ''}`, 3200);
    this.fx.push({ kind: 'ring', ...liftO(p.x, p.y, 0.5), t: 0, max: 3, color: '#7aff9a' });
    this.vx({ k: 'burst', ...liftO(p.x, p.y, 0.6), n: 30, colors: ['#7aff9a', '#ffd650', '#ffffff'] });
    this.sfx('level');
    p.quests = p.quests.filter((x) => x !== q);
    this.events.push({ type: 'ground' });
    this.persist();
  }
  // ------------------------------------------------------------- the things you can walk up to and use
  interact(o) {
    if (this.interactD4(o)) return;
    if (this.interactAstral(o)) return;
    const p = this.player, say = (t, c) => this.bubble(o, t, c);
    switch (o.interact) {
      case 'shop': case 'forge': case 'board': case 'petyard':  // the menus: the UI opens them (the talk key and the button both come here)
        this.events.push({ type: 'npc', which: o.interact }); break;
      case 'journal': {                                    // a page of the dungeon's story
        const D = this.map.def, S = (D && D.story) || [];
        this.events.push({ type: 'npc', which: 'journal', title: D.storyTitle || D.name, page: o.page, of: S.length, text: S[o.page] || '' });
        if (!o.read) { o.read = true; this.gainXp(20 * (o.page + 1)); }
        break;
      }
      case 'waypoint': {
        const known = p.waypoints || (p.waypoints = []);
        if (!known.includes(o.name)) { known.push(o.name); o.sprite = 'waypoint_on'; this.persist(); }
        this.events.push({ type: 'npc', which: 'waypoint', from: o.name });
        break;
      }
      case 'riddle': {                                    // a riddle stone: it shows you somewhere you have not been
        const m = this.map, known = p.waypoints || [];
        const far = [...(m.sites || []).filter((s) => !s.found), ...(m.waypoints || []).filter((w) => !known.includes(w.name))];
        if (!far.length) { say('The stone is quiet. You have seen everything it knows.', '#cfe8ff'); break; }
        const t = far.sort((a, b) => dist2(a.x, a.y, p.x, p.y) - dist2(b.x, b.y, p.x, p.y))[0];
        this.revealAt(t.x, t.y, 10);
        say(`The runes rearrange themselves into a map. "${t.name}" lies ${this.compass(t.x - p.x, t.y - p.y)}.`, '#cfe8ff');
        this.sfx('rare');
        break;
      }
      case 'mystery': {
        if (o.used) { say('The altar is cold now.', '#b888ff'); break; }
        o.used = true; o.sprite = 'lorestone';
        this.mystery(o);
        break;
      }
      case 'talk': {                                      // a wanderer
        const W = WANDERERS[o.who];
        o.line = ((o.line ?? -1) + 1) % W.lines.length;
        say(W.lines[o.line]);
        const has = p.quests.some((q) => q.from === o.who);
        if (!has && !(p.helped || []).includes(o.who) && o.line === 1) {
          const q = { ...W.quest, n: W.quest.n || 1, have: 0, from: o.who, desc: W.quest.desc };
          const msg = this.acceptQuest(q);
          p.helped = [...(p.helped || []), o.who];
          this.toast(msg.startsWith('Quest') ? `${W.name} asks a favour: ${q.desc}` : msg);
        }
        break;
      }
      case 'lore': {
        say(LORE[o.lore], '#cfe8ff');
        if (!p.lore.includes(o.lore)) {
          p.lore.push(o.lore);
          this.toast(`Lore stone ${p.lore.length} of ${LORE.length} read.`);
          if (p.lore.length === LORE.length) {
            this.banner('You have read every stone. The realm remembers you.', 3600);
            this.save.fame += 100; this.addBag(p.x, p.y + 0.4, ['shard_of_the_first_star']);
          }
          this.persist();
        }
        break;
      }
      case 'wish': {                                      // a wishing well: 50 gold, a wish
        if ((this.save.gold || 0) < 50) { say('You need 50 gold to make a wish.'); break; }
        this.save.gold -= 50; this.sfx('coin');
        const roll = R();
        if (roll < 0.35) { say('The water glitters. You feel lucky.'); p.status.bless = 30; p.blessKind = R.pick(BIOMES.slice(0, 4)); }
        else if (roll < 0.55) { say('Something rises from the depths!'); this.addBag(o.x, o.y + 1, ['stat_' + R.pick(STATS)]); }
        else if (roll < 0.7) { say('The well returns your coin. And a friend.'); this.save.gold += 120; }
        else if (roll < 0.85) { say('Nothing happens. The well looks smug.'); }
        else if (roll < 0.97) { say('A voice from the well: "WRONG WISH."'); for (let k = 0; k < 4; k++) this.addEnemy(R.pick(QUEST_HUNTS[o.biome || 'shore']), o.x + Math.cos(k * 1.6) * 3, o.y + Math.sin(k * 1.6) * 3); }
        else { say('The well coughs up a duck.'); this.addEnemy('golden_duck', o.x + 2, o.y); }
        break;
      }
      case 'altar': {                                     // a challenge: three waves for a prize
        if (o.state) { say(o.state === 'won' ? 'The altar is quiet now.' : 'The trial has begun!'); break; }
        o.state = 'trial'; o.wave = 0; o.waveT = 0.5; o.spawned = [];
        this.banner('THE TRIAL BEGINS: survive three waves!', 2600); this.sfx('boss'); this.vx({ k: 'shake', amt: 4 });
        break;
      }
      case 'dig': {
        if (o.dug) { say('Someone already dug here. It was you.'); break; }
        o.dug = true; o.sprite = 'digspot_open';
        const roll = R();
        this.vx({ k: 'burst', x: o.x, y: o.y, n: 14, colors: ['#5a4e44', '#8a7e6a', '#c8b890'] });
        if (roll < 0.45) { say('Buried treasure!'); this.addBag(o.x, o.y + 0.6, rollLoot([{ slot: 'weapon', tiers: [1, 6], p: 0.6 }, { slot: 'armor', tiers: [1, 6], p: 0.6 }, { stat: true, p: 0.3 }, { id: 'pot_hp', p: 0.8 }])); }
        else if (roll < 0.6) { say('A skeleton! It is not happy to see you.'); this.addEnemy(R.pick(QUEST_HUNTS[o.biome || 'shore']), o.x, o.y + 1); }
        else if (roll < 0.75) { say('Gold coins!'); this.save.gold += 60 + Math.floor(R() * 90); this.sfx('coin'); }
        else if (roll < 0.9) { say('...a smaller hole. Interesting.'); }
        else { say('A suspicious box!'); this.addBag(o.x, o.y + 0.6, ['mystery_box']); }
        break;
      }
      case 'fish': {                                      // the nexus pond
        if (p.fishT > this.t) break;
        p.fishT = this.t + 2.2; say('You cast a line...');
        setTimeout(() => {
          if (!this.player || this.player !== p || this.map.kind !== 'nexus') return;
          const roll = R(), catchId = roll < 0.4 ? 'river_fish' : roll < 0.75 ? 'old_boot' : roll < 0.95 ? 'pot_mp' : roll < 0.995 ? 'pilgrims_pearl' : 'golden_carp';
          say({ river_fish: 'A fish! A nice one.', old_boot: 'An old boot. Classic.', pot_mp: 'A bottle with something blue inside.', pilgrims_pearl: 'A PEARL?!', golden_carp: 'THE GOLDEN CARP!' }[catchId], '#cfe8ff');
          const f = p.inv.indexOf(null); if (f >= 0) p.inv[f] = catchId; else this.addBag(p.x, p.y + 0.4, [catchId]);
          this.events.push({ type: 'ground' }); this.sfx('loot');
        }, 2000);
        break;
      }
      case 'bard': {
        say(R.pick(BARD_SONGS), '#ffe8a8');
        if (!(p.status.inspired > 30)) { p.status.inspired = 180; this.banner('Inspired: +10% damage for 3 minutes', 2200); }
        this.vx({ k: 'hearts', ...liftO(o.x, o.y, 0.8) });
        break;
      }
      case 'fortune': {
        if ((this.save.gold || 0) < 100) { this.toast('The fortune teller wants 100 gold.'); break; }
        this.save.gold -= 100; this.sfx('coin');
        const f = R.pick(FORTUNES);
        this.banner(`"${f}"`, 3600);
        if (f.includes('LUCK')) { p.status.bless = 60; p.blessKind = R.pick(BIOMES.slice(0, 4)); }
        if (f.includes('boot') && R() < 0.5) this.addBag(p.x, p.y + 0.5, ['old_boot']);
        if (f.includes('treasure') && R() < 0.5) this.addBag(p.x, p.y + 0.5, ['mystery_box']);
        break;
      }
      case 'cat': {
        p.petted = (p.petted || 0) + 1;
        say(R.pick(['Purrrr.', '*slow blink*', 'Mrrp.', '*the cat allows it*', 'Prrrrrrt!']), '#ffd6e8');
        this.vx({ k: 'hearts', ...liftO(o.x, o.y, 0.6) });
        if (p.petted % 10 === 0) { say('The cat brings you something. It is... a gift?', '#ffd6e8'); this.addBag(o.x, o.y + 1, [R.pick(['river_fish', 'old_boot', 'pot_hp', 'stat_' + R.pick(STATS)])]); }
        break;
      }
      default: break;
    }
  }
  // little things that happen on their own
  updateQuirks(dt) {
    const p = this.player, m = this.map;
    // your pets wander their pen in the Pet Yard
    if (m.kind === 'nexus' && m.pen) {
      const L = this.pets().filter((q) => q.id !== this.save.activePet);
      if (!m.penPets || m.penPets.length !== L.length || m.penPets.some((v, k) => v.ref !== L[k])) {
        m.penPets = L.map((q, k) => ({ ref: q, rarity: q.rarity, sprite: petSprite(q), x: m.pen.x0 + 1 + (k * 2.3) % (m.pen.x1 - m.pen.x0 - 1), y: m.pen.y0 + 1.5 + Math.floor(k / 4) * 2, tx: 0, ty: 0, wait: R() * 2, moving: false, face: false }));
      }
      for (const v of m.penPets) {
        if (v.wait > 0) { v.wait -= dt; v.moving = false; continue; }
        if (!v.tx) { v.tx = m.pen.x0 + 0.7 + R() * (m.pen.x1 - m.pen.x0 - 0.4); v.ty = m.pen.y0 + 0.7 + R() * (m.pen.y1 - m.pen.y0 - 0.4); }
        const d = dist(v.x, v.y, v.tx, v.ty);
        v.moving = d > 0.15;
        if (v.moving) { const st = Math.min(d, 1.6 * dt), ox = v.x; v.x += ((v.tx - v.x) / d) * st; v.y += ((v.ty - v.y) / d) * st; v.face = v.x < ox; }
        else { v.tx = 0; v.wait = 1 + R() * 4; }
      }
    }
    // nexus villagers walk their rounds
    for (const v of m.villagers || []) {
      if (v.wait > 0) { v.wait -= dt; v.moving = false; continue; }
      const [gx, gy] = m.strolls[v.goal], tx = gx + 0.5, ty = gy + 0.5, d = dist(v.x, v.y, tx, ty);
      v.moving = d > 0.2;
      if (v.moving) { const st = Math.min(d, 1.3 * dt), ox = v.x; v.x += ((tx - v.x) / d) * st; v.y += ((ty - v.y) / d) * st; v.face = v.x < ox; }
      else { v.goal = Math.floor(R() * m.strolls.length); v.wait = 2 + R() * 4; if (R() < 0.35) this.bubble(v, R.pick(VILLAGER_LINES), '#ffffff'); }
    }
    // waypoints and named sites: discovered when you first walk up to them
    if (m.kind === 'realm' && (this.frameN || 0) % 10 === 0) {
      const known = p.waypoints || (p.waypoints = []);
      for (const o of m.objects) {
        if (o.interact !== 'waypoint') continue;
        const has = known.includes(o.name);
        if (has && o.sprite !== 'waypoint_on') o.sprite = 'waypoint_on';
        if (!has && dist2(o.x, o.y, p.x, p.y) < 9) {
          known.push(o.name); o.sprite = 'waypoint_on';
          this.banner(`Waypoint discovered: ${o.name}. Use any waypoint${keyParen('portal')} to travel.`, 3200);
          this.vx({ k: 'burst', x: o.x, y: o.y - 1, n: 30, colors: ['#8af0ff', '#ffffff'] }); this.sfx('rare');
          this.persist();
        }
      }
      for (const s of m.sites || []) {
        if (s.found || dist2(s.x, s.y, p.x, p.y) > 64) continue;
        s.found = true;
        this.banner(`Discovered: ${s.name}`, 2800); this.sfx('level');
        this.gainXp(40 + 60 * BIOME_RING[BIOMES.indexOf(s.biome)]);
      }
    }
    // the realm's roaming events: a fallen star, a coin thief
    if (m.kind === 'realm') {
      m.eventT = (m.eventT === undefined ? 90 + R() * 60 : m.eventT) - dt;
      if (m.eventT <= 0) { m.eventT = 150 + R() * 120; this.worldEvent(this.emilyDue() ? 'emily' : R() < 0.3 ? 'star' : 'thief'); }
    }
    // resting by the nexus fire: stand still for 6s
    if (m.kind === 'nexus') {
      const fire = m.objects.find((o) => o.sprite === 'campfire');
      if (fire && !p.moving && dist2(fire.x, fire.y, p.x, p.y) < 9) {
        p.restT = (p.restT || 0) + dt;
        if (p.restT > 6 && !(p.status.rested > 60)) { p.status.rested = 300; this.banner('Rested by the fire: +25% experience for 5 minutes', 2600); this.sfx('level'); }
      } else p.restT = 0;
    }
    // fetch quests: walk onto the spot
    for (const q of p.quests) {
      if (q.kind === 'fetch' && !q.done && q.realm === m.seed && m.kind === 'realm' && dist2(q.x, q.y, p.x, p.y) < 1.6) {
        this.banner(`Found ${q.item}!`, 2000);
        this.questEvent('fetch', q);
      }
    }
    // altars: run their trials
    for (const o of m.objects) {
      if (o.interact !== 'altar' || o.state !== 'trial') continue;
      o.spawned = o.spawned.filter((e) => !e.dead);
      if (o.spawned.length) continue;
      o.waveT -= dt;
      if (o.waveT > 0) continue;
      if (o.wave >= 3) {
        o.state = 'won';
        this.banner('TRIAL COMPLETE!', 2600);
        this.addBag(o.x, o.y + 1, rollLoot([{ slot: 'weapon', tiers: [3, 9], p: 1 }, { slot: 'armor', tiers: [3, 10], p: 1 }, { slot: 'ability', tiers: [2, 5], p: 0.6 },
          { stat: true, p: 1 }, { stat: true, p: 0.5 }, { id: 'mystery_box', p: 0.5 }]));
        this.save.gold += 300; this.sfx('rare');
        continue;
      }
      o.wave++; o.waveT = 1.5;
      const pool = QUEST_HUNTS[o.biome];
      for (let k = 0; k < 3 + o.wave * 2; k++) {
        const a = R() * TAU, x = o.x + Math.cos(a) * 4, y = o.y + Math.sin(a) * 4;
        if (!isSolid(m, x, y)) { const e = this.addEnemy(R.pick(pool), x, y); e.seen = true; o.spawned.push(e); }
      }
      if (o.wave === 3) { const lead = this.addEnemy(R.pick(GROUPS[o.biome]), o.x + 2, o.y); o.spawned.push(lead); }
      this.banner(`Wave ${o.wave} of 3!`, 1400);
    }
    // the golden duck lives somewhere on the shore
    if (m.kind === 'realm' && !m.duck) { m.duck = true; const at = randomTileInBiome(m, 0, R, p, 30); if (at) this.addEnemy('golden_duck', at.x, at.y); }
  }
  // Emily turns up now and then when you are deep enough in (the Runeholt or past it), never two at once
  emilyDue() {
    const b = biomeAt(this.map, this.player.x, this.player.y);
    return b >= 2 && R() < 0.3 && !this.enemies.some((e) => e.id === 'emily_the_yapper' && !e.dead);
  }
  worldEvent(kind) {
    const p = this.player, m = this.map;
    if (kind === 'emily') {
      const at = randomTileInBiome(m, BIOMES.indexOf('runeholt'), R, p, 14) || randomTileInBiome(m, Math.max(0, biomeAt(m, p.x, p.y)), R, p, 14);
      if (!at) return;
      const e = this.spawnRealmBoss('emily_the_yapper', at, REALM_BOSSES.emily_the_yapper);
      if (!e) return;
      this.banner('Emily, the Yapper has waddled into the Runeholt. You can hear her from here.', 3400);
      this.sfx('boss');
      return;
    }
    if (kind === 'thief') {
      const a = R() * TAU, x = p.x + Math.cos(a) * 12, y = p.y + Math.sin(a) * 12;
      if (isSolid(m, x, y)) return;
      const e = this.addEnemy('coin_imp', x, y); e.seen = true;
      this.banner('A Coin Thief is loose nearby! Every hit knocks gold loose.', 3000);
      m.events = [...(m.events || []).filter((v) => !v.e || !v.e.dead), { x, y, kind, e }];
      return;
    }
    // THE FALLING STAR: a star crashes into Godfall and something climbs out of the crater. One at a time.
    if (this.enemies.some((e) => e.id === 'the_fallen_star' && !e.dead)) return;
    const b = BIOMES.indexOf('godfall'), at = randomTileInBiome(m, b, R, p, 0);
    if (!at) return;
    const x = Math.floor(at.x), y = Math.floor(at.y);
    m.objects.push({ sprite: 'star_crater', x: x + 0.5, y: y + 0.5, solid: false }); m.ogridDirty = true;
    const loot = [{ slot: 'weapon', tiers: [8, 10], p: 1 }, { slot: 'armor', tiers: [9, 11], p: 1 }, { slot: 'ring', tiers: [4, 5], p: 0.8 },
      { slot: 'ability', tiers: [4, 5], p: 0.8 }, { stat: true, p: 1 }, { stat: true, p: 1 }, { id: 'mystery_box', p: 1 }, { id: 'shard_of_the_first_star', p: 0.05 }];
    const chest = { sprite: 'chest', x: x + 0.5, y: y + 4.5, solid: true, interact: 'chest', starLoot: loot, guards: [] };
    if (!isSolid(m, chest.x, chest.y)) { m.objects.push(chest); m.solid[Math.floor(chest.y) * m.w + x] = 1; }
    const boss = this.spawnRealmBoss('the_fallen_star', { x: x + 0.5, y: y + 0.5 }, REALM_BOSSES.the_fallen_star);
    if (boss) { boss.st = 3.5; boss.invulnT = 3.5; chest.guards = [boss]; }
    for (let k = 0; k < 16; k++) this.fx.push({ kind: 'star', x: x + 0.5 + (R() - 0.5) * 10, y: y + 0.5 + (R() - 0.5) * 10, t: 0, life: 1.4 + k * 0.08, delay: 0.8 + k * 0.08, r: 1.4, dmg: 0, done: false });
    this.vx({ k: 'shake', amt: 9 });
    this.banner('A STAR HAS FALLEN IN GODFALL! Something is climbing out of the crater...', 4200);
    m.events = [...(m.events || []).filter((v) => v.kind !== 'star'), { x: x + 0.5, y: y + 0.5, kind, chest, e: boss }];
    this.sfx('boss');
  }
  dance() {                                               // /dance
    const p = this.player;
    p.danceT = 3;
    for (const e of this.enemiesIn(p.x, p.y, 7)) {
      if (e.rb || e === this.boss || (e.D && e.D.dummy)) continue;
      e.stunT = Math.max(e.stunT || 0, 1.2);
      if (R() < 0.4) this.bubble(e, R.pick(['...nice moves.', '?', 'Is it... dancing?', 'I wish I could dance.', '*taps foot*']));
    }
  }
  konami() {                                              // up up down down left right left right B A
    if (this.konamiDone) return;
    this.konamiDone = true;
    const p = this.player;
    this.banner('The Unstruck God nods. Just once.', 3600);
    for (let k = 0; k < 6; k++) this.vx({ k: 'burst', x: p.x + Math.cos(k) * 2, y: p.y - 1 + Math.sin(k) * 2, n: 30, colors: ['#ff4af0', '#8af6ff', '#ffd650', '#7aff9a'] });
    this.save.fame += 1;
    this.sfx('rare');
  }
  // ------------------------------------------------------------- shop + forge
  basePrice(it) {
    if (it.id === 'backpack') return 2500;
    if (it.use && it.use.key) return { chapel: 600, crypt: 900, forge: 1200, ember: 1600, scriptorium: 1200, heart: 2500, throne: 6000 }[it.use.key];
    if (it.use && it.use.egg) return { common: 900, uncommon: 3500, rare: 12000, legendary: 40000, divine: 120000 }[it.use.egg];
    if (it.id === 'vault_chest') return Math.round(600 * Math.pow(this.save.vaults[0].length / 8, 1.3) / 50) * 50;
    if (it.use && it.use.junk) return 3;
    if (it.admin) return 999999;
    if (it.mythic) return 8000;
    if (it.ut) return 900;
    if (it.slot === 'consumable') return it.use.stat ? 450 : 20;
    const small = it.slot === 'ability' || it.slot === 'ring';
    return Math.round(30 * Math.pow(small ? 2.6 : 1.7, it.tier));
  }
  sellPrice(it) { return Math.max(1, Math.round(this.basePrice(it) * 0.35)); }
  salvageValue(it) {
    if (it.mythic) return 400;
    if (it.ut) return 45;
    if (it.slot === 'consumable') return it.use.stat ? 5 : 0;
    const small = it.slot === 'ability' || it.slot === 'ring';
    return 2 + (small ? it.tier * 2 : it.tier) ** 2;
  }
  nextTierId(it) {
    if (it.ut || it.slot === 'consumable') return null;
    const cap = TIER_CAP[it.slot];
    if (it.tier >= cap) return null;
    const [b, ench] = it.id.split('~');                 // enchantments survive the forge
    return b.replace(/_t\d+$/, `_t${it.tier + 1}`) + (ench ? '~' + ench : '');
  }
  upgradeCost(it) {
    const small = it.slot === 'ability' || it.slot === 'ring';
    const t = (small ? it.tier * 2 : it.tier) + 1;
    return { essence: 6 * t, gold: 25 * t * t };
  }
  rollShop() {
    const stock = [{ id: 'pot_hp' }, { id: 'pot_mp' }];
    const stats = ['hp', 'mp', 'att', 'def', 'spd', 'dex', 'vit', 'wis'].sort(() => R() - 0.5).slice(0, 3);
    for (const st of stats) stock.push({ id: `stat_${st}` });
    if (this.player && this.player.inv.length <= 8) stock.unshift({ id: 'backpack' });
    if (this.save.vaults[0].length < VAULT_MAX) stock.unshift({ id: 'vault_chest' });
    const types = [...WEAPON_TYPES, ...ARMOR_TYPES];
    const C0 = this.player && CLASSES[this.player.cls], mine = C0 ? [C0.weapon, C0.armor] : types, seen = new Set();
    for (let k = 0, tries = 0; k < 7 && tries < 60; tries++) {     // seven different pieces, about half for your own class
      const pick0 = R.pick(k % 2 ? mine : types), id = `${pick0}_t${ladderTier(WEAPON_TYPES.includes(pick0) ? 'weapon' : 'armor', R.int(1, 6))}`;
      if (seen.has(id) || !ITEMS[id]) continue;
      seen.add(id); stock.push({ id }); k++;
    }
    stock.push({ id: `${R.pick(ABILITY_TYPES)}_t${R.int(1, 3)}` }, { id: `ring_${R.pick(['hp', 'mp', 'att', 'def', 'spd', 'dex', 'vit', 'wis'])}_t${ladderTier('ring', R.int(1, 3))}` });
    this.shop = stock.map((s0) => ({ ...s0, price: this.basePrice(ITEMS[s0.id]) }));
  }
  buy(i) {
    const s0 = this.shop[i], p = this.player;
    if (!s0) return 'Sold out.';
    if ((this.save.gold || 0) < s0.price) return 'Not enough gold.';
    const free = p.inv.indexOf(null);
    if (free < 0) return 'Your backpack is full.';
    this.save.gold -= s0.price;
    p.inv[free] = s0.id;
    if (ITEMS[s0.id].slot !== 'consumable' || s0.id === 'backpack' || s0.id === 'vault_chest') this.shop.splice(i, 1);             // gear is one-of-a-kind; potions restock
    this.sfx('coin');
    this.persist();
    return `Bought ${ITEMS[s0.id].name}.`;
  }
  sell(cont, i) {
    const C = this.container(cont), id = C && C[i];
    if (!id) return null;
    const g0 = this.sellPrice(ITEMS[id]);
    C[i] = null; this.save.gold = (this.save.gold || 0) + g0; this.sfx('coin');
    this.clampVitals(); this.persist();
    return `Sold ${ITEMS[id].name} for ${g0} gold.`;
  }
  salvage(cont, i) {
    const C = this.container(cont), id = C && C[i];
    if (!id) return null;
    const e0 = this.salvageValue(ITEMS[id]);
    if (!e0) return 'That has nothing worth salvaging.';
    C[i] = null; this.save.essence = (this.save.essence || 0) + e0; this.sfx('forge');
    this.clampVitals(); this.persist();
    return `Salvaged ${ITEMS[id].name} into ${e0} essence.`;
  }
  upgrade(cont, i) {
    const C = this.container(cont), id = C && C[i];
    if (!id) return null;
    const it = ITEMS[id], nxt = this.nextTierId(it);
    if (!nxt || !ITEMS[nxt]) return 'That can\'t be upgraded further.';
    const cost = this.upgradeCost(it);
    if ((this.save.essence || 0) < cost.essence || (this.save.gold || 0) < cost.gold) return 'You need more essence or gold.';
    this.save.essence -= cost.essence; this.save.gold -= cost.gold;
    C[i] = nxt;
    this.clampVitals(); this.persist(); this.sfx('forge');
    this.vx({ k: 'shake', amt: 2 });
    return `The Ashwright reforges it: ${ITEMS[nxt].name}!`;
  }

  // ------------------------------------------------------------- chat + admin commands (for testing)
  command(line) {
    const p = this.player, [cmd, ...args] = line.trim().slice(1).split(/\s+/);
    const say = (t) => this.say(t, '#7ad0a8');
    const near = (d = 4) => { const a = R() * TAU; return { x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d }; };
    const n = (v, dflt) => (v === undefined || isNaN(+v) ? dflt : +v);
    switch ((cmd || '').toLowerCase()) {
      case 'help':
        say('/admin  /backpack  /maxlevel  /level N  /maxstats  /heal  /god  /give ITEM [N]  /give dungeon ID (its whole loot set)  /items TEXT  /spawn ID [N] (any monster, elite or boss)  /boss ID  ' +
            '/bx BOSS (a three-phase boss beside you)  /kraken  /treant  /melon  /event BIOME  /adminchest [N] (best loot)  /keys [dungeon N] (dungeon keys)  /pet [kind rarity max]  /star (a falling star in Godfall)  /seals (open a dungeon boss gate)  /progress BIOME N  /gold N  /essence N  /bosses  /tp LAND|nexus|realm|DUNGEON (lands: shore fen runeholt godfall dunes thornwood steppe lowlands)  /killall  /clearbags  /fame N  /portal DUNGEON  (all ids: ADMIN_REFERENCE.md; final boss: /portal throne)');
        break;
      case 'maxlevel': {
        const C = CLASSES[p.cls];
        while (p.level < MAX_LEVEL) { p.level++; for (const st of STATS) p.base[st] = Math.min(C.max[st], p.base[st] + R.int(...C.grow[st])); }
        p.xp = 0; p.hp = this.stat('hp'); p.mp = this.stat('mp'); say(`Level ${p.level}.`); break;
      }
      case 'level': {
        const C = CLASSES[p.cls], to = Math.min(MAX_LEVEL, n(args[0], p.level + 1));
        while (p.level < to) { p.level++; for (const st of STATS) p.base[st] = Math.min(C.max[st], p.base[st] + R.int(...C.grow[st])); }
        p.hp = this.stat('hp'); p.mp = this.stat('mp'); say(`Level ${p.level}.`); break;
      }
      case 'maxstats': Object.assign(p.base, CLASSES[p.cls].max); p.hp = this.stat('hp'); p.mp = this.stat('mp'); say('All stats maxed.'); break;
      case 'heal': p.hp = this.stat('hp'); p.mp = this.stat('mp'); say('Healed.'); break;
      case 'god': this.god = !this.god; say(`God mode ${this.god ? 'on' : 'off'}.`); break;
      case 'admin': {                                   // the overpowered test kit, straight into your slots
        const old = p.equip.slice();
        p.equip = ADMIN_SET.slice();
        for (const id of old) if (id && !ADMIN_SET.includes(id)) { const f = p.inv.indexOf(null); if (f >= 0) p.inv[f] = id; else this.addBag(p.x, p.y + 0.4, [id]); }
        p.hp = this.stat('hp'); p.mp = this.stat('mp');
        this.events.push({ type: 'ground' }); say("Admin kit equipped: Developer's Gavel, Delete Key, Plate of the Source Code, Root Ring."); break;
      }
      case 'dance': this.dance(); say('You dance.'); break;
      case 'quest': { const q = this.makeQuest(args[0]); say(this.acceptQuest(q)); break; }
      case 'duck': this.addEnemy('golden_duck', p.x + 3, p.y); say('Quack.'); break;
      case 'backpack': if (p.inv.length < 16) p.inv.push(...Array(16 - p.inv.length).fill(null)); this.events.push({ type: 'ground' }); say('Second backpack added.'); break;
      case 'fame': this.save.fame += n(args[0], 100); say(`Fame ${this.save.fame}.`); break;
      case 'gold': this.save.gold = (this.save.gold || 0) + n(args[0], 1000); say(`Gold ${this.save.gold}.`); break;
      case 'essence': this.save.essence = (this.save.essence || 0) + n(args[0], 200); say(`Essence ${this.save.essence}.`); break;
      case 'items': {
        const q = (args.join(' ') || '').toLowerCase();
        const hits = Object.values(ITEMS).filter((it) => it.id.includes(q) || it.name.toLowerCase().includes(q)).slice(0, 14);
        say(hits.length ? hits.map((it) => it.id).join(', ') : 'No matching items.'); break;
      }
      case 'give': {
        if ((args[0] || '').toLowerCase() === 'dungeon') {        // /give dungeon ID: every item its boss can drop
          const D = DUNGEONS[(args[1] || '').toLowerCase()], B = D && (BX[D.boss] || DUNGEON_BOSSES[D.boss] || (D.boss === 'unstruck' ? BOSS : null));
          if (!B) { say(`Dungeons: ${Object.keys(DUNGEONS).join(', ')}`); break; }
          const ids = [...new Set((B.loot || []).filter((l) => l.id && ITEMS[l.id] && !/^(pot_|stat_)/.test(l.id)).map((l) => l.id))], left = [];
          for (const id of ids) { const f = p.inv.indexOf(null); if (f >= 0) p.inv[f] = id; else left.push(id); }
          if (left.length) this.addBag(p.x, p.y + 0.4, left);
          this.events.push({ type: 'ground' }); say(`Gave ${ids.length} items from ${D.name}.`); break;
        }
        const q = (args[0] || '').toLowerCase();
        const it = ITEMS[q] || Object.values(ITEMS).find((x) => x.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(q.replace(/[^a-z0-9]/g, '')));
        if (!it) { say(`No item "${q}". Try /items ${q}`); break; }
        const ids = Array(Math.min(40, n(args[1], 1))).fill(it.id);
        let left = [];
        for (const id of ids) { const f = p.inv.indexOf(null); if (f >= 0) p.inv[f] = id; else left.push(id); }
        if (left.length) this.addBag(p.x, p.y + 0.4, left);
        this.events.push({ type: 'ground' }); say(`Gave ${ids.length} × ${it.name}.`); break;
      }
      case 'spawn': {                                     // any monster, elite or boss by id (the Unstruck: /boss unstruck)
        const id = args[0];
        if (BX[id]) { const e = this.spawnRealmBoss(id, near(7), bxEnemyDef(id)); if (e) say(`${e.D.name} (${e.D.hp} life).`); break; }
        if (REALM_BOSSES[id]) { this.spawnRealmBoss(id, near(6)); say(`Spawned ${REALM_BOSSES[id].name}.`); break; }
        if (DUNGEON_BOSSES[id]) { const e = this.spawnRealmBoss(id, near(6), DUNGEON_BOSSES[id]); if (e) say(`Spawned ${e.D.name}.`); break; }
        if (id === 'unstruck') { say('The Unstruck lives only in its forge: /boss unstruck.'); break; }
        if (!ENEMIES[id]) { say(`Unknown id. Monsters, elites and bosses: see ADMIN_REFERENCE.md (or /bosses).`); break; }
        for (let k = 0; k < Math.min(30, n(args[1], 1)); k++) {
          const at = near(3 + (k % 4)), e = this.addEnemy(id, at.x, at.y);
          if (e.D.children) { e.kids = []; e.childT = e.D.every; for (let j = 0; j < 3; j++) this.spawnChild(e); }
        }
        say(`Spawned ${id}.`); break;
      }
      case 'boss': {
        const id = ({ emily: 'emily_the_yapper', penguin: 'emily_the_yapper', unstruck_god: 'the_unstruck_god', god: 'the_unstruck_god' })[args[0]] || args[0] || BIOME_BOSS[BIOMES[Math.max(0, biomeAt(this.map, p.x, p.y))]];
        const dz = { drowned_abbot: 'chapel', fallen_heart: 'heart', unstruck: 'forge', the_archivist: 'scriptorium', the_unstruck_god: 'throne', tidebound_lich: 'crypt', forgeheart_colossus: 'ember' }[id];
        if (dz) { this.enter(dz); const br = this.map.rooms.at(-1); p.x = br.cx; p.y = br.cy + 7; say(`Into ${this.map.name}.`); break; }
        if (!REALM_BOSSES[id]) { say(`Bosses: ${Object.keys(REALM_BOSSES).join(', ')}, unstruck, drowned_abbot, fallen_heart`); break; }
        if (this.map.kind !== 'realm') { say('Realm bosses only spawn in the realm. /tp realm first.'); break; }
        this.spawnRealmBoss(id, near(6)); break;
      }
      case 'bosses': say(`Realm: ${Object.keys(REALM_BOSSES).join(', ')} | Dungeon: ${Object.keys(DUNGEON_BOSSES).join(', ')}, unstruck | Three-phase: ${Object.keys(BX).join(', ')} (all work with /spawn)`); break;
      case 'seals': {
        if (this.map.kind !== 'dungeon' || !this.map.sealsLeft) { say('No seals here.'); break; }
        while (this.map.sealsLeft) this.breakSeal('By admin decree.');
        break;
      }
      case 'adminchest': {                                 // /adminchest [N]: a gilded chest only admins can conjure; break it for the best loot
        if (this.map.kind === 'nexus' || this.map.kind === 'vault') { say('Spawn it in the realm or a dungeon.'); break; }
        let made = 0;
        for (let k = 0; k < Math.min(5, n(args[0], 1)); k++) {
          let x = 0, y = 0, ok = false;
          for (let t = 0; t < 40 && !ok; t++) {                 // an open tile 2-4 tiles from you, clear of anything else
            const a = R() * TAU, d = 2 + R() * 2;
            x = Math.floor(p.x + Math.cos(a) * d) + 0.5; y = Math.floor(p.y + Math.sin(a) * d) + 0.5;
            ok = !isSolid(this.map, x, y) && !this.map.objects.some((q) => Math.floor(q.x) === Math.floor(x) && Math.floor(q.y) === Math.floor(y));
          }
          if (!ok) continue;
          this.map.objects.push({ sprite: 'admin_chest', x, y, solid: true, interact: 'chest', admin: true });
          this.map.solid[Math.floor(y) * this.map.w + Math.floor(x)] = 1;
          this.vx({ k: 'burst', x, y: y - 0.5, n: 30, colors: ['#ff4af0', '#ffd650', '#ffffff'] });
          made++;
        }
        say(made ? `${made} admin chest${made > 1 ? 's' : ''} conjured. Break ${made > 1 ? 'them' : 'it'} open.` : 'No room here: step somewhere open.');
        break;
      }
      case 'pet': {                                        // /pet [kind] [rarity] [max]: a pet for testing (max = every ability at its cap)
        const kind = PET_KINDS[args[0]] ? args[0] : hatchKind(undefined, R), rar = RARITY[args[1]] ? args[1] : 'common';
        if (this.pets().length >= PET_MAX) { say('Your Pet Yard is full.'); break; }
        const q = newPet(kind, rar);
        if (args[2] === 'max') for (const A of Object.values(q.ab)) A.lv = petCap(q);
        this.pets().push(q); if (!this.activePet()) this.save.activePet = q.id; this.persist();
        say(`Added a ${RARITY[rar].name} ${petName(q)}${args[2] === 'max' ? ' (maxed)' : ''}. Kinds: ${Object.keys(PET_KINDS).join(', ')}; rarities: ${Object.keys(RARITY).join(', ')}.`);
        break;
      }
      case 'keys': {                                       // /keys [dungeon]: one key for every dungeon (or N of one)
        const ids = args[0] ? [`key_${args[0]}`] : Object.keys(DUNGEONS).map((d) => `key_${d}`);
        const got = [];
        for (const id of ids) { if (!ITEMS[id]) { say(`No key for "${args[0]}". Dungeons: ${Object.keys(DUNGEONS).join(', ')}`); break; } for (let k = 0; k < n(args[1], 1); k++) { const f = p.inv.indexOf(null); if (f < 0) break; p.inv[f] = id; got.push(id); } }
        say(got.length ? `Added ${got.length} key${got.length > 1 ? 's' : ''}. Use one to open its dungeon.` : 'Your backpack is full.'); this.events.push({ type: 'ground' });
        break;
      }
      case 'star': {
        if (this.map.kind !== 'realm') { say('/tp realm first.'); break; }
        this.worldEvent('star'); break;
      }
      case 'event': {
        if (this.map.kind !== 'realm') { say('/tp realm first.'); break; }
        const b = args[0] || BIOMES[Math.max(0, biomeAt(this.map, p.x, p.y))];
        if (!HERALDS[b]) { say('Biomes: shore, fen, runeholt, godfall'); break; }
        this.startEvent(b, near(7)); break;
      }
      case 'progress': {
        const b = args[0];
        if (!this.map.ev || !this.map.ev[b]) { say('Usage: /progress shore|fen|runeholt|godfall N'); break; }
        this.map.ev[b].progress = Math.min(EVENTS_TO_BOSS - 1, n(args[1], EVENTS_TO_BOSS - 1));
        say(`${b}: ${this.map.ev[b].progress}/${EVENTS_TO_BOSS}`); break;
      }
      case 'tp': {
        const w = (args[0] || '').toLowerCase();
        if (w === 'nexus') { this.enter('nexus'); break; }
        if (DUNGEONS[w] || w.startsWith('rf_')) { this.enter(w); break; }
        if (this.map.kind !== 'realm') this.enter('realm');
        const bi = BIOMES.indexOf(w);
        if (bi >= 0) { const at = randomTileInBiome(this.map, bi, R, null); if (at) { p.x = at.x; p.y = at.y; } }
        else if (args.length === 2 && !isNaN(+args[0])) { p.x = +args[0]; p.y = +args[1]; }
        say(`Teleported${bi >= 0 ? ' to ' + BIOME_LABEL[w] : ''}.`); break;
      }
      case 'bx': {                                         // /bx <boss>: a Realm Update boss beside you, to look at and fight
        const id = args[0];
        if (!BX[id]) { say(`Bundle bosses: ${Object.keys(BX).join(', ')}`); break; }
        const e = this.spawnRealmBoss(id, near(7), bxEnemyDef(id));
        if (e) say(`${e.D.name} (${e.D.hp} life). Phases at 66% and 33%.`);
        break;
      }
      case 'kraken': case 'treant': {                       // /kraken, /treant: the realm event now, and you at its edge
        if (this.map.kind !== 'realm') { say('Realm events only happen in the realm.'); break; }
        const id = cmd === 'kraken' ? 'abyssal_kraken' : 'thornheart_treant', e = this.spawnEventBoss(id);
        if (!e) { say('It is already here (or there is nowhere for it).'); break; }
        p.x = e.home.x; p.y = e.home.y + 10.5; this.unstick(p);
        say(`${e.D.name}: ${e.D.hp} life. Step in to wake it.`);
        break;
      }
      case 'melon': {                                      // /melon: a Giant Watermelon right here
        if (this.map.kind !== 'realm') { say('Melons only grow in the realm.'); break; }
        const e = this.spawnMelon({ x: p.x + 3.5, y: p.y + 0.5 }, false);
        say(e ? 'A Giant Watermelon plops down beside you.' : 'One is already growing somewhere.');
        break;
      }
      case 'killall': {
        let k = 0;
        for (const e of this.enemies) if (!e.dead && dist(e.x, e.y, p.x, p.y) < 15) { this.damageEnemy(e, 1e7, e.x, e.y); k++; }
        if (this.boss && this.boss.state !== 'dead' && dist(this.boss.x, this.boss.y, p.x, p.y) < 20) this.killBoss();
        say(`Killed ${k}.`); break;
      }
      case 'clearbags': this.bags.length = 0; this.map.bags = this.bags; this.nearBag = null; this.events.push({ type: 'ground' }); say('Bags cleared.'); break;
      case 'portal': { const to = DUNGEONS[args[0]] ? args[0] : 'forge'; this.openPortal(to, p.x + 1.5, p.y, 60); break; }
      default: say(`Unknown command /${cmd}. Type /help.`);
    }
  }
  openPortal(to, x, y, life = 40) {
    if (to.startsWith('rf_')) return this.rfOpenPortal(to, x, y, life);   // a Realmforge dungeon (src/rf/host.js)
    const D = DUNGEONS[to];
    this.map.portals.push({ kind: D.portal, x, y, label: D.name, to, life });
    this.say(`A portal to ${D.name} has opened!`, '#3befff');
  }
  usePortal() {
    if (this.player.dead) return;
    if (!this.nearPortal && this.nearNPC) {
      const o = this.nearNPC;
      this.interact(o);
      return;
    }
    if (!this.nearPortal) return;
    const pt = this.nearPortal;
    if (pt.life !== undefined) this.map.portals = this.map.portals.filter((x) => x !== pt);   // used portals close
    this.travel(pt.to);
  }
  toNexus() {
    if (this.mode === 'play' && !this.player.dead && this.map.kind !== 'nexus') this.travel('nexus');
  }
  // going through a portal: the UI shows a loading card first (onTravel), then the map is made; headless, at once
  travel(where) { if (this.onTravel) this.onTravel(where); else this.enter(where); }
  // where a portal leads, for the loading card: its name, how dangerous it is (1-5), a line about it
  destination(where) {
    if (where === 'nexus') return { name: 'The Nexus', stars: 0, sub: 'Safe ground. Rest, trade, and stash your loot.' };
    if (where === 'vault') return { name: 'Your Vault', stars: 0, sub: 'Everything you have kept, safe.' };
    if (where === 'realm') return { name: 'The Realm', stars: -1, sub: 'The shore is gentle. The closer to the middle, the deadlier it gets.' };
    if (where.startsWith('rf_')) return this.rfDest(where);         // a Realmforge dungeon or boss room (src/rf/host.js)
    const D = DUNGEONS[where];
    if (!D) return { name: where, stars: 0, sub: '' };
    const dg = { hive: 0.6, chapel: 0.7, crypt: 0.8, theatre: 0.82, forge: 0.9, ember: 0.95, spire: 0.97, dream: 1, heart: 1 }[where] || 0.85;
    const boss = BX[D.boss] ? BX[D.boss].name : DUNGEON_BOSSES[D.boss] ? DUNGEON_BOSSES[D.boss].name : D.boss === 'unstruck' ? 'The Unstruck' : '';
    return { name: D.name, stars: Math.max(1, Math.min(5, Math.round((dg - 0.45) * 8) + (D.mobHp > 1.5 ? 1 : 0))), sub: boss ? `Its master: ${boss}` : '' };
  }
}
installD4(Game);
installBX(Game);
installWeaponMech(Game);
installHalos(Game);
installSigils(Game);
installMythics(Game);
installGearMech(Game);
installMelon(Game);
installRealmEvents(Game);
installFrostveil(Game);
installMirerot(Game);
installAstral(Game);
installOrbiters(Game);
installSandscour(Game);
installKeep(Game);
installHollowmoon(Game);
installCryptEmber(Game);
installElites(Game);
installRemaster(Game);
installSetpieces(Game);
installRF(Game);
installRFBoss(Game);
installUniqMech(Game);
wireBxSetpieces(BX);
