/**
 * "Continue with Google" for the optional cloud account (Android app), through Supabase Auth's Google provider.
 *
 * Plugin-free design (no @capacitor/browser dependency):
 *  1. `signInWithOAuth({ provider: "google", options: { skipBrowserRedirect: true, redirectTo } })` only BUILDS the URL (PKCE: the
 *     code verifier stays in this app's local storage). No request is made.
 *  2. The URL is opened outside the WebView. Capacitor's `Bridge.launchIntent` sends any navigation to a host other than the app's own
 *     to the system browser (ACTION_VIEW), so `window.location.assign(url)` opens the default browser and the WebView stays on the app.
 *     (A Chrome Custom Tab through @capacitor/browser would be nicer; it is a drop-in replacement for `openExternal`.)
 *  3. Supabase talks to Google (its own callback URL, the client secret lives ONLY in the Supabase dashboard) and redirects the
 *     browser to `app.levelup.learn3d://auth?code=…`. Android routes that to MainActivity (intent filter in the manifest) and
 *     Capacitor's App plugin reports it as `appUrlOpen`.
 *  4. `finishGoogleSignIn` exchanges the one-time code for a session. The exchange needs the PKCE verifier that only this app holds, so
 *     another app that registered the same custom scheme (or read the intent) cannot use the code, and an unsolicited link is ignored.
 *
 * Everything here is a pure function of its arguments (injected client / opener / storage) so it is unit-tested without a phone.
 */

/** Build-time switch for "Continue with Google" (the Supabase dashboard must have the Google provider enabled): `VITE_GOOGLE_AUTH=1`. Off in a normal build. */
export const googleAuthEnabled = (flag: unknown = import.meta.env.VITE_GOOGLE_AUTH): boolean => flag === "1";

/**
 * Build with `VITE_REQUIRE_GOOGLE=1` (and `VITE_GOOGLE_AUTH=1`) and the app asks for a Google sign-in before anything else. Off in a
 * normal build: the learner's data is kept on the phone (and by Android's backup) without any account. A phone that already has a
 * sign-in never needs the network again to open the app.
 */
export const googleRequired = (flag: unknown = import.meta.env.VITE_REQUIRE_GOOGLE, authOn: boolean = googleAuthEnabled()): boolean => authOn && flag === "1";

export const GOOGLE_REDIRECT_SCHEME = "app.levelup.learn3d";
export const GOOGLE_REDIRECT_HOST = "auth";
export const GOOGLE_REDIRECT_TO = `${GOOGLE_REDIRECT_SCHEME}://${GOOGLE_REDIRECT_HOST}`;
/** A started flow is honoured for this long; the browser round trip takes seconds. */
export const GOOGLE_FLOW_TTL_MS = 10 * 60_000;
const PENDING_KEY = "levelup.googleAuthPending";

export type GoogleResult = { ok: true } | { ok: false; reason: "cancelled" | "failed" };

export interface OAuthClient {
  auth: {
    signInWithOAuth(args: { provider: "google"; options: { redirectTo: string; skipBrowserRedirect: boolean } }): Promise<{ data: { url?: string | null } | null; error: { message: string } | null }>;
    exchangeCodeForSession(code: string): Promise<{ error: { message: string } | null }>;
  };
}
export interface PendingStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const safeStore = (s: PendingStore | undefined): PendingStore | null => {
  try {
    return s ?? (typeof localStorage === "undefined" ? null : localStorage);
  } catch {
    return null;
  }
};

/** `null` unless the link is exactly our redirect (scheme, host, no extra path or credentials). */
export function parseGoogleCallback(raw: string): { code: string } | { error: string } | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== `${GOOGLE_REDIRECT_SCHEME}:` || u.hostname !== GOOGLE_REDIRECT_HOST || u.username || u.password || (u.pathname !== "" && u.pathname !== "/")) return null;
  // Supabase reports provider errors as ?error=…&error_description=… (query) or in the fragment.
  const params = new URLSearchParams(u.search || (u.hash.startsWith("#") ? u.hash.slice(1) : ""));
  const code = params.get("code");
  if (code && code.length <= 2048) return { code };
  return { error: params.get("error") ?? "missing_code" };
}

/**
 * Step 1+2. `supabaseOrigin` is the project URL: the URL Supabase hands back must be on it, so a malformed answer can never send
 * the user to an arbitrary site.
 */
export async function startGoogleSignIn(client: OAuthClient, openExternal: (url: string) => void, supabaseOrigin: string, store?: PendingStore, now = Date.now()): Promise<GoogleResult> {
  const pending = safeStore(store);
  try {
    const { data, error } = await client.auth.signInWithOAuth({ provider: "google", options: { redirectTo: GOOGLE_REDIRECT_TO, skipBrowserRedirect: true } });
    const url = data?.url;
    if (error || !url || new URL(url).origin !== new URL(supabaseOrigin).origin) return { ok: false, reason: "failed" };
    try { pending?.setItem(PENDING_KEY, String(now)); } catch { /* storage blocked: the exchange below still needs the verifier, so this is only the extra guard */ }
    openExternal(url);
    return { ok: true };
  } catch {
    return { ok: false, reason: "failed" };
  }
}

/**
 * Step 4. Returns `null` for links that are not ours or not expected (nothing happens), otherwise the outcome.
 * A link is only honoured while a flow started by this app is pending, and only once.
 */
export async function finishGoogleSignIn(client: OAuthClient, url: string, store?: PendingStore, now = Date.now()): Promise<GoogleResult | null> {
  const parsed = parseGoogleCallback(url);
  if (!parsed) return null;
  const pending = safeStore(store);
  let startedAt = NaN;
  try { const raw = pending?.getItem(PENDING_KEY); startedAt = raw ? Number(raw) : NaN; } catch { /* treated as not pending */ }
  if (!Number.isFinite(startedAt) || now - startedAt > GOOGLE_FLOW_TTL_MS || now < startedAt - 60_000) return null;
  try { pending?.removeItem(PENDING_KEY); } catch { /* ignore */ }
  if ("error" in parsed) return { ok: false, reason: parsed.error === "access_denied" ? "cancelled" : "failed" };
  try {
    const { error } = await client.auth.exchangeCodeForSession(parsed.code);
    return error ? { ok: false, reason: "failed" } : { ok: true };
  } catch {
    return { ok: false, reason: "failed" };
  }
}

// ───────────── is the Google provider switched on in Supabase? ─────────────

const PROVIDER_KEY = "levelup.googleProvider";
export type ProviderState = "on" | "off" | "unknown";

/** What this phone last learned about the provider (kept so the answer is there at the next start, offline too). */
export function readProviderState(store?: PendingStore): ProviderState {
  try {
    const v = safeStore(store)?.getItem(PROVIDER_KEY);
    return v === "on" || v === "off" ? v : "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Asks Supabase's public settings whether "Google" is enabled. When it is not (the dashboard step was not done yet) nobody could ever
 * sign in, so the required sign-in must not lock the app: the gate stands aside. When Supabase cannot be reached the last answer
 * is kept, and with none the gate stays (the sign-in is required).
 */
export async function checkGoogleProvider(supabaseUrl: string, publishableKey: string, fetchImpl: typeof fetch = fetch, store?: PendingStore): Promise<ProviderState> {
  try {
    const res = await fetchImpl(`${supabaseUrl}/auth/v1/settings`, { headers: { apikey: publishableKey }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) return readProviderState(store);
    const body = (await res.json()) as { external?: { google?: unknown } };
    const state: ProviderState = body.external?.google === true ? "on" : "off";
    try { safeStore(store)?.setItem(PROVIDER_KEY, state); } catch { /* optional */ }
    return state;
  } catch {
    return readProviderState(store);
  }
}
