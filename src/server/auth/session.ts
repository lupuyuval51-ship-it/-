/**
 * Session tokens: 32 random bytes in the cookie, sha256 hash in `auth_sessions`, 30-day expiry.
 * Cookie "dc_session": HttpOnly, SameSite=Lax, Secure in production, Path=/.
 */
import { and, eq, gt, lt } from "drizzle-orm";
import { getDb, schema } from "../db/client";
import { randomToken, sha256Hex } from "../util/hash";
import { HttpError, readCookie } from "../http";
import { newId } from "@/lib/ids";
import type { PublicUser } from "@/lib/serverTypes";

export const SESSION_COOKIE = "dc_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface SessionUser extends PublicUser {
  sessionId: string;
}

export function hashToken(token: string): string {
  return sha256Hex(token);
}

export async function createSession(userId: string, userAgent?: string | null): Promise<{ token: string; expiresAt: Date }> {
  const db = await getDb();
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(schema.authSessions).values({
    id: newId("sess"),
    userId,
    tokenHash: hashToken(token),
    expiresAt,
    userAgent: userAgent ? userAgent.slice(0, 300) : null,
  });
  return { token, expiresAt };
}

export function sessionCookie(token: string, expiresAt: Date): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; Expires=${expiresAt.toUTCString()}${secure}`;
}

export function clearSessionCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}`;
}

export function toPublicUser(row: typeof schema.users.$inferSelect): PublicUser {
  return { id: row.id, email: row.email, name: row.name ?? null, role: row.role, createdAt: row.createdAt.toISOString() };
}

/** Resolves the account behind the request cookie, or null for guests / expired sessions. */
export async function getSessionUser(req: Request): Promise<SessionUser | null> {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token || token.length < 16 || token.length > 200) return null;
  const db = await getDb();
  const now = new Date();
  const rows = await db
    .select({ session: schema.authSessions, user: schema.users })
    .from(schema.authSessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.authSessions.userId))
    .where(and(eq(schema.authSessions.tokenHash, hashToken(token)), gt(schema.authSessions.expiresAt, now)))
    .limit(1);
  const row = rows[0];
  if (!row || row.user.deletedAt) return null;
  return { ...toPublicUser(row.user), sessionId: row.session.id };
}

export async function requireUser(req: Request): Promise<SessionUser> {
  const user = await getSessionUser(req);
  if (!user) throw new HttpError(401, "unauthorized");
  return user;
}

export async function requireAdmin(req: Request): Promise<SessionUser> {
  const user = await requireUser(req);
  if (user.role !== "admin") throw new HttpError(403, "forbidden");
  return user;
}

/** Deletes the session named by the cookie (logout). */
export async function revokeSession(req: Request): Promise<void> {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token) return;
  const db = await getDb();
  await db.delete(schema.authSessions).where(eq(schema.authSessions.tokenHash, hashToken(token)));
}

/** Removes expired sessions (called opportunistically from login). */
export async function purgeExpiredSessions(): Promise<void> {
  try {
    const db = await getDb();
    await db.delete(schema.authSessions).where(lt(schema.authSessions.expiresAt, new Date()));
  } catch {
    /* best effort */
  }
}
