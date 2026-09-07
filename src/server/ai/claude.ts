/**
 * Anthropic client factory + model/effort/token settings.
 * The key only lives on the server; `getClaudeClient()` returns null when it is not configured.
 */
import Anthropic from "@anthropic-ai/sdk";
import { effectiveModel } from "../settings";

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";
const EFFORTS: Effort[] = ["low", "medium", "high", "xhigh", "max"];

export const DEFAULT_MAX_OUTPUT_TOKENS = 6000;
export const CHAT_MAX_OUTPUT_TOKENS = 1200;
export const DEFAULT_REQUEST_TIMEOUT_MS = 90_000;

function envInt(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export function claudeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export function requestTimeoutMs(): number {
  return envInt("AI_REQUEST_TIMEOUT_MS", DEFAULT_REQUEST_TIMEOUT_MS);
}

export function claudeEffort(): Effort {
  const raw = (process.env.CLAUDE_EFFORT ?? "medium").trim().toLowerCase() as Effort;
  return EFFORTS.includes(raw) ? raw : "medium";
}

export function claudeMaxTokens(kind: "default" | "chat" = "default"): number {
  const cap = envInt("CLAUDE_MAX_OUTPUT_TOKENS", DEFAULT_MAX_OUTPUT_TOKENS);
  return kind === "chat" ? Math.min(CHAT_MAX_OUTPUT_TOKENS, cap) : cap;
}

/** Resolved model: app_settings "claude_model" → CLAUDE_MODEL → "claude-opus-5". */
export async function claudeModel(): Promise<string> {
  return effectiveModel();
}

let cached: { key: string; timeout: number; client: Anthropic } | null = null;

export function getClaudeClient(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;
  const timeout = requestTimeoutMs();
  if (cached && cached.key === key && cached.timeout === timeout) return cached.client;
  const client = new Anthropic({ apiKey: key, timeout, maxRetries: 1 });
  cached = { key, timeout, client };
  return client;
}
