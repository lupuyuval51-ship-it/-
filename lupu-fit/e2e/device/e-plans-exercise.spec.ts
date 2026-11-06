import { expect, onboard, test } from './fixtures.ts';

test('plan generator saves a plan; an exercise detail plays its video from the packaged media', async ({ app: page, t }) => {
  await onboard(page);
  await page.goto('/workouts?tab=generator');
  await page.getByRole('button', { name: t('workouts.gen.generate'), exact: true }).click();
  await expect(page.getByRole('region', { name: t('workouts.gen.previewTitle') })).toBeVisible();
  await page.getByRole('button', { name: t('workouts.gen.save'), exact: true }).click();
  await expect(page).toHaveURL(/\/workouts\/plans\/[^/]+$/);
  await page.goto('/workouts?tab=plans');
  await expect(page.locator('a[href^="/workouts/plans/"]').first()).toBeVisible();

  // Exercise detail: poster and clip both come from the static origin and answer 200/206.
  const media: { url: string; status: number }[] = [];
  page.on('response', (r) => { const u = new URL(r.url()); if (u.pathname.startsWith('/media/exercises/') && /\.(mp4|jpg)$/.test(u.pathname)) media.push({ url: u.pathname, status: r.status() }); });
  await page.goto('/exercises/back_squat');
  const video = page.locator('.xvid video');
  await expect(video).toBeVisible();
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState)).toBeGreaterThanOrEqual(2);
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.error === null)).toBe(true);
  expect(await video.evaluate((v: HTMLVideoElement) => v.videoWidth)).toBeGreaterThan(0);
  // It autoplays (muted loop, in view); the controls pause and resume it.
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(0);
  await page.getByRole('button', { name: t('video.pause'), exact: true }).click();
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  await page.getByRole('button', { name: t('video.play'), exact: true }).click();
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(false);
  expect(media.some((m) => m.url.endsWith('.mp4') && (m.status === 200 || m.status === 206))).toBe(true);
  expect(media.some((m) => m.url.endsWith('.jpg') && m.status === 200)).toBe(true);
  expect(media.filter((m) => m.status >= 400)).toEqual([]);
  await expect(page.locator('.xvid-fallback')).toHaveCount(0);
});
