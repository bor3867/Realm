// DOM side-panel + overlay screens.
import { CLASSES, STATS, STAT_NAMES, xpToNext, MAX_LEVEL, FAME_GOALS } from './data/classes.js';
import { outlinedFrame } from './outline.js';
import { ITEMS, itemLabel, specialLines, canEquip, SETS, SET_PIECES } from './data/items.js';
import { ENEMIES, DUNGEONS, DUNGEON_RATING, DUNGEON_BOSSES, portalDrop2 } from './data/enemies.js';
import { BX } from './bosses/index.js';
import { armoryTip, ARM_COL } from './armory_tip.js';
import { drawIcon as armIcon } from './armory_art.js';
const BIOME_NAME = { shore: 'Shore', lowlands: 'Lowland', fen: 'Fen', thornwood: 'Thornwood', steppe: 'Steppe', runeholt: 'Runeholt', dunes: 'Dune', godfall: 'Godfall', frostveil: 'Frostveil' };
import { POT_STACK, slotPrice } from './game.js';
import { ACTIONS, MINI_STEPS, keyLabel, resetSettings, keyName, keyParen } from './settings.js';
import { CURSOR_STYLES, CURSOR_COLORS, CURSOR_SIZES, cursorPreview } from './cursor.js';
import { PET_KINDS, RARITY, RARITY_ORDER, ABILITIES, PET_TICK, PET_MAX, petHeal, petMagic, petXpToNext, petCap, petMaxed, feedCost, feedValue, canMorph, FUSE_GOLD, petSprite, petName, abilityOrder, mainMaxed, petLevel } from './data/pets.js';
import { loadAccounts, saveAccounts, saveKeyFor, hashPassword, loadSave, normalizeSave, getSession, setSession } from './save.js';

const $ = (id) => document.getElementById(id);
const SLOT_HINT = ['WPN', 'ABL', 'ARM', 'RNG'];
const TIER_COL = ['#d48a4a', '#aeb8d0', '#eab04a', '#b8d4f0', '#6ee0b0', '#78a8ff', '#ff5e78', '#b888ff', '#ffd650', '#ff7a1a', '#38f0ff', '#ffbe40'];
const POT_COL = { pot_hp: '#ff4a5a', pot_mp: '#5a8aff' };
// the HUD's white pixel icons (RotMG-style), 12x12, drawn as crisp SVG
const HUD_ICON = {
  stats: ['............', '.........##.', '.........##.', '.........##.', '.....##..##.', '.....##..##.', '.....##..##.', '.##..##..##.', '.##..##..##.', '.##..##..##.', '.##..##..##.', '............'],
  pet: ['............', '.#.......#..', '.##.....##..', '.#########..', '.#########..', '.##.###.##..', '.#########..', '.####.####..', '..#######...', '...#####....', '............', '............'],
  gear: ['............', '.....##.....', '..#.####.#..', '..########..', '...##..##...', '.###....###.', '.###....###.', '...##..##...', '..########..', '..#.####.#..', '.....##.....', '............'],
  bag: ['............', '....####....', '...#....#...', '...######...', '..########..', '.##########.', '.###.##.###.', '.##########.', '.##########.', '.##########.', '..########..', '............'],
  rec: ['............', '..########..', '..#......#..', '..#.####.#..', '..#......#..', '..#.####.#..', '..#......#..', '..#.###..#..', '..#......#..', '..########..', '............', '............'],   // (a sheet: your record)
  pouch: ['............', '............', '...######...', '..#......#..', '.##########.', '.##########.', '.####..####.', '.####..####.', '.##########.', '.##########.', '............', '............'],
};
const hudIcon = (k) => { const G = HUD_ICON[k]; let r = '';
  G.forEach((row, y) => [...row].forEach((c, x) => { if (c === '#') r += `<rect x="${x}" y="${y}" width="1" height="1"/>`; }));
  return `<svg viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`; };
// a character's record as rows (the character tab, and a fallen hero's page in the Hall of Legends)
export const liveRecord = (p) => ({ kills: p.kills || 0, bossKills: p.bossKills || 0, dungeons: p.dungeons || 0, shots: p.shotsFired || 0, hits: p.shotsHit || 0,
  dmgDealt: Math.round(p.dmgDealt || 0), dmgTaken: Math.round(p.dmgTaken || 0), potions: p.potions || 0, abilities: p.abilities || 0, chests: p.chests || 0, secrets: p.secrets || 0,
  lore: (p.lore || []).length, quests: (p.quests || []).filter((q) => q.done).length, mins: Math.round((p.playT || 0) / 60), xp: p.totalXp || 0 });
export function recordRows(d, short = false) {   // (short: the labels for the side panel's narrow box)
  const n = (v) => (v || 0).toLocaleString(), acc = d.shots ? `${Math.round((100 * (d.hits || 0)) / d.shots)}%` : '—';
  const t = d.mins >= 60 ? `${Math.floor(d.mins / 60)}h ${d.mins % 60}m` : `${d.mins || 0}m`;
  const L = short ? ['Kills', 'Boss kills', 'Dungeons', 'Shots', 'Hits', 'Accuracy', 'Dmg dealt', 'Dmg taken', 'Potions', 'Abilities', 'Chests', 'Secrets', 'Lore read', 'Quests', 'XP', 'Played']
    : ['Monsters killed', 'Bosses killed', 'Dungeons completed', 'Shots fired', 'Shots hit', 'Accuracy', 'Damage dealt', 'Damage taken', 'Potions drunk', 'Abilities used', 'Chests opened', 'Secret rooms found', 'Lore stones read', 'Quests finished', 'Experience', 'Time played'];
  return [n(d.kills), n(d.bossKills), n(d.dungeons), n(d.shots), n(d.hits), acc, n(d.dmgDealt), n(d.dmgTaken), n(d.potions), n(d.abilities), n(d.chests), n(d.secrets), n(d.lore), n(d.quests), n(d.xp), t].map((v, i) => [L[i], v]);
}
export function rarityColor(it) {
  if (it.arm) return ARM_COL[it.armTier];                // (the Mad God Armory's own tier colours)
  if (it.admin) return '#ff4af0';
  if (it.mythic) return '#8af6ff';
  if (it.legendary) return '#ffe9a0';
  if (it.ut) return it.bag === 'urn' ? '#ff6a4a' : '#f2c14e';
  if (it.use && it.use.egg && RARITY[it.use.egg]) return RARITY[it.use.egg].color;
  if (it.slot === 'consumable') return POT_COL[it.id] || '#d8b8ff';
  return TIER_COL[it.tier];
}

// tier tags in a pixel font of their own (2026-10-19): every glyph is 3x5, every digit its own shape (a 5's right
// side is open above where an 8's is closed), drawn at 2 pixels per pixel with a 1-pixel black rim and cached
const PX_GLYPH = { 0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'],
  3: ['111', '001', '011', '001', '111'], 4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '110'],
  6: ['011', '100', '111', '101', '111'], 7: ['111', '001', '010', '010', '010'], 8: ['111', '101', '111', '101', '111'],
  9: ['111', '101', '111', '001', '110'], T: ['111', '010', '010', '010', '010'], U: ['101', '101', '101', '101', '111'],
  M: ['101', '111', '111', '101', '101'], L: ['100', '100', '100', '100', '111'] };
const pxCache = new Map();
export function pixelTag(text, color) {
  const key = text + '|' + color;
  if (pxCache.has(key)) return pxCache.get(key);
  const P = 2, gl = [...text].map((ch) => PX_GLYPH[ch] || PX_GLYPH[0]), w = gl.length * 4 - 1, h = 5;
  const cv = document.createElement('canvas'); cv.width = (w + 2) * P; cv.height = (h + 2) * P;
  const x = cv.getContext('2d');
  const each = (fn) => gl.forEach((g, i) => g.forEach((row, y) => [...row].forEach((b, xx) => { if (b === '1') fn(1 + i * 4 + xx, 1 + y); })));
  x.fillStyle = '#000';
  each((gx, gy) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) x.fillRect((gx + dx) * P, (gy + dy) * P, P, P); });
  x.fillStyle = color; each((gx, gy) => x.fillRect(gx * P, gy * P, P, P));
  const url = cv.toDataURL(); pxCache.set(key, url); return url;
}

export class UI {
  constructor(game, renderer) {
    this.g = game; this.r = renderer;
    this.slots = { equip: [], inv: [], ground: [], pots: [] };
    this.build('equip', 4); this.build('inv', 16); this.build('pots', 2); this.build('ground', 80);
    this.tip = $('tooltip');
    this.bannerT = 0;
    this.capturing = null;
    $('gear').onclick = (ev) => { ev.stopPropagation(); this.toggleGearMenu(); };
    // the gear's dropdown (RotMG-style): options, home, character select, switch account
    $('gearmenu').querySelectorAll('[data-m]').forEach((b) => { b.onclick = (ev) => { ev.stopPropagation(); this.gearMenu(b.dataset.m); }; });
    document.addEventListener('pointerdown', (ev) => { if (!$('gearmenu').classList.contains('hidden') && !ev.target.closest('#gearmenu, #gear')) $('gearmenu').classList.add('hidden'); });
    // the vault window: opens when you stand on your vault chest
    $('vwclose').onclick = () => { this.closeVault(true); };
    $('vaultwin').querySelectorAll('[data-sort]').forEach((b) => { b.onclick = () => { this.sortVault(b.dataset.sort); b.blur(); }; });
    $('portalgo').onclick = () => { this.enterNear(); $('portalgo').blur(); };
    $('bagportal').onclick = () => { this.g.usePortal(); this.refreshPortal(); $('bagportal').blur(); };
    $('baglootall').onclick = () => { this.g.lootAll(); this.refreshSlots(); $('baglootall').blur(); };   // for mouse players: everything that fits, in one click
    $('miniIn').onclick = () => this.miniZoom && this.miniZoom(-1);
    $('miniOut').onclick = () => this.miniZoom && this.miniZoom(1);
    document.querySelectorAll('#panel [data-icon]').forEach((b) => { b.innerHTML = hudIcon(b.dataset.icon); });
    // the icon row opens Stats or Pet in the backpack's box (a second press goes back); the box's tabs are the backpacks
    document.querySelectorAll('#iconrow [data-t]').forEach((b) => { b.onclick = () => { this.statTab = this.statTab === b.dataset.t ? 'inv' : b.dataset.t; this.petKey = null; b.blur(); }; });
    document.querySelectorAll('#stattabs [data-pg]').forEach((b) => { b.onclick = () => {
      if (b.classList.contains('off')) return;
      this.statTab = 'inv'; this.invPage = +b.dataset.pg; this.refreshSlots(); b.blur(); }; });
  }
  overlayOpen() { return !$('overlay').classList.contains('hidden'); }

  // ------------------------------------------------------------- shop + forge
  closeModal() { this.modal = null; this.closeOverlay(); this.refreshSlots(); }
  wallet() { const s = this.g.save; return `<span class="fame">${s.gold || 0} gold</span> · <span style="color:#b98cff">${s.essence || 0} essence</span>`; }
  itemCell(id, extra) {
    const it = ITEMS[id];
    const col = rarityColor(it);
    return `<div class="ware"><div class="ico" style="background-image:url(${this.r.icon(id)})"></div>
      <div class="wn"><b style="color:${col}">${it.name}</b><small>${itemLabel(it)}</small></div>${extra}</div>`;
  }
  openShop(msg = '') {
    this.modal = 'shop';
    const g = this.g, p = g.player;
    const buy = g.shop.map((s0, i) => this.itemCell(s0.id, `<button class="btn sm" data-buy="${i}">${s0.price}g</button>`)).join('');
    const sell = [...p.inv.map((id, i) => [id, 'inv', i])].filter(([id]) => id)
      .map(([id, c, i]) => this.itemCell(id, `<button class="btn sm" data-sell="${c}:${i}">+${g.sellPrice(ITEMS[id])}g</button>`)).join('') || '<p class="mut">Your backpack is empty.</p>';
    const o = this.overlay(`<div class="screen shop"><h1>The Salt-Peddler</h1>
      <h2>"Everything the tide brings in, I sell back out." · ${this.wallet()}</h2>
      <div class="cols"><section><h3>Buy</h3>${buy}</section><section><h3>Sell from your backpack</h3>${sell}</section></div>
      <p class="msg">${msg}</p><button class="btn" id="mclose">Leave${keyParen('settings')}</button></div>`);
    o.querySelectorAll('[data-buy]').forEach((b) => { b.onclick = () => this.openShop(g.buy(+b.dataset.buy)); });
    o.querySelectorAll('[data-sell]').forEach((b) => { b.onclick = () => { const [c, i] = b.dataset.sell.split(':'); this.openShop(g.sell(c, +i)); }; });
    o.querySelector('#mclose').onclick = () => this.closeModal();
  }
  openForge(msg = '') {
    this.modal = 'forge';
    const g = this.g, p = g.player;
    const rows = [...p.equip.map((id, i) => [id, 'equip', i]), ...p.inv.map((id, i) => [id, 'inv', i])].filter(([id]) => id).map(([id, c, i]) => {
      const it = ITEMS[id], nxt = g.nextTierId(it), cost = nxt ? g.upgradeCost(it) : null;
      const up = nxt && ITEMS[nxt] ? `<button class="btn sm" data-up="${c}:${i}" title="→ ${ITEMS[nxt].name}">Upgrade · ${cost.essence}e ${cost.gold}g</button>` : '';
      const sv = g.salvageValue(it) ? `<button class="btn sm" data-salv="${c}:${i}">Salvage · +${g.salvageValue(it)}e</button>` : '';
      return this.itemCell(id, `<div class="acts">${c === 'equip' ? '<small class="mut">equipped</small>' : ''}${up}${sv}</div>`);
    }).join('');
    const o = this.overlay(`<div class="screen shop"><h1>The Ashwright's Forge</h1>
      <h2>"Bring me iron. I'll give you better iron. Bring me junk, I'll melt it." · ${this.wallet()}</h2>
      <section class="forge"><h3>Upgrade a tiered item one tier, or salvage anything into essence</h3>${rows || '<p class="mut">Nothing to work on.</p>'}</section>
      <p class="msg">${msg}</p><button class="btn" id="mclose">Leave${keyParen('settings')}</button></div>`);
    o.querySelectorAll('[data-up]').forEach((b) => { b.onclick = () => { const [c, i] = b.dataset.up.split(':'); this.openForge(g.upgrade(c, +i)); }; });
    o.querySelectorAll('[data-salv]').forEach((b) => { b.onclick = () => { const [c, i] = b.dataset.salv.split(':'); this.openForge(g.salvage(c, +i)); }; });
    o.querySelector('#mclose').onclick = () => this.closeModal();
  }

  // ------------------------------------------------------------- the Pet Yard: your companions, feeding, eggs
  petIcon(sprite) {
    this.petIcons = this.petIcons || {};
    if (this.petIcons[sprite]) return this.petIcons[sprite];
    const rd = sprite.startsWith('pt2_') && this.r.R && this.r.R.resolve(sprite);
    if (rd) {                                                // a Pets v2 form: its idle frame, centred on a 12x12 ground so every stage keeps its scale
      const f = rd.frames.idle1 || rd.frames[Object.keys(rd.frames)[0]], cv = document.createElement('canvas');
      cv.width = cv.height = 12;
      cv.getContext('2d').drawImage(rd.img, f.x, f.y, f.w, f.h, Math.floor((12 - f.w) / 2), 12 - f.h, f.w, f.h);
      return (this.petIcons[sprite] = cv.toDataURL());
    }
    const W = this.r.W, k = W.objects[sprite] ?? W.objects[sprite.replace(/_(gold|divine)$/, '')], c = W.objectsCols, cv = document.createElement('canvas');
    cv.width = cv.height = 16;
    cv.getContext('2d').drawImage(this.r.A.img.objects, (k % c) * 16, Math.floor(k / c) * 16, 16, 16, 0, 0, 16, 16);
    return (this.petIcons[sprite] = cv.toDataURL());
  }
  // the Dungeon Atlas: every dungeon, its stars, its boss, and what drops its portal
  openAtlas() {
    this.modal = 'atlas';
    const by = {};
    for (const [id, D] of Object.entries(ENEMIES)) {
      if (id.startsWith('rf') || !D || D.dummy) continue;
      for (let k = 0; k < 6; k++) { const pd = portalDrop2(D, id); if (pd) { (by[pd[0]] = by[pd[0]] || new Set()).add(D.rb || D.boss || D.herald ? D.name : (BIOME_NAME[D.biome] || D.biome) + ' monsters'); break; } }
    }
    const rows = Object.entries(DUNGEONS).map(([id, d]) => ({ id, d, st: (DUNGEON_RATING[id] || [3])[0] })).sort((a, b) => a.st - b.st).map(({ id, d, st }) => {
      const boss = BX[d.boss] ? BX[d.boss].name : DUNGEON_BOSSES[d.boss] ? DUNGEON_BOSSES[d.boss].name : '';
      const from = [...(by[id] || [])].slice(0, 3).join(', ') || 'a key, or the deep realm';
      return `<tr><td><b>${d.name}</b></td><td class="stars">${'★'.repeat(st)}<i>${'★'.repeat(5 - st)}</i></td><td>${boss}</td><td class="mut">${from}</td></tr>`;
    }).join('');
    const o = this.overlay(`<div class="screen atlas"><h1>The Dungeon Atlas</h1><h2>Every dungeon in the realm, easiest first. Keys (from the shop and from bosses) open a portal here in the Nexus.</h2>
      <table><tr><th>Dungeon</th><th>Danger</th><th>Its master</th><th>Its portal drops from</th></tr>${rows}</table>
      <button class="btn" id="mclose">Close${keyParen('settings')}</button></div>`);
    o.querySelector('#mclose').onclick = () => this.closeModal();
  }
  // the Hall of Legends: your fallen heroes (the best first) and the stars each class has earned
  // the Hall of Legends (2026-10-28): two tabs. Yours: your fallen heroes, the greatest first, each opening to its
  // record; and the stars each class has earned. The realm's: the 50 greatest fallen of every player (the server's)
  openLegends(tab = this.legTab || 'mine', pick = null) {
    this.modal = 'legends'; this.legTab = tab;
    const s = this.g.save, esc = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    const cls = (d) => (CLASSES[d.cls] ? CLASSES[d.cls].name : esc(d.cls));
    if (tab === 'realm' && !pick) { const Q = this.g.net && this.g.net.legends; if (!Q || Date.now() - Q.at > 60000) this.g.netLegends(); }   // (fresh, at most once a minute)
    const N = this.g.net, L = tab === 'realm' ? (N && N.legends ? N.legends.list : null) : [...(s.graveyard || [])].sort((a, b) => (b.fame || 0) - (a.fame || 0));
    const head = `<div class="legtabs"><button class="btn sm ${tab === 'mine' ? 'on' : ''}" data-leg="mine">Your legends</button><button class="btn sm ${tab === 'realm' ? 'on' : ''}" data-leg="realm">The realm's greatest</button></div>`;
    let body;
    if (pick) {                                                     // one hero's page: who, how they fell, their record
      const d = pick;
      body = `<h2>${esc(d.name || cls(d))} · ${cls(d)} · level ${d.level || 1}</h2>
        <p class="mut">${d.fame || 0} fame · fell to ${esc(d.by || 'something')}${d.date ? ' · ' + esc(d.date) : ''}${d.maxed !== undefined ? ` · ${d.maxed}/8 stats maxed` : ''}</p>
        <table class="rec">${recordRows(d).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>
        <button class="btn sm" id="legback">Back</button>`;
    } else if (tab === 'realm') {
      if (!L) body = `<p class="mut">${N && N.open ? 'Asking the realm…' : 'Go online to see the realm\'s greatest heroes.'}</p>`;
      else if (!L.length) body = `<p class="mut">${esc((N.legends && N.legends.note) || 'No hero has fallen yet.')}</p>`;
      else body = `<table class="legs"><tr><th>#</th><th>Hero</th><th>Class</th><th>Level</th><th>Fame</th><th>Fell to</th></tr>${L.map((d, i) => `<tr data-pick="${i}"><td class="mut">${i + 1}</td><td><b>${esc(d.name || '?')}</b></td><td>${cls(d)}</td><td>${d.level || 1}</td><td class="stars">${d.fame || 0}</td><td class="mut">${esc(d.by || '')}</td></tr>`).join('')}</table><p class="mut">Click a hero to see their record.</p>`;
    } else {
      const stars = Object.keys(CLASSES).map((c) => { const f = (s.classFame || {})[c] || 0, n = FAME_GOALS.filter((x) => f >= x).length; return `<tr><td><b>${CLASSES[c].name}</b></td><td class="stars">${'★'.repeat(n)}<i>${'★'.repeat(5 - n)}</i></td><td class="mut">best ${f} fame</td></tr>`; }).join('');
      body = `<h2>Your account: ${s.fame || 0} fame · best level ${s.bestLevel || 0}</h2>
        ${L.length ? `<table class="legs"><tr><th>Hero</th><th>Level</th><th>Fame</th><th>Fell to</th><th>When</th></tr>${L.map((d, i) => `<tr data-pick="${i}"><td><b>${cls(d)}</b></td><td>${d.level}</td><td class="stars">${d.fame || 0}</td><td class="mut">${esc(d.by)}</td><td class="mut">${esc(d.date)}</td></tr>`).join('')}</table><p class="mut">Click a hero to see their record.</p>` : '<p class="mut">None of your heroes has fallen yet.</p>'}
        <table><tr><th colspan="3">Class stars (fame goals each class has reached)</th></tr>${stars}</table>`;
    }
    const o = this.overlay(`<div class="screen atlas legends"><h1>The Hall of Legends</h1>${head}${body}<button class="btn" id="mclose">Close${keyParen('settings')}</button></div>`);
    o.querySelectorAll('[data-leg]').forEach((b) => { b.onclick = () => this.openLegends(b.dataset.leg); });
    o.querySelectorAll('[data-pick]').forEach((r) => { r.onclick = () => this.openLegends(tab, L[+r.dataset.pick]); });
    const back = o.querySelector('#legback'); if (back) back.onclick = () => this.openLegends(tab);
    this.g.onLegends = () => { if (this.modal === 'legends' && this.legTab === 'realm' && !pick) this.openLegends('realm'); };
    o.querySelector('#mclose').onclick = () => this.closeModal();
  }

  openJournal(ev) {
    this.modal = 'journal';
    const o = this.overlay(`<div class="screen journal"><h1>${ev.title}</h1><h2>Page ${ev.page + 1} of ${ev.of}</h2>
      <div class="page">${ev.text}</div><button class="btn" id="mclose">Close${keyParen('settings')}</button></div>`);
    o.querySelector('#mclose').onclick = () => this.closeModal();
  }
  openPetYard(msg = '') {
    this.modal = 'petyard';
    const g = this.g, p = g.player, pets = g.pets(), act = g.activePet(), pick = (this.morphPick = (this.morphPick || []).filter((id) => pets.some((q) => q.id === id)));
    const bars = (q) => abilityOrder(q).map((k, i) => {
      const A = q.ab[k], cap = petCap(q), need = petXpToNext(A.lv), full = A.lv >= cap;
      return `<div class="pab${i === 0 ? ' main' : ''}"><span>${ABILITIES[k].name}${i === 0 ? ' <em>main</em>' : ''}</span><b>${A.lv}/${cap}</b><div class="pxp"><i style="width:${full ? 100 : Math.round(100 * A.xp / need)}%"></i></div></div>`;
    }).join('');
    const effect = (q) => `Every ${PET_TICK}s: +${petHeal(q)} Life, +${petMagic(q)} Mana`;
    const card = (q, extra) => {
      const Rr = RARITY[q.rarity];
      const tag = petMaxed(q) ? ' · <span class="maxed">MAXED</span>' : Rr.morph && mainMaxed(q) ? ' · <span class="maxed">READY TO FUSE</span>' : '';
      return `<div class="ware petcard r-${q.rarity}${q === act ? ' active' : ''}${pick.includes(q.id) ? ' picked' : ''}"><div class="ico pet" style="background-image:url(${this.petIcon(petSprite(q))})"></div>
        <div class="wn"><b style="color:${Rr.color}">${petName(q)}</b><small>${Rr.name} · level ${petLevel(q)}${tag}<br>${effect(q)}</small>${bars(q)}</div>${extra}</div>`;
    };
    const mine = pets.map((q) => card(q, `<div class="acts">${q === act ? '<small class="mut">companion</small>' : `<button class="btn sm" data-act="${q.id}">Follow me</button>`}
      ${RARITY[q.rarity].morph ? `<button class="btn sm${pick.includes(q.id) ? '' : ' ghost'}" data-pick="${q.id}">${pick.includes(q.id) ? 'Picked' : 'Fuse'}</button>` : ''}
      <button class="btn sm ghost" data-rel="${q.id}">Release</button></div>`)).join('') || '<p class="mut">You have no pets yet. Buy an egg below, or find one: monster leaders and bosses drop them.</p>';
    let morphBox = '';
    if (pick.length) {
      const [a, b] = pick.map((id) => pets.find((q) => q.id === id)), why = pick.length < 2 ? 'Pick a second pet of the same rarity.' : canMorph(a, b);
      const next = RARITY_ORDER[RARITY_ORDER.indexOf(a.rarity) + 1];
      if (!this.fuseSkin || ![a.kind, b && b.kind].includes(this.fuseSkin)) this.fuseSkin = a.kind;
      let plan = 'Two pets of the same rarity fuse into one pet of the next rarity. Only each pet\'s <b>main</b> ability needs to be at its cap.';
      if (pick.length === 2 && next) {
        const look = (k) => ({ kind: k, rarity: next, ab: [a, b].find((q) => q.kind === k).ab });
        const skins = [...new Set([a.kind, b.kind])].map((k) => `<button class="btn sm${this.fuseSkin === k ? '' : ' ghost'}" data-skin="${k}"><span class="ico pet mini" style="background-image:url(${this.petIcon(petSprite(look(k)))})"></span>${PET_KINDS[k].name} line</button>`).join('');
        plan = `→ a <b style="color:${RARITY[next].color}">${RARITY[next].name} ${PET_KINDS[this.fuseSkin].name}-line pet</b>. Every ability keeps the better of the two levels; the cap rises to ${RARITY[next].max}.${next === 'rare' ? ' It learns <b>Shield</b>.' : ''}
          <div class="skins">Keep the look of: ${skins}</div>`;
      }
      morphBox = `<section class="morphbox"><h3>Fuse</h3><p>${plan}</p><p class="mut">${why || 'Ready.'}</p>
        ${why ? '' : `<button class="btn" data-fuse="gold">Fuse for ${FUSE_GOLD[a.rarity]} gold</button> <button class="btn" data-fuse="fame">Fuse for ${RARITY[a.rarity].morph} fame</button>`} <button class="btn ghost" id="clearpick">Cancel</button></section>`;
    }
    const cost = act ? feedCost(act) : null;
    const feedList = act ? p.inv.map((id, i) => [id, i]).filter(([id]) => id && feedValue(ITEMS[id]) > 0)
      .map(([id, i]) => this.itemCell(id, `<div class="acts"><small class="mut">power ${feedValue(ITEMS[id])}</small><button class="btn sm" data-feed="${i}" data-pay="gold">${cost.gold}g</button><button class="btn sm" data-feed="${i}" data-pay="fame">${cost.fame} fame</button></div>`)).join('')
      || '<p class="mut">Nothing in your backpack to feed. Pets eat gear, potions and relics: higher tiers, and relics from harder bosses, make bigger meals.</p>'
      : '<p class="mut">Choose a companion first.</p>';
    const eggs = g.eggsForSale().map(([r, pr, f]) => this.itemCell(`egg_${f}_${r}`, `<button class="btn sm" data-egg="${r}">${pr}g</button>`)).join('') + '<p class="mut">New families every day.</p>';
    const o = this.overlay(`<div class="screen shop"><h1>The Pet Yard</h1>
      <h2>"Every pet heals the hand that feeds it." · ${this.wallet()} · <span style="color:#ffb84a">${g.save.fame || 0} fame</span> · ${pets.length}/${PET_MAX} pets</h2>
      ${act ? `<section class="petnow">${card(act, '')}<p class="mut">${PET_KINDS[act.kind].desc}</p></section>` : ''}
      ${morphBox}
      <div class="cols"><section><h3>Your pets</h3>${mine}<h3 style="margin-top:12px">Eggs for sale</h3>${eggs}</section>
      <section><h3>Feed ${act ? petName(act) : 'your companion'}</h3><p class="mut">Pay in gold or fame. Most of a meal goes to the main ability (100% / 65% / 35%).</p>${feedList}</section></div>
      <p class="msg">${msg}</p><button class="btn" id="mclose">Leave${keyParen('settings')}</button></div>`);
    o.querySelectorAll('[data-act]').forEach((b) => { b.onclick = () => { g.setActivePet(b.dataset.act); this.openPetYard('A new companion follows you.'); }; });
    o.querySelectorAll('[data-rel]').forEach((b) => { b.onclick = () => { if (b.dataset.sure) { g.releasePet(b.dataset.rel); this.openPetYard('Released. It trots off happily.'); } else { b.dataset.sure = 1; b.textContent = 'Sure?'; } }; });
    o.querySelectorAll('[data-pick]').forEach((b) => { b.onclick = () => { const id = b.dataset.pick, P = this.morphPick; if (P.includes(id)) P.splice(P.indexOf(id), 1); else { P.push(id); if (P.length > 2) P.shift(); } this.openPetYard(); }; });
    o.querySelectorAll('[data-skin]').forEach((b) => { b.onclick = () => { this.fuseSkin = b.dataset.skin; this.openPetYard(); }; });
    o.querySelectorAll('[data-feed]').forEach((b) => { b.onclick = () => { this.openPetYard(g.feedPet('inv', +b.dataset.feed, b.dataset.pay)); this.refreshSlots(); }; });
    o.querySelectorAll('[data-egg]').forEach((b) => { b.onclick = () => { this.openPetYard(g.buyEgg(b.dataset.egg)); this.refreshSlots(); }; });
    o.querySelectorAll('[data-fuse]').forEach((b) => { b.onclick = () => { const r = g.morphPets(this.morphPick[0], this.morphPick[1], this.fuseSkin, b.dataset.fuse); if (/^Your pets fused/.test(r)) this.morphPick = []; this.openPetYard(r); }; });
    const cp = o.querySelector('#clearpick'); if (cp) cp.onclick = () => { this.morphPick = []; this.openPetYard(); };
    o.querySelector('#mclose').onclick = () => this.closeModal();
  }
  // ------------------------------------------------------------- waypoints: travel between the obelisks you have found
  openWaypoints(here, msg = '') {
    this.modal = 'waypoint';
    const g = this.g, p = g.player, m = g.map, known = p.waypoints || [];
    const lands = {};
    for (const w of m.waypoints || []) (lands[w.biome] = lands[w.biome] || []).push(w);
    const LABEL = { shore: 'The Drowned Shore', fen: 'Ashfen', runeholt: 'Runeholt', godfall: 'Godfall', dunes: 'The Saltglass Dunes', thornwood: 'The Thornwood', steppe: 'The Crystal Steppe', lowlands: 'The Greenmarch' };
    const total = (m.waypoints || []).length, found = (m.waypoints || []).filter((w) => known.includes(w.name)).length;
    const sec = Object.entries(lands).map(([b, list]) => `<section><h3>${LABEL[b] || b}</h3>${list.map((w) => {
      const has = known.includes(w.name), cur = w.name === here;
      return `<div class="ware"><div class="qi">${has ? '◆' : '◇'}</div><div class="wn"><b>${has ? w.name : '???'}</b><small>${cur ? 'You are here' : has ? 'Discovered' : 'Not yet found'}</small></div>${has && !cur ? `<button class="btn sm" data-go="${w.name.replace(/"/g, '&quot;')}">Travel</button>` : ''}</div>`;
    }).join('')}</section>`).join('');
    const o = this.overlay(`<div class="screen shop"><h1>Waypoints</h1>
      <h2>Touch an obelisk to remember it. ${found} of ${total} found.</h2>
      <div class="cols wp">${sec}</div>
      <p class="msg">${msg}</p><button class="btn" id="mclose">Close${keyParen('settings')}</button></div>`);
    o.querySelectorAll('[data-go]').forEach((b) => { b.onclick = () => { const err = g.warpTo(b.dataset.go); if (err) this.openWaypoints(here, err); else this.closeModal(); }; });
    o.querySelector('#mclose').onclick = () => this.closeModal();
  }
  // ------------------------------------------------------------- quests
  openBoard(msg = '') {
    this.modal = 'board';
    const g = this.g, p = g.player;
    const card = (q, act) => `<div class="ware"><div class="qi">${{ hunt: '⚔', shrine: '✦', camp: '⚑', herald: '♪', rboss: '☠', dungeon: '⛬', fetch: '?' }[q.kind] || '•'}</div>
      <div class="wn"><b>${q.desc || ('Find ' + q.item + '.')}</b><small>Reward: ${q.reward.gold || 0} gold · ${q.reward.essence || 0} essence${q.reward.fame ? ' · ' + q.reward.fame + ' fame' : ''}${q.reward.item ? ' · a gift' : ''}</small></div>${act}</div>`;
    const offers = (g.questOffers || []).map((q, i) => card(q, `<button class="btn sm" data-take="${i}">Accept</button>`)).join('') || '<p class="mut">No new notices. Come back later.</p>';
    const mine = p.quests.map((q, i) => card(q, `<div class="acts"><small class="mut">${q.have}/${q.n}</small><button class="btn sm" data-drop="${i}">Abandon</button></div>`)).join('') || '<p class="mut">You carry no quests.</p>';
    const o = this.overlay(`<div class="screen shop"><h1>The Notice Board</h1>
      <h2>Pinned with rusty nails. Some of the handwriting is very bad.</h2>
      <div class="cols"><section><h3>Notices</h3>${offers}</section><section><h3>Your quests (${p.quests.length}/3)</h3>${mine}</section></div>
      <p class="msg">${msg}</p><button class="btn" id="mclose">Leave${keyParen('settings')}</button></div>`);
    o.querySelectorAll('[data-take]').forEach((b) => { b.onclick = () => { const i = +b.dataset.take, q = g.questOffers[i]; const m = g.acceptQuest(q); if (m.startsWith('Quest')) g.questOffers.splice(i, 1); this.openBoard(m); }; });
    o.querySelectorAll('[data-drop]').forEach((b) => { b.onclick = () => { p.quests.splice(+b.dataset.drop, 1); g.persist(); this.openBoard('Quest abandoned.'); }; });
    o.querySelector('#mclose').onclick = () => this.closeModal();
  }
  refreshQuests() {
    const p = this.g.player, el = $('quests');
    if (!p || !p.quests.length) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    const html = p.quests.map((q) => `<div class="q"><span>${q.desc || ('Find ' + q.item)}</span><b>${q.have}/${q.n}</b></div>`).join('');
    if (el.dataset.h !== html) { el.innerHTML = `<div class="label">Quests</div>${html}`; el.dataset.h = html; }
  }
  // the dungeon's seals: a checklist that stays up until the gate opens (and points you at the boss after)
  refreshSeals() {
    const g = this.g, m = g.map, el = $('seals');
    const L = g.player && !g.player.dead ? g.sealStatus() : [];
    const boss = m.kind === 'dungeon' && m.rooms ? m.rooms[m.rooms.length - 1] : null, p = g.player;
    const inBoss = boss && p.x > boss.x && p.x < boss.x + boss.w && p.y > boss.y && p.y < boss.y + boss.h;
    if (!L.length || inBoss) { el.classList.add('hidden'); el.dataset.h = ''; return; }
    el.classList.remove('hidden');
    const left = L.filter((s) => !s.done).length;
    const head = left ? `Seals on the boss gate · ${L.length - left}/${L.length} broken` : 'The gate is open · go face the boss';
    const icon = { warden: '♛', lever: '⚑', puzzle: '✦', mask: '☺', mirror: '◈', trial: '☾' };
    const html = `<div class="label">${head}</div>` + L.map((s) => `<div class="q seal ${s.done ? 'done' : ''} ${s.live ? 'live' : ''}"><i>${s.done ? '✔' : icon[s.kind]}</i><span>${s.text}${s.sub ? `<small>${s.sub}</small>` : ''}</span></div>`).join('')
      + (left ? '<div class="hintline">Unbroken seals glow on your minimap.</div>' : '');
    if (el.dataset.h !== html) { el.innerHTML = html; el.dataset.h = html; }
  }
  // ------------------------------------------------------------- chat
  chatOpen() { return !$('chatin').classList.contains('hidden'); }
  // typing in it (the keys are the chat's); open but not typing (you clicked the game): the keys move you again
  chatTyping() { return this.chatOpen() && document.activeElement === $('chatin'); }
  openChat(prefix = '') {
    const inp = $('chatin');
    if (this.chatOpen()) { if (prefix && !inp.value) inp.value = prefix; inp.focus(); return; }   // already open: back to typing, nothing lost
    inp.classList.remove('hidden'); $('chat').classList.add('open');
    inp.value = prefix; inp.focus();
    this.renderChat();
    if (!this.chatWired) {
      this.chatWired = true;
      inp.addEventListener('keydown', (e) => {
        e.stopPropagation();
        // keys that type nothing (the arrows, if they move you) still move you while you type
        const H = (this.chatHist = this.chatHist || []);
        if ((e.ctrlKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) || e.key === 'PageUp' || e.key === 'PageDown') {   // what you sent before
          e.preventDefault();
          if (!H.length) return;
          this.histAt = Math.max(0, Math.min(H.length, (this.histAt ?? H.length) + (e.key === 'ArrowUp' || e.key === 'PageUp' ? -1 : 1)));
          inp.value = H[this.histAt] || ''; return;
        }
        if (e.key.length > 1 && !['Enter', 'Escape', 'Backspace', 'Delete', 'Tab', 'Home', 'End'].includes(e.key) && this.onHeldKey && this.onHeldKey(e.code, true)) { e.preventDefault(); return; }
        if (e.key === 'Enter') {
          const v = inp.value.trim();
          if (v) { H.push(v); if (H.length > 30) H.shift(); }
          this.histAt = undefined;
          if (v) {
            if (v.startsWith('/')) { this.g.say(v, '#8d88a0'); this.g.command(v); }
            else if (!this.g.netChat(v)) this.g.say(`${(this.g.account && this.g.account.name) || 'You'}: ${v}`, '#e9e4f2');   // online: everyone hears it
          }
          this.closeChat();
        } else if (e.key === 'Escape') this.closeChat();
      });
      inp.addEventListener('keyup', (e) => { e.stopPropagation(); if (this.onHeldKey) this.onHeldKey(e.code, false); });   // (a key let go while typing is let go)
    }
  }
  closeChat() {
    const inp = $('chatin');
    inp.blur(); inp.classList.add('hidden'); $('chat').classList.remove('open');
    this.renderChat();
  }
  renderChat() {
    const log = $('chatlog'), now = performance.now(), open = this.chatOpen();
    const lines = this.g.chat.slice(open ? -60 : -8);
    log.innerHTML = '';
    for (const m of lines) {
      const d = document.createElement('div');
      d.textContent = m.text;
      d.style.color = m.color;
      if (now - m.t > 14000) d.className = 'old';
      log.appendChild(d);
    }
    if (open) log.scrollTop = log.scrollHeight;
  }
  miniLabel() {
    const v = this.settings.miniView;
    $('minilabel').textContent = v >= 9999 ? 'MAP' : `${v}×${v}`;
  }

  // ------------------------------------------------------------- settings
  toggleSettings() {
    if (this.settingsOpen) {
      this.settingsOpen = false;
      this.capturing = null;
      if (this.g.mode === 'play') this.closeOverlay();
      else if (this.g.mode === 'title') this.titleScreen();
      else this.closeOverlay();
      return;
    }
    this.settingsOpen = true;
    this.settingsScreen();
  }
  settingsScreen() {
    const S = this.settings;
    const binds = ACTIONS.map(([id, label]) => `<div class="row"><span>${label}</span><div class="keys">
        ${[0, 1].map((n) => `<button class="key" data-act="${id}" data-n="${n}">${keyLabel(S.binds[id][n])}</button>`).join('')}
      </div></div>`).join('');
    const check = (k, label) => `<div class="row"><span>${label}</span><input type="checkbox" data-opt="${k}" ${S[k] ? 'checked' : ''}></div>`;
    const o = this.overlay(`<div class="screen settings"><h1>Settings</h1>
      <section><h3>Camera</h3>
        <div class="row"><span>Rotation speed</span><input type="range" min="0.6" max="4" step="0.1" data-num="rotSpeed" value="${S.rotSpeed}"></div>
        ${check('invertRotation', 'Invert rotation direction')}
        <div class="row"><span>Pixel zoom</span><select data-sel="zoom">${['auto', 2, 3, 4, 5, 6].map((z) => `<option value="${z}" ${String(S.zoom) === String(z) ? 'selected' : ''}>${z === 'auto' ? 'Auto (fit window)' : z + '×'}</option>`).join('')}</select></div>
        <div class="row"><span>View zoom <small class="mut" data-vz>${Math.round(S.viewZoom * 100)}%</small></span><input type="range" min="0.75" max="1.5" step="0.05" data-num="viewZoom" value="${S.viewZoom}"></div>
        <div class="row"><span>Minimap range</span><select data-sel="miniView">${MINI_STEPS.map((v) => `<option value="${v}" ${S.miniView === v ? 'selected' : ''}>${v >= 9999 ? 'Whole map' : v + ' tiles'}</option>`).join('')}</select></div>
      </section>
      <section><h3>Cursor <img class="curprev" data-curprev alt=""></h3>
        <div class="row"><span>Shape</span><select data-cur="cursor">${CURSOR_STYLES.map(([v, n]) => `<option value="${v}" ${S.cursor === v ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
        <div class="row"><span>Colour</span><select data-cur="cursorColor">${CURSOR_COLORS.map(([v, n]) => `<option value="${v}" ${S.cursorColor === v ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
        <div class="row"><span>Size</span><select data-cur="cursorSize">${CURSOR_SIZES.map(([v, n]) => `<option value="${v}" ${+S.cursorSize === v ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      </section>
      <section><h3>Audio</h3>
        <div class="row"><span>Volume</span><input type="range" min="0" max="1" step="0.05" data-num="volume" value="${S.volume}"></div>
        ${check('muted', 'Mute all sound')}
      </section>
      <section><h3>Effects</h3>
        ${check('shake', 'Screen shake')}${check('weather', 'Weather particles')}${check('vignette', 'Screen-edge vignette')}${check('groundLight', 'Ground lighting')}${check('damageNumbers', 'Damage numbers')}
      </section>
      <section><h3>Controls <small style="color:#8d88a0">(click a key, then press the new one · Backspace clears)</small></h3>${binds}
        <div class="row"><span>Use backpack slot 1–8</span><div class="keys"><button class="key" disabled>1 – 8</button></div></div>
        <div class="row"><span>Shoot</span><div class="keys"><button class="key" disabled>Left mouse</button></div></div>
      </section>
      <div class="actions">${this.g.mode === 'play' ? '<button class="btn" id="smenu">Character select</button>' : ''}<button class="btn" id="sreset">Reset to defaults</button><button class="btn" id="sclose">Close</button></div>
    </div>`);
    const changed = () => { this.onSettingsChanged && this.onSettingsChanged(); this.miniLabel(); };
    o.querySelectorAll('[data-opt]').forEach((el) => { el.onchange = () => { S[el.dataset.opt] = el.checked; changed(); }; });
    o.querySelectorAll('[data-num]').forEach((el) => { el.oninput = () => { S[el.dataset.num] = +el.value; changed(); const vz = o.querySelector('[data-vz]'); if (vz) vz.textContent = Math.round(S.viewZoom * 100) + '%'; }; });
    const curPrev = () => { const im = o.querySelector('[data-curprev]'), src = cursorPreview(S.cursor || 'cross', S.cursorColor || '#ffffff'); if (im) { im.src = src; im.style.display = src ? '' : 'none'; } };   // (the cursor you chose, shown)
    curPrev();
    o.querySelectorAll('[data-cur]').forEach((el) => { el.onchange = () => { const k = el.dataset.cur; S[k] = k === 'cursorSize' ? +el.value : el.value; changed(); curPrev(); }; });
    o.querySelectorAll('[data-sel]').forEach((el) => {
      el.onchange = () => { const v = el.value; S[el.dataset.sel] = el.dataset.sel === 'zoom' && v === 'auto' ? 'auto' : +v; changed(); };
    });
    o.querySelectorAll('.key[data-act]').forEach((btn) => {
      btn.onclick = () => {
        o.querySelectorAll('.key').forEach((b) => b.classList.remove('listen'));
        btn.classList.add('listen'); btn.textContent = 'press…';
        this.capturing = (code) => {
          const act = btn.dataset.act, n = +btn.dataset.n;
          if (code !== 'Backspace') {
            for (const codes of Object.values(S.binds)) {           // a key can only do one thing
              const i = codes.indexOf(code);
              if (i >= 0) codes[i] = null;
            }
          }
          S.binds[act][n] = code === 'Backspace' ? null : code;
          S.binds[act] = S.binds[act].slice(0, 2);
          this.capturing = null;
          changed();
          this.settingsScreen();
        };
      };
    });
    if (!this.keyHook) {
      this.keyHook = true;
      addEventListener('keydown', (e) => { if (this.capturing) { e.preventDefault(); e.stopImmediatePropagation(); this.capturing(e.code); } }, true);
      // mouse buttons can be bound too: middle (Mouse1), right (Mouse2) and the side buttons (Mouse3 back, Mouse4 forward)
      addEventListener('mousedown', (e) => { if (this.capturing && e.button > 0) { e.preventDefault(); e.stopImmediatePropagation(); this.capturing('Mouse' + e.button); } }, true);
    }
    o.querySelector('#sreset').onclick = () => {
      const d = resetSettings();
      for (const k of Object.keys(S)) delete S[k];
      Object.assign(S, d);
      changed();
      this.settingsScreen();
    };
    o.querySelector('#sclose').onclick = () => this.toggleSettings();
    const sm = o.querySelector('#smenu');
    if (sm) sm.onclick = () => { this.settingsOpen = false; this.g.leaveToMenu(); this.titleScreen(); };
  }
  build(name, n) {
    const host = $(name);
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div');
      el.className = 'slot' + (name === 'equip' ? ' eq' : '');
      el.innerHTML = `<span class="hint">${name === 'equip' ? SLOT_HINT[i] : name === 'inv' ? i + 1 : ''}</span><div class="ico"></div><span class="tier"></span>`;
      el.dataset.c = name; el.dataset.i = i;
      el.addEventListener('pointerdown', (ev) => this.dragStart(ev, name, i, el));
      // use/equip: our own double-click detection (the browser's dblclick can get eaten when a
      // slightly-moving click starts a drag), plus right-click as an instant "use"
      el.addEventListener('mousedown', (ev) => {
        if (ev.button !== 0 || ev.shiftKey) return;
        const now = performance.now();
        if (this.lastDown && this.lastDown.name === name && this.lastDown.i === i && now - this.lastDown.t < 380) {
          this.lastDown = null;
          if (this.vaultOpen && name === 'inv' && this.g.nearVault) {          // with the vault open: into the vault
            const V = this.g.container('vault'), free = V ? V.indexOf(null) : -1;
            if (free >= 0) this.g.moveItem('inv', i, 'ground', free); else this.g.toast('Your vault is full.');
          } else this.g.useSlot(name, i);
          this.refreshSlots();
        } else this.lastDown = { name, i, t: now };
      });
      el.addEventListener('contextmenu', (ev) => { ev.preventDefault(); this.g.useNow(name, i); this.refreshSlots(); this.hideTip(); });
      el.addEventListener('click', (ev) => {
        if (!ev.shiftKey) return;
        const g = this.g, inv = g.player.inv, id = this.itemAt(name, i);
        // shift-click a potion (or anything you can use) to consume it right there
        if (id && ITEMS[id].slot === 'consumable') { g.useNow(name, i); this.refreshSlots(); this.hideTip(); return; }
        // shift-click gear: send it between backpack and ground/vault
        if (name === 'ground') { const f = inv.indexOf(null); if (f >= 0) g.moveItem('ground', i, 'inv', f); }
        else if (name === 'inv') {
          const ground = g.container(g.nearVault ? 'vault' : 'ground');
          const f = ground ? ground.indexOf(null) : 0;
          if (f >= 0) g.moveItem('inv', i, 'ground', f);
        }
        this.refreshSlots();
      });
      el.addEventListener('mouseenter', (ev) => this.showTip(name, i, ev));
      el.addEventListener('mousemove', (ev) => this.placeTip(ev));
      el.addEventListener('mouseleave', () => this.hideTip());
      host.appendChild(el);
      this.slots[name].push(el);
    }
  }
  // ---- dragging items: the icon lifts out of its slot and follows the cursor; let go over a slot to move it there,
  // over the world to drop it on the ground, anywhere else and it glides back home
  dragStart(ev, name, i, el) {
    if (ev.button !== 0 || ev.shiftKey || !this.itemAt(name, i)) return;
    this.dragClear();                                         // a drag still in hand (a fast double-click, a lost release) ends first
    const r = el.querySelector('.ico').getBoundingClientRect();
    const D = this.drag = { name, i, el, x0: ev.clientX, y0: ev.clientY, ox: ev.clientX - r.left, oy: ev.clientY - r.top, r, live: false };
    const move = (e) => this.dragMove(e), up = (e) => { D.unhook(); if (this.drag === D) this.dragEnd(e); };
    const lost = () => { D.unhook(); if (this.drag === D) this.dragClear(); };   // released outside the window, or the gesture was cancelled
    D.unhook = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', lost); removeEventListener('blur', lost); };
    addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', lost); addEventListener('blur', lost);
  }
  // put everything back: no ghost icon left on screen, no slot left lifted, whatever happened
  dragClear() {
    const D = this.drag;
    this.drag = null;
    if (D && D.unhook) D.unhook();
    document.querySelectorAll('#dragghost').forEach((n) => n.remove());
    document.querySelectorAll('.slot.lifted, .slot.over').forEach((n) => n.classList.remove('lifted', 'over'));
  }
  dragMove(ev) {
    const D = this.drag;
    if (!D) return;
    if (!D.live) {
      if (Math.hypot(ev.clientX - D.x0, ev.clientY - D.y0) < 5) return;   // a click, not a drag (yet)
      D.live = true; this.lastDown = null; this.hideTip();
      const gh = document.createElement('div');
      gh.id = 'dragghost';
      gh.style.width = D.r.width + 'px'; gh.style.height = D.r.height + 'px';
      gh.style.backgroundImage = `url(${this.r.icon(this.itemAt(D.name, D.i))})`;
      document.body.appendChild(gh);
      D.gh = gh; D.el.classList.add('lifted');
    }
    D.gh.style.transform = `translate3d(${ev.clientX - D.ox}px, ${ev.clientY - D.oy}px, 0) scale(1.15)`;
    const over = document.elementFromPoint(ev.clientX, ev.clientY);
    const slot = over && over.closest('.slot');
    if (D.over && D.over !== slot) D.over.classList.remove('over');
    if (slot && slot !== D.el) { slot.classList.add('over'); D.over = slot; } else D.over = null;
  }
  dragEnd(ev) {
    try { this.dragDrop(ev); } catch (err) { this.dragClear(); this.refreshSlots(); throw err; }   // never leave a ghost behind
  }
  dragDrop(ev) {
    const D = this.drag;
    this.drag = null;
    if (!D || !D.live) return;
    if (D.over) D.over.classList.remove('over');
    const over = document.elementFromPoint(ev.clientX, ev.clientY);
    const slot = over && over.closest('.slot');
    let target = null, ok = false;
    if (slot && slot.dataset.c) {
      ok = slot === D.el || this.g.moveItem(D.name, D.i, slot.dataset.c, +slot.dataset.i);
      target = ok ? slot : D.el;
    } else if (over && over.closest('#stage')) {                    // let go over the world: drop it on the ground
      const g = this.g, c = g.container(g.nearVault ? 'vault' : 'ground');
      const f = c ? c.indexOf(null) : 0;
      if (D.name !== 'ground' && f >= 0) ok = g.moveItem(D.name, D.i, 'ground', f);
      target = ok ? null : D.el;
    } else target = D.el;
    const gh = D.gh;
    const done = () => { gh.remove(); D.el.classList.remove('lifted'); this.refreshSlots(); };
    if (!target) { gh.style.transition = 'transform 120ms ease-in, opacity 120ms'; gh.style.opacity = '0'; gh.style.transform += ' scale(0.5)'; setTimeout(done, 120); return; }
    const ico = target.querySelector('.ico');
    if (!ico || !target.isConnected || target.offsetParent === null) { done(); return; }   // its slot is gone or hidden (another tab): no glide
    const r = ico.getBoundingClientRect();
    if (ok) this.refreshSlots();
    gh.style.transition = 'transform 110ms cubic-bezier(.2,.8,.3,1)';
    gh.style.transform = `translate3d(${r.left}px, ${r.top}px, 0) scale(1)`;
    setTimeout(done, 110);
  }
  itemAt(name, i) {
    const g = this.g;
    const c = name === 'ground' ? g.container(g.nearVault ? 'vault' : 'ground') : g.container(name);
    return c ? c[i] : null;
  }
  refreshSlots() {
    this.shines = []; this.armIcons = [];
    let sn = 0;
    for (const name of ['equip', 'inv', 'ground', 'pots']) {
      this.slots[name].forEach((el, i) => {
        const id = this.itemAt(name, i), ico = el.children[1], tier = el.children[2];
        if (id) {
          const it = ITEMS[id];
          ico.style.backgroundImage = it.arm ? '' : `url(${this.r.icon(id)})`;
          ico.style.backgroundSize = '100% 100%';
          let acv = ico.querySelector('canvas.arm');
          if (it.arm) {                                        // a Mad God Armory item: drawn live, as the armory draws it (src/armory_art.js)
            if (!acv) { acv = document.createElement('canvas'); acv.className = 'arm'; ico.appendChild(acv); }
            const px = Math.round((ico.clientWidth || 48) * (window.devicePixelRatio || 1)); if (acv.width !== px) acv.width = acv.height = px;
            this.armIcons.push({ cv: acv, A: it.arm, seed: (sn * 977) % 5000 });
          } else if (acv) acv.remove();
          // now and then the item catches the light: its own shine frames when it has them, a sweep when it doesn't
          const rd = it.reg && this.r.R && this.r.R.resolve(it.reg), own = !!(rd && rd.frames.shine1) || !!it.arm;
          if (own && !it.arm) this.shines.push({ ico, id, off: (sn * 0.77) % 5, legend: !!(it.legendary && rd.frames.twinkle0), f: '0' });
          ico.classList.toggle('sweep', !own && name !== 'pots');
          if (!own) { ico.style.setProperty('--m', `url(${this.r.icon(id)})`); ico.style.setProperty('--d', `${-((sn * 0.77) % 6).toFixed(2)}s`); }
          sn++;
          if (name === 'pots') { const n = this.g.pots()[i].n; tier.innerHTML = `<b class="${n >= POT_STACK ? 'full' : ''}">${n}</b>/${POT_STACK}`; } else tier.textContent = it.arm ? { UT: 'UT', Mythic: 'M', Legendary: 'L', Celestial: 'C', Divine: 'D' }[it.armTier] : it.admin ? 'ADMIN' : it.mythic ? 'M' : it.legendary ? 'L' : it.ut ? 'UT' : it.use && it.use.egg ? RARITY[it.use.egg].name[0] : it.tier === null ? '' : 'T' + it.tier;
          const tb = typeof it.tier === 'number' ? (it.tier >= 12 ? 'b5' : it.tier >= 10 ? 'b4' : it.tier >= 7 ? 'b3' : it.tier >= 4 ? 'b2' : 'b1') : '';   // a tier's colour band: the number is never the only cue
          tier.className = 'tier' + (it.ut ? ' ut' : '') + (tb && name !== 'pots' ? ` tt ${tb}` : '');
          if (name !== 'pots' && /^(T\d{1,2}|UT|M|L|C|D)$/.test(tier.textContent)) {   // drawn in the pixel font: clean at any slot size
            const col = getComputedStyle(tier).color || '#d8d8d8', txt = tier.textContent;
            tier.textContent = ''; const im = new Image(); im.src = pixelTag(txt, col); im.className = 'pxtag'; im.alt = txt; tier.appendChild(im);
          }
          el.style.setProperty('--rc', rarityColor(it));
          el.classList.add('has'); el.classList.remove('ghost'); el.classList.toggle('mythic', !!it.mythic); el.classList.toggle('ut', !!it.ut && !it.mythic && !it.admin);
          el.classList.toggle('admin', !!it.admin); el.classList.toggle('ench', !!it.enchants); el.classList.toggle('legend', !!it.legendary);
          el.classList.toggle('up', (name === 'ground' || name === 'inv') && this.isUpgrade(it));   // (an upgrade for you: a green arrow)
        } else {
          ico.classList.remove('sweep'); const acv0 = ico.querySelector('canvas.arm'); if (acv0) acv0.remove();
          const C = name === 'equip' && this.g.player ? CLASSES[this.g.player.cls] : null;
          const ghost = C ? [`${C.weapon}_t0`, `${C.ability}_t0`, `${C.armor}_t0`, 'ring_hp_t0'][i] : null || (name === 'pots' ? ['pot_hp', 'pot_mp'][i] : null);   // an empty potion button shows its potion, dimmed
          ico.style.backgroundImage = ghost ? `url(${this.r.icon(ghost)})` : ''; ico.style.backgroundSize = '100% 100%';
          tier.innerHTML = name === 'pots' ? `<b class="none">0</b>/${POT_STACK}` : ''; el.classList.remove('has', 'mythic', 'ut', 'admin', 'ench', 'legend', 'up'); el.classList.toggle('ghost', !!ghost);
        }
      });
    }
    // the second backpack's 8 slots only exist once you've used a Pilgrim's Satchel
    const big = this.g.player && this.g.player.inv.length > 8;
    // the second backpack shows 8 slots at a time, like RotMG's: a switch beside the label flips between them
    const pg = big ? (this.invPage || 0) : 0;
    this.slots.inv.forEach((el, i) => el.classList.toggle('hidden', big ? (i >= 8) !== (pg === 1) : i >= 8));
    const inv = (this.statTab || 'inv') === 'inv';
    document.querySelectorAll('#stattabs [data-pg]').forEach((b) => { b.classList.toggle('on', inv && +b.dataset.pg === pg); b.classList.toggle('off', !big && b.dataset.pg === '1'); });
    const g = this.g;
    const show = g.nearVault || g.nearBag;
    $('groundwrap').classList.toggle('off', !show);
    const V = g.nearVault ? g.container('vault') : null, n = V ? V.length : 8;
    this.slots.ground.forEach((el, i) => el.classList.toggle('hidden', i >= n));
    $('ground').classList.toggle('vault', !!V);
    $('baglootall').classList.toggle('off', !(g.nearBag && !V && g.nearBag.items && g.nearBag.items.some(Boolean)));
    $('baglootall').textContent = `Take all${keyParen('lootAll')}`;
    if (V && $('vwcount')) $('vwcount').textContent = `${V.filter(Boolean).length} / ${V.length} slots · buy Vault Chests to grow it`;
    $('groundlabel').onclick = V && !this.vaultOpen ? () => this.openVault() : null; $('groundlabel').style.cursor = V && !this.vaultOpen ? 'pointer' : '';
    $('groundlabel').title = V ? 'Buy Vault Chests to grow your vault' : ''; $('groundlabel').textContent = V && !this.vaultOpen ? `Vault ${V.filter(Boolean).length}/${V.length} · open` : V ? `Vault ${V.filter(Boolean).length}/${V.length}` : (g.nearBag && g.nearBag.soulbound ? 'Soulbound loot (yours alone)' : 'Loot bag') + (g.nearBag && g.nearBag.until - g.t < 30 ? ` · gone in ${Math.max(0, Math.ceil(g.nearBag.until - g.t))}s` : '');   // (a bag about to vanish says so)
  }
  // ---- the item tooltip: a header, the item's story, its numbers in tidy rows, then what's special about it
  showTip(name, i, ev) {
    const id = this.itemAt(name, i);
    if (!id) return;
    const it = ITEMS[id], g = this.g;
    this.tip.innerHTML = this.tipHTML(it, id, name);
    this.tip.style.setProperty('--rc', rarityColor(it));
    this.tip.classList.remove('hidden');
    this.placeTip(ev);
  }
  // a quick look at another player: who they are, what they wear, how strong they are
  showPlayerTip(id, ev) {
    const o = this.g.net && this.g.net.others.get(id);
    if (!o) return;
    const C = CLASSES[o.cls], esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const SLOTS = ['Weapon', 'Ability', 'Armor', 'Ring'];
    const gear = (o.eq || []).map((id, i) => {
      const it = id && ITEMS[id];
      return `<div class="pk-item">${it ? `<i class="ico" style="background-image:url(${this.r.icon(id)})"></i><span style="color:${rarityColor(it)}">${esc(it.name)}</span>` : `<i class="ico empty"></i><span class="mut">${SLOTS[i]}: empty</span>`}</div>`;
    }).join('');
    const S = o.stats, stat = (k, label) => `<div class="kv"><span>${label}</span><b>${S[k]}</b></div>`;
    this.tip.innerHTML = `<div class="th"><div><h4>${esc(o.name)}</h4><div class="t">Level ${o.level || 1} ${C ? C.name : ''}${o.fame ? ` · ${o.fame} fame` : ''}</div></div></div>
      <div class="pk-gear">${gear || '<span class="mut">Gear not seen yet</span>'}</div>
      ${S ? `<div class="pk-stats">${stat('hp', 'HP')}${stat('mp', 'MP')}${stat('att', 'ATT')}${stat('def', 'DEF')}${stat('spd', 'SPD')}${stat('dex', 'DEX')}${stat('vit', 'VIT')}${stat('wis', 'WIS')}</div>` : ''}
      <div class="d">Click to teleport to them.</div>`;
    this.tip.style.setProperty('--rc', '#5ac8ff');
    this.tip.classList.remove('hidden');
    this.placeTip(ev);
  }
  // is this better than what you wear in its slot? (one you can use, a higher tier, or a slot you have empty)
  isUpgrade(it) {
    const p = this.g.player, k = { weapon: 0, ability: 1, armor: 2, ring: 3 }[it && it.slot];
    if (!p || k === undefined || !canEquip(p.cls, it)) return false;
    const cur = p.equip[k] && ITEMS[p.equip[k]];
    if (!cur) return true;
    const rank = (q) => (q.arm ? { UT: 20, Legendary: 25, Mythic: 30, Celestial: 32, Divine: 35 }[q.armTier] : (q.mythic ? 30 : q.legendary ? 25 : q.ut ? 20 : 0) + (typeof q.tier === 'number' ? q.tier : 0));
    return rank(it) > rank(cur);
  }
  tipHTML(it, id, name) {
    if (it.arm) {                                          // a Mad God Armory item: the armory's own tooltip (src/armory_tip.js)
      const worn = this.g.player ? this.g.player.equip.filter(Boolean).map((x) => ITEMS[x] && ITEMS[x].arm && ITEMS[x].arm.name).filter(Boolean) : [];
      let h = armoryTip(it, worn);
      if (this.g.player && !this.canUse(it)) h += `<div class="bad nope">Not usable by ${CLASSES[this.g.player.cls].name}</div>`;
      return h + this.tipKeys(it, id, name);
    }
    const g = this.g, row = (k, v, cls = '') => `<div class="kv ${cls}"><span>${k}</span><b>${v}</b></div>`;
    const badge = it.admin ? 'ADMIN' : it.mythic ? 'MYTHIC' : it.legendary ? 'LEGENDARY' : it.use && it.use.egg && RARITY[it.use.egg] ? RARITY[it.use.egg].name.toUpperCase() : it.ut ? 'UT' : it.tier === null || it.tier === undefined ? '' : 'T' + it.tier;
    let h = `<div class="th"><div><h4>${it.name}</h4><div class="t">${itemLabel(it)}</div></div>${badge ? `<span class="badge">${badge}</span>` : ''}</div>`;
    if (it.desc) h += `<div class="flav">${it.desc}</div>`;
    if (it.rf && it.rf.lines && it.rf.lines.length) h += `<div class="sec">${it.rf.lines.map((l) => `<div class="abd"${it.rf.pending.includes(l) ? ' style="opacity:.45"' : ''}>${l}${it.rf.pending.includes(l) ? ' (not yet)' : ''}</div>`).join('')}</div>`;   // a Realmforge unique's effects
    let stats = '';
    if (it.weapon) {
      const w = it.weapon;
      stats += row('Damage', `${w.dmg[0]}–${w.dmg[1]}`);
      if (w.count > 1) stats += row('Shots', `×${w.count}`);
      stats += row('Range', `${w.range} tiles`) + row('Rate of fire', `${Math.round(w.rate * 100)}%`) + row('Shot speed', w.speed);
      if (w.pierce) stats += row('Pierces', 'yes', 'good');
    }
    if (it.ability) {
      const a = it.ability;
      const what = { bellows: ['Bellows Charge', 'Dash toward your cursor, untouchable, battering everything in the path; ember blast at the end.'],
        seal: ['Oath-Anvil', 'Hurl the anvil onto your cursor: heavy area damage, and everything it hits is stunned.'],
        halo: ['Judgment of Noon', 'A pillar of light falls on your cursor and burns everything inside it for 1.2s.'],
        reliquary: ['Open the Reliquary', `Free ${a.thralls} bone thralls for ${a.life}s. They scuttle onto the nearest enemies, climb on top of them, and claw.`],
        hookline: ['Grapple Line', 'Hurl a hook at your cursor. A monster is reeled in and stunned; a boss hauls you to it; a miss hauls you to the hook.'],
        mirror: ['Mirror Step', `Blink to your cursor. Your reflection stays behind for ${a.decoy && a.decoy.toFixed(1)}s; monsters hunt it, then it shatters into glass.`],
        kite: ['Storm Kite', `Plant a storm kite at your cursor for ${a.life}s. It strikes the nearest enemy every 0.4s, arcing to a second.`],
        stopwatch: ['Stop Time', `Every monster and bullet within ${a.burst.range.toFixed(1)} tiles freezes for ${a.stop && a.stop.toFixed(1)}s (bosses for half). You keep moving.`],
        runeward: ['Rune Ward', `Runes close around you and soak up the next ${Math.round(a.ward || 0)} damage (for up to 6s), while rune-slashes cut a ring outward.`],
        hex: ['Hex', a.curse ? `Throw a curse at your cursor. Everything within ${a.curse.r.toFixed(1)} tiles takes +${Math.round(a.curse.f * 100)}% damage and is slowed for ${a.curse.t.toFixed(1)}s, and hex-bolts burst from it.` : 'Throw a curse at your cursor.'],
        godability: ['DELETE', 'Everything within 16 tiles stops existing.'] }[it.type] || ['Ability', ''];
      h += `<div class="sec"><div class="ab">${what[0]}</div><div class="abd">${what[1]}</div></div>`;
      stats += row('Mana cost', a.cost);
      const pw = { bellows: `Charge ${Math.round(a.burst.dmg * 1.3)} · blast ${Math.ceil(a.burst.count * 0.8)} × ${a.burst.dmg}`,
        seal: `Anvil ${Math.round(a.burst.dmg * 2.4)}`, halo: `Pillar 6 × ${Math.round(a.burst.dmg * 0.8)}`,
        reliquary: `Claw ${Math.round(a.burst.dmg * 1.3)} / 0.5s${a.burst.count > 1 ? ', cleaving' : ''}`, hookline: `Hook ${a.burst.dmg}`, godability: 'Infinite',
        mirror: `Shatter ${a.burst.count} × ${a.burst.dmg}`, kite: `Bolt ${a.burst.dmg}`, stopwatch: null,
        runeward: `Rune-slash ${a.burst.count} × ${a.burst.dmg}`, hex: `Hex-bolt ${a.burst.count} × ${a.burst.dmg}` }[it.type];
      if (pw) stats += row('Damage', pw);
      if (it.type === 'seal') stats += row('Stun', `${(1.4 + ((a.armored || 2.5) - 2.5) * 0.2).toFixed(1)}s`);
      if (it.type === 'hookline') stats += row('Hook range', `${a.burst.range.toFixed(1)} tiles`);
      if (a.berserk) stats += row('Berserk', `${a.berserk.toFixed(1)}s · +50% rate, +25% dmg`, 'good');
      if (a.ward) stats += row('Ward', `absorbs ${Math.round(a.ward)}`, 'good');
      if (a.curse) stats += row('Hex', `+${Math.round(a.curse.f * 100)}% dmg taken · ${a.curse.t.toFixed(1)}s · r ${a.curse.r.toFixed(1)}`, 'good');
      if (a.armored) stats += row('Armored', `${a.armored.toFixed(1)}s · half damage`, 'good');
      if (a.heal) stats += row('Heals', a.heal, 'good');
      if (a.invuln) stats += row('Invulnerable', `${a.invuln.toFixed(2)}s`, 'good');
    }
    if (it.slot === 'consumable' && it.use) {
      if (it.use.heal) stats += row('Restores', `${it.use.heal} Life`, 'good');
      if (it.use.mana) stats += row('Restores', `${it.use.mana} Mana`, 'good');
      if (it.use.stat) stats += row('Raises', `${STAT_NAMES[it.use.stat]} +${it.use.stat === 'hp' || it.use.stat === 'mp' ? 5 : 1}`, 'good');
      if (it.use.vault) stats += row('Vault', `+${it.use.vault} slots`, 'good');
      if (it.use.egg) stats += row('Hatches', `a ${it.use.egg} pet`, 'good');
      if (it.use.key) stats += row('Opens', 'a portal to its dungeon', 'good');
    }
    if (feedValue(it)) stats += row('Pet feed power', feedValue(it));
    if (stats) h += `<div class="sec stats">${stats}</div>`;
    if (it.bonus) {
      const chips = Object.entries(it.bonus).filter(([, v]) => v).map(([k, v]) => `<span class="chip ${v > 0 ? 'up' : 'down'}">${v > 0 ? '+' : ''}${v} ${STAT_NAMES[k]}</span>`).join('');
      if (chips) h += `<div class="sec chips">${chips}</div>`;
    }
    const sp = specialLines(it.base ? ITEMS[it.base] : it);
    if (sp.length) h += `<div class="sec">${sp.map((l) => `<div class="sp">${l}</div>`).join('')}</div>`;
    const eqIdx = { weapon: 0, ability: 1, armor: 2, ring: 3 }[it.slot];
    const cur = eqIdx !== undefined && name !== 'equip' && g.player ? g.player.equip[eqIdx] : null;
    if (cur && cur !== id && this.canUse(it)) {
      const a = ITEMS[cur];
      const avg = (x) => (x.weapon ? (x.weapon.dmg[0] + x.weapon.dmg[1]) / 2 * x.weapon.count * x.weapon.rate : 0);
      const lines = [];
      if (it.weapon && a.weapon) { const d = Math.round(avg(it) - avg(a)); lines.push([d, `${d >= 0 ? '+' : ''}${d} damage/sec (base)`]); }
      const keys = new Set([...Object.keys(it.bonus || {}), ...Object.keys(a.bonus || {})]);
      for (const k of keys) {
        const d = ((it.bonus || {})[k] || 0) - ((a.bonus || {})[k] || 0);
        if (d) lines.push([d, `${d > 0 ? '+' : ''}${d} ${STAT_NAMES[k]}`]);
      }
      if (lines.length) h += `<div class="cmp"><div class="ch">Compared to ${a.name}</div>${lines.map(([d, l]) => `<div class="${d >= 0 ? 'good' : 'bad'}">${l}</div>`).join('')}</div>`;
    }
    if (it.set && SETS[it.set] && g.player) {              // a set piece: the other pieces, and what wearing them unlocks
      const S = SETS[it.set], worn = g.player.equip.filter(Boolean).map((x) => ITEMS[x].base || x);
      const n = SET_PIECES[it.set].filter((x) => worn.includes(x)).length;
      const line = (tier) => [...Object.entries(S[tier].bonus || {}).map(([k, v]) => `+${v} ${STAT_NAMES[k]}`), ...specialLines({ passive: S[tier].passive })].join(', ');
      h += `<div class="setbox"><div class="sh">${S.name} (${n}/3)</div>${SET_PIECES[it.set].map((x) => `<div class="${worn.includes(x) ? 'on' : 'off'}">${worn.includes(x) ? '✔' : '·'} ${ITEMS[x].name}</div>`).join('')}
        <div class="${n >= 2 ? 'on' : 'off'}">2 pieces: ${line(2)}</div><div class="${n >= 3 ? 'on' : 'off'}">3 pieces: ${line(3)}</div></div>`;
    }
    if (it.enchants) h += `<div class="ench"><div class="eh">✦ Enchanted</div>${it.enchants.map((e) => `<div class="${e.unique ? 'eu' : 'ev'}">${e.unique ? '★ ' : ''}${e.text}</div>`).join('')}</div>`;
    if (g.player && it.slot !== 'consumable' && !(!it.type || ['ring'].includes(it.type)) && !this.canUse(it)) h += `<div class="bad nope">Not usable by ${CLASSES[g.player.cls].name}</div>`;
    return h + this.tipKeys(it, id, name);
  }
  // what the mouse does with it, under the tooltip
  tipKeys(it, id, name) {
    let h = '';
    if (name) {
      const use = it.slot === 'consumable' ? 'use' : name === 'equip' ? 'unequip' : 'equip';
      const keys = name === 'ground' ? ['Double-click: take'] : [`Double-click: ${use}`, `Right-click: ${it.slot === 'consumable' ? 'use' : 'equip'} now`];
      if (it.slot === 'consumable') keys.push('Shift-click: use'); else if (name !== 'equip') keys.push(`Shift-click: ${name === 'ground' ? 'take' : 'drop'}`);
      if (this.g.isPotion(id) && name !== 'pots') keys.push('Drag to a potion slot to stack');
      h += `<div class="keys">${keys.join(' · ')}</div>`;
    }
    return h;
  }
  canUse(it) {
    return canEquip(this.g.player.cls, it);
  }
  placeTip(ev) {
    const t = this.tip, w = t.offsetWidth, h = t.offsetHeight;
    // keep it on screen: flip to the left of the cursor near the right edge, never off the top or bottom
    const x = ev.clientX + 14 + w > window.innerWidth - 8 ? ev.clientX - w - 14 : ev.clientX + 14;
    t.style.left = Math.max(8, x) + 'px';
    t.style.top = Math.max(8, Math.min(window.innerHeight - h - 8, ev.clientY + 14)) + 'px';
  }
  // the class portrait beside your name: the front-facing sprite, outlined, at 2x
  drawPortrait(cls) {
    const cv = $('portrait'), S = this.r.A.sheets[CLASSES[cls].sheet], A = S.guide.animations.front_idle;
    if (!cv || !S) return;
    this.portraitFor = cls;
    const x = cv.getContext('2d'), F = S.guide.frameWidth, fr = outlinedFrame(S.img, A.col * F, A.row * F, F, F, 2);
    x.imageSmoothingEnabled = false; x.clearRect(0, 0, cv.width, cv.height);
    x.drawImage(fr, Math.round((cv.width - fr.width) / 2), Math.round((cv.height - fr.height) / 2) - 1);
  }
  // squeeze the side panel when a bag, a portal card and quests all want room at once (no scrolling, ever)
  // fit the side panel to the screen with no scrolling. Decided in one pass from the roomiest layout down, so the same
  // screen always lands on the same layout (nothing pulses): full size, then tight, then smaller slots, then stats aside.
  // the side panel has one fixed layout (style.css, the HUD block at the end): nothing resizes to fit any more
  fitPanel() {}

  hideTip() { this.tip.classList.add('hidden'); this.bagTip = null; }
  // hover a loot bag lying in the world to see what's inside it, without walking over
  hoverWorld(w) {                                         // hover a bag in the world: its slots show above it (drawn by the renderer)
    const g = this.g;
    let bag = null;
    if (w && !this.drag && g.bags) {
      let bd = 0.75;
      for (const b of g.bags) { const d = Math.hypot(b.x - w.x, b.y - 0.35 - w.y); if (d < bd) { bd = d; bag = b; } }
    }
    g.hoverBag = bag;
  }
  // the loading card: where you're going, how dangerous it is, a spinner. It is painted before the map is made, so
  // the moment of making it is spent on this card instead of a frozen screen; it stays at least 0.7 s, then fades
  travel(where) {
    const g = this.g;
    if (this.loading) return;
    const D = g.destination(where), L = document.getElementById('loadcard') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'loadcard' }));
    const stars = D.stars > 0 ? `<div class="lstars">${'★'.repeat(D.stars)}<i>${'★'.repeat(5 - D.stars)}</i></div>` : D.stars < 0 ? '<div class="lstars">★<i>★★★★</i> to ★★★★★</div>' : '<div class="lstars safe">Safe</div>';
    L.innerHTML = `<div class="lbox"><small>Travelling to</small><h2>${D.name}</h2>${stars}<p>${D.sub}</p><div class="lspin">${'<i></i>'.repeat(8)}</div></div>`;
    L.className = 'on'; this.loading = true; g.loading = true;
    const t0 = performance.now();
    requestAnimationFrame(() => requestAnimationFrame(() => {   // let the card paint, then do the heavy work
      try { g.enter(where); } finally {
        setTimeout(() => { L.className = 'off'; this.loading = false; g.loading = false; this.refreshSlots(); this.refreshPortal(); }, Math.max(0, 700 - (performance.now() - t0)));
      }
    }));
  }
  // the key hints round the panel name your own keys (and leave out an action with none)
  keyLine() {
    const parts = [['portal', 'portal / talk'], ['lootAll', 'loot all'], ['nexus', 'nexus'], ['ability', 'ability'], ['autofire', 'autofire'], ['chat', 'chat'], ['settings', 'settings']]
      .map(([a, l]) => (keyName(a) ? `${keyName(a)} ${l}` : '')).filter(Boolean);
    if ($('keys')) $('keys').textContent = parts.join(' · ');
    const c = keyName('potion1'), v = keyName('potion2');
    if ($('potkeys')) $('potkeys').textContent = `${[c, v].filter(Boolean).map((k) => k.replace(/^Mouse /, 'M').replace(/^(Middle|Right) mouse/, '$1')).join(' / ')}${c || v ? ' · ' : ''}10 each`;
    if ($('gear')) $('gear').title = `Settings${keyParen('settings')}`;
  }
  // the portal (or NPC) you're standing at: same as pressing the portal key
  enterNear() {
    const g = this.g;
    if (g.mode !== 'play' || this.overlayOpen()) return;
    const o = g.nearNPC;
    if (o && !g.nearPortal) g.interact(o);                 // (menus come back as an 'npc' event, opened below in tick)
    else g.usePortal();
    this.refreshPortal();
  }
  refreshPortal() {
    const g = this.g, pt = g.mode === 'play' ? g.nearPortal : null, npc = g.mode === 'play' && !pt ? g.nearNPC : null;
    const bag = g.mode === 'play' && (g.nearBag || g.nearVault);
    $('portalwrap').classList.toggle('off', (!pt && !npc) || !!bag);              // a bag on the portal wins the space
    $('bagportal').classList.toggle('off', !(bag && pt));
    if (bag && pt) $('bagportal').textContent = `Enter ${pt.label}`.slice(0, 28);
    if (!pt && !npc) return;
    if (pt) {
      const kind = g.map.kind === 'dungeon' && pt.to === 'realm' ? 'Exit portal' : { realm: 'Realm portal', vault: 'Vault door', nexus: 'Nexus portal' }[pt.kind] || 'Dungeon portal';
      $('portalkind').textContent = kind;
      $('portalname').textContent = pt.label;
      $('portalsub').textContent = pt.life !== undefined ? `Closes in ${Math.ceil(pt.life)}s` : pt.to === 'realm' && g.map.kind === 'dungeon' ? 'Leads back to where you entered' : 'Always open';
      $('portalgo').textContent = `Enter${keyParen('portal')}`;
    } else {
      const info = {
        shop: ['Merchant', 'The Salt-Peddler', 'Buy and sell gear', 'Talk'], forge: ['Smithy', 'The Ashwright\'s Forge', 'Upgrade or salvage gear', 'Talk'],
        board: ['Quest board', 'The Notice Board', `${g.player.quests.length}/3 quests taken`, 'Read'],
        talk: ['Wanderer', npc.who ? { ossic: 'Brother Ossic', fennick: 'Mother Fennick', ingrit: 'Scholar Ingrit', laughing: 'The Penitent Who Laughs' }[npc.who] : 'A stranger', 'They look like they want to talk', 'Talk'],
        lore: ['Lore stone', 'An old carved stone', `${g.player.lore.length} of 16 read`, 'Read'],
        wish: ['Wishing well', 'Toss in 50 gold', 'Something might happen', 'Wish'],
        altar: ['Trial altar', npc.state === 'won' ? 'The trial is won' : npc.state ? 'The trial is underway!' : 'Survive three waves', 'A prize for the brave', npc.state ? '...' : 'Begin'],
        dig: ['Dig spot', npc.dug ? 'Already dug' : 'X marks the spot', 'What could be down there?', 'Dig'],
        fish: ['Fishing', 'The Nexus pond', 'Something is biting', 'Fish'],
        cat: ['The cat', 'A sleeping cat', `Petted ${g.player.petted || 0} times`, 'Pet'],
        bard: ['The bard', 'A bard by the fire', 'Songs, and a little inspiration', 'Listen'],
        fortune: ['Fortune teller', "Madame Ostra's tent", '100 gold for a glimpse of tomorrow', 'Pay'],
        guide: ['The Nexus guide', 'New here?', 'What everything is, a line at a time', 'Talk'],
        legends: ['Hall of Legends', 'Your fallen heroes', 'And the stars each class has earned', 'Read'],
        atlas: ['Dungeon Atlas', 'Every dungeon in the realm', 'How hard, whose, and where its portal drops', 'Read'],
      }[npc.interact] || ['', npc.label || '', '', 'Use'];
      $('portalkind').textContent = info[0]; $('portalname').textContent = info[1]; $('portalsub').textContent = info[2]; $('portalgo').textContent = info[3] + keyParen('portal');
    }
  }
  // per-frame cheap updates
  // what's boosting you, with its time left (Game.activeBoosts); rebuilt only when it changes
  drawBoosts() {
    const el = document.getElementById('boosts');
    if (!el) return;
    const L = this.g.mode === 'play' ? this.g.activeBoosts() : [], fmt = (t) => (t >= 60 ? `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}` : `${Math.ceil(t)}s`);
    const html = L.map((B) => `<div class="bst${B.bad ? ' bad' : ''}"><b>${B.name}</b><i>${B.what}</i><em>${fmt(B.t)}</em></div>`).join('');
    if (html !== this.boostHtml) { this.boostHtml = html; el.innerHTML = html; }
  }
  tick(dt) {
    const g = this.g;
    if ((this.boostT = (this.boostT || 0) - dt) <= 0) { this.boostT = 0.25; this.drawBoosts(); }   // the boost list (4 a second)
    if (g.nearBag && g.nearBag.until - g.t < 31 && (this.bagTickT = (this.bagTickT || 0) - dt) <= 0) { this.bagTickT = 0.5; this.refreshSlots(); }   // (a vanishing bag's countdown)
    for (const ev of g.events.splice(0)) {
      if (ev.type === 'banner' || ev.type === 'toast') this.banner(ev.text, ev.ms || 1800);
      if (ev.type === 'ground' || ev.type === 'map') this.refreshSlots();
      if (ev.type === 'map') { const f = $('fade'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }
      if (ev.type === 'chat') this.renderChat();
      if (ev.type === 'npc') { if (ev.which === 'shop') this.openShop(); else if (ev.which === 'board') this.openBoard(); else if (ev.which === 'waypoint') this.openWaypoints(ev.from); else if (ev.which === 'petyard') this.openPetYard(); else if (ev.which === 'journal') this.openJournal(ev); else if (ev.which === 'atlas') this.openAtlas(); else if (ev.which === 'legends') this.openLegends(); else this.openForge(); }
      if (ev.type === 'death') this.deathScreen();
    }
    if (this.bannerT > 0 && (this.bannerT -= dt) <= 0) $('banner').classList.add('hidden');
    this.chatAcc = (this.chatAcc || 0) + dt;
    if (this.chatAcc > 1) { this.chatAcc = 0; if (!this.chatOpen()) this.renderChat(); }   // let old lines fade
    if (this.armIcons && this.armIcons.length) { const now = performance.now(); for (const q of this.armIcons) if (q.cv.isConnected) armIcon(q.cv, q.A, now, false, q.seed); }   // the armory's items, live
    this.shineT = (this.shineT || 0) + dt;
    for (const s of this.shines || []) {                     // the item art's own shine (every 5 s), and a legendary's twinkle
      const t = (this.shineT + s.off) % 5, f = t < 0.3 ? ['shine1', 'shine2', 'shine3'][Math.floor(t / 0.1)]
        : s.legend && t >= 1.2 && t < 2.53 ? ['twinkle0', '0', 'twinkle1', '0', 'twinkle2', '0', 'twinkle3', '0'][Math.floor((t - 1.2) * 6)] : '0';
      if (f !== s.f) { s.f = f; s.ico.style.backgroundImage = `url(${this.r.icon(s.id, f)})`; }
    }
    this.acc = (this.acc || 0) + dt;
    if (this.acc < 0.1 || g.mode !== 'play') { if (g.mode !== 'play') $('portalwrap').classList.add('off'); return; }
    this.refreshPortal();
    if (g.nearVault && !this.vaultOpen && !this.vaultShut && !this.overlayOpen()) this.openVault();   // on the chest: the vault window
    if (!g.nearVault) { this.vaultShut = false; if (this.vaultOpen) this.closeVault(); }
    this.refreshQuests();
    this.refreshSeals();
    this.fitPanel();
    this.acc = 0;
    const p = g.player, C = CLASSES[p.cls];
    $('cname').textContent = g.account && g.account.name ? g.account.name : C.name;   // your name in the nearby list, RotMG-style
    $('cname').parentElement.title = `${C.name}, level ${p.level}`;
    if (this.portraitFor !== p.cls) this.drawPortrait(p.cls);
    $('clevel').textContent = p.level >= MAX_LEVEL ? `Level ${p.level} · ✦ ${p.fame || 0} fame` : `Level ${p.level}`;
    const hpM = g.stat('hp'), mpM = g.stat('mp');
    $('hpfill').style.width = (100 * Math.max(0, p.hp) / hpM) + '%';
    $('hpfill').parentElement.classList.toggle('low', p.hp / hpM < 0.3);
    const plus = (k, M) => { const b = M - (p.base[k] || M); return b ? ` <em>(${b > 0 ? '+' : ''}${b})</em>` : ''; };
    $('hptext').innerHTML = `${Math.ceil(Math.max(0, p.hp))}/${hpM}${plus('hp', hpM)}`;
    $('mpfill').style.width = (100 * p.mp / mpM) + '%';
    $('mptext').innerHTML = `${Math.floor(p.mp)}/${mpM}${plus('mp', mpM)}`;
    { const X = (CLASSES[p.cls] || {}).max || {}; $('hpfill').parentElement.classList.toggle('maxed', p.base.hp >= X.hp); $('mpfill').parentElement.classList.toggle('maxed', p.base.mp >= X.mp); }   // (gold when maxed)
    if (p.level >= MAX_LEVEL) {                           // at 20 the bar tracks fame toward the next fame goal
      const f = p.fame || 0, goal = FAME_GOALS.find((x) => x > f), prev = [...FAME_GOALS].reverse().find((x) => x <= f) || 0;
      $('xpfill').style.width = (goal ? 100 * (f - prev) / (goal - prev) : 100) + '%';
      $('xplabel').textContent = 'Fame'; $('xptext').textContent = goal ? `${f} / ${goal}` : `${f}`;
      $('xpfill').parentElement.classList.add('fame');
    } else {
      $('xpfill').style.width = (100 * p.xp / xpToNext(p.level)) + '%';
      $('xplabel').textContent = `Lvl ${p.level}`; $('xptext').textContent = `${p.xp}/${xpToNext(p.level)}`;
      $('xpfill').parentElement.classList.remove('fame');
    }
    document.querySelectorAll('#iconrow [data-t]').forEach((b) => b.classList.toggle('on', this.statTab === b.dataset.t));
    this.nearbyLine();
    $('panel').dataset.tab = this.statTab || 'inv';      // Backpack | Stats | Pet share one fixed box under the equipment
    if (this.statTab === 'rec') { this.recordPanel(); $('where').textContent = g.where || ''; $('hfame').textContent = g.save.fame; $('hgold').textContent = g.save.gold || 0; $('hess').textContent = g.save.essence || 0; this.refreshSlots(); return; }
    $('stats').classList.remove('recview');
    if (this.statTab === 'pet') { this.petPanel(); $('where').textContent = g.where || ''; $('hfame').textContent = g.save.fame; $('hgold').textContent = g.save.gold || 0; $('hess').textContent = g.save.essence || 0; this.refreshSlots(); return; }
    $('stats').classList.remove('petview'); this.petKey = null;
    $('stats').innerHTML = STATS.slice(2).map((s) => {
      const v = g.stat(s), base = p.base[s], max = C.max[s];
      const bonus = v - base;
      return `<div class="${base >= max ? 'max' : ''}"><span class="st st-${s}">${s.toUpperCase()}</span><span>${base}${bonus ? `<span class="bonus">${bonus > 0 ? '+' : ''}${bonus}</span>` : ''}</span></div>`;
    }).join('');
    $('where').textContent = g.where || '';
    $('hfame').textContent = g.save.fame; $('hgold').textContent = g.save.gold || 0; $('hess').textContent = g.save.essence || 0;
    this.refreshSlots();
  }
  // under the backpack: where you are, then the OTHER players with you (2026-10-19: not you, not your pet; the row
  // stays, empty, for others)
  nearbyLine() {
    if (!this.showSelfInNearby) {                         // the other players here (src/net.js), nearest first
      // everyone in this place, nearest first (not only those close by)
      const el = $('petname'), p = this.g.player, here = this.g.netHere().filter((o) => !o.dead)
        .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y)).slice(0, 8);
      const N = this.g.net, shared = !!this.g.netRoom(), st = !N || !N.url ? '' : N.open ? `● ${N.online || 1} online${shared ? '' : ' · not shared here'}` : '○ offline';
      const key = st + '|' + here.map((o) => o.id + ':' + o.name).join(',');
      if (el.dataset.k === key) return;
      el.dataset.k = key; el.textContent = '';
      if (st) { const s0 = document.createElement('span'); s0.className = 'netstat' + (N.open ? '' : ' off'); s0.textContent = st; el.appendChild(s0); }   // are you with the others?
      for (const o of here) {                               // click a name to teleport to them
        const s = document.createElement('span'); s.className = 'other'; s.textContent = `${o.name} (Lv ${o.level || 1})`; s.title = `Teleport to ${o.name}`;
        s.onclick = () => { const err = this.g.teleportTo(o.name); if (err) this.g.toast(err); };
        s.onmouseenter = (ev) => this.showPlayerTip(o.id, ev); s.onmousemove = (ev) => this.placeTip(ev); s.onmouseleave = () => this.hideTip();   // a quick look at them
        el.appendChild(s);
      }
      return;
    }
    const P = this.g.activePet(), el = $('petname'), key = P ? `${P.id}:${P.rarity}:${petSprite(P)}` : '';
    if (el.dataset.k === key) return;
    el.dataset.k = key;
    el.innerHTML = P ? `<i class="ico pet" style="background-image:url(${this.petIcon(petSprite(P))})"></i><span>${petName(P)}</span>` : '';
  }
  // ---- the gear's dropdown
  toggleGearMenu() {
    const m = $('gearmenu'), open = m.classList.contains('hidden'), g = this.g;
    m.querySelector('[data-m="nexus"]').classList.toggle('hidden', g.mode !== 'play' || g.map.kind === 'nexus');
    m.querySelector('[data-m="chars"]').classList.toggle('hidden', g.mode !== 'play');
    const gb = $('gear'); m.style.top = (gb.offsetTop + gb.offsetHeight + 2) + 'px';   // right under the gear
    m.classList.toggle('hidden', !open);
  }
  gearMenu(what) {
    const g = this.g;
    $('gearmenu').classList.add('hidden');
    if (what === 'options') { if (!this.settingsOpen) this.toggleSettings(); }
    else if (what === 'nexus') { if (g.mode === 'play') g.toNexus(); }
    else if (what === 'chars') { this.settingsOpen = false; this.closeVault(); g.leaveToMenu(); this.titleScreen(); }
    else if (what === 'account') {
      this.settingsOpen = false; this.closeVault();
      if (g.mode === 'play') g.leaveToMenu();
      this.signOut();
    }
  }
  // ---- the vault window: the vault's grid, moved out of the panel into a big window over the game while you stand
  // on the chest (so its drag, tooltips and double-click all still work), and put back when you leave
  openVault() {
    if (this.vaultOpen) return;
    this.vaultOpen = true;
    $('vwbody').appendChild($('ground'));
    $('vaultwin').classList.remove('hidden');
    this.refreshSlots();
  }
  closeVault(byHand = false) {
    if (!this.vaultOpen) return;
    this.vaultOpen = false; if (byHand) this.vaultShut = true;   // (closed by hand: it stays shut until you step off)
    $('groundwrap').appendChild($('ground'));
    $('vaultwin').classList.add('hidden');
    this.refreshSlots();
  }
  sortVault(mode) {
    const g = this.g, V = g.container('vault');
    if (!V) return;
    const RANK = (it) => (it.admin ? 6 : it.mythic ? 5 : it.legendary ? 4 : it.ut ? 3 : it.slot === 'consumable' ? 0 : 1 + (it.tier || 0) / 20);
    const TYPE = ['weapon', 'ability', 'armor', 'ring', 'consumable'];
    const key = {
      type: (it) => [TYPE.indexOf(it.slot) < 0 ? 9 : TYPE.indexOf(it.slot), it.type || '', -(typeof it.tier === 'number' ? it.tier : 99), it.name],
      tier: (it) => [-(typeof it.tier === 'number' ? it.tier : it.ut || it.mythic || it.legendary ? 99 : -1), it.name],
      rarity: (it) => [-RANK(it), it.name],
      name: (it) => [it.name],
    }[mode];
    const items = V.filter(Boolean).sort((a, b) => { const A = key(ITEMS[a]), B = key(ITEMS[b]); for (let k = 0; k < A.length; k++) { if (A[k] < B[k]) return -1; if (A[k] > B[k]) return 1; } return 0; });
    for (let k = 0; k < V.length; k++) V[k] = items[k] || null;
    g.persist();
    this.refreshSlots();
    g.toast(`Vault sorted by ${mode}`);
  }
  // the sidebar's Pet tab: your companion at a glance (abilities, levels, what it does, when it next acts)
  // the character tab: what this character has done (kept with it: src/game.js REC_KEYS), in the box under the equipment
  recordPanel() {
    const p = this.g.player, el = $('stats');
    if (!p) return;
    el.classList.remove('petview'); el.classList.add('recview'); this.petKey = null;
    el.innerHTML = recordRows(liveRecord(p), true).map(([k, v]) => `<div><span class="rk">${k}</span><span>${v}</span></div>`).join('');
  }
  petPanel() {
    const g = this.g, P = g.activePet(), el = $('stats');
    el.classList.add('petview');
    if (!P) { if (this.petKey !== 'none') { this.petKey = 'none'; el.innerHTML = '<div class="pv-none">No companion yet. Visit the Petkeeper in the Nexus, or hatch an egg.</div>'; } return; }
    const Rr = RARITY[P.rarity], q = g.pet, cap = petCap(P);
    const key = `${P.id}:${P.rarity}:${Object.values(P.ab).map((A) => A.lv + '.' + A.xp).join(',')}:${q ? Math.ceil(q.tick) : '-'}`;
    if (this.petKey === key) return;
    this.petKey = key;
    const ab = abilityOrder(P).map((k, i) => {
      const A = P.ab[k], full = A.lv >= cap, val = k === 'heal' ? `+${petHeal(P)} Life` : `+${petMagic(P)} Mana`;
      return `<div class="pv-ab${i === 0 ? ' main' : ''}"><span>${ABILITIES[k].name}${i === 0 ? ' · main' : ''}</span><b>${A.lv}<small>/${cap}</small></b><em>${val}</em><div class="pxp"><i style="width:${full ? 100 : Math.round(100 * A.xp / petXpToNext(A.lv))}%"></i></div></div>`;
    }).join('');
    el.innerHTML = `<div class="pv-head"><span class="ico pet" style="background-image:url(${this.petIcon(petSprite(P))})"></span><div><b style="color:${Rr.color}">${petName(P)}</b>
      <small>${Rr.name} · level ${petLevel(P)}${Rr.morph && mainMaxed(P) ? ' · ready to fuse' : ''}</small></div></div>${ab}
      <div class="pv-foot">${q ? `next heal in ${Math.max(0, Math.ceil(q.tick))}s` : 'resting'} · every ${PET_TICK}s</div>`;
  }
  banner(text, ms) {
    const b = $('banner');
    b.textContent = text; b.classList.remove('hidden');
    this.bannerT = ms / 1000;
  }

  // ------------------------------------------------------------- screens
  overlay(html) {
    const o = $('overlay');
    o.innerHTML = html;
    o.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => this.sfx && this.sfx.play('click')));
    o.classList.remove('hidden');
    return o;
  }
  closeOverlay() { $('overlay').classList.add('hidden'); }

  // ------------------------------------------------------------- home: account + character select
  // ---------------------------------------------------------------- the front door: login, account, characters
  // A living pixel scene behind every menu screen: night sky, the four biomes, the eight heroes on the march,
  // monsters coming the other way, and something enormous waiting on the hill.
  splash(o) {
    const A = this.r.A, W = A.world, cv = document.createElement('canvas');
    cv.className = 'splash'; o.prepend(cv);
    const S = 3, t0 = performance.now();
    const stars = Array.from({ length: 90 }, (_, i) => ({ x: (i * 73.13) % 1, y: ((i * 37.7) % 1) * 0.55, p: i * 1.7 }));
    const biomes = ['sand', 'grass', 'fen', 'snow', 'runefloor', 'ash', 'obsidian'];
    const heroes = Object.keys(CLASSES);
    const mobs = ['brine_pilgrim', 'bog_toad', 'frozen_executioner', 'hollow_thane', 'salt_widow', 'cairn_crawler', 'peat_saint', 'ash_harpy'];
    const draw = () => {
      if (!cv.isConnected) return;
      const w = Math.ceil(innerWidth / S), h = Math.ceil(innerHeight / S);
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      const x = cv.getContext('2d'), t = (performance.now() - t0) / 1000;
      x.imageSmoothingEnabled = false;
      const sky = x.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#07051a'); sky.addColorStop(0.55, '#24164a'); sky.addColorStop(0.8, '#5a2e5e'); sky.addColorStop(1, '#2a1a30');
      x.fillStyle = sky; x.fillRect(0, 0, w, h);
      for (const st of stars) { x.fillStyle = Math.sin(t * 2 + st.p) > 0.6 ? '#ffffff' : '#9a8ac8'; x.fillRect(Math.floor(st.x * w), Math.floor(st.y * h), 1, 1); }
      x.fillStyle = '#fff6d8'; x.beginPath(); x.arc(w * 0.78, h * 0.2, 14, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#e8d8b0'; x.beginPath(); x.arc(w * 0.78 + 4, h * 0.2 - 3, 3, 0, Math.PI * 2); x.fill();
      const ground = Math.floor(h * 0.72);
      for (const [k, col, amp, fr] of [[0, '#1a1236', 28, 0.012], [1, '#120c26', 18, 0.02]]) {      // two ranges of distant hills
        x.fillStyle = col;
        for (let i = 0; i < w; i++) {
          const yy = ground - 10 - k * 4 - Math.round(amp * (0.5 + 0.5 * Math.sin((i + t * (3 + k * 4)) * fr + k * 2)));
          x.fillRect(i, yy, 1, ground - yy + 2);
        }
      }
      // the boss on the hill: the Penitent Colossus, breathing slowly
      const RB = A.sheets.realm_bosses, bf = RB.guide.frameWidth, brow = RB.guide.bosses.penitent_colossus.row;
      const bfr = outlinedFrame(RB.img, (Math.floor(t * 1.5) % 4) * bf, brow * bf, bf, bf);
      x.globalAlpha = 0.9; x.drawImage(bfr, Math.round(w * 0.82 - bf / 2), ground - bf - 4); x.globalAlpha = 1;
      // the ground: a strip of every biome, scrolling
      const TS = 16, tiles = A.img.tiles, tc = W.tilesCols, scroll = Math.floor(t * 10);
      for (let row = 0; row < Math.ceil((h - ground) / TS) + 1; row++) {
        for (let i = -1; i < Math.ceil(w / TS) + 1; i++) {
          const gi = i + Math.floor(scroll / TS), nm = biomes[Math.floor(gi / 6) % biomes.length < 0 ? 0 : Math.floor(((gi / 6) % biomes.length + biomes.length) % biomes.length)];
          const T = W.tiles[nm], k = T.i + ((gi * 7 + row * 3) % T.variants + T.variants) % T.variants * T.frames;
          x.drawImage(tiles, (k % tc) * TS, Math.floor(k / tc) * TS, TS, TS, i * TS - (scroll % TS), ground + row * TS, TS, TS);
        }
      }
      // the heroes march right; monsters come the other way
      const shadow = (cx, cy) => { x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(cx - 5, cy - 1, 10, 2); };
      heroes.forEach((c, i) => {
        const Sh = A.sheets[CLASSES[c].sheet], an = Sh.guide.animations.side_walk, F = Sh.guide.frameWidth;
        const fr = outlinedFrame(Sh.img, (an.col + Math.floor(t * 6 + i) % an.frames) * F, an.row * F, F, F);
        const cx = Math.round(w * 0.12 + i * 22), cy = ground + 8 + (i % 2) * 6;
        shadow(cx, cy); x.drawImage(fr, cx - F / 2 - 1, cy - F);
      });
      const E = A.sheets.enemies;
      mobs.forEach((id, i) => {
        const row = E.guide.enemies[id] && E.guide.enemies[id].row;
        if (row === undefined) return;
        const fr = outlinedFrame(E.img, (Math.floor(t * 5 + i) % 4) * 16, row * 16, 16, 16);
        const span = w * 0.42, cx = Math.round(w * 0.95 - ((t * 9 + i * 40) % span)), cy = ground + 10 + (i % 3) * 5;
        shadow(cx, cy); x.drawImage(fr, cx - 9, cy - 16);
      });
      for (let i = 0; i < 14; i++) {                             // fireflies
        const fx = (i * 97.3 + t * 6 * (1 + i % 3)) % w, fy = ground - 20 + Math.sin(t * 1.3 + i) * 12;
        x.fillStyle = i % 3 ? '#ffe45c' : '#8af6ff'; x.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4 + i); x.fillRect(Math.round(fx), Math.round(fy), 1, 1);
      }
      x.globalAlpha = 1;
      requestAnimationFrame(draw);
    };
    draw();
  }
  // the front door when the server keeps accounts (milestone 4): one account, any computer
  onlineScreen(msg = '') {
    const o = this.overlay(`<div class="screen login"><div class="logo"><h1>MELON REALMS</h1></div>
      <div class="card">
        <h3>Sign in or make an account</h3>
        <input id="lname" maxlength="16" placeholder="Account name" autocomplete="username" spellcheck="false">
        <input id="lpass" type="password" maxlength="64" placeholder="Password" autocomplete="current-password">
        <label class="keep"><input type="checkbox" id="lkeep" checked> Keep me signed in on this computer</label>
        <div class="row2"><button class="btn primary" id="login">Sign in</button><button class="btn" id="create">Create account</button></div>
        <p class="msg"></p>
        <p class="fine">Your account and characters are kept on the Melon Realms server: play from any computer. <a href="#" id="offline">Play offline instead</a></p>
      </div></div>`);
    this.splash(o);
    const name = o.querySelector('#lname'), pass = o.querySelector('#lpass'), say = (t) => this.loginMsg(o, t);
    say(msg);
    const go = async (kind) => {
      const nm = name.value.trim();
      if (!nm || !pass.value) return say('Type your account name and password.');
      say(kind === 'signup' ? 'Making your account…' : 'Signing in…');
      // a new account brings this browser's progress for that name, if there is any
      const local = kind === 'signup' && loadAccounts().list.find((a) => a.name.toLowerCase() === nm.toLowerCase());
      const r = await this.g.netAuth(kind, { name: nm, pass: pass.value, upload: local ? loadSave(saveKeyFor(local.id)) : undefined });
      if (r.error) return say(r.error);
      setSession(o.querySelector('#lkeep').checked ? r.token : null);
      this.useOnline(r);
    };
    o.querySelector('#login').onclick = () => go('login');
    o.querySelector('#create').onclick = () => go('signup');
    o.querySelector('#offline').onclick = (e) => { e.preventDefault(); this.loginScreen(); };
    for (const el of [name, pass]) el.onkeydown = (e) => { if (e.key === 'Enter') go('login'); };
    name.focus();
  }
  // sign out (both the account page's button and the gear menu): an online account back to the online door
  signOut() {
    const g = this.g;
    if (g.account && g.account.online) {
      if (g.player && !g.player.dead && g.mode === 'play') g.persist();
      g.netSaveNow(); g.netAuth('logout', { token: g.account.token }); setSession(null); g.account = null;
      return this.onlineScreen();
    }
    const A = loadAccounts(); A.keep = null; saveAccounts(A); g.account = null;
    if (g.netHasAccounts()) return this.onlineScreen();
    this.loginScreen();
  }
  // signed in on the server: its save (or a fresh one) is yours, cached in this browser too
  useOnline(r) {
    const g = this.g, a = r.account;
    const acc = { id: 'net' + a.id, name: a.name, online: true, admin: !!a.admin, token: r.token, created: '' };
    g.account = acc; g.saveKey = saveKeyFor(acc.id);
    // the server's copy, unless this browser holds a newer one (its last saves lost when the server restarted): then
    // this browser's copy is yours, and goes to the server at once
    const mine = (() => { try { return JSON.parse(localStorage.getItem(g.saveKey) || 'null'); } catch { return null; } })();
    const newer = mine && r.save && (mine.savedAt || 0) > (r.save.savedAt || 0) + 2000 && (mine.chars || []).length;
    g.save = normalizeSave(newer ? mine : r.save);
    if (newer) { g.netSave({ ...g.save }); g.netSaveNow(); }
    if (r.created && r.save) this.g.say('Your progress on this computer came with you.', '#7ad0a8');
    this.accountScreen();
  }
  loginScreen(msg = '') {
    const A = loadAccounts();
    const list = A.list.map((a) => `<button class="acctbtn" data-acc="${a.id}"><b>${a.name}</b><small>${a.hash ? '🔒 password' : 'no password'} · since ${a.created}</small></button>`).join('');
    const o = this.overlay(`<div class="screen login"><div class="logo"><h1>MELON REALMS</h1></div>
      <div class="card">
        ${A.list.length ? `<h3>Accounts on this computer</h3><div class="accts">${list}</div><div class="or">or</div>` : ''}
        <h3>${A.list.length ? 'Sign in / make a new account' : 'Make your account'}</h3>
        <input id="lname" maxlength="20" placeholder="Account name" autocomplete="off" spellcheck="false">
        <input id="lpass" type="password" maxlength="64" placeholder="Password (optional)" autocomplete="new-password">
        <label class="keep"><input type="checkbox" id="lkeep" ${A.keep ? 'checked' : ''}> Keep me logged in on this computer</label>
        <div class="row2"><button class="btn primary" id="login">Sign in</button><button class="btn" id="create">Create account</button></div>
        <p class="msg">${msg}</p>
        <p class="fine">Accounts are saved in this browser only. A password keeps other people on this computer out of your characters.</p>
      </div></div>`);
    this.splash(o);
    const name = o.querySelector('#lname'), pass = o.querySelector('#lpass');
    const enter = (acc) => { A.last = acc.id; A.keep = o.querySelector('#lkeep').checked ? acc.id : null; saveAccounts(A); this.useAccount(acc); };
    const signIn = async (acc) => {
      if (!acc.hash) return enter(acc);
      if (!pass.value) { name.value = acc.name; pass.focus(); return this.loginMsg(o, `Enter the password for ${acc.name}.`); }
      if ((await hashPassword(acc.name, pass.value)) !== acc.hash) return this.loginMsg(o, 'That password is not right.');
      enter(acc);
    };
    o.querySelectorAll('[data-acc]').forEach((b) => { b.onclick = () => signIn(A.list.find((a) => a.id === b.dataset.acc)); });
    o.querySelector('#login').onclick = () => {
      const acc = A.list.find((a) => a.name.toLowerCase() === name.value.trim().toLowerCase());
      if (!acc) return this.loginMsg(o, name.value.trim() ? 'No account by that name here. Create it?' : 'Type your account name.');
      signIn(acc);
    };
    o.querySelector('#create').onclick = async () => {
      const nm = name.value.trim();
      if (nm.length < 2) return this.loginMsg(o, 'Pick a name of at least 2 letters.');
      if (A.list.some((a) => a.name.toLowerCase() === nm.toLowerCase())) return this.loginMsg(o, 'That name is taken on this computer.');
      const acc = { id: Math.random().toString(36).slice(2, 10), name: nm, hash: await hashPassword(nm, pass.value), created: new Date().toISOString().slice(0, 10) };
      A.list.push(acc); enter(acc);
    };
    for (const el of [name, pass]) el.onkeydown = (e) => { if (e.key === 'Enter') o.querySelector('#login').click(); };
    const last = A.list.find((a) => a.id === A.last);
    (last ? o.querySelector(`[data-acc="${last.id}"]`) : name).focus();
  }
  // the front door on load: straight to the account page if you asked to stay logged in
  async start() {
    // the server keeps accounts when it is there: sign in there (back in at once if you stayed signed in). Online the
    // free server may be asleep: it takes up to a minute to wake, so wait for it (or play offline)
    const g = this.g, url = g.net && g.net.url, local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    let offline = false;
    if (url && !local && !(g.net.open && g.net.id)) {
      const o = this.overlay(`<div class="screen login"><div class="logo"><h1>MELON REALMS</h1></div><div class="card">
        <h3>Waking the server…</h3><p class="fine">The first visit in a while takes up to a minute.</p>
        <div class="row2"><button class="btn" id="offline">Play offline instead</button></div></div></div>`);
      this.splash(o);
      o.querySelector('#offline').onclick = () => { offline = true; this.loginScreen(); };
    }
    const up = await g.netWhenOpen(local ? 2500 : 75000);
    if (offline) return;
    if (up && g.netHasAccounts()) {
      const t = getSession();
      if (t) { const r = await this.g.netAuth('resume', { token: t }); if (!r.error) return this.useOnline(r); setSession(null); }
      return this.onlineScreen();
    }
    // the server didn't answer, and you play online: never slip into an offline account here (its characters are other,
    // older ones: it looked as if your levels had gone). Wait for the server, or choose offline yourself
    if (!up && !local && getSession()) return this.noServerScreen();
    const A = loadAccounts(), acc = A.keep && A.list.find((a) => a.id === A.keep);
    if (acc) this.useAccount(acc); else this.loginScreen();
  }
  // the server is asleep or restarting: try again (it keeps trying by itself too), or play offline knowing it is apart
  noServerScreen() {
    const o = this.overlay(`<div class="screen login"><div class="logo"><h1>MELON REALMS</h1></div><div class="card">
      <h3>The server isn't answering yet</h3><p class="fine">It may be waking up or restarting. Your characters are kept there: wait a moment and try again.</p>
      <div class="row2"><button class="btn primary" id="retry">Try again</button><button class="btn" id="offline">Play offline (separate characters)</button></div></div></div>`);
    this.splash(o);
    o.querySelector('#retry').onclick = () => this.start();
    o.querySelector('#offline').onclick = () => this.loginScreen();
  }
  loginMsg(o, t) { const m = o.querySelector('.msg'); if (m) m.textContent = t; }
  useAccount(acc) {
    const g = this.g;
    g.account = acc; g.saveKey = saveKeyFor(acc.id);
    g.save = loadSave(g.saveKey);
    this.accountScreen();
  }
  accountScreen(msg = '') {
    const g = this.g, s = g.save, acc = g.account || { name: 'Adventurer' };
    const deaths = s.graveyard.length, best = s.graveyard.reduce((m, d) => Math.max(m, d.fame || 0), 0);
    const goals = Object.keys(CLASSES).map((c) => {
      const f = (s.classFame || {})[c] || 0, stars = FAME_GOALS.filter((x) => f >= x).length;
      return `<div class="cf"><canvas width="40" height="40" data-c="${c}"></canvas><b>${CLASSES[c].name}</b><span class="stars">${'★'.repeat(stars)}<i>${'★'.repeat(5 - stars)}</i></span></div>`;
    }).join('');
    const o = this.overlay(`<div class="screen account"><div class="logo small"><h1>MELON REALMS</h1></div>
      <div class="card wide">
        <div class="acchead"><div><small>Signed in as${acc.online ? ` · online${acc.admin ? ' · <b class="admintag">admin</b>' : ''}` : ' · offline (this browser only)'}</small><h2>${acc.name}</h2></div><button class="btn" id="logout">Switch account</button></div>
        <div class="tiles">
          <div class="tile f"><small>Account fame</small><b>✦ ${s.fame}</b></div>
          <div class="tile g"><small>Gold</small><b>● ${s.gold || 0}</b></div>
          <div class="tile e"><small>Essence</small><b>◆ ${s.essence || 0}</b></div>
          <div class="tile"><small>Best level</small><b>${s.bestLevel || 0}</b></div>
          <div class="tile"><small>Characters</small><b>${s.chars.length} / ${s.slots}</b></div>
          <div class="tile"><small>Fallen heroes</small><b>${deaths}</b></div>
          <div class="tile"><small>Best death</small><b>✦ ${best}</b></div>
          <div class="tile"><small>Trophies</small><b>${(s.trophies || []).length}</b></div>
        </div>
        <h3>Class stars <small class="mut">(fame goals ${FAME_GOALS.join(' · ')})</small></h3><div class="classfame">${goals}</div>
        <div class="row2"><button class="btn primary big" id="tochars">Play</button><button class="btn" id="asett">Settings</button></div>
        <p class="msg">${msg}</p>
      </div></div>`);
    this.splash(o);
    o.querySelector('#tochars').onclick = () => this.titleScreen();
    o.querySelector('#asett').onclick = () => this.toggleSettings();
    o.querySelector('#logout').onclick = () => this.signOut();
    this.animateCanvases(o, () => 'front_idle', 40);
    o.querySelector('#tochars').focus();
  }
  titleScreen(msg = '') {
    const g = this.g, s = g.save;
    const cards = [];
    for (let k = 0; k < 8; k++) {
      const c = s.chars[k];
      if (c) {
        const C = CLASSES[c.cls];
        const gear = c.equip.map((id) => (id ? `<span class="gi" style="background-image:url(${this.r.icon(id)});--rc:${rarityColor(ITEMS[id])}"></span>` : '<span class="gi"></span>')).join('');
        cards.push(`<div class="char" data-k="${k}"><canvas width="64" height="64" data-c="${c.cls}"></canvas>
          <div class="ci"><b>${C.name}</b><small>Level ${c.level}${c.level >= MAX_LEVEL ? ` · <span class="fame">${c.fame || 0} fame</span>` : ''} · ${c.kills || 0} kills</small><div class="gear">${gear}</div></div>
          <div class="ca"><button class="btn play" data-play="${k}">Play</button><button class="btn sm del" data-del="${k}">Retire</button></div></div>`);
      } else if (k < s.slots) {
        cards.push(`<button class="char empty" data-new="${k}"><span class="plus">+</span><b>New character</b><small>Choose a class</small></button>`);
      } else if (k === s.slots) {
        cards.push(`<button class="char locked" id="unlock"><span class="plus">🔒</span><b>Unlock a slot</b><small>${slotPrice(s.slots).toLocaleString()} gold</small></button>`);
      }
    }
    const grave = s.graveyard.length ? s.graveyard.slice(0, 12).map((d) => `<div>${d.date} · <b>${CLASSES[d.cls].name}</b> Lv ${d.level} · killed by ${d.by} · <span class="fame">+${d.fame}</span></div>`).join('') : '<div class="mut">No one has died yet.</div>';
    const o = this.overlay(`<div class="screen home"><button class="btn back" id="toacct">← ${(g.account && g.account.name) || 'Account'}</button>
      <h1>MELON REALMS</h1>
      <div class="acct"><span class="h-fame">✦ ${s.fame} fame</span><span class="h-gold">● ${s.gold || 0} gold</span><span class="h-ess">◆ ${s.essence || 0} essence</span><span>Best: level ${s.bestLevel || 0}</span></div>
      <div class="homecols">
        <section><h3>Your characters <small class="mut">(${s.chars.length}/${s.slots})</small></h3><div class="chars">${cards.join('')}</div><p class="msg">${msg}</p></section>
        <section class="gy"><h3>Graveyard</h3>${grave}<div class="homebtns"><button class="btn" id="sett">Settings</button></div></section>
      </div></div>`);
    o.querySelectorAll('[data-play]').forEach((b) => { b.onclick = () => { this.closeOverlay(); g.startPlaying(+b.dataset.play); }; });
    o.querySelectorAll('[data-new]').forEach((b) => { b.onclick = () => this.classScreen(); });
    o.querySelectorAll('[data-del]').forEach((b) => {
      b.onclick = () => {
        if (b.dataset.armed) { g.deleteCharacter(+b.dataset.del); this.titleScreen('Character retired.'); return; }
        b.dataset.armed = '1'; b.textContent = 'Sure?'; b.classList.add('warn');
      };
    });
    const un = o.querySelector('#unlock');
    if (un) un.onclick = () => this.titleScreen(g.unlockSlot());
    o.querySelector('#sett').onclick = () => this.toggleSettings();
    o.querySelector('#toacct').onclick = () => this.accountScreen();
    this.settingsOpen = false;
    this.splash(o);
    this.animateCanvases(o, (C, t) => ['front_idle', 'front_walk'][Math.floor(t / 3) % 2], 64);
    (o.querySelector('[data-play]') || o.querySelector('[data-new]') || o.querySelector('#sett')).focus();
  }
  animateCanvases(o, pick, size) {
    const cvs = [...o.querySelectorAll('canvas[data-c]')];
    if (!cvs.length) return;
    const t0 = performance.now();
    const loop = () => {
      if ($('overlay').classList.contains('hidden') || !cvs[0].isConnected) return;
      const t = (performance.now() - t0) / 1000;
      for (const cv of cvs) {
        const C = CLASSES[cv.dataset.c], S = this.r.A.sheets[C.sheet], A = S.guide.animations;
        const a = A[pick(C, t)], f = Math.floor(t * a.fps) % a.frames;
        const x = cv.getContext('2d');
        x.imageSmoothingEnabled = false; x.clearRect(0, 0, size, size);
        x.drawImage(S.img, (a.col + f) * 16, a.row * 16, 16, 16, 0, 0, size, size);
      }
      requestAnimationFrame(loop);
    };
    loop();
  }
  classScreen() {
    const ids = Object.keys(CLASSES);
    const o = this.overlay(`<div class="screen"><h1>Choose a class</h1><h2>Death is permanent. Your vault and fame are not.</h2>
      <div class="classes pick">${ids.map((id) => `<button class="cls" data-id="${id}"><canvas width="96" height="96" data-c="${id}"></canvas>
        <h3>${CLASSES[id].name}</h3><div class="t">${CLASSES[id].design}</div></button>`).join('')}</div>
      <div class="clsinfo"><h3></h3><p></p></div>
      <button class="btn" id="back">Back</button></div>`);
    // one card per class, small enough that all of them fit on one screen; the one you point at is described below
    // (the cards used to carry their whole description and ran off the screen: 2026-10-22)
    const info = o.querySelector('.clsinfo'), show = (id) => { info.querySelector('h3').textContent = `${CLASSES[id].name} · ${CLASSES[id].design}`; info.querySelector('p').textContent = CLASSES[id].blurb; };
    show(ids[0]);
    o.querySelectorAll('.cls').forEach((b) => { b.onmouseenter = () => show(b.dataset.id); b.onfocus = () => show(b.dataset.id); });
    o.querySelectorAll('.cls').forEach((b) => { b.onclick = () => { this.closeOverlay(); if (!this.g.newCharacter(b.dataset.id)) this.titleScreen('All slots are full.'); }; });
    o.querySelector('#back').onclick = () => this.titleScreen();
    // animated previews: cycle walk -> attack -> ability
    const cvs = [...o.querySelectorAll('canvas')];
    const t0 = performance.now();
    const loop = () => {
      if ($('overlay').classList.contains('hidden') || !cvs[0].isConnected) return;
      const t = (performance.now() - t0) / 1000;
      for (const cv of cvs) {
        const C = CLASSES[cv.dataset.c], S = this.r.A.sheets[C.sheet], A = S.guide.animations;
        const phase = Math.floor(t / 2.4) % 3;
        const name = ['front_walk', C.anim.attack.front, 'ability'][phase];
        const a = A[name], f = Math.floor(t * a.fps) % a.frames;
        const x = cv.getContext('2d');
        x.imageSmoothingEnabled = false; x.clearRect(0, 0, 96, 96);
        x.drawImage(S.img, (a.col + f) * 16, a.row * 16, 16, 16, 8, 0, 80, 80);
      }
      requestAnimationFrame(loop);
    };
    loop();
    o.querySelector('.cls').focus();
  }
  // the death screen, RotMG's way: a gravestone with the hero standing before it, who killed them, the gear they died
  // in, the fame they earned (and why), and the record of their life
  deathScreen() {
    const d = this.g.deathInfo, g = this.g, C = CLASSES[d.cls];
    const acc = d.shots ? Math.min(100, Math.round((d.hits / d.shots) * 100)) : 0;
    const stat = (k, v) => `<div class="fr"><span>${k}</span><b>${v}</b></div>`;
    const gear = (d.equip || []).map((id) => `<div class="dslot">${id ? `<div class="ico" style="background-image:url(${this.r.icon(id)})"></div>` : ''}</div>`).join('');
    const o = this.overlay(`<div class="screen deathscr"><h1 style="color:#e2546a">${d.name || C.name} has died</h1>
      <h2>${C.name}, level ${d.level} · killed by ${d.by}</h2>
      <div class="dcols">
        <div class="dleft"><canvas id="dgrave" width="160" height="150"></canvas><div class="dgear">${gear}</div></div>
        <div class="dright">
          <div class="famebox">${d.level < MAX_LEVEL && !d.base ? '<p class="mut">Characters earn fame once they reach level 20.</p>' : ''}
            <div class="fr"><span>Base fame</span><b>${d.base || 0}</b></div>
            ${(d.bonuses || []).map(([n, v]) => `<div class="fr"><span>${n}</span><b>+${v}</b></div>`).join('')}
            <div class="fr tot"><span>Total fame</span><b class="fame">+${d.fame}</b></div></div>
          <div class="famebox dstats">
            ${stat('Monsters killed', d.kills || 0)}${stat('Bosses killed', d.bossKills || 0)}${stat('Dungeons completed', d.dungeons || 0)}
            ${stat('Shots fired', d.shots || 0)}${stat('Accuracy', acc + '%')}${stat('Damage taken', d.dmgTaken || 0)}
            ${stat('Stats maxed', `${d.maxed}/8`)}${stat('Experience', d.xp || 0)}${stat('Minutes active', d.mins || 0)}</div>
          ${(d.lastHits || []).length ? `<div class="famebox drecap"><div class="fr tot"><span>Your last seconds</span><b></b></div>${d.lastHits.map(([by, dm, ago]) => `<div class="fr"><span>${String(by).replace(/[&<]/g, '')}</span><b class="bad">-${dm}</b></div>`).join('')}</div>` : ''}
        </div>
      </div>
      <p>Account fame: <span class="fame">${g.save.fame}</span></p>
      <button class="btn" id="again">Continue</button><button class="btn" id="same">Play again as a ${C.name}</button></div>`);
    this.drawGraveCard(o.querySelector('#dgrave'), d);
    o.querySelector('#again').onclick = () => { g.leaveToMenu(); this.titleScreen(); };
    o.querySelector('#same').onclick = () => {                          // straight back in: a new hero of the same class
      g.leaveToMenu(); g.newCharacter(d.cls); g.startPlaying(g.save.chars.length - 1); this.closeOverlay();
    };
    o.querySelector('#again').focus();
  }
  // the gravestone on the death screen, the hero's sprite before it (the art at 4x, outlined, as everywhere)
  drawGraveCard(cv, d) {
    if (!cv) return;
    const x = cv.getContext('2d'), P = 5, o = '#05040a', st = '#8d88a0', hi = '#c8c0d8', lo = '#5a5468';
    x.imageSmoothingEnabled = false;
    const R = (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a * P, b * P, w * P, h * P); };
    // the stone: 16 x 22 pixels, rounded top, a cross cut in, on a plinth
    R(o, 7, 1, 18, 2); R(o, 6, 3, 20, 20); R(st, 7, 2, 16, 20); R(st, 8, 1, 14, 2); R(hi, 7, 3, 2, 18); R(lo, 21, 4, 1, 17);
    R(o, 14, 6, 2, 9); R(o, 11, 9, 8, 2);
    R(o, 3, 22, 26, 5); R(lo, 4, 23, 24, 3);
    const S = this.r.A.sheets[CLASSES[d.cls].sheet], A = S && S.guide.animations.front_idle;
    if (S && A) { const F = S.guide.frameWidth, fr = outlinedFrame(S.img, A.col * F, A.row * F, F, F, 3); x.drawImage(fr, Math.round(cv.width / 2 - fr.width / 2) + 34, cv.height - fr.height - 4); }
  }
}
