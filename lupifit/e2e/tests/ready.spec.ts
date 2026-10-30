import { expect, test, type Page } from '@playwright/test';
import { readyUser, useEnglish } from './helpers';

test.beforeEach(async ({ page }) => {
  await useEnglish(page);
});

const noSidewaysScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

test('ready workouts: home, bodyweight, chest, add a soccer finisher and start it', async ({ page }) => {
  test.setTimeout(120_000);
  await readyUser(page, { trainingLocation: 'home', equipment: [] });
  await page.goto('/workouts?tab=ready');
  await expect(page.getByRole('tab', { name: 'Ready workouts' })).toHaveAttribute('aria-selected', 'true');

  await page.getByRole('radio', { name: 'Home' }).click();
  await expect(page.getByText('What equipment do you have?')).toBeVisible();
  await page.getByRole('radio', { name: 'Bodyweight' }).click();
  await page.getByRole('radio', { name: /^Chest/ }).click();
  await expect(page.locator('.ready-card').first()).toBeVisible();
  // Every card fits the choice: chest, bodyweight, nothing needed.
  for (const card of await page.locator('.ready-card').all()) {
    await expect(card).toContainText('Chest');
    await expect(card).toContainText('Bodyweight');
    await expect(card).toContainText('No equipment');
  }

  await page.locator('.ready-card-link').first().click();
  await expect(page).toHaveURL(/\/workouts\/ready\//);
  await expect(page.getByRole('radiogroup', { name: /Do you train a specific sport\?/ })).toBeVisible();
  await page.getByRole('radio', { name: 'Soccer' }).click();
  await expect(page.getByText('Sport finisher - Soccer')).toBeVisible();
  await expect(page.getByText('This is general physical preparation for the sport, not coaching in the sport.')).toBeVisible();

  await page.getByRole('button', { name: 'Start workout' }).click();
  await expect(page).toHaveURL(/\/workouts\/session/);
  const active = await page.request.get('/api/sessions/active');
  const { session } = (await active.json()) as { session: { exercises: { sport: string | null }[] } };
  const sports = session.exercises.map((e) => e.sport);
  expect(sports.filter((s) => s === 'soccer').length).toBeGreaterThanOrEqual(4);
  // The finisher comes last.
  const first = sports.indexOf('soccer');
  expect(sports.slice(first).every((s) => s === 'soccer')).toBe(true);
  expect(sports.slice(0, first).every((s) => s === null)).toBe(true);
});

test('ready workouts on a phone: park gear, gym note, weights list @mobile', async ({ page }) => {
  test.setTimeout(90_000);
  await readyUser(page, { trainingLocation: 'gym' });
  await page.goto('/workouts?tab=ready');
  await page.getByRole('radio', { name: 'Gym' }).click();
  await expect(page.getByText('At the gym, all machines and weights are assumed.')).toBeVisible();
  await page.getByRole('radio', { name: 'Weights' }).click();
  await expect(page.locator('.ready-card').first()).toBeVisible();
  expect(await noSidewaysScroll(page)).toBe(true);

  await page.getByRole('radio', { name: 'Outdoor / calisthenics park' }).click();
  await expect(page.getByText('What equipment do you have?')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Pull-up bar' }).or(page.getByRole('button', { name: 'Pull-up bar' }))).toBeVisible();
  await page.getByRole('radio', { name: 'Bodyweight' }).click();
  await expect(page.locator('.ready-card').first()).toBeVisible();
  expect(await noSidewaysScroll(page)).toBe(true);
});
