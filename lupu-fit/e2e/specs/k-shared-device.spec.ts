import { expect, PASSWORD, test, type Page } from '../fixtures.ts';

/** Waits until the service worker controls the page (same dance as g-offline). */
async function controlled(page: Page): Promise<void> {
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  if (!(await page.evaluate(() => !!navigator.serviceWorker.controller))) await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
}
const status = (page: Page, path: string): Promise<number> => page.evaluate((p) => fetch(p).then((r) => r.status, () => -1), path);

test('shared device: logging out wipes the offline identity copy, even when the logout request itself is lost', async ({ app: page, context, seed, allowConsole }) => {
  allowConsole(/Failed to load resource|net::ERR_|Failed to fetch|NetworkError/); // the offline requests are the point of this test
  await seed();
  await page.goto('/');
  await controlled(page);
  await page.reload();
  await expect(page.locator('.hero-card')).toBeVisible();
  expect(await status(page, '/api/profile')).toBe(200);

  await context.setOffline(true);
  expect(await status(page, '/api/profile')).toBe(200); // offline: served from the last-known copy (that is what the cache is for)
  await page.evaluate(() => fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined)); // the person logs out; the request never reaches the server
  expect(await status(page, '/api/profile')).toBe(503);
  expect(await status(page, '/api/auth/me')).toBe(503);
  await context.setOffline(false);
});

test('shared device: signing in without "keep me signed in" leaves no offline copy of who you are', async ({ app: page, context, seed, allowConsole }) => {
  allowConsole(/Failed to load resource|net::ERR_|Failed to fetch|NetworkError/);
  const { username } = await seed();
  await page.goto('/');
  await controlled(page);
  const login = (remember: boolean) => page.evaluate(async ({ u, p, remember: r }) => (await fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: u, password: p, remember: r }) })).status, { u: username, p: PASSWORD, remember });

  expect(await login(false)).toBe(200);
  expect(await status(page, '/api/auth/me')).toBe(200);
  expect(await status(page, '/api/profile')).toBe(200);
  await context.setOffline(true);
  expect(await status(page, '/api/profile')).toBe(503); // a shared device keeps nothing for the next person to open the app offline
  expect(await status(page, '/api/auth/me')).toBe(503);
  await context.setOffline(false);

  expect(await login(true)).toBe(200); // "keep me signed in" again: the copy comes back
  expect(await status(page, '/api/auth/me')).toBe(200);
  expect(await status(page, '/api/profile')).toBe(200);
  await context.setOffline(true);
  expect(await status(page, '/api/profile')).toBe(200);
  await context.setOffline(false);
});
