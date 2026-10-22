// The Realm Remaster's new content (docs/design/09_remaster.md), mixed into Game like elites.js.
// - The six realm bosses keep the remaster's phase art: rxFrame picks its frame (their fights are on the three-phase engine).
// - Monsters fire their new shot now and then in place of their usual one; champions add a signature volley with
//   their two new shots every few seconds.

const R = Math.random;
const methods = {
  // the remaster's art for a boss (null if it has none)
  rxDef(id) { const r = this.A.reg; return r ? r.resolve(`rx_${id}/${id}`) : null; },
  // monsters: now and then their new shot instead of their usual one; champions keep theirs for the signature
  rxAlt(e, A) {
    if (e.rb || !e.D || !A || !A.proj) return A;
    const list = this.rxShotsOf(e.id);
    if (!list.length || this.isChampion(e)) return A;
    if ((e.rxN = (e.rxN || 0) + 1) % 4 !== 0) return A;
    return { ...A, proj: list[0] };
  },
  rxShotsOf(id) {
    if (!this.rxShots) {
      this.rxShots = {};
      if (this.A.reg) for (const d of this.A.reg.list((x) => x.sheet === 'rx_shots')) (this.rxShots[d.meta.owner] = this.rxShots[d.meta.owner] || []).push(d.key);
    }
    return this.rxShots[id] || [];
  },
  isChampion(e) { const S2 = this.A.sheets && this.A.sheets.champions; return !!(S2 && S2.guide.champions[e.id]); },
  // champions: a signature volley with both new shots every few seconds while they fight you
  rxSignature(e, dt, d) {
    if (e.rb || !this.isChampion(e) || d > (e.D.aggro || 9) || this.player.dead) return;
    const list = this.rxShotsOf(e.id);
    if (list.length < 2) return;
    if ((e.rxSig = (e.rxSig ?? 3 + R() * 3) - dt) > 0) return;
    e.rxSig = 5 + R() * 2.5;
    const dmg = Math.max(30, Math.round(((e.D.attacks || [])[0] || {}).dmg || 40));
    this.firePattern(e, { pattern: 'radial', count: 10, speed: 4, range: 8, dmg, proj: list[0], size: 0.4 }, true);
    e.queue.push({ t: 0.35, atk: { pattern: 'aimed', count: 3, arc: 0.4, speed: 6.5, range: 10, dmg, proj: list[1], size: 0.4 } });
  },
};

// which frame of the remaster's art to draw now (null: phase 1's own row)
export function rxFrame(Rg, g, e) {
  const id = e.id, def = Rg && Rg.resolve(`rx_${id}/${id}`);
  if (!def) return null;
  const dead = e.dead;
  let fn;
  if (dead) fn = `death_${Math.min(3, Math.floor((e.deadT || 0) * 5))}`;
  else if (e.rxMorph) fn = `p${e.rxMorph.from}_to_p${e.rxMorph.to}_${Math.min(3, Math.floor(e.rxMorph.t * 6))}`;
  else if ((e.rxPhase || 1) >= 2) {
    const n = e.rxPhase, st = e.state;
    fn = /tell/.test(st) ? `p${n}_attack_0` : /attack|spin|beam|radial/.test(st) ? `p${n}_attack_1` : `p${n}_idle_${Math.floor(g.t * 5) % 4}`;
  } else return null;
  const f = def.frames[fn];
  return f ? { img: def.img, x: f.x, y: f.y, w: f.w } : null;
}

export function installRemaster(Game) { Object.assign(Game.prototype, methods); }
