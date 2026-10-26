#!/usr/bin/env python3
"""Splices the general-fitness exercises and the ready-made workouts into index.html.
Usage: python3 tools/gen-fitness.py   (idempotent: replaces whatever sits between the markers)"""
import json, os, re, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
sys.path.insert(0, here)
import fit_ex, fit_ready

def r5(x): return max(5, int(round(x / 5.0)) * 5)
def doses(scale, base):
    s, a, r = base
    if scale == '1': return [s, a, r]
    if scale == 'b': L = [(max(2, s - 1), max(4, round(a * .7)), r), (s, a, r), (s, round(a * 1.2), r), (s + 1, round(a * 1.4), r)]
    elif scale == 'w': L = [(max(2, s - 1), a, r), (s, a, r), (s, a, r), (s + 1, a, r)]
    elif scale == 't': L = [(max(2, s - 1), r5(a * .7), r), (s, a, r), (s, r5(a * 1.3), r), (s + 1, r5(a * 1.6), r)]
    else: raise SystemExit('bad scale ' + scale)
    return [list(x) for x in L]

rows = []
ids = set()
for (id, cat, eq, kind, scale, base, avoid, side, he, en, che, cen) in fit_ex.EX:
    assert id not in ids, id; ids.add(id)
    eq = eq.replace('bench|box', 'box').replace(',bench', ',box')
    rows.append("['%s','%s','%s','%s',%s,'%s',%d,%s,%s,%s,%s]," % (id, cat, eq, kind, json.dumps(doses(scale, base), separators=(',', ':')), avoid, side, json.dumps(he, ensure_ascii=False), json.dumps(en, ensure_ascii=False), json.dumps(che, ensure_ascii=False), json.dumps(cen, ensure_ascii=False)))
ex_block = '/*@fit-ex-start*/\n' + '\n'.join(rows) + '\n/*@fit-ex-end*/'

ready = []
for (id, cat, place, lvl, mins, needs, he, en, bhe, ben, warm, cool, rounds, items) in fit_ready.READY:
    ready.append(json.dumps([id, cat, place, lvl, mins, needs, he, en, bhe, ben, warm, cool, rounds, items], ensure_ascii=False, separators=(',', ':')))
ready_block = '/*@ready-start*/[\n' + ',\n'.join(ready) + '\n]/*@ready-end*/'

p = os.path.join(root, 'index.html'); s = open(p, encoding='utf-8').read()
if '/*@fit-ex-start*/' in s:
    s = re.sub(r'/\*@fit-ex-start\*/.*?/\*@fit-ex-end\*/', lambda m: ex_block, s, count=1, flags=re.S)
else:
    k = s.index('\n];\nconst EX = {};'); head = s[:k].rstrip(); head += '' if head.endswith(',') else ','; s = head + '\n' + ex_block + s[k:]
assert '/*@ready-start*/' in s or 'const READY_RAW = null;' in s, 'ready anchor missing'
if '/*@ready-start*/' in s:
    s = re.sub(r'/\*@ready-start\*/.*?/\*@ready-end\*/', lambda m: ready_block, s, count=1, flags=re.S)
else:
    s = s.replace('const READY_RAW = null;', 'const READY_RAW = ' + ready_block + ';', 1)
# which exercises have a photo in ex/
exdir = os.path.join(root, 'ex')
if os.path.isdir(exdir):
    ids = ' '.join(sorted(f[:-5] for f in os.listdir(exdir) if f.endswith('.webp')))
    s = re.sub(r"/\*@eximg-start\*/'[^']*'/\*@eximg-end\*/", lambda m: "/*@eximg-start*/'" + ids + "'/*@eximg-end*/", s, count=1)
open(p, 'w', encoding='utf-8').write(s)

# sanity: every exercise a workout names must exist (new rows above or already in EX_RAW)
known = set(re.findall(r"^\['([a-z0-9-]+)','(?:warm|grip|pull|push|core|legs|balance|swing|cool|glutes|arms|cardio)'", s, re.M))
bad = []
for w in fit_ready.READY:
    for it in w[13]:
        e = it.split(':')[0]
        if e not in known: bad.append((w[0], e))
print('exercises added:', len(rows), '| ready workouts:', len(ready), '| unknown ids:', bad)
from collections import Counter
print(Counter((w[2], w[1]) for w in fit_ready.READY))
