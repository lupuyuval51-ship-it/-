/**
 * Minimal stand-in for the Anthropic Messages API used in tests (no real credentials
 * are available in CI). Point the app at it with `useFakeLlm(server.url)`.
 */
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { resetLlmClient } from '../../src/ai/llm';
import { config } from '../../src/config';

export interface FakeLlmRequest {
  model: string;
  system?: unknown;
  messages: { role: string; content: unknown }[];
  output_config?: { effort?: string; format?: { type: string; schema: unknown } };
  fallbacks?: unknown;
  max_tokens: number;
  headers: http.IncomingHttpHeaders;
}

export type FakeLlmReply =
  | { kind: 'text'; text: string }
  | { kind: 'json'; data: unknown }
  | { kind: 'refusal' }
  | { kind: 'error'; status: number; type?: string; message?: string; headers?: Record<string, string> }
  | { kind: 'hang'; ms: number };

export interface FakeLlm {
  url: string;
  requests: FakeLlmRequest[];
  setHandler(fn: (req: FakeLlmRequest) => FakeLlmReply): void;
  close(): Promise<void>;
}

function messageBody(model: string, content: unknown[], stopReason: string) {
  return {
    id: `msg_test_${Math.random().toString(36).slice(2)}`,
    type: 'message',
    role: 'assistant',
    model,
    content,
    stop_reason: stopReason,
    stop_sequence: null,
    stop_details: stopReason === 'refusal' ? { type: 'refusal', category: null, explanation: 'test refusal' } : null,
    usage: { input_tokens: 42, output_tokens: 17 },
  };
}

export async function startFakeLlm(initial?: (req: FakeLlmRequest) => FakeLlmReply): Promise<FakeLlm> {
  let handler = initial ?? (() => ({ kind: 'text', text: 'Fake coach reply.' }) as FakeLlmReply);
  const requests: FakeLlmRequest[] = [];
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', async () => {
      if (req.method !== 'POST' || !req.url?.startsWith('/v1/messages')) {
        res.writeHead(404).end();
        return;
      }
      const body = JSON.parse(raw || '{}');
      const parsed: FakeLlmRequest = { ...body, headers: req.headers };
      requests.push(parsed);
      const reply = handler(parsed);
      const send = (status: number, payload: unknown, headers: Record<string, string> = {}) => {
        res.writeHead(status, { 'content-type': 'application/json', 'request-id': 'req_test', ...headers });
        res.end(JSON.stringify(payload));
      };
      switch (reply.kind) {
        case 'text':
          return send(200, messageBody(body.model, [{ type: 'text', text: reply.text }], 'end_turn'));
        case 'json':
          return send(200, messageBody(body.model, [{ type: 'text', text: JSON.stringify(reply.data) }], 'end_turn'));
        case 'refusal':
          return send(200, messageBody(body.model, [], 'refusal'));
        case 'error':
          return send(
            reply.status,
            { type: 'error', error: { type: reply.type ?? 'api_error', message: reply.message ?? 'fake error' } },
            reply.headers,
          );
        case 'hang':
          await new Promise((r) => setTimeout(r, reply.ms));
          return send(200, messageBody(body.model, [{ type: 'text', text: 'late' }], 'end_turn'));
      }
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    setHandler(fn) {
      handler = fn;
    },
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

/** Points the LLM adapter at the fake server (no retries, short timeout). */
export function useFakeLlm(url: string, overrides: Partial<typeof config.ai> = {}) {
  Object.assign(config.ai, { apiKey: 'test-key', baseUrl: url, maxRetries: 0, timeoutMs: 5000, provider: 'anthropic' }, overrides);
  resetLlmClient();
}

export function disableLlm() {
  config.ai.apiKey = '';
  resetLlmClient();
}
