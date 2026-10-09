# Phase 2 design: update and optimise the existing overworld

The realm is not regenerated from scratch or replaced. The existing generator (`realm()` in `src/world/maps.js`),
its rings, sites, roads, waypoints, camps, events and spawns all stay; the bundle's tiles, objects and enemies are
folded into the regions that match them.

## Profile first (before any change)
Measured in the browser at 1280×720 (buffer 640×360, scale 2), walking a loop through the realm, 600 frames:

| Measure | Before |
|---|---|
| update (game logic) | 0.74 ms/frame |
| draw | **13.7 ms/frame** (worst frame 268 ms) |
| of which: minimap | **6.9 ms** (redrawn every frame; marks scan every enemy and object) |
| of which: ground | 1.6 ms |
| of which: building the sprite list | ~3.5 ms (loops all 11,763 objects + 5,124 enemies every frame) |
| world contents | 11,763 objects, 39,996 decor, 5,124 live enemies |
| JS heap | 28 MB |

The fixes this points to, in order:
1. **Minimap:** redraw at ~10 Hz instead of every frame; only scan marks inside the minimap's view, through the
   spatial index (2).
2. **A static chunk index** for objects (16×16-tile chunks) so the sprite list only visits nearby chunks.
3. **An enemy spatial grid** (rebuilt each frame from the moving few; far enemies stay put) used for the active list,
   the render list and shot collision. Far enemies sleep: no AI, no animation.
4. **Pooling** for projectiles and floaters, verified under the densest boss phase.
5. Ground: 1.6 ms is acceptable; chunk pre-baking is deferred (animated water tiles would force re-bakes) unless the
   after-numbers say otherwise.

### Result (2a, built)
Same harness, same viewport, after the changes:

| Measure | Before | After |
|---|---|---|
| draw | 13.7 ms | **3.7 ms** |
| minimap | 6.9 ms | **0.09 ms** per redraw, redrawn ~12×/s |
| update | 0.74 ms | 0.76 ms (unchanged; it already only ran nearby enemies) |
| 2,000+ live bullets (stress) | 10.7 ms draw, 60 GC drops / 600 frames | **8.7 ms**, 27 GC drops |

What changed:
- `objectsIn(m, box)` (maps.js): a 16×16-tile chunk index over a big map's objects, rebuilt when the object list
  changes (identity, length, or `m.ogridDirty` at the realm's splice/push sites). Small maps return the plain list.
- The sprite list visits only the chunks within the view's reach, and only nearby enemies (`g.active`), plus the
  notable ones (bosses, heralds, wardens) and the fading dead.
- `g.active` and `g.notable` are built in one pass in `updateEnemies` and tagged with their map, so a frame drawn
  just after a map change never uses the old map's list.
- Minimap: redrawn at most every 80 ms unless the map changed; marks walk only the chunks in its view; each camp's
  chest is looked up once.
- Bullets: trail sparks thin out as the screen fills (≤240 a frame); the enemy-shot halo is a cached stamp.
- Not done, on the numbers: an enemy spatial grid (update is already 0.76 ms; far enemies already sleep) and object
  pooling for bullets (update stays under 2 ms at 2,400 bullets; drawing, not allocation, is the cost). The ground
  (1.2–1.5 ms) stays unbaked.

## Biome mapping (refines audit D3)
| Bundle biome | Where it goes | Why |
|---|---|---|
| **shore** | our shore (ring 0) | same place; its sand, wet sand, shallows and deep water replace the old sand |
| **lowlands** | a **new wedge in ring 1**, facing the southern landing beach | the fen is a swamp, not farmland; a new wedge keeps the fen's identity, and puts the gentlest inland country nearest the start |
| **midlands** | our **thornwood** (ring-1 wedge) | already a forest; the Treant event lives here |
| **highlands** | our **runeholt** (and its steppe wedge gets highland rock mixed in) | ring 2, cold rock and snow |
| **godlands** | our **godfall** (ring 3) | the corrupted centre |
The dunes and the fen keep their own look.

## Tiles
- The 21 bundle tiles join `TILE_NAMES` (prefixed, e.g. `ow_shore_sand_a`). `drawGround` draws any tile without a
  baked cell from the registry (native 8×8 at 2×, no outline, its own loop animation).
- **Variants by low-frequency noise**, not per-tile random: `_a`/`_b` (and the mixed tiles like leaf litter, gravel,
  blood rock) are chosen by a slow noise field, so they form patches.
- **Transitions:** a dithered band a few tiles wide where biomes meet: each tile near a border takes its biome from a
  jittered sample point, so the two grounds interleave like a hand-placed edge.
- Walkability: deep water solid; shallows and the midlands stream walkable but slow; cliff tops solid; rift
  walkable but it bites (a small Life drain), so the godlands' ground itself is unfriendly.

## Objects, clustering, landmarks
- Bundle objects draw from the registry (8×16 ones stand on their base tile). Each gets a collision rule:
  **block movement and shots:** trees, boulders, rock spires, obelisks, pillars, wells, cairns, the rowboat.
  **block nothing:** shells, driftwood, tide pools, flowers, hay bales, signposts, heather, glow mushrooms,
  stumps, bone piles, campfires.
- **Clustering:** trees grow in groves (a slow noise field gates them); rocks gather near cliff tops; campfires
  come with a small camp (stumps/logs around, and an enemy pack spawned at it); nothing spawns on roads, water or
  within one tile of a road.
- **Landmarks** (a handful per biome, built as set pieces like the existing sites):
  shore: a beached rowboat with tide pools; lowlands: a crossroads with a well and a signpost; midlands: an elder
  grove ringed with glow mushrooms; highlands: a cairn circle on a cliff; godlands: a blood fountain ringed by
  broken pillars.

## Spawning
- The 20 overworld enemies and the 5 `ow2` realm enemies get enemy definitions (AI from the existing set, shots
  from their own sheets where they have them, themed shots otherwise) and join the mapped biomes' spawn tables with
  weights like the existing monsters.
- Themed packs: crab clusters, goblin camps, orc warbands, harpy flights, wraith processions.
- The five `ow2` behaviours (conch shell guard, mole burrow, archer volleys, dwarf pick throw and fetch, scorpion
  splitting stinger) are small additions to the enemy AI.
- Elites (1 per ~15–25 packs) arrive in Phase 5 with their own note.

## Events
- The **Giant Watermelon** (lowlands/midlands grass, one at a time, very rare, despawns after 10 min).
- The **Abyssal Kraken** and the **Thornheart Treant** use the boss framework; each gets its own boss note.

## Order of work (one commit each)
2a performance infrastructure + after-numbers · 2b tiles, variants, transitions, lowlands wedge · 2c objects,
clustering, landmarks · 2d enemies, packs, ow2 behaviours · 2e the Giant Watermelon · 2f the Kraken and the Treant.

## How it's tested
Profile numbers after each step; soak test; a walk through every biome captured in the browser; spawn-table
checks headless (every biome spawns its new enemies; no object on a road or water; spawn beach clear).
