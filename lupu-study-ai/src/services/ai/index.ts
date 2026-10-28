import { AnthropicProvider } from "./anthropic";
import { OpenAiCompatibleProvider } from "./openai-compatible";
import type { AiProvider } from "./provider";

export const DEFAULT_MODEL = "claude-sonnet-5-5";
export const ZEN_BASE_URL = "https://opencode.ai/zen/v1";

/**
 * בחירת ספק לפי AI_PROVIDER:
 *  - anthropic (ברירת מחדל): דורש ANTHROPIC_API_KEY.
 *  - openai: כל שירות תואם OpenAI. AI_BASE_URL, AI_MODEL (למשל big-pickle ב-OpenCode Zen), AI_API_KEY (אופציונלי), AI_VISION=true אם המודל תומך בתמונות.
 * בלי הגדרה מתאימה מוחזר null, וכל פיצ'ר AI מדווח "לא מחובר" (אין תשובות מדומות).
 */
export function getProvider(): AiProvider | null {
  if (process.env.AI_PROVIDER?.trim() === "openai") {
    const model = process.env.AI_MODEL?.trim();
    if (!model) return null;
    return new OpenAiCompatibleProvider(
      process.env.AI_BASE_URL?.trim() || ZEN_BASE_URL,
      model,
      process.env.AI_API_KEY?.trim() || undefined,
      process.env.AI_VISION?.trim() === "true",
    );
  }
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;
  return new AnthropicProvider(key, process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL, process.env.ANTHROPIC_BASE_URL?.trim() || undefined);
}

export function maxOutputTokens(): number {
  const n = Number(process.env.AI_MAX_OUTPUT_TOKENS);
  return Number.isFinite(n) && n >= 200 ? Math.min(n, 8000) : 1800;
}
