/**
 * The device database's storage in the browser: PGlite keeps its data directory in an IndexedDB database
 * named after the mount point (`/pglite/<data dir>`). "Erase all data on this phone" deletes it while the
 * worker holds the single-instance lock and the database is closed, so nothing can be using it.
 */

/** IndexedDB database names that belong to the device database `dataDir` (e.g. `lupufit-device`). */
export async function storageNames(dataDir: string, idb: IDBFactory = indexedDB): Promise<string[]> {
  const names = new Set([`/pglite/${dataDir}`]);
  try {
    // Chromium (and the Android WebView) lists them; others fall back to the known name.
    for (const info of (await idb.databases?.()) ?? []) if (info.name && (info.name === dataDir || info.name.endsWith(`/${dataDir}`))) names.add(info.name);
  } catch {
    /* listing is optional */
  }
  return [...names];
}

function deleteDatabase(idb: IDBFactory, name: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`deleting ${name} is blocked by an open connection`)), timeoutMs);
    const req = idb.deleteDatabase(name);
    req.onsuccess = () => {
      clearTimeout(timer);
      resolve();
    };
    req.onerror = () => {
      clearTimeout(timer);
      reject(req.error ?? new Error(`deleting ${name} failed`));
    };
    // onblocked: another connection is still open; the request completes once it closes (or times out).
  });
}

/** Deletes the stored device database. Rejects when it could not be deleted (the page retries at the next start). */
export async function deleteDeviceStorage(dataDir: string, { idb = indexedDB, timeoutMs = 10_000 }: { idb?: IDBFactory; timeoutMs?: number } = {}): Promise<void> {
  for (const name of await storageNames(dataDir, idb)) await deleteDatabase(idb, name, timeoutMs);
}

/** `idb://lupufit-device` → `lupufit-device` (the PGlite data directory of a connection string). */
export function idbDataDir(connectionString: string): string | null {
  const m = /^idb:\/\/(.+)$/.exec(connectionString.trim());
  return m ? m[1]! : null;
}
