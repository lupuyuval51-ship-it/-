import { expect, test } from '../fixtures.ts';

test('food log: search shows thumbnails, quick-add logs an entry, delete offers Undo', async ({ app: page, seed, t, lang }) => {
  await seed();
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

  await page.goto('/nutrition');
  const entry = page.locator('.nu-entries li', { hasText: name });
  await expect(entry).toHaveCount(1);
  await page.getByRole('button', { name: t('nutrition.hub.deleteEntry', { name }) }).click();
  const bar = page.getByTestId('undo-bar');
  await expect(bar).toContainText(t('nutrition.hub.deletedNamed', { name }));
  await expect(entry).toHaveCount(0);
  await bar.getByRole('button', { name: t('action.undo') }).click();
  await expect(page.locator('.nu-entries li', { hasText: name })).toHaveCount(1);
  await expect(bar).toHaveCount(0);
});
