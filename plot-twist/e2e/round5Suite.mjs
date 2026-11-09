/**
 * Regression checks from the fifth verification round, against the PRODUCTION build:
 *
 *   import { round5Suite } from './round5Suite.mjs';
 *   await round5Suite(browser, { base, aiBase, slowAiBase }, check);
 *
 * - base: run-all's "curated" server (no key); aiBase: the AI server with the mock provider;
 *   slowAiBase: an AI server whose mock writes slowly (an envelope takes ~10 s), so that tabs can
 *   act while one is being written.
 *
 * Covers: taps on the dock's opaque strip and in forced colors, the header at 400–419px while the
 * pill reads "AI Checking" or "AI Unstable", the focus ring in the "Main character energy" vibe,
 * Forward over entries the app steps over, Backs after a screen's data went away in another tab,
 * history that doesn't grow, the screen-reader announcer after Resume, focus after a sheet closes
 * on its own, the letter racing the status sheet on a slow phone, a provider limit hit while
 * writing, text-size changes across the short breakpoint, and paid AI requests that must not be
 * duplicated across tabs.
 *
 * Each section runs on its own: one that crashes is reported as a failed check.
 */
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
const onlinePill = (page) => page.getByRole('button', { name: /^AI Online\./ });
const dialogs = (page) => page.getByRole('dialog').count();
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

async function startEpisode(page, base) {
  await home(page, base);
  await draw(page);
  await page.locator('button.envelope').first().click();
  await page.getByRole('dialog').waitFor();
  await page.getByRole('button', { name: /start episode/i }).click();
  await page.waitForFunction(() => location.hash === '#/play');
  await page.locator('[data-stage-heading]').first().waitFor();
}

/** "Main character energy" on the weirdness dial. */
async function mainVibe(page) {
  await page.locator('input.dial').focus();
  await page.keyboard.press('End');
  await page.waitForFunction(() => document.documentElement.dataset.vibe === 'main');
}

async function saveAndExit(page) {
  await page.getByRole('button', { name: /Save & exit/ }).click();
  await waitH1(page, /plot/i);
  await sleep(300);
}

/** Counts this context's requests for a personalized episode (each one is a paid generation). */
function countGenerations(ctx) {
  const seen = [];
  const watch = (page, label) => page.on('request', (r) => r.url().endsWith('/api/episodes/generate') && r.method() === 'POST' && seen.push({ label, at: Date.now() }));
  return { seen, watch };
}

export async function round5Suite(browser, { base, aiBase, slowAiBase }, check) {
  console.log('\n▶ round 5 (dock taps, header, focus ring, Forward and gone screens, history, announcer, AI requests across tabs)');
  const section = async (name, fn) => {
    try {
      await fn();
    } catch (err) {
      check(`${name} (section ran)`, false, String(err).split('\n')[0]);
    }
  };

  await section('dock taps', async () => {
    for (const viewport of [
      { width: 390, height: 664 },
      { width: 768, height: 1024 },
    ]) {
      const ctx = await browser.newContext({ viewport, hasTouch: true });
      const page = await ctx.newPage();
      await home(page, base);
      await sleep(400);
      const probe = () =>
        page.evaluate(() => {
          const dock = document.querySelector('.dock');
          const r = dock.getBoundingClientRect();
          const inDock = (x, y) => Boolean(document.elementFromPoint(x, y)?.closest('.dock'));
          return {
            bottomStrip: inDock(r.left + r.width / 2, innerHeight - 6),
            sideStrip: inDock(r.left + 6, innerHeight - 30),
            fadePassesThrough: !inDock(r.left + r.width / 2, r.top - 16),
          };
        });
      const p = await probe();
      check(`${viewport.width}px: the dock's opaque bottom and side strips take the tap (never a control hidden behind)`, p.bottomStrip && p.sideStrip, JSON.stringify(p));
      check(`${viewport.width}px: the see-through fade above the dock still lets taps through`, p.fadePassesThrough, JSON.stringify(p));
      await page.emulateMedia({ forcedColors: 'active' });
      await sleep(200);
      const f = await probe();
      const fill = await page.evaluate(() => getComputedStyle(document.querySelector('.dock')).backgroundColor);
      check(`${viewport.width}px, forced colors: the opaque dock takes taps and its fade passes them on`, f.bottomStrip && f.sideStrip && f.fadePassesThrough && fill !== 'rgba(0, 0, 0, 0)', `${JSON.stringify(f)} fill=${fill}`);
      await ctx.close();
    }
    // A real tap on the strip, with a chip right behind it: nothing changes.
    const ctx = await browser.newContext(PHONE);
    const page = await ctx.newPage();
    await home(page, base);
    await sleep(400);
    const target = await page.evaluate(() => {
      const dockTop = document.querySelector('.dock').getBoundingClientRect().top;
      // Each chip is a label right after its (visually hidden) radio.
      const chips = Array.from(document.querySelectorAll('.chip-input + .chip'));
      for (const chip of chips) {
        const r = chip.getBoundingClientRect();
        const input = chip.previousElementSibling;
        if (!input || input.checked) continue;
        // Scroll this chip under the dock's bottom strip.
        window.scrollBy(0, r.top + r.height / 2 - (innerHeight - 8));
        const again = chip.getBoundingClientRect();
        if (again.top < innerHeight - 8 && again.bottom > innerHeight - 8 && again.top > dockTop) return { x: again.left + again.width / 2, y: innerHeight - 8, name: chip.textContent.trim() };
      }
      return null;
    });
    if (target) {
      const before = await page.evaluate(() => localStorage.getItem('plot-twist:v1'));
      await page.touchscreen.tap(target.x, target.y);
      await sleep(400);
      const after = await page.evaluate(() => localStorage.getItem('plot-twist:v1'));
      const prefs = (raw) => JSON.stringify(JSON.parse(raw ?? '{}').prefs ?? null);
      check(`a tap on the dock's bottom strip over the hidden "${target.name}" chip changes nothing`, prefs(before) === prefs(after), `${prefs(before)} → ${prefs(after)}`);
    } else check('a chip could be placed under the dock strip', false);
    await ctx.close();
  });

  await section('header', async () => {
    const rows = [];
    for (const kind of ['checking', 'unstable']) {
      for (const width of [400, 404, 408, 412, 416, 419]) {
        const ctx = await browser.newContext({ viewport: { width, height: 800 } });
        const page = await ctx.newPage();
        await page.route('**/api/status*', async (route) => {
          if (kind === 'checking') {
            await sleep(4000);
            return route.continue().catch(() => {});
          }
          const res = await route.fetch();
          const body = await res.json();
          return route.fulfill({ response: res, json: { ...body, configured: true, state: 'degraded', label: 'Unstable', canGenerate: true } });
        });
        await page.goto(base);
        await waitH1(page, /plot/i);
        // The widest wordmark: Main character energy.
        await mainVibe(page);
        await page.waitForFunction((k) => new RegExp(k === 'checking' ? '^AI Checking' : '^AI Unstable').test(document.querySelector('header button[aria-label^="AI"]')?.getAttribute('aria-label') ?? ''), kind, { timeout: 3000 }).catch(() => {});
        const m = await page.evaluate(() => ({ h: Math.round(document.querySelector('header').getBoundingClientRect().height), pill: document.querySelector('header button[aria-label^="AI"]')?.innerText?.replace(/\s+/g, ' ').trim(), vibe: document.documentElement.dataset.vibe, scroll: document.documentElement.scrollWidth }));
        rows.push(`${kind}@${width}:${m.h}px "${m.pill}" ${m.vibe}`);
        check(`header is one row at ${width}px while the pill reads "${m.pill}" (${m.vibe})`, m.h <= 60 && m.scroll <= width && /^AI (· )?(Checking|Unstable)/.test(m.pill ?? '') && m.vibe === 'main', `height=${m.h} scrollWidth=${m.scroll}`);
        await ctx.close();
      }
    }
    // Large text: the header's right-hand group wraps instead of scrolling the page sideways.
    const ctx = await browser.newContext({ viewport: { width: 360, height: 740 } });
    const page = await ctx.newPage();
    await page.route('**/api/status*', async (route) => {
      await sleep(4000);
      return route.continue().catch(() => {});
    });
    // Added once the document has a <head> (an init script runs before it exists, and the parser
    // would drop a node added that early), then checked to really be in force.
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style');
        style.textContent = 'html{font-size:200% !important}';
        document.head.appendChild(style);
      });
    });
    await page.goto(base);
    await waitH1(page, /plot/i);
    const m = await page.evaluate(() => ({ root: getComputedStyle(document.documentElement).fontSize, wide: document.documentElement.scrollWidth, header: Math.round(document.querySelector('header').getBoundingClientRect().height) }));
    check('at 200% text (in force: a 32px root), "AI Checking" never scrolls a 360px page sideways', m.root === '32px' && m.wide <= 360, JSON.stringify(m));
    await ctx.close();
  });

  await section('focus ring (Main character energy)', async () => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await home(page, base);
    await mainVibe(page);
    await page.keyboard.press('Shift');
    await page.evaluate(() => document.querySelector('.dock .btn-primary').focus());
    await sleep(600); // past the button's own transitions
    const ring = await page.evaluate(() => {
      const cta = document.querySelector('.dock .btn-primary');
      const s = getComputedStyle(cta);
      return { visible: cta.matches(':focus-visible'), offset: s.outlineOffset, shadow: s.boxShadow };
    });
    check('the focused CTA keeps the usual 3px ring offset; its sun shadow steps aside instead', ring.visible && ring.offset === '3px' && ring.shadow === 'none', JSON.stringify(ring));
    await ctx.close();
  });

  await section('Forward over stepped-over entries', async () => {
    const ctx = await browser.newContext(PHONE);
    const page = await ctx.newPage();
    await page.goto('about:blank');
    await startEpisode(page, base);
    await page.goBack();
    await waitH1(page, /plot/i);
    await sleep(500);
    await page.goForward();
    const reached = await until(async () => (await hash(page)) === '#/play' && (await page.locator('[data-stage-heading]').count()) > 0, 4000);
    check('after Back from an episode, Forward reaches the paused episode again', reached, `hash=${await hash(page)} h1=${await h1(page)}`);
    await page.goBack();
    await sleep(900);
    check('…Back from it lands Home again', ['', '#/'].includes(await hash(page)) && /plot/i.test((await h1(page)) ?? ''), `hash=${await hash(page)}`);
    await page.goForward();
    check('…and Forward works every time', await until(async () => (await hash(page)) === '#/play', 4000), await hash(page));
    await ctx.close();

    // A closed sheet's entry in the middle of history.
    const ctx2 = await browser.newContext(PHONE);
    const page2 = await ctx2.newPage();
    await home(page2, base);
    await pill(page2).click();
    await page2.getByRole('dialog', { name: /AI Director status/ }).waitFor();
    await page2.evaluate(() => {
      location.hash = '#/series';
    });
    await waitH1(page2, /My Series/);
    await sleep(400);
    await page2.goBack();
    await sleep(800);
    const back = { hash: await hash(page2), dialogs: await dialogs(page2) };
    await page2.goForward();
    await sleep(800);
    const fwd = { hash: await hash(page2), dialogs: await dialogs(page2) };
    check('Back over a closed sheet entry lands on the screen below; Forward passes it to the screen beyond', ['', '#/'].includes(back.hash) && back.dialogs === 0 && fwd.hash === '#/series' && fwd.dialogs === 0, JSON.stringify({ back, fwd }));
    await ctx2.close();
  });

  await section('gone in another tab', async () => {
    // A: on the episode. B: discards it. A lands Home; one Back leaves (no copy of Home below).
    {
      const ctx = await browser.newContext(PHONE);
      const a = await ctx.newPage();
      await a.goto('about:blank');
      await startEpisode(a, base);
      const b = await ctx.newPage();
      await home(b, base);
      await b.getByRole('button', { name: 'Discard this episode' }).click();
      await b.getByRole('button', { name: /Yes, discard it/ }).click();
      await waitH1(a, /plot/i, 6000);
      await sleep(900);
      const toast = await toastIn(a, /discarded in another tab/).count();
      await a.goBack();
      await sleep(700);
      check('an episode discarded in another tab: Home with a note, and the next Back leaves', toast === 1 && a.url() === 'about:blank', `toast=${toast} url=${a.url()}`);
      await ctx.close();
    }
    // A: on the envelopes. B: starts an episode from them. A: "These envelopes are gone." → Set the scene.
    {
      const ctx = await browser.newContext(PHONE);
      const a = await ctx.newPage();
      await a.goto('about:blank');
      await home(a, base);
      await draw(a);
      const b = await ctx.newPage();
      await b.goto(`${base}#/envelopes`);
      await b.locator('button.envelope').first().click();
      await b.getByRole('button', { name: /start episode/i }).click();
      await waitH1(a, /These envelopes are gone/, 6000);
      await a.getByRole('button', { name: 'Set the scene' }).click();
      await waitH1(a, /plot/i);
      await sleep(400);
      await a.goBack();
      await sleep(700);
      check('"These envelopes are gone." → Set the scene, then Back leaves (no copy of Home)', a.url() === 'about:blank', a.url());
      await ctx.close();
    }
    // "Episode in progress" open in A while B discards: it closes, focus lands on the heading, no dead entry.
    {
      const ctx = await browser.newContext(PHONE);
      const a = await ctx.newPage();
      await a.goto('about:blank');
      await startEpisode(a, base);
      await saveAndExit(a);
      await a.getByRole('button', { name: 'New envelopes instead' }).click();
      await a.getByRole('dialog', { name: /Episode in progress/ }).waitFor();
      const b = await ctx.newPage();
      await home(b, base);
      await b.getByRole('button', { name: 'Discard this episode' }).click();
      await b.getByRole('button', { name: /Yes, discard it/ }).click();
      const closed = await until(async () => (await dialogs(a)) === 0, 5000);
      await sleep(500);
      const focus = await a.evaluate(() => ({ tag: document.activeElement?.tagName, text: document.activeElement?.textContent?.trim().slice(0, 40) }));
      check('"Episode in progress" closes when another tab discards the episode', closed);
      check('…focus lands on the screen heading, not <body>', focus.tag === 'H1', JSON.stringify(focus));
      await a.goBack();
      await sleep(900);
      check('…and the next Back leaves (no dead entries)', a.url() === 'about:blank', a.url());
      await ctx.close();
    }
  });

  await section('history stays short', async () => {
    const ctx = await browser.newContext(PHONE);
    const page = await ctx.newPage();
    await page.goto('about:blank');
    await startEpisode(page, base);
    await saveAndExit(page);
    const start = await page.evaluate(() => history.length);
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: /Resume Episode/ }).first().click();
      await page.waitForFunction(() => location.hash === '#/play');
      await page.locator('[data-stage-heading]').first().waitFor();
      await saveAndExit(page);
    }
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: /^My Series/ }).click();
      await waitH1(page, /My Series/);
      await page.getByRole('button', { name: 'Back home' }).click();
      await waitH1(page, /plot/i);
    }
    await sleep(300);
    const end = await page.evaluate(() => history.length);
    check('Save & exit / Resume and My Series / Back home, three times each, add no history', end <= start + 1, `history.length ${start} → ${end}`);
    // Leaving from Home takes no more than the screens actually below it.
    let backs = 0;
    while (page.url() !== 'about:blank' && backs < 8) {
      await page.goBack();
      await sleep(700);
      backs++;
    }
    check('…and Back from Home leaves in at most two steps', page.url() === 'about:blank' && backs <= 2, `${backs} Backs`);
    await ctx.close();
  });

  await section('announcer after Resume', async () => {
    const ctx = await browser.newContext(PHONE);
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      window.__announced = [];
      new MutationObserver(() => {
        const live = document.querySelector('body > [role="status"][aria-live="polite"]');
        const t = live?.textContent?.trim();
        if (t && window.__announced[window.__announced.length - 1] !== t) window.__announced.push(t);
      }).observe(document, { subtree: true, childList: true, characterData: true });
    });
    await startEpisode(page, base);
    await saveAndExit(page);
    await sleep(5200); // the "Saved" notice goes
    await pill(page).click();
    await page.getByRole('button', { name: 'Check again' }).click();
    await page.getByRole('dialog').getByRole('button', { name: /^Close/ }).click().catch(() => page.keyboard.press('Escape'));
    await sleep(300);
    await page.getByRole('button', { name: /Resume Episode/ }).first().click();
    await page.waitForFunction(() => location.hash === '#/play');
    await page.locator('[data-stage-heading]').first().waitFor();
    await page.goBack();
    await waitH1(page, /plot/i);
    await toastIn(page, /paused while you look around/).waitFor({ timeout: 3000 });
    await page.getByRole('button', { name: /Resume Episode/ }).first().click();
    await page.waitForFunction(() => location.hash === '#/play');
    await sleep(800);
    const said = await page.evaluate(() => window.__announced);
    const checks = said.filter((t) => /AI Director checked/.test(t)).length;
    check('after Resume clears the pause notice, the announcer does not repeat an older message', checks === 1, JSON.stringify(said));
    await ctx.close();
  });

  await section('letter vs status sheet on a slow phone', async () => {
    const ctx = await browser.newContext(PHONE);
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await home(page, base);
    await draw(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
    let stacked = 0;
    let dead = 0;
    const delays = [400, 420, 430, 440, 450, 460, 470, 480];
    for (const delay of delays) {
      // A fresh, sealed envelope every time.
      await page.getByRole('button', { name: /Draw again/ }).click();
      await sleep(1200);
      const env = await page.locator('button.envelope').first().boundingBox();
      const p = await pill(page).boundingBox();
      await page.touchscreen.tap(env.x + env.width / 2, env.y + env.height / 2);
      await sleep(delay);
      await page.touchscreen.tap(p.x + p.width / 2, p.y + p.height / 2).catch(() => {});
      await sleep(900);
      if ((await dialogs(page)) > 1) stacked++;
      for (let i = 0; i < 3 && (await dialogs(page)) > 0; i++) {
        await page.keyboard.press('Escape');
        await sleep(500);
      }
      if (await page.evaluate(() => Boolean(history.state?.sheet))) dead++;
    }
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    check(`6× CPU: a pill tap as the seal breaks never stacks two dialogs (${delays.length} tries)`, stacked === 0, `stacked=${stacked}`);
    check('…and closing leaves no sheet entry behind', dead === 0, `dead=${dead}`);
    await ctx.close();
  });

  await section('Resume focus and text size', async () => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await startEpisode(page, base);
    await saveAndExit(page);
    const where = () => page.evaluate(() => ({ twin: document.activeElement?.hasAttribute('data-resume-twin') ?? false, dock: Boolean(document.activeElement?.closest('.dock')), tag: document.activeElement?.tagName }));
    await page.locator('.dock [data-resume-twin]').focus();
    await cdp.send('Page.setFontSizes', { fontSizes: { standard: 28, fixed: 28 } });
    await sleep(400);
    const big = await where();
    await cdp.send('Page.setFontSizes', { fontSizes: { standard: 16, fixed: 13 } });
    await sleep(400);
    const normal = await where();
    check('a bigger text size that crosses the short breakpoint keeps focus on the Resume shown', big.twin && !big.dock, JSON.stringify(big));
    check('…and back at the normal size it returns to the dock', normal.twin && normal.dock, JSON.stringify(normal));
    await ctx.close();
  });

  await section('provider limit while writing', async () => {
    const ctx = await browser.newContext(PHONE);
    const page = await ctx.newPage();
    await page.route('**/api/episodes/generate', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: `data: ${JSON.stringify({ type: 'phase', phase: 'plotting' })}\n\ndata: ${JSON.stringify({ type: 'error', code: 'rate_limited', message: 'The AI Director is busy right now.', retryable: true })}\n\n`,
      }),
    );
    await page.goto(aiBase);
    await onlinePill(page).waitFor({ timeout: 15000 });
    await draw(page);
    const settled = await until(async () => (await page.locator('[data-writing]').count()) === 0, 8000);
    await sleep(400);
    const block = await page.evaluate(() => localStorage.getItem('plot-twist:v1:ai-block'));
    const note = await page.locator('body').innerText();
    const pillText = await pill(page).innerText();
    check('a provider limit hit while writing does not pause this visitor (no shared pause stored)', settled && block === null, `block=${block}`);
    check('…the envelope says why, honestly', /The AI Director is busy right now\. Here is an archive pick instead/.test(note));
    check('…and the pill keeps the server’s word for it', /AI\s*(·\s*)?Online/.test(pillText.replace(/\s+/g, ' ')), pillText);
    await ctx.close();
  });

  await section('AI requests across tabs', async () => {
    // 1. Re-deal with a different scene in the writing tab while another tab is open: no duplicate.
    {
      const ctx = await browser.newContext(PHONE);
      const { seen, watch } = countGenerations(ctx);
      const a = await ctx.newPage();
      watch(a, 'A');
      await a.goto(slowAiBase);
      await onlinePill(a).waitFor({ timeout: 15000 });
      const b = await ctx.newPage();
      watch(b, 'B');
      await b.goto(slowAiBase);
      await waitH1(b, /plot/i);
      await a.bringToFront();
      await draw(a);
      await a.locator('[data-writing]').first().waitFor({ timeout: 5000 });
      await sleep(1500);
      await a.getByRole('button', { name: 'Edit the scene' }).click();
      await waitH1(a, /plot/i);
      await a.getByRole('radio', { name: /1 hr/ }).check({ force: true });
      await draw(a);
      await sleep(9000);
      const labels = seen.map((s) => s.label).join(',');
      check('re-dealing a new scene while the AI writes: no other tab writes it too (2 requests: the old one, cut short, and the new one)', seen.length === 2 && !labels.includes('B'), labels);
      await ctx.close();
    }
    // 2. The writing tab closes with two other tabs open: exactly one of them takes over.
    for (let round = 1; round <= 2; round++) {
      const ctx = await browser.newContext(PHONE);
      const { seen, watch } = countGenerations(ctx);
      const a = await ctx.newPage();
      watch(a, 'A');
      await a.goto(slowAiBase);
      await onlinePill(a).waitFor({ timeout: 15000 });
      const b = await ctx.newPage();
      watch(b, 'B');
      await b.goto(slowAiBase);
      const c = await ctx.newPage();
      watch(c, 'C');
      await c.goto(slowAiBase);
      await a.bringToFront();
      await draw(a);
      await a.locator('[data-writing]').first().waitFor({ timeout: 5000 });
      await sleep(1200);
      await a.close();
      await sleep(18000);
      const takeovers = seen.filter((s) => s.label !== 'A').map((s) => s.label);
      check(`round ${round}: the writing tab closes with two tabs open: exactly one takes over`, takeovers.length === 1, `takeovers=${takeovers.join(',') || 'none'}`);
      await ctx.close();
    }
    // 3. "Draw again" in another tab with the same scene while the AI writes: the envelope carries over.
    {
      const ctx = await browser.newContext(PHONE);
      const { seen, watch } = countGenerations(ctx);
      const a = await ctx.newPage();
      watch(a, 'A');
      await a.goto(slowAiBase);
      await onlinePill(a).waitFor({ timeout: 15000 });
      await draw(a);
      await a.locator('[data-writing]').first().waitFor({ timeout: 5000 });
      const b = await ctx.newPage();
      watch(b, 'B');
      await b.goto(`${slowAiBase}#/envelopes`);
      await b.locator('button.envelope').first().waitFor();
      await sleep(800);
      await b.getByRole('button', { name: /Draw again/ }).click();
      const ready = await until(
        async () =>
          b.evaluate(() => {
            const d = JSON.parse(localStorage.getItem('plot-twist:v1') ?? 'null')?.draw;
            return Boolean(d && d.envelopes.some((e) => e.source === 'ai' && e.status === 'ready'));
          }),
        25000,
        300,
      );
      check('"Draw again" in another tab with the same scene keeps the envelope being written (1 paid request)', ready && seen.length === 1, `ready=${ready} requests=${seen.map((s) => s.label).join(',')}`);
      await ctx.close();
    }
  });
}
