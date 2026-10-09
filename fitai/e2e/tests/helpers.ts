import { expect, type Page } from '@playwright/test';

export const uniqueEmail = (prefix = 'e2e') => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@e2e.fitai`;

/** Switches the UI language to English (tests assert on English copy). */
export async function useEnglish(page: Page) {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('fitai.locale', JSON.stringify('en'));
    } catch {
      /* ignore */
    }
  });
}

export async function registerViaUi(page: Page, opts: { email?: string; password?: string; name?: string } = {}) {
  const email = opts.email ?? uniqueEmail();
  const password = opts.password ?? 'Passw0rd!';
  await page.goto('/register');
  await page.getByLabel('Name').fill(opts.name ?? 'E2E Tester');
  await page.getByLabel('Email').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  return { email, password };
}
