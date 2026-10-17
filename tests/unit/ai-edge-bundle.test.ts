import { build } from "esbuild";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The Edge Function is shipped as one bundle (scripts/build-ai-function.mjs). Build it the same way, run it with a stand-in
 * for Deno's `serve`/`env`, and check that it starts and answers: no Node-only API, no missing module, no secret inside.
 */
describe("LEVEL UP AI edge bundle", () => {
  it("builds into one self-contained module that serves requests", async () => {
    const stub = (n: string) => path.resolve("src/server/ai/edge/stubs", n);
    const out = await build({
      entryPoints: ["src/server/ai/edge/deno-entry.ts"], bundle: true, format: "esm", platform: "browser", target: "es2022",
      write: false, tsconfig: "tsconfig.json", logLevel: "silent",
      alias: { "server-only": stub("server-only.ts"), "@/lib/game/topics/loaders": stub("topic-loaders.ts") },
    });
    const code = out.outputFiles[0]!.text;
    expect(code).not.toMatch(/^\s*import\s/m); // everything is inside
    expect(code).not.toMatch(/sb_secret_[A-Za-z0-9]|sk-ant-[A-Za-z0-9]|service_role"\s*:/);

    let handler: ((req: Request) => Promise<Response>) | null = null;
    const g = globalThis as unknown as { Deno?: unknown };
    g.Deno = { serve: (h: (req: Request) => Promise<Response>) => { handler = h; }, env: { get: () => undefined } };
    try {
      await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
      expect(handler).not.toBeNull();
      const pre = await handler!(new Request("https://x.test", { method: "OPTIONS", headers: { Origin: "capacitor://localhost" } }));
      expect(pre.status).toBe(204);
      const anon = await handler!(new Request("https://x.test", { method: "POST", body: "{}" }));
      expect(anon.status).toBe(401);
    } finally {
      delete g.Deno;
    }
  }, 60_000);
});
