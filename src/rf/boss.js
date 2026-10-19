// The user's Realmforge bosses, hosted (docs/realmforge_port.md). Their boss engine (src/rf/boss_gen.js, built from
// Realmforge's engine.js by tools/rf_build_bosses.py) runs each fight as designed: its room, phases, attacks, movement,
// minions, allies, puzzles, speech and death. This file is the game around it: the boss room is our map, our player
// walks it (their arena moves you, so zero-g, frost and leashes work), our shots hit by their rules, their hits hurt
// us, and the phases turn on the boss's HP instead of the Armory's timer. Their arena is drawn by their own renderer
// into a canvas laid on the floor of our world; our player, shots and HUD are drawn over it.
import { makeBoss } from './boss_gen.js';
import { TID } from '../world/maps.js';
import { lift } from '../util.js';
import { rollLoot, ITEMS } from '../data/items.js';
import { mitigate, moveSpeed } from '../data/classes.js';
import { bandOfBoss } from './balance.js';

export const RFB = { dropUt: 0.2, dropLeg: 0.08, dropMyth: 0.02, phaseMax: 60 };   // a boss's own uniques, by rarity (HP and damage: src/rf/balance.js)
const DPR = 1.6, TP = 30;                                                      // their pixels to a tile; 30 * 1.6 = 48 = 16 * 3
let S = null;
const HOST = {
  DPR,
  stub: { querySelectorAll: () => [], querySelector: () => ({ style: {}, textContent: '', setAttribute() {} }), classList: { toggle() {} }, dataset: {}, append() {} },
  el(tag, attrs = {}, kids = []) { const e = document.createElement(tag); for (const k in attrs) { if (k === 'class') e.className = attrs[k]; else if (k === 'text') e.textContent = attrs[k]; else if (k === 'style') e.style.cssText = attrs[k]; else e.setAttribute(k, attrs[k]); } for (const k of [].concat(kids)) if (k) e.append(k); return e; },
  // the Armory's sprite painter (template.html): an 8x8 grid at a CSS size, with a thin black outline
  drawSprite(cv, grid, pal, css, opt = {}) {
    const N = grid.length, pad = opt.pad ?? 0.6, cell = Math.max(1, (N > 8 ? Math.round : Math.floor)(css * DPR / (N + pad * 2)));
    const ol = opt.outline === false ? 0 : Math.max(1, Math.round(cell / 6)), size = cell * N + Math.round(pad * cell) * 2, off = Math.round(pad * cell);
    cv.width = size; cv.height = size;
    const c = cv.getContext('2d'); c.clearRect(0, 0, size, size); c.fillStyle = '#000';
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (grid[y][x] !== '.') c.fillRect(off + x * cell - ol, off + y * cell - ol, cell + ol * 2, cell + ol * 2);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const ch = grid[y][x]; if (ch === '.') continue; c.fillStyle = pal[ch]; c.fillRect(off + x * cell, off + y * cell, cell, cell); }
  },
  spriteCanvas(grid, pal, css) { const c = document.createElement('canvas'); HOST.drawSprite(c, grid, pal, css, { pad: 0.3 }); return c; },
};
let DATA = null;
export function bossData(D) { DATA = D; if (!S && D) S = makeBoss(D, HOST); }

const methods = {
  // the boss room of a Realmforge dungeon, as our map
  rfBossMap(where) {
    const id = where.slice(8), B = DATA && DATA.bosses.find((b) => b.id === id);
    if (!S || !B) return null;
    const g = this, bal = bandOfBoss(DATA, id);
    Object.assign(HOST, {
      input: () => g.player.rfMove || [0, 0],
      spd: () => g.player.rfSpd ?? moveSpeed(g.stat('spd')),
      hurt: (d, src) => { const sh = B.shots[src]; g.hurtPlayer(Math.round(d * bal.bossDmg), sh && sh.name ? `${B.name}'s ${sh.name}` : B.name); },
      say: (nm, t, who) => { if (who !== 'sys') g.say(nm && who !== '*' ? `${nm}: ${t}` : t, who === '*' ? '#b8b0c8' : '#ffd0a0'); },
    });
    const A = S.start(B), R = A.room, cols = R ? R.cols : 18, rows = R ? R.rows : 14;
    const m = {
      kind: 'dungeon', name: B.name, w: cols, h: rows, tiles: new Uint8Array(cols * rows).fill(TID.rf_floor), solid: new Uint8Array(cols * rows),
      biome: new Int8Array(cols * rows).fill(-1), objects: [], portals: [], rooms: [], spawn: { x: cols / 2, y: rows - 3 },
      rfBoss: { id, B, A, S, bal, hp: Math.round(B.hp * bal.bossHp), max: Math.round(B.hp * bal.bossHp), phase: 0, done: false },
    };
    const ax = (x) => (x - 1) * TP, ay = (y) => (y - 2) * TP;               // world tiles -> their arena pixels (inner area)
    const out = (x, y) => x < 1 || y < 2 || x > cols - 1 || y > rows - 1;
    m.rfSolid = (x, y) => out(x, y) || !!S.solidAt(ax(x), ay(y), 0);
    m.rfShot = (x, y) => out(x, y) || S.shotBlocked(ax(x), ay(y));
    m.rfAx = ax; m.rfAy = ay;
    A.pl.x = ax(m.spawn.x); A.pl.y = ay(m.spawn.y);
    m.seen = null;                                                              // a boss room is lit: no fog
    return m;
  },
  rfBossUpdate(dt) {
    const m = this.map, F = m.rfBoss, A = F.A, p = this.player;
    A.pl.x = m.rfAx(p.x); A.pl.y = m.rfAy(p.y);
    if (!p.dead) S.step(dt);
    p.x = A.pl.x / TP + 1; p.y = A.pl.y / TP + 2;                              // their arena moved you (and kept you out of its walls)
    // the phases turn on HP: past the next phase's mark, the boss moves on (with its transition and its lines)
    const B = F.B, next = B.phases[F.phase + 1];
    if (next && !A.trans && !A.dying && F.hp / F.max <= S.phaseHP(next)) { F.phase++; F.minKills = 0; S.startTrans(F.phase); }
    if (A.trans && A.trans.next !== undefined) F.phase = A.trans.next;
    // phases the Armory ran on its timer, made to fit a fight on HP:
    const P = B.phases[F.phase] || {}, why = this.rfBossInvuln();
    if (F.cocoonPh !== F.phase) { F.cocoonPh = F.phase; F.cocoonDone = false; }
    if (P.cocoon && why === 'Shielded by the chrysalis') {   // a damage check: break the shell in time, or she emerges healed
      const S0 = F.shell || (F.shell = { hp: this.rfShellHp(P), t: 0 });
      S0.t += dt;
      if (S0.t > (P.cocoon.time || 10)) { F.hp = Math.min(F.max, F.hp + Math.round(F.max * 0.15)); F.shell = null; F.cocoonDone = true; this.banner(`${B.name} emerges from the chrysalis, healed.`, 2000); }
    } else F.shell = null;
    // an invulnerable phase that does not end by anything you do: survive it, and the fight moves on
    const hard = why && !['Changing phase', 'Phase starting', 'Last words', 'In the air', 'Underground', 'Out of reach', 'Above the clouds', 'Shielded by the chrysalis'].includes(why);
    F.lockT = hard && !A.trans && !A.dying ? (F.lockT || 0) + dt : 0;
    if (F.lockT > Math.max(12, P.len || 18)) { F.lockT = 0; this.rfBossSkip(); }
    // and no phase outstays its welcome: a boss that spends its phase in the air (Cinder's leaps) moves on after a while
    if (F.timePh !== F.phase) { F.timePh = F.phase; F.phaseT = 0; }
    if (!A.trans && !A.dying && (F.phaseT += dt) > RFB.phaseMax) { F.phaseT = 0; this.rfBossSkip(); }
    if (F.hp <= 0 && !A.dying && !F.dead) {
      if (B.fakeDeath && !A.faked) { A.faked = 1; S.fakeDeath(); F.hp = Math.round(F.max * 0.12); }   // it is not over
      else { F.dead = true; S.startDeath(); }
    }
    if (A.dying && !A.dying.pre && A.dying.t > 3 && !F.done) { F.done = true; this.rfBossWon(); }
  },
  rfShellHp(P) { const q = /([\d,]+) HP/.exec(P.text || ''); return Math.round((q ? +q[1].replace(/,/g, '') : 8000) * 0.55); },   // (their 8,000 was for the Armory's test player, who hit harder than ours)
  // on to the next phase now (its HP mark), or, in the last, the end
  rfBossSkip() {
    const F = this.map.rfBoss, next = F.B.phases[F.phase + 1];
    F.hp = next ? Math.min(F.hp, Math.floor(F.max * F.S.phaseHP(next)) - 1) : 0;
  },
  // our shot in the arena: their rules decide what it hits; the boss takes our damage (its DEF, its invulnerable spells)
  rfBossShot(b) {
    const m = this.map, F = m.rfBoss, A = F.A, x = m.rfAx(b.x), y = m.rfAy(b.y + 0.35);
    if (A.dying || A.trans) return false;
    // its minions can be shot (the Armory only showed them): the HP their description gives, or a few hits
    const T = S.tile();
    for (const mn of A.mins) {
      if (mn.hidden || Math.hypot(x - mn.x, y - mn.y) > T * 0.6) continue;
      if (b.hit) { if (b.hit.has(mn)) continue; b.hit.add(mn); }
      if (mn.rfHp === undefined) { const how = (F.B.shots[mn.key] || {}).how || '', q = /\(([\d,]+) HP\)/.exec(how); mn.rfHp = q ? +q[1].replace(/,/g, '') * F.bal.bossHp * 0.6 : 600 * F.bal.bossHp; }   // (minions a little under the boss's own scale)
      const d = mitigate(b.dmg, 10);
      mn.rfHp -= d; this.float(...lift(b.x, b.y, 0.6), `${d}`, '#ff5050');
      if (mn.rfHp <= 0) { A.mins = A.mins.filter((q) => q !== mn); A.hz.push({ k: 'anim', fx: 'impact_soul', x: mn.x, y: mn.y, size: T * 1.6, age: 0 }); F.minKills = (F.minKills || 0) + 1; }
      return !b.pierce;
    }
    const onBoss = S.bossAt(x, y), th0 = A.th ? A.th.hits : 0;
    if (!S.shot(x, y, Math.atan2(b.vy, b.vx))) return false;
    if (A.th && A.th.hits > th0) { const d = mitigate(b.dmg, F.bal.bossDef); F.hp = Math.max(0, F.hp - d); this.float(...lift(b.x, b.y, 0.6), `${d}`, '#ff5050'); return !b.pierce; }   // the true Vitrea among the thousand
    if (!onBoss) return !b.pierce;
    const inv = this.rfBossInvuln();
    if (inv === 'Shielded by the chrysalis' && F.shell) {                    // the chrysalis takes the blow
      const d = mitigate(b.dmg, F.bal.bossDef); F.shell.hp -= d; this.float(...lift(b.x, b.y, 0.6), `${d}`, '#f4ecd8');
      if (F.shell.hp <= 0) { F.shell = null; F.cocoonDone = true; this.banner('The chrysalis breaks!', 1800); }
      return !b.pierce;
    }
    if (inv) { this.float(...lift(b.x, b.y, 0.6), 'IMMUNE', '#a8b8d8'); return true; }
    if (b.hit) { if (b.hit.has(F)) return false; b.hit.add(F); }
    const d = mitigate(b.dmg, F.bal.bossDef);
    F.hp = Math.max(0, F.hp - d);
    this.float(...lift(b.x, b.y, 0.6), `${d}`, '#ff5050');
    return !b.pierce;
  },
  // why the boss can't be hurt right now (their rules), except that an invulnerable phase guarded by minions ends when
  // they fall (or, with none to kill, after the phase's time)
  rfBossInvuln() {
    const F = this.map.rfBoss, A = F.A, why = S.bossInvuln();
    if (why === 'Shielded by the chrysalis' && F.cocoonDone) return false;      // she has emerged
    if (why === 'Invulnerable phase' && (A.mins.length === 0 && (F.minKills > 0 || A.since > (A.P.len || 18)))) return false;
    return why;
  },
  // the boss falls: experience, its own uniques by their rarity, a bag of its dungeon's tier, and the way out
  rfBossWon() {
    const m = this.map, F = m.rfBoss, B = F.B;
    this.gainXp(Math.round(B.hp / 40));
    const items = [];
    for (const d of B.drops || []) {
      const id = `rf_${d.id}`; if (!ITEMS[id]) continue;
      const c = d.rarity === 'mythic' ? RFB.dropMyth : d.rarity === 'legendary' ? RFB.dropLeg : RFB.dropUt;
      if (Math.random() < c) items.push(id);
    }
    const T = F.bal.tiers, T2 = [T[0] + 1, T[1] + 1];                     // a boss gives a tier better than its dungeon's chests
    items.push(...rollLoot([{ slot: 'weapon', tiers: T2, p: 0.8 }, { slot: 'armor', tiers: T2, p: 0.8 }, { slot: 'ring', tiers: [1, 3], p: 0.5 },
      { slot: 'ability', tiers: [3, 5], p: 0.5 }, { stat: true, p: 0.6 }, { id: 'pot_hp', p: 1 }], 2.5));
    const A = F.A, bx = A.b1.x / TP + 1, by = A.b1.y / TP + 2;
    this.addBag(bx, by + 0.5, items);
    m.portals.push({ kind: 'realm', x: bx, y: by + 2, label: 'Back to the Realm', to: 'realm' });
    this.banner(`${B.name} is defeated!`, 3000);
  },
};
export function installRFBoss(Game) { Object.assign(Game.prototype, methods); }

// drawing: their arena canvas laid on our floor (turned with the camera), and the boss's health bar
const rmethods = {
  rfBossLayer(g, m) {
    const F = m.rfBoss, A = F.A, b = this.b;
    S.draw();
    const [ax, ay] = this.proj(0, 0), [bx, by] = this.proj(1, 0), [cx, cy] = this.proj(0, 1), k = 1 / (TP * DPR);
    b.save();
    b.setTransform(this.scale * (bx - ax) * k, this.scale * (by - ay) * k, this.scale * (cx - ax) * k, this.scale * (cy - ay) * k, this.scale * ax, this.scale * ay);
    b.imageSmoothingEnabled = false;
    b.drawImage(A.cv, 0, 0);
    b.restore();
  },
  rfBossBar(g, m) {
    const F = m.rfBoss, b = this.b, BW = this.buf.width, w = Math.min(220, BW - 40), x = Math.round((BW - w) / 2), y = 54;   // (under the currency counters)
    if (F.done) return;
    const inv = g.rfBossInvuln(), P = F.B.phases[F.phase];
    b.fillStyle = 'rgba(0,0,0,.7)'; b.fillRect(x - 2, y - 2, w + 4, 10);
    b.fillStyle = inv ? '#8d88a0' : '#d8383c'; b.fillRect(x, y, Math.round(w * F.hp / F.max), 6);
    b.fillStyle = '#fff'; b.font = '8px monospace'; b.textAlign = 'center';
    b.fillText(`${F.B.name}${P ? ' · ' + P.name : ''}${inv ? ' · invulnerable' : ''}`, BW / 2, y - 5); b.textAlign = 'left';
  },
};
export function installRFBossRender(Renderer) { Object.assign(Renderer.prototype, rmethods); }
