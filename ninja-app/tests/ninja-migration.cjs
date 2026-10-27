const P = require('./paths.cjs');
const { chromium } = require('playwright');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 800 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  const ws = Date.now() - 20 * 864e5;
  const prof = { name: 'Old', age: 2, exp: 1, goal: 0, track: 'lean', ninja: false, places: ['gym'], equip: ['weights', 'barbell', 'machine', 'towel'], pull: 2, hang: 1, push: 2, strength: 4, strengths: [], strengthNote: '', focus: ['abs', 'glutes'], days: [1, 3, 5], minutes: 30, limits: [], limLv: {}, level: 1, startTs: ws, createdTs: ws, adapt: {}, body: { sex: 'm', h: 178, w: 85 } };
  await p.goto(P.NINJA);
  await p.evaluate(d => localStorage.setItem('ninja-circuit-v1', JSON.stringify(d)), { v: 1, profile: prof, prefs: { lang: 'en', sound: false, vibe: false, countdown: false, remindOn: false, remindTime: '18:00', remindAsked: true }, courses: [], logs: {}, meta: { pu: 1, cu: 0, resetAt: 0 } });
  await p.reload(); await p.waitForTimeout(800);
  const st = await p.evaluate(() => __eval('JSON.stringify([S.profile.track, S.profile.ninja, S.profile.focus])'));
  ok(st === '["ninja",true,["grip"]]', 'old general profile moves into ninja mode: ' + st);
  for (const t of ['today', 'workouts', 'plan', 'run', 'food', 'progress', 'profile']) { await p.evaluate(t => document.querySelector(`[data-act="tab"][data-v="${t}"]`).click(), t); await p.waitForTimeout(350); }
  const sess = await p.evaluate(() => __eval("buildSession(S.profile, planOf(S.profile)[0], 1).blocks.flatMap(b => b.items.map(i => i.ex)).join()"));
  ok(sess.length > 10, 'program builds for the moved profile: ' + sess);
  console.log(fails ? 'FAILED ' + fails : 'ALL PASSED', errs.join('|') || 'no errors'); await b.close();
})();
