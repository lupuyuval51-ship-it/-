import { expect, test, type Page } from '@playwright/test';
import { readyUser, useEnglish } from './helpers';

test.beforeEach(async ({ page }) => {
  await useEnglish(page);
});

async function generateFromForm(page: Page) {
  await page.goto('/workouts');
  await page.getByRole('button', { name: 'Generate your first plan' }).click();
  await expect(page).toHaveURL(/tab=generate/);
  await expect(page.getByText("LUPU-FIT's training engine builds your plan from your profile")).toBeVisible();
  // The quick path shows what will be built; options are behind "Customize".
  await expect(page.getByRole('button', { name: 'Generate my plan' })).toBeVisible();
  await page.getByRole('button', { name: 'Customize' }).click();
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
  await first.getByLabel('Sets', { exact: true }).fill('5');
  await first.getByLabel('Min reps', { exact: true }).fill('6');
  await first.getByLabel('Max reps', { exact: true }).fill('8');
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
  await first.getByLabel('Min reps', { exact: true }).fill('9');
  await editor.getByRole('button', { name: 'Save day' }).click();
  await expect(first.getByText('Minimum reps must not exceed maximum reps')).toBeVisible();
  await first.getByLabel('Min reps', { exact: true }).fill('6');

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

  // A first plan is activated by the generator (default on), so it is already the active plan.
  await expect(page.getByText('Active', { exact: true })).toBeVisible();
  await expect(page.getByText('Next', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start today’s workout' })).toBeEnabled();

  await page.getByRole('button', { name: 'Duplicate', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'E2E strength block (copy)' })).toBeVisible();
  expect(page.url()).not.toBe(planUrl);
  await expect(page.getByText('Draft', { exact: true })).toBeVisible();
  await expect(page.getByText('This plan is a draft')).toBeVisible();

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
  await page.getByRole('article').first().locator('ol > li').first().getByLabel('Sets', { exact: true }).fill('7');

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

test('Hebrew / RTL: generate with free-text preferences, archive and find archived plans @mobile', async ({ page }) => {
  await readyUser(page);
  // The account is English; switch the UI language in-app (no reload, which would restore English).
  await page.getByRole('button', { name: 'Language' }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.getByRole('link', { name: 'אימונים' }).filter({ visible: true }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'אימונים' })).toBeVisible();
  await expect(page.getByText('עדיין אין תוכניות אימון')).toBeVisible();

  await page.getByRole('button', { name: 'יצירת התוכנית הראשונה' }).click();
  await expect(page).toHaveURL(/tab=generate/);
  await page.getByRole('button', { name: 'התאמה אישית' }).click();
  await page.getByLabel('העדפות (רשות)').fill('בלי קפיצות, יותר ידיים');
  await page.getByLabel('שם התוכנית (רשות)').fill('תוכנית בדיקה');
  await page.getByRole('button', { name: 'יצירת תוכנית' }).click();
  await expect(page).toHaveURL(/\/workouts\/plans\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { level: 1, name: 'תוכנית בדיקה' })).toBeVisible();
  await expect(page.getByText('למה התוכנית נראית כך')).toBeVisible();
  await expect(page.getByText(/ההעדפות שלך פוענחו/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'עריכת היום' }).first()).toBeVisible();
  // RTL layout never scrolls sideways (mobile included).
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  await page.getByRole('button', { name: 'העברה לארכיון' }).first().click();
  await page.getByRole('dialog', { name: 'להעביר את התוכנית לארכיון?' }).getByRole('button', { name: 'העברה לארכיון' }).click();
  await expect(page.getByText('התוכנית הועברה לארכיון')).toBeVisible();
  await expect(page.getByText('התוכנית בארכיון. כדי להתאמן לפיה שוב, יש להגדיר אותה כפעילה.')).toBeVisible();

  // Every plan is archived: the list is empty but archived plans stay reachable.
  await page.getByRole('link', { name: 'כל התוכניות' }).first().click();
  await expect(page.getByText('עדיין אין תוכניות אימון')).toBeVisible();
  await page.getByRole('button', { name: 'הצגת תוכניות בארכיון' }).click();
  await expect(page.getByRole('heading', { name: 'תוכניות בארכיון' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'תוכנית בדיקה' })).toBeVisible();
});
