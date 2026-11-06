import { readFileSync, writeFileSync } from 'node:fs';
import { expect, FOOD_QUERY, freshContext, logFirstFood, onboard, test, type Page } from './fixtures.ts';
import type { TFn } from '../copy.ts';

const NAME = 'Dana Restored';

/** Onboarded person with a display name and one food entry; returns the exported backup file (a real download) and the food's name. */
async function exportFromOnboardedPhone(page: Page, t: TFn, lang: 'he' | 'en', path: string): Promise<string> {
  await onboard(page);
  await page.goto('/profile');
  await page.getByLabel(t('profile.f.displayName')).fill(NAME);
  await page.getByRole('button', { name: t('action.save'), exact: true }).click();
  await expect(page.getByText(t('profile.saved'))).toBeVisible();
  const food = await logFirstFood(page, t, FOOD_QUERY[lang].a);
  await page.goto('/profile');
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: new RegExp(t('profile.backup.export')) }).click();
  await (await dl).saveAs(path);
  return food;
}

test('new phone: Welcome -> "I already have a backup" restores a file exported by an earlier run and lands on Home with the data, no onboarding', async ({ app: page, browser, t, lang }, info) => {
  test.setTimeout(240_000);
  const file = info.outputPath('backup.json');
  const food = await exportFromOnboardedPhone(page, t, lang, file);
  const exported = JSON.parse(readFileSync(file, 'utf8')) as { backup: { profile: { displayName?: string } | null; foodLog: unknown[] } };
  expect(exported.backup.profile?.displayName).toBe(NAME);
  expect(exported.backup.foodLog).toHaveLength(1);

  // A phone the app was never opened on: new browser profile, so no IndexedDB and no localStorage.
  const fresh = await freshContext(browser, info, lang);
  const p2 = fresh.page;
  const visited: string[] = [];
  p2.on('framenavigated', (f) => { if (f === p2.mainFrame()) visited.push(new URL(f.url()).pathname); });
  await p2.goto('/');
  await expect(p2).toHaveURL(/\/welcome$/);

  // One primary action (Start); the restore entry is a secondary button and Start is still a link to onboarding.
  await expect(p2.locator('.welcome .btn-primary')).toHaveCount(1);
  await expect(p2.locator('a.btn-primary[href="/onboarding"]')).toBeVisible();
  const restoreBtn = p2.getByRole('button', { name: t('welcome.restore.cta') });
  await expect(restoreBtn).toBeVisible();
  await expect(restoreBtn).not.toHaveClass(/btn-primary/);

  // A file that is not a backup is refused calmly: nothing changes, Welcome stays.
  const bad = info.outputPath('wrong.json');
  writeFileSync(bad, '{"hello":1}');
  await p2.getByLabel(t('profile.backup.pick')).setInputFiles(bad);
  await expect(p2.getByRole('alert').filter({ hasText: t('profile.backup.wrongFile') })).toBeVisible();
  await expect(p2.getByRole('dialog')).toHaveCount(0);
  await expect(p2).toHaveURL(/\/welcome$/);

  // The real backup: confirmation says what will be replaced, then straight to Home.
  await p2.getByLabel(t('profile.backup.pick')).setInputFiles(file);
  const dialog = p2.getByRole('dialog');
  await expect(dialog).toContainText(t('profile.backup.confirmBody'));
  await expect(dialog).toContainText(t('profile.backup.item.profile'));
  await dialog.getByRole('button', { name: t('profile.backup.confirmGo') }).click();
  await expect(p2).toHaveURL(/\/$/, { timeout: 30_000 });
  await expect(p2.locator('.hero-card')).toBeVisible();
  expect(visited.filter((x) => x === '/onboarding')).toEqual([]); // onboarding was never shown
  await expect(p2.getByText(t('welcome.restore.toastHome'))).toBeVisible();

  // The restored data is there, and survives a reload (restore is durable before the answer).
  await p2.reload();
  await expect(p2.locator('.hero-card')).toBeVisible();
  await p2.goto('/profile');
  await expect(p2.getByLabel(t('profile.f.displayName'))).toHaveValue(NAME);
  await p2.goto('/nutrition');
  await expect(p2.locator('.nu-entries li')).toHaveCount(1);
  await expect(p2.locator('.nu-entries li .nu-entry-name strong').first()).toHaveText(food);
  // Welcome is for people without a profile: it is not reachable any more.
  await p2.goto('/welcome');
  await expect(p2).toHaveURL(/\/$/);
  fresh.watch.finish();
  await fresh.context.close();
});

test('new phone: a version 1 file without a profile restores, then continues to onboarding', async ({ app: page, browser, t, lang }, info) => {
  test.setTimeout(180_000);
  void page;
  const v1 = {
    version: 1, exportedAt: '2026-05-01T00:00:00Z', profile: null, bodyWeight: [{ loggedDate: '2026-05-01', weightKg: 80 }],
    foodLog: [{ loggedDate: '2026-05-01', slot: 'lunch', name: 'Rice', grams: 100, kcal: 130, proteinG: 2, carbsG: 28, fatG: 0.3 }], sessions: [],
  };
  const file = info.outputPath('v1.json');
  writeFileSync(file, JSON.stringify({ backup: v1, extra: { account: null } }));

  const fresh = await freshContext(browser, info, lang);
  const p2 = fresh.page;
  await p2.goto('/');
  await expect(p2).toHaveURL(/\/welcome$/);
  await p2.getByLabel(t('profile.backup.pick')).setInputFiles(file);
  const dialog = p2.getByRole('dialog');
  await expect(dialog).toContainText(t('profile.backup.confirmBodyV1'));
  await dialog.getByRole('button', { name: t('profile.backup.confirmGo') }).click();
  await expect(p2).toHaveURL(/\/onboarding$/, { timeout: 30_000 });
  await expect(p2.getByText(t('welcome.restore.toastSetup'))).toBeVisible();

  // Onboarding works as usual and the restored data is kept next to the new profile.
  for (const step of ['about', 'experience', 'goal', 'training', 'preferences', 'nutrition']) {
    await expect(p2.locator(`.onb[data-step="${step}"]`)).toBeVisible();
    await p2.locator('.onb-primary').click();
  }
  await expect(p2.locator('.onb[data-step="review"]')).toBeVisible();
  await p2.locator('.onb-primary').click();
  await expect(p2).toHaveURL(/\/$/, { timeout: 15_000 });
  await expect(p2.locator('.hero-card')).toBeVisible();
  await p2.goto('/profile');
  const dl = p2.waitForEvent('download');
  await p2.getByRole('button', { name: new RegExp(t('profile.backup.export')) }).click();
  const out = info.outputPath('after.json');
  await (await dl).saveAs(out);
  const after = JSON.parse(readFileSync(out, 'utf8')) as { backup: { version: number; profile: unknown; foodLog: { name: string }[]; bodyWeight: unknown[] } };
  expect(after.backup.version).toBe(2);
  expect(after.backup.profile).not.toBeNull();
  expect(after.backup.foodLog.map((f) => f.name)).toEqual(['Rice']);
  expect(after.backup.bodyWeight).toHaveLength(1);
  fresh.watch.finish();
  await fresh.context.close();
});
