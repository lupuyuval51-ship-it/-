// Finds content that sticks out of its container (circles, chips, buttons, cards): a child wider/taller than its parent,
// text clipped by overflow, and elements pushed off the screen. Every tab, widths 320/360/411, both languages, three users.
// Layout scan: content must stay inside its container (circles, badges, pills, tabs, cards) on every tab and sheet, at 320/360/411 px,
// in both languages, for three kinds of user, with the web fonts BLOCKED (offline first launch uses fallback fonts, which are wider).
const { chromium } = require('playwright');
const P = require('./paths.cjs');
const DAY = 864e5, ws = Date.now() - 30 * DAY;
const NJ = ['bar', 'rings', 'rope', 'monkey', 'beam', 'wall', 'box', 'towel', 'ninja', 'weights'];
const base = { name: 'Alexandra', exp: 1, goal: 0, strength: 6, push: 2, pull: 3, hang: 2, strengths: ['grip'], strengthNote: '', focus: ['grip', 'pull'], days: [0, 1, 2, 3, 4, 5, 6], minutes: 45, limits: ['knee', 'shoulder'], limLv: { knee: 1, shoulder: 2 }, level: 2, startTs: ws, createdTs: ws, adapt: {}, track: 'ninja', ninja: true, places: ['ninja', 'gym'], equip: NJ };
const logs = {}; for (let i = 0; i < 20; i++) { const ts = Date.now() - (i * 2 + 1) * DAY; const d = new Date(ts), m = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); (logs[m] = logs[m] || { sessions: [], runs: [], tests: [] }).sessions.push({ id: 's' + i, u: 1, ts, type: 'A', idx: i % 3, week: 1 + (i >> 2), dur: 2400, n: 12, sets: [['pullup', 8, 8, 0], ['dead-hang', 30, 30, 0]], rpe: 3, note: '' }); }
const found = new Map();
(async () => { const b = await chromium.launch();
  for (const file of ['index.ninja.html', 'index.test.html']) for (const lg of ['en', 'he']) for (const [uname, age] of [['adult', 2], ['teen', 1], ['senior', 4]]) for (const w of [320, 360, 411]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 760 }, isMobile: true, hasTouch: true }); await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort()); const p = await ctx.newPage();
    await p.goto('file://' + P.dir + file);
    await p.evaluate(d => localStorage.setItem('ninja-circuit-v1', JSON.stringify(d)), { v: 1, profile: { ...base, age, body: age === 1 ? undefined : { sex: 'f', h: 165, w: 62 } }, prefs: { lang: lg, remindAsked: true, sound: false, vibe: false, countdown: false, remindOn: false, remindTime: '18:00' }, courses: [], logs, meta: { pu: 1, cu: 0, resetAt: 0 } });
    await p.reload(); await p.waitForTimeout(700);
    const scan = async where => { const r = await p.evaluate(() => { const out = [];
      const vw = document.documentElement.clientWidth;
      document.querySelectorAll('#main *, #sheet *, #ov *, .tabs *').forEach(e => {
        if (!(e instanceof HTMLElement || e instanceof SVGElement)) return; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || e.closest('[hidden]') || e.closest('svg') && e.tagName !== 'svg') return;
        const r = e.getBoundingClientRect(); if (!r.width || !r.height) return;
        const name = (e.className && e.className.baseVal === undefined ? '.' + String(e.className).split(' ')[0] : e.tagName.toLowerCase()) + ' "' + (e.textContent || '').trim().slice(0, 18) + '"';
        // text clipped by its own overflow
        if (cs.overflow !== 'visible' && cs.overflowX !== 'visible' && e.scrollWidth > e.clientWidth + 2 && cs.textOverflow !== 'ellipsis' && !/auto|scroll/.test(cs.overflowX) && e.clientWidth > 0 && (e.textContent || '').trim()) out.push('clipped ' + name + ' ' + e.scrollWidth + '>' + e.clientWidth);
        // a small round or boxed element whose content sticks out of it
        if (/50%|999|99px/.test(cs.borderRadius) && r.width < 60 && e.children.length) for (const c of e.children) { const cr = c.getBoundingClientRect(); if (cr.width > r.width + 1 || cr.height > r.height + 1) out.push('content wider than its circle ' + name + ' ' + Math.round(cr.width) + 'x' + Math.round(cr.height) + ' in ' + Math.round(r.width) + 'x' + Math.round(r.height)); }
        // glyph-level: the text actually painted inside a small badge, circle or pill must sit inside it
        if (r.width < 90 && r.height < 90 && (parseFloat(cs.borderTopLeftRadius) >= 8 || /%/.test(cs.borderTopLeftRadius))) {
          const tw = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); let n; const box = { l: 1e9, t: 1e9, r: -1e9, b: -1e9 };
          while ((n = tw.nextNode())) { if (!n.textContent.trim()) continue; const rg = document.createRange(); rg.selectNodeContents(n); for (const q of rg.getClientRects()) { box.l = Math.min(box.l, q.left); box.t = Math.min(box.t, q.top); box.r = Math.max(box.r, q.right); box.b = Math.max(box.b, q.bottom); } }
          if (box.r > -1e9) { const pad = 2; if (box.l < r.left - pad || box.r > r.right + pad || box.t < r.top - pad || box.b > r.bottom + pad) out.push('text outside its badge ' + name + ' text ' + Math.round(box.r - box.l) + 'x' + Math.round(box.b - box.t) + ' badge ' + Math.round(r.width) + 'x' + Math.round(r.height)); }
        }
        // pushed off screen (not inside a scroller)
        if ((r.right > vw + 2 || r.left < -2) && !e.closest('.hscroll,.chips-scroll,[class*=scroll]') && !e.closest('svg') && cs.position !== 'fixed') out.push('off screen ' + name + ' ' + Math.round(r.left) + '..' + Math.round(r.right) + ' of ' + vw);
      }); return [...new Set(out)].slice(0, 12); });
      for (const x of r) { const key = x; if (!found.has(key)) found.set(key, new Set()); found.get(key).add(`${where} ${lg}/${uname}/${w}`); } };
    const tabs = await p.$$eval('[data-act="tab"]', e => e.map(x => x.dataset.v));
    for (const t of tabs) { await p.evaluate(t => document.querySelector(`[data-act="tab"][data-v="${t}"]`).click(), t); await p.waitForTimeout(250); await scan(t);
      for (const act of ['sess-sheet', 'ready-sheet', 'ex-sheet', 'dish', 'body-sheet', 'inj-sheet']) { const el = await p.$(`[data-act="${act}"]`); if (!el) continue; await el.click({ force: true }).catch(() => {}); await p.waitForTimeout(200); await scan(t + '/' + act); await p.evaluate(() => document.querySelector('[data-act="sheet-close"]')?.click()); } }
    await ctx.close(); }
  await b.close();
  const list = [...found.entries()].filter(([k]) => !/^clipped \.sr /.test(k)).map(([k, v]) => 'FAIL ' + k + '   <- ' + [...v].slice(0, 3).join(', ') + (v.size > 3 ? ' +' + (v.size - 3) : ''));
  console.log(list.length ? list.join('\n') : 'PASS no content sticks out of its container (3 widths x 2 languages x 3 users x 2 editions, fonts blocked)'); })();
