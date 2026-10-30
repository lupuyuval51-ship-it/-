import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Locale } from '@shared/constants';
import type { SessionHistoryResponse, SessionSummaryDTO } from '@shared/types';
import { ConfirmProvider, ToastProvider } from '../../components/ui';
import * as api from '../../features/sessions/api';
import { sessionKeys } from '../../features/sessions/api';
import { I18nProvider } from '../../i18n';
import SessionHistoryPage from './SessionHistoryPage';
import SessionSummaryPage from './SessionSummaryPage';

vi.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: { units: 'metric' } }) }));
vi.mock('../../features/dashboard/api', () => ({ useDashboard: () => ({ data: undefined }) }));
vi.mock('../../features/sessions/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../features/sessions/api')>()),
  fetchSessionSummary: vi.fn(),
  fetchSessionHistory: vi.fn(),
  deleteSession: vi.fn(),
}));

const SESSION_ID = '0b2f7f3e-5c1a-4f57-9a3e-6a1a2f9d4c11';

const summary = (extra: Partial<Pick<SessionSummaryDTO, 'sport'>> = {}): SessionSummaryDTO => ({
  session: { id: SESSION_ID, name: 'Chest and soccer', startedAt: '2026-10-09T10:00:00.000Z', endedAt: '2026-10-09T10:50:00.000Z', durationSeconds: 3000 },
  totals: { exercises: 6, sets: 18, reps: 200, volumeKg: 0 },
  exercises: [],
  personalRecords: [],
  rewards: { xpAwarded: 40, levelUp: null, newAchievements: [], notes: [] },
  previous: null,
  sport: null,
  ...extra,
});

const historyPage = (sport: SessionHistoryResponse['sessions'][number]['sport'] = null): SessionHistoryResponse => ({
  sessions: [
    {
      id: SESSION_ID,
      name: 'Chest and soccer',
      status: 'completed',
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      durationSeconds: 3000,
      totalSets: 18,
      totalVolumeKg: 0,
      exerciseCount: 6,
      prCount: 0,
      sport,
    },
    { id: 'plain', name: 'Plain workout', status: 'completed', startedAt: new Date().toISOString(), endedAt: new Date().toISOString(), durationSeconds: 1800, totalSets: 9, totalVolumeKg: 0, exerciseCount: 3, prCount: 0, sport: null },
  ],
  nextCursor: null,
});

function renderPage(ui: ReactElement, route: string, path: string, locale: Locale = 'en') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <I18nProvider locale={locale}>
          <ToastProvider>
            <ConfirmProvider>
              <MemoryRouter initialEntries={[route]}>
                <Routes>
                  <Route path={path} element={ui} />
                </Routes>
              </MemoryRouter>
            </ConfirmProvider>
          </ToastProvider>
        </I18nProvider>
      </QueryClientProvider>,
    ),
  };
}

const summaryRoute = `/workouts/sessions/${SESSION_ID}`;

describe('summary page', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows one line with the sport when the workout had a finisher', async () => {
    vi.mocked(api.fetchSessionSummary).mockResolvedValue(summary({ sport: 'soccer' }));
    renderPage(<SessionSummaryPage />, summaryRoute, '/workouts/sessions/:sessionId');
    expect(await screen.findByText('Sport finisher: Soccer')).toBeTruthy();
    // Totals and rewards are exactly what the server sent.
    expect(screen.getByText('+40 XP')).toBeTruthy();
  });

  it('is in Hebrew', async () => {
    vi.mocked(api.fetchSessionSummary).mockResolvedValue(summary({ sport: 'running' }));
    renderPage(<SessionSummaryPage />, summaryRoute, '/workouts/sessions/:sessionId', 'he');
    expect(await screen.findByText('סיום לספורט: ריצה')).toBeTruthy();
  });

  it('shows nothing extra for an ordinary workout', async () => {
    vi.mocked(api.fetchSessionSummary).mockResolvedValue(summary());
    renderPage(<SessionSummaryPage />, summaryRoute, '/workouts/sessions/:sessionId');
    expect(await screen.findByText('+40 XP')).toBeTruthy();
    expect(screen.queryByText(/Sport finisher/)).toBeNull();
  });

  it('uses the summary the live workout cached when it finished, without asking the server again', async () => {
    const fetchSummary = vi.mocked(api.fetchSessionSummary);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    client.setQueryData(sessionKeys.summary(SESSION_ID), summary({ sport: 'tennis_padel' }));
    render(
      <QueryClientProvider client={client}>
        <I18nProvider locale="en">
          <ToastProvider>
            <ConfirmProvider>
              <MemoryRouter initialEntries={[summaryRoute]}>
                <Routes>
                  <Route path="/workouts/sessions/:sessionId" element={<SessionSummaryPage />} />
                </Routes>
              </MemoryRouter>
            </ConfirmProvider>
          </ToastProvider>
        </I18nProvider>
      </QueryClientProvider>,
    );
    expect(await screen.findByText('Sport finisher: Tennis / padel')).toBeTruthy();
    await waitFor(() => expect(fetchSummary).not.toHaveBeenCalled());
  });
});

describe('history page', () => {
  beforeEach(() => vi.clearAllMocks());

  it('adds the sport to the row of a workout that had a finisher, and only to that row', async () => {
    vi.mocked(api.fetchSessionHistory).mockResolvedValue(historyPage('basketball'));
    renderPage(<SessionHistoryPage />, '/workouts/history', '/workouts/history');
    expect(await screen.findByText('Sport finisher: Basketball')).toBeTruthy();
    expect(screen.getAllByText(/Sport finisher/)).toHaveLength(1);
    expect(screen.getByText('Plain workout')).toBeTruthy();
  });

  it('shows no sport line while the server does not send one', async () => {
    vi.mocked(api.fetchSessionHistory).mockResolvedValue(historyPage());
    renderPage(<SessionHistoryPage />, '/workouts/history', '/workouts/history');
    expect(await screen.findByText('Chest and soccer')).toBeTruthy();
    expect(screen.queryByText(/Sport finisher/)).toBeNull();
  });

  it('is in Hebrew', async () => {
    vi.mocked(api.fetchSessionHistory).mockResolvedValue(historyPage('swimming'));
    renderPage(<SessionHistoryPage />, '/workouts/history', '/workouts/history', 'he');
    expect(await screen.findByText('סיום לספורט: שחייה')).toBeTruthy();
  });
});
