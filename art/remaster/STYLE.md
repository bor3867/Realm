# Realm remaster: style and rules (read fully before drawing)

You are redrawing the game's ORIGINAL sprites (shown in `orig/ref/<section>/<idx>.png`, indexed in `orig/INDEX.md`)
in the style of the Realm Update art we made. The user dislikes the originals: make every sprite clearly better,
"something special", while keeping its identity (what it is, its role, its rough colours/theme, its frame roles).

## The look (Realm of the Mad God style, as in our packs)
- Bold, readable silhouettes first. Every sprite must read at a glance at game size. Chunky shapes, no thin noodles.
- Limited ramps: 3-5 tones per material, **hue-shifted** (shadows lean cool/purple, highlights lean warm/yellow).
- Light from the **top-left**. Shading is **banded** (clean bands of colour), never gradients, never dithering,
  never per-pixel noise, never checkerboards. Clusters, not speckle.
- One accent colour per creature (eyes, gems, glow) that pops against its body.
- `#140f1c` ink for eyes, mouths and interior lines. **Do not bake an outer outline** into the native frames:
  the game/our x5 sheets add a 1px dark outline at screen resolution (`pixlib.outlined`). Leave a 1px transparent
  margin inside the cell where you can so that outline isn't clipped.
- Selective outlining inside a sprite (a darker edge where a limb overlaps the body) is good.
- Animation is subtle and clean: idle = 1px breathe/bob or a blink; walk = clear leg/arm alternation with a
  1px bob; tell (wind-up) = an unmistakable pose change; attack = the release; hit = a clear flinch or flash;
  death = a readable collapse/dissolve in clean chunks (2-3px blocks, not per-pixel noise).
  Avoid re-drawing the whole sprite slightly differently each frame (that makes everything shimmer).
- Things that fly or float: don't bake a bob into every frame; the engine adds a slow hover.

## Resolution (keep the original cells; drop-in replacements)
- Creatures (classes, monsters, champions, bosses, NPCs, pets in objects) are drawn at the **native pixel size of
  their cell** (16x16, 24x24, 48x48, 64x64): one sprite pixel = one cell pixel. Use the whole cell sensibly
  (bosses especially: big, imposing, detailed).
- Tiles, decor, landmarks, fx, items and projectiles are **8-bit style art stored doubled**: draw at half size
  (8x8 for a 16x16 cell, 16x16 for 32x32 landmarks) and `double()` it. Exception: you may use native 16x16 for a
  projectile or object only if it truly needs it, but prefer doubled for consistency.
- Same number of frames, same frame order, same role per frame as the original. Look at each original frame
  and produce the equivalent pose/state. Frame roles (when unsure, look at the original):
  - monsters (9): 0-3 walk cycle, 4 neutral (= frame 0), 5 tell (wind-up: glow, raised wings...), 6 attack (lunge/release), 7-8 death
  - champions (9): similar: walk/idle frames first, then tell, attack, hit, 7-8 death (verify against ref)
  - bosses (10, row): 0-3 idle/move, 4-6 tell/attack/cast, 7 hit or enrage, 8-9 death (verify per boss)
  - classes: labelled per clip in INDEX.md (front/side/back idle/walk/attack, ability, hit, death)
  - tiles: variants/animation frames as labelled; edges are blends between lands, keep them seamless.
  - items: 12 frames = tiers 0..11 left to right: each tier must look more valuable than the last
    (better materials, gems, glow) while clearly the same item type. Uniques get one signature detail each.
- Sprites that face a direction in the original keep facing it.

## Tools
- `kit/remaster.py`: `ref()`, `save()`, `save_ext()`, `review()`, `review_frames()`, `double()`, `fit()`.
- `kit/pixlib.py`: `render(grid, pal)` turns char grids into images (our hand-drawn method); `outlined()`; `hurt_frame()`.
- `kit/bosskit.py`: masks + banded part shading (`Canvas.part`, `ellipse`, `poly`, `path`, `serpent`, `stamp`...)
  used for our big bosses. Great for 24-64px creatures; hand-stamp faces and details on top.
- Look at how our best sprites were made before you start (read a couple):
  - 8x8 hand grids: `/home/claude/realm_dungeons2/data/crimson.py`, `/home/claude/realm_dungeons2/data/carnival.py`
  - items: `/home/claude/realm_items/items_weapons.py`, `/home/claude/realm_melon/melon_items.py`
  - ~20px creatures: `/home/claude/realm_elites/creatures/*.py` (e.g. siren.py, storm_gryphon.py)
  - big bosses with phases: `/home/claude/realm_bosses/bosses/orrery.py`, `/home/claude/realm_dungeons2/bosses/count.py`
  - our pixel previews: `/home/claude/realm_update/previews/*.gif`

## Extra content (new, no old slot) via `save_ext()`
- Monsters: 1 new shot each (16x16 cell, 2 frames, points right, 8-bit doubled style), themed to the monster.
- Champions: 2 new shots each.
- Bosses: phases 2 and 3 + morphs + death (same cell size as the boss):
  `p2_idle`(4) `p2_attack`(3: windup, release, recover) `p1_to_p2`(4) `p3_idle`(4) `p3_attack`(3) `p2_to_p3`(4)
  and 6 new shots (2 per phase: meta={"phase": n}). The original 10-frame row stays as phase 1 (drop-in).
  Each phase must look clearly different (a real transformation), and morphs must read as the change.
  Give each phase a name: save_ext(owner, "boss", "phases", [], meta={"names": {"1": "...", "2": "...", "3": "..."}}).
- owner = snake_case of the label (e.g. "Brine Cathedral" -> "brine_cathedral").

## Quality bar and process
- Work sprite by sprite (or a few at a time): draw, `review()` before/after, LOOK at the image with the Read tool,
  fix what reads badly, then move on. Don't batch everything and look once at the end.
- Write your generator code under `/home/claude/realm_remaster/work/<your_area>/` so it can be rebuilt.
- Do not edit files outside `work/<your_area>/`, `strips/`, `ext/` (and only your own sprites there).
- Do not touch other agents' sprites. Finish every sprite assigned to you.
