// One animation player for every registry sprite (bosses, elites, pets, eggs, items, the melon...).
//   const a = new Anim(def, 'move');  a.play('attack');  a.queue('move');
//   a.on('ended', (clip) => ...);     // fires once when a non-looping clip finishes
//   each frame: a.update(dt); then draw a.frame
// A non-looping clip holds its last frame and emits 'ended' (gameplay keys off that, not off timers);
// if a clip is queued, it starts right after.
export class Anim {
  constructor(def, clip = null, speed = 1) {
    this.def = def; this.speed = speed; this.handlers = { ended: [] };
    this.clip = null; this.t = 0; this.i = 0; this.done = false; this.next = null;
    this.play(clip || Object.keys(def.anims)[0]);
  }
  play(clip, { speed, restart = true } = {}) {
    if (!this.def.anims[clip]) return this;
    if (speed !== undefined) this.speed = speed;
    if (!restart && this.clip === clip && !this.done) return this;
    this.clip = clip; this.t = 0; this.i = 0; this.done = false;
    return this;
  }
  queue(clip) { this.next = clip; return this; }
  on(ev, fn) { (this.handlers[ev] = this.handlers[ev] || []).push(fn); return this; }
  get spec() { return this.def.anims[this.clip]; }
  get frame() { const A = this.spec; return A.frames[Math.min(this.i, A.frames.length - 1)]; }
  get length() { const A = this.spec; return A.frames.length / (A.fps || 1); }   // seconds, at speed 1
  update(dt) {
    const A = this.spec;
    if (!A || this.done) return null;
    this.t += dt * this.speed * (A.fps || 1);
    const n = A.frames.length;
    if (A.loop) { this.i = Math.floor(this.t) % n; return null; }
    this.i = Math.floor(this.t);
    if (this.i < n) return null;
    this.i = n - 1; this.done = true;
    const ended = this.clip;
    for (const fn of this.handlers.ended) fn(ended, this);
    if (this.next) { const c = this.next; this.next = null; this.play(c); }
    return 'ended';
  }
}
