/**
 * Shared helpers for server tests: a temporary PGlite directory per test file (migrations run on first getDb()),
 * request builders for calling route handlers directly, and cookie helpers.
 */
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export interface TestEnv {
  dir: string;
  teardown: () => Promise<void>;
}

/** Call at module top level, before anything touches the database. */
export function setupTestEnv(name: string): TestEnv {
  const dir = mkdtempSync(path.join(os.tmpdir(), `disccoach-${name}-`));
  process.env.PGLITE_DATA_DIR = dir;
  process.env.DATABASE_URL = "";
  process.env.SESSION_SECRET = "test-session-secret";
  process.env.ADMIN_EMAILS = "";
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.AI_RATE_LIMIT_PER_HOUR;
  delete process.env.AI_RATE_LIMIT_PER_DAY;
  return {
    dir,
    teardown: async () => {
      const { closeDb } = await import("@/server/db/client");
      await closeDb();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

export interface RequestInit2 {
  method?: string;
  body?: unknown;
  cookie?: string | null;
  headers?: Record<string, string>;
  /** Adds x-dc-client: 1 (default true). */
  csrf?: boolean;
  guest?: string;
}

export function makeRequest(pathname: string, init: RequestInit2 = {}): Request {
  const headers: Record<string, string> = { ...(init.headers ?? {}) };
  if (init.csrf !== false) headers["x-dc-client"] = "1";
  if (init.cookie) headers.cookie = init.cookie;
  if (init.guest) headers["x-dc-guest"] = init.guest;
  if (init.body !== undefined) headers["content-type"] = "application/json";
  return new Request(`http://localhost${pathname}`, {
    method: init.method ?? (init.body !== undefined ? "POST" : "GET"),
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
}

export async function readJson<T = Record<string, unknown>>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

/** `dc_session=<token>` from a Set-Cookie header, or null. */
export function cookieFrom(res: Response): string | null {
  const header = res.headers.get("set-cookie");
  if (!header) return null;
  const first = header.split(";")[0];
  return first.startsWith("dc_session=") ? first : null;
}

export interface TestAccount {
  cookie: string;
  user: { id: string; email: string; role: "user" | "admin" };
}

export async function registerAccount(email: string, password = "correct-horse-battery"): Promise<TestAccount> {
  const { POST } = await import("@/app/api/auth/register/route");
  const res = await POST(makeRequest("/api/auth/register", { body: { email, password } }));
  const body = await readJson<{ ok: boolean; user: TestAccount["user"]; code?: string; message?: string }>(res);
  if (res.status !== 201 || !body.ok) throw new Error(`register failed: ${res.status} ${body.code ?? ""} ${body.message ?? ""}`);
  const cookie = cookieFrom(res);
  if (!cookie) throw new Error("register did not set a cookie");
  return { cookie, user: body.user };
}
