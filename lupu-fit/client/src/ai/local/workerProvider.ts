import type { AiProvider } from '../../../../server/src/core/types.ts';
import type { AiKind } from './types.ts';
import type { BridgeRes, BridgeState } from './bridge.ts';

type CompleteInput = Parameters<AiProvider['complete']>[0];
type Post = (m: unknown) => void;
const WORKER_WAIT_MS = 160_000;

/**
 * AiProvider used inside the Device Mode worker. It only decides WHERE text comes from (on-device via the main thread, or the
 * optional cloud proxy); the coach/translate routes still run their own safety shield, quotas, snapshot and rules fallback around it.
 */
export class LocalFirstAiProvider implements AiProvider {
  local = false;
  private used: string | null = null;
  private seq = 0;
  private readonly waiting = new Map<number, (r: BridgeRes) => void>();
  describeImage?: AiProvider['describeImage'];
  constructor(private readonly inner: AiProvider | undefined, private readonly post: Post) {
    if (inner?.describeImage) this.describeImage = (i) => inner.describeImage!(i);
  }
  /** Name reported by /api/coach/status and stored with each assistant message. */
  get name(): string { return this.used ?? (this.local ? 'local' : this.inner?.name ?? 'rules'); }
  /** True when a route should treat AI as configured (a proxy exists, or local is selected/installed). */
  get available(): boolean { return !!this.inner || this.local; }
  handle(m: BridgeRes | BridgeState): void {
    if (m.type === 'localai.state') { this.local = m.local; this.used = null; return; }
    const w = this.waiting.get(m.id); if (w) { this.waiting.delete(m.id); w(m); }
  }
  private ask(kind: AiKind, input: CompleteInput): Promise<BridgeRes> {
    const id = ++this.seq;
    return new Promise((resolve) => {
      const t = setTimeout(() => { this.waiting.delete(id); resolve({ type: 'localai.res', id, ok: false, cloud: true, code: 'timeout' }); }, WORKER_WAIT_MS);
      this.waiting.set(id, (r) => { clearTimeout(t); resolve(r); });
      this.post({ type: 'localai.req', id, kind, input: { system: input.system, messages: input.messages, ...(input.maxTokens !== undefined ? { maxTokens: input.maxTokens } : {}), ...(input.json ? { json: true } : {}) } });
    });
  }
  async complete(input: CompleteInput): Promise<string> {
    this.used = null;
    if (this.local) {
      const r = await this.ask(input.json ? 'translate' : 'coach', input);
      if (r.ok) { this.used = 'local'; return r.text; }
      if (!r.cloud) throw new Error(`local_${r.code}`); // "On-device only": no cloud fallback; the route answers with the rules coach
    }
    if (!this.inner) throw new Error('ai_unavailable');
    const out = await this.inner.complete(input);
    this.used = this.inner.name;
    return out;
  }
}
