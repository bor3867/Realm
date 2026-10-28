// Achievements (2026-10-28, the user: "when players do things like reading all of the stones they have something for
// it"). Account-wide: each is earned once (save.ach: id -> the day), checked about once a second against what the game
// already keeps (every character's record, living and fallen, the trophies, the pets, the fame) and a few flags of its
// own (save.achFlags: each dungeon cleared, a melon slain, a fallen star's chest opened). Earned: a banner and its
// reward. The Hall of Legends lists them all (src/ui.js).
import { CLASSES, MAX_LEVEL, STATS } from './data/classes.js';
import { LORE } from './data/lore.js';
import { DUNGEONS, REALM_BOSSES } from './data/enemies.js';

// the account's totals: its living characters' records and its fallen ones'
function totals(s) {
  const T = { kills: 0, bossKills: 0, dungeons: 0, shots: 0, hits: 0, potions: 0, chests: 0, secrets: 0, mins: 0 };
  for (const c of s.chars || []) {
    T.kills += c.kills || 0; T.bossKills += c.bossKills || 0; T.dungeons += c.dungeons || 0; T.shots += c.shotsFired || 0; T.hits += c.shotsHit || 0;
    T.potions += c.potions || 0; T.chests += c.chests || 0; T.secrets += c.secrets || 0; T.mins += (c.playT || 0) / 60;
  }
  for (const d of s.graveyard || []) {
    T.kills += d.kills || 0; T.bossKills += d.bossKills || 0; T.dungeons += d.dungeons || 0; T.shots += d.shots || 0; T.hits += d.hits || 0;
    T.potions += d.potions || 0; T.chests += d.chests || 0; T.secrets += d.secrets || 0; T.mins += d.mins || 0;
  }
  return T;
}
const maxed = (c) => c && c.base && CLASSES[c.cls] && STATS.every((st) => c.base[st] >= CLASSES[c.cls].max[st]);
const trophies = (s) => new Set(s.trophies || []);
const OW = Object.keys(REALM_BOSSES);
const flag = (s, k) => !!(s.achFlags && s.achFlags[k]);
const cleared = (s) => Object.keys((s.achFlags && s.achFlags.dg) || {}).filter((k) => DUNGEONS[k]).length;

// [id, name, what it asks, reward, check(save, totals, game)] (rewards: gold, fame, items into a bag at your feet)
export const ACHIEVEMENTS = [
  ['first_blood', 'First Blood', 'Slay your first monster.', { gold: 25 }, (s, T) => T.kills >= 1],
  ['hunter', 'Hunter', 'Slay 1,000 monsters.', { gold: 250 }, (s, T) => T.kills >= 1000],
  ['slayer', 'Slayer', 'Slay 10,000 monsters.', { gold: 1000, fame: 100 }, (s, T) => T.kills >= 10000],
  ['giant_killer', 'Giant Killer', 'Defeat your first boss.', { gold: 150 }, (s, T) => T.bossKills >= 1],
  ['boss_hunter', 'Boss Hunter', 'Defeat 50 bosses.', { gold: 1000, fame: 100 }, (s, T) => T.bossKills >= 50],
  ['realm_warden', 'Warden of the Realm', 'Defeat every overworld boss.', { fame: 250, items: ['stat_hp'] }, (s) => OW.every((id) => trophies(s).has(id))],
  ['delver', 'Delver', 'Complete your first dungeon.', { gold: 150 }, (s, T) => T.dungeons >= 1],
  ['seasoned_delver', 'Seasoned Delver', 'Complete 25 dungeons.', { gold: 1000, fame: 100 }, (s, T) => T.dungeons >= 25],
  ['cartographer', 'Bane of the Depths', 'Complete every dungeon (defeat its master) at least once.', { fame: 400, items: ['stat_def', 'stat_att'] }, (s) => cleared(s) >= Object.keys(DUNGEONS).length],
  ['loremaster', 'Loremaster', 'Read every lore stone with one character.', { fame: 150, gold: 500 }, (s) => (s.chars || []).some((c) => (c.lore || []).length >= LORE.length)],
  ['secret_seeker', 'Secret Seeker', 'Find a secret room behind a cracked wall.', { gold: 200 }, (s, T) => T.secrets >= 1],
  ['secret_keeper', 'Keeper of Secrets', 'Find 10 secret rooms.', { gold: 800, fame: 50 }, (s, T) => T.secrets >= 10],
  ['treasure_hunter', 'Treasure Hunter', 'Break open 50 chests.', { gold: 500 }, (s, T) => T.chests >= 50],
  ['sharpshooter', 'Sharpshooter', 'Land 75% of 1,000 shots or more, on one character.', { gold: 500, fame: 50 }, (s) => (s.chars || []).some((c) => (c.shotsFired || 0) >= 1000 && (c.shotsHit || 0) / c.shotsFired >= 0.75)],
  ['thirsty', 'Thirsty', 'Drink 100 potions.', { gold: 200 }, (s, T) => T.potions >= 100],
  ['max_level', 'Seasoned', `Reach level ${MAX_LEVEL} with a character.`, { gold: 300 }, (s) => (s.bestLevel || 0) >= MAX_LEVEL || (s.chars || []).some((c) => c.level >= MAX_LEVEL)],
  ['maxed', 'Perfected', 'Max every stat of a character.', { fame: 200, items: ['stat_spd'] }, (s) => (s.chars || []).some(maxed)],
  ['every_class', 'Jack of All Trades', 'Earn a class star with every class.', { fame: 300, items: ['stat_wis'] }, (s) => Object.keys(CLASSES).every((c) => (s.classFame || {})[c] > 0)],
  ['famous', 'Famous', 'Earn 1,000 fame on your account.', { gold: 500 }, (s) => (s.fame || 0) >= 1000],
  ['legend', 'Legend', 'Earn 10,000 fame on your account.', { gold: 2500, items: ['stat_vit'] }, (s) => (s.fame || 0) >= 10000],
  ['fallen_hero', 'Fallen Hero', 'Lose a character. The realm remembers.', { gold: 100 }, (s) => (s.graveyard || []).length >= 1],
  ['pet_lover', 'Pet Lover', 'Raise five pets.', { gold: 300 }, (s) => (s.pets || []).length >= 5],
  ['rare_companion', 'Rare Companion', 'Own a legendary or divine pet.', { fame: 100 }, (s) => (s.pets || []).some((q) => q.rarity === 'legendary' || q.rarity === 'divine')],
  ['melon_slayer', 'Juicy', 'Slay a Giant Watermelon.', { gold: 300 }, (s) => flag(s, 'melon')],
  ['star_catcher', 'Star Catcher', 'Open the chest of a fallen star.', { gold: 400 }, (s) => flag(s, 'star')],
  ['veteran', 'Veteran', 'Play for 10 hours.', { fame: 150 }, (s, T) => T.mins >= 600],
];

const methods = {
  // about once a second, in play: any newly earned? Its banner and its reward, once
  achTick(dt) {
    if (this.mode !== 'play' || !this.player || this.netTargets) return;
    if ((this.achT = (this.achT || 0) - dt) > 0) return;
    this.achT = 1;
    const s = this.save, got = s.ach || (s.ach = {}), now = [];
    let T = null;
    for (const [id, name, , R, check] of ACHIEVEMENTS) {
      if (got[id]) continue;
      if (!T) T = totals({ ...s, chars: (s.chars || []).includes(this.player) ? s.chars : [...(s.chars || []), this.player] });
      let ok = false;
      try { ok = check(s, T, this); } catch { ok = false; }
      if (ok) now.push([id, name, R]);
    }
    if (now.length) this.achEarn(now);
  },
  // earned: each marked with the day, its rewards given, one banner for all of them (an old account comes in having
  // already done several: one banner, not a dozen over each other)
  achEarn(list) {
    const s = this.save, p = this.player, day = new Date().toISOString().slice(0, 10), items = [];
    let gold = 0, fame = 0;
    for (const [id, , R] of list) { s.ach[id] = day; gold += R.gold || 0; fame += R.fame || 0; items.push(...(R.items || [])); }
    s.gold = (s.gold || 0) + gold; s.fame = (s.fame || 0) + fame;
    if (items.length) this.addBag(p.x, p.y + 0.6, items.slice(0, 8));
    const what = [gold ? `${gold} gold` : '', fame ? `${fame} fame` : '', items.length ? 'a gift at your feet' : ''].filter(Boolean).join(', ');
    const names = list.map(([, n]) => n);
    this.banner(`${list.length > 1 ? `${list.length} achievements: ` : 'Achievement: '}${names.slice(0, 4).join(', ')}${names.length > 4 ? '...' : ''}${what ? ' · ' + what : ''}`, 3600);
    if (this.say) for (const n of names) this.say(`Achievement earned: ${n}`, '#ffd650');
    this.sfx && this.sfx('rare');
    this.persist();
  },
  // a thing the save marks for an achievement (a dungeon cleared, a melon slain, a star's chest opened)
  achFlag(k, sub) {
    const F = this.save.achFlags || (this.save.achFlags = {});
    if (sub) { (F[k] || (F[k] = {}))[sub] = 1; } else F[k] = 1;
  },
};
export function installAchievements(Game) { Object.assign(Game.prototype, methods); }
export const achTotals = totals;
