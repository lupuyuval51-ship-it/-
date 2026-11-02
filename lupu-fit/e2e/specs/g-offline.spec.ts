import { expect, test } from '../fixtures.ts';

test('offline: after one online visit the app shell and the profile-based home still render', async ({ app: page, context, seed, t, allowConsole }) => {
  // While offline the browser logs every failed fetch/navigation; those are the point of this test.
  allowConsole(/Failed to load resource|net::ERR_INTERNET_DISCONNECTED|Failed to fetch|NetworkError/);
  await seed();
  await page.goto('/');
  await expect(page.locator('.hero-card')).toBeVisible();

  // The service worker must be installed AND controlling this page before we cut the network.
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  if (!(await page.evaluate(() => !!navigator.serviceWorker.controller))) await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  // Home must have been fetched once with the SW in control so the identity/profile copies exist.
  await page.reload();
  await expect(page.locator('.hero-card')).toBeVisible();

  await context.setOffline(true);
  // Sanity check that the network really is gone for non-cached API traffic (otherwise this test would prove nothing).
  expect(await page.evaluate(() => fetch('/api/health').then(() => 'online', () => 'offline'))).toBe('offline');

  await page.reload();
  await expect(page.locator('main#main')).toBeVisible();
  await expect(page.locator('.hero-card')).toBeVisible(); // profile-based home from the identity cache
  await expect(page.locator('.offline-strip')).toHaveText(t('app.offline'));
  await expect(page).toHaveURL(/\/$/);
  await context.setOffline(false);
});
