# Melon Realms

A top-down bullet-hell RPG with permadeath, tiered loot and original pixel art. Single-player, runs in the browser, no build step.

## Play

```
node tools/serve.mjs
```

Then open http://localhost:5173.

| Action | Input |
|---|---|
| Move | WASD / arrows |
| Aim / shoot | Mouse / hold left click (T toggles autofire) |
| Rotate the camera | Q left / E right (hold), Z upright, X snap to nearest 90° |
| Minimap zoom | + / − or mouse wheel over the minimap (up to the whole map) |
| View zoom | [ / ] (or the slider in Settings), 75%–150% around your character |
| Settings & key bindings | Esc or the ⚙ button; every key above can be rebound |
| Class ability | Space |
| Enter portal / talk to NPCs | F |
| Take everything from a bag | G |
| Escape to the Nexus | R |
| Use backpack slot | 1–8, double-click, or right-click (also works inside bags). A Pilgrim's Satchel from the shop adds 8 more slots |
| Zoom the view | Mouse wheel over the world |
| Chat / commands | Enter to chat, / for a command (type /help) |
| Move items | Drag between slots; drag onto the world to drop into a bag; shift-click between backpack and bag/vault |

## The loop

1. **Nexus**: a hamlet at dusk around a firepit:
   - cobbled lanes lead to the realm gate, your **vault room** (4 chests, 32 slots, account-wide), the **Salt-Peddler's market** (buy/sell for gold; sells the second backpack) and the **Ashwright's smithy** (salvage gear into essence, or upgrade tiered gear one tier)
   - a **training yard** has dummies (one plain, two with 25 DEF) that show your live DPS
   - the well heals you
   - you can shoot and use your ability here, but nothing can hurt you
2. **The Realm**: a 1280×1280 procedural island in four rings, each harder toward the centre. Seven lands share the rings:
   - the coast: **the Drowned Shore** (south and west) and **the Saltglass Dunes** (east: wind-sanded glass, scarabs, mummies, the Glass Sphinx)
   - the second ring: **Ashfen** and **the Thornwood** (west: bramble thickets you can't walk through, bramble wolves, the Thornwood Stag, the Witch of Briars)
   - the third ring: **Runeholt** and **the Crystal Steppe** (north: golden grass and crystal ground, crystal golems, prism hawks, the Geode Titan, the Skyglass Seer)
   - the centre: **Godfall**
   - **Waypoints**: three obelisks per land. Walk up to one to light it, then press F at any lit waypoint to travel to any other you've found. Landing Beach is known from the start. Waypoints are remembered per character.
   - **Roads**: dirt and cobble paths wind between the waypoints, with bridges over water and lava.
   - **Named sites**, announced (with XP) when you first walk up: the Wrecked Galleon, the Glass Oasis, the Sunken Bell Tower, the Witch's Circle, the Standing Stones, the Shattered Observatory, the Fallen Colossus, waystations, pilgrim ruins, the Glass Graveyard and more. Riddle stones point you at the nearest place you haven't found. Mystery altars bless you, gift you, show you the map, call monsters, or take your blood for gold.
3. **Dungeons** (portals drop from enemies, parents, heralds and realm bosses, or use a key). Each one is built its own way:
   - **The Sunken Chapel** (low tier): a drowned cathedral. An entrance hall with a font, a long nave of pillars and pews with flooded side aisles, little side chapels with altars, a crossing with two transepts, and the round apse where **The Drowned Abbot** preaches. Straight to the boss: no seals.
   - **The Sunken Crypt** (low-mid tier): catacombs. A maze of narrow candle-lit tunnels, burial chambers full of sarcophagi off its dead ends, small ossuaries at the crossings, and the Lich's flooded hall. Boss: **The Tidebound Lich**. No seals; a mystery altar hides somewhere in the maze.
   - **The Drowned Forge** (mid tier): a foundry grid. Nine forge halls with furnaces, paired anvils and half-flooded floors, joined by wide conveyor corridors with molten slag running down the middle. Boss: **The Unstruck**. No seals.
   - **The Frozen Scriptorium** (upper-mid): the stacks. Three enormous halls of bookshelf aisles joined by single-file stairs, with reading rooms off them. The boss gate is sealed by a **rune puzzle**, a hidden lever and a warden. Boss: **The Archivist**.
   - **The Emberforge Depths** (upper): themed rooms (foundry, golemworks, smeltery, armory, bridge hall, quarters) joined by narrow bridges over lava. Sealed by golem wardens, **pressure plates** and a lever. Boss: **The Forgeheart Colossus**.
   - **The Heart of Godfall** (endgame): ten round chambers in a ring around the heart, joined by winding veins; one artery leads in. Sealed by **three wardens**. Boss: **The Fallen Heart**.
   - **The Throne** (final): a colonnaded royal road through two champions' halls, each with a throne and a warden, to the throne room. Boss: **Solkhar, the Sunthief**.
   - Upper dungeons show a seal checklist under the minimap, and their unbroken seals glow on it. Secret rooms hide behind cracked walls, chests have to be broken open, some rooms are ambushes, and every dungeon tells its story in five journal pages.

   Every boss owns its mechanics; no two share a signature move:

   | Boss | Signature mechanics |
   |---|---|
   | Brine Cathedral | the scuttling charge, hiding in its shell |
   | Wick-Mother | the closing ring of candle-fire |
   | Orrery of Winter | circling you, rotating ring-lights |
   | Penitent Colossus | a guard of thanes, telegraphed slams |
   | Emily | the bouncing belly-slide, lobbed fish, speech-bubble rings |
   | Drowned Abbot | the rising water, the undertow |
   | The Unstruck | QUENCH (a steaming checkerboard), hammers that come back |
   | Fallen Heart | artery streams, veins that fire in from the walls |
   | The Archivist | mirror copies, blinking |
   | Solkhar, the Sunthief | judgement marks, a halo of blades, seams of molten gold, falling stars, the stolen sun that circles and flares (only his shadow is safe), and Unmade |
   | The Fallen Star | star mines, burning constellations |
   | The Tidebound Lich | the soul swap, lights out |
   | The Forgeheart Colossus | eruption lanes, the reflecting bulwark |

   All bosses have 60% more life and hit 30% harder than before.
4. **Permadeath**: when you die the character is gone, but your fame, vault and graveyard remain.

## Admin commands (testing)

`/dance`, `/quest [kind]`, `/duck`, `/admin` (equips the overpowered test kit: the Developer's Gavel, the Delete Key, the Plate of the Source Code and the Root Ring), `/backpack`, `/maxlevel`, `/level N`, `/maxstats`, `/heal`, `/god`, `/give ITEM [N]`, `/items TEXT`, `/spawn ENEMY [N]`, `/boss ID|unstruck`, `/event BIOME`, `/progress BIOME N`, `/star`, `/seals`, `/tp shore|fen|runeholt|godfall|dunes|thornwood|steppe|nexus|realm|forge`, `/killall`, `/clearbags`, `/fame N`, `/gold N`, `/essence N`, `/portal chapel|forge|heart|scriptorium|throne`, `/tp chapel|heart|scriptorium|throne`. The full list of items and enemies is in ADMIN_REFERENCE.md.

## Systems

- **Classes**: each has its own weapon, armour and a unique ability (Space):
  - **Brawler (Forgefist): Bellows Charge.** An untouchable dash toward the cursor that hits everything in its path, then an ember blast, plus berserk.
  - **Forge Knight (Anvilheart): Oath-Anvil.** Hurl the anvil onto the cursor. It lands after a beat, crushes everything in the area and stuns it (bosses are immune), and you gain armour.
  - **Priest (Heliarch): Judgment of Noon.** A pillar of light falls on the cursor and burns everything inside it for 1.2 seconds, while you're healed and briefly invulnerable.
  - **Summoner (Reliquarian): Open the Reliquary.** Frees bone thralls that hunt the nearest enemies with seeking bolts. Her soul-lantern shots seek targets too.
  - **Duelist (Mirror-Knight): Mirror Step.** Blink to the cursor and leave a reflection behind. Monsters chase and shoot the reflection until it shatters into glass shards. Her rapier fires fast piercing thrusts.
  - **Stormwright (Kite-Hermit): Storm Kite.** Plants a kite turret that strikes the nearest enemy every 0.4s, arcing to a second. Her copper-coil bolts leap to another enemy.
  - **Clockmaker (Horologist): Stop Time.** Every monster and enemy bullet inside the dial freezes (bosses only for half the duration). Her pendulum weights start slow, accelerate, and hit harder the faster they fly.
  - **Harpooner (Wreck-Whaler): Grapple Line.** Hooks a monster, reels it in and stuns it; hooking a boss hauls you to it; a miss hauls you to wherever the hook landed. Huge, slow, piercing harpoons.
  - **Runeblade (Rune-Knight): Rune Ward.** A ward of runes soaks up the next blows (it fades after 6s) while rune-slashes cut a ring outward. Swords and leather armour.
  - **Hexweaver (Orb-Witch): Hex.** A curse thrown at the cursor: everything inside takes more damage and slows to a crawl, and hex-bolts burst from it. Staves and robes.
- **Pets**: a companion follows you everywhere and heals your Life and Mana every 4 seconds; how much depends on its kind (Ember Fox, Tide Turtle, Lantern Moth, Bog Frog, Rune Owl, Salt Crab, Frost Kit, Star Wisp), rarity (Common to Legendary, which also caps its level at 30 / 50 / 70 / 100) and level.
  - Eggs drop from monster leaders, heralds and bosses (dungeon bosses drop rare and legendary ones), or buy common and uncommon eggs from the Petkeeper. Use an egg to hatch it.
  - **The Pet Yard** (east of the Nexus market): your other pets play in the pen. The Petkeeper lets you pick your companion, release pets, buy eggs, and feed your companion gear you don't need. Better gear is a better meal, and each meal costs a little gold.
- **Pet abilities, feeding and morphing**: every pet has its own ability levels: **Heal** (Life), **Magic Heal** (Mana) and, from Rare up, **Shield** (a ward that soaks damage, renewed every 12s). Feed your companion items at the Pet Yard, paying **gold or fame**; a meal's power goes 100% / 65% / 35% to its main, second and third ability. Feed power grows with tier, and relics are worth more the harder their source: a shore relic ~100, a dungeon boss's ~260, the god's ~600, a mythic 900.
  - Rarity caps the levels: Common 30, Uncommon 50, Rare 70, Legendary 90, Divine 100. Two pets of the same rarity can **fuse** once each one's **main** ability is at the cap (pay gold or fame; pick which pet's look to keep). The new pet keeps the better of each ability level and its cap rises, all the way to Divine at level 100.
  - Skins: Legendary pets are **gilded**, Divine pets **celestial**; rare and up glitter as they walk. The sidebar's **Pet** tab (next to Stats) shows your companion's abilities, levels and next heal.
- **Dungeon keys**: every dungeon has a key. Use one in the Nexus or the Realm to open its portal right there. Dungeon bosses sometimes drop their own key (the Heart's boss can drop the Throne's), and anything that drops a portal can, rarely, drop its key. Admins: `/keys`.
- **Potion slots**: two slots under the backpack each hold up to 10 of one kind of potion. Drag potions in; drink with **C** and **V** (rebindable), or by clicking.
- **Your vault** is one chest that grows: buy a **Vault Chest** from the Salt-Peddler and use it for +8 slots (up to 80). Older saves fold their four chests into one, keeping every slot.
- **Inventory controls**: double-click to use or equip, right-click to use or equip now, shift-click to drink or consume, shift-click gear to move it between your backpack and a bag or the vault. Hover a loot bag in the world to see what's inside.
- **Stats**: Life, Mana, Attack, Defense, Speed, Dexterity, Vitality, Wisdom. Leveling to 20 raises them; stat tinctures push each one to its class maximum.
- **Tiers**: weapons T0–T10, armour T0–T11, abilities and rings T0–T5. Each tier has its own metal colour.
- **Untiered and mythic relics**: about 60 hand-designed items. They do more than add damage:
  - **Weapons**: seeking shots, chain lightning, explosions, burning, slowing, lifesteal, shots that shatter or burst at the end of their flight, boomerangs, crits, shockwaves, falling stars.
  - **Abilities**: each one twists its class ability, e.g. a pillar that follows your cursor, triple anvils, thralls that explode, a hook that catches three enemies.
  - **Armour and rings**: auras, a mana shield, dodge, a periodic block, low-life regeneration, rage, momentum, execute, kill-heal, kill-burst and cheat-death.
- **Admin gear**: absurdly overpowered test items, usable by any class; it never drops.
- **Bosses move**: they charge, blink, orbit you, slam telegraphed zones, fire rings with a single gap to slip through, and hide behind guards until you kill them. They become enraged below 20% life.
- **Bags**: soot (common), ember (stat tinctures), rune (mid tiers), tide (high tiers) and sun (top tier). The bag's colour tells you what's inside before you walk over.
- **Rare bags have their own shapes**, a pillar of light and a drop banner:
  - **Reliquary** (gold box): biome relics, one per wave-2 mob, about 1 in 250.
  - **Funeral Urn** (black urn): realm-boss uniques, two per boss, 10–12% each.
  - **Starfall** (star crystals): 4 mythics, about 1 in 300 per realm boss and 1 in 2000 per Godfall mob.
- **Evolved parents**: every small mob has a 24px evolved form that leads a group of its own kind and keeps re-spawning it. The realm is 480×480 with about 1,100 enemies.
- **Old parent mobs**: each biome has a 24px parent (Pilgrim Elder, Bog Abbess, Rune-Warden, Fallen Choirmaster). Small mobs gather around it, and it keeps spawning new ones until you kill it.
- **Herald events → realm bosses**: heralds (Tide Herald, Bog Bellringer, Rime Herald, Gilded Penitent) appear with escorts. Silencing 3 in a biome summons its boss, which has three phases with immune phase breaks:
  - The Brine Cathedral (Shore)
  - The Wick-Mother (Ashfen)
  - The Orrery of Winter (Runeholt)
  - The Penitent Colossus (Godfall)
- **Realm mobs**: 4–6 per biome, plus boss minions and roaming packs of four hunters (Reef Eel, Bog Toad, Frost Wraith, Ash Harpy).
- **Enemy movement styles**: monsters hop, burrow and resurface, swoop through you, blink around you, skitter, zigzag, flank from one side, float, or stay rooted. Fliers bob on the air.
- **Enemy shot behaviours**: shots weave, accelerate, curve, stop dead and then snap at you, boomerang back, split mid-air, or arc in as mortars with landing markers.
- **Terrain features**: tidal shallows and bog pools slow you down; frozen lakes make you slide; Godfall is cut by lava fissures.
- **Danger rises inland**:
  - Enemy damage scales smoothly with how far inland you stand, from about 55% on the coast to about 95% at the god's heart (shown as stars next to your location). Dungeons have their own level.
  - Every burst of shots (a shotgun blast, a cage, a wall, a mortar and its shards) can hit you only once.
  - Monster damage is calibrated per biome by `node tools/calibrate.mjs`.
- **Roaming world events**:
  - **The Falling Star**: a star crashes into Godfall and **the Fallen Star** climbs out of the crater: 96,000 life, star mines and burning constellations. Its chest only opens once it's dead, and only one can be loose at a time. `/star` to call one.
  - **The Coin Thief**: every hit knocks gold loose.
- **Emily, the Yapper**: deep in the Runeholt, a very large penguin sometimes waddles in and will not stop talking. Snowballs, lobbed fish, belly slides, rings of speech bubbles, chicks and a blizzard, in three phases. Drops Emily's Knitted Scarf (and a statue for the trophy hall). `/boss emily` to summon her.
- **Minimap**: icons only show for what is inside the minimap's view (zoom out to see further); nothing is pinned to the edges. Click a discovered waypoint on the minimap to travel there.
- **Minimap (markers)**: the realm map shows biomes, plus monsters within 18 tiles, unopened camps, ready shrines and wanderers. Every marker has its own pixel glyph (portal ring, boss skull, herald crown, star, coin, quest, bag, shrine, camp, speech bubble).
- **Relics for every class**: each class now has several untiered relics and a starfall mythic ability with its own twist (Unbroken Bellows, First Anvil, Second Sun, Grave of Kings, Leviathan's Maw, Infinite Reflection, Eye of the Storm, Unwound Spring).
- **Enchantments**: any gear that drops has a ~12% chance to be enchanted (1 in 5 of those get two). Stats, weapon tricks (keen, burning, frosted, vampiric, arcing, seeking, volatile), cheaper or stronger abilities, armour passives, and rare unique ones (Shardsinging, Smouldering, Gravedust, Phoenix, Headsman's). Grades I-III. Stored in the item id (`gauntlet_t5~keen2.burning3`), so `/give` works with them too, and they survive the forge.
- **Fame**: level 20 is the cap. From then on experience becomes base fame (1 per 150 XP), shown on the bar under your name with the next fame goal (20 / 150 / 400 / 800 / 2000). When the character dies, base fame plus bonuses (maxed stats, boss slayer, dungeon delver, well equipped, thousand cuts, ancestor, friend of the cat) goes to your account fame.
- **Gear families (RotMG)**: weapons are swords (Brawler, Forge Knight, Runeblade), daggers (Duelist), bows (Harpooner), staves (Summoner, Stormwright, Hexweaver) and wands (Priest, Clockmaker); armour is heavy (Brawler, Forge Knight), leather (Harpooner, Duelist, Runeblade) or robes (everyone else). Abilities stay unique to each class. Old item ids in saves migrate automatically (`save.js`). No item fires seeking shots.
- **Class sets**: every class has a three-piece set (weapon, ability, armour); two pieces grant stats, three unlock a passive. Bosses carry the pieces. **Synergy rings** (mythic): the First Flame (+damage to burning enemies), Still Waters (+damage to slowed enemies), the Open Hand (crits heal), and the Conductor's Band (counts as one more piece of every set you wear).
- **The realm** is 720x720 tiles. Monster groups are placed by best-of-several sampling, far from other groups, so no area gets swamped.
- **Item icons**: 8x8 RotMG-style art. The game strips the baked outline and draws a crisp black outline + drop shadow at full resolution, on mid-grey slots. Drag items and they follow the cursor; drop over the world to drop them on the ground. `tools/preview_items.html` shows every icon.
- **Ruins**: roofless stone shells across every biome, each hiding a chest.
- **The Nexus**:
  - a trophy hall where a stone statue of every great foe you've beaten stands beside the realm road
  - villagers who stroll the lanes and chat
  - a bard by the fire who inspires you (+10% damage for 3 minutes)
  - Madame Ostra's fortune-telling tent
- **Quests**:
  - The nexus notice board offers three quests per visit, and you can carry three at a time.
  - Quest types: cull a kind of monster, pray at shrines, raid camps, silence a herald, slay a realm boss, beat a dungeon master, or find something lost (marked on your minimap).
  - Rewards (gold, essence, fame, sometimes a gift) are paid the moment a quest completes.
- **Wanderers**: four characters in the realm talk to you and each asks a favour: Brother Ossic, Mother Fennick, Scholar Ingrit, and the Penitent Who Laughs.
- **Things to poke at**:
  - 16 lore stones; read them all for a reward, and one is hidden in the nexus.
  - Wishing wells (50 gold a wish), trial altars (survive three waves for a prize) and dig spots (treasure, gold, or a skeleton).
  - In the nexus: fishing on the pond, a cat you can pet, and resting by the campfire (stand still for 6s for +25% XP for 5 minutes).
- **Monsters talk**: now and then (not every time), when they spot you, attack, are nearly dead, or die. Bosses taunt you through the whole fight.
- **New enemy patterns**: walls of shots, cages that blink into a ring around you then close in, shots that orbit the shooter before flinging out, ragged shotgun blasts, alternating crosses, and telegraphed lasers.
- **New enemy mechanics**:
  - guards block shots from the front unless they're attacking (flank them)
  - menders heal their friends
  - bombers swell and burst
  - slimes split
  - some monsters enrage at 40% life
- **Easter eggs**: `/dance`, a certain old cheat code, the Golden Duck, and a few others you'll find.
- **Wayside shrines** bless you for 30s (each biome differently), then rest for 90s. **Guarded camps** hide a chest that won't open until its guards are dead.
- **Animation everywhere**:
  - every creature walks on a 4-step gait, with generated stretch and squash frames between the drawn poses
  - tells flash, hoppers arc, fliers bob, burrowers churn the earth
  - props, decor and landmarks sway or pulse
  - every shot pulses, and bags bounce when they land

### The newer dungeons (src/dungeons4.js)
Each owns its layout, door, trap, shots and boss; nothing is shared with the older dungeons.
- **The Honeyed Hollow** (low): hexagonal comb cells and wax tunnels; honey floors hold your boots (half speed). Queen Melliflua's hex-stings, a jittering bee swarm, a figure-eight waggle dance, honey rain that leaves sticky puddles, and brood cells that hatch unless you break them. No seals.
- **The Gilded Marionette Theatre** (mid): box office, foyer, a fan of seats, the wings backstage. Carry the three lost masks (Comedy, Tragedy, Silence) to the stand before the stage. Spotlights sweep the house; stay in one and every puppet in the room plays faster. Maestro Vesper is strung to four hanging marionettes (immune until every string is cut, then he takes double damage), closes the curtains from both wings, sends a mirror-puppet of you that answers your every shot, snaps scissor-lines shut on you, dances jerky puppet jigs, and leaves the stage to his understudies for an intermission.
- **The Prism Lighthouse** (hard): galleries spiralling in to the lantern room, light-wells off the spiral. In each well, turn mirrors (F) to bend a beam onto its crystal. Lens sentries sweep a sight-line and fire when they find you. Aurelia the Prism Wyrm is glass (immune) unless a lens pedestal's beam is on her: stand on one (it overheats after 5s), mind her images that block the beam, and in her last phase never hold the light too long. Spectrum bolts, a tracking sunbeam, columns of falling glass, helix coils.
- **The Sleeper's Dream** (hard, endgame): islands in a starry void, joined by bridges, some of which fade (fall through and you lose 15% life). Survive three nightmare trials (the bridges vanish until you do). The Sleeper makes you drowsy when you stand still (sleep = stunned), shifts into nightmare (its true body immune; strike its nightmare-self), inverts your controls, sends hopping sheep, lullabies, blinking stars and tides of crescent moons; at the end it will not wake until you ring three alarms.

## Art pipeline

All sprites are authored as character grids in Python and exported as PNG sheets with JSON frame guides. Python 3.9+ is required; no packages are needed.

```
py tools/heroes8.py              # the eight original classes (8x8 art)
py tools/pack_build.py           # Runeblade, Hexweaver and the pack bosses (art in tools/pack_sprites.py)
py tools/build_enemies.py        # bestiary (hand-drawn 8x8 monsters from tools/bestiary8.py)
py tools/build_champions.py      # parents, evolved forms, heralds (24x24)
py tools/build_godheart.py       # The Fallen Heart (64x64)
py tools/build_boss.py           # The Unstruck (48x48)
py tools/build_realm_bosses.py   # realm event bosses (32x32)
py tools/preview_world.py        # tiles, objects, bags, items, projectiles (+ previews)
py tools/lineup.py               # readability test across terrains
node tools/soak.mjs              # headless soak test: every ability, boss mechanic, dungeon and relic
node tools/balance.mjs           # class balance bench: DPS by range, with/without ability, effective life
node tools/calibrate.mjs         # re-measures every monster's damage and rewrites src/data/tuning.js
```

**The RotMG look.** Every sprite is 8 art pixels per tile, like Realm of the Mad God, stored doubled so frames stay 16px
(champions 12x12 in 24px frames, bosses 24x24 / 32x32). The art carries no outline: the game draws a thin black one around
every sprite at draw time (`src/outline.js`, used by `render.spr()`), half an art pixel wide, so silhouettes pop.
Players (`tools/heroes8.py`) and monsters (`tools/bestiary8.py`) are hand-drawn 8x8; champions, bosses and world objects are
reduced from their older 16px art by `tools/retro.py` (half density, baked outline stripped, colours made vivid, 2-frame walk).
Ground tiles are flat 8x8 paintings with a few specks (`terrain.paint8`) so the actors read against them.
Every sprite then gets RotMG light and shadow at the doubled resolution (`retro.shade_px`): a warm rim light on the top-left
of each shape and a cool, violet-leaning two-pixel shadow on the bottom-right. The world is drawn at screen resolution
(`render.draw`: the buffer is scaled, each sprite group is nudged by its sub-pixel remainder), so movement glides by single
screen pixels and outlines are 1-2 screen pixels wide.
`tools/preview_sprites.html?a=<sheet>` shows any sheet the way the game draws it. The pre-RotMG art is backed up in `art/_proto/old/`. Player weapon shots (one per tier, plus one per untiered weapon) live in `tools/weapon_shots.py`.

The newer dungeons' art (tiles, monsters, bosses, props, portals, relics, shots) lives in `tools/dungeons4_art.py`.

**Shots** are drawn the RotMG way by `tools/shots_rotmg.py`: an 8x8 picture doubled into a 16px cell and outlined at 1px, a
few strong tones and a white-hot core. Every shot is one of ~45 named shapes (staff bolt, wand spark, sword crescent, dagger,
arrow, harpoon, lightning, flame, wisp, feather, note, rune, skull, bell, anchor, star...). The weapon type picks the shape
of tiered shots; `NAMED` maps every other shot; colours are sampled from each shot's old palette in `tools/projectiles.py`.
Pointed shots turn to their flight (most are drawn on the diagonal), stars and wheels spin, and the big slow ones draw a
size up (`projRot`, `projDiag`, `projSpin`, `projBig` in world.json).

**Dungeon atmosphere.** Dungeons are dark (each has its own `ambient` tint in `DUNGEONS`); braziers, candles, furnaces,
crucibles, vents, fountains, runes and lava carve warm or cold pools of light out of it, and you carry a light of your own.
The dark falls under the bullets, so shots always read. Each dungeon also has a trap of its own: the crypt's restless
sarcophagi wake as you pass, the forge's conveyor belts carry you, the ember vents breathe sparks then erupt, and the
throne's royal road is guarded by sentinel statues that fire gold lances across it in alternating rhythm. The throne road
and the chapel aisle are laid with carpet.

## Code map

- `src/game.js`: simulation (player, AI, patterns, boss, loot, portals, saves)
- `src/render.js`: canvas renderer (integer pixel scaling)
- `src/ui.js`: side panel and screens
- `src/data/*`: classes, items, enemies
- `src/world/maps.js`: Nexus, realm and dungeon generation

Rendering and simulation are separate, so a multiplayer server can be added later.
