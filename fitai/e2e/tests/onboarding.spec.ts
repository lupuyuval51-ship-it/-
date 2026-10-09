import { expect, test, type Page } from '@playwright/test';
import { registerViaUi, useEnglish } from './helpers';

test.beforeEach(async ({ page }) => {
  await useEnglish(page);
});

const next = (page: Page) => page.getByRole('button', { name: 'Next' }).click();
const stepHeading = (page: Page, name: string) => expect(page.getByRole('heading', { level: 2, name })).toBeVisible();

test('complete the onboarding questionnaire through the UI @mobile', async ({ page }) => {
  await registerViaUi(page);
  await expect(page.getByText('Step 1 of 7')).toBeVisible();

  // Step 1 — validation for a missing age, focus on the first invalid field.
  await next(page);
  await expect(page.getByText('Please fix the highlighted fields.')).toBeVisible();
  const age = page.getByLabel('Age');
  await expect(age).toBeFocused();
  await expect(page.locator('[data-field="ageYears"]').getByText('Required')).toBeVisible();
  await age.fill('12');
  await page.getByRole('radio', { name: 'Female' }).click();
  await page.getByLabel('Height').fill('165');
  await page.getByLabel('Weight').fill('60');
  await next(page);
  await expect(page.getByText('You must be at least 13 years old')).toBeVisible();
  await age.fill('29');
  await next(page);

  // Step 2 — experience & optional benchmarks.
  await stepHeading(page, 'Experience & current ability');
  await expect(page.getByText('Step 2 of 7')).toBeVisible();
  await page.getByText('Beginner', { exact: true }).click();
  await page.getByLabel('Max push-ups in a row').fill('12');
  await next(page);

  // Step 3 — goal.
  await stepHeading(page, 'Your main goal');
  await page.getByText('General fitness', { exact: true }).click();
  await next(page);

  // Step 4 — home location, some equipment.
  await stepHeading(page, 'Training setup');
  await page.getByText('Home', { exact: true }).click();
  await page.getByRole('button', { name: 'Dumbbells' }).click();
  await page.getByRole('button', { name: 'Resistance bands' }).click();
  await expect(page.getByText('2 items selected')).toBeVisible();
  await page.getByRole('radio', { name: '4' }).first().click();
  await next(page);

  // Step 5 — an injury.
  await stepHeading(page, 'Preferences & limitations');
  await page.getByRole('button', { name: 'Knee', exact: true }).click();
  await expect(page.getByText('Get professional advice for injuries')).toBeVisible();
  await page.getByLabel('Injury notes').fill('old meniscus tear');
  await next(page);

  // Step 6 — vegetarian with a sesame allergy.
  await stepHeading(page, 'Nutrition & lifestyle');
  await page.getByText('Vegetarian', { exact: true }).click();
  await page.getByRole('button', { name: 'Sesame' }).click();
  await page.getByText('Lightly active', { exact: true }).click();
  await page.getByText('Mostly sitting', { exact: true }).click();

  // Going back keeps answers.
  await page.getByRole('button', { name: 'Back' }).click();
  await stepHeading(page, 'Preferences & limitations');
  await expect(page.getByRole('button', { name: 'Knee', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Injury notes')).toHaveValue('old meniscus tear');
  await next(page);
  await expect(page.getByRole('radio', { name: 'Vegetarian' })).toBeChecked();
  await next(page);

  // Review — answers, live targets; a refresh resumes from the saved draft.
  await stepHeading(page, 'Review your answers');
  await expect(page.getByText('Step 7 of 7')).toBeVisible();
  await expect(page.getByText('Your estimated daily targets')).toBeVisible();
  await expect(page.getByText('Dumbbells and Resistance bands')).toBeVisible();
  await page.reload();
  await expect(page.getByText('We restored the answers you entered earlier on this device.')).toBeVisible();
  await stepHeading(page, 'Review your answers');

  // Edit from review and come straight back.
  await page.getByRole('button', { name: 'Edit: Your main goal' }).click();
  await page.getByText('Build muscle', { exact: true }).click();
  await page.getByRole('button', { name: 'Back to review' }).click();
  await stepHeading(page, 'Review your answers');
  await expect(page.locator('dd', { hasText: 'Build muscle' })).toBeVisible();

  await page.getByRole('button', { name: 'Finish setup' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Your profile is ready!')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('fitai.onboardingDraft'))).toBeNull();

  // The profile page shows the saved answers.
  await page.goto('/profile');
  const body = page.locator('#settings-body');
  await expect(body.getByRole('textbox', { name: 'Age', exact: true })).toHaveValue('29');
  await expect(body.getByRole('radio', { name: 'Female' })).toHaveAttribute('aria-checked', 'true');
  await expect(body.getByLabel('Height')).toHaveValue('165');
  await expect(body.getByLabel('Weight')).toHaveValue('60');
  await expect(body.getByRole('radio', { name: /Build muscle/ })).toBeChecked();
  const training = page.locator('#settings-training');
  await expect(training.getByRole('radio', { name: 'Home' })).toBeChecked();
  await expect(training.getByRole('button', { name: 'Dumbbells' })).toHaveAttribute('aria-pressed', 'true');
  await expect(training.getByRole('button', { name: 'Barbell' })).toHaveAttribute('aria-pressed', 'false');
  await expect(training.getByRole('button', { name: 'Knee', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(training.getByLabel('Max push-ups in a row')).toHaveValue('12');
  const nutrition = page.locator('#settings-nutrition');
  await expect(nutrition.getByRole('radio', { name: 'Vegetarian' })).toBeChecked();
  await expect(nutrition.getByRole('button', { name: 'Sesame' })).toHaveAttribute('aria-pressed', 'true');
});

test('teens choosing fat loss get a supportive no-deficit notice', async ({ page }) => {
  await registerViaUi(page);
  await page.getByLabel('Age').fill('15');
  await page.getByRole('radio', { name: 'Male', exact: true }).click();
  await page.getByLabel('Height').fill('170');
  await page.getByLabel('Weight').fill('62');
  await next(page);
  await page.getByText('Beginner', { exact: true }).click();
  await next(page);
  await expect(page.getByText('Healthy habits first')).toHaveCount(0);
  await page.getByText('Lose fat', { exact: true }).click();
  await expect(page.getByText('Healthy habits first')).toBeVisible();
  await expect(page.getByText(/won’t set a calorie deficit/)).toBeVisible();
});
