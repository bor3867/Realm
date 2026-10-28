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
- **Boss rooms on our engine (2026-10-21).** A dungeon's boss door now opens `rfa_<id>`: the boss's room built from its
  layout as our map, its floor painted by their room painter, and the boss translated to our engine (src/bosses/
  rf_translate.js) in it, so the server can host it and a group fights it together. `rf_boss:<id>` (their engine's
  fight) is still there for comparison.
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
- **Phase 4c: made to feel like our game** (user, 2026-10-19: "enemies too big, bosses not upright, no minimap").
  Their creatures, props and shots are rebuilt from their art without Realmforge's baked outline and drawn our way:
  8px art at the player's pixel size, bigger art at the fine size (like our detailed monsters), our 2-pixel outline,
  our health bars; their shots keep their danger-coloured rim at our width. In a boss room the boss (twin, decoys,
  clones, the thousand copies), its minions and allies turn back against the camera, and their speech and floating
  text are our bubbles, banners and numbers. The minimap takes each tile's colour from their painted map (and the
  room's art in a boss room) and marks creatures, guardians, the boss's door, unopened chests, fonts, shrines, lore,
  the keeper, portals and keys. Their maps no longer get our dungeon danger multiplier (their band sets the numbers);
  the HUD's stars are the band's.

## Phase 5: one engine (user, 2026-10-26: "everything in the game should be running on the same engine")
Everything else already is: every boss on BX (Realmforge's too, as `rfx_` in `rfa_` rooms), every realm and dungeon
monster on our monster engine, shared online by the server. What isn't: **the 24 Realmforge dungeons' creatures**, still
run by their hosted engine (`src/rf/explore_gen.js`, `src/rf/host.js`), so those dungeons can't be shared online and
their creatures follow their rules, not ours. The plan, a step a turn:
1. **Translate** (done 2026-10-26): `src/rf/creatures.js` makes each of their 195 creature kinds one of our monster
   definitions (`rf_<dungeon>_<id>`): movement to our ai, attacks to our patterns, numbers to their band.
   `node tools/rf_creatures_report.mjs [--all]`: 163 come over whole, 32 with notes (approximated movement; four
   shield/guard traits left out by the no-guarded-monsters rule; traits our engine lacks: reflect, rebirth, gaze,
   afterimage, echo, encase, chain, ghostfire, lava, cuckoo, solar, the moon/mirage/shade weaknesses).
2. **Engine** (done 2026-10-26, for every monster): `slam` (a marked slam, a ring from it), the lobbed volley (`mv.lob`,
   which we had), repeated waves (`waves`/`gap`, which we had) for their line, ground `pool`s a monster's `trail`
   leaves, `poison` and `slowHit` on a shot or a touch (`D.touch`), a charge for their dash, and `D.closeIn` (a
   touch-only chaser comes right in; ours held a tile off). `node tools/check_rf_creatures.mjs`: all 195 live, move and
   attack on our engine with no errors; 170 hurt a player near them; the rest are 2 rooted traps, 15 golden runners
   (they flee with their treasure) and 8 waiting on their missing traits. Was the plan: the new attack kinds the translation uses, for every monster (not Realmforge's alone): `lob` (a lobbed
   shot that bursts where it lands; bosses already lob), `slam` (a telegraphed slam, a ring from it), a `volley` (the
   same shot again, quickly), `trail` (a hazard left behind), `inflict` (a status on hit), a charger's own dash
   cooldown. Then the missing traits worth having, one by one.
3. **Art** (done 2026-10-26): `node tools/rf_build_creatures.mjs` -> `art/bundle/realmforge_crea/` (195 creatures, their
   85 shots from the boss shot sheets, none missing). Was the plan: `tools/rf_build_creatures.py` draws their creatures' and shots' pixel grids into our registry
   (`rf_crea/<dungeon>_<id>`, `rf_shot/<dungeon>_<shot>`), our outline and sizes.
4. **Switch** (begun 2026-10-26: 11 dungeons, 78 kinds): a creature of theirs goes over to our engine the moment it wakes
   to fight (`src/rf/host.js` rfLinkIn/rfLinkOut). Ours moves, fights, is hit and dies; theirs stays in their list,
   unstepped (the one seam: `e.ours`, tools/rf_build_explore.py), so their room-clears, locks, guards, keys, corpses and
   splits still count it. Ours -> theirs before their frame (place, health; our kill is their kill, its experience
   paid once, by ours); theirs -> ours after it (a push, a trap's hurt, a portal). Dormant and buried ones wake on their
   engine as before. Which go over: a kind that came over whole (no notes), in a dungeon with no module rule of its own
   about creatures (`CREATURE_HOOKS`): crypt, mire, crater, chapel, peaks, cathedral, oasis, monastery, atlas, patch,
   paper. `node tools/check_rf_link.mjs [dungeon ...]`: a bot clears each; every creature of ours dies in their dungeon
   too, none is left half-dead (it also counts raises, chain hits and pulses). Traits built in ours since: their pulse
   (pushes you away; it had come over as a ring of shots), raise (their fallen, in the raiser's room), the lightning
   chain between kin, leader and formation; gaze stays their Cathedral's own rule (it runs for ours too, and its
   brand now counts our blows: rfHurtK). All 88 kinds of the 11 dungeons are ours; 172 of 195 come over whole.
   Then 4 more whose rules were rebuilt (`HOOKS_OURS`): the Forge's smith works faster at its anvil, the Keep's bishop
   shoots only the diagonals, the Rift's rules touch only its echoes (still theirs), the Hall of Mirrors turns a
   monster's shot back once off a mirror. 15 dungeons now.
   Exact (2026-10-27): every attack and movement now as their explore.js has it (src/rf/creatures.js and
   Game.rfMoveStep): their damage, shot lives, cooldowns and speeds; lob a marked circle, wave a slowing ring, fan a
   sweep, rings turning/aimed/random with gaps, curves, bounces, slams that hold, overheat, dashes and their trails,
   summons into their rooms, mends, trails that slow or root, strikes on the beat, sickness (no regeneration).
   Sewers and Clocktower switched too (KEEP_THEIRS: the lurker, the windup and the cuckoo, which their own rules move,
   stay theirs). 17 dungeons.
   The Glade (2026-10-27): moon-spirits take 1.6x a blow in a moonbeam and 0.12x out of it, and are faint out of it
   (Game.rfMoonK); a monster's shot crossing still water sends its reflection back once. 18 dungeons.
   The Temple: sun things take 1.3x a blow by day and 0.12x by night (moon things the other way), faint when off;
   its idol 1.5x just after day and night turn, 0.08x otherwise (Game.rfVulnK); the priest's eclipse shield on others
   stays out by our rule. 19 dungeons.
   The Grove: a guardian keeps within 7 tiles of its post (their 'guard' is a leash, not a guard over others), no
   creature by its room's runes is hurt, wrath (1.15x a blow, quicker, sooner) shows; the blight, marching on the
   sapling, stays theirs. 20 dungeons. (The link check's bot now ascends: the deep bands are tough.)
   The Pyre: a brute's cooled armour takes 0.25x a blow but for a moment after it strikes; a phoenixling's ember (and
   its rebirth) by their kill rule, which runs for ours; the eel, swimming its lava, stays theirs. 21 dungeons.
   The last three (2026-10-27): the Unmelting (a monster's shot through a crystal splits in two; its encase, an ice
   shell on an ally, is a guard our rule leaves out), the Sanctum (a shade takes 2x in the sun and 0.4x in shadow, a
   sun-disc sleeps and is faint in shadow: their sunShadow, exposed by one builder seam), the Stage (blows tell 1.6x
   while you stand in the spotlight). Reflect built (a reflector turns your shot back at you unless it has just
   struck): the crystals, diamonds and the glass golem are ours. All 24 dungeons; 182 of 195 kinds whole.
   Still theirs: kinds a dungeon's own rule moves (KEEP_THEIRS: lurker, windup, cuckoo, blight, eel), and the traits
   left to build: echo, afterimage, ghostfire, chess, mirror.
   Their layout, props, traps and puzzles stay hosted until step 5.
5. **Online**: the server hosts rf_ dungeons like ours (their layout from its seed), so a group shares one.
Check each step with the dungeon checks and `tools/check_enemy_hits.mjs` on the new monsters.

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
