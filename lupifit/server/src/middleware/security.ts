import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { config } from '../config';
import { HttpError, forbidden } from '../lib/errors';

/** Security headers. CSP allows only same-origin scripts/styles/connections. */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      mediaSrc: ["'self'", 'blob:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: config.isProduction ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: config.isProduction ? { maxAge: 15552000, includeSubDomains: true } : false,
});

/** Camera is needed (same-origin only) for barcode scanning and meal photos. */
export function permissionsPolicy(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(), payment=(), usb=()');
  next();
}

/** API responses contain private data: never cache them. */
export function noStore(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('Cache-Control', 'no-store');
  next();
}

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function allowedOrigin(req: Request, origin: string): boolean {
  try {
    const o = new URL(origin).origin;
    const self = `${req.protocol}://${req.get('host')}`;
    if (o === self) return true;
    if (o === new URL(config.appUrl).origin) return true;
    return config.allowedOrigins.some((a) => {
      try {
        return new URL(a).origin === o;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

/**
 * CSRF defence in depth for state-changing requests:
 * 1. Browser-sent Origin must be this app (blocks cross-site form/fetch posts).
 * 2. Bodies must be JSON (cross-site HTML forms cannot send application/json without CORS preflight).
 * 3. Authenticated requests must echo the per-session CSRF token header (checked in auth middleware).
 */
export function originAndContentTypeGuard(req: Request, _res: Response, next: NextFunction) {
  if (!MUTATING.has(req.method)) return next();
  const origin = req.get('origin');
  if (origin && origin !== 'null' && !allowedOrigin(req, origin)) return next(forbidden('origin_not_allowed', 'Cross-origin request blocked'));
  if (origin === 'null') return next(forbidden('origin_not_allowed', 'Cross-origin request blocked'));
  const length = Number(req.get('content-length') ?? 0);
  const hasBody = length > 0 || req.get('transfer-encoding') != null;
  if (hasBody && !req.is('application/json')) return next(new HttpError(415, 'unsupported_media_type', 'Use application/json'));
  next();
}
