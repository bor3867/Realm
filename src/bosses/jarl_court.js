// The Hollow Court, in two stages (2026-11-02, the user: "replace the existing encounter with a coordinated two-stage
// fight"; it was one shared script of turns, both Jarls open to harm, and far too easy):
//   Stage 1 'THE WARRIOR'S HUNT'  the Warrior hunts you (src/bosses/jarl_warrior.js); the Wizard sits a warded throne at
//                                 the court's north end, untouchable, and keeps two to four spectral portals about the
//                                 court firing on you in his sequences (src/bosses/jarl_wizard.js, the throne's)
//   Stage 2 'THE MAGE UNBOUND'    the Warrior dead: the throne shatters, the Wizard comes down, and fights with all of his
//                                 art (his own phases: II from the throne's fall, III from 40%)
// A Jarl on its own (/bx): the Warrior fights his hunt without the portals; the Wizard begins unbound.
export const ACTS = { 1: "THE WARRIOR'S HUNT", 2: 'THE MAGE UNBOUND' };
const who = (e) => (e.D.bx === 'jarl_warrior' ? 'W' : 'Z');
const alive = (q) => q && !q.dead && q.bx && !['death', 'deathhold', 'gone'].includes(q.bx.state);

// the court a Jarl belongs to: both share one (game.js joins them); a Jarl on its own has its own
export function courtOf(e) { return e.jcCourt || (e.jcCourt = { m: { [who(e)]: e }, act: who(e) === 'Z' ? 2 : 1 }); }
export function joinCourt(a, b) { const C = { m: { [who(a)]: a, [who(b)]: b }, act: 1 }; a.jcCourt = b.jcCourt = C; return C; }
export const partner = (e) => { const C = e.jcCourt; if (!C) return null; const o = C.m[who(e) === 'W' ? 'Z' : 'W']; return o && o !== e ? o : null; };
// the Wizard on his throne (stage 1, beside a living Warrior)
export const enthroned = (e) => who(e) === 'Z' && !!e.jcCourt && e.jcCourt.act === 1 && !!e.jcCourt.m.W;

// once a frame, from either Jarl: the Warrior's fall ends stage 1
export function courtTick(g, e) {
  const C = courtOf(e);
  if (C.tick === g.t) return C; C.tick = g.t;
  const W = C.m.W, Z = C.m.Z;
  if (C.act === 1 && W && Z && !alive(W) && alive(Z) && Z.bx.state !== 'sleep') {
    C.act = 2; C.surv = Z; Z.jcSurv = true;
    if (g.banner) g.banner('THE THRONE SHATTERS', 2600);
    if (Z.bx.B.unbind) Z.bx.B.unbind(g, Z);
  }
  return C;
}
