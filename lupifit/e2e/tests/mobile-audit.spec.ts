import { writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { onboardViaApi, registerViaUi, useEnglish } from './helpers';

/**
 * Phone-first audit: every screen at 360 and 390px wide, Hebrew (dark) and English (light).
 * Hard failures: horizontal page scrolling (documentElement.scrollWidth > innerWidth) and any
 * tap target smaller than 44x44 CSS px. Other findings (tiny text, fields under 16px) are written
 * to MOBILE_AUDIT_OUT when set, for review.
 */
const WIDTHS = [360, 390];
const MIN_TARGET = 44;
const OUT = process.env.MOBILE_AUDIT_OUT;

type Finding = { route: string; locale: string; theme: string; kind: string; detail: string };

async function api(page: Page, method: 'post' | 'patch' | 'put', url: string, data: unknown = {}) {
  const me = await (await page.request.get('/api/auth/me')).json();
  const res = await page.request[method](url, { headers: { 'x-csrf-token': me.csrfToken, 'content-type': 'application/json' }, data });
  if (!res.ok()) throw new Error(`${method} ${url} failed: ${res.status()} ${await res.text()}`);
  return res.json();
}

async function audit(page: Page, route: string, locale: string, theme: string, width: number): Promise<Finding[]> {
  if (!route.includes('#')) await page.goto(route, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  if (process.env.MOBILE_SHOTS) {
    const name = route.replace(/[^a-z]+/gi, '_').slice(0, 30) || 'home';
    await page.screenshot({ path: `${process.env.MOBILE_SHOTS}/${locale}-${theme}-${width}-${name}.png`, fullPage: false });
  }
  return page.evaluate(
    ({ route, locale, theme, MIN_TARGET }) => {
      const out: Finding[] = [];
      const vw = window.innerWidth;
      const doc = document.documentElement;
      const describe = (el: Element) => {
        const text = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
        return `<${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(/\s+/)[0] : ''}> "${text}"`;
      };
      if (doc.scrollWidth > vw + 1) {
        const offenders: string[] = [];
        document.querySelectorAll('body *').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.right > vw + 1 && getComputedStyle(el).position !== 'fixed' && offenders.length < 6) offenders.push(describe(el) + ` right=${Math.round(r.right)}`);
        });
        out.push({ route, locale, theme, kind: 'overflow-x', detail: `scrollWidth=${doc.scrollWidth} > ${vw}; ${offenders.join(' | ')}` });
      }
      const seen = new Set<string>();
      document.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=radio], [role=switch], [role=checkbox]').forEach((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden' || cs.display === 'none') return;
        if (el.closest('.visually-hidden') || el.classList.contains('skip-link')) return;
        // Stretched links (a ::after covering their card) have the whole card as hit area.
        if (getComputedStyle(el, '::after').position === 'absolute') return;
        // A bare checkbox/radio inside a label whose whole row is a 44px target.
        if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio') && el.closest('label')) {
          const lr = el.closest('label')!.getBoundingClientRect();
          if (lr.width >= MIN_TARGET && lr.height >= MIN_TARGET) return;
        }
        // Inline links inside running text are exempt from the target-size rule.
        if (el.tagName === 'A' && el.closest('p, li, dd, label') && cs.display === 'inline') return;
        if (r.width < MIN_TARGET - 0.5 || r.height < MIN_TARGET - 0.5) {
          const key = describe(el);
          if (!seen.has(key)) {
            seen.add(key);
            out.push({ route, locale, theme, kind: 'small-target', detail: `${Math.round(r.width)}x${Math.round(r.height)} ${key}` });
          }
        }
      });
      document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), textarea, select').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && parseFloat(getComputedStyle(el).fontSize) < 16) out.push({ route, locale, theme, kind: 'field-font', detail: describe(el) });
      });
      let tiny = 0;
      const tinySamples: string[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const n = walker.currentNode;
        if (!n.textContent?.trim() || !n.parentElement) continue;
        const el = n.parentElement;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if (r.width === 0 || cs.visibility === 'hidden' || el.closest('.visually-hidden, svg')) continue;
        if (parseFloat(cs.fontSize) < 11.5) {
          tiny++;
          if (tinySamples.length < 4) tinySamples.push(`${cs.fontSize} ${describe(el)}`);
        }
      }
      if (tiny) out.push({ route, locale, theme, kind: 'tiny-text', detail: `${tiny} nodes: ${tinySamples.join(' | ')}` });
      return out;
    },
    { route, locale, theme, MIN_TARGET },
  );
}

test('phone audit: no horizontal scrolling and 44px tap targets on every screen', async ({ page, browser }) => {
  test.setTimeout(420_000);
  page.setDefaultTimeout(15_000);
  await page.setViewportSize({ width: WIDTHS[0]!, height: 780 });
  const findings: Finding[] = [];

  // Signed-out screens (a fresh context: the signed-in page below is redirected away from them).
  const anon = await browser.newContext({ viewport: { width: WIDTHS[0]!, height: 780 }, hasTouch: true, locale: 'he-IL' });
  const anonPage = await anon.newPage();
  for (const width of WIDTHS) {
    await anonPage.setViewportSize({ width, height: 780 });
    for (const route of ['/login', '/register', '/forgot-password']) findings.push(...(await audit(anonPage, route, 'he', 'dark', width)));
  }
  await anon.close();

  await useEnglish(page); // the registration helper uses English labels; locales are switched below
  await registerViaUi(page);
  // Onboarding (step 1) while the profile is still empty.
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 780 });
    findings.push(...(await audit(page, '/onboarding', 'en', 'light', width)));
  }
  await onboardViaApi(page);

  // Realistic data: an active plan, a finished and an open workout, a few meals, a weigh-in.
  const { plan } = await api(page, 'post', '/api/plans/generate', {});
  await api(page, 'post', `/api/plans/${plan.id}/activate`);
  const today = new Date().toISOString().slice(0, 10);
  for (const [mealType, name, kcal] of [['breakfast', 'Oats with milk', 380], ['lunch', 'Chicken and rice', 640]] as const) {
    await api(page, 'post', '/api/nutrition/logs/quick', { date: today, mealType, name, kcal, proteinG: 30, carbsG: 60, fatG: 12 });
  }
  const first = await api(page, 'post', '/api/sessions', { planWorkoutId: plan.workouts[0].id });
  const sessionId: string = first.session.id;
  const ex = first.session.exercises[0];
  await api(page, 'post', `/api/sessions/${sessionId}/exercises/${ex.id}/sets`, {}).catch(() => undefined);

  const routes = [
    '/', '/workouts', `/workouts/plans/${plan.id}`, '/workouts/session', '/workouts/history', '/exercises', '/exercises/barbell_bench_press',
    '/nutrition', '/nutrition/log', '/coach', '/progress', '/notifications', '/profile',
  ];
  for (const [locale, theme] of [['he', 'dark'], ['en', 'light']] as const) {
    await page.addInitScript((l) => window.localStorage.setItem('fitai.locale', JSON.stringify(l)), locale);
    await page.addInitScript((t) => window.localStorage.setItem('fitai.theme', JSON.stringify(t)), theme);
    await api(page, 'patch', '/api/settings', { locale, theme });
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 780 });
      for (const route of routes) findings.push(...(await audit(page, route, locale, theme, width)));
      // The live workout again with its rest dock showing (logging a set starts the timer).
      await page.goto('/workouts/session', { waitUntil: 'domcontentloaded' });
      await page.locator('.set-row-current .set-check').click();
      await expect(page.locator('.rest-dock')).toBeVisible();
      findings.push(...(await audit(page, '/workouts/session#rest-dock', locale, theme, width)));
      await page.getByTestId('undo-strip').getByRole('button').click();
    }
  }
  if (OUT) writeFileSync(OUT, JSON.stringify(findings, null, 1));
  const hard = findings.filter((f) => f.kind === 'overflow-x' || f.kind === 'small-target');
  expect(hard, JSON.stringify(hard, null, 1)).toEqual([]);
});
