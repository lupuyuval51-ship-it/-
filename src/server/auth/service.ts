/**
 * Account operations used by /api/auth/*: register, login, delete, export.
 *
 * Admin role: granted at registration when the email is listed in ADMIN_EMAILS (comma-separated).
 * First-run rule: when ADMIN_EMAILS is empty and the users table is empty, the very first account
 * becomes admin so a fresh deployment always has one administrator.
 */
import { count, eq, isNull, and } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../db/client";
import { HttpError } from "../http";
import { newId } from "@/lib/ids";
import { hashPassword, verifyPassword } from "./password";
import { createSession, purgeExpiredSessions, toPublicUser } from "./session";
import type { ExportResponse, PublicUser } from "@/lib/serverTypes";
import type { SyncRecord } from "@/lib/types";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(254)
  .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), { message: "invalid_email" });

export const passwordSchema = z.string().min(8, "weak_password").max(200);

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().max(60).optional(),
});

export const loginSchema = z.object({ email: emailSchema, password: passwordSchema.or(z.string().min(1).max(200)) });

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

async function shouldBeAdmin(email: string): Promise<boolean> {
  const admins = adminEmails();
  if (admins.includes(email)) return true;
  if (admins.length > 0) return false;
  const db = await getDb();
  const [{ value }] = await db.select({ value: count() }).from(schema.users);
  return Number(value) === 0;
}

export async function registerUser(input: z.infer<typeof registerSchema>, userAgent?: string | null): Promise<{ user: PublicUser; token: string; expiresAt: Date }> {
  const db = await getDb();
  const email = input.email;
  const existing = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (existing.length > 0) throw new HttpError(409, "email_taken");
  const role = (await shouldBeAdmin(email)) ? "admin" : "user";
  const now = new Date();
  const row = {
    id: newId("usr"),
    email,
    passwordHash: await hashPassword(input.password),
    name: input.name?.trim() ? input.name.trim() : null,
    role,
    createdAt: now,
    lastLoginAt: now,
    deletedAt: null,
  } as const;
  try {
    await db.insert(schema.users).values(row);
  } catch (err) {
    // Unique violation from a concurrent registration.
    if (String((err as { code?: string })?.code) === "23505" || /unique/i.test(String((err as Error)?.message))) throw new HttpError(409, "email_taken");
    throw err;
  }
  const session = await createSession(row.id, userAgent);
  return { user: toPublicUser({ ...row }), ...session };
}

export async function loginUser(input: z.infer<typeof loginSchema>, userAgent?: string | null): Promise<{ user: PublicUser; token: string; expiresAt: Date }> {
  const db = await getDb();
  const rows = await db.select().from(schema.users).where(and(eq(schema.users.email, input.email), isNull(schema.users.deletedAt))).limit(1);
  const row = rows[0];
  // Always run a hash comparison so timing does not reveal whether the email exists.
  const ok = row ? await verifyPassword(input.password, row.passwordHash) : await verifyPassword(input.password, "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AA==").then(() => false);
  if (!row || !ok) throw new HttpError(401, "invalid_credentials");
  const now = new Date();
  await db.update(schema.users).set({ lastLoginAt: now }).where(eq(schema.users.id, row.id));
  void purgeExpiredSessions();
  const session = await createSession(row.id, userAgent);
  return { user: toPublicUser({ ...row, lastLoginAt: now }), ...session };
}

/** Hard-deletes every row owned by the user, then the user itself. */
export async function deleteAccount(userId: string): Promise<void> {
  const db = await getDb();
  for (const table of schema.USER_OWNED_TABLES) {
    await db.delete(table).where(eq(table.userId, userId));
  }
  await db.delete(schema.users).where(eq(schema.users.id, userId));
}

function toSyncRecord(collection: string, row: { id?: string; updatedAt: Date; deletedAt: Date | null; data: unknown }, fixedId?: string): SyncRecord {
  return {
    collection: collection as SyncRecord["collection"],
    id: fixedId ?? row.id ?? "",
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    data: row.data,
  };
}

/** Everything stored for the user, as JSON (GDPR-style export). */
export async function exportUserData(user: PublicUser): Promise<ExportResponse> {
  const db = await getDb();
  const collections: Record<string, SyncRecord[]> = {};
  let profile: unknown = null;
  let settings: unknown = null;
  let activeSession: unknown = null;
  for (const [name, entry] of Object.entries(schema.COLLECTION_TABLES)) {
    if (entry.kind === "singleton") {
      const rows = await db.select().from(entry.table).where(eq(entry.table.userId, user.id)).limit(1);
      const row = rows[0];
      if (!row) continue;
      if (name === "profile") profile = row.data;
      else if (name === "settings") settings = row.data;
      else if (name === "activeSession") activeSession = row.data;
      else collections[name] = [toSyncRecord(name, row, entry.fixedId)];
    } else {
      const table = entry.table as typeof schema.workouts;
      const rows = await db.select().from(table).where(eq(table.userId, user.id));
      collections[name] = rows.map((r) => toSyncRecord(name, r));
    }
  }
  return { ok: true, exportedAt: new Date().toISOString(), user, profile, settings, activeSession, collections };
}

/** Utility for admin: emails masked as a***@b.com */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const head = local.slice(0, 1);
  const dot = domain.lastIndexOf(".");
  const domainHead = domain.slice(0, 1);
  const tld = dot >= 0 ? domain.slice(dot) : "";
  return `${head}***@${domainHead}***${tld}`;
}

export async function listUsersForAdmin(): Promise<{ count: number; rows: (typeof schema.users.$inferSelect)[] }> {
  const db = await getDb();
  const [{ value }] = await db.select({ value: count() }).from(schema.users).where(isNull(schema.users.deletedAt));
  const rows = await db.select().from(schema.users).where(isNull(schema.users.deletedAt)).orderBy(schema.users.createdAt).limit(500);
  return { count: Number(value), rows };
}

