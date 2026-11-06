import { readFileSync, writeFileSync } from 'node:fs';
import { expect, FOOD_QUERY, logFirstFood, onboard, test, type Page } from './fixtures.ts';
import type { TFn } from '../copy.ts';

const ASK = { he: 'כמה חלבון אני צריך ביום?', en: 'How much protein do I need per day?' };
const MEAL = 'E2E meal';
const OWN_FOOD = 'E2E bar';

interface BackupFile {
  backup: {
    version: number; mode: string; appVersion: string; profile: { displayName?: string } | null; foodLog: unknown[];
    plans: { name: string; active: boolean }[]; savedMeals: { name: string }[]; customFoods: { name: string }[];
    coachThreads: { title: string; messages: { role: string }[] }[]; xpEvents: unknown[];
  };
  extra: { account: unknown };
  clientSettings?: { v: number; language?: string };
}

/** Everything this test puts in the app, one of each kind the backup must bring back. */
async function seedEverything(page: Page, t: TFn, lang: 'he' | 'en'): Promise<string> {
  // Profile
  await page.goto('/profile');
  await page.getByLabel(t('profile.f.displayName')).fill('Dana Device');
  await page.getByRole('button', { name: t('action.save'), exact: true }).click();
  await expect(page.getByText(t('profile.saved'))).toBeVisible();
  await page.reload();
  await expect(page.getByLabel(t('profile.f.displayName'))).toHaveValue('Dana Device');

  // Food log entry, saved meal
  const foodName = await logFirstFood(page, t, FOOD_QUERY[lang].a);
  await page.goto('/nutrition');
  await expect(page.locator('.nu-entries li')).toHaveCount(1);
  await page.getByRole('button', { name: t('nutrition.hub.saveMeal') }).first().click();
  await page.getByLabel(t('nutrition.hub.mealName')).fill(MEAL);
  await page.getByRole('dialog').getByRole('button', { name: t('action.save'), exact: true }).click();
  await expect(page.getByText(MEAL).first()).toBeVisible();

  // Own food (per 100 g)
  await page.goto('/nutrition/log');
  await page.getByRole('button', { name: new RegExp(t('nutrition.log.mode.custom')) }).click();
  await page.getByLabel(t('nutrition.quick.name')).fill(OWN_FOOD);
  await page.getByLabel(t('nutrition.custom.kcal100')).fill('400');
  await page.getByLabel(t('nutrition.protein')).fill('30');
  await page.getByLabel(t('nutrition.carbs')).fill('40');
  await page.getByLabel(t('nutrition.fat')).fill('10');
  await page.getByRole('button', { name: t('nutrition.custom.save'), exact: true }).click();
  await expect(page.getByText(t('nutrition.custom.saved')).first()).toBeVisible();

  // Training plan
  await page.goto('/workouts?tab=generator');
  await page.getByRole('button', { name: t('workouts.gen.generate'), exact: true }).click();
  await expect(page.getByRole('region', { name: t('workouts.gen.previewTitle') })).toBeVisible();
  await page.getByRole('button', { name: t('workouts.gen.save'), exact: true }).click();
  await expect(page).toHaveURL(/\/workouts\/plans\/[^/]+$/);

  // Coach chat with an answer
  await page.goto('/coach');
  await page.getByRole('textbox', { name: t('coach.inputLabel') }).fill(ASK[lang]);
  await page.getByRole('button', { name: t('coach.send'), exact: true }).click();
  await expect(page.getByTestId('message-assistant').first()).toBeVisible();
  await expect(page.getByTestId('message-pending')).toHaveCount(0);
  return foodName;
}

/** Everything seedEverything made is on screen: exactly one of each (a restore REPLACES, it never stacks a second copy). */
async function expectEverything(page: Page, t: TFn, lang: 'he' | 'en', foodName: string): Promise<void> {
  await page.goto('/profile');
  await expect(page.getByLabel(t('profile.f.displayName'))).toHaveValue('Dana Device');
  await page.goto('/nutrition');
  await expect(page.locator('.nu-entries li')).toHaveCount(1);
  await expect(page.locator('.nu-entries li .nu-entry-name strong').first()).toHaveText(foodName);
  await expect(page.getByText(MEAL)).toHaveCount(1);
  await page.goto('/nutrition/log');
  await page.getByRole('searchbox').fill(OWN_FOOD);
  await expect(page.locator('.nu-results .nu-result')).toHaveCount(1);
  await expect(page.locator('.nu-results .nu-result').first()).toContainText(OWN_FOOD);
  await page.goto('/workouts?tab=plans');
  await expect(page.locator('a[href^="/workouts/plans/"]').first()).toBeVisible();
  // one plan, however many links lead to it (its name and "continue")
  expect(await page.locator('a[href^="/workouts/plans/"]').evaluateAll((els) => new Set(els.map((e) => (e.getAttribute('href') ?? '').split('?')[0])).size)).toBe(1);
  await page.goto('/coach');
  await page.getByRole('button', { name: t('coach.chats') }).click();
  const threads = page.getByRole('dialog').locator('.thread-list li');
  await expect(threads).toHaveCount(1);
  await expect(threads.first()).toContainText(ASK[lang].slice(0, 12));
  await threads.first().locator('.thread-btn').click();
  await expect(page.getByTestId('message-assistant').first()).toBeVisible();
  await expect(page.getByTestId('message-assistant')).toHaveCount(1);
}

test('backup: export holds everything; restore replaces (never duplicates) and brings plans, saved meals, own foods, coach chats and the profile back after "delete all data"', async ({ app: page, t, lang }, info) => {
  test.setTimeout(300_000);
  await onboard(page);
  const foodName = await seedEverything(page, t, lang);

  // Export
  await page.goto('/profile');
  await expect(page.getByText(t('profile.backup.hint'))).toBeVisible();
  await expect(page.getByText(t('profile.backup.hint'))).toContainText(lang === 'he' ? 'שיחות המאמן' : 'coach chats'); // the device copy says what the file holds
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: new RegExp(t('profile.backup.export')) }).click();
  const download = await dl;
  const file = info.outputPath('backup.json');
  await download.saveAs(file);
  const exported = JSON.parse(readFileSync(file, 'utf8')) as BackupFile;
  expect(exported.backup).toMatchObject({ version: 2, mode: 'device' });
  expect(exported.backup.appVersion).not.toBe('');
  expect(exported.backup.foodLog).toHaveLength(1);
  expect(exported.backup.profile?.displayName).toBe('Dana Device');
  expect(exported.backup.savedMeals.map((m) => m.name)).toEqual([MEAL]);
  expect(exported.backup.customFoods.map((f) => f.name)).toEqual([OWN_FOOD]);
  expect(exported.backup.plans).toHaveLength(1);
  expect(exported.backup.coachThreads).toHaveLength(1);
  expect(exported.backup.coachThreads[0]?.messages.map((m) => m.role)).toEqual(['user', 'assistant']);
  expect(exported.extra.account).toBeNull(); // no account exists on the device, so the file does not invent one
  expect(exported.clientSettings).toMatchObject({ v: 1, language: lang }); // the browser-only block is separate, and holds only whitelisted settings
  expect(readFileSync(file, 'utf8')).not.toMatch(/device_[0-9a-f]{8}|password|token/i);

  // Change the data, then restore the file: the confirmation says what is replaced, the result says what came back, nothing is doubled.
  await logFirstFood(page, t, FOOD_QUERY[lang].b);
  await page.goto('/nutrition');
  await expect(page.locator('.nu-entries li')).toHaveCount(2);
  await page.goto('/profile');
  await page.getByLabel(t('profile.backup.pick')).setInputFiles(file);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(t('profile.backup.confirmBody'));
  for (const key of ['workouts', 'foods', 'weights', 'readiness', 'plans', 'savedMeals', 'customFoods']) await expect(dialog).toContainText(t(`profile.backup.item.${key}`, { n: '' }).replace(/\s*$/, ''));
  await expect(dialog).toContainText(t('profile.backup.item.coach', { n: 1, m: 2 }));
  await dialog.getByRole('button', { name: t('profile.backup.confirmGo') }).click();
  const result = page.getByTestId('restore-result');
  await expect(result).toBeVisible();
  await expect(result).toContainText(t('profile.backup.done.title'));
  await expect(result).toContainText(t('profile.backup.item.coach', { n: 1, m: 2 }));
  await expect(result).toContainText(t('profile.backup.item.plans', { n: 1 }));
  await expect(result).toContainText(t('profile.backup.item.savedMeals', { n: 1 }));
  await expect(result).toContainText(t('profile.backup.item.customFoods', { n: 1 }));
  await expectEverything(page, t, lang, foodName);

  // Restoring the same file again changes nothing (replace, not merge).
  await page.goto('/profile');
  await page.getByLabel(t('profile.backup.pick')).setInputFiles(file);
  await page.getByRole('dialog').getByRole('button', { name: t('profile.backup.confirmGo') }).click();
  await expect(page.getByTestId('restore-result')).toBeVisible();
  await expectEverything(page, t, lang, foodName);

  // Files that are refused calmly: not a backup, damaged, made by a newer app. Nothing changes and no dialog opens.
  const refuse = async (name: string, content: string, message: string) => {
    const bad = info.outputPath(name);
    writeFileSync(bad, content);
    await page.goto('/profile');
    await page.getByLabel(t('profile.backup.pick')).setInputFiles(bad);
    await expect(page.getByRole('alert').filter({ hasText: message })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  };
  await refuse('wrong.json', '{"hello":1}', t('profile.backup.wrongFile'));
  await refuse('broken.json', '{"hello":', t('profile.backup.notJson'));
  await refuse('newer.json', JSON.stringify({ ...exported.backup, version: 3 }), t('profile.backup.newer', { v: 3 }));
  await refuse('damaged.json', JSON.stringify({ ...exported.backup, plans: 'nope' }), t('profile.backup.invalid', { path: 'plans' }));
  await expectEverything(page, t, lang, foodName);

  // Delete all data: honest wording, typed confirmation, then a clean slate and a new hidden profile.
  await page.goto('/profile');
  await page.getByRole('link', { name: t('profile.account.delete') }).click();
  await expect(page).toHaveURL(/\/account-deletion$/);
  await page.getByRole('button', { name: t('legal.deletion.open') }).click();
  const del = page.getByRole('dialog');
  await expect(del).toContainText(t('legal.deletion.sheetBody'));
  await del.getByLabel(t('legal.deletion.typeLabel')).fill('DELETE');
  await del.getByRole('button', { name: t('legal.deletion.confirm') }).click();
  await expect(page).toHaveURL(/\/welcome$/, { timeout: 30_000 });

  // The app re-provisioned itself: onboarding works again and nothing of the deleted person is left.
  await onboard(page);
  await page.goto('/profile');
  await expect(page.getByLabel(t('profile.f.displayName'))).toHaveValue('');
  await page.goto('/nutrition');
  await expect(page.locator('.nu-entries li')).toHaveCount(0);
  await expect(page.getByText(MEAL)).toHaveCount(0);
  await page.goto('/workouts?tab=plans');
  await expect(page.locator('a[href^="/workouts/plans/"]')).toHaveCount(0);
  await page.goto('/coach');
  await page.getByRole('button', { name: t('coach.chats') }).click();
  await expect(page.getByRole('dialog').getByText(t('coach.noThreads'))).toBeVisible();

  // The backup file brings all of it back: profile, food log, saved meal, own food, plan, coach chat.
  await page.goto('/profile');
  await page.getByLabel(t('profile.backup.pick')).setInputFiles(file);
  await page.getByRole('dialog').getByRole('button', { name: t('profile.backup.confirmGo') }).click();
  await expect(page.getByTestId('restore-result')).toContainText(t('profile.backup.done.title'));
  await expectEverything(page, t, lang, foodName);
});
