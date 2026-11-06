import type { ZodType } from 'zod';
import type { DbAdapter } from '../db/adapter.ts';

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export interface ApiRequest {
  method: string;
  /** Path without query string, e.g. /api/auth/login */
  path: string;
  query: Record<string, string>;
  /** lower-cased header names */
  headers: Record<string, string>;
  body: unknown;
  ip: string;
  /** size of the raw body in bytes, when the transport knows it */
  bodyBytes?: number;
}
export interface ApiResponse { status: number; body?: unknown; headers?: Record<string, string>; setCookies?: string[] }

export interface AiProvider {
  readonly name: string;
  /** Returns plain text. Implementations must never log prompts. */
  complete(input: { system: string; messages: { role: 'user' | 'assistant'; content: string }[]; /** optional: larger output budget (default ~700 tokens) */ maxTokens?: number; /** optional: ask the model for JSON-only output */ json?: boolean }): Promise<string>;
  /** Optional: structured meal estimate from a JPEG (base64). */
  describeImage?(input: { system: string; prompt: string; jpegBase64: string }): Promise<string>;
}

export interface Deps {
  db: DbAdapter;
  mode: 'hosted' | 'device';
  clock: () => Date;
  pbkdf2Iterations: number;
  secureCookies: boolean;
  /** Release version, written into backup files ("unknown" when the host does not say). */
  appVersion?: string;
  sessionTtlDays: number;
  ai?: AiProvider;
  /**
   * Usernames that hold the admin role (hosted: ADMIN_USERNAMES env). Checked on every request, not only at registration: taking a
   * name out of the list (and redeploying) revokes it, even for an account that already has role 'admin' stored.
   */
  adminUsernames?: string[];
  /** SHA-256 hex of a session token. Hosted: synchronous node:crypto (no libuv thread pool, so a PBKDF2 burst cannot delay it); default WebCrypto. */
  sha256?: (text: string) => string | Promise<string>;
  /** injectable for tests; defaults to global fetch */
  fetch?: typeof fetch;
}

export interface Ctx {
  req: ApiRequest;
  deps: Deps;
  db: DbAdapter;
  params: Record<string, string>;
  body: unknown;
  now: Date;
  user: { id: string; username: string; role: 'user' | 'admin' } | null;
  session: { id: string; csrf: string } | null;
}

export type HandlerResult = ApiResponse | { json: unknown; status?: number; setCookies?: string[]; headers?: Record<string, string> };
export type Handler = (ctx: Ctx) => Promise<HandlerResult>;

export interface RouteOpts {
  /** default true */
  auth?: boolean;
  /** CSRF check on mutating methods; default true when auth */
  csrf?: boolean;
  /** default true: honour Idempotency-Key on mutating calls */
  idempotent?: boolean;
  /**
   * default true: keep the response body for replays of the same Idempotency-Key (the offline outbox replays food log, weights and
   * set calls and needs the answer). false: only the status is kept (a replay answers that status with no body), so private text such
   * as coach chats, the health profile or photo estimates is never copied into the replay table.
   */
  replayBody?: boolean;
  body?: ZodType;
  /** default 100 KB */
  maxBodyBytes?: number;
}
export interface Route { method: Method; pattern: string; segs: string[]; handler: Handler; opts: RouteOpts }
