// UNTESTED draft. Device Mode build: `npm run build:device`, then `npx cap add android` (Capacitor not yet installed).
const config = { appId: 'app.lupufit', appName: 'LUPU-FIT', webDir: 'client/dist-device', server: { androidScheme: 'https' } };
export default config;
