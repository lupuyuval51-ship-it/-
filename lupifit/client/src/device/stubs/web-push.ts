/**
 * `web-push` for device mode. Web Push needs a server that sends to the browser's push service, so
 * device mode leaves it off: no VAPID keys are set and PUSH_AUTO_VAPID=false, which makes
 * `GET /api/push/public-key` answer `enabled: false` and keeps every caller of this module unreachable.
 * Reminders on the phone use local notifications instead (see the platform layer).
 */
const unavailable = () => new Error('Web Push is not available in device mode');

const webpush = {
  generateVAPIDKeys(): never {
    throw unavailable();
  },
  setVapidDetails(): never {
    throw unavailable();
  },
  sendNotification(): Promise<never> {
    return Promise.reject(unavailable());
  },
};

export default webpush;
