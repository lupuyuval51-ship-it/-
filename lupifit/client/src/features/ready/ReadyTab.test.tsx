import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReadyListResponse } from '@shared/types';

const fetchReadyList = vi.fn<(search: string) => Promise<ReadyListResponse>>();
const fetchProfile = vi.fn();
vi.mock('./api', async (importOriginal) => ({ ...(await importOriginal<typeof import('./api')>()), fetchReadyList: (s: string) => fetchReadyList(s) }));
vi.mock('../workouts/api', () => ({ fetchProfile: () => fetchProfile() }));
vi.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }));

import { readReadyPrefs } from './prefs';
import { ReadyTab } from './ReadyTab';
import { listResponse, profile, renderReady, summary } from './testing';

const open = (route = '/workouts?tab=ready') => renderReady(<ReadyTab />, { route });
const lastSearch = () => fetchReadyList.mock.calls.at(-1)?.[0] ?? '';
const radio = (name: string | RegExp) => screen.getByRole('radio', { name });

beforeEach(() => {
  window.localStorage.clear();
  fetchReadyList.mockReset();
  fetchProfile.mockReset();
  fetchProfile.mockResolvedValue(profile());
  fetchReadyList.mockResolvedValue(listResponse([summary('w1'), summary('w2', { name: { en: 'Push Basics', he: 'יסודות דחיקה' }, equipment: ['dumbbells', 'bench'], mode: 'weights', exerciseCount: 1 })], { total: 2 }));
});

describe('ready workouts tab', () => {
  it('asks the questions in order and lists the workouts as links that carry the context', async () => {
    open();
    expect(await screen.findByRole('link', { name: 'Workout w1' })).toBeTruthy();
    const links = screen.getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/workouts/ready/w1?location=home&equipment=', '/workouts/ready/w2?location=home&equipment=']);

    const labels = ['Where do you train?', 'What equipment do you have?', 'Bodyweight or weights?', 'Muscle focus'].map((l) => screen.getByText(l));
    for (let i = 1; i < labels.length; i++) {
      expect(labels[i - 1]!.compareDocumentPosition(labels[i]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    expect(lastSearch()).toBe('location=home&equipment=&mode=bodyweight&page=1&pageSize=24');
  });

  it('shows name, tags and the equipment a workout needs, or says there is none', async () => {
    open();
    const push = (await screen.findByRole('link', { name: 'Push Basics' })).closest('article')!;
    expect(within(push).getByText('Chest')).toBeTruthy();
    expect(within(push).getByText('Beginner')).toBeTruthy();
    expect(within(push).getByText('32 min')).toBeTruthy();
    expect(within(push).getByText('1 exercise')).toBeTruthy();
    expect(within(push).getByText('Weights')).toBeTruthy();
    expect(within(push).getByText('Dumbbells and Bench')).toBeTruthy();
    const plain = screen.getByRole('link', { name: 'Workout w1' }).closest('article')!;
    expect(within(plain).getByText('No equipment')).toBeTruthy();
    expect(within(plain).getByText('5 exercises')).toBeTruthy();
  });

  it('announces the result count politely', async () => {
    open();
    const count = await screen.findByText('2 workouts');
    expect(count.getAttribute('role')).toBe('status');
    expect(count.getAttribute('aria-live')).toBe('polite');
  });

  it('asks for equipment only at home and in the park, never at the gym', async () => {
    open();
    await screen.findByText('2 workouts');
    expect(screen.getByRole('group', { name: 'What equipment do you have?' })).toBeTruthy();
    fireEvent.click(radio('Outdoor / calisthenics park'));
    await waitFor(() => expect(lastSearch()).toContain('location=outdoor&equipment=pull_up_bar,dip_bars&mode=bodyweight'));
    expect(screen.getByRole('button', { name: 'Dip / parallel bars', pressed: true })).toBeTruthy();
    fireEvent.click(radio('Gym'));
    await waitFor(() => expect(lastSearch()).toBe('location=gym&mode=weights&page=1&pageSize=24'));
    expect(screen.queryByText('What equipment do you have?')).toBeNull();
    expect(screen.getByText('At the gym, all machines and weights are assumed.')).toBeTruthy();
  });

  it('turns ticked equipment, mode and muscle into the query and remembers place, gear and mode', async () => {
    open();
    await screen.findByText('2 workouts');
    fireEvent.click(screen.getByRole('button', { name: 'Dumbbells' }));
    fireEvent.click(screen.getByRole('button', { name: 'Bench' }));
    await waitFor(() => expect(lastSearch()).toBe('location=home&equipment=dumbbells,bench&mode=bodyweight&page=1&pageSize=24'));
    fireEvent.click(radio('Weights'));
    await waitFor(() => expect(lastSearch()).toContain('mode=weights'));
    fireEvent.click(radio(/^Chest/));
    await waitFor(() => expect(lastSearch()).toBe('location=home&equipment=dumbbells,bench&mode=weights&focus=chest&page=1&pageSize=24'));
    expect(readReadyPrefs('u1')).toEqual({ location: null, equipment: { home: ['dumbbells', 'bench'] }, mode: 'weights', sport: null });
    // The chosen muscle stays in the address, so back from a workout returns to the same list.
    expect(screen.getByTestId('where').textContent).toBe('/workouts?tab=ready&focus=chest');
  });

  it('prefills from the profile when it was entered for the chosen place, and starts from saved choices next time', async () => {
    fetchProfile.mockResolvedValue(profile({ trainingLocation: 'home', equipment: ['kettlebell', 'resistance_bands'] }));
    const first = open();
    await screen.findByText('2 workouts');
    expect(lastSearch()).toBe('location=home&equipment=kettlebell,resistance_bands&mode=weights&page=1&pageSize=24');
    fireEvent.click(screen.getByRole('button', { name: 'Kettlebell' }));
    await waitFor(() => expect(lastSearch()).toContain('equipment=resistance_bands&mode=weights'));
    first.unmount();

    open();
    await screen.findByText('2 workouts');
    expect(lastSearch()).toContain('equipment=resistance_bands&mode=weights');
  });

  it('shows counts per muscle and does not offer muscles without workouts', async () => {
    fetchReadyList.mockResolvedValue(listResponse([summary('w1')], { total: 1, facets: { chest: 1, back: 4 } }));
    open();
    await screen.findByText('1 workout');
    expect(radio(/^Back/).textContent).toContain('4');
    expect(radio(/^All/).textContent).toContain('5');
    expect(radio(/^Abs/)).toHaveProperty('disabled', true);
  });

  it('keeps level and length behind "More filters" and puts them in the query', async () => {
    open();
    await screen.findByText('2 workouts');
    const more = screen.getByRole('button', { name: 'More filters' });
    expect(more.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(more);
    expect(screen.getByRole('button', { name: 'Fewer filters' }).getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(radio('Intermediate'));
    fireEvent.click(radio('Up to 30 min'));
    await waitFor(() => expect(lastSearch()).toBe('location=home&equipment=&mode=bodyweight&level=intermediate&maxMinutes=30&page=1&pageSize=24'));
    expect(screen.getByTestId('where').textContent).toBe('/workouts?tab=ready&level=intermediate&max=30');
  });

  it('opens with the filters of the address and resets them', async () => {
    fetchReadyList.mockResolvedValue(listResponse([], { total: 0, facets: {} }));
    open('/workouts?tab=ready&focus=abs&level=beginner');
    expect(await screen.findByText('No workouts match these filters')).toBeTruthy();
    // The extra filters are already switched on, so their group starts open.
    expect(screen.getByRole('button', { name: 'Fewer filters' }).getAttribute('aria-expanded')).toBe('true');
    expect(radio('Beginner').getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getAllByRole('button', { name: 'Reset filters' })[0]!);
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe('/workouts?tab=ready'));
  });

  it('says what to tick when weights are chosen without any gear, and offers bodyweight', async () => {
    fetchReadyList.mockResolvedValue(listResponse([], { total: 0, facets: {} }));
    open();
    await screen.findByText('No ready workouts for this combination yet');
    fireEvent.click(radio('Weights'));
    expect(await screen.findByText('No weight workouts without equipment')).toBeTruthy();
    expect(screen.getByText(/Tick dumbbells, a kettlebell or resistance bands/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Show bodyweight workouts' }));
    await waitFor(() => expect(radio('Bodyweight').getAttribute('aria-checked')).toBe('true'));
    expect(readReadyPrefs('u1').mode).toBe('bodyweight');
    expect(screen.queryByText('No weight workouts without equipment')).toBeNull();
  });

  it('tells calmly that workouts are hidden for age or reported injuries, with a link to the profile', async () => {
    fetchReadyList.mockResolvedValue(listResponse([summary('w1')], { total: 1, hiddenForSafety: 3 }));
    open();
    expect(await screen.findByText('3 workouts are hidden because of your age or the injuries you reported.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Review injuries in your profile' }).getAttribute('href')).toBe('/profile#settings-training');
  });

  it('shows no safety notice when nothing is hidden', async () => {
    open();
    await screen.findByText('2 workouts');
    expect(screen.queryByText(/hidden because of your age/)).toBeNull();
  });

  it('loads the next page with "Show more" and keeps the first ones', async () => {
    const page1 = Array.from({ length: 2 }, (_, i) => summary(`p1-${i}`));
    const page2 = [summary('p2-0')];
    fetchReadyList.mockImplementation(async (search) => listResponse(search.includes('page=2') ? page2 : page1, { total: 3 }));
    open();
    expect(await screen.findByText('Showing 2 of 3')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Show more' }));
    expect(await screen.findByRole('link', { name: 'Workout p2-0' })).toBeTruthy();
    expect(lastSearch()).toContain('page=2');
    expect(screen.getByRole('link', { name: 'Workout p1-0' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Show more' })).toBeNull();
  });

  it('keeps the workouts on screen when "Show more" fails, says so, and lets the user try again', async () => {
    const page1 = Array.from({ length: 2 }, (_, i) => summary(`p1-${i}`));
    let failNext = true;
    fetchReadyList.mockImplementation(async (search) => {
      if (search.includes('page=2')) {
        if (failNext) {
          failNext = false;
          throw new Error('offline');
        }
        return listResponse([summary('p2-0')], { total: 3 });
      }
      return listResponse(page1, { total: 3 });
    });
    open();
    expect(await screen.findByText('Showing 2 of 3')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Show more' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Could not load more workouts. Check your connection and try again.');
    expect(screen.getByRole('link', { name: 'Workout p1-0' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Workout p1-1' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Show more' }));
    expect(await screen.findByRole('link', { name: 'Workout p2-0' })).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('passes the saved sport on to the workout link', async () => {
    window.localStorage.setItem('fitai.ready.u1', JSON.stringify({ v: 1, location: 'gym', equipment: {}, mode: null, sport: 'soccer' }));
    open();
    const link = await screen.findByRole('link', { name: 'Workout w1' });
    expect(link.getAttribute('href')).toBe('/workouts/ready/w1?location=gym&sport=soccer');
  });

  it('still works when the profile cannot be loaded', async () => {
    fetchProfile.mockRejectedValue(new Error('offline'));
    open();
    expect(await screen.findByRole('link', { name: 'Workout w1' })).toBeTruthy();
    expect(lastSearch()).toContain('location=home');
  });

  it('shows an error with a retry when the list cannot be loaded', async () => {
    fetchReadyList.mockRejectedValueOnce(new Error('boom'));
    open();
    const retry = await screen.findByRole('button', { name: 'Try again' });
    fireEvent.click(retry);
    expect(await screen.findByRole('link', { name: 'Workout w1' })).toBeTruthy();
  });

  it('renders in Hebrew with the park option from the location labels', async () => {
    renderReady(<ReadyTab />, { route: '/workouts?tab=ready', locale: 'he' });
    expect(await screen.findByRole('link', { name: 'אימון w1' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'בחוץ / פארק כושר' })).toBeTruthy();
    expect(screen.getByText('איפה מתאמנים?')).toBeTruthy();
    expect(screen.getByText('שני אימונים')).toBeTruthy();
  });
});
