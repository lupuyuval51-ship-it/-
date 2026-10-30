/**
 * LUPU-FIT Android app (Capacitor): the device build (`npm run build:device` → dist/device) packaged as
 * an app. The server and its database run inside the app (see client/src/device/README.md), so the app
 * needs no server and no internet (only the barcode lookup goes online). Native project: android/.
 * Build a signed release: android/build-release.sh (docs/android.md).
 */
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lupufit.app',
  appName: 'LUPU-FIT',
  webDir: 'dist/device',
  // Same as the web manifest's background and theme colour: no white flash before the first paint.
  backgroundColor: '#0b0b0d',
  // The app is served from https://localhost inside the WebView: a secure context (Web Locks, crypto.subtle)
  // with a stable origin, so the IndexedDB database stays the same across app updates. Never change it:
  // a different scheme or host is a different origin and would leave the data behind.
  server: { androidScheme: 'https', hostname: 'localhost' },
  android: {
    path: 'android',
    backgroundColor: '#0b0b0d',
    allowMixedContent: false,
    // Release builds never expose the WebView to chrome://inspect (debug builds do, Capacitor's default).
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SystemBars: {
      // Edge-to-edge: the page draws behind the status and navigation bars and keeps its content clear
      // of them with env(safe-area-inset-*) (index.html has viewport-fit=cover). On WebView < 140
      // Capacitor pads the WebView instead. The IME (keyboard) inset is applied as padding, so the
      // page resizes above the keyboard.
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
      // Light icons on the dark app; the native layer follows the in-app theme at run time.
      style: 'DARK',
    },
    LocalNotifications: {
      // res/drawable*/ic_stat_lupufit.png: white silhouette (Android tints it).
      smallIcon: 'ic_stat_lupufit',
      iconColor: '#FF6A00',
    },
  },
};

export default config;
