# Sandscour Tomb (desert pyramid) — boss: The Gilded Sphinx

A tomb under the Saltglass Dunes. Its own idea: **the tomb wakes as you pass**. You arrive outdoors on the dunes,
where serpents swim under the sand and quicksand drags at you; then through a gate into straight stone corridors
where the urns may be full of scarabs and the sarcophagi open as you walk by.

## Entry
- **Portal:** Saltglass Dunes monsters (and the Drowned Shore's group leaders): leaders 5%, others 1.5%. It is the
  first-ring dungeon of the Realm Update, so it comes early.
- **Key:** `key_sandscour` (Sandscour Key: "A scarab of beaten gold. Its legs twitch when you aren't looking."),
  icon `ix_items/sandscour_key`.

## Tiles (registry `ex_tiles/sandscour_*`)
| Tile | Meaning |
|---|---|
| `sdsand` | outdoor sand (a/b in slow patches) |
| `sdtomb` | tomb floor |
| `quicksand` | 55% speed, and it pulls you slowly toward the pit's centre |
| `sdwall` | wall, with faces |

## Hazards
- **Quicksand pits** (outdoors and in the burial chamber's moat): slow plus a pull toward the centre (1.1 tiles/s).
  Stand still in one and you sink toward the middle; walk out against it.
- **Trapped urns** (tomb corridors and chambers): shootable (3 hits). One in three bursts into a swarm of four tomb
  scarabs; the rest crack open on a little gold or a potion.
- **Sarcophagi**: a sealed one opens (its lid slides, four frames) when you come within 3 tiles, and a sand mummy
  steps out.

## Layout (`style: 'sandscour'`, ~300×300)
1. **The Oasis** (entrance, quiet, outdoors): sand, saguaros, a skull pile, two obelisks flanking the way east.
2. **The Dunes** (outdoors): a wide blob of sand, quicksand pits, saguaros (saguaros grow only out here), serpents.
3. **The Tomb Gate**: a square hall where the sand stops and the stone begins: two obelisks, jackals at the door.
4. **The Long Hall**: a straight corridor three wide running east, urns along its walls, with one right-angle jog.
   **Chambers** open off it to the north and south through short necks (4 combat chambers), each guarded at its
   neck by a jackal warden; urns in the corners; one has a sealed sarcophagus or two.
5. **The Burial Chamber** (set piece): a long hall lined on both sides with sarcophagi (10–12, all sealed), a
   quicksand moat down the middle with stone crossings. Off its far wall, **the Sealed Vault**: its door is a wall
   of sand that crumbles when the last of the chamber's mummies is laid to rest. Inside: treasure chests (two
   chests and the bundle's gold chest art).
6. **The Antechamber** (quiet): obelisks, a skull pile.
7. **The Sanctum** (boss arena, 40×40): a square stone hall with a raised dais (a ring of tomb floor), four obelisks
   at the corners of the dais (they block shots: cover), a drift of sand along the walls.

## Enemies (registry `ex_sandscour/*`)
| Monster | Role | Shot | Behaviour |
|---|---|---|---|
| dune_serpent | outdoor ambusher | `saltcrystal` ring | burrows under the sand, surfaces beside you |
| jackal_warden | holds doorways | `goldshard` fan of 3 | flanks, never strays far from its door |
| sand_mummy | slow, tanky | `salt` ring + aimed `salt` | shambles, high Defense |
| tomb_scarab | swarm | contact; `glyphbolt` 1 | skitters; comes out of urns |
Compositions: serpents outdoors; jackals at every doorway; mummies from the sarcophagi and in pairs in the deeper
chambers; scarabs from the urns and in clutches.

## Loot
Chests: T3–T6 gear, T2–T3 abilities, stat potions. The vault holds a chest among the bundle's two gold chests (scenery).

## How it's tested
`tools/check_sandscour.mjs`: every seed in bounds, no overlaps, connected, full pacing, skinned; quicksand slows
and pulls; urns break and sometimes release scarabs; sarcophagi open as you pass and release mummies; the vault
stays sealed until the burial chamber's mummies are dead; the Sphinx sleeps until you enter the sanctum, and
every one of its mechanics happens there.

## Result (built)
- Generator: `LAYOUT.sandscour` / `DRESS.sandscour` (map 320x320): the oasis and the dunes (blobs of sand), the
  gate, the Long Hall (two straight runs and a jog, built as thin rooms) with chambers off it through necks, the
  burial chamber and its vault, the antechamber, the sanctum. Saguaros only outdoors. The vault's door is three
  tiles of wall (sand) until it opens.
- `src/sandscour.js`: quicksand's pull (and 55% speed), urns (`hitObject` routes shots to them; one in three holds
  four scarabs), sarcophagi (shut, then the lid slides open over four frames and a mummy steps out), the vault.
  Jackal wardens stand at every doorway (`def.extraSpawns`) and keep within 5 tiles of it (a new `leash` on the
  enemy data).
- Its own portal art (a pyramid's doorway, a scarab over the lintel), the dunes' blowing sand as its weather, its key.
- `tools/check_sandscour.mjs`: every seed in bounds, connected once the vault opens, full pacing, skinned, no
  saguaro inside the tomb; quicksand pulls, urns break and some hold scarabs, the burial sarcophagi wake and the
  vault waits for their mummies; the Sphinx sleeps until the sanctum, and every mechanic happens there.
- Found and fixed while testing: the burial chamber had 24 sarcophagi (one every second tile) and now has 12; its
  sarcophagi wake from 4.5 tiles so you can rouse them from the side lanes (from 3 you'd have to hug the walls); the
  sanctum got the generic boss-hall pillars it didn't want, and its busy tomb floor hid the
  Sphinx's gold shots, so it is sand now, with only the dais in stone. (Caught in review before the first run:
  objects must be placed before a room's floor turns to sand, since they only stand on the base floor.)
