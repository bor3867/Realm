// Headless check of Phase 7 (docs/design/07_pets.md): the 20 lines and their forms match Pets v2 and have their clips;
// the 50 eggs resolve with a hatch clip; forms follow the main ability's level; an egg hatches its own family at its
// rarity's level, the pet coming out on the burst frame; feeding across 30 evolves a pet; an old save migrates; drops
// step up in harder lands and keep to the land's families.
//   node tools/check_pets.mjs
import { readFileSync } from 'node:fs';
const store = {};
globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { ITEMS } = await import('../src/data/items.js');
const P = await import('../src/data/pets.js');
const { loadSave } = await import('../src/save.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
let fail = 0;
const bad = (m) => { console.log('  PROBLEM:', m); fail++; };
const meta = J('pets_v2/atlas_pets_v2.json').meta;

// ---- the lines, forms and eggs
for (const [ln, L] of Object.entries(meta.lines)) {
  const K = P.PET_KINDS[ln];
  if (!K) { bad(`line ${ln} missing`); continue; }
  if (K.family !== L.family || K.forms.join() !== L.forms.join()) bad(`line ${ln} differs from Pets v2`);
  K.forms.forEach((f, s) => {
    const d = reg.resolve('pt2_pets/' + f);
    if (!d) return bad(`no art for ${f}`);
    for (const c of ['idle', 'follow', 'happy']) if (!d.anims[c]) bad(`${f}: no ${c} clip`);
    if (d.size[0] !== [8, 10, 12][s]) bad(`${f}: size ${d.size}`);
  });
}
console.log(`lines: ${Object.keys(P.PET_KINDS).length} (Pets v2: ${Object.keys(meta.lines).length})`);
let eggs = 0;
for (const f of Object.keys(P.FAMILIES)) for (const r of meta.rarities) {
  const it = ITEMS[P.eggId(f, r)], d = it && reg.resolve(it.reg);
  if (!it || !d || !d.anims.hatch) bad(`egg ${f} ${r}`); else eggs++;
  if (it && !it.name.startsWith(P.RARITY[r].name)) bad(`${it.id}: the name doesn't say its rarity`);
}
console.log(`eggs: ${eggs} with hatch clips`);
{
  const q = P.newPet('owlet', 'divine', 1), main = P.abilityOrder(q)[0], seen = [];
  for (const lv of [1, 29, 30, 99, 100]) { q.ab[main].lv = lv; seen.push(`${lv}:${P.petName(q)}`); }
  console.log('forms by level:', seen.join(' '));
  if (seen.join() !== '1:Owlet,29:Owlet,30:Great Owl,99:Great Owl,100:Starwise Owl') bad('forms do not follow the level');
}

// ---- hatching in the world
const g = new Game({ reg }, { fame: 0, gold: 99999, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0, pets: [], activePet: null });
g.newCharacter('priest'); g.god = true; g.enter('realm'); g.persist = () => {};
const p = g.player;
for (const [f, r] of [['avian', 'common'], ['spooky', 'rare'], ['exotic', 'divine']]) {
  g.enemies = g.map.enemies = [];
  p.inv[0] = P.eggId(f, r);
  const n0 = g.pets().length;
  g.useNow('inv', 0);
  if (!g.hatching) { bad(`using a ${f} ${r} egg did not start a hatch`); continue; }
  let at = null;
  for (let k = 0; k < 150 && g.hatching; k++) { g.update(1 / 60); if (at === null && g.pets().length > n0) at = g.hatching ? g.hatching.t : -1; }
  const pet = g.pets()[g.pets().length - 1];
  const ok = pet && P.PET_KINDS[pet.kind].family === f && pet.rarity === r && pet.ab.heal.lv === P.START_LV[r];
  console.log(`hatch ${f} ${r}: ${pet ? P.petName(pet) : '-'} level ${pet ? pet.ab.heal.lv : '-'}, out at ${at !== null ? at.toFixed(2) : '-'}s (burst ${(8 / 6).toFixed(2)}s)`);
  if (!ok) bad(`the ${f} ${r} egg hatched the wrong pet`);
  if (at === null || Math.abs(at - 8 / 6) > 0.03) bad('the pet did not come out on the burst frame');
  if (p.inv[0]) bad('the egg was not used up');
}
{                                                          // feeding across the first cap evolves
  const q = P.newPet('shiba_pup', 'uncommon', 28); g.pets().push(q); g.save.activePet = q.id; g.pet = null;
  for (let k = 0; k < 5; k++) g.update(1 / 60);
  g.save.gold = 1e6; const banners = [];
  const ob = g.banner.bind(g); g.banner = (t, ms) => { banners.push(t); ob(t, ms); };
  for (let k = 0; k < 12 && P.petStage(q) < 1; k++) { p.inv[1] = 'wand_t10'; g.feedPet('inv', 1, 'gold'); }
  g.update(1 / 60);
  console.log(`evolution: ${P.petName(q)} | ${banners.find((b) => /grows into/.test(b)) || 'no banner'} | sprite ${g.pet && g.pet.sprite}`);
  if (P.petStage(q) !== 1 || !banners.some((b) => /grows into a Shiba/.test(b)) || !(g.pet && g.pet.sprite === 'pt2_pets/shiba')) bad('evolution');
  if (!(g.pet && g.pet.joy > g.t)) bad('not happy after its meal');
}
{                                                          // an old save: old kinds and old eggs
  store.k = JSON.stringify({ chars: [{ id: 'c', cls: 'priest', inv: ['pet_egg_rare', null], equip: [] }], vaults: [['pet_egg_common']],
    pets: [{ id: 'a', kind: 'ember_fox', rarity: 'rare', ab: { heal: { lv: 40, xp: 3 }, magic: { lv: 12, xp: 0 }, shield: { lv: 5, xp: 0 } } }, { id: 'b', kind: 'star_wisp', rarity: 'common', level: 7 }], activePet: 'a' });
  const s = loadSave('k'), h = new Game({ reg }, s), L = h.pets();
  const inv = s.chars[0].inv[0], vault = s.vaults[0][0];
  console.log(`migration: pets ${L.map((q) => `${q.kind} (${P.petName(q)}, heal ${q.ab.heal.lv})`).join(', ')} | eggs ${inv}, ${vault}`);
  if (L[0].kind !== 'shiba_pup' || L[0].ab.heal.lv !== 40 || L[0].ab.heal.xp !== 3 || L[1].kind !== 'wisp_ghost' || L[1].ab.heal.lv !== 7) bad('old pets did not migrate intact');
  if (!/^egg_[a-z]+_rare$/.test(inv) || !ITEMS[inv] || !/^egg_[a-z]+_common$/.test(vault)) bad('old eggs did not migrate');
}
{                                                          // drops: harder lands step up, the land's families
  const tally = (land) => {
    const st = { r: {}, fam: {} };
    const b = g.map.biome, idx = BIOMES.indexOf(land);
    let x = 0, y = 0;
    for (let i = 0; i < b.length; i++) if (b[i] === idx) { x = (i % g.map.w) + 0.5; y = Math.floor(i / g.map.w) + 0.5; break; }
    for (let k = 0; k < 4000; k++) {
      const e = { x, y, D: {}, rb: true };
      const id = g.eggDrop(e); if (!id) continue;
      const it = ITEMS[id]; st.r[it.use.egg] = (st.r[it.use.egg] || 0) + 1; st.fam[it.use.family] = (st.fam[it.use.family] || 0) + 1;
    }
    return st;
  };
  const { BIOMES } = await import('../src/world/maps.js');
  const sh = tally('shore'), gf = tally('godfall');
  const share = (st, r) => (st.r[r] || 0) / Object.values(st.r).reduce((a, b) => a + b, 0);
  const local = (st, fams) => fams.reduce((n, f) => n + (st.fam[f] || 0), 0) / Object.values(st.fam).reduce((a, b) => a + b, 0);
  console.log(`drops: rare+ share shore ${(share(sh, 'rare') * 100).toFixed(1)}% vs godfall ${((share(gf, 'rare') + share(gf, 'legendary')) * 100).toFixed(1)}% | own families shore ${(local(sh, ['aquatic', 'reptile']) * 100).toFixed(0)}%, godfall ${(local(gf, ['spooky', 'exotic']) * 100).toFixed(0)}%`);
  if (!(share(gf, 'rare') + share(gf, 'legendary') > share(sh, 'rare') * 1.3)) bad('harder lands do not raise the odds');
  if (!(local(sh, ['aquatic', 'reptile']) > 0.55 && local(gf, ['spooky', 'exotic']) > 0.55)) bad('drops do not follow the land');
}
console.log(fail ? `${fail} problem(s)` : 'all OK');
process.exit(fail ? 1 : 0);
