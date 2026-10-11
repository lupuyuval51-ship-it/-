import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Offline Android app (Google Play). The web bundle is `mobile/dist` (built by `npm run mobile:build`).
 * appId is the permanent Play package name: change it BEFORE the first upload if you want a different one.
 */
const config: CapacitorConfig = {
  appId: "app.levelup.learn3d",
  appName: "LEVEL UP",
  webDir: "mobile/dist",
  android: {
    allowMixedContent: false,
    captureInput: false,
    webContentsDebuggingEnabled: false,
    // Insets (status bar, gesture bar, cut-out, keyboard) are applied by MainActivity.java, which also covers the keyboard.
    // Keep this "disable": Capacitor's own "auto"/"force" would install a second, keyboard-blind insets listener
    // (and becomes the default in Capacitor 8).
    adjustMarginsForEdgeToEdge: "disable",
  },
  server: { androidScheme: "https" },
  // The page uses the browser's fetch/cookies only (Supabase, optional account). Keep Capacitor's native HTTP/cookie patches off
  // (these are the defaults; stated so nobody switches them on without noticing that native requests bypass the CSP).
  plugins: {
    CapacitorHttp: { enabled: false },
    CapacitorCookies: { enabled: false },
  },
};

export default config;
