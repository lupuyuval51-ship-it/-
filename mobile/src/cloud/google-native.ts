import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { connectAccount, syncNow } from "./account";
import { SUPABASE_URL } from "./config";
import { finishGoogleSignIn, googleAuthEnabled, parseGoogleCallback, startGoogleSignIn, type GoogleResult } from "./google";

/** Opens Supabase's Google page in the system browser (see google.ts for why a plain navigation does that in Capacitor's WebView). */
const openExternal = (url: string): void => window.location.assign(url);

let starting: Promise<GoogleResult> | null = null;
/**
 * The "Continue with Google" button. Makes no request until it is tapped. A second tap while the first is still being set up (the
 * cloud library loads on the first one) gets the first one's answer instead of starting another flow: each flow overwrites the PKCE
 * verifier and opens the browser again, and the code of the first would then no longer match. Never rejects: a library that cannot
 * be loaded is a failed sign-in like any other.
 */
export function signInWithGoogle(): Promise<GoogleResult> {
  starting ??= (async (): Promise<GoogleResult> => {
    try { return await startGoogleSignIn(await connectAccount(), openExternal, SUPABASE_URL); } catch { return { ok: false, reason: "failed" }; }
  })().finally(() => { starting = null; });
  return starting;
}

type Listener = (r: GoogleResult) => void;
const listeners = new Set<Listener>();
/** The account panel hears how a sign-in that came back through the deep link ended (a success also arrives through onAuthStateChange). */
export function onGoogleResult(fn: Listener): () => void {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

/** After `appStateChange` reports the app active again: the learner is back from the system browser (finished or not). */
export function onAppResume(fn: () => void): () => void {
  if (!Capacitor.isNativePlatform()) return () => undefined;
  const added = App.addListener("appStateChange", ({ isActive }) => { if (isActive) fn(); });
  return () => void added.then((h) => h.remove()).catch(() => undefined);
}

async function handle(url: string): Promise<void> {
  if (!parseGoogleCallback(url)) return; // not our sign-in link: the cloud library is not even loaded
  // a cloud library that cannot be loaded is a failed sign-in, not a lost one (the gate would wait for an answer forever)
  const result = await connectAccount().then((db) => finishGoogleSignIn(db, url)).catch((): GoogleResult => ({ ok: false, reason: "failed" }));
  if (!result) return;
  if (result.ok) void syncNow();
  listeners.forEach((l) => l(result));
}

/**
 * Listens for `app.levelup.learn3d://auth?...` (the manifest's intent filter). Does nothing unless the build has Google enabled, and
 * nothing on the web. Registering a listener makes no network request.
 */
export function installGoogleDeepLink(): void {
  if (!googleAuthEnabled() || !Capacitor.isNativePlatform()) return;
  void App.addListener("appUrlOpen", ({ url }) => void handle(url));
  // the app may have been started by the link itself (it was killed while the browser was open)
  void App.getLaunchUrl().then((launch) => { if (launch?.url) void handle(launch.url); }).catch(() => { /* no launch url */ });
}
