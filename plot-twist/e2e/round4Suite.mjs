/**
 * Regression checks from the final independent verification round, against the PRODUCTION
 * build (run-all's "curated" server without a key, and its "ai" server with the mock provider):
 *
 *   import { round4Suite } from './round4Suite.mjs';
 *   await round4Suite(browser, 'http://127.0.0.1:8790/', 'http://127.0.0.1:8791/', check);
 *
 * Covers: deep links and reloads on screens whose data is gone, Back after an episode, sheet
 * history entries (reload, Forward, confirm sheets, a letter racing the status sheet), taps
 * through the dock's fade, focus in the sticky play bar and across the short breakpoint, the
 * stage's double-tap guard, the "AI …" pill, the poster without a connection, the AI pause
 * (wording, other tabs, reloads) and a tab taking over an AI envelope whose writer closed.
 *
 * Each section runs on its own: one that crashes is reported as a failed check.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { devices } = require('playwright');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PHONE = devices['iPhone 13'];

const h1 = (page) => page.evaluate(() => document.querySelector('main h1')?.textContent?.trim() ?? null);
const hash = (page) => page.evaluate(() => location.hash);
const waitH1 = (page, re, timeout = 6000) =>
  page.waitForFunction((src) => new RegExp(src).test(document.querySelector('main h1')?.textContent ?? ''), re.source, { timeout });
const toastIn = (page, re) => page.locator('body > div.pointer-events-none button').filter({ hasText: re });
const pill = (page) => page.getByRole('button', { name: /^AI .*AI Director:/ });

/** Records every main heading the page shows (catches one-frame flashes). */
async function recordHeadings(page) {
  const seen = [];
  await page.exposeFunction('__r4h1', (t) => seen.push(t));
  await page.addInitScript(() => {
    new MutationObserver(() => {
      const t = document.querySelector('main h1')?.textContent;
      if (t && window.__r4last !== t) {
        window.__r4last = t;
        window.__r4h1(t);
      }
    }).observe(document, { subtree: true, childList: true, characterData: true });
  });
  return seen;
}

async function startEpisode(page, base) {
  await page.goto(base);
  await waitH1(page, /plot/i);
  await page.getByRole('button', { name: /give me a plot twist/i }).click();
  await page.waitForFunction(() => location.hash === '#/envelopes');
  await page.locator('button.envelope').first().click();
  await page.getByRole('dialog').waitFor();
  await page.getByRole('button', { name: /start episode/i }).click();
  await page.waitForFunction(() => location.hash === '#/play');
  await page.locator('[data-stage-heading]').first().waitFor();
}

async function finishEpisode(page) {
  for (let i = 0; i < 20 && !(await hash(page)).startsWith('#/finale'); i++) {
    const done = page.locator('button[data-armed="true"]', { hasText: /Done — I did it/ });
    const option = page.locator('button[data-armed="true"]', { hasText: /Option A/ });
    if (await done.count()) await done.first().click();
    else if (await option.count()) await option.first().click();
    await sleep(700);
  }
  return (await hash(page)).startsWith('#/finale');
}

export async function round4Suite(browser, base, aiBase, check) {
  console.log('\n▶ round 4 (deep links, Back and sheets, dock taps, focus, pill, offline poster, AI pause, takeover)');
  const section = async (name, fn) => {
    try {
      await fn();
    } catch (err) {
      check(`${name} (section ran)`, false, String(err).split('\n')[0]);
    }
  };

  await section('deep links', async () => {
    for (const [route, want] of [
      ['#/play', /plot/i],
      ['#/envelopes', /plot/i],
      ['#/finale/run-missing', /My Series/],
      ['#/series/run-missing', /My Series/],
    ]) {
      const ctx = await browser.newContext(PHONE);
      const page = await ctx.newPage();
      const seen = await recordHeadings(page);
      await page.goto(base + route);
      const ok = await waitH1(page, want, 5000).then(
        () => true,
        () => false,
      );
      const header = await page.locator('header').count();
      check(`a deep link to ${route} with nothing stored shows a real screen`, ok && header === 1 && !seen.some((t) => /gone/i.test(t)), `h1=${await h1(page)} hash=${await hash(page)} seen=${seen.join(' | ')}`);
      await ctx.close();
    }
  });

  await section('back after an episode', async () => {
    const ctx = await browser.newContext(PHONE);
    const page = await ctx.newPage();
    const seen = await recordHeadings(page);
    await page.goto('about:blank');
    await startEpisode(page, base);
    await page.goBack();
    await sleep(700);
    check('Back from an episode lands Home with the paused notice', /plot/i.test((await h1(page)) ?? '') && (await toastIn(page, /paused while you look around/).count()) === 1, `h1=${await h1(page)}`);
    check('…without a flash of "These envelopes are gone."', !seen.some((t) => /gone/i.test(t)), seen.join(' | '));
    await page.getByRole('button', { name: /Resume Episode/ }).first().click();
    await page.waitForFunction(() => location.hash === '#/play');
    await sleep(300);
    check('resuming clears the "paused" notice', (await toastIn(page, /paused/i).count()) === 0);
    await page.goBack();
    await sleep(700);
    await page.goBack();
    await sleep(500);
    check('the Back after Home leaves the app (no dead Back)', page.url() === 'about:blank', page.url());
    await ctx.close();
  });

  await section('sheet entries', async () => {
    const ctx = await browser.newContext(PHONE);
    const page = await ctx.newPage();
    await page.goto(`${base}#/series`);
    await waitH1(page, /My Series/);
    await page.getByRole('link', { name: /home/ }).click();
    await waitH1(page, /plot/i);
    await pill(page).click();
    await page.getByRole('dialog', { name: /AI Director status/ }).waitFor();
    await page.reload();
    await waitH1(page, /plot/i);
    await sleep(400);
    await page.goBack();
    await sleep(500);
    check('after a reload with the status sheet open, one Back leaves', (await hash(page)) === '#/series', await hash(page));

    await page.getByRole('link', { name: /home/ }).click();
    await waitH1(page, /plot/i);
    await pill(page).click();
    await page.getByRole('dialog', { name: /AI Director status/ }).waitFor();
    await page.getByRole('button', { name: 'Close' }).click();
    await sleep(400);
    await page.goForward();
    await sleep(500);
    const dialogs = await page.getByRole('dialog').count();
    await page.goBack();
    await sleep(500);
    check('Forward onto a closed sheet is stepped over; one Back still leaves', dialogs === 0 && (await hash(page)) === '#/series', `dialogs=${dialogs} hash=${await hash(page)}`);
    await ctx.close();
  });

  await section('confirm sheets', async () => {
    const ctx = await browser.newContext(PHONE);
    const page = await ctx.newPage();
    await startEpisode(page, base);
    await page.getByRole('button', { name: /Save & exit/ }).click();
    await waitH1(page, /plot/i);
    await sleep(300);
    const closesOnBack = async (open, title, where) => {
      await open();
      await page.getByRole('dialog', { name: title }).waitFor();
      await page.goBack();
      await sleep(500);
      return (await page.getByRole('dialog').count()) === 0 && (await hash(page)) === where;
    };
    check('Back closes "Discard this episode?"', await closesOnBack(() => page.getByRole('button', { name: 'Discard this episode' }).click(), /Discard this episode/, '#/'));
    check('Back closes "Episode in progress"', await closesOnBack(() => page.getByRole('button', { name: 'New envelopes instead' }).click(), /Episode in progress/, '#/'));
    await page.getByRole('button', { name: 'Discard this episode' }).click();
    await page.getByRole('dialog', { name: /Discard this episode/ }).waitFor();
    await page.getByRole('button', { name: 'Keep it' }).click();
    await sleep(500);
    check('closing a confirm sheet removes its history entry', !(await page.evaluate(() => history.state?.sheet)), JSON.stringify(await page.evaluate(() => history.state)));
    await page.goto(`${base}#/series`);
    await waitH1(page, /My Series/);
    check('Back closes "Reset everything?"', await closesOnBack(() => page.getByRole('button', { name: /Reset all episodes/ }).click(), /Reset everything/, '#/series'));
    await ctx.close();
  });

  await section('letter vs status sheet', async () => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(base);
    await waitH1(page, /plot/i);
    await page.getByRole('button', { name: /give me a plot twist/i }).click();
    await page.waitForFunction(() => location.hash === '#/envelopes');
    await page.locator('button.envelope').first().click();
    await sleep(150);
    await pill(page).click();
    await sleep(800);
    const count = await page.getByRole('dialog').count();
    await page.keyboard.press('Escape');
    await sleep(500);
    check('an envelope still opening never stacks its letter on the status sheet', count === 1);
    check('…and one Escape closes it, leaving no sheet entry', (await page.getByRole('dialog').count()) === 0 && !(await page.evaluate(() => history.state?.sheet)));
    await ctx.close();
  });

  await section('dock fade', async () => {
    const ctx = await browser.newContext({ ...PHONE, viewport: { width: 390, height: 664 } });
    const page = await ctx.newPage();
    await startEpisode(page, base);
    await page.getByRole('button', { name: /Save & exit/ }).click();
    await waitH1(page, /plot/i);
    await sleep(500);
    const btn = page.getByRole('button', { name: 'Discard this episode' });
    const box = await btn.boundingBox();
    const hit = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('button')?.textContent?.trim() ?? null, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
    check('a button seen through the dock fade gets the tap', hit === 'Discard this episode', `hit=${hit}`);
    await ctx.close();
  });

  await section('focus', async () => {
    const ctx = await browser.newContext({ viewport: { width: 320, height: 568 } });
    const page = await ctx.newPage();
    await startEpisode(page, base);
    await sleep(600);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.locator('button', { hasText: /alternative challenge/ }).focus();
    const before = await page.evaluate(() => window.scrollY);
    for (let i = 0; i < 30 && (await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))) !== 'Pause timer'; i++) await page.keyboard.press('Shift+Tab');
    await sleep(150);
    const after = await page.evaluate(() => window.scrollY);
    check('Shift+Tab back to the timer keeps the reading position', Math.abs(after - before) < 2, `scrollY ${before} → ${after}`);

    await page.getByRole('button', { name: /Save & exit/ }).click();
    await waitH1(page, /plot/i);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.dock [data-resume-twin]').focus();
    await page.setViewportSize({ width: 844, height: 390 });
    await sleep(300);
    const landscape = await page.evaluate(() => ({ twin: document.activeElement?.hasAttribute('data-resume-twin'), dock: Boolean(document.activeElement?.closest('.dock')) }));
    check('rotating across the short breakpoint moves focus to the Resume that is shown', landscape.twin && !landscape.dock, JSON.stringify(landscape));
    await ctx.close();
  });

  await section('stage tap guard', async () => {
    const ctx = await browser.newContext(PHONE);
    const page = await ctx.newPage();
    await startEpisode(page, base);
    await sleep(600);
    await page.getByRole('button', { name: 'Pause timer' }).tap();
    await page.getByRole('dialog', { name: /Paused/ }).waitFor();
    const swap = page.locator('button', { hasText: /alternative challenge/ });
    await page.getByRole('button', { name: /Resume episode/ }).tap();
    await sleep(110);
    const box = await swap.boundingBox();
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await sleep(300);
    check('a tap right after Resume cannot switch the stage to its alternative', (await page.locator('button', { hasText: /Back to the main challenge/ }).count()) === 0);
    await ctx.close();
  });

  await section('pill', async () => {
    const ctx = await browser.newContext({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(base);
    await waitH1(page, /plot/i);
    await page.waitForFunction(() => !/Checking/.test(document.querySelector('header')?.innerText ?? ''), null, { timeout: 8000 });
    const info = await page.evaluate(() => ({
      text: document.querySelector('header button[aria-label^="AI "] > span')?.innerText.replace(/\s+/g, ' ').trim(),
      height: document.querySelector('header').getBoundingClientRect().height,
    }));
    check('on a 320px phone the pill still says what it is about ("AI Off")', /^AI Off$/.test(info.text ?? ''), info.text);
    check('…and the header keeps one row', info.height < 70, `${info.height}px`);
    await ctx.close();
  });

  await section('poster offline', async () => {
    {
      const ctx = await browser.newContext({ ...PHONE, acceptDownloads: true });
      const page = await ctx.newPage();
      const chunk = page.waitForResponse((r) => /\/assets\/render-[^/]+\.js$/.test(r.url()), { timeout: 15000 });
      await page.goto(base);
      await chunk;
      await startEpisode(page, base);
      await ctx.setOffline(true);
      const finished = await finishEpisode(page);
      const img = page.locator('img[alt^="Poster for Episode"]').first();
      await img.waitFor({ timeout: 10000 }).catch(() => {});
      check('offline from stage 1 on: the finale poster is still drawn', finished && (await img.count()) === 1);
      const dl = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
      await page.getByRole('button', { name: /Download PNG/ }).click();
      const download = await dl;
      const buf = download ? readFileSync(await download.path()) : Buffer.alloc(0);
      check('…and Download PNG saves a real PNG', buf.length > 10000 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), `${buf.length} bytes`);
      await ctx.close();
    }
    {
      const ctx = await browser.newContext(PHONE);
      const page = await ctx.newPage();
      const chunks = /\/assets\/(render|fromEpisode|export)-[^/]+\.js$/;
      await page.route(chunks, (r) => r.abort('internetdisconnected'));
      await startEpisode(page, base);
      await finishEpisode(page);
      await sleep(1500);
      const box = await page.locator('div.aspect-\\[2\\/3\\]').first().innerText();
      check('poster code unavailable: the poster says to check the connection', /Check your connection, then reload the page/.test(box), box);
      await page.unroute(chunks);
      await page.reload();
      const img = page.locator('img[alt^="Poster for Episode"]').first();
      await img.waitFor({ timeout: 10000 }).catch(() => {});
      check('…and a reload with the connection back draws it', (await img.count()) === 1);
      await ctx.close();
    }
  });

  await section('AI pause', async () => {
    const ctx = await browser.newContext(PHONE);
    const page = await ctx.newPage();
    await page.route('**/api/episodes/generate', (route) =>
      route.fulfill({ status: 503, contentType: 'application/json', headers: { 'retry-after': '20' }, body: JSON.stringify({ error: 'busy' }) }),
    );
    await page.goto(aiBase);
    await page.getByRole('button', { name: /AI Online/ }).waitFor({ timeout: 15000 });
    await page.getByRole('button', { name: /give me a plot twist/i }).click();
    await page.waitForFunction(() => location.hash === '#/envelopes');
    await page.waitForFunction(() => !document.querySelector('[data-writing]'), null, { timeout: 8000 });
    await pill(page).click();
    const busyText = (await page.getByRole('dialog').innerText()).replace(/\s+/g, ' ');
    check('a full server is not blamed on the visitor', /busy writing for other people/.test(busyText) && !/You have asked/.test(busyText), busyText.slice(0, 160));
    await ctx.close();

    const ctx2 = await browser.newContext(PHONE);
    const a = await ctx2.newPage();
    await a.route('**/api/episodes/generate', (route) =>
      route.fulfill({ status: 429, contentType: 'application/json', headers: { 'retry-after': '600' }, body: JSON.stringify({ error: 'rate_limited', retryAfterMs: 600000 }) }),
    );
    await a.goto(aiBase);
    await a.getByRole('button', { name: /AI Online/ }).waitFor({ timeout: 15000 });
    await a.getByRole('button', { name: /give me a plot twist/i }).click();
    await a.waitForFunction(() => !document.querySelector('[data-writing]'), null, { timeout: 8000 });
    const b = await ctx2.newPage();
    let requests = 0;
    b.on('request', (r) => r.url().includes('/api/episodes/generate') && requests++);
    await b.goto(aiBase);
    await waitH1(b, /./);
    await sleep(1500);
    const bPill = await b.evaluate(() => document.querySelector('header button[aria-label^="AI "]')?.getAttribute('aria-label'));
    check('a rate-limit pause holds in another tab of the browser', /^AI Busy/.test(bPill ?? ''), bPill);
    await b.goto(`${aiBase}#/`);
    await waitH1(b, /plot/i);
    await b.getByRole('button', { name: /give me a plot twist/i }).click();
    await sleep(800);
    check('…which then asks the AI Director for nothing', requests === 0, `requests=${requests}`);
    await a.reload();
    await waitH1(a, /./);
    await sleep(1500);
    check('…and across a reload', /^AI Busy/.test((await a.evaluate(() => document.querySelector('header button[aria-label^="AI "]')?.getAttribute('aria-label'))) ?? ''));
    await ctx2.close();
  });

  await section('AI takeover', async () => {
    const ctx = await browser.newContext(PHONE);
    const b = await ctx.newPage();
    await b.goto(aiBase);
    await b.getByRole('button', { name: /AI Online/ }).waitFor({ timeout: 15000 });
    let requests = 0;
    b.on('request', (r) => r.url().includes('/api/episodes/generate') && requests++);
    const a = await ctx.newPage();
    await a.route('**/api/episodes/generate', () => {}); // the writing tab's stream never finishes
    await a.goto(aiBase);
    await a.getByRole('button', { name: /AI Online/ }).waitFor({ timeout: 15000 });
    await a.getByRole('button', { name: /give me a plot twist/i }).click();
    await sleep(2000);
    await a.close();
    let env = null;
    const t0 = Date.now();
    while (Date.now() - t0 < 40000) {
      // The AI envelope is the last one dealt (whether it came back written or as an archive pick).
      env = await b.evaluate(() => JSON.parse(localStorage.getItem('plot-twist:v1') ?? 'null')?.draw?.envelopes.at(-1) ?? null);
      if (requests > 0 && env && env.status !== 'writing') break;
      await sleep(500);
    }
    check('an open tab takes over an AI envelope whose writing tab closed', requests > 0 && env && env.status !== 'writing', `requests=${requests} env=${JSON.stringify(env && { status: env.status, source: env.source })} after ${Date.now() - t0}ms`);
    await ctx.close();
  });
}
