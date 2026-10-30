/**
 * `process.env` of the server code in device mode (built into the app; there is no .env on a phone).
 * server/src/config.ts reads it like any environment. Nothing here is a secret: there is no API key
 * (AI stays off), no VAPID key (Web Push stays off) and the session secret is not used for anything
 * security relevant. `assertProductionConfig` is never called in device mode.
 */
export const DEVICE_ENV: Readonly<Record<string, string>> = Object.freeze({
  NODE_ENV: 'production',
  DEVICE_MODE: 'true',
  /** The PGlite data directory, kept in IndexedDB (see shims/pg.ts). */
  DATABASE_URL: 'idb://lupufit-device',
  /** The app's own origin under Capacitor (Android): used only for Origin checks. */
  APP_URL: 'https://localhost',
  /** The session cookie never leaves the worker, so it does not need the __Host-/Secure form. */
  COOKIE_SECURE: 'false',
  /** One device account that stays signed in. */
  SESSION_TTL_DAYS: '365',
  /** Single user on their own phone. */
  RATE_LIMIT_ENABLED: 'false',
  /** The device account's password is random (not typed by a person), so a low scrypt cost is enough. */
  PASSWORD_SCRYPT_N: '1024',
  AI_API_KEY: '',
  ANTHROPIC_API_KEY: '',
  /** The daily coach quota limits AI cost on a server; the built-in coach on the phone costs nothing. */
  COACH_DAILY_MESSAGE_LIMIT: '10000',
  PUSH_AUTO_VAPID: 'false',
  VAPID_PUBLIC_KEY: '',
  VAPID_PRIVATE_KEY: '',
  /** Barcode lookup asks Open Food Facts directly (it sends only the barcode). */
  OPENFOODFACTS_ENABLED: 'true',
  LOG_REQUESTS: 'false',
  DB_AUTO_MIGRATE: 'false',
});
