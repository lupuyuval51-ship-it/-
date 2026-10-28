import { expect, test, type Page } from '@playwright/test';
import { readyUser, useEnglish } from './helpers';

test.beforeEach(async ({ page }) => {
  await useEnglish(page);
});

const shot = async (page: Page, name: string) => {
  if (process.env.UX_SHOTS) await page.screenshot({ path: `${process.env.UX_SHOTS}/${name}.png`, fullPage: true });
};

/** One-tap generation with the profile defaults; lands on the (active) plan page. */
async function quickGenerate(page: Page) {
  await page.goto('/workouts?tab=generate');
  await page.getByRole('button', { name: 'Generate my plan' }).click();
  await expect(page).toHaveURL(/\/workouts\/plans\/[0-9a-f-]{36}$/, { timeout: 30_000 });
}

test('one-tap plan: preview from the profile, activation and "start today\'s workout" @mobile', async ({ page }) => {
  await readyUser(page);
  await page.goto('/workouts?tab=generate');
  const preview = page.getByRole('region', { name: 'Your plan in one tap' });
  await expect(preview).toBeVisible();
  // Smart defaults come from the onboarding profile (4 days, 60 min, muscle gain, gym).
  await expect(preview.getByText('4 workouts a week, about 60 min each')).toBeVisible();
  await expect(preview.getByText(/Upper \/ lower/)).toBeVisible();
  await expect(preview.getByText('Build muscle')).toBeVisible();
  await expect(page.getByRole('switch', { name: 'Make it my active plan' })).toHaveAttribute('aria-checked', 'true');
  await shot(page, 'generate-quick');

  await page.getByRole('button', { name: 'Generate my plan' }).click();
  await expect(page).toHaveURL(/\/workouts\/plans\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await expect(page.getByText('Your plan is ready and set as your active plan')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start today’s workout' })).toBeEnabled();
  await expect(page.getByText('Why this plan looks like this')).toBeVisible();

  // Every generated day explains itself.
  const firstDay = page.getByRole('article').first();
  await firstDay.getByText('Why this day?').click();
  await expect(firstDay.getByText('Trains:')).toBeVisible();
  await shot(page, 'plan-active');

  // The list shows the active plan with the same CTA.
  await page.goto('/workouts');
  await expect(page.getByRole('button', { name: 'Start workout' })).toBeEnabled();
});

test('a second plan does not replace the active one unless asked', async ({ page }) => {
  await readyUser(page);
  await quickGenerate(page);
  await page.goto('/workouts?tab=generate');
  await expect(page.getByRole('switch', { name: 'Make it my active plan' })).toHaveAttribute('aria-checked', 'false');
  await page.getByRole('button', { name: 'Generate my plan' }).click();
  await expect(page).toHaveURL(/\/workouts\/plans\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await expect(page.getByText('This plan is a draft')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start today’s workout' })).toHaveCount(0);
});

test('editing is fast: steppers, keyboard and drag reorder, undo after remove and replace @mobile', async ({ page }, testInfo) => {
  await readyUser(page);
  await quickGenerate(page);
  await page.getByRole('article').first().getByRole('button', { name: 'Edit day' }).click();
  const editor = page.getByRole('article').first();
  const rows = editor.locator('ol > li');
  const names = async () => rows.locator('strong').evaluateAll((els) => els.map((e) => e.textContent!.trim()));
  const initial = await names();
  expect(initial.length).toBeGreaterThanOrEqual(4);

  // Steppers: one tap per set / rep.
  const first = rows.first();
  const sets = first.getByRole('textbox', { name: 'Sets', exact: true });
  const before = Number(await sets.inputValue());
  await first.getByRole('button', { name: 'Increase Sets' }).click();
  await expect(sets).toHaveValue(String(before + 1));
  await first.getByRole('button', { name: 'Decrease Sets' }).click();
  await expect(sets).toHaveValue(String(before));
  const minReps = first.getByRole('textbox', { name: 'Min reps', exact: true });
  const minBefore = Number(await minReps.inputValue());
  await first.getByRole('button', { name: 'Increase Min reps' }).click();
  await expect(minReps).toHaveValue(String(minBefore + 1));

  // Keyboard reorder: Alt+ArrowDown on a row's move button, focus stays on it, change is announced.
  const moveDown = first.getByRole('button', { name: /^Move down:/ });
  await moveDown.focus();
  await page.keyboard.press('Alt+ArrowDown');
  await expect.poll(names).toEqual([initial[1], initial[0], ...initial.slice(2)]);
  await expect(editor.getByRole('status').filter({ hasText: 'moved to position 2 of' })).toBeVisible();
  await expect(rows.nth(1).getByRole('button', { name: /^Move down:/ })).toBeFocused();
  await page.keyboard.press('Alt+ArrowUp');
  await expect.poll(names).toEqual(initial);

  // Pointer drag with the handle (desktop browsers; touch uses the arrow buttons).
  if (!testInfo.project.name.includes('mobile')) {
    // (Rows are taller than the viewport, so the HTML5 drag events are dispatched directly.)
    const drag = async (from: number, to: number) => {
      const dt = await page.evaluateHandle(() => new DataTransfer());
      await rows.nth(from).getByTestId('drag-handle').dispatchEvent('dragstart', { dataTransfer: dt });
      await rows.nth(to).dispatchEvent('dragover', { dataTransfer: dt });
      await rows.nth(to).dispatchEvent('drop', { dataTransfer: dt });
      await rows.nth(from).getByTestId('drag-handle').dispatchEvent('dragend', { dataTransfer: dt });
    };
    await drag(0, 2);
    await expect.poll(names).toEqual([initial[1], initial[2], initial[0], ...initial.slice(3)]);
    await drag(2, 0);
    await expect.poll(names).toEqual(initial);
  }

  // Remove → undo restores it, in place.
  await editor.getByRole('button', { name: `Remove: ${initial[1]}` }).click();
  await expect(editor.getByText(`Removed ${initial[1]}.`)).toBeVisible();
  await expect.poll(names).toEqual([initial[0], ...initial.slice(2)]);
  await expect(editor.getByRole('button', { name: 'Undo' })).toBeFocused();
  await editor.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(names).toEqual(initial);

  // Replace → undo.
  await rows.nth(2).getByRole('button', { name: `Replace ${initial[2]}` }).click();
  const dialog = page.getByRole('dialog', { name: `Replace ${initial[2]}` });
  await dialog.getByRole('radio', { name: /^Fits my setup/ }).click();
  await shot(page, 'alternatives');
  await dialog.getByRole('button', { name: /^Use / }).first().click();
  await expect(editor.getByText(/^Replaced .* with .*\.$/)).toBeVisible();
  expect((await names())[2]).not.toBe(initial[2]);
  await editor.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(names).toEqual(initial);
  await shot(page, 'editor');

  // A later edit retires the (whole-day) undo so it can never revert unrelated changes.
  await editor.getByRole('button', { name: `Remove: ${initial[1]}` }).click();
  await first.getByRole('button', { name: 'Increase Sets' }).click();
  await expect(editor.getByRole('button', { name: 'Undo' })).toHaveCount(0);
});

test('swap an exercise from the plan view with one tap, then undo', async ({ page }) => {
  await readyUser(page);
  await quickGenerate(page);
  const day = page.getByRole('article').first();
  const item = day.locator('ol > li').nth(1);
  const original = (await item.getByRole('link').first().textContent())!.trim();
  await item.getByRole('button', { name: `Swap ${original} for an alternative` }).click();
  const dialog = page.getByRole('dialog', { name: `Replace ${original}` });
  await dialog.getByRole('radio', { name: /^Fits my setup/ }).click();
  const use = dialog.getByRole('button', { name: /^Use / }).first();
  const replacement = ((await use.getAttribute('aria-label')) ?? '').replace(/^Use /, '');
  await use.click();
  await expect(page.getByText(`Swapped ${original} for ${replacement}`)).toBeVisible();
  await expect(day.getByRole('link', { name: `Exercise details: ${replacement}` })).toBeVisible();
  await expect(day.getByRole('link', { name: `Exercise details: ${original}` })).toHaveCount(0);

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(day.getByRole('link', { name: `Exercise details: ${original}` })).toBeVisible();
  await expect(day.getByRole('link', { name: `Exercise details: ${replacement}` })).toHaveCount(0);
});

test('add to plan straight from an exercise page @mobile', async ({ page }) => {
  await readyUser(page);
  await quickGenerate(page);
  await page.goto('/exercises/dead_bug');
  await page.getByRole('button', { name: 'Add to plan' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add Dead Bug to a plan' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('Plan')).toContainText('Active plan');
  await expect(dialog.getByText(/It starts as 3 × 8–12, rest 1:30 min/)).toBeVisible();
  await shot(page, 'add-to-plan');
  await dialog.getByRole('button', { name: 'Add to day' }).click();
  await expect(page.getByText(/^Added Dead Bug to /)).toBeVisible();
  await page.getByRole('button', { name: 'View plan' }).click();
  await expect(page).toHaveURL(/\/workouts\/plans\/[0-9a-f-]{36}$/);
  await expect(page.getByRole('link', { name: 'Exercise details: Dead Bug' })).toBeVisible();

  // The same exercise cannot be added twice to the same day.
  await page.goto('/exercises/dead_bug');
  await page.getByRole('button', { name: 'Add to plan' }).click();
  const again = page.getByRole('dialog', { name: 'Add Dead Bug to a plan' });
  await expect(again.getByText('This exercise is already in that day.')).toBeVisible();
  await expect(again.getByRole('button', { name: 'Add to day' })).toBeDisabled();
});

test('add to plan without any plan points to the generator', async ({ page }) => {
  await readyUser(page);
  await page.goto('/exercises/plank');
  await page.getByRole('button', { name: 'Add to plan' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add Plank to a plan' });
  await expect(dialog.getByText('You have no plan to add to yet')).toBeVisible();
  await dialog.getByRole('link', { name: 'Generate your first plan' }).click();
  await expect(page).toHaveURL(/\/workouts\?tab=generate$/);
});

test('Hebrew / RTL: one-tap generator, preview and editor controls @mobile', async ({ page }) => {
  await readyUser(page);
  await page.getByRole('button', { name: 'Language' }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.getByRole('link', { name: 'אימונים' }).filter({ visible: true }).first().click();
  await page.getByRole('button', { name: 'יצירת התוכנית הראשונה' }).click();
  await expect(page.getByRole('region', { name: 'התוכנית שלך בלחיצה אחת' })).toBeVisible();
  await expect(page.getByText('4 אימונים בשבוע, כ-60 דקות כל אחד')).toBeVisible();
  await shot(page, 'generate-quick-he');
  await page.getByRole('button', { name: 'יצירת התוכנית שלי' }).click();
  await expect(page).toHaveURL(/\/workouts\/plans\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await expect(page.getByRole('button', { name: 'התחלת האימון להיום' })).toBeVisible();
  await page.getByRole('article').first().getByText('למה היום הזה?').click();
  await shot(page, 'plan-active-he');
  await page.getByRole('article').first().getByRole('button', { name: 'עריכת היום' }).click();
  await expect(page.getByRole('article').first().getByRole('button', { name: /^הגדלת/ }).first()).toBeVisible();
  await shot(page, 'editor-he');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
