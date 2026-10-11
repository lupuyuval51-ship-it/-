import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegistry, isOpenChatModel, normalizeModel, paramsFromName } from '../src/registry.js';
import { familyOf } from '../src/families.js';
import { FAKE_CATALOG, fakeFetch, rawModel, startMockUpstream, close } from './helpers.js';
import { providerDefs } from '../src/providers.js';

test('paramsFromName reads total and active sizes', () => {
  assert.deepEqual(paramsFromName('Qwen/Qwen3.6-35B-A3B'), { total: 35, active: 3 });
  assert.deepEqual(paramsFromName('qwen/qwen3.8-2.4t-a95b'), { total: 2400, active: 95 });
  assert.deepEqual(paramsFromName('openai/gpt-oss-120b'), { total: 120, active: null });
  assert.deepEqual(paramsFromName('xiaomi/mimo-v2.6-flash'), { total: null, active: null });
});

test('families: Kimi, Qwen and DeepSeek are recognised and pinned first', () => {
  assert.equal(familyOf('moonshotai/kimi-k3').label, 'Kimi');
  assert.equal(familyOf('qwen/qwen3').label, 'Qwen');
  assert.equal(familyOf('deepseek/deepseek-v4-pro').label, 'DeepSeek');
  assert.equal(familyOf('qwen3:8b').id, 'qwen'); // Ollama style tag, no org prefix
  assert.equal(familyOf('kimi-k2:latest').id, 'moonshotai');
  assert.ok(familyOf('qwen/x').order < familyOf('mistralai/x').order);
  assert.equal(familyOf('some-lab/model').label, 'Some Lab');
});

test('only open-weight text models are accepted', () => {
  const ok = FAKE_CATALOG.filter(r => isOpenChatModel(r)).map(r => r.id);
  assert.deepEqual(ok, ['qwen/qwen3.8-27b', 'deepseek/deepseek-v4-pro', 'moonshotai/kimi-k3', 'qwen/qwen3.8-27b:free']);
});

test('normalizeModel converts prices to USD per million tokens and detects capabilities', () => {
  const m = normalizeModel(rawModel('qwen/qwen3.8-27b', 'Qwen/Qwen3.8-27B', { architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] } }), { license: 'apache-2.0', paramsB: 27.8 });
  assert.equal(m.name, 'qwen3.8-27b');
  assert.deepEqual(m.pricing, { promptPerM: 0.5, completionPerM: 1 });
  assert.equal(m.capabilities.vision, true);
  assert.equal(m.capabilities.tools, true);
  assert.equal(m.license, 'apache-2.0');
  assert.equal(m.paramsB, 27.8);
  assert.equal(m.hfUrl, 'https://huggingface.co/Qwen/Qwen3.8-27B');
});

test('refresh builds the catalog; :free variants stay separate entries flagged free', async () => {
  const reg = createRegistry({ fetchImpl: fakeFetch() });
  const st = await reg.refresh();
  assert.equal(st.source, 'live');
  assert.equal(reg.list().length, 4);
  assert.equal(reg.get('qwen/qwen3.8-27b:free').free, true);
  assert.equal(reg.get('qwen/qwen3.8-27b').free, false);
  assert.equal(reg.list()[0].id, 'moonshotai/kimi-k3', 'newest first');
  assert.deepEqual(reg.families().slice(0, 3).map(f => f.label), ['Qwen', 'DeepSeek', 'Kimi']);
});

test('a failed refresh keeps the last good catalog', async () => {
  const reg = createRegistry({ fetchImpl: fakeFetch() });
  await reg.refresh();
  const broken = createRegistry({ fetchImpl: fakeFetch({ failCatalog: true }), snapshotPath: undefined });
  const st = await broken.refresh();
  assert.equal(st.source, 'empty');
  assert.match(st.lastError, /503/);
  assert.equal(reg.list().length, 4);
});

test('provider catalogs attach routes by Hugging Face id or slug and add provider-only models', async () => {
  const up = await startMockUpstream({ models: ['qwen/qwen3.8-27b', 'Qwen/Qwen3.8-27B', 'llama3.2:3b', 'bge-embed-v2'] });
  try {
    const providers = providerDefs({ CUSTOM_BASE_URL: up.url, OLLAMA_BASE_URL: 'http://127.0.0.1:1/v1' });
    const reg = createRegistry({ providers, fetchImpl: fakeFetch() });
    await reg.refresh();
    const qwen = reg.get('qwen/qwen3.8-27b');
    assert.deepEqual(qwen.routes.map(r => r.provider), ['openrouter', 'custom']);
    const extra = reg.get('custom:llama3.2:3b');
    assert.ok(extra.providerOnly && extra.local);
    assert.equal(extra.family, 'meta-llama');
    assert.equal(extra.paramsB, 3);
    assert.equal(reg.get('custom:bge-embed-v2'), undefined, 'embedding models are not chat models');
    assert.equal(reg.status().providers.ollama.ok, false, 'unreachable local server is reported, not fatal');
  } finally { await close(up.server); }
});
