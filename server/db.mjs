// Accounts, sessions and saves (multiplayer stage 2, milestone 4). Online they live in Supabase (its REST API, with the
// project's secret key from the environment: SUPABASE_URL, SUPABASE_SECRET_KEY; the key never leaves the server). With
// no key (local testing), in a file: server/.data/db.json. Passwords are hashed here (scrypt, a salt each).
//   makeDb() -> { kind, signup, login, resume, logout, loadSave, writeSave } | null
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SESSION_DAYS = 30;
export const hashPass = (pw) => { const salt = randomBytes(16).toString('hex'); return `scrypt$${salt}$${scryptSync(pw, salt, 32).toString('hex')}`; };
export function checkPass(pw, stored) {
  const [k, salt, h] = String(stored || '').split('$');
  if (k !== 'scrypt' || !salt || !h) return false;
  const a = Buffer.from(h, 'hex'), b = scryptSync(pw, salt, 32);
  return a.length === b.length && timingSafeEqual(a, b);
}
const token = () => randomBytes(32).toString('base64url');
const expires = () => new Date(Date.now() + SESSION_DAYS * 864e5).toISOString();

// ---- Supabase (PostgREST)
function supabase(url, key) {
  const H = { apikey: key, 'content-type': 'application/json' };
  if (key.startsWith('eyJ')) H.authorization = `Bearer ${key}`;          // (a legacy service_role key is a JWT)
  const api = async (method, path, body, prefer) => {
    const r = await fetch(`${url}/rest/v1/${path}`, { method, headers: { ...H, ...(prefer ? { prefer } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const text = await r.text();
    if (!r.ok) { const e = new Error(`supabase ${method} ${path.split('?')[0]}: ${r.status} ${text.slice(0, 200)}`); e.status = r.status; throw e; }
    return text ? JSON.parse(text) : null;
  };
  return {
    async accountByName(nl) { return (await api('GET', `accounts?name_lower=eq.${encodeURIComponent(nl)}&select=id,name,pass_hash,is_admin`))[0] || null; },
    async accountById(id) { return (await api('GET', `accounts?id=eq.${id}&select=id,name,is_admin`))[0] || null; },
    async addAccount(a) { return (await api('POST', 'accounts', a, 'return=representation'))[0]; },
    async addSession(s) { await api('POST', 'sessions', s); },
    async session(t) { return (await api('GET', `sessions?token=eq.${encodeURIComponent(t)}&select=account_id,expires_at`))[0] || null; },
    async dropSession(t) { await api('DELETE', `sessions?token=eq.${encodeURIComponent(t)}`); },
    async save(id) { const r = await api('GET', `saves?account_id=eq.${id}&select=data`); return r[0] ? r[0].data : null; },
    async putSave(id, data) { await api('POST', 'saves', { account_id: id, data, updated_at: new Date().toISOString() }, 'resolution=merge-duplicates'); },
    async graveyards() { return (await api('GET', 'saves?select=g:data->graveyard')).map((r) => r.g); },   // (every account's fallen, nothing else of its save)
  };
}

// ---- a file, for testing on this computer
function fileStore() {
  const dir = new URL('./.data/', import.meta.url), file = new URL('db.json', dir);
  let D = { next: 1, accounts: [], sessions: [], saves: {} };
  try { D = JSON.parse(readFileSync(file, 'utf8')); } catch { /* new */ }
  const flush = () => { mkdirSync(dir, { recursive: true }); writeFileSync(file, JSON.stringify(D)); };
  return {
    async accountByName(nl) { return D.accounts.find((a) => a.name_lower === nl) || null; },
    async accountById(id) { return D.accounts.find((a) => a.id === id) || null; },
    async addAccount(a) { if (D.accounts.some((x) => x.name_lower === a.name_lower)) { const e = new Error('taken'); e.status = 409; throw e; } const r = { id: D.next++, is_admin: D.accounts.length === 0, ...a }; D.accounts.push(r); flush(); return r; },
    async addSession(s) { D.sessions.push(s); flush(); },
    async session(t) { return D.sessions.find((s) => s.token === t) || null; },
    async dropSession(t) { D.sessions = D.sessions.filter((s) => s.token !== t); flush(); },
    async save(id) { return D.saves[id] || null; },
    async putSave(id, data) { D.saves[id] = data; flush(); },
    async graveyards() { return Object.values(D.saves).map((d) => d && d.graveyard); },
  };
}

export function makeDb() {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  const S = url && key ? supabase(url.replace(/\/+$/, ''), key) : process.env.DB === 'file' ? fileStore() : null;
  if (!S) return null;
  const who = (a) => ({ id: a.id, name: a.name, admin: !!a.is_admin });
  const open = async (a) => { const t = token(); await S.addSession({ token: t, account_id: a.id, expires_at: expires() }); return { token: t, account: who(a), save: await S.save(a.id) }; };
  return {
    kind: url && key ? 'supabase' : 'file',
    // a new account: its name free (any case), a password of 4 or more
    async signup(name, pw) {
      if (!/^[A-Za-z0-9 _-]{2,16}$/.test(name)) return { error: 'Names are 2 to 16 letters, numbers, spaces, - or _.' };
      if (typeof pw !== 'string' || pw.length < 4) return { error: 'Pick a password of at least 4 characters.' };
      try { const a = await S.addAccount({ name, name_lower: name.toLowerCase(), pass_hash: hashPass(pw) }); return { ...(await open(a)), created: true }; }
      catch (e) { if (e.status === 409) return { error: 'That name is taken.' }; throw e; }
    },
    async login(name, pw) {
      const a = await S.accountByName(String(name).toLowerCase());
      if (!a || !checkPass(String(pw), a.pass_hash)) return { error: 'That name and password do not match.' };
      return open(a);
    },
    // back with a token from before (kept logged in)
    async resume(t) {
      const s = await S.session(String(t));
      if (!s || new Date(s.expires_at) < new Date()) return { error: 'Please sign in again.' };
      const a = await S.accountById(s.account_id);
      if (!a) return { error: 'Please sign in again.' };
      return { token: t, account: who(a), save: await S.save(a.id) };
    },
    async logout(t) { await S.dropSession(String(t)); },
    async writeSave(id, data) { await S.putSave(id, data); },
    // the Hall of Legends across the game: the 50 greatest fallen characters of every account (from the graveyards in
    // their saves: no table of its own), the greatest first; worked out at most every two minutes
    async legends() {
      if (LEG && Date.now() - LEG.at < 120000) return LEG.list;
      const all = [];
      for (const G of await S.graveyards()) if (Array.isArray(G)) for (const d of G) if (d && typeof d === 'object' && (d.fame || 0) > 0) all.push(d);
      const K = ['name', 'cls', 'level', 'fame', 'by', 'date', 'kills', 'bossKills', 'dungeons', 'shots', 'hits', 'dmgDealt', 'dmgTaken', 'potions', 'abilities', 'chests', 'secrets', 'lore', 'quests', 'mins', 'xp', 'maxed', 'equip'];
      const list = all.sort((a, b) => (b.fame || 0) - (a.fame || 0)).slice(0, 50).map((d) => Object.fromEntries(K.filter((k) => d[k] !== undefined).map((k) => [k, d[k]])));
      LEG = { at: Date.now(), list };
      return list;
    },
  };
}
let LEG = null;

// the tables, for Supabase's SQL editor (docs/multiplayer.md has the same)
export const SQL = `create table if not exists accounts (
  id bigint generated always as identity primary key,
  name text not null,
  name_lower text not null unique,
  pass_hash text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists sessions (
  token text primary key,
  account_id bigint not null references accounts(id) on delete cascade,
  expires_at timestamptz not null
);
create table if not exists saves (
  account_id bigint primary key references accounts(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table accounts enable row level security;
alter table sessions enable row level security;
alter table saves enable row level security;`;
