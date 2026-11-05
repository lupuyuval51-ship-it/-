import { makeT } from '../copy.ts';
import { expect, test } from '../fixtures.ts';

test('language switch he <-> en persists across reload and sets html lang/dir; "more languages" is honest without AI', async ({ app: page, seed, lang, allowConsole }) => {
  allowConsole(/status of 503 \(Service Unavailable\) @ \S+\/api\/i18n\/translate$/); // the honest "no AI" answer we provoke below
  await seed();
  const other = lang === 'he' ? 'en' : 'he';
  const tt = { he: await makeT('he'), en: await makeT('en') };
  const html = page.locator('html');
  const dirOf = (l: string) => (l === 'he' ? 'rtl' : 'ltr');

  await page.goto('/');
  await expect(html).toHaveAttribute('lang', lang);
  await expect(html).toHaveAttribute('dir', dirOf(lang));

  await page.getByRole('button', { name: tt[lang]('lang.switchTo') }).click();
  await expect(html).toHaveAttribute('lang', other);
  await expect(html).toHaveAttribute('dir', dirOf(other));
  await expect(page.getByRole('link', { name: tt[other]('nav.workouts') }).first()).toBeVisible();

  await page.reload();
  await expect(html).toHaveAttribute('lang', other);
  await expect(html).toHaveAttribute('dir', dirOf(other));
  await expect(page.getByRole('link', { name: tt[other]('nav.workouts') }).first()).toBeVisible();

  // More languages: the sheet opens; choosing one without an AI service fails honestly and keeps the built-in language.
  await page.goto('/profile');
  await page.locator('.ml-open').click();
  const sheet = page.getByRole('dialog');
  await expect(sheet).toBeVisible();
  await sheet.locator('.ml-row').first().click();
  await expect(sheet.getByTestId('ml-error')).toHaveText(tt[other]('profile.ml.needAi'));
  await expect(html).toHaveAttribute('lang', other);
  expect(await page.evaluate(() => localStorage.getItem('lf_lang_custom'))).toBeNull();

  // The browser/Android Back button closes the sheet instead of leaving the profile screen.
  await page.goBack();
  await expect(sheet).toBeHidden();
  await expect(page).toHaveURL(/\/profile$/);
  await page.locator('.ml-open').click();
  await expect(sheet).toBeVisible();

  // Back to the project language.
  await page.keyboard.press('Escape');
  await page.goto('/');
  await page.getByRole('button', { name: tt[other]('lang.switchTo') }).click();
  await expect(html).toHaveAttribute('lang', lang);
  await expect(html).toHaveAttribute('dir', dirOf(lang));
});
