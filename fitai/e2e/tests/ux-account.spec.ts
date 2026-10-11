import { expect, test, type Page } from '@playwright/test';
import { registerViaUi, uniqueEmail, useEnglish } from './helpers';

test.beforeEach(async ({ page }) => {
  await useEnglish(page);
});

const password = (page: Page) => page.locator('input[name="password"]');

test('register: autofocus, live password checklist, inline errors with focus on the first problem @mobile', async ({ page }) => {
  await page.goto('/register');
  await expect(page.getByLabel('Name')).toBeFocused();
  await expect(page.getByLabel('Email')).toHaveAttribute('inputmode', 'email');

  // Checklist updates while typing; each rule has a text state.
  await password(page).fill('abcdefgh');
  const rules = page.locator('.password-rules');
  await expect(rules.getByText('A number')).toContainText('missing');
  await expect(rules.getByText('8+ characters')).toContainText('done');
  await password(page).fill('abcdefg1');
  await expect(rules.getByText('A number')).toContainText('done');
  await expect(page.locator('.password-strength')).toContainText('Good');

  // Leaving a filled field validates it right away (no need to submit first).
  await page.getByLabel('Email').fill('not-an-email');
  await password(page).focus();
  await expect(page.getByText('Enter a valid email address')).toBeVisible();
  // Fixing it clears the message immediately.
  await page.getByLabel('Email').fill('ok@example.com');
  await expect(page.getByText('Enter a valid email address')).toHaveCount(0);

  // Submitting an empty name focuses it and points at the field.
  await page.getByRole('button', { name: 'Create account' }).click();
  const name = page.getByLabel('Name');
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('Required').first()).toBeVisible();
});

test('register: an existing email is explained on the field with a way to log in', async ({ page }) => {
  const email = uniqueEmail('dup-ux');
  await registerViaUi(page, { email });
  await page.context().clearCookies();
  await page.goto('/register');
  await page.getByLabel('Name').fill('Dup');
  await page.getByLabel('Email').fill(email);
  await password(page).fill('LongEnough1');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByLabel('Email')).toBeFocused();
  await expect(page.getByText('An account with this email already exists.')).toBeVisible();
  await page.getByRole('link', { name: 'Log in with this email instead' }).click();
  // The email is carried over; the cursor lands on the password.
  await expect(page.getByLabel('Email')).toHaveValue(email);
  await expect(password(page)).toBeFocused();
});

test('login: wrong password keeps the email and refocuses the password; lockout says how long to wait', async ({ page }) => {
  const { email } = await registerViaUi(page);
  await page.context().clearCookies();
  await page.goto('/login');
  await expect(page.getByLabel('Email')).toBeFocused();
  await page.getByLabel('Email').fill(email);
  for (let i = 0; i < 5; i++) {
    await password(page).fill(`wrong-password-${i}`);
    await page.getByRole('button', { name: 'Log in' }).click();
    if (i === 0) {
      await expect(page.getByText('Incorrect email or password.')).toBeVisible();
      await expect(password(page)).toBeFocused();
      await expect(page.getByLabel('Email')).toHaveValue(email);
    }
    await expect(page.getByRole('button', { name: 'Log in' })).toBeEnabled();
  }
  await password(page).fill('wrong-password-again');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByText(/try again in 15 minutes — or reset your password/)).toBeVisible();
});

test('password reset: an invalid link offers a new one; the forgot form confirms and can be reused', async ({ page }) => {
  await page.goto('/reset-password?token=' + 'x'.repeat(40));
  await expect(page.locator('input[name="newPassword"]')).toBeFocused();
  await page.locator('input[name="newPassword"]').fill('Newpass123');
  await page.getByRole('button', { name: 'Update password' }).click();
  await expect(page.getByText('This reset link has expired or was already used.')).toBeVisible();
  await page.getByRole('link', { name: 'Request a new link' }).click();
  await expect(page).toHaveURL(/forgot-password/);

  await expect(page.getByLabel('Email')).toBeFocused();
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByText('Required')).toBeVisible();
  await page.getByLabel('Email').fill('someone@example.com');
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByText('Check your inbox')).toBeVisible();
  await page.getByRole('button', { name: 'Use a different email' }).click();
  await expect(page.getByLabel('Email')).toBeVisible();
});

test('onboarding: group errors are linked to the control, preferences can be skipped, teens see a safety note', async ({ page }) => {
  await registerViaUi(page);
  await page.getByLabel('Age').fill('15');
  await expect(page.getByText('Training that fits your age')).toBeVisible();
  await page.getByLabel('Height').fill('170');
  await page.getByLabel('Weight').fill('62');
  await page.getByRole('button', { name: 'Next' }).click();
  // Sex was not chosen: the radiogroup is marked invalid and described by the error.
  const sex = page.getByRole('radiogroup', { name: 'Sex' });
  await expect(sex).toHaveAttribute('aria-invalid', 'true');
  const describedBy = await sex.getAttribute('aria-describedby');
  expect(describedBy).toBeTruthy();
  await expect(page.locator(`[id="${describedBy}"]`)).toHaveText('Required');
  await expect(sex.getByRole('radio').first()).toBeFocused();
  await sex.getByRole('radio', { name: 'Male', exact: true }).click();
  await expect(sex).not.toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('button', { name: 'Next' }).click();

  await page.getByText('Beginner', { exact: true }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByText('General fitness', { exact: true }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByText('Home', { exact: true }).click();
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page.getByRole('heading', { level: 2, name: 'Preferences & limitations' })).toBeVisible();
  await page.getByRole('button', { name: 'Skip this step' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Nutrition & lifestyle' })).toBeVisible();
  // Starting over asks first.
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Preferences & limitations' })).toBeVisible();
});

test('hebrew: register page is RTL with natural copy and a working checklist', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/register');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.locator('input[name="password"]').fill('abc12345');
  await expect(page.locator('.password-rules')).toContainText('8 תווים לפחות');
  await expect(page.locator('.password-rules')).toContainText('הושלם');
  await context.close();
});
