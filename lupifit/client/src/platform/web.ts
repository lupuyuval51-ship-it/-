/** Web implementations of the platform contract (browser, installed web app, device-mode web build). */
import type { Platform, Reminders } from './types';

function toBlob(data: string | Blob | Uint8Array, mime: string): Blob {
  if (data instanceof Blob) return data;
  // Copy into a plain ArrayBuffer-backed view: a Uint8Array over a SharedArrayBuffer is not a BlobPart.
  return new Blob([typeof data === 'string' ? data : new Uint8Array(data)], { type: mime });
}

/** A temporary object URL clicked as a download link. Browsers give no "cancelled" signal, so it is 'saved'. */
export async function saveFileWeb(fileName: string, mime: string, data: string | Blob | Uint8Array) {
  const url = URL.createObjectURL(toBlob(data, mime));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'saved' as const;
}

/** No phone notifications from the web build: the in-app reminders (and Web Push in server mode) stay as today. */
export const webReminders: Reminders = {
  supported: () => false,
  permission: async () => 'denied',
  request: async () => 'denied',
  sync: async () => undefined,
};

export const webPlatform: Platform = { saveFile: saveFileWeb, reminders: webReminders };
