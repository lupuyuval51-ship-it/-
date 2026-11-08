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
 */
import { spawn, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
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
  await page.waitForFunction(() => /AI Director: Not configured/.test(document.querySelector('header button[aria-label^="AI Director"]')?.getAttribute('aria-label') || ''), null, { timeout: 8000 });
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
  await dialog.getByRole('button', { name: /look at another envelope/i }).click();
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
  await page.getByRole('button', { name: /done — i did it/i }).click();

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
  const timerText = await page.locator('button[aria-label*="elapsed"]').getAttribute('aria-label');
  check('timer survives refresh', /elapsed/.test(timerText ?? ''), timerText ?? '');
  await page.screenshot({ path: join(ART, 'j04-play-after-refresh.png'), fullPage: true });

  // Save & exit → home shows resume card → resume
  await page.getByRole('button', { name: /save & exit/i }).click();
  await page.waitForURL((u) => !u.hash.includes('play'));
  check('save & exit pauses the episode', (await storageWhen(page, (s) => s.run && s.run.runningSince === null)).run.runningSince === null);
  check('home offers to resume the paused episode', await page.getByRole('button', { name: /resume episode/i }).isVisible());
  await page.getByRole('button', { name: /resume episode/i }).click();
  await page.waitForURL(/#\/play/);
  // Resume the clock from the paused overlay
  const resumeBtn = page.getByRole('button', { name: /resume episode/i });
  if (await resumeBtn.count()) await resumeBtn.click();

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

  // Journal entry
  await page.locator('textarea[id^=journal-]').fill('Today my street got a second floor.');
  await page.locator('textarea[id^=journal-]').blur();
  await sleep(300);

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
  await page.getByText(/copied the episode summary/i).waitFor({ timeout: 5000 }).then(
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
  await page.getByText('The Tuesday Files').first().waitFor();
  check('My Series shows the named series', true);
  const tiles = page.locator('a[href^="#/series/"]');
  check('gallery shows the completed poster', (await tiles.count()) === 1);
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
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => /AI Director: Online/.test(document.querySelector('header button[aria-label^="AI Director"]')?.getAttribute('aria-label') || ''), null, { timeout: 10_000 });
  check('status pill shows AI Director online', true);
  check('optional AI detail field appears when online', await page.locator('#ai-detail').isVisible());
  await page.locator('#ai-detail').fill('near a big park');
  await page.getByRole('button', { name: /give me a plot twist/i }).click();
  await page.waitForURL(/#\/envelopes/);
  await page.locator('button.envelope').first().waitFor();
  const writing = page.locator('[aria-busy="true"]');
  check('third envelope shows the writing state', (await writing.count()) === 1);
  await page.screenshot({ path: join(ART, `${expectFallback ? 'f' : 'a'}01-writing.png`) });
  await page.waitForFunction(() => document.querySelectorAll('[aria-busy="true"]').length === 0, null, { timeout: 30_000 });
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
    const ep = (await storageWhen(page, (st) => st.completed.length === 1)).completed[0];
    check('AI episode is saved to the series', ep && ep.source === 'ai');
  } else {
    check('invalid AI output falls back to a curated episode', aiEnv.source === 'curated' && validateAdventure(aiEnv.adventure).ok, aiEnv.note ?? '');
    check('fallback explains what happened', /archive pick instead/i.test(aiEnv.note ?? ''));
    await page.screenshot({ path: join(ART, 'f02-fallback.png'), fullPage: true });
  }
  check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
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
async function main() {
  if (!args.has('--skip-build')) {
    console.log('Building…');
    execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
  }
  const MOCK = 8788;
  start('node', ['e2e/mockAnthropic.ts'], { MOCK_PORT: String(MOCK), MOCK_MODE: 'ok', MOCK_DELAY_MS: '60' }, 'mock');
  start('node', ['e2e/mockAnthropic.ts'], { MOCK_PORT: String(MOCK + 1), MOCK_MODE: 'always-invalid', MOCK_DELAY_MS: '10' }, 'mock-bad');
  const noKey = { ANTHROPIC_API_KEY: '', PLOT_TWIST_ANTHROPIC_API_KEY: '' };
  start('node', ['server/index.ts'], { ...noKey, PORT: '8790' }, 'curated');
  start('node', ['server/index.ts'], { PORT: '8791', ANTHROPIC_API_KEY: 'e2e-test-key', PLOT_TWIST_ANTHROPIC_BASE_URL: `http://127.0.0.1:${MOCK}` }, 'ai');
  start('node', ['server/index.ts'], { PORT: '8792', ANTHROPIC_API_KEY: 'e2e-test-key', PLOT_TWIST_ANTHROPIC_BASE_URL: `http://127.0.0.1:${MOCK + 1}` }, 'ai-bad');
  start('npx', ['vite', '--port', '5197', '--strictPort'], noKey, 'dev');
  await Promise.all([waitFor('http://127.0.0.1:8790/api/health'), waitFor('http://127.0.0.1:8791/api/health'), waitFor('http://127.0.0.1:8792/api/health'), waitFor('http://127.0.0.1:5197/')]);

  const browser = await chromium.launch();
  try {
    const suites = {
      journey: () => journeySuite(browser, 'http://127.0.0.1:8790/'),
      ai: () => aiSuite(browser, 'http://127.0.0.1:8791/'),
      'ai-fallback': () => aiSuite(browser, 'http://127.0.0.1:8792/', { expectFallback: true }),
      layout: () => layoutSuite(browser, 'http://127.0.0.1:8790/'),
      conflict: () => conflictSuite(browser, 'http://127.0.0.1:5197'),
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
