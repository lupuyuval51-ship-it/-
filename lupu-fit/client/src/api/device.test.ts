import { describe, expect, it, vi } from 'vitest';
import { DeviceTransport } from './device.ts';

class FakeWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;
  sent: unknown[] = [];
  postMessage(m: unknown): void { this.sent.push(m); }
  emit(data: unknown): void { this.onmessage?.({ data } as MessageEvent); }
}

describe('DeviceTransport', () => {
  it('answers the account deletion first and reports a later failed reset through onFatal', async () => {
    const w = new FakeWorker();
    const tr = new DeviceTransport(w as unknown as Worker);
    const fatal = vi.fn();
    tr.onFatal(fatal);
    w.emit({ type: 'ready' });
    const p = tr.request({ method: 'DELETE', path: '/api/account', body: { confirm: 'DELETE' } });
    await Promise.resolve(); await Promise.resolve();
    w.emit({ type: 'res', id: 1, res: { status: 200, body: { ok: true }, headers: {} } });
    w.emit({ type: 'fatal', message: 'device_register_failed:429' });
    await expect(p).resolves.toMatchObject({ status: 200 });
    expect(fatal).toHaveBeenCalledWith(expect.objectContaining({ message: 'device_register_failed:429' }));
  });

  it('reports a boot failure to a listener added later', async () => {
    const w = new FakeWorker();
    const tr = new DeviceTransport(w as unknown as Worker);
    w.emit({ type: 'fatal', message: 'device_login_failed:401' });
    const fatal = vi.fn();
    tr.onFatal(fatal);
    expect(fatal).toHaveBeenCalledTimes(1);
    await expect(tr.ready).rejects.toThrow('device_login_failed:401');
  });
});
