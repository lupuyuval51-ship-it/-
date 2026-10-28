import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { LlmError, generateJson, generateText, isLlmConfigured } from '../src/ai/llm';
import { config } from '../src/config';
import { disableLlm, startFakeLlm, useFakeLlm, type FakeLlm } from './helpers/fakeLlm';

let fake: FakeLlm;

beforeAll(async () => {
  fake = await startFakeLlm();
  useFakeLlm(fake.url);
});
afterAll(async () => {
  disableLlm();
  await fake.close();
});

describe('LLM adapter', () => {
  it('is not configured without an API key', () => {
    const key = config.ai.apiKey;
    disableLlm();
    expect(isLlmConfigured()).toBe(false);
    return generateText({ system: 's', messages: [{ role: 'user', content: 'hi' }] })
      .then(() => {
        throw new Error('should fail');
      })
      .catch((err) => {
        expect(err).toBeInstanceOf(LlmError);
        expect((err as LlmError).kind).toBe('not_configured');
        useFakeLlm(fake.url, { apiKey: key || 'test-key' });
      });
  });

  it('sends model, effort, system prompt, merged turns and the refusal fallback opt-in', async () => {
    fake.setHandler(() => ({ kind: 'text', text: 'Hello athlete' }));
    const res = await generateText({
      system: 'You are a coach',
      messages: [
        { role: 'assistant', content: 'leading assistant turn is dropped' },
        { role: 'user', content: 'a' },
        { role: 'user', content: 'b' },
      ],
    });
    expect(res.text).toBe('Hello athlete');
    const req = fake.requests.at(-1)!;
    expect(req.model).toBe(config.ai.model);
    expect(req.system).toBe('You are a coach');
    expect(req.messages).toEqual([{ role: 'user', content: 'a\n\nb' }]);
    expect(req.output_config?.effort).toBe(config.ai.effort);
    expect(req.fallbacks).toBe('default');
    expect(String(req.headers['anthropic-beta'])).toContain('server-side-fallback-2026-07-01');
    expect(req.headers['x-api-key']).toBe('test-key');
  });

  it('maps refusals, rate limits, server errors and timeouts to typed errors', async () => {
    const cases: [Parameters<FakeLlm['setHandler']>[0], string][] = [
      [() => ({ kind: 'refusal' }), 'refused'],
      [() => ({ kind: 'error', status: 429, type: 'rate_limit_error', headers: { 'retry-after': '7' } }), 'rate_limited'],
      [() => ({ kind: 'error', status: 500 }), 'unavailable'],
      [() => ({ kind: 'error', status: 401, type: 'authentication_error' }), 'auth'],
      [() => ({ kind: 'error', status: 400, type: 'invalid_request_error' }), 'invalid_request'],
    ];
    for (const [handler, kind] of cases) {
      fake.setHandler(handler);
      const err = await generateText({ system: 's', messages: [{ role: 'user', content: 'x' }] }).catch((e) => e);
      expect(err).toBeInstanceOf(LlmError);
      expect((err as LlmError).kind).toBe(kind);
    }
    useFakeLlm(fake.url, { timeoutMs: 300 });
    fake.setHandler(() => ({ kind: 'hang', ms: 1500 }));
    const timeout = await generateText({ system: 's', messages: [{ role: 'user', content: 'x' }] }).catch((e) => e);
    expect((timeout as LlmError).kind).toBe('timeout');
    useFakeLlm(fake.url);
  });

  it('requests structured output and validates it', async () => {
    const schema = { type: 'object', properties: { grams: { type: 'number' } }, required: ['grams'], additionalProperties: false };
    fake.setHandler(() => ({ kind: 'json', data: { grams: 150 } }));
    const ok = await generateJson({
      system: 's',
      messages: [{ role: 'user', content: 'estimate' }],
      jsonSchema: schema,
      validator: z.object({ grams: z.number().min(1).max(2000) }),
      image: { base64: 'aGVsbG8=', mediaType: 'image/jpeg' },
    });
    expect(ok.data.grams).toBe(150);
    const req = fake.requests.at(-1)!;
    expect(req.output_config?.format).toEqual({ type: 'json_schema', schema });
    const content = req.messages[0]!.content as { type: string }[];
    expect(content[0]!.type).toBe('image');
    expect(content[1]!.type).toBe('text');

    fake.setHandler(() => ({ kind: 'json', data: { grams: 99999 } }));
    const invalid = await generateJson({
      system: 's',
      messages: [{ role: 'user', content: 'x' }],
      jsonSchema: schema,
      validator: z.object({ grams: z.number().max(2000) }),
    }).catch((e) => e);
    expect((invalid as LlmError).kind).toBe('bad_response');

    fake.setHandler(() => ({ kind: 'text', text: 'not json' }));
    const notJson = await generateJson({ system: 's', messages: [{ role: 'user', content: 'x' }], jsonSchema: schema, validator: z.any() }).catch((e) => e);
    expect((notJson as LlmError).kind).toBe('bad_response');
  });
});
