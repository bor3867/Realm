# Phase 0 audit: the Realm codebase, before the Realm Update

Written before any game code changed. It records how the game works today, how the update bundle
(`realm_update/realm_update/`) fits it, and the decisions that need your call.

## 1. The shape of the project

| Part | Where | Size |
|---|---|---|
| Game loop, entities, combat, loot, events, admin commands | `src/game.js` | 3,763 lines |
| The four newest dungeons' mechanics (mixed into Game) | `src/dungeons4.js` | 593 |
| Canvas renderer, minimap, effects, lighting | `src/render.js` | 1,615 |
| Map generators: Nexus, vault, realm, dungeons | `src/world/maps.js` | 1,274 |
| Enemy, boss, dungeon data | `src/data/enemies.js` | 1,660 |
| Item data, loot tables, enchantments | `src/data/items.js` | 1,083 |
| DOM UI (side panel, tooltips, screens) | `src/ui.js` | 1,000 |
| Classes, pets, lore, settings, save | `src/data/*.js`, `src/save.js`, `src/settings.js` | ~600 |
| Art pipeline (Python): pixel data → sheets | `tools/*.py` (74 files) | |
| Dev server, headless tests | `tools/serve.mjs`, `tools/soak.mjs`, `tools/balance.mjs`, `tools/admin_reference.mjs` | |

Plain ES modules, no framework, no bundler, no dependencies. **It is not a git repository** (the brief asks for a
commit per phase; see decision D1).

## 2. How each system works today

### Sprites and loading
- **Art is baked at build time.** Python scripts in `tools/` hold pixel grids (strings of palette characters) and write
  PNG sheets plus a JSON "guide": `art/sprites/player/*`, `art/sprites/enemies/{enemies,champions}_sheet`,
  `art/sprites/bosses/*_sheet`, and one combined world index, `art/world/world.json` (tiles, objects, items,
  projectiles, decor, fx, landmarks).
- `src/assets.js` loads a **fixed list** of 17 sheets + 7 world images + `world.json`. There is no registry: each
  renderer function knows which sheet to read (`A.sheets.enemies.guide.enemies[id].row`, `W.objects[name]`, …).
- **Pack 1 was never loaded as an atlas.** Its pixel data was copied into `tools/pack_sprites.py` and baked into
  our own sheets (crypt/ember monsters, tiles, items, the two pack bosses on `pack_bosses_sheet`).
- **Scale:** all art is 8×8 native, stored doubled (16 px cells). The world is drawn into a low-res buffer where one
  tile = 16 px, then scaled to the screen. Bosses are 16×16 art tripled into 48 px frames.
- **Outlines are added at runtime** (`src/outline.js`, cached per frame), 1 buffer pixel thick. Art has no baked outline.

### Animation
- Each sheet's guide has fixed column layouts: enemies `move ×4 | tell | attack | death ×3`; bosses
  `idle ×4 | tell | attack | special | death ×3`; heroes per-direction rows.
- Frames are picked from **game state + time** (`e.state`, `e.st`, `g.t`). There is no clip player, no
  "ended" event; gameplay runs on timers (`tell` seconds, `recover` seconds).

### Entities
- Enemies are plain objects from `addEnemy(id, x, y)` with a data definition in `ENEMIES` (hp, def, speed, `ai`
  string, `attacks[]` patterns). 14 AI kinds (`kite`, `swoop`, `charge`, `rooted`, …).
- Bosses (`e.rb`) run a phase script: `phases[]` with `at` (HP fraction), `cycle` of named `moves`, optional `open`,
  `frenzy`, `survive`, `intermission`, `wake`, `overcharge`. Moves combine generic `fire` patterns with ~40 named
  signature mechanics (in `game.js` and `dungeons4.js`).
- "Champions" (16 px, 12×12 art) and heralds are today's mid-tier: biome leaders with escorts and children.

### Projectiles and collision
- `shoot()` makes a plain object; `updateProjectiles` rebuilds the array every frame (allocation, no pooling).
- Movement modifiers (`mv`): seek, hold, curve, brake, boomerang, split, wave, lob, plus the d4 set.
- Collision is **distance checks**: player shots vs the `active` list (enemies within 30 tiles), enemy shots vs the
  player. No spatial hash. Volley de-duplication (`hitVols`) so a burst hits once.
- Terrain: `m.solid` byte grid (tiles + solid objects); `isSolid`, `moveCircle`, `unstick`.

### The overworld (realm)
- `realm(seed)` in `maps.js`: 1,280×1,280 tiles, round island. Noise-wobbled **rings** from the coast inward, with
  three "newer lands" taking a wedge of a ring:

  | Ring | Biomes (id) | Tiles |
  |---|---|---|
  | 0 coast | `shore`, `dunes` (wedge) | sand / dune, glassflat |
  | 1 | `fen`, `thornwood` (wedge) | fen, mud / loam, bramble, bog |
  | 2 | `runeholt`, `steppe` (wedge) | snow, runefloor / steppe, quartz |
  | 3 centre | `godfall` | ash, obsidian |
- Already has: biome blending (priority-based dithered edge tiles), roads, sites/landmarks (wrecks, stones,
  observatory…), waypoints, decor scatter, lore stones, camps, chests, the Nexus and portals.
- **Spawning:** `maintainRealm` every 3 s tops up "parent groups" (leaders with children) and roaming packs per
  biome; heralds → realm boss events (6 realm bosses incl. Emily and the Fallen Star).

### Dungeons
- 11 dungeons, one generator `dungeon(seed, def)` with a layout per style (chapel, crypt, forge, scriptorium,
  heart, throne, hive, theatre, spire, islands, plus a graph layout for ember), shared passes for roles, seals
  (wardens, levers, plate/rune puzzles, masks, mirrors, trials), dressing, secrets, lights, journals.
- Entry by portal: realm enemies drop portals (`portalDrop2` + `PORTAL_EXTRA`), or a `key_<dungeon>` opens one.

### Loot, items, save
- `rollLoot(table)` → bags by best item (`brown → purple → white → starfall → divine`); soulbound breakable chests.
- Items: tiered T0–T11 per type (generated), ~120 untiered relics, 25 mythics, consumables, keys, eggs.
  Icons are 16 px cells in `art/world/items.png`.
- Save: `localStorage`, one key per account (`realm.save.v1.<id>`), with migrations in `save.js`. Pets live in
  `save.pets` (8 kinds, rarity common→divine, ability levels, fusing).

### Performance today (headless simulation, no rendering)

| Scene | Update cost | Notes |
|---|---|---|
| Realm | 0.72 ms/frame | **5,192 live enemies**; every frame scans the full list to build `active` (11 near you) |
| Dream boss, phase 3 | 0.07 ms/frame | 69 bullets peak in this sample |

Rendering cost is not measured yet (Phase 2 adds an in-browser frame-time readout). Known render costs: the ground
is re-drawn per frame from tiles; the dusk/darkness layer creates a radial gradient per light; one `drawImage` per
sprite (Canvas2D has no batching beyond that).

## 3. The bundle, checked against the game

- 8 packs, 440 sprite names. All `preview.html` pages viewed (`elites` and `pets_v2` share one combined page on purpose;
  `melon_event` has GIFs only). Previews are self-contained: they only fetch their own atlas.
- Atlas formats differ per pack exactly as the brief says (`sheets.*.native/x5/animations/info`,
  `bosses[key].phases`, `items[name]`, `meta.lines`).
- **Name clashes with existing ids:**
  - `tidebound_lich`, `forgeheart_colossus` and 12 relic names (`tidecaller_blade` … `emberheart_ring`): intended
    supersessions.
  - `bog_toad` is both our fen monster and a Mirerot monster: needs namespacing (D5).
- **Thematic clashes with content I built recently** (see D4):
  - our **Marionette Theatre**'s boss is *Maestro Vesper, the Puppeteer*, strung to hanging marionettes. The bundle has
    **Count Vesper** and the **Ringmaster's Puppeteer phase** (marionettes with HP that he re-strings).
  - our realm boss **Orrery of Winter** vs the bundle's **Grand Orrery**.
- The dev server sends HTML without a UTF-8 charset (bundle pages show "Â·"), and does not serve `.gif` (fix in Phase 1).

## 4. Decisions to make (my recommendation first)

**D1. Version control.** The folder is not a git repo. I recommend `git init` with a `.gitignore` (scratch, previews),
an initial commit of today's game, then one commit per phase.

**D2. How the bundle's art gets in.** The brief wants one runtime registry; our game bakes everything in Python.
Recommendation: build the **runtime registry** the brief describes (`src/registry.js`), loading the bundle's
`native/` sheets unchanged, drawn at **2× in the buffer** (one tile = 16 px, matching every existing sprite) and
outlined by our existing runtime outline. That keeps one consistent outline weight with the rest of the game; the
x5 sheets' baked outline would be thinner than ours and look out of place. The existing baked sheets stay as they
are, and the supersession map redirects old names to bundle art. I will not run the bundle's Python generators.

**D3. Biome mapping.** Keep the 7 existing regions and re-skin/extend them:

| Bundle biome | Existing region(s) | Why |
|---|---|---|
| shore | shore (+ dunes wedge keeps its own look) | same ring, same idea |
| lowlands | fen | ring 1, open wet country; grass/dirt join the fen palette |
| midlands | thornwood | ring 1 wedge, already a forest |
| highlands | runeholt + steppe | ring 2, rock, snow and alpine grass |
| godlands | godfall | ring 3, the corrupted centre |

**D4. Overlaps with my recent dungeons.** The user rule is "every boss owns its mechanics". The brief specifies
Count Vesper and the Ringmaster's marionettes, so I'd change *mine*: rename **Maestro Vesper** (e.g. *Maestro
Lucan*) and replace his string-anchor mechanic with a spotlight/stage-trap mechanic so the Ringmaster's puppets are
unique; rename the **Orrery of Winter** realm boss to something like *the Winter Clock*.

**D5. Namespacing.** New enemies get the brief's `<sheet>/<sprite>` keys in the registry; game ids stay short but
unique. `ex_mirerot/bog_toad` becomes `mire_toad` in game data.

**D6. Pets.** Pets v2 (10 families × 2 lines × baby/evolved/divine, 50 eggs) vs today's 8 kinds with
rarities and fusing (just redone). Recommendation: keep the ability/feeding/fusing systems; each line becomes a
"kind"; stage follows level (baby → evolved at the first cap → divine at the max cap); eggs become
family × rarity; existing pets migrate to the closest line (ember_fox → canine fox line, frost_kit → frost fox,
rune_owl → owlet, …). My hand-drawn pet skins stay on disk, unused.

**D7. The two pack-1 dungeons.** Keep the Sunken Crypt and Emberforge layouts; replace the Lich's and Colossus's
current 4–5 phase scripts with the brief's 3-phase designs on the new art (their present signature moves get
retired or folded into the new phases).

## 5. Plan

One phase at a time: design note in `docs/design/` → build → run and look → refine → commit. The game stays
playable after every commit.

| Phase | What | Commit(s) |
|---|---|---|
| 0 | This audit, `git init` | 1 |
| 1 | Registry + adapters + supersession map + clip player with `ended` + hover + dev sprite browser (`?sprites`); server charset/gif fix | 1–2 |
| 2 | Overworld: biome re-skins and new tiles/objects/enemies, noise variants, transitions, clustered objects and landmarks, themed packs, 5 realm enemies, elites hookup point, Kraken/Treant events (after Phase 4's framework), Giant Watermelon; profiling before/after (chunked ground cache, sleeping enemies, spatial hash, pooling) | 3–4 |
| 3 | Dungeons one by one: Frostveil, Mirerot, Astral, Sandscour, Crimson Keep, Hollowmoon, then the Crypt/Ember detail pass | 1 per dungeon |
| 4 | Boss framework (states, morphs, data-driven patterns, phase pips, door lock), then the 10 bosses, each with its own note | framework + 1 per boss |
| 5 | Elites (10) | 1–2 |
| 6 | Items: art swap, 16 d2 items, 12 melon items, legendaries' stats, shine/twinkle | 1 |
| 7 | Pets v2 and eggs with save migration | 1 |
| 8 | QA checklist, playthroughs, tuning log | 1 |

Practical order: Phase 4's framework is needed by the realm events in Phase 2 and every dungeon boss in Phase 3,
so I'll build the framework right after Phase 1, then do Phase 2, then each dungeon with its boss together.

## 6. Decisions taken (2026-10-09)

| # | Decision |
|---|---|
| D1 | `git init`; baseline commit of today's game; one commit per phase |
| D2 | Runtime registry; bundle `native/` sheets drawn at 2× with the game's own outline; x5 sheets unused; bundle generators not run |
| D3 | Biome mapping as in the table above (default, revisit in the Phase 2 design note if it plays badly) |
| D4 | Change mine: rename Maestro Vesper and replace his string mechanic; rename the Orrery of Winter |
| D5 | Namespaced registry keys; `ex_mirerot/bog_toad` → `mire_toad` in game data |
| D6 | Merge pets: keep feeding/fusing; 20 lines become kinds; form by level; family × rarity eggs; migrate old pets |
| D7 | Crypt/Ember keep layouts; the Lich and Colossus get the brief's 3-phase designs |
