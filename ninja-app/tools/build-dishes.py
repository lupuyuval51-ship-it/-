# Builds nutrition/dishes.json from dishes_a/b/c.py and assigns stable ids (b01, l01, ...).
import json, os
g = {}
here = os.path.dirname(os.path.abspath(__file__))
for f in ['dishes_a.py', 'dishes_b.py', 'dishes_c.py']:
    exec(open(os.path.join(here, f), encoding='utf8').read(), g)
rows = g['A'] + g['B2'] + g['C']
prefix = {'breakfast': 'b', 'lunch': 'l', 'dinner': 'd', 'snack': 's', 'pre': 'p', 'post': 'o', 'drink': 'w'}
count, out = {}, []
for cat, he, en, kcal, p, c, f, tags, ihe, ien in rows:
    count[cat] = count.get(cat, 0) + 1
    tg = tags.split()
    if p >= 25 and 'hp' not in tg: tg.append('hp')
    out.append([prefix[cat] + '%02d' % count[cat], cat, he, en, kcal, p, c, f, ' '.join(tg), ihe, ien])
os.makedirs(os.path.join(here, '..', 'nutrition'), exist_ok=True)
json.dump(out, open(os.path.join(here, '..', 'nutrition', 'dishes.json'), 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
print(len(out), 'dishes')
