import { expect, test, type Page } from '@playwright/test';
import { readyUser, useEnglish } from './helpers';

test.beforeEach(async ({ page }) => {
  await useEnglish(page);
});

const toast = (page: Page, text: string | RegExp) => page.locator('.toasts').getByText(text).first();

test('unfinished forms survive a reload and are emptied once submitted', async ({ page }) => {
  test.setTimeout(120_000);
  await readyUser(page);

  // Quick add: typed but not submitted → still there after a reload; submitted → gone.
  await page.goto('/nutrition/log?meal=lunch&tab=quick');
  await page.getByRole('tab', { name: 'Quick add' }).click();
  await page.getByRole('textbox', { name: 'Description' }).fill('Half typed snack');
  await page.getByLabel('Calories (kcal)').fill('123');
  await page.reload();
  await page.getByRole('tab', { name: 'Quick add' }).click();
  await expect(page.getByRole('textbox', { name: 'Description' })).toHaveValue('Half typed snack');
  await expect(page.getByLabel('Calories (kcal)')).toHaveValue('123');
  await page.getByRole('button', { name: 'Add to Lunch' }).click();
  await expect(toast(page, 'Half typed snack added to Lunch')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Description' })).toHaveValue('');
  await page.reload();
  await page.getByRole('tab', { name: 'Quick add' }).click();
  await expect(page.getByRole('textbox', { name: 'Description' })).toHaveValue('');

  // Weigh-in: the weight stays in the field until it is saved.
  await page.goto('/progress');
  const card = page.getByRole('region', { name: 'Body weight' });
  await card.getByRole('textbox', { name: 'Weight', exact: true }).fill('81.1');
  await page.reload();
  await expect(page.getByRole('region', { name: 'Body weight' }).getByRole('textbox', { name: 'Weight', exact: true })).toHaveValue('81.1');

  // Coach: an unsent question is kept.
  await page.goto('/coach');
  await page.getByLabel('Message the coach').fill('Should I deload next week?');
  await page.reload();
  await expect(page.getByLabel('Message the coach')).toHaveValue('Should I deload next week?');
});

test('drafts are wiped on logout so a shared device keeps nothing', async ({ page }) => {
  test.setTimeout(120_000);
  await readyUser(page);
  await page.goto('/coach');
  await page.getByLabel('Message the coach').fill('private health question');
  expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('fitai.draft.')).length)).toBe(1);
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login/);
  expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('fitai.draft.')).length)).toBe(0);
});
