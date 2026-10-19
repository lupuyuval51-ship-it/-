import { describe, expect, it } from "vitest";
import { buildDemoSpec } from "../support/samples";
import { generateOffline } from "@/lib/offline/generate";
import { gameTypeAllowed, modeAllowed } from "@/lib/game/spec/tier";
import { buildCases, type EditCase, type GenerateCase } from "@/server/ai/eval/cases";
import { buildReport, compareReports, formatReport, statsOf } from "@/server/ai/eval/report";
import { runCase, runEval, type CaseResult } from "@/server/ai/eval/run";
import type { AiRequest, LlmBackend } from "@/server/ai/types";

function backend(reply: (req: AiRequest, call: number) => string): LlmBackend & { calls: number } {
  const b = {
    calls: 0,
    type: "llm" as const,
    info: { id: "fake", kind: "ai" as const, label: "Fake", model: "fake-1" },
    async complete(req: AiRequest) {
      b.calls += 1;
      return { text: reply(req, b.calls), model: "fake-1", finish: "complete" as const, usage: { inputTokens: 100, outputTokens: 50 } };
    },
  };
  return b;
}

const fastCase = (): GenerateCase => buildCases({ generate: 12, edit: 0 }).find((c): c is GenerateCase => c.kind === "generate" && c.tier === "A" && c.request.mode === "FAST")!;
const editCase = (): EditCase => buildCases({ generate: 0, edit: 6 }).find((c): c is EditCase => c.kind === "edit" && c.tier === "A")!;

describe("the evaluation set", () => {
  const cases = buildCases();

  it("is deterministic, has unique ids and the requested sizes", () => {
    expect(buildCases()).toEqual(cases);
    expect(new Set(cases.map((c) => c.id)).size).toBe(cases.length);
    expect(cases.filter((c) => c.kind === "generate")).toHaveLength(70);
    expect(cases.filter((c) => c.kind === "edit")).toHaveLength(30);
  });

  it("only asks for what each tier allows, and covers languages, tiers and modes", () => {
    for (const c of cases) {
      const req = c.kind === "generate" ? c.request : c.base;
      expect(modeAllowed(c.tier, req.mode)).toBe(true);
      expect(gameTypeAllowed(c.tier, req.gameType)).toBe(true);
    }
    const gens = cases.filter((c): c is GenerateCase => c.kind === "generate");
    expect(new Set(gens.map((c) => c.request.contentLanguage))).toEqual(new Set(["he", "en"]));
    expect(new Set(gens.map((c) => c.tier))).toEqual(new Set(["A", "B", "C"]));
    expect(gens.some((c) => c.request.mode === "FULL")).toBe(true);
    expect(new Set(gens.map((c) => c.request.gameType)).size).toBeGreaterThanOrEqual(4);
  });
});

describe("running the evaluation", () => {
  it("accepts a valid generation, with no repairs and token counts", async () => {
    const c = fastCase();
    const fake = backend(() => JSON.stringify(buildDemoSpec(c.request).raw));
    const r = await runCase(c, { backend: fake });
    expect(r.errorCode).toBeUndefined();
    expect(r).toMatchObject({ ok: true, repairs: 0, calls: 1, inputTokens: 100, outputTokens: 50, model: "fake-1" });
  });

  it("counts a repair round when the first reply is invalid", async () => {
    const c = fastCase();
    const good = JSON.stringify(buildDemoSpec(c.request).raw);
    const fake = backend((_req, call) => (call === 1 ? "{}" : good));
    const r = await runCase(c, { backend: fake });
    expect(r).toMatchObject({ ok: true, repairs: 1, calls: 2 });
  });

  it("reports a failure with its error code when the model never produces a valid game", async () => {
    const r = await runCase(fastCase(), { backend: backend(() => "sorry, I cannot do that") });
    expect(r.ok).toBe(false);
    expect(r.errorCode).toBe("INVALID_OUTPUT");
    expect(r.repairs).toBe(2);
  });

  it("evaluates an edit and flags an edit that changes nothing", async () => {
    const c = editCase();
    const changed = await runCase(c, { backend: backend(() => JSON.stringify({ summary: "New title", ops: [{ op: "replace", path: "/meta/title", value: "A brand new title" }] })) });
    expect(changed).toMatchObject({ ok: true, kind: "edit", repairs: 0 });
    const title = generateOffline(c.base, new Date(), c.tier).spec.meta.title;
    const unchanged = await runCase(c, { backend: backend(() => JSON.stringify({ summary: "Nothing", ops: [{ op: "replace", path: "/meta/title", value: title }] })) });
    expect(unchanged).toMatchObject({ ok: false, errorCode: "INVALID_OUTPUT", repairs: 2 });
  });

  it("runs many cases with limited concurrency and keeps their order", async () => {
    const cases = buildCases({ generate: 0, edit: 6 });
    const fake = backend(() => JSON.stringify({ summary: "t", ops: [{ op: "replace", path: "/meta/title", value: "Another title" }] }));
    const seen: number[] = [];
    const results = await runEval(cases, { backend: fake, concurrency: 3, onResult: (_r, done) => seen.push(done) });
    expect(results.map((r) => r.id)).toEqual(cases.map((c) => c.id));
    expect(seen).toHaveLength(6);
  });
});

describe("the report", () => {
  const rs: CaseResult[] = [
    { id: "a", kind: "generate", tier: "A", language: "en", mode: "FAST", gameType: "puzzle", ok: true, failedChecks: [], repairs: 0, calls: 1, ms: 1000, inputTokens: 1000, outputTokens: 2000, model: "m" },
    { id: "b", kind: "generate", tier: "A", language: "he", mode: "FAST", gameType: "puzzle", ok: true, failedChecks: [], repairs: 2, calls: 3, ms: 3000, inputTokens: 3000, outputTokens: 4000, model: "m" },
    { id: "c", kind: "edit", tier: "B", language: "he", mode: "EDIT", gameType: "puzzle", ok: false, errorCode: "INVALID_OUTPUT", failedChecks: [], repairs: 2, calls: 3, ms: 5000, inputTokens: 500, outputTokens: 500, model: "m" },
    { id: "d", kind: "generate", tier: "C", language: "en", mode: "FAST", gameType: "puzzle", ok: false, errorCode: "CHECK_FAILED", failedChecks: ["tier"], repairs: 0, calls: 1, ms: 800, inputTokens: 100, outputTokens: 100, model: "m" },
  ];

  it("computes success, no-repair rate, errors and cost", () => {
    const s = statsOf([...rs], { inputPerM: 1, outputPerM: 2 });
    expect(s.n).toBe(4);
    expect(s.successRate).toBe(0.5);
    expect(s.zeroRepairRate).toBe(0.5);
    expect(s.errors).toEqual({ INVALID_OUTPUT: 1, CHECK_FAILED: 1 });
    expect(s.failedChecks).toEqual({ tier: 1 });
    expect(s.inputTokens).toBe(4600);
    expect(s.costUsd).toBeCloseTo((4600 * 1 + 6600 * 2) / 1_000_000, 4);
    expect(s.costPerSuccessUsd).toBeCloseTo(s.costUsd! / 2, 4);
  });

  it("prints a table and a comparison between two models", () => {
    const a = buildReport("model-a", [...rs]);
    const b = buildReport("model-b", rs.map((r) => ({ ...r, ok: true, errorCode: undefined, failedChecks: [] })));
    expect(formatReport(a)).toContain("overall | 4 | 50%");
    expect(compareReports(a, b)).toContain("overall | 50% → 100%");
  });
});
