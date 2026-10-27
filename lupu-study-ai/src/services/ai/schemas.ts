import { z } from "zod";

export const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const MAX_IMAGE_B64 = 8_500_000; // ~6MB בינארי

export const imageSchema = z.object({
  mediaType: z.enum(MEDIA_TYPES),
  data: z.string().min(60).max(MAX_IMAGE_B64).regex(/^[A-Za-z0-9+/=\s]+$/, "base64 לא תקין"),
});

export const materialSchema = z.object({
  id: z.string().regex(/^M\d{1,2}$/),
  title: z.string().max(160),
  pages: z.array(z.object({ page: z.number().int().min(1).max(5000).nullable(), text: z.string().max(6000) })).max(14),
});
export type MaterialCtx = z.infer<typeof materialSchema>;

export const MAX_MATERIAL_CHARS = 40_000;

const materialsField = z.array(materialSchema).max(6).optional().refine(
  (m) => !m || m.reduce((a, x) => a + x.pages.reduce((b, p) => b + p.text.length, 0), 0) <= MAX_MATERIAL_CHARS,
  "החומר המצורף ארוך מדי",
);

export const chatRequestSchema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(8000) })).min(1).max(40),
  mode: z.enum(["explain", "practice", "exam"]),
  level: z.enum(["simple", "standard", "advanced"]),
  grade: z.number().int().min(1).max(12),
  subject: z.string().max(60).optional(),
  topic: z.string().max(120).optional(),
  materials: materialsField,
  images: z.array(imageSchema).max(3).optional(),
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const visionRequestSchema = z
  .object({
    image: imageSchema.optional(),
    correctedText: z.string().min(3).max(3000).optional(),
    subject: z.string().max(60).optional(),
    grade: z.number().int().min(1).max(12),
  })
  .refine((v) => v.image || v.correctedText, "נדרשת תמונה או טקסט מתוקן");
export type VisionRequest = z.infer<typeof visionRequestSchema>;

export const visionResultSchema = z.object({
  readable: z.boolean(),
  detected: z.string().max(400).default(""),
  questionText: z.string().max(4000).default(""),
  topic: z.string().max(120).default(""),
  hint: z.string().max(2000).default(""),
  steps: z.array(z.string().max(2000)).max(20).default([]),
  finalAnswer: z.string().max(2000).default(""),
  confidence: z.enum(["high", "medium", "low"]).default("low"),
  note: z.string().max(1000).default(""),
});
export type VisionResult = z.infer<typeof visionResultSchema>;

const common = { grade: z.number().int().min(1).max(12), subject: z.string().max(60).optional(), materials: materialsField, text: z.string().max(12_000).optional() };

export const generateRequestSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("summary"), summaryType: z.enum(["short", "detailed", "bullets", "keywords", "examSheet", "qa"]), ...common }),
  z.object({ kind: z.literal("flashcards"), count: z.number().int().min(1).max(20), topic: z.string().max(120).optional(), ...common }),
  z.object({
    kind: z.literal("questions"),
    count: z.number().int().min(1).max(12),
    types: z.array(z.enum(["mcq", "tf", "fill", "open"])).min(1),
    difficulty: z.number().int().min(1).max(3),
    topics: z.array(z.string().max(120)).max(12).optional(),
    ...common,
  }),
  z.object({
    kind: z.literal("grade"),
    question: z.string().min(1).max(3000),
    modelAnswer: z.string().max(3000),
    rubric: z.string().max(3000),
    studentAnswer: z.string().min(1).max(4000),
    grade: common.grade,
  }),
]);
export type GenerateRequest = z.infer<typeof generateRequestSchema>;

export const summaryResultSchema = z.object({ title: z.string().max(200), content: z.string().min(1).max(20_000) });
export const flashcardsResultSchema = z.object({
  cards: z.array(z.object({ front: z.string().min(1).max(600), back: z.string().min(1).max(1200), topic: z.string().max(120).optional().default("") })).max(30),
});
export const questionsResultSchema = z.object({
  questions: z.array(
    z.object({
      type: z.enum(["mcq", "tf", "fill", "open"]),
      topic: z.string().max(120).default(""),
      prompt: z.string().min(1).max(3000),
      options: z.array(z.string().max(500)).max(8).default([]),
      answerKey: z.string().min(1).max(3000),
      rubric: z.string().max(3000).default(""),
      explanation: z.string().max(3000).default(""),
      difficulty: z.number().int().min(1).max(3).default(2),
    }),
  ).max(20),
});
export const gradeResultSchema = z.object({ score: z.number().min(0).max(100), feedback: z.string().min(1).max(2000) });
