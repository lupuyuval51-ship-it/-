import { makeT, type TFn } from './copy.ts';
import { test as base, expect, type BrowserContext, type ConsoleMessage, type Page } from '@playwright/test';

export type Lang = 'he' | 'en';
export const PASSWORD = 'correct-horse-battery';

interface Options { lang: Lang }
interface Fixtures {
  /** Console errors / page errors collected during the test; the test fails if any are left unexpected at the end. */
  consoleErrors: string[];
  /** Declare console noise a single test provokes on purpose (for example an expected 503). Use sparingly. */
  allowConsole: (re: RegExp) => void;
  allowedConsole: RegExp[];
  /** Registers a fresh user (cookie lands in the context) and optionally fills the profile so the app skips onboarding. */
  seed: (opts?: { profile?: boolean; username?: string; profileOverrides?: Record<string, unknown> }) => Promise<{ username: string; csrfToken: string }>;
  /** Page whose language starts as the project language (only when the user has not picked one yet). */
  app: Page;
  /** UI copy lookup for the project language, read from the app's dictionaries. */
  t: TFn;
}

let counter = 0;
export const uniqueName = (p = 'e2e'): string => `${p}_${Date.now().toString(36)}${(counter++).toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`.slice(0, 24);

export const PROFILE = {
  theme: 'dark', units: 'metric', sex: 'male', age: 29, heightCm: 180, weightKg: 80, goal: 'muscle_gain', experience: 'intermediate',
  place: 'home', equipment: [], injuries: [], daysPerWeek: 4, sessionMinutes: 60, activityLevel: 'moderate', diet: 'omnivore', allergies: [], restrictions: [],
};

/** Messages that are environment noise, not app bugs. Keep this list tiny and explain every entry. */
const IGNORED = [
  // Chromium logs every non-2xx fetch as a console error. These two are normal probes of the app, not failures:
  // 401 on /api/auth/me = signed out, 404 on /api/profile = account without a profile yet (before onboarding).
  /status of 401 \(Unauthorized\) @ \S+\/api\/auth\/me$/,
  /status of 404 \(Not Found\) @ \S+\/api\/profile$/,
  // KNOWN, reported: client/src/automation/runtime.tsx calls useProfile() before it knows the user is signed in, so signed-out pages log a
  // 401 on /api/profile. Delete this line once the runtime gates the query on useMe().
  /status of 401 \(Unauthorized\) @ \S+\/api\/profile$/,
];

let ipCounter = 0;
export const test = base.extend<Options & Fixtures>({
  // Registration is rate limited per client IP (10/hour, a real product rule). Every test gets its own fake client IP via
  // X-Forwarded-For; the dev server only honours it when started with TRUST_PROXY=1 (see playwright.config.ts).
  extraHTTPHeaders: async ({}, use, info) => { await use({ 'x-forwarded-for': `10.${info.workerIndex % 250}.${Math.floor(ipCounter / 250) % 250}.${(ipCounter++ % 250) + 1}` }); },
  lang: ['en', { option: true }],
  consoleErrors: async ({}, use) => { await use([]); },
  allowedConsole: async ({}, use) => { await use([]); },
  allowConsole: async ({ allowedConsole }, use) => { await use((re) => { allowedConsole.push(re); }); },
  t: async ({ lang }, use) => { await use(await makeT(lang)); },
  seed: async ({ context, lang }, use) => {
    await use(async (opts = {}) => {
      const username = opts.username ?? uniqueName();
      const r = await context.request.post('/api/auth/register', { data: { username, password: PASSWORD } });
      expect(r.ok(), `register ${username}: ${r.status()}`).toBeTruthy();
      const { csrfToken } = (await r.json()) as { csrfToken: string };
      if (opts.profile !== false) {
        const p = await context.request.put('/api/profile', { headers: { 'x-csrf-token': csrfToken }, data: { ...PROFILE, language: lang, ...opts.profileOverrides } });
        expect(p.ok(), `profile ${p.status()} ${await p.text()}`).toBeTruthy();
      }
      return { username, csrfToken };
    });
  },
  app: async ({ page, lang, consoleErrors, allowedConsole }, use) => {
    // Seed the language once; a later switch in the UI must survive reloads (so never overwrite an existing choice).
    await page.addInitScript((l) => { try { if (!localStorage.getItem('lf_lang')) localStorage.setItem('lf_lang', l); } catch { /* storage blocked */ } }, lang);
    const onConsole = (m: ConsoleMessage) => {
      if (m.type() !== 'error' && m.type() !== 'warning') return;
      const text = `[${m.type()}] ${m.text()} @ ${m.location().url}`;
      if (IGNORED.some((re) => re.test(text))) return;
      consoleErrors.push(text);
    };
    page.on('console', onConsole);
    page.on('pageerror', (e) => consoleErrors.push(`[pageerror] ${e.message}`));
    await use(page);
    expect(consoleErrors.filter((m) => !allowedConsole.some((re) => re.test(m))), 'unexpected browser console errors/warnings').toEqual([]);
  },
});

export { expect };
export type { BrowserContext, Page };
export const he = (lang: Lang, heText: string, enText: string): string => (lang === 'he' ? heText : enText);
