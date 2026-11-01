import { PgliteAdapter } from '../src/db/pgliteAdapter.ts';
import { migrate } from '../src/db/migrate.ts';
import { buildApp } from '../src/createApp.ts';
import { extraRoutes } from '../src/routes/index.ts';
import type { ApiApp } from '../src/core/app.ts';
import type { ApiResponse, Deps } from '../src/core/types.ts';

export interface TestCtx { app: ApiApp; db: PgliteAdapter; now: { t: Date } }

export async function makeApp(over: Partial<Deps> = {}): Promise<TestCtx> {
  const db = await PgliteAdapter.create();
  await migrate(db);
  const now = { t: new Date('2026-11-02T08:00:00Z') };
  const app = buildApp({
    db, mode: 'hosted', clock: () => now.t, pbkdf2Iterations: 1000, secureCookies: false, sessionTtlDays: 30,
    ...over,
  }, extraRoutes);
  return { app, db, now };
}

export interface Client { cookie: string; csrf: string; ip: string }
export const anon = (ip = '10.0.0.1'): Client => ({ cookie: '', csrf: '', ip });

export async function call(t: TestCtx, c: Client, method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<ApiResponse & { json: any }> {
  const [p, qs] = path.split('?');
  const query: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(qs ?? '')) query[k] = v;
  const res = await t.app.handle({
    method, path: p as string, query, body, ip: c.ip,
    headers: { ...(c.cookie ? { cookie: c.cookie } : {}), ...(c.csrf ? { 'x-csrf-token': c.csrf } : {}), ...headers },
  });
  const set = res.setCookies?.[0];
  if (set) { const kv = set.split(';')[0] as string; c.cookie = kv.endsWith('=') ? '' : kv; }
  const j = res.body as { csrfToken?: string } | undefined;
  if (j && typeof j === 'object' && 'csrfToken' in j && j.csrfToken) c.csrf = j.csrfToken;
  return { ...res, json: res.body };
}

export async function register(t: TestCtx, username = 'user_a', ip = '10.0.0.1'): Promise<Client> {
  const c = anon(ip);
  const r = await call(t, c, 'POST', '/api/auth/register', { username, password: 'correct-horse-battery' });
  if (r.status !== 201) throw new Error(`register failed ${r.status} ${JSON.stringify(r.body)}`);
  return c;
}

export const PROFILE = { language: 'en', theme: 'system', units: 'metric', sex: 'male', age: 30, heightCm: 180, weightKg: 80, goal: 'general_fitness', experience: 'intermediate', place: 'gym', equipment: ['dumbbell', 'barbell', 'bench'], injuries: [], daysPerWeek: 3, sessionMinutes: 60, activityLevel: 'moderate', diet: 'omnivore', allergies: [], restrictions: [] };
