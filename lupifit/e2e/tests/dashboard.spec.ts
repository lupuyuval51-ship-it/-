import { expect, test, type Page } from '@playwright/test';
import { readyUser, useEnglish } from './helpers';

test.beforeEach(async ({ page }) => {
  await useEnglish(page);
});

async function csrf(page: Page) {
  const me = await page.request.get('/api/auth/me');
  return ((await me.json()) as { csrfToken: string }).csrfToken;
}

function shift(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

test('new user dashboard shows honest empty states and CTAs', async ({ page }) => {
  await readyUser(page);
  await expect(page.getByRole('heading', { level: 1, name: /E2E Tester/ })).toBeVisible();
  await expect(page.getByText('No active workout plan')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Generate a plan' })).toHaveAttribute('href', '/workouts?tab=generate');
  await expect(page.getByText('Nothing logged yet today.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Log food' })).toHaveAttribute('href', '/nutrition/log');
  await expect(page.getByText('0 of 4 workouts')).toBeVisible();
  await expect(page.getByText('4 more workouts to reach your goal')).toBeVisible();
  await expect(page.getByText('Level 1')).toBeVisible();
  await expect(page.getByText(/Not enough data yet/)).toBeVisible();
  await expect(page.getByText(/Finish workouts and beat your previous bests/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ask the coach' })).toHaveAttribute('href', '/coach');
  await expect(page.getByRole('link', { name: 'Exercise library' })).toHaveAttribute('href', '/exercises');
});

test('log body weight from the dashboard and see it on the progress page @mobile', async ({ page }) => {
  await readyUser(page);
  await page.getByRole('button', { name: 'Log body weight' }).click();
  const dialog = page.getByRole('dialog', { name: 'Log weight' });
  await dialog.getByRole('button', { name: 'Save weight' }).click();
  await expect(dialog.getByText('Required')).toBeVisible();
  await dialog.getByRole('textbox', { name: 'Weight', exact: true }).fill('12');
  await dialog.getByRole('button', { name: 'Save weight' }).click();
  await expect(dialog.getByText('Enter a weight between 30 kg and 300 kg.')).toBeVisible();
  await dialog.getByRole('textbox', { name: 'Weight', exact: true }).fill('82.5');
  await dialog.getByRole('button', { name: 'Save weight' }).click();
  // Onboarding already recorded this week's weigh-in (and its XP), so this one earns no extra XP (weekly cap).
  await expect(page.getByText(/^Weight saved/)).toBeVisible();
  await expect(page.getByText('Weight saved · +5 XP')).toHaveCount(0);
  await expect(dialog).toBeHidden();

  await page.goto('/progress');
  const card = page.getByRole('region', { name: 'Body weight' });
  await expect(card.getByRole('img', { name: 'Body weight (kg)' })).toBeVisible();
  await expect(card.getByRole('listitem').filter({ hasText: '82.5 kg' })).toBeVisible();
  // The latest weigh-in is now the profile weight.
  const profile = await (await page.request.get('/api/profile')).json();
  expect(profile.profile.weightKg).toBe(82.5);
});

test('notifications: empty state, a milestone from weigh-ins, mark all as read', async ({ page }) => {
  await readyUser(page);
  await page.goto('/notifications');
  await expect(page.getByText("You're all caught up")).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mark all as read' })).toBeDisabled();

  // Weigh-ins in 4 different weeks unlock the "Weigh-in habit" achievement.
  const { today } = await (await page.request.get('/api/dashboard')).json();
  const token = await csrf(page);
  for (const offset of [-21, -14, -7, 0]) {
    const res = await page.request.post('/api/progress/body-weight', {
      headers: { 'x-csrf-token': token },
      data: { date: shift(today, offset), weightKg: 80 + offset / 7 },
    });
    expect(res.ok()).toBe(true);
  }
  await page.reload();
  await expect(page.getByRole('link', { name: 'Notifications, 1 unread' })).toBeVisible();
  await expect(page.getByText('Achievement unlocked: Weigh-in habit')).toBeVisible();
  await expect(page.getByText('1 unread')).toBeVisible();
  await page.getByRole('button', { name: 'Mark all as read' }).click();
  await expect(page.getByText('All notifications marked as read')).toBeVisible();
  await expect(page.getByText('No unread notifications')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Notifications', exact: true })).toBeVisible();

  // Delete with confirmation → empty again.
  await page.getByRole('button', { name: 'Delete notification' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText("You're all caught up")).toBeVisible();
});
