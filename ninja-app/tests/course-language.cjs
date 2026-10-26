const P = require('./paths.cjs');
const { chromium } = require('playwright');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(P.FIT); await p.waitForTimeout(500);
  const ev = c => p.evaluate(x => __eval(x), c);
  await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(500);
  ok((await ev('S.courses[0].name')) === 'Base course', 'fresh install: English course name');
  await p.evaluate(() => document.querySelector('[data-act="lang"][data-v="he"]').click()); await p.waitForTimeout(300);
  ok((await ev('S.courses[0].name + "|" + S.courses[0].obs.map(o => o.name).join(",")')) === 'מסלול בסיס|מדרגות מחומשות,טבעות,מתקן קופים,קיר ענק,באזר', 'switching to Hebrew renames the untouched default course');
  await p.evaluate(() => document.querySelector('[data-act="lang"][data-v="en"]').click()); await p.waitForTimeout(300);
  ok((await ev('S.courses[0].name')) === 'Base course', 'and back to English');
  await ev("(() => { S.courses[0].obs[0].name = 'My step'; render(); })()");
  await p.evaluate(() => document.querySelector('[data-act="lang"][data-v="he"]').click()); await p.waitForTimeout(300);
  ok((await ev('S.courses[0].obs[0].name')) === 'My step', 'an edited course keeps the user\'s names');
  ok((await ev("t('uSec')")) === 'שנ׳', 'Hebrew seconds unit is unambiguous');
  console.log(fails ? 'FAILED ' + fails : 'ALL PASSED', errs.join('|') || 'no errors'); await b.close();
})();
