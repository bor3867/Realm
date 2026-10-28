// The Realmforge dungeon engine (src/rf/explore_gen.js) paints its floors onto canvases as it lays a dungeon out and
// as its tiles change. A server has no canvas: headless(fn) lends it stand-ins (a document whose canvases take every
// call and give back nothing, a window) for as long as fn runs, and takes them away after, so the rest of the game
// still knows it is on a server (src/game.js reads hitboxes only where there is a document).
import { readFileSync } from 'node:fs';
const stub = () => new Proxy(function () {}, { get: (t, k) => (k === 'data' ? new Uint8ClampedArray(4096) : k === 'width' || k === 'height' ? 64 : k === Symbol.toPrimitive ? () => 0 : stub()), apply: () => stub(), set: () => true });
const LEND = {
  document: { createElement: () => ({ width: 64, height: 64, getContext: () => stub() }) },
  window: { addEventListener: () => {} },
  OffscreenCanvas: class { constructor(w, h) { this.width = w; this.height = h; } getContext() { return stub(); } },
  Image: class {},
};
let depth = 0;
export function headless(fn) {
  if (depth++ === 0) for (const [k, v] of Object.entries(LEND)) if (!(k in globalThis)) globalThis[k] = v;
  try { return fn(); } finally { if (--depth === 0) for (const [k, v] of Object.entries(LEND)) if (globalThis[k] === v) delete globalThis[k]; }
}
export async function headlessAsync(fn) {
  if (depth++ === 0) for (const [k, v] of Object.entries(LEND)) if (!(k in globalThis)) globalThis[k] = v;
  try { return await fn(); } finally { if (--depth === 0) for (const [k, v] of Object.entries(LEND)) if (globalThis[k] === v) delete globalThis[k]; }
}
// its data comes by fetch in a browser: here, a path of ours is read from the disk (anything else goes out as usual)
const ROOT = new URL('../', import.meta.url), fetch0 = globalThis.fetch;
globalThis.fetch = async (u, ...r) => (/^[a-z]+:/i.test(String(u)) && fetch0 ? fetch0(u, ...r) : { ok: true, json: async () => JSON.parse(readFileSync(new URL(String(u), ROOT), 'utf8')) });
