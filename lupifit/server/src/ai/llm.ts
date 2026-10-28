/**
 * Server-side LLM adapter (Anthropic Claude via the official SDK). The API key lives
 * only in server config. Every caller gets typed results or an `LlmError` with a
 * stable `kind`, so features can degrade gracefully (built-in coach, manual entry).
 *
 * Defaults: model `claude-opus-5-5` (AI_MODEL), adaptive thinking (model default),
 * explicit `output_config.effort`, and server-side refusal fallbacks
 * (`fallbacks: "default"`, beta `server-side-fallback-2026-07-01`) unless disabled
 * with AI_REFUSAL_FALLBACK=false.
 */
import Anthropic from '@anthropic-ai/sdk';
import type { ZodTypeAny, z } from 'zod';
import { aiConfigured, config } from '../config';

export type LlmErrorKind =
  | 'not_configured'
  | 'auth'
  | 'rate_limited'
  | 'timeout'
  | 'unavailable'
  | 'invalid_request'
  | 'refused'
  | 'bad_response';

export class LlmError extends Error {
  constructor(
    public readonly kind: LlmErrorKind,
    message: string,
    public readonly retryAfterSeconds: number | null = null,
  ) {
    super(message);
    this.name = 'LlmError';
  }
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface LlmUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  /** True when the server-side refusal fallback served the response. */
  usedFallback: boolean;
}

export interface LlmTextResult extends LlmUsage {
  text: string;
}

export interface LlmJsonResult<T> extends LlmUsage {
  data: T;
}

export type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp';

export interface ImageInput {
  base64: string;
  mediaType: ImageMediaType;
}

const FALLBACK_BETA = 'server-side-fallback-2026-07-01';

let client: Anthropic | null = null;

export function isLlmConfigured(): boolean {
  return aiConfigured();
}

export function llmModel(): string | null {
  return aiConfigured() ? config.ai.model : null;
}

/** Drops the cached client (used by tests after changing config.ai). */
export function resetLlmClient() {
  client = null;
}

function getClient(): Anthropic {
  if (!aiConfigured()) throw new LlmError('not_configured', 'No AI provider is configured (set AI_API_KEY)');
  client ??= new Anthropic({
    apiKey: config.ai.apiKey,
    authToken: null,
    baseURL: config.ai.baseUrl,
    timeout: config.ai.timeoutMs,
    maxRetries: config.ai.maxRetries,
  });
  return client;
}

function mapError(err: unknown): LlmError {
  if (err instanceof LlmError) return err;
  if (err instanceof Anthropic.APIConnectionTimeoutError) return new LlmError('timeout', 'The AI provider timed out');
  if (err instanceof Anthropic.APIConnectionError) return new LlmError('unavailable', 'Could not reach the AI provider');
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    return new LlmError('auth', 'The AI provider rejected the configured credentials');
  }
  if (err instanceof Anthropic.RateLimitError) {
    const ra = Number(err.headers?.get?.('retry-after'));
    return new LlmError('rate_limited', 'The AI provider is rate limiting requests', Number.isFinite(ra) ? ra : null);
  }
  if (err instanceof Anthropic.BadRequestError || err instanceof Anthropic.NotFoundError || err instanceof Anthropic.UnprocessableEntityError) {
    return new LlmError('invalid_request', `The AI provider rejected the request: ${err.message}`);
  }
  if (err instanceof Anthropic.APIError) return new LlmError('unavailable', `AI provider error (${err.status ?? 'unknown'})`);
  return new LlmError('unavailable', (err as Error)?.message ?? 'Unknown AI error');
}

type Content = Anthropic.Beta.Messages.BetaContentBlockParam;

function toParams(messages: ChatTurn[], image?: ImageInput): Anthropic.Beta.Messages.BetaMessageParam[] {
  // Merge consecutive same-role turns and ensure the conversation starts with a user turn.
  const merged: { role: 'user' | 'assistant'; content: string }[] = [];
  for (const m of messages) {
    const text = m.content.trim();
    if (!text) continue;
    const last = merged.at(-1);
    if (last && last.role === m.role) last.content += `\n\n${text}`;
    else merged.push({ role: m.role, content: text });
  }
  while (merged[0]?.role === 'assistant') merged.shift();
  if (!merged.length) throw new LlmError('invalid_request', 'No user message to send');
  const params: Anthropic.Beta.Messages.BetaMessageParam[] = merged.map((m) => ({ role: m.role, content: m.content }));
  if (image) {
    const lastUser = [...params].reverse().find((p) => p.role === 'user')!;
    const blocks: Content[] = [
      { type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.base64 } },
      { type: 'text', text: String(lastUser.content) },
    ];
    lastUser.content = blocks;
  }
  return params;
}

async function create(opts: {
  system: string;
  messages: ChatTurn[];
  image?: ImageInput;
  maxTokens: number;
  jsonSchema?: Record<string, unknown>;
}): Promise<{ text: string } & LlmUsage> {
  const c = getClient();
  try {
    const body: Anthropic.Beta.Messages.MessageCreateParamsNonStreaming = {
      model: config.ai.model,
      max_tokens: opts.maxTokens,
      system: opts.system,
      messages: toParams(opts.messages, opts.image),
      output_config: {
        effort: config.ai.effort,
        ...(opts.jsonSchema ? { format: { type: 'json_schema' as const, schema: opts.jsonSchema } } : {}),
      },
      ...(config.ai.refusalFallback ? { betas: [FALLBACK_BETA], fallbacks: 'default' as const } : {}),
    };
    const response = await c.beta.messages.create(body);
    if (response.stop_reason === 'refusal') throw new LlmError('refused', 'The model declined this request');
    const text = response.content
      .filter((b): b is Anthropic.Beta.Messages.BetaTextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();
    if (!text) throw new LlmError('bad_response', 'The model returned an empty response');
    if (response.stop_reason === 'max_tokens' && opts.jsonSchema) throw new LlmError('bad_response', 'The model response was truncated');
    const usedFallback = response.content.some((b) => (b as { type: string }).type === 'fallback');
    return {
      text,
      model: response.model,
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
      usedFallback,
    };
  } catch (err) {
    throw mapError(err);
  }
}

/** Free-form text completion (coach chat). */
export async function generateText(opts: { system: string; messages: ChatTurn[]; maxTokens?: number }): Promise<LlmTextResult> {
  return create({ system: opts.system, messages: opts.messages, maxTokens: opts.maxTokens ?? 16000 });
}

/**
 * Structured JSON output constrained by `jsonSchema` (output_config.format) and then
 * validated again with `validator` — model output is never trusted unvalidated.
 */
export async function generateJson<S extends ZodTypeAny>(opts: {
  system: string;
  messages: ChatTurn[];
  jsonSchema: Record<string, unknown>;
  validator: S;
  image?: ImageInput;
  maxTokens?: number;
}): Promise<LlmJsonResult<z.output<S>>> {
  const res = await create({ ...opts, maxTokens: opts.maxTokens ?? 16000 });
  let parsed: unknown;
  try {
    parsed = JSON.parse(res.text);
  } catch {
    throw new LlmError('bad_response', 'The model did not return valid JSON');
  }
  const result = opts.validator.safeParse(parsed);
  if (!result.success) throw new LlmError('bad_response', 'The model output failed validation');
  const { text: _text, ...usage } = res;
  return { ...usage, data: result.data };
}
