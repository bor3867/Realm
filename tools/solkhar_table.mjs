// Solkhar's implemented attack table, machine-readable (the audited spec's 16.4): every phase's order and each attack's
// length (its warning to the end of its recovery) and cooldown, read from the boss itself (src/bosses/unstruck_god.js
// ATTACKS_V2). Writes docs/solkhar_attacks.json.            node tools/solkhar_table.mjs
import { writeFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { ATTACKS_V2 } = await import('../src/bosses/unstruck_god.js');
const out = { boss: 'unstruck_god', hp: 850000, thresholds: [0.75, 0.5, 0.25], finale: { at_hp: 1, trials_s: 48, release_s: 3, claim_hold_s: 1.2, light_centers_spec: [[0, 8], [-5, 3], [4, -2], [0, -8]], exposure: { dmg: 40, every_s: 0.5, grace_s: 0.3, piercing: true } }, phases: ATTACKS_V2 };
writeFileSync(new URL('../docs/solkhar_attacks.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log(Object.entries(ATTACKS_V2).map(([p, v]) => `${p}: ${v.order.join(' > ')}`).join('\n'));
