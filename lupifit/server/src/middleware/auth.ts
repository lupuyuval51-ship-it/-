/**
 * Session authentication. The browser holds an opaque random token in an HttpOnly,
 * SameSite=Lax cookie; the database stores only its SHA-256. Each session also has a
 * CSRF token that must be echoed in `X-CSRF-Token` on every mutating request.
 */
import type { NextFunction, Request, Response } from 'express';
import type { Locale } from '@shared/constants';
import { config } from '../config';
import { db, type Sql } from '../db/pool';
import { randomToken, safeEqual, sha256 } from '../lib/crypto';
import { forbidden, unauthorized } from '../lib/errors';

const SLIDE_AFTER_MS = 10 * 60 * 1000;

export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    if (part.slice(0, idx).trim() === name) {
      try {
        return decodeURIComponent(part.slice(idx + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

const ttlMs = () => config.session.ttlDays * 24 * 60 * 60 * 1000;

function setSessionCookie(res: Response, token: string) {
  res.cookie(config.session.cookieName, token, {
    httpOnly: true,
    secure: config.session.secureCookie,
    sameSite: 'lax',
    path: '/',
    maxAge: ttlMs(),
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(config.session.cookieName, { httpOnly: true, secure: config.session.secureCookie, sameSite: 'lax', path: '/' });
}

/** Creates a session for the user, sets the cookie and returns the CSRF token. */
export async function createSession(sql: Sql, userId: string, req: Request, res: Response): Promise<string> {
  const token = randomToken(32);
  const csrfToken = randomToken(24);
  await sql.exec(
    `INSERT INTO auth_sessions (user_id, token_hash, csrf_token, user_agent, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, $5, now() + ($6 || ' milliseconds')::interval)`,
    [userId, sha256(token), csrfToken, (req.get('user-agent') ?? '').slice(0, 300), req.ip ?? null, String(ttlMs())],
  );
  setSessionCookie(res, token);
  return csrfToken;
}

export async function destroySession(req: Request, res: Response) {
  if (req.auth) await db.exec('DELETE FROM auth_sessions WHERE id = $1', [req.auth.sessionId]);
  clearSessionCookie(res);
}

interface SessionRow {
  session_id: string;
  csrf_token: string;
  last_seen_at: Date;
  user_id: string;
  email: string;
  display_name: string;
  role: 'user' | 'admin';
  locale: Locale;
  timezone: string;
}

/** Populates req.auth when a valid session cookie is present. Never rejects by itself. */
export async function loadSession(req: Request, res: Response, next: NextFunction) {
  const token = readCookie(req, config.session.cookieName);
  if (!token || token.length > 200) return next();
  const row = await db.maybeOne<SessionRow>(
    `SELECT s.id AS session_id, s.csrf_token, s.last_seen_at, u.id AS user_id, u.email, u.display_name, u.role, u.locale, u.timezone
       FROM auth_sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [sha256(token)],
  );
  if (!row) {
    clearSessionCookie(res);
    return next();
  }
  req.auth = {
    sessionId: row.session_id,
    csrfToken: row.csrf_token,
    user: { id: row.user_id, email: row.email, displayName: row.display_name, role: row.role, locale: row.locale, timezone: row.timezone },
  };
  // Sliding expiration, throttled to avoid a write per request.
  if (Date.now() - new Date(row.last_seen_at).getTime() > SLIDE_AFTER_MS) {
    await db.exec(
      `UPDATE auth_sessions SET last_seen_at = now(), expires_at = now() + ($2 || ' milliseconds')::interval WHERE id = $1`,
      [row.session_id, String(ttlMs())],
    );
    setSessionCookie(res, token);
  }
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth) return next(unauthorized());
  next();
}

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Authenticated mutating requests must carry the session's CSRF token. */
export function csrfProtection(req: Request, _res: Response, next: NextFunction) {
  if (SAFE.has(req.method) || !req.auth) return next();
  const header = req.get('x-csrf-token') ?? '';
  if (!header || !safeEqual(header, req.auth.csrfToken)) return next(forbidden('csrf_invalid', 'Missing or invalid CSRF token'));
  next();
}
