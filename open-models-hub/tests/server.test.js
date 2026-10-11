import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server.js';
import { loadConfig } from '../src/config.js';
import { providerDefs, parseStream } from '../src/providers.js';
import { createRegistry } from '../src/registry.js';
import { createLimiter, validateChat } from '../src/security.js';
import { fakeFetch, startMockUpstream, listen, close } from './helpers.js';

async function boot({ env = {}, upstream } = {}) {
  const up = upstream || await startMockUpstream();
  const fullEnv = { CUSTOM_BASE_URL: up.url, CUSTOM_NAME: 'Mock', OLLAMA_BASE_URL: 'http://127.0.0.1:1/v1', ...env };
  const providers = providerDefs(fullEnv);
  const fetchImpl = fakeFetch();
  const registry = createRegistry({ providers, fetchImpl });
  await registry.refresh();
  const { server } = createApp({ config: { ...loadConfig({}), accessCode: env.HUB_ACCESS_CODE || '' }, providers, registry, fetchImpl });
  const base = await listen(server);
  return { base, up, stop: async () => { await close(server); await close(up.server); } };
}
const post = (base, body, headers = {}) => fetch(`${base}/api/chat`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
const events = async res => (await res.text()).split('\n\n').filter(l => l.startsWith('data:')).map(l => JSON.parse(l.slice(5)));
const chatBody = (extra = {}) => ({ model: 'qwen/qwen3.8-27b', provider: 'custom', messages: [{ role: 'user', content: 'hi' }], ...extra });

test('serves the catalog, providers and the UI with security headers', async () => {
  const s = await boot();
  try {
    const models = await (await fetch(`${s.base}/api/models`)).json();
    assert.equal(models.source, 'live');
    assert.ok(models.models.some(m => m.family === 'moonshotai'));
    const provs = await (await fetch(`${s.base}/api/providers`)).json();
    assert.equal(provs.find(p => p.id === 'custom').status, 'ready');
    assert.equal(provs.find(p => p.id === 'ollama').status, 'unreachable');
    assert.equal(provs.find(p => p.id === 'openrouter').status, 'needs_key');
    const page = await fetch(`${s.base}/`);
    assert.equal(page.status, 200);
    assert.match(page.headers.get('content-security-policy'), /default-src 'none'/);
    assert.equal(page.headers.get('x-content-type-options'), 'nosniff');
  } finally { await s.stop(); }
});

test('static files cannot escape the public directory', async () => {
  const s = await boot();
  try {
    for (const p of ['/..%2fserver.js', '/%2e%2e/package.json', '/..%2f..%2f..%2fetc%2fpasswd']) {
      const r = await fetch(`${s.base}${p}`);
      assert.equal(r.status, 404, p);
    }
  } finally { await s.stop(); }
});

test('chat streams normalized events and forwards the right upstream request', async () => {
  const s = await boot();
  try {
    const res = await post(s.base, chatBody({ params: { temperature: 0.3, max_tokens: 50 } }));
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/event-stream/);
    const evs = await events(res);
    assert.equal(evs[0].type, 'start');
    assert.equal(evs.filter(e => e.type === 'delta').map(e => e.text).join(''), 'Hello');
    assert.equal(evs.find(e => e.type === 'reasoning').text, 'hmm');
    assert.deepEqual(evs.find(e => e.type === 'usage').usage, { prompt: 3, completion: 2 });
    assert.equal(evs.at(-1).type, 'done');
    const sent = s.up.seen[0].body;
    assert.equal(sent.model, 'qwen/qwen3.8-27b'); // route model id, not the catalog id
    assert.equal(sent.stream, true);
    assert.equal(sent.temperature, 0.3);
    assert.equal(sent.max_tokens, 50);
  } finally { await s.stop(); }
});

test('chat input is validated', async () => {
  const s = await boot();
  try {
    const cases = [
      [{ ...chatBody(), messages: [] }, 'invalid_messages'],
      [{ ...chatBody(), messages: [{ role: 'tool', content: 'x' }] }, 'invalid_messages'],
      [{ ...chatBody(), messages: [{ role: 'assistant', content: 'x' }] }, 'last_message_must_be_user'],
      [{ ...chatBody(), params: { temperature: 9 } }, 'invalid_temperature'],
      [{ ...chatBody(), params: { max_tokens: 99999 } }, 'invalid_max_tokens'],
      [{ ...chatBody(), model: 42 }, 'invalid_model']
    ];
    for (const [body, code] of cases) {
      const r = await post(s.base, body);
      assert.equal(r.status, 400, code);
      assert.equal((await r.json()).error.code, code);
    }
    assert.equal((await post(s.base, chatBody({ model: 'nope/nope' }))).status, 404);
    const big = await fetch(`${s.base}/api/chat`, { method: 'POST', body: 'x'.repeat(300000) });
    assert.equal(big.status, 413);
  } finally { await s.stop(); }
});

test('a model with no usable provider explains what to do', async () => {
  const up = await startMockUpstream();
  const s = await boot({ upstream: up, env: { CUSTOM_BASE_URL: '' } }); // custom absent -> only keyless-less cloud routes
  try {
    const r = await post(s.base, { ...chatBody(), provider: undefined });
    assert.equal(r.status, 400);
    assert.equal((await r.json()).error.code, 'no_route');
    const r2 = await post(s.base, chatBody({ provider: 'openrouter' }));
    assert.equal((await r2.json()).error.code, 'no_provider_key');
  } finally { await s.stop(); }
});

test('access code protects server keys but not requests that bring their own key', async () => {
  const s = await boot({ env: { HUB_ACCESS_CODE: 'letmein', OPENROUTER_API_KEY: 'server-key' } });
  try {
    const denied = await post(s.base, chatBody({ provider: 'openrouter' }));
    assert.equal(denied.status, 401);
    assert.equal((await denied.json()).error.code, 'access_code');
    assert.equal((await post(s.base, chatBody({ provider: 'openrouter' }), { 'x-access-code': 'wrong' })).status, 401);
    assert.equal((await post(s.base, chatBody(), { 'x-access-code': 'letmein' })).status, 200);
    assert.equal((await fetch(`${s.base}/api/refresh`, { method: 'POST' })).status, 401);
    const cfg = await (await fetch(`${s.base}/api/config`)).json();
    assert.equal(cfg.accessRequired, true);
  } finally { await s.stop(); }
});

test('the user key is forwarded upstream and never echoed back', async () => {
  const up = await startMockUpstream();
  const s = await boot({ upstream: up, env: { HUB_ACCESS_CODE: 'letmein' } });
  try {
    const res = await post(s.base, chatBody(), { 'x-provider-key': 'sk-user-secret' });
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(!text.includes('sk-user-secret'));
    assert.equal(up.seen[0].headers.authorization, 'Bearer sk-user-secret');
  } finally { await s.stop(); }
});

test('upstream failures map to clear errors', async () => {
  for (const [status, code, http] of [[401, 'provider_auth', 401], [429, 'provider_rate_limit', 429], [402, 'provider_credits', 402], [500, 'provider_error', 502]]) {
    const up = await startMockUpstream({ status });
    const s = await boot({ upstream: up });
    try {
      const r = await post(s.base, chatBody());
      assert.equal(r.status, http);
      assert.equal((await r.json()).error.code, code);
    } finally { await s.stop(); }
  }
});

test('refresh endpoint has a cooldown', async () => {
  const s = await boot();
  try {
    assert.equal((await fetch(`${s.base}/api/refresh`, { method: 'POST' })).status, 200);
    assert.equal((await fetch(`${s.base}/api/refresh`, { method: 'POST' })).status, 429);
  } finally { await s.stop(); }
});

test('parseStream handles split chunks, comments, errors and CRLF', async () => {
  const enc = new TextEncoder();
  const payload = ': PROCESSING\r\n\r\ndata: {"choices":[{"delta":{"content":"a"}}]}\r\n\r\ndata: {"choices":[{"delta":{"content":"b"}}]}\n\ndata: {"error":{"message":"boom"}}\n\ndata: [DONE]\n\n';
  async function* chunks() { for (let i = 0; i < payload.length; i += 7) yield enc.encode(payload.slice(i, i + 7)); }
  const out = [];
  for await (const e of parseStream(chunks())) out.push(e);
  assert.deepEqual(out, [{ type: 'delta', text: 'a' }, { type: 'delta', text: 'b' }, { type: 'error', message: 'boom' }]);
});

test('rate limiter and validator unit checks', () => {
  let t = 0;
  const lim = createLimiter({ max: 2, windowMs: 1000, now: () => t });
  assert.ok(lim('a') && lim('a'));
  assert.equal(lim('a'), false);
  assert.ok(lim('b'));
  t = 1500;
  assert.ok(lim('a'));
  assert.equal(validateChat({ model: 'm', messages: [{ role: 'user', content: 'x' }] }).value.params.max_tokens, 2048);
  assert.equal(validateChat({ model: 'm', messages: [{ role: 'user', content: 'x'.repeat(20001) }] }).error, 'invalid_messages');
});
