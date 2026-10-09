import { expect, test, type Page } from '@playwright/test';
import { readyUser, useEnglish } from './helpers';

test.beforeEach(async ({ page }) => {
  await useEnglish(page);
});

async function addExercise(page: Page, search: string, name: string) {
  await page.getByRole('button', { name: 'Add exercise' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Add an exercise' });
  await dialog.getByLabel('Search exercises').fill(search);
  await dialog.getByRole('button', { name: `Select: ${name}`, exact: true }).click();
  await expect(page.getByRole('heading', { name, level: 2 })).toBeVisible();
}

async function waitForSaved(page: Page) {
  await expect(page.getByText('All changes saved')).toBeVisible();
}

const clockSeconds = (text: string | null) => {
  const [m, s] = (text ?? '0:00').trim().split(':').map(Number);
  return (m ?? 0) * 60 + (s ?? 0);
};

async function startEmptyWorkout(page: Page) {
  await page.goto('/workouts/session');
  await expect(page.getByText('No workout in progress')).toBeVisible();
  await page.getByRole('button', { name: 'Start an empty workout' }).click();
  await expect(page.getByRole('heading', { name: 'Quick workout', level: 1 })).toBeVisible();
}

async function finishWorkout(page: Page) {
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Finish workout?' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Finish workout' }).click();
  await expect(page).toHaveURL(/\/workouts\/sessions\/[0-9a-f-]{36}$/);
  await expect(page.getByRole('heading', { name: 'Workout complete' })).toBeVisible();
}

test('live workout: sets, rest timer, reload recovery, pause, header pill, finish, history and PRs', async ({ page }) => {
  test.setTimeout(120_000);
  await readyUser(page);
  await startEmptyWorkout(page);
  await expect(page.getByText('No exercises yet')).toBeVisible();

  // Add an exercise via the picker and log two sets.
  await addExercise(page, 'bench press', 'Barbell Bench Press');
  await page.getByLabel('Set 1 weight (kg)').fill('60');
  await page.getByLabel('Set 1 reps').fill('8');
  await page.getByRole('button', { name: 'Complete set 1' }).click();
  await expect(page.getByRole('button', { name: 'Mark set 1 as not done' })).toHaveAttribute('aria-pressed', 'true');

  // Completing a set starts the rest timer, which counts down.
  const restClock = page.getByRole('timer', { name: /remaining/ });
  await expect(restClock).toBeVisible();
  const first = clockSeconds(await restClock.textContent());
  expect(first).toBeGreaterThan(100);
  await expect.poll(async () => clockSeconds(await restClock.textContent()), { timeout: 5000 }).toBeLessThan(first);

  // Pause / resume / reset the rest timer.
  await page.getByRole('button', { name: 'Pause rest timer' }).click();
  await expect(page.getByText('Paused', { exact: true })).toBeVisible();
  const pausedAt = await restClock.textContent();
  await page.waitForTimeout(1500);
  await expect(restClock).toHaveText(pausedAt!);
  await page.getByRole('button', { name: 'Resume rest timer' }).click();
  await expect(page.getByText('Resting', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reset rest timer' }).click();
  await expect(page.getByText('Ready', { exact: true })).toBeVisible();
  await expect(restClock).toHaveText('2:00');
  await page.getByRole('button', { name: 'Add 15 seconds' }).click();
  await expect(restClock).toHaveText('2:15');

  await page.getByLabel('Set 2 weight (kg)').fill('60');
  await page.getByLabel('Set 2 reps').fill('8');
  await page.getByRole('button', { name: 'Complete set 2' }).click();
  await expect(page.getByText('Resting', { exact: true })).toBeVisible();

  // A second (timed) exercise becomes the current one.
  await addExercise(page, 'plank', 'Plank');
  await expect(page.getByText('Exercise 2 of 2')).toBeVisible();
  const statePatch = page.waitForResponse((r) => r.url().includes('/state') && r.request().method() === 'PATCH' && r.ok());
  await page.getByRole('button', { name: 'Complete set 1' }).click();
  await statePatch;
  await expect(page.getByLabel('Set 1 time (seconds)')).toHaveValue('30');
  await waitForSaved(page);

  // Reload mid-workout: completed sets, the current exercise and the running timer are restored.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Plank', level: 2 })).toBeVisible();
  await expect(page.getByText('Exercise 2 of 2')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mark set 1 as not done' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Resting', { exact: true })).toBeVisible();
  const afterReload = clockSeconds(await page.getByRole('timer', { name: /remaining/ }).textContent());
  expect(afterReload).toBeGreaterThan(0);
  expect(afterReload).toBeLessThanOrEqual(45);
  await page.getByRole('button', { name: 'Previous exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Barbell Bench Press', level: 2 })).toBeVisible();
  await expect(page.getByLabel('Set 1 weight (kg)')).toHaveValue('60');
  await expect(page.getByLabel('Set 2 reps')).toHaveValue('8');
  await expect(page.getByRole('button', { name: 'Mark set 2 as not done' })).toBeVisible();

  // Pause and resume the whole workout: the elapsed clock stops while paused.
  await page.getByRole('button', { name: 'Pause workout' }).click();
  await expect(page.getByText('Workout paused — the clock is stopped.')).toBeVisible();
  const elapsed = page.getByRole('timer', { name: /Elapsed time/ });
  const frozen = await elapsed.textContent();
  await page.waitForTimeout(1500);
  await expect(elapsed).toHaveText(frozen!);
  await page.getByRole('button', { name: 'Resume workout' }).click();
  await expect(page.getByText('Workout paused — the clock is stopped.')).toBeHidden();
  await waitForSaved(page);

  // Elsewhere in the app the header pill links back to the workout.
  await page.getByRole('link', { name: 'Progress' }).first().click();
  await expect(page).toHaveURL(/\/progress$/);
  const pill = page.getByRole('link', { name: /Workout in progress/ });
  await expect(pill).toBeVisible();
  await expect(pill).toContainText('Workout ·');
  await pill.click();
  await expect(page).toHaveURL(/\/workouts\/session$/);
  await expect(page.getByRole('heading', { name: 'Barbell Bench Press', level: 2 })).toBeVisible();
  await expect(page.getByRole('link', { name: /Workout in progress/ })).toHaveCount(0);

  // Finish: the summary shows totals computed by the server.
  await finishWorkout(page);
  const stats = page.locator('.summary-stats');
  await expect(stats.locator('.stat').filter({ hasText: 'Sets' })).toContainText('3');
  await expect(stats.locator('.stat').filter({ hasText: 'Volume' })).toContainText('960 kg');
  await expect(stats.locator('.stat').filter({ hasText: 'Exercises' })).toContainText('2');
  await expect(page.getByText('No new personal records this time')).toBeVisible();

  // History lists the workout.
  await page.getByRole('link', { name: 'History', exact: true }).click();
  await expect(page).toHaveURL(/\/workouts\/history$/);
  await expect(page.getByRole('heading', { name: 'Workout history' })).toBeVisible();
  const item = page.getByRole('link', { name: 'Open Quick workout' });
  await expect(item).toHaveCount(1);
  await expect(item).toContainText('3 sets');
  await expect(item).toContainText('960 kg');

  // A heavier second workout sets personal records.
  await startEmptyWorkout(page);
  await addExercise(page, 'bench press', 'Barbell Bench Press');
  await expect(page.locator('.exercise-previous')).toContainText('8 × 60 kg, 8 × 60 kg');
  await page.getByLabel('Set 1 weight (kg)').fill('65');
  await page.getByLabel('Set 1 reps').fill('8');
  await page.getByRole('button', { name: 'Complete set 1' }).click();
  await waitForSaved(page);
  await finishWorkout(page);
  const records = page.getByRole('region', { name: 'Personal records' });
  await expect(records).toContainText('Barbell Bench Press');
  await expect(records).toContainText('Heaviest weight');
  await expect(records).toContainText('60 kg');
  await expect(records).toContainText('65 kg');

  await page.getByRole('link', { name: 'History', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Open Quick workout' })).toHaveCount(2);
  await expect(page.getByRole('link', { name: 'Open Quick workout' }).first()).toContainText(/PR/);
});

test('discarding a workout and deleting one from history @mobile', async ({ page }) => {
  await readyUser(page);
  await startEmptyWorkout(page);
  await addExercise(page, 'push', 'Push-Up');
  await page.getByLabel('Set 1 reps').fill('12');
  await page.getByRole('button', { name: 'Complete set 1' }).click();
  await expect(page.getByRole('timer', { name: /remaining/ })).toBeVisible();
  await waitForSaved(page);

  // Discard asks for confirmation and leaves nothing behind.
  await page.getByRole('button', { name: 'Discard', exact: true }).click();
  await page.getByRole('dialog', { name: 'Discard this workout?' }).getByRole('button', { name: 'Discard workout' }).click();
  await expect(page).toHaveURL(/\/workouts$/);
  await page.goto('/workouts/history');
  await expect(page.getByText('No workouts yet')).toBeVisible();

  // Finish one with zero completed sets (warned) and delete it from history.
  await startEmptyWorkout(page);
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Finish workout?' });
  await expect(dialog.getByText('No sets are marked as completed.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Finish workout' }).click();
  await expect(page.getByRole('heading', { name: 'Workout complete' })).toBeVisible();
  await page.goto('/workouts/history');
  await page.getByRole('button', { name: 'Delete Quick workout' }).click();
  await page.getByRole('dialog', { name: 'Delete this workout?' }).getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('No workouts yet')).toBeVisible();
});
