const P = require('./paths.cjs');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const check = (n, ok, x = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, ok ? '' : x); };
  const mk = async () => { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text())); return p; };
  // fresh install -> English / LTR
  let p = await mk(); await p.goto(P.APP); await p.waitForTimeout(900);
  const st = await p.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir, txt: document.body.innerText, he: (document.body.innerText.match(/[\u0590-\u05FF]+/g) || []).filter(w => w !== 'עברית').join() }));
  check('fresh install is English', st.lang === 'en' && st.dir === 'ltr', JSON.stringify([st.lang, st.dir]));
  check('welcome screen has no Hebrew', !st.he, st.txt.slice(0, 200));
  await p.screenshot({ path: require('path').join(require('os').tmpdir(), 'en-welcome.png') });
  // switch to Hebrew from onboarding if a switch exists, and it sticks
  const sw = await p.$('[data-act="lang"][data-v="he"]');
  check('language switch available on first screen', !!sw);
  if (sw) { await sw.click({ force: true }); await p.waitForTimeout(300); const s2 = await p.evaluate(() => [document.documentElement.lang, document.documentElement.dir, JSON.parse(localStorage.getItem('ninja-circuit-v1')).prefs.lang]); check('switching to Hebrew works', s2.join() === 'he,rtl,he', s2.join()); await p.reload(); await p.waitForTimeout(500); const s3 = await p.evaluate(() => document.documentElement.lang); check('Hebrew choice persists', s3 === 'he'); }
  // existing Hebrew user stays Hebrew
  p = await mk(); await p.goto(P.APP);
  await p.evaluate(() => localStorage.setItem('ninja-circuit-v1', JSON.stringify({ v: 1, profile: null, prefs: { lang: 'he', sound: true, vibe: true, countdown: true, remindOn: false, remindTime: '18:00', remindAsked: false }, courses: [], logs: {}, meta: { pu: 0, cu: 0, resetAt: 0 } })));
  await p.reload(); await p.waitForTimeout(500);
  check('saved Hebrew preference is kept', (await p.evaluate(() => document.documentElement.lang + document.documentElement.dir)) === 'herтl'.replace('т', 't'));
  check('no errors', errs.length === 0, errs.join('|'));
  console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
