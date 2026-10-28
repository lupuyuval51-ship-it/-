import { AiError, type AiMessage, type AiProvider, type AiRequest, type AiResult } from "./provider";

const TIMEOUT_MS = 90_000;

function toApiMessages(system: string, messages: AiMessage[], vision: boolean) {
  const out: { role: string; content: unknown }[] = [{ role: "system", content: system }];
  for (const m of messages) {
    if (typeof m.content === "string") {
      out.push({ role: m.role, content: m.content });
      continue;
    }
    const hasImage = m.content.some((p) => p.type === "image");
    if (hasImage && !vision) throw new AiError("unsupported", "unsupported", 400);
    out.push({
      role: m.role,
      content: m.content.map((p) => (p.type === "text" ? { type: "text", text: p.text } : { type: "image_url", image_url: { url: `data:${p.mediaType};base64,${p.data}` } })),
    });
  }
  return out;
}

function mapStatus(status: number, body: string): AiError {
  if (status === 401 || status === 403) return new AiError("unauthorized", "unauthorized", 502);
  // מכסת שימוש חינמי שנגמרה מדווחת לעיתים כ-4xx/429
  if (status === 429 || /limit/i.test(body)) return new AiError("rate_limited", "rate_limited", 429);
  if (status === 503 || status === 529) return new AiError("overloaded", "overloaded", 503);
  if (status === 400 || status === 413 || status === 422) return new AiError("bad_request", "bad_request", 400);
  return new AiError("upstream", `upstream_${status}`, 502);
}

/**
 * ספק תואם OpenAI (/chat/completions): מתאים ל-OpenCode Zen (למשל big-pickle), OpenRouter, Ollama, vLLM ועוד.
 * תמונות נתמכות רק אם הוגדר vision=true (תלוי במודל).
 */
export class OpenAiCompatibleProvider implements AiProvider {
  readonly name = "openai-compatible";
  constructor(
    private baseUrl: string,
    readonly model: string,
    private apiKey: string | undefined,
    readonly vision: boolean,
  ) {}

  private async call(req: AiRequest, stream: boolean): Promise<Response> {
    const body = JSON.stringify({
      model: this.model, stream, max_tokens: req.maxTokens, temperature: req.temperature ?? 0.4,
      messages: toApiMessages(req.system, req.messages, this.vision),
    });
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    req.signal?.addEventListener("abort", () => ctrl.abort());
    try {
      const res = await fetch(`${this.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json", ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}) },
        body, signal: ctrl.signal,
      });
      if (!res.ok) throw mapStatus(res.status, await res.text().catch(() => ""));
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
    const json = (await res.json()) as { error?: { message?: string }; choices?: { message?: { content?: string } }[]; usage?: { prompt_tokens: number; completion_tokens: number } };
    if (json.error) throw mapStatus(429, json.error.message ?? "");
    const text = json.choices?.[0]?.message?.content ?? "";
    if (!text.trim()) throw new AiError("bad_output", "empty", 502);
    return { text, usage: json.usage ? { inputTokens: json.usage.prompt_tokens, outputTokens: json.usage.completion_tokens } : undefined };
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
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") continue;
        try {
          const ev = JSON.parse(data) as { error?: { message?: string }; choices?: { delta?: { content?: string } }[] };
          if (ev.error) throw mapStatus(429, ev.error.message ?? "");
          const piece = ev.choices?.[0]?.delta?.content;
          if (piece) {
            emitted = true;
            yield piece;
          }
        } catch (e) {
          if (e instanceof AiError) throw e;
        }
      }
    }
    if (!emitted) throw new AiError("bad_output", "empty", 502);
  }
}
