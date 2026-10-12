import http from "node:http";
import type { AddressInfo } from "node:net";
import Anthropic from "@anthropic-ai/sdk";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAnthropicBackend } from "@/server/ai/providers/anthropic";
import { createOpenAiCompatBackend } from "@/server/ai/providers/openai";
import { ProviderError } from "@/server/ai/errors";
import type { AiRequest } from "@/server/ai/types";

interface Seen { url: string; headers: http.IncomingHttpHeaders; body: Record<string, unknown> }
type Handler = (req: Seen, res: http.ServerResponse) => void;

let server: http.Server;
let base = "";
let handler: Handler = (_r, res) => res.writeHead(500).end();
const seen: Seen[] = [];

beforeAll(async () => {
  server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const body = chunks.length ? (JSON.parse(Buffer.concat(chunks).toString()) as Record<string, unknown>) : {};
      const s = { url: req.url ?? "", headers: req.headers, body };
      seen.push(s);
      handler(s, res);
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((r) => server.close(() => r())));

const sse = (res: http.ServerResponse, text: string, stop = "end_turn", model = "claude-opus-5-5") => {
  res.writeHead(200, { "content-type": "text/event-stream" });
  const ev = (name: string, data: unknown) => res.write(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`);
  ev("message_start", { type: "message_start", message: { id: "msg_1", type: "message", role: "assistant", model, content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 11, output_tokens: 1, cache_read_input_tokens: 7 } } });
  ev("content_block_start", { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } });
  ev("content_block_delta", { type: "content_block_delta", index: 0, delta: { type: "text_delta", text } });
  ev("content_block_stop", { type: "content_block_stop", index: 0 });
  ev("message_delta", { type: "message_delta", delta: { stop_reason: stop, stop_sequence: null }, usage: { output_tokens: 42 } });
  ev("message_stop", { type: "message_stop" });
  res.end();
};
const apiError = (res: http.ServerResponse, status: number, message: string) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify({ type: "error", error: { type: status === 400 ? "invalid_request_error" : "api_error", message } }));
};

const request = (over: Partial<AiRequest> = {}): AiRequest => ({
  system: "SYSTEM RULES", messages: [{ role: "user", content: "make a game" }], maxOutputTokens: 4000, effort: "high",
  signal: new AbortController().signal, timeoutMs: 5000, ...over,
});
const anthropicBackend = (over: { refusalFallback?: boolean } = {}) =>
  createAnthropicBackend({ apiKey: "sk-ant-test-key", model: "claude-opus-5-5", refusalFallback: over.refusalFallback ?? true, client: new Anthropic({ apiKey: "sk-ant-test-key", baseURL: base, maxRetries: 0 }) });

describe("Anthropic adapter (official SDK) against a local protocol mock", () => {
  it("sends a correct, secret-safe request and parses a streamed reply", async () => {
    seen.length = 0;
    handler = (_r, res) => sse(res, '{"ok":true}');
    const out = await anthropicBackend().complete(request());
    expect(out).toMatchObject({ text: '{"ok":true}', finish: "complete", model: "claude-opus-5-5" });
    expect(out.usage).toEqual({ inputTokens: 11, outputTokens: 42, cachedInputTokens: 7 });
    const s = seen[0]!;
    expect(s.url).toMatch(/^\/v1\/messages/);
    expect(s.headers["x-api-key"]).toBe("sk-ant-test-key"); // sent as a header only, from the server process
    expect(s.body).toMatchObject({ model: "claude-opus-5-5", max_tokens: 4000, stream: true, output_config: { effort: "high" } });
    expect(s.body.system).toEqual([{ type: "text", text: "SYSTEM RULES", cache_control: { type: "ephemeral" } }]); // stable prefix is cached
    expect(s.body).not.toHaveProperty("thinking"); // current models reject disabled/budget thinking: leave the default
    expect(s.body).not.toHaveProperty("temperature");
    expect(JSON.stringify(s.body)).not.toContain("sk-ant-test-key");
    expect(s.headers["anthropic-beta"]).toContain("server-side-fallback-2026-07-01");
    expect(s.body.fallbacks).toBe("default");
  });

  it("retries once without the fallback beta if the API rejects it, then succeeds", async () => {
    seen.length = 0;
    handler = (r, res) => (r.body.fallbacks ? apiError(res, 400, "fallbacks: unknown beta") : sse(res, "{}"));
    const out = await anthropicBackend().complete(request());
    expect(out.text).toBe("{}");
    expect(seen).toHaveLength(2);
    expect(seen[1]!.body).not.toHaveProperty("fallbacks");
  });

  it("does not use the beta endpoint when the fallback is switched off", async () => {
    seen.length = 0;
    handler = (_r, res) => sse(res, "{}");
    await anthropicBackend({ refusalFallback: false }).complete(request());
    expect(seen[0]!.headers["anthropic-beta"] ?? "").not.toContain("server-side-fallback");
    expect(seen[0]!.body).not.toHaveProperty("fallbacks");
  });

  it("maps stop reasons: refusal and max_tokens", async () => {
    handler = (_r, res) => sse(res, "", "refusal");
    expect((await anthropicBackend().complete(request())).finish).toBe("refused");
    handler = (_r, res) => sse(res, '{"cut":', "max_tokens");
    expect((await anthropicBackend().complete(request())).finish).toBe("truncated");
  });

  it.each([
    [401, "PROVIDER_AUTH"], [403, "PROVIDER_AUTH"], [429, "PROVIDER_RATE_LIMITED"], [500, "PROVIDER_UNAVAILABLE"], [529, "PROVIDER_UNAVAILABLE"],
  ])("maps HTTP %i to %s without leaking the provider's message", async (status, code) => {
    handler = (_r, res) => apiError(res, status, "internal detail sk-ant-LEAK request_id=abc");
    const err = (await anthropicBackend({ refusalFallback: false }).complete(request()).catch((e) => e)) as ProviderError;
    expect(err).toBeInstanceOf(ProviderError);
    expect(err.code).toBe(code);
    expect(err.userMessage).not.toMatch(/LEAK|request_id/);
  });

  it("maps a malformed request (400) to PROVIDER_BAD_REQUEST", async () => {
    handler = (_r, res) => apiError(res, 400, "messages: bad");
    const err = (await anthropicBackend({ refusalFallback: false }).complete(request()).catch((e) => e)) as ProviderError;
    expect(err.code).toBe("PROVIDER_BAD_REQUEST");
  });

  it("times out on a hung server and honours the job-deadline abort signal", async () => {
    handler = () => undefined; // never answers
    const slow = (await anthropicBackend({ refusalFallback: false }).complete(request({ timeoutMs: 400 })).catch((e) => e)) as ProviderError;
    expect(slow.code).toBe("PROVIDER_TIMEOUT");
    const ac = new AbortController();
    setTimeout(() => ac.abort(), 300);
    const aborted = (await anthropicBackend({ refusalFallback: false }).complete(request({ signal: ac.signal, timeoutMs: 30_000 })).catch((e) => e)) as ProviderError;
    expect(aborted.code).toBe("PROVIDER_TIMEOUT");
  });
});

describe("OpenAI-compatible adapter against a local protocol mock", () => {
  const backend = (over = {}) => createOpenAiCompatBackend({ apiKey: "sk-oa-test", baseUrl: `${base}/v1/`, model: "gpt-test", ...over });
  const reply = (res: http.ServerResponse, body: unknown, status = 200) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };

  it("posts to /chat/completions with bearer auth and JSON mode, and parses the result", async () => {
    seen.length = 0;
    handler = (_r, res) => reply(res, { model: "gpt-test-2", choices: [{ message: { content: '{"a":1}' }, finish_reason: "stop" }], usage: { prompt_tokens: 5, completion_tokens: 9 } });
    const out = await backend().complete(request());
    expect(out).toMatchObject({ text: '{"a":1}', finish: "complete", model: "gpt-test-2" });
    expect(out.usage).toMatchObject({ inputTokens: 5, outputTokens: 9 });
    const s = seen[0]!;
    expect(s.url).toBe("/v1/chat/completions");
    expect(s.headers.authorization).toBe("Bearer sk-oa-test");
    expect(s.body).toMatchObject({ model: "gpt-test", max_tokens: 4000, response_format: { type: "json_object" } });
    expect((s.body.messages as { role: string }[])[0]).toEqual({ role: "system", content: "SYSTEM RULES" });
  });

  it("maps finish reasons and HTTP errors", async () => {
    handler = (_r, res) => reply(res, { choices: [{ message: { content: "{" }, finish_reason: "length" }] });
    expect((await backend().complete(request())).finish).toBe("truncated");
    handler = (_r, res) => reply(res, { choices: [{ message: { content: null, refusal: "no" }, finish_reason: "stop" }] });
    expect((await backend().complete(request())).finish).toBe("refused");
    for (const [status, code] of [[401, "PROVIDER_AUTH"], [402, "PROVIDER_UNAVAILABLE"], [429, "PROVIDER_RATE_LIMITED"], [503, "PROVIDER_UNAVAILABLE"], [400, "PROVIDER_BAD_REQUEST"]] as const) {
      handler = (_r, res) => reply(res, { error: { message: "secret sk-LEAK" } }, status);
      const err = (await backend().complete(request()).catch((e) => e)) as ProviderError;
      expect(err.code).toBe(code);
      expect(err.userMessage).not.toContain("LEAK");
    }
  });

  it("times out on a hung server", async () => {
    handler = () => undefined;
    const err = (await backend().complete(request({ timeoutMs: 300 })).catch((e) => e)) as ProviderError;
    expect(err.code).toBe("PROVIDER_TIMEOUT");
  });

  it("reports an unreachable host as unavailable", async () => {
    const err = (await backend({ baseUrl: "http://127.0.0.1:1/v1" }).complete(request()).catch((e) => e)) as ProviderError;
    expect(err.code).toBe("PROVIDER_UNAVAILABLE");
  });
});
