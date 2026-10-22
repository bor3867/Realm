// The Mad God Armory's mechanics (src/data/armory_data.js), mixed into Game like src/mythics.js. Each item's signature
// mechanic is built here in turn; until an item's is in, a weapon fires its own shots with its exact numbers (count,
// spread, speed, range, rate, piercing) and an ability spends its mana and cooldown and says so.
//   armoryVolley(W, sp, ox, oy, a, mult): a weapon's volley; true when its mechanic fires it instead of plain shots
//   armoryAbility(id, A): an ability, a tome or the Hosanna set's pieces
const BUILT = new Set();                                   // the items whose mechanics are in (filled as they are built)
const methods = {
  armoryVolley(W, sp, ox, oy, a, mult) {
    void ox; void oy; void a; void mult;
    if (BUILT.has(sp.armory)) return false;
    return !(W.speed > 0 && W.range > 0);                  // (a weapon with no flight of its own, Hosanna or The Hunger, waits for its mechanic)
  },
  armoryAbility(id, A) {
    const p = this.player;
    if (p.abilityT > 0) return;
    if (p.mp < A.cost) { this.toast('Not enough mana.'); return; }
    p.mp -= A.cost; p.abilityT = Math.max(0.5, A.cd || 0);
    this.sfx('ability');
    if (!BUILT.has(A.armory)) this.toast('Its mechanic is still being built.');
  },
};
export function installArmory(Game) { Object.assign(Game.prototype, methods); }
