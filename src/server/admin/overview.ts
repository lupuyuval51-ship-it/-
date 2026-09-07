/**
 * Admin overview: coach-call statistics per window (24h / 7d / 30d) computed from `ai_request_logs`
 * (no content is stored there), most replaced drills from completed_sessions.data.replacements,
 * and user counts. Aggregation happens in JS over a bounded row set so it runs the same on PGlite and Postgres.
 */
import { and, count, desc, gt, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "../db/client";
import { claudeConfigured, claudeModel } from "../ai/claude";
import type { AdminActionStats, AdminOverviewResponse, AdminOverviewWindow } from "@/lib/serverTypes";

const WINDOWS: { window: AdminOverviewWindow["window"]; ms: number }[] = [
  { window: "24h", ms: 24 * 3600_000 },
  { window: "7d", ms: 7 * 24 * 3600_000 },
  { window: "30d", ms: 30 * 24 * 3600_000 },
];
const MAX_LOG_ROWS = 50_000;
const MAX_SESSION_ROWS = 5_000;

type LogRow = typeof schema.aiRequestLogs.$inferSelect;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

function round(n: number): number {
  return Math.round(n);
}

function summarize(rows: LogRow[]): Omit<AdminOverviewWindow, "window" | "actions" | "errorCodes"> & { errorCodes: { code: string; count: number }[] } {
  const byStatus: Record<string, number> = {};
  const latencies: number[] = [];
  let jsonInvalid = 0;
  let cacheHits = 0;
  const errorCounts = new Map<string, number>();
  for (const r of rows) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    latencies.push(r.latencyMs);
    if (r.jsonValid === false) jsonInvalid += 1;
    if (r.cacheHit) cacheHits += 1;
    if (r.errorCode) errorCounts.set(r.errorCode, (errorCounts.get(r.errorCode) ?? 0) + 1);
  }
  latencies.sort((a, b) => a - b);
  const calls = rows.length;
  return {
    calls,
    byStatus,
    avgLatencyMs: calls ? round(latencies.reduce((a, b) => a + b, 0) / calls) : 0,
    p95LatencyMs: percentile(latencies, 95),
    jsonInvalid,
    cacheHitRate: calls ? Math.round((cacheHits / calls) * 1000) / 1000 : 0,
    errorCodes: [...errorCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([code, n]) => ({ code, count: n })),
  };
}

function perAction(rows: LogRow[]): AdminActionStats[] {
  const groups = new Map<string, LogRow[]>();
  for (const r of rows) {
    const list = groups.get(r.action) ?? [];
    list.push(r);
    groups.set(r.action, list);
  }
  return [...groups.entries()]
    .map(([action, list]) => {
      const s = summarize(list);
      return {
        action,
        calls: s.calls,
        byStatus: s.byStatus,
        avgLatencyMs: s.avgLatencyMs,
        p95LatencyMs: s.p95LatencyMs,
        inputTokens: list.reduce((a, r) => a + r.inputTokens, 0),
        outputTokens: list.reduce((a, r) => a + r.outputTokens, 0),
        cacheHitRate: s.cacheHitRate,
        jsonInvalid: s.jsonInvalid,
      };
    })
    .sort((a, b) => b.calls - a.calls);
}

interface ReplacementLike {
  fromExerciseId?: unknown;
  fromName?: { he?: unknown; en?: unknown };
}

export async function mostReplacedExercises(since: Date, limit = 10): Promise<AdminOverviewResponse["mostReplacedExercises"]> {
  const db = await getDb();
  const t = schema.completedSessions;
  const rows = await db
    .select({ data: t.data })
    .from(t)
    .where(and(gt(t.updatedAt, since), isNull(t.deletedAt), sql`jsonb_array_length(coalesce(${t.data}->'replacements', '[]'::jsonb)) > 0`))
    .orderBy(desc(t.updatedAt))
    .limit(MAX_SESSION_ROWS);
  const counts = new Map<string, { name: string; count: number }>();
  for (const row of rows) {
    const data = row.data as { replacements?: unknown } | null;
    const list = Array.isArray(data?.replacements) ? (data!.replacements as ReplacementLike[]) : [];
    for (const rep of list) {
      const id = typeof rep?.fromExerciseId === "string" && rep.fromExerciseId ? rep.fromExerciseId : null;
      const name = typeof rep?.fromName?.he === "string" && rep.fromName.he ? rep.fromName.he : typeof rep?.fromName?.en === "string" ? rep.fromName.en : "";
      const key = id ?? (name ? `name:${name}` : null);
      if (!key) continue;
      const cur = counts.get(key) ?? { name: name || key, count: 0 };
      cur.count += 1;
      counts.set(key, cur);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([key, v]) => ({ exerciseId: key.startsWith("name:") ? "" : key, name: v.name, count: v.count }));
}

export async function buildAdminOverview(): Promise<AdminOverviewResponse> {
  const db = await getDb();
  const now = Date.now();
  const longest = WINDOWS[WINDOWS.length - 1];
  const since30 = new Date(now - longest.ms);
  const rows = await db.select().from(schema.aiRequestLogs).where(gt(schema.aiRequestLogs.at, since30)).orderBy(desc(schema.aiRequestLogs.at)).limit(MAX_LOG_ROWS);

  const windows: AdminOverviewWindow[] = WINDOWS.map(({ window, ms }) => {
    const from = now - ms;
    const inWindow = rows.filter((r) => r.at.getTime() > from);
    const s = summarize(inWindow);
    return { window, ...s, actions: perAction(inWindow) };
  });

  const since7 = new Date(now - 7 * 24 * 3600_000);
  const [{ value: usersTotal }] = await db.select({ value: count() }).from(schema.users).where(isNull(schema.users.deletedAt));
  const [{ value: activeBySessions }] = await db
    .select({ value: sql<number>`count(distinct ${schema.completedSessions.userId})` })
    .from(schema.completedSessions)
    .where(gt(schema.completedSessions.updatedAt, since7));
  const [{ value: activeByLogin }] = await db.select({ value: count() }).from(schema.users).where(and(isNull(schema.users.deletedAt), gt(schema.users.lastLoginAt, since7)));

  return {
    ok: true,
    windows,
    mostReplacedExercises: await mostReplacedExercises(since30),
    activeUsers7d: Math.max(Number(activeBySessions ?? 0), Number(activeByLogin ?? 0)),
    usersTotal: Number(usersTotal ?? 0),
    claudeConfigured: claudeConfigured(),
    model: await claudeModel(),
    generatedAt: new Date(now).toISOString(),
  };
}
