/** Test-only helpers shared by the nutrition/coach/profile tests (not imported by app code). */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ProfileInput } from '@lupu-fit/shared';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { LangProvider } from '../../i18n/index.tsx';
import { ToastProvider } from '../../ui/toast.tsx';

export function renderWith(ui: ReactElement, opts: { route?: string; lang?: 'he' | 'en'; client?: QueryClient } = {}) {
  const qc = opts.client ?? new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0 }, mutations: { retry: false } } });
  const out = render(
    <QueryClientProvider client={qc}><LangProvider initialLang={opts.lang ?? 'en'}><ToastProvider><MemoryRouter initialEntries={[opts.route ?? '/']}>{ui}</MemoryRouter></ToastProvider></LangProvider></QueryClientProvider>,
  );
  return { ...out, qc };
}

export const PROFILE: ProfileInput = {
  language: 'en', theme: 'dark', units: 'metric', sex: 'male', age: 30, heightCm: 180, weightKg: 80, goal: 'general_fitness', experience: 'intermediate', place: 'gym',
  equipment: ['dumbbell'], injuries: [], daysPerWeek: 3, sessionMinutes: 60, activityLevel: 'moderate', diet: 'omnivore', allergies: [], restrictions: [],
};
export const TARGETS = { bmr: 1800, tdee: 2700, kcal: 2500, proteinG: 160, carbsG: 280, fatG: 80, bucket: 'adult', notes: [] as string[] };
export const profileResponse = (p: Partial<ProfileInput> = {}, targets: Partial<typeof TARGETS> = {}) => ({ profile: { ...PROFILE, ...p }, targets: { ...TARGETS, ...targets } });
