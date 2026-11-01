import { describe, expect, it } from 'vitest';
import { parseBackupText } from './backup.ts';

const valid = { version: 1, exportedAt: '2026-05-01T00:00:00Z', profile: null, bodyWeight: [{ loggedDate: '2026-05-01', weightKg: 80 }], foodLog: [{ loggedDate: '2026-05-01', slot: 'lunch', name: 'Rice', grams: 100, kcal: 130, proteinG: 2, carbsG: 28, fatG: 0.3 }], sessions: [] };

describe('parseBackupText', () => {
  it('accepts a bare backup and a full export file, and counts entries', () => {
    for (const text of [JSON.stringify(valid), JSON.stringify({ backup: valid, extra: { customFoods: [] } })]) {
      const r = parseBackupText(text);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.counts).toEqual({ weights: 1, foodEntries: 1, sessions: 0 });
    }
  });
  it('rejects non-JSON, non-objects and schema violations with the failing path', () => {
    expect(parseBackupText('{nope')).toEqual({ ok: false, reason: 'json' });
    expect(parseBackupText('[1,2]')).toEqual({ ok: false, reason: 'shape' });
    expect(parseBackupText('"x"')).toEqual({ ok: false, reason: 'shape' });
    const bad = parseBackupText(JSON.stringify({ ...valid, version: 2 }));
    expect(bad).toMatchObject({ ok: false, reason: 'schema', path: 'version' });
    expect(parseBackupText(JSON.stringify({ ...valid, foodLog: [{ ...valid.foodLog[0], slot: 'brunch' }] }))).toMatchObject({ ok: false, reason: 'schema', path: 'foodLog.0.slot' });
    expect(parseBackupText(JSON.stringify({ ...valid, surprise: true }))).toMatchObject({ ok: false, reason: 'schema' });
  });
});
