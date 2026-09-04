import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { learningPaths } from '../src/lib/content';
import { messages } from '../src/lib/i18n';
import { questMessages } from '../src/lib/quest-i18n';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const he = messages.he;
const en = messages.en;
const quest = questMessages.he;
const website = learningPaths.find(path => path.id === 'website')!;
const firstTask = website.chapters[0].tasks[0];
const proofPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFJkAAAAASUVORK5CYII=', 'base64');

async function post(request: APIRequestContext, path: string, data: unknown) {
  const response = await request.post(`${baseURL}/api/${path}`, { headers: { origin: baseURL }, data });
  const body = await response.json();
  expect(response.ok(), `${path}: ${JSON.stringify(body)}`).toBeTruthy();
  return body;
}
async function state(request: APIRequestContext) {
  const response = await request.get(`${baseURL}/api/state`);
  expect(response.ok()).toBeTruthy();
  return response.json();
}
async function createLearner(page: Page, label: string, enroll = false) {
  const catalog = await page.request.get(`${baseURL}/api/catalog`).then(response => response.json());
  expect(catalog.isDemo, 'E2E fixtures must run with DEMO_MODE=true').toBe(true);
  const opened = await post(page.request, 'auth/guest', { displayName: `בדיקת E2E ${label}`.slice(0, 60) });
  await post(page.request, 'settings', { birthYear: 1995 });
  if (enroll) await post(page.request, 'enrollments', { pathId: 'website', skill: website.title.he, level: 'beginner', dailyMinutes: 20, goal: 'לבנות עמוד אישי עם פעולה עובדת', styles: ['practice'] });
  return opened.user.email as string;
}

test('an account opens from the landing page and task XP survives a reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: he.startNow, exact: true }).first().click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

  await page.goto('/onboarding');
  await page.getByRole('button', { name: website.title.he, exact: true }).click();
  await page.getByRole('button', { name: he.next, exact: true }).click();
  await page.getByRole('button', { name: he.beginner, exact: true }).click();
  await page.getByRole('button', { name: he.next, exact: true }).click();
  await page.getByRole('button', { name: `20 ${he.minutes}`, exact: true }).click();
  await page.getByRole('button', { name: he.next, exact: true }).click();
  await page.getByLabel(he.goal, { exact: true }).fill('לבנות אתר אישי עם שלוש דוגמאות וכפתור עובד');
  await page.getByRole('button', { name: he.next, exact: true }).click();
  await page.getByRole('button', { name: he.practice, exact: true }).click();
  await page.getByRole('button', { name: he.next, exact: true }).click();
  await page.getByRole('button', { name: he.createPath, exact: true }).click();
  await expect(page).toHaveURL(/\/paths\/[^/]+$/);
  await page.getByRole('link', { name: he.continueTask, exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(firstTask.title.he);
  await page.getByRole('radio', { name: firstTask.question.options.he[firstTask.question.answer], exact: true }).check();
  await page.getByLabel(he.answer).fill('הכנתי מסמך עם קהל, מטרה ושלוש דוגמאות מקוריות. המבקר יוכל לפתוח תיאור באמצעות כפתור נגיש.');
  await page.getByRole('button', { name: he.hard, exact: true }).click();
  await page.getByRole('button', { name: new RegExp(he.finishTask) }).click();
  await expect(page.locator('.submission-form .notice.success')).toContainText(he.taskSaved);
  const completed = await state(page.request);
  expect(completed.xp).toBe(firstTask.xp);
  expect(completed.streak).toBe(1);
  expect(completed.achievements.length).toBeGreaterThan(0);
  await page.reload();
  await expect(page.locator('.submission-form .notice.success')).toContainText(he.taskSaved);
  expect((await state(page.request)).xp).toBe(firstTask.xp);
});

test('settings persist English/light and Hebrew/RTL across mobile and desktop widths', async ({ page }) => {
  await createLearner(page, 'settings');
  await page.goto('/settings');
  await page.getByRole('combobox', { name: he.language, exact: true }).selectOption('en');
  await page.getByRole('combobox', { name: he.appearance, exact: true }).selectOption('light');
  await page.getByRole('button', { name: he.save, exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.getByRole('combobox', { name: en.language, exact: true })).toHaveValue('en');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('combobox', { name: en.language, exact: true }).selectOption('he');
  await page.getByRole('combobox', { name: en.appearance, exact: true }).selectOption('dark');
  await page.getByRole('button', { name: en.save, exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), { message: `No horizontal overflow at ${width}px` }).toBe(true);
    await expect(page.getByRole('button', { name: he.save, exact: true })).toBeVisible();
  }
});

test('pricing creates exact bit orders, proof remains pending, admin approval refreshes access', async ({ page, browser }) => {
  await createLearner(page, 'payment', true);
  const sessionBefore = (await page.context().cookies()).find(cookie => cookie.name === 'levelup_session')?.value;
  const orders: Record<string, string> = {};
  for (const [name, amount] of [['Basic', 9], ['Plus', 19], ['Pro', 39]] as const) {
    await page.goto('/pricing');
    const card = page.locator('.plan-card').filter({ has: page.getByRole('heading', { name, exact: true }) });
    await expect(card.locator('.plan-price')).toContainText(`₪${amount}`);
    await card.getByRole('button', { name: he.choosePlan, exact: true }).click();
    await expect(page).toHaveURL(/\/payment\/LU-/);
    const orderId = new URL(page.url()).pathname.split('/').at(-1)!;
    orders[name] = orderId;
    await expect(page.locator('.payment-amount')).toContainText(`₪${amount}`);
    await expect(page.locator('.bit-number b')).toHaveText('0526262828');
    expect((await state(page.request)).plan).toBe('FREE');
  }
  await page.goto(`/payment/${orders.Basic}`);
  await page.locator('input[type="file"]').setInputFiles({ name: 'e2e-demo-payment-proof.png', mimeType: 'image/png', buffer: proofPng });
  await page.getByRole('button', { name: he.uploadProof, exact: true }).click();
  await expect(page.locator('.payment-summary h2')).toHaveText(he.underReview);
  const pending = await state(page.request);
  expect(pending.plan).toBe('FREE');
  expect(pending.orders.find((order: { id: string }) => order.id === orders.Basic).status).toBe('under_review');

  // A separate admin session reviews only this fixture order; no shared profile or game is changed.
  const adminContext = await browser.newContext({ baseURL });
  try {
    await post(adminContext.request, 'auth/demo', { role: 'admin' });
    const adminPage = await adminContext.newPage();
    await adminPage.goto('/admin');
    await adminPage.getByLabel(he.reviewNote, { exact: true }).fill('E2E Demo: אישור תרגול בלבד; לא הועבר כסף.');
    const row = adminPage.getByRole('row').filter({ hasText: orders.Basic });
    await expect(row.getByRole('link', { name: he.viewProof, exact: true })).toBeVisible();
    await row.getByRole('button', { name: he.approve, exact: true }).click();
    await expect(row).toContainText(he.approved);
  } finally {
    await adminContext.close();
  }
  await page.getByRole('button', { name: he.refresh, exact: true }).click();
  await expect(page.locator('.payment-summary h2')).toHaveText(he.approved);
  const approved = await state(page.request);
  expect(approved.plan).toBe('BASIC');
  expect(approved.features.canPlayFull3DGames).toBe(true);
  expect((await page.context().cookies()).find(cookie => cookie.name === 'levelup_session')?.value).toBe(sessionBefore);
  await page.goto('/quest');
  await expect(page.getByRole('button', { name: he.startGame, exact: true })).toBeVisible();
});

test('Free users get an interactive preview and the server refuses a full game', async ({ page }) => {
  await createLearner(page, 'preview', true);
  await page.goto('/quest');
  await page.getByRole('button', { name: he.preview, exact: true }).click();
  const preview = page.getByRole('dialog');
  await expect(preview).toContainText(quest.previewTitle);
  await expect(page.locator('.quest-canvas')).toHaveCount(0);
  await preview.locator('.arena-preview-question button').first().click();
  await expect(preview).toContainText(quest.previewSelected);
  await preview.getByRole('button', { name: quest.openGames, exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText(quest.paywallTitle);
  await expect(page.getByRole('dialog').locator('.paywall-price')).toContainText('₪9');
  await expect(page.getByRole('dialog').getByRole('button', { name: he.open3d, exact: true })).toBeVisible();
  const daily = await page.request.get(`${baseURL}/api/games/daily?mode=knowledge-arena`).then(response => response.json());
  const denied = await page.request.post(`${baseURL}/api/games/start`, { headers: { origin: baseURL }, data: { dailyGameId: daily.game.dailyGameId } });
  expect(denied.status()).toBe(403);
  expect((await state(page.request)).features.canPlayFull3DGames).toBe(false);
});

