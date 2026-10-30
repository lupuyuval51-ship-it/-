/** Deleting the device database's IndexedDB storage ("Erase all data on this phone"), with a fake IndexedDB. */
import { describe, expect, it } from 'vitest';
import { deleteDeviceStorage, idbDataDir, storageNames } from './storage';

interface FakeRequest {
  onsuccess: (() => void) | null;
  onerror: (() => void) | null;
  onblocked: (() => void) | null;
  error: Error | null;
}

function fakeIdb(names: string[], { blocked = false, listing = true } = {}) {
  const deleted: string[] = [];
  const idb = {
    databases: listing ? async () => names.map((name) => ({ name, version: 1 })) : undefined,
    deleteDatabase(name: string) {
      const req: FakeRequest = { onsuccess: null, onerror: null, onblocked: null, error: null };
      setTimeout(() => {
        if (blocked) return req.onblocked?.();
        deleted.push(name);
        req.onsuccess?.();
      }, 0);
      return req;
    },
  };
  return { idb: idb as unknown as IDBFactory, deleted };
}

describe('device storage', () => {
  it('finds the PGlite database of the data directory (and only it)', async () => {
    const { idb } = fakeIdb(['/pglite/lupufit-device', '/pglite/other-app', 'lupufit-device-cache']);
    expect(await storageNames('lupufit-device', idb)).toEqual(['/pglite/lupufit-device']);
    // Without indexedDB.databases(): the known name.
    expect(await storageNames('lupufit-device', fakeIdb([], { listing: false }).idb)).toEqual(['/pglite/lupufit-device']);
  });

  it('deletes it, and fails (instead of hanging) while another connection keeps it open', async () => {
    const ok = fakeIdb(['/pglite/lupufit-device']);
    await deleteDeviceStorage('lupufit-device', { idb: ok.idb });
    expect(ok.deleted).toEqual(['/pglite/lupufit-device']);
    const stuck = fakeIdb(['/pglite/lupufit-device'], { blocked: true });
    await expect(deleteDeviceStorage('lupufit-device', { idb: stuck.idb, timeoutMs: 30 })).rejects.toThrow(/blocked/);
  });

  it('reads the data directory from the device DATABASE_URL', () => {
    expect(idbDataDir('idb://lupufit-device')).toBe('lupufit-device');
    expect(idbDataDir('memory://')).toBeNull();
  });
});
