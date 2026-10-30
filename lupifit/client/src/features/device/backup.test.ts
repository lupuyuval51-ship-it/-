/**
 * A backup file the app saves must always be one the app can read back: compact JSON, the phone's own size
 * limit, a warning instead of a "last backup" when a file would be too large, and years of history fit.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AccountExportDTO } from '@shared/types';
import { installPlatform, resetPlatform } from '../../platform';
import { MAX_BACKUP_BYTES, buildBackup } from '../backup/backup';
import { MAX_DEVICE_BACKUP_BYTES, readDeviceBackup, saveDeviceBackup, serializeDeviceBackup, utf8Length } from './backup';
import { lastBackupAt, lastBackupShared } from './control';

const fixtures = vi.hoisted(() => ({ account: null as unknown, snapshot: null as unknown }));

vi.mock('../profile/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../profile/api')>()),
  fetchAccountExport: async () => fixtures.account,
}));
vi.mock('../../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/client')>()),
  apiGet: async () => fixtures.snapshot,
}));

const uuid = (n: number) => `${(n % 0xffffffff).toString(16).padStart(8, '0')}-4a5b-4c7d-8e0f-1a2b3c4d5e6f`;
const at = (day: number, minute = 0) => new Date(Date.UTC(2020, 0, 1) + day * 86_400_000 + minute * 60_000).toISOString();
const date = (day: number) => at(day).slice(0, 10);

/**
 * Synthetic history shaped like the real rows (column names and value sizes as in the database and the
 * account export): 8 food entries a day, 4 workouts a week with 5 exercises × 4 sets, a weigh-in a week.
 */
function history(years: number) {
  const days = Math.round(years * 365);
  const userId = uuid(1);
  const foods: Record<string, unknown>[] = [];
  const exportFoods: Record<string, unknown>[] = [];
  const sessions: Record<string, unknown>[] = [];
  const sets: Record<string, unknown>[] = [];
  const weights: Record<string, unknown>[] = [];
  let n = 10;
  for (let d = 0; d < days; d++) {
    for (let i = 0; i < 8; i++) {
      const id = uuid(n++);
      const name = { en: 'Greek yogurt 3% with honey', he: 'יוגורט יווני 3% עם דבש' };
      foods.push({
        id, user_id: userId, logged_on: date(d), meal_type: 'snack', food_id: uuid(n++), food_name: name, grams: 170, servings: null,
        kcal: 158.5, protein_g: 15.3, carbs_g: 12.1, fat_g: 5.1, fiber_g: 0, is_corrected: false, source: 'manual', note: '',
        created_at: at(d, i * 60), updated_at: at(d, i * 60),
      });
      exportFoods.push({ id, loggedOn: date(d), mealType: 'snack', foodName: name, grams: 170, servings: null, kcal: 158.5, proteinG: 15.3, carbsG: 12.1, fatG: 5.1, fiberG: 0, source: 'manual', note: '' });
    }
    if (d % 7 === 0) weights.push({ id: uuid(n++), user_id: userId, measured_on: date(d), weight_kg: 81.4, note: '', created_at: at(d) });
    if ([0, 2, 4, 5].includes(d % 7)) {
      const sessionId = uuid(n++);
      sessions.push({ id: sessionId, user_id: userId, plan_id: uuid(2), status: 'completed', started_at: at(d, 600), finished_at: at(d, 660), notes: '', xp_awarded: 40, created_at: at(d, 600), updated_at: at(d, 660) });
      for (let e = 0; e < 5; e++) {
        const exerciseId = uuid(n++);
        for (let s = 1; s <= 4; s++) {
          sets.push({
            id: uuid(n++), session_exercise_id: exerciseId, session_id: sessionId, user_id: userId, set_number: s, target_reps: 8, target_weight_kg: 60,
            target_seconds: null, reps: 8, weight_kg: 62.5, duration_seconds: null, rpe: 8, completed: true, completed_at: at(d, 600 + e * 10 + s), created_at: at(d, 600), updated_at: at(d, 600 + e * 10 + s),
          });
        }
      }
    }
  }
  const account = {
    exportDate: '2026-10-30',
    user: { id: userId, email: 'device@example', displayName: 'Me' },
    profile: {},
    bodyWeights: weights.map((w) => ({ id: w.id, measuredOn: w.measured_on, weightKg: w.weight_kg, note: '' })),
    foodLog: exportFoods,
    workouts: sessions.map((s) => ({ ...s, sets: sets.filter((x) => x.session_id === s.id) })),
  } as unknown as AccountExportDTO;
  const snapshot = {
    format: 'lupu-fit-device-data', version: 1, schema: '0094_server_settings', createdAt: '2026-10-30T10:00:00.000Z', user: { display_name: 'Me' },
    tables: { food_log_entries: foods, workout_sessions: sessions, session_sets: sets, body_weights: weights }, sharedFoods: [],
  };
  return { account, snapshot, rows: foods.length + sessions.length + sets.length + weights.length };
}

function asFile(text: string): File {
  return Object.assign(new File([text], 'backup.json', { type: 'application/json' }), { text: async () => text });
}

let saved: string | null = null;
beforeEach(() => {
  window.localStorage.clear();
  saved = null;
  installPlatform({ saveFile: async (_name, _mime, data) => ((saved = String(data)), 'saved') });
});
afterEach(() => resetPlatform());

describe('device backup file', () => {
  it('is saved as compact JSON and read back by the app (five years of daily use)', async () => {
    const big = history(5);
    fixtures.account = big.account;
    fixtures.snapshot = big.snapshot;
    const res = await saveDeviceBackup(new Date('2026-10-30T10:00:00Z'));
    expect(res).toMatchObject({ result: 'saved', restorable: true });
    expect(saved).not.toBeNull();
    expect(saved!.startsWith('{"format":"lupu-fit-backup"')).toBe(true); // no indentation
    // Indented like before, this history was already past the website's 25 MB limit; compact, both copies fit easily.
    const indented = JSON.stringify(JSON.parse(saved!), null, 2);
    expect(indented.length).toBeGreaterThan(MAX_BACKUP_BYTES);
    expect(res.bytes).toBeLessThan(MAX_DEVICE_BACKUP_BYTES / 4);
    const read = await readDeviceBackup(asFile(saved!));
    expect(read.ok).toBe(true);
    if (read.ok) expect(read.summary.foods).toBe(5 * 365 * 8);
    expect(lastBackupAt()).toBe('2026-10-30T10:00:00.000Z');
    // At this rate, about 30 years of heavy use stay under the phone's limit.
    expect((res.bytes / 5) * 30).toBeLessThan(MAX_DEVICE_BACKUP_BYTES);
  }, 60_000);

  it('a file larger than the app can read back is reported and not counted as a backup', async () => {
    const small = history(0.05);
    fixtures.account = small.account;
    fixtures.snapshot = small.snapshot;
    // A lower limit stands in for decades of data.
    const limit = 50_000;
    const res = await saveDeviceBackup(new Date(), limit);
    expect(res.bytes).toBeGreaterThan(limit);
    expect(res.restorable).toBe(false);
    expect(lastBackupAt()).toBeNull();
    expect(await readDeviceBackup(asFile(saved!), limit)).toEqual({ ok: false, reason: 'too_large' });
    expect((await readDeviceBackup(asFile(saved!))).ok).toBe(true);
  });

  it('measures the file in UTF-8 bytes', () => {
    expect(utf8Length('abc')).toBe(3);
    expect(utf8Length('שלום')).toBe(8);
    expect(utf8Length('’')).toBe(3);
    expect(utf8Length('💪')).toBe(4);
  });

  it('remembers that the last backup only went to the share sheet', async () => {
    const small = history(0.05);
    fixtures.account = small.account;
    fixtures.snapshot = small.snapshot;
    installPlatform({ saveFile: async () => 'shared' });
    await saveDeviceBackup();
    expect(lastBackupShared()).toBe(true);
    installPlatform({ saveFile: async () => 'saved' });
    await saveDeviceBackup();
    expect(lastBackupShared()).toBe(false);
  });

  it('serializes exactly what buildBackup made', () => {
    const small = history(0.02);
    const file = buildBackup(small.account, { outbox: [], workoutPrefs: { wakeLock: true, vibrate: true, autoAdvance: true, restSound: true } });
    expect(JSON.parse(serializeDeviceBackup(file))).toEqual(file);
  });
});
