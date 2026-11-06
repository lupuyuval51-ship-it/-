import { expect, onboard, test } from './fixtures.ts';

test('first launch boots PGlite, provisions the device account and goes welcome -> onboarding -> home without any login UI', async ({ app: page, t }) => {
  const seen: string[] = [];
  page.on('framenavigated', (f) => { if (f === page.mainFrame()) seen.push(new URL(f.url()).pathname); });
  const files: { path: string; status: number }[] = [];
  page.on('response', (r) => { const u = new URL(r.url()); if (/^\/(fonts|icons)\//.test(u.pathname) || u.pathname.endsWith('.webmanifest')) files.push({ path: u.pathname, status: r.status() }); });
  await page.goto('/');
  await expect(page.getByText(t('welcome.deviceData'))).toBeVisible(); // says where the data lives, before anything is asked
  await onboard(page);
  // No login / registration screen at any point, and no such field in the DOM.
  expect(seen.filter((p) => p === '/login' || p === '/register')).toEqual([]);
  await expect(page.locator('input[type="password"], input[autocomplete="username"], input[autocomplete="new-password"]')).toHaveCount(0);
  await expect(page.locator('a[href="/login"], a[href="/register"]')).toHaveCount(0);
  // Fonts, icons and the manifest are packaged files served from the app's own origin (no web fonts, no CDN).
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  expect(await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').length)).toBeGreaterThan(0);
  expect(files.some((f) => f.path.startsWith('/fonts/') && f.status === 200)).toBe(true);
  expect(files.some((f) => f.path.startsWith('/icons/') && f.status === 200)).toBe(true);
  expect(files.filter((f) => f.status >= 400)).toEqual([]);
});
