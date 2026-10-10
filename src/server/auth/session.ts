import "server-only";
import type { GraphicsTier } from "@/config/plans";
import { SESSION_COOKIE, SESSION_DAYS } from "@/config/limits";
import { db } from "../db";
import { secureCookies } from "../env";
import { randomToken, sha256Hex } from "../security/tokens";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  locale: "he" | "en";
  country: string | null;
  graphicsPreference: GraphicsTier;
  soundEnabled: boolean;
  musicEnabled: boolean;
}

export async function createSession(userId: string, userAgent?: string | null, now = new Date()): Promise<{ token: string; expiresAt: Date }> {
  const token = randomToken(32);
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * 86_400_000);
  await db.session.create({
    data: { userId, tokenHash: sha256Hex(token), expiresAt, userAgent: userAgent?.slice(0, 250) ?? null },
  });
  return { token, expiresAt };
}

/** Resolve a raw cookie token to a user. Only the SHA-256 of the token is ever stored or compared. */
export async function getUserBySessionToken(token: string | undefined | null, now = new Date()): Promise<AuthUser | null> {
  if (!token || token.length < 20 || token.length > 200) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: sha256Hex(token) },
    include: { user: { include: { profile: true } } },
  });
  if (!session || session.expiresAt <= now || !session.user.profile) return null;
  const { user } = session;
  const p = user.profile!;
  // Throttled "last used" bookkeeping (at most once per 10 minutes) to avoid a write on every request.
  if (now.getTime() - session.lastUsedAt.getTime() > 10 * 60_000) {
    void db.session.update({ where: { id: session.id }, data: { lastUsedAt: now } }).catch(() => undefined);
  }
  return {
    id: user.id,
    email: user.email,
    displayName: p.displayName,
    locale: p.locale === "en" ? "en" : "he",
    country: p.country,
    graphicsPreference: p.graphicsPreference,
    soundEnabled: p.soundEnabled,
    musicEnabled: p.musicEnabled,
  };
}

export async function destroySession(token: string | undefined | null): Promise<void> {
  if (!token) return;
  await db.session.deleteMany({ where: { tokenHash: sha256Hex(token) } });
}

export async function destroyOtherSessions(userId: string, keepToken: string | undefined | null): Promise<number> {
  const keep = keepToken ? sha256Hex(keepToken) : undefined;
  const { count } = await db.session.deleteMany({ where: { userId, ...(keep ? { tokenHash: { not: keep } } : {}) } });
  return count;
}

export function sessionCookie(token: string, expiresAt: Date) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: secureCookies(),
    path: "/",
    expires: expiresAt,
  };
}

export function clearedSessionCookie() {
  return { name: SESSION_COOKIE, value: "", httpOnly: true, sameSite: "lax" as const, secure: secureCookies(), path: "/", maxAge: 0 };
}

export function readCookie(header: string | null | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      try {
        return decodeURIComponent(part.slice(idx + 1).trim());
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}
