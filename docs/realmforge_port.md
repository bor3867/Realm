# Realmforge port

The user designed and built **Realmforge** (realmforge-project/, untracked: the user's own project) and asked for all of
it in the game: its 24 dungeons, 24 bosses, items, dungeon tiles, enemies, portals, shot sprites and effects. Testing
pieces stay out (the temp player sprite, its test hooks, its Playwright tools).

## Decisions (user, 2026-10-19)
- **Tiered items: replace ours with Realmforge's ladders.** 14 tiers (T0 Copper ... T13) for the five weapons and three
  armours (their `light` = our `leather`), 4 ring tiers for each of the eight stats. Item ids keep our scheme
  (`sword_t0` ... `sword_t13`, `heavy_t0` ..., `ring_att_t0` ...), so saves, shops, the forge and loot tables follow.
  Abilities are not in their ladders: ours stay.
- **Uniques: add all 79** (UT, Mythic, Legendary) with their sets and named effects; our existing UTs stay.
- **Dungeons: add all 24 alongside ours** (our 17 stay). Name clashes get renamed (their Sunken Chapel).
- **Portals: build the overworld foes they name** (Gravekeepers, Bog Witches, Smelter Imps, ...) and place them in the
  closest of our biomes as the portal droppers. Their art is not in the data: it is drawn new, in the game's style.

## Source
- `tools/rf_extract.py` pulls `DATA` from the built `realmforge-armory.html` into `art/rf/data.json` (re-run it when
  Realmforge changes). It holds: dungeons (portal, tiles, walls, objects, light, lore, boss room), bosses (phases,
  movement, shots, lines, drops, art), uniques, ladders, tierShots, effects, fx, and explore (per-dungeon enemies,
  squads, props, decor, names, messages, mutations).
- Layout grammar and mechanics are code, not data: `realmforge-project/realmforge/explore.js` (the shared core: tile
  codes, the generator G, validation, LIB helpers, traps, enemy AI components) and `xmods/*.js` (one module per
  dungeon: grammar, rooms, traps, secrets). These are ported, not copied.

## Size
220 dungeon creatures (moves: chase 85, kite 55, still 22, drift 15, hop 10, orbit 7, swoop 6, blink 6, burrow 5,
chess 3, leader 2, formation, patrol, mirror; attacks: contact 107, aim 41, ring 41, dash 24, fan 24, slam 22, lob 19,
trail 13, line 12, spiral 7, summon 7, pulse 5, snipe 4, heal 3, and 9 rarer). 24 bosses with ~170 named attacks and
18 movement modes. 17 layout helpers (secret 35 uses, ringAround 32, lock 26, guard 25, entry 25, bossDoor 25, falling
21, border 18, rows 15, shooters 12, satellites 12, vents 10, pillars 8, scatter 7, sectorTree 6, snare 4, seal 3).

## Phases
1. **Items.** The ladders replace our tiered weapons, armour and rings (art at 8x8 like ours, names, stats, tier
   shots); loot tables, shops, forge and starting kits move to 14 tiers; old characters' gear maps by tier. Then the
   79 uniques (art, stats, shots); each unique's named effects arrive with its dungeon.
2. **The dungeon core + the first dungeons.** Port the generator (rooms, links, shapes, validation), LIB helpers,
   tile codes (wall, floor, path, pit, secret, gate, hazard, liquid, ice, bridge, toggle, breakable, conveyor, deep),
   traps, interactions (chests, keys, plates, shrines, rest fonts, lore), lighting, and the enemy AI components, onto
   our engine (our map, objects, enemies, 2.5D walls). Per-dungeon art goes in as registry packs. Then The Sealed
   Crypt and The Undersewers end to end: layout, creatures, miniboss, boss, drops, portal, overworld droppers.
3. **Dungeons in batches** (about four per session), each with its boss, uniques' effects and overworld droppers.
4. **Review**: balance against our dungeons, a contact sheet per dungeon, the checks.

## Progress
- **Phase 1 done.** Ladders in (`tools/rf_build_items.py` -> `art/bundle/realmforge`, `src/data/rf_items_data.js`).
  The 79 uniques are items `rf_<id>` with art, shots, stats and the effects our engine already had (pierce, slow, burn,
  poison/bleed as burn, curse/mark, lifesteal, burst-split, return, helix/wave weave). Their other 95 named effects sit
  in `item.rf.pending` and are built with each dungeon; seeking effects (paper cranes, curving arrows) stay out under
  the no-seeking rule unless the user says otherwise. Uniques drop once their boss's dungeon is in.
- **Phase 2a done: the dungeons are hosted.** `tools/rf_build_explore.py` builds `src/rf/explore_gen.js` from
  Realmforge's explore.js + all xmods (checked patches only at the seams: player, auto-fire, potions/coins, chest loot,
  window). `src/rf/host.js` is the game around it: our map mirrors theirs (tile codes -> `rf_*` tiles, their walls are
  our 2.5D walls, their collision is ours), our player stands in for theirs (hurt, heal, slow, pushes), our shots hit
  their creatures, kills give XP and bags, chests give our loot. `src/rf/draw.js` draws their painted map, objects,
  props, creatures, shots, traps and telegraphs. All 24 run (admin: `/tp rf_<id>`). Not yet: their lighting, the boss
  fights (the boss door only announces the boss), the uniques' effects, portals in the realm, balance.
- **Phase 2b done: the bosses are hosted.** `tools/rf_build_bosses.py` builds `src/rf/boss_gen.js` from engine.js
  (seams: the Armory page, its test player and bot, its phase timer). `src/rf/boss.js`: a dungeon's boss door opens
  onto the boss's own room (`rf_boss:<id>`); their arena runs and draws itself into a canvas laid on our floor; our
  player walks it (their arena moves you: zero-g, frost, leashes, solids), our shots hit by their rules (snares,
  crystals, the true clone, the boss), minions can be shot (HP from their description), an invulnerable phase guarded
  by minions ends when they fall, phases turn on HP, fake deaths rise once, the death plays its lines and bursts, then
  XP, a bag (its uniques by rarity) and the exit. All 24 run through every phase to death. Not yet: balance (their
  HP is raw: 42,000 for Mortis), their arena sprites turn with the camera (drawn flat into the floor layer).
- **Phase 2c done: the portals are in the realm.** `tools/rf_build_foes.py` makes the 46 overworld foes the portals
  name (Gravekeepers, Bog Witches, ...) into realm enemies: each wears the art of the closest creature in its own
  dungeon (by name, else by role), fights like it at its land's strength, lives in the closest of our lands, and drops
  its dungeon's portal (3.5%) in Realmforge's own portal art. The realm keeps about one pack of each alive. The Rift
  opens from the Unmaker's Eye, a rare, tough, rooted sight in Godfall (always drops it).
  Lands: Haunted Hills/Midlands -> Ashfen; Lowlands/Old Quarter -> Greenmarch; Highlands/Snow Peaks/Ruins ->
  Runeholt; Forest/Forest Edge -> Thornwood; Mountains/Mountaintops/Scholars' Hills -> Crystal Steppe; Desert ->
  Saltglass Dunes; Godlands/Volcanic Wastes -> Godfall; Shoreline -> Drowned Shore.
- **Phase 4a: balance** (`src/rf/balance.js`). Each dungeon joins a band by its boss's HP (A <=45k, B <=65k, C <=75k,
  D above) measured against our dungeons at the same gear tier: creature HP/damage brought to the band (their damage
  was written for a 25-DEF test player), boss HP x1.6 / 2.2 / 2.6 / 3.1, boss damage x0.55..1.05, boss DEF capped at
  ours (18/26/32/38), loot tiers 3-6 / 5-8 / 7-9 / 8-10 (bosses one better). Fights on HP: the chrysalis is a damage
  check once a phase (break the shell or she emerges healed), hits on the true Vitrea count, an invulnerable phase
  nothing you do can end is survived (it moves on after its length), and no phase lasts past 60 s. Measured, a
  level-20 player in the band's gear, always firing: A 1.5-2.5 min, B 2.5-3.5, C 2.5-4, D 3.5-4.5 (all 24 killed).
- **Phase 4b: light and the modules' own drawing.** Their darkness (a hole at every lamp, brazier and portal) and
  coloured glow are laid over the world (glow only where you have explored); each module's drawFloor, drawTop and
  drawLight (the Sanctum's moving sunlight, the sewer tide's shimmer, lava, ink) run in a view of theirs around you;
  each module's status line ("The crypt stirs", "Water: low", "Shadow at IV") shows under the counters. The Hall of
  Mirrors' reflection needs the test player sprite, which stays out: no reflection.
- **Phase 1c: the uniques' named effects** (`src/rf/uniqmech.js`): all 79 uniques do what their lines say (the numbers
  from their own text), on our gear hooks (hurt, hit, kill, cast, volley, tick, stats, ability cost, wall bounce), and
  their tooltips list them. The three that seek (Bog Seer, Orbit Bow, Crane Bow) seek: the user allowed them.
  Every Realmforge weapon, tiered and unique, flies its own path as the Armory draws it (helix, wave, spread, numbers
  from template.html's lanes) and the uniques leave their own dust trails. Inside their dungeons our shots' on-hit effects now
  reach their creatures too (burn and venom tick, slows, curses, chains, splits, lifesteal, shoves, stops). Known gap:
  the uniques' area effects (ash clouds, rifts, trails, the jack-o'-lantern, thralls) touch our monsters, not theirs.
  `tools/check_rf_uniques.mjs`: every unique worn in a fight without an error, and a few promises measured.

## Status
| Dungeon | Boss | Layout | Creatures | Boss | Uniques | Overworld droppers | Done |
|---|---|---|---|---|---|---|---|
| crypt | mortis | | | | | | |
| sewers | gutterlord | | | | | | |
| mire | mire | | | | | | |
| forge | cinder | | | | | | |
| glade | matriarch | | | | | | |
| unmelting | rime | | | | | | |
| crater | astraeus | | | | | | |
| temple | twins | | | | | | |
| rift | unmaker | | | | | | |
| chapel | cantor | | | | | | |
| grove | elderbark | | | | | | |
| peaks | roc | | | | | | |
| pyre | ignis | | | | | | |
| cathedral | cardinal | | | | | | |
| oasis | sarrukh | | | | | | |
| clocktower | magistrate | | | | | | |
| mirrors | vitrea | | | | | | |
| monastery | ossian | | | | | | |
| sanctum | aion | | | | | | |
| atlas | vael | | | | | | |
| keep | morvane | | | | | | |
| patch | gourdrick | | | | | | |
| stage | mirabeau | | | | | | |
| paper | orrigan | | | | | | |
