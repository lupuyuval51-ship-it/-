/**
 * Shared steps of the device-mode E2E specs (static device build, no app server, no database service).
 * A persistent browser profile stands for the phone: closing and launching it again is an app restart with
 * the same storage.
 */
import { chromium, expect, type BrowserContext, type Page, type TestInfo } from '@playwright/test';

export const next = (page: Page) => page.getByRole('button', { name: 'Next' }).click();
export const toast = (page: Page, text: string | RegExp) => page.locator('.toasts').getByText(text).first();

/** Screenshots go here when DEVICE_SHOTS is set (e.g. the Hebrew RTL pass). */
export const SHOTS = process.env.DEVICE_SHOTS ?? '';

/** A whole-page screenshot (the fixed bottom bar placed at the end so it covers nothing), or `screen` for what is on the screen (dialogs). */
export async function shot(page: Page, name: string, { screen = false }: { screen?: boolean } = {}) {
  if (!SHOTS) return;
  // Let fonts and lazy images settle; never animate in a screenshot.
  await page.evaluate(() => document.fonts.ready);
  // (A style element would be refused by the app's Content Security Policy; an element's style is not.)
  const pin = (position: string) =>
    page.evaluate((p) => document.querySelector<HTMLElement>('.bottom-nav')?.style.setProperty('position', p, p ? 'important' : ''), position);
  if (!screen) await pin('static');
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: !screen, animations: 'disabled' });
  if (!screen) await pin('');
}

/**
 * Launches the "phone". `width` 390 is the narrow phone width every screen must fit; `locale` is the app's
 * starting language (set before every page load unless the app stored another choice).
 */
export async function launch(testInfo: TestInfo, { width, locale = 'en', dir = 'profile' }: { width?: number; locale?: 'en' | 'he'; dir?: string } = {}): Promise<BrowserContext> {
  const use = testInfo.project.use;
  const viewport = width ? { width, height: 844 } : use.viewport;
  const context = await chromium.launchPersistentContext(testInfo.outputPath(dir), {
    viewport,
    userAgent: use.userAgent,
    deviceScaleFactor: use.deviceScaleFactor,
    isMobile: use.isMobile,
    hasTouch: use.hasTouch,
    locale: locale === 'he' ? 'he-IL' : 'en-US',
    timezoneId: 'Asia/Jerusalem',
    baseURL: use.baseURL,
    acceptDownloads: true,
  });
  await context.addInitScript((lang) => {
    try {
      if (!window.localStorage.getItem('fitai.locale')) window.localStorage.setItem('fitai.locale', JSON.stringify(lang));
    } catch {
      /* ignore */
    }
  }, locale);
  return context;
}

export const firstPage = async (context: BrowserContext) => context.pages()[0] ?? (await context.newPage());

/** Fails the test on errors that mean the device runtime is broken (CSP blocks, uncaught errors). */
export function watch(page: Page, problems: string[]) {
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error' && /Content Security Policy|\[device\]/.test(msg.text())) problems.push(`console: ${msg.text()}`);
  });
}

/** Time from navigation to "device ready" (ms), and the worker's own start-up time. */
export async function bootTiming(page: Page) {
  await page.waitForFunction(() => performance.getEntriesByName('lupufit:device-ready').length > 0, undefined, { timeout: 60_000 });
  return page.evaluate(() => {
    const mark = performance.getEntriesByName('lupufit:device-ready')[0] as PerformanceMark;
    const detail = mark.detail as { workerBootMs: number; steps: Record<string, number> };
    return { readyMs: Math.round(mark.startTime), workerBootMs: detail.workerBootMs, steps: detail.steps };
  });
}

/** The device runtime is ready (after every full page load: the start-up screen is gone). */
export async function appReady(page: Page) {
  await page.waitForFunction(() => performance.getEntriesByName('lupufit:device-ready').length > 0, undefined, { timeout: 60_000 });
}

/** The page never scrolls sideways (every screen fits the phone's width). */
export async function expectFits(page: Page, where: string) {
  const { scroll, width } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: window.innerWidth }));
  expect(scroll, `${where}: page wider than the screen`).toBeLessThanOrEqual(width + 1);
}

/** First run: the welcome screen asks only for a name, then the questionnaire starts. */
export async function welcome(page: Page, name = 'Dana') {
  await expect(page).toHaveURL(/\/welcome$/, { timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'Welcome to LUPU-FIT' })).toBeVisible();
  await page.getByLabel('What should we call you?').fill(name);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
}

export async function onboardViaUi(page: Page) {
  await expect(page.getByText('Step 1 of 7')).toBeVisible();
  await page.getByLabel('Age').fill('31');
  await page.getByRole('radio', { name: 'Female' }).click();
  await page.getByLabel('Height').fill('165');
  await page.getByLabel('Weight').fill('62');
  await next(page);
  await page.getByText('Beginner', { exact: true }).click();
  await next(page);
  await page.getByText('General fitness', { exact: true }).click();
  await next(page);
  await page.getByText('Home', { exact: true }).click();
  await page.getByRole('button', { name: 'Dumbbells' }).click();
  await next(page);
  await next(page); // preferences & limitations: none
  await page.getByText('Vegetarian', { exact: true }).click();
  await page.getByText('Lightly active', { exact: true }).click();
  await page.getByText('Mostly sitting', { exact: true }).click();
  await next(page);
  await expect(page.getByText('Step 7 of 7')).toBeVisible();
  await page.getByRole('button', { name: 'Finish setup' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Your profile is ready!')).toBeVisible();
}

/** One-tap plan generation; with no active plan yet it is activated right away. */
export async function generatePlan(page: Page) {
  await page.goto('/workouts?tab=generate');
  await page.getByRole('button', { name: 'Generate my plan' }).click();
  await expect(page).toHaveURL(/\/workouts\/plans\/[0-9a-f-]{36}$/, { timeout: 60_000 });
}

/** Quick add from the food log; returns how long it took from the tap to the confirmation (ms). */
export async function quickAdd(page: Page, meal: 'lunch' | 'dinner', mealLabel: 'Lunch' | 'Dinner', name: string, kcal: number): Promise<number> {
  await page.goto(`/nutrition/log?meal=${meal}`);
  await page.getByRole('tab', { name: 'Quick add' }).click();
  await page.getByRole('textbox', { name: 'Description' }).fill(name);
  await page.getByLabel('Calories (kcal)').fill(String(kcal));
  const started = Date.now();
  await page.getByRole('button', { name: `Add to ${mealLabel}` }).click();
  await expect(toast(page, `${name} added to ${mealLabel}`)).toBeVisible();
  return Date.now() - started;
}

/** Settings → "Erase all data on this phone", both confirmations; the app starts over at the welcome. */
export async function eraseAll(page: Page) {
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Erase all data' }).click();
  const first = page.getByRole('dialog', { name: 'Erase all data on this phone?' });
  await expect(first).toBeVisible();
  await first.getByRole('button', { name: 'Continue' }).click();
  const last = page.getByRole('dialog', { name: 'Last check' });
  await expect(last).toBeVisible();
  await last.getByRole('button', { name: 'Erase everything' }).click();
  await expect(page).toHaveURL(/\/welcome$/, { timeout: 60_000 });
  await expect(page.getByLabel('What should we call you?')).toHaveValue('');
}
