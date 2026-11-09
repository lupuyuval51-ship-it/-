/**
 * Static hosting for the built app (dist/), with an SPA fallback, gzip and
 * security headers on every response. Kept apart from server/index.ts so the
 * path handling can be tested without starting the production server.
 */
import { readdirSync, statSync, type Stats } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { gzipSync } from 'node:zlib';

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

export const SECURITY_HEADERS: Record<string, string> = {
  'content-security-policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'cross-origin-opener-policy': 'same-origin',
};

/** A small plain-text response that carries the same security headers as the app. */
export function sendText(res: ServerResponse, status: number, body: string): void {
  if (res.headersSent) {
    if (!res.writableEnded) res.end();
    return;
  }
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', ...SECURITY_HEADERS });
  res.end(body);
}

export type StaticPath = { ok: true; pathname: string; filePath: string } | { ok: false };

/**
 * Maps a request URL to a file inside `dist`, or rejects it. The URL parser has
 * already resolved `.`/`..` segments (including `%2e%2e`), so anything that could
 * still climb out is an encoded separator or NUL, which no asset needs: those are
 * refused before decoding, and the result must sit inside `dist` itself — a sibling
 * such as `dist.env` or `dist-old/` is outside even though its name starts with "dist".
 */
export function resolveStaticPath(dist: string, rawUrl: string): StaticPath {
  const root = resolve(dist);
  let pathname: string;
  try {
    const raw = new URL(rawUrl, 'http://localhost').pathname;
    if (/%(?:2f|5c|00)/i.test(raw)) return { ok: false };
    pathname = decodeURIComponent(raw);
  } catch {
    return { ok: false }; // malformed escapes such as %E0%A4%A
  }
  if (pathname.includes('\0') || pathname.includes('\\')) return { ok: false };
  if (pathname.endsWith('/')) pathname += 'index.html';
  const filePath = resolve(root, `.${pathname}`);
  if (filePath !== root && !filePath.startsWith(root + sep)) return { ok: false };
  return { ok: true, pathname, filePath };
}

async function statOrNull(path: string): Promise<Stats | null> {
  try {
    return await stat(path);
  } catch {
    return null;
  }
}

/** Serves `dist`: hashed assets are immutable, the HTML shell always revalidates. */
export function createStaticHandler(dist: string): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  const root = resolve(dist);
  const assets = join(root, 'assets') + sep;
  const gzipCache = new Map<string, Buffer>();

  return async (req, res) => {
    const resolved = resolveStaticPath(root, req.url ?? '/');
    if (!resolved.ok) return sendText(res, 400, 'Bad request');

    let target = resolved.filePath;
    let s = await statOrNull(target);
    if (s?.isDirectory()) {
      target = join(target, 'index.html');
      s = await statOrNull(target);
    } else if (!s && extname(resolved.pathname) === '') {
      // Unknown path without an extension → SPA fallback to index.html.
      target = join(root, 'index.html');
      s = await statOrNull(target);
    }
    if (!s?.isFile()) return sendText(res, 404, 'Not found');

    let body: Buffer;
    try {
      body = await readFile(target);
    } catch {
      return sendText(res, 404, 'Not found');
    }

    const ext = extname(target);
    const headers: Record<string, string> = {
      'content-type': TYPES[ext] ?? 'application/octet-stream',
      ...SECURITY_HEADERS,
      'cache-control': target.startsWith(assets) ? 'public, max-age=31536000, immutable' : 'no-cache',
    };
    const acceptsGzip = /\bgzip\b/.test(String(req.headers['accept-encoding'] ?? ''));
    if (acceptsGzip && COMPRESSIBLE.has(ext) && body.length > 1024) {
      // Keyed by mtime and size too, so a rebuild under a running server is never served stale.
      const cacheKey = `${target}:${s.mtimeMs}:${s.size}`;
      let zipped = gzipCache.get(cacheKey);
      if (!zipped) {
        zipped = gzipSync(body);
        gzipCache.set(cacheKey, zipped);
      }
      headers['content-encoding'] = 'gzip';
      headers.vary = 'Accept-Encoding';
      body = zipped;
    }
    headers['content-length'] = String(body.length);
    res.writeHead(200, headers);
    res.end(req.method === 'HEAD' ? undefined : body);
  };
}

/** When `dist/index.html` was built (its mtime, ISO 8601), or null if there is no build. */
export function distBuildTime(dist: string): string | null {
  try {
    return statSync(join(dist, 'index.html')).mtime.toISOString();
  } catch {
    return null;
  }
}

function hasFileNewerThan(dir: string, mtimeMs: number): boolean {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true, recursive: true });
  } catch {
    return false;
  }
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    try {
      if (statSync(join(entry.parentPath, entry.name)).mtimeMs > mtimeMs) return true;
    } catch {
      // vanished while we looked: ignore
    }
  }
  return false;
}

/**
 * The startup warning when the build being served is older than the source next
 * to it (src/ or shared/ beside dist/), or null. A dist/ shipped on its own, with
 * no sources beside it, is never flagged.
 */
export function staleDistWarning(dist: string): string | null {
  const root = resolve(dist);
  try {
    if (!statSync(root).isDirectory()) return null;
  } catch {
    return null;
  }
  const parent = dirname(root);
  const sources = ['src', 'shared'].map((d) => join(parent, d)).filter((d) => {
    try {
      return statSync(d).isDirectory();
    } catch {
      return false;
    }
  });
  if (sources.length === 0) return null;
  let builtAt = 0;
  try {
    builtAt = statSync(join(root, 'index.html')).mtimeMs;
  } catch {
    builtAt = 0; // a dist/ without index.html is as stale as it gets
  }
  return sources.some((d) => hasFileNewerThan(d, builtAt)) ? 'dist/ is older than the source — run npm run build' : null;
}
