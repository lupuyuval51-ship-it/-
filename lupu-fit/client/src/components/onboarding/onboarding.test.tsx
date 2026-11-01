import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from '../../api/client.ts';
import { ProfileInputSchema } from '@lupu-fit/shared';
import { loadOnboardingDraft, saveOnboardingDraft } from '../../lib/onboardingDraft.ts';
import { defaultDraft } from './model.ts';
import { renderScreen } from './testing.tsx';

const m = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }));
vi.mock('../../api/client.ts', async (orig) => ({ ...(await orig<typeof import('../../api/client.ts')>()), api: m }));

const { default: Onboarding } = await import('../../pages/Onboarding.tsx');
const { default: Welcome } = await import('../../pages/Welcome.tsx');

const H1 = () => screen.getByRole('heading', { level: 1 }).textContent;
const next = () => fireEvent.click(screen.getByRole('button', { name: /^(Next|הבא)$/ }));
const back = () => fireEvent.click(screen.getByRole('button', { name: 'Back' }));
const setNum = (name: string, v: string) => fireEvent.change(screen.getByRole('textbox', { name }), { target: { value: v } });
const TITLES = ['About you', 'Experience and injuries', 'Your goal', 'How you train', 'Preferences', 'Nutrition', 'Review'];
const num = (id: string) => Number((screen.getByTestId(id).textContent ?? '').replace(/,/g, ''));

async function start(opts: Parameters<typeof renderScreen>[1] = {}) {
  const r = renderScreen(<Onboarding />, { route: '/onboarding', ...opts });
  await screen.findByRole('heading', { level: 1 });
  return r;
}
const toReview = () => { for (let i = 0; i < 6; i += 1) next(); };

beforeEach(() => {
  Object.values(m).forEach((f) => f.mockReset()); localStorage.clear();
  m.get.mockRejectedValue(new ApiRequestError(404, 'profile_required', {}));
});

describe('wizard navigation', () => {
  it('walks the 7 steps with an indicator, Back and Skip', async () => {
    await start();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    expect(screen.getByText('1/7')).toBeInTheDocument();
    const seen: string[] = [];
    for (let i = 0; i < 6; i += 1) { seen.push(H1() ?? ''); next(); }
    seen.push(H1() ?? '');
    expect(seen).toEqual(TITLES);
    expect(screen.getByText('7/7')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
    back(); expect(H1()).toBe('Nutrition');
    back(); back(); back(); back(); back();
    expect(H1()).toBe('About you'); expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Skip' })); expect(H1()).toBe('Experience and injuries');
  });
  it('Skip keeps defaults for that step even if values were edited', async () => {
    await start();
    setNum('Age', '40'); fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    back();
    expect(screen.getByRole('textbox', { name: 'Age' })).toHaveValue('25');
  });
  it('has exactly one primary button on each step', async () => {
    const { container } = await start();
    for (let i = 0; i < 7; i += 1) { expect(container.querySelectorAll('.btn-primary')).toHaveLength(1); if (i < 6) next(); }
    expect(screen.getByRole('button', { name: 'Save and start' }).className).toContain('btn-primary');
  });
});

describe('about step safety', () => {
  it('blocks ages under 13 and over 100 with a clear message', async () => {
    await start();
    setNum('Age', '12');
    expect(screen.getByText(/for ages 13 and up/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    setNum('Age', '101');
    expect(screen.getByText('Age must be at most 100.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    setNum('Age', '30'); expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  });
  it('shows a caring notice for 13 to 17 only', async () => {
    await start();
    setNum('Age', '16'); expect(screen.getByText(/support healthy growth/)).toBeInTheDocument();
    setNum('Age', '18'); expect(screen.queryByText(/support healthy growth/)).toBeNull();
  });
  it('validates height and weight ranges', async () => {
    await start();
    setNum('Height', '100'); expect(screen.getByText('Height must be between 120 and 230.')).toBeInTheDocument();
    setNum('Height', '175'); setNum('Weight', '20'); expect(screen.getByText('Weight must be between 30 and 300.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });
});

describe('training step', () => {
  it('shows equipment only for home/park (prefilled, deselectable) and explains seven days', async () => {
    await start();
    next(); next(); next();
    expect(H1()).toBe('How you train');
    expect(screen.queryByRole('group', { name: 'Available equipment' })).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'Home' }));
    const dumbbells = screen.getByRole('button', { name: 'Dumbbells' });
    expect(dumbbells).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(dumbbells); expect(dumbbells).toHaveAttribute('aria-pressed', 'false');
    for (const n of ['Dumbbells', 'Resistance bands', 'Pull-up bar']) { const b = screen.getByRole('button', { name: n }); if (b.getAttribute('aria-pressed') === 'true') fireEvent.click(b); }
    expect(screen.getByText(/bodyweight only/)).toBeInTheDocument();
    setNum('Days per week', '7');
    expect(screen.getByText(/at most 6 lifting days/)).toBeInTheDocument();
    setNum('Days per week', '4'); expect(screen.queryByText(/at most 6 lifting days/)).toBeNull();
  });
});

describe('preferences apply live', () => {
  it('switches the interface language and theme immediately', async () => {
    await start();
    next(); next(); next(); next();
    expect(H1()).toBe('Preferences');
    fireEvent.click(screen.getByRole('radio', { name: 'Dark' })); fireEvent.click(screen.getByRole('radio', { name: 'Light' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    fireEvent.click(screen.getByRole('radio', { name: 'עברית' }));
    expect(document.documentElement.lang).toBe('he'); expect(document.documentElement.dir).toBe('rtl');
    expect(H1()).toBe('העדפות');
  });
});

describe('review math wiring', () => {
  it('gives a 16 year old fat-loss goal NO deficit and a supportive message', async () => {
    await start();
    setNum('Age', '16'); next(); next();
    fireEvent.click(screen.getByRole('button', { name: 'Fat loss' }));
    expect(screen.getByText(/no calorie deficit/)).toBeInTheDocument();
    next(); next(); next(); next();
    expect(H1()).toBe('Review');
    expect(num('target')).toBeGreaterThanOrEqual(num('tdee'));
    expect(screen.getByText(/Healthy habits and growth come first/)).toBeInTheDocument();
    expect(screen.queryByText(/minimum safe level/)).toBeNull();
  });
  it('shows BMR, TDEE and macros that update live for adults (deficit applied)', async () => {
    await start();
    next(); next(); fireEvent.click(screen.getByRole('button', { name: 'Fat loss' })); next(); next(); next(); next();
    expect(num('target')).toBeLessThan(num('tdee'));
    expect(num('bmr')).toBeGreaterThan(0); expect(num('protein')).toBeGreaterThan(0); expect(num('carbs')).toBeGreaterThan(0); expect(num('fat')).toBeGreaterThan(0);
    expect(screen.queryByText(/Healthy habits and growth come first/)).toBeNull();
    expect(screen.getAllByText(/not medical advice/i)).toHaveLength(2);
  });
  it('never goes under the 1200 kcal floor for an adult female with a custom override', async () => {
    await start();
    fireEvent.click(screen.getByRole('radio', { name: 'Female' }));
    next(); next(); next(); next(); next();
    expect(H1()).toBe('Nutrition');
    fireEvent.click(screen.getByRole('switch', { name: 'Set my own calorie target' }));
    expect(screen.getByText(/below 1,200 kcal is not allowed/)).toBeInTheDocument();
    setNum('Calorie target', '900');
    next();
    expect(num('target')).toBeGreaterThanOrEqual(1200);
    expect(screen.getByText(/minimum safe level/)).toBeInTheDocument();
    expect(screen.getByText(/adjusted to stay within safe limits/)).toBeInTheDocument();
  });
  it('rejects custom calories outside the accepted range', async () => {
    await start();
    toReviewTo('Nutrition');
    fireEvent.click(screen.getByRole('switch', { name: 'Set my own calorie target' }));
    setNum('Calorie target', '300');
    expect(screen.getByText(/whole number between 800 and 6000/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });
});
function toReviewTo(title: string) { for (let i = 0; i < 7 && H1() !== title; i += 1) next(); }

describe('saving', () => {
  it('PUTs a schema-valid profile, clears the draft, invalidates and goes home', async () => {
    m.put.mockResolvedValueOnce({ ok: true });
    const { qc } = await start();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    setNum('Age', '31'); fireEvent.click(screen.getByRole('radio', { name: 'Male' }));
    expect(loadOnboardingDraft()).not.toBeNull();
    toReview();
    fireEvent.click(screen.getByRole('button', { name: 'Save and start' }));
    await waitFor(() => expect(screen.getByTestId('path').textContent).toBe('/'));
    const [path, body] = m.put.mock.calls[0] as [string, unknown];
    expect(path).toBe('/api/profile');
    expect(ProfileInputSchema.safeParse(body).success).toBe(true);
    expect(body).toMatchObject({ age: 31, sex: 'male', language: 'en', equipment: [], goal: 'general_fitness' });
    expect(loadOnboardingDraft()).toBeNull();
    const keys = spy.mock.calls.map((c) => JSON.stringify(c[0]?.queryKey));
    expect(keys).toContain(JSON.stringify(['profile'])); expect(keys).toContain(JSON.stringify(['me']));
  });
  it('shows the error and keeps the draft when saving fails', async () => {
    m.put.mockRejectedValueOnce(new ApiRequestError(500, 'internal_error', {}));
    await start(); toReview();
    fireEvent.click(screen.getByRole('button', { name: 'Save and start' }));
    expect(await screen.findByText('Server error. Try again.')).toBeInTheDocument();
    expect(loadOnboardingDraft()).not.toBeNull();
  });
});

describe('draft persistence', () => {
  it('resumes a saved draft at its step and "Start over" clears it', async () => {
    saveOnboardingDraft(2, { ...defaultDraft('en'), goal: 'strength', age: 44 });
    await start();
    expect(H1()).toBe('Your goal');
    expect(screen.getByRole('button', { name: 'Strength' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Start over' }));
    expect(H1()).toBe('About you');
    expect(screen.getByRole('textbox', { name: 'Age' })).toHaveValue('25');
  });
  it('ignores a draft older than 3 days', async () => {
    saveOnboardingDraft(4, { ...defaultDraft('en'), age: 44 }, Date.now() - 4 * 24 * 3600 * 1000);
    await start();
    expect(H1()).toBe('About you');
  });
  it('survives corrupted draft data', async () => {
    saveOnboardingDraft(99, { age: 'x', goal: 'nope', injuries: 5 });
    await start();
    expect(H1()).toBe('Review');
  });
});

describe('redo from profile', () => {
  it('prefills from GET /api/profile instead of defaults', async () => {
    const profile = { ...defaultDraft('en'), displayName: 'Dana', sex: 'female', age: 29, heightCm: 165, weightKg: 58.5, goal: 'strength', experience: 'advanced', place: 'home', equipment: ['dumbbell'], injuries: ['knee'], allergies: [], restrictions: [] };
    const { customKcal: _c, displayName, ...rest } = profile; void _c;
    m.get.mockResolvedValue({ profile: { ...rest, displayName }, targets: {} });
    await start();
    expect(screen.getByRole('textbox', { name: 'Age' })).toHaveValue('29');
    expect(screen.getByRole('textbox', { name: /Display name/ })).toHaveValue('Dana');
    next(); expect(screen.getByRole('radio', { name: 'Advanced' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('button', { name: 'Knee' })).toHaveAttribute('aria-pressed', 'true');
    next(); expect(screen.getByRole('button', { name: 'Strength' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('both languages', () => {
  it('renders every step in Hebrew (RTL) without missing keys', async () => {
    await start({ lang: 'he' });
    for (let i = 0; i < 7; i += 1) {
      expect(H1()).not.toMatch(/^onboarding\./); expect(document.body.textContent).not.toMatch(/\bonboarding\.[a-z]+\./);
      if (i < 6) next();
    }
    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.getByRole('button', { name: 'שמירה והתחלה' })).toBeInTheDocument();
  });
  it('Welcome has one primary action to /onboarding and the health disclaimer', () => {
    const { container, unmount } = renderScreen(<Welcome />, { route: '/welcome' });
    expect(container.querySelectorAll('.btn-primary')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Set up my profile' })).toHaveAttribute('href', '/onboarding');
    expect(screen.getByText(/not medical advice/)).toBeInTheDocument();
    expect(screen.queryByText(/stays on this device/)).toBeNull();
    unmount();
    renderScreen(<Welcome />, { route: '/welcome', lang: 'he' });
    expect(screen.getByRole('link', { name: 'הגדרת הפרופיל שלי' })).toHaveAttribute('href', '/onboarding');
  });
});
