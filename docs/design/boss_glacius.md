# Glacius, the Frozen Wyrm (Frostveil Hollows)

## Arena: the Frozen Lake
36×40. A round lake of ice (you slide) inside a snow rim three tiles wide (your footing), four frost braziers on
the rim at north, south, east and west. The doors lock when you step onto the ice. Glacius lies coiled on its
hoard at the north edge of the lake.

## Numbers
150,000 Life, Defense 24 (0 in phase 3), 9,500 XP. Shots 95–125. Phases at 66% / 33%. Frost shots add chill
(the dungeon's meter, see `dungeon_frostveil.md`): breath +12, blizzard +15.

## Phase 1 — Coiled Hoard (it doesn't move)
1. **Frost breath sweep**: its head swings across a 130° arc in 1.3 s, breathing a narrow cone of `frost_breath`
   the whole way (three puffs every 0.06 s). Read the swing's direction from the windup (it rears to one side) and
   run against it.
2. **Ice lances**: three lines of `ice_lance`, five lances to a line one behind the other, at you and 0.35 rad
   either side. Where each line ends, the ground freezes into a 3×3 sheet of ice for 6 s: on the snow rim, that's
   your footing gone.
Alternates sweep, lances, sweep (the other way), lances.

## Phase 2 — Unfurled (wings open; it takes to the air)
1. **Blizzard orbs**: three `blizzard_orb`s drift toward you, slow. After 2 s each bursts into 8 `frost_breath`
   puffs. Pull them away from where you want to stand.
2. **Wing beat**: two fans of `wing_shard` (7 each) from its wingtips, and a **gust**: for 0.8 s the wind pushes
   you straight away from it. On the ice, you keep going. Brace on snow, or use the slide.
3. **Glide**: it flies to the far side of the lake (the point opposite you), dropping `ice_lance`s behind it
   every 0.15 s, which fall and stop where they land as a short wall for 1.5 s.
Its movement between patterns: circling the lake above the rim.

## Phase 3 — Shattered Heart (it crashes onto the lake; its chest cracks open)
On the morph it slams down at the lake's centre (the ice cracks: a white ring). The heart is bare: Defense 0.
1. **Core nova**: three rings of `core_nova` from the heart, 0.4 s apart, each with a 2-shot gap; each gap sits a
   fixed step clockwise from the last, so the way through spirals. Step, step, step.
2. **Aurora**: a curtain of `aurora_wave` from the north edge of the arena with a 3-shot gap. Each wave's speed
   follows a sine across the curtain, so the front ripples like the aurora and the gap leans as it comes.
3. **Snuff**: it exhales at one of the rim braziers and puts it out (they stay out). Four times this fight, the
   warm places get fewer.
It stays at the centre and turns to face you.

## Death
The death clip; the lake's ice whitens; the loot fountain; the doors open; a portal home.

## Loot (themed, boss tier) and the legendary
Glacial Fang (dagger: fast, each hit slows), Rimeheart Bow (three piercing arrows that chill), Wand of Hoarfrost
(long bolt, slows), Frostweave Armor (robe: Defense, Wisdom, and chill can't freeze you solid), Ring of the Wyrm
(Life, Defense, Vitality). Legendary (phase-3 kill, 2%): **Aurora Heart** (ring: everything +3, and you can't be
slowed). Plus T8–T10 gear and stat potions.

## Unique to it
A breath that sweeps; lances that freeze the ground where they stop; orbs that drift and burst; a gust that sends
you sliding; a glide that leaves a fence of lances; rings whose gaps spiral; a rippling aurora; braziers it puts
out one by one. None is used by another boss.

## Result (built)
- `src/bosses/glacius_frozen_wyrm.js`. Checked in its real lake (`tools/check_frostveil.mjs`): all 8 patterns; the
  breath chills, lances freeze the rim, orbs burst, the gust pushes, the glide flies and fences, the nova rings
  spiral, the aurora ripples, all four rim braziers go out over a long phase 3, and Defense drops to 0.
- Seen in the browser: the coiled hoard at the north of the lake, the breath sweep, the wings and the circle, the
  crash to the centre, the nova's spiralling gaps.
- Tuned after looking: it waited so far north that the boss bar hid it; it now starts 11 tiles into the lake.
