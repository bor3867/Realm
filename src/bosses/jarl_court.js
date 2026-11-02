// The Hollow Court (the user's castle spec, 2): the two Hollow Jarls, Warrior and Wizard, in one court at once, on one
// shared script. Each Jarl asks the court for its next attack (its own entries of the act's block, at their offsets; the
// block repeats, mirrored each time); the court keeps the act the same for both (a Jarl's phase follows its partner's):
//   Act I   'TWO CROWNS'         both above 66% (and the first 40 s at most): an 18 s block
//   Act II  'OATHS IN ASH'       either at 66% or below: a 23 s block
//   Act III 'THE HOLLOWED OATH'  either at 30% or below, or one dead: a 20 s block while both live
// When one dies the other, after 1.2 s ('ONE CROWN REMAINS.'), fights on its own sequence (its signature every 12-15 s),
// a little quicker on its feet (+12%) and in its shots (+10%), no Life back. A Jarl alone (/bx) runs its own share of
// the blocks.
const BLOCKS = {
  1: { len: 18, list: [[0, 'W', 'W1'], [0.7, 'Z', 'Z1'], [3.8, 'W', 'W2'], [4.1, 'Z', 'Z4'], [8.4, 'Z', 'Z2'], [9.15, 'W', 'W3'], [13.2, 'W', 'W1'], [13.85, 'Z', 'Z1']] },
  2: { len: 23, list: [[0, 'Z', 'Z2'], [1.3, 'W', 'W2'], [4.5, 'Z', 'Z3'], [5.0, 'W', 'W1'], [9.0, 'W', 'W5'], [9.7, 'Z', 'Z4'], [18.0, 'Z', 'Z5'], [18.5, 'W', 'W3']] },
  3: { len: 20, list: [[0, 'Z', 'Z6'], [1.0, 'W', 'W1'], [5.0, 'W', 'W5'], [5.6, 'Z', 'Z2'], [14.0, 'Z', 'Z5'], [14.8, 'W', 'W4']] },
};
const ALONE = { W: ['W6', 'W1', 'W2', 'W3', 'W1', 'W4'], Z: ['Z7', 'Z1', 'Z4', 'Z3', 'Z1', 'Z5'] };
export const ACTS = { 1: 'TWO CROWNS', 2: 'OATHS IN ASH', 3: 'THE HOLLOWED OATH' };
const who = (e) => (e.D.bx === 'jarl_warrior' ? 'W' : 'Z');
const alive = (q) => q && !q.dead && q.bx && !['death', 'deathhold', 'gone'].includes(q.bx.state);

// the court a Jarl belongs to: both share one (game.js joins them); a Jarl on its own has its own
export function courtOf(e) { return e.jcCourt || (e.jcCourt = { m: { [who(e)]: e }, act: 1, t0: null, start: null, done: {}, mirror: false }); }
export function joinCourt(a, b) { const C = { m: { [who(a)]: a, [who(b)]: b }, act: 1, t0: null, start: null, done: {}, mirror: false }; a.jcCourt = b.jcCourt = C; return C; }
export const partner = (e) => { const C = e.jcCourt; if (!C) return null; const o = C.m[who(e) === 'W' ? 'Z' : 'W']; return o && o !== e ? o : null; };

// once a frame, from either Jarl: the act, the partner's phase, the survivor
export function courtTick(g, e) {
  const C = courtOf(e);
  if (C.tick === g.t) return C; C.tick = g.t;
  const L = Object.values(C.m), live = L.filter(alive), awake = live.filter((q) => q.bx.state !== 'sleep' && q.bx.state !== 'intro');
  if (!awake.length) return C;
  if (C.start === null) { C.start = g.t; C.t0 = g.t; }
  let act = C.act;
  if (live.length < L.length) act = 3;
  for (const q of L) { if (q.hp / q.maxHp <= 0.30) act = Math.max(act, 3); else if (q.hp / q.maxHp <= 0.66) act = Math.max(act, 2); act = Math.max(act, (q.bx && q.bx.phase) || 1); }
  if (act === 1 && g.t - C.start >= 40) act = 2;
  if (act > C.act) {
    C.act = act; C.t0 = g.t + 1.5; C.done = {}; C.mirror = false;
    if (g.banner) g.banner(ACTS[act], 2200);
    for (const q of live) while (q.bx.phase < act && q.bx.state !== 'death') g.bxMorph(q);
  }
  if (L.length > 1 && live.length === 1 && !C.surv) {      // one crown remains
    const s = live[0]; C.surv = s; s.jcSurv = true; C.aloneK = 0;
    if (g.banner) g.banner('ONE CROWN REMAINS.', 2200);
    s.bx.vol = []; s.bx.state = 'grace'; s.bx.wait = 1.2; s.bx.pat = null;
  }
  return C;
}

// the next attack for this Jarl, or nothing yet
export function courtChoose(g, e, AT) {
  const C = courtTick(g, e), me = who(e);
  if (C.surv === e) return AT[ALONE[me][C.aloneK++ % ALONE[me].length]];
  if (C.t0 === null || g.t < C.t0) return null;
  const Y = BLOCKS[C.act], mine = Y.list.filter((r) => r[1] === me && C.m[me]);
  if (Y.list.every((r) => !alive(C.m[r[1]]) || C.done[r.join()])) {   // the block is through: the next, mirrored, once its time is up
    if (g.t < C.t0 + Y.len) return null;
    C.t0 = g.t; C.done = {}; C.mirror = !C.mirror;
  }
  const r = mine.find((q) => !C.done[q.join()]);
  if (!r || g.t < C.t0 + r[0]) return null;
  C.done[r.join()] = true;
  return AT[r[2]];
}
export const mirrored = (e) => !!(e.jcCourt && e.jcCourt.mirror);
