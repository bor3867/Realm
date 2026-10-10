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
| `/boss ID` | Spawns a realm boss here (realm only); drowned_abbot / fallen_heart / unstruck / the_archivist / the_unstruck_god / tidebound_lich / forgeheart_colossus take you to their dungeon boss |
| `/bx ID` | Spawns a Realm Update three-phase boss beside you, anywhere (ids under Realm Update bosses). `/bx` alone lists them |
| `/kraken` | The Abyssal Kraken rises on the Drowned Shore now (its reef and all), and puts you at the edge. Step in to wake it (realm only) |
| `/treant` | The Thornheart Treant wakes in the Thornwood now (its clearing and ring of elders), and puts you at the edge (realm only) |
| `/melon` | A Giant Watermelon plops down beside you (realm only; one at a time) |
| `/bosses` | Lists boss ids |
| `/event BIOME` | Starts a herald event in a biome (realm only; the four original lands) |
| `/star` | A star falls in Godfall: the Fallen Star climbs out of the crater (realm only) |
| `/seals` | Breaks every seal on a dungeon boss gate |
| `/keys [DUNGEON] [N]` | Gives you a key for every dungeon (or N keys for one). Use a key in the Nexus or Realm to open the portal to that dungeon |
| `/adminchest [N]` | Conjures up to 5 admin chests near you (realm or dungeon). Break one for top-tier gear, three relics, a likely mythic and a chance at the crown |
| `/pet [LINE] [RARITY] [max]` | Adds a pet of a line (max = every ability at its cap, so a Divine max pet is in its divine form). Lines and rarities are listed under Pets |
| `/progress BIOME N` | Sets herald progress toward that biome's realm boss |
| `/tp WHERE` | Teleports: any land (shore, fen, runeholt, godfall, dunes, thornwood, steppe, lowlands), realm, nexus, a dungeon id, or X Y |
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

- Lands (`/tp`): `shore` (the Drowned Shore), `fen` (Ashfen), `runeholt`, `godfall`, `dunes` (the Saltglass Dunes), `thornwood`, `steppe` (the Crystal Steppe), `lowlands` (the Greenmarch). `/event` and `/progress` take the first four
- Dungeons (`/tp`, `/portal`): `chapel`, `forge`, `heart`, `scriptorium`, `throne`, `frostveil`, `mirerot`, `astral`, `sandscour`, `keep`, `hollowmoon`, `crypt`, `ember`, `hive`, `theatre`, `spire`, `dream`
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
| `frostveil` | Frostveil Hollows | mid | none | chill builds in frigid water and frost (freeze at 100); braziers thaw you; ice floors slide | `key_frostveil` | Glacius, the Frozen Wyrm |
| `mirerot` | Mirerot Grotto | mid | none | dark; spore pods burst into poison clouds (shoot them from range); bog slows you | `key_mirerot` | Mother Mycelia |
| `astral` | The Astral Observatory | high | none | void (fall through); turning clockwork bridges; rune circles fold you between rooms | `key_astral` | The Grand Orrery |
| `sandscour` | Sandscour Tomb | low-mid | none | quicksand drags you; urns may hold scarabs; sarcophagi open as you pass | `key_sandscour` | The Gilded Sphinx |
| `keep` | The Crimson Keep | mid-high | none | the dark: coffins open and thralls are strong outside candlelight; statues wake | `key_keep` | Count Vesper, the Crimson Count |
| `hollowmoon` | Hollowmoon Carnival | high | none | spin tiles turn your feet; jack crates bite; cannons and strikers; ghouls walk through walls | `key_hollowmoon` | The Grinning Ringmaster |
| `crypt` | The Sunken Crypt | mid | none | the drowning dark; restless sarcophagi wake as you pass | `key_crypt` | The Tidebound Lich |
| `ember` | The Emberforge Depths | high | two wardens, the pressure plates and a lever | falling cinders; ember vents erupt | `key_ember` | The Forgeheart Colossus |
| `hive` | The Honeyed Hollow | low | none | honey floors halve your speed | `key_hive` | Queen Melliflua, the Honeyed Mother |
| `theatre` | The Gilded Marionette Theatre | mid | carry the three lost masks (Comedy, Tragedy, Silence) to the stand before the stage | spotlights: caught in one, every puppet in the room fires faster | `key_theatre` | Maestro Lucan, the Puppeteer |
| `spire` | The Prism Lighthouse | high | three mirror chambers: turn the mirrors (F) to bend the beam onto each crystal | lens sentries fire along their sight-line | `key_spire` | Aurelia, the Prism Wyrm |
| `dream` | The Sleeper's Dream | endgame | survive three nightmare trials (the bridges vanish until you do) | bridges fade (fall through: -15% life) | `key_dream` | The Sleeper, Who Dreams the Realm |

### The newer dungeons' bosses

- **Queen Melliflua, the Honeyed Mother** (`honey_queen`, 52,000 life, 3 phases): Hex-stings, a jittering bee swarm, a figure-eight waggle dance, honey rain that leaves sticky puddles, brood cells that hatch unless broken. Relics: `queens_stinger` (12%), `honeyguard_band` (10%). Plus a 0.2% chance at each mythic (25).
- **Maestro Lucan, the Puppeteer** (`the_puppeteer`, 140,000 life, 3 phases): Trapdoors drop open under the stage (the last always near you) in a ring of ribbons; curtains close from both wings, scissor-lines snap shut, a mirror-puppet answers your every shot; an intermission hands the stage to his understudies. Relics: `maestros_baton` (10%), `the_last_curtain` (10%), `stringcutter` (8%). Plus a 0.6% chance at each mythic (25).
- **Aurelia, the Prism Wyrm** (`prism_wyrm`, 380,000 life, 3 phases): Glass (immune) unless a lens pedestal beam is on her: stand on one (it overheats after 5s). Her images block the beam; burn them. Last phase: hold the light over 2s and she overcharges. Relics: `wyrmglass_wand` (10%), `prismglass_mantle` (10%), `the_seventh_colour` (7%). Plus a 1.2% chance at each mythic (25).
- **The Sleeper, Who Dreams the Realm** (`the_sleeper`, 520,000 life, 4 phases): Stand still and you fall asleep. Dream-shift: its body is immune, strike its nightmare-self. Dream-logic inverts your controls. At 10% it will not wake until you ring the three alarms (F). Relics: `lullaby_staff` (10%), `nightlight_ring` (10%), `the_waking_bell` (7%). Plus a 1.9% chance at each mythic (25).

## Pets

- Lines (`/pet LINE`): each grows baby → evolved (main ability 30) → divine (main ability 100), and is named for its form.

| Line id | Family | Forms | Leans to |
| --- | --- | --- | --- |
| `bubblefin` | Aquatic | Bubblefin → Spinefin → Sovereign Puffer | Life |
| `coral_seahorse` | Aquatic | Coral Seahorse → Reef Seahorse → Tidecrown Seahorse | Mana |
| `owlet` | Avian | Owlet → Great Owl → Starwise Owl | Mana |
| `ember_chick` | Avian | Ember Chick → Firebird → Phoenix | Life |
| `shiba_pup` | Canine | Shiba Pup → Shiba → Sun Shiba | Life |
| `frost_fox` | Canine | Frost Fox → Snow Fox → Aurora Kitsune | Mana |
| `calico_kitten` | Feline | Calico Kitten → Calico Cat → Lucky Cat | Life |
| `shadow_lynx` | Feline | Shadow Lynx → Night Lynx → Eclipse Lynx | Mana |
| `wisp_ghost` | Spooky | Wisp Ghost → Phantom → Grand Wraith | Mana |
| `lantern_bat` | Spooky | Lantern Bat → Lantern Wing → Moonwing | Mana |
| `mossling` | Woodland | Mossling → Moss Golem → Grove Guardian | Life |
| `acorn_squirrel` | Woodland | Acorn Squirrel → Oak Squirrel → Celestial Squirrel | both |
| `jade_gecko` | Reptile | Jade Gecko → Jade Lizard → Jade Dragon | Life |
| `tiny_drake` | Reptile | Tiny Drake → Drakeling → Elder Drake | Life |
| `glow_beetle` | Insect | Glow Beetle → Lumen Beetle → Stag Titan | Life |
| `moth_sprite` | Insect | Moth Sprite → Luna Moth → Solar Moth | Mana |
| `gear_pup` | Automaton | Gear Pup → Clockwork Hound → Titan Hound | Life |
| `brass_bot` | Automaton | Brass Bot → Brass Knight → Brass Colossus | Mana |
| `mimic_chest` | Exotic | Mimic Chest → Treasure Mimic → King Mimic | Mana |
| `pocket_yeti` | Exotic | Pocket Yeti → Yeti → Yeti Lord | Life |

- Rarities (`/pet LINE RARITY`): `common` (cap 30, hatches at 1), `uncommon` (cap 50, hatches at 5), `rare` (cap 70, hatches at 10), `legendary` (cap 90, hatches at 20), `divine` (cap 100, hatches at 30)
- Abilities: Heal (Life) and Magic Heal (Mana) for every pet; Shield (a ward) from Rare up. Feed gear at the Petkeeper (gold or fame); a meal splits 100% / 65% / 35% between the main, second and third ability. Crossing a form plays its evolution.
- Fusing: two pets of the same rarity whose **main** ability is at the cap fuse into one of the next rarity. Pay gold (common 600, uncommon 2500, rare 7500, legendary 20000) or fame (common 20, uncommon 60, rare 150, legendary 400). Pick which line to keep; every ability keeps the better level.
- Rare and up glitter; the name shows the rarity colour. The sidebar's **Pet** tab shows your companion's abilities, levels and next heal.
- Eggs (`/give egg_FAMILY_RARITY`, e.g. `egg_avian_rare`): families `aquatic`, `avian`, `canine`, `feline`, `spooky`, `woodland`, `reptile`, `insect`, `automaton`, `exotic`; rarities `common`, `uncommon`, `rare`, `legendary`, `divine`. Use one to hatch it at your feet. Divine eggs drop only from the Unstruck God. (The old `pet_egg_RARITY` eggs still work and turn into family eggs when a save loads.)

## Realm Update bosses (three phases)

Every one has three phases (it changes at 66% and 33%, immune while it does) and mechanics no other boss shares; each phase also has its own pressure layer firing under its main attacks. The hardest three (Glacius, the Grand Orrery, the Forgeheart Colossus) end with a finale you can only dodge. Spawn any of them beside you with `/bx ID`.

| Id | Name | Where | Life | Phases | Finale | Fight it | Legendary (phase-3 kill) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `abyssal_kraken` | The Abyssal Kraken | realm event, the Drowned Shore | 36,000 | Surfaced → Enraged → Leviathan | - | `/kraken` | `leviathan_eye` (1.5%) |
| `thornheart_treant` | The Thornheart Treant | realm event, the Thornwood | 30,000 | Ancient → Autumn → Withered | - | `/treant` | `blight_heart` (1.5%) |
| `glacius_frozen_wyrm` | Glacius, the Frozen Wyrm | dungeon: frostveil | 300,000 | Coiled Hoard → Unfurled → Shattered Heart | **Absolute Zero** at 12%: survive 10s, then it's broken (+50% damage taken) | `/tp frostveil` | `aurora_heart` (2%) |
| `mother_mycelia` | Mother Mycelia | dungeon: mirerot | 95,000 | Bloom → Rot → Sporestorm | - | `/tp mirerot` | `glowcap_crown` (2%) |
| `grand_orrery` | The Grand Orrery | dungeon: astral | 380,000 | Aligned → Eclipse → Collapse | **Collapse** at 12%: survive 12s, then it's broken (+50% damage taken) | `/tp astral` | `event_horizon` (2%) |
| `gilded_sphinx` | The Gilded Sphinx | dungeon: sandscour | 85,000 | Guardian → Ascendant → Sandstorm Pharaoh | - | `/tp sandscour` | `pharaohs_deathmask` (2%) |
| `count_vesper` | Count Vesper, the Crimson Count | dungeon: keep | 200,000 | Nobleman → Batstorm → Blood Beast | - | `/tp keep` | `nightfall_scythe` (2%) |
| `grinning_ringmaster` | The Grinning Ringmaster | dungeon: hollowmoon | 240,000 | Showman → Puppeteer → Big Top | - | `/tp hollowmoon` | `grinning_mask` (2%) |
| `tidebound_lich` | The Tidebound Lich | dungeon: crypt | 180,000 | Drowned King → Soulbinder → Tidewraith | - | `/tp crypt` | `tidewraith_staff` (2%) |
| `forgeheart_colossus` | The Forgeheart Colossus | dungeon: ember | 520,000 | Forge Sentinel → Overheat → Molten Core | **Meltdown** at 12%: survive 12s, then it's broken (+50% damage taken) | `/tp ember` | `forgeheart_maul` (2%) |

- **The Abyssal Kraken**: Ink that blots your view; hooked arms that bend as they fly; a drifting whirlpool that drags you; lures joined by chain lightning. Relics: `tidebreaker_trident` (12%), `abyssal_pearl` (12%).
- **The Thornheart Treant**: Seeds that mark the ground and burst; burning leaves that sway down; acorn bombs; thorn walls closing from both sides; wisps from the trees. Relics: `heartwood_bow` (12%), `seed_of_renewal` (12%).
- **Glacius, the Frozen Wyrm**: A sweeping breath; lances that freeze the ground; drifting orbs; a gust that slides you; a glide that leaves a fence of lances; spiral-gap rings; braziers it puts out. Relics: `glacial_fang` (10%), `rimeheart_bow` (10%), `wand_of_hoarfrost` (10%), `frostweave_armor` (10%), `ring_of_the_wyrm` (10%).
- **Mother Mycelia**: Spore clouds that hang; poison needles; acid pools; a lunge and bite; seeds that sprout minions unless shot; orbs that curl outward. Relics: `bog_cleaver` (10%), `sporecaller_wand` (10%), `mycelial_hide` (10%), `ring_of_rot` (10%), `spore_bomb` (10%).
- **The Grand Orrery**: Orbiting rings that fly off on tangents; a conjunction that freezes every shot then fires them at you; a moving umbra; a gravity well; debris on marked spots. Relics: `starforged_katana` (10%), `comet_bow` (10%), `nebula_robe` (10%), `astral_signet` (10%), `orrery_orb` (10%).
- **The Gilded Sphinx**: Crossing crescent fans; riddle glyphs that hang then dart; pinwheel sunbursts; feather fans that narrow to a spear; the sandstorm; dust devils that throw you; scarabs. Relics: `sunscorch_khopesh` (10%), `gilded_scepter` (10%), `embalmers_wraps` (10%), `scarab_ring` (10%), `sphinx_helm` (10%).
- **Count Vesper, the Crimson Count**: Healing thralls that burn in candlelight; a hedge of thorns; weaving bat fans; scythes that wheel back; an afterimage dash; blood rain that pools. Relics: `crimson_rapier` (10%), `bloodthorn_staff` (10%), `batwing_bow` (10%), `sanguine_cloak` (10%), `signet_of_the_count` (10%), `crimson_chalice` (10%).
- **The Grinning Ringmaster**: Drum leaps that ring out bursts; two jester marionettes he re-strings; arcing pins; needle lines; the tent with lantern-eye weak points; confetti bombs. Relics: `ringmaster_cane` (10%), `jugglers_dagger` (10%), `carousel_bow` (10%), `harlequin_garb` (10%), `ring_of_the_jester` (10%), `trick_deck` (10%).
- **The Tidebound Lich**: Bolts that bend with the current; coral that splinters; souls that chase you then fly home; a turning soul cage; the tide from every wall; plus his swap, the dark and the grave call. Relics: `tidecaller_blade` (10%), `staff_of_drowned_stars` (10%), `hexsilk_robe` (10%), `ring_of_tides` (10%), `soul_lantern` (8%), `grimoire_of_ash` (6%).
- **The Forgeheart Colossus**: Half-ring slams; ricocheting rivets; skipping slag; vent columns; rolling magma that leaves lava; quake rings; a core that throws shots back. Relics: `emberbrand_greatsword` (10%), `cinderwood_staff` (10%), `runeplate_armor` (10%), `emberheart_ring` (10%), `colossus_core` (8%), `runic_aegis` (6%).

## Realm events

- **The Abyssal Kraken** (`/kraken`): rises from a reef on the Drowned Shore; asleep until you step into its pool.
- **The Thornheart Treant** (`/treant`): wakes in a clearing ringed by elder trees in the Thornwood.
- **The Giant Watermelon** (`/melon`, `giant_watermelon`): a rare harmless event; break it for melon gear and slices (they heal over time).
- **The Fallen Star** (`/star`): a star falls in Godfall and the Fallen Star climbs out of the crater.
- **Herald events** (`/event BIOME`, `/progress BIOME N`): enough of them in a land summons its realm boss.

## Elites

One per 18 monster groups in each land, with an escort, a gold nameplate and one ability on a cooldown (the clip is the telegraph). Better loot and a raised egg chance. Spawn one with `/spawn ID`.

| Id | Name | Land | Life | Ability |
| --- | --- | --- | --- | --- |
| `reef_golem` | Reef Golem | shore | 1,800 | Coral Bulwark: invulnerable 4s |
| `siren` | Siren | shore | 1,800 | Siren Song: you move at 60% inside her ring |
| `goblin_shaman` | Goblin Shaman | lowlands | 2,800 | Spirit Totem: heals goblins |
| `bramble_bear` | Bramble Bear | lowlands | 2,800 | Thorn Roar: two rings of 24 thorns |
| `orc_warlord` | Orc Warlord | thornwood | 6,000 | War Banner: nearby orcs faster and tougher |
| `spider_queen` | Spider Queen | thornwood | 6,000 | Brood: three spiderlings |
| `storm_gryphon` | Storm Gryphon | runeholt, steppe | 10,000 | Thunder Dive: a line, then it dives through you |
| `rock_troll` | Rock Troll | runeholt, steppe | 10,000 | Burrow: a mound chases you, then erupts |
| `void_seer` | Void Seer | godfall | 18,000 | Blink: re-forms 4-6 tiles from you |
| `abyss_hound` | Abyss Hound | godfall | 18,000 | Shadow Dash: lunges 6 tiles |

## Legendaries

Ten items, each dropped only by its boss's phase-3 kill. Pale-gold slot, tag **L**; their bag gets a broad gold beam and "A LEGENDARY drops!". (Stats: docs/design/06_items.md.)

| Id | Name | Kind | From |
| --- | --- | --- | --- |
| `leviathan_eye` | The Leviathan Eye | Untiered Ring | The Abyssal Kraken (1.5%) |
| `blight_heart` | The Blight Heart | Untiered Ring | The Thornheart Treant (1.5%) |
| `aurora_heart` | The Aurora Heart | Untiered Ring | Glacius, the Frozen Wyrm (2%) |
| `glowcap_crown` | The Glowcap Crown | Untiered Ring | Mother Mycelia (2%) |
| `event_horizon` | Event Horizon | Untiered Ring | The Grand Orrery (2%) |
| `pharaohs_deathmask` | The Pharaoh's Deathmask | Untiered Ring | The Gilded Sphinx (2%) |
| `nightfall_scythe` | The Nightfall Scythe | Untiered Sword · Brawler, Forge Knight, Runeblade | Count Vesper, the Crimson Count (2%) |
| `grinning_mask` | The Grinning Mask | Untiered Ring | The Grinning Ringmaster (2%) |
| `tidewraith_staff` | The Tidewraith Staff | Untiered Staff · Summoner, Stormwright, Hexweaver | The Tidebound Lich (2%) |
| `forgeheart_maul` | The Forgeheart Maul | Untiered Sword · Brawler, Forge Knight, Runeblade | The Forgeheart Colossus (2%) |

## Bosses

| Id | Name | Where | Life | How to summon |
| --- | --- | --- | --- | --- |
| `brine_cathedral` | The Brine Cathedral | shore | 28,000 | /boss brine_cathedral |
| `wick_mother` | The Wick-Mother | fen | 60,000 | /boss wick_mother |
| `orrery_of_winter` | The Rime Astrolabe | runeholt | 104,000 | /boss orrery_of_winter |
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
| `the_puppeteer` | Maestro Lucan, the Puppeteer | dungeon: theatre | 140,000 | /tp theatre |
| `prism_wyrm` | Aurelia, the Prism Wyrm | dungeon: spire | 380,000 | /tp spire |
| `the_sleeper` | The Sleeper, Who Dreams the Realm | dungeon: dream | 520,000 | /tp dream |
| `unstruck` | The Unstruck | dungeon: forge | 168,000 | /boss unstruck |

The Crypt's Lich and the Emberforge's Colossus now fight on the three-phase framework (see Realm Update bosses); their old entries above are kept for reference.

## Enemies

Use with `/spawn ID [N]`.

### shore

| Id | Name | Life | Notes |
| --- | --- | --- | --- |
| `brine_slimelet` | Brine Slimelet | 70 | moves: skitter |
| `gull` | Gull | 70 | flies, moves: swoop |
| `lens_moth` | Lens Moth | 80 | flies, moves: zigzag |
| `lantern_jelly` | Lantern Jelly | 85 | flies, moves: float |
| `trap_hound` | Trap-Hound | 90 | moves: zigzag |
| `driftwood_bandit` | Driftwood Bandit | 100 | moves: flank |
| `brine_pilgrim` | Brine Pilgrim | 110 | moves: shamble |
| `shore_crab` | Shore Crab | 120 | moves: skitter |
| `salt_widow` | Salt Widow | 140 | moves: kite |
| `tide_slime` | Tide Slime | 140 | moves: hop |
| `anchor_bearer` | Anchor-Bearer | 150 | moves: hop |
| `reef_eel` | Reef Eel | 160 | moves: burrow |
| `conch_hermit` | Conch Hermit | 160 | moves: shamble |
| `brine_slime` | Brine Slime | 300 | moves: hop |
| `moth_queen` | Lens Moth Queen | 400 | champion, flies, moves: swoop |
| `lighthouse_jelly` | The Lighthouse Jelly | 425 | champion, flies, moves: float |
| `trap_hound_alpha` | Trap-Hound Alpha | 450 | champion, moves: zigzag |
| `pilgrim_elder` | Pilgrim Elder | 650 | champion, moves: shamble |
| `salt_matriarch` | Salt Matriarch | 700 | champion, moves: kite |
| `anchor_titan` | Anchor Titan | 750 | champion, moves: hop |
| `golden_duck` | The Golden Duck | 1,500 | moves: flee |
| `reef_golem` | Reef Golem | 1,800 | moves: shamble |
| `siren` | Siren | 1,800 | flies, moves: kite |
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
| `cave_bat` | Cave Bat | 500 | flies, moves: zigzag |
| `antlered_hush` | Antlered Hush | 750 | moves: drift |
| `stone_harpy` | Stone Harpy | 750 | flies, moves: swoop |
| `cairn_crawler` | Cairn Crawler | 800 | moves: charge |
| `frost_skald` | Frost Skald | 800 | moves: kite |
| `prayer_monk` | Prayer-Wheel Monk | 900 | moves: kite |
| `frost_wraith` | Frost Wraith | 950 | flies, moves: blink |
| `wolf_shield` | Wolf-Shield | 1,000 | moves: flank |
| `mountain_ram` | Mountain Ram | 1,000 | moves: charge |
| `cairn_mender` | Cairn Mender | 1,100 | moves: kite |
| `crag_dwarf` | Crag Dwarf | 1,100 | moves: flank |
| `frozen_executioner` | Frozen Executioner | 1,150 | moves: shamble |
| `crag_ogre` | Crag Ogre | 1,600 | moves: shamble |
| `elder_hush` | The Elder Hush | 3,750 | champion, moves: drift |
| `saga_singer` | Saga-Singer | 4,000 | champion, moves: kite |
| `wheel_abbot` | Prayer-Wheel Abbot | 4,500 | champion, moves: kite |
| `rune_warden` | Rune-Warden | 4,800 | champion, moves: shamble |
| `shieldwall_pack` | The Shieldwall Pack | 5,000 | champion, moves: flank |
| `glacier_headsman` | Glacier Headsman | 5,750 | champion, moves: hop |
| `storm_gryphon` | Storm Gryphon | 10,000 | flies, moves: swoop |
| `rock_troll` | Rock Troll | 10,000 | moves: shamble |
| `rime_herald` | The Rime Herald | 12,000 | champion, moves: kite |

### godfall

| Id | Name | Life | Notes |
| --- | --- | --- | --- |
| `rift_wraith` | Rift Wraith | 1,600 | flies, moves: blink |
| `cherub_husk` | Cherub Husk | 1,700 | flies, moves: float |
| `gazer` | Gazer | 1,800 | flies, moves: orbit |
| `halo_eater` | Halo-Eater | 1,900 | flies, moves: swoop |
| `ash_harpy` | Ash Harpy | 2,000 | flies, moves: swoop |
| `obsidian_scorpion` | Obsidian Scorpion | 2,000 | moves: skitter |
| `reliquary_spider` | Reliquary Spider | 2,100 | moves: skitter |
| `blood_maw` | Blood Maw | 2,200 | flies, moves: float |
| `hollow_thane` | Hollow Thane | 2,300 | moves: flank |
| `gilded_lancer` | Gilded Lancer | 2,600 | moves: flank |
| `fallen_knight` | Fallen Knight | 2,800 | moves: shamble |
| `choir_engine` | Choir Engine | 3,200 | moves: shamble |
| `censer_magistrate` | Censer-Magistrate | 6,500 | moves: kite |
| `seraph_husk` | Seraph Husk | 8,500 | champion, flies, moves: swoop |
| `fallen_choirmaster` | The Fallen Choirmaster | 9,500 | champion, flies, moves: float |
| `halo_glutton` | The Halo Glutton | 9,500 | champion, flies, moves: swoop |
| `broodmother` | Reliquary Broodmother | 10,500 | champion, moves: skitter |
| `hollow_jarl` | The Hollow Jarl | 11,500 | champion, moves: flank |
| `cathedral_engine` | The Cathedral Engine | 16,000 | champion, moves: shamble |
| `void_seer` | Void Seer | 18,000 | flies, moves: kite |
| `abyss_hound` | Abyss Hound | 18,000 | moves: flank |
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
| `bark_spider` | Bark Spider | 340 | moves: skitter |
| `bandit_archer` | Bandit Archer | 360 | moves: kite |
| `thorn_sprite` | Thorn Sprite | 380 | flies, moves: swoop |
| `forest_druid` | Forest Druid | 400 | moves: kite |
| `spore_puff` | Spore Puff | 450 | moves: drift |
| `bramble_wolf` | Bramble Wolf | 520 | moves: flank |
| `orc_brute` | Orc Brute | 620 | moves: shamble |
| `mossback_turtle` | Mossback Turtle | 900 | moves: shamble |
| `witch_of_briars` | The Witch of Briars | 2,100 | champion, moves: kite |
| `thornwood_stag` | The Thornwood Stag | 2,400 | champion, moves: hop |
| `war_banner` | War Banner | 2,400 | moves: rooted |
| `orc_warlord` | Orc Warlord | 6,000 | moves: shamble |
| `spider_queen` | Spider Queen | 6,000 | moves: skitter |

### steppe

| Id | Name | Life | Notes |
| --- | --- | --- | --- |
| `quartz_jackal` | Quartz Jackal | 800 | moves: flank |
| `shard_crawler` | Shard Crawler | 900 | moves: skitter |
| `prism_hawk` | Prism Hawk | 1,000 | flies, moves: swoop |
| `crystal_golem` | Crystal Golem | 1,500 | moves: shamble |
| `skyglass_seer` | The Skyglass Seer | 5,200 | champion, flies, moves: kite |
| `geode_titan` | The Geode Titan | 6,500 | champion, moves: shamble |

### lowlands

| Id | Name | Life | Notes |
| --- | --- | --- | --- |
| `field_rat` | Field Rat | 130 | moves: skitter |
| `burrow_mole` | Burrow Mole | 180 | moves: burrow |
| `hedge_goblin` | Hedge Goblin | 200 | moves: flank |
| `wild_boar` | Wild Boar | 320 | moves: charge |
| `scarecrow` | The Field Warden | 1,100 | moves: rooted |
| `spirit_totem` | Spirit Totem | 1,800 | moves: rooted |
| `goblin_shaman` | Goblin Shaman | 2,800 | moves: kite |
| `bramble_bear` | Bramble Bear | 2,800 | moves: shamble |

### event

| Id | Name | Life | Notes |
| --- | --- | --- | --- |
| `giant_watermelon` | Giant Watermelon | 4,000 | moves: rooted |

### frostveil

| Id | Name | Life | Notes |
| --- | --- | --- | --- |
| `shardling` | Shardling | 380 | moves: skitter |
| `frost_sprite` | Frost Sprite | 700 | flies, moves: kite |
| `rime_wolf` | Rime Wolf | 800 | moves: flank |
| `glacial_sentinel` | Glacial Sentinel | 2,000 | moves: shamble |

### mirerot

| Id | Name | Life | Notes |
| --- | --- | --- | --- |
| `rot_hornet` | Rot Hornet | 400 | flies, moves: swoop |
| `sporeling` | Sporeling | 420 | moves: shamble |
| `glowcap_sprout` | Glowcap Sprout | 600 | moves: rooted |
| `mire_toad` | Mire Toad | 650 | moves: hop |
| `vine_lasher` | Vine Lasher | 1,300 | moves: rooted |
| `sporeling_clump` | Sporeling Clump | 1,500 | moves: shamble |

### astral

| Id | Name | Life | Notes |
| --- | --- | --- | --- |
| `orrery_drone` | Orrery Drone | 900 | flies, moves: satellite |
| `star_eye` | Star Eye | 1,600 | flies, moves: rooted |
| `constellation_stalker` | Constellation Stalker | 1,800 | moves: blink |
| `void_acolyte` | Void Acolyte | 2,200 | moves: kite |

### sandscour

| Id | Name | Life | Notes |
| --- | --- | --- | --- |
| `tomb_scarab` | Tomb Scarab | 260 | moves: skitter |
| `dune_serpent` | Dune Serpent | 700 | moves: burrow |
| `jackal_warden` | Jackal Warden | 1,100 | moves: flank |
| `sand_mummy` | Sand Mummy | 1,500 | moves: shamble |

### keep

| Id | Name | Life | Notes |
| --- | --- | --- | --- |
| `blood_bat` | Blood Bat | 600 | flies, moves: zigzag |
| `blood_thrall` | Blood Thrall | 1,100 | moves: shamble |
| `gargoyle` | Gargoyle | 1,500 | moves: hop |
| `haunted_armor` | Haunted Armor | 2,600 | moves: shamble |
| `kneeling_thrall` | Kneeling Thrall | 6,000 | moves: rooted |

### hollowmoon

| Id | Name | Life | Notes |
| --- | --- | --- | --- |
| `balloon_ghoul` | Balloon Ghoul | 1,600 | flies, moves: drift |
| `jack_in_the_box` | Jack-in-the-Box | 2,200 | moves: hop |
| `knife_juggler` | Knife Juggler | 2,400 | moves: kite |
| `carousel_horse` | Carousel Horse | 4,000 | moves: carousel |
| `jester_puppet` | Jester Marionette | 9,000 | flies, moves: rooted |

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
| `orrery_seal` | Seal of the Astrolabe | Untiered Oath-Seal · Forge Knight |
| `starless_band` | The Starless Band | Untiered Ring |
| `penitents_head` | The Penitent's Greatsword | Untiered Sword · Brawler, Forge Knight, Runeblade |
| `gilded_penance` | Gilded Penance | Untiered Heavy Armor · Brawler, Forge Knight |
| `heralds_conch` | The Herald's Conch | Untiered Bellows · Brawler |
| `bellringers_rope` | The Bellringer's Rope | Untiered Ring |
| `rime_standard` | Rime Standard Plate | Untiered Heavy Armor · Brawler, Forge Knight |
| `penitents_scourge` | The Penitent's Scourge | Untiered Sword · Brawler, Forge Knight, Runeblade |
| `rose_window_vestment` | Rose Window Vestment | Untiered Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `tallow_tongs` | The Tallow Brand | Untiered Sword · Brawler, Forge Knight, Runeblade |
| `orrery_rod` | The Astrolabe Rod | Untiered Wand · Priest, Clockmaker |
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
| `melon_slicer` | Melon Slicer | Untiered Sword · Brawler, Forge Knight, Runeblade |
| `rindguard` | Rindguard | Untiered Heavy Armor · Brawler, Forge Knight |
| `vinegrown_staff` | Vinegrown Staff | Untiered Staff · Summoner, Stormwright, Hexweaver |
| `seedspitter_bow` | Seedspitter | Untiered Bow · Harpooner |
| `rind_bulwark` | Rind Bulwark | Untiered Oath-Seal · Forge Knight |
| `ring_of_the_rind` | Ring of the Rind | Untiered Ring |
| `honeydew_scepter` | Honeydew Scepter | Untiered Wand · Priest, Clockmaker |
| `dewveil_robe` | Dewveil Robe | Untiered Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `dewdrop_ring` | Dewdrop Ring | Untiered Ring |
| `melon_baller` | Melon Baller | Untiered Dagger · Duelist |
| `golden_honeydew` | The Golden Honeydew | Untiered Ring |
| `tidebreaker_trident` | Tidebreaker Trident | Untiered Staff · Summoner, Stormwright, Hexweaver |
| `abyssal_pearl` | Abyssal Pearl | Untiered Ring |
| `heartwood_bow` | Heartwood Bow | Untiered Bow · Harpooner |
| `seed_of_renewal` | Seed of Renewal | Untiered Ring |
| `glacial_fang` | Glacial Fang | Untiered Dagger · Duelist |
| `rimeheart_bow` | Rimeheart Bow | Untiered Bow · Harpooner |
| `wand_of_hoarfrost` | Wand of Hoarfrost | Untiered Wand · Priest, Clockmaker |
| `frostweave_armor` | Frostweave Robe | Untiered Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `ring_of_the_wyrm` | Ring of the Wyrm | Untiered Ring |
| `bog_cleaver` | Bog Cleaver | Untiered Sword · Brawler, Forge Knight, Runeblade |
| `sporecaller_wand` | Sporecaller Wand | Untiered Wand · Priest, Clockmaker |
| `mycelial_hide` | Mycelial Hide | Untiered Leather Armor · Harpooner, Duelist, Runeblade |
| `ring_of_rot` | Ring of Rot | Untiered Ring |
| `spore_bomb` | Spore Bomb | Untiered Bellows · Brawler |
| `starforged_katana` | Starforged Katana | Untiered Sword · Brawler, Forge Knight, Runeblade |
| `comet_bow` | Comet Bow | Untiered Bow · Harpooner |
| `nebula_robe` | Nebula Robe | Untiered Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `astral_signet` | Astral Signet | Untiered Ring |
| `orrery_orb` | Orrery Orb | Untiered Halo · Priest |
| `sunscorch_khopesh` | Sunscorch Khopesh | Untiered Sword · Brawler, Forge Knight, Runeblade |
| `gilded_scepter` | Gilded Scepter | Untiered Wand · Priest, Clockmaker |
| `embalmers_wraps` | Embalmer's Wraps | Untiered Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `scarab_ring` | Scarab Ring | Untiered Ring |
| `sphinx_helm` | The Sphinx's Crown | Untiered Oath-Seal · Forge Knight |
| `crimson_rapier` | Crimson Rapier | Untiered Dagger · Duelist |
| `bloodthorn_staff` | Bloodthorn Staff | Untiered Staff · Summoner, Stormwright, Hexweaver |
| `batwing_bow` | Batwing Bow | Untiered Bow · Harpooner |
| `sanguine_cloak` | Sanguine Cloak | Untiered Leather Armor · Harpooner, Duelist, Runeblade |
| `signet_of_the_count` | Signet of the Count | Untiered Ring |
| `crimson_chalice` | The Crimson Chalice | Untiered Reliquary · Summoner |
| `ringmaster_cane` | The Ringmaster's Cane | Untiered Wand · Priest, Clockmaker |
| `jugglers_dagger` | Juggler's Dagger | Untiered Dagger · Duelist |
| `carousel_bow` | Carousel Bow | Untiered Bow · Harpooner |
| `harlequin_garb` | Harlequin Garb | Untiered Robe · Priest, Summoner, Stormwright, Clockmaker, Hexweaver |
| `ring_of_the_jester` | Ring of the Jester | Untiered Ring |
| `trick_deck` | The Trick Deck | Untiered Grimoire · Hexweaver |
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
| `watermelon_slice` | Watermelon Slice | Consumable |
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
| `key_frostveil` | Frostveil Key | Consumable |
| `key_mirerot` | Mirerot Key | Consumable |
| `key_astral` | Astral Key | Consumable |
| `key_hollowmoon` | Hollowmoon Ticket | Consumable |
| `key_keep` | Crimson Key | Consumable |
| `key_sandscour` | Sandscour Key | Consumable |
| `vault_chest` | Vault Chest | Consumable |
| `backpack` | Pilgrim's Satchel | Consumable · Character upgrade |
| `old_boot` | An Old Boot | Consumable |
| `river_fish` | A Pond Fish | Consumable |
| `golden_carp` | The Golden Carp | Consumable |
| `mystery_box` | A Suspicious Box | Consumable |

### Pet eggs

Ids are `egg_FAMILY_RARITY`: `aquatic`, `avian`, `canine`, `feline`, `spooky`, `woodland`, `reptile`, `insect`, `automaton`, `exotic` × `common`, `uncommon`, `rare`, `legendary`, `divine` (50 eggs).

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
