import { hasCompletedOnboarding, parseBusiness, resolveActiveBusinessId, type Business } from '../api';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

function business(id: string, completed: boolean): Business {
  return {
    id,
    owner_id: 'u1',
    name: id,
    idea: '',
    stage: 'idea',
    country_code: 'IL',
    currency: 'ILS',
    onboarding_completed_at: completed ? '2026-11-01T10:00:00Z' : null,
    archived_at: null,
    created_at: '2026-11-01T09:00:00Z',
    updated_at: '2026-11-01T09:00:00Z',
  };
}

describe('resolveActiveBusinessId', () => {
  const list = [business('draft', false), business('a', true), business('b', true)];

  it('prefers the profile, then the device cache, then the first onboarded business', () => {
    expect(resolveActiveBusinessId({ businesses: list, profileActiveId: 'b', cachedId: 'a' })).toBe('b');
    expect(resolveActiveBusinessId({ businesses: list, profileActiveId: null, cachedId: 'a' })).toBe('a');
    expect(resolveActiveBusinessId({ businesses: list, profileActiveId: null, cachedId: null })).toBe('a');
    expect(resolveActiveBusinessId({ businesses: [business('draft', false)], profileActiveId: null, cachedId: null })).toBe('draft');
  });

  it('ignores ids that are no longer in the (non-archived) list', () => {
    expect(resolveActiveBusinessId({ businesses: list, profileActiveId: 'archived', cachedId: 'gone' })).toBe('a');
    expect(resolveActiveBusinessId({ businesses: [], profileActiveId: 'x', cachedId: 'y' })).toBeNull();
  });

  it('returns the best known id before the list loads (instant startup)', () => {
    expect(resolveActiveBusinessId({ businesses: undefined, profileActiveId: undefined, cachedId: 'cached' })).toBe('cached');
    expect(resolveActiveBusinessId({ businesses: undefined, profileActiveId: 'p', cachedId: 'cached' })).toBe('p');
    expect(resolveActiveBusinessId({ businesses: undefined, profileActiveId: undefined, cachedId: null })).toBeNull();
  });
});

describe('hasCompletedOnboarding / parseBusiness', () => {
  it('requires at least one onboarded business', () => {
    expect(hasCompletedOnboarding([])).toBe(false);
    expect(hasCompletedOnboarding([business('d', false)])).toBe(false);
    expect(hasCompletedOnboarding([business('d', false), business('a', true)])).toBe(true);
  });

  it('narrows unknown stages', () => {
    const { stage, ...rest } = business('x', true);
    void stage;
    expect(parseBusiness({ ...rest, stage: 'launching' }).stage).toBe('launching');
    expect(parseBusiness({ ...rest, stage: 'mystery' }).stage).toBe('idea');
  });
});
