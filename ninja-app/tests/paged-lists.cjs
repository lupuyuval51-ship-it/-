const P = require('./paths.cjs');
const { chromium } = require('playwright');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 800 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(P.FIT); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(500);
  await p.click('[data-act="ob-skip"]'); await p.waitForTimeout(400);
  const n = () => p.$$eval('.fcard', e => e.length);
  await p.evaluate(() => document.querySelector('[data-act="tab"][data-v="food"]').click()); await p.waitForTimeout(400);
  ok(await n() === 36, 'food shows 36 dishes first: ' + await n());
  await p.click('[data-act="food-more"]', { force: true }); await p.waitForTimeout(200);
  ok(await n() === 72, 'show more adds 36: ' + await n());
  for (let i = 0; i < 8; i++) { const m = await p.$('[data-act="food-more"]'); if (!m) break; await m.click({ force: true }); await p.waitForTimeout(80); }
  ok(await n() === 300 && !(await p.$('[data-act="food-more"]')), 'all 300 reachable, button disappears: ' + await n());
  await p.fill('[data-bind="food-q"]', 'shakshuka'); await p.waitForTimeout(300);
  ok(await n() >= 1 && await n() < 36, 'search still looks through all dishes and resets the page: ' + await n());
  await p.fill('[data-bind="food-q"]', ''); await p.waitForTimeout(300);
  ok(await n() === 36, 'clearing search returns to the first page');
  await p.click('[data-act="food-cat"][data-v="breakfast"]', { force: true }); await p.waitForTimeout(200);
  ok(await n() <= 36 && await n() > 0, 'category filter works: ' + await n());
  // library
  await p.evaluate(() => document.querySelector('[data-act="tab"][data-v="plan"]').click()); await p.waitForTimeout(400);
  const lib = () => p.$$eval('[data-act="ex-sheet"]', e => e.length);
  const a = await lib(); ok(a === 24, 'library shows 24 exercises first: ' + a);
  await p.click('[data-act="lib-more"]', { force: true }); await p.waitForTimeout(250);
  ok(await lib() === 48, 'library show more adds 24: ' + await lib());
  const total = await p.evaluate(() => __eval("Object.values(EX).length"));
  for (let i = 0; i < 12; i++) { const m = await p.$('[data-act="lib-more"]'); if (!m) break; await m.click({ force: true }); await p.waitForTimeout(80); }
  ok(await lib() === total, 'every exercise reachable: ' + await lib() + '/' + total);
  console.log(fails ? 'FAILED ' + fails : 'ALL PASSED', errs.join('|') || 'no errors'); await b.close();
})();
