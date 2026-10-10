# The Crimson Keep (vampire castle) — boss: Count Vesper

A castle on the black hill above Ashfen. Its own idea: **light and dark**. The halls are dim; candelabras throw
pools of light, and the Keep behaves differently in each. In the dark its coffins open and its thralls are strong;
in the light the thralls wither. Its statues are not all statues.

## Entry
- **Portal:** Ashfen and Godfall monsters (a share of their drops; leaders 4%, others 1%).
- **Key:** `key_keep` (Crimson Key: "Iron, warm, and slightly sticky. Don't ask."), icon `d2_items/crimson_key`.

## Tiles (registry `d2_tiles/crimson_keep_*`)
| Tile | Meaning |
|---|---|
| `ckstone` | stone floor (a/b in patches) |
| `ckcarpet` | the red runner down the halls (floor) |
| `ckmarble` | marble checker (the throne room) |
| `ckblood` | a blood pool: 70% speed and it drains you (6 every 0.5 s, past Defense) |
| `ckwall` / `ckwin` | wall; `ckwin` is a wall whose face is a tall window (the great halls' outer walls) |

## The Keep's own rules
- **Candlelight**: every candelabra lights a pool (radius 3). **Blood thralls standing in candlelight take double
  damage** (they shrink from it, and smoke): lure them in.
- **Coffins open in the dark**: a sealed coffin creaks open when you pass within 3 tiles of it *while you are out of
  any candle's light*, and a blood thrall climbs out. Walk the lit side of a hall and they stay shut.
- **They come from behind**: some of the armor stands and gargoyle statues lining the halls are real. A real one
  wakes after you have passed it: when you come within 2.5 tiles and then walk on past 4 tiles, it steps down and
  follows you. Most are only statues; you never know which.
- **Gargoyles on the ledges**: gargoyle statues perched on the courtyard's walls drop down when you come within 4
  tiles beneath them.

## Layout (`style: 'keep'`, ~260×260)
A castle, not a cave: square rooms joined by long carpeted halls whose outer walls are windows.
1. **The Courtyard** (entrance): stone, a ring of rose bushes, gothic pillars, gargoyles on the ledges.
2. **The Great Hall**: a long hall five wide, a carpet down the middle, window walls, armor stands and candelabras
   alternating down both sides (a third of the stands are real).
3. **Chambers** (3, square) off the hall: candelabras in the corners, a coffin or two in the dark middle.
4. **The Banquet Hall**: a long room with a double row of candelabras down its middle (the table) and gothic pillars;
   bats swarm in from its edges.
5. **The Gallery** (set piece): armor stands lining all four walls (12), a chest on a dais at the far end. When you
   open the chest, **three of the stands step down at once**.
6. **The Crypt** (set piece): dark, no candles but one at the door; two rows of coffins that, once you step in, open
   one after another down the rows (a bell tolls each time).
7. **The Stair** (quiet): candelabras, pillars.
8. **The Throne Room** (boss arena, 40×40): marble checker, a carpet from the door to the throne, two rows of gothic
   pillars, candelabras at the walls.

## Enemies (registry `d2_crimson_keep/*`)
| Monster | Role | Shot | Behaviour |
|---|---|---|---|
| blood_bat | swarm from the room edges | `d2_projectiles/crimson_keep.bat_screech` | zigzag, flies |
| gargoyle | drops from ledges / statues | `…stone_chip` ring | hops |
| haunted_armor | holds chokepoints, wakes from stands | `…crimson_slash` fan | shamble, heavy |
| blood_thrall | shambles in groups out of coffins | `…blood_spit` | shamble; double damage in candlelight |

## Loot
Chests: T6–T9 gear, T3–T4 abilities and rings, stat potions.

## How it's tested
`tools/check_keep.mjs`: every seed in bounds, connected, full pacing, skinned; thralls take double damage in light;
a coffin stays shut when you pass it lit and opens when you pass it dark; a real stand wakes behind you and a fake
never does; ledge gargoyles drop; the gallery's chest wakes three stands at once; the crypt's coffins open in
sequence; blood pools slow and drain; Count Vesper sleeps until you enter, and all his mechanics happen there.

## Result (built)
- Generator: `LAYOUT.keep` / `DRESS.keep` (map 280x280): courtyard, the Great Hall (east) with two chambers off
  it, the banquet hall, the Long Gallery hall (north or south) with a chamber and the gallery off it, the crypt,
  the stair, the throne room. Side rooms get a straight door off their hall. Window walls (`ckwin`, its face the
  bundle's window) along both halls; gargoyle statues set on the courtyard's wall tops.
- `src/keep.js`: candlelight (thralls take double damage in it), coffins that open only when you pass them in the
  dark, statues that wake behind you (a quarter of the halls' stands are real), ledge gargoyles that drop, the
  gallery's chest waking three stands, the crypt's coffins opening in sequence, blood pools.
- The delayed-event timer (`fvLater`) now runs for every dungeon in one place (it had lived inside Frostveil's own
  update, so the Keep's coffins would never have opened).
- Its own portal art (a gothic arch round a crimson swirl, a bat crossing it), weather, key, and minimap colours.
- `tools/check_keep.mjs`: every seed in bounds, no overlaps, connected, full pacing, skinned; every one of the rules
  above; Vesper sleeps until you enter, and all his mechanics happen there.
- Found and fixed while testing: rooms off the vertical hall had their doors carved the wrong way (unreachable);
  stands could stand in a doorway (now never); the throne room's checker was everywhere and very busy under
  bullets, its carpet ran across the room and not to the throne, and it got the generic boss-hall pillars. Now
  the checker is a nave before the throne, the carpet turns from the door up to the throne, and the pillars are
  gone.
