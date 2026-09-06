/** One `ai_request_logs` row per coach call. Never stores prompts or responses; IP/guest ids are HMAC-hashed. */
import { getDb, schema } from "../db/client";
import type { AiRequestStatus } from "../db/schema";
import { hmacHex } from "../util/hash";
import { newId } from "@/lib/ids";
import type { AiAction } from "@/lib/types";

export interface AiLogEntry {
  action: AiAction | string;
  userId?: string | null;
  guestId?: string | null;
  ip: string;
  status: AiRequestStatus;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  model?: string | null;
  errorCode?: string | null;
  jsonValid?: boolean | null;
  cacheHit?: boolean;
}

export function hashSubject(value: string): string {
  return hmacHex(value).slice(0, 32);
}

export async function logAiRequest(entry: AiLogEntry): Promise<void> {
  try {
    const db = await getDb();
    await db.insert(schema.aiRequestLogs).values({
      id: newId("ailog"),
      at: new Date(),
      action: entry.action,
      userId: entry.userId ?? null,
      guestHash: entry.guestId ? hashSubject(entry.guestId) : null,
      ipHash: hashSubject(entry.ip),
      status: entry.status,
      latencyMs: Math.max(0, Math.round(entry.latencyMs)),
      inputTokens: entry.inputTokens ?? 0,
      outputTokens: entry.outputTokens ?? 0,
      model: entry.model ?? null,
      errorCode: entry.errorCode ? String(entry.errorCode).slice(0, 80) : null,
      jsonValid: entry.jsonValid ?? null,
      cacheHit: entry.cacheHit ?? false,
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "test") console.warn("[ai] log insert failed:", err instanceof Error ? err.message : err);
  }
}
