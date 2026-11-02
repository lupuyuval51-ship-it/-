import { expect, test, uniqueName, PASSWORD } from '../fixtures.ts';

test('register with a username, finish the onboarding wizard and land on Home with the hero card', async ({ app: page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await page.locator('a[href="/register"]').click();
  await expect(page).toHaveURL(/\/register$/);

  await page.locator('input[autocomplete="username"]').fill(uniqueName('reg'));
  await page.locator('input[autocomplete="new-password"]').fill(PASSWORD);
  await page.locator('form button[type="submit"]').click();

  await expect(page).toHaveURL(/\/welcome$/);
  await page.locator('a[href="/onboarding"]').click();
  await expect(page.locator('.onb[data-step="about"]')).toBeVisible();

  // Defaults are valid: walk every step with "Next", then save on the review step.
  for (const step of ['about', 'experience', 'goal', 'training', 'preferences', 'nutrition']) {
    await expect(page.locator(`.onb[data-step="${step}"]`)).toBeVisible();
    await page.locator('.onb-primary').click();
  }
  await expect(page.locator('.onb[data-step="review"]')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await page.locator('.onb-primary').click();

  await expect(page.locator('.onb-done')).toBeVisible();
  await expect(page).toHaveURL(/\/$/, { timeout: 10_000 });
  await expect(page.locator('.hero-card')).toBeVisible();
  await expect(page.locator('main h1')).toHaveCount(1);
});
