const P = require('./paths.cjs');
// Fitness end-to-end: a muscle-track lifter completes the whole week through the UI, weights are logged, the plan advances, next week rolls over.
const { chromium } = require('playwright');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const DAY = 864e5;
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 800 } }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  const d0 = new Date(); const ws = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() - d0.getDay()).getTime();
  const prof = { name: 'Eli', age: 2, exp: 1, goal: 0, track: 'muscle', ninja: false, places: ['gym'], equip: ['weights', 'barbell', 'machine', 'band', 'cardiom', 'box', 'bar', 'towel'], pull: 2, hang: 1, push: 3, strength: 4, strengths: [], strengthNote: '', focus: ['chest'], days: [1, 2, 3, 4, 5], minutes: 45, limits: ['shoulder'], limLv: { shoulder: 1 }, level: 1, startTs: ws, createdTs: ws, adapt: {} };
  const seed = (pr) => ({ v: 1, profile: pr, prefs: { lang: 'en', sound: false, vibe: false, countdown: false, remindOn: false, remindTime: '18:00', remindAsked: true }, courses: [], logs: {}, meta: { pu: 1, cu: 0, resetAt: 0 } });
  await p.goto(P.FIT);
  await p.evaluate(d => { localStorage.setItem('ninja-circuit-v1', JSON.stringify(d)); localStorage.removeItem('ninja-circuit-active'); }, seed(prof));
  await p.reload(); await p.waitForTimeout(700);
  const ev = c => p.evaluate(x => __eval(x), c);
  const click = async s => { await p.$eval(s, e => e.scrollIntoView({ block: 'center' })); await p.click(s, { force: true }); await p.waitForTimeout(150); };
  const runSession = async () => {
    await click('.hero [data-act="start-sess"]'); await p.waitForTimeout(500);
    let g = 0, weighted = 0;
    while (g++ < 400) {
      const st = await p.evaluate(() => { const q = s => !!document.querySelector(s); return { go: q('[data-act="pl-go"]'), early: q('[data-act="pl-early"]'), done: q('[data-act="pl-done"]'), rest: q('[data-act="pl-skiprest"]'), save: q('[data-act="pl-save"]'), wp: q('[data-act="pl-wplus"]') }; });
      if (st.save) break;
      if (st.wp && weighted < 3) { await p.click('[data-act="pl-wplus"]', { force: true }); weighted++; }
      if (st.rest) await p.click('[data-act="pl-skiprest"]', { force: true }); else if (st.go) await p.click('[data-act="pl-go"]', { force: true }); else if (st.early) await p.click('[data-act="pl-early"]', { force: true }); else if (st.done) await p.click('[data-act="pl-done"]', { force: true });
      await p.waitForTimeout(40);
    }
    await click('[data-act="pl-save"]'); await p.waitForTimeout(400);
  };
  const days = [];
  for (let i = 0; i < 5; i++) {
    const before = await ev('weekInfo().next');
    await runSession();
    const after = await ev('weekInfo().next');
    days.push(before + '>' + after);
  }
  ok(days.join(' ') === '0>1 1>2 2>3 3>4 4>-1', 'every saved session advances the plan: ' + days.join(' '));
  ok(await ev('sessions().length') === 5, 'five sessions stored');
  ok(await ev('sessions().every(s => (s.sets || []).length > 0)'), 'all sessions have sets');
  ok(await ev('sessions().some(s => s.sets.some(x => x[3] > 0))'), 'weights were logged');
  const types = await ev('sessions().map(s => s.type).join()');
  ok(new Set(types.split(',')).size === 5, 'five different day types: ' + types);
  ok(!(await ev('sessions().some(s => s.sets.some(x => ["rope-climb","hang-switch","kip-swing","pu-diamond","shoulder-press-machine"].includes(x[0])))')), 'sore shoulder: nothing risky in what was trained');
  await p.evaluate(() => document.querySelector('[data-act="tab"][data-v="today"]').click()); await p.waitForTimeout(300);
  ok(/done|complete|week/i.test(await p.evaluate(() => document.body.innerText)), 'Today shows the finished week');
  // next week: shift history and plan start back by 7 days
  await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('ninja-circuit-v1')); const W = 7 * 864e5; d.profile.startTs -= W; for (const m of Object.values(d.logs)) for (const s of m.sessions) s.ts -= W; localStorage.setItem('ninja-circuit-v1', JSON.stringify(d)); });
  await p.reload(); await p.waitForTimeout(700);
  const wi = await ev('(() => { const W = weekInfo(); return { week: W.week, next: W.next, done: W.done.size, deload: W.deload }; })()');
  ok(wi.week === 2 && wi.next === 0 && wi.done === 0, 'next week rolls over to week 2 with a fresh plan: ' + JSON.stringify(wi));
  const w1 = await ev("buildSession(S.profile, 'P', 1).blocks.find(b => b.k === 'main').items.map(i => i.ex + ':' + i.sets + 'x' + i.amt).join()");
  const w2 = await ev("buildSession(S.profile, 'P', 2).blocks.find(b => b.k === 'main').items.map(i => i.ex + ':' + i.sets + 'x' + i.amt).join()");
  const w4 = await ev("buildSession(S.profile, 'P', 4).blocks.find(b => b.k === 'main').items.map(i => i.ex + ':' + i.sets + 'x' + i.amt).join()");
  ok(w1.split(',').map(x => x.split(':')[0]).join() === w2.split(',').map(x => x.split(':')[0]).join(), 'main lifts stay the same inside a block');
  ok(w4 !== w2, 'deload week differs from week 2: ' + w4);
  // 4-week progression: first lift reps increase from week 1 to week 3
  const reps = await ev("[1,2,3].map(w => buildSession(S.profile, 'P', w).blocks.find(b => b.k === 'main').items[0].amt)");
  ok(reps[2] >= reps[0], 'load does not drop from week 1 to week 3: ' + reps.join('>'));
  // weight is remembered next time
  const ls = await ev("(() => { const id = sessions().flatMap(s => s.sets).find(x => x[3] > 0)[0]; const l = liftStats(id); return l && l.last.w > 0; })()");
  ok(ls, 'last weight is remembered for the next session');
  console.log(fails ? 'FAILED ' + fails : 'ALL PASSED', '| errors:', errs.join('|') || 'none'); await b.close();
})();
