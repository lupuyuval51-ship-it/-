import { assert } from './auth';

/** Bounded streaming read also protects chunked requests without Content-Length. */
export async function readLimitedBody(request: Request, limit: number) {
  assert(Number(request.headers.get('content-length') || 0) <= limit, 413, 'הבקשה גדולה מדי. / Request is too large.', 'PAYLOAD_TOO_LARGE');
  const reader = request.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > limit) { await reader.cancel(); assert(false, 413, 'הבקשה גדולה מדי. / Request is too large.', 'PAYLOAD_TOO_LARGE'); }
      chunks.push(chunk.value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks, length);
}
