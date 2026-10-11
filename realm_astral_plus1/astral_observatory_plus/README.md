# Astral Observatory+ (ap_*)

New content for the Astral Observatory (the Grand Orrery's dungeon), in the same style and palette as the existing `ex_astral` sprites. All names are prefixed `ap_` / new, so nothing clashes with existing sheets.

## What's in the pack
| Sheet | Contents |
|---|---|
| `ap_elites` | 4 mid-tier enemies (bosskit, ~20px): **Astrolabe Sentinel**, **Comet Hound**, **Nebula Weaver**, **Vault Keeper** (the treasure guardian). Each has walk(4) / attack(3) / ability(4) / hurt / death(3). The Vault Keeper also has `dormant` + `wake`(4). |
| `ap_enemies` | 2 small 8x8 enemies: **Meteor Mite** (crawler, packs) and **Lens Wisp** (floater, beam caster). Each has move / attack / hurt / death(2). |
| `ap_shots` | 16 new shots: 2 for each mid-tier enemy, 1 for each small enemy, a new shot for each of the 4 existing astral enemies (Star Eye, Void Acolyte, Orrery Drone, Constellation Stalker), a `meteor` shot for the Grand Orrery and the vault floor-trap spark. All point right, 2 frames each. |
| `ap_tiles` | Constellation inlay (2 variants), animated skylight (3 frames), brass walkway, cracked marble, marble inlay, vault floor (medallion and plain), vault trap plate (idle / arming / firing), vault wall top and side. |
| `ap_decor` | Armillary stand (animated bead), astrolabe table, star-chart lectern, celestial brazier (3-frame flame), fallen meteor, gear heap, lens stand. |
| `ap_treasure` | **Star Vault chest** (closed / glint / opening / open), star-gold pile, relic pedestal, vault door (sealed / unlocking / open). |

The animations, frame rectangles, fps, ability text and shot behaviour notes are in `atlas_astral_plus.json`, along with the spawn suggestions and the treasure-room flow. The `native/` sheets are 1:1. The `x5/` sheets are 5x with the 1px dark outline (tiles are not outlined).

## Treasure room
- **Entrance:** a `vault_door`.
- **Floor:** `vault_floor_plain`, with medallion tiles around the chest and 4 `vault_trap` plates.
- **Objects:**
  - the chest in the centre
  - the Vault Keeper **dormant** beside it
  - 2 relic pedestals
  - star-gold piles
  - braziers in the corners
- **Sequence:**
  1. Opening the chest plays the chest's `open` animation.
  2. The Keeper then plays `wake` and attacks.
  3. Its **Lockdown** ability seals the door until it dies.
  4. The loot is granted when it dies.

`previews/treasure_room.png` shows the layout.

## Hover
The Nebula Weaver and the Lens Wisp float. Use the renderer hover values in `atlas.hover` (1px, slow), as with HOVER.json. Don't bake a bob into the frames. The relic pedestal's bob is already baked in, because its plinth must stay still.

## Previews
- `previews/*.gif`: each new enemy's full animation on a transparent background, ready to share.
- `previews/contact_sheet.png`: everything at a glance.
- `previews/treasure_room.png`: the room mock-up.

## Source
`src/` holds the generators. Run `python3 build.py` to rebuild. It needs `bosskit.py` and `pixlib.py` from the main project.
