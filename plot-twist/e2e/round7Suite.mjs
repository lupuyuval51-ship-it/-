/**
 * Regression checks from the seventh verification round, against the PRODUCTION build:
 *
 *   import { round7Suite } from './round7Suite.mjs';
 *   await round7Suite(browser, { base, aiBase, slowAiBase, limitedAiBase }, check);
 *
 * - base: run-all's "curated" server (no key); aiBase: the AI server with the mock provider;
 *   slowAiBase: an AI server whose mock writes slowly (an envelope takes ~10 s); limitedAiBase: an
 *   AI server whose provider is rate limited (its Messages API answers 429).
 *
 * Covers: steps back the app takes itself (the sheet guard at a reload, Save & exit) never carrying
 * on past a screen with nothing to show the way the user's own Back does, "Draw again" keeping the
 * detail after envelopes dealt while the AI Director was paused, tabs that draw at the same moment
 * paying for one envelope (and agreeing on the draw at once), the status check a hidden tab missed,
 * and the header at 350–400% text.
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
const pillLabel = (page) => page.evaluate(() => document.querySelector('header button[aria-label^="AI"]')?.getAttribute('aria-label')?.split('.')[0] ?? null);
const stored = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), KEY);
const where = (page) =>
  page.evaluate(() => ({ hash: location.hash, state: history.state, len: history.length, h1: document.querySelector('main h1')?.textContent?.trim() ?? null }));
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

/** Removes data from storage in this tab only (no storage event): as if another tab did it while this one was discarded. */
function removeQuietly(page, what) {
  return page.evaluate(
    ([k, w]) => {
      const s = JSON.parse(localStorage.getItem(k));
      if (w.episode) s.completed = s.completed.filter((c) => c.id !== w.episode);
      if (w.draw) s.draw = null;
      localStorage.setItem(k, JSON.stringify(s));
    },
    [KEY, what],
  );
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

export async function round7Suite(browser, { base, aiBase, slowAiBase, limitedAiBase }, check) {
  console.log('\n▶ round 7 (the app\'s own history steps, Draw again after a paused AI, simultaneous draws, a hidden tab\'s status check, 400% text)');
  const section = async (name, fn) => {
    try {
      await fn();
    } catch (err) {
      check(`${name} (section ran)`, false, String(err).split('\n')[0]);
    }
  };

  await section("the app's own steps back never carry on past a screen with nothing to show", async () => {
    // A bookmarked episode page (the tab's first entry in the app) with the AI status sheet open;
    // the episode goes while this tab can't hear it; reload. The sheet guard steps back over the
    // stale sheet's entry: that is not the user's Back, so the page doesn't carry on out of the app.
    {
      const ctx = await browser.newContext(PHONE);
      const seed = await ctx.newPage();
      await home(seed, base);
      await draw(seed);
      await openLetter(seed);
      await seed.getByRole('button', { name: /start episode/i }).click();
      await seed.waitForFunction(() => location.hash === '#/play');
      await seed.locator('[data-stage-heading]').first().waitFor();
      if (!(await finish(seed))) throw new Error('could not finish the episode');
      const id = decodeURIComponent((await seed.evaluate(() => location.hash)).split('/')[2]);
      await seed.close();
      const page = await ctx.newPage();
      await page.goto('about:blank');
      await page.goto(`${base}#/series/${encodeURIComponent(id)}`);
      await waitH1(page, /.+/);
      await sleep(800);
      await page.getByRole('button', { name: /^AI .*AI Director:/ }).click();
      await page.getByRole('dialog').waitFor();
      await sleep(300);
      await removeQuietly(page, { episode: id });
      await page.reload();
      await sleep(2000);
      const inApp = page.url().startsWith(base);
      const w = inApp ? await where(page) : { url: page.url() };
      check('reload on a bookmarked episode page (status sheet open) whose episode went meanwhile: My Series, still in the app', inApp && w.hash === '#/series' && /series/i.test(w.h1 ?? ''), JSON.stringify(w));
      await ctx.close();
    }
    // The same with envelopes opened in a new tab (a letter open) whose draw went: Home.
    {
      const ctx = await browser.newContext(PHONE);
      const seed = await ctx.newPage();
      await home(seed, base);
      await draw(seed);
      await sleep(400);
      await seed.close();
      const page = await ctx.newPage();
      await page.goto('about:blank');
      await page.goto(`${base}#/envelopes`);
      await waitH1(page, /envelope/i);
      await openLetter(page);
      await sleep(300);
      await removeQuietly(page, { draw: true });
      await page.reload();
      await sleep(2000);
      const inApp = page.url().startsWith(base);
      const w = inApp ? await where(page) : { url: page.url() };
      check('reload on envelopes (a letter open, the tab\'s first entry) whose draw went meanwhile: Home, still in the app', inApp && w.hash === '#/' && /plot/i.test(w.h1 ?? ''), JSON.stringify(w));
      await ctx.close();
    }
    // Save & exit steps back onto the envelopes the episode used up; they were opened from the
    // address bar on My Series. Home takes their place (with its Resume card), not My Series.
    {
      const ctx = await browser.newContext(PHONE);
      const page = await ctx.newPage();
      await home(page, base);
      await draw(page);
      await sleep(400);
      await page.getByRole('button', { name: /^My Series/ }).click();
      await waitH1(page, /series/i);
      await page.goto(`${base}#/envelopes`);
      await waitH1(page, /envelope/i);
      await openLetter(page);
      await page.getByRole('button', { name: /start episode/i }).click();
      await page.waitForFunction(() => location.hash === '#/play');
      await page.locator('[data-stage-heading]').first().waitFor();
      await sleep(400);
      await page.getByRole('button', { name: /Save & exit/ }).last().click();
      await sleep(1500);
      const w = await where(page);
      const resume = await page.getByRole('button', { name: /resume episode/i }).count();
      check('envelopes opened from the address bar on My Series → episode → Save & exit: Home, with its Resume card', w.hash === '#/' && resume > 0, JSON.stringify({ ...w, resume }));
      await ctx.close();
    }
  });

  await section('"Draw again" after envelopes dealt while the AI Director was paused', async () => {
    const DETAIL = 'it is raining and I have chalk';
    const ctx = await browser.newContext(PHONE);
    const seen = countGenerations(ctx);
    const a = await ctx.newPage();
    await a.goto(aiBase);
    await onlinePill(a).waitFor({ timeout: 15000 });
    await a.locator('#ai-detail').fill(DETAIL);
    // Another tab is told to pause AI envelopes for a few seconds (as the server's rate limit does).
    const b = await ctx.newPage();
    await b.goto(aiBase);
    await b.evaluate((k) => localStorage.setItem(`${k}:ai-block`, JSON.stringify({ until: Date.now() + 5000, reason: 'busy' })), KEY);
    await b.close();
    const busy = await until(async () => (await pillLabel(a)) === 'AI Busy', 3000);
    await draw(a);
    await sleep(500);
    const curatedOnly = Boolean((await stored(a))?.draw?.envelopes?.every((e) => e.source === 'curated'));
    await onlinePill(a).waitFor({ timeout: 15000 });
    await a.getByRole('button', { name: /draw again/i }).click();
    await until(async () => seen.length > 0, 5000);
    await sleep(500);
    check('envelopes dealt while the AI Director is paused, then "Draw again" once it is back: the AI request carries the detail', busy && curatedOnly && seen.length === 1 && seen[0].detail === DETAIL, JSON.stringify({ busy, curatedOnly, requests: seen.map((s) => s.detail) }));
    await ctx.close();
  });

  await section('tabs that draw at the same moment', async () => {
    for (const [tabs, offset] of [
      [2, 0],
      [2, 1],
      [3, 0],
    ]) {
      const ctx = await browser.newContext(PHONE);
      const seen = countGenerations(ctx);
      const pages = [];
      for (let i = 0; i < tabs; i++) {
        const p = await ctx.newPage();
        await p.goto(slowAiBase);
        await onlinePill(p).waitFor({ timeout: 15000 });
        pages.push(p);
      }
      await sleep(400);
      const at = Date.now() + 700;
      await Promise.all(
        pages.map((p, i) =>
          p.evaluate(
            ([t]) => {
              const btn = [...document.querySelectorAll('button')].find((x) => /give me a plot twist/i.test(x.textContent));
              setTimeout(() => btn.click(), Math.max(0, t - Date.now()));
            },
            [at + (i === 1 ? offset : 0)],
          ),
        ),
      );
      const done = await until(async () => {
        const writing = await Promise.all(pages.map((p) => p.locator('[data-writing]').count()));
        return Date.now() > at + 3000 && writing.every((n) => n === 0);
      }, 25000, 300);
      const s = await stored(pages[0]);
      const ai = s?.draw?.envelopes?.find((e) => e.source === 'ai');
      const title = ai?.adventure?.title ?? '';
      // Each tab's own envelopes (its DOM, not the shared storage) include the one the AI wrote.
      const written = await Promise.all(
        pages.map((p) =>
          p.evaluate((t) => Boolean(t) && [...document.querySelectorAll('button.envelope')].some((b) => (b.getAttribute('aria-label') ?? '').includes(`, written for you: ${t}.`)), title),
        ),
      );
      check(
        `${tabs} tabs tap "Give me a plot twist" ${offset} ms apart: one paid request, and every tab shows the envelope it wrote`,
        done && seen.length === 1 && ai?.status === 'ready' && ai?.source === 'ai' && written.every(Boolean),
        JSON.stringify({ paid: seen.length, ai: ai ? `${ai.status}:${ai.source}` : null, title, written }),
      );
      await ctx.close();
    }
  });

  await section("the status check a hidden tab missed", async () => {
    if (!limitedAiBase) return;
    const ctx = await browser.newContext(PHONE);
    const page = await ctx.newPage();
    // The page can be told it is hidden or shown (no window focus event comes with it: a phone's
    // screen turning back on with the page in front).
    await page.addInitScript(() => {
      let state = 'visible';
      Object.defineProperty(Document.prototype, 'visibilityState', { configurable: true, get: () => state });
      Object.defineProperty(Document.prototype, 'hidden', { configurable: true, get: () => state === 'hidden' });
      window.__setVisibility = (next) => {
        state = next;
        document.dispatchEvent(new Event('visibilitychange'));
      };
    });
    await page.goto(limitedAiBase);
    await onlinePill(page).waitFor({ timeout: 15000 });
    const t0 = Date.now();
    await draw(page);
    await page.waitForFunction(() => !document.querySelector('[data-writing]'), null, { timeout: 30000 });
    await sleep(Math.max(0, t0 + 5000 - Date.now()));
    const during = await pillLabel(page);
    await page.evaluate(() => window.__setVisibility('hidden'));
    // Hidden past the server's 30 s hold (and the 31 s re-check), shown again well before the minute poll.
    await sleep(Math.max(0, t0 + 40000 - Date.now()));
    const hiddenStill = await pillLabel(page);
    await page.evaluate(() => window.__setVisibility('visible'));
    const recovered = await until(async () => (await pillLabel(page)) === 'AI Online', 5000, 250);
    const after = Math.round((Date.now() - t0) / 1000);
    check('hidden when the provider\'s hold ends, then shown again without a focus event: "AI Online" again at once (not on the minute poll)', during === 'AI Busy' && hiddenStill === 'AI Busy' && recovered && after < 50, `during=${during} hidden=${hiddenStill} recovered=${recovered} at ${after}s`);
    await ctx.close();
  });

  await section('the header at 350–400% text', async () => {
    for (const [width, px] of [
      [320, 56],
      [360, 56],
      [320, 64],
      [430, 64],
    ]) {
      const ctx = await browser.newContext({ viewport: { width, height: 740 } });
      const page = await ctx.newPage();
      // "AI Checking", the longest word the pill shows.
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
        const pill = document.querySelector('header button[aria-label^="AI"] > span');
        const range = document.createRange();
        range.selectNodeContents(pill.lastElementChild);
        const right = Math.max(...Array.from(range.getClientRects()).map((r) => r.right));
        const series = document.querySelector('header button[aria-label^="My Series"]').getBoundingClientRect();
        return {
          root: getComputedStyle(document.documentElement).fontSize,
          spill: Math.round(right - pill.getBoundingClientRect().right),
          wide: document.documentElement.scrollWidth,
          seriesRight: Math.round(series.right),
        };
      });
      check(`${px}px text at ${width}px: "AI Checking" stays inside its pill, and nothing scrolls sideways`, m.root === `${px}px` && m.spill <= 0 && m.wide <= width && m.seriesRight <= width, JSON.stringify(m));
      await ctx.close();
    }
    // At the default text size the header is as before: the "·" from 423px, the word "Series" from 424px.
    for (const width of [422, 423, 424]) {
      const ctx = await browser.newContext({ viewport: { width, height: 740 } });
      const page = await ctx.newPage();
      await page.goto(base);
      await sleep(500);
      const m = await page.evaluate(() => {
        const shown = (el) => Boolean(el) && getComputedStyle(el).display !== 'none';
        const pill = document.querySelector('header button[aria-label^="AI"]');
        const dot = pill.querySelector('.text-ivory-mute');
        const word = [...document.querySelectorAll('header button[aria-label^="My Series"] span')].find((s) => s.textContent === 'Series');
        return { dot: shown(dot), series: shown(word), rows: new Set([...document.querySelectorAll('header > *')].map((el) => Math.round(el.getBoundingClientRect().top))).size };
      });
      const want = { dot: width >= 423, series: width >= 424 };
      check(`default text at ${width}px: the "·" ${want.dot ? 'shows' : 'is hidden'}, the word "Series" ${want.series ? 'shows' : 'is hidden'}, one header row`, m.dot === want.dot && m.series === want.series && m.rows === 1, JSON.stringify(m));
      await ctx.close();
    }
  });
}
