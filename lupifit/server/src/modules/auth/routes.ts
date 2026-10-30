import { weekStartsOn } from '@shared/dates';
import { Router } from 'express';
import {
  changePasswordSchema,
  loginSchema,
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
  registerSchema,
} from '@shared/schemas/auth';
import type { AuthResponse, MeResponse, OkResponse } from '@shared/types';
import { config } from '../../config';
import { db } from '../../db/pool';
import { getDummyHash, hashPassword, randomToken, sha256, verifyPassword } from '../../lib/crypto';
import { HttpError, badRequest, conflict, unauthorized } from '../../lib/errors';
import { sendMail } from '../../lib/mailer';
import { createSession, destroySession, requireAuth } from '../../middleware/auth';
import { userId } from '../../middleware/context';
import { clientIp, enforceRateLimit, rateLimit } from '../../middleware/rateLimit';
import { parseBody } from '../../middleware/validate';
import { getUserDTO, type UserRow } from './users';

export const authRouter = Router();

const RESET_TTL_MINUTES = 30;

authRouter.get('/me', async (req, res) => {
  if (!req.auth) {
    const body: MeResponse = { user: null, csrfToken: null };
    return res.json(body);
  }
  const user = await getUserDTO(db, req.auth.user.id);
  const body: MeResponse = { user, csrfToken: user ? req.auth.csrfToken : null };
  res.json(body);
});

authRouter.post(
  '/register',
  rateLimit({ name: 'register', limit: 10, windowMs: 60 * 60 * 1000, key: (req) => `ip:${clientIp(req)}` }),
  async (req, res) => {
    const input = parseBody(registerSchema, req);
    const passwordHash = await hashPassword(input.password);
    const result = await db.tx(async (tx) => {
      const existing = await tx.maybeOne('SELECT 1 FROM users WHERE lower(email) = lower($1)', [input.email]);
      if (existing) throw conflict('email_taken', 'An account with this email already exists');
      const user = await tx.one<{ id: string }>(
        `INSERT INTO users (email, password_hash, display_name, locale, timezone, week_start)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [input.email, passwordHash, input.displayName, input.locale ?? 'he', input.timezone ?? 'UTC', weekStartsOn(input.locale ?? 'he')],
      );
      await tx.exec('INSERT INTO profiles (user_id) VALUES ($1)', [user.id]);
      const csrfToken = await createSession(tx, user.id, req, res);
      return { userId: user.id, csrfToken };
    });
    const user = await getUserDTO(db, result.userId);
    const body: AuthResponse = { user: user!, csrfToken: result.csrfToken };
    res.status(201).json(body);
  },
);

authRouter.post(
  '/login',
  rateLimit({ name: 'login-ip', limit: 30, windowMs: 15 * 60 * 1000, key: (req) => `ip:${clientIp(req)}` }),
  async (req, res) => {
    const input = parseBody(loginSchema, req);
    enforceRateLimit('login-account', input.email, 10, 15 * 60 * 1000);
    const row = await db.maybeOne<UserRow & { password_hash: string; failed_login_attempts: number; locked_until: Date | null }>(
      `SELECT id, email, password_hash, failed_login_attempts, locked_until FROM users WHERE lower(email) = lower($1)`,
      [input.email],
    );
    if (!row) {
      await verifyPassword(input.password, await getDummyHash()); // equalize timing
      throw unauthorized('invalid_credentials', 'Incorrect email or password');
    }
    if (row.locked_until && new Date(row.locked_until).getTime() > Date.now()) {
      const retryAfter = Math.ceil((new Date(row.locked_until).getTime() - Date.now()) / 1000);
      throw new HttpError(423, 'account_locked', 'Too many failed attempts. Try again later.', { retryAfterSeconds: retryAfter }, {
        'Retry-After': String(retryAfter),
      });
    }
    const ok = await verifyPassword(input.password, row.password_hash);
    if (!ok) {
      const attempts = row.failed_login_attempts + 1;
      const lock = attempts >= config.password.maxFailedLogins;
      await db.exec(
        `UPDATE users SET failed_login_attempts = $2,
           locked_until = CASE WHEN $3 THEN now() + ($4 || ' minutes')::interval ELSE locked_until END
         WHERE id = $1`,
        [row.id, lock ? 0 : attempts, lock, String(config.password.lockoutMinutes)],
      );
      throw unauthorized('invalid_credentials', 'Incorrect email or password');
    }
    const csrfToken = await db.tx(async (tx) => {
      await tx.exec('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1', [row.id]);
      // Cap concurrent sessions per user (oldest are removed).
      await tx.exec(
        `DELETE FROM auth_sessions WHERE id IN (
           SELECT id FROM auth_sessions WHERE user_id = $1 ORDER BY last_seen_at DESC OFFSET 19)`,
        [row.id],
      );
      return createSession(tx, row.id, req, res);
    });
    const user = await getUserDTO(db, row.id);
    const body: AuthResponse = { user: user!, csrfToken };
    res.json(body);
  },
);

authRouter.post('/logout', async (req, res) => {
  await destroySession(req, res);
  const body: OkResponse = { ok: true };
  res.json(body);
});

authRouter.post('/logout-all', requireAuth, async (req, res) => {
  await db.exec('DELETE FROM auth_sessions WHERE user_id = $1', [userId(req)]);
  // Signed-out devices stop getting phone notifications too (they re-register on the next sign-in).
  await db.exec('DELETE FROM push_subscriptions WHERE user_id = $1', [userId(req)]);
  await destroySession(req, res);
  const body: OkResponse = { ok: true };
  res.json(body);
});

authRouter.post('/password', requireAuth, rateLimit({ name: 'password-change', limit: 10, windowMs: 15 * 60 * 1000 }), async (req, res) => {
  const input = parseBody(changePasswordSchema, req);
  const id = userId(req);
  const row = await db.one<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = $1', [id]);
  if (!(await verifyPassword(input.currentPassword, row.password_hash))) {
    throw badRequest('invalid_current_password', 'Current password is incorrect');
  }
  const hash = await hashPassword(input.newPassword);
  await db.tx(async (tx) => {
    await tx.exec('UPDATE users SET password_hash = $2, password_changed_at = now() WHERE id = $1', [id, hash]);
    // Sign out every other device.
    await tx.exec('DELETE FROM auth_sessions WHERE user_id = $1 AND id <> $2', [id, req.auth!.sessionId]);
  });
  const body: OkResponse = { ok: true };
  res.json(body);
});

authRouter.post(
  '/password-reset/request',
  rateLimit({ name: 'reset-request', limit: 5, windowMs: 60 * 60 * 1000, key: (req) => `ip:${clientIp(req)}` }),
  async (req, res) => {
    const { email } = parseBody(passwordResetRequestSchema, req);
    const user = await db.maybeOne<{ id: string; email: string }>('SELECT id, email FROM users WHERE lower(email) = lower($1)', [email]);
    if (user) {
      const token = randomToken(32);
      await db.exec(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, now() + ($3 || ' minutes')::interval)`,
        [user.id, sha256(token), String(RESET_TTL_MINUTES)],
      );
      const link = `${config.appUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
      await sendMail({
        to: user.email,
        subject: 'LUPU-FIT password reset',
        text: `Use this link within ${RESET_TTL_MINUTES} minutes to choose a new password:\n${link}\n\nIf you did not request this, ignore this email.`,
      });
    }
    // Same response whether or not the account exists (no account enumeration).
    res.status(202).json({ ok: true } satisfies OkResponse);
  },
);

authRouter.post(
  '/password-reset/confirm',
  rateLimit({ name: 'reset-confirm', limit: 10, windowMs: 60 * 60 * 1000, key: (req) => `ip:${clientIp(req)}` }),
  async (req, res) => {
    const input = parseBody(passwordResetConfirmSchema, req);
    const hash = await hashPassword(input.newPassword);
    await db.tx(async (tx) => {
      const row = await tx.maybeOne<{ id: string; user_id: string }>(
        `SELECT id, user_id FROM password_reset_tokens
          WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now() FOR UPDATE`,
        [sha256(input.token)],
      );
      if (!row) throw badRequest('invalid_reset_token', 'This reset link is invalid or has expired');
      await tx.exec('UPDATE password_reset_tokens SET used_at = now() WHERE user_id = $1 AND used_at IS NULL', [row.user_id]);
      await tx.exec(
        'UPDATE users SET password_hash = $2, password_changed_at = now(), failed_login_attempts = 0, locked_until = NULL WHERE id = $1',
        [row.user_id, hash],
      );
      await tx.exec('DELETE FROM auth_sessions WHERE user_id = $1', [row.user_id]);
    });
    res.json({ ok: true } satisfies OkResponse);
  },
);
