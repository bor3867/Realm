# The Fallen Heart (the Heart of Godfall)

Rebuilt on the three-phase engine on 2026-10-21 (`src/bosses/fallen_heart.js`; art `tools/build_fallen_heart.py`). It is the
second of the older bosses to be redesigned.

**From the dungeon's prayers:** "It kept beating." "Gold grew around it like scar tissue." "The heart drank their
prayers." "Count them: they are getting faster." "It remembers being a god."

## The Heartbeat (its signature)
- Eight gold veins run out from it across the floor. **Lub:** the odd veins burst. **Dub:** the even ones. The veins
  about to burst glow, and each lane is marked before it burns.
- Step between the veins in time. They creep round a little with every beat.
- Its beats a minute show over it. They start at 46 and climb as it weakens (up to about 90), plus 7 for each prayer
  it is drinking.

## Phase I: It Still Beats
- Its blood comes out in rings, each turned half a step from the last.
- Gold shards fly off its scars at you in fans.

## Phase II: The Saints Pray
- Ghostly saints kneel round the room (3 in phase II, every 15 s; 2 in phase III, every 19 s).
- Each saint sends a beam of prayer into the heart. While a prayer reaches it, the heart heals (0.35% of its Life a
  second per prayer) and beats faster.
- **Stand in a beam** for 1.2 s to intercept it: the saint fades. The beam turns red while someone holds it back.
- Saints finish praying and go after 13 s.
- The choir: prayer-light comes out of it in a turning spiral.

## Phase III: It Remembers Being a God
- A halo of gold thorns grows behind it, and an eye opens in the muscle.
- **The room breathes:** a red boundary closes in on each lub and opens on each dub. Outside it you burn. This is felt
  in your own browser.
- Its eye looks at each of you: a marked line, then it burns.

## Last: The Last Beat (at 8%)
- The beats race at 132 a minute for five seconds, then stop.
- In the silence, four gold scars glow on the floor. When the last beat lands, everything outside the scars is hit
  for 420 damage.

## Multiplayer
- The server runs the beat, the saints and the beams. Each player's position on the server decides whether a prayer
  is intercepted.
- The breathing room and the last beat are checked in each player's own browser, from plain values on the heart:
  the ring's radius, the scars, and when the last beat lands.

## Numbers
100,000 Life, 40 DEF, 16,000 XP. Its loot is the Fallen Heart's old table (`DUNGEON_BOSSES.fallen_heart.loot`).
