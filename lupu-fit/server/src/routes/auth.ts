import { z } from 'zod';
import { LoginBodySchema, RegisterBodySchema } from '@lupu-fit/shared';
import { dummyHash, hashPassword, randomHex, randomId, sha256Hex, verifyPassword } from '../crypto/portableCrypto.ts';
import { clearedCookie, effectiveRole, sessionCookie, tokenHash } from '../core/app.ts';
import { ApiError } from '../core/errors.ts';
import { maybeHousekeeping } from '../core/housekeeping.ts';
import { assertNotLocked, chargeAttempt, clearFailures, ident, lockedByOthers, POLICIES, rateLimitAddress, recordFailure, undoCharge } from '../core/rateLimit.ts';
import type { Router } from '../core/router.ts';
import type { Ctx, Deps } from '../core/types.ts';

async function startSession(ctx: Ctx, userId: string, remember = true): Promise<{ token: string; csrf: string }> {
  const token = randomHex(32); const csrf = randomHex(24);
  const expires = new Date(ctx.now.getTime() + (remember ? ctx.deps.sessionTtlDays * 86400_000 : 12 * 3600_000));
  await ctx.db.query('INSERT INTO auth_sessions (id, user_id, token_hash, csrf_token, expires_at, user_agent, ip_hint) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [randomId(), userId, await tokenHash(ctx.deps, token), csrf, expires.toISOString(), (ctx.req.headers['user-agent'] ?? '').slice(0, 200), (await sha256Hex(rateLimitAddress(ctx.req.ip))).slice(0, 12)]);
  return { token, csrf };
}

const keysFor = async (ctx: Ctx, username: string) => [await ident('username', username), await ident('ip', ctx.req.ip)];

/**
 * Process-wide cap on concurrent PBKDF2 work (one hash is ~100 ms of a core at 600k iterations). Beyond `size` running hashes up to
 * `queue` more wait their turn; anything past that is refused at once with 503 instead of stalling every other sign-in.
 */
export class HashGate {
  private running = 0;
  private readonly waiting: (() => void)[] = [];
  constructor(readonly size: number, readonly queue: number) {}
  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.running >= this.size) {
      if (this.waiting.length >= this.queue) throw new ApiError(503, 'rate_limited', { reason: 'busy' }, { 'retry-after': '2' });
      await new Promise<void>((r) => this.waiting.push(r));
    } else this.running++;
    try { return await fn(); } finally { const next = this.waiting.shift(); if (next) next(); else this.running--; }
  }
}
/**
 * Sized from libuv's thread pool, not the CPU count: WebCrypto PBKDF2 runs there (4 threads unless UV_THREADPOOL_SIZE says
 * otherwise), whatever cores the host reports. One thread is left free for other pool work (dns, file reads, WebCrypto digests).
 * Read defensively: Device Mode runs this code in a Web Worker, where `process` does not exist.
 */
export function hashGateSize(env: Record<string, string | undefined> | undefined): number {
  const pool = Number(env?.['UV_THREADPOOL_SIZE'] ?? 4);
  return Math.max(1, Math.min(Number.isFinite(pool) && pool >= 1 ? Math.floor(pool) : 4, 1024) - 1);
}
export const HASH_GATE = { size: hashGateSize((globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env), queue: 32 } as const;

export function authRoutes(r: Router, deps: Deps, gate = new HashGate(HASH_GATE.size, HASH_GATE.queue)): void {
  // Pay the one-off cost of the decoy hash at start-up so the first unknown-username login is not measurably slower than later ones.
  void dummyHash(deps.pbkdf2Iterations).catch(() => undefined);
  r.post('/api/auth/register', async (ctx) => {
    const { username, password, remember } = ctx.body as z.infer<typeof RegisterBodySchema>;
    const keys = await keysFor(ctx, username);
    await assertNotLocked(ctx.db, 'register', keys, ctx.now);
    // Every registration attempt counts toward the (higher) threshold. The counters are updated atomically, so a burst of parallel
    // requests cannot slip past the check above: whoever pushes a counter beyond the threshold is refused too.
    const states = await recordFailure(ctx.db, 'register', keys, ctx.now);
    const over = states.find((st) => st.count > POLICIES['register']!.threshold && st.lockedUntil);
    if (over?.lockedUntil) { const secs = Math.max(1, Math.ceil((over.lockedUntil.getTime() - ctx.now.getTime()) / 1000)); throw new ApiError(429, 'too_many_attempts', { retryAfterSec: secs }, { 'retry-after': String(secs) }); }
    const existing = await ctx.db.query('SELECT 1 FROM users WHERE lower(username) = $1', [username]);
    if (existing.length > 0) throw new ApiError(409, 'username_taken');
    const id = randomId();
    const role = deps.adminUsernames?.map((e) => e.toLowerCase()).includes(username) ? 'admin' : 'user';
    try { await ctx.db.query('INSERT INTO users (id, username, password_hash, role) VALUES ($1,$2,$3,$4)', [id, username, await gate.run(() => hashPassword(password, deps.pbkdf2Iterations)), role]); }
    catch (e) { if ((e as { code?: string }).code === '23505') throw new ApiError(409, 'username_taken'); throw e; } // lost a race with a parallel registration of the same name
    const s = await startSession(ctx, id, remember !== false);
    await maybeHousekeeping(ctx.db, ctx.now);
    return { json: { user: { id, username, role }, csrfToken: s.csrf }, status: 201, setCookies: [sessionCookie(deps, s.token, remember !== false)] };
  }, { auth: false, body: RegisterBodySchema });

  r.post('/api/auth/login', async (ctx) => {
    const { username, password, remember } = ctx.body as z.infer<typeof LoginBodySchema>;
    const keys = await keysFor(ctx, username);
    await assertNotLocked(ctx.db, 'login', keys, ctx.now);
    // Every attempt is counted BEFORE the password is hashed, atomically with the lock check: a burst of parallel guesses gets at most
    // the threshold through to PBKDF2 and the rest are refused without hashing (they never learn whether their password was right).
    const charged = await chargeAttempt(ctx.db, 'login', keys, ctx.now);
    if (!charged.ok) throw new ApiError(429, 'too_many_attempts', { retryAfterSec: charged.retryAfterSec }, { 'retry-after': String(charged.retryAfterSec) });
    const rows = await ctx.db.query<{ id: string; username: string; role: 'user' | 'admin'; password_hash: string }>('SELECT id, username, role, password_hash FROM users WHERE lower(username) = $1', [username]);
    const u = rows[0];
    // Unknown username burns the same PBKDF2 work and returns the same error, so timing/messages never reveal accounts.
    const verdict = await gate.run(async () => u ? verifyPassword(password, u.password_hash, deps.pbkdf2Iterations) : (await verifyPassword(password, await dummyHash(deps.pbkdf2Iterations), deps.pbkdf2Iterations), { ok: false, needsRehash: false }));
    if (!u || !verdict.ok) throw new ApiError(401, 'invalid_credentials'); // already counted above
    // Parallel guesses may have locked this name or IP while this one was being hashed. If so, no session is issued. The answer is
    // the SAME 401 a wrong password gets (a 429 here would tell an attacker which guess was right); the person signs in after the lock.
    // A lock this attempt set itself (it was the threshold-th attempt) does not count: one correct sign-in is not a failure.
    for (const c of charged.charges) if (await lockedByOthers(ctx.db, 'login', c, ctx.now)) throw new ApiError(401, 'invalid_credentials');
    await clearFailures(ctx.db, 'login', keys[0] as { scopeKind: string; id: string });
    for (const c of charged.charges.slice(1)) await undoCharge(ctx.db, 'login', c);
    if (verdict.needsRehash) await ctx.db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [await hashPassword(password, deps.pbkdf2Iterations), u.id]);
    const s = await startSession(ctx, u.id, remember !== false);
    await maybeHousekeeping(ctx.db, ctx.now);
    return { json: { user: { id: u.id, username: u.username, role: effectiveRole(deps, u.username, u.role) }, csrfToken: s.csrf }, setCookies: [sessionCookie(deps, s.token, remember !== false)] };
  }, { auth: false, body: LoginBodySchema });

  // Idempotent: an expired or already-removed session still gets 200 and a cleared cookie, so signing out always signs out (the client
  // wipes this person's local state on that 200). A live session must present its CSRF token, as for any other mutation.
  r.post('/api/auth/logout', async (ctx) => {
    if (ctx.session) {
      if (ctx.req.headers['x-csrf-token'] !== ctx.session.csrf) throw new ApiError(403, 'csrf_invalid');
      await ctx.db.query('DELETE FROM auth_sessions WHERE id = $1', [ctx.session.id]);
    }
    return { json: { ok: true }, setCookies: [clearedCookie(deps)] };
  }, { auth: false });

  // Ends every session of this account (a browser left signed in on another device), including this one.
  r.post('/api/auth/logout-all', async (ctx) => {
    await ctx.db.query('DELETE FROM auth_sessions WHERE user_id = $1', [(ctx.user as NonNullable<Ctx['user']>).id]);
    return { json: { ok: true }, setCookies: [clearedCookie(deps)] };
  }, { auth: true });

  r.get('/api/auth/me', async (ctx) => {
    const u = ctx.user as NonNullable<Ctx['user']>;
    const p = await ctx.db.query<{ onboarded_at: string | null }>('SELECT onboarded_at FROM profiles WHERE user_id = $1', [u.id]);
    return { json: { user: u, csrfToken: (ctx.session as NonNullable<Ctx['session']>).csrf, onboarded: !!p[0]?.onboarded_at, mode: deps.mode } };
  });
}
