import { expect, test, type Page } from '@playwright/test';
import { readyUser, useEnglish } from './helpers';

const SHOTS = process.env.UX_SHOTS;

test.beforeEach(async ({ page }) => {
  await useEnglish(page);
});

async function generateAndActivatePlan(page: Page) {
  // One-tap generation; with no active plan yet it is activated right away.
  await page.goto('/workouts?tab=generate');
  await page.getByRole('button', { name: 'Generate my plan' }).click();
  await expect(page).toHaveURL(/\/workouts\/plans\/[0-9a-f-]{36}$/, { timeout: 30_000 });
}

test('dashboard guides a new user, then offers one clear action for today and a resume banner @mobile', async ({ page }) => {
  test.setTimeout(120_000);
  await readyUser(page);

  // New user: getting-started checklist, honest reason, weekly goal with days left.
  const start = page.getByRole('region', { name: 'Getting started' });
  await expect(start).toBeVisible();
  await expect(start).toContainText('0 of 3 steps done');
  await expect(start.getByRole('link', { name: 'Create plan' })).toHaveAttribute('href', '/workouts?tab=generate');
  await expect(start.getByRole('link', { name: 'Add a meal' })).toHaveAttribute('href', '/nutrition/log');
  await expect(page.getByTestId('week-outlook')).toContainText(/days? left this week|out of reach|each remaining day/);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/dash-new-${test.info().project.name}-en.png`, fullPage: true });

  // With an active plan: the next workout is the single primary action, with the reason why.
  await generateAndActivatePlan(page);
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Getting started' })).toContainText('1 of 3 steps done');
  await expect(page.getByTestId('today-reason')).toContainText(/pace|days? left|bonus|reached/);
  const startButton = page.getByRole('button', { name: 'Start workout' });
  await expect(startButton).toBeVisible();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/dash-plan-${test.info().project.name}-en.png`, fullPage: true });
  await startButton.click();
  await expect(page).toHaveURL(/\/workouts\/session$/);

  // Leaving the workout open: the dashboard shows exactly one resume action and no second start button.
  await page.goto('/');
  const banner = page.getByRole('region', { name: 'Workout in progress' });
  await expect(banner).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start workout' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Resume workout' })).toHaveCount(1);
  await expect(page.getByText('Finish or resume your current workout first.')).toBeVisible();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/dash-resume-${test.info().project.name}-en.png`, fullPage: true });
});

test('Hebrew / RTL dashboard and live workout @mobile', async ({ page }) => {
  test.setTimeout(120_000);
  await readyUser(page);
  const me = await (await page.request.get('/api/auth/me')).json();
  const res = await page.request.patch('/api/settings', { headers: { 'x-csrf-token': me.csrfToken }, data: { locale: 'he' } });
  expect(res.ok()).toBe(true);
  await page.addInitScript(() => window.localStorage.setItem('fitai.locale', JSON.stringify('he')));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('region', { name: 'צעדים ראשונים' })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/dash-new-${test.info().project.name}-he.png`, fullPage: true });

  // Start an empty workout in Hebrew and check the steppers/undo render without sideways scrolling.
  await page.goto('/workouts/session');
  await page.getByRole('button', { name: 'התחלת אימון ריק' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'הוספת תרגיל' }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('searchbox').fill('bench');
  await dialog.getByRole('button', { name: /^בחירה: / }).first().click();
  await expect(page.getByRole('button', { name: 'סט 1: יותר משקל' })).toBeVisible();
  await page.getByRole('button', { name: 'סט 1: עוד חזרות' }).click();
  await page.getByRole('button', { name: 'השלמת סט 1' }).click();
  await expect(page.getByRole('button', { name: 'ביטול' }).first()).toBeVisible();
  const overflow2 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow2).toBeLessThanOrEqual(1);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/session-${test.info().project.name}-he.png`, fullPage: false });
});
