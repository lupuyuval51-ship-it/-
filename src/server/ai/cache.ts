/**
 * Response cache for coach calls: key = sha256(action + canonical JSON of the semantic input).
 * Rows expire after AI_CACHE_TTL_HOURS (default 24). Content is a full route response, never a prompt.
 */
import { eq, lt, sql } from "drizzle-orm";
import { getDb, schema } from "../db/client";
import { canonicalJson, sha256Hex } from "../util/hash";
import type { AiAction } from "@/lib/types";

export function cacheTtlHours(): number {
  const n = Number(process.env.AI_CACHE_TTL_HOURS);
  return Number.isFinite(n) && n > 0 ? n : 24;
}

export function cacheKey(action: AiAction | string, input: unknown): string {
  return sha256Hex(`${action}\n${canonicalJson(input)}`);
}

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const db = await getDb();
    const rows = await db.select().from(schema.aiCache).where(eq(schema.aiCache.key, key)).limit(1);
    const row = rows[0];
    if (!row) return null;
    if (row.expiresAt.getTime() < Date.now()) {
      await db.delete(schema.aiCache).where(eq(schema.aiCache.key, key));
      return null;
    }
    await db.update(schema.aiCache).set({ hits: sql`${schema.aiCache.hits} + 1` }).where(eq(schema.aiCache.key, key));
    return row.response as T;
  } catch {
    return null;
  }
}

export async function setCached(key: string, action: AiAction | string, response: unknown, ttlHours = cacheTtlHours()): Promise<void> {
  try {
    const db = await getDb();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlHours * 3600_000);
    await db
      .insert(schema.aiCache)
      .values({ key, action, response: response as object, createdAt: now, expiresAt, hits: 0 })
      .onConflictDoUpdate({ target: schema.aiCache.key, set: { response: response as object, createdAt: now, expiresAt } });
    // Opportunistic cleanup (cheap, indexed on expires_at).
    if (Math.random() < 0.05) await db.delete(schema.aiCache).where(lt(schema.aiCache.expiresAt, now));
  } catch {
    /* cache is best effort */
  }
}
