/**
 * Device-mode start (loaded only by the device build, see main.tsx): starts the device worker (the server
 * inside the app), routes the API client through it and asks the browser to keep the app's storage.
 */
import { setTransport } from '../../api/client';
import { initialLocale, translate } from '../../i18n';
import { isNativeApp } from '../../platform';
import { connectDevice, type DeviceConnection } from './connection';

export { DeviceGate } from './DeviceGate';

/**
 * Inside the Android app: installs the native platform (share sheet, phone reminders, back button…).
 * Elsewhere (the device build in a browser) nothing happens and no Capacitor code is loaded. Never throws:
 * without it the app still works with the web implementations.
 */
export async function installNative(options: { navigate(path: string, opts?: { replace?: boolean }): void }): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { installNativePlatform } = await import('../../platform/native');
    await installNativePlatform(options);
  } catch (err) {
    console.error('LUPU-FIT: native platform not available', err);
  }
}

function timeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Asks once per launch that the browser never evicts the app's storage under storage pressure (the data
 * exists only on this device). Chrome decides by itself (installed / often used apps get it); the Android
 * app's WebView storage is app data and is not evicted.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export function startDevice(): DeviceConnection {
  const worker = new Worker(new URL('../../device/worker/entry.ts', import.meta.url), { type: 'module', name: 'lupufit-device' });
  const locale = initialLocale();
  const connection = connectDevice(worker, {
    locale,
    timezone: timeZone(),
    displayName: translate(locale, 'device.defaultName') ?? 'LUPU-FIT',
  });
  setTransport(connection.transport);
  void requestPersistentStorage();
  // Start-up time, for measurements (`performance.getEntriesByName('lupufit:device-ready')`).
  const unsubscribe = connection.subscribe(() => {
    const boot = connection.getState();
    if (boot.state !== 'ready') return;
    unsubscribe();
    performance.mark('lupufit:device-ready', { detail: { workerBootMs: boot.bootMs, steps: boot.steps } });
  });
  return connection;
}
