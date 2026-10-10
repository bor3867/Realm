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

## Phase 3 — Frostveil Hollows (dungeon 1 of 6)
- New dungeon (style `frostveil`), Glacius on the boss framework, chill, wall faces for skinned walls, its portal art,
  key and loot (Glacius' six items from `ix_items`). Notes: dungeon_frostveil.md, boss_glacius.md.
- Tuning: tunnels centre to centre (blob edges); Glacius' start moved in from the edge.

## Phase 3 — Mirerot Grotto (dungeon 2 of 6)
- New dungeon (style `mirerot`), Mother Mycelia, spore pods and poison clouds, boardwalks over bog, its portal,
  plank tile, key and loot. Notes: dungeon_mirerot.md, boss_mother_mycelia.md.
- Both dungeon checks now also test that every room is inside the map and none overlap.

## Phase 3 — The Astral Observatory (dungeon 3 of 6)
- New dungeon (style `astral`): walkable void, rune circles, clockwork bridges, the telescope dais and its star
  bridge; the Grand Orrery. Notes: dungeon_astral.md, boss_grand_orrery.md.
- Audit D4 done for the Orrery: the Runeholt boss is now the Rime Astrolabe (display names only; ids unchanged).
- Framework: arena seals skip the void; a `drawTop` hook for boss layers over the bullets.

## Phase 3 — Sandscour Tomb (dungeon 4 of 6)
- New dungeon (style `sandscour`): dunes outdoors, the tomb's long hall, urns, waking sarcophagi, the sealed vault,
  quicksand; the Gilded Sphinx. Notes: dungeon_sandscour.md, boss_gilded_sphinx.md.
- Engine: an enemy `leash`; shots break urns through `hitObject`.
- Tuning: burial sarcophagi 24 → 12, wake reach 3 → 4.5; sanctum floor to sand; dust devils drawn once, upright.

## Audit D4 — the Marionette Theatre's boss
- Maestro Vesper is now **Maestro Lucan, the Puppeteer** (Count Vesper is the Crimson Keep's).
- His string-anchor mechanic (hanging marionettes that kept him immune) is gone: the Ringmaster owns puppets on
  strings. In its place, **trapdoors**: he drops through the stage, three hatches light in turn, and he bursts up out
  of the last (always near you) in a ring of ribbons. It opens his first and last phases and recurs in both.
  The hanging marionette stays defined but no longer spawns. Checked headless: six drops in a fight, five of six
  surfacing within 7 tiles of you, no marionettes, the fight ends.

## Phase 3 — the Crimson Keep (dungeon 5 of 6)
- New dungeon (style `keep`): candlelight vs. the dark, coffins, waking statues, ledge gargoyles, the gallery and the
  crypt, blood pools; Count Vesper. Notes: dungeon_crimson_keep.md, boss_count_vesper.md.
- Engine: delayed events (`fvLater`) run for every map; window walls; coffin open frames.

## Phase 3 — Hollowmoon Carnival (dungeon 6 of 6)
- New dungeon (style `hollowmoon`): spin tiles, cannons, strikers, jack crates, the carousel, ghouls through walls;
  the Grinning Ringmaster. Notes: dungeon_hollowmoon.md, boss_grinning_ringmaster.md.
- Framework: `dmgMult` and `barTag` boss hooks; `lureTo`, `noclip` and `ai: 'carousel'` on enemies.
- Fix: the Trick Deck's missing curse.

## Phase 3 — the Crypt and the Emberforge (audit D7) — Phase 3 complete
- The Tidebound Lich and the Forgeheart Colossus are now three-phase framework bosses (notes:
  boss_tidebound_lich.md, boss_forgeheart_colossus.md), keeping their own old signatures. Their brief legendaries
  (the Tidewraith Staff, the Forgeheart Maul) join their loot.
- Detail pass: the Crypt's tomb halls are candle-lit down both walls with crypt water to wade across them; the
  Emberforge's vents erupt on a timer (a second's glow first), and its forge floor has six vents for the Colossus.
- **Fixed (audit D5)**: the Mirerot toad had been defined as `bog_toad`, overwriting Ashfen's own Bog Toad (its packs,
  quest and bestiary all pointed at the Mirerot one). It is `mire_toad` now (art: `ex_mirerot/bog_toad`). A new
  check diffed every baseline monster and item against now: nothing else was overwritten.
- `tools/check_ow2.mjs` now checks only the overworld's own monsters, and waits for the scorpion to run hot.

## Phase 5 — Elites
- Ten elites, two per land, each with its own ability on a cooldown (the clip is the telegraph), escorts, nameplates,
  an arrival telegraph, better loot and a raised egg chance. Note: docs/design/05_elites.md.
- Tuning: the Siren's charm ring 3.5 → 6 tiles; the burrow mound drawn large for elites.

## Phase 6 — Items
- The last 12 pack-1 items the Item Overhaul redrew now use its art (`reg: ix_items/*`); their old art stays in the
  items sheet. Note: docs/design/06_items.md (the ten legendaries' stats and descriptions are there for review).
- Inventory: items catch the light now and then, one slot at a time: their own shine frames every 5 s, or a soft sweep
  clipped to the item for the old art; legendaries also twinkle. Icons are drawn per frame in frame 0's box.
- Legendaries: their own slot colour, tag (L) and tooltip badge; their bags are starfall rank with a broad gold beam
  and sparkles, and "A LEGENDARY drops!".
- The Tidewraith Staff's bolts now really bend with the current (new weapon special `current`), as its description
  says. Event Horizon's description no longer promises homing it never had: it says what it does (damage on the move).
- New check: `tools/check_items.mjs`.

## Phase 7 — Pets and eggs (audit D6: merge)
- Pets wear Pets v2: the 20 lines are the kinds, and a pet's form follows its main ability (baby → evolved at 30 →
  divine at 100). Feeding, fusing, rarity caps and Heal / Magic Heal / Shield are unchanged. A rarer egg hatches a
  pet at a higher level (1 / 5 / 10 / 20 / 30). Note: docs/design/07_pets.md.
- 50 eggs (family × rarity) that hatch at your feet with their own clip, the pet coming out on the burst; the rarity
  shows in the egg's name, slot tag and tooltip. Drops step up a rarity in harder lands and keep to each land's
  families; Divine eggs come only from the final god. The Pet Yard sells two families a day.
- Pets: idle / follow / happy clips, a heart when pleased, an evolution flash and banner.
- Migration: old pets keep their levels and move to the closest line (Ember Fox → Shiba Pup, Frost Kit → Frost Fox,
  Rune Owl → Owlet, Lantern Moth → Moth Sprite, Tide Turtle → Jade Gecko, Bog Frog → Bubblefin, Salt Crab → Coral
  Seahorse, Star Wisp → Wisp Ghost); old eggs become family eggs of the same rarity.
- Fix: `tools/check_events.mjs` no longer places you off the map's edge (a flaky "woke before you came").
- New check: `tools/check_pets.mjs`.

## After Phase 7 — the Priest, and the admin reference
- The Priest's 8x8 sprite is redrawn (`tools/heroes8.py`): the one-pixel-feet pass had left it with a spiky gold
  crown that read as antlers. It is now a white hood and robe, a flat gold halo over the head, a gold clasp and a
  wand. Only the priest's sheet was rebuilt.
- `ADMIN_REFERENCE.md` (via `tools/admin_reference.mjs`) now covers everything in the update: the six new dungeons'
  tiers, hazards and bosses; the ten three-phase bosses (phases, mechanics, relics, legendary, how to fight each);
  realm events; elites; legendaries; Pets v2 lines, forms, rarities and the 50 eggs; and `/bx`, `/kraken`,
  `/treant`, `/melon`. The in-game `/help` lists the new commands.
- The Priest's side view redrawn: a hood behind and a face in profile, no arm and wand sticking out (the wand shows
  when it attacks). Its skin is left unshaded (`flat`), since the shading pass darkened a side-on face into a hole.

## Fix: every three-phase boss crashed the game when it died
- The death burst looked for the boss on the old boss sheet; none of the ten new-framework bosses is there (the six
  new dungeons, the Crypt's Lich, the Emberforge's Colossus, the Kraken and the Treant). It takes its colours from the
  boss's own art now, and anything without old art gets a plain burst. Checked in the browser: all ten die, with a frame
  drawn every step, and the game carries on.

## Boss rework: harder, denser, still fair (docs/design/08_boss_rework.md)
- Framework: pressure layers (attacks on their own timers under the main cycle), tempo, damage scale, and a finale for
  the hardest three (immune, a survival sequence, then BROKEN: +50% damage taken).
- Glacius, the Grand Orrery and the Forgeheart Colossus are the hardest (×1.45–1.6 damage, tempo 0.64–0.68, new
  patterns every phase, finales Absolute Zero / Collapse / Meltdown; Glacius 300k life, the Orrery 380k).
- Every other boss gains its own pressure layer and new patterns (obelisk sand, moulting and the scales; pod puffs,
  chained lunges and sprout needles; drift bolts, souls from behind and the undertow; pillar bats, dash volleys and
  boiling pools; juggling pins and the grin; spouts; the canopy).
- Measured with a dodging bot (`tools/check_boss_pressure.mjs`): the hardest three went from ~2,000–2,500 damage a
  minute to ~8,900–10,800; the rest to ~2,000–5,200.
- Fixes found on the way: Glacius' phase 2 never reached a player at the lake's edge; the tools placed you outside the
  Frostveil boss's room.

## Old sprites document
- `docs/old_sprites.html` (`node tools/old_sprite_book.mjs`): every sprite from before the Realm Update, read from the
  baseline commit, named, grouped and searchable (1,069 sprites).

## The Realm Remaster (realm_update_2) — every original sprite redrawn
- All 1,069 original sprites (classes, monsters, champions, bosses, tiles, objects, items, projectiles, decor,
  landmarks, effects) replaced by the remaster's. Source art in `art/remaster/`; `tools/apply_remaster.py` copies
  the creature sheets and overlays the world sheets by name (they grew during the Realm Update, so a straight copy
  would have misplaced 151 objects); the bake scripts reapply it. `tools/check_remaster.py` verifies every cell.
  Note: docs/design/09_remaster.md.
- The melon event's revised sheet and a 13th item, the Melon Orb (a curse that scatters seeds), in its rare pool.
- `.gitignore`: later update bundles (`realm_update_*.zip`, `realm_update_*/`) stay out of git, like the first.
- Not yet wired: the remaster's new boss phases (17 bosses) and the new monster and champion shots.
