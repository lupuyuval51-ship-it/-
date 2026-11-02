import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures.ts';

const ROUTES = ['/', '/workouts', '/workouts?tab=ready', '/workouts/history', '/exercises', '/nutrition', '/nutrition/log', '/nutrition/menu', '/coach', '/progress', '/notifications', '/profile'];
const PUBLIC_ROUTES = ['/login', '/register', '/welcome', '/privacy', '/terms'];

const overflow = (page: Page) => page.evaluate(() => {
  const de = document.documentElement;
  const wide = [...document.querySelectorAll<HTMLElement>('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > de.clientWidth + 1 && !e.closest('[aria-hidden="true"], .sr-only, .skip-link'); }).slice(0, 3).map((e) => `${e.tagName.toLowerCase()}.${e.className}`);
  return { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth, wide };
});

/** Interactive elements with no accessible name (icon-only buttons and links, unlabelled images/inputs). */
const unnamed = (page: Page) => page.evaluate(() => {
  const visible = (e: Element) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
  const textOf = (e: Element): string => {
    let s = '';
    e.childNodes.forEach((n) => {
      if (n.nodeType === 3) s += n.textContent ?? '';
      else if (n instanceof Element && n.getAttribute('aria-hidden') !== 'true') s += n instanceof HTMLImageElement ? n.alt : textOf(n);
    });
    return s.trim();
  };
  const bad: string[] = [];
  document.querySelectorAll('button, a[href], [role="button"], [role="link"], [role="switch"], [role="radio"], [role="tab"], img, input:not([type="hidden"]), select, textarea').forEach((e) => {
    if (!visible(e)) return;
    const named = e.getAttribute('aria-label')?.trim() || e.getAttribute('aria-labelledby') || e.getAttribute('title')?.trim() || ((e instanceof HTMLInputElement || e instanceof HTMLSelectElement || e instanceof HTMLTextAreaElement) && (e.labels?.length ?? 0) > 0);
    if (e instanceof HTMLImageElement) { if (e.getAttribute('alt') === null && e.getAttribute('aria-hidden') !== 'true') bad.push(`img ${e.src}`); return; }
    if (!named && !textOf(e)) bad.push(`${e.tagName.toLowerCase()} ${(e.getAttribute('class') ?? '').slice(0, 40)} ${(e.getAttribute('href') ?? '')}`);
  });
  return bad;
});

test('a11y smoke: no horizontal overflow at 360px, every control is named, focus moves into <main> on navigation', async ({ app: page, seed, t }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await seed();

  // Self-check: the detector must flag a nameless icon button, otherwise a green run would prove nothing.
  await page.goto('/');
  await page.evaluate(() => { const b = document.createElement('button'); b.id = 'e2e-probe'; b.innerHTML = '<svg width="20" height="20" aria-hidden="true"></svg>'; document.body.append(b); });
  expect((await unnamed(page)).some((u) => u.startsWith('button'))).toBe(true);

  const problems: string[] = [];
  for (const route of ROUTES) {
    await page.goto(route);
    await expect(page.locator('main#main')).toBeVisible();
    await page.waitForLoadState('networkidle');
    const o = await overflow(page);
    if (o.scrollWidth > o.clientWidth) problems.push(`overflow ${route}: ${o.scrollWidth}>${o.clientWidth} ${o.wide.join(' | ')}`);
    for (const u of await unnamed(page)) problems.push(`unnamed ${route}: ${u}`);
  }
  expect(problems, 'accessibility problems').toEqual([]);

  // Focus management: client-side navigation lands focus in <main> (screen readers announce the new page).
  await page.goto('/');
  await expect(page.locator('.hero-card')).toBeVisible();
  const links = [{ key: 'nav.workouts', url: /\/workouts$/ }, { key: 'nav.nutrition', url: /\/nutrition$/ }, { key: 'nav.progress', url: /\/progress$/ }];
  for (const l of links) {
    await page.locator('nav.bottomnav').getByRole('link', { name: t(l.key) }).click();
    await expect(page).toHaveURL(l.url);
    await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest('main#main'))).toBe(true);
  }
});

test('a11y smoke: signed-out pages fit 360px and have named controls', async ({ app: page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  const problems: string[] = [];
  for (const route of PUBLIC_ROUTES) {
    await page.goto(route);
    await expect(page.locator('main#main')).toBeVisible();
    await page.waitForLoadState('networkidle');
    const o = await overflow(page);
    if (o.scrollWidth > o.clientWidth) problems.push(`overflow ${route}: ${o.scrollWidth}>${o.clientWidth} ${o.wide.join(' | ')}`);
    for (const u of await unnamed(page)) problems.push(`unnamed ${route}: ${u}`);
  }
  expect(problems).toEqual([]);
});
