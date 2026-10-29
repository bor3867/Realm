"""style.css: take out what can never apply (2026-10-29). The sheet grew in layers, each later one overriding the
earlier; much of the earlier is now dead. A declaration is dead when a LATER rule in the SAME context (top level, or
the same @media) has the SAME selector and sets the SAME property, at least as important (an !important one is only
beaten by a later !important). Same selector, so same specificity and the same elements: the later one always wins,
everywhere. Only those are removed (a rule left empty goes too); nothing else changes, comments stay.
  py -I tools/css_prune.py           report
  py -I tools/css_prune.py --write   rewrite style.css
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATH = os.path.join(ROOT, 'style.css')
src = open(PATH, encoding='utf8').read()


def skip_comment(s, i):
    j = s.find('*/', i + 2)
    return len(s) if j < 0 else j + 2


def parse(s, i, ctx, out):
    """rules from i to the closing brace (or the end): out gets (ctx, selector, block_start, block_end, rule_start)"""
    n = len(s)
    while i < n:
        if s.startswith('/*', i):
            i = skip_comment(s, i); continue
        if s[i] in ' \t\r\n':
            i += 1; continue
        if s[i] == '}':
            return i + 1
        # a prelude up to '{' or ';'
        j, start = i, i
        while j < n and s[j] not in '{;':
            if s.startswith('/*', j): j = skip_comment(s, j); continue
            if s[j] in '"\'':
                q = s[j]; j += 1
                while j < n and s[j] != q: j += 2 if s[j] == '\\' else 1
            j += 1
        if j >= n: return n
        pre = s[start:j].strip()
        if s[j] == ';':                                   # @import, @charset
            i = j + 1; continue
        if pre.startswith('@media') or pre.startswith('@supports'):
            i = parse(s, j + 1, ctx + (re.sub(r'\s+', ' ', pre),), out); continue
        if pre.startswith('@'):                            # @keyframes, @font-face: left whole
            depth, k = 1, j + 1
            while k < n and depth:
                if s.startswith('/*', k): k = skip_comment(s, k); continue
                depth += {'{': 1, '}': -1}.get(s[k], 0); k += 1
            i = k; continue
        k = j + 1                                          # a style rule: its block to the matching '}'
        while k < n and s[k] != '}':
            if s.startswith('/*', k): k = skip_comment(s, k); continue
            if s[k] in '"\'':
                q = s[k]; k += 1
                while k < n and s[k] != q: k += 2 if s[k] == '\\' else 1
            k += 1
        out.append((ctx, pre, j + 1, k, start))
        i = k + 1
    return i


def decls(s, a, b):
    """the declarations of a block: (prop, important, start, end) with end past its ';'"""
    res, i = [], a
    while i < b:
        if s.startswith('/*', i): i = skip_comment(s, i); continue
        if s[i] in ' \t\r\n;': i += 1; continue
        j, paren = i, 0
        while j < b:
            if s.startswith('/*', j): j = skip_comment(s, j); continue
            c = s[j]
            if c in '"\'':
                q = c; j += 1
                while j < b and s[j] != q: j += 2 if s[j] == '\\' else 1
            elif c == '(': paren += 1
            elif c == ')': paren -= 1
            elif c == ';' and paren == 0: break
            j += 1
        text = s[i:j]
        if ':' in text:
            prop = text.split(':', 1)[0].strip().lower()
            res.append((prop, '!important' in text.replace(' ', '').lower(), i, min(j + 1, b)))
        i = j + 1
    return res


def norm_sel(sel):
    sel = re.sub(r'/\*.*?\*/', '', sel, flags=re.S)
    return [re.sub(r'\s+', ' ', p.strip()) for p in sel.split(',') if p.strip()]


MODERN = re.compile(r'dvh|svh|lvh|dvw|color-mix|clamp\(|min\(|max\(|clip|:has\(|backdrop-filter|zoom|inset|aspect-ratio|gap|-webkit-|-moz-|var\(--[a-z-]+,', re.I)
rules = []
parse(src, 0, (), rules)
info = []
for ctx, sel, a, b, start in rules:
    info.append((ctx, norm_sel(sel), decls(src, a, b), a, b, start))

# for each (context, single selector, property): the later rules' best importance seen so far, walking back
later = {}                     # (ctx, sel, prop) -> True if a later decl is !important, False if only normal
dead = []                      # (start, end) spans to cut
rule_dead = set()
for ri in range(len(info) - 1, -1, -1):
    ctx, sels, ds, a, b, start = info[ri]
    if not sels or any(':hover' in x and False for x in sels):
        pass
    gone, mine = 0, []
    for prop, imp, s0, s1 in reversed(ds):
        beaten = all((ctx, x, prop) in later and (later[(ctx, x, prop)] or not imp) for x in sels)
        if beaten:
            dead.append((s0, s1)); gone += 1
        # (a later value only counts if every browser takes it: a newer feature may be dropped, and then this one
        # applies. And a property twice in one rule is left alone: that's how fallbacks are written)
        if not MODERN.search(src[s0:s1]): mine.append((prop, imp))
    for prop, imp in mine:
        for x in sels:
            k = (ctx, x, prop)
            later[k] = later.get(k, False) or imp
    if ds and gone == len(ds):
        rule_dead.add(ri)

# a rule whose every declaration died: cut it whole (from its selector to its '}'), with the line it stood on
cuts = []
for ri in rule_dead:
    ctx, sels, ds, a, b, start = info[ri]
    s0 = src.rfind('\n', 0, start) + 1
    s1 = b + 1
    if src[s0:start].strip() == '' and src[s1:src.find('\n', s1) if src.find('\n', s1) >= 0 else len(src)].strip() == '':
        s1 = src.find('\n', s1) + 1 if src.find('\n', s1) >= 0 else len(src)
    else:
        s0 = start
    cuts.append((s0, s1))
whole = {(info[ri][3], info[ri][4]) for ri in rule_dead}
for s0, s1 in dead:                                       # declarations inside rules that live on
    if not any(info[ri][3] <= s0 < info[ri][4] for ri in rule_dead):
        e = s1
        while e < len(src) and src[e] == ' ': e += 1     # (and the space after it)
        cuts.append((s0, e))
cuts.sort()
out, pos = [], 0
for s0, s1 in cuts:
    if s0 < pos: continue
    out.append(src[pos:s0]); pos = s1
out.append(src[pos:])
new = ''.join(out)
new = re.sub(r'\{\s+\}', '{ }', new)
print(f'{len(rules)} rules, {sum(len(d) for *_, d, _, _, _ in [(0, 0, x[2], 0, 0, 0) for x in info])} declarations')
print(f'dead: {len(dead)} declarations, {len(rule_dead)} whole rules; {len(src.splitlines())} -> {len(new.splitlines())} lines, {len(src)} -> {len(new)} bytes')
if '--write' in sys.argv:
    open(PATH, 'w', encoding='utf8', newline='\n').write(new)
    print('written')
if '--out' in sys.argv:                                  # (to a side file, to compare in the browser first)
    open(os.path.join(ROOT, sys.argv[sys.argv.index('--out') + 1]), 'w', encoding='utf8', newline='\n').write(new)
