import { AI_FEATURES } from '@domain/entitlements';
import { effectiveTier, parseProfile, toAiUsage } from '../api';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

describe('effectiveTier (mirrors SQL current_tier)', () => {
  const now = new Date('2026-11-05T12:00:00Z');
  it('is pro only when active and not expired', () => {
    expect(effectiveTier(null, now)).toBe('free');
    expect(effectiveTier({ tier: 'free', status: 'active', current_period_end: null }, now)).toBe('free');
    expect(effectiveTier({ tier: 'pro', status: 'active', current_period_end: null }, now)).toBe('pro');
    expect(effectiveTier({ tier: 'pro', status: 'active', current_period_end: '2026-12-01T00:00:00Z' }, now)).toBe('pro');
    expect(effectiveTier({ tier: 'pro', status: 'active', current_period_end: '2026-11-01T00:00:00Z' }, now)).toBe('free');
    expect(effectiveTier({ tier: 'pro', status: 'canceled', current_period_end: null }, now)).toBe('free');
    expect(effectiveTier({ tier: 'pro', status: 'expired', current_period_end: null }, now)).toBe('free');
  });
});

describe('toAiUsage', () => {
  it('fills every feature and ignores unknown rows', () => {
    const usage = toAiUsage([
      { feature: 'advisor_message', used: 7 },
      { feature: 'plan_generation', used: 1 },
      { feature: 'unknown_feature', used: 99 },
    ]);
    expect(Object.keys(usage).sort()).toEqual([...AI_FEATURES].sort());
    expect(usage.advisor_message).toBe(7);
    expect(usage.plan_generation).toBe(1);
    expect(usage.marketing_generation).toBe(0);
  });
});

describe('parseProfile', () => {
  it('narrows locale and theme', () => {
    const row = {
      id: 'u1',
      display_name: 'Dana',
      locale: 'en',
      theme: 'dark',
      active_business_id: null,
      created_at: 'x',
      updated_at: 'y',
    };
    expect(parseProfile(row)).toMatchObject({ locale: 'en', theme: 'dark' });
    expect(parseProfile({ ...row, locale: 'fr', theme: 'neon' })).toMatchObject({ locale: 'he', theme: 'system' });
  });
});
