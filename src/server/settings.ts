/**
 * Runtime settings stored in `app_settings` (edited by admins) that override environment variables.
 * Cached in memory for 30 s; `invalidateSettingsCache()` after writes.
 */
import { eq, inArray } from "drizzle-orm";
import { getDb, schema } from "./db/client";
import type { AdminSettings } from "@/lib/serverTypes";

export const DEFAULT_MODEL = "claude-opus-5";
export const DEFAULT_RATE_LIMIT_PER_HOUR = 40;
export const DEFAULT_RATE_LIMIT_PER_DAY = 150;

export const SETTING_KEYS = ["claude_model", "ai_rate_limit_per_hour", "ai_rate_limit_per_day", "maintenance_notice"] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

const EMPTY: AdminSettings = { claude_model: null, ai_rate_limit_per_hour: null, ai_rate_limit_per_day: null, maintenance_notice: null };
const TTL_MS = 30_000;

let cache: { at: number; value: AdminSettings } | null = null;

export function invalidateSettingsCache(): void {
  cache = null;
}

export async function getRuntimeSettings(): Promise<AdminSettings> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  try {
    const db = await getDb();
    const rows = await db.select().from(schema.appSettings).where(inArray(schema.appSettings.key, [...SETTING_KEYS]));
    const value: AdminSettings = { ...EMPTY };
    for (const row of rows) {
      const v = row.value;
      if (row.key === "claude_model" && typeof v === "string" && v.trim()) value.claude_model = v.trim();
      if (row.key === "ai_rate_limit_per_hour" && typeof v === "number" && v > 0) value.ai_rate_limit_per_hour = Math.floor(v);
      if (row.key === "ai_rate_limit_per_day" && typeof v === "number" && v > 0) value.ai_rate_limit_per_day = Math.floor(v);
      if (row.key === "maintenance_notice" && typeof v === "string" && v.trim()) value.maintenance_notice = v.trim();
    }
    cache = { at: Date.now(), value };
    return value;
  } catch {
    return cache?.value ?? EMPTY;
  }
}

export async function setRuntimeSettings(patch: Partial<AdminSettings>): Promise<AdminSettings> {
  const db = await getDb();
  const now = new Date();
  for (const key of SETTING_KEYS) {
    if (!(key in patch)) continue;
    const value = patch[key] ?? null;
    if (value === null) {
      await db.delete(schema.appSettings).where(eq(schema.appSettings.key, key));
    } else {
      await db
        .insert(schema.appSettings)
        .values({ key, value, updatedAt: now })
        .onConflictDoUpdate({ target: schema.appSettings.key, set: { value, updatedAt: now } });
    }
  }
  invalidateSettingsCache();
  return getRuntimeSettings();
}

function envInt(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export async function effectiveModel(): Promise<string> {
  const s = await getRuntimeSettings();
  return s.claude_model || process.env.CLAUDE_MODEL?.trim() || DEFAULT_MODEL;
}

export async function effectiveRateLimits(): Promise<{ perHour: number; perDay: number }> {
  const s = await getRuntimeSettings();
  return {
    perHour: s.ai_rate_limit_per_hour ?? envInt("AI_RATE_LIMIT_PER_HOUR", DEFAULT_RATE_LIMIT_PER_HOUR),
    perDay: s.ai_rate_limit_per_day ?? envInt("AI_RATE_LIMIT_PER_DAY", DEFAULT_RATE_LIMIT_PER_DAY),
  };
}

export async function maintenanceNotice(): Promise<string | null> {
  return (await getRuntimeSettings()).maintenance_notice;
}
