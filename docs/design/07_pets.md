# Phase 7: Pets and eggs (audit D6: merge)

Pets v2 (`packs/pets_v2`) has 10 families with 2 lines each, and every line grows baby (8x8) → evolved (10x10) →
divine (12x12). It has 50 eggs (family × rarity) with a hatch clip. Our pets (8 kinds, five rarities, feeding,
fusing, Heal / Magic Heal / Shield) were just redone and work well. D6: **keep our systems, wear v2's bodies.**

## What a pet is now
- **Its line is its kind.** The 20 lines replace the 8 kinds (`pet.kind` holds the line id, so the save shape barely
  changes). Each line leans toward Life or Mana (its family sets the lean, its line nudges it) and has its own
  line of description.
- **Its form follows its main ability's level**: baby below 30 (the first cap), evolved from 30, divine at 100 (the
  max cap, which only a Divine pet can reach). Its name is its form's name: an Owlet becomes a Great Owl, then a
  Starwise Owl.
- **Rarity keeps its job**: it caps the abilities (30/50/70/90/100), Rare and up learn Shield, and fusing two maxed
  pets of one rarity gives one of the next. A higher rarity also **hatches at a higher level** (Common 1, Uncommon 5,
  Rare 10, Legendary 20, Divine 30: a Divine egg hatches already evolved).
- The old gilded/celestial skins are gone: a rarer pet shows its rarity in its glitter and its name colour.

## Clips
- `idle` when it stands (it blinks; divine forms twinkle). `follow` while it trails you: the same smooth lag as
  now. It is never solid, so it can't block you or your shots.
- `happy` (a heart) for about 1 s when it's fed, when an ability levels, when it hatches, and when it evolves.
- **Evolution**: a white flash on the pet, a burst of its rarity's colours, then `happy`, and a banner ("Your Owlet
  grows into a Great Owl!").

## Eggs
- 50 eggs, `egg_<family>_<rarity>` (art `pt2_eggs/<family>_<rarity>`): the shell shows the family, the band the
  rarity. The name says both ("Rare Avian Egg"); the slot tag is the rarity's initial in its colour, and the tooltip
  badge spells the rarity out, because common and uncommon look alike at a glance.
- **Hatching** happens in the world, at your feet: the egg plays wobble, wobble, crack, burst (1.5 s), and the pet
  appears on the burst frame, happy. It hatches one of its family's two lines, at random.
- **Drops** keep today's tables by source (monster leaders low, elites higher, bosses highest; the final god the
  best, and the only source of Divine eggs). Then **the land raises the odds**: in harder lands an egg can step up a
  rarity (8% per land tier: Shore and Dunes 0, Greenmarch and Ashfen 8%, Thornwood 16%, Runeholt and
  the Steppe 24%, Godfall 32%). The **family follows the land** 60% of the time:

  | Land | Families |
  |---|---|
  | the Drowned Shore | aquatic, reptile |
  | the Saltglass Dunes | reptile, exotic |
  | the Greenmarch | woodland, canine |
  | Ashfen | spooky, reptile |
  | the Thornwood | feline, insect |
  | Runeholt / the Crystal Steppe | avian, automaton |
  | Godfall | spooky, exotic |

  Dungeons and anywhere else: any family.
- **The Pet Yard** sells a Common and an Uncommon egg; the families on sale change each day.

## Migration (save)
- Old pets keep everything (id, rarity, ability levels and xp). Only `kind` changes, to the closest line:

  | Old kind | Line |
  |---|---|
  | Ember Fox | Shiba Pup (the warm canine; the fox line is frosty) |
  | Frost Kit | Frost Fox |
  | Rune Owl | Owlet |
  | Lantern Moth | Moth Sprite |
  | Tide Turtle | Jade Gecko |
  | Bog Frog | Bubblefin |
  | Salt Crab | Coral Seahorse |
  | Star Wisp | Wisp Ghost |

- Old eggs (`pet_egg_<rarity>`) in a backpack or vault become a family egg of the same rarity (random family). The
  old egg items stay defined so nothing breaks; the old pet and egg art stays on disk, unused.

## How it's tested
`tools/check_pets.mjs`: all 20 lines have three forms with idle/follow/happy clips; all 50 eggs resolve with a hatch
clip; forms follow the main ability level (29 → baby, 30 → evolved, 100 → divine); an egg hatches its own family at
its rarity's level, with the pet appearing on the burst frame; an evolution plays when feeding crosses 30; an old save
(old kinds, old eggs) migrates; drops step up in harder lands and follow the land's families.

## Result (built)
- `pets.js`: `FAMILIES`, the 20 lines as `PET_KINDS` (family, forms, Life/Mana lean, description), `OLD_KINDS`,
  `START_LV`, `EVOLVE_AT`; `petStage` / `petForm` / `petSprite` / `petName`; `hatchKind(family)`; `newPet(kind,
  rarity, lv)`; `eggId`. `upgradePet` migrates old kinds (it already ran on every pet the save holds).
- `items.js`: the 50 eggs (`egg_<family>_<rarity>`, `reg: pt2_eggs/*`, `use: {egg, family}`). The 4 old eggs stay
  defined; `save.js` turns any it finds in a backpack or vault into a family egg of the same rarity.
- `game.js`: the hatch in the world (`hatching`, `updateHatch`, the pet out on the burst frame at 1.33 s and where its
  egg was); `petJoy` (happy) on hatch, feeding and fusing; `evolveFx` (flash, burst, the level-up ring, happy, a
  banner); egg drops by source, stepped up by land tier, families by land (Divine eggs only from the final god);
  `eggsForSale` (two families a day); the egg's sell price for Divine.
- `render.js`: `petBody` (idle / follow / happy clips, a heart at the start of happy, the flash, the rarity glitter)
  and `hatchEgg`. `ui.js`: portraits from the registry on a 12x12 ground (every stage keeps its scale), names by
  form, the fuse look by line; eggs show their rarity's colour, initial and name.
- `tools/check_pets.mjs` (all OK). `tools/check_events.mjs`: its "asleep until you come" test placed you 20 tiles
  south even when that was off the map's edge, and the game pushed you back into the arena (a flaky failure, about 1
  run in 3); it now picks a free spot outside the arena.
- Seen in the browser: the cracked egg at your feet, pets of every stage in the pen at a readable size, the Pet Yard
  with the new portraits and names, the eggs for sale, egg slots with their rarity initials.
- `ADMIN_REFERENCE.md` regenerated (`/pet` takes the line ids now).
