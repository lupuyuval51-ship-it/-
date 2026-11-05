import { decodeFieldMessage, fieldMessage } from '../forms';
import { qk } from '../queryKeys';
import { readPublicConfig } from '../env';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

describe('fieldMessage / decodeFieldMessage', () => {
  it('round-trips keys and vars', () => {
    expect(fieldMessage('errors.field.required')).toBe('errors.field.required');
    const encoded = fieldMessage('errors.field.passwordTooShort', { min: 8 });
    expect(decodeFieldMessage(encoded)).toEqual({ key: 'errors.field.passwordTooShort', vars: { min: 8 } });
    expect(decodeFieldMessage(fieldMessage('errors.field.tooLong', { max: 100, label: 'a b&c' }))).toEqual({
      key: 'errors.field.tooLong',
      vars: { max: 100, label: 'a b&c' },
    });
  });

  it('rejects unknown keys (raw zod messages)', () => {
    expect(decodeFieldMessage('Invalid input: expected string')).toBeNull();
    expect(decodeFieldMessage('errors.field')).toBeNull();
  });
});

describe('query keys', () => {
  it('follows the contract shapes', () => {
    expect(qk.me.profile()).toEqual(['me', 'profile']);
    expect(qk.me.businesses()).toEqual(['me', 'businesses']);
    expect(qk.me.entitlement()).toEqual(['me', 'entitlement']);
    expect(qk.me.aiUsage()).toEqual(['me', 'aiUsage']);
    expect(qk.b('biz-1')).toEqual(['b', 'biz-1']);
    expect(qk.b('biz-1', 'plan', 'version', 'v2')).toEqual(['b', 'biz-1', 'plan', 'version', 'v2']);
  });
});

describe('public config', () => {
  it('reports missing values instead of throwing', () => {
    expect(readPublicConfig({ supabaseUrl: undefined, supabaseAnonKey: '  ' })).toEqual({
      ok: false,
      missing: ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'],
    });
  });

  it('normalizes a valid configuration', () => {
    expect(readPublicConfig({ supabaseUrl: ' http://127.0.0.1:54321/ ', supabaseAnonKey: 'anon' })).toEqual({
      ok: true,
      config: { supabaseUrl: 'http://127.0.0.1:54321', supabaseAnonKey: 'anon' },
    });
  });

  it('rejects a malformed URL', () => {
    expect(readPublicConfig({ supabaseUrl: 'localhost', supabaseAnonKey: 'anon' })).toEqual({ ok: false, missing: ['EXPO_PUBLIC_SUPABASE_URL'] });
  });
});
