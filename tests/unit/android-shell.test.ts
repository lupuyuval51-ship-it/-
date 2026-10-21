import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import config from "../../capacitor.config";
import { backAction, dispatchGameBack } from "../../mobile/src/back";
import { AI_URL, SUPABASE_URL } from "../../mobile/src/cloud/config";
import { isShareableText, MAX_SHARE_CHARS } from "../../mobile/src/export";
import { PAGE_DARK, PAGE_LIGHT, pageColor } from "../../mobile/src/system-bars";

/**
 * Guards for the Google Play build of the offline Android app (`android/`, `capacitor.config.ts`, `mobile/index.html`):
 * the privacy and release settings documented in docs/play-release.md must not regress silently. These read the files; the
 * real merged manifest and the R8 output are checked in the build (see the "In the real build" list in the doc).
 */
const root = path.resolve(import.meta.dirname, "../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");
const manifest = read("android/app/src/main/AndroidManifest.xml");
const appGradle = read("android/app/build.gradle");

describe("Android manifest (privacy and attack surface)", () => {
  it("keeps the learner's data through Android backup and device transfer (games, progress, plan), only caches left out; no cleartext traffic", () => {
    expect(manifest).toMatch(/android:allowBackup="true"/);
    expect(manifest).toMatch(/android:usesCleartextTraffic="false"/);
    expect(manifest).toMatch(/android:dataExtractionRules="@xml\/data_extraction_rules"/);
    expect(manifest).toMatch(/android:fullBackupContent="@xml\/backup_rules"/);
    const legacy = read("android/app/src/main/res/xml/backup_rules.xml");
    expect(legacy).toContain('<include domain="root" path="." />');
    expect(legacy).toContain('<exclude domain="root" path="app_webview/Default/Cache" />');
    const rules = read("android/app/src/main/res/xml/data_extraction_rules.xml");
    const cloud = rules.match(/<cloud-backup>([\s\S]*?)<\/cloud-backup>/)?.[1] ?? "";
    const transfer = rules.match(/<device-transfer>([\s\S]*?)<\/device-transfer>/)?.[1] ?? "";
    for (const section of [cloud, transfer]) {
      expect(section).toContain('<include domain="root" path="." />');
      expect(section).toContain('<exclude domain="root" path="app_webview/Default/Cache" />');
    }
  });

  it("declares only the INTERNET permission itself (VIBRATE is merged in by @capacitor/haptics)", () => {
    const declared = [...manifest.matchAll(/<uses-permission[^>]*android:name="([^"]+)"/g)].map((m) => m[1]);
    expect(declared).toEqual(["android.permission.INTERNET"]);
    expect(manifest).not.toMatch(/uses-permission-sdk-23|requestLegacyExternalStorage|android:debuggable|android:testOnly/);
  });

  it("exports only the launcher activity and shares no broad storage root", () => {
    expect(manifest.match(/android:exported="true"/g)).toHaveLength(1);
    expect(manifest).toMatch(/android\.intent\.category\.LAUNCHER/);
    const paths = read("android/app/src/main/res/xml/file_paths.xml");
    expect(paths).not.toMatch(/<external-path|<root-path|<files-path|<external-cache-path|<external-media-path/);
  });
});

describe("Android release build", () => {
  const variables = read("android/variables.gradle");
  const num = (name: string) => Number(variables.match(new RegExp(`${name}\\s*=\\s*(\\d+)`))?.[1]);

  it("targets API 36, the Google Play requirement for new apps and updates since 2026-08-31", () => {
    expect(num("targetSdkVersion")).toBeGreaterThanOrEqual(36);
    expect(num("compileSdkVersion")).toBeGreaterThanOrEqual(num("targetSdkVersion"));
  });

  it("shrinks code and resources with R8 in release, and keeps what Capacitor loads by reflection", () => {
    expect(appGradle).toMatch(/minifyEnabled true/);
    expect(appGradle).toMatch(/shrinkResources true/);
    expect(appGradle).not.toMatch(/minifyEnabled false/);
    const rules = read("android/app/proguard-rules.pro");
    expect(rules).toContain("-keep class com.getcapacitor.** { *; }");
    expect(rules).toContain("-keep class com.capacitorjs.plugins.** { *; }");
    expect(read("android/app/src/main/res/raw/keep.xml")).toContain("@xml/config");
  });

  it("keeps the permanent identity (package name) and never commits signing secrets", () => {
    expect(appGradle).toMatch(/applicationId "app\.levelup\.learn3d"/);
    expect(appGradle).not.toMatch(/(storePassword|keyPassword)\s+["']/); // only read from keystore.properties, never a literal
    expect(read("android/.gitignore")).toMatch(/keystore\.properties/);
    expect(read("android/.gitignore")).toMatch(/\*\.jks/);
  });
});

describe("WebView and Capacitor configuration", () => {
  it("is not debuggable, allows no mixed content and no native HTTP/cookie patching", () => {
    expect(config.android?.webContentsDebuggingEnabled).toBe(false);
    expect(config.android?.allowMixedContent).toBe(false);
    expect(config.plugins?.CapacitorHttp?.enabled).toBe(false);
    expect(config.plugins?.CapacitorCookies?.enabled).toBe(false);
    expect(config.server?.url).toBeUndefined();
    expect(config.server?.cleartext).not.toBe(true);
  });

  it("applies the system-bar and keyboard insets natively (not through Capacitor's keyboard-blind listener)", () => {
    expect(config.android?.adjustMarginsForEdgeToEdge).toBe("disable");
    const activity = read("android/app/src/main/java/app/levelup/learn3d/MainActivity.java");
    expect(activity).toContain("WindowInsetsCompat.Type.ime()");
    expect(activity).toContain("setAllowFileAccess(false)");
    expect(activity).toContain("setGeolocationEnabled(false)");
    // a killed WebView renderer restarts the activity, but never in a loop
    expect(activity).toContain("onRenderProcessGone");
    expect(activity).toMatch(/MAX_RENDERER_RECOVERIES = \d+;/);
    expect(activity).toContain("if (++rendererRecoveries > MAX_RENDERER_RECOVERIES) return false;");
  });

  it("Content-Security-Policy: connect-src is exactly 'self' and the Supabase project, no wildcard, no eval", () => {
    const html = read("mobile/index.html");
    const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] ?? "";
    const directives = new Map(csp.split(";").map((d) => d.trim()).filter(Boolean).map((d) => { const [name, ...values] = d.split(/\s+/); return [name!, values] as const; }));
    expect(directives.get("connect-src")).toEqual(["'self'", SUPABASE_URL, AI_URL]); // the account project and LEVEL UP AI, nothing else
    expect(AI_URL).toMatch(/^https:\/\/[a-z0-9]+\.supabase\.co$/);
    expect(SUPABASE_URL).toMatch(/^https:\/\/[a-z0-9]+\.supabase\.co$/);
    expect(directives.get("object-src")).toEqual(["'none'"]);
    expect(directives.get("base-uri")).toEqual(["'self'"]);
    expect(csp).not.toMatch(/\*|unsafe-eval|http:/);
  });
});

describe("system bars (Android 15+ edge-to-edge)", () => {
  it("the page colours the shell shows are the CSS page backgrounds, in the web code and in MainActivity", () => {
    const css = read("src/app/globals.css");
    const dark = css.match(/--color-ink-950:\s*(#[0-9a-fA-F]{6})/)?.[1];
    const light = css.match(/:root\[data-theme="light"\]\s*\{[^}]*?--color-ink-950:\s*(#[0-9a-fA-F]{6})/)?.[1];
    expect(PAGE_DARK).toBe(dark?.toLowerCase());
    expect(PAGE_LIGHT).toBe(light?.toLowerCase());
    const activity = read("android/app/src/main/java/app/levelup/learn3d/MainActivity.java");
    expect(activity).toContain(`PAGE_DARK = 0xFF${PAGE_DARK.slice(1).toUpperCase()};`);
    expect(activity).toContain(`PAGE_LIGHT = 0xFF${PAGE_LIGHT.slice(1).toUpperCase()};`);
  });

  it("picks the colour from the route, the in-app theme and the system mode (the play screen is always dark)", () => {
    expect(pageColor({ path: "/", themeAttr: null, systemLight: false })).toBe(PAGE_DARK);
    expect(pageColor({ path: "/", themeAttr: null, systemLight: true })).toBe(PAGE_LIGHT);
    expect(pageColor({ path: "/settings", themeAttr: "dark", systemLight: true })).toBe(PAGE_DARK);
    expect(pageColor({ path: "/settings", themeAttr: "light", systemLight: false })).toBe(PAGE_LIGHT);
    expect(pageColor({ path: "/play/abc", themeAttr: "light", systemLight: true })).toBe(PAGE_DARK);
    expect(pageColor({ path: "/games/g/results/s", themeAttr: null, systemLight: true })).toBe(PAGE_LIGHT);
  });

  it("registers the plugin the page talks to", () => {
    const activity = read("android/app/src/main/java/app/levelup/learn3d/MainActivity.java");
    expect(activity.indexOf("registerPlugin(SystemBarsPlugin.class);")).toBeGreaterThan(-1);
    expect(activity.indexOf("registerPlugin(SystemBarsPlugin.class);")).toBeLessThan(activity.indexOf("super.onCreate("));
    expect(read("android/app/src/main/java/app/levelup/learn3d/SystemBarsPlugin.java")).toContain('@CapacitorPlugin(name = "LevelUpSystemBars")');
    expect(read("mobile/src/native.ts")).toContain('registerPlugin<LevelUpSystemBars>("LevelUpSystemBars")');
    // the keep-screen-on stand-in for navigator.wakeLock, registered the same way
    expect(activity.indexOf("registerPlugin(ScreenPlugin.class);")).toBeGreaterThan(-1);
    expect(activity.indexOf("registerPlugin(ScreenPlugin.class);")).toBeLessThan(activity.indexOf("super.onCreate("));
    expect(read("android/app/src/main/java/app/levelup/learn3d/ScreenPlugin.java")).toContain('@CapacitorPlugin(name = "LevelUpScreen")');
    expect(read("mobile/src/native.ts")).toContain('registerPlugin<LevelUpScreen>("LevelUpScreen")');
  });
});

describe("native file hand-off (backup file in the Android WebView)", () => {
  it("the page-side plugin name matches the registered native plugin, which uses a cache path the FileProvider shares", () => {
    const activity = read("android/app/src/main/java/app/levelup/learn3d/MainActivity.java");
    const plugin = read("android/app/src/main/java/app/levelup/learn3d/FilesPlugin.java");
    const superCreate = activity.indexOf("super.onCreate(");
    expect(activity.indexOf("registerPlugin(FilesPlugin.class);")).toBeGreaterThan(-1);
    expect(activity.indexOf("registerPlugin(FilesPlugin.class);")).toBeLessThan(superCreate); // registered before the bridge is built
    const name = plugin.match(/@CapacitorPlugin\(name = "([^"]+)"\)/)?.[1];
    expect(name).toBe("LevelUpFiles");
    expect(read("mobile/src/native.ts")).toContain(`registerPlugin<LevelUpFiles>("${name}")`);
    expect(plugin).toContain('".fileprovider"');
    expect(plugin).toContain("getCacheDir()");
    expect(read("android/app/src/main/res/xml/file_paths.xml")).toContain("<cache-path");
    expect(read("android/app/src/main/AndroidManifest.xml")).toContain("${applicationId}.fileprovider");
  });

  it("only text and JSON of a sane size is handed over", () => {
    expect(isShareableText("application/json", 1_000)).toBe(true);
    expect(isShareableText("text/plain", 0)).toBe(true);
    expect(isShareableText("application/json", MAX_SHARE_CHARS + 1)).toBe(false);
    for (const type of ["image/png", "audio/wav", "application/octet-stream", "text/javascript", "application/javascript", ""]) expect(isShareableText(type, 10)).toBe(false);
  });
});

describe("Android back button", () => {
  it("lets the game decide inside a game", () => {
    expect(backAction("/play/abc-123", true)).toBe("game");
    expect(backAction("/play/abc-123", false)).toBe("game");
  });

  it("goes back one screen elsewhere, and falls back to the library when there is no history", () => {
    for (const p of ["/create", "/settings", "/review", "/games/g1/results/s1/review", "/games/g1/results/s1/practice"]) {
      expect(backAction(p, true)).toBe("history");
      expect(backAction(p, false)).toBe("library");
    }
  });

  it("never goes back from a finished run's results to the game: that entry would start a brand-new run of it", () => {
    // history after a run: [library, #/play/g1, #/games/g1/results/s1]; the play route resumes only an ACTIVE run, so re-entering it begins again
    for (const canGoBack of [true, false]) expect(backAction("/games/g1/results/s1", canGoBack)).toBe("library");
  });

  it("tells the game screen about Back, and reports when nobody answered (loading, deleted game, crashed screen)", () => {
    const answered = new EventTarget();
    answered.addEventListener("levelup:back", (e) => e.preventDefault());
    expect(dispatchGameBack(answered)).toBe(true);
    expect(dispatchGameBack(new EventTarget())).toBe(false);
  });

  it("leaves the app (to the background) only from the library", () => {
    for (const p of ["/", "", "/games"]) {
      expect(backAction(p, true)).toBe("leave");
      expect(backAction(p, false)).toBe("leave");
    }
  });
});

/**
 * What the build really produced (`android/app/build` is not committed): checked only when a build of the CURRENT versionCode is on this
 * machine, so a stale folder never fails the suite. The documented lists in docs/play-release.md must be the real ones.
 */
describe("the built release matches docs/play-release.md", () => {
  const versionCode = appGradle.match(/versionCode (\d+)/)?.[1];
  const mergedPath = "android/app/build/intermediates/merged_manifests/release/processReleaseManifest/AndroidManifest.xml";
  const merged = existsSync(path.join(root, mergedPath)) ? read(mergedPath) : "";
  const fresh = merged.includes(`android:versionCode="${versionCode}"`);
  const doc = read("docs/play-release.md");
  const permissions = [...merged.matchAll(/<uses-permission[^>]*android:name="([^"]+)"/g)].map((m) => m[1]!).sort();

  it.skipIf(!fresh)("requests exactly the permissions the doc lists, and every one is named in the doc", () => {
    expect(permissions).toEqual([
      "android.permission.ACCESS_NETWORK_STATE", // Google's transport library, a dependency of the Play Billing library
      "android.permission.INTERNET",
      "android.permission.VIBRATE", // @capacitor/haptics
      "app.levelup.learn3d.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION", // androidx.core, signature level
      "com.android.vending.BILLING", // @capgo/native-purchases (Google Play Billing)
    ]);
    for (const name of permissions) expect(doc, name).toContain(name.replace("app.levelup.learn3d.", "…").replace("android.permission.", ""));
  });

  it.skipIf(!fresh)("keeps backup on, cleartext off, nothing debuggable, and exports only the launcher activity and the DUMP-protected profile receiver", () => {
    expect(merged).toMatch(/android:allowBackup="true"/);
    expect(merged).toMatch(/android:usesCleartextTraffic="false"/);
    expect(merged).not.toMatch(/android:debuggable|android:testOnly/);
    const exported = [...merged.matchAll(/<(activity|receiver|service|provider)\b[^>]*?android:exported="true"[^>]*>/g)].map((m) => m[0]);
    expect(exported).toHaveLength(2);
    expect(exported.filter((e) => e.includes('android:name="app.levelup.learn3d.MainActivity"'))).toHaveLength(1);
    expect(exported.filter((e) => e.includes('android:name="androidx.profileinstaller.ProfileInstallReceiver"') && e.includes('android:permission="android.permission.DUMP"'))).toHaveLength(1);
  });

  it.skipIf(!existsSync(path.join(root, "android/app/build/outputs/mapping/release/seeds.txt")) || !fresh)("R8 keeps every plugin the page calls, with its @PluginMethod methods", () => {
    const seeds = read("android/app/build/outputs/mapping/release/seeds.txt");
    for (const entry of [
      "app.levelup.learn3d.FilesPlugin: void share(com.getcapacitor.PluginCall)",
      "app.levelup.learn3d.SystemBarsPlugin: void setPageColor(com.getcapacitor.PluginCall)",
      "app.levelup.learn3d.ScreenPlugin: void setKeepScreenOn(com.getcapacitor.PluginCall)",
      "ee.forgr.nativepurchases.NativePurchasesPlugin: void getPurchases(com.getcapacitor.PluginCall)",
      "ee.forgr.nativepurchases.NativePurchasesPlugin: void purchaseProduct(com.getcapacitor.PluginCall)",
    ]) expect(seeds, entry).toContain(entry);
  });
});

describe("the documents the store and the owner rely on say what the app really does", () => {
  const doc = read("docs/play-release.md");
  const listing = read("mobile/store/listing.md");
  const policy = read("mobile/store/privacy-policy.md");
  const [policyEn, policyHe] = policy.split("**עברית.**") as [string, string];
  const [listingHe, listingEn] = listing.split("## English (en-US)") as [string, string];

  it("play-release.md does not contradict the manifest: backup is on, so no step may expect 'no allowed backup'", () => {
    expect(manifest).toMatch(/android:allowBackup="true"/);
    expect(doc).not.toMatch(/shows no allowed backup|`adb backup` yields nothing/);
    expect(doc).toContain("ALLOW_BACKUP");
    expect(doc).not.toMatch(/at the time of writing 1\.\d+\.\d+ \/ \d+/); // the version lives in build.gradle only
    expect(doc).not.toMatch(/somewhere\nThe privacy policy/); // a sentence that stops half way
  });

  it("play-release.md names the permission and the SDKs the Play Billing library brings", () => {
    expect(doc).toContain("ACCESS_NETWORK_STATE");
    expect(doc).toMatch(/Google's own Play Billing library/);
  });

  it("the store listing states the in-app subscriptions, LEVEL UP AI and Spanish, and no longer promises demo games or a blanket 'not by AI'", () => {
    for (const text of [listingHe, listingEn]) expect(text).not.toMatch(/demo|הדגמה|not by AI|version 1 is free/i);
    expect(listing).not.toMatch(/In-app purchases: \*\*No\*\*/);
    expect(listing).toMatch(/In-app purchases: \*\*Yes\*\*/);
    expect(listing).toContain("Google Play Billing");
    expect(listingEn).toContain("LEVEL UP AI");
    expect(listingHe).toContain("LEVEL UP AI");
    expect(listingEn).toContain("Spanish");
    expect(listingHe).toContain("ספרדית");
    expect(listingHe).not.toMatch(/[<>]/); // Hebrew text never carries a comparison sign
    expect(listing).not.toMatch(/deadline|due date/i);
  });

  it("the privacy policy tells both readers that subscriptions are Google Play's, and that the plan stays on the phone", () => {
    expect(policyEn).toMatch(/Plus and Pro subscriptions \(Google Play\)/);
    expect(policyEn).toMatch(/never receive your card or payment details/);
    expect(policyEn).toMatch(/not sent to our cloud/);
    expect(policyHe).toMatch(/מנויי Plus ו-Pro \(Google Play\)/);
    expect(policyHe).toMatch(/לא נשלחת לענן שלנו/);
    expect(policyHe).not.toMatch(/[<>]/);
  });
});
