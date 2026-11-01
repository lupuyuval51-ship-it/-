/**
 * Web-standard crypto only (`globalThis.crypto.subtle`), so identical code runs in Node 22 and in a browser Worker.
 * Password format: pbkdf2_sha256$<iterations>$<saltHex>$<hashHex>
 */
export const PBKDF2_ITERATIONS = 600_000;
const enc = new TextEncoder();

const toHex = (b: Uint8Array): string => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
export function fromHex(h: string): Uint8Array {
  if (h.length % 2 !== 0 || /[^0-9a-f]/i.test(h)) throw new Error('bad_hex');
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function randomHex(bytes: number): string { return toHex(globalThis.crypto.getRandomValues(new Uint8Array(bytes))); }
export function randomId(): string { return globalThis.crypto.randomUUID(); }

export async function sha256Hex(text: string): Promise<string> {
  return toHex(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', enc.encode(text))));
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await globalThis.crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await globalThis.crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations }, key, 256));
}

/** Fixed-length XOR accumulator: runtime does not depend on where the first differing byte is. */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  const n = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < n; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

export async function hashPassword(password: string, iterations = PBKDF2_ITERATIONS): Promise<string> {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2_sha256$${iterations}$${toHex(salt)}$${toHex(await pbkdf2(password, salt, iterations))}`;
}

export interface VerifyResult { ok: boolean; needsRehash: boolean }

export async function verifyPassword(password: string, stored: string, targetIterations = PBKDF2_ITERATIONS): Promise<VerifyResult> {
  const [alg, itStr, saltHex, hashHex] = stored.split('$');
  const iterations = Number(itStr);
  if (alg !== 'pbkdf2_sha256' || !Number.isInteger(iterations) || iterations < 1 || !saltHex || !hashHex) return { ok: false, needsRehash: false };
  let salt: Uint8Array; let expected: Uint8Array;
  try { salt = fromHex(saltHex); expected = fromHex(hashHex); } catch { return { ok: false, needsRehash: false }; }
  const actual = await pbkdf2(password, salt, iterations);
  const ok = constantTimeEqual(actual, expected);
  return { ok, needsRehash: ok && iterations < targetIterations };
}

/** A hash computed once per process and used to burn the same CPU time for unknown usernames (no user enumeration). */
let dummy: Promise<string> | undefined;
export function dummyHash(iterations = PBKDF2_ITERATIONS): Promise<string> { return (dummy ??= hashPassword('lupu-fit-dummy-password', iterations)); }
