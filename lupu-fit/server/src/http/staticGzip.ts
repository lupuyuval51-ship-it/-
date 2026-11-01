import type { NextFunction, Request, Response } from 'express';
import { statSync, readFileSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { gzipSync } from 'node:zlib';

const TEXT = new Set(['.js', '.css', '.html', '.json', '.svg', '.webmanifest', '.map', '.txt']);
const TYPES: Record<string, string> = { '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.map': 'application/json', '.txt': 'text/plain; charset=utf-8' };
const MAX_CACHE_BYTES = 32 * 1024 * 1024;

/**
 * Dependency-free gzip for the built client (the 1 MB content chunk drops to ~175 KB). Compressed bodies are cached in memory
 * keyed by file + mtime, bounded in size; hashed files under /assets are immutable. Anything else falls through to express.static.
 */
export function staticGzip(root: string): (req: Request, res: Response, next: NextFunction) => void {
  const cache = new Map<string, { mtime: number; body: Buffer }>();
  let bytes = 0;
  return (req, res, next) => {
    if (req.method !== 'GET' || !/\bgzip\b/.test(String(req.headers['accept-encoding'] ?? ''))) { next(); return; }
    let rel: string;
    try { rel = normalize(decodeURIComponent(req.path)); } catch { next(); return; }
    const ext = extname(rel);
    if (!TEXT.has(ext) || rel.includes('..')) { next(); return; }
    const file = join(root, rel);
    if (!file.startsWith(root + sep)) { next(); return; }
    let st: ReturnType<typeof statSync>;
    try { st = statSync(file); if (!st.isFile()) { next(); return; } } catch { next(); return; }
    let hit = cache.get(file);
    if (!hit || hit.mtime !== st.mtimeMs) {
      const body = gzipSync(readFileSync(file), { level: 9 });
      if (bytes + body.length > MAX_CACHE_BYTES) { cache.clear(); bytes = 0; }
      hit = { mtime: st.mtimeMs, body }; cache.set(file, hit); bytes += body.length;
    }
    const noCache = rel.endsWith('index.html') || rel.endsWith('sw.js');
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Vary', 'Accept-Encoding');
    res.setHeader('Content-Type', TYPES[ext] ?? 'application/octet-stream');
    res.setHeader('Content-Length', String(hit.body.length));
    res.setHeader('Cache-Control', noCache ? 'no-cache' : rel.startsWith(`${sep}assets${sep}`) ? 'public, max-age=31536000, immutable' : 'public, max-age=3600');
    res.end(hit.body);
  };
}
