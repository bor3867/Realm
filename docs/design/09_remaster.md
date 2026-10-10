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

## The new content (`src/remaster.js`, art in `art/bundle/remaster/`)
- Registry: `rx_<boss>/<boss>` (phase 2/3 idle and attack, both morphs, the death clip, phase names) and
  `rx_shots/<owner>.<shot>` (every new shot; they point right and are rotated in flight).
- **15 original bosses** (the six realm bosses incl. Emily and the Fallen Star, the eight old dungeon bosses, the
  Unstruck): at 66% and 33% of their life they morph: immune for the clip, their bullets cleared, a banner with the
  phase's name; then they wear that phase's art (its attack frames on their tells and attacks) and die with its death
  clip. Their own mechanics and rotations are unchanged.
- Each phase gets one new attack from that phase's two shots (a shape each: fans, volleys, rings, curls, seekers,
  boomerangs, splits, walls, cages, orbits...), damage matched to the boss's own attacks. It sits in the rotation as
  one `rx` slot per data phase, filled by the art phase the boss is in. The Unstruck has its own engine: its pair of
  shots comes on a timer instead (every 4.2 s in phase 1, 3.2 s after).
- The remaster also drew phases for the Crypt's Lich and the Emberforge's Colossus; those two now fight on the
  three-phase framework with the Boss Overhaul's art, so the remaster's versions aren't used.
- **Monsters** (96): every fourth volley uses their new shot. **Champions** (36): a signature volley every 5-7.5 s
  (a ring of their first new shot, then three of the second at you).
- `tools/check_remaster_ext.mjs`: every boss morphs twice (immune, named), fires both new shots in each phase, and
  dies (the Prism Wyrm and the Sleeper refuse a forced kill by their own mechanics); monsters and champions fire theirs.
  Seen in the browser: morphs, phase art and deaths drawn every frame with no errors.
