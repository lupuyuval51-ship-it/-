import { expect, test, type Page } from '@playwright/test';
import { readyUser, useEnglish } from './helpers';

test.beforeEach(async ({ page }) => {
  await useEnglish(page);
});

const toast = (page: Page, text: string | RegExp) => page.locator('.toasts').getByText(text).first();
const noSidewaysScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

test('daily menu: open from Nutrition, see per-dish nutrition and photos, swap a dish, log one dish and then the rest @mobile', async ({ page }) => {
  test.setTimeout(120_000);
  await readyUser(page, { mealsPerDay: 4 });
  await page.goto('/nutrition');
  await expect(page.getByRole('heading', { name: 'Today’s menu' })).toBeVisible();
  await page.getByRole('link', { name: 'Open menu' }).click();
  await expect(page.getByRole('heading', { name: 'Daily menu', level: 1 })).toBeVisible();

  const dishes = page.locator('.menu-dish');
  await expect(dishes).toHaveCount(4);
  await expect(page.getByText(/kcal of [\d,]+ kcal|of [\d,]+ kcal/).first()).toBeVisible();
  await expect(page.getByText(/estimates for a typical serving/)).toBeVisible();

  // Every dish shows a loaded photo, calories and macros, and the page never scrolls sideways.
  for (const photo of await dishes.locator('img').all()) {
    await expect(photo).toBeVisible();
    await expect.poll(() => photo.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
  for (const macro of await dishes.locator('.macro-line').all()) await expect(macro).toContainText(/\d+ kcal · P \d+ · C \d+ · F \d+/);
  expect(await noSidewaysScroll(page)).toBe(true);

  // Tap targets stay phone-sized.
  for (const button of await dishes.first().getByRole('button').all()) {
    const box = await button.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(43.5);
  }

  // "Another dish" swaps only that slot.
  const names = await dishes.locator('.menu-dish-name').allTextContents();
  await dishes.nth(1).getByRole('button', { name: /^Another dish for / }).click();
  const after = await dishes.locator('.menu-dish-name').allTextContents();
  expect(after[1]).not.toBe(names[1]);
  expect(after[0]).toBe(names[0]);

  // Ingredients are one tap away.
  await dishes.first().getByText('Ingredients').click();
  await expect(dishes.first().locator('.menu-dish-details p').first()).toBeVisible();

  // Log one dish: it lands in the food log with the dish's numbers.
  const firstName = after[0]!;
  await dishes.first().getByRole('button', { name: /^Log / }).click();
  await expect(toast(page, new RegExp(`${firstName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} added to`))).toBeVisible();
  await expect(dishes.first()).toContainText('Logged');
  await expect(dishes.first().getByRole('button', { name: /^Log .* again$/ })).toBeVisible();

  // Log the rest of the day in one tap; the big button is replaced by a confirmation.
  await page.getByRole('button', { name: 'Log the whole day' }).click();
  await expect(page.getByText('Everything on this menu is logged')).toBeVisible();
  await page.goto('/nutrition');
  await expect(page.getByText(firstName).first()).toBeVisible();

  // The state survives a reload (swaps and logged marks live on this device).
  await page.goto('/nutrition/menu');
  await expect(page.locator('.menu-dish .menu-dish-name').nth(1)).toHaveText(after[1]!);
  await expect(page.getByText('Everything on this menu is logged')).toBeVisible();
});

test('daily menu: shopping list names the ingredients and can be checked off @mobile', async ({ page }) => {
  await readyUser(page);
  await page.goto('/nutrition/menu');
  await page.getByRole('button', { name: 'Shopping list' }).click();
  const dialog = page.getByRole('dialog', { name: 'Shopping list' });
  await expect(dialog).toBeVisible();
  const rows = dialog.locator('.menu-shopping-row');
  expect(await rows.count()).toBeGreaterThan(5);
  await rows.first().locator('input').check();
  await expect(rows.first().locator('span').first()).toHaveClass(/menu-shopping-done/);
  await expect(dialog.getByRole('button', { name: 'Copy list' })).toBeVisible();
  expect(await noSidewaysScroll(page)).toBe(true);
});

test('daily menu: hides dishes that conflict with diet and allergies, and warns that the check is name-based @mobile', async ({ page }) => {
  test.setTimeout(120_000);
  await readyUser(page, { dietType: 'vegan', allergies: ['peanut', 'sesame', 'soy'], dislikedFoods: 'mushrooms' });
  await page.goto('/nutrition/menu');
  await expect(page.getByText('You listed allergies')).toBeVisible();
  await expect(page.getByText(/no dish is guaranteed free of any allergen/)).toBeVisible();
  const dishes = page.locator('.menu-dish');
  const count = await dishes.count();
  expect(count).toBeGreaterThanOrEqual(3);
  for (let swap = 0; swap < 3; swap++) {
    for (const details of await dishes.locator('summary').all()) await details.click();
    const text = (await dishes.locator('.menu-dish-details p:first-of-type').allTextContents()).join(' | ').toLowerCase().replace(/almond milk/g, ''); // plant milk is fine for this user (no tree-nut allergy)
    for (const banned of ['egg', 'milk', 'cheese', 'yogurt', 'honey', 'chicken', 'tuna', 'salmon', 'beef', 'peanut', 'tahini', 'sesame', 'hummus', 'tofu', 'soy', 'mushroom']) {
      expect(text, `swap ${swap}: ${banned}`).not.toContain(banned);
    }
    await dishes.first().getByRole('button', { name: /^Another dish for / }).click();
  }
});
