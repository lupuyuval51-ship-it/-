import { writeFileSync } from 'node:fs';
import { expect, onboard, test, type Page } from './fixtures.ts';

const iso = (daysAgo: number): string => { const d = new Date(); d.setDate(d.getDate() - daysAgo); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/** A backup file with history from before this week (a finished workout and two weigh-ins), restored through the real Backup panel. */
async function restoreHistory(page: Page, t: (k: string) => string, file: string): Promise<void> {
  const startedAt = new Date(Date.now() - 10 * 86_400_000);
  const finishedAt = new Date(startedAt.getTime() + 45 * 60_000);
  writeFileSync(file, JSON.stringify({
    version: 1, exportedAt: new Date().toISOString(), profile: null,
    bodyWeight: [{ loggedDate: iso(10), weightKg: 80 }, { loggedDate: iso(9), weightKg: 79.4 }],
    foodLog: [],
    sessions: [{ id: 'old-1', name: 'Old workout', startedAt: startedAt.toISOString(), finishedAt: finishedAt.toISOString(), exercises: [{ exerciseId: 'back_squat', sport: null, isFinisher: false, sets: [{ reps: 8, weightKg: 60 }, { reps: 8, weightKg: 60 }] }] }],
  }));
  await page.goto('/profile');
  await page.getByLabel(t('profile.backup.pick')).setInputFiles(file);
  await page.getByRole('button', { name: t('profile.backup.confirmGo') }).click();
  await expect(page.getByTestId('restore-result')).toBeVisible();
}

test('reminders: without notification permission the card explains itself, nothing is switched on, and no permission is asked at start-up', async ({ app: page, t, context }) => {
  await context.grantPermissions([]); // nothing granted: the web Notification permission stays undecided/denied
  await onboard(page);
  await page.goto('/profile');
  const card = page.locator('.auto-card');
  await expect(card).toBeVisible();
  await expect(card.getByText(t('automation.intro'))).toBeVisible();
  // In a browser there is no background delivery; the card says so (the Android app uses its own notifications).
  await expect(card.getByText(t('automation.note.web'))).toBeVisible();
  expect(await page.evaluate(() => Notification.permission)).not.toBe('granted');

  const workout = page.getByTestId('auto-workout');
  const toggle = workout.getByRole('switch').or(workout.getByRole('checkbox')).first();
  await expect(toggle).not.toBeChecked();
  await toggle.click();
  // Denied (or dismissed): the toggle stays off, the reason is shown, and the time fields never appear.
  await expect(page.getByTestId('auto-denied')).toHaveText(t('automation.denied'));
  await expect(toggle).not.toBeChecked();
  await expect(workout.locator('.auto-fields')).toHaveCount(0);
  // The in-app helpers (no permission needed) and the device-only backup reminder switch are there.
  await expect(card.getByText(t('automation.inapp.backupHint'))).toBeVisible();
});

test('reminders: with permission granted a reminder turns on and keeps its settings across reload', async ({ app: page, t, context, baseURL }) => {
  await context.grantPermissions(['notifications'], { origin: baseURL as string });
  await onboard(page);
  await page.goto('/profile');
  const workout = page.getByTestId('auto-workout');
  const toggle = workout.getByRole('switch').or(workout.getByRole('checkbox')).first();
  await toggle.click();
  await expect(toggle).toBeChecked();
  await expect(workout.locator('.auto-fields')).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('auto-workout').getByRole('switch').or(page.getByTestId('auto-workout').getByRole('checkbox')).first()).toBeChecked();
});

test('weekly check-in banner (history from last week, once per week) and monthly backup banner (30 days, snooze, export clears it) work offline', async ({ app: page, t }, info) => {
  await onboard(page);
  await restoreHistory(page, t, info.outputPath('history.json'));

  // Weekly check-in: shown on Home, dismissed once, stays dismissed for this week (also after a reload).
  await page.goto('/');
  const checkin = page.getByTestId('weekly-checkin');
  await expect(checkin).toBeVisible();
  await expect(checkin).toContainText(t('automation.checkin.title'));
  await checkin.getByRole('button', { name: t('automation.checkin.dismiss') }).click();
  await expect(checkin).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.hero-card')).toBeVisible();
  await expect(page.getByTestId('weekly-checkin')).toHaveCount(0);

  // Backup banner: not in the first 30 days after the first open...
  await expect(page.getByTestId('backup-reminder')).toHaveCount(0);
  // ...then monthly. Pretend the app was first opened 40 days ago.
  await page.evaluate((d) => localStorage.setItem('lf_auto_backup', JSON.stringify({ since: d })), iso(40));
  await page.reload();
  const banner = page.getByTestId('backup-reminder');
  await expect(banner).toBeVisible();
  await expect(banner).toContainText(t('automation.backup.title'));
  // Snooze: gone, and still gone after a reload (the next reminder is 30 days later).
  await banner.getByRole('button', { name: t('automation.backup.dismiss') }).click();
  await expect(banner).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.hero-card')).toBeVisible();
  await expect(page.getByTestId('backup-reminder')).toHaveCount(0);
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem('lf_auto_backup'))) ?? '{}').snoozed).toBe(iso(0));

  // Due again: following the banner to Profile and exporting (a real download, no network) records the backup and ends the reminder.
  await page.evaluate((d) => localStorage.setItem('lf_auto_backup', JSON.stringify({ since: d })), iso(40));
  await page.reload();
  await expect(page.getByTestId('backup-reminder')).toBeVisible();
  await page.getByTestId('backup-reminder').getByRole('link', { name: t('automation.backup.cta') }).click();
  await expect(page).toHaveURL(/\/profile$/);
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: new RegExp(t('profile.backup.export')) }).click();
  await dl;
  await expect(page.getByText(t('profile.backup.exported'))).toBeVisible();
  const st = JSON.parse((await page.evaluate(() => localStorage.getItem('lf_auto_backup'))) ?? '{}') as { lastDone?: string };
  expect(st.lastDone).toBe(iso(0));
  await page.goto('/');
  await expect(page.locator('.hero-card')).toBeVisible();
  await expect(page.getByTestId('backup-reminder')).toHaveCount(0);

  // The switch in Settings turns the whole reminder off.
  await page.evaluate((d) => localStorage.setItem('lf_auto_backup', JSON.stringify({ since: d })), iso(40));
  await page.goto('/profile');
  await page.getByLabel(t('automation.inapp.backupReminder')).uncheck();
  await page.goto('/');
  await expect(page.locator('.hero-card')).toBeVisible();
  await expect(page.getByTestId('backup-reminder')).toHaveCount(0);
});
