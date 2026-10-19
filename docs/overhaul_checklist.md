# Game overhaul checklist

Progress on the optimisation, polish and bug-fixing pass. Every item is either fixed and verified (with how), still to
do, or found working (with the test that showed it). The Grand Orrery is out of scope by request.

Baseline: commit a0e0b20, all 22 `tools/check_*.mjs` passing.

## Fixed and verified
| Area | Problem | Root cause | Fix | Verified by |
|---|---|---|---|---|
| NPCs / pets | Pressing the talk key at the Petkeeper did nothing | The key went through `ui.enterNear()`, which opened shop/forge/board itself and passed everything else to `g.interact()`, which had no case for `petyard` (only the on-screen button knew it) | One route: `g.interact()` handles the four menus (an `npc` event the UI opens); the key and the button both use it | Test tab: F at the Petkeeper, shop, forge, board each opens its menu; `tools/check_interactions.mjs` (fails on the old code) |
| Loot | Realm loot bags could last for ever | Bags counted down only while you were on their map; the realm map is kept while you are in a dungeon or the Nexus, so its bags froze | Bags expire on the game clock (`until`), which runs on every map; expired bags are dropped on map entry too | `tools/check_loot.mjs` (fails on the old code) |
| Art | The treasure chest looked like a hamburger (rounded bun lid, a yellow "cheese" band, no outline or planks) | Placeholder-quality art | Redrawn closed and open: outlined plank chest, metal straps, lock plate with keyhole; the open one shows coins (`tools/art_chest.mjs`) | 8x crops; only the two chest cells of the atlas changed |
| Art | Every player shot was resampled (drawn at 0.875x, "big" ones 1.3x), cycled two frames, and left trail pixels | Renderer | Player shots drawn 1:1, one still frame, no trail (docs/projectile_art_standard.md) | Test tab; hitbox check |
| Art | 294 of the 322 kinds of shot enemies and bosses fire were drawn at a fraction of their art (0.5x to 1.9x), so their pixels came out uneven | Each shot was resized to fit its attack's size | Enemy shots snap to a whole scale (1 or 2 screen pixels per art pixel); the hit shape follows, so they still hit where they show. Seven enemies whose shots grew most were re-tuned (fewer shots per ring, a slower ring or a longer cooldown) back to within about 20% of the hits a strafing player took before | tools/audit_enemy_shots.mjs (0 uneven); hits for a strafing player, before and after, 8 seeds each |

| Art | Wand shots were chunky diagonal slabs (12-16 px long, 4-5 px thick), heavier than sword cuts; bigger still once player shots stopped being shrunk | Old art | All 11 tiered wand bolts redrawn: a 10 px spark, diamond head with a 2 px bright core and a short tail, each tier in its own four main colours (`tools/art_wand_shots.mjs`; the old ones kept in art/world/_old_wand_bolts.png). Range and hitbox unchanged: a player shot hits by the item's `size`, not its art; no enemy uses these sprites | 8x crops; `audit_shots` passes all 11; only the 22 wand cells changed; hitbox check |
| Art | The hay bale (Nexus, pet pen) looked like a hamburger; the vault strongbox had no outline and flat colours | Placeholder-quality art | Hay bale: an outlined bale of straw with two twine bands. Vault chest: an iron-bound, riveted strongbox with a heavy lock, clearly not the loot chest (`tools/art_objects.mjs`, which also holds the chest) | 8x crops; only the two cells changed; the rest of the objects atlas reviewed at 4x and found consistent |
| Realm | Starting an altar trial in the dunes, thornwood, steppe or lowlands crashed the game (a TypeError in the update loop: the game froze) | Altars stand in all 8 biomes, but the trials' monster pools (`QUEST_HUNTS`) covered only the first 4 | Pools added for the 4 newer lands, from their own ordinary monsters (hunt quests, wells and dig spots only use the first 4, so they are unchanged) | `tools/check_dungeon_objects.mjs` (crashed on the old code) |
| Performance | Drawing a frame took 14 ms in the Nexus (most of a 60 fps frame) and 8 ms in the realm; the ground alone was 12 ms / 3 ms | `drawGround` redrew every ground tile (about 3,700, plus biome-edge blends, plus a 25-cell fog scan per tile) every frame | The ground and its fog are drawn in cached 8x8-tile chunks, redrawn only when their tiles, skins, explored state or (for moving tiles) animation frame change; the fog stays over the ground light | Pixel-identical to the old renderer (0 differing bytes) in the Nexus, the realm (animated shore included) and 4 dungeons; whole draw now 1.9 ms (Nexus) and 2.8 ms (realm) |
| Performance | A 160 ms stall the first time the realm is drawn | The minimap parsed a colour string three times per tile (1.6 million tiles) and cleared its fog one call per explored tile | Colours parsed once each; both pictures written straight into pixel arrays | Identical minimap (0 differing bytes); rebuild 162 ms to 41 ms |
| Enemies | Monsters with a wall between them and you pressed into the wall (a quarter of chases round a wall never got there), and monsters in range fired aimed shots into the wall instead of coming round | Every walker aimed straight at your spot; attacks needed only range, not a clear line | A shared flow field (walking distance from your tile, out to 40 steps, rebuilt when you change tile, the void excluded); a monster that cannot see you follows it, heading for the furthest point down the path it can see (smooth corners); kiters too, until they have a clear shot. Aimed attacks (aimed, shotgun, wall, beam, burst, cage) wait for a clear line; mortars lob over; rings from the monster's own body still fire | `tools/check_navigation.mjs`: chases round a wall in 14 dungeons, 75% reached you before; now 104 of 104 (also with you moving) |
| Enemies | Skitterers (Candle Mite, Slag Imp, Tomb Scarab) bobbed in and out 1-1.6 times a second | Every dart had a fixed length, so near its spot it overshot and darted back | A dart never goes past its spot; once there it darts sideways (it skitters round you) | `audit_movement`: in/out down to 0.33 a second |
| Enemies | The abyss hound's and comet hound's dashes (about 17 tiles a second) showed no path, unlike the gryphon's dive; the abyss hound also chose a new direction when it fired, not the one it had wound up toward | The path line was drawn for dives only; the dash aimed afresh | Every dash shows a flashing path line through its wind-up (where the direction is chosen then) and its last crouch, gone once it moves; the abyss hound dashes along the line it showed | Browser test: line drawn through wind-up and crouch, not during the dash; `check_elites`, `check_astral` |
| Enemies | Every monster started, stopped and turned identically (velocity eased at 8 a second for all) | One steering rate for everything | Weight classes (`WEIGHT`/`weightOf` in src/game.js), read from what a monster is unless its data names one: heavy 2.6 (armoured and stone things, big walkers: 41 types), agile 11 (hounds, wolves, boars, rams, bats, bees, harpies, the gryphon, fast monsters: 47), glide 1.8 (jellies, wraiths, wisps, ghouls, floaters: 24), normal 8 (the rest, big casters and flyers included: 77). Top speeds unchanged; hoppers, skitterers, zigzaggers and dives keep their own movement | Measured: a heavy Crag Ogre takes 0.87 s to reach 90% of its speed and 0.53 s to reverse; an agile Bramble Wolf 0.15 s and 0.12 s. Navigation still 104/104 (standing and moving); `audit_movement` shows no new jitter (the Quartz Jackal's flank wobble is 0.83 a second, just over the 0.8 mark) |
| Enemies | A pack closed in from one side, all from where it started (the widest gap between melee monsters round you: 196-284 degrees) | Chasers aimed straight at you; flankers picked a side at random | A local spacing rule (`packSpread` in src/game.js): each monster's bearing from you is pushed away from its allies' (every ally near you pushes, the nearer the harder, so only an even ring is at rest; rechecked every 0.3 s). Chasers arc toward their side and take their place in the ring; flankers take the side away from their allies and are spaced too | `tools/audit_groups.mjs`: orcs 284 to 139 degrees, undead 272 to 167; ranged monsters stay behind the melee 100% of the time and nothing overlaps (as before); navigation still 104/104. Flanker packs barely change (wolves 210 to 190, knights 212 to 194): they circle you together in one direction |
| Enemies | Flanker packs stayed bunched (all circling you together, one way) | Each flanker aimed 70 degrees round from where it was, so the pack orbited as one | Flankers circle more gently (35 degrees ahead) with the pack's spacing at full weight | `audit_groups`: wolves 190 to 144 degrees, knights 194 to 179 |
| Enemies | A group of six coming through a doorway: in 30 of 104 cases one or two jammed at a wall corner for the rest of the fight | Two bugs: crowd separation shoved monsters with a smaller body (0.3) than they walk with (0.35), into spots overlapping a corner they then could not leave; and the corner slide only moved a monster if the way ahead opened at once, so it never slid while off-centre | Separation uses the walking body; the corner slide steps toward the centre whenever the step itself is free | `check_navigation --group` (six at once): 30 failures to 0, one 3 s pause |
| Bosses | Bosses started, stopped and turned instantly (the Tidebound Lich 52 times a minute, Count Vesper 17, the Gilded Sphinx 13) | Every movement mode moved the boss at constant speed straight to its target | One smoothing layer in `bxMove` (src/bossx.js): each boss's mode still decides where it wants to be (its paths and targets unchanged), and the boss gets there with eased velocity (5 a second walking, 14 for a dash); a jump of over a tile is a designed teleport and passes as it is; a change of form starts from rest. The Grand Orrery is left out (by name; its file untouched) | `tools/audit_boss_movement.mjs`: instant starts and stops per minute: Lich 52 to 1.3, Vesper 17 to 0, Sphinx 13 to 0, Treant, Kraken and Colossus near 0 as before; the Lich's designed teleports kept. `check_bosses`, `check_boss_pressure`, `check_astral` pass. Left as designed (telegraphed): Mycelia's lunge (0.6 s wind-up, 3 tiles), the Ringmaster's leap (a 0.9 s arc onto a drum), Glacius's dives |
| Bosses | Standing at the south edge of Glacius's lake took 26 hits a minute (58-78 elsewhere); the Ringmaster's north edge 4 | Their aimed attacks fell short of their own arenas: Glacius's ice lances flew 9 tiles while it circles the north half of the lake; the Ringmaster's card fans 14 tiles from drums at the edge of a wide ring | Lances reach 15 tiles (their ice still forms where each line stops), cards 22; patterns, speed and damage unchanged | `tools/check_boss_safespots.mjs` (each boss vs six standing spots, edge circling and a reading player): Glacius south 26 to 53; Ringmaster north 4 to 8 |
| Bosses | Circling the arena's edge at a steady pace was a cheap way through five bosses (hits a minute: Kraken 7, Ringmaster 6, Mycelia 15, Colossus 24, Vesper 26; a reading player 16, 2, 30, 29, 17) | Their aimed attacks always aimed where you were, never where you were going | (Chosen by the user: option 2.) `bxAim` in src/bossx.js: a boss with `lead: true` aims one aimed volley in three, from over 4 tiles, at where you will be when it arrives (your actual movement, frame to frame, times its flight, at most 1.2 s). Set for those five; fans and walls go through it, and each boss's own aimed attacks call it | `check_boss_safespots`: circling now Kraken 30, Ringmaster 8, Mycelia 34, Colossus 36, Vesper 22, never cheaper than reading play (5, 2, 37, 28, 17). Boss, pressure, Hollowmoon, Keep, Mirerot and Crypt checks pass |
| Bosses | The Ringmaster's leap landing threw a full ring of cane-stars from a drum at the arena's edge, half of it into the wall behind him | A ring whatever the spot | It throws its 14 stars in a 200-degree fan facing the ring's middle (denser where you are), reaching 20 tiles | `audit_boss_positioning`: wasted on walls 13% to 5%; Hollowmoon and boss checks pass |
| Art | The new chest, open chest, hay bale and vault strongbox (drawn in earlier passes) used finer pixels than the props round them | They were drawn at 16 px detail; the atlas's props are 8x8 art in 2x2 blocks | Redrawn as 8x8 props (`tools/art_objects.mjs`), same designs | `tools/audit_art.mjs`; side by side with the crate and barrel |
| Tests | `check_shot_lifecycle` failed once at random | Dungeons generated from the clock, the game's generator not reseeded | Clock pinned, generator reseeded per shooter | repeated runs |
| Tests | `check_remaster_ext` failed at random (about 1 run in 4) | Its realm monsters fire on unseeded randomness | Seeded | 3 of 3 identical runs |

## Found working (tested end to end)
- Sprites (`tools/audit_art.mjs`, 857 character, monster, boss, pet, item and object sprites, plus the 98 regular
  enemies and the objects atlas reviewed by eye): no empty frames, no misaligned loops, and the few soft-edged
  sprites are on purpose (the puppets' faint strings, the watermelon's baked shadow, elites' attack effects); the
  drift of Emily the Yapper is her waving wand, the Fallen Heart's bob its heartbeat. Open question: two pixel
  sizes on screen. The original enemy, champion, boss and player sheets and the townsfolk draw one screen pixel per
  art pixel; everything from the newer packs (72 creatures, 60 pets, 117 items, the elites and event bosses) and
  the world's props draw two. Left as it is: a 16x16 hand redraw of the newer packs was tried (all 20 overworld
  creatures) and reverted at the user's request; the creatures keep their original art.
- Every talkable thing and chest in the realm and all 17 dungeons (`tools/check_dungeon_objects.mjs`): 279 talks
  (journals, levers' masks and sigils, lore stones, wells, dig spots, altars, fishing, the cat, waypoints...) each do
  something visible, and 196 chests open under fire and drop their bag.
- The simulation (`tools/bench.mjs`): 1-2 ms per update on average in a crowd of 60, travelling the realm and every
  modular boss fight; 0.1 ms for the Supernova's 389 shots. Its only slow frame is the first one after entering a map.
- Drawing in the densest fights (browser, after the ground fix): Glacius 2.4 ms a frame with 223 shots, Tidebound Lich
  1.8, Forgeheart Colossus 1.8, the Supernova 6.2 with 388 shots, a crowd of 60 monsters 4.8 with 771 particles.
  Sustained play: 0 of 900 crowd frames and 0 of 1,200 realm frames over the 16.7 ms budget (update and draw
  together: 99th percentile 9.7 ms). The only slow frames are the first ones in newly seen ground.
- Projectile lifecycle, every shooter but the Grand Orrery (`tools/check_shot_lifecycle.mjs`: 10 modular bosses and 194
  other enemies and elites): each fights, dies mid-attack, and is watched for 15 s. Nothing fires after death, none of
  its shots are left in the air, no shot of anyone's lives over 25 s, and nothing hurts you once its shots are gone.
  Designed after-effects are kept: a mortar or splitting shot fired before death still lands and breaks (its pieces
  are now marked `shard`), and a boss's harmless death burst. Phase changes clear a boss's bullets (`check_bosses`)
  except where the fight keeps them on purpose.
- Pet system, in a test tab through the real UI: buying an egg, hatching it (it becomes your companion), following you,
  its heal and mana ticks outside the Nexus, feeding from the Pet Yard (levels up, the item is consumed, gold paid),
  the pet staying out of the vault (by design) and returning, map changes (realm, Nexus), and the save keeping pets,
  the active pet and their levels.
- Loot bags: 90 s (rare 180 s) expiry, emptied bags vanish, a bag you stand at waits for you, expiry never touches
  your inventory.

## To do (next sessions)
- 2.5D walls (requested 2026-10-12), done in src/walls.js: every wall is a block. Dungeon walls stand one tile tall
  (the Crimson Keep 1.5, the chapel, the Heart and Throne ribs and the Prism Lighthouse 1.25); the Nexus hedges stand
  low (0.7), in the Nexus only; the realm's ruins (towers, hamlets, graveyards, shells: ruin_wall pieces) are low
  broken blocks of uneven height, while the realm's border, hedges and cliffs stay flat. Tops are the wall's own art,
  lifted and turning with the camera; faces show toward anything lower (a partial face where a taller block meets a
  shorter one), coursed per material (rivets, ribs, honeycomb, velvet folds, crystal facets, leaves), lit by their
  world direction, with a contact shadow. Border walls sort with everyone; a wall over your own character turns
  see-through; shots draw over all of it; collision is untouched. All 17 dungeons checked at a turned camera (a contact
  sheet), the Nexus and the realm ruins too. Cost about 0.5-1 ms a frame.
- Vault window and settings dropdown (requested 2026-10-12), done: standing on your vault chest opens a big window over
  the game (the vault grid itself moves into it, so dragging, tooltips and double-click all work), with Type / Tier / Rarity
  / Name sorting and a scrolling grid; double-click a backpack item to store it; Esc or x closes it (the panel label reopens
  it); stepping off closes it. The gear opens a RotMG-style dropdown: Options, Nexus, Character select, Switch account.
- Item sprite redraws: dropped (2026-10-12). The user did not like ChatGPT's redesigns; the items keep their current art.
- Ability shots: player shots, already drawn 1:1; their art sizes are part of the item rework (with the weapons).
- Feel: movement, firing, camera, transitions.
- Enemy movement, audit so far (`tools/audit_movement.mjs`, 189 monster types in open ground while you circle,
  alone and in groups of 8). Already smooth: no frame-to-frame reversals anywhere, heading turn rates under 1.3 rad/s
  for every type except one (1.7), in/out wobble under 1 per second for all but 3, almost no stacking (4% at worst).
  Real findings: 3 skitterers (candle_mite, slag_imp, tomb_scarab) overshoot their distance and back off 1-1.6 times
  a second; bursts well above listed speed to be checked for telegraphs (wild_boar and mountain_ram charges 4.2x,
  comet_hound 5x and abyss_hound 4.7x, storm_gryphon's dive 4.2x, rock_troll 2.4x); fallen_choirmaster (float) makes
  no progress 18% of the time. Not yet measured: walls, corridors and doorways (the likely home of stuck and
  straight-line chasing), which needs a dungeon-layout test. Then: per-enemy weight (today every monster eases its
  velocity at the same rate), the archetypes, group roles, boss movement.
- Navigation, pass 2: the check is now fully repeatable (dungeon layouts, the game's own generator and the choice of
  monster are all fixed per dungeon; `R.seed()` added to src/util.js for it). Found and fixed: a monster that could
  "see" you along a line that only grazed a corner walked into the corner (walking now needs a line as wide as its
  body, 0.42 either side, both for walking straight and for choosing how far down the path to aim); a monster caught
  on a corner in a one-tile corridor was refused the move instead of sliding in (monsters now slide toward the
  centre of their row or column when blocked; your own movement is unchanged); an elite burrowing toward you tunnelled
  straight into walls (it follows the path too). 8 chases per dungeon, 104 in all: 103 reach you (median 0.8 s).
  Pass 3: a monster on a long detour walked out of its aggro range halfway round, forgot you, drifted back, and
  hovered at the edge (the Drowned Thrall's 28-tile detour): monsters now keep chasing for 4 s after you leave their
  range, out to 1.6x it. A monster's body is a square, so it sweeps wider going diagonally than straight: the
  clearance tests now allow for that (the Rock Troll's tunnel no longer stalls). Result: 104 of 104 chases reach you,
  no stall over 3 s, both with you standing still and walking a circle (`--moving`).
- Bosses, positioning and form changes (`tools/audit_boss_positioning.mjs`, each boss in its own arena for 150 s):
  no form change leaves a boss stuck in a wall or out of its arena (9 bosses, every change). Shots wasted on walls
  early in flight are under 10% for every attack but three: the Sphinx's riddle (41%: its glyphs dart at you past
  the obelisks, which are cover by design: kept), Vesper's blood bolts (11%, from his promenade by the throne: kept),
  and the Ringmaster's leap (13%: fixed, below).
- HUD matched to the user's RotMG screenshot (2026-10-12), done: black minimap as wide as the panel with + and -
  stacked top right, you a yellow star; white pixel icon row (Stats and Pet open in the backpack box, Settings);
  square outlined bars (Lvl/Fame left, value centred; HP green with a yellow value, MP blue with a green value,
  bonuses blue); equipment in a light frame with outlined tiers; two pouch tabs over 4x2 slots (empty ones show their
  number); two wide potion buttons (3/10, green when full, a dim icon when empty); the place name and who is with you
  (you and your pet) at the bottom, which a bag, portal card or vault covers. Pixel font (Pixelify Sans) outlined in
  black. Fixed layout: the panel is 9 slots + 288 px tall and the window height alone picks the slot size (30 to 76 px);
  fits checked at 600 to 1080 px tall. The key-hint line is hidden (RotMG has none; Settings lists the keys).
  Still to match: RotMG's triangle markers for others and diamonds for loot on the minimap.
- Enemy movement and AI overhaul (requested 2026-10-12): audit every enemy's movement; reusable movement archetypes
  (pursuer, orbiter, skirmisher, ambusher, charger, flanker, defender, erratic, formation, stationary guardian) with
  per-enemy weight (acceleration, turning); smooth, frame-rate independent steering, wall sliding, unsticking;
  movement that matches each enemy's attacks; local group spacing; per-boss movement polish (handcrafted bosses keep
  their choreography; the Grand Orrery is untouched); pathfinding only where obstacles block; profiled performance;
  automated tests in real dungeon layouts.
- 2.5D wall system in the style of RotMG (requested 2026-10-12): walls with top faces, extruded front faces, corners and
  junctions worked out from neighbouring tiles, depth sorting with characters and shots, contextual see-through
  where walls would hide danger, restrained shading and per-dungeon materials, collision unchanged. **Blocked:** the
  request text was cut off at "6. Performance Optimization" and the reference screenshot did not arrive.
- Enemy sizing pass (requested 2026-10-19, with screenshots: desert and Greenmarch foes): some enemies read wrong
  because an 8x8 sprite is drawn too big or a 16x16 too small. Check every enemy (realm, dungeon, Realmforge) and set
  its drawn size from its sprite size and its importance (fodder small, champions and minibosses larger, bosses
  largest), consistently across a land; redraw 8x8s that need it as 16x16s.
