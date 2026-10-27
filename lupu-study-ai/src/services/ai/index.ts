import { AnthropicProvider } from "./anthropic";
import type { AiProvider } from "./provider";

export const DEFAULT_MODEL = "claude-sonnet-5-5";

/** מחזיר את ספק ה-AI הפעיל, או null כשלא הוגדר מפתח (אז כל פיצ'ר AI מדווח "לא זמין" ולא מתחזה) */
export function getProvider(): AiProvider | null {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;
  return new AnthropicProvider(key, process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL, process.env.ANTHROPIC_BASE_URL?.trim() || undefined);
}

export function maxOutputTokens(): number {
  const n = Number(process.env.AI_MAX_OUTPUT_TOKENS);
  return Number.isFinite(n) && n >= 200 ? Math.min(n, 8000) : 1800;
}
