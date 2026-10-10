# The Tidebound Lich (the Sunken Crypt), on the boss framework

Audit D7: the Crypt keeps its layout (the ossuary hall stays its arena: rows of sarcophagi, drowned edges), and its
boss gets the brief's three phases. The Lich keeps what was always his: he puts out the lights, he trades places with
you, and the dead rise where you walked. Those carry over (his own fx, unchanged); everything else is new.

## Numbers
160,000 Life, Defense 26 (its tier is unchanged), 9,000 XP. Shots 70–95. Phases at 66% / 33%.

## Phase 1 — Drowned King
1. **Soul bolts**: three volleys of five `soul_bolt`s in a tight fan, and every bolt bends with the current (the same
   way, the whole volley), so a volley you sidestep can drift back across you. Read which way they lean.
2. **Coral**: three `coral_shard`s thrown at you and either side; after 0.6 s each splinters into six smaller shards.
   Be far from where they splinter, not from where they were thrown.
3. **The swap** (his own): he reaches for your soul, and after 0.6 s you trade places.

## Phase 2 — Soulbinder (the candles gutter: lights out, his own)
On the morph he puts the lights out for 9 s (everything but a small circle round you is dark).
1. **Lost souls**: five `lost_soul`s leave him, chase you for 1.6 s, then turn round and fly home to him: you meet
   them twice. (They're tethered: no other boss's seekers come back.)
2. **Soul cage**: a ring of 14 `soul_ring`s forms round where you stand (radius 4.5), turning slowly, with one gap,
   tightening for 2 s, then flung outward. Step out through the gap while it's wide.
3. **Lights out** again, at the end of the cycle.

## Phase 3 — Tidewraith
1. **The tide comes in**: `tide_crescent`s sweep in from all four walls of the hall at once toward the middle, each
   wall with its own gap. Find the gap that's coming at you, and slip through.
2. **Drowned skulls**: a three-armed spiral of `drowned_skull`s that turns one way for a second, then back the other
   way: the arms swing like a pendulum.
3. **Grave call** (his own): for 6 s the dead rise one second behind you wherever you stood, erupting in rings.

## Loot
Unchanged from the Crypt's Lich (Tidecaller Blade, Staff of Drowned Stars, Hexsilk Robe, Ring of Tides, Soul
Lantern, Grimoire of Ash), plus the brief's legendary (phase-3 kill, 2%): **Tidewraith Staff** (staff: two piercing
bolts that bend with the current and come back once).

## Unique to it
Bolts that bend with the current; coral that splinters; souls that chase you and then fly home; a cage of souls that
forms round you and turns; the tide coming in from every wall at once; a pendulum spiral; and his old three: the
swap, the dark, the grave call. None is used by another boss.

## Result (built)
- `src/bosses/tidebound_lich.js`; the Crypt's boss is now this framework boss (its old definition stays in the data
  for reference but no longer spawns). His three old tricks reuse the game's own fx (`soulswap`, `echo`, the
  darkness), so they behave exactly as before.
- Checked in the ossuary hall (`tools/check_crypt_ember.mjs`): all patterns; the bolts bend, the coral splinters, the
  swap, the dark, the souls turn for home, the cage turns and opens, the tide comes in from all four walls, the
  skulls swing, the grave call.
- Seen in the browser: the bending volleys, the cage round you with its gap, the tide and the skulls together.
