import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import type { Locale } from '@shared/constants';
import { config } from '../config';
import { unauthorized } from '../lib/errors';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  locale: Locale;
  timezone: string;
}

export interface AuthContext {
  sessionId: string;
  csrfToken: string;
  user: AuthUser;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
      auth?: AuthContext;
    }
  }
}

/** Assigns a request id (echoed in X-Request-Id and error bodies) and logs completed requests. */
export function requestContext(req: Request, res: Response, next: NextFunction) {
  const incoming = req.get('x-request-id');
  req.requestId = incoming && /^[A-Za-z0-9_-]{8,64}$/.test(incoming) ? incoming : crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  const path = req.originalUrl.split('?')[0] ?? req.path;
  if (config.logRequests && path.startsWith('/api')) {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      // Never log bodies, query strings or cookies (privacy).
      console.log(`${req.method} ${path} ${res.statusCode} ${ms.toFixed(1)}ms rid=${req.requestId}`);
    });
  }
  next();
}

/** Returns the authenticated user's id or throws 401. */
export function userId(req: Request): string {
  if (!req.auth) throw unauthorized();
  return req.auth.user.id;
}

export function authUser(req: Request): AuthUser {
  if (!req.auth) throw unauthorized();
  return req.auth.user;
}
