/** path / url / util / fs / http shims and the package stubs, against Node where Node has the same function. */
import nodePath from 'node:path';
import nodeUrl from 'node:url';
import { describe, expect, it } from 'vitest';
import Anthropic from '../stubs/anthropic';
import helmet from '../stubs/helmet';
import webpush from '../stubs/web-push';
import { installDeviceGlobals } from '../globals';
import { DeviceBuffer } from '../buffer';
import { DEVICE_ENV } from '../env';
import fs from './fs';
import http from './http';
import path from './path';
import url from './url';
import util, { promisify } from './util';

describe('path (POSIX)', () => {
  const cases: string[][] = [
    ['/a/b', '../c'],
    ['/a/b/', './c/', '..'],
    ['a', 'b', '../../..', 'c'],
    ['/', '..', 'x'],
    ['', 'a'],
    ['/srv/app/server/src/db', 'migrations'],
    ['/srv/app/dist/server', 'db', 'migrations'],
  ];
  it('join / normalize like node:path.posix', () => {
    for (const c of cases) expect(path.join(...c)).toBe(nodePath.posix.join(...c));
    for (const p of ['', '.', '/', '//a//b/../c/.', 'a/../..', '../a/./b/', '/x/y/']) expect(path.normalize(p)).toBe(nodePath.posix.normalize(p));
  });
  it('resolve against the working directory like node:path.posix (cwd /)', () => {
    for (const c of [['/a', 'b'], ['/a', '/b', 'c'], ['/a/b', '..', '.env'], ['/x/', '../..']]) expect(path.resolve(...c)).toBe(nodePath.posix.resolve(...c));
    // config.ts looks for .env files from process.cwd(): it must compute without throwing.
    expect(path.resolve(process.cwd(), '..', '.env')).toBe(nodePath.posix.resolve(process.cwd(), '..', '.env'));
  });
  it('dirname / basename / extname / isAbsolute / relative like node:path.posix', () => {
    for (const p of ['/a/b/c.sql', '/a/b/', 'c', '/', 'a/b.tar.gz', '.env', 'dir/.hidden']) {
      expect(path.dirname(p)).toBe(nodePath.posix.dirname(p));
      expect(path.basename(p)).toBe(nodePath.posix.basename(p));
      expect(path.extname(p)).toBe(nodePath.posix.extname(p));
      expect(path.isAbsolute(p)).toBe(nodePath.posix.isAbsolute(p));
    }
    expect(path.basename('/a/sw.js', '.js')).toBe('sw');
    expect(path.relative('/a/b/c', '/a/d')).toBe(nodePath.posix.relative('/a/b/c', '/a/d'));
    expect(path.posix).toBe(path);
  });
});

describe('url, fs, util, http', () => {
  it('fileURLToPath converts file: URLs and refuses others, like Node', () => {
    for (const u of ['file:///srv/app/x.js', 'file:///a%20b/%E2%9C%93.sql']) expect(url.fileURLToPath(u)).toBe(nodeUrl.fileURLToPath(u));
    expect(() => url.fileURLToPath('https://localhost/assets/worker.js')).toThrow(/scheme file/);
    expect(() => nodeUrl.fileURLToPath('https://localhost/assets/worker.js')).toThrow(/scheme file/);
    expect(url.pathToFileURL('/a b/c').href).toBe(nodeUrl.pathToFileURL('/a b/c').href);
  });

  it('fs has no files: nothing exists and reading throws ENOENT', () => {
    expect(fs.existsSync('/srv/app/.env')).toBe(false);
    expect(() => fs.readFileSync('/x')).toThrow(expect.objectContaining({ code: 'ENOENT' }));
    expect(() => fs.readdirSync('/x')).toThrow(expect.objectContaining({ code: 'ENOENT', syscall: 'scandir' }));
  });

  it('promisify supports callbacks and util.promisify.custom', async () => {
    const add = (a: number, b: number, cb: (err: Error | null, v?: number) => void) => setTimeout(() => cb(null, a + b), 1);
    expect(await promisify<number>(add as never)(2, 3)).toBe(5);
    const fail = (cb: (err: Error) => void) => cb(new Error('nope'));
    await expect(promisify(fail as never)()).rejects.toThrow('nope');
    const custom = Object.assign(() => undefined, { [promisify.custom]: async () => 'custom' });
    expect(await promisify(custom as never)()).toBe('custom');
    expect(promisify.custom).toBe(Symbol.for('nodejs.util.promisify.custom'));
    expect(util.promisify).toBe(promisify);
  });

  it('http has no server', () => {
    expect(() => http.createServer()).toThrow(/no HTTP server in device mode/);
  });
});

describe('package stubs', () => {
  it('helmet passes requests through', () => {
    let called = false;
    helmet({ contentSecurityPolicy: {} })({}, {}, () => (called = true));
    expect(called).toBe(true);
  });

  it('web-push refuses to run', async () => {
    expect(() => webpush.generateVAPIDKeys()).toThrow(/not available in device mode/);
    await expect(webpush.sendNotification()).rejects.toThrow(/not available in device mode/);
  });

  it('the Anthropic stub has the error classes llm.ts checks with instanceof, and cannot be constructed', () => {
    for (const name of [
      'APIError',
      'APIConnectionError',
      'APIConnectionTimeoutError',
      'AuthenticationError',
      'PermissionDeniedError',
      'RateLimitError',
      'BadRequestError',
      'NotFoundError',
      'UnprocessableEntityError',
    ] as const) {
      expect(new Anthropic[name]('x')).toBeInstanceOf(Anthropic.APIError);
    }
    expect(new Anthropic.APIConnectionTimeoutError('t')).toBeInstanceOf(Anthropic.APIConnectionError);
    expect(() => new Anthropic({ apiKey: 'k' })).toThrow(/not available in device mode/);
  });
});

describe('device globals', () => {
  it('installs process and Buffer only where they are missing', () => {
    const g = globalThis as { process?: unknown; Buffer?: unknown };
    const saved = { process: g.process, Buffer: g.Buffer };
    try {
      installDeviceGlobals();
      expect(g.process).toBe(saved.process); // Node's own globals are kept
      delete g.process;
      delete g.Buffer;
      installDeviceGlobals();
      const proc = g.process as { env: Record<string, string>; cwd(): string; versions: Record<string, string>; hrtime: { bigint(): bigint } };
      expect(proc.env).toEqual(DEVICE_ENV);
      expect(proc.env).not.toBe(DEVICE_ENV);
      expect(proc.cwd()).toBe('/');
      expect(proc.versions.node).toBeUndefined(); // PGlite and Emscripten keep their browser code paths
      expect(typeof proc.hrtime.bigint()).toBe('bigint');
      expect(g.Buffer).toBe(DeviceBuffer);
    } finally {
      g.process = saved.process;
      g.Buffer = saved.Buffer;
    }
  });

  it('has the device environment the task requires', () => {
    expect(DEVICE_ENV).toMatchObject({
      NODE_ENV: 'production',
      DEVICE_MODE: 'true',
      COOKIE_SECURE: 'false',
      RATE_LIMIT_ENABLED: 'false',
      PASSWORD_SCRYPT_N: '1024',
      AI_API_KEY: '',
      PUSH_AUTO_VAPID: 'false',
      OPENFOODFACTS_ENABLED: 'true',
      SESSION_TTL_DAYS: '365',
      DATABASE_URL: 'idb://lupufit-device',
    });
    expect(Object.isFrozen(DEVICE_ENV)).toBe(true);
  });
});
