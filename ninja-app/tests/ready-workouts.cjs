const P = require('./paths.cjs');
const { chromium } = require('playwright');
const out = process.argv[2] || require('path').join(require('os').tmpdir(), 'ninja-shots');
require('fs').mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const check = (n, ok, x = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, ok ? '' : x); };
  const mk = async (url = 'index.html', w = 390) => { const ctx = await b.newContext({ viewport: { width: w, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text())); await p.goto('file://' + P.dir + url); await p.waitForTimeout(700); return p; };
  const click = async (p, sel) => { await p.$eval(sel, e => e.scrollIntoView({ block: 'center' })); await p.click(sel, { force: true }); await p.waitForTimeout(220); };
  const text = p => p.evaluate(() => document.body.innerText);

  // ── 1. no-questions path
  let p = await mk();
  await click(p, '[data-act="ob-skip"]'); await p.waitForTimeout(500);
  check('skip lands on the Workouts tab', (await text(p)).includes('Ready workouts'));
  check('default profile is general fitness (no ninja tabs)', await p.evaluate(() => !document.querySelector('[data-act="tab"][data-v="run"]')));
  const nHome = await p.$$eval('.wcard', e => e.length); check('home filter lists 25 workouts', nHome === 25, nHome);
  await click(p, '[data-act="work-place"][data-v="gym"]'); check('gym filter lists 25 workouts', (await p.$$eval('.wcard', e => e.length)) === 25);
  await click(p, '[data-act="work-cat"][data-v="abs"]'); check('gym + abs = 2', (await p.$$eval('.wcard', e => e.length)) === 2);
  await click(p, '[data-act="work-place"][data-v="all"]'); await click(p, '[data-act="work-cat"][data-v="women"]'); check('all places + women = 7', (await p.$$eval('.wcard', e => e.length)) === 7, await p.$$eval('.wcard', e => e.length));
  await click(p, '[data-act="work-cat"][data-v="all"]'); check('all places + all = 50 (no ninja)', (await p.$$eval('.wcard', e => e.length)) === 50, await p.$$eval('.wcard', e => e.length));
  await click(p, '[data-act="work-place"][data-v="home"]'); await click(p, '[data-act="work-cat"][data-v="abs"]');
  await click(p, '.wcard'); await p.waitForTimeout(300);
  const sheet = await p.$eval('.sheet', e => e.innerText); check('workout sheet shows blocks and start button', /Warm-up/.test(sheet) && /Main set|Circuit/.test(sheet) && /Start session/.test(sheet), sheet.slice(0, 200));
  await p.screenshot({ path: `${out}/ready-sheet.png` });
  await click(p, '.sheet [data-act="start-sess"]'); await p.waitForTimeout(400);
  let g = 0, done = false;
  while (g++ < 500) {
    const st = await p.evaluate(() => { const q = s => !!document.querySelector(s); return { go: q('[data-act="pl-go"]'), early: q('[data-act="pl-early"]'), done: q('[data-act="pl-done"]'), rest: q('[data-act="pl-skiprest"]'), save: q('[data-act="pl-save"]') }; });
    if (st.save) { done = true; break; }
    if (st.rest) { await p.click('[data-act="pl-skiprest"]', { force: true }); await p.waitForTimeout(80); continue; }
    if (st.go) { await p.click('[data-act="pl-go"]', { force: true }); await p.waitForTimeout(80); continue; }
    if (st.early) { await p.click('[data-act="pl-early"]', { force: true }); await p.waitForTimeout(80); continue; }
    if (st.done) { await p.click('[data-act="pl-done"]', { force: true }); await p.waitForTimeout(80); continue; }
    await p.waitForTimeout(80);
  }
  check('a ready workout can be played to the end', done, 'iterations ' + g);
  await p.screenshot({ path: `${out}/ready-summary.png` });
  await click(p, '[data-act="pl-save"]'); await p.waitForTimeout(400);
  const saved = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('ninja-circuit-v1')); const all = Object.values(s.logs).flatMap(m => m.sessions); return all.map(x => x.type + '|' + x.idx); });
  check('session saved with its ready-workout type', saved.length === 1 && saved[0].startsWith('R:h-abs') , saved.join());
  check('Today shows it in recent activity', (await text(p)).includes('Abs') || (await text(p)).includes('abs') || (await text(p)).toLowerCase().includes('core'));
  await p.screenshot({ path: `${out}/today-after-ready.png` });

  // ── 2. full onboarding in fitness mode
  p = await mk();
  await click(p, '[data-act="ob-next"]'); await p.fill('#obName', 'Dana'); await click(p, '[data-f="age"][data-v="3"]');
  check('age 30-44 note on first question', (await text(p)).includes('Ages 30'));
  await click(p, '[data-act="ob-next"]');
  check('injuries come second, with a hint while Next is disabled', (await text(p)).includes('Anything we should know?') && (await text(p)).includes('Tick the box to continue') && await p.$eval('[data-act="ob-next"]', e => e.disabled));
  await click(p, '[data-act="ob-lim"][data-v="knee"]'); await click(p, '[data-act="ob-ack"]'); await click(p, '[data-act="ob-next"]');
  check('track question comes third', (await text(p)).includes('What are you training for?'));
  await click(p, '[data-f="track"][data-v="lean"]'); await p.waitForTimeout(450);
  check('experience question uses fitness wording', (await text(p)).includes('Train regularly'));
  await click(p, '[data-f="exp"][data-v="1"]'); await p.waitForTimeout(450);
  const placesTxt = await text(p); check('places: gym/home/park only (no ninja gym)', placesTxt.includes('Gym') && placesTxt.includes('At home') && !placesTxt.includes('Ninja gym'), placesTxt.slice(0, 300));
  await click(p, '[data-f="places"][data-v="home"]'); await click(p, '[data-act="ob-next"]');
  const eqTxt = await text(p); check('equipment list is gym/home gear, not ninja obstacles', eqTxt.includes('Resistance bands') && !eqTxt.includes('Ninja obstacles'));
  await click(p, '[data-f="equip"][data-v="weights"]'); await click(p, '[data-act="ob-next"]');
  check('no pull-up bar -> the pull-up question is skipped (push-up question next)', (await text(p)).includes('How many push-ups can you do?'));
  check('push-up question has 4 plain answers', (await p.$$('[data-f="strength"]')).length === 4);
  await click(p, '[data-f="strength"][data-v="3"]'); await click(p, '[data-act="ob-next"]');
  check('ninja-only strengths step is skipped (goes straight to focus)', (await text(p)).includes('What do you want to work on?') && (await text(p)).includes('Glutes'));
  await click(p, '[data-f="focus"][data-v="glutes"]'); await click(p, '[data-act="ob-next"]');
  check('time options include 15 minutes', (await text(p)).includes('15 min'));
  await click(p, '[data-act="ob-next"]'); await p.waitForTimeout(600);
  const sum = await text(p); check('summary shows the lean-track weekly plan', /Full Body A|HIIT Circuit/.test(sum) && sum.includes('Adapted for you'), sum.slice(0, 400));
  await p.screenshot({ path: `${out}/onboard-summary.png` });
  await click(p, '[data-act="ob-finish"]'); await p.waitForTimeout(500);
  const prof = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('ninja-circuit-v1')).profile; return { track: s.track, ninja: s.ninja, focus: s.focus, limits: s.limits, hang: s.hang }; });
  check('profile saved as lean / not ninja', prof.track === 'lean' && prof.ninja === false && prof.focus.join() === 'glutes' && prof.limits.join() === 'knee', JSON.stringify(prof));
  const today = await text(p); check('today shows a fitness session (no ninja names)', !/Grip & Pull|Jump & Balance/.test(today) && /Full Body A|HIIT|Core|Cardio/.test(today), today.slice(0, 300));
  await p.screenshot({ path: `${out}/today-fitness.png` });

  // ── 3. ninja switch in Profile
  await click(p, '[data-act="tab"][data-v="profile"]');
  check('profile has the ninja switch', (await text(p)).includes('I train ninja warrior'));
  await click(p, '[data-act="toggle-ninja"]'); check('ninja switch asks for confirmation', (await text(p)).includes('Switch to ninja mode?')); await click(p, '[data-act="confirm-ok"]'); await p.waitForTimeout(400);
  check('ninja mode adds the Course tab (7 tabs)', (await p.$$eval('.tabs-in .tab', e => e.length)) === 7);
  await click(p, '[data-act="tab"][data-v="plan"]'); const planTxt = await text(p);
  check('plan switches to ninja sessions', /Grip & Pull|Jump & Balance|Course & Endurance/.test(planTxt), planTxt.slice(0, 300));
  await click(p, '[data-act="tab"][data-v="workouts"]'); check('ninja chip appears in the workouts filter', (await text(p)).includes('Ninja'));
  await click(p, '[data-act="work-place"][data-v="ninja"]'); check('12 ninja workouts', (await p.$$eval('.wcard', e => e.length)) === 12);
  await p.screenshot({ path: `${out}/workouts-ninja.png` });
  await click(p, '[data-act="tab"][data-v="profile"]'); await click(p, '[data-act="toggle-ninja"]'); await click(p, '[data-act="confirm-ok"]'); await p.waitForTimeout(300);
  check('switching ninja off restores 6 tabs and the lean track', (await p.$$eval('.tabs-in .tab', e => e.length)) === 6 && (await p.evaluate(() => JSON.parse(localStorage.getItem('ninja-circuit-v1')).profile.track)) === 'lean');
  await p.close();

  // ── 4. engine invariants over every ready workout (uses the test hook)
  require('./build-test-pages.cjs')();
  p = await mk('index.test.html');
  const ev = (fn, a) => p.evaluate(([s, a]) => window.__eval('(' + s + ')')(a), [fn.toString(), a]);
  const inv = await ev(() => {
    const bad = [], thin = [];
    const eqs = [['towel'], PLACE_EQ.gym.concat(['towel'])];
    const lims = [[], [['knee', 2]], [['shoulder', 2], ['wrist', 2]], [['back', 2]], [['hip', 2], ['ankle', 2]], [['elbow', 2]], [['knee', 1], ['back', 1]]];
    let n = 0;
    for (const w of READY) for (const lm of lims) for (const age of [0, 1, 2, 4]) for (const eq of eqs) {
      const P = { name: '', age, exp: 1, track: 'general', ninja: w.place === 'ninja', places: ['home'], equip: eq, pull: 2, hang: 1, push: 1, strength: 5, strengths: [], focus: [], days: [0, 2, 4], minutes: 30, limits: lm.map(x => x[0]), limLv: Object.fromEntries(lm), level: 1, startTs: weekStart(Date.now()), createdTs: 1, adapt: {} };
      S.profile = P; n++;
      const s = buildSession(P, 'R:' + w.id, 1);
      const items = s.blocks.flatMap(b => b.items);
      for (const it of items) { const ex = EX[it.ex]; if (!ex) bad.push(['noex', w.id, it.ex]); else if (blocked(ex, P)) bad.push([w.id, it.ex, P.limits.join('+'), 'age' + age]); if (!(it.sets >= 1 && it.amt > 0)) bad.push(['dose', w.id, it.ex]); }
      const main = s.blocks.filter(b => b.k === 'main' || b.k === 'circuit').flatMap(b => b.items);
      if (main.length < 3 && lm.length < 2) thin.push(w.id + ':' + P.limits.join('+') + ':age' + age);
    }
    return { n, bad: bad.slice(0, 10), nbad: bad.length, thin: [...new Set(thin)].slice(0, 12), nthin: new Set(thin).size };
  });
  check(`every ready workout x injuries x ages x equipment is safe (${inv.n} builds)`, inv.nbad === 0, JSON.stringify(inv.bad));
  console.log('INFO workouts that shrink below 3 main exercises under a single injury or age rule:', inv.nthin, inv.thin.join(' '));
  await p.close();
  check('no console errors', errs.length === 0, [...new Set(errs)].slice(0, 5).join(' | '));
  console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
