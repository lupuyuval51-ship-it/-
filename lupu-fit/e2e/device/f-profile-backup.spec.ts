import { readFileSync, writeFileSync } from 'node:fs';
import { expect, FOOD_QUERY, logFirstFood, onboard, test } from './fixtures.ts';

test('profile edit persists across reload; export + restore round trip; delete all data resets cleanly and the app re-provisions', async ({ app: page, t, lang }, info) => {
  await onboard(page);

  // Profile edit -> Save -> reload: the IndexedDB database still has it.
  await page.goto('/profile');
  const nameField = page.getByLabel(t('profile.f.displayName'));
  await nameField.fill('Dana Device');
  await page.getByRole('button', { name: t('action.save'), exact: true }).click();
  await expect(page.getByText(t('profile.saved'))).toBeVisible();
  await page.reload();
  await expect(page.getByLabel(t('profile.f.displayName'))).toHaveValue('Dana Device');

  // Log one food, then export.
  const exportedName = await logFirstFood(page, t, FOOD_QUERY[lang].a);
  await page.goto('/nutrition');
  await expect(page.locator('.nu-entries li')).toHaveCount(1);

  await page.goto('/profile');
  await expect(page.getByText(t('profile.backup.hint'))).toBeVisible();
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: new RegExp(t('profile.backup.export')) }).click();
  const download = await dl;
  const file = info.outputPath('backup.json');
  await download.saveAs(file);
  const exported = JSON.parse(readFileSync(file, 'utf8')) as { backup: { foodLog: unknown[]; profile: { displayName?: string } | null }; extra: { account: unknown } };
  expect(exported.backup.foodLog).toHaveLength(1);
  expect(exported.backup.profile?.displayName).toBe('Dana Device');
  expect(exported.extra.account).toBeNull(); // no account exists on the device, so the file does not invent one

  // Change the data, then restore the file: the food log is back to the exported state.
  await logFirstFood(page, t, FOOD_QUERY[lang].b);
  await page.goto('/nutrition');
  await expect(page.locator('.nu-entries li')).toHaveCount(2);

  await page.goto('/profile');
  await page.getByLabel(t('profile.backup.pick')).setInputFiles(file);
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: t('profile.backup.confirmGo') }).click();
  await expect(page.getByTestId('restore-result')).toBeVisible();
  await page.goto('/nutrition');
  await expect(page.locator('.nu-entries li')).toHaveCount(1);
  await expect(page.locator('.nu-entries li .nu-entry-name strong').first()).toHaveText(exportedName);

  // A file that is not a backup is refused calmly, nothing changes.
  const bad = info.outputPath('bad.json');
  writeFileSync(bad, '{"hello":1}');
  await page.goto('/profile');
  await page.getByLabel(t('profile.backup.pick')).setInputFiles(bad);
  await expect(page.getByRole('alert').filter({ hasText: /./ }).first()).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Delete all data: honest wording, typed confirmation, then a clean slate and a new hidden profile.
  await page.goto('/profile');
  await page.getByRole('link', { name: t('profile.account.delete') }).click();
  await expect(page).toHaveURL(/\/account-deletion$/);
  await page.getByRole('button', { name: t('legal.deletion.open') }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText(t('legal.deletion.sheetBody'));
  await dialog.getByLabel(t('legal.deletion.typeLabel')).fill('DELETE');
  await dialog.getByRole('button', { name: t('legal.deletion.confirm') }).click();
  await expect(page).toHaveURL(/\/welcome$/, { timeout: 30_000 });

  // The app re-provisioned itself: onboarding works again and nothing of the deleted person is left.
  await onboard(page);
  await page.goto('/profile');
  await expect(page.getByLabel(t('profile.f.displayName'))).toHaveValue('');
  await page.goto('/nutrition');
  await expect(page.locator('.nu-entries li')).toHaveCount(0);
  await page.goto('/coach');
  await page.getByRole('button', { name: t('coach.chats') }).click();
  await expect(page.getByRole('dialog').getByText(t('coach.noThreads'))).toBeVisible();
});
