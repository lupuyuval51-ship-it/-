import { createReadStream, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

/**
 * Tiny static file server for the Device Mode E2E: it serves a built `client/dist-device` the way Capacitor serves the packaged
 * assets (plain files, SPA fallback to index.html, Range support for the mp4 clips) and has NO API at all. Anything under /api
 * answers 404 and is counted, so a test can prove the app never asked a server for anything.
 */
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.wasm': 'application/wasm', '.data': 'application/octet-stream', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon',
};

export interface StaticServer { server: Server; apiHits: string[]; close(): Promise<void> }

export function startStaticServer(dir: string, port: number): Promise<StaticServer> {
  const root = resolve(dir);
  const apiHits: string[] = [];
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    let path: string;
    try { path = decodeURIComponent(url.pathname); } catch { res.writeHead(400).end(); return; }
    if (path.startsWith('/api/') || path === '/api') { apiHits.push(`${req.method} ${url.pathname}`); res.writeHead(404, { 'content-type': 'application/json' }).end('{"error":"no_server"}'); return; }
    let file = normalize(join(root, path));
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    let st = (() => { try { return statSync(file); } catch { return null; } })();
    if (st?.isDirectory()) { file = join(file, 'index.html'); st = (() => { try { return statSync(file); } catch { return null; } })(); }
    if (!st) {
      // SPA fallback only for page navigations (no file extension). A missing build file must be a 404, never the app shell.
      if (extname(path) !== '') { res.writeHead(404).end('not found'); return; }
      file = join(root, 'index.html'); st = statSync(file);
    }
    const type = MIME[extname(file).toLowerCase()] ?? 'application/octet-stream';
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
    const headers: Record<string, string | number> = { 'content-type': type, 'accept-ranges': 'bytes', 'cache-control': 'no-cache' };
    if (range && (range[1] !== '' || range[2] !== '')) {
      const size = st.size;
      const start = range[1] === '' ? Math.max(0, size - Number(range[2])) : Number(range[1]);
      const end = range[1] === '' || range[2] === '' ? size - 1 : Math.min(Number(range[2]), size - 1);
      if (!(start < size) || end < start) { res.writeHead(416, { 'content-range': `bytes */${size}` }).end(); return; }
      res.writeHead(206, { ...headers, 'content-range': `bytes ${start}-${end}/${size}`, 'content-length': end - start + 1 });
      if (req.method === 'HEAD') { res.end(); return; }
      createReadStream(file, { start, end }).pipe(res); return;
    }
    res.writeHead(200, { ...headers, 'content-length': st.size });
    if (req.method === 'HEAD') { res.end(); return; }
    createReadStream(file).pipe(res);
  });
  return new Promise((ok, fail) => { server.once('error', fail); server.listen(port, () => ok({ server, apiHits, close: () => new Promise<void>((r) => { server.close(() => r()); server.closeAllConnections(); }) })); });
}

// CLI: `tsx e2e/staticServer.ts <dir> <port>`
if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = process.argv[2]; const port = Number(process.argv[3]);
  if (!dir || !port) { console.error('usage: staticServer.ts <dir> <port>'); process.exit(2); }
  const s = await startStaticServer(dir, port);
  console.log(`static server on http://localhost:${port} serving ${dir}`);
  const stop = () => { void s.close().then(() => process.exit(0)); };
  process.on('SIGTERM', stop); process.on('SIGINT', stop);
}
