import "server-only";
import { EDIT_LIMITS, applyEditOps, editResponseSchema, identityChanges, sameContent } from "@/lib/game/spec/edit";
import type { RobotLevel } from "@/config/plans";
import type { GameSpec } from "@/lib/game/spec/schema";
import { normalizeRawSpec, validateGameSpec } from "@/lib/game/spec/validate";
import { editPrompt } from "../ai/prompts";
import type { LlmBackend } from "../ai/types";
import { PipelineError, runLlmStage } from "./pipeline";

/** Games larger than this are not sent to a model for editing (keeps cost and latency bounded). */
const MAX_GAME_JSON_CHARS = 120_000;

export interface EditInput {
  backend: LlmBackend;
  spec: GameSpec;
  instruction: string;
  /** The plan's robot level: B = small focused edits, A = larger multi-part changes. */
  level: Exclude<RobotLevel, "none">;
  deadline: number;
  callTimeoutMs: number;
  onStage: (stage: string) => Promise<void> | void;
  now?: () => number;
}

export interface EditOutput {
  spec: GameSpec;
  summary: string;
  warnings: string[];
  attempts: number;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
}

/**
 * Change an existing game from a natural-language instruction.
 *
 * The model returns a few allow-listed operations; they are applied to a copy of the saved game and the WHOLE
 * result goes through `validateGameSpec` (schema, cross-references, solvability, sanitising) before it can be
 * stored. Anything wrong is fed back to the model (max 2 repairs). Nothing here ever executes model output.
 */
export async function runEdit(input: EditInput): Promise<EditOutput> {
  const instruction = input.instruction.trim().slice(0, EDIT_LIMITS.instructionChars);
  const base = input.spec;
  const baseJson = JSON.stringify({ ...base, meta: { ...base.meta, generator: undefined } });
  if (baseJson.length > MAX_GAME_JSON_CHARS) {
    throw new PipelineError("EDIT_TOO_LARGE", "This game is too large to edit with the AI robot. You were not charged.");
  }
  const maxOps = input.level === "A" ? EDIT_LIMITS.opsA : EDIT_LIMITS.opsB;
  const totals = { inputTokens: 0, outputTokens: 0 };
  const counters = { attempts: 0, model: input.backend.info.model };

  const { value, warnings } = await runLlmStage<{ spec: GameSpec; summary: string; warnings: string[] }>(
    { backend: input.backend, language: base.meta.language, deadline: input.deadline, callTimeoutMs: input.callTimeoutMs, onStage: input.onStage, now: input.now },
    {
      stage: "edit", prompt: "edit", firstUser: editPrompt(baseJson, instruction, input.level, base.meta.language),
      effort: input.level === "A" ? "high" : "medium", maxOutputTokens: input.level === "A" ? 16_000 : 8_000,
      check: (parsed) => {
        const { value: norm } = normalizeRawSpec(parsed);
        const reply = editResponseSchema.safeParse(norm);
        if (!reply.success) return { ok: false, errors: reply.error.issues.slice(0, 20).map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`) };
        const applied = applyEditOps(base, reply.data.ops, maxOps);
        if (!applied.ok) return { ok: false, errors: applied.errors };
        // Compare BEFORE validation: the validator normalises fields, so a no-op would otherwise look like a change.
        if (sameContent(base, applied.raw as GameSpec)) return { ok: false, errors: ["your operations did not change the game; make the change the player asked for"] };
        const res = validateGameSpec(applied.raw, { alignGameType: base.meta.gameType });
        if (!res.ok) return { ok: false, errors: res.errors };
        const identity = identityChanges(base, res.spec);
        if (identity.length) return { ok: false, errors: identity };
        if (sameContent(base, res.spec)) return { ok: false, errors: ["your operations did not change the game; make the change the player asked for"] };
        return { ok: true, value: { spec: res.spec, summary: reply.data.summary, warnings: res.warnings } };
      },
    },
    totals, counters,
  );
  return { spec: value.spec, summary: value.summary, warnings: [...warnings, ...value.warnings], attempts: counters.attempts, model: counters.model, usage: totals };
}
