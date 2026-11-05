import { sha256Hex } from '../crypto/portableCrypto.ts';
import type { DbAdapter } from '../db/adapter.ts';
import { ApiError } from './errors.ts';

export interface LimitPolicy { threshold: number; baseLockSec: number; maxLockSec: number; windowSec: number }
export const POLICIES: Record<string, LimitPolicy> = {
  login: { threshold: 5, baseLockSec: 30, maxLockSec: 3600, windowSec: 3600 },
  register: { threshold: 10, baseLockSec: 60, maxLockSec: 3600, windowSec: 3600 },
};

/** Identifiers are hashes, so the table never stores raw usernames or IPs. */
export async function ident(kind: 'username' | 'ip', value: string): Promise<{ scopeKind: string; id: string }> {
  return { scopeKind: kind, id: await sha256Hex(`lupu-fit:${kind}:${value.trim().toLowerCase()}`) };
}

interface Row { fail_count: number; first_failed_at: Date | string; locked_until: Date | string | null }

/** Throws 429 + Retry-After if ANY of the keys is currently locked. */
export async function assertNotLocked(db: DbAdapter, scope: string, keys: { scopeKind: string; id: string }[], now: Date): Promise<void> {
  let retry = 0;
  for (const k of keys) {
    const rows = await db.query<Row>('SELECT fail_count, first_failed_at, locked_until FROM auth_attempts WHERE scope = $1 AND identifier = $2', [`${scope}:${k.scopeKind}`, k.id]);
    const lu = rows[0]?.locked_until;
    if (lu) { const secs = Math.ceil((new Date(lu).getTime() - now.getTime()) / 1000); if (secs > retry) retry = secs; }
  }
  if (retry > 0) throw new ApiError(429, 'too_many_attempts', { retryAfterSec: retry }, { 'retry-after': String(retry) });
}

export interface FailureState { count: number; lockedUntil: Date | null }

/**
 * Counts one failure for every key and returns the resulting state. The counter row is created first (ON CONFLICT DO NOTHING) and
 * then locked FOR UPDATE, so concurrent failures serialise on the row: none is lost and none hits a unique-key error.
 */
export async function recordFailure(db: DbAdapter, scope: string, keys: { scopeKind: string; id: string }[], now: Date): Promise<FailureState[]> {
  const p = POLICIES[scope] as LimitPolicy;
  const out: FailureState[] = [];
  for (const k of keys) {
    const sc = `${scope}:${k.scopeKind}`;
    out.push(await db.transaction(async (tx) => {
      await tx.query('INSERT INTO auth_attempts (scope, identifier, fail_count, first_failed_at, locked_until, updated_at) VALUES ($1,$2,0,$3,NULL,$3) ON CONFLICT DO NOTHING', [sc, k.id, now.toISOString()]);
      const row = (await tx.query<Row>('SELECT fail_count, first_failed_at, locked_until FROM auth_attempts WHERE scope = $1 AND identifier = $2 FOR UPDATE', [sc, k.id]))[0] as Row;
      const fresh = now.getTime() - new Date(row.first_failed_at).getTime() > p.windowSec * 1000 && !(row.locked_until && new Date(row.locked_until) > now);
      const count = fresh ? 1 : row.fail_count + 1;
      const lockSec = count >= p.threshold ? Math.min(p.baseLockSec * 2 ** Math.min(count - p.threshold, 30), p.maxLockSec) : 0;
      const lockedUntil = lockSec > 0 ? new Date(now.getTime() + lockSec * 1000) : null;
      await tx.query('UPDATE auth_attempts SET fail_count = $3, first_failed_at = $4, locked_until = $5, updated_at = $6 WHERE scope = $1 AND identifier = $2', [sc, k.id, count, (fresh ? now : new Date(row.first_failed_at)).toISOString(), lockedUntil?.toISOString() ?? null, now.toISOString()]);
      return { count, lockedUntil };
    }));
  }
  return out;
}

export async function clearFailures(db: DbAdapter, scope: string, key: { scopeKind: string; id: string }): Promise<void> {
  await db.query('DELETE FROM auth_attempts WHERE scope = $1 AND identifier = $2', [`${scope}:${key.scopeKind}`, key.id]);
}
