import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { connectAccount, syncNow } from "./account";
import { SUPABASE_URL } from "./config";
import { finishGoogleSignIn, googleAuthEnabled, parseGoogleCallback, startGoogleSignIn, type GoogleResult } from "./google";

/** Opens Supabase's Google page in the system browser (see google.ts for why a plain navigation does that in Capacitor's WebView). */
const openExternal = (url: string): void => window.location.assign(url);

/** The "Continue with Google" button. Makes no request until it is tapped. */
export async function signInWithGoogle(): Promise<GoogleResult> {
  return startGoogleSignIn(await connectAccount(), openExternal, SUPABASE_URL);
}

type Listener = (r: GoogleResult) => void;
const listeners = new Set<Listener>();
/** The account panel hears how a sign-in that came back through the deep link ended (a success also arrives through onAuthStateChange). */
export function onGoogleResult(fn: Listener): () => void {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

async function handle(url: string): Promise<void> {
  if (!parseGoogleCallback(url)) return; // not our sign-in link: the cloud library is not even loaded
  const result = await finishGoogleSignIn(await connectAccount(), url);
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
