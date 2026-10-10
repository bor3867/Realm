# Realm Remaster

Every original sprite (1069, from commit 8a276e0) redrawn in the Realm Update style.

- `native/` — **drop-in replacements**: the same 24 sheet files with the same names, sizes and cell positions as the
  originals (cls_*.png, enemies.png, champions.png, realm_bosses.png, pack_bosses.png, godheart.png, godking.png,
  unstruck.png, tiles.png, objects.png, items.png, projectiles.png, decor.png, landmarks.png, fx.png). Same frame
  counts and frame roles, so swapping the files updates the game with no code changes.
- `x5/` — the same sheets at 5x with the 1px outline baked in, cell for cell (cell = 5x the original cell).
- `sprite_index.json` — where every sprite lives (sheet, cell size, frame cells), same as the old viewer used.
- `atlas_remaster_ext.json` + `ext_native/` + `ext_x5/` — **new content with no old slot**:
  - all 17 bosses: the original row is phase 1; each adds phase 2 and phase 3 (idle + 3-frame attack: windup,
    release, recover), the two morphs (`p1_to_p2`, `p2_to_p3`, 4 frames each), a 4-frame death, phase names, and
    6 new shots (2 per phase);
  - 36 champions: 2 new shots each; 96 monsters: 1 new shot each (shots point right; rotate in-engine).

Wire-up for bosses: phase thresholds and the morph behaviour follow BRIEF.md §6 (invulnerable during the morph,
clear bullets, play `p1_to_p2`, then switch to `p2_idle`/`p2_attack`). Rebuild everything from source with the
generators in `source/work/*/` and `source/assemble.py`.
