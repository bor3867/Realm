# Phase 6: Items

The Item Overhaul (`packs/item_overhaul`, sheet `ix_items`) redraws 51 items at 8x8, each with a `static` frame,
three `shine` frames, and, for the eight legendaries, four `twinkle` frames. `dungeons_two` (`d2_items`) adds 16 more
with the same frames. Potions and loot bags keep their old art (the pack says so).

## The art swap
- Items point at their new art with `reg` (Phase 1's registry). The old art stays in the pack-1 `items` sheet:
  nothing is deleted, and taking `reg` off an item brings its old look back.
- 32 items already used `reg` (the boss and dungeon items added in Phases 3–5). This phase adds the last **12**
  pack-1 items the Overhaul redrew: Tidecaller Blade, Emberbrand Greatsword, Staff of Drowned Stars, Cinderwood
  Staff, Runeplate Brigandine, Hexsilk Robe, the Runic Aegis, the Grimoire of Ash, the Soul Lantern, the Colossus
  Core, Ring of Tides, Emberheart Ring. 7 Overhaul entries are for items we don't have and are not used.

## In the inventory
- **Static** most of the time. Slots must stay calm (the blinking-slot feedback from earlier): nothing loops fast.
- **Shine**: every 5 s, an item with its own shine frames plays them once (0.3 s). The slots are offset from each
  other, so the shines pass through the bag one at a time instead of all together.
- Items without shine frames (the pack-1 tiers) get a **sweep** instead: a soft band of light crosses the item,
  clipped to its own silhouette, once every 6 s, also offset per slot.
- **Twinkle** (legendaries only): 1 s after the shine, the four twinkle frames play once (6 fps), then it rests.
- Every frame is drawn in the box of frame 0, so a sparkle outside the item never shifts or rescales it.
- Legendaries have their own slot colour (pale gold, `#ffe9a0`), the tag **L**, and **LEGENDARY** in the tooltip.

## On the ground
- A bag holding a legendary is at least starfall rank. It gets its own **beam**: broad, gold with a white core,
  with four sparkles climbing it. The banner reads "A LEGENDARY drops!" and stays up longer. Other rare bags keep
  their thin dashed beams (white, gold for starfall, crimson for divine).

## The ten legendaries (for review)
Each drops only from its boss's **phase-3 kill**, at 1.5–2%. All are
already defined. Stats are as built: please check the numbers.

| Legendary | Boss | Slot | Stats | Its trick |
|---|---|---|---|---|
| The Leviathan Eye | the Abyssal Kraken (1.5%) | ring | +6 Att, +6 Dex, +60 Life | 15% of shots crit for ×2; each hit gives 1 Mana |
| The Blight Heart | the Thornheart Treant (1.5%) | ring | +7 Att, +5 Dex | every kill bursts into a ring of 8 thorns (half strength: 4% of its Life + 20) |
| The Aurora Heart | Glacius, the Frozen Wyrm (2%) | ring | +30 Life/Mana, +3 to every stat | nothing can slow you |
| The Glowcap Crown | Mother Mycelia (2%) | ring | +80 Life, +6 Wis, +6 Vit | kills heal 40; below 35% Life you regenerate 30 a second |
| Event Horizon | the Rime Astrolabe (2%) | ring | +8 Att, +90 Life | 12% crit for ×2.5; +10% damage while you move |
| The Pharaoh's Deathmask | the Gilded Sphinx (2%) | ring | +20 Life/Mana, +2 to every stat | kills heal 35 |
| The Nightfall Scythe | Count Vesper (2%) | weapon (sword) | 210–290 ×3 in a wide arc, range 3.6, piercing | 3% lifesteal |
| The Grinning Mask | the Grinning Ringmaster (2%) | ring | +8 Att, +8 Dex | 12% crit for ×3 |
| The Tidewraith Staff | the Tidebound Lich (2%) | weapon (staff) | 95–140 ×2, range 6.6 | the bolts bend with the current (all the same way, 1.6 rad/s: about 20° and half a tile by the turn) and come back once (new this phase: `current`) |
| The Forgeheart Maul | the Forgeheart Colossus (2%) | weapon (sword) | 300–420, slow (60% rate), range 3.2 | each blow throws a ring of 8 sparks (30% damage, a short stun) |

Descriptions (one or two lines, in the game's voice):
- **Leviathan Eye**: "It still looks. Whatever it looks at, your shots find the soft part of."
- **Blight Heart**: "The rot at the middle of the oldest tree. Everything you kill bursts into thorns."
- **Aurora Heart**: "The light that moved inside the wyrm's chest. Nothing can slow you while it is yours."
- **Glowcap Crown**: "It glows faintly in the dark. Whatever dies near you feeds it, and it feeds you."
- **Event Horizon**: "What is left of the machine's heart: a point nothing comes back from. Keep moving, and it pulls harder."
- **Pharaoh's Deathmask**: "A face of gold for a king nobody remembers. Every death you cause, it drinks, and shares."
- **Nightfall Scythe**: "The Count's own blade. Night falls in a wide red arc, and drinks."
- **Grinning Mask**: "It smiles for you. When you land a lucky blow, it laughs, and the blow lands three times over."
- **Tidewraith Staff**: "The Lich's own. Its bolts lean with a current only they can feel, and come back once."
- **Forgeheart Maul**: "Too heavy to swing, and you swing it anyway. Every blow throws a ring of sparks."

Review notes:
- The three crit rings (Eye, Horizon, Mask) are close. Each has a different second edge (mana on hit, damage on the move,
  the biggest multiplier), and they share the ring slot, so you pick one.
- Event Horizon's description promised homing ("your shots lean toward what they hunt") but its passive is
  damage while moving; the description now says that instead.
- The two all-stat rings (Aurora, Deathmask) are deliberate: the Aurora Heart is the stronger, with +3 and no-slow,
  from a harder boss.

## How it's tested
- `tools/check_registry.mjs`: every `reg` resolves, including the 12 new ones.
- In the browser (an in-memory character, storage writes off): the inventory shows the new art; stepping the UI
  clock shows every shine item playing shine1–3 and every legendary also playing twinkle0–3; frames share frame 0's
  box; the sweep crosses pack-1 items clipped to their shape; a legendary's bag gets the gold beam and the banner.

## Result (built)
- `items.js`: `reg` on the 12; `bagRank` puts legendaries at starfall rank.
- `render.js`: `icon(id, frame)` caches each frame and shares frame 0's box; the legendary beam.
- `game.js`: bags know when they carry a legendary (`bag.legend`), and say so.
- `ui.js` / `style.css`: the shine and twinkle steps (`shines`, in `tick`), the masked sweep (`.ico.sweep`), the
  legendary slot colour, tag and badge.
- Tuned after looking: the beam was too faint on sand (alpha 0.18 → 0.35 outer, 0.45 → 0.85 core).
