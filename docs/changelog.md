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
