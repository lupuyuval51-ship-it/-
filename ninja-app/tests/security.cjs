// A hostile backup file must never run code or break the app: payloads go in every field (or only in the free text of an otherwise valid backup),
// the backup is imported, every tab and sheet is opened, and the app must still load after a reload.
// Hostile backup: an injection payload in every string and number field. Imports it, visits every tab and sheet,
// and reports script execution, injected elements, page errors and whether the app still loads after a reload.
const { chromium } = require('playwright');
const P = require('./paths.cjs');
const X = process.env.SHORT ? '<img src=x onerror=__x=1><b id=pwn>' : '"><img src=x onerror="window.__x=(window.__x||0)+1"><b id=pwn>x</b>';
const now = Date.now(), m = new Date().toISOString().slice(0, 7);
const evilBad = { app: 'ninja-circuit', data: {
  v: 1,
  profile: { name: X, age: X, exp: X, goal: X, track: X, ninja: X, places: [X, 'home'], equip: [X, 'towel'], pull: X, hang: X, push: X, strength: X, strengths: [X], strengthNote: X, focus: [X], days: [X, 1], minutes: X, limits: [X, 'knee'], limLv: { [X]: X, knee: X }, level: X, startTs: X, createdTs: X, adapt: { [X]: X }, body: { sex: X, h: X, w: X }, wlog: [[now - 864e5, X], [X, 70]], quick: X },
  prefs: { lang: X, sound: X, vibe: X, countdown: X, remindOn: true, remindTime: X, remindAsked: true, favFood: [X], favW: [X] },
  courses: [{ id: X, name: X, sx: X, sy: X, obs: [{ id: X, name: X, x: X, y: X }, { id: 'o2', name: 'ok', x: 100, y: 50 }] }],
  logs: { [m]: { sessions: [{ id: X, u: 1, ts: now - 3600e3, type: X, idx: X, week: X, dur: X, n: X, sets: [[X, X, X, X], ['pushup', X, X, X]], rpe: X, note: X }, { id: 's2', u: 1, ts: now - 7200e3, type: 'A', idx: 0, week: 1, dur: 1800, n: 10, sets: [['pullup', 5, X, X]], rpe: 3, note: X }],
    runs: [{ id: X, u: 1, ts: now - 5000e3, course: X, total: X, splits: [X], done: X }], tests: [{ id: X, u: 1, ts: now - 6000e3, test: X, value: X }, { id: 't2', u: 1, ts: now - 6000e3, test: 'hang', value: X }] } },
  meta: { pu: X, cu: X, resetAt: X } } };
const ws = now - 30 * 864e5;
const evil = { app: 'ninja-circuit', data: { v: 1,
  profile: { name: X, age: 2, exp: 1, goal: 0, track: 'ninja', ninja: true, places: ['ninja', 'home'], equip: ['bar', 'towel', 'ninja', 'rings'], pull: 2, hang: 1, push: 2, strength: 5, strengths: ['grip'], strengthNote: X, focus: ['grip'], days: [0, 2, 4], minutes: 30, limits: ['knee'], limLv: { knee: 1 }, level: 1, startTs: ws, createdTs: ws, adapt: {}, body: { sex: 'm', h: 178, w: 80 }, wlog: [[now - 864e5, 80]] },
  prefs: { lang: 'en', sound: false, vibe: false, countdown: false, remindOn: true, remindTime: '18:00', remindAsked: true, favFood: [], favW: [] },
  courses: [{ id: 'c1', name: X, sx: 22, sy: 148, obs: [{ id: 'o1', name: X, x: 70, y: 112 }, { id: 'o2', name: X, x: 150, y: 46 }] }],
  logs: { [m]: { sessions: [{ id: 's1', u: 1, ts: now - 3600e3, type: 'A', idx: 0, week: 1, dur: 1800, n: 2, sets: [['pullup', 5, 5, 0], ['dead-hang', 30, 30, 0]], rpe: 3, note: X }],
    runs: [{ id: 'r1', u: 1, ts: now - 5000e3, course: 'c1', total: 60000, splits: [20000, 60000], done: true, fell: null }], tests: [{ id: 't1', u: 1, ts: now - 6000e3, test: 'hang', value: 40 }] } },
  meta: { pu: 1, cu: 1, resetAt: 0 } } };
(async () => {
  const b = await chromium.launch(); const results = [];
  for (const [label, payload] of [['valid shape, hostile text', evil], ['hostile everywhere', evilBad]]) for (const file of ['index.test.html', 'index.ninja.html']) for (const lg of ['en', 'he']) {
    const p = await b.newPage({ viewport: { width: 390, height: 800 } }); const errs = [];
    p.on('pageerror', e => errs.push(e.message.slice(0, 90))); p.on('dialog', d => { errs.push('DIALOG ' + d.message()); d.dismiss(); });
    await p.goto('file://' + P.dir + file); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
    if (lg === 'he') await p.evaluate(() => document.querySelector('[data-act="lang"][data-v="he"]').click());
    await p.click('[data-act="ob-skip"]'); await p.waitForTimeout(300);
    const imported = await p.evaluate(t => { try { const d = __eval('parseBackup')(t); if (!d) return 'rejected'; __eval('applyBackup')(d); return 'applied'; } catch (e) { return 'threw ' + e.message.slice(0, 80); } }, JSON.stringify(payload));
    const visit = async () => { const tabs = await p.$$eval('[data-act="tab"]', e => e.map(x => x.dataset.v)).catch(() => []);
      for (const t of tabs) { await p.evaluate(t => document.querySelector(`[data-act="tab"][data-v="${t}"]`)?.click(), t).catch(() => {}); await p.waitForTimeout(250);
        for (const act of ['sess-sheet', 'ready-sheet', 'ex-sheet', 'hist', 'hist-open', 'rec', 'dish', 'body-sheet', 'remind', 'edit-course', 'course-edit', 'new-course', 'open-ladder', 'inj-sheet', 'export', 'start-run', 'run-start']) { const el = await p.$(`[data-act="${act}"]`); if (!el) continue; await el.click({ force: true }).catch(() => {}); await p.waitForTimeout(150); await p.evaluate(() => document.querySelector('[data-act="sheet-close"]')?.click()).catch(() => {}); } } return tabs.length; };
    const tabs1 = await visit();
    const after = await p.evaluate(() => ({ x: window.__x || 0, pwn: !!document.querySelector('#pwn,img[src="x"]') }));
    await p.reload(); await p.waitForTimeout(600);
    const tabs2 = await visit();
    const after2 = await p.evaluate(() => ({ x: window.__x || 0, pwn: !!document.querySelector('#pwn,img[src="x"]'), body: document.body.innerText.length }));
    const tag = `${label} · ${file.includes('ninja') ? 'ninja' : 'fitness'}/${lg}`; const ok = imported === 'applied' && !after.x && !after2.x && !after.pwn && !after2.pwn && after2.body > 100 && !errs.length;
    results.push((ok ? 'PASS ' : 'FAIL ') + tag + (ok ? '' : `: import=${imported} executed=${after.x + after2.x} injected=${after.pwn || after2.pwn} text=${after2.body} errors=${[...new Set(errs)].slice(0, 4).join(' | ')}`));
    await p.close();
  }
  // A short obstacle name that survives the length cap must stay text in the "Fell at …" lines (history row and the run's end screen).
  for (const file of ['index.test.html', 'index.ninja.html']) {
    const p = await b.newPage({ viewport: { width: 390, height: 800 } });
    await p.goto('file://' + P.dir + file); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
    await p.click('[data-act="ob-skip"]'); await p.waitForTimeout(200);
    const r = await p.evaluate(() => __eval(`(() => { const X = '<img src=x onerror=__x=1><b id=pwn>';
      S.courses[0].obs[0].name = X; UI.courseId = S.courses[0].id;
      addRec('runs', { ts: Date.now() - 6e4, course: S.courses[0].id, splits: [], total: 5000, done: false, fell: 0 });
      UI.tab = 'progress'; render(); const a = !!document.querySelector('#pwn');
      UI.tab = 'today'; render(); const b = !!document.querySelector('#pwn');
      ACT['run-start']({ dataset: {} }); runnerEnd(false); const c = !!document.querySelector('#pwn');
      return { progress: a, today: b, runEnd: c, text: document.body.innerText.includes('<img') }; })()`));
    await p.waitForTimeout(300); const x = await p.evaluate(() => window.__x || 0);
    const ok = !r.progress && !r.today && !r.runEnd && !x && r.text;
    results.push((ok ? 'PASS ' : 'FAIL ') + 'obstacle name stays text in "Fell at" lines · ' + (file.includes('ninja') ? 'ninja' : 'fitness') + (ok ? '' : ' ' + JSON.stringify(r) + ' x=' + x));
    await p.close();
  }
  console.log(results.join('\n')); await b.close();
})();
