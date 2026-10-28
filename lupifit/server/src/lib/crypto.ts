import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { config } from '../config';

const scrypt = promisify(crypto.scrypt) as (
  password: crypto.BinaryLike,
  salt: crypto.BinaryLike,
  keylen: number,
  options: crypto.ScryptOptions,
) => Promise<Buffer>;

const KEY_LEN = 64;
const R = 8;
const P = 1;

/** Hash format: `scrypt$N$r$p$saltB64$hashB64` (parameters stored so cost can be raised later). */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const N = config.password.scryptN;
  const hash = await scrypt(password.normalize('NFKC'), salt, KEY_LEN, { N, r: R, p: P, maxmem: 256 * N * R });
  return ['scrypt', N, R, P, salt.toString('base64'), hash.toString('base64')].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, nStr, rStr, pStr, saltB64, hashB64] = parts as [string, string, string, string, string, string];
  const N = Number(nStr);
  const r = Number(rStr);
  const p = Number(pStr);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p) || N < 2 || N > 1 << 20) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = await scrypt(password.normalize('NFKC'), Buffer.from(saltB64, 'base64'), expected.length, { N, r, p, maxmem: 256 * N * r });
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

/** Pre-computed hash used to equalize timing when a login email does not exist. */
let dummyHash: Promise<string> | null = null;
export const getDummyHash = () => (dummyHash ??= hashPassword('dummy-password-for-timing-1'));

export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');
export const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}
