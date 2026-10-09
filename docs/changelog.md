# Realm Update: decisions and tuning log

## Phase 0 (audit)
- D1–D7 in `docs/audit.md` §6 (git, runtime registry with native 2x art, biome mapping, renaming my overlapping
  bosses, namespacing, merged pets, Crypt/Ember get the brief's bosses).

## Phase 1 (assets)
- Bundle data copied to `art/bundle/`; `realm_update/` untouched and git-ignored.
- Boss feet: centred x, lowest opaque row (the bundle's `base_offset` lives only in its Python source).
- Dev server: UTF-8 charset, GIF/WebP types, and a localhost-only capture endpoint for in-page screenshots.

## Phase 2a (overworld performance)
- Draw 13.7 → 3.7 ms/frame in the realm; minimap 6.9 → 0.09 ms. Details and before/after table in
  `docs/design/02_overworld.md`.
- Skipped on the numbers: enemy spatial grid and bullet pooling (neither was the cost).

## Phase 2b (ground, transitions, the Greenmarch)
- Bundle tiles drawn as skins over tiles that keep their meaning; new `cliff` and `rift` tiles.
- New land: the Greenmarch (lowlands) in ring 1, facing the landing beach; borrows shore monsters until 2d.
- Dithered borders by jittered sampling (±3 tiles); variants by slow noise. Tuning notes in 02_overworld.md.

## Phase 2c (objects, clustering, landmarks)
- 25 bundle objects placed per land by rule (groves, meadows, by water, on rock, under ledges, along rifts); old
  objects kept in the mix. Oak density doubled after looking (groves were too thin).
- Campfire camps recorded for 2d; six new landmarks (Beached Skiff, Haywain Cross, Elder Grove, Cairn Ring,
  Bleeding Fountain, Thistle Farm). Skiff placement picks from the wet-sand rim directly (random sampling missed it).

## Phase 2d (overworld monsters)
- 20 overworld + 5 ow2 monsters in their mapped lands; the Field Warden leads the Greenmarch; packs and campfire bands.
- Tuning: hermit shell 4 hits / 0.6 s, 1.5 s shut, 4.5 s before it can shut again. Registry monsters' facing inverted.

## Phase 2e (the Giant Watermelon)
- Rare realm event (src/melon.js), 12 melon items with registry icons, slice heal-over-time, `/melon`.
- Spawn chance 0.006 tried first (median 0.64 h), set to the bundle's 0.004 (about 1 h). Splashes cut from 6 to 2.

## Phase 2f (realm event bosses) — Phase 2 complete
- The Abyssal Kraken (reef off the shore) and the Thornheart Treant (clearing in the Thornwood), on the boss
  framework; `/kraken`, `/treant`; six items.
- Rule change: shots fly over open water. Lob landing hooks, registry lob marks, whirlpool drag.
- Tuning: causeway kept out of the pool; ink 0.78 opacity; seed marks made bold.
