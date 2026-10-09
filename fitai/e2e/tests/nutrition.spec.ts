import zlib from 'node:zlib';
import { expect, test, type Page } from '@playwright/test';
import pg from 'pg';
import { readyUser, useEnglish } from './helpers';

const DATABASE_URL = process.env.E2E_DATABASE_URL ?? 'postgres://fitai:fitai_dev_password@127.0.0.1:5432/fitai_e2e';
const CHICKEN = 'Chicken breast, skinless, grilled';

/** A small, valid PNG (solid colour) generated in memory. */
function makePng(width = 24, height = 16): Buffer {
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: RGB
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(width * 3, Buffer.from([0xe0, 0x8a, 0x3c]))]);
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

test.beforeAll(async () => {
  // The built-in meal templates may not be present in every environment; add a known one.
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await client.query(
      `INSERT INTO meal_templates (slug, name, description, meal_types, items, prep_minutes)
       VALUES ('e2e_chicken_rice_bowl', $1, $2, ARRAY['lunch','dinner'], $3, 15)
       ON CONFLICT (slug) DO NOTHING`,
      [
        JSON.stringify({ en: 'E2E chicken rice bowl', he: 'קערת עוף ואורז E2E' }),
        JSON.stringify({ en: 'Grilled chicken with white rice.', he: 'חזה עוף צלוי עם אורז לבן.' }),
        JSON.stringify([
          { foodSlug: 'chicken_breast_cooked', grams: 150 },
          { foodSlug: 'rice_white_cooked', grams: 150 },
        ]),
      ],
    );
  } finally {
    await client.end();
  }
});

test.beforeEach(async ({ page }) => {
  await useEnglish(page);
});

const toast = (page: Page, text: string | RegExp) => page.locator('.toasts').getByText(text);

test('search, preview, log, edit, correct and delete a food', async ({ page }) => {
  await readyUser(page);
  await page.goto('/nutrition/log?meal=breakfast');
  await expect(page.getByRole('heading', { name: 'Log food', level: 1 })).toBeVisible();

  await page.getByLabel('Search foods').fill('chicken breast');
  await page.getByRole('button', { name: `Add ${CHICKEN}`, exact: true }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: `Add ${CHICKEN}` })).toBeVisible();
  // One serving (120 g) is pre-filled: 151 kcal/100 g → 181 kcal.
  await expect(dialog.getByText('181', { exact: true })).toBeVisible();
  await dialog.getByRole('textbox', { name: 'Amount', exact: true }).fill('200');
  await expect(dialog.getByText('302', { exact: true })).toBeVisible();
  await expect(dialog.getByText('61 g', { exact: true })).toBeVisible();
  await expect(dialog.getByLabel('Meal')).toHaveValue('breakfast');
  await dialog.getByRole('button', { name: 'Log', exact: true }).click();
  await expect(toast(page, `${CHICKEN} added to Breakfast`)).toBeVisible();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Breakfast so far: 302 kcal')).toBeVisible();

  await page.getByRole('link', { name: 'Done' }).click();
  await expect(page).toHaveURL(/\/nutrition\?date=/);
  await expect(page.getByRole('img', { name: /^302 of [\d,]+ kcal eaten$/ })).toBeVisible();
  const breakfast = page.getByRole('list', { name: 'Breakfast' });
  await expect(breakfast.getByText(CHICKEN)).toBeVisible();
  await expect(breakfast.getByText('302 kcal')).toBeVisible();

  // Edit the amount.
  await page.getByRole('button', { name: `Edit ${CHICKEN}` }).click();
  const edit = page.getByRole('dialog');
  await expect(edit.getByRole('heading', { name: 'Edit entry' })).toBeVisible();
  await edit.getByRole('textbox', { name: 'Amount', exact: true }).fill('100');
  await expect(edit.getByText('151', { exact: true })).toBeVisible();
  await edit.getByRole('button', { name: 'Save' }).click();
  await expect(toast(page, 'Entry updated')).toBeVisible();
  await expect(page.getByRole('img', { name: /^151 of [\d,]+ kcal eaten$/ })).toBeVisible();

  // Correct the nutrient values manually.
  await page.getByRole('button', { name: `Edit ${CHICKEN}` }).click();
  await edit.getByRole('switch', { name: 'Correct nutrient values manually' }).click();
  await edit.getByLabel('Calories (kcal)').fill('180');
  await edit.getByRole('button', { name: 'Save' }).click();
  await expect(toast(page, 'Entry updated')).toBeVisible();
  await expect(breakfast.getByText('Corrected')).toBeVisible();
  await expect(breakfast.getByText('180 kcal')).toBeVisible();

  // Revert, then delete.
  await page.getByRole('button', { name: `Edit ${CHICKEN}` }).click();
  await edit.getByRole('button', { name: 'Revert to calculated values' }).click();
  await expect(toast(page, 'Values recalculated from the food')).toBeVisible();
  await expect(breakfast.getByText('Corrected')).toBeHidden();
  await page.getByRole('button', { name: `Delete ${CHICKEN}` }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
  await expect(toast(page, 'Entry deleted')).toBeVisible();
  await expect(page.getByText('Nothing logged yet today')).toBeVisible();
});

test('custom food, quick add, saved meal and re-log', async ({ page }) => {
  await readyUser(page);
  await page.goto('/nutrition/log?meal=lunch&tab=custom');
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('E2E protein pudding');
  await page.getByLabel('Category').selectOption('dairy');
  await page.getByLabel('Calories (kcal)').fill('95');
  await page.getByLabel('Protein (g)').fill('10');
  await page.getByLabel('Carbohydrates (g)').fill('9');
  await page.getByLabel('Fat (g)').fill('2');
  await page.getByLabel('Serving size (g)').fill('150');
  await page.getByRole('button', { name: 'Create and log' }).click();
  await expect(toast(page, '“E2E protein pudding” created')).toBeVisible();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Add E2E protein pudding' })).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Amount', exact: true })).toHaveValue('150');
  await dialog.getByRole('button', { name: 'Log', exact: true }).click();
  await expect(toast(page, 'E2E protein pudding added to Lunch')).toBeVisible();
  await expect(page.getByRole('list').getByText('E2E protein pudding')).toBeVisible(); // listed under "My foods"

  await page.getByRole('tab', { name: 'Quick add' }).click();
  await page.getByRole('textbox', { name: 'Description' }).fill('Office cake');
  await page.getByLabel('Calories (kcal)').fill('350');
  await page.getByRole('button', { name: 'Add to Lunch' }).click();
  await expect(toast(page, 'Office cake added to Lunch')).toBeVisible();
  await expect(page.getByText(/Lunch so far: 493 kcal · 2 items/)).toBeVisible();

  await page.getByRole('tab', { name: 'Saved meals' }).click();
  await page.getByRole('button', { name: 'Save Lunch as a meal' }).click();
  const save = page.getByRole('dialog');
  await save.getByRole('textbox', { name: 'Meal name' }).fill('E2E lunch');
  await save.getByRole('button', { name: 'Save meal' }).click();
  await expect(toast(page, '“E2E lunch” saved')).toBeVisible();
  await expect(page.getByText('E2E lunch', { exact: true })).toBeVisible();
  await expect(page.getByText('1 item', { exact: true })).toBeVisible(); // quick-add items are not saved

  await page.getByLabel('Meal', { exact: true }).selectOption('dinner');
  await page.getByRole('button', { name: 'Log “E2E lunch” to Dinner' }).click();
  await expect(toast(page, '“E2E lunch” added to Dinner')).toBeVisible();

  await page.getByRole('link', { name: 'Done' }).click();
  await expect(page.getByRole('list', { name: 'Dinner' }).getByText('E2E protein pudding')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Lunch' }).getByText('Office cake')).toBeVisible();
  await expect(page.getByRole('img', { name: /^635 of [\d,]+ kcal eaten$/ })).toBeVisible();
});

test('suggestions tab shows meal ideas that can be logged', async ({ page }) => {
  await readyUser(page);
  await page.goto('/nutrition/log?meal=lunch&tab=suggestions');
  await expect(page.getByRole('heading', { name: 'Ideas for Lunch' })).toBeVisible();
  const cards = page.getByRole('article');
  await expect(cards.first()).toBeVisible();
  const card = cards.first();
  const name = (await card.getAttribute('aria-label'))!;
  // Changing the portion updates the totals shown on the card.
  const totals = card.locator('.macro-line');
  await card.getByRole('radio', { name: '0.5×' }).click();
  const half = await totals.textContent();
  await card.getByRole('radio', { name: '1×' }).click();
  await expect(totals).not.toHaveText(half!);
  await card.getByRole('button', { name: `Log ${name}` }).click();
  await expect(toast(page, `${name} added to Lunch`)).toBeVisible();
  await expect(page.getByText(/Lunch so far: [1-9][\d,]* kcal/)).toBeVisible();
});

test('photo analysis: review the AI estimate and log it', async ({ page }) => {
  await readyUser(page);
  await page.goto('/nutrition/log?meal=dinner&tab=photo');
  await page.getByLabel('Take or choose a photo').setInputFiles({ name: 'meal.png', mimeType: 'image/png', buffer: makePng() });
  await expect(page.getByRole('heading', { name: 'Review before logging' })).toBeVisible();
  await expect(page.getByText('These are estimates from a photo — please check each name, amount and match.')).toBeVisible();
  await expect(page.getByText('Estimated from a single photo.')).toBeVisible();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('grilled chicken breast');
  await expect(page.getByLabel('Amount (g)')).toHaveValue('150');
  await expect(page.getByText('Medium confidence')).toBeVisible();
  await expect(page.getByText(CHICKEN, { exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Your meal photo' })).toBeVisible();
  await page.getByLabel('Amount (g)').fill('200');
  await expect(page.getByText('Selected: 302 kcal')).toBeVisible();
  await page.getByRole('button', { name: 'Log selected items' }).click();
  await expect(toast(page, '1 item added to Dinner')).toBeVisible();
  await expect(page.getByText(/Dinner so far: 302 kcal · 1 item/)).toBeVisible();
});

test('date navigation on the nutrition dashboard @mobile', async ({ page }) => {
  await readyUser(page);
  await page.goto('/nutrition');
  await expect(page.getByRole('heading', { name: 'Nutrition', level: 1 })).toBeVisible();
  const title = page.locator('.nutri-date-title');
  await expect(title).toHaveText('Today');
  await page.getByRole('button', { name: 'Previous day' }).click();
  await expect(title).toHaveText('Yesterday');
  await expect(page).toHaveURL(/date=\d{4}-\d{2}-\d{2}/);
  await expect(page.getByText('Nothing logged for this day')).toBeVisible();
  await page.getByRole('button', { name: 'Today', exact: true }).click();
  await expect(title).toHaveText('Today');
  await page.getByRole('button', { name: 'Next day' }).click();
  await expect(title).toHaveText('Tomorrow');
  await expect(page.getByRole('button', { name: 'Next day' })).toBeDisabled();
  // "Add" on a meal opens the log page for that meal and date.
  await page.getByRole('link', { name: 'Add food to Snacks' }).click();
  await expect(page).toHaveURL(/\/nutrition\/log\?date=\d{4}-\d{2}-\d{2}&meal=snack/);
  await expect(page.getByLabel('Meal', { exact: true })).toHaveValue('snack');
});

test('barcode: unknown code → custom food with that barcode → found on the next lookup; copy yesterday’s meal', async ({ page }) => {
  await readyUser(page);
  const code = `729${Date.now() % 10_000_000_000}`.slice(0, 13);
  await page.goto('/nutrition/log?meal=breakfast&tab=barcode');
  await page.getByLabel('Barcode number').fill(code);
  await page.getByRole('button', { name: 'Look up' }).click();
  await expect(page.getByText('No product found for this barcode.')).toBeVisible();
  await page.getByRole('button', { name: 'Add it as a custom food' }).click();
  await expect(page.getByRole('textbox', { name: 'Barcode', exact: true })).toHaveValue(code);
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('E2E granola');
  await page.getByLabel('Category').selectOption('grains');
  await page.getByLabel('Calories (kcal)').fill('450');
  await page.getByLabel('Protein (g)').fill('10');
  await page.getByLabel('Carbohydrates (g)').fill('60');
  await page.getByLabel('Fat (g)').fill('18');
  await page.getByLabel('Serving size (g)').fill('40');
  await page.getByRole('button', { name: 'Create and log' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();

  await page.getByRole('tab', { name: 'Barcode' }).click();
  await page.getByLabel('Barcode number').fill(code);
  await page.getByRole('button', { name: 'Look up' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Add E2E granola' })).toBeVisible();
  // One 40 g serving of 450 kcal/100 g = 180 kcal.
  await expect(dialog.getByText('180', { exact: true })).toBeVisible();
  // Log it to yesterday's breakfast.
  const today = await dialog.getByLabel('Date').inputValue();
  const yesterday = new Date(Date.parse(`${today}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  await dialog.getByLabel('Date').fill(yesterday);
  await dialog.getByRole('button', { name: 'Log', exact: true }).click();
  await expect(toast(page, 'E2E granola added to Breakfast')).toBeVisible();

  // Today's breakfast is empty → "Same as yesterday" copies it.
  await page.goto('/nutrition');
  await page.getByRole('button', { name: 'Copy yesterday’s Breakfast' }).click();
  await expect(toast(page, 'Copied 1 item from yesterday')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Breakfast' }).getByText('E2E granola')).toBeVisible();
  await expect(page.getByRole('img', { name: /^180 of [\d,]+ kcal eaten$/ })).toBeVisible();
});
