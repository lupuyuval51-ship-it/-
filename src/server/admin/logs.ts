/** Paged listing of `ai_request_logs` (newest first) with action/status filters and an opaque cursor. */
import { and, desc, eq, lt, or, type SQL } from "drizzle-orm";
import { getDb, schema } from "../db/client";
import type { AdminLogRow, AdminLogsResponse } from "@/lib/serverTypes";

export const LOGS_DEFAULT_LIMIT = 50;
export const LOGS_MAX_LIMIT = 200;

interface LogCursor {
  at: string;
  id: string;
}

export function encodeLogCursor(c: LogCursor): string {
  return Buffer.from(JSON.stringify(c), "utf8").toString("base64url");
}

export function decodeLogCursor(raw: string | null): LogCursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as Partial<LogCursor>;
    if (typeof parsed.at !== "string" || typeof parsed.id !== "string" || Number.isNaN(Date.parse(parsed.at))) return null;
    return { at: parsed.at, id: parsed.id };
  } catch {
    return null;
  }
}

function toRow(r: typeof schema.aiRequestLogs.$inferSelect): AdminLogRow {
  return {
    id: r.id,
    at: r.at.toISOString(),
    action: r.action,
    userId: r.userId,
    guestHash: r.guestHash,
    status: r.status,
    latencyMs: r.latencyMs,
    inputTokens: r.inputTokens,
    outputTokens: r.outputTokens,
    model: r.model,
    errorCode: r.errorCode,
    jsonValid: r.jsonValid,
    cacheHit: r.cacheHit,
  };
}

export async function listAiLogs(opts: { limit?: number; cursor?: string | null; action?: string | null; status?: string | null }): Promise<AdminLogsResponse> {
  const db = await getDb();
  const t = schema.aiRequestLogs;
  const limit = Math.min(LOGS_MAX_LIMIT, Math.max(1, opts.limit ?? LOGS_DEFAULT_LIMIT));
  const cursor = decodeLogCursor(opts.cursor ?? null);
  const conditions: SQL[] = [];
  if (opts.action) conditions.push(eq(t.action, opts.action.slice(0, 40)));
  if (opts.status) conditions.push(eq(t.status, opts.status.slice(0, 20) as typeof schema.aiRequestLogs.$inferSelect.status));
  if (cursor) {
    const at = new Date(cursor.at);
    conditions.push(or(lt(t.at, at), and(eq(t.at, at), lt(t.id, cursor.id)))!);
  }
  const rows = await db
    .select()
    .from(t)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(t.at), desc(t.id))
    .limit(limit + 1);
  const page = rows.slice(0, limit);
  const last = page[page.length - 1];
  const nextCursor = rows.length > limit && last ? encodeLogCursor({ at: last.at.toISOString(), id: last.id }) : null;
  return { ok: true, logs: page.map(toRow), nextCursor };
}
