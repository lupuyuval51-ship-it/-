import { z } from 'zod';
import { LoginBodySchema, RegisterBodySchema } from '@lupu-fit/shared';
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

const keysFor = async (ctx: Ctx, username: string) => [await ident('username', username), await ident('ip', ctx.req.ip)];

export function authRoutes(r: Router, deps: Deps): void {
  r.post('/api/auth/register', async (ctx) => {
    const { username, password } = ctx.body as z.infer<typeof RegisterBodySchema>;
    const keys = await keysFor(ctx, username);
    await assertNotLocked(ctx.db, 'register', keys, ctx.now);
    await recordFailure(ctx.db, 'register', keys, ctx.now); // every registration attempt counts toward the (higher) threshold
    const existing = await ctx.db.query('SELECT 1 FROM users WHERE lower(username) = $1', [username]);
    if (existing.length > 0) throw new ApiError(409, 'username_taken');
    const id = randomId();
    const role = deps.adminUsernames?.map((e) => e.toLowerCase()).includes(username) ? 'admin' : 'user';
    await ctx.db.query('INSERT INTO users (id, username, password_hash, role) VALUES ($1,$2,$3,$4)', [id, username, await hashPassword(password, deps.pbkdf2Iterations), role]);
    const s = await startSession(ctx, id);
    return { json: { user: { id, username, role }, csrfToken: s.csrf }, status: 201, setCookies: [sessionCookie(deps, s.token)] };
  }, { auth: false, body: RegisterBodySchema });

  r.post('/api/auth/login', async (ctx) => {
    const { username, password } = ctx.body as z.infer<typeof LoginBodySchema>;
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
    await clearFailures(ctx.db, 'login', keys[0] as { scopeKind: string; id: string });
    if (verdict.needsRehash) await ctx.db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [await hashPassword(password, deps.pbkdf2Iterations), u.id]);
    const s = await startSession(ctx, u.id);
    return { json: { user: { id: u.id, username: u.username, role: u.role }, csrfToken: s.csrf }, setCookies: [sessionCookie(deps, s.token)] };
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
