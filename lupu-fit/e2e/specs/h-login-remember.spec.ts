import { expect, test, PASSWORD, uniqueName } from '../fixtures.ts';

async function signIn(page: import('@playwright/test').Page, username: string, remember: boolean, label: string): Promise<void> {
  await page.goto('/login');
  await page.locator('input[autocomplete="username"]').fill(username);
  await page.locator('input[autocomplete="current-password"]').fill(PASSWORD);
  const toggle = page.getByRole('switch', { name: label });
  await expect(toggle).toBeChecked(); // "keep me signed in" defaults to on
  if (!remember) await toggle.uncheck();
  await page.locator('form button[type="submit"]').click();
  await expect(page).not.toHaveURL(/\/login/);
}

test('login: "keep me signed in" off -> session cookie (no expiry); on -> persistent cookie', async ({ app: page, context, seed, t, allowConsole }) => {
  allowConsole(/status of 401 \(Unauthorized\) @ \S+\/api\//); // the test drops the cookie under a live page
  const { username } = await seed();
  const label = t('auth.login.remember');
  const session = async () => (await context.cookies()).find((c) => c.name === 'lf_session');

  await context.clearCookies();
  await signIn(page, username, false, label);
  const off = await session();
  expect(off, 'lf_session cookie after login').toBeTruthy();
  expect(off?.expires).toBe(-1); // session cookie: dies with the browser
  expect(off?.httpOnly).toBe(true);
  await expect(page.locator('.hero-card')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('lf_username'))).toBeNull();

  await context.clearCookies();
  await signIn(page, username, true, label);
  const on = await session();
  expect(on?.expires ?? -1).toBeGreaterThan(Date.now() / 1000 + 7 * 86400);
  expect(await page.evaluate(() => localStorage.getItem('lf_username'))).toBe(username);
});

test('register: "keep me signed in" off -> session cookie (no expiry) and no remembered username', async ({ app: page, context, t }) => {
  const username = uniqueName('reg');
  await page.goto('/register');
  await page.locator('input[autocomplete="username"]').fill(username);
  await page.locator('input[autocomplete="new-password"]').fill(PASSWORD);
  const toggle = page.getByRole('switch', { name: t('auth.login.remember') });
  await expect(toggle).toBeChecked(); // same default as sign-in
  await toggle.uncheck();
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/\/welcome/);
  const cookie = (await context.cookies()).find((c) => c.name === 'lf_session');
  expect(cookie, 'lf_session cookie after register').toBeTruthy();
  expect(cookie?.expires).toBe(-1); // dies with the browser, as the server promises for remember=false
  expect(await page.evaluate(() => localStorage.getItem('lf_username'))).toBeNull();
});
