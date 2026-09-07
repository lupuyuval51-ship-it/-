/**
 * Account actions (client side). Every call updates the store:
 *   register/login → auth.mode "account", markAllDirty() so guest history moves to the account, then syncNow()
 *   logout          → local data stays by default (`clearLocalData: true` wipes it)
 *   deleteAccount   → server rows deleted, local store reset
 */
import type { AuthResponse, ExportResponse, LoginRequest, MeResponse, OkResponse, PublicUser, RegisterRequest } from "@/lib/serverTypes";
import { useAppStore } from "./appStore";
import { apiFetch } from "./api";
import { startSync, stopSync, syncNow } from "./sync";

function toGuest(): void {
  const store = useAppStore.getState();
  store.setAuth({ mode: "guest", userId: undefined, email: undefined, role: undefined, lastSyncAt: undefined });
  const pending = Object.keys(useAppStore.getState().syncQueue);
  if (pending.length) useAppStore.getState().markSynced(pending);
  useAppStore.getState().setSyncStatus({ state: "disabled", error: undefined });
}

async function afterSignIn(user: PublicUser): Promise<PublicUser> {
  const store = useAppStore.getState();
  store.setAuth({ mode: "account", userId: user.id, email: user.email, role: user.role, lastSyncAt: undefined });
  store.markAllDirty();
  store.setSyncStatus({ state: "idle", error: undefined });
  startSync();
  try {
    await syncNow({ force: true });
  } catch {
    /* the account exists; sync retries in the background */
  }
  return user;
}

export async function register(input: RegisterRequest): Promise<PublicUser> {
  const res = await apiFetch<AuthResponse>("/api/auth/register", { method: "POST", body: input });
  return afterSignIn(res.user);
}

export async function login(input: LoginRequest): Promise<PublicUser> {
  const res = await apiFetch<AuthResponse>("/api/auth/login", { method: "POST", body: input });
  return afterSignIn(res.user);
}

/** Signs out. Local data is kept unless `clearLocalData` is true. */
export async function logout(opts: { clearLocalData?: boolean } = {}): Promise<void> {
  try {
    await apiFetch<OkResponse>("/api/auth/logout", { method: "POST" });
  } catch {
    /* offline or already signed out – the local state is what matters */
  }
  stopSync();
  if (opts.clearLocalData) useAppStore.getState().resetAll();
  else toGuest();
}

/** Refreshes the account from the cookie session; null when the session is gone (store falls back to guest). */
export async function me(): Promise<PublicUser | null> {
  const res = await apiFetch<MeResponse>("/api/auth/me");
  const store = useAppStore.getState();
  if (res.user) {
    if (store.auth.mode !== "account" || store.auth.userId !== res.user.id) {
      store.setAuth({ mode: "account", userId: res.user.id, email: res.user.email, role: res.user.role });
    } else {
      store.setAuth({ email: res.user.email, role: res.user.role });
    }
    startSync();
    return res.user;
  }
  if (store.auth.mode === "account") {
    toGuest();
    useAppStore.getState().setSyncStatus({ state: "error", error: "session_expired" });
  }
  return null;
}

/** Deletes the account and all server data, then wipes the local store. */
export async function deleteAccount(): Promise<void> {
  await apiFetch<OkResponse>("/api/auth/delete-account", { method: "POST" });
  stopSync();
  useAppStore.getState().resetAll();
}

/** Full JSON export of the account's data. */
export async function exportData(): Promise<ExportResponse> {
  return apiFetch<ExportResponse>("/api/auth/export", { timeoutMs: 60_000 });
}
