# Hollowmoon Carnival (haunted night fair) — boss: The Grinning Ringmaster

A fair that set up one night on the Crystal Steppe and never packed up. Its own idea: **the fair plays tricks**.
Its floor turns your feet, its boxes bite, its games are traps you can turn to your use, and its carousel horses
come off their poles.

## Entry
- **Portal:** Crystal Steppe and Godfall monsters (a share of their drops; leaders 4%, others 1%).
- **Key:** `key_hollowmoon` (Hollowmoon Ticket: "ADMIT ONE. The moon on it is grinning."), icon `d2_items/hollowmoon_key`.

## Tiles (registry `d2_tiles/hollowmoon_*`)
| Tile | Meaning |
|---|---|
| `hmsaw` | sawdust (a/b in patches) |
| `hmboard` | the midway's planks |
| `hmcheck` | funhouse checker |
| `hmspin` | **spin tile**: while you stand on one, your movement turns a quarter-turn clockwise (you press up, you go right). Animated. Only in the funhouse. |
| `hmwall` | the tents' striped canvas, with faces |

## The fair's tricks
- **Circus cannons**: every 4 s a cannon swings to you, shows its line (a dotted path, 1.2 s, aimed where you were),
  and fires a boxing glove down it that bounces off one wall. Step off the line.
- **High strikers**: shoot one and the puck rings the bell (DING!): every monster within 14 tiles drops what it was
  doing and comes to the striker for 4 s. It's a trap, and a way to pull a room to a spot of your choosing.
- **Jack crates**: some of the crates in the fair are jack-in-the-boxes. **Shoot one and it springs out**; leave it
  alone and it stays a crate. (The others just break.)
- **Balloon ghouls** float over the tents (walls don't stop them) in slow waves; they burst into confetti and a few
  coins.

## Layout (`style: 'hollowmoon'`, ~300×300)
1. **The Midway** (entrance): a long boardwalk of planks, stalls on both sides (popcorn carts, lamp posts, balloon
   bundles), a high striker at the far end, a few crates.
2. **The Tent Maze**: a maze of striped canvas (corridors two wide), lamp posts at its turns, crates in its dead
   ends, a cannon or two.
3. **The Funhouse** (hazard): checker floor with patches of spin tiles; knife jugglers stand on star drums; cannons.
4. **The Carousel** (set piece): a round ring of sawdust; six carousel horses ride round its middle on their poles.
   Step into the ring and they break off and charge, each still galloping in its circle but swinging out at you.
5. **The Prize Booth** (treasure, off the midway): a chest, a high striker, crates.
6. **Backstage** (quiet): lamp posts, star drums.
7. **The Big Top** (boss arena, round, 36×40): a sawdust ring, eight star drums round its edge.

## Enemies (registry `d2_hollowmoon/*`)
| Monster | Role | Shot | Behaviour |
|---|---|---|---|
| jack_in_the_box | ambusher from crates | `…boxing_glove` 3 | hops |
| carousel_horse | the carousel | `…horseshoe` fan | gallops round a centre, swings out to charge |
| balloon_ghoul | drifts in waves | `…grin_bubble` ring | floats through walls; confetti when it pops |
| knife_juggler | keeps back | `…thrown_knife` fan of 5 | kites |

## Loot
Chests: T8–T10 gear, T4–T5 abilities and rings, stat potions.

## How it's tested
`tools/check_hollowmoon.mjs`: every seed in bounds, no overlaps, connected (the maze too), full pacing, skinned;
spin tiles turn your movement; cannons telegraph and fire; a struck striker pulls the room; shot jack crates
spring and plain crates don't; ghouls pass through walls and pop into confetti; the carousel horses circle until you
enter and then charge; the Ringmaster sleeps until you enter the big top, and all his mechanics happen there.

## Result (built)
- Generator: `LAYOUT.hollowmoon` / `DRESS.hollowmoon` (map 300x300): the midway (planks down the middle, stalls
  both sides, a striker at its end), the prize booth off it, a tent maze (a 9x9 grid of cells carved by a recursive
  backtracker, canvas between), the funhouse (checker, four 3x3 patches of spin tiles, four star drums with a
  juggler on each, two cannons), the carousel (six horses on their circle round a pole of lamps), backstage, the
  big top. The maze is a room of its own shape (`shape: 'maze'`, carved by the layout).
- `src/hollowmoon.js`: cannons (a dotted line 1.2 s ahead, then a boxing glove that bounces once), strikers (shoot
  one: DING, and everything within 14 tiles comes to it for 4 s, via a `lureTo` on the enemy), crates (`hitObject`;
  a jack springs out of the trapped ones), the carousel's horses (an `ai: 'carousel'` that rides the circle until you
  step into the ring, then gallops faster and swings out at you). Spin tiles turn your input a quarter-turn in the
  movement code. Balloon ghouls have `noclip` (they float over the canvas) and pop into confetti and coins.
- Registry monsters now pick their attack and hurt frames by clip (the carousel horse has three gallop frames).
- Its own portal art (a striped tent flap round a grinning-moon swirl), confetti weather, ticket, minimap colours.
- `tools/check_hollowmoon.mjs`: every seed in bounds, no overlaps, connected through the maze, skinned; every trick
  above; the Ringmaster sleeps until the big top, and all his mechanics happen there.
