/**
 * Device-mode start (loaded only by the device build, see main.tsx): starts the device worker (the server
 * inside the app), routes the API client through it and asks the browser to keep the app's storage.
 */
import { setTransport } from '../../api/client';
import { initialLocale, translate } from '../../i18n';
import { storage } from '../../lib/storage';
import { connectDevice, type DeviceConnection } from './connection';
import { ERASE_FLAG, setDeviceControl } from './control';

export { DeviceGate } from './DeviceGate';

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

/** The start-up screen uses the theme of the last session (AuthProvider applies the account's once it is known). */
function applyLastTheme(): void {
  const pref = storage.get<string>('fitai.theme') ?? 'system';
  const light = window.matchMedia?.('(prefers-color-scheme: light)').matches ?? false;
  document.documentElement.dataset.theme = pref === 'light' || pref === 'dark' ? pref : light ? 'light' : 'dark';
}

export function startDevice(): DeviceConnection {
  applyLastTheme();
  const worker = new Worker(new URL('../../device/worker/entry.ts', import.meta.url), { type: 'module', name: 'lupufit-device' });
  const locale = initialLocale();
  const connection = connectDevice(
    worker,
    { locale, timezone: timeZone(), displayName: translate(locale, 'device.defaultName') ?? 'LUPU-FIT' },
    {
      // "Erase all data on this phone" that the last session could not finish: the worker deletes first.
      eraseFirst: storage.get<boolean>(ERASE_FLAG) === true,
      onErasedAtStart: (ok) => {
        if (ok) storage.remove(ERASE_FLAG);
      },
    },
  );
  setTransport(connection.transport);
  setDeviceControl({ erase: () => connection.erase() });
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
