# Maestro Lucan, the Puppeteer (the Gilded Marionette Theatre)

Rebuilt on the three-phase engine on 2026-10-22 (`src/bosses/the_puppeteer.js`; art `tools/build_hollow_bosses.py`). His old
trapdoors, curtain and mirror-puppet kept their state where a multiplayer server never sent it to browsers. Now it all
reaches every player.

**From the programme for the final performance:** "No strings attached. (There are strings attached.)" "INTERMISSION.
The understudies will entertain you." "The Maestro takes his bow. Audience participation is mandatory."

He wears the three masks you returned, one an act: Comedy (gold, grinning), Tragedy (blue, weeping) and Silence
(white, blank).

## Phase I: Comedy
- **The trapdoor:** he drops through the stage (immune while under). Three hatches light up in turn, the last near you,
  and he bursts out of it in a ring of ribbons.
- Jigs: rings of strings that stop and start. Scissors: two blades open wide either side of your line, then snap
  shut. His bow: snaking ribbons.

## Phase II: Tragedy
- **Intermission:** he leaves the stage (immune) to three understudies. They are the theatre's own understudy in new
  clothes, with real Life. He's back when they all fall, or after 20 s.
- **The mirror-puppet** (8 to 10 s): a puppet of you stands across the stage. Every time you fire, it fires a string
  back at you. This happens in your own browser: everyone has their own mirror-puppet.
- **The curtains:** red velvet closes in from both wings to 40% of the stage. In the wings you burn.

## Phase III: Silence
All of it, faster.

## Last: Curtain Call (at 10%)
Three spotlights wander the stage. Every 3 s he bows ("BRAVO!") with a ring of masks. Anyone outside a spotlight when
he bows is taken by the strings (150 damage).

## Numbers
140,000 Life, 22 DEF, 9,000 XP. His loot is his old table.
