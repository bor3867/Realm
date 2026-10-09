# Frostveil Hollows (ice cave) — boss: Glacius, the Frozen Wyrm

A cave of blue ice under Runeholt. Its own idea: **cold is a resource you manage**. Frigid water and Glacius'
frost build a *chill* on you; frost braziers are the only places it melts off. Ice floors carry you on; snow
gives you your footing back. The dungeon teaches both before the boss asks for both at once.

## Entry
- **Portal:** Runeholt and Crystal Steppe monsters drop it (group leaders 5%, others 1.2%; it shares those lands
  with the Scriptorium and the Theatre, so each roll picks one of them).
- **Key:** `key_frostveil` (Frostveil Key: "A key cut from clear ice. It does not melt in your hand, which is
  worse."), drawn from `ix_items/frostveil_key`.

## Tiles (registry: `ex_tiles/frostveil_*`)
| Tile | Meaning | Art |
|---|---|---|
| `fvsnow` | floor, footing | snow a/b in slow-noise patches |
| `fvice` | floor, slides (the existing ice momentum: you keep your speed and turn slowly) | ice |
| `fvwater` | frigid water: walkable, 60% speed, builds chill fast | frigid water |
| `fvwall` | wall | wall_top on the wall, wall_side on its face toward the camera (pseudo-3D) |

## Chill (the dungeon's own debuff)
- A meter 0–100 shown as a frost rim on the screen edge and a little bar under your Life.
- Frigid water: +40/s. Some shots (frost sprites, Glacius' breath and blizzard): +12 per hit.
- It drains on its own at 6/s, and at 35/s within 2.5 tiles of a lit frost brazier (the brazier glows warmer as
  it works; you see the meter fall).
- Effect: your speed and rate of fire fall by up to 35% at 100. At 100 you are **frozen solid** for 1.2 s
  (shatter-bursts out when it ends, 0 damage) and the meter drops to 40. Readable: the rim pulses white at 80+.

## Layout (`style: 'frostveil'`, ~200×200)
A cavern that winds north and then east, never a grid:
1. **The Mouth** (entrance, quiet): snow, two frost braziers, snowy pines framing the way in, and an abandoned
   camp by the far wall (snow rocks round a cold brazier and a frozen statue of someone who sat down to rest).
2. **Caverns** (4–5 combat rooms): irregular blobs of snow with ice sheets in the middle and frigid pools at the
   edges, each joined by a winding tunnel 3 wide. Ice crystals line the walls; one frost brazier per room, at the
   side, so retreating to warm is a choice.
3. **Ice runs** (1–2, the hazard rooms): long corridors of ice crossing frigid water, with snow rocks as islands
   of footing. Fall in and you chill fast; ride the ice and you overshoot. A chest waits on the far rock of one.
4. **The Hall of the Frozen** (set piece, always on the main path): a long hall lined both sides with frozen
   statues (12–16). Some (4–6) are glacial sentinels. Crossing the middle third wakes them: their statues crack
   (a white burst), and they step down. The decoy statues never move, so the hall stays readable afterwards.
5. **A grotto** (optional treasure, a leaf room): a ring of ice crystals round a chest, a brazier, two sentinels.
6. **The Wyrm's Stair** (antechamber): snow, four braziers, the last chance to warm up.
7. **The Frozen Lake** (boss arena, 36×40): a round lake of ice with a snow rim 3 tiles wide, four braziers on
   the rim (north, south, east, west) that Glacius' phase 3 puts out one at a time.

## Enemies (registry `ex_frostveil/*`, all new)
| Monster | Role | Shot | Behaviour |
|---|---|---|---|
| frost_sprite | kites behind the sentinels | `iceneedle`, 3 in a fan, +12 chill | kite |
| glacial_sentinel | the anchor | `frostshard` ring of 8 + an aimed `icicle` | slow shamble, high Defense |
| rime_wolf | packs that flank | `snapjaw`, contact | flank in threes |
| shardling | swarms | contact; bursts into 4 `shard`s when it dies | skitter, fragile |
Compositions by depth: early rooms are wolves and shardlings; mid rooms add a sentinel with two sprites behind
it; deep rooms are a sentinel pair, a sprite trio and a wolf pack.

## Loot
Chests: T5–T8 weapons and armour, T2–T3 abilities, stat potions. Glacius drops his own items (see his note).

## How it's tested
`tools/check_frostveil.mjs`: the layout connects start to boss, the pacing holds (entrance, 3–6 combat rooms, a
hazard room, a treasure room, the hall, the antechamber, the arena), chill rises in water and falls by braziers,
the hall's sentinels wake only when you cross it. Then walk it in the browser.

## Result (built)
- Generator: `LAYOUT.frostveil` / `DRESS.frostveil` in maps.js (map 300×300). The main way: mouth, cavern, cavern,
  ice run, cavern, the Hall of the Frozen, cavern, the Wyrm's Stair, the Frozen Lake; off it a grotto (always the
  treasure) and a second ice run (a chest half the time). Tunnels run centre to centre with a wander in the middle
  (the first version aimed at the rooms' box edges and missed the ragged blob caverns). One secret room.
- Tiles: four new tile types drawn as registry skins; `fvwall` walls get **faces**: `Renderer.wallFaces` hangs the
  `wall_side` art under every wall that looks out over floor, on whichever side faces down the screen at the
  current camera angle, sorted so anyone standing in front of the wall is drawn over its face.
- `src/frostveil.js`: chill (frigid water +40/s, frost shots +12–15, drains 6/s, 35/s by a lit brazier; slows feet
  and hands up to 35%; frozen solid for 1.2 s at 100, then back to 40), Glacius' gust, frozen ground that thaws,
  the hall waking, braziers going out. Chill shows as a bar under your life bar and frost at the screen's edge.
- Population by `def.compose(room, rng, depth)`: wolves and shardlings early, sentinels with sprites behind them
  later; the Wyrm's Stair is a `rest` room (nobody there). Shardlings burst into shards when they die.
- Portal: Runeholt and steppe monsters (a 35% share of their drops goes to Frostveil); the key from the registry
  icon. Its own portal art (an ice arch round a cold swirl, `tools/realmupdate_art.py`, baked by world_art.py).
- `tools/check_frostveil.mjs`: every seed connects mouth to lake with the full pacing and every tile skinned; chill
  rises in water, freezes you, melts by a brazier; the hall wakes only when crossed; Glacius sleeps until you're on
  the lake, the doors lock, and every one of his mechanics happens in the real arena.
