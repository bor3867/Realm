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

### Result (2b, built)
- **Skins, not new tiles.** `m.skin` (one byte per tile) picks a bundle tile from `SKINS` in maps.js; the tile
  underneath keeps its meaning (sand, shallows, grass, loam...), so walking, slowing, sliding and spawning rules are
  unchanged. A skin shows only while its tile is still the tile it was laid on, so roads, ruins, site floors and the
  landing beach fall back cleanly. Old edge overlays are skipped next to a skinned neighbour.
- **New tiles:** `cliff` (solid; ledge runs in Runeholt, never stacked, from a horizontally stretched noise) and
  `rift` (walkable; 6 Life every 0.5 s, ignoring Defense; thin seams through Godfall).
- **The Greenmarch** (`lowlands`, biome 7, ring 1): a wedge facing the landing beach (starts ~50–90 tiles inland).
  Grass a/b in patches (the flowering one is the rarer), tall-grass clumps, small ponds, dirt-path roads, its own
  waypoints (Millbrook, Haywain Cross, The Old Well), weather (thistledown), speech and minimap colour. Until 2d it
  borrows the shore's monsters and camp loot.
- **Per land:** shore sand a/b + a dithered wet-sand rim + shallows + animated deep water; Thornwood forest floor,
  leaf litter, moss rimming the briars, and brooks; Runeholt snowfields over bare rock with a gravel fringe, rare
  alpine grass, rune-floor patches kept as its identity, ice lakes, ledges; steppe gets patches of highland gravel;
  Godfall ash plains with a few blood-rock slabs, lava pools and fissures kept, rifts added. Fen and dunes unchanged.
- **Transitions:** every tile samples its land from a point jittered up to 3 tiles each way (the coast is never
  jittered). The first try jittered the distance value instead; the border noise made that collapse to ~1 tile.
- Variants use slow noise patches (`patch()`), never per-tile random. Jitter uses a fixed hash, so the generator's
  random stream is untouched.
- Cost: generation 0.77 → 1.1 s (once per realm); ground draw 1.65 ms; total draw 3.6 ms.
- Tuned after looking: alpine grass was turning Runeholt into a meadow (now rare accents); mossy stone made plazas
  (now a rim); stacked cliffs looked like shelves (now single-height runs); blood rock was too loud (now slabs).

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

### Result (2c, built)
- `STAND` in maps.js: per land, `[sprite, chance, solid, where]`; registry objects mixed with the old ones. `where`
  gathers them: **grove** (slow-noise woods with clearings: palms, oaks, elder and thorn trees, glow mushrooms),
  **meadow** (flower beds on the flowering grass), **wet** (tide pools by the water), **rock** (heather, dead trees on
  bare highland rock), **cliff** (boulders and spires under the ledges), **rift** (crystals along the rifts). Nothing
  stands on a road or beside one. Collision follows the note: trees, rocks, spires, obelisks, pillars, wells, cairns
  and the rowboat block; clutter doesn't. Flat clutter sorts under whoever stands on it.
- Clusters (placed on purpose, so the land has places in it): **campfire camps** with a ring of stumps in the
  Thornwood and the Greenmarch (`m.firecamps`, for 2d's bands), driftwood-and-shell strands, hay ricks ringed with
  flowers, fairy rings, cairn circles, altars of bone round an obelisk.
- Landmarks (named sites, discovered like the others): **The Beached Skiff** (rowboat on the wet sand, tide pools,
  a chest), **Haywain Cross** (well, signpost and hay at the Greenmarch crossroads), **The Elder Grove** (a ring of
  elders and glow mushrooms round a chest), **The Cairn Ring** (cairns and spires round a riddle stone), **The
  Bleeding Fountain** (a wishing fountain ringed by broken pillars and bones), **Thistle Farm** (flower rows, hay,
  an oak, a signpost, a chest).
- Lights: campfires, glow mushrooms, the fountain, rift crystals and obelisks glow at dusk.
- Found while profiling: the wedge test rebuilt `Object.entries(SECTORS)` for every one of 1.6M tiles; it's
  precomputed now, and only tiles near a border take the jittered second sample. Generation stays ~1.0–1.5 s.
- Draw with 22.8k objects: objects 0.13 ms/frame (the chunk index from 2a).

## Spawning
- The 20 overworld enemies and the 5 `ow2` realm enemies get enemy definitions (AI from the existing set, shots
  from their own sheets where they have them, themed shots otherwise) and join the mapped biomes' spawn tables with
  weights like the existing monsters.
- Themed packs: crab clusters, goblin camps, orc warbands, harpy flights, wraith processions.
- The five `ow2` behaviours (conch shell guard, mole burrow, archer volleys, dwarf pick throw and fetch, scorpion
  splitting stinger) are small additions to the enemy AI.
- Elites (1 per ~15–25 packs) arrive in Phase 5 with their own note.

### Result (2d, built)
- 25 monsters (`reg:` registry art; `Renderer.regEnemy` draws move/attack/hurt frames with the shared body
  language: hop, lunge, recoil, tell flash). Stats sit on each land's tier; the Greenmarch is between the shore
  and the rest of ring 1. The ow2 five fire their own shots; the other twenty use the game's own, chosen to fit.
- They join the old monsters: every parent in a land also gathers the new ones (the steppe takes the harpy and the
  dwarf). The Greenmarch's parent is **The Field Warden** (the scarecrow, drawn half again as large, rooted, with
  rats, goblins, boars and moles about it).
- Themed packs: crab clusters, rats and boars in the fields, harpy flights, wraith processions. Every campfire camp
  holds a band: two orc brutes and two bandit archers in the Thornwood, three hedge goblins and a rat in the
  Greenmarch.
- Signatures: the **conch hermit** shuts its shell after 4 quick hits (1.5 s, nothing gets through, "CLINK"),
  pops out squirting, and can't hide again for 3 s. The **mole** uses the burrow movement and comes up flinging
  dirt. The **bandit archer** kites and looses three arrows in a row. The **crag dwarf** throws his pick, which lies
  where it fell until he runs over and picks it up (no throwing meanwhile). The **obsidian scorpion** flickers and
  sheds embers as it's hurt; under a third of its life its stingers split (`when: 'hot'` attacks).
- Found while testing: the bundle's monster art faces right (the old sheets face left), so their flip is
  inverted. The first shell rule (3 hits in 0.8 s) kept the hermit shut most of a fight; it's now 4 hits plus a
  cooldown.
- `tools/check_ow2.mjs`: every new monster spawns, shoots, dies; each signature happens; every land holds them.

## Events
- The **Giant Watermelon** (lowlands/midlands grass, one at a time, very rare, despawns after 10 min).
- The **Abyssal Kraken** and the **Thornheart Treant** use the boss framework; each gets its own boss note.

### Result (2e, built): the Giant Watermelon
- `src/melon.js` (mixed into Game). One alive at most; a check every 20 s with the bundle's 0.004 chance (a median
  of about an hour of realm time); it ripens on Greenmarch grass or Thornwood loam with room for its 3x2 body,
  25+ tiles from you, announced to the realm and marked on the minimap wherever it is. It rots after 10 minutes.
- An enemy with no attacks (`ENEMIES.giant_watermelon`, `melon: true`, 4000 life, rooted, never shoved). The
  renderer plays the bundle's clips: idle glint, cracked below 66% and 33%, a hurt flash per stage with
  `melon_hit`, the burst on death with a juice splash each side; the halves lie in their juice for 20 s and fade.
- Loot lands on the burst's last frame (0.5 s): 1–3 slices always, then independent rolls of 35% / 25% / 6% / 1%
  (the bundle's table, kept: the event is rare enough to carry it). Over 1000 melons: ~2000 slices, ~85 of each
  common item, ~20 of each rare, ~10 golden honeydews.
- 12 items with registry icons (`reg:` on the item; `Renderer.icon` draws the 8x8 at 2x through the usual outline
  and fit): Melon Slicer (sword, a sip of lifesteal), Rindguard (heavy), Vinegrown Staff (seeking seeds),
  Seedspitter (bow, five seeds in a wide spray), Rind Bulwark (seal: armor, a heal and a ring of seeds with an
  aftershock), Ring of the Rind, Honeydew Scepter (wand, sticky slowing bolts), Dewveil Robe (regen when low),
  Dewdrop Ring, Melon Baller (dagger, crits), The Golden Honeydew (ring: mends on kills and when low), and the
  Watermelon Slice (40 Life now, 200 over 5 s).
- `/melon` (admin) drops one beside you. `tools/check_melon.mjs` checks spawn lands, no attacks, the burst timing,
  the halves, rotting, the slice's regen and the loot odds.
- Tuned after looking: six juice splashes hid the burst frame; now one each side.

## Order of work (one commit each)
2a performance infrastructure + after-numbers · 2b tiles, variants, transitions, lowlands wedge · 2c objects,
clustering, landmarks · 2d enemies, packs, ow2 behaviours · 2e the Giant Watermelon · 2f the Kraken and the Treant.

## How it's tested
Profile numbers after each step; soak test; a walk through every biome captured in the browser; spawn-table
checks headless (every biome spawns its new enemies; no object on a road or water; spawn beach clear).
