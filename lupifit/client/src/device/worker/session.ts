/**
 * The hidden device account. In device mode nobody signs in: on first launch the worker creates an
 * account through the server's own register route (random email and password, never shown, never typed),
 * keeps its session cookie and CSRF token, and attaches them to every request the page makes. The page
 * never sees the cookie (Set-Cookie is absorbed here) and never sees the password.
 *
 * - The credentials live only in the worker's own storage (the `device.account` row inside the PGlite
 *   database in IndexedDB, see ./account-store.ts); never in localStorage. Being in the same database
 *   as the data means they can never get out of step with it (both survive, or neither does).
 * - The credentials are saved before the account is registered, so a crash in between is recovered on
 *   the next start: the login fails, the same credentials are registered.
 * - A request whose session is gone (401, or the server clearing the cookie) signs in again once and is
 *   retried. Nothing ran for it: the session is checked before any handler.
 * - Routes that only make sense for a person with a password (login, register, password change and reset,
 *   sign out everywhere) answer `not_available_on_device`; sign-out is a no-op (the device stays signed in).
 *   Account deletion gets the device password added here, so the UI never asks for one; afterwards the
 *   next request creates a fresh device account.
 */
import type { DispatchRequest, DispatchResponse } from '../shims/express';

export interface StoredAccount {
  email: string;
  password: string;
  /** `fitai_session=<token>` (null: sign in on the next request). */
  cookie: string | null;
}

export interface AccountStore {
  load(): Promise<StoredAccount | null>;
  save(account: StoredAccount): Promise<void>;
  clear(): Promise<void>;
}

export interface AccountProfile {
  locale: 'he' | 'en';
  timezone: string;
  displayName: string;
}

export interface PageRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
}

export type Send = (request: DispatchRequest) => Promise<DispatchResponse>;

export interface DeviceSessionOptions {
  send: Send;
  store: AccountStore;
  /** What the account is created with (asked when it is needed). */
  profile: () => AccountProfile;
  /** Random values (Web Crypto in the worker). */
  randomUUID: () => string;
  randomBytes: (n: number) => Uint8Array;
  cookieName?: string;
}

const USER_AGENT = 'LUPU-FIT device';
export const DEVICE_EMAIL_DOMAIN = 'device.lupufit';

/** Paths the page may not call in device mode (there is no password to type). */
const UNAVAILABLE = new Set([
  'POST /api/auth/login',
  'POST /api/auth/register',
  'POST /api/auth/logout-all',
  'POST /api/auth/password',
  'POST /api/auth/password-reset/request',
  'POST /api/auth/password-reset/confirm',
]);
const SIGN_OUT = 'POST /api/auth/logout';
const DELETE_ACCOUNT = 'DELETE /api/account';
/** Headers the page cannot set: the worker owns the session. */
const OWNED_HEADERS = new Set(['cookie', 'x-csrf-token', 'origin', 'host', 'user-agent', 'content-length']);

const base64url = (bytes: Uint8Array) => {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/** A long random password; the server's password rules want a letter and a digit. */
export function newDeviceAccount(randomUUID: () => string, randomBytes: (n: number) => Uint8Array): StoredAccount {
  return { email: `device-${randomUUID()}@${DEVICE_EMAIL_DOMAIN}`, password: `${base64url(randomBytes(32))}a1`, cookie: null };
}

function jsonResponse(status: number, body: unknown): DispatchResponse {
  return { status, headers: [['content-type', 'application/json; charset=utf-8'], ['cache-control', 'no-store']], body: JSON.stringify(body) };
}

const pathOf = (url: string) => {
  const q = url.indexOf('?');
  return q < 0 ? url : url.slice(0, q);
};

const bodyText = (res: DispatchResponse) => (typeof res.body === 'string' ? res.body : res.body ? new TextDecoder().decode(res.body) : '');

function parseJson(text: string): unknown {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

const errorCode = (res: DispatchResponse) => (parseJson(bodyText(res)) as { error?: { code?: string } } | null)?.error?.code;

export class DeviceSessionError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | undefined,
  ) {
    super(message);
    this.name = 'DeviceSessionError';
  }
}

export class DeviceSession {
  #account: StoredAccount | null = null;
  #loaded = false;
  #csrf: string | null = null;
  readonly #cookieName: string;

  constructor(private readonly options: DeviceSessionOptions) {
    this.#cookieName = options.cookieName ?? 'fitai_session';
  }

  /** The device account's id after `ensure()` (for tests and logs: never the email or password). */
  userId: string | null = null;

  /** Makes sure there is a signed-in device account (creates it on first launch). */
  async ensure(): Promise<void> {
    if (!this.#loaded) {
      this.#account = await this.options.store.load();
      this.#loaded = true;
    }
    if (this.#account?.cookie && this.#csrf) return;
    if (this.#account?.cookie) {
      // A stored session from the last launch: check it and pick up its CSRF token.
      const me = await this.#send({ method: 'GET', url: '/api/auth/me', headers: {}, body: null });
      const body = parseJson(bodyText(me)) as { user?: { id: string } | null; csrfToken?: string | null } | null;
      if (me.status === 200 && body?.user && body.csrfToken && this.#account.cookie) {
        this.#csrf = body.csrfToken;
        this.userId = body.user.id;
        return;
      }
      await this.#setCookie(null);
    }
    await this.#signIn();
  }

  async #signIn(): Promise<void> {
    if (!this.#account) {
      this.#account = newDeviceAccount(this.options.randomUUID, this.options.randomBytes);
      await this.options.store.save(this.#account);
      await this.#register();
      return;
    }
    const { email, password } = this.#account;
    const login = await this.#send({ method: 'POST', url: '/api/auth/login', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) });
    if (login.status === 200) return this.#adopt(login);
    if (login.status === 401 && errorCode(login) === 'invalid_credentials') return this.#register();
    throw new DeviceSessionError(`device sign-in failed (${login.status})`, login.status, errorCode(login));
  }

  async #register(): Promise<void> {
    const account = this.#account!;
    const profile = this.options.profile();
    const res = await this.#send({
      method: 'POST',
      url: '/api/auth/register',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: account.email, password: account.password, displayName: profile.displayName, locale: profile.locale, timezone: profile.timezone }),
    });
    if (res.status === 201) return this.#adopt(res);
    if (res.status === 409 && errorCode(res) === 'email_taken') {
      // The stored password does not match the stored account (never expected): start a new account.
      this.#account = newDeviceAccount(this.options.randomUUID, this.options.randomBytes);
      await this.options.store.save(this.#account);
      return this.#register();
    }
    throw new DeviceSessionError(`device account could not be created (${res.status})`, res.status, errorCode(res));
  }

  async #adopt(res: DispatchResponse): Promise<void> {
    const body = parseJson(bodyText(res)) as { user?: { id: string }; csrfToken?: string } | null;
    if (!this.#account?.cookie || !body?.csrfToken) throw new DeviceSessionError('the server did not start a session', res.status, undefined);
    this.#csrf = body.csrfToken;
    this.userId = body.user?.id ?? null;
  }

  async #setCookie(cookie: string | null): Promise<void> {
    if (!this.#account || this.#account.cookie === cookie) return;
    this.#account = { ...this.#account, cookie };
    if (!cookie) this.#csrf = null;
    await this.options.store.save(this.#account);
  }

  /** Sends a request with the device session and absorbs Set-Cookie (the page never gets the cookie). */
  async #send(request: PageRequest): Promise<DispatchResponse> {
    const headers: Record<string, string> = { accept: 'application/json' };
    for (const [k, v] of Object.entries(request.headers)) if (!OWNED_HEADERS.has(k.toLowerCase())) headers[k.toLowerCase()] = v;
    headers['user-agent'] = USER_AGENT;
    if (this.#account?.cookie) headers.cookie = this.#account.cookie;
    if (request.method !== 'GET' && request.method !== 'HEAD' && this.#csrf) headers['x-csrf-token'] = this.#csrf;
    const res = await this.options.send({ method: request.method, url: request.url, headers, body: request.body });
    const kept: [string, string][] = [];
    for (const [name, value] of res.headers) {
      if (name.toLowerCase() !== 'set-cookie') {
        kept.push([name, value]);
        continue;
      }
      const [pair = '', ...attrs] = value.split(';').map((s) => s.trim());
      const eq = pair.indexOf('=');
      if (eq < 0 || pair.slice(0, eq) !== this.#cookieName) continue;
      const expires = attrs.find((a) => a.toLowerCase().startsWith('expires='));
      const maxAge = attrs.find((a) => a.toLowerCase().startsWith('max-age='));
      const gone = eq === pair.length - 1 || (maxAge && Number(maxAge.slice(8)) <= 0) || (expires && Date.parse(expires.slice(8)) <= Date.now());
      await this.#setCookie(gone ? null : pair);
    }
    return { ...res, headers: kept };
  }

  /** Handles one request from the page (the caller runs them one at a time). */
  async handle(request: PageRequest): Promise<DispatchResponse> {
    const route = `${request.method.toUpperCase()} ${pathOf(request.url)}`;
    if (UNAVAILABLE.has(route)) {
      return jsonResponse(404, { error: { code: 'not_available_on_device', message: 'Not available in the on-device app' } });
    }
    if (route === SIGN_OUT) return jsonResponse(200, { ok: true });
    await this.ensure();
    const deleting = route === DELETE_ACCOUNT;
    let attempt = 0;
    for (;;) {
      const sent = deleting ? { ...request, body: this.#withPassword(request.body) } : request;
      const res = await this.#send(sent);
      const lost = res.status === 401 || !this.#account?.cookie;
      if (deleting && res.status === 200) {
        // The account and its data are gone; the next request creates a new device account.
        await this.options.store.clear();
        this.#account = null;
        this.#csrf = null;
        this.userId = null;
        return res;
      }
      if (!lost || attempt > 0) return res;
      attempt++;
      await this.#setCookie(null);
      await this.ensure();
    }
  }

  #withPassword(body: string | null): string {
    const parsed = (parseJson(body ?? '') as Record<string, unknown> | null) ?? {};
    return JSON.stringify({ ...parsed, password: this.#account?.password ?? '' });
  }
}
