import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchReadyDetail, fetchReadyList, startBody, startReadyWorkout } from './api';
import { listSearch, NO_LIST_FILTERS } from './filters';

const fetchMock = vi.fn();

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('ready workouts API calls', () => {
  it('sends "no equipment" (an empty equipment value) to the server', async () => {
    fetchMock.mockResolvedValue(json({ workouts: [], total: 0, facets: {}, hiddenForSafety: 0 }));
    await fetchReadyList(listSearch({ location: 'outdoor', equipment: [], mode: 'bodyweight' }, NO_LIST_FILTERS, 1));
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/ready-workouts?location=outdoor&equipment=&mode=bodyweight&page=1&pageSize=24');
    expect(init.method).toBe('GET');
  });

  it('asks for one workout with the place, gear and sport it is built for', async () => {
    fetchMock.mockResolvedValue(json({ workout: { id: 'a b' } }));
    const workout = await fetchReadyDetail('a b', { location: 'home', equipment: ['bench', 'dumbbells'], sport: 'soccer' });
    expect(workout).toEqual({ id: 'a b' });
    expect(fetchMock.mock.calls[0]![0]).toBe('/api/ready-workouts/a%20b?location=home&equipment=dumbbells,bench&sport=soccer');
  });

  it('starts a workout through POST /api/sessions with an Idempotency-Key', async () => {
    fetchMock.mockResolvedValue(json({ session: { id: 's1' } }, 201));
    const body = startBody('w1', { location: 'home', equipment: ['dumbbells'], sport: 'soccer' }, 'soccer');
    await startReadyWorkout(body, 'key-123');
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/sessions');
    expect(init.method).toBe('POST');
    expect(init.headers['Idempotency-Key']).toBe('key-123');
    expect(JSON.parse(init.body)).toEqual({ readyWorkoutId: 'w1', sport: 'soccer', location: 'home', equipment: ['dumbbells'] });
  });
});
