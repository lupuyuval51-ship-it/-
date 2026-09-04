/**
 * Zero-dependency static server for local development.
 * ES modules and web workers need a real http origin, so `file://` will not do.
 *
 *   node serve.js [port]
 */
import { createReadStream, promises as fs } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.argv[2] ?? process.env.PORT ?? 8080);
// Cross-origin isolation unlocks multi-threaded WASM. Off by default so the dev
// server behaves like the static hosts this app targets (GitHub Pages and
// friends cannot set these headers). Enable with COI=1.
const isolate = process.env.COI === '1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.wasm': 'application/wasm',
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const relative = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const target = path.join(root, path.normalize(relative).replace(/^(\.\.[/\\])+/, ''));
    if (!target.startsWith(root)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const stats = await fs.stat(target);
    const file = stats.isDirectory() ? path.join(target, 'index.html') : target;
    const body = await fs.stat(file);
    response.writeHead(200, {
      'content-type': MIME[path.extname(file)] ?? 'application/octet-stream',
      'content-length': body.size,
      'cache-control': 'no-cache',
      ...(isolate
        ? {
            'cross-origin-opener-policy': 'same-origin',
            'cross-origin-embedder-policy': 'credentialless',
          }
        : {}),
    });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
  }
});

server.listen(port, () => {
  console.log(`Free Subtitles running on http://localhost:${port}`);
  if (isolate) console.log('cross-origin isolation: on (multi-threaded WASM)');
});
