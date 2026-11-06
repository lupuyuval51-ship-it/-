import { describe, expect, it } from 'vitest';
import { parseBackupText, withClientSettings } from './backup.ts';

const v1 = { version: 1, exportedAt: '2026-05-01T00:00:00Z', profile: null, bodyWeight: [{ loggedDate: '2026-05-01', weightKg: 80 }], foodLog: [{ loggedDate: '2026-05-01', slot: 'lunch', name: 'Rice', grams: 100, kcal: 130, proteinG: 2, carbsG: 28, fatG: 0.3 }], sessions: [] };
const v2 = {
  version: 2, exportedAt: '2026-05-01T00:00:00.000Z', appVersion: '0.10.0', mode: 'device', profile: null,
  bodyWeight: [{ loggedDate: '2026-05-01', weightKg: 80 }], readiness: [{ localDate: '2026-05-01', sleep: 3, energy: 3, soreness: 3, pain: false }], foodLog: v1.foodLog,
  savedMeals: [{ name: 'M', slot: 'lunch', createdAt: '2026-05-01T00:00:00.000Z', items: [{ name: 'Rice', grams: 100, kcal: 130, proteinG: 3, carbsG: 28, fatG: 0 }] }],
  customFoods: [], plans: [], personalRecords: [], xpEvents: [], achievements: [], notifications: [],
  sessions: [
    { id: 'a', name: 'Done', source: 'custom', sourceId: null, sport: null, startedAt: '2026-05-01T08:00:00.000Z', finishedAt: '2026-05-01T09:00:00.000Z', durationSec: 3600, localDate: '2026-05-01', readiness: null, xpAwarded: 0, exercises: [] },
    { id: 'b', name: 'Open', source: 'custom', sourceId: null, sport: null, startedAt: '2026-05-02T08:00:00.000Z', finishedAt: null, durationSec: null, localDate: '2026-05-02', readiness: null, xpAwarded: 0, exercises: [] },
  ],
  coachThreads: [{ title: 'Chat', createdAt: '2026-05-01T00:00:00.000Z', updatedAt: '2026-05-01T00:00:00.000Z', messages: [{ role: 'user', content: 'hi', provider: null, safetyCategory: null, createdAt: '2026-05-01T00:00:00.000Z' }, { role: 'assistant', content: 'hello', provider: 'rules', safetyCategory: null, createdAt: '2026-05-01T00:00:01.000Z' }] }],
};

describe('parseBackupText', () => {
  it('accepts a bare backup and a full export file, and counts what is in it', () => {
    for (const text of [JSON.stringify(v1), JSON.stringify({ backup: v1, extra: { account: null } })]) {
      const r = parseBackupText(text);
      expect(r.ok).toBe(true);
      if (r.ok) { expect(r.version).toBe(1); expect(r.counts).toMatchObject({ weights: 1, foods: 1, workouts: 0, plans: 0, threads: 0 }); expect(r.clientSettings).toBeNull(); }
    }
    const r = parseBackupText(JSON.stringify({ backup: v2, extra: { account: null }, clientSettings: { v: 1, theme: 'dark', language: 'he' } }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.version).toBe(2);
      expect(r.counts).toEqual({ workouts: 1, foods: 1, weights: 1, readiness: 1, plans: 0, savedMeals: 1, customFoods: 0, threads: 1, messages: 2 }); // the workout still in progress is not counted
      expect(r.clientSettings).toEqual({ v: 1, theme: 'dark', language: 'he' });
    }
  });

  it('names what is wrong: not JSON, not a backup, a newer format, or the failing place', () => {
    expect(parseBackupText('{nope')).toEqual({ ok: false, reason: 'json' });
    expect(parseBackupText('[1,2]')).toEqual({ ok: false, reason: 'shape' });
    expect(parseBackupText('"x"')).toEqual({ ok: false, reason: 'shape' });
    expect(parseBackupText('{"hello":1}')).toEqual({ ok: false, reason: 'notBackup' });
    expect(parseBackupText(JSON.stringify({ backup: { hello: 1 } }))).toEqual({ ok: false, reason: 'notBackup' });
    expect(parseBackupText(JSON.stringify({ ...v2, version: 3 }))).toEqual({ ok: false, reason: 'newer', version: 3 });
    expect(parseBackupText(JSON.stringify({ backup: { ...v2, version: 11 } }))).toMatchObject({ ok: false, reason: 'newer', version: 11 });
    expect(parseBackupText(JSON.stringify({ ...v1, version: 0 }))).toMatchObject({ ok: false, reason: 'schema', path: 'version' });
    expect(parseBackupText(JSON.stringify({ ...v1, foodLog: [{ ...v1.foodLog[0], slot: 'brunch' }] }))).toMatchObject({ ok: false, reason: 'schema', path: 'foodLog.0.slot' });
    expect(parseBackupText(JSON.stringify({ ...v1, surprise: true }))).toMatchObject({ ok: false, reason: 'schema' });
    expect(parseBackupText(JSON.stringify({ ...v2, plans: undefined }))).toMatchObject({ ok: false, reason: 'schema', path: 'plans' });
    expect(parseBackupText(JSON.stringify({ ...v2, customFoods: [{ name: 'x', kcal: 1, proteinG: 1, carbsG: 1, fatG: 1, servingG: 100, barcode: 'nope', createdAt: '2026-05-01T00:00:00.000Z' }] }))).toMatchObject({ ok: false, reason: 'schema', path: 'customFoods.0.barcode' });
  });

  it('a damaged or hostile clientSettings block is dropped; it never blocks the data and never carries a credential key', () => {
    for (const cs of [{ v: 1, lf_username: 'secret' }, { v: 1, theme: 'neon' }, { v: 2 }, 'text', { v: 1, menus: { 'not a date': { mealCount: 3, shuffle: 0, swaps: [] } } }]) {
      const r = parseBackupText(JSON.stringify({ backup: v2, clientSettings: cs }));
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.clientSettings).toBeNull();
    }
  });

  it('adds the browser settings block next to the backup, not inside it', () => {
    const file = withClientSettings({ backup: v2, extra: {} }, { v: 1, theme: 'light' }) as { backup: unknown; clientSettings: unknown };
    expect(file.backup).toBe(v2); expect(file.clientSettings).toEqual({ v: 1, theme: 'light' });
    expect(withClientSettings('x', { v: 1 })).toBe('x');
  });
});
