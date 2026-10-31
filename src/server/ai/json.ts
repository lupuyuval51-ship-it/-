export type JsonExtract = { ok: true; value: unknown } | { ok: false; error: string };

const isObject = (v: unknown): boolean => typeof v === "object" && v !== null && !Array.isArray(v);

type Parsed = { ok: true; value: unknown } | { ok: false; message: string };
function parse(text: string): Parsed {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message.slice(0, 160) : "syntax error" };
  }
}

/**
 * The top-level `{…}` spans of a text, in order. Braces inside JSON strings do not count, so a "}" in a question or
 * a "```" in an explanation cannot cut the object short; an unclosed span (a cut-off reply) runs to the end.
 * Spans never overlap, so an inner object of a broken document is never mistaken for the whole game.
 */
function objectSpans(text: string): string[] {
  const spans: string[] = [];
  let start = text.indexOf("{");
  while (start !== -1) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    let end = -1;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (ch === "\\") escaped = true;
        else if (ch === '"') inString = false;
      } else if (ch === '"') inString = true;
      else if (ch === "{") depth++;
      else if (ch === "}" && --depth === 0) {
        end = i;
        break;
      }
    }
    if (end === -1) {
      spans.push(text.slice(start));
      break;
    }
    spans.push(text.slice(start, end + 1));
    start = text.indexOf("{", end + 1);
  }
  return spans;
}

/**
 * Pull one JSON object out of a model reply. Tolerates markdown fences and stray prose (even prose with braces)
 * around the object, but never evaluates anything: the text is only ever handed to JSON.parse. When the reply holds
 * several objects (an example, then the game), the largest one is the answer.
 */
export function extractJson(text: string): JsonExtract {
  const body = text.trim();
  const whole = parse(body);
  if (whole.ok && isObject(whole.value)) return { ok: true, value: whole.value };

  const spans = objectSpans(body);
  if (spans.length === 0) return { ok: false, error: "The reply did not contain a JSON object." };
  // The game is by far the largest object in a reply. When it is broken, its parse error is reported (and sent back
  // to the model), never a small snippet from the prose around it.
  const longest = spans.reduce((a, b) => (b.length > a.length ? b : a));
  const res = parse(longest);
  if (res.ok && isObject(res.value)) return { ok: true, value: res.value };
  return { ok: false, error: `The JSON could not be parsed: ${res.ok ? "the reply is not one JSON object" : res.message}.` };
}
