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

/** A toast with this text (the previous toast with the same text may still be fading out, so take the first). */
const toast = (page: Page, text: string | RegExp) => page.locator('.toasts').getByText(text).first();

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
  // Delete is immediate (no confirm dialog) and can be undone.
  await page.getByRole('button', { name: `Delete ${CHICKEN}` }).click();
  await expect(toast(page, `${CHICKEN} removed`)).toBeVisible();
  await expect(page.getByText('Nothing logged yet today')).toBeVisible();
  await page.locator('.toasts').getByRole('button', { name: 'Undo' }).click();
  await expect(toast(page, `${CHICKEN} put back`)).toBeVisible();
  await expect(breakfast.getByText(CHICKEN)).toBeVisible();
  await expect(page.getByRole('img', { name: /^151 of [\d,]+ kcal eaten$/ })).toBeVisible();
  await page.getByRole('button', { name: `Delete ${CHICKEN}` }).click();
  await expect(page.getByText('Nothing logged yet today')).toBeVisible();
});

async function apiPost(page: Page, path: string, data: unknown) {
  const me = await (await page.request.get('/api/auth/me')).json();
  const res = await page.request.post(path, { headers: { 'x-csrf-token': me.csrfToken, 'content-type': 'application/json' }, data });
  if (!res.ok()) throw new Error(`${path} failed: ${res.status()} ${await res.text()}`);
  return res.json();
}

const shiftDate = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

test('fewest taps: recent foods first, repeat yesterday, copy a meal to another day', async ({ page }) => {
  await readyUser(page);
  const { today } = await (await page.request.get('/api/dashboard')).json();
  const found = await (await page.request.get('/api/foods/search?q=chicken%20breast')).json();
  const chicken = found.foods.find((f: { name: { en: string } }) => f.name.en === CHICKEN);
  await apiPost(page, '/api/nutrition/logs', { date: shiftDate(today, -1), mealType: 'breakfast', foodId: chicken.id, grams: 200 });

  // Recent foods are offered before anything is typed, pre-filled with the last amount.
  await page.goto('/nutrition/log?meal=lunch');
  await expect(page.getByRole('heading', { name: 'Recently logged' })).toBeVisible();
  const recent = page.getByRole('list', { name: 'Recently logged' });
  await expect(recent.getByText('Last time: 200 g')).toBeVisible();
  await recent.getByRole('button', { name: `Add ${CHICKEN}` }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('textbox', { name: 'Amount', exact: true })).toHaveValue('200');
  await dialog.getByRole('button', { name: 'Cancel' }).click();

  // Same breakfast as yesterday in one tap, right from the log page.
  await page.goto('/nutrition/log?meal=breakfast');
  await page.getByRole('button', { name: 'Copy yesterday’s Breakfast' }).click();
  await expect(toast(page, 'Copied 1 item from yesterday')).toBeVisible();
  await expect(page.getByText(/Breakfast so far: 302 kcal · 1 item/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy yesterday’s Breakfast' })).toHaveCount(0);

  // Copy a meal to another day and jump there.
  await page.goto('/nutrition');
  await page.getByRole('button', { name: 'Copy Breakfast to another day' }).click();
  const copy = page.getByRole('dialog', { name: 'Copy Breakfast to another day' });
  await expect(copy.getByLabel('Copy to')).toHaveValue(shiftDate(today, 1));
  await copy.getByRole('button', { name: 'Copy', exact: true }).click();
  await expect(toast(page, /Copied 1 item from Breakfast to/)).toBeVisible();
  await page.locator('.toasts').getByRole('button', { name: 'Go to that day' }).click();
  await expect(page).toHaveURL(new RegExp(`date=${shiftDate(today, 1)}`));
  await expect(page.getByRole('list', { name: 'Breakfast' }).getByText(CHICKEN)).toBeVisible();
});

test('allergy warning is explicit at the moment of choosing a food', async ({ page }) => {
  await readyUser(page, { allergies: ['peanut'] });
  await page.goto('/nutrition/log?meal=snack');
  await page.getByLabel('Search foods').fill('peanuts');
  await page.getByRole('button', { name: 'Add Peanuts, dry-roasted, unsalted' }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Allergy warning')).toBeVisible();
  await expect(dialog.getByText(/contains an ingredient you listed as an allergy/)).toBeVisible();
  // Logging stays possible (it is the user's decision) but is labelled for what it is.
  await expect(dialog.getByRole('button', { name: 'Log', exact: true })).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Log anyway' }).click();
  await expect(toast(page, 'Peanuts, dry-roasted, unsalted added to Snack')).toBeVisible();
});

test('a saved meal keeps the corrections made to its entries', async ({ page }) => {
  await readyUser(page);
  await page.goto('/nutrition/log?meal=lunch');
  await page.getByLabel('Search foods').fill('chicken breast');
  await page.getByRole('button', { name: `Add ${CHICKEN}`, exact: true }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Log', exact: true }).click();
  await expect(toast(page, `${CHICKEN} added to Lunch`)).toBeVisible();

  await page.goto('/nutrition');
  await page.getByRole('button', { name: `Edit ${CHICKEN}` }).click();
  const edit = page.getByRole('dialog');
  await edit.getByRole('switch', { name: 'Correct nutrient values manually' }).click();
  await edit.getByLabel('Calories (kcal)').fill('250');
  await edit.getByRole('button', { name: 'Save' }).click();
  await expect(toast(page, 'Entry updated')).toBeVisible();

  await page.goto('/nutrition/log?meal=lunch&tab=saved');
  await page.getByRole('button', { name: 'Save Lunch as a meal' }).click();
  await page.getByRole('dialog').getByRole('textbox', { name: 'Meal name' }).fill('Label-checked lunch');
  await page.getByRole('dialog').getByRole('button', { name: 'Save meal' }).click();
  await expect(toast(page, '“Label-checked lunch” saved')).toBeVisible();
  await expect(page.getByText('Your corrected values are kept when you log this meal.')).toBeVisible();

  await page.getByLabel('Meal', { exact: true }).selectOption('dinner');
  await page.getByRole('button', { name: 'Log “Label-checked lunch” to Dinner' }).click();
  await expect(toast(page, '“Label-checked lunch” added to Dinner')).toBeVisible();
  await page.getByRole('link', { name: 'Done' }).click();
  const dinner = page.getByRole('list', { name: 'Dinner' });
  await expect(dinner.getByText('250 kcal')).toBeVisible();
  await expect(dinner.getByText('Corrected')).toBeVisible();
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
