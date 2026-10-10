# Every relic its own (`src/data/uniques.js`)

Audit of the 214 untiered, legendary and mythic items:
- **41 had no effect of their own** (12 weapons, 14 armours, 11 rings, 4 abilities), and 25 more had exactly the
  same effect as another item. Several bows and staves had homing written down that never applied; homing stays out
  (no seeking items).
- **73 shared their shot** with other items, some with ten.
- **14 weapons fired nothing at all** (the melon weapons, the Wand of Hoarfrost, the Forgeheart Maul, the
  Starforged Katana and others): they named no shot count and the firing loop ran zero times. They now fire one.

Now:
- Each item has an effect of its own, from the game's effects in new combinations (weapons: chains, explosions,
  splits, comets, curses, bleeds, lifesteal, acceleration...; armour and rings: dodge, mana shields, rage, auras,
  emanations, cheat-death, execute, regen...). Abilities get a **signature** on every use, whatever their type: a
  nova, rain on the cursor, mines that burst, a sweeping wall, a spiral or heavy lances (`Game.abilitySig`); the tooltip
  says which.
- Each item's projectile is its own, chosen when the game starts from the shots of whatever drops it (a boss's or
  monster's own new shots first), so a relic looks like where it came from. Ability types that draw their own effect
  (anvils, pillars of light, thralls, glass decoys, hooks, kites, clocks) keep it; their signature carries their shot.
- The Wand of Hoarfrost: it fired nothing (above); it now fires a bolder, slower frost shot that shatters on hit.

`tools/check_unique_items.mjs`: 214 items, 214 distinct effects, 141 distinct shots, all with art; every weapon fires
its own shot and every ability's own shot appears in play.
