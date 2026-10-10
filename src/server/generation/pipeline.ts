import "server-only";
import { buildDemoExtension, buildDemoSpec } from "@/lib/game/demo";
import { MaterialError, buildMaterialExtension, buildMaterialSpec } from "@/lib/game/material/build";
import { challengesPayloadSchema, checkAgainstPlan, validateBlueprint, type Blueprint } from "@/lib/game/spec/blueprint";
import type { GameType } from "@/lib/game/spec/constants";
import { mergeExtension } from "@/lib/game/spec/extension";
import { extensionSchema, type GameSpec } from "@/lib/game/spec/schema";
import { normalizeRawSpec, validateGameSpec } from "@/lib/game/spec/validate";
import type { GenerationRequest } from "@/lib/schemas/generation";
import { providerError } from "../ai/errors";
import { extractJson } from "../ai/json";
import { blueprintPrompt, challengesPrompt, extensionPrompt, fastPrompt, repairPrompt, summarizeGame, systemPrompt, type PromptStage } from "../ai/prompts";
import type { AiMessage, LlmBackend, TemplateBackend } from "../ai/types";

export type PipelineErrorCode = "INVALID_OUTPUT" | "TIMEOUT" | "NO_DEMO_EXTENSION" | "EXTEND_CONFLICT" | "MATERIAL_UNUSABLE";

/** A generation failure with a safe, user-facing message (the credit is always released on failure). */
export class PipelineError extends Error {
  constructor(public readonly code: PipelineErrorCode, public readonly userMessage: string, detail?: string) {
    super(detail ?? userMessage);
    this.name = "PipelineError";
  }
}

export interface PipelineInput {
  backend: LlmBackend | TemplateBackend;
  request: GenerationRequest;
  /** EXTEND only: the saved spec being extended. */
  base: GameSpec | null;
  /** Epoch ms after which the job is abandoned and the credit released. */
  deadline: number;
  callTimeoutMs: number;
  onStage: (stage: string) => Promise<void> | void;
  now?: () => number;
}

export interface PipelineOutput {
  spec: GameSpec;
  warnings: string[];
  /** Number of model calls made (initial + repairs). */
  attempts: number;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
  templateId?: string;
  /** Built by the rule-based study engine from the learner's own material (neither AI output nor a demo template). */
  engine?: boolean;
}

const MAX_REPAIRS = 2;

// ───────────────────────────── helpers ─────────────────────────────

function deadlineSignal(input: PipelineInput): AbortSignal {
  const remaining = input.deadline - (input.now?.() ?? Date.now());
  if (remaining < 3000) throw new PipelineError("TIMEOUT", "Generation took too long and was cancelled. You were not charged.");
  return AbortSignal.timeout(remaining);
}

/** The user's choices are authoritative: a model must not change the subject, difficulty, type or language. */
function applyRequest(raw: unknown, req: GenerationRequest, opts: { language?: string } = {}): unknown {
  const { value } = normalizeRawSpec(raw);
  if (value && typeof value === "object") {
    const v = value as { meta?: Record<string, unknown> };
    v.meta = { ...(v.meta ?? {}), subject: req.subject, difficulty: req.difficulty, gameType: req.gameType, language: opts.language ?? req.contentLanguage };
  }
  return value;
}

type Check<T> = (parsed: unknown) => { ok: true; value: T; warnings?: string[] } | { ok: false; errors: string[] };

interface StageSpec<T> {
  stage: string;
  prompt: PromptStage;
  firstUser: string;
  effort: "low" | "medium" | "high";
  maxOutputTokens: number;
  check: Check<T>;
}

/** One model "stage": call, extract JSON, validate, and on failure feed the exact errors back (max 2 repairs). */
async function runLlmStage<T>(input: PipelineInput, spec: StageSpec<T>, totals: PipelineOutput["usage"], counters: { attempts: number; model: string }): Promise<{ value: T; warnings: string[] }> {
  const backend = input.backend as LlmBackend;
  const system = systemPrompt(spec.prompt, input.request.contentLanguage);
  const messages: AiMessage[] = [{ role: "user", content: spec.firstUser }];
  let lastErrors: string[] = [];

  for (let attempt = 0; attempt <= MAX_REPAIRS; attempt++) {
    await input.onStage(attempt === 0 ? spec.stage : `repair-${attempt}`);
    const res = await backend.complete({
      system, messages, maxOutputTokens: spec.maxOutputTokens, effort: spec.effort, signal: deadlineSignal(input), timeoutMs: input.callTimeoutMs,
    });
    counters.attempts += 1;
    counters.model = res.model;
    totals.inputTokens += res.usage.inputTokens;
    totals.outputTokens += res.usage.outputTokens;

    if (res.finish === "refused") throw providerError("PROVIDER_REFUSED", "model refused the request");

    await input.onStage("validate");
    let errors: string[];
    if (res.finish === "truncated") {
      errors = ["Your reply was cut off because it was too long. Return a SMALLER game (fewer stations, shorter texts) as complete, valid JSON."];
    } else {
      const extracted = extractJson(res.text);
      if (!extracted.ok) errors = [extracted.error];
      else {
        const checked = spec.check(extracted.value);
        if (checked.ok) return { value: checked.value, warnings: checked.warnings ?? [] };
        errors = checked.errors;
      }
    }
    lastErrors = errors;
    messages.push({ role: "assistant", content: res.text || "{}" }, { role: "user", content: repairPrompt(errors) });
  }
  if (lastErrors[0]?.includes("cut off")) throw providerError("OUTPUT_TRUNCATED", "output truncated after repairs");
  throw new PipelineError("INVALID_OUTPUT", "The AI could not produce a valid game for this request. You were not charged — please try again or simplify the topic.", lastErrors.join(" | ").slice(0, 600));
}

// ───────────────────────────── modes ─────────────────────────────

function fullSpecCheck(req: GenerationRequest, limits: { exactAreas?: number; minAreas?: number; minMissions?: number; maxPlaced?: number; minPlaced?: number }): Check<{ spec: GameSpec; warnings: string[] }> {
  return (parsed) => {
    const res = validateGameSpec(applyRequest(parsed, req), { alignGameType: req.gameType });
    if (!res.ok) return { ok: false, errors: res.errors };
    const placed = res.spec.areas.flatMap((a) => a.stations).filter((s) => s.kind === "challenge").length;
    const errs: string[] = [];
    if (limits.exactAreas && res.spec.areas.length !== limits.exactAreas) errs.push(`this mode needs exactly ${limits.exactAreas} area(s), you returned ${res.spec.areas.length}`);
    if (limits.minAreas && res.spec.areas.length < limits.minAreas) errs.push(`this mode needs at least ${limits.minAreas} areas`);
    if (limits.minMissions && res.spec.missions.length < limits.minMissions) errs.push(`this mode needs at least ${limits.minMissions} missions`);
    if (limits.minPlaced && placed < limits.minPlaced) errs.push(`this mode needs at least ${limits.minPlaced} challenge stations`);
    if (limits.maxPlaced && placed > limits.maxPlaced) errs.push(`this mode allows at most ${limits.maxPlaced} challenge stations`);
    return errs.length ? { ok: false, errors: errs } : { ok: true, value: { spec: res.spec, warnings: res.warnings } };
  };
}

async function runFast(input: PipelineInput, totals: PipelineOutput["usage"], counters: { attempts: number; model: string }): Promise<{ spec: GameSpec; warnings: string[] }> {
  const { value } = await runLlmStage(input, {
    stage: "generate", prompt: "spec", firstUser: fastPrompt(input.request), effort: "medium", maxOutputTokens: 14_000,
    check: fullSpecCheck(input.request, { exactAreas: 1, minPlaced: 3, maxPlaced: 6 }),
  }, totals, counters);
  return value;
}

async function runFull(input: PipelineInput, totals: PipelineOutput["usage"], counters: { attempts: number; model: string }): Promise<{ spec: GameSpec; warnings: string[] }> {
  const req = input.request;
  // Stage 1 — blueprint: cheap structural validation before any expensive content is written.
  const bp = await runLlmStage<{ blueprint: Blueprint; warnings: string[] }>(input, {
    stage: "blueprint", prompt: "blueprint", firstUser: blueprintPrompt(req), effort: "high", maxOutputTokens: 14_000,
    check: (parsed) => {
      const withReq = applyRequest(parsed, req);
      const res = validateBlueprint(withReq);
      if (!res.ok) return { ok: false, errors: res.errors };
      const errs: string[] = [];
      if (res.blueprint.areas.length < 2) errs.push("a Full Adventure needs at least 2 areas");
      if (res.blueprint.missions.length < 4) errs.push("a Full Adventure needs at least 4 missions");
      if (res.blueprint.challengePlan.filter((p) => !res.blueprint.challengePlan.some((o) => o.easierId === p.id || o.harderId === p.id)).length < 8) errs.push("plan at least 8 placed challenges");
      return errs.length ? { ok: false, errors: errs } : { ok: true, value: { blueprint: res.blueprint, warnings: res.warnings } };
    },
  }, totals, counters);

  // Stage 2 — challenge content for every planned challenge, then full validation of the assembled game.
  const { challengePlan, ...rest } = bp.value.blueprint;
  const content = await runLlmStage<{ spec: GameSpec; warnings: string[] }>(input, {
    stage: "content", prompt: "challenges", firstUser: challengesPrompt(req, JSON.stringify(bp.value.blueprint)), effort: "high", maxOutputTokens: 24_000,
    check: (parsed) => {
      const { value } = normalizeRawSpec(parsed);
      const payload = challengesPayloadSchema.safeParse(value);
      if (!payload.success) return { ok: false, errors: payload.error.issues.slice(0, 20).map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`) };
      const planErrors = checkAgainstPlan(challengePlan, payload.data.challenges);
      if (planErrors.length) return { ok: false, errors: planErrors };
      const assembled = { ...rest, challenges: payload.data.challenges };
      const res = validateGameSpec(applyRequest(assembled, req), { alignGameType: req.gameType });
      return res.ok ? { ok: true, value: { spec: res.spec, warnings: res.warnings } } : { ok: false, errors: res.errors };
    },
  }, totals, counters);
  return { spec: content.value.spec, warnings: [...bp.value.warnings, ...content.warnings, ...content.value.warnings] };
}

async function runExtend(input: PipelineInput, totals: PipelineOutput["usage"], counters: { attempts: number; model: string }): Promise<{ spec: GameSpec; warnings: string[] }> {
  const base = input.base;
  if (!base) throw new PipelineError("EXTEND_CONFLICT", "The game to extend could not be loaded.");
  const req = input.request;
  const { value } = await runLlmStage<{ spec: GameSpec; warnings: string[] }>(input, {
    stage: "extend", prompt: "extension", firstUser: extensionPrompt(req, summarizeGame(base)), effort: "medium", maxOutputTokens: 16_000,
    check: (parsed) => {
      const { value: norm } = normalizeRawSpec(parsed);
      const ext = extensionSchema.safeParse(norm);
      if (!ext.success) return { ok: false, errors: ext.error.issues.slice(0, 20).map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`) };
      if (ext.data.areas.length === 0 || ext.data.challenges.length === 0) return { ok: false, errors: ["the extension must add at least one new area and one new challenge"] };
      return checkMerged(base, ext.data);
    },
  }, totals, counters);
  return value;
}

function checkMerged(base: GameSpec, ext: ReturnType<typeof extensionSchema.parse>): ReturnType<Check<{ spec: GameSpec; warnings: string[] }>> {
  const merged = mergeExtension(base, ext);
  const res = validateGameSpec(merged.raw, { alignGameType: base.meta.gameType as GameType });
  if (!res.ok) return { ok: false, errors: res.errors };
  return { ok: true, value: { spec: res.spec, warnings: [...merged.notes, ...res.warnings] } };
}

// ───────────────────────────── demo templates ─────────────────────────────

const noUsage = { inputTokens: 0, outputTokens: 0 };

/** The study engine: the learner's own material becomes the game (also the way to extend a game built that way). */
async function runStudyEngine(input: PipelineInput): Promise<PipelineOutput> {
  const req = input.request;
  const lang = req.contentLanguage === "he" ? "he" : "en";
  try {
    if (req.mode === "EXTEND") {
      if (!input.base) throw new PipelineError("EXTEND_CONFLICT", "The game to extend could not be loaded.");
      const built = buildMaterialExtension(input.base, req);
      const ext = extensionSchema.safeParse(built.ext);
      if (!ext.success) throw new PipelineError("INVALID_OUTPUT", "The extension built from your material was invalid. You were not charged.", ext.error.message);
      await input.onStage("validate");
      const checked = checkMerged(input.base, ext.data);
      if (!checked.ok) throw new PipelineError("INVALID_OUTPUT", "The extension built from your material could not be merged. You were not charged.", checked.errors.join("; "));
      return { spec: checked.value.spec, warnings: [...built.notes, ...checked.value.warnings], attempts: 0, model: "rule-based", usage: noUsage, engine: true };
    }
    const built = buildMaterialSpec(req);
    await input.onStage("validate");
    const res = validateGameSpec(applyRequest(built.raw, req, { language: (built.raw.meta as { language: string }).language }), { alignGameType: req.gameType });
    if (!res.ok) throw new PipelineError("INVALID_OUTPUT", "The game built from your material could not be validated. You were not charged.", res.errors.join("; "));
    return { spec: res.spec, warnings: [...built.notes, ...res.warnings], attempts: 0, model: "rule-based", usage: noUsage, engine: true };
  } catch (e) {
    if (e instanceof MaterialError) throw new PipelineError("MATERIAL_UNUSABLE", `${e.userMessage(lang)} You were not charged.`, e.message);
    throw e;
  }
}

async function runTemplates(input: PipelineInput): Promise<PipelineOutput> {
  const req = input.request;
  await input.onStage(req.mode === "EXTEND" ? "extend" : "generate");
  // New game with material, or an extension of a game that was built from material: the study engine does the work.
  // (Extending a demo-template game ignores material: its content comes from the template, never from the engine.)
  const engineBase = req.mode === "EXTEND" && input.base?.meta.generator?.kind === "engine";
  if ((req.mode !== "EXTEND" && req.material) || engineBase) {
    if (engineBase && !req.material) {
      throw new PipelineError("MATERIAL_UNUSABLE", "Add more study material to extend a game that was built from your material. You were not charged.");
    }
    return runStudyEngine(input);
  }
  if (req.mode === "EXTEND") {
    if (!input.base) throw new PipelineError("EXTEND_CONFLICT", "The game to extend could not be loaded.");
    const built = buildDemoExtension(input.base, req);
    if (!built) throw new PipelineError("NO_DEMO_EXTENSION", "This demo game has no more built-in extensions. Configure an AI provider to extend games freely. You were not charged.");
    const { ext: extRaw, templateId } = built;
    const ext = extensionSchema.safeParse(extRaw);
    if (!ext.success) throw new PipelineError("INVALID_OUTPUT", "The demo extension is invalid.", ext.error.message);
    await input.onStage("validate");
    const checked = checkMerged(input.base, ext.data);
    if (!checked.ok) throw new PipelineError("INVALID_OUTPUT", "The demo extension could not be merged.", checked.errors.join("; "));
    return { spec: checked.value.spec, warnings: checked.value.warnings, attempts: 0, model: "predefined-templates", usage: { inputTokens: 0, outputTokens: 0 }, templateId };
  }
  const built = buildDemoSpec(req);
  await input.onStage("validate");
  const lang = (built.raw.meta as { language: string }).language;
  const res = validateGameSpec(applyRequest(built.raw, req, { language: lang }), { alignGameType: req.gameType });
  if (!res.ok) throw new PipelineError("INVALID_OUTPUT", "The demo template could not be validated.", res.errors.join("; "));
  return { spec: res.spec, warnings: [...built.notes, ...res.warnings], attempts: 0, model: "predefined-templates", usage: { inputTokens: 0, outputTokens: 0 }, templateId: built.templateId };
}

// ───────────────────────────── entry point ─────────────────────────────

export async function runPipeline(input: PipelineInput): Promise<PipelineOutput> {
  if (input.backend.type === "templates") return runTemplates(input);
  const totals = { inputTokens: 0, outputTokens: 0 };
  const counters = { attempts: 0, model: input.backend.info.model };
  const result = input.request.mode === "FAST" ? await runFast(input, totals, counters) : input.request.mode === "FULL" ? await runFull(input, totals, counters) : await runExtend(input, totals, counters);
  return { spec: result.spec, warnings: result.warnings, attempts: counters.attempts, model: counters.model, usage: totals };
}
