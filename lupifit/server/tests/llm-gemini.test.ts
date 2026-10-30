import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { LlmError, generateJson, generateText, isLlmConfigured } from '../src/ai/llm';
import { config } from '../src/config';
import { db } from '../src/db/pool';
import { formatContext, loadCoachData } from '../src/modules/coach/context';
import { onboardedUser, startTestServer } from './helpers/server';
import { disableLlm } from './helpers/fakeLlm';

/** A stand-in for the Gemini `generateContent` REST endpoint. */
interface Seen {
  url: string;
  headers: http.IncomingHttpHeaders;
  body: { systemInstruction?: { parts: { text: string }[] }; contents: { role: string; parts: Record<string, unknown>[] }[]; generationConfig: Record<string, unknown> };
}
let server: http.Server;
let url = '';
const seen: Seen[] = [];
let reply: (s: Seen) => { status: number; body: unknown; headers?: Record<string, string> } = () => ({ status: 200, body: {} });

beforeAll(async () => {
  server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      const s: Seen = { url: req.url ?? '', headers: req.headers, body: JSON.parse(raw || '{}') };
      seen.push(s);
      const r = reply(s);
      res.writeHead(r.status, { 'content-type': 'application/json', ...(r.headers ?? {}) });
      res.end(JSON.stringify(r.body));
    });
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(async () => {
  disableLlm();
  config.ai.provider = 'anthropic';
  await new Promise<void>((r) => server.close(() => r()));
});
beforeEach(() => {
  Object.assign(config.ai, { provider: 'gemini', apiKey: 'gemini-test-key', baseUrl: url, model: 'gemini-flash-latest', maxRetries: 0, timeoutMs: 5000 });
  seen.length = 0;
});

const ok = (text: string, finishReason = 'STOP') => ({ status: 200, body: { candidates: [{ content: { parts: [{ text }] }, finishReason }], usageMetadata: { promptTokenCount: 11, candidatesTokenCount: 7 }, modelVersion: 'gemini-x' } });

describe('Gemini provider', () => {
  it('is configured with a key and sends system prompt, merged turns and the key header', async () => {
    expect(isLlmConfigured()).toBe(true);
    reply = () => ok('Hello athlete');
    const res = await generateText({ system: 'You are a coach', messages: [{ role: 'assistant', content: 'dropped' }, { role: 'user', content: 'a' }, { role: 'user', content: 'b' }, { role: 'assistant', content: 'c' }, { role: 'user', content: 'd' }] });
    expect(res).toMatchObject({ text: 'Hello athlete', model: 'gemini-x', inputTokens: 11, outputTokens: 7, usedFallback: false });
    const s = seen[0]!;
    expect(s.url).toBe('/v1beta/models/gemini-flash-latest:generateContent');
    expect(s.headers['x-goog-api-key']).toBe('gemini-test-key');
    expect(s.body.systemInstruction?.parts[0]?.text).toBe('You are a coach');
    expect(s.body.contents).toEqual([
      { role: 'user', parts: [{ text: 'a\n\nb' }] },
      { role: 'model', parts: [{ text: 'c' }] },
      { role: 'user', parts: [{ text: 'd' }] },
    ]);
    expect(s.body.generationConfig.maxOutputTokens).toBe(8192);
  });

  it('asks for JSON with the schema, validates it, and rejects invalid output', async () => {
    const schema = { type: 'object', properties: { n: { type: 'number' } }, required: ['n'] };
    reply = () => ok('{"n": 3}');
    const res = await generateJson({ system: 's', messages: [{ role: 'user', content: 'x' }], jsonSchema: schema, validator: z.object({ n: z.number() }) });
    expect(res.data).toEqual({ n: 3 });
    expect(seen[0]!.body.generationConfig).toMatchObject({ responseMimeType: 'application/json', responseJsonSchema: schema });
    reply = () => ok('{"n": "three"}');
    await expect(generateJson({ system: 's', messages: [{ role: 'user', content: 'x' }], jsonSchema: schema, validator: z.object({ n: z.number() }) })).rejects.toMatchObject({ kind: 'bad_response' });
    reply = () => ok('{"n": 3', 'MAX_TOKENS');
    await expect(generateJson({ system: 's', messages: [{ role: 'user', content: 'x' }], jsonSchema: schema, validator: z.object({ n: z.number() }) })).rejects.toMatchObject({ kind: 'bad_response' });
  });

  it('sends a photo as inline data', async () => {
    reply = () => ok('{"n": 1}');
    await generateJson({ system: 's', messages: [{ role: 'user', content: 'what is this' }], image: { base64: 'AAAA', mediaType: 'image/jpeg' }, jsonSchema: { type: 'object' }, validator: z.object({ n: z.number() }) });
    expect(seen[0]!.body.contents[0]!.parts).toEqual([{ inlineData: { mimeType: 'image/jpeg', data: 'AAAA' } }, { text: 'what is this' }]);
  });

  it('maps safety blocks, auth, rate limits, bad requests and server errors to typed errors', async () => {
    const cases: [() => { status: number; body: unknown; headers?: Record<string, string> }, string][] = [
      [() => ok('', 'SAFETY'), 'refused'],
      [() => ({ status: 200, body: { promptFeedback: { blockReason: 'SAFETY' } } }), 'refused'],
      [() => ({ status: 403, body: { error: { message: 'bad key' } } }), 'auth'],
      [() => ({ status: 429, body: {}, headers: { 'retry-after': '9' } }), 'rate_limited'],
      [() => ({ status: 400, body: {} }), 'invalid_request'],
      [() => ({ status: 503, body: {} }), 'unavailable'],
      [() => ok(''), 'bad_response'],
    ];
    for (const [r, kind] of cases) {
      reply = r;
      const err = await generateText({ system: 's', messages: [{ role: 'user', content: 'x' }] }).catch((e: unknown) => e);
      expect(err, kind).toBeInstanceOf(LlmError);
      expect((err as LlmError).kind, kind).toBe(kind);
    }
    reply = () => ({ status: 429, body: {}, headers: { 'retry-after': '9' } });
    const err = (await generateText({ system: 's', messages: [{ role: 'user', content: 'x' }] }).catch((e: unknown) => e)) as LlmError;
    expect(err.retryAfterSeconds).toBe(9);
  });

  it('retries temporary failures up to AI_MAX_RETRIES', async () => {
    config.ai.maxRetries = 1;
    let n = 0;
    reply = () => (n++ === 0 ? { status: 503, body: {} } : ok('second try'));
    expect((await generateText({ system: 's', messages: [{ role: 'user', content: 'x' }] })).text).toBe('second try');
    expect(seen).toHaveLength(2);
  });

  it('is not configured without a key and leaves the name out of the coach context', async () => {
    const test = await startTestServer();
    try {
      const c = await onboardedUser(test.baseUrl);
      await c.patch('/api/settings', { displayName: 'Dana Secretname' });
      const data = await loadCoachData(db, c.userId!);
      expect(formatContext(data, 'en')).not.toContain('Dana Secretname');
      config.ai.provider = 'anthropic';
      expect(formatContext(data, 'en')).toContain('Dana Secretname');
      config.ai.provider = 'gemini';
      config.ai.apiKey = '';
      expect(isLlmConfigured()).toBe(false);
    } finally {
      await test.close();
    }
  });
});
