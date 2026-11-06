import { contains, exact } from '../copy.ts';
import { expect, onboard, test } from './fixtures.ts';

test('ready workout wizard -> live session -> log sets -> finish -> summary -> history, with the network down', async ({ app: page, t }) => {
  await onboard(page);
  await page.goto('/workouts?tab=ready');
  await page.getByRole('button', { name: exact(t('label.place.home')) }).click();
  await page.getByRole('button', { name: exact(t('label.equipment.none')) }).click();
  await page.getByRole('button', { name: exact(t('label.mode.bodyweight')) }).click();
  await page.getByRole('button', { name: contains(t('label.focus.chest')) }).first().click();
  await expect(page.locator('.wk-sum-count .num')).not.toHaveText('0');

  const firstCard = page.locator('a.wk-card').first();
  await expect(firstCard).toBeVisible();
  const workoutName = (await firstCard.locator('h3').innerText()).trim();
  await firstCard.click();
  await expect(page).toHaveURL(/\/workouts\/ready\//);
  await page.getByRole('button', { name: exact(t('workouts.detail.start')) }).click();
  await expect(page).toHaveURL(/\/workouts\/session$/);

  // The phone is in airplane mode from here on (what the WebView reports): nothing in the workout may depend on it.
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false });
    window.dispatchEvent(new Event('offline'));
  });
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: exact(t('live.set.finish')) }).first().click();
    const skip = page.getByRole('button', { name: exact(t('live.rest.skip')) });
    if (await skip.isVisible({ timeout: 2_000 }).catch(() => false)) await skip.click();
  }
  // Nothing says "offline" or "sync" on this screen: the data is already where it belongs.
  await expect(page.getByTestId('offline-banner')).toHaveCount(0);
  await expect(page.getByText(t('live.offline.banner'))).toHaveCount(0);
  await expect(page.getByText(t('app.offline'))).toHaveCount(0);

  await page.getByRole('button', { name: exact(t('live.more.title')) }).click();
  page.once('dialog', (d) => { void d.accept(); });
  await page.getByRole('dialog').getByRole('button', { name: exact(t('live.finishWorkout')) }).click();

  await expect(page).toHaveURL(/\/workouts\/sessions\/[^/]+$/);
  await expect(page.locator('.wk-xp')).toBeVisible();
  const xp = Number(/\d+/.exec(await page.locator('.wk-xp .sr-only').innerText())?.[0]);
  expect(xp).toBeGreaterThan(0);

  await page.goto('/workouts/history');
  const week = page.getByRole('region', { name: t('workouts.history.thisWeek') });
  await expect(week.getByRole('link', { name: contains(workoutName) })).toBeVisible();
  const stats = week.locator('.wk-week-stats > span');
  await expect(stats.nth(0).locator('.num')).toHaveText('1');
  await expect(stats.nth(1).locator('.num')).toHaveText('2');
  await expect(stats.last().locator('.num')).toHaveText(String(xp));
});
