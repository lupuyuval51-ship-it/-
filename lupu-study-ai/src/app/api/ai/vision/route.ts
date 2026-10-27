import { aiErrorToResponse, errorResponse, guardAiRequest, readJson } from "@/services/ai/guard";
import { getProvider } from "@/services/ai";
import { VISION_SYSTEM, VISION_TEXT_SYSTEM } from "@/services/ai/prompts";
import { visionRequestSchema, visionResultSchema } from "@/services/ai/schemas";
import { parseModelJson } from "@/services/ai/json";
import { AiError, type AiMessage } from "@/services/ai/provider";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 10_000_000;

/** ניתוח תמונת תרגיל (או פתרון מחדש מטקסט מתוקן). אם לא קריא – מוחזר readable=false ללא ניתוח. */
export async function POST(req: Request) {
  const guard = await guardAiRequest(req, { maxBytes: MAX_BYTES, scope: "vision" });
  if (!guard.ok) return guard.response;
  const provider = getProvider();
  if (!provider) return errorResponse("not_configured", undefined, 503);

  const raw = await readJson(req, MAX_BYTES);
  if (!raw.ok) return raw.response;
  const parsed = visionRequestSchema.safeParse(raw.body);
  if (!parsed.success) return errorResponse("invalid", `בקשה לא תקינה: ${parsed.error.issues[0]?.message ?? ""}`);
  const { image, correctedText, subject, grade } = parsed.data;

  const meta = `כיתת התלמיד: ${grade}. מקצוע: ${subject || "לא צוין"}.`;
  const useText = !!correctedText;
  const messages: AiMessage[] = [
    {
      role: "user",
      content: useText
        ? [{ type: "text", text: `${meta}\nנוסח השאלה (תוקן על ידי התלמיד):\n${correctedText}` }]
        : [
            { type: "image", mediaType: image!.mediaType, data: image!.data.replace(/\s/g, "") },
            { type: "text", text: `${meta}\nנתח את התרגיל שבתמונה.` },
          ],
    },
  ];

  try {
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await provider.complete({ system: useText ? VISION_TEXT_SYSTEM : VISION_SYSTEM, messages, maxTokens: 2500, temperature: attempt ? 0 : 0.2, signal: req.signal });
      try {
        const result = parseModelJson(res.text, visionResultSchema);
        // תשובה "קריאה" בלי נוסח שאלה אינה תקינה – מתייחסים אליה כלא קריאה, ולא מציגים ניתוח
        if (result.readable && !(result.questionText ?? "").trim()) {
          return Response.json({ ...result, readable: false, note: result.note || "לא הצלחנו לזהות נוסח שאלה בתמונה." });
        }
        return Response.json(result.readable ? result : { ...result, steps: [], hint: "", finalAnswer: "" });
      } catch (e) {
        lastError = e;
      }
    }
    void lastError;
    throw new AiError("bad_output", "bad_output", 502);
  } catch (e) {
    return aiErrorToResponse(e);
  }
}
