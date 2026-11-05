import { z } from 'zod';
import { LoginBodySchema, RegisterBodySchema } from '@lupu-fit/shared';
import { dummyHash, hashPassword, randomHex, randomId, sha256Hex, verifyPassword } from '../crypto/portableCrypto.ts';
import { clearedCookie, sessionCookie } from '../core/app.ts';
import { ApiError } from '../core/errors.ts';
import { assertNotLocked, clearFailures, ident, POLICIES, recordFailure } from '../core/rateLimit.ts';
import type { Router } from '../core/router.ts';
import type { Ctx, Deps } from '../core/types.ts';

async function startSession(ctx: Ctx, userId: string, remember = true): Promise<{ token: string; csrf: string }> {
  const token = randomHex(32); const csrf = randomHex(24);
  const expires = new Date(ctx.now.getTime() + (remember ? ctx.deps.sessionTtlDays * 86400_000 : 12 * 3600_000));
  await ctx.db.query('INSERT INTO auth_sessions (id, user_id, token_hash, csrf_token, expires_at, user_agent, ip_hint) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [randomId(), userId, await sha256Hex(token), csrf, expires.toISOString(), (ctx.req.headers['user-agent'] ?? '').slice(0, 200), (await sha256Hex(ctx.req.ip)).slice(0, 12)]);
  return { token, csrf };
}

const keysFor = async (ctx: Ctx, username: string) => [await ident('username', username), await ident('ip', ctx.req.ip)];

export function authRoutes(r: Router, deps: Deps): void {
  // Pay the one-off cost of the decoy hash at start-up so the first unknown-username login is not measurably slower than later ones.
  void dummyHash(deps.pbkdf2Iterations).catch(() => undefined);
  r.post('/api/auth/register', async (ctx) => {
    const { username, password } = ctx.body as z.infer<typeof RegisterBodySchema>;
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
    try { await ctx.db.query('INSERT INTO users (id, username, password_hash, role) VALUES ($1,$2,$3,$4)', [id, username, await hashPassword(password, deps.pbkdf2Iterations), role]); }
    catch (e) { if ((e as { code?: string }).code === '23505') throw new ApiError(409, 'username_taken'); throw e; } // lost a race with a parallel registration of the same name
    const s = await startSession(ctx, id);
    return { json: { user: { id, username, role }, csrfToken: s.csrf }, status: 201, setCookies: [sessionCookie(deps, s.token)] };
  }, { auth: false, body: RegisterBodySchema });

  r.post('/api/auth/login', async (ctx) => {
    const { username, password, remember } = ctx.body as z.infer<typeof LoginBodySchema>;
    const keys = await keysFor(ctx, username);
    await assertNotLocked(ctx.db, 'login', keys, ctx.now);
    const rows = await ctx.db.query<{ id: string; username: string; role: 'user' | 'admin'; password_hash: string }>('SELECT id, username, role, password_hash FROM users WHERE lower(username) = $1', [username]);
    const u = rows[0];
    // Unknown username burns the same PBKDF2 work and returns the same error, so timing/messages never reveal accounts.
    const verdict = u ? await verifyPassword(password, u.password_hash, deps.pbkdf2Iterations) : (await verifyPassword(password, await dummyHash(deps.pbkdf2Iterations), deps.pbkdf2Iterations), { ok: false, needsRehash: false });
    if (!u || !verdict.ok) {
      await recordFailure(ctx.db, 'login', keys, ctx.now);
      throw new ApiError(401, 'invalid_credentials');
    }
    // Parallel guesses all passed the check above before any of them was counted. Look again now: if the others have
    // locked this name or IP in the meantime, even a correct password is refused (the user simply retries after the lock).
    await assertNotLocked(ctx.db, 'login', keys, ctx.now);
    await clearFailures(ctx.db, 'login', keys[0] as { scopeKind: string; id: string });
    if (verdict.needsRehash) await ctx.db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [await hashPassword(password, deps.pbkdf2Iterations), u.id]);
    const s = await startSession(ctx, u.id, remember !== false);
    return { json: { user: { id: u.id, username: u.username, role: u.role }, csrfToken: s.csrf }, setCookies: [sessionCookie(deps, s.token, remember !== false)] };
  }, { auth: false, body: LoginBodySchema });

  r.post('/api/auth/logout', async (ctx) => {
    if (ctx.session) await ctx.db.query('DELETE FROM auth_sessions WHERE id = $1', [ctx.session.id]);
    return { json: { ok: true }, setCookies: [clearedCookie(deps)] };
  }, { auth: true });

  r.get('/api/auth/me', async (ctx) => {
    const u = ctx.user as NonNullable<Ctx['user']>;
    const p = await ctx.db.query<{ onboarded_at: string | null }>('SELECT onboarded_at FROM profiles WHERE user_id = $1', [u.id]);
    return { json: { user: u, csrfToken: (ctx.session as NonNullable<Ctx['session']>).csrf, onboarded: !!p[0]?.onboarded_at, mode: deps.mode } };
  });
}
