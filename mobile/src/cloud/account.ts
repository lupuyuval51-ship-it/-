import { useSyncExternalStore } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { readSyncState, resetSyncState, syncOnce } from "@/lib/offline/sync";
import { browserKV } from "@/lib/offline/store";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";
import { supabaseCloud } from "./api";
import { getSupabase, hasSavedSignIn } from "./client";
import { store } from "../app-state";

export type SyncStatus = "idle" | "syncing" | "ok" | "error";
/**
 * `skipped`: local items too large for the cloud (they stay on this phone). `rejected`: cloud items this app could not read
 * (damaged, or made by a newer version) and did not take. Both are 0 when everything moved.
 */
interface Snapshot { session: Session | null; status: SyncStatus; lastSyncAt: number | null; error: string | null; skipped: number; rejected: number }

let snap: Snapshot = { session: null, status: "idle", lastSyncAt: readSyncState(browserKV()).lastSyncAt, error: null, skipped: 0, rejected: 0 };
const listeners = new Set<() => void>();
const set = (patch: Partial<Snapshot>) => { snap = { ...snap, ...patch }; listeners.forEach((l) => l()); };

export const getAccountSnapshot = (): Snapshot => snap;
export const useAccount = (): Snapshot => useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, getAccountSnapshot);

/** The round under way and the account it syncs. */
let running: { user: string; done: Promise<void> } | null = null;
/** True when the learner changed something that the last round may not have seen. */
let pending = false;
/** One sync at a time; never throws (a failure is shown in Settings and the next trigger retries). */
export function syncNow(): Promise<void> {
  const session = snap.session;
  if (!session) return Promise.resolve();
  // the round of an account that just left (signed out, or into another account) is not this account's: its own follows
  if (running && running.user !== session.user.id) return running.done.then(() => syncNow());
  if (running) return running.done;
  pending = false;
  set({ status: "syncing", error: null });
  // A round that finishes after the user signed out (or into another account) must not change what Settings shows.
  const current = () => snap.session?.user.id === session.user.id;
  const done = getSupabase()
    .then((db) => syncOnce(store, browserKV(), supabaseCloud(db), session.user.id))
    .then((r) => { if (current()) set({ status: "ok", lastSyncAt: readSyncState(browserKV()).lastSyncAt, skipped: r.skipped, rejected: r.rejected }); })
    .catch((e: unknown) => { if (current()) set({ status: "error", error: e instanceof Error ? e.message : "sync failed" }); })
    .finally(() => {
      running = null;
      if (pending && snap.session) later(); // something changed while the round was running: its own timer found the round busy
    });
  running = { user: session.user.id, done };
  return done;
}

let timer: ReturnType<typeof setTimeout> | undefined;
const later = () => { clearTimeout(timer); timer = setTimeout(() => void syncNow(), 15_000); };

let connected: Promise<SupabaseClient> | null = null;
/**
 * Loads the cloud library once, follows sign-in changes and restores a saved sign-in (offline-safe: no network is needed to
 * read it). Called on start only when this phone keeps a sign-in, otherwise on the first account action.
 */
export function connectAccount(): Promise<SupabaseClient> {
  connected ??= getSupabase().then((db) => {
    db.auth.onAuthStateChange((_event, session) => set({ session }));
    // a sign-in that finished first (its event already set the session) is never overwritten by "nothing saved"
    void db.auth.getSession().then(({ data }) => { if (data.session) { set({ session: data.session }); void syncNow(); } });
    return db;
  }).catch((e: unknown) => {
    connected = null; // the library did not load: the next account action (or Google's deep link) tries again instead of failing for good
    throw e;
  });
  return connected;
}

let started = false;
/** Wires the automatic triggers and restores a saved sign-in; a phone without one loads nothing. Safe to call twice. */
export function startAccount(): void {
  if (started) return;
  started = true;
  if (hasSavedSignIn()) void connectAccount();
  store.subscribe(() => { pending = true; if (snap.session) later(); });
  document.addEventListener("visibilitychange", () => {
    if (!snap.session) return;
    // coming back: catch up. Going away: a phone may freeze this page before the 15 s timer fires, so push what is pending now.
    if (document.visibilityState === "visible" || (document.visibilityState === "hidden" && pending)) void syncNow();
  });
  window.addEventListener("online", () => { if (snap.session) void syncNow(); });
}

export type AuthResult = { ok: true; needsConfirmation?: boolean } | { ok: false; message: string };

/** The client for an account action; a failure to load it reads like any other failed request. */
const client = (): Promise<SupabaseClient | null> => connectAccount().catch(() => null);

export async function signUp(email: string, password: string): Promise<AuthResult> {
  const supabase = await client();
  if (!supabase) return { ok: false, message: "no connection" };
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, message: error.message };
  if (!data.session) return { ok: true, needsConfirmation: true };
  void syncNow();
  return { ok: true };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const supabase = await client();
  if (!supabase) return { ok: false, message: "no connection" };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: error.message };
  void syncNow();
  return { ok: true };
}

/**
 * Signing out keeps the games on the phone; the sync marks are forgotten so another account starts clean.
 * It ends this phone's sign-in only (`scope: "local"`). The default scope is "global", which revokes the learner's sign-in on
 * every phone, so signing out of one phone would silently stop cloud backup on the others. Offline, the server call fails
 * but the library still removes the local session, so signing out always works.
 */
export async function signOut(): Promise<void> {
  clearTimeout(timer);
  // nothing to end when the library was never needed (no sign-in on this phone)
  try { if (connected || hasSavedSignIn()) await (await connectAccount()).auth.signOut({ scope: "local" }); } catch { /* the local session is removed even when the server cannot be reached */ }
  resetSyncState(browserKV());
  set({ session: null, status: "idle", lastSyncAt: null, error: null, skipped: 0, rejected: 0 });
}

/** Deletes the account and all its cloud data (edge function with the service role; RLS cascade removes the rows). Local games stay. */
export async function deleteAccount(): Promise<AuthResult> {
  const supabase = await client();
  const data = supabase ? (await supabase.auth.getSession()).data : { session: null };
  if (!data.session) return { ok: false, message: "not signed in" };
  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, { method: "POST", headers: { Authorization: `Bearer ${data.session.access_token}`, apikey: SUPABASE_PUBLISHABLE_KEY } });
  } catch {
    return { ok: false, message: "no connection" }; // offline: nothing was deleted, the account is still signed in
  }
  if (!res.ok) return { ok: false, message: `delete failed (${res.status})` };
  await signOut();
  return { ok: true };
}
