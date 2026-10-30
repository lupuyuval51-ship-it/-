import { beforeEach, describe, expect, it } from 'vitest';
import { clearAllReadyPrefs, EMPTY_READY_PREFS, readReadyPrefs, readyPrefsKey, sanitizePrefs, writeReadyPrefs, type ReadyPrefs } from './prefs';

const prefs: ReadyPrefs = { location: 'home', equipment: { home: ['dumbbells', 'bench'], outdoor: ['pull_up_bar'] }, mode: 'weights', sport: 'soccer' };

beforeEach(() => window.localStorage.clear());

describe('ready prefs storage', () => {
  it('stores the choices per signed-in user under fitai.ready.<userId>', () => {
    expect(writeReadyPrefs('u1', prefs)).toBe(true);
    expect(readyPrefsKey('u1')).toBe('fitai.ready.u1');
    expect(window.localStorage.getItem('fitai.ready.u1')).not.toBeNull();
    expect(readReadyPrefs('u1')).toEqual(prefs);
    // Another account on the same device starts empty.
    expect(readReadyPrefs('u2')).toEqual(EMPTY_READY_PREFS);
  });

  it('never stores anything without a user id', () => {
    expect(writeReadyPrefs(null, prefs)).toBe(false);
    expect(writeReadyPrefs(undefined, prefs)).toBe(false);
    expect(window.localStorage.length).toBe(0);
    expect(readReadyPrefs(null)).toEqual(EMPTY_READY_PREFS);
  });

  it('falls back to empty choices for corrupted or foreign data', () => {
    window.localStorage.setItem('fitai.ready.u1', '{not json');
    expect(readReadyPrefs('u1')).toEqual(EMPTY_READY_PREFS);
    window.localStorage.setItem('fitai.ready.u1', JSON.stringify('text'));
    expect(readReadyPrefs('u1')).toEqual(EMPTY_READY_PREFS);
  });

  it('keeps only valid values', () => {
    const clean = sanitizePrefs({
      v: 1,
      location: 'moon',
      equipment: { home: ['dumbbells', 'jetpack', 'dumbbells'], outdoor: 'bench', gym: ['barbell'] },
      mode: 'both',
      sport: 'curling',
    });
    expect(clean).toEqual({ location: null, equipment: { home: ['dumbbells'] }, mode: null, sport: null });
    expect(sanitizePrefs({ location: 'outdoor', sport: 'general', mode: 'bodyweight' })).toEqual({ location: 'outdoor', equipment: {}, mode: 'bodyweight', sport: 'general' });
  });

  it('is wiped for every user at logout and leaves other keys alone', () => {
    writeReadyPrefs('u1', prefs);
    writeReadyPrefs('u2', prefs);
    window.localStorage.setItem('fitai.locale', '"he"');
    window.localStorage.setItem('fitai.draft.u1.menu', '{}');
    clearAllReadyPrefs();
    expect(window.localStorage.getItem('fitai.ready.u1')).toBeNull();
    expect(window.localStorage.getItem('fitai.ready.u2')).toBeNull();
    expect(window.localStorage.getItem('fitai.locale')).toBe('"he"');
    expect(window.localStorage.getItem('fitai.draft.u1.menu')).toBe('{}');
  });
});
