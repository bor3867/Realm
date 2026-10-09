# Realm Update: decisions and tuning log

## Phase 0 (audit)
- D1–D7 in `docs/audit.md` §6 (git, runtime registry with native 2x art, biome mapping, renaming my overlapping
  bosses, namespacing, merged pets, Crypt/Ember get the brief's bosses).

## Phase 1 (assets)
- Bundle data copied to `art/bundle/`; `realm_update/` untouched and git-ignored.
- Boss feet: centred x, lowest opaque row (the bundle's `base_offset` lives only in its Python source).
- Dev server: UTF-8 charset, GIF/WebP types, and a localhost-only capture endpoint for in-page screenshots.
