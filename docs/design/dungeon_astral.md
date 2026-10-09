# The Astral Observatory (celestial clockwork) — boss: The Grand Orrery

An observatory hung in the void above the Crystal Steppe, all marble and brass. Its own idea: **the ground
itself is clockwork**. Platforms float in nothing; some bridges between them turn on a hub like the hands of a
clock, rune circles fold space between rooms, and the way to its vault is a bridge of stars you can only see
through its telescopes.

## Entry
- **Portal:** Crystal Steppe and Godfall monsters (a share of their drops; group leaders 4%, others 1%).
- **Key:** `key_astral` (Astral Key: "Brass and starlight. It ticks."), icon `ix_items/astral_key`.

## Tiles (registry `ex_tiles/astral_*`)
| Tile | Meaning |
|---|---|
| `asmarble` | floor |
| `asgrate` | brass grate: bridges and walkways (floor) |
| `asvoid` | **the void: you can walk onto it, and you fall.** You reappear on the last solid tile you stood on, lose 12% of your Life, and are untouchable for a second. Shots fly over it. |
| `aswall` | wall, with faces |
| `asstar` | a star-bridge plank: invisible (it is void) until a telescope reveals it |

## Hazards and devices
- **The void**: every platform's edge is open. Knockback and slides matter here.
- **Rune circles** (pairs): step onto one, a 0.6 s swirl, and you are on its partner in another room. Each pair is
  a shortcut, never the only way.
- **Clockwork bridges** (the dungeon's own): a hub platform in the void with two brass arms. Every 4 s the arms
  click 45° round (a 1 s warning: the arm's grate flashes, and a tick sounds). Stand on an arm when it turns and
  it carries you round with it. At two of its eight positions the arms meet the platforms on either side: that's
  when you cross.
- **The telescope room** (set piece): three telescopes on a round dais at the void's edge, the vault floating
  beyond it with a star globe on its far side. Each telescope turns one step (of eight) when you use it, and
  shows a faint dotted sight line. Pointed at the globe, it reveals its third of the star-bridge (the planks
  appear, glittering, for good). All three: the bridge is whole and you can walk to the vault.

## Layout (`style: 'astral'`, ~240×240)
Precise and symmetrical: square, octagonal and round platforms set on a grid over the void, joined by narrow
grate bridges (1–2 wide):
1. **The Gallery** (entrance, quiet): an octagon, two brass pillars, a star globe.
2. **Platforms** (4 combat rooms): square or octagonal, brass pillars at the corners, floating crystals.
3. **The Clockwork** (the hazard room): two clockwork bridges in series between platforms.
4. **The Telescope Dais** (set piece) and **the Vault** (treasure, reached only by the star bridge).
5. **The Antechamber** (quiet): a round platform, four pillars, a rune circle back to the Gallery.
6. **The Orrery Floor** (boss arena, 36×36): a round marble platform over the void; brass rings inlaid.
Rune circles link the Gallery and the Antechamber, and one platform pair mid-way.

## Enemies (registry `ex_astral/*`)
| Monster | Role | Shot | Behaviour |
|---|---|---|---|
| void_acolyte | caster, keeps drones | `starbeam` fan | kites; a parent with 3 orrery drones |
| orrery_drone | orbits its acolyte | `lensbolt` | orbit (around its acolyte) |
| star_eye | sniper | a long warning line, then a beam | rooted, fires long lines |
| constellation_stalker | ambusher | `dreamstar` ring | blinks in around you |
Compositions: acolytes with their drones; star eyes posted where they see down a bridge; stalkers in pairs.

## Loot
Chests: T7–T9 gear, T3–T4 abilities and rings, stat potions. The Vault: an extra chest and a better roll.

## How it's tested
`tools/check_astral.mjs`: every seed connects (with the star-bridge revealed), the vault is unreachable until it
is; falling into the void returns you to solid ground and costs Life; rune circles carry you to their partners;
clockwork arms turn on time and carry a rider; the telescopes reveal their segments only when aimed at the globe;
the Grand Orrery sleeps until you step onto its floor, and every one of its mechanics happens there.

## Result (built)
- Generator: `LAYOUT.astral` / `DRESS.astral` (map 340x340). Rooms sit on a grid, mostly eastward with right-angle
  turns; straight grate bridges two wide. The whole observatory floats in walkable void (`asvoid`). The vault sits
  across the void from the dais (on whichever side is clear), and its star bridge is three segments of void that
  the telescopes turn to grate. Rune circles pair the gallery with the antechamber and two platforms.
- `src/astral.js`: falling (back to your last footing, 12% Life, a second's grace), rune circles (0.6 s swirl),
  clockwork arms (`clockTiles` in maps.js; 45 degrees every 4 s, a 1 s flashing warning, riders carried round),
  telescopes (`interact: 'scope'`), and the drones' orbit (`ai: 'satellite'`). Walking monsters won't step into the
  void (fliers and bosses ignore it).
- Population by `def.compose`: acolytes with their drones, star eyes (rooted snipers: a long warning line, then a
  beam), stalkers blinking in. The vault holds an acolyte and a stalker.
- Its own portal art (a brass armillary ring round a starry swirl), weather (stars), and its key.
- Audit D4: the Runeholt realm boss that shared the name is now **The Rime Astrolabe** (its id stays
  `orrery_of_winter`, so saves, trophies and quests keep working); its items are the Seal of the Astrolabe and the
  Astrolabe Rod, and the lore lines that named it follow.
- `tools/check_astral.mjs`: every seed in bounds, no overlaps, full pacing, skinned; the vault unreachable until the
  bridge is revealed and every room reachable after; falling, the rune circles, a rider on a turning arm, every
  telescope finding the globe; the Orrery sleeps until you're on its floor, and every mechanic happens there.
- Found and fixed while looking: the arena's door seals were being placed all along the floor's rim over the void
  (now only where a way comes in).
