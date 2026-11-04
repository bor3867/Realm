# Realm sprites from the user's sheets (2026-11-03)

Source sheets: `art/source/castle3/sheet_realm_a.png` (trees, rocks, chests, beach, plains, parents & children, corrupted
landscape) and `sheet_realm_b.png` (highlands, mountaintops, swamp). Cut by `py -I tools/sheet_crops.py` into
`art/source/castle3/obj/`. Every enemy that takes one of these gets hand-drawn pixel frames (walk and attack), the same
way the castle's enemies were done: no limbs moved apart from the body, nothing rotated or stretched.

## Enemies replaced

| Sheet sprite | Realm enemy | Land |
|---|---|---|
| beach: small red crab | shore_crab | shore |
| beach: big red crab | rf_coral_crab | shore |
| beach: pirate with cutlass | driftwood_bandit | shore |
| beach: hooded tide mage (cyan staff) | tide_herald | shore |
| beach: mermaid with knife | siren | shore (elite) |
| beach: spiked hermit crab | conch_hermit | shore |
| beach: great coral spider-crab | reef_golem | shore (elite) |
| beach: small coral spider-crab | trap_hound | shore |
| plains: grey wolf (large) | bramble_wolf | thornwood |
| plains: red-hooded rogue | hedge_goblin | lowlands |
| plains: red-caped halberdier | fallen_knight | godfall |
| plains: green-hooded shaman | goblin_shaman | lowlands (elite) |
| plains: tusked boar | wild_boar | lowlands |
| plains: moss golem | rock_troll | runeholt / steppe (elite) |
| parents: queen wasp's drones | briar_bee | thornwood |
| parents: mushroom's caps | spore_puff | thornwood |
| parents: antlered stag | thornwood_stag | thornwood (parent) |
| parents: great spider | spider_queen | thornwood (elite) |
| parents: great spider's young | bark_spider | thornwood |
| parents: treant | rf_grove_warden | godfall |
| parents: treant's sprouts | rf_sproutling | godfall |
| highlands: spearman | gilded_lancer | godfall |
| highlands: archer | bandit_archer | thornwood |
| highlands: fur-hooded swordsman | crag_dwarf | runeholt |
| highlands: horned warlord with banner | orc_warlord | thornwood (elite) |
| highlands: dire wolf | abyss_hound | godfall (elite) |
| highlands: stone golem, red core | cinder_golem | ember |
| mountain: crystal golem | crystal_golem | steppe |
| mountain: lava lizard | cairn_crawler | runeholt |
| mountain: lava golem | rf_ash_golem | runeholt |
| mountain: horned warlord | glacier_headsman | runeholt |
| mountain: shield knights | wolf_shield | runeholt |
| mountain: hooded frost mage | rime_herald | runeholt |
| mountain: casting mage | frost_skald | runeholt |
| swamp: hooded shaman (yellow staff) | rf_bog_witch | fen |
| swamp: crocodile | rf_marsh_lurker | fen |
| swamp: willow treant | elder_willow | fen (parent) |

Spare sprites (cut, not yet given to an enemy; yours to place): plains small wolf, plains sprout, the queen wasp, the
mushroom parent, the fawns, highlands lava stag, highlands lava-rock mound, highlands knights, swamp lizardman, swamp
fur spearman, swamp purple spider, swamp small spider, swamp mushroom ogre, swamp spiderlings.

## Landscapes

- Greenmarch (lowlands) and Thornwood: the sheet's green, autumn, red, blossom and pine trees, bushes, flowers, grass,
  mushrooms, stumps, logs; mossy rocks, standing stones, the mossy arch.
- Highlands props go to the Steppe; the snowy pines, icy rocks, frozen arch and dead trees to Runeholt.
- Swamp props (willows, dead trees, reeds, lily pads, the pier, the hanging lantern, glowing mushrooms) to Ashfen.
- Corrupted landscape (red-veined trees, roots, brambles, corrupted rocks and crystals, bones and totems, ruined shrines
  and monoliths, ruins and fences, corruption hazards, corrupted mushrooms) to Godfall.
- Chests: the six chests by tier.

## Realm enemies with no sprite yet (for you to redesign)

shore: brine_pilgrim, lantern_jelly, salt_widow, pilgrim_elder, anchor_bearer, lens_moth, lighthouse_jelly,
salt_matriarch, trap_hound_alpha, anchor_titan, moth_queen, reef_eel, brine_slime, brine_slimelet, tide_slime, gull,
rf_drowned_chorister, kraken_tentacle

fen: bell_taken, peat_saint, mire_choir, lantern_heron, candle_mite, bog_abbess, bog_bellringer, mourning_willow,
grave_leech, great_bell, peat_martyr, mire_chorus, twin_lamp_heron, tallow_matron, leech_prime, bog_toad, gas_bloat,
rf_gravekeeper

runeholt: frozen_executioner, prayer_monk, antlered_hush, rune_warden, saga_singer, shieldwall_pack, frost_wraith,
cairn_mender, stone_harpy, mountain_ram, crag_ogre, cave_bat, storm_gryphon, rf_smelter_imp, rf_frost_wraith,
rf_ice_golem, rf_ashen_acolyte, rf_penitent_wraith, rf_bailiff_automaton, rf_clockwork_clerk, rf_glass_wraith,
rf_prism_sentinel

godfall: hollow_thane, censer_magistrate, halo_eater, choir_engine, fallen_choirmaster, gilded_penitent, cherub_husk,
reliquary_spider, hollow_jarl, halo_glutton, cathedral_engine, seraph_husk, broodmother, ash_harpy, rift_wraith,
blood_maw, gazer, obsidian_scorpion, void_seer, rf_star_wisp, rf_crater_crawler, rf_sun_acolyte, rf_moon_acolyte,
rf_the_unmaker_s_eye, rf_ember_drake, rf_cinder_imp, rf_hollow_knight, rf_crownless_wraith, rf_stagehand_shade,
rf_phantom_usher

dunes: glass_scarab, dune_lurker, salt_mummy, sand_skimmer, glass_sphinx, mirage_caller, rf_dune_stalker, rf_sand_scarab

thornwood: thorn_sprite, witch_of_briars, orc_brute, forest_druid, mossback_turtle, rf_dusk_moth, rf_pale_sprite

steppe: prism_hawk, shard_crawler, quartz_jackal, geode_titan, skyglass_seer, storm_gryphon, rf_gale_harpy,
rf_thunder_hawk, rf_weightless_monk, rf_drifting_bell, rf_hour_warden, rf_sand_wisp, rf_star_cartographer,
rf_comet_hound, rf_vine_creeper, rf_lantern_jack, rf_ink_wraith, rf_paper_crane

lowlands: field_rat, burrow_mole, scarecrow, bramble_bear, rf_sewer_rat, rf_plague_carrier

## Progress

- [x] Sheets cut into native sprites (tools/sheet_crops.py)
- [x] The Drowned Shore (8): shore_crab, rf_coral_crab, driftwood_bandit, tide_herald, siren, conch_hermit, reef_golem, trap_hound (014a1a1)
- [x] The Thornwood and the Greenmarch (11): bramble_wolf, briar_bee, spore_puff, thornwood_stag, spider_queen, bark_spider, bandit_archer, orc_warlord, hedge_goblin, goblin_shaman, wild_boar (30a56e1)
- [x] Runeholt, the Steppe, the ember lands (10) (d3ba3c5); Godfall (5) and Ashfen (3): every one of the 37 matched enemies done (tools/realm_pix.py; one frames file a land)
- [x] Landscapes placed by land (dddfdc8: tools/build_realm_scenery.py, src/world/maps.js STAND; camp chests by tier)
