import { describe, expect, it, vi } from "vitest";
import { buildDemoSpec } from "../support/samples";
import { validateGameSpec } from "@/lib/game/spec/validate";
import { providerError } from "@/server/ai/errors";
import { APP_PROJECT_URL, APP_PUBLISHABLE_KEY, backendFromEnv, createEdgeDeps, handleGenerate, type EdgeDeps, type Slot } from "@/server/ai/edge/generate-game";
import type { AiRequest, LlmBackend } from "@/server/ai/types";
import { request } from "./helpers";

/** A scripted model: each call takes the next reply (the last one repeats). */
function model(replies: (object | string | Error)[]): LlmBackend & { calls: AiRequest[] } {
  const calls: AiRequest[] = [];
  return {
    type: "llm", calls,
    info: { id: "openai", kind: "ai", label: "test", model: "test-model" },
    async complete(req) {
      calls.push(req);
      const r = replies[Math.min(calls.length - 1, replies.length - 1)]!;
      if (r instanceof Error) throw r;
      return { text: typeof r === "string" ? r : JSON.stringify(r), model: "test-model", finish: "complete", usage: { inputTokens: 1, outputTokens: 1 } };
    },
  };
}

const USER = "11111111-2222-4333-8444-555555555555";
function deps(over: Partial<EdgeDeps> = {}): EdgeDeps & { finished: [string, boolean][]; reserved: number } {
  const state = { finished: [] as [string, boolean][], reserved: 0 };
  const d: EdgeDeps = {
    env: () => undefined,
    verifyUser: async (a) => (a === "Bearer good" ? USER : null),
    reserve: async (): Promise<Slot> => { state.reserved++; return { ok: true, id: "slot-1" }; },
    finish: async (id, ok) => { state.finished.push([id, ok]); },
    backend: () => model([buildDemoSpec(request({ mode: "FAST" })).raw]),
    now: () => 1_800_000_000_000,
    ...over,
  };
  return Object.assign(d, state, { get finished() { return state.finished; }, get reserved() { return state.reserved; } });
}

const post = (body: unknown, auth: string | null = "Bearer good", origin = "capacitor://localhost") =>
  new Request("https://example.test/functions/v1/generate-game", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin, ...(auth ? { Authorization: auth } : {}) },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const read = async (res: Response) => ({ status: res.status, body: (await res.json()) as { spec?: Record<string, never> & { meta: { generator: { kind: string; provider: string } } }; error?: { code: string } } });

describe("LEVEL UP AI edge function: who may ask", () => {
  it("answers the CORS preflight for the app's WebView only", async () => {
    const res = await handleGenerate(new Request("https://x.test", { method: "OPTIONS", headers: { Origin: "capacitor://localhost" } }), deps());
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("capacitor://localhost");
    const other = await handleGenerate(new Request("https://x.test", { method: "OPTIONS", headers: { Origin: "https://evil.example" } }), deps());
    expect(other.headers.get("Access-Control-Allow-Origin")).not.toBe("https://evil.example");
  });

  it("refuses without a valid levelup-app sign-in, before reading the body or touching the quota", async () => {
    const d = deps();
    expect((await read(await handleGenerate(post(request({ mode: "FAST" }), null), d))).status).toBe(401);
    expect((await read(await handleGenerate(post(request({ mode: "FAST" }), "Bearer forged"), d))).status).toBe(401);
    expect(d.reserved).toBe(0);
  });

  it("rejects bad requests, topic-library games and extensions (they run on the phone)", async () => {
    const d = deps();
    expect((await read(await handleGenerate(post("{nope"), d))).body.error?.code).toBe("INVALID_REQUEST");
    expect((await read(await handleGenerate(post({ mode: "FAST" }), d))).body.error?.code).toBe("INVALID_REQUEST");
    expect((await read(await handleGenerate(post(request({ mode: "FULL", topicId: "math-fractions" })), d))).status).toBe(400);
    expect((await read(await handleGenerate(post(request({ mode: "EXTEND", targetGameId: "g1" })), d))).body.error?.code).toBe("UNSUPPORTED_MODE");
    expect(d.reserved).toBe(0);
  });

  it("without an AI key it says so and uses nothing", async () => {
    const d = deps({ backend: () => null });
    const { status, body } = await read(await handleGenerate(post(request({ mode: "FAST" })), d));
    expect(status).toBe(503);
    expect(body.error?.code).toBe("AI_UNAVAILABLE");
    expect(d.reserved).toBe(0);
  });

  it("one game at a time and a daily limit", async () => {
    expect((await handleGenerate(post(request({ mode: "FAST" })), deps({ reserve: async () => ({ ok: false, reason: "BUSY" }) }))).status).toBe(409);
    expect((await handleGenerate(post(request({ mode: "FAST" })), deps({ reserve: async () => ({ ok: false, reason: "LIMIT" }) }))).status).toBe(429);
    let asked = -1;
    await handleGenerate(post(request({ mode: "FAST" })), deps({ env: (n) => (n === "AI_DAILY_LIMIT" ? "12" : undefined), reserve: async (_u, limit) => { asked = limit; return { ok: false, reason: "LIMIT" }; } }));
    expect(asked).toBe(12);
  });
});

describe("LEVEL UP AI edge function: what it returns", () => {
  it("a valid game, labelled as made by AI, fitted to a phone; the slot counts", async () => {
    const d = deps();
    const { status, body } = await read(await handleGenerate(post(request({ mode: "FAST" })), d));
    expect(status).toBe(200);
    expect(body.spec!.meta.generator.kind).toBe("ai");
    expect(validateGameSpec(body.spec).ok).toBe(true);
    expect(d.finished).toEqual([["slot-1", true]]);
  });

  it("an answer that never becomes a valid game is refused and the slot is released", async () => {
    const d = deps({ backend: () => model(["not json at all"]) });
    const { status, body } = await read(await handleGenerate(post(request({ mode: "FAST" })), d));
    expect(status).toBe(502);
    expect(body.error?.code).toBe("INVALID_OUTPUT");
    expect(body.spec).toBeUndefined();
    expect(d.finished).toEqual([["slot-1", false]]);
  });

  it("a provider failure is reported without its details and costs nothing", async () => {
    const d = deps({ backend: () => model([providerError("PROVIDER_AUTH", "HTTP 401 secret-looking body")]) });
    const res = await handleGenerate(post(request({ mode: "FAST" })), d);
    const text = await res.text();
    expect(res.status).toBe(502);
    expect(text).not.toContain("secret-looking");
    expect(d.finished).toEqual([["slot-1", false]]);
  });
});

describe("LEVEL UP AI edge function: wiring", () => {
  it("picks the model from the environment and never invents one", () => {
    expect(backendFromEnv(() => undefined)).toBeNull();
    const env = (vars: Record<string, string>) => (n: string) => vars[n];
    expect(backendFromEnv(env({ OPENAI_API_KEY: "k", OPENAI_BASE_URL: "https://api.deepseek.com/v1", OPENAI_MODEL: "deepseek-chat" }))?.info.model).toBe("deepseek-chat");
    expect(backendFromEnv(env({ AI_PROVIDER: "anthropic", OPENAI_API_KEY: "k" }))).toBeNull();
    expect(backendFromEnv(env({ ANTHROPIC_API_KEY: "a", OPENAI_API_KEY: "k" }))?.info.id).toBe("anthropic");
  });

  it("checks the sign-in against the app's own project, and talks to its database with the service key", async () => {
    const seen: { url: string; headers: Record<string, string>; body?: string }[] = [];
    const fake = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const u = String(url);
      seen.push({ url: u, headers: Object.fromEntries(new Headers(init?.headers).entries()), body: init?.body as string | undefined });
      if (u.endsWith("/auth/v1/user")) return new Response(JSON.stringify({ id: USER }), { status: 200 });
      if (u.endsWith("/rpc/reserve_ai_request")) return new Response(JSON.stringify({ id: "slot-9" }), { status: 200 });
      return new Response("null", { status: 200 });
    });
    const real = createEdgeDeps((n) => ({ SUPABASE_URL: "https://ai.test", SUPABASE_SERVICE_ROLE_KEY: "service" })[n], fake as unknown as typeof fetch);
    expect(await real.verifyUser("Bearer t")).toBe(USER);
    expect(seen[0]!.url).toBe(`${APP_PROJECT_URL}/auth/v1/user`);
    expect(seen[0]!.headers.apikey).toBe(APP_PUBLISHABLE_KEY);
    expect(seen[0]!.headers.authorization).toBe("Bearer t");
    expect(await real.reserve(USER, 5)).toEqual({ ok: true, id: "slot-9" });
    expect(seen[1]!.url).toBe("https://ai.test/rest/v1/rpc/reserve_ai_request");
    expect(seen[1]!.headers.authorization).toBe("Bearer service");
    expect(JSON.parse(seen[1]!.body!)).toEqual({ p_user: USER, p_daily: 5 });
    await real.finish("slot-9", false);
    expect(JSON.parse(seen[2]!.body!)).toEqual({ p_id: "slot-9", p_ok: false });
  });

  it("a token the app's project does not accept is no user", async () => {
    const fake = async () => new Response("{}", { status: 401 });
    expect(await createEdgeDeps(() => undefined, fake as unknown as typeof fetch).verifyUser("Bearer x")).toBeNull();
  });
});
