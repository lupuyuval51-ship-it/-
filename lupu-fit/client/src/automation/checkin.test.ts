import { beforeEach, describe, expect, it } from 'vitest';
import { ensureBackupSince, hasHistoryBeforeWeek, markBackupDone, markCheckinSeen, readBackupState, readCheckinSeen, shouldShowBackup, shouldShowCheckin, snoozeBackup, summarizeLastWeek } from './checkin.ts';

const s = (...d: string[]) => d.map((localDate) => ({ localDate }));
beforeEach(() => localStorage.clear());

describe('summarizeLastWeek', () => {
  // 2026-11-04 is a Wednesday. Hebrew week = Sun 11-01..Sat 11-07, last week 10-25..10-31. English week = Mon 11-02.., last week 10-26..11-01.
  it('counts last calendar week only (Sunday start in Hebrew)', () => {
    const sessions = s('2026-10-24', '2026-10-25', '2026-10-31', '2026-11-01', '2026-11-03');
    expect(summarizeLastWeek({ today: '2026-11-04', lang: 'he', goal: 3, sessions, weights: [], includeWeight: true })).toMatchObject({ weekStart: '2026-10-25', done: 2, goal: 3 });
  });
  it('Monday start in English', () => {
    const sessions = s('2026-10-25', '2026-10-26', '2026-11-01', '2026-11-02');
    expect(summarizeLastWeek({ today: '2026-11-04', lang: 'en', goal: 4, sessions, weights: [], includeWeight: true })).toMatchObject({ weekStart: '2026-10-26', done: 2 });
  });
  it('weight change: last logged in the week vs the last one before it', () => {
    const w = [{ loggedDate: '2026-10-20', weightKg: 80 }, { loggedDate: '2026-10-27', weightKg: 79.5 }, { loggedDate: '2026-10-30', weightKg: 79.2 }, { loggedDate: '2026-11-03', weightKg: 70 }];
    expect(summarizeLastWeek({ today: '2026-11-04', lang: 'he', goal: 3, sessions: [], weights: w, includeWeight: true }).weightDeltaKg).toBe(-0.8);
  });
  it('no earlier baseline: needs two entries inside the week, otherwise nothing', () => {
    const one = [{ loggedDate: '2026-10-27', weightKg: 79.5 }];
    expect(summarizeLastWeek({ today: '2026-11-04', lang: 'he', goal: 3, sessions: [], weights: one, includeWeight: true }).weightDeltaKg).toBeNull();
    expect(summarizeLastWeek({ today: '2026-11-04', lang: 'he', goal: 3, sessions: [], weights: [...one, { loggedDate: '2026-10-30', weightKg: 79 }], includeWeight: true }).weightDeltaKg).toBe(-0.5);
  });
  it('never reports weight when excluded (minors)', () => {
    const w = [{ loggedDate: '2026-10-20', weightKg: 60 }, { loggedDate: '2026-10-27', weightKg: 61 }];
    expect(summarizeLastWeek({ today: '2026-11-04', lang: 'he', goal: 3, sessions: [], weights: w, includeWeight: false }).weightDeltaKg).toBeNull();
  });
});

describe('shouldShowCheckin', () => {
  const base = { enabled: true, today: '2026-11-04', lang: 'he' as const, seenWeek: null, hasHistory: true };
  it('shows on the first open of a week and not once dismissed that week', () => {
    expect(shouldShowCheckin(base)).toBe(true);
    expect(shouldShowCheckin({ ...base, seenWeek: '2026-11-01' })).toBe(false);
    expect(shouldShowCheckin({ ...base, seenWeek: '2026-10-25' })).toBe(true);
  });
  it('reappears when the week rolls over (Sunday in he, Monday in en)', () => {
    const seen = '2026-11-01';
    expect(shouldShowCheckin({ ...base, today: '2026-11-07', seenWeek: seen })).toBe(false);
    expect(shouldShowCheckin({ ...base, today: '2026-11-08', seenWeek: seen })).toBe(true);
    expect(shouldShowCheckin({ ...base, lang: 'en', today: '2026-11-08', seenWeek: '2026-11-02' })).toBe(false);
    expect(shouldShowCheckin({ ...base, lang: 'en', today: '2026-11-09', seenWeek: '2026-11-02' })).toBe(true);
  });
  it('is hidden when disabled or when there is nothing to summarise', () => {
    expect(shouldShowCheckin({ ...base, enabled: false })).toBe(false);
    expect(shouldShowCheckin({ ...base, hasHistory: false })).toBe(false);
  });
  it('needs data from before this week: a person who joined this week has no last week to report', () => {
    const w = (loggedDate: string) => [{ loggedDate, weightKg: 70 }];
    expect(hasHistoryBeforeWeek({ today: '2026-11-04', lang: 'he', sessions: s('2026-11-01', '2026-11-04'), weights: w('2026-11-02') })).toBe(false);
    expect(hasHistoryBeforeWeek({ today: '2026-11-04', lang: 'he', sessions: s('2026-10-31'), weights: [] })).toBe(true);
    expect(hasHistoryBeforeWeek({ today: '2026-11-04', lang: 'he', sessions: [], weights: w('2026-10-20') })).toBe(true);
    // Sunday 11-01 is this week in Hebrew but last week in English
    expect(hasHistoryBeforeWeek({ today: '2026-11-04', lang: 'en', sessions: s('2026-11-01'), weights: [] })).toBe(true);
  });
  it('persists the seen week', () => { expect(readCheckinSeen()).toBeNull(); markCheckinSeen('2026-11-01'); expect(readCheckinSeen()).toBe('2026-11-01'); });
});

describe('shouldShowBackup', () => {
  const st = { since: '2026-10-01', lastDone: null, snoozed: null };
  const base = { enabled: true, isDevice: true, today: '2026-11-04', state: st, hasData: true };
  it('after 30 days without a backup', () => { expect(shouldShowBackup(base)).toBe(true); expect(shouldShowBackup({ ...base, today: '2026-10-30' })).toBe(false); expect(shouldShowBackup({ ...base, today: '2026-10-31' })).toBe(true); });
  it('never on the hosted build, when disabled, or with no data', () => {
    expect(shouldShowBackup({ ...base, isDevice: false })).toBe(false); expect(shouldShowBackup({ ...base, enabled: false })).toBe(false); expect(shouldShowBackup({ ...base, hasData: false })).toBe(false);
  });
  it('a recent export or snooze postpones the next reminder by a month', () => {
    expect(shouldShowBackup({ ...base, state: { ...st, lastDone: '2026-10-20' } })).toBe(false);
    expect(shouldShowBackup({ ...base, state: { ...st, snoozed: '2026-10-25' } })).toBe(false);
    expect(shouldShowBackup({ ...base, today: '2026-11-25', state: { ...st, snoozed: '2026-10-25' } })).toBe(true);
  });
  it('no baseline yet means no reminder', () => { expect(shouldShowBackup({ ...base, state: { since: null, lastDone: null, snoozed: null } })).toBe(false); });
  it('stores first open once, snooze and export', () => {
    ensureBackupSince('2026-10-01'); ensureBackupSince('2026-11-01');
    expect(readBackupState().since).toBe('2026-10-01');
    snoozeBackup('2026-11-04'); expect(readBackupState().snoozed).toBe('2026-11-04');
    markBackupDone(); expect(readBackupState().lastDone).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
