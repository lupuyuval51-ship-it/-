const P = require('./paths.cjs');
const { chromium } = require('playwright');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const lg of ['en', 'he']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 800 } }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
    const ev = c => p.evaluate(x => __eval(x), c);
    const click = async s => { await p.$eval(s, e => e.scrollIntoView({ block: 'center' })); await p.click(s, { force: true }); await p.waitForTimeout(200); };
    await p.goto(P.NINJA); await p.waitForTimeout(600);
    if (lg === 'he') { await p.evaluate(() => document.querySelector('[data-act="lang"][data-v="he"]').click()); await p.waitForTimeout(200); }
    ok(/ninja|נינג/i.test(await p.$eval('[data-act="ob-skip"]', e => e.textContent)), lg + ' welcome skip button is ninja-specific');
    // full questionnaire never shows the track step
    await click('[data-act="ob-next"]'); await p.fill('#obName', 'Nin'); await click('[data-f="age"][data-v="2"]'); await click('[data-act="ob-next"]');
    await click('[data-act="ob-ack"]'); await click('[data-act="ob-next"]');
    ok(!(await p.$('[data-f="track"]')), lg + ' no track question after injuries');
    ok(await ev('obList(UI.ov.ans).length') === 11 && await ev("UI.ov.ans.track") === 'ninja', lg + ' 11 steps, track locked to ninja');
    ok(await p.$('[data-f="goal"]') !== null, lg + ' the big-goal question is back');
    await click('[data-f="goal"][data-v="0"]'); await click('[data-act="ob-next"]'); await p.waitForTimeout(300);
    await click('[data-f="exp"][data-v="1"]'); await p.waitForTimeout(300);
    await click('[data-f="places"][data-v="ninja"]'); await click('[data-act="ob-next"]'); await click('[data-act="ob-next"]');
    await click('[data-f="pull"][data-v="2"]'); await click('[data-f="hang"][data-v="1"]'); await click('[data-act="ob-next"]');
    await click('[data-f="strength"][data-v="6"]'); await click('[data-act="ob-next"]');
    await click('[data-f="strengths"][data-v="grip"]'); await click('[data-act="ob-next"]');
    await click('[data-f="focus"][data-v="grip"]'); await click('[data-act="ob-next"]'); await click('[data-act="ob-next"]'); await click('[data-act="ob-finish"]'); await p.waitForTimeout(600);
    const prof = await ev('JSON.stringify([S.profile.track, S.profile.ninja, isNinja(S.profile)])');
    ok(prof === '["ninja",true,true]', lg + ' profile is ninja: ' + prof);
    ok(await ev('S.profile.goal') === 0, lg + ' goal saved in the profile');
    // tabs, workouts, profile
    ok(await p.$('[data-act="tab"][data-v="run"]') !== null, lg + ' course tab present');
    await p.evaluate(() => document.querySelector('[data-act="tab"][data-v="workouts"]').click()); await p.waitForTimeout(400);
    const cards = await p.$$eval('.wcard', e => e.length);
    const ids = await p.$$eval('.wcard', e => e.map(x => x.dataset.v));
    ok(cards >= 10 && ids.every(i => i.startsWith('n-')), lg + ' Workouts shows only ninja sessions: ' + cards);
    ok(!(await p.$('[data-act="work-place"]')) && !(await p.$('[data-act="work-cat"]')), lg + ' no gym/home/category filters');
    await p.evaluate(() => document.querySelector('[data-act="tab"][data-v="profile"]').click()); await p.waitForTimeout(400);
    ok(!(await p.$('[data-act="toggle-ninja"]')) && !(await p.$('[data-act="set-track"]')), lg + ' Profile has no ninja switch or track chips');
    // run one ready workout to the end
    await p.evaluate(() => document.querySelector('[data-act="tab"][data-v="workouts"]').click()); await p.waitForTimeout(300);
    await click('[data-act="ready-sheet"]'); await click('[data-act="start-sess"]'); await p.waitForTimeout(500);
    let g = 0, saved = false; while (g++ < 300) { const st = await p.evaluate(() => { const q = s => !!document.querySelector(s); return { go: q('[data-act="pl-go"]'), early: q('[data-act="pl-early"]'), done: q('[data-act="pl-done"]'), rest: q('[data-act="pl-skiprest"]'), save: q('[data-act="pl-save"]') }; }); if (st.save) { await p.click('[data-act="pl-save"]', { force: true }); saved = true; break; } if (st.rest) await p.click('[data-act="pl-skiprest"]', { force: true }); else if (st.go) await p.click('[data-act="pl-go"]', { force: true }); else if (st.early) await p.click('[data-act="pl-early"]', { force: true }); else if (st.done) await p.click('[data-act="pl-done"]', { force: true }); await p.waitForTimeout(50); }
    ok(saved && await ev('sessions().length') === 1, lg + ' a ninja workout finishes and saves');
    // quick start path
    await p.evaluate(() => localStorage.clear()); await p.goto(P.NINJA); await p.waitForTimeout(500);
    await click('[data-act="ob-skip"]'); await p.waitForTimeout(500);
    ok(await ev('JSON.stringify([S.profile.track, S.profile.ninja])') === '["ninja",true]', lg + ' quick start gives a ninja profile');
    ok((await p.$$eval('.wcard', e => e.length)) >= 10, lg + ' quick start lists the ninja workouts');
    await ctx.close();
  }
  console.log(fails ? 'FAILED ' + fails : 'ALL PASSED', '| errors:', errs.join('|') || 'none'); await b.close();
})();
