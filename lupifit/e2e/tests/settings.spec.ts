import fs from 'node:fs';
import { expect, test } from '@playwright/test';
import { readyUser, useEnglish } from './helpers';

test.beforeEach(async ({ page }) => {
  await useEnglish(page);
});

test('switch the language to Hebrew (RTL) and back', async ({ page }) => {
  await readyUser(page);
  await page.goto('/profile');
  const account = page.locator('#settings-account');
  await account.getByRole('radio', { name: 'עברית' }).click();
  await expect(account.getByText('Unsaved changes')).toBeVisible();
  await account.locator('button[type="submit"]').click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'he');
  await expect(page.getByRole('heading', { level: 1, name: 'פרופיל והגדרות' })).toBeVisible();

  await account.getByRole('radio', { name: 'English' }).click();
  await account.locator('button[type="submit"]').click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.getByRole('heading', { level: 1, name: 'Profile & settings' })).toBeVisible();

  // The preference is stored on the account.
  await page.reload();
  await expect(page.locator('#settings-account').getByRole('radio', { name: 'English' })).toHaveAttribute('aria-checked', 'true');
});

test('weight changes update targets; unsafe custom calories are rejected; custom targets can be reset', async ({ page }) => {
  await readyUser(page);
  await page.goto('/profile');
  const targets = page.locator('#settings-targets');
  await expect(targets.getByText('Recommended')).toBeVisible();
  const caloriesStat = targets.locator('.stat-value').first();
  const before = await caloriesStat.textContent();

  const body = page.locator('#settings-body');
  await body.getByLabel('Weight').fill('100');
  await body.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Changes saved')).toBeVisible();
  await expect(caloriesStat).not.toHaveText(before ?? '');

  // Custom calories below the safe minimum (BMR at 100 kg = 1,980 kcal) → server error shown.
  await targets.getByRole('button', { name: 'Set custom targets' }).click();
  await expect(targets.getByText('Safe minimum for you: 1,980 kcal')).toBeVisible();
  await targets.getByLabel('Calories').fill('1500');
  await targets.getByRole('button', { name: 'Save targets' }).click();
  await expect(targets.getByText('Below your safe minimum of 1,980 kcal per day.')).toBeVisible();
  await expect(targets.getByLabel('Calories')).toBeFocused();

  // A safe custom target is accepted.
  await targets.getByLabel('Calories').fill('3000');
  await targets.getByLabel('Protein').fill('180');
  await targets.getByLabel('Fat').fill('90');
  await targets.getByRole('button', { name: 'Fill carbs from remaining calories' }).click();
  await expect(targets.getByLabel('Carbs')).toHaveValue('368');
  await targets.getByRole('button', { name: 'Save targets' }).click();
  await expect(page.getByText('Custom targets saved')).toBeVisible();
  await expect(targets.getByText('Custom', { exact: true })).toBeVisible();
  await expect(caloriesStat).toHaveText('3,000 kcal');

  await targets.getByRole('button', { name: 'Reset to recommended' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Reset to recommended' }).click();
  await expect(page.getByText('Recommended targets restored')).toBeVisible();
  await expect(targets.getByText('Recommended', { exact: true })).toBeVisible();
});

test('warns before leaving with unsaved changes', async ({ page }) => {
  await readyUser(page);
  await page.goto('/profile');
  await page.locator('#settings-account').getByLabel('Display name').fill('Someone else');
  await page.getByRole('link', { name: 'Workouts' }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Leave without saving?')).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.locator('#settings-account').getByLabel('Display name')).toHaveValue('Someone else');
});

test('export my data downloads a JSON file', async ({ page }) => {
  const { email } = await readyUser(page);
  await page.goto('/profile');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download my data' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^fitai-export-\d{4}-\d{2}-\d{2}\.json$/);
  const data = JSON.parse(fs.readFileSync((await download.path())!, 'utf8'));
  expect(data.format).toBe('fitai-export');
  expect(data.user.email).toBe(email);
  expect(data.profile.goal).toBe('muscle_gain');
  expect(JSON.stringify(data)).not.toMatch(/password|token_?hash|csrf/i);
});

test('delete account requires the password and typed confirmation', async ({ page }) => {
  const { email, password } = await readyUser(page);
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Delete my account' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Delete your account?' })).toBeVisible();
  const submit = dialog.getByRole('button', { name: 'Delete permanently' });
  await expect(submit).toBeDisabled();
  await dialog.getByRole('textbox', { name: 'Password', exact: true }).fill('WrongPassw0rd');
  await dialog.getByLabel('Type DELETE to confirm').fill('DELETE');
  await submit.click();
  await expect(dialog.getByText('The password is incorrect.')).toBeVisible();

  await dialog.getByRole('textbox', { name: 'Password', exact: true }).fill(password);
  await submit.click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText('Your account and data were deleted.')).toBeVisible();

  await page.getByLabel('Email').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByText('Incorrect email or password.')).toBeVisible();
});
