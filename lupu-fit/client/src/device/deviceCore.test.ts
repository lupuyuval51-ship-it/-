import 'fake-indexeddb/auto';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { PgliteAdapter } from '../../../server/src/db/pgliteAdapter.ts';
import type { Deps } from '../../../server/src/core/types.ts';
import type { TransportRequest } from '../api/transport.ts';
import { createDeviceServer, idbStore, type DbStore, type DeviceServer } from './deviceCore.ts';

const deps = (db: PgliteAdapter): Deps => ({ db, mode: 'device', clock: () => new Date(), pbkdf2Iterations: 1000, sessionTtlDays: 3650, secureCookies: false });
const dirStore = (dir: string): DbStore => ({
  open: () => PgliteAdapter.create(dir),
  async destroy(db) { await db.close(); await rm(dir, { recursive: true, force: true }); },
});
const MARK = 'ZZMARKERDELETEDZZ';
const DEL: TransportRequest = { method: 'DELETE', path: '/api/account', body: { confirm: 'DELETE' }, headers: { 'idempotency-key': 'k-del' } };

async function call(s: DeviceServer, method: string, path: string, body?: unknown) {
  const out = await s.handle({ method, path, body, headers: method === 'GET' ? {} : { 'idempotency-key': crypto.randomUUID() } });
  return out;
}
async function writeMarkers(s: DeviceServer): Promise<void> {
  expect((await call(s, 'POST', '/api/food-log', { loggedDate: '2026-11-02', slot: 'lunch', name: MARK, grams: 100, kcal: 130, proteinG: 3, carbsG: 28, fatG: 0 })).res.status).toBe(201);
  expect((await call(s, 'POST', '/api/coach/threads', { title: MARK })).res.status).toBeLessThan(300);
}
async function filesContain(dir: string, marker: string): Promise<string[]> {
  const hits: string[] = [];
  const walk = async (d: string): Promise<void> => {
    for (const e of await readdir(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else if ((await readFile(p)).includes(marker)) hits.push(p);
    }
  };
  await walk(dir);
  return hits;
}
const meId = async (s: DeviceServer) => { const r = (await call(s, 'GET', '/api/auth/me')).res; expect(r.status).toBe(200); return (r.body as { user: { id: string } }).user.id; };

const open: DeviceServer[] = []; const dirs: string[] = [];
afterEach(async () => { for (const s of open.splice(0)) await s.close().catch(() => undefined); for (const d of dirs.splice(0)) await rm(d, { recursive: true, force: true }); });
async function fresh(): Promise<{ dir: string; s: DeviceServer }> {
  const dir = await mkdtemp(join(tmpdir(), 'lf-device-')); dirs.push(dir);
  const s = createDeviceServer(dirStore(dir), deps); open.push(s);
  await s.boot();
  return { dir, s };
}

describe('Device Mode account deletion', () => {
  it('removes the deleted person from the files (heap and WAL) and provisions a fresh account', async () => {
    const { dir, s } = await fresh();
    const before = await meId(s);
    await writeMarkers(s);
    await s.close(); // flush to disk so the check below is meaningful
    expect((await filesContain(dir, MARK)).length).toBeGreaterThan(0);
    await s.boot();
    const out = await s.handle(DEL);
    expect(out.res.status).toBe(200);
    await out.after?.();
    expect(await meId(s)).not.toBe(before);
    await s.close();
    expect(await filesContain(dir, MARK)).toEqual([]);
  }, 60_000);

  it('repairs itself on the next launch when the app was closed after the delete but before the wipe', async () => {
    const { dir, s } = await fresh();
    const before = await meId(s);
    await writeMarkers(s);
    expect((await s.handle(DEL)).res.status).toBe(200); // `after` never runs: the app was killed here
    await s.close();
    const relaunched = createDeviceServer(dirStore(dir), deps); open.push(relaunched);
    await relaunched.boot(); // used to throw device_login_failed:401 on every launch
    expect(await meId(relaunched)).not.toBe(before);
    await relaunched.close();
    expect(await filesContain(dir, MARK)).toEqual([]);
  }, 60_000);

  it('survives more than ten deletions in an hour (registration counters go with the wiped database)', async () => {
    const { s } = await fresh();
    for (let i = 0; i < 11; i++) {
      const out = await s.handle(DEL);
      expect(out.res.status).toBe(200);
      await out.after?.();
    }
    await meId(s);
  }, 120_000);

  it('retries a failed wipe on the next request instead of staying broken', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'lf-device-')); dirs.push(dir);
    let failOnce = true;
    const base = dirStore(dir);
    const s = createDeviceServer({ open: base.open, async destroy(db) { if (failOnce) { failOnce = false; await db.close(); throw new Error('quota'); } await base.destroy(db); } }, deps);
    open.push(s);
    await s.boot();
    const before = await meId(s);
    const out = await s.handle(DEL);
    expect(out.res.status).toBe(200);
    await expect(out.after?.()).rejects.toThrow('quota');
    expect(await meId(s)).not.toBe(before);
  }, 60_000);
});

describe('idbStore', () => {
  it('deletes the IndexedDB database even though PGlite leaves its connection open', async () => {
    const s = createDeviceServer(idbStore('idb://lf-test-wipe', () => indexedDB, 5000), deps); open.push(s);
    await s.boot();
    await writeMarkers(s);
    const out = await s.handle(DEL);
    await out.after?.(); // used to wait forever on the blocked deleteDatabase
    await meId(s);
    await s.close();
    const dbx = await new Promise<IDBDatabase>((res, rej) => { const r = indexedDB.open('/pglite/lf-test-wipe'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const names = [...dbx.objectStoreNames];
    const tx = dbx.transaction(names, 'readonly');
    const values = (await Promise.all(names.map((n) => new Promise<unknown[]>((res) => { const r = tx.objectStore(n).getAll(); r.onsuccess = () => res(r.result as unknown[]); })))).flat();
    dbx.close();
    expect(values.length).toBeGreaterThan(0);
    const enc = new TextEncoder().encode(MARK);
    const hasMarker = values.some((v) => { const c = (v as { contents?: Uint8Array }).contents; return !!c && Buffer.from(c).includes(Buffer.from(enc)); });
    expect(hasMarker).toBe(false);
  }, 60_000);
});

describe('Device Mode export', () => {
  it('has no account in it: the hidden local identifier is not written to the file the person keeps', async () => {
    const { s } = await fresh();
    const out = await call(s, 'GET', '/api/export');
    expect(out.res.status).toBe(200);
    const body = out.res.body as { backup: unknown; extra: { account: unknown } };
    expect(body.extra.account).toBeNull();
    expect(JSON.stringify(body)).not.toMatch(/device_[0-9a-f]{8}/);
  });
});

describe('Device Mode backup: the file is the only way back after "delete all data"', () => {
  const PROFILE = { language: 'en', theme: 'system', units: 'metric', sex: 'male', age: 30, heightCm: 180, weightKg: 80, goal: 'general_fitness', experience: 'intermediate', place: 'gym', equipment: ['dumbbell', 'barbell', 'bench'], injuries: [], daysPerWeek: 3, sessionMinutes: 60, activityLevel: 'moderate', diet: 'omnivore', allergies: [], restrictions: [] };
  const presc = { sets: 3, repsMin: 8, repsMax: 10, rpe: 7, restSec: 90, loadKg: null, durationSec: null };
  const ok = async (s: DeviceServer, method: string, path: string, body?: unknown) => { const r = (await call(s, method, path, body)).res; expect(r.status, `${method} ${path} ${JSON.stringify(r.body)}`).toBeLessThan(300); return r.body as any; }; // eslint-disable-line @typescript-eslint/no-explicit-any
  const canon = (b: any): unknown => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const sess = new Map<string, string>(b.sessions.map((s: any, i: number) => [s.id, `S${i}`])); // eslint-disable-line @typescript-eslint/no-explicit-any
    const plans = new Map<string, string>(b.plans.map((p: any, i: number) => [p.id, `P${i}`])); // eslint-disable-line @typescript-eslint/no-explicit-any
    const { exportedAt: _at, ...rest } = b;
    return JSON.parse(JSON.stringify({
      ...rest,
      sessions: b.sessions.map((s: any, i: number) => ({ ...s, id: `S${i}`, sourceId: s.sourceId ? s.sourceId.replace(/^[^:]+/, (h: string) => plans.get(h) ?? h) : s.sourceId })), // eslint-disable-line @typescript-eslint/no-explicit-any
      plans: b.plans.map((p: any, i: number) => ({ ...p, id: `P${i}` })), // eslint-disable-line @typescript-eslint/no-explicit-any
      xpEvents: b.xpEvents.map((x: any) => ({ ...x, sourceKey: sess.get(x.sourceKey) ?? x.sourceKey })), // eslint-disable-line @typescript-eslint/no-explicit-any
    }));
  };

  it('export -> delete all data -> restore brings back profile, workouts, food, weights, plans, saved meals, own foods and coach chats on the real on-device database', async () => {
    const { s } = await fresh();
    const today = new Date().toISOString().slice(0, 10);
    await ok(s, 'PUT', '/api/profile', { ...PROFILE, displayName: 'Dana Device' });
    await ok(s, 'POST', '/api/weights', { loggedDate: today, weightKg: 80.5, note: 'morning' });
    await ok(s, 'POST', '/api/food-log', { loggedDate: today, slot: 'lunch', name: 'Rice', grams: 150, kcal: 200, proteinG: 30, carbsG: 20, fatG: 3 });
    await ok(s, 'POST', '/api/foods/custom', { name: 'Protein bar', kcal: 380, proteinG: 30, carbsG: 40, fatG: 12, servingG: 60 });
    await ok(s, 'POST', '/api/saved-meals', { name: 'Usual lunch', slot: 'lunch', items: [{ name: 'Rice', grams: 100, kcal: 130, proteinG: 3, carbsG: 28, fatG: 0 }] });
    const gen = await ok(s, 'POST', '/api/plans/generate', { seed: 3 });
    await ok(s, 'POST', '/api/plans', { name: 'Plan A', plan: gen.plan, activate: true });
    const w = await ok(s, 'POST', '/api/sessions', { name: 'Chest', source: 'custom', localDate: today, exercises: [{ exerciseId: 'barbell_bench_press', planned: presc }] });
    for (let i = 0; i < 3; i++) await ok(s, 'POST', `/api/sessions/${w.id}/sets`, { sessionExerciseId: w.exercises[0].id, reps: 8, weightKg: 60 });
    await ok(s, 'POST', `/api/sessions/${w.id}/finish`);
    const th = await ok(s, 'POST', '/api/coach/threads', { title: 'My chat' });
    await ok(s, 'POST', `/api/coach/threads/${th.id}/messages`, { text: 'plan my week', lang: 'en' });

    const file = await ok(s, 'GET', '/api/export');
    expect(file.backup).toMatchObject({ version: 2, mode: 'device' }); expect(file.extra.account).toBeNull();
    expect(JSON.stringify(file)).not.toMatch(/device_[0-9a-f]{8}/);
    const file1 = JSON.parse(JSON.stringify(file)) as typeof file; // what the person keeps on disk

    // delete all data: the whole on-device database is wiped and a fresh hidden account is created
    const gone = await s.handle(DEL); expect(gone.res.status).toBe(200); await gone.after?.();
    expect((await ok(s, 'GET', '/api/saved-meals')).meals).toEqual([]);
    expect((await ok(s, 'GET', '/api/coach/threads')).threads).toEqual([]);
    expect((await call(s, 'GET', '/api/profile')).res.status).toBe(404);

    // restore into the new empty install
    const res = await ok(s, 'POST', '/api/device/restore', file1.backup);
    expect(res).toMatchObject({ policy: 'replace', backupVersion: 2, restored: { workouts: 1, sets: 3, foods: 1, weights: 1, plans: 1, savedMeals: 1, customFoods: 1, threads: 1, messages: 2, profile: 1 }, untouched: [] });
    expect((await ok(s, 'GET', '/api/profile')).profile.displayName).toBe('Dana Device');
    expect((await ok(s, 'GET', '/api/auth/me')).onboarded).toBe(true);
    expect((await ok(s, 'GET', '/api/saved-meals')).meals.map((m: { name: string }) => m.name)).toEqual(['Usual lunch']);
    expect((await ok(s, 'GET', '/api/foods/custom')).foods.map((f: { name: string }) => f.name)).toEqual(['Protein bar']);
    expect((await ok(s, 'GET', '/api/coach/threads')).threads.map((x: { title: string }) => x.title)).toEqual(['My chat']);
    expect((await ok(s, 'GET', '/api/plans')).plans.map((p: { name: string; active: boolean }) => [p.name, p.active])).toEqual([['Plan A', true]]);
    expect((await ok(s, 'GET', '/api/stats')).xp).toBeGreaterThan(0);
    const file2 = await ok(s, 'GET', '/api/export');
    expect(canon(file2.backup)).toEqual(canon(file1.backup));
  }, 120_000);
});
