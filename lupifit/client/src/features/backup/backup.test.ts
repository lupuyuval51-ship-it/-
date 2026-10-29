import { describe, expect, it } from 'vitest';
import type { AccountExportDTO } from '@shared/types';
import type { OutboxEntry } from '../offline/outbox';
import { BACKUP_FORMAT, buildBackup, MAX_BACKUP_BYTES, parseBackup, planIsEmpty, planRestore, type BackupFile } from './backup';

const TODAY = '2026-10-29';
const food = (id: string, date: string, meal: string, name: string, kcal: number) => ({ id, loggedOn: date, mealType: meal, foodName: { en: name, he: name }, kcal, proteinG: 10, carbsG: 20, fatG: 5, fiberG: 2, note: '' });
const weight = (id: string, date: string, kg: number) => ({ id, measuredOn: date, weightKg: kg, note: '' });
const account = (over: Partial<AccountExportDTO> = {}) => ({ bodyWeights: [], foodLog: [], ...over }) as unknown as AccountExportDTO;
const device = { outbox: [] as OutboxEntry[], workoutPrefs: { wakeLock: true, vibrate: false, autoAdvance: true, restSound: true } };
const backupOf = (a: AccountExportDTO, d = device): BackupFile => buildBackup(a, d, new Date('2026-10-29T10:00:00Z'));
const server = (over: Partial<Pick<AccountExportDTO, 'bodyWeights' | 'foodLog'>> = {}) => ({ bodyWeights: [], foodLog: [], ...over });
const none = new Set<string>();

describe('parseBackup', () => {
  it('round-trips what buildBackup wrote', () => {
    const file = backupOf(account({ bodyWeights: [weight('w1', '2026-10-01', 80)] as never }));
    const parsed = parseBackup(JSON.stringify(file));
    expect(parsed).toMatchObject({ ok: true, backup: { format: BACKUP_FORMAT, version: 1, device: { workoutPrefs: { vibrate: false } } } });
  });

  it('refuses files that are not a backup, are damaged, newer, or too big', () => {
    expect(parseBackup('{oops')).toEqual({ ok: false, reason: 'not_json' });
    expect(parseBackup(JSON.stringify({ hello: 1 }))).toEqual({ ok: false, reason: 'not_a_backup' });
    expect(parseBackup(JSON.stringify({ format: 'fitai-export', version: 1, account: {} }))).toEqual({ ok: false, reason: 'not_a_backup' });
    expect(parseBackup(JSON.stringify({ ...backupOf(account()), version: 2 }))).toEqual({ ok: false, reason: 'unsupported_version' });
    expect(parseBackup('{}', MAX_BACKUP_BYTES + 1)).toEqual({ ok: false, reason: 'too_large' });
  });

  it('tolerates missing sections instead of crashing', () => {
    const parsed = parseBackup(JSON.stringify({ format: BACKUP_FORMAT, version: 1, account: {} }));
    expect(parsed).toMatchObject({ ok: true, backup: { account: { bodyWeights: [], foodLog: [] }, device: { outbox: [] } } });
  });
});

describe('planRestore', () => {
  it('adds only what the account is missing, so a second run adds nothing', () => {
    const file = backupOf(
      account({
        bodyWeights: [weight('w1', '2026-10-01', 80), weight('w2', '2026-10-02', 79.5)] as never,
        foodLog: [food('f1', '2026-10-01', 'breakfast', 'Oats', 300), food('f2', '2026-10-01', 'lunch', 'Soup', 200)] as never,
      }),
    );
    const plan = planRestore(file, server({ bodyWeights: [weight('x', '2026-10-01', 81)] as never, foodLog: [food('y', '2026-10-01', 'breakfast', 'oats', 300)] as never }), none, TODAY);
    expect(plan.weights.map((w) => w.input.date)).toEqual(['2026-10-02']);
    expect(plan.foods.map((f) => f.input.name)).toEqual(['Soup']);
    expect(plan.alreadyThere).toBe(2);
    // The account's own newer value for an existing day is never overwritten.
    expect(plan.weights.some((w) => w.input.date === '2026-10-01')).toBe(false);

    const again = planRestore(file, server({ bodyWeights: [weight('x', '2026-10-01', 81), weight('w2b', '2026-10-02', 79.5)] as never, foodLog: [food('y', '2026-10-01', 'breakfast', 'Oats', 300), food('z', '2026-10-01', 'lunch', 'Soup', 200)] as never }), none, TODAY);
    expect(planIsEmpty(again)).toBe(true);
  });

  it('keeps genuine repeats: two identical meals in the file are two meals', () => {
    const file = backupOf(account({ foodLog: [food('a', '2026-10-01', 'snack', 'Apple', 80), food('b', '2026-10-01', 'snack', 'Apple', 80)] as never }));
    expect(planRestore(file, server(), none, TODAY).foods).toHaveLength(2);
    expect(planRestore(file, server({ foodLog: [food('c', '2026-10-01', 'snack', 'Apple', 80)] as never }), none, TODAY).foods).toHaveLength(1);
  });

  it('skips future dates and invalid values, and counts them', () => {
    const file = backupOf(
      account({
        bodyWeights: [weight('w1', '2026-12-01', 80), weight('w2', '2026-10-02', 9999)] as never,
        foodLog: [food('f1', '2026-10-30', 'lunch', 'Tomorrow', 100), food('f2', '2026-10-01', 'brunch', 'Bad meal', 100), food('f3', '2026-10-01', 'lunch', 'Fine', 100)] as never,
      }),
    );
    const plan = planRestore(file, server(), none, TODAY);
    expect(plan.unreadable).toBe(4);
    expect(plan.foods.map((f) => f.input.name)).toEqual(['Fine']);
    expect(plan.weights).toEqual([]);
  });

  it('gives every item a stable, valid Idempotency-Key', () => {
    const file = backupOf(account({ bodyWeights: [weight('9b2f6a1e-1111-4c5d-8e7f-aaaaaaaaaaaa', '2026-10-01', 80)] as never, foodLog: [food('not a safe key!', '2026-10-01', 'lunch', 'X', 50)] as never }));
    const plan = planRestore(file, server(), none, TODAY);
    for (const k of [plan.weights[0]!.key, plan.foods[0]!.key]) expect(k).toMatch(/^[A-Za-z0-9_-]{8,100}$/);
    expect(planRestore(file, server(), none, TODAY).weights[0]!.key).toBe(plan.weights[0]!.key);
  });

  it('brings back unsynced device entries only if the account does not have them', () => {
    const pendingWeight: OutboxEntry = { id: 'key-weight-0001', createdAt: 1, notBefore: 1, attempts: 0, status: 'pending', op: { type: 'weight', input: { date: '2026-10-05', weightKg: 80, note: '' } } };
    const pendingFood: OutboxEntry = { id: 'key-quick-00001', createdAt: 1, notBefore: 1, attempts: 0, status: 'pending', op: { type: 'quick_add', input: { date: '2026-10-05', mealType: 'lunch', name: 'Soup', kcal: 200, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0, note: '' } } };
    const failed: OutboxEntry = { ...pendingFood, id: 'key-quick-00002', status: 'failed' };
    const file = backupOf(account(), { ...device, outbox: [pendingWeight, pendingFood, failed] });
    expect(planRestore(file, server(), none, TODAY).outbox.map((e) => e.id)).toEqual(['key-weight-0001', 'key-quick-00001']);
    expect(planRestore(file, server({ bodyWeights: [weight('w', '2026-10-05', 80)] as never, foodLog: [food('f', '2026-10-05', 'lunch', 'soup', 200)] as never }), none, TODAY).outbox).toEqual([]);
    expect(planRestore(file, server(), new Set(['key-weight-0001']), TODAY).outbox.map((e) => e.id)).toEqual(['key-quick-00001']);
  });
});
