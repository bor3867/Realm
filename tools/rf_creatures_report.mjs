// How much of the Realmforge dungeons' creatures comes over to our own monster engine (src/rf/creatures.js): every kind,
// whole or with notes (an approximation, a trait left out, one our engine lacks). The roadmap for "everything on the same
// engine" (2026-10-26).
//   node tools/rf_creatures_report.mjs [--all]       (--all: every kind's notes, not just the summary)
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { translateAll } = await import('../src/rf/creatures.js');
const DATA = JSON.parse(readFileSync(new URL('../art/rf/data.json', import.meta.url), 'utf8'));
const { defs, report } = translateAll(DATA);
const whole = report.filter((r) => !r.notes.length), by = {};
for (const r of report) for (const n of r.notes) { const k = n.split(':')[0] + ':' + (n.split(':')[1] || '').replace(/\(.*\)/, '').trim(); by[k] = (by[k] || 0) + 1; }
console.log(`${report.length} creature kinds: ${whole.length} come over whole, ${report.length - whole.length} with notes`);
for (const [k, n] of Object.entries(by).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${k}`);
const ais = {}; for (const D of Object.values(defs)) ais[D.ai] = (ais[D.ai] || 0) + 1;
console.log('as our ai:', JSON.stringify(ais));
if (process.argv.includes('--all')) for (const r of report) if (r.notes.length) console.log(`${r.id.padEnd(28)} ${r.name.padEnd(26)} ${r.notes.join('; ')}`);
