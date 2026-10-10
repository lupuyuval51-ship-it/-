import { useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";
import { readSyncState, resetSyncState, syncOnce } from "@/lib/offline/sync";
import { browserKV } from "@/lib/offline/store";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";
import { supabaseCloud } from "./api";
import { supabase } from "./client";
import { store } from "../app-state";

export type SyncStatus = "idle" | "syncing" | "ok" | "error";
interface Snapshot { session: Session | null; status: SyncStatus; lastSyncAt: number | null; error: string | null }

let snap: Snapshot = { session: null, status: "idle", lastSyncAt: readSyncState(browserKV()).lastSyncAt, error: null };
const listeners = new Set<() => void>();
const set = (patch: Partial<Snapshot>) => { snap = { ...snap, ...patch }; listeners.forEach((l) => l()); };

export const useAccount = (): Snapshot => useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, () => snap);

let running: Promise<void> | null = null;
/** One sync at a time; never throws (a failure is shown in Settings and the next trigger retries). */
export function syncNow(): Promise<void> {
  const session = snap.session;
  if (!session) return Promise.resolve();
  if (running) return running;
  set({ status: "syncing", error: null });
  running = syncOnce(store, browserKV(), supabaseCloud(supabase), session.user.id)
    .then(() => set({ status: "ok", lastSyncAt: readSyncState(browserKV()).lastSyncAt }))
    .catch((e: unknown) => set({ status: "error", error: e instanceof Error ? e.message : "sync failed" }))
    .finally(() => { running = null; });
  return running;
}

let timer: ReturnType<typeof setTimeout> | undefined;
const later = () => { clearTimeout(timer); timer = setTimeout(() => void syncNow(), 15_000); };

/** Restores a saved sign-in (offline-safe: no network is needed to read it) and wires the automatic triggers. */
export function startAccount(): void {
  void supabase.auth.getSession().then(({ data }) => { set({ session: data.session }); if (data.session) void syncNow(); });
  supabase.auth.onAuthStateChange((_event, session) => set({ session }));
  store.subscribe(() => { if (snap.session) later(); });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && snap.session) void syncNow(); });
  window.addEventListener("online", () => { if (snap.session) void syncNow(); });
}

export type AuthResult = { ok: true; needsConfirmation?: boolean } | { ok: false; message: string };

export async function signUp(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, message: error.message };
  if (!data.session) return { ok: true, needsConfirmation: true };
  void syncNow();
  return { ok: true };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: error.message };
  void syncNow();
  return { ok: true };
}

/** Signing out keeps the games on the phone; the sync marks are forgotten so another account starts clean. */
export async function signOut(): Promise<void> {
  clearTimeout(timer);
  await supabase.auth.signOut();
  resetSyncState(browserKV());
  set({ session: null, status: "idle", lastSyncAt: null, error: null });
}

/** Deletes the account and all its cloud data (edge function with the service role; RLS cascade removes the rows). Local games stay. */
export async function deleteAccount(): Promise<AuthResult> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return { ok: false, message: "not signed in" };
  const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, { method: "POST", headers: { Authorization: `Bearer ${data.session.access_token}`, apikey: SUPABASE_PUBLISHABLE_KEY } });
  if (!res.ok) return { ok: false, message: `delete failed (${res.status})` };
  await signOut();
  return { ok: true };
}
