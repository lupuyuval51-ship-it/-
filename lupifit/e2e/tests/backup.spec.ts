import { expect, test, type Page } from '@playwright/test';
import { readyUser, useEnglish } from './helpers';

async function post(page: Page, path: string, data: unknown) {
  const token = ((await (await page.request.get('/api/auth/me')).json()) as { csrfToken: string }).csrfToken;
  const res = await page.request.post(path, { headers: { 'x-csrf-token': token, 'content-type': 'application/json', 'idempotency-key': `e2e-${Math.random().toString(36).slice(2)}-${Date.now()}` }, data });
  expect(res.ok(), await res.text()).toBe(true);
}

test('a backup file restores weigh-ins and food diary into a new account, and restoring twice adds nothing', async ({ page, browser }, testInfo) => {
  test.setTimeout(180_000);
  await useEnglish(page);
  await readyUser(page);
  const { today } = await (await page.request.get('/api/dashboard')).json();
  const yesterday = new Date(`${today}T00:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const y = yesterday.toISOString().slice(0, 10);
  await post(page, '/api/progress/body-weight', { date: y, weightKg: 79.9 });
  await post(page, '/api/nutrition/logs/quick', { date: today, mealType: 'lunch', name: 'E2E backup lunch', kcal: 321, proteinG: 20, carbsG: 30, fatG: 10 });

  // Save the backup file from the settings page.
  await page.goto('/profile');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save backup file' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^lupu-fit-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const file = testInfo.outputPath('backup.json');
  await download.saveAs(file);

  // A brand-new account restores it.
  const ctx = await browser.newContext({ locale: 'en-US', timezoneId: 'Asia/Jerusalem' });
  const other = await ctx.newPage();
  await useEnglish(other);
  await readyUser(other);
  await other.goto('/profile');
  await other.getByTestId('backup-file').setInputFiles(file);
  const dialog = other.getByRole('dialog', { name: 'Restore from backup' });
  await expect(dialog).toContainText('1 weigh-in');
  await expect(dialog).toContainText('1 food diary entry');
  await dialog.getByRole('button', { name: 'Restore', exact: true }).click();
  await expect(dialog.getByText('Restore finished')).toBeVisible({ timeout: 30_000 });
  await dialog.locator('footer').getByRole('button', { name: 'Close' }).click();

  const weights = await (await other.request.get('/api/progress/body-weight?period=30')).json();
  expect(weights.entries.map((e: { date: string; weightKg: number }) => [e.date, e.weightKg])).toContainEqual([y, 79.9]);
  const day = await (await other.request.get(`/api/nutrition/day?date=${today}`)).json();
  expect(day.meals.lunch.entries.map((e: { foodName: { en: string }; kcal: number }) => [e.foodName.en, e.kcal])).toContainEqual(['E2E backup lunch', 321]);

  // Doing it again finds nothing missing; a wrong file is refused with a clear message.
  await other.getByTestId('backup-file').setInputFiles(file);
  await expect(other.getByRole('dialog', { name: 'Restore from backup' })).toContainText('nothing your account is missing');
  await other.getByRole('dialog', { name: 'Restore from backup' }).getByRole('button', { name: 'Cancel' }).click();
  await other.getByTestId('backup-file').setInputFiles({ name: 'notes.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":"world"}') });
  await expect(other.locator('.toasts').getByText('not a LUPU-FIT backup file').first()).toBeVisible();
  await ctx.close();
});
