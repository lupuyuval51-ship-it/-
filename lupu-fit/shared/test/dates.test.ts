import { describe, expect, it } from 'vitest';
import { BackupPayloadSchema, IsoDateSchema } from '../src/index.js';

describe('IsoDateSchema', () => {
  it('accepts real calendar dates, including leap days', () => {
    for (const d of ['2026-11-02', '2024-02-29', '2000-01-01', '2026-12-31']) expect(IsoDateSchema.safeParse(d).success, d).toBe(true);
  });
  it('rejects the right shape with a wrong value, and the wrong shape', () => {
    for (const d of ['2026-13-45', '2026-02-31', '2025-02-29', '2026-00-10', '2026-11-00', '2026-1-2', '20261102', '', '2026-11-02T00:00:00Z']) expect(IsoDateSchema.safeParse(d).success, d).toBe(false);
  });
});

describe('BackupPayloadSchema timestamps', () => {
  const base = { version: 1, exportedAt: '2026-11-02T08:00:00.000Z', profile: null, bodyWeight: [], foodLog: [] };
  const session = (startedAt: string, finishedAt: string | null) => ({ ...base, sessions: [{ id: 's', startedAt, finishedAt, exercises: [] }] });
  it('takes what the app exports', () => {
    expect(BackupPayloadSchema.safeParse(session('2026-11-02T08:00:00.000Z', '2026-11-02T09:00:00.000Z')).success).toBe(true);
    expect(BackupPayloadSchema.safeParse(session('2026-11-02T08:00:00.000Z', null)).success).toBe(true);
  });
  it('rejects unparseable, absurd and extended-year timestamps', () => {
    for (const bad of ['garbage', '', '+275760-09-13T00:00:00.000Z', '1969-12-31T23:59:59Z', '2200-01-01T00:00:00Z']) {
      expect(BackupPayloadSchema.safeParse(session(bad, null)).success, bad).toBe(false);
      expect(BackupPayloadSchema.safeParse(session('2026-11-02T08:00:00.000Z', bad)).success, bad).toBe(false);
    }
  });
});
