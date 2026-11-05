import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

let wired = false;

/**
 * Connects TanStack Query's onlineManager to NetInfo on native. Queries pause while offline and
 * resume on reconnect; `useIsOnline()` reads the same source of truth. `isConnected === null`
 * (unknown) is treated as online to avoid false offline banners.
 * Web keeps TanStack's default listener (window `online`/`offline` events): NetInfo's web
 * implementation only listens to `navigator.connection` changes when that API exists, which
 * misses going offline in Chromium.
 */
export function wireOnlineManager(): void {
  if (wired || Platform.OS === 'web') return;
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
