/**
 * Device mode smoke test (Pixel 7): the static device build, no app server, no database service.
 * First launch goes straight to the welcome and onboarding (the hidden device account is created by the app itself),
 * the data survives a reload and a full browser restart (same profile directory = same IndexedDB), and a
 * second tab does not open a second copy of the database.
 */
import { expect, test } from '@playwright/test';
import { bootTiming, eraseAll, firstPage, launch, onboardViaUi, quickAdd, watch, welcome } from './helpers';
import type { Page } from '@playwright/test';

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
  let page = await firstPage(context);
  watch(page, problems);
  await page.goto('/');
  await expect(page).toHaveURL(/\/welcome$/, { timeout: 60_000 });
  timings.coldBoot = await bootTiming(page);
  await expect(page.getByRole('link', { name: 'Log in' })).toHaveCount(0);
  await page.goto('/login');
  await expect(page).toHaveURL(/\/welcome$/); // device mode has no login page

  await welcome(page);
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
  page = await firstPage(context);
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

test('"Erase all data on this phone" removes everything and starts over like a new install', async ({ browserName }, testInfo) => {
  expect(browserName).toBe('chromium');
  const problems: string[] = [];
  const context = await launch(testInfo);
  const page = await firstPage(context);
  watch(page, problems);
  await page.goto('/');
  await welcome(page);
  await onboardViaUi(page);
  await quickAdd(page, 'lunch', 'Lunch', 'Soon erased', 120);
  const before = await page.evaluate(async () => (await indexedDB.databases()).map((d) => d.name));
  expect(before).toEqual(['/pglite/lupufit-device']);
  const me = () => page.evaluate(() => (JSON.parse(localStorage.getItem('fitai.me') ?? 'null') as { id: string } | null)?.id);
  const oldUser = await me();
  expect(oldUser).toBeTruthy();

  await eraseAll(page); // a fresh welcome: never a login screen
  // The app's own local data went too: what is there now belongs to the new install (language from the
  // test's start-up script, the new device account and its theme).
  const keys = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('fitai.')).sort());
  expect(keys.filter((k) => !['fitai.locale', 'fitai.me', 'fitai.theme'].includes(k))).toEqual([]);
  expect(await me()).not.toBe(oldUser);

  await welcome(page, 'Noa');
  await onboardViaUi(page);
  await page.goto('/nutrition');
  await expect(page.getByText('Soon erased')).toHaveCount(0);
  await context.close();
  expect(problems).toEqual([]);
});
