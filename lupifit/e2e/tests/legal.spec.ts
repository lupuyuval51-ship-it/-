import { expect, test, type Page } from '@playwright/test';
import { useEnglish } from './helpers';

/**
 * Public legal pages (their URLs go into the Google Play listing): they load directly while signed out,
 * in Hebrew (default, RTL) and English (LTR), without horizontal scrolling on a 390px phone.
 */
const PAGES = [
  { path: '/privacy', en: 'Privacy policy', he: 'מדיניות פרטיות' },
  { path: '/terms', en: 'Terms of use', he: 'תנאי שימוש' },
  { path: '/account-deletion', en: 'Delete your LUPU-FIT account', he: 'מחיקת חשבון LUPU-FIT' },
];

test.use({ viewport: { width: 390, height: 844 } });

async function expectNoHorizontalScroll(page: Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth + 1);
}

test.describe('public legal pages', () => {
  for (const p of PAGES) {
    test(`${p.path} loads signed out in Hebrew`, async ({ page }) => {
      const res = await page.goto(p.path);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1, name: p.he })).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`${p.path}$`));
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
      await expectNoHorizontalScroll(page);
    });

    test(`${p.path} loads signed out in English`, async ({ page }) => {
      await useEnglish(page);
      const res = await page.goto(p.path);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1, name: p.en })).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`${p.path}$`));
      await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
      await expectNoHorizontalScroll(page);
    });
  }

  test('are linked from the sign-in screen and from each other', async ({ page }) => {
    await useEnglish(page);
    await page.goto('/login');
    await page.getByRole('link', { name: 'Privacy policy' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Privacy policy' })).toBeVisible();
    await page.getByRole('link', { name: 'Delete account' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Delete your LUPU-FIT account' })).toBeVisible();
    await expect(page.getByText('Delete my account', { exact: false }).first()).toBeVisible();
  });
});
