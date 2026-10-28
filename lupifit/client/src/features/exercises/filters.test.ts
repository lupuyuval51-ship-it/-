import { describe, expect, it } from 'vitest';
import {
  activeFilterCount,
  changeFilters,
  cleanSearch,
  clearFilters,
  DEFAULT_LIBRARY_STATE,
  hasCriteria,
  librarySearchString,
  MAX_LIBRARY_PAGES,
  parseLibraryState,
  serializeLibraryState,
  toFilterQuery,
  toListQuery,
  type LibraryState,
} from './filters';

const parse = (qs: string) => parseLibraryState(new URLSearchParams(qs));
const serialize = (s: LibraryState) => serializeLibraryState(s).toString();

const FULL: LibraryState = {
  q: 'סקוואט עם מוט',
  muscleGroup: 'legs',
  muscle: 'quadriceps',
  equipment: 'none',
  difficulty: 'beginner',
  category: 'bodyweight',
  availableOnly: true,
  pages: 3,
};

describe('library URL serialization', () => {
  it('parses an empty query string to the defaults', () => {
    expect(parse('')).toEqual(DEFAULT_LIBRARY_STATE);
    expect(serialize(DEFAULT_LIBRARY_STATE)).toBe('');
    expect(librarySearchString(DEFAULT_LIBRARY_STATE)).toBe('');
  });

  it('round-trips every field, including Hebrew search text', () => {
    const qs = serialize(FULL);
    expect(qs).toBe(
      'q=%D7%A1%D7%A7%D7%95%D7%95%D7%90%D7%98+%D7%A2%D7%9D+%D7%9E%D7%95%D7%98&group=legs&muscle=quadriceps&equipment=none&difficulty=beginner&category=bodyweight&available=1&page=3',
    );
    expect(parse(qs)).toEqual(FULL);
    expect(librarySearchString(FULL)).toBe(`?${qs}`);
  });

  it('writes only non-default values in a stable order', () => {
    expect(serialize({ ...DEFAULT_LIBRARY_STATE, difficulty: 'advanced', q: 'squat' })).toBe('q=squat&difficulty=advanced');
    expect(serialize({ ...DEFAULT_LIBRARY_STATE, pages: 1, availableOnly: false })).toBe('');
  });

  it('drops unknown or invalid values instead of failing', () => {
    expect(parse('group=wings&muscle=gills&equipment=spaceship&difficulty=expert&category=yoga&available=yes&page=abc&foo=bar')).toEqual(
      DEFAULT_LIBRARY_STATE,
    );
    expect(parse('page=0').pages).toBe(1);
    expect(parse('page=-2').pages).toBe(1);
    expect(parse('page=2.5').pages).toBe(1);
    expect(parse('page=9999').pages).toBe(MAX_LIBRARY_PAGES);
    expect(parse('available=true').availableOnly).toBe(true);
    expect(parse('available=0').availableOnly).toBe(false);
  });

  it('drops a specific muscle that does not belong to the selected group', () => {
    expect(parse('group=chest&muscle=quadriceps')).toMatchObject({ muscleGroup: 'chest', muscle: null });
    expect(parse('muscle=quadriceps')).toMatchObject({ muscleGroup: null, muscle: 'quadriceps' });
    expect(serialize({ ...DEFAULT_LIBRARY_STATE, muscleGroup: 'arms', muscle: 'glutes' })).toBe('group=arms');
  });

  it('normalizes the search text (whitespace, length)', () => {
    expect(parse('q=%20%20bench%20%20%20press%20').q).toBe('bench press');
    expect(parse(`q=${'a'.repeat(200)}`).q).toHaveLength(80);
    expect(cleanSearch('  a\tb\nc  ')).toBe('a b c');
    expect(serialize({ ...DEFAULT_LIBRARY_STATE, q: '   ' })).toBe('');
  });
});

describe('filter changes', () => {
  it('restart from the first page', () => {
    expect(changeFilters(FULL, { difficulty: 'advanced' })).toMatchObject({ difficulty: 'advanced', pages: 1, q: FULL.q });
  });

  it('clear a muscle outside a newly selected group, keep one inside it', () => {
    expect(changeFilters(FULL, { muscleGroup: 'chest' })).toMatchObject({ muscleGroup: 'chest', muscle: null });
    expect(changeFilters({ ...FULL, muscle: 'glutes' }, { muscleGroup: 'legs' }).muscle).toBe('glutes');
    expect(changeFilters(FULL, { muscleGroup: null }).muscle).toBe('quadriceps');
  });

  it('clearing filters keeps the search text', () => {
    expect(clearFilters(FULL)).toEqual({ ...DEFAULT_LIBRARY_STATE, q: FULL.q });
  });

  it('counts active filters separately from the search', () => {
    expect(activeFilterCount(FULL)).toBe(6);
    expect(activeFilterCount({ ...DEFAULT_LIBRARY_STATE, q: 'squat' })).toBe(0);
    expect(hasCriteria({ ...DEFAULT_LIBRARY_STATE, q: 'squat' })).toBe(true);
    expect(hasCriteria(DEFAULT_LIBRARY_STATE)).toBe(false);
  });
});

describe('API query mapping', () => {
  it('maps only set values', () => {
    expect(toFilterQuery(DEFAULT_LIBRARY_STATE)).toEqual({});
    expect(toFilterQuery(FULL)).toEqual({
      q: FULL.q,
      muscleGroup: 'legs',
      muscle: 'quadriceps',
      equipment: 'none',
      difficulty: 'beginner',
      category: 'bodyweight',
      availableOnly: true,
    });
  });

  it('adds paging and the sort language for the list', () => {
    expect(toListQuery({ ...DEFAULT_LIBRARY_STATE, q: 'squat' }, 2, 'he')).toEqual({ q: 'squat', page: 2, pageSize: 24, lang: 'he' });
  });
});
