# Realm admin reference

Type commands in chat (`/` or Enter). Ids use underscores. Regenerate with `node tools/admin_reference.mjs`.

## Commands

| Command | What it does |
| --- | --- |
| `/help` | List the commands in chat |
| `/admin` | Equip the admin kit (old gear goes to your backpack) |
| `/god` | Toggle god mode |
| `/heal` | Refill Life and Mana |
| `/maxlevel` | Level 20 |
| `/level N` | Level up to N |
| `/maxstats` | Every stat to your class maximum |
| `/backpack` | Add the second backpack |
| `/give ITEM [N]` | Give N of an item (id or name; enchanted ids work, see below) |
| `/give dungeon ID` | Give a dungeon boss's whole loot set |
| `/items TEXT` | Search item ids and names |
| `/keys [DUNGEON] [N]` | A key for every dungeon, or N for one |
| `/adminchest [N]` | Up to 5 admin chests (top-tier loot) |
| `/gold N` | Add gold (default 1000) |
| `/essence N` | Add essence |
| `/fame N` | Add account fame (default 100) |
| `/pet [LINE] [RARITY] [max]` | Add a pet (max: every ability capped) |
| `/tp WHERE` | Teleport: a land, `realm`, `nexus`, a dungeon id, or X Y |
| `/portal DUNGEON` | Open a dungeon portal beside you |
| `/seals` | Break every seal on a boss gate |
| `/spawn ID [N]` | Spawn any monster, elite or boss near you |
| `/boss ID` | Spawn an overworld boss (realm), or go to a dungeon boss |
| `/bx ID` | Spawn a three-phase boss beside you (`/bx` alone lists them) |
| `/bosses` | List every boss id |
| `/kraken` | Raise the Abyssal Kraken on the shore (realm) |
| `/treant` | Wake the Thornheart Treant in the Thornwood (realm) |
| `/star` | The Fallen Star lands in Godfall (realm) |
| `/melon` | A Giant Watermelon beside you (realm) |
| `/event LAND` | Start a herald event (shore, fen, runeholt, godfall) |
| `/progress LAND N` | Set herald progress toward that land's boss |
| `/killall` | Kill every enemy within 15 tiles |
| `/clearbags` | Remove all loot bags |
| `/quest [KIND]` | Take a quest: hunt, shrine, camp, herald, fetch, dungeon, rboss |
| `/duck` | Spawn the Golden Duck |
| `/dance` | Dance |

## Places

- Lands: `shore`, `dunes`, `lowlands`, `fen`, `thornwood`, `runeholt`, `steppe`, `godfall`
- Classes: `brawler`, `forge_knight`, `priest`, `summoner`, `harpooner`, `duelist`, `stormwright`, `clockmaker`, `runeblade`, `hexweaver`

## Dungeons

| Stars | Id | Name | Boss |
| --- | --- | --- | --- |
| ★ | `chapel` | The Sunken Chapel | The Drowned Abbot |
| ★ | `hive` | The Honeyed Hollow | Queen Melliflua, the Honeyed Mother |
| ★ | `rf_chapel` | The Sunken Chapel | The Cantor |
| ★ | `rf_oasis` | The Buried Oasis | Sarrukh |
| ★ | `rf_sewers` | The Undersewers | The Gutterlord |
| ★★ | `crypt` | The Sunken Crypt | The Tidebound Lich |
| ★★ | `mirerot` | Mirerot Grotto | Mother Mycelia |
| ★★ | `rf_crypt` | The Sealed Crypt | Gravewarden Mortis |
| ★★ | `rf_glade` | The Moonlit Glade | The Pale Moth Matriarch |
| ★★ | `rf_mire` | Mirewood Hollow | Mother Mire |
| ★★ | `sandscour` | Sandscour Tomb | The Gilded Sphinx |
| ★★★ | `frostveil` | Frostveil Hollows | Glacius, the Frozen Wyrm |
| ★★★ | `keep` | The Crimson Keep | Count Vesper, the Crimson Count |
| ★★★ | `rf_cathedral` | The Burned Cathedral | The Ashen Cardinal |
| ★★★ | `rf_clocktower` | The Clocktower Court | The Brass Magistrate |
| ★★★ | `rf_forge` | The Burned Forge-City | Forgemaster Cinder |
| ★★★ | `rf_mirrors` | The Hall of Mirrors | Vitrea |
| ★★★ | `rf_peaks` | The Stormcrown Peaks | Tempest Roc |
| ★★★ | `rf_unmelting` | The Unmelting | Rime |
| ★★★ | `scriptorium` | The Frozen Scriptorium | The Archivist |
| ★★★ | `theatre` | The Gilded Marionette Theatre | Maestro Lucan, the Puppeteer |
| ★★★★ | `astral` | The Astral Observatory | The Grand Orrery |
| ★★★★ | `forge` | The Drowned Forge | The Unstruck |
| ★★★★ | `hollowmoon` | Hollowmoon Carnival | The Grinning Ringmaster |
| ★★★★ | `rf_atlas` | The Celestial Atlas | Vael |
| ★★★★ | `rf_crater` | The Impact Crater | Astraeus |
| ★★★★ | `rf_patch` | The Hollow Patch | Lord Gourdrick |
| ★★★★ | `rf_pyre` | Pyre Peak | Ignis |
| ★★★★ | `rf_sanctum` | The Sundial Sanctum | Aion |
| ★★★★ | `rf_temple` | Temple of the Twin Moons | The Eclipse Twins |
| ★★★★★ | `dream` | The Sleeper's Dream | The Sleeper, Who Dreams the Realm |
| ★★★★★ | `ember` | The Emberforge Depths | The Forgeheart Colossus |
| ★★★★★ | `heart` | The Heart of Godfall | The Fallen Heart |
| ★★★★★ | `rf_grove` | The Sworn Grove | Elderbark |
| ★★★★★ | `rf_keep` | Duskmourne Keep | King Morvane |
| ★★★★★ | `rf_monastery` | The Upturned Monastery | Abbot Ossian |
| ★★★★★ | `rf_paper` | The Paper Garden | Orrigan |
| ★★★★★ | `rf_rift` | The Rift Beneath | The Unmaker |
| ★★★★★ | `rf_stage` | The Velvet Stage | Mirabeau the Magnificent |
| ★★★★★ | `spire` | The Prism Lighthouse | Aurelia, the Prism Wyrm |
| ★★★★★ | `throne` | The Throne of the Unstruck God | The Unstruck God |

## Boss ids

- Overworld (`/boss`, `/spawn`): `brine_cathedral`, `wick_mother`, `orrery_of_winter`, `penitent_colossus`, `emily_the_yapper`, `the_fallen_star`
- Three-phase (`/bx`, `/spawn`): `abyssal_kraken`, `thornheart_treant`, `glacius_frozen_wyrm`, `mother_mycelia`, `grand_orrery`, `gilded_sphinx`, `count_vesper`, `grinning_ringmaster`, `tidebound_lich`, `forgeheart_colossus`
- Dungeon (`/spawn`, or `/boss` to go to it): `drowned_abbot`, `fallen_heart`, `the_archivist`, `the_unstruck_god`, `tidebound_lich`, `forgeheart_colossus`, `honey_queen`, `the_puppeteer`, `prism_wyrm`, `the_sleeper`, `unstruck`

## Pets

- Lines: `bubblefin`, `coral_seahorse`, `owlet`, `ember_chick`, `shiba_pup`, `frost_fox`, `calico_kitten`, `shadow_lynx`, `wisp_ghost`, `lantern_bat`, `mossling`, `acorn_squirrel`, `jade_gecko`, `tiny_drake`, `glow_beetle`, `moth_sprite`, `gear_pup`, `brass_bot`, `mimic_chest`, `pocket_yeti`
- Rarities: `common`, `uncommon`, `rare`, `legendary`, `divine`
- Eggs: `egg_FAMILY_RARITY`, families `aquatic`, `avian`, `canine`, `feline`, `spooky`, `woodland`, `reptile`, `insect`, `automaton`, `exotic`

## Item ids

- Find any id with `/items TEXT`. Keys: `key_DUNGEON` (the dungeons without `rf_`).
- Enchanted: `ID~CODE` or `ID~CODE.CODE`, CODE = key + grade 1-3, e.g. `/give plate_t9~keen3.burning2`
- Enchant keys: `hp`, `mp`, `att`, `def`, `spd`, `dex`, `vit`, `wis`, `keen`, `sharp`, `burning`, `frost`, `vampiric`, `arcing`, `volatile`, `thrifty`, `potent`, `evasive`, `warded`, `mending`, `feasting`, `soulful`, `restless`, `thorned`, `furious`, `shardsong`, `smoulder`, `gravedust`, `phoenix`, `headsman`
