// The Everbloom set (2026-11-11, the user: "Design me 8x8 sprites for this god ranger set ... similar to the hosanna priest
// set. the ascend command used on a ranger will give this set"): the ranger's Divine set, drawn from the user's picture
// (a gold bow wound with vine and an emerald at its grip; a brown quiver with a green pennant, a white cross and three
// arrows; a green tunic, cream pauldrons, a gold collar round an emerald, a brown sash and belt; a gold ring crowned with
// an emerald between two cream wings and green leaves). Built like the Hosanna set (src/data/armory_data.js): the same
// fields, the mechanics in src/armory.js, what they show in src/armory_draw.js. Admin-only: it never drops.
const P = { Y: '#f6c453', y: '#ffe7a3', D: '#a8741f', G: '#2f9e44', g: '#6fd36a', E: '#10b981', L: '#a7f3d0', W: '#ffffff', w: '#f1e6c8', s: '#efe3c2', b: '#8a5a2b', n: '#5b3a1a', r: '#d9ffe880', R: '#d9ffe8c0' };
const GLOW = '#7ef0a8';

const BOW = ['.Y.yYYGg', 'YEY...sG', '.Y...s.g', 'y...s...', 'Y..s....', 'Y.s.....', 'Gs......', 'gG......'];
const put = (rows, pts) => rows.map((r, y) => [...r].map((c, x) => { const q = pts.find((p) => p[0] === x && p[1] === y); return q ? q[2] : c; }).join(''));
const QUIVER = ['..W.W.W.', '..w.w.w.', '.DYYYYYD', 'b.YGWGY.', 'b.YWWWY.', 'b.YGWGY.', '.bnYGYn.', 'gGnnYnn.'];
const MANTLE = ['..Y..Y..', 'wwGYYGww', 'wWGEEGnw', '.GGgGnG.', '.GGnGGG.', '.nnYYnn.', '.GG..GG.', '.YG..GY.'];
const RING = ['.w.LE.w.', 'gwYEEYwg', '..YyyD..', '.Y....D.', 'Y......D', 'Y......D', '.Y....D.', '..YYDD..'];

const ARROW = { f: [['.....LWW', '......EW', '.....Y.L', '....Y...', '...Y....', 'g.Y.....', 'gY......', 'gg......']], p: P, pulse: 'W', fps: 6 };
const HUNT = { f: [['....gLWW', '.....EWW', '....YgEL', '...Y..g.', '..Y.....', 'GgY.....', 'GY......', 'GG......'], ['....gLWW', '.....LWW', '....YgEW', '...Y..g.', '..Y.....', 'GgY.....', 'GY......', 'GG......']], p: P, pulse: 'WL', fps: 10 };
const LEAF = { f: [['........', '.....gL.', '....gGg.', '...gGG..', '..gGG...', '..GG....', '.D......', '........']], p: P, pulse: 'L', fps: 6 };
const MARK = { f: [['........', '....W...', '...LEL..', '..gEWEg.', '...LEL..', '....E...', '...G.G..', '........'], ['........', '....L...', '...LEL..', '..gELEg.', '...LEL..', '....E...', '...G.G..', '........']], p: P, pulse: 'WL', fps: 4 };

export const EVERBLOOM = [
  { name: 'Everbloom', cls: 'Bow', tier: 'Divine', set: 'Everbloom', glow: GLOW, glowBoost: 1.9,
    desc: 'A bow of living gold, wound with vine that never withers. Its arrows are green light, and every sixth volley calls the Wild Hunt. The hunt is hungry: a volley that finds nothing feeds on you.',
    item: { f: [BOW, put(BOW, [[3, 2, 'r']]), put(BOW, [[3, 2, 'R'], [2, 4, 'r']]), put(BOW, [[2, 4, 'R'], [4, 1, 'r']]), put(BOW, [[1, 1, 'L'], [4, 1, 'R']]), put(BOW, [[2, 3, 'r']])], p: P, pulse: 'ELW', fps: 6 },
    shots: [ARROW, HUNT, LEAF], shotNames: ['Arrow', 'Wild Hunt', 'Leaf'],
    st: { dmg: [210, 270], shots: 3, arc: 7, hits: 3, speed: 150, lt: 600, rof: 0.6, flags: ['MultiHit'], equip: { DEX: 10, ATT: 8, SPD: 4 },
      extra: [['Wild Hunt arrow', [330, 420], 7 / 6]],
      special: ['Verdant volley: three arrows of green light that pass through enemies',
        'Sap: every volley that strikes heals you 1.5% of your max HP',
        'Every 6th volley is the Wild Hunt: 7 great arrows in a wide fan (330–420); each Roots what it strikes for 1s (40% slower)',
        'Harvest: the Wild Hunt heals you 5% of your max HP for each enemy it strikes (up to 4)',
        'Price: a volley that strikes nothing costs 4% of your max HP. It cannot kill you, but it will leave you at 1'],
      parts: [], role: 'Divine · At a price' } },
  { name: 'Thornsong', cls: 'Quiver', tier: 'Divine', set: 'Everbloom', glow: GLOW, glowBoost: 1.5,
    desc: 'The hymn of the Everbloom set. A grove springs up where you aim: thorns rain on everything inside, your arrows bloom as they pass through it, and its green mends you.',
    item: { f: [QUIVER, put(QUIVER, [[7, 1, 'r'], [3, 0, 'y']]), put(QUIVER, [[0, 1, 'R'], [5, 0, 'y']])], p: P, pulse: 'WE', fps: 3 },
    shots: [LEAF], shotNames: ['Thorn'],
    st: { ability: 'Thornsong', mp: 100, cd: 0.5, dmg: [0, 0], speed: 0, lt: 0, equip: { DEX: 6, HP: 40 },
      parts: [['Thorns', [70, 95], 16]],
      special: ['A grove springs up at your cursor (9 tiles) for 4s, 5 tiles wide',
        'Thorns fall on every enemy inside for 70–95 every 0.25s, and they move 40% slower',
        'Your arrows that pass through the grove deal 25% more',
        'It heals you 10% of your max HP as it springs up, and 4% a second while you stand in it'],
      extra: [], role: 'Quiver · Zone · Control' } },
  { name: 'Sylvan Mantle', cls: 'Leather', tier: 'Divine', set: 'Everbloom', glow: GLOW, glowBoost: 1.5,
    desc: 'A hunter\'s green, its collar gold round a living emerald. When death comes close, the wearer is gone into a whirl of leaves.',
    item: { f: [MANTLE, put(MANTLE, [[3, 2, 'L'], [4, 2, 'L']]), put(MANTLE, [[0, 0, 'r'], [7, 3, 'r']])], p: P, pulse: 'EL', fps: 3 },
    shots: [LEAF], shotNames: ['Leaf'],
    st: { passive: true, cd: 30, dmg: [0, 0], speed: 0, lt: 0, equip: { DEF: 13, SPD: 6, DEX: 6, HP: 60 },
      special: ['Into the Green: when you fall below 30% HP you vanish into a whirl of leaves for 2s',
        'While gone you take no damage, move with +15 Speed, and heal 30% of your max HP'],
      extra: [], parts: [], role: 'Leather · Survival' } },
  { name: 'Verdance', cls: 'Ring', tier: 'Divine', set: 'Everbloom', glow: GLOW, glowBoost: 1.5,
    desc: 'A gold band crowned with an emerald between two pale wings. A leaf of light gathers above you; when it is full, your next strike marks its target for the hunt.',
    item: { f: [RING, put(RING, [[3, 0, 'W'], [4, 1, 'L']]), put(RING, [[4, 0, 'L'], [0, 0, 'r'], [7, 0, 'r']])], p: P, pulse: 'EL', fps: 3 },
    shots: [MARK, LEAF], shotNames: ['Mark', 'Leaf'],
    st: { passive: true, cd: 5, dmg: [260, 340], speed: 0, lt: 0, equip: { HP: 5000, MP: 60, DEX: 5, DEF: 5 },
      special: ['Hunter\'s Mark: while off cooldown, an emerald leaf shines above you',
        'Your next hit marks the target: thorns burst from it for 260–340 in 3 tiles, rooting all they strike for 1s, and you heal 10% of your max HP',
        'The marked target takes 15% more damage from you for 5s'],
      extra: [], parts: [], role: 'Ring · Burst · Control' } },
];
export const EVERBLOOM_SET = { name: 'The Everbloom Set', pieces: ['Everbloom', 'Thornsong', 'Sylvan Mantle', 'Verdance'],
  bonus: [[2, '+5 DEX, +40 MP'], [3, 'Deep Roots: the Wild Hunt roots for 2s, and a volley that strikes nothing costs only 2%'], [4, 'The Green Wakes: the Wild Hunt comes every 4th volley, Harvest heals 7% each, and Thornsong\'s grove follows you']] };
