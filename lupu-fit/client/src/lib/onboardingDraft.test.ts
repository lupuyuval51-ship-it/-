import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ONBOARDING_DRAFT_KEY, ONBOARDING_DRAFT_TTL_MS, clearOnboardingDraft, loadOnboardingDraft, saveOnboardingDraft } from './onboardingDraft.ts';

beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-01T10:00:00Z')); });
afterEach(() => { vi.useRealTimers(); });

describe('onboarding draft', () => {
  it('uses the agreed key and stores {savedAt, step, data}', () => {
    saveOnboardingDraft(2, { age: 30 });
    expect(ONBOARDING_DRAFT_KEY).toBe('lf_onboarding_draft');
    expect(JSON.parse(localStorage.getItem('lf_onboarding_draft') as string)).toEqual({ savedAt: Date.now(), step: 2, data: { age: 30 } });
  });
  it('restores a fresh draft', () => {
    saveOnboardingDraft(3, { goal: 'strength' });
    vi.advanceTimersByTime(ONBOARDING_DRAFT_TTL_MS - 1000);
    expect(loadOnboardingDraft()).toMatchObject({ step: 3, data: { goal: 'strength' } });
  });
  it('drops (and removes) a draft older than 3 days', () => {
    saveOnboardingDraft(3, { goal: 'strength' });
    vi.advanceTimersByTime(ONBOARDING_DRAFT_TTL_MS + 1000);
    expect(loadOnboardingDraft()).toBeNull();
    expect(localStorage.getItem(ONBOARDING_DRAFT_KEY)).toBeNull();
  });
  it('ignores malformed storage and clears on request', () => {
    localStorage.setItem(ONBOARDING_DRAFT_KEY, '{not json');
    expect(loadOnboardingDraft()).toBeNull();
    localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify({ savedAt: Date.now(), step: 'x', data: {} }));
    expect(loadOnboardingDraft()).toBeNull();
    saveOnboardingDraft(1, {}); clearOnboardingDraft();
    expect(localStorage.getItem(ONBOARDING_DRAFT_KEY)).toBeNull();
  });
});
