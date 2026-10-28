import { expect, test } from '@playwright/test';
import { registerViaUi, uniqueEmail, useEnglish } from './helpers';

test.beforeEach(async ({ page }) => {
  await useEnglish(page);
});

test('register, log out and log back in @mobile', async ({ page }) => {
  const { email, password } = await registerViaUi(page);
  // A freshly registered user is sent to onboarding and cannot skip it.
  await page.goto('/');
  await expect(page).toHaveURL(/\/onboarding/);
  await page.context().clearCookies();
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.locator('input[name="password"]').fill('wrong-password-1');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByText('Incorrect email or password.')).toBeVisible();
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/onboarding/);
});

test('client-side validation and duplicate email', async ({ page }) => {
  const email = uniqueEmail('dup');
  await registerViaUi(page, { email });
  await page.context().clearCookies();
  await page.goto('/register');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText('Required').first()).toBeVisible();
  await page.getByLabel('Name').fill('Dup');
  await page.getByLabel('Email').fill(email);
  await page.locator('input[name="password"]').fill('short');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
  await page.locator('input[name="password"]').fill('LongEnough1');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText('An account with this email already exists.')).toBeVisible();
});

test('Hebrew is the default language and renders right-to-left', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/login');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'he');
  await expect(page.getByRole('heading', { name: 'טוב לראות אותך שוב' })).toBeVisible();
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await context.close();
});

test('protected pages redirect to login', async ({ page }) => {
  await page.goto('/nutrition');
  await expect(page).toHaveURL(/\/login/);
});
