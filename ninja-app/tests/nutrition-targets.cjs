const P = require('./paths.cjs');
const { chromium } = require('playwright');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const DAY = 864e5;
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const lg of ['en', 'he']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 800 } }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
    const ws = Date.now() - 20 * DAY;
    const prof = (o) => Object.assign({ name: 'T', age: 2, exp: 1, goal: 0, track: 'lean', ninja: false, places: ['home'], equip: ['towel'], pull: 1, hang: 1, push: 1, strength: 3, strengths: [], strengthNote: '', focus: [], days: [1, 3, 5], minutes: 30, limits: [], limLv: {}, level: 1, startTs: ws, createdTs: ws, adapt: {} }, o);
    const load = async pr => { await p.goto(P.FIT); await p.evaluate(d => { localStorage.setItem('ninja-circuit-v1', JSON.stringify(d)); localStorage.removeItem('ninja-circuit-active'); localStorage.removeItem('ninja-circuit-tab'); }, { v: 1, profile: pr, prefs: { lang: lg, sound: false, vibe: false, countdown: false, remindOn: false, remindTime: '18:00', remindAsked: true }, courses: [], logs: {}, meta: { pu: 1, cu: 0, resetAt: 0 } }); await p.reload(); await p.waitForTimeout(600); };
    const ev = c => p.evaluate(x => __eval(x), c);
    const tab = async v => { await p.evaluate(v => document.querySelector(`[data-act="tab"][data-v="${v}"]`).click(), v); await p.waitForTimeout(300); };
    // targets maths
    await load(prof({}));
    const T = await ev(`(() => { const r = {}; const P = JSON.parse(JSON.stringify(S.profile)); for (const [tr, sex, h, w, days] of [['lean','m',178,90,3],['lean','f',165,72,3],['muscle','m',180,75,4],['general','f',160,55,3],['lean','f',150,45,2]]) { P.track = tr; P.days = Array.from({length: days}, (_, i) => i); P.body = { sex, h, w }; r[tr+sex+w] = targets(P); } return r; })()`);
    ok(T.leanm90.kcal < T.leanm90.kcal + 1 && T.leanm90.kcal > 1900 && T.leanm90.kcal < 2600 && T.leanm90.prot === 180, lg + ' lean man 90kg: ' + JSON.stringify(T.leanm90));
    ok(T.leanf72.kcal >= 1300 && T.leanf72.week < 0 && T.leanf72.week > -0.8, lg + ' lean woman loses 0.2-0.8 kg/wk: ' + T.leanf72.week.toFixed(2));
    ok(T.musclem75.week > 0 && T.musclem75.week < 0.35 && T.musclem75.prot === 135, lg + ' muscle man gains slowly: ' + JSON.stringify(T.musclem75));
    ok(Math.abs(T.generalf55.week) < 0.05, lg + ' general woman holds weight');
    ok(T.leanf45.kcal >= 1300, lg + ' safety floor holds for a small woman: ' + T.leanf45.kcal);
    // minors get nothing
    await load(prof({ age: 1, body: { sex: 'm', h: 170, w: 60 } }));
    ok(await ev('targets(S.profile)') === null, lg + ' minor: no target');
    await tab('food'); ok(!(await p.$('[data-act="body-sheet"]')), lg + ' minor: no body card in Food');
    await tab('progress'); ok(!(await p.$('[data-act="body-sheet"]')), lg + ' minor: no weight card in Progress');
    // adult flow through the UI
    await load(prof({}));
    await tab('food'); ok((await p.content()).includes('data-act="body-sheet"'), lg + ' adult sees the set-up card in Food');
    await p.click('[data-act="body-sheet"]'); await p.waitForTimeout(300);
    await p.click('[data-act="b-sex"][data-v="f"]'); await p.fill('#bH', '165'); await p.fill('#bW', '72');
    await p.click('[data-act="body-save"]'); await p.waitForTimeout(400);
    const body = await ev('JSON.stringify([S.profile.body, S.profile.wlog.length])');
    ok(body === '[{"sex":"f","h":165,"w":72},1]', lg + ' body saved: ' + body);
    const txt = await p.evaluate(() => document.body.innerText);
    ok(/kcal|קק/.test(txt) && /protein|חלבון/.test(txt), lg + ' Food shows kcal + protein target');
    const sd = await p.evaluate(() => (document.querySelector('.day-card .note') || {}).textContent || '');
    const sample = await ev('(() => { const d = dayPicks(); const g = targets(S.profile); return [d.reduce((n, x) => n + x.kcal, 0), g.kcal]; })()');
    ok(sd.length > 5 && Math.abs(sample[0] - sample[1]) / sample[1] < 0.2, lg + ' sample day within 20% of target: ' + sample.join(' vs '));
    await tab('progress'); ok((await p.content()).includes('data-act="body-sheet"'), lg + ' Progress has Log weight');
    // log a second weight 3 days later and an older one; trend shows
    await ev(`(() => { S.profile.wlog.unshift([Date.now() - 35 * 864e5, 75]); S.profile.wlog.unshift([Date.now() - 50 * 864e5, 76]); render(); })()`);
    await tab('progress'); const pt = await p.evaluate(() => document.body.innerText);
    ok(/-4 |−4|-4\b/.test(pt) || /-4/.test(pt) || /4 (kg|ק)/.test(pt), lg + ' weight change shown (76 -> 72)');
    // editing answers keeps body details
    await ev(`(() => { const o = { kind: 'ob', step: 1, editing: true, ans: { name: S.profile.name, track: S.profile.track, age: S.profile.age, exp: 1, goal: 0, places: ['home'], equip: ['towel'], pull: 1, hang: 1, strength: 3, strengths: [], strengthNote: '', focus: [], days: [1,3,5], minutes: 30, limits: [], limLv: {}, ack: true } }; const P = draftProfile(o); return !!P.body && P.wlog.length === 3; })()`).then(v => ok(v, lg + ' editing answers keeps body details and log'));
  }
  console.log(fails ? 'FAILED ' + fails : 'ALL PASSED', '| errors:', errs.join('|') || 'none'); await b.close();
})();
