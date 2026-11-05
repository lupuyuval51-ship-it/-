import { sha256Hex } from '../crypto/portableCrypto.ts';
import type { DbAdapter } from '../db/adapter.ts';
import { ApiError } from './errors.ts';

export interface LimitPolicy { threshold: number; baseLockSec: number; maxLockSec: number; windowSec: number }
export const POLICIES: Record<string, LimitPolicy> = {
  login: { threshold: 5, baseLockSec: 30, maxLockSec: 3600, windowSec: 3600 },
  register: { threshold: 10, baseLockSec: 60, maxLockSec: 3600, windowSec: 3600 },
};

/**
 * The key a client address is counted under. IPv4 (and IPv4-mapped IPv6, `::ffff:a.b.c.d`) is the address itself; any other IPv6
 * address is cut to its /64, because one host normally controls a whole /64 and could otherwise rotate through 2^64 fresh counters.
 * Pure string work (no node:net), so the Device Mode worker can import it too. Unparseable input is returned as it is.
 */
export function rateLimitAddress(raw: string): string {
  let ip = raw.trim().toLowerCase();
  const zone = ip.indexOf('%'); if (zone >= 0) ip = ip.slice(0, zone);
  if (ip.startsWith('[') && ip.endsWith(']')) ip = ip.slice(1, -1);
  const mapped = /^::ffff:(?:0:)?(\d{1,3}(?:\.\d{1,3}){3})$/.exec(ip);
  if (mapped) return mapped[1] as string;
  if (!ip.includes(':')) return ip;
  const halves = ip.split('::');
  if (halves.length > 2) return ip;
  const parts = (h: string | undefined): string[] | null => {
    if (!h) return [];
    const out: string[] = [];
    for (const x of h.split(':')) {
      if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(x)) { out.push('0', '0'); continue; } // embedded IPv4 = the last 32 bits, outside the /64
      if (!/^[0-9a-f]{1,4}$/.test(x)) return null;
      out.push(x);
    }
    return out;
  };
  const head = parts(halves[0]); const tail = parts(halves[1]);
  if (!head || !tail) return ip;
  const fill = 8 - head.length - tail.length;
  if (halves.length === 1 ? fill !== 0 : fill < 1) return ip;
  const full = [...head, ...Array.from({ length: halves.length === 2 ? fill : 0 }, () => '0'), ...tail];
  return `${full.slice(0, 4).map((h) => parseInt(h, 16).toString(16)).join(':')}::/64`;
}

/** Identifiers are hashes, so the table never stores raw usernames or IPs. Addresses are counted per rateLimitAddress(). */
export async function ident(kind: 'username' | 'ip', value: string): Promise<{ scopeKind: string; id: string }> {
  const v = kind === 'ip' ? rateLimitAddress(value) : value.trim().toLowerCase();
  return { scopeKind: kind, id: await sha256Hex(`lupu-fit:${kind}:${v}`) };
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

export interface Charge { key: { scopeKind: string; id: string }; lockedUntil: Date | null }
export type ChargeResult = { ok: true; charges: Charge[] } | { ok: false; retryAfterSec: number };

/**
 * Check-and-count in one step, BEFORE the expensive work (login hashes a password). All keys are locked FOR UPDATE in one transaction
 * (always in the given order). If any is locked, nothing is counted and the caller refuses without doing the work. Otherwise every
 * key counts one attempt, and the attempt that reaches the threshold sets the lock, so a burst of parallel requests gets at most
 * `threshold` attempts through per lock cycle instead of all of them.
 */
export async function chargeAttempt(db: DbAdapter, scope: string, keys: { scopeKind: string; id: string }[], now: Date): Promise<ChargeResult> {
  const p = POLICIES[scope] as LimitPolicy;
  return db.transaction(async (tx) => {
    const rows: Row[] = [];
    for (const k of keys) {
      const sc = `${scope}:${k.scopeKind}`;
      await tx.query('INSERT INTO auth_attempts (scope, identifier, fail_count, first_failed_at, locked_until, updated_at) VALUES ($1,$2,0,$3,NULL,$3) ON CONFLICT DO NOTHING', [sc, k.id, now.toISOString()]);
      rows.push((await tx.query<Row>('SELECT fail_count, first_failed_at, locked_until FROM auth_attempts WHERE scope = $1 AND identifier = $2 FOR UPDATE', [sc, k.id]))[0] as Row);
    }
    let retry = 0;
    for (const r of rows) if (r.locked_until && new Date(r.locked_until) > now) retry = Math.max(retry, Math.ceil((new Date(r.locked_until).getTime() - now.getTime()) / 1000));
    if (retry > 0) return { ok: false as const, retryAfterSec: retry };
    const charges: Charge[] = [];
    for (const [i, k] of keys.entries()) {
      const row = rows[i] as Row;
      const fresh = now.getTime() - new Date(row.first_failed_at).getTime() > p.windowSec * 1000;
      const count = fresh ? 1 : row.fail_count + 1;
      const lockSec = count >= p.threshold ? Math.min(p.baseLockSec * 2 ** Math.min(count - p.threshold, 30), p.maxLockSec) : 0;
      const lockedUntil = lockSec > 0 ? new Date(now.getTime() + lockSec * 1000) : null;
      await tx.query('UPDATE auth_attempts SET fail_count = $3, first_failed_at = $4, locked_until = $5, updated_at = $6 WHERE scope = $1 AND identifier = $2', [`${scope}:${k.scopeKind}`, k.id, count, (fresh ? now : new Date(row.first_failed_at)).toISOString(), lockedUntil?.toISOString() ?? null, now.toISOString()]);
      charges.push({ key: k, lockedUntil });
    }
    return { ok: true as const, charges };
  });
}

/** True when some OTHER attempt has locked this key since `c` was charged (a lock this attempt set itself does not count). */
export async function lockedByOthers(db: DbAdapter, scope: string, c: Charge, now: Date): Promise<boolean> {
  const lu = (await db.query<Row>('SELECT fail_count, first_failed_at, locked_until FROM auth_attempts WHERE scope = $1 AND identifier = $2', [`${scope}:${c.key.scopeKind}`, c.key.id]))[0]?.locked_until;
  if (!lu || new Date(lu) <= now) return false;
  return !(c.lockedUntil && new Date(lu).getTime() === c.lockedUntil.getTime());
}

/** Takes back one charged attempt (a successful sign-in is not a failure); a lock it set itself is lifted, anyone else's stays. */
export async function undoCharge(db: DbAdapter, scope: string, c: Charge): Promise<void> {
  const sc = `${scope}:${c.key.scopeKind}`;
  await db.transaction(async (tx) => {
    const row = (await tx.query<Row>('SELECT fail_count, first_failed_at, locked_until FROM auth_attempts WHERE scope = $1 AND identifier = $2 FOR UPDATE', [sc, c.key.id]))[0];
    if (!row) return;
    const mine = !!c.lockedUntil && !!row.locked_until && new Date(row.locked_until).getTime() === c.lockedUntil.getTime();
    await tx.query('UPDATE auth_attempts SET fail_count = $3, locked_until = $4 WHERE scope = $1 AND identifier = $2', [sc, c.key.id, Math.max(0, row.fail_count - 1), mine ? null : (row.locked_until ? new Date(row.locked_until).toISOString() : null)]);
  });
}

export async function clearFailures(db: DbAdapter, scope: string, key: { scopeKind: string; id: string }): Promise<void> {
  await db.query('DELETE FROM auth_attempts WHERE scope = $1 AND identifier = $2', [`${scope}:${key.scopeKind}`, key.id]);
}

/** Per-key fixed-window limiter whose memory can never grow without bound (periodic sweep + hard size cap with LRU eviction). */
export class BoundedRateLimiter {
  private readonly map = new Map<string, { count: number; resetAt: number }>();
  constructor(private readonly limit: number, private readonly windowMs = 60_000, private readonly maxKeys = 10_000) {}
  hit(key: string, now = Date.now()): boolean {
    this.sweep(now);
    let e = this.map.get(key);
    if (!e || e.resetAt <= now) e = { count: 0, resetAt: now + this.windowMs };
    e.count++;
    this.map.delete(key); this.map.set(key, e); // re-insert = most recently used
    while (this.map.size > this.maxKeys) { const oldest = this.map.keys().next().value as string | undefined; if (oldest === undefined) break; this.map.delete(oldest); }
    return e.count <= this.limit;
  }
  get size(): number { return this.map.size; }
  private lastSweep = 0;
  private sweep(now: number): void {
    if (now - this.lastSweep < this.windowMs / 2) return;
    this.lastSweep = now;
    for (const [k, v] of this.map) if (v.resetAt <= now) this.map.delete(k);
  }
}
