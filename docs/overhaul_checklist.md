# Game overhaul checklist

Progress on the optimisation, polish and bug-fixing pass. Every item is either fixed and verified (with how), still to
do, or found working (with the test that showed it). The Grand Orrery is out of scope by request.

Baseline: commit a0e0b20, all 22 `tools/check_*.mjs` passing.

## Fixed and verified
| Area | Problem | Root cause | Fix | Verified by |
|---|---|---|---|---|
| NPCs / pets | Pressing the talk key at the Petkeeper did nothing | The key went through `ui.enterNear()`, which opened shop/forge/board itself and passed everything else to `g.interact()`, which had no case for `petyard` (only the on-screen button knew it) | One route: `g.interact()` handles the four menus (an `npc` event the UI opens); the key and the button both use it | Test tab: F at the Petkeeper, shop, forge, board each opens its menu; `tools/check_interactions.mjs` (fails on the old code) |
| Loot | Realm loot bags could last for ever | Bags counted down only while you were on their map; the realm map is kept while you are in a dungeon or the Nexus, so its bags froze | Bags expire on the game clock (`until`), which runs on every map; expired bags are dropped on map entry too | `tools/check_loot.mjs` (fails on the old code) |
| Art | The treasure chest looked like a hamburger (rounded bun lid, a yellow "cheese" band, no outline or planks) | Placeholder-quality art | Redrawn closed and open: outlined plank chest, metal straps, lock plate with keyhole; the open one shows coins (`tools/art_chest.mjs`) | 8x crops; only the two chest cells of the atlas changed |
| Art | Every player shot was resampled (drawn at 0.875x, "big" ones 1.3x), cycled two frames, and left trail pixels | Renderer | Player shots drawn 1:1, one still frame, no trail (docs/projectile_art_standard.md) | Test tab; hitbox check |

| Tests | `check_remaster_ext` failed at random (about 1 run in 4) | Its realm monsters fire on unseeded randomness | Seeded | 3 of 3 identical runs |

## Found working (tested end to end)
- Projectile lifecycle, every shooter but the Grand Orrery (`tools/check_shot_lifecycle.mjs`: 10 modular bosses and 194
  other enemies and elites): each fights, dies mid-attack, and is watched for 15 s. Nothing fires after death, none of
  its shots are left in the air, no shot of anyone's lives over 25 s, and nothing hurts you once its shots are gone.
  Designed after-effects are kept: a mortar or splitting shot fired before death still lands and breaks (its pieces
  are now marked `shard`), and a boss's harmless death burst. Phase changes clear a boss's bullets (`check_bosses`)
  except where the fight keeps them on purpose.
- Pet system, in a test tab through the real UI: buying an egg, hatching it (it becomes your companion), following you,
  its heal and mana ticks outside the Nexus, feeding from the Pet Yard (levels up, the item is consumed, gold paid),
  the pet staying out of the vault (by design) and returning, map changes (realm, Nexus), and the save keeping pets,
  the active pet and their levels.
- Loot bags: 90 s (rare 180 s) expiry, emptied bags vanish, a bag you stand at waits for you, expiry never touches
  your inventory.

## To do (next sessions)
- Wand shots too large; projectile sizes across enemies and abilities against the art standard.
- Sprite audit beyond the chest: loot bags, NPCs, dungeon styles, placeholder art.
- Every NPC outside the Nexus (dungeon interactables, portals, waypoints).
- Performance profiling in the heaviest bullet-hell fights.
- Feel: movement, firing, camera, transitions.
- Enemy movement and AI overhaul (requested 2026-10-12): audit every enemy's movement; reusable movement archetypes
  (pursuer, orbiter, skirmisher, ambusher, charger, flanker, defender, erratic, formation, stationary guardian) with
  per-enemy weight (acceleration, turning); smooth, frame-rate independent steering, wall sliding, unsticking;
  movement that matches each enemy's attacks; local group spacing; per-boss movement polish (handcrafted bosses keep
  their choreography; the Grand Orrery is untouched); pathfinding only where obstacles block; profiled performance;
  automated tests in real dungeon layouts.
- 2.5D wall system in the style of RotMG (requested 2026-10-12): walls with top faces, extruded front faces, corners and
  junctions worked out from neighbouring tiles, depth sorting with characters and shots, contextual see-through
  where walls would hide danger, restrained shading and per-dungeon materials, collision unchanged. **Blocked:** the
  request text was cut off at "6. Performance Optimization" and the reference screenshot did not arrive.
