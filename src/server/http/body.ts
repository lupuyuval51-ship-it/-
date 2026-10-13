import "server-only";
import { ApiError } from "./errors";

const tooLarge = () => new ApiError(413, "PAYLOAD_TOO_LARGE", "The request body is too large.");

/**
 * Read a request body as text without ever holding more than `maxBytes` in memory.
 *
 * `Content-Length` alone is not a limit: chunked uploads do not send it and a client can understate it, while
 * `req.text()` buffers the whole stream before anything can check its size. So the stream itself is counted and
 * cancelled as soon as it goes over, which matters most on the unauthenticated routes (login, register, webhook).
 */
export async function readBodyText(req: Request, maxBytes: number): Promise<string> {
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > maxBytes) throw tooLarge();
  const stream = req.body;
  if (!stream) return "";
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw tooLarge();
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder("utf-8").decode(bytes);
}

/** Does a parsed JSON value nest deeper than `max` levels? Iterative, so a hostile document cannot overflow the stack. */
export function exceedsJsonDepth(value: unknown, max: number): boolean {
  const stack: { v: unknown; d: number }[] = [{ v: value, d: 1 }];
  while (stack.length) {
    const { v, d } = stack.pop()!;
    if (v === null || typeof v !== "object") continue;
    if (d > max) return true;
    for (const child of Array.isArray(v) ? v : Object.values(v)) stack.push({ v: child, d: d + 1 });
  }
  return false;
}
