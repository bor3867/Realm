# Multiplayer

The game is static files (GitHub Pages); `server/` is its multiplayer server (Render, `npm start`). Locally: run
`node server/server.mjs` (port 8787) beside the game; the game finds it on localhost by itself.

## Stage 1 (done): seeing each other
`src/net.js` sends your player's state and shots; the server passes them to everyone in the same place (the Nexus, the
shared realm) and hands out one realm seed. Others are drawn like you with name tags; chat is shared.

## Stage 2: one shared world
The RotMG split: the server owns the monsters (where they go, what they fire, their Life, when they die); each browser
owns its player (moving, dodging, being hit, its shots and abilities, its rewards).

| Milestone | What | State |
| --- | --- | --- |
| M1 | The shared realm's monsters run on the server (`server/world.mjs` runs src/game.js headless; each monster hunts its nearest player). Browsers get them as puppets, dodge their shots locally, report their blows; the server says who killed what, and each killer is rewarded by its own rules (XP, gold, loot rolled for them, quests, on-kill gear) | **done 2026-10-19** |
| M2 | Realm bosses and events in full: the three-phase bosses' art, phase and animation; event terrain and props (the Kraken's reef, the Treant's grove) sent to all, latecomers too; heralds' progress shared (the server runs them); timed states on your clock; your stuns, slows and knockback reach the server; no doubled shards | **done 2026-10-19** |
| M3 | Dungeons shared: a portal dropped in the shared realm opens one server instance (same seed for all, so every copy is identical); everyone who enters fights the same monsters and boss; gates, broken walls, levers and chests sync; things you use are used on the server too; the boss's fall gives everyone the way out (rewards to those who fought). Instances close two minutes after they empty | **done 2026-10-19** |
| M4 | Accounts and saves on the server (Supabase): sign up and sign in through the server (passwords hashed there), stay signed in, saves kept on the server and loaded on any computer; a new account brings this browser's progress for that name; admin commands for admin accounts only (on localhost always) | **done 2026-10-19** |
| M5 | What the server won't take (server/guard.mjs): saves checked before they're kept (items that don't exist, admin items on non-admins, levels and stats past their caps, gold / fame / essence growing faster than play allows: removed or clamped, and logged); damage capped per blow, per second and per ten seconds; impossible speed again and again drops the player; chat one line at a time. Admins trusted | **done 2026-10-19** |

## What still can't be proven
Each browser rolls its own loot and grants its own XP, so a determined cheater could still give themselves ordinary
items or levels at a believable pace; the server only refuses the impossible. Moving loot and XP onto the server would
close that, at the cost of a bigger rewrite.

## Accounts setup (Supabase)
Render's Environment holds `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (the secret key never goes anywhere else). The
tables, once, in Supabase's SQL Editor:

```sql
create table if not exists accounts (
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
alter table saves enable row level security;
```

Making an account an admin: `update accounts set is_admin = true where name_lower = 'yourname';`
Testing locally without Supabase: `DB=file` keeps accounts in server/.data/db.json (the first account is an admin).

## One boss engine (started 2026-10-19)
Every boss is moving onto the three-phase engine (src/bossx.js); the rf_ dungeons keep their own engine for the
exploring (rooms, puzzles, traps). The 24 Realmforge bosses are translated from their data at load time
(src/bosses/rf_translate.js; art: tools/rf_build_bx.py): each of their phases with its Life, movement and emitters.
Done: 25 of their 30 emitter kinds (aim, ring, spiral, aoe in its four shapes, minions with their own art, shot, life
span and burst, lasers, rain, walls, lines, implosions, converging, flocks, novas, beams, drops, sprays, bolas, orbits,
clouds, rifts, wildfire, hedges, warps, sequences, ahead-of-you), their movement styles, art, shots and loot. Admin:
/bx rfx_<id>. Left to their specials: chess boards, music staves, a worm's segments, beams that follow a laser.
Next: the bespoke boss mechanics (shields, clones, puzzles inside the fight ...), their arenas as our maps (shared),
the rf_ dungeons' boss doors leading to them; then the older realm and dungeon bosses moved across.
Fixed on the way: a player's blow on a shared monster now goes through the game's own damage step on the server, so a
three-phase boss's phases, morphs, immunity and survive phases happen as they should (before, only its HP fell).

## Not shared yet
- The rf_ dungeons: a shared portal puts everyone in the same layout (one seed) and they see each other, but each
  player's creatures are their own. Their engine (src/rf/explore_gen.js) was built for one hero: sharing its creatures
  means running it on the server for several heroes (a stand-in canvas there; their creature loop taking each
  creature's nearest hero; hits and hurts through HOST) and puppets in the browser, as the rest of the game does.
- Your vault.

## Known gaps after M2
- A boss's own drawn extras that live in its state (some bosses draw whirlpools, chains or rings from lists) may be
  missing; its body, phases, attacks and arena are there.
- Camp chests are each player's own; their guards are shared.
- Admin commands that make monsters (/spawn, /event, /kraken) make them on your screen only (M4: admin on the server).
- Local test server: `DEV=1` lets chat `!kraken` / `!treant` raise an event boss (never set online).
