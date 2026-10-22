// The Mad God Armory's tooltip, as the armory lays it out (src/data/armory_data.js): name and kind in the tier's colour,
// its role, the description, the stats (shots, damage, speed, range, rate of fire; or mana, cooldown and parts for an
// ability), the "on hit" flags, what it adds on equip, its special lines (a Price in red), its projectiles, the set it
// belongs to, and Soulbound.
import { ARMORY_SETS } from './data/armory_data.js';
import { stillURL } from './armory_art.js';

export const ARM_COL = { UT: '#f2c94c', Mythic: '#c58cff', Legendary: '#ffa94d', Celestial: '#ff6584', Divine: '#fff1b8' };
const FLAGTXT = { MultiHit: 'Shots hit multiple targets', PassesCover: 'Shots pass through obstacles', ArmorPiercing: 'Ignores defense', Boomerang: 'Shots boomerang', Wavy: 'Shots are wavy' };
const kindOf = (A) => (A.cls === 'Tome' ? 'Tome' : A.st.ability ? 'Ability · ' + A.st.ability : A.cls);
const RNG = (s) => (s.speed ? (s.speed * s.lt) / 10000 : s.beam || s.target || 7);
const shotURL = new Map();

// worn: the names of the armory pieces the player has on (for the set block)
export function armoryTip(it, worn = []) {
  const A = it.arm, s = A.st, tc = ARM_COL[A.tier], rows = [];
  if (s.passive) { rows.push(['Slot', A.cls]); if (s.equip && s.equip.DEF) rows.push(['Defense', s.equip.DEF]); if (s.cd) rows.push(['Cooldown', s.cd + 's']); }
  else if (s.heal) { rows.push(['MP Cost', s.mp], ['Cooldown', s.cd + 's']); s.parts.forEach(([n, r]) => rows.push([n, '+' + r[0]])); }
  else if (s.ability) {
    rows.push(['MP Cost', s.mp], ['Cooldown', s.cd + 's']);
    if (s.elements) Object.entries(s.elements).forEach(([n, r]) => rows.push([n, r.join('–')]));
    else s.parts.forEach(([n, r]) => rows.push([n, r[0] === r[1] ? 'up to ' + r[1] : r.join('–')]));
  } else {
    rows.push(['Shots', s.shots], ['Damage', s.dmg.join('–')]);
    if (s.speed) rows.push(['Projectile Speed', (s.speed / 10).toFixed(1) + ' tiles/s']);
    rows.push([s.beam ? 'Beam Length' : s.target ? 'Target Range' : 'Range', RNG(s).toFixed(1) + ' tiles'], ['Rate of Fire', Math.round(s.rof * 100) + '%']);
  }
  if (s.on_hit) rows.push(['On Hit', s.on_hit[0] + ' ' + s.on_hit[1] + 's']);
  (s.extra || []).forEach(([n, r]) => { if (r[1]) rows.push(['↳ ' + n, r.join('–')]); });
  const eq = Object.entries(s.equip || {}).map(([k, v]) => `<span class="${v > 0 ? 'pos' : 'neg'}">${v > 0 ? '+' : '−'}${Math.abs(v)} ${k}</span>`).join(' ');
  const flags = (s.flags || []).map((f) => FLAGTXT[f]).join(' · ');
  const shots = A.shots.map((d, i) => {
    const k = A.name + '|' + i;
    if (!shotURL.has(k)) shotURL.set(k, stillURL(d, 32));
    return `<i class="arm-shot" title="${A.shotNames[i] || A.name}" style="background-image:url(${shotURL.get(k)})"></i>`;
  }).join('');
  let set = '';
  if (A.set) {
    const S = ARMORY_SETS[A.set], have = S.pieces.filter((n) => worn.includes(n)).length;
    set = `<div class="arm-set"><div class="arm-setname">${S.name} (${have}/${S.pieces.length})</div><div class="arm-pieces">${S.pieces.map((n) => `<span class="${worn.includes(n) ? 'on' : ''}">${n}</span>`).join('')}</div>
      <ul>${S.bonus.map(([n, txt]) => `<li class="${have >= n ? 'on' : ''}"><b>${n} pieces</b> ${txt}</li>`).join('')}</ul></div>`;
  }
  return `<div class="arm-tip" style="--tc:${tc}"><div class="th"><div><h4 style="color:${tc}">${A.name}</h4><div class="t">${kindOf(A)} · ${A.tier === 'UT' ? 'Untiered' : A.tier}${it.adminOnly ? ' · admin only' : ''}</div>
    <span class="arm-role">${s.role}</span></div></div>
    <div class="flav">${A.desc}</div>
    <div class="sec stats">${rows.map(([a, b]) => `<div class="kv"><span>${a}</span><b class="arm-v">${b}</b></div>`).join('')}</div>
    ${flags ? `<div class="sec arm-flags">${flags}</div>` : ''}${eq ? `<div class="sec arm-eq"><span class="lbl">On Equip</span> ${eq}</div>` : ''}
    <ul class="sec arm-special">${s.special.map((x) => `<li${x.startsWith('Price:') ? ' class="price"' : ''}>${x}</li>`).join('')}</ul>
    <div class="sec arm-shots"><span class="lbl">Projectile${A.shots.length > 1 ? 's' : ''}</span>${shots}</div>
    ${set}<div class="arm-sb">Soulbound</div></div>`;
}
