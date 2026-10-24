import { providerError } from "../errors";
import type { AiRequest, AiResponse, LlmBackend } from "../types";

export interface OpenAiCompatConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  /** Test seam. */
  fetchImpl?: typeof fetch;
}

type ContentPart = { type?: string; text?: unknown };

interface ChatCompletion {
  model?: string;
  /** Usually a string; some compatible servers send a list of parts (text and reasoning). */
  choices?: { message?: { content?: string | ContentPart[] | null; refusal?: string | null }; finish_reason?: string }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; prompt_tokens_details?: { cached_tokens?: number } };
  /** Gateways that answer HTTP 200 with an error instead of a completion. */
  error?: { message?: unknown };
}

/** The provider's own error message, for the logs only (never shown to a player). Always consumes the body. */
async function errorDetail(res: Response): Promise<string> {
  const raw = await res.text().catch(() => "");
  try {
    const message = (JSON.parse(raw) as { error?: { message?: unknown } } | null)?.error?.message;
    if (typeof message === "string") return message.slice(0, 200);
  } catch {
    /* not JSON: fall through */
  }
  return raw.slice(0, 200);
}

const textOf = (content: string | ContentPart[] | null | undefined): string =>
  typeof content === "string" ? content
  : Array.isArray(content) ? content.map((p) => (p?.type === "text" && typeof p.text === "string" ? p.text : "")).join("")
  : "";

/**
 * Any OpenAI-compatible Chat Completions endpoint (OpenAI, Azure OpenAI gateways, vLLM, Ollama, OpenRouter, ...).
 * Uses JSON mode and plain fetch so it adds no dependency. Schema validation happens in our pipeline, not here.
 */
export function createOpenAiCompatBackend(cfg: OpenAiCompatConfig): LlmBackend {
  const doFetch = cfg.fetchImpl ?? fetch;
  const url = `${cfg.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  return {
    type: "llm",
    info: { id: "openai", kind: "ai", label: "OpenAI-compatible", model: cfg.model },
    async complete(req: AiRequest): Promise<AiResponse> {
      const signal = AbortSignal.any([req.signal, AbortSignal.timeout(req.timeoutMs)]);
      const send = async (limit: "max_tokens" | "max_completion_tokens"): Promise<Response> => {
        try {
          return await doFetch(url, {
            method: "POST",
            signal,
            headers: { "content-type": "application/json", authorization: `Bearer ${cfg.apiKey}` },
            body: JSON.stringify({
              model: cfg.model,
              [limit]: req.maxOutputTokens,
              response_format: { type: "json_object" },
              messages: [{ role: "system", content: req.system }, ...req.messages],
            }),
          });
        } catch (err) {
          if (signal.aborted) throw providerError("PROVIDER_TIMEOUT", "aborted or timed out");
          throw providerError("PROVIDER_UNAVAILABLE", err instanceof Error ? err.message.slice(0, 160) : "network error");
        }
      };
      let res = await send("max_tokens");
      if (res.status === 400) {
        const detail = await errorDetail(res);
        // OpenAI's reasoning models refuse `max_tokens` and name its successor: ask once more with that, as told.
        if (!/max_completion_tokens/i.test(detail)) throw providerError("PROVIDER_BAD_REQUEST", `HTTP 400: ${detail}`);
        console.warn("[ai] the model wants max_completion_tokens; retrying with it");
        res = await send("max_completion_tokens");
      }
      if (!res.ok) {
        // 400 / 404 / 422 carry the reason (unknown model, unsupported parameter): logged so the owner can fix the setting.
        const detail = await errorDetail(res);
        if (res.status === 401 || res.status === 403) throw providerError("PROVIDER_AUTH", `HTTP ${res.status}`);
        if (res.status === 429) throw providerError("PROVIDER_RATE_LIMITED", "HTTP 429");
        // 402: the provider account is out of credit. Nothing the player can fix; logged so the owner sees it.
        if (res.status === 402) throw providerError("PROVIDER_UNAVAILABLE", "HTTP 402 (the AI provider account has no balance)");
        if (res.status === 408) throw providerError("PROVIDER_TIMEOUT", "HTTP 408");
        if (res.status >= 500) throw providerError("PROVIDER_UNAVAILABLE", `HTTP ${res.status}`);
        throw providerError("PROVIDER_BAD_REQUEST", `HTTP ${res.status}: ${detail}`);
      }
      let body: ChatCompletion;
      try {
        body = (await res.json()) as ChatCompletion;
      } catch {
        // the deadline can fall while the body is still arriving: that is a timeout, not a broken reply
        if (signal.aborted) throw providerError("PROVIDER_TIMEOUT", "aborted or timed out while reading the reply");
        throw providerError("PROVIDER_UNAVAILABLE", "non-JSON response body");
      }
      const choice = body?.choices?.[0];
      // No completion at all (an error relayed with HTTP 200): a provider failure, not a reply to repair.
      if (!choice) throw providerError("PROVIDER_UNAVAILABLE", `no completion in the reply${typeof body?.error?.message === "string" ? `: ${body.error.message.slice(0, 160)}` : ""}`);
      const refused = Boolean(choice.message?.refusal) || choice.finish_reason === "content_filter";
      return {
        text: textOf(choice.message?.content),
        model: typeof body.model === "string" && body.model ? body.model : cfg.model,
        finish: refused ? "refused" : choice.finish_reason === "length" ? "truncated" : "complete",
        usage: {
          inputTokens: body.usage?.prompt_tokens ?? 0,
          outputTokens: body.usage?.completion_tokens ?? 0,
          cachedInputTokens: body.usage?.prompt_tokens_details?.cached_tokens,
        },
      };
    },
  };
}
