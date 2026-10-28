import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppData, CollectionName } from "@/types";
import { dataStore } from "./store";
import { COLLECTIONS, diffCollection, fromRow, mergeById, normalizeRemote, toRow, totalRecords } from "./mapping";
import { blobStore } from "./blobs";
import { setRemoteFiles, type RemoteFiles } from "./files";
import { normalizeData } from "./defaults";
import { toast } from "@/lib/bus";

export type SyncState = "off" | "syncing" | "synced" | "error" | "offline";
export interface SyncStatus {
  state: SyncState;
  message?: string;
  lastSyncedAt?: string;
}

const CHUNK = 200;
const PAGE = 1000;
export const BUCKET = "study-files";

type Listener = (s: SyncStatus) => void;

/**
 * סנכרון "מקומי קודם" ל-Supabase: האפליקציה תמיד כותבת לאחסון המקומי (עובד גם offline),
 * ובמקביל משקפת כל שינוי לענן (upsert/delete לפי מזהה). בהתחברות: מושכים, ממזגים (השרת מנצח בקונפליקט),
 * ודוחפים את מה שקיים רק במכשיר. ההרשאות נאכפות על ידי RLS, לא על ידי הקוד הזה.
 */
class SyncEngine {
  private sb: SupabaseClient | null = null;
  private userId = "";
  private unsubChange: (() => void) | null = null;
  private queue: Promise<void> = Promise.resolve();
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private needsFullPush = false;
  private notifiedError = false;
  private listeners = new Set<Listener>();
  status: SyncStatus = { state: "off" };

  subscribe(l: Listener) {
    this.listeners.add(l);
    l(this.status);
    return () => {
      this.listeners.delete(l);
    };
  }

  private set(s: SyncStatus) {
    this.status = s;
    this.listeners.forEach((l) => l(s));
  }

  async start(sb: SupabaseClient, userId: string) {
    if (this.userId === userId && this.unsubChange) return;
    this.stop();
    this.sb = sb;
    this.userId = userId;
    setRemoteFiles(this.remoteFiles());
    this.set({ state: "syncing" });
    // מאזינים לשינויים כבר מההתחלה: שינוי שהמשתמש עושה בזמן שהמשיכה הראשונית רצה לא הולך לאיבוד,
    // כי עדכוני הדחיפה ממתינים בתור עד שהמיזוג הראשוני מסתיים.
    this.unsubChange = dataStore.onChange((prev, next) => this.enqueue(() => this.mirror(prev, next)));
    window.addEventListener("online", this.onOnline);
    window.addEventListener("offline", this.onOffline);
    this.enqueue(async () => {
      await this.initialSync();
      this.set({ state: "synced", lastSyncedAt: new Date().toISOString() });
    });
  }

  stop() {
    this.unsubChange?.();
    this.unsubChange = null;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.onOnline);
      window.removeEventListener("offline", this.onOffline);
    }
    setRemoteFiles(null);
    this.sb = null;
    this.userId = "";
    this.set({ state: "off" });
  }

  private onOnline = () => {
    if (this.needsFullPush) this.retryNow();
    else this.set({ state: "synced", lastSyncedAt: this.status.lastSyncedAt });
  };
  private onOffline = () => this.set({ state: "offline" });

  private enqueue(fn: () => Promise<void>) {
    this.queue = this.queue.then(fn).catch((e) => this.fail(e));
  }

  private fail(e: unknown) {
    const message = e instanceof Error ? e.message : "שגיאת סנכרון";
    this.needsFullPush = true;
    this.set({ state: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error", message, lastSyncedAt: this.status.lastSyncedAt });
    if (!this.notifiedError) {
      this.notifiedError = true;
      toast.error("הסנכרון לענן נכשל", "הנתונים שמורים במכשיר, ונשתדל לסנכרן שוב אוטומטית.");
    }
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => this.retryNow(), 20_000);
  }

  retryNow() {
    if (!this.sb) return;
    this.set({ state: "syncing" });
    this.enqueue(async () => {
      await this.pushAll();
      this.needsFullPush = false;
      this.notifiedError = false;
      this.set({ state: "synced", lastSyncedAt: new Date().toISOString() });
    });
  }

  // ───────── משיכה ומיזוג ─────────
  private async fetchAll<T>(table: string): Promise<T[]> {
    const rows: T[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await this.sb!.from(table).select("*").range(from, from + PAGE - 1);
      if (error) throw new Error(`${table}: ${error.message}`);
      rows.push(...(data as T[]));
      if (!data || data.length < PAGE) break;
    }
    return rows;
  }

  private async initialSync() {
    const sb = this.sb!;
    const [profileRes, ...pulled] = await Promise.all([
      sb.from("profiles").select("*").eq("id", this.userId).maybeSingle(),
      ...COLLECTIONS.map(async ({ name, table }) => ({
        name,
        rows: (await this.fetchAll<Record<string, unknown>>(table)).map((r) => normalizeRemote(fromRow<{ id: string }>(r))),
      })),
    ] as const);
    if (profileRes.error) throw new Error(`profiles: ${profileRes.error.message}`);
    const remoteProfile = profileRes.data ? normalizeRemote(fromRow<NonNullable<AppData["profile"]>>(profileRes.data)) : null;

    // המיזוג מתבצע על המצב הנוכחי (לא על תמונת מצב ישנה), כדי לא לדרוס שינויים שנעשו בזמן המשיכה
    dataStore.update((cur) => {
      const merged: Record<string, unknown> = { ...cur };
      for (const { name, rows } of pulled) {
        merged[name] = dedupeKeys(name, mergeById(cur[name] as { id: string }[], rows), new Set(rows.map((r) => r.id)));
      }
      // פרופיל: השרת מנצח; אחרת הפרופיל המקומי מקבל את מזהה המשתמש המחובר
      merged.profile = remoteProfile ?? (cur.profile ? { ...cur.profile, id: this.userId } : null);
      return normalizeData({ ...merged, meta: cur.meta });
    }, false);
    await this.pushAll();
    await this.pushMissingBlobs(dataStore.getSnapshot());
  }

  // ───────── דחיפה ─────────
  private async upsert(table: string, rows: Record<string, unknown>[]) {
    for (let i = 0; i < rows.length; i += CHUNK) {
      const { error } = await this.sb!.from(table).upsert(rows.slice(i, i + CHUNK), { onConflict: "id" });
      if (error) throw new Error(`${table}: ${error.message}`);
    }
  }

  private async remove(table: string, ids: string[]) {
    for (let i = 0; i < ids.length; i += CHUNK) {
      const { error } = await this.sb!.from(table).delete().in("id", ids.slice(i, i + CHUNK));
      if (error) throw new Error(`${table}: ${error.message}`);
    }
  }

  private profileRow(p: NonNullable<AppData["profile"]>) {
    const row = toRow({ ...p, id: this.userId }, this.userId);
    delete row.user_id;
    return row;
  }

  async pushAll() {
    const d = dataStore.getSnapshot();
    if (d.profile) {
      const { error } = await this.sb!.from("profiles").upsert(this.profileRow(d.profile), { onConflict: "id" });
      if (error) throw new Error(`profiles: ${error.message}`);
    }
    for (const { name, table } of COLLECTIONS) {
      const items = d[name] as object[];
      if (items.length) await this.upsert(table, items.map((i) => toRow(i, this.userId)));
    }
  }

  private async mirror(prev: AppData, next: AppData) {
    if (!this.sb) return;
    if (next.profile && next.profile !== prev.profile) {
      const { error } = await this.sb.from("profiles").upsert(this.profileRow(next.profile), { onConflict: "id" });
      if (error) throw new Error(`profiles: ${error.message}`);
    }
    const removals: [string, string[]][] = [];
    for (const { name, table } of COLLECTIONS) {
      const d = diffCollection(prev[name] as { id: string }[], next[name] as { id: string }[]);
      if (d.upserts.length) await this.upsert(table, d.upserts.map((i) => toRow(i, this.userId)));
      if (d.deletes.length) removals.push([table, d.deletes]);
    }
    // מחיקות בסדר הפוך (ילדים לפני הורים), אחרי כל ההכנסות
    for (const [table, ids] of removals.reverse()) await this.remove(table, ids);
    if (this.status.state !== "synced") {
      this.notifiedError = false;
      this.needsFullPush = false;
    }
    this.set({ state: "synced", lastSyncedAt: new Date().toISOString() });
  }

  // ───────── קבצים ─────────
  private remoteFiles(): RemoteFiles {
    const path = (id: string) => `${this.userId}/${id}`;
    return {
      upload: async (id, blob) => {
        const { error } = await this.sb!.storage.from(BUCKET).upload(path(id), blob, { upsert: true, contentType: blob.type || "application/octet-stream" });
        if (error) throw new Error(error.message);
      },
      download: async (id) => {
        const { data, error } = await this.sb!.storage.from(BUCKET).download(path(id));
        return error ? null : data;
      },
      remove: async (id) => {
        await this.sb!.storage.from(BUCKET).remove([path(id)]);
      },
    };
  }

  private async pushMissingBlobs(d: AppData) {
    try {
      const keys = (await blobStore.keys()).map(String);
      if (!keys.length) return;
      const { data } = await this.sb!.storage.from(BUCKET).list(this.userId, { limit: 1000 });
      const have = new Set((data ?? []).map((f) => f.name));
      const remote = this.remoteFiles();
      for (const id of keys) {
        if (have.has(id)) continue;
        const blob = await blobStore.get(id);
        if (blob) await remote.upload(id, blob).catch(() => {});
      }
      void d;
    } catch {
      /* העלאת קבצים היא best-effort */
    }
  }

  // ───────── חשבון ─────────
  /** מוחק את כל נתוני הענן של המשתמש (שורות וקבצים), בלי למחוק את החשבון עצמו */
  async deleteCloudData() {
    const sb = this.sb;
    if (!sb) return;
    await this.queue;
    for (const { table } of [...COLLECTIONS].reverse()) {
      const { error } = await sb.from(table).delete().eq("user_id", this.userId);
      if (error) throw new Error(`${table}: ${error.message}`);
    }
    await sb.from("profiles").delete().eq("id", this.userId);
    await this.deleteCloudFiles();
  }

  private async deleteCloudFiles() {
    const sb = this.sb!;
    const { data } = await sb.storage.from(BUCKET).list(this.userId, { limit: 1000 });
    const names = (data ?? []).map((f) => `${this.userId}/${f.name}`);
    if (names.length) await sb.storage.from(BUCKET).remove(names);
  }

  /** מחיקת החשבון כולו (פונקציית SQL מאובטחת) לאחר מחיקת הקבצים */
  async deleteAccount() {
    const sb = this.sb;
    if (!sb) return;
    await this.queue;
    await this.deleteCloudFiles();
    const { error } = await sb.rpc("delete_my_account");
    if (error) throw new Error(error.message);
  }

  recordCount() {
    return totalRecords(dataStore.getSnapshot());
  }
}

/** מונע התנגשות באילוצי unique של xp_events/achievements כשנתונים מכמה מכשירים נפגשים */
function dedupeKeys(name: CollectionName, list: { id: string }[], remoteIds: Set<string>): { id: string }[] {
  const keyOf = name === "xpEvents" ? (x: { dedupeKey?: string }) => x.dedupeKey : name === "achievements" ? (x: { key?: string }) => x.key : null;
  if (!keyOf) return list;
  const seen = new Map<string, { id: string }>();
  for (const item of list) {
    const k = keyOf(item as never);
    if (!k) continue;
    const cur = seen.get(k);
    if (!cur || (remoteIds.has(item.id) && !remoteIds.has(cur.id))) seen.set(k, item);
  }
  return [...seen.values()];
}

export const syncEngine = new SyncEngine();
