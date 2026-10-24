/**
 * Runs the evaluation set against a model backend through the REAL generation pipeline and edit engine
 * (same prompts, same validation, same repair loop as production), and measures what came out.
 */
import type { FeatureTier } from "@/config/plans";
import { identityChanges, sameContent } from "@/lib/game/spec/edit";
import type { GameSpec } from "@/lib/game/spec/schema";
import { clampToFeatureTier } from "@/lib/game/spec/tier";
import { validateGameSpec } from "@/lib/game/spec/validate";
import { generateOffline } from "@/lib/offline/generate";
import { runEdit } from "../../generation/edit";
import { runPipeline } from "../../generation/pipeline";
import type { LlmBackend } from "../types";
import type { EditCase, EvalCase, GenerateCase } from "./cases";

export interface CaseResult {
  id: string;
  kind: "generate" | "edit";
  tier: FeatureTier;
  language: string;
  mode: string;
  gameType: string;
  ok: boolean;
  /** Error code when the case failed (pipeline / provider code, or "CHECK_FAILED"). */
  errorCode?: string;
  errorDetail?: string;
  /** Names of the post-checks that failed on an otherwise accepted result. */
  failedChecks: string[];
  /** Repair rounds the model needed (0 = every stage was valid on its first reply). */
  repairs: number;
  /** Model calls in total. */
  calls: number;
  ms: number;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export interface RunOptions {
  backend: LlmBackend;
  concurrency?: number;
  /** Whole-case deadline and per-call timeout. */
  deadlineMs?: number;
  callTimeoutMs?: number;
  onResult?: (r: CaseResult, done: number, total: number) => void;
}

/** What must hold for a generated game beyond "it passed validation once": re-validate, the right type/language/tier. */
function checkGenerated(spec: GameSpec, c: GenerateCase): string[] {
  const failed: string[] = [];
  if (!validateGameSpec(spec, { alignGameType: c.request.gameType }).ok) failed.push("revalidate");
  if (spec.meta.gameType !== c.request.gameType) failed.push("game-type");
  if (spec.meta.language !== c.request.contentLanguage) failed.push("language");
  const tiered = clampToFeatureTier(spec, c.tier);
  if (!tiered.ok || tiered.removed.length) failed.push("tier");
  if (c.request.mode === "FULL" && spec.areas.length < 2) failed.push("areas");
  return failed;
}

function checkEdited(before: GameSpec, after: GameSpec, c: EditCase): string[] {
  const failed: string[] = [];
  if (!validateGameSpec(after, { alignGameType: before.meta.gameType }).ok) failed.push("revalidate");
  if (identityChanges(before, after).length) failed.push("identity");
  if (sameContent(before, after)) failed.push("no-change");
  const tiered = clampToFeatureTier(after, c.tier);
  if (!tiered.ok || tiered.removed.length) failed.push("tier");
  return failed;
}

export async function runCase(c: EvalCase, opts: RunOptions): Promise<CaseResult> {
  const deadlineMs = opts.deadlineMs ?? 600_000;
  const callTimeoutMs = opts.callTimeoutMs ?? 240_000;
  const started = Date.now();
  let repairs = 0;
  const onStage = (stage: string) => { if (stage.startsWith("repair-")) repairs += 1; };
  const base: CaseResult = {
    id: c.id, kind: c.kind, tier: c.tier,
    language: c.kind === "generate" ? c.request.contentLanguage : c.base.contentLanguage,
    mode: c.kind === "generate" ? c.request.mode : "EDIT",
    gameType: c.kind === "generate" ? c.request.gameType : c.base.gameType,
    ok: false, failedChecks: [], repairs: 0, calls: 0, ms: 0, inputTokens: 0, outputTokens: 0, model: opts.backend.info.model,
  };
  try {
    if (c.kind === "generate") {
      const out = await runPipeline({ backend: opts.backend, tier: c.tier, request: c.request, base: null, deadline: started + deadlineMs, callTimeoutMs, onStage });
      const failed = checkGenerated(out.spec, c);
      return { ...base, ok: failed.length === 0, errorCode: failed.length ? "CHECK_FAILED" : undefined, failedChecks: failed, repairs, calls: out.attempts, ms: Date.now() - started, inputTokens: out.usage.inputTokens, outputTokens: out.usage.outputTokens, model: out.model };
    }
    const spec = generateOffline(c.base, new Date(), c.tier).spec;
    const out = await runEdit({ backend: opts.backend, spec, instruction: c.instruction, level: c.level, tier: c.tier, deadline: started + deadlineMs, callTimeoutMs, onStage });
    const failed = checkEdited(spec, out.spec, c);
    return { ...base, ok: failed.length === 0, errorCode: failed.length ? "CHECK_FAILED" : undefined, failedChecks: failed, repairs, calls: out.attempts, ms: Date.now() - started, inputTokens: out.usage.inputTokens, outputTokens: out.usage.outputTokens, model: out.model };
  } catch (err) {
    const e = err as { code?: string; message?: string };
    return { ...base, errorCode: e.code ?? "UNEXPECTED", errorDetail: (e.message ?? String(err)).slice(0, 300), repairs, ms: Date.now() - started };
  }
}

/** Runs every case with limited concurrency; results come back in case order. */
export async function runEval(cases: EvalCase[], opts: RunOptions): Promise<CaseResult[]> {
  const results: CaseResult[] = new Array(cases.length);
  let next = 0;
  let done = 0;
  const worker = async () => {
    for (;;) {
      const i = next++;
      if (i >= cases.length) return;
      results[i] = await runCase(cases[i]!, opts);
      done += 1;
      opts.onResult?.(results[i]!, done, cases.length);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(opts.concurrency ?? 2, cases.length)) }, worker));
  return results;
}
