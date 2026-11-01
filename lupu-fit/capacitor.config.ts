import type { CapacitorConfig } from '@capacitor/cli';

/** Android shell for the standalone Device Mode build. See docs/ANDROID.md. Build: scripts/android-build.sh */
const config: CapacitorConfig = {
  appId: 'app.lupufit',
  appName: 'LUPU-FIT',
  webDir: 'client/dist-device',
  backgroundColor: '#0B0B0D',
  server: { androidScheme: 'https', cleartext: false },
  android: { allowMixedContent: false, adjustMarginsForEdgeToEdge: 'auto', backgroundColor: '#0B0B0D' },
};
export default config;
