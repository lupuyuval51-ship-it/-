import { aiErrorToResponse, errorResponse, guardAiRequest, readJson } from "@/services/ai/guard";
import { getProvider, maxOutputTokens } from "@/services/ai";
import { buildTutorSystemPrompt } from "@/services/ai/prompts";
import { chatRequestSchema } from "@/services/ai/schemas";
import { renderMaterialsForPrompt } from "@/services/ai/retrieval";
import { AI_ERROR_HE, AiError, type AiMessage } from "@/services/ai/provider";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 28_000_000;

/**
 * שיחה עם המורה AI. התשובה מוזרמת כ-NDJSON: {"t":"delta","v":"..."} ... {"t":"done"} או {"t":"error","code","message"}.
 * מפתח ה-API נשאר בשרת בלבד.
 */
export async function POST(req: Request) {
  const guard = await guardAiRequest(req, { maxBytes: MAX_BYTES, scope: "chat" });
  if (!guard.ok) return guard.response;
  const provider = getProvider();
  if (!provider) return errorResponse("not_configured", undefined, 503);

  const raw = await readJson(req, MAX_BYTES);
  if (!raw.ok) return raw.response;
  const parsed = chatRequestSchema.safeParse(raw.body);
  if (!parsed.success) return errorResponse("invalid", `בקשה לא תקינה: ${parsed.error.issues[0]?.message ?? ""}`);
  const body = parsed.data;

  const system = buildTutorSystemPrompt({
    grade: body.grade, subject: body.subject, topic: body.topic, mode: body.mode, level: body.level,
    hasMaterials: !!body.materials?.length, hasImages: !!body.images?.length,
  });

  // החומרים והתמונות מצורפים להודעת המשתמש האחרונה בלבד
  const messages: AiMessage[] = body.messages.map((m, i) => {
    const isLast = i === body.messages.length - 1 && m.role === "user";
    if (!isLast) return { role: m.role, content: m.content };
    const parts: AiMessage["content"] = [];
    for (const img of body.images ?? []) parts.push({ type: "image", mediaType: img.mediaType, data: img.data.replace(/\s/g, "") });
    const materials = renderMaterialsForPrompt(body.materials);
    parts.push({ type: "text", text: materials ? `${materials}\n\nשאלת התלמיד:\n${m.content}` : m.content });
    return { role: "user", content: parts };
  });
  if (messages[0].role !== "user") messages.unshift({ role: "user", content: "(המשך שיחה)" });

  const encoder = new TextEncoder();
  const line = (o: unknown) => encoder.encode(`${JSON.stringify(o)}\n`);
  const iterator = provider.stream({ system, messages, maxTokens: maxOutputTokens(), temperature: 0.4, signal: req.signal });

  // מושכים את הנתח הראשון לפני פתיחת התגובה, כדי להחזיר סטטוס שגיאה אמיתי (429/503) ולא 200 עם שגיאה בתוך הזרם
  let first: IteratorResult<string, void>;
  try {
    first = await iterator.next();
  } catch (e) {
    return aiErrorToResponse(e);
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (!first.done) controller.enqueue(line({ t: "delta", v: first.value }));
        for (;;) {
          const n = await iterator.next();
          if (n.done) break;
          controller.enqueue(line({ t: "delta", v: n.value }));
        }
        controller.enqueue(line({ t: "done" }));
      } catch (e) {
        const code = e instanceof AiError ? e.code : "upstream";
        controller.enqueue(line({ t: "error", code, message: aiMessage(code) }));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" } });
}

function aiMessage(code: string) {
  return (AI_ERROR_HE as Record<string, string>)[code] ?? AI_ERROR_HE.upstream;
}
