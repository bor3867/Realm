# Realm: every item and its shots

Generated from the game's item data (src/data/items.js, uniques.js, dungeon_items.js). 505 items.
Numbers are exact. Names in `code` are internal ids or sprite names.

## How to read the numbers

**Weapons fire volleys.** Each volley fires `count` shots fanned evenly across `arc` (an arc of 0 means all shots fly the
same line). Every shot rolls its damage between the two numbers.
- Volleys per second = weapon `rate` x (1.4 + 5.6 x DEX / 75). So at DEX 0 a rate-1 weapon fires 1.4 volleys/s; at DEX 75, 7.
- Damage multiplier = 0.5 + ATT / 50 (ATT 0: x0.5, ATT 50: x1.5, ATT 75: x2).
- Enemy DEF subtracts from each hit (a hit never drops below 15% of its damage). `pierce` means the shot passes through
  enemies and keeps going.
- Speed is tiles per second; range is tiles; size is the shot's radius scale (0.5 is a normal shot).
- Movement speed = 3.6 + 5 x SPD / 75 tiles/s. HP regen = 1 + 0.24 x VIT per s. MP regen = 0.5 + 0.12 x WIS per s.

**Weapon specials** (on top of the plain shot):
- `burn` sets the target alight (damage per second, seconds). `slow` slows the target. `crit` a chance of extra damage.
- `explode` damages everything within r tiles of the hit, at a fraction f of the shot's damage.
- `chain` jumps to n more enemies at fraction f. `split` breaks into more shots on hit (or at the end of its flight).
- `lifesteal` heals you for part of the damage. `boomerang` flies out and comes back.
- `quake` bursts into n shots in a ring where it hits (fraction f), sometimes stunning.
- `starfall` every N volleys a star falls where you aim (radius r, damage). `accel` starts slow and speeds up; faster
  means more damage. `current` the shots curve, all the same way. `curse` the target takes more damage for a while.

**Abilities** cost MP and each type does one thing; the burst numbers feed it:
- Bellows (Brawler): an invulnerable dash through enemies, then an ember blast. `berserk` = seconds of +50% fire rate, +25% damage.
- Oath-Seal (Forge Knight): throws an anvil at the cursor; it lands after a beat, crushes (2.4x burst damage) and stuns.
- Halo (Priest): a pillar of light falls on the cursor: a heavy strike then a short burn. `heal`, `invuln` seconds.
- Reliquary (Summoner): `thralls` bone servants that hunt for `life` seconds.
- Grapple Line (Harpooner): a hook to the cursor; reels a monster in and stuns it, or pulls you.
- Mirror (Duelist): blink to the cursor, leaving a `decoy` that enemies attack for that many seconds.
- Storm Kite (Stormwright): a kite turret that rains lightning near it for `life` seconds.
- Stopwatch (Clockmaker): freezes everything in a radius for `stop` seconds.
- Rune Ward (Runeblade): a `ward` that soaks the next hits, and rune-slashes in a ring.
- Hex (Hexweaver): a cursed zone at the cursor (more damage taken, slowed), hex-bolts burst from it.
- `armored` = seconds of extra DEF. `mod` names a variant (described under the item). `burst`: count, damage, range of
  the ability's own shots, ring or blast.

## Classes

| Class | Weapon | Ability | Armor |
|---|---|---|---|
| Brawler | sword | bellows | heavy |
| Forge Knight | sword | seal | heavy |
| Priest | wand | halo | robe |
| Summoner | staff | reliquary | robe |
| Harpooner | bow | hookline | leather |
| Duelist | dagger | mirror | leather |
| Stormwright | staff | kite | robe |
| Clockmaker | wand | stopwatch | robe |
| Runeblade | sword | runeward | leather |
| Hexweaver | staff | hex | robe |

## Weapons (134)

### sword (Brawler, Forge Knight, Runeblade)

**Rusted Shortsword** `sword_t0` · T0
- Shot: 1 shot per volley; 48-76 damage each; speed 9 tiles/s, range 2.9 tiles (0.32 s flight); rate 1; size 0.5; sprite pj_sword_0
- Scavenged from the wrack line of the Drowned Shore. Heavy and honest: every swing is a promise.

**Ironbite Blade** `sword_t1` · T1
- Shot: 1 shot per volley; 62-95 damage each; speed 9 tiles/s, range 2.9 tiles (0.32 s flight); rate 1; size 0.5; sprite pj_sword_1
- Plain Nexus iron, hammered out by a smith who wanted to go home early. Slow arcs, heavy cuts. Stand close and mean it.

**Brinecut Saber** `sword_t2` · T2
- Shot: 1 shot per volley; 75-114 damage each; speed 9 tiles/s, range 2.9 tiles (0.32 s flight); rate 1; size 0.5; sprite pj_sword_2
- Pitted by salt and sea, but the edge has held. Made for those who would rather be within arm's reach.

**Bogsteel Broadsword** `sword_t3` · T3
- Shot: 1 shot per volley; 89-133 damage each; speed 9 tiles/s, range 2.9 tiles (0.32 s flight); rate 1; size 0.5; sprite pj_sword_3
- Dredged from the bogs of Ashfen. It still smells of peat. Heavy and honest: every swing is a promise.

**Runeedge Longsword** `sword_t4` · T4
- Shot: 1 shot per volley; 102-152 damage each; speed 9 tiles/s, range 2.9 tiles (0.32 s flight); rate 1; size 0.5; sprite pj_sword_4
- Cut with Runeholt runes that hum faintly in the cold. Slow arcs, heavy cuts. Stand close and mean it.

**Emberforged Blade** `sword_t5` · T5
- Shot: 1 shot per volley; 116-171 damage each; speed 9 tiles/s, range 2.9 tiles (0.32 s flight); rate 1; size 0.5; sprite pj_sword_5
- Forged over the ember-vents of Godfall, where the ground is always warm. Made for those who would rather be within arm's reach.

**Glassfang Sword** `sword_t6` · T6
- Shot: 1 shot per volley; 129-190 damage each; speed 9 tiles/s, range 2.9 tiles (0.32 s flight); rate 1; size 0.5; sprite pj_sword_6
- Fused from Saltglass Dune glass, harder than any steel. Heavy and honest: every swing is a promise.

**Saint's Gilded Blade** `sword_t7` · T7
- Shot: 1 shot per volley; 143-209 damage each; speed 9 tiles/s, range 2.9 tiles (0.32 s flight); rate 1; size 0.5; sprite pj_sword_7
- Gilded by the penitents of Godfall, who could not stop polishing it. Slow arcs, heavy cuts. Stand close and mean it.

**Hollowsteel Greatblade** `sword_t8` · T8
- Shot: 1 shot per volley; 156-228 damage each; speed 9 tiles/s, range 2.9 tiles (0.32 s flight); rate 1; size 0.5; sprite pj_sword_8
- Hollowed by the Hollow Thanes. Something still echoes inside. Made for those who would rather be within arm's reach.

**Anvilheart Sword** `sword_t9` · T9
- Shot: 1 shot per volley; 170-247 damage each; speed 9 tiles/s, range 2.9 tiles (0.32 s flight); rate 1; size 0.5; sprite pj_sword_9
- Tempered in the Emberforge, a forge that has never once gone cold. Heavy and honest: every swing is a promise.

**Godshard Blade** `sword_t10` · T10
- Shot: 1 shot per volley; 183-266 damage each; speed 9 tiles/s, range 2.9 tiles (0.32 s flight); rate 1; size 0.5; sprite pj_sword_10
- A splinter of the god himself. It is warm, and it is listening. Slow arcs, heavy cuts. Stand close and mean it.

**Blade of the First Oath** `billet_of_the_first_oath` · UT
- Shot: 1 shot per volley; 140-190 damage each; speed 10 tiles/s, range 5.5 tiles (0.55 s flight); rate 0.6; size 0.7; pierces; sprite pj_firstoath
- Special: `{"explode":{"r":1.4,"f":0.5}}`
- Effect: Explodes on hit (1.4 tiles, 50%)
- The first billet ever struck on the god-anvil. It has not cooled since.

**Blade of the Unstruck** `knuckle_of_the_unstruck` · UT
- Shot: 3 shots per volley, spread over 18 degrees; 55-85 damage each; speed 13 tiles/s, range 3.6 tiles (0.28 s flight); rate 1; size 0.5; sprite pj_unstruck
- Special: `{"burn":{"dps":45,"t":3}}`
- Effect: Ignites: 45/s for 3s
- Torn from the god that was never finished. Three molten knuckles per blow.

**Bog Cleaver** `bog_cleaver` · UT
- Shot: 1 shot per volley; 115-170 damage each; speed 9 tiles/s, range 3 tiles (0.33 s flight); rate 1; size 0.5; sprite bogspit
- Special: `{"burn":{"dps":60,"t":3}}`
- Effect: Ignites: 60/s for 3s
- Rust and rot down the whole edge. Whatever it cuts goes on hurting.

**Emberbrand Greatsword** `emberbrand_greatsword` · UT
- Shot: 1 shot per volley; 210-290 damage each; speed 12 tiles/s, range 3 tiles (0.25 s flight); rate 0.85; size 0.6; sprite fireball
- Special: `{"burn":{"dps":80,"t":3},"explode":{"r":1.5,"f":0.5}}`
- Stats: +5 ATT
- Effect: Explodes on hit (1.5 tiles, 50%) · Ignites: 80/s for 3s
- Quenched in the Colossus's heart. It has not stopped glowing.

**Godheart Blade** `godheart_knuckle` · UT
- Shot: 3 shots per volley, spread over 17 degrees; 120-170 damage each; speed 14 tiles/s, range 3.9 tiles (0.28 s flight); rate 1.15; size 0.55; sprite pj_godfist
- Special: `{"lifesteal":0.05,"crit":{"p":0.15,"x":2}}`
- Effect: Lifesteal 5% · 15% chance for 2× damage
- Every punch lands with the weight of a heartbeat.

**Godheart Greatsword** `godheart_tongs` · UT
- Shot: 1 shot per volley; 230-300 damage each; speed 10 tiles/s, range 6 tiles (0.60 s flight); rate 0.8; size 0.8; pierces; sprite pj_godbillet
- Special: `{"explode":{"r":1.8,"f":0.6},"burn":{"dps":140,"t":3}}`
- Effect: Explodes on hit (1.8 tiles, 60%) · Ignites: 140/s for 3s
- They hold a drop of the god's blood, still molten.

**Melon Slicer** `melon_slicer` · UT
- Shot: 1 shot per volley; 120-180 damage each; speed 9 tiles/s, range 3 tiles (0.33 s flight); rate 1.05; size 0.5; sprite blade
- Special: `{"lifesteal":0.02}`
- Effect: Lifesteal 2%
- Sharp enough to part a rind in one stroke. It drips a little.

**Oathbreaker** `oathbreaker` · UT · MYTHIC, UT
- Shot: 1 shot per volley; 240-320 damage each; speed 10 tiles/s, range 3.3 tiles (0.33 s flight); rate 1.05; size 0.6; pierces; sprite rune_slash
- Special: `{"explode":{"r":1.6,"f":0.5},"lifesteal":0.04}`
- Stats: +6 ATT, +4 SPD
- Effect: Explodes on hit (1.6 tiles, 50%) · Lifesteal 4%
- The runes on it spell a promise, backwards. Every cut drinks a little of what it takes.

**Oathsworn Greatsword** `oathsworn_greatsword` · UT · UT, set: oathsworn
- Shot: 1 shot per volley; 200-270 damage each; speed 11 tiles/s, range 4 tiles (0.36 s flight); rate 0.8; size 0.6; pierces; sprite pj_quench
- Special: `{"explode":{"r":1.2,"f":0.35}}`
- Effect: Explodes on hit (1.2 tiles, 35%)
- Swung once per oath. Every blow lands like a promise kept.

**Pit-Fighter's Cleaver** `pitfighters_cleaver` · UT · UT, set: pitfighter
- Shot: 1 shot per volley; 150-210 damage each; speed 13 tiles/s, range 3.8 tiles (0.29 s flight); rate 1; size 0.55; sprite pj_cinderfist
- Special: `{"burn":{"dps":60,"t":3}}`
- Effect: Ignites: 60/s for 3s
- Heated in the pit's brazier between bouts. Everything it cuts keeps burning.

**Runewarden's Blade** `runewarden_blade` · UT · UT, set: runewarden
- Shot: 1 shot per volley; 140-200 damage each; speed 14 tiles/s, range 3.2 tiles (0.23 s flight); rate 1.05; size 0.55; pierces; sprite rune_slash
- Its runes spell out an oath. You took it the moment you picked it up.

**Starfall Blade** `starfall_knuckles` · UT · MYTHIC, UT
- Shot: 3 shots per volley, spread over 17 degrees; 95-140 damage each; speed 14 tiles/s, range 3.8 tiles (0.27 s flight); rate 1.15; size 0.5; sprite pj_starfist
- Special: `{"starfall":{"every":4,"dmg":900,"r":1.8}}`
- Effect: Every 4th volley calls down a falling star
- Three stars that fell through the realm and landed, somehow, in a fist.

**Starforged Katana** `starforged_katana` · UT
- Shot: 1 shot per volley; 150-220 damage each; speed 10 tiles/s, range 3.2 tiles (0.32 s flight); rate 1; size 0.5; pierces; sprite starbeam
- Special: `{"crit":{"p":0.12,"x":2}}`
- Effect: 12% chance for 2× damage
- Folded from the brass of a broken orbit. Its arc goes through whatever is in the way.

**Sunscorch Khopesh** `sunscorch_khopesh` · UT
- Shot: 1 shot per volley; 95-145 damage each; speed 9 tiles/s, range 3 tiles (0.33 s flight); rate 1.05; size 0.5; sprite ember
- Special: `{"burn":{"dps":50,"t":3}}`
- Effect: Ignites: 50/s for 3s
- Its hook still holds the heat of a sun that set a thousand years ago.

**The Abbot's Cleaver** `abbots_claw` · UT
- Shot: 2 shots per volley, spread over 14 degrees; 70-105 damage each; speed 12 tiles/s, range 3.6 tiles (0.30 s flight); rate 1.05; size 0.5; sprite pj_claw
- Special: `{"slow":{"f":0.35,"t":1.5},"lifesteal":0.03}`
- Effect: Slows 35% for 1.5s · Lifesteal 3%
- Snapped off the Brine Cathedral. Pearls rattle inside it like a rosary.

**The Cinder-Saint's Sword** `cinder_saints_fist` · UT
- Shot: 2 shots per volley, spread over 16 degrees; 85-120 damage each; speed 13 tiles/s, range 3.7 tiles (0.28 s flight); rate 1.1; size 0.5; sprite pj_cinderfist
- Special: `{"burn":{"dps":60,"t":3},"explode":{"r":1,"f":0.35}}`
- Effect: Explodes on hit (1 tiles, 35%) · Ignites: 60/s for 3s
- Still burning from the saint's pyre. It sets alight whatever it touches.

**The Forgeheart Greatblade** `forgeheart_maul` · UT · LEGENDARY, UT
- Shot: 1 shot per volley; 300-420 damage each; speed 8 tiles/s, range 3.2 tiles (0.40 s flight); rate 0.6; size 0.6; sprite bx_shots/forgeheart_colossus.hammer_spark
- Special: `{"quake":{"n":8,"proj":"bx_shots/forgeheart_colossus.hammer_spark","f":0.3,"stun":0.3}}`
- Effect: Each hit sends a shockwave of 8 shards and stuns
- Too heavy to swing, and you swing it anyway. Every blow throws a ring of sparks.

**The Nightfall Blade** `nightfall_scythe` · UT · LEGENDARY, UT
- Shot: 3 shots per volley, spread over 34 degrees; 210-290 damage each; speed 9 tiles/s, range 3.6 tiles (0.40 s flight); rate 0.9; size 0.55; pierces; sprite d2_projectiles/crimson_keep.crimson_slash
- Special: `{"lifesteal":0.03}`
- Effect: Lifesteal 3%
- The Count's own sword, curved like a scythe. Night falls in a wide red arc, and drinks.

**The Penitent's Greatsword** `penitents_head` · UT
- Shot: 1 shot per volley; 150-210 damage each; speed 10 tiles/s, range 6 tiles (0.60 s flight); rate 0.65; size 0.7; pierces; sprite pj_head
- Special: `{"split":{"n":6,"proj":"tombshard","f":0.35}}`
- Effect: Shatters on hit into 6 shards
- Carry it in the tongs. Its eyes still fire at whatever you look at.

**The Penitent's Scourge** `penitents_scourge` · UT
- Shot: 2 shots per volley, spread over 17 degrees; 80-115 damage each; speed 13 tiles/s, range 3.8 tiles (0.29 s flight); rate 1.1; size 0.5; sprite pj_scourge
- Special: `{"chain":{"n":2,"f":0.5}}`
- Effect: Arcs to 2 more enemies (50%)
- Gold chain wrapped around the knuckles. Every blow is a confession.

**The Quenching Blade** `quenching_tongs` · UT
- Shot: 1 shot per volley; 160-220 damage each; speed 10 tiles/s, range 5.5 tiles (0.55 s flight); rate 0.75; size 0.6; pierces; sprite pj_quench
- Special: `{"slow":{"f":0.5,"t":2}}`
- Effect: Slows 50% for 2s
- They hold a billet of ice that never melts. Everything it hits slows to a crawl.

**The Sword That Never Fell** `hammer_that_never_fell` · UT · MYTHIC, UT
- Shot: 1 shot per volley; 190-260 damage each; speed 10 tiles/s, range 5.5 tiles (0.55 s flight); rate 0.75; size 0.8; pierces; sprite pj_hammer
- Special: `{"quake":{"n":8,"proj":"hammerlet","f":0.3,"stun":0.5}}`
- Effect: Each hit sends a shockwave of 8 shards and stuns
- Forged for the first blow on the god-anvil. The smiths drowned before they could swing it.

**The Tallow Brand** `tallow_tongs` · UT
- Shot: 1 shot per volley; 120-165 damage each; speed 10 tiles/s, range 5 tiles (0.50 s flight); rate 0.85; size 0.55; pierces; sprite pj_tallow
- Special: `{"burn":{"dps":80,"t":4}}`
- Effect: Ignites: 80/s for 4s
- They hold a candle that has never once gone out.

**Tidecaller Blade** `tidecaller_blade` · UT
- Shot: 1 shot per volley; 160-220 damage each; speed 13 tiles/s, range 3.2 tiles (0.25 s flight); rate 1; size 0.55; pierces; sprite tide_wave
- Special: `{"slow":{"f":0.3,"t":2},"explode":{"r":1.3,"f":0.4}}`
- Stats: +5 SPD, +4 DEF
- Effect: Explodes on hit (1.3 tiles, 40%) · Slows 30% for 2s
- The Lich drowned a knight to forge it. Every cut drags like an undertow.

### dagger (Duelist)

**Chipped Shiv** `dagger_t0` · T0
- Shot: 1 shot per volley; 31-50 damage each; speed 13 tiles/s, range 3.5 tiles (0.27 s flight); rate 1.4; size 0.42; sprite pj_dagger_0
- Scavenged from the wrack line of the Drowned Shore. Quick in the hand and quicker out of it.

**Iron Stiletto** `dagger_t1` · T1
- Shot: 1 shot per volley; 40-64 damage each; speed 13 tiles/s, range 3.5 tiles (0.27 s flight); rate 1.4; size 0.42; sprite pj_dagger_1
- Plain Nexus iron, hammered out by a smith who wanted to go home early. Light enough to forget you are holding it, until you need it.

**Brine Kris** `dagger_t2` · T2
- Shot: 1 shot per volley; 49-78 damage each; speed 13 tiles/s, range 3.5 tiles (0.27 s flight); rate 1.4; size 0.42; sprite pj_dagger_2
- Pitted by salt and sea, but the edge has held. For fighters who strike first, and then again.

**Bogfang Dirk** `dagger_t3` · T3
- Shot: 1 shot per volley; 58-92 damage each; speed 13 tiles/s, range 3.5 tiles (0.27 s flight); rate 1.4; size 0.42; sprite pj_dagger_3
- Dredged from the bogs of Ashfen. It still smells of peat. Quick in the hand and quicker out of it.

**Runeneedle** `dagger_t4` · T4
- Shot: 1 shot per volley; 67-106 damage each; speed 13 tiles/s, range 3.5 tiles (0.27 s flight); rate 1.4; size 0.42; sprite pj_dagger_4
- Cut with Runeholt runes that hum faintly in the cold. Light enough to forget you are holding it, until you need it.

**Ember Talon** `dagger_t5` · T5
- Shot: 1 shot per volley; 76-120 damage each; speed 13 tiles/s, range 3.5 tiles (0.27 s flight); rate 1.4; size 0.42; sprite pj_dagger_5
- Forged over the ember-vents of Godfall, where the ground is always warm. For fighters who strike first, and then again.

**Glass Sliver** `dagger_t6` · T6
- Shot: 1 shot per volley; 85-134 damage each; speed 13 tiles/s, range 3.5 tiles (0.27 s flight); rate 1.4; size 0.42; sprite pj_dagger_6
- Fused from Saltglass Dune glass, harder than any steel. Quick in the hand and quicker out of it.

**Gilded Misericorde** `dagger_t7` · T7
- Shot: 1 shot per volley; 94-148 damage each; speed 13 tiles/s, range 3.5 tiles (0.27 s flight); rate 1.4; size 0.42; sprite pj_dagger_7
- Gilded by the penitents of Godfall, who could not stop polishing it. Light enough to forget you are holding it, until you need it.

**Hollow Fang** `dagger_t8` · T8
- Shot: 1 shot per volley; 103-162 damage each; speed 13 tiles/s, range 3.5 tiles (0.27 s flight); rate 1.4; size 0.42; sprite pj_dagger_8
- Hollowed by the Hollow Thanes. Something still echoes inside. For fighters who strike first, and then again.

**Nightvein Dagger** `dagger_t9` · T9
- Shot: 1 shot per volley; 112-176 damage each; speed 13 tiles/s, range 3.5 tiles (0.27 s flight); rate 1.4; size 0.42; sprite pj_dagger_9
- Tempered in the Emberforge, a forge that has never once gone cold. Quick in the hand and quicker out of it.

**Godshard Shiv** `dagger_t10` · T10
- Shot: 1 shot per volley; 121-190 damage each; speed 13 tiles/s, range 3.5 tiles (0.27 s flight); rate 1.4; size 0.42; sprite pj_dagger_10
- A splinter of the god himself. It is warm, and it is listening. Light enough to forget you are holding it, until you need it.

**Dagger of the Feint** `the_feint` · UT
- Shot: 1 shot per volley; 65-95 damage each; speed 19 tiles/s, range 4.8 tiles (0.25 s flight); rate 1.8; size 0.45; pierces; sprite pj_feint
- Special: `{"crit":{"p":0.35,"x":2.2},"lifesteal":0.04}`
- Effect: Lifesteal 4% · 35% chance for 2.2× damage
- It points one way and strikes another. Nobody has ever seen it coming.

**Glacial Fang** `glacial_fang` · UT
- Shot: 1 shot per volley; 105-160 damage each; speed 14 tiles/s, range 3.6 tiles (0.26 s flight); rate 1.5; size 0.42; sprite iceneedle
- Special: `{"slow":{"f":0.25,"t":1}}`
- Effect: Slows 25% for 1s
- A tooth of the wyrm, still cold enough to slow what it bites.

**Glass Fencer's Dirk** `glassfencer_dirk` · UT · UT, set: glassfencer
- Shot: 1 shot per volley; 70-100 damage each; speed 18 tiles/s, range 3.8 tiles (0.21 s flight); rate 1.6; size 0.45; pierces; sprite pj_reflection
- Special: `{"crit":{"p":0.2,"x":2.5}}`
- Effect: 20% chance for 2.5× damage
- Thin as a reflection. One in five thrusts finds the heart.

**Juggler's Dagger** `jugglers_dagger` · UT
- Shot: 1 shot per volley; 120-175 damage each; speed 13 tiles/s, range 3.8 tiles (0.29 s flight); rate 1.5; size 0.42; sprite d2_projectiles/hollowmoon.thrown_knife
- Special: `{"boomerang":true}`
- Effect: Returns to you like a boomerang
- Throw it. It comes back. It always comes back.

**Melon Baller** `melon_baller` · UT
- Shot: 1 shot per volley; 80-125 damage each; speed 13 tiles/s, range 3.4 tiles (0.26 s flight); rate 1.45; size 0.42; sprite honeyglob
- Special: `{"crit":{"p":0.12,"x":2}}`
- Effect: 12% chance for 2× damage
- Scoops. Quickly. Now and then it scoops out something important.

**Stringcutter** `stringcutter` · UT
- Shot: 2 shots per volley, spread over 9 degrees; 75-105 damage each; speed 13 tiles/s, range 4.6 tiles (0.35 s flight); rate 1; size 0.45; pierces; sprite scissor_blade
- The stagehands' shears, ground to a dagger. They cut the Maestro's strings once. They can do it again.

**The Crimson Stiletto** `crimson_rapier` · UT
- Shot: 1 shot per volley; 120-180 damage each; speed 15 tiles/s, range 3.8 tiles (0.25 s flight); rate 1.5; size 0.4; pierces; sprite d2_projectiles/crimson_keep.crimson_slash
- Special: `{"lifesteal":0.02}`
- Effect: Lifesteal 2%
- Thin, quick, and always a little thirsty.

**The Last Reflection** `the_last_reflection` · UT
- Shot: 2 shots per volley, spread over 10 degrees; 70-100 damage each; speed 18 tiles/s, range 4.6 tiles (0.26 s flight); rate 1.6; size 0.45; pierces; sprite pj_reflection
- Special: `{"crit":{"p":0.25,"x":2.5}}`
- Effect: 25% chance for 2.5× damage
- A blade of mirror-glass that only remembers the killing blow.

**The Mirrorworld** `the_mirrorworld` · UT · MYTHIC, UT
- Shot: 3 shots per volley, spread over 17 degrees; 110-150 damage each; speed 19 tiles/s, range 5 tiles (0.26 s flight); rate 1.7; size 0.45; pierces; sprite pj_mirrorworld
- Special: `{"split":{"n":4,"proj":"pj_glass","f":0.35},"crit":{"p":0.3,"x":2.5}}`
- Effect: Shatters on hit into 4 shards · 30% chance for 2.5× damage
- Every thrust happens twice: once here, once on the other side of the glass.

**The Queen's Stinger** `queens_stinger` · UT
- Shot: 1 shot per volley; 50-75 damage each; speed 13 tiles/s, range 5.2 tiles (0.40 s flight); rate 1.1; size 0.45; sprite royal_sting
- Special: `{"slow":{"f":0.25,"t":1.5}}`
- Effect: Slows 25% for 1.5s
- Pulled from the Honeyed Mother herself. Everything it pricks moves like it is wading through honey.

### bow (Harpooner)

**Driftwood Bow** `bow_t0` · T0
- Shot: 3 shots per volley, spread over 10 degrees; 16-28 damage each; speed 17 tiles/s, range 5.6 tiles (0.33 s flight); rate 1; size 0.45; pierces; sprite pj_bow_0
- Scavenged from the wrack line of the Drowned Shore. Three arrows to the draw, and every one goes through.

**Ironbark Bow** `bow_t1` · T1
- Shot: 3 shots per volley, spread over 10 degrees; 21-36 damage each; speed 17 tiles/s, range 5.6 tiles (0.33 s flight); rate 1; size 0.45; pierces; sprite pj_bow_1
- Plain Nexus iron, hammered out by a smith who wanted to go home early. The string sings when it is drawn tight.

**Saltstring Bow** `bow_t2` · T2
- Shot: 3 shots per volley, spread over 10 degrees; 25-43 damage each; speed 17 tiles/s, range 5.6 tiles (0.33 s flight); rate 1; size 0.45; pierces; sprite pj_bow_2
- Pitted by salt and sea, but the edge has held. Keep your distance; let the arrows do the walking.

**Reedwhip Bow** `bow_t3` · T3
- Shot: 3 shots per volley, spread over 10 degrees; 30-51 damage each; speed 17 tiles/s, range 5.6 tiles (0.33 s flight); rate 1; size 0.45; pierces; sprite pj_bow_3
- Dredged from the bogs of Ashfen. It still smells of peat. Three arrows to the draw, and every one goes through.

**Runewood Longbow** `bow_t4` · T4
- Shot: 3 shots per volley, spread over 10 degrees; 34-58 damage each; speed 17 tiles/s, range 5.6 tiles (0.33 s flight); rate 1; size 0.45; pierces; sprite pj_bow_4
- Cut with Runeholt runes that hum faintly in the cold. The string sings when it is drawn tight.

**Emberstring Bow** `bow_t5` · T5
- Shot: 3 shots per volley, spread over 10 degrees; 39-66 damage each; speed 17 tiles/s, range 5.6 tiles (0.33 s flight); rate 1; size 0.45; pierces; sprite pj_bow_5
- Forged over the ember-vents of Godfall, where the ground is always warm. Keep your distance; let the arrows do the walking.

**Glassarc Bow** `bow_t6` · T6
- Shot: 3 shots per volley, spread over 10 degrees; 43-73 damage each; speed 17 tiles/s, range 5.6 tiles (0.33 s flight); rate 1; size 0.45; pierces; sprite pj_bow_6
- Fused from Saltglass Dune glass, harder than any steel. Three arrows to the draw, and every one goes through.

**Gilded Recurve** `bow_t7` · T7
- Shot: 3 shots per volley, spread over 10 degrees; 48-81 damage each; speed 17 tiles/s, range 5.6 tiles (0.33 s flight); rate 1; size 0.45; pierces; sprite pj_bow_7
- Gilded by the penitents of Godfall, who could not stop polishing it. The string sings when it is drawn tight.

**Hollowhorn Bow** `bow_t8` · T8
- Shot: 3 shots per volley, spread over 10 degrees; 52-88 damage each; speed 17 tiles/s, range 5.6 tiles (0.33 s flight); rate 1; size 0.45; pierces; sprite pj_bow_8
- Hollowed by the Hollow Thanes. Something still echoes inside. Keep your distance; let the arrows do the walking.

**Stormdraw Bow** `bow_t9` · T9
- Shot: 3 shots per volley, spread over 10 degrees; 57-96 damage each; speed 17 tiles/s, range 5.6 tiles (0.33 s flight); rate 1; size 0.45; pierces; sprite pj_bow_9
- Tempered in the Emberforge, a forge that has never once gone cold. Three arrows to the draw, and every one goes through.

**Godshard Bow** `bow_t10` · T10
- Shot: 3 shots per volley, spread over 10 degrees; 61-103 damage each; speed 17 tiles/s, range 5.6 tiles (0.33 s flight); rate 1; size 0.45; pierces; sprite pj_bow_10
- A splinter of the god himself. It is warm, and it is listening. The string sings when it is drawn tight.

**Batwing Bow** `batwing_bow` · UT
- Shot: 3 shots per volley, spread over 11 degrees; 66-100 damage each; speed 17 tiles/s, range 6.2 tiles (0.36 s flight); rate 1.05; size 0.45; pierces; sprite d2_projectiles/crimson_keep.bat_screech
- Special: `{}`
- Strung with a wing's membrane. Its arrows scream a little.

**Carousel Bow** `carousel_bow` · UT
- Shot: 3 shots per volley, spread over 11 degrees; 70-108 damage each; speed 17 tiles/s, range 6.4 tiles (0.38 s flight); rate 1.05; size 0.45; pierces; sprite d2_projectiles/hollowmoon.horseshoe
- Special: `{}`
- Painted horses gallop round its grip. Its arrows start slow and go faster and faster.

**Comet Bow** `comet_bow` · UT
- Shot: 3 shots per volley, spread over 9 degrees; 62-98 damage each; speed 18 tiles/s, range 6.4 tiles (0.36 s flight); rate 1; size 0.45; pierces; sprite lensbolt
- Special: `{}`
- Each arrow drags a tail of light behind it, and every fifth volley calls a comet down where you aim.

**Heartwood Bow** `heartwood_bow` · UT
- Shot: 3 shots per volley, spread over 9 degrees; 48-78 damage each; speed 17 tiles/s, range 6 tiles (0.35 s flight); rate 1; size 0.45; pierces; sprite splinter
- Special: `{}`
- Cut from the Treant's heart, and it still leans toward the living.

**Kraken-Bane Bow** `kraken_bane` · UT
- Shot: 1 shot per volley; 300-380 damage each; speed 13 tiles/s, range 8 tiles (0.62 s flight); rate 0.7; size 0.65; pierces; sprite pj_krakenbane
- Special: `{"boomerang":true,"explode":{"r":1.6,"f":0.5}}`
- Effect: Explodes on hit (1.6 tiles, 50%) · Returns to you like a boomerang
- Thrown, it comes back. Whatever it went through does not.

**Leviathan Longbow** `leviathan_longbow` · UT · UT, set: leviathan
- Shot: 3 shots per volley, spread over 11 degrees; 90-130 damage each; speed 15 tiles/s, range 6.5 tiles (0.43 s flight); rate 1; size 0.5; pierces; sprite pj_tine
- Special: `{"slow":{"f":0.3,"t":1.5}}`
- Effect: Slows 30% for 1.5s
- Strung with a whale's sinew. Its arrows drag at whatever they hit.

**Rimeheart Bow** `rimeheart_bow` · UT
- Shot: 3 shots per volley, spread over 10 degrees; 52-84 damage each; speed 17 tiles/s, range 6 tiles (0.35 s flight); rate 1; size 0.45; pierces; sprite icicle
- Special: `{"slow":{"f":0.15,"t":0.8}}`
- Effect: Slows 15% for 0.8s
- Strung with frozen sinew. Its arrows leave a rime on what they pass through.

**Seedspitter** `seedspitter_bow` · UT
- Shot: 5 shots per volley, spread over 26 degrees; 38-62 damage each; speed 15 tiles/s, range 5.2 tiles (0.35 s flight); rate 1; size 0.4; sprite thornseed
- Five seeds a pull, in a wide spray. Aim roughly.

**The Leviathan Bow** `leviathan_tine` · UT
- Shot: 1 shot per volley; 190-260 damage each; speed 12 tiles/s, range 8 tiles (0.67 s flight); rate 0.65; size 0.6; pierces; sprite pj_tine
- Special: `{"split":{"n":5,"proj":"pj_tineshard","f":0.35},"slow":{"f":0.4,"t":1.5}}`
- Effect: Slows 40% for 1.5s · Shatters on hit into 5 shards
- Broken off the Cathedral's crab. It shatters into brine on impact.

**The White Whale** `the_white_whale` · UT · MYTHIC, UT
- Shot: 1 shot per volley; 380-480 damage each; speed 13 tiles/s, range 9 tiles (0.69 s flight); rate 0.75; size 0.7; pierces; sprite pj_whitewhale
- Special: `{"quake":{"n":10,"proj":"pj_whaleshard","f":0.3,"stun":0.6},"explode":{"r":1.8,"f":0.6}}`
- Effect: Explodes on hit (1.8 tiles, 60%) · Each hit sends a shockwave of 10 shards and stuns
- A harpoon cut from the jaw of the thing that ate the sea. It hits like the tide coming in.

### staff (Summoner, Stormwright, Hexweaver)

**Ashwood Staff** `staff_t0` · T0
- Shot: 2 shots per volley, spread over 5 degrees; 20-34 damage each; speed 16 tiles/s, range 6.2 tiles (0.39 s flight); rate 1; size 0.45; sprite pj_staff_0
- Scavenged from the wrack line of the Drowned Shore. Its bolts leave the tip faster than thought.

**Iron-Shod Staff** `staff_t1` · T1
- Shot: 2 shots per volley, spread over 5 degrees; 26-43 damage each; speed 16 tiles/s, range 6.2 tiles (0.39 s flight); rate 1; size 0.45; sprite pj_staff_1
- Plain Nexus iron, hammered out by a smith who wanted to go home early. Two bolts for every word of power.

**Kelp-Wound Staff** `staff_t2` · T2
- Shot: 2 shots per volley, spread over 5 degrees; 32-52 damage each; speed 16 tiles/s, range 6.2 tiles (0.39 s flight); rate 1; size 0.45; sprite pj_staff_2
- Pitted by salt and sea, but the edge has held. Lean on it when you are tired. Point it when you are not.

**Bog-Lantern Staff** `staff_t3` · T3
- Shot: 2 shots per volley, spread over 5 degrees; 38-61 damage each; speed 16 tiles/s, range 6.2 tiles (0.39 s flight); rate 1; size 0.45; sprite pj_staff_3
- Dredged from the bogs of Ashfen. It still smells of peat. Its bolts leave the tip faster than thought.

**Runeheart Staff** `staff_t4` · T4
- Shot: 2 shots per volley, spread over 5 degrees; 44-70 damage each; speed 16 tiles/s, range 6.2 tiles (0.39 s flight); rate 1; size 0.45; sprite pj_staff_4
- Cut with Runeholt runes that hum faintly in the cold. Two bolts for every word of power.

**Emberroot Staff** `staff_t5` · T5
- Shot: 2 shots per volley, spread over 5 degrees; 50-79 damage each; speed 16 tiles/s, range 6.2 tiles (0.39 s flight); rate 1; size 0.45; sprite pj_staff_5
- Forged over the ember-vents of Godfall, where the ground is always warm. Lean on it when you are tired. Point it when you are not.

**Glass-Eye Staff** `staff_t6` · T6
- Shot: 2 shots per volley, spread over 5 degrees; 56-88 damage each; speed 16 tiles/s, range 6.2 tiles (0.39 s flight); rate 1; size 0.45; sprite pj_staff_6
- Fused from Saltglass Dune glass, harder than any steel. Its bolts leave the tip faster than thought.

**Gilded Psalm Staff** `staff_t7` · T7
- Shot: 2 shots per volley, spread over 5 degrees; 62-97 damage each; speed 16 tiles/s, range 6.2 tiles (0.39 s flight); rate 1; size 0.45; sprite pj_staff_7
- Gilded by the penitents of Godfall, who could not stop polishing it. Two bolts for every word of power.

**Hollowbone Staff** `staff_t8` · T8
- Shot: 2 shots per volley, spread over 5 degrees; 68-106 damage each; speed 16 tiles/s, range 6.2 tiles (0.39 s flight); rate 1; size 0.45; sprite pj_staff_8
- Hollowed by the Hollow Thanes. Something still echoes inside. Lean on it when you are tired. Point it when you are not.

**Starwell Staff** `staff_t9` · T9
- Shot: 2 shots per volley, spread over 5 degrees; 74-115 damage each; speed 16 tiles/s, range 6.2 tiles (0.39 s flight); rate 1; size 0.45; sprite pj_staff_9
- Tempered in the Emberforge, a forge that has never once gone cold. Its bolts leave the tip faster than thought.

**Godshard Staff** `staff_t10` · T10
- Shot: 2 shots per volley, spread over 5 degrees; 80-124 damage each; speed 16 tiles/s, range 6.2 tiles (0.39 s flight); rate 1; size 0.45; sprite pj_staff_10
- A splinter of the god himself. It is warm, and it is listening. Two bolts for every word of power.

**Bloodthorn Staff** `bloodthorn_staff` · UT
- Shot: 2 shots per volley, spread over 6 degrees; 70-108 damage each; speed 16 tiles/s, range 6.4 tiles (0.40 s flight); rate 1; size 0.45; sprite thornseed
- Special: `{"split":{"n":4,"proj":"thornseed","f":0.3}}`
- Effect: Shatters on hit into 4 shards
- A rose cane grown hard as iron. Its thorns burst where they strike.

**Cinderwood Staff** `cinderwood_staff` · UT
- Shot: 2 shots per volley, spread over 6 degrees; 95-140 damage each; speed 11 tiles/s, range 6.2 tiles (0.56 s flight); rate 1; size 0.45; sprite fireball
- Special: `{"burn":{"dps":90,"t":4}}`
- Stats: +4 ATT, +4 VIT
- Passive: `{"burnbonus":0.15}`
- Effect: Ignites: 90/s for 4s · +15% damage to burning enemies
- Cut from a tree that grows in the forge-fires. It still smoulders at the tip.

**Gravewarden's Staff** `graverite_staff` · UT · UT, set: graverite
- Shot: 2 shots per volley, spread over 6 degrees; 85-120 damage each; speed 11 tiles/s, range 6.5 tiles (0.59 s flight); rate 1; size 0.5; sprite pj_bonelantern
- Special: `{"split":{"n":3,"proj":"pj_bone","f":0.3}}`
- Effect: Shatters on hit into 3 shards
- A thighbone topped with a lamp. Its bolts break into bones.

**Heaven-Wire Staff** `heaven_wire` · UT
- Shot: 1 shot per volley; 85-125 damage each; speed 14 tiles/s, range 7 tiles (0.50 s flight); rate 1.05; size 0.45; sprite pj_heavenwire
- Special: `{"slow":{"f":0.3,"t":1}}`
- Effect: Slows 30% for 1s
- Strung between two storms. Whatever touches it touches all of them.

**Staff of Drowned Stars** `staff_of_drowned_stars` · UT
- Shot: 2 shots per volley, spread over 6 degrees; 90-130 damage each; speed 11 tiles/s, range 6.6 tiles (0.60 s flight); rate 1; size 0.45; sprite wisp_flame
- Special: `{"slow":{"f":0.25,"t":1.5},"split":{"n":5,"f":0.35,"proj":"wisp_flame","onEnd":true}}`
- Stats: +5 WIS, +40 MP
- Effect: Slows 25% for 1.5s · Bursts at the end of its flight into 5 shards
- Stars fell into the crypt's flooded vaults. The Lich fished one out.

**Staff of the Circle** `hexcircle_staff` · UT · UT, set: hexcircle
- Shot: 2 shots per volley, spread over 7 degrees; 85-125 damage each; speed 11 tiles/s, range 6.4 tiles (0.58 s flight); rate 1; size 0.45; sprite hex_bolt
- The circle meets at its tip. Whatever it points at is already inside.

**Staff of the Last Watch** `lantern_of_the_last_watch` · UT
- Shot: 2 shots per volley, spread over 17 degrees; 70-100 damage each; speed 8 tiles/s, range 7 tiles (0.88 s flight); rate 1.05; size 0.5; sprite pj_lastwatch
- Special: `{"explode":{"r":1.2,"f":0.4}}`
- Stats: +50 MP
- Effect: Explodes on hit (1.2 tiles, 40%)
- The night-watchman's lamp. The souls inside still run their rounds, from one throat to the next.

**Tempest Caller's Staff** `tempest_staff` · UT · UT, set: tempest
- Shot: 2 shots per volley, spread over 7 degrees; 80-115 damage each; speed 14 tiles/s, range 6.8 tiles (0.49 s flight); rate 1; size 0.45; sprite pj_heavenwire
- Special: `{}`
- Copper-shod and humming. The lightning jumps to whoever is nearest.

**The Bone Staff** `the_bone_lantern` · UT
- Shot: 2 shots per volley, spread over 17 degrees; 85-120 damage each; speed 8 tiles/s, range 7 tiles (0.88 s flight); rate 1; size 0.5; sprite pj_bonelantern
- Special: `{"split":{"n":4,"proj":"pj_bone","f":0.3}}`
- Effect: Shatters on hit into 4 shards
- A lantern carved from a single great skull. Its light breaks into bones where it lands.

**The First Storm** `the_first_storm` · UT · MYTHIC, UT
- Shot: 2 shots per volley, spread over 14 degrees; 140-190 damage each; speed 15 tiles/s, range 7.5 tiles (0.50 s flight); rate 1.1; size 0.5; sprite pj_firststorm
- Special: `{"starfall":{"every":5,"dmg":1400,"r":2}}`
- Effect: Every 5th volley calls down a falling star
- The storm the god was struck by. It has been looking for him ever since.

**The Lightning Rod** `the_lightning_rod` · UT
- Shot: 1 shot per volley; 80-115 damage each; speed 15 tiles/s, range 7 tiles (0.47 s flight); rate 1.1; size 0.45; sprite pj_lightningrod
- Special: `{"starfall":{"every":8,"dmg":650,"r":1.6}}`
- Effect: Every 8th volley calls down a falling star
- Hold it up in a storm and the sky answers. Every eighth bolt, it answers loudly.

**The Lullaby Staff** `lullaby_staff` · UT
- Shot: 2 shots per volley, spread over 7 degrees; 100-145 damage each; speed 12 tiles/s, range 6.6 tiles (0.55 s flight); rate 1; size 0.45; sprite zzz
- Special: `{"slow":{"f":0.35,"t":2}}`
- Effect: Slows 35% for 2s
- It hums the Sleeper's song. Monsters hear it and their feet grow heavy.

**The Tidewraith Staff** `tidewraith_staff` · UT · LEGENDARY, UT
- Shot: 2 shots per volley, spread over 6 degrees; 95-140 damage each; speed 15 tiles/s, range 6.6 tiles (0.44 s flight); rate 1; size 0.45; sprite bx_shots/tidebound_lich.soul_bolt
- Special: `{"boomerang":true,"current":1.6}`
- Effect: Returns to you like a boomerang
- The Lich's own. Its bolts lean with a current only they can feel, and come back once.

**The Unburied Choir** `the_unburied_choir` · UT · MYTHIC, UT
- Shot: 3 shots per volley, spread over 20 degrees; 100-140 damage each; speed 8 tiles/s, range 7.5 tiles (0.94 s flight); rate 1.1; size 0.5; sprite pj_choir
- Special: `{"split":{"n":3,"proj":"pj_choirspark","f":0.3}}`
- Effect: Shatters on hit into 3 shards
- A whole cemetery, singing. You do not aim it. It knows where the living are.

**The Witch's Eye** `the_witchs_eye` · UT · MYTHIC, UT
- Shot: 2 shots per volley, spread over 7 degrees; 120-170 damage each; speed 16 tiles/s, range 6.6 tiles (0.41 s flight); rate 1; size 0.5; sprite hex_bolt
- Special: `{"curse":{"f":0.15,"t":2.5}}`
- Stats: +4 ATT, +5 WIS
- Effect: Every hit hexes: +15% damage taken for 2.5s
- The orb on its tip is an eye, and it does not blink. Whatever it looks at is already cursed.

**Tidebreaker Trident** `tidebreaker_trident` · UT
- Shot: 3 shots per volley, spread over 7 degrees; 70-105 damage each; speed 16 tiles/s, range 6.4 tiles (0.40 s flight); rate 1; size 0.45; sprite tidebolt
- Special: `{"slow":{"f":0.15,"t":0.6}}`
- Effect: Slows 15% for 0.6s
- Three tines, three bolts, straight through whatever stands in the surf.

**Vinegrown Staff** `vinegrown_staff` · UT
- Shot: 2 shots per volley, spread over 6 degrees; 60-92 damage each; speed 14 tiles/s, range 6 tiles (0.43 s flight); rate 1; size 0.45; sprite thornseed
- Special: `{}`
- Still growing. The seeds it throws go looking for something to land on.

### wand (Priest, Clockmaker)

**Twig Wand** `wand_t0` · T0
- Shot: 1 shot per volley; 30-50 damage each; speed 19 tiles/s, range 8.2 tiles (0.43 s flight); rate 1.05; size 0.42; sprite pj_wand_0
- Scavenged from the wrack line of the Drowned Shore. It reaches further than any other weapon in the realm.

**Iron Wand** `wand_t1` · T1
- Shot: 1 shot per volley; 39-64 damage each; speed 19 tiles/s, range 8.2 tiles (0.43 s flight); rate 1.05; size 0.42; sprite pj_wand_1
- Plain Nexus iron, hammered out by a smith who wanted to go home early. One bright bolt, sent a long, long way.

**Pearl Wand** `wand_t2` · T2
- Shot: 1 shot per volley; 47-78 damage each; speed 19 tiles/s, range 8.2 tiles (0.43 s flight); rate 1.05; size 0.42; sprite pj_wand_2
- Pitted by salt and sea, but the edge has held. Light, precise, and much too easy to point at people.

**Wisp Wand** `wand_t3` · T3
- Shot: 1 shot per volley; 56-91 damage each; speed 19 tiles/s, range 8.2 tiles (0.43 s flight); rate 1.05; size 0.42; sprite pj_wand_3
- Dredged from the bogs of Ashfen. It still smells of peat. It reaches further than any other weapon in the realm.

**Runic Wand** `wand_t4` · T4
- Shot: 1 shot per volley; 64-105 damage each; speed 19 tiles/s, range 8.2 tiles (0.43 s flight); rate 1.05; size 0.42; sprite pj_wand_4
- Cut with Runeholt runes that hum faintly in the cold. One bright bolt, sent a long, long way.

**Ember Wand** `wand_t5` · T5
- Shot: 1 shot per volley; 73-119 damage each; speed 19 tiles/s, range 8.2 tiles (0.43 s flight); rate 1.05; size 0.42; sprite pj_wand_5
- Forged over the ember-vents of Godfall, where the ground is always warm. Light, precise, and much too easy to point at people.

**Prism Wand** `wand_t6` · T6
- Shot: 1 shot per volley; 82-133 damage each; speed 19 tiles/s, range 8.2 tiles (0.43 s flight); rate 1.05; size 0.42; sprite pj_wand_6
- Fused from Saltglass Dune glass, harder than any steel. It reaches further than any other weapon in the realm.

**Gilded Wand** `wand_t7` · T7
- Shot: 1 shot per volley; 90-147 damage each; speed 19 tiles/s, range 8.2 tiles (0.43 s flight); rate 1.05; size 0.42; sprite pj_wand_7
- Gilded by the penitents of Godfall, who could not stop polishing it. One bright bolt, sent a long, long way.

**Hollow Wand** `wand_t8` · T8
- Shot: 1 shot per volley; 99-160 damage each; speed 19 tiles/s, range 8.2 tiles (0.43 s flight); rate 1.05; size 0.42; sprite pj_wand_8
- Hollowed by the Hollow Thanes. Something still echoes inside. Light, precise, and much too easy to point at people.

**Eclipse Wand** `wand_t9` · T9
- Shot: 1 shot per volley; 107-174 damage each; speed 19 tiles/s, range 8.2 tiles (0.43 s flight); rate 1.05; size 0.42; sprite pj_wand_9
- Tempered in the Emberforge, a forge that has never once gone cold. It reaches further than any other weapon in the realm.

**Godshard Wand** `wand_t10` · T10
- Shot: 1 shot per volley; 116-188 damage each; speed 19 tiles/s, range 8.2 tiles (0.43 s flight); rate 1.05; size 0.42; sprite pj_wand_10
- A splinter of the god himself. It is warm, and it is listening. One bright bolt, sent a long, long way.

**Clockwork Saint's Wand** `clockwork_wand` · UT · UT, set: clockwork
- Shot: 1 shot per volley; 130-180 damage each; speed 4 tiles/s, range 7.5 tiles (1.88 s flight); rate 0.95; size 0.5; sprite pj_eleventh
- Special: `{"accel":26,"slow":{"f":0.35,"t":1.5}}`
- Effect: Slows 35% for 1.5s · Starts slow and accelerates
- Its bolts start slow and arrive on time. Whatever they hit loses a little of its own.

**Dawn-Choir Wand** `dawnchoir_wand` · UT · UT, set: dawnchoir
- Shot: 1 shot per volley; 95-135 damage each; speed 16 tiles/s, range 7 tiles (0.44 s flight); rate 1.1; size 0.45; pierces; sprite pj_dawn
- Special: `{"split":{"n":4,"proj":"pj_dawnray","f":0.3,"onEnd":true}}`
- Effect: Bursts at the end of its flight into 4 shards
- Each bolt ends in a small sunrise.

**Dawnbreaker Wand** `dawnbreaker` · UT
- Shot: 1 shot per volley; 70-100 damage each; speed 15 tiles/s, range 8 tiles (0.53 s flight); rate 1.15; size 0.45; pierces; sprite pj_dawn
- Special: `{"split":{"n":6,"proj":"pj_dawnray","f":0.4,"onEnd":true}}`
- Effect: Bursts at the end of its flight into 6 shards
- Each lance breaks into a sunrise where it lands.

**Gilded Scepter** `gilded_scepter` · UT
- Shot: 1 shot per volley; 75-120 damage each; speed 19 tiles/s, range 8.2 tiles (0.43 s flight); rate 1.05; size 0.42; pierces; sprite goldshard
- Gold all the way through. Its bolts go through things too.

**Godheart Scepter** `godheart_scepter` · UT
- Shot: 3 shots per volley, spread over 8 degrees; 95-140 damage each; speed 16 tiles/s, range 8.5 tiles (0.53 s flight); rate 1.15; size 0.45; pierces; sprite pj_godlance
- Special: `{"chain":{"n":3,"f":0.6}}`
- Effect: Arcs to 3 more enemies (60%)
- A rib of the cathedral, topped with the last noon.

**Honeydew Scepter** `honeydew_scepter` · UT
- Shot: 1 shot per volley; 85-135 damage each; speed 18 tiles/s, range 8 tiles (0.44 s flight); rate 1.05; size 0.42; sprite nectar
- Special: `{"slow":{"f":0.25,"t":1}}`
- Effect: Slows 25% for 1s
- Its bolts leave everything they touch sticky and slow.

**Sporecaller Wand** `sporecaller_wand` · UT
- Shot: 1 shot per volley; 90-140 damage each; speed 18 tiles/s, range 8 tiles (0.44 s flight); rate 1.05; size 0.42; sprite gasbubble
- Special: `{"split":{"n":4,"proj":"gasbubble","f":0.3}}`
- Effect: Shatters on hit into 4 shards
- Its bolt bursts into spores when it lands.

**The Abbot's Wand** `abbots_crozier` · UT
- Shot: 1 shot per volley; 45-70 damage each; speed 13 tiles/s, range 8 tiles (0.62 s flight); rate 1.2; size 0.5; pierces; sprite pj_crozier
- Special: `{"split":{"n":4,"f":0.35,"proj":"bubble","onEnd":true}}`
- Stats: +4 WIS
- Effect: Bursts at the end of its flight into 4 shards
- It hooks pearls from the flood and throws them back.

**The Astrolabe Rod** `orrery_rod` · UT
- Shot: 2 shots per volley, spread over 9 degrees; 60-90 damage each; speed 14 tiles/s, range 8 tiles (0.57 s flight); rate 1.1; size 0.45; pierces; sprite pj_orrery
- Special: `{"boomerang":true,"slow":{"f":0.3,"t":1}}`
- Effect: Slows 30% for 1s · Returns to you like a boomerang
- An axle of the winter engine. It throws two stars at once.

**The Cuckoo** `the_cuckoo` · UT
- Shot: 2 shots per volley, spread over 17 degrees; 150-210 damage each; speed 3 tiles/s, range 8 tiles (2.67 s flight); rate 0.95; size 0.55; sprite pj_cuckoo
- Special: `{"accel":26,"boomerang":true}`
- Effect: Returns to you like a boomerang · Starts slow and accelerates
- It pops out, says its piece, and goes right back in.

**The Last Second** `the_last_second` · UT · MYTHIC, UT
- Shot: 3 shots per volley, spread over 20 degrees; 260-340 damage each; speed 2.5 tiles/s, range 9 tiles (3.60 s flight); rate 1; size 0.6; sprite pj_lastsecond
- Special: `{"accel":34,"quake":{"n":8,"proj":"pj_cog","f":0.3,"stun":0.5}}`
- Effect: Starts slow and accelerates · Each hit sends a shockwave of 8 shards and stuns
- The final tick before the end of the world, kept in a brass weight.

**The Maestro's Baton** `maestros_baton` · UT
- Shot: 1 shot per volley; 70-100 damage each; speed 19 tiles/s, range 7.4 tiles (0.39 s flight); rate 1.05; size 0.4; sprite puppet_string
- Special: `{"crit":{"p":0.25,"x":2.5}}`
- Effect: 25% chance for 2.5× damage
- He conducted his puppets with it. Now it conducts your shots: every few beats, a crescendo.

**The Ringmaster's Wand** `ringmaster_cane` · UT
- Shot: 1 shot per volley; 125-190 damage each; speed 19 tiles/s, range 8.6 tiles (0.45 s flight); rate 1.05; size 0.45; sprite bx2_shots/grinning_ringmaster.cane_star
- His cane, cut down to a wand. Point it and say "and now". Something always happens.

**The Sunless Psalter** `sunless_psalter` · UT · MYTHIC, UT
- Shot: 2 shots per volley, spread over 7 degrees; 80-120 damage each; speed 16 tiles/s, range 8 tiles (0.50 s flight); rate 1.15; size 0.45; pierces; sprite pj_psalter
- Special: `{"chain":{"n":2,"f":0.5},"crit":{"p":0.2,"x":3}}`
- Effect: Arcs to 2 more enemies (50%) · 20% chance for 3× damage
- The hymns written for the sun's funeral. Read aloud, they still hurt.

**Wand of Hoarfrost** `wand_of_hoarfrost` · UT
- Shot: 1 shot per volley; 100-160 damage each; speed 19 tiles/s, range 8.6 tiles (0.45 s flight); rate 1.05; size 0.42; sprite frostshard
- Special: `{"slow":{"f":0.3,"t":1.2}}`
- Effect: Slows 30% for 1.2s
- Its bolt leaves a long white breath in the air.

**Wand of the Eleventh Hour** `the_eleventh_hour` · UT
- Shot: 2 shots per volley, spread over 17 degrees; 160-230 damage each; speed 3 tiles/s, range 8 tiles (2.67 s flight); rate 0.95; size 0.55; sprite pj_eleventh
- Special: `{"accel":30,"explode":{"r":1.3,"f":0.5}}`
- Effect: Explodes on hit (1.3 tiles, 50%) · Starts slow and accelerates
- Time is running out. When it arrives, it arrives all at once.

**Wyrmglass Wand** `wyrmglass_wand` · UT
- Shot: 1 shot per volley; 105-150 damage each; speed 19 tiles/s, range 7.6 tiles (0.40 s flight); rate 1; size 0.45; sprite white_bolt
- Special: `{"chain":{"n":2,"f":0.6}}`
- Effect: Arcs to 2 more enemies (60%)
- A sliver of the Prism Wyrm's glass. Its light jumps from one foe to the next, splitting as it goes.

### godweapon

**The Developer's Gavel** `admin_godhammer` · ADMIN · ADMIN, UT
- Shot: 7 shots per volley, spread over 52 degrees; 9000-14000 damage each; speed 18 tiles/s, range 12 tiles (0.67 s flight); rate 3; size 0.7; pierces; sprite pj_admin
- Special: `{"chain":{"n":5,"f":1},"explode":{"r":2.5,"f":1},"burn":{"dps":4000,"t":3},"slow":{"f":0.8,"t":3}}`
- Effect: Arcs to 5 more enemies (100%) · Explodes on hit (2.5 tiles, 100%) · Ignites: 4000/s for 3s · Slows 80% for 3s
- Objection overruled. Everything is overruled.

## Abilities (113)

### bellows (Brawler)

**Patched Bellows** `bellows_t0` · T0
- Ability: 45 MP; burst 10 x 60 damage, range 3, sprite pj_gauntlet_0; `{"berserk":2.5}`
- It breathes like a forge, and so will you. A humble start: it works, mostly.

**Iron Bellows** `bellows_t1` · T1
- Ability: 50 MP; burst 10 x 80 damage, range 3, sprite pj_gauntlet_2; `{"berserk":2.9}`
- It breathes like a forge, and so will you. Iron-bound and dependable.

**Bronze Bellows** `bellows_t2` · T2
- Ability: 55 MP; burst 10 x 100 damage, range 3, sprite pj_gauntlet_4; `{"berserk":3.3}`
- It breathes like a forge, and so will you. Bronze-fitted, a craftsman's piece.

**Steel Bellows** `bellows_t3` · T3
- Ability: 60 MP; burst 10 x 120 damage, range 3, sprite pj_gauntlet_6; `{"berserk":3.7}`
- It breathes like a forge, and so will you. Steel, and it shows.

**Verdigris Lung** `bellows_t4` · T4
- Ability: 65 MP; burst 10 x 140 damage, range 3, sprite pj_gauntlet_8; `{"berserk":4.1}`
- It breathes like a forge, and so will you. Verdigris-green with age, and with power.

**Cobalt Gale-Bellows** `bellows_t5` · T5
- Ability: 70 MP; burst 10 x 160 damage, range 3, sprite pj_gauntlet_10; `{"berserk":4.5}`
- It breathes like a forge, and so will you. Cobalt-bright. Only the best are made like this.

**Censer of Absolution** `censer_of_absolution` · UT
- Ability: 80 MP; burst 14 x 140 damage, range 4, sprite smoke; `{"berserk":5,"heal":150,"mod":"trail"}`
- Effect: The charge leaves a trail of burning incense.
- The Magistrate's censer, worked into a bellows. It breathes out everyone it forgave.

**Hymn of the Mire** `hymn_of_the_mire` · UT
- Ability: 70 MP; burst 20 x 120 damage, range 5, sprite bile; `{"berserk":4,"mod":"cloud"}`
- Effect: The charge ends in a lingering bile cloud.
- Three throats' worth of drowned song, pressed into one bellows.

**Pit-Fighter's Bellows** `pitfighters_bellows` · UT · UT, set: pitfighter
- Ability: 70 MP; burst 12 x 180 damage, range 3.5, sprite pj_cinderfist; `{"berserk":6,"mod":"trail"}`
- Effect: The charge leaves a trail of burning incense.
- The crowd's roar, bottled. The charge leaves a road of burning incense.

**The Colossus Bellows** `colossus_core` · UT
- Ability: 80 MP; burst 14 x 220 damage, range 3.5, sprite fireball; `{"berserk":5,"mod":"trail"}`
- Stats: +4 ATT, +4 DEF
- Effect: The charge leaves a trail of burning incense.
- The bellows from the Colossus's chest. Charge, and the ground burns behind you.

**The Herald's Conch** `heralds_conch` · UT
- Ability: 75 MP; burst 18 x 130 damage, range 5, sprite conchwave; `{"berserk":4,"mod":"vortex"}`
- Effect: The charge drags enemies along in its wake.
- It still calls the tide. The tide still answers.

**The Spore Bellows** `spore_bomb` · UT
- Ability: 70 MP; burst 16 x 120 damage, range 4.5, sprite gasbubble; `{"berserk":4,"mod":"cloud"}`
- Effect: The charge ends in a lingering bile cloud.
- A bellows stuffed with spores. Charge, and leave a cloud behind you.

**The Unbroken Bellows** `the_unbroken_bellows` · UT · MYTHIC, UT
- Ability: 80 MP; burst 14 x 220 damage, range 3.6, sprite pj_cinderfist; `{"berserk":7,"mod":"inferno"}`
- Effect: The charge sets the ground ablaze behind you and ends in two eruptions.
- It breathed the first fire into the world. It has not stopped since.

### seal (Forge Knight)

**Rust Seal** `seal_t0` · T0
- Ability: 50 MP; burst 12 x 90 damage, range 3.5, pierces, sprite spark; `{"armored":2.5}`
- An oath pressed into metal heavy enough to crush whoever breaks it. A humble start: it works, mostly.

**Iron Oath-Seal** `seal_t1` · T1
- Ability: 54 MP; burst 12 x 118 damage, range 3.5, pierces, sprite spark; `{"armored":3}`
- An oath pressed into metal heavy enough to crush whoever breaks it. Iron-bound and dependable.

**Bronze Oath-Seal** `seal_t2` · T2
- Ability: 58 MP; burst 12 x 146 damage, range 3.5, pierces, sprite spark; `{"armored":3.5}`
- An oath pressed into metal heavy enough to crush whoever breaks it. Bronze-fitted, a craftsman's piece.

**Steel Oath-Seal** `seal_t3` · T3
- Ability: 62 MP; burst 12 x 174 damage, range 3.5, pierces, sprite spark; `{"armored":4}`
- An oath pressed into metal heavy enough to crush whoever breaks it. Steel, and it shows.

**Verdigris Covenant** `seal_t4` · T4
- Ability: 66 MP; burst 12 x 202 damage, range 3.5, pierces, sprite spark; `{"armored":4.5}`
- An oath pressed into metal heavy enough to crush whoever breaks it. Verdigris-green with age, and with power.

**Cobalt Covenant** `seal_t5` · T5
- Ability: 70 MP; burst 12 x 230 damage, range 3.5, pierces, sprite spark; `{"armored":5}`
- An oath pressed into metal heavy enough to crush whoever breaks it. Cobalt-bright. Only the best are made like this.

**Oathsworn Seal** `oathsworn_seal` · UT · UT, set: oathsworn
- Ability: 75 MP; burst 14 x 220 damage, range 4, pierces, sprite hammerlet; `{"armored":6,"mod":"aftershock"}`
- Effect: A second anvil falls on the same spot.
- Two anvils: one for the oath, one for whoever breaks it.

**Rind Bulwark** `rind_bulwark` · UT
- Ability: 70 MP; burst 12 x 120 damage, range 4, sprite thornseed; `{"armored":4,"heal":100,"mod":"aftershock"}`
- Effect: A second anvil falls on the same spot.
- A shield of thick green rind. Slam it down and the seeds fly.

**Seal of the Astrolabe** `orrery_seal` · UT
- Ability: 85 MP; burst 30 x 170 damage, range 5, pierces, sprite rune; `{"armored":5,"mod":"freeze"}`
- Effect: The anvil's stun lasts twice as long.
- A stopped ring of the winter engine. It still predicts the worst.

**Seal of the Sphinx** `sphinx_helm` · UT
- Ability: 70 MP; burst 14 x 130 damage, range 4.5, sprite ember; `{"armored":4,"mod":"aftershock"}`
- Effect: A second anvil falls on the same spot.
- Swear on the riddle. It crowns you in gold and throws the sand back at them.

**Seal of the Turning Verse** `the_turning_verse` · UT
- Ability: 70 MP; burst 24 x 150 damage, range 4.5, pierces, sprite rune; `{"armored":4,"mod":"aftershock"}`
- Effect: A second anvil falls on the same spot.
- One verse from the monk's wheel. It has not stopped turning.

**The First Anvil** `the_first_anvil` · UT · MYTHIC, UT
- Ability: 90 MP; burst 16 x 240 damage, range 4, pierces, sprite hammerlet; `{"armored":6,"mod":"meteor"}`
- Effect: A ring of anvils rains down, then one great anvil in the middle.
- The anvil the god was forged on. It falls from the sky in pieces, and then all at once.

**The Unstruck Anvil** `unstruck_anvil` · UT
- Ability: 90 MP; burst 32 x 200 damage, range 5, pierces, sprite hammerlet; `{"armored":6,"mod":"triple"}`
- Effect: Three anvils fall in a line.
- A sliver of the god-anvil. Every hammer in the room turns toward it.

### halo (Priest)

**Tin Halo** `halo_t0` · T0
- Ability: 60 MP; burst 16 x 50 damage, range 5, pierces, sprite lance; `{"heal":100,"invuln":1}`
- A little circle of noon you can carry with you. A humble start: it works, mostly.

**Iron Halo** `halo_t1` · T1
- Ability: 66 MP; burst 16 x 68 damage, range 5, pierces, sprite lance; `{"heal":140,"invuln":1.25}`
- A little circle of noon you can carry with you. Iron-bound and dependable.

**Bronze Halo** `halo_t2` · T2
- Ability: 72 MP; burst 16 x 86 damage, range 5, pierces, sprite lance; `{"heal":180,"invuln":1.5}`
- A little circle of noon you can carry with you. Bronze-fitted, a craftsman's piece.

**Steel Halo** `halo_t3` · T3
- Ability: 78 MP; burst 16 x 104 damage, range 5, pierces, sprite lance; `{"heal":220,"invuln":1.75}`
- A little circle of noon you can carry with you. Steel, and it shows.

**Verdigris Corona** `halo_t4` · T4
- Ability: 84 MP; burst 16 x 122 damage, range 5, pierces, sprite lance; `{"heal":260,"invuln":2}`
- A little circle of noon you can carry with you. Verdigris-green with age, and with power.

**Cobalt Corona** `halo_t5` · T5
- Ability: 90 MP; burst 16 x 140 damage, range 5, pierces, sprite lance; `{"heal":300,"invuln":2.25}`
- A little circle of noon you can carry with you. Cobalt-bright. Only the best are made like this.

**Dawn-Choir Halo** `dawnchoir_halo` · UT · UT, set: dawnchoir
- Ability: 100 MP; burst 18 x 170 damage, range 5.5, pierces, sprite lance; `{"heal":350,"invuln":2.5,"mod":"ignite"}`
- Effect: Everything in the pillar is set alight.
- Worn by the first voice of the morning hymn. Its pillar sets the wicked alight.

**Halo of the Waking Bell** `the_waking_bell` · UT
- Ability: 85 MP; burst 20 x 190 damage, range 5, pierces, sprite dreamstar; `{"heal":240,"invuln":2.2}`
- A halo hung with a bell. Raise it and bells toll down where you point.

**Stained-Glass Halo** `stained_glass_halo` · UT
- Ability: 70 MP; burst 18 x 110 damage, range 5, pierces, sprite beacon; `{"heal":200,"invuln":1.5,"mod":"prism3"}`
- Effect: Splits into three smaller pillars.
- A rose window in miniature. Light comes through it in every colour.

**The Eaten Halo** `eaten_halo` · UT
- Ability: 80 MP; burst 18 x 160 damage, range 5, pierces, sprite goldshard; `{"heal":220,"invuln":2,"mod":"devour"}`
- Effect: Kills inside the pillar heal you.
- Pried out of the thing that ate the saint. Still bitten.

**The Last Noon** `the_last_noon` · UT
- Ability: 110 MP; burst 24 x 180 damage, range 6, pierces, sprite lance; `{"heal":400,"invuln":3,"mod":"follow"}`
- Effect: The pillar follows your cursor.
- What was left of the sun after it died. Holding it is a kind of judgement.

**The Orrery Halo** `orrery_orb` · UT
- Ability: 90 MP; burst 20 x 170 damage, range 5.5, pierces, sprite star; `{"heal":220,"mod":"follow","sig":{"kind":"orbit","life":8,"dmg":0,"sets":[{"kind":"body","n":3,"r":1.8,"w":2.4,"dmg":160,"sprite":"bx_shots/grand_orrery.moon_shard","scale":1.6,"block":{"n":2,"rest":1.5}},{"kind":"hole","n":1,"r":3.3,"w":-1.1,"dmg":90,"pull":3,"block":{"n":10,"rest":3}}]}}`
- Effect: On use, for 8s: 3 orbiting guardians: 160 on touch, block up to 2 shots (then rest 1.5s); a black hole: 90 on touch, swallow up to 10 shots (then rest 3s), drag monsters in · The pillar follows your cursor.
- A little brass sky. Raise it and the light falls where you point, while three planets and a black hole wheel round you for eight seconds.

**The Second Sun** `the_second_sun` · UT · MYTHIC, UT
- Ability: 110 MP; burst 20 x 190 damage, range 5.5, pierces, sprite lance; `{"heal":350,"invuln":2.5,"mod":"eclipse"}`
- Effect: One huge pillar that follows your cursor, burns, and heals you on kills.
- When the first sun died, someone lit another. It follows whoever holds it.

**Wick of the Mother** `wick_of_the_mother` · UT
- Ability: 90 MP; burst 20 x 140 damage, range 5, pierces, sprite corpseflame; `{"heal":350,"invuln":1.5,"mod":"ignite"}`
- Effect: Everything in the pillar is set alight.
- It lights itself. It does not care what it burns.

### reliquary (Summoner)

**Pine Reliquary** `reliquary_t0` · T0
- Ability: 70 MP; burst 1 x 17 damage, range 6, sprite pj_thrall; `{"thralls":2,"life":6,"summon":"thrall"}`
- Something inside is knocking. It wants to help. A humble start: it works, mostly.

**Iron Reliquary** `reliquary_t1` · T1
- Ability: 76 MP; burst 1 x 23 damage, range 6, sprite pj_thrall; `{"thralls":3,"life":7,"summon":"thrall"}`
- Something inside is knocking. It wants to help. Iron-bound and dependable.

**Bronze Reliquary** `reliquary_t2` · T2
- Ability: 82 MP; burst 1 x 29 damage, range 6, sprite pj_thrall; `{"thralls":3,"life":8,"summon":"thrall_hound"}`
- Something inside is knocking. It wants to help. Bronze-fitted, a craftsman's piece.

**Steel Ossuary** `reliquary_t3` · T3
- Ability: 88 MP; burst 1 x 35 damage, range 6, sprite pj_thrall; `{"thralls":4,"life":9,"summon":"thrall_hound"}`
- Something inside is knocking. It wants to help. Steel, and it shows.

**Verdigris Ossuary** `reliquary_t4` · T4
- Ability: 94 MP; burst 1 x 41 damage, range 6, sprite pj_thrall; `{"thralls":4,"life":10,"summon":"thrall_knight"}`
- Something inside is knocking. It wants to help. Verdigris-green with age, and with power.

**Cobalt Catacomb** `reliquary_t5` · T5
- Ability: 100 MP; burst 1 x 47 damage, range 6, sprite pj_thrall; `{"thralls":5,"life":11,"summon":"thrall_knight"}`
- Something inside is knocking. It wants to help. Cobalt-bright. Only the best are made like this.

**Gravewarden's Reliquary** `graverite_reliquary` · UT · UT, set: graverite
- Ability: 100 MP; burst 1 x 110 damage, range 6, sprite pj_thrall; `{"thralls":5,"life":12,"summon":"thrall_knight","mod":"thrallburst"}`
- Effect: Thralls explode when they expire.
- The knights of the old watch, still on duty. They go out with a bang.

**Reliquary of the Hollow Psalm** `the_hollow_psalm` · UT
- Ability: 100 MP; burst 3 x 150 damage, range 6.5, sprite pj_thrall; `{"thralls":5,"life":11,"summon":"thrall_gilded","mod":"thrallfan"}`
- Effect: Thralls cleave everything around what they are clawing.
- Sung in the Heart of Godfall. The dead who hear it fight in threes.

**The Choir of Bones** `choir_of_bones` · UT
- Ability: 90 MP; burst 1 x 110 damage, range 6, sprite pj_thrall; `{"thralls":4,"life":10,"summon":"thrall_choir","mod":"thrallburst"}`
- Effect: Thralls explode when they expire.
- A reliquary of choirboys. When their song ends, they go out with a bang.

**The Crimson Reliquary** `crimson_chalice` · UT
- Ability: 90 MP; burst 16 x 150 damage, range 5, sprite d2_projectiles/crimson_keep.blood_spit; `{"heal":260,"mod":"devour"}`
- Effect: Kills inside the pillar heal you.
- A reliquary shaped like a chalice. Open it, and those around you bleed for your health.

**The Grave of Kings** `the_grave_of_kings` · UT · MYTHIC, UT
- Ability: 110 MP; burst 3 x 170 damage, range 6.5, sprite pj_thrall; `{"thralls":4,"life":14,"summon":"thrall_gilded","mod":"kings"}`
- Effect: Gilded kings that cleave and explode when they fall.
- Every king who ever died in the realm, and every one of them still wants a war.

**The Soul Reliquary** `soul_lantern` · UT
- Ability: 90 MP; burst 1 x 60 damage, range 6, sprite pj_thrall; `{"thralls":5,"life":11,"summon":"thrall_knight","mod":"thrallburst"}`
- Stats: +6 WIS, +40 MP
- Effect: Thralls explode when they expire.
- A reliquary that burns like a lantern. Its dead climb out, and go out with a bang.

### hookline (Harpooner)

**Hemp Line** `hookline_t0` · T0
- Ability: 45 MP; burst 1 x 160 damage, range 8, sprite hook; `{"armored":1.5}`
- The line never tangles and never lets go. A humble start: it works, mostly.

**Iron Grapple** `hookline_t1` · T1
- Ability: 50 MP; burst 1 x 210 damage, range 8.4, sprite hook; `{"armored":1.8}`
- The line never tangles and never lets go. Iron-bound and dependable.

**Bronze Grapple** `hookline_t2` · T2
- Ability: 55 MP; burst 1 x 260 damage, range 8.8, sprite hook; `{"armored":2.1}`
- The line never tangles and never lets go. Bronze-fitted, a craftsman's piece.

**Steel Grapple** `hookline_t3` · T3
- Ability: 60 MP; burst 1 x 310 damage, range 9.2, sprite hook; `{"armored":2.4}`
- The line never tangles and never lets go. Steel, and it shows.

**Verdigris Kraken-Line** `hookline_t4` · T4
- Ability: 65 MP; burst 1 x 360 damage, range 9.6, sprite hook; `{"armored":2.7}`
- The line never tangles and never lets go. Verdigris-green with age, and with power.

**Cobalt Kraken-Line** `hookline_t5` · T5
- Ability: 70 MP; burst 1 x 410 damage, range 10, sprite hook; `{"armored":3}`
- The line never tangles and never lets go. Cobalt-bright. Only the best are made like this.

**Leviathan Line** `leviathan_line` · UT · UT, set: leviathan
- Ability: 80 MP; burst 1 x 520 damage, range 11, sprite hook; `{"armored":3.5,"mod":"reel3"}`
- Effect: Hooks up to three enemies at once.
- Built to land the big ones. Three at a time.

**The Abyssal Line** `abyssal_line` · UT
- Ability: 85 MP; burst 1 x 520 damage, range 10, sprite hook; `{"armored":3.5,"mod":"shockline"}`
- Effect: Reeled-in enemies arrive in a thunderclap explosion.
- Forged in the Drowned Forge. Whatever it reels in arrives with a thunderclap.

**The Drowned Man's Line** `drowned_mans_line` · UT
- Ability: 80 MP; burst 1 x 420 damage, range 10, sprite hook; `{"armored":3,"mod":"reel3"}`
- Effect: Hooks up to three enemies at once.
- It hooked a whole congregation once. It still remembers how.

**The Leviathan's Maw** `the_leviathans_maw` · UT · MYTHIC, UT
- Ability: 85 MP; burst 1 x 600 damage, range 11, sprite hook; `{"armored":4,"mod":"maelstrom"}`
- Effect: Hooks up to five enemies, and they arrive in a thunderclap.
- Not a hook. A tooth. The thing it came from swallowed whole fleets.

### mirror (Duelist)

**Tin Mirror** `mirror_t0` · T0
- Ability: 40 MP; burst 12 x 100 damage, range 4, sprite pj_glass; `{"decoy":2.5}`
- Your reflection is braver than you are. A humble start: it works, mostly.

**Iron Mirror** `mirror_t1` · T1
- Ability: 45 MP; burst 12 x 130 damage, range 4.3, sprite pj_glass; `{"decoy":2.9}`
- Your reflection is braver than you are. Iron-bound and dependable.

**Bronze Mirror** `mirror_t2` · T2
- Ability: 50 MP; burst 12 x 160 damage, range 4.6, sprite pj_glass; `{"decoy":3.3}`
- Your reflection is braver than you are. Bronze-fitted, a craftsman's piece.

**Silver Mirror** `mirror_t3` · T3
- Ability: 55 MP; burst 12 x 190 damage, range 4.9, sprite pj_glass; `{"decoy":3.7}`
- Your reflection is braver than you are. Steel, and it shows.

**Verdigris Looking-Glass** `mirror_t4` · T4
- Ability: 60 MP; burst 12 x 220 damage, range 5.2, sprite pj_glass; `{"decoy":4.1}`
- Your reflection is braver than you are. Verdigris-green with age, and with power.

**Cobalt Looking-Glass** `mirror_t5` · T5
- Ability: 65 MP; burst 12 x 250 damage, range 5.5, sprite pj_glass; `{"decoy":4.5}`
- Your reflection is braver than you are. Cobalt-bright. Only the best are made like this.

**Glass Fencer's Mirror** `glassfencer_mirror` · UT · UT, set: glassfencer
- Ability: 65 MP; burst 16 x 220 damage, range 6, sprite pj_glass; `{"decoy":4,"mod":"hall"}`
- Effect: Leaves three reflections instead of one.
- Step through and leave three fencers behind.

**The Cracked Looking-Glass** `cracked_looking_glass` · UT
- Ability: 60 MP; burst 14 x 200 damage, range 5.5, sprite pj_glass; `{"decoy":4,"mod":"echoes"}`
- Effect: Leaves two reflections instead of one.
- The crack runs right down the middle, so it always shows two of you.

**The Hall of Mirrors** `hall_of_mirrors` · UT
- Ability: 70 MP; burst 20 x 260 damage, range 5, sprite pj_glass; `{"decoy":4,"mod":"hall"}`
- Effect: Leaves three reflections instead of one.
- Step through it and you leave three of yourself behind.

**The Infinite Reflection** `the_infinite_reflection` · UT · MYTHIC, UT
- Ability: 75 MP; burst 16 x 240 damage, range 6, sprite pj_glass; `{"decoy":4,"mod":"infinite"}`
- Effect: Leaves five reflections in a ring, each shattering twice.
- Two mirrors facing each other. Somewhere in there, all of you are fighting.

### kite (Stormwright)

**Paper Kite** `kite_t0` · T0
- Ability: 60 MP; burst 1 x 32 damage, range 4.5, sprite zap; `{"life":6}`
- It only flies well in a storm, and it prefers to start one. A humble start: it works, mostly.

**Silk Kite** `kite_t1` · T1
- Ability: 66 MP; burst 1 x 42 damage, range 4.7, sprite zap; `{"life":7}`
- It only flies well in a storm, and it prefers to start one. Iron-bound and dependable.

**Bronze-Ribbed Kite** `kite_t2` · T2
- Ability: 72 MP; burst 1 x 52 damage, range 4.9, sprite zap; `{"life":8}`
- It only flies well in a storm, and it prefers to start one. Bronze-fitted, a craftsman's piece.

**Steel-Ribbed Kite** `kite_t3` · T3
- Ability: 78 MP; burst 1 x 62 damage, range 5.1, sprite zap; `{"life":9}`
- It only flies well in a storm, and it prefers to start one. Steel, and it shows.

**Verdigris Storm-Kite** `kite_t4` · T4
- Ability: 84 MP; burst 1 x 72 damage, range 5.3, sprite zap; `{"life":10}`
- It only flies well in a storm, and it prefers to start one. Verdigris-green with age, and with power.

**Cobalt Storm-Kite** `kite_t5` · T5
- Ability: 90 MP; burst 1 x 82 damage, range 5.5, sprite zap; `{"life":11}`
- It only flies well in a storm, and it prefers to start one. Cobalt-bright. Only the best are made like this.

**Tempest Caller's Kite** `tempest_kite` · UT · UT, set: tempest
- Ability: 90 MP; burst 1 x 190 damage, range 6, sprite zap; `{"life":12,"mod":"twinkite"}`
- Effect: Flies two kites at once.
- Two kites, one storm.

**The Eye of the Storm** `the_eye_of_the_storm` · UT · MYTHIC, UT
- Ability: 100 MP; burst 1 x 190 damage, range 6, sprite zap; `{"life":12,"mod":"eye"}`
- Effect: Three kites circle you wherever you go.
- Three kites circle you, and you are the calm at the centre.

**The Squall** `the_squall` · UT
- Ability: 85 MP; burst 1 x 160 damage, range 5.5, sprite zap; `{"life":10,"mod":"squall"}`
- Effect: The kite follows you around.
- A kite that will not stay where you leave it. It follows you like a little storm.

**The Thunderhead Kite** `the_thunderhead` · UT
- Ability: 90 MP; burst 1 x 210 damage, range 6, sprite zap; `{"life":12,"mod":"twinkite"}`
- Effect: Flies two kites at once.
- Two kites on one line. The storm between them never ends.

### stopwatch (Clockmaker)

**Tin Stopwatch** `stopwatch_t0` · T0
- Ability: 80 MP; burst 0 x 0 damage, range 6, sprite none; `{"stop":2}`
- Wind it once and the whole world holds its breath. A humble start: it works, mostly.

**Iron Stopwatch** `stopwatch_t1` · T1
- Ability: 86 MP; burst 0 x 0 damage, range 6.4, sprite none; `{"stop":2.4}`
- Wind it once and the whole world holds its breath. Iron-bound and dependable.

**Bronze Stopwatch** `stopwatch_t2` · T2
- Ability: 92 MP; burst 0 x 0 damage, range 6.8, sprite none; `{"stop":2.8}`
- Wind it once and the whole world holds its breath. Bronze-fitted, a craftsman's piece.

**Steel Chronometer** `stopwatch_t3` · T3
- Ability: 98 MP; burst 0 x 0 damage, range 7.2, sprite none; `{"stop":3.2}`
- Wind it once and the whole world holds its breath. Steel, and it shows.

**Verdigris Chronometer** `stopwatch_t4` · T4
- Ability: 104 MP; burst 0 x 0 damage, range 7.6, sprite none; `{"stop":3.6}`
- Wind it once and the whole world holds its breath. Verdigris-green with age, and with power.

**Cobalt Hourglass** `stopwatch_t5` · T5
- Ability: 110 MP; burst 0 x 0 damage, range 8, sprite none; `{"stop":4}`
- Wind it once and the whole world holds its breath. Cobalt-bright. Only the best are made like this.

**Clockwork Saint's Stopwatch** `clockwork_stopwatch` · UT · UT, set: clockwork
- Ability: 105 MP; burst 0 x 0 damage, range 8.5, sprite none; `{"stop":4,"mod":"slowfield"}`
- Effect: When time restarts, everything that was frozen stays slowed for 3s.
- When it starts again, everything it stopped stays sluggish.

**The Broken Hourglass** `the_broken_hourglass` · UT
- Ability: 110 MP; burst 0 x 0 damage, range 8, sprite none; `{"stop":4,"mod":"rewind"}`
- Effect: Frozen enemy bullets turn around and fly back at their owners.
- The sand falls up. Frozen bullets turn around and go home.

**The Hourglass of Sand** `the_hourglass_of_sand` · UT
- Ability: 100 MP; burst 0 x 0 damage, range 8.5, sprite none; `{"stop":3.5,"mod":"slowfield"}`
- Effect: When time restarts, everything that was frozen stays slowed for 3s.
- When time starts again, the sand is still in their joints.

**The Unwound Spring** `the_unwound_spring` · UT · MYTHIC, UT
- Ability: 120 MP; burst 0 x 0 damage, range 9, sprite none; `{"stop":4.5,"unwind":900,"mod":"unwind"}`
- Effect: When time restarts, everything frozen takes a huge blow.
- All the time it stopped comes back at once, and it hits like a hammer.

### runeward (Runeblade)

**Chalk Rune** `runeward_t0` · T0
- Ability: 50 MP; burst 10 x 70 damage, range 3.5, pierces, sprite rune_slash; `{"ward":120}`
- Every rune cut into it is a word that means "no". A humble start: it works, mostly.

**Iron Rune-Ward** `runeward_t1` · T1
- Ability: 55 MP; burst 10 x 92 damage, range 3.5, pierces, sprite rune_slash; `{"ward":170}`
- Every rune cut into it is a word that means "no". Iron-bound and dependable.

**Bronze Rune-Ward** `runeward_t2` · T2
- Ability: 60 MP; burst 10 x 114 damage, range 3.5, pierces, sprite rune_slash; `{"ward":220}`
- Every rune cut into it is a word that means "no". Bronze-fitted, a craftsman's piece.

**Steel Rune-Ward** `runeward_t3` · T3
- Ability: 65 MP; burst 10 x 136 damage, range 3.5, pierces, sprite rune_slash; `{"ward":270}`
- Every rune cut into it is a word that means "no". Steel, and it shows.

**Verdigris Aegis-Rune** `runeward_t4` · T4
- Ability: 70 MP; burst 10 x 158 damage, range 3.5, pierces, sprite rune_slash; `{"ward":320}`
- Every rune cut into it is a word that means "no". Verdigris-green with age, and with power.

**Cobalt Aegis-Rune** `runeward_t5` · T5
- Ability: 75 MP; burst 10 x 180 damage, range 3.5, pierces, sprite rune_slash; `{"ward":370}`
- Every rune cut into it is a word that means "no". Cobalt-bright. Only the best are made like this.

**Runewarden's Ward** `runewarden_ward` · UT · UT, set: runewarden
- Ability: 75 MP; burst 14 x 180 damage, range 4, pierces, sprite rune_slash; `{"ward":420}`
- The oath, spoken aloud. The runes answer by standing between you and harm.

**The Runic Ward** `runic_aegis` · UT
- Ability: 80 MP; burst 16 x 200 damage, range 4, pierces, sprite rune_slash; `{"ward":520,"mod":"wardfury"}`
- Stats: +6 DEF, +4 ATT
- Effect: While your ward holds: +25% damage
- A shield with every rune of warding cut into it. Nothing gets through twice.

**The Unbroken Oath** `the_unbroken_oath` · UT · MYTHIC, UT
- Ability: 90 MP; burst 18 x 260 damage, range 4.5, pierces, sprite rune_slash; `{"ward":700,"mod":"wardnova"}`
- Stats: +8 DEF, +60 HP
- Effect: When the ward breaks, it bursts into a ring of rune-slashes, and you take no damage for a moment
- An oath sworn on the god-anvil itself. When it is finally broken, everything near you pays for it.

### hex (Hexweaver)

**Scrawled Hex** `hex_t0` · T0
- Ability: 60 MP; burst 8 x 50 damage, range 4, sprite hex_bolt; `{"curse":{"t":4,"f":0.2,"r":2.6}}`
- The pages turn by themselves to the right curse. A humble start: it works, mostly.

**Iron-Bound Grimoire** `hex_t1` · T1
- Ability: 66 MP; burst 8 x 66 damage, range 4, sprite hex_bolt; `{"curse":{"t":4.5,"f":0.22,"r":2.75}}`
- The pages turn by themselves to the right curse. Iron-bound and dependable.

**Bronze-Clasped Grimoire** `hex_t2` · T2
- Ability: 72 MP; burst 8 x 82 damage, range 4, sprite hex_bolt; `{"curse":{"t":5,"f":0.24000000000000002,"r":2.9}}`
- The pages turn by themselves to the right curse. Bronze-fitted, a craftsman's piece.

**Steel-Clasped Grimoire** `hex_t3` · T3
- Ability: 78 MP; burst 8 x 98 damage, range 4, sprite hex_bolt; `{"curse":{"t":5.5,"f":0.26,"r":3.05}}`
- The pages turn by themselves to the right curse. Steel, and it shows.

**Verdigris Codex** `hex_t4` · T4
- Ability: 84 MP; burst 8 x 114 damage, range 4, sprite hex_bolt; `{"curse":{"t":6,"f":0.28,"r":3.2}}`
- The pages turn by themselves to the right curse. Verdigris-green with age, and with power.

**Cobalt Codex** `hex_t5` · T5
- Ability: 90 MP; burst 8 x 130 damage, range 4, sprite hex_bolt; `{"curse":{"t":6.5,"f":0.30000000000000004,"r":3.35}}`
- The pages turn by themselves to the right curse. Cobalt-bright. Only the best are made like this.

**Grimoire of the Circle** `hexcircle_grimoire` · UT · UT, set: hexcircle
- Ability: 80 MP; burst 12 x 150 damage, range 4.5, sprite hex_bolt; `{"curse":{"t":6.5,"f":0.32,"r":3.3}}`
- Thirteen witches wrote one page each. Do not read it aloud.

**The Grimoire of Ash** `grimoire_of_ash` · UT
- Ability: 85 MP; burst 12 x 160 damage, range 4.5, sprite fireball; `{"curse":{"t":7,"f":0.35,"r":3.4},"mod":"ashcurse"}`
- Stats: +4 ATT, +6 WIS
- Effect: Hexed enemies also burn for the whole curse (120/s)
- Its pages are ash. The curses written on them burn all the same.

**The Grimoire of Tricks** `trick_deck` · UT
- Ability: 80 MP; burst 18 x 170 damage, range 6, sprite bx2_shots/grinning_ringmaster.playing_card; `{"curse":{"t":6,"f":0.3,"r":3.6},"mod":"contagion"}`
- Effect: When a hexed enemy dies, the hex leaps to everything near it
- A grimoire of playing cards. Pick a page, any page. They all curse.

**The Melon Orb** `melon_orb` · UT
- Ability: 80 MP; burst 10 x 140 damage, range 4.5, sprite thornseed; `{"curse":{"t":5,"f":0.25,"r":3.4}}`
- A little green moon, ripe and humming. Throw its curse and the seeds scatter out of it.

**The Thirteenth Page** `the_thirteenth_page` · UT · MYTHIC, UT
- Ability: 95 MP; burst 14 x 210 damage, range 5, sprite hex_bolt; `{"curse":{"t":8,"f":0.4,"r":3.8},"mod":"contagion"}`
- Stats: +8 WIS, +60 MP
- Effect: When a hexed enemy dies, the hex leaps to everything near it
- Twelve witches wrote the Grimoire of the Circle. The thirteenth page wrote itself.

### godability

**The Delete Key** `admin_worldender` · ADMIN · ADMIN, UT
- Ability: 0 MP; burst 0 x 9999999 damage, range 16, sprite pj_admin; `{"mod":"nuke","invuln":2,"heal":99999}`
- Effect: Deletes everything nearby.
- Removes everything within sixteen tiles from the save file.

## Armor (78)

### heavy (Brawler, Forge Knight)

**Rusted Mail** `heavy_t0` · T0
- Stats: +6 DEF, 0 HP
- Scavenged from the wrack line of the Drowned Shore. Plate for those who stand in front.

**Iron Hauberk** `heavy_t1` · T1
- Stats: +8 DEF, 0 HP
- Plain Nexus iron, hammered out by a smith who wanted to go home early. Heavy enough to stop most things, and most people.

**Barnacle Plate** `heavy_t2` · T2
- Stats: +9 DEF, 0 HP
- Pitted by salt and sea, but the edge has held. It clanks a bit. It saves your life a lot.

**Bogiron Cuirass** `heavy_t3` · T3
- Stats: +11 DEF, 0 HP
- Dredged from the bogs of Ashfen. It still smells of peat. Plate for those who stand in front.

**Runeplate** `heavy_t4` · T4
- Stats: +12 DEF, 0 HP
- Cut with Runeholt runes that hum faintly in the cold. Heavy enough to stop most things, and most people.

**Emberforged Plate** `heavy_t5` · T5
- Stats: +14 DEF, +10 HP
- Forged over the ember-vents of Godfall, where the ground is always warm. It clanks a bit. It saves your life a lot.

**Glassguard Armor** `heavy_t6` · T6
- Stats: +16 DEF, +20 HP
- Fused from Saltglass Dune glass, harder than any steel. Plate for those who stand in front.

**Gilded Penance Plate** `heavy_t7` · T7
- Stats: +17 DEF, +30 HP
- Gilded by the penitents of Godfall, who could not stop polishing it. Heavy enough to stop most things, and most people.

**Hollow Thane's Mail** `heavy_t8` · T8
- Stats: +19 DEF, +40 HP
- Hollowed by the Hollow Thanes. Something still echoes inside. It clanks a bit. It saves your life a lot.

**Anvilheart Plate** `heavy_t9` · T9
- Stats: +20 DEF, +50 HP
- Tempered in the Emberforge, a forge that has never once gone cold. Plate for those who stand in front.

**Godshard Bulwark** `heavy_t10` · T10
- Stats: +22 DEF, +60 HP
- A splinter of the god himself. It is warm, and it is listening. Heavy enough to stop most things, and most people.

**Plate of the Unstruck** `heavy_t11` · T11
- Stats: +24 DEF, +70 HP
- Woven from what the Unstruck God left behind. Nothing has ever pierced it. It clanks a bit. It saves your life a lot.

**Furnace-Heart Coat** `furnace_heart_coat` · UT
- Stats: +24 DEF, +6 ATT, +4 VIT
- Passive: `{"aura":{"dps":70,"r":2.6,"slow":0}}`
- Effect: Aura: 70/s to enemies within 2.6 tiles
- Lined with the Unstruck's grate. It is always warm.

**Gilded Penance** `gilded_penance` · UT
- Stats: +26 DEF, +80 HP, +5 VIT
- Passive: `{"kintsugi":0.25}`
- Effect: After you are hit: +25% damage for 3s
- Marble plate mended with gold where the god broke.

**Godforged Plate** `godforged_plate` · UT
- Stats: +34 DEF, +120 HP, +6 VIT
- Passive: `{"aegis":5}`
- Effect: Blocks one hit every 5s
- Cast in the god's own ribs.

**Heartbreak Mail** `heartbreak_coat` · UT
- Stats: +30 DEF, +8 ATT, +4 DEX
- Passive: `{"rage":0.5}`
- Effect: Up to +50% damage as your Life drops
- Torn from the Fallen Heart's cage. It is still trying to beat.

**Oathsworn Bulwark** `oathsworn_bulwark` · UT · UT, set: oathsworn
- Stats: +28 DEF, +80 HP, +4 VIT
- Forged to stand in a doorway forever.

**Pit-Fighter's Harness** `pitfighters_harness` · UT · UT, set: pitfighter
- Stats: +22 DEF, +60 HP, +4 ATT
- Scarred leather and chain. It has never lost a fight it finished.

**Rime Headsman's Plate** `rime_headsman_plate` · UT
- Stats: +18 DEF, +40 HP, -4 SPD
- Passive: `{"aura":{"dps":0,"r":3,"slow":0.35}}`
- Effect: Frost aura: slows enemies within 3 tiles
- Still cold enough to stop a heart. Usually someone else's.

**Rime Standard Plate** `rime_standard` · UT
- Stats: +22 DEF, +60 HP, +4 WIS
- Passive: `{"aura":{"dps":30,"r":3,"slow":0.25}}`
- Effect: Aura: 30/s to enemies within 3 tiles, slowing them
- The banner froze to the bearer. Now it is armour.

**Rindguard** `rindguard` · UT
- Stats: +14 DEF, +60 HP, +4 VIT
- Plates of cured rind. Surprisingly tough, faintly sweet.

**The Bellwright's Mail** `bellwrights_mail` · UT
- Stats: +24 DEF, +60 HP, +4 VIT
- Passive: `{"aegis":6}`
- Effect: Blocks one hit every 6s
- Cast like a bell. Every few seconds it rings, and one blow glances off.

**Tidewoven Mail** `tidewoven_coat` · UT
- Stats: +14 DEF, +4 SPD, +4 DEX
- Passive: `{"dodge":0.15}`
- Effect: 15% chance to dodge a hit
- Knotted from chapel ropes and kelp. It moves like water.

### leather (Harpooner, Duelist, Runeblade)

**Ragged Jerkin** `leather_t0` · T0
- Stats: +4 DEF, 0 DEX, 0 SPD
- Scavenged from the wrack line of the Drowned Shore. Supple and quiet; it moves when you move.

**Tanned Leathers** `leather_t1` · T1
- Stats: +5 DEF, 0 DEX, 0 SPD
- Plain Nexus iron, hammered out by a smith who wanted to go home early. Light armour for quick feet.

**Sealskin Coat** `leather_t2` · T2
- Stats: +6 DEF, +1 DEX, 0 SPD
- Pitted by salt and sea, but the edge has held. Stitched for speed, not for standing still.

**Bogtoad Hide** `leather_t3` · T3
- Stats: +8 DEF, +1 DEX, 0 SPD
- Dredged from the bogs of Ashfen. It still smells of peat. Supple and quiet; it moves when you move.

**Runestitched Leather** `leather_t4` · T4
- Stats: +9 DEF, +1 DEX, +1 SPD
- Cut with Runeholt runes that hum faintly in the cold. Light armour for quick feet.

**Embertanned Armor** `leather_t5` · T5
- Stats: +10 DEF, +2 DEX, +1 SPD
- Forged over the ember-vents of Godfall, where the ground is always warm. Stitched for speed, not for standing still.

**Glasshide Vest** `leather_t6` · T6
- Stats: +11 DEF, +2 DEX, +1 SPD
- Fused from Saltglass Dune glass, harder than any steel. Supple and quiet; it moves when you move.

**Gilded Leathers** `leather_t7` · T7
- Stats: +12 DEF, +2 DEX, +1 SPD
- Gilded by the penitents of Godfall, who could not stop polishing it. Light armour for quick feet.

**Hollowhide Armor** `leather_t8` · T8
- Stats: +14 DEF, +3 DEX, +2 SPD
- Hollowed by the Hollow Thanes. Something still echoes inside. Stitched for speed, not for standing still.

**Stormwyrm Hide** `leather_t9` · T9
- Stats: +15 DEF, +3 DEX, +2 SPD
- Tempered in the Emberforge, a forge that has never once gone cold. Supple and quiet; it moves when you move.

**Godshard Leathers** `leather_t10` · T10
- Stats: +16 DEF, +3 DEX, +2 SPD
- A splinter of the god himself. It is warm, and it is listening. Light armour for quick feet.

**Skin of the Unstruck** `leather_t11` · T11
- Stats: +17 DEF, +4 DEX, +2 SPD
- Woven from what the Unstruck God left behind. Nothing has ever pierced it. Stitched for speed, not for standing still.

**Glass Fencer's Jerkin** `glassfencer_jerkin` · UT · UT, set: glassfencer
- Stats: +20 DEF, +8 DEX, +5 SPD
- Silvered leather. Blows skate off it.

**Leviathan Hide** `leviathan_hide` · UT · UT, set: leviathan
- Stats: +22 DEF, +70 HP, +5 DEX
- Cut from the one that got away. It did not get away.

**Mycelial Hide** `mycelial_hide` · UT
- Stats: +12 DEF, +6 VIT, +40 HP
- Passive: `{"nopoison":true,"orbit":{"kind":"body","n":4,"r":1.5,"w":1.6,"dmg":50,"burn":45,"sprite":"bx_shots/mother_mycelia.spore_puff","scale":1.3}}`
- Effect: Orbit: 4 orbiting guardians: 50 on touch, ignite
- Grown over a frame of roots. Poison has nothing left to take from you, and four spores drift round you, poisoning what they touch.

**Runeplate Brigandine** `runeplate_armor` · UT
- Stats: +20 DEF, +60 HP, +3 ATT, +3 DEX
- Passive: `{"aegis":6}`
- Effect: Blocks one hit every 6s
- Rune-cut plates riveted to supple leather. The runes glow when you are hit.

**Runewarden's Brigandine** `runewarden_brigandine` · UT · UT, set: runewarden
- Stats: +18 DEF, +50 HP, +4 DEX
- Rune-stitched leather. The stitches tighten when danger is near.

**Sanguine Leathers** `sanguine_cloak` · UT
- Stats: +14 DEF, +80 HP, +4 SPD
- Passive: `{"lowregen":40}`
- Effect: Below 35% Life: regenerate 40/s
- Lined in red velvet that never dries. When you are low, it remembers what it has drunk.

**The Sea-Wolf's Oilskin** `the_sea_wolf` · UT
- Stats: +20 DEF, +80 HP, +4 ATT
- Passive: `{"rage":0.3,"killheal":15}`
- Effect: Up to +30% damage as your Life drops · Heal 15 on kill
- The longer the hunt, the hungrier it gets.

**The Silvered Duelcoat** `silvered_duelcoat` · UT
- Stats: +20 DEF, +8 DEX, +4 SPD
- Passive: `{"dodge":0.15,"crit":{"p":0.1,"x":2}}`
- Effect: 15% chance to dodge a hit · 10% chance for 2× damage
- Blows slide off its silvering and find nothing to hold.

**The Whaler's Slicker** `whalers_slicker` · UT
- Stats: +18 DEF, +60 HP, +4 SPD
- Passive: `{"dodge":0.12,"momentum":0.15}`
- Effect: 12% chance to dodge a hit · +15% damage while moving
- Tar-black and slippery. Things that grab at it find nothing to hold.

### robe (Priest, Summoner, Stormwright, Clockmaker, Hexweaver)

**Novice's Robe** `robe_t0` · T0
- Stats: +2 DEF, +12 MP, 0 WIS
- Scavenged from the wrack line of the Drowned Shore. Light cloth that keeps the mind clear and the mana flowing.

**Linen Robe** `robe_t1` · T1
- Stats: +3 DEF, +17 MP, +1 WIS
- Plain Nexus iron, hammered out by a smith who wanted to go home early. Embroidered with old charms against forgetting.

**Tidewoven Robe** `robe_t2` · T2
- Stats: +4 DEF, +22 MP, +1 WIS
- Pitted by salt and sea, but the edge has held. Not much use against swords. Very good against boredom.

**Bogmoss Robe** `robe_t3` · T3
- Stats: +5 DEF, +27 MP, +2 WIS
- Dredged from the bogs of Ashfen. It still smells of peat. Light cloth that keeps the mind clear and the mana flowing.

**Runeweave Robe** `robe_t4` · T4
- Stats: +5 DEF, +32 MP, +2 WIS
- Cut with Runeholt runes that hum faintly in the cold. Embroidered with old charms against forgetting.

**Ember Robe** `robe_t5` · T5
- Stats: +6 DEF, +37 MP, +3 WIS
- Forged over the ember-vents of Godfall, where the ground is always warm. Not much use against swords. Very good against boredom.

**Prismsilk Robe** `robe_t6` · T6
- Stats: +7 DEF, +42 MP, +3 WIS
- Fused from Saltglass Dune glass, harder than any steel. Light cloth that keeps the mind clear and the mana flowing.

**Gilded Vestments** `robe_t7` · T7
- Stats: +8 DEF, +47 MP, +4 WIS
- Gilded by the penitents of Godfall, who could not stop polishing it. Embroidered with old charms against forgetting.

**Hollow Shroud** `robe_t8` · T8
- Stats: +9 DEF, +52 MP, +4 WIS
- Hollowed by the Hollow Thanes. Something still echoes inside. Not much use against swords. Very good against boredom.

**Starweave Robe** `robe_t9` · T9
- Stats: +10 DEF, +57 MP, +5 WIS
- Tempered in the Emberforge, a forge that has never once gone cold. Light cloth that keeps the mind clear and the mana flowing.

**Godshard Raiment** `robe_t10` · T10
- Stats: +11 DEF, +62 MP, +5 WIS
- A splinter of the god himself. It is warm, and it is listening. Embroidered with old charms against forgetting.

**Robe of the Unstruck** `robe_t11` · T11
- Stats: +11 DEF, +67 MP, +6 WIS
- Woven from what the Unstruck God left behind. Nothing has ever pierced it. Not much use against swords. Very good against boredom.

**Clockwork Saint's Robe** `clockwork_robe` · UT · UT, set: clockwork
- Stats: +18 DEF, +100 MP, +5 DEX
- A thousand tiny gears, all turning the same way.

**Dawn-Choir Robe** `dawnchoir_robe` · UT · UT, set: dawnchoir
- Stats: +16 DEF, +120 MP, +8 WIS
- Still warm from the first light.

**Dewveil Robe** `dewveil_robe` · UT
- Stats: +7 DEF, +80 MP, +6 WIS
- Passive: `{"lowregen":30}`
- Effect: Below 35% Life: regenerate 30/s
- Pale green and always cool, like the morning on a melon patch.

**Embalmer's Wraps** `embalmers_wraps` · UT
- Stats: +8 DEF, +6 WIS, +40 HP
- Linen soaked in resin and old prayers. It does not breathe, and neither do you, quite.

**Frostweave Robe** `frostweave_armor` · UT
- Stats: +10 DEF, +8 WIS, +60 MP
- Passive: `{"nofreeze":true}`
- Woven from the lake's first ice. The cold can still reach you, but it can no longer hold you.

**Gravewarden's Shroud** `graverite_shroud` · UT · UT, set: graverite
- Stats: +15 DEF, +100 MP, +8 WIS
- Every thread was once a name.

**Harlequin Garb** `harlequin_garb` · UT
- Stats: +12 DEF, +8 DEX, +6 SPD
- Passive: `{"dodge":0.12}`
- Effect: 12% chance to dodge a hit
- Diamonds of every colour. It makes you very hard to hit, and impossible to miss.

**Heartstring Robe** `heartstring_vestment` · UT
- Stats: +24 DEF, +140 MP, +10 WIS
- Passive: `{"lowregen":45}`
- Effect: Below 35% Life: regenerate 45/s
- Woven from the cords that held the heart in place.

**Hexsilk Robe** `hexsilk_robe` · UT
- Stats: +12 DEF, +80 MP, +6 WIS, +2 ATT
- Passive: `{"manaonhit":2,"aura":{"dps":0,"r":3,"slow":0.25}}`
- Effect: Frost aura: slows enemies within 3 tiles · +2 Mana per hit
- Woven by the Lich's handmaidens from drowned spider-silk.

**Nebula Robe** `nebula_robe` · UT
- Stats: +11 DEF, +100 MP, +9 WIS
- Passive: `{"manaonhit":1,"aura":{"dps":30,"r":2.4,"slow":0.15}}`
- Effect: Aura: 30/s to enemies within 2.4 tiles, slowing them · +1 Mana per hit
- Woven from the dust between stars. Your gifts come cheaper, and the dust that trails you burns and slows whatever comes close.

**Prismglass Mantle** `prismglass_mantle` · UT
- Stats: +18 DEF, +90 MP, +6 WIS, +3 ATT
- Woven from light caught in the lighthouse lens. In the dark you can see it shine.

**Robe of the Circle** `hexcircle_robe` · UT · UT, set: hexcircle
- Stats: +11 DEF, +70 MP, +5 WIS
- Embroidered with a circle that never closes. Something is meant to step into it.

**Robe of the Last Curtain** `the_last_curtain` · UT
- Stats: +14 DEF, +60 MP, +4 WIS, +3 DEX
- Passive: `{"orbit":[{"kind":"body","n":1,"r":1.5,"w":2.4,"dmg":90,"sprite":"rx_shots/the_puppeteer.comedy_mask","scale":1.3,"block":{"n":1,"rest":2}},{"kind":"body","n":1,"r":1.5,"w":-2.4,"dmg":90,"sprite":"rx_shots/the_puppeteer.tragedy_mask","scale":1.3,"block":{"n":1,"rest":2}}]}`
- Effect: Orbit: 1 orbiting guardian: 90 on touch, block a shot (then rest 2s); 1 orbiting guardian: 90 on touch, block a shot (then rest 2s)
- Heavy velvet. Two masks dance round you, comedy and tragedy, and catch shots for you.

**Rose Window Vestment** `rose_window_vestment` · UT
- Stats: +15 DEF, +80 MP, +8 WIS
- Passive: `{"prism":{"every":4,"n":10,"dmg":120,"proj":"pj_dawnray"}}`
- Effect: Every 4s fires a ring of 10 shards
- Stitched from the Cathedral's stained glass, somehow still soft.

**Salt Widow's Veil** `salt_widows_veil` · UT
- Stats: +12 DEF, +8 WIS, +60 MP
- Passive: `{"manashield":0.25}`
- Effect: 25% of damage taken drains Mana instead
- Crusted white. It still smells of the sea she waited by.

**Storm-Woven Robe** `the_tempest_cloak` · UT
- Stats: +18 DEF, +80 MP, +6 DEX
- Passive: `{"manaonhit":2,"dodge":0.08}`
- Effect: 8% chance to dodge a hit · +2 Mana per hit
- It crackles when you move. Every blow you land feeds the charge.

**Tallow Vestment** `tallow_vestment` · UT
- Stats: +16 DEF, +100 MP, +6 WIS, +4 VIT
- Passive: `{"emberthorns":60}`
- Effect: When hit, ignites enemies around you (60/s)
- Wax-stiff and warm. Do not stand too close to a fire.

**Tempest Caller's Robe** `tempest_robe` · UT · UT, set: tempest
- Stats: +16 DEF, +110 MP, +4 ATT
- It crackles when you raise your arms.

**The Gearwright's Robe** `the_gearmail` · UT
- Stats: +22 DEF, +60 HP, +6 WIS
- Passive: `{"aegis":7,"manaonkill":6}`
- Effect: Blocks one hit every 7s · +6 Mana on kill
- A thousand tiny gears that turn one blow aside, then wind back up.

**The Gravewarden's Pall** `gravewardens_pall` · UT
- Stats: +15 DEF, +90 MP, +8 WIS
- Passive: `{"killheal":20,"manaonkill":8}`
- Effect: Heal 20 on kill · +8 Mana on kill
- Every grave you fill pays you back.

**The Mourner's Robe** `the_mourners_veil` · UT
- Stats: +16 DEF, +100 MP, +6 WIS, +4 VIT
- Passive: `{"manashield":0.2,"lowregen":30}`
- Effect: 20% of damage taken drains Mana instead · Below 35% Life: regenerate 30/s
- Grief wears thin. Then it wears you instead.

### godarmor

**Plate of the Source Code** `admin_aegis` · ADMIN · ADMIN, UT
- Stats: +9999 HP, +9999 MP, +999 DEF, +120 ATT, +60 SPD, +90 DEX, +300 VIT, +300 WIS
- Passive: `{"aura":{"dps":6000,"r":5,"slow":0.6},"aegis":0.5,"prism":{"every":0.6,"n":16,"dmg":6000,"proj":"pj_admin"}}`
- Effect: Aura: 6000/s to enemies within 5 tiles, slowing them · Every 0.6s fires a ring of 16 shards · Blocks one hit every 0.5s
- Read-only. Nothing can write to you.

## Rings (92)

### ring

**Rust Band of Attack** `ring_att_t0` · T0
- Stats: +1 ATT
- It makes every blow land a little heavier. A tin band, bent by hand.

**Rust Band of Defense** `ring_def_t0` · T0
- Stats: +1 DEF
- It turns a killing blow into a bruise, now and then. A tin band, bent by hand.

**Rust Band of Dexterity** `ring_dex_t0` · T0
- Stats: +1 DEX
- Your hands move before you have decided to. A tin band, bent by hand.

**Rust Band of Life** `ring_hp_t0` · T0
- Stats: +20 HP
- Its wearer is harder to kill, and knows it. A tin band, bent by hand.

**Rust Band of Mana** `ring_mp_t0` · T0
- Stats: +20 MP
- It hums when your mana runs low, and fills it a little. A tin band, bent by hand.

**Rust Band of Speed** `ring_spd_t0` · T0
- Stats: +1 SPD
- Your feet feel lighter the moment it slips on. A tin band, bent by hand.

**Rust Band of Vitality** `ring_vit_t0` · T0
- Stats: +1 VIT
- Cuts close a little faster while you wear it. A tin band, bent by hand.

**Rust Band of Wisdom** `ring_wis_t0` · T0
- Stats: +1 WIS
- It remembers spells you have forgotten. A tin band, bent by hand.

**Iron Band of Attack** `ring_att_t1` · T1
- Stats: +2 ATT
- It makes every blow land a little heavier. Iron, plain and honest.

**Iron Band of Defense** `ring_def_t1` · T1
- Stats: +2 DEF
- It turns a killing blow into a bruise, now and then. Iron, plain and honest.

**Iron Band of Dexterity** `ring_dex_t1` · T1
- Stats: +2 DEX
- Your hands move before you have decided to. Iron, plain and honest.

**Iron Band of Life** `ring_hp_t1` · T1
- Stats: +40 HP
- Its wearer is harder to kill, and knows it. Iron, plain and honest.

**Iron Band of Mana** `ring_mp_t1` · T1
- Stats: +40 MP
- It hums when your mana runs low, and fills it a little. Iron, plain and honest.

**Iron Band of Speed** `ring_spd_t1` · T1
- Stats: +2 SPD
- Your feet feel lighter the moment it slips on. Iron, plain and honest.

**Iron Band of Vitality** `ring_vit_t1` · T1
- Stats: +2 VIT
- Cuts close a little faster while you wear it. Iron, plain and honest.

**Iron Band of Wisdom** `ring_wis_t1` · T1
- Stats: +2 WIS
- It remembers spells you have forgotten. Iron, plain and honest.

**Bronze Band of Attack** `ring_att_t2` · T2
- Stats: +3 ATT
- It makes every blow land a little heavier. Bronze, warm to the touch.

**Bronze Band of Defense** `ring_def_t2` · T2
- Stats: +3 DEF
- It turns a killing blow into a bruise, now and then. Bronze, warm to the touch.

**Bronze Band of Dexterity** `ring_dex_t2` · T2
- Stats: +3 DEX
- Your hands move before you have decided to. Bronze, warm to the touch.

**Bronze Band of Life** `ring_hp_t2` · T2
- Stats: +60 HP
- Its wearer is harder to kill, and knows it. Bronze, warm to the touch.

**Bronze Band of Mana** `ring_mp_t2` · T2
- Stats: +60 MP
- It hums when your mana runs low, and fills it a little. Bronze, warm to the touch.

**Bronze Band of Speed** `ring_spd_t2` · T2
- Stats: +3 SPD
- Your feet feel lighter the moment it slips on. Bronze, warm to the touch.

**Bronze Band of Vitality** `ring_vit_t2` · T2
- Stats: +3 VIT
- Cuts close a little faster while you wear it. Bronze, warm to the touch.

**Bronze Band of Wisdom** `ring_wis_t2` · T2
- Stats: +3 WIS
- It remembers spells you have forgotten. Bronze, warm to the touch.

**Steel Band of Attack** `ring_att_t3` · T3
- Stats: +4 ATT
- It makes every blow land a little heavier. Steel, cold and certain.

**Steel Band of Defense** `ring_def_t3` · T3
- Stats: +4 DEF
- It turns a killing blow into a bruise, now and then. Steel, cold and certain.

**Steel Band of Dexterity** `ring_dex_t3` · T3
- Stats: +4 DEX
- Your hands move before you have decided to. Steel, cold and certain.

**Steel Band of Life** `ring_hp_t3` · T3
- Stats: +80 HP
- Its wearer is harder to kill, and knows it. Steel, cold and certain.

**Steel Band of Mana** `ring_mp_t3` · T3
- Stats: +80 MP
- It hums when your mana runs low, and fills it a little. Steel, cold and certain.

**Steel Band of Speed** `ring_spd_t3` · T3
- Stats: +4 SPD
- Your feet feel lighter the moment it slips on. Steel, cold and certain.

**Steel Band of Vitality** `ring_vit_t3` · T3
- Stats: +4 VIT
- Cuts close a little faster while you wear it. Steel, cold and certain.

**Steel Band of Wisdom** `ring_wis_t3` · T3
- Stats: +4 WIS
- It remembers spells you have forgotten. Steel, cold and certain.

**Verdigris Band of Attack** `ring_att_t4` · T4
- Stats: +5 ATT
- It makes every blow land a little heavier. Verdigris-green and very old.

**Verdigris Band of Defense** `ring_def_t4` · T4
- Stats: +5 DEF
- It turns a killing blow into a bruise, now and then. Verdigris-green and very old.

**Verdigris Band of Dexterity** `ring_dex_t4` · T4
- Stats: +5 DEX
- Your hands move before you have decided to. Verdigris-green and very old.

**Verdigris Band of Life** `ring_hp_t4` · T4
- Stats: +100 HP
- Its wearer is harder to kill, and knows it. Verdigris-green and very old.

**Verdigris Band of Mana** `ring_mp_t4` · T4
- Stats: +100 MP
- It hums when your mana runs low, and fills it a little. Verdigris-green and very old.

**Verdigris Band of Speed** `ring_spd_t4` · T4
- Stats: +5 SPD
- Your feet feel lighter the moment it slips on. Verdigris-green and very old.

**Verdigris Band of Vitality** `ring_vit_t4` · T4
- Stats: +5 VIT
- Cuts close a little faster while you wear it. Verdigris-green and very old.

**Verdigris Band of Wisdom** `ring_wis_t4` · T4
- Stats: +5 WIS
- It remembers spells you have forgotten. Verdigris-green and very old.

**Cobalt Band of Attack** `ring_att_t5` · T5
- Stats: +6 ATT
- It makes every blow land a little heavier. Cobalt, blue as deep water.

**Cobalt Band of Defense** `ring_def_t5` · T5
- Stats: +6 DEF
- It turns a killing blow into a bruise, now and then. Cobalt, blue as deep water.

**Cobalt Band of Dexterity** `ring_dex_t5` · T5
- Stats: +6 DEX
- Your hands move before you have decided to. Cobalt, blue as deep water.

**Cobalt Band of Life** `ring_hp_t5` · T5
- Stats: +120 HP
- Its wearer is harder to kill, and knows it. Cobalt, blue as deep water.

**Cobalt Band of Mana** `ring_mp_t5` · T5
- Stats: +120 MP
- It hums when your mana runs low, and fills it a little. Cobalt, blue as deep water.

**Cobalt Band of Speed** `ring_spd_t5` · T5
- Stats: +6 SPD
- Your feet feel lighter the moment it slips on. Cobalt, blue as deep water.

**Cobalt Band of Vitality** `ring_vit_t5` · T5
- Stats: +6 VIT
- Cuts close a little faster while you wear it. Cobalt, blue as deep water.

**Cobalt Band of Wisdom** `ring_wis_t5` · T5
- Stats: +6 WIS
- It remembers spells you have forgotten. Cobalt, blue as deep water.

**Abyssal Pearl** `abyssal_pearl` · UT
- Stats: +80 HP, +80 MP, +6 WIS
- Black as the water it came up from. It is warm, which is wrong.

**Antler Crown** `antler_crown` · UT
- Stats: +5 ATT, +5 DEF
- Passive: `{"execute":0.5}`
- Effect: +50% damage to enemies under 30% Life
- Cut from the Hush. It makes no sound when you wear it, either.

**Astral Signet** `astral_signet` · UT
- Stats: +7 DEX, +7 WIS, +40 MP
- Passive: `{"orbit":{"kind":"body","n":2,"r":1.4,"w":3,"dmg":80,"sprite":"ap_shots/astrolabe_sentinel.astro_disc","scale":1.2,"block":{"n":1,"rest":3}}}`
- Effect: Orbit: 2 orbiting guardians: 80 on touch, block a shot (then rest 3s)
- Its face is a tiny orrery. Two brass moons leave it and circle you, turning shots aside.

**Band of the Fallen Crown** `crown_of_the_fallen` · UT
- Stats: +8 ATT, +8 DEF, +80 HP, +80 MP
- Passive: `{"crit":{"p":0.18,"x":2},"execute":0.35,"orbit":{"kind":"body","n":3,"r":1.5,"w":3.2,"dmg":110,"heal":4,"sprite":"rx_shots/fallen_heart.heart_shard","scale":1.3}}`
- Effect: Orbit: 3 orbiting guardians: 110 on touch, heal you 4 a bite · +35% damage to enemies under 30% Life · 18% chance for 2× damage
- A ring cut from the crown of a god that fell. Shards of its heart circle you; each one they cut mends you a little.

**Band of the Open Hand** `band_of_the_open_hand` · UT · MYTHIC, UT
- Stats: +8 DEX, +4 SPD
- Passive: `{"crit":{"p":0.1,"x":2},"critheal":8}`
- Effect: Critical hits heal 40 Life and restore 16 Mana · 10% chance for 2× damage
- Strike true and be made whole. Critical hits heal you and restore mana.

**Band of the Unstruck Crown** `crown_of_the_unstruck` · UT · MYTHIC, UT
- Stats: +80 HP, +80 MP, +6 ATT, +6 DEF, +6 SPD, +6 DEX, +6 VIT, +6 WIS
- Passive: `{"aegis":5,"kintsugi":0.25,"orbit":{"kind":"body","n":4,"r":1.9,"w":2.6,"dmg":220,"sprite":"rx_shots/the_unstruck_god.orbit_mote","scale":1.5,"block":{"n":1,"rest":2}}}`
- Effect: Orbit: 4 orbiting guardians: 220 on touch, block a shot (then rest 2s) · After you are hit: +25% damage for 3s · Blocks one hit every 5s
- The crown, beaten into a ring. Four gilded motes keep their orbit round you, and nothing gets through them twice.

**Bell of the Taken** `bell_of_the_taken` · UT
- Stats: +10 DEF, +5 VIT
- Passive: `{"killburst":0.4}`
- Effect: Kills explode into shrapnel
- A clapper from an alarm bell nobody answered.

**Dewdrop Ring** `dewdrop_ring` · UT
- Stats: +60 MP, +6 WIS, +3 VIT
- One bead of honeydew, set in silver and never quite dry.

**Emberheart Ring** `emberheart_ring` · UT
- Stats: +6 ATT, +3 DEF
- Passive: `{"burnbonus":0.25,"emberthorns":50,"orbit":{"kind":"body","n":3,"r":1.6,"w":2.8,"dmg":130,"burn":70,"sprite":"bx_shots/forgeheart_colossus.magma_orb","scale":1.2}}`
- Effect: Orbit: 3 orbiting guardians: 130 on touch, ignite · When hit, ignites enemies around you (50/s) · +25% damage to burning enemies
- A coal that never cools, set in a ring. Three magma orbs circle you and set alight whatever they touch.

**Emily's Knitted Scarf** `emilys_scarf` · UT
- Stats: +60 HP, +6 SPD, +4 VIT
- Passive: `{"dodge":0.06,"lowregen":25}`
- Effect: 6% chance to dodge a hit · Below 35% Life: regenerate 25/s
- Pink, warm, and still talking. It will not stop telling you about its day.

**Event Horizon Ring** `event_horizon` · UT · LEGENDARY, UT
- Stats: +8 ATT, +90 HP
- Passive: `{"crit":{"p":0.12,"x":2.5},"momentum":0.1,"orbit":{"kind":"hole","n":1,"r":2.1,"w":1.4,"dmg":120,"pull":2.4,"block":{"n":5,"rest":5}}}`
- Effect: Orbit: a black hole: 120 on touch, swallow up to 5 shots (then rest 5s), drag monsters in · +10% damage while moving · 12% chance for 2.5× damage
- What is left of the machine's heart. A black hole circles you, swallowing shots and dragging monsters in. Keep moving, and you hit harder.

**Honeyguard Band** `honeyguard_band` · UT
- Stats: +60 HP, +4 VIT, +2 DEF
- Passive: `{"orbit":{"kind":"body","n":4,"r":1.4,"w":3.6,"dmg":70,"slow":0.2,"sprite":"rx_shots/honey_queen.drone","scale":1.2}}`
- Effect: Orbit: 4 orbiting guardians: 70 on touch, slow
- Wax and gold. Four bees guard you, stinging what comes close and slowing it with honey.

**Nightlight Ring** `nightlight_ring` · UT
- Stats: +100 HP, +60 MP, +5 WIS, +3 DEF
- Passive: `{"orbit":{"kind":"body","n":1,"r":1.5,"w":2,"dmg":90,"slow":0.4,"sprite":"rx_shots/lullaby_moth.lullaby_moon","scale":1.6,"block":{"n":1,"rest":2}}}`
- Effect: Orbit: 1 orbiting guardian: 90 on touch, block a shot (then rest 2s), slow
- A little moon in a ring. It circles you, catches a shot now and then, and lulls what it touches.

**Pearl of the Drowned Mass** `pearl_of_the_drowned_mass` · UT
- Stats: +100 HP, +6 WIS, +4 VIT
- Passive: `{"killheal":25}`
- Effect: Heal 25 on kill
- The bell's clapper, grown over with nacre.

**Pilgrim's Pearl** `pilgrims_pearl` · UT
- Stats: +60 HP, +5 WIS
- Passive: `{"manaonkill":4}`
- Effect: +4 Mana on kill
- The light a drowned pilgrim carried in their shell.

**Ring of Rot** `ring_of_rot` · UT
- Stats: +5 ATT, +70 HP
- A band of soft black wood. It is always slightly damp.

**Ring of Still Waters** `ring_of_still_waters` · UT · MYTHIC, UT
- Stats: +6 DEF, +60 MP
- Passive: `{"slowbonus":0.3,"aura":{"dps":0,"r":3,"slow":0.3}}`
- Effect: Frost aura: slows enemies within 3 tiles · +30% damage to slowed enemies
- A drop of a lake that never moved. Everything near you slows, and the slowed take more damage.

**Ring of the Aurora Heart** `aurora_heart` · UT · LEGENDARY, UT
- Stats: +30 HP, +30 MP, +3 ATT, +3 DEF, +3 SPD, +3 DEX, +3 VIT, +3 WIS
- Passive: `{"noslow":true}`
- The light that moved inside the wyrm's chest, set in a ring. Nothing can slow you while it is yours.

**Ring of the Drowned Bell** `drowned_bell` · UT
- Stats: +6 WIS, +60 MP
- Passive: `{"manaonhit":1,"orbit":{"kind":"body","n":1,"r":1.6,"w":2,"dmg":60,"sprite":"rx_shots/bog_bellringer.little_bell","scale":1.5,"fire":{"every":2.5,"n":3,"proj":"rx_shots/drowned_abbot.holy_droplet","dmg":110,"speed":9,"range":6}}}`
- Effect: Orbit: 1 orbiting guardian: 60 on touch, throw a shot every 2.5s · +1 Mana per hit
- A bell on a band, still ringing underwater. It circles you and tolls, throwing holy water at whatever is nearest.

**Ring of the First Flame** `ring_of_the_first_flame` · UT · MYTHIC, UT
- Stats: +6 ATT, +60 HP
- Passive: `{"burnbonus":0.3,"emberthorns":40}`
- Effect: When hit, ignites enemies around you (40/s) · +30% damage to burning enemies
- The fire that lit the forge of the gods. Anything already burning takes more from you.

**Ring of the Jester** `ring_of_the_jester` · UT
- Stats: +4 ATT, +6 DEX, +4 SPD
- Passive: `{"crit":{"p":0.1,"x":2},"orbit":{"kind":"body","n":3,"r":1.5,"w":4,"dmg":70,"sprite":"bx2_shots/grinning_ringmaster.juggling_pin","scale":1.2,"fire":{"every":1.6,"proj":"bx2_shots/grinning_ringmaster.juggling_pin","dmg":130,"speed":11,"range":6.5}}}`
- Effect: Orbit: 3 orbiting guardians: 70 on touch, throw a shot every 1.6s · 10% chance for 2× damage
- It jingles. Three juggling pins circle you, and every so often one is thrown at whatever is nearest.

**Ring of the Rind** `ring_of_the_rind` · UT
- Stats: +80 HP, +4 DEF
- A green band with a stripe of red inside, like a slice held up to the light.

**Ring of the Seventh Colour** `the_seventh_colour` · UT
- Stats: +5 ATT, +5 DEX, +3 SPD, +3 WIS
- Passive: `{"orbit":{"kind":"body","n":7,"r":1.8,"w":1.8,"dmg":50,"sprite":"rx_shots/prism_wyrm.facet_star","scale":1,"fire":{"every":2,"proj":"rx_shots/prism_wyrm.prism_shard","dmg":120,"speed":12,"range":6}}}`
- Effect: Orbit: 7 orbiting guardians: 50 on touch, throw a shot every 2s
- Seven colours circle you, and every two seconds each throws its shard at whatever is nearest.

**Ring of the Undertow** `ring_of_the_undertow` · UT
- Stats: +5 SPD, +5 DEX
- Passive: `{"momentum":0.15}`
- Effect: +15% damage while moving
- It pulls you forward. So do your blows.

**Ring of the Wyrm** `ring_of_the_wyrm` · UT
- Stats: +90 HP, +6 DEF, +5 VIT
- Passive: `{"orbit":{"kind":"body","n":3,"r":1.6,"w":2.2,"dmg":90,"slow":0.3,"sprite":"bx_shots/glacius_frozen_wyrm.ice_lance","scale":1.1,"block":{"n":1,"rest":3}}}`
- Effect: Orbit: 3 orbiting guardians: 90 on touch, block a shot (then rest 3s), slow
- A scale from its coil, bent into a band. Three ice lances circle you; what they touch is chilled, and they turn shots aside.

**Ring of Tides** `ring_of_tides` · UT
- Stats: +80 HP, +5 WIS, +3 VIT
- Passive: `{"lowregen":35,"orbit":{"kind":"body","n":3,"r":1.7,"w":-2.2,"dmg":100,"sprite":"bx_shots/tidebound_lich.lost_soul","scale":1.3,"block":{"n":1,"rest":2.5}}}`
- Effect: Orbit: 3 orbiting guardians: 100 on touch, block a shot (then rest 2.5s) · Below 35% Life: regenerate 35/s
- Cold, and always wet. Three lost souls circle you and take the shots meant for you.

**Scarab Ring** `scarab_ring` · UT
- Stats: +5 DEX, +5 SPD
- Passive: `{"orbit":{"kind":"body","n":2,"r":1.3,"w":3.4,"dmg":140,"sprite":"bx_shots/gilded_sphinx.cursed_scarab","scale":1.3,"block":{"n":1,"rest":2.5}}}`
- Effect: Orbit: 2 orbiting guardians: 140 on touch, block a shot (then rest 2.5s)
- A beetle of blue faience. Two cursed scarabs climb off it and circle you, biting what comes close and catching shots.

**Seed of Renewal** `seed_of_renewal` · UT
- Stats: +100 HP, +8 VIT
- Passive: `{"lowregen":40}`
- Effect: Below 35% Life: regenerate 40/s
- Plant it in yourself. When you are cut down low, it grows.

**Shard of the First Star** `shard_of_the_first_star` · UT · MYTHIC, UT
- Stats: +60 HP, +60 MP, +4 ATT, +4 DEF, +4 SPD, +4 DEX, +4 VIT, +4 WIS
- Passive: `{"crit":{"p":0.15,"x":2},"killheal":30,"momentum":0.1}`
- Effect: +10% damage while moving · Heal 30 on kill · 15% chance for 2× damage
- Older than the realm. Older than the god that made it.

**Signet of the Count** `signet_of_the_count` · UT
- Stats: +6 ATT, +6 VIT
- Passive: `{"orbit":{"kind":"body","n":3,"r":1.6,"w":3,"dmg":90,"heal":5,"sprite":"bx2_shots/count_vesper.bat_swarm","scale":1.2}}`
- Effect: Orbit: 3 orbiting guardians: 90 on touch, heal you 5 a bite
- His crest in garnet: a bat over a crown. Three bats circle you; every bite feeds you.

**The Bellringer's Rope** `bellringers_rope` · UT
- Stats: +80 HP, +6 DEF, +6 VIT
- Passive: `{"killburst":0.6}`
- Effect: Kills explode into shrapnel
- Worn smooth by a thousand peals for the drowned.

**The Blight Heart** `blight_heart` · UT · LEGENDARY, UT
- Stats: +7 ATT, +5 DEX
- Passive: `{"killburst":0.5}`
- Effect: Kills explode into shrapnel
- The rot at the middle of the oldest tree. Everything you kill bursts into thorns.

**The Conductor's Band** `the_conductors_band` · UT · MYTHIC, UT
- Stats: +4 ATT, +4 DEF, +4 DEX, +4 WIS
- Passive: `{"setbonus":1}`
- Effect: Counts as one more piece of every set you wear
- It keeps every piece of a set in time. Counts as one more piece of each set you are wearing.

**The Glowcap Ring** `glowcap_crown` · UT · LEGENDARY, UT
- Stats: +80 HP, +6 WIS, +6 VIT
- Passive: `{"killheal":40,"lowregen":30}`
- Effect: Below 35% Life: regenerate 30/s · Heal 40 on kill
- A ring of glowing caps. Whatever dies near you feeds it, and it feeds you.

**The Golden Honeydew** `golden_honeydew` · UT
- Stats: +100 HP, +80 MP, +8 VIT, +8 WIS
- Passive: `{"killheal":30,"lowregen":30}`
- Effect: Below 35% Life: regenerate 30/s · Heal 30 on kill
- One in a hundred melons grows one. It hums when you are hurt, and mends you when something dies.

**The Gravedust Band** `gravedust_band` · UT
- Stats: +4 ATT, +4 VIT
- Passive: `{"killburst":0.5}`
- Effect: Kills explode into shrapnel
- The dead you make burst into grave-dust and shrapnel.

**The Grinning Ring** `grinning_mask` · UT · LEGENDARY, UT
- Stats: +8 ATT, +8 DEX
- Passive: `{"crit":{"p":0.12,"x":3}}`
- Effect: 12% chance for 3× damage
- A ring with a grinning face. When you land a lucky blow, it laughs, and the blow lands three times over.

**The Kintsugi Band** `kintsugi_band` · UT
- Stats: +6 ATT, +6 DEF, +40 HP
- Passive: `{"cheatdeath":60}`
- Effect: Cheat death: a lethal blow leaves you at 40% Life (every 60s)
- Broken, and mended with gold. Stronger at the seam.

**The Leviathan Eye** `leviathan_eye` · UT · LEGENDARY, UT
- Stats: +6 ATT, +6 DEX, +60 HP
- Passive: `{"crit":{"p":0.15,"x":2},"manaonhit":1}`
- Effect: +1 Mana per hit · 15% chance for 2× damage
- It still looks. Whatever it looks at, your shots find the soft part of.

**The Pharaoh's Signet** `pharaohs_deathmask` · UT · LEGENDARY, UT
- Stats: +20 HP, +20 MP, +2 ATT, +2 DEF, +2 SPD, +2 DEX, +2 VIT, +2 WIS
- Passive: `{"killheal":35}`
- Effect: Heal 35 on kill
- A gold ring with a dead king's face on it. Every death you cause, it drinks, and shares.

**The Rubber Duck** `rubber_duck` · UT
- Stats: +8 SPD, +4 DEX, +4 VIT
- Passive: `{"dodge":0.08,"killburst":0.3}`
- Effect: 8% chance to dodge a hit · Kills explode into shrapnel
- Squeak.

**The Starless Band** `starless_band` · UT
- Stats: +8 DEX, +6 SPD
- Passive: `{"crit":{"p":0.12,"x":2},"orbit":{"kind":"body","n":4,"r":1.7,"w":-2.4,"dmg":70,"sprite":"el_shots/void_seer.rift_star","scale":1.2,"block":{"n":1,"rest":3}}}`
- Effect: Orbit: 4 orbiting guardians: 70 on touch, block a shot (then rest 3s) · 12% chance for 2× damage
- A ring of night with no stars in it. Four dark stars orbit you and blot out shots.

**Trap-Hound's Collar** `trap_hound_collar` · UT
- Stats: +6 SPD, +4 DEX
- Passive: `{"momentum":0.12}`
- Effect: +12% damage while moving
- Rope, a bell, and something it caught that never got out.

### godring

**The Root Ring** `admin_band` · ADMIN · ADMIN, UT
- Stats: +200 ATT, +120 DEX, +40 SPD, +2000 HP, +2000 MP
- Passive: `{"crit":{"p":1,"x":3},"killheal":9999,"manaonkill":9999,"killburst":3}`
- Effect: Heal 9999 on kill · +9999 Mana on kill · Kills explode into shrapnel · 100% chance for 3× damage
- sudo.

## Consumables (88)

### potion

- **A Pond Fish** `river_fish` use: `{"heal":250,"mana":80}` — Still flapping. Restores 250 Life and 80 Mana.
- **A Suspicious Box** `mystery_box` use: `{"mystery":true}` — It rattles. Something inside is giggling.
- **Draught of Embers** `pot_hp` use: `{"heal":120}` — Restores 120 Life.
- **Draught of Tides** `pot_mp` use: `{"mana":120}` — Restores 120 Mana.
- **Heartstone Tincture** `stat_hp` use: `{"stat":"hp"}` — Permanently raises Life by 5, up to your class maximum.
- **The Golden Carp** `golden_carp` use: `{"carp":true}` — Eat it and gain +1 to every stat (up to your class maximum). The cat is watching you.
- **Tincture of Gales** `stat_spd` use: `{"stat":"spd"}` — Permanently raises Speed by 1, up to your class maximum.
- **Tincture of Hands** `stat_dex` use: `{"stat":"dex"}` — Permanently raises Dexterity by 1, up to your class maximum.
- **Tincture of Iron** `stat_def` use: `{"stat":"def"}` — Permanently raises Defense by 1, up to your class maximum.
- **Tincture of Marrow** `stat_vit` use: `{"stat":"vit"}` — Permanently raises Vitality by 1, up to your class maximum.
- **Tincture of Runes** `stat_wis` use: `{"stat":"wis"}` — Permanently raises Wisdom by 1, up to your class maximum.
- **Tincture of Wrath** `stat_att` use: `{"stat":"att"}` — Permanently raises Attack by 1, up to your class maximum.
- **Watermelon Slice** `watermelon_slice` use: `{"heal":40,"regen":{"hp":200,"t":5}}` — Restores 40 Life at once, then 200 more over 5 seconds. Spit the seeds.
- **Wellspring Tincture** `stat_mp` use: `{"stat":"mp"}` — Permanently raises Mana by 5, up to your class maximum.

### egg

- **Azure Pet Egg** `pet_egg_rare` use: `{"egg":"rare"}` — Cool to the touch and faintly glowing. It hums when you hold it close.
- **Common Aquatic Egg** `egg_aquatic_common` use: `{"egg":"common","family":"aquatic"}` — It sloshes when you shake it. Something in there is already swimming. Use it to hatch an aquatic pet.
- **Common Automaton Egg** `egg_automaton_common` use: `{"egg":"common","family":"automaton"}` — It ticks. Somewhere inside, a very small spring is being wound. Use it to hatch an automaton pet.
- **Common Avian Egg** `egg_avian_common` use: `{"egg":"common","family":"avian"}` — Speckled like a sparrow's. Every so often it chirps. Use it to hatch an avian pet.
- **Common Canine Egg** `egg_canine_common` use: `{"egg":"common","family":"canine"}` — Warm, and it thumps now and then, like a tail against the shell. Use it to hatch a canine pet.
- **Common Exotic Egg** `egg_exotic_common` use: `{"egg":"common","family":"exotic"}` — Nobody agrees on what lays these. Whatever is inside is something else. Use it to hatch an exotic pet.
- **Common Feline Egg** `egg_feline_common` use: `{"egg":"common","family":"feline"}` — It rolls off any table you put it on. On purpose, you suspect. Use it to hatch a feline pet.
- **Common Insect Egg** `egg_insect_common` use: `{"egg":"common","family":"insect"}` — It buzzes. Hold it to your ear and it buzzes louder. Use it to hatch an insect pet.
- **Common Reptile Egg** `egg_reptile_common` use: `{"egg":"common","family":"reptile"}` — Leathery and patient. It has been waiting a long time and can wait longer. Use it to hatch a reptile pet.
- **Common Spooky Egg** `egg_spooky_common` use: `{"egg":"common","family":"spooky"}` — Cold, and lighter than an egg should be. It glows a little in the dark. Use it to hatch a spooky pet.
- **Common Woodland Egg** `egg_woodland_common` use: `{"egg":"common","family":"woodland"}` — It smells of moss and rain. A leaf is stuck to it that won't come off. Use it to hatch a woodland pet.
- **Divine Aquatic Egg** `egg_aquatic_divine` use: `{"egg":"divine","family":"aquatic"}` — It sloshes when you shake it. Something in there is already swimming. Use it to hatch an aquatic pet.
- **Divine Automaton Egg** `egg_automaton_divine` use: `{"egg":"divine","family":"automaton"}` — It ticks. Somewhere inside, a very small spring is being wound. Use it to hatch an automaton pet.
- **Divine Avian Egg** `egg_avian_divine` use: `{"egg":"divine","family":"avian"}` — Speckled like a sparrow's. Every so often it chirps. Use it to hatch an avian pet.
- **Divine Canine Egg** `egg_canine_divine` use: `{"egg":"divine","family":"canine"}` — Warm, and it thumps now and then, like a tail against the shell. Use it to hatch a canine pet.
- **Divine Exotic Egg** `egg_exotic_divine` use: `{"egg":"divine","family":"exotic"}` — Nobody agrees on what lays these. Whatever is inside is something else. Use it to hatch an exotic pet.
- **Divine Feline Egg** `egg_feline_divine` use: `{"egg":"divine","family":"feline"}` — It rolls off any table you put it on. On purpose, you suspect. Use it to hatch a feline pet.
- **Divine Insect Egg** `egg_insect_divine` use: `{"egg":"divine","family":"insect"}` — It buzzes. Hold it to your ear and it buzzes louder. Use it to hatch an insect pet.
- **Divine Reptile Egg** `egg_reptile_divine` use: `{"egg":"divine","family":"reptile"}` — Leathery and patient. It has been waiting a long time and can wait longer. Use it to hatch a reptile pet.
- **Divine Spooky Egg** `egg_spooky_divine` use: `{"egg":"divine","family":"spooky"}` — Cold, and lighter than an egg should be. It glows a little in the dark. Use it to hatch a spooky pet.
- **Divine Woodland Egg** `egg_woodland_divine` use: `{"egg":"divine","family":"woodland"}` — It smells of moss and rain. A leaf is stuck to it that won't come off. Use it to hatch a woodland pet.
- **Gilded Pet Egg** `pet_egg_legendary` use: `{"egg":"legendary"}` — It shines like a coin and beats like a heart. Legends hatch from eggs like this.
- **Legendary Aquatic Egg** `egg_aquatic_legendary` use: `{"egg":"legendary","family":"aquatic"}` — It sloshes when you shake it. Something in there is already swimming. Use it to hatch an aquatic pet.
- **Legendary Automaton Egg** `egg_automaton_legendary` use: `{"egg":"legendary","family":"automaton"}` — It ticks. Somewhere inside, a very small spring is being wound. Use it to hatch an automaton pet.
- **Legendary Avian Egg** `egg_avian_legendary` use: `{"egg":"legendary","family":"avian"}` — Speckled like a sparrow's. Every so often it chirps. Use it to hatch an avian pet.
- **Legendary Canine Egg** `egg_canine_legendary` use: `{"egg":"legendary","family":"canine"}` — Warm, and it thumps now and then, like a tail against the shell. Use it to hatch a canine pet.
- **Legendary Exotic Egg** `egg_exotic_legendary` use: `{"egg":"legendary","family":"exotic"}` — Nobody agrees on what lays these. Whatever is inside is something else. Use it to hatch an exotic pet.
- **Legendary Feline Egg** `egg_feline_legendary` use: `{"egg":"legendary","family":"feline"}` — It rolls off any table you put it on. On purpose, you suspect. Use it to hatch a feline pet.
- **Legendary Insect Egg** `egg_insect_legendary` use: `{"egg":"legendary","family":"insect"}` — It buzzes. Hold it to your ear and it buzzes louder. Use it to hatch an insect pet.
- **Legendary Reptile Egg** `egg_reptile_legendary` use: `{"egg":"legendary","family":"reptile"}` — Leathery and patient. It has been waiting a long time and can wait longer. Use it to hatch a reptile pet.
- **Legendary Spooky Egg** `egg_spooky_legendary` use: `{"egg":"legendary","family":"spooky"}` — Cold, and lighter than an egg should be. It glows a little in the dark. Use it to hatch a spooky pet.
- **Legendary Woodland Egg** `egg_woodland_legendary` use: `{"egg":"legendary","family":"woodland"}` — It smells of moss and rain. A leaf is stuck to it that won't come off. Use it to hatch a woodland pet.
- **Mossy Pet Egg** `pet_egg_uncommon` use: `{"egg":"uncommon"}` — Green-speckled and heavier than it looks. Whatever is inside is growing fast.
- **Rare Aquatic Egg** `egg_aquatic_rare` use: `{"egg":"rare","family":"aquatic"}` — It sloshes when you shake it. Something in there is already swimming. Use it to hatch an aquatic pet.
- **Rare Automaton Egg** `egg_automaton_rare` use: `{"egg":"rare","family":"automaton"}` — It ticks. Somewhere inside, a very small spring is being wound. Use it to hatch an automaton pet.
- **Rare Avian Egg** `egg_avian_rare` use: `{"egg":"rare","family":"avian"}` — Speckled like a sparrow's. Every so often it chirps. Use it to hatch an avian pet.
- **Rare Canine Egg** `egg_canine_rare` use: `{"egg":"rare","family":"canine"}` — Warm, and it thumps now and then, like a tail against the shell. Use it to hatch a canine pet.
- **Rare Exotic Egg** `egg_exotic_rare` use: `{"egg":"rare","family":"exotic"}` — Nobody agrees on what lays these. Whatever is inside is something else. Use it to hatch an exotic pet.
- **Rare Feline Egg** `egg_feline_rare` use: `{"egg":"rare","family":"feline"}` — It rolls off any table you put it on. On purpose, you suspect. Use it to hatch a feline pet.
- **Rare Insect Egg** `egg_insect_rare` use: `{"egg":"rare","family":"insect"}` — It buzzes. Hold it to your ear and it buzzes louder. Use it to hatch an insect pet.
- **Rare Reptile Egg** `egg_reptile_rare` use: `{"egg":"rare","family":"reptile"}` — Leathery and patient. It has been waiting a long time and can wait longer. Use it to hatch a reptile pet.
- **Rare Spooky Egg** `egg_spooky_rare` use: `{"egg":"rare","family":"spooky"}` — Cold, and lighter than an egg should be. It glows a little in the dark. Use it to hatch a spooky pet.
- **Rare Woodland Egg** `egg_woodland_rare` use: `{"egg":"rare","family":"woodland"}` — It smells of moss and rain. A leaf is stuck to it that won't come off. Use it to hatch a woodland pet.
- **Speckled Pet Egg** `pet_egg_common` use: `{"egg":"common"}` — Warm, and wobbling now and then. Something small and friendly is in there.
- **Uncommon Aquatic Egg** `egg_aquatic_uncommon` use: `{"egg":"uncommon","family":"aquatic"}` — It sloshes when you shake it. Something in there is already swimming. Use it to hatch an aquatic pet.
- **Uncommon Automaton Egg** `egg_automaton_uncommon` use: `{"egg":"uncommon","family":"automaton"}` — It ticks. Somewhere inside, a very small spring is being wound. Use it to hatch an automaton pet.
- **Uncommon Avian Egg** `egg_avian_uncommon` use: `{"egg":"uncommon","family":"avian"}` — Speckled like a sparrow's. Every so often it chirps. Use it to hatch an avian pet.
- **Uncommon Canine Egg** `egg_canine_uncommon` use: `{"egg":"uncommon","family":"canine"}` — Warm, and it thumps now and then, like a tail against the shell. Use it to hatch a canine pet.
- **Uncommon Exotic Egg** `egg_exotic_uncommon` use: `{"egg":"uncommon","family":"exotic"}` — Nobody agrees on what lays these. Whatever is inside is something else. Use it to hatch an exotic pet.
- **Uncommon Feline Egg** `egg_feline_uncommon` use: `{"egg":"uncommon","family":"feline"}` — It rolls off any table you put it on. On purpose, you suspect. Use it to hatch a feline pet.
- **Uncommon Insect Egg** `egg_insect_uncommon` use: `{"egg":"uncommon","family":"insect"}` — It buzzes. Hold it to your ear and it buzzes louder. Use it to hatch an insect pet.
- **Uncommon Reptile Egg** `egg_reptile_uncommon` use: `{"egg":"uncommon","family":"reptile"}` — Leathery and patient. It has been waiting a long time and can wait longer. Use it to hatch a reptile pet.
- **Uncommon Spooky Egg** `egg_spooky_uncommon` use: `{"egg":"uncommon","family":"spooky"}` — Cold, and lighter than an egg should be. It glows a little in the dark. Use it to hatch a spooky pet.
- **Uncommon Woodland Egg** `egg_woodland_uncommon` use: `{"egg":"uncommon","family":"woodland"}` — It smells of moss and rain. A leaf is stuck to it that won't come off. Use it to hatch a woodland pet.

### key

- **Astral Key** `key_astral` use: `{"key":"astral"}` — Brass and starlight. It ticks. Use it outside a dungeon to open a portal there.
- **Crimson Key** `key_keep` use: `{"key":"keep"}` — Iron, warm, and slightly sticky. Don't ask. Use it outside a dungeon to open a portal there.
- **Drowned Forge Key** `key_forge` use: `{"key":"forge"}` — Still hot from the forge, centuries after the fires went out. Use it outside a dungeon to open a portal there.
- **Emberforge Key** `key_ember` use: `{"key":"ember"}` — Its teeth glow orange. Hold it by the bow. Use it outside a dungeon to open a portal there.
- **Frostveil Key** `key_frostveil` use: `{"key":"frostveil"}` — Cut from clear ice. It does not melt in your hand, which is worse. Use it outside a dungeon to open a portal there.
- **Hollowmoon Ticket** `key_hollowmoon` use: `{"key":"hollowmoon"}` — ADMIT ONE. The moon on it is grinning. Use it outside a dungeon to open a portal there.
- **Honeyed Hollow Key** `key_hive` use: `{"key":"hive"}` — A key of hardened wax, sticky at the teeth. It smells of clover. Use it outside a dungeon to open a portal there.
- **Key of Dreams** `key_dream` use: `{"key":"dream"}` — You are not sure you are holding it. You are not sure you are awake. Use it outside a dungeon to open a portal there.
- **Key to the Heart** `key_heart` use: `{"key":"heart"}` — It beats faintly in your palm, in time with something very large. Use it outside a dungeon to open a portal there.
- **Key to the Throne** `key_throne` use: `{"key":"throne"}` — Pale gold and cold as a promise. The god is expecting you. Use it outside a dungeon to open a portal there.
- **Lighthouse Key** `key_spire` use: `{"key":"spire"}` — Clear glass, and somehow it throws a rainbow on your palm. Use it outside a dungeon to open a portal there.
- **Mirerot Key** `key_mirerot` use: `{"key":"mirerot"}` — Grown, not forged. It is slightly warm and very slightly alive. Use it outside a dungeon to open a portal there.
- **Sandscour Key** `key_sandscour` use: `{"key":"sandscour"}` — A scarab of beaten gold. Its legs twitch when you aren't looking. Use it outside a dungeon to open a portal there.
- **Scriptorium Key** `key_scriptorium` use: `{"key":"scriptorium"}` — Frost-rimed silver. It opens the stacks, and possibly a few minds. Use it outside a dungeon to open a portal there.
- **Sunken Chapel Key** `key_chapel` use: `{"key":"chapel"}` — Barnacled bronze. You can hear the tide on the other side of the lock. Use it outside a dungeon to open a portal there.
- **Sunken Crypt Key** `key_crypt` use: `{"key":"crypt"}` — Carved from a knucklebone. The Lich never throws anything away. Use it outside a dungeon to open a portal there.
- **Theatre Ticket** `key_theatre` use: `{"key":"theatre"}` — ADMIT ONE. FINAL PERFORMANCE. The ink is still wet. Use it outside a dungeon to open a portal there.

### chest

- **Vault Chest** `vault_chest` use: `{"vault":8}` — An iron-bound chest, delivered to your vault the moment you use it. Your vault grows by 8 slots.

### backpack

- **Pilgrim's Satchel** `backpack` use: `{"backpack":true}` — A second backpack. Use it to give this character 8 more inventory slots. One per character.

### junk

- **An Old Boot** `old_boot` use: `{"junk":true}` — Fished out of the Nexus pond. Smells like regret. Sells for 1 gold.

