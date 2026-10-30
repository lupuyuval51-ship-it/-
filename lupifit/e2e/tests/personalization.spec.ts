import { expect, test, type Page } from '@playwright/test';
import { readyUser, useEnglish } from './helpers';

test.beforeEach(async ({ page }) => {
  await useEnglish(page);
});

async function csrf(page: Page) {
  const me = await page.request.get('/api/auth/me');
  return ((await me.json()) as { csrfToken: string }).csrfToken;
}

async function generateAndActivatePlan(page: Page) {
  await page.goto('/workouts?tab=generate');
  await page.getByRole('button', { name: 'Generate my plan' }).click();
  await expect(page).toHaveURL(/\/workouts\/plans\/[0-9a-f-]{36}$/, { timeout: 30_000 });
}

/** The user's calendar date and weekday in the browser's (= the account's) time zone. */
async function localToday(page: Page) {
  const date = await page.evaluate(() => new Intl.DateTimeFormat('en-CA').format(new Date()));
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
  return { date, dow };
}

test('a planned rest day is explained, and training anyway is one tap away', async ({ page }) => {
  test.setTimeout(120_000);
  await useEnglish(page);
  await page.goto('/register');
  const { dow } = await localToday(page);
  // English weeks start on Monday: how many days of this week come after today?
  const daysAfterToday = 6 - ((dow + 6) % 7);
  test.skip(daysAfterToday === 0, 'Sunday is the last day of the week: there is no later preferred day to rest for.');

  await readyUser(page, { weeklyWorkoutGoal: 1, preferredDays: [(dow + 1) % 7] });
  await generateAndActivatePlan(page);
  await page.goto('/');
  await expect(page.getByTestId('today-reason')).toContainText('rest day on your preferred schedule');
  await expect(page.getByRole('button', { name: 'Start workout' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Train anyway' }).click();
  await expect(page).toHaveURL(/\/workouts\/session$/);
});

test('a low-energy check-in makes the workout easier, and the full plan can be restored', async ({ page }) => {
  test.setTimeout(120_000);
  await readyUser(page);
  await generateAndActivatePlan(page);
  await page.goto('/');

  // Optional and collapsed: the normal flow is untouched.
  await expect(page.getByRole('radiogroup', { name: 'Energy' })).toBeHidden();
  await page.getByText('How are you feeling today?').click();
  await page.getByRole('radiogroup', { name: 'Energy' }).getByRole('radio', { name: 'Low' }).click();
  await page.getByRole('radiogroup', { name: 'Muscle soreness' }).getByRole('radio', { name: 'High' }).click();
  await page.getByRole('button', { name: 'Start workout' }).click();
  await expect(page).toHaveURL(/\/workouts\/session$/);

  await expect(page.getByText('Adjusted for today from your check-in')).toBeVisible();
  await page.getByRole('button', { name: 'Use the full plan' }).click();
  await expect(page.getByText('Adjusted for today from your check-in')).toBeHidden();
});

test('a stalled weight trend offers a small calorie change that applies only when accepted', async ({ page }) => {
  test.setTimeout(120_000);
  await readyUser(page, { goal: 'fat_loss' });
  const token = await csrf(page);
  const { date } = await localToday(page);
  // Four weeks, a weigh-in every three days, no change at all.
  for (let back = 27; back >= 0; back -= 3) {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - back);
    const res = await page.request.post('/api/progress/body-weight', {
      headers: { 'x-csrf-token': token, 'content-type': 'application/json', 'idempotency-key': `e2e-w-${back}-${Date.now()}` },
      data: { date: d.toISOString().slice(0, 10), weightKg: 80 },
    });
    expect(res.ok(), await res.text()).toBe(true);
  }

  await page.goto('/nutrition');
  const card = page.getByRole('region', { name: 'Calorie check' });
  await expect(card).toBeVisible();
  await expect(card).toContainText('barely moved in 4 weeks');
  const target = await page.request.get('/api/profile').then((r) => r.json());
  const before = target.profile.targets.calories as number;
  // Nothing changed just by showing it.
  expect(before).toBeGreaterThan(1200);

  await card.getByRole('button', { name: /^Apply: / }).click();
  await expect(page.locator('.toasts').getByText('Calorie target updated').first()).toBeVisible();
  await expect(page.getByRole('region', { name: 'Calorie check' })).toHaveCount(0);
  const after = await page.request.get('/api/profile').then((r) => r.json());
  expect(after.profile.targets.calories).toBe(before - 100);
});
