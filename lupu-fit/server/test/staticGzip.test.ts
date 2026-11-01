import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { staticGzip } from '../src/http/staticGzip.ts';

function run(root: string, path: string, accept: string) {
  const headers: Record<string, string> = {}; let body: Buffer | null = null; let nexted = false;
  const res = { setHeader: (k: string, v: string) => { headers[k] = v; }, end: (b: Buffer) => { body = b; } };
  staticGzip(root)({ method: 'GET', path, headers: { 'accept-encoding': accept } } as never, res as never, () => { nexted = true; });
  return { headers, body: body as Buffer | null, nexted };
}
describe('staticGzip', () => {
  const root = mkdtempSync(join(tmpdir(), 'sg-'));
  mkdirSync(join(root, 'assets'));
  writeFileSync(join(root, 'assets', 'a-1.js'), 'console.log("x".repeat(500));');
  writeFileSync(join(root, 'index.html'), '<html></html>');
  writeFileSync(join(root, 'pic.png'), 'png');
  it('gzips text assets, immutable under /assets, no-cache for index.html', () => {
    const a = run(root, '/assets/a-1.js', 'gzip, br');
    expect(a.headers['Content-Encoding']).toBe('gzip');
    expect(a.headers['Cache-Control']).toContain('immutable');
    expect(gunzipSync(a.body as Buffer).toString()).toContain('console.log');
    expect(run(root, '/index.html', 'gzip').headers['Cache-Control']).toBe('no-cache');
  });
  it('falls through for clients without gzip, binaries, missing files and traversal', () => {
    expect(run(root, '/assets/a-1.js', 'identity').nexted).toBe(true);
    expect(run(root, '/pic.png', 'gzip').nexted).toBe(true);
    expect(run(root, '/nope.js', 'gzip').nexted).toBe(true);
    expect(run(root, '/../etc/passwd.js', 'gzip').nexted).toBe(true);
  });
});
