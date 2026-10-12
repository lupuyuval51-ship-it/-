import { providerError } from "../errors";
import type { AiRequest, AiResponse, LlmBackend } from "../types";

export interface OpenAiCompatConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  /** Test seam. */
  fetchImpl?: typeof fetch;
}

interface ChatCompletion {
  model?: string;
  choices?: { message?: { content?: string | null; refusal?: string | null }; finish_reason?: string }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; prompt_tokens_details?: { cached_tokens?: number } };
}

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
      let res: Response;
      try {
        res = await doFetch(url, {
          method: "POST",
          signal,
          headers: { "content-type": "application/json", authorization: `Bearer ${cfg.apiKey}` },
          body: JSON.stringify({
            model: cfg.model,
            max_tokens: req.maxOutputTokens,
            response_format: { type: "json_object" },
            messages: [{ role: "system", content: req.system }, ...req.messages],
          }),
        });
      } catch (err) {
        if (signal.aborted) throw providerError("PROVIDER_TIMEOUT", "aborted or timed out");
        throw providerError("PROVIDER_UNAVAILABLE", err instanceof Error ? err.message.slice(0, 160) : "network error");
      }
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) throw providerError("PROVIDER_AUTH", `HTTP ${res.status}`);
        if (res.status === 429) throw providerError("PROVIDER_RATE_LIMITED", "HTTP 429");
        // 402: the provider account is out of credit. Nothing the player can fix; logged so the owner sees it.
        if (res.status === 402) throw providerError("PROVIDER_UNAVAILABLE", "HTTP 402 (the AI provider account has no balance)");
        if (res.status >= 500) throw providerError("PROVIDER_UNAVAILABLE", `HTTP ${res.status}`);
        throw providerError("PROVIDER_BAD_REQUEST", `HTTP ${res.status}`);
      }
      let body: ChatCompletion;
      try {
        body = (await res.json()) as ChatCompletion;
      } catch {
        throw providerError("PROVIDER_UNAVAILABLE", "non-JSON response body");
      }
      const choice = body.choices?.[0];
      const refused = Boolean(choice?.message?.refusal) || choice?.finish_reason === "content_filter";
      return {
        text: choice?.message?.content ?? "",
        model: body.model ?? cfg.model,
        finish: refused ? "refused" : choice?.finish_reason === "length" ? "truncated" : "complete",
        usage: {
          inputTokens: body.usage?.prompt_tokens ?? 0,
          outputTokens: body.usage?.completion_tokens ?? 0,
          cachedInputTokens: body.usage?.prompt_tokens_details?.cached_tokens,
        },
      };
    },
  };
}
