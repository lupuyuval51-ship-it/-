/**
 * A tiny Anthropic-compatible mock (Models + streaming Messages) so the real SDK
 * code path can be exercised without an API key:
 *   node e2e/mockAnthropic.ts            (listens on MOCK_PORT or 8788)
 * Then run the app with PLOT_TWIST_ANTHROPIC_BASE_URL=http://127.0.0.1:8788 ANTHROPIC_API_KEY=test-key
 */
import { createServer, type IncomingMessage, type Server } from 'node:http';
import { fileURLToPath } from 'node:url';
import { KINDS } from '../shared/constants.ts';
import type { Kind } from '../shared/types.ts';
import { mockAiEpisode } from '../tests/fixtures/aiEpisode.ts';

/**
 * - ok / invalid-then-ok / always-invalid / refusal: the Messages API writes (or refuses) an episode
 * - invalid-then-slow: the first draft is invalid; every later one is valid but streams 10× slower
 *   (a repair round that is still writing when the deadline comes)
 * - auth: every request is rejected with 401
 * - overloaded / rate-limited / server-error: the Messages API answers 529 / 429 / 500
 * - stall: the Messages API sends message_start, then nothing (until the client gives up)
 * - no-headers: the Messages API accepts the request and never answers, not even with headers
 * - verify-error / verify-rate-limited: the Models API answers 500 / 429; messages work
 */
export type MockMode =
  | 'ok'
  | 'invalid-then-ok'
  | 'invalid-then-slow'
  | 'always-invalid'
  | 'refusal'
  | 'auth'
  | 'overloaded'
  | 'rate-limited'
  | 'server-error'
  | 'stall'
  | 'no-headers'
  | 'verify-error'
  | 'verify-rate-limited';

export interface RecordedRequest {
  method: string;
  path: string;
  headers: IncomingMessage['headers'];
  body: Record<string, unknown> | null;
}

export interface MockOptions {
  port?: number;
  mode?: MockMode;
  /** Delay between streamed chunks (ms). */
  chunkDelayMs?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function briefOf(body: Record<string, unknown> | null): string {
  const messages = (body?.messages as { content: unknown }[] | undefined) ?? [];
  return typeof messages[0]?.content === 'string' ? (messages[0].content as string) : '';
}

function availableMinutes(body: Record<string, unknown> | null): number {
  const m = /Available time: (\d+) minutes/.exec(briefOf(body));
  return m ? Number(m[1]) : 30;
}

/** Kinds the brief's "- Kind:" rule says are taken (a compliant model picks another one). */
function avoidedKinds(body: Record<string, unknown> | null): Set<Kind> {
  const line = briefOf(body).split('\n').find((l) => l.startsWith('- Kind:')) ?? '';
  return new Set(KINDS.filter((k) => new RegExp(`\\b${k}\\b`).test(line)));
}

function apiError(status: number, type: string, message: string) {
  return { status, body: JSON.stringify({ type: 'error', error: { type, message } }) };
}

export async function startMockAnthropic(opts: MockOptions = {}): Promise<{ url: string; requests: RecordedRequest[]; close: () => Promise<void>; server: Server }> {
  const mode = opts.mode ?? 'ok';
  const delay = opts.chunkDelayMs ?? 5;
  const requests: RecordedRequest[] = [];
  let messageCalls = 0;

  const server = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const raw = Buffer.concat(chunks).toString('utf8');
    let body: Record<string, unknown> | null = null;
    try {
      body = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
    } catch {
      body = null;
    }
    const path = (req.url ?? '').split('?')[0];
    requests.push({ method: req.method ?? '', path, headers: req.headers, body });

    if (mode === 'auth') {
      res.writeHead(401, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } }));
      return;
    }

    if (req.method === 'GET' && path.startsWith('/v1/models/')) {
      const failure =
        mode === 'verify-error' ? apiError(500, 'api_error', 'Internal server error') : mode === 'verify-rate-limited' ? apiError(429, 'rate_limit_error', 'Rate limited') : null;
      if (failure) {
        res.writeHead(failure.status, { 'content-type': 'application/json' });
        res.end(failure.body);
        return;
      }
      const id = decodeURIComponent(path.slice('/v1/models/'.length));
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ id, type: 'model', display_name: id, created_at: '2026-01-01T00:00:00Z', max_input_tokens: 1000000, max_tokens: 128000 }));
      return;
    }

    if (req.method === 'POST' && path === '/v1/messages') {
      messageCalls++;
      const failure =
        mode === 'overloaded'
          ? apiError(529, 'overloaded_error', 'Overloaded')
          : mode === 'rate-limited'
            ? apiError(429, 'rate_limit_error', 'Rate limited')
            : mode === 'server-error'
              ? apiError(500, 'api_error', 'Internal server error')
              : null;
      if (failure) {
        res.writeHead(failure.status, { 'content-type': 'application/json' });
        res.end(failure.body);
        return;
      }
      if (mode === 'no-headers') return; // the request is read, then nothing: only the client's timers end this
      const minutes = availableMinutes(body);
      const episode = mockAiEpisode(minutes);
      // Like a compliant model: pick a kind the brief did not rule out.
      const avoid = avoidedKinds(body);
      if (avoid.has(episode.kind)) episode.kind = KINDS.find((k) => !avoid.has(k)) ?? episode.kind;
      const firstCall = messageCalls === 1;
      const invalid = mode === 'always-invalid' || ((mode === 'invalid-then-ok' || mode === 'invalid-then-slow') && firstCall);
      if (invalid) episode.stage1.minutes = minutes * 3; // breaks the time constraint → triggers repair
      const chunkDelay = mode === 'invalid-then-slow' && !firstCall ? Math.max(50, delay * 10) : delay;
      const text = JSON.stringify(episode);
      const model = typeof body?.model === 'string' ? body.model : 'claude-opus-5-5';

      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
      res.write(sse('message_start', { type: 'message_start', message: { id: `msg_mock_${messageCalls}`, type: 'message', role: 'assistant', model, content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 1200, output_tokens: 1 } } }));
      if (mode === 'stall') return; // headers and message_start, then silence: only the client's deadline ends this
      // A thinking block first, like a real adaptive-thinking response (display omitted → empty text).
      res.write(sse('content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'thinking', thinking: '', signature: '' } }));
      res.write(sse('content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'signature_delta', signature: 'mock-signature' } }));
      res.write(sse('content_block_stop', { type: 'content_block_stop', index: 0 }));
      if (mode === 'refusal') {
        res.write(sse('message_delta', { type: 'message_delta', delta: { stop_reason: 'refusal', stop_sequence: null }, usage: { output_tokens: 3 } }));
        res.write(sse('message_stop', { type: 'message_stop' }));
        res.end();
        return;
      }
      res.write(sse('content_block_start', { type: 'content_block_start', index: 1, content_block: { type: 'text', text: '' } }));
      for (let i = 0; i < text.length; i += 400) {
        if (res.destroyed) return; // the client gave up
        res.write(sse('content_block_delta', { type: 'content_block_delta', index: 1, delta: { type: 'text_delta', text: text.slice(i, i + 400) } }));
        if (chunkDelay) await sleep(chunkDelay);
      }
      res.write(sse('content_block_stop', { type: 'content_block_stop', index: 1 }));
      res.write(sse('message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: Math.round(text.length / 4) } }));
      res.write(sse('message_stop', { type: 'message_stop' }));
      res.end();
      return;
    }

    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ type: 'error', error: { type: 'not_found_error', message: 'not found' } }));
  });

  await new Promise<void>((r) => server.listen(opts.port ?? 0, '127.0.0.1', () => r()));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    server,
    close: () =>
      new Promise<void>((r) => {
        server.close(() => r());
        server.closeAllConnections(); // a stalled stream would otherwise keep close() waiting
      }),
  };
}

// Run standalone: node e2e/mockAnthropic.ts
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.env.MOCK_PORT ?? 8788);
  const mode = (process.env.MOCK_MODE as MockMode | undefined) ?? 'ok';
  const delay = Number(process.env.MOCK_DELAY_MS ?? 40);
  const mock = await startMockAnthropic({ port, mode, chunkDelayMs: delay });
  console.log(`[mock-anthropic] ${mode} mode on ${mock.url}`);
}
