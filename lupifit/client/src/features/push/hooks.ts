/** App-wide phone-notification wiring (mounted once in AppShell / main). */
import { useEffect } from 'react';
import { syncPushSubscription } from './push';

const synced = new Set<string>();

/**
 * Once per page load and account: if this device had phone notifications on for the user,
 * re-register it with the server (renewed subscription, rotated keys, "log out of all devices").
 */
export function usePushSync(userId: string | undefined) {
  useEffect(() => {
    if (!userId || synced.has(userId)) return;
    synced.add(userId);
    void syncPushSubscription(userId).catch(() => {
      // Offline or the server said no: try again on the next app start.
      synced.delete(userId);
    });
  }, [userId]);
}

/** Pages a tapped notification may open (mirrors PUSH_PATHS in public/sw.js). */
const PUSH_PATHS = new Set(['/', '/workouts', '/nutrition/log', '/profile']);

/**
 * Routes the app in place when the service worker reports a tapped notification, so an open
 * window keeps its state instead of reloading. Returns an unsubscribe function.
 */
export function listenForPushNavigation(navigate: (path: string) => void): () => void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return () => undefined;
  const onMessage = (event: MessageEvent) => {
    const data = event.data as { type?: unknown; path?: unknown } | null;
    if (data?.type === 'fitai:navigate' && typeof data.path === 'string' && PUSH_PATHS.has(data.path)) navigate(data.path);
  };
  navigator.serviceWorker.addEventListener('message', onMessage);
  return () => navigator.serviceWorker.removeEventListener('message', onMessage);
}
