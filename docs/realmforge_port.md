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
