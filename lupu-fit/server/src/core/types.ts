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
  complete(input: { system: string; messages: { role: 'user' | 'assistant'; content: string }[] }): Promise<string>;
  /** Optional: structured meal estimate from a JPEG (base64). */
  describeImage?(input: { system: string; prompt: string; jpegBase64: string }): Promise<string>;
}

export interface Deps {
  db: DbAdapter;
  mode: 'hosted' | 'device';
  clock: () => Date;
  pbkdf2Iterations: number;
  secureCookies: boolean;
  sessionTtlDays: number;
  /** called with the plain reset token so the host can e-mail it; the API never returns it */
  onPasswordReset?: (email: string, token: string) => void | Promise<void>;
  ai?: AiProvider;
  /** e-mails that register as admin (hosted: ADMIN_EMAILS env) */
  adminEmails?: string[];
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
  user: { id: string; email: string; role: 'user' | 'admin' } | null;
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
  body?: ZodType;
  /** default 100 KB */
  maxBodyBytes?: number;
}
export interface Route { method: Method; pattern: string; segs: string[]; handler: Handler; opts: RouteOpts }
