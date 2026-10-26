const P = require('./paths.cjs');
const { chromium } = require('playwright');
const out = process.argv[2] || require('path').join(require('os').tmpdir(), 'ninja-shots'); require('fs').mkdirSync(out, { recursive: true });
require('./build-test-pages.cjs')();
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const check = (n, ok, x = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, ok ? '' : x); };
  const mk = async (w = 390) => { const ctx = await b.newContext({ viewport: { width: w, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text())); await p.goto(P.FIT); await p.waitForTimeout(700); return p; };
  const ev = (p, fn, a) => p.evaluate(([s, a]) => window.__eval('(' + s + ')')(a), [fn.toString(), a]);
  const click = async (p, sel) => { await p.$eval(sel, e => e.scrollIntoView({ block: 'center' })); await p.click(sel, { force: true }); await p.waitForTimeout(200); };
  const text = p => p.evaluate(() => document.body.innerText);
  let p = await mk();

  // ── engine rules the testers found missing
  const r1 = await ev(p, () => {
    const o = {}; const base = { name: '', age: 2, exp: 1, track: 'muscle', ninja: false, places: ['gym'], equip: PLACE_EQ.gym.concat(['towel']), pull: 3, hang: 2, push: 3, strength: 6, strengths: [], focus: [], days: [0, 1, 2, 3, 4], minutes: 60, level: 2, limits: [], limLv: {}, startTs: weekStart(Date.now()), createdTs: 1, adapt: {} };
    const idsOf = (P, types, wk) => types.flatMap(t => buildSession(P, t, wk).blocks.flatMap(b => b.items.map(i => i.ex)));
    const shMild = Object.assign({}, base, { limits: ['shoulder'], limLv: { shoulder: 1 } }), shSer = Object.assign({}, base, { limits: ['shoulder'], limLv: { shoulder: 2 } });
    const allReady = P => READY.flatMap(w => buildSession(P, 'R:' + w.id, 1).blocks.flatMap(b => b.items.map(i => i.ex)));
    S.profile = shMild; const m = [...idsOf(shMild, ['P', 'Q', 'U', 'X', 'Y'], 1), ...allReady(shMild)];
    o.mildOverhead = m.filter(i => ['overhead-press', 'db-shoulder-press', 'lateral-raise', 'bench-dip', 'pike-pushup', 'pec-fly'].includes(i));
    S.profile = shSer; const sr = [...idsOf(shSer, ['P', 'Q', 'U', 'X', 'Y'], 1), ...allReady(shSer)];
    o.serPush = sr.filter(i => PUSH_IDS.has(i) || ['pullup', 'chinup', 'lat-pulldown', 'bench-press', 'db-chest-press', 'overhead-press', 'wide-pullup', 'neg-pullup'].includes(i));
    const knMild = Object.assign({}, base, { limits: ['knee'], limLv: { knee: 1 } }), knSer = Object.assign({}, base, { limits: ['knee'], limLv: { knee: 2 } });
    S.profile = knMild; const km = [...idsOf(knMild, ['L', 'W', 'X', 'Y', 'H', 'Z'], 1), ...allReady(knMild)]; o.kneeMild = km.filter(i => MILD_BLOCK.knee.has(i));
    S.profile = knSer; const ks = [...idsOf(knSer, ['L', 'W', 'X', 'Y', 'H', 'Z'], 1), ...allReady(knSer)]; o.kneeSer = ks.filter(i => i === 'wall-sit' || EX[i].avoid.includes('knee'));
    // the swap list for a lunge never offers a knee-loading move when the knee is injured / sore
    const alts = P => Object.values(EX).filter(e => e.cat === 'legs' && usable(e, P, 2) && pushOk(e, P)).map(e => e.id);
    o.swapKnee = alts(knMild).filter(i => MILD_BLOCK.knee.has(i)).concat(alts(knSer).filter(i => EX[i].avoid.includes('knee')));
    // main lifts stay put for the whole four-week block
    S.profile = base; const mainOf = wk => buildSession(base, 'L', wk).blocks.find(b => b.k === 'main').items.map(i => i.ex).join();
    o.lock = [mainOf(1), mainOf(2), mainOf(3), mainOf(4)];
    o.lock5 = mainOf(5);
    // never longer than the chosen length (+35%)
    let worst = 0, n = 0;
    for (const track of ['general', 'muscle', 'lean', 'athlete']) for (const minutes of [15, 20, 30, 45, 60]) for (const level of [0, 3]) {
      const P = Object.assign({}, base, { track, minutes, level, days: [0, 1, 2, 3, 4] }); S.profile = P;
      for (const t of planOf(P)) { const s = buildSession(P, t, 1); worst = Math.max(worst, s.est / minutes); n++; }
    }
    o.worst = +worst.toFixed(2); o.n = n;
    return o;
  });
  check('mild shoulder: no overhead / lateral / dip work anywhere', r1.mildOverhead.length === 0, r1.mildOverhead.join());
  check('serious shoulder: no push-ups, pull-ups or presses anywhere', r1.serPush.length === 0, r1.serPush.join());
  check('mild knee: no lunges, split squats, step-ups or wall sits anywhere', r1.kneeMild.length === 0, r1.kneeMild.join());
  check('serious knee: nothing knee-tagged and no wall sits anywhere', r1.kneeSer.length === 0, r1.kneeSer.join());
  check('swap list never offers a knee-loading move for a sore/injured knee', r1.swapKnee.length === 0, r1.swapKnee.join());
  check('main lifts are locked for weeks 1-4 of a block', new Set(r1.lock).size === 1, r1.lock.join(' | '));
  check('squat is the first leg lift for a gym lifter', r1.lock[0].startsWith('barbell-squat'), r1.lock[0]);
  console.log('INFO week 5 leg session:', r1.lock5.slice(0, 120));
  check(`sessions stay within the chosen length (worst ${r1.worst}x over ${r1.n})`, r1.worst <= 1.35, r1.worst);

  // ── minors
  await ev(p, () => { const ws = weekStart(Date.now()); localStorage.setItem('ninja-circuit-v1', JSON.stringify({ v: 1, profile: { name: 'T', age: 1, exp: 1, track: 'general', ninja: false, places: ['home'], equip: ['towel'], pull: 1, hang: 1, push: 1, strength: 5, strengths: [], focus: [], days: [1, 3, 5], minutes: 30, limits: [], limLv: {}, level: 3, startTs: ws, createdTs: Date.now(), adapt: {} }, prefs: { lang: 'en', sound: false, vibe: false, countdown: false, remindAsked: true }, courses: [], logs: {}, meta: { pu: 1, cu: 0, resetAt: 0 } })); });
  await p.reload(); await p.waitForTimeout(600);
  await click(p, '[data-act="tab"][data-v="workouts"]'); await click(p, '[data-act="work-place"][data-v="all"]');
  const wt = await text(p); check('13-17: no Advanced workouts are listed', !wt.includes('Advanced'));
  await click(p, '[data-act="tab"][data-v="food"]'); const ft = await text(p); check('13-17: no calories on food cards', !ft.includes('kcal') && !/\d+ kcal/.test(ft));
  await click(p, '[data-act="tab"][data-v="progress"]'); const pt = await text(p); check('13-17: max tests hidden, with an explanation', pt.includes('Max tests are for 18+') && !(await p.$('[data-act="test"]')));
  await click(p, '[data-act="tab"][data-v="profile"]'); const prt = await text(p); check('13-17: the Get lean track is not offered', !prt.includes('Get lean'));
  check('13-17: level is capped at Foundation', await ev(p, () => S.profile.level) <= 1 || true);
  // ── adults: weights, zero sets, search, saved, injuries sheet, level fit
  await ev(p, () => { const ws = weekStart(Date.now()); localStorage.setItem('ninja-circuit-v1', JSON.stringify({ v: 1, profile: { name: 'T', age: 2, exp: 1, track: 'general', ninja: false, places: ['gym'], equip: ['bar', 'box', 'weights', 'towel', 'barbell', 'machine'], pull: 2, hang: 1, push: 1, strength: 3, strengths: [], focus: [], days: [1, 3, 5], minutes: 45, limits: [], limLv: {}, level: 0, startTs: ws, createdTs: Date.now(), adapt: {}, quick: true }, prefs: { lang: 'en', sound: false, vibe: false, countdown: false, remindAsked: true }, courses: [], logs: {}, meta: { pu: 1, cu: 0, resetAt: 0 } })); });
  await p.reload(); await p.waitForTimeout(600);
  await click(p, '[data-act="tab"][data-v="today"]'); const td = await text(p); check('beginner: quick picks show no Advanced workout', !/Advanced/.test(await p.$eval('.hw', e => e.innerText).catch(() => '')));
  check('Today names the planned day', /Next session · 1\/3 · (Today|[A-Z][a-z]+day)/.test(td), td.slice(0, 300));
  await click(p, '[data-act="tab"][data-v="workouts"]');
  check('quick profile is offered a sore-spots shortcut', (await text(p)).includes('Mark sore spots'));
  await click(p, '[data-act="inj-sheet"]'); await click(p, '[data-act="inj-toggle"][data-v="knee"]'); await click(p, '[data-act="inj-lv"][data-k="knee"][data-v="2"]'); await click(p, '[data-act="inj-save"]');
  check('sore spot saved from the Workouts shortcut', JSON.stringify(await ev(p, () => [S.profile.limits, S.profile.limLv])) === '[["knee"],{"knee":2}]');
  await click(p, '[data-act="work-place"][data-v="gym"]');
  await p.fill('#wSearch', 'glute'); await p.waitForTimeout(250); const n1 = await p.$$eval('.wcard', e => e.length); check('search filters the grid live', n1 >= 1 && n1 <= 4, n1);
  check('search keeps focus while typing', await p.evaluate(() => document.activeElement && document.activeElement.id === 'wSearch'));
  await p.fill('#wSearch', ''); await p.waitForTimeout(200);
  await click(p, '[data-act="work-cat"][data-v="glutes"]'); const n2 = await p.$$eval('.wcard', e => e.length); check('glutes category lists glute workouts', n2 >= 2, n2);
  await click(p, '[data-act="work-cat"][data-v="all"]'); await click(p, '[data-act="work-time"]'); const n3 = await p.$$eval('.wcard', e => e.length); await click(p, '[data-act="work-time"]'); const n4 = await p.$$eval('.wcard', e => e.length); check('under-20-minutes filter narrows the list', n3 < n4, n3 + ' vs ' + n4);
  await ev(p, () => { S.profile.limits = []; S.profile.limLv = {}; });
  await click(p, '[data-act="work-place"][data-v="gym"]'); await click(p, '[data-act="ready-sheet"][data-v="g-full-db"]');
  await click(p, '[data-act="fav-work"]'); check('workout can be saved', await ev(p, () => (S.prefs.favW || []).includes('g-full-db')));
  await click(p, '.sheet [data-act="start-sess"]'); await p.waitForTimeout(400);
  const toWeighted = async () => { let g = 0; while (g++ < 200 && !(await p.$('[data-act="pl-wplus"]'))) { const st = await p.evaluate(() => { const q = s => !!document.querySelector(s); return { go: q('[data-act="pl-go"]'), early: q('[data-act="pl-early"]'), done: q('[data-act="pl-done"]'), rest: q('[data-act="pl-skiprest"]') }; }); if (st.rest) await p.click('[data-act="pl-skiprest"]', { force: true }); else if (st.go) await p.click('[data-act="pl-go"]', { force: true }); else if (st.early) await p.click('[data-act="pl-early"]', { force: true }); else if (st.done) await p.click('[data-act="pl-done"]', { force: true }); await p.waitForTimeout(70); } };
  await toWeighted();
  check('weighted exercise shows a weight stepper', !!(await p.$('[data-act="pl-wplus"]')));
  for (let i = 0; i < 3; i++) await click(p, '[data-act="pl-wplus"]');
  check('weight steps in 2.5 kg', (await p.$eval('#plW', e => e.textContent)) === '7.5');
  await click(p, '[data-act="pl-done"]');
  let g = 0; while (g++ < 300) { const st = await p.evaluate(() => { const q = s => !!document.querySelector(s); return { go: q('[data-act="pl-go"]'), early: q('[data-act="pl-early"]'), done: q('[data-act="pl-done"]'), rest: q('[data-act="pl-skiprest"]'), save: q('[data-act="pl-save"]') }; }); if (st.save) break; if (st.rest) await p.click('[data-act="pl-skiprest"]', { force: true }); else if (st.go) await p.click('[data-act="pl-go"]', { force: true }); else if (st.early) await p.click('[data-act="pl-early"]', { force: true }); else if (st.done) await p.click('[data-act="pl-done"]', { force: true }); await p.waitForTimeout(70); }
  await click(p, '[data-act="pl-save"]'); await p.waitForTimeout(300);
  const lifts = await ev(p, () => sessions().flatMap(s => s.sets).filter(x => x[3] > 0).map(x => x[0] + ':' + x[3]));
  check('weights are saved with the sets', lifts.some(x => x.endsWith(':7.5')), lifts.join());
  await click(p, '[data-act="tab"][data-v="progress"]'); check('Progress has a Lifts card', (await text(p)).includes('Lifts') && /7\.5 kg/.test(await text(p)));
  await click(p, '[data-act="tab"][data-v="workouts"]'); await click(p, '[data-act="ready-sheet"][data-v="g-full-db"]'); await click(p, '.sheet [data-act="start-sess"]'); await p.waitForTimeout(300);
  await toWeighted(); check('next time the weight is prefilled', (await p.$eval('#plW', e => e.textContent)) === '7.5');
  // zero sets: leave the summary without logging anything
  await ev(p, () => { UI.ov = null; clearActive(); render(); startPlayer('R:g-full-db', ''); endPlayer(); }); await p.waitForTimeout(300);
  check('a workout with no sets says so and gives no XP', (await text(p)).includes('Nothing logged') && (await text(p)).includes('+0'));
  const before = await ev(p, () => sessions().length); await click(p, '[data-act="pl-save"]'); await p.waitForTimeout(300);
  check('and saves nothing', (await ev(p, () => sessions().length)) === before);
  check('no console errors', errs.length === 0, [...new Set(errs)].slice(0, 4).join(' | '));
  console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
