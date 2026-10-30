/** The device crypto shim must produce exactly what node:crypto produces for the server's uses. */
import nodeCrypto from 'node:crypto';
import { promisify as nodePromisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { DeviceBuffer } from '../buffer';
import crypto, { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from './crypto';
import { promisify } from './util';

const INPUTS: (string | Uint8Array)[] = [
  '',
  'a',
  'session-token-base64url_-',
  'שלום 💪',
  'x'.repeat(10_000),
  new Uint8Array([0, 1, 2, 255]),
  new Uint8Array(0),
  nodeCrypto.randomBytes(1000),
];

describe('createHash (sha256)', () => {
  it('matches Node for every encoding and input', () => {
    for (const input of INPUTS) {
      for (const enc of ['hex', 'base64', 'base64url'] as const) {
        expect(createHash('sha256').update(input).digest(enc)).toBe(nodeCrypto.createHash('sha256').update(input).digest(enc));
      }
      expect(Array.from(createHash('sha256').update(input).digest())).toEqual(Array.from(nodeCrypto.createHash('sha256').update(input).digest()));
    }
  });

  it('hashes incremental updates and input encodings like Node', () => {
    const a = createHash('sha256').update('part one, ').update(new Uint8Array([1, 2])).update('ff00', 'hex').digest('hex');
    const b = nodeCrypto.createHash('sha256').update('part one, ').update(new Uint8Array([1, 2])).update('ff00', 'hex').digest('hex');
    expect(a).toBe(b);
  });

  it('matches the server checksum formula for JSON content (seed.ts contentHash)', () => {
    const content = JSON.stringify([{ id: 'squat', name: { en: 'Squat', he: 'סקוואט' } }, [1.5, null]]);
    expect(createHash('sha256').update(content).digest('hex')).toBe(nodeCrypto.createHash('sha256').update(content).digest('hex'));
  });

  it('refuses other algorithms and a second digest', () => {
    expect(() => createHash('md5')).toThrow(/not supported/);
    const h = createHash('sha256').update('x');
    h.digest('hex');
    expect(() => h.digest('hex')).toThrow(/Digest already called/);
  });
});

describe('scrypt', () => {
  const scryptShim = promisify<Uint8Array>(scrypt as never);
  const scryptNode = nodePromisify(nodeCrypto.scrypt) as (pw: string | Uint8Array, salt: Uint8Array, len: number, o: nodeCrypto.ScryptOptions) => Promise<Buffer>;

  it('derives the same key as Node with the server parameters (N=1024 and N=16384, r=8, p=1, 64 bytes)', async () => {
    for (const N of [1024, 16_384]) {
      const salt = nodeCrypto.randomBytes(16);
      const password = 'Passw0rd! שלום'.normalize('NFKC');
      const opts = { N, r: 8, p: 1, maxmem: 256 * N * 8 };
      const [mine, theirs] = await Promise.all([scryptShim(password, salt, 64, opts), scryptNode(password, salt, 64, opts)]);
      expect(DeviceBuffer.from(mine).toString('base64')).toBe(theirs.toString('base64'));
    }
  });

  it('accepts a callback without options (Node defaults N=16384, r=8, p=1)', async () => {
    const salt = nodeCrypto.randomBytes(8);
    const mine = await new Promise<DeviceBuffer>((resolve, reject) => scrypt('pw', salt, 32, (err, key) => (err ? reject(err) : resolve(key!))));
    expect(mine.toString('hex')).toBe(nodeCrypto.scryptSync('pw', salt, 32).toString('hex'));
  });

  it('works through Node’s own util.promisify too (as lib/crypto.ts uses it)', async () => {
    const salt = nodeCrypto.randomBytes(16);
    const viaNodePromisify = nodePromisify(scrypt as never) as (...args: unknown[]) => Promise<DeviceBuffer>;
    const key = await viaNodePromisify('abc123xyz', salt, 64, { N: 1024, r: 8, p: 1, maxmem: 256 * 1024 * 8 });
    expect(key.toString('base64')).toBe(nodeCrypto.scryptSync('abc123xyz', salt, 64, { N: 1024, r: 8, p: 1 }).toString('base64'));
  });

  it('reports invalid parameters through the callback', async () => {
    await expect(scryptShim('pw', new Uint8Array(16), 64, { N: 1000, r: 8, p: 1 })).rejects.toThrow();
  });
});

describe('randomBytes / randomUUID / timingSafeEqual', () => {
  it('returns DeviceBuffers of the requested length with the encodings tokens use', () => {
    for (const n of [0, 1, 16, 24, 32, 65_536, 65_537, 200_000]) {
      const b = randomBytes(n);
      expect(b).toBeInstanceOf(DeviceBuffer);
      expect(b.length).toBe(n);
      expect(b.toString('base64url')).toBe(Buffer.from(b).toString('base64url'));
      expect(b.toString('hex')).toBe(Buffer.from(b).toString('hex'));
      expect(b.toString('base64')).toBe(Buffer.from(b).toString('base64'));
    }
    // randomToken(32) / randomToken(24) lengths as base64url, like Node.
    expect(randomBytes(32).toString('base64url')).toHaveLength(nodeCrypto.randomBytes(32).toString('base64url').length);
    expect(randomBytes(24).toString('base64url')).toHaveLength(32);
    expect(randomBytes(32).equals(randomBytes(32))).toBe(false);
    expect(() => randomBytes(-1)).toThrow(RangeError);
  });

  it('makes RFC 4122 v4 UUIDs, also without crypto.randomUUID (insecure contexts)', () => {
    const v4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    expect(randomUUID()).toMatch(v4);
    // Hide the prototype method with an own property, as in a context without randomUUID.
    Object.defineProperty(globalThis.crypto, 'randomUUID', { value: undefined, configurable: true, writable: true });
    try {
      expect(globalThis.crypto.randomUUID).toBeUndefined();
      const ids = new Set(Array.from({ length: 200 }, () => randomUUID()));
      expect(ids.size).toBe(200);
      for (const id of ids) expect(id).toMatch(v4);
    } finally {
      delete (globalThis.crypto as { randomUUID?: unknown }).randomUUID;
    }
    expect(typeof globalThis.crypto.randomUUID).toBe('function');
  });

  it('compares like Node’s timingSafeEqual, including the length error', () => {
    const a = DeviceBuffer.from('csrf-token-value');
    expect(timingSafeEqual(a, DeviceBuffer.from('csrf-token-value'))).toBe(nodeCrypto.timingSafeEqual(Buffer.from(a), Buffer.from('csrf-token-value')));
    expect(timingSafeEqual(a, DeviceBuffer.from('csrf-token-valuX'))).toBe(false);
    let nodeErr: unknown;
    try {
      nodeCrypto.timingSafeEqual(Buffer.from('a'), Buffer.from('ab'));
    } catch (e) {
      nodeErr = e;
    }
    expect(() => timingSafeEqual(DeviceBuffer.from('a'), DeviceBuffer.from('ab'))).toThrow(RangeError);
    try {
      timingSafeEqual(DeviceBuffer.from('a'), DeviceBuffer.from('ab'));
    } catch (e) {
      expect((e as { code: string }).code).toBe((nodeErr as { code: string }).code);
    }
  });

  it('exposes the default export the server imports', () => {
    expect(Object.keys(crypto).sort()).toEqual(['createECDH', 'createHash', 'randomBytes', 'randomUUID', 'scrypt', 'timingSafeEqual']);
    expect(() => crypto.createECDH()).toThrow(/not available in device mode/);
  });
});
