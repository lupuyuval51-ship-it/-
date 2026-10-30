import { useEffect, useState } from 'react';
import { isDeviceMode } from '../platform';

/** Whether this device has a network connection (the browser's own signal, `navigator.onLine`). */
export function useNetworkOnline(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

/**
 * Whether the app can reach its API. Always true in device mode (the server is inside the app); use
 * `useNetworkOnline` for the few things that need the internet there (the barcode lookup).
 */
export function useOnline(): boolean {
  const online = useNetworkOnline();
  return isDeviceMode || online;
}
