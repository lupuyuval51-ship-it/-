import { describe, expect, it } from 'vitest';
import { DEFAULT_EQUIPMENT_BY_LOCATION, EQUIPMENT, LOCATIONS } from '@shared/constants';
import { HOME_GEAR as SERVER_HOME_GEAR, PARK_GEAR as SERVER_PARK_GEAR, RESISTANCE_GEAR as SERVER_RESISTANCE_GEAR } from '../../../../server/src/modules/ready/rules';
import { startBody } from './api';
import {
  activeMoreFilters,
  defaultMode,
  detailSearch,
  emptyKind,
  gearOptions,
  HOME_GEAR,
  listSearch,
  NO_LIST_FILTERS,
  PARK_GEAR,
  prefillEquipment,
  readDetailContext,
  readListFilters,
  resolveContext,
  RESISTANCE_GEAR,
  withListFilters,
  type ReadyContext,
} from './filters';
import { EMPTY_READY_PREFS, type ReadyPrefs } from './prefs';

const prefs = (patch: Partial<ReadyPrefs> = {}): ReadyPrefs => ({ ...EMPTY_READY_PREFS, equipment: {}, ...patch });
const ctx = (patch: Partial<ReadyContext> = {}): ReadyContext => ({ location: 'home', equipment: [], mode: 'bodyweight', sport: null, ...patch });

describe('gear lists', () => {
  it('match the server rules the workouts are built with', () => {
    expect([...HOME_GEAR]).toEqual([...SERVER_HOME_GEAR]);
    expect([...PARK_GEAR]).toEqual([...SERVER_PARK_GEAR]);
    expect([...RESISTANCE_GEAR]).toEqual([...SERVER_RESISTANCE_GEAR]);
  });

  it('only offer known equipment, and nothing at the gym', () => {
    for (const q of [...HOME_GEAR, ...PARK_GEAR]) expect(EQUIPMENT).toContain(q);
    expect(gearOptions('home')).toBe(HOME_GEAR);
    expect(gearOptions('outdoor')).toBe(PARK_GEAR);
    expect(gearOptions('gym')).toEqual([]);
  });
});

describe('prefill and defaults', () => {
  it('uses the profile gear for the place it was entered for, limited to the gear offered there', () => {
    const profile = { trainingLocation: 'home' as const, equipment: ['barbell' as const, 'dumbbells' as const, 'bench' as const] };
    expect(prefillEquipment('home', profile)).toEqual(['dumbbells', 'bench']);
  });

  it('uses the app defaults for any other place', () => {
    const profile = { trainingLocation: 'gym' as const, equipment: [...DEFAULT_EQUIPMENT_BY_LOCATION.gym] };
    expect(prefillEquipment('home', profile)).toEqual([]);
    expect(prefillEquipment('outdoor', profile)).toEqual(['pull_up_bar', 'dip_bars']);
    expect(prefillEquipment('home', null)).toEqual([]);
  });

  it('defaults to weights at the gym and to bodyweight elsewhere unless weight gear is prefilled', () => {
    expect(defaultMode('gym', [])).toBe('weights');
    expect(defaultMode('home', [])).toBe('bodyweight');
    expect(defaultMode('outdoor', ['pull_up_bar', 'dip_bars'])).toBe('bodyweight');
    expect(defaultMode('home', ['pull_up_bar', 'resistance_bands'])).toBe('weights');
    expect(defaultMode('outdoor', ['kettlebell'])).toBe('weights');
  });
});

describe('resolveContext', () => {
  it('falls back to home with no gear and bodyweight for a new user without a profile place', () => {
    expect(resolveContext(prefs(), null)).toEqual({ location: 'home', equipment: [], mode: 'bodyweight', sport: null });
  });

  it('takes place, gear and mode from the profile', () => {
    const profile = { trainingLocation: 'home' as const, equipment: ['dumbbells' as const] };
    expect(resolveContext(prefs(), profile)).toEqual({ location: 'home', equipment: ['dumbbells'], mode: 'weights', sport: null });
    expect(resolveContext(prefs(), { trainingLocation: 'gym', equipment: [] })).toEqual({ location: 'gym', equipment: [], mode: 'weights', sport: null });
  });

  it('lets saved choices win and remembers the gear per place', () => {
    const saved = prefs({ location: 'outdoor', equipment: { home: ['dumbbells'], outdoor: ['dip_bars', 'pull_up_bar'] }, mode: 'bodyweight', sport: 'running' });
    expect(resolveContext(saved, { trainingLocation: 'home', equipment: ['dumbbells'] })).toEqual({
      location: 'outdoor',
      equipment: ['pull_up_bar', 'dip_bars'],
      mode: 'bodyweight',
      sport: 'running',
    });
    expect(resolveContext({ ...saved, location: 'home' }, null).equipment).toEqual(['dumbbells']);
  });

  it('an empty tick list means no equipment, not "use the defaults"', () => {
    const saved = prefs({ location: 'outdoor', equipment: { outdoor: [] } });
    expect(resolveContext(saved, null).equipment).toEqual([]);
  });
});

describe('list filters in the address', () => {
  it('reads valid values only', () => {
    expect(readListFilters(new URLSearchParams('tab=ready&focus=chest&level=advanced&max=45'))).toEqual({ focus: 'chest', level: 'advanced', maxMinutes: 45 });
    expect(readListFilters(new URLSearchParams('focus=neck&level=pro&max=17'))).toEqual(NO_LIST_FILTERS);
    expect(readListFilters(new URLSearchParams(''))).toEqual(NO_LIST_FILTERS);
  });

  it('writes the filters and keeps the other parameters', () => {
    const next = withListFilters(new URLSearchParams('tab=ready&focus=back'), { focus: 'legs', level: 'beginner', maxMinutes: 30 });
    expect(next.toString()).toBe('tab=ready&focus=legs&level=beginner&max=30');
    expect(withListFilters(next, NO_LIST_FILTERS).toString()).toBe('tab=ready');
  });

  it('counts the filters behind "More filters"', () => {
    expect(activeMoreFilters(NO_LIST_FILTERS)).toBe(0);
    expect(activeMoreFilters({ focus: 'abs', level: null, maxMinutes: null })).toBe(0);
    expect(activeMoreFilters({ focus: null, level: 'beginner', maxMinutes: 20 })).toBe(2);
  });
});

describe('listSearch (query string of GET /api/ready-workouts)', () => {
  it('sends every filter in a fixed order', () => {
    expect(listSearch(ctx({ location: 'home', equipment: ['bench', 'dumbbells'], mode: 'weights' }), { focus: 'chest', level: 'beginner', maxMinutes: 30 }, 2)).toBe(
      'location=home&equipment=dumbbells,bench&mode=weights&focus=chest&level=beginner&maxMinutes=30&page=2&pageSize=24',
    );
  });

  it('sends an empty equipment value when nothing is ticked at home or in the park', () => {
    expect(listSearch(ctx({ location: 'home' }), NO_LIST_FILTERS, 1)).toBe('location=home&equipment=&mode=bodyweight&page=1&pageSize=24');
    expect(listSearch(ctx({ location: 'outdoor', equipment: [] }), NO_LIST_FILTERS, 1)).toContain('location=outdoor&equipment=&');
  });

  it('asks no equipment question at the gym', () => {
    expect(listSearch(ctx({ location: 'gym', equipment: ['barbell'], mode: 'weights' }), NO_LIST_FILTERS, 1)).toBe('location=gym&mode=weights&page=1&pageSize=24');
  });

  it('only uses places the server knows', () => {
    for (const l of LOCATIONS) expect(listSearch(ctx({ location: l }), NO_LIST_FILTERS, 1)).toContain(`location=${l}`);
  });
});

describe('detail links and context', () => {
  it('builds the link query with place, gear and sport', () => {
    expect(detailSearch({ location: 'home', equipment: ['bench', 'dumbbells'], sport: 'soccer' })).toBe('?location=home&equipment=dumbbells,bench&sport=soccer');
    expect(detailSearch({ location: 'outdoor', equipment: [], sport: null })).toBe('?location=outdoor&equipment=');
    expect(detailSearch({ location: 'gym', equipment: ['barbell'], sport: 'general' })).toBe('?location=gym&sport=general');
    expect(detailSearch({ location: 'home', equipment: null, sport: null })).toBe('?location=home');
  });

  it('reads the address first, then saved choices', () => {
    const saved = prefs({ location: 'outdoor', equipment: { outdoor: ['dip_bars'] }, sport: 'tennis_padel' });
    expect(readDetailContext(new URLSearchParams('location=home&equipment=bench,dumbbells,spaceship&sport=running'), saved)).toEqual({
      location: 'home',
      equipment: ['dumbbells', 'bench'],
      sport: 'running',
    });
    expect(readDetailContext(new URLSearchParams(''), saved)).toEqual({ location: 'outdoor', equipment: ['dip_bars'], sport: 'tennis_padel' });
    expect(readDetailContext(new URLSearchParams('location=home&equipment='), saved).equipment).toEqual([]);
  });

  it('leaves the gear to the server when nothing is known', () => {
    expect(readDetailContext(new URLSearchParams(''), prefs())).toEqual({ location: 'home', equipment: null, sport: null });
    expect(readDetailContext(new URLSearchParams('location=gym&equipment=barbell'), prefs()).equipment).toBeNull();
  });

  it('builds the start request for exactly what the page shows', () => {
    expect(startBody('w1', { location: 'home', equipment: ['bench', 'dumbbells'], sport: 'soccer' }, 'soccer')).toEqual({
      readyWorkoutId: 'w1',
      sport: 'soccer',
      location: 'home',
      equipment: ['dumbbells', 'bench'],
    });
    // A chosen sport without a finisher on the page is not sent.
    expect(startBody('w1', { location: 'outdoor', equipment: [], sport: 'soccer' }, null)).toEqual({ readyWorkoutId: 'w1', location: 'outdoor', equipment: [] });
    expect(startBody('w1', { location: 'gym', equipment: null, sport: null }, null)).toEqual({ readyWorkoutId: 'w1', location: 'gym' });
  });
});

describe('emptyKind', () => {
  it('points at the missing gear when weights are asked for without any', () => {
    expect(emptyKind(ctx({ mode: 'weights', equipment: ['pull_up_bar'] }), NO_LIST_FILTERS)).toBe('weights_without_gear');
    expect(emptyKind(ctx({ mode: 'weights', equipment: ['dumbbells'] }), NO_LIST_FILTERS)).toBe('none');
    expect(emptyKind(ctx({ location: 'gym', mode: 'weights' }), NO_LIST_FILTERS)).toBe('none');
  });

  it('says the filters are too narrow when some are set', () => {
    expect(emptyKind(ctx(), { focus: 'abs', level: null, maxMinutes: null })).toBe('filtered');
    expect(emptyKind(ctx({ mode: 'weights' }), { focus: 'abs', level: null, maxMinutes: null })).toBe('weights_without_gear');
  });
});
