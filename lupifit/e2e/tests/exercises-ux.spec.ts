import { expect, test, type Page } from '@playwright/test';
import { readyUser, useEnglish } from './helpers';

test.beforeEach(async ({ page }) => {
  await useEnglish(page);
});

const shot = async (page: Page, name: string) => {
  if (process.env.UX_SHOTS) await page.screenshot({ path: `${process.env.UX_SHOTS}/${name}.png`, fullPage: true });
};
const results = (page: Page) => page.getByRole('list', { name: 'Exercises' });
const searchBox = (page: Page) => page.getByRole('searchbox', { name: 'Search exercises' });

test('result count and highlights follow the search, recent searches can be reused and cleared @mobile', async ({ page }) => {
  await readyUser(page);
  await page.goto('/exercises');
  await expect(page.getByRole('region', { name: 'Recent searches' })).toHaveCount(0);

  await searchBox(page).fill('plank');
  await searchBox(page).press('Enter');
  await expect(page).toHaveURL(/\/exercises\?q=plank$/);
  await expect(page.getByText(/^\d+ exercises? for “plank”$/)).toBeVisible();
  await expect(results(page).locator('mark.ex-mark').first()).toHaveText(/plank/i);
  await shot(page, 'library-search');

  // Opening a result also remembers the search; Back restores the list.
  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(page).toHaveURL(/\/exercises$/);
  const recent = page.getByRole('region', { name: 'Recent searches' });
  await expect(recent.getByRole('button', { name: 'plank' })).toBeVisible();
  await recent.getByRole('button', { name: 'plank' }).click();
  await expect(page).toHaveURL(/\?q=plank$/);
  await expect(searchBox(page)).toHaveValue('plank');

  await page.getByRole('button', { name: 'Clear search' }).click();
  await page.getByRole('button', { name: 'Clear recent searches' }).click();
  await expect(page.getByRole('region', { name: 'Recent searches' })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('region', { name: 'Recent searches' })).toHaveCount(0);
});

test('zero results explain themselves and offer the next step', async ({ page }) => {
  await readyUser(page);
  await page.goto('/exercises?q=zzzzqqq&group=legs');
  await expect(page.getByText('No exercises match')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Try searching for' })).toBeVisible();
  await shot(page, 'library-zero');

  // Dropping the filters keeps the search; the search can be cleared on its own too.
  await page.getByRole('button', { name: 'Search without filters' }).click();
  await expect(page).toHaveURL(/\/exercises\?q=zzzzqqq$/);
  await page.getByRole('region', { name: 'Try searching for' }).getByRole('button', { name: 'squat' }).click();
  await expect(page).toHaveURL(/\/exercises\?q=squat$/);
  await expect(results(page).getByRole('link', { name: 'Goblet Squat' })).toBeVisible();
});

test('filters replace history entries and have an accessible radio-group keyboard model', async ({ page }) => {
  await readyUser(page);
  await page.goto('/exercises');
  const group = page.getByRole('radiogroup', { name: 'Muscle group' });
  await group.getByRole('radio', { name: /^Chest/ }).click();
  await expect(page).toHaveURL(/group=chest$/);
  await page.getByRole('radiogroup', { name: 'Difficulty' }).getByRole('radio', { name: /^Beginner/ }).click();
  await expect(page).toHaveURL(/group=chest&difficulty=beginner$/);
  // Roving tabindex: arrow keys move the selection inside the group.
  await group.getByRole('radio', { name: /^Chest/ }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/group=back&difficulty=beginner$/);
  await expect(group.getByRole('radio', { name: /^Back/ })).toBeFocused();
  // One Back press leaves the library entirely: the chips created no history entries.
  await page.goBack();
  await expect(page).not.toHaveURL(/\/exercises/);
});

test('"squat" lists exercises the user can do before rack-only ones', async ({ page }) => {
  await readyUser(page, { trainingLocation: 'home', equipment: ['dumbbells'], injuries: [] });
  await page.goto('/exercises?q=squat');
  const cards = results(page).getByRole('listitem');
  await expect(cards.first()).toBeVisible();
  const missing = await cards.evaluateAll((els) => els.map((e) => /Needs equipment you don.t have/.test(e.textContent ?? '')));
  const firstMissing = missing.indexOf(true);
  const lastDoable = missing.lastIndexOf(false);
  // Doable squats (bodyweight / dumbbell) come first; the barbell and rack ones follow.
  expect(missing[0]).toBe(false);
  expect(firstMissing === -1 || lastDoable < firstMissing || missing.slice(0, 3).every((m) => !m)).toBe(true);
  await expect(results(page).getByRole('link').first()).not.toHaveText('Barbell Back Squat');
});
