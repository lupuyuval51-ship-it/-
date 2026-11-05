import { resolveDirectionAction } from '../direction';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

describe('resolveDirectionAction (cold start, native)', () => {
  it('does nothing when the native direction already matches', () => {
    expect(resolveDirectionAction({ locale: 'he', nativeIsRTL: true, guard: null })).toBe('none');
    expect(resolveDirectionAction({ locale: 'en', nativeIsRTL: false, guard: 'en' })).toBe('none');
  });

  it('reloads once on mismatch', () => {
    expect(resolveDirectionAction({ locale: 'he', nativeIsRTL: false, guard: null })).toBe('reload');
    expect(resolveDirectionAction({ locale: 'en', nativeIsRTL: true, guard: 'he' })).toBe('reload');
  });

  it('never loops: gives up if we already reloaded for this locale', () => {
    expect(resolveDirectionAction({ locale: 'he', nativeIsRTL: false, guard: 'he' })).toBe('give-up');
    expect(resolveDirectionAction({ locale: 'en', nativeIsRTL: true, guard: 'en' })).toBe('give-up');
  });
});
