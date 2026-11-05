import express, { type NextFunction, type Request, type Response } from 'express';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { ApiApp } from '../core/app.ts';
import { BoundedRateLimiter, rateLimitAddress } from '../core/rateLimit.ts';
import { staticGzip } from './staticGzip.ts';

export { BoundedRateLimiter };

export interface ExpressOpts {
  /** Express `trust proxy` value. Production behind one proxy: 1. Local/device: false. */
  trustProxy: number | boolean | string;
  mode: 'hosted' | 'device';
  staticDir?: string;
  assetLinksFile?: string;
  /** requests per minute per client IP */
  globalLimitPerMin?: number;
  /** request bodies above the default 100 KB being read at once: per large route (photo, restore, admin media each have their own pool) / per user (default 4 / 1) */
  largeBodies?: { global: number; perUser: number };
  /** how long a large body may take to arrive: baseMs plus perMbMs per declared MB (default 15 s + 8 s/MB, about 1 Mbit/s) */
  bodyDeadline?: { baseMs: number; perMbMs: number };
  /** requests per minute per client IP outside /api (static files, the app shell); default 2x globalLimitPerMin */
  staticLimitPerMin?: number;
}

/** Default deadline for reading a large request body (a trickling upload must not hold its slot for Node's 5-minute request timeout). */
export const BODY_DEADLINE = { baseMs: 15_000, perMbMs: 8_000 } as const;

/**
 * TRUST_PROXY: a hop count, `false`, or a list of proxy addresses/CIDRs. `true` (trust every hop) makes the leftmost, client-written
 * X-Forwarded-For the client address, so every per-address limit could be dodged: refused in production.
 */
export function parseTrustProxy(raw: string | undefined, production: boolean): number | boolean | string {
  if (raw === undefined || raw === '') return production ? 1 : false;
  if (/^\d+$/.test(raw)) return Number(raw);
  if (raw === 'false') return false;
  if (raw === 'true') {
    if (production) throw new Error('TRUST_PROXY=true trusts every X-Forwarded-For hop; set the number of proxies in front (e.g. 1) or their addresses');
    return true;
  }
  return raw;
}

/**
 * Content-Security-Policy for the hosted web app. Everything is same-origin: the bundle, API, fonts, dish photos and technique clips
 * (img/media 'self'); `data:`/`blob:` cover small inlined assets and the downscaled meal photo preview; inline style attributes are
 * used by the UI. No external host is allowed anywhere, so adding more photos or clips needs no change here. (The Capacitor app is
 * served from its own https://localhost origin and never from this server.)
 */
export const CSP = [
  "default-src 'self'", "script-src 'self'", "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:", "media-src 'self' blob:", "font-src 'self' data:",
  "connect-src 'self'", "manifest-src 'self'", "worker-src 'self'", "object-src 'none'", "frame-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
].join('; ');

export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Content-Security-Policy', CSP);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(), payment=(), usb=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  if (req.secure) res.setHeader('Strict-Transport-Security', 'max-age=15552000'); // only when the request arrived over HTTPS (trust proxy aware)
  next();
}

/** Build output that does not exist must be a 404, never the app shell: a missing script or clip answered with index.html (200) gets cached as if it were that file. */
const ASSET_PATH = /^\/(?:assets|media|fonts|icons)\/|\.(?:js|mjs|css|map|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|mp4|webm|json|webmanifest|txt|xml)$/i;

/** Body cap of a request that matches no route (it is answered 404/405 anyway). Each route's own cap is its `maxBodyBytes`. */
export const DEFAULT_BODY_LIMIT = 100 * 1024;

export function createExpressApp(api: ApiApp, o: ExpressOpts): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', o.trustProxy);
  app.use(securityHeaders);
  const limiter = new BoundedRateLimiter(o.globalLimitPerMin ?? 600);
  // Everything outside /api (static files, the app shell, malformed paths) has its own per-IP budget too.
  const staticLimiter = new BoundedRateLimiter(o.staticLimitPerMin ?? (o.globalLimitPerMin ?? 600) * 2);
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/') || req.path === '/api') { next(); return; }
    if (!staticLimiter.hit(rateLimitAddress(req.ip ?? 'unknown'))) { res.set('Retry-After', '60').status(429).type('text/plain').send('Too many requests'); return; }
    next();
  });

  app.get('/health', (_req, res) => { res.json({ ok: true, mode: o.mode }); });
  if (o.assetLinksFile) {
    app.get('/.well-known/assetlinks.json', (_req, res) => {
      if (!existsSync(o.assetLinksFile as string)) { res.status(404).json({ error: 'not_found' }); return; }
      res.type('application/json').send(readFileSync(o.assetLinksFile as string, 'utf8'));
    });
  }

  // API answers are per user and per session: never stored by the browser, a proxy or a CDN (the service worker keeps its own, explicit copy).
  app.use('/api', (_req: Request, res: Response, next: NextFunction) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    if (!limiter.hit(rateLimitAddress(req.ip ?? 'unknown'))) { res.set('Retry-After', '60').status(429).json({ error: 'rate_limited' }); return; }
    next();
  });

  // One source of truth for body caps: the parser limit IS the matched route's maxBodyBytes (the core checks the same number).
  // inflate:false: a compressed body could otherwise expand past the cap the core sees in Content-Length.
  const parsers = new Map<number, express.RequestHandler>();
  const parserFor = (limit: number): express.RequestHandler => {
    let p = parsers.get(limit);
    if (!p) { p = express.json({ limit, inflate: false }); parsers.set(limit, p); }
    return p;
  };
  const large = o.largeBodies ?? { global: 4, perUser: 1 };
  const deadline = o.bodyDeadline ?? BODY_DEADLINE;
  // One pool per large route: slow restores cannot use up the slots photo estimates need, and the other way round.
  const largeInFlight = new Map<string, number>(); const largeByUser = new Map<string, number>();
  const hasBody = (req: Request) => req.headers['transfer-encoding'] !== undefined || Number(req.headers['content-length'] ?? 0) > 0;
  /** Answer without parsing: the rest of the body is drained and discarded, never buffered. */
  const refuse = (req: Request, res: Response, status: number, error: string, headers: Record<string, string> = {}) => {
    req.resume();
    res.set({ connection: 'close', ...headers }).status(status).json({ error });
  };

  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    const m = api.router.match(req.method.toUpperCase(), `/api${req.path}`);
    const limit = 'route' in m ? (m.route.opts.maxBodyBytes ?? DEFAULT_BODY_LIMIT) : DEFAULT_BODY_LIMIT;
    const pool = 'route' in m ? `${m.route.method} ${m.route.pattern}` : '';
    if (limit <= DEFAULT_BODY_LIMIT || !hasBody(req)) { parserFor(Math.min(limit, DEFAULT_BODY_LIMIT))(req, res, next); return; }
    if (Number(req.headers['content-length'] ?? 0) > limit) { refuse(req, res, 413, 'payload_too_large'); return; }
    // A large body is read only for a signed-in session with its CSRF header, and only a few at a time: parsing megabytes of JSON
    // costs far more memory than the bytes themselves, so an anonymous flood must be refused before the parser ever sees it.
    void (async () => {
      const auth = await api.authenticate(Object.fromEntries(Object.entries(req.headers).filter((e): e is [string, string] => typeof e[1] === 'string')));
      if (!auth) { refuse(req, res, 401, 'unauthorized'); return; }
      if (req.headers['x-csrf-token'] !== auth.session.csrf) { refuse(req, res, 403, 'csrf_invalid'); return; }
      const uid = auth.user.id; const mine = largeByUser.get(uid) ?? 0; const inPool = largeInFlight.get(pool) ?? 0;
      if (inPool >= large.global || mine >= large.perUser) { refuse(req, res, 503, 'rate_limited', { 'retry-after': '5' }); return; }
      largeInFlight.set(pool, inPool + 1); largeByUser.set(uid, mine + 1);
      let done = false;
      const release = () => {
        if (done) return; done = true; clearTimeout(timer);
        const p = (largeInFlight.get(pool) ?? 1) - 1; if (p > 0) largeInFlight.set(pool, p); else largeInFlight.delete(pool);
        const n = (largeByUser.get(uid) ?? 1) - 1; if (n > 0) largeByUser.set(uid, n); else largeByUser.delete(uid);
      };
      // The body must arrive within its deadline (scaled by the declared size); a trickling upload is cut off and its slot freed.
      const declared = Number(req.headers['content-length'] ?? limit);
      const timer = setTimeout(() => {
        release();
        if (!res.headersSent) res.set('connection', 'close').status(408).json({ error: 'request_timeout' });
        req.destroy();
      }, deadline.baseMs + Math.ceil((Number.isFinite(declared) ? declared : limit) / (1024 * 1024) * deadline.perMbMs));
      req.on('end', () => clearTimeout(timer)); // fully received: the handler may take its time (the slot is still held until the answer)
      res.on('close', release);
      parserFor(limit)(req, res, next);
    })().catch(next);
  });

  app.use('/api', async (req: Request, res: Response) => {
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers[k.toLowerCase()] = v;
    const query: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.query)) if (typeof v === 'string') query[k] = v;
    const bytes = Number(req.headers['content-length']);
    const out = await api.handle({ method: req.method, path: `/api${req.path}`, query, headers, body: req.body as unknown, ip: req.ip ?? 'unknown', ...(Number.isFinite(bytes) ? { bodyBytes: bytes } : {}) });
    for (const [k, v] of Object.entries(out.headers ?? {})) res.setHeader(k, v);
    if (out.setCookies?.length) res.setHeader('Set-Cookie', out.setCookies);
    res.status(out.status);
    if (out.body === undefined) res.end(); else res.json(out.body);
  });

  // body-parser errors (too large, malformed JSON, unsupported encoding/charset, aborted) become structured JSON with their own 4xx
  app.use('/api', (err: { type?: string; status?: number }, _req: Request, res: Response, _next: NextFunction) => {
    if (res.headersSent) { res.end(); return; } // e.g. a body cut off at its deadline: the 408 is already on its way
    if (err.type === 'entity.too.large') res.status(413).json({ error: 'payload_too_large' });
    else if (err.type === 'entity.parse.failed') res.status(400).json({ error: 'invalid_json' });
    else if (err.type === 'encoding.unsupported' || err.type === 'charset.unsupported') res.status(415).json({ error: 'bad_request' });
    else if (typeof err.status === 'number' && err.status >= 400 && err.status < 500) res.status(err.status).json({ error: 'bad_request' });
    else res.status(500).json({ error: 'internal_error' });
  });

  if (o.staticDir && existsSync(o.staticDir)) {
    app.use(staticGzip(resolve(o.staticDir)));
    app.use(express.static(o.staticDir, { maxAge: '1h', setHeaders: (res, p) => { if (p.endsWith('index.html') || p.endsWith('sw.js')) res.setHeader('Cache-Control', 'no-cache'); } }));
    app.get('/{*splat}', (req, res, next) => {
      if (req.path.startsWith('/api')) { next(); return; }
      if (ASSET_PATH.test(req.path)) { res.status(404).type('text/plain').send('Not found'); return; }
      res.sendFile(join(o.staticDir as string, 'index.html'));
    });
  }
  // Last handler for everything else (a malformed %-escape in a static path, a failed sendFile): a short plain answer, never Express's
  // HTML page with a stack trace. Client-caused errors (4xx) are not logged, so they cannot flood the log; 5xx logs the message only.
  app.use((err: { status?: number; statusCode?: number; message?: string }, _req: Request, res: Response, _next: NextFunction) => {
    const raw = err.status ?? err.statusCode;
    const status = typeof raw === 'number' && raw >= 400 && raw < 600 ? raw : 500;
    if (status >= 500) console.error('[http]', err.message ?? 'error');
    if (res.headersSent) { res.end(); return; }
    res.status(status).type('text/plain').send(status >= 500 ? 'Internal error' : 'Bad request');
  });
  return app;
}
