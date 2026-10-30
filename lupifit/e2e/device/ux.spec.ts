/**
 * Device mode, screen by screen (static device build, no server, 390 px wide phone): the first run, a
 * workout from today's plan, the day's food and menu, a weigh-in, progress, the coach and the settings say
 * only what is true on a phone without a server; the backup file brings everything back on a fresh install;
 * Hebrew (RTL) screenshots of the main screens when DEVICE_SHOTS is set.
 */
import fs from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { appReady, eraseAll, expectFits, firstPage, generatePlan, launch, onboardViaUi, quickAdd, shot, toast, watch, welcome } from './helpers';

const PHONE = 390;

/** Goes to a page and checks it fits the phone's width. */
async function visit(page: Page, path: string, ready: Parameters<Page['getByRole']>, where = path) {
  await page.goto(path);
  await appReady(page);
  await expect(page.getByRole(...ready).first()).toBeVisible();
  await expectFits(page, where);
}

/** Logs the current exercise's first sets of the live workout (reps filled in when the target left them empty). */
async function logSets(page: Page, count: number) {
  for (let n = 1; n <= count; n++) {
    const complete = page.getByRole('button', { name: `Complete set ${n}`, exact: true });
    if (!(await complete.count())) break;
    const reps = page.getByLabel(`Set ${n} reps`, { exact: true });
    if ((await reps.count()) && !(await reps.inputValue())) await reps.fill('10');
    await complete.click();
    await expect(page.getByRole('button', { name: `Mark set ${n} as not done` })).toHaveAttribute('aria-pressed', 'true');
  }
}

test('first run to a finished workout, food, menu, weigh-in and progress, every screen at 390 px and honest about the phone', async ({ browserName }, testInfo) => {
  expect(browserName).toBe('chromium');
  test.setTimeout(420_000);
  const problems: string[] = [];
  const context = await launch(testInfo, { width: PHONE });
  const page = await firstPage(context);
  watch(page, problems);

  // ---- First run: a short welcome that asks only for a name; the questionnaire waits for it.
  await page.goto('/');
  await expect(page).toHaveURL(/\/welcome$/, { timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'Welcome to LUPU-FIT' })).toBeVisible();
  await expect(page.getByText('Your data is kept on this phone, not on a server.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Restore from a backup file' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Privacy policy' })).toBeVisible(); // legal pages stay reachable
  await expectFits(page, 'welcome');
  await page.goto('/onboarding');
  await expect(page).toHaveURL(/\/welcome$/);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Enter a name or a nickname.')).toBeVisible();
  await welcome(page, 'Dana');
  await expect(page.getByRole('button', { name: 'Log out' })).toHaveCount(0);
  await expectFits(page, 'onboarding');
  await onboardViaUi(page);
  await expect(page.locator('main').getByText(/Dana/).first()).toBeVisible();
  await expectFits(page, 'dashboard');
  await expect(page.getByRole('button', { name: 'Log out' })).toHaveCount(0);

  // ---- Today's workout: generate a plan, start it from the dashboard, log sets, finish.
  await generatePlan(page);
  await expectFits(page, 'plan');
  await visit(page, '/', ['button', { name: 'Start workout' }], 'dashboard with a plan');
  await page.getByRole('button', { name: 'Start workout' }).click();
  await expect(page).toHaveURL(/\/workouts\/session$/);
  await expect(page.getByRole('button', { name: 'Complete set 1', exact: true })).toBeVisible();
  await expectFits(page, 'live workout');
  await logSets(page, 2);
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  const finish = page.getByRole('dialog', { name: 'Finish workout?' });
  await finish.getByRole('button', { name: 'Finish workout' }).click();
  await expect(page).toHaveURL(/\/workouts\/sessions\/[0-9a-f-]{36}$/);
  await expect(page.getByRole('heading', { name: 'Workout complete' })).toBeVisible();
  await expectFits(page, 'workout summary');
  await visit(page, '/workouts/history', ['heading', { name: 'Workout history' }]);
  await expect(page.getByRole('link', { name: /^Open / })).toHaveCount(1);

  // ---- Nutrition: the day, the daily menu (log a dish), the food log without photo analysis.
  await visit(page, '/nutrition', ['heading', { name: 'Today’s menu' }]);
  await page.getByRole('link', { name: 'Open menu' }).click();
  await expect(page.getByRole('heading', { name: 'Daily menu', level: 1 })).toBeVisible();
  await expectFits(page, 'menu');
  const dish = page.locator('.menu-dish').first();
  const dishName = (await dish.locator('.menu-dish-name').textContent())!.trim();
  await dish.getByRole('button', { name: /^Log / }).click();
  await expect(toast(page, new RegExp(`${dishName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} added to`))).toBeVisible();
  await visit(page, '/nutrition', ['heading', { name: 'Today’s menu' }], 'nutrition day');
  await expect(page.getByText(dishName).first()).toBeVisible();
  await visit(page, '/nutrition/log', ['tab', { name: 'Search' }], 'food log');
  await expect(page.getByRole('tab', { name: 'Photo' })).toHaveCount(0); // meal-photo AI needs a server
  await page.getByRole('tab', { name: 'Barcode' }).click();
  await expect(page.getByText(/Barcode lookup needs internet\. Only the barcode number is sent/)).toBeVisible();
  await context.setOffline(true);
  await expect(page.getByText(/You're offline, so barcodes can't be looked up right now/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Look up' })).toBeDisabled();
  await context.setOffline(false);
  await expect(page.getByText(/You're offline, so barcodes/)).toHaveCount(0);
  await expectFits(page, 'barcode');

  // ---- Weigh-in and progress.
  await visit(page, '/progress', ['region', { name: 'Body weight' }]);
  const weight = page.getByRole('region', { name: 'Body weight' });
  await weight.getByRole('textbox', { name: 'Weight', exact: true }).fill('61.5');
  await weight.getByRole('button', { name: 'Save weight' }).click();
  await expect(page.getByText(/Weight saved/)).toBeVisible();
  await expect(weight.getByRole('listitem').filter({ hasText: '61.5 kg' })).toBeVisible();
  await expectFits(page, 'progress');

  // ---- Coach: the built-in coach answers; nothing about configuring an AI provider.
  await visit(page, '/coach', ['heading', { name: 'Coach', level: 1, exact: true }]);
  await expect(page.getByText(/The coach works on this phone/)).toBeVisible();
  await expect(page.getByText(/Configure an AI provider/)).toHaveCount(0);
  await expect(page.getByText(/messages left today/)).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Message the coach' }).fill('What is progressive overload?');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.locator('.coach-msg-author').filter({ hasText: 'Coach' }).first()).toBeVisible();
  await expectFits(page, 'coach');

  // ---- Settings: no account, password or web-push controls; the data on this phone comes first.
  await visit(page, '/profile', ['heading', { name: 'Your data on this phone' }], 'settings');
  await expect(page.getByText(/is stored only on this phone/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save backup file' })).toBeVisible();
  await expect(page.getByText('No backup file has been saved on this phone yet.')).toBeVisible();
  for (const gone of ['Change password', 'Log out of all devices', 'Delete my account', 'Download my data', 'Turn on phone notifications']) {
    await expect(page.getByRole('button', { name: gone })).toHaveCount(0);
  }
  await expect(page.getByLabel('Email')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Security' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Privacy policy' }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Erase all data' }).click();
  await expect(page.getByRole('dialog', { name: 'Erase all data on this phone?' })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();

  // ---- Hebrew (RTL) pass over the main screens: the language follows the settings.
  await page.locator('#settings-account').getByRole('radio', { name: 'עברית' }).click();
  await page.locator('#settings-account').getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', { name: 'הנתונים שלך בטלפון הזה' })).toBeVisible();
  const he: [string, string, Parameters<Page['getByRole']>][] = [
    ['he-10-dashboard', '/', ['heading', { level: 1 }]],
    ['he-11-workouts', '/workouts', ['heading', { level: 1 }]],
    ['he-13-history', '/workouts/history', ['heading', { level: 1 }]],
    ['he-14-nutrition', '/nutrition', ['heading', { name: 'התפריט להיום' }]],
    ['he-15-menu', '/nutrition/menu', ['heading', { level: 1 }]],
    ['he-16-food-log', '/nutrition/log?tab=barcode', ['tab', { name: 'ברקוד' }]],
    ['he-17-progress', '/progress', ['heading', { level: 1 }]],
    ['he-18-coach', '/coach', ['heading', { name: 'מאמן', level: 1, exact: true }]],
    ['he-19-settings', '/profile', ['heading', { name: 'הנתונים שלך בטלפון הזה' }]],
    ['he-20-notifications', '/notifications', ['heading', { level: 1 }]],
  ];
  for (const [name, path, ready] of he) {
    await visit(page, path, ready, `${path} (he)`);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await shot(page, name);
  }
  // The plan, and a live workout started from it.
  await page.goto('/workouts');
  await page.locator('a[href^="/workouts/plans/"]').first().click();
  await expect(page).toHaveURL(/\/workouts\/plans\/[0-9a-f-]{36}$/);
  await expect(page.getByRole('button', { name: 'התחלת האימון להיום' })).toBeVisible();
  await expectFits(page, 'plan (he)');
  await shot(page, 'he-12-plan');
  await page.getByRole('button', { name: 'התחלת האימון להיום' }).click();
  await expect(page).toHaveURL(/\/workouts\/session$/);
  await expect(page.getByRole('button', { name: 'סיום', exact: true })).toBeVisible();
  await expectFits(page, 'live workout (he)');
  await shot(page, 'he-21-live-workout');
  await page.goto('/profile');
  await page.getByRole('button', { name: 'מחיקת כל הנתונים' }).click();
  await expect(page.getByRole('dialog', { name: 'למחוק את כל הנתונים בטלפון?' })).toBeVisible();
  await shot(page, 'he-22-erase-step-1', { screen: true });
  await page.getByRole('dialog').getByRole('button', { name: 'המשך' }).click();
  await expect(page.getByRole('dialog', { name: 'בדיקה אחרונה' })).toBeVisible();
  await shot(page, 'he-23-erase-step-2', { screen: true });
  await page.getByRole('dialog').getByRole('button', { name: 'ביטול' }).click();

  await context.close();
  expect(problems).toEqual([]);
});

test('backup file round trip: save it, erase the phone, restore everything on the fresh install', async ({ browserName }, testInfo) => {
  expect(browserName).toBe('chromium');
  test.setTimeout(300_000);
  const problems: string[] = [];
  const context = await launch(testInfo, { width: PHONE });
  const page = await firstPage(context);
  watch(page, problems);
  await page.goto('/');
  await welcome(page, 'Dana');
  await onboardViaUi(page);
  await generatePlan(page);
  const planName = (await page.getByRole('heading', { level: 1 }).textContent())!.trim();
  await quickAdd(page, 'lunch', 'Lunch', 'Backup soup', 210);

  // ---- Save the backup file (web: a download; the Android app hands it to the save/share sheet).
  await page.goto('/profile');
  await expect(page.getByText('No backup file has been saved on this phone yet.')).toBeVisible();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Save backup file' }).click()]);
  expect(download.suggestedFilename()).toMatch(/^lupu-fit-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const file = testInfo.outputPath('backup.json');
  await download.saveAs(file);
  await expect(toast(page, 'Backup file saved')).toBeVisible();
  await expect(page.getByText(/^Last backup file saved: /)).toBeVisible();
  const text = fs.readFileSync(file, 'utf8');
  const backup = JSON.parse(text);
  expect(backup).toMatchObject({ format: 'lupu-fit-backup', version: 1, device: { snapshot: { format: 'lupu-fit-device-data', version: 1 } } });
  expect(backup.device.snapshot.tables.food_log_entries).toHaveLength(1);
  expect(text).toContain('Backup soup');
  // Never the hidden account's credentials or session.
  expect(text).not.toMatch(/@device\.lupufit|scrypt\$|fitai_session|password_hash/);

  // ---- A fresh install (erase everything), then restore from the welcome screen.
  await eraseAll(page);
  await page.getByTestId('device-backup-file').setInputFiles(file);
  const dialog = page.getByRole('dialog', { name: 'Restore from a backup file' });
  await expect(dialog.getByText('Your profile and settings', { exact: true })).toBeVisible();
  await expect(dialog.getByText('1 workout plan', { exact: true })).toBeVisible();
  await expect(dialog.getByText(/finished workout|coach conversation/)).toHaveCount(0); // none in this file
  await expect(dialog.getByText('1 food diary entry', { exact: true })).toBeVisible();
  await expect(dialog.getByText('1 weigh-in', { exact: true })).toBeVisible();
  await expect(dialog.getByText(/replaces everything/)).toHaveCount(0); // nothing on a fresh phone to replace
  await expectFits(page, 'restore dialog');
  await shot(page, 'en-30-restore-dialog', { screen: true });
  await dialog.getByRole('button', { name: 'Restore' }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 60_000 });
  await expect(toast(page, 'Your backup was restored.')).toBeVisible();
  await expect(page.locator('main').getByText(/Dana/).first()).toBeVisible();
  await page.goto('/nutrition');
  await expect(page.getByRole('list', { name: 'Lunch' }).getByText('Backup soup')).toBeVisible();
  await page.goto('/workouts');
  await expect(page.getByText(planName).first()).toBeVisible();
  await page.goto('/progress');
  await expect(page.getByRole('region', { name: 'Body weight' }).getByRole('listitem').filter({ hasText: '62 kg' })).toBeVisible();

  // ---- From the settings, a restore says that it replaces what is on the phone now.
  await page.goto('/profile');
  await page.getByTestId('device-backup-file').setInputFiles(file);
  await expect(page.getByRole('dialog', { name: 'Restore from a backup file' }).getByText(/replaces everything that is on this phone now/)).toBeVisible();
  await shot(page, 'en-31-restore-replacing', { screen: true });
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  // A file that is not a backup is refused before anything changes.
  const notBackup = testInfo.outputPath('notes.json');
  fs.writeFileSync(notBackup, JSON.stringify({ hello: 'world' }));
  await page.getByTestId('device-backup-file').setInputFiles(notBackup);
  await expect(toast(page, 'This is not a LUPU-FIT backup file.')).toBeVisible();

  await context.close();
  expect(problems).toEqual([]);
});

test('Hebrew first launch: start-up screen, welcome and "open in another tab" (RTL, 390 px)', async ({ browserName }, testInfo) => {
  expect(browserName).toBe('chromium');
  test.setTimeout(180_000);
  const problems: string[] = [];
  const context = await launch(testInfo, { width: PHONE, locale: 'he' });
  const page = await firstPage(context);
  watch(page, problems);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'מכינים את LUPU-FIT' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expectFits(page, 'start-up (he)');
  await shot(page, 'he-01-start-up');
  await expect(page).toHaveURL(/\/welcome$/, { timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'ברוכים הבאים ל-LUPU-FIT' })).toBeVisible();
  await expectFits(page, 'welcome (he)');
  await shot(page, 'he-02-welcome');
  await page.getByRole('button', { name: 'המשך' }).click();
  await expect(page.getByText('כתבו שם או כינוי.')).toBeVisible();
  await shot(page, 'he-03-welcome-name-missing');

  const second = await context.newPage();
  watch(second, problems);
  await second.goto('/');
  await expect(second.getByRole('heading', { name: 'LUPU-FIT כבר פתוח בכרטיסייה אחרת' })).toBeVisible();
  await expectFits(second, 'locked (he)');
  await shot(second, 'he-04-open-in-another-tab');
  await second.close();

  await page.getByLabel('איך לקרוא לך?').fill('דנה');
  await page.getByRole('button', { name: 'המשך' }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByRole('button', { name: 'התנתקות' })).toHaveCount(0);
  await expectFits(page, 'onboarding (he)');
  await shot(page, 'he-05-onboarding');
  await context.close();
  expect(problems).toEqual([]);
});
