import type { ZodType, ZodTypeDef } from "zod";
import { aiErrorToResponse, errorResponse, guardAiRequest, readJson } from "@/services/ai/guard";
import { getProvider } from "@/services/ai";
import { GENERATE_SYSTEM } from "@/services/ai/prompts";
import { flashcardsResultSchema, generateRequestSchema, gradeResultSchema, questionsResultSchema, summaryResultSchema, type GenerateRequest } from "@/services/ai/schemas";
import { parseModelJson } from "@/services/ai/json";
import { renderMaterialsForPrompt, sanitizeMaterialText } from "@/services/ai/retrieval";
import { AiError, type AiProvider } from "@/services/ai/provider";
import { sanitizeQuestions } from "@/services/ai/sanitize";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 400_000;

const SUMMARY_LABEL = { short: "סיכום קצר (עד פסקה-שתיים)", detailed: "סיכום מפורט", bullets: "נקודות עיקריות", keywords: "מושגי מפתח והגדרותיהם", examSheet: "דף חזרה למבחן (תמציתי, מסודר לפי נושאים)", qa: "שאלות ותשובות" } as const;

async function run<T>(provider: AiProvider, system: string, user: string, schema: ZodType<T, ZodTypeDef, unknown>, maxTokens: number, signal: AbortSignal): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await provider.complete({ system, messages: [{ role: "user", content: user }], maxTokens, temperature: attempt ? 0 : 0.3, signal });
    try {
      return parseModelJson(res.text, schema);
    } catch {
      /* ניסיון חוזר אחד עם טמפרטורה 0 */
    }
  }
  throw new AiError("bad_output", "bad_output", 502);
}

function sourceBlock(body: Extract<GenerateRequest, { materials?: unknown }>): string {
  const mats = renderMaterialsForPrompt(body.materials);
  const text = body.text ? `<study_material id="TEXT" title="טקסט מהמשתמש">\n${sanitizeMaterialText(body.text)}\n</study_material>` : "";
  return [mats, text].filter(Boolean).join("\n");
}

/** יצירת סיכומים, כרטיסיות ושאלות, והערכת תשובות פתוחות – תמיד פלט JSON שמאומת בשרת */
export async function POST(req: Request) {
  const guard = await guardAiRequest(req, { maxBytes: MAX_BYTES, scope: "generate" });
  if (!guard.ok) return guard.response;
  const provider = getProvider();
  if (!provider) return errorResponse("not_configured", undefined, 503);

  const raw = await readJson(req, MAX_BYTES);
  if (!raw.ok) return raw.response;
  const parsed = generateRequestSchema.safeParse(raw.body);
  if (!parsed.success) return errorResponse("invalid", `בקשה לא תקינה: ${parsed.error.issues[0]?.message ?? ""}`);
  const body = parsed.data;

  try {
    switch (body.kind) {
      case "summary": {
        const src = sourceBlock(body);
        if (!src) return errorResponse("invalid", "יש לבחור חומר לימוד או להדביק טקסט כדי ליצור סיכום.");
        const out = await run(provider, GENERATE_SYSTEM.summary(SUMMARY_LABEL[body.summaryType], body.grade, body.subject ?? ""), `${src}\n\nצור את הסיכום המבוקש.`, summaryResultSchema, 3500, req.signal);
        return Response.json(out);
      }
      case "flashcards": {
        const src = sourceBlock(body);
        const topic = body.topic ? `נושא: ${body.topic}\n` : "";
        if (!src && !topic) return errorResponse("invalid", "יש לבחור חומר לימוד, נושא או להדביק טקסט כדי ליצור כרטיסיות.");
        const out = await run(provider, GENERATE_SYSTEM.flashcards(body.grade, body.subject ?? ""), `${src}\n${topic}צור ${body.count} כרטיסיות.`, flashcardsResultSchema, 3000, req.signal);
        return Response.json({ cards: out.cards.slice(0, body.count) });
      }
      case "questions": {
        const src = sourceBlock(body);
        const topics = body.topics?.length ? `נושאים: ${body.topics.join(", ")}\n` : "";
        if (!src && !topics) return errorResponse("invalid", "יש לציין נושאים או לבחור חומר לימוד.");
        const out = await run(
          provider,
          GENERATE_SYSTEM.questions(body.grade, body.subject ?? ""),
          `${src}\n${topics}סוגי שאלות מותרים: ${body.types.join(", ")}. רמת קושי: ${body.difficulty} (1 קל, 2 בינוני, 3 מאתגר). צור ${body.count} שאלות.`,
          questionsResultSchema, 4000, req.signal,
        );
        return Response.json({ questions: sanitizeQuestions(out.questions, body.types).slice(0, body.count) });
      }
      case "grade": {
        const user = `שאלה:\n${body.question}\n\nתשובה לדוגמה:\n${body.modelAnswer}\n\nמחוון:\n${body.rubric || "(לא הוגדר – העריך לפי נכונות והשלמות התשובה)"}\n\n<student_answer>\n${body.studentAnswer.replace(/<\/?student_answer>/gi, "")}\n</student_answer>`;
        const out = await run(provider, GENERATE_SYSTEM.grade(body.grade), user, gradeResultSchema, 800, req.signal);
        return Response.json({ score: Math.round(out.score), feedback: out.feedback });
      }
    }
  } catch (e) {
    return aiErrorToResponse(e);
  }
}
