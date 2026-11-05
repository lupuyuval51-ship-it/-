import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

let wired = false;

/**
 * Connects TanStack Query's onlineManager to NetInfo (native + web). Queries pause while
 * offline and resume on reconnect; `useIsOnline()` reads the same source of truth.
 * `isConnected === null` (unknown) is treated as online to avoid false offline banners.
 */
export function wireOnlineManager(): void {
  if (wired) return;
  wired = true;
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => {
      setOnline(state.isConnected !== false);
    }),
  );
}

function subscribe(listener: () => void): () => void {
  return onlineManager.subscribe(listener);
}

/** True while the device has a network connection. */
export function useIsOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => onlineManager.isOnline(),
    () => true,
  );
}
