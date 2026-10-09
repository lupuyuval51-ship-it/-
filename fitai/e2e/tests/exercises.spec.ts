import { expect, test, type Page } from '@playwright/test';
import { readyUser, useEnglish } from './helpers';

test.beforeEach(async ({ page }) => {
  await useEnglish(page);
});

const results = (page: Page) => page.getByRole('list', { name: 'Exercises' });
const searchBox = (page: Page) => page.getByRole('searchbox', { name: 'Search exercises' });

test('search, filter by muscle group and difficulty, URL sync, reload and back/forward', async ({ page }) => {
  await readyUser(page);
  await page.getByRole('link', { name: 'Exercises' }).first().click();
  await expect(page).toHaveURL(/\/exercises$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Exercise library' })).toBeVisible();
  await expect(page.getByText(/^\d+ exercises$/)).toBeVisible();

  await searchBox(page).fill('squat');
  await expect(page).toHaveURL(/\/exercises\?q=squat$/);
  await expect(results(page).getByRole('link', { name: 'Barbell Back Squat' })).toBeVisible();
  await expect(results(page).getByRole('link', { name: 'Push-Up', exact: true })).toHaveCount(0);

  await page.getByRole('radiogroup', { name: 'Muscle group' }).getByRole('radio', { name: /^Legs & glutes/ }).click();
  await expect(page).toHaveURL(/group=legs/);
  await page.getByRole('radiogroup', { name: 'Difficulty' }).getByRole('radio', { name: /^Beginner/ }).click();
  await expect(page).toHaveURL(/\?q=squat&group=legs&difficulty=beginner$/);
  await expect(results(page).getByRole('link', { name: 'Goblet Squat' })).toBeVisible();
  // Intermediate exercises are filtered out.
  await expect(results(page).getByRole('link', { name: 'Barbell Back Squat' })).toHaveCount(0);

  // The state survives a reload.
  await page.reload();
  await expect(searchBox(page)).toHaveValue('squat');
  await expect(page.getByRole('radio', { name: /^Legs & glutes/ })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('radio', { name: /^Beginner/ })).toHaveAttribute('aria-checked', 'true');
  await expect(results(page).getByRole('link', { name: 'Goblet Squat' })).toBeVisible();

  // Back/forward step through filter changes.
  await page.goBack();
  await expect(page).toHaveURL(/\?q=squat&group=legs$/);
  await expect(page.getByRole('radio', { name: /^Beginner/ })).toHaveAttribute('aria-checked', 'false');
  await expect(results(page).getByRole('link', { name: 'Barbell Back Squat' })).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/difficulty=beginner/);
  await expect(results(page).getByRole('link', { name: 'Barbell Back Squat' })).toHaveCount(0);

  // Clear filters keeps the search; the clear button empties it.
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page).toHaveURL(/\/exercises\?q=squat$/);
  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(page).toHaveURL(/\/exercises$/);
  await expect(searchBox(page)).toHaveValue('');
});

test('Hebrew search after switching the language, and an empty state', async ({ page }) => {
  await readyUser(page);
  await page.goto('/exercises');
  await page.getByRole('button', { name: 'Language' }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', { level: 1, name: 'מאגר תרגילים' })).toBeVisible();
  const search = page.getByRole('searchbox', { name: 'חיפוש תרגילים' });
  await search.fill('סקוואט');
  await expect(page).toHaveURL(/q=%D7%A1%D7%A7%D7%95%D7%95%D7%90%D7%98/);
  const list = page.getByRole('list', { name: 'תרגילים' });
  await expect(list.getByRole('link', { name: 'סקוואט עם מוט' })).toBeVisible();
  await expect(list.getByRole('link', { name: 'גובלט סקוואט' })).toBeVisible();

  await search.fill('zzzzqqq');
  await expect(page.getByText('לא נמצאו תרגילים')).toBeVisible();
  await page.getByRole('button', { name: 'ניקוי החיפוש והמסננים' }).click();
  await expect(page).toHaveURL(/\/exercises$/);
  await expect(page.getByRole('list', { name: 'תרגילים' }).getByRole('listitem').first()).toBeVisible();
});

test('detail page: content, honest media note, alternatives, back navigation and coach link', async ({ page }) => {
  await readyUser(page);
  await page.goto('/exercises');
  await searchBox(page).fill('squat');
  await expect(page).toHaveURL(/\?q=squat$/);
  await results(page).getByRole('link', { name: 'Barbell Back Squat' }).click();

  await expect(page).toHaveURL(/\/exercises\/barbell_back_squat$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Barbell Back Squat' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Step-by-step instructions' })).toBeVisible();
  await expect(page.getByText('Set the bar in the rack at about mid-chest height', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Common mistakes' })).toBeVisible();
  await expect(page.getByText('Letting the knees cave inward on the way up.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Safety recommendations' })).toBeVisible();
  await expect(page.getByText('Always squat inside a rack', { exact: false })).toBeVisible();
  // Honest media: no player or image, a clear note instead.
  await expect(page.getByText('No video or animation is available for this exercise yet — follow the steps below.')).toBeVisible();
  await expect(page.locator('main video, main figure img')).toHaveCount(0);
  // Onboarding equipment includes barbell + rack.
  await expect(page.getByText('You have the equipment for this exercise.')).toBeVisible();
  await expect(page.getByText('You haven’t logged this exercise yet.', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ask the coach about this exercise' })).toHaveAttribute(
    'href',
    /^\/coach\?q=How%20do%20I%20perform%20the%20Barbell%20Back%20Squat%20/,
  );

  // Easier alternative.
  await page.getByRole('region', { name: 'Easier options' }).getByRole('link', { name: 'Goblet Squat' }).click();
  await expect(page).toHaveURL(/\/exercises\/goblet_squat$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Goblet Squat' })).toBeVisible();

  // Browser back returns to the previous exercise, the back link to the filtered library.
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Barbell Back Squat' })).toBeVisible();
  await page.getByRole('link', { name: 'Exercise library', exact: true }).click();
  await expect(page).toHaveURL(/\/exercises\?q=squat$/);
  await expect(searchBox(page)).toHaveValue('squat');
  await expect(results(page).getByRole('link', { name: 'Barbell Back Squat' })).toBeVisible();
});

test('personal fit warnings, equipment toggle, load more and not-found', async ({ page }) => {
  await readyUser(page, { trainingLocation: 'home', equipment: ['dumbbells'], injuries: ['knee'] });
  await page.goto('/exercises/barbell_back_squat');
  await expect(page.getByText('You reported pain or an injury in: Knee')).toBeVisible();
  await expect(page.getByText('You’re missing: Barbell and Squat rack.')).toBeVisible();

  await page.goto('/exercises');
  await expect(page.getByText('119 exercises')).toBeVisible();
  await expect(results(page).getByRole('listitem')).toHaveCount(24);
  await page.getByRole('button', { name: 'Load more' }).click();
  await expect(page).toHaveURL(/\?page=2$/);
  await expect(results(page).getByRole('listitem')).toHaveCount(48);
  await page.reload();
  await expect(results(page).getByRole('listitem')).toHaveCount(48);

  await page.getByRole('switch', { name: 'Only exercises I can do with my equipment' }).click();
  await expect(page).toHaveURL(/\?available=1$/);
  await expect(page.getByText(/^\d+ exercises$/)).not.toHaveText('119 exercises');
  await expect(results(page).getByText('Needs equipment you don’t have')).toHaveCount(0);
  await expect(results(page).getByRole('link', { name: 'Goblet Squat' })).toBeVisible();

  await page.goto('/exercises/not_a_real_exercise');
  await expect(page.getByText('Exercise not found')).toBeVisible();
  await page.getByRole('link', { name: 'Browse the library' }).click();
  await expect(page).toHaveURL(/\/exercises$/);
});

test('filters panel on a phone @mobile', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'The collapsible filter panel only exists on narrow screens.');
  await readyUser(page);
  await page.goto('/exercises');
  const group = page.getByRole('radiogroup', { name: 'Muscle group' });
  await expect(group).toBeHidden();
  await page.getByRole('button', { name: 'Show filters' }).click();
  await group.getByRole('radio', { name: /^Core/ }).click();
  await expect(page).toHaveURL(/group=core/);
  await expect(page.getByRole('button', { name: /Hide filters/ })).toContainText('1 active');
  await expect(results(page).getByRole('link', { name: 'Plank', exact: true })).toBeVisible();
  await results(page).getByRole('link', { name: 'Plank', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Plank' })).toBeVisible();
  await page.getByRole('link', { name: 'Exercise library', exact: true }).click();
  await expect(page).toHaveURL(/group=core/);
});
