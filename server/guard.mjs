// Multiplayer stage 2, milestone 5: what the server will not take from a browser. Each browser still rolls its own loot
// and grants its own XP (that keeps play quick), so the server cannot prove every item was earned; it refuses the
// impossible instead:
//   saves      items that don't exist, admin items on a non-admin, levels and stats past their caps, gold / fame /
//              essence growing faster than play allows: removed or clamped before the save is kept (the rest is kept)
//   damage     no blow over HIT_MAX; no more than DPS_1S in a second or DPS_10S in ten (a top player is well under)
//   movement   running faster than any build can (SPEED) again and again, or blinking about too often: dropped
//   chat       one line every CHAT_GAP
// Admin accounts are trusted.
globalThis.localStorage ??= { getItem: () => null, setItem() {} };
const ROOT = new URL('../', import.meta.url);
const { ITEMS } = await import(new URL('src/data/items.js', ROOT));
const { CLASSES, MAX_LEVEL } = await import(new URL('src/data/classes.js', ROOT));

export const LIMIT = { HIT_MAX: 12000, DPS_1S: 25000, DPS_10S: 150000, SPEED: 22, JUMPS_10S: 8, STRIKES: 25, CHAT_GAP: 700 };
// how fast each purse may grow: per minute since the last save kept, plus a burst (a boss's hoard, a big death's fame)
const PURSE = { gold: [15000, 60000], fame: [3000, 25000], essence: [2500, 15000] };
const PURSE_NEW = { gold: 2e6, fame: 2e6, essence: 5e5 };       // a new account's uploaded progress, at most

export const itemOk = (id, admin) => { if (id === null || id === undefined) return true; if (typeof id !== 'string' || id.length > 120) return false; try { const it = ITEMS[id]; return !!it && (admin || !(it.admin || it.adminOnly)); } catch { return false; } };   // (admin-only: the admin kit, and the Hosanna set)

// a save, made fit to keep: { save, notes } (notes: what was taken out or clamped, for the server's log)
export function checkSave(next, prev, { admin = false, minutes = 0, upload = false } = {}) {
  const notes = [];
  if (!next || typeof next !== 'object' || Array.isArray(next)) return { save: prev, notes: ['not a save'] };
  const s = JSON.parse(JSON.stringify(next));
  if (admin) return { save: s, notes };
  const fixItems = (arr, where) => {
    if (!Array.isArray(arr)) return arr;
    return arr.slice(0, 2000).map((id) => { if (itemOk(id, false)) return id; notes.push(`${where}: removed ${String(id).slice(0, 40)}`); return null; });
  };
  s.chars = Array.isArray(s.chars) ? s.chars.slice(0, 30) : [];
  for (const c of s.chars) {
    if (!c || typeof c !== 'object') continue;
    const C = CLASSES[c.cls];
    if (!C) { notes.push(`a character of no class (${c.cls})`); c.cls = 'priest'; }
    const CC = CLASSES[c.cls];
    if (!(c.level >= 1 && c.level <= MAX_LEVEL)) { notes.push(`level ${c.level}`); c.level = Math.max(1, Math.min(MAX_LEVEL, +c.level || 1)); }
    if (c.base && typeof c.base === 'object') for (const st of Object.keys(c.base)) {
      const cap = CC.max && CC.max[st];
      if (typeof cap === 'number' && !(c.base[st] <= cap)) { notes.push(`${c.cls} ${st} ${c.base[st]} > ${cap}`); c.base[st] = cap; }
    }
    c.equip = fixItems(c.equip, 'equip'); c.inv = fixItems(c.inv, 'backpack');
  }
  if (Array.isArray(s.vaults)) s.vaults = s.vaults.slice(0, 8).map((v) => fixItems(v, 'vault'));
  for (const [k, [rate, burst]] of Object.entries(PURSE)) {
    const v = +s[k] || 0;
    const cap = upload || !prev ? PURSE_NEW[k] : (+prev[k] || 0) + rate * Math.min(minutes, 180) + burst;
    if (v < 0 || v > cap) { notes.push(`${k} ${v} > ${Math.round(cap)}`); s[k] = Math.max(0, Math.min(v, Math.round(cap))); }
  }
  if (!(s.slots >= 1 && s.slots <= 24)) { notes.push(`slots ${s.slots}`); s.slots = Math.max(1, Math.min(24, +s.slots || 4)); }
  if (!(s.bestLevel >= 0 && s.bestLevel <= MAX_LEVEL)) s.bestLevel = Math.max(0, Math.min(MAX_LEVEL, +s.bestLevel || 0));
  return { save: s, notes };
}

// did this player really have this item at their last save? (a dropped item must come from somewhere)
export function hadItem(save, id) {
  if (!save || typeof id !== 'string') return false;
  const has = (arr) => Array.isArray(arr) && arr.includes(id);
  return (save.chars || []).some((c) => c && (has(c.inv) || has(c.equip))) || (save.vaults || []).some(has);
}

// a player's blows against the shared monsters: how much of this one counts (0: none)
export function allowHit(q, d) {
  if (q.admin) return d;
  const now = Date.now(), W = (q.dmgWin = (q.dmgWin || []).filter((x) => now - x[0] < 10000));
  d = Math.min(d, LIMIT.HIT_MAX);
  let s1 = 0, s10 = 0;
  for (const [t, v] of W) { s10 += v; if (now - t < 1000) s1 += v; }
  const room = Math.max(0, Math.min(LIMIT.DPS_1S - s1, LIMIT.DPS_10S - s10));
  d = Math.min(d, room);
  if (d > 0) W.push([now, d]);
  return d;
}

// a player's steps: true when this one is too much, again (the caller drops them)
export function movedTooFar(c, x, y, room) {
  if (c.account && c.account.admin) return false;
  const now = Date.now(), L = c.lastPos;
  c.lastPos = { x, y, t: now, room };
  if (!L || L.room !== room) return false;                       // (a new place: a portal)
  const dt = (now - L.t) / 1000, d = Math.hypot(x - L.x, y - L.y);
  if (dt <= 0) return false;
  c.strikes = (c.strikes || []).filter((t) => now - t < 60000);
  c.jumps = (c.jumps || []).filter((t) => now - t < 10000);
  if (d >= 25) { c.jumps.push(now); if (c.jumps.length > LIMIT.JUMPS_10S) c.strikes.push(now); }   // waypoints, dashes: now and then
  else if (d / Math.max(dt, 0.08) > LIMIT.SPEED && d > 1.5) c.strikes.push(now);
  return c.strikes.length > LIMIT.STRIKES;
}
