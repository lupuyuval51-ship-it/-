import { exact } from '../copy.ts';
import { expect, test } from '../fixtures.ts';

test('profile: sex, activity and diet are choice cards and the edit persists', async ({ app: page, seed, t }) => {
  await seed();
  await page.goto('/profile');
  for (const key of ['profile.f.sex', 'profile.f.activity', 'profile.f.diet']) {
    await expect(page.getByRole('radiogroup', { name: t(key) })).toBeVisible();
    await expect(page.getByLabel(t(key), { exact: true }).and(page.locator('select'))).toHaveCount(0);
  }
  await page.getByRole('radiogroup', { name: t('profile.f.diet') }).getByRole('radio', { name: exact(t('label.diet.vegan')) }).click();
  await page.getByRole('radiogroup', { name: t('profile.f.activity') }).getByRole('radio', { name: t('label.activity.very_active'), exact: false }).first().click();
  await page.getByRole('button', { name: t('action.save'), exact: true }).click();
  await expect(page.getByRole('button', { name: t('action.save'), exact: true })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole('radiogroup', { name: t('profile.f.diet') }).getByRole('radio', { name: exact(t('label.diet.vegan')) })).toBeChecked();
  await expect(page.getByRole('radiogroup', { name: t('profile.f.activity') }).getByRole('radio', { checked: true })).toContainText(t('label.activity.very_active'));
});
