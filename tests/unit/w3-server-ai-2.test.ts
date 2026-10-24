import http from "node:http";
import type { AddressInfo } from "node:net";
import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it, vi } from "vitest";
import { buildDemoSpec } from "../support/samples";
import { displayNameSchema, registerSchema } from "@/lib/schemas/auth";
import { generationRequestSchema } from "@/lib/schemas/generation";
import { ProviderError } from "@/server/ai/errors";
import { backendFromEnv, createEdgeDeps, DEFAULT_DAILY_LIMIT, handleGenerate, limitFrom, setting, tierFrom, type EdgeDeps, type Slot } from "@/server/ai/edge/generate-game";
import { createAnthropicBackend } from "@/server/ai/providers/anthropic";
import { createOpenAiCompatBackend } from "@/server/ai/providers/openai";
import type { AiRequest, LlmBackend } from "@/server/ai/types";
import { request } from "./helpers";

const USER = "11111111-2222-4333-8444-555555555555";

/** A model that always answers with the same valid game and remembers what it was asked. */
function model(reply: object): LlmBackend & { calls: AiRequest[] } {
  const calls: AiRequest[] = [];
  return {
    type: "llm", calls,
    info: { id: "openai", kind: "ai", label: "test", model: "test-model" },
    async complete(req) {
      calls.push(req);
      return { text: JSON.stringify(reply), model: "test-model", finish: "complete", usage: { inputTokens: 1, outputTokens: 1 } };
    },
  };
}

function deps(over: Partial<EdgeDeps> = {}): EdgeDeps & { finished: [string, boolean][]; limits: number[] } {
  const finished: [string, boolean][] = [];
  const limits: number[] = [];
  return {
    env: () => undefined,
    verifyUser: async (a) => (a === "Bearer good" ? USER : null),
    reserve: async (_u, limit): Promise<Slot> => { limits.push(limit); return { ok: true, id: "slot-1" }; },
    finish: async (id, ok) => { finished.push([id, ok]); },
    backend: () => model(buildDemoSpec(request({ mode: "FAST" })).raw),
    now: () => 1_800_000_000_000,
    ...over,
    finished, limits,
  };
}

const post = (body: unknown) =>
  new Request("https://example.test/functions/v1/generate-game", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "capacitor://localhost", Authorization: "Bearer good" },
    body: JSON.stringify(body),
  });
const codeOf = async (res: Response) => ((await res.json()) as { error?: { code: string } }).error?.code;

describe("edge function: settings saved blank or with stray spaces", () => {
  it("a blank or padded AI_DAILY_LIMIT is the default or the number, never 0", async () => {
    expect(limitFrom("")).toBe(DEFAULT_DAILY_LIMIT); // Number("") is 0: every learner was refused
    expect(limitFrom("   ")).toBe(DEFAULT_DAILY_LIMIT);
    expect(limitFrom(" 12 ")).toBe(12);
    expect(limitFrom("0")).toBe(0); // an explicit 0 still switches the daily games off
    const d = deps({ env: (n) => (n === "AI_DAILY_LIMIT" ? "" : undefined) });
    await handleGenerate(post(request({ mode: "FAST" })), d);
    expect(d.limits).toEqual([DEFAULT_DAILY_LIMIT]);
  });

  it("a feature tier is read case-insensitively and anything else is A", () => {
    expect(tierFrom(" b ")).toBe("B");
    expect(tierFrom("c")).toBe("C");
    expect(tierFrom("")).toBe("A");
    expect(tierFrom("Z")).toBe("A");
    expect(setting(() => " \n", "X")).toBeUndefined();
    expect(setting(() => " k \n", "X")).toBe("k");
  });

  it("AI_PROVIDER=none switches LEVEL UP AI off even with a key, as on the website", () => {
    const env = (vars: Record<string, string>) => (n: string) => vars[n];
    expect(backendFromEnv(env({ AI_PROVIDER: "none", ANTHROPIC_API_KEY: "a", OPENAI_API_KEY: "k" }))).toBeNull();
    expect(backendFromEnv(env({ AI_PROVIDER: " Anthropic ", ANTHROPIC_API_KEY: "a", OPENAI_API_KEY: "k" }))?.info.id).toBe("anthropic");
    expect(backendFromEnv(env({ ANTHROPIC_API_KEY: "  ", OPENAI_API_KEY: "k" }))?.info.id).toBe("openai"); // a blank key is no key
    expect(backendFromEnv(env({ ANTHROPIC_API_KEY: "a", ANTHROPIC_MODEL: "" }))?.info.model).toBe("claude-opus-5-5");
  });

  it("a blank base URL and model fall back to the defaults (an empty URL was not even a URL)", async () => {
    const seen: { url: string; auth: string | null }[] = [];
    const fake = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      seen.push({ url: String(url), auth: new Headers(init?.headers).get("authorization") });
      return new Response(JSON.stringify({ choices: [{ message: { content: "{}" }, finish_reason: "stop" }] }), { status: 200 });
    });
    const backend = backendFromEnv((n) => ({ OPENAI_API_KEY: "sk-test\n", OPENAI_BASE_URL: "", OPENAI_MODEL: " " })[n], fake as unknown as typeof fetch)!;
    expect(backend.info.model).toBe("gpt-4.1");
    await backend.complete({ system: "s", messages: [{ role: "user", content: "u" }], maxOutputTokens: 10, effort: "low", signal: new AbortController().signal, timeoutMs: 5000 });
    expect(seen[0]).toEqual({ url: "https://api.openai.com/v1/chat/completions", auth: "Bearer sk-test" });
  });
});

describe("edge function: the request's level and device", () => {
  it("a level the mode or game type is not part of is refused before anything is reserved", async () => {
    const d = deps();
    const res = await handleGenerate(post(request({ mode: "FULL", level: "C" })), d);
    expect(res.status).toBe(403);
    expect(await codeOf(res)).toBe("FEATURE_TIER_LOCKED");
    expect(d.limits).toEqual([]);
  });

  it("the level can make the game leaner than the server tier but never fuller", async () => {
    const lean = model(buildDemoSpec(request({ mode: "FAST", gameType: "exploration" })).raw);
    const res = await handleGenerate(post(request({ mode: "FAST", gameType: "exploration", level: "C" })), deps({ backend: () => lean }));
    expect(res.status).toBe(200);
    expect(lean.calls[0]!.messages[0]!.content).toContain("FEATURE TIER C");

    const capped = model(buildDemoSpec(request({ mode: "FAST" })).raw);
    await handleGenerate(post(request({ mode: "FAST", level: "A" })), deps({ env: (n) => (n === "AI_FEATURE_TIER" ? "B" : undefined), backend: () => capped }));
    expect(capped.calls[0]!.messages[0]!.content).toContain("FEATURE TIER B");
  });

  it("the model is always told the game is for a phone", async () => {
    const m = model(buildDemoSpec(request({ mode: "FAST" })).raw);
    await handleGenerate(post(request({ mode: "FAST", device: "desktop" })), deps({ backend: () => m }));
    expect(m.calls[0]!.messages[0]!.content).toContain("Device: a PHONE");
  });
});

describe("edge function: time and the services it depends on", () => {
  it("the deadline runs from the request's arrival, so a slow sign-in check is not given another 135 s", async () => {
    let clock = 1_800_000_000_000;
    const d = deps({
      now: () => clock,
      verifyUser: async () => { clock += 134_000; return USER; },
    });
    const res = await handleGenerate(post(request({ mode: "FAST" })), d);
    expect(res.status).toBe(504);
    expect(await codeOf(res)).toBe("TIMEOUT");
    expect(d.finished).toEqual([["slot-1", false]]); // nothing used
  });

  it("an auth service that cannot answer is 'try later', not 'sign in again'", async () => {
    const d = deps({ verifyUser: async () => { throw new Error("HTTP 503"); } });
    const res = await handleGenerate(post(request({ mode: "FAST" })), d);
    expect(res.status).toBe(503);
    expect(await codeOf(res)).toBe("AI_UNAVAILABLE");
    expect(d.limits).toEqual([]);

    const status = (s: number) => createEdgeDeps(() => undefined, (async () => new Response("{}", { status: s })) as unknown as typeof fetch).verifyUser("Bearer x");
    await expect(status(503)).rejects.toThrow();
    await expect(status(429)).rejects.toThrow();
    expect(await status(401)).toBeNull();
    expect(await status(403)).toBeNull();
  });

  it("every call to the app's Auth and to this project's database carries a timeout", async () => {
    const signals: (AbortSignal | null | undefined)[] = [];
    const fake = async (url: string | URL | Request, init?: RequestInit) => {
      signals.push(init?.signal);
      return new Response(String(url).endsWith("/auth/v1/user") ? JSON.stringify({ id: USER }) : JSON.stringify({ id: "slot-2" }), { status: 200 });
    };
    const real = createEdgeDeps((n) => ({ SUPABASE_URL: "https://ai.test", SUPABASE_SERVICE_ROLE_KEY: "service" })[n], fake as unknown as typeof fetch);
    await real.verifyUser("Bearer t");
    await real.reserve(USER, 5);
    await real.finish("slot-2", true);
    expect(signals).toHaveLength(3);
    for (const s of signals) expect(s).toBeInstanceOf(AbortSignal);
  });
});

const aiRequest = (over: Partial<AiRequest> = {}): AiRequest => ({
  system: "SYSTEM", messages: [{ role: "user", content: "make a game" }], maxOutputTokens: 4000, effort: "medium",
  signal: new AbortController().signal, timeoutMs: 5000, ...over,
});
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("OpenAI-compatible adapter: replies that are not a plain completion", () => {
  const backend = (fetchImpl: typeof fetch) => createOpenAiCompatBackend({ apiKey: "sk-oa", baseUrl: "https://llm.test/v1", model: "gpt-x", fetchImpl });

  it("retries once with max_completion_tokens when the model refuses max_tokens", async () => {
    const bodies: Record<string, unknown>[] = [];
    const fake = async (_u: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      bodies.push(body);
      return "max_tokens" in body
        ? json({ error: { message: "Unsupported parameter: 'max_tokens' is not supported with this model. Use 'max_completion_tokens' instead.", param: "max_tokens" } }, 400)
        : json({ choices: [{ message: { content: '{"a":1}' }, finish_reason: "stop" }] });
    };
    const out = await backend(fake as unknown as typeof fetch).complete(aiRequest());
    expect(out.text).toBe('{"a":1}');
    expect(bodies).toHaveLength(2);
    expect(bodies[1]).toMatchObject({ max_completion_tokens: 4000 });
    expect(bodies[1]).not.toHaveProperty("max_tokens");
  });

  it("any other 400 is not retried; its reason goes to the log message, never to the player", async () => {
    const fake = vi.fn(async () => json({ error: { message: "The model `gpt-x` does not exist sk-LEAK" } }, 400));
    const err = (await backend(fake as unknown as typeof fetch).complete(aiRequest()).catch((e) => e)) as ProviderError;
    expect(fake).toHaveBeenCalledTimes(1);
    expect(err.code).toBe("PROVIDER_BAD_REQUEST");
    expect(err.message).toContain("does not exist");
    expect(err.userMessage).not.toContain("LEAK");
  });

  it("an error relayed with HTTP 200 is a provider failure, not an empty reply to repair", async () => {
    const err = (await backend((async () => json({ error: { message: "upstream overloaded" } })) as unknown as typeof fetch).complete(aiRequest()).catch((e) => e)) as ProviderError;
    expect(err).toBeInstanceOf(ProviderError);
    expect(err.code).toBe("PROVIDER_UNAVAILABLE");
    const empty = (await backend((async () => json({ choices: [] })) as unknown as typeof fetch).complete(aiRequest()).catch((e) => e)) as ProviderError;
    expect(empty.code).toBe("PROVIDER_UNAVAILABLE");
  });

  it("reads a reply sent as a list of parts", async () => {
    const parts = [{ type: "thinking", thinking: "…" }, { type: "text", text: '{"a":' }, { type: "text", text: "1}" }];
    const out = await backend((async () => json({ model: "m", choices: [{ message: { content: parts }, finish_reason: "stop" }] })) as unknown as typeof fetch).complete(aiRequest());
    expect(out.text).toBe('{"a":1}');
  });

  it("a deadline that falls while the body is still arriving is a timeout; so is HTTP 408", async () => {
    // a gateway that sends the headers at once and the completion later (real fetch, so the abort reaches the body)
    const server = http.createServer((_req, res) => {
      res.writeHead(200, { "content-type": "application/json" });
      res.write('{"choices":[');
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    try {
      const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`;
      const err = (await createOpenAiCompatBackend({ apiKey: "k", baseUrl, model: "m" }).complete(aiRequest({ timeoutMs: 300 })).catch((e) => e)) as ProviderError;
      expect(err.code).toBe("PROVIDER_TIMEOUT");
    } finally {
      server.closeAllConnections();
      await new Promise<void>((r) => server.close(() => r()));
    }
    const slow = (await backend((async () => json({}, 408)) as unknown as typeof fetch).complete(aiRequest()).catch((e) => e)) as ProviderError;
    expect(slow.code).toBe("PROVIDER_TIMEOUT");
  });
});

describe("Anthropic adapter: a full context window", () => {
  it("is a cut-off reply (the repair asks for a smaller game), not a complete one", async () => {
    const message = { model: "claude-opus-5-5", stop_reason: "model_context_window_exceeded", content: [{ type: "text", text: '{"meta":' }], usage: { input_tokens: 1, output_tokens: 1 } };
    const client = { messages: { stream: () => ({ finalMessage: async () => message }) } } as unknown as Anthropic;
    const out = await createAnthropicBackend({ apiKey: "k", model: "claude-opus-5-5", refusalFallback: false, client }).complete(aiRequest());
    expect(out.finish).toBe("truncated");
  });
});

describe("request schemas", () => {
  it("an empty or blank notes box is 'no notes', not a refused request", () => {
    for (const notes of ["", "   "]) {
      const res = generationRequestSchema.safeParse({ ...request({ mode: "FAST" }), notes });
      expect(res.success).toBe(true);
      if (res.success) expect(res.data.notes).toBeUndefined();
    }
    expect(generationRequestSchema.safeParse({ ...request({ mode: "FAST" }), notes: "a\u0000b" }).success).toBe(false);
    const kept = generationRequestSchema.safeParse({ ...request({ mode: "FAST" }), notes: " focus on loops " });
    expect(kept.success && kept.data.notes).toBe("focus on loops");
  });

  it("a display name may not hold control characters (PostgreSQL cannot store a NUL)", () => {
    expect(displayNameSchema.safeParse("Dana\u0000").success).toBe(false);
    expect(displayNameSchema.safeParse("Dana\nCohen").success).toBe(false);
    expect(displayNameSchema.safeParse("  דנה כהן  ").data).toBe("דנה כהן");
    const ok = registerSchema.safeParse({ email: "Dana@Example.com", password: "a-long-password", displayName: "Dana" });
    expect(ok.success).toBe(true);
    expect(registerSchema.safeParse({ email: "dana@example.com", password: "a-long-password", displayName: "\u0000" }).success).toBe(false);
  });
});
