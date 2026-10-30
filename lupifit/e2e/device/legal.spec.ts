/**
 * Device mode: the legal pages (privacy policy, terms, data deletion) describe the app on the phone (no
 * account, no server, only the barcode lookup goes online), in English (LTR) and Hebrew (RTL), keep the
 * lawyer-review notice, and fit a 390 px phone.
 */
import { expect, test } from '@playwright/test';
import { appReady, expectFits, firstPage, launch, watch } from './helpers';

test('legal pages describe device mode, in English and Hebrew', async ({ browserName }, testInfo) => {
  expect(browserName).toBe('chromium');
  test.setTimeout(180_000);
  const problems: string[] = [];
  const context = await launch(testInfo, { width: 390 });
  const page = await firstPage(context);
  watch(page, problems);

  await page.goto('/privacy');
  await appReady(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy policy' })).toBeVisible();
  await expect(page.getByText('Draft: legal review required before launch')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'In short' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What the app keeps on your phone' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Backups' })).toBeVisible();
  await expect(page.getByText('[hosting provider]')).toHaveCount(0);
  await expect(page.getByText(/Anthropic/)).toHaveCount(0);
  await expectFits(page, 'privacy (device)');

  await page.getByRole('link', { name: 'Delete your data' }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Delete your LUPU-FIT data' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Erase everything in the app' })).toBeVisible();
  await expect(page.getByText('Tap “Erase all data”, then “Continue”.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Or uninstall the app' })).toBeVisible();
  await expectFits(page, 'data deletion (device)');

  await page.goto('/terms');
  await appReady(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Terms of use' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your data on your phone' })).toBeVisible();
  await expectFits(page, 'terms (device)');

  expect(problems).toEqual([]);
  await context.close();

  // Hebrew (RTL): the same pages in the default language, on a phone that starts in Hebrew.
  const heContext = await launch(testInfo, { width: 390, locale: 'he', dir: 'profile-he' });
  const hePage = await firstPage(heContext);
  watch(hePage, problems);
  await hePage.goto('/privacy');
  await appReady(hePage);
  await expect(hePage.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(hePage.getByRole('heading', { level: 1, name: 'מדיניות פרטיות' })).toBeVisible();
  await expect(hePage.getByRole('heading', { name: 'בקצרה' })).toBeVisible();
  await expectFits(hePage, 'privacy (device, Hebrew)');
  await hePage.goto('/account-deletion');
  await appReady(hePage);
  await expect(hePage.getByRole('heading', { level: 1, name: 'מחיקת הנתונים מ-LUPU-FIT' })).toBeVisible();
  await expectFits(hePage, 'data deletion (device, Hebrew)');

  expect(problems).toEqual([]);
  await heContext.close();
});
