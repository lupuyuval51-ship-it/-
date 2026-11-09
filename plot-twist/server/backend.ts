/**
 * The model backend: a narrow interface the AI Director depends on, plus the
 * Anthropic SDK implementation. Tests substitute a fake backend.
 */
import Anthropic from '@anthropic-ai/sdk';
import type { Effort, ServerConfig } from './config.ts';

export interface StreamRequest {
  system: string;
  user: string;
  schema: Record<string, unknown>;
  effort: Effort;
}

export interface StreamHooks {
  /** Called for every text delta with the accumulated text so far. */
  onText?: (delta: string, snapshot: string) => void;
  /** Called while the model is thinking (before visible output). */
  onThinking?: () => void;
}

export interface StreamResult {
  text: string;
  stopReason: string | null;
  model: string;
}

export interface Backend {
  readonly provider: 'anthropic';
  readonly model: string;
  stream(req: StreamRequest, hooks: StreamHooks, signal: AbortSignal): Promise<StreamResult>;
  /** Cheap credential + model check (no tokens). Throws on failure. */
  verify(signal?: AbortSignal): Promise<void>;
}

/** Models that accept server-side refusal fallbacks with `fallbacks: "default"`. */
const SERVER_FALLBACK_MODELS = new Set(['claude-opus-5-5', 'claude-opus-5', 'claude-fable-5-1', 'claude-sonnet-5-5']);

export function createAnthropicBackend(config: ServerConfig): Backend {
  if (!config.apiKey) throw new Error('createAnthropicBackend requires an API key');
  registerSecret(config.apiKey);
  // apiKey is passed explicitly so no other ambient credential source is ever used.
  const client = new Anthropic({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    timeout: config.timeoutMs,
    maxRetries: config.maxRetries,
  });
  const useFallbacks = SERVER_FALLBACK_MODELS.has(config.model);

  return {
    provider: 'anthropic',
    model: config.model,

    async stream(req, hooks, signal) {
      const stream = client.beta.messages.stream(
        {
          model: config.model,
          // Streaming, so a generous ceiling: thinking + a ~3–5k token episode fit comfortably.
          max_tokens: 32_000,
          // Thinking is omitted on purpose: current models run adaptive thinking by default.
          output_config: { effort: req.effort, format: { type: 'json_schema', schema: req.schema } },
          system: [{ type: 'text', text: req.system, cache_control: { type: 'ephemeral' } }],
          messages: [{ role: 'user', content: req.user }],
          ...(useFallbacks ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
        },
        // No SDK retries while the user waits: a retry restarts the whole wait and can double it.
        // The caller's signal bounds the attempt, the response stream included (the SDK's own
        // timeout only covers the wait for response headers).
        { signal, maxRetries: 0 },
      );
      stream.on('text', (delta, snapshot) => hooks.onText?.(delta, snapshot));
      stream.on('thinking', () => hooks.onThinking?.());
      const message = await stream.finalMessage();
      let text = '';
      for (const block of message.content) {
        if (block.type === 'text') text += block.text;
      }
      return { text, stopReason: message.stop_reason, model: message.model };
    },

    async verify(signal) {
      await client.models.retrieve(config.model, {}, { signal, timeout: 8_000, maxRetries: 0 });
    },
  };
}

// ── error classification ─────────────────────────────────────────────

export type FailureKind =
  | 'aborted'
  | 'timeout'
  | 'network'
  | 'auth'
  | 'forbidden'
  | 'model_unavailable'
  | 'rate_limited'
  | 'overloaded'
  | 'server'
  | 'bad_request'
  | 'refused'
  | 'truncated'
  | 'invalid_output'
  | 'unknown';

export interface ClassifiedError {
  kind: FailureKind;
  /** Safe for logs (secrets redacted). */
  message: string;
  retryable: boolean;
}

// ── secret redaction ─────────────────────────────────────────────────

const SECRETS = new Set<string>();

/** Remembers a credential so `redactSecrets` removes it from anything we log or classify. */
export function registerSecret(secret: string | null | undefined): void {
  if (secret && secret.length >= 8) SECRETS.add(secret);
}

/** Token characters for the patterns below: anything up to a quote, space, newline or separator. */
const TOKEN = String.raw`[^"'\x60\n ,;()<>]`;
const SECRET_PATTERNS: RegExp[] = [
  new RegExp(String.raw`\bBearer\s+${TOKEN}+`, 'gi'),
  new RegExp(String.raw`\bsk-ant-${TOKEN}*`, 'gi'),
  new RegExp(String.raw`\b(x-api-key["']?\s*[:=]\s*["']?)${TOKEN}+`, 'gi'),
];

/** Removes `Bearer …` tokens, `sk-ant-…` keys and every registered credential from text. */
export function redactSecrets(text: string): string {
  let out = text;
  for (const secret of SECRETS) out = out.split(secret).join('[redacted]');
  out = out.replace(SECRET_PATTERNS[0], 'Bearer [redacted]');
  out = out.replace(SECRET_PATTERNS[1], '[redacted]');
  out = out.replace(SECRET_PATTERNS[2], '$1[redacted]');
  return out;
}

const safe = (message: string) => redactSecrets(message).slice(0, 200);

/** Maps SDK errors to stable failure kinds, most specific first. Messages are always redacted. */
export function classifyError(err: unknown): ClassifiedError {
  if (err instanceof Anthropic.APIUserAbortError) return { kind: 'aborted', message: 'request aborted', retryable: true };
  if (err instanceof Anthropic.APIConnectionTimeoutError) return { kind: 'timeout', message: 'request timed out', retryable: true };
  if (err instanceof Anthropic.APIConnectionError) return { kind: 'network', message: 'could not reach the AI provider', retryable: true };
  if (err instanceof Anthropic.AuthenticationError) return { kind: 'auth', message: 'API key was rejected', retryable: false };
  if (err instanceof Anthropic.PermissionDeniedError) return { kind: 'forbidden', message: 'API key lacks permission for this model', retryable: false };
  if (err instanceof Anthropic.NotFoundError) return { kind: 'model_unavailable', message: 'model not found', retryable: false };
  if (err instanceof Anthropic.RateLimitError) return { kind: 'rate_limited', message: 'provider rate limit reached', retryable: true };
  if (err instanceof Anthropic.BadRequestError) return { kind: 'bad_request', message: safe(`provider rejected the request: ${err.message}`), retryable: false };
  if (err instanceof Anthropic.APIError) {
    if (err.status === 529 || err.type === 'overloaded_error') return { kind: 'overloaded', message: 'provider is overloaded', retryable: true };
    if (typeof err.status === 'number' && err.status >= 500) return { kind: 'server', message: `provider error ${err.status}`, retryable: true };
    return { kind: 'unknown', message: `provider error ${err.status ?? ''}`.trim(), retryable: false };
  }
  if (err instanceof Error && err.name === 'TimeoutError') return { kind: 'timeout', message: 'request timed out', retryable: true };
  if (err instanceof Error && err.name === 'AbortError') return { kind: 'aborted', message: 'request aborted', retryable: true };
  return { kind: 'unknown', message: err instanceof Error ? safe(err.message) : 'unknown error', retryable: false };
}
