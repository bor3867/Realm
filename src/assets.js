// Loads every PNG sheet + its JSON frame guide produced by tools/*.py, then the Realm Update sprite registry.
import { loadRegistry } from './registry.js';
const SHEETS = {
  brawler: 'art/sprites/player/brawler/forgefist_sheet',
  forge_knight: 'art/sprites/player/forge_knight/anvilheart_sheet',
  priest: 'art/sprites/player/priest/heliarch_sheet',
  summoner: 'art/sprites/player/summoner/reliquarian_sheet',
  harpooner: 'art/sprites/player/harpooner/wreckwhaler_sheet',
  duelist: 'art/sprites/player/duelist/mirrorknight_sheet',
  stormwright: 'art/sprites/player/stormwright/kitehermit_sheet',
  clockmaker: 'art/sprites/player/clockmaker/horologist_sheet',
  runeblade: 'art/sprites/player/runeblade/runeblade_sheet',
  hexweaver: 'art/sprites/player/hexweaver/hexweaver_sheet',
  enemies: 'art/sprites/enemies/enemies_sheet',
  champions: 'art/sprites/enemies/champions_sheet',
  unstruck: 'art/sprites/bosses/unstruck_sheet',
  realm_bosses: 'art/sprites/bosses/realm_bosses_sheet',
  godheart: 'art/sprites/bosses/godheart_sheet',
  godking: 'art/sprites/bosses/godking_sheet',
  pack_bosses: 'art/sprites/bosses/pack_bosses_sheet',
};
const IMAGES = ['tiles', 'objects', 'items', 'projectiles', 'decor', 'landmarks', 'fx', 'nexus_art'];   // (nexus_art: the painted Nexus, tools/build_nexus_art.mjs)

const loadImg = (src) => new Promise((ok, bad) => {
  const im = new Image();
  im.onload = () => ok(im);
  im.onerror = () => bad(new Error('missing ' + src));
  im.src = src;
});
const loadJSON = (src) => fetch(src).then((r) => {
  if (!r.ok) throw new Error('missing ' + src);
  return r.json();
});

export async function loadAssets() {
  const A = { sheets: {}, img: {} };
  await Promise.all([
    ...Object.entries(SHEETS).map(async ([k, base]) => {
      const [img, guide] = await Promise.all([loadImg(base + '.png'), loadJSON(base + '.json')]);
      A.sheets[k] = { img, guide };
    }),
    ...IMAGES.map(async (k) => { A.img[k] = await loadImg(`art/world/${k}.png`); }),
    loadJSON('art/world/world.json').then((w) => { A.world = w; }),
    loadRegistry().then((R) => { A.reg = R; }),
  ]);
  return A;
}
