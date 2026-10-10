import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Offline Android app (Google Play). The web bundle is `mobile/dist` (built by `npm run mobile:build`).
 * appId is the permanent Play package name: change it BEFORE the first upload if you want a different one.
 */
const config: CapacitorConfig = {
  appId: "app.levelup.learn3d",
  appName: "LEVEL UP",
  webDir: "mobile/dist",
  android: { allowMixedContent: false, captureInput: false, webContentsDebuggingEnabled: false },
  server: { androidScheme: "https" },
};

export default config;
