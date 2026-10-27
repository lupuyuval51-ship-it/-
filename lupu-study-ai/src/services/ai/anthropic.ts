import { AiError, type AiMessage, type AiProvider, type AiRequest, type AiResult } from "./provider";

const DEFAULT_BASE_URL = "https://api.anthropic.com";
const API_VERSION = "2023-06-01";
const TIMEOUT_MS = 60_000;

function toApiMessages(messages: AiMessage[]) {
  return messages.map((m) => ({
    role: m.role,
    content:
      typeof m.content === "string"
        ? m.content
        : m.content.map((p) => (p.type === "text" ? { type: "text", text: p.text } : { type: "image", source: { type: "base64", media_type: p.mediaType, data: p.data } })),
  }));
}

function mapStatus(status: number): AiError {
  if (status === 401 || status === 403) return new AiError("unauthorized", "unauthorized", 502);
  if (status === 429) return new AiError("rate_limited", "rate_limited", 429);
  if (status === 529 || status === 503) return new AiError("overloaded", "overloaded", 503);
  if (status === 400 || status === 413 || status === 422) return new AiError("bad_request", "bad_request", 400);
  return new AiError("upstream", `upstream_${status}`, 502);
}

export class AnthropicProvider implements AiProvider {
  readonly name = "anthropic";
  constructor(
    private apiKey: string,
    readonly model: string,
    private baseUrl: string = DEFAULT_BASE_URL,
  ) {}

  private async call(req: AiRequest, stream: boolean): Promise<Response> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    req.signal?.addEventListener("abort", () => ctrl.abort());
    try {
      const res = await fetch(`${this.baseUrl.replace(/\/$/, "")}/v1/messages`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": this.apiKey, "anthropic-version": API_VERSION },
        body: JSON.stringify({
          model: this.model,
          max_tokens: req.maxTokens,
          temperature: req.temperature ?? 0.4,
          system: req.system,
          messages: toApiMessages(req.messages),
          stream,
        }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw mapStatus(res.status);
      return res;
    } catch (e) {
      if (e instanceof AiError) throw e;
      if (e instanceof Error && e.name === "AbortError") throw new AiError("timeout", "timeout", 504);
      throw new AiError("network", "network", 502);
    } finally {
      clearTimeout(timer);
    }
  }

  async complete(req: AiRequest): Promise<AiResult> {
    const res = await this.call(req, false);
    const json = (await res.json()) as { content?: { type: string; text?: string }[]; usage?: { input_tokens: number; output_tokens: number } };
    const text = (json.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("");
    if (!text.trim()) throw new AiError("bad_output", "empty", 502);
    return { text, usage: json.usage ? { inputTokens: json.usage.input_tokens, outputTokens: json.usage.output_tokens } : undefined };
  }

  async *stream(req: AiRequest): AsyncGenerator<string, void, void> {
    const res = await this.call(req, true);
    if (!res.body) throw new AiError("upstream", "no_body", 502);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let emitted = false;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n\n")) >= 0) {
        const block = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        const data = block.split("\n").find((l) => l.startsWith("data:"))?.slice(5).trim();
        if (!data) continue;
        try {
          const ev = JSON.parse(data) as { type: string; delta?: { type?: string; text?: string }; error?: { type?: string } };
          if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta" && ev.delta.text) {
            emitted = true;
            yield ev.delta.text;
          } else if (ev.type === "error") {
            throw new AiError(ev.error?.type === "overloaded_error" ? "overloaded" : "upstream", "stream_error", 502);
          }
        } catch (e) {
          if (e instanceof AiError) throw e;
          /* שורת SSE לא תקינה – מדלגים */
        }
      }
    }
    if (!emitted) throw new AiError("bad_output", "empty", 502);
  }
}
