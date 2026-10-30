// tools/css_cascade.js (2026-10-29): which style.css rule wins each property of each element, so a tangle of layered
// rules can be rewritten as one block that resolves to the same thing. Load it into the running page by hand:
//   const C = await import('/tools/css_cascade.js'); C.analyze(selector, states, inR, roleOf)
const PSEUDO_STATE = /:(hover|focus|focus-visible|focus-within|active)\b/g;

export function splitSel(s) {
  const out = []; let depth = 0, cur = '';
  for (const ch of s) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && !depth) { out.push(cur.trim()); cur = ''; } else cur += ch; }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
export function spec(sel) {
  let a = 0, b = 0, c = 0, s = sel;
  // :not()/:is()/:has() take their argument's specificity; :where() none
  s = s.replace(/:where\((?:[^()]|\([^()]*\))*\)/g, '');
  s = s.replace(/:(not|is|has)\(((?:[^()]|\([^()]*\))*)\)/g, (m, f, arg) => { const best = splitSel(arg).map(spec).sort(cmp).pop() || [0, 0, 0]; a += best[0]; b += best[1]; c += best[2]; return ''; });
  s = s.replace(/::[\w-]+/g, () => { c++; return ''; });
  s = s.replace(/#[\w-]+/g, () => { a++; return ''; });
  s = s.replace(/\.[\w-]+|\[[^\]]*\]|:[\w-]+(\([^)]*\))?/g, () => { b++; return ''; });
  for (const m of s.matchAll(/(^|[\s>+~])([a-zA-Z][\w-]*)/g)) c++;
  return [a, b, c];
}
export const cmp = (x, y) => (x[0] - y[0]) || (x[1] - y[1]) || (x[2] - y[2]);

export function sheetRules() {
  const sheet = [...document.styleSheets].find((s) => s.href && /style\.css/.test(s.href));
  const rules = []; let order = 0;
  const walk = (list, media) => {
    for (const r of list) {
      if (r.media && r.cssRules) { if (matchMedia(r.media.mediaText).matches) walk(r.cssRules, r.media.mediaText); continue; }
      if (!r.selectorText || !r.style) continue;
      const declared = new Set(); for (let i = 0; i < r.style.length; i++) declared.add(r.style[i]);
      rules.push({ r, sel: r.selectorText, parts: splitSel(r.selectorText), order: order++, media, declared });
    }
  };
  walk(sheet.cssRules, '');
  return rules;
}
function matchSpec(el, parts, stripState) {
  let best = null;
  for (let p of parts) {
    if (/::/.test(p)) continue;
    if (stripState) p = p.replace(PSEUDO_STATE, '');
    try { if (el.matches(p)) { const s = spec(p); if (!best || cmp(s, best) > 0) best = s; } } catch { /* a selector the browser can't test */ }
  }
  return best;
}
// the winner of property P on element el: { rule, imp } (or 'inline'), and whether a rule outside `R` declares it !important
export function winner(el, P, rules) {
  let w = null;
  for (const x of rules) {
    if (!x.declared.has(P)) continue;
    const s = matchSpec(el, x.parts, false); if (!s) continue;
    const imp = x.r.style.getPropertyPriority(P) === 'important';
    const c = { x, s, imp };
    if (!w || (c.imp !== w.imp ? c.imp : (cmp(c.s, w.s) || (c.x.order - w.x.order)) > 0)) w = c;
  }
  if (el.style && el.style.getPropertyValue(P) && !(w && w.imp)) return 'inline';
  return w;
}
export function importantElsewhere(el, P, rules, inR) {
  for (const x of rules) {
    if (inR(x) || !x.declared.has(P) || x.r.style.getPropertyPriority(P) !== 'important') continue;
    if (matchSpec(el, x.parts, true)) return true;     // (a :hover / :focus rule counts: it may apply in a state not tested)
  }
  return false;
}
// a longhand's value as written: the longhand itself, or (a var() in a shorthand leaves the longhand blank) its shorthand
export function valueOf(rule, P) {
  const v = rule.style.getPropertyValue(P);
  if (v) return { prop: P, text: v };
  const decls = rule.style.cssText.split(/;(?![^(]*\))/).map((d) => d.trim()).filter(Boolean).map((d) => { const k = d.indexOf(':'); return [d.slice(0, k).trim(), d.slice(k + 1).replace(/!\s*important/, '').trim()]; });
  const SH = (n) => P === n || P.startsWith(n + '-') || (n === 'border-radius' && /radius$/.test(P)) || (n === 'gap' && /gap$/.test(P)) || (n === 'font' && P === 'line-height') || (n === 'border' && /^border-(top|right|bottom|left)-(width|style|color)$|^border-image/.test(P)) || (/^border-(width|style|color)$/.test(n) && P.endsWith(n.slice(6))) || (n === 'inset' && /^(top|right|bottom|left)$/.test(P)) || (n === 'overflow' && /^overflow-[xy]$/.test(P));
  const hit = decls.filter(([n]) => SH(n)).pop();
  return hit ? { prop: hit[0], text: hit[1] } : null;
}

// rewrite the rules R (a predicate on a rule) for the elements `sel`, over the states [[name, on, off], ...]:
// for each element's role (its container and its own classes), the declarations R wins with, to emit as one block
export function analyze(sel, states, inR, roleOf) {
  const rules = sheetRules(), R = rules.filter(inR), props = new Set(); for (const x of R) for (const p of x.declared) props.add(p);
  const roles = new Map(), conflicts = [], unmatched = new Set(R.map((x) => x.sel));
  for (const [name, on, off] of states) {
    on();
    for (const el of document.querySelectorAll(sel)) {
      const role = roleOf(el); if (!role) continue;
      const M = roles.get(role) || roles.set(role, new Map()).get(role);
      for (const P of props) {
        const w = winner(el, P, rules);
        const rw = w && w !== 'inline' && inR(w.x);
        if (rw) unmatched.delete(w.x.sel);
        const v = rw ? valueOf(w.x.r, P) : null;
        const key = rw ? `${v ? v.prop : P}::${v ? v.text : '?'}` : 'other';
        const imp = rw && importantElsewhere(el, P, rules, inR);
        const prev = M.get(P);
        if (!prev) M.set(P, { key, v, imp, state: name });
        else { if (prev.key !== key) conflicts.push(`${role} | ${P}: ${prev.key} (${prev.state}) vs ${key} (${name})`); prev.imp = prev.imp || imp; }
      }
    }
    off();
  }
  for (const x of R) for (const p of x.parts) for (const el of document.querySelectorAll(sel)) { try { if (el.matches(p)) unmatched.delete(x.sel); } catch {} }
  // the block: per role, its R-won declarations (a shorthand once)
  const lines = [];
  for (const [role, M] of [...roles].sort((a, b) => a[0].length - b[0].length)) {
    const decl = new Map();
    for (const [, m] of M) if (m.v) { const k = m.v.prop; const d = decl.get(k); decl.set(k, { text: m.v.text, imp: (d && d.imp) || m.imp }); }
    if (decl.size) lines.push(`${role} { ${[...decl].map(([k, d]) => `${k}: ${d.text}${d.imp ? ' !important' : ''};`).join(' ')} }`);
  }
  return { css: lines.join('\n'), conflicts, unmatched: [...unmatched], rules: R.map((x) => x.sel) };
}
