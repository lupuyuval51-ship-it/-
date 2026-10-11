import { writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { onboardViaApi, registerViaUi, useEnglish } from './helpers';

/**
 * Phone-first audit: every screen at a small phone width (360px), Hebrew and English,
 * dark and light. Hard failures: horizontal scrolling. Findings (small tap targets,
 * tiny text) are written to MOBILE_AUDIT_OUT when set, for review.
 */
const WIDTH = 360;
const MIN_TARGET = 40;
const OUT = process.env.MOBILE_AUDIT_OUT;

type Finding = { route: string; locale: string; theme: string; kind: string; detail: string };

async function api(page: Page, method: 'post' | 'patch' | 'put', url: string, data: unknown = {}) {
  const me = await (await page.request.get('/api/auth/me')).json();
  const res = await page.request[method](url, { headers: { 'x-csrf-token': me.csrfToken, 'content-type': 'application/json' }, data });
  if (!res.ok()) throw new Error(`${method} ${url} failed: ${res.status()} ${await res.text()}`);
  return res.json();
}

async function audit(page: Page, route: string, locale: string, theme: string): Promise<Finding[]> {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  if (process.env.MOBILE_SHOTS) {
    const name = route.replace(/[^a-z]+/gi, '_').slice(0, 30) || 'home';
    await page.screenshot({ path: `${process.env.MOBILE_SHOTS}/${locale}-${theme}-${name}.png`, fullPage: false });
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
      document.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=radio], [role=switch], [role=checkbox]').forEach((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden' || cs.display === 'none') return;
        if (el.closest('.visually-hidden') || el.classList.contains('skip-link')) return;
        // Stretched links (a ::after covering their card) have the whole card as hit area.
        if (getComputedStyle(el, '::after').position === 'absolute') return;
        // Inline links inside running text are exempt from the target-size rule.
        if (el.tagName === 'A' && el.closest('p, li, dd, label') && cs.display === 'inline') return;
        if (Math.min(r.width, r.height) < MIN_TARGET && r.height < MIN_TARGET) {
          const key = describe(el);
          if (!seen.has(key)) {
            seen.add(key);
            out.push({ route, locale, theme, kind: 'small-target', detail: `${Math.round(r.width)}x${Math.round(r.height)} ${key}` });
          }
        }
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

test('phone audit: no horizontal scrolling anywhere; report small targets and tiny text', async ({ page }) => {
  test.setTimeout(300_000);
  page.setDefaultTimeout(15_000);
  await page.setViewportSize({ width: WIDTH, height: 740 });
  await useEnglish(page); // the registration helper uses English labels; locales are switched below
  await registerViaUi(page);
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
  const findings: Finding[] = [];
  for (const locale of ['he', 'en']) {
    await page.addInitScript((l) => window.localStorage.setItem('fitai.locale', JSON.stringify(l)), locale);
    for (const theme of ['dark', 'light']) {
      await page.addInitScript((t) => window.localStorage.setItem('fitai.theme', JSON.stringify(t)), theme);
      await api(page, 'patch', '/api/settings', { locale, theme });
      for (const route of routes) findings.push(...(await audit(page, route, locale, theme)));
    }
  }
  if (OUT) writeFileSync(OUT, JSON.stringify(findings, null, 1));
  const overflow = findings.filter((f) => f.kind === 'overflow-x');
  expect(overflow, JSON.stringify(overflow, null, 1)).toEqual([]);
});
