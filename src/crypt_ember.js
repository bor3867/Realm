// The detail pass on the two pack-1 dungeons (audit D7): the Emberforge's vents erupt on a timer. (The Crypt's own
// pass, its candle-lit tomb halls and the crypt water you wade, is all in the generator: no runtime part.)
export const VENT = { every: 6, warn: 1, near: 15, n: 8, dmg: 95, speed: 4.5, range: 4.5 };
const TAU = Math.PI * 2;

const methods = {
  updateEmber() {
    const m = this.map, p = this.player;
    if (!m.emVents) m.emVents = m.objects.filter((o) => o.sprite === 'ember_vent' && !o.cvVent).map((o) => ({ o, t: Math.random() * VENT.every }));
    for (const V of m.emVents) {
      const near = Math.hypot(V.o.x - p.x, V.o.y - p.y) < VENT.near;
      if (!near) { V.warn = false; continue; }
      const ph = (this.t + V.t) % VENT.every;
      V.warn = ph > VENT.every - VENT.warn;
      if (V.last !== undefined && ph < V.last) {          // wrapped round: it erupts
        const a0 = Math.random() * TAU;
        for (let k = 0; k < VENT.n; k++) this.shoot('e', V.o.x, V.o.y - 0.3, a0 + (k / VENT.n) * TAU, VENT.speed, VENT.range, VENT.dmg, 'cinder', 0.4, false, 'an erupting vent');
        this.vx({ k: 'burst', x: V.o.x, y: V.o.y - 0.4, n: 14, colors: ['#ff8c1e', '#ffd84a', '#ffffff'] });
      }
      V.last = ph;
    }
  },
};

export function installCryptEmber(Game) { Object.assign(Game.prototype, methods); }
