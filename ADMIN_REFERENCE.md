# Realm admin reference

Generated from the game data by `node tools/admin_reference.mjs` (rerun it after adding content).
Type commands into chat (press `/` or Enter). Ids are case-sensitive and use underscores.

## Commands

| Command | What it does |
| --- | --- |
| `/help` | Lists the commands in chat |
| `/admin` | Equips the overpowered admin kit (your old gear goes to your backpack/ground) |
| `/god` | Toggles god mode (no damage) |
| `/heal` | Refills Life and Mana |
| `/maxlevel` | Jumps to level 20 (stats roll up as normal) |
| `/level N` | Levels up to N |
| `/maxstats` | Sets every stat to your class maximum |
| `/backpack` | Adds the second backpack (16 slots) |
| `/give ITEM [N]` | Gives N of an item (ids below; enchanted ids work too, see Enchantments) |
| `/items TEXT` | Searches item ids and names |
| `/spawn ENEMY [N]` | Spawns N of an enemy near you (also works with realm boss ids) |
| `/boss ID` | Spawns a realm boss here (realm only); drowned_abbot / fallen_heart / unstruck teleport you to their dungeon boss |
| `/bosses` | Lists boss ids |
| `/event BIOME` | Starts a herald event in a biome (realm only; the four original lands) |
| `/star` | A star falls in Godfall: the Fallen Star climbs out of the crater (realm only) |
| `/seals` | Breaks every seal on a dungeon boss gate |
| `/keys [DUNGEON] [N]` | Gives you a key for every dungeon (or N keys for one). Use a key in the Nexus or Realm to open the portal to that dungeon |
| `/adminchest [N]` | Conjures up to 5 admin chests near you (realm or dungeon). Break one for top-tier gear, three relics, a likely mythic and a chance at the crown |
| `/pet [KIND] [RARITY] [max]` | Adds a pet (max = every ability at its cap; good for testing fusing). Kinds and rarities are listed under Pets |
| `/progress BIOME N` | Sets herald progress toward that biome's realm boss |
| `/tp WHERE` | Teleports: any land (shore, fen, runeholt, godfall, dunes, thornwood, steppe), realm, nexus, or a dungeon id |
| `/portal DUNGEON` | Opens a dungeon portal next to you |
| `/killall` | Kills every enemy within 15 tiles |
| `/clearbags` | Removes all loot bags on the map |
| `/gold N` | Adds N gold (default 1000) |
| `/essence N` | Adds N essence |
| `/fame N` | Adds N account fame (default 100) |
| `/quest [KIND]` | Takes a quest: hunt, shrine, camp, herald, fetch, dungeon, rboss |
| `/duck` | Spawns the Golden Duck |
| `/dance` | Dance (nearby monsters stop to watch) |

## Places

- Lands (`/tp`): `shore`, `fen`, `runeholt`, `godfall`, `dunes`, `thornwood`, `steppe` (`/event`, `/progress`: the first four)
- Dungeons (`/tp`, `/portal`): `chapel`, `forge`, `heart`, `scriptorium`, `throne`, `crypt`, `ember`, `hive`, `theatre`, `spire`, `dream`
- Classes: Brawler (`brawler`), Forge Knight (`forge_knight`), Priest (`priest`), Summoner (`summoner`), Harpooner (`harpooner`), Duelist (`duelist`), Stormwright (`stormwright`), Clockmaker (`clockmaker`), Runeblade (`runeblade`), Hexweaver (`hexweaver`)

## Dungeons

Open one with `/portal ID` or a key (`/keys`). `/seals` breaks every seal on a boss gate.

| Id | Name | Tier | Boss gate opens by | Trap / hazard | Key | Boss |
| --- | --- | --- | --- | --- | --- | --- |
| `chapel` | The Sunken Chapel | low | none | the rising tide (bubble walls) | `key_chapel` | The Drowned Abbot |
| `forge` | The Drowned Forge | low | none | falling slag; conveyor belts carry you | `key_forge` | The Unstruck |
| `heart` | The Heart of Godfall | high | three wardens | a heartbeat of falling gold | `key_heart` | The Fallen Heart |
| `scriptorium` | The Frozen Scriptorium | mid-high | a warden, a hidden lever and the rune puzzle | falling icicles | `key_scriptorium` | The Archivist |
| `throne` | The Throne of the Unstruck God | endgame | two wardens | falling gold; sentinel statues fire across the royal road | `key_throne` | The Unstruck God |
| `crypt` | The Sunken Crypt | mid | none | the drowning dark; restless sarcophagi wake as you pass | `key_crypt` | The Tidebound Lich |
| `ember` | The Emberforge Depths | high | two wardens, the pressure plates and a lever | falling cinders; ember vents erupt | `key_ember` | The Forgeheart Colossus |
| `hive` | The Honeyed Hollow | low | none | honey floors halve your speed | `key_hive` | Queen Melliflua, the Honeyed Mother |
| `theatre` | The Gilded Marionette Theatre | mid | carry the three lost masks (Comedy, Tragedy, Silence) to the stand before the stage | spotlights: caught in one, every puppet in the room fires faster | `key_theatre` | Maestro Vesper, the Puppeteer |
| `spire` | The Prism Lighthouse | high | three mirror chambers: turn the mirrors (F) to bend the beam onto each crystal | lens sentries fire along their sight-line | `key_spire` | Aurelia, the Prism Wyrm |
| `dream` | The Sleeper's Dream | endgame | survive three nightmare trials (the bridges vanish until you do) | bridges fade (fall through: -15% life) | `key_dream` | The Sleeper, Who Dreams the Realm |

### The newer dungeons' bosses

- **Queen Melliflua, the Honeyed Mother** (`honey_queen`, 52,000 life, 3 phases): Hex-stings, a jittering bee swarm, a figure-eight waggle dance, honey rain that leaves sticky puddles, brood cells that hatch unless broken. Relics: `queens_stinger` (12%), `honeyguard_band` (10%). Plus a 0.2% chance at each mythic (25).
- **Maestro Vesper, the Puppeteer** (`the_puppeteer`, 140,000 life, 3 phases): Immune while strung to four hanging marionettes (cut them, then he takes double damage). Curtains close from both wings, scissor-lines snap shut, a mirror-puppet answers your every shot; an intermission hands the stage to his understudies. Relics: `maestros_baton` (10%), `the_last_curtain` (10%), `stringcutter` (8%). Plus a 0.6% chance at each mythic (25).
- **Aurelia, the Prism Wyrm** (`prism_wyrm`, 380,000 life, 3 phases): Glass (immune) unless a lens pedestal beam is on her: stand on one (it overheats after 5s). Her images block the beam; burn them. Last phase: hold the light over 2s and she overcharges. Relics: `wyrmglass_wand` (10%), `prismglass_mantle` (10%), `the_seventh_colour` (7%). Plus a 1.2% chance at each mythic (25).
- **The Sleeper, Who Dreams the Realm** (`the_sleeper`, 520,000 life, 4 phases): Stand still and you fall asleep. Dream-shift: its body is immune, strike its nightmare-self. Dream-logic inverts your controls. At 10% it will not wake until you ring the three alarms (F). Relics: `lullaby_staff` (10%), `nightlight_ring` (10%), `the_waking_bell` (7%). Plus a 1.9% chance at each mythic (25).

## Pets

- Kinds (`/pet KIND`): Ember Fox (`ember_fox`), Tide Turtle (`tide_turtle`), Lantern Moth (`lantern_moth`), Bog Frog (`bog_frog`), Rune Owl (`rune_owl`), Salt Crab (`salt_crab`), Frost Kit (`frost_kit`), Star Wisp (`star_wisp`)
- Rarities (`/pet KIND RARITY`): `common` (cap 30), `uncommon` (cap 50), `rare` (cap 70), `legendary` (cap 90), `divine` (cap 100)
- Abilities: Heal (Life) and Magic Heal (Mana) for every pet; Shield (a ward) from Rare up. Feed gear at the Petkeeper (gold or fame); a meal splits 100% / 65% / 35% between the main, second and third ability.
- Fusing: two pets of the same rarity whose **main** ability is at the cap fuse into one of the next rarity. Pay gold (common 600, uncommon 2500, rare 7500, legendary 20000) or fame (common 20, uncommon 60, rare 150, legendary 400). Pick which pet's look to keep; every ability keeps the better level.
- Skins: Legendary pets are gilded, Divine pets celestial; Rare and up glitter. The sidebar's **Pet** tab shows your companion's abilities, levels and next heal.
- Eggs: `pet_egg_common`, `pet_egg_uncommon`, `pet_egg_rare`, `pet_egg_legendary` (`/give`).

## Bosses

| Id | Name | Where | Life | How to summon |
| --- | --- | --- | --- | --- |
| `brine_cathedral` | The Brine Cathedral | shore | 28,000 | /boss brine_cathedral |
| `wick_mother` | The Wick-Mother | fen | 60,000 | /boss wick_mother |
| `orrery_of_winter` | The Orrery of Winter | runeholt | 104,000 | /boss orrery_of_winter |
| `penitent_colossus` | The Penitent Colossus | godfall | 168,000 | /boss penitent_colossus |
| `emily_the_yapper` | Emily, the Yapper | runeholt | 80,000 | /boss emily_the_yapper (or /boss emily) |
| `the_fallen_star` | The Fallen Star | godfall | 240,000 | /boss the_fallen_star |
| `drowned_abbot` | The Drowned Abbot | dungeon: chapel | 64,000 | /boss drowned_abbot |
| `fallen_heart` | The Fallen Heart | dungeon: heart | 400,000 | /boss fallen_heart |
| `the_archivist` | The Archivist | dungeon: scriptorium | 136,000 | /tp scriptorium |
| `the_unstruck_god` | The Unstruck God | dungeon: throne | 720,000 | /tp throne |
| `tidebound_lich` | The Tidebound Lich | dungeon: crypt | 160,000 | /tp crypt |
| `forgeheart_colossus` | The Forgeheart Colossus | dungeon: ember | 550,000 | /tp ember |
| `honey_queen` | Queen Melliflua, the Honeyed Mother | dungeon: hive | 52,000 | /tp hive |
| `the_puppeteer` | Maestro Vesper, the Puppeteer | dungeon: theatre | 140,000 | /tp theatre |
| `prism_wyrm` | Aurelia, the Prism Wyrm | dungeon: spire | 380,000 | /tp spire |
| `the_sleeper` | The Sleeper, Who Dreams the Realm | dungeon: dream | 520,000 | /tp dream |
| `unstruck` | The Unstruck | dungeon: forge | 168,000 | /boss unstruck |

## Enemies

Use with `/spawn ID [N]`.

### shore

| Id | Name | Life | Notes |
| --- | --- | --- | --- |
| `brine_slimelet` | Brine Slimelet | 70 | moves: skitter |
| `lens_moth` | Lens Moth | 80 | flies, moves: zigzag |
| `lantern_jelly` | Lantern Jelly | 85 | flies, moves: float |
| `trap_hound` | Trap-Hound | 90 | moves: zigzag |
| `brine_pilgrim` | Brine Pilgrim | 110 | moves: shamble |
| `salt_widow` | Salt Widow | 140 | moves: kite |
| `anchor_bearer` | Anchor-Bearer | 150 | moves: hop |
| `reef_eel` | Reef Eel | 160 | moves: burrow |
| `brine_slime` | Brine Slime | 300 | moves: hop |
| `moth_queen` | Lens Moth Queen | 400 | champion, flies, moves: swoop |
| `lighthouse_jelly` | The Lighthouse Jelly | 425 | champion, flies, moves: float |
| `trap_hound_alpha` | Trap-Hound Alpha | 450 | champion, moves: zigzag |
| `pilgrim_elder` | Pilgrim Elder | 650 | champion, moves: shamble |
| `salt_matriarch` | Salt Matriarch | 700 | champion, moves: kite |
| `anchor_titan` | Anchor Titan | 750 | champion, moves: hop |
| `golden_duck` | The Golden Duck | 1,500 | moves: flee |
| `coin_imp` | The Coin Thief | 2,500 | moves: flee |
| `tide_herald` | The Tide Herald | 2,600 | champion, flies, moves: float |

### fen

| Id | Name | Life | Notes |
| --- | --- | --- | --- |
| `candle_mite` | Candle Mite | 120 | moves: skitter |
| `lantern_heron` | Lantern Heron | 380 | flies, moves: swoop |
| `gas_bloat` | Gas-Bloat | 380 | flies, moves: zigzag |
| `bell_taken` | The Bell-Taken | 420 | moves: hop |
| `mourning_willow` | Mourning Willow | 450 | moves: rooted |
| `mire_choir` | Mire Choir | 480 | flies, moves: float |
| `peat_saint` | Peat Saint | 520 | moves: kite |
| `grave_leech` | Grave Leech | 520 | moves: shamble |
| `tallow_matron` | Tallow Matron | 600 | champion, moves: skitter |
| `bog_toad` | Bog Toad | 600 | moves: hop |
| `twin_lamp_heron` | Twin-Lamp Heron | 1,900 | champion, flies, moves: swoop |
| `bog_abbess` | Bog Abbess | 2,000 | champion, flies, moves: float |
| `great_bell` | The Great Bell-Taken | 2,100 | champion, moves: hop |
| `elder_willow` | Elder Willow | 2,250 | champion, moves: rooted |
| `mire_chorus` | The Mire Chorus | 2,400 | champion, flies, moves: float |
| `peat_martyr` | Peat Martyr | 2,600 | champion, moves: kite |
| `leech_prime` | Leech Prime | 2,600 | champion, moves: shamble |
| `bog_bellringer` | The Bog Bellringer | 6,000 | champion, moves: hop |

### runeholt

| Id | Name | Life | Notes |
| --- | --- | --- | --- |
| `emily_chick` | Emily's Chick | 260 | moves: hop |
| `antlered_hush` | Antlered Hush | 750 | moves: drift |
| `cairn_crawler` | Cairn Crawler | 800 | moves: charge |
| `frost_skald` | Frost Skald | 800 | moves: kite |
| `prayer_monk` | Prayer-Wheel Monk | 900 | moves: kite |
| `frost_wraith` | Frost Wraith | 950 | flies, moves: blink |
| `wolf_shield` | Wolf-Shield | 1,000 | moves: flank |
| `cairn_mender` | Cairn Mender | 1,100 | moves: kite |
| `frozen_executioner` | Frozen Executioner | 1,150 | moves: shamble |
| `elder_hush` | The Elder Hush | 3,750 | champion, moves: drift |
| `saga_singer` | Saga-Singer | 4,000 | champion, moves: kite |
| `wheel_abbot` | Prayer-Wheel Abbot | 4,500 | champion, moves: kite |
| `rune_warden` | Rune-Warden | 4,800 | champion, moves: shamble |
| `shieldwall_pack` | The Shieldwall Pack | 5,000 | champion, moves: flank |
| `glacier_headsman` | Glacier Headsman | 5,750 | champion, moves: hop |
| `rime_herald` | The Rime Herald | 12,000 | champion, moves: kite |

### godfall

| Id | Name | Life | Notes |
| --- | --- | --- | --- |
| `cherub_husk` | Cherub Husk | 1,700 | flies, moves: float |
| `halo_eater` | Halo-Eater | 1,900 | flies, moves: swoop |
| `ash_harpy` | Ash Harpy | 2,000 | flies, moves: swoop |
| `reliquary_spider` | Reliquary Spider | 2,100 | moves: skitter |
| `hollow_thane` | Hollow Thane | 2,300 | moves: flank |
| `gilded_lancer` | Gilded Lancer | 2,600 | moves: flank |
| `choir_engine` | Choir Engine | 3,200 | moves: shamble |
| `censer_magistrate` | Censer-Magistrate | 6,500 | moves: kite |
| `seraph_husk` | Seraph Husk | 8,500 | champion, flies, moves: swoop |
| `fallen_choirmaster` | The Fallen Choirmaster | 9,500 | champion, flies, moves: float |
| `halo_glutton` | The Halo Glutton | 9,500 | champion, flies, moves: swoop |
| `broodmother` | Reliquary Broodmother | 10,500 | champion, moves: skitter |
| `hollow_jarl` | The Hollow Jarl | 11,500 | champion, moves: flank |
| `cathedral_engine` | The Cathedral Engine | 16,000 | champion, moves: shamble |
| `gilded_penitent` | The Gilded Penitent | 22,000 | champion, moves: flank |

### forge

| Id | Name | Life | Notes |
| --- | --- | --- | --- |
| `slag_imp` | Slag Imp | 900 | moves: skitter |
| `quench_wraith` | Quench Wraith | 1,500 | flies, moves: blink |
| `bellows_bound` | Bellows-Bound | 1,800 | moves: shamble |
| `mold_wrought` | Mold-Wrought | 2,400 | moves: kite |
| `anvil_golem` | Anvil Golem | 6,500 | moves: hop |

### town

| Id | Name | Life | Notes |
| --- | --- | --- | --- |
| `training_dummy` | Training Dummy | ∞ | training dummy, moves: shamble |
| `armored_dummy` | Armored Dummy (25 DEF) | ∞ | training dummy, moves: shamble |

### chapel

| Id | Name | Life | Notes |
| --- | --- | --- | --- |
| `drowned_acolyte` | Drowned Acolyte | 520 | moves: kite |
| `bell_wraith` | Bell Wraith | 600 | flies, moves: blink |
| `pew_mimic` | Pew Mimic | 700 | moves: hop |
| `barnacle_knight` | Barnacle Knight | 900 | moves: flank |
| `bell_totem` | Drowned Bell | 1,800 | moves: rooted |

### heart

| Id | Name | Life | Notes |
| --- | --- | --- | --- |
| `vein_crawler` | Vein Crawler | 1,600 | moves: burrow |
| `blood_seraph` | Blood Seraph | 2,200 | flies, moves: swoop |
| `gilded_cardinal` | Gilded Cardinal | 2,600 | moves: kite |
| `reliquary_maw` | Reliquary Maw | 3,600 | moves: rooted |

### scriptorium

| Id | Name | Life | Notes |
| --- | --- | --- | --- |
| `ink_wisp` | Ink Wisp | 700 | flies, moves: float |
| `living_tome` | Living Tome | 800 | flies, moves: swoop |
| `frost_librarian` | Frost Librarian | 1,300 | moves: kite |
| `ice_scribe` | Ice Scribe | 1,800 | moves: rooted |

### dunes

| Id | Name | Life | Notes |
| --- | --- | --- | --- |
| `sand_skimmer` | Sand Skimmer | 90 | flies, moves: zigzag |
| `glass_scarab` | Glass Scarab | 110 | moves: skitter |
| `dune_lurker` | Dune Lurker | 140 | moves: burrow |
| `salt_mummy` | Salt Mummy | 170 | moves: shamble |
| `mirage_caller` | Mirage Caller | 700 | champion, moves: kite |
| `glass_sphinx` | The Glass Sphinx | 800 | champion, moves: kite |

### thornwood

| Id | Name | Life | Notes |
| --- | --- | --- | --- |
| `briar_bee` | Briar Bee | 260 | flies, moves: zigzag |
| `thorn_sprite` | Thorn Sprite | 380 | flies, moves: swoop |
| `spore_puff` | Spore Puff | 450 | moves: drift |
| `bramble_wolf` | Bramble Wolf | 520 | moves: flank |
| `witch_of_briars` | The Witch of Briars | 2,100 | champion, moves: kite |
| `thornwood_stag` | The Thornwood Stag | 2,400 | champion, moves: hop |

### steppe

| Id | Name | Life | Notes |
| --- | --- | --- | --- |
| `quartz_jackal` | Quartz Jackal | 800 | moves: flank |
| `shard_crawler` | Shard Crawler | 900 | moves: skitter |
| `prism_hawk` | Prism Hawk | 1,000 | flies, moves: swoop |
| `crystal_golem` | Crystal Golem | 1,500 | moves: shamble |
| `skyglass_seer` | The Skyglass Seer | 5,200 | champion, flies, moves: kite |
| `geode_titan` | The Geode Titan | 6,500 | champion, moves: shamble |

### crypt

| Id | Name | Life | Notes |
| --- | --- | --- | --- |
| `bone_wisp` | Bone Wisp | 700 | flies, moves: float |
| `brine_jelly` | Brine Jelly | 800 | flies, moves: drift |
| `drowned_thrall` | Drowned Thrall | 1,100 | moves: shamble |

### ember

| Id | Name | Life | Notes |
| --- | --- | --- | --- |
| `magma_imp` | Magma Imp | 1,300 | flies, moves: zigzag |
| `slag_crawler` | Slag Crawler | 1,600 | moves: skitter |
| `cinder_golem` | Cinder Golem | 7,500 | moves: shamble |

### hive

| Id | Name | Life | Notes |
| --- | --- | --- | --- |
| `worker_bee` | Worker Bee | 380 | flies, moves: zigzag |
| `brood_cell` | Brood Cell | 520 | moves: rooted |
| `wax_drone` | Wax Drone | 700 | flies, moves: float |
| `honey_grub` | Honey Grub | 900 | moves: shamble |
| `comb_guard` | Comb Guard | 1,600 | flies, moves: flank |

### theatre

| Id | Name | Life | Notes |
| --- | --- | --- | --- |
| `marionette` | Marionette | 1,100 | moves: hop |
| `masked_chorister` | Masked Chorister | 1,300 | moves: kite |
| `stagehand` | Stagehand | 1,800 | moves: flank |
| `prima_donna` | Prima Donna | 3,200 | moves: kite |
| `understudy` | The Understudy | 7,000 | moves: orbit |
| `hanging_marionette` | Hanging Marionette | 9,000 | moves: rooted |
| `mirror_puppet` | Your Mirror Puppet | ∞ | training dummy, moves: rooted |

### prism

| Id | Name | Life | Notes |
| --- | --- | --- | --- |
| `lumen_moth` | Lumen Moth | 1,800 | flies, moves: swoop |
| `refractor` | Refractor | 2,600 | flies, moves: float |
| `glass_knight` | Glass Knight | 4,200 | moves: flank |
| `prism_eye` | Prism Eye | 7,000 | flies, moves: kite |
| `prism_image` | A Prism Image | 30,000 | moves: orbit |

### dream

| Id | Name | Life | Notes |
| --- | --- | --- | --- |
| `lullaby_moth` | Lullaby Moth | 2,400 | flies, moves: orbit |
| `sleepwalker` | Sleepwalker | 3,600 | moves: drift |
| `night_mare` | Night Mare | 4,800 | moves: charge |
| `dream_eater` | Dream Eater | 6,000 | moves: shamble |
| `nightmare_knight` | Nightmare Knight | 9,000 | moves: flank |
| `sleepers_nightmare` | The Sleeper's Nightmare | ∞ | moves: orbit |

## Items

Use with `/give ID [N]`. Tiered gear ids are `TYPE_tN` (rings are `ring_STAT_tN`).

### Mythic (starfall)

| Id | Name | Kind |
| --- | --- | --- |
| `hammer_that_never_fell` | The Sword That Never Fell | Mythic Sword · Brawler, Forge Knight, Runeblade |
| `starfall_knuckles` | Starfall Blade | Mythic Sword · Brawler, Forge Knight, Runeblade |
| `sunless_psalter` | The Sunless Psalter | Mythic Wand · Priest, Clockmaker |
| `shard_of_the_first_star` | Shard of the First Star | Mythic Ring |
| `the_unburied_choir` | The Unburied Choir | Mythic Staff · Summoner, Stormwright, Hexweaver |
| `the_white_whale` | The White Whale | Mythic Bow · Harpooner |
| `the_mirrorworld` | The Mirrorworld | Mythic Dagger · Duelist |
| `the_first_storm` | The First Storm | Mythic Staff · Summoner, Stormwright, Hexweaver |
| `the_last_second` | The Last Second | Mythic Wand · Priest, Clockmaker |
| `the_unbroken_bellows` | The Unbroken Bellows | Mythic Bellows · Brawler |
| `the_first_anvil` | The First Anvil | Mythic Oath-Seal · Forge Knight |
| `the_second_sun` | The Second Sun | Mythic Halo · Priest |
| `the_grave_of_kings` | The Grave of Kings | Mythic Reliquary · Summoner |
| `the_leviathans_maw` | The Leviathan's Maw | Mythic Grapple Line · Harpooner |
| `the_infinite_reflection` | The Infinite Reflection | Mythic Mirror · Duelist |
| `the_eye_of_the_storm` | The Eye of the Storm | Mythic Storm Kite · Stormwright |
| `the_unwound_spring` | The Unwound Spring | Mythic Stopwatch · Clockmaker |
| `the_conductors_band` | The Conductor's Band | Mythic Ring |
| `ring_of_the_first_flame` | Ring of the First Flame | Mythic Ring |
| `ring_of_still_waters` | Ring of Still Waters | Mythic Ring |
| `band_of_the_open_hand` | Band of the Open Hand | Mythic Ring |
| `crown_of_the_unstruck` | Crown of the Unstruck | Mythic Ring |
| `the_unbroken_oath` | The Unbroken Oath | Mythic Rune-Ward · Runeblade |
| `oathbreaker` | Oathbreaker | Mythic Sword · Brawler, Forge Knight, Runeblade |
| `the_thirteenth_page` | The Thirteenth Page | Mythic Grimoire · Hexweaver |
| `the_witchs_eye` | The Witch's Eye | Mythic Staff · Summoner, Stormwright, Hexweaver |

### Untiered relics

| Id | Name | Kind |
| --- | --- | --- |
| `knuckle_of_the_unstruck` | Blade of the Unstruck | Untiered Sword · Brawler, Forge Knight, Runeblade |
| `billet_of_the_first_oath` | Blade of the First Oath | Untiered Sword · Brawler, Forge Knight, Runeblade |
| `the_last_noon` | The Last Noon | Untiered Halo · Priest |
| `censer_of_absolution` | Censer of Absolution | Untiered Bellows · Brawler |
| `pilgrims_pearl` | Pilgrim's Pearl | Untiered Ring |
| `bell_of_the_taken` | Bell of the Taken | Untiered Ring |
| `rime_headsman_plate` | Rime Headsman's Plate | Untiered Heavy Armor · Brawler, Forge Knight |
| `salt_widows_veil` | Salt Widow's Veil | Untiered Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `trap_hound_collar` | Trap-Hound's Collar | Untiered Ring |
| `hymn_of_the_mire` | Hymn of the Mire | Untiered Bellows · Brawler |
| `antler_crown` | Antler Crown | Untiered Ring |
| `the_turning_verse` | The Turning Verse | Untiered Oath-Seal · Forge Knight |
| `eaten_halo` | The Eaten Halo | Untiered Halo · Priest |
| `queens_stinger` | The Queen's Stinger | Untiered Dagger · Duelist |
| `honeyguard_band` | Honeyguard Band | Untiered Ring |
| `maestros_baton` | The Maestro's Baton | Untiered Wand · Priest, Clockmaker |
| `the_last_curtain` | The Last Curtain | Untiered Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `stringcutter` | Stringcutter | Untiered Dagger · Duelist |
| `wyrmglass_wand` | Wyrmglass Wand | Untiered Wand · Priest, Clockmaker |
| `prismglass_mantle` | Prismglass Mantle | Untiered Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `the_seventh_colour` | The Seventh Colour | Untiered Ring |
| `lullaby_staff` | The Lullaby Staff | Untiered Staff · Summoner, Stormwright, Hexweaver |
| `nightlight_ring` | Nightlight Ring | Untiered Ring |
| `the_waking_bell` | The Waking Bell | Untiered Halo · Priest |
| `tidecaller_blade` | Tidecaller Blade | Untiered Sword · Brawler, Forge Knight, Runeblade |
| `emberbrand_greatsword` | Emberbrand Greatsword | Untiered Sword · Brawler, Forge Knight, Runeblade |
| `staff_of_drowned_stars` | Staff of Drowned Stars | Untiered Staff · Summoner, Stormwright, Hexweaver |
| `cinderwood_staff` | Cinderwood Staff | Untiered Staff · Summoner, Stormwright, Hexweaver |
| `runeplate_armor` | Runeplate Brigandine | Untiered Leather Armor · Harpooner, Duelist, Runeblade |
| `hexsilk_robe` | Hexsilk Robe | Untiered Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `ring_of_tides` | Ring of Tides | Untiered Ring |
| `emberheart_ring` | Emberheart Ring | Untiered Ring |
| `runic_aegis` | The Runic Aegis | Untiered Rune-Ward · Runeblade |
| `grimoire_of_ash` | The Grimoire of Ash | Untiered Grimoire · Hexweaver |
| `soul_lantern` | The Soul Lantern | Untiered Reliquary · Summoner |
| `colossus_core` | The Colossus Core | Untiered Bellows · Brawler |
| `abbots_claw` | The Abbot's Cleaver | Untiered Sword · Brawler, Forge Knight, Runeblade |
| `pearl_of_the_drowned_mass` | Pearl of the Drowned Mass | Untiered Ring |
| `wick_of_the_mother` | Wick of the Mother | Untiered Halo · Priest |
| `tallow_vestment` | Tallow Vestment | Untiered Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `orrery_seal` | Seal of the Orrery | Untiered Oath-Seal · Forge Knight |
| `starless_band` | The Starless Band | Untiered Ring |
| `penitents_head` | The Penitent's Greatsword | Untiered Sword · Brawler, Forge Knight, Runeblade |
| `gilded_penance` | Gilded Penance | Untiered Heavy Armor · Brawler, Forge Knight |
| `heralds_conch` | The Herald's Conch | Untiered Bellows · Brawler |
| `bellringers_rope` | The Bellringer's Rope | Untiered Ring |
| `rime_standard` | Rime Standard Plate | Untiered Heavy Armor · Brawler, Forge Knight |
| `penitents_scourge` | The Penitent's Scourge | Untiered Sword · Brawler, Forge Knight, Runeblade |
| `rose_window_vestment` | Rose Window Vestment | Untiered Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `tallow_tongs` | The Tallow Brand | Untiered Sword · Brawler, Forge Knight, Runeblade |
| `orrery_rod` | The Orrery Rod | Untiered Wand · Priest, Clockmaker |
| `kintsugi_band` | The Kintsugi Band | Untiered Ring |
| `unstruck_anvil` | The Unstruck Anvil | Untiered Oath-Seal · Forge Knight |
| `furnace_heart_coat` | Furnace-Heart Coat | Untiered Heavy Armor · Brawler, Forge Knight |
| `abbots_crozier` | The Abbot's Crozier | Untiered Wand · Priest, Clockmaker |
| `stained_glass_halo` | Stained-Glass Halo | Untiered Halo · Priest |
| `tidewoven_coat` | Tidewoven Coat | Untiered Heavy Armor · Brawler, Forge Knight |
| `drowned_bell` | The Drowned Bell | Untiered Ring |
| `godheart_knuckle` | Godheart Blade | Untiered Sword · Brawler, Forge Knight, Runeblade |
| `godheart_tongs` | Godheart Greatsword | Untiered Sword · Brawler, Forge Knight, Runeblade |
| `godheart_scepter` | Godheart Scepter | Untiered Wand · Priest, Clockmaker |
| `godforged_plate` | Godforged Plate | Untiered Heavy Armor · Brawler, Forge Knight |
| `heartstring_vestment` | Heartstring Vestment | Untiered Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `heartbreak_coat` | Heartbreak Coat | Untiered Heavy Armor · Brawler, Forge Knight |
| `crown_of_the_fallen` | Crown of the Fallen | Untiered Ring |
| `lantern_of_the_last_watch` | Staff of the Last Watch | Untiered Staff · Summoner, Stormwright, Hexweaver |
| `choir_of_bones` | The Choir of Bones | Untiered Reliquary · Summoner |
| `gravewardens_pall` | The Gravewarden's Pall | Untiered Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `the_hollow_psalm` | The Hollow Psalm | Untiered Reliquary · Summoner |
| `leviathan_tine` | The Leviathan Bow | Untiered Bow · Harpooner |
| `drowned_mans_line` | The Drowned Man's Line | Untiered Grapple Line · Harpooner |
| `whalers_slicker` | The Whaler's Slicker | Untiered Leather Armor · Harpooner, Duelist, Runeblade |
| `kraken_bane` | Kraken-Bane | Untiered Bow · Harpooner |
| `abyssal_line` | The Abyssal Line | Untiered Grapple Line · Harpooner |
| `cinder_saints_fist` | The Cinder-Saint's Sword | Untiered Sword · Brawler, Forge Knight, Runeblade |
| `quenching_tongs` | The Quenching Blade | Untiered Sword · Brawler, Forge Knight, Runeblade |
| `dawnbreaker` | Dawnbreaker | Untiered Wand · Priest, Clockmaker |
| `bellwrights_mail` | The Bellwright's Mail | Untiered Heavy Armor · Brawler, Forge Knight |
| `ring_of_the_undertow` | Ring of the Undertow | Untiered Ring |
| `gravedust_band` | The Gravedust Band | Untiered Ring |
| `the_last_reflection` | The Last Reflection | Untiered Dagger · Duelist |
| `hall_of_mirrors` | The Hall of Mirrors | Untiered Mirror · Duelist |
| `silvered_duelcoat` | The Silvered Duelcoat | Untiered Leather Armor · Harpooner, Duelist, Runeblade |
| `heaven_wire` | The Heaven Wire | Untiered Staff · Summoner, Stormwright, Hexweaver |
| `the_thunderhead` | The Thunderhead | Untiered Storm Kite · Stormwright |
| `the_eleventh_hour` | The Eleventh Hour | Untiered Wand · Priest, Clockmaker |
| `the_broken_hourglass` | The Broken Hourglass | Untiered Stopwatch · Clockmaker |
| `the_bone_lantern` | The Bone Staff | Untiered Staff · Summoner, Stormwright, Hexweaver |
| `the_mourners_veil` | The Mourner's Veil | Untiered Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `the_sea_wolf` | The Sea-Wolf's Oilskin | Untiered Leather Armor · Harpooner, Duelist, Runeblade |
| `the_feint` | The Feint | Untiered Dagger · Duelist |
| `cracked_looking_glass` | The Cracked Looking-Glass | Untiered Mirror · Duelist |
| `the_lightning_rod` | The Lightning Rod | Untiered Staff · Summoner, Stormwright, Hexweaver |
| `the_squall` | The Squall | Untiered Storm Kite · Stormwright |
| `the_tempest_cloak` | The Tempest Cloak | Untiered Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `the_cuckoo` | The Cuckoo | Untiered Wand · Priest, Clockmaker |
| `the_hourglass_of_sand` | The Hourglass of Sand | Untiered Stopwatch · Clockmaker |
| `the_gearmail` | The Gearwright's Robe | Untiered Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `emilys_scarf` | Emily's Knitted Scarf | Untiered Ring |
| `rubber_duck` | The Rubber Duck | Untiered Ring |
| `runewarden_blade` | Runewarden's Blade | Untiered Sword · Brawler, Forge Knight, Runeblade |
| `runewarden_ward` | Runewarden's Ward | Untiered Rune-Ward · Runeblade |
| `runewarden_brigandine` | Runewarden's Brigandine | Untiered Leather Armor · Harpooner, Duelist, Runeblade |
| `hexcircle_staff` | Staff of the Circle | Untiered Staff · Summoner, Stormwright, Hexweaver |
| `hexcircle_grimoire` | Grimoire of the Circle | Untiered Grimoire · Hexweaver |
| `hexcircle_robe` | Robe of the Circle | Untiered Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `pitfighters_cleaver` | Pit-Fighter's Cleaver | Untiered Sword · Brawler, Forge Knight, Runeblade |
| `pitfighters_bellows` | Pit-Fighter's Bellows | Untiered Bellows · Brawler |
| `pitfighters_harness` | Pit-Fighter's Harness | Untiered Heavy Armor · Brawler, Forge Knight |
| `oathsworn_greatsword` | Oathsworn Greatsword | Untiered Sword · Brawler, Forge Knight, Runeblade |
| `oathsworn_seal` | Oathsworn Seal | Untiered Oath-Seal · Forge Knight |
| `oathsworn_bulwark` | Oathsworn Bulwark | Untiered Heavy Armor · Brawler, Forge Knight |
| `dawnchoir_wand` | Dawn-Choir Wand | Untiered Wand · Priest, Clockmaker |
| `dawnchoir_halo` | Dawn-Choir Halo | Untiered Halo · Priest |
| `dawnchoir_robe` | Dawn-Choir Robe | Untiered Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `graverite_staff` | Gravewarden's Staff | Untiered Staff · Summoner, Stormwright, Hexweaver |
| `graverite_reliquary` | Gravewarden's Reliquary | Untiered Reliquary · Summoner |
| `graverite_shroud` | Gravewarden's Shroud | Untiered Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `leviathan_longbow` | Leviathan Longbow | Untiered Bow · Harpooner |
| `leviathan_line` | Leviathan Line | Untiered Grapple Line · Harpooner |
| `leviathan_hide` | Leviathan Hide | Untiered Leather Armor · Harpooner, Duelist, Runeblade |
| `glassfencer_dirk` | Glass Fencer's Dirk | Untiered Dagger · Duelist |
| `glassfencer_mirror` | Glass Fencer's Mirror | Untiered Mirror · Duelist |
| `glassfencer_jerkin` | Glass Fencer's Jerkin | Untiered Leather Armor · Harpooner, Duelist, Runeblade |
| `tempest_staff` | Tempest Caller's Staff | Untiered Staff · Summoner, Stormwright, Hexweaver |
| `tempest_kite` | Tempest Caller's Kite | Untiered Storm Kite · Stormwright |
| `tempest_robe` | Tempest Caller's Robe | Untiered Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `clockwork_wand` | Clockwork Saint's Wand | Untiered Wand · Priest, Clockmaker |
| `clockwork_stopwatch` | Clockwork Saint's Stopwatch | Untiered Stopwatch · Clockmaker |
| `clockwork_robe` | Clockwork Saint's Robe | Untiered Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |

### Admin kit

| Id | Name | Kind |
| --- | --- | --- |
| `admin_godhammer` | The Developer's Gavel | ADMIN · Admin Weapon · any class |
| `admin_worldender` | The Delete Key | ADMIN · Admin Ability · any class |
| `admin_aegis` | Plate of the Source Code | ADMIN · Admin Armor · any class |
| `admin_band` | The Root Ring | ADMIN · Admin Ring · any class |

### Tiered weapons

| Id | Name | Kind |
| --- | --- | --- |
| `bow_t0` | Driftwood Bow | T0 Bow · Harpooner |
| `bow_t1` | Ironbark Bow | T1 Bow · Harpooner |
| `bow_t2` | Saltstring Bow | T2 Bow · Harpooner |
| `bow_t3` | Reedwhip Bow | T3 Bow · Harpooner |
| `bow_t4` | Runewood Longbow | T4 Bow · Harpooner |
| `bow_t5` | Emberstring Bow | T5 Bow · Harpooner |
| `bow_t6` | Glassarc Bow | T6 Bow · Harpooner |
| `bow_t7` | Gilded Recurve | T7 Bow · Harpooner |
| `bow_t8` | Hollowhorn Bow | T8 Bow · Harpooner |
| `bow_t9` | Stormdraw Bow | T9 Bow · Harpooner |
| `bow_t10` | Godshard Bow | T10 Bow · Harpooner |
| `dagger_t0` | Chipped Shiv | T0 Dagger · Duelist |
| `dagger_t1` | Iron Stiletto | T1 Dagger · Duelist |
| `dagger_t2` | Brine Kris | T2 Dagger · Duelist |
| `dagger_t3` | Bogfang Dirk | T3 Dagger · Duelist |
| `dagger_t4` | Runeneedle | T4 Dagger · Duelist |
| `dagger_t5` | Ember Talon | T5 Dagger · Duelist |
| `dagger_t6` | Glass Sliver | T6 Dagger · Duelist |
| `dagger_t7` | Gilded Misericorde | T7 Dagger · Duelist |
| `dagger_t8` | Hollow Fang | T8 Dagger · Duelist |
| `dagger_t9` | Nightvein Dagger | T9 Dagger · Duelist |
| `dagger_t10` | Godshard Shiv | T10 Dagger · Duelist |
| `staff_t0` | Ashwood Staff | T0 Staff · Summoner, Stormwright, Hexweaver |
| `staff_t1` | Iron-Shod Staff | T1 Staff · Summoner, Stormwright, Hexweaver |
| `staff_t2` | Kelp-Wound Staff | T2 Staff · Summoner, Stormwright, Hexweaver |
| `staff_t3` | Bog-Lantern Staff | T3 Staff · Summoner, Stormwright, Hexweaver |
| `staff_t4` | Runeheart Staff | T4 Staff · Summoner, Stormwright, Hexweaver |
| `staff_t5` | Emberroot Staff | T5 Staff · Summoner, Stormwright, Hexweaver |
| `staff_t6` | Glass-Eye Staff | T6 Staff · Summoner, Stormwright, Hexweaver |
| `staff_t7` | Gilded Psalm Staff | T7 Staff · Summoner, Stormwright, Hexweaver |
| `staff_t8` | Hollowbone Staff | T8 Staff · Summoner, Stormwright, Hexweaver |
| `staff_t9` | Starwell Staff | T9 Staff · Summoner, Stormwright, Hexweaver |
| `staff_t10` | Godshard Staff | T10 Staff · Summoner, Stormwright, Hexweaver |
| `sword_t0` | Rusted Shortsword | T0 Sword · Brawler, Forge Knight, Runeblade |
| `sword_t1` | Ironbite Blade | T1 Sword · Brawler, Forge Knight, Runeblade |
| `sword_t2` | Brinecut Saber | T2 Sword · Brawler, Forge Knight, Runeblade |
| `sword_t3` | Bogsteel Broadsword | T3 Sword · Brawler, Forge Knight, Runeblade |
| `sword_t4` | Runeedge Longsword | T4 Sword · Brawler, Forge Knight, Runeblade |
| `sword_t5` | Emberforged Blade | T5 Sword · Brawler, Forge Knight, Runeblade |
| `sword_t6` | Glassfang Sword | T6 Sword · Brawler, Forge Knight, Runeblade |
| `sword_t7` | Saint's Gilded Blade | T7 Sword · Brawler, Forge Knight, Runeblade |
| `sword_t8` | Hollowsteel Greatblade | T8 Sword · Brawler, Forge Knight, Runeblade |
| `sword_t9` | Anvilheart Sword | T9 Sword · Brawler, Forge Knight, Runeblade |
| `sword_t10` | Godshard Blade | T10 Sword · Brawler, Forge Knight, Runeblade |
| `wand_t0` | Twig Wand | T0 Wand · Priest, Clockmaker |
| `wand_t1` | Iron Wand | T1 Wand · Priest, Clockmaker |
| `wand_t2` | Pearl Wand | T2 Wand · Priest, Clockmaker |
| `wand_t3` | Wisp Wand | T3 Wand · Priest, Clockmaker |
| `wand_t4` | Runic Wand | T4 Wand · Priest, Clockmaker |
| `wand_t5` | Ember Wand | T5 Wand · Priest, Clockmaker |
| `wand_t6` | Prism Wand | T6 Wand · Priest, Clockmaker |
| `wand_t7` | Gilded Wand | T7 Wand · Priest, Clockmaker |
| `wand_t8` | Hollow Wand | T8 Wand · Priest, Clockmaker |
| `wand_t9` | Eclipse Wand | T9 Wand · Priest, Clockmaker |
| `wand_t10` | Godshard Wand | T10 Wand · Priest, Clockmaker |

### Tiered abilities

| Id | Name | Kind |
| --- | --- | --- |
| `bellows_t0` | Patched Bellows | T0 Bellows · Brawler |
| `bellows_t1` | Iron Bellows | T1 Bellows · Brawler |
| `bellows_t2` | Bronze Bellows | T2 Bellows · Brawler |
| `bellows_t3` | Steel Bellows | T3 Bellows · Brawler |
| `bellows_t4` | Verdigris Lung | T4 Bellows · Brawler |
| `bellows_t5` | Cobalt Gale-Bellows | T5 Bellows · Brawler |
| `halo_t0` | Tin Halo | T0 Halo · Priest |
| `halo_t1` | Iron Halo | T1 Halo · Priest |
| `halo_t2` | Bronze Halo | T2 Halo · Priest |
| `halo_t3` | Steel Halo | T3 Halo · Priest |
| `halo_t4` | Verdigris Corona | T4 Halo · Priest |
| `halo_t5` | Cobalt Corona | T5 Halo · Priest |
| `hex_t0` | Scrawled Hex | T0 Grimoire · Hexweaver |
| `hex_t1` | Iron-Bound Grimoire | T1 Grimoire · Hexweaver |
| `hex_t2` | Bronze-Clasped Grimoire | T2 Grimoire · Hexweaver |
| `hex_t3` | Steel-Clasped Grimoire | T3 Grimoire · Hexweaver |
| `hex_t4` | Verdigris Codex | T4 Grimoire · Hexweaver |
| `hex_t5` | Cobalt Codex | T5 Grimoire · Hexweaver |
| `hookline_t0` | Hemp Line | T0 Grapple Line · Harpooner |
| `hookline_t1` | Iron Grapple | T1 Grapple Line · Harpooner |
| `hookline_t2` | Bronze Grapple | T2 Grapple Line · Harpooner |
| `hookline_t3` | Steel Grapple | T3 Grapple Line · Harpooner |
| `hookline_t4` | Verdigris Kraken-Line | T4 Grapple Line · Harpooner |
| `hookline_t5` | Cobalt Kraken-Line | T5 Grapple Line · Harpooner |
| `kite_t0` | Paper Kite | T0 Storm Kite · Stormwright |
| `kite_t1` | Silk Kite | T1 Storm Kite · Stormwright |
| `kite_t2` | Bronze-Ribbed Kite | T2 Storm Kite · Stormwright |
| `kite_t3` | Steel-Ribbed Kite | T3 Storm Kite · Stormwright |
| `kite_t4` | Verdigris Storm-Kite | T4 Storm Kite · Stormwright |
| `kite_t5` | Cobalt Storm-Kite | T5 Storm Kite · Stormwright |
| `mirror_t0` | Tin Mirror | T0 Mirror · Duelist |
| `mirror_t1` | Iron Mirror | T1 Mirror · Duelist |
| `mirror_t2` | Bronze Mirror | T2 Mirror · Duelist |
| `mirror_t3` | Silver Mirror | T3 Mirror · Duelist |
| `mirror_t4` | Verdigris Looking-Glass | T4 Mirror · Duelist |
| `mirror_t5` | Cobalt Looking-Glass | T5 Mirror · Duelist |
| `reliquary_t0` | Pine Reliquary | T0 Reliquary · Summoner |
| `reliquary_t1` | Iron Reliquary | T1 Reliquary · Summoner |
| `reliquary_t2` | Bronze Reliquary | T2 Reliquary · Summoner |
| `reliquary_t3` | Steel Ossuary | T3 Reliquary · Summoner |
| `reliquary_t4` | Verdigris Ossuary | T4 Reliquary · Summoner |
| `reliquary_t5` | Cobalt Catacomb | T5 Reliquary · Summoner |
| `runeward_t0` | Chalk Rune | T0 Rune-Ward · Runeblade |
| `runeward_t1` | Iron Rune-Ward | T1 Rune-Ward · Runeblade |
| `runeward_t2` | Bronze Rune-Ward | T2 Rune-Ward · Runeblade |
| `runeward_t3` | Steel Rune-Ward | T3 Rune-Ward · Runeblade |
| `runeward_t4` | Verdigris Aegis-Rune | T4 Rune-Ward · Runeblade |
| `runeward_t5` | Cobalt Aegis-Rune | T5 Rune-Ward · Runeblade |
| `seal_t0` | Rust Seal | T0 Oath-Seal · Forge Knight |
| `seal_t1` | Iron Oath-Seal | T1 Oath-Seal · Forge Knight |
| `seal_t2` | Bronze Oath-Seal | T2 Oath-Seal · Forge Knight |
| `seal_t3` | Steel Oath-Seal | T3 Oath-Seal · Forge Knight |
| `seal_t4` | Verdigris Covenant | T4 Oath-Seal · Forge Knight |
| `seal_t5` | Cobalt Covenant | T5 Oath-Seal · Forge Knight |
| `stopwatch_t0` | Tin Stopwatch | T0 Stopwatch · Clockmaker |
| `stopwatch_t1` | Iron Stopwatch | T1 Stopwatch · Clockmaker |
| `stopwatch_t2` | Bronze Stopwatch | T2 Stopwatch · Clockmaker |
| `stopwatch_t3` | Steel Chronometer | T3 Stopwatch · Clockmaker |
| `stopwatch_t4` | Verdigris Chronometer | T4 Stopwatch · Clockmaker |
| `stopwatch_t5` | Cobalt Hourglass | T5 Stopwatch · Clockmaker |

### Tiered armour

| Id | Name | Kind |
| --- | --- | --- |
| `heavy_t0` | Rusted Mail | T0 Heavy Armor · Brawler, Forge Knight |
| `heavy_t1` | Iron Hauberk | T1 Heavy Armor · Brawler, Forge Knight |
| `heavy_t2` | Barnacle Plate | T2 Heavy Armor · Brawler, Forge Knight |
| `heavy_t3` | Bogiron Cuirass | T3 Heavy Armor · Brawler, Forge Knight |
| `heavy_t4` | Runeplate | T4 Heavy Armor · Brawler, Forge Knight |
| `heavy_t5` | Emberforged Plate | T5 Heavy Armor · Brawler, Forge Knight |
| `heavy_t6` | Glassguard Armor | T6 Heavy Armor · Brawler, Forge Knight |
| `heavy_t7` | Gilded Penance Plate | T7 Heavy Armor · Brawler, Forge Knight |
| `heavy_t8` | Hollow Thane's Mail | T8 Heavy Armor · Brawler, Forge Knight |
| `heavy_t9` | Anvilheart Plate | T9 Heavy Armor · Brawler, Forge Knight |
| `heavy_t10` | Godshard Bulwark | T10 Heavy Armor · Brawler, Forge Knight |
| `heavy_t11` | Plate of the Unstruck | T11 Heavy Armor · Brawler, Forge Knight |
| `leather_t0` | Ragged Jerkin | T0 Leather Armor · Harpooner, Duelist, Runeblade |
| `leather_t1` | Tanned Leathers | T1 Leather Armor · Harpooner, Duelist, Runeblade |
| `leather_t2` | Sealskin Coat | T2 Leather Armor · Harpooner, Duelist, Runeblade |
| `leather_t3` | Bogtoad Hide | T3 Leather Armor · Harpooner, Duelist, Runeblade |
| `leather_t4` | Runestitched Leather | T4 Leather Armor · Harpooner, Duelist, Runeblade |
| `leather_t5` | Embertanned Armor | T5 Leather Armor · Harpooner, Duelist, Runeblade |
| `leather_t6` | Glasshide Vest | T6 Leather Armor · Harpooner, Duelist, Runeblade |
| `leather_t7` | Gilded Leathers | T7 Leather Armor · Harpooner, Duelist, Runeblade |
| `leather_t8` | Hollowhide Armor | T8 Leather Armor · Harpooner, Duelist, Runeblade |
| `leather_t9` | Stormwyrm Hide | T9 Leather Armor · Harpooner, Duelist, Runeblade |
| `leather_t10` | Godshard Leathers | T10 Leather Armor · Harpooner, Duelist, Runeblade |
| `leather_t11` | Skin of the Unstruck | T11 Leather Armor · Harpooner, Duelist, Runeblade |
| `robe_t0` | Novice's Robe | T0 Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `robe_t1` | Linen Robe | T1 Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `robe_t2` | Tidewoven Robe | T2 Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `robe_t3` | Bogmoss Robe | T3 Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `robe_t4` | Runeweave Robe | T4 Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `robe_t5` | Ember Robe | T5 Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `robe_t6` | Prismsilk Robe | T6 Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `robe_t7` | Gilded Vestments | T7 Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `robe_t8` | Hollow Shroud | T8 Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `robe_t9` | Starweave Robe | T9 Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `robe_t10` | Godshard Raiment | T10 Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `robe_t11` | Robe of the Unstruck | T11 Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |

### Tiered rings

| Id | Name | Kind |
| --- | --- | --- |
| `ring_hp_t0` | Rust Band of Life | T0 Ring |
| `ring_mp_t0` | Rust Band of Mana | T0 Ring |
| `ring_att_t0` | Rust Band of Attack | T0 Ring |
| `ring_def_t0` | Rust Band of Defense | T0 Ring |
| `ring_spd_t0` | Rust Band of Speed | T0 Ring |
| `ring_dex_t0` | Rust Band of Dexterity | T0 Ring |
| `ring_vit_t0` | Rust Band of Vitality | T0 Ring |
| `ring_wis_t0` | Rust Band of Wisdom | T0 Ring |
| `ring_hp_t1` | Iron Band of Life | T1 Ring |
| `ring_mp_t1` | Iron Band of Mana | T1 Ring |
| `ring_att_t1` | Iron Band of Attack | T1 Ring |
| `ring_def_t1` | Iron Band of Defense | T1 Ring |
| `ring_spd_t1` | Iron Band of Speed | T1 Ring |
| `ring_dex_t1` | Iron Band of Dexterity | T1 Ring |
| `ring_vit_t1` | Iron Band of Vitality | T1 Ring |
| `ring_wis_t1` | Iron Band of Wisdom | T1 Ring |
| `ring_hp_t2` | Bronze Band of Life | T2 Ring |
| `ring_mp_t2` | Bronze Band of Mana | T2 Ring |
| `ring_att_t2` | Bronze Band of Attack | T2 Ring |
| `ring_def_t2` | Bronze Band of Defense | T2 Ring |
| `ring_spd_t2` | Bronze Band of Speed | T2 Ring |
| `ring_dex_t2` | Bronze Band of Dexterity | T2 Ring |
| `ring_vit_t2` | Bronze Band of Vitality | T2 Ring |
| `ring_wis_t2` | Bronze Band of Wisdom | T2 Ring |
| `ring_hp_t3` | Steel Band of Life | T3 Ring |
| `ring_mp_t3` | Steel Band of Mana | T3 Ring |
| `ring_att_t3` | Steel Band of Attack | T3 Ring |
| `ring_def_t3` | Steel Band of Defense | T3 Ring |
| `ring_spd_t3` | Steel Band of Speed | T3 Ring |
| `ring_dex_t3` | Steel Band of Dexterity | T3 Ring |
| `ring_vit_t3` | Steel Band of Vitality | T3 Ring |
| `ring_wis_t3` | Steel Band of Wisdom | T3 Ring |
| `ring_hp_t4` | Verdigris Band of Life | T4 Ring |
| `ring_mp_t4` | Verdigris Band of Mana | T4 Ring |
| `ring_att_t4` | Verdigris Band of Attack | T4 Ring |
| `ring_def_t4` | Verdigris Band of Defense | T4 Ring |
| `ring_spd_t4` | Verdigris Band of Speed | T4 Ring |
| `ring_dex_t4` | Verdigris Band of Dexterity | T4 Ring |
| `ring_vit_t4` | Verdigris Band of Vitality | T4 Ring |
| `ring_wis_t4` | Verdigris Band of Wisdom | T4 Ring |
| `ring_hp_t5` | Cobalt Band of Life | T5 Ring |
| `ring_mp_t5` | Cobalt Band of Mana | T5 Ring |
| `ring_att_t5` | Cobalt Band of Attack | T5 Ring |
| `ring_def_t5` | Cobalt Band of Defense | T5 Ring |
| `ring_spd_t5` | Cobalt Band of Speed | T5 Ring |
| `ring_dex_t5` | Cobalt Band of Dexterity | T5 Ring |
| `ring_vit_t5` | Cobalt Band of Vitality | T5 Ring |
| `ring_wis_t5` | Cobalt Band of Wisdom | T5 Ring |

### Potions and consumables

| Id | Name | Kind |
| --- | --- | --- |
| `pot_hp` | Draught of Embers | Consumable |
| `pot_mp` | Draught of Tides | Consumable |
| `stat_hp` | Heartstone Tincture | Consumable |
| `stat_mp` | Wellspring Tincture | Consumable |
| `stat_att` | Tincture of Wrath | Consumable |
| `stat_def` | Tincture of Iron | Consumable |
| `stat_spd` | Tincture of Gales | Consumable |
| `stat_dex` | Tincture of Hands | Consumable |
| `stat_vit` | Tincture of Marrow | Consumable |
| `stat_wis` | Tincture of Runes | Consumable |
| `pet_egg_common` | Speckled Pet Egg | Consumable |
| `pet_egg_uncommon` | Mossy Pet Egg | Consumable |
| `pet_egg_rare` | Azure Pet Egg | Consumable |
| `pet_egg_legendary` | Gilded Pet Egg | Consumable |
| `key_chapel` | Sunken Chapel Key | Consumable |
| `key_crypt` | Sunken Crypt Key | Consumable |
| `key_forge` | Drowned Forge Key | Consumable |
| `key_ember` | Emberforge Key | Consumable |
| `key_scriptorium` | Scriptorium Key | Consumable |
| `key_heart` | Key to the Heart | Consumable |
| `key_throne` | Key to the Throne | Consumable |
| `key_hive` | Honeyed Hollow Key | Consumable |
| `key_theatre` | Theatre Ticket | Consumable |
| `key_spire` | Lighthouse Key | Consumable |
| `key_dream` | Key of Dreams | Consumable |
| `vault_chest` | Vault Chest | Consumable |
| `backpack` | Pilgrim's Satchel | Consumable · Character upgrade |
| `old_boot` | An Old Boot | Consumable |
| `river_fish` | A Pond Fish | Consumable |
| `golden_carp` | The Golden Carp | Consumable |
| `mystery_box` | A Suspicious Box | Consumable |

## Enchantments

Any gear id can carry enchantments: `ID~CODE` or `ID~CODE.CODE`, where CODE is the key below plus a grade 1-3
(uniques always use 1). Example: `/give gauntlet_t7~keen3.burning2`, `/give plate_t9~phoenix1`.

| Key | Name word | Fits | Effect (grade I) |
| --- | --- | --- | --- |
| `hp` | Hearty | weapon, ability, armor, ring | +20 Life |
| `mp` | Brimming | weapon, ability, armor, ring | +20 Mana |
| `att` | Mighty | weapon, ability, armor, ring | +2 Attack |
| `def` | Sturdy | weapon, ability, armor, ring | +2 Defense |
| `spd` | Swift | weapon, ability, armor, ring | +2 Speed |
| `dex` | Nimble | weapon, ability, armor, ring | +2 Dexterity |
| `vit` | Hale | weapon, ability, armor, ring | +2 Vitality |
| `wis` | Wise | weapon, ability, armor, ring | +2 Wisdom |
| `keen` | Keen | weapon | 8% chance to deal double damage |
| `sharp` | Honed | weapon | +6% weapon damage |
| `burning` | Burning | weapon | Hits ignite: 25/s for 3s |
| `frost` | Frosted | weapon | Hits slow by 20% |
| `vampiric` | Vampiric | weapon | Lifesteal 2% |
| `arcing` | Arcing | weapon | Arcs to 1 more enemy (50%) |
| `volatile` | Volatile | weapon | Explodes on hit (20%) |
| `thrifty` | Thrifty | ability | Costs 10% less Mana |
| `potent` | Potent | ability | +12% ability damage |
| `evasive` | Evasive | armor, ring | 3% chance to dodge a hit |
| `warded` | Warded | armor | Blocks one hit every 14s |
| `mending` | Mending | armor, ring | Below 35% Life: regenerate 15/s |
| `feasting` | Feasting | armor, ring, weapon | Kills heal 5 Life |
| `soulful` | Soulful | armor, ring, ability | Kills restore 2 Mana |
| `restless` | Restless | armor, ring | +5% damage while moving |
| `thorned` | Thorned | armor | When hit, ignites enemies around you (20/s) |
| `furious` | Furious | ring, weapon | Up to +10% damage as your Life drops |
| `shardsong` | Shardsinging | armor, ring | ★ Every 5s a ring of 8 glass shards bursts from you |
| `smoulder` | Smouldering | armor | ★ Aura: 40/s fire to enemies within 2.4 tiles |
| `gravedust` | Gravedust | weapon, ring | ★ Kills burst into shrapnel |
| `phoenix` | Phoenix | armor, ring | ★ Cheat death once every 120s |
| `headsman` | Headsman's | weapon | ★ +30% damage to enemies below 30% Life |
