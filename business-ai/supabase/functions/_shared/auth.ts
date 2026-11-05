/**
 * Supabase clients for the Edge Functions.
 *
 * - user client: carries the caller's JWT, so every read/write goes through RLS as that user.
 * - service client: service role, used ONLY for reserve/finalize_ai_usage and inserting advisor
 *   messages (after ownership was verified with the user client).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types.ts';
import type { FunctionConfig } from './config.ts';
import { AppError } from './errors.ts';

export type Db = SupabaseClient<Database>;

const CLIENT_AUTH_OPTIONS = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } as const;

/** Extracts the bearer token from the Authorization header (null when absent/malformed). */
export function bearerToken(req: Request): string | null {
  const header = req.headers.get('authorization') ?? '';
  const match = /^Bearer\s+(\S+)\s*$/i.exec(header);
  return match?.[1] ?? null;
}

export function createUserClient(cfg: FunctionConfig, jwt: string): Db {
  return createClient<Database>(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: CLIENT_AUTH_OPTIONS,
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}

export function createServiceClient(cfg: FunctionConfig): Db {
  return createClient<Database>(cfg.supabaseUrl, cfg.supabaseServiceRoleKey, { auth: CLIENT_AUTH_OPTIONS });
}

export interface AuthedUser {
  id: string;
  email: string | null;
}

export interface AuthContext {
  user: AuthedUser;
  jwt: string;
  /** RLS-scoped client acting as the user. */
  db: Db;
}

/**
 * Verifies the caller's JWT with Supabase Auth and returns the user plus a user-scoped client.
 * Throws AppError('unauthorized') for a missing, expired or invalid token.
 */
export async function requireUser(req: Request, cfg: FunctionConfig): Promise<AuthContext> {
  const jwt = bearerToken(req);
  if (!jwt) throw new AppError('unauthorized');
  const db = createUserClient(cfg, jwt);
  const { data, error } = await db.auth.getUser(jwt);
  if (error) {
    // Auth unreachable / 5xx is a server problem, not a bad token.
    const status = typeof error.status === 'number' ? error.status : 0;
    if (status === 0 || status >= 500) {
      throw new AppError('internal', 'Could not verify the session.', {
        cause: error,
        details: { op: 'auth.getUser' },
      });
    }
    throw new AppError('unauthorized', 'Invalid or expired session.');
  }
  if (!data.user) throw new AppError('unauthorized', 'Invalid or expired session.');
  return { user: { id: data.user.id, email: data.user.email ?? null }, jwt, db };
}
