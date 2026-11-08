import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import { createApiHandler, parseGenerateBody, type ApiHandler } from '../server/api.ts';
import { createAnthropicBackend } from '../server/backend.ts';
import { readConfig, type ServerConfig } from '../server/config.ts';
import { validateAdventure } from '../shared/validate.ts';
import { startMockAnthropic, type MockMode } from '../e2e/mockAnthropic.ts';
import type { Adventure } from '../shared/types.ts';

const prefs = { minutes: 30, budget: 0, setting: 'outside', company: 'solo', mood: 'curious', weirdness: 2 };

function config(overrides: Partial<ServerConfig> = {}): ServerConfig {
  return { ...readConfig({}), apiKey: 'test-key', ...overrides };
}

async function listen(handler: ApiHandler): Promise<{ url: string; server: Server }> {
  const server = createServer((req, res) => void handler(req, res));
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
  const addr = server.address();
  return { url: `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`, server };
}

async function readSse(res: Response): Promise<{ event: string; data: any }[]> {
  const text = await res.text();
  return text
    .split('\n\n')
    .filter((block) => block.includes('event:'))
    .map((block) => {
      const event = /event: (.+)/.exec(block)![1];
      const data = JSON.parse(/data: (.+)/.exec(block)![1]);
      return { event, data };
    });
}

const silent = () => {};

async function setup(mode: MockMode, overrides: Partial<ServerConfig> = {}) {
  const mock = await startMockAnthropic({ mode, chunkDelayMs: 0 });
  const cfg = config({ baseURL: mock.url, maxRetries: 0, ...overrides });
  const handler = createApiHandler({ config: cfg, backend: createAnthropicBackend(cfg), log: silent });
  const app = await listen(handler);
  return { mock, handler, app, close: async () => { app.server.close(); await mock.close(); } };
}

describe('real SDK against an Anthropic-compatible mock', () => {
  let env: Awaited<ReturnType<typeof setup>>;
  beforeAll(async () => {
    env = await setup('ok');
  });
  afterAll(async () => env.close());

  it('reports online only after a verified key', async () => {
    const res = await fetch(`${env.app.url}/api/status`);
    const body = await res.json();
    expect(body.state).toBe('online');
    expect(body.canGenerate).toBe(true);
    expect(JSON.stringify(body)).not.toContain('test-key');
    const verify = env.mock.requests.find((r) => r.path.startsWith('/v1/models/'));
    // SDK 1.x sends API keys as a bearer token (API version 2026-10-21).
    expect(verify?.headers.authorization).toBe('Bearer test-key');
  });

  it('streams a validated episode over SSE and sends the right request', async () => {
    const res = await fetch(`${env.app.url}/api/episodes/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prefs, localHour: 14, detail: 'near a big park', avoidKinds: ['detective'] }),
    });
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    const events = await readSse(res);
    const names = events.map((e) => e.event);
    expect(names).toContain('title');
    expect(names.at(-1)).toBe('episode');
    const adventure = events.at(-1)!.data.adventure as Adventure;
    expect(validateAdventure(adventure).ok).toBe(true);
    expect(adventure.source).toBe('ai');
    expect(adventure.minutes).toBeLessThanOrEqual(30);

    const call = env.mock.requests.find((r) => r.path === '/v1/messages')!;
    expect(call.headers['anthropic-beta']).toContain('server-side-fallback-2026-07-01');
    expect(call.body?.fallbacks).toBe('default');
    expect(call.body?.model).toBe('claude-opus-5-5');
    expect(call.body?.stream).toBe(true);
    expect((call.body?.output_config as any).format.type).toBe('json_schema');
    expect((call.body?.output_config as any).effort).toBe('medium');
    expect(call.body).not.toHaveProperty('temperature');
    expect((call.body?.system as any)[0].cache_control).toEqual({ type: 'ephemeral' });
    expect(JSON.stringify(call.body?.messages)).toContain('near a big park');
  });
});

describe('repair, refusal and auth through the SDK', () => {
  it('repairs an invalid first draft', async () => {
    const env = await setup('invalid-then-ok');
    try {
      const res = await fetch(`${env.app.url}/api/episodes/generate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prefs }) });
      const events = await readSse(res);
      expect(events.some((e) => e.event === 'phase' && e.data.phase === 'repairing')).toBe(true);
      expect(events.at(-1)!.event).toBe('episode');
      expect(events.at(-1)!.data.repaired).toBe(true);
    } finally {
      await env.close();
    }
  });

  it('turns a refusal into a clean error event', async () => {
    const env = await setup('refusal');
    try {
      const res = await fetch(`${env.app.url}/api/episodes/generate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prefs }) });
      const events = await readSse(res);
      expect(events.at(-1)).toMatchObject({ event: 'error', data: { code: 'refused' } });
    } finally {
      await env.close();
    }
  });

  it('reports a rejected key accurately and refuses to generate', async () => {
    const env = await setup('auth');
    try {
      const status = await (await fetch(`${env.app.url}/api/status`)).json();
      expect(status.state).toBe('auth_failed');
      expect(status.canGenerate).toBe(false);
      const res = await fetch(`${env.app.url}/api/episodes/generate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prefs }) });
      expect(res.status).toBe(503);
    } finally {
      await env.close();
    }
  });
});

describe('API guards', () => {
  it('is not configured without a key', async () => {
    const handler = createApiHandler({ config: config({ apiKey: null }), backend: null, log: silent });
    const app = await listen(handler);
    try {
      const status = await (await fetch(`${app.url}/api/status`)).json();
      expect(status).toMatchObject({ configured: false, state: 'not_configured', canGenerate: false });
      const res = await fetch(`${app.url}/api/episodes/generate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prefs }) });
      expect(res.status).toBe(503);
    } finally {
      app.server.close();
    }
  });

  it('validates input, origin, method and rate limits', async () => {
    const env = await setup('ok', { rateLimit: { max: 1, windowMs: 60_000 } });
    try {
      const post = (body: unknown, headers: Record<string, string> = {}) =>
        fetch(`${env.app.url}/api/episodes/generate`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
      expect((await post({ prefs: { ...prefs, minutes: 45 } })).status).toBe(400);
      expect((await post({ prefs }, { origin: 'https://evil.example' })).status).toBe(403);
      expect((await fetch(`${env.app.url}/api/episodes/generate`)).status).toBe(405);
      const first = await post({ prefs });
      await first.text();
      expect(first.status).toBe(200);
      const second = await post({ prefs });
      expect(second.status).toBe(429);
      expect(second.headers.get('retry-after')).toBeTruthy();
    } finally {
      await env.close();
    }
  });

  it('parses and sanitizes the request body strictly', () => {
    expect(parseGenerateBody(null).ok).toBe(false);
    expect(parseGenerateBody({ prefs: { ...prefs, mood: 'angry' } }).ok).toBe(false);
    expect(parseGenerateBody({ prefs, localHour: 25 }).ok).toBe(false);
    expect(parseGenerateBody({ prefs, avoidKinds: ['nope'] }).ok).toBe(false);
    const ok = parseGenerateBody({ prefs, detail: '  rainy\u0007 day   by the sea  ', localHour: 9 });
    expect(ok.ok && ok.value.detail).toBe('rainy day by the sea');
  });
});
