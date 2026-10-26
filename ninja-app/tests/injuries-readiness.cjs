const P = require('./paths.cjs');
const { chromium } = require('playwright');
const URL = P.FIT;
const out = process.argv[2] || require('path').join(require('os').tmpdir(), 'ninja-shots'); require('fs').mkdirSync(out, { recursive: true });
const EQ = ['bar', 'rings', 'rope', 'monkey', 'beam', 'wall', 'box', 'towel', 'ninja', 'weights'];
const mk = over => ({ v: 1, profile: Object.assign({ name: 'T', age: 2, exp: 2, goal: 0, places: ['ninja'], equip: EQ, pull: 3, hang: 2, push: 2, strength: 7, strengths: [], focus: ['grip', 'legs'], days: [0, 1, 2, 3, 4], minutes: 45, limits: [], level: 3, startTs: Date.now() - 864e5, createdTs: Date.now(), adapt: {} }, over), prefs: { lang: 'he', sound: false, vibe: false, countdown: false }, courses: [], logs: {}, meta: { pu: 1, cu: 0, resetAt: 0 } });
(async () => {
  const browser = await chromium.launch(); const errs = []; let fails = 0;
  const check = (n, ok, x = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, ok ? '' : x); };
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const wrap = pg => { const o = pg.evaluate.bind(pg); pg.evaluate = (fn, arg) => typeof fn === 'function' ? o(([src, a]) => window.__eval('(' + src + ')')(a), [fn.toString(), arg]) : o(fn, arg); };
  wrap(page);
  await page.goto(URL);
  // run the engine for every type/week on a profile
  const all = over => page.evaluate(o => {
    const P = Object.assign({}, S.profile, o); const res = [];
    for (const type of ['A', 'B', 'C', 'D', 'E', 'F']) for (let w = 1; w <= 4; w++) { const s = buildSession(P, type, w); res.push({ type, w, ids: s.blocks.flatMap(b => b.items.map(i => i.ex)), pre: s.blocks.flatMap(b => b.items.filter(i => i.pre).map(i => i.ex)), items: s.blocks.flatMap(b => b.items), notes: s.notes.map(n => n.k), warm: s.blocks[0].items.length, est: s.est }); }
    return res;
  }, over);
  await page.evaluate(d => { localStorage.setItem('ninja-circuit-v1', JSON.stringify(d)); }, mk({}));
  await page.reload(); await page.waitForTimeout(400);
  const ids = r => r.flatMap(x => x.ids);
  const tagged = (tag, ids) => page.evaluate(([tag, ids]) => ids.filter(i => EX[i].avoid.includes(tag)), [tag, ids]);
  const base = await all({});
  check('baseline has many exercises', new Set(ids(base)).size > 30, new Set(ids(base)).size);
  // serious injuries remove every tagged exercise
  for (const area of ['shoulder', 'elbow', 'wrist', 'back', 'hip', 'knee', 'ankle']) {
    const r = await all({ limits: [area], limLv: { [area]: 2 } });
    const bad = await tagged(area, [...new Set(ids(r))]);
    check(`serious ${area}: nothing that loads it`, bad.length === 0, bad.join());
    const wasThere = await tagged(area, [...new Set(ids(base))]);
    check(`serious ${area}: baseline did contain such exercises (${wasThere.length})`, wasThere.length > 0);
    check(`serious ${area}: prehab added`, r.filter(x => x.type !== 'F').every(x => x.pre.length >= 1), JSON.stringify(r.filter(x => !x.pre.length && x.type !== 'F').map(x => x.type + x.w)));
    check(`serious ${area}: still builds real sessions`, r.every(x => x.items.length >= 4), r.filter(x => x.items.length < 4).map(x => x.type + x.w).join());
    check(`serious ${area}: note shown`, r.every(x => x.type === 'F' || x.notes.includes('inj')));
  }
  // mild: no explosive, but milder moves stay, with lower dose
  const mildK = await all({ limits: ['knee'], limLv: { knee: 1 } });
  const high = await page.evaluate(() => [...HIGH]);
  const mildBad = await page.evaluate(ids => ids.filter(i => EX[i].avoid.includes('knee') && HIGH.has(i)), [...new Set(ids(mildK))]);
  check('mild knee: no HIGH knee-tagged', mildBad.length === 0, mildBad.join());
  const mildGone = await page.evaluate(ids => ids.filter(i => MILD_BLOCK.knee.has(i)), [...new Set(ids(mildK))]);
  check('mild knee: lunges, split squats and wall sits are gone too', mildGone.length === 0, mildGone.join());
  const dose = await page.evaluate(() => { const find = P => { const s = buildSession(P, 'R:h-legs-base', 1); const it = s.blocks.flatMap(b => b.items).find(i => i.ex === 'bw-squat'); return it && { a: it.amt, r: it.rest }; }; const base = Object.assign({}, S.profile, { limits: [], limLv: {}, equip: ['towel'] }); return [find(base), find(Object.assign({}, base, { limits: ['knee'], limLv: { knee: 1 } }))]; });
  check('mild knee: squats stay but with a lower dose and longer rest', dose[0] && dose[1] && dose[1].a < dose[0].a && dose[1].r > dose[0].r, JSON.stringify(dose));
  // legacy profile (no limLv) acts as serious
  const legacy = await all({ limits: ['knee'], limLv: undefined });
  check('legacy knee limit = serious', (await tagged('knee', [...new Set(ids(legacy))])).length === 0);
  // multiple areas
  const multi = await all({ limits: ['knee', 'shoulder', 'wrist'], limLv: { knee: 2, shoulder: 2, wrist: 1 } });
  const mb = await page.evaluate(ids => ids.filter(i => EX[i].avoid.includes('knee') || EX[i].avoid.includes('shoulder')), [...new Set(ids(multi))]);
  check('multi areas: knee+shoulder fully clean', mb.length === 0, mb.join());
  check('multi areas: prehab capped at 3', multi.every(x => x.pre.length <= 3));
  // ages
  const a4 = await all({ age: 4, level: 3 });
  const imp = await page.evaluate(() => [...IMPACT]);
  check('45+: no impact exercises', ids(a4).every(i => !imp.includes(i)), ids(a4).filter(i => imp.includes(i)).join());
  check('45+: sessions still build', a4.every(x => x.items.length >= 4));
  check('45+: note shown', a4.every(x => x.notes.includes('age4')));
  const lv4 = await page.evaluate(() => levelFrom({ age: 4, exp: 3, pull: 3, hang: 3, strength: 10 }));
  check('45+: level capped at 2', lv4 === 2, lv4);
  const lv1 = await page.evaluate(() => [levelFrom({ age: 1, exp: 3, pull: 3, hang: 3, strength: 10 }), levelFrom({ age: 0, exp: 3, pull: 3, hang: 3, strength: 10 }), levelFrom({ age: 2, exp: 3, pull: 3, hang: 3, strength: 10 }), levelFrom({ age: 3, exp: 3, pull: 3, hang: 3, strength: 10 })]);
  check('level caps by age 13-17 / <=12 / adults', lv1.join() === '1,1,3,3', lv1.join());
  const rest = await page.evaluate(() => { const mainRest = P => { const s = buildSession(P, 'A', 1); return s.blocks.find(b => b.k === 'main').items[0].rest; }; return [2, 3, 4].map(a => mainRest(Object.assign({}, S.profile, { age: a, level: 2, minutes: 45 }))); });
  check('older = longer rest (18-29 < 30-44 < 45+)', rest[0] < rest[1] && rest[1] < rest[2], rest.join());
  const w20 = await page.evaluate(() => [2, 3].map(a => buildSession(Object.assign({}, S.profile, { age: a, minutes: 20 }), 'A', 1).blocks[0].items.length));
  check('30-44 gets full warm-up even in 20 min', w20[1] > w20[0], w20.join());
  const kid = await all({ age: 0, level: 1 });
  const kb = await page.evaluate(ids => ids.filter(i => EX[i].avoid.includes('kid')), [...new Set(ids(kid))]);
  check('<=12: no kid-blocked moves', kb.length === 0, kb.join());
  // readiness
  const rd = await page.evaluate(() => {
    const out = {}; for (const v of [0, 1, 3]) { S.ready = v ? { ts: Date.now(), v } : null; const s = buildSession(S.profile, 'A', 1); out[v] = { notes: s.notes.map(n => n.k), tot: s.blocks.flatMap(b => b.items).reduce((n, i) => n + i.sets * i.amt, 0), est: s.est }; }
    S.ready = null; return out;
  });
  check('tired: less volume than normal', rd[1].tot < rd[0].tot, JSON.stringify(rd));
  check('peak: more volume than normal', rd[3].tot > rd[0].tot, JSON.stringify(rd));
  check('readiness notes', rd[1].notes.includes('rd1') && rd[3].notes.includes('rd3') && !rd[0].notes.some(k => k.startsWith('rd')));
  const stale = await page.evaluate(() => { S.ready = { ts: Date.now() - 2 * 864e5, v: 1 }; const v = readyNow(); S.ready = null; return v; });
  check('readiness expires after the day', stale === 0, stale);

  // ── UI: onboarding limits, cycling, today cards, profile
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx2.newPage(); p.on('pageerror', e => errs.push('p2 ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('p2 ' + m.text()); });
  const click = async sel => { await p.$eval(sel, e => e.scrollIntoView({ block: 'center' })); await p.click(sel, { force: true }); await p.waitForTimeout(120); };
  wrap(p); await p.goto(URL); await p.waitForTimeout(900); await p.evaluate(() => { const b = document.querySelector('[data-act="lang"][data-v="he"]'); b && b.click(); }); await p.waitForTimeout(250);
  await click('[data-act="ob-next"]'); await p.fill('#obName', 'דנה'); await click('[data-f="age"][data-v="4"]');
  const note1 = await p.evaluate(() => document.body.innerText); check('age 45+ note visible on step 1', note1.includes('בלי קפיצות ונחיתות'));
  await click('[data-act="ob-next"]');
  check('injuries are the second question', (await p.evaluate(() => document.body.innerText)).includes('משהו שחשוב שנדע'));
  check('next is disabled with a hint until the box is ticked', await p.$eval('[data-act="ob-next"]', e => e.disabled) && (await p.evaluate(() => document.body.innerText)).includes('סמנו את תיבת האישור'));
  const lab = async k => p.$eval(`[data-act="ob-lim"][data-v="${k}"]`, e => e.innerText + '|' + e.className + '|' + e.getAttribute('aria-pressed'));
  check('chips exist for 7 areas + none', (await p.$$('[data-act="ob-lim"]')).length === 8);
  await click('[data-act="ob-lim"][data-v="knee"]'); check('knee tap selects it', (await lab('knee')).endsWith('true'), await lab('knee'));
  check('a Sore / Injured control appears (default Sore)', await p.$eval('[data-act="ob-limlv"][data-k="knee"][data-v="1"]', e => e.className.includes('l1')));
  await click('[data-act="ob-limlv"][data-k="knee"][data-v="2"]'); check('knee set to Injured', await p.$eval('[data-act="ob-limlv"][data-k="knee"][data-v="2"]', e => e.className.includes('l2')));
  await click('[data-act="ob-lim"][data-v="wrist"]');
  await p.screenshot({ path: `${out}/inj-onboarding.png` });
  await click('[data-act="ob-lim"][data-v="back"]'); await click('[data-act="ob-lim"][data-v="back"]');
  check('back tap twice = cleared', (await lab('back')).endsWith('false'), await lab('back'));
  await click('[data-act="ob-ack"]'); await click('[data-act="ob-next"]');
  await click('[data-f="track"][data-v="ninja"]'); await p.waitForTimeout(450);
  await click('[data-f="exp"][data-v="1"]'); await p.waitForTimeout(450);
  await click('[data-f="places"][data-v="ninja"]'); await click('[data-act="ob-next"]'); await click('[data-act="ob-next"]');
  await click('[data-f="pull"][data-v="2"]'); await click('[data-f="hang"][data-v="1"]'); await click('[data-act="ob-next"]');
  await click('[data-f="strength"][data-v="5"]'); await click('[data-act="ob-next"]');
  await click('[data-f="strengths"][data-v="grip"]'); await click('[data-act="ob-next"]');
  await click('[data-f="focus"][data-v="grip"]'); await click('[data-act="ob-next"]'); await click('[data-act="ob-next"]'); await p.waitForTimeout(700);
  const sumTxt = await p.evaluate(() => document.body.innerText);
  check('summary explains adjustments', sumTxt.includes('מותאם בשבילך') && sumTxt.includes('ברכיים') && sumTxt.includes('פרקי ידיים') && sumTxt.includes('45'));
  await p.screenshot({ path: `${out}/inj-summary.png` });
  await click('[data-act="ob-finish"]'); await p.waitForTimeout(400);
  const prof = await p.evaluate(() => ({ l: S.profile.limits, lv: S.profile.limLv, lvl: S.profile.level }));
  check('profile saved with levels', JSON.stringify(prof.lv) === '{"knee":2,"wrist":1}' && prof.l.join() === 'knee,wrist' && prof.lvl <= 2, JSON.stringify(prof));
  const today = await p.evaluate(() => document.body.innerText);
  check('today shows readiness + adapted cards', today.includes('איך הגוף היום') && today.includes('מותאם בשבילך'));
  await p.screenshot({ path: `${out}/inj-today.png`, fullPage: true });
  await click('[data-act="ready"][data-v="1"]');
  const t2 = await p.evaluate(() => document.body.innerText); check('tired choice adds note', t2.includes('מרגיש עייף'));
  check('readiness persisted', await p.evaluate(() => S.ready && S.ready.v === 1));
  // preview sheet shows prehab tag + adjustments, and the workout can be completed
  await click('.card.hero [data-act="sess-sheet"]'); await p.waitForTimeout(250);
  const sh = await p.$eval('.sheet', e => e.innerText); check('sheet lists adjustments', sh.includes('מותאם בשבילך'));
  await p.screenshot({ path: `${out}/inj-sheet.png` });
  await click('[data-act="sheet-close"]');
  await click('.card.hero [data-act="start-sess"]'); await p.waitForTimeout(300);
  let g = 0, done = false;
  while (g++ < 400) {
    const st = await p.evaluate(() => { const b = s => !!document.querySelector(s); return { go: b('[data-act="pl-go"]'), early: b('[data-act="pl-early"]'), done: b('[data-act="pl-done"]'), rest: b('[data-act="pl-skiprest"]'), sum: b('[data-act="pl-save"]') || b('[data-act="pl-finish"]') || /סיכום|הושלם|Summary/.test(document.body.innerText) && !b('[data-act="pl-done"]') && !b('[data-act="pl-go"]') && !b('[data-act="pl-early"]') && !b('[data-act="pl-skiprest"]') }; });
    if (st.rest) { await click('[data-act="pl-skiprest"]'); continue; }
    if (st.go) { await click('[data-act="pl-go"]'); continue; }
    if (st.early) { await click('[data-act="pl-early"]'); continue; }
    if (st.done) { await click('[data-act="pl-done"]'); continue; }
    if (st.sum) { done = true; break; }
    await p.waitForTimeout(100);
  }
  check('injured profile completes a full workout', done, 'iterations ' + g);
  await p.screenshot({ path: `${out}/inj-end.png` });
  // profile view
  await p.evaluate(() => { UI.ov = null; UI.sheet = null; UI.tab = 'profile'; render(); });
  const pv = await p.evaluate(() => document.body.innerText); check('profile lists limits with level', pv.includes('אזורים רגישים') && pv.includes('ברכיים · פציעה') && pv.includes('פרקי ידיים · כואב קצת'));
  await p.screenshot({ path: `${out}/inj-profile.png`, fullPage: true });
  // English
  await p.evaluate(() => { S.prefs.lang = 'en'; lang = 'en'; UI.tab = 'today'; render(); });
  const en = await p.evaluate(() => document.body.innerText); check('english: readiness + adapted', en.includes('How is your body today?') && en.includes('Adapted for you') && en.includes('Knees'));
  const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); check('no horizontal overflow', ov <= 0, ov);
  check('no console errors', errs.length === 0, errs.join(' || '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await browser.close(); process.exit(fails ? 1 : 0);
})();
