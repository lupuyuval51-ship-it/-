/** Fixtures and a provider wrapper shared by the ready-workouts tests (not part of the app). */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import type { Locale } from '@shared/constants';
import type { ExerciseSummaryDTO, ProfileDTO, ReadyItemDTO, ReadyListResponse, ReadyWorkoutDetailDTO, ReadyWorkoutSummaryDTO, SportBlockDTO } from '@shared/types';
import { ToastProvider } from '../../components/ui';
import { I18nProvider } from '../../i18n';

export const exercise = (id: string, overrides: Partial<ExerciseSummaryDTO> = {}): ExerciseSummaryDTO => ({
  id,
  name: { en: `Exercise ${id}`, he: `תרגיל ${id}` },
  primaryMuscles: ['chest'],
  secondaryMuscles: [],
  equipment: [],
  category: 'bodyweight',
  movementPattern: 'horizontal_push',
  difficulty: 'beginner',
  trackingType: 'reps',
  unilateral: false,
  hasMedia: false,
  ...overrides,
});

export const item = (id: string, overrides: Partial<ReadyItemDTO> = {}): ReadyItemDTO => ({
  exercise: exercise(id),
  sets: 3,
  repMin: 8,
  repMax: 12,
  targetSeconds: null,
  restSeconds: 60,
  targetRpe: 7,
  cue: null,
  substitutedFrom: null,
  ...overrides,
});

export const summary = (id: string, overrides: Partial<ReadyWorkoutSummaryDTO> = {}): ReadyWorkoutSummaryDTO => ({
  id,
  name: { en: `Workout ${id}`, he: `אימון ${id}` },
  description: { en: `Description of ${id}`, he: `תיאור ${id}` },
  focus: 'chest',
  mode: 'bodyweight',
  level: 'beginner',
  places: ['home', 'outdoor'],
  equipment: [],
  muscles: ['chest', 'triceps'],
  exerciseCount: 5,
  totalSets: 15,
  estimatedMinutes: 32,
  ...overrides,
});

export const listResponse = (workouts: ReadyWorkoutSummaryDTO[], overrides: Partial<ReadyListResponse> = {}): ReadyListResponse => ({
  workouts,
  total: workouts.length,
  facets: { chest: workouts.length },
  hiddenForSafety: 0,
  ...overrides,
});

export const sportBlock = (overrides: Partial<SportBlockDTO> = {}): SportBlockDTO => ({
  id: 'soccer_bodyweight',
  sport: 'soccer',
  variant: 'bodyweight',
  name: { en: 'Soccer legs and lungs', he: 'רגליים ונשימה לכדורגל' },
  description: { en: 'Short efforts with quick changes of direction.', he: 'מאמצים קצרים עם שינויי כיוון מהירים.' },
  estimatedMinutes: 10,
  items: [item('s1'), item('s2'), item('s3'), item('s4')],
  ...overrides,
});

export const detail = (id: string, overrides: Partial<ReadyWorkoutDetailDTO> = {}): ReadyWorkoutDetailDTO => ({
  ...summary(id),
  warmupMinutes: 6,
  items: [item('a1'), item('a2'), item('a3'), item('a4')],
  sport: null,
  totalMinutes: 32,
  notes: [],
  ...overrides,
});

export const profile = (overrides: Partial<ProfileDTO> = {}): ProfileDTO => ({ trainingLocation: null, equipment: [], ...overrides }) as ProfileDTO;

/** Shows the router's current address so a test can see where the app navigated. */
function Where() {
  const loc = useLocation();
  return <output data-testid="where">{`${loc.pathname}${loc.search}`}</output>;
}

export function renderReady(ui: ReactElement, { route, path = '*', locale = 'en' }: { route: string; path?: string; locale?: Locale }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <I18nProvider locale={locale}>
          <ToastProvider>
            <MemoryRouter initialEntries={[route]}>
              <Routes>
                <Route path={path} element={ui} />
                <Route path="*" element={null} />
              </Routes>
              <Where />
            </MemoryRouter>
          </ToastProvider>
        </I18nProvider>
      </QueryClientProvider>,
    ),
  };
}
