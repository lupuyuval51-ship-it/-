import type { DbAdapter } from '../db/adapter.ts';

const DAY = 86_400_000;
/** Retention: expired sessions 1 day, replay records 30 days (an offline outbox may replay for a long time), idle brute-force counters 1 day. */
export const RETENTION = { sessionsMs: DAY, idempotencyMs: 30 * DAY, attemptsMs: DAY } as const;
const BATCH = 500;

/**
 * Keeps three append-only tables from growing without bound (nothing else ever deletes from them). Called now and then from sign-in
 * and registration; every statement is limited to one batch so a single request never does unbounded work.
 */
export async function housekeeping(db: DbAdapter, now: Date): Promise<void> {
  const before = (ms: number) => new Date(now.getTime() - ms).toISOString();
  await db.query('DELETE FROM auth_sessions WHERE ctid IN (SELECT ctid FROM auth_sessions WHERE expires_at < $1 LIMIT $2)', [before(RETENTION.sessionsMs), BATCH]);
  await db.query('DELETE FROM idempotency_keys WHERE ctid IN (SELECT ctid FROM idempotency_keys WHERE created_at < $1 LIMIT $2)', [before(RETENTION.idempotencyMs), BATCH]);
  await db.query('DELETE FROM auth_attempts WHERE ctid IN (SELECT ctid FROM auth_attempts WHERE updated_at < $1 AND (locked_until IS NULL OR locked_until < $2) LIMIT $3)', [before(RETENTION.attemptsMs), now.toISOString(), BATCH]);
}

/** About one sign-in in twenty pays for the clean-up; a failure there must never fail the sign-in. */
export function maybeHousekeeping(db: DbAdapter, now: Date, roll: () => number = Math.random): Promise<void> {
  return roll() < 0.05 ? housekeeping(db, now).catch(() => undefined) : Promise.resolve();
}
