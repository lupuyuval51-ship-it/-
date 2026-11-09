/**
 * End-to-end verification of the complete PLOT TWIST journey in a real browser,
 * against the PRODUCTION build and server:
 *
 *   npm run e2e            (builds first)
 *   node e2e/run-all.mjs --skip-build
 *
 * Uses the pre-installed Playwright (global). Artifacts → e2e/artifacts/.
 * Suites:
 *   1. journey (curated, no AI key) on a narrow phone — the full checklist
 *   2. ai      (AI Director online via a local Anthropic-compatible mock)
 *   3. ai-fallback (mock returns invalid drafts → curated fallback)
 *   4. layout  (no horizontal scroll at 320px on every screen; keyboard + reduced motion)
 *   5. conflict (dev server, `?library=none` → explanation + one-tap relaxations)
 *   6. resilience (two tabs, double taps, long absences, drafts, Back on the letter)
 *   7. round3 (Back closes sheets, paused modal, Check again, toast announcer, journal, fallback)
 *   8. a11y-round3 (envelope focus ring, short viewports, chip radios, marquee, forced colors, small phones)
 *   9. round4 (deep links without data, Back and sheet entries, dock taps, focus, pill, offline poster,
 *      AI pause across tabs, taking over an orphaned AI envelope)
 *  10. round5 (dock strip taps, header widths, focus ring, Forward and gone screens, history size,
 *      announcer, letter vs status on a slow phone, text size, provider limits, AI requests across tabs)
 *  11. round6 (Forward onto emptied screens, bookmarked episodes, the discard question, focus when
 *      another tab takes a control, poster tiles, AI detail on Draw again, stalled AI connections,
 *      simultaneous draws, the dock's fade, the header at very large text and with 100 episodes)
 *  12. round7 (the app's own history steps, Draw again after a paused AI, tabs drawing at the same
 *      moment, a hidden tab's missed status check, the header at 350–400% text)
 */
import { spawn, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { a11yRound3Suite } from './a11ySuite.mjs';
import { round4Suite } from './round4Suite.mjs';
import { round5Suite } from './round5Suite.mjs';
import { round6Suite } from './round6Suite.mjs';
import { round7Suite } from './round7Suite.mjs';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ART = join(ROOT, 'e2e', 'artifacts');
mkdirSync(ART, { recursive: true });

const args = new Set(process.argv.slice(2));
const only = [...args].find((a) => a.startsWith('--only='))?.slice(7);
const results = [];
let failures = 0;

function check(name, ok, detail = '') {
  results.push({ name, ok: Boolean(ok), detail });
  if (!ok) failures++;
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${detail ? ` — ${detail}` : ''}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** A toast in the visible stack (the screen-reader announcer repeats its text on its own). */
const toastIn = (page, re) => page.locator('body > div.pointer-events-none button').filter({ hasText: re });

async function waitFor(url, timeoutMs = 20_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await sleep(200);
  }
  throw new Error(`timed out waiting for ${url}`);
}

const procs = [];
function start(cmd, argv, env, label) {
  const p = spawn(cmd, argv, { cwd: ROOT, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  p.stdout.on('data', (d) => (log += d));
  p.stderr.on('data', (d) => (log += d));
  p.on('exit', (code) => {
    if (code && code !== 143 && code !== null) console.log(`[${label}] exited ${code}\n${log.slice(-2000)}`);
  });
  procs.push(p);
  return { proc: p, log: () => log };
}

function pngInfo(buf) {
  const sig = buf.subarray(0, 8).toString('hex');
  const ihdr = buf.subarray(12, 16).toString('ascii');
  return { valid: sig === '89504e470d0a1a0a' && ihdr === 'IHDR', width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), bytes: buf.length };
}

async function storage(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('plot-twist:v1') || 'null'));
}

/** Waits until the persisted state satisfies `predicate` (saving is debounced). Polls from Node — the app's CSP forbids eval in the page. */
async function storageWhen(page, predicate, timeout = 15_000) {
  const start = Date.now();
  let last = null;
  while (Date.now() - start < timeout) {
    last = await storage(page);
    try {
      if (last && predicate(last)) return last;
    } catch {}
    await sleep(100);
  }
  throw new Error(`storage condition not met: ${predicate.toString().slice(0, 120)}`);
}

/** Plays the current stage loop until the finale. `pick(i, options)` chooses an option index. */
async function playToEnd(page, { pick = () => 0, notes = [], useAlternativeAt = -1 } = {}) {
  let stage = 0;
  for (let guard = 0; guard < 12; guard++) {
    if (page.url().includes('#/finale/')) return true;
    const done = page.getByRole('button', { name: /done — i did it/i });
    const choice = page.locator('section[aria-labelledby=choice-title] button');
    if (await choice.count()) {
      const n = await choice.count();
      await choice.nth(Math.min(n - 1, pick(stage, n))).click();
      await sleep(350);
      continue;
    }
    if (await done.count()) {
      if (stage === useAlternativeAt) await page.getByRole('button', { name: /swap for an alternative/i }).click();
      const note = page.locator('input[id^=note-]');
      if ((await note.count()) && notes[stage]) await note.fill(notes[stage]);
      await done.click();
      stage++;
      await sleep(350);
      continue;
    }
    await sleep(300);
  }
  return page.url().includes('#/finale/');
}

// ─────────────────────────────────────────────────────────────────────
async function journeySuite(browser, base) {
  console.log('\n▶ journey (curated, production build, 360×740)');
  const { validateAdventure, fitsPrefs } = await import('../shared/validate.ts');
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 1, acceptDownloads: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  // Status pill reports the real (unconfigured) state.
  await page.waitForFunction(() => /AI Director: Not configured/.test(document.querySelector('header button[aria-label*="AI Director:"]')?.getAttribute('aria-label') || ''), null, { timeout: 8000 });
  check('AI status shows "Not configured" without a key', true);
  check('curated-only copy under the CTA', await page.getByText('Three envelopes from the curated archive').isVisible());

  // 1. Choose preferences: 30 min · Free · Outside · Solo · Curious · Main character energy
  await page.getByText('30 min', { exact: true }).click();
  await page.getByText('Free', { exact: true }).click();
  await page.getByText('Outside', { exact: true }).click();
  await page.getByText('Solo', { exact: true }).click();
  await page.getByText('Curious', { exact: true }).click();
  await page.locator('input[type=range]').fill('3');
  check('weirdness re-skins the UI (main character vibe)', (await page.locator('#app').getAttribute('data-vibe')) === 'main');
  await page.screenshot({ path: join(ART, 'j01-scene.png') });

  // 2. Receive valid adventures
  await page.getByRole('button', { name: /give me a plot twist/i }).click();
  await page.waitForURL(/#\/envelopes/);
  await page.locator('button.envelope').first().waitFor();
  const envCount = await page.locator('button.envelope').count();
  check('three envelopes are dealt', envCount === 3, `${envCount}`);
  const s1 = await storageWhen(page, (s) => s.draw && s.draw.envelopes.length === 3);
  const prefs = s1.draw.prefs;
  let allFit = true;
  let allValid = true;
  const kinds = new Set();
  for (const e of s1.draw.envelopes) {
    allValid &&= validateAdventure(e.adventure).ok;
    allFit &&= fitsPrefs(e.adventure, prefs);
    kinds.add(e.adventure.kind);
  }
  check('every envelope passes the content validator', allValid);
  check('every envelope respects time, budget, setting and company', allFit, JSON.stringify(prefs));
  check('envelopes offer different kinds of experience', kinds.size === 3, [...kinds].join(', '));
  await page.screenshot({ path: join(ART, 'j02-envelopes.png'), fullPage: true });

  // 3. Open an envelope, inspect another before committing
  await page.locator('button.envelope').nth(0).click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  const facts = await dialog.innerText();
  check('reveal shows intro, duration, items, cost and Start', /Duration/i.test(facts) && /You’ll need/i.test(facts) && /Expected cost/i.test(facts) && (await dialog.getByRole('button', { name: /start episode/i }).isVisible()));
  await page.screenshot({ path: join(ART, 'j03-letter.png') });
  const letterFocus = await page.evaluate(() => document.activeElement?.tagName);
  check('the letter opens with focus on its title, not on Start', letterFocus === 'H3', letterFocus ?? '');
  await page.goBack();
  await sleep(300);
  check('Back closes the letter and stays on the envelopes', (await page.getByRole('dialog').count()) === 0 && page.url().includes('#/envelopes'));
  await page.locator('button.envelope').nth(0).click();
  await page.getByRole('dialog').waitFor();
  await page.getByRole('dialog').getByRole('button', { name: /look at another envelope/i }).click();
  await sleep(250);
  await page.locator('button.envelope').nth(1).click();
  await page.getByRole('dialog').waitFor();
  const chosenTitle = (await page.getByRole('dialog').locator('h3').first().innerText()).trim();
  check('can inspect a second envelope before committing', chosenTitle.length > 0, chosenTitle);

  // 4. Start the episode
  await page.getByRole('button', { name: /start episode/i }).click();
  await page.waitForURL(/#\/play/);
  const s2 = await storageWhen(page, (s) => s.run !== null);
  check('episode run started and draw consumed', s2.run && s2.run.adventure.title === chosenTitle && s2.draw === null);

  // Stage 1 with a field note
  const note1 = 'a door painted the wrong blue';
  const noteInput = page.locator('input[id^=note-]');
  if (await noteInput.count()) await noteInput.fill(note1);
  // A double tap: the second tap must not land on (and pick) an option of the fork.
  await page.getByRole('button', { name: /done — i did it/i }).dblclick();
  await sleep(150);
  const afterDouble = await storageWhen(page, (s) => s.run && s.run.steps.length >= 1);
  check('a double tap on Done does not make a blind choice', afterDouble.run.phase === 'choice' && afterDouble.run.steps.length === 1 && !afterDouble.run.steps[0].optionId, `${afterDouble.run.phase} / ${afterDouble.run.steps.length} steps`);

  // 5. Branching choice
  const options = page.locator('section[aria-labelledby=choice-title] button');
  await options.first().waitFor();
  const optionCount = await options.count();
  check('a branching choice appears after stage 1', optionCount >= 2, `${optionCount} options`);
  await options.nth(1).click();
  await sleep(300);
  const s3 = await storageWhen(page, (s) => s.run && s.run.steps[0] && s.run.steps[0].optionId);
  check('choice is recorded on the run', Boolean(s3.run.steps[0].optionId));

  // 6. Pause and resume — paused time never counts
  await page.getByRole('button', { name: /pause timer/i }).click();
  await page.getByText('Paused.', { exact: true }).waitFor();
  const paused1 = (await storageWhen(page, (s) => s.run && s.run.runningSince === null)).run;
  await sleep(2600);
  const paused2 = (await storage(page)).run;
  check('pausing stops the clock (runningSince = null)', paused1.runningSince === null && paused2.runningSince === null);
  check('no time accrues while paused', paused2.elapsedMs === paused1.elapsedMs, `${paused1.elapsedMs} → ${paused2.elapsedMs} ms`);
  const shownPaused = await page.locator('button[aria-label^="Resume timer"]').getAttribute('aria-label');
  await page.getByRole('button', { name: /resume episode/i }).click();
  const resumed = (await storageWhen(page, (s) => s.run && s.run.runningSince !== null)).run;
  check('resuming restarts the clock', resumed.runningSince !== null);
  check('timer label reflects paused state', /Resume timer/.test(shownPaused ?? ''));

  // 7. Refresh and recover
  await page.locator('input[id^=note-]').count().then(async (n) => {
    if (n) await page.locator('input[id^=note-]').fill('the oldest mailbox');
  });
  await page.locator('h2').first().click(); // blur commits the note
  const before = await storageWhen(page, (s) => s.run && (Object.keys(s.run.notes).length === 0 || Object.values(s.run.notes).includes('the oldest mailbox') || !s.run.adventure.nodes.find((n) => n.id === s.run.nodeId)?.capture));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForURL(/#\/play/);
  await page.getByRole('button', { name: /done — i did it/i }).waitFor();
  const after = await storage(page);
  check('refresh keeps the episode, stage and choice', after.run && after.run.nodeId === before.run.nodeId && after.run.steps[0].optionId === before.run.steps[0].optionId);
  check('refresh keeps field notes', JSON.stringify(after.run.notes) === JSON.stringify(before.run.notes));
  const timer = page.locator('header, main').locator('button[aria-label="Pause timer"], button[aria-label="Resume timer"]').first();
  const timerDesc = await timer.evaluate((el) => document.getElementById(el.getAttribute('aria-describedby') ?? '')?.textContent ?? '');
  check('timer survives refresh', /played of about/.test(timerDesc), timerDesc);
  await page.screenshot({ path: join(ART, 'j04-play-after-refresh.png'), fullPage: true });

  // Save & exit → home shows resume card → resume
  await page.getByRole('button', { name: /save & exit/i }).click();
  await page.waitForURL((u) => !u.hash.includes('play'));
  check('save & exit pauses the episode', (await storageWhen(page, (s) => s.run && s.run.runningSince === null)).run.runningSince === null);
  check('home offers to resume the paused episode', await page.getByRole('button', { name: /resume episode/i }).isVisible());
  await page.getByRole('button', { name: /resume episode/i }).click();
  await page.waitForURL(/#\/play/);
  check('home "Resume" resumes the clock (no second resume needed)', (await storageWhen(page, (s) => s.run && s.run.runningSince !== null)).run.runningSince !== null);

  // 8. Finish (use an alternative challenge on the next stage)
  const finished = await playToEnd(page, { notes: ['', 'the oldest mailbox', 'This street keeps its secrets upstairs.'], useAlternativeAt: 0 });
  check('reached the finale', finished, page.url());
  await page.getByText('Plot twist', { exact: true }).first().waitFor();
  const finaleText = await page.locator('main').innerText();
  check('finale shows title, twist, ending and closing line', finaleText.includes(chosenTitle) && /Ending unlocked/i.test(finaleText));
  const done = (await storageWhen(page, (s) => s.completed.length === 1)).completed[0];
  check('completed episode recorded with ending, choices and award', done && done.endingId && done.steps.length === 3 && Object.values(done.award.points).some((v) => v > 0));
  check('alternative challenge recorded', done.steps.some((s) => s.usedAlternative));
  check('paused time excluded from the episode duration', done.elapsedMs < Date.now() - done.startedAt, `${Math.round(done.elapsedMs / 1000)}s played`);

  // Journal entry — saved even when the page reloads right away, without leaving the field
  await page.locator('textarea[id^=journal-]').fill('Today my street got a second floor.');
  await page.reload({ waitUntil: 'networkidle' });
  const journalSaved = await storageWhen(page, (s) => s.completed[0]?.journal === 'Today my street got a second floor.').then(
    () => true,
    () => false,
  );
  check('journal survives an immediate reload (no blur needed)', journalSaved);

  // Poster renders
  await page.locator('img[alt^="Poster for Episode"]').first().waitFor({ timeout: 15_000 });
  const posterSrc = await page.locator('img[alt^="Poster for Episode"]').first().getAttribute('src');
  check('poster preview renders as a PNG', (posterSrc ?? '').startsWith('data:image/png'));
  await sleep(1800);
  await page.screenshot({ path: join(ART, 'j05-finale.png'), fullPage: true });

  // 9. Download a PNG
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /download png/i }).click()]);
  const pngPath = join(ART, download.suggestedFilename());
  await download.saveAs(pngPath);
  const info = pngInfo(readFileSync(pngPath));
  check('downloaded poster is a valid PNG', info.valid, `${download.suggestedFilename()} ${info.width}×${info.height}, ${Math.round(info.bytes / 1024)} KB`);
  check('poster is 1080×1620 (2:3)', info.width === 1080 && info.height === 1620);

  // Share falls back to clipboard copy when native share is unavailable
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.evaluate(() => {
    // Headless Chromium may expose navigator.share; force the clipboard fallback path.
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
  });
  await page.getByRole('button', { name: /^share$/i }).click();
  await toastIn(page, /copied the episode summary/i).waitFor({ timeout: 5000 }).then(
    () => check('share falls back to clipboard copy', true),
    () => check('share falls back to clipboard copy', false),
  );
  const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  check('clipboard text names the episode', clip.includes(chosenTitle), clip.slice(0, 80));

  // Name the series (first completion)
  const namer = page.locator('#series-name');
  check('first completion invites naming the series', (await namer.count()) > 0);
  if (await namer.count()) {
    await namer.fill('The Tuesday Files');
    await page.getByRole('button', { name: /name my series/i }).click();
  }

  // 10. Reopen in My Series
  await page.getByRole('button', { name: /see my series/i }).click();
  await page.waitForURL(/#\/series$/);
  // (The "Series named …" toast also contains the name — wait for the page heading itself.)
  await page.locator('main h1', { hasText: 'The Tuesday Files' }).waitFor();
  check('My Series shows the named series', true);
  const tiles = page.locator('a[href^="#/series/"]');
  await tiles.first().waitFor({ timeout: 5000 }).catch(() => {});
  const tileCount = await tiles.count();
  check('gallery shows the completed poster', tileCount === 1, `${tileCount} tile(s), ${(await storage(page)).completed.length} stored`);
  await page.screenshot({ path: join(ART, 'j06-series.png'), fullPage: true });
  await tiles.first().click();
  await page.waitForURL(/#\/series\/.+/);
  await page.locator('textarea[id^=journal-]').waitFor();
  const detail = await page.locator('main').innerText();
  const journal = await page.locator('textarea[id^=journal-]').inputValue();
  check('episode detail shows ending and recap of choices', detail.includes(done.endingTitle) && /Your choices/i.test(detail), done.endingTitle);
  check('journal entry persists to the episode detail', journal.includes('second floor'), JSON.stringify(journal));
  await page.screenshot({ path: join(ART, 'j07-detail.png'), fullPage: true });

  // Progress survives a full reload
  await page.reload({ waitUntil: 'networkidle' });
  check('series survives reload', (await page.locator('main').innerText()).includes(done.endingTitle));

  check('no console or page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────────
async function aiSuite(browser, base, { expectFallback = false } = {}) {
  console.log(`\n▶ ${expectFallback ? 'ai-fallback (mock returns invalid drafts)' : 'ai (AI Director online via mock provider)'}`);
  const { validateAdventure, fitsPrefs } = await import('../shared/validate.ts');
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => /AI Director: Online/.test(document.querySelector('header button[aria-label*="AI Director:"]')?.getAttribute('aria-label') || ''), null, { timeout: 10_000 });
  check('status pill shows AI Director online', true);
  check('optional AI detail field appears when online', await page.locator('#ai-detail').isVisible());
  await page.locator('#ai-detail').fill('near a big park');
  await page.getByRole('button', { name: /give me a plot twist/i }).click();
  await page.waitForURL(/#\/envelopes/);
  await page.locator('button.envelope').first().waitFor();
  const writing = page.locator('[data-writing="true"]');
  check('third envelope shows the writing state', (await writing.count()) === 1);
  await page.screenshot({ path: join(ART, `${expectFallback ? 'f' : 'a'}01-writing.png`) });
  await page.waitForFunction(() => document.querySelectorAll('[data-writing="true"]').length === 0, null, { timeout: 30_000 });
  const s = await storageWhen(page, (st) => st.draw && st.draw.envelopes.every((e) => e.status !== 'writing'));
  const aiEnv = s.draw.envelopes[s.draw.envelopes.length - 1];
  if (!expectFallback) {
    check('AI envelope arrives sealed and validated', aiEnv.source === 'ai' && validateAdventure(aiEnv.adventure).ok && fitsPrefs(aiEnv.adventure, s.draw.prefs), aiEnv.adventure?.title);
    await page.screenshot({ path: join(ART, 'a02-ai-envelope.png'), fullPage: true });
    await page.locator('button.envelope').nth(2).click();
    const dialogText = await page.getByRole('dialog').innerText();
    check('reveal marks it as written for you', /Written for you by the AI Director/i.test(dialogText));
    await page.getByRole('button', { name: /start episode/i }).click();
    await page.waitForURL(/#\/play/);
    const ok = await playToEnd(page, { pick: (_i, n) => n - 1, notes: ['a bench with a plaque', 'pigeon treaty', 'a leaf from the treaty'] });
    check('AI episode plays through to its finale', ok);
    // Measured while the stamp animation runs: the finale must never widen the mobile layout viewport.
    const width = await page.evaluate(() => [window.innerWidth, document.documentElement.scrollWidth]);
    check('finale keeps the phone layout width (no sideways pan)', width[0] === 390 && width[1] <= 390, width.join(' / '));
    const ep = (await storageWhen(page, (st) => st.completed.length === 1)).completed[0];
    check('AI episode is saved to the series', ep && ep.source === 'ai');
    await page.getByRole('button', { name: /see my series/i }).click();
    await page.waitForURL(/#\/series$/);
    check('finale buttons respond to taps on a phone', true);
  } else {
    check('invalid AI output falls back to a curated episode', aiEnv.source === 'curated' && validateAdventure(aiEnv.adventure).ok, aiEnv.note ?? '');
    check('fallback explains what happened', /archive pick instead/i.test(aiEnv.note ?? ''));
    await page.screenshot({ path: join(ART, 'f02-fallback.png'), fullPage: true });
  }
  check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();

  if (!expectFallback) {
    // While the AI envelope is being written, the archive count must not read as "only 2 fit".
    const c3 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const p3 = await c3.newPage();
    await p3.goto(base, { waitUntil: 'networkidle' });
    await p3.evaluate(() => localStorage.clear());
    await p3.reload({ waitUntil: 'networkidle' });
    await p3.waitForFunction(() => /AI Director: Online/.test(document.querySelector('header button[aria-label*="AI Director:"]')?.getAttribute('aria-label') || ''), null, { timeout: 10_000 });
    await p3.getByText('15 min', { exact: true }).click();
    await p3.getByText('At home', { exact: true }).click();
    await p3.getByRole('button', { name: /give me a plot twist/i }).click();
    await p3.waitForURL(/#\/envelopes/);
    await p3.locator('[data-writing="true"]').waitFor({ timeout: 5000 }).catch(() => {});
    const writingNow = (await p3.locator('[data-writing="true"]').count()) === 1;
    const misleading = /fit everything/i.test(await p3.locator('main').innerText()) && (await p3.locator('main button.chip').count()) > 0;
    check('while the AI writes, no "only N fit" note with chips that would discard it', writingNow && !misleading, writingNow ? '' : 'writing state already over');
    await c3.close();

    // The header must fit at 320px with the longest live status labels too.
    const small = await browser.newContext({ viewport: { width: 320, height: 640 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const p2 = await small.newPage();
    await p2.goto(base, { waitUntil: 'networkidle' });
    await p2.waitForFunction(() => /AI Director: Online/.test(document.querySelector('header button[aria-label*="AI Director:"]')?.getAttribute('aria-label') || ''), null, { timeout: 10_000 });
    const w = await p2.evaluate(() => [window.innerWidth, document.documentElement.scrollWidth]);
    check('320px header fits with the AI Director online', w[0] === 320 && w[1] <= 320, w.join(' / '));
    await p2.screenshot({ path: join(ART, 'a03-header-320-online.png') });
    await small.close();
  }
}

// ─────────────────────────────────────────────────────────────────────
async function layoutSuite(browser, base) {
  console.log('\n▶ layout (320px phones, keyboard, reduced motion)');
  const ctx = await browser.newContext({ viewport: { width: 320, height: 640 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  const noHScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

  check('scene: no horizontal scroll at 320px', await noHScroll());
  const animDur = await page.evaluate(() => getComputedStyle(document.querySelector('.anim-letterbox')).animationDuration);
  check('reduced motion shortens animations', parseFloat(animDur) <= 0.01, animDur);

  // Keyboard: tab into the time chips, arrow to change, then submit with Enter
  await page.keyboard.press('Tab'); // skip link
  let focusedSkip = await page.evaluate(() => document.activeElement?.textContent?.trim());
  check('skip link is the first tab stop', focusedSkip === 'Skip to content', focusedSkip);
  await page.keyboard.press('Enter');
  const skipped = await page.evaluate(() => [location.hash || '#/', Boolean(document.activeElement?.closest('main'))]);
  check('skip link keeps the screen and moves focus into the content', skipped[0] === '#/' && skipped[1] === true, String(skipped));
  await page.locator('input[name=minutes]').first().focus();
  await page.keyboard.press('ArrowRight');
  const minutes = await page.evaluate(() => document.querySelector('input[name=minutes]:checked')?.value);
  check('arrow keys move within a chip group', minutes === '30' || minutes === '60', `now ${minutes}`);
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement.nextElementSibling).outlineStyle);
  check('focused chip shows a visible focus ring', outline !== 'none', outline);
  await page.getByRole('button', { name: /give me a plot twist/i }).focus();
  await page.keyboard.press('Enter');
  await page.waitForURL(/#\/envelopes/);
  check('envelopes: no horizontal scroll at 320px', await noHScroll());
  await page.screenshot({ path: join(ART, 'l01-envelopes-320.png'), fullPage: true });
  await page.locator('button.envelope').first().focus();
  await page.keyboard.press('Enter');
  await page.getByRole('dialog').waitFor();
  const inDialog = await page
    .waitForFunction(() => Boolean(document.activeElement?.closest('[role=dialog]')), null, { timeout: 2000 })
    .then(() => true, () => false);
  check('opening an envelope moves focus into the dialog', inDialog);
  await page.keyboard.press('Escape');
  await sleep(200);
  check('Escape closes the dialog', (await page.getByRole('dialog').count()) === 0);
  await page.locator('button.envelope').first().click();
  await page.getByRole('button', { name: /start episode/i }).click();
  await page.waitForURL(/#\/play/);
  check('play: no horizontal scroll at 320px', await noHScroll());
  await page.screenshot({ path: join(ART, 'l02-play-320.png'), fullPage: true });
  const smallTargets = await page.evaluate(() =>
    [...document.querySelectorAll('main button, main a, main input:not(.chip-input)')]
      .filter((el) => el.offsetParent !== null)
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.height < 40 || r.width < 40).length,
  );
  check('play controls are touch-sized (≥ 40px)', smallTargets === 0, `${smallTargets} small`);
  await playToEnd(page);
  check('finale: no horizontal scroll at 320px', await noHScroll());
  await page.screenshot({ path: join(ART, 'l03-finale-320.png'), fullPage: true });
  await page.goto(`${base}#/series`);
  await sleep(600);
  check('series: no horizontal scroll at 320px', await noHScroll());
  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────────
async function conflictSuite(browser, devBase) {
  console.log('\n▶ conflict (dev server, empty library)');
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${devBase}/?library=sound-detective`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  // sound-detective is 15 min / free; asking for outside + 2h still fits — restrict harder:
  await page.goto(`${devBase}/?library=none`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /give me a plot twist/i }).click();
  await page.waitForURL(/#\/envelopes/);
  const text = await page.locator('main').innerText();
  check('empty match explains the conflict', /No envelope fits/i.test(text));
  await page.screenshot({ path: join(ART, 'c01-conflict.png'), fullPage: true });
  await page.goto(`${devBase}/?library=undercover-tourist#/`, { waitUntil: 'networkidle' });
  await page.getByText('15 min', { exact: true }).click();
  await page.getByText('Outside', { exact: true }).click();
  await page.getByRole('button', { name: /give me a plot twist/i }).click();
  await page.waitForURL(/#\/envelopes/);
  const relax = page.locator('main button.chip');
  const labels = await relax.allInnerTexts();
  check('conflict offers one-tap single-constraint relaxations', labels.length > 0, labels.join(' | '));
  await page.screenshot({ path: join(ART, 'c02-relax.png'), fullPage: true });
  if (labels.length) {
    await relax.first().click();
    await sleep(600);
    check('applying a relaxation deals matching envelopes', (await page.locator('button.envelope').count()) >= 1);
  }
  await ctx.close();
}


// ─────────────────────────────────────────────────────────────────────
/** Draws, opens the first envelope and starts it. */
async function startFirstEpisode(page) {
  await page.getByRole('button', { name: /give me a plot twist/i }).click();
  await page.waitForURL(/#\/envelopes/);
  await page.locator('button.envelope').first().click();
  await page.getByRole('dialog').waitFor();
  await page.getByRole('button', { name: /start episode/i }).click();
  await page.waitForURL(/#\/play/);
  await page.getByRole('button', { name: /done — i did it/i }).waitFor();
}

/** Pretends the tab went to the background / came back (headless pages are always "visible"). */
async function setVisibility(page, state) {
  await page.evaluate((st) => {
    Object.defineProperty(document, 'visibilityState', { value: st, configurable: true });
    Object.defineProperty(document, 'hidden', { value: st === 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, state);
}

async function resilienceSuite(browser, base) {
  console.log('\n▶ resilience (two tabs, double taps, long absences, drafts)');

  // A. Two tabs: a stale idle tab must never erase an episode finished in another tab.
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const a = await ctx.newPage();
    await a.goto(base, { waitUntil: 'networkidle' });
    await a.evaluate(() => localStorage.clear());
    await a.reload({ waitUntil: 'networkidle' });
    const b = await ctx.newPage();
    await b.goto(base, { waitUntil: 'networkidle' });
    await startFirstEpisode(b);
    check('two tabs: the second tab plays to the finale', await playToEnd(b));
    await storageWhen(b, (s) => s.completed.length === 1);
    await b.close();
    // The stale tab hides, comes back, and the user taps a chip.
    await setVisibility(a, 'hidden');
    await setVisibility(a, 'visible');
    await a.getByText('1 hr', { exact: true }).click();
    await sleep(600);
    const st = await storage(a);
    check('two tabs: the stale tab adopts the other tab’s episode', st.completed.length === 1 && st.prefs.minutes === 60, `${st.completed.length} episode(s)`);
    const headerCount = await a.locator('header button[aria-label^="My Series"]').getAttribute('aria-label');
    check('two tabs: the stale tab’s header updates live', /1 episode/.test(headerCount ?? ''), headerCount ?? '');
    await a.close();
    const c = await ctx.newPage();
    await c.goto(`${base}#/series`, { waitUntil: 'networkidle' });
    await sleep(400);
    check('two tabs: My Series still has the episode after the stale tab closed', (await c.locator('a[href^="#/series/"]').count()) === 1);
    await ctx.close();
  }

  // B. Double tap on stage 2's Done must not skip stage 3; notes typed right before a reload survive.
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    await startFirstEpisode(page);
    await page.getByRole('button', { name: /done — i did it/i }).click();
    // At the fork: pause, then double tap "Resume episode" — the 2nd tap must not pick an option.
    await page.locator('section[aria-labelledby=choice-title] button').first().waitFor();
    await sleep(600);
    await page.getByRole('button', { name: /pause timer/i }).click();
    await page.getByRole('button', { name: /resume episode/i }).dblclick();
    await sleep(700);
    const afterResume = await storage(page);
    check('a double tap on Resume at the fork makes no blind choice', afterResume.run && afterResume.run.phase === 'choice' && afterResume.run.steps.length === 1 && !afterResume.run.steps[0].optionId);
    await page.locator('section[aria-labelledby=choice-title] button').first().click();
    await page.getByRole('button', { name: /done — i did it/i }).waitFor();
    const noteInput = page.locator('input[id^=note-]');
    if (await noteInput.count()) {
      await noteInput.fill('typed then refreshed');
      await page.reload({ waitUntil: 'networkidle' });
      const st = await storageWhen(page, (s) => s.run);
      check('a field note typed right before a refresh is kept', Object.values(st.run.notes).includes('typed then refreshed'), JSON.stringify(st.run.notes));
    }
    await page.getByRole('button', { name: /done — i did it/i }).dblclick();
    await sleep(700);
    const st2 = await storage(page);
    check('a double tap on Done does not skip the next stage', st2.run && st2.run.steps.length === 2 && st2.completed.length === 0, st2.run ? `${st2.run.steps.length} steps` : 'finished');
    await ctx.close();
  }

  // C. A tab kept open in the background for 3 hours: the clock pauses, time is capped.
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.clock.install({ time: new Date('2026-11-08T10:00:00') });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    await startFirstEpisode(page);
    await page.clock.fastForward(5_000);
    await setVisibility(page, 'hidden');
    await page.clock.fastForward('03:00:00');
    await setVisibility(page, 'visible');
    await toastIn(page, /welcome back — we paused the clock/i).waitFor({ timeout: 5000 }).then(
      () => check('back after 3 h in the background: "welcome back" and the clock is paused', true),
      () => check('back after 3 h in the background: "welcome back" and the clock is paused', false),
    );
    const st = await storageWhen(page, (s) => s.run && s.run.runningSince === null);
    const minutes = st.run.elapsedMs / 60_000;
    check('time away is capped, not credited in full', minutes <= 61 && minutes >= 1, `${minutes.toFixed(1)} min credited`);
    await page.screenshot({ path: join(ART, 'r01-welcome-back.png') });
    await ctx.close();
  }

  // D. Browsing My Series in a second tab while the play tab is in the background is not play time.
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    await ctx.clock.install({ time: new Date('2026-11-08T10:00:00') });
    const play = await ctx.newPage();
    await play.goto(base, { waitUntil: 'networkidle' });
    await play.evaluate(() => localStorage.clear());
    await play.reload({ waitUntil: 'networkidle' });
    await startFirstEpisode(play);
    const other = await ctx.newPage();
    await other.goto(`${base}#/series`, { waitUntil: 'networkidle' });
    await ctx.clock.fastForward(5_000);
    await setVisibility(play, 'hidden');
    await ctx.clock.fastForward('03:00:00');
    await setVisibility(play, 'visible');
    await toastIn(play, /welcome back — we paused the clock/i).waitFor({ timeout: 5000 }).then(
      () => check('a second open tab does not count as watching the episode', true),
      () => check('a second open tab does not count as watching the episode', false),
    );
    await ctx.close();
  }
}

/** Dialogs, Back, announcements and other fixes from the third QA round. */
async function round3Suite(browser, base, aiBase, fallbackBase) {
  console.log('\n▶ round 3 (sheets and Back, paused dialog, Check again, toasts, journal, fallback)');
  const fresh = async (page, url = base) => {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
  };
  const pageState = (page) =>
    page.evaluate(() => ({ hash: location.hash, dialogs: document.querySelectorAll('[role=dialog]').length, overflow: document.body.style.overflow, inert: document.getElementById('root')?.hasAttribute('inert') ?? false }));

  // A. Back closes the AI status sheet (it used to navigate underneath and leave scrolling locked).
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 640 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await fresh(page);
    await startFirstEpisode(page);
    await page.getByRole('button', { name: /save & exit/i }).first().click();
    await page.waitForURL(/#\/$/);
    await page.getByRole('button', { name: /AI Director:/ }).click();
    await page.getByRole('dialog', { name: /AI Director status/i }).waitFor();
    await page.goBack();
    await sleep(400);
    const s = await pageState(page);
    check('Back closes the AI status sheet and stays on the screen', s.hash === '#/' && s.dialogs === 0 && s.overflow === '' && !s.inert, JSON.stringify(s));

    // B. The paused screen is a real modal; resuming puts focus back on the visible timer button.
    await page.getByRole('button', { name: /resume episode/i }).first().click();
    await page.waitForURL(/#\/play/);
    await page.getByRole('button', { name: /done — i did it/i }).waitFor();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.getByRole('button', { name: 'Pause timer' }).click();
    await page.getByRole('dialog', { name: /paused/i }).waitFor();
    await sleep(250);
    const inside = [];
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab');
      inside.push(await page.evaluate(() => Boolean(document.activeElement?.closest('[role=dialog]'))));
    }
    const locked = await pageState(page);
    check('paused screen keeps Tab inside it; the episode and skip link are inert', inside.every(Boolean) && locked.inert && locked.overflow === 'hidden', JSON.stringify({ inside, locked }));
    await page.keyboard.press('Escape');
    await sleep(300);
    const f = await page.evaluate(() => {
      const a = document.activeElement;
      const r = a.getBoundingClientRect();
      return { name: a.getAttribute('aria-label'), inView: r.top >= 0 && r.bottom <= innerHeight, overflow: document.body.style.overflow };
    });
    check('resuming returns focus to the timer button, on screen, and unlocks scrolling', f.name === 'Pause timer' && f.inView && f.overflow === '', JSON.stringify(f));

    // C. The journal confirms the save even when the autosave already stored it.
    check('round 3: the episode plays to the finale', await playToEnd(page));
    const journal = page.getByLabel(/one sentence for your journal/i);
    await journal.fill('Round three was here.');
    await sleep(900);
    await journal.blur();
    await sleep(150);
    check('journal says "Saved to your series." after typing, a pause and leaving the field', (await page.getByText('Saved to your series.').count()) > 0);
    await ctx.close();
  }

  // D. Toasts: screen readers hear only the newest message, not the whole stack again.
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await fresh(page);
    await page.getByRole('button', { name: /give me a plot twist/i }).click();
    await page.waitForURL(/#\/envelopes/);
    await page.getByRole('button', { name: /draw again/i }).click();
    await page.getByRole('button', { name: /AI Director:/ }).click();
    await page.getByRole('button', { name: /check again/i }).click();
    await sleep(1500);
    const t = await page.evaluate(() => ({
      announcer: [...document.querySelectorAll('body > div[role=status]')].map((n) => n.textContent.trim()),
      stack: document.querySelectorAll('body > div.pointer-events-none button').length,
    }));
    check('toast announcer holds only the newest message', t.announcer.length === 1 && /^AI Director checked: /.test(t.announcer[0]) && !/New envelopes|dismiss/.test(t.announcer[0]) && t.stack >= 2, JSON.stringify(t));
    await ctx.close();
  }

  // E. A letter closed by another tab (it started that episode) leaves no dead Back step.
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const a = await ctx.newPage();
    await fresh(a);
    await a.getByRole('button', { name: /give me a plot twist/i }).click();
    await a.waitForURL(/#\/envelopes/);
    await a.locator('button.envelope').first().click();
    await a.getByRole('dialog').waitFor();
    const b = await ctx.newPage();
    await b.goto(`${base}#/envelopes`, { waitUntil: 'networkidle' });
    await b.locator('button.envelope').first().click();
    await b.getByRole('dialog').waitFor();
    await b.getByRole('button', { name: /start episode/i }).click();
    await b.waitForURL(/#\/play/);
    await sleep(900);
    const gone = await pageState(a);
    await a.goBack();
    await sleep(400);
    const after = await a.evaluate(() => location.hash);
    // One Back must leave the envelopes screen (to the home screen this test started on).
    check('a letter closed by another tab takes its history entry with it', gone.dialogs === 0 && !gone.inert && after !== '#/envelopes', JSON.stringify({ gone, after }));
    await ctx.close();
  }

  // F. "Check again" ends when the request settles, even when the server throttles it, and keeps focus.
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(aiBase, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /AI Online/ }).waitFor({ timeout: 15_000 });
    await page.getByRole('button', { name: /AI Director:/ }).click();
    await page.getByRole('button', { name: /check again/i }).click();
    await page.getByRole('button', { name: 'Check again' }).waitFor({ timeout: 8_000 });
    await page.getByRole('button', { name: 'Check again' }).click(); // within 15 s: the server answers from its throttle
    await sleep(3_000);
    const c = await page.evaluate(() => ({ focus: document.activeElement?.textContent?.trim(), inDialog: Boolean(document.activeElement?.closest('[role=dialog]')) }));
    check('"Check again" settles under the server throttle and keeps focus in the sheet', c.focus === 'Check again' && c.inDialog, JSON.stringify(c));
    await ctx.close();
  }

  // G. The archive pick standing in for a failed AI envelope counts as shown (Draw again deals unseen first).
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await fresh(page, fallbackBase);
    await page.getByRole('button', { name: /AI Online/ }).waitFor({ timeout: 15_000 });
    await page.getByRole('button', { name: /give me a plot twist/i }).click();
    await page.waitForURL(/#\/envelopes/);
    const st = await storageWhen(page, (s) => s.draw && s.draw.envelopes.length === 3 && s.draw.envelopes.every((e) => e.status !== 'writing'), 40_000);
    const fb = st.draw.envelopes.find((e) => e.source === 'curated' && e.note);
    check('a fallback archive pick is marked as shown', Boolean(fb && st.draw.shownIds.includes(fb.adventure.id)), JSON.stringify({ fb: fb?.adventure?.id, shown: st.draw.shownIds }));
    await ctx.close();
  }
}

// ─────────────────────────────────────────────────────────────────────
async function main() {
  // Build into an isolated directory so E2E never disturbs a dist/ someone else is serving.
  const DIST = join(ROOT, 'e2e', '.dist');
  // --skip-build only skips an up-to-date build: testing yesterday's bundle proves nothing.
  const { staleDistWarning } = await import('../server/static.ts');
  const stale = args.has('--skip-build') ? (existsSync(join(DIST, 'index.html')) ? staleDistWarning(DIST) : 'e2e/.dist/ does not exist yet') : null;
  if (stale) console.log(`${stale} — building anyway.`);
  if (!args.has('--skip-build') || stale) {
    console.log('Building…');
    execSync(`npx vite build --outDir ${JSON.stringify(DIST)} --emptyOutDir`, { cwd: ROOT, stdio: 'inherit' });
  }
  const MOCK = 8788;
  start('node', ['e2e/mockAnthropic.ts'], { MOCK_PORT: String(MOCK), MOCK_MODE: 'ok', MOCK_DELAY_MS: '60' }, 'mock');
  start('node', ['e2e/mockAnthropic.ts'], { MOCK_PORT: String(MOCK + 1), MOCK_MODE: 'always-invalid', MOCK_DELAY_MS: '10' }, 'mock-bad');
  // Writes an envelope in about 10 s, so tabs can act while it is being written.
  start('node', ['e2e/mockAnthropic.ts'], { MOCK_PORT: String(MOCK - 2), MOCK_MODE: 'ok', MOCK_DELAY_MS: '600' }, 'mock-slow');
  // The AI provider itself is rate limited (the Messages API answers 429; the Models API is fine).
  start('node', ['e2e/mockAnthropic.ts'], { MOCK_PORT: String(MOCK - 3), MOCK_MODE: 'rate-limited', MOCK_DELAY_MS: '60' }, 'mock-limited');
  const noKey = { ANTHROPIC_API_KEY: '', PLOT_TWIST_ANTHROPIC_API_KEY: '' };
  start('node', ['server/index.ts'], { ...noKey, PORT: '8790', PLOT_TWIST_DIST: DIST }, 'curated');
  start('node', ['server/index.ts'], { PORT: '8791', PLOT_TWIST_DIST: DIST, ANTHROPIC_API_KEY: 'e2e-test-key', PLOT_TWIST_ANTHROPIC_BASE_URL: `http://127.0.0.1:${MOCK}` }, 'ai');
  start('node', ['server/index.ts'], { PORT: '8792', PLOT_TWIST_DIST: DIST, ANTHROPIC_API_KEY: 'e2e-test-key', PLOT_TWIST_ANTHROPIC_BASE_URL: `http://127.0.0.1:${MOCK + 1}` }, 'ai-bad');
  start(
    'node',
    ['server/index.ts'],
    { PORT: '8793', PLOT_TWIST_DIST: DIST, ANTHROPIC_API_KEY: 'e2e-test-key', PLOT_TWIST_ANTHROPIC_BASE_URL: `http://127.0.0.1:${MOCK - 2}`, PLOT_TWIST_RATE_LIMIT: '1000' },
    'ai-slow',
  );
  start(
    'node',
    ['server/index.ts'],
    { PORT: '8794', PLOT_TWIST_DIST: DIST, ANTHROPIC_API_KEY: 'e2e-test-key', PLOT_TWIST_ANTHROPIC_BASE_URL: `http://127.0.0.1:${MOCK - 3}`, PLOT_TWIST_RATE_LIMIT: '1000' },
    'ai-limited',
  );
  start('npx', ['vite', '--port', '5197', '--strictPort'], noKey, 'dev');
  await Promise.all([
    waitFor('http://127.0.0.1:8790/api/health'),
    waitFor('http://127.0.0.1:8791/api/health'),
    waitFor('http://127.0.0.1:8792/api/health'),
    waitFor('http://127.0.0.1:8793/api/health'),
    waitFor('http://127.0.0.1:8794/api/health'),
    waitFor('http://127.0.0.1:5197/'),
  ]);

  const browser = await chromium.launch();
  try {
    const suites = {
      journey: () => journeySuite(browser, 'http://127.0.0.1:8790/'),
      ai: () => aiSuite(browser, 'http://127.0.0.1:8791/'),
      'ai-fallback': () => aiSuite(browser, 'http://127.0.0.1:8792/', { expectFallback: true }),
      layout: () => layoutSuite(browser, 'http://127.0.0.1:8790/'),
      conflict: () => conflictSuite(browser, 'http://127.0.0.1:5197'),
      resilience: () => resilienceSuite(browser, 'http://127.0.0.1:8790/'),
      round3: () => round3Suite(browser, 'http://127.0.0.1:8790/', 'http://127.0.0.1:8791/', 'http://127.0.0.1:8792/'),
      'a11y-round3': () => a11yRound3Suite(browser, 'http://127.0.0.1:8790/', check),
      round4: () => round4Suite(browser, 'http://127.0.0.1:8790/', 'http://127.0.0.1:8791/', check),
      round5: () => round5Suite(browser, { base: 'http://127.0.0.1:8790/', aiBase: 'http://127.0.0.1:8791/', slowAiBase: 'http://127.0.0.1:8793/' }, check),
      round6: () =>
        round6Suite(browser, { base: 'http://127.0.0.1:8790/', aiBase: 'http://127.0.0.1:8791/', slowAiBase: 'http://127.0.0.1:8793/', limitedAiBase: 'http://127.0.0.1:8794/' }, check),
      round7: () =>
        round7Suite(browser, { base: 'http://127.0.0.1:8790/', aiBase: 'http://127.0.0.1:8791/', slowAiBase: 'http://127.0.0.1:8793/', limitedAiBase: 'http://127.0.0.1:8794/' }, check),
    };
    for (const [name, run] of Object.entries(suites)) {
      if (only && only !== name) continue;
      try {
        await run();
      } catch (err) {
        check(`${name} suite crashed`, false, String(err?.message ?? err).split('\n')[0]);
      }
    }
  } finally {
    await browser.close();
    for (const p of procs) p.kill('SIGTERM');
  }
  writeFileSync(join(ART, 'results.json'), JSON.stringify(results, null, 2));
  console.log(`\n${results.length - failures}/${results.length} checks passed`);
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  for (const p of procs) p.kill('SIGTERM');
  process.exit(1);
});
