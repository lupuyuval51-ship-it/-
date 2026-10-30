/** Phone notifications (Web Push). */

export interface PushConfigResponse {
  /** False when the server has no VAPID keys: the app then hides phone notifications. */
  enabled: boolean;
  /** VAPID public key (base64url) for `pushManager.subscribe`, or null when disabled. */
  publicKey: string | null;
  /** How many devices currently receive this user's notifications. */
  devices: number;
}

export interface PushDevicesResponse {
  ok: true;
  devices: number;
}

export interface PushTestResponse {
  /** Devices the push service accepted the notification for. */
  sent: number;
  /** Devices that could not be reached this time. */
  failed: number;
  /** Devices that no longer exist at the push service (removed). */
  removed: number;
}

/** What the service worker receives in a push message. */
export interface PushPayload {
  title: string;
  body: string;
  /** In-app path opened when the notification is tapped. */
  url: string;
  /** Notifications with the same tag replace each other (matches the in-app reminders). */
  tag: string;
  lang: 'he' | 'en';
}
