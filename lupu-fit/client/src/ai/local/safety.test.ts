import { describe, expect, it } from 'vitest';
import { PROFILE, call, makeApp, register } from '../../../../server/test/helpers.ts';
import type { BridgeRes } from './bridge.ts';
import { limitWords } from './generate.ts';
import { LocalFirstAiProvider } from './workerProvider.ts';

/** The REAL coach route with the on-device provider plugged in: safety shield, snapshot-only prompt and the rules fallback must be untouched. */
async function rig(answer: (system: string) => string | null) {
  const asked: { system: string; kind: string }[] = [];
  const p: LocalFirstAiProvider = new LocalFirstAiProvider(undefined, (m) => {
    const r = m as { id: number; kind: string; input: { system: string } };
    asked.push({ system: r.input.system, kind: r.kind });
    const text = answer(r.input.system);
    queueMicrotask(() => p.handle((text === null ? { type: 'localai.res', id: r.id, ok: false, cloud: false, code: 'generation_failed' } : { type: 'localai.res', id: r.id, ok: true, text }) as BridgeRes));
  });
  p.handle({ type: 'localai.state', local: true });
  const deps = { get ai() { return p.available ? p : undefined; } };
  const t = await makeApp(deps as never);
  const c = await register(t); await call(t, c, 'PUT', '/api/profile', PROFILE);
  const th = (await call(t, c, 'POST', '/api/coach/threads', {})).json.id as string;
  return { t, c, th, asked, p };
}

describe('coach safety with the on-device provider', () => {
  it('crisis messages are answered by the deterministic shield and the model is never asked', async () => {
    const { t, c, th, asked } = await rig(() => 'MODEL SHOULD NOT SPEAK');
    const r = await call(t, c, 'POST', `/api/coach/threads/${th}/messages`, { text: 'I want to hurt myself', lang: 'en' });
    expect(r.status).toBe(201); expect(r.json.assistant.provider).toBe('safety'); expect(r.json.assistant.content).not.toContain('MODEL SHOULD NOT SPEAK');
    expect(asked).toHaveLength(0);
  });
  it('normal questions use the same cloud system prompt (150-word rule, snapshot-only) and are stored as provider "local"', async () => {
    const { t, c, th, asked } = await rig(() => 'Protein looks fine.');
    const r = await call(t, c, 'POST', `/api/coach/threads/${th}/messages`, { text: 'how is my protein?', lang: 'en' });
    expect(r.status).toBe(201); expect(r.json.assistant).toMatchObject({ provider: 'local', content: 'Protein looks fine.' });
    expect(asked[0]!.kind).toBe('coach');
    expect(asked[0]!.system).toContain('Use ONLY numbers present in the provided snapshot'); expect(asked[0]!.system).toContain('under 150 words'); expect(asked[0]!.system).toContain('Snapshot (JSON)');
    expect(asked[0]!.system).not.toMatch(/user_a|"username"/); // anonymised snapshot, as on the cloud path
    expect((await call(t, c, 'GET', '/api/coach/status')).json.provider).toBe('local');
  });
  it('local failure in on-device-only mode ends in the rules coach', async () => {
    const { t, c, th } = await rig(() => null);
    const r = await call(t, c, 'POST', `/api/coach/threads/${th}/messages`, { text: 'how is my protein?', lang: 'en' });
    expect(r.status).toBe(201); expect(r.json.assistant.provider).toBe('rules');
  });
  it('without proxy and without local the AI stays unconfigured (translate keeps its 503)', async () => {
    const p = new LocalFirstAiProvider(undefined, () => undefined);
    const t = await makeApp({ get ai() { return p.available ? p : undefined; } } as never); const c = await register(t);
    const r = await call(t, c, 'POST', '/api/i18n/translate', { target: { code: 'fr', name: 'French' }, keys: { a: 'Hello' } });
    expect(r.status).toBe(503);
    const status = await call(t, c, 'GET', '/api/coach/status'); expect(status.json.provider).toBe('rules');
  });
  it('the 150-word clamp is applied to over-long model output', () => {
    expect(limitWords(Array.from({ length: 300 }, () => 'word').join(' ')).split(' ').length).toBeLessThanOrEqual(151);
  });
});
