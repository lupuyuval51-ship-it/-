import { z } from "zod";
import { INPUT_LIMITS } from "@/config/limits";
import { CONTENT_LANGUAGES, DIFFICULTIES, GAME_TYPES, GENERATION_MODES, MECHANICS } from "@/lib/game/spec/constants";

const text = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((s) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(s), "Control characters are not allowed.");

/** Optional long text: an empty box means "not provided", anything else must be non-blank and free of control characters. */
const optionalMaterial = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z
    .string()
    .max(INPUT_LIMITS.materialMax)
    .refine((s) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(s), "Control characters are not allowed.")
    .optional(),
);

export const extensionOptionsSchema = z.object({
  addArea: z.boolean().default(true),
  addMissions: z.number().int().min(0).max(3).default(1),
  addChallenges: z.number().int().min(0).max(6).default(3),
  addMechanics: z.array(z.enum(MECHANICS)).max(4).default([]),
});

export const generationRequestSchema = z
  .object({
    mode: z.enum(GENERATION_MODES),
    subject: text(INPUT_LIMITS.subjectMax),
    learningGoal: text(INPUT_LIMITS.goalMax),
    difficulty: z.enum(DIFFICULTIES),
    gameType: z.enum(GAME_TYPES),
    contentLanguage: z.enum(CONTENT_LANGUAGES).default("en"),
    notes: text(INPUT_LIMITS.notesMax).optional(),
    /** The learner's own study material: with it, a game is built from these notes instead of a template. */
    material: optionalMaterial,
    /** EXTEND only: the saved game to add to. */
    targetGameId: z.string().min(1).max(40).optional(),
    extension: extensionOptionsSchema.optional(),
  })
  .superRefine((v, ctx) => {
    if (v.mode === "EXTEND" && !v.targetGameId) {
      ctx.addIssue({ code: "custom", path: ["targetGameId"], message: "Choose the game you want to extend." });
    }
    if (v.mode !== "EXTEND" && (v.targetGameId || v.extension)) {
      ctx.addIssue({ code: "custom", path: ["targetGameId"], message: "Only 'Extend Existing Game' accepts a target game." });
    }
  });

export type GenerationRequest = z.infer<typeof generationRequestSchema>;

/** Body of POST /api/generations: the request plus a client-generated idempotency key. */
export const createGenerationBodySchema = z.object({
  idempotencyKey: z.string().min(16).max(80).regex(/^[A-Za-z0-9_-]+$/),
  request: generationRequestSchema,
});
export type CreateGenerationBody = z.infer<typeof createGenerationBodySchema>;
