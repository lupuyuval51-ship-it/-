import { contains, exact } from '../copy.ts';
import { expect, test } from '../fixtures.ts';

test('ready workouts wizard -> start -> log sets -> finish -> summary XP -> history', async ({ app: page, seed, t }) => {
  await seed();
  await page.goto('/workouts?tab=ready');

  // Wizard: home -> no equipment -> bodyweight -> chest.
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
  await expect(page.getByRole('heading', { level: 1 })).toContainText(workoutName);

  await page.getByRole('button', { name: exact(t('workouts.detail.start')) }).click();
  await expect(page).toHaveURL(/\/workouts\/session$/);

  // Log two sets. After a set the rest takeover may appear; skip it to continue.
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: exact(t('live.set.finish')) }).first().click();
    const skip = page.getByRole('button', { name: exact(t('live.rest.skip')) });
    if (await skip.isVisible({ timeout: 2_000 }).catch(() => false)) await skip.click();
  }
  // Sets remain, so "Finish workout" sits in the "More" sheet (not next to "Finish set") and asks before ending early.
  await expect(page.getByRole('button', { name: exact(t('live.finishWorkout')) })).toHaveCount(0);
  await page.getByRole('button', { name: exact(t('live.more.title')) }).click();
  let asked = '';
  page.once('dialog', (d) => { asked = d.type(); void d.accept(); });
  await page.getByRole('dialog').getByRole('button', { name: exact(t('live.finishWorkout')) }).click();
  await expect.poll(() => asked).toBe('confirm');

  await expect(page).toHaveURL(/\/workouts\/sessions\/[^/]+$/);
  await expect(page.locator('.wk-xp')).toBeVisible();
  // The visible number counts up; the screen-reader text carries the final server-computed total.
  const xp = Number(/\d+/.exec(await page.locator('.wk-xp .sr-only').innerText())?.[0]);
  expect(xp).toBeGreaterThan(0);
  await expect(page.locator('.wk-xp .num-hero')).toHaveText(`+${xp}`);

  await page.goto('/workouts/history');
  await expect(page.getByRole('region', { name: t('workouts.history.thisWeek') })).toBeVisible();
  const week = page.getByRole('region', { name: t('workouts.history.thisWeek') });
  await expect(week.getByRole('link', { name: contains(workoutName) })).toBeVisible();
  // Week summary: one workout, two sets, and the same XP the summary screen showed.
  const stats = week.locator('.wk-week-stats > span');
  await expect(stats.nth(0).locator('.num')).toHaveText('1');
  await expect(stats.nth(1).locator('.num')).toHaveText('2');
  await expect(stats.last().locator('.num')).toHaveText(String(xp));
});
