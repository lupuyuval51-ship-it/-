import { NetworkError, type Transport, type TransportRequest, type TransportResponse } from './transport.ts';

type Pending = { resolve: (r: TransportResponse) => void; reject: (e: Error) => void };

/** Device mode: requests are posted to the worker that runs the real API app over PGlite (IndexedDB). */
export class DeviceTransport implements Transport {
  private seq = 0;
  private readonly pending = new Map<number, Pending>();
  private readyResolve!: () => void; private readyReject!: (e: Error) => void;
  readonly ready = new Promise<void>((res, rej) => { this.readyResolve = res; this.readyReject = rej; });
  constructor(private readonly worker: Worker) {
    worker.onmessage = (e: MessageEvent<{ type: string; id?: number; res?: TransportResponse; message?: string }>) => {
      const m = e.data;
      if (m.type === 'ready') this.readyResolve();
      else if (m.type === 'fatal') this.readyReject(new Error(m.message ?? 'device_boot_failed'));
      else if (m.type === 'res' && m.id !== undefined) { this.pending.get(m.id)?.resolve(m.res as TransportResponse); this.pending.delete(m.id); }
      else if (m.type === 'err' && m.id !== undefined) { this.pending.get(m.id)?.reject(new NetworkError(m.message)); this.pending.delete(m.id); }
    };
    worker.onerror = (e) => this.readyReject(new Error(e.message));
    worker.postMessage({ type: 'init' });
  }
  async request(r: TransportRequest): Promise<TransportResponse> {
    await this.ready;
    const id = ++this.seq;
    return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.worker.postMessage({ type: 'req', id, req: r }); });
  }
}
