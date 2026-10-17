/**
 * New games on the device, without a server or an AI: the study engine (learner's own material) or a demo template.
 * Same validation as the server pipeline: everything passes `validateGameSpec` before it is stored or played.
 */
import { buildDemoSpec } from "../game/demo";
import { planOpeningTopic, topicOpenFor } from "@/lib/game/topics/premium";
import { getOfflinePlan } from "./entitlement";
import { MaterialError, buildMaterialSpec } from "../game/material/build";
import { findTopic } from "../game/topics/catalog";
import { TOPIC_MODEL, TOPIC_PROVIDER, TopicError, buildTopicSpec, topicRequest } from "../game/topics/build";
import { loadTopicContent } from "../game/topics/loaders";
import type { TopicContent } from "../game/topics/types";
import type { FeatureTier } from "../../config/plans";
import { addFinalBoss } from "../game/spec/boss";
import type { GameSpec } from "../game/spec/schema";
import { fitForDevice } from "../game/spec/device";
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
const requiredFor = (topicId: string): string => (planOpeningTopic(topicId) === "PRO" ? "This topic is part of Pro." : "This topic is part of Plus and Pro.");

export function generateOffline(input: unknown, now = new Date(), tier: FeatureTier = "A", topic?: TopicContent): { spec: GameSpec; warnings: string[] } {
  const parsed = generationRequestSchema.safeParse(input);
  if (!parsed.success || parsed.data.mode === "EXTEND") throw new OfflineGenerationError("INVALID_REQUEST", "The request is invalid.");
  const entry = parsed.data.topicId ? findTopic(parsed.data.topicId) : undefined;
  // A topic-library request needs that topic's content, which the caller loads first (`generateOfflineWithProgress` does).
  if (parsed.data.topicId && (!entry || !topic)) throw new OfflineGenerationError("INVALID_REQUEST", "The topic could not be loaded.");
  // Premium topics follow the install's plan (Plus/Pro); until Google Play Billing exists every install is unlocked.
  if (parsed.data.topicId && !topicOpenFor(getOfflinePlan(), parsed.data.topicId)) throw new OfflineGenerationError("TIER_LOCKED", requiredFor(parsed.data.topicId));
  const req = entry ? topicRequest(parsed.data, entry) : parsed.data;
  // Same rule as the server's `assertRequestAllowed`: ask for something the tier doesn't have and nothing is built.
  if (!modeAllowed(tier, req.mode) || !gameTypeAllowed(tier, req.gameType)) throw new OfflineGenerationError("TIER_LOCKED", "This is not part of your plan's game features.");
  const lang = req.contentLanguage === "he" ? "he" : "en";
  let raw: Record<string, unknown>;
  let notes: string[];
  let engine = false;
  let catalog = false;
  let templateId: string | undefined;
  try {
    if (entry && topic) {
      const built = buildTopicSpec(req, entry, topic);
      raw = built.raw as Record<string, unknown>;
      notes = built.notes;
      catalog = true;
      templateId = entry.id;
    } else if (req.material) {
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
    if (e instanceof TopicError) throw new OfflineGenerationError("INVALID_OUTPUT", e.message);
    throw e;
  }
  const language = (raw.meta as { language: string }).language;
  const res = validateGameSpec(applyRequest(raw, req, language), { alignGameType: req.gameType });
  if (!res.ok) throw new OfflineGenerationError("INVALID_OUTPUT", res.errors.join("; "));
  // A Full Adventure ends with a quiz boss (same rule as the server pipeline); anything that cannot take one stays as it was.
  const boss = req.mode === "FULL" ? addFinalBoss(res.spec) : { spec: res.spec, added: false, notes: [] as string[] };
  const tiered = clampToFeatureTier(boss.spec, tier);
  if (!tiered.ok) throw new OfflineGenerationError("INVALID_OUTPUT", tiered.errors.join("; "));
  // Made on a phone (the Android app asks for it): less walking, easier jumps, more time to type. Same rule as the server.
  const fitted = req.device === "phone" ? fitForDevice(tiered.spec, "phone") : { spec: tiered.spec, notes: [] as string[] };
  const spec = fitted.spec;
  spec.meta.generator = catalog
    ? { kind: "catalog", provider: TOPIC_PROVIDER, model: TOPIC_MODEL, templateId, mode: req.mode, generatedAt: now.toISOString() }
    : engine
      ? { kind: "engine", provider: "study-engine", model: "rule-based", mode: req.mode, generatedAt: now.toISOString() }
      : { kind: "demo", provider: "demo", model: "predefined-templates", templateId, mode: req.mode, generatedAt: now.toISOString() };
  return { spec, warnings: [...notes, ...res.warnings, ...(boss.added ? boss.notes : []), ...tiered.notes, ...fitted.notes] };
}

export type OfflineStage = "reading" | "building" | "checking" | "saving";

/** Real stages of the build with a percentage; yields to the UI between stages so the bar actually paints. */
export async function generateOfflineWithProgress(input: unknown, onProgress: (percent: number, stage: OfflineStage) => void, now = new Date(), tier: FeatureTier = "A"): Promise<{ spec: GameSpec; warnings: string[] }> {
  const tick = () => new Promise<void>((r) => setTimeout(r, 150));
  onProgress(5, "reading");
  await tick();
  // A topic from the library: only now is its content module loaded (each topic is its own chunk).
  const topicId = input && typeof input === "object" ? (input as { topicId?: unknown }).topicId : undefined;
  const topic = typeof topicId === "string" ? await loadTopicContent(topicId) : null;
  if (typeof topicId === "string" && !topic) throw new OfflineGenerationError("INVALID_REQUEST", "The topic could not be loaded.");
  onProgress(30, "building");
  await tick();
  const result = generateOffline(input, now, tier, topic ?? undefined); // notes or topic → challenges → world → validation (runs in one go)
  onProgress(85, "checking");
  await tick();
  return result;
}
