/** Admin user listing: counts and masked emails only (a***@b***.com) – never full addresses. */
import { count, isNull } from "drizzle-orm";
import { getDb, schema } from "../db/client";
import { listUsersForAdmin, maskEmail } from "../auth/service";
import type { AdminUsersResponse } from "@/lib/serverTypes";

export async function listUsersWithSessionCounts(): Promise<AdminUsersResponse> {
  const db = await getDb();
  const { count: total, rows } = await listUsersForAdmin();
  const t = schema.completedSessions;
  const counts = await db.select({ userId: t.userId, n: count() }).from(t).where(isNull(t.deletedAt)).groupBy(t.userId);
  const byUser = new Map(counts.map((c) => [c.userId, Number(c.n)]));
  return {
    ok: true,
    count: total,
    users: rows.map((u) => ({
      id: u.id,
      emailMasked: maskEmail(u.email),
      role: u.role,
      createdAt: u.createdAt.toISOString(),
      lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
      sessionsCount: byUser.get(u.id) ?? 0,
    })),
  };
}
