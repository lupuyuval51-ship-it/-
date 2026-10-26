const P = require('./paths.cjs');
// Round-2 Haiku fixes: minor level cap, pull-up gating, minor tests list, catch-up label, minor copy.
const { chromium } = require('playwright');
const URL = P.FIT;
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const DAY = 864e5;
const prof = (o) => Object.assign({ name: 'T', age: 1, exp: 1, goal: 0, track: 'ninja', ninja: true, places: ['ninja', 'gym'], equip: ['bar', 'rings', 'rope', 'monkey', 'beam', 'wall', 'box', 'towel', 'ninja', 'weights'], pull: 1, hang: 1, push: 2, strength: 3, strengths: [], strengthNote: '', focus: [], days: [0, 1, 2, 3, 4, 5, 6], minutes: 45, limits: [], limLv: {}, level: 1, startTs: Date.now() - 20 * DAY, createdTs: Date.now() - 20 * DAY, adapt: {} }, o);
const state = (pr, lg = 'en') => ({ v: 1, profile: pr, prefs: { lang: lg, sound: false, vibe: false, countdown: false, remindOn: false, remindTime: '18:00', remindAsked: true }, courses: [], logs: {}, meta: { pu: 1, cu: 0, resetAt: 0 } });
(async () => {
  const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 800 } });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  const load = async st => { await p.goto(URL); await p.evaluate(d => { localStorage.setItem('ninja-circuit-v1', JSON.stringify(d)); localStorage.removeItem('ninja-circuit-active'); localStorage.removeItem('ninja-circuit-tab'); }, st); await p.reload(); await p.waitForTimeout(700); };
  // 1) a legacy minor profile saved at level 3 is clamped; the Plan picker only offers the capped levels
  await load(state(prof({ age: 1, level: 3 })));
  ok(await p.evaluate(() => __eval('S.profile.level')) === 1, 'age 13-17 saved at level 3 renders at level 1');
  await p.evaluate(() => document.querySelector('[data-act="tab"][data-v="plan"]').click()); await p.waitForTimeout(300);
  ok(await p.$$eval('[data-act="set-level"]', e => e.length) === 2, 'minor Plan offers only 2 load levels');
  await p.evaluate(() => __eval("ACT['set-level']({ dataset: { v: '3' } })")); await p.waitForTimeout(200);
  ok(await p.evaluate(() => __eval('S.profile.level')) === 1, 'forcing set-level 3 for a minor stays at 1');
  await load(state(prof({ age: 0, level: 2 })));
  ok(await p.evaluate(() => __eval('S.profile.level')) === 1, 'under 13 at level 2 renders at level 1');
  await load(state(prof({ age: 2, level: 3 })));
  await p.evaluate(() => document.querySelector('[data-act="tab"][data-v="plan"]').click()); await p.waitForTimeout(300);
  ok(await p.$$eval('[data-act="set-level"]', e => e.length) === 4, 'adult keeps all 4 levels');
  ok(await p.evaluate(() => __eval('S.profile.level')) === 3, 'adult level 3 untouched');
  // 2) pull-up gating
  const pulls = (pull, level) => p.evaluate(([pull, level]) => __eval(`(() => { const P = Object.assign(JSON.parse(JSON.stringify(S.profile)), { pull: ${pull}, level: ${level}, age: 2 }); const bad = []; for (const type of Object.keys(TPL)) { try { const s = buildSession(P, type, 2); for (const bl of s.blocks) for (const it of bl.items) if (['pullup','chinup','wide-pullup','towel-pullup','explosive-pullup'].includes(it.ex)) bad.push(type + ':' + it.ex); } catch (e) { bad.push('ERR ' + e.message); } } return bad; })()`), [pull, level]);
  for (const lv of [1, 2, 3]) ok((await pulls(0, lv)).length === 0, `0 pull-ups: no pull-ups at level ${lv}`);
  ok((await pulls(1, 2)).length === 0, '1-3 pull-ups: negatives instead of pull-ups');
  ok((await pulls(2, 1)).some(x => x.includes('pullup')), '4-8 pull-ups: pull-ups still programmed');
  const exp = await p.evaluate(() => __eval(`(() => { const P = Object.assign(JSON.parse(JSON.stringify(S.profile)), { pull: 2, level: 3, age: 2 }); const r = []; for (const type of Object.keys(TPL)) { const s = buildSession(P, type, 2); for (const bl of s.blocks) for (const it of bl.items) if (it.ex === 'explosive-pullup') r.push(type); } return r; })()`));
  ok(exp.length === 0, 'explosive pull-up needs 9+ pull-ups');
  // 3) Progress tests for a minor: only note, no rows without results
  await load(state(prof({ age: 1 })));
  await p.evaluate(() => document.querySelector('[data-act="tab"][data-v="progress"]').click()); await p.waitForTimeout(300);
  const rows = await p.$$eval('.test-row:not([data-act])', e => e.length);
  ok(rows === 0, 'minor Progress shows no empty max-test rows (' + rows + ')');
  ok((await p.content()).includes('Max tests are for 18+'), 'minor Progress keeps the 18+ note');
  await load(state(prof({ age: 2 })));
  await p.evaluate(() => document.querySelector('[data-act="tab"][data-v="progress"]').click()); await p.waitForTimeout(300);
  ok(await p.$$eval('[data-act="test"]', e => e.length) >= 4, 'adult Progress lists the tests');
  // 4) catch-up label: planned day already passed this week
  const wd = new Date().getDay();
  if (wd > 0) {
    await load(state(prof({ age: 2, days: [0, wd, Math.min(6, wd + 1)] })));
    const eb = await p.$eval('.hero .eyebrow', e => e.textContent);
    ok(/Catch-up/.test(eb), 'overdue session is labelled Catch-up: ' + eb);
  } else ok(true, 'catch-up check skipped on Sunday');
  // 5) minor copy: onboarding hint + privacy line
  await p.evaluate(() => localStorage.clear()); await p.goto(URL); await p.waitForTimeout(500);
  const click = async s => { await p.$eval(s, e => e.scrollIntoView({ block: 'center' })); await p.click(s, { force: true }); await p.waitForTimeout(200); };
  await click('[data-act="ob-next"]'); await p.fill('#obName', 'Kid'); await click('[data-f="age"][data-v="1"]'); await click('[data-act="ob-next"]'); await click('[data-act="ob-ack"]'); await click('[data-act="ob-next"]');
  await click('[data-f="track"][data-v="ninja"]'); await p.waitForTimeout(400); await click('[data-f="exp"][data-v="1"]'); await p.waitForTimeout(400);
  await click('[data-f="places"][data-v="ninja"]'); await click('[data-act="ob-next"]'); await click('[data-act="ob-next"]');
  ok((await p.content()).includes('No need to test yourself now'), 'minor pull/hang step says no need to test');
  await click('[data-f="pull"][data-v="1"]'); await click('[data-f="hang"][data-v="1"]'); await click('[data-act="ob-next"]'); await click('[data-f="strength"][data-v="3"]'); await click('[data-act="ob-next"]');
  ok((await p.content()).includes('don’t write your full name'), 'minor free-text step has a privacy warning');
  console.log(fails ? 'FAILED ' + fails : 'ALL PASSED', '| errors:', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})();
