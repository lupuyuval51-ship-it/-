import { expect, test, type Page } from '@playwright/test';
import { readyUser, useEnglish } from './helpers';

/**
 * The gym version: the app installs, its shell works without a connection (service worker),
 * the signed-in user survives an offline reload, and a workout can be logged offline and
 * syncs afterwards. Plus the barbell plate calculator.
 */
test.beforeEach(async ({ page }) => {
  await useEnglish(page);
});

async function startBarbellWorkout(page: Page) {
  await page.goto('/workouts/session');
  await page.getByRole('button', { name: 'Start an empty workout' }).click();
  await expect(page.getByRole('heading', { name: 'Quick workout', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Add exercise' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Add an exercise' });
  await dialog.getByLabel('Search exercises').fill('bench press');
  await dialog.getByRole('button', { name: 'Select: Barbell Bench Press', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Barbell Bench Press', level: 2 })).toBeVisible();
}

test('installable: manifest with PNG icons, apple touch icon and an active service worker', async ({ page }) => {
  await page.goto('/login');
  const manifest = await (await page.request.get('/manifest.webmanifest')).json();
  const sizes = manifest.icons.map((i: { sizes: string; purpose?: string }) => `${i.sizes}:${i.purpose ?? 'any'}`);
  expect(sizes).toEqual(expect.arrayContaining(['192x192:any', '512x512:any', '512x512:maskable']));
  expect(manifest.display).toBe('standalone');
  for (const icon of manifest.icons) expect((await page.request.get(icon.src)).ok(), icon.src).toBe(true);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/apple-touch-icon.png');
  const swHeaders = (await page.request.get('/sw.js')).headers();
  expect(swHeaders['cache-control']).toBe('no-cache');
  await page.evaluate(() => navigator.serviceWorker.ready);
  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    const cache = await caches.open(names.find((n) => n.startsWith('fitai-shell-'))!);
    return (await cache.keys()).length;
  });
  expect(cached).toBeGreaterThan(10);
});

test('offline in the gym: reload offline, log a set, reconnect and it syncs', async ({ page, context }) => {
  test.setTimeout(120_000);
  await readyUser(page);
  await startBarbellWorkout(page);
  await page.evaluate(() => navigator.serviceWorker.ready);

  // Lose the connection, then reload: the shell comes from the service worker and the user
  // and the workout in progress come from the offline caches.
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Barbell Bench Press', level: 2 })).toBeVisible();
  await expect(page).toHaveURL(/\/workouts\/session$/);

  await page.getByLabel('Set 1 weight (kg)').fill('60');
  await page.getByLabel('Set 1 reps').fill('8');
  await page.getByRole('button', { name: 'Complete set 1' }).click();
  await expect(page.getByTestId('set-row-1')).toHaveClass(/set-row-done/);
  await expect(page.getByText('Offline — changes will sync when you reconnect')).toBeVisible();

  await context.setOffline(false);
  await expect(page.getByText('All changes saved')).toBeVisible({ timeout: 30_000 });
  // The set really reached the server.
  await page.reload();
  await expect(page.getByTestId('set-row-1')).toHaveClass(/set-row-done/);
  await expect(page.getByLabel('Set 1 weight (kg)')).toHaveValue('60');
  await expect(page.getByLabel('Set 1 reps')).toHaveValue('8');
});

test('a real sign-out still works after the offline user cache (no stale login)', async ({ page }) => {
  await readyUser(page);
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('fitai.me'))).not.toBeNull();
  await page.getByRole('button', { name: 'Log out' }).first().click();
  await expect(page).toHaveURL(/\/login/);
  expect(await page.evaluate(() => window.localStorage.getItem('fitai.me'))).toBeNull();
});

test('plate calculator: plates per side for a barbell lift', async ({ page }) => {
  await readyUser(page);
  await startBarbellWorkout(page);
  await page.getByRole('button', { name: 'Plate calculator' }).click();
  const dialog = page.getByRole('dialog', { name: 'Plate calculator' });
  await dialog.getByLabel('Target weight (kg)').fill('100');
  await expect(dialog.getByText('25 × 1')).toBeVisible();
  await expect(dialog.getByText('15 × 1')).toBeVisible();
  await expect(dialog.getByText('Total on the bar: 100 kg')).toBeVisible();

  await dialog.getByLabel('Target weight (kg)').fill('21');
  await expect(dialog.getByText('Just the empty bar')).toBeVisible();
  await expect(dialog.getByText(/Closest loadable weight is 20 kg/)).toBeVisible();

  await dialog.getByRole('radio', { name: '15 kg' }).click();
  await dialog.getByLabel('Target weight (kg)').fill('60');
  await expect(dialog.getByText('Total on the bar: 60 kg')).toBeVisible();
});
