const P = require('./paths.cjs');
const { chromium } = require('playwright');
const out = process.argv[2] || require('path').join(require('os').tmpdir(), 'ninja-shots'); require('fs').mkdirSync(out, { recursive: true });
const URL = P.APP;
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  const shot = async n => { await page.waitForTimeout(250); await page.screenshot({ path: `${out}/${n}.png` }); };
  const ovf = async n => { const o = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (o > 0) errs.push(`overflow ${o}px on ${n}`); };
  const click = async (sel, opts = {}) => { await page.$eval(sel, e => e.scrollIntoView({ block: 'center' })); await page.click(sel, { force: true, ...opts }); await page.waitForTimeout(120); };
  await page.goto(URL); await page.waitForTimeout(1200); await page.evaluate(() => { const b = document.querySelector('[data-act="lang"][data-v="he"]'); b && b.click(); }); await page.waitForTimeout(250);
  await shot('01-welcome'); await ovf('welcome');
  await require('./onb.cjs')(page, click, { name: 'יובל' });
  await click('[data-act="ob-finish"]'); await page.waitForTimeout(400);
  await page.waitForTimeout(500);
  const checks = []; const ok = (n, v) => { checks.push(v); console.log((v ? 'PASS ' : 'FAIL ') + n); };
  ok('no resume card before any workout', !(await page.$('[data-act="resume-active"]')));
  await click('.card.hero [data-act="start-sess"]'); await page.waitForTimeout(400);
  ok('no resume card with zero sets done (stored)', await page.evaluate(() => !localStorage.getItem('ninja-circuit-active')));
  // do 3 sets
  for (let n = 0; n < 3; n++) {
    for (let g = 0; g < 20; g++) {
      const st = await page.evaluate(() => ({ go: !!document.querySelector('[data-act="pl-go"]'), early: !!document.querySelector('[data-act="pl-early"]'), done: !!document.querySelector('[data-act="pl-done"]'), skip: !!document.querySelector('[data-act="pl-skiprest"]') }));
      if (st.skip) { await page.click('[data-act="pl-skiprest"]'); await page.waitForTimeout(150); continue; }
      if (st.go) await page.click('[data-act="pl-go"]'); else if (st.early) await page.click('[data-act="pl-early"]'); else if (st.done) await page.click('[data-act="pl-done"]'); else { await page.waitForTimeout(150); continue; }
      await page.waitForTimeout(200); break;
    }
  }
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('ninja-circuit-active') || 'null'));
  ok('progress stored', !!saved && saved.done.filter(v => v != null).length >= 1 && saved.i === saved.done.filter(v => v != null).length);
  await page.reload(); await page.waitForTimeout(1200);
  await shot('30-resume-card');
  ok('resume card on Today after reload', !!(await page.$('[data-act="resume-active"]')));
  await click('[data-act="resume-active"]'); await page.waitForTimeout(500);
  const p = await page.evaluate(() => ({ player: !!document.querySelector('.ov [data-act="pl-exit"]'), prog: document.querySelector('.pl-prog')?.getAttribute('aria-valuenow') }));
  ok('player reopened mid-session', p.player && +p.prog > 0);
  await shot('31-resumed');
  // exit with discard
  await click('[data-act="pl-exit"]'); await page.waitForTimeout(300);
  const alt = await page.$('[data-act="confirm-alt"]'); if (alt) await alt.click();
  await page.waitForTimeout(400);
  ok('discard clears stored workout', await page.evaluate(() => !localStorage.getItem('ninja-circuit-active')));
  ok('no resume card after discard', !(await page.$('[data-act="resume-active"]')));
  console.log('errors:', JSON.stringify(errs)); console.log(checks.every(Boolean) && !errs.length ? 'ALL PASS' : 'FAILURES');
  await browser.close();
})();
