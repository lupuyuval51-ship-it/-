import { expect, test, type Page } from '@playwright/test';
import { readyUser, useEnglish } from './helpers';

test.beforeEach(async ({ page }) => {
  await useEnglish(page);
});

async function generateFromForm(page: Page) {
  await page.goto('/workouts');
  await page.getByRole('button', { name: 'Generate your first plan' }).click();
  await expect(page).toHaveURL(/tab=generate/);
  await expect(page.getByText("FITAI's training engine builds your plan from your profile")).toBeVisible();
  await page.getByRole('radio', { name: '3' }).click();
  await page.getByLabel('Plan name (optional)').fill('E2E strength block');
  await page.getByRole('button', { name: 'Generate plan' }).click();
  await expect(page).toHaveURL(/\/workouts\/plans\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { level: 1, name: 'E2E strength block' })).toBeVisible();
}

test('generate a plan, edit a day and keep the changes @mobile', async ({ page }) => {
  await readyUser(page);
  await generateFromForm(page);

  // 3 days for an intermediate muscle-gain profile → push / pull / legs.
  const days = page.getByRole('article');
  await expect(days).toHaveCount(3);
  await expect(page.getByRole('heading', { name: 'Push', exact: true })).toBeVisible();
  await expect(page.getByText('Why this plan looks like this')).toBeVisible();
  const firstDay = days.first();
  expect(await firstDay.getByRole('listitem').count()).toBeGreaterThanOrEqual(3);

  await firstDay.getByRole('button', { name: 'Edit day' }).click();
  const editor = page.getByRole('article').first();
  await expect(editor.getByRole('heading', { name: 'Edit Push' })).toBeVisible();
  const rows = editor.locator('ol > li');
  const rowCount = await rows.count();
  const firstName = (await rows.first().locator('strong').first().textContent())!.trim();
  const secondName = (await rows.nth(1).locator('strong').first().textContent())!.trim();
  const lastName = (await rows.nth(rowCount - 1).locator('strong').first().textContent())!.trim();

  // Change sets, reps and rest of the first exercise.
  const first = rows.first();
  await first.getByLabel('Sets').fill('5');
  await first.getByLabel('Min reps').fill('6');
  await first.getByLabel('Max reps').fill('8');
  await first.getByLabel('Rest', { exact: true }).selectOption('150');

  // Replace the second exercise via the alternatives modal.
  await rows.nth(1).getByRole('button', { name: `Replace ${secondName}` }).click();
  const dialog = page.getByRole('dialog', { name: `Replace ${secondName}` });
  await expect(dialog).toBeVisible();
  const useButton = dialog.getByRole('button', { name: /^Use / }).first();
  const replacement = ((await useButton.getAttribute('aria-label')) ?? '').replace(/^Use /, '');
  await useButton.click();
  await expect(dialog).toBeHidden();
  await expect(rows.nth(1).getByText('Replaced')).toBeVisible();
  await expect(rows.nth(1).getByText(replacement, { exact: true })).toBeVisible();

  // Remove the last exercise and add one from the library.
  await editor.getByRole('button', { name: `Remove: ${lastName}` }).click();
  await editor.getByRole('button', { name: 'Add exercise' }).click();
  const picker = page.getByRole('dialog', { name: 'Add an exercise' });
  await picker.getByRole('searchbox', { name: 'Search exercises' }).fill('dead bug');
  await picker.getByRole('button', { name: 'Select: Dead Bug' }).click();
  await expect(editor.getByText('Dead Bug', { exact: true })).toBeVisible();
  await expect(editor.getByText('Unsaved changes')).toBeVisible();

  // Invalid rep range is caught before saving.
  await first.getByLabel('Min reps').fill('9');
  await editor.getByRole('button', { name: 'Save day' }).click();
  await expect(first.getByText('Minimum reps must not exceed maximum reps')).toBeVisible();
  await first.getByLabel('Min reps').fill('6');

  await editor.getByRole('button', { name: 'Save day' }).click();
  await expect(page.getByText('Changes saved')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Edit Push' })).toHaveCount(0);

  await page.reload();
  const saved = page.getByRole('article').first();
  await expect(saved.getByRole('link', { name: `Exercise details: ${firstName}` })).toBeVisible();
  await expect(saved.getByText('5 × 6–8')).toBeVisible();
  await expect(saved.getByText('Rest 2:30 min')).toBeVisible();
  await expect(saved.getByRole('link', { name: `Exercise details: ${replacement}` })).toBeVisible();
  await expect(saved.getByRole('link', { name: `Exercise details: ${secondName}` })).toHaveCount(0);
  await expect(saved.getByRole('link', { name: 'Exercise details: Dead Bug' })).toBeVisible();
  if (lastName !== replacement && lastName !== 'Dead Bug') {
    await expect(saved.getByRole('link', { name: `Exercise details: ${lastName}` })).toHaveCount(0);
  }
});

test('activate and duplicate plans from the plan page and the list', async ({ page }) => {
  await readyUser(page);
  await generateFromForm(page);
  const planUrl = page.url();

  await page.getByRole('button', { name: 'Set as active plan' }).click();
  await expect(page.getByText('This is now your active plan')).toBeVisible();
  await expect(page.getByText('Active', { exact: true })).toBeVisible();
  await expect(page.getByText('Next', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Duplicate', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'E2E strength block (copy)' })).toBeVisible();
  expect(page.url()).not.toBe(planUrl);
  await expect(page.getByText('Draft', { exact: true })).toBeVisible();

  await page.goto('/workouts');
  await expect(page.getByText('Active plan', { exact: true })).toBeVisible();
  await expect(page.getByText('Next workout')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start workout' })).toBeEnabled();
  const copyItem = page.getByRole('listitem').filter({ has: page.getByRole('link', { name: 'E2E strength block (copy)' }) });
  await copyItem.getByRole('button', { name: 'Set as active plan' }).click();
  await expect(page.getByText('This is now your active plan')).toBeVisible();
  // The copy is now active; the original moved back to the drafts list.
  await expect(page.getByRole('heading', { name: /E2E strength block \(copy\)/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'E2E strength block', exact: true })).toBeVisible();

  // Delete the original (with confirmation).
  const original = page.getByRole('listitem').filter({ has: page.getByRole('link', { name: 'E2E strength block', exact: true }) });
  await original.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('dialog', { name: 'Delete this plan?' }).getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('Plan deleted')).toBeVisible();
  await expect(page.getByRole('link', { name: 'E2E strength block', exact: true })).toHaveCount(0);
});

test('unsaved changes guard prompts before leaving the page', async ({ page }) => {
  await readyUser(page);
  await generateFromForm(page);
  const planUrl = page.url();
  await page.getByRole('article').first().getByRole('button', { name: 'Edit day' }).click();
  await page.getByRole('article').first().locator('ol > li').first().getByLabel('Sets').fill('7');

  await page.getByRole('link', { name: 'Home', exact: true }).filter({ visible: true }).first().click();
  const prompt = page.getByRole('dialog', { name: 'Discard unsaved changes?' });
  await expect(prompt).toBeVisible();
  await prompt.getByRole('button', { name: 'Cancel' }).click();
  await expect(page).toHaveURL(planUrl);
  await expect(page.getByRole('button', { name: 'Save day' })).toBeVisible();

  await page.getByRole('link', { name: 'Home', exact: true }).filter({ visible: true }).first().click();
  await page.getByRole('dialog', { name: 'Discard unsaved changes?' }).getByRole('button', { name: 'Discard changes' }).click();
  await expect(page).not.toHaveURL(planUrl);

  // Nothing was saved.
  await page.goto(planUrl);
  await expect(page.getByRole('article').first().getByText(/^7 × /)).toHaveCount(0);
});
