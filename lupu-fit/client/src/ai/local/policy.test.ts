import { describe, expect, it } from 'vitest';
import { chooseProvider, type PolicyInput } from './policy.ts';

const base: PolicyInput = { mode: 'auto', installed: true, supported: true, enabled: true, kind: 'coach', translateLocal: false };

describe('chooseProvider', () => {
  it('auto: local only when installed + supported + enabled, with cloud fallback', () => {
    expect(chooseProvider(base)).toEqual({ first: 'local', fallbackToCloud: true });
    expect(chooseProvider({ ...base, installed: false }).first).toBe('cloud');
    expect(chooseProvider({ ...base, supported: false }).first).toBe('cloud');
    expect(chooseProvider({ ...base, enabled: false }).first).toBe('cloud');
  });
  it('cloud: never local, even when installed', () => {
    expect(chooseProvider({ ...base, mode: 'cloud' })).toEqual({ first: 'cloud', fallbackToCloud: false });
  });
  it('local (on-device only): never falls back to the cloud, even when not installed', () => {
    expect(chooseProvider({ ...base, mode: 'local' })).toEqual({ first: 'local', fallbackToCloud: false });
    expect(chooseProvider({ ...base, mode: 'local', installed: false })).toEqual({ first: 'local', fallbackToCloud: false });
  });
  it('translation stays on the cloud in auto unless the translate toggle is on (default off)', () => {
    expect(chooseProvider({ ...base, kind: 'translate' }).first).toBe('cloud');
    expect(chooseProvider({ ...base, kind: 'translate', translateLocal: true }).first).toBe('local');
    expect(chooseProvider({ ...base, kind: 'translate', mode: 'local' }).first).toBe('local');
  });
});
