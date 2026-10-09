import { expect, test, type Page } from '@playwright/test';
import pg from 'pg';
import { readyUser, useEnglish } from './helpers';

const DATABASE_URL = process.env.E2E_DATABASE_URL ?? 'postgres://fitai:fitai_dev_password@127.0.0.1:5432/fitai_e2e';

function shift(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Seeds completed bench-press sessions directly (the sessions API belongs to another module). */
async function seedBenchSessions(page: Page, sessions: { daysAgo: number; kg: number }[]) {
  const me = await (await page.request.get('/api/auth/me')).json();
  const { today } = await (await page.request.get('/api/dashboard')).json();
  const db = new pg.Client({ connectionString: DATABASE_URL });
  await db.connect();
  try {
    for (const s of sessions) {
      const ended = new Date(`${shift(today, -s.daysAgo)}T09:00:00Z`);
      const started = new Date(ended.getTime() - 45 * 60_000);
      const { rows } = await db.query(
        `INSERT INTO workout_sessions (user_id, name, status, started_at, ended_at, duration_seconds) VALUES ($1, 'Push day', 'completed', $2, $3, 2700) RETURNING id`,
        [me.user.id, started, ended],
      );
      const se = await db.query(`INSERT INTO session_exercises (session_id, user_id, exercise_id, position) VALUES ($1, $2, 'barbell_bench_press', 0) RETURNING id`, [rows[0].id, me.user.id]);
      for (let n = 1; n <= 3; n++) {
        await db.query(
          `INSERT INTO session_sets (session_exercise_id, session_id, user_id, set_number, reps, weight_kg, completed, completed_at) VALUES ($1, $2, $3, $4, 5, $5, true, $6)`,
          [se.rows[0].id, rows[0].id, me.user.id, n, s.kg, ended],
        );
      }
    }
  } finally {
    await db.end();
  }
}

test.beforeEach(async ({ page }) => {
  await useEnglish(page);
});

test('new user: period switch, honest empty states and the achievements grid', async ({ page }) => {
  await readyUser(page);
  await page.goto('/progress');
  await expect(page.getByRole('heading', { level: 1, name: 'Progress' })).toBeVisible();
  const periods = page.getByRole('radiogroup', { name: 'Period' });
  await expect(periods.getByRole('radio', { name: '30 days' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByText('Previous 30 days: 0').first()).toBeVisible();

  await periods.getByRole('radio', { name: '7 days' }).click();
  await expect(page).toHaveURL(/period=7/);
  await expect(periods.getByRole('radio', { name: '7 days' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByText('Previous 7 days: 0').first()).toBeVisible();
  await periods.getByRole('radio', { name: '90 days' }).click();
  await expect(page).toHaveURL(/period=90/);
  await expect(page.getByText('Previous 90 days: 0').first()).toBeVisible();

  await expect(page.getByText('No workouts in this period yet.')).toBeVisible();
  await expect(page.getByText('Complete sets to see how your training is distributed.')).toBeVisible();
  await expect(page.getByText('Complete workouts to track your strength progression.')).toBeVisible();
  await expect(page.getByText('No meals logged in this period.')).toBeVisible();
  await expect(page.getByText(/Not enough data yet/)).toBeVisible();

  const achievements = page.getByRole('region', { name: 'Achievements' });
  await expect(achievements.getByText('0 of 14 unlocked')).toBeVisible();
  await expect(achievements.locator('.achievement')).toHaveCount(14);
  await expect(achievements.getByText('First workout', { exact: true })).toBeVisible();
  await expect(achievements.getByText('Level 1')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open workout history' })).toHaveAttribute('href', '/workouts/history');
});

test('log and delete body weight entries on the progress page', async ({ page }) => {
  await readyUser(page);
  await page.goto('/progress');
  const card = page.getByRole('region', { name: 'Body weight' });
  // Onboarding recorded today's weight.
  await expect(card.getByRole('listitem').filter({ hasText: '80 kg' })).toBeVisible();

  const { today } = await (await page.request.get('/api/dashboard')).json();
  await card.getByLabel('Date').fill(shift(today, -3));
  await card.getByRole('textbox', { name: 'Weight', exact: true }).fill('81.2');
  await card.getByLabel('Note (optional)').fill('after vacation');
  await card.getByRole('button', { name: 'Save weight' }).click();
  await expect(page.getByText(/Weight saved/)).toBeVisible();
  const entry = card.getByRole('listitem').filter({ hasText: '81.2 kg' });
  await expect(entry).toContainText('after vacation');
  await expect(card.getByText('2 entries')).toBeVisible();
  await expect(card.getByText('-1.2 kg')).toBeVisible();

  await entry.getByRole('button', { name: /Delete entry/ }).click();
  const confirm = page.getByRole('dialog', { name: 'Delete this weigh-in?' });
  await expect(confirm).toContainText('81.2 kg');
  await confirm.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('Entry deleted')).toBeVisible();
  await expect(card.getByRole('listitem').filter({ hasText: '81.2 kg' })).toHaveCount(0);
  await expect(card.getByText('1 entry')).toBeVisible();
});

test('recorded workouts drive the summary, muscle groups, strength chart and insights', async ({ page }) => {
  await readyUser(page);
  await seedBenchSessions(page, [
    { daysAgo: 12, kg: 60 },
    { daysAgo: 6, kg: 62.5 },
    { daysAgo: 1, kg: 65 },
  ]);
  await page.goto('/progress?period=30');
  const summary = page.getByRole('region', { name: 'Summary' });
  await expect(summary.getByText('Workouts', { exact: true })).toBeVisible();
  await expect(summary.locator('.stat').filter({ hasText: 'Total volume' })).toContainText('2,812.5 kg');
  await expect(summary.locator('.stat').filter({ hasText: 'Completed sets' })).toContainText('9');

  await expect(page.getByRole('region', { name: 'Sets per muscle group' }).getByText('9 sets')).toBeVisible();
  await expect(page.getByText('Your estimated 1RM on Barbell Bench Press went from 70 kg to 75.8 kg (+8.3%).')).toBeVisible();

  const strength = page.getByRole('region', { name: 'Strength progression' });
  await expect(strength.getByLabel('Exercise')).toContainText('Barbell Bench Press');
  await expect(strength.getByRole('img', { name: /Est\. 1RM: Barbell Bench Press/ })).toBeVisible();
  await strength.getByRole('radio', { name: 'Heaviest set' }).click();
  await expect(strength.getByRole('img', { name: /Heaviest set: Barbell Bench Press/ })).toBeVisible();
  await expect(strength.getByText('No personal records for this exercise yet.')).toBeVisible();
});

test('Hebrew renders right-to-left with translated sections', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => window.localStorage.setItem('fitai.locale', JSON.stringify('en')));
  await readyUser(page);
  await page.goto('/progress');
  // The UI language follows the account preference (English at registration) until switched.
  await page.getByRole('button', { name: 'Language' }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', { level: 1, name: 'התקדמות' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'משקל גוף' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'הישגים' })).toBeVisible();
  await context.close();
});
