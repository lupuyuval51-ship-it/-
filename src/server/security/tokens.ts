import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getEnv } from "../env";

export const sha256Hex = (value: string): string => createHash("sha256").update(value).digest("hex");
export const randomToken = (bytes = 32): string => randomBytes(bytes).toString("base64url");

const b64 = (buf: Buffer | string) => Buffer.from(buf).toString("base64url");

/** Compact HMAC-signed token: base64url(json).base64url(hmac). Used for short-lived play-session grants. */
export function signToken(payload: Record<string, unknown>, ttlSec: number, now = Date.now()): string {
  const body = b64(JSON.stringify({ ...payload, exp: Math.floor(now / 1000) + ttlSec }));
  const mac = createHmac("sha256", getEnv().SESSION_SECRET).update(body).digest();
  return `${body}.${b64(mac)}`;
}

export function verifyToken<T extends Record<string, unknown>>(token: string, now = Date.now()): (T & { exp: number }) | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", getEnv().SESSION_SECRET).update(body).digest();
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T & { exp: number };
    if (typeof payload.exp !== "number" || payload.exp * 1000 < now) return null;
    return payload;
  } catch {
    return null;
  }
}
