/**
 * Phone notifications (Web Push) in the browser: support checks, subscribing with the
 * server's VAPID key and keeping the server's copy in sync. Owned by the settings feature.
 *
 * A push subscription belongs to the browser, not to an account, so the device remembers
 * which account turned notifications on (`fitai.pushOwner`, a user id only). Only that
 * account's sign-in re-registers the device automatically; anyone else has to opt in.
 * Permission is only ever requested from a tap (`enablePush`).
 */
import type { PushConfigResponse, PushDevicesResponse, PushTestResponse } from '@shared/types';
import { ApiError, apiGet, apiPost } from '../../api/client';
import { storage } from '../../lib/storage';

export const PUSH_OWNER_KEY = 'fitai.pushOwner';

export const fetchPushConfig = () => apiGet<PushConfigResponse>('/push/public-key');
export const sendTestPush = (endpoint?: string) => apiPost<PushTestResponse>('/push/test', endpoint ? { endpoint } : {});

/** True when this browser can receive push messages at all (secure context + service worker + Push API). */
export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext !== false &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function notificationPermission(): NotificationPermission {
  return 'Notification' in window ? window.Notification.permission : 'denied';
}

export function pushOwner(): string | null {
  return storage.get<string>(PUSH_OWNER_KEY);
}

/** This device delivers `userId`'s phone notifications (used to avoid doubling in-app ones). */
export function isPushOnForUser(userId: string | undefined): boolean {
  return Boolean(userId) && pushSupported() && notificationPermission() === 'granted' && pushOwner() === userId;
}

/** The service worker registration, or null (none registered, e.g. the dev server). */
export async function pushRegistration(timeoutMs = 4000): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupported()) return null;
  try {
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) return existing;
    // Registration starts on page load; give it a moment before giving up.
    return await Promise.race([navigator.serviceWorker.ready, new Promise<null>((resolve) => window.setTimeout(() => resolve(null), timeoutMs))]);
  } catch {
    return null;
  }
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  const reg = await pushRegistration();
  if (!reg) return null;
  try {
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

/** base64url (VAPID public key) → bytes for `applicationServerKey`. */
export function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const base64 = (value + '='.repeat((4 - (value.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** False when the subscription was made with another server key (the keys were rotated). */
function madeWithKey(sub: PushSubscription, publicKey: string): boolean {
  const key = sub.options?.applicationServerKey;
  if (!key) return true; // not exposed by this browser: assume it matches
  const a = new Uint8Array(key);
  const b = base64UrlToBytes(publicKey);
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function subscriptionBody(sub: PushSubscription) {
  const json = sub.toJSON();
  return { endpoint: json.endpoint ?? sub.endpoint, expirationTime: json.expirationTime ?? null, keys: json.keys ?? {} };
}

async function forgetOnServer(endpoint: string): Promise<void> {
  try {
    await apiPost<PushDevicesResponse>('/push/unsubscribe', { endpoint });
  } catch (err) {
    // Already gone on the server (404) is what we wanted.
    if (!(err instanceof ApiError && err.status === 404)) throw err;
  }
}

/** Subscribes this browser with the server key (replacing a subscription made with an old key) and stores it. */
async function subscribeAndStore(reg: ServiceWorkerRegistration, publicKey: string): Promise<PushSubscription> {
  let sub = await reg.pushManager.getSubscription();
  if (sub && !madeWithKey(sub, publicKey)) {
    const old = sub.endpoint;
    await sub.unsubscribe().catch(() => false);
    await forgetOnServer(old).catch(() => undefined);
    sub = null;
  }
  sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(publicKey) });
  await apiPost<PushDevicesResponse>('/push/subscribe', subscriptionBody(sub));
  return sub;
}

function requestPermission(): Promise<NotificationPermission> {
  // Older Safari only supports the callback form.
  return new Promise<NotificationPermission>((resolve) => {
    const maybe = window.Notification.requestPermission(resolve);
    if (maybe && typeof maybe.then === 'function') void maybe.then(resolve);
  });
}

export type EnableResult = 'on' | 'denied' | 'dismissed' | 'unsupported';

/** Asks for permission (call only from a tap), subscribes and registers this device for `userId`. */
export async function enablePush(userId: string, publicKey: string): Promise<EnableResult> {
  if (!pushSupported()) return 'unsupported';
  const permission = notificationPermission() === 'granted' ? 'granted' : await requestPermission();
  if (permission === 'denied') return 'denied';
  if (permission !== 'granted') return 'dismissed';
  const reg = await pushRegistration();
  if (!reg) return 'unsupported';
  await subscribeAndStore(reg, publicKey);
  storage.set(PUSH_OWNER_KEY, userId);
  return 'on';
}

/** Stops phone notifications on this device (server first, then the browser subscription). */
export async function disablePush(): Promise<void> {
  const sub = await currentSubscription();
  if (sub) {
    await forgetOnServer(sub.endpoint);
    await sub.unsubscribe().catch(() => false);
  }
  storage.remove(PUSH_OWNER_KEY);
}

/** Endpoint of this device's subscription when it delivers `userId`'s notifications. */
export async function ownEndpoint(userId: string): Promise<string | null> {
  if (!isPushOnForUser(userId)) return null;
  return (await currentSubscription())?.endpoint ?? null;
}

/**
 * On sign-in / app start: if this device had notifications on for this user, make sure the
 * server has the current subscription (the browser may have renewed it, the server may have
 * dropped it after a "log out of all devices", or the keys may have changed).
 */
export async function syncPushSubscription(userId: string): Promise<void> {
  if (pushOwner() !== userId || !pushSupported()) return;
  if (notificationPermission() !== 'granted') {
    // Notifications were blocked in the browser settings: the device no longer receives them.
    storage.remove(PUSH_OWNER_KEY);
    return;
  }
  const config = await fetchPushConfig();
  if (!config.enabled || !config.publicKey) return;
  const reg = await pushRegistration();
  if (!reg) return;
  await subscribeAndStore(reg, config.publicKey);
}

/**
 * On logout: this device stops getting the user's notifications. The browser subscription and
 * the owner mark stay, so the same user signing in again here gets them back automatically.
 */
export async function releasePushOnLogout(userId: string, timeoutMs = 3000): Promise<void> {
  if (pushOwner() !== userId) return;
  const work = (async () => {
    const sub = await currentSubscription();
    if (sub) await forgetOnServer(sub.endpoint);
  })().catch(() => undefined);
  await Promise.race([work, new Promise((resolve) => window.setTimeout(resolve, timeoutMs))]);
}
