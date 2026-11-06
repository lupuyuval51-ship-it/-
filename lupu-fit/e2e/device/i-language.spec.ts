import { makeT } from '../copy.ts';
import { expect, onboard, test } from './fixtures.ts';

test('language switch he <-> en persists across reload and relaunch; there is no machine-translation entry without an AI service', async ({ app: page, lang }) => {
  const tt = { he: await makeT('he', { device: true }), en: await makeT('en', { device: true }) };
  const other = lang === 'he' ? 'en' : 'he';
  const html = page.locator('html');
  const dirOf = (l: string) => (l === 'he' ? 'rtl' : 'ltr');
  await onboard(page);
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

  // Profile: built-in languages only, with an honest note instead of a translation sheet that could never work.
  await page.goto('/profile');
  await expect(page.locator('.ml-open')).toHaveCount(0);
  await expect(page.getByTestId('ml-builtin-only')).toHaveText(tt[other]('profile.ml.builtInOnly'));
  await expect(page.getByRole('radio', { name: tt[other]('profile.lang.he'), exact: true })).toBeVisible();
  await expect(page.getByRole('radio', { name: tt[other]('profile.lang.en'), exact: true })).toBeVisible();
  await expect(page.getByRole('radiogroup', { name: tt[other]('profile.f.language') }).getByRole('radio')).toHaveCount(2);

  // Switching back from the profile (the segmented control) also persists.
  await page.getByRole('radio', { name: tt[other](lang === 'he' ? 'profile.lang.he' : 'profile.lang.en'), exact: true }).click();
  await expect(html).toHaveAttribute('lang', lang);
  await page.reload();
  await expect(html).toHaveAttribute('lang', lang);
  await expect(html).toHaveAttribute('dir', dirOf(lang));
});
