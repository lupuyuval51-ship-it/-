import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import type { Language, ProfileInput } from '@lupu-fit/shared';
import { LangProvider } from '../i18n/index.tsx';
import { ToastProvider } from '../ui/toast.tsx';
import { ApiRequestError } from '../api/transport.ts';

export interface Call { method: string; path: string; query?: unknown; body?: unknown }
export const calls: Call[] = [];
export const handlers: Record<string, (c: Call) => unknown> = {};
const run = (method: string) => async (path: string, a?: unknown, b?: unknown): Promise<unknown> => {
  const c: Call = method === 'GET' ? { method, path, query: a } : { method, path, body: a };
  void b; calls.push(c);
  const h = handlers[`${method} ${path}`];
  if (!h) throw new ApiRequestError(404, 'not_found', null, {});
  const r = h(c);
  if (r instanceof Error) throw r;
  return r;
};
/** Drop-in replacement for `api` from ../api/client.ts. */
export const apiStub = { get: run('GET'), post: run('POST'), put: run('PUT'), patch: run('PATCH'), delete: run('DELETE') };
export function resetApi(): void { calls.length = 0; for (const k of Object.keys(handlers)) delete handlers[k]; }

export const PROFILE: ProfileInput = {
  displayName: 'Dana', language: 'he', theme: 'system', units: 'metric', sex: 'female', age: 28, heightCm: 168, weightKg: 62, goal: 'general_fitness', experience: 'beginner', place: 'home',
  equipment: ['dumbbell', 'bench'], injuries: [], daysPerWeek: 3, sessionMinutes: 45, activityLevel: 'moderate', diet: 'omnivore', allergies: [], restrictions: [],
};
export const TARGETS = { bmr: 1400, tdee: 2000, kcal: 2000, proteinG: 120, carbsG: 220, fatG: 60, bucket: 'adult', notes: [] };
export const withProfile = (p: Partial<ProfileInput> = {}) => ({ profile: { ...PROFILE, ...p }, targets: TARGETS });

export function renderPage(ui: ReactElement, opts: { lang?: Language; route?: string; path?: string; client?: QueryClient } = {}) {
  const qc = opts.client ?? new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <LangProvider initialLang={opts.lang ?? 'he'}>
      <QueryClientProvider client={qc}>
        <ToastProvider>
          <MemoryRouter initialEntries={[opts.route ?? '/']}>
            <Routes><Route path={opts.path ?? '*'} element={ui} /></Routes>
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    </LangProvider>,
  );
}
