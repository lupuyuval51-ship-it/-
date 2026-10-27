import { dataStore } from "./store";
import { emptyData } from "./defaults";
import { blobStore } from "./blobs";
import { syncEngine } from "./sync";
import { getSupabase } from "@/lib/supabase/client";

/** ייצוא כל המידע האישי כקובץ JSON (כולל מטא-דאטה של קבצים; הקבצים עצמם זמינים בספרייה) */
export function exportData(): { filename: string; blob: Blob } {
  const d = dataStore.getSnapshot();
  const payload = { exportedAt: new Date().toISOString(), app: "LUPU Study AI", schemaVersion: d.meta.schemaVersion, data: { ...d, meta: undefined } };
  return { filename: `lupu-study-ai-export-${new Date().toISOString().slice(0, 10)}.json`, blob: new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }) };
}

/** מחיקת כל הנתונים במכשיר (ובענן אם מחוברים). החשבון עצמו נשמר. */
export async function eraseAllData(): Promise<void> {
  if (syncEngine.status.state !== "off") await syncEngine.deleteCloudData();
  await blobStore.clear().catch(() => {});
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith("lupu:") && k !== "lupu:theme") localStorage.removeItem(k);
  } catch { /* מתעלמים */ }
  dataStore.replace(emptyData(), false);
}

/** מחיקת החשבון כולו וכל הנתונים המשויכים אליו */
export async function deleteAccountAndData(): Promise<void> {
  await syncEngine.deleteAccount();
  await getSupabase()?.auth.signOut();
  await blobStore.clear().catch(() => {});
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith("lupu:") && k !== "lupu:theme") localStorage.removeItem(k);
  } catch { /* מתעלמים */ }
  dataStore.replace(emptyData(), false);
}
