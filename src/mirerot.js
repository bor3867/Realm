// Mirerot Grotto's own systems (docs/design/dungeon_mirerot.md), mixed into Game like frostveil.js.
//   pods     spore pods burst 0.4 s after you come near, or the moment one of your shots hits them
//   clouds   a burst pod (or a sporeling) leaves a poison cloud for a while
//   poison   inside a cloud, or hit by Mycelia's needles: damage every half second, past your Defense
//   puddles  Mycelia's acid, where her globs land
//   sprouts  her glowcap seeds: shoot them before they burst into sporelings
export const MIRE = { podR: 1.6, podFuse: 0.4, cloudR: 1.8, cloudT: 4, poisonDmg: 8, poisonTick: 0.5, linger: 2, puddleR: 1.2, puddleT: 6, puddleDmg: 14 };

const methods = {
  poison(sec) {
    const p = this.player;
    if (p.dead || this.passive().nopoison) return;
    p.poisonUntil = Math.max(p.poisonUntil || 0, this.t + sec);
  },
  mrCloud(x, y, r = MIRE.cloudR, t = MIRE.cloudT) {
    (this.map.mrClouds = this.map.mrClouds || []).push({ x, y, r, until: this.t + t, born: this.t });
  },
  mrBurst(o) {
    const m = this.map;
    if (o.burst) return;
    o.burst = true; o.hidden = true;
    m.objects.splice(m.objects.indexOf(o), 1); m.ogridDirty = true;
    if (o.light && m.lights) m.lights = m.lights.filter((L) => L !== o.light);
    this.mrCloud(o.x, o.y);
    this.vx({ k: 'burst', x: o.x, y: o.y - 0.4, n: 16, colors: ['#c8ff8a', '#7ac83a', '#5a3a6a'] });
  },
  // every frame, everywhere: poison ticks; clouds and puddles hurt whoever stands in them
  updatePoison(dt) {
    const p = this.player, m = this.map;
    if (m.mrClouds) {
      for (const c of m.mrClouds) if (!p.dead && Math.hypot(p.x - c.x, p.y - c.y) < c.r) this.poison(MIRE.linger);
      m.mrClouds = m.mrClouds.filter((c) => this.t < c.until);
    }
    if (m.mrPuddles) {
      for (const q of m.mrPuddles) if (!p.dead && Math.hypot(p.x - q.x, p.y - q.y) < q.r && (q.tick = (q.tick || 0) - dt) <= 0) { q.tick = 0.5; this.hurtPlayer(q.dmg, 'acid', true); }
      m.mrPuddles = m.mrPuddles.filter((q) => this.t < q.until);
    }
    if (p.poisonUntil > this.t && !p.dead) {
      p.poisonT = (p.poisonT || 0) - dt;
      if (p.poisonT <= 0) { p.poisonT = MIRE.poisonTick; this.hurtPlayer(MIRE.poisonDmg, 'poison', true); }
      if (Math.random() < dt * 6) this.vx({ k: 'burst', x: p.x, y: p.y - 0.7, n: 1, colors: ['#8aff6a'] });
    } else p.poisonT = 0;
  },
  // ---------------------------------------------------------------- per frame in the grotto
  updateMirerot(dt) {
    const m = this.map, p = this.player;
    if (!m.mrPods) m.mrPods = m.objects.filter((o) => o.mrPod);
    for (const o of m.mrPods) {
      if (o.burst) continue;
      if (o.fuse !== undefined) { if ((o.fuse -= dt) <= 0) this.mrBurst(o); continue; }
      if (!p.dead && Math.hypot(p.x - o.x, p.y - o.y) < MIRE.podR) { o.fuse = MIRE.podFuse; o.swell = this.t; continue; }
      for (const b of this.projectiles) {                     // your shot pops it at once
        if (b.from !== 'p' || Math.abs(b.x - o.x) > 0.6 || Math.abs(b.y - (o.y - 0.3)) > 0.7) continue;
        b.life = 0; this.mrBurst(o); break;
      }
    }
    m.mrPods = m.mrPods.filter((o) => !o.burst);
    // Mycelia's sprouts: shoot them, or they burst into sporelings
    for (const e of this.enemies) if (e.id === 'glowcap_sprout' && !e.dead && (e.sproutT -= dt) <= 0) {
      e.dead = true; e.deadT = 9;
      const s = this.addEnemy('sporeling', e.x, e.y); s.hp = s.maxHp = Math.round(s.hp * (m.def.mobHp || 1)); s.seen = true;
      this.vx({ k: 'burst', x: e.x, y: e.y - 0.4, n: 12, colors: ['#c8ff8a', '#ffd650', '#5a3a6a'] });
    }
  },
};

export function installMirerot(Game) { Object.assign(Game.prototype, methods); }
