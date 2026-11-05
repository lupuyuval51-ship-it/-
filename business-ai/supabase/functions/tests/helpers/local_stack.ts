/**
 * Test helpers for the local Supabase stack and the fake Anthropic server.
 *
 * Supabase keys are resolved in this order:
 *   1. env SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY;
 *   2. `supabase status -o json` (when the test runs with --allow-run=supabase, e.g. `deno task test`);
 *   3. the Supabase CLI's documented, public local-development defaults (loopback URL only).
 * Set SKIP_SUPABASE_INTEGRATION=1 to skip the integration suite explicitly.
 */
import type { AddressInfo } from 'node:net';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../_shared/database.types.ts';
// @ts-types="../../../../e2e/fake-anthropic/server.d.mts"
import { createFakeAnthropicServer } from '../../../../e2e/fake-anthropic/server.mjs';

export interface LocalStack {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  source: 'env' | 'supabase status' | 'local defaults';
}

const DEFAULT_URL = 'http://127.0.0.1:54321';
// Public defaults printed by every `supabase start` that uses the default local JWT secret
// (issuer "supabase-demo"). They only work against a local stack; they are not secrets.
const LOCAL_DEMO_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const LOCAL_DEMO_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

function env(name: string): string | undefined {
  const v = Deno.env.get(name)?.trim();
  return v ? v : undefined;
}

async function fromStatus(): Promise<Omit<LocalStack, 'source'> | null> {
  const perm = await Deno.permissions.query({ name: 'run', command: 'supabase' });
  if (perm.state !== 'granted') return null;
  try {
    const cwd = new URL('../../../../', import.meta.url).pathname; // business-ai/
    const out = await new Deno.Command('supabase', {
      args: ['status', '-o', 'json'],
      cwd,
      stdout: 'piped',
      stderr: 'null',
    }).output();
    if (!out.success) return null;
    const text = new TextDecoder().decode(out.stdout);
    const json = JSON.parse(text.slice(text.indexOf('{'))) as Record<string, string>;
    if (!json.API_URL || !json.ANON_KEY || !json.SERVICE_ROLE_KEY) return null;
    return { url: json.API_URL, anonKey: json.ANON_KEY, serviceRoleKey: json.SERVICE_ROLE_KEY };
  } catch {
    return null;
  }
}

export async function resolveLocalStack(): Promise<LocalStack> {
  const url = env('SUPABASE_URL') ?? DEFAULT_URL;
  const anon = env('SUPABASE_ANON_KEY');
  const service = env('SUPABASE_SERVICE_ROLE_KEY');
  if (anon && service) return { url, anonKey: anon, serviceRoleKey: service, source: 'env' };
  const status = await fromStatus();
  if (status) return { ...status, source: 'supabase status' };
  const host = new URL(url).hostname;
  if (host !== '127.0.0.1' && host !== 'localhost') {
    throw new Error(`SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are required for non-local SUPABASE_URL ${url}`);
  }
  return { url, anonKey: LOCAL_DEMO_ANON_KEY, serviceRoleKey: LOCAL_DEMO_SERVICE_ROLE_KEY, source: 'local defaults' };
}

export async function assertStackReachable(stack: LocalStack): Promise<void> {
  try {
    const res = await fetch(`${stack.url}/auth/v1/health`, { headers: { apikey: stack.anonKey } });
    await res.body?.cancel();
    if (!res.ok) throw new Error(`status ${res.status}`);
  } catch (err) {
    throw new Error(
      `Local Supabase is not reachable at ${stack.url} (${err instanceof Error ? err.message : String(err)}). ` +
        'Start it with `supabase start` or set SKIP_SUPABASE_INTEGRATION=1.',
    );
  }
}

export function adminClient(stack: LocalStack): SupabaseClient<Database> {
  return createClient<Database>(stack.url, stack.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function userClient(stack: LocalStack, jwt: string): SupabaseClient<Database> {
  return createClient<Database>(stack.url, stack.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}

export interface TestUser {
  id: string;
  email: string;
  jwt: string;
  db: SupabaseClient<Database>;
}

export async function createTestUser(stack: LocalStack, label: string): Promise<TestUser> {
  const admin = adminClient(stack);
  const email = `ai-fn-test-${label}-${crypto.randomUUID()}@example.test`;
  const password = `Pw-${crypto.randomUUID()}`;
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error || !created.data.user) throw new Error(`createUser failed: ${created.error?.message}`);
  const anon = createClient<Database>(stack.url, stack.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const session = await anon.auth.signInWithPassword({ email, password });
  if (session.error || !session.data.session) throw new Error(`signIn failed: ${session.error?.message}`);
  const jwt = session.data.session.access_token;
  return { id: created.data.user.id, email, jwt, db: userClient(stack, jwt) };
}

export async function deleteTestUser(stack: LocalStack, user: TestUser | undefined): Promise<void> {
  if (!user) return;
  const { error } = await adminClient(stack).auth.admin.deleteUser(user.id);
  if (error) console.error(`cleanup: deleteUser ${user.email} failed: ${error.message}`);
}

export interface FakeAnthropic {
  baseURL: string;
  close(): Promise<void>;
}

/** Starts the fake Anthropic server in-process on a random loopback port. */
export async function startFakeAnthropic(): Promise<FakeAnthropic> {
  const server = createFakeAnthropicServer({ log: Deno.env.get('FAKE_ANTHROPIC_LOG') === '1' });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const { port } = server.address() as AddressInfo;
  return {
    baseURL: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections?.();
        server.close(() => resolve());
      }),
  };
}
