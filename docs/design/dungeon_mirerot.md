# Mirerot Grotto (fungal swamp) — boss: Mother Mycelia

A grotto under Ashfen gone to rot. Its own idea: **the dark and the spores**. It is dim enough that the
glowshrooms are the only real light, and the spore pods that grow along every way are traps you can spring on
purpose: shoot one from a distance and walk through its cloud's gap, or blunder into it and choke.

## Entry
- **Portal:** Ashfen and Thornwood monsters (group leaders 5%, others 1.2%, a share of those lands' drops).
- **Key:** `key_mirerot` (Mirerot Key: "Grown, not forged. It is slightly warm and very slightly alive."),
  icon from `ix_items/mirerot_key`.

## Tiles (registry `ex_tiles/mirerot_*`)
| Tile | Meaning | Art |
|---|---|---|
| `mrmud` | floor | mud a/b in slow-noise patches |
| `mrmoss` | floor (soft) | moss |
| `bog` (the existing bog tile, skinned) | slows to 60%, splashes | bog |
| `mrboard` | a boardwalk plank over the bog: full speed | our own plank tile, drawn for this |
| `mrwall` | wall, with faces | wall_top / wall_side |

## Hazards
- **Bog:** 60% speed. The ways between rooms are bog with a one-plank boardwalk down the middle: on the plank you
  move freely, step off and you wade.
- **Spore pods** (objects, about 4 per room, more in the spore garden): a pod bursts 0.4 s after you come within
  1.6 tiles, or the moment one of your shots hits it. It leaves a **poison cloud** (radius 1.8, 4 s): standing in
  it poisons you (8 damage every 0.5 s, ignoring Defense, while you stay and for 2 s after). Readable: the pod
  swells and flashes before it goes.
- **The dark:** ambient near-black; glowshroom clusters light the rooms (green), and you carry your own small light.

## Layout (`style: 'mirerot'`, ~240×240)
Round hollows strung along a meandering way (it bends up to 60° from east at each step), joined by boardwalks:
1. **The Glade** (entrance, quiet): moss, a ring of glowshrooms, a rotting log, reeds at the water's edge.
2. **Hollows** (4 combat rooms): round, mud with moss patches and a bog pool; a giant mushroom or two, glowshrooms
   at the edge, pods near the ways in. Vine lashers sit rooted at the boardwalks' far ends (the chokepoints).
3. **The Spore Garden** (the hazard room, on the main way): a field of pods (14–18) in loose rows with lanes
   between, a glowshroom at each corner. Clear a lane by shooting, or thread it.
4. **The Mushroom Cathedral** (set piece, on the main way): a great round hall, two rings of giant mushrooms as
   pillars around a moss nave, glowshrooms down the aisle, a rotting-log altar at the head; hornets nest here.
5. **A cache** (optional treasure, a leaf off a hollow): rotting logs round a chest.
6. **The Threshold** (antechamber, quiet): four glowshrooms, reeds, no pods.
7. **The Mire** (boss arena, 34×32): a round mud island in a ring of bog, eight pods round the island's edge,
   four glowshrooms. Mother Mycelia is rooted at the island's north.

## Enemies (registry `ex_mirerot/*`)
| Monster | Role | Shot | Behaviour |
|---|---|---|---|
| bog_toad | ambusher | `bogspit` ring of 6 | hops; whole rooms of them rise out of the bog when you walk in |
| rot_hornet | swarm | `stinger`, 2 | swoops; in packs of 4–5 |
| sporeling | runs at you and explodes into a poison cloud | — | shamble, bomb |
| sporeling_clump | a big one that splits into three sporelings when it dies | `gasbubble` ring | shamble |
| vine_lasher | rooted at chokepoints | `splinter` ring (short) + `thornseed` 3 | rooted |
Compositions: early hollows are toads and a sporeling; later hollows add hornet swarms and a clump; lashers
guard the far end of every boardwalk past the first.

## Loot
Chests: T3–T6 gear, T1–T3 abilities, stat potions. Mycelia: her own items (see her note).

## How it's tested
`tools/check_mirerot.mjs`: every seed connects with the full pacing and every tile skinned; pods burst from
proximity and from shots; clouds poison and fade; boardwalks are full speed and bog is slow; Mycelia sleeps
until you reach the island and every mechanic of hers happens in the real arena.
