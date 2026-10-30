import { describe, expect, it } from 'vitest';
import { highlightParts } from './format';
import { addRecentSearch, clearRecentSearches, MAX_RECENT_SEARCHES, readRecentSearches, RECENT_SEARCHES_KEY } from './recentSearches';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
    removeItem: (k: string) => {
      delete data[k];
    },
  };
}

describe('recent searches', () => {
  it('stores newest first without case-insensitive duplicates', () => {
    const s = memoryStorage();
    addRecentSearch('squat', s);
    addRecentSearch('Bench Press', s);
    expect(addRecentSearch('SQUAT', s)).toEqual(['SQUAT', 'Bench Press']);
    expect(readRecentSearches(s)).toEqual(['SQUAT', 'Bench Press']);
  });

  it('ignores half-typed text and caps the list', () => {
    const s = memoryStorage();
    expect(addRecentSearch('s', s)).toEqual([]);
    for (let i = 0; i < MAX_RECENT_SEARCHES + 3; i++) addRecentSearch(`term ${i}`, s);
    expect(readRecentSearches(s)).toHaveLength(MAX_RECENT_SEARCHES);
    expect(readRecentSearches(s)[0]).toBe(`term ${MAX_RECENT_SEARCHES + 2}`);
  });

  it('clears, and survives corrupt or unavailable storage', () => {
    const s = memoryStorage({ [RECENT_SEARCHES_KEY]: '{not json' });
    expect(readRecentSearches(s)).toEqual([]);
    addRecentSearch('plank', s);
    clearRecentSearches(s);
    expect(readRecentSearches(s)).toEqual([]);
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readRecentSearches(broken)).toEqual([]);
    expect(addRecentSearch('plank', broken)).toEqual(['plank']);
    expect(readRecentSearches(null)).toEqual([]);
  });
});

describe('highlightParts', () => {
  it('marks every matching word, case-insensitively', () => {
    expect(highlightParts('Barbell Back Squat', 'back squ')).toEqual([
      { text: 'Barbell ', match: false },
      { text: 'Back', match: true },
      { text: ' ', match: false },
      { text: 'Squ', match: true },
      { text: 'at', match: false },
    ]);
  });

  it('works for Hebrew and ignores empty or one-letter queries', () => {
    expect(highlightParts('סקוואט עם מוט', 'סקוו')).toEqual([
      { text: 'סקוו', match: true },
      { text: 'אט עם מוט', match: false },
    ]);
    expect(highlightParts('Plank', '')).toEqual([{ text: 'Plank', match: false }]);
    expect(highlightParts('Plank', 'p')).toEqual([{ text: 'Plank', match: false }]);
  });
});
