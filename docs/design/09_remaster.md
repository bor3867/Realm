# The Realm Remaster (realm_update_2, BRIEF.md §"Phase 0.5")

The second bundle is the first one plus `packs/remaster`: every original sprite (the 1,069 of commit `8a276e0`, the
ones in `docs/old_sprites.html`) redrawn in the Realm Update's style, as drop-in sheets with the same names, sizes and
cell positions. It also revises the melon event (a 13th item, the Melon Orb). Everything else in it is byte-identical
to the first bundle.

## How it went in
- The remaster's sheets are kept as source art in `art/remaster/` (with its README, STYLE.md, sprite index, the
  baseline `world_baseline.json` it was drawn against, and the new-content atlas and frames in `ext/`).
- `tools/apply_remaster.py` puts them into the game:
  - **Creature sheets** (the ten classes, monsters, champions, realm and dungeon bosses, the Fallen Heart, the
    Unstruck God, the Unstruck) haven't moved since the baseline: copied straight over.
  - **World sheets** (tiles, objects, items, projectiles, decor, landmarks, fx) grew during the Realm Update: six
    dungeon portals (18 cells) and the boardwalk tile were added, shifting 151 objects, the bags and the tile edges.
    A straight copy would have put the wrong art on half the objects, so these are overlaid **by name**: each
    original sprite's cells go from where the remaster has them to where that sprite lives now. The portals and
    the boardwalk stay as they are.
  - `world_art.py` and `heroes8.py` call it after they bake, so rebaking can't bring the old art back.
- `tools/check_remaster.py`: every creature sheet is the remaster's, all 1,788 remastered world cells sit where
  their sprites now live, and the art added since the baseline is untouched.
- The Priest: the remaster replaces both the baseline priest and the redraw made in this update (`heroes8.py`
  still holds that redraw, but the remaster is applied on top of it).
- Items that already use Realm Update art (`reg`, 44 of them: boss and dungeon gear) keep it; the remaster
  covers every tiered item and every item still on the old sheet.

## The melon event
- `art/bundle/melon_event` takes the new atlas and item sheet (its other two sheets are unchanged).
- **The Melon Orb** (`melon_orb`, a Hexweaver's curse): curse r3.4 for 5 s (+25% damage taken), a burst of ten
  seeds; joins the melon's rare (6%) drop pool with the Seedspitter Bow, the Rind Bulwark and the Dewdrop Ring.

## Not yet wired: the remaster's new content (`art/remaster/ext/`, `atlas_remaster_ext.json`)
The remaster also draws content with no old slot:
- **17 bosses** (the six realm bosses, Emily, the Fallen Star, the dungeon bosses of the original game, the Unstruck,
  the Unstruck God): a phase 2 and phase 3 each (idle, 3-frame attack, two morphs, a death clip, phase names) and
  6 new shots each.
- **36 champions**: 2 new shots each; **96 monsters**: 1 new shot each.

These need new attack patterns, not just new pictures (the brief: every phase its own patterns from its own
shots), so they are the next step, done boss by boss like the rest of the update.
