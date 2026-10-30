import { expect, test } from '@playwright/test';
import { readyUser, useEnglish } from './helpers';

test('workout settings changed on one device follow the account to another', async ({ page, browser }) => {
  test.setTimeout(120_000);
  await useEnglish(page);
  const { email, password } = await readyUser(page);

  await page.goto('/profile');
  const section = page.locator('#settings-workout');
  await expect(section).toBeVisible();
  await section.getByRole('switch', { name: 'Vibrate when rest ends' }).click();
  await section.getByRole('switch', { name: 'Sound when rest ends' }).click();

  // Saved to the account in the background (no extra button).
  await expect
    .poll(async () => (await (await page.request.get('/api/auth/me')).json()).user.workoutPrefs, { timeout: 15_000 })
    .toMatchObject({ vibrate: false, restSound: false, autoAdvance: true });

  // A second device (fresh browser storage) signs in and finds the same switches.
  const other = await browser.newContext({ locale: 'en-US', timezoneId: 'Asia/Jerusalem' });
  const second = await other.newPage();
  await useEnglish(second);
  await second.goto('/login');
  await second.getByLabel('Email').fill(email);
  await second.locator('input[name="password"]').fill(password);
  await second.getByRole('button', { name: 'Log in' }).click();
  await expect(second).toHaveURL(/\/$/);
  await second.goto('/profile');
  const section2 = second.locator('#settings-workout');
  await expect(section2.getByRole('switch', { name: 'Vibrate when rest ends' })).toHaveAttribute('aria-checked', 'false');
  await expect(section2.getByRole('switch', { name: 'Sound when rest ends' })).toHaveAttribute('aria-checked', 'false');
  await expect(section2.getByRole('switch', { name: 'Keep the screen on' })).toHaveAttribute('aria-checked', 'true');
  await other.close();
});
