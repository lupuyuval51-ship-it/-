const P = require('./paths.cjs');
// Crawl every tab and sheet in both editions, both languages, three kinds of user. Reports console errors, failed requests, overflow and empty views.
const { chromium } = require('playwright');
const DAY = 864e5, ws = Date.now() - 30 * DAY;
const GYM = ['weights', 'barbell', 'machine', 'band', 'cardiom', 'box', 'bar', 'towel'], NJ = ['bar', 'rings', 'rope', 'monkey', 'beam', 'wall', 'box', 'towel', 'ninja', 'weights'];
const base = { name: 'T', exp: 1, goal: 0, strength: 4, push: 2, pull: 2, hang: 1, strengths: [], strengthNote: '', focus: [], days: [1, 3, 5], minutes: 30, limits: [], limLv: {}, level: 1, startTs: ws, createdTs: ws, adapt: {} };
const USERS = {
  adultFit: { ...base, age: 2, track: 'muscle', ninja: false, places: ['gym'], equip: GYM, body: { sex: 'm', h: 180, w: 80 }, wlog: [[Date.now() - 20 * DAY, 82], [Date.now() - 2 * DAY, 80]], limits: ['knee'], limLv: { knee: 1 } },
  teenNinja: { ...base, age: 1, track: 'ninja', ninja: true, places: ['ninja', 'home'], equip: NJ, focus: ['grip'] },
  adultNinja: { ...base, age: 3, track: 'ninja', ninja: true, places: ['ninja', 'gym'], equip: NJ, focus: ['grip', 'pull'], strengths: ['grip'] },
};
(async () => {
  const b = await chromium.launch(); const problems = []; let views = 0;
  for (const file of ['index.test.html', 'index.ninja.html']) for (const [uname, user] of Object.entries(USERS)) for (const lg of ['en', 'he']) {
    const tag = `${file.includes('ninja') ? 'NINJA' : 'FIT'}/${uname}/${lg}`;
    const ctx = await b.newContext({ viewport: { width: 360, height: 720 }, isMobile: true, hasTouch: true }); const p = await ctx.newPage();
    const here = []; const note = m => here.push(m);
    p.on('pageerror', e => note('pageerror ' + e.message)); p.on('console', m => m.type() === 'error' && note('console ' + m.text().slice(0, 120))); p.on('response', r => r.status() >= 400 && note('http ' + r.status() + ' ' + r.url().slice(-60)));
    await p.goto('file://' + P.dir + file); await p.evaluate(d => localStorage.setItem('ninja-circuit-v1', JSON.stringify(d)), { v: 1, profile: user, prefs: { lang: lg, sound: false, vibe: false, countdown: false, remindOn: false, remindTime: '18:00', remindAsked: true }, courses: [], logs: {}, meta: { pu: 1, cu: 0, resetAt: 0 } });
    await p.reload(); await p.waitForTimeout(700);
    const tabs = await p.$$eval('[data-act="tab"]', e => e.map(x => x.dataset.v));
    for (const t of tabs) {
      await p.evaluate(t => document.querySelector(`[data-act="tab"][data-v="${t}"]`).click(), t); await p.waitForTimeout(450); views++;
      const r = await p.evaluate(() => ({ ow: document.documentElement.scrollWidth - document.documentElement.clientWidth, len: (document.querySelector('#main') || document.body).innerText.trim().length, raw: /\b(undefined|NaN|\[object|ff_|f_[a-z])/.test(document.body.innerText) }));
      if (r.ow > 1) note(`${t}: horizontal overflow ${r.ow}px`); if (r.len < 20) note(`${t}: empty view`); if (r.raw) note(`${t}: raw/undefined text: ${(document => '')()}`);
      // open the first few sheets on this tab
      const sheets = await p.$$eval('[data-act="ready-sheet"],[data-act="sess-sheet"],[data-act="ex-sheet"],[data-act="dish"],[data-act="inj-sheet"],[data-act="body-sheet"]', e => e.slice(0, 3).map(x => [x.dataset.act, x.dataset.v || '', x.dataset.type || '', x.dataset.idx || '']));
      for (const [act] of sheets) { const el = (await p.$$(`[data-act="${act}"]`))[0]; if (!el) continue; await el.evaluate(e => e.scrollIntoView({ block: 'center' })); await el.click({ force: true }).catch(() => {}); await p.waitForTimeout(250); views++; const sh = await p.evaluate(() => { const s = document.querySelector('#sheet'); return s ? s.innerText.trim().length : 0; }); if (sh < 10) note(`${t}/${act}: sheet empty`); const o = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); if (o > 1) note(`${t}/${act}: sheet overflow ${o}`); await p.evaluate(() => { const c = document.querySelector('[data-act="sheet-close"]'); c && c.click(); }); await p.waitForTimeout(120); }
    }
    if (here.length) problems.push(tag + ': ' + [...new Set(here)].join(' | '));
    await ctx.close();
  }
  console.log('views visited:', views); console.log(problems.length ? 'PROBLEMS:\n' + problems.join('\n') : 'NO PROBLEMS'); await b.close();
})();
