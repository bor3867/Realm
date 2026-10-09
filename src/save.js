// Account persistence (browser localStorage). Permadeath: the character is
// erased on death; fame, gold, essence, the vault and the graveyard survive.
const KEY = 'realm.save.v1';
// Accounts live on this device: a list of names (with an optional password hash), each with its own save.
// The original save stays where it always was, as the first account.
const ACC_KEY = 'realm.accounts.v1';
export const saveKeyFor = (id) => (id === 'default' ? KEY : `${KEY}.${id}`);
export function loadAccounts() {
  let A = null;
  try { A = JSON.parse(localStorage.getItem(ACC_KEY)); } catch { /* none yet */ }
  if (!A || !Array.isArray(A.list)) {
    A = { list: [], last: null };
    let had = null;
    try { had = localStorage.getItem(KEY); } catch { /* storage blocked */ }
    if (had) { A.list.push({ id: 'default', name: 'Adventurer', hash: null, created: new Date().toISOString().slice(0, 10) }); A.last = 'default'; }
  }
  return A;
}
export function saveAccounts(A) { try { localStorage.setItem(ACC_KEY, JSON.stringify(A)); } catch { /* storage unavailable */ } }
export async function hashPassword(name, pw) {
  if (!pw) return null;
  const data = new TextEncoder().encode(`realm:${name.toLowerCase()}:${pw}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const empty8 = () => Array(8).fill(null);
const LEGACY = { gauntlet: 'sword', tongs: 'sword', sunrod: 'wand', pendulum: 'wand', lantern: 'staff', coil: 'staff', harpoon: 'bow',
  rapier: 'dagger', plate: 'heavy', coat: 'heavy', oilskin: 'leather', glassmail: 'leather', vestment: 'robe', shroud: 'robe', stormcloak: 'robe', brasscoat: 'robe' };
const migrate = (id) => {
  const m = typeof id === 'string' && /^([a-z]+)_t(\d+)(~.*)?$/.exec(id);
  return m && LEGACY[m[1]] ? `${LEGACY[m[1]]}_t${m[2]}${m[3] || ''}` : id;
};
const fresh = () => ({ fame: 0, gold: 0, essence: 0, vaults: [empty8()], graveyard: [], chars: [], slots: 4, bestLevel: 0, trophies: [], pets: [], activePet: null });

export function loadSave(key = KEY) {
  try {
    const s = JSON.parse(localStorage.getItem(key));
    if (s && typeof s === 'object') {
      const out = { ...fresh(), ...s };
      if (!Array.isArray(s.vaults)) out.vaults = [Array.isArray(s.vault) ? s.vault : empty8(), empty8(), empty8(), empty8()];   // old single chest
      delete out.vault;
      if (!Array.isArray(s.chars)) out.chars = s.char ? [{ id: 'c0', created: '', ...s.char }] : [];   // old single character
      delete out.char;
      for (const c of out.chars) { if (c.equip) c.equip = c.equip.map(migrate); if (c.inv) c.inv = c.inv.map(migrate); }
      out.vaults = out.vaults.map((v) => (Array.isArray(v) ? v.map(migrate) : v));
      // the vault is one chest now that grows: fold the old four chests into it, keeping every slot you had
      if (out.vaults.length > 1) {
        const items = out.vaults.flat().filter(Boolean), size = Math.max(8, out.vaults.reduce((n, v) => n + (Array.isArray(v) ? v.length : 0), 0));
        out.vaults = [[...items, ...Array(Math.max(0, size - items.length)).fill(null)]];
      }
      return out;
    }
  } catch { /* corrupted or blocked storage: start fresh */ }
  return fresh();
}
export function writeSave(s, key = KEY) {
  try { localStorage.setItem(key || KEY, JSON.stringify(s)); } catch { /* storage unavailable */ }
}
