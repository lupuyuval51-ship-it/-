import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SportId } from '@shared/constants';
import type { ReadyWorkoutDetailDTO, SessionResponse } from '@shared/types';
import { ApiError } from '../../api/client';

const fetchReadyDetail = vi.fn<(id: string, ctx: { location: string; equipment: string[] | null; sport: SportId | null }) => Promise<ReadyWorkoutDetailDTO>>();
const startReadyWorkout = vi.fn<(body: unknown, key: string) => Promise<SessionResponse>>();
vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  fetchReadyDetail: (id: string, ctx: never) => fetchReadyDetail(id, ctx),
  startReadyWorkout: (body: unknown, key: string) => startReadyWorkout(body, key),
}));
vi.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }));
vi.mock('../animation/ExerciseAnimation', () => ({ ExerciseThumb: () => null }));

import { readReadyPrefs } from './prefs';
import { ReadyDetail } from './ReadyDetail';
import { detail, item, renderReady, sportBlock } from './testing';

const ROUTE = '/workouts/ready/w1?location=home&equipment=dumbbells,bench';
const open = (route = ROUTE, locale: 'en' | 'he' = 'en') => renderReady(<ReadyDetail readyId="w1" />, { route, path: '/workouts/ready/:readyId', locale });
const sessionResponse = { session: { id: 's1' } } as unknown as SessionResponse;

/** Resolves once the test calls `release()`. */
function deferred<T>() {
  let release!: (v: T) => void;
  let fail!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    release = res;
    fail = rej;
  });
  return { promise, release, fail };
}

beforeEach(() => {
  window.localStorage.clear();
  fetchReadyDetail.mockReset();
  startReadyWorkout.mockReset();
  fetchReadyDetail.mockResolvedValue(detail('w1'));
  startReadyWorkout.mockResolvedValue(sessionResponse);
});

describe('ready workout page', () => {
  it('shows the name, tags, total time, warm-up tip and the ordered exercises', async () => {
    fetchReadyDetail.mockResolvedValue(
      detail('w1', {
        name: { en: 'Push Basics', he: 'יסודות דחיקה' },
        equipment: ['dumbbells'],
        items: [
          item('a1', { cue: { en: 'Keep the elbows close.', he: 'המרפקים קרובים לגוף.' } }),
          item('a2', { repMin: null, repMax: null, targetSeconds: 45, targetRpe: null, sets: 2, restSeconds: 90 }),
        ],
        totalMinutes: 41,
        estimatedMinutes: 41,
      }),
    );
    open();
    expect(await screen.findByRole('heading', { level: 1, name: 'Push Basics' })).toBeTruthy();
    expect(fetchReadyDetail).toHaveBeenCalledWith('w1', { location: 'home', equipment: ['dumbbells', 'bench'], sport: null });
    expect(screen.getByText('Warm up 5–8 minutes first: easy cardio, then light sets of the first exercise.')).toBeTruthy();
    expect(screen.getByText('Includes about 6 min of warm-up.')).toBeTruthy();

    const list = screen.getByRole('list', { name: 'Exercises' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(within(rows[0]!).getByRole('link', { name: 'Exercise a1' }).getAttribute('href')).toBe('/exercises/a1');
    expect(within(rows[0]!).getByText('3 × 8–12')).toBeTruthy();
    expect(within(rows[0]!).getByText('Rest 1:00 min')).toBeTruthy();
    expect(within(rows[0]!).getByText('RPE 7')).toBeTruthy();
    expect(within(rows[0]!).getByText('Keep the elbows close.')).toBeTruthy();
    expect(within(rows[1]!).getByText('2 × 45 s')).toBeTruthy();
    expect(screen.getAllByText('41').length).toBeGreaterThan(0);
  });

  it('asks the sport question with None selected and every sport, and has no sport section without a block', async () => {
    open();
    expect(await screen.findByRole('heading', { name: 'Do you train a specific sport?' })).toBeTruthy();
    expect(screen.getByText('Add a 10-minute finisher at the end of the workout.')).toBeTruthy();
    const group = screen.getByRole('radiogroup', { name: 'Do you train a specific sport?' });
    expect(within(group).getAllByRole('radio')).toHaveLength(14);
    expect(within(group).getByRole('radio', { name: 'None' }).getAttribute('aria-checked')).toBe('true');
    expect(within(group).getByRole('radio', { name: 'Judo / BJJ / wrestling' })).toBeTruthy();
    expect(screen.queryByText(/Sport finisher/)).toBeNull();
  });

  it('shows the sport finisher as its own section with its stations and the honest line', async () => {
    fetchReadyDetail.mockResolvedValue(detail('w1', { sport: sportBlock(), totalMinutes: 42, estimatedMinutes: 32 }));
    open(`${ROUTE}&sport=soccer`);
    const section = (await screen.findByRole('heading', { name: 'Sport finisher - Soccer' })).closest('section')!;
    expect(fetchReadyDetail).toHaveBeenCalledWith('w1', { location: 'home', equipment: ['dumbbells', 'bench'], sport: 'soccer' });
    expect(within(section).getByText('About 10 min')).toBeTruthy();
    expect(within(section).getByText('Soccer legs and lungs')).toBeTruthy();
    expect(within(section).getAllByRole('listitem')).toHaveLength(4);
    expect(within(section).getByText('This is general physical preparation for the sport, not coaching in the sport.')).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Soccer' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByText('Workout 32 min + sport finisher 10 min')).toBeTruthy();
  });

  it('says so when no finisher fits, using the server note', async () => {
    fetchReadyDetail.mockResolvedValue(detail('w1', { sport: null, notes: [{ code: 'sport_none_fit', params: { sport: 'climbing' } }] }));
    open(`${ROUTE}&sport=climbing`);
    expect(await screen.findByText('No finisher for Climbing fits your age, injuries or equipment, so this workout has no sport finisher.')).toBeTruthy();
    expect(screen.queryByText('No sport finisher is added to this workout.')).toBeNull();
    expect(screen.queryByText(/^Sport finisher -/)).toBeNull();
  });

  it('falls back to a plain line when a sport was chosen but no block came back and no note explains it', async () => {
    open(`${ROUTE}&sport=running`);
    expect(await screen.findByText('No sport finisher is added to this workout.')).toBeTruthy();
  });

  it('explains what was changed for the user through the note codes, and marks swapped exercises', async () => {
    fetchReadyDetail.mockResolvedValue(
      detail('w1', {
        items: [item('a1', { substitutedFrom: 'Box Jump' }), item('a2')],
        notes: [
          { code: 'minor' },
          { code: 'age_senior' },
          { code: 'substituted', params: { from: 'Box Jump', to: 'Step-Up' } },
          { code: 'dropped', params: { name: 'Burpee' } },
          { code: 'sport_gentle' },
          { code: 'brand_new_code' },
        ],
      }),
    );
    open();
    const notes = (await screen.findByText('What was adjusted for you')).closest('.notice')!;
    expect(within(notes as HTMLElement).getByText('Under 18: effort stays moderate, with no maximum-effort sets.')).toBeTruthy();
    expect(within(notes as HTMLElement).getByText(/^65\+: effort is capped lower/)).toBeTruthy();
    expect(within(notes as HTMLElement).getByText('Box Jump was swapped for Step-Up to fit your age, injuries or equipment.')).toBeTruthy();
    expect(within(notes as HTMLElement).getByText('Burpee was left out to fit your age, injuries or equipment.')).toBeTruthy();
    // The sport note sits next to the sport question, unknown codes are skipped.
    expect(within(notes as HTMLElement).queryByText(/lower-impact/)).toBeNull();
    expect(screen.getByText('The sport finisher is a lower-impact version.')).toBeTruthy();
    expect(within(notes as HTMLElement).getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getAllByText('Swapped for you')).toHaveLength(1);
  });

  it('renders the notes and the finisher in Hebrew', async () => {
    fetchReadyDetail.mockResolvedValue(detail('w1', { sport: sportBlock({ sport: 'grappling' }), notes: [{ code: 'dropped', params: { name: 'ברפי' } }] }));
    open(`${ROUTE}&sport=grappling`, 'he');
    expect(await screen.findByRole('heading', { name: "סיום לספורט - ג'ודו / BJJ / היאבקות" })).toBeTruthy();
    expect(screen.getByText('התרגיל ברפי הושמט כדי להתאים לגיל, לפציעות או לציוד.')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'יש ענף ספורט מסוים שמתאמנים בו?' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'ללא' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'התחלת האימון' })).toBeTruthy();
  });

  it('asks the server for the finisher when a sport is picked, remembers it and keeps it in the address', async () => {
    fetchReadyDetail.mockImplementation(async (_id, ctx) => (ctx.sport ? detail('w1', { sport: sportBlock(), totalMinutes: 42 }) : detail('w1')));
    open();
    await screen.findByRole('heading', { name: 'Do you train a specific sport?' });
    fireEvent.click(screen.getByRole('radio', { name: 'Soccer' }));
    expect(await screen.findByRole('heading', { name: 'Sport finisher - Soccer' })).toBeTruthy();
    expect(fetchReadyDetail).toHaveBeenLastCalledWith('w1', { location: 'home', equipment: ['dumbbells', 'bench'], sport: 'soccer' });
    expect(readReadyPrefs('u1').sport).toBe('soccer');
    expect(screen.getByTestId('where').textContent).toBe('/workouts/ready/w1?location=home&equipment=dumbbells%2Cbench&sport=soccer');

    fireEvent.click(screen.getByRole('radio', { name: 'None' }));
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Sport finisher - Soccer' })).toBeNull());
    expect(readReadyPrefs('u1').sport).toBeNull();
    expect(screen.getByTestId('where').textContent).not.toContain('sport=');
  });

  it('starts with the sport saved on this device when the address has none', async () => {
    window.localStorage.setItem('fitai.ready.u1', JSON.stringify({ v: 1, location: 'home', equipment: {}, mode: null, sport: 'cycling' }));
    open('/workouts/ready/w1?location=home&equipment=');
    await screen.findByRole('heading', { name: 'Do you train a specific sport?' });
    expect(fetchReadyDetail).toHaveBeenCalledWith('w1', { location: 'home', equipment: [], sport: 'cycling' });
    expect(screen.getByRole('radio', { name: 'Cycling' }).getAttribute('aria-checked')).toBe('true');
  });

  it('links back to the list the user came from', async () => {
    renderReady(<ReadyDetail readyId="w1" />, { route: { pathname: '/workouts/ready/w1', search: '?location=gym', state: { readyFrom: '?tab=ready&focus=back' } } as never, path: '/workouts/ready/:readyId' });
    const back = await screen.findByRole('link', { name: 'Ready workouts' });
    expect(back.getAttribute('href')).toBe('/workouts?tab=ready&focus=back');
  });
});

describe('Start workout', () => {
  it('is the one filled action, disabled while the request is pending, and opens the live workout', async () => {
    const pending = deferred<SessionResponse>();
    startReadyWorkout.mockReturnValue(pending.promise);
    fetchReadyDetail.mockResolvedValue(detail('w1', { sport: sportBlock() }));
    open(`${ROUTE}&sport=soccer`);
    const button = await screen.findByRole('button', { name: 'Start workout' });
    expect(button.className).toContain('btn-primary');
    expect(document.querySelectorAll('.btn-primary')).toHaveLength(1);

    fireEvent.click(button);
    await waitFor(() => expect(button).toHaveProperty('disabled', true));
    expect(button.getAttribute('aria-busy')).toBe('true');
    fireEvent.click(button);
    expect(startReadyWorkout).toHaveBeenCalledTimes(1);
    expect(startReadyWorkout.mock.calls[0]![0]).toEqual({ readyWorkoutId: 'w1', sport: 'soccer', location: 'home', equipment: ['dumbbells', 'bench'] });
    expect(startReadyWorkout.mock.calls[0]![1]).toMatch(/\S/);

    pending.release(sessionResponse);
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe('/workouts/session'));
  });

  it('does not send a sport that has no finisher on the page', async () => {
    open(`${ROUTE}&sport=running`);
    fireEvent.click(await screen.findByRole('button', { name: 'Start workout' }));
    await waitFor(() => expect(startReadyWorkout).toHaveBeenCalled());
    expect(startReadyWorkout.mock.calls[0]![0]).toEqual({ readyWorkoutId: 'w1', location: 'home', equipment: ['dumbbells', 'bench'] });
  });

  it('is disabled while the finisher of a newly picked sport is loading', async () => {
    const next = deferred<ReadyWorkoutDetailDTO>();
    fetchReadyDetail.mockImplementation((_id, ctx) => (ctx.sport ? next.promise : Promise.resolve(detail('w1'))));
    open();
    const button = await screen.findByRole('button', { name: 'Start workout' });
    fireEvent.click(screen.getByRole('radio', { name: 'Soccer' }));
    await waitFor(() => expect(button).toHaveProperty('disabled', true));
    fireEvent.click(button);
    expect(startReadyWorkout).not.toHaveBeenCalled();
    next.release(detail('w1', { sport: sportBlock() }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Start workout' })).toHaveProperty('disabled', false));
  });

  it('opens the workout in progress when one is already running, and says so', async () => {
    startReadyWorkout.mockRejectedValue(new ApiError(409, 'session_already_active', 'busy'));
    open();
    fireEvent.click(await screen.findByRole('button', { name: 'Start workout' }));
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe('/workouts/session'));
    expect(await screen.findByText('You already have a workout in progress.')).toBeTruthy();
  });

  it('shows the translated message and stays on the page when the workout is not available', async () => {
    startReadyWorkout.mockRejectedValue(new ApiError(409, 'ready_workout_unavailable', 'no'));
    open();
    const button = await screen.findByRole('button', { name: 'Start workout' });
    fireEvent.click(button);
    expect(await screen.findByText('This workout is not available with your current profile. Try another one.')).toBeTruthy();
    expect(screen.getByTestId('where').textContent).toContain('/workouts/ready/w1');
    await waitFor(() => expect(button).toHaveProperty('disabled', false));
  });
});

describe('load errors', () => {
  it('says the workout was not found for a 404', async () => {
    fetchReadyDetail.mockRejectedValue(new ApiError(404, 'ready_workout_not_found', 'missing'));
    open();
    expect(await screen.findByText('Workout not found')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Start workout' })).toBeNull();
    expect(screen.getAllByRole('link', { name: 'Ready workouts' }).length).toBeGreaterThan(0);
  });

  it('explains an unavailable workout with the server code', async () => {
    fetchReadyDetail.mockRejectedValue(new ApiError(409, 'ready_workout_unavailable', 'hidden'));
    open();
    expect(await screen.findByText('Workout not available')).toBeTruthy();
    expect(screen.getByText('This workout is not available with your current profile. Try another one.')).toBeTruthy();
  });

  it('offers a retry for other errors', async () => {
    fetchReadyDetail.mockRejectedValueOnce(new ApiError(500, 'internal_error', 'boom'));
    open();
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('button', { name: 'Start workout' })).toBeTruthy();
  });
});
