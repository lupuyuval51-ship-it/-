/**
 * Main-thread <-> Device-Mode worker bridge for local generation. The worker (no DOM, no Capacitor) asks the main thread to run
 * the model through the native plugin; the main thread applies the provider policy and answers with text or "use cloud".
 * Worker side: workerProvider.ts. The route code (safety shield, quotas, snapshot, rules fallback) is untouched on both paths.
 */
import { getController } from './controller.ts';
import { generateLocal, type LocalRequest } from './generate.ts';
import { chooseProvider } from './policy.ts';
import { getLocalAi } from './plugin.ts';
import { getLocalEnabled, getLocalTranslate, getMode, subscribeSettings } from './settings.ts';
import type { AiKind, LocalAi } from './types.ts';

export interface BridgeReq { type: 'localai.req'; id: number; kind: AiKind; input: LocalRequest }
export type BridgeRes = { type: 'localai.res'; id: number; ok: true; text: string } | { type: 'localai.res'; id: number; ok: false; cloud: boolean; code: string };
export interface BridgeState { type: 'localai.state'; local: boolean }

export function attachLocalAiBridge(worker: Pick<Worker, 'postMessage' | 'addEventListener'>, ai: LocalAi = getLocalAi()): () => void {
  const ctl = getController();
  const pushState = () => {
    const s = ctl.snapshot.status; const mode = getMode();
    const local = mode === 'local' ? true : mode === 'auto' && !!s && s.installed && s.supported && getLocalEnabled();
    const msg: BridgeState = { type: 'localai.state', local };
    worker.postMessage(msg);
  };
  const reply = (m: BridgeRes) => worker.postMessage(m);
  const onMsg = (e: Event) => {
    const m = (e as MessageEvent<BridgeReq | { type: string }>).data;
    if (!m || m.type !== 'localai.req') return;
    const r = m as BridgeReq;
    void (async () => {
      try {
        const s = await ai.status();
        const choice = chooseProvider({ mode: getMode(), installed: s.installed, supported: s.supported, enabled: getLocalEnabled(), kind: r.kind, translateLocal: getLocalTranslate() });
        if (choice.first === 'cloud') return reply({ type: 'localai.res', id: r.id, ok: false, cloud: true, code: 'policy' });
        try {
          const text = await generateLocal(ai, r.input, r.kind);
          reply({ type: 'localai.res', id: r.id, ok: true, text });
        } catch (err) {
          reply({ type: 'localai.res', id: r.id, ok: false, cloud: choice.fallbackToCloud, code: (err as { code?: string }).code ?? 'generation_failed' });
        }
      } catch { reply({ type: 'localai.res', id: r.id, ok: false, cloud: true, code: 'status_failed' }); }
    })();
  };
  worker.addEventListener('message', onMsg);
  const offCtl = ctl.subscribe(pushState);
  const offSettings = subscribeSettings(pushState);
  void ctl.refresh();
  return () => { offCtl(); offSettings(); (worker as unknown as Worker).removeEventListener?.('message', onMsg); };
}
