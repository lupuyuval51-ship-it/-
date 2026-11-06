import { chromium, test as base, expect, type BrowserContext, type ConsoleMessage, type Page, type Request, type TestInfo } from '@playwright/test';
import { makeT, type TFn } from '../copy.ts';

export type Lang = 'he' | 'en';
export { expect };
export type { BrowserContext, Page };
interface Options { lang: Lang }

/** Everything a test watches while it runs. `finish()` turns what was seen into failures. */
export interface Watch {
  consoleErrors: string[];
  /** Absolute URLs that were requested from anything but the static origin (all of them are aborted). */
  offOrigin: string[];
  /** Requests that reached the static origin's /api (there is no API there: must stay empty). */
  apiCalls: string[];
  failed: string[];
  allowConsole(re: RegExp): void;
  allowOffOrigin(re: RegExp): void;
  finish(): void;
}

const originOf = (baseURL: string | undefined): string => new URL(baseURL ?? 'http://localhost:8121').origin;

/** Cuts the network (only the static origin answers) and records anything that tries to leave, plus console errors and failed requests. */
export async function watchContext(context: BrowserContext, origin: string): Promise<Watch> {
  const w: Watch = {
    consoleErrors: [], offOrigin: [], apiCalls: [], failed: [],
    allowConsole(re) { allowedConsole.push(re); },
    allowOffOrigin(re) { allowedOff.push(re); },
    finish() {
      const bad = (xs: string[], allowed: RegExp[]) => xs.filter((x) => !allowed.some((re) => re.test(x)));
      expect(bad(w.offOrigin, allowedOff), 'requests that tried to leave the static origin').toEqual([]);
      expect(w.apiCalls, 'requests to /api on a server-free build').toEqual([]);
      expect(bad(w.failed, allowedOff), 'failed requests').toEqual([]);
      expect(bad(w.consoleErrors, allowedConsole), 'unexpected browser console errors/warnings').toEqual([]);
    },
  };
  const allowedConsole: RegExp[] = []; const allowedOff: RegExp[] = [];
  await context.route((url) => /^https?:$/.test(url.protocol) && url.origin !== origin, (route) => { w.offOrigin.push(route.request().url()); return route.abort('internetdisconnected'); });
  const track = (page: Page) => {
    page.on('console', (m: ConsoleMessage) => {
      if (m.type() !== 'error' && m.type() !== 'warning') return;
      // The aborted off-origin request is reported through offOrigin already; do not count its console echo twice under another name.
      w.consoleErrors.push(`[${m.type()}] ${m.text()} @ ${m.location().url}`);
    });
    page.on('pageerror', (e) => w.consoleErrors.push(`[pageerror] ${e.message}`));
    page.on('requestfailed', (r: Request) => {
      const why = r.failure()?.errorText ?? '?';
      // Chromium cancels an in-flight media range request when a <video> is torn down or the page closes: not a failure of the app.
      if (why === 'net::ERR_ABORTED' && r.resourceType() === 'media') return;
      w.failed.push(`${r.url()} (${why})`);
    });
    page.on('worker', (wk) => { void wk; });
  };
  context.on('page', track);
  for (const p of context.pages()) track(p);
  context.on('request', (r) => {
    const u = new URL(r.url());
    if (u.origin === origin && (u.pathname === '/api' || u.pathname.startsWith('/api/'))) w.apiCalls.push(`${r.method()} ${u.pathname}`);
  });
  return w;
}

interface Fixtures {
  watch: Watch;
  allowConsole: (re: RegExp) => void;
  allowOffOrigin: (re: RegExp) => void;
  app: Page;
  t: TFn;
}

export const test = base.extend<Options & Fixtures>({
  lang: ['en', { option: true }],
  t: async ({ lang }, use) => { await use(await makeT(lang, { device: true })); },
  watch: async ({ context, baseURL }, use) => { const w = await watchContext(context, originOf(baseURL)); await use(w); w.finish(); },
  allowConsole: async ({ watch }, use) => { await use((re) => watch.allowConsole(re)); },
  allowOffOrigin: async ({ watch }, use) => { await use((re) => watch.allowOffOrigin(re)); },
  app: async ({ page, lang, watch }, use) => {
    void watch;
    await page.addInitScript((l) => { try { if (!localStorage.getItem('lf_lang')) localStorage.setItem('lf_lang', l); } catch { /* storage blocked */ } }, lang);
    await use(page);
  },
});

/**
 * Real relaunch: a persistent Chromium profile (user data dir) that is closed and opened again, so IndexedDB (PGlite) and localStorage
 * must really survive. Same network cut and watchers as the normal fixture.
 */
export async function launchProfile(info: TestInfo, userDataDir: string, lang: Lang): Promise<{ context: BrowserContext; page: Page; watch: Watch }> {
  const use = info.project.use as Record<string, unknown> & { launchOptions?: { executablePath?: string; args?: string[] } };
  const { launchOptions, baseURL, defaultBrowserType: _d, ...ctxOpts } = use as { launchOptions?: { executablePath?: string; args?: string[] }; baseURL?: string; defaultBrowserType?: string } & Record<string, unknown>;
  const context = await chromium.launchPersistentContext(userDataDir, { ...ctxOpts, ...(launchOptions ?? {}), baseURL });
  const watch = await watchContext(context, originOf(baseURL));
  await context.addInitScript((l) => { try { if (!localStorage.getItem('lf_lang')) localStorage.setItem('lf_lang', l); } catch { /* storage blocked */ } }, lang);
  const page = context.pages()[0] ?? (await context.newPage());
  return { context, page, watch };
}

/** First launch to Home: welcome -> onboarding (defaults are valid) -> review -> save. No login or registration screen is involved. */
export async function onboard(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page).toHaveURL(/\/welcome$/);
  await page.locator('a[href="/onboarding"]').click();
  for (const step of ['about', 'experience', 'goal', 'training', 'preferences', 'nutrition']) {
    await expect(page.locator(`.onb[data-step="${step}"]`)).toBeVisible();
    await page.locator('.onb-primary').click();
  }
  await expect(page.locator('.onb[data-step="review"]')).toBeVisible();
  await page.locator('.onb-primary').click();
  await expect(page.locator('.onb-done')).toBeVisible();
  await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });
  await expect(page.locator('.hero-card')).toBeVisible();
}

export const FOOD_QUERY: Record<Lang, { a: string; b: string }> = { he: { a: 'שקשוקה', b: 'בננה' }, en: { a: 'shakshuka', b: 'banana' } };

/** Logs the first search result for `query` with the quick-add button and waits for the confirmation. Returns the food's name. */
export async function logFirstFood(page: Page, t: TFn, query: string): Promise<string> {
  await page.goto('/nutrition/log');
  await page.getByRole('searchbox').fill(query);
  const first = page.locator('.nu-results .nu-result').first();
  await expect(first).toBeVisible();
  const name = (await first.locator('.result-row strong').innerText()).trim();
  await first.locator('.nu-quick').click();
  await expect(page.getByText(t('nutrition.nu.addedOne', { name }), { exact: false }).first()).toBeVisible();
  return name;
}
