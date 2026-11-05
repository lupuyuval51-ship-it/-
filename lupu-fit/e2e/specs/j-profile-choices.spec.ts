import { exact } from '../copy.ts';
import { expect, test } from '../fixtures.ts';

const KEYS = ['profile.f.sex', 'profile.f.goal', 'profile.f.experience', 'profile.f.place', 'profile.f.activity', 'profile.f.diet'];

test('profile: sex, goal, experience, place, activity and diet are choice cards and the edit persists', async ({ app: page, seed, t }) => {
  await seed();
  await page.goto('/profile');
  for (const key of KEYS) {
    await expect(page.getByRole('radiogroup', { name: t(key) })).toBeVisible();
    await expect(page.getByLabel(t(key), { exact: true }).and(page.locator('select'))).toHaveCount(0);
  }
  // Styled as cards, not as bare buttons (the card CSS must load on /profile without visiting onboarding first).
  const card = page.getByRole('radiogroup', { name: t('profile.f.goal') }).getByRole('radio').first();
  expect((await card.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);

  const pick = (key: string, label: string) => page.getByRole('radiogroup', { name: t(key) }).getByRole('radio', { name: exact(label) }).click();
  await pick('profile.f.goal', t('label.goal.strength'));
  await pick('profile.f.experience', t('label.difficulty.advanced'));
  await pick('profile.f.place', t('label.place.gym'));
  await pick('profile.f.diet', t('label.diet.vegan'));
  await page.getByRole('radiogroup', { name: t('profile.f.activity') }).getByRole('radio', { name: t('label.activity.very_active'), exact: false }).first().click();
  await page.getByRole('button', { name: t('action.save'), exact: true }).click();
  await expect(page.getByRole('button', { name: t('action.save'), exact: true })).toHaveCount(0);

  await page.reload();
  const checked = (key: string) => page.getByRole('radiogroup', { name: t(key) }).getByRole('radio', { checked: true });
  await expect(checked('profile.f.goal')).toContainText(t('label.goal.strength'));
  await expect(checked('profile.f.experience')).toContainText(t('label.difficulty.advanced'));
  await expect(checked('profile.f.place')).toContainText(t('label.place.gym'));
  await expect(page.getByRole('radiogroup', { name: t('profile.f.diet') }).getByRole('radio', { name: exact(t('label.diet.vegan')) })).toBeChecked();
  await expect(checked('profile.f.activity')).toContainText(t('label.activity.very_active'));
});
