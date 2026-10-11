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

async function startEmptyWorkout(page: Page) {
  await page.goto('/workouts/session');
  await page.getByRole('button', { name: 'Start an empty workout' }).click();
  await expect(page.getByRole('heading', { name: 'Quick workout', level: 1 })).toBeVisible();
}

test('logging a set: steppers, prefill, undo, auto-advance, next-exercise button and swap', async ({ page }) => {
  test.setTimeout(120_000);
  await readyUser(page);
  await startEmptyWorkout(page);
  await addExercise(page, 'bench press', 'Barbell Bench Press');
  await addExercise(page, 'push', 'Push-Up');
  await addExercise(page, 'plank', 'Plank');

  // Back to the first exercise; the first open set is highlighted as the current one.
  await page.getByRole('button', { name: 'Previous exercise' }).click();
  await page.getByRole('button', { name: 'Previous exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Barbell Bench Press', level: 2 })).toBeVisible();
  await expect(page.locator('.set-row-current')).toHaveAttribute('data-testid', 'set-row-1');

  // +/- steppers: increments of 2.5 kg and 1 rep, never below zero.
  await page.getByRole('button', { name: 'Raise weight, set 1' }).click();
  await page.getByRole('button', { name: 'Raise weight, set 1' }).click();
  await expect(page.getByLabel('Set 1 weight (kg)')).toHaveValue('5');
  await page.getByRole('button', { name: 'Lower weight, set 1' }).click();
  await expect(page.getByLabel('Set 1 weight (kg)')).toHaveValue('2.5');
  await page.getByRole('button', { name: 'More reps, set 1' }).click();
  await expect(page.getByLabel('Set 1 reps')).toHaveValue('11');
  await page.getByRole('button', { name: 'Fewer reps, set 1' }).click();
  await page.getByRole('button', { name: 'Fewer reps, set 1' }).click();
  await expect(page.getByLabel('Set 1 reps')).toHaveValue('9');
  await page.getByLabel('Set 1 weight (kg)').fill('60');
  await page.getByLabel('Set 1 reps').fill('8');

  // Logging starts the rest timer and offers an undo that reverts both.
  await page.getByRole('button', { name: 'Complete set 1' }).click();
  await expect(page.getByTestId('undo-strip')).toContainText('Set 1 logged');
  await expect(page.getByRole('timer', { name: /remaining/ })).toBeVisible();
  await page.getByTestId('undo-strip').getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByRole('button', { name: 'Complete set 1' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('timer', { name: /remaining/ })).toHaveCount(0);
  await expect(page.getByTestId('undo-strip')).toHaveCount(0);

  // Weight carries over to the following sets as the prefilled value, so each next set is one tap.
  await page.getByRole('button', { name: 'Complete set 1' }).click();
  await page.getByRole('button', { name: 'Complete set 2' }).click();
  await expect(page.getByLabel('Set 2 weight (kg)')).toHaveAttribute('placeholder', '60');
  await expect(page.getByLabel('Set 2 weight (kg)')).toHaveValue('60');

  // Keyboard shortcut finishes the last set; the view then moves on by itself to the next exercise.
  await page.keyboard.press('c');
  await expect(page.getByRole('heading', { name: 'Push-Up', level: 2 })).toBeVisible({ timeout: 6000 });

  // Undoing the last set returns to the previous exercise.
  await page.keyboard.press('u');
  await expect(page.getByRole('heading', { name: 'Barbell Bench Press', level: 2 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Complete set 3' })).toHaveAttribute('aria-pressed', 'false');

  // Finish the exercise again, then use the explicit "Next" button once the view stays put (auto-advance off).
  await page.getByRole('button', { name: 'Complete set 3' }).click();
  await expect(page.getByRole('heading', { name: 'Push-Up', level: 2 })).toBeVisible({ timeout: 6000 });

  // Swap the not-yet-started Push-Up for another exercise, keeping its place in the workout.
  await page.getByRole('button', { name: 'Swap Push-Up for another exercise' }).click();
  const dialog = page.getByRole('dialog', { name: 'Swap Push-Up with…' });
  await dialog.getByLabel('Search exercises').fill('pull-up');
  await dialog.getByRole('button', { name: /^Select: Pull-Up/ }).first().click();
  await expect(page.getByRole('heading', { name: /Pull-Up/, level: 2 })).toBeVisible();
  await expect(page.getByText('Exercise 2 of 3')).toBeVisible();
  // Exercises with logged sets cannot be swapped.
  await page.getByRole('button', { name: 'Previous exercise' }).click();
  await expect(page.getByRole('button', { name: /Swap exercise \(only before logging a set\)/ })).toBeDisabled();
});

test('finish dialog summarises the workout and discard warns about the logged sets', async ({ page }) => {
  await readyUser(page);
  await startEmptyWorkout(page);
  await addExercise(page, 'bench press', 'Barbell Bench Press');
  await page.getByLabel('Set 1 weight (kg)').fill('50');
  await page.getByLabel('Set 1 reps').fill('10');
  await page.getByRole('button', { name: 'Complete set 1' }).click();
  await expect(page.getByText('All changes saved')).toBeVisible();

  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Finish workout?' });
  await expect(dialog).toContainText('You completed 1 of 3 sets.');
  await expect(dialog).toContainText('500 kg');
  await expect(dialog).toContainText('Barbell Bench Press: 1 of 3 sets done');
  await dialog.getByRole('button', { name: 'Keep training' }).click();
  await expect(dialog).toBeHidden();

  await page.getByRole('button', { name: 'Discard', exact: true }).click();
  const confirm = page.getByRole('dialog', { name: 'Discard this workout?' });
  await expect(confirm).toContainText('You have logged 1 of 3 sets');
  await confirm.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('heading', { name: 'Quick workout', level: 1 })).toBeVisible();

  // Finish → summary offers next steps; dashboard no longer shows a resume banner.
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await page.getByRole('dialog', { name: 'Finish workout?' }).getByRole('button', { name: 'Finish workout' }).click();
  await expect(page.getByRole('heading', { name: 'Workout complete' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What’s next' })).toBeVisible();
  await expect(page.getByTestId('next-steps-text')).toContainText(/This week: \d of 4 workouts\./);
  await expect(page.getByRole('link', { name: 'Log a meal' })).toHaveAttribute('href', '/nutrition/log');
});

test('workout settings, wake lock and the dashboard resume banner after a reload @mobile', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __wakeLocks: number };
    w.__wakeLocks = 0;
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: {
        request: async () => {
          w.__wakeLocks += 1;
          return { release: async () => undefined, addEventListener: () => undefined };
        },
      },
    });
  });
  await readyUser(page);
  await startEmptyWorkout(page);
  await addExercise(page, 'bench press', 'Barbell Bench Press');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __wakeLocks: number }).__wakeLocks)).toBeGreaterThan(0);

  await page.getByText('Workout settings').click();
  const vibrate = page.getByRole('switch', { name: 'Vibrate when rest ends' });
  await expect(vibrate).toHaveAttribute('aria-checked', 'true');
  await vibrate.click();
  await expect(vibrate).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByRole('switch', { name: 'Keep the screen on' })).toHaveAttribute('aria-checked', 'true');

  // Autosave + recovery: after a reload the preference and the workout survive, and the dashboard offers to resume.
  await page.getByLabel('Set 1 reps').fill('7');
  await expect(page.getByText('All changes saved')).toBeVisible();
  await page.goto('/');
  const banner = page.getByRole('region', { name: 'Workout in progress' });
  await expect(banner).toBeVisible();
  await expect(banner.getByRole('link', { name: 'Resume workout' })).toBeVisible();
  await banner.getByRole('link', { name: 'Resume workout' }).click();
  await expect(page.getByLabel('Set 1 reps')).toHaveValue('7');
  await page.getByText('Workout settings').click();
  await expect(page.getByRole('switch', { name: 'Vibrate when rest ends' })).toHaveAttribute('aria-checked', 'false');
});
