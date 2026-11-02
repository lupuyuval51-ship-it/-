import { expect, test } from '../fixtures.ts';

test('daily menu shows dish photos and "log the whole day" lands in Nutrition', async ({ app: page, seed, t }) => {
  await seed();
  await page.goto('/nutrition/menu');
  const dishes = page.locator('article.nu-dish');
  await expect(dishes.first()).toBeVisible();
  const count = await dishes.count();
  expect(count).toBeGreaterThanOrEqual(3);

  // Photos: each dish card has a real, decoded image (not a broken <img>).
  const photos = page.locator('article.nu-dish img.nu-photo');
  await expect(photos.first()).toBeVisible();
  // loading="lazy": bring every photo into view so the browser fetches it.
  for (const el of await photos.all()) await el.scrollIntoViewIfNeeded();
  await expect.poll(async () => photos.evaluateAll((els) => els.filter((e) => (e as HTMLImageElement).complete && (e as HTMLImageElement).naturalWidth > 0).length)).toBe(await photos.count());
  expect(await photos.count()).toBeGreaterThan(0);

  const names = (await dishes.locator('h3').allInnerTexts()).map((s) => s.trim());
  await page.getByRole('button', { name: t('nutrition.menu.logAll') }).click();
  await expect(page.getByRole('button', { name: t('nutrition.menu.loggedOne') }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: t('nutrition.menu.logAll') })).toHaveCount(0);

  await page.goto('/nutrition');
  const entries = page.locator('.nu-entries li');
  await expect(entries).toHaveCount(count);
  const logged = (await entries.locator('.nu-entry-name strong').allInnerTexts()).map((s) => s.trim());
  expect([...logged].sort()).toEqual([...names].sort());
  // Entries from dishes carry the photo thumbnail too.
  await expect.poll(async () => page.locator('.nu-entries img.nu-thumb').evaluateAll((els) => els.filter((e) => (e as HTMLImageElement).naturalWidth > 0).length)).toBeGreaterThan(0);
});
