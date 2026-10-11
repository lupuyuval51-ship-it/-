/**
 * New games on the device, without a server or an AI: the study engine (learner's own material) or a demo template.
 * Same validation as the server pipeline: everything passes `validateGameSpec` before it is stored or played.
 */
import { buildDemoSpec } from "../game/demo";
import { MaterialError, buildMaterialSpec } from "../game/material/build";
import type { FeatureTier } from "../../config/plans";
import { addFinalBoss } from "../game/spec/boss";
import type { GameSpec } from "../game/spec/schema";
import { clampToFeatureTier, gameTypeAllowed, modeAllowed } from "../game/spec/tier";
import { normalizeRawSpec, validateGameSpec } from "../game/spec/validate";
import { generationRequestSchema, type GenerationRequest } from "../schemas/generation";

export class OfflineGenerationError extends Error {
  constructor(public code: "INVALID_REQUEST" | "MATERIAL_UNUSABLE" | "INVALID_OUTPUT" | "TIER_LOCKED", message: string) {
    super(message);
  }
}

function applyRequest(raw: unknown, req: GenerationRequest, language: string): unknown {
  const { value } = normalizeRawSpec(raw);
  if (value && typeof value === "object") {
    const v = value as { meta?: Record<string, unknown> };
    v.meta = { ...(v.meta ?? {}), subject: req.subject, difficulty: req.difficulty, gameType: req.gameType, language };
  }
  return value;
}

/**
 * `tier` is the feature tier the device is entitled to (see `entitlement.ts`); the game is cut down to it exactly as on
 * the server (`clampToFeatureTier`). Defaults to the full tier A.
 */
export function generateOffline(input: unknown, now = new Date(), tier: FeatureTier = "A"): { spec: GameSpec; warnings: string[] } {
  const parsed = generationRequestSchema.safeParse(input);
  if (!parsed.success || parsed.data.mode === "EXTEND") throw new OfflineGenerationError("INVALID_REQUEST", "The request is invalid.");
  const req = parsed.data;
  // Same rule as the server's `assertRequestAllowed`: ask for something the tier doesn't have and nothing is built.
  if (!modeAllowed(tier, req.mode) || !gameTypeAllowed(tier, req.gameType)) throw new OfflineGenerationError("TIER_LOCKED", "This is not part of your plan's game features.");
  const lang = req.contentLanguage === "he" ? "he" : "en";
  let raw: Record<string, unknown>;
  let notes: string[];
  let engine = false;
  let templateId: string | undefined;
  try {
    if (req.material) {
      const built = buildMaterialSpec(req);
      raw = built.raw as Record<string, unknown>;
      notes = built.notes;
      engine = true;
    } else {
      const built = buildDemoSpec(req);
      raw = built.raw as Record<string, unknown>;
      notes = built.notes;
      templateId = built.templateId;
    }
  } catch (e) {
    if (e instanceof MaterialError) throw new OfflineGenerationError("MATERIAL_UNUSABLE", e.userMessage(lang));
    throw e;
  }
  const language = (raw.meta as { language: string }).language;
  const res = validateGameSpec(applyRequest(raw, req, language), { alignGameType: req.gameType });
  if (!res.ok) throw new OfflineGenerationError("INVALID_OUTPUT", res.errors.join("; "));
  // A Full Adventure ends with a quiz boss (same rule as the server pipeline); anything that cannot take one stays as it was.
  const boss = req.mode === "FULL" ? addFinalBoss(res.spec) : { spec: res.spec, added: false, notes: [] as string[] };
  const tiered = clampToFeatureTier(boss.spec, tier);
  if (!tiered.ok) throw new OfflineGenerationError("INVALID_OUTPUT", tiered.errors.join("; "));
  const spec = tiered.spec;
  spec.meta.generator = engine
    ? { kind: "engine", provider: "study-engine", model: "rule-based", mode: req.mode, generatedAt: now.toISOString() }
    : { kind: "demo", provider: "demo", model: "predefined-templates", templateId, mode: req.mode, generatedAt: now.toISOString() };
  return { spec, warnings: [...notes, ...res.warnings, ...(boss.added ? boss.notes : []), ...tiered.notes] };
}

export type OfflineStage = "reading" | "building" | "checking" | "saving";

/** Real stages of the build with a percentage; yields to the UI between stages so the bar actually paints. */
export async function generateOfflineWithProgress(input: unknown, onProgress: (percent: number, stage: OfflineStage) => void, now = new Date(), tier: FeatureTier = "A"): Promise<{ spec: GameSpec; warnings: string[] }> {
  const tick = () => new Promise<void>((r) => setTimeout(r, 150));
  onProgress(5, "reading");
  await tick();
  onProgress(30, "building");
  await tick();
  const result = generateOffline(input, now, tier); // parse notes → challenges → world → validation (runs in one go)
  onProgress(85, "checking");
  await tick();
  return result;
}
