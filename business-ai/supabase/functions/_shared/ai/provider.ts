/**
 * Provider-neutral interface of the AI layer. Feature code depends only on this interface; the
 * Anthropic implementation lives in ./anthropic.ts and tests can substitute their own.
 */
import type { UsageTotals } from './pricing.ts';
import type { JsonSchema } from './json-schema.ts';

/** Reasoning depth. 'medium' for plan/roadmap work, 'low' for chat and marketing copy. */
export type Effort = 'low' | 'medium' | 'high';

/**
 * System prompt in two parts: `stable` is byte-identical across requests (prompt-cached) and must
 * come first; `task` carries the per-feature / per-locale instructions.
 */
export interface SystemPrompt {
  stable: string;
  task: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CompletionRequest {
  system: SystemPrompt;
  messages: ChatMessage[];
  /** Structured output schema (output_config.format). */
  jsonSchema: JsonSchema;
  effort: Effort;
  maxTokens: number;
  signal?: AbortSignal;
}

export interface CompletionResult {
  /** Concatenated text blocks (the JSON document for structured output). */
  text: string;
  usage: UsageTotals;
  /** Model that produced the final answer (differs from the requested model after a fallback). */
  model: string;
}

export interface ToolSpec {
  name: string;
  description: string;
  /** Strict JSON Schema (additionalProperties false, every property required). */
  inputSchema: JsonSchema;
}

export interface ToolCall {
  name: string;
  input: unknown;
}

export interface ChatStreamRequest {
  system: SystemPrompt;
  messages: ChatMessage[];
  tools: ToolSpec[];
  effort: Effort;
  maxTokens: number;
  signal?: AbortSignal;
  /** Called for every text delta, in order. */
  onText: (delta: string) => void;
}

export interface ChatStreamResult {
  text: string;
  toolCalls: ToolCall[];
  usage: UsageTotals;
  model: string;
  stopReason: string | null;
}

/**
 * Implementations throw `AiCallError` (with the usage consumed so far) for refusals, truncated
 * output and provider failures, mapped to the public error codes.
 */
export interface AiProvider {
  /** Requested model id (recorded on usage reservations and plan versions). */
  readonly model: string;
  complete(req: CompletionRequest): Promise<CompletionResult>;
  streamChat(req: ChatStreamRequest): Promise<ChatStreamResult>;
}
