# Phase 1 design: one asset registry and one animation player

## What it does
Loads every bundle atlas into a single registry next to the game's existing baked sheets, so the rest of the
update can ask for `bx_gilded_sphinx/gilded_sphinx` or `el_shots/siren.song_note` and get frames, clips, a pivot
and metadata in one shape. It adds the animation player every new creature uses, the renderer hook that draws a
registry sprite the same way existing sprites are drawn, renderer-side hover, and a dev sprite browser.

## How it plugs into the existing code
- **Files:** the bundle's `native/*.png`, its atlases, `HOVER.json` and `MANIFEST.json` are copied (data only) into
  `art/bundle/<pack>/`. `art/bundle/index.json` lists the atlases. The bundle's Python generators are not run.
  `realm_update/` itself stays untouched and out of git.
- **Loading:** `src/assets.js` keeps loading the 17 baked sheets and `world.json` exactly as today, then awaits
  `loadRegistry()` from the new `src/registry.js`. Each sheet PNG is decoded once (`Image`), never per frame.
- **Scale and outline (decision D2):** registry art is native 1x. It is drawn at **2 buffer pixels per art pixel**
  (one 8 px cell = one 16 px tile, the size of every existing sprite) through the existing `outlinedFrame` cache,
  so new and old sprites share one outline weight. The x5 sheets are not used. Tiles and decals are drawn without
  outline (the bundle marks them unoutlined).
- **Drawing:** `Renderer.drawDef(def, frame, x, y, opts)` mirrors the existing `spr()`: snaps to whole pixels, flips
  for facing, supports a hit flash, rotation (shots), alpha (after-images, ghosts) and a scale multiplier.

## The common shape (`SpriteDef`)
```
{ key: 'ex_frostveil/rime_wolf', sheet, name, img,
  frames: { run1: {x, y, w, h}, ... },        // native rects
  anims:  { move: {frames: ['run1','run2'], fps, loop}, ... },
  pivot:  [px, py],      // top-left of the 8x8 base cell (bundle convention)
  foot:   [fx, fy],      // where the sprite stands, in frame pixels (see below)
  size:   [w, h], kind: 'creature'|'boss'|'shot'|'tile'|'decor'|'item'|'pet'|'egg'|'object'|'fx',
  hover:  'float'|'flutter'|'glide'|'boss'|'pet'|null, meta: {...the atlas's info} }
```
Adapters, one per atlas format:
| Format | Packs | Notes |
|---|---|---|
| `sheets.*.native.sprites` (list of `[frame, rect]`) + `animations` + `info` | expansion_one, overworld, elites, dungeons_two (sheets), melon, pets_v2 | one def per sprite |
| `bosses[key]` + `phases` + top-level `shots` | boss_overhaul, dungeons_two (bosses) | boss def keeps `phases`; each shot is its own def under its sheet (`bx_shots`, `bx2_shots`) |
| `items[name]` | item_overhaul | one def per item, `meta.tier` |

**Foot anchor.** Creatures stand on their base cell: `foot = [pivot.x + 4, pivot.y + 8]`. Bosses and the melon
are anchored at their feet: the boss source's `base_offset` isn't in the atlas, so at load the registry scans the
first idle frame's alpha for its lowest opaque row and centre column (the melon uses its atlas `anchor`). Shots
are centred.

## Supersession
One data map, applied when a key is resolved (`registry.resolve(key)`), so call sites never change one by one:
- `items/<name>` → `ix_items/<name>` for every redrawn item, except `health_potion`, `mana_potion`,
  `potion_of_might` and the loot bags (kept).
- `pack_bosses/tidebound_lich` → `bx_tidebound_lich/tidebound_lich`, same for the Colossus.
- `ex_*/<boss>` (the six 16x16 bosses) → their `bx_*` defs. The 16x16 sphinx stays reachable as
  `ex_sandscour/gilded_sphinx_lesser` for the Lesser Sphinx enemy.
- `ex_items/<name>` → `ix_items/<name>`, keeping the six `potion_of_*`.
Short aliases (bare `<sprite>`) are added only when exactly one sheet has that name.

## Animation player (`src/anim.js`)
`new Anim(def)`; `play(clip, {speed, restart})`, `queue(clip)`, `update(dt)` → advances time and returns `'ended'`
once when a non-looping clip finishes (it then holds its last frame, or starts the queued clip). `frame` is the
current frame name; `on('ended', fn)` for gameplay. Bosses, elites, pets, eggs, items, the melon all share it.

## Hover
`hoverY(def, t, phaseOffset, bossPhase)` implements `HOVER.json`: `round(sin(2πt/period + φ) · amplitude · 2)`
buffer pixels (2 = our pixels per art pixel), only for listed sprites (bosses only in their listed phases). The
shadow stays on the ground; hitboxes are never offset.

## Dev sprite browser
`index.html?sprites` opens a full-page browser instead of the game: every registered def animating at 2× over a
checker floor, grouped by sheet, filterable, with a clip picker, the pivot cell and foot point drawn as markers,
and a count of defs per pack. It uses the same `drawDef` path as the game.

## Also in this phase
`tools/serve.mjs`: `charset=utf-8` for text types and `.gif`/`.webp` MIME types (bundle previews rendered "Â·").

## How it's tested
- Headless: a node check that loads every atlas through the adapters, resolves every name the MANIFEST lists,
  checks every clip's frames exist, and checks the supersession map resolves.
- In the browser: the sprite browser; scan each sheet for pivot, facing and outline problems; screenshots in
  the commit summary.
- The game still starts and plays (soak test) with the registry loaded.

## Result (built)
- `src/registry.js` (adapters, supersession, hover), `src/anim.js` (clip player), `Renderer.drawDef`, the sprite browser
  (`index.html?sprites`), `tools/check_registry.mjs` (headless check). 533 sprites from 8 packs, 110 redirects,
  38 hovering sprites, 10 bosses.
- Decisions made while building:
  - The melon sheet stores its states as sprites with one flat clip map: it registers as one def,
    `mx_giant_watermelon/giant_watermelon`, anchored at its atlas `anchor`.
  - Foot rules: an 8x8 cell (or 8x16 tall decor) stands on its pivot cell; anything larger with no usable pivot
    (bosses, elites, the old 16x16 bosses kept as the Lesser Sphinx) is centred, on its lowest opaque row.
  - Sheet images load with `onload` promises, not `decode()` (decode stalled in a background tab).
  - Dev capture: `tools/serve.mjs` accepts `POST /__dev/shot/<name>` (localhost) and writes `.devshots/<name>.png`
    (git-ignored). The sprite browser exposes `__capture(filter, name)`. This lets the art be checked even when the
    browser pane is not on screen.
- Checked: every sheet in the sprite browser (bosses, expansion, overworld, elites, dungeons two, pets, eggs,
  melon, items); boss feet sit on the baseline; tall decor stands on its tile; tiles and the ground shadow draw
  without outline. The game boots with the registry, and the soak test passes.
