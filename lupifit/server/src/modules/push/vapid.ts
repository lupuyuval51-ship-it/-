/**
 * VAPID configuration for phone notifications. The key pair comes from the environment
 * (`VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`, which always win) or, when those are not set, from the
 * pair the server created for itself and keeps in `server_settings` (`loadVapidKeys`, called once
 * at startup; `PUSH_AUTO_VAPID=false` turns this off). The subject is `VAPID_SUBJECT` or else the
 * app's own https URL. Push is enabled only when keys and subject are present and valid; otherwise
 * it is disabled cleanly (never a crash). Messages name the variables but never include key values.
 */
import crypto from 'node:crypto';
import webpush from 'web-push';
import { config } from '../../config';
import type { Sql } from '../../db/pool';

export interface VapidDetails {
  subject: string;
  publicKey: string;
  privateKey: string;
}

/** Where the key pair in use comes from. */
export type VapidSource = 'env' | 'database' | 'none';

const B64URL = /^[A-Za-z0-9_-]+$/;
const KEYGEN_HINT = 'generate a pair with `npx web-push generate-vapid-keys`';

/** The pair loaded from `server_settings` by `loadVapidKeys` (null until then, or when not used). */
let stored: { publicKey: string; privateKey: string } | null = null;

const envKeysSet = () => config.push.vapidPublicKey !== '' || config.push.vapidPrivateKey !== '';

function currentKeys(): { publicKey: string; privateKey: string; source: VapidSource } {
  // Any key in the environment means "use the environment" (a half-set pair is reported, not replaced).
  if (envKeysSet()) return { publicKey: config.push.vapidPublicKey, privateKey: config.push.vapidPrivateKey, source: 'env' };
  if (stored) return { ...stored, source: 'database' };
  return { publicKey: '', privateKey: '', source: 'none' };
}

/** `VAPID_SUBJECT`, or the origin of the app URL when it is https (e.g. https://lupu-fit.onrender.com). */
export function vapidSubject(): string {
  if (config.push.vapidSubject) return config.push.vapidSubject;
  try {
    const url = new URL(config.appUrl);
    return url.protocol === 'https:' ? url.origin : '';
  } catch {
    return '';
  }
}

function check(publicKey: string, privateKey: string, subject: string, source: VapidSource): string | null {
  const [pubName, privName] = source === 'database' ? ['stored VAPID public key', 'stored VAPID private key'] : ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY'];
  const missing = [!publicKey && pubName, !privateKey && privName, !subject && 'VAPID_SUBJECT'].filter(Boolean);
  if (missing.length) {
    const why = !subject ? ' (and APP_URL is not an https:// URL)' : source === 'none' && !config.push.autoVapid ? ' (PUSH_AUTO_VAPID=false)' : '';
    return `${missing.join(', ')} not set${why}`;
  }
  const hint = source === 'env' ? ` (${KEYGEN_HINT})` : '';
  const pub = B64URL.test(publicKey) ? Buffer.from(publicKey, 'base64url') : null;
  if (!pub || pub.length !== 65 || pub[0] !== 4) return `${pubName} is not a valid public key${hint}`;
  const priv = B64URL.test(privateKey) ? Buffer.from(privateKey, 'base64url') : null;
  if (!priv || priv.length !== 32) return `${privName} is not a valid private key${hint}`;
  try {
    const ecdh = crypto.createECDH('prime256v1');
    ecdh.setPrivateKey(priv);
    if (!ecdh.getPublicKey().equals(pub)) return `${pubName} does not match ${privName}${hint}`;
  } catch {
    return `${privName} is not a valid private key${hint}`;
  }
  if (!/^mailto:[^\s@]+@[^\s@]+$/.test(subject) && !/^https:\/\/[^\s/]+/.test(subject)) {
    return 'VAPID_SUBJECT must be a mailto: address or an https:// URL';
  }
  return null;
}

let memo: { input: string; problem: string | null } | null = null;

/** Why phone notifications are disabled, or null when the VAPID configuration is usable. */
export function vapidProblem(): string | null {
  const { publicKey, privateKey, source } = currentKeys();
  const subject = vapidSubject();
  const input = `${source}\n${publicKey}\n${privateKey}\n${subject}\n${config.push.autoVapid}`;
  if (memo?.input !== input) memo = { input, problem: check(publicKey, privateKey, subject, source) };
  return memo.problem;
}

export function vapidDetails(): VapidDetails | null {
  if (vapidProblem()) return null;
  const { publicKey, privateKey } = currentKeys();
  return { subject: vapidSubject(), publicKey, privateKey };
}

export const pushEnabled = (): boolean => vapidProblem() === null;

/**
 * The key pair kept in `server_settings`, created on first use. Safe when several instances start
 * at once: only the first insert stores its pair and everyone reads that one back.
 */
export async function storedVapidKeys(sql: Sql): Promise<{ publicKey: string; privateKey: string; created: boolean }> {
  type Row = { vapid_public_key: string | null; vapid_private_key: string | null };
  const read = () => sql.maybeOne<Row>('SELECT vapid_public_key, vapid_private_key FROM server_settings WHERE id');
  const existing = await read();
  if (existing?.vapid_public_key && existing.vapid_private_key) {
    return { publicKey: existing.vapid_public_key, privateKey: existing.vapid_private_key, created: false };
  }
  const fresh = webpush.generateVAPIDKeys();
  await sql.exec(
    `INSERT INTO server_settings (id, vapid_public_key, vapid_private_key) VALUES (true, $1, $2)
     ON CONFLICT (id) DO UPDATE SET vapid_public_key = EXCLUDED.vapid_public_key, vapid_private_key = EXCLUDED.vapid_private_key
       WHERE server_settings.vapid_public_key IS NULL`,
    [fresh.publicKey, fresh.privateKey],
  );
  const row = await read();
  if (!row?.vapid_public_key || !row.vapid_private_key) throw new Error('server_settings has no VAPID key pair after insert');
  return { publicKey: row.vapid_public_key, privateKey: row.vapid_private_key, created: row.vapid_public_key === fresh.publicKey };
}

export interface VapidLoadResult {
  source: VapidSource;
  /** True when this start created the stored pair. */
  created: boolean;
  /** Why the stored pair could not be used (database error); never contains key material. */
  error?: string;
}

/**
 * Startup step (after migrations): decides which key pair push uses. Environment keys win and the
 * database is not touched. Otherwise, unless `PUSH_AUTO_VAPID=false`, the stored pair is loaded or
 * created. Never throws: a database problem only leaves phone notifications off.
 */
export async function loadVapidKeys(sql: Sql): Promise<VapidLoadResult> {
  stored = null;
  if (envKeysSet()) return { source: 'env', created: false };
  if (!config.push.autoVapid) return { source: 'none', created: false };
  try {
    const { publicKey, privateKey, created } = await storedVapidKeys(sql);
    stored = { publicKey, privateKey };
    return { source: 'database', created };
  } catch (err) {
    return { source: 'none', created: false, error: (err as Error).message };
  }
}

/** Forgets the stored pair loaded at startup (tests). */
export function clearStoredVapidKeys(): void {
  stored = null;
}

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
