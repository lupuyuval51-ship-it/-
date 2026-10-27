/**
 * אחסון קבצים מקומי (PDF ותמונות) ב-IndexedDB. הקבצים נשארים במכשיר ואינם נשלחים לשום שירות
 * אלא אם המשתמש מחובר ל-Supabase (אז הם גם עולים לדלי פרטי) או שולח תמונה לניתוח AI.
 */
const DB_NAME = "lupu-blobs";
const STORE = "files";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB לא זמין"));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export const blobStore = {
  put: (id: string, blob: Blob) => run("readwrite", (s) => s.put(blob, id)).then(() => undefined),
  get: (id: string) => run<Blob | undefined>("readonly", (s) => s.get(id)),
  delete: (id: string) => run("readwrite", (s) => s.delete(id)).then(() => undefined),
  clear: () => run("readwrite", (s) => s.clear()).then(() => undefined),
  keys: () => run<IDBValidKey[]>("readonly", (s) => s.getAllKeys()),
};
