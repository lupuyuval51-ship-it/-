/**
 * The production static server: path containment (no sibling "dist*" leaks),
 * malformed URLs, security headers on every response, and the stale-build
 * warning + build time used by /api/health.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { createServer, request, type IncomingHttpHeaders, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStaticHandler, distBuildTime, resolveStaticPath, staleDistWarning } from '../server/static.ts';

function rawGet(port: number, path: string, headers: Record<string, string> = {}): Promise<{ status: number; headers: IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    // node:http sends the path exactly as written (fetch would normalize it first).
    const req = request({ host: '127.0.0.1', port, path, headers }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c: string) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

let root: string;
let dist: string;
let server: Server;
let port: number;

beforeAll(async () => {
  root = mkdtempSync(join(tmpdir(), 'plot-twist-static-'));
  dist = join(root, 'site', 'dist');
  mkdirSync(join(dist, 'assets'), { recursive: true });
  writeFileSync(join(dist, 'index.html'), `<!doctype html><title>PLOT TWIST</title>${'<!-- padding -->'.repeat(100)}`);
  writeFileSync(join(dist, 'assets', 'app-abc123.js'), 'console.log("app")');
  // The QA layout: siblings whose names start with "dist".
  writeFileSync(join(root, 'site', 'dist.env'), 'ANTHROPIC_API_KEY=sk-ant-SIBLING-FILE');
  mkdirSync(join(root, 'site', 'dist-old'));
  writeFileSync(join(root, 'site', 'dist-old', 'secret.txt'), 'SECRET-IN-SIBLING-DIR');
  server = createServer((req, res) => void createStaticHandler(dist)(req, res));
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
  const addr = server.address();
  port = typeof addr === 'object' && addr ? addr.port : 0;
});

afterAll(() => {
  server.close();
  rmSync(root, { recursive: true, force: true });
});

describe('static paths', () => {
  it.each(['/..%2fdist.env', '/%2e%2e%2fdist-old%2fsecret.txt', '/..%2Fdist.env', '/..%5cdist.env', '/%00', '/assets%2fapp-abc123.js'])(
    'refuses %s with 400 and the security headers',
    async (path) => {
      const res = await rawGet(port, path);
      expect(res.status).toBe(400);
      expect(res.body).not.toMatch(/SIBLING|SECRET/);
      expect(res.headers['content-type']).toBe('text/plain; charset=utf-8');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['content-security-policy']).toMatch(/default-src 'self'/);
    },
  );

  it('answers a malformed escape with 400, not a 500 and a stack trace', async () => {
    const res = await rawGet(port, '/%E0%A4%A');
    expect(res.status).toBe(400);
    expect(res.headers['x-frame-options']).toBe('DENY');
  });

  it('keeps dot segments inside dist (the URL parser resolves them first)', async () => {
    for (const path of ['/%2e%2e/dist.env', '/../dist.env', '/assets/../../dist.env']) {
      const res = await rawGet(port, path);
      expect(res.body, path).not.toMatch(/SIBLING|SECRET/);
      expect([200, 404], path).toContain(res.status);
    }
  });

  it('serves the app, hashed assets and the SPA fallback', async () => {
    const index = await rawGet(port, '/');
    expect(index.status).toBe(200);
    expect(index.headers['cache-control']).toBe('no-cache');
    expect(index.headers['content-security-policy']).toBeTruthy();
    const asset = await rawGet(port, '/assets/app-abc123.js');
    expect(asset.status).toBe(200);
    expect(asset.headers['cache-control']).toContain('immutable');
    const route = await rawGet(port, '/series/some-episode');
    expect(route.status).toBe(200);
    expect(route.body).toContain('PLOT TWIST');
    const missing = await rawGet(port, '/missing.js');
    expect(missing.status).toBe(404);
    expect(missing.headers['x-content-type-options']).toBe('nosniff');
  });

  it('gzips the shell and serves a rebuilt file, not a stale cached copy', async () => {
    // fetch() asks for gzip and decompresses, so the text is what the browser would see.
    const before = await fetch(`http://127.0.0.1:${port}/`);
    expect(before.headers.get('content-encoding')).toBe('gzip');
    expect(await before.text()).not.toContain('REBUILT');
    writeFileSync(join(dist, 'index.html'), `<!doctype html><title>PLOT TWIST REBUILT</title>${'<!-- padding -->'.repeat(120)}`);
    const after = await fetch(`http://127.0.0.1:${port}/`);
    expect(after.headers.get('content-encoding')).toBe('gzip');
    expect(await after.text()).toContain('REBUILT');
  });

  it('resolveStaticPath requires a separator after the dist directory', () => {
    expect(resolveStaticPath('/srv/site/dist', '/index.html')).toEqual({ ok: true, pathname: '/index.html', filePath: '/srv/site/dist/index.html' });
    expect(resolveStaticPath('/srv/site/dist', '/')).toMatchObject({ ok: true, filePath: '/srv/site/dist/index.html' });
    expect(resolveStaticPath('/srv/site/dist', '/..%2fdist.env').ok).toBe(false);
    expect(resolveStaticPath('/srv/site/dist', '/%E0%A4%A').ok).toBe(false);
  });
});

describe('build freshness', () => {
  function layout() {
    const dir = mkdtempSync(join(tmpdir(), 'plot-twist-build-'));
    mkdirSync(join(dir, 'dist'));
    mkdirSync(join(dir, 'src', 'ui'), { recursive: true });
    mkdirSync(join(dir, 'shared'));
    writeFileSync(join(dir, 'dist', 'index.html'), '<!doctype html>');
    writeFileSync(join(dir, 'src', 'ui', 'App.tsx'), 'export {}');
    writeFileSync(join(dir, 'shared', 'types.ts'), 'export {}');
    const at = (path: string, iso: string) => utimesSync(join(dir, path), new Date(iso), new Date(iso));
    return { dir, at };
  }

  it('warns once when src/ or shared/ has a file newer than dist/index.html', () => {
    const { dir, at } = layout();
    try {
      at('dist/index.html', '2026-11-08T21:29:43Z');
      at('src/ui/App.tsx', '2026-11-08T20:00:00Z');
      at('shared/types.ts', '2026-11-08T20:00:00Z');
      expect(staleDistWarning(join(dir, 'dist'))).toBeNull();
      at('shared/types.ts', '2026-11-08T22:01:28Z');
      expect(staleDistWarning(join(dir, 'dist'))).toBe('dist/ is older than the source — run npm run build');
      at('shared/types.ts', '2026-11-08T20:00:00Z');
      at('src/ui/App.tsx', '2026-11-08T21:34:31Z');
      expect(staleDistWarning(join(dir, 'dist'))).toBe('dist/ is older than the source — run npm run build');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('stays quiet for a dist/ shipped without sources, or no dist/ at all', () => {
    const { dir } = layout();
    try {
      rmSync(join(dir, 'src'), { recursive: true });
      rmSync(join(dir, 'shared'), { recursive: true });
      expect(staleDistWarning(join(dir, 'dist'))).toBeNull();
      expect(staleDistWarning(join(dir, 'nope'))).toBeNull();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('reports the build time as the ISO mtime of dist/index.html', () => {
    const { dir, at } = layout();
    try {
      at('dist/index.html', '2026-11-08T21:29:43Z');
      expect(distBuildTime(join(dir, 'dist'))).toBe('2026-11-08T21:29:43.000Z');
      expect(distBuildTime(join(dir, 'nope'))).toBeNull();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
