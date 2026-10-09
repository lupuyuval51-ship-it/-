import { expect, type Page } from '@playwright/test';

export const uniqueEmail = (prefix = 'e2e') => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@e2e.fitai`;

/** Switches the UI language to English (tests assert on English copy). */
export async function useEnglish(page: Page) {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('fitai.locale', JSON.stringify('en'));
    } catch {
      /* ignore */
    }
  });
}

export async function registerViaUi(page: Page, opts: { email?: string; password?: string; name?: string } = {}) {
  const email = opts.email ?? uniqueEmail();
  const password = opts.password ?? 'Passw0rd!';
  await page.goto('/register');
  await page.getByLabel('Name').fill(opts.name ?? 'E2E Tester');
  await page.getByLabel('Email').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  return { email, password };
}

/** Completes onboarding through the API (fast setup for tests that are not about onboarding). */
export async function onboardViaApi(page: Page, overrides: Record<string, unknown> = {}) {
  const me = await page.request.get('/api/auth/me');
  const { csrfToken } = (await me.json()) as { csrfToken: string };
  const res = await page.request.put('/api/profile/onboarding', {
    headers: { 'x-csrf-token': csrfToken, 'content-type': 'application/json' },
    data: {
      ageYears: 30,
      sex: 'male',
      heightCm: 180,
      weightKg: 80,
      experienceLevel: 'intermediate',
      goal: 'muscle_gain',
      trainingLocation: 'gym',
      equipment: ['barbell', 'dumbbells', 'squat_rack', 'bench', 'cable_machine', 'lat_pulldown_machine', 'leg_press_machine', 'pull_up_bar', 'dip_bars'],
      daysPerWeek: 4,
      sessionMinutes: 60,
      dietType: 'omnivore',
      activityLevel: 'moderate',
      occupationActivity: 'desk',
      ...overrides,
    },
  });
  if (!res.ok()) throw new Error(`onboarding failed: ${res.status()} ${await res.text()}`);
  return res.json();
}

/** Registers a new user via the UI and completes onboarding via the API; lands on the dashboard. */
export async function readyUser(page: Page, overrides: Record<string, unknown> = {}) {
  const creds = await registerViaUi(page);
  await onboardViaApi(page, overrides);
  await page.goto('/');
  return creds;
}
