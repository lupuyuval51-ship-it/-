import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useSyncExternalStore } from 'react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Locale, SportId } from '@shared/constants';
import type { SessionExerciseDTO, WorkoutSessionDTO } from '@shared/types';
import { ConfirmProvider, ToastProvider } from '../../components/ui';
import { I18nProvider } from '../../i18n';
import ActiveSessionPage from './ActiveSessionPage';

// A tiny stand-in for the active-session cache: the stepper index changes when the page queues a state edit.
const store = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  return {
    data: null as unknown,
    listeners,
    set(next: unknown) {
      this.data = next;
      listeners.forEach((l) => l());
    },
    subscribe(l: () => void) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
});

vi.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: { units: 'metric' } }) }));
vi.mock('../../features/animation/ExerciseAnimation', () => ({ ExerciseAnimation: () => null }));
vi.mock('../../features/exercises/ExercisePicker', () => ({ ExercisePicker: () => null }));
vi.mock('../../features/sessions/hooks', () => ({
  useActiveSession: () => ({ data: useSyncExternalStore(store.subscribe, () => store.data) }),
  setActiveSession: vi.fn(),
  closeActiveSession: vi.fn(),
  useSyncStatus: () => ({ pending: 0, saving: false, offline: false, retrying: false }),
}));
vi.mock('../../features/sessions/sync', () => {
  const snapshot = { pending: 0, saving: false, offline: false, retrying: false };
  return {
    sessionSync: {
      enqueue: vi.fn((op: { type: string; patch: { currentExerciseIndex?: number } }) => {
        if (op.type === 'state' && op.patch.currentExerciseIndex !== undefined) {
          store.set({ ...(store.data as WorkoutSessionDTO), currentExerciseIndex: op.patch.currentExerciseIndex });
        }
      }),
      settle: vi.fn(async () => true),
      discard: vi.fn(),
      getSnapshot: () => snapshot,
      subscribe: () => () => {},
    },
  };
});

function exercise(id: string, position: number, sport: SportId | null, doneSets = 0): SessionExerciseDTO {
  return {
    id,
    exerciseId: id,
    exercise: { id, name: { en: `Move ${id}`, he: `תרגיל ${id}` }, primaryMuscles: ['quads'], secondaryMuscles: [], equipment: [], trackingType: 'reps' },
    position,
    repMin: 10,
    repMax: 12,
    targetSeconds: null,
    restSeconds: 45,
    targetRpe: null,
    targetWeightKg: null,
    notes: '',
    previous: null,
    suggestion: null,
    sport,
    sets: [1, 2].map((n) => ({
      id: `${id}-${n}`,
      setNumber: n,
      targetReps: 10,
      targetWeightKg: null,
      targetSeconds: null,
      reps: null,
      weightKg: null,
      durationSeconds: null,
      rpe: null,
      completed: n <= doneSets,
      completedAt: n <= doneSets ? new Date().toISOString() : null,
    })),
  } as unknown as SessionExerciseDTO;
}

function liveSession(exercises: SessionExerciseDTO[], currentExerciseIndex = 0): WorkoutSessionDTO {
  return {
    id: 'live-1',
    planId: null,
    planWorkoutId: null,
    name: 'Legs at home',
    status: 'in_progress',
    startedAt: new Date().toISOString(),
    pausedAt: null,
    pausedSeconds: 0,
    endedAt: null,
    durationSeconds: null,
    currentExerciseIndex,
    restTimer: null,
    notes: '',
    perceivedExertion: null,
    readiness: null,
    exercises,
    serverTime: new Date().toISOString(),
  };
}

function renderLive(session: WorkoutSessionDTO, locale: Locale = 'en') {
  store.set(session);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider locale={locale}>
        <ToastProvider>
          <ConfirmProvider>
            <MemoryRouter>
              <ActiveSessionPage />
            </MemoryRouter>
          </ConfirmProvider>
        </ToastProvider>
      </I18nProvider>
    </QueryClientProvider>,
  );
}

/** The heading of the current-exercise section (the overview list uses level 3 for the same text). */
const banner = () => screen.queryByRole('heading', { level: 2, name: /Sport finisher/ });

const ready = () => [exercise('a', 0, null), exercise('b', 1, null), exercise('c', 2, 'soccer'), exercise('d', 3, 'soccer')];

describe('live workout with a sport finisher', () => {
  beforeEach(() => store.set(null));

  it('shows no finisher section for an ordinary workout', () => {
    renderLive(liveSession([exercise('a', 0, null), exercise('b', 1, null)]));
    expect(screen.getByRole('heading', { level: 2, name: 'Move a' })).toBeTruthy();
    expect(screen.queryByText(/Sport finisher/)).toBeNull();
  });

  it('keeps the banner away from the main exercises but lists the finisher in the overview', () => {
    renderLive(liveSession(ready(), 0));
    expect(banner()).toBeNull();
    expect(screen.getByRole('heading', { level: 3, name: 'Sport finisher - Soccer' })).toBeTruthy();
  });

  it('says when the finisher is reached, where in it the user is and announces the move', () => {
    renderLive(liveSession(ready(), 1));
    expect(banner()).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Next exercise' }));
    expect(banner()?.textContent).toBe('Sport finisher - Soccer');
    expect(screen.getByText('Finisher exercise 1 of 2 · About 10 minutes')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Move c' })).toBeTruthy();
    expect(screen.getByText('Sport finisher: Soccer. Moved on to Move c')).toBeTruthy();
  });

  it('follows the user through the finisher and away from it again', () => {
    renderLive(liveSession(ready(), 2));
    expect(screen.getByText('Finisher exercise 1 of 2 · About 10 minutes')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next exercise' }));
    expect(screen.getByText('Finisher exercise 2 of 2 · About 10 minutes')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Previous exercise' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous exercise' }));
    expect(banner()).toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: 'Move b' })).toBeTruthy();
  });

  it('jumps into the finisher from the overview', () => {
    renderLive(liveSession(ready(), 0));
    fireEvent.click(screen.getByRole('button', { name: /Move d/ }));
    expect(screen.getByText('Finisher exercise 2 of 2 · About 10 minutes')).toBeTruthy();
    expect(screen.getByText('Sport finisher: Soccer. Moved on to Move d')).toBeTruthy();
  });

  it('is in Hebrew', () => {
    renderLive(liveSession(ready(), 2), 'he');
    expect(screen.getByRole('heading', { level: 2, name: 'סיום לספורט - כדורגל' })).toBeTruthy();
    expect(screen.getByText('תרגיל סיום 1 מתוך 2 · כ-10 דקות')).toBeTruthy();
  });

  it('still logs sets of a finisher exercise the same way (set check is offered)', () => {
    renderLive(liveSession(ready(), 2));
    expect(screen.getByRole('button', { name: 'Complete set 1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Swap Move c for another exercise' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Remove exercise' })).toBeTruthy();
  });

  it('announces the finisher when logging the last main set moves the workout on by itself', () => {
    vi.useFakeTimers();
    try {
      renderLive(liveSession([exercise('a', 0, null, 2), exercise('b', 1, null, 1), exercise('c', 2, 'soccer'), exercise('d', 3, 'soccer')], 1));
      fireEvent.click(screen.getByRole('button', { name: 'Complete set 2' }));
      expect(screen.queryByText(/Moved on to/)).toBeNull();
      act(() => {
        vi.advanceTimersByTime(1300);
      });
      expect(screen.getByText('Sport finisher: Soccer. Moved on to Move c')).toBeTruthy();
      expect(banner()?.textContent).toBe('Sport finisher - Soccer');
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not mention the finisher when the automatic move stays inside the main workout', () => {
    vi.useFakeTimers();
    try {
      renderLive(liveSession([exercise('a', 0, null, 1), exercise('b', 1, null), exercise('c', 2, 'soccer')], 0));
      fireEvent.click(screen.getByRole('button', { name: 'Complete set 2' }));
      act(() => {
        vi.advanceTimersByTime(1300);
      });
      expect(screen.getByText('Moved on to Move b')).toBeTruthy();
      expect(banner()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
