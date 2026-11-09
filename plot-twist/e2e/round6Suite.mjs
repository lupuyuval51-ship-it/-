/**
 * Regression checks from the sixth verification round, against the PRODUCTION build:
 *
 *   import { round6Suite } from './round6Suite.mjs';
 *   await round6Suite(browser, { base, aiBase, slowAiBase, limitedAiBase }, check);
 *
 * - base: run-all's "curated" server (no key); aiBase: the AI server with the mock provider;
 *   slowAiBase: an AI server whose mock writes slowly (an envelope takes ~10 s); limitedAiBase: an
 *   AI server whose provider is rate limited (its Messages API answers 429).
 *
 * Covers: Forward onto a screen another tab emptied when the next entry is a closed sheet's (never
 * a blank page), Back onto one (carried on past it, never the same screen twice), an episode opened from a bookmark (Save & exit, Resume, Back stays in the app),
 * the discard question staying with its own episode, focus when another tab takes away the focused
 * control, poster tiles and typed addresses (Back steps back instead of piling up), a finale whose
 * episode goes while the AI status sheet is open, "Draw again" keeping the detail for the AI, a
 * stalled AI connection, two tabs drawing at the same moment, the dock's fade and scroll padding,
 * the header at 300–400% text and with a 3-digit episode count.
 *
 * Each section runs on its own: one that crashes is reported as a failed check.
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { devices } = require('playwright');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PHONE = devices['iPhone 13'];
const KEY = 'plot-twist:v1';

const h1 = (page) => page.evaluate(() => document.querySelector('main h1')?.textContent?.trim() ?? null);
const waitH1 = (page, re, timeout = 6000) =>
  page.waitForFunction(([src, flags]) => new RegExp(src, flags).test(document.querySelector('main h1')?.textContent ?? ''), [re.source, re.flags], { timeout });
const onlinePill = (page) => page.getByRole('button', { name: /^AI Online\./ });
const dialogs = (page) => page.getByRole('dialog').count();
const stored = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), KEY);
const where = (page) =>
  page.evaluate(() => ({ hash: location.hash, state: history.state, len: history.length, h1: document.querySelector('main h1')?.textContent?.trim() ?? null }));
const active = (page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    return el && el !== document.body ? `${el.tagName.toLowerCase()}:${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40)}` : 'body';
  });
const until = async (fn, timeout = 6000, step = 100) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await fn()) return true;
    await sleep(step);
  }
  return false;
};

async function home(page, base) {
  await page.goto(base);
  await waitH1(page, /plot/i);
}

async function draw(page) {
  await page.getByRole('button', { name: /give me a plot twist/i }).click();
  await page.waitForFunction(() => location.hash === '#/envelopes');
}

async function openLetter(page, n = 0) {
  await page.locator('button.envelope').nth(n).click();
  await page.getByRole('dialog').waitFor();
}

async function startEpisode(page, base) {
  await home(page, base);
  await draw(page);
  await openLetter(page);
  await page.getByRole('button', { name: /start episode/i }).click();
  await page.waitForFunction(() => location.hash === '#/play');
  await page.locator('[data-stage-heading]').first().waitFor();
}

/** Plays the episode on screen to its finale (Done, the first option, …). */
async function finish(page) {
  for (let guard = 0; guard < 14; guard++) {
    if (page.url().includes('#/finale/')) return true;
    const choice = page.locator('section[aria-labelledby=choice-title] button');
    if (await choice.count()) await choice.first().click();
    else if (await page.getByRole('button', { name: /done — i did it/i }).count()) await page.getByRole('button', { name: /done — i did it/i }).click();
    await sleep(250);
  }
  return page.url().includes('#/finale/');
}

/** One finished episode, then back to My Series: the context has a poster tile. */
async function withOneEpisode(page, base) {
  await startEpisode(page, base);
  if (!(await finish(page))) throw new Error('could not finish the episode');
  await waitH1(page, /.+/);
}

/** Another page of the same context resets the whole series. */
async function resetFrom(ctx, base) {
  const b = await ctx.newPage();
  await b.goto(`${base}#/series`);
  await waitH1(b, /series/i);
  await b.getByRole('button', { name: /reset all episodes/i }).click();
  await b.getByRole('button', { name: /yes, reset everything/i }).click();
  await sleep(600);
  await b.close();
}

/** Counts this context's requests for a personalized episode (each one is a paid generation), with the detail each carried. */
function countGenerations(ctx) {
  const seen = [];
  ctx.on('request', (r) => {
    if (!r.url().endsWith('/api/episodes/generate') || r.method() !== 'POST') return;
    let detail = null;
    try {
      detail = JSON.parse(r.postData() || '{}').detail ?? null;
    } catch {}
    seen.push({ at: Date.now(), detail });
  });
  return seen;
}

export async function round6Suite(browser, { base, aiBase, slowAiBase, limitedAiBase }, check) {
  console.log('\n▶ round 6 (Forward onto emptied screens, bookmarked episodes, focus, poster tiles, AI detail, stalls, simultaneous draws, dock fade, large text)');
  const section = async (name, fn) => {
    try {
      await fn();
    } catch (err) {
      check(`${name} (section ran)`, false, String(err).split('\n')[0]);
    }
  };

  await section('Back and Forward onto a screen another tab emptied', async () => {
    // 1. The envelopes, with a closed letter's entry beyond them.
    {
      const ctx = await browser.newContext(PHONE);
      const a = await ctx.newPage();
      await home(a, base);
      await draw(a);
      await openLetter(a);
      await a.getByRole('button', { name: /look at another envelope/i }).click();
      await until(async () => (await dialogs(a)) === 0);
      await sleep(300);
      await a.goBack();
      await waitH1(a, /plot/i);
      const homeIdx = (await where(a)).state?.idx;
      const b = await ctx.newPage();
      await b.goto(`${base}#/envelopes`);
      await openLetter(b, 1);
      await b.getByRole('button', { name: /start episode/i }).click();
      await b.waitForFunction(() => location.hash === '#/play');
      await sleep(500);
      await b.close();
      await a.bringToFront();
      await a.goForward();
      const landed = await until(async () => /plot/i.test((await h1(a)) ?? ''), 3000);
      const w = await where(a);
      check('Forward onto envelopes another tab used up (a closed letter beyond them): Home, not a blank page', landed && w.hash === '#/' && w.state?.idx === homeIdx, JSON.stringify(w));
      await ctx.close();
    }
    // 2. An episode's poster page, with a closed AI status sheet's entry beyond it.
    {
      const ctx = await browser.newContext(PHONE);
      const a = await ctx.newPage();
      await withOneEpisode(a, base);
      await a.goto(`${base}#/series`);
      await waitH1(a, /series/i);
      await a.locator('a[href^="#/series/"]').first().click();
      await a.waitForFunction(() => /^#\/series\/.+/.test(location.hash));
      await a.getByRole('button', { name: /^AI .*AI Director:/ }).click();
      await a.getByRole('dialog').waitFor();
      await a.getByRole('button', { name: 'Close' }).click();
      await until(async () => (await dialogs(a)) === 0);
      await sleep(300);
      await a.goBack();
      await waitH1(a, /series/i);
      const seriesIdx = (await where(a)).state?.idx;
      await resetFrom(ctx, base);
      await a.bringToFront();
      await a.goForward();
      const landed = await until(async () => /series/i.test((await h1(a)) ?? ''), 3000);
      await sleep(600);
      const w = await where(a);
      check('Forward onto an episode another tab removed (a closed status sheet beyond it): My Series, not a blank page', landed && w.hash === '#/series' && w.state?.idx === seriesIdx, JSON.stringify(w));
      await ctx.close();
    }
    // 3. Back onto a finale another tab removed, from the My Series it led to: past it, never My Series again.
    {
      const ctx = await browser.newContext(PHONE);
      const a = await ctx.newPage();
      await a.goto('about:blank');
      await withOneEpisode(a, base);
      await a.getByRole('button', { name: /see my series/i }).click();
      await waitH1(a, /series/i);
      await resetFrom(ctx, base);
      await a.bringToFront();
      await sleep(400);
      await a.goBack();
      await sleep(1500);
      const w = await where(a);
      check('Back from My Series onto a finale another tab removed: carries on past it (Home), never My Series again', w.hash === '#/' && /plot/i.test(w.h1 ?? ''), JSON.stringify(w));
      await a.goBack();
      await sleep(700);
      check('…and the next Back leaves', a.url() === 'about:blank', a.url());
      await ctx.close();
    }
  });

  await section('an episode opened from a bookmark', async () => {
    const ctx = await browser.newContext(PHONE);
    const a = await ctx.newPage();
    await startEpisode(a, base);
    await a.close();
    const page = await ctx.newPage();
    await page.goto(`${base}#/play`);
    await page.locator('[data-stage-heading]').first().waitFor();
    await page.getByRole('button', { name: /Save & exit/ }).click();
    await waitH1(page, /plot/i);
    await sleep(300);
    await page.getByRole('button', { name: /resume episode/i }).first().click();
    await page.waitForFunction(() => location.hash === '#/play');
    await page.locator('[data-stage-heading]').first().waitFor();
    await sleep(300);
    await page.goBack();
    const home = await until(async () => /plot/i.test((await h1(page)) ?? ''), 3000);
    const w = await where(page);
    // Saving is debounced: wait for it.
    let run = null;
    await until(async () => {
      run = (await stored(page))?.run ?? null;
      return Boolean(run) && run.runningSince === null;
    }, 3000);
    check('opened at #/play: Save & exit, Resume, then Back lands Home (not out of the app)', home && w.hash === '#/', JSON.stringify(w));
    check('…and leaving the episode that way pauses it', Boolean(run) && run.runningSince === null, JSON.stringify({ runningSince: run?.runningSince }));
    await ctx.close();
  });

  await section('the discard question stays with its episode', async () => {
    const ctx = await browser.newContext(PHONE);
    const a = await ctx.newPage();
    await startEpisode(a, base);
    await a.getByRole('button', { name: /Save & exit/ }).click();
    await waitH1(a, /plot/i);
    await a.getByRole('button', { name: /discard this episode/i }).click();
    await a.getByRole('dialog').waitFor();
    const b = await ctx.newPage();
    await home(b, base);
    await b.getByRole('button', { name: /discard this episode/i }).click();
    await b.getByRole('button', { name: /yes, discard it/i }).click();
    await sleep(500);
    await draw(b);
    await openLetter(b, 1);
    await b.getByRole('button', { name: /start episode/i }).click();
    await b.waitForFunction(() => location.hash === '#/play');
    await sleep(800);
    await b.close();
    await a.bringToFront();
    await sleep(500);
    const open = await dialogs(a);
    const state = (await where(a)).state;
    check('"Discard this episode?" closes when another tab discards it, and does not reopen for the next episode', open === 0 && state?.sheet !== 'plot-twist-discard', JSON.stringify({ open, state }));
    await ctx.close();
  });

  await section('focus when another tab takes the focused control away', async () => {
    {
      const ctx = await browser.newContext(PHONE);
      const a = await ctx.newPage();
      await home(a, base);
      await draw(a);
      await a.locator('button.envelope').first().focus();
      const b = await ctx.newPage();
      await b.goto(`${base}#/envelopes`);
      await openLetter(b, 1);
      await b.getByRole('button', { name: /start episode/i }).click();
      await b.waitForFunction(() => location.hash === '#/play');
      await sleep(500);
      await b.close();
      await a.bringToFront();
      await waitH1(a, /gone/i);
      await sleep(400);
      const f = await active(a);
      check('focus on an envelope another tab used up: on "These envelopes are gone." (not <body>)', /^h1:These envelopes are gone/.test(f), f);
      await ctx.close();
    }
    {
      const ctx = await browser.newContext(PHONE);
      const a = await ctx.newPage();
      await startEpisode(a, base);
      await a.getByRole('button', { name: /Save & exit/ }).click();
      await waitH1(a, /plot/i);
      await a.getByRole('button', { name: /discard this episode/i }).focus();
      const b = await ctx.newPage();
      await home(b, base);
      await b.getByRole('button', { name: /discard this episode/i }).click();
      await b.getByRole('button', { name: /yes, discard it/i }).click();
      await sleep(500);
      await b.close();
      await a.bringToFront();
      await sleep(600);
      const f = await active(a);
      check('focus on "Discard this episode" when another tab discards it: on the Home heading (not <body>)', /^h1:What/.test(f), f);
      await ctx.close();
    }
  });

  await section('poster tiles and typed addresses', async () => {
    const ctx = await browser.newContext(PHONE);
    const page = await ctx.newPage();
    await withOneEpisode(page, base);
    await page.goto(`${base}#/series`);
    await waitH1(page, /series/i);
    const before = (await where(page)).len;
    for (let i = 0; i < 5; i++) {
      await page.locator('a[href^="#/series/"]').first().click();
      await page.waitForFunction(() => /^#\/series\/.+/.test(location.hash));
      await page.getByRole('button', { name: 'Back to My Series' }).click();
      await page.waitForFunction(() => location.hash === '#/series');
      await sleep(150);
    }
    const after = (await where(page)).len;
    check('My Series → poster → "Back to My Series" ×5: history does not grow', after <= before + 1, `${before} → ${after}`);
    // The poster page goes in another tab: it steps back onto My Series, so the next Back leaves it.
    await page.locator('a[href^="#/series/"]').first().click();
    await page.waitForFunction(() => /^#\/series\/.+/.test(location.hash));
    const seriesIdx = (await where(page)).state?.idx - 1;
    await resetFrom(ctx, page.url().split('#')[0]);
    await page.bringToFront();
    await waitH1(page, /series/i);
    await sleep(500);
    const w = await where(page);
    check('a poster page another tab removed steps back onto My Series (no second copy of it)', w.hash === '#/series' && w.state?.idx === seriesIdx, JSON.stringify(w));
    // A typed address for a screen with nothing to show steps back to where it was typed.
    await page.goto(`${base}#/`);
    await waitH1(page, /plot/i);
    const homeIdx = (await where(page)).state?.idx;
    await page.evaluate(() => {
      location.hash = '#/play';
    });
    await sleep(900);
    const t = await where(page);
    check('typing #/play with no episode: back onto the Home it was typed on (no second Home)', t.hash === '#/' && t.state?.idx === homeIdx, JSON.stringify(t));
    await ctx.close();
  });

  await section('a finale whose episode goes while the AI status sheet is open', async () => {
    const ctx = await browser.newContext(PHONE);
    const page = await ctx.newPage();
    await withOneEpisode(page, base);
    await page.getByRole('button', { name: /^AI .*AI Director:/ }).click();
    await page.getByRole('dialog').waitFor();
    await resetFrom(ctx, base);
    await page.bringToFront();
    const onSeries = await until(async () => /series/i.test((await h1(page)) ?? ''), 4000);
    await sleep(400);
    const open = await dialogs(page);
    check('the finale\'s episode removed in another tab with the status sheet open: My Series, sheet closed', onSeries && open === 0, JSON.stringify({ ...(await where(page)), open }));
    await page.goBack();
    await sleep(1200);
    const w = await where(page);
    check('…and the next Back moves on (never My Series again)', w.hash !== '#/series', JSON.stringify(w));
    await ctx.close();
  });

  await section('"Draw again" keeps the detail for the AI', async () => {
    const DETAIL = 'something with street music';
    // Another tab's "Draw again" while the envelope is being written: carried, with its detail.
    {
      const ctx = await browser.newContext(PHONE);
      const seen = countGenerations(ctx);
      const a = await ctx.newPage();
      await a.goto(slowAiBase);
      await onlinePill(a).waitFor({ timeout: 15000 });
      await a.locator('#ai-detail').fill(DETAIL);
      await draw(a);
      await a.locator('[data-writing]').first().waitFor({ timeout: 5000 });
      const b = await ctx.newPage();
      await b.goto(`${slowAiBase}#/envelopes`);
      await onlinePill(b).waitFor({ timeout: 15000 });
      await sleep(1200);
      await b.getByRole('button', { name: /draw again/i }).click();
      await sleep(12000);
      const d = (await stored(b))?.draw;
      check('"Draw again" in another tab (its field empty): no second paid request, and the draw keeps its detail', seen.length === 1 && d?.detail === DETAIL, JSON.stringify({ requests: seen.map((s) => s.detail), detail: d?.detail }));
      await ctx.close();
    }
    // A reload while writing, then "Draw again": every request carries the detail, and the field shows it.
    {
      const ctx = await browser.newContext(PHONE);
      const seen = countGenerations(ctx);
      const a = await ctx.newPage();
      await a.goto(slowAiBase);
      await onlinePill(a).waitFor({ timeout: 15000 });
      await a.locator('#ai-detail').fill(DETAIL);
      await draw(a);
      await a.locator('[data-writing]').first().waitFor({ timeout: 5000 });
      await sleep(1200);
      await a.reload();
      await onlinePill(a).waitFor({ timeout: 15000 });
      await sleep(2500);
      await a.getByRole('button', { name: /draw again/i }).click();
      await sleep(12000);
      const d = (await stored(a))?.draw;
      await a.getByRole('button', { name: 'Edit the scene' }).click();
      await waitH1(a, /plot/i);
      const field = await a.locator('#ai-detail').inputValue();
      check('reload while writing, then "Draw again": the detail goes with every request and stays on the draw', seen.length <= 2 && seen.every((s) => s.detail === DETAIL) && d?.detail === DETAIL, JSON.stringify({ requests: seen.map((s) => s.detail), detail: d?.detail }));
      check('…and the detail field shows the ask of the envelopes on the table', field === DETAIL, JSON.stringify(field));
      await ctx.close();
    }
  });

  await section('a stalled AI connection', async () => {
    const ctx = await browser.newContext(PHONE);
    const page = await ctx.newPage();
    // The request is never answered (a connection stuck on the way); time is fast-forwarded.
    await page.route('**/api/episodes/generate', () => {});
    await page.clock.install();
    await page.goto(aiBase);
    await onlinePill(page).waitFor({ timeout: 15000 });
    await draw(page);
    await page.locator('[data-writing]').first().waitFor({ timeout: 5000 });
    await page.clock.fastForward(30_000);
    await sleep(300);
    const stillWriting = await page.locator('[data-writing]').count();
    await page.clock.fastForward(16_000);
    await sleep(800);
    const s = await page.evaluate((k) => {
      const st = JSON.parse(localStorage.getItem(k));
      return { envs: st.draw.envelopes.map((e) => ({ status: e.status, source: e.source, note: e.note ?? null })), beat: localStorage.getItem(`${k}:gen`) };
    }, KEY);
    const ai = s.envs[s.envs.length - 1];
    check('a stalled AI request is still waited on at 30 s (the server pings every 15 s)', stillWriting === 1, `writing=${stillWriting}`);
    check('…and given up after 45 s of silence: an archive pick says so, nothing stays "writing"', ai.status === 'ready' && ai.source === 'curated' && /stalled/.test(ai.note ?? '') && s.beat === null && (await page.locator('[data-writing]').count()) === 0, JSON.stringify(s));
    await ctx.close();
  });

  await section('the pill after the provider\'s short hold', async () => {
    if (!limitedAiBase) return;
    const ctx = await browser.newContext(PHONE);
    const page = await ctx.newPage();
    await page.goto(limitedAiBase);
    await onlinePill(page).waitFor({ timeout: 15000 });
    const t0 = Date.now();
    await draw(page);
    await page.waitForFunction(() => !document.querySelector('[data-writing]'), null, { timeout: 30000 });
    const label = () => page.evaluate(() => document.querySelector('header button[aria-label^="AI"]')?.getAttribute('aria-label')?.split('.')[0] ?? null);
    await sleep(Math.max(0, t0 + 5000 - Date.now()));
    const during = await label();
    // No focus event, no reload: the page looks again by itself once the server's 30 s hold is over.
    const recovered = await until(async () => (await label()) === 'AI Online', 45000, 500);
    const after = Math.round((Date.now() - t0) / 1000);
    check('a provider rate limit while writing: "AI Busy" for the server\'s hold, then "AI Online" again by itself (well before the minute poll)', during === 'AI Busy' && recovered && after <= 40, `during=${during} recovered=${recovered} after ${after}s`);
    await ctx.close();
  });

  await section('two tabs draw at the same moment', async () => {
    for (const offset of [0, 3]) {
      const ctx = await browser.newContext(PHONE);
      const seen = countGenerations(ctx);
      const a = await ctx.newPage();
      await a.goto(slowAiBase);
      await onlinePill(a).waitFor({ timeout: 15000 });
      const b = await ctx.newPage();
      await b.goto(slowAiBase);
      await onlinePill(b).waitFor({ timeout: 15000 });
      await sleep(400);
      const at = Date.now() + 700;
      const fire = (p, d) =>
        p.evaluate(
          ([t]) => {
            const btn = [...document.querySelectorAll('button')].find((x) => /give me a plot twist/i.test(x.textContent));
            setTimeout(() => btn.click(), Math.max(0, t - Date.now()));
          },
          [at + d],
        );
      await Promise.all([fire(a, 0), fire(b, offset)]);
      await sleep(13000);
      const [sa, sb] = await Promise.all([stored(a), stored(b)]);
      const writing = (await a.locator('[data-writing]').count()) + (await b.locator('[data-writing]').count());
      const ai = sa?.draw?.envelopes?.find((e) => e.source === 'ai');
      check(`two tabs tap "Give me a plot twist" ${offset} ms apart: at most 2 paid requests, one draw in both, its envelope written`, seen.length <= 2 && sa?.draw?.id === sb?.draw?.id && ai?.status === 'ready' && writing === 0, JSON.stringify({ paid: seen.length, same: sa?.draw?.id === sb?.draw?.id, ai: ai?.status, writing }));
      await ctx.close();
    }
  });

  await section('the dock: focus and text clear of its fade', async () => {
    for (const inset of [0, 34]) {
      const ctx = await browser.newContext(PHONE);
      const page = await ctx.newPage();
      if (inset) {
        const cdp = await ctx.newCDPSession(page);
        await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 47, bottom: inset, left: 0, right: 0 } });
      }
      await startEpisode(page, base);
      await page.getByRole('button', { name: /Save & exit/ }).click();
      await waitH1(page, /plot/i);
      await sleep(400);
      await page.evaluate(() => document.querySelector('main h1')?.focus());
      const bad = [];
      for (let i = 0; i < 30; i++) {
        await page.keyboard.press('Tab');
        await sleep(60);
        const m = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || !el.closest('main') || el.closest('.dock')) return null;
          const fadeTop = document.querySelector('.dock').getBoundingClientRect().top - 41;
          const r = el.getBoundingClientRect();
          return { name: (el.getAttribute('aria-label') || el.textContent || el.id || '').trim().slice(0, 30), bottom: Math.round(r.bottom + 5), fadeTop: Math.round(fadeTop) };
        });
        if (m && m.bottom > m.fadeTop) bad.push(`${m.name}:${m.bottom}>${m.fadeTop}`);
      }
      check(`Tab down Home with an episode (${inset}px home-indicator inset): every focus ring ends above the dock's fade`, bad.length === 0, bad.join(' ') || 'all clear');
      if (!inset) {
        const fade = await page.evaluate(() => getComputedStyle(document.querySelector('.dock'), '::before').backgroundImage);
        check('the fade above the dock only dims (to half), so text there stays readable', /rgba\(11, 10, 9, 0\.5\)/.test(fade), fade);
      }
      await ctx.close();
    }
  });

  await section('the header at very large text', async () => {
    for (const [width, px] of [
      [320, 48],
      [360, 48],
      [320, 64],
      [390, 64],
    ]) {
      const ctx = await browser.newContext({ viewport: { width, height: 740 } });
      const page = await ctx.newPage();
      await page.route('**/api/status*', async (route) => {
        await sleep(8000);
        return route.continue().catch(() => {});
      });
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('Page.enable');
      await cdp.send('Page.setFontSizes', { fontSizes: { standard: px, fixed: px } });
      await page.goto(base);
      await sleep(600);
      const m = await page.evaluate(() => {
        const pill = document.querySelector('header button[aria-label^="AI"]').getBoundingClientRect();
        return { root: getComputedStyle(document.documentElement).fontSize, left: Math.round(pill.left), wide: document.documentElement.scrollWidth };
      });
      const ok = m.root === `${px}px` && m.left >= 0 && (px > 48 || m.wide <= width);
      check(`${px}px text at ${width}px: the "AI Checking" pill is never cut off at the start edge${px === 48 ? ', and nothing scrolls sideways' : ''}`, ok, JSON.stringify(m));
      await ctx.close();
    }
  });

  await section('the header with a 3-digit episode count', async () => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
    const page = await ctx.newPage();
    await withOneEpisode(page, base);
    await page.route('**/api/status*', async (route) => {
      await sleep(8000);
      return route.continue().catch(() => {});
    });
    // 100 copies of that episode (as if played 100 times), then a fresh load — in the default
    // vibe and in "Main character energy" (the widest wordmark).
    for (const weirdness of [2, 3]) {
      await page.evaluate(
        ([k, w]) => {
          const s = JSON.parse(localStorage.getItem(k));
          const ep = s.completed[0];
          s.completed = Array.from({ length: 100 }, (_, i) => ({ ...ep, id: `${ep.id.replace(/-\d+$/, '')}-${i}`, episodeNumber: i + 1 }));
          s.prefs = { ...s.prefs, weirdness: w };
          localStorage.setItem(k, JSON.stringify(s));
        },
        [KEY, weirdness],
      );
      await page.setViewportSize({ width: 390, height: 800 });
      await page.goto(base);
      await waitH1(page, /plot/i);
      const label = await page.evaluate(() => `${document.querySelector('header button[aria-label^="My Series"]')?.getAttribute('aria-label')} · ${document.documentElement.dataset.vibe}`);
      const bad = [];
      for (const width of [420, 421, 422, 423, 424, 426, 430]) {
        await page.setViewportSize({ width, height: 800 });
        await sleep(80);
        const m = await page.evaluate(() => ({ h: Math.round(document.querySelector('header').getBoundingClientRect().height), wide: document.documentElement.scrollWidth }));
        if (m.h > 60 || m.wide > width) bad.push(`${width}:${m.h}px/${m.wide}`);
      }
      check(`${label}, "AI Checking", 420–430px: the header stays one row`, bad.length === 0 && /100 episodes/.test(label), bad.join(' ') || 'all one row');
    }
    await ctx.close();
  });
}
