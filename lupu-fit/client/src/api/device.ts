import { NetworkError, type Transport, type TransportRequest, type TransportResponse } from './transport.ts';

type Pending = { resolve: (r: TransportResponse) => void; reject: (e: Error) => void };

/** Device mode: requests are posted to the worker that runs the real API app over PGlite (IndexedDB). */
export class DeviceTransport implements Transport {
  private seq = 0;
  private readonly pending = new Map<number, Pending>();
  private readyResolve!: () => void; private readyReject!: (e: Error) => void;
  readonly ready = new Promise<void>((res, rej) => { this.readyResolve = res; this.readyReject = rej; });
  private readonly fatalListeners = new Set<(e: Error) => void>();
  private fatalError: Error | null = null;
  constructor(private readonly worker: Worker) {
    this.ready.catch(() => undefined); // reported through onFatal; requests still see the rejection
    worker.onmessage = (e: MessageEvent<{ type: string; id?: number; res?: TransportResponse; message?: string }>) => {
      const m = e.data;
      if (m.type === 'ready') this.readyResolve();
      else if (m.type === 'fatal') this.fail(new Error(m.message ?? 'device_boot_failed'));
      else if (m.type === 'res' && m.id !== undefined) { this.pending.get(m.id)?.resolve(m.res as TransportResponse); this.pending.delete(m.id); }
      else if (m.type === 'err' && m.id !== undefined) { this.pending.get(m.id)?.reject(new NetworkError(m.message)); this.pending.delete(m.id); }
    };
    worker.onerror = (e) => this.fail(new Error(e.message));
    worker.postMessage({ type: 'init' });
  }
  /** Boot failed, or the worker could not set up a fresh database after an account deletion (the next launch repairs it). */
  onFatal(fn: (e: Error) => void): () => void {
    this.fatalListeners.add(fn);
    if (this.fatalError) fn(this.fatalError);
    return () => { this.fatalListeners.delete(fn); };
  }
  private fail(err: Error): void {
    this.fatalError = err;
    this.readyReject(err);
    for (const l of [...this.fatalListeners]) l(err);
  }
  async request(r: TransportRequest): Promise<TransportResponse> {
    await this.ready;
    const id = ++this.seq;
    return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.worker.postMessage({ type: 'req', id, req: r }); });
  }
}
