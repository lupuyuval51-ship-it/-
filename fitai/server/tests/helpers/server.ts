/**
 * Starts the real Express app on an ephemeral port and provides a cookie-aware client
 * that handles the session cookie and CSRF token like the browser client does.
 */
import type { AddressInfo } from 'node:net';
import { randomUUID } from 'node:crypto';
import { createApp } from '../../src/app';
import { db } from '../../src/db/pool';

export interface TestServer {
  baseUrl: string;
  close(): Promise<void>;
}

export async function startTestServer(): Promise<TestServer> {
  const app = createApp({ serveClient: false });
  const server = await new Promise<import('node:http').Server>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

export interface ApiResult<T = any> {
  status: number;
  body: T;
  headers: Headers;
}

export class TestClient {
  cookie: string | null = null;
  csrfToken: string | null = null;
  userId: string | null = null;
  email: string | null = null;

  constructor(public readonly baseUrl: string) {}

  async request<T = any>(
    method: string,
    path: string,
    body?: unknown,
    opts: { headers?: Record<string, string>; csrf?: boolean; rawBody?: string } = {},
  ): Promise<ApiResult<T>> {
    const headers: Record<string, string> = { ...(opts.headers ?? {}) };
    if (body !== undefined || opts.rawBody !== undefined) headers['content-type'] ??= 'application/json';
    if (this.cookie) headers.cookie = this.cookie;
    if (method !== 'GET' && opts.csrf !== false && this.csrfToken) headers['x-csrf-token'] ??= this.csrfToken;
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: opts.rawBody ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
    const setCookie = res.headers.getSetCookie?.() ?? [];
    for (const c of setCookie) {
      const [pair] = c.split(';');
      if (!pair) continue;
      const [name, value] = pair.split('=');
      if (name?.includes('fitai_session')) this.cookie = value ? `${name}=${value}` : null;
    }
    const text = await res.text();
    let parsed: unknown = text;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      /* non-JSON */
    }
    const anyBody = parsed as { csrfToken?: string; user?: { id: string; email: string } } | null;
    if (anyBody && typeof anyBody === 'object' && typeof anyBody.csrfToken === 'string') this.csrfToken = anyBody.csrfToken;
    if (anyBody && typeof anyBody === 'object' && anyBody.user?.id) {
      this.userId = anyBody.user.id;
      this.email = anyBody.user.email;
    }
    return { status: res.status, body: parsed as T, headers: res.headers };
  }

  get<T = any>(path: string, opts?: Parameters<TestClient['request']>[3]) {
    return this.request<T>('GET', path, undefined, opts);
  }
  post<T = any>(path: string, body?: unknown, opts?: Parameters<TestClient['request']>[3]) {
    return this.request<T>('POST', path, body ?? {}, opts);
  }
  put<T = any>(path: string, body?: unknown, opts?: Parameters<TestClient['request']>[3]) {
    return this.request<T>('PUT', path, body ?? {}, opts);
  }
  patch<T = any>(path: string, body?: unknown, opts?: Parameters<TestClient['request']>[3]) {
    return this.request<T>('PATCH', path, body ?? {}, opts);
  }
  delete<T = any>(path: string, body?: unknown, opts?: Parameters<TestClient['request']>[3]) {
    return this.request<T>('DELETE', path, body, opts);
  }
}

export const uniqueEmail = (prefix = 'user') => `${prefix}-${randomUUID().slice(0, 12)}@test.fitai`;

/** Registers a fresh user (logged in). */
export async function registerUser(baseUrl: string, overrides: Partial<{ email: string; password: string; displayName: string; locale: 'he' | 'en'; timezone: string }> = {}) {
  const client = new TestClient(baseUrl);
  const res = await client.post('/api/auth/register', {
    email: overrides.email ?? uniqueEmail(),
    password: overrides.password ?? 'Passw0rd!',
    displayName: overrides.displayName ?? 'Test User',
    locale: overrides.locale ?? 'en',
    timezone: overrides.timezone ?? 'UTC',
  });
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return client;
}

/** Default complete profile used by tests (adult, gym, muscle gain). */
export const DEFAULT_PROFILE = {
  age_years: 30,
  sex: 'male',
  height_cm: 180,
  weight_kg: 80,
  experience_level: 'intermediate',
  goal: 'muscle_gain',
  training_location: 'gym',
  equipment: [
    'barbell', 'dumbbells', 'kettlebell', 'ez_bar', 'squat_rack', 'bench', 'cable_machine', 'lat_pulldown_machine',
    'leg_press_machine', 'leg_curl_machine', 'leg_extension_machine', 'chest_press_machine', 'smith_machine',
    'pull_up_bar', 'dip_bars', 'resistance_bands', 'medicine_ball', 'plyo_box', 'jump_rope', 'cardio_machine', 'ab_wheel',
  ],
  days_per_week: 4,
  session_minutes: 60,
  injuries: [] as string[],
  diet_type: 'omnivore',
  allergies: [] as string[],
  dietary_restrictions: [] as string[],
  activity_level: 'moderate',
  occupation_activity: 'desk',
  meals_per_day: 3,
  weekly_workout_goal: 4,
} as const;

/**
 * Writes profile columns directly (bypassing the onboarding API) and marks onboarding
 * complete. Keys are DB column names; arrays/JSON are passed through.
 */
export async function setProfile(userId: string, fields: Record<string, unknown> = {}) {
  const merged: Record<string, unknown> = { ...DEFAULT_PROFILE, ...fields };
  const cols = Object.keys(merged);
  const sets = cols.map((c, i) => `${c} = $${i + 2}`).join(', ');
  const values = cols.map((c) => {
    const v = merged[c];
    return v !== null && typeof v === 'object' && !Array.isArray(v) ? JSON.stringify(v) : v;
  });
  await db.exec(
    `UPDATE profiles SET ${sets}, age_recorded_on = COALESCE(age_recorded_on, CURRENT_DATE), onboarding_completed_at = COALESCE(onboarding_completed_at, now()) WHERE user_id = $1`,
    [userId, ...values],
  );
}

/** Registers a user and gives them a complete profile. */
export async function onboardedUser(baseUrl: string, profile: Record<string, unknown> = {}, account: Parameters<typeof registerUser>[1] = {}) {
  const client = await registerUser(baseUrl, account);
  await setProfile(client.userId!, profile);
  return client;
}
