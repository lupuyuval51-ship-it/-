import express, { type NextFunction, type Request, type Response } from 'express';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { ApiApp } from '../core/app.ts';
import { staticGzip } from './staticGzip.ts';

export interface ExpressOpts {
  /** Express `trust proxy` value. Production behind one proxy: 1. Local/device: false. */
  trustProxy: number | boolean | string;
  mode: 'hosted' | 'device';
  staticDir?: string;
  assetLinksFile?: string;
  /** requests per minute per client IP */
  globalLimitPerMin?: number;
}

export const LIMITS = { json: '100kb', photo: '8mb', restoreHosted: '8mb', restoreDevice: '200mb' } as const;

/** Per-IP fixed-window limiter whose memory can never grow without bound (periodic sweep + hard size cap with LRU eviction). */
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

export function createExpressApp(api: ApiApp, o: ExpressOpts): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', o.trustProxy);
  const limiter = new BoundedRateLimiter(o.globalLimitPerMin ?? 600);

  app.get('/health', (_req, res) => { res.json({ ok: true, mode: o.mode }); });
  if (o.assetLinksFile) {
    app.get('/.well-known/assetlinks.json', (_req, res) => {
      if (!existsSync(o.assetLinksFile as string)) { res.status(404).json({ error: 'not_found' }); return; }
      res.type('application/json').send(readFileSync(o.assetLinksFile as string, 'utf8'));
    });
  }

  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    if (!limiter.hit(req.ip ?? 'unknown')) { res.set('Retry-After', '60').status(429).json({ error: 'rate_limited' }); return; }
    next();
  });

  const json = (limit: string) => express.json({ limit });
  const parsers = {
    default: json(LIMITS.json), photo: json(LIMITS.photo),
    restore: json(o.mode === 'device' ? LIMITS.restoreDevice : LIMITS.restoreHosted),
  };
  app.use('/api', (req, res, next) => {
    const p = req.path;
    const parser = p === '/device/restore' ? parsers.restore : p === '/nutrition/photo-estimate' ? parsers.photo : parsers.default;
    parser(req, res, next);
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

  // body-parser errors (too large, malformed JSON) become structured JSON, never HTML stack traces
  app.use('/api', (err: { type?: string; status?: number }, _req: Request, res: Response, _next: NextFunction) => {
    if (err.type === 'entity.too.large') res.status(413).json({ error: 'payload_too_large' });
    else if (err.type === 'entity.parse.failed') res.status(400).json({ error: 'invalid_json' });
    else res.status(500).json({ error: 'internal_error' });
  });

  if (o.staticDir && existsSync(o.staticDir)) {
    app.use(staticGzip(resolve(o.staticDir)));
    app.use(express.static(o.staticDir, { maxAge: '1h', setHeaders: (res, p) => { if (p.endsWith('index.html') || p.endsWith('sw.js')) res.setHeader('Cache-Control', 'no-cache'); } }));
    app.get('/{*splat}', (req, res, next) => { if (req.path.startsWith('/api')) { next(); return; } res.sendFile(join(o.staticDir as string, 'index.html')); });
  }
  return app;
}
