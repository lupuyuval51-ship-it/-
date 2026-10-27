const P = require('./paths.cjs');
const { chromium } = require('playwright');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(P.FIT); await p.waitForTimeout(500);
  const ev = (code) => p.evaluate(c => __eval(c), code);
  const base = `const mk = o => Object.assign(quickProfile(), { places: ['home','gym','ninja'], equip: ['towel','weights','barbell','machine','band','cardiom','box','bar','rings','rope','monkey','beam','wall','ninja'], minutes: 45, days: [1,2,3,4,5], age: 2, exp: 1, level: 1, pull: 3, ninja: true, track: 'ninja' }, o);
    const allIds = (P, wk) => { const ids = []; for (const type of Object.keys(TPL)) { const s = buildSession(P, type, wk); for (const bl of s.blocks) for (const it of bl.items) ids.push(it.ex); } for (const w of READY) { const s = buildSession(P, 'R:' + w.id, wk); for (const bl of s.blocks) for (const it of bl.items) ids.push(it.ex); } return ids; };`;
  const HANG = ['rope-climb','dead-hang','rope-hang','towel-hang','hang-knee','hanging-leg-raise','toes-bar','hang-switch','kip-swing','ring-swing','ring-traverse','lache','shoulder-press-machine','pushup','pu-diamond','bench-press','overhead-press'];
  const ids = await ev(`(() => { ${base} return allIds(mk({ limits: ['shoulder'], limLv: { shoulder: 2 } }), 2); })()`);
  ok(!ids.some(i => HANG.includes(i)), 'injured shoulder: no hangs, rope climbs, presses or push-ups anywhere: ' + [...new Set(ids.filter(i => HANG.includes(i)))].join());
  const soreIds = await ev(`(() => { ${base} return allIds(mk({ limits: ['shoulder'], limLv: { shoulder: 1 } }), 2); })()`);
  ok(!soreIds.some(i => ['rope-climb','shoulder-press-machine','pu-diamond','kip-swing','lache','hang-switch'].includes(i)), 'sore shoulder: no rope climb, machine press, diamond, kip');
  const kneeInj = await ev(`(() => { ${base} const P = mk({ limits: ['knee'], limLv: { knee: 2 } }); return READY.filter(w => !readyFits(P, w)).map(w => w.id); })()`);
  ok(true, 'injured knee hidden workouts (info): ' + kneeInj.join());
  const kneeShown = await ev(`(() => { ${base} const P = mk({ limits: ['knee'], limLv: { knee: 2 } }); return READY.filter(w => readyFits(P, w)).every(w => mainCount(buildSession(P, 'R:' + w.id, 1)) >= 3 || mainCount(buildSession(Object.assign({}, P, { limits: [], limLv: {}, age: 2 }), 'R:' + w.id, 1)) < 3); })()`);
  ok(kneeShown, 'every shown workout keeps at least 3 exercises');
  const noHidden = await ev(`(() => { ${base} const P = mk({}); return READY.every(w => readyFits(P, w)); })()`);
  ok(noHidden, 'healthy adult: nothing hidden');
  const beg = await ev(`(() => { ${base} const P = mk({ ninja: false, track: 'muscle', strength: 1, push: 0, focus: ['arms','chest'] }); return allIds(P, 2).filter(i => ['pu-diamond','pike-pushup','decline-pushup','pu-wide','pu-tempo','pushup'].includes(i)); })()`);
  ok(beg.length === 0, 'beginner who cannot do a full push-up: no diamond/pike/decline/full push-ups: ' + [...new Set(beg)].join());
  const inj = await ev(`(() => { ${base} const P = mk({ ninja: false, track: 'muscle', limits: ['shoulder'], limLv: { shoulder: 2 } }); return planOf(P).map(t => mainCount(buildSession(P, t, 2))); })()`);
  ok(inj.every(n => n >= 3), 'injured shoulder: every plan day has >= 3 exercises ' + inj.join());
  // focus never lands a push-up on a pull day
  const focus = await ev(`(() => { ${base} const P = mk({ ninja: false, track: 'muscle', strength: 5, focus: ['arms'] }); const out = []; for (const t of planOf(P)) for (let wk = 1; wk <= 8; wk++) { const s = buildSession(P, t, wk); const f = s.blocks.find(b => b.k === 'focus'); if (f) out.push(t + ':' + f.items[0].ex); } return out; })()`);
  ok(!focus.some(x => /pu-|pushup/.test(x)), 'arms focus never a push-up: ' + [...new Set(focus)].join());
  // swap alternatives for the glute bridge
  const alts = await ev(`(() => { ${base} const P = mk({ ninja: false, track: 'general', equip: ['towel'] }); const cur = EX['glute-bridge']; const cats = ['legs','glutes']; return Object.values(EX).filter(e => cats.includes(e.cat) && e.id !== cur.id && usable(e, P, P.level) && pushOk(e, P)).length; })()`);
  ok(alts >= 2, 'glute bridge has swap alternatives: ' + alts);
  // 4 weeks x every track: sessions fit the chosen minutes and never come out empty
  const sim = await ev(`(() => { ${base} const bad = []; for (const tr of ['general','muscle','lean','athlete','ninja']) for (const minutes of [15,30,45,60]) for (const place of [['home'],['gym'],['home','gym']]) { const P = mk({ ninja: tr === 'ninja', track: tr, minutes, places: place, equip: place.includes('gym') ? ['towel','weights','barbell','machine','band','cardiom','box','bar'] : ['towel'], focus: [] }); for (let wk = 1; wk <= 4; wk++) for (const t of planOf(P)) { const s = buildSession(P, t, wk); if (mainCount(s) < 2) bad.push(tr+minutes+place+wk+t+'<2'); if (s.est > minutes * 1.35 + 3) bad.push(tr+minutes+place.join('+')+wk+t+' est '+s.est); } } return bad.slice(0, 12); })()`);
  ok(sim.length === 0, 'tracks x minutes x places x 4 weeks: ' + (sim.length ? sim.join(' ; ') : 'all sessions fit'));
  console.log(fails ? 'FAILED ' + fails : 'ALL PASSED', errs.join('|') || 'no errors'); await b.close();
})();
