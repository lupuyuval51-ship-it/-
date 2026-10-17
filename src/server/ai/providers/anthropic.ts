import Anthropic from "@anthropic-ai/sdk";
import { providerError } from "../errors";
import type { AiRequest, AiResponse, LlmBackend } from "../types";

export interface AnthropicConfig {
  apiKey: string;
  model: string;
  /** Ask the API to re-run on a fallback model if the primary declines (server-side-fallback beta). */
  refusalFallback: boolean;
  /** Test seam: inject a client pointed at a mock server. */
  client?: Anthropic;
}

/**
 * Claude via the official SDK. The API key never leaves the server process.
 *
 * Notes on the request shape (current Claude API):
 *  - thinking is left at the model default (adaptive) — newer models reject `disabled`/`budget_tokens`;
 *  - reasoning depth is controlled with `output_config.effort`;
 *  - we stream and read the final message, which avoids HTTP timeouts on long outputs;
 *  - the large, stable system prompt carries `cache_control` so repeated generations reuse it.
 */
export function createAnthropicBackend(cfg: AnthropicConfig): LlmBackend {
  const client = cfg.client ?? new Anthropic({ apiKey: cfg.apiKey, maxRetries: 2 });

  async function call(req: AiRequest, withFallback: boolean) {
    const base = {
      model: cfg.model,
      max_tokens: req.maxOutputTokens,
      system: [{ type: "text" as const, text: req.system, cache_control: { type: "ephemeral" as const } }],
      messages: req.messages,
      output_config: { effort: req.effort },
    };
    const options = { timeout: req.timeoutMs, signal: req.signal };
    if (withFallback) {
      return client.beta.messages.stream({ ...base, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" }, options).finalMessage();
    }
    return client.messages.stream(base, options).finalMessage();
  }

  return {
    type: "llm",
    info: { id: "anthropic", kind: "ai", label: "Anthropic Claude", model: cfg.model },
    async complete(req: AiRequest): Promise<AiResponse> {
      try {
        let message;
        try {
          message = await call(req, cfg.refusalFallback);
        } catch (err) {
          // An account/API version that does not know the fallback beta rejects it with a 400 mentioning it:
          // retry once without it instead of failing every generation.
          if (cfg.refusalFallback && err instanceof Anthropic.BadRequestError && /fallback|beta/i.test(err.message)) {
            console.warn("[ai] refusal fallback rejected by the API; retrying without it");
            message = await call(req, false);
          } else throw err;
        }
        const blocks = message.content as { type: string; text?: string }[];
        const text = blocks.flatMap((b) => (b.type === "text" && typeof b.text === "string" ? [b.text] : [])).join("");
        const finish = message.stop_reason === "refusal" ? "refused" : message.stop_reason === "max_tokens" ? "truncated" : "complete";
        return {
          text,
          model: message.model,
          finish,
          usage: {
            inputTokens: message.usage.input_tokens,
            outputTokens: message.usage.output_tokens,
            cachedInputTokens: message.usage.cache_read_input_tokens ?? undefined,
          },
        };
      } catch (err) {
        throw mapAnthropicError(err, req.signal);
      }
    },
  };
}

function mapAnthropicError(err: unknown, signal: AbortSignal) {
  if (err instanceof Anthropic.APIUserAbortError || signal.aborted) return providerError("PROVIDER_TIMEOUT", "aborted by deadline");
  if (err instanceof Anthropic.APIConnectionTimeoutError) return providerError("PROVIDER_TIMEOUT", "request timed out");
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) return providerError("PROVIDER_AUTH", `HTTP ${err.status}`);
  if (err instanceof Anthropic.RateLimitError) return providerError("PROVIDER_RATE_LIMITED", "HTTP 429");
  if (err instanceof Anthropic.BadRequestError || err instanceof Anthropic.NotFoundError || err instanceof Anthropic.UnprocessableEntityError) {
    return providerError("PROVIDER_BAD_REQUEST", `HTTP ${err.status}: ${err.message.slice(0, 200)}`);
  }
  if (err instanceof Anthropic.APIError) return providerError("PROVIDER_UNAVAILABLE", `HTTP ${err.status ?? "?"}`);
  if (err instanceof Anthropic.APIConnectionError) return providerError("PROVIDER_UNAVAILABLE", "connection error");
  return providerError("PROVIDER_UNAVAILABLE", err instanceof Error ? err.message.slice(0, 200) : "unknown error");
}
