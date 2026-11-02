import { beforeEach, describe, expect, it } from 'vitest';
import { attachLocalAiBridge, type BridgeRes } from './bridge.ts';
import { LocalModelController, setControllerForTests } from './controller.ts';
import { failWith, makeMock, type MockLocalAi } from './mockPlugin.ts';
import { readModelConfig } from './modelConfig.ts';
import { setLocalEnabled, setLocalTranslate, setMode } from './settings.ts';

function fakeWorker() {
  const sent: unknown[] = []; const ls = new Set<(e: Event) => void>();
  return {
    sent, postMessage: (m: unknown) => { sent.push(m); },
    addEventListener: (_t: string, f: (e: Event) => void) => { ls.add(f); },
    send: (data: unknown) => ls.forEach((f) => f({ data } as unknown as Event)),
  };
}
const flush = () => new Promise((r) => setTimeout(r, 0));
async function setup(st: Parameters<typeof makeMock>[0] = { installed: true, sizeBytes: 1 }): Promise<{ ai: MockLocalAi; w: ReturnType<typeof fakeWorker> }> {
  localStorage.clear();
  const ai = makeMock(st); setControllerForTests(new LocalModelController(ai, readModelConfig({})));
  const w = fakeWorker(); attachLocalAiBridge(w as never, ai); await flush();
  return { ai, w };
}
const ask = async (w: ReturnType<typeof fakeWorker>, kind: 'coach' | 'translate' = 'coach'): Promise<BridgeRes> => {
  const id = Math.floor(Math.random() * 1e6);
  w.send({ type: 'localai.req', id, kind, input: { system: 's', messages: [{ role: 'user', content: 'hi' }] } }); await flush(); await flush();
  return w.sent.find((m) => (m as BridgeRes).type === 'localai.res' && (m as BridgeRes).id === id) as BridgeRes;
};
beforeEach(() => { setControllerForTests(null); });

describe('main-thread bridge', () => {
  it('auto + installed + enabled: answers locally', async () => {
    const { w, ai } = await setup(); setLocalEnabled(true);
    expect(await ask(w)).toMatchObject({ ok: true, text: 'local answer' }); expect(ai.calls.generate).toHaveLength(1);
  });
  it('auto but model not enabled or not installed: tells the worker to use the cloud without touching the model', async () => {
    const a = await setup(); expect(await ask(a.w)).toMatchObject({ ok: false, cloud: true, code: 'policy' }); expect(a.ai.calls.generate).toHaveLength(0);
    const b = await setup({ installed: false }); setLocalEnabled(true); expect(await ask(b.w)).toMatchObject({ ok: false, cloud: true }); expect(b.ai.calls.generate).toHaveLength(0);
  });
  it('local failure in auto => cloud fallback allowed; in on-device only => not allowed', async () => {
    const { w, ai } = await setup(); setLocalEnabled(true); ai.onGenerate = failWith('generation_failed');
    expect(await ask(w)).toMatchObject({ ok: false, cloud: true, code: 'generation_failed' });
    setMode('local'); expect(await ask(w)).toMatchObject({ ok: false, cloud: false, code: 'generation_failed' });
  });
  it('cloud mode never reaches the model', async () => {
    const { w, ai } = await setup(); setLocalEnabled(true); setMode('cloud');
    expect(await ask(w)).toMatchObject({ ok: false, cloud: true }); expect(ai.calls.generate).toHaveLength(0);
  });
  it('translation is local only when the toggle is on', async () => {
    const { w, ai } = await setup(); setLocalEnabled(true);
    expect(await ask(w, 'translate')).toMatchObject({ ok: false, cloud: true }); expect(ai.calls.generate).toHaveLength(0);
    setLocalTranslate(true); expect(await ask(w, 'translate')).toMatchObject({ ok: true });
  });
  it('pushes the usable-state to the worker when settings change', async () => {
    const { w } = await setup(); setLocalEnabled(true); await flush();
    expect(w.sent.filter((m) => (m as { type: string }).type === 'localai.state').pop()).toEqual({ type: 'localai.state', local: true });
    setMode('cloud'); expect(w.sent.filter((m) => (m as { type: string }).type === 'localai.state').pop()).toEqual({ type: 'localai.state', local: false });
    setMode('local'); expect(w.sent.filter((m) => (m as { type: string }).type === 'localai.state').pop()).toEqual({ type: 'localai.state', local: true });
  });
});
