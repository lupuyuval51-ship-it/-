/**
 * Vendor-neutral AI interfaces. The generation pipeline only talks to these types, so swapping model vendors
 * means adding one adapter file and registering it — nothing else changes.
 */

export type ProviderKind = "ai" | "none";

export interface BackendInfo {
  /** Stable machine id stored on every game ("anthropic", "openai", "none"). */
  id: string;
  /** "ai" = produced by a language model. "none" = no AI provider is configured (topic library and study engine only). */
  kind: ProviderKind;
  label: string;
  model: string;
}

export interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiRequest {
  /** Stable instructions + schema. Providers that support prompt caching cache this part. */
  system: string;
  messages: AiMessage[];
  maxOutputTokens: number;
  /** Reasoning effort hint; adapters map it to whatever their API offers. */
  effort: "low" | "medium" | "high";
  /** Aborts the call (job deadline / per-call timeout). */
  signal: AbortSignal;
  timeoutMs: number;
}

export interface AiResponse {
  text: string;
  model: string;
  usage: { inputTokens: number; outputTokens: number; cachedInputTokens?: number };
  /** "truncated" = the model hit the output limit, so the JSON is almost certainly incomplete. */
  finish: "complete" | "truncated" | "refused";
}

/** A backend that asks a language model to write the specification. */
export interface LlmBackend {
  type: "llm";
  info: BackendInfo;
  complete(req: AiRequest): Promise<AiResponse>;
}

/** No AI provider configured: games come from the topic library or the learner's own material (study engine); no model is involved. */
export interface NoAiBackend {
  type: "none";
  info: BackendInfo;
}

/** Configured to use a real provider but the credentials are missing: generation is refused up front. */
export interface UnavailableBackend {
  type: "unavailable";
  info: BackendInfo;
  reason: string;
}

export type GenerationBackend = LlmBackend | NoAiBackend | UnavailableBackend;
