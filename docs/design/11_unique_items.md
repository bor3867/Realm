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

## The dungeons' own items (`src/data/dungeon_items.js`, `src/orbiters.js`)
- **Names say what an item is.** An item's noun matches its kind: the Orrery Orb (a halo) is the Orrery Halo; rings
  called crowns, masks and hearts are bands, signets and rings; a reliquary called a chalice or a lantern is a
  reliquary; bellows called a bomb or a core are bellows; a dagger called a rapier (a duelist weapon of its own) is a
  stiletto; coats that are heavy armour are mail; a vestment (a priest armour of its own) that is a robe is a robe.
  The ids stay, so saves and drops are unchanged.
- **Every dungeon gives something that orbits you.** An orbiter set strikes what it touches, and may catch shots (then
  rest a moment), drag monsters in, throw shots at the nearest monster (straight; nothing seeks), slow, ignite or heal.
  Worn on a ring or armour it is always there; on an ability it comes for some seconds.

| Dungeon | Item | Orbiters |
|---|---|---|
| Astral Observatory | The Orrery Halo (on use, 8 s) | three planets that catch shots; a black hole that swallows them and drags monsters in |
| | Event Horizon Ring | a black hole: swallows five shots, then rests 5 s; drags monsters in |
| | Astral Signet | two brass moons that turn shots aside |
| Drowned Chapel | Ring of the Drowned Bell | a bell that tolls holy water at the nearest monster |
| Fallen Heart | Band of the Fallen Crown | three heart shards; each cut mends you |
| Scriptorium | The Starless Band | four dark stars that blot out shots |
| Unstruck Throne | Band of the Unstruck Crown | four gilded motes that hit hard and catch shots |
| Frostveil | Ring of the Wyrm | three ice lances that chill and catch shots |
| Mirerot | Mycelial Hide | four poison spores |
| Sandscour | Scarab Ring | two cursed scarabs that bite and catch shots |
| Crimson Keep | Signet of the Count | three bats; every bite feeds you |
| Hollowmoon | Ring of the Jester | three juggling pins, one thrown now and then |
| Tidebound Crypt | Ring of Tides | three lost souls that take shots for you |
| Emberforge | Emberheart Ring | three magma orbs that ignite |
| Hive | Honeyguard Band | four bees that sting and slow |
| Theatre | Robe of the Last Curtain | comedy and tragedy masks, turning opposite ways, catching shots |
| Prism Spire | Ring of the Seventh Colour | seven colours that each throw a shard every 2 s |
| Sleeper's Dream | Nightlight Ring | a little moon that lulls and catches shots |
- **No item seeks.** Every homing weapon effect is stripped at load; the old Seeking enchantment is now Far-Flung (its
  shots fly farther), so old saves keep working.
- Checked by `tools/check_unique_items.mjs`: each orbiter has art, strikes a monster, and catches shots where it
  should; no item seeks.
