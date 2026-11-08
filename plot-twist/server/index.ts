/**
 * Production server: serves the built app from ./dist and the API under /api.
 *   npm run build && npm start      (Node ≥ 22.18 runs this TypeScript file directly)
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { createApiHandler } from './api.ts';
import { loadDotEnv, readConfig } from './config.ts';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
/** Built app directory (PLOT_TWIST_DIST overrides it, e.g. for isolated E2E builds). */
const DIST = resolve(ROOT, process.env.PLOT_TWIST_DIST || 'dist');

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.json', '.webmanifest', '.svg', '.map', '.txt']);

const SECURITY_HEADERS: Record<string, string> = {
  'content-security-policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'cross-origin-opener-policy': 'same-origin',
};

const gzipCache = new Map<string, Buffer>();

async function serveStatic(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith('/')) pathname += 'index.html';
  const filePath = normalize(join(DIST, pathname));
  if (!filePath.startsWith(DIST)) {
    res.writeHead(400).end('Bad request');
    return;
  }

  let target = filePath;
  try {
    const s = await stat(target);
    if (s.isDirectory()) target = join(target, 'index.html');
  } catch {
    // Unknown path without an extension → SPA fallback to index.html.
    if (extname(pathname) === '') target = join(DIST, 'index.html');
  }

  let body: Buffer;
  try {
    body = await readFile(target);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS }).end('Not found');
    return;
  }

  const ext = extname(target);
  const headers: Record<string, string> = {
    'content-type': TYPES[ext] ?? 'application/octet-stream',
    ...SECURITY_HEADERS,
    // Hashed build assets never change; the HTML shell must always revalidate.
    'cache-control': target.includes(`${join(DIST, 'assets')}`) ? 'public, max-age=31536000, immutable' : 'no-cache',
  };
  const acceptsGzip = /\bgzip\b/.test(String(req.headers['accept-encoding'] ?? ''));
  if (acceptsGzip && COMPRESSIBLE.has(ext) && body.length > 1024) {
    let zipped = gzipCache.get(target);
    if (!zipped) {
      zipped = gzipSync(body);
      gzipCache.set(target, zipped);
    }
    headers['content-encoding'] = 'gzip';
    headers.vary = 'Accept-Encoding';
    body = zipped;
  }
  headers['content-length'] = String(body.length);
  res.writeHead(200, headers);
  res.end(req.method === 'HEAD' ? undefined : body);
}

loadDotEnv(ROOT);
const config = readConfig();
const api = createApiHandler({ config });

const server = createServer((req, res) => {
  const url = req.url ?? '/';
  const run = url.startsWith('/api/') ? api(req, res) : serveStatic(req, res);
  run.catch((err) => {
    console.error('[plot-twist] request failed:', err);
    if (!res.headersSent) res.writeHead(500, { 'content-type': 'text/plain' });
    if (!res.writableEnded) res.end('Internal error');
  });
});

server.listen(config.port, () => {
  console.log(`[plot-twist] PLOT TWIST running at http://localhost:${config.port}`);
});

const shutdown = () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5_000).unref();
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
