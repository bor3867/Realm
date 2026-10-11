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

## The Remaster's new content
- 15 original bosses morph at 66% and 33% into the remaster's phase 2 and 3 art (immune morph, phase names, death
  clips) and gain a new attack per phase from their new shots; monsters fire their new shot every fourth volley;
  champions add a signature volley. `src/remaster.js`; check: `tools/check_remaster_ext.mjs`.

## Boss overhaul: set pieces and movement (docs/design/10_boss_setpieces.md)
- `src/setpieces.js`: a set-piece engine (steered bullet formations, ground telegraphs, boss movement) and a
  handcrafted signature for all 25 bosses; a movement style for each original boss (they all used to keep the same
  distance); background layers for the Sleeper and Maestro Lucan; denser patterns for both.
- No more white flash on bosses (hits or wind-ups).
- Checks: `tools/check_setpieces.mjs`, `tools/check_old_boss_pressure.mjs`.

## Fixes and a pass over every relic
- UI: bigger equipment, backpack and potion slots (as big as the panel allows); a slightly smaller minimap; the loot
  bag is one row of eight, so the loot and dungeon-portal panels always fit.
- Only large things block (trees, rocks, spires, pillars, walls, statues, great furniture, gates); chests, crates,
  barrels, braziers, fences, seats, signs, lamps, shrines and people are walkable. Chests, urns, crates and spore pods
  still catch your shots.
- The Kraken's pool drains to wadeable shallows after it dies, so its loot can be reached; it deepens again when the
  Kraken returns.
- The loot bags have their old art back.
- Every untiered, legendary and mythic item has an effect and a shot of its own (docs/design/11_unique_items.md);
  14 weapons that fired nothing now fire (the Wand of Hoarfrost among them).

## The Astral Observatory, reworked (realm_astral_plus; docs/design/dungeon_astral.md, boss_grand_orrery.md)
- All of the pack's art in: elites, monsters, shots, tiles, decor and treasure (`art/bundle/astral_plus/`, a new
  registry adapter for its format; the weaver and the wisp hover).
- Six new monsters (four with an ability each), new shots for the four old ones, ~90 monsters a run instead of ~40,
  thirteen rooms instead of nine, new floors and decor, and a star vault with a sleeping keeper who seals it.
- The rune circle that carried you from the entrance to the boss's door is gone; the antechamber is a guard room.
- The Grand Orrery: a new RotMG-style first phase; the eclipse up all fight, burning whoever stands in it; black
  holes drawn as black holes; more patterns; a new finale (a singularity that swallows everything, then a
  supernova). The conjunction (shots frozen, then loosed at you) is removed.

## Quality of life, the dungeons' items, no teleporters in the Observatory
- Damage numbers (and words like IMMUNE) float above the head of whoever they belong to, following them, staggered
  when several land at once, instead of over their body.
- Key hints show your own keys and disappear for an action with no key: the [F] over portals and people, the panel's
  key line, the potion label, Leave/Close buttons, quest hints, the waypoint banner. The portal and talk buttons show
  the key when there is one.
- A Take all button on loot bags for mouse players.
- The Astral Observatory has no rune circles left: no teleporters at all.
- Every dungeon's items: names that match what they are, and a dungeon-themed set of orbiters (planets and black
  holes from the Orrery Halo and Event Horizon Ring, bats, scarabs, bees, souls, masks...). No item seeks any more.
  docs/design/11_unique_items.md.

## The Grand Orrery, second pass (realm_astral__singularity)
- Small singularities with their own sprite (the boss's and the astral items' black holes); they drift, pull and burn.
- Pink bolts drawn as lasers; the yellow shots stop flickering.
- It grows 1.75x in its Collapse; the finale is 36 s (was 17.5); a slow death that holds, then bursts in rings.
- Fixed: after one shot of a volley hit you, the rest of that volley did no damage for the rest of its flight (every
  enemy, every boss). Shots now hit a touch wider too. Every boss is somewhat harder for it.

## Hitboxes, the panel, the eclipse
- **Hits follow the art.** A shot used to hurt only inside a small fixed circle round your middle (whatever its size
  or shape), so most shots had to overlap your sprite by about 6-7 pixels before they counted. Now you are an upright
  capsule just inside your sprite, and every enemy shot is checked by its own visible pixels (src/data/shot_boxes.js,
  measured from the art by tools/shot_boxes.mjs; a capsule first, then the pixels when it is close). Upright and
  diagonal sprites, crescents and waves are handled as drawn. tools/check_hitboxes.mjs: for all 512 enemy shots, from
  24 directions at 8 headings, 95% of hits land within 3 px of the art touching yours (14.7% before).
- No screen shake, red flash or white blink when you are hit.
- The side panel: the Stats | Pet tabs never hide any more (the slots and the minimap give way instead), and the loot
  bag is four by two, like the backpack.
- The Grand Orrery's eclipse comes and goes (transits, marked first) instead of filling the screen all fight; the
  survival phase's strands all have openings. docs/design/boss_grand_orrery.md.

## Clearer realm, a stronger halo, a loading card, look-ahead
- The realm's walls of stone are gone: no more highland crags (long one-tile ledges), thickets are small clumps,
  low ruin walls (fewer of them) and whale ribs are walkable, half the rune pillars. Realm bosses pass over rocks,
  trees and thickets, so they never get stuck.
- The priest's halo: a narrower pillar that falls at once (0.15 s) and strikes everything under it for 2.8x its
  damage, then burns briefly.
- Portals show a loading card (where you're going, its danger, a spinner) while the next place is made.
- Look ahead (H, rebindable; a setting): the camera puts you near the bottom of the screen to see further ahead.

## The HUD, fixed
- One fixed RotMG-style layout that never resizes itself: minimap, you, the bars, your equipment, one box for
  Backpack | Stats | Pet (the backpack by default), the potions, a reserved place for a bag (4x2) or a portal, then
  where you are. Short windows get one smaller fixed size. (ui.fitPanel no longer does anything.)

## Whole numbers, a second survival
- Damage is always a whole number, and so is every number that floats up (no more -60.000000001).
- The Grand Orrery: the big singularity of its first survival uses the singularity sprite; wider openings in every
  strand and ring of that survival; red warning circles where its debris will land; the Clockwork pattern is gone.
- A second survival, SUPERNOVA, at 4%: the floor goes dark but for the light round you; the machine swells and burns
  white and throws pulse after pulse (rings with openings), flare spirals with openings, meteors on red circles,
  faster to the end (26 s). The boss framework allows a second finale (B.finale2).

## Shot and companion sizes
- Every shot is drawn at the size its attack meant (its size: about 2.4x that radius for an enemy, 2.2x for yours);
  art bigger than that is drawn smaller (never bigger), and its hits shrink with it. Beach monsters' shots that were
  as big as meteors are now a little under a tile.
- Orbiting companions (the crown's motes and every other) are about two-thirds of a tile; item black holes about a
  tile and a half.

- Fixed: a dragged item's icon could stay stuck on screen (a lost release, a second press mid-drag, or a slot
  hidden by another tab). A drag now always cleans up after itself.
- The trophy statues of the great foes you have beaten stand in your vault now (it is bigger, 27x16, with a pedestal
  round the walls for each), not in the Nexus.
- Admin: `/spawn ID` takes any monster, elite or boss (realm, dungeon or three-phase); `/give dungeon ID` gives a
  dungeon boss's whole loot set; `/bosses` lists every boss. ADMIN_REFERENCE.md regenerated with all of it (every
  item, enemy and boss; all 232 spawn ids and 505 item ids checked to work).
