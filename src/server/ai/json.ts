export type JsonExtract = { ok: true; value: unknown } | { ok: false; error: string };

/**
 * Pull one JSON object out of a model reply. Tolerates markdown fences and stray prose around the object,
 * but never evaluates anything: the text is only ever handed to JSON.parse.
 */
export function extractJson(text: string): JsonExtract {
  let body = text.trim();
  const fenced = body.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) body = fenced[1].trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end <= start) return { ok: false, error: "The reply did not contain a JSON object." };
  try {
    return { ok: true, value: JSON.parse(body.slice(start, end + 1)) };
  } catch (err) {
    return { ok: false, error: `The JSON could not be parsed: ${err instanceof Error ? err.message.slice(0, 160) : "syntax error"}.` };
  }
}
