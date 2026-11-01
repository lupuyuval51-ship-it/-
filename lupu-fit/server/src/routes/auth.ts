import { z } from 'zod';
import { ForgotPasswordBodySchema, LoginBodySchema, RegisterBodySchema, ResetPasswordBodySchema } from '@lupu-fit/shared';
import { dummyHash, hashPassword, randomHex, randomId, sha256Hex, verifyPassword } from '../crypto/portableCrypto.ts';
import { clearedCookie, sessionCookie } from '../core/app.ts';
import { ApiError } from '../core/errors.ts';
import { assertNotLocked, clearFailures, ident, recordFailure } from '../core/rateLimit.ts';
import type { Router } from '../core/router.ts';
import type { Ctx, Deps } from '../core/types.ts';

async function startSession(ctx: Ctx, userId: string): Promise<{ token: string; csrf: string }> {
  const token = randomHex(32); const csrf = randomHex(24);
  const expires = new Date(ctx.now.getTime() + ctx.deps.sessionTtlDays * 86400_000);
  await ctx.db.query('INSERT INTO auth_sessions (id, user_id, token_hash, csrf_token, expires_at, user_agent, ip_hint) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [randomId(), userId, await sha256Hex(token), csrf, expires.toISOString(), (ctx.req.headers['user-agent'] ?? '').slice(0, 200), (await sha256Hex(ctx.req.ip)).slice(0, 12)]);
  return { token, csrf };
}

const keysFor = async (ctx: Ctx, email: string) => [await ident('email', email), await ident('ip', ctx.req.ip)];

export function authRoutes(r: Router, deps: Deps): void {
  r.post('/api/auth/register', async (ctx) => {
    const { email, password } = ctx.body as z.infer<typeof RegisterBodySchema>;
    const keys = await keysFor(ctx, email);
    await assertNotLocked(ctx.db, 'register', keys, ctx.now);
    await recordFailure(ctx.db, 'register', keys, ctx.now); // every registration attempt counts toward the (higher) threshold
    const existing = await ctx.db.query('SELECT 1 FROM users WHERE lower(email) = $1', [email]);
    if (existing.length > 0) throw new ApiError(409, 'email_taken');
    const id = randomId();
    const role = deps.adminEmails?.map((e) => e.toLowerCase()).includes(email) ? 'admin' : 'user';
    await ctx.db.query('INSERT INTO users (id, email, password_hash, role) VALUES ($1,$2,$3,$4)', [id, email, await hashPassword(password, deps.pbkdf2Iterations), role]);
    const s = await startSession(ctx, id);
    return { json: { user: { id, email, role }, csrfToken: s.csrf }, status: 201, setCookies: [sessionCookie(deps, s.token)] };
  }, { auth: false, body: RegisterBodySchema });

  r.post('/api/auth/login', async (ctx) => {
    const { email, password } = ctx.body as z.infer<typeof LoginBodySchema>;
    const keys = await keysFor(ctx, email);
    await assertNotLocked(ctx.db, 'login', keys, ctx.now);
    const rows = await ctx.db.query<{ id: string; email: string; role: 'user' | 'admin'; password_hash: string }>('SELECT id, email, role, password_hash FROM users WHERE lower(email) = $1', [email]);
    const u = rows[0];
    // Unknown e-mail burns the same PBKDF2 work and returns the same error, so timing/messages never reveal accounts.
    const verdict = u ? await verifyPassword(password, u.password_hash, deps.pbkdf2Iterations) : (await verifyPassword(password, await dummyHash(deps.pbkdf2Iterations), deps.pbkdf2Iterations), { ok: false, needsRehash: false });
    if (!u || !verdict.ok) {
      await recordFailure(ctx.db, 'login', keys, ctx.now);
      throw new ApiError(401, 'invalid_credentials');
    }
    await clearFailures(ctx.db, 'login', keys[0] as { scopeKind: string; id: string });
    if (verdict.needsRehash) await ctx.db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [await hashPassword(password, deps.pbkdf2Iterations), u.id]);
    const s = await startSession(ctx, u.id);
    return { json: { user: { id: u.id, email: u.email, role: u.role }, csrfToken: s.csrf }, setCookies: [sessionCookie(deps, s.token)] };
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

  r.post('/api/auth/forgot-password', async (ctx) => {
    const { email } = ctx.body as z.infer<typeof ForgotPasswordBodySchema>;
    const keys = await keysFor(ctx, email);
    await assertNotLocked(ctx.db, 'forgot', keys, ctx.now);
    await recordFailure(ctx.db, 'forgot', keys, ctx.now);
    const u = (await ctx.db.query<{ id: string }>('SELECT id FROM users WHERE lower(email) = $1', [email]))[0];
    if (u) {
      const token = randomHex(32);
      await ctx.db.query('INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES ($1,$2,$3,$4)', [randomId(), u.id, await sha256Hex(token), new Date(ctx.now.getTime() + 3600_000).toISOString()]);
      await deps.onPasswordReset?.(email, token);
    }
    return { status: 202, body: { ok: true } }; // identical response whether or not the account exists
  }, { auth: false, body: ForgotPasswordBodySchema });

  r.post('/api/auth/reset-password', async (ctx) => {
    const { token, password } = ctx.body as z.infer<typeof ResetPasswordBodySchema>;
    const keys = [await ident('ip', ctx.req.ip)];
    await assertNotLocked(ctx.db, 'reset', keys, ctx.now);
    const row = (await ctx.db.query<{ id: string; user_id: string }>('SELECT id, user_id FROM password_reset_tokens WHERE token_hash = $1 AND used_at IS NULL AND expires_at > $2', [await sha256Hex(token), ctx.now.toISOString()]))[0];
    if (!row) { await recordFailure(ctx.db, 'reset', keys, ctx.now); throw new ApiError(400, 'invalid_or_expired_token'); }
    const hash = await hashPassword(password, deps.pbkdf2Iterations);
    await ctx.db.transaction(async (tx) => {
      await tx.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, row.user_id]);
      await tx.query('UPDATE password_reset_tokens SET used_at = $1 WHERE id = $2', [ctx.now.toISOString(), row.id]);
      await tx.query('DELETE FROM auth_sessions WHERE user_id = $1', [row.user_id]); // log out everywhere
    });
    return { json: { ok: true } };
  }, { auth: false, body: ResetPasswordBodySchema });
}
