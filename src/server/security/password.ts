import "server-only";
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";

// scrypt (memory-hard, built into Node: no native dependency). Parameters are embedded in each hash so they
// can be raised later without invalidating existing passwords.
const N = 2 ** 15;
const R = 8;
const P = 1;
const KEYLEN = 64;
const MAXMEM = 128 * 1024 * 1024;

function derive(password: string, salt: Buffer, n: number, r: number, p: number, keylen: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password.normalize("NFKC"), salt, keylen, { N: n, r, p, maxmem: MAXMEM }, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, N, R, P, KEYLEN);
  return ["scrypt", N, R, P, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, keyB64] = parts as [string, string, string, string, string, string];
  const expected = Buffer.from(keyB64, "base64");
  const actual = await derive(password, Buffer.from(saltB64, "base64"), Number(n), Number(r), Number(p), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

let dummyHash: Promise<string> | null = null;
/** Burn the same CPU time for unknown accounts so login timing does not reveal which emails exist. */
export async function verifyAgainstDummy(password: string): Promise<void> {
  dummyHash ??= hashPassword("dummy-password-for-timing-equalisation");
  await verifyPassword(password, await dummyHash);
}

/** Stored instead of a hash for accounts that sign in only through a provider (Google). `verifyPassword` can never match it. */
export const NO_PASSWORD_HASH = "!";
export const hasUsablePassword = (stored: string): boolean => stored.startsWith("scrypt$");
