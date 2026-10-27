import { blobStore } from "./blobs";

/** מתאם אחסון מרוחק (Supabase Storage). מוגדר רק כשהמשתמש מחובר. */
export interface RemoteFiles {
  upload(id: string, blob: Blob): Promise<void>;
  download(id: string): Promise<Blob | null>;
  remove(id: string): Promise<void>;
}

let remote: RemoteFiles | null = null;

export function setRemoteFiles(r: RemoteFiles | null) {
  remote = r;
}

/** שמירת קובץ: תמיד מקומית (IndexedDB), ובנוסף לדלי הפרטי כשמחוברים */
export async function saveFile(id: string, blob: Blob): Promise<void> {
  await blobStore.put(id, blob);
  remote?.upload(id, blob).catch(() => {
    /* ינוסה שוב בסנכרון הבא */
  });
}

/** טעינת קובץ: מקומית, ואם חסר – מהענן (ושמירה מקומית) */
export async function loadFile(id: string): Promise<Blob | null> {
  try {
    const local = await blobStore.get(id);
    if (local) return local;
  } catch {
    /* ממשיכים לענן */
  }
  if (!remote) return null;
  try {
    const b = await remote.download(id);
    if (b) await blobStore.put(id, b).catch(() => {});
    return b;
  } catch {
    return null;
  }
}

export async function deleteFile(id: string): Promise<void> {
  await blobStore.delete(id).catch(() => {});
  await remote?.remove(id).catch(() => {});
}
