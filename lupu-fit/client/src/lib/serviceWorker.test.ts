import { describe, expect, it, vi } from 'vitest';
import { setupServiceWorker } from './serviceWorker.ts';

function fakeSw(regs: { unregister: () => Promise<boolean> }[] = []) {
  return { serviceWorker: { register: vi.fn(async () => ({})), getRegistrations: vi.fn(async () => regs) } } as unknown as Pick<Navigator, 'serviceWorker'>;
}
function fakeCaches(keys: string[]) {
  const deleted: string[] = [];
  return { store: { keys: async () => keys, delete: async (k: string) => { deleted.push(k); return true; } } as unknown as CacheStorage, deleted };
}

describe('service worker policy', () => {
  it('browser (hosted or the device build as a web page): registers /sw.js', async () => {
    const nav = fakeSw();
    expect(await setupServiceWorker({ prod: true, device: true, native: false }, nav)).toBe('registered');
    expect(nav.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
  });
  it('Android app: never registers one, removes the registrations and lupu caches an earlier build left, keeps foreign caches', async () => {
    const unregister = vi.fn(async () => true);
    const nav = fakeSw([{ unregister }, { unregister }]);
    const c = fakeCaches(['lupu-shell-v2', 'lupu-video-cache', 'lupu-meta', 'someone-else']);
    expect(await setupServiceWorker({ prod: true, device: true, native: true }, nav, c.store)).toBe('removed');
    expect(nav.serviceWorker.register).not.toHaveBeenCalled();
    expect(unregister).toHaveBeenCalledTimes(2);
    expect(c.deleted).toEqual(['lupu-shell-v2', 'lupu-video-cache', 'lupu-meta']);
  });
  it('dev builds and browsers without service workers are left alone', async () => {
    const nav = fakeSw();
    expect(await setupServiceWorker({ prod: false, device: false, native: false }, nav)).toBe('skipped');
    expect(await setupServiceWorker({ prod: true, device: false, native: false }, undefined)).toBe('skipped');
    expect(nav.serviceWorker.register).not.toHaveBeenCalled();
  });
  it('a failing registration is not an error', async () => {
    const nav = { serviceWorker: { register: vi.fn(async () => { throw new Error('insecure'); }), getRegistrations: vi.fn() } } as unknown as Pick<Navigator, 'serviceWorker'>;
    expect(await setupServiceWorker({ prod: true, device: false, native: false }, nav)).toBe('skipped');
  });
});
