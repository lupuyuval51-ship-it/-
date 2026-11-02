import { getLocalEnabled, setLocalEnabled } from './settings.ts';
import { getLocalAi } from './plugin.ts';
import { readModelConfig, type ModelConfig } from './modelConfig.ts';
import { LocalAiError, type DownloadProgress, type LocalAi, type LocalStatus } from './types.ts';

/** UI state of the model download, derived purely from status + native progress events (see reduce()). */
export type ModelState =
  | { k: 'loading' }
  | { k: 'unsupported'; reason: string; reasonCode: LocalStatus['reasonCode'] }
  | { k: 'none'; partialBytes: number }
  | { k: 'downloading'; received: number; total: number }
  | { k: 'verifying'; received: number; total: number }
  | { k: 'installed'; sizeBytes: number }
  | { k: 'error'; code: string; partialBytes: number };

export type ModelEvent = { t: 'status'; s: LocalStatus } | { t: 'progress'; p: DownloadProgress } | { t: 'error'; code: string; partialBytes: number } | { t: 'cancelled'; partialBytes: number };

export const INITIAL: ModelState = { k: 'loading' };

export function reduce(state: ModelState, e: ModelEvent): ModelState {
  switch (e.t) {
    case 'status': {
      const s = e.s;
      if (s.installed) return { k: 'installed', sizeBytes: s.sizeBytes };
      if (!s.supported) return { k: 'unsupported', reason: s.reason, reasonCode: s.reasonCode };
      if (s.downloading && (state.k === 'downloading' || state.k === 'verifying')) return state;
      return { k: 'none', partialBytes: s.partialBytes };
    }
    case 'progress': {
      const p = e.p;
      if (state.k === 'installed' || state.k === 'unsupported') return state;
      if (p.phase === 'downloading') return { k: 'downloading', received: p.receivedBytes, total: p.totalBytes };
      if (p.phase === 'verifying') return { k: 'verifying', received: p.receivedBytes, total: p.totalBytes };
      return state; // done/error/cancelled are settled by the call result (status / error / cancelled events)
    }
    case 'error': return state.k === 'installed' || state.k === 'unsupported' ? state : { k: 'error', code: e.code, partialBytes: e.partialBytes };
    case 'cancelled': return { k: 'none', partialBytes: e.partialBytes };
  }
}

/** Why the download button must be disabled (null = can download). */
export function downloadBlocker(s: LocalStatus | null, cfg: ModelConfig, needBytes = Math.ceil(cfg.sizeBytes * 1.2)): 'platform' | 'unsupported' | 'space' | null {
  if (!s || !s.supported) return s && s.reasonCode === 'platform' ? 'platform' : 'unsupported';
  if (s.freeBytes > 0 && s.freeBytes + s.partialBytes < needBytes) return 'space';
  return null;
}

export type Listener = (state: ModelState, status: LocalStatus | null) => void;

export class LocalModelController {
  private state: ModelState = INITIAL; private status: LocalStatus | null = null;
  private readonly subs = new Set<Listener>();
  private off: (() => void) | null = null;
  constructor(private readonly ai: LocalAi = getLocalAi(), readonly config: ModelConfig = readModelConfig()) {}
  get snapshot(): { state: ModelState; status: LocalStatus | null } { return { state: this.state, status: this.status }; }
  subscribe(f: Listener): () => void {
    this.subs.add(f);
    if (this.subs.size === 1) this.off = this.ai.onProgress((p) => this.dispatch({ t: 'progress', p }));
    f(this.state, this.status);
    return () => { this.subs.delete(f); if (this.subs.size === 0) { this.off?.(); this.off = null; } };
  }
  private dispatch(e: ModelEvent): void { this.state = reduce(this.state, e); for (const f of this.subs) f(this.state, this.status); }
  async refresh(): Promise<LocalStatus> {
    const s = await this.ai.status().catch(() => null);
    this.status = s ?? { installed: false, sizeBytes: 0, partialBytes: 0, modelId: '', backend: '', supported: false, reason: 'unavailable', reasonCode: 'runtime', freeBytes: 0, totalRamBytes: 0, downloading: false, loaded: false };
    this.dispatch({ t: 'status', s: this.status });
    // Installed copy vanished (cleared data) while the flag was on: keep the flag consistent.
    if (!this.status.installed && getLocalEnabled() && !this.status.downloading) setLocalEnabled(false);
    return this.status;
  }
  /** Explicit user action only. Enables local AI once the verified install finishes. */
  async start(wifiOnly: boolean): Promise<void> {
    const c = this.config;
    this.dispatch({ t: 'progress', p: { phase: 'downloading', receivedBytes: this.status?.partialBytes ?? 0, totalBytes: c.sizeBytes } });
    try {
      const s = await this.ai.download({ url: c.url, sha256: c.sha256, sizeBytes: c.sizeBytes, wifiOnly, modelId: c.modelId });
      this.status = s; if (s.installed) setLocalEnabled(true);
      this.dispatch({ t: 'status', s });
    } catch (e) {
      const code = e instanceof LocalAiError ? e.code : 'network';
      const s = await this.ai.status().catch(() => null); if (s) this.status = s;
      if (code === 'cancelled') this.dispatch({ t: 'cancelled', partialBytes: s?.partialBytes ?? 0 });
      else this.dispatch({ t: 'error', code, partialBytes: s?.partialBytes ?? 0 });
    }
  }
  async cancel(): Promise<void> { await this.ai.cancelDownload().catch(() => undefined); }
  async remove(): Promise<void> {
    const s = await this.ai.delete().catch(() => null);
    setLocalEnabled(false);
    if (s) { this.status = s; this.state = INITIAL; this.dispatch({ t: 'status', s }); } else await this.refresh();
  }
}

let shared: LocalModelController | null = null;
export const getController = (): LocalModelController => (shared ??= new LocalModelController());
export const setControllerForTests = (c: LocalModelController | null): void => { shared = c; };
