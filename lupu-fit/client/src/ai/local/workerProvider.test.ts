import { describe, expect, it } from 'vitest';
import type { AiProvider } from '../../../../server/src/core/types.ts';
import { LocalFirstAiProvider } from './workerProvider.ts';
import type { BridgeRes } from './bridge.ts';

const cloud = (text = 'cloud answer'): AiProvider & { n: number } => ({ name: 'proxy', n: 0, complete() { this.n++; return Promise.resolve(text); } });
/** A pretend main thread that answers every request with `res`. */
function wire(inner: AiProvider | undefined, res: (id: number) => BridgeRes) {
  const posted: unknown[] = [];
  const p: LocalFirstAiProvider = new LocalFirstAiProvider(inner, (m) => { posted.push(m); const id = (m as { id: number }).id; queueMicrotask(() => p.handle(res(id))); });
  return { p, posted };
}
const input = { system: 's', messages: [{ role: 'user' as const, content: 'q' }] };
const ok = (text: string) => (id: number): BridgeRes => ({ type: 'localai.res', id, ok: true, text });
const fail = (cloudOk: boolean) => (id: number): BridgeRes => ({ type: 'localai.res', id, ok: false, cloud: cloudOk, code: 'timeout' });

describe('LocalFirstAiProvider', () => {
  it('is unavailable (routes behave as before: rules coach / 503) with no proxy and no local', () => {
    const { p } = wire(undefined, ok('x')); expect(p.available).toBe(false); expect(p.name).toBe('rules');
  });
  it('local selected: answers on-device and reports provider "local"', async () => {
    const { p, posted } = wire(cloud(), ok('hello from phone')); p.handle({ type: 'localai.state', local: true });
    expect(p.available).toBe(true); expect(await p.complete(input)).toBe('hello from phone'); expect(p.name).toBe('local');
    expect(posted[0]).toMatchObject({ type: 'localai.req', kind: 'coach' });
  });
  it('json requests (translation) are tagged translate', async () => {
    const { p, posted } = wire(undefined, ok('{}')); p.handle({ type: 'localai.state', local: true });
    await p.complete({ ...input, json: true, maxTokens: 8000 }); expect(posted[0]).toMatchObject({ kind: 'translate', input: { json: true, maxTokens: 8000 } });
  });
  it('auto: local failure falls back to the proxy', async () => {
    const c = cloud(); const { p } = wire(c, fail(true)); p.handle({ type: 'localai.state', local: true });
    expect(await p.complete(input)).toBe('cloud answer'); expect(c.n).toBe(1); expect(p.name).toBe('proxy');
  });
  it('auto without a proxy: local failure throws so the route answers with the rules coach', async () => {
    const { p } = wire(undefined, fail(true)); p.handle({ type: 'localai.state', local: true });
    await expect(p.complete(input)).rejects.toThrow('ai_unavailable');
  });
  it('on-device only: a failure never reaches the proxy', async () => {
    const c = cloud(); const { p } = wire(c, fail(false)); p.handle({ type: 'localai.state', local: true });
    await expect(p.complete(input)).rejects.toThrow('local_timeout'); expect(c.n).toBe(0);
  });
  it('local not selected: goes straight to the proxy without a round trip', async () => {
    const c = cloud(); const { p, posted } = wire(c, ok('nope'));
    expect(await p.complete(input)).toBe('cloud answer'); expect(posted).toHaveLength(0);
  });
});
