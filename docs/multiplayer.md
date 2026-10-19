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
| M4 | Accounts and saves on the server (a database), so progress follows you between devices and saves can't be edited; admin commands for admins only | |
| M5 | Validation (speed, damage, rate of fire) so cheating is hard | |

## Not shared yet
- The Drowned Forge (its boss is of an older kind) and the rf_ dungeons (their own engine) stay each player's own.
- Dungeons opened from a key in the Nexus are your own (only portals dropped in the shared realm are shared).
- Dungeon systems that make ground zones on their own (some traps) can show twice.

## Known gaps after M2
- A boss's own drawn extras that live in its state (some bosses draw whirlpools, chains or rings from lists) may be
  missing; its body, phases, attacks and arena are there.
- Camp chests are each player's own; their guards are shared.
- Admin commands that make monsters (/spawn, /event, /kraken) make them on your screen only (M4: admin on the server).
- Local test server: `DEV=1` lets chat `!kraken` / `!treant` raise an event boss (never set online).
