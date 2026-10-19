// The user's Realmforge dungeons, hosted (docs/realmforge_port.md). Their engine (src/rf/explore_gen.js, built from
// Realmforge by tools/rf_build_explore.py) lays the dungeon out and runs its creatures, traps, rooms and module rules
// exactly as Realmforge does; this file is the game around it: our map (tiles, 2.5D walls, collision) mirrors theirs,
// our player stands in for theirs, our shots hit their creatures, their hits hurt us, kills and chests reward us, and
// our renderer draws all of it (their art, 8 pixels to a tile, drawn at 2x like ours).
import { makeExplore } from './explore_gen.js';
import { TID } from '../world/maps.js';
import { lift, R } from '../util.js';
import { rollLoot } from '../data/items.js';
import { bossData } from './boss.js';
import { RF_FOE_LANDS } from '../data/rf_foes.js';

const TS = 16, K = 2;                                             // our tile is 16 buffer pixels; their art is 8 to a tile
// their tile codes (C in explore.js) -> our tile names: a code change is a tile change, so our chunk caches follow
export const RF_CODE_TILE = ['rf_wall', 'rf_floor', 'rf_path', 'rf_pit', 'rf_secret', 'rf_gate', 'rf_haz', 'rf_liq', 'rf_ice', 'rf_bridge', 'rf_tog', 'rf_break', 'rf_conv', 'rf_deep'];
export const RF = { hpScale: 1, dmgScale: 1 };                    // balance (phase 4)
let DATA = null, X = null;
const HOST = {};                                                  // filled in by rfMap: the calls their engine makes to us

// boot: the Realmforge data (dungeons, creatures, art) is loaded once, in the background
export async function loadRF() {
  try { DATA = await (await fetch('art/rf/data.json')).json(); X = makeExplore(DATA, HOST); bossData(DATA); } catch (err) { console.warn('Realmforge data not loaded', err); }
}
export const rfReady = () => !!X;
export const rfDungeons = () => (DATA ? DATA.dungeons.map((d) => d.id) : []);
const dgOf = (id) => DATA && DATA.dungeons.find((d) => d.id === id);

const methods = {
  // a fresh run of one of their dungeons, as our map
  rfMap(where) {
    const id = where.slice(3), dg = dgOf(id);
    if (!X || !dg) return null;
    const g = this;
    Object.assign(HOST, {
      msg: (t, dur) => g.banner(t, Math.max(1800, dur * 1000), true),
      hurt: (d, o) => { const p = g.player, hp = p.hp; g.hurtPlayer(Math.round(d * RF.dmgScale), (o && o.d && o.d.name) || dg.name); return Math.max(0, Math.round(hp - p.hp)); },
      ground: (p, ground, dt, mod) => g.rfGround(p, ground, dt, mod),
      pickup: (d) => { if (d.k === 'potion') g.rfPotion(); },
      drop: (e) => g.rfDrop(e),
      chest: (pr) => g.rfChest(pr),
      heal: () => { const P = g.player; P.hp = g.stat('hp'); P.mp = g.stat('mp'); },
      kill: (e) => g.rfKill(e),
      shrine: () => { g.player.status.berserk = Math.max(g.player.status.berserk || 0, 20); },
      bossDoor: () => {},
    });
    const seed = (Date.now() & 0xffffff) | 5;
    if (!X.setup(dg, seed)) return null;
    const E = X.E || this.rfE();
    const M = E.M, m = {
      kind: 'dungeon', name: dg.name, w: M.W, h: M.H, tiles: new Uint8Array(M.W * M.H), solid: new Uint8Array(M.W * M.H),
      biome: new Int8Array(M.W * M.H).fill(-1), objects: [], portals: [], rooms: [], spawn: { x: M.start.x, y: M.start.y },
      rf: { id, dg, E, X, pots: E.pots, coins: E.coins, tick: 0 },
    };
    m.rfSolid = (x, y) => X.solidMove(x, y);
    m.rfShot = (x, y) => X.solidShot(x, y);
    this.rfSync(m);
    for (const e of E.en_) this.rfScale(e);
    return m;
  },
  // the loading card for one of their dungeons or boss rooms
  rfDest(where) {
    if (where.startsWith('rf_boss:')) { const B = DATA && DATA.bosses.find((b) => b.id === where.slice(8)); return { name: B ? B.name : where, stars: 4, sub: B ? B.title : '' }; }
    const dg = dgOf(where.slice(3)), i = DATA ? DATA.dungeons.indexOf(dg) : 0, B = dg && DATA.bosses.find((b) => b.id === dg.boss);
    return { name: dg ? dg.name : where, stars: Math.max(1, Math.min(5, 1 + Math.round(i / 6))), sub: B ? `Its master: ${B.name}` : '' };
  },
  // the realm keeps about one pack of each portal dropper in its land; the Unmaker's Eye is a rare sight in Godfall
  rfMaintain(packs, r) {
    const alive = {};
    for (const e of this.enemies) if (!e.dead && e.D.rfPortal) alive[e.id] = (alive[e.id] || 0) + 1;
    for (const [land, ids] of Object.entries(RF_FOE_LANDS)) for (const id of ids) {
      if (alive[id]) continue;
      if (id === 'rf_the_unmaker_s_eye') { if ((r || R)() < (r ? 0.5 : 0.004)) this.spawnGroup(land, r || R, this.player || this.map.spawn, 18, id); continue; }
      this.spawnPack(land, id, r);
    }
    void packs;
  },
  // a portal to one of their dungeons, in their portal's art
  rfOpenPortal(to, x, y, life) {
    const id = to.slice(3), dg = dgOf(id);
    if (!dg) return;
    this.map.portals.push({ kind: 'dungeon', rf: id, x, y, label: dg.portal_name ? `${dg.name} (${dg.portal_name})` : dg.name, to, life });
    this.say(`A portal to ${dg.name} has opened!`, dg.glow || '#3befff');
  },
  rfE() { return X.state ? X.state() : null; },
  rfScale(e) { if (!e.rfScaled) { e.rfScaled = 1; e.hp = e.max = Math.round(e.max * RF.hpScale); } },
  // our map follows theirs: tile codes, and what blocks you (their walls and solid things)
  rfSync(m) {
    const M = m.rf.E.M, t = M.t, og = m.rf.E.og;
    for (let k = 0; k < t.length; k++) {
      const v = TID[RF_CODE_TILE[t[k]]];
      if (m.tiles[k] !== v) m.tiles[k] = v;
      m.solid[k] = X.BM[t[k]] && !(t[k] === X.C.DEEP && M.deepWalk) ? 1 : og && og[k] > 0 ? 1 : 0;
    }
  },
  // one frame of their dungeon around our player
  rfUpdate(dt) {
    const m = this.map, R = m.rf, E = R.E, p = this.player, ep = E.p;
    if (!ep) return;
    ep.x = p.x; ep.y = p.y; ep.hp = p.hp;
    const bx = ep.x, by = ep.y;
    X.tick(dt);
    if (ep.x !== bx || ep.y !== by) { p.x = ep.x; p.y = ep.y; this.unstick(p); }   // their portals, a collapsing floor, a push
    for (const e of E.en_) this.rfScale(e);
    if ((R.tick = (R.tick || 0) + 1) % 3 === 0 || E.ogDirty === 0) this.rfSync(m);
    if (E.pots > R.pots) { for (let k = R.pots; k < E.pots; k++) this.rfPotion(); }
    R.pots = E.pots;
    if (E.banner && E.banner !== R.banner) { R.banner = E.banner; this.banner(E.banner.t, 2200, false); }
    if (E.M.bossDoor && !R.door && E.atDoor) {                 // the boss's door: it opens onto the boss's own room
      R.door = { kind: 'dungeon', hidden: true, x: E.M.bossDoor.x + 0.5, y: E.M.bossDoor.y + 1, label: E.B.name, to: `rf_boss:${E.B.id}` };
      m.portals.push(R.door);
      this.banner(`${E.B.name} waits beyond this door.`, 2500);
    }
  },
  // what the ground does to you: ice slides you, liquid slows and may hurt, conveyors, winds and currents push
  rfGround(p, ground, dt, mod) {
    const P = this.player, C = X.C, M = this.map.rf.E.M;
    let ex = p.ext[0], ey = p.ext[1];
    p.ext[0] *= Math.exp(-dt * 6); p.ext[1] *= Math.exp(-dt * 6);
    if (ground === C.CONV) { const dr = M.aux[M.I(Math.floor(p.x), Math.floor(p.y))]; ex += [1, 0, -1, 0][dr & 3] * 2.6; ey += [0, 1, 0, -1][dr & 3] * 2.6; }
    if (mod && mod.push) { const q = mod.push(p, dt); ex += q[0]; ey += q[1]; }
    if (ex || ey) { this.moveCircle(P, ex * dt, ey * dt, 0.3); p.x = P.x; p.y = P.y; }
    P.rfSlow = ground === C.LIQ ? (this.map.rf.E.cfg.liquid && this.map.rf.E.cfg.liquid.slow) || 0.6 : p.root > 0 ? 0.12 : p.slow > this.map.rf.E.t ? 0.55 : 1;
  },
  rfPotion() {
    const p = this.player, f = p.inv.indexOf(null);
    if (f >= 0) p.inv[f] = 'pot_hp'; else this.addBag(p.x, p.y + 0.6, ['pot_hp']);
  },
  // a creature dies: experience, and now and then a bag (their keys stay theirs: the locks count them)
  rfKill(e) {
    const d = e.d, big = e.boss || d.size > 16;
    this.gainXp(Math.round((d.hp || 300) / (big ? 12 : 25)));
    const R = Math.random();
    if (big) this.addBag(e.x, e.y + 0.6, rollLoot(this.rfLoot(2), 1.5));
    else if (R < 0.06) this.addBag(e.x, e.y + 0.4, rollLoot(this.rfLoot(1), 1));
  },
  rfDrop(e) { if (Math.random() < 0.05) this.map.rf.E.drops.push({ k: 'potion', x: e.x + 0.3, y: e.y }); },
  // a chest: our loot, by how hard it was to reach
  rfChest(pr) {
    const L = { common: 1, puzzle: 1.6, rare: 2, challenge: 2.4, secret: 2.6 }[pr.loot] || 1;
    this.addBag(pr.x + 0.5, pr.y + 1.3, rollLoot(this.rfLoot(L), L));
    this.vx({ k: 'burst', ...this.rfLift(pr.x + 0.5, pr.y + 0.5), n: 10, colors: ['#ffe066', '#ffffff'] });
  },
  rfLift(x, y, h = 0.4) { const [lx, ly] = lift(x, y, h); return { x: lx, y: ly }; },
  // their dungeons sit in tier bands by depth of the realm (balance in phase 4)
  rfLoot(k) {
    const i = DATA.dungeons.findIndex((d) => d.id === this.map.rf.id), t = Math.min(11, 3 + Math.round(i / 3));
    return [{ slot: 'weapon', tiers: [t - 1, t + 1], p: 0.35 * k }, { slot: 'armor', tiers: [t - 1, t + 1], p: 0.35 * k }, { slot: 'ring', tiers: [1, 3], p: 0.15 * k },
      { slot: 'ability', tiers: [2, 4], p: 0.15 * k }, { id: 'pot_hp', p: 0.5 }, { stat: true, p: 0.08 * k }];
  },
  // our shot against their creatures (the loop in updateProjectiles calls this for each of your shots)
  rfShotHits(b) {
    const E = this.map.rf.E;
    for (const e of E.en_) {
      if (e.hp <= 0 || e.dormant || e.hidden || e.st === 'gone') continue;
      const [hx, hy] = lift(e.x, e.y + (e.z || 0), 0.45), rr = (e.r || 0.5) + b.r * 0.6;
      if ((b.x - hx) ** 2 + (b.y - hy) ** 2 < rr * rr) {
        if (b.hit) { if (b.hit.has(e)) continue; b.hit.add(e); }
        const dmg = Math.round(b.dmg);
        const hp0 = e.hp;
        X.damageEnemy(e, dmg, { x: e.x, y: e.y });
        const dealt = Math.max(0, hp0 - Math.max(0, e.hp));
        if (dealt) this.float(...lift(e.x, e.y, 1.2), `${Math.round(dealt)}`, '#ff5050');
        return !b.pierce;
      }
    }
    return false;
  },
};
export function installRF(Game) { Object.assign(Game.prototype, methods); }
