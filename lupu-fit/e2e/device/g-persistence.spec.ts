import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, FOOD_QUERY, launchProfile, logFirstFood, onboard, test } from './fixtures.ts';
import { makeT } from '../copy.ts';

test('data survives closing and reopening the browser (persistent profile: IndexedDB holds the PGlite data)', async ({ lang }, info) => {
  const t = await makeT(lang, { device: true });
  const dir = mkdtempSync(join(tmpdir(), 'lupu-e2e-profile-'));
  try {
    // Launch 1: first start, onboarding, one logged food, one finished-set workout name noted, a profile name.
    const one = await launchProfile(info, dir, lang);
    await onboard(one.page);
    const food = await logFirstFood(one.page, t, FOOD_QUERY[lang].a);
    await one.page.goto('/nutrition');
    await expect(one.page.locator('.nu-entries li')).toHaveCount(1);
    await one.page.goto('/profile');
    await one.page.getByLabel(t('profile.f.displayName')).fill('Persisted Pat');
    await one.page.getByRole('button', { name: t('action.save'), exact: true }).click();
    await expect(one.page.getByText(t('profile.saved'))).toBeVisible();
    const idb = await one.page.evaluate(async () => (await indexedDB.databases()).map((d) => d.name));
    expect(idb.some((n) => n?.includes('lupu-fit-pgdata'))).toBe(true);
    one.watch.finish();
    await one.context.close();

    // Launch 2: same profile directory. No welcome, no onboarding, the same data.
    const two = await launchProfile(info, dir, lang);
    await two.page.goto('/');
    await expect(two.page.locator('.hero-card')).toBeVisible();
    await expect(two.page).not.toHaveURL(/welcome|onboarding/);
    await two.page.goto('/nutrition');
    await expect(two.page.locator('.nu-entries li .nu-entry-name strong').first()).toHaveText(food);
    await two.page.goto('/profile');
    await expect(two.page.getByLabel(t('profile.f.displayName'))).toHaveValue('Persisted Pat');
    // Lazy: still the same single hidden identity, no registration happened again (it would have shown the welcome screen).
    two.watch.finish();
    await two.context.close();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a write that was answered is already on disk: tearing the page (and its database worker) down right after it loses nothing', async ({ app: page, t, lang }) => {
  await onboard(page);
  const food = await logFirstFood(page, t, FOOD_QUERY[lang].a);
  const context = page.context();
  const keep = await context.newPage(); // keeps the browser alive while the app page goes away without any shutdown step
  await page.close({ runBeforeUnload: false });
  await keep.goto('/nutrition');
  await expect(keep.locator('.nu-entries li .nu-entry-name strong').first()).toHaveText(food, { timeout: 30_000 });
});
