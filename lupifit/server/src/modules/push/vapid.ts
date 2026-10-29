/**
 * VAPID configuration check for phone notifications. Push is enabled only when all three
 * values are present and valid; otherwise it is disabled cleanly (never a crash).
 * Messages name the variables but never include their values.
 */
import crypto from 'node:crypto';
import { config } from '../../config';

export interface VapidDetails {
  subject: string;
  publicKey: string;
  privateKey: string;
}

const B64URL = /^[A-Za-z0-9_-]+$/;
const KEYGEN_HINT = 'generate a pair with `npx web-push generate-vapid-keys`';

function check(publicKey: string, privateKey: string, subject: string): string | null {
  const missing = [
    !publicKey && 'VAPID_PUBLIC_KEY',
    !privateKey && 'VAPID_PRIVATE_KEY',
    !subject && 'VAPID_SUBJECT',
  ].filter(Boolean);
  if (missing.length) return `${missing.join(', ')} not set`;
  const pub = B64URL.test(publicKey) ? Buffer.from(publicKey, 'base64url') : null;
  if (!pub || pub.length !== 65 || pub[0] !== 4) return `VAPID_PUBLIC_KEY is not a valid public key (${KEYGEN_HINT})`;
  const priv = B64URL.test(privateKey) ? Buffer.from(privateKey, 'base64url') : null;
  if (!priv || priv.length !== 32) return `VAPID_PRIVATE_KEY is not a valid private key (${KEYGEN_HINT})`;
  try {
    const ecdh = crypto.createECDH('prime256v1');
    ecdh.setPrivateKey(priv);
    if (!ecdh.getPublicKey().equals(pub)) return `VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are not a pair (${KEYGEN_HINT})`;
  } catch {
    return `VAPID_PRIVATE_KEY is not a valid private key (${KEYGEN_HINT})`;
  }
  if (!/^mailto:[^\s@]+@[^\s@]+$/.test(subject) && !/^https:\/\/[^\s/]+/.test(subject)) {
    return 'VAPID_SUBJECT must be a mailto: address or an https:// URL';
  }
  return null;
}

let memo: { input: string; problem: string | null } | null = null;

/** Why phone notifications are disabled, or null when the VAPID configuration is usable. */
export function vapidProblem(): string | null {
  const { vapidPublicKey, vapidPrivateKey, vapidSubject } = config.push;
  const input = `${vapidPublicKey}\n${vapidPrivateKey}\n${vapidSubject}`;
  if (memo?.input !== input) memo = { input, problem: check(vapidPublicKey, vapidPrivateKey, vapidSubject) };
  return memo.problem;
}

export function vapidDetails(): VapidDetails | null {
  if (vapidProblem()) return null;
  return { subject: config.push.vapidSubject, publicKey: config.push.vapidPublicKey, privateKey: config.push.vapidPrivateKey };
}

export const pushEnabled = (): boolean => vapidProblem() === null;

/** Push endpoints must be HTTPS URLs on a known push service (see `config.push.endpointHosts`). */
export function isAllowedEndpoint(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.port !== '' || url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  return config.push.endpointHosts.some((h) => host === h || host.endsWith(`.${h}`));
}

/** Host of an endpoint, for logs (the full endpoint is a per-device secret). */
export function endpointHost(endpoint: string): string {
  try {
    return new URL(endpoint).hostname;
  } catch {
    return 'invalid-endpoint';
  }
}
