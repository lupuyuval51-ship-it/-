/**
 * Device mode smoke test (Pixel 7): the static device build, no app server, no database service.
 * First launch goes straight to onboarding (the hidden device account is created by the app itself),
 * the data survives a reload and a full browser restart (same profile directory = same IndexedDB), and a
 * second tab does not open a second copy of the database.
 */
import { chromium, expect, test, type BrowserContext, type Page, type TestInfo } from '@playwright/test';

const next = (page: Page) => page.getByRole('button', { name: 'Next' }).click();
const toast = (page: Page, text: string) => page.locator('.toasts').getByText(text).first();

/** A persistent browser profile: closing and launching it again is an app restart with the same storage. */
async function launch(testInfo: TestInfo): Promise<BrowserContext> {
  const use = testInfo.project.use;
  const context = await chromium.launchPersistentContext(testInfo.outputPath('profile'), {
    viewport: use.viewport,
    userAgent: use.userAgent,
    deviceScaleFactor: use.deviceScaleFactor,
    isMobile: use.isMobile,
    hasTouch: use.hasTouch,
    locale: 'en-US',
    timezoneId: 'Asia/Jerusalem',
    baseURL: use.baseURL,
  });
  await context.addInitScript(() => {
    try {
      window.localStorage.setItem('fitai.locale', JSON.stringify('en'));
    } catch {
      /* ignore */
    }
  });
  return context;
}

/** Fails the test on errors that mean the device runtime is broken (CSP blocks, uncaught errors). */
function watch(page: Page, problems: string[]) {
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error' && /Content Security Policy|\[device\]/.test(msg.text())) problems.push(`console: ${msg.text()}`);
  });
}

/** Time from navigation to "device ready" (ms), and the worker's own start-up time. */
async function bootTiming(page: Page) {
  await page.waitForFunction(() => performance.getEntriesByName('lupufit:device-ready').length > 0, undefined, { timeout: 60_000 });
  return page.evaluate(() => {
    const mark = performance.getEntriesByName('lupufit:device-ready')[0] as PerformanceMark;
    const detail = mark.detail as { workerBootMs: number; steps: Record<string, number> };
    return { readyMs: Math.round(mark.startTime), workerBootMs: detail.workerBootMs, steps: detail.steps };
  });
}

async function onboardViaUi(page: Page) {
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

async function generatePlan(page: Page) {
  await page.goto('/workouts');
  await page.getByRole('button', { name: 'Generate your first plan' }).click();
  await page.getByRole('button', { name: 'Customize' }).click();
  await page.getByRole('radio', { name: '3' }).click();
  await page.getByLabel('Plan name (optional)').fill('Device plan');
  await page.getByRole('button', { name: 'Generate plan' }).click();
  await expect(page).toHaveURL(/\/workouts\/plans\/[0-9a-f-]{36}$/, { timeout: 60_000 });
  await expect(page.getByRole('heading', { level: 1, name: 'Device plan' })).toBeVisible();
}

/** Quick add from the food log; returns how long it took from the tap to the confirmation (ms). */
async function quickAdd(page: Page, meal: 'lunch' | 'dinner', mealLabel: 'Lunch' | 'Dinner', name: string, kcal: number): Promise<number> {
  await page.goto(`/nutrition/log?meal=${meal}`);
  await page.getByRole('tab', { name: 'Quick add' }).click();
  await page.getByRole('textbox', { name: 'Description' }).fill(name);
  await page.getByLabel('Calories (kcal)').fill(String(kcal));
  const started = Date.now();
  await page.getByRole('button', { name: `Add to ${mealLabel}` }).click();
  await expect(toast(page, `${name} added to ${mealLabel}`)).toBeVisible();
  return Date.now() - started;
}

async function expectDataKept(page: Page) {
  await page.goto('/nutrition');
  await expect(page.getByRole('list', { name: 'Lunch' }).getByText('Device snack')).toBeVisible();
  await page.goto('/workouts');
  await expect(page.getByText('Device plan').first()).toBeVisible();
}

test('works with no server: first launch, onboarding, plan, food; data survives reload and restart; one tab at a time', async ({ browserName }, testInfo) => {
  expect(browserName).toBe('chromium');
  const problems: string[] = [];
  const timings: Record<string, unknown> = {};

  // ---- First launch: no login or register screen, straight to onboarding.
  let context = await launch(testInfo);
  let page = context.pages()[0] ?? (await context.newPage());
  watch(page, problems);
  await page.goto('/');
  await expect(page).toHaveURL(/\/onboarding$/, { timeout: 60_000 });
  timings.coldBoot = await bootTiming(page);
  await expect(page.getByRole('link', { name: 'Log in' })).toHaveCount(0);
  await page.goto('/login');
  await expect(page).toHaveURL(/\/onboarding$/); // device mode has no login page

  await onboardViaUi(page);
  let started = Date.now();
  await generatePlan(page);
  timings.generatePlanMs = Date.now() - started;
  timings.quickAddMs = await quickAdd(page, 'lunch', 'Lunch', 'Device snack', 250);
  // Chrome splits the usage: IndexedDB (the database) and Cache Storage (the service worker's app files).
  timings.storageMB = await page.evaluate(async () => {
    const est = (await navigator.storage.estimate()) as StorageEstimate & { usageDetails?: Record<string, number> };
    const mb = (n: number | undefined) => Math.round((n ?? 0) / 1e5) / 10;
    return { total: mb(est.usage), indexedDB: mb(est.usageDetails?.indexedDB), caches: mb(est.usageDetails?.caches) };
  });

  // ---- Reload: same data (IndexedDB), same device account.
  await page.reload();
  timings.reload = await bootTiming(page);
  await expectDataKept(page);

  // ---- Airplane mode: the app (served by its service worker) still starts, and saving goes straight to
  // the database on the phone (not to the offline queue: the toast is the normal one).
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.reload();
  await bootTiming(page);
  await quickAdd(page, 'dinner', 'Dinner', 'Offline soup', 180);
  await page.goto('/nutrition');
  await expect(page.getByRole('list', { name: 'Dinner' }).getByText('Offline soup')).toBeVisible();
  await expect(page.getByText('You are offline. Changes will be saved when the connection returns.')).toHaveCount(0);
  await context.setOffline(false);

  // ---- A second tab must not open a second copy of the database; it continues once the first closes.
  const second = await context.newPage();
  watch(second, problems);
  await second.goto('/');
  await expect(second.getByRole('heading', { name: 'LUPU-FIT is open in another tab' })).toBeVisible();
  await page.close();
  await expect(second.getByRole('heading', { name: 'LUPU-FIT is open in another tab' })).toBeHidden();
  await expect(second).toHaveURL(/\/$/);
  await expectDataKept(second);

  // ---- Restart: save something and close the browser as soon as the app confirms it (the confirmation
  // comes only once it is stored), then launch it again with the same profile.
  await quickAdd(second, 'dinner', 'Dinner', 'Last-second tea', 5);
  await context.close();
  context = await launch(testInfo);
  page = context.pages()[0] ?? (await context.newPage());
  watch(page, problems);
  started = Date.now();
  await page.goto('/');
  timings.restart = await bootTiming(page);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Device plan').first()).toBeVisible();
  timings.restartToDashboardMs = Date.now() - started;
  await expectDataKept(page);
  await page.goto('/nutrition');
  await expect(page.getByRole('list', { name: 'Dinner' }).getByText('Last-second tea')).toBeVisible();
  await context.close();

  await testInfo.attach('device-boot-timings.json', { body: JSON.stringify(timings, null, 2), contentType: 'application/json' });
  console.log('device boot timings (ms):', JSON.stringify(timings));
  expect(problems).toEqual([]);
});

test('deleting the account removes the data and starts over with a fresh device account', async ({ browserName }, testInfo) => {
  expect(browserName).toBe('chromium');
  const problems: string[] = [];
  const context = await launch(testInfo);
  const page = context.pages()[0] ?? (await context.newPage());
  watch(page, problems);
  await page.goto('/');
  await expect(page).toHaveURL(/\/onboarding$/, { timeout: 60_000 });
  await onboardViaUi(page);
  await quickAdd(page, 'lunch', 'Lunch', 'Soon deleted', 120);

  await page.goto('/profile');
  await page.getByRole('button', { name: 'Delete my account' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Delete your account?' })).toBeVisible();
  // The device account has no password anyone knows: whatever is typed here, the app adds its own.
  const password = dialog.getByRole('textbox', { name: 'Password', exact: true });
  if (await password.count()) await password.fill('anything1');
  await dialog.getByLabel('Type DELETE to confirm').fill('DELETE');
  await dialog.getByRole('button', { name: 'Delete permanently' }).click();
  await expect(page.getByText('Your account and data were deleted.')).toBeVisible();
  await expect(page).toHaveURL(/\/onboarding$/); // a new, empty device account; never a login screen

  await onboardViaUi(page);
  await page.goto('/nutrition');
  await expect(page.getByText('Soon deleted')).toHaveCount(0);
  await context.close();
  expect(problems).toEqual([]);
});
