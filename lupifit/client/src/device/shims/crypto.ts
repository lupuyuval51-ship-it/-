/**
 * `node:crypto` for device mode: exactly what the server uses, on top of `@noble/hashes` (audited,
 * dependency-free) and the browser's `crypto.getRandomValues` / `crypto.randomUUID`.
 *
 * - `createHash('sha256').update(data).digest(encoding?)`: migration/content checksums, token hashes.
 * - `randomBytes(n)`: session/CSRF tokens and password salts (returns a DeviceBuffer).
 * - `randomUUID()`: request ids.
 * - `scrypt(password, salt, keylen, { N, r, p, maxmem }, callback)`: password hashes in the server's
 *   `scrypt$N$r$p$salt$hash` format, so a hash made on either side verifies on the other.
 * - `timingSafeEqual(a, b)`: constant-time comparison (throws on different lengths, like Node).
 * - `createECDH`: only reached when Web Push keys are configured, which device mode never does.
 *
 * `crypto.test.ts` proves byte-for-byte parity with Node for all of these.
 */
import { scryptAsync } from '@noble/hashes/scrypt.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { DeviceBuffer, type BufferEncoding } from '../buffer';

type BinaryLike = string | Uint8Array;

const encoder = new TextEncoder();
const toBytes = (data: BinaryLike, encoding?: BufferEncoding): Uint8Array =>
  typeof data === 'string' ? (encoding && encoding !== 'utf8' && encoding !== 'utf-8' ? DeviceBuffer.from(data, encoding) : encoder.encode(data)) : data;

function webCrypto(): Crypto {
  const c = globalThis.crypto;
  if (!c?.getRandomValues) throw new Error('crypto.getRandomValues is not available');
  return c;
}

export interface Hash {
  update(data: BinaryLike, inputEncoding?: BufferEncoding): Hash;
  digest(): DeviceBuffer;
  digest(encoding: BufferEncoding): string;
}

/** Only SHA-256 is used by the server. */
export function createHash(algorithm: string): Hash {
  if (algorithm.toLowerCase() !== 'sha256') throw new Error(`Digest method not supported in device mode: ${algorithm}`);
  const h = sha256.create();
  let done = false;
  const hash = {
    update(data: BinaryLike, inputEncoding?: BufferEncoding) {
      if (done) throw new Error('Digest already called');
      h.update(toBytes(data, inputEncoding));
      return hash;
    },
    digest(encoding?: BufferEncoding) {
      if (done) throw new Error('Digest already called');
      done = true;
      const out = DeviceBuffer.from(h.digest());
      return encoding ? out.toString(encoding) : out;
    },
  } as Hash;
  return hash;
}

/** Cryptographically secure random bytes (getRandomValues takes at most 65 536 bytes per call). */
export function randomBytes(size: number): DeviceBuffer {
  if (!Number.isInteger(size) || size < 0) throw new RangeError(`The value of "size" is out of range. Received ${size}`);
  const out = new DeviceBuffer(size);
  for (let i = 0; i < size; i += 65_536) webCrypto().getRandomValues(out.subarray(i, Math.min(size, i + 65_536)));
  return out;
}

/** RFC 4122 version 4 UUID (falls back to random bytes outside secure contexts, where randomUUID is missing). */
export function randomUUID(): string {
  const c = webCrypto();
  if (typeof c.randomUUID === 'function') return c.randomUUID();
  const b = randomBytes(16);
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const hex = b.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export interface ScryptOptions {
  N?: number;
  r?: number;
  p?: number;
  cost?: number;
  blockSize?: number;
  parallelization?: number;
  maxmem?: number;
}

type ScryptCallback = (err: Error | null, derivedKey?: DeviceBuffer) => void;

/**
 * Node's callback API (`util.promisify(crypto.scrypt)` is what lib/crypto.ts uses). Defaults match
 * Node (N=16384, r=8, p=1, maxmem 32 MiB); the derivation runs asynchronously so the worker stays responsive.
 */
export function scrypt(password: BinaryLike, salt: BinaryLike, keylen: number, options: ScryptOptions | ScryptCallback, callback?: ScryptCallback): void {
  const cb = (typeof options === 'function' ? options : callback) as ScryptCallback | undefined;
  const opts = typeof options === 'function' ? {} : (options ?? {});
  if (typeof cb !== 'function') throw new TypeError('The "callback" argument must be of type function');
  const N = opts.N ?? opts.cost ?? 16_384;
  const r = opts.r ?? opts.blockSize ?? 8;
  const p = opts.p ?? opts.parallelization ?? 1;
  const maxmem = opts.maxmem ?? 32 * 1024 * 1024;
  scryptAsync(toBytes(password), toBytes(salt), { N, r, p, dkLen: keylen, maxmem }).then(
    (key) => cb(null, DeviceBuffer.from(key)),
    (err: unknown) => cb(err instanceof Error ? err : new Error(String(err))),
  );
}

/** Constant-time equality; like Node it throws when the lengths differ (callers check the length first). */
export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) {
    throw Object.assign(new RangeError('Input buffers must have the same byte length'), { code: 'ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH' });
  }
  let diff = 0;
  for (let i = 0; i < a.byteLength; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

/** Web Push key checks only: device mode never configures VAPID keys, so this is never reached. */
export function createECDH(): never {
  throw new Error('ECDH is not available in device mode (phone notifications are not configured)');
}

const crypto = { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual, createECDH };
export default crypto;
