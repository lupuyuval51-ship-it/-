/**
 * New games on the device, without a server or an AI: the study engine (learner's own material) or a demo template.
 * Same validation as the server pipeline: everything passes `validateGameSpec` before it is stored or played.
 */
import { buildDemoSpec } from "../game/demo";
import { MaterialError, buildMaterialSpec } from "../game/material/build";
import type { GameSpec } from "../game/spec/schema";
import { normalizeRawSpec, validateGameSpec } from "../game/spec/validate";
import { generationRequestSchema, type GenerationRequest } from "../schemas/generation";

export class OfflineGenerationError extends Error {
  constructor(public code: "INVALID_REQUEST" | "MATERIAL_UNUSABLE" | "INVALID_OUTPUT", message: string) {
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

export function generateOffline(input: unknown, now = new Date()): { spec: GameSpec; warnings: string[] } {
  const parsed = generationRequestSchema.safeParse(input);
  if (!parsed.success || parsed.data.mode === "EXTEND") throw new OfflineGenerationError("INVALID_REQUEST", "The request is invalid.");
  const req = parsed.data;
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
  const spec = res.spec;
  spec.meta.generator = engine
    ? { kind: "engine", provider: "study-engine", model: "rule-based", mode: req.mode, generatedAt: now.toISOString() }
    : { kind: "demo", provider: "demo", model: "predefined-templates", templateId, mode: req.mode, generatedAt: now.toISOString() };
  return { spec, warnings: [...notes, ...res.warnings] };
}

export type OfflineStage = "reading" | "building" | "checking" | "saving";

/** Real stages of the build with a percentage; yields to the UI between stages so the bar actually paints. */
export async function generateOfflineWithProgress(input: unknown, onProgress: (percent: number, stage: OfflineStage) => void, now = new Date()): Promise<{ spec: GameSpec; warnings: string[] }> {
  const tick = () => new Promise<void>((r) => setTimeout(r, 150));
  onProgress(5, "reading");
  await tick();
  onProgress(30, "building");
  await tick();
  const result = generateOffline(input, now); // parse notes → challenges → world → validation (runs in one go)
  onProgress(85, "checking");
  await tick();
  return result;
}
