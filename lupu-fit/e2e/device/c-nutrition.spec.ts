import { expect, onboard, test } from './fixtures.ts';

test('nutrition: log from search with dish thumbnails, undo, saved meal, daily menu and log the whole day', async ({ app: page, t, lang }) => {
  await onboard(page);

  // Search -> thumbnails -> quick add.
  await page.goto('/nutrition/log');
  await page.getByRole('searchbox').fill(lang === 'he' ? 'שקשוקה' : 'shakshuka');
  const results = page.locator('.nu-results .nu-result');
  await expect(results.first()).toBeVisible();
  const thumbs = page.locator('.nu-results img.nu-thumb');
  await expect(thumbs.first()).toBeVisible();
  for (const img of await thumbs.all()) await img.scrollIntoViewIfNeeded();
  await expect.poll(async () => thumbs.evaluateAll((els) => els.filter((e) => (e as HTMLImageElement).naturalWidth > 0).length)).toBe(await thumbs.count());
  const first = results.first();
  const name = (await first.locator('.result-row strong').innerText()).trim();
  await first.locator('.nu-quick').click();
  await expect(page.getByText(t('nutrition.nu.addedOne', { name }), { exact: false }).first()).toBeVisible();

  // Hub: delete + Undo.
  await page.goto('/nutrition');
  const entry = page.locator('.nu-entries li', { hasText: name });
  await expect(entry).toHaveCount(1);
  await page.getByRole('button', { name: t('nutrition.hub.deleteEntry', { name }) }).click();
  const bar = page.getByTestId('undo-bar');
  await expect(bar).toContainText(t('nutrition.hub.deletedNamed', { name }));
  await expect(entry).toHaveCount(0);
  await bar.getByRole('button', { name: t('action.undo') }).click();
  await expect(page.locator('.nu-entries li', { hasText: name })).toHaveCount(1);

  // Saved meal: save the logged slot, delete the entry, log the saved meal again.
  await page.getByRole('button', { name: t('nutrition.hub.saveMeal') }).first().click();
  await page.getByLabel(t('nutrition.hub.mealName')).fill('E2E meal');
  await page.getByRole('dialog').getByRole('button', { name: t('action.save'), exact: true }).click();
  await expect(page.getByText('E2E meal')).toBeVisible();
  await page.getByRole('button', { name: t('nutrition.hub.deleteEntry', { name }) }).click();
  await expect(page.locator('.nu-entries li', { hasText: name })).toHaveCount(0);
  await page.getByRole('button', { name: t('nutrition.hub.logAgain'), exact: true }).click();
  await expect(page.locator('.nu-entries li', { hasText: name })).toHaveCount(1);

  // Daily menu: photos load from the packaged files; "log the whole day" lands in the hub.
  await page.goto('/nutrition/menu');
  const dishes = page.locator('article.nu-dish');
  await expect(dishes.first()).toBeVisible();
  const count = await dishes.count();
  expect(count).toBeGreaterThanOrEqual(3);
  const photos = page.locator('article.nu-dish img.nu-photo');
  for (const el of await photos.all()) await el.scrollIntoViewIfNeeded();
  await expect.poll(async () => photos.evaluateAll((els) => els.filter((e) => (e as HTMLImageElement).complete && (e as HTMLImageElement).naturalWidth > 0).length)).toBe(await photos.count());
  const names = (await dishes.locator('h3').allInnerTexts()).map((x) => x.trim());
  await page.getByRole('button', { name: t('nutrition.menu.logAll') }).click();
  await expect(page.getByRole('button', { name: t('nutrition.menu.loggedOne') }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: t('nutrition.menu.logAll') })).toHaveCount(0);
  await page.goto('/nutrition');
  await expect(page.locator('.nu-entries li').first()).toBeVisible();
  const loggedNames = async () => (await page.locator('.nu-entries li .nu-entry-name strong').allInnerTexts()).map((x) => x.trim());
  for (const n of [...names, name]) await expect.poll(loggedNames).toContain(n);
});
